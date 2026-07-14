import { SITE_NAME, SITE_URL } from "@/constants/site";

/**
 * 운영 주체 구조화 데이터 — 전역(layout)에 넣는다.
 *
 * AI는 의료 정보를 인용하기 전에 "이걸 누가 썼는가"를 본다. 운영 주체가 불명확하면
 * 내용이 아무리 정확해도 인용을 피한다. 구글의 E-E-A-T(전문성·경험·권위·신뢰) 평가도
 * 의료·금융처럼 사람에게 영향이 큰 주제(YMYL)에서 특히 까다롭다.
 *
 * 값은 전부 푸터에 이미 공개된 실제 사업자 정보다. 지어낸 것이 없다.
 * 주소는 사이트 어디에도 없어서 넣지 않았다 — 없는 건 쓰지 않는다.
 */
export function buildOrganizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "메디로드",
    legalName: "(주)알리다고",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.svg`,
    },
    description:
      "전국 병원·의원·치과·한의원·한방병원 정보를 공공데이터 기반으로 제공하는 병원 찾기 서비스입니다. 환자 후기·평점은 의료법에 따라 제공하지 않습니다.",
    // 사업자등록번호 — 이 회사가 실재함을 기계가 대조할 수 있는 유일한 식별자다.
    taxID: "640-87-03558",
    founder: { "@type": "Person", name: "전형진" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: "+82-10-7665-4418",
        email: "oper2068@kakao.com",
        areaServed: "KR",
        availableLanguage: ["ko"],
      },
    ],
    // 정보의 출처를 명시한다. AI가 신뢰도를 판단할 때 가장 먼저 보는 항목이다.
    knowsAbout: ["병원 찾기", "진료시간", "진료과목", "야간진료", "건강정보"],
  };
}

/**
 * /about 페이지 구조화 데이터 — 이 페이지가 "회사 소개"임을 명시.
 * 위 Organization을 참조해 같은 주체임을 알린다.
 */
export function buildAboutPageLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#webpage`,
    url: `${SITE_URL}/about`,
    name: "메디로드 소개 — 운영 주체와 정보 출처",
    inLanguage: "ko-KR",
    isPartOf: { "@id": `${SITE_URL}/#organization` },
    about: { "@id": `${SITE_URL}/#organization` },
  };
}
