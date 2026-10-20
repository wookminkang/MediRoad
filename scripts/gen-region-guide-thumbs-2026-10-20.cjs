/**
 * 2026-10-20 발행 지역가이드 썸네일 (부산 교통사고 후유증 한의원).
 * OpenAI 이미지 크레딧이 다시 소진(429)돼, 주제에 맞춘 손그림 플랫 벡터 SVG를 베이스로 쓴다.
 * 모티프: 가을 도로 위 자동차(교통사고) · 체크가 쌓인 달력(몇 주째 이어지는 후유증) · 클립보드(진료 기록).
 * 사람·텍스트·실제 상호 없음, 하단 1/3은 타이틀 합성 영역이라 단순하게 둔다.
 * 합성 로직은 scripts/lib/region-guide-thumb.cjs 공유.
 *
 * 실행: node --env-file=.env.local scripts/gen-region-guide-thumbs-2026-10-20.cjs
 */
const { createClient } = require("@supabase/supabase-js");
const { publishThumb } = require("./lib/region-guide-thumb.cjs");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

function calendarCells() {
  // 5열×4행 달력 — 앞쪽 3주는 체크(지나간 날), 마지막 주는 비움
  let out = "";
  const x0 = 158, y0 = 262, w = 58, h = 50, gap = 8;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      const x = x0 + c * (w + gap);
      const y = y0 + r * (h + gap);
      const past = r < 3 || (r === 3 && c < 1);
      out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${past ? "#f4e3cf" : "#ffffff"}" stroke="#e2cfb6" stroke-width="2"/>`;
      if (past) {
        out += `<path d="M${x + 16} ${y + 26} l10 10 l18 -20" fill="none" stroke="#c0794a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    }
  }
  return out;
}

const svg = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7ead8"/>
      <stop offset="1" stop-color="#ecd3b4"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d9b88f"/>
      <stop offset="1" stop-color="#c9a47a"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#sky)"/>
  <circle cx="880" cy="170" r="92" fill="#fbe2b8" opacity="0.9"/>
  <!-- 먼 언덕 -->
  <path d="M0 560 C 200 470, 380 520, 560 480 S 900 440, 1080 500 L1080 1080 L0 1080 Z" fill="#e7c9a2"/>
  <path d="M0 640 C 220 580, 420 620, 640 590 S 960 560, 1080 600 L1080 1080 L0 1080 Z" fill="url(#ground)"/>
  <!-- 도로 -->
  <path d="M-40 1080 C 160 860, 420 760, 620 660 S 960 520, 1120 500 L1120 560 C 980 580, 760 650, 660 710 S 300 900, 120 1080 Z" fill="#8f8a86"/>
  <path d="M60 1040 C 230 880, 440 780, 640 690 S 950 560, 1100 532" fill="none" stroke="#f2ede6" stroke-width="8" stroke-dasharray="34 30" stroke-linecap="round"/>
  <!-- 자동차 -->
  <g transform="translate(700 560) rotate(-14)">
    <rect x="-92" y="-34" width="184" height="58" rx="22" fill="#6f95b3"/>
    <path d="M-56 -34 C -44 -74, 40 -74, 56 -34 Z" fill="#7fa4c0"/>
    <path d="M-40 -38 C -32 -62, -4 -64, -4 -38 Z" fill="#dbe9f2"/>
    <path d="M6 -38 C 6 -64, 34 -62, 42 -38 Z" fill="#dbe9f2"/>
    <circle cx="-52" cy="26" r="20" fill="#3f4a55"/><circle cx="-52" cy="26" r="8" fill="#c9ced3"/>
    <circle cx="52" cy="26" r="20" fill="#3f4a55"/><circle cx="52" cy="26" r="8" fill="#c9ced3"/>
    <rect x="80" y="-20" width="12" height="10" rx="3" fill="#fbe7a6"/>
  </g>
  <!-- 단풍 나무 -->
  <rect x="938" y="470" width="14" height="90" rx="6" fill="#8a6044"/>
  <circle cx="945" cy="450" r="58" fill="#d98a3c"/><circle cx="905" cy="478" r="38" fill="#e0a04e"/><circle cx="985" cy="480" r="36" fill="#c9762f"/>
  <rect x="58" y="560" width="12" height="70" rx="5" fill="#8a6044"/>
  <circle cx="64" cy="540" r="44" fill="#e3a24f"/><circle cx="36" cy="566" r="28" fill="#d58a3a"/>
  <!-- 달력 -->
  <g>
    <rect x="132" y="168" width="368" height="350" rx="26" fill="#ffffff" stroke="#e2cfb6" stroke-width="3"/>
    <rect x="132" y="168" width="368" height="72" rx="26" fill="#c0794a"/>
    <rect x="132" y="210" width="368" height="30" fill="#c0794a"/>
    <circle cx="210" cy="168" r="12" fill="#8a5332"/><circle cx="422" cy="168" r="12" fill="#8a5332"/>
    ${calendarCells()}
  </g>
  <!-- 클립보드(진료 기록) -->
  <g transform="translate(560 150) rotate(6)">
    <rect x="0" y="0" width="230" height="290" rx="22" fill="#a7744d"/>
    <rect x="18" y="34" width="194" height="238" rx="12" fill="#fffaf2"/>
    <rect x="72" y="-14" width="86" height="40" rx="12" fill="#6e4a30"/>
    <rect x="44" y="76" width="140" height="12" rx="6" fill="#e3cdb2"/>
    <rect x="44" y="110" width="118" height="12" rx="6" fill="#e3cdb2"/>
    <rect x="44" y="144" width="140" height="12" rx="6" fill="#e3cdb2"/>
    <rect x="44" y="178" width="96" height="12" rx="6" fill="#e3cdb2"/>
    <path d="M44 226 h30 l14 -22 l18 40 l16 -26 h62" fill="none" stroke="#7fa4c0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- 낙엽 -->
  <path d="M820 330 q18 -26 36 0 q-18 26 -36 0 Z" fill="#d98a3c" transform="rotate(20 838 330)"/>
  <path d="M520 600 q14 -20 28 0 q-14 20 -28 0 Z" fill="#c9762f" transform="rotate(-25 534 600)"/>
  <path d="M300 590 q12 -18 24 0 q-12 18 -24 0 Z" fill="#e0a04e" transform="rotate(35 312 590)"/>
</svg>`;

const THUMBS = [
  { id: "busan-car-aftereffect-hanui-guide", title: "교통사고 후유증\n오래갈 때", svg },
];

(async () => {
  for (const t of THUMBS) {
    console.log(`처리 중… ${t.id}`);
    const url = await publishThumb(sb, t);
    console.log(`  ✓ ${url}`);
  }
})();
