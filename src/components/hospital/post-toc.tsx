"use client";

import { useEffect, useState } from "react";

import type { TocItem } from "@/lib/headings";

/** docs 스타일 "On this page" 목차 — 스크롤 위치에 따라 활성 헤딩 강조 */
export function PostToc({ headings }: { headings: TocItem[] }) {
  const [active, setActive] = useState<string>(headings[0]?.id ?? "");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav aria-label="목차" className="text-sm">
      <p className="flex items-center gap-2 font-bold text-neutral">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h12" />
        </svg>
        On this page
      </p>
      <ul className="mt-3 border-l border-line">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={() => setActive(h.id)}
              className={`-ml-px block border-l-2 py-1.5 transition-colors ${
                h.level === 3 ? "pl-7" : "pl-4"
              } ${
                active === h.id
                  ? "border-brand font-bold text-neutral"
                  : "border-transparent text-muted hover:text-neutral"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
