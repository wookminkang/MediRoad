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
const NAME_DPI = 428; // 병원명(크게)
const SUB_DPI = 162; // 부제
const EYE_DPI = 80; // 토픽 배지

/**
 * 병원 사진을 액센트 색으로 그레이딩(무드 변주)하고, 중앙 다크 카드에
 *   [토픽 배지] → 병원명(크게) → 액센트 언더라인 → 부제(제목)
 * 을 얹는다. variant(seed)로 액센트가 포스트마다 달라진다.
 */
export async function compose(
  background: Buffer,
  name: string,
  title: string,
  variant: number,
  eyebrow?: string,
): Promise<Buffer> {
  const pal = PALETTE[Math.abs(variant) % PALETTE.length];
  const textW = Math.round(S * 0.66);
  const cx = (w: number) => Math.round((S - w) / 2);

  // 배경: 채도 낮춰 액센트 워시가 무드를 주도하게
  const base = await sharp(background)
    .resize(S, S, { fit: "cover" })
    .modulate({ brightness: 0.78, saturation: 0.68 })
    .toBuffer();
  // 액센트 색보정 워시 + 하단 다크 (카드 대비)
  const wash = Buffer.from(
    `<svg width="${S}" height="${S}"><defs>` +
      `<linearGradient id="a" x1="0" y1="0" x2="0.15" y2="1">` +
      `<stop offset="0%" stop-color="${pal.accent}" stop-opacity="0.12"/>` +
      `<stop offset="55%" stop-color="${pal.card}" stop-opacity="0.34"/>` +
      `<stop offset="100%" stop-color="${pal.card}" stop-opacity="0.64"/>` +
      `</linearGradient></defs>` +
      `<rect width="${S}" height="${S}" fill="url(#a)"/></svg>`,
  );

  // 텍스트 렌더
  const nameImg = await renderText(
    `<span foreground="#ffffff" weight="bold">${escapeXml(name)}</span>`,
    textW,
    NAME_DPI,
  );
  const subLines = wrap(title, 17);
  const subImgs: Buffer[] = [];
  for (const l of subLines) {
    subImgs.push(
      await renderText(
        `<span foreground="#dbe3de" weight="500">${escapeXml(l)}</span>`,
        textW,
        SUB_DPI,
      ),
    );
  }
  const eyeText = eyebrow && eyebrow.trim() ? eyebrow.trim() : "";
  const eyeImg = eyeText
    ? await renderText(
        `<span foreground="#0c1613" weight="bold">${escapeXml(eyeText)}</span>`,
        textW,
        EYE_DPI,
      )
    : null;

  // 측정
  const meta = (b: Buffer) => sharp(b).metadata();
  const nm = await meta(nameImg);
  const nameH = nm.height ?? 0;
  const nameW = nm.width ?? 0;
  const subMetas = await Promise.all(subImgs.map(meta));
  const subGap = Math.round(S * 0.014);
  const subH =
    subMetas.reduce((s, m) => s + (m.height ?? 0), 0) +
    subGap * Math.max(0, subLines.length - 1);
  const eyeM = eyeImg ? await meta(eyeImg) : null;
  const eyeTW = eyeM?.width ?? 0;
  const eyeTH = eyeM?.height ?? 0;

  // 토픽 배지(pill) 크기
  const pillPadX = Math.round(S * 0.03);
  const pillPadY = Math.round(S * 0.016);
  const pillW = eyeImg ? eyeTW + pillPadX * 2 : 0;
  const pillH = eyeImg ? eyeTH + pillPadY * 2 : 0;

  // 액센트 언더라인
  const uW = Math.round(S * 0.07);
  const uH = 6;

  const gapEye = Math.round(S * 0.032);
  const gapU = Math.round(S * 0.028);
  const gapSub = Math.round(S * 0.028);
  const blockH =
    (eyeImg ? pillH + gapEye : 0) + nameH + gapU + uH + gapSub + subH;

  // 카드 (액센트 테두리)
  const padX = Math.round(S * 0.07);
  const padY = Math.round(S * 0.075);
  const cardW = Math.min(Math.round(S * 0.88), textW + padX * 2);
  const cardH = blockH + padY * 2;
  const cardX = cx(cardW);
  const cardY = Math.round((S - cardH) / 2);
  const card = Buffer.from(
    `<svg width="${S}" height="${S}">` +
      `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="34" fill="${pal.card}" fill-opacity="0.86"/>` +
      `<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="34" fill="none" stroke="${pal.accent}" stroke-opacity="0.5" stroke-width="2.5"/>` +
      `</svg>`,
  );

  const overlays: sharp.OverlayOptions[] = [
    { input: wash, top: 0, left: 0 },
    { input: card, top: 0, left: 0 },
  ];
  let y = cardY + padY;
  if (eyeImg) {
    const pillX = cx(pillW);
    const pill = Buffer.from(
      `<svg width="${S}" height="${S}"><rect x="${pillX}" y="${y}" width="${pillW}" height="${pillH}" rx="${Math.round(pillH / 2)}" fill="${pal.accent}"/></svg>`,
    );
    overlays.push({ input: pill, top: 0, left: 0 });
    overlays.push({ input: eyeImg, top: y + pillPadY, left: cx(eyeTW) });
    y += pillH + gapEye;
  }
  overlays.push({ input: nameImg, top: y, left: cx(nameW) });
  y += nameH + gapU;
  const uBar = Buffer.from(
    `<svg width="${uW}" height="${uH}"><rect width="${uW}" height="${uH}" rx="3" fill="${pal.accent}"/></svg>`,
  );
  overlays.push({ input: uBar, top: y, left: cx(uW) });
  y += uH + gapSub;
  for (let i = 0; i < subImgs.length; i++) {
    overlays.push({ input: subImgs[i], top: y, left: cx(subMetas[i].width ?? 0) });
    y += (subMetas[i].height ?? 0) + subGap;
  }

  return sharp(base).composite(overlays).webp({ quality: WEBP_QUALITY }).toBuffer();
}

/** post.id 기반 결정적 해시 (같은 포스트 = 항상 같은 디자인) */
export function seedOf(id: string): number {
  let h = 7;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
