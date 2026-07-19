/**
 * 메디브리핑(건강 트렌드) — 디지털 치료기기(DTx) 개념·이용법 + 썸네일(인물 없음).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-digital-therapeutics.mts
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

const COLUMN_ID = "briefing-digital-therapeutics";
const THUMB_TITLE = "앱으로 처방받는 치료?";
const PROMPT =
  "A clean minimal 3D render illustration about digital therapeutics (software as medical treatment). A stylized smartphone showing a medical cross and a soft progress/heartbeat graph on its screen, next to a small prescription tag and a checkmark seal, arranged as a calm still-life. Medical blue palette with a soft teal accent, smooth matte materials, soft studio lighting, lots of negative space, modern editorial 3D style. No people, no faces, no hands, no text, no logos. Subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## 디지털 치료기기(DTx)란 무엇인가요

디지털 치료기기(DTx, Digital Therapeutics)는 **질병을 예방·관리·치료하기 위해 근거를 갖춘 소프트웨어**를 말해요. 쉽게 말해 **'앱이나 프로그램 형태의 치료 수단'**이에요. 게임·건강관리 앱과 달리, 임상시험으로 효과와 안전성을 확인하고 **의료기기로 허가**를 받은 뒤 사용된다는 점이 핵심입니다. 주로 불면증, 일부 만성질환 관리, 인지·행동 훈련 등에서 연구·활용이 이뤄지고 있어요.

## 일반 건강 앱과 무엇이 다른가요

- **일반 건강·웰니스 앱**: 걷기·식단 기록처럼 건강관리를 돕지만, 치료를 목적으로 허가받은 것은 아니에요.
- **디지털 치료기기**: 특정 질환의 **치료·관리를 목적**으로, 임상 근거와 규제 당국의 **허가 절차**를 거쳐요.

즉 '의학적 근거와 허가 여부'가 둘을 가르는 기준이에요.

## 어떻게 이용하나요

1. 대부분 **의료진의 진단·처방**을 통해 사용이 시작돼요.
2. 안내에 따라 앱을 설치하고, 정해진 **프로그램·훈련을 꾸준히 수행**해요.
3. 사용 데이터가 기록되어 **의료진이 경과를 확인**하고 조정하기도 해요.

제품에 따라 이용 방식과 비용, 적용 질환이 다르므로 담당 의료진의 안내를 따르는 것이 중요해요.

## 알아둘 점과 주의사항

- 디지털 치료기기는 **기존 치료를 보완**하는 수단이에요. 임의로 약이나 기존 치료를 중단하지 마세요.
- 효과는 **꾸준한 사용**을 전제로 하며, 사람마다 결과가 다를 수 있어요.
- 아직 적용 질환과 제품이 넓지 않고 **계속 발전 중인 분야**예요.
- '치료'를 표방하지만 허가받지 않은 앱도 있으니, 사용 전 **의료진·공식 정보로 확인**하세요.

> 이 글은 일반적인 건강 트렌드 정보예요. 디지털 치료기기의 적용 질환·이용 방법은 제품과 정책에 따라 달라질 수 있으니, 사용 전 담당 의료진과 식품의약품안전처 등 공식 정보를 확인하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "trend",
  title: "디지털 치료기기(DTx), 앱으로 처방받는 치료란 — 개념·이용법 바로 알기",
  excerpt:
    "디지털 치료기기(DTx)는 임상 근거와 허가를 거쳐 질병 치료·관리에 쓰이는 소프트웨어예요. 일반 건강 앱과의 차이, 이용 방법, 주의점을 건강 트렌드 관점에서 정리했습니다.",
  summary: [
    "디지털 치료기기(DTx)는 질병 치료·관리를 목적으로 허가받은 소프트웨어(앱·프로그램)예요.",
    "일반 건강 앱과 달리 임상시험으로 효과·안전성을 확인하고 의료기기로 허가받는다는 점이 핵심이에요.",
    "대개 의료진의 진단·처방으로 시작하며, 사용 데이터를 바탕으로 경과를 관리하기도 해요.",
    "기존 치료를 보완하는 수단이므로 임의로 약·치료를 중단하지 말고 의료진 안내를 따르는 게 중요해요.",
  ],
  body_md: body,
  tags: ["디지털치료기기", "DTx", "디지털헬스", "의료기기", "건강트렌드"],
  faqs: [
    {
      q: "디지털 치료기기는 건강관리 앱과 뭐가 다른가요?",
      a: "건강관리 앱은 생활습관을 돕는 도구지만, 디지털 치료기기는 특정 질환의 치료·관리를 목적으로 임상 근거와 허가 절차를 거친 의료기기예요.",
    },
    {
      q: "약 대신 디지털 치료기기만 써도 되나요?",
      a: "대개 기존 치료를 보완하는 수단이에요. 임의로 약이나 치료를 중단하면 안 되고, 사용 여부와 방법은 담당 의료진과 상의하세요.",
    },
    {
      q: "아무 '치료 앱'이나 믿어도 되나요?",
      a: "'치료'를 내세워도 허가받지 않은 앱이 있어요. 임상 근거와 허가 여부를 의료진·공식 정보로 확인한 뒤 사용하는 것이 안전해요.",
    },
  ],
  refs: [
    { title: "식품의약품안전처", url: "https://www.mfds.go.kr" },
    { title: "국가건강정보포털(질병관리청)", url: "https://health.kdca.go.kr" },
    { title: "보건복지부", url: "https://www.mohw.go.kr" },
  ],
  related_departments: ["정신건강의학과", "내과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "디지털헬스 감수" },
  noindex: false,
  meta_description:
    "디지털 치료기기(DTx) 개념과 이용법 — 일반 건강 앱과의 차이, 처방·사용 방식, 기존 치료 보완 원칙과 주의점을 건강 트렌드 관점에서 정리했습니다. 적용 질환·방법은 제품·정책에 따라 변동될 수 있습니다.",
  meta_keywords: ["디지털 치료기기", "DTx", "디지털 헬스", "의료기기", "건강 트렌드"],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-19",
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
