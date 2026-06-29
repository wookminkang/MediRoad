import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

type SP = Promise<{ q?: string }>;

async function searchHospitals(q: string) {
  if (!isSupabaseConfigured || q.trim().length < 2) return [];
  const { data } = await getSupabaseServer()
    .from("hospitals")
    .select("id, name, slug, type, sido, sigungu")
    .ilike("name", `%${q.trim()}%`)
    .limit(30);
  return data ?? [];
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const { q = "" } = await searchParams;
  const user = await getCurrentUser();
  const results = await searchHospitals(q);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral">관리자</h1>
          <p className="mt-1 text-sm text-muted">{user?.email}</p>
        </div>
        <SignOutButton />
      </div>

      <form className="mt-8" action="/admin">
        <label className="text-sm font-bold text-neutral">병원 검색</label>
        <div className="mt-2 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="병원 이름으로 검색 (2자 이상)"
            className="flex-1 rounded-lg border border-line px-3 py-2.5 text-base focus:border-[#1E5BD6] focus:outline-none focus:ring-2 focus:ring-[#1E5BD6]/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#1E5BD6] px-5 text-sm font-bold text-white hover:bg-[#1a4fbb]"
          >
            검색
          </button>
        </div>
      </form>

      {q.trim().length >= 2 && (
        <ul className="mt-6 divide-y divide-line rounded-2xl border border-line">
          {results.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted">
              검색 결과가 없습니다
            </li>
          )}
          {results.map((h) => (
            <li key={h.id}>
              <Link
                href={`/admin/hospitals/${h.slug}`}
                className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-neutral-weak"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-neutral">
                    {h.name}
                  </span>
                  <span className="block text-sm text-muted">
                    {h.type} · {h.sido} {h.sigungu}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-brand">
                  편집 →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
