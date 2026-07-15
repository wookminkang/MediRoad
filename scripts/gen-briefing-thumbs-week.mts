/**
 * 메디브리핑 7/12~15 4편 썸네일 생성 — 기존 gen-briefing-thumbnail.mts와 같은 합성
 * (배경 = OpenAI 생성, 어두운 스크림 + 제목 + 로고). 4편을 한 번에 돈다.
 *
 * 썸네일 제목은 본문 제목이 아니라 짧은 표어를 쓴다(긴 제목은 썸네일에서 안 읽힌다).
 * 배경 프롬프트는 정물·공간 위주 — 의료광고법상 인물·치료장면·글자는 피한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-thumbs-week.mts
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
const S = 1080;
const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY ?? 80);

const GUARD =
  "Editorial magazine cover photography, calm and clean. NO people, no faces, no hands. " +
  "No text, no letters, no numbers, no logos. Center-bottom area simple (a caption goes there). " +
  "Soft natural light, muted calm palette, photorealistic.";

const POSTS = [
  {
    id: "briefing-medical-ad-rules",
    thumbTitle: "믿을 수 있는\n병원 광고 보기",
    prompt:
      "A tidy desk still life: a magnifying glass resting on a printed brochure, a pair of glasses, a pen, on a light wood table by a window. " +
      GUARD,
  },
  {
    id: "briefing-adult-vaccination",
    thumbTitle: "어른도\n예방접종",
    prompt:
      "A calm clinic still life: a small adhesive bandage and a folded cotton pad on a clean pale tray, a green plant nearby, soft daylight. No needles, no syringes. " +
      GUARD,
  },
  {
    id: "briefing-insurance-claim",
    thumbTitle: "실손보험\n청구 간소화",
    prompt:
      "A clean flat-lay of a smartphone showing a blank screen, a paper receipt, and a pen on a pale desk, soft daylight, minimal. " +
      GUARD,
  },
  {
    id: "briefing-summer-conjunctivitis",
    thumbTitle: "여름철\n유행성 눈병",
    prompt:
      "A serene summer still life: folded clean white towels, a bar of soap, and a glass of water on a pale stone surface by a bright window. " +
      GUARD,
  },
];

async function generateImage(prompt: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "high",
      output_format: "png",
      n: 1,
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const json = await res.json();
  const it = json.data?.[0];
  if (it?.b64_json) return Buffer.from(it.b64_json, "base64");
  return Buffer.from(await (await fetch(it.url)).arrayBuffer());
}

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
  const buf = await sharp({
    create: { width: w, height: h, channels: 3, background: "#ffffff" },
  })
    .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();
  return { buf, w, h };
}

/** 여러 줄 제목 렌더 (\n 기준) */
async function renderTitle(title: string, color: string): Promise<Buffer> {
  const len = title.replace(/\s/g, "").length;
  const dpi = len <= 10 ? 520 : len <= 16 ? 430 : 360;
  return sharp({
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
}

async function compose(imageBuf: Buffer, title: string): Promise<Buffer> {
  const base = await sharp(imageBuf).resize(S, S, { fit: "cover" }).toBuffer();
  const scrim = Buffer.from(
    `<svg width="${S}" height="${S}"><defs>` +
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="#000" stop-opacity="0.18"/>` +
      `<stop offset="42%" stop-color="#000" stop-opacity="0.06"/>` +
      `<stop offset="74%" stop-color="#000" stop-opacity="0.34"/>` +
      `<stop offset="100%" stop-color="#000" stop-opacity="0.62"/>` +
      `</linearGradient></defs>` +
      `<rect width="${S}" height="${S}" fill="url(#g)"/></svg>`,
  );
  const titleImg = await renderTitle(title, "#ffffff");
  const shadowImg = await sharp(await renderTitle(title, "#000000")).blur(7).toBuffer();
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

for (const p of POSTS) {
  const bg = await generateImage(p.prompt);
  const webp = await compose(bg, p.thumbTitle);
  const key = `${p.id}/thumb.webp`;
  const up = await sb.storage
    .from(BUCKET)
    .upload(key, webp, { contentType: "image/webp", upsert: true });
  if (up.error) throw up.error;
  const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  const { error } = await sb
    .from("columns")
    .update({ thumbnail: url })
    .eq("id", p.id);
  if (error) throw error;
  console.log(`  ✅ ${p.id}`);
}
console.log("완료");
