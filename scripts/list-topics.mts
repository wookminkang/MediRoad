/**
 * Supabase columns 의 기존 주제(제목+카테고리)를 출력. 일일 자동발행의 중복 방지용.
 * draft·hidden 포함 전체를 보기 위해 service_role 사용.
 * 실행: node --env-file=.env.local --import tsx scripts/list-topics.mts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("env 미설정");
  process.exit(1);
}
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data, error } = await sb
  .from("columns")
  .select("title, category, tags")
  .order("created_at", { ascending: false });

if (error) {
  console.error(error.message);
  process.exit(1);
}

for (const r of data ?? []) {
  const tags = Array.isArray(r.tags) ? (r.tags as string[]).join(", ") : "";
  console.log(`- ${r.title} [${r.category}]${tags ? ` (${tags})` : ""}`);
}
