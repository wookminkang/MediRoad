import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getHospitalBySlug } from "@/api/hospital";
import { getHospitalPost } from "@/api/hospital-post";
import { HospitalPostDetail } from "@/components/hospital/hospital-post-detail";
import { PageContainer } from "@/components/ui/page-container";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import {
  buildHospitalPostLd,
  buildPostBreadcrumbLd,
  buildPostFaqLd,
} from "@/lib/seo/hospital-post-jsonld";
import { buildPostMeta } from "@/lib/seo/hospital-post-meta";

type Params = Promise<{ slug: string; postId: string }>;

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  return []; // ISR on-demand
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, postId } = await params;
  const post = await getHospitalPost(postId);
  const h = await getHospitalBySlug(decodeURIComponent(slug));
  if (!post || !h || post.hospitalId !== h.id) {
    return { title: "글을 찾을 수 없어요", robots: { index: false, follow: false } };
  }

  const url = `${SITE_URL}/hospitals/${h.slug}/posts/${post.id}`;
  // 지역·병원유형·진료과목·시설명을 결합한 SEO/GEO 메타 자동 보강
  const { title, description, keywords } = buildPostMeta(h, post);
  const image = post.seo?.ogImage ?? post.thumbnail;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: { index: !post.seo?.noindex, follow: true },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      ...(image && { images: [{ url: image, alt: post.title }] }),
    },
  };
}

export default async function HospitalPostPage({
  params,
}: {
  params: Params;
}) {
  const { slug, postId } = await params;
  const post = await getHospitalPost(postId);
  const h = await getHospitalBySlug(decodeURIComponent(slug));
  // 글이 없거나, 글이 이 병원 소속이 아니면 404
  if (!post || !h || post.hospitalId !== h.id) notFound();

  const jsonLd = [
    buildHospitalPostLd(h, post),
    buildPostBreadcrumbLd(h, post),
    buildPostFaqLd(post),
  ].filter(Boolean);

  return (
    <PageContainer maxWidth="max-w-5xl">
      <HospitalPostDetail hospital={h} post={post} />
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
