/**
 * 관리자 허용목록 — ADMIN_EMAILS(콤마 구분) 환경변수에 등록된 이메일만 admin.
 * (Supabase Auth 로그인 사용자의 이메일과 대조)
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
