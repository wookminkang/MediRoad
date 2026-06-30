import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllColumnIds, getColumnById } from "@/api/column";
import { ColumnDetail } from "@/components/column/column-detail";
import { PageContainer } from "@/components/ui/page-container";
import { anyCategoryLabel } from "@/constants/briefing";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import {
  buildBriefingArticleLd,
  buildBriefingBreadcrumbLd,
} from "@/lib/seo/briefing-jsonld";
import { buildFaqLd } from "@/lib/seo/faq";

type Params = Promise<{ id: string }>;

export const revalidate = 3600;

export async function generateStaticParams() {
  const ids = await getAllColumnIds("briefing");
  return ids.map((id) => ({ id }));
}

/** briefing 콘텐츠만 허용 (다른 kind면 404) */
async function getBriefing(id: string) {
  const c = await getColumnById(id);
  return c && c.kind === "briefing" ? c : null;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const c = await getBriefing((await params).id);
  if (!c) {
    return {
      title: "브리핑을 찾을 수 없어요",
      robots: { index: false, follow: false },
    };
  }
  const url = `${SITE_URL}/briefing/${c.id}`;
  const title = c.seo?.title ?? c.title;
  const description = c.seo?.description ?? c.excerpt;

  return {
    title,
    description,
    keywords: c.seo?.keywords ?? [
      anyCategoryLabel(c.category),
      "메디브리핑",
      "의료 이슈",
      ...(c.tags ?? []),
    ],
    authors: [{ name: c.author }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: { canonical: url },
    robots: { index: !c.seo?.noindex, follow: true },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      publishedTime: c.publishedAt,
      modifiedTime: c.updatedAt,
      ...(c.thumbnail && { images: [{ url: c.thumbnail }] }),
    },
    other: {
      copyright: SITE_NAME,
      "article:section": anyCategoryLabel(c.category),
    },
  };
}

export default async function BriefingDetailPage({ params }: { params: Params }) {
  const c = await getBriefing((await params).id);
  if (!c) notFound();

  const jsonLd = [
    buildBriefingArticleLd(c),
    buildBriefingBreadcrumbLd(c),
    ...(c.faqs?.length ? [buildFaqLd(c.faqs)] : []),
  ];

  return (
    <PageContainer maxWidth="max-w-5xl">
      <ColumnDetail column={c} basePath="/briefing" backLabel="메디브리핑 더 보기" />
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
    </PageContainer>
  );
}
