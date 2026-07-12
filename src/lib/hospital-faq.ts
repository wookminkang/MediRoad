import { eunNeun, walkMinutes } from "@/lib/hospital";
import type { Hospital, HospitalFaq, OpeningHours } from "@/types/hospital";

/**
 * 병원 FAQ 자동 생성 — 공공데이터(진료시간·지하철·진료과목·전화·편의)에서 사실만 뽑아 구성.
 *
 * 원칙:
 * - 데이터로 확인되지 않는 건 문항 자체를 만들지 않는다(주차·예약 등 추측 금지).
 * - 효과·우수성 단정, 유인성 표현 금지(의료광고법). 운영 정보만 다룬다.
 * - 관리자가 입력한 faqs가 있으면 그쪽이 우선(호출부에서 처리).
 *
 * FAQPage JSON-LD(`buildFaqLd`)와 화면 아코디언이 같은 데이터를 쓴다.
 */

// E-Gen 요일: 1=월 … 7=일 (JS 0-6 아님)
const DAY_LABEL: Record<number, string> = {
  1: "월요일",
  2: "화요일",
  3: "수요일",
  4: "목요일",
  5: "금요일",
  6: "토요일",
  7: "일요일",
};

const isOpen = (d?: OpeningHours) => !!d && !d.closed && !!d.open && !!d.close;

/** 마감 20시 이후 = 야간진료 */
function isNight(close?: string): boolean {
  if (!close) return false;
  const n = Number(close.replace(/[^0-9]/g, "").slice(0, 4).padEnd(4, "0"));
  return n >= 2000;
}

/** 평일(월~금) 중 진료시간이 동일한 구간을 "월~금 09:00~18:00" 식으로 요약 */
function weekdayPhrase(hours: OpeningHours[]): string | null {
  const weekdays = [1, 2, 3, 4, 5]
    .map((day) => hours.find((h) => h.day === day))
    .filter(isOpen) as OpeningHours[];
  if (!weekdays.length) return null;

  const uniq = new Set(weekdays.map((d) => `${d.open}~${d.close}`));
  if (uniq.size === 1 && weekdays.length === 5) {
    return `평일(월~금) ${weekdays[0].open}~${weekdays[0].close}`;
  }
  return weekdays
    .map((d) => `${DAY_LABEL[d.day]} ${d.open}~${d.close}`)
    .join(", ");
}

export function buildHospitalFaqs(h: Hospital): HospitalFaq[] {
  const faqs: HospitalFaq[] = [];
  const hours = h.hours ?? [];
  const name = h.name;
  const 은는 = eunNeun(name);
  const addr = h.roadAddress ?? h.address;

  // 1) 진료시간 — 요일별 데이터가 있을 때만
  const weekday = weekdayPhrase(hours);
  if (weekday) {
    const sat = hours.find((d) => d.day === 6);
    const sun = hours.find((d) => d.day === 7);
    const parts = [`${name}의 진료시간은 ${weekday}입니다.`];

    if (isOpen(sat)) parts.push(`토요일은 ${sat!.open}~${sat!.close} 진료합니다.`);
    else if (sat?.closed) parts.push("토요일은 휴진입니다.");

    if (isOpen(sun)) parts.push(`일요일은 ${sun!.open}~${sun!.close} 진료합니다.`);
    else if (sun?.closed) parts.push("일요일은 휴진입니다.");

    if (h.holidayClosed) parts.push("공휴일은 휴진입니다.");

    const lunch = hours.find((d) => d.lunch)?.lunch;
    if (lunch) parts.push(`점심시간은 ${lunch}입니다.`);

    parts.push(
      "명절·임시 휴진으로 달라질 수 있으니 방문 전 전화로 확인하시는 것을 권장합니다.",
    );
    faqs.push({ q: `${name} 진료시간은 어떻게 되나요?`, a: parts.join(" ") });
  }

  // 2) 야간진료 — 평일 마감이 20시 이후이거나 편의정보에 명시된 경우만
  const nightDay = [1, 2, 3, 4, 5]
    .map((day) => hours.find((d) => d.day === day))
    .find((d) => isOpen(d) && isNight(d!.close));
  if (nightDay || h.amenities?.includes("야간진료")) {
    const close = nightDay?.close;
    faqs.push({
      q: `${name}${은는} 야간진료를 하나요?`,
      a: close
        ? `평일 ${close}까지 진료해 야간 진료가 가능합니다. 다만 접수 마감 시각은 진료 종료 시각보다 이를 수 있으니, 늦은 시간 방문 전에는 전화로 확인하시는 것을 권장합니다.`
        : "야간 진료를 운영합니다. 요일별 운영 시간과 접수 마감 시각은 방문 전 전화로 확인하시는 것을 권장합니다.",
    });
  }

  // 3) 주말진료 — 토·일 데이터가 있을 때만
  const sat = hours.find((d) => d.day === 6);
  const sun = hours.find((d) => d.day === 7);
  if (sat || sun) {
    const bits: string[] = [];
    if (isOpen(sat)) bits.push(`토요일 ${sat!.open}~${sat!.close}`);
    else if (sat?.closed) bits.push("토요일 휴진");
    if (isOpen(sun)) bits.push(`일요일 ${sun!.open}~${sun!.close}`);
    else if (sun?.closed) bits.push("일요일 휴진");

    if (bits.length) {
      faqs.push({
        q: `${name}${은는} 주말에도 진료하나요?`,
        a: `${bits.join(", ")}입니다. 주말 진료는 일정에 따라 변경될 수 있으니 방문 전 전화로 확인하시는 것을 권장합니다.`,
      });
    }
  }

  // 4) 찾아가는 길 — 주소는 항상, 지하철은 데이터가 있을 때만
  if (addr) {
    const parts = [`주소는 ${addr}입니다.`];
    const st = h.nearestStation;
    if (st?.name) {
      const station = st.name.endsWith("역") ? st.name : `${st.name}역`;
      const line = st.line ? `${st.line} ` : "";
      const exit = st.exit ? ` ${st.exit}번 출구에서` : "에서";
      parts.push(
        `${line}${station}${exit} 도보 약 ${walkMinutes(st.distanceM)}분(약 ${st.distanceM}m) 거리입니다.`,
      );
    }
    faqs.push({ q: `${name}${은는} 어떻게 찾아가나요?`, a: parts.join(" ") });
  }

  // 5) 진료과목
  if (h.departments.length > 0) {
    faqs.push({
      q: `${name}${은는} 어떤 진료과목을 진료하나요?`,
      a: `${h.departments.join(", ")} 진료를 봅니다. 증상에 따라 진료 가능 여부가 다를 수 있으니, 방문 전 전화로 문의하시는 것을 권장합니다.`,
    });
  }

  // 6) 주차 — 편의정보에 명시된 경우에만 (없으면 문항 자체를 만들지 않음)
  if (h.amenities?.includes("주차가능")) {
    faqs.push({
      q: `${name}에 주차할 수 있나요?`,
      a: "주차가 가능합니다. 주차 가능 대수와 요금은 병원 사정에 따라 다를 수 있으니 방문 전 전화로 확인하시는 것을 권장합니다.",
    });
  }

  // 7) 전화 문의
  if (h.phone) {
    faqs.push({
      q: `${name} 전화번호는 어떻게 되나요?`,
      a: `대표 전화는 ${h.phone}입니다. 진료 가능 여부와 대기 상황은 병원으로 직접 문의하시는 것이 가장 정확합니다.`,
    });
  }

  return faqs;
}
