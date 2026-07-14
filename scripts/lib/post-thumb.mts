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

/** 디자인 변주 — 오버레이 톤 + 액센트 색 (포스트마다 다름) */
const TONES = ["#0d1526", "#0a1a33", "#141024", "#05201e", "#1a1410"];
const ACCENTS = ["#4a82ea", "#2fbfa8", "#f5709a", "#f5a623", "#9b7cf6", "#5ac8fa"];
const NAME_DPI = 470; // 고정 — 전 썸네일 동일 글씨 크기
const TITLE_DPI = 238;

/** 장식 오버레이 6종 — 중앙 텍스트를 건드리지 않는 가장자리/코너 디자인 */
function decorSvg(d: number, accent: string): string {
  const p = Math.round(S * 0.05);
  const e = S - p;
  switch (d) {
    case 0: {
      const a = Math.round(S * 0.062);
      const w = 6;
      const L = (path: string) =>
        `<path d="${path}" stroke="${accent}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      return (
        L(`M${p} ${p + a} L${p} ${p} L${p + a} ${p}`) +
        L(`M${e - a} ${p} L${e} ${p} L${e} ${p + a}`) +
        L(`M${p} ${e - a} L${p} ${e} L${p + a} ${e}`) +
        L(`M${e - a} ${e} L${e} ${e} L${e} ${e - a}`)
      );
    }
    case 1:
      return `<rect x="${p}" y="${p}" width="${S - 2 * p}" height="${S - 2 * p}" rx="26" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="3"/>`;
    case 2:
      return `<polygon points="${S},0 ${S},${Math.round(S * 0.2)} ${Math.round(S * 0.8)},0" fill="${accent}" opacity="0.9"/>`;
    case 3:
      return `<circle cx="${S}" cy="0" r="${Math.round(S * 0.36)}" fill="${accent}" opacity="0.16"/><circle cx="0" cy="${S}" r="${Math.round(S * 0.3)}" fill="${accent}" opacity="0.12"/>`;
    case 4: {
      const x = p + Math.round(S * 0.02);
      const w = S - 2 * x;
      return (
        `<rect x="${x}" y="${Math.round(S * 0.075)}" width="${w}" height="4" rx="2" fill="${accent}" opacity="0.8"/>` +
        `<rect x="${x}" y="${S - Math.round(S * 0.075)}" width="${w}" height="4" rx="2" fill="${accent}" opacity="0.8"/>`
      );
    }
    default: {
      const t = Math.round(S * 0.18);
      return (
        `<polygon points="0,${S} 0,${S - t} ${t},${S}" fill="${accent}" opacity="0.85"/>` +
        `<polygon points="${S},0 ${S},${t} ${S - t},0" fill="${accent}" opacity="0.85"/>`
      );
    }
  }
}

export async function compose(
  background: Buffer,
  name: string,
  title: string,
  variant: number,
): Promise<Buffer> {
  const tone = TONES[variant % TONES.length];
  const accent = ACCENTS[variant % ACCENTS.length];
  const decor = variant % 6;
  const textW = Math.round(S * 0.84);

  const base = await sharp(background).resize(S, S, { fit: "cover" }).toBuffer();
  const scrim = Buffer.from(
    `<svg width="${S}" height="${S}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="${tone}" stop-opacity="0.46"/>` +
      `<stop offset="50%" stop-color="${tone}" stop-opacity="0.52"/>` +
      `<stop offset="100%" stop-color="${tone}" stop-opacity="0.66"/>` +
      `</linearGradient></defs><rect width="${S}" height="${S}" fill="url(#g)"/></svg>`,
  );

  const nameImg = await renderText(
    `<span foreground="#ffffff" weight="bold">${escapeXml(name)}</span>`,
    textW,
    NAME_DPI,
  );
  const nameShadow = await sharp(
    await renderText(
      `<span foreground="#000000" weight="bold">${escapeXml(name)}</span>`,
      textW,
      NAME_DPI,
    ),
  )
    .blur(9)
    .toBuffer();

  const lines = wrap(title, 18);
  const lineImgs: Buffer[] = [];
  for (const l of lines) {
    lineImgs.push(
      await renderText(
        `<span foreground="#dfe6f2" weight="600">${escapeXml(l)}</span>`,
        textW,
        TITLE_DPI,
      ),
    );
  }
  const lineMetas = await Promise.all(lineImgs.map((b) => sharp(b).metadata()));
  const lineGap = Math.round(S * 0.018);
  const titleH =
    lineMetas.reduce((s, m) => s + (m.height ?? 0), 0) +
    lineGap * Math.max(0, lines.length - 1);

  const nm = await sharp(nameImg).metadata();
  const nameH = nm.height ?? 0;
  const nameW = nm.width ?? 0;
  const cx = (w?: number) => Math.round((S - (w ?? 0)) / 2);

  const uW = Math.round(S * 0.08);
  const uH = 5;
  const uBar = Buffer.from(
    `<svg width="${uW}" height="${uH}"><rect width="${uW}" height="${uH}" rx="2.5" fill="${accent}"/></svg>`,
  );
  const gapU = Math.round(S * 0.032);
  const gapTitle = Math.round(S * 0.05);

  const blockH = nameH + gapU + uH + gapTitle + titleH;
  const top = Math.round((S - blockH) / 2);

  const composites: sharp.OverlayOptions[] = [
    { input: scrim, top: 0, left: 0 },
    {
      input: Buffer.from(`<svg width="${S}" height="${S}">${decorSvg(decor, accent)}</svg>`),
      top: 0,
      left: 0,
    },
    { input: nameShadow, top: top + 3, left: cx(nameW) },
    { input: nameImg, top, left: cx(nameW) },
    { input: uBar, top: top + nameH + gapU, left: cx(uW) },
  ];
  let ty = top + nameH + gapU + uH + gapTitle;
  for (let i = 0; i < lineImgs.length; i++) {
    composites.push({ input: lineImgs[i], top: ty, left: cx(lineMetas[i].width) });
    ty += (lineMetas[i].height ?? 0) + lineGap;
  }

  return sharp(base).composite(composites).webp({ quality: WEBP_QUALITY }).toBuffer();
}

/** post.id 기반 결정적 해시 (같은 포스트 = 항상 같은 디자인) */
export function seedOf(id: string): number {
  let h = 7;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
