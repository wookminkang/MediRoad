/**
 * 타일 아이콘 중앙 정렬 교정 — 아트는 그대로 두고 위치만 옮긴다.
 *
 * 문제: 오브젝트를 '바운딩 박스' 기준으로 중앙에 놓으면, 청진기 튜브·치아 반짝이처럼
 * 한쪽으로 삐져나온 부분이 박스를 늘려 실제 덩어리는 치우쳐 보인다.
 *
 * 해법: 배경이 우리가 그린 균일한 세로 그라데이션 타일이므로, 같은 타일을 다시 그려
 * 픽셀 차이로 오브젝트만 뽑아낸다. 그림자(타일보다 어두워지기만 한 픽셀)는 제외하고
 * '밝은 오브젝트'의 박스를 구해 그 중심을 타일 중심에 맞춘다.
 *
 * 재생성이 아니라 재배치라 그림이 바뀌지 않는다.
 *
 * 실행: node --import tsx scripts/fix-icon-centering.mts
 */
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const S = 320;
const TILE_SVG = Buffer.from(
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

/** 타일 모서리·그림자의 안티에일리어싱을 오브젝트로 오인하지 않도록 안쪽만 본다 */
const INSET = 34;
/** 타일과 이 정도 이상 달라야 오브젝트로 본다 */
const DIST = 34;

const targets: { file: string }[] = [];
for (const dir of ["public/dept3d", "public/home"]) {
  for (const f of await readdir(path.resolve(dir))) {
    // 배너(hero-*, promo-*)는 타일이 아니다
    if (!f.endsWith(".webp")) continue;
    if (f.startsWith("hero-") || f.startsWith("promo-")) continue;
    targets.push({ file: path.join(dir, f) });
  }
}

const tileRaw = await sharp(TILE_SVG)
  .resize(S, S)
  .removeAlpha()
  .raw()
  .toBuffer();

for (const { file } of targets) {
  const src = sharp(path.resolve(file)).resize(S, S);
  const { data, info } = await src.removeAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const c = info.channels; // 3

  // 오브젝트 마스크 — 타일과 다르고, '단순히 어두워지기만 한 픽셀'(그림자)은 뺀다
  const mask = new Uint8Array(S * S);
  let minX = S,
    maxX = -1,
    minY = S,
    maxY = -1;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * c;
      const dr = data[i] - tileRaw[i];
      const dg = data[i + 1] - tileRaw[i + 1];
      const db = data[i + 2] - tileRaw[i + 2];
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist <= DIST) continue;

      // 안쪽만 옮긴다. 타일의 둥근 모서리·바깥 그림자도 '타일과 다른 픽셀'이라
      // 마스크에 걸리는데, 이것까지 같이 옮기면 모서리에 이중 자국이 남는다.
      const inside =
        x >= INSET && x < S - INSET && y >= INSET && y < S - INSET;
      if (!inside) continue;

      mask[y * S + x] = 1; // 옮길 대상(오브젝트 + 그 아래 그림자)

      const isShadow = dr < 0 && dg < 0 && db < 0; // 전 채널이 어두워짐 = 그림자
      if (isShadow) continue;

      // 중심 계산은 '밝은 오브젝트'만 — 그림자는 박스를 아래로 늘린다
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) {
    console.log(`건너뜀(오브젝트 미검출): ${file}`);
    continue;
  }

  const dx = Math.round(S / 2 - (minX + maxX) / 2);
  const dy = Math.round(S / 2 - (minY + maxY) / 2);

  if (dx === 0 && dy === 0) {
    console.log(`이미 정렬됨: ${path.basename(file)}`);
    continue;
  }

  // 오브젝트만 알파로 뽑아 → 깨끗한 타일 위에 dx,dy 만큼 옮겨 다시 합성
  const objRGBA = Buffer.alloc(S * S * 4);
  for (let p = 0; p < S * S; p++) {
    if (!mask[p]) continue;
    objRGBA[p * 4] = data[p * c];
    objRGBA[p * 4 + 1] = data[p * c + 1];
    objRGBA[p * 4 + 2] = data[p * c + 2];
    objRGBA[p * 4 + 3] = 255;
  }

  const obj = await sharp(objRGBA, {
    raw: { width: S, height: S, channels: 4 },
  })
    .png()
    .toBuffer();

  const out = await sharp(TILE_SVG)
    .resize(S, S)
    .composite([{ input: obj, left: dx, top: dy }])
    .webp({ quality: 90 })
    .toBuffer();

  await writeFile(path.resolve(file), out);
  console.log(
    `교정: ${path.basename(file).padEnd(24)} dx=${String(dx).padStart(3)} dy=${String(dy).padStart(3)}`,
  );
}

console.log("\n완료");
