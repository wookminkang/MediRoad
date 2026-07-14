/**
 * 무이재의원(강동) GEO 시드 — 소개글 + FAQ + 의료진.
 *
 * ── 사실 근거 ──
 * 공식 홈페이지 muyjaegd.com — 주소(강동구 양재대로81길 64 코스카빌딩 2~4층)와 전화(1899-1209)가
 * 층수까지 DB와 일치. 강남의 무이재한방병원(학동로 117, muyjae.com)과는 별개 사이트다.
 * 홈페이지 원문: "무이재의원은 항암 면역력 강화 암병원인 무이재한방병원의 네트워크 의원입니다."
 *
 * ⚠️ 넣지 않은 것
 * - 구체적 암종 목록: 홈페이지에 명시가 없다("암"으로 포괄 기재). 고주파온열치료 대상만
 *   "혈액암을 제외한 고형암"으로 범위를 언급할 뿐이라, 암종을 나열하면 근거 없는 주장이 된다.
 * - 효과·성과 표현: 홈페이지에도 수치나 효과 단정이 없다.
 *
 * 표방 진료과목은 가정의학과·내과(공공데이터)이고, 홈페이지 콘텐츠는 암 통합관리다.
 * 둘이 충돌하지 않게 "개설된 진료 항목을 운영한다"는 사실만 쓴다. (의료법 §56)
 *
 * 실행: node --env-file=.env.local scripts/seed-muyjae-gangdong-geo.cjs
 */
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const HOSPITAL_ID = "A1126112"; // 무이재의원 (서울 강동구 성내동)
const HOMEPAGE = "https://www.muyjaegd.com/";

const DESCRIPTION = [
  "무이재의원은 서울 강동구 성내동에 위치한 의원으로, 공식 안내에 따르면 무이재한방병원의 네트워크 의원입니다. 5호선 둔촌동역에서 도보권에 있습니다.",
  "암 수술 전후 회복과 항암·방사선 치료 과정의 컨디션 관리를 다루며, 암단계별 맞춤 관리, 고주파온열치료, 고압산소치료, 도수물리재활, 자율신경 관리, 식이 케어를 진료 항목으로 안내하고 있습니다.",
  "진료 적용 여부는 환자 상태와 기존 치료 계획에 따라 의료진이 판단하며, 표준치료를 대체하지 않습니다.",
].join(" ");

/** 공식 홈페이지 의료진 안내(/423) 기준 — 원장 1명만 등재돼 있다 */
const DOCTORS = [
  {
    name: "박헌국",
    title: "원장",
    specialty:
      "경희대학교 의과대학 졸업 · 뉴저지주립대학교 대학원 의공학 박사 · 前 웨인주립대학교 신경외과 교수 · 前 경희대학교 의과대학·경희의료원 교수",
  },
];

const FAQS = [
  {
    q: "무이재의원은 어떤 진료를 하나요?",
    a: "무이재의원은 서울 강동구 성내동에 위치한 의원으로, 암 수술 전후 회복과 항암·방사선 치료 과정의 컨디션 관리를 다룹니다. 암단계별 맞춤 관리, 고주파온열치료, 고압산소치료, 도수물리재활, 식이 케어를 진료 항목으로 안내하고 있습니다.",
  },
  {
    q: "무이재의원과 무이재한방병원은 어떤 관계인가요?",
    a: "무이재의원은 공식 안내에 따르면 무이재한방병원의 네트워크 의원입니다. 무이재의원은 서울 강동구 성내동에, 무이재한방병원은 서울 강남구 논현동에 있습니다.",
  },
  {
    q: "강동구에서 암 수술 후 회복 관리를 받을 수 있나요?",
    a: "무이재의원은 서울 강동구 양재대로81길 64 코스카빌딩에 있으며, 암 수술 전후의 체력·컨디션 관리와 항암·방사선 치료 과정의 관리를 진료 항목으로 안내하고 있습니다. 적용 여부는 환자 상태와 기존 치료 계획에 따라 의료진이 판단합니다.",
  },
  {
    q: "무이재의원에서 고주파온열치료나 고압산소치료를 받을 수 있나요?",
    a: "무이재의원은 고주파온열치료와 고압산소치료를 진료 항목으로 운영합니다. 시행 여부와 일정은 현재 받고 있는 표준치료 일정과 환자 상태를 확인한 뒤 의료진 판단에 따라 결정됩니다.",
  },
  {
    q: "무이재의원에는 어떤 의료진이 있나요?",
    a: "무이재의원에는 박헌국 원장이 진료합니다. 경희대학교 의과대학을 졸업하고 뉴저지주립대학교에서 의공학 박사 학위를 받았으며, 웨인주립대학교 신경외과 교수와 경희대학교 의과대학·경희의료원 교수를 지냈습니다.",
  },
  {
    q: "무이재의원 진료시간은 어떻게 되나요?",
    a: "무이재의원의 진료시간은 평일 09:00~18:00이며 점심시간은 13:00~14:00입니다. 토요일·일요일·공휴일은 휴진입니다. 정확한 진료 가능 여부는 방문 전 전화(1899-1209)로 확인하시는 것을 권장합니다.",
  },
  {
    q: "무이재의원은 어떻게 찾아가나요?",
    a: "무이재의원은 서울 강동구 양재대로81길 64 코스카빌딩 2~4층에 있으며, 5호선 둔촌동역에서 도보로 이동할 수 있습니다.",
  },
];

(async () => {
  const { error: hErr } = await sb
    .from("hospitals")
    .update({ description: DESCRIPTION, homepage_url: HOMEPAGE })
    .eq("id", HOSPITAL_ID);
  if (hErr) throw hErr;
  console.log("소개글 + 홈페이지 저장 완료");

  await sb.from("hospital_doctors").delete().eq("hospital_id", HOSPITAL_ID);
  const { error: dErr } = await sb.from("hospital_doctors").insert(
    DOCTORS.map((d, i) => ({
      hospital_id: HOSPITAL_ID,
      name: d.name,
      title: d.title,
      specialty: d.specialty,
      sort_order: i,
    })),
  );
  if (dErr) throw dErr;
  console.log(`의료진 ${DOCTORS.length}명 저장 완료`);

  await sb.from("hospital_faqs").delete().eq("hospital_id", HOSPITAL_ID);
  const { error: fErr } = await sb.from("hospital_faqs").insert(
    FAQS.map((f, i) => ({
      hospital_id: HOSPITAL_ID,
      q: f.q,
      a: f.a,
      sort_order: i,
    })),
  );
  if (fErr) throw fErr;
  console.log(`FAQ ${FAQS.length}개 저장 완료`);

  console.log("\n완료");
})();
