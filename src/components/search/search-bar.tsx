import { ActionButton } from "@seed-design/react";

type Props = {
  /** 검색어 초기값 (검색 결과 페이지에서 q 반영) */
  defaultValue?: string;
  /** 제출 대상 라우트 */
  action?: string;
  /** 입력 플레이스홀더 */
  placeholder?: string;
};

/**
 * 검색 바 — 네이티브 `<form method="get">`로 JS 없이 동작·크롤 가능. (WIREFRAME 설계원칙 "무JS 동작")
 * Seed 토큰으로 스타일링한 native input + Seed ActionButton(large CTA, brandSolid).
 * (Seed TextField는 use-client 상태 컴포넌트라 무JS native form 제약상 native input 채택 — DESIGN_SYSTEM 규칙 #2)
 */
export function SearchBar({
  defaultValue,
  action = "/hospitals",
  placeholder = "병원명·증상·진료과목 검색",
}: Props) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="flex w-full items-stretch gap-2"
    >
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-13 min-w-0 flex-1 px-4"
        style={{
          backgroundColor: "var(--seed-color-bg-layer-default)",
          border: "1px solid var(--seed-color-stroke-neutral-solid)",
          borderRadius: "var(--seed-radius-r4)",
          color: "var(--seed-color-fg-neutral)",
          fontSize: "16px",
        }}
      />
      <ActionButton type="submit" variant="brandSolid" size="large">
        검색
      </ActionButton>
    </form>
  );
}
