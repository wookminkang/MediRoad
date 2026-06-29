"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { getSupabaseBrowser } from "@/lib/supabase/auth-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const sb = getSupabaseBrowser();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next || "/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-7 shadow-sm"
      >
        <h1 className="text-xl font-bold text-neutral">관리자 로그인</h1>
        <p className="mt-1 text-sm text-muted">MediRoad 운영 관리자 전용</p>

        <label className="mt-6 block text-sm font-medium text-neutral">
          이메일
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-base focus:border-[#1E5BD6] focus:outline-none focus:ring-2 focus:ring-[#1E5BD6]/20"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-neutral">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-base focus:border-[#1E5BD6] focus:outline-none focus:ring-2 focus:ring-[#1E5BD6]/20"
          />
        </label>

        {error && <p className="mt-3 text-sm text-warning">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[#1E5BD6] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a4fbb] disabled:opacity-50"
        >
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
