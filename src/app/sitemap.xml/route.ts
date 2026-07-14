import { SITE_URL } from "@/constants/site";
import { sitemapIndexXml, xmlResponse } from "@/lib/sitemap-xml";

// 사이트맵 인덱스 — 카테고리별 개별 사이트맵을 참조. robots.txt가 이 URL을 가리킴.
export const revalidate = 3600;

export function GET() {
  const now = new Date();
  /*
   * 순서 = 우선순위 신호. 색인시키려는 순서대로 둔다.
   *   hospitals(병원 상세) → posts(병원 포스트) → content(자체 콘텐츠) → static
   *
   * stations 제외 — 역세권은 noindex다.
   */
  const names = ["hospitals", "posts", "content", "static"];
  return xmlResponse(
    sitemapIndexXml(
      names.map((n) => ({ loc: `${SITE_URL}/sitemaps/${n}.xml`, lastmod: now })),
    ),
  );
}
