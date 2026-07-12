/**
 * 역세권 랜딩 대상 역 목록 생성 → src/constants/stations.generated.ts
 * - hospitals.station_name(괄호 부기·역접미 정리 = clean)별 병원수 집계
 * - 병원 3곳+ 역만 (SEO §4-3 thin page 방지 = 사이트맵 "정예")
 * - 대표 시도·시군구는 해당 역 병원의 최빈값
 * 실행: node --env-file=.env.local --import tsx scripts/gen-stations.mts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const clean = (raw: string) =>
  raw.replace(/\(.*?\)/g, "").replace(/\s+/g, "").replace(/역$/, "").trim();
const mode = (m: Record<string, number>) =>
  Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

type Agg = { count: number; sido: Record<string, number>; sigungu: Record<string, number> };
const agg: Record<string, Agg> = {};

let from = 0;
const size = 1000;
for (;;) {
  const { data, error } = await sb
    .from("hospitals")
    .select("station_name, sido, sigungu")
    .not("station_name", "is", null)
    .range(from, from + size - 1);
  if (error) throw error;
  if (!data.length) break;
  for (const r of data as { station_name: string; sido: string | null; sigungu: string | null }[]) {
    const c = clean(r.station_name);
    if (!c) continue;
    const a = (agg[c] ??= { count: 0, sido: {}, sigungu: {} });
    a.count++;
    if (r.sido) a.sido[r.sido] = (a.sido[r.sido] ?? 0) + 1;
    if (r.sigungu) a.sigungu[r.sigungu] = (a.sigungu[r.sigungu] ?? 0) + 1;
  }
  from += size;
  if (data.length < size) break;
}

const targets = Object.entries(agg)
  .filter(([, a]) => a.count >= 3)
  .map(([name, a]) => ({ name, sido: mode(a.sido), sigungu: mode(a.sigungu), count: a.count }))
  .sort((a, b) => b.count - a.count);

const body = `// 자동 생성 — scripts/gen-stations.mts (수정 금지). 역세권 랜딩(/near) 대상 역.
export type StationTarget = {
  /** clean 역명("역" 접미 없음). URL은 \`\${name}역\` */
  name: string;
  sido: string;
  sigungu: string;
  count: number;
};

/** 병원 3곳+ 역 ${targets.length}개 (병원수 내림차순). 생성 시점 스냅샷. */
export const STATION_TARGETS: StationTarget[] = ${JSON.stringify(targets)};
`;

const out = path.resolve("src/constants/stations.generated.ts");
writeFileSync(out, body);
console.log(`✅ ${targets.length}개 역 → ${out}`);
console.log("상위:", targets.slice(0, 5).map((t) => `${t.name}(${t.count})`).join(", "));
