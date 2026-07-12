import { SITE_URL } from "@/constants/site";
import { sitemapIndexXml, xmlResponse } from "@/lib/sitemap-xml";

// 사이트맵 인덱스 — 카테고리별 개별 사이트맵을 참조. robots.txt가 이 URL을 가리킴.
export const revalidate = 3600;

export function GET() {
  const now = new Date();
  const names = ["static", "hospitals", "stations", "posts", "content"];
  return xmlResponse(
    sitemapIndexXml(
      names.map((n) => ({ loc: `${SITE_URL}/sitemaps/${n}.xml`, lastmod: now })),
    ),
  );
}
