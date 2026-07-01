"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

// 뷰포트 높이 비율 스냅 지점 (peek / 절반 / 거의 전체)
const SNAP_POINTS = [0.12, 0.5, 0.9];
const CLOSE_BELOW = 0.08; // 이보다 낮게 내리고 놓으면 닫기

/**
 * 모바일 바텀시트 — 핸들바 드래그로 높이를 직접 제어(스냅).
 * 리스트 스크롤과 충돌하지 않도록 드래그는 오직 핸들에서만 인식한다.
 */
export function MobileBottomSheet({
  open,
  snap,
  onSnapChange,
  onClose,
  children,
}: {
  open: boolean;
  snap: number;
  onSnapChange: (s: number) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const [vh, setVh] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 0,
  );
  const [dragPx, setDragPx] = useState<number | null>(null);
  const startY = useRef(0);
  const startPx = useRef(0);

  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!open) return null;

  const snapPx = snap * vh;
  const height = dragPx ?? snapPx;

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    startPx.current = height;
    setDragPx(height);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragPx == null) return;
    const dy = startY.current - e.clientY; // 위로 올리면 +
    const next = Math.min(vh * 0.92, Math.max(0, startPx.current + dy));
    setDragPx(next);
  };
  const onPointerUp = () => {
    if (dragPx == null) return;
    const cur = dragPx / vh;
    setDragPx(null);
    if (cur < CLOSE_BELOW) {
      onClose();
      return;
    }
    // 가장 가까운 스냅으로
    let nearest = SNAP_POINTS[0];
    for (const p of SNAP_POINTS) {
      if (Math.abs(p - cur) < Math.abs(nearest - cur)) nearest = p;
    }
    onSnapChange(nearest);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)] md:hidden"
      style={{
        height: vh ? height : "50vh",
        transition:
          dragPx != null ? "none" : "height 0.28s cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      {/* 핸들 — 여기서만 드래그 인식(touch-none으로 리스트 스크롤과 분리) */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex w-full shrink-0 cursor-grab touch-none items-center justify-center py-3 active:cursor-grabbing"
        role="separator"
        aria-label="시트 높이 조절"
      >
        <span className="h-1.5 w-10 rounded-full bg-[#C7CDD6]" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
