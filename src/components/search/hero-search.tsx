import type { ReactNode } from "react";

type Props = {
  /** 제출 대상 라우트 */
  action?: string;
  /** 검색어 초기값 */
  defaultValue?: string;
  /** 입력 플레이스홀더 */
  placeholder?: string;
  /** 좌측 드롭다운 슬롯 (예: DepartmentSelect). 없으면 미표시 */
  select?: ReactNode;
};

/**
 * 알약형 검색 — (옵션)좌측 드롭다운 슬롯 + 검색어 + 원형 제출 버튼.
 * native <form method="get">라 키워드 검색은 JS 없이 동작·크롤 가능. (WIREFRAME 무JS 원칙)
 */
export function HeroSearch({
  action = "/hospitals",
  defaultValue,
  placeholder = "검색어를 입력해주세요",
  select,
}: Props) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="flex items-center gap-3 rounded-full px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#1E5BD6]/40"
      style={{
        backgroundColor: "var(--seed-color-bg-layer-default)",
        border: "1px solid var(--seed-color-stroke-neutral-weak)",
      }}
    >
      {/* 드롭다운 슬롯 (옵션) */}
      {select && (
        <>
          {select}
          <span
            aria-hidden
            className="h-6 w-px shrink-0"
            style={{ backgroundColor: "var(--seed-color-stroke-neutral-weak)" }}
          />
        </>
      )}

      {/* 검색어 */}
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-neutral focus:outline-none"
        style={{ fontSize: "16px" }}
      />

      {/* 원형 제출 버튼 */}
      <button
        type="submit"
        aria-label="검색"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral"
        style={{ backgroundColor: "var(--seed-color-bg-neutral-weak)" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
