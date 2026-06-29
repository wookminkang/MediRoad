import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "mr_admin";
const SECRET = process.env.ADMIN_SESSION_SECRET ?? "mr-admin-7f3a9c2e1b6d4a8f";

/** /admin/* 보호 — 관리자 쿠키 없으면 /admin/login 으로 (login 자체는 허용) */
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/admin/login")) return NextResponse.next();
  if (req.cookies.get(COOKIE)?.value === SECRET) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
