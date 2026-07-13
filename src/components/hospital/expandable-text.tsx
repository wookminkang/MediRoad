"use client";

import { useState } from "react";

/**
 * 긴 소개글 접기/펼치기.
 *
 * line-clamp로 "잘라 보여줄" 뿐, 텍스트는 DOM에 통째로 남는다.
 * 조건부 렌더나 display:none으로 감추면 크롤러·AI가 못 읽고,
 * 숨긴 콘텐츠로 오해받을 수도 있다. 소개글은 GEO 자산이라 지워선 안 된다.
 */
export function ExpandableText({
  text,
  /** 접었을 때 보여줄 줄 수 */
  lines = 3,
}: {
  text: string;
  lines?: 2 | 3 | 4;
}) {
  const [open, setOpen] = useState(false);

  const clamp: Record<number, string> = {
    2: "line-clamp-2",
    3: "line-clamp-3",
    4: "line-clamp-4",
  };

  return (
    <div className="mt-6">
      <p
        className={`text-[15px] leading-relaxed text-neutral sm:text-base ${
          open ? "" : clamp[lines]
        }`}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-bold text-brand"
      >
        {open ? "접기" : "더보기"}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
