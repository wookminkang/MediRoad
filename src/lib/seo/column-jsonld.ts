import { categoryLabel } from "@/constants/column";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import type { Column } from "@/types/column";

/** 건강 칼럼 구조화 데이터 (MedicalWebPage + Article, E-E-A-T). (SEO §3-7) */
export function buildColumnArticleLd(c: Column) {
  const url = `${SITE_URL}/health/${c.id}`;
  return {
    "@context": "https://schema.org",
    "@type": ["MedicalWebPage", "Article"],
    headline: c.title,
    ...(c.thumbnail && { image: [c.thumbnail] }),
    datePublished: c.publishedAt,
    dateModified: c.updatedAt,
    lastReviewed: c.updatedAt,
    author: { "@type": "Organization", name: c.author },
    reviewedBy: {
      "@type": "Person",
      name: c.reviewedBy.name,
      jobTitle: c.reviewedBy.specialty,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.jpg` },
    },
    about: { "@type": "MedicalCondition", name: categoryLabel(c.category) },
    mainEntityOfPage: url,
    ...(c.summary.length && { abstract: c.summary.join(" ") }),
    ...(c.references?.length && { citation: c.references.map((r) => r.title) }),
  };
}

export function buildColumnBreadcrumbLd(c: Column) {
  const items = [
    { name: "홈", item: SITE_URL },
    { name: "건강 칼럼", item: `${SITE_URL}/health` },
    {
      name: categoryLabel(c.category),
      item: `${SITE_URL}/health?category=${c.category}`,
    },
    { name: c.title, item: `${SITE_URL}/health/${c.id}` },
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
