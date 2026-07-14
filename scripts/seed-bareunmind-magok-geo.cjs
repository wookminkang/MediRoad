/**
 * 바른마음한의원 마곡발산점 GEO 시드 — 소개글 + FAQ + 의료진.
 *
 * ── 사실 근거 ──
 * 공식 홈페이지 bareunmind.co.kr — 전화(02-6956-8775)·주소(공항대로 271)가 DB와 완전 일치해
 * 동명 병원이 아님을 확인. 의료진 3명, 프로그램 4개(추나·교통사고·입원·린다이어트), 진료 질환.
 *
 * ⚠️ 의도적으로 넣지 않은 것 — "피부미용센터", "통증입원센터"
 * 우리 사이트에 이미 발행된 이 병원 포스트 제목이 두 센터를 언급하는데,
 * 공식 홈페이지 전 페이지 어디에도 그 센터명이 없고 피부·미용 진료 항목 자체가 없다.
 * 병원이 운영하지 않는 센터를 적으면 의료광고법 위반이 된다. 병원 확인 전까지 쓰지 않는다.
 * (홈페이지에서 검증되는 진료 축은 근골격계 통증·추나·입원·교통사고·한방 다이어트다.)
 *
 * 의료법 §56: 효과 단정·치료경험담·후기·평점 금지. 수상 경력도 표방 제한에 걸릴 수 있어 제외.
 *
 * 실행: node --env-file=.env.local scripts/seed-bareunmind-magok-geo.cjs
 */
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const HOSPITAL_ID = "B1105900"; // 바른마음한의원 마곡발산점 (서울 강서구 마곡동)
const HOMEPAGE = "https://bareunmind.co.kr/";

const DESCRIPTION = [
  "바른마음한의원 마곡발산점은 서울 강서구 마곡동에 위치한 한의원으로, 5호선 발산역 바로 앞(약 31m)에 있습니다.",
  "허리·목 디스크와 협착증, 어깨·무릎 통증, 교통사고 후유증, 수술 후 재활 등 근골격계 통증을 진료하며, 추나치료·침·약침·한약 치료와 함께 7층 입원실에서 입원 치료를 운영합니다.",
  "진료 적용 여부는 환자 상태에 따라 의료진이 판단하며, 정확한 진료 가능 여부는 방문 전 상담으로 확인하시기 바랍니다.",
].join(" ");

/** 공식 홈페이지 의료진 소개 기준 (공공데이터에는 의사 개인 이름이 없다) */
const DOCTORS = [
  {
    name: "위지훈",
    title: "대표원장",
    specialty:
      "한의사 · 동국대학교 한의과대학 졸업 · 동국대학교 한의과대학 외래교수 · 서울시한의사회 보험이사",
  },
  {
    name: "노정호",
    title: "진료원장",
    specialty:
      "한의사 · 원광대학교 한의과대학 졸업 · 경희대학교 대학원 동서의학과 석사 · 대한스포츠한의학회 공인 팀닥터",
  },
  {
    name: "양현동",
    title: "진료원장",
    specialty:
      "한의사 · 대구한의대학교 한의과대학 졸업 · 창원자생한방병원 일반수련의 수료 · 대한응용신경의학회 인정의",
  },
];

const FAQS = [
  {
    q: "바른마음한의원 마곡발산점은 어떤 진료를 하나요?",
    a: "바른마음한의원 마곡발산점은 서울 강서구 마곡동에 위치한 한의원으로, 허리·목 디스크와 협착증, 어깨·무릎 통증, 교통사고 후유증, 수술 후 재활 등 근골격계 통증을 진료합니다. 추나치료, 침, 약침, 한약, 물리치료를 시행합니다.",
  },
  {
    q: "마곡·발산에서 교통사고 후유증 한방 치료를 받을 수 있나요?",
    a: "바른마음한의원 마곡발산점은 교통사고 치료를 운영하며, 자동차보험 적용 진료를 안내하고 있습니다. 5호선 발산역 바로 앞(약 31m)에 있어 접근이 쉽습니다.",
  },
  {
    q: "한의원인데 입원 치료도 가능한가요?",
    a: "네. 바른마음한의원 마곡발산점은 7층에 입원실을 운영하며, 교통사고·근골격계 통증 등에 대한 입원 치료를 안내하고 있습니다. 입원 가능 여부는 환자 상태에 따라 의료진이 판단합니다.",
  },
  {
    q: "추나치료도 받을 수 있나요?",
    a: "네. 바른마음한의원 마곡발산점은 추나치료(바른치료)를 운영합니다. 척추신경추나의학회 소속 의료진이 진료하며, 적용 여부는 상태 평가 후 결정됩니다.",
  },
  {
    q: "바른마음한의원 마곡발산점에는 어떤 의료진이 있나요?",
    a: "바른마음한의원 마곡발산점에는 위지훈 대표원장(동국대학교 한의과대학 외래교수), 노정호 진료원장(대한스포츠한의학회 공인 팀닥터), 양현동 진료원장(대한응용신경의학회 인정의)이 진료합니다.",
  },
  {
    q: "바른마음한의원 마곡발산점은 어떻게 찾아가나요?",
    a: "바른마음한의원 마곡발산점은 서울 강서구 공항대로 271 이천이프라자에 있으며, 5호선 발산역에서 도보 1분 이내(약 31m) 거리입니다.",
  },
  {
    q: "바른마음한의원 마곡발산점 전화번호는 어떻게 되나요?",
    a: "바른마음한의원 마곡발산점의 전화번호는 02-6956-8775입니다. 진료 가능 여부와 휴진일은 방문 전 전화로 확인하시는 것을 권장합니다.",
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
