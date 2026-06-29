import "server-only";

import { cookies } from "next/headers";

/** 단순 관리자 게이트 — env로 덮어쓸 수 있음(기본 master/1234). 쿠키 세션. */
export const ADMIN_COOKIE = "mr_admin";
export const ADMIN_USER = process.env.ADMIN_USER ?? "master";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "1234";
export const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "mr-admin-7f3a9c2e1b6d4a8f";

/** 현재 요청이 관리자 인증 쿠키를 가졌는지 (서버 컴포넌트/액션용) */
export async function isAdminAuthed(): Promise<boolean> {
  const c = await cookies();
  return c.get(ADMIN_COOKIE)?.value === ADMIN_SECRET;
}
