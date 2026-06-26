import { createClient } from "@supabase/supabase-js";

/**
 * 읽기 전용 Supabase 클라이언트 (anon 키). RSC/SSG에서 공개 데이터 조회.
 * RLS 공개 정책(게시글만)이 적용된다. env 미설정 시 isSupabaseConfigured=false.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export function getSupabaseServer() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env 미설정: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
