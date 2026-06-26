"use client";

import { useEffect, type ReactNode } from "react";

/**
 * 테마 — light-only 고정. (DESIGN_SYSTEM 다크모드 정책)
 * 과거 system/dark 로직 제거: OS 다크모드를 따라가던 colorScheme:dark·`dark` 클래스가
 * 라이트 정책과 충돌(배경 검정)해 라이트로 강제한다.
 * (다크 도입 시 data-seed-color-mode='system' + generateThemingScript로 재구성)
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }, []);

  return <>{children}</>;
}
