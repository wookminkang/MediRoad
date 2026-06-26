/**
 * 기존 mock 칼럼을 Supabase columns 테이블로 시드.
 * 실행: node --env-file=.env.local --import tsx scripts/seed-columns.ts
 *   (먼저 supabase/migrations/0001_columns.sql 적용)
 */
import { createClient } from "@supabase/supabase-js";

import { MOCK_COLUMNS } from "../src/api/mock/columns";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "env 미설정: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const rows = MOCK_COLUMNS.map((c) => ({
  id: c.id,
  title: c.title,
  category: c.category,
  excerpt: c.excerpt,
  thumbnail: c.thumbnail ?? null,
  summary: c.summary,
  body_md: c.body,
  tags: c.tags ?? [],
  faqs: c.faqs ?? [],
  refs: c.references ?? [],
  related_departments: c.relatedDepartments ?? [],
  author: c.author,
  reviewed_by: c.reviewedBy,
  meta_title: c.seo?.title ?? null,
  meta_description: c.seo?.description ?? null,
  meta_keywords: c.seo?.keywords ?? null,
  og_image: c.seo?.ogImage ?? null,
  noindex: c.seo?.noindex ?? false,
  status: c.status,
  reading_minutes: c.readingMinutes,
  published_at: c.publishedAt,
}));

const { error } = await sb.from("columns").upsert(rows, { onConflict: "id" });

if (error) {
  console.error("시드 실패:", error.message);
  process.exit(1);
}

console.log(`✓ ${rows.length}개 칼럼 시드 완료`);
