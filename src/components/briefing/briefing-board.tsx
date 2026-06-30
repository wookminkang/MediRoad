import { Text } from "@seed-design/react";

import { ColumnList } from "@/components/column/column-list";
import { HeroSearch } from "@/components/search/hero-search";
import { briefingCategoryLabel, type BriefingCategory } from "@/constants/briefing";
import type { Column } from "@/types/column";

import { BriefingTabs } from "./briefing-tabs";

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
      {/* 페이지 헤더 — 타이틀 + 보조문구 */}
      <header className="mb-7">
        <Text as="h1" textStyle="t9Bold">
          메디브리핑
        </Text>
        <div className="mt-2">
          <Text as="p" textStyle="t5Regular" style={{ color: "#6B7280" }}>
            의료·건강 이슈를 한눈에 — 정책·트렌드·공공 건강정보를 정리해 전합니다.
          </Text>
        </div>
      </header>

      <HeroSearch
        action="/briefing"
        placeholder="의료 정책·건강 이슈를 검색해보세요"
        defaultValue={q}
      />

      <nav aria-label="카테고리" className="mt-3">
        <BriefingTabs active={active} />
      </nav>

      <section aria-labelledby="briefing-list" className="mt-8">
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
