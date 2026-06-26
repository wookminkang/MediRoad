import type { MetadataRoute } from "next";

import { getConditions } from "@/api/condition";
import { getHospitals } from "@/api/hospital";
import { getColumns } from "@/api/column";
import { FEATURED_REGIONS } from "@/constants/region";
import { SITE_URL } from "@/constants/site";
import { departmentsOf } from "@/lib/area";

// ISR — sitemap도 1시간마다 재생성해 새 글 URL 자동 포함(재배포 불필요)
export const revalidate = 3600;

/**
 * 사이트맵 — 색인 대상(SEO §1-1 ✅index)만 수록.
 * 제외: /hospitals?…(필터 noindex)·/search·/admin·not-found.
 * URL은 페이지 canonical과 동일 표기(지역/과목/카테고리는 한글 세그먼트).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const lastmod = (iso?: string) => (iso ? new Date(iso) : now);

  // 정적 핵심 페이지
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE_URL}/hospitals`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/health`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/conditions`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 지역 랜딩 + 지역×과목 (화이트리스트 = generateStaticParams와 동일 소스)
  const areaEntries: MetadataRoute.Sitemap = [];
  for (const region of FEATURED_REGIONS) {
    areaEntries.push({
      url: `${SITE_URL}/area/${region}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    const { items } = await getHospitals({ region, pageSize: 100 });
    for (const department of departmentsOf(items)) {
      areaEntries.push({
        url: `${SITE_URL}/area/${region}/${department}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // 병원 상세
  const { items: hospitals } = await getHospitals({ pageSize: 1000 });
  const hospitalEntries: MetadataRoute.Sitemap = hospitals.map((h) => ({
    url: `${SITE_URL}/hospitals/${h.slug}`,
    lastModified: lastmod(h.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 건강 칼럼 상세 (published만) — 카테고리는 쿼리 필터(noindex)라 색인 대상 아님
  const { items: columns } = await getColumns({ pageSize: 1000 });
  const columnEntries: MetadataRoute.Sitemap = columns.map((c) => ({
    url: `${SITE_URL}/health/${c.id}`,
    lastModified: lastmod(c.updatedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // 증상·질환 (published)
  const conditions = await getConditions();
  const conditionEntries: MetadataRoute.Sitemap = conditions.map((c) => ({
    url: `${SITE_URL}/conditions/${c.id}`,
    lastModified: lastmod(c.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...areaEntries,
    ...hospitalEntries,
    ...columnEntries,
    ...conditionEntries,
  ];
}
