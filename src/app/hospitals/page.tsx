import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Text } from "@seed-design/react";

import { getHospitals } from "@/api/hospital";
import { HospitalInfiniteList } from "@/components/hospital/hospital-infinite-list";
import { FilterSidebar } from "@/components/search/filter-sidebar";
import { HospitalSearchBox } from "@/components/search/hospital-search-box";
import { PageContainer } from "@/components/ui/page-container";
import { MEDICAL_DEPARTMENTS, type MedicalDepartment } from "@/constants/hospital";
import { DEFAULT_LOCATION } from "@/constants/location";
import { getQueryClient } from "@/lib/react-query";
import { hospitalKeys } from "@/lib/query-keys";
import type { HospitalSearchFilters } from "@/types/hospital";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function toStr(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s : undefined;
}
function toDepartment(
  v: string | string[] | undefined,
): MedicalDepartment | undefined {
  const s = toStr(v);
  return s && (MEDICAL_DEPARTMENTS as readonly string[]).includes(s)
    ? (s as MedicalDepartment)
    : undefined;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const label = [toStr(sp.q), toDepartment(sp.department)]
    .filter(Boolean)
    .join(" ");

  return {
    title: label ? `${label} 검색 결과` : "병원 찾기",
    description: label
      ? `${label} 관련 병원을 메디로드 지도에서 찾아보세요. 위치·진료시간·연락처 안내.`
      : "병원·한의원·한방병원을 메디로드 지도에서 검색하세요.",
    robots: { index: false, follow: true }, // 검색결과 noindex (SEO §1)
    alternates: { canonical: "https://mediroad.kr/hospitals" },
  };
}

export default async function HospitalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = toStr(sp.q);
  const department = toDepartment(sp.department);
  const sido = toStr(sp.sido);
  const openNow = toStr(sp.open) === "1";
  const lat = toStr(sp.lat);
  const lng = toStr(sp.lng);
  const radius = toStr(sp.radius);
  const radiusKm = radius ? Number(radius) : undefined;
  // 기준점: 내 위치(lat/lng) 있으면 그걸로, 없으면 강남역. 반경/위치 있을 때만 적용
  const center =
    lat && lng ? { lat: Number(lat), lng: Number(lng) } : DEFAULT_LOCATION;
  const useCenter = Boolean((lat && lng) || radiusKm);

  // 무한스크롤 쿼리키용 필터 (page 제외)
  const filters: HospitalSearchFilters = {
    q,
    department,
    sido,
    openNow: openNow || undefined,
    center: useCenter ? center : undefined,
    radiusKm,
  };

  // 첫 페이지 서버 prefetch → 하이드레이션 (즉시 렌더 + 클라 재요청 방지)
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: hospitalKeys.list(filters),
    queryFn: () => getHospitals({ ...filters, page: 1, pageSize: 24 }),
    initialPageParam: 1,
  });

  const label = [q, sido, department].filter(Boolean).join(" ");

  return (
    <PageContainer maxWidth="max-w-7xl">
      {/* 결과 타이틀 */}
      <Text as="h1" textStyle="t8Bold">
        {label ? `“${label}” 검색 결과` : "전체 병원"}
      </Text>

      {/* 병원명 검색 */}
      <div className="mt-4">
        <HospitalSearchBox />
      </div>

      {/* 필터 + 무한스크롤 그리드 */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <FilterSidebar
          q={q}
          activeDepartment={department}
          activeSido={sido}
          activeRadius={radius}
          lat={lat}
          lng={lng}
          openNow={openNow}
        />

        <section aria-label="검색 결과">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <HospitalInfiniteList filters={filters} />
          </HydrationBoundary>
        </section>
      </div>
    </PageContainer>
  );
}
