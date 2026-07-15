/**
 * 이음손한의원(B1106216) GEO 보강 — 소개글 + 홈페이지 + FAQ + 의료진.
 *
 * 제휴 병원이 아니다. 그래서 partners.ts에 넣지 않고 콘텐츠만 채운다
 * (제휴 혜택인 사이트맵 우선·상단 노출은 없음). 제휴용 seed-partners-geo-from-json은
 * 제휴 목록에 없으면 걸러내므로, 이 병원은 전용 스크립트로 넣는다.
 *
 * ── 사실 근거 ──
 * 공식 홈페이지 eeumson.com — 오시는길·푸터에 주소(은천로 101, 2층)와 전화(02-888-7997)가
 * DB와 일치해 동명 병원이 아님을 확인. 네이버 지역검색 도로명주소도 일치.
 * 의료진 2명·특화 진료(추나·봉약침·교통사고·다이어트·원내 탕전 한약)는 사이트에서 확인.
 *
 * 의료법 §56: 효과 단정·치료경험담·후기·평점·최상급·수상 표방 금지. 검증 결과 0건.
 *
 * 실행: node --env-file=.env.local scripts/seed-eeumson-geo.cjs
 */
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const HOSPITAL_ID = "B1106216";
const SRC =
  "/private/tmp/claude-501/-Users-mwkang-MediRoad/f53d7e42-2501-4c7b-9041-d34455185c94/scratchpad/eeumson.json";

const BANNED = [
  "완치", "재발 방지", "재발방지", "효과가 입증", "효과 보장", "확실히 좋아",
  "부작용 없", "최고", "유일", "1위", "명의", "후기", "평점",
];

(async () => {
  const e = JSON.parse(fs.readFileSync(SRC, "utf8"));
  if (!e.verified || !e.homepage) throw new Error("verified 아님 — 중단");
  if (e.id !== HOSPITAL_ID) throw new Error(`id 불일치: ${e.id}`);

  const text = [
    e.description,
    ...(e.faqs ?? []).flatMap((f) => [f.q, f.a]),
    ...(e.doctors ?? []).map((d) => d.specialty ?? ""),
  ].join(" ");
  const bad = BANNED.filter((w) => text.includes(w));
  if (bad.length) throw new Error(`의료광고 금지표현: ${bad.join(", ")} — 중단`);

  const { error: hErr } = await sb
    .from("hospitals")
    .update({ description: e.description, homepage_url: e.homepage })
    .eq("id", HOSPITAL_ID);
  if (hErr) throw hErr;
  console.log("소개글 + 홈페이지 저장");

  await sb.from("hospital_faqs").delete().eq("hospital_id", HOSPITAL_ID);
  const { error: fErr } = await sb.from("hospital_faqs").insert(
    e.faqs.map((f, i) => ({ hospital_id: HOSPITAL_ID, q: f.q, a: f.a, sort_order: i })),
  );
  if (fErr) throw fErr;
  console.log(`FAQ ${e.faqs.length}개 저장`);

  await sb.from("hospital_doctors").delete().eq("hospital_id", HOSPITAL_ID);
  if ((e.doctors ?? []).length) {
    const { error: dErr } = await sb.from("hospital_doctors").insert(
      e.doctors.map((d, i) => ({
        hospital_id: HOSPITAL_ID,
        name: d.name,
        title: d.title ?? null,
        specialty: d.specialty ?? null,
        sort_order: i,
      })),
    );
    if (dErr) throw dErr;
    console.log(`의료진 ${e.doctors.length}명 저장`);
  }

  console.log("\n완료 — https://mediroad.io/hospitals/이음손한의원");
})();
