/**
 * 역세권 랜딩(/near/{역}[/{과목}]) 도메인 로직.
 * - station_name은 DB에 "역" 접미 없이 저장되고 일부는 괄호 부기명이 붙음
 *   (예: "서울대입구(관악구청)"). URL·표시는 clean 이름 + "역", 쿼리는 clean base 접두 매칭.
 * - thin page 방지를 위해 고유 소개문·FAQ를 생성. (SEO §4-2)
 */

import { STATION_TARGETS } from "@/constants/stations.generated";
import type { Hospital } from "@/types/hospital";

/** 같은 시군구의 다른 역(clean) — 병원수 내림차순. (역세권 인접 내부링크) */
export function nearbyStationsInSigungu(
  sigungu: string | undefined,
  excludeStation: string,
  limit = 6,
): string[] {
  if (!sigungu) return [];
  const ex = cleanStationName(excludeStation);
  return STATION_TARGETS.filter((s) => s.sigungu === sigungu && s.name !== ex)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((s) => s.name);
}

/** 병원 목록에서 최근접 역(clean) 상위 N개 — 빈도 내림차순. (지역↔역세권 교차 링크) */
export function topStationsOf(hospitals: Hospital[], limit = 12): string[] {
  const freq = new Map<string, number>();
  for (const h of hospitals) {
    const raw = h.nearestStation?.name;
    if (!raw) continue;
    const c = cleanStationName(raw);
    if (c) freq.set(c, (freq.get(c) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

/** 원시 station_name → clean 역명(괄호 부기·공백 제거). 예: "서울대입구(관악구청)" → "서울대입구" */
export function cleanStationName(raw: string): string {
  return raw
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, "")
    .replace(/역$/, "")
    .trim();
}

/** clean 역명 → URL·표시 세그먼트("역" 접미 1회). 예: "서울대입구" → "서울대입구역" */
export function stationSegment(clean: string): string {
  const c = clean.trim();
  return c.endsWith("역") ? c : `${c}역`;
}

/** URL 세그먼트 → 쿼리용 base(끝 "역" 1회 제거). 예: "서울대입구역" → "서울대입구" */
export function stationBase(segment: string): string {
  return segment.trim().replace(/역$/, "");
}

export function buildStationIntro(
  station: string,
  department?: string,
): string {
  if (department) {
    return `${station} 주변에서 ${department} 진료가 가능한 병원을 모았습니다. 최근접 역 기준으로 위치·진료시간·연락처를 비교하고 가까운 ${department}를 찾아보세요.`;
  }
  return `${station} 주변 병원·의원을 진료과목별로 찾아보세요. 최근접 역 기준으로 위치·진료시간·연락처를 한눈에 확인할 수 있습니다.`;
}

export function buildStationFaqs(
  station: string,
  department?: string,
): { q: string; a: string }[] {
  const subject = department ? `${station} ${department}` : `${station} 병원`;
  return [
    {
      q: `${subject} 야간·주말 진료가 가능한가요?`,
      a: `병원마다 진료시간이 다릅니다. 각 병원 상세에서 요일별 진료시간과 휴진일을 확인하세요.`,
    },
    {
      q: `이 목록은 어떤 기준으로 모았나요?`,
      a: `${station}을(를) 최근접 지하철역으로 두는 병원을 모은 목록입니다. 각 병원 상세에서 역·출구·도보 거리를 확인할 수 있습니다.`,
    },
    {
      q: `예약 없이 방문할 수 있나요?`,
      a: `대부분 방문 접수가 가능하나, 대기 시간 단축을 위해 각 병원에 전화로 예약·진료 가능 여부를 확인하는 것을 권장합니다.`,
    },
  ];
}
