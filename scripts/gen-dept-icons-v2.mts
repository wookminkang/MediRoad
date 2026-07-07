/**
 * 진료과목 3D 아이콘 v2 — 오브젝트(투명) 생성 후 '동일 타일 + 동일 크기'로 합성.
 * 크기 완전 통일. 실행: node --env-file=.env.local --import tsx scripts/gen-dept-icons-v2.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const OUT = path.resolve("public/dept3d");
const OBJ =
  "claymorphism / fluent-emoji 3D style, smooth matte materials with a subtle glossy highlight, soft studio lighting, medical blue and white palette with soft pastel accents, a soft contact shadow beneath. Fully transparent background — no tile, no panel, no backdrop, no floor, alpha transparent everywhere. Centered single object, no text, no logos, no words.";

const ICONS: { key: string; subject: string }[] = [
  { key: "내과", subject: "a friendly 3D stethoscope with a gentle smiling face" },
  { key: "소아청소년과", subject: "a cute friendly 3D teddy bear with a gentle smile" },
  { key: "치과", subject: "a friendly 3D clean white tooth with a tiny sparkle and a smile" },
  { key: "피부과", subject: "a friendly 3D skincare cream bottle with a soft water droplet" },
  { key: "이비인후과", subject: "a friendly rounded 3D human ear" },
  { key: "안과", subject: "a friendly cute 3D eye with a soft sparkle" },
  { key: "정신건강의학과", subject: "a friendly soft 3D brain with a tiny red heart" },
  { key: "한방", subject: "a friendly 3D mortar and pestle with a small green herbal leaf" },
];

// 동일 타일 (320 프레임, 292 라운드 타일 + 그림자)
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
const OBJ_BOX = 190; // 오브젝트 최장변 목표(px) — 전 아이콘 동일

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
  // 투명 오브젝트: 여백 트림 → 최장변 OBJ_BOX로 통일 → 타일 중앙 합성
  const obj = await sharp(raw)
    .trim({ threshold: 8 })
    .resize(OBJ_BOX, OBJ_BOX, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const webp = await sharp(TILE)
    .composite([{ input: obj, gravity: "center" }])
    .webp({ quality: 90 })
    .toBuffer();
  await writeFile(path.join(OUT, `${key}.webp`), webp);
  console.log(`  ✅ public/dept3d/${key}.webp`);
}
console.log("완료 — 동일 타일 + 동일 크기 8개");
