/**
 * "산·계곡 다녀온 후 열나고 온몸이 아프다면" 칼럼 썸네일 —
 * OpenAI 대신 손으로 그린 SVG(플랫 벡터, 하이킹 트레일 + 풀숲) + 기존 타이틀/로고 합성 파이프라인 재사용.
 * 실행: node --env-file=.env.local gen-tick-thumbnail.cjs
 */
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const BUCKET = "column-images";
const LOGO_PATH = path.resolve("/Users/mwkang/MediRoad/public/mediroad_logo.svg");
const COLUMN_ID = "tick-borne-illness-summer";
const THUMB_TITLE = "산·계곡 다녀왔다면\n진드기도 확인하세요";
const S = 1080;
const WEBP_QUALITY = 80;

// ── 손으로 그리는 SVG 일러스트 (플랫 벡터, 하이킹 트레일 + 풀숲, 사람/텍스트 없음) ──
function grassBlades(seedStart, count, yBase, colorA, colorB, minH, maxH) {
  let out = "";
  let seed = seedStart;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i++) {
    const x = (S / count) * i + rand() * (S / count);
    const h = minH + rand() * (maxH - minH);
    const lean = (rand() - 0.5) * h * 0.5;
    const w = 6 + rand() * 6;
    const color = rand() > 0.5 ? colorA : colorB;
    out += `<path d="M ${x - w / 2} ${yBase} Q ${x + lean * 0.5} ${yBase - h * 0.6} ${x + lean} ${yBase - h}
      Q ${x + lean * 0.5} ${yBase - h * 0.6} ${x + w / 2} ${yBase} Z" fill="${color}" />`;
  }
  return out;
}

const svg = `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#dff2ef" />
      <stop offset="55%" stop-color="#eaf5ea" />
      <stop offset="100%" stop-color="#eef7e0" />
    </linearGradient>
    <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bcdfd6" />
      <stop offset="100%" stop-color="#a9d6cb" />
    </linearGradient>
    <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8fc79a" />
      <stop offset="100%" stop-color="#79b884" />
    </linearGradient>
  </defs>

  <rect width="${S}" height="${S}" fill="url(#sky)" />

  <!-- sun -->
  <circle cx="760" cy="230" r="120" fill="#ffd889" opacity="0.85" />
  <circle cx="760" cy="230" r="150" fill="#ffe6ad" opacity="0.35" />

  <!-- far hills -->
  <path d="M0,520 C180,440 320,460 480,500 C650,540 820,470 1080,510 L1080,700 L0,700 Z" fill="url(#hillFar)" opacity="0.8" />

  <!-- mid hills -->
  <path d="M0,610 C160,560 300,600 460,580 C660,555 860,610 1080,585 L1080,760 L0,760 Z" fill="url(#hillNear)" opacity="0.9" />

  <!-- winding trail -->
  <path d="M120,1080 C260,880 260,760 420,700 C560,650 560,560 480,470"
    fill="none" stroke="#f1e3c6" stroke-width="46" stroke-linecap="round" opacity="0.9" />
  <path d="M120,1080 C260,880 260,760 420,700 C560,650 560,560 480,470"
    fill="none" stroke="#e7d5ad" stroke-width="46" stroke-linecap="round" stroke-dasharray="2 34" opacity="0.5" />

  <!-- backpack silhouette, upper-center-ish accent, no people/faces -->
  <g transform="translate(560,560)">
    <rect x="-70" y="-10" width="140" height="170" rx="34" fill="#3f7a63" />
    <rect x="-50" y="-46" width="100" height="70" rx="24" fill="#3f7a63" />
    <rect x="-58" y="0" width="116" height="150" rx="26" fill="#4f8f74" />
    <rect x="-30" y="30" width="60" height="46" rx="10" fill="#dff2ef" opacity="0.5" />
    <line x1="-58" y1="10" x2="-58" y2="150" stroke="#3f7a63" stroke-width="10" stroke-linecap="round" />
    <line x1="58" y1="10" x2="58" y2="150" stroke="#3f7a63" stroke-width="10" stroke-linecap="round" />
  </g>

  <!-- grass field foreground -->
  <rect x="0" y="740" width="${S}" height="340" fill="#dff0d8" />
  ${grassBlades(11, 70, 900, "#6fa876", "#5c9868", 60, 150)}
  ${grassBlades(97, 90, 1010, "#79b57f", "#4f8b5c", 90, 210)}
  ${grassBlades(233, 60, 1080, "#5c9868", "#437450", 120, 260)}
</svg>`;

async function whiteLogo(targetW) {
  const resized = await sharp(LOGO_PATH, { density: 400 })
    .resize({ width: targetW })
    .ensureAlpha()
    .png()
    .toBuffer();
  const m = await sharp(resized).metadata();
  const w = m.width ?? targetW;
  const h = m.height ?? 0;
  const { data: alpha } = await sharp(resized)
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: "#ffffff" } })
    .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();
  return { buf, w, h };
}

const escapeXml = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

async function composeThumbnail(imageBuf, title) {
  const base = await sharp(imageBuf).resize(S, S, { fit: "cover" }).toBuffer();
  const scrim = Buffer.from(
    `<svg width="${S}" height="${S}"><defs>` +
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="#000" stop-opacity="0.10"/>` +
      `<stop offset="50%" stop-color="#000" stop-opacity="0.05"/>` +
      `<stop offset="76%" stop-color="#000" stop-opacity="0.36"/>` +
      `<stop offset="100%" stop-color="#000" stop-opacity="0.64"/>` +
      `</linearGradient></defs>` +
      `<rect width="${S}" height="${S}" fill="url(#g)"/></svg>`,
  );
  const longest = Math.max(...title.split("\n").map((line) => line.replace(/\s/g, "").length));
  const dpi = longest <= 8 ? 520 : longest <= 11 ? 440 : 360;
  const renderText = (color) =>
    sharp({
      text: {
        text: `<span foreground="${color}" weight="bold">${escapeXml(title)}</span>`,
        font: "Apple SD Gothic Neo",
        width: Math.round(S * 0.84),
        align: "center",
        rgba: true,
        dpi,
      },
    })
      .png()
      .toBuffer();
  const titleImg = await renderText("#ffffff");
  const shadowImg = await sharp(await renderText("#000000")).blur(7).toBuffer();
  const tm = await sharp(titleImg).metadata();
  const tw = tm.width ?? 0;
  const th = tm.height ?? 0;
  const logo = await whiteLogo(Math.round(S * 0.2));
  const bottomPad = Math.round(S * 0.07);
  const logoTop = S - logo.h - bottomPad;
  const titleTop = Math.max(24, logoTop - th - Math.round(S * 0.045));
  const titleLeft = Math.round((S - tw) / 2);
  return sharp(base)
    .composite([
      { input: scrim, top: 0, left: 0 },
      { input: shadowImg, top: titleTop + 3, left: titleLeft },
      { input: titleImg, top: titleTop, left: titleLeft },
      { input: logo.buf, top: logoTop, left: Math.round((S - logo.w) / 2) },
    ])
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

(async () => {
  console.log("SVG 렌더링 중…");
  const baseImg = await sharp(Buffer.from(svg)).png().toBuffer();
  console.log("타이틀·로고 합성 중…");
  const composed = await composeThumbnail(baseImg, THUMB_TITLE);
  const key = `${COLUMN_ID}/thumb.webp`;
  const up = await sb.storage.from(BUCKET).upload(key, composed, {
    contentType: "image/webp",
    upsert: true,
  });
  if (up.error) throw up.error;
  const thumbnail = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  const { error } = await sb.from("columns").update({ thumbnail }).eq("id", COLUMN_ID);
  if (error) throw error;
  console.log("✅ 썸네일 반영 완료:", thumbnail);
})();
