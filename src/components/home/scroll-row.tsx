"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 가로 스크롤 목록 + 스크롤 상태바.
 *
 * 모바일에서는 네이티브 스크롤바가 보이지 않아, 얼마나 더 남았는지 알 수가 없다.
 * 아래에 얇은 상태바를 둬서 현재 위치와 남은 양을 보여준다. (올리브영 카테고리 행)
 *
 * 상태바는 스크롤이 실제로 넘칠 때만 나온다 — 다 보이는데 바가 있으면 거짓 신호다.
 */
export function ScrollRow({
  children,
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  /** 스크롤 컨테이너(ul)에 적용할 클래스 */
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  /** 보이는 비율 (1이면 넘치지 않음 → 상태바 숨김) */
  const [ratio, setRatio] = useState(1);
  /** 진행도 0~1 */
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      setRatio(el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1);
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };

    measure();

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        measure();
        ticking = false;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    // 폰트 로드·회전 등으로 폭이 바뀌면 비율이 틀어진다
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  const thumbPct = Math.max(ratio * 100, 12); // 너무 얇으면 안 보인다
  const travel = 100 - thumbPct;

  return (
    <>
      <ul ref={ref} aria-label={ariaLabel} className={className}>
        {children}
      </ul>

      {ratio < 0.99 && (
        <div
          aria-hidden
          className="mx-auto mt-5 h-1 w-20 overflow-hidden rounded-full bg-black/[0.07]"
        >
          <div
            className="h-full rounded-full bg-[#1E5BD6]"
            style={{
              width: `${thumbPct}%`,
              marginLeft: `${progress * travel}%`,
            }}
          />
        </div>
      )}
    </>
  );
}
