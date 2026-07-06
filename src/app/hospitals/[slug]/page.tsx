import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  getAllHospitalIds,
  getHospitalBySlug,
  getRelatedHospitals,
} from "@/api/hospital";
import { getHospitalPosts } from "@/api/hospital-post";
import { HospitalDetail } from "@/components/hospital/hospital-detail";
import { HospitalPostList } from "@/components/hospital/hospital-post-list";
import { PageContainer } from "@/components/ui/page-container";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { hospitalKeywords } from "@/lib/hospital";
import {
  buildBreadcrumbLd,
  buildFaqLd,
  buildMedicalClinicLd,
} from "@/lib/seo/hospital-jsonld";

type Params = Promise<{ slug: string }>;

// 78k건 → 빌드 시 전부 생성 불가. 첫 요청 시 on-demand 렌더 후 ISR 캐시.
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  const ids = await getAllHospitalIds(); // Supabase면 [] (mock일 때만 목록 = slug)
  return ids.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const h = await getHospitalBySlug(decodeURIComponent((await params).slug));
  if (!h) {
    return { title: "병원을 찾을 수 없어요", robots: { index: false, follow: false } };
  }

  const url = `${SITE_URL}/hospitals/${h.slug}`;
  const sido = h.region.sido;
  const sigungu = h.region.sigungu;
  const deptTop =
    h.departments.slice(0, 4).join(", ") +
    (h.departments.length > 4 ? " 등" : "");
  const station = h.nearestStation ? ` ${h.nearestStation.name} 인근.` : "";
  const stationName = h.nearestStation ? `${h.nearestStation.name} ` : "";

  // 제목: "{병원명} | {구} {역} {유형} | 진료시간·전화번호·위치·진료과목"
  // (병원명 선두 → 병원명 검색 매칭 강화. layout template "| 메디로드"는 absolute로 우회)
  const title =
    h.seo?.title ??
    `${h.name} | ${sigungu} ${stationName}${h.type} | 진료시간·전화번호·위치·진료과목`;

  // 설명: 병원명·지역·유형·주요 진료과목·역 (지역 중복 제거, ~150자 간결)
  const description =
    h.seo?.description ??
    `${h.name} - ${sigungu} ${h.type}.${deptTop ? ` ${deptTop} 진료.` : ""}${station} 위치·진료시간·연락처·길찾기를 메디로드에서 확인하세요.`;

  const keywords = h.seo?.keywords ?? hospitalKeywords(h);
  const image = h.seo?.ogImage ?? h.photos?.find((p) => p.isPrimary)?.url ?? h.photos?.[0]?.url;

  return {
    title: { absolute: title }, // "| 메디로드" 접미 제거(정확한 형식만 출력)
    description,
    keywords,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: { canonical: url },
    robots: { index: !h.seo?.noindex, follow: true },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      ...(image && {
        images: [{ url: image, alt: `${h.name} ${h.type} 사진` }],
      }),
    },
    other: {
      "geo.region": "KR",
      "geo.placename": `${sido} ${sigungu}`,
      "geo.position": `${h.location.lat};${h.location.lng}`,
      ICBM: `${h.location.lat}, ${h.location.lng}`,
      coverage: `${sido} ${sigungu}`,
      copyright: SITE_NAME,
      "article:section": "병원 상세",
    },
  };
}

export default async function HospitalDetailPage({
  params,
}: {
  params: Params;
}) {
  const slug = decodeURIComponent((await params).slug);
  const h = await getHospitalBySlug(slug);
  if (!h) notFound();

  // 옛 id(또는 비정규) URL로 들어오면 canonical slug로 301
  if (slug !== h.slug) permanentRedirect(`/hospitals/${h.slug}`);

  const related = await getRelatedHospitals(h);
  const posts = await getHospitalPosts(h.id);

  const jsonLd = [
    buildMedicalClinicLd(h),
    buildBreadcrumbLd(h),
    buildFaqLd(h),
  ].filter(Boolean);

  return (
    <PageContainer maxWidth="max-w-7xl">
      <HospitalDetail hospital={h} related={related} />
      <HospitalPostList hospital={h} posts={posts} />
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
