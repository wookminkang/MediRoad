/** 건강 칼럼 카테고리 — id(영문 고유키, URL·DB) + label(한글, 표시). (WIREFRAME 4-6 탭) */
export const COLUMN_CATEGORIES = [
  { id: "diabetes", label: "당뇨" },
  { id: "hypertension", label: "고혈압" },
  { id: "diet", label: "다이어트" },
  { id: "orthopedics", label: "정형외과" },
  { id: "oriental-medicine", label: "한방" },
  { id: "hair-loss", label: "탈모" },
  { id: "skin", label: "피부" },
  { id: "procedure", label: "기타 시술" },
] as const;

export type ColumnCategory = (typeof COLUMN_CATEGORIES)[number]["id"];

const CATEGORY_LABELS = Object.fromEntries(
  COLUMN_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<ColumnCategory, string>;

/** 카테고리 id → 한글 표시 라벨 */
export function categoryLabel(id: ColumnCategory): string {
  return CATEGORY_LABELS[id] ?? id;
}

/** 유효한 카테고리 id인지 (라우트 검증용) */
export function isColumnCategory(v: string): v is ColumnCategory {
  return COLUMN_CATEGORIES.some((c) => c.id === v);
}
