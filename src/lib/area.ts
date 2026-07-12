import type { Hospital } from "@/types/hospital";

/**
 * 지역 랜딩 도메인 로직 — 고유 소개문·FAQ 자동 생성(thin page 방지). (WIREFRAME 4-4 / SEO §2-2)
 */

export function buildAreaIntro(
  region: string,
  department?: string,
): string {
  if (department) {
    return `${region}에서 ${department} 진료가 가능한 병원을 모았습니다. 위치·진료시간·연락처를 비교하고 가까운 ${department} 병원을 찾아보세요.`;
  }
  return `${region}의 병원·의원을 진료과목별로 찾아보세요. 위치·진료시간·연락처를 한눈에 확인할 수 있습니다.`;
}

export function buildAreaFaqs(
  region: string,
  department?: string,
): { q: string; a: string }[] {
  const subject = department ? `${region} ${department}` : `${region} 병원`;
  return [
    {
      q: `${subject} 야간·주말 진료가 가능한가요?`,
      a: `병원마다 진료시간이 다릅니다. 각 병원 상세에서 요일별 진료시간과 휴진일을 확인하세요.`,
    },
    {
      q: `${subject}는 어떻게 찾나요?`,
      a: `메디로드 지도와 목록에서 ${subject}을(를) 위치·평점과 함께 비교해 선택할 수 있습니다.`,
    },
    {
      q: `예약 없이 방문할 수 있나요?`,
      a: `대부분 방문 접수가 가능하나, 대기 시간 단축을 위해 각 병원에 전화 예약을 권장합니다.`,
    },
  ];
}

/** 병원 목록에서 등장하는 진료과목 집합 */
export function departmentsOf(hospitals: Hospital[]): string[] {
  return Array.from(new Set(hospitals.flatMap((h) => h.departments)));
}
