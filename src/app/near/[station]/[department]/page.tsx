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

type Params = Promise<{ station: string; department: string }>;

// 역×과목은 수천 조합 → 빌드 시 전량 생성 불가. 첫 요청 시 on-demand 렌더 후 ISR.
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  // 병원 상세와 동일하게 on-demand ISR — 빌드 시 병렬 프리렌더가 Supabase 일시 오류를
  // 삼켜 404로 구워지는 걸 피한다(색인 개방한 제휴 역은 첫 크롤 시 라이브 렌더 후 캐시).
  return [];
}

// 색인 기준: 결과 3곳 이상 (SEO §4-3 — 0~2개 조합은 색인 보류)
const FIRST_PAGE = 24;

function toDepartment(v: string): MedicalDepartment | undefined {
  return (MEDICAL_DEPARTMENTS as readonly string[]).includes(v)
    ? (v as MedicalDepartment)
    : undefined;
}

/** 표시용 과목 라벨. 한방은 검색어에 맞춰 "한의원·한방병원"으로. */
function departmentLabel(dept: string): string {
  return dept === "한방" ? "한의원·한방병원" : dept;
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

  const url = `${SITE_URL}/near/${station}/${dept}`;
  const label = departmentLabel(dept);

  /*
   * 과목 페이지(/near/{역}/{과목})는 색인하지 않는다.
   * 색인 대상은 역 허브(/near/{역}) 하나로 모은다 — 허브가 그 역 근처 병원을 목록으로
   * 다 보여주므로(이음손한의원 등) 과목("한의원")은 콘텐츠에서 읽힌다. 과목별 URL까지
   * 색인하면 허브와 카니벌라이즈되고 크롤 예산만 늘어난다. 페이지는 follow로 살려둬
   * 내부링크 경로는 유지한다.
   */
  return {
    title: { absolute: `${station} ${label} | 주변 병원 진료시간·위치 | ${SITE_NAME}` },
    description: `${station} 주변 ${label} 병원을 위치·진료시간·연락처로 비교하세요. 최근접 역 기준 목록.`,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      url,
      title: `${station} ${label} 병원`,
      description: `${station} 주변 ${label} 병원 · 위치·진료시간 안내`,
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
  const key = hospitalKeys.list(filters);

  // 첫 페이지 서버 prefetch → 하이드레이션 (SSR 목록 + 무한스크롤 이어받기)
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: key,
    queryFn: () => getHospitals({ ...filters, page: 1, pageSize: FIRST_PAGE }),
    initialPageParam: 1,
  });

  // 큐레이션 제휴 병원을 첫 페이지 최상단에 주입 — station_name 접두로 안 잡히는 인근 역
  // (이음손=봉천→서울대입구, 리움=둔촌오륜→둔촌동)에서도 상단 노출. 2페이지+는 불변(중복 없음).
  await injectPartners(queryClient, key, base, dept);

  const first = queryClient.getQueryData(key) as
    | InfiniteData<Paginated<Hospital>>
    | undefined;
  const items = first?.pages?.[0]?.items ?? [];
  if (items.length === 0) notFound(); // 빈 조합은 색인 대상 아님

  // 역 전체(과목 무관) 표본 — 다른 과목 칩 + 시군구
  const { items: stationAll } = await getHospitals({ station: base, pageSize: 60 });
  const stationDepartments = departmentsOf(stationAll);
  const sigungu = items[0]?.region.sigungu ?? stationAll[0]?.region.sigungu;
  const nearbyStations = nearbyStationsInSigungu(sigungu, station);
  const neighborGus = sigungu ? getNeighborDistricts(sigungu) : [];
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
          nearbyStations={nearbyStations}
          neighborGus={neighborGus}
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
