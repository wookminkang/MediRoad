/**
 * E-Gen 병원 상세 API로 입원(병상)·응급실 정보를 동기화한다.
 *
 * E-Gen getHsptlBassInfoInqire(HPID=병원id)가 주는 필드 중:
 *   dutyHano = 입원실 병상 수  → hospitals.beds
 *   dutyEryn = 응급실 운영(1=운영, 그 외 미운영) → hospitals.er_available
 * "입원 가능"은 beds>0으로 파생한다(표본 검증 결과 dutyHayn↔dutyHano 불일치 0건).
 *
 * 마이그레이션 없이 기존 beds(int)·er_available(bool) 컬럼을 채운다.
 *
 * 78,502곳 전체를 도는 대량 작업이라 이어달리기(커서)와 재시도를 넣었다.
 * 실행:
 *   node --env-file=.env.local --import tsx scripts/sync-inpatient-er.mts            # 이어서
 *   node --env-file=.env.local --import tsx scripts/sync-inpatient-er.mts --reset    # 처음부터
 *   node --env-file=.env.local --import tsx scripts/sync-inpatient-er.mts --limit 100 # 소량 테스트
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const KEY = encodeURIComponent(process.env.EGEN_SERVICE_KEY!);
const EP = process.env.EGEN_API_ENDPOINT!;
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const CURSOR = new URL("./.inpatient-cursor", import.meta.url);
const args = process.argv.slice(2);
const RESET = args.includes("--reset");
const LIMIT = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 ? Number(args[i + 1]) : Infinity;
})();
// 일일 한도(운영계정 10만)는 넉넉하다. 초당 과속(rate limit)만 피하면 되므로
// 동시 10 + 배치 지연 50ms로 둔다(≈초당 10~15건). 429가 나면 detail()이 재시도한다.
const CONCURRENCY = 15;
const BATCH_DELAY_MS = 50;

type Detail = { dutyHano?: string; dutyEryn?: string } | null;

async function detail(hpid: string, retry = 2): Promise<Detail> {
  const url = `${EP}/getHsptlBassInfoInqire?serviceKey=${KEY}&HPID=${hpid}&_type=json`;
  try {
    const r = await fetch(url);
    const t = await r.text();
    if (!t.trim().startsWith("{")) throw new Error("non-json");
    return JSON.parse(t)?.response?.body?.items?.item ?? null;
  } catch (e) {
    if (retry > 0) {
      await new Promise((s) => setTimeout(s, 400));
      return detail(hpid, retry - 1);
    }
    return null;
  }
}

function loadCursor(): string {
  if (RESET || !existsSync(CURSOR)) return "";
  return readFileSync(CURSOR, "utf8").trim();
}

let processed = 0;
let updated = 0;
let inpatient = 0;
let er = 0;
let failed = 0;

async function run() {
  let after = loadCursor();
  console.log(after ? `커서 이어서: id > ${after}` : "처음부터");

  for (;;) {
    // id 오름차순 페이지네이션 — 커서(마지막 처리 id) 이후만
    let q = sb
      .from("hospitals")
      .select("id")
      .order("id", { ascending: true })
      .limit(500);
    if (after) q = q.gt("id", after);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;

    for (let i = 0; i < data.length; i += CONCURRENCY) {
      const batch = data.slice(i, i + CONCURRENCY);
      // API 조회와 DB update를 병원별로 한 번에 병렬 처리한다.
      // 예전엔 update를 순차(await)로 돌려 DB 왕복 대기가 쌓이는 게 병목이었다.
      await Promise.all(
        batch.map(async (h) => {
          processed++;
          const d = await detail(h.id);
          if (!d) {
            failed++;
            return;
          }
          const beds = Number.parseInt(d.dutyHano ?? "", 10);
          const erYn = String(d.dutyEryn) === "1";
          const { error: uErr } = await sb
            .from("hospitals")
            .update({ beds: Number.isNaN(beds) ? null : beds, er_available: erYn })
            .eq("id", h.id);
          if (uErr) {
            failed++;
            return;
          }
          updated++;
          if (beds > 0) inpatient++;
          if (erYn) er++;
        }),
      );
      after = batch[batch.length - 1].id;
      writeFileSync(CURSOR, after);
      await new Promise((s) => setTimeout(s, BATCH_DELAY_MS)); // 과속 방지
      if (processed % 500 < CONCURRENCY || processed >= LIMIT) {
        console.log(
          `  ${processed.toLocaleString()} 처리 | 입원 ${inpatient} | 응급 ${er} | 실패 ${failed} | 커서 ${after}`,
        );
      }
      if (processed >= LIMIT) {
        console.log("\n--limit 도달, 중단");
        return;
      }
    }
  }
  console.log("\n전체 완료");
}

await run();
console.log(
  `\n총 처리 ${processed.toLocaleString()} / 갱신 ${updated.toLocaleString()} / 입원가능 ${inpatient.toLocaleString()} / 응급실 ${er.toLocaleString()} / 실패 ${failed}`,
);
