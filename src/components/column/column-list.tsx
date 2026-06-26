import { EmptyState } from "@/components/ui/empty-state";
import type { Column } from "@/types/column";

import { ColumnCard } from "./column-card";

/** 칼럼 목록 (카드 그리드) — 빈 결과는 EmptyState. (WIREFRAME 4-6) */
export function ColumnList({ columns }: { columns: Column[] }) {
  if (columns.length === 0) {
    return (
      <EmptyState
        title="칼럼이 없어요"
        description="다른 키워드나 카테고리로 찾아보세요."
      />
    );
  }

  return (
    <ol className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
      {columns.map((c) => (
        <li key={c.id}>
          <ColumnCard column={c} />
        </li>
      ))}
    </ol>
  );
}
