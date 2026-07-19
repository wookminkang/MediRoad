import { partnerStationSegments } from "@/constants/partner-stations";
import { SITE_URL } from "@/constants/site";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

/*
 * 역세권 랜딩(/near) 중 색인 대상은 제휴 인근 역 "허브"(/near/{역})뿐이다.
 *
 * 전체 828역은 계속 noindex라 제외한다 — 신생 도메인에서 역세권을 대량으로 밀면 크롤
 * 예산이 병원 상세·포스트에서 새기 때문. 과목별(/near/{역}/{과목})은 허브와 카니벌라이즈
 * 되므로 색인·사이트맵에서 빼고, 허브 하나로 모은다(허브 목록에서 과목은 콘텐츠로 읽힘).
 */
export const revalidate = 86400;

export function GET() {
  const hubs: SitemapUrl[] = partnerStationSegments().map((seg) => ({
    url: `${SITE_URL}/near/${seg}`,
    changefreq: "weekly",
    priority: 0.6,
  }));
  return xmlResponse(urlsetXml(hubs));
}
