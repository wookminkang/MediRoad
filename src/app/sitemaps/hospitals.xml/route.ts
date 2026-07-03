import { getSitemapHospitals } from "@/api/hospital";
import { SITE_URL } from "@/constants/site";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

// 병원 상세 — "정예"(제휴 + 포스트 보유)부터 색인 유도. 78k 전량은 도메인 신뢰도↑ 후 확장.
export const revalidate = 3600;

export async function GET() {
  const hospitals = await getSitemapHospitals();
  const urls: SitemapUrl[] = hospitals.map((h) => ({
    url: `${SITE_URL}/hospitals/${h.slug}`,
    lastmod: h.updatedAt ?? undefined,
    changefreq: "weekly",
    priority: 0.8,
  }));
  return xmlResponse(urlsetXml(urls));
}
