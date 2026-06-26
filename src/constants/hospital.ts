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
