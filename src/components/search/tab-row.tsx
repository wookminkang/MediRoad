"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import Link from "next/link";

export type TabItem = { id: string; label: string; href: string };

type Variant = "chip" | "underline";

/**
 * 카테고리 탭 — 한 줄 가로 스크롤.
 *
 * variant="chip"      : 알약 칩 + 우측 [∨] 전체 펼침. (병원 찾기 — 좌측 "필터" 버튼과 한 줄)
 * variant="underline" : 텍스트 + 밑줄 인디케이터. (건강정보·메디브리핑 — 올리브영 카테고리 탭)
 *
 * 칩을 wrap하면 모바일에서 2~4줄을 먹는다. 어느 쪽이든 평소엔 한 줄만 쓴다.
 */
export function TabRow({
  items,
  activeId,
  /** 좌측 고정 슬롯 (병원 찾기의 "필터" 버튼 등) */
  leading,
  variant = "chip",
}: {
  items: TabItem[];
  activeId?: string;
  leading?: React.ReactNode;
  variant?: Variant;
}) {
  const [expanded, setExpanded] = useState(false);

  // 카테고리를 고르면 URL이 바뀐다 → 펼침 닫기
  useEffect(() => {
    setExpanded(false);
  }, [activeId]);

  if (variant === "underline") {
    return <UnderlineTabs items={items} activeId={activeId} />;
  }

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

/**
 * 밑줄 탭 — 넘치면 가로 스크롤, 활성 탭은 가운데로 끌어온다.
 *
 * scrollIntoView는 조상까지 타고 올라가 페이지를 세로로도 움직인다(스티키 바 아래에서 특히 티가 난다).
 * 그래서 컨테이너의 scrollLeft만 직접 계산해 건드린다.
 */
function UnderlineTabs({
  items,
  activeId,
}: {
  items: TabItem[];
  activeId?: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    const active = activeRef.current;
    if (!list || !active) return;

    // offsetLeft는 offsetParent(여기선 sticky 컨테이너) 기준이라 스크롤 계산이 어긋난다.
    // 화면 좌표 차이로 구하면 어떤 조상 구조에서도 맞는다.
    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const delta =
      activeRect.left -
      listRect.left -
      (list.clientWidth - activeRect.width) / 2;

    list.scrollTo({
      left: Math.max(0, list.scrollLeft + delta),
      // 첫 렌더(딥링크 진입)는 즉시, 이후 탭 전환은 부드럽게
      behavior: mounted.current ? "smooth" : "auto",
    });
    mounted.current = true;
  }, [activeId]);

  return (
    <ul
      ref={listRef}
      className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto border-b border-black/[0.06] px-4 md:-mx-6 md:px-6"
    >
      {items.map((it) => {
        const active = activeId === it.id;
        return (
          <li
            key={it.id}
            ref={active ? activeRef : undefined}
            className="shrink-0"
          >
            <Link
              href={it.href}
              aria-current={active ? "true" : undefined}
              className={`-mb-px flex h-11 items-center whitespace-nowrap border-b-2 text-[15px] transition-colors ${
                active
                  ? "border-[#1E5BD6] font-bold text-[#1E5BD6]"
                  : "border-transparent font-medium text-[#8B95A1] hover:text-neutral"
              }`}
            >
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
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
