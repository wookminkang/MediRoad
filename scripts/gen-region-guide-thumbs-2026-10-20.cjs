/**
 * 2026-10-20 발행 지역가이드 썸네일 (부산 교통사고 후유증 한의원).
 * OpenAI 이미지 크레딧이 다시 소진(429)돼 플랫 벡터 SVG를 베이스로 쓴다.
 * 합성 로직은 scripts/lib/region-guide-thumb.cjs 공유.
 *
 * 실행: node --env-file=.env.local scripts/gen-region-guide-thumbs-2026-10-20.cjs
 */
const { createClient } = require("@supabase/supabase-js");
const { buildingSvg, publishThumb } = require("./lib/region-guide-thumb.cjs");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const THUMBS = [
  {
    id: "busan-car-aftereffect-hanui-guide",
    title: "교통사고 후유증\n오래갈 때",
    svg: buildingSvg({
      skyTop: "#dcecf7", skyBottom: "#bfd8e8", sunOpacity: 0.6,
      wallA: "#e6dfd2", wallB: "#cfc4b0", glassA: "#7a9fb8", glassB: "#57809a",
      treeA: "#c9a45a", treeB: "#b38a42",
    }),
  },
];

(async () => {
  for (const t of THUMBS) {
    console.log(`처리 중… ${t.id}`);
    const url = await publishThumb(sb, t);
    console.log(`  ✓ ${url}`);
  }
})();
