/**
 * 메디브리핑 — 의료광고 정책(ad-policy) 글 + 썸네일.
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-ad-policy.mts
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
const Q = Number(process.env.IMAGE_WEBP_QUALITY ?? 80);

const ID = "briefing-medical-ad-rules";
const THUMB_TITLE = "의료광고, 어디까지 될까?";
const PROMPT =
  "A clean, professional editorial photo representing medical advertising regulations and compliance in Korea. A neat desk with a document or checklist, a magnifying glass, a stethoscope, and a small gavel or approval stamp, soft natural daylight, shallow depth of field, modern minimal aesthetic, medical blue accents, trustworthy and official mood. Photorealistic, no text, no logos, subject in the upper-center, lower third kept simple.";

const body = `## 의료광고, 왜 규제가 있을까요

의료는 국민의 건강·생명과 직결되기 때문에, 잘못된 광고가 큰 피해로 이어질 수 있어요. 그래서 **의료법**은 일반 상품 광고와 달리 의료광고에 대한 별도의 기준과 **사전 심의 제도**를 두고 있습니다.

## 사전 심의가 필요한 경우

일정 매체(신문·인터넷 등)에 의료광고를 하려면 **의료광고 사전심의**를 거쳐야 하는 경우가 있어요. 심의는 의료단체 등에 위탁된 **자율심의기구**가 담당합니다. 심의 대상인지 먼저 확인하는 것이 중요해요.

## 금지되는 의료광고 (대표 예시)

- **거짓·과장** 광고
- **치료 경험담**으로 효과를 오인하게 하는 광고(환자 후기·평점 등)
- **비교·비방** 광고
- 부작용 등 **중요 정보를 누락**한 광고
- 과도한 할인·이벤트 등 **환자 유인·알선**
- 심의를 받지 않았거나 **심의 내용과 다른** 광고

## 병원·의료진이 유의할 점

1. 광고 전 **심의 대상 여부**를 확인하세요.
2. **후기·평점·전후 사진**은 규정 위반 소지가 크니 특히 신중해야 해요.
3. 위반 시 **행정처분·벌칙** 대상이 될 수 있습니다.

> 메디로드가 병원 정보에서 리뷰·평점을 제공하지 않는 것도, 이런 의료광고 규정을 준수하기 위해서예요.

## 이 콘텐츠에 대해

본 글은 의료광고 관련 **제도를 소개하는 정보**이며, 특정 병원·서비스를 광고하지 않습니다. 구체적인 사안은 관련 법령과 자율심의기구 안내를 확인하시길 권장해요.`;

const row = {
  id: ID,
  kind: "briefing",
  title: "의료광고, 어디까지 허용될까? — 심의·금지 규정 핵심 정리",
  category: "ad-policy",
  excerpt:
    "의료광고는 사전 심의와 금지 규정이 있어요. 심의 대상, 금지되는 광고 유형, 병원·의료진이 유의할 점을 정리했어요.",
  summary: [
    "의료광고는 의료법상 별도 기준과 사전 심의 제도가 있어요",
    "거짓·과장, 치료 경험담(후기·평점), 비교·비방, 환자 유인 광고는 금지돼요",
    "일정 매체 광고는 자율심의기구의 사전심의 대상일 수 있어요",
    "위반 시 행정처분·벌칙 대상이 될 수 있어 신중해야 해요",
  ],
  body_md: body,
  tags: ["의료광고", "의료법", "광고심의", "의료광고규정", "의료정책"],
  faqs: [
    {
      q: "환자 후기·평점을 광고에 써도 되나요?",
      a: "치료 경험담으로 효과를 오인하게 하는 광고는 금지 대상에 해당할 수 있어요. 후기·평점 활용은 규정 위반 소지가 크므로 신중해야 합니다.",
    },
    {
      q: "모든 의료광고가 사전 심의를 받아야 하나요?",
      a: "매체·형태에 따라 사전심의 대상 여부가 달라요. 광고 전 자율심의기구를 통해 대상 여부를 확인하는 것이 안전합니다.",
    },
  ],
  refs: [
    { title: "보건복지부 — 의료법(의료광고)", url: "https://www.mohw.go.kr" },
  ],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "의료정책 감수" },
  status: "published",
  reading_minutes: 4,
  published_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

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
      n: 1,
    }),
  });
  if (!res.ok) throw new Error(`이미지 생성 실패(${res.status}): ${await res.text()}`);
  const j = await res.json();
  const it = j.data?.[0];
  if (it?.b64_json) return Buffer.from(it.b64_json, "base64");
  if (it?.url) return Buffer.from(await (await fetch(it.url)).arrayBuffer());
  throw new Error("이미지 응답 형식 불명");
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
async function whiteLogo(targetW: number) {
  const resized = await sharp(LOGO_PATH, { density: 400 }).resize({ width: targetW }).ensureAlpha().png().toBuffer();
  const m = await sharp(resized).metadata();
  const w = m.width ?? targetW;
  const h = m.height ?? 0;
  const { data: alpha } = await sharp(resized).extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: "#ffffff" } })
    .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
  return { buf, w, h };
}
async function composeThumbnail(imageBuf: Buffer, title: string): Promise<Buffer> {
  const base = await sharp(imageBuf).resize(S, S, { fit: "cover" }).toBuffer();
  const scrim = Buffer.from(
    `<svg width="${S}" height="${S}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="#000" stop-opacity="0.16"/><stop offset="42%" stop-color="#000" stop-opacity="0.04"/>` +
      `<stop offset="74%" stop-color="#000" stop-opacity="0.30"/><stop offset="100%" stop-color="#000" stop-opacity="0.58"/>` +
      `</linearGradient></defs><rect width="${S}" height="${S}" fill="url(#g)"/></svg>`,
  );
  const len = title.replace(/\s/g, "").length;
  const dpi = len <= 14 ? 560 : len <= 22 ? 460 : 380;
  const renderText = (color: string) =>
    sharp({ text: { text: `<span foreground="${color}" weight="bold">${escapeXml(title)}</span>`, font: "Apple SD Gothic Neo", width: Math.round(S * 0.84), align: "center", rgba: true, dpi } }).png().toBuffer();
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
    .webp({ quality: Q })
    .toBuffer();
}

console.log("이미지 생성 중…");
const img = await generateImage(PROMPT);
console.log("합성 중…");
const composed = await composeThumbnail(img, THUMB_TITLE);
const key = `${ID}/thumb.webp`;
const up = await sb.storage.from(BUCKET).upload(key, composed, { contentType: "image/webp", upsert: true });
if (up.error) throw up.error;
const thumbUrl = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
const { error } = await sb.from("columns").upsert({ ...row, thumbnail: thumbUrl }, { onConflict: "id" });
if (error) { console.error("삽입 실패:", error.message); process.exit(1); }
console.log("✅ 의료광고 정책 브리핑 발행:", row.title);
