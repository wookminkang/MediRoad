"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
import { MapHospitalList } from "./map-hospital-list";
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
  const listItems = openFilter(regionActive ? regionItems : (shown ?? []));
  const selectedIds = selectedGroup?.map((h) => h.id) ?? null;

  const viewRef = useRef<{ b: Bounds; zoom: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // 하단 "이 지역 N곳" 카운트 (행 미반환 head count)
    fetch(`/api/hospitals/count?${common}`)
      .then((r) => r.json())
      .then((j) => setViewCount(j.count ?? 0))
      .catch(() => {});

    setLoading(true);
    try {
      if (zoom >= INDIVIDUAL_ZOOM) {
        const res = await fetch(`/api/hospitals/bounds?${common}`);
        const json = await res.json();
        setHospitals(json.items ?? []);
        setMode("marker");
        // marker 모드 드래그 중엔 선택 유지 (초기화하지 않음)
      } else if (zoom >= GRID_MIN_ZOOM) {
        common.set("step", String(gridStep(zoom)));
        const res = await fetch(`/api/hospitals/grid?${common}`);
        const json = await res.json();
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
        common.set("level", zoom <= SIDO_ZOOM ? "sido" : "sigungu");
        const res = await fetch(`/api/hospitals/clusters?${common}`);
        const json = await res.json();
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
    } finally {
      setLoading(false);
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

  // 지도 페이지 동안 페이지 스크롤 잠금 (모바일 주소창/오버스크롤로 영역 들썩임 방지)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      overscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.overscroll;
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
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      const z = Number(sp.get("zoom"));
      setFocus({ lat, lng, zoom: Number.isFinite(z) && z > 0 ? z : 14 });
    }
    // near=1 → 내 위치로 이동 (진료과 필터는 위에서 적용됨)
    if (sp.get("near") === "1" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFocus({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert("위치 권한을 허용하면 내 주변 병원을 보여드려요."),
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
      const first = items.find((h) => h.location?.lat && h.location?.lng);
      if (first) setFocus({ lat: first.location.lat, lng: first.location.lng });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] md:h-[calc(100vh-3.5rem)]">
      {/* 데스크톱 좌측 사이드바 — md 이상에서만, 클릭 시 노출 */}
      {hasPanel && (
        <aside className="hidden w-80 shrink-0 flex-col border-r border-line bg-white md:flex">
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
            onHover={setHoveredId}
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
          snapPoints={[0.5, 1]}
          modal={false}
          dismissible
          handleOnly
        >
          <DrawerPositioner
            className="seed-bottom-sheet__positioner pointer-events-none"
            style={{ "--sheet-z-index": 20 } as React.CSSProperties}
          >
            <DrawerContent className="seed-bottom-sheet__content pointer-events-auto h-[90dvh] w-full">
              <DrawerTitle className="sr-only">병원 목록</DrawerTitle>
              <DrawerHandle className="mx-auto mb-1 mt-2.5 h-1.5 w-10 shrink-0 cursor-grab rounded-full bg-[#C7CDD6]" />
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
              />
            </DrawerContent>
          </DrawerPositioner>
        </DrawerRoot>
      </div>

      {/* 지도 + 상단 필터바 */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 px-3 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(qInput);
            }}
            className="pointer-events-auto flex items-center gap-1.5"
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
                className="w-48 rounded-full border border-black/5 bg-white py-2 pl-9 pr-4 text-sm shadow-md focus:border-[#1E5BD6] focus:outline-none focus:ring-2 focus:ring-[#1E5BD6]/30"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-[#1E5BD6] px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-[#1a4fbb]"
            >
              검색
            </button>
          </form>
          <div className="pointer-events-auto flex items-center gap-2">
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
              panelWidth="w-80"
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
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-0.5 overflow-hidden">
            <div className="h-full w-full animate-pulse bg-[#1E5BD6]" />
          </div>
        )}

        <NaverMap
          mode={searchActive ? "marker" : mode}
          hospitals={openFilter(searchActive ? (searchResults ?? []) : hospitals)}
          clusters={clusters}
          center={DEFAULT_CENTER}
          highlightId={hoveredId}
          selectedIds={selectedIds}
          focus={focus}
          onViewChanged={onViewChanged}
          onSelect={(hs) => setSelectedGroup(hs)}
          onSelectRegion={onSelectRegion}
          onSelectGrid={onSelectGrid}
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
      </div>
    </div>
  );
}
