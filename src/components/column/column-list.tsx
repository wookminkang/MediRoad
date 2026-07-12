import { EmptyState } from "@/components/ui/empty-state";
import type { Column } from "@/types/column";

import { ColumnCard } from "./column-card";

/** 칼럼/브리핑 목록 (카드 그리드) — 빈 결과는 EmptyState. basePath로 공용. */
export function ColumnList({
  columns,
  basePath = "/health",
  emptyTitle = "칼럼이 없어요",
}: {
  columns: Column[];
  basePath?: string;
  emptyTitle?: string;
}) {
  if (columns.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description="다른 키워드나 카테고리로 찾아보세요."
      />
    );
  }

  return (
    <ol className="grid grid-cols-2 gap-x-4 gap-y-6">
      {columns.map((c) => (
        <li key={c.id}>
          <ColumnCard column={c} basePath={basePath} />
        </li>
      ))}
    </ol>
  );
}
