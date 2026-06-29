import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 쿠키 기반 인증 Supabase 클라이언트 (RSC/route handler/server action).
 * 로그인 세션을 읽어 현재 사용자 확인용. (쓰기는 service_role 어드민 클라이언트 사용)
 */
export async function getSupabaseAuthServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // RSC에서 set 호출 시 무시 (미들웨어가 세션 갱신 담당)
          }
        },
      },
    },
  );
}

/** 현재 로그인 사용자 (없으면 null) */
export async function getCurrentUser() {
  const sb = await getSupabaseAuthServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}
