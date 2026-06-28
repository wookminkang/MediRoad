/**
 * 병원 진료과목 enrich — E-Gen 상세 API(dgidIdName) → hospital_departments.
 * 재실행 가능: 이미 진료과목이 있는 병원은 건너뜀(이어서 진행 → quota 분할 가능).
 * 실행: node --env-file=.env.local --import tsx scripts/enrich-departments.mts [최대처리수]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const EP = process.env.EGEN_API_ENDPOINT!;
// 여러 인증키 로테이션: EGEN_SERVICE_KEYS(콤마 구분) 우선, 없으면 EGEN_SERVICE_KEY
const KEYS = (process.env.EGEN_SERVICE_KEYS ?? process.env.EGEN_SERVICE_KEY ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((k) => encodeURIComponent(k)); // Base64 키(+/=) URL 인코딩
if (!KEYS.length) throw new Error("EGEN_SERVICE_KEYS(또는 EGEN_SERVICE_KEY) 미설정");
let keyIdx = 0;
const rotateKey = () => ++keyIdx < KEYS.length; // 다음 키로, 더 없으면 false
class QuotaError extends Error {}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const MAX = process.argv[2] ? Number(process.argv[2]) : Infinity;
const PAGE = 25; // 중복체크(hospital_departments .in) 결과가 1000행 캡에 안 걸리도록 작게
const CONCURRENCY = 4; // 너무 높으면 throttle
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 상세 조회 → 진료과목. throttle/일시오류 시 재시도(최대 4회). 끝까지 실패하면 throw(=일일한도). */
async function getDepts(hpid: string, attempt = 0): Promise<string[]> {
  const u = `${EP}/getHsptlBassInfoInqire?serviceKey=${KEYS[keyIdx]}&HPID=${encodeURIComponent(hpid)}&_type=json`;
  let txt: string;
  try {
    const res = await fetch(u);
    txt = await res.text();
  } catch (e) {
    // 네트워크 일시 오류(fetch failed 등)도 재시도
    if (attempt < 4) {
      await sleep(1000 * (attempt + 1));
      return getDepts(hpid, attempt + 1);
    }
    throw e;
  }
  // 일일 한도/미등록 키 → 재시도 말고 즉시 키 전환 신호
  if (/quota exceeded|LIMITED_NUMBER_OF_SERVICE|SERVICE_KEY_IS_NOT_REGISTERED|등록되지\s*않은/i.test(txt)) {
    throw new QuotaError(txt.slice(0, 60));
  }
  let j: { response?: { header?: { resultCode?: string }; body?: { items?: { item?: unknown } } } };
  try {
    j = JSON.parse(txt);
  } catch {
    if (attempt < 4) {
      await sleep(800 * (attempt + 1));
      return getDepts(hpid, attempt + 1);
    }
    throw new Error(`반복 실패(비JSON): ${txt.slice(0, 40)}`);
  }
  const code = j?.response?.header?.resultCode;
  if (code === "22" || code === "30") throw new QuotaError(`code ${code}`); // 한도초과/미등록키
  if (code !== "00") {
    if (attempt < 4) {
      await sleep(800 * (attempt + 1));
      return getDepts(hpid, attempt + 1);
    }
    throw new Error(`API ${code}`);
  }
  const it = j?.response?.body?.items?.item as { dgidIdName?: string } | { dgidIdName?: string }[] | undefined;
  const d = (Array.isArray(it) ? it[0] : it)?.dgidIdName;
  return d ? String(d).split(",").map((s) => s.trim()).filter(Boolean) : [];
}

async function upsertDepts(rows: { hospital_id: string; name: string }[]) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("hospital_departments").upsert(rows.slice(i, i + 500), { onConflict: "hospital_id,name" });
    if (error) throw error;
  }
}

// 재개 커서 — 마지막 처리 위치(id)를 파일에 저장해, 다음 실행 때 재훑기 생략
const CURSOR = new URL("./.enrich-cursor", import.meta.url);
let after = existsSync(CURSOR) ? readFileSync(CURSOR, "utf8").trim() : "";
if (after) console.log(`커서 재개: id > ${after}`);
let processed = 0;
let enriched = 0;
let deptRows = 0;

try {
  while (processed < MAX) {
    const { data: hs, error } = await sb
      .from("hospitals")
      .select("id")
      .gt("id", after)
      .order("id")
      .limit(PAGE);
    if (error) throw error;
    if (!hs?.length) {
      writeFileSync(CURSOR, ""); // 끝까지 완료 → 커서 리셋(다음 실행은 처음부터 재점검)
      console.log("모든 병원 스캔 완료 — 커서 리셋");
      break;
    }

    const ids = hs.map((h) => h.id);
    after = ids[ids.length - 1];
    writeFileSync(CURSOR, after); // 진행 위치 저장

    // 이미 진료과목 있는 병원 제외
    const { data: ex } = await sb.from("hospital_departments").select("hospital_id").in("hospital_id", ids);
    const has = new Set((ex ?? []).map((e) => e.hospital_id));
    const pending = ids.filter((id) => !has.has(id)).slice(0, MAX - processed);

    const rows: { hospital_id: string; name: string }[] = [];
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      const chunk = pending.slice(i, i + CONCURRENCY);
      // 키 한도 초과 시 다음 키로 전환 후 같은 청크 재시도, 모든 키 소진 시 중단
      while (true) {
        try {
          const res = await Promise.all(
            chunk.map(async (id) => (await getDepts(id)).map((name) => ({ hospital_id: id, name }))),
          );
          res.forEach((r) => rows.push(...r));
          break;
        } catch (e) {
          if (e instanceof QuotaError) {
            if (rotateKey()) {
              console.log(`키 #${keyIdx}/${KEYS.length} 한도 → 키 #${keyIdx + 1}로 전환`);
              continue;
            }
            throw new Error("모든 인증키 일일 한도 소진");
          }
          throw e;
        }
      }
      await sleep(120); // throttle 회피
    }
    if (rows.length) await upsertDepts(rows);

    processed += pending.length;
    enriched += pending.filter((id) => rows.some((r) => r.hospital_id === id)).length;
    deptRows += rows.length;
    console.log(`처리 ${processed} (이번 배치 ${pending.length}곳, 과목행 +${rows.length})`);
  }
  console.log(`\n완료: ${processed}곳 처리, 진료과목 보유 ${enriched}곳, 총 과목행 ${deptRows}`);
} catch (e) {
  console.error(`\n중단(quota/에러): ${(e as Error).message}`);
  console.error(`여기까지 처리: ${processed}곳. 다시 실행하면 이어서 진행됩니다.`);
  process.exit(1);
}
