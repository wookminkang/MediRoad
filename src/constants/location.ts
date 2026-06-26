import type { LatLng } from "@/types";

/**
 * 기본 위치 — 위치 권한 거부·미지원·SSR 기준점. (WIREFRAME 4-1 "내 근처 병원")
 * 위치 허용 시 클라이언트에서 실제 위치로 거리순 재정렬.
 */
export const DEFAULT_LOCATION: LatLng & { name: string } = {
  name: "강남역",
  lat: 37.4979,
  lng: 127.0276,
};
