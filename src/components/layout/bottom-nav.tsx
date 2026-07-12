"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SECTIONS, matchSection } from "@/constants/nav";

/**
 * 하단 탭바 — 앱 쉘(640px)이라 데스크톱에서도 그대로 쓴다.
 *
 * 항목은 constants/nav의 SECTIONS(앱바 타이틀과 공유)에서 가져온다 — 아이콘만 여기서 붙인다.
 * 지도(/map)에서는 숨긴다 — 풀스크린 지도 + 하단 시트(mobile-bottom-sheet)와 자리가 겹친다.
 * fixed라 문서 최하단을 가리므로, 같은 높이의 스페이서를 흐름에 함께 넣는다.
 * fixed는 뷰포트 기준이라 .shell-fixed로 쉘 폭 안에 가둔다.
 */

const ICONS: Record<string, (active: boolean) => React.ReactNode> = {
  "/": (a) => <HomeIcon active={a} />,
  "/hospitals": (a) => <HospitalIcon active={a} />,
  "/map": (a) => <PinIcon active={a} />,
  "/health": (a) => <HeartIcon active={a} />,
  "/briefing": (a) => <BriefingIcon active={a} />,
};

const TABS = [
  { href: "/", label: "홈" },
  ...SECTIONS.filter((s) => s.tab).map((s) => ({
    href: s.href,
    label: s.label,
  })),
];

const BAR_H = "3.5rem"; // 56px

export function BottomNav() {
  const pathname = usePathname();
  const hidden = useHideOnScrollDown();

  // 지도는 풀스크린 UX — 탭바·스페이서 모두 렌더하지 않는다.
  if (pathname === "/map" || pathname.startsWith("/map/")) return null;

  const current = matchSection(pathname);

  return (
    <>
      {/* fixed 탭바가 문서 최하단을 덮지 않도록 같은 높이만큼 흐름에 자리를 만든다 */}
      <div
        aria-hidden
        style={{ height: `calc(${BAR_H} + env(safe-area-inset-bottom))` }}
      />

      {/*
       * z-20 — 전체화면 오버레이(SearchTrigger 패널)보다 반드시 아래여야 한다.
       * 그 패널들은 z-50이지만 조상이 스태킹 컨텍스트를 만들어(헤더 z-40, 목록 스티키바 z-30)
       * 실효 z가 조상값으로 잘린다. 탭바가 z-40이면 DOM 순서상 나중이라 패널을 뚫고 올라온다.
       * 본문(비포지셔닝)보다는 위, 그 컨텍스트들보다는 아래인 z-20이 맞는 자리.
       */}
      <nav
        aria-label="하단 메뉴"
        className={`shell-fixed bottom-0 z-20 border-t border-black/[0.06] bg-white transition-transform duration-300 ${
          hidden ? "translate-y-full" : "translate-y-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-md items-stretch">
          {TABS.map((it) => {
            const active =
              it.href === "/" ? pathname === "/" : current?.href === it.href;
            return (
              <li key={it.href} className="flex-1">
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-14 flex-col items-center justify-center gap-1 transition-colors ${
                    active ? "text-[#1E5BD6]" : "text-[#8B95A1]"
                  }`}
                >
                  {ICONS[it.href]?.(active)}
                  <span
                    className={`text-[10px] leading-none ${
                      active ? "font-bold" : "font-medium"
                    }`}
                  >
                    {it.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/**
 * 아래로 스크롤하면 감추고, 위로 올리면 다시 올라온다 (모바일 앱 하단바 패턴).
 *
 * - 임계값(6px)을 둬서 iOS 바운스·손떨림으로 깜빡이지 않게 한다.
 * - 최상단 근처(80px 이내)에서는 항상 보인다 — 화면 진입 직후 사라지면 안 된다.
 * - rAF로 묶어 스크롤 이벤트마다 setState 하지 않는다.
 */
function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - last;
        if (Math.abs(dy) > 6) {
          setHidden(dy > 0 && y > 80);
          last = y;
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}

/* ── 아이콘 ── 활성: 면(currentColor) 채움 + 흰색 디테일 / 비활성: 선만 ── */

type IconProps = { active: boolean };

/** 활성이면 채움, 비활성이면 선. 채움 위 디테일은 흰색으로 뒤집는다. */
function tones(active: boolean) {
  return {
    fill: active ? "currentColor" : "none",
    detail: active ? "#fff" : "currentColor",
  };
}

const SVG = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function HomeIcon({ active }: IconProps) {
  const { fill } = tones(active);
  return (
    <svg {...SVG}>
      <path
        d="M3.6 10.4 12 3.4l8.4 7v9.1a1.1 1.1 0 0 1-1.1 1.1h-4.2v-5.3H8.9v5.3H4.7a1.1 1.1 0 0 1-1.1-1.1z"
        fill={fill}
      />
    </svg>
  );
}

function HospitalIcon({ active }: IconProps) {
  const { fill, detail } = tones(active);
  return (
    <svg {...SVG}>
      <rect x="4" y="4.2" width="16" height="16" rx="3.2" fill={fill} />
      <path d="M12 8.6v7.2M8.4 12.2h7.2" stroke={detail} strokeWidth="1.9" />
    </svg>
  );
}

function PinIcon({ active }: IconProps) {
  const { fill, detail } = tones(active);
  return (
    <svg {...SVG}>
      <path
        d="M12 2.9c-3.8 0-6.8 3-6.8 6.7 0 4.7 5.3 10 6.2 11a.8.8 0 0 0 1.2 0c.9-1 6.2-6.3 6.2-11 0-3.7-3-6.7-6.8-6.7Z"
        fill={fill}
      />
      <circle cx="12" cy="9.4" r="2.5" fill={active ? "#fff" : "none"} stroke={detail} />
    </svg>
  );
}

function HeartIcon({ active }: IconProps) {
  const { fill } = tones(active);
  return (
    <svg {...SVG}>
      <path
        d="M12 20.1c-1.3-.9-7.4-5-7.4-9.7a4.2 4.2 0 0 1 7.4-2.8 4.2 4.2 0 0 1 7.4 2.8c0 4.7-6.1 8.8-7.4 9.7Z"
        fill={fill}
      />
    </svg>
  );
}

function BriefingIcon({ active }: IconProps) {
  const { fill, detail } = tones(active);
  return (
    <svg {...SVG}>
      <rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2.8" fill={fill} />
      <path
        d="M7 9.2h6M7 12.6h10M7 15.8h7"
        stroke={detail}
        strokeWidth="1.7"
      />
    </svg>
  );
}
