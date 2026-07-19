import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { dehydrate, HydrationBoundary, type InfiniteData } from "@tanstack/react-query";

import { getHospitals } from "@/api/hospital";
import { StationLanding } from "@/components/hospital/station-landing";
import { PageContainer } from "@/components/ui/page-container";
import { isPartnerStation } from "@/constants/partner-stations";
import { getNeighborDistricts } from "@/constants/region-neighbors";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { departmentsOf } from "@/lib/area";
import { hospitalKeys } from "@/lib/query-keys";
import { getQueryClient } from "@/lib/react-query";
import { buildFaqLd } from "@/lib/seo/area-jsonld";
import {
  buildStationBreadcrumbLd,
  buildStationCollectionLd,
} from "@/lib/seo/station-jsonld";
import { injectPartners } from "@/lib/station-inject";
import {
  buildStationFaqs,
  buildStationIntro,
  cleanStationName,
  nearbyStationsInSigungu,
  stationBase,
  stationSegment,
} from "@/lib/station-landing";
import type { Paginated } from "@/types";
import type { Hospital, HospitalSearchFilters } from "@/types/hospital";

type Params = Promise<{ station: string }>;

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  // 병원 상세와 동일하게 on-demand ISR — 빌드 병렬 프리렌더의 일시 오류 404 굽기를 피한다.
  return [];
}

const FIRST_PAGE = 24;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const station = stationSegment(
    cleanStationName(decodeURIComponent((await params).station)),
  );
  if (!station) return {};

  const url = `${SITE_URL}/near/${station}`;
  // 색인 정책 — 기본 noindex(크롤 예산 보호), 제휴 인근 역만 색인 개방.
  const indexable = isPartnerStation(station);
  return {
    title: { absolute: `${station} 병원 | 주변 병원·의원 진료시간·위치 | ${SITE_NAME}` },
    description: `${station} 주변 병원·의원을 진료과목·위치·진료시간으로 비교하세요. 최근접 역 기준 목록.`,
    keywords: indexable
      ? [`${station} 병원`, `${station} 의원`, `${station} 한의원`]
      : undefined,
    alternates: { canonical: url },
    robots: { index: indexable, follow: true },
    openGraph: {
      type: "website",
      url,
      title: `${station} 병원`,
      description: `${station} 주변 병원·의원 · 위치·진료시간 안내`,
      siteName: SITE_NAME,
      locale: "ko_KR",
    },
  };
}

export default async function StationHubPage({ params }: { params: Params }) {
  const station = stationSegment(
    cleanStationName(decodeURIComponent((await params).station)),
  );
  if (!station) notFound();

  const base = stationBase(station);
  const filters: HospitalSearchFilters = { station: base };
  const key = hospitalKeys.list(filters);

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: key,
    queryFn: () => getHospitals({ ...filters, page: 1, pageSize: FIRST_PAGE }),
    initialPageParam: 1,
  });

  // 큐레이션 제휴 병원을 상단 주입(인근 역 노출)
  await injectPartners(queryClient, key, base);

  const first = queryClient.getQueryData(key) as
    | InfiniteData<Paginated<Hospital>>
    | undefined;
  const items = first?.pages?.[0]?.items ?? [];
  if (items.length === 0) notFound();

  // 진료과목 칩용 표본
  const { items: sample } = await getHospitals({ station: base, pageSize: 60 });
  const stationDepartments = departmentsOf(sample);
  const sigungu = items[0]?.region.sigungu;
  const nearbyStations = nearbyStationsInSigungu(sigungu, station);
  const neighborGus = sigungu ? getNeighborDistricts(sigungu) : [];
  const faqs = buildStationFaqs(station);

  const jsonLd = [
    buildStationCollectionLd(station, undefined, items),
    buildStationBreadcrumbLd(station),
    buildFaqLd(faqs),
  ];

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StationLanding
          station={station}
          filters={filters}
          stationDepartments={stationDepartments}
          sigungu={sigungu}
          nearbyStations={nearbyStations}
          neighborGus={neighborGus}
          intro={buildStationIntro(station)}
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
