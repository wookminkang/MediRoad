import { Text } from "@seed-design/react";

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
export function ColumnBoard({ active, columns, total }: Props) {
  return (
    <>
      {/*
       * 제목·검색은 헤더 앱바("건강정보" + 검색 아이콘)가 들고 있으므로 화면에 다시 그리지 않는다.
       * H1은 문서에 있어야 하므로(SEO) 화면에서만 감춘다.
       */}
      <Text as="h1" textStyle="t8Bold" className="sr-only">
        건강정보 — 증상·질환·관리법
      </Text>

      {/* 카테고리 탭 — 헤더 아래 스티키 */}
      <div className="sticky top-0 z-30 -mx-4 bg-white px-4 pb-2 pt-1">

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
            variant="underline"
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
