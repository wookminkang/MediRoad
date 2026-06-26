import type { ColumnFilters } from "@/types/column";
import type { HospitalSearchFilters } from "@/types/hospital";

/**
 * 쿼리키 팩토리 — TanStack Query의 queryKey를 한 곳에서 생성/관리.
 * 서버 prefetch·클라 useSuspenseQuery·무효화(invalidateQueries)가 동일 키를 공유한다.
 *
 * 계층 구조라 넓은 무효화가 쉽다:
 *  - 전체 병원 무효화      → invalidateQueries({ queryKey: hospitalKeys.all })
 *  - 목록 전체 무효화      → invalidateQueries({ queryKey: hospitalKeys.lists() })
 *  - 특정 상세만 무효화    → invalidateQueries({ queryKey: hospitalKeys.detail(id) })
 */
export const hospitalKeys = {
  all: ["hospitals"] as const,
  lists: () => [...hospitalKeys.all, "list"] as const,
  /** 목록·검색·랜딩·무한스크롤 (filters로 구분) */
  list: (filters: HospitalSearchFilters) =>
    [...hospitalKeys.lists(), filters] as const,
  details: () => [...hospitalKeys.all, "detail"] as const,
  detail: (id: string) => [...hospitalKeys.details(), id] as const,
};

export const columnKeys = {
  all: ["columns"] as const,
  lists: () => [...columnKeys.all, "list"] as const,
  list: (filters: ColumnFilters) => [...columnKeys.lists(), filters] as const,
  details: () => [...columnKeys.all, "detail"] as const,
  detail: (id: string) => [...columnKeys.details(), id] as const,
};

/** 관리자 영역 (변이 후 목록 무효화 대상) */
export const adminHospitalKeys = {
  all: ["admin", "hospitals"] as const,
  list: (params?: Record<string, unknown>) =>
    [...adminHospitalKeys.all, "list", params ?? {}] as const,
  detail: (id: string) => [...adminHospitalKeys.all, "detail", id] as const,
};
