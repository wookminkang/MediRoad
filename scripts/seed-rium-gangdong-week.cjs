/**
 * 리움 강동송파점 — 일주일치 포스트 7편 예약 발행.
 *
 * 하루 간격으로 published_at을 박아둔다. 예약 발행(lib/post-schedule.ts)이
 * published_at 지난 글만 노출하므로, 넣어두면 매일 아침 하나씩 뜬다.
 * 날짜만 넣으면 00:00Z 저장 = 한국시간 오전 9시 노출.
 *
 * 소재는 리움 자기 콘텐츠(홈페이지 게시판 29건 + 공식 블로그 55건)에서 뽑았다.
 * 다만 문장은 베끼지 않았다 — 사실은 저작권 대상이 아니지만 문장은 대상이고,
 * 살짝 바꾼 글은 구글이 중복으로 보기 때문에 원본만 남고 우리 글은 밀린다.
 *
 * 리움 블로그의 제목 프레임("셀레늄요법으로 심근 보호 가능한가요?", "고주파온열치료로
 * 활력 회복할 수 있을까요?")은 특정 요법이 특정 부작용을 낫게 한다는 인과 주장이다.
 * 그대로 옮기면 의료법 §56 위반이라 주제만 가져오고 프레임은 전부 바꿨다.
 *
 * 실행: node --env-file=.env.local scripts/seed-rium-gangdong-week.cjs [--dry]
 */
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const SRC = [
  "/private/tmp/claude-501/-Users-mwkang-MediRoad/f53d7e42-2501-4c7b-9041-d34455185c94/scratchpad/geo/posts-a.json",
  "/private/tmp/claude-501/-Users-mwkang-MediRoad/f53d7e42-2501-4c7b-9041-d34455185c94/scratchpad/geo/posts-b.json",
];

/** 발행 순서 — 첫날은 가장 널리 검색되는 주제부터 */
const ORDER = [
  "rium-gangdong-eating-difficulty",
  "rium-gangdong-cancer-fatigue",
  "rium-gangdong-gastrectomy-diet",
  "rium-gangdong-colostomy",
  "rium-gangdong-infection-care",
  "rium-gangdong-thyroid-riai",
  "rium-gangdong-pancreas-biliary",
];

/** 내일부터 하루 간격 (오늘 넣은 글이 바로 뜨면 '예약'이 아니다) */
function dateAfter(days) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 1 + days);
  return d.toISOString();
}

const BANNED = [
  "완치", "재발 방지", "재발방지", "효과가 입증", "효과 보장", "확실히 좋아",
  "부작용 없", "부담이 적", "호전되는 경우가 많", "최고의", "유일한", "국내 1위",
  "담낭암", "췌담도암", "담관암",
];

const DRY = process.argv.includes("--dry");

(async () => {
  const byId = {};
  for (const f of SRC) for (const p of JSON.parse(fs.readFileSync(f, "utf8"))) byId[p.id] = p;

  for (const id of ORDER) {
    if (!byId[id]) throw new Error(`글 없음: ${id}`);
  }

  for (let i = 0; i < ORDER.length; i++) {
    const p = byId[ORDER[i]];
    const text = [
      p.title,
      p.excerpt,
      ...p.summary,
      p.body_md,
      ...p.faqs.flatMap((f) => [f.q, f.a]),
    ].join(" ");
    const bad = BANNED.filter((w) => text.includes(w));
    if (bad.length) throw new Error(`${p.id} 금지표현: ${bad.join(", ")} — 중단`);

    const at = dateAfter(i);
    const row = {
      id: p.id,
      hospital_id: p.hospital_id,
      title: p.title,
      excerpt: p.excerpt,
      summary: p.summary,
      body_md: p.body_md,
      faqs: p.faqs,
      conditions: p.conditions ?? [],
      tags: p.tags ?? [],
      author: p.author,
      reviewed_by: p.reviewed_by,
      reading_minutes: p.reading_minutes ?? 4,
      status: "published", // 예약 발행 — published_at이 올 때까지 노출되지 않는다
      published_at: at,
    };
    if (!DRY) {
      const { error } = await sb.from("hospital_posts").upsert(row);
      if (error) throw error;
    }
    console.log(`  ${at.slice(0, 10)}  ${p.id}`);
    console.log(`             ${p.title}`);
  }
  console.log(`\n${DRY ? "시험 실행 (저장 안 함)" : "예약 완료"} — 7편`);
})();
