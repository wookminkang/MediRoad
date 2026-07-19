/**
 * 메디브리핑(의료 정책·제도) — 상병수당 시범사업 개요·이용법 + 썸네일(인물 없음).
 * 실행: node --env-file=.env.local --import tsx scripts/gen-briefing-sick-leave-benefit.mts
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

const COLUMN_ID = "briefing-sick-leave-benefit";
const THUMB_TITLE = "아파서 쉴 때, 상병수당";
const PROMPT =
  "A clean minimal 3D render illustration about a sickness benefit / paid sick leave support program. A stylized calendar with a small medical cross and a resting bed icon, next to a simple coin/won-symbol stack suggesting income support, arranged as a calm still-life. Medical blue palette with a soft green accent, smooth matte materials, soft studio lighting, lots of negative space, modern editorial 3D style. No people, no faces, no hands, no text, no logos. Subject in the upper-center, lower third kept simple and uncluttered.";

const body = `## 상병수당이란 무엇인가요

상병수당은 **업무와 관계없는 질병·부상으로 일하기 어려운 기간 동안 소득의 일부를 지원**하는 제도예요. '아프면 쉴 수 있는 사회'를 위해 마련된 것으로, 근로자가 치료에 집중할 수 있도록 돕는 것이 목적입니다. 우리나라에서는 **시범사업 형태로 일부 지역에서 운영**되고 있으며, 대상·금액·기간 등 세부 기준은 시기와 지역에 따라 달라질 수 있어요.

## 산업재해와는 무엇이 다른가요

- **산업재해(산재)**: 일하다가(업무상) 다치거나 병이 생긴 경우를 보상해요.
- **상병수당**: 반대로 **업무와 관계없이** 생긴 질병·부상으로 일을 못 할 때를 지원해요.

즉 감기·골절·수술 회복처럼 업무와 무관한 이유로 쉬어야 할 때가 상병수당의 영역이에요.

## 어떻게 이용하나요

1. 자신이 사는 지역이 **시범사업 대상 지역**인지 확인해요.
2. 질병·부상으로 일하기 어렵다는 **의료기관의 진단·진료 확인**을 받아요.
3. 국민건강보험공단 등 **운영 기관에 신청**해요.
4. 심사를 거쳐 정해진 **대기기간 이후**부터 지원금이 지급돼요.

지원 금액과 최대 지급 기간, 대기기간은 시범사업 모형에 따라 다르게 운영돼요.

## 알아두면 좋은 점

- 상병수당은 **치료비(진료비)를 대신 내주는 제도가 아니라, 쉬는 동안의 소득을 일부 보전**하는 제도예요.
- 신청에는 진단서·근로 중단 확인 등 **증빙 서류**가 필요할 수 있어요.
- 시범사업은 지역·대상·조건이 계속 조정되고 있어, 신청 전 **최신 기준 확인**이 중요해요.
- 근로 형태(직장가입자·자영업자 등)에 따라 적용이 달라질 수 있어요.

> 이 글은 일반적인 공공 정보예요. 상병수당은 시범사업으로 대상 지역·금액·기간이 바뀔 수 있으니, 신청 전 보건복지부·국민건강보험공단 등 공식 안내에서 최신 기준을 확인하세요.`;

const post = {
  id: COLUMN_ID,
  kind: "briefing",
  category: "policy",
  title: "상병수당, 아파서 쉬는 동안의 소득 지원 — 대상·신청·주의점 정리",
  excerpt:
    "상병수당은 업무와 무관한 질병·부상으로 일하기 어려운 기간의 소득을 일부 지원하는 제도예요. 현재 시범사업으로 운영되며, 대상·신청 방법·산재와의 차이를 공공 정보로 정리했습니다.",
  summary: [
    "상병수당은 업무 외 질병·부상으로 일을 못 하는 기간의 소득을 일부 보전하는 제도예요.",
    "치료비를 대신 내주는 게 아니라, 쉬는 동안의 소득을 지원한다는 점이 핵심이에요.",
    "현재 일부 지역에서 시범사업으로 운영되며, 대상 지역·금액·대기기간은 모형에 따라 달라요.",
    "신청 전 거주 지역이 대상인지와 최신 기준을 공식 안내에서 확인하는 것이 중요해요.",
  ],
  body_md: body,
  tags: ["상병수당", "의료정책", "소득지원", "건강보험", "시범사업"],
  faqs: [
    {
      q: "상병수당은 전국 어디서나 받을 수 있나요?",
      a: "아직 전국이 아니라 일부 시범사업 지역에서 운영돼요. 거주 지역이 대상인지 국민건강보험공단 등 공식 안내에서 먼저 확인하세요.",
    },
    {
      q: "치료비도 상병수당으로 지원되나요?",
      a: "상병수당은 진료비를 대신 내주는 제도가 아니라, 일을 못 하는 기간의 소득을 일부 보전하는 제도예요. 진료비 부담 경감은 본인부담상한제 등 다른 제도를 참고하세요.",
    },
    {
      q: "산재보험과 같이 받을 수 있나요?",
      a: "산재는 업무상 질병·부상을, 상병수당은 업무와 무관한 경우를 대상으로 해요. 적용 요건이 달라, 자세한 중복 여부는 운영 기관에 문의하는 것이 정확해요.",
    },
  ],
  refs: [
    { title: "보건복지부", url: "https://www.mohw.go.kr" },
    { title: "국민건강보험공단", url: "https://www.nhis.or.kr" },
    { title: "국가법령정보센터", url: "https://www.law.go.kr" },
  ],
  related_departments: ["내과", "가정의학과"],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "의료정책 감수" },
  noindex: false,
  meta_description:
    "상병수당 시범사업 개요 — 업무 외 질병·부상으로 쉬는 동안의 소득 지원, 산재와의 차이, 신청 절차와 주의점을 공공 정보로 정리했습니다. 대상 지역·금액·기간은 정책에 따라 변동될 수 있습니다.",
  meta_keywords: ["상병수당", "상병수당 시범사업", "소득 지원", "건강보험", "의료정책"],
  status: "published",
  reading_minutes: 4,
  published_at: "2026-07-17",
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
