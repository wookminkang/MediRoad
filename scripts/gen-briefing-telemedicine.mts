/**
 * 메디브리핑(의료 이슈) — 비대면 진료 제도·이용법 + 썸네일(인물 없음).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-telemedicine.mts
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

const COLUMN_ID = "briefing-telemedicine";
const THUMB_TITLE = "비대면 진료, 어디까지?";
const PROMPT =
  "A clean minimal 3D render illustration about telemedicine and non-face-to-face medical care. A stylized smartphone showing a medical cross symbol on its screen, next to a simple stethoscope and a small prescription/pill motif, arranged as a calm still-life. Medical blue palette with a soft accent, smooth matte materials, soft studio lighting, lots of negative space, modern editorial 3D style. No people, no faces, no hands, no text, no logos. Subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## 비대면 진료란 무엇인가요

비대면 진료는 환자가 의료기관을 직접 방문하지 않고 **전화·화상·앱**을 통해 의사의 진료를 받는 방식이에요. 코로나19를 계기로 한시적으로 허용된 뒤 현재는 **시범사업 형태로 운영**되고 있으며, 제도화 논의가 이어지고 있습니다. 이용 대상과 조건은 정책에 따라 바뀔 수 있어, 이용 전 최신 기준을 확인하는 것이 좋아요.

## 어떤 경우에 이용할 수 있나요

일반적으로 비대면 진료는 **대면 진료를 보완**하는 수단으로 활용돼요. (세부 대상·조건은 시기별로 달라질 수 있습니다.)

- 같은 질환으로 대면 진료를 받은 뒤의 **재진·경과 관찰**
- 거동이 불편하거나 의료기관 방문이 어려운 경우
- 야간·휴일 등 병원 이용이 어려운 시간대의 **경증 상담**

처음 겪는 질환(초진)이나 중증·응급은 원칙적으로 대면 진료가 필요해요.

## 이렇게 이용해요

1. 비대면 진료 앱 또는 참여 의료기관에 전화로 진료를 신청해요.
2. 전화·화상으로 의사와 상담해요.
3. 필요 시 처방전이 지정 약국으로 전송되고, 약을 방문 수령하거나 배송받아요.

비용·본인부담·약 수령 방식은 기관과 정책에 따라 다를 수 있어요.

## 한계와 주의할 점

- 비대면 진료는 **대면 진료를 완전히 대체하지 않아요.** 진찰·검사가 필요하면 대면 진료가 더 안전합니다.
- **응급 상황**(심한 흉통·호흡곤란·의식 저하 등)은 비대면이 아니라 즉시 **119·응급실**을 이용하세요.
- 오·남용을 막기 위해 일부 의약품은 비대면 처방이 제한될 수 있어요.
- 증상이 애매하거나 나빠지면 대면 진료로 전환하세요.

> 이 글은 일반적인 공공 정보예요. 비대면 진료의 이용 대상·조건은 정책에 따라 바뀔 수 있으니, 이용 전 보건복지부·건강보험심사평가원 등 공식 안내에서 최신 기준을 확인하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "policy",
  title: "비대면 진료, 어디까지 되나요 — 이용 대상·방법·한계 정리",
  excerpt:
    "비대면 진료가 시범사업으로 운영되며 제도화 논의가 이어지고 있어요. 어떤 경우에 이용할 수 있고, 어떻게 진행되며, 무엇을 주의해야 하는지 공공 정보로 정리했습니다.",
  summary: [
    "비대면 진료는 전화·화상·앱으로 받는 진료로, 현재 시범사업 형태로 운영돼요.",
    "재진·경과 관찰, 거동 불편, 야간·휴일 경증 상담 등 대면 진료를 보완하는 용도로 주로 활용돼요.",
    "초진·중증·응급은 원칙적으로 대면 진료가 필요하고, 응급 상황은 즉시 119·응급실을 이용해야 해요.",
    "이용 대상·조건은 정책에 따라 바뀔 수 있어, 이용 전 공식 안내에서 최신 기준을 확인하세요.",
  ],
  body_md: body,
  tags: ["비대면진료", "원격의료", "재진", "의료정책", "처방전"],
  faqs: [
    {
      q: "비대면 진료는 아무 병원에서나 되나요?",
      a: "참여하는 의료기관에서만 가능해요. 비대면 진료 앱이나 공식 안내에서 참여 기관과 이용 방법을 확인할 수 있어요.",
    },
    {
      q: "처음 아픈 것도(초진) 비대면으로 되나요?",
      a: "원칙적으로 재진을 중심으로 운영되며, 초진은 제한적으로만 허용돼요. 세부 기준은 정책에 따라 바뀔 수 있으니 최신 안내를 확인하세요.",
    },
    {
      q: "약은 어떻게 받나요?",
      a: "진료 후 처방전이 지정 약국으로 전송되고, 약국을 방문해 수령하거나 배송받을 수 있어요. 수령 방식은 기관·정책에 따라 다를 수 있어요.",
    },
  ],
  refs: [
    { title: "보건복지부", url: "https://www.mohw.go.kr" },
    { title: "건강보험심사평가원", url: "https://www.hira.or.kr" },
    { title: "국가건강정보포털(질병관리청)", url: "https://health.kdca.go.kr" },
  ],
  related_departments: ["내과", "가정의학과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "의료정책 감수" },
  noindex: false,
  meta_description:
    "비대면 진료 이용 대상·방법·한계 — 재진 중심 활용, 초진·응급 제한, 처방·약 수령 방식과 주의점을 공공 정보로 정리했습니다. 세부 기준은 정책에 따라 변동될 수 있습니다.",
  meta_keywords: ["비대면 진료", "원격의료", "재진", "의료정책", "처방전"],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-10",
};

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
const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
async function whiteLogo(targetW: number) {
  const resized = await sharp(LOGO_PATH, { density: 400 }).resize({ width: targetW }).ensureAlpha().png().toBuffer();
  const m = await sharp(resized).metadata();
  const w = m.width ?? targetW, h = m.height ?? 0;
  const { data: alpha } = await sharp(resized).extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: "#ffffff" } })
    .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
  return { buf, w, h };
}
async function composeThumbnail(imageBuf: Buffer, title: string): Promise<Buffer> {
  const S = THUMB_SIZE;
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
  const tw = tm.width ?? 0, th = tm.height ?? 0;
  const logo = await whiteLogo(Math.round(S * 0.2));
  const bottomPad = Math.round(S * 0.07);
  const logoTop = S - logo.h - bottomPad;
  const titleTop = Math.max(24, logoTop - th - Math.round(S * 0.045));
  const titleLeft = Math.round((S - tw) / 2);
  return sharp(base).composite([
    { input: scrim, top: 0, left: 0 },
    { input: shadowImg, top: titleTop + 3, left: titleLeft },
    { input: titleImg, top: titleTop, left: titleLeft },
    { input: logo.buf, top: logoTop, left: Math.round((S - logo.w) / 2) },
  ]).webp({ quality: WEBP_QUALITY }).toBuffer();
}

console.log("이미지 생성 중…");
const baseImg = await generateImage(PROMPT);
console.log("타이틀·로고 합성 중…");
const composed = await composeThumbnail(baseImg, THUMB_TITLE);
const key = `${COLUMN_ID}/thumb.webp`;
const up = await sb.storage.from(BUCKET).upload(key, composed, { contentType: "image/webp", upsert: true });
if (up.error) throw up.error;
const thumbnail = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;

const { error } = await sb.from("columns").upsert({ ...post, thumbnail }, { onConflict: "id" });
if (error) throw error;
console.log("✅ 메디브리핑 저장 완료:", COLUMN_ID, "\n   URL: /briefing/" + COLUMN_ID);
