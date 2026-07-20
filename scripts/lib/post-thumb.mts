/**
 * 포스트 썸네일 합성 — 배경 이미지 위에 어두운 스크림 + 병원명 + 포스트 제목.
 *
 * 배경이 병원 사진이든 AI 생성 이미지든 이 합성은 똑같이 쓴다.
 * 사이트 전체 썸네일 톤이 하나여야 해서, 배경 출처만 다르고 나머지는 공유한다.
 *   - gen-post-thumbnail.mts     : 배경 = 병원 실사진
 *   - gen-post-thumbnail-ai.mts  : 배경 = OpenAI 생성 이미지 (사진이 모자랄 때)
 */
import sharp from "sharp";

export const BUCKET = "column-images";
export const S = 1080;
const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY ?? 82);

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** 글자 수 기준 2줄 줄바꿈 (공백 우선, 없으면 강제) */
function wrap(text: string, per: number): string[] {
  if (text.length <= per) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > per && cur) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
    if (lines.length === 1 && cur.length > per) break;
  }
  if (cur) lines.push(cur.trim());
  const two = lines.slice(0, 2);
  if (two.length === 2) {
    const used = two.join(" ").length;
    if (used < text.replace(/\s/g, " ").length - 1) two[1] = two[1].replace(/.$/, "") + "…";
  }
  return two;
}

async function renderText(
  markup: string,
  width: number,
  dpi: number,
  align: "center" | "left" = "center",
  font = "Apple SD Gothic Neo",
): Promise<Buffer> {
  return sharp({ text: { text: markup, font, width, align, rgba: true, dpi } })
    .png()
    .toBuffer();
}

/**
 * 포스트별 액센트 팔레트 — 같은 병원이라도 글마다 색 무드가 달라 캐러셀에서 구별된다.
 * accent=포인트색(토픽 배지·언더라인·테두리), card=카드/색보정 다크 틴트(액센트 계열).
 */
// 순번 0~4가 한 캐러셀에 함께 뜨므로, 앞쪽 5색을 색상환에서 최대한 벌려 배치한다.
const PALETTE = [
  { accent: "#3cc7ae", card: "#0b221e" }, // 0 teal
  { accent: "#f2895a", card: "#241206" }, // 1 orange
  { accent: "#5b93f5", card: "#0d1830" }, // 2 blue
  { accent: "#ec6f96", card: "#260f1a" }, // 3 rose
  { accent: "#a888f7", card: "#180f2c" }, // 4 violet
  { accent: "#40c6dd", card: "#07222a" }, // 5 cyan
];
const SUB_DPI = 162; // 부제
const EYE_DPI = 80; // 토픽 배지

type Pal = { accent: string; card: string };
type Ctx = { base: Buffer; pal: Pal; name: string; title: string; eyeText: string };
type Block = {
  nameImg: Buffer;
  nameW: number;
  nameH: number;
  subImgs: Buffer[];
  subMetas: sharp.Metadata[];
  subGap: number;
  subH: number;
  eyeImg: Buffer | null;
  eyeTW: number;
  eyeTH: number;
};

const measure = (b: Buffer) => sharp(b).metadata();
const cxOf = (w: number) => Math.round((S - w) / 2);
const svg = (inner: string) => Buffer.from(`<svg width="${S}" height="${S}">${inner}</svg>`);
const bar = (w: number, h: number, fill: string) =>
  Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${Math.min(h / 2, 3)}" fill="${fill}"/></svg>`);

/** 배경 색보정 워시 — 레이아웃마다 방향이 다르다. */
function grad(pal: Pal, kind: "vert" | "left" | "right" | "flat"): Buffer {
  if (kind === "flat")
    return svg(`<rect width="${S}" height="${S}" fill="${pal.card}" fill-opacity="0.4"/>`);
  const defs: Record<string, string> = {
    vert: `<linearGradient id="g" x1="0" y1="0" x2="0.15" y2="1"><stop offset="0%" stop-color="${pal.accent}" stop-opacity="0.12"/><stop offset="55%" stop-color="${pal.card}" stop-opacity="0.34"/><stop offset="100%" stop-color="${pal.card}" stop-opacity="0.6"/></linearGradient>`,
    left: `<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${pal.card}" stop-opacity="0.92"/><stop offset="52%" stop-color="${pal.card}" stop-opacity="0.58"/><stop offset="84%" stop-color="${pal.card}" stop-opacity="0.06"/></linearGradient>`,
    right: `<linearGradient id="g" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="${pal.card}" stop-opacity="0.92"/><stop offset="52%" stop-color="${pal.card}" stop-opacity="0.58"/><stop offset="84%" stop-color="${pal.card}" stop-opacity="0.06"/></linearGradient>`,
  };
  return svg(`<defs>${defs[kind]}</defs><rect width="${S}" height="${S}" fill="url(#g)"/>`);
}

// 세로 크롭(16:9 등) 안전영역: 텍스트는 전부 세로 중앙 밴드 안에 둔다.

/** 텍스트(병원명·부제·배지) 렌더 + 측정. 배지는 기본 다크(pill용). */
async function renderBlock(
  ctx: Ctx,
  textW: number,
  nameDpi: number,
): Promise<Block> {
  const nameImg = await renderText(
    `<span foreground="#ffffff" weight="bold">${escapeXml(ctx.name)}</span>`,
    textW,
    nameDpi,
  );
  const subImgs: Buffer[] = [];
  for (const l of wrap(ctx.title, 18)) {
    subImgs.push(
      await renderText(
        `<span foreground="#dbe3de" weight="500">${escapeXml(l)}</span>`,
        textW,
        SUB_DPI,
      ),
    );
  }
  const eyeImg = ctx.eyeText
    ? await renderText(
        `<span foreground="#0c1613" weight="bold">${escapeXml(ctx.eyeText)}</span>`,
        textW,
        EYE_DPI,
      )
    : null;
  const nm = await measure(nameImg);
  const subMetas = await Promise.all(subImgs.map(measure));
  const eyeM = eyeImg ? await measure(eyeImg) : null;
  const subGap = Math.round(S * 0.014);
  const subH =
    subMetas.reduce((s, m) => s + (m.height ?? 0), 0) +
    subGap * Math.max(0, subImgs.length - 1);
  return {
    nameImg,
    nameW: nm.width ?? 0,
    nameH: nm.height ?? 0,
    subImgs,
    subMetas,
    subGap,
    subH,
    eyeImg,
    eyeTW: eyeM?.width ?? 0,
    eyeTH: eyeM?.height ?? 0,
  };
}

const finish = (base: Buffer, ov: sharp.OverlayOptions[]) =>
  sharp(base).composite(ov).webp({ quality: WEBP_QUALITY }).toBuffer();

// ── 레이아웃 0 — 중앙 다크 카드 ─────────────────────────────
async function layoutCenterCard(ctx: Ctx): Promise<Buffer> {
  const { base, pal } = ctx;
  const textW = Math.round(S * 0.64);
  const b = await renderBlock(ctx, textW, 420);
  const pillPadX = Math.round(S * 0.03),
    pillPadY = Math.round(S * 0.016);
  const pillW = b.eyeImg ? b.eyeTW + pillPadX * 2 : 0,
    pillH = b.eyeImg ? b.eyeTH + pillPadY * 2 : 0;
  const uW = Math.round(S * 0.07),
    uH = 6;
  const gapEye = Math.round(S * 0.032),
    gapU = Math.round(S * 0.028),
    gapSub = Math.round(S * 0.028);
  const blockH =
    (b.eyeImg ? pillH + gapEye : 0) + b.nameH + gapU + uH + gapSub + b.subH;
  const padX = Math.round(S * 0.07),
    padY = Math.round(S * 0.075);
  const cardW = Math.min(Math.round(S * 0.88), textW + padX * 2);
  const cardH = blockH + padY * 2;
  const cardX = cxOf(cardW),
    cardY = Math.round((S - cardH) / 2);
  const ov: sharp.OverlayOptions[] = [
    { input: grad(pal, "vert"), top: 0, left: 0 },
    {
      input: svg(
        `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="34" fill="${pal.card}" fill-opacity="0.86"/><rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="34" fill="none" stroke="${pal.accent}" stroke-opacity="0.5" stroke-width="2.5"/>`,
      ),
      top: 0,
      left: 0,
    },
  ];
  let y = cardY + padY;
  if (b.eyeImg) {
    const px = cxOf(pillW);
    ov.push({
      input: svg(
        `<rect x="${px}" y="${y}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="${pal.accent}"/>`,
      ),
      top: 0,
      left: 0,
    });
    ov.push({ input: b.eyeImg, top: y + pillPadY, left: cxOf(b.eyeTW) });
    y += pillH + gapEye;
  }
  ov.push({ input: b.nameImg, top: y, left: cxOf(b.nameW) });
  y += b.nameH + gapU;
  ov.push({ input: bar(uW, uH, pal.accent), top: y, left: cxOf(uW) });
  y += uH + gapSub;
  for (let i = 0; i < b.subImgs.length; i++) {
    ov.push({ input: b.subImgs[i], top: y, left: cxOf(b.subMetas[i].width ?? 0) });
    y += (b.subMetas[i].height ?? 0) + b.subGap;
  }
  return finish(base, ov);
}

// ── 레이아웃 1 — 우측 패널(세로 중앙, 우측 정렬 + 우측 액센트 바) ──
async function layoutRightPanel(ctx: Ctx): Promise<Buffer> {
  const { base, pal } = ctx;
  const marginR = S - Math.round(S * 0.09);
  const textW = Math.round(S * 0.6);
  const b = await renderBlock(ctx, textW, 390);
  const uW = Math.round(S * 0.08),
    uH = 6;
  const gapEye = Math.round(S * 0.03),
    gapU = Math.round(S * 0.03),
    gapSub = Math.round(S * 0.03);
  const blockH =
    (b.eyeImg ? b.eyeTH + gapEye : 0) + b.nameH + gapU + uH + gapSub + b.subH;
  const rx = (w: number) => marginR - w; // 우측 정렬
  const ov: sharp.OverlayOptions[] = [{ input: grad(pal, "right"), top: 0, left: 0 }];
  let y = Math.round((S - blockH) / 2);
  if (b.eyeImg) {
    const eb = await renderText(
      `<span foreground="${pal.accent}" weight="bold">${escapeXml(ctx.eyeText)}</span>`,
      textW,
      EYE_DPI,
    );
    ov.push({ input: eb, top: y, left: rx(b.eyeTW) });
    y += b.eyeTH + gapEye;
  }
  ov.push({ input: b.nameImg, top: y, left: rx(b.nameW) });
  y += b.nameH + gapU;
  ov.push({ input: bar(uW, uH, pal.accent), top: y, left: rx(uW) });
  y += uH + gapSub;
  for (let i = 0; i < b.subImgs.length; i++) {
    ov.push({ input: b.subImgs[i], top: y, left: rx(b.subMetas[i].width ?? 0) });
    y += (b.subMetas[i].height ?? 0) + b.subGap;
  }
  return finish(base, ov);
}

// ── 레이아웃 2 — 좌측 패널(세로 중앙, 좌측 정렬) ────────────────
async function layoutLeftPanel(ctx: Ctx): Promise<Buffer> {
  const { base, pal } = ctx;
  const marginX = Math.round(S * 0.09);
  const textW = Math.round(S * 0.6);
  const b = await renderBlock(ctx, textW, 390);
  const uW = Math.round(S * 0.08),
    uH = 6;
  const gapEye = Math.round(S * 0.03),
    gapU = Math.round(S * 0.03),
    gapSub = Math.round(S * 0.03);
  const blockH =
    (b.eyeImg ? b.eyeTH + gapEye : 0) + b.nameH + gapU + uH + gapSub + b.subH;
  const ov: sharp.OverlayOptions[] = [{ input: grad(pal, "left"), top: 0, left: 0 }];
  let y = Math.round((S - blockH) / 2);
  if (b.eyeImg) {
    // 좌측 패널은 배지 pill 대신 액센트 텍스트 머리말
    const eb = await renderText(
      `<span foreground="${pal.accent}" weight="bold">${escapeXml(ctx.eyeText)}</span>`,
      textW,
      EYE_DPI,
    );
    ov.push({ input: eb, top: y, left: marginX });
    y += b.eyeTH + gapEye;
  }
  ov.push({ input: b.nameImg, top: y, left: marginX });
  y += b.nameH + gapU;
  ov.push({ input: bar(uW, uH, pal.accent), top: y, left: marginX });
  y += uH + gapSub;
  for (let i = 0; i < b.subImgs.length; i++) {
    ov.push({ input: b.subImgs[i], top: y, left: marginX });
    y += (b.subMetas[i].height ?? 0) + b.subGap;
  }
  return finish(base, ov);
}

// ── 레이아웃 3 — 가로 룰 밴드(세로 중앙, 위·아래 액센트 라인) ────
async function layoutRuledBand(ctx: Ctx): Promise<Buffer> {
  const { base, pal } = ctx;
  const b = await renderBlock(ctx, Math.round(S * 0.78), 405);
  const pillPadX = Math.round(S * 0.03),
    pillPadY = Math.round(S * 0.016);
  const pillW = b.eyeImg ? b.eyeTW + pillPadX * 2 : 0,
    pillH = b.eyeImg ? b.eyeTH + pillPadY * 2 : 0;
  const ruleW = Math.round(S * 0.46),
    ruleH = 4;
  const gapEye = Math.round(S * 0.028),
    gapRule = Math.round(S * 0.032),
    gapSub = Math.round(S * 0.026);
  const blockH =
    ruleH +
    gapRule +
    (b.eyeImg ? pillH + gapEye : 0) +
    b.nameH +
    gapSub +
    b.subH +
    gapRule +
    ruleH;
  const ov: sharp.OverlayOptions[] = [{ input: grad(pal, "vert"), top: 0, left: 0 }];
  let y = Math.round((S - blockH) / 2);
  ov.push({ input: bar(ruleW, ruleH, pal.accent), top: y, left: cxOf(ruleW) });
  y += ruleH + gapRule;
  if (b.eyeImg) {
    const px = cxOf(pillW);
    ov.push({
      input: svg(
        `<rect x="${px}" y="${y}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="${pal.accent}"/>`,
      ),
      top: 0,
      left: 0,
    });
    ov.push({ input: b.eyeImg, top: y + pillPadY, left: cxOf(b.eyeTW) });
    y += pillH + gapEye;
  }
  ov.push({ input: b.nameImg, top: y, left: cxOf(b.nameW) });
  y += b.nameH + gapSub;
  for (let i = 0; i < b.subImgs.length; i++) {
    ov.push({ input: b.subImgs[i], top: y, left: cxOf(b.subMetas[i].width ?? 0) });
    y += (b.subMetas[i].height ?? 0) + b.subGap;
  }
  ov.push({ input: bar(ruleW, ruleH, pal.accent), top: y, left: cxOf(ruleW) });
  return finish(base, ov);
}

// ── 레이아웃 4 — 아웃라인 카드(중앙 박스 + 상단 탭 배지, 크롭 안전) ──
async function layoutOutlineCard(ctx: Ctx): Promise<Buffer> {
  const { base, pal } = ctx;
  const textW = Math.round(S * 0.64);
  const b = await renderBlock(ctx, textW, 410);
  const uW = Math.round(S * 0.07),
    uH = 6;
  const gapU = Math.round(S * 0.028),
    gapSub = Math.round(S * 0.028);
  const blockH = b.nameH + gapU + uH + gapSub + b.subH;
  const pillPadX = Math.round(S * 0.03),
    pillPadY = Math.round(S * 0.016);
  const pillW = b.eyeImg ? b.eyeTW + pillPadX * 2 : 0,
    pillH = b.eyeImg ? b.eyeTH + pillPadY * 2 : 0;
  const padX = Math.round(S * 0.075),
    padY = Math.round(S * 0.08);
  const cardW = Math.min(Math.round(S * 0.86), textW + padX * 2);
  const cardH = blockH + padY * 2;
  const cardX = cxOf(cardW),
    cardY = Math.round((S - cardH) / 2);
  const ov: sharp.OverlayOptions[] = [
    { input: grad(pal, "flat"), top: 0, left: 0 },
    {
      input: svg(
        `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="28" fill="${pal.card}" fill-opacity="0.28"/><rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="28" fill="none" stroke="${pal.accent}" stroke-opacity="0.9" stroke-width="4"/>`,
      ),
      top: 0,
      left: 0,
    },
  ];
  if (b.eyeImg) {
    const px = cxOf(pillW),
      py = cardY - Math.round(pillH / 2);
    ov.push({
      input: svg(
        `<rect x="${px}" y="${py}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="${pal.accent}"/>`,
      ),
      top: 0,
      left: 0,
    });
    ov.push({ input: b.eyeImg, top: py + pillPadY, left: cxOf(b.eyeTW) });
  }
  let y = cardY + padY;
  ov.push({ input: b.nameImg, top: y, left: cxOf(b.nameW) });
  y += b.nameH + gapU;
  ov.push({ input: bar(uW, uH, pal.accent), top: y, left: cxOf(uW) });
  y += uH + gapSub;
  for (let i = 0; i < b.subImgs.length; i++) {
    ov.push({ input: b.subImgs[i], top: y, left: cxOf(b.subMetas[i].width ?? 0) });
    y += (b.subMetas[i].height ?? 0) + b.subGap;
  }
  return finish(base, ov);
}

const LAYOUTS = [
  layoutCenterCard,
  layoutRightPanel,
  layoutLeftPanel,
  layoutRuledBand,
  layoutOutlineCard,
];

/**
 * 배경(병원 사진)은 그대로, 위에 얹는 디자인을 variant마다 5가지 레이아웃 중
 * 하나로 다르게 그린다(색상만이 아니라 구도 자체가 겹치지 않음).
 */
export async function compose(
  background: Buffer,
  name: string,
  title: string,
  variant: number,
  eyebrow?: string,
): Promise<Buffer> {
  const v = Math.abs(variant);
  const pal = PALETTE[v % PALETTE.length];
  const base = await sharp(background)
    .resize(S, S, { fit: "cover" })
    .modulate({ brightness: 0.78, saturation: 0.68 })
    .toBuffer();
  const ctx: Ctx = { base, pal, name, title, eyeText: eyebrow?.trim() ?? "" };
  return LAYOUTS[v % LAYOUTS.length](ctx);
}

/** post.id 기반 결정적 해시 (같은 포스트 = 항상 같은 디자인) */
export function seedOf(id: string): number {
  let h = 7;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
