import { BRIEFING_CATEGORIES } from "./briefing";
import { COLUMN_CATEGORIES } from "./column";
import { MEDICAL_DEPARTMENTS } from "./hospital";

/**
 * 모바일 내비게이션 섹션 — 하단 탭바(BottomNav)와 모바일 앱바(MobileAppBar)가 함께 쓴다.
 * 한 곳에서 관리해야 "탭은 활성인데 헤더 제목은 안 바뀌는" 어긋남이 생기지 않는다.
 */
export type Section = {
  href: string;
  label: string;
  /** 활성 판정용 경로 접두사 (상세·하위 페이지 포함) */
  match: string[];
  /** 하단 탭바에 노출할지 (false면 헤더 타이틀만 바뀐다) */
  tab?: boolean;
  /** 앱바 검색이 이 섹션에서 무엇을 검색할지. 없으면 병원 검색으로 떨어진다. */
  search?: { action: string; placeholder: string; suggestions: string[] };
};

const HOSPITAL_SEARCH = {
  action: "/hospitals",
  placeholder: "병원 이름·지역으로 검색",
  suggestions: MEDICAL_DEPARTMENTS.slice(0, 8),
};

export const SECTIONS: Section[] = [
  {
    href: "/hospitals",
    label: "병원찾기",
    match: ["/hospitals", "/area", "/near"],
    tab: true,
    search: HOSPITAL_SEARCH,
  },
  {
    href: "/map",
    label: "내 주변",
    match: ["/map"],
    tab: true,
    search: HOSPITAL_SEARCH,
  },
  {
    href: "/health",
    label: "건강정보",
    match: ["/health", "/conditions"],
    tab: true,
    search: {
      action: "/health",
      placeholder: "궁금한 증상·질환을 검색해보세요",
      suggestions: COLUMN_CATEGORIES.map((c) => c.label),
    },
  },
  {
    href: "/briefing",
    label: "메디브리핑",
    match: ["/briefing"],
    tab: true,
    search: {
      action: "/briefing",
      placeholder: "의료 정책·건강 이슈를 검색해보세요",
      suggestions: BRIEFING_CATEGORIES.map((c) => c.label),
    },
  },
  { href: "/faq", label: "FAQ", match: ["/faq"] },
];

/** 홈·미등록 경로의 기본 검색 = 병원 검색 */
export const DEFAULT_SEARCH = HOSPITAL_SEARCH;

/** 현재 경로가 속한 섹션. 홈(/)·미등록 경로는 undefined. */
export function matchSection(pathname: string): Section | undefined {
  return SECTIONS.find((s) =>
    s.match.some((m) => pathname === m || pathname.startsWith(`${m}/`)),
  );
}
