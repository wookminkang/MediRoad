import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Text } from "@seed-design/react";

import { PageContainer } from "@/components/ui/page-container";
import { AREA_REGIONS } from "@/constants/area-regions";
import { SITE_URL } from "@/constants/site";

export const metadata: Metadata = {
  title: "지역별 병원 찾기",
  description:
    "전국 156개 시·군·구의 병원을 지역별로 찾아보세요. 각 지역의 내과·정형외과·소아청소년과 등 진료과목별 병원 목록을 제공합니다.",
  alternates: { canonical: `${SITE_URL}/area` },
  robots: { index: true, follow: true },
};

export const revalidate = 86400;

/**
 * 지역 목록 허브.
 *
 * 지역·진료과목 랜딩이 2,144개인데 사이트 안에서 거기로 가는 링크가 거의 없었다.
 * 홈의 "인기 지역" 카드는 지도(/map)로 갔고, 지역 페이지는 사이트맵에만 있었다.
 * 사이트맵에만 있고 링크가 없는 페이지를 구글은 "발견됨 — 색인되지 않음"으로 방치한다.
 * 내부 링크가 곧 "이 페이지가 중요하다"는 신호이기 때문이다.
 *
 * 이 페이지가 크롤 경로의 관문이다.
 *   홈 → /area(156개 지역) → 각 지역(13개 과목) → 병원 상세
 */

/** 시도 표기 순서 — 병원 수가 많은 광역부터 */
const SIDO_ORDER = [
  "서울", "경기", "부산", "인천", "대구", "경남", "경북", "대전",
  "광주", "충남", "전북", "울산", "전남", "충북", "강원", "제주", "세종",
];

export default function AreaIndexPage() {
  const bySido = new Map<string, typeof AREA_REGIONS>();
  for (const r of AREA_REGIONS) {
    bySido.set(r.sido, [...(bySido.get(r.sido) ?? []), r] as typeof AREA_REGIONS);
  }
  const sidos = [...bySido.keys()].sort(
    (a, b) => SIDO_ORDER.indexOf(a) - SIDO_ORDER.indexOf(b),
  );

  const total = AREA_REGIONS.reduce((s, r) => s + r.count, 0);

  return (
    <PageContainer maxWidth="max-w-3xl">
      <div className="flex flex-col items-start gap-3">
        <Badge size="medium" variant="weak" tone="brand">
          지역별
        </Badge>
        <Text as="h1" textStyle="t9Bold">
          지역별 병원 찾기
        </Text>
        <Text as="p" textStyle="t5Regular" className="text-subtle">
          전국 {AREA_REGIONS.length}개 시·군·구, 병원 {total.toLocaleString()}곳.
          지역을 고르면 진료과목별로 찾아볼 수 있습니다.
        </Text>
      </div>

      <div className="mt-10 flex flex-col gap-9">
        {sidos.map((sido) => {
          const regions = [...(bySido.get(sido) ?? [])].sort(
            (a, b) => b.count - a.count,
          );
          return (
            <section key={sido}>
              <div className="flex items-baseline gap-2">
                <Text as="h2" textStyle="t6Bold" className="text-neutral">
                  {sido}
                </Text>
                <Text as="span" textStyle="t3Regular" className="text-subtle">
                  {regions.length}개 지역
                </Text>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {regions.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/area/${r.slug}`}
                      className="inline-flex items-baseline gap-1.5 rounded-full border border-line px-3.5 py-2 transition-colors hover:border-brand hover:bg-brand-weak"
                    >
                      <span className="text-sm font-medium text-neutral">
                        {r.sigungu}
                      </span>
                      <span className="text-xs text-subtle tabular-nums">
                        {r.count.toLocaleString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-12 text-sm leading-relaxed text-subtle">
        병원 100곳 이상인 시·군·구를 표시합니다. 병원 수는 보건복지부·건강보험심사평가원
        공공데이터 기준입니다.
      </p>
    </PageContainer>
  );
}
