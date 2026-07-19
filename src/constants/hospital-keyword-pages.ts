/**
 * 병원별 키워드 랜딩(/[병원slug]/search/[키워드]) 큐레이션 목록.
 *
 * 정책(중요): **사람이 고른 키워드만** 페이지가 된다. URL의 키워드가 이 목록에 없으면 404 —
 * 무한 자동생성(doorway) 금지. 각 페이지는 그 병원의 실제 정보(위치·진료·FAQ)를 담아
 * thin-page가 아니도록 한다. 키워드는 그 병원이 실제로 진료·해당하는 것(위치·진료분야)으로
 * 고른다. 경쟁 병원명·효과 단정 등 의료광고법 위반 소지가 있는 키워드는 넣지 않는다.
 *
 * 운영: 제휴 병원별 키워드를 편집팀이 큐레이션해 아래에 추가한다.
 */
export type HospitalKeywordPage = {
  /** 대상 병원 slug (URL 첫 세그먼트, getHospitalBySlug 키) */
  hospitalSlug: string;
  /** 표시·검색 키워드 (URL 마지막 세그먼트, 인코딩되어 들어감) */
  keyword: string;
  /** 선택: 이 키워드에 맞춘 커스텀 소개문. 없으면 병원 데이터에서 자동 생성. */
  intro?: string;
};

export const HOSPITAL_KEYWORD_PAGES: HospitalKeywordPage[] = [
  // 리움한방병원(강동송파) — 최우선. 전부 위치·진료분야 기반(의료광고법 안전).
  { hospitalSlug: "리움한방병원-강동구", keyword: "강동구 재활통증치료" },
  { hospitalSlug: "리움한방병원-강동구", keyword: "송파구 재활치료" },
  { hospitalSlug: "리움한방병원-강동구", keyword: "송파구 한방치료" },
  { hospitalSlug: "리움한방병원-강동구", keyword: "송파구 유방암 재활" },
  { hospitalSlug: "리움한방병원-강동구", keyword: "둔촌동역 한방병원" },
  { hospitalSlug: "리움한방병원-강동구", keyword: "둔촌동 한방병원" },
  { hospitalSlug: "리움한방병원-강동구", keyword: "올림픽공원역 한방병원" },
  { hospitalSlug: "리움한방병원-강동구", keyword: "강동 암재활 한방병원" },
];

/** 이 병원(slug)의 큐레이션 키워드 페이지들. */
export function keywordPagesForHospital(hospitalSlug: string): HospitalKeywordPage[] {
  return HOSPITAL_KEYWORD_PAGES.filter((p) => p.hospitalSlug === hospitalSlug);
}

/** (병원slug, 키워드)로 큐레이션 항목 찾기 — 없으면 undefined(→ 404). */
export function findKeywordPage(
  hospitalSlug: string,
  keyword: string,
): HospitalKeywordPage | undefined {
  const k = keyword.trim();
  return HOSPITAL_KEYWORD_PAGES.find(
    (p) => p.hospitalSlug === hospitalSlug && p.keyword === k,
  );
}
