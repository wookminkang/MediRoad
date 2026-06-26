"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

/**
 * 지도(/map) 페이지에서 모바일에 한해 전역 크롬(헤더/푸터)을 숨긴다.
 * → 지도 풀스크린(필터 영역만 노출). 데스크톱(md↑)은 그대로 유지.
 */
export function ChromeOnMap({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMap = pathname === "/map" || pathname.startsWith("/map/");
  return <div className={isMap ? "hidden md:block" : "contents"}>{children}</div>;
}
