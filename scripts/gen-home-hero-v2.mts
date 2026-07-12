/**
 * 홈 히어로 배너 v2 — 실사 광고 키비주얼.
 *
 * v1은 클레이 3D(일러스트)라 "AI가 만든 아이콘" 느낌이 났다. 여기서는 브랜드 캠페인 키비주얼처럼
 * 실사 상업사진 톤으로 간다. 화려하되 정보 서비스답게, 진료 장면은 절대 넣지 않는다.
 *
 * 의료광고 안전선(SEO_GEO_AIO_GUIDE §5-4):
 * 시술·치료 장면, 환자, 의료진의 처치, 전후 비교, 병원 내부 진료실은 만들지 않는다.
 * "찾는다·확인한다"는 정보 행위와 도시·시간이라는 중립적 소재만 쓴다.
 *
 * 텍스트는 굽지 않는다 — 한글 렌더가 깨지고 카피 수정이 불가능해진다. HTML로 얹는다.
 * 하단 40%는 카피 자리라 시각적으로 비워둔다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/gen-home-hero-v2.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const OUT = path.resolve("public/home");

const COMMON =
  "Premium advertising key visual for a national brand campaign, high-end commercial photography. " +
  "Photorealistic, cinematic, editorial quality, shot on a full-frame camera with a fast prime lens, " +
  "shallow depth of field, rich bokeh, immaculate lighting, glossy and vivid, color-graded. " +
  "Cool medical blue and clean white color grade with luminous highlights. Vertical composition. " +
  "The subject sits in the upper two thirds; the lower third is a calm, smooth, uncluttered area " +
  "(soft gradient or gentle blur) reserved for a caption. " +
  "Absolutely no text, no letters, no words, no numbers, no signage copy, no logos, no watermarks, " +
  "no user interface, no app screenshots. " +
  "No patients, no doctors, no medical treatment, no procedures, no clinic interiors, no medical equipment.";

type Banner = { key: string; prompt: string };

const BANNERS: Banner[] = [
  {
    // 지도로 병원 찾기 — 화면 글로우는 '은은한 그라데이션'으로. 빛 폭발은 AI티가 난다.
    key: "hero-v3-1-map",
    prompt:
      "A young woman walking through a bright sunlit city street, smiling and glancing down at the " +
      "smartphone in her hand. Glass office towers and green trees in creamy bokeh behind her. " +
      "The phone screen is a calm, even, soft blue gradient glow — no burst, no rays, no interface, no text. " +
      "Golden hour backlight, gentle lens flare, vivid and joyful, premium lifestyle brand campaign.",
  },
  {
    // 지금 문 연 병원
    key: "hero-v3-2-night",
    prompt:
      "A cinematic city street at blue hour after rain, wet asphalt reflecting warm amber and cool blue " +
      "lights. Storefront lights glow in deep bokeh, completely unreadable and abstract. Calm, safe, " +
      "reassuring nighttime mood. Rich contrast, moody cinematic color grade, premium campaign photography.",
  },
  {
    // 진료시간 확인 — 정물은 밋밋하고 하단이 밝아 카피가 안 읽혔다. 인물 + 짙은 배경으로.
    key: "hero-v3-3-time",
    prompt:
      "A stylish young man checking the watch on his wrist while standing on a vibrant city sidewalk, " +
      "shot from the chest up at a slight angle. Behind him, a richly colored evening street glows in deep " +
      "bokeh — teal, magenta and amber light orbs. Confident, energetic, fashion-editorial mood. " +
      "Deep saturated colors, dramatic rim light, glossy magazine-cover finish. " +
      "The lower part of the frame falls into rich dark shadow.",
  },
];

async function gen(prompt: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
      prompt,
      size: "1024x1536",
      quality: "high",
      output_format: "png",
      n: 1,
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const json = await res.json();
  const it = json.data?.[0];
  if (it?.b64_json) return Buffer.from(it.b64_json, "base64");
  return Buffer.from(await (await fetch(it.url)).arrayBuffer());
}

await mkdir(OUT, { recursive: true });

for (const { key, prompt } of BANNERS) {
  console.log(`생성 중: ${key}…`);
  const raw = await gen(`${prompt} ${COMMON}`);
  // 실사 사진은 디테일이 많아 품질을 v1(82)보다 올린다
  const webp = await sharp(raw).webp({ quality: 88 }).toBuffer();
  await writeFile(path.join(OUT, `${key}.webp`), webp);
  console.log(`  → public/home/${key}.webp (${(webp.length / 1024).toFixed(0)}KB)`);
}

console.log("\n완료");
