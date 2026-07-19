/**
 * 메디브리핑(의료광고 정책) — SNS·유튜브 의료광고에서 소비자가 조심할 점 + 썸네일(인물 없음).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-sns-medical-ad.mts
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

const COLUMN_ID = "briefing-sns-medical-ad";
const THUMB_TITLE = "SNS 의료광고, 이건 조심";
const PROMPT =
  "A clean minimal 3D render illustration about social media medical advertising and consumer caution. A stylized smartphone showing a heart/medical cross icon with a small speech bubble and a magnifying glass inspecting it, plus a subtle warning/caution triangle motif, arranged as a calm still-life. Medical blue palette with a soft amber accent, smooth matte materials, soft studio lighting, lots of negative space, modern editorial 3D style. No people, no faces, no hands, no text, no logos. Subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## SNS·유튜브 의료광고, 왜 조심해야 하나요

요즘은 인스타그램·유튜브·블로그에서 시술이나 진료 정보를 접하는 경우가 많아요. 하지만 **의료광고는 일반 상품 광고와 달리 법으로 엄격하게 관리**됩니다. 사람의 생명·건강과 직접 연결되기 때문이에요. 매체가 SNS로 바뀌어도 규정은 똑같이 적용되며, 광고처럼 보이지 않게 만든 콘텐츠도 실제로는 광고인 경우가 많습니다.

## 이런 의료광고는 규제 대상이에요

의료법은 소비자가 오해하거나 현혹될 수 있는 광고를 제한해요. 대표적으로 아래와 같은 경우예요.

- **거짓·과장 광고**: 객관적 근거 없이 치료 성과를 단정하거나 부풀리는 표현
- **치료 경험담·후기를 통한 유인**: 특정 환자의 체험담으로 치료 효과를 오인하게 만드는 광고
- **전후 비교 사진**의 부적절한 사용
- **다른 의료기관과의 비교·비방**
- **과도한 할인·이벤트·사은품**으로 환자를 끌어들이는 유인·알선성 광고

이런 표현이 SNS 게시물, 인플루언서 협찬, 유튜브 영상 어디에 있든 규정은 동일하게 적용돼요.

## 소비자가 확인하면 좋은 것

1. **광고인지 정보인지 구분해요.** '협찬', '광고', '유료광고 포함' 표시가 있는지 살펴보세요.
2. **단정적인 표현을 경계해요.** 누구에게나 똑같은 결과를 약속하는 표현은 의학적으로 성립하기 어려워요.
3. **가격만 강조하는 이벤트는 한 번 더 생각해요.** 지나친 할인은 유인성 광고일 수 있어요.
4. **결정 전 정식 상담을 받아요.** 시술·치료의 필요성과 위험은 개인마다 달라, 대면 진료로 확인하는 게 안전해요.

## 이런 점도 알아두세요

- 일정 매체의 의료광고는 시행 전 **사전 심의**를 거치도록 돼 있어요. 심의필 표시가 신뢰의 참고가 될 수 있어요.
- 광고 내용이 사실과 달라 피해가 우려되면 **보건소나 관할 기관에 신고·문의**할 수 있어요.
- 의료광고 규정은 소비자를 보호하기 위한 장치예요. '좋아 보이는' 광고일수록 표현을 차분히 따져 보는 게 좋습니다.

> 이 글은 일반적인 공공 정보예요. 의료광고 심의 대상·기준은 정책에 따라 바뀔 수 있으니, 자세한 내용은 보건복지부·의료광고 자율심의기구 등 공식 안내에서 확인하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "ad-policy",
  title:
    "SNS·유튜브 의료광고, 무엇을 조심해야 할까 — 환자 유인·과장 표현 바로 알기",
  excerpt:
    "인스타그램·유튜브·블로그의 의료광고도 일반 광고와 달리 법으로 관리돼요. 어떤 표현이 규제 대상이고, 소비자는 무엇을 확인하면 좋은지 공공 정보로 정리했습니다.",
  summary: [
    "의료광고는 매체가 SNS로 바뀌어도 의료법 규정이 똑같이 적용돼요.",
    "거짓·과장, 치료 경험담·후기 유인, 부적절한 전후사진, 과도한 할인·이벤트 유인은 규제 대상이에요.",
    "광고 여부(협찬·광고 표시)와 단정적 표현·과도한 가격 강조를 구분해 보는 습관이 중요해요.",
    "시술·치료 결정 전에는 대면 진료로 필요성과 위험을 확인하는 것이 안전해요.",
  ],
  body_md: body,
  tags: ["의료광고", "SNS광고", "의료광고심의", "환자유인", "소비자보호"],
  faqs: [
    {
      q: "인플루언서가 협찬받아 올린 시술 후기도 의료광고인가요?",
      a: "대가를 받고 특정 의료기관·시술을 홍보하는 콘텐츠는 의료광고에 해당할 수 있어요. 매체가 SNS라도 의료법 규정이 동일하게 적용됩니다.",
    },
    {
      q: "할인 이벤트 광고는 무조건 문제가 되나요?",
      a: "할인 자체가 아니라, 과도한 할인·사은품으로 환자를 끌어들이는 유인·알선성 광고가 제한돼요. 지나친 가격 강조 광고는 한 번 더 따져 보는 게 좋아요.",
    },
    {
      q: "광고가 사실과 다른 것 같으면 어떻게 하나요?",
      a: "허위·과장이 의심되면 관할 보건소나 관계 기관에 문의·신고할 수 있어요. 결정 전에는 대면 진료로 필요성과 위험을 확인하세요.",
    },
  ],
  refs: [
    { title: "보건복지부", url: "https://www.mohw.go.kr" },
    { title: "국가법령정보센터(의료법)", url: "https://www.law.go.kr" },
    { title: "한국소비자원", url: "https://www.kca.go.kr" },
  ],
  related_departments: ["피부과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "의료광고 정책 감수" },
  noindex: false,
  meta_description:
    "SNS·유튜브 의료광고에서 조심할 점 — 거짓·과장, 후기 유인, 전후사진, 과도한 할인 이벤트가 규제되는 이유와 소비자 확인법을 공공 정보로 정리했습니다. 세부 기준은 정책에 따라 변동될 수 있습니다.",
  meta_keywords: ["의료광고", "SNS 의료광고", "의료광고 심의", "환자 유인", "소비자 보호"],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-16",
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
