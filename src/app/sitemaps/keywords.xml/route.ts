import { guideUrl, HOSPITAL_GUIDES } from "@/constants/hospital-keyword-pages";
import { SITE_URL } from "@/constants/site";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

/*
 * 가이드 허브(/[병원slug]/guide/[키워드]) 사이트맵.
 * 큐레이션 목록(HOSPITAL_GUIDES)에 있는 가이드만 — 자동 대량생성 아님.
 */
export const revalidate = 3600;

export function GET() {
  const urls: SitemapUrl[] = HOSPITAL_GUIDES.map((g) => ({
    url: `${SITE_URL}${guideUrl(g.hospitalSlug, g.keyword)}`,
    changefreq: "weekly",
    priority: 0.7,
  }));
  return xmlResponse(urlsetXml(urls));
}
