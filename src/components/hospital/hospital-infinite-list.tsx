"use client";

import { useEffect, useRef } from "react";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { hospitalKeys } from "@/lib/query-keys";
import type { Paginated } from "@/types";
import type { Hospital, HospitalSearchFilters } from "@/types/hospital";

import { HospitalGridCard } from "./hospital-grid-card";

/** 필터(page 제외) → API 쿼리스트링 */
function toParams(f: HospitalSearchFilters, page: number): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.department) p.set("department", f.department);
  if (f.sido) p.set("sido", f.sido);
  if (f.region) p.set("region", f.region);
  if (f.openNow) p.set("open", "1");
  if (f.center) {
    p.set("lat", String(f.center.lat));
    p.set("lng", String(f.center.lng));
  }
  if (f.radiusKm) p.set("radius", String(f.radiusKm));
  p.set("page", String(page));
  return p.toString();
}

/** 병원 목록 무한스크롤 — 첫 페이지는 서버 prefetch(하이드레이션), 이후 스크롤로 로드 */
export function HospitalInfiniteList({
  filters,
}: {
  filters: HospitalSearchFilters;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery({
      queryKey: hospitalKeys.list(filters),
      queryFn: async ({ pageParam }) => {
        const res = await fetch(`/api/hospitals?${toParams(filters, pageParam)}`);
        if (!res.ok) throw new Error("목록을 불러오지 못했습니다");
        return (await res.json()) as Paginated<Hospital>;
      },
      initialPageParam: 1,
      getNextPageParam: (last) =>
        last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    });

  const items = data.pages.flatMap((p) => p.items);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasNextPage) return;
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (items.length === 0) {
    return (
      <EmptyState
        title="선택한 필터의 검색 결과가 없습니다."
        description="다른 필터로 변경해보세요."
      />
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-4">
        {items.map((h) => (
          <li key={h.id}>
            <HospitalGridCard hospital={h} />
          </li>
        ))}
      </ul>

      {/* 무한스크롤 센티넬 */}
      <div ref={sentinel} aria-hidden className="h-12" />
      {isFetchingNextPage && (
        <p className="py-4 text-center text-sm text-muted">불러오는 중…</p>
      )}
    </>
  );
}
