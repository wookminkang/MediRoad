"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

export type HeroSlide = {
  image: string;
  /** 좌상단 배지 (알약) */
  badge: string;
  /** 좌하단 타이틀 — \n으로 줄바꿈 */
  title: string;
  sub: string;
  href: string;
};

const AUTOPLAY_MS = 5000;
/** 트랙 gap-3 = 12px. 스크롤 위치 ↔ 인덱스 환산에 카드 폭과 함께 쓴다. */
const GAP_PX = 12;

/**
 * 히어로 캐러셀 — 가로형 배너, 좌우 카드가 살짝 보이는(peek) 스냅 캐러셀. (강남언니 홈 배너)
 *
 * 레이아웃: 좌상단 배지 / 좌하단 타이틀·서브 / 우하단 카운터.
 * 그래서 배너 이미지는 인물을 오른쪽에 두고 왼쪽을 비운 구도로 만든다(gen-home-hero-v7.mts).
 *
 * 캐러셀 라이브러리를 쓰지 않는다. CSS scroll-snap이 네이티브 스와이프·관성·접근성을 그대로
 * 주고, 번들도 늘지 않는다. 현재 인덱스는 스크롤 위치에서 역산한다.
 *
 * 카피는 이미지에 굽지 않는다 — 배너를 다시 만들지 않고 문구만 고칠 수 있어야 한다.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const card = track.firstElementChild as HTMLElement | null;
        if (card) setIndex(Math.round(track.scrollLeft / (card.offsetWidth + GAP_PX)));
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

  const current = Math.min(index, slides.length - 1);

  return (
    <section aria-label="주요 안내" className="bg-white pt-3 pb-4">
      {/*
       * justify-center를 걸면 안 된다. 가로 스크롤 컨테이너에 걸면 콘텐츠가 양쪽으로 넘쳐
       * scrollLeft=0이 첫 카드가 아니게 되고(첫 카드는 스크롤로 닿지도 못한다),
       * 스크롤 위치로 역산하는 현재 인덱스가 화면과 어긋난다.
       */}
      <ul
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((s, i) => (
          <li
            key={s.image}
            // 폭을 100%보다 좁게 잡아야 옆 카드가 살짝 보인다(= 더 있다는 신호)
            className="w-[92%] shrink-0 snap-center"
          >
            <Link
              href={s.href}
              // 비율은 배너 원본(1536x1024 = 3:2)과 맞춘다. 안 맞으면 object-cover가 잘라낸다.
              className="relative block aspect-[3/2] overflow-hidden rounded-2xl"
            >
              <Image
                src={s.image}
                alt=""
                fill
                sizes="(max-width: 540px) 92vw, 500px"
                priority={i === 0} // 첫 장은 LCP — 먼저 받는다
                className="object-cover"
              />

              {/* 카피 스크림 — 인물은 오른쪽, 글자는 왼쪽. 왼쪽만 눌러 대비를 만든다 */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent" />

              {/* 좌상단 배지 */}
              <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur-sm">
                {s.badge}
              </span>

              {/* 좌하단 카피 */}
              <div className="absolute bottom-4 left-4 right-16">
                <p className="whitespace-pre-line text-[20px] font-bold leading-tight text-white drop-shadow-sm">
                  {s.title}
                </p>
                <p className="mt-1 truncate text-[13px] text-white/85">{s.sub}</p>
              </div>

              {/* 우하단 카운터 */}
              <span className="absolute bottom-4 right-4 inline-flex items-center rounded-full bg-black/35 px-2.5 py-1 text-[11px] tabular-nums text-white/90 backdrop-blur-sm">
                {current + 1}
                <span className="mx-1 text-white/40">|</span>
                {slides.length}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
