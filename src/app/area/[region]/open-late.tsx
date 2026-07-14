import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getOpenLateHospitals } from "@/api/hospital";
import { OpenLateList } from "@/components/hospital/open-late-list";
import { PageContainer } from "@/components/ui/page-container";
import {
  AREA_REGIONS,
  findAreaRegion,
  MIN_OPEN_LATE,
} from "@/constants/area-regions";
import { SITE_URL } from "@/constants/site";
import {
  buildOpenLateBreadcrumb,
  buildOpenLateLd,
} from "@/lib/seo/open-late-jsonld";

type Kind = "night" | "sunday";
type Params = Promise<{ region: string }>;

const KO = { night: "야간진료", sunday: "일요일 진료" } as const;

/** "2026년 7월" — revalidate(하루)마다 갱신되니 실제 최신 월이 찍힌다. */
function monthLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

/** 병원 수가 기준 미만이면 이 종류 페이지를 열지 않는다 */
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

  const { items } = await getOpenLateHospitals(reg.sido, reg.sigungu, kind);
  // 레지스트리 집계(생성 시점)와 실시간 조회가 어긋날 수 있다. 실제 목록이 비면 열지 않는다.
  if (items.length === 0) notFound();

  const month = monthLabel();
  const jsonLd = [
    buildOpenLateLd(reg.label, kind, slug, items),
    buildOpenLateBreadcrumb(reg.label, kind, slug),
  ];

  return (
    <PageContainer maxWidth="max-w-3xl">
      <OpenLateList
        regionLabel={reg.label}
        kind={kind}
        items={items}
        updatedLabel={month}
      />
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

export { KO };
