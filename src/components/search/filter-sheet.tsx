"use client";

import { useEffect, useState, type ReactNode } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * 모바일 상세 필터 — 바텀시트.
 * 인라인 아코디언은 펼칠 때 리스트를 아래로 밀어내지만, 시트는 덮었다 사라지므로
 * 리스트 영역을 뺏지 않는다. 트리거는 필터 칩 줄에 함께 놓여 한 줄만 차지한다.
 */
export function FilterSheet({
  children,
  activeCount,
}: {
  children: ReactNode;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // 시트가 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 필터를 고르면 URL이 바뀐다 → 시트를 닫아 결과를 바로 보여준다.
  // 의존성은 반드시 문자열. useSearchParams()는 렌더마다 새 객체를 주므로
  // [sp]로 걸면 시트를 여는 즉시 effect가 다시 돌아 닫혀버린다(버튼 먹통).
  const spKey = sp.toString();
  useEffect(() => {
    setOpen(false);
  }, [spKey]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const reset = () => router.push(pathname);

  // 주의: 조상에 backdrop-filter/transform이 있으면 position:fixed가 그 안에 갇힌다.
  // 그래서 스티키 바에서 backdrop-blur를 뺐다. (포털은 next/link를 깨뜨려 쓸 수 없다)
  const sheet = open ? (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="상세 필터"
    >
      {/* 딤 */}
      <button
        type="button"
        aria-label="닫기"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/40"
      />

      {/* 시트 */}
      <div className="absolute inset-x-0 bottom-0 flex max-h-[82vh] flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.16)]">
        {/* 그랩 핸들 */}
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

        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>

        <div className="flex gap-2 border-t border-black/[0.06] px-5 py-3">
          <button
            type="button"
            onClick={reset}
            disabled={activeCount === 0}
            className="h-12 flex-1 rounded-xl bg-[#F3F5FB] text-sm font-bold text-neutral disabled:opacity-40"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-12 flex-[2] rounded-xl bg-[#1E5BD6] text-sm font-bold text-white"
          >
            결과 보기
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      {/* 포털 금지 — 포털 안에서는 next/link 내비게이션이 죽는다. 스티키 바의 backdrop-blur를
          제거했으므로 인라인 fixed로 충분하다. */}
      {sheet}
    </>
  );
}
