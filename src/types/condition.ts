import type { MedicalDepartment } from "@/constants/hospital";

export type ConditionStatus = "published" | "draft" | "hidden";

export type ConditionFaq = { q: string; a: string };

export type ConditionSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
  noindex?: boolean;
};

/** 증상·질환 (Mock·실API 공통 계약) */
export type Condition = {
  id: string; // slug — URL: /conditions/{id}
  name: string;
  bodyPart: string; // 부위 그룹
  departments: MedicalDepartment[]; // 관련 진료과
  symptoms: string[]; // 관련 증상 키워드
  excerpt: string;
  summary: string[]; // 핵심 요약
  body: string; // 개요 마크다운
  faqs?: ConditionFaq[];
  thumbnail?: string;
  seo?: ConditionSeo;
  status: ConditionStatus;
  sortOrder: number;
  updatedAt: string;
};

/** 부위별 그룹 (허브) */
export type ConditionGroup = { bodyPart: string; conditions: Condition[] };
