"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

/**
 * 지도(/map) 페이지에서 전역 푸터를 전 화면에서 숨긴다.
 * → 헤더는 유지하고 지도가 뷰포트를 꽉 채우는 풀스크린 지도 UX.
 */
export function ChromeOnMap({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMap = pathname === "/map" || pathname.startsWith("/map/");
  return <div className={isMap ? "hidden" : "contents"}>{children}</div>;
}
