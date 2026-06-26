import { Text } from "@seed-design/react";

import { HeroSearch } from "@/components/search/hero-search";
import { categoryLabel, type ColumnCategory } from "@/constants/column";
import type { Column } from "@/types/column";

import { CategoryTabs } from "./category-tabs";
import { ColumnList } from "./column-list";

type Props = {
  active?: ColumnCategory;
  columns: Column[];
  total: number;
  q?: string;
};

/** 칼럼 게시판 (목록·카테고리 공용) — 검색 + 탭 + 목록. (WIREFRAME 4-6) */
export function ColumnBoard({ active, columns, total, q }: Props) {
  return (
    <>
      <HeroSearch
        action="/health"
        placeholder="궁금한 증상·질환을 검색해보세요"
        defaultValue={q}
      />

      <nav aria-label="카테고리" className="mt-3">
        <CategoryTabs active={active} />
      </nav>

      <section aria-labelledby="list" className="mt-8">
        <Text as="h1" id="list" textStyle="t8Bold">
          {active ? `${categoryLabel(active)} 칼럼` : "전체 칼럼"} {total}건
        </Text>
        <div className="mt-3">
          <ColumnList columns={columns} />
        </div>
      </section>
    </>
  );
}
