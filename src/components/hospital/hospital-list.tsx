import { EmptyState } from "@/components/ui/empty-state";
import type { Hospital } from "@/types/hospital";

import { HospitalCard } from "./hospital-card";

/** 병원 목록 (검색·랜딩) — HospitalCard 재사용. 빈 결과는 EmptyState. (WIREFRAME 4-2) */
export function HospitalList({ hospitals }: { hospitals: Hospital[] }) {
  if (hospitals.length === 0) {
    return (
      <EmptyState
        title="검색 결과가 없어요"
        description="다른 키워드나 진료과목으로 찾아보세요."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {hospitals.map((h) => (
        <li key={h.id}>
          <HospitalCard hospital={h} />
        </li>
      ))}
    </ol>
  );
}
