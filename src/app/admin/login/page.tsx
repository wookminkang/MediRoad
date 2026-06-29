import type { Metadata } from "next";

import { login } from "./actions";

export const metadata: Metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        action={login}
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-7 shadow-sm"
      >
        <h1 className="text-xl font-bold text-neutral">관리자 로그인</h1>
        <p className="mt-1 text-sm text-muted">MediRoad 운영 관리자 전용</p>

        <label className="mt-6 block text-sm font-medium text-neutral">
          아이디
          <input
            name="username"
            required
            autoComplete="username"
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-base focus:border-[#1E5BD6] focus:outline-none focus:ring-2 focus:ring-[#1E5BD6]/20"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-neutral">
          비밀번호
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-base focus:border-[#1E5BD6] focus:outline-none focus:ring-2 focus:ring-[#1E5BD6]/20"
          />
        </label>

        {error && (
          <p className="mt-3 text-sm text-warning">
            아이디 또는 비밀번호가 올바르지 않습니다.
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-[#1E5BD6] py-2.5 text-sm font-bold text-white hover:bg-[#1a4fbb]"
        >
          로그인
        </button>
      </form>
    </div>
  );
}
