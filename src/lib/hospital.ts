import { getNeighborDistricts } from "@/constants/region-neighbors";
import type { Hospital } from "@/types/hospital";

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

/**
 * 동적 키워드 (지역·역·과목 조합 + 검색 의도). (WIREFRAME 4-3 hospitalKeywords)
 */
export function hospitalKeywords(h: Hospital): string[] {
  const r = h.region.sigungu; // 관악구
  const sido = h.region.sido; // 서울
  const emd = h.region.emdong; // 봉천동
  const st = h.nearestStation?.name; // 서울대입구역
  const depts = h.departments ?? [];
  const symptoms = h.symptoms ?? []; // 보톡스·필러·여드름 등 시술/증상
  const neighbors = getNeighborDistricts(r); // 인접 자치구

  const kw: string[] = [
    h.name,
    h.type,
    r,
    `${sido} ${r}`,
    ...depts,
    ...depts.map((d) => `${r} ${d}`), // 관악구 피부과
    ...depts.map((d) => `${d} 추천`),
    `${r} 병원`,
    `${r} ${h.type}`,
    `${r} 병원 추천`,
    "내 주변 병원",
    "병원 찾기",
  ];

  // 읍면동 (봉천동 피부과)
  if (emd) {
    kw.push(emd, `${emd} 병원`, ...depts.map((d) => `${emd} ${d}`));
  }

  // 지하철역 — 역+진료과, 역+시술/증상 (예: "서울대입구역 보톡스")
  if (st) {
    kw.push(st, `${st} 병원`, `${st} ${h.type}`);
    kw.push(...depts.map((d) => `${st} ${d}`));
    kw.push(...symptoms.slice(0, 8).map((s) => `${st} ${s}`));
  }

  // 시술/증상 — 단독 + 구 결합 (예: "관악구 필러")
  kw.push(...symptoms.slice(0, 8));
  kw.push(...symptoms.slice(0, 8).map((s) => `${r} ${s}`));

  // 인접 자치구 — 근처 지역 검색 노출 (예: "서초구 피부과")
  for (const nb of neighbors) {
    kw.push(`${nb} ${h.type}`);
    kw.push(...depts.map((d) => `${nb} ${d}`));
  }

  return Array.from(new Set(kw)).filter(Boolean).slice(0, 45);
}
