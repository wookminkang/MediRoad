"use client";

import { useEffect, useRef, useState } from "react";

import type { TocItem } from "@/lib/headings";

/**
 * 포스트 목차 — 상단 sticky 가로 탭. 스크롤하면 헤더 아래로 따라붙고(top-0),
 * 현재 보고 있는 섹션 탭을 강조(스크롤 스파이). 탭 클릭 시 해당 H2로 스무스 이동.
 * 앵커 id는 마크다운 렌더러(makeSlugger)와 동일 규칙이라 그대로 매칭된다.
 */
export function PostToc({ headings }: { headings: TocItem[] }) {
  const tabs = headings.filter((t) => t.level === 2); // H2만 탭으로(H3 제외)
  const [active, setActive] = useState<string | undefined>(tabs[0]?.id);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabs.length < 2) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-64px 0px -70% 0px", threshold: 0 },
    );
    for (const t of tabs) {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [tabs]);

  // 활성 탭을 가로 바 안에서 보이도록 스크롤
  useEffect(() => {
    if (!active) return;
    const el = barRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  if (tabs.length < 2) return null;

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActive(id);
  };

  return (
    <nav
      aria-label="목차"
      className="sticky top-0 z-30 -mx-4 border-b border-black/[0.06] bg-white/95 px-4 backdrop-blur"
    >
      <div
        ref={barRef}
        className="flex gap-1.5 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => (
          <a
            key={t.id}
            data-id={t.id}
            href={`#${t.id}`}
            onClick={(e) => go(e, t.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              active === t.id
                ? "bg-brand-solid text-white"
                : "bg-neutral-weak text-muted hover:text-neutral"
            }`}
          >
            {t.text}
          </a>
        ))}
      </div>
    </nav>
  );
}
