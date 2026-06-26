import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getHospitals } from "@/api/hospital";
import { AreaLanding } from "@/components/hospital/area-landing";
import { PageContainer } from "@/components/ui/page-container";
import { FEATURED_REGIONS } from "@/constants/region";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { buildAreaFaqs, buildAreaIntro, departmentsOf } from "@/lib/area";
import {
  buildAreaBreadcrumbLd,
  buildAreaCollectionLd,
  buildFaqLd,
} from "@/lib/seo/area-jsonld";

type Params = Promise<{ region: string }>;

// 전국 시군구 지원: 주요 지역은 빌드 시 생성, 그 외는 on-demand(ISR). 병원 없는 지역은 404.
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  return FEATURED_REGIONS.map((region) => ({ region }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const region = decodeURIComponent((await params).region);
  const title = `${region} 병원 | ${SITE_NAME}`;
  return {
    title,
    description: `${region} 병원·의원을 진료과목별로 찾아보세요. 위치·진료시간·연락처 안내.`,
    alternates: { canonical: `${SITE_URL}/area/${region}` },
    robots: { index: true, follow: true },
  };
}

export default async function AreaRegionPage({ params }: { params: Params }) {
  const region = decodeURIComponent((await params).region);

  const { items, total } = await getHospitals({ region, pageSize: 100 });
  if (total === 0) notFound(); // 존재하지 않는 지역 = soft-404 방지
  const regionDepartments = departmentsOf(items);
  const faqs = buildAreaFaqs(region);

  const jsonLd = [
    buildAreaCollectionLd(region, undefined, items),
    buildAreaBreadcrumbLd(region),
    buildFaqLd(faqs),
  ];

  return (
    <PageContainer>
      <AreaLanding
        region={region}
        hospitals={items}
        total={total}
        regionDepartments={regionDepartments}
        intro={buildAreaIntro(region, undefined, total)}
        faqs={faqs}
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
