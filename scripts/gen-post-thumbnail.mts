/**
 * 병원 포스트 썸네일 — 배경으로 병원 실사진을 쓴다.
 * 합성(스크림·병원명·제목·장식)은 lib/post-thumb.mts 공용 로직.
 * 병원 사진이 없거나 포스트 수가 사진 수를 크게 넘으면 gen-post-thumbnail-ai.mts를 쓴다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/gen-post-thumbnail.mts [postId]
 *   - postId 생략 시: 병원 대표사진이 있는 published 포스트 전부 재생성
 */
import { createClient } from "@supabase/supabase-js";

import { curatedPostIndex } from "../src/constants/hospital-keyword-pages.js";
import { BUCKET, compose, seedOf } from "./lib/post-thumb.mjs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

async function hospitalPhotos(hospitalId: string): Promise<string[]> {
  const { data } = await sb
    .from("hospital_photos")
    .select("url,is_primary,sort_order")
    .eq("hospital_id", hospitalId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r) => r.url).filter(Boolean);
}

async function genOne(postId: string) {
  const { data: post } = await sb
    .from("hospital_posts")
    .select("id,title,tags,hospital_id,hospital:hospitals(name,sigungu)")
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
  // 가이드에 묶인 포스팅은 순번(0,1,2…)으로 액센트·사진을 배정 → 같은 캐러셀 안에서 서로 겹치지 않음.
  // 그 외(가이드 밖)는 id 해시로 결정적 배정.
  const gi = curatedPostIndex(post.id);
  const seed = gi >= 0 ? gi : seedOf(post.id);
  const photoUrl = photos[seed % photos.length]; // 포스트마다 다른 사진
  const region = (hosp?.sigungu ?? "").replace(/[구시군]$/, "");
  // 병원명에 이미 지점(괄호)이 있으면 지역을 덧붙이지 않는다. 예: "리움한방병원(강동송파)"
  const baseName = hosp?.name ?? "";
  const nameText = /[()]/.test(baseName)
    ? baseName
    : region
      ? `${baseName} (${region})`
      : baseName;
  const photo = Buffer.from(await (await fetch(photoUrl)).arrayBuffer());
  const eyebrow = Array.isArray(post.tags) ? (post.tags[0] as string) : undefined;
  const webp = await compose(photo, nameText, post.title, seed, eyebrow);
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
