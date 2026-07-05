/**
 * 메디브리핑(공공 건강정보) — 국가건강검진 안내 + 썸네일(인물 없음).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-national-checkup.mts
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

const COLUMN_ID = "briefing-national-checkup";
const THUMB_TITLE = "국가건강검진 챙기기";
const PROMPT =
  "A clean minimal flat editorial illustration about a national health check-up in Korea. No people, no faces, no hands. Abstract shapes suggesting a checklist clipboard, a stethoscope, and simple medical chart marks, arranged as a calm still-life. Soft mint-green and medical blue palette, smooth gradients, subtle grain, lots of negative space, modern flat illustration, no photorealism, no text, no logos, subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## 국가건강검진, 2년에 한 번 무료로 받으세요

건강보험 가입자와 피부양자, 의료급여 수급자는 국가가 지원하는 **일반건강검진**과 **국가암검진**을 받을 수 있어요. 일반건강검진은 보통 **2년에 한 번**(사무직 외 근로자 등 일부는 매년), 암검진은 암종별로 대상 연령과 주기가 정해져 있습니다. 큰 증상이 없어도 정기적으로 받아두면 질환을 **조기에 발견**하는 데 도움이 됩니다.

## 일반건강검진에서 무엇을 확인하나요

- 문진과 신체계측(키·몸무게·허리둘레·체질량지수), 혈압 측정
- 혈액검사(혈당, 콜레스테롤 등)와 소변검사
- 흉부 X선, 시력·청력 검사
- 연령대에 따라 이상지질혈증, B형간염, 골밀도, 인지기능(치매)·우울 선별, 생활습관 평가 등이 추가돼요

검사 결과에 따라 '정상', '경계', '유질환 의심' 등으로 안내되며, 필요하면 확진검사로 이어집니다.

## 국가암검진(6대 암)

- **위암**: 만 40세 이상, 2년마다
- **대장암**: 만 50세 이상, 1년마다(분변검사)
- **간암**: 고위험군, 6개월마다
- **유방암**: 만 40세 이상 여성, 2년마다
- **자궁경부암**: 만 20세 이상 여성, 2년마다
- **폐암**: 만 54~74세 고위험 흡연자, 2년마다

대상 연령·주기·본인부담은 바뀔 수 있으니, 정확한 내용은 국민건강보험공단 안내로 확인하세요.

## 놓치기 쉬운 점

- 올해 검진 대상인데 받지 않고 지나가면 그 해 기회를 놓칠 수 있어요(연말에 몰리니 미리 예약이 좋아요).
- 공복이 필요한 검사가 있으니 안내문을 미리 확인하세요.
- 검진에서 이상 소견이 나오면 **미루지 말고 확진검사·진료로 연결**하는 것이 가장 중요해요.

## 대상 여부, 이렇게 확인하세요

- 국민건강보험공단 홈페이지 또는 **'The건강보험' 앱**에서 올해 검진 대상·항목 확인
- 대표전화 **1577-1000**
- 우편으로 오는 검진 안내문 참고

> 이 글은 일반적인 공공 건강정보예요. 검진 대상·항목·비용은 개인 상황에 따라 다를 수 있으니 국민건강보험공단의 안내를 확인하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "public-health",
  title: "무료로 받는 국가건강검진, 놓치지 마세요 — 대상·항목·확인법",
  excerpt:
    "건강보험 가입자·피부양자는 국가건강검진과 6대 암검진을 무료로 받을 수 있어요. 검진 항목, 암종별 대상·주기, 대상 여부 확인법과 놓치기 쉬운 점을 정리했습니다.",
  summary: [
    "건강보험 가입자·피부양자, 의료급여 수급자는 국가건강검진을 무료로 받을 수 있어요.",
    "일반건강검진은 보통 2년마다, 국가암검진은 암종별로 대상 연령·주기가 정해져 있어요.",
    "대상 여부·검진기관은 국민건강보험공단(1577-1000)·'The건강보험' 앱에서 확인할 수 있어요.",
    "검진 결과 이상 소견이 있으면 미루지 말고 확진검사·진료로 연결하세요.",
  ],
  body_md: body,
  tags: ["국가건강검진", "국가암검진", "건강보험", "건강검진", "공공건강정보"],
  faqs: [
    {
      q: "국가건강검진은 정말 무료인가요?",
      a: "국가에서 정한 일반건강검진과 국가암검진 항목은 대상자에게 무료로 제공돼요(암검진 일부는 소액 본인부담이 있을 수 있어요). 대상 여부와 항목은 국민건강보험공단에서 확인하세요.",
    },
    {
      q: "내가 올해 검진 대상인지 어떻게 확인하나요?",
      a: "국민건강보험공단 홈페이지나 'The건강보험' 앱, 또는 1577-1000으로 올해 검진 대상인지와 받게 되는 항목을 확인할 수 있어요. 우편으로 오는 검진 안내문도 참고하세요.",
    },
    {
      q: "검진에서 이상이 나오면 어떻게 하나요?",
      a: "'유질환 의심' 같은 결과가 나오면 미루지 말고 병·의원에서 확진검사와 진료를 받으세요. 검진은 조기 발견이 목적이라, 이후 진료로 연결하는 것이 중요합니다.",
    },
  ],
  refs: [
    { title: "국민건강보험공단", url: "https://www.nhis.or.kr" },
    { title: "국가암정보센터", url: "https://www.cancer.go.kr" },
    { title: "국가건강정보포털(질병관리청)", url: "https://health.kdca.go.kr" },
  ],
  related_departments: ["내과", "가정의학과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "건강정보 감수" },
  noindex: false,
  meta_description:
    "무료 국가건강검진·6대 암검진 안내 — 검진 항목, 암종별 대상·주기, 대상 여부 확인법(국민건강보험공단·앱)과 놓치기 쉬운 점을 공공 건강정보로 정리했습니다.",
  meta_keywords: ["국가건강검진", "국가암검진", "건강검진 대상", "건강보험공단", "공공건강정보"],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-05",
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
