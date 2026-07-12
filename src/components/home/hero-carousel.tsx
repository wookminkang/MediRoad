"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

export type HeroSlide = {
  image: string;
  eyebrow: string;
  title: string;
  sub: string;
  href: string;
  cta: string;
};

const AUTOPLAY_MS = 5000;

/**
 * 히어로 캐러셀 — 좌우 카드가 살짝 보이는(peek) 스냅 캐러셀. (올리브영 홈 패턴)
 *
 * 캐러셀 라이브러리를 쓰지 않는다. CSS scroll-snap이 네이티브 스와이프·관성·접근성을 그대로
 * 주고, 번들도 늘지 않는다. 현재 인덱스는 스크롤 위치에서 역산한다.
 *
 * 카피는 이미지에 굽지 않고 여기서 얹는다 — 배너를 다시 만들지 않고 문구만 고칠 수 있어야 한다.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // 스크롤 위치 → 현재 인덱스 (카드 하나 폭 단위로 반올림)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const card = track.firstElementChild as HTMLElement | null;
        if (card) {
          const step = card.offsetWidth + GAP_PX;
          setIndex(Math.round(track.scrollLeft / step));
        }
        ticking = false;
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  // 자동 재생 — 손이 닿는 동안(터치·호버)에는 멈춘다
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setInterval(() => {
      const track = trackRef.current;
      const card = track?.firstElementChild as HTMLElement | null;
      if (!track || !card) return;
      const step = card.offsetWidth + GAP_PX;
      const next = (Math.round(track.scrollLeft / step) + 1) % slides.length;
      track.scrollTo({ left: next * step, behavior: "smooth" });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return;
    track.scrollTo({ left: i * (card.offsetWidth + GAP_PX), behavior: "smooth" });
  };

  const current = Math.min(index, slides.length - 1);

  return (
    <section aria-label="주요 안내" className="bg-white pt-3">
      <ul
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 md:justify-center md:px-6"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((s, i) => (
          <li
            key={s.image}
            // 카드 폭을 100%보다 좁게 잡아야 옆 카드가 살짝 보인다(= 더 있다는 신호)
            className="w-[86%] shrink-0 snap-center sm:w-[420px]"
          >
            <Link
              href={s.href}
              className="relative block aspect-[3/4] overflow-hidden rounded-3xl sm:aspect-[4/5]"
            >
              <Image
                src={s.image}
                alt=""
                fill
                sizes="(max-width: 640px) 86vw, 420px"
                // 첫 장은 LCP — 먼저 받는다
                priority={i === 0}
                className="object-cover"
              />
              {/*
               * 카피 가독성용 그라데이션. 배너 아트가 밝은 하늘색이라 얕게 깔면 흰 글씨가 뭉갠다.
               * 카피가 놓이는 하단 절반을 확실히 눌러 대비를 확보한다.
               */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 via-45% to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-6 text-center">
                <p className="text-[13px] font-semibold text-white/85">
                  {s.eyebrow}
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[22px] font-bold leading-tight text-white sm:text-2xl">
                  {s.title}
                </p>
                <p className="mt-2 text-sm text-white/80">{s.sub}</p>
                <span className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-bold text-[#1E5BD6]">
                  {s.cta}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* 인디케이터 — 몇 번째인지(01|03) + 점으로 직접 이동 */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.image}
              type="button"
              aria-label={`${i + 1}번째 배너로 이동`}
              aria-current={i === current ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-5 bg-[#1E5BD6]" : "w-1.5 bg-black/15"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] tabular-nums text-subtle">
          {String(current + 1).padStart(2, "0")}
          <span className="mx-1 text-black/20">|</span>
          {String(slides.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}

/** 트랙 gap-3 = 12px. 스크롤 위치 ↔ 인덱스 환산에 카드 폭과 함께 쓴다. */
const GAP_PX = 12;
