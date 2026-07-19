import { SITE_NAME, SITE_URL } from "@/constants/site";
import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

import { buildMedicalClinicLd } from "./hospital-jsonld";

/** @graph 노드에서 개별 @context 제거(그래프 최상단에만 둔다) */
function stripContext<T extends Record<string, unknown>>(o: T): Omit<T, "@context"> {
  const copy = { ...o };
  delete copy["@context"];
  return copy;
}

/** 병원 포스트 → MedicalWebPage (작성자=병원, 다룬 질환, 병원 geo 결속) */
export function buildHospitalPostLd(h: Hospital, post: HospitalPost, pageUrl?: string) {
  const url = pageUrl ?? `${SITE_URL}/hospitals/${h.slug}/posts/${post.id}`;
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

/** 빵부스러기: 홈 > 병원 > 포스트. pageUrl 주면 포스트 항목 URL을 그걸로(짧은 URL). */
export function buildPostBreadcrumbLd(h: Hospital, post: HospitalPost, pageUrl?: string) {
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
        item: pageUrl ?? `${SITE_URL}/hospitals/${h.slug}/posts/${post.id}`,
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

/**
 * 포스트 SEO/GEO 구조화 마크업 — 연결된 @graph.
 *
 * 노드끼리 @id로 상호참조해 검색·생성엔진이 "이 글은 이 병원(엔티티)이 이 질환/과목을
 * 다룬다"를 이해하게 만든다. (WebSite → Organization → MedicalClinic → MedicalWebPage →
 * BreadcrumbList → FAQPage)
 *  - MedicalWebPage.about → 병원 엔티티(@id) + 진료과목 + 질환
 *  - medicalAudience(Patient), lastReviewed(E-E-A-T), keywords, speakable(음성/GEO)
 *  - isPartOf/publisher로 사이트·발행처 결속
 */
export function buildPostGraphLd(
  h: Hospital,
  post: HospitalPost,
  pageUrl: string,
) {
  const clinicId = `${SITE_URL}/hospitals/${h.slug}#clinic`;
  const websiteId = `${SITE_URL}/#website`;
  const orgId = `${SITE_URL}/#organization`;
  const reviewedAt = post.updatedAt || post.publishedAt;
  const specialty = post.relatedDepartments?.[0] ?? post.reviewedBy?.specialty;

  const website = {
    "@type": "WebSite",
    "@id": websiteId,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    inLanguage: "ko-KR",
    publisher: { "@id": orgId },
  };
  const organization = {
    "@type": "Organization",
    "@id": orgId,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
  };
  const clinic = { ...stripContext(buildMedicalClinicLd(h)), "@id": clinicId };

  const webpage = {
    "@type": "MedicalWebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: `${h.name} — ${post.title}`,
    headline: post.title,
    description: post.excerpt,
    inLanguage: "ko-KR",
    ...(post.publishedAt && { datePublished: post.publishedAt }),
    ...(reviewedAt && { dateModified: reviewedAt, lastReviewed: reviewedAt }),
    ...(post.thumbnail && { image: post.thumbnail }),
    isPartOf: { "@id": websiteId },
    mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
    about: [
      { "@id": clinicId },
      ...(specialty ? [{ "@type": "MedicalSpecialty", name: specialty }] : []),
      ...(post.conditions?.map((c) => ({
        "@type": "MedicalCondition",
        name: c,
      })) ?? []),
    ],
    medicalAudience: { "@type": "MedicalAudience", audienceType: "Patient" },
    author: { "@id": clinicId },
    ...(post.reviewedBy && {
      reviewedBy: {
        "@type": "Physician",
        name: post.reviewedBy.name,
        ...(post.reviewedBy.specialty && {
          medicalSpecialty: post.reviewedBy.specialty,
        }),
      },
    }),
    publisher: { "@id": orgId },
    ...(post.tags?.length && { keywords: post.tags.join(", ") }),
    mainContentOfPage: { "@type": "WebPageElement", cssSelector: ".post-body" },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".post-tldr"],
    },
  };

  const breadcrumb = stripContext(buildPostBreadcrumbLd(h, post, pageUrl));
  const faq = post.faqs?.length ? stripContext(buildPostFaqLd(post)!) : null;

  return {
    "@context": "https://schema.org",
    "@graph": [
      website,
      organization,
      clinic,
      webpage,
      breadcrumb,
      ...(faq ? [faq] : []),
    ],
  };
}
