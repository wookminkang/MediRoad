/**
 * 진료과목 3D 아이콘 샘플 생성(내과·치과) → public/dept3d/*.webp
 * 실행: node --env-file=.env.local --import tsx scripts/gen-dept-icons-sample.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const OUT = path.resolve("public/dept3d");
const STYLE =
  "Soft rounded 3D rendered app icon, claymorphism / fluent-emoji style, smooth matte materials with a subtle glossy highlight, soft studio lighting and gentle drop shadow, medical blue (#1E5BD6) and white palette with soft pastel accents, centered subject on a soft light blue rounded-square gradient background, modern premium 3D icon, no text, no logos, no words.";

const ICONS: { key: string; subject: string }[] = [
  { key: "내과", subject: "a friendly 3D stethoscope" },
  { key: "치과", subject: "a friendly 3D clean white tooth with a tiny sparkle" },
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
      size: "1024x1024",
      quality: "high",
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
  const raw = await gen(`${subject}. ${STYLE}`);
  const webp = await sharp(raw).resize(320, 320).webp({ quality: 90 }).toBuffer();
  await writeFile(path.join(OUT, `${key}.webp`), webp);
  console.log(`  ✅ public/dept3d/${key}.webp`);
}
console.log("완료 — 스타일 확인 후 나머지 6개 생성 예정");
