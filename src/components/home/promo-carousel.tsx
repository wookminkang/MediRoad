"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

export type PromoSlide = {
  image: string;
  title: string;
  sub: string;
  href: string;
  /** 카피 세로 위치 — 배너마다 3D 오브젝트가 있는 곳을 피해 빈 자리에 둔다. 기본 center */
  valign?: "top" | "center" | "bottom";
  /** 카피 가로 위치 — 기본 left */
  align?: "left" | "right";
};

/**
 * 프로모 배너 캐러셀 — 가로 스냅 + 점 인디케이터. (올리브영 홈 하단 배너)
 * 카피 위치는 배너마다 다르다 — 3D 오브젝트를 피해 빈 곳에 얹어야 겹치지 않는다.
 */
const VALIGN: Record<NonNullable<PromoSlide["valign"]>, string> = {
  top: "justify-start pt-4",
  center: "justify-center",
  bottom: "justify-end pb-4",
};
const ALIGN: Record<NonNullable<PromoSlide["align"]>, string> = {
  left: "items-start text-left bg-gradient-to-r from-white/85 via-white/45 to-transparent",
  right: "items-end text-right bg-gradient-to-l from-white/85 via-white/45 to-transparent",
};
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
        {slides.map((s) => {
          const align = s.align ?? "left";
          const valign = s.valign ?? "center";
          return (
            <li key={s.image} className="w-full shrink-0 snap-center">
              <Link
                href={s.href}
                className="relative block h-[160px] overflow-hidden rounded-2xl bg-neutral-weak"
              >
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(max-width: 540px) 100vw, 508px"
                  className="object-cover"
                />
                {/*
                 * 카피 자리를 flex로 잡아 배너마다 세로(valign)·가로(align) 위치를 다르게 둔다.
                 * 그라데이션은 카피 쪽을 눌러 대비를 확보 — align에 따라 방향이 바뀐다(ALIGN).
                 */}
                <div
                  className={`absolute inset-0 z-10 flex flex-col px-5 ${VALIGN[valign]} ${ALIGN[align]}`}
                >
                  <p className="max-w-[62%] truncate text-[21px] font-extrabold leading-tight text-neutral">
                    {s.title}
                  </p>
                  <p className="mt-1 max-w-[62%] truncate text-[16px] text-muted">
                    {s.sub}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
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
