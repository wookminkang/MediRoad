/** 병원 종별 */
export const HOSPITAL_TYPES = [
  "병원",
  "의원",
  "한방병원",
  "한의원",
  "치과",
  "약국",
] as const;
export type HospitalType = (typeof HOSPITAL_TYPES)[number];

/**
 * 종별 검색 동의어 — 사용자는 "한방병원"을 "한의원·한방"으로도 검색한다.
 * 리움(한방병원)이 "둔촌오륜역 한의원", 이음손(한의원)이 "서울대입구역 한방"으로도
 * 잡히도록 키워드·타이틀 확장에 쓴다. 첫 원소는 항상 자기 종별(대표 표기).
 */
export const HOSPITAL_TYPE_SYNONYMS: Record<HospitalType, string[]> = {
  병원: ["병원"],
  의원: ["의원", "병원"],
  한방병원: ["한방병원", "한의원", "한방"],
  한의원: ["한의원", "한방병원", "한방"],
  치과: ["치과", "치과의원", "치과병원"],
  약국: ["약국"],
};

/** 종별 동의어 목록(미등록 종별이면 자기 자신만). */
export function typeSynonyms(type: string): string[] {
  return HOSPITAL_TYPE_SYNONYMS[type as HospitalType] ?? [type];
}

/** 진료과목 (검색 필터 옵션) */
export const MEDICAL_DEPARTMENTS = [
  "내과",
  "외과",
  "정형외과",
  "신경외과",
  "산부인과",
  "소아청소년과",
  "이비인후과",
  "안과",
  "피부과",
  "정신건강의학과",
  "재활의학과",
  "가정의학과",
  "치과",
  "한방",
] as const;
export type MedicalDepartment = (typeof MEDICAL_DEPARTMENTS)[number];
