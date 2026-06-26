import type { MedicalDepartment } from "@/constants/hospital";

export type HospitalPostStatus = "published" | "draft" | "hidden";

/** 작성 주체 (병원/의료진) — E-E-A-T */
export type HospitalPostAuthor = {
  name: string; // 예) "리움한방병원"
  role: string; // 예) "한의원" / "한방병원"
  license?: string; // 면허/자격(있으면)
};

/** 검수 의료진 */
export type HospitalPostReviewer = {
  name: string;
  specialty: string;
  bio?: string;
};

export type HospitalPostReference = { title: string; url: string };
export type HospitalPostFaq = { q: string; a: string };

export type HospitalPostSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
  noindex?: boolean;
};

/** 병원별 의료 콘텐츠 */
export type HospitalPost = {
  id: string;
  hospitalId: string;
  title: string;
  excerpt: string;
  thumbnail?: string;
  summary: string[]; // TL;DR
  body: string; // 마크다운 원문
  tags?: string[];
  faqs?: HospitalPostFaq[];
  references?: HospitalPostReference[];
  conditions?: string[]; // 다룬 질환
  relatedDepartments?: MedicalDepartment[];
  author: HospitalPostAuthor;
  reviewedBy?: HospitalPostReviewer;
  seo?: HospitalPostSeo;
  status: HospitalPostStatus;
  publishedAt: string; // ISO date
  updatedAt: string;
  readingMinutes: number;
};
