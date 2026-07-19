import { SITE_URL } from "@/constants/site";
import { sitemapIndexXml, xmlResponse } from "@/lib/sitemap-xml";

// 사이트맵 인덱스 — 카테고리별 개별 사이트맵을 참조. robots.txt가 이 URL을 가리킴.
export const revalidate = 3600;

export function GET() {
  const now = new Date();
  /*
   * 순서 = 우선순위 신호. 색인시키려는 순서대로 둔다.
   *   hospitals(병원 상세) → posts(병원 포스트) → areas(지역×진료과목)
   *   → stations(제휴 인근 역세권) → content(자체 콘텐츠) → static
   *
   * areas가 페이지 수로는 가장 많지만(약 2,100개) 병원·포스트 뒤에 둔다.
   * 검색 유입은 areas가 크고, 신뢰도는 병원·포스트가 만든다.
   *
   * stations — 전체 828역이 아니라 색인 개방한 제휴 인근 역만 담는다
   * (sitemaps/stations.xml에서 제휴 역으로 한정). 그래서 인덱스에 포함해도
   * 크롤 예산이 역세권으로 새지 않는다.
   */
  const names = [
    "hospitals",
    "posts",
    "keyword-posts",
    "keywords",
    "areas",
    "stations",
    "content",
    "static",
  ];
  return xmlResponse(
    sitemapIndexXml(
      names.map((n) => ({ loc: `${SITE_URL}/sitemaps/${n}.xml`, lastmod: now })),
    ),
  );
}
