import { getNeighborDistricts } from "@/constants/region-neighbors";
import { SITE_URL } from "@/constants/site";
import { buildAutoDescription, walkMinutes } from "@/lib/hospital";
import type { Hospital } from "@/types/hospital";

/**
 * 병원 상세 구조화 데이터 (JSON-LD). NAP(이름·주소·전화) 화면과 동일. (SEO §3-3)
 */

// E-Gen 요일(1=월 … 7=일, 8=공휴일) → schema.org dayOfWeek
const EGEN_TO_SCHEMA: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

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
    // 소개글이 없는 병원(대다수)은 description이 통째로 빠져 있었다.
    // 화면에 뿌리는 자동 소개문과 같은 문장을 넣는다 — 화면·구조화 데이터 불일치 없음.
    description: h.description ?? buildAutoDescription(h),
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
    // 진료 지역(자치구 + 인접 자치구) — 근처 지역 검색·생성형 인용 대응
    areaServed: [h.region.sigungu, ...getNeighborDistricts(h.region.sigungu)].map(
      (name) => ({ "@type": "AdministrativeArea", name }),
    ),
    ...(h.nearestStation && {
      publicTransport: `${h.nearestStation.name}${
        h.nearestStation.distanceM
          ? ` 도보 ${walkMinutes(h.nearestStation.distanceM)}분`
          : ""
      }`,
    }),
    ...(h.hours?.some((d) => !d.closed) && {
      openingHoursSpecification: h.hours
        .filter((d) => !d.closed && d.open && d.close && EGEN_TO_SCHEMA[d.day])
        .map((d) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: EGEN_TO_SCHEMA[d.day],
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
    ...(h.symptoms?.length && {
      keywords: h.symptoms.join(", "),
      /*
       * 병원이 다루는 진료 항목을 서비스로도 표현한다. keywords만으로는 "이 병원이 무엇을
       * 진료하는가"가 기계가 읽을 형태로 남지 않는다. 화면의 "진료하는 항목"과 같은 값이라
       * 숨은 데이터가 아니다(가이드 §3-3).
       */
      availableService: h.symptoms.map((s) => ({
        "@type": "MedicalTherapy",
        name: s,
      })),
    }),
    /*
     * 의료진 — E-E-A-T. "누가 진료하는가"가 AI가 병원을 신뢰할지 판단하는 근거가 된다.
     * 화면의 "의료진" 섹션과 같은 값이라 숨은 데이터가 아니다(가이드 §3-3).
     */
    ...(h.doctors?.length && {
      physician: h.doctors.map((d) => ({
        "@type": "Physician",
        name: d.name,
        ...(d.title && { jobTitle: d.title }),
        ...(d.specialty && { medicalSpecialty: d.specialty }),
      })),
    }),
    ...(sameAs.length && { sameAs }),
  };
}

/** BreadcrumbList — 홈 › 지역 › 병원 (화면 breadcrumb과 일치, 진료과목 제외) */
export function buildBreadcrumbLd(h: Hospital) {
  const items = [
    { name: "홈", item: SITE_URL },
    { name: h.region.sigungu, item: `${SITE_URL}/area/${h.region.sigungu}` },
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
