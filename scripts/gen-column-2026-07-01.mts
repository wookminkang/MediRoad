/**
 * 7/1 건강 칼럼 시드 + 썸네일(일러스트 느낌, 기존 사진풍과 다른 스타일).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-column-2026-07-01.mts
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

const COLUMN_ID = "summer-uv-skincare-2026";
const THUMB_TITLE = "여름 자외선, 피부 노화 부른다";
// 다른 느낌 — 사실 사진이 아닌 플랫 일러스트 스타일
const PROMPT =
  "A clean modern flat vector illustration in soft pastel tones about summer sun protection and skincare. A calm scene with a large stylized sun and gentle UV rays, a bottle of sunscreen, and simple abstract shapes suggesting skin care. Minimal editorial illustration, smooth gradients, medical blue and warm peach accent colors, lots of soft negative space, no photorealism, no text, no logos, subject in the upper-center, lower third kept simple.";

const body = `## 여름 자외선, 왜 피부에 위험할까요

자외선은 파장에 따라 UVA·UVB로 나뉘어요. **UVB**는 피부 표면을 붉게 태워 일광화상을 일으키고, **UVA**는 진피까지 깊이 침투해 색소침착·주름 같은 광노화를 부릅니다. 특히 여름 한낮의 자외선은 연중 가장 강해 짧은 노출로도 피부에 부담이 됩니다.

## 자외선 차단제, 이렇게 고르세요

- **SPF** — UVB 차단 지수. 일상은 30 이상, 장시간 야외활동은 50 권장.
- **PA** — UVA 차단 등급. \`PA+++\` 이상을 권장해요.
- 제품에 **‘자외선 차단’ 기능성** 표시가 있는지 확인하세요.

## 제대로 바르는 법

1. 외출 **20~30분 전**에 미리 바릅니다.
2. 얼굴 기준 **검지 한 마디 이상** 충분한 양으로.
3. **2~3시간마다** 덧발라요(땀·물에 지워집니다).
4. 귀·목 뒤·손등처럼 **놓치기 쉬운 부위**도 잊지 마세요.

## 차단제만으로는 부족해요

> 자외선차단제는 ‘기본’일 뿐, 물리적 차단을 함께 해야 효과가 큽니다.

- 가장 강한 **11~15시** 야외활동은 피하고
- **모자·선글라스·긴소매**로 직접 가리세요.
- 흐린 날에도 자외선은 통과하니 **차단은 사계절** 필요해요.

## 이런 증상은 진료를 받아보세요

햇볕 노출 후 **물집·심한 통증**(일광화상), 새로 생긴 점의 크기·색 변화, 잘 지워지지 않는 색소침착 등이 있다면 피부과 진료를 받아보는 것이 좋아요.`;

const row = {
  id: COLUMN_ID,
  kind: "column",
  title: "여름 자외선, 피부 노화를 앞당깁니다 — 올바른 차단법",
  category: "skin",
  excerpt:
    "여름 강한 자외선은 색소침착·주름 등 피부 노화의 주범이에요. 자외선의 종류와 차단제 고르는 법·바르는 법을 한눈에 정리했어요.",
  summary: [
    "UVB는 일광화상, UVA는 색소침착·주름 등 광노화를 일으켜요",
    "SPF는 일상 30·야외 50, PA는 +++ 이상을 권장해요",
    "외출 20~30분 전에 충분히 바르고 2~3시간마다 덧발라요",
    "모자·선글라스·긴소매로 함께 가리고, 흐린 날에도 차단하세요",
  ],
  body_md: body,
  tags: ["자외선", "자외선차단제", "여름피부", "광노화", "피부관리"],
  faqs: [
    {
      q: "실내에서도 자외선 차단제를 발라야 하나요?",
      a: "창을 통해 UVA가 들어오기 때문에 창가에 오래 있거나 실내 활동이 길다면 바르는 것이 좋아요.",
    },
    {
      q: "SPF가 높으면 더 오래 지속되나요?",
      a: "SPF는 차단 강도이지 지속 시간이 아니에요. 지수가 높아도 2~3시간마다 덧발라야 효과가 유지됩니다.",
    },
  ],
  refs: [
    {
      title: "식품의약품안전처 — 자외선 차단제 올바른 사용",
      url: "https://www.mfds.go.kr",
    },
  ],
  related_departments: ["피부과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "피부 건강 감수" },
  status: "published",
  reading_minutes: 4,
  published_at: new Date("2026-07-01T09:00:00+09:00").toISOString(),
  updated_at: new Date("2026-07-01T09:00:00+09:00").toISOString(),
};

// ── 썸네일 합성 (일러스트 이미지 + 타이틀/로고) ──
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

console.log("일러스트 이미지 생성 중…");
const img = await generateImage(PROMPT);
console.log("타이틀·로고 합성 중…");
const composed = await composeThumbnail(img, THUMB_TITLE);
const key = `${COLUMN_ID}/thumb.webp`;
const up = await sb.storage
  .from(BUCKET)
  .upload(key, composed, { contentType: "image/webp", upsert: true });
if (up.error) throw up.error;
const thumbUrl = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;

const { error } = await sb.from("columns").upsert({ ...row, thumbnail: thumbUrl }, { onConflict: "id" });
if (error) {
  console.error("칼럼 삽입 실패:", error.message);
  process.exit(1);
}
console.log("✅ 7/1 칼럼 발행 + 일러스트 썸네일:", row.title);
console.log("   thumbnail:", thumbUrl);
