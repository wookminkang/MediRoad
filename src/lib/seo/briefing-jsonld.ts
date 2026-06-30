import { anyCategoryLabel } from "@/constants/briefing";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import type { Column } from "@/types/column";

/** 메디브리핑 구조화 데이터 — 시의성 콘텐츠라 Article 기반. */
export function buildBriefingArticleLd(c: Column) {
  const url = `${SITE_URL}/briefing/${c.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    ...(c.thumbnail && { image: [c.thumbnail] }),
    datePublished: c.publishedAt,
    dateModified: c.updatedAt,
    author: { "@type": "Organization", name: c.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.jpg` },
    },
    articleSection: anyCategoryLabel(c.category),
    mainEntityOfPage: url,
    ...(c.summary.length && { abstract: c.summary.join(" ") }),
  };
}

export function buildBriefingBreadcrumbLd(c: Column) {
  const items = [
    { name: "홈", item: SITE_URL },
    { name: "메디브리핑", item: `${SITE_URL}/briefing` },
    {
      name: anyCategoryLabel(c.category),
      item: `${SITE_URL}/briefing?category=${c.category}`,
    },
    { name: c.title, item: `${SITE_URL}/briefing/${c.id}` },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };
}
