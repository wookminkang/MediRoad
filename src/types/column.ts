import type { BriefingCategory } from "@/constants/briefing";
import type { ColumnCategory } from "@/constants/column";
import type { MedicalDepartment } from "@/constants/hospital";

export type ColumnStatus = "published" | "draft" | "hidden";

/** 콘텐츠 종류 — 건강칼럼(상시) / 메디브리핑(시의성) */
export type ColumnKind = "column" | "briefing";

/** 카테고리 — 칼럼/브리핑 양쪽 */
export type AnyCategory = ColumnCategory | BriefingCategory;

export type ColumnReviewer = {
  name: string;
  specialty: string; // 예) "내분비내과 전문의"
  bio?: string;
};

export type ColumnReference = { title: string; url: string };
export type ColumnFaq = { q: string; a: string };

export type ColumnSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
  noindex?: boolean;
};

/** 건강 칼럼 (Mock·실API 공통 계약) */
export type Column = {
  id: string;
  /** 콘텐츠 종류 (기본 column). briefing이면 메디브리핑 */
  kind?: ColumnKind;
  title: string;
  category: AnyCategory;
  tags?: string[];
  excerpt: string; // 목록 요약(1~2줄)
  summary: string[]; // 핵심 요약(TL;DR 불릿)
  body: string; // 본문 마크다운 원문 (이미지는 ![alt](url) 인라인)
  thumbnail?: string;
  author: string; // 작성(편집팀)
  reviewedBy: ColumnReviewer; // 감수 의료진 (E-E-A-T)
  references?: ColumnReference[]; // 출처·참고문헌
  faqs?: ColumnFaq[];
  relatedDepartments?: MedicalDepartment[]; // 관련 병원 내부링크
  status: ColumnStatus;
  publishedAt: string; // ISO date
  updatedAt: string;
  readingMinutes: number;
  seo?: ColumnSeo;
};

export type ColumnFilters = {
  q?: string;
  category?: AnyCategory;
  kind?: ColumnKind;
  page?: number;
  pageSize?: number;
};
