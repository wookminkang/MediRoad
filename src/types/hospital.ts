import type {
  HospitalType,
  MedicalDepartment,
} from "@/constants/hospital";
import type { LatLng } from "@/types";

/**
 * 행정구역 (공공데이터 HIRA 시도/시군구 코드+명)
 * URL 세그먼트 = sigungu(명), 정합/중복 키 = sgguCd. (PRD §6)
 */
export type Region = {
  sido: string; // 시도명 예) "서울"
  sidoCd: string; // 시도 코드
  sigungu: string; // 시군구명 예) "강남구"
  sgguCd: string; // 시군구 코드
  emdong?: string; // 읍면동명 예) "역삼동"
};

/** 병원 사진 (상세 슬라이드) */
export type HospitalPhoto = {
  url: string;
  /** 비우면 `{병원명} {분류}`로 자동 보강 */
  alt?: string;
  caption?: string;
  category?: "외관" | "접수" | "진료실" | "대기실" | "기타";
  /** 대표(썸네일·OG) */
  isPrimary?: boolean;
};

/** 가까운 지하철역 */
export type NearestStation = {
  name: string; // 예) "강남역"
  line?: string; // 예) "2호선"
  exit?: string; // 예) "2"
  distanceM: number; // 도보 거리(m)
};

/** 요일별 진료시간 (day: 0=일 … 6=토) */
export type OpeningHours = {
  day: number;
  open?: string; // "09:00"
  close?: string; // "18:00"
  lunch?: string; // "13:00-14:00"
  closed?: boolean;
};

/** 의료진 (E-E-A-T) */
export type Doctor = {
  name: string;
  title: string; // 예) "원장"
  specialty: string; // 예) "정형외과 전문의"
};

/** 자주 묻는 질문 (FAQPage) */
export type HospitalFaq = { q: string; a: string };

/** 편의·특화 정보 (배지·검색 필터·JSON-LD amenityFeature) */
export type HospitalAmenity =
  | "주차가능"
  | "야간진료"
  | "일요일진료"
  | "공휴일진료"
  | "예약가능"
  | "여의사진료"
  | "카드결제"
  | "장애인편의";

/** 외부 링크 (예약·홈페이지 — JSON-LD sameAs) */
export type HospitalLinks = {
  homepage?: string;
  naverBooking?: string;
  kakaoChannel?: string;
};

/** SEO 오버라이드 (관리자 입력 — 비우면 자동 생성값 사용) */
export type HospitalSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string[];
  noindex?: boolean;
};

/** 병원 도메인 모델 (Mock·실API 공통 계약) */
export type Hospital = {
  id: string; // 짧은 고유 ID (E-Gen HPID)
  slug: string; // URL 슬러그(한글명, 동명 시 지역 접미) — /hospital/{slug}
  name: string;
  type: HospitalType;
  departments: MedicalDepartment[];
  region: Region;
  /** 지번 주소 */
  address: string;
  /** 도로명 주소 */
  roadAddress?: string;
  phone?: string;
  location: LatLng;
  /** 운영 여부 (영업중 표시용) */
  isOpenNow?: boolean;

  // --- 표시·상세용 (옵션) ---
  rating?: number;
  reviewCount?: number;
  photos?: HospitalPhoto[];
  nearestStation?: NearestStation;
  /** 요일별 진료시간 */
  hours?: OpeningHours[];
  holidayClosed?: boolean;
  /** 병원 소개글 (소개·진료철학) */
  description?: string;
  /** 입원실 병상 수 (E-Gen). 0/undefined면 입원실 없음 */
  beds?: number;
  /** 응급실 운영 (E-Gen) */
  emergency?: boolean;
  /** 편의·특화 (주차·야간진료·일요일진료 등) */
  amenities?: HospitalAmenity[];
  /** 증상·질환 키워드 (내부링크·GEO) */
  symptoms?: string[];
  /** 외부 링크 (예약·홈페이지) */
  links?: HospitalLinks;
  doctors?: Doctor[];
  faqs?: HospitalFaq[];
  /** 최종 업데이트 (E-E-A-T 최신성) ISO date */
  updatedAt?: string;
  seo?: HospitalSeo;
};

/** 검색·필터 (URL searchParams ↔ api 질의 공통) */
export type HospitalSearchFilters = {
  /** 검색 키워드 (병원명·증상·진료과목) */
  q?: string;
  department?: MedicalDepartment;
  type?: HospitalType;
  /** 지역 (시군구명 — /area 랜딩) */
  region?: string;
  /** 최근접 지하철역명 (괄호 부기 제외한 clean 이름 — /near 랜딩). 예: "서울대입구" */
  station?: string;
  /** 시도(광역) — 병원 리스트 지역 필터 */
  sido?: string;
  /** 영업중만 보기 */
  openNow?: boolean;
  /** 야간(평일 20시 이후 마감)·일요일 진료만 보기. 심평원 시간 표기가 지저분해 서버에서 판정한다. */
  openLate?: "night" | "sunday";
  /** 기준 좌표 (반경 필터·거리 정렬 기준) */
  center?: LatLng;
  /** 반경(km) — center 기준 이내만. center와 함께 사용 */
  radiusKm?: number;
  /** 페이지네이션 (무한스크롤·목록) */
  page?: number;
  pageSize?: number;
};
