/**
 * 메디브리핑(의료 이슈) — 건강기능식품 바로알기(의약품과의 차이·과대광고 주의) + 썸네일(인물 없음).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-health-supplements.mts
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

const COLUMN_ID = "briefing-health-supplements";
const THUMB_TITLE = "건강기능식품 바로알기";
const PROMPT =
  "A clean minimal 3D render illustration about dietary health supplements and consumer literacy. A stylized supplement bottle with a few capsules beside a small certification checkmark seal and a magnifying glass inspecting a label, arranged as a calm still-life. Medical blue palette with a soft green accent, smooth matte materials, soft studio lighting, lots of negative space, modern editorial 3D style. No people, no faces, no hands, no text, no logos. Subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## 건강기능식품은 약과 어떻게 다른가요

건강기능식품은 **인체에 유용한 기능성 원료로 만든 '식품'**이에요. 질병을 진단·치료·예방하는 **의약품과는 분명히 다릅니다.** 건강 유지·개선에 도움을 줄 수 있다는 '기능성'을 인정받은 제품이지만, 약처럼 병을 낫게 하는 것은 아니에요. 그래서 몸이 아플 때는 건강기능식품이 아니라 **진료와 치료가 먼저**입니다.

## 고를 때 이렇게 확인해요

- **인증 마크를 확인해요.** 정식 건강기능식품에는 '건강기능식품' 문구와 인정 도안이 표시돼 있어요.
- **기능성 내용과 원료를 봐요.** 어떤 기능성을 인정받았는지, 하루 섭취량은 얼마인지 라벨을 확인하세요.
- **'식품'임을 기억해요.** 특정 질병을 치료한다고 표현하면 과대광고일 수 있어요.

## 이런 광고·표현은 주의하세요

건강기능식품은 질병 치료 효과를 표방할 수 없어요. 아래와 같은 표현이 보이면 한 번 더 의심해 보세요.

- "○○병이 낫는다", "약을 끊어도 된다" 같은 **질병 치료·대체 주장**
- 체험담·후기만으로 효과를 단정하는 광고
- 근거를 밝히지 않고 극적인 변화를 약속하는 문구

## 안전하게 이용하려면

1. **복용 중인 약이 있으면 상호작용을 확인해요.** 일부 성분은 약효에 영향을 줄 수 있어, 의사·약사와 상담하는 것이 좋아요.
2. **여러 제품을 동시에 먹을 때 성분 중복**에 주의해요. 같은 성분을 과다 섭취할 수 있어요.
3. **임신·수유 중이거나 만성질환이 있으면** 섭취 전 전문가와 상의하세요.
4. 이상 반응이 나타나면 섭취를 멈추고 **의료기관 상담·신고**를 고려하세요.

건강기능식품은 균형 잡힌 식사와 생활습관을 **보조**하는 수단이에요. 증상이 있을 때 치료를 미루는 용도로 삼지 않는 것이 중요합니다.

> 이 글은 일반적인 공공 정보예요. 개인의 건강 상태·복용 약에 따라 주의점이 다를 수 있으니, 섭취 전 의사·약사와 상담하고 식품의약품안전처 등 공식 정보를 확인하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "issue",
  title: "건강기능식품, 약처럼 믿어도 될까 — 의약품과의 차이·과대광고 바로 알기",
  excerpt:
    "건강기능식품은 질병을 치료하는 의약품이 아니라 '식품'이에요. 약과의 차이, 인증 확인법, 주의해야 할 과대광고와 안전한 섭취법을 공공 정보로 정리했습니다.",
  summary: [
    "건강기능식품은 기능성을 인정받은 '식품'으로, 질병을 치료하는 의약품과는 달라요.",
    "정식 제품의 인증 마크와 기능성·하루 섭취량 라벨을 확인하는 습관이 중요해요.",
    "질병 치료·약 대체를 주장하거나 체험담만으로 효과를 단정하는 광고는 주의가 필요해요.",
    "복용 중인 약이 있거나 임신·만성질환이 있으면 섭취 전 의사·약사와 상담하는 것이 안전해요.",
  ],
  body_md: body,
  tags: ["건강기능식품", "영양제", "과대광고", "의약품", "소비자보호"],
  faqs: [
    {
      q: "건강기능식품으로 병을 치료할 수 있나요?",
      a: "아니에요. 건강기능식품은 건강 유지·개선을 돕는 식품이지 질병을 치료하는 의약품이 아니에요. 증상이 있으면 진료와 치료가 먼저입니다.",
    },
    {
      q: "약이랑 같이 먹어도 괜찮나요?",
      a: "일부 성분은 약효에 영향을 줄 수 있어요. 복용 중인 약이 있으면 함께 먹기 전에 의사·약사와 상담하는 것이 안전해요.",
    },
    {
      q: "정식 건강기능식품인지 어떻게 아나요?",
      a: "제품에 '건강기능식품' 문구와 인정 도안(인증 마크)이 표시돼 있어요. 라벨의 기능성 내용과 하루 섭취량도 함께 확인하세요.",
    },
  ],
  refs: [
    { title: "식품의약품안전처", url: "https://www.mfds.go.kr" },
    { title: "식품안전나라", url: "https://www.foodsafetykorea.go.kr" },
    { title: "한국소비자원", url: "https://www.kca.go.kr" },
  ],
  related_departments: ["내과", "가정의학과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "공공 건강정보 감수" },
  noindex: false,
  meta_description:
    "건강기능식품과 의약품의 차이, 인증 확인법, 주의할 과대광고와 약물 상호작용·안전한 섭취법을 공공 정보로 정리했습니다. 개인 상태에 따라 다를 수 있어 섭취 전 의사·약사 상담을 권합니다.",
  meta_keywords: ["건강기능식품", "영양제", "과대광고", "의약품 차이", "소비자 보호"],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-18",
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
