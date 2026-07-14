/**
 * 리움 강동송파점 — 췌장암·담도암 반영.
 *
 * 오랫동안 비어 있던 칸이었다. 27개 GEO 질의 체크시트에서 "췌장암·담낭암·췌담도암을
 * 진료하는가"만 답을 못 하고 있었는데, 리움 자료(홈페이지 게시판 29건 + 공식 블로그
 * 55건, 총 109개 문서)를 전수 확인해 답이 나왔다.
 *
 *   췌장암 → 진료함. 전용 글 "췌장암 항암치료 후유증"(reumjr.com/igyNT/326) 외
 *            폴피리녹스·젬시타빈·이리노테칸 부작용 글, 소화기암 요양 대상에 명시. 7건.
 *   담도암 → 진료함. 전용 글 "담도암 수술 후 관리"(reumjr.com/igyNT/356),
 *            BSD-2000 심부암 적응증에 명시. 3건.
 *   담낭암 → 아님. 109개 문서 전체에서 0건. "담관암"·"췌담도암"도 0건.
 *
 * 그래서 췌장암·담도암만 넣는다. 담낭암은 넣지 않는다 — 근거가 없는 진료를 적으면
 * 의료광고법 위반이고, 환자가 헛걸음한다.
 *
 * 실행: node --env-file=.env.local scripts/update-rium-gangdong-pancreas.cjs
 */
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const HOSPITAL_ID = "C1110185";

const DESCRIPTION = [
  "리움한방병원(강동송파점)은 서울 강동구 성내동에 위치한 한방병원으로, 암 환자의 요양과 회복을 지원합니다.",
  "9호선 둔촌오륜역에서 도보 약 9분 거리이며, 올림픽공원과 인접해 송파구에서도 찾아오기 쉽습니다.",
  "유방암·부인암·갑상선암과 위암·대장암·췌장암·담도암 등 소화기암 환자의 수술 후 회복과 항암치료·방사선치료 부작용 관리를 진료하며, 암면역센터와 재활센터를 운영하고 고주파온열치료·고압산소치료 장비를 갖추고 있습니다.",
  "진료 적용 여부는 환자 상태와 기존 치료 계획에 따라 의료진이 판단하며, 표준치료를 대체하지 않습니다.",
].join(" ");

/** 기존 FAQ에서 이 두 개만 갈아끼운다 (나머지 11개는 그대로) */
const REPLACE = {
  "리움한방병원은 어떤 암종을 진료하나요?":
    "리움한방병원(강동송파점)은 유방암, 부인암(난소암·자궁경부암·자궁내막암), 갑상선암, 위암, 대장암, 췌장암, 담도암 등 소화기암, 폐암, 간암 환자의 수술 후 회복과 항암치료·방사선치료 부작용 관리를 진료합니다. 진료 적용 여부는 환자 상태와 기존 치료 계획에 따라 의료진이 판단하며, 표준치료를 대체하지 않습니다.",
};

/** 새로 추가 — "강동구 췌장암 요양" 같은 질의를 잡는다 */
const ADD = [
  {
    q: "췌장암·담도암 치료 후 요양과 부작용 관리도 상담할 수 있나요?",
    a: "네. 리움한방병원(강동송파점)은 췌장암과 담도암을 포함한 소화기암 환자의 수술 후 회복과 항암치료 부작용 관리를 진료 항목으로 안내합니다. 다만 황달, 발열, 심한 복통은 담도 관련 응급 신호일 수 있어 치료받는 의료기관에 즉시 알려야 하며, 보조적 관리는 표준치료를 대체하지 않습니다.",
  },
  {
    q: "강동구나 송파구에서 췌장암 환자가 요양할 수 있는 한방병원이 있나요?",
    a: "리움한방병원(강동송파점)은 서울 강동구 성내동에 있으며 9호선 둔촌오륜역에서 도보 약 9분 거리로, 송파구에서도 찾아오기 쉽습니다. 췌장암을 포함한 소화기암 환자의 항암치료 부작용 관리와 수술 후 회복을 진료하며, 입원 프로그램과 식단·영양 관리를 함께 운영합니다.",
  },
];

(async () => {
  const { error: hErr } = await sb
    .from("hospitals")
    .update({ description: DESCRIPTION })
    .eq("id", HOSPITAL_ID);
  if (hErr) throw hErr;
  console.log("소개글 갱신 — 췌장암·담도암 추가");

  const { data: faqs } = await sb
    .from("hospital_faqs")
    .select("id,q,sort_order")
    .eq("hospital_id", HOSPITAL_ID)
    .order("sort_order");

  for (const f of faqs) {
    const a = REPLACE[f.q];
    if (!a) continue;
    const { error } = await sb.from("hospital_faqs").update({ a }).eq("id", f.id);
    if (error) throw error;
    console.log(`FAQ 갱신 — "${f.q}"`);
  }

  const next = Math.max(...faqs.map((f) => f.sort_order)) + 1;
  const { error: aErr } = await sb.from("hospital_faqs").insert(
    ADD.map((f, i) => ({
      hospital_id: HOSPITAL_ID,
      q: f.q,
      a: f.a,
      sort_order: next + i,
    })),
  );
  if (aErr) throw aErr;
  console.log(`FAQ ${ADD.length}개 추가 — 췌장암·담도암 질의 대응`);

  const { count } = await sb
    .from("hospital_faqs")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", HOSPITAL_ID);
  console.log(`\n완료. FAQ 총 ${count}개`);
})();
