/**
 * content/columns/*.md (frontmatter + 마크다운 본문) → Supabase columns 적재.
 *
 *  1) gray-matter로 frontmatter/본문 분리
 *  2) frontmatter.images[] 의 로컬 파일은 Supabase Storage(column-images)에 업로드해 URL 확보
 *  3) 본문의 [이미지:N] 자리표시를 images[N-1] 의 ![alt](url) 로 치환 (검증)
 *  4) reading_minutes 자동 계산
 *  5) columns 테이블 upsert (+ 새 카테고리 자동 등록)
 *
 * 실행: npm run ingest      (= node --env-file=.env.local --import tsx scripts/ingest-columns.ts)
 *   - 먼저 supabase/migrations/0001_columns.sql 적용
 *   - 파일명이 _ 로 시작하면 건너뜀(_template.md 등)
 */
import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";
import sharp from "sharp";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("env 미설정: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const CONTENT_DIR = path.resolve("content/columns");
const ARCHIVE_DIR = path.join(CONTENT_DIR, "_ingested");
const BUCKET = "column-images";
const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function shortId(len = 8) {
  const b = randomBytes(len);
  return Array.from(b, (n) => ALPHA[n % ALPHA.length]).join("");
}

type ImageEntry = { url?: string; file?: string; prompt?: string; alt?: string };

const LOGO_PATH = path.resolve("public/mediroad_logo.svg");

/** OpenAI 이미지 생성 → PNG/이미지 Buffer (모델·사이즈 env로 조정 가능) */
async function generateImage(prompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY 미설정 (AI 이미지 생성용)");
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const size = process.env.OPENAI_IMAGE_SIZE ?? "1024x1024";
  const quality = process.env.OPENAI_IMAGE_QUALITY ?? "high";
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
  });
  if (!res.ok) throw new Error(`이미지 생성 실패(${res.status}): ${await res.text()}`);
  const json = await res.json();
  const item = json.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item?.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer());
  throw new Error("이미지 응답 형식 불명(b64_json/url 없음)");
}

const THUMB_SIZE = 1080;
const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY ?? 80);

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 로고를 흰색 실루엣으로 (어두운 배경/스크림 위 가독성) */
async function whiteLogo(targetW: number): Promise<{ buf: Buffer; w: number; h: number }> {
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
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: "#ffffff" } })
    .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer();
  return { buf, w, h };
}

/** 본문 이미지 워터마크 — 우하단, 흰 로고 + 반투명 다크 칩(어떤 배경에서도 가독) */
async function addWatermark(imageBuf: Buffer): Promise<Buffer> {
  const base = sharp(imageBuf);
  const m = await base.metadata();
  const W = m.width ?? 1024;
  const H = m.height ?? 1024;
  const logo = await whiteLogo(Math.round(W * 0.18));
  const padIn = Math.round(W * 0.018);
  const boxW = logo.w + padIn * 2;
  const boxH = logo.h + padIn * 2;
  const r = Math.round(boxH * 0.32);
  const chip = Buffer.from(
    `<svg width="${boxW}" height="${boxH}"><rect width="${boxW}" height="${boxH}" rx="${r}" ry="${r}" fill="#000" fill-opacity="0.35"/></svg>`,
  );
  const pad = Math.round(W * 0.03);
  const boxLeft = W - boxW - pad;
  const boxTop = H - boxH - pad;
  return base
    .composite([
      { input: chip, top: boxTop, left: boxLeft },
      { input: logo.buf, top: boxTop + padIn, left: boxLeft + padIn },
    ])
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/** 썸네일 틀(강남언니 스타일): 이미지 + 하단 스크림 + 타이틀(흰) + 메디로드 로고(흰, 중앙 하단) */
async function composeThumbnail(imageBuf: Buffer, title: string): Promise<Buffer> {
  const S = THUMB_SIZE;
  const base = await sharp(imageBuf).resize(S, S, { fit: "cover" }).toBuffer();

  const scrim = Buffer.from(
    `<svg width="${S}" height="${S}"><defs>` +
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="42%" stop-color="#000" stop-opacity="0"/>` +
      `<stop offset="100%" stop-color="#000" stop-opacity="0.62"/>` +
      `</linearGradient></defs>` +
      `<rect width="${S}" height="${S}" fill="url(#g)"/></svg>`,
  );

  const len = title.replace(/\s/g, "").length;
  const dpi = len <= 14 ? 560 : len <= 22 ? 460 : 380;
  const titleImg = await sharp({
    text: {
      text: `<span foreground="#ffffff" weight="bold">${escapeXml(title)}</span>`,
      font: "Apple SD Gothic Neo",
      width: Math.round(S * 0.84),
      align: "center",
      rgba: true,
      dpi,
    },
  })
    .png()
    .toBuffer();
  const tm = await sharp(titleImg).metadata();

  const logo = await whiteLogo(Math.round(S * 0.3));

  const bottomPad = Math.round(S * 0.07);
  const logoTop = S - logo.h - bottomPad;
  const gap = Math.round(S * 0.04);
  const titleTop = Math.max(24, logoTop - (tm.height ?? 0) - gap);

  return sharp(base)
    .composite([
      { input: scrim, top: 0, left: 0 },
      { input: titleImg, top: titleTop, left: Math.round((S - (tm.width ?? 0)) / 2) },
      { input: logo.buf, top: logoTop, left: Math.round((S - logo.w) / 2) },
    ])
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/** url 그대로 / 로컬 file 업로드 / prompt로 AI 생성 → Storage public URL */
async function resolveImage(
  img: ImageEntry,
  columnId: string,
  name: string,
  mdDir: string,
): Promise<string> {
  if (img.url) return img.url;

  let buf: Buffer;
  let ext = ".png";
  if (img.file) {
    const localPath = path.resolve(mdDir, img.file);
    buf = await readFile(localPath);
    ext = path.extname(localPath).toLowerCase() || ".png";
  } else if (img.prompt) {
    buf = await addWatermark(await generateImage(img.prompt));
    ext = ".webp";
  } else {
    throw new Error(
      `이미지에 url/file/prompt 중 하나가 필요합니다: ${JSON.stringify(img)}`,
    );
  }

  const key = `${columnId}/${name}${ext}`;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(key, buf, { contentType: MIME[ext] ?? "image/png", upsert: true });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

/** 썸네일 해석: file/prompt → 베이스 이미지 → 타이틀·로고 합성 → Storage 업로드 */
async function resolveThumbnail(
  img: ImageEntry,
  columnId: string,
  title: string,
  mdDir: string,
): Promise<string> {
  let base: Buffer;
  if (img.file) base = await readFile(path.resolve(mdDir, img.file));
  else if (img.prompt) base = await generateImage(img.prompt);
  else throw new Error("thumbnail에 file 또는 prompt가 필요합니다");

  const composed = await composeThumbnail(base, title);
  const key = `${columnId}/thumb.webp`;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(key, composed, { contentType: "image/webp", upsert: true });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

/** 본문 [이미지:N] → ![alt](url) 치환 + 검증 */
function substituteImages(body: string, images: { url: string; alt?: string }[]): string {
  const out = body.replace(/\[이미지:(\d+)\]/g, (_m, nStr) => {
    const n = Number(nStr);
    const img = images[n - 1];
    if (!img?.url) throw new Error(`[이미지:${n}] 에 매칭되는 images[${n - 1}].url 이 없습니다`);
    return `![${img.alt ?? ""}](${img.url})`;
  });
  const leftover = out.match(/\[이미지[:\]]/);
  if (leftover) throw new Error(`치환되지 않은 이미지 자리표시가 남았습니다: ${leftover[0]}…`);
  return out;
}

function readingMinutes(body: string): number {
  const chars = body.replace(/\s/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}

async function ingestFile(file: string) {
  const mdPath = path.join(CONTENT_DIR, file);
  const raw = await readFile(mdPath, "utf8");
  const { data: fm, content } = matter(raw);

  // 필수 검증
  for (const key of ["title", "category", "excerpt", "reviewedBy"] as const) {
    if (!fm[key]) throw new Error(`${file}: frontmatter '${key}' 누락`);
  }

  const id: string = fm.id ?? shortId();
  const mdDir = path.dirname(mdPath);

  // 이미지 해석(업로드 포함)
  const imageEntries: ImageEntry[] = fm.images ?? [];
  const resolved = await Promise.all(
    imageEntries.map(async (img, i) => ({
      url: await resolveImage(img, id, `${i + 1}`, mdDir),
      alt: img.alt,
    })),
  );
  const bodyMd = substituteImages(content.trim(), resolved);

  // 썸네일 — {file|prompt}면 타이틀+로고 합성(강남언니 스타일), 문자열이면 그대로
  let thumbnail: string | null = null;
  if (typeof fm.thumbnail === "string") thumbnail = fm.thumbnail;
  else if (fm.thumbnail?.file || fm.thumbnail?.prompt)
    thumbnail = await resolveThumbnail(
      fm.thumbnail,
      id,
      fm.thumbnailTitle ?? fm.title,
      mdDir,
    );

  const status: string = fm.status ?? "draft";
  const today = new Date().toISOString().slice(0, 10);

  const row = {
    id,
    title: fm.title,
    category: fm.category,
    excerpt: fm.excerpt,
    thumbnail,
    summary: fm.summary ?? [],
    body_md: bodyMd,
    tags: fm.tags ?? [],
    faqs: fm.faqs ?? [],
    refs: fm.references ?? [],
    related_departments: fm.relatedDepartments ?? [],
    author: fm.author ?? "메디로드",
    reviewed_by: fm.reviewedBy,
    meta_title: fm.metaTitle ?? null,
    meta_description: fm.metaDescription ?? null,
    meta_keywords: fm.metaKeywords ?? null,
    og_image: fm.ogImage ?? null,
    noindex: fm.noindex ?? false,
    status,
    reading_minutes: fm.readingMinutes ?? readingMinutes(bodyMd),
    published_at: fm.publishedAt ?? (status === "published" ? today : null),
  };

  // 새 카테고리 자동 등록
  await sb
    .from("column_categories")
    .upsert({ slug: row.category, label: row.category }, { onConflict: "slug" });

  const { error } = await sb.from("columns").upsert(row, { onConflict: "id" });
  if (error) throw error;

  console.log(`  ✓ ${file} → ${id} (${status}, 이미지 ${resolved.length}장, ${row.reading_minutes}분)`);
}

// --- 실행 ---
await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});

const files = (await readdir(CONTENT_DIR))
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
  .sort();

if (files.length === 0) {
  console.log("적재할 .md 파일이 없습니다 (content/columns/).");
  process.exit(0);
}

console.log(`${files.length}개 파일 적재 시작…`);
await mkdir(ARCHIVE_DIR, { recursive: true });
let ok = 0;
for (const f of files) {
  try {
    await ingestFile(f);
    // 적재 성공 → _ingested로 이동(다음 실행 시 재처리·상태 덮어쓰기 방지)
    await rename(path.join(CONTENT_DIR, f), path.join(ARCHIVE_DIR, f));
    ok++;
  } catch (e) {
    console.error(`  ✗ ${f}: ${(e as Error).message}`);
  }
}
console.log(`완료: ${ok}/${files.length} (적재 파일은 _ingested/로 이동)`);
