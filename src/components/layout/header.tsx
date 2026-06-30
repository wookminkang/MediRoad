import Image from "next/image";
import Link from "next/link";

import { ActionButton } from "@seed-design/react";

import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

/**
 * 전역 헤더 (banner) — 로고 + 주요 내비. sticky. (WIREFRAME §3)
 * Server Component. 색·radius=Seed 토큰, 레이아웃=Tailwind.
 */
export function Header() {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        backgroundColor: "var(--seed-color-bg-layer-default)",
        borderBottom: "1px solid var(--seed-color-stroke-neutral-weak)",
      }}
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="메디로드 홈" className="flex items-center">
          <Image
            src="/mediroad_logo.svg"
            alt="MediRoad"
            width={86}
            height={43}
            priority
          />
        </Link>

        {/* 데스크톱 내비 */}
        <nav
          aria-label="주요 메뉴"
          className="hidden items-center gap-2 md:flex"
        >
          {/* 병원 카테고리 보류 — 다시 노출하려면 주석 해제
          <NavLink href="/hospitals">병원</NavLink>
          */}
          <NavLink href="/map">내 주변 병원</NavLink>
          {/* 증상·질환 보류 — 다시 노출하려면 주석 해제
          <NavLink href="/conditions">증상·질환</NavLink>
          */}
          <NavLink href="/health">건강정보</NavLink>
          <NavLink href="/faq">FAQ</NavLink>
          <ActionButton asChild variant="brandSolid" size="small">
            <Link href="/map">병원 찾기</Link>
          </ActionButton>
        </nav>

        {/* 모바일 햄버거 메뉴 */}
        <MobileMenu />
      </div>
    </header>
  );
}
