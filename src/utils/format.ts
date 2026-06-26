/** 거리(m) → 사람이 읽는 형식 (1km 미만은 m, 이상은 km) */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** ISO 날짜("2026-06-23"...) → "2026.06.23" (년.월.일) */
export function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, ".");
}
