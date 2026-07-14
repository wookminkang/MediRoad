import type { Metadata } from "next";

import { getColumnsCached } from "@/api/column";
import { ColumnBoard } from "@/components/column/column-board";
import { PageContainer } from "@/components/ui/page-container";
import { isColumnCategory, type ColumnCategory } from "@/constants/column";
import { SITE_URL } from "@/constants/site";

// ISR — 1시간마다 백그라운드 재생성(발행 후 재배포 없이 새 글 반영)
export const revalidate = 3600;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function toStr(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s : undefined;
}
function toCategory(
  v: string | string[] | undefined,
): ColumnCategory | undefined {
  const s = toStr(v);
  return s && isColumnCategory(s) ? s : undefined;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = toStr(sp.q);
  const category = toCategory(sp.category);
  return {
    title: q ? `"${q}" 건강정보 검색 결과` : "건강정보",
    description: "의료진이 감수한 믿을 수 있는 건강 정보 — 증상·질환·관리법.",
    // 검색(?q)·카테고리(?category) 필터 변형은 noindex, 전체 목록만 index. (SEO §1)
    robots: { index: !q && !category, follow: true },
    alternates: { canonical: `${SITE_URL}/health` },
  };
}

export default async function HealthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = toStr(sp.q);
  const category = toCategory(sp.category);
  const { items, total } = await getColumnsCached({ q, category, pageSize: 50 });

  return (
    <PageContainer maxWidth="max-w-7xl" flushTop>
      <ColumnBoard active={category} columns={items} total={total} q={q} />
    </PageContainer>
  );
}
