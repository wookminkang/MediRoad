import { anyCategoryLabel } from "@/constants/briefing";
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
    // 감수는 개인(Person) 이름 대신 편집팀(Organization) 명의로. 확인되지 않은 개인
    // 이름을 구조화 데이터에 넣으면 AI·검색엔진에도 그대로 노출돼 신뢰도에 해가 된다.
    reviewedBy: {
      "@type": "Organization",
      name: `${SITE_NAME} 의료편집팀`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.jpg` },
    },
    about: { "@type": "MedicalCondition", name: anyCategoryLabel(c.category) },
    mainEntityOfPage: url,
    ...(c.summary.length && { abstract: c.summary.join(" ") }),
    ...(c.references?.length && { citation: c.references.map((r) => r.title) }),
  };
}

export function buildColumnBreadcrumbLd(c: Column) {
  const items = [
    { name: "홈", item: SITE_URL },
    { name: "건강정보", item: `${SITE_URL}/health` },
    {
      name: anyCategoryLabel(c.category),
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
