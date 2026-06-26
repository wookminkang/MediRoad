/**
 * E-Gen(국립중앙의료원) 전국 병의원 → Supabase hospitals 동기화.
 *   - 시도별로 목록 API 페이지네이션 → 핵심정보 + 진료시간 upsert
 *   - 편집 컬럼(description·station 등)은 건드리지 않음(merge upsert)
 *   - 진료과목(dgidIdName)은 상세 API라 별도 enrich 단계에서 처리
 * 실행: node --env-file=.env.local --import tsx scripts/sync-hospitals.mts
 *   (먼저 supabase/migrations/0002_hospitals.sql 적용)
 */
import { createClient } from "@supabase/supabase-js";

const ENDPOINT = process.env.EGEN_API_ENDPOINT!;
const KEY = encodeURIComponent(process.env.EGEN_SERVICE_KEY!); // Base64 키(+/=) URL 인코딩
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!ENDPOINT || !KEY || !SB_URL || !SB_KEY) {
  console.error("env 미설정: EGEN_API_ENDPOINT/EGEN_SERVICE_KEY/SUPABASE_*");
  process.exit(1);
}
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });

const PAGE_SIZE = 1000;
// E-Gen Q0(시도) 질의값 — 개편 전후 명칭 모두 시도(중복은 upsert로 흡수)
const SIDO_QUERIES = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도",
  "강원특별자치도", "강원도", "충청북도", "충청남도",
  "전북특별자치도", "전라북도", "전라남도", "경상북도", "경상남도",
  "제주특별자치도",
];

const SIDO_SHORT: Record<string, string> = {
  서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구", 인천광역시: "인천",
  광주광역시: "광주", 대전광역시: "대전", 울산광역시: "울산", 세종특별자치시: "세종",
  경기도: "경기", 강원특별자치도: "강원", 강원도: "강원", 충청북도: "충북",
  충청남도: "충남", 전북특별자치도: "전북", 전라북도: "전북", 전라남도: "전남",
  경상북도: "경북", 경상남도: "경남", 제주특별자치도: "제주", 제주도: "제주",
};

function shortSido(rawFirstToken: string): string {
  return SIDO_SHORT[rawFirstToken] ?? rawFirstToken;
}

/** dutyDivNam → HospitalType */
function toType(div: string): string {
  if (!div) return "의원";
  if (div.includes("치과")) return "치과";
  if (div.includes("한방")) return "한방병원";
  if (div.includes("한의")) return "한의원";
  if (div.includes("약국")) return "약국";
  if (div.includes("병원")) return "병원";
  return "의원";
}

/** "서울특별시 강남구 ..." → {sido, sigungu, emdong} */
function parseRegion(addr: string) {
  const t = (addr ?? "").split(/\s+/);
  const sido = shortSido(t[0] ?? "");
  const sigungu = t[1] && /[시군구]$/.test(t[1]) ? t[1] : "";
  const emdong = t[2] && /[동읍면리]$/.test(t[2]) ? t[2] : undefined;
  return { sido, sigungu, emdong };
}

type Item = Record<string, string | number | undefined>;

async function fetchPage(q0: string, pageNo: number): Promise<{ items: Item[]; total: number }> {
  const url = `${ENDPOINT}/getHsptlMdcncListInfoInqire?serviceKey=${KEY}&Q0=${encodeURIComponent(q0)}&numOfRows=${PAGE_SIZE}&pageNo=${pageNo}&_type=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  const body = json?.response?.body;
  const raw = body?.items?.item;
  const items: Item[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return { items, total: Number(body?.totalCount ?? 0) };
}

function toRow(it: Item) {
  const addr = String(it.dutyAddr ?? "");
  const { sido, sigungu, emdong } = parseRegion(addr);
  const post = `${it.postCdn1 ?? ""}${String(it.postCdn2 ?? "").trim()}`.trim();
  return {
    id: String(it.hpid),
    name: String(it.dutyName ?? "").trim(),
    type: toType(String(it.dutyDivNam ?? "")),
    sido,
    sigungu,
    emdong: emdong ?? null,
    address: addr,
    postal_code: post || null,
    phone: it.dutyTel1 ? String(it.dutyTel1) : null,
    lat: it.wgs84Lat != null ? Number(it.wgs84Lat) : null,
    lng: it.wgs84Lon != null ? Number(it.wgs84Lon) : null,
    er_available: String(it.dutyEryn ?? "") === "1",
    directions: it.dutyMapimg ? String(it.dutyMapimg) : null,
    note: it.dutyEtc ? String(it.dutyEtc) : null,
    synced_at: new Date().toISOString(),
  };
}

function toHours(it: Item, hospitalId: string) {
  const rows: { hospital_id: string; day: number; open: string | null; close: string | null; closed: boolean }[] = [];
  for (let d = 1; d <= 8; d++) {
    const s = it[`dutyTime${d}s`];
    const c = it[`dutyTime${d}c`];
    if (s && c) {
      rows.push({ hospital_id: hospitalId, day: d, open: String(s), close: String(c), closed: false });
    }
  }
  return rows;
}

async function chunkedUpsert(table: string, rows: object[], onConflict: string) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + 500), { onConflict });
    if (error) throw error;
  }
}

// --- 실행 ---
let totalSynced = 0;
const seen = new Set<string>();

for (const q0 of SIDO_QUERIES) {
  let pageNo = 1;
  let total = Infinity;
  let regionCount = 0;
  while ((pageNo - 1) * PAGE_SIZE < total) {
    let page;
    try {
      page = await fetchPage(q0, pageNo);
    } catch (e) {
      console.error(`  ✗ ${q0} p${pageNo}: ${(e as Error).message}`);
      break;
    }
    total = page.total;
    if (page.items.length === 0) break;

    const fresh = page.items.filter((it) => it.hpid && !seen.has(String(it.hpid)));
    fresh.forEach((it) => seen.add(String(it.hpid)));

    const rows = fresh.map(toRow).filter((r) => r.name);
    const hours = fresh.flatMap((it) => toHours(it, String(it.hpid)));

    if (rows.length) {
      await chunkedUpsert("hospitals", rows, "id");
      if (hours.length) await chunkedUpsert("hospital_hours", hours, "hospital_id,day");
      regionCount += rows.length;
      totalSynced += rows.length;
    }
    pageNo++;
  }
  if (regionCount) console.log(`✓ ${q0}: ${regionCount}곳 (누적 ${totalSynced})`);
}

console.log(`\n동기화 완료: 총 ${totalSynced}곳`);
