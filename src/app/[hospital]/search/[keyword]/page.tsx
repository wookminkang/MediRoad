import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getHospitalBySlug } from "@/api/hospital";
import { getHospitalPosts } from "@/api/hospital-post";
import { HospitalDetail } from "@/components/hospital/hospital-detail";
import { PageContainer } from "@/components/ui/page-container";
import {
  findKeywordPage,
  type HospitalKeywordPage,
} from "@/constants/hospital-keyword-pages";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { buildAutoDescription } from "@/lib/hospital";
import { buildHospitalFaqs } from "@/lib/hospital-faq";
import { buildMedicalClinicLd } from "@/lib/seo/hospital-jsonld";
import type { Hospital } from "@/types/hospital";

type Params = Promise<{ hospital: string; keyword: string }>;

// 큐레이션 목록에 있는 키워드만 렌더(그 외 404). on-demand ISR(병원 상세와 동일).
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

async function load(
  params: Params,
): Promise<{ h: Hospital; entry: HospitalKeywordPage; slug: string; keyword: string } | null> {
  const { hospital, keyword: kw } = await params;
  const slug = decodeURIComponent(hospital);
  const keyword = decodeURIComponent(kw);
  const entry = findKeywordPage(slug, keyword);
  if (!entry) return null; // 큐레이션에 없는 키워드 → 404
  const h = await getHospitalBySlug(slug);
  if (!h) return null;
  return { h, entry, slug, keyword };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const data = await load(params);
  if (!data) {
    return { title: "페이지를 찾을 수 없어요", robots: { index: false, follow: false } };
  }
  const { h, entry, slug, keyword } = data;
  const url = `${SITE_URL}/${encodeURIComponent(slug)}/search/${encodeURIComponent(keyword)}`;
  const description = entry.intro ?? buildAutoDescription(h);
  return {
    title: { absolute: `${keyword} | ${h.name}` },
    description,
    keywords: [keyword, h.name, `${h.region.sigungu} ${h.type}`],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url,
      title: `${keyword} | ${h.name}`,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
    },
  };
}

export default async function HospitalKeywordPage({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();
  const { h, entry, slug, keyword } = data;

  const posts = await getHospitalPosts(h.id);
  // FAQ 없으면 공공데이터에서 자동 생성(상세와 동일 규칙)
  const hospital = h.faqs?.length ? h : { ...h, faqs: buildHospitalFaqs(h) };
  const intro = entry.intro ?? buildAutoDescription(h);
  const detailUrl = `/hospitals/${encodeURIComponent(h.slug)}`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: h.name, item: `${SITE_URL}${detailUrl}` },
      {
        "@type": "ListItem",
        position: 3,
        name: keyword,
        item: `${SITE_URL}/${encodeURIComponent(slug)}/search/${encodeURIComponent(keyword)}`,
      },
    ],
  };
  const jsonLd = [buildMedicalClinicLd(h), breadcrumbLd];

  return (
    <PageContainer maxWidth="max-w-7xl">
      {/* 키워드 히어로 */}
      <div className="mb-2">
        <nav aria-label="경로 안내" className="text-sm text-muted">
          <Link href="/" className="hover:underline">
            홈
          </Link>
          {" › "}
          <Link href={detailUrl} className="hover:underline">
            {h.name}
          </Link>
          {" › "}
          <span className="text-neutral">{keyword}</span>
        </nav>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral sm:text-4xl">
          {keyword}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {h.name} · {h.region.sigungu} {h.type}
          {h.nearestStation ? ` · ${h.nearestStation.name}` : ""}
        </p>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-neutral">
          {intro}
        </p>
        <div className="mt-4">
          <Link
            href={detailUrl}
            className="text-sm font-bold text-brand hover:underline"
            style={{ color: "var(--seed-color-fg-brand)" }}
          >
            {h.name} 전체 정보 보기 →
          </Link>
        </div>
      </div>

      {/* 병원 상세 재사용 — 의료진·진료시간·지도·사진·포스트·FAQ (병원명은 h2로) */}
      <div className="mt-6 border-t border-black/[0.06] pt-6">
        <HospitalDetail hospital={hospital} posts={posts} headingAs="h2" />
      </div>

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
