import { Text } from "@seed-design/react";

import { ColumnList } from "@/components/column/column-list";
import { TabRow } from "@/components/search/tab-row";
import {
  BRIEFING_CATEGORIES,
  briefingCategoryLabel,
  type BriefingCategory,
} from "@/constants/briefing";
import type { Column } from "@/types/column";

type Props = {
  active?: BriefingCategory;
  items: Column[];
  total: number;
  q?: string;
};

/** 메디브리핑 게시판 — 소개 + 검색 + 카테고리 탭 + 목록. */
export function BriefingBoard({ active, items, total }: Props) {
  return (
    <>
      {/* 제목·검색은 헤더 앱바가 들고 있다. H1은 SEO용으로만 남긴다 (health와 동일 규칙) */}
      <Text as="h1" textStyle="t8Bold" className="sr-only">
        메디브리핑 — 의료 정책·건강 이슈
      </Text>

      {/* 카테고리 탭 — 헤더 아래 스티키 */}
      <div className="sticky top-0 z-30 -mx-4 bg-white px-4 pb-2 pt-1">

        <nav aria-label="카테고리" className="mt-1">
          <TabRow
            items={[
              { id: "", label: "전체", href: "/briefing" },
              ...BRIEFING_CATEGORIES.map((c) => ({
                id: c.id,
                label: c.label,
                href: `/briefing?category=${c.id}`,
              })),
            ]}
            activeId={active ?? ""}
            variant="underline"
          />
        </nav>
      </div>

      <section aria-labelledby="briefing-list" className="mt-4">
        <Text as="h2" id="briefing-list" textStyle="t6Bold">
          {active ? `${briefingCategoryLabel(active)}` : "전체 브리핑"} {total}건
        </Text>
        <div className="mt-3">
          <ColumnList
            columns={items}
            basePath="/briefing"
            emptyTitle="브리핑이 없어요"
          />
        </div>
      </section>
    </>
  );
}
