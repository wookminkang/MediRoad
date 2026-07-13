/**
 * 홈 히어로 배너 v5 — 캐릭터 일러스트, 4:5 구도.
 *
 * v4(2:3)는 카드가 너무 길었다(540 칸에서 높이 ~700px). 그렇다고 CSS로 4:5로 잘라내면
 * 캐릭터가 카드 아래로 내려앉아 카피가 얼굴을 덮는다. 자르는 게 아니라 처음부터
 * "캐릭터는 위, 아래는 비움" 구도로 만들어야 한다.
 *
 * gpt-image-1은 4:5를 직접 못 만든다(1024x1536 / 1024x1024 / 1536x1024).
 * 그래서 1024x1536으로 뽑되 캐릭터를 상단에 몰아넣게 프롬프트하고,
 * 위에서부터 1024x1280(=4:5)만 잘라낸다. 잘리는 건 아래 빈 바닥뿐이다.
 *
 * 의료광고 안전선(§5-4): 진료·시술 장면, 환자, 처치, 전후 비교는 만들지 않는다.
 * 텍스트는 굽지 않는다 — 한글 렌더가 깨지고 카피 수정이 불가능해진다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/gen-home-hero-v5.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const OUT = path.resolve("public/home");

/** 생성 크기(2:3) → 위에서부터 잘라낼 4:5 크기 */
const GEN_W = 1024;
const GEN_H = 1536;
const CROP_H = 1280; // 1024x1280 = 4:5

/*
 * 구도가 핵심이다. "waist up"으로 크게 잡으면 캐릭터가 프레임을 꽉 채워, 4:5로 자른 뒤
 * 카피가 얼굴을 덮는다. 전신을 작게 세워야(머리가 위쪽) 카피가 몸통·발치에 얹힌다.
 */
const COMMON =
  "Charming 3D character illustration for a mobile app hero banner, Pixar-like cute mascot style. " +
  "Soft rounded shapes, smooth matte clay-like materials, big friendly eyes, warm cheerful expression, " +
  "chibi proportions with a big head. Playful, adorable, welcoming. " +
  "Medical blue (#1E5BD6) and white palette with soft pastel accents (mint, coral, butter yellow). " +
  "Soft studio lighting, gentle contact shadows, clean simple gradient background. " +
  "COMPOSITION: full body, standing, small in frame with generous space around. " +
  "The head is near the TOP of the image; the whole character fits within the upper two thirds. " +
  "Wide, airy, plenty of empty background. " +
  "Absolutely no text, no letters, no words, no numbers, no logos, no watermarks, no user interface. " +
  "No medical treatment, no procedures, no patients being examined, no needles, no blood.";

type Banner = { key: string; prompt: string };

const BANNERS: Banner[] = [
  {
    key: "hero-v6-1-map",
    prompt:
      "A cute cheerful character standing and holding up a big rounded smartphone with both hands, " +
      "smiling brightly. A large friendly blue location pin floats above the phone. " +
      "Behind them, a tiny toy-like city of soft rounded buildings and little trees.",
  },
  {
    key: "hero-v6-2-night",
    prompt:
      "A cute character in a cozy sweater standing and waving happily under a calm night sky with a " +
      "smiling crescent moon and a few soft stars. Behind them, one small rounded building glows with " +
      "warm friendly light, the only lit window in a sleepy toy town. Deep blue night palette.",
  },
  {
    key: "hero-v6-3-time",
    prompt:
      "A cute character standing and happily hugging an oversized round clock with a smiling face, " +
      "giving a thumbs up. A rounded calendar card and soft pastel confetti float around them. " +
      "Bright, cheerful, light background.",
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
      size: `${GEN_W}x${GEN_H}`,
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
  // 위에서부터 4:5만 — 잘려나가는 건 아래 빈 바닥뿐이다
  const webp = await sharp(raw)
    .extract({ left: 0, top: 0, width: GEN_W, height: CROP_H })
    .webp({ quality: 88 })
    .toBuffer();
  await writeFile(path.join(OUT, `${key}.webp`), webp);
  console.log(
    `  → public/home/${key}.webp (${GEN_W}x${CROP_H}, ${(webp.length / 1024).toFixed(0)}KB)`,
  );
}

console.log("\n완료");
