import { HOSPITAL_KEYWORD_PAGES } from "@/constants/hospital-keyword-pages";
import { SITE_URL } from "@/constants/site";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

/*
 * 병원별 키워드 랜딩(/[병원slug]/search/[키워드]) 사이트맵.
 * 큐레이션 목록(HOSPITAL_KEYWORD_PAGES)에 있는 페이지만 — 자동 대량생성 아님.
 */
export const revalidate = 3600;

export function GET() {
  const urls: SitemapUrl[] = HOSPITAL_KEYWORD_PAGES.map((p) => ({
    url: `${SITE_URL}/${encodeURIComponent(p.hospitalSlug)}/search/${encodeURIComponent(p.keyword)}`,
    changefreq: "weekly",
    priority: 0.7,
  }));
  return xmlResponse(urlsetXml(urls));
}
