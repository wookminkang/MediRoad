"use client";

import Link from "next/link";

/**
 * 공용 에러 UI — 라우트 error.tsx에서 재사용. "다시 시도"(reset) + 홈 링크.
 * 데이터/네트워크 장애 시 페이지 전체 붕괴 대신 이 화면을 보여준다.
 */
export function ErrorState({
  reset,
  title = "잠시 문제가 발생했어요",
  description = "일시적인 오류일 수 있어요. 다시 시도해 주세요.",
}: {
  reset?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-weak text-subtle">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </span>
      <h1 className="mt-5 text-lg font-bold text-neutral">{title}</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {reset && (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-[#1E5BD6] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a4fbb]"
          >
            다시 시도
          </button>
        )}
        <Link
          href="/"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
