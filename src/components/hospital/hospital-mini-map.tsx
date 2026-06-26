"use client";

import { useEffect, useRef } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

let scriptPromise: Promise<void> | null = null;
function loadNaver(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).naver?.maps) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("네이버 지도 로드 실패"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

const PIN_HTML = `<div style="position:relative;width:56px;height:56px;transform:translate(-50%,-50%);pointer-events:none">
  <div style="position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:9999px;background:rgba(30,91,214,.25);animation:mediroad-ping 1.6s cubic-bezier(0,0,.2,1) infinite"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:9999px;background:#1E5BD6;border:4px solid #fff;box-shadow:0 3px 10px rgba(30,91,214,.5)"></div>
</div>`;

/** 병원 상세용 미니맵 — 단일 마커, 휠 줌 비활성(페이지 스크롤 보호) */
export function HospitalMiniMap({
  lat,
  lng,
  className = "",
}: {
  lat: number;
  lng: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadNaver()
      .then(() => {
        if (cancelled || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const naver = (window as any).naver;
        const center = new naver.maps.LatLng(lat, lng);
        const map = new naver.maps.Map(ref.current, {
          center,
          zoom: 16,
          scrollWheel: false,
          draggable: true,
          scaleControl: false,
          mapDataControl: false,
        });
        new naver.maps.Marker({
          position: center,
          map,
          icon: { content: PIN_HTML, anchor: new naver.maps.Point(0, 0) },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return <div ref={ref} className={`bg-neutral-weak ${className}`} />;
}
