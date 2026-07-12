import { SITE_URL } from "@/constants/site";
import type { Hospital } from "@/types/hospital";

/** 역세권 랜딩 구조화 데이터 (CollectionPage + ItemList + Breadcrumb). (SEO §9-2) */

export function buildStationBreadcrumbLd(station: string, department?: string) {
  const items = [
    { name: "홈", item: SITE_URL },
    { name: station, item: `${SITE_URL}/near/${station}` },
    ...(department
      ? [{ name: department, item: `${SITE_URL}/near/${station}/${department}` }]
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

export function buildStationCollectionLd(
  station: string,
  department: string | undefined,
  hospitals: Hospital[],
) {
  const name = department ? `${station} ${department}` : `${station} 병원`;
  const url = department
    ? `${SITE_URL}/near/${station}/${department}`
    : `${SITE_URL}/near/${station}`;
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
