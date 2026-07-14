import type { OpenLateHospital } from "@/api/hospital";
import { SITE_URL } from "@/constants/site";

/**
 * 야간·일요일 진료 목록 구조화 데이터.
 *
 * ItemList로 병원을 순서대로 나열하면 AI·검색엔진이 "이 지역 야간진료는 이 목록"이라고
 * 통째로 인식한다. 각 항목이 실제 병원(MedicalClinic)이고 진료시간을 달고 있어서,
 * "밤 9시까지 하는 곳"을 물으면 openingHours로 대조해 답할 수 있다.
 */
export function buildOpenLateLd(
  regionLabel: string,
  kind: "night" | "sunday",
  slug: string,
  items: OpenLateHospital[],
) {
  const name =
    kind === "night"
      ? `${regionLabel} 야간진료 병원 ${items.length}곳`
      : `${regionLabel} 일요일 진료 병원 ${items.length}곳`;
  const path = `${SITE_URL}/area/${slug}/${kind}`;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: path,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: items.slice(0, 50).map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "MedicalClinic",
        name: h.name,
        url: `${SITE_URL}/hospitals/${h.slug}`,
        ...(h.phone ? { telephone: h.phone } : {}),
        ...(h.address ? { address: h.address } : {}),
      },
    })),
  };
}

export function buildOpenLateBreadcrumb(
  regionLabel: string,
  kind: "night" | "sunday",
  slug: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "지역별",
        item: `${SITE_URL}/area`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: regionLabel,
        item: `${SITE_URL}/area/${slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: kind === "night" ? "야간진료" : "일요일 진료",
        item: `${SITE_URL}/area/${slug}/${kind}`,
      },
    ],
  };
}
