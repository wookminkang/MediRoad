"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { type FilterDraft, FilterSheetForm } from "./filter-sheet-form";

/**
 * 모바일 상세 필터 — 바텀시트.
 *
 * "임시 담기 후 한 번에 적용" 방식이다. 시트가 열린 동안 고른 값은 로컬 상태(draft)에만
 * 쌓이고, "결과 보기"를 눌러야 URL이 바뀌며 결과가 적용된다. 예전엔 항목이 <Link>라
 * 누르는 즉시 이동하고 시트가 닫혔는데, 사용자는 여러 조건을 골라놓고 한 번에 보길 원했다.
 *
 * 스크롤은 시트 본문 한 곳(overflow-y-auto)만 만든다. 예전엔 이 본문 안에 데스크톱
 * 사이드바(자체 overflow를 가진)를 통째로 넣어 스크롤이 두 겹으로 겹쳤다.
 */
export function FilterSheet({ activeCount }: { activeCount: number }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();

  // 현재 URL → 초안. 시트를 열 때마다 지금 적용된 값에서 시작한다.
  const current: FilterDraft = {
    openNow: sp.get("open") === "1",
    radius: sp.get("radius") ?? undefined,
    sido: sp.get("sido") ?? undefined,
    department: sp.get("department") ?? undefined,
  };
  const [draft, setDraft] = useState<FilterDraft>(current);
  const hasLocation = Boolean(sp.get("lat") && sp.get("lng"));

  const openSheet = () => {
    setDraft(current); // 열 때 현재 URL 값으로 초기화
    setOpen(true);
  };

  // 시트 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /** draft를 URL로 커밋 — q·lat·lng 등 필터 외 파라미터는 보존한다 */
  const apply = () => {
    const p = new URLSearchParams();
    const q = sp.get("q");
    const lat = sp.get("lat");
    const lng = sp.get("lng");
    if (q) p.set("q", q);
    if (lat) p.set("lat", lat);
    if (lng) p.set("lng", lng);
    if (draft.openNow) p.set("open", "1");
    if (draft.radius) p.set("radius", draft.radius);
    if (draft.sido) p.set("sido", draft.sido);
    if (draft.department) p.set("department", draft.department);
    const qs = p.toString();
    router.push(qs ? `/hospitals?${qs}` : "/hospitals");
    setOpen(false);
  };

  const reset = () =>
    setDraft({
      openNow: false,
      radius: undefined,
      sido: undefined,
      department: undefined,
    });

  const draftCount =
    (draft.openNow ? 1 : 0) +
    (draft.radius ? 1 : 0) +
    (draft.sido ? 1 : 0) +
    (draft.department ? 1 : 0);

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition-colors ${
          activeCount > 0
            ? "bg-brand-weak text-brand"
            : "bg-[#F3F5FB] text-neutral hover:bg-[#E9EDF7]"
        }`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        필터
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1E5BD6] px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* 포털 금지 — 포털 안에서는 next/link 내비게이션이 죽는다.
          스티키 바의 backdrop-blur를 제거했으므로 인라인 fixed로 충분하다. */}
      {open && (
        <div
          className="shell-fixed inset-y-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="상세 필터"
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute inset-x-0 bottom-0 flex max-h-[82vh] flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.16)]">
            <div className="flex justify-center pt-2.5">
              <span aria-hidden className="h-1 w-10 rounded-full bg-black/15" />
            </div>

            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <h2 className="text-base font-bold text-neutral">상세 필터</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="flex h-8 w-8 items-center justify-center rounded-full text-subtle hover:bg-neutral-weak"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 유일한 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-1">
              <FilterSheetForm
                draft={draft}
                onChange={setDraft}
                hasLocation={hasLocation}
              />
            </div>

            <div className="flex gap-2 border-t border-black/[0.06] px-5 py-3">
              <button
                type="button"
                onClick={reset}
                disabled={draftCount === 0}
                className="h-12 flex-1 rounded-xl bg-[#F3F5FB] text-sm font-bold text-neutral disabled:opacity-40"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={apply}
                className="h-12 flex-[2] rounded-xl bg-[#1E5BD6] text-sm font-bold text-white"
              >
                결과 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
