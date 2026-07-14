import { SITE_URL } from "@/constants/site";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

// 정적 핵심 페이지. 지역·지역×과목 랜딩은 areas.xml로 분리했다(약 2,100개).
export const revalidate = 3600;

export async function GET() {
  const now = new Date();
  const urls: SitemapUrl[] = [
    { url: SITE_URL, lastmod: now, changefreq: "daily", priority: 1 },
    // 필터 없는 /hospitals는 색인 대상(목록의 대표 페이지). 필터가 걸린 주소만 noindex.
    { url: `${SITE_URL}/hospitals`, lastmod: now, changefreq: "daily", priority: 0.9 },
    { url: `${SITE_URL}/health`, lastmod: now, changefreq: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/briefing`, lastmod: now, changefreq: "daily", priority: 0.7 },
    { url: `${SITE_URL}/faq`, lastmod: now, changefreq: "monthly", priority: 0.5 },
  ];

  return xmlResponse(urlsetXml(urls));
}
