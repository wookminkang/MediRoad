import { SeedSmoke } from "@/components/ui/seed-smoke";

export default function SeedTestPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Seed Design 스모크 테스트</h1>
      <p className="mt-1 text-sm text-muted">
        Seed 컴포넌트가 Next 16 + SSR에서 렌더되는지 확인
      </p>
      <SeedSmoke />
    </div>
  );
}
