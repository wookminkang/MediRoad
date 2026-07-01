"use client";

import { useEffect, useRef } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { isPartnerHospital } from "@/constants/partners";
import type { Hospital } from "@/types/hospital";

/**
 * 지도 좌측/바텀시트 공용 병원 리스트.
 * 무한스크롤을 컴포넌트 내부에 캡슐화(자체 스크롤 컨테이너 + 센티넬 + IO)해
 * 데스크톱 사이드바와 모바일 바텀시트에서 각각 독립적으로 동작한다.
 */
export function MapHospitalList({
  items,
  hasPanel,
  regionActive,
  searchActive,
  mode,
  regionLabel,
  regionLoading,
  regionTotal,
  regionShown,
  canLoadMore,
  onLoadMore,
  onClose,
  onOpenDetail,
  activeId,
  onHover,
  onOverscrollDown,
  idPrefix = "d",
  scrollable = true,
}: {
  items: Hospital[];
  hasPanel: boolean;
  regionActive: boolean;
  searchActive: boolean;
  mode: string;
  regionLabel?: string;
  regionLoading: boolean;
  regionTotal: number;
  regionShown: number;
  canLoadMore: boolean;
  onLoadMore: () => void;
  onClose: () => void;
  onFocus: (h: Hospital) => void;
  /** 항목 클릭 시 상세 패널 열기(PC). 없으면 onFocus만 동작(모바일) */
  onOpenDetail?: (h: Hospital) => void;
  /** 현재 상세 패널에 열려 있는 병원 id — 리스트에서 강조 */
  activeId?: string | null;
  onHover: (id: string | null) => void;
  /** 스크롤 최상단에서 아래로 당길 때 — 바텀시트를 한 단계 내리기(모바일) */
  onOverscrollDown?: () => void;
  idPrefix?: string;
  /** false면 내부 스크롤 비활성 — 바텀시트가 완전히 펼쳐지기 전엔 위 스와이프가 시트 확장이 되도록 */
  scrollable?: boolean;
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // 스크롤 최상단에서 아래로 당기면 시트 내리기(한 제스처당 1회)
  const touchStartY = useRef(0);
  const overscrollFired = useRef(false);

  // 무한스크롤 — 자체 스크롤 컨테이너를 root로
  useEffect(() => {
    if (!regionActive) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && canLoadMore) onLoadMore();
      },
      { root: scrollRef.current, rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [regionActive, canLoadMore, onLoadMore]);

  return (
    <div
      ref={scrollRef}
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY;
        overscrollFired.current = false;
      }}
      onTouchMove={(e) => {
        if (!onOverscrollDown || overscrollFired.current) return;
        const el = scrollRef.current;
        const dy = e.touches[0].clientY - touchStartY.current;
        // 스크롤 최상단(≤0)에서 아래로 24px 이상 당김 → 시트 한 단계 내림
        if (el && el.scrollTop <= 0 && dy > 24) {
          overscrollFired.current = true;
          onOverscrollDown();
        }
      }}
      className={`min-h-0 flex-1 ${scrollable ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      <div className="sticky top-0 z-10 border-b border-line bg-white px-4 py-3">
        {hasPanel ? (
          regionActive || searchActive ? (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 text-sm font-medium text-brand"
              >
                ← {regionActive ? "지역 닫기" : "검색 닫기"}
              </button>
              {regionActive && regionLabel && (
                <span className="truncate text-sm font-bold text-neutral">
                  {regionLabel}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm font-medium text-neutral">
              이 위치의 병원 {items.length}곳
            </p>
          )
        ) : (
          <p className="text-sm text-muted">
            {mode === "marker"
              ? "지도에서 마커를 클릭하면 병원 정보가 표시됩니다"
              : "지역(예: 의정부 613곳)을 클릭하면 목록이 표시됩니다"}
          </p>
        )}
      </div>

      {hasPanel && items.length === 0 && !regionLoading && (
        <p className="px-4 py-8 text-center text-sm text-muted">결과가 없습니다</p>
      )}

      {hasPanel && items.length > 0 && (
        <ul>
          {items.map((h) => (
            <li
              key={h.id}
              id={`maplist-${idPrefix}-${h.id}`}
              className={`cursor-pointer border-b border-black/[0.05] px-4 py-3.5 transition-colors hover:bg-neutral-weak ${
                activeId === h.id ? "bg-brand-weak/60" : ""
              }`}
              onMouseEnter={() => onHover(h.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => {
                // PC: 우측 상세 패널 / 모바일: 바로 상세 페이지로 이동
                if (onOpenDetail) onOpenDetail(h);
                else router.push(`/hospitals/${h.slug}`);
              }}
            >
              <div className="flex gap-3">
                <HospitalThumb hospital={h} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/hospitals/${h.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="truncate text-[15px] font-bold text-brand hover:underline"
                    >
                      {h.name}
                    </Link>
                    {isPartnerHospital(h.id) && (
                      <span className="shrink-0 rounded bg-[#1E5BD6] px-1.5 py-0.5 text-[11px] font-bold text-white">
                        제휴
                      </span>
                    )}
                    {h.isOpenNow != null && (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          h.isOpenNow
                            ? "bg-brand-weak text-brand"
                            : "bg-neutral-weak text-subtle"
                        }`}
                      >
                        {h.isOpenNow ? "영업중" : "영업종료"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[13px] text-neutral">
                    <span className="font-semibold">{h.type}</span> ·{" "}
                    {h.region.sigungu}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-muted">
                    {h.roadAddress ?? h.address}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {regionActive && (
        <>
          <div ref={sentinelRef} className="h-px" />
          {regionLoading && (
            <p className="px-4 py-4 text-center text-sm text-muted">
              불러오는 중…
            </p>
          )}
          {!regionLoading && regionShown >= regionTotal && regionTotal > 0 && (
            <p className="px-4 py-4 text-center text-xs text-subtle">
              모두 표시했습니다 ({regionTotal.toLocaleString()}곳)
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** 썸네일 — 사진 있으면 표시, 없으면 플레이스홀더 */
function HospitalThumb({ hospital }: { hospital: Hospital }) {
  const url = hospital.photos?.[0]?.url;
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={hospital.name}
        className="h-16 w-16 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-weak text-subtle">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
      </svg>
    </div>
  );
}
