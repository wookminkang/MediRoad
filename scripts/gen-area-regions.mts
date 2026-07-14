/**
 * /area 지역 레지스트리 생성 — src/constants/area-regions.ts 를 만든다.
 *
 * ── 왜 필요한가 ──
 * 1) 시군구 이름이 시도끼리 겹친다. '서구'는 부산·대구·인천·광주·대전에 다 있고,
 *    '강서구'는 서울(966곳)과 부산(128곳)에 있다. 그런데 조회는 이름만으로 한다
 *    (`.eq("sigungu", region)`). 그대로 두면 /area/서구가 다섯 도시 병원을 뒤섞는다.
 *    → 겹치는 이름은 slug를 '서울-강서구'처럼 시도를 붙여 분리하고, 조회에도 시도를 건다.
 *       겹치지 않는 이름(강남구, 성남시…)은 기존 주소 그대로 둔다 — 이미 색인된 URL이다.
 *
 * 2) 병원이 몇 곳 없는 지역까지 색인하면 '빈 페이지 공장'으로 보여 사이트 전체가 깎인다.
 *    → 병원 MIN_HOSPITALS곳 이상인 지역만 색인 대상(사이트맵·index)으로 삼는다.
 *
 * 3) 지역별 진료과목을 미리 구해 파일에 박아둔다. 사이트맵이 요청마다 지역 수만큼
 *    DB를 두드리면 타임아웃 난다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/gen-area-regions.mts
 */
import { writeFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { MEDICAL_DEPARTMENTS } from "../src/constants/hospital.js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

/** 이 아래면 페이지를 열지 않는다. 얇은 페이지는 색인에 해롭다. */
const MIN_HOSPITALS = 100;

/**
 * 야간·일요일 페이지를 여는 최소 병원 수.
 * "○○구 야간진료 병원 N곳"이 제목인데 N이 한 자릿수면 페이지가 얇다.
 */
const MIN_OPEN_LATE = 10;

type Row = { sido: string; sigungu: string };

async function allRegions(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("hospitals")
      .select("sido,sigungu")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const r of data as Row[]) {
      if (!r.sido || !r.sigungu) continue; // 시도·시군구가 빈 레코드가 소수 있다
      const k = `${r.sido}|${r.sigungu}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    if (data.length < 1000) break;
  }
  return counts;
}

/**
 * 야간·일요일 진료 병원 수 — 지역별.
 *
 * 이 숫자로 "송파구 야간진료 병원 439곳" 페이지를 열지 말지 정한다. 몇 곳 안 되는
 * 지역에 이 페이지를 열면 "12곳"이라 써놓고 2곳만 나오는 꼴이 된다.
 *
 * 심평원 진료시간 규칙: day 1~5=월~금, 6=토, 7=일, 8=공휴일. close는 "1830" 같은 HHMM.
 * 자정을 넘겨 닫는 병원은 "2600"(새벽 2시)처럼 24를 넘겨 적는다 — 20시 비교에 이미 포함된다.
 */
async function openLateCounts(): Promise<{
  night: Set<string>;
  sunday: Set<string>;
}> {
  const night = new Set<string>();
  const sunday = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("hospital_hours")
      .select("hospital_id,day,close,closed")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const r of data as {
      hospital_id: string;
      day: number;
      close: string | null;
      closed: boolean;
    }[]) {
      if (r.closed || !r.close) continue;
      const c = Number.parseInt(r.close, 10);
      if (Number.isNaN(c)) continue;
      // 평일 20시 이후 마감 = 야간진료. "0000"(자정)도 야간이다.
      if (r.day >= 1 && r.day <= 5 && (c >= 2000 || c === 0)) night.add(r.hospital_id);
      if (r.day === 7) sunday.add(r.hospital_id);
    }
    if (data.length < 1000) break;
  }
  return { night, sunday };
}

/** 그 지역에 실제로 있는 진료과목 (우리가 페이지를 여는 과목만) */
async function departmentsIn(sido: string, sigungu: string): Promise<string[]> {
  const { data } = await sb
    .from("hospitals")
    .select("id, hospital_departments(name)")
    .eq("sido", sido)
    .eq("sigungu", sigungu)
    .limit(300);
  const set = new Set<string>();
  for (const h of (data ?? []) as { hospital_departments: { name: string }[] }[]) {
    for (const d of h.hospital_departments ?? []) {
      if ((MEDICAL_DEPARTMENTS as readonly string[]).includes(d.name)) set.add(d.name);
    }
  }
  return [...set].sort();
}

const counts = await allRegions();
const { night, sunday } = await openLateCounts();

/** 지역별 야간·일요일 병원 수 — 병원 id → 지역을 알아야 세므로 한 번 훑는다. */
const nightBy = new Map<string, number>();
const sundayBy = new Map<string, number>();
for (let from = 0; ; from += 1000) {
  const { data } = await sb
    .from("hospitals")
    .select("id,sido,sigungu")
    .range(from, from + 999);
  if (!data?.length) break;
  for (const h of data as { id: string; sido: string; sigungu: string }[]) {
    if (!h.sido || !h.sigungu) continue;
    const k = `${h.sido}|${h.sigungu}`;
    if (night.has(h.id)) nightBy.set(k, (nightBy.get(k) ?? 0) + 1);
    if (sunday.has(h.id)) sundayBy.set(k, (sundayBy.get(k) ?? 0) + 1);
  }
  if (data.length < 1000) break;
}

// 이름이 겹치는지 먼저 판정한다 — 겹치면 slug에 시도를 붙인다.
const bySigungu = new Map<string, string[]>();
for (const k of counts.keys()) {
  const [sido, sigungu] = k.split("|");
  bySigungu.set(sigungu, [...(bySigungu.get(sigungu) ?? []), sido]);
}

const picked = [...counts.entries()]
  .filter(([, n]) => n >= MIN_HOSPITALS)
  .sort((a, b) => b[1] - a[1]);

const regions: {
  slug: string;
  sido: string;
  sigungu: string;
  label: string;
  count: number;
  nightCount: number;
  sundayCount: number;
  departments: string[];
}[] = [];

for (const [k, count] of picked) {
  const [sido, sigungu] = k.split("|");
  const ambiguous = (bySigungu.get(sigungu) ?? []).length > 1;
  regions.push({
    slug: ambiguous ? `${sido}-${sigungu}` : sigungu,
    sido,
    sigungu,
    label: ambiguous ? `${sido} ${sigungu}` : sigungu,
    count,
    nightCount: nightBy.get(k) ?? 0,
    sundayCount: sundayBy.get(k) ?? 0,
    departments: await departmentsIn(sido, sigungu),
  });
}

const ambiguousNames = [...bySigungu.entries()]
  .filter(([, s]) => s.length > 1)
  .map(([n]) => n)
  .sort();

const body = `/**
 * 자동 생성 — scripts/gen-area-regions.mts. 직접 고치지 말 것.
 *
 * /area 랜딩을 여는 지역 목록. 병원 ${MIN_HOSPITALS}곳 이상인 시군구만 담는다.
 * 이보다 적은 지역은 페이지가 얇아서 색인하면 사이트 전체 평가가 깎인다.
 *
 * slug 규칙 — 이름이 시도끼리 겹치면 시도를 붙인다.
 *   강남구        → /area/강남구        (전국에 하나뿐)
 *   서울 강서구   → /area/서울-강서구   (부산에도 강서구가 있다)
 * 겹치지 않는 이름은 기존 주소를 그대로 쓴다. 이미 색인된 URL을 깨지 않기 위해서다.
 */
export type AreaRegion = {
  /** URL에 쓰는 값 */
  slug: string;
  sido: string;
  sigungu: string;
  /** 화면·타이틀에 쓰는 이름 (겹치는 이름이면 "부산 서구") */
  label: string;
  /** 병원 수 (생성 시점) */
  count: number;
  /** 평일 20시 이후 마감하는 병원 수 — 야간진료 페이지를 열지 정하는 기준 */
  nightCount: number;
  /** 일요일 진료 병원 수 */
  sundayCount: number;
  /** 이 지역에 실제로 있는 진료과목 — /area/[지역]/[과목] 생성 근거 */
  departments: string[];
};

/** 시도끼리 겹치는 시군구 이름. 이 이름 단독 주소(/area/서구)는 여러 도시를 뒤섞으므로 열지 않는다. */
export const AMBIGUOUS_SIGUNGU: readonly string[] = ${JSON.stringify(ambiguousNames)};

export const AREA_REGIONS: readonly AreaRegion[] = ${JSON.stringify(regions, null, 2)};

const BY_SLUG = new Map(AREA_REGIONS.map((r) => [r.slug, r]));

/** slug → 지역. 색인 대상이 아니면 undefined. */
export function findAreaRegion(slug: string): AreaRegion | undefined {
  return BY_SLUG.get(slug);
}

/**
 * 같은 시도의 이웃 지역 (병원 수 많은 순).
 *
 * 지역 랜딩끼리 서로 링크가 없으면 크롤러가 홈 → 지역 하나에서 멈춘다.
 * 이 링크가 156개 지역을 잇는 통로다.
 */
export function nearbyRegionsOf(slug: string, limit = 8): AreaRegion[] {
  const me = BY_SLUG.get(slug);
  if (!me) return [];
  // AREA_REGIONS는 이미 병원 수 내림차순이다
  return AREA_REGIONS.filter((r) => r.sido === me.sido && r.slug !== slug).slice(
    0,
    limit,
  );
}

/** 야간·일요일 페이지를 여는 최소 병원 수. 이보다 적으면 페이지가 얇다. */
export const MIN_OPEN_LATE = ${MIN_OPEN_LATE};
`;

writeFileSync("src/constants/area-regions.ts", body);

const pages = regions.reduce((s, r) => s + r.departments.length, 0);
console.log(`지역 ${regions.length}곳 (병원 ${MIN_HOSPITALS}곳 이상)`);
console.log(`  겹치는 이름 → 시도 붙임: ${regions.filter((r) => r.slug !== r.sigungu).length}곳`);
console.log(`  진료과목 페이지: ${pages.toLocaleString()}개`);
console.log(`  합계: ${(regions.length + pages).toLocaleString()}개 페이지`);
const nightPages = regions.filter((r) => r.nightCount >= MIN_OPEN_LATE).length;
const sundayPages = regions.filter((r) => r.sundayCount >= MIN_OPEN_LATE).length;
console.log(`  야간진료 페이지: ${nightPages}개 (${MIN_OPEN_LATE}곳 이상)`);
console.log(`  일요일진료 페이지: ${sundayPages}개`);
console.log("\nsrc/constants/area-regions.ts 생성 완료");
