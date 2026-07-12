import { Text } from "@seed-design/react";

import { ColumnList } from "@/components/column/column-list";
import { SearchTrigger } from "@/components/search/search-trigger";
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
export function BriefingBoard({ active, items, total, q }: Props) {
  return (
    <>
      {/* 제목 + 검색 아이콘 + 카테고리 탭 — 스티키 (health와 동일 규칙) */}
      <div className="sticky top-0 z-30 -mx-4 bg-white px-4 pb-2 pt-1 md:top-14 md:-mx-6 md:px-6">
        {/* 제목 + 검색 아이콘 줄 — 모바일에서는 헤더 앱바가 대신하므로 감춘다 (health와 동일 규칙) */}
        <div className="hidden items-center justify-between gap-2 md:flex">
          <div className="min-w-0">
            <Text as="h1" textStyle="t8Bold">
              메디브리핑
            </Text>
            <p className="mt-0.5 text-sm text-muted">
              의료·건강 이슈를 한눈에, 정책·트렌드·공공 건강정보를 정리해
              전해드려요.
            </p>
          </div>
          <div>
            <SearchTrigger
              action="/briefing"
              placeholder="의료 정책·건강 이슈를 검색해보세요"
              q={q}
              suggestions={BRIEFING_CATEGORIES.map((c) => c.label)}
            />
          </div>
        </div>

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
