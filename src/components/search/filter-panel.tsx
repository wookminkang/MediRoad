"use client";

import { useState, type ReactNode } from "react";

/**
 * 필터 패널 래퍼 — 데스크톱은 항상 펼침(사이드바), 모바일은 토글 버튼으로 접기.
 * 모바일에서 긴 필터가 결과를 아래로 밀어내는 문제 해결.
 */
export function FilterPanel({
  children,
  activeCount,
}: {
  children: ReactNode;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* 모바일 토글 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl bg-neutral-weak px-4 py-3 text-sm font-bold text-neutral lg:hidden"
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          상세 필터
          {activeCount > 0 && (
            <span className="rounded-full bg-[#1E5BD6] px-1.5 py-0.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`text-subtle transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* 내용: 모바일은 open일 때만, 데스크톱은 항상 */}
      <div className={`${open ? "mt-3 block" : "hidden"} lg:mt-0 lg:block`}>
        {children}
      </div>
    </div>
  );
}
