import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { dehydrate, HydrationBoundary, type InfiniteData } from "@tanstack/react-query";

import { getHospitals } from "@/api/hospital";
import { AreaLanding } from "@/components/hospital/area-landing";
import { PageContainer } from "@/components/ui/page-container";
import {
  MEDICAL_DEPARTMENTS,
  type MedicalDepartment,
} from "@/constants/hospital";
import { FEATURED_REGIONS } from "@/constants/region";
import { SITE_NAME, SITE_URL } from "@/constants/site";
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

type Params = Promise<{ region: string; department: string }>;

// 실수요 (지역×과목) 조합만 생성, 그 외 404. (SEO §2-1)
export const dynamicParams = false;
const FIRST_PAGE = 24;

export async function generateStaticParams() {
  const combos: { region: string; department: string }[] = [];
  for (const region of FEATURED_REGIONS) {
    const { items } = await getHospitals({ region, pageSize: 100 });
    for (const department of departmentsOf(items)) {
      combos.push({ region, department });
    }
  }
  return combos;
}

function isFeatured(region: string): boolean {
  return (FEATURED_REGIONS as readonly string[]).includes(region);
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
  const region = decodeURIComponent(rawR);
  const department = decodeURIComponent(rawD);
  if (!isFeatured(region) || !toDepartment(department)) return {};
  const title = `${region} ${department} 병원 | ${SITE_NAME}`;
  return {
    title,
    description: `${region} ${department} 병원을 메디로드 지도에서 찾아보세요. 위치·진료시간·연락처 안내.`,
    alternates: { canonical: `${SITE_URL}/area/${region}/${department}` },
    robots: { index: true, follow: true },
  };
}

export default async function AreaDepartmentPage({
  params,
}: {
  params: Params;
}) {
  const region = decodeURIComponent((await params).region);
  const dept = toDepartment(decodeURIComponent((await params).department));
  if (!isFeatured(region) || !dept) notFound();

  const filters: HospitalSearchFilters = { region, department: dept };

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

  // 인접 "다른 과목"·역세권 칩 — 지역 전체 표본
  const { items: sample } = await getHospitals({ region, pageSize: 60 });
  const regionDepartments = departmentsOf(sample);
  const faqs = buildAreaFaqs(region, dept);

  const jsonLd = [
    buildAreaCollectionLd(region, dept, items),
    buildAreaBreadcrumbLd(region, dept),
    buildFaqLd(faqs),
  ];

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AreaLanding
          region={region}
          department={dept}
          filters={filters}
          regionDepartments={regionDepartments}
          stations={topStationsOf(sample)}
          intro={buildAreaIntro(region, dept)}
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
