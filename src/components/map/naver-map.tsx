"use client";

import { useEffect, useRef } from "react";

import type { Hospital } from "@/types/hospital";

export type Bounds = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export type ClusterPoint = {
  region: string;
  sido: string;
  cnt: number;
  lat: number;
  lng: number;
};

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function markerHtml(name: string, selected: boolean): string {
  const dotRing = selected ? ",0 0 0 5px rgba(30,91,214,.35)" : "";
  const pillBg = selected ? "#1E5BD6" : "#fff";
  const pillColor = selected ? "#fff" : "#1f2937";
  return `<div style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap;font-family:Pretendard,sans-serif">
    <span style="box-sizing:border-box;flex:none;width:14px;height:14px;border-radius:9999px;background:#1E5BD6;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)${dotRing}"></span>
    <span style="background:${pillBg};color:${pillColor};font-size:12px;font-weight:600;padding:2px 7px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.25)">${escapeHtml(name)}</span>
  </div>`;
}

function gridHtml(cnt: number): string {
  const size = Math.round(Math.max(40, Math.min(40 + Math.log2(cnt + 1) * 7, 86)));
  return `<div style="transform:translate(-50%,-50%);width:${size}px;height:${size}px;border-radius:9999px;background:rgba(30,91,214,.78);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;font-family:Pretendard,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(30,91,214,.4)">${cnt.toLocaleString()}</div>`;
}

function clusterHtml(c: ClusterPoint): string {
  return `<div style="transform:translate(-50%,-50%);background:#1E5BD6;color:#fff;border-radius:10px;padding:6px 11px;text-align:center;box-shadow:0 2px 8px rgba(30,91,214,.4);white-space:nowrap;font-family:Pretendard,sans-serif;cursor:pointer">
    <div style="font-weight:700;font-size:13px">${c.region}</div>
    <div style="font-size:12px;margin-top:1px;opacity:.9">${c.cnt.toLocaleString()}곳</div>
  </div>`;
}

// 같은 건물(동일 좌표) 다중 병원 → 카운트 버블. 클릭 시 좌측에 그 건물 목록 노출.
function buildingHtml(cnt: number, selected: boolean): string {
  const ring = selected
    ? "box-shadow:0 0 0 5px rgba(30,91,214,.35),0 2px 8px rgba(30,91,214,.4);"
    : "box-shadow:0 2px 8px rgba(30,91,214,.4);";
  return `<div style="transform:translate(-50%,-50%);min-width:34px;height:34px;padding:0 9px;border-radius:9999px;background:#1E5BD6;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;font-family:Pretendard,sans-serif;cursor:pointer;border:2px solid #fff;${ring}">${cnt}</div>`;
}

const HIGHLIGHT_HTML = `<div style="width:52px;height:52px;pointer-events:none">
  <div style="position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:9999px;background:rgba(30,91,214,.4);animation:mediroad-ping 0.8s cubic-bezier(0,0,.2,1) infinite"></div>
  <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:9999px;background:#1E5BD6;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>
</div>`;

export function NaverMap({
  mode,
  hospitals,
  clusters,
  center,
  highlightId,
  selectedIds,
  focus,
  onViewChanged,
  onSelect,
  onSelectRegion,
  onSelectGrid,
  onMapDrag,
  panelOpen = false,
}: {
  mode: "marker" | "cluster" | "grid";
  hospitals: Hospital[];
  clusters: ClusterPoint[];
  center: { lat: number; lng: number };
  highlightId?: string | null;
  selectedIds?: string[] | null;
  focus?: { lat: number; lng: number; zoom?: number } | null;
  onViewChanged: (b: Bounds, zoom: number) => void;
  onSelect?: (hs: Hospital[]) => void;
  onSelectRegion?: (c: ClusterPoint) => void;
  onSelectGrid?: (c: ClusterPoint) => void;
  /** 사용자가 지도를 드래그(팬)하기 시작할 때 — 모바일 바텀시트 내리기용 */
  onMapDrag?: () => void;
  /** 모바일 바텀시트가 열려있는지 — 줌/위치 버튼을 시트 위로 올림 */
  panelOpen?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);
  const markersByIdRef = useRef<
    Record<
      string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { mk: any; kind: "single" | "group"; name: string; cnt: number }
    >
  >({});
  const prevSelectedRef = useRef<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wheelListenerRef = useRef<any>(null);
  const onViewRef = useRef(onViewChanged);
  onViewRef.current = onViewChanged;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onSelectRegionRef = useRef(onSelectRegion);
  onSelectRegionRef.current = onSelectRegion;
  const onSelectGridRef = useRef(onSelectGrid);
  onSelectGridRef.current = onSelectGrid;
  const onMapDragRef = useRef(onMapDrag);
  onMapDragRef.current = onMapDrag;

  // 지도 초기화 (1회)
  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadNaver()
      .then(() => {
        if (cancelled || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const naver = (window as any).naver;
        const map = new naver.maps.Map(ref.current, {
          center: new naver.maps.LatLng(center.lat, center.lng),
          zoom: 13,
          scrollWheel: false, // 기본 휠 줌 비활성 → 아래 핸들러로 1단계씩
        });
        mapRef.current = map;

        // 휠/핀치 줌: 네이버 지도는 정수 줌만 지원(소수점은 반올림돼 먹통) → 1단계 고정.
        // 강도 완화는 시간 기반 쿨다운으로 "초당 줌 횟수"를 제한해서 처리.
        const STEP = 1;
        const COOLDOWN = 500; // ms — 이 시간 안의 추가 휠 이벤트는 무시(클수록 완만)
        let lastZoomAt = 0;
        wheelListenerRef.current = naver.maps.Event.addDOMListener(
          ref.current,
          "wheel",
          (e: WheelEvent) => {
            e.preventDefault();
            const now = performance.now();
            if (now - lastZoomAt < COOLDOWN) return;
            lastZoomAt = now;
            const z = map.getZoom();
            map.setZoom(e.deltaY < 0 ? z + STEP : z - STEP, true);
          },
        );
        const emit = () => {
          const b = map.getBounds();
          const sw = b.getSW ? b.getSW() : b.getMin();
          const ne = b.getNE ? b.getNE() : b.getMax();
          onViewRef.current(
            {
              minLat: sw.y ?? sw.lat(),
              minLng: sw.x ?? sw.lng(),
              maxLat: ne.y ?? ne.lat(),
              maxLng: ne.x ?? ne.lng(),
            },
            map.getZoom(),
          );
        };
        naver.maps.Event.addListener(map, "idle", emit);
        // 사용자가 지도를 끌기 시작하면 알림(바텀시트 내리기)
        naver.maps.Event.addListener(map, "dragstart", () =>
          onMapDragRef.current?.(),
        );
        emit();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const naver = (window as any).naver;
      if (naver && wheelListenerRef.current) {
        naver.maps.Event.removeListener(wheelListenerRef.current);
        wheelListenerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 오버레이(마커/클러스터) 갱신 — 마커 풀 재사용(파괴/재생성 최소화로 팬·줌 부드럽게)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const naver = (window as any).naver;
    const map = mapRef.current;
    if (!naver || !map) return;

    type Spec = {
      lat: number;
      lng: number;
      content: string;
      ax: number;
      ay: number;
      kind: "cluster" | "grid" | "single" | "group";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: any;
    };
    const specs: Spec[] = [];

    if (mode === "cluster" || mode === "grid") {
      for (const c of clusters) {
        specs.push({
          lat: c.lat,
          lng: c.lng,
          content: mode === "grid" ? gridHtml(c.cnt) : clusterHtml(c),
          ax: 0,
          ay: 0,
          kind: mode,
          payload: c,
        });
      }
    } else {
      // 화면(픽셀) 근접 마커 그룹화 → 단독은 이름 라벨, 다중은 카운트 버블.
      const withCoords = hospitals.filter((h) => h.location.lat && h.location.lng);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proj = map.getProjection();
      const CELL = 54; // px — 이 격자 안의 마커는 한 버블로 묶음
      const groups = new Map<string, Hospital[]>();
      for (const h of withCoords) {
        let key: string;
        try {
          const p = proj.fromCoordToOffset(
            new naver.maps.LatLng(h.location.lat, h.location.lng),
          );
          key = `${Math.floor(p.x / CELL)}:${Math.floor(p.y / CELL)}`;
        } catch {
          key = `${h.location.lat},${h.location.lng}`;
        }
        const arr = groups.get(key);
        if (arr) arr.push(h);
        else groups.set(key, [h]);
      }
      groups.forEach((arr) => {
        const single = arr.length === 1;
        const lat = single
          ? arr[0].location.lat
          : arr.reduce((s, h) => s + h.location.lat, 0) / arr.length;
        const lng = single
          ? arr[0].location.lng
          : arr.reduce((s, h) => s + h.location.lng, 0) / arr.length;
        specs.push({
          lat,
          lng,
          content: single
            ? markerHtml(arr[0].name, false)
            : buildingHtml(arr.length, false),
          ax: single ? 7 : 0,
          ay: single ? 7 : 0,
          kind: single ? "single" : "group",
          payload: arr,
        });
      });
    }

    // 풀 재사용 reconcile — 위치/아이콘만 갱신, 객체 생성·제거 최소화
    const pool = overlaysRef.current;
    markersByIdRef.current = {};
    prevSelectedRef.current = [];

    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      let mk = pool[i];
      if (!mk) {
        mk = new naver.maps.Marker({
          position: new naver.maps.LatLng(s.lat, s.lng),
          map: null,
        });
        // 단일 위임 클릭 핸들러 — 클릭 시점의 최신 스펙(__spec)으로 분기(리스너 누적 방지)
        naver.maps.Event.addListener(mk, "click", () => {
          const spec = mk.__spec as Spec | undefined;
          if (!spec) return;
          if (spec.kind === "cluster") onSelectRegionRef.current?.(spec.payload);
          else if (spec.kind === "grid") onSelectGridRef.current?.(spec.payload);
          else onSelectRef.current?.(spec.payload);
        });
        pool[i] = mk;
      }
      mk.__spec = s;
      if (mk.__lat !== s.lat || mk.__lng !== s.lng) {
        mk.setPosition(new naver.maps.LatLng(s.lat, s.lng));
        mk.__lat = s.lat;
        mk.__lng = s.lng;
      }
      if (mk.__content !== s.content) {
        mk.setIcon({ content: s.content, anchor: new naver.maps.Point(s.ax, s.ay) });
        mk.__content = s.content;
      }
      if (mk.getMap() !== map) mk.setMap(map);

      if (s.kind === "single" || s.kind === "group") {
        const arr = s.payload as Hospital[];
        for (const h of arr) {
          markersByIdRef.current[h.id] = {
            mk,
            kind: s.kind === "single" ? "single" : "group",
            name: arr[0].name,
            cnt: arr.length,
          };
        }
      }
    }
    // 남는 풀 마커는 지도에서만 숨김(파괴 X → 다음에 재사용)
    for (let i = specs.length; i < pool.length; i++) {
      if (pool[i]?.getMap()) pool[i].setMap(null);
    }
  }, [mode, hospitals, clusters]);

  // 선택된 마커 강조 (이름 라벨 / 건물 버블 하이라이트)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const naver = (window as any).naver;
    if (!naver) return;
    const apply = (id: string, on: boolean) => {
      const entry = markersByIdRef.current[id];
      if (!entry) return;
      const content =
        entry.kind === "group"
          ? buildingHtml(entry.cnt, on)
          : markerHtml(entry.name, on);
      const ax = entry.kind === "group" ? 0 : 7;
      entry.mk.setIcon({ content, anchor: new naver.maps.Point(ax, ax) });
      entry.mk.__content = content; // 풀 메모 동기화(다음 reconcile이 기본 아이콘 복원하도록)
      if (on) entry.mk.setZIndex(900);
    };
    prevSelectedRef.current.forEach((id) => apply(id, false));
    const next = selectedIds ?? [];
    next.forEach((id) => apply(id, true));
    prevSelectedRef.current = next;
  }, [selectedIds, hospitals]);

  // 검색 결과 위치로 지도 이동
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const naver = (window as any).naver;
    const map = mapRef.current;
    if (!naver || !map || !focus) return;
    // 즉시 이동(애니메이션 없음) — morph는 먼 거리일수록 느려 체감 지연이 큼
    const ll = new naver.maps.LatLng(focus.lat, focus.lng);
    map.setZoom(focus.zoom ?? 16, false);
    map.setCenter(ll);
  }, [focus]);

  // 리스트 hover → 해당 마커 강조 (주황 점 + 글로우)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const naver = (window as any).naver;
    const map = mapRef.current;
    if (!naver || !map) return;
    if (!highlightRef.current) {
      highlightRef.current = new naver.maps.Marker({
        position: map.getCenter(),
        map: null,
        icon: { content: HIGHLIGHT_HTML, anchor: new naver.maps.Point(26, 26) },
        zIndex: 1000,
      });
    }
    const h = highlightId ? hospitals.find((x) => x.id === highlightId) : null;
    if (h?.location.lat && h?.location.lng) {
      highlightRef.current.setPosition(new naver.maps.LatLng(h.location.lat, h.location.lng));
      highlightRef.current.setMap(map);
    } else {
      highlightRef.current.setMap(null);
    }
  }, [highlightId, hospitals]);

  const zoomBy = (delta: number) => {
    const map = mapRef.current;
    if (map) map.setZoom(map.getZoom() + delta, true);
  };

  const locateMe = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const naver = (window as any).naver;
    const map = mapRef.current;
    if (!navigator.geolocation || !naver || !map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.morph(new naver.maps.LatLng(pos.coords.latitude, pos.coords.longitude), 16);
      },
      () => alert("현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요."),
    );
  };

  if (!CLIENT_ID) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-weak text-muted">
        네이버 지도 키 미설정
      </div>
    );
  }
  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />

      {/* 커스텀 줌 / 내 위치 컨트롤 */}
      <div
        className={`absolute right-4 z-10 flex flex-col gap-2 md:bottom-8 ${
          panelOpen ? "bottom-[calc(45dvh+1rem)]" : "bottom-8"
        }`}
      >
        <div className="flex flex-col overflow-hidden rounded-2xl bg-[#1E5BD6]/95 shadow-lg">
          <button
            type="button"
            aria-label="확대"
            onClick={() => zoomBy(1)}
            className="flex h-11 w-11 items-center justify-center text-white transition-colors hover:bg-white/10"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <div className="h-px bg-white/15" />
          <button
            type="button"
            aria-label="축소"
            onClick={() => zoomBy(-1)}
            className="flex h-11 w-11 items-center justify-center text-white transition-colors hover:bg-white/10"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          aria-label="내 위치"
          onClick={locateMe}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E5BD6]/95 text-white shadow-lg transition-colors hover:bg-[#1E5BD6]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}
