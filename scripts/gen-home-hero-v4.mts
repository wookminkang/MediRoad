/**
 * 홈 히어로 배너 v4 — 친근한 캐릭터 일러스트.
 *
 * v3(실사)는 광고 톤은 좋았지만 딱딱했다. 여기서는 마스코트 성격의 캐릭터를 세워
 * 친근하고 귀여운 브랜드 배너로 간다. 진료과목 3D 아이콘과 같은 결(둥글둥글·소프트 3D)을
 * 유지해 홈 전체가 한 세트로 보이게 한다.
 *
 * 의료광고 안전선(SEO_GEO_AIO_GUIDE §5-4):
 * 진료·시술 장면, 환자, 처치, 전후 비교는 만들지 않는다. 캐릭터가 "찾고 확인하는" 행동만.
 *
 * 텍스트는 굽지 않는다 — 한글 렌더가 깨지고 카피 수정이 불가능해진다. HTML로 얹는다.
 * 하단 1/3은 카피 자리라 비워둔다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/gen-home-hero-v4.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const OUT = path.resolve("public/home");

const COMMON =
  "Charming 3D character illustration for a mobile app hero banner, Pixar-like cute mascot style. " +
  "Soft rounded shapes, smooth matte clay-like materials, big friendly eyes, warm cheerful expression, " +
  "chibi proportions with a big head. Playful, adorable, welcoming. " +
  "Medical blue (#1E5BD6) and white palette with soft pastel accents (mint, coral, butter yellow). " +
  "Soft studio lighting, gentle contact shadows, clean simple gradient background, generous negative space. " +
  "Vertical composition: the character sits in the upper two thirds; the lower third is a calm empty " +
  "gradient area reserved for a caption. " +
  "Absolutely no text, no letters, no words, no numbers, no logos, no watermarks, no user interface. " +
  "No medical treatment, no procedures, no patients being examined, no needles, no blood.";

type Banner = { key: string; prompt: string };

const BANNERS: Banner[] = [
  {
    // 지도로 병원 찾기
    key: "hero-v4-1-map",
    prompt:
      "A cute cheerful young character standing and holding up a big rounded smartphone with both hands, " +
      "smiling brightly. A large friendly blue location pin floats above the phone. " +
      "Behind them, a tiny toy-like city of soft rounded buildings and little trees.",
  },
  {
    // 지금 문 연 병원
    key: "hero-v4-2-night",
    prompt:
      "A cute character in a cozy sweater waving happily under a calm night sky with a smiling crescent moon " +
      "and a few soft stars. Behind them, one small rounded building glows with warm friendly light, " +
      "the only lit window in a sleepy toy town. Deep blue night palette with warm amber glow.",
  },
  {
    // 진료시간 확인
    key: "hero-v4-3-time",
    prompt:
      "A cute character happily hugging an oversized round clock with a smiling face, giving a thumbs up. " +
      "A rounded calendar card and soft pastel confetti float around them. Bright, cheerful, light background.",
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
  const webp = await sharp(raw).webp({ quality: 88 }).toBuffer();
  await writeFile(path.join(OUT, `${key}.webp`), webp);
  console.log(`  → public/home/${key}.webp (${(webp.length / 1024).toFixed(0)}KB)`);
}

console.log("\n완료");
