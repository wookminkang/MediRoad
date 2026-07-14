import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { dehydrate, HydrationBoundary, type InfiniteData } from "@tanstack/react-query";

import { getHospitals } from "@/api/hospital";
import { StationLanding } from "@/components/hospital/station-landing";
import { PageContainer } from "@/components/ui/page-container";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { departmentsOf } from "@/lib/area";
import { hospitalKeys } from "@/lib/query-keys";
import { getQueryClient } from "@/lib/react-query";
import { buildFaqLd } from "@/lib/seo/area-jsonld";
import {
  buildStationBreadcrumbLd,
  buildStationCollectionLd,
} from "@/lib/seo/station-jsonld";
import {
  buildStationFaqs,
  buildStationIntro,
  cleanStationName,
  stationBase,
  stationSegment,
} from "@/lib/station-landing";
import type { Paginated } from "@/types";
import type { Hospital, HospitalSearchFilters } from "@/types/hospital";

type Params = Promise<{ station: string }>;

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
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

  // noindex라 병원 목록을 조회할 이유가 없다 — 결과를 쓰지도 않으면서 매 요청 DB를 쳤다
  const url = `${SITE_URL}/near/${station}`;
  return {
    title: { absolute: `${station} 병원 | 주변 병원·의원 진료시간·위치 | ${SITE_NAME}` },
    description: `${station} 주변 병원·의원을 진료과목·위치·진료시간으로 비교하세요. 최근접 역 기준 목록.`,
    alternates: { canonical: url },
    /*
     * noindex — 역세권 랜딩은 색인 대상이 아니다.
     *
     * 색인시킬 건 병원 상세와 병원이 쓴 포스트다. 신생 도메인에서 역세권 828개를 함께 밀면
     * 크롤 예산이 그쪽으로 새고, 정작 병원 상세가 늦게 색인된다(사이트맵의 87%가 역세권이었다).
     *
     * 페이지는 살려둔다 — follow:true라 여기서 병원 상세로 가는 내부링크 경로는 그대로 남는다.
     */
    robots: { index: false, follow: true },
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
  if (items.length === 0) notFound();

  // 진료과목 칩용 표본
  const { items: sample } = await getHospitals({ station: base, pageSize: 60 });
  const stationDepartments = departmentsOf(sample);
  const sigungu = items[0]?.region.sigungu;
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
