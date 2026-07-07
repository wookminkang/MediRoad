"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/map", label: "내 주변 병원", icon: <MapPinIcon /> },
  // 증상·질환 보류 — 다시 노출하려면 주석 해제
  // { href: "/conditions", label: "증상·질환" },
  { href: "/health", label: "건강정보", icon: <HealthIcon /> },
  { href: "/briefing", label: "메디브리핑", icon: <BriefingIcon /> },
  { href: "/faq", label: "FAQ", icon: <FaqIcon /> },
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
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-bold transition-colors ${
                      active
                        ? "bg-brand-weak text-brand"
                        : "text-neutral hover:bg-neutral-weak"
                    }`}
                  >
                    <span className="shrink-0">{it.icon}</span>
                    {it.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-line p-4">
              <Link
                href="/hospitals"
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

/* ── 모바일 메뉴 듀오톤 아이콘 (토스풍: 연한 채움 + 브랜드블루 + 포인트컬러) ── */
const D_TINT = "#D6E4FF";
const D_TINT2 = "#AEC8FA";
const D_BRAND = "#1E5BD6";

function MapPinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.2c-3.9 0-7 3-7 6.9 0 4.9 5.5 10.6 6.4 11.6a.8.8 0 0 0 1.2 0c.9-1 6.4-6.7 6.4-11.6 0-3.9-3.1-6.9-7-6.9Z"
        fill={D_BRAND}
      />
      <circle cx="12" cy="9.1" r="2.6" fill="#fff" />
    </svg>
  );
}
function HealthIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="3.6" fill={D_TINT} />
      <rect x="7" y="13" width="10" height="1.8" rx="0.9" fill={D_BRAND} />
      <rect x="7" y="16.4" width="6.5" height="1.8" rx="0.9" fill={D_BRAND} />
      <path
        d="M12 5.1c-.95-1.05-2.75-.6-2.75.95 0 1.3 1.6 2.45 2.75 3.15 1.15-.7 2.75-1.85 2.75-3.15 0-1.55-1.8-2-2.75-.95Z"
        fill="#F0466E"
      />
    </svg>
  );
}
function BriefingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" fill={D_TINT} />
      <rect x="6.4" y="7.6" width="6.5" height="4.2" rx="1.2" fill={D_BRAND} />
      <rect x="14" y="7.8" width="3.6" height="1.5" rx="0.75" fill={D_TINT2} />
      <rect x="14" y="10.6" width="3.6" height="1.5" rx="0.75" fill={D_TINT2} />
      <rect x="6.4" y="14" width="11.2" height="1.6" rx="0.8" fill={D_BRAND} />
      <rect x="6.4" y="16.6" width="7.5" height="1.6" rx="0.8" fill={D_TINT2} />
      <circle cx="18.3" cy="6.2" r="2.1" fill="#FBB13C" />
    </svg>
  );
}
function FaqIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.2" fill={D_BRAND} />
      <path
        d="M9.5 9.3a2.6 2.6 0 0 1 5-.1c0 1.7-2.5 1.9-2.5 3.5"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="16.3" r="1.15" fill="#fff" />
    </svg>
  );
}
