/**
 * 메디브리핑 시드 — 조사 JSON을 columns 테이블(kind='briefing')에 넣는다.
 *
 * ── 저장 전에 막는 것 ──
 * 1. 의료광고법(§56) 금지 표현 — 브리핑은 중립 정보라 병원 홍보·효과 단정이 섞이면 안 된다.
 * 2. 필수 필드 누락(reviewed_by는 columns에서 NOT NULL).
 * 3. 카테고리가 BRIEFING_CATEGORIES에 없는 값.
 *
 * 실행: node --env-file=.env.local scripts/seed-briefings-from-json.cjs <json...> [--dry]
 */
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const BANNED = [
  "완치", "재발 방지", "재발방지", "효과가 입증", "확실히 좋아",
  "부작용 없", "최고의", "유일한", "국내 1위",
];
/**
 * 광고정책 브리핑은 "100% 보장 같은 과장 광고는 조심하라"처럼 금지 표현을
 * '설명·경고 대상'으로 인용한다. 이건 병원 홍보가 아니라 오히려 소비자 보호 내용이다.
 * 그래서 이런 경고 맥락(뒤에 '주의/조심/과장/규제/삼가' 등이 붙는 경우)은 오탐이므로
 * 검사 전에 지운다.
 */
const BENIGN = [
  /100%[^.。\n]{0,40}(주의|조심|과장|거짓|규제|삼가|오히려|안 돼|안돼)/g,
  /(과장|거짓|허위)\s?광고/g,
];
const CATEGORIES = [
  "policy", "ad-policy", "trend", "public-health", "issue", "seasonal",
];

const DRY = process.argv.includes("--dry");
const files = process.argv.slice(2).filter((a) => a.endsWith(".json"));

/** published_at을 그날 09:00 KST(=00:00 UTC)로 */
function atDate(dateStr) {
  return `${dateStr}T00:00:00+00:00`;
}

(async () => {
  const saved = [];
  const skipped = [];

  for (const f of files) {
    const e = JSON.parse(fs.readFileSync(f, "utf8"));
    let text = [
      e.title, e.excerpt, ...(e.summary ?? []), e.body_md,
      ...(e.faqs ?? []).flatMap((x) => [x.q, x.a]),
    ].join(" ");
    for (const re of BENIGN) text = text.replace(re, " ");
    const bad = BANNED.filter((w) => text.includes(w));
    if (bad.length) {
      skipped.push([e.id, `의료광고 금지표현: ${bad.join(", ")}`]);
      continue;
    }
    if (!CATEGORIES.includes(e.category)) {
      skipped.push([e.id, `잘못된 카테고리: ${e.category}`]);
      continue;
    }
    if (!e.reviewed_by || !e.title || !e.body_md || !(e.summary ?? []).length) {
      skipped.push([e.id, "필수 필드 누락"]);
      continue;
    }
    if (!e.publishedDate) {
      skipped.push([e.id, "publishedDate 없음"]);
      continue;
    }

    const row = {
      id: e.id,
      kind: "briefing",
      category: e.category,
      title: e.title,
      excerpt: e.excerpt,
      summary: e.summary,
      body_md: e.body_md,
      faqs: e.faqs ?? [],
      refs: e.refs ?? [],
      tags: e.tags ?? [],
      related_departments: e.related_departments ?? [],
      author: e.author ?? "메디로드 편집팀",
      reviewed_by: e.reviewed_by,
      meta_description: e.meta_description ?? null,
      meta_keywords: e.tags ?? [],
      noindex: false,
      status: "published",
      reading_minutes: e.reading_minutes ?? 4,
      published_at: atDate(e.publishedDate),
    };

    if (!DRY) {
      const { error } = await sb
        .from("columns")
        .upsert(row, { onConflict: "id" });
      if (error) throw error;
    }
    saved.push([e.id, e.category, e.publishedDate, (e.body_md || "").length]);
  }

  console.log(DRY ? "── 시험 실행 ──\n" : "── 저장 ──\n");
  for (const [id, cat, date, len] of saved) {
    console.log(`  ✅ ${date} [${cat}] ${id} — ${len}자`);
  }
  if (skipped.length) {
    console.log("\n── 건너뜀 ──");
    for (const [id, why] of skipped) console.log(`  ⏭️  ${id} — ${why}`);
  }
  console.log(`\n저장 ${saved.length} / 건너뜀 ${skipped.length}`);
})();
