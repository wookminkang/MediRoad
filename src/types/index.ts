/** 위경도 좌표 (지도·거리 계산 공통) */
export type LatLng = {
  lat: number;
  lng: number;
};

/** 지도 가시 영역 (검색 bounds 등에 사용) */
export type LatLngBounds = {
  sw: LatLng; // 남서 (south-west)
  ne: LatLng; // 북동 (north-east)
};

/** 목록 응답 공통 래퍼 (실API 페이지네이션 대비) */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
