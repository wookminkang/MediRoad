/** 사이트맵 XML 빌더 — 인덱스(<sitemapindex>) + 개별 사이트맵(<urlset>) 직접 생성. */

export type SitemapUrl = {
  url: string;
  lastmod?: Date | string;
  changefreq?: string;
  priority?: number;
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// <loc>은 canonical과 동일하게 비ASCII 경로를 퍼센트 인코딩한 뒤 XML 이스케이프.
// (sitemap URL ≠ canonical 불일치로 인한 네이버 등 색인 누락 방지)
const encLoc = (s: string) => esc(encodeURI(s));

const iso = (d?: Date | string): string | undefined =>
  d == null ? undefined : typeof d === "string" ? d : d.toISOString();

export function urlsetXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const lm = iso(u.lastmod);
      return (
        `<url><loc>${encLoc(u.url)}</loc>` +
        (lm ? `<lastmod>${lm}</lastmod>` : "") +
        (u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : "") +
        (u.priority != null ? `<priority>${u.priority}</priority>` : "") +
        `</url>`
      );
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function sitemapIndexXml(
  items: { loc: string; lastmod?: Date | string }[],
): string {
  const body = items
    .map((s) => {
      const lm = iso(s.lastmod);
      return `<sitemap><loc>${encLoc(s.loc)}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ""}</sitemap>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
