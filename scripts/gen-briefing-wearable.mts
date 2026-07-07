/**
 * 메디브리핑(건강 트렌드) — 웨어러블 건강측정 바로 알기 + 썸네일(인물 없음).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-wearable.mts
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

const COLUMN_ID = "briefing-wearable-health";
const THUMB_TITLE = "웨어러블 건강측정";
const PROMPT =
  "A clean minimal 3D render illustration about a smartwatch and health tracking. No people, no faces, no hands, no wrists. A stylized smartwatch showing an abstract heartbeat line, with small floating icons for sleep and heart rate around it, calm still-life. Pastel palette with a medical blue accent, soft studio lighting, smooth matte materials, lots of negative space, modern editorial 3D style, no text, no logos, subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## 손목 위 건강 측정, 얼마나 믿을 수 있을까

스마트워치·스마트밴드 같은 **웨어러블 기기**가 심박수, 수면, 걸음 수는 물론 산소포화도, 심전도(ECG)까지 측정하는 시대예요. 건강 관리에 도움을 주지만, 이 값을 '진단'처럼 받아들이면 오히려 문제가 될 수 있습니다. 무엇을 믿고 무엇을 조심해야 하는지 정리했어요.

## 웨어러블이 측정하는 것

- 심박수와 심박변이도
- 수면 시간·단계
- 걸음 수·활동량·소모 칼로리
- 혈중 산소포화도(SpO2)
- 일부 기기: 심전도(ECG), 불규칙 맥박 알림

## 유용한 점

- 평소 **추세**를 파악하고, 반복되는 이상 신호(불규칙 맥박, 낮은 산소 등)를 일찍 알아차리는 데 도움
- 활동량·수면 습관을 개선하는 동기부여

## 한계와 주의점

- 대부분 진단용 **의료기기가 아니라 '웰니스(참고용)' 기기**예요.
- 착용 상태, 움직임, 피부 상태에 따라 **측정값이 부정확**할 수 있어요.
- 수치에 과도하게 불안해하거나(건강염려), 반대로 '정상' 표시를 맹신하는 것 **모두 위험**해요.
- 증상이 있는데 기기가 '정상'이라고 안심하면 안 됩니다.

## 이렇게 활용하세요

- **추세·참고용**으로 활용하고, 이상 알림이 반복되거나 증상이 동반되면 진료를 받으세요.
- 가슴 통증, 실신, 심한 두근거림 등은 **기기 수치와 무관하게 즉시** 진료·응급이 필요해요.
- 진료 시 기기 기록을 **참고 자료**로 가져가면 의료진 판단에 도움이 될 수 있어요.

> 이 글은 일반적인 공공 건강정보예요. 웨어러블 수치는 참고용이며, 증상이나 이상이 있으면 반드시 의료기관에서 확인하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "trend",
  title: "스마트워치로 심박·수면 체크, 어디까지 믿을까 — 웨어러블 건강측정 바로 알기",
  excerpt:
    "스마트워치·밴드가 심박·수면·산소포화도·심전도까지 측정해요. 무엇을 측정하고 어디까지 믿을 수 있는지, 참고용 기기의 한계와 올바른 활용법을 정리했습니다.",
  summary: [
    "스마트워치 등 웨어러블은 심박·수면·산소포화도·심전도 등을 측정해 건강 관리에 도움을 줘요.",
    "다만 대부분 진단용 의료기기가 아닌 '참고용'이라, 측정값이 부정확할 수 있어요.",
    "수치에 과도하게 불안해하거나 '정상' 표시를 맹신하는 것 모두 주의가 필요해요.",
    "이상 알림이 반복되거나 증상이 동반되면 기기 수치와 상관없이 진료를 받으세요.",
  ],
  body_md: body,
  tags: ["웨어러블", "스마트워치", "심박수", "건강측정", "디지털헬스", "건강트렌드"],
  faqs: [
    {
      q: "스마트워치 심전도(ECG)로 부정맥을 진단할 수 있나요?",
      a: "일부 기기의 심전도·불규칙 맥박 알림은 이상을 '의심'하는 데 도움이 될 수 있지만 진단은 아니에요. 알림이 반복되거나 증상이 있으면 병원에서 정식 검사를 받아야 합니다.",
    },
    {
      q: "산소포화도가 낮게 나오면 위험한가요?",
      a: "착용 상태나 움직임 때문에 부정확하게 낮게 나올 수 있어요. 반복적으로 낮거나 호흡곤란 등 증상이 있으면 진료가 필요하지만, 한 번의 수치만으로 단정하지 마세요.",
    },
    {
      q: "웨어러블 수치가 정상이면 안심해도 되나요?",
      a: "아니요. 참고용 기기라 정상으로 표시돼도 증상이 있으면 진료를 받아야 해요. 가슴 통증·실신 등은 수치와 무관하게 즉시 병원에 가세요.",
    },
  ],
  refs: [
    { title: "식품의약품안전처", url: "https://www.mfds.go.kr" },
    { title: "대한심장학회", url: "https://www.circulation.or.kr" },
    { title: "국가건강정보포털(질병관리청)", url: "https://health.kdca.go.kr" },
  ],
  related_departments: ["내과", "가정의학과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "건강정보 감수" },
  noindex: false,
  meta_description:
    "스마트워치·웨어러블이 측정하는 심박·수면·산소포화도·심전도, 어디까지 믿을 수 있을까? 참고용 기기의 한계와 올바른 활용법, 진료가 필요한 경우를 공공 건강정보로 정리했습니다.",
  meta_keywords: ["웨어러블", "스마트워치 건강", "심전도", "산소포화도", "디지털헬스", "건강트렌드"],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-06",
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
