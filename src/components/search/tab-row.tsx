"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

export type TabItem = { id: string; label: string; href: string };

/**
 * 카테고리 탭 — 한 줄 가로 스크롤 + 우측 [∨]로 전체 펼침. (올리브영 카테고리 탭 패턴)
 *
 * 칩을 wrap하면 모바일에서 2~4줄을 먹는다. 평소엔 한 줄만 쓰고, 전체 목록이 필요할 때만
 * 아래로 펼친다. 펼침 패널은 absolute라 리스트를 밀어내지 않는다.
 */
export function TabRow({
  items,
  activeId,
  /** 좌측 고정 슬롯 (병원 찾기의 "필터" 버튼 등) */
  leading,
}: {
  items: TabItem[];
  activeId?: string;
  leading?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  // 카테고리를 고르면 URL이 바뀐다 → 펼침 닫기
  useEffect(() => {
    setExpanded(false);
  }, [activeId]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {leading}

        <ul className="no-scrollbar -mx-1 flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto px-1 py-0.5">
          {items.map((it) => (
            <li key={it.id} className="shrink-0 snap-start">
              <Chip href={it.href} active={activeId === it.id}>
                {it.label}
              </Chip>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "카테고리 접기" : "카테고리 전체 보기"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-subtle transition-colors hover:bg-neutral-weak"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* 전체 펼침 — absolute라 리스트를 아래로 밀지 않는다 */}
      {expanded && (
        <>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setExpanded(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-2xl bg-white p-3 shadow-[0_8px_28px_rgba(0,0,0,0.14)]">
            <ul className="flex flex-wrap gap-2">
              {items.map((it) => (
                <li key={it.id}>
                  <Chip href={it.href} active={activeId === it.id}>
                    {it.label}
                  </Chip>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-bold transition-colors ${
        active
          ? "bg-brand-weak text-brand"
          : "bg-[#F3F5FB] text-neutral hover:bg-[#E9EDF7]"
      }`}
    >
      {children}
    </Link>
  );
}
