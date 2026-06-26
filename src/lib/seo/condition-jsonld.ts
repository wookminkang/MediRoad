import { SITE_NAME, SITE_URL } from "@/constants/site";
import type { Condition } from "@/types/condition";

/** MedicalCondition — 증상·관련 진료과 결속(GEO) */
export function buildConditionLd(c: Condition) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalCondition",
    name: c.name,
    description: c.excerpt,
    url: `${SITE_URL}/conditions/${c.id}`,
    ...(c.symptoms.length && {
      signOrSymptom: c.symptoms.map((s) => ({ "@type": "MedicalSignOrSymptom", name: s })),
    }),
    ...(c.departments.length && {
      relevantSpecialty: c.departments.map((d) => ({ "@type": "MedicalSpecialty", name: d })),
    }),
  };
}

export function buildConditionBreadcrumbLd(c: Condition) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "증상·질환", item: `${SITE_URL}/conditions` },
      {
        "@type": "ListItem",
        position: 3,
        name: c.name,
        item: `${SITE_URL}/conditions/${c.id}`,
      },
    ],
  };
}

export function buildConditionFaqLd(c: Condition) {
  if (!c.faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
