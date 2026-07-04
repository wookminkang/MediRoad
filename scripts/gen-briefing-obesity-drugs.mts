/**
 * 메디브리핑(의료 이슈) — 비만치료제(GLP-1) 오남용 주의 + 썸네일 생성(인물 없음).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-obesity-drugs.mts
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

const COLUMN_ID = "briefing-obesity-drugs";
const THUMB_TITLE = "비만치료제, 알고 쓰기";
const PROMPT =
  "A clean minimal 3D render illustration about weight-loss injection medication and health awareness. No people, no faces, no hands. A stylized injection pen, a small abstract balance/scale motif suggesting healthy weight, and a subtle caution accent, arranged as a calm still-life. Pastel palette with a medical blue accent, soft studio lighting, smooth matte materials, lots of negative space, modern editorial 3D style, no text, no logos, subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## '살 빼는 주사', 왜 이렇게 화제일까요

최근 **GLP-1 계열의 주사형 비만치료제**(성분명 세마글루타이드·리라글루타이드 등)가 체중 감량 효과로 크게 주목받고 있어요. 원래는 당뇨병과 비만 치료를 위해 개발된 **전문의약품**이지만, '살 빼는 주사'로 알려지며 수요가 급증했고 품귀, 미용 목적의 오남용, 온라인·개인 간 거래 같은 문제도 함께 나타나고 있습니다.

## 원래 어떤 사람을 위한 약인가요

이 약은 누구나 다이어트용으로 쓰는 약이 아니에요. 일반적으로 **비만(체질량지수 기준)이거나, 과체중이면서 당뇨·고혈압 같은 동반질환이 있는 경우** 의사의 진료와 처방 아래 사용합니다. 정상 체중인 사람이 미용 목적으로 임의로 쓰는 약이 아닙니다.

## 알아둘 부작용과 주의점

- **흔한 증상**: 메스꺼움, 구토, 설사, 변비 등 위장관 불편
- **드물지만 주의**: 췌장염, 담낭 문제, 탈수, (당뇨약과 병용 시) 저혈당
- **체중 외 변화**: 근육량 감소·영양 불균형이 생길 수 있어 식사·운동 관리가 중요
- **중단 시**: 생활습관 관리 없이 약만 의존하면 체중이 다시 늘 수 있어요(요요)
- **금기·상호작용**: 임신·수유 중이거나 특정 질환·약을 복용 중이면 반드시 진료로 확인

## 이런 사용은 위험해요

- 처방 없이 온라인·해외직구·개인 간 거래로 구매
- 정상 체중인데 미용 목적으로 사용
- 용량을 임의로 늘리거나 다른 다이어트약·이뇨제와 함께 사용
- 성분과 출처가 불분명한 제품 사용

이런 방식은 부작용을 놓치거나, 가짜·변질 제품으로 인한 위험이 커질 수 있습니다.

## 안전하게 쓰려면

- **반드시 의료기관 진료 후** 처방받고, 경과를 함께 확인해요
- 약에만 의존하기보다 **식사·운동 등 생활습관 관리**를 병행해요
- 심한 복통, 지속되는 구토, 심한 탈수 같은 증상이 있으면 즉시 진료를 받으세요

> 이 글은 일반적인 공공 건강정보예요. 개인의 사용 여부·용량·중단은 반드시 진료를 담당하는 의료진과 상의해 결정하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "issue",
  title: "'살 빼는 주사' 비만치료제 열풍 — 쓰기 전 꼭 알아야 할 점",
  excerpt:
    "GLP-1 계열 비만치료제가 '살 빼는 주사'로 화제예요. 원래 어떤 환자를 위한 약인지, 부작용과 오남용 위험, 안전하게 쓰는 기준을 공공 건강정보 기준으로 정리했습니다.",
  summary: [
    "GLP-1 계열 주사형 비만치료제가 체중 감량 효과로 화제지만, 원래 비만·당뇨 치료용 전문의약품이에요.",
    "비만이거나 과체중+동반질환이 있는 환자에게 의사 처방 하에 쓰는 약으로, 미용 목적 임의 사용은 위험해요.",
    "메스꺼움·구토 등 위장관 부작용이 흔하고, 중단 시 요요·근육량 감소 등도 함께 고려해야 해요.",
    "처방 없는 온라인·개인 간 거래는 위험하니, 반드시 진료 후 사용하고 생활습관 관리를 병행하세요.",
  ],
  body_md: body,
  tags: ["비만치료제", "GLP-1", "위고비", "삭센다", "다이어트약", "의료이슈"],
  faqs: [
    {
      q: "정상 체중인데 미용 목적으로 써도 되나요?",
      a: "권장하지 않아요. 이 약들은 비만이나 과체중+동반질환 환자를 위한 전문의약품으로, 정상 체중에서 미용 목적으로 임의 사용하면 부작용 위험만 커질 수 있습니다. 사용 여부는 진료로 판단해야 해요.",
    },
    {
      q: "약을 끊으면 다시 살이 찌나요?",
      a: "생활습관 관리 없이 약에만 의존하면 중단 후 체중이 다시 늘 수 있어요(요요). 그래서 식사·운동을 함께 하고, 중단·감량 계획도 의료진과 상의하는 것이 좋습니다.",
    },
    {
      q: "온라인이나 해외직구로 사도 되나요?",
      a: "위험합니다. 성분·용량·보관 상태를 보장할 수 없고, 처방과 경과 관찰 없이 쓰면 부작용을 놓칠 수 있어요. 반드시 의료기관에서 진료 후 처방받으세요.",
    },
  ],
  refs: [
    { title: "식품의약품안전처", url: "https://www.mfds.go.kr" },
    { title: "대한비만학회", url: "https://www.kosso.or.kr" },
    { title: "국가건강정보포털(질병관리청)", url: "https://health.kdca.go.kr" },
  ],
  related_departments: ["가정의학과", "내과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "건강정보 감수" },
  noindex: false,
  meta_description:
    "'살 빼는 주사'로 불리는 GLP-1 비만치료제의 열풍과 오남용 주의점 — 처방 대상, 부작용, 온라인 거래 위험, 안전한 사용 기준을 공공 건강정보로 정리했습니다.",
  meta_keywords: ["비만치료제", "GLP-1", "살 빼는 주사", "다이어트약 오남용", "위고비", "의료이슈"],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-04",
};

// ── 썸네일 생성 (인물 없음) ──
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
console.log("✅ 메디브리핑 저장 완료:", COLUMN_ID);
console.log("   썸네일:", thumbnail);
console.log("   URL: /briefing/" + COLUMN_ID);
