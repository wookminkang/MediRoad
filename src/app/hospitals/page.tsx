import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { Text } from "@seed-design/react";

import { getHospitals } from "@/api/hospital";
import { HospitalInfiniteList } from "@/components/hospital/hospital-infinite-list";
import { ActiveFilterChips } from "@/components/search/active-filter-chips";
import { FilterSheet } from "@/components/search/filter-sheet";
import { FilterSidebar } from "@/components/search/filter-sidebar";
import { TabRow } from "@/components/search/tab-row";
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
    alternates: { canonical: "https://mediroad.io/hospitals" },
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
  const activeCount = [q, department, sido, openNow, radius || (lat && lng)].filter(
    Boolean,
  ).length;

  const sidebar = (
    <FilterSidebar
      q={q}
      activeDepartment={department}
      activeSido={sido}
      activeRadius={radius}
      lat={lat}
      lng={lng}
      openNow={openNow}
    />
  );

  // 진료과목 탭 (전체 + 14개 과) — URL 기반 링크
  const deptHref = (dept?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (dept) params.set("department", dept);
    const qs = params.toString();
    return qs ? `/hospitals?${qs}` : "/hospitals";
  };
  const tabs = [
    { id: "", label: "전체", href: deptHref() },
    ...MEDICAL_DEPARTMENTS.map((d) => ({ id: d, label: d, href: deptHref(d) })),
  ];

  return (
    <PageContainer maxWidth="max-w-7xl" flushTop>
      {/*
       * 제목은 헤더 앱바("병원찾기")가 들고 있으므로 화면에 다시 그리지 않는다.
       * 다만 검색어 맥락이 담긴 H1은 문서에 있어야 한다(SEO). 화면에서만 감춘다.
       * 검색어는 아래 ActiveFilterChips가 칩으로 계속 보여준다.
       */}
      <Text as="h1" textStyle="t8Bold" className="sr-only">
        {label ? `“${label}” 검색 결과` : "전체 병원"}
      </Text>

      {/* 스티키 바 — 필터 + 진료과목 탭. 좌우 거터는 음수 마진으로 뚫어 끝까지 배경을 깐다 */}
      <div className="sticky top-0 z-30 -mx-4 bg-white px-4 pb-2 pt-1">
        <TabRow
          items={tabs}
          activeId={department ?? ""}
          leading={<FilterSheet activeCount={activeCount}>{sidebar}</FilterSheet>}
        />

        <ActiveFilterChips />
      </div>

      {/* min-height로 결과 적을 때 레이아웃 붕괴 방지 */}
      <section aria-label="검색 결과" className="mt-4 min-h-[60vh]">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <HospitalInfiniteList filters={filters} />
        </HydrationBoundary>
      </section>
    </PageContainer>
  );
}
