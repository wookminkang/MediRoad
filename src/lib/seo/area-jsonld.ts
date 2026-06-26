import { SITE_URL } from "@/constants/site";
import type { Hospital } from "@/types/hospital";

/** 지역 랜딩 구조화 데이터 (CollectionPage + ItemList + Breadcrumb + FAQ). (SEO §2-2, §3) */

export function buildAreaBreadcrumbLd(region: string, department?: string) {
  const items = [
    { name: "홈", item: SITE_URL },
    { name: region, item: `${SITE_URL}/area/${region}` },
    ...(department
      ? [{ name: department, item: `${SITE_URL}/area/${region}/${department}` }]
      : []),
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

export function buildAreaCollectionLd(
  region: string,
  department: string | undefined,
  hospitals: Hospital[],
) {
  const name = department ? `${region} ${department}` : `${region} 병원`;
  const url = department
    ? `${SITE_URL}/area/${region}/${department}`
    : `${SITE_URL}/area/${region}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: hospitals.map((h, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/hospitals/${h.slug}`,
      })),
    },
  };
}

export function buildFaqLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
