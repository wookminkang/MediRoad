/**
 * 메디브리핑 썸네일 생성 — OpenAI 이미지 + 타이틀/로고 합성 → Storage 업로드 → thumbnail URL 설정.
 * ingest-columns.mts의 합성 로직을 그대로 옮긴 독립 스크립트(임포트 부작용 회피).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-thumbnail.mts
 */
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const BUCKET = "column-images";
const LOGO_PATH = path.resolve("public/mediroad_logo.svg");
const THUMB_SIZE = 1080;
const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY ?? 80);

// === 이 브리핑용 설정 ===
const COLUMN_ID = "briefing-copay-ceiling";
const THUMB_TITLE = "병원비, 돌려받으세요";
const PROMPT =
  "A clean, bright editorial photo representing healthcare cost savings and refunds in Korea. A calm desk scene: a stethoscope, a small stack of Korean won bills and coins, and a hospital receipt or document, with a soft piggy-bank or savings motif nearby. Soft natural daylight, shallow depth of field, modern minimal aesthetic, medical blue accents, professional and trustworthy mood. Photorealistic, no text, no logos, subject placed in the upper-center, lower third kept simple and uncluttered.";

async function generateImage(prompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY 미설정");
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const size = process.env.OPENAI_IMAGE_SIZE ?? "1024x1024";
  const quality = process.env.OPENAI_IMAGE_QUALITY ?? "high";
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
  });
  if (!res.ok) throw new Error(`이미지 생성 실패(${res.status}): ${await res.text()}`);
  const json = await res.json();
  const item = json.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item?.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer());
  throw new Error("이미지 응답 형식 불명");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function whiteLogo(targetW: number) {
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

async function composeThumbnail(imageBuf: Buffer, title: string): Promise<Buffer> {
  const S = THUMB_SIZE;
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
  const renderText = (color: string) =>
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

console.log("이미지 생성 중…");
const baseImg = await generateImage(PROMPT);
console.log("타이틀·로고 합성 중…");
const composed = await composeThumbnail(baseImg, THUMB_TITLE);
const key = `${COLUMN_ID}/thumb.webp`;
const up = await sb.storage
  .from(BUCKET)
  .upload(key, composed, { contentType: "image/webp", upsert: true });
if (up.error) throw up.error;
const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
const { error } = await sb.from("columns").update({ thumbnail: url }).eq("id", COLUMN_ID);
if (error) throw error;
console.log("✅ 썸네일 생성·설정 완료:", url);
