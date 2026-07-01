"use client";

import { useEffect, useState } from "react";

import type { OpeningHours } from "@/types/hospital";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
// 월~일 순서로 표시
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** 마감 시각이 20시 이후면 야간진료로 판단 */
function isNight(close?: string) {
  if (!close) return false;
  const n = Number(close.replace(/[^0-9]/g, "").slice(0, 4).padEnd(4, "0"));
  return n >= 2000;
}

/**
 * 진료시간 표 — 요일 칩 + 굵은 시간 + 야간/휴진 배지 (메디컬 블루 조합).
 * 오늘 요일은 클라이언트에서 계산해 강조 (SSG 빌드시각 박힘 방지).
 */
export function OpeningHoursTable({
  hours,
  holidayClosed,
}: {
  hours: OpeningHours[];
  holidayClosed?: boolean;
}) {
  const byDay = new Map(hours.map((h) => [h.day, h]));
  const [today, setToday] = useState(-1);

  useEffect(() => {
    setToday(new Date().getDay());
  }, []);

  return (
    <div className="flex flex-col">
      {DISPLAY_ORDER.map((day) => {
        const h = byDay.get(day);
        const closed = !h || h.closed || !h.open;
        const night = !closed && isNight(h?.close);
        const isToday = day === today;
        return (
          <div
            key={day}
            className={`flex items-center gap-2.5 border-b border-line py-1.5 last:border-b-0 ${
              isToday ? "rounded-lg bg-brand-weak/50 px-2" : ""
            }`}
          >
            <DayChip today={isToday}>{DAY_LABELS[day]}</DayChip>
            {isToday && (
              <span className="rounded bg-[#1E5BD6] px-1.5 py-0.5 text-[10px] font-bold text-white">
                오늘
              </span>
            )}
            {closed ? (
              <ClosedBadge />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-bold tracking-tight ${
                    isToday ? "text-[#1E5BD6]" : "text-neutral"
                  }`}
                >
                  {h.open}–{h.close}
                </span>
                {h.lunch && (
                  <span className="text-xs text-muted">점심 {h.lunch}</span>
                )}
                {night && <NightBadge />}
              </div>
            )}
          </div>
        );
      })}
      {holidayClosed && (
        <div className="flex items-center gap-3 py-2.5">
          <DayChip>공휴일</DayChip>
          <ClosedBadge />
        </div>
      )}
    </div>
  );
}

function DayChip({
  children,
  today,
}: {
  children: React.ReactNode;
  today?: boolean;
}) {
  return (
    <span
      className={`flex w-10 shrink-0 items-center justify-center rounded-lg py-1.5 text-[13px] font-bold ${
        today ? "bg-[#1E5BD6] text-white" : "bg-[#F3F5FB] text-neutral"
      }`}
    >
      {children}
    </span>
  );
}

function NightBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-[#EEF1FE] px-2.5 py-1 text-sm font-bold text-[#1E5BD6]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
      </svg>
      야간
    </span>
  );
}

function ClosedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-[#FBEEE1] px-2.5 py-1 text-sm font-bold text-[#B9670E]">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 9h18M8 2v3M16 2v3" />
        <path d="m10 14 4 4M14 14l-4 4" />
      </svg>
      휴진
    </span>
  );
}
