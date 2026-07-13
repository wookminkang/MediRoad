/**
 * 홈 히어로 배너 v7 — 가로형 실사 라이프스타일 배너 5장. (강남언니 홈 배너 구조)
 *
 * 지금까지의 캐릭터 일러스트는 유치했다. 여기서는 실제 앱 배너처럼 인물 사진을 쓴다.
 *
 * 구도 규칙 — 카피는 이미지에 굽지 않고 HTML로 얹으므로, 얹힐 자리를 비워야 한다:
 *  - 인물은 프레임 오른쪽. 왼쪽·좌하단은 조용한 배경(글자가 얼굴 위에 얹히면 안 된다)
 *  - 좌상단도 배지(알약)가 들어가므로 디테일을 두지 않는다
 *
 * 의료광고 안전선(SEO_GEO_AIO_GUIDE §5-4):
 * 시술·치료 장면, 처치, 전후 비교, 진료실은 만들지 않는다. 일상에서 "찾고 확인하는" 장면만.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/gen-home-hero-v7.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const OUT = path.resolve("public/home");

const COMMON =
  "Premium mobile app hero banner, high-end lifestyle commercial photography. Photorealistic, editorial, " +
  "shot on a full-frame camera with a fast prime lens, shallow depth of field, creamy bokeh, " +
  "natural light, clean modern color grade, glossy magazine finish. " +
  "A single Korean woman in her late twenties, natural everyday makeup, relaxed and genuinely happy. " +
  "HORIZONTAL composition: the subject is placed on the RIGHT side of the frame. " +
  "The LEFT third and the BOTTOM-LEFT corner are calm, simple, uncluttered background " +
  "(smooth wall, sky, or soft bokeh) — reserved for a caption. The TOP-LEFT corner is also kept plain. " +
  "Absolutely no text, no letters, no words, no numbers, no logos, no watermarks, no user interface. " +
  "No medical treatment, no procedures, no clinic interiors, no medical equipment, no doctors, " +
  "no before/after comparison.";

type Banner = { key: string; prompt: string };

const BANNERS: Banner[] = [
  {
    // 지도로 병원 찾기
    key: "hero-v7-1-map",
    prompt:
      "She stands on a bright sunlit city sidewalk, smiling as she glances down at the smartphone in her " +
      "hand. Glass buildings and street trees melt into soft bokeh behind her. Warm morning light, airy and fresh.",
  },
  {
    // 지금 문 연 병원 (야간·주말)
    key: "hero-v7-2-night",
    prompt:
      "She walks through a calm city street in the evening, softly lit by warm storefront lights that blur " +
      "into deep amber bokeh. Cool blue twilight sky. Calm, safe, reassuring nighttime mood.",
  },
  {
    // 진료시간 확인
    key: "hero-v7-3-time",
    prompt:
      "She sits by a bright cafe window, checking the time on her wrist watch with a relaxed smile, " +
      "a coffee cup on the table. Clean minimal interior, soft daylight, plenty of empty wall on the left.",
  },
  {
    // 지역·역세권으로 찾기
    key: "hero-v7-4-area",
    prompt:
      "She stands on a quiet neighborhood street lined with low buildings and green trees, looking ahead " +
      "with a soft confident smile, a tote bag on her shoulder. Clear sky fills the left side of the frame.",
  },
  {
    // 건강정보
    key: "hero-v7-5-health",
    prompt:
      "She relaxes on a sofa at home in a bright minimal living room, reading on her phone with a calm " +
      "gentle smile, a green plant nearby. Plain white wall fills the left side. Warm, cozy, wellness mood.",
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
      size: "1536x1024", // 3:2 가로 — 카드 비율과 일치시킨다
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
  const webp = await sharp(raw).webp({ quality: 88 }).toBuffer();
  await writeFile(path.join(OUT, `${key}.webp`), webp);
  console.log(`  → public/home/${key}.webp (${(webp.length / 1024).toFixed(0)}KB)`);
}

console.log("\n완료");
