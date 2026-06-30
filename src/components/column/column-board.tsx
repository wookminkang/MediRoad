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

/** 칼럼 게시판 (목록·카테고리 공용) — 헤더 + 검색 + 탭 + 목록. (WIREFRAME 4-6) */
export function ColumnBoard({ active, columns, total, q }: Props) {
  return (
    <>
      {/* 페이지 헤더 — 타이틀 + 보조문구 */}
      <header className="mb-7">
        <Text as="h1" textStyle="t9Bold">
          건강정보
        </Text>
        <div className="mt-4">
          <Text as="p" textStyle="t5Regular" style={{ color: "#9CA3AF" }}>
            의료진이 감수한 믿을 수 있는 건강 정보 — 증상·질환·관리법을 쉽게 풀어드립니다.
          </Text>
        </div>
      </header>

      <HeroSearch
        action="/health"
        placeholder="궁금한 증상·질환을 검색해보세요"
        defaultValue={q}
      />

      <nav aria-label="카테고리" className="mt-3">
        <CategoryTabs active={active} />
      </nav>

      <section aria-labelledby="list" className="mt-8">
        <Text as="h2" id="list" textStyle="t6Bold">
          {active ? `${categoryLabel(active)} 칼럼` : "전체 칼럼"} {total}건
        </Text>
        <div className="mt-3">
          <ColumnList columns={columns} />
        </div>
      </section>
    </>
  );
}
