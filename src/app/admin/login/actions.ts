"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE,
  ADMIN_PASSWORD,
  ADMIN_SECRET,
  ADMIN_USER,
} from "@/lib/admin-auth";

export async function login(formData: FormData) {
  const u = String(formData.get("username") ?? "");
  const p = String(formData.get("password") ?? "");
  if (u === ADMIN_USER && p === ADMIN_PASSWORD) {
    const c = await cookies();
    c.set(ADMIN_COOKIE, ADMIN_SECRET, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/admin");
  }
  redirect("/admin/login?error=1");
}

export async function logout() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
