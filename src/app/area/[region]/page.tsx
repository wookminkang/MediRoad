import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { dehydrate, HydrationBoundary, type InfiniteData } from "@tanstack/react-query";

import { getHospitals } from "@/api/hospital";
import { AreaLanding } from "@/components/hospital/area-landing";
import { PageContainer } from "@/components/ui/page-container";
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
  const region = decodeURIComponent((await params).region);
  const title = `${region} 병원`; // template가 "| 메디로드" 자동 부착
  return {
    title,
    description: `${region} 병원·의원을 진료과목별로 찾아보세요. 위치·진료시간·연락처 안내.`,
    alternates: { canonical: `${SITE_URL}/area/${region}` },
    robots: { index: true, follow: true },
  };
}

export default async function AreaRegionPage({ params }: { params: Params }) {
  const region = decodeURIComponent((await params).region);
  const filters: HospitalSearchFilters = { region };

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

  // 진료과목·역세권 칩용 표본
  const { items: sample } = await getHospitals({ region, pageSize: 60 });
  const regionDepartments = departmentsOf(sample);
  const faqs = buildAreaFaqs(region);

  const jsonLd = [
    buildAreaCollectionLd(region, undefined, items),
    buildAreaBreadcrumbLd(region),
    buildFaqLd(faqs),
  ];

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AreaLanding
          region={region}
          filters={filters}
          regionDepartments={regionDepartments}
          stations={topStationsOf(sample)}
          intro={buildAreaIntro(region)}
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
