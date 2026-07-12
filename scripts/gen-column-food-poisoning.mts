/**
 * 건강정보(컬럼) — 여름철 식중독 예방과 대처 + 썸네일(플랫 일러스트).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-column-food-poisoning.mts
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

const COLUMN_ID = "summer-food-poisoning";
const THUMB_TITLE = "여름 식중독, 예방이 답";
const PROMPT =
  "A clean modern flat vector illustration in soft pastel tones about summer food safety. A calm still-life scene with a covered plate, a fridge, a thermometer, water drops suggesting hand washing, and fresh vegetables, arranged with lots of soft negative space. Minimal editorial illustration, smooth gradients, medical blue with fresh green and warm accent colors, no photorealism, no people, no faces, no hands, no text, no logos, subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## 왜 여름에 식중독이 늘까요

기온과 습도가 높은 여름에는 세균이 빠르게 번식합니다. 특히 **살모넬라, 병원성 대장균, 장염 비브리오** 같은 세균은 20~40℃에서 잘 자라기 때문에, 실온에 잠깐 둔 음식도 몇 시간 만에 상할 수 있어요. 그래서 여름철에는 "만들고 → 보관하고 → 데우는" 모든 단계에서 온도 관리가 중요합니다.

## 식중독 예방 6가지 수칙

- **손 씻기**: 조리 전·식사 전·화장실 후 비누로 30초 이상.
- **익혀 먹기**: 육류·달걀·어패류는 중심부까지 완전히 익히기(중심 온도 75℃, 어패류 85℃ 이상 1분).
- **끓여 마시기**: 여름철 지하수·약수는 되도록 끓여서.
- **칼·도마 구분**: 날음식과 익힌 음식은 도구를 분리(교차오염 방지).
- **냉장 보관**: 조리 후 상온에 2시간 이상(더운 날은 1시간) 두지 않기. 냉장 5℃ 이하, 냉동 -18℃ 이하.
- **의심되면 버리기**: 상한 냄새·색·점액이 있으면 아까워도 폐기하세요.

## 이런 증상이 나타나면

식중독은 보통 오염된 음식을 먹은 뒤 **수 시간~며칠 안에** 구토, 설사, 복통, 미열로 나타납니다. 대부분은 **수분을 충분히 보충하며 쉬면** 하루이틀 사이 회복돼요.

- **수분 보충이 가장 중요**: 물, 이온음료, 보리차를 조금씩 자주. 탈수를 막는 것이 핵심이에요.
- **굶기보다 부담 적은 음식**: 죽·미음처럼 소화가 쉬운 음식부터 조금씩.
- **지사제 임의 복용 주의**: 설사는 몸이 독소를 내보내는 과정일 수 있어, 함부로 멈추면 오히려 회복이 늦어질 수 있어요. 복용 전 약사·의사와 상담하세요.

## 병원에 가야 하는 위험 신호

다음과 같은 경우에는 지체 없이 병원 진료를 받으세요.

- 물설사가 잦아 **탈수 증상**(소변량 급감, 어지럼, 입 마름, 축 처짐)이 보일 때
- **혈변**, 심한 복통, 38.5℃ 이상 고열이 지속될 때
- 구토가 심해 물조차 삼키기 어려울 때
- **영유아, 고령자, 임신부, 만성질환자**는 증상이 가벼워도 일찍 진료받는 것이 안전해요

> 이 글은 일반적인 공공 건강정보예요. 증상이 심하거나 빠르게 나빠지면 자가 판단 대신 가까운 병원이나 응급실에서 진료받으세요.`;

const row = {
  id: COLUMN_ID,
  kind: "column",
  title: "여름철 식중독, 이렇게 예방하고 대처하세요",
  category: "seasonal",
  excerpt:
    "여름에는 세균이 빠르게 번식해 식중독이 늘어요. 손 씻기·완전히 익히기·냉장 보관 등 예방 수칙과, 증상이 생겼을 때 수분 보충·병원 방문 기준을 정리했어요.",
  summary: [
    "여름철 20~40℃에서 세균이 빠르게 번식해 식중독 위험이 커져요",
    "손 씻기, 완전히 익히기, 칼·도마 구분, 냉장 보관(상온 2시간 이내)이 핵심 예방 수칙이에요",
    "증상이 생기면 물·이온음료로 수분을 충분히 보충하며 쉬는 것이 가장 중요해요",
    "혈변·고열·심한 탈수, 또는 영유아·고령자·임신부는 지체 없이 병원 진료를 받으세요",
  ],
  body_md: body,
  tags: ["식중독", "여름건강", "식품안전", "장염", "수분보충", "예방수칙"],
  faqs: [
    {
      q: "상온에 둔 음식은 몇 시간까지 괜찮나요?",
      a: "여름철에는 조리 후 상온에 2시간(기온이 높은 날은 1시간)을 넘기지 않는 것이 안전해요. 시간이 지났다면 냄새가 괜찮아 보여도 폐기하는 것을 권장합니다.",
    },
    {
      q: "설사할 때 지사제를 먹어도 되나요?",
      a: "설사는 몸이 독소를 내보내는 과정일 수 있어 임의로 멈추면 회복이 늦어질 수 있어요. 수분 보충을 우선하고, 지사제 복용은 약사·의사와 상담 후 결정하세요.",
    },
    {
      q: "식중독일 때 굶는 게 좋나요?",
      a: "오래 굶기보다 죽·미음처럼 소화가 쉬운 음식을 조금씩 드시는 것이 회복에 도움이 돼요. 다만 구토가 심하면 우선 수분부터 조금씩 보충하세요.",
    },
  ],
  refs: [
    { title: "식품의약품안전처 식중독예방 홈페이지", url: "https://www.mfds.go.kr" },
    { title: "질병관리청 국가건강정보포털", url: "https://health.kdca.go.kr" },
  ],
  related_departments: ["내과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "건강정보 감수" },
  noindex: false,
  meta_description:
    "여름철 식중독 예방 수칙(손 씻기·완전히 익히기·냉장 보관)과 증상이 생겼을 때 수분 보충·병원 방문 기준을 공공 건강정보로 정리했습니다.",
  meta_keywords: ["식중독", "여름 식중독", "식중독 예방", "식중독 증상", "식품안전"],
  status: "published",
  reading_minutes: 4,
  published_at: new Date("2026-07-10T09:00:00+09:00").toISOString(),
  updated_at: new Date("2026-07-10T09:00:00+09:00").toISOString(),
};

// ── 썸네일 합성 (일러스트 + 타이틀/로고) ──
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
      `<stop offset="0%" stop-color="#000" stop-opacity="0.10"/>` +
      `<stop offset="50%" stop-color="#000" stop-opacity="0.04"/>` +
      `<stop offset="76%" stop-color="#000" stop-opacity="0.34"/>` +
      `<stop offset="100%" stop-color="#000" stop-opacity="0.62"/>` +
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
  const titleTop = Math.max(24, logoTop - th - Math.round(S * 0.045));
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
const thumbnail = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;

const { error } = await sb.from("columns").upsert({ ...row, thumbnail }, { onConflict: "id" });
if (error) throw error;
console.log("✅ 건강정보 저장 완료:", COLUMN_ID, "\n   URL: /health/" + COLUMN_ID);
