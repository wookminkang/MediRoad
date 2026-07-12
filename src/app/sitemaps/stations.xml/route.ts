import { STATION_TARGETS } from "@/constants/stations.generated";
import { SITE_URL } from "@/constants/site";
import { stationSegment } from "@/lib/station-landing";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

// 역세권 허브(/near/{역}) — 병원 3곳+ 역 828개. 역×과목(/near/{역}/{과})은
// 각 허브가 내부링크로 연결 → 허브를 통해 크롤 발견(사이트맵은 허브만 유지).
export const revalidate = 86400;

export function GET() {
  const urls: SitemapUrl[] = STATION_TARGETS.map((s) => ({
    url: `${SITE_URL}/near/${stationSegment(s.name)}`,
    changefreq: "weekly",
    priority: 0.6,
  }));
  return xmlResponse(urlsetXml(urls));
}
