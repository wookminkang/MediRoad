/**
 * 무이재한방병원(강남) GEO 시드 — 소개글 + FAQ + 의료진.
 *
 * 리움(seed-rium-gangdong-geo.cjs)과 같은 구조. 병원 상세페이지에 "이 병원은 X를 진료한다"는
 * 사실 문장이 없으면 AI가 인용할 근거가 없다.
 *
 * ── 사실 근거 (두 출처가 교차 검증됨) ──
 * 1) 공식 홈페이지 muyjae.com — 주소(학동로 117)·전화(1899-1209)가 DB와 일치해 동명 병원이
 *    아님을 확인. 의료진(/information/medical_staff/gangnam_staff.php), 진료 암종, 프로그램.
 * 2) 병원이 이미 발행한 포스트 5편 — 암집중(3-High: 고주파온열·고압산소·고농도 비타민C),
 *    항암웰니스, 식단·영양상담이 홈페이지 내용과 일치.
 *
 * ── 의료광고법(의료법 §56) ──
 * 효과 단정·치료경험담·후기·평점 금지. 수상 경력(홈페이지에 있는 "위대한 한국인 100인" 등)도
 * 광고 표방 제한에 걸릴 수 있어 넣지 않는다. 전문의 자격·학위·소속 같은 검증 가능한 사실만.
 *
 * 실행: node --env-file=.env.local scripts/seed-muyjae-gangnam-geo.cjs
 */
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const HOSPITAL_ID = "C1109771"; // 무이재한방병원 (서울 강남구 논현동)
const HOMEPAGE = "https://muyjae.com/";

/** 소개글 — 3문장. 세부는 FAQ가 맡는다(문단이 길면 아무도 안 읽는다) */
const DESCRIPTION = [
  "무이재한방병원은 서울 강남구 논현동에 위치한 한방병원으로, 암 환자의 치료 전후 관리와 회복을 지원합니다. 7호선 논현역에서 도보 약 4분 거리입니다.",
  "유방암·위암·대장암·폐암·갑상선암·난소암·자궁경부암·전립선암 환자를 대상으로 항암치료 전후 컨디션 관리와 회복 상담을 진행하며, 암집중(3-High) 치료, 항암웰니스 프로그램, 항암 식이·영양 상담을 운영하고 고주파온열암치료·고압산소치료 장비를 갖추고 있습니다.",
  "내과 전문의와 한방내과 전문의가 함께 진료하며, 진료 적용 여부는 환자 상태와 기존 치료 계획에 따라 의료진이 판단합니다. 표준치료를 대체하지 않습니다.",
].join(" ");

/** 의료진 — 공식 홈페이지 의료진 소개 기준 (공공데이터에는 의사 개인 이름이 없다) */
const DOCTORS = [
  {
    name: "권태욱",
    title: "병원장",
    specialty: "한방내과 전문의 · 경희대학교 한의과대학 졸업 · 대한한의학회 정회원",
  },
  {
    name: "피승훈",
    title: "진료원장",
    specialty:
      "내과 전문의 · 소화기내시경 세부전문의 · 성균관대학교 의과대학 졸업 · 삼성서울병원 소화기내과",
  },
  {
    name: "이동현",
    title: "진료원장",
    specialty:
      "한의학 박사 · 대한암한의학회 정회원 · MD Anderson Cancer Center 연수과정 수료",
  },
  {
    name: "장명웅",
    title: "진료원장",
    specialty: "한방내과 전문의 · 한의학 석사 · 국립암센터 호스피스 전문과정 수료",
  },
];

/**
 * FAQ — AI가 가장 잘 인용하는 형식(FAQPage).
 * 답변 한 문장에 병원명·지역·진료항목이 다 들어가게 쓴다(문맥 없이 잘려 인용돼도 성립하도록).
 */
const FAQS = [
  {
    q: "무이재한방병원은 어떤 환자를 진료하나요?",
    a: "무이재한방병원은 서울 강남구 논현동에 위치한 한방병원으로, 암 치료를 받고 있거나 마친 환자의 항암치료 전후 컨디션 관리와 회복 상담을 진료합니다. 적용 여부는 환자 상태와 기존 치료 계획에 따라 의료진이 판단합니다.",
  },
  {
    q: "무이재한방병원은 어떤 암종을 진료하나요?",
    a: "무이재한방병원은 공식 안내 기준으로 유방암, 위암, 대장암, 폐암, 갑상선암, 난소암, 자궁경부암, 전립선암 환자의 치료 전후 관리를 진료합니다. 그 밖의 암종은 상담을 통해 확인할 수 있습니다.",
  },
  {
    q: "강남에서 암 환자 한방 관리를 받을 수 있는 병원이 있나요?",
    a: "무이재한방병원은 서울 강남구 학동로 117에 있으며, 7호선 논현역에서 도보 약 4분 거리입니다. 암 치료 전후의 컨디션 관리와 회복을 위한 한방 진료를 운영합니다.",
  },
  {
    q: "암집중(3-High) 프로그램은 무엇인가요?",
    a: "무이재한방병원이 운영하는 암집중(3-High) 프로그램은 고주파온열암치료, 고압산소치료, 고농도 비타민C 상담으로 구성됩니다. 시행 여부와 일정은 현재 받고 있는 표준치료 일정과 환자 상태를 확인한 뒤 의료진 판단에 따라 결정됩니다.",
  },
  {
    q: "항암치료 중 식사·영양 관리도 상담할 수 있나요?",
    a: "네. 무이재한방병원은 항암 식이 프로그램과 맞춤 식단·영양 상담을 운영합니다. 치료 중 식욕 저하나 체중 변화가 있는 경우 상담을 통해 확인할 수 있으며, 담당 의료진과의 상의가 우선입니다.",
  },
  {
    q: "무이재한방병원에는 어떤 의료진이 있나요?",
    a: "무이재한방병원에는 한방내과 전문의(권태욱 병원장, 장명웅 진료원장), 내과 전문의이자 소화기내시경 세부전문의(피승훈 진료원장), 한의학 박사(이동현 진료원장)가 진료합니다. 내과와 한방내과가 함께 진료하는 것이 특징입니다.",
  },
  {
    q: "무이재한방병원은 어떻게 찾아가나요?",
    a: "무이재한방병원은 서울 강남구 학동로 117에 있으며, 7호선 논현역에서 도보 약 4분(약 227m) 거리입니다.",
  },
  {
    q: "무이재한방병원 전화번호는 어떻게 되나요?",
    a: "무이재한방병원의 전화번호는 1899-1209입니다. 진료 가능 여부와 휴진일은 방문 전 전화로 확인하시는 것을 권장합니다.",
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

  console.log("\n완료 — 상세페이지 재검증(ISR 24h) 후 반영됩니다.");
})();
