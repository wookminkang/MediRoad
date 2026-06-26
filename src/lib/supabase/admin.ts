import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * 관리용 Supabase 클라이언트 (service_role 키 — RLS 우회).
 * 서버 전용: MCP 쓰기·시드에서만 사용. 절대 클라이언트 번들에 노출 금지.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service env 미설정: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
