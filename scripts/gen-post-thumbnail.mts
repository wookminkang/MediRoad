/**
 * 병원 포스트 썸네일 생성 — 병원 대표사진을 어둡게 깔고 병원명(대)+포스트제목(소) 워터마크.
 * 실행: node --env-file=.env.local --import tsx scripts/gen-post-thumbnail.mts <postId>
 *   - postId 생략 시: 병원 대표사진이 있고 썸네일 없는 published 포스트 전부 생성
 */
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const BUCKET = "column-images";
const LOGO_PATH = path.resolve("public/mediroad_logo.svg");
const S = 1080;
const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY ?? 82);

/** 로고를 흰색으로 렌더 (알파 유지) */
async function whiteLogo(targetW: number) {
  const resized = await sharp(LOGO_PATH, { density: 400 })
    .resize({ width: targetW })
    .ensureAlpha()
    .png()
    .toBuffer();
  const m = await sharp(resized).metadata();
  const w = m.width ?? targetW;
  const h = m.height ?? 0;
  const { data: alpha } = await sharp(resized)
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const buf = await sharp({
    create: { width: w, height: h, channels: 3, background: "#ffffff" },
  })
    .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();
  return { buf, w, h };
}

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
  if (two.length === 2 && (two[1] + "…").length) {
    // 남은 글자 있으면 … 처리
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
  return sharp({
    text: { text: markup, font, width, align, rgba: true, dpi },
  })
    .png()
    .toBuffer();
}

/** 디자인 변주 — 오버레이 톤 + 액센트 색 (포스트마다 다름) */
const TONES = ["#0d1526", "#0a1a33", "#141024", "#05201e", "#1a1410"];
const ACCENTS = ["#4a82ea", "#2fbfa8", "#f5709a", "#f5a623", "#9b7cf6", "#5ac8fa"];
const NAME_DPI = 470; // 고정 — 전 썸네일 동일 글씨 크기
const TITLE_DPI = 238;

async function compose(
  photo: Buffer,
  name: string,
  title: string,
  variant: number,
): Promise<Buffer> {
  const tone = TONES[variant % TONES.length];
  const accent = ACCENTS[variant % ACCENTS.length];
  const decor = variant % 6; // 장식 6종 — 중앙 텍스트는 그대로, 가장자리 디자인만 변주
  const textW = Math.round(S * 0.84);

  const base = await sharp(photo).resize(S, S, { fit: "cover" }).toBuffer();
  const scrim = Buffer.from(
    `<svg width="${S}" height="${S}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0%" stop-color="${tone}" stop-opacity="0.46"/>` +
      `<stop offset="50%" stop-color="${tone}" stop-opacity="0.52"/>` +
      `<stop offset="100%" stop-color="${tone}" stop-opacity="0.66"/>` +
      `</linearGradient></defs><rect width="${S}" height="${S}" fill="url(#g)"/></svg>`,
  );

  // 병원명(대, 고정 크기, 중앙)
  const nameImg = await renderText(
    `<span foreground="#ffffff" weight="bold">${escapeXml(name)}</span>`,
    textW,
    NAME_DPI,
    "center",
  );
  const nameShadow = await sharp(
    await renderText(
      `<span foreground="#000000" weight="bold">${escapeXml(name)}</span>`,
      textW,
      NAME_DPI,
      "center",
    ),
  )
    .blur(9)
    .toBuffer();

  // 제목(소, 줄별 렌더 — line-height, 중앙)
  const lines = wrap(title, 18);
  const lineImgs: Buffer[] = [];
  for (const l of lines) {
    lineImgs.push(
      await renderText(
        `<span foreground="#dfe6f2" weight="600">${escapeXml(l)}</span>`,
        textW,
        TITLE_DPI,
        "center",
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

  // 이름 밑 액센트 밑줄 (공통 요소)
  const uW = Math.round(S * 0.08);
  const uH = 5;
  const uBar = Buffer.from(
    `<svg width="${uW}" height="${uH}"><rect width="${uW}" height="${uH}" rx="2.5" fill="${accent}"/></svg>`,
  );
  const gapU = Math.round(S * 0.032);
  const gapTitle = Math.round(S * 0.05);

  // 중앙 배치 — 블록 전체를 세로 중앙에
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

/** 장식 오버레이 6종 — 중앙 텍스트를 건드리지 않는 가장자리/코너 디자인 */
function decorSvg(d: number, accent: string): string {
  const p = Math.round(S * 0.05); // 바깥 여백
  const e = S - p;
  switch (d) {
    case 0: {
      // 네 모서리 브래킷 (뷰파인더 느낌)
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
      // 안쪽 라운드 테두리 프레임
      return `<rect x="${p}" y="${p}" width="${S - 2 * p}" height="${S - 2 * p}" rx="26" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="3"/>`;
    case 2:
      // 우상단 코너 밴드
      return `<polygon points="${S},0 ${S},${Math.round(S * 0.2)} ${Math.round(S * 0.8)},0" fill="${accent}" opacity="0.9"/>`;
    case 3:
      // 부드러운 글로우 원 (대각 2개)
      return `<circle cx="${S}" cy="0" r="${Math.round(S * 0.36)}" fill="${accent}" opacity="0.16"/><circle cx="0" cy="${S}" r="${Math.round(S * 0.3)}" fill="${accent}" opacity="0.12"/>`;
    case 4: {
      // 상·하 가로 룰
      const x = p + Math.round(S * 0.02);
      const w = S - 2 * x;
      return (
        `<rect x="${x}" y="${Math.round(S * 0.075)}" width="${w}" height="4" rx="2" fill="${accent}" opacity="0.8"/>` +
        `<rect x="${x}" y="${S - Math.round(S * 0.075)}" width="${w}" height="4" rx="2" fill="${accent}" opacity="0.8"/>`
      );
    }
    default: {
      // 5: 좌하·우상 대각 삼각형
      const t = Math.round(S * 0.18);
      return (
        `<polygon points="0,${S} 0,${S - t} ${t},${S}" fill="${accent}" opacity="0.85"/>` +
        `<polygon points="${S},0 ${S},${t} ${S - t},0" fill="${accent}" opacity="0.85"/>`
      );
    }
  }
}

async function hospitalPhotos(hospitalId: string): Promise<string[]> {
  const { data } = await sb
    .from("hospital_photos")
    .select("url,is_primary,sort_order")
    .eq("hospital_id", hospitalId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r) => r.url).filter(Boolean);
}

/** post.id 기반 결정적 해시 (같은 포스트 = 항상 같은 디자인) */
function seedOf(id: string): number {
  let h = 7;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

async function genOne(postId: string) {
  const { data: post } = await sb
    .from("hospital_posts")
    .select("id,title,hospital_id,hospital:hospitals(name,sigungu)")
    .eq("id", postId)
    .single();
  if (!post) {
    console.log(`  ✗ ${postId}: 포스트 없음`);
    return;
  }
  const hosp = Array.isArray(post.hospital) ? post.hospital[0] : post.hospital;
  const photos = await hospitalPhotos(post.hospital_id);
  if (!photos.length) {
    console.log(`  ✗ ${postId}: 병원 사진 없음 (${hosp?.name})`);
    return;
  }
  const seed = seedOf(post.id);
  const photoUrl = photos[seed % photos.length]; // 포스트마다 다른 사진
  const region = (hosp?.sigungu ?? "").replace(/[구시군]$/, "");
  const nameText = region ? `${hosp?.name} (${region})` : hosp?.name || "";
  const photo = Buffer.from(await (await fetch(photoUrl)).arrayBuffer());
  const webp = await compose(photo, nameText, post.title, seed);
  const key = `post-thumbs/${post.id}.webp`;
  const up = await sb.storage.from(BUCKET).upload(key, webp, {
    contentType: "image/webp",
    upsert: true,
  });
  if (up.error) throw up.error;
  const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  const { error } = await sb
    .from("hospital_posts")
    .update({ thumbnail: url })
    .eq("id", post.id);
  if (error) throw error;
  console.log(`  ✅ ${post.id} — ${nameText}`);
}

const arg = process.argv[2];
if (arg) {
  await genOne(arg);
} else {
  // 대표사진 있고 썸네일 없는 published 포스트 전부
  const { data: posts } = await sb
    .from("hospital_posts")
    .select("id,hospital_id,thumbnail")
    .eq("status", "published");
  const { data: photos } = await sb.from("hospital_photos").select("hospital_id");
  const hasPhoto = new Set((photos ?? []).map((p) => p.hospital_id));
  // 사진 있는 모든 포스트 재생성(일관 스타일 적용)
  const targets = (posts ?? []).filter((p) => hasPhoto.has(p.hospital_id));
  console.log(`대상 ${targets.length}개 (병원 사진 O)`);
  for (const p of targets) await genOne(p.id);
}
console.log("완료");
