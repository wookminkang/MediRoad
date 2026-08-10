/**
 * GEO 브리핑 사실 주입 — 큐에서 다음 발행 대상을 고르고, 원고가 쓸 병원 사실을 DB에서 뽑는다.
 *
 * 원고 생성(claude -p)은 이 스크립트가 출력한 데이터 **밖의 병원명·주소·수치를 쓸 수 없다**
 * (환각 차단 — 검증은 seed-geo-briefing.cjs가 facts 파일과 대조).
 *
 * 선택 규칙: queue.json 순서대로 훑어 columns에 status='published' 행이 없는 첫 항목.
 * draft만 있는 항목은 "미발행"으로 취급해 다음 날 재시도된다. 큐 파일은 절대 수정하지 않는다.
 *
 * 실행: node --env-file=.env --import tsx scripts/geo-briefing-facts.mts [--id <큐id>] [--date YYYY-MM-DD]
 *  - stdout: 프롬프트 주입용 JSON 한 덩어리 (로그는 전부 stderr)
 *  - 부수 출력: content/geo-briefings/out/{date}-{id}.facts.json (검증 게이트가 대조에 쓴다)
 *  - 큐 소진 시 exit 3 (배치가 "오늘은 할 일 없음"으로 구분)
 */
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("env 미설정 (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

type QueueItem = {
  id: string;
  query: string;
  hpid: string;
  hospitalSlug: string;
  region: { sido: string; sigungu: string | null };
  landmarkHpid: string | null;
  landmarkLabel: string | null;
  hospitalType: string;
  hubLinks: string[];
  areaLink: string | null;
  angle: string;
};

const argv = process.argv.slice(2);
function argValue(flag: string): string | null {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
}
const forcedId = argValue("--id");
const date = argValue("--date") ?? new Date().toISOString().slice(0, 10);

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const queue = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content/geo-briefings/queue.json"), "utf8"),
) as { items: QueueItem[] };

// ── 내부링크 사전 검증: 허브·지역 링크가 실존하는 라우트인지 큐 단계에서 잡는다 ──
const guidesSrc = fs.readFileSync(
  path.join(ROOT, "src/constants/hospital-keyword-pages.ts"),
  "utf8",
);
const validHubUrls = new Set<string>();
{
  // { hospitalSlug: "...", keyword: "..." } 쌍을 소스에서 추출 (guideSlug: 공백→하이픈)
  const re = /hospitalSlug:\s*"([^"]+)",\s*keyword:\s*"([^"]+)"/g;
  for (const m of guidesSrc.matchAll(re)) {
    validHubUrls.add(`/${m[1]}/guide/${m[2].trim().replace(/\s+/g, "-")}`);
  }
}
const areaSrc = fs.readFileSync(path.join(ROOT, "src/constants/area-regions.ts"), "utf8");
const validAreaSlugs = new Set(
  [...areaSrc.matchAll(/"slug":\s*"([^"]+)"/g)].map((m) => m[1]),
);

function assertLinksValid(item: QueueItem) {
  for (const hub of item.hubLinks) {
    if (!validHubUrls.has(hub)) {
      console.error(`큐 항목 ${item.id}: 허브 링크가 실존하지 않음 — ${hub}`);
      process.exit(1);
    }
  }
  if (item.areaLink) {
    const slug = decodeURIComponent(item.areaLink.replace(/^\/area\//, ""));
    if (!validAreaSlugs.has(slug)) {
      console.error(`큐 항목 ${item.id}: 지역 링크가 실존하지 않음 — ${item.areaLink}`);
      process.exit(1);
    }
  }
}

// ── 다음 발행 대상 선택 ──
async function pickNext(): Promise<QueueItem | null> {
  if (forcedId) {
    const item = queue.items.find((q) => q.id === forcedId);
    if (!item) {
      console.error(`큐에 없는 id: ${forcedId}`);
      process.exit(1);
    }
    return item;
  }
  const ids = queue.items.map((q) => q.id);
  const { data, error } = await sb
    .from("columns")
    .select("id")
    .in("id", ids)
    .eq("status", "published");
  if (error) throw new Error(error.message);
  const published = new Set((data ?? []).map((r) => r.id));
  return queue.items.find((q) => !published.has(q.id)) ?? null;
}

const HOSPITAL_COLS =
  "id,name,slug,type,sido,sigungu,emdong,address,phone,beds,homepage_url,lat,lng,station_name,station_line,station_distance_m";

type HospitalRow = {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  sido: string;
  sigungu: string;
  emdong: string | null;
  address: string;
  phone: string | null;
  beds: number | null;
  homepage_url: string | null;
  lat: number;
  lng: number;
  station_name: string | null;
  station_line: string | null;
  station_distance_m: number | null;
};

function km(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(s));
}

/**
 * 비교표용 병원 목록.
 * '요양병원'은 E-Gen type에 없어서(전부 type='병원') 이름 패턴으로 찾는다.
 * 그 외(한방병원·한의원 등)는 type 컬럼 일치.
 */
async function comparisonHospitals(item: QueueItem, landmark: HospitalRow | null) {
  let q = sb.from("hospitals").select(HOSPITAL_COLS).eq("sido", item.region.sido);
  if (item.hospitalType === "요양병원") q = q.ilike("name", "%요양병원%");
  else q = q.eq("type", item.hospitalType);
  if (!landmark && item.region.sigungu) q = q.eq("sigungu", item.region.sigungu);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as HospitalRow[];

  if (landmark) {
    // 랜드마크(대형병원) 좌표 기준 가까운 순
    rows = rows
      .map((h) => ({ ...h, distance_km: Math.round(km(landmark.lat, landmark.lng, h.lat, h.lng) * 10) / 10 }))
      .sort((a, b) => (a as HospitalRow & { distance_km: number }).distance_km - (b as HospitalRow & { distance_km: number }).distance_km)
      .slice(0, 8);
  } else {
    // 병상 규모순 — 광역(시군구 없음)이면 조금 더 넉넉히
    rows = rows
      .sort((a, b) => (b.beds ?? 0) - (a.beds ?? 0))
      .slice(0, item.region.sigungu ? 8 : 10);
  }
  return rows;
}

const item = await pickNext();
if (!item) {
  console.error("큐 소진 — 모든 항목이 발행됨. queue.json에 새 키워드를 추가하세요.");
  process.exit(3);
}
assertLinksValid(item);

const { data: mainRows, error: mainErr } = await sb
  .from("hospitals")
  .select(HOSPITAL_COLS)
  .eq("id", item.hpid);
if (mainErr) throw new Error(mainErr.message);
const main = (mainRows ?? [])[0] as HospitalRow | undefined;
if (!main) {
  console.error(`중심 병원(hpid=${item.hpid})이 DB에 없음`);
  process.exit(1);
}

const { data: depts } = await sb
  .from("hospital_departments")
  .select("name")
  .eq("hospital_id", item.hpid);

let landmark: HospitalRow | null = null;
if (item.landmarkHpid) {
  const { data: lm } = await sb.from("hospitals").select(HOSPITAL_COLS).eq("id", item.landmarkHpid);
  landmark = ((lm ?? [])[0] as HospitalRow) ?? null;
  if (!landmark) {
    console.error(`랜드마크 병원(hpid=${item.landmarkHpid})이 DB에 없음`);
    process.exit(1);
  }
}

const comparisons = await comparisonHospitals(item, landmark);

// 기존 브리핑 제목 — 중복 방지 컨텍스트 (draft 포함)
const { data: existing } = await sb
  .from("columns")
  .select("id,title,status")
  .eq("kind", "briefing")
  .order("created_at", { ascending: false });

const mainDistanceKm = landmark
  ? Math.round(km(landmark.lat, landmark.lng, main.lat, main.lng) * 10) / 10
  : null;

const facts = {
  date,
  queueItem: item,
  // 중심 병원이 원고 지역 밖이면 프롬프트가 "소재지 명시" 규칙을 켠다
  mainOutsideRegion: item.region.sigungu !== null && main.sigungu !== item.region.sigungu,
  mainHospital: {
    ...main,
    departments: (depts ?? []).map((d) => d.name),
    detailUrl: `/hospitals/${main.slug}`,
    distanceFromLandmarkKm: mainDistanceKm,
  },
  landmark: landmark
    ? { name: landmark.name, label: item.landmarkLabel, sigungu: landmark.sigungu, address: landmark.address }
    : null,
  comparisonHospitals: comparisons,
  existingBriefingTitles: (existing ?? []).map((r) => `${r.title} [${r.status}]`),
};

const outDir = path.join(ROOT, "content/geo-briefings/out");
fs.mkdirSync(outDir, { recursive: true });
const factsPath = path.join(outDir, `${date}-${item.id}.facts.json`);
fs.writeFileSync(factsPath, JSON.stringify(facts, null, 2));
console.error(`facts 저장 — ${factsPath}`);
console.error(`대상: ${item.id} (${item.query}) / 비교 병원 ${comparisons.length}곳`);

console.log(JSON.stringify(facts, null, 2));
