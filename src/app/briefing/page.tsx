import type { Metadata } from "next";

import { getColumnsCached } from "@/api/column";
import { BriefingBoard } from "@/components/briefing/briefing-board";
import { PageContainer } from "@/components/ui/page-container";
import {
  isBriefingCategory,
  type BriefingCategory,
} from "@/constants/briefing";
import { SITE_URL } from "@/constants/site";

// ISR — 1시간마다 재생성(새 브리핑 반영)
export const revalidate = 3600;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function toStr(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s : undefined;
}
function toCategory(
  v: string | string[] | undefined,
): BriefingCategory | undefined {
  const s = toStr(v);
  return s && isBriefingCategory(s) ? s : undefined;
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
    title: q ? `"${q}" 브리핑 검색 결과` : "메디브리핑",
    description:
      "의료·건강 이슈를 한눈에 — 의료 정책·제도, 건강 트렌드, 공공 건강정보를 정리해 전하는 메디브리핑.",
    robots: { index: !q && !category, follow: true },
    alternates: { canonical: `${SITE_URL}/briefing` },
  };
}

export default async function BriefingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = toStr(sp.q);
  const category = toCategory(sp.category);
  const { items, total } = await getColumnsCached({
    kind: "briefing",
    q,
    category,
    pageSize: 50,
  });

  return (
    <PageContainer maxWidth="max-w-7xl">
      <BriefingBoard active={category} items={items} total={total} q={q} />
    </PageContainer>
  );
}
