/**
 * 홈 배너 생성 — 히어로 캐러셀(세로형) + 프로모 캐러셀(가로형).
 *
 * 합성(타일 오버레이) 없이 배너 한 장을 통째로 생성한다. 카피는 굽지 않는다 —
 * 이미지에 구운 한글은 렌더가 깨지고, 나중에 문구를 못 고친다. 텍스트는 HTML로 얹는다.
 *
 * 카피·비주얼은 의료광고 안전선(SEO_GEO_AIO_GUIDE §5-4)을 따른다:
 * 효과·완치·최고를 암시하는 장면(전후 비교, 시술 장면, 환자 치료 장면)은 만들지 않는다.
 * 정보 서비스답게 "찾기·지도·시간 확인" 같은 사실 중심 장면만 쓴다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/gen-home-banners.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const OUT = path.resolve("public/home");

/** 전 배너 공통 — 브랜드(메디컬 블루) 톤과 결을 맞춘다. 텍스트 금지. */
const COMMON =
  "High-end mobile app promotional banner, premium editorial commercial photography style. " +
  "Clean, airy, bright. Medical blue (#1E5BD6) and white palette with soft pastel accents. " +
  "Soft studio lighting, gentle gradients, subtle depth of field. " +
  "Absolutely no text, no letters, no words, no numbers, no logos, no watermarks, no UI chrome. " +
  "No patients being treated, no medical procedures, no before/after comparison, no blood, no needles. " +
  "Leave the lower third visually calm and uncluttered so a caption can be overlaid on top.";

type Banner = { key: string; size: "1024x1536" | "1536x1024"; prompt: string };

const BANNERS: Banner[] = [
  // ── 히어로 (세로형, 카드 캐러셀) ──
  {
    key: "hero-1-map",
    size: "1024x1536",
    prompt:
      "A softly glowing 3D city map diorama floating in a bright sky-blue space, " +
      "with clean rounded blue location pins rising above the streets and a few white 3D building blocks. " +
      "Claymorphism / soft 3D render, glossy matte materials, playful and friendly.",
  },
  {
    key: "hero-2-night",
    size: "1024x1536",
    prompt:
      "A calm evening city skyline in deep blue twilight, seen from a distance, " +
      "with a few warmly lit windows glowing softly and a soft crescent moon. " +
      "One clean glowing blue location pin floats gently above the skyline. " +
      "Serene, reassuring, cinematic. Conveys 'open at night' without showing any hospital interior.",
  },
  {
    key: "hero-3-time",
    size: "1024x1536",
    prompt:
      "A friendly oversized 3D clock and a rounded calendar card floating together on a clean gradient " +
      "of white and light medical blue, with soft pastel confetti shapes. " +
      "Claymorphism / soft 3D render, smooth matte surfaces, cheerful and light.",
  },

  // ── 프로모 (가로형, 하단 배너 캐러셀) ──
  {
    key: "promo-1-briefing",
    size: "1536x1024",
    prompt:
      "Soft 3D render of floating rounded newspaper and document cards with abstract gray line placeholders " +
      "instead of readable text, arranged on the right side over a light blue-to-white gradient. " +
      "The left half is clean empty gradient space. Calm, editorial, informative mood.",
  },
  {
    key: "promo-2-health",
    size: "1536x1024",
    prompt:
      "Soft 3D render of a friendly heart shape, a water droplet and a green leaf floating together " +
      "on the right side over a light mint-and-white gradient. The left half is clean empty gradient space. " +
      "Fresh, gentle, wellness mood. Claymorphism, smooth matte materials.",
  },
];

async function gen(prompt: string, size: Banner["size"]): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
      prompt,
      size,
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

for (const { key, size, prompt } of BANNERS) {
  console.log(`생성 중: ${key} (${size})…`);
  const raw = await gen(`${prompt} ${COMMON}`, size);
  // webp — 배너는 화면을 가득 채우므로 png 그대로 두면 수 MB가 된다
  const webp = await sharp(raw).webp({ quality: 82 }).toBuffer();
  await writeFile(path.join(OUT, `${key}.webp`), webp);
  console.log(`  → public/home/${key}.webp (${(webp.length / 1024).toFixed(0)}KB)`);
}

console.log("\n완료");
