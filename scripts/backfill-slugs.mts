/**
 * 병원 slug 백필 — 한글 병원명 기반. 동명 충돌 시 "-시군구", 그래도 겹치면 "-id".
 * 결정적(id 순서) → 재실행해도 동일 결과. 먼저 등록(작은 id)이 깔끔한 이름 차지.
 * 실행: node --env-file=.env.local --import tsx scripts/backfill-slugs.mts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

/** URL-안전 한글 슬러그: 한글/영숫자만 남기고 나머지는 '-'로, 중복 '-' 정리 */
function slugify(s: string): string {
  return s
    .trim()
    .replace(/^\([^)]*\)\s*/, "") // 선두 괄호 그룹 (의)(사회복지법인)(스카이메디) 등 제거
    .replace(/[^가-힣a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/** 표시 상호명 정리: 선두 법인 약자 (의)(재)(사) 제거 + 공백 정리 */
function cleanName(s: string): string {
  return s
    .replace(/^\([^)]*\)\s*/, "") // 선두 괄호 그룹 제거
    .replace(/\s+/g, " ")
    .trim();
}

const PAGE = 1000;
let after = "";
const used = new Set<string>();
const updates: { id: string; slug: string; name?: string }[] = [];
let scanned = 0;
let nameFixed = 0;

while (true) {
  const { data, error } = await sb
    .from("hospitals")
    .select("id, name, sigungu")
    .gt("id", after)
    .order("id")
    .limit(PAGE);
  if (error) throw error;
  if (!data?.length) break;
  after = data[data.length - 1].id;

  for (const h of data) {
    const cleaned = cleanName(h.name);
    const base = slugify(cleaned) || h.id.toLowerCase();
    let slug = base;
    if (used.has(slug)) {
      slug = `${base}-${slugify(h.sigungu ?? "")}`; // 동명 → 지역 접미
      if (!slugify(h.sigungu ?? "") || used.has(slug)) {
        slug = `${base}-${h.id.toLowerCase()}`; // 그래도 겹치면 id
      }
    }
    used.add(slug);
    const nameChanged = cleaned !== h.name;
    if (nameChanged) nameFixed++;
    updates.push({ id: h.id, slug, name: nameChanged ? cleaned : undefined });
  }
  scanned += data.length;
  console.log(`스캔 ${scanned}…`);
}

console.log(`총 ${updates.length}건 slug 생성 (상호명 정리 ${nameFixed}건). 업데이트 시작…`);
// 개별 update (부분컬럼 upsert는 NOT NULL 위반) — 동시 실행으로 가속
const CONC = 20;
let done = 0;
for (let i = 0; i < updates.length; i += CONC) {
  const chunk = updates.slice(i, i + CONC);
  await Promise.all(
    chunk.map((u) =>
      sb
        .from("hospitals")
        .update(u.name !== undefined ? { slug: u.slug, name: u.name } : { slug: u.slug })
        .eq("id", u.id)
        .then(({ error }) => {
          if (error) console.error(`  ${u.id} 실패: ${error.message}`);
        }),
    ),
  );
  done += chunk.length;
  if (done % 5000 < CONC) console.log(`업데이트 ${done}/${updates.length}`);
}
console.log("완료.");
