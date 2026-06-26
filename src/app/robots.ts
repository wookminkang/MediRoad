import type { MetadataRoute } from "next";

import { SITE_URL } from "@/constants/site";

/**
 * robots.txt — 관리자만 차단. 검색·필터 페이지(/hospitals?…)는 meta robots로
 * noindex,follow 처리하므로 robots.txt에서 막지 않음(링크 전파 유지). (SEO §1)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/search"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
