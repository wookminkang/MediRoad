import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { dehydrate, HydrationBoundary, type InfiniteData } from "@tanstack/react-query";

import { getHospitals } from "@/api/hospital";
import { AreaLanding } from "@/components/hospital/area-landing";
import { PageContainer } from "@/components/ui/page-container";
import { findAreaRegion, nearbyRegionsOf } from "@/constants/area-regions";
import {
  MEDICAL_DEPARTMENTS,
  type MedicalDepartment,
} from "@/constants/hospital";
import { FEATURED_REGIONS } from "@/constants/region";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { buildAreaFaqs, buildAreaIntro } from "@/lib/area";
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

type Params = Promise<{ region: string; department: string }>;

/**
 * 조합이 2,000개에 가깝다. 빌드마다 전부 만들면 배포가 느려지고 DB도 그만큼 두드린다.
 * 주요 지역만 미리 만들고 나머지는 첫 요청 때 생성해 캐시한다(ISR).
 *
 * dynamicParams=true지만 아무 주소나 열리지는 않는다 — 레지스트리에 없는 지역이나
 * 우리가 열지 않는 과목은 페이지에서 notFound()로 떨군다. /area에는 loading.tsx가
 * 없어서 스트리밍이 시작되기 전에 404가 확정된다(soft-404 아님).
 */
export const dynamicParams = true;
export const revalidate = 86400;
const FIRST_PAGE = 24;

export async function generateStaticParams() {
  return FEATURED_REGIONS.flatMap((slug) => {
    const reg = findAreaRegion(slug);
    return (reg?.departments ?? []).map((department) => ({
      region: slug,
      department,
    }));
  });
}

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
  const { region: rawR, department: rawD } = await params;
  const slug = decodeURIComponent(rawR);
  const department = decodeURIComponent(rawD);
  const reg = findAreaRegion(slug);
  if (!reg || !toDepartment(department)) return {};
  return {
    title: `${reg.label} ${department} 병원 | ${SITE_NAME}`,
    description: `${reg.label} ${department} 병원을 메디로드 지도에서 찾아보세요. 위치·진료시간·연락처 안내.`,
    alternates: { canonical: `${SITE_URL}/area/${slug}/${department}` },
    robots: { index: true, follow: true },
  };
}

export default async function AreaDepartmentPage({
  params,
}: {
  params: Params;
}) {
  const slug = decodeURIComponent((await params).region);
  const dept = toDepartment(decodeURIComponent((await params).department));

  /**
   * 색인 대상 지역(병원 100곳 이상)만 연다. 그 밖의 조합은 404.
   * 지역 이름이 시도끼리 겹치는 경우(서구·중구…)는 slug가 '부산-서구' 형태라
   * 레지스트리 조회만으로 걸러진다 — 여러 도시가 섞인 페이지가 생길 수 없다.
   */
  const reg = findAreaRegion(slug);
  if (!reg || !dept) notFound();

  const region = reg.sigungu;
  const label = reg.label;
  const filters: HospitalSearchFilters = {
    region,
    sido: reg.sido,
    department: dept,
  };

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

  // 인접 "다른 과목"·역세권 칩 — 지역 전체 표본 (시도까지 걸어야 다른 도시가 안 섞인다)
  const { items: sample } = await getHospitals({
    region,
    sido: reg.sido,
    pageSize: 60,
  });
  const regionDepartments = reg.departments;
  const faqs = buildAreaFaqs(label, dept);

  const jsonLd = [
    buildAreaCollectionLd(label, dept, items),
    buildAreaBreadcrumbLd(label, dept),
    buildFaqLd(faqs),
  ];

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AreaLanding
          slug={slug}
          region={label}
          department={dept}
          nearbyRegions={nearbyRegionsOf(slug)}
          filters={filters}
          regionDepartments={regionDepartments}
          stations={topStationsOf(sample)}
          intro={buildAreaIntro(label, dept)}
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
