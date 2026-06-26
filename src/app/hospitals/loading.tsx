import { PageContainer } from "@/components/ui/page-container";

/** 검색결과 로딩 스켈레톤. (WIREFRAME 4-5) */
export default function Loading() {
  const block = {
    backgroundColor: "var(--seed-color-bg-layer-fill)",
    borderRadius: "var(--seed-radius-r3)",
  } as const;

  return (
    <PageContainer>
      <div className="h-7 w-48 animate-pulse" style={block} />
      <div className="mt-6 h-13 w-full animate-pulse" style={block} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 w-full animate-pulse" style={block} />
          ))}
        </div>
        <div
          className="hidden min-h-[28rem] animate-pulse lg:block"
          style={block}
        />
      </div>
    </PageContainer>
  );
}
