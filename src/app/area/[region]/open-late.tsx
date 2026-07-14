import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  dehydrate,
  HydrationBoundary,
  type InfiniteData,
} from "@tanstack/react-query";
import { Badge, Text } from "@seed-design/react";

import { getHospitals, getOpenLateHospitals } from "@/api/hospital";
import { HospitalInfiniteList } from "@/components/hospital/hospital-infinite-list";
import { PageContainer } from "@/components/ui/page-container";
import {
  AREA_REGIONS,
  findAreaRegion,
  MIN_OPEN_LATE,
} from "@/constants/area-regions";
import { SITE_URL } from "@/constants/site";
import { hospitalKeys } from "@/lib/query-keys";
import { getQueryClient } from "@/lib/react-query";
import {
  buildOpenLateBreadcrumb,
  buildOpenLateLd,
} from "@/lib/seo/open-late-jsonld";
import type { Paginated } from "@/types";
import type { Hospital, HospitalSearchFilters } from "@/types/hospital";

type Kind = "night" | "sunday";
type Params = Promise<{ region: string }>;

const FIRST_PAGE = 24;

/** "2026년 7월" — revalidate(하루)마다 갱신되니 실제 최신 월이 찍힌다. */
function monthLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function enoughFor(slug: string, kind: Kind): boolean {
  const reg = findAreaRegion(slug);
  if (!reg) return false;
  const n = kind === "night" ? reg.nightCount : reg.sundayCount;
  return n >= MIN_OPEN_LATE;
}

async function buildMetadata(paramsP: Params, kind: Kind): Promise<Metadata> {
  const slug = decodeURIComponent((await paramsP).region);
  const reg = findAreaRegion(slug);
  if (!reg || !enoughFor(slug, kind)) return {};
  const n = kind === "night" ? reg.nightCount : reg.sundayCount;
  const month = monthLabel();
  const title =
    kind === "night"
      ? `${reg.label} 야간진료 병원 ${n}곳 — ${month} 기준`
      : `${reg.label} 일요일 진료 병원 ${n}곳 — ${month} 기준`;
  const desc =
    kind === "night"
      ? `${reg.label}에서 평일 저녁 8시 이후까지 진료하는 병원 ${n}곳을 늦게 닫는 순으로 정리했습니다. 병원명·진료시간·전화번호·위치를 공공데이터 기반으로 안내합니다.`
      : `${reg.label}에서 일요일에 진료하는 병원 ${n}곳을 공공데이터 기반으로 정리했습니다. 병원명·진료시간·전화번호·위치를 안내합니다.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `${SITE_URL}/area/${slug}/${kind}` },
    robots: { index: true, follow: true },
  };
}

async function buildPage(paramsP: Params, kind: Kind) {
  const slug = decodeURIComponent((await paramsP).region);
  const reg = findAreaRegion(slug);
  if (!reg || !enoughFor(slug, kind)) notFound();

  const filters: HospitalSearchFilters = {
    region: reg.sigungu,
    sido: reg.sido,
    openLate: kind,
  };

  // 첫 페이지를 서버에서 prefetch → 하이드레이션. 이후는 무한스크롤이 이어받는다.
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: hospitalKeys.list(filters),
    queryFn: () => getHospitals({ ...filters, page: 1, pageSize: FIRST_PAGE }),
    initialPageParam: 1,
  });
  const first = queryClient.getQueryData(hospitalKeys.list(filters)) as
    | InfiniteData<Paginated<Hospital>>
    | undefined;
  const firstItems = first?.pages?.[0]?.items ?? [];
  const total = first?.pages?.[0]?.total ?? 0;
  if (firstItems.length === 0) notFound();

  // JSON-LD는 상위 병원만 담으면 되므로 첫 페이지 결과로 충분하다(중복 조회 안 함).
  const { items: ldItems } = await getOpenLateHospitals(
    reg.sido,
    reg.sigungu,
    kind,
  );

  const month = monthLabel();
  const heading =
    kind === "night"
      ? `${reg.label} 야간진료 병원`
      : `${reg.label} 일요일 진료 병원`;
  const lead =
    kind === "night"
      ? `${reg.label}에서 평일 저녁 8시 이후까지 진료하는 병원입니다. 늦게 닫는 순으로 정렬했습니다.`
      : `${reg.label}에서 일요일에 진료하는 병원입니다.`;

  const jsonLd = [
    buildOpenLateLd(reg.label, kind, slug, ldItems),
    buildOpenLateBreadcrumb(reg.label, kind, slug),
  ];

  return (
    <PageContainer maxWidth="max-w-3xl">
      <article>
        <nav aria-label="경로 안내" className="mb-3">
          <Text as="span" textStyle="t3Regular" className="text-subtle">
            홈 › 지역별 › {reg.label}
          </Text>
        </nav>

        <header>
          <Badge size="medium" variant="weak" tone="brand">
            {kind === "night" ? "야간진료" : "일요일 진료"}
          </Badge>
          <Text as="h1" textStyle="t8Bold" className="mt-3">
            {heading} {total.toLocaleString()}곳
          </Text>
          <Text as="p" textStyle="t5Regular" className="mt-3 text-muted">
            {lead}
          </Text>
          <Text as="p" textStyle="t3Regular" className="mt-2 text-subtle">
            {month} 기준 · 보건복지부·건강보험심사평가원 공공데이터. 명절·임시
            휴진은 반영되지 않을 수 있으니 방문 전 전화로 확인하세요.
          </Text>
        </header>

        <div className="mt-8">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <HospitalInfiniteList filters={filters} />
          </HydrationBoundary>
        </div>
      </article>

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

export const renderOpenLate = {
  metadata: buildMetadata,
  page: buildPage,
};

/** 병원 수가 넉넉한 지역만 미리 만든다. 나머지는 첫 요청 때 생성(ISR). */
export function generateStaticParams() {
  return AREA_REGIONS.filter(
    (r) => r.nightCount >= MIN_OPEN_LATE || r.sundayCount >= MIN_OPEN_LATE,
  )
    .slice(0, 30)
    .map((r) => ({ region: r.slug }));
}
