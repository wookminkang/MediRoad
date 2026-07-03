import { getConditions } from "@/api/condition";
import { getColumns } from "@/api/column";
import { SITE_URL } from "@/constants/site";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

// 건강칼럼 + 메디브리핑 + 증상·질환 상세(published)
export const revalidate = 3600;

const lm = (iso?: string) => iso ?? undefined;

export async function GET() {
  const [columns, briefings, conditions] = await Promise.all([
    getColumns({ pageSize: 1000 }),
    getColumns({ kind: "briefing", pageSize: 1000 }),
    getConditions(),
  ]);

  const urls: SitemapUrl[] = [
    ...columns.items.map((c) => ({
      url: `${SITE_URL}/health/${c.id}`,
      lastmod: lm(c.updatedAt),
      changefreq: "monthly",
      priority: 0.6,
    })),
    ...briefings.items.map((c) => ({
      url: `${SITE_URL}/briefing/${c.id}`,
      lastmod: lm(c.updatedAt),
      changefreq: "monthly",
      priority: 0.6,
    })),
    ...conditions.map((c) => ({
      url: `${SITE_URL}/conditions/${c.id}`,
      lastmod: lm(c.updatedAt),
      changefreq: "monthly",
      priority: 0.7,
    })),
  ];

  return xmlResponse(urlsetXml(urls));
}
