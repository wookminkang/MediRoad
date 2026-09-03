/**
 * 메디브리핑 "지역 병원 찾기" 썸네일 공통 로직.
 *
 * gen-geo-briefing-thumbnail.mts는 OpenAI로 사진풍 건물 이미지를 만들어 합성하지만,
 * 이미지 API 크레딧이 소진된 뒤로는 손으로 그린 플랫 벡터 SVG를 베이스로 쓴다.
 * 합성(스크림·타이틀·로고·dpi 임계값)은 gen-geo-briefing-thumbnail.mts와 동일하게 맞춰
 * 기존 지역가이드 썸네일들과 통일감을 유지한다.
 *
 * gen-region-guide-thumbnails-missing.cjs(2026-08 1회성)에서 추출했다.
 */
const path = require("node:path");
const sharp = require("sharp");

const S = 1080;
const WEBP_QUALITY = 80;
const BUCKET = "column-images";
const LOGO_PATH = path.resolve(__dirname, "../../public/mediroad_logo.svg");

/** 플랫 벡터 건물 외관 SVG (사람·텍스트·실제 상호 없음) — 색상만 바꿔 편마다 다르게 쓴다 */
function buildingSvg({ skyTop, skyBottom, sunOpacity, wallA, wallB, glassA, glassB, treeA, treeB }) {
  let windows = "";
  const cols = 6;
  const rows = 7;
  const bx = 300;
  const by = 210;
  const bw = 480;
  const bh = 700;
  const padX = 34;
  const padY = 30;
  const cellW = (bw - padX * 2) / cols;
  const cellH = (bh - padY * 2) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bx + padX + c * cellW + cellW * 0.12;
      const y = by + padY + r * cellH + cellH * 0.14;
      const w = cellW * 0.76;
      const h = cellH * 0.72;
      const glass = (r + c) % 3 === 0 ? glassB : glassA;
      windows += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${glass}" />`;
    }
  }
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skyTop}" />
      <stop offset="100%" stop-color="${skyBottom}" />
    </linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${wallA}" />
      <stop offset="100%" stop-color="${wallB}" />
    </linearGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#sky)" />
  <circle cx="860" cy="180" r="110" fill="#ffe4ad" opacity="${sunOpacity}" />

  <!-- distant skyline -->
  <g opacity="0.35" fill="${skyBottom}">
    <rect x="60" y="360" width="90" height="420" />
    <rect x="170" y="300" width="70" height="480" />
    <rect x="860" y="330" width="80" height="450" />
    <rect x="960" y="380" width="70" height="400" />
  </g>

  <!-- main building -->
  <rect x="${bx}" y="${by}" width="480" height="700" rx="10" fill="url(#wall)" />
  <rect x="${bx}" y="${by}" width="480" height="26" fill="${wallB}" opacity="0.6" />
  ${windows}

  <!-- entrance canopy -->
  <rect x="${bx + 150}" y="${by + 640}" width="180" height="18" rx="6" fill="${wallB}" />
  <rect x="${bx + 170}" y="${by + 658}" width="140" height="52" fill="#eef2f6" opacity="0.85" />

  <!-- trees -->
  <g>
    <ellipse cx="240" cy="860" rx="70" ry="90" fill="${treeA}" />
    <rect x="230" y="930" width="20" height="60" fill="#6b5642" />
    <ellipse cx="840" cy="880" rx="80" ry="100" fill="${treeB}" />
    <rect x="828" y="960" width="24" height="60" fill="#6b5642" />
  </g>

  <!-- sidewalk -->
  <rect x="0" y="1000" width="${S}" height="80" fill="#c9c2b6" opacity="0.7" />
</svg>`;
}

/** 로고를 흰색 실루엣으로 (어두운 스크림 위 가독성) */
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

/** 베이스 이미지 + 스크림 + 흰 타이틀 + 로고 → 1080 webp */
async function composeThumbnail(imageBuf, title) {
  const base = await sharp(imageBuf).resize(S, S, { fit: "cover" }).toBuffer();
  const scrim = Buffer.from(
    `<svg width="${S}" height="${S}"><defs>` +
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="#000" stop-opacity="0.16"/>` +
      `<stop offset="42%" stop-color="#000" stop-opacity="0.04"/>` +
      `<stop offset="74%" stop-color="#000" stop-opacity="0.30"/>` +
      `<stop offset="100%" stop-color="#000" stop-opacity="0.58"/>` +
      `</linearGradient></defs>` +
      `<rect width="${S}" height="${S}" fill="url(#g)"/></svg>`,
  );
  const len = title.replace(/\s/g, "").length;
  const dpi = len <= 14 ? 560 : len <= 22 ? 460 : 380;
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
  const gap = Math.round(S * 0.045);
  const titleTop = Math.max(24, logoTop - th - gap);
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

/** SVG 베이스 → 합성 → Storage 업로드 → columns.thumbnail 갱신 */
async function publishThumb(sb, { id, title, svg }) {
  const baseImg = await sharp(Buffer.from(svg)).png().toBuffer();
  const composed = await composeThumbnail(baseImg, title);
  const key = `${id}/thumb.webp`;
  const up = await sb.storage
    .from(BUCKET)
    .upload(key, composed, { contentType: "image/webp", upsert: true });
  if (up.error) throw up.error;
  const thumbnail = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  const { error } = await sb.from("columns").update({ thumbnail }).eq("id", id);
  if (error) throw error;
  return thumbnail;
}

module.exports = { buildingSvg, composeThumbnail, publishThumb, BUCKET, S };
