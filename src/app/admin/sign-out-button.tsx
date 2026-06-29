"use client";

import { useRouter } from "next/navigation";

import { getSupabaseBrowser } from "@/lib/supabase/auth-browser";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await getSupabaseBrowser().auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
    >
      로그아웃
    </button>
  );
}
