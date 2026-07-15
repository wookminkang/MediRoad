import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllColumnIds, getColumnById } from "@/api/column";
import { ColumnDetail } from "@/components/column/column-detail";
import { PageContainer } from "@/components/ui/page-container";
import { anyCategoryLabel } from "@/constants/briefing";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import {
  buildColumnArticleLd,
  buildColumnBreadcrumbLd,
} from "@/lib/seo/column-jsonld";
import { buildFaqLd } from "@/lib/seo/faq";

type Params = Promise<{ id: string }>;

// ISR — 새 글은 첫 요청 시 on-demand, 기존 글은 1시간마다 재생성(재배포 불필요)
export const revalidate = 3600;

export async function generateStaticParams() {
  const ids = await getAllColumnIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const c = await getColumnById((await params).id);
  if (!c) {
    return { title: "칼럼을 찾을 수 없어요", robots: { index: false, follow: false } };
  }
  const url = `${SITE_URL}/health/${c.id}`;
  const title = c.seo?.title ?? c.title;
  const description = c.seo?.description ?? c.excerpt;

  return {
    title,
    description,
    keywords: c.seo?.keywords ?? [
      anyCategoryLabel(c.category),
      "건강정보",
      ...(c.tags ?? []),
    ],
    // 감수자 개인 이름은 메타데이터에도 넣지 않는다(화면 표시와 동일 방침).
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
      authors: [c.author],
      ...(c.thumbnail && { images: [{ url: c.thumbnail }] }),
    },
    other: {
      copyright: SITE_NAME,
      "article:section": anyCategoryLabel(c.category),
    },
  };
}

export default async function ColumnDetailPage({
  params,
}: {
  params: Params;
}) {
  const c = await getColumnById((await params).id);
  if (!c) notFound();

  const jsonLd = [
    buildColumnArticleLd(c),
    buildColumnBreadcrumbLd(c),
    ...(c.faqs?.length ? [buildFaqLd(c.faqs)] : []),
  ];

  return (
    <PageContainer maxWidth="max-w-5xl">
      <ColumnDetail column={c} />
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
