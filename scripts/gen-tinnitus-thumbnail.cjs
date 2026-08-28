/**
 * "조용할 때만 삐- 소리가 들린다면 (이명의 원인과 관리법)" 칼럼 썸네일 —
 * OpenAI 대신 손으로 그린 SVG(플랫 벡터, 고요한 밤 + 소리 파동) + 기존 타이틀/로고 합성 파이프라인 재사용.
 * 실행: node --env-file=.env.local gen-tinnitus-thumbnail.cjs
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
const COLUMN_ID = "tinnitus-ringing-ears";
const THUMB_TITLE = "이명,\n왜 생길까요";
const S = 1080;
const WEBP_QUALITY = 80;

function stars(seedStart, count) {
  let out = "";
  let seed = seedStart;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i++) {
    const x = rand() * S;
    const y = rand() * S * 0.55;
    const r = 2 + rand() * 3;
    const o = 0.35 + rand() * 0.5;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${o.toFixed(2)}" />`;
  }
  return out;
}

function waveRings(cx, cy, count) {
  let out = "";
  for (let i = 0; i < count; i++) {
    const r = 70 + i * 90;
    const op = Math.max(0.06, 0.42 - i * 0.07);
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffe9c2" stroke-width="6" opacity="${op.toFixed(2)}" />`;
  }
  return out;
}

const svg = `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1f2f52" />
      <stop offset="55%" stop-color="#2c4066" />
      <stop offset="100%" stop-color="#3c5372" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe9c2" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#ffe9c2" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${S}" height="${S}" fill="url(#night)" />
  ${stars(41, 60)}

  <!-- crescent moon -->
  <g transform="translate(190,190)">
    <circle cx="0" cy="0" r="76" fill="#f4ecd8" />
    <circle cx="34" cy="-18" r="70" fill="#2c4066" />
  </g>

  <!-- sound source glow + concentric rings ("삐-" 소리) -->
  <circle cx="700" cy="430" r="140" fill="url(#glow)" />
  ${waveRings(700, 430, 5)}
  <circle cx="700" cy="430" r="16" fill="#ffe9c2" />

  <!-- bed silhouette, lower third -->
  <g>
    <rect x="140" y="860" width="800" height="130" rx="36" fill="#26395c" />
    <rect x="140" y="820" width="800" height="70" rx="30" fill="#2f4569" />
    <ellipse cx="330" cy="840" rx="150" ry="46" fill="#e9eef7" opacity="0.92" />
    <rect x="140" y="900" width="800" height="16" fill="#1c2a48" opacity="0.5" />
  </g>
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
      `<stop offset="76%" stop-color="#000" stop-opacity="0.38"/>` +
      `<stop offset="100%" stop-color="#000" stop-opacity="0.66"/>` +
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
