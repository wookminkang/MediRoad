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
      {/*
       * justify-center를 걸면 안 된다. 가로 스크롤 컨테이너에 걸면 콘텐츠가 양쪽으로 넘쳐
       * scrollLeft=0이 첫 카드가 아니게 되고(첫 카드는 스크롤로 닿지도 못한다),
       * 스크롤 위치로 역산하는 현재 인덱스가 화면과 어긋난다(카운터는 01인데 2번이 커져 있음).
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
            // 카드 폭을 100%보다 좁게 잡아야 옆 카드가 살짝 보인다(= 더 있다는 신호)
            className="w-[86%] shrink-0 snap-center"
          >
            {/*
             * 활성 카드만 원래 크기, 옆 카드는 살짝 줄인다 — 지금 보는 게 어느 카드인지
             * 크기로 말해준다. (올리브영 홈 캐러셀) 스케일은 안쪽 Link에만 걸어야
             * li의 폭이 그대로 남아 스냅 위치가 흔들리지 않는다.
             */}
            <Link
              href={s.href}
              // 비율은 배너 원본(1024x1536 = 2:3)과 맞춘다. 안 맞으면 object-cover가
              // 위아래를 잘라 캐릭터 얼굴이 확대되고 카피가 얼굴 위에 얹힌다.
              className={`relative block aspect-[2/3] overflow-hidden rounded-3xl transition-transform duration-300 ease-out ${
                i === current ? "scale-100" : "scale-[0.92]"
              }`}
            >
              <Image
                src={s.image}
                alt=""
                fill
                sizes="(max-width: 540px) 86vw, 465px"
                // 첫 장은 LCP — 먼저 받는다
                priority={i === 0}
                className="object-cover"
              />
              {/*
               * 카피 스크림. 검정으로 깔면 크림색 일러스트 위에서 탁하게 뜬다(때 낀 것처럼 보인다).
               * 브랜드 네이비로 깔아야 "디자인된 배너"로 읽힌다. 하단만 짧고 진하게 눌러
               * 캐릭터 몸통까지 잡아먹지 않게 한다.
               */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2A6B]/90 via-[#0B2A6B]/40 via-38% to-transparent" />

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
