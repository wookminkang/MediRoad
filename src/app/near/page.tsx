import type { Metadata } from "next";
import Link from "next/link";

import { Text } from "@seed-design/react";

import { StationDirectory } from "@/components/hospital/station-directory";
import { PageContainer } from "@/components/ui/page-container";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { STATION_TARGETS } from "@/constants/stations.generated";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: `지하철역으로 병원 찾기 | 역세권 병원·의원 | ${SITE_NAME}` },
  description:
    "지하철역 주변 병원·의원을 역별로 찾아보세요. 역 이름으로 검색하거나 지역별 주요 역에서 최근접 역 기준 병원 목록을 확인할 수 있습니다.",
  alternates: { canonical: `${SITE_URL}/near` },
  robots: { index: true, follow: true },
};

// 시도 표시 순서(수도권·광역시 우선)
const SIDO_ORDER = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "대전",
  "광주",
  "울산",
];

export default function StationIndexPage() {
  // 시도별 그룹 (역은 병원수 내림차순 — 생성 시 정렬됨)
  const bySido = new Map<string, { name: string; count: number }[]>();
  for (const s of STATION_TARGETS) {
    const arr = bySido.get(s.sido) ?? [];
    arr.push({ name: s.name, count: s.count });
    bySido.set(s.sido, arr);
  }
  const sections = [...bySido.entries()]
    .map(([sido, stations]) => ({ sido, stations }))
    .sort((a, b) => {
      const ia = SIDO_ORDER.indexOf(a.sido);
      const ib = SIDO_ORDER.indexOf(b.sido);
      if (ia !== -1 || ib !== -1)
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return b.stations.length - a.stations.length;
    });

  return (
    <PageContainer>
      <article>
        <nav aria-label="경로 안내">
          <Text
            as="span"
            textStyle="t3Regular"
            style={{ color: "var(--seed-color-fg-neutral-muted)" }}
          >
            <Link href="/">홈</Link>
            {" › "}지하철역으로 찾기
          </Text>
        </nav>

        <header className="mt-3">
          <Text as="h1" textStyle="t8Bold">
            지하철역으로 병원 찾기
          </Text>
          <Text as="p" textStyle="t5Regular" className="mt-3">
            이용하는 지하철역을 검색하거나 지역별 주요 역에서 선택하면, 최근접 역 기준으로 주변 병원·의원을 위치·진료시간·진료과목과 함께 확인할 수 있어요.
          </Text>
        </header>

        <StationDirectory sections={sections} />
      </article>
    </PageContainer>
  );
}
