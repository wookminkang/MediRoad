"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Text } from "@seed-design/react";

/** 헤더 내비 링크 — 현재 경로면 active(브랜드색·볼드). 하위 경로 포함(/health → /health/[id]). */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className="px-2 py-1"
      aria-current={active ? "page" : undefined}
    >
      <Text
        as="span"
        textStyle={active ? "t5Bold" : "t5Medium"}
        className={active ? "text-brand" : "text-neutral"}
      >
        {children}
      </Text>
    </Link>
  );
}
