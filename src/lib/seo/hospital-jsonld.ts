import { SITE_URL } from "@/constants/site";
import type { Hospital } from "@/types/hospital";

/**
 * 병원 상세 구조화 데이터 (JSON-LD). NAP(이름·주소·전화) 화면과 동일. (SEO §3-3)
 */

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const naverMapUrl = (h: Hospital) =>
  `https://map.naver.com/p/search/${encodeURIComponent(`${h.name} ${h.region.sigungu}`)}`;

/** MedicalClinic (보강) */
export function buildMedicalClinicLd(h: Hospital) {
  const url = `${SITE_URL}/hospitals/${h.slug}`;
  const sameAs = [
    h.links?.homepage,
    h.links?.naverBooking,
    h.links?.kakaoChannel,
  ].filter(Boolean) as string[];
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: h.name,
    ...(h.description && { description: h.description }),
    url,
    ...(h.phone && { telephone: h.phone }),
    ...(h.photos?.length && { image: h.photos.map((p) => p.url) }),
    address: {
      "@type": "PostalAddress",
      streetAddress: h.roadAddress ?? h.address,
      addressLocality: h.region.sigungu,
      addressRegion: h.region.sido,
      addressCountry: "KR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: h.location.lat,
      longitude: h.location.lng,
    },
    hasMap: naverMapUrl(h),
    medicalSpecialty: h.departments,
    ...(h.hours?.some((d) => !d.closed) && {
      openingHoursSpecification: h.hours
        .filter((d) => !d.closed && d.open && d.close)
        .map((d) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: SCHEMA_DAYS[d.day],
          opens: d.open,
          closes: d.close,
        })),
    }),
    ...(h.amenities?.length && {
      amenityFeature: h.amenities.map((a) => ({
        "@type": "LocationFeatureSpecification",
        name: a,
        value: true,
      })),
    }),
    ...(h.symptoms?.length && { keywords: h.symptoms.join(", ") }),
    ...(sameAs.length && { sameAs }),
  };
}

/** BreadcrumbList — 홈 › 지역 › 과목 › 병원 */
export function buildBreadcrumbLd(h: Hospital) {
  const dept = h.departments[0];
  const items = [
    { name: "홈", item: SITE_URL },
    { name: h.region.sigungu, item: `${SITE_URL}/area/${h.region.sigungu}` },
    ...(dept
      ? [
          {
            name: dept,
            item: `${SITE_URL}/area/${h.region.sigungu}/${dept}`,
          },
        ]
      : []),
    { name: h.name },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.item && { item: it.item }),
    })),
  };
}

/** FAQPage (FAQ 있을 때만) */
export function buildFaqLd(h: Hospital) {
  if (!h.faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: h.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
