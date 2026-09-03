/**
 * 2026-09-03 발행 지역가이드 4편 썸네일 (송파 암요양 단계별 1편 + 강남세브란스 근처 3편).
 * OpenAI 이미지 크레딧 소진 상태라 gen-geo-briefing-thumbnail.mts 대신 플랫 벡터 SVG를
 * 베이스로 쓴다. 합성 로직은 scripts/lib/region-guide-thumb.cjs 공유.
 *
 * 실행: node --env-file=.env.local scripts/gen-region-guide-thumbs-2026-09-03.cjs
 */
const { createClient } = require("@supabase/supabase-js");
const { buildingSvg, publishThumb } = require("./lib/region-guide-thumb.cjs");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// 같은 랜드마크(강남세브란스) 3편은 하늘·외벽 색을 달리해 목록에서 서로 구분되게 한다.
const THUMBS = [
  {
    id: "songpa-cancer-yoyang-stage-guide",
    title: "치료 단계별\n입원 시기",
    svg: buildingSvg({
      skyTop: "#e3eff8", skyBottom: "#cfdfe9", sunOpacity: 0.7,
      wallA: "#e9e0cf", wallB: "#d5c8ae", glassA: "#83a6bb", glassB: "#5f849b",
      treeA: "#82b07c", treeB: "#6e9e6a",
    }),
  },
  {
    id: "gangnam-severance-nearby-cancer-guide",
    title: "통원 일정으로\n살펴보기",
    svg: buildingSvg({
      skyTop: "#dbebf6", skyBottom: "#bcd6e4", sunOpacity: 0.55,
      wallA: "#dfe4e8", wallB: "#c3ccd3", glassA: "#6f97b2", glassB: "#4f7794",
      treeA: "#79a882", treeB: "#66936f",
    }),
  },
  {
    id: "gangnam-severance-nearby-cancer-admission-guide",
    title: "요양병원\n입원 절차",
    svg: buildingSvg({
      skyTop: "#f2ead9", skyBottom: "#d9cfbb", sunOpacity: 0.68,
      wallA: "#e4d9c4", wallB: "#cbbb9f", glassA: "#8d9a95", glassB: "#6c7c78",
      treeA: "#8aa876", treeB: "#749363",
    }),
  },
  {
    id: "gangnam-severance-nearby-cancer-room-guide",
    title: "병실과\n간병 확인",
    svg: buildingSvg({
      skyTop: "#e8e6f3", skyBottom: "#cdc9de", sunOpacity: 0.5,
      wallA: "#ded9e2", wallB: "#c2bbcb", glassA: "#7d84a4", glassB: "#5d6688",
      treeA: "#7fa389", treeB: "#6b8f76",
    }),
  },
];

(async () => {
  for (const t of THUMBS) {
    console.log(`처리 중… ${t.id}`);
    const url = await publishThumb(sb, t);
    console.log(`✅ ${t.id} → ${url}`);
  }
})();
