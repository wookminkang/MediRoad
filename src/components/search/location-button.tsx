"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ActionButton } from "@seed-design/react";

/**
 * "내 위치로 찾기" — Geolocation으로 좌표를 받아 URL(lat/lng)에 넣고 재조회.
 * 권한 거부·미지원 시 기본 위치(강남역) 기준으로 동작(서버 fallback).
 */
export function LocationButton() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = new URLSearchParams(params.toString());
        p.set("lat", pos.coords.latitude.toFixed(5));
        p.set("lng", pos.coords.longitude.toFixed(5));
        if (!p.get("radius")) p.set("radius", "3");
        router.push(`/hospitals?${p.toString()}`);
        setLoading(false);
      },
      () => {
        alert("위치 권한이 필요합니다.");
        setLoading(false);
      },
    );
  };

  return (
    <ActionButton
      type="button"
      variant="brandSolid"
      size="medium"
      onClick={useMyLocation}
      disabled={loading}
      className="w-full"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 21s-7-6.5-7-11a7 7 0 0114 0c0 4.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
      {loading ? "위치 확인 중…" : "내 위치로 찾기"}
    </ActionButton>
  );
}
