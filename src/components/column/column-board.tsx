import { Text } from "@seed-design/react";

import { SearchTrigger } from "@/components/search/search-trigger";
import { TabRow } from "@/components/search/tab-row";
import {
  categoryLabel,
  COLUMN_CATEGORIES,
  type ColumnCategory,
} from "@/constants/column";
import type { Column } from "@/types/column";

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
      {/* 제목 + 검색 아이콘 + 카테고리 탭 — 헤더(h-14) 아래 스티키 */}
      <div className="sticky top-14 z-30 -mx-4 bg-white px-4 pb-2 pt-1 md:-mx-6 md:px-6">
        {/*
         * 제목 + 검색 아이콘 줄 — 모바일에서는 통째로 감춘다.
         * 헤더 앱바가 이미 "건강정보" 제목과 검색 아이콘을 들고 있어 그대로 두면 두 번 나온다.
         * h1은 DOM에 남으므로(display:none) SEO에는 영향이 없다.
         */}
        <div className="hidden items-center justify-between gap-2 md:flex">
          <div className="min-w-0">
            <Text as="h1" textStyle="t8Bold">
              건강정보
            </Text>
            <p className="mt-0.5 text-sm text-muted">
              의료진이 감수한 믿을 수 있는 건강 정보, 증상·질환·관리법을 쉽게
              풀어드려요.
            </p>
          </div>
          <div>
            <SearchTrigger
              action="/health"
              placeholder="궁금한 증상·질환을 검색해보세요"
              q={q}
              suggestions={COLUMN_CATEGORIES.map((c) => c.label)}
            />
          </div>
        </div>

        <nav aria-label="카테고리" className="mt-1">
          <TabRow
            items={[
              { id: "", label: "전체", href: "/health" },
              ...COLUMN_CATEGORIES.map((c) => ({
                id: c.id,
                label: c.label,
                href: `/health?category=${c.id}`,
              })),
            ]}
            activeId={active ?? ""}
          />
        </nav>
      </div>

      <section aria-labelledby="list" className="mt-4">
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
