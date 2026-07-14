import { getHospitals } from "@/api/hospital";
import { MEDICAL_DEPARTMENTS } from "@/constants/hospital";
import { FEATURED_REGIONS } from "@/constants/region";
import { SITE_URL } from "@/constants/site";
import { departmentsOf } from "@/lib/area";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

// 정적 핵심 페이지 + 지역/지역×과목 랜딩
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

  for (const region of FEATURED_REGIONS) {
    urls.push({
      url: `${SITE_URL}/area/${region}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.8,
    });
    const { items } = await getHospitals({ region, pageSize: 100 });
    for (const department of departmentsOf(items)) {
      // 페이지는 MEDICAL_DEPARTMENTS에 있는 과목만 생성된다(dynamicParams=false).
      // 그 밖의 심평원 원본 과목명을 사이트맵에 실으면 404 URL을 제출하는 꼴이 돼
      // 색인 신뢰도를 깎는다. 페이지 생성 조건과 같은 필터를 건다.
      if (!(MEDICAL_DEPARTMENTS as readonly string[]).includes(department)) continue;
      urls.push({
        url: `${SITE_URL}/area/${region}/${department}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.7,
      });
    }
  }

  return xmlResponse(urlsetXml(urls));
}
