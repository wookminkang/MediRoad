import { PageContainer } from "@/components/ui/page-container";

/** 건강 칼럼 로딩 스켈레톤 — 헤더 + 검색 + 탭 + 카드 그리드. */
export default function Loading() {
  const block = {
    backgroundColor: "var(--seed-color-bg-layer-fill)",
    borderRadius: "var(--seed-radius-r3)",
  } as const;

  return (
    <PageContainer maxWidth="max-w-7xl">
      {/* 헤더 */}
      <div className="h-9 w-40 animate-pulse" style={block} />
      <div className="mt-3 h-5 w-72 max-w-full animate-pulse" style={block} />

      {/* 검색 */}
      <div className="mt-7 h-12 w-full animate-pulse rounded-full" style={block} />

      {/* 카테고리 탭 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[40, 52, 44, 48, 56, 40].map((w, i) => (
          <div
            key={i}
            className="h-8 animate-pulse rounded-full"
            style={{ ...block, width: w }}
          />
        ))}
      </div>

      {/* 목록 헤딩 */}
      <div className="mt-8 h-6 w-28 animate-pulse" style={block} />

      {/* 카드 그리드 */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-square w-full animate-pulse rounded-2xl" style={block} />
            <div className="mt-1 h-4 w-14 animate-pulse rounded-full" style={block} />
            <div className="h-5 w-full animate-pulse" style={block} />
            <div className="h-4 w-3/4 animate-pulse" style={block} />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
