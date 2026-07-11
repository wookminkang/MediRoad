/**
 * 메디브리핑(공공 건강정보) — 휴가철 해외여행 건강 준비 + 썸네일(인물 없음).
 * 베이스 이미지는 content/columns/images/briefing-travel-health-base.png 를 재사용한다.
 * (없으면 PROMPT로 새로 생성)
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-travel-health.mts
 */
import { readFile } from "node:fs/promises";
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

const COLUMN_ID = "briefing-travel-health";
const THUMB_TITLE = "휴가 전,\n이건 챙기셨나요";
const BASE_IMAGE = path.resolve(`content/columns/images/${COLUMN_ID}-base.png`);
const PROMPT =
  "A clean minimal 3D render still-life about travel health preparation. A stylized passport, a small pill organizer with a few capsules, a compact first-aid pouch with a medical cross, a bottle of insect repellent and a tiny airplane motif, arranged as a calm flat-lay composition. Medical blue palette with a warm summer accent, smooth matte materials, soft studio lighting, lots of negative space, modern editorial 3D style. No people, no faces, no hands, no text, no logos. Subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## 휴가철, 준비물에 '건강'도 넣으세요

해외여행은 국내와 감염병 환경이 다른 곳으로 이동하는 일이에요. 여행지에 따라 국내에서는 보기 어려운 **모기매개 감염병**이나 **물·음식으로 옮는 질환**의 위험이 있고, 나라에 따라 입국 시 예방접종 증명서를 요구하기도 해요. 출발 직전보다 **여유 있게 미리 준비**하는 것이 핵심입니다.

## 예방접종은 출국 4~6주 전에 상담하세요

백신은 맞은 뒤 몸에서 면역이 생기기까지 시간이 걸리고, 종류에 따라 여러 번 나눠 맞아야 하는 경우도 있어요. 그래서 **출국 4~6주 전** 상담이 권장돼요.

- 여행지·체류 기간·활동(도시 관광인지 농촌·장기 체류인지)에 따라 필요한 접종이 달라져요.
- 일부 국가는 입국 조건으로 **황열 예방접종 증명서**를 요구할 수 있어요.
- 말라리아 위험 지역이라면 예방약 복용을 상담받을 수 있어요. 처방과 복용법은 의료진의 판단이 필요해요.
- 어떤 접종이 필요한지는 사람마다 다르므로, 여행지 정보를 가지고 의료기관에서 상담받는 것이 정확합니다.

## 모기·물·음식이 가장 흔한 위험이에요

여행지에서 흔한 건강 문제는 대개 화려한 질환이 아니라 **모기와 먹는 것**에서 시작돼요.

- **모기매개 감염병**(뎅기열·말라리아·지카 등): 예방백신이 없는 경우도 많아, 물리지 않는 것이 최선이에요. 긴소매·긴바지, 모기기피제, 모기장·방충망을 활용하세요.
- **여행자 설사·장염**: 끓인 물이나 밀봉된 생수를 마시고, 익히지 않은 음식과 껍질 벗기지 않은 과일, 얼음은 주의하세요.
- **손 위생**: 식사 전과 화장실 이용 후 손 씻기는 가장 기본적이면서 효과적인 예방법이에요.

## 상비약과 여행자보험도 함께

- 평소 복용하는 약은 **여행 기간보다 넉넉히**, 처방전이나 영문 약품명을 함께 챙기세요. 기내 반입 시 원래 용기에 담아 두는 것이 좋아요.
- 해열진통제, 지사제, 소독약·밴드, 멀미약, 모기기피제, 자외선차단제 정도가 기본 구성이에요.
- 여행자보험의 **의료비 보장 범위**를 미리 확인해 두면 현지에서 진료가 필요할 때 도움이 돼요.
- 나라별로 **반입이 제한되는 의약품**이 있을 수 있으니, 장기 복용약이 있다면 사전에 확인하세요.

## 귀국 후 발열이 있다면 꼭 알리세요

감염병은 잠복기가 있어 **귀국 후에 증상이 나타나는 경우**가 많아요. 여행에서 돌아온 뒤 발열·오한·설사·발진 등이 생기면 스스로 판단하지 말고 진료를 받으세요.

이때 **"언제, 어느 나라에 다녀왔는지"를 반드시 의료진에게 알리는 것**이 중요해요. 해외 여행력은 진단의 방향을 크게 바꾸는 정보이기 때문입니다. 입국 시 검역 단계에서 증상이 있다면 검역관에게 신고하고, 이후 궁금한 점은 질병관리청 콜센터(1339)로 문의할 수 있어요.

> 이 글은 일반적인 공공 정보예요. 여행지별 감염병 위험과 필요한 예방접종·입국 요건은 시기와 국가에 따라 달라지므로, 출발 전 질병관리청 해외감염병NOW와 외교부 해외안전여행 등 공식 안내에서 최신 정보를 확인하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "public-health",
  title: "휴가철 해외여행 전 건강 준비, 예방접종·모기매개 감염병·상비약 체크",
  excerpt:
    "해외여행은 감염병 환경이 다른 곳으로 이동하는 일이에요. 출국 4~6주 전 예방접종 상담부터 모기·물·음식 주의사항, 상비약과 귀국 후 발열 대처까지 공공 정보로 정리했습니다.",
  summary: [
    "여행지에 따라 필요한 예방접종이 다르므로, 출국 4~6주 전에 의료기관에서 상담받는 것이 권장돼요.",
    "여행지에서 흔한 위험은 모기매개 감염병과 물·음식으로 옮는 설사 질환이에요. 물리지 않기와 끓인 물·익힌 음식이 기본입니다.",
    "복용 중인 약은 넉넉히 챙기고, 여행자보험의 의료비 보장 범위를 미리 확인하세요.",
    "귀국 후 발열·설사·발진이 생기면 진료 시 '언제 어느 나라에 다녀왔는지'를 반드시 알려야 해요.",
  ],
  body_md: body,
  tags: ["해외여행", "예방접종", "뎅기열", "여행자설사", "감염병예방"],
  faqs: [
    {
      q: "출국이 일주일도 안 남았는데 지금이라도 예방접종을 받을 수 있나요?",
      a: "가능한 경우도 있지만 백신에 따라 면역이 생기는 데 시간이 걸리고 여러 차례 접종이 필요할 수 있어, 효과가 충분하지 않을 수 있어요. 남은 기간에 맞는 최선의 방법은 의료기관 상담으로 확인하는 것이 정확합니다.",
    },
    {
      q: "모기매개 감염병은 백신으로 예방할 수 있나요?",
      a: "질환에 따라 달라요. 예방백신이 없는 경우도 많아 모기에 물리지 않는 것이 가장 확실한 예방법이에요. 긴소매·긴바지, 모기기피제, 모기장을 함께 활용하세요.",
    },
    {
      q: "여행에서 돌아온 뒤 며칠 지나 열이 나는데 여행과 관련이 있을까요?",
      a: "감염병은 잠복기가 있어 귀국 후에 증상이 나타나는 경우가 있어요. 발열·오한·설사·발진 등이 생기면 진료를 받고, 다녀온 국가와 시기를 의료진에게 반드시 알려 주세요.",
    },
  ],
  refs: [
    { title: "질병관리청 해외감염병NOW", url: "https://www.kdca.go.kr" },
    { title: "국가건강정보포털(질병관리청)", url: "https://health.kdca.go.kr" },
    { title: "외교부 해외안전여행", url: "https://www.0404.go.kr" },
  ],
  related_departments: ["내과", "가정의학과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "공공 건강정보 감수" },
  noindex: false,
  meta_description:
    "휴가철 해외여행 건강 준비 — 출국 4~6주 전 예방접종 상담, 모기매개 감염병과 여행자 설사 예방, 상비약·여행자보험 체크, 귀국 후 발열 시 여행력 알리기까지 공공 정보로 정리했습니다.",
  meta_keywords: [
    "해외여행 예방접종",
    "여행자 감염병",
    "뎅기열 예방",
    "여행 상비약",
    "해외여행 건강",
  ],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-11",
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
  // 크기는 "가장 긴 줄" 기준 — 줄바꿈은 title의 \n으로 지정(ingest-columns.mts와 동일 규칙)
  const longest = Math.max(...title.split("\n").map((l) => l.replace(/\s/g, "").length));
  const dpi = longest <= 8 ? 560 : longest <= 11 ? 470 : 400;
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

const baseImg = await readFile(BASE_IMAGE).catch(async () => {
  console.log("베이스 이미지 없음 → 새로 생성합니다…");
  return generateImage(PROMPT);
});
console.log("타이틀·로고 합성 중…");
const composed = await composeThumbnail(baseImg, THUMB_TITLE);
const key = `${COLUMN_ID}/thumb.webp`;
const up = await sb.storage.from(BUCKET).upload(key, composed, { contentType: "image/webp", upsert: true });
if (up.error) throw up.error;
const thumbnail = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;

const { error } = await sb.from("columns").upsert({ ...post, thumbnail }, { onConflict: "id" });
if (error) throw error;
console.log("✅ 메디브리핑 저장 완료:", COLUMN_ID, "\n   URL: /briefing/" + COLUMN_ID);
