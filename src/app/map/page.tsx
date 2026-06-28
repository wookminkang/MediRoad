import type { Metadata, Viewport } from "next";

import { getRegionClusters } from "@/api/hospital";
import { MapExplorer } from "@/components/map/map-explorer";

export const metadata: Metadata = {
  title: "지도에서 병원 찾기",
  description: "지도에서 내 주변 병원을 찾아보세요.",
  robots: { index: false, follow: true }, // 인터랙티브 지도 UX → noindex
};

// 지도 페이지 한정: 인풋 포커스 시 자동 확대·핀치 줌 방지(지도 자체 줌 사용).
// 콘텐츠 페이지(칼럼·병원상세)는 영향 없음 — 접근성 유지.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 초기 화면(강남, 시군구) 클러스터를 SSR로 미리 받아 지도 로드와 겹침 → 즉시 표시.
// 5분 캐시(지역 통계는 거의 불변).
export const revalidate = 300;

export default async function MapPage() {
  const initialClusters = await getRegionClusters("sigungu", {
    minLat: 37.42,
    minLng: 126.87,
    maxLat: 37.58,
    maxLng: 127.19,
  });
  return <MapExplorer initialClusters={initialClusters} />;
}
