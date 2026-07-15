"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

export type PromoSlide = {
  image: string;
  title: string;
  sub: string;
  href: string;
};

/**
 * 프로모 배너 캐러셀 — 가로 스냅 + 점 인디케이터. (올리브영 홈 하단 배너)
 * 이미지는 우측 아트 / 좌측 여백 구성이라 카피를 왼쪽에 얹는다.
 */
export function PromoCarousel({ slides }: { slides: PromoSlide[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

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

  const goTo = (i: number) => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return;
    track.scrollTo({ left: i * (card.offsetWidth + GAP_PX), behavior: "smooth" });
  };

  const current = Math.min(index, slides.length - 1);

  return (
    <section aria-label="추천 콘텐츠" className="bg-white py-2">
      <ul
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:px-6"
      >
        {slides.map((s) => (
          <li key={s.image} className="w-full shrink-0 snap-center">
            <Link
              href={s.href}
              className="relative flex h-[160px] items-center overflow-hidden rounded-2xl bg-neutral-weak"
            >
              <Image
                src={s.image}
                alt=""
                fill
                sizes="(max-width: 540px) 100vw, 508px"
                className="object-cover"
              />
              {/* 카피가 놓이는 좌측을 살짝 눌러 대비를 확보한다 */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/45 to-transparent" />
              <div className="relative z-10 min-w-0 px-5">
                <p className="truncate text-xl font-extrabold text-neutral">
                  {s.title}
                </p>
                <p className="mt-1 truncate text-[15px] text-muted">{s.sub}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 flex justify-center gap-1.5">
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
    </section>
  );
}

const GAP_PX = 12;
