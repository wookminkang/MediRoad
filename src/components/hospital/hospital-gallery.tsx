"use client";

import { useState } from "react";

import { PhotoFrame } from "@/components/ui/photo-frame";
import type { HospitalPhoto } from "@/types/hospital";

type Props = {
  photos?: HospitalPhoto[];
  alt: string;
  ratio?: number;
};

/**
 * 병원 사진 갤러리 — 2장 이상이면 좌우 화살표 + 하단 블릿 슬라이드. (WIREFRAME 4-3)
 * 0~1장이면 단일 이미지(없으면 플레이스홀더).
 */
export function HospitalGallery({ photos, alt, ratio = 5 / 2 }: Props) {
  const list = photos ?? [];
  const [idx, setIdx] = useState(0);

  if (list.length <= 1) {
    return (
      <PhotoFrame
        src={list[0]?.url}
        alt={list[0]?.alt ?? alt}
        ratio={ratio}
        borderRadius="r4"
      />
    );
  }

  const go = (i: number) => setIdx((i + list.length) % list.length);
  const cur = list[idx];

  return (
    <div className="relative">
      <PhotoFrame
        src={cur.url}
        alt={cur.alt ?? `${alt} ${idx + 1}`}
        ratio={ratio}
        borderRadius="r4"
      />

      <ArrowButton side="left" onClick={() => go(idx - 1)} />
      <ArrowButton side="right" onClick={() => go(idx + 1)} />

      {/* 하단 블릿 네비 */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {list.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`${i + 1}번째 사진`}
            aria-current={i === idx ? "true" : undefined}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === idx ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ArrowButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "이전 사진" : "다음 사진"}
      className={`absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral shadow ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={side === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}
