"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DrawerContent,
  DrawerHandle,
  DrawerPositioner,
  DrawerRoot,
  DrawerTitle,
} from "@seed-design/react-drawer";

import { MEDICAL_DEPARTMENTS } from "@/constants/hospital";
import type { Hospital } from "@/types/hospital";

import { FilterDropdown } from "./filter-dropdown";
import { MapHospitalDetail } from "./map-hospital-detail";
import { MapHospitalList } from "./map-hospital-list";
import { MobileSearch } from "./mobile-search";
import { type Bounds, type ClusterPoint, NaverMap } from "./naver-map";

const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 }; // 강남역
const TYPES = ["병원", "의원", "치과", "한의원", "한방병원"] as const;

const INDIVIDUAL_ZOOM = 16; // 이상: 개별 마커
const GRID_MIN_ZOOM = 14; // 14~15: 그리드 원형 버블
const SIDO_ZOOM = 11; // 이하: 시도 라벨 (12~13: 시군구 라벨)
const gridStep = (zoom: number) => (zoom >= 15 ? 0.006 : 0.012);

/** 야간진료 여부 — 어느 요일이든 20시 이후까지 진료 */
const NIGHT_CUTOFF = "20:00";
function isNightClinic(hours?: Hospital["hours"]): boolean {
  return !!hours?.some((h) => !h.closed && !!h.close && h.close >= NIGHT_CUTOFF);
}

type Filters = { q: string; type: string; department: string };

export function MapExplorer({
  initialClusters = [],
}: {
  initialClusters?: ClusterPoint[];
}) {
  const [mode, setMode] = useState<"marker" | "cluster" | "grid">("cluster");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [clusters, setClusters] = useState<ClusterPoint[]>(initialClusters);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({ q: "", type: "", department: "" });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // 마커/건물버블 클릭 시 좌측엔 그 그룹(같은 건물이면 여러 곳)만 노출
  const [selectedGroup, setSelectedGroup] = useState<Hospital[] | null>(null);
  // 좌측 리스트에서 병원 클릭 시 상세 패널(PC) — 풀 디테일 fetch
  const [detailHospital, setDetailHospital] = useState<Hospital | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailSeqRef = useRef(0);
  // 검색 모드: 지도에 검색 결과 마커만 표시 (뷰포트 재조회 안 함)
  const [searchResults, setSearchResults] = useState<Hospital[] | null>(null);
  const searchActiveRef = useRef(false);
  const appliedQRef = useRef(""); // URL에 반영된 적용 검색어
  const [qInput, setQInput] = useState("");
  const [focus, setFocus] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  // 모바일 바텀시트 활성 스냅 포인트(0.5=절반, 1=전체)
  const [snap, setSnap] = useState<number | string | null>(0.5);
  // 모바일 검색 전용 화면 표시 여부
  const [searchPageOpen, setSearchPageOpen] = useState(false);
  // 사용자 현재 위치 (검색 자동완성 거리 계산용)
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  // 마지막 선택 시각 — 선택 직후 탭의 미세드래그(dragstart)로 시트가 내려가는 race 방지
  const lastSelectRef = useRef(0);
  /** 마커/지역/검색 선택 시 시트를 절반으로 올리고, 직후 드래그-내림을 잠시 억제 */
  const raiseSheet = () => {
    lastSelectRef.current = Date.now();
    setSnap(0.5);
  };
  const [openOnly, setOpenOnly] = useState(false); // 영업중만 보기
  const [nightOnly, setNightOnly] = useState(false); // 야간진료만 보기
  // fetchForView(useCallback []) 에서 최신 토글값 읽기용 ref
  const openOnlyRef = useRef(false);
  openOnlyRef.current = openOnly;
  const nightOnlyRef = useRef(false);
  nightOnlyRef.current = nightOnly;
  const [viewCount, setViewCount] = useState(0); // 현재 뷰포트 병원 수

  // 지역 클러스터 클릭 → 그 지역 병원 전체 무한스크롤
  const [regionMode, setRegionMode] = useState<{
    label: string;
    region?: string;
    sido: string;
  } | null>(null);
  const [regionItems, setRegionItems] = useState<Hospital[]>([]);
  const [regionPage, setRegionPage] = useState(1);
  const [regionTotal, setRegionTotal] = useState(0);
  const [regionLoading, setRegionLoading] = useState(false);

  const searchActive = searchResults !== null;
  const regionActive = regionMode !== null;
  // 영업중만 보기 필터
  // 영업중·야간진료 클라이언트 필터 (진료시간 기준)
  const openFilter = (arr: Hospital[]) =>
    arr.filter(
      (h) =>
        (!openOnly || h.isOpenNow) && (!nightOnly || isNightClinic(h.hours)),
    );
  // 좌측 리스트: 지역 모드 > 검색 결과 > 마커 클릭 그룹
  const shown = searchResults ?? selectedGroup;
  const hasPanel = regionActive || shown !== null;
  const listItems = useMemo(
    () => openFilter(regionActive ? regionItems : (shown ?? [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regionActive, regionItems, shown, openOnly, nightOnly],
  );
  // 지도에 넘길 마커 배열 — 새 참조가 매 렌더 생기면 마커 reconcile이 헛돌므로 메모.
  const mapHospitals = useMemo(
    () => openFilter(searchActive ? (searchResults ?? []) : hospitals),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchActive, searchResults, hospitals, openOnly, nightOnly],
  );
  const selectedIds = useMemo(
    () => selectedGroup?.map((h) => h.id) ?? null,
    [selectedGroup],
  );

  const viewRef = useRef<{ b: Bounds; zoom: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 요청 순번 + 진행 중 요청 취소 — 빠른 팬/줌 시 이전 응답이 최신을 덮어쓰는 race 방지
  const reqSeqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchForView = useCallback(async (b: Bounds, zoom: number, f: Filters) => {
    const common = new URLSearchParams({
      minLat: String(b.minLat),
      minLng: String(b.minLng),
      maxLat: String(b.maxLat),
      maxLng: String(b.maxLng),
    });
    if (f.q) common.set("q", f.q);
    if (f.type) common.set("type", f.type);
    if (f.department) common.set("department", f.department);
    if (openOnlyRef.current) common.set("open", "1"); // 클러스터/그리드 영업중 필터
    if (nightOnlyRef.current) common.set("night", "1"); // 야간진료 필터

    // 이전 요청 취소 + 이번 요청 순번 발급
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const seq = ++reqSeqRef.current;
    const isStale = () => seq !== reqSeqRef.current; // 더 새 요청이 시작됐으면 폐기

    setLoading(true);
    try {
      if (zoom >= INDIVIDUAL_ZOOM) {
        const res = await fetch(`/api/hospitals/bounds?${common}`, { signal: ac.signal });
        const json = await res.json();
        if (isStale()) return;
        setHospitals(json.items ?? []);
        setMode("marker");
        // marker 모드 드래그 중엔 선택 유지 (초기화하지 않음)
      } else if (zoom >= GRID_MIN_ZOOM) {
        common.set("step", String(gridStep(zoom)));
        const res = await fetch(`/api/hospitals/grid?${common}`, { signal: ac.signal });
        const json = await res.json();
        if (isStale()) return;
        setClusters(
          (json.clusters ?? []).map(
            (g: { lat: number; lng: number; cnt: number }) => ({
              region: "",
              sido: "",
              ...g,
            }),
          ),
        );
        setMode("grid");
      } else {
        // 지역 클러스터(저줌)는 필터를 붙이면 넓은 영역을 즉석 집계해 느림(~1s).
        // → 사전계산 통계(무필터, <200ms)만 사용. 필터는 그리드·마커(줌인) 단계에서 적용.
        const cp = new URLSearchParams({
          minLat: String(b.minLat),
          minLng: String(b.minLng),
          maxLat: String(b.maxLat),
          maxLng: String(b.maxLng),
          level: zoom <= SIDO_ZOOM ? "sido" : "sigungu",
        });
        const res = await fetch(`/api/hospitals/clusters?${cp}`, { signal: ac.signal });
        const json = await res.json();
        if (isStale()) return;
        // 지역 중심이 화면 밖이면 라벨을 화면 안(가장자리)으로 클램프 → 항상 보이게
        const padLat = (b.maxLat - b.minLat) * 0.08;
        const padLng = (b.maxLng - b.minLng) * 0.08;
        const clamp = (v: number, lo: number, hi: number) =>
          Math.max(lo, Math.min(hi, v));
        setClusters(
          (json.clusters ?? []).map(
            (c: { lat: number; lng: number; cnt: number; region: string; sido: string }) => ({
              ...c,
              lat: clamp(c.lat, b.minLat + padLat, b.maxLat - padLat),
              lng: clamp(c.lng, b.minLng + padLng, b.maxLng - padLng),
            }),
          ),
        );
        setMode("cluster");
      }
    } catch (e) {
      // 취소(AbortError)는 정상 — 그 외만 무시(다음 뷰에서 재시도)
      if ((e as Error)?.name !== "AbortError") {
        /* noop: 네트워크 일시오류는 다음 idle에서 회복 */
      }
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, []);

  const firstLoadRef = useRef(true);
  const onViewChanged = useCallback(
    (b: Bounds, zoom: number) => {
      viewRef.current = { b, zoom };
      if (searchActiveRef.current) return; // 검색 중엔 뷰포트 재조회 안 함
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // 첫 로딩은 디바운스 없이 즉시 조회 (초기 진입 지연 제거)
      if (firstLoadRef.current) {
        firstLoadRef.current = false;
        fetchForView(b, zoom, filters);
        return;
      }
      debounceRef.current = setTimeout(() => fetchForView(b, zoom, filters), 350);
    },
    [fetchForView, filters],
  );

  // 리스트 카드 클릭 → 그 병원 위치로 지도 이동
  const focusHospital = (h: Hospital) => {
    if (h.location?.lat && h.location?.lng) {
      setFocus({ lat: h.location.lat, lng: h.location.lng });
    }
  };

  // 리스트 항목 클릭(PC) → 지도 포커스 + 상세 패널 열고 풀 디테일 fetch
  const openDetail = (h: Hospital) => {
    focusHospital(h);
    setDetailHospital(h); // 우선 리스트 데이터로 즉시 표시
    const seq = ++detailSeqRef.current;
    setDetailLoading(true);
    fetch(`/api/hospitals/${encodeURIComponent(h.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (seq !== detailSeqRef.current) return; // 더 최근 선택이 있으면 무시
        if (d?.hospital) setDetailHospital(d.hospital as Hospital);
      })
      .catch(() => {})
      .finally(() => {
        if (seq === detailSeqRef.current) setDetailLoading(false);
      });
  };
  const closeDetail = () => {
    detailSeqRef.current++;
    setDetailHospital(null);
    setDetailLoading(false);
  };

  // URL 쿼리파라미터 동기화 (q·type·department) — replaceState로 가볍게
  const syncUrl = (q: string, type: string, department: string) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (type) sp.set("type", type);
    if (department) sp.set("department", department);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  const updateFilter = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    syncUrl(appliedQRef.current, next.type, next.department);
    if (viewRef.current) fetchForView(viewRef.current.b, viewRef.current.zoom, next);
  };

  // 좌측 패널(검색/지역/선택) 닫고 일반 모드 복귀
  const clearSearch = () => {
    searchActiveRef.current = false;
    appliedQRef.current = "";
    detailSeqRef.current++;
    setDetailHospital(null);
    setDetailLoading(false);
    setSearchResults(null);
    setSelectedGroup(null);
    setRegionMode(null);
    setRegionItems([]);
    setRegionTotal(0);
    setFocus(null);
    setQInput("");
    syncUrl("", filters.type, filters.department);
    if (viewRef.current) fetchForView(viewRef.current.b, viewRef.current.zoom, filters);
  };

  // 자동완성에서 병원 선택 → 그 병원만 지도/리스트에 바로 표시
  const pickHospital = (h: Hospital) => {
    searchActiveRef.current = true;
    appliedQRef.current = h.name;
    setQInput(h.name);
    setRegionMode(null);
    setSelectedGroup(null);
    setSearchResults([h]);
    syncUrl(h.name, filters.type, filters.department);
    if (h.location?.lat && h.location?.lng) {
      setFocus({ lat: h.location.lat, lng: h.location.lng, zoom: 16 });
    }
    raiseSheet();
    setSearchPageOpen(false);
  };

  // 지역 병원 페이지 로드 (무한스크롤)
  const REGION_PAGE_SIZE = 24;
  const loadRegionPage = useCallback(
    async (rm: { region?: string; sido: string }, page: number) => {
      const params = new URLSearchParams({ page: String(page) });
      if (rm.region) params.set("region", rm.region);
      if (rm.sido) params.set("sido", rm.sido);
      setRegionLoading(true);
      try {
        const res = await fetch(`/api/hospitals?${params}`);
        const json = await res.json();
        const items: Hospital[] = json.items ?? [];
        setRegionItems((prev) => (page === 1 ? items : [...prev, ...items]));
        setRegionTotal(json.total ?? 0);
        setRegionPage(page);
      } finally {
        setRegionLoading(false);
      }
    },
    [],
  );

  // 지역 클러스터 클릭 → 그 지역 병원 전체 로드
  const onSelectRegion = (c: ClusterPoint) => {
    raiseSheet(); // 지역 선택 → 바텀시트 절반으로 올림
    const isSido = c.region === c.sido;
    const rm = {
      label: `${c.region} ${c.cnt.toLocaleString()}곳`,
      region: isSido ? undefined : c.region,
      sido: c.sido,
    };
    searchActiveRef.current = false;
    setSearchResults(null);
    setSelectedGroup(null);
    setRegionItems([]);
    setRegionTotal(0);
    setRegionPage(1);
    setRegionMode(rm);
    loadRegionPage(rm, 1);
  };

  // 하단 CTA "이 지역 N곳 보기" → 현재 뷰포트 병원 전체를 좌측 리스트로
  const openViewList = async () => {
    if (!viewRef.current) return;
    const b = viewRef.current.b;
    const params = new URLSearchParams({
      minLat: String(b.minLat),
      minLng: String(b.minLng),
      maxLat: String(b.maxLat),
      maxLng: String(b.maxLng),
    });
    if (filters.type) params.set("type", filters.type);
    if (filters.department) params.set("department", filters.department);
    searchActiveRef.current = false;
    setSearchResults(null);
    setRegionMode(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/hospitals/bounds?${params}`);
      const json = await res.json();
      setSelectedGroup(json.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  // 그리드 버블 클릭 → 그 셀(step 격자)의 병원 목록 로드
  const onSelectGrid = async (c: ClusterPoint) => {
    raiseSheet(); // 그리드 셀 선택 → 바텀시트 절반으로 올림
    const zoom = viewRef.current?.zoom ?? 15;
    const step = gridStep(zoom);
    const minLat = Math.floor(c.lat / step) * step;
    const minLng = Math.floor(c.lng / step) * step;
    const params = new URLSearchParams({
      minLat: String(minLat),
      minLng: String(minLng),
      maxLat: String(minLat + step),
      maxLng: String(minLng + step),
    });
    if (filters.type) params.set("type", filters.type);
    if (filters.department) params.set("department", filters.department);
    searchActiveRef.current = false;
    setSearchResults(null);
    setRegionMode(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/hospitals/bounds?${params}`);
      const json = await res.json();
      setSelectedGroup(json.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  // 무한스크롤 — 리스트 컴포넌트(MapHospitalList)가 자체 IO로 onLoadMore 호출
  const canLoadMore =
    regionActive && !regionLoading && regionItems.length < regionTotal;
  const loadMore = useCallback(() => {
    if (regionMode) loadRegionPage(regionMode, regionPage + 1);
  }, [regionMode, regionPage, loadRegionPage]);

  // 바텀시트는 열릴 때마다 절반(0.5) 스냅에서 시작
  useEffect(() => {
    if (hasPanel) setSnap(0.5);
  }, [hasPanel]);

  // 지도 페이지 동안 페이지 스크롤 잠금 (모바일 주소창/오버스크롤로 영역 들썩임 방지)
  // 이탈(언마운트) 시엔 무조건 해제 — 다른 페이지에서 스크롤 막히는 문제 방지
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.overscrollBehavior = "";
    };
  }, []);

  // 최초 진입 시 URL 쿼리파라미터로 상태 복원 (공유/새로고침/뒤로가기)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("type") ?? "";
    const d = sp.get("department") ?? "";
    const q = sp.get("q") ?? "";
    if (t || d) setFilters((f) => ({ ...f, type: t, department: d }));
    if (q) {
      setQInput(q);
      runSearch(q);
    }
    // lat·lng → 해당 좌표로 지도 이동 (zoom 옵션, 기본 14: 구 단위 분포 보기)
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    const hasLatLng =
      Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
    if (hasLatLng) {
      const z = Number(sp.get("zoom"));
      setFocus({ lat, lng, zoom: Number.isFinite(z) && z > 0 ? z : 14 });
    }

    const near = sp.get("near") === "1";
    if (near && navigator.geolocation) {
      // near=1 → 내 위치로 이동 (진료과 필터는 위에서 적용됨)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          setFocus(loc);
        },
        () => alert("위치 권한을 허용하면 내 주변 병원을 보여드려요."),
      );
    } else if (!near && !hasLatLng && !q && navigator.geolocation) {
      // 지도 진입 시 위치 권한 요청 → 허용하면 내 위치로 이동(거부 시 기본 위치 유지)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          setFocus({ ...loc, zoom: 15 });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      );
    } else if (navigator.geolocation) {
      // 좌표/검색 진입이어도 거리 계산용으로 위치는 조용히 확보(이동은 안 함)
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 이름 검색: 전국에서 찾아 "검색 결과 마커만" 표시 + 좌측 리스트 + 지도 이동.
  const runSearch = async (raw: string) => {
    const q = raw.trim();
    if (!q) {
      clearSearch();
      return;
    }
    const params = new URLSearchParams({ q });
    if (filters.department) params.set("department", filters.department);
    setLoading(true);
    try {
      const res = await fetch(`/api/hospitals?${params}`);
      const json = await res.json();
      const items: Hospital[] = json.items ?? [];
      searchActiveRef.current = true;
      appliedQRef.current = q;
      syncUrl(q, filters.type, filters.department);
      setSearchResults(items);
      setSelectedGroup(null);
      raiseSheet(); // 검색 결과 → 바텀시트 절반으로 올림
      const first = items.find((h) => h.location?.lat && h.location?.lng);
      if (first) setFocus({ lat: first.location.lat, lng: first.location.lng });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
      {/* 데스크톱 좌측 리스트 — 지도 위에 떠 있는 플로팅 패널(지도 레이아웃 안 밀림) */}
      {hasPanel && (
        <aside className="absolute bottom-3 left-3 top-[4.25rem] z-20 hidden w-80 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl md:flex">
          <MapHospitalList
            idPrefix="d"
            items={listItems}
            hasPanel={hasPanel}
            regionActive={regionActive}
            searchActive={searchActive}
            mode={mode}
            regionLabel={regionMode?.label}
            regionLoading={regionLoading}
            regionTotal={regionTotal}
            regionShown={regionItems.length}
            canLoadMore={canLoadMore}
            onLoadMore={loadMore}
            onClose={clearSearch}
            onFocus={focusHospital}
            onOpenDetail={openDetail}
            activeId={detailHospital?.id ?? null}
            onHover={setHoveredId}
          />
        </aside>
      )}

      {/* 데스크톱 상세 패널 — 리스트 오른쪽에 별도 패널로 표시 */}
      {detailHospital && (
        <aside className="absolute bottom-3 left-[21.25rem] top-[4.25rem] z-30 hidden w-96 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl md:flex">
          <MapHospitalDetail
            hospital={detailHospital}
            loading={detailLoading}
            onBack={closeDetail}
            onClose={closeDetail}
          />
        </aside>
      )}

      {/* 모바일 바텀시트 — Seed Drawer(snapPoints), md 미만에서만 */}
      <div className="md:hidden">
        <DrawerRoot
          open={hasPanel}
          onOpenChange={(open) => {
            if (!open) clearSearch();
          }}
          snapPoints={[0.12, 0.5, 1]}
          activeSnapPoint={snap}
          setActiveSnapPoint={setSnap}
          modal={false}
          dismissible
          snapToSequentialPoint
          scrollLockTimeout={100}
        >
          <DrawerPositioner
            className="seed-bottom-sheet__positioner pointer-events-none"
            style={{ "--sheet-z-index": 20 } as React.CSSProperties}
          >
            <DrawerContent className="seed-bottom-sheet__content pointer-events-auto h-[90dvh] w-full touch-none">
              <DrawerTitle className="sr-only">병원 목록</DrawerTitle>
              {/* 핸들 — 넓은 터치 영역으로 지도와 겹쳐 드래그되는 문제 방지 */}
              <DrawerHandle className="flex w-full shrink-0 cursor-grab touch-none items-center justify-center py-3">
                <span className="h-1.5 w-10 rounded-full bg-[#C7CDD6]" />
              </DrawerHandle>
              <MapHospitalList
                idPrefix="m"
                items={listItems}
                hasPanel={hasPanel}
                regionActive={regionActive}
                searchActive={searchActive}
                mode={mode}
                regionLabel={regionMode?.label}
                regionLoading={regionLoading}
                regionTotal={regionTotal}
                regionShown={regionItems.length}
                canLoadMore={canLoadMore}
                onLoadMore={loadMore}
                onClose={clearSearch}
                onFocus={focusHospital}
                onHover={setHoveredId}
                // 시트가 완전히 펼쳐졌을 때만 리스트 스크롤 허용 (그 전엔 위 스와이프=시트 확장)
                scrollable={Number(snap) >= 0.99}
              />
            </DrawerContent>
          </DrawerPositioner>
        </DrawerRoot>
      </div>

      {/* 지도 + 상단 필터바 — 항상 풀폭(리스트는 위에 떠서 표시) */}
      <div className="relative isolate h-full w-full">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 px-3 py-3">
          {/* 모바일 검색 트리거 — 탭하면 검색 전용 화면 / 검색중이면 쿼리+닫기 표시 */}
          <div className="pointer-events-auto flex w-full items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setSearchPageOpen(true)}
              className="flex flex-1 items-center gap-2 rounded-full border border-black/5 bg-white py-2.5 pl-4 pr-3 text-left shadow-md"
            >
              <svg className="shrink-0 text-subtle" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className={`flex-1 truncate text-sm ${searchActive ? "font-medium text-neutral" : "text-subtle"}`}>
                {searchActive ? appliedQRef.current : "병원 이름 검색"}
              </span>
              {searchActive && (
                <span
                  role="button"
                  aria-label="검색 닫기"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSearch();
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/10 text-neutral"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </span>
              )}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(qInput);
            }}
            className="pointer-events-auto hidden items-center gap-1.5 md:flex"
          >
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="병원 이름 검색"
                className="w-48 rounded-full border border-black/5 bg-white py-2 pl-9 pr-4 text-base shadow-md focus:border-[#1E5BD6] focus:outline-none focus:ring-2 focus:ring-[#1E5BD6]/30"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-[#1E5BD6] px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#1a4fbb]"
            >
              검색
            </button>
          </form>
          <div
            className={`pointer-events-auto items-center gap-2 ${
              searchActive ? "hidden md:flex" : "flex"
            }`}
          >
            <FilterDropdown
              label="종별"
              value={filters.type}
              options={TYPES.map((t) => ({ value: t, label: t }))}
              onChange={(v) => updateFilter({ type: v })}
            />
            <FilterDropdown
              label="진료과목"
              value={filters.department}
              options={MEDICAL_DEPARTMENTS.map((d) => ({ value: d, label: d }))}
              onChange={(v) => updateFilter({ department: v })}
              panelWidthPx={320}
            />
            <button
              type="button"
              onClick={() => {
                const next = !openOnly;
                openOnlyRef.current = next;
                setOpenOnly(next);
                if (viewRef.current)
                  fetchForView(viewRef.current.b, viewRef.current.zoom, filters);
              }}
              aria-pressed={openOnly}
              className={`rounded-full border px-4 py-2 text-sm font-medium shadow-md transition-colors ${
                openOnly
                  ? "border-transparent bg-[#1E5BD6] text-white"
                  : "border-black/5 bg-white text-neutral hover:bg-neutral-weak"
              }`}
            >
              영업중
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !nightOnly;
                nightOnlyRef.current = next;
                setNightOnly(next);
                if (viewRef.current)
                  fetchForView(viewRef.current.b, viewRef.current.zoom, filters);
              }}
              aria-pressed={nightOnly}
              className={`rounded-full border px-4 py-2 text-sm font-medium shadow-md transition-colors ${
                nightOnly
                  ? "border-transparent bg-[#1E5BD6] text-white"
                  : "border-black/5 bg-white text-neutral hover:bg-neutral-weak"
              }`}
            >
              야간진료
            </button>
          </div>
        </div>

        {/* 로딩 표시 — 흐름에서 분리(absolute)해 필터 바 재배치(깜빡임) 방지 */}
        {loading && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-0.5 overflow-hidden bg-[#1E5BD6]/15">
            <div
              className="h-full w-full bg-[#1E5BD6]"
              style={{ animation: "mediroad-indeterminate 1.1s ease-in-out infinite" }}
            />
          </div>
        )}

        {/* 마커 500개 캡 안내 — 너무 많으면 일부만 표시되므로 확대 유도 */}
        {!searchActive && mode === "marker" && mapHospitals.length >= 500 && (
          <div className="pointer-events-none absolute inset-x-0 top-[4.25rem] z-20 flex justify-center px-4 md:top-16">
            <span className="pointer-events-auto rounded-full bg-[#26282c]/90 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg">
              병원이 많아 일부만 표시돼요. 확대하면 더 정확해요
            </span>
          </div>
        )}

        <NaverMap
          mode={searchActive ? "marker" : mode}
          hospitals={mapHospitals}
          clusters={clusters}
          center={DEFAULT_CENTER}
          highlightId={hoveredId}
          selectedIds={selectedIds}
          focus={focus}
          onViewChanged={onViewChanged}
          onSelect={(hs) => {
            closeDetail(); // 새 마커 선택 → 상세 닫고 목록으로
            setSelectedGroup(hs);
            raiseSheet(); // 마커 탭 → 바텀시트 절반으로 올림
          }}
          onSelectRegion={onSelectRegion}
          onSelectGrid={onSelectGrid}
          onMapDrag={() => {
            // 선택 직후 600ms 내 dragstart(탭의 미세드래그)는 무시 → 시트 유지
            if (Date.now() - lastSelectRef.current < 600) return;
            setSnap(0.12);
          }}
          panelOpen={hasPanel}
        />

        {/* 하단 플로팅: 영업중 토글 + 이 지역 N곳 보기 — 보류(고민 중). 다시 켜려면 false 제거 */}
        {false && !hasPanel && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-white px-1.5 py-1.5 shadow-lg ring-1 ring-black/5">
              <button
                type="button"
                onClick={() => setOpenOnly(true)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  openOnly ? "bg-[#26282c] text-white" : "text-subtle hover:text-neutral"
                }`}
              >
                영업중
              </button>
              <button
                type="button"
                onClick={() => setOpenOnly(false)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  !openOnly ? "bg-[#26282c] text-white" : "text-subtle hover:text-neutral"
                }`}
              >
                전체
              </button>
              <span className="mx-1 h-4 w-px bg-line" />
              <button
                type="button"
                onClick={openViewList}
                className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-bold text-[#1E5BD6] transition-colors hover:bg-brand-weak"
              >
                이 지역 {viewCount.toLocaleString()}곳 보기
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 모바일: 검색 결과 상태에서 "이 지역 검색하기" — 현재 화면 영역의 병원 보기 */}
        {searchActive && (
          <div className="pointer-events-none absolute inset-x-0 top-[4.25rem] z-20 flex justify-center md:hidden">
            <button
              type="button"
              onClick={clearSearch}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#26282c] px-4 py-2 text-sm font-bold text-white shadow-lg"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              이 지역 검색하기
            </button>
          </div>
        )}
      </div>

      {/* 모바일 검색 전용 화면 */}
      <MobileSearch
        open={searchPageOpen}
        initialQuery={appliedQRef.current}
        userLoc={userLoc}
        onClose={() => setSearchPageOpen(false)}
        onSubmit={(q) => {
          setQInput(q);
          runSearch(q);
          setSearchPageOpen(false);
        }}
        onPickHospital={pickHospital}
      />
    </div>
  );
}
