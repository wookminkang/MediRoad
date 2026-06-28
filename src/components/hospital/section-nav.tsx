"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

/** 상세페이지 좌측 sticky 섹션 내비 — 스크롤 위치에 따라 active 표시 */
export function SectionNav({
  items,
}: {
  items: { id: string; label: string; icon: ReactNode }[];
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav className="sticky top-24 flex flex-col gap-1">
      {items.map((it) => {
        const on = active === it.id;
        return (
          <a
            key={it.id}
            href={`#${it.id}`}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
              on ? "bg-brand-weak text-brand" : "text-muted hover:bg-neutral-weak"
            }`}
          >
            <span className={on ? "text-brand" : "text-subtle"}>{it.icon}</span>
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
