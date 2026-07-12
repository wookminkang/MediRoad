import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** 추가 클래스 (여백·정렬 보정) */
  className?: string;
  /** 최대폭 Tailwind 클래스 (기본 max-w-5xl=1024px). 예) "max-w-[900px]" */
  maxWidth?: string;
  /**
   * 모바일에서 상단 패딩을 없앤다 — 맨 위가 스티키 탭 바인 목록 페이지용.
   * (헤더 앱바 바로 아래 탭이 붙어야 하는데 48px이 뜨면 탭이 떠 보인다)
   */
  flushTop?: boolean;
};

/**
 * 페이지 공통 컨테이너 — 좌우 거터 + 최대폭 + 상하 패딩(페이지 수직 리듬). (DESIGN_SYSTEM §4-3)
 * 거터 px-4 md:px-6, 상단 pt-6, 하단 pb-14. 최대폭 기본 1024px(max-w-5xl).
 * 지도 등 풀폭 화면은 이 컨테이너를 쓰지 않고 자체 레이아웃 사용.
 */
export function PageContainer({
  children,
  className = "",
  maxWidth = "max-w-5xl",
  flushTop = false,
}: Props) {
  return (
    <div
      className={`mx-auto w-full ${maxWidth} px-4 md:px-6 ${
        flushTop ? "pb-16 pt-0 md:pt-12" : ""
      } ${className}`}
      // 헤더 ↔ 콘텐츠 상하 여백 (전 페이지 공통). inline = Tailwind 클래스 생성과 무관하게 보장.
      // flushTop은 미디어쿼리가 필요해 클래스로 처리하므로 인라인을 비운다.
      style={
        flushTop
          ? undefined
          : { paddingTop: "48px", paddingBottom: "64px" }
      }
    >
      {children}
    </div>
  );
}
