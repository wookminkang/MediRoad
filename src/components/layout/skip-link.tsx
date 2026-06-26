/**
 * 본문 바로가기 (접근성) — 평소 숨김, 포커스 시 노출. (WIREFRAME §3)
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
      style={{
        backgroundColor: "var(--seed-color-bg-brand-solid)",
        color: "var(--seed-color-fg-static-white)",
        borderRadius: "var(--seed-radius-r2)",
      }}
    >
      본문 바로가기
    </a>
  );
}
