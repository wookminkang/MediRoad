import { COLUMN_CATEGORIES } from "./column";

/**
 * 메디브리핑 카테고리 — 의료광고법 안전 영역만.
 * policy~seasonal은 중립 정보(정책·트렌드·공공정보·이슈 중심, 특정 병원 홍보 금지).
 * region-guide는 제휴병원 중심 지역 안내 — 단, 사실 기반 서술만 허용하고
 * 추천·최상급 표현은 금지하며 선정 기준(지역·병원 유형·출처·확인일) 공개가 필수다.
 */
export const BRIEFING_CATEGORIES = [
  // region-guide를 맨 앞에 — 탭 순서가 이 배열 순서를 따른다 (일일 발행 주력 카테고리)
  { id: "region-guide", label: "지역 병원 찾기" },
  { id: "policy", label: "의료 정책·제도" },
  { id: "ad-policy", label: "의료광고 정책" },
  { id: "trend", label: "건강 트렌드" },
  { id: "public-health", label: "공공 건강정보" },
  { id: "issue", label: "의료 이슈" },
  { id: "seasonal", label: "계절·감염병" },
] as const;

export type BriefingCategory = (typeof BRIEFING_CATEGORIES)[number]["id"];

const BRIEFING_LABELS = Object.fromEntries(
  BRIEFING_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<BriefingCategory, string>;

export function briefingCategoryLabel(id: BriefingCategory): string {
  return BRIEFING_LABELS[id] ?? id;
}

export function isBriefingCategory(v: string): v is BriefingCategory {
  return BRIEFING_CATEGORIES.some((c) => c.id === v);
}

/** 건강칼럼·메디브리핑 양쪽 카테고리 id → 라벨 (공용 컴포넌트용) */
const ALL_LABELS: Record<string, string> = {
  ...Object.fromEntries(COLUMN_CATEGORIES.map((c) => [c.id, c.label])),
  ...Object.fromEntries(BRIEFING_CATEGORIES.map((c) => [c.id, c.label])),
};
export function anyCategoryLabel(id: string): string {
  return ALL_LABELS[id] ?? id;
}
