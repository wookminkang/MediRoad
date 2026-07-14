import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { dehydrate, HydrationBoundary, type InfiniteData } from "@tanstack/react-query";

import { getHospitals } from "@/api/hospital";
import { StationLanding } from "@/components/hospital/station-landing";
import { PageContainer } from "@/components/ui/page-container";
import {
  MEDICAL_DEPARTMENTS,
  type MedicalDepartment,
} from "@/constants/hospital";
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

type Params = Promise<{ station: string; department: string }>;

// 역×과목은 수천 조합 → 빌드 시 전량 생성 불가. 첫 요청 시 on-demand 렌더 후 ISR.
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

// 색인 기준: 결과 3곳 이상 (SEO §4-3 — 0~2개 조합은 색인 보류)
const FIRST_PAGE = 24;

function toDepartment(v: string): MedicalDepartment | undefined {
  return (MEDICAL_DEPARTMENTS as readonly string[]).includes(v)
    ? (v as MedicalDepartment)
    : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { station: rawS, department: rawD } = await params;
  const dept = toDepartment(decodeURIComponent(rawD));
  const station = stationSegment(cleanStationName(decodeURIComponent(rawS)));
  if (!dept || !station) return {};

  // noindex라 목록 조회 불필요 (결과를 쓰지 않는다)
  const url = `${SITE_URL}/near/${station}/${dept}`;
  return {
    title: { absolute: `${station} ${dept} | 주변 병원 진료시간·위치 | ${SITE_NAME}` },
    description: `${station} 주변 ${dept} 병원을 위치·진료시간·연락처로 비교하세요. 최근접 역 기준 목록.`,
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
      title: `${station} ${dept} 병원`,
      description: `${station} 주변 ${dept} 병원 · 위치·진료시간 안내`,
      siteName: SITE_NAME,
      locale: "ko_KR",
    },
  };
}

export default async function StationDepartmentPage({
  params,
}: {
  params: Params;
}) {
  const dept = toDepartment(decodeURIComponent((await params).department));
  const station = stationSegment(
    cleanStationName(decodeURIComponent((await params).station)),
  );
  if (!dept || !station) notFound();

  const base = stationBase(station);
  const filters: HospitalSearchFilters = { station: base, department: dept };

  // 첫 페이지 서버 prefetch → 하이드레이션 (SSR 목록 + 무한스크롤 이어받기)
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
  if (items.length === 0) notFound(); // 빈 조합은 색인 대상 아님

  // 역 전체(과목 무관) 표본 — 다른 과목 칩 + 시군구
  const { items: stationAll } = await getHospitals({ station: base, pageSize: 60 });
  const stationDepartments = departmentsOf(stationAll);
  const sigungu = items[0]?.region.sigungu ?? stationAll[0]?.region.sigungu;
  const faqs = buildStationFaqs(station, dept);

  const jsonLd = [
    buildStationCollectionLd(station, dept, items),
    buildStationBreadcrumbLd(station, dept),
    buildFaqLd(faqs),
  ];

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StationLanding
          station={station}
          department={dept}
          filters={filters}
          stationDepartments={stationDepartments}
          sigungu={sigungu}
          intro={buildStationIntro(station, dept)}
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
