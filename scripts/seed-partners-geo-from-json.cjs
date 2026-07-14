/**
 * 제휴 한의원·의원 GEO 시드 — 조사 결과 JSON을 그대로 먹여 소개글·FAQ·의료진을 넣는다.
 *
 * 병원 하나에 스크립트 하나씩 만들던 방식(seed-rium-*, seed-muyjae-* …)은 64곳에는 안 맞는다.
 * 조사는 에이전트가 하고, 이 스크립트는 검증과 저장만 한다.
 *
 * 입력 JSON 한 건의 모양:
 *   { id, name, verified, homepage, description, doctors:[{name,title,specialty}], faqs:[{q,a}] }
 *
 * ── 저장 전에 막는 것들 ──
 * 1. verified !== true          → 건너뜀. 동명 병원 콘텐츠를 잘못 넣는 게 최악이다.
 * 2. 의료법 §56 금지 표현       → 그 병원 전체를 건너뛰고 리포트에 남긴다.
 * 3. DB에 없는 id               → 건너뜀 (오타·폐업).
 * 4. 제휴 목록에 없는 id        → 건너뜀.
 *
 * homepage는 없어도 된다. 신원은 네이버 플레이스 도로명주소로 확인했는데 홈페이지만
 * 죽어 있는 경우가 있다(경희하늘애 광진점의 skylovekh.co.kr = NXDOMAIN).
 * 소개글·FAQ는 넣되 homepage_url은 건드리지 않는다 — 죽은 도메인을 JSON-LD sameAs로
 * 내보내면 오히려 신뢰도를 깎는다.
 *
 * 실행: node --env-file=.env.local scripts/seed-partners-geo-from-json.cjs <json...> [--dry]
 */
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

/**
 * 의료법 §56 — 효과 단정·보장·경험담·최상급 표현.
 * "부담이 적습니다"까지 넣는 이유: 이미 발행된 글에서 실제로 걸러낸 표현이다.
 * 단어가 아니라 서술형까지 잡아야 "부담이 적은 활동"(정상) 과 구분된다.
 */
const BANNED = [
  "완치", "재발 방지", "재발방지", "효과가 입증", "효과 보장", "확실히 좋아",
  "부작용 없", "부담이 적습니다", "호전되는 경우가 많", "최고의", "유일한",
  "국내 1위", "명의", "1등 병원", "후기", "평점", "100% ",
];

/**
 * 금지어를 부분 문자열로 찾다 보면 멀쩡한 말이 걸린다.
 * "원장 명의의 글"(= 원장 이름으로 올린 글)은 名醫 표방이 아니라 그냥 명의(名義)다.
 * 검사 전에 이런 형태를 지워서 오탐을 없앤다.
 */
const BENIGN = [/명의의\s/g, /명의로\s/g];

const DRY = process.argv.includes("--dry");
const files = process.argv.slice(2).filter((a) => a.endsWith(".json"));
if (!files.length) {
  console.error("사용법: node --env-file=.env.local scripts/seed-partners-geo-from-json.cjs <json...> [--dry]");
  process.exit(1);
}

function scanBanned(entry) {
  let text = [
    entry.description ?? "",
    ...(entry.faqs ?? []).flatMap((f) => [f.q, f.a]),
    ...(entry.doctors ?? []).map((d) => d.specialty ?? ""),
  ].join(" ");
  for (const re of BENIGN) text = text.replace(re, " ");
  return BANNED.filter((w) => text.includes(w));
}

(async () => {
  const partnerIds = new Set(
    [...fs.readFileSync("src/constants/partners.ts", "utf8").matchAll(/"([A-Z]\d{7})"/g)].map((m) => m[1]),
  );

  const entries = files.flatMap((f) => JSON.parse(fs.readFileSync(f, "utf8")));
  const ids = entries.map((e) => e.id);
  const { data: rows } = await sb.from("hospitals").select("id,name").in("id", ids);
  const known = new Map((rows ?? []).map((h) => [h.id, h.name]));

  const saved = [];
  const skipped = [];

  for (const e of entries) {
    if (!e.verified) {
      skipped.push([e.id, e.name, "신원 확인 실패 — 조사 안 됨"]);
      continue;
    }
    if (!known.has(e.id)) {
      skipped.push([e.id, e.name, "DB에 없는 병원 id"]);
      continue;
    }
    if (!partnerIds.has(e.id)) {
      skipped.push([e.id, e.name, "제휴 목록에 없음"]);
      continue;
    }
    const bad = scanBanned(e);
    if (bad.length) {
      skipped.push([e.id, e.name, `의료광고 금지표현: ${bad.join(", ")}`]);
      continue;
    }
    if (!e.description || !(e.faqs ?? []).length) {
      skipped.push([e.id, e.name, "소개글 또는 FAQ 없음"]);
      continue;
    }

    if (!DRY) {
      const patch = { description: e.description };
      if (e.homepage) patch.homepage_url = e.homepage;
      const { error: hErr } = await sb.from("hospitals").update(patch).eq("id", e.id);
      if (hErr) throw hErr;

      // 지우고 다시 넣는다 — 재실행해도 중복이 쌓이지 않는다.
      await sb.from("hospital_faqs").delete().eq("hospital_id", e.id);
      const { error: fErr } = await sb.from("hospital_faqs").insert(
        e.faqs.map((f, i) => ({ hospital_id: e.id, q: f.q, a: f.a, sort_order: i })),
      );
      if (fErr) throw fErr;

      await sb.from("hospital_doctors").delete().eq("hospital_id", e.id);
      if ((e.doctors ?? []).length) {
        const { error: dErr } = await sb.from("hospital_doctors").insert(
          e.doctors.map((d, i) => ({
            hospital_id: e.id,
            name: d.name,
            title: d.title ?? null,
            specialty: d.specialty ?? null,
            sort_order: i,
          })),
        );
        if (dErr) throw dErr;
      }
    }
    saved.push([e.id, known.get(e.id), e.faqs.length, (e.doctors ?? []).length]);
  }

  console.log(DRY ? "── 시험 실행 (저장 안 함) ──\n" : "── 저장 ──\n");
  for (const [id, name, nf, nd] of saved) {
    console.log(`  ✅ ${id} ${name} — FAQ ${nf}개, 의료진 ${nd}명`);
  }
  if (skipped.length) {
    console.log("\n── 건너뜀 ──\n");
    for (const [id, name, why] of skipped) console.log(`  ⏭️  ${id} ${name ?? ""} — ${why}`);
  }
  console.log(`\n저장 ${saved.length}곳 / 건너뜀 ${skipped.length}곳`);
})();
