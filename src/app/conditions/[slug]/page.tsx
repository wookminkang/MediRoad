import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getAllConditionIds,
  getConditionBySlug,
  getConditionRelated,
} from "@/api/condition";
import { ConditionDetail } from "@/components/condition/condition-detail";
import { PageContainer } from "@/components/ui/page-container";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import {
  buildConditionBreadcrumbLd,
  buildConditionFaqLd,
  buildConditionLd,
} from "@/lib/seo/condition-jsonld";

type Params = Promise<{ slug: string }>;

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const ids = await getAllConditionIds();
  return ids.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const c = await getConditionBySlug(decodeURIComponent((await params).slug));
  if (!c) {
    return { title: "질환 정보를 찾을 수 없어요", robots: { index: false, follow: false } };
  }
  const url = `${SITE_URL}/conditions/${c.id}`;
  const title = c.seo?.title ?? `${c.name} — 증상·원인과 병원 찾기`;
  const description =
    c.seo?.description ??
    `${c.name}의 증상·원인과 어느 병원(${c.departments.join(", ")})에 가야 할지 안내해 드려요.`;
  return {
    title,
    description,
    keywords: c.seo?.keywords ?? [c.name, ...c.symptoms, ...c.departments],
    alternates: { canonical: url },
    robots: { index: !c.seo?.noindex, follow: true },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      ...(c.seo?.ogImage && { images: [{ url: c.seo.ogImage, alt: c.name }] }),
    },
  };
}

export default async function ConditionPage({ params }: { params: Params }) {
  const slug = decodeURIComponent((await params).slug);
  const c = await getConditionBySlug(slug);
  if (!c) notFound();

  const { posts, hospitals } = await getConditionRelated(c.name);

  const jsonLd = [
    buildConditionLd(c),
    buildConditionBreadcrumbLd(c),
    buildConditionFaqLd(c),
  ].filter(Boolean);

  return (
    <PageContainer maxWidth="max-w-5xl">
      <ConditionDetail condition={c} posts={posts} hospitals={hospitals} />
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
