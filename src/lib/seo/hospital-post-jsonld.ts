import { SITE_NAME, SITE_URL } from "@/constants/site";
import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

/** 병원 포스트 → MedicalWebPage (작성자=병원, 다룬 질환, 병원 geo 결속) */
export function buildHospitalPostLd(h: Hospital, post: HospitalPost) {
  const url = `${SITE_URL}/hospitals/${h.slug}/posts/${post.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    url,
    headline: post.title,
    description: post.excerpt,
    inLanguage: "ko-KR",
    ...(post.publishedAt && { datePublished: post.publishedAt }),
    ...(post.updatedAt && { dateModified: post.updatedAt }),
    ...(post.thumbnail && { image: post.thumbnail }),
    author: {
      "@type": "MedicalClinic",
      name: post.author.name,
      ...(h.departments[0] && { medicalSpecialty: h.departments[0] }),
    },
    ...(post.reviewedBy && {
      reviewedBy: {
        "@type": "Physician",
        name: post.reviewedBy.name,
        ...(post.reviewedBy.specialty && {
          medicalSpecialty: post.reviewedBy.specialty,
        }),
      },
    }),
    ...(post.conditions?.length && {
      about: post.conditions.map((c) => ({ "@type": "MedicalCondition", name: c })),
    }),
    mainEntityOfPage: {
      "@type": "MedicalClinic",
      name: h.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: h.roadAddress ?? h.address,
        addressRegion: h.region.sido,
        addressLocality: h.region.sigungu,
        addressCountry: "KR",
      },
      ...(h.location?.lat &&
        h.location?.lng && {
          geo: {
            "@type": "GeoCoordinates",
            latitude: h.location.lat,
            longitude: h.location.lng,
          },
        }),
    },
  };
}

/** 빵부스러기: 홈 > 병원 > 포스트 */
export function buildPostBreadcrumbLd(h: Hospital, post: HospitalPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: h.name,
        item: `${SITE_URL}/hospitals/${h.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/hospitals/${h.slug}/posts/${post.id}`,
      },
    ],
  };
}

/** FAQPage (post.faqs 있을 때만) */
export function buildPostFaqLd(post: HospitalPost) {
  if (!post.faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
