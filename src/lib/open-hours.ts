/**
 * 진료시간 해석 — 야간·일요일 진료 판정.
 *
 * 심평원 진료시간 규칙
 *   day   1~5 = 월~금, 6 = 토, 7 = 일, 8 = 공휴일
 *   open/close  "1830" 같은 HHMM 문자열
 *   자정을 넘겨 닫으면 24를 넘겨 적는다 — "2600"은 새벽 2시다.
 */

/** 야간진료 기준: 평일 20시 이후 마감 */
export const NIGHT_FROM = 2000;

export type HourRow = {
  day: number;
  open: string | null;
  close: string | null;
  closed: boolean | null;
};

const num = (v: string | null): number | null => {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

/** "1830" → "18:30", "2600" → "26:00"(새벽 2시)은 "02:00"로 표기 */
export function fmtTime(v: string | null): string {
  const n = num(v);
  if (n === null) return "";
  const h = Math.floor(n / 100);
  const m = n % 100;
  const hh = h >= 24 ? h - 24 : h;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 이 병원이 평일 야간(20시 이후)까지 하는가 → 가장 늦게 닫는 시각(HHMM) */
export function latestWeekdayClose(hours: HourRow[]): number | null {
  let latest: number | null = null;
  for (const h of hours) {
    if (h.closed || h.day < 1 || h.day > 5) continue;
    const c = num(h.close);
    if (c === null) continue;
    // "0000"은 자정 마감이다. 0으로 두면 가장 이른 값이 되어버리니 24시로 본다.
    const norm = c === 0 ? 2400 : c;
    if (latest === null || norm > latest) latest = norm;
  }
  return latest;
}

export function isNightOpen(hours: HourRow[]): boolean {
  const c = latestWeekdayClose(hours);
  return c !== null && c >= NIGHT_FROM;
}

/** 일요일 진료 시간 (없으면 null) */
export function sundayHours(hours: HourRow[]): HourRow | null {
  return hours.find((h) => h.day === 7 && !h.closed && h.open && h.close) ?? null;
}

/* ── 아래는 Hospital.hours("09:00" 콜론 포맷)용. 위 HourRow("0900")와 포맷이 다르다. ── */

type ClockHours = {
  day: number;
  open?: string;
  close?: string;
  closed?: boolean;
};

/** "21:30" → 2130. 자정("00:00")은 2400으로 본다(가장 이른 값이 되지 않게). */
function clockToNum(v?: string): number | null {
  if (!v) return null;
  const [h, m] = v.split(":").map((x) => Number.parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const n = h * 100 + m;
  return n === 0 ? 2400 : n;
}

/** 평일 가장 늦은 마감(HHMM). 없으면 null */
export function latestWeekdayCloseClock(hours: ClockHours[]): number | null {
  let latest: number | null = null;
  for (const h of hours) {
    if (h.closed || h.day < 1 || h.day > 5) continue;
    const c = clockToNum(h.close);
    if (c === null) continue;
    if (latest === null || c > latest) latest = c;
  }
  return latest;
}

export function isNightOpenClock(hours: ClockHours[]): boolean {
  const c = latestWeekdayCloseClock(hours);
  return c !== null && c >= NIGHT_FROM;
}

/** 일요일 진료 시간 "09:00~13:00" (없으면 null) */
export function sundayLabelClock(hours: ClockHours[]): string | null {
  const s = hours.find((h) => h.day === 7 && !h.closed && h.open && h.close);
  return s ? `${s.open}~${s.close}` : null;
}

/** "2130" → "21:30", 2400 → "24:00" */
export function numToClock(n: number): string {
  const h = Math.floor(n / 100);
  const m = n % 100;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
