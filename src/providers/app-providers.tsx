"use client";

import type { ReactNode } from "react";

import QueryProvider from "@/providers/query-provider";
import ThemeProvider from "@/providers/theme-provider";

/**
 * 앱 전역 Provider 합성 진입점.
 *
 * Provider 추가/제거/순서 변경은 모두 여기서 관리한다.
 * layout(Server Component)은 이 컴포넌트 하나만 알면 된다.
 *
 * 주의: "진짜 전역"인 것만 여기에 둔다.
 *  - 검색 필터 → URL searchParams
 *  - 지도↔목록 동기화 → /hospitals 범위의 feature-scoped Context
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
}
