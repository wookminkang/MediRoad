"use client";

import { useEffect, useState } from "react";

import { Text } from "@seed-design/react";

import type { OpeningHours } from "@/types/hospital";

/** "HH:MM" → 분 */
const toMin = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

/**
 * 오늘 기준 실시간 영업상태. SSG 페이지 정합성을 위해 현재 시각은 클라이언트에서 계산.
 * (네이버 플레이스 "영업중 · 18:00 종료" UX)
 */
export function TodayStatus({
  hours,
  prominent = false,
}: {
  hours: OpeningHours[];
  /** true면 배지 + 내일 안내(AI요약 모달용), false면 본문용 심플 텍스트 */
  prominent?: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return null; // 하이드레이션 불일치 방지

  const today = hours.find((h) => h.day === now.getDay());
  const cur = now.getHours() * 60 + now.getMinutes();

  let open = false;
  let label: string;

  if (!today || today.closed || !today.open || !today.close) {
    label = "오늘 휴진";
  } else {
    const o = toMin(today.open);
    const c = toMin(today.close);
    const lunch = today.lunch?.split("-");
    if (cur < o) {
      label = `영업 전 · ${today.open} 진료 시작`;
    } else if (cur >= c) {
      label = `영업 종료 · 오늘 ${today.close}까지`;
    } else if (lunch && cur >= toMin(lunch[0]) && cur < toMin(lunch[1])) {
      label = `점심시간 · ${lunch[1]} 진료 재개`;
    } else {
      open = true;
      label = `영업중 · ${today.close} 진료 마감`;
    }
  }

  // 본문용 — 심플 텍스트(원래대로)
  if (!prominent) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${open ? "bg-positive" : "bg-subtle"}`}
          aria-hidden
        />
        <Text
          as="span"
          textStyle="t5Bold"
          className={open ? "text-positive" : "text-muted"}
        >
          {label}
        </Text>
      </div>
    );
  }

  // AI요약 모달용 — 눈에 띄는 배지 + 내일 안내
  const tmr = hours.find((h) => h.day === (now.getDay() + 1) % 7);
  const tomorrowLabel =
    !tmr || tmr.closed || !tmr.open ? "내일 휴진" : `내일 ${tmr.open} 진료 시작`;

  return (
    <div className="flex flex-col items-start gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[15px] font-bold"
        style={{
          backgroundColor: open ? "#E7F7EC" : "#F2F4F6",
          color: open ? "#0F8A43" : "#5B6470",
        }}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: open ? "#12A150" : "#9AA0A8" }}
          aria-hidden
        />
        {label}
      </span>
      <Text as="span" textStyle="t4Regular" style={{ color: "#9AA0A8" }}>
        {tomorrowLabel}
      </Text>
    </div>
  );
}
