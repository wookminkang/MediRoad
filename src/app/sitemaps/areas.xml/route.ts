import { AREA_REGIONS } from "@/constants/area-regions";
import { SITE_URL } from "@/constants/site";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

/**
 * 지역·지역×진료과목 랜딩 (약 2,100개).
 *
 * static.xml에 섞으면 파일이 지나치게 커지고 "정적 핵심 페이지"라는 이름과도 안 맞는다.
 * 목록은 빌드 시 생성된 상수(area-regions.ts)에서 읽는다 — 요청마다 지역 수만큼
 * DB를 두드리면 타임아웃 난다.
 */
export const revalidate = 86400;

export async function GET() {
  const now = new Date();
  const urls: SitemapUrl[] = [];

  for (const r of AREA_REGIONS) {
    urls.push({
      url: `${SITE_URL}/area/${r.slug}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.8,
    });
    for (const department of r.departments) {
      urls.push({
        url: `${SITE_URL}/area/${r.slug}/${department}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.7,
      });
    }
  }

  return xmlResponse(urlsetXml(urls));
}
