/**
 * 리움한방병원(종로) GEO 시드 — 소개글 + FAQ + 의료진.
 *
 * ── 사실 근거 ──
 * 공식 홈페이지 reumjr.com — 푸터의 주소("종로구 대학로 89, 연건동")·전화(02-6213-1010)가
 * DB와 일치. 같은 브랜드의 강동송파점(reumsp.com, 02-6416-1010)과는 별개 사이트다.
 * 브랜드 통합 사이트 reumhospital.com 에서 지점별로 분기된다.
 *
 * ⚠️ 넣지 않은 것 — "허리디스크"
 * 우리 사이트에 이미 발행된 이 병원 포스트가 허리디스크 한방치료를 다루는데,
 * 공식 홈페이지에는 "허리디스크"·"추간판탈출증"이라는 질환명이 없다.
 * 근거로 쓸 수 있는 건 "비수술 통증치료", "척추·관절 통증치료", "추나요법",
 * "척추 수술 후 재활"까지다. 병원이 표방하지 않은 질환을 적으면 의료광고법 위반이 된다.
 *
 * 이 병원의 실체는 암 요양·면역·재활 중심 한방병원이다. 콘텐츠를 척추·통증 위주로 잡으면
 * 홈페이지 실체와 어긋난다.
 *
 * 의료법 §56: 효과 단정·치료경험담·후기·평점 금지.
 *
 * 실행: node --env-file=.env.local scripts/seed-rium-jongno-geo.cjs
 */
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const HOSPITAL_ID = "C1109418"; // 리움한방병원 (서울 종로구 연건동)
const HOMEPAGE = "https://www.reumjr.com/";

const DESCRIPTION = [
  "리움한방병원(종로)은 서울 종로구 대학로에 위치한 한방병원으로, 암 환자의 요양과 회복을 지원합니다. 4호선 혜화역에서 도보권에 있습니다.",
  "암 수술 후 회복, 항암·방사선치료 후 관리, 림프부종 관리, 면역·영양 관리를 진료하며, 암면역센터·재활센터·한방치료센터를 운영하고 고주파온열암치료·고압산소치료 장비를 갖추고 있습니다. 유방암·부인과암을 비롯한 암 환자의 수술 후 재활과 도수치료(림프도수치료 등)를 함께 진행합니다.",
  "한방종양내과 전문의와 방사선종양학과 전문의가 함께 진료하며, 진료 적용 여부는 환자 상태와 기존 치료 계획에 따라 의료진이 판단합니다. 표준치료를 대체하지 않습니다.",
].join(" ");

/** 공식 홈페이지 의료진 소개(reumjr.com/94) 기준 */
const DOCTORS = [
  {
    name: "양재호",
    title: "병원장",
    specialty:
      "한방종양내과 전문의 · 한의학박사(한방종양내과) · 대전대학교 한의과대학 졸업 · 대한암한의학회 이사 · 대한통합암학회 이사",
  },
  {
    name: "김재영",
    title: "진료부장",
    specialty:
      "방사선종양학과 전문의 · 의학석사 · 순천향대학교 의과대학 졸업 · 원자력병원 종양학과 전문수련의·전임의",
  },
  {
    name: "윤지현",
    title: "한방진료부장",
    specialty:
      "한방내과 전문의 · 한의학박사(임상종양학) · 강동경희대한방병원 한방암센터 전문수련의 · 대한통합암학회 인정의",
  },
  {
    name: "이가영",
    title: "진료원장",
    specialty:
      "한방내과 전문의 · 한의학박사(한방종양내과) · 원광대학교 한의과대학 졸업 · 대전대학교 천안한방병원 동서암센터",
  },
  {
    name: "김성필",
    title: "진료원장",
    specialty:
      "침구의학과 전문의 · 한의학박사(침구학) · 동신대학교 한의과대학 졸업 · 한국한의학연구원 임상연구부 선임연구원 · 대한통합암한의학회 인정의",
  },
];

const FAQS = [
  {
    q: "리움한방병원(종로)은 어떤 환자를 진료하나요?",
    a: "리움한방병원(종로)은 서울 종로구 대학로에 위치한 한방병원으로, 암 치료를 받고 있거나 마친 환자의 수술 후 회복, 항암·방사선치료 후 관리, 림프부종 관리, 면역·영양 관리를 진료합니다. 적용 여부는 환자 상태와 기존 치료 계획에 따라 의료진이 판단합니다.",
  },
  {
    q: "종로·대학로에서 암 요양·회복 한방병원을 찾고 있습니다.",
    a: "리움한방병원(종로)은 서울 종로구 대학로 89에 있으며, 4호선 혜화역에서 도보권입니다. 암면역센터·재활센터·한방치료센터를 운영하며 암 환자의 요양과 회복을 지원합니다.",
  },
  {
    q: "리움한방병원(종로)에서 고주파온열암치료를 받을 수 있나요?",
    a: "리움한방병원(종로)은 고주파온열암치료와 고압산소치료를 운영합니다. 시행 여부와 일정은 현재 받고 있는 표준치료 일정과 환자 상태를 확인한 뒤 의료진 판단에 따라 결정됩니다.",
  },
  {
    q: "암 수술 후 재활이나 림프부종 관리도 하나요?",
    a: "리움한방병원(종로) 재활센터는 암 수술 후 재활, 림프부종, 골절, 어깨·무릎 관절 수술 후 재활을 진행하며 림프도수치료·관절도수치료 등 도수치료를 운영합니다. 새로 생긴 부종은 다른 원인일 수 있어 상태 평가를 먼저 받는 것이 좋습니다.",
  },
  {
    q: "리움한방병원(종로)에는 어떤 의료진이 있나요?",
    a: "리움한방병원(종로)에는 한방종양내과 전문의인 양재호 병원장, 방사선종양학과 전문의인 김재영 진료부장, 한방내과 전문의인 윤지현 한방진료부장과 이가영 진료원장, 침구의학과 전문의인 김성필 진료원장이 진료합니다. 한의학과 의학 전문의가 함께 진료하는 것이 특징입니다.",
  },
  {
    q: "리움한방병원(종로)은 어떻게 찾아가나요?",
    a: "리움한방병원(종로)은 서울 종로구 대학로 89 대학로빌딩에 있으며, 4호선 혜화역에서 도보로 이동할 수 있습니다.",
  },
  {
    q: "리움한방병원(종로) 전화번호는 어떻게 되나요?",
    a: "리움한방병원(종로)의 전화번호는 02-6213-1010입니다. 진료 가능 여부와 휴진일은 방문 전 전화로 확인하시는 것을 권장합니다.",
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
