/**
 * 광고주(제휴) 병원 매칭 → src/constants/partners.ts 생성.
 * 주소/기관번호가 없어 "상호명 유일 일치"만 채택(동명 다수·미매칭은 제외, 보고만).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-partners.mts
 */
import { writeFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PARTNERS = `(오산)경희바른한의원
(천안)청담한의원
365경희밝은본한의원
365경희스마일한의원
365경희스마일한의원 광명
QA-1
QA-2
강동경희한의원
강민욱
경희대인한의원
경희바른정한의원
경희신기한의원
경희우리한방병원
경희유한의원
경희정답다한의원
경희포근한의원
경희하늘애한의원 광진구
경희하늘애한의원 사하구
고구려한방병원
광주참한의원
구름한의원
구파발경희한의원
김용한의원
능곡해나무한의원
다나은경희한의원
더스타일정형외과의원
도치한의원
드림나무한의원
로하셀한의원 부평구
리엔에이치
리움한방병원 강동송파
리움한방병원 종로
리움한의원
마인드림정신건강의학과
마인드림정신과
마포요양병원
모아재활의학과소아청소년과의원
무이재의원
무이재한방병원 강남
무이재한방병원 부산
바른경희한의원
바른마음한의원
바름온한의원
보령정한의원
봄온담한의원
불암경희한의원
설명한의원 강남
설명한의원 구미
신통한방병원
로하셀한의원 중구
송산한의원 유성구
연세새빛치과의원
바름온한의원 인천
아미나요양병원
연세윤슬정신건강의학과의원
율담정신건강의학과의원
마인드림정신건강의학과의원
송율정신건강의학과의원
예성한방병원
성로요양병원
성모사랑한방병원
소통부부한의원
송산한의원
송율정신건강의학과
숨쉬는한의원
시티오씨엘경희한의원
알리다고
연세새빛치과
연세새빛치과/경희인다움한의원
연세윤솔정신건강의학과
연세윤슬정신건강의학과
열린경희한의원 서초구
용인한방병원
유희승한의원
율담정신건강의학과
율재한의원
으뜸경희한의원 분당수내
이강한방병원
이담한의원
이림한의원
이민준한의원
이천하늘애한방병원
이희성한의원
일등경희한의원
일등한의원
자람한방병원
작은거인한의원
장곡365바른몸한의원
조후영한의원
중앙경희한의원 부천시
진료일정테스트
진심한의원 동대문구
청담한의원
청담한의원 천안
청라좋은한방병원
클라이피정신건강의학과의원
태인한의원 송파구
테스트
테스트병원
하늘체한의원 남동구
한림한의원
향남몸바른한의원
홍제 으뜸경희한의원
홍한의원 안산시
바른마음한의원마곡발산점
소통부부한의원 서구`
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

// DB 전체 적재
type Row = { id: string; name: string; sigungu: string };
const all: Row[] = [];
let after = "";
while (true) {
  const { data } = await sb
    .from("hospitals")
    .select("id,name,sigungu")
    .gt("id", after)
    .order("id")
    .limit(1000);
  if (!data?.length) break;
  after = data[data.length - 1].id;
  all.push(...(data as Row[]));
}

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
const core = (sigungu: string) => sigungu.replace(/[구시군]$/, "");
const byName = new Map<string, Row[]>();
for (const h of all) {
  const k = norm(h.name);
  const arr = byName.get(k);
  if (arr) arr.push(h);
  else byName.set(k, [h]);
}

const matched: { partner: string; row: Row }[] = [];
const skipped: string[] = [];

for (const p of PARTNERS) {
  // 1) 전체 정규화 유일 일치
  const exact = byName.get(norm(p)) ?? [];
  if (exact.length === 1) {
    matched.push({ partner: p, row: exact[0] });
    continue;
  }
  // 2) 지점 표기 분리: base + region → 지역으로 1곳 확정될 때만
  if (p.includes(" ")) {
    const idx = p.lastIndexOf(" ");
    const base = p.slice(0, idx);
    const region = norm(p.slice(idx + 1));
    const baseC = byName.get(norm(base)) ?? [];
    const hit = baseC.filter((h) => region.includes(norm(core(h.sigungu))));
    if (hit.length === 1) {
      matched.push({ partner: p, row: hit[0] });
      continue;
    }
  }
  skipped.push(p);
}

/*
 * ID 직접 지정 — 상호명 매칭이 원리적으로 못 가리는 경우의 탈출구.
 *
 * 매처는 "상호명(+시군구) 유일 일치"라, 같은 시군구에 동명이 둘 이상이면 손을 든다.
 * 예: 숨쉬는한의원은 남양주시에만 2곳(B2101551·B2104877)이라 이름으로는 구분 불가.
 * 지점 전체를 제휴로 잡아야 하는 체인도 여기서 처리한다.
 */
const EXTRA_IDS: string[] = [
  // 시군구가 여러 시도에 중복돼(예: '서구'가 대구·인천 양쪽) 이름으로 못 가리는 곳
  "B1401054", // 일등한의원 (인천 서구)

  // 숨쉬는한의원 전 지점 (10곳)
  "B1401078", // 인천 연수구
  "B2101112", // 경기 용인시
  "B2101551", // 경기 남양주시
  "B2102087", // 경기 성남시
  "B2103657", // 경기 평택시
  "B2104782", // 경기 화성시
  "B2104877", // 경기 남양주시 (동명 2곳 중 하나 — 이름 매칭 불가)
  "B2104888", // 경기 시흥시
  "B2104918", // 경기 수원시
  "B2400358", // 충남 천안시
];

for (const id of EXTRA_IDS) {
  if (matched.some((m) => m.row.id === id)) continue;
  const row = all.find((h) => h.id === id);
  if (row) matched.push({ partner: `${row.name} (ID 지정)`, row });
  else console.warn(`  ⚠ EXTRA_IDS에 없는 병원 ID: ${id}`);
}

// 상수 파일 작성
const lines = matched
  .sort((a, b) => a.row.id.localeCompare(b.row.id))
  .map((m) => `  "${m.row.id}", // ${m.row.name} (${m.row.sigungu}) ← ${m.partner}`);
const file = `// 자동 생성: scripts/gen-partners.mts (광고주 상호명 유일 일치 매칭)
// 갱신: 광고주 목록 변경 시 스크립트 재실행. 동명 다수·미매칭은 제외됨.
export const PARTNER_HOSPITAL_IDS: ReadonlySet<string> = new Set([
${lines.join("\n")}
]);

/** 제휴(광고주) 병원 여부 */
export function isPartnerHospital(id: string | undefined | null): boolean {
  return !!id && PARTNER_HOSPITAL_IDS.has(id);
}
`;
writeFileSync("src/constants/partners.ts", file);

console.log(`매칭 ${matched.length}곳 → src/constants/partners.ts 생성`);
console.log(`제외 ${skipped.length}곳 (동명다수/미매칭/테스트):`);
skipped.forEach((s) => console.log("  - " + s));
