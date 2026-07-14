import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { dehydrate, HydrationBoundary, type InfiniteData } from "@tanstack/react-query";

import { getHospitals } from "@/api/hospital";
import { AreaLanding } from "@/components/hospital/area-landing";
import { PageContainer } from "@/components/ui/page-container";
import {
  AMBIGUOUS_SIGUNGU,
  findAreaRegion,
  nearbyRegionsOf,
} from "@/constants/area-regions";
import { FEATURED_REGIONS } from "@/constants/region";
import { SITE_URL } from "@/constants/site";
import { buildAreaFaqs, buildAreaIntro, departmentsOf } from "@/lib/area";
import { hospitalKeys } from "@/lib/query-keys";
import { getQueryClient } from "@/lib/react-query";
import {
  buildAreaBreadcrumbLd,
  buildAreaCollectionLd,
  buildFaqLd,
} from "@/lib/seo/area-jsonld";
import { topStationsOf } from "@/lib/station-landing";
import type { Paginated } from "@/types";
import type { Hospital, HospitalSearchFilters } from "@/types/hospital";

type Params = Promise<{ region: string }>;

// 전국 시군구 지원: 주요 지역은 빌드 시 생성, 그 외는 on-demand(ISR). 병원 없는 지역은 404.
export const dynamicParams = true;
export const revalidate = 86400;
const FIRST_PAGE = 24;

export async function generateStaticParams() {
  return FEATURED_REGIONS.map((region) => ({ region }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const slug = decodeURIComponent((await params).region);
  const reg = findAreaRegion(slug);
  const label = reg?.label ?? slug;
  return {
    title: `${label} 병원`, // template가 "| 메디로드" 자동 부착
    description: `${label} 병원·의원을 진료과목별로 찾아보세요. 위치·진료시간·연락처 안내.`,
    alternates: { canonical: `${SITE_URL}/area/${slug}` },
    // 레지스트리에 없는 지역(병원 100곳 미만)은 페이지는 열어두되 색인하지 않는다.
    // 얇은 페이지가 대량 색인되면 사이트 전체 평가가 깎인다.
    robots: { index: Boolean(reg), follow: true },
  };
}

export default async function AreaRegionPage({ params }: { params: Params }) {
  const slug = decodeURIComponent((await params).region);

  /**
   * 시군구 이름은 시도끼리 겹친다. '서구'만 오면 부산·대구·인천·광주·대전 병원이
   * 한 페이지에 뒤섞인다 — 조회가 이름만으로 걸리기 때문이다. 그런 주소는 열지 않는다.
   * 겹치는 지역은 '/area/부산-서구'처럼 시도를 붙인 주소로만 들어온다.
   */
  if (AMBIGUOUS_SIGUNGU.includes(slug)) notFound();

  const reg = findAreaRegion(slug);
  const region = reg?.sigungu ?? slug;
  const label = reg?.label ?? slug;
  const filters: HospitalSearchFilters = reg
    ? { region, sido: reg.sido }
    : { region };

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: hospitalKeys.list(filters),
    queryFn: () => getHospitals({ ...filters, page: 1, pageSize: FIRST_PAGE }),
    initialPageParam: 1,
  });
  const first = queryClient.getQueryData(hospitalKeys.list(filters)) as
    | InfiniteData<Paginated<Hospital>>
    | undefined;
  const items = first?.pages?.[0]?.items ?? [];
  if (items.length === 0) notFound(); // 존재하지 않는 지역 = soft-404 방지

  // 진료과목·역세권 칩용 표본 — 겹치는 이름이면 시도까지 걸어야 다른 도시가 안 섞인다
  const { items: sample } = await getHospitals({ ...filters, pageSize: 60 });
  // 진료과목은 레지스트리에 이미 구해져 있다(전량 기준). 표본으로 다시 세면 빠지는 과목이 생긴다.
  const regionDepartments = reg?.departments ?? departmentsOf(sample);
  const faqs = buildAreaFaqs(label);

  const jsonLd = [
    buildAreaCollectionLd(label, undefined, items),
    buildAreaBreadcrumbLd(label),
    buildFaqLd(faqs),
  ];

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AreaLanding
          slug={slug}
          region={label}
          nearbyRegions={nearbyRegionsOf(slug)}
          filters={filters}
          regionDepartments={regionDepartments}
          stations={topStationsOf(sample)}
          intro={buildAreaIntro(label)}
          faqs={faqs}
        />
      </HydrationBoundary>
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
