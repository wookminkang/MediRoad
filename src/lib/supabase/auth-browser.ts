"use client";

import { createBrowserClient } from "@supabase/ssr";

/** 브라우저용 인증 Supabase 클라이언트 (로그인 폼 등 클라이언트 컴포넌트) */
export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
