/**
 * "교통사고 나면 이 순서로 대처하세요" 칼럼 썸네일 —
 * OpenAI 대신 손으로 그린 SVG(플랫 벡터, 저녁 도로 + 안전삼각대) + 기존 타이틀/로고 합성 파이프라인 재사용.
 * 실행: node --env-file=.env.local gen-traffic-accident-thumbnail.cjs
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
const COLUMN_ID = "traffic-accident-checklist";
const THUMB_TITLE = "교통사고 났다면\n이 순서로";
const S = 1080;
const WEBP_QUALITY = 80;

const svg = `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde3c6" />
      <stop offset="45%" stop-color="#f6cfae" />
      <stop offset="100%" stop-color="#c9d6e6" />
    </linearGradient>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7c8798" />
      <stop offset="100%" stop-color="#4b5563" />
    </linearGradient>
  </defs>

  <rect width="${S}" height="${S}" fill="url(#dusk)" />

  <!-- soft hazy sun -->
  <circle cx="820" cy="230" r="110" fill="#ffd9a8" opacity="0.8" />
  <circle cx="820" cy="230" r="150" fill="#ffe6c2" opacity="0.35" />

  <!-- far tree line -->
  <path d="M0,520 C160,470 320,500 480,480 C660,458 860,500 1080,470 L1080,560 L0,560 Z" fill="#a9b6a2" opacity="0.7" />

  <!-- road, perspective -->
  <path d="M430,560 L650,560 L920,1080 L160,1080 Z" fill="url(#road)" />
  <!-- center dashed line -->
  <g stroke="#f3e6c8" stroke-width="18" stroke-linecap="round">
    <line x1="540" y1="620" x2="533" y2="660" />
    <line x1="524" y1="700" x2="514" y2="750" />
    <line x1="502" y1="800" x2="488" y2="860" />
    <line x1="472" y1="920" x2="454" y2="990" />
    <line x1="434" y1="1050" x2="418" y2="1080" />
  </g>

  <!-- roadside safety triangle -->
  <g transform="translate(790,760)">
    <polygon points="0,-150 130,90 -130,90" fill="#ffffff" stroke="#e5572c" stroke-width="26" stroke-linejoin="round" />
    <polygon points="0,-92 78,54 -78,54" fill="#fbb35a" opacity="0.9" />
    <rect x="-10" y="-30" width="20" height="60" rx="8" fill="#ffffff" />
    <circle cx="0" cy="42" r="12" fill="#ffffff" />
  </g>

  <!-- foreground grass edge -->
  <rect x="0" y="1030" width="${S}" height="50" fill="#8fa583" opacity="0.6" />
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
      `<stop offset="50%" stop-color="#000" stop-opacity="0.06"/>` +
      `<stop offset="76%" stop-color="#000" stop-opacity="0.40"/>` +
      `<stop offset="100%" stop-color="#000" stop-opacity="0.68"/>` +
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
