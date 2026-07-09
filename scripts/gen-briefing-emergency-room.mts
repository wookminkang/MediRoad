/**
 * 메디브리핑(의료 이슈) — 응급실 과밀·올바른 이용법 + 썸네일(인물 없음).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-emergency-room.mts
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

const COLUMN_ID = "briefing-emergency-room";
const THUMB_TITLE = "응급실, 언제 가야 할까";
const PROMPT =
  "A clean minimal 3D render illustration about emergency room guidance. No people, no faces, no hands. A stylized red medical cross emergency sign with a subtle clock and a small directional arrow motif, arranged as a calm still-life. Medical blue palette with a red accent, soft studio lighting, smooth matte materials, lots of negative space, modern editorial 3D style, no text, no logos, subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## 응급실이 붐비면 누가 위험할까

응급실 과밀은 오래된 의료 이슈예요. 비교적 가벼운 증상(경증) 환자가 응급실로 몰리면, 정작 **1초가 급한 중증 환자의 치료가 늦어질 수 있습니다.** 그래서 "언제 응급실에 가야 하고, 언제 다른 방법을 먼저 고려할지" 아는 것이 나와 이웃 모두에게 중요해요.

## 이럴 땐 지체 없이 119·응급실 (위급 신호)

다음과 같은 증상은 **즉시** 119를 부르거나 응급실로 가야 해요.

- 의식이 흐려지거나 반응이 없는 경우
- 심한 가슴 통증, 갑작스러운 호흡곤란
- 한쪽 팔다리 마비, 말이 어눌해짐, 얼굴 비뚤어짐(뇌졸중 의심)
- 심한 출혈, 큰 외상, 골절 의심
- 갑작스러운 심한 두통, 경련, 심한 복통
- 삼킴·중독·화상 등 심각한 손상

특히 **뇌졸중·심근경색**은 시간이 생명이라 망설이지 말고 119를 부르세요.

## 이럴 땐 응급실 대신 먼저 (경증)

- 가벼운 감기·기침·콧물, 미열
- 경미한 상처·타박상
- 만성질환의 일상적인 관리

이런 경증은 **동네 병·의원, 야간·휴일 진료 병원, 달빛어린이병원(소아 야간), 야간 약국**을 먼저 고려하면 대기도 줄이고, 응급실은 위급한 분께 양보할 수 있어요.

## 문 연 병원·응급실 정보, 이렇게 확인하세요

- **응급의료포털 E-Gen** 또는 **'응급의료정보제공' 앱** — 지금 문 연 병원·약국, 응급실 혼잡도 확인
- **119** — 상황이 애매하면 전화로 상담·안내를 받을 수 있어요
- 어린이는 **달빛어린이병원**(지역별 야간·휴일 소아진료)을 함께 확인하세요

> 이 글은 일반적인 공공 건강정보예요. 증상의 위급 여부 판단이 어렵거나 급격히 나빠지면, 주저하지 말고 119·응급실을 이용하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "issue",
  title: "응급실이 붐빌 때, 언제 가야 할까 — 경증·중증 구분과 올바른 이용법",
  excerpt:
    "응급실 과밀은 중증 환자 치료를 늦출 수 있어요. 지체 없이 119·응급실이 필요한 위급 신호와, 경증일 때 먼저 고려할 방법, 문 연 병원 확인법을 공공 건강정보로 정리했습니다.",
  summary: [
    "응급실 과밀은 경증 환자가 몰리면 정작 위급한 중증 환자의 치료가 늦어지는 문제예요.",
    "의식 저하, 심한 흉통·호흡곤란, 한쪽 마비, 심한 출혈 등 위급 증상은 지체 없이 119·응급실로.",
    "가벼운 감기·경미한 상처 등 경증은 야간진료 병원·달빛어린이병원·야간약국을 먼저 고려해요.",
    "애매하면 119나 응급의료포털(E-Gen)에서 문 연 병원·응급실 혼잡도를 확인할 수 있어요.",
  ],
  body_md: body,
  tags: ["응급실", "응급의료", "119", "경증 중증", "달빛어린이병원", "의료이슈"],
  faqs: [
    {
      q: "어떤 증상이 '응급'인가요?",
      a: "의식이 흐려지거나, 심한 가슴 통증·호흡곤란, 한쪽 마비·말이 어눌해짐, 심한 출혈, 갑작스러운 심한 두통·경련 등은 즉시 119·응급실이 필요한 위급 신호예요. 특히 뇌졸중·심근경색은 시간이 생명이라 망설이지 마세요.",
    },
    {
      q: "밤에 아이가 열나면 무조건 응급실에 가야 하나요?",
      a: "아이가 잘 놀고 반응이 정상이라면 밤에는 달빛어린이병원이나 야간진료 병원을 먼저 고려할 수 있어요. 다만 의식 저하·경련·호흡곤란·심한 처짐 등이 있으면 즉시 응급실로 가세요.",
    },
    {
      q: "지금 문 연 병원·약국은 어떻게 찾나요?",
      a: "응급의료포털(E-Gen)이나 '응급의료정보제공' 앱, 또는 119 전화로 지금 문 연 병원·약국과 응급실 혼잡도를 확인할 수 있어요.",
    },
  ],
  refs: [
    { title: "중앙응급의료센터 응급의료포털(E-Gen)", url: "https://www.e-gen.or.kr" },
    { title: "국가건강정보포털(질병관리청)", url: "https://health.kdca.go.kr" },
    { title: "보건복지부", url: "https://www.mohw.go.kr" },
  ],
  related_departments: ["내과", "소아청소년과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "건강정보 감수" },
  noindex: false,
  meta_description:
    "응급실 과밀 문제와 올바른 이용법 — 119·응급실이 필요한 위급 신호, 경증일 때 먼저 고려할 방법(야간진료·달빛어린이병원), 문 연 병원·응급실 혼잡도 확인법을 공공 건강정보로 정리했습니다.",
  meta_keywords: ["응급실", "응급의료", "경증 중증", "달빛어린이병원", "119", "의료이슈"],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-07",
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
