/**
 * 병원 사진 업로드 — 로컬 폴더의 사진을 Supabase Storage에 올리고 hospital_photos에 등록.
 *
 * 사용법:
 *   1) 프로젝트 루트에 `hospital-photos/<병원slug>/` 폴더를 만들고 사진을 넣는다.
 *      파일명 앞 숫자 = 표시 순서(첫 장이 대표). 예) 01.jpg, 02.jpg …
 *      예) hospital-photos/리움한방병원-강동구/01.jpg, 02.jpg, 03.jpg
 *   2) 실행: node --env-file=.env.local --import tsx scripts/upload-hospital-photos.mts
 *
 * - 최대 5장까지 업로드(상세페이지도 5장 표시). 재실행하면 해당 병원 사진을 교체.
 * - 카테고리 구분 없이 "병원 사진"으로 등록.
 */
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const BUCKET = "hospital-images";
const ROOT = path.resolve("hospital-photos");
const MAX = 5;
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// 버킷 보장(없으면 생성, 공개)
await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});

if (!existsSync(ROOT)) {
  console.error(`'${ROOT}' 폴더가 없습니다. hospital-photos/<병원slug>/ 구조로 사진을 넣어주세요.`);
  process.exit(1);
}

const slugs = (await readdir(ROOT, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

if (!slugs.length) {
  console.log("업로드할 병원 폴더가 없습니다.");
  process.exit(0);
}

for (const slug of slugs) {
  const { data: h } = await sb
    .from("hospitals")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!h) {
    console.error(`[건너뜀] slug '${slug}' 에 해당하는 병원이 없습니다.`);
    continue;
  }

  const dir = path.join(ROOT, slug);
  const files = (await readdir(dir))
    .filter((f) => EXT.has(path.extname(f).toLowerCase()))
    .sort()
    .slice(0, MAX);
  if (!files.length) {
    console.error(`[건너뜀] ${slug}: 이미지 파일이 없습니다.`);
    continue;
  }

  // 기존 사진 교체(재실행 안전) — 스토리지 + DB 정리
  await sb.storage
    .from(BUCKET)
    .remove(Array.from({ length: MAX + 5 }, (_, i) => `${h.id}/${i}.webp`))
    .catch(() => {});
  await sb.from("hospital_photos").delete().eq("hospital_id", h.id);

  const rows: {
    hospital_id: string;
    url: string;
    alt: string;
    category: null;
    is_primary: boolean;
    sort_order: number;
  }[] = [];

  for (let i = 0; i < files.length; i++) {
    const buf = await sharp(await readFile(path.join(dir, files[i])))
      .rotate() // EXIF 회전 보정
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const key = `${h.id}/${i}.webp`;
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(key, buf, { contentType: "image/webp", upsert: true });
    if (error) {
      console.error(`  업로드 실패 ${key}: ${error.message}`);
      continue;
    }
    const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
    rows.push({
      hospital_id: h.id,
      url,
      alt: `${h.name} 병원 사진 ${i + 1}`,
      category: null,
      is_primary: i === 0,
      sort_order: i,
    });
  }

  if (rows.length) {
    const { error } = await sb.from("hospital_photos").insert(rows);
    if (error) {
      console.error(`  DB 등록 실패: ${error.message}`);
      continue;
    }
  }
  console.log(`✓ ${h.name} (${slug}) — ${rows.length}장 업로드`);
}

console.log("완료");
