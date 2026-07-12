/**
 * 홈 바로가기 타일 아이콘 — 진료과목 아이콘(gen-dept-icons-v2)과 동일한 타일·크기 규격.
 * 같은 줄에 나란히 놓이므로 규격이 어긋나면 바로 티가 난다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/gen-home-shortcut-icons.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const OUT = path.resolve("public/home");
const OBJ =
  "claymorphism / fluent-emoji 3D style, smooth matte materials with a subtle glossy highlight, soft studio lighting, medical blue and white palette with soft pastel accents, a soft contact shadow beneath. Fully transparent background — no tile, no panel, no backdrop, no floor, alpha transparent everywhere. Centered single object, no text, no logos, no words.";

const ICONS: { key: string; subject: string }[] = [
  { key: "open-now", subject: "a friendly 3D clock with a small green check badge" },
  { key: "map", subject: "a friendly 3D folded paper map with a small blue location pin on it" },
  { key: "area", subject: "a friendly 3D cluster of small rounded city buildings" },
  { key: "station", subject: "a friendly 3D subway train car seen from the front" },
];

// 진료과목 아이콘과 동일 타일 (320 프레임, 292 라운드 타일 + 그림자)
const S = 320;
const TILE = Buffer.from(
  `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3d78e8"/><stop offset="1" stop-color="#1E5BD6"/>
      </linearGradient>
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#1E5BD6" flood-opacity="0.28"/>
      </filter>
    </defs>
    <rect x="14" y="12" width="292" height="292" rx="72" fill="url(#g)" filter="url(#sh)"/>
  </svg>`,
);
const OBJ_BOX = 190;

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
      size: "1024x1024",
      quality: "high",
      background: "transparent",
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
for (const { key, subject } of ICONS) {
  console.log(`생성 중: ${key}…`);
  const raw = await gen(`${subject}. ${OBJ}`);
  const obj = await sharp(raw)
    .trim({ threshold: 8 })
    .resize(OBJ_BOX, OBJ_BOX, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  const meta = await sharp(obj).metadata();
  const webp = await sharp(TILE)
    .composite([
      {
        input: obj,
        left: Math.round((S - (meta.width ?? OBJ_BOX)) / 2),
        top: Math.round((S - (meta.height ?? OBJ_BOX)) / 2),
      },
    ])
    .webp({ quality: 90 })
    .toBuffer();
  await writeFile(path.join(OUT, `icon-${key}.webp`), webp);
  console.log(`  → public/home/icon-${key}.webp`);
}
console.log("\n완료");
