"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/map", label: "내 주변 병원" },
  // 증상·질환 보류 — 다시 노출하려면 주석 해제
  // { href: "/conditions", label: "증상·질환" },
  { href: "/health", label: "건강정보" },
  { href: "/briefing", label: "메디브리핑" },
  { href: "/faq", label: "FAQ" },
];

/** 모바일 헤더 메뉴 — 햄버거 토글 + 드로어. (md 미만에서만 노출) */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 경로 바뀌면 닫기
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setOpen(false), [pathname]);

  // 열렸을 때 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="메뉴 열기"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral transition-colors hover:bg-neutral-weak"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* 배경 */}
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          {/* 우측 드로어 */}
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <span className="text-base font-bold text-neutral">메뉴</span>
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral transition-colors hover:bg-neutral-weak"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav aria-label="모바일 메뉴" className="flex flex-col p-2">
              {ITEMS.map((it) => {
                const active =
                  pathname === it.href || pathname.startsWith(`${it.href}/`);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`rounded-lg px-4 py-3 text-[15px] font-bold transition-colors ${
                      active
                        ? "bg-brand-weak text-brand"
                        : "text-neutral hover:bg-neutral-weak"
                    }`}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-line p-4">
              <Link
                href="/map"
                className="flex h-11 items-center justify-center rounded-xl bg-[#1E5BD6] text-[15px] font-bold text-white"
              >
                병원 찾기
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
