import { getHospitals } from "@/api/hospital";
import { FEATURED_REGIONS } from "@/constants/region";
import { SITE_URL } from "@/constants/site";
import { departmentsOf } from "@/lib/area";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

// 정적 핵심 페이지 + 지역/지역×과목 랜딩
export const revalidate = 3600;

export async function GET() {
  const now = new Date();
  const urls: SitemapUrl[] = [
    { url: SITE_URL, lastmod: now, changefreq: "daily", priority: 1 },
    // /hospitals는 검색결과 페이지(noindex)라 사이트맵에서 제외 — 색인은 /area·병원 상세로
    { url: `${SITE_URL}/health`, lastmod: now, changefreq: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/conditions`, lastmod: now, changefreq: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/briefing`, lastmod: now, changefreq: "daily", priority: 0.7 },
    { url: `${SITE_URL}/faq`, lastmod: now, changefreq: "monthly", priority: 0.5 },
  ];

  for (const region of FEATURED_REGIONS) {
    urls.push({
      url: `${SITE_URL}/area/${region}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.8,
    });
    const { items } = await getHospitals({ region, pageSize: 100 });
    for (const department of departmentsOf(items)) {
      urls.push({
        url: `${SITE_URL}/area/${region}/${department}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.7,
      });
    }
  }

  return xmlResponse(urlsetXml(urls));
}
