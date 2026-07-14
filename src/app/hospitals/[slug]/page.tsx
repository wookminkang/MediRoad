import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  getAllHospitalIds,
  getHospitalBySlug,
  getRelatedHospitals,
} from "@/api/hospital";
import { getHospitalPosts } from "@/api/hospital-post";
import { HospitalDetail } from "@/components/hospital/hospital-detail";
import { PageContainer } from "@/components/ui/page-container";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { eunNeun } from "@/lib/hospital";
import { buildHospitalFaqs } from "@/lib/hospital-faq";
import {
  buildBreadcrumbLd,
  buildFaqLd,
  buildMedicalClinicLd,
} from "@/lib/seo/hospital-jsonld";

type Params = Promise<{ slug: string }>;

// 78k건 → 빌드 시 전부 생성 불가. 첫 요청 시 on-demand 렌더 후 ISR 캐시.
export const dynamicParams = true;
// 이 페이지가 병원의 포스트 목록을 들고 있다. 예약 발행 글이 그날 안에 목록에
// 올라오도록 한 시간으로 줄인다(하루로 두면 최대 24시간 늦게 뜬다).
export const revalidate = 3600;

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
  const sigungu = h.region.sigungu;
  const st = h.nearestStation?.name?.trim();
  const station = st ? (st.endsWith("역") ? st : `${st}역`) : ""; // "발산역"

  // 제목: "{병원명} | {구} {역} {유형}"  (병원명 선두 → 병원명 검색 매칭)
  const title =
    h.seo?.title ?? `${h.name} | ${[sigungu, station, h.type].filter(Boolean).join(" ")}`;

  // 설명: "{병원명}은/는 {구} {역}에 위치한 {유형}입니다. 진료시간은 …입니다. 지역은 {시도} {구}입니다."
  const weekday = h.hours?.find((d) => d.day === 1 && !d.closed && d.open && d.close);
  const hoursStr = weekday ? ` 진료시간은 ${weekday.open} ~ ${weekday.close}입니다.` : "";
  const place = station ? `${sigungu} ${station}` : sigungu;
  const description =
    h.seo?.description ??
    `${h.name}${eunNeun(h.name)} ${place}에 위치한 ${h.type}입니다.${hoursStr}`;

  const image = h.seo?.ogImage ?? h.photos?.find((p) => p.isPrimary)?.url ?? h.photos?.[0]?.url;

  return {
    title: { absolute: title }, // "| 메디로드" 접미 없이 정확한 형식만
    description,
    keywords:
      h.seo?.keywords ??
      [
        h.name,
        `${sigungu} ${h.type}`,
        ...(station ? [`${sigungu} ${station} ${h.type}`] : []),
        "메디로드",
      ],
    alternates: { canonical: url },
    robots: { index: !h.seo?.noindex, follow: true },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      ...(image && { images: [{ url: image, alt: `${h.name} ${h.type}` }] }),
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

  // 관리자 입력 FAQ가 없으면 공공데이터에서 자동 생성 — 화면·FAQPage JSON-LD 공용
  const hospital = h.faqs?.length ? h : { ...h, faqs: buildHospitalFaqs(h) };

  const jsonLd = [
    buildMedicalClinicLd(hospital),
    buildBreadcrumbLd(hospital),
    buildFaqLd(hospital),
  ].filter(Boolean);

  return (
    <PageContainer maxWidth="max-w-7xl">
      <HospitalDetail hospital={hospital} related={related} posts={posts} />
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
