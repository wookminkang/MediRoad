import { typeSynonyms } from "@/constants/hospital";
import { getNeighborDistricts } from "@/constants/region-neighbors";
import type { Hospital, OpeningHours } from "@/types/hospital";

/**
 * 병원 도메인 로직 (데이터 접근 아님 — 파생/가공). (ARCHITECTURE §1 lib/)
 */

/**
 * 한눈 요약(TL;DR) — 데이터에서 자동 생성. 생성형 엔진 인용 1순위. (WIREFRAME 4-3)
 * 예) "강남구 정형외과 의원 · 강남역 250m · 평일 09:00–18:00 · 영업중"
 */
export function buildHospitalSummary(h: Hospital): string {
  const parts: string[] = [
    `${h.region.sigungu} ${h.departments[0] ?? ""} ${h.type}`.replace(/\s+/g, " ").trim(),
  ];
  if (h.nearestStation) {
    parts.push(`${h.nearestStation.name} ${h.nearestStation.distanceM}m`);
  }
  const weekday = h.hours?.find((d) => d.day === 1 && !d.closed);
  if (weekday?.open && weekday?.close) {
    parts.push(`평일 ${weekday.open}–${weekday.close}`);
  }
  if (h.isOpenNow != null) parts.push(h.isOpenNow ? "영업중" : "영업종료");
  return parts.join(" · ");
}

/** 한글 받침 유무 → 은/는, 이/가 등 조사 선택용 */
function hasJongseong(word: string): boolean {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false; // 한글 음절이 아니면 받침 없음 취급
  return (c - 0xac00) % 28 !== 0;
}
export const eunNeun = (w: string) => (hasJongseong(w) ? "은" : "는");

/**
 * 도보 시간(분) — 성인 보행 약 67m/분 기준.
 * 소개문·FAQ·통계·JSON-LD가 모두 이 함수를 써야 한 페이지 안에서 값이 어긋나지 않는다.
 * (SEO §GEO: 병원 데이터와 본문 내용이 서로 모순되지 않게 한다)
 */
export const walkMinutes = (distanceM: number) =>
  Math.max(1, Math.round(distanceM / 67));

/**
 * 자동 소개 문단 — 공공데이터(지역·유형·진료과목·지하철·진료시간)로 사실 기반 생성.
 * 관리자 입력(description)이 없을 때 상세페이지를 채우는 폴백. 과장 표현 없이 사실만.
 */
export function buildAutoDescription(h: Hospital): string {
  const loc = `${h.region.sido} ${h.region.sigungu}`;
  const parts: string[] = [
    `${h.name}${eunNeun(h.name)} ${loc}에 위치한 ${h.type}입니다.`,
  ];

  const st = h.nearestStation;
  if (st?.name) {
    const min = walkMinutes(st.distanceM ?? 0);
    const raw = st.name.trim();
    const station = raw.endsWith("역") ? raw : `${raw}역`;
    const line = st.line ? `${st.line} ` : "";
    const exit = st.exit ? ` ${st.exit}번 출구에서` : "에서";
    parts.push(
      `${line}${station}${exit} 도보 약 ${min}분(약 ${st.distanceM}m) 거리로, 대중교통으로 찾아가기 좋습니다.`,
    );
  } else {
    parts.push(`주소는 ${h.roadAddress ?? h.address}입니다.`);
  }

  if (h.departments.length > 0) {
    parts.push(`진료과목은 ${h.departments.join(", ")}입니다.`);
  }

  const open = (d?: OpeningHours) => !!d && !d.closed && !!d.open && !!d.close;
  const hours = h.hours ?? [];
  const weekday = hours.find((d) => d.day === 1 && open(d));
  if (weekday) {
    parts.push(`평일 진료시간은 ${weekday.open}~${weekday.close}입니다.`);

    // 야간진료(평일 20시 이후 마감) — 검색 수요가 큰 정보라 문장으로 명시
    const close = Number(
      (weekday.close ?? "").replace(/[^0-9]/g, "").slice(0, 4).padEnd(4, "0"),
    );
    if (close >= 2000) {
      parts.push(
        `평일 ${weekday.close}까지 진료해 퇴근 후 방문이 가능한 야간진료 병원입니다.`,
      );
    }
  }

  // 주말 진료 — 토·일 데이터가 있을 때만
  const sat = hours.find((d) => d.day === 6);
  const sun = hours.find((d) => d.day === 7);
  const weekend: string[] = [];
  if (open(sat)) weekend.push(`토요일 ${sat!.open}~${sat!.close}`);
  else if (sat?.closed) weekend.push("토요일 휴진");
  if (open(sun)) weekend.push(`일요일 ${sun!.open}~${sun!.close}`);
  else if (sun?.closed) weekend.push("일요일 휴진");
  if (weekend.length) parts.push(`주말은 ${weekend.join(", ")}입니다.`);

  if (h.amenities?.includes("주차가능")) parts.push("주차가 가능합니다.");

  const lunch = hours.find((d) => d.lunch)?.lunch;
  if (lunch) parts.push(`점심시간은 ${lunch}입니다.`);

  parts.push(
    "정확한 진료시간·휴진 여부는 방문 전 전화로 확인하시는 것을 권장합니다.",
  );
  return parts.join(" ");
}

/**
 * 동적 키워드 (지역·역·과목 조합 + 검색 의도). (WIREFRAME 4-3 hospitalKeywords)
 */
export function hospitalKeywords(h: Hospital): string[] {
  const r = h.region.sigungu; // 관악구
  const sido = h.region.sido; // 서울
  const emd = h.region.emdong; // 봉천동
  const rawSt = h.nearestStation?.name?.trim(); // "서울대입구" 또는 "서울대입구역"
  const st = rawSt ? (rawSt.endsWith("역") ? rawSt : `${rawSt}역`) : undefined; // 항상 "…역"
  const depts = h.departments ?? [];
  const symptoms = h.symptoms ?? []; // 보톡스·필러·여드름 등 시술/증상
  const neighbors = getNeighborDistricts(r); // 인접 자치구
  // 종별 동의어 — "한방병원"을 "한의원·한방"으로도 검색하는 사용자 대응
  const types = typeSynonyms(h.type); // 한방병원 → [한방병원, 한의원, 한방]

  const kw: string[] = [
    h.name,
    ...types,
    r,
    `${sido} ${r}`,
    ...depts,
    ...depts.map((d) => `${r} ${d}`), // 관악구 피부과
    ...depts.map((d) => `${d} 추천`),
    `${r} 병원`,
    ...types.map((t) => `${r} ${t}`), // 관악구 한방병원 / 관악구 한의원 / 관악구 한방
    `${r} 병원 추천`,
    "내 주변 병원",
    "병원 찾기",
  ];

  // 읍면동 (봉천동 한의원 / 봉천동 피부과)
  if (emd) {
    kw.push(emd, `${emd} 병원`);
    kw.push(...types.map((t) => `${emd} ${t}`));
    kw.push(...depts.map((d) => `${emd} ${d}`));
  }

  // 지하철역 — 역+유형(동의어), 역+진료과, 역+시술/증상 (예: "서울대입구역 한의원")
  if (st) {
    kw.push(st, `${st} 병원`);
    kw.push(...types.map((t) => `${st} ${t}`));
    kw.push(...depts.map((d) => `${st} ${d}`));
    kw.push(...symptoms.slice(0, 8).map((s) => `${st} ${s}`));
  }

  // 시술/증상 — 단독 + 구 결합 (예: "관악구 필러")
  kw.push(...symptoms.slice(0, 8));
  kw.push(...symptoms.slice(0, 8).map((s) => `${r} ${s}`));

  // 인접 자치구 — 근처 지역 검색 노출 (예: "송파구 한방병원")
  for (const nb of neighbors) {
    kw.push(...types.map((t) => `${nb} ${t}`));
    kw.push(...depts.map((d) => `${nb} ${d}`));
  }

  return Array.from(new Set(kw)).filter(Boolean).slice(0, 60);
}

/**
 * AI 요약(TL;DR) 불릿 — 병원 데이터에서 자동 생성(무료·사실기반, 의료광고법 안전).
 * PostActions "AI요약" 모달용. day 규약은 JS getDay(0=일…6=토) 기준.
 */
export function buildHospitalSummaryBullets(h: Hospital): string[] {
  const b: string[] = [];

  b.push(
    `${h.name}${eunNeun(h.name)} ${h.region.sido} ${h.region.sigungu}에 위치한 ${h.type}입니다.`,
  );

  if (h.departments.length > 0) {
    b.push(`${h.departments.slice(0, 6).join(", ")} 진료를 봅니다.`);
  }

  const wd = h.hours?.find((d) => d.day === 1 && !d.closed && d.open && d.close);
  if (wd?.open && wd?.close) b.push(`평일 진료시간은 ${wd.open}~${wd.close}입니다.`);

  // 입원·응급 — E-Gen 공공데이터. 있을 때만(대부분 병원급). 병상 수까지 있으면 함께.
  if (h.beds && h.beds > 0) {
    b.push(`입원실을 운영하며, 병상은 ${h.beds.toLocaleString()}개입니다.`);
  }
  if (h.emergency) {
    b.push("응급실을 운영합니다.");
  }

  b.push("정확한 진료시간·휴진 여부는 방문 전 전화로 확인하시는 것을 권장합니다.");

  return b;
}

/**
 * 한눈에 보는 — 가이드 허브 임베드용 간략 버전.
 * 병원 1줄 소개 · 평일 진료시간 · (입원실 운영 시 병상) 만 담는다.
 */
export function buildHospitalGlanceBrief(
  h: Hospital,
  opts: { includeHours?: boolean } = {},
): string[] {
  const { includeHours = true } = opts;
  const b: string[] = [];

  // 병원 1줄 소개 — 소개글 첫 문장, 없으면 위치·종별 사실 문장
  const desc = h.description?.trim();
  const oneLine = desc
    ? desc.split(/(?<=[.!?。])\s+/)[0]
    : `${h.name}${eunNeun(h.name)} ${h.region.sido} ${h.region.sigungu}에 위치한 ${h.type}입니다.`;
  b.push(oneLine);

  // 진료시간 — 평일 기준(별도 섹션이 있으면 생략)
  if (includeHours) {
    const wd = h.hours?.find((d) => d.day === 1 && !d.closed && d.open && d.close);
    if (wd?.open && wd?.close) b.push(`평일 진료시간은 ${wd.open}~${wd.close}입니다.`);
  }

  // 입원실 — 운영할 때만(E-Gen 공공데이터)
  if (h.beds && h.beds > 0) {
    b.push(`입원실을 운영하며, 병상은 ${h.beds.toLocaleString()}개입니다.`);
  }

  return b;
}
