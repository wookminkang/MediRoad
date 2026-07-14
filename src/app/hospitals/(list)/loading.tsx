import { PageContainer } from "@/components/ui/page-container";

/** 검색결과 로딩 스켈레톤 — 실제 페이지 레이아웃과 동일 구조(레이아웃 시프트 방지). */
export default function Loading() {
  const block = {
    backgroundColor: "var(--seed-color-bg-layer-fill)",
    borderRadius: "var(--seed-radius-r3)",
  } as const;

  return (
    <PageContainer maxWidth="max-w-7xl">
      {/* 타이틀 (t8Bold ≈ 28px) */}
      <div className="h-7 w-40 animate-pulse" style={block} />

      {/* 검색창 (rounded-full, h-11) */}
      <div className="mt-4 h-11 w-full animate-pulse rounded-full" style={block} />

      {/* 진료과목 칩 행 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[44, 36, 52, 40, 48, 36, 44].map((w, i) => (
          <div
            key={i}
            className="h-8 animate-pulse rounded-full"
            style={{ ...block, width: w }}
          />
        ))}
      </div>

      {/* 사이드바 + 결과 그리드 (페이지와 동일: lg 240px 좌측) */}
      <div className="mt-6 grid grid-cols-1 gap-8">
        {/* 모바일 필터 버튼 / 데스크톱 사이드바 */}
        <div>
          <div className="h-12 w-full animate-pulse rounded-xl" style={block} />
          <div className="hidden flex-col gap-3 lg:flex">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-full animate-pulse" style={block} />
            ))}
          </div>
        </div>

        {/* 결과: 개수 줄 + 카드 그리드 */}
        <div className="min-h-[60vh]">
          <div className="mb-4 h-5 w-20 animate-pulse" style={block} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-44 w-full animate-pulse rounded-2xl"
                style={block}
              />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
