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
  const r = h.region.sigungu;
  const st = h.nearestStation?.name;
  return Array.from(
    new Set([
      h.name,
      h.type,
      r,
      ...h.departments,
      ...h.departments.map((d) => `${r} ${d}`),
      ...(st ? h.departments.map((d) => `${st} ${d}`) : []),
      ...h.departments.map((d) => `${d} 추천`),
      `${r} 병원`,
      `${r} ${h.type}`,
      `${r} 병원 추천`,
      "내 주변 병원",
      "병원 찾기",
    ]),
  );
}
