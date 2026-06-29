"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import sharp from "sharp";

import { isAdminAuthed } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "hospital-images";
const MAX = 5;

async function requireAdmin() {
  if (!(await isAdminAuthed())) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

function refresh(slug: string) {
  revalidatePath(`/admin/hospitals/${slug}`);
  revalidatePath(`/hospitals/${slug}`);
}

/** 사진 업로드 — 최대 5장까지 추가(sharp 리사이즈 → Storage → hospital_photos) */
export async function uploadPhotos(slug: string, formData: FormData) {
  await requireAdmin();
  const sb = getSupabaseAdmin();
  const { data: h } = await sb
    .from("hospitals")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!h) throw new Error("병원을 찾을 수 없습니다.");

  await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return;

  const { data: cur } = await sb
    .from("hospital_photos")
    .select("id, is_primary, sort_order")
    .eq("hospital_id", h.id);
  let count = cur?.length ?? 0;
  let hasPrimary = (cur ?? []).some((p) => p.is_primary);
  let order = Math.max(0, ...(cur ?? []).map((p) => p.sort_order ?? 0)) + 1;

  const rows: {
    hospital_id: string;
    url: string;
    alt: string;
    is_primary: boolean;
    sort_order: number;
  }[] = [];

  for (const file of files) {
    if (count >= MAX) break;
    const buf = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const key = `${h.id}/${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(key, buf, { contentType: "image/webp", upsert: true });
    if (error) throw error;
    const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
    const makePrimary = !hasPrimary;
    rows.push({
      hospital_id: h.id,
      url,
      alt: `${h.name} 병원 사진`,
      is_primary: makePrimary,
      sort_order: order++,
    });
    if (makePrimary) hasPrimary = true;
    count++;
  }

  if (rows.length) {
    const { error } = await sb.from("hospital_photos").insert(rows);
    if (error) throw error;
  }
  refresh(slug);
}

/** 사진 삭제 (Storage + DB) */
export async function deletePhoto(slug: string, photoId: string) {
  await requireAdmin();
  const sb = getSupabaseAdmin();
  const { data: row } = await sb
    .from("hospital_photos")
    .select("id, url")
    .eq("id", photoId)
    .maybeSingle();
  if (row?.url) {
    const marker = `/${BUCKET}/`;
    const i = row.url.indexOf(marker);
    if (i >= 0) {
      await sb.storage
        .from(BUCKET)
        .remove([row.url.slice(i + marker.length)])
        .catch(() => {});
    }
  }
  await sb.from("hospital_photos").delete().eq("id", photoId);
  refresh(slug);
}

/** 대표 사진 지정 */
export async function setPrimaryPhoto(
  slug: string,
  hospitalId: string,
  photoId: string,
) {
  await requireAdmin();
  const sb = getSupabaseAdmin();
  await sb
    .from("hospital_photos")
    .update({ is_primary: false })
    .eq("hospital_id", hospitalId);
  await sb.from("hospital_photos").update({ is_primary: true }).eq("id", photoId);
  refresh(slug);
}

/** 병원 정보 편집 (소개·홈페이지·예약·전화) */
export async function updateInfo(slug: string, formData: FormData) {
  await requireAdmin();
  const sb = getSupabaseAdmin();
  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v ? v : null;
  };
  await sb
    .from("hospitals")
    .update({
      description: str("description"),
      homepage_url: str("homepage_url"),
      booking_url: str("booking_url"),
      phone: str("phone"),
    })
    .eq("slug", slug);
  refresh(slug);
  redirect(`/admin/hospitals/${slug}?saved=info`);
}
