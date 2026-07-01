import { MOCK_HOSPITALS } from "@/api/mock/hospitals";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Paginated } from "@/types";
import type {
  Hospital,
  HospitalSearchFilters,
  OpeningHours,
} from "@/types/hospital";
import { distanceInMeters } from "@/utils/distance";

/**
 * 병원 데이터 접근 (읽기). env 설정 시 Supabase(정규화 테이블 조립), 미설정 시 mock 폴백.
 * 데이터 출처: E-Gen 동기화(`scripts/sync-hospitals.mts`). (ARCHITECTURE §5)
 */

const DEFAULT_PAGE_SIZE = 20;

// "0900" → "09:00"
const hhmm = (t: string | null) =>
  t && t.length === 4 ? `${t.slice(0, 2)}:${t.slice(2)}` : (t ?? undefined);

const toMin = (t?: string) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** 진료시간 기반 "지금 영업중" (KST). hours 없으면 undefined(배지 미표시). */
function computeOpenNow(hours?: OpeningHours[]): boolean | undefined {
  if (!hours?.length) return undefined;
  const kst = new Date(Date.now() + 9 * 3600 * 1000); // UTC→KST 시프트
  const jsDay = kst.getUTCDay(); // 0=일 … 6=토
  const day = jsDay === 0 ? 7 : jsDay; // E-Gen: 1=월 … 7=일
  const today = hours.find((h) => h.day === day);
  if (!today || today.closed) return false;
  const o = toMin(today.open);
  const c = toMin(today.close);
  if (o == null || c == null) return false;
  const cur = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  return cur >= o && cur < c;
}

type HospitalRow = {
  id: string;
  slug: string | null;
  name: string;
  type: Hospital["type"];
  sido: string;
  sigungu: string;
  emdong: string | null;
  address: string;
  road_address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  homepage_url: string | null;
  booking_url: string | null;
  station_name: string | null;
  station_line: string | null;
  station_exit: string | null;
  station_distance_m: number | null;
  updated_at: string | null;
  hospital_departments?: { name: string }[];
  hospital_hours?: { day: number; open: string | null; close: string | null; closed: boolean }[];
  hospital_amenities?: { name: string }[];
  hospital_photos?: { url: string; alt: string | null; category: string | null; is_primary: boolean; sort_order: number }[];
  hospital_faqs?: { q: string; a: string; sort_order: number }[];
  hospital_doctors?: { name: string; title: string | null; specialty: string | null; sort_order: number }[];
  hospital_seo?: {
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string[] | null;
    og_image: string | null;
    noindex: boolean;
  } | { meta_title: string | null; meta_description: string | null; meta_keywords: string[] | null; og_image: string | null; noindex: boolean }[];
};

function rowToHospital(r: HospitalRow): Hospital {
  const hours: OpeningHours[] | undefined = r.hospital_hours
    ? [...r.hospital_hours]
        .sort((a, b) => a.day - b.day)
        .map((h) => ({
          day: h.day,
          open: hhmm(h.open),
          close: hhmm(h.close),
          closed: h.closed,
        }))
    : undefined;

  const seoRow = Array.isArray(r.hospital_seo) ? r.hospital_seo[0] : r.hospital_seo;

  return {
    id: r.id,
    slug: r.slug ?? r.id, // slug 미백필 시 id 폴백
    name: r.name,
    type: r.type,
    departments: (r.hospital_departments ?? []).map((d) => d.name) as Hospital["departments"],
    region: {
      sido: r.sido,
      sidoCd: "",
      sigungu: r.sigungu,
      sgguCd: `${r.sido}-${r.sigungu}`,
      emdong: r.emdong ?? undefined,
    },
    address: r.address,
    roadAddress: r.road_address ?? undefined,
    phone: r.phone ?? undefined,
    location: { lat: r.lat ?? 0, lng: r.lng ?? 0 },
    photos: r.hospital_photos?.length
      ? [...r.hospital_photos]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((p) => ({
            url: p.url,
            alt: p.alt ?? undefined,
            category: (p.category as never) ?? undefined,
            isPrimary: p.is_primary,
          }))
      : undefined,
    nearestStation: r.station_name
      ? {
          name: r.station_name,
          line: r.station_line ?? undefined,
          exit: r.station_exit ?? undefined,
          distanceM: r.station_distance_m ?? 0,
        }
      : undefined,
    hours,
    description: r.description ?? undefined,
    amenities: r.hospital_amenities?.length
      ? (r.hospital_amenities.map((a) => a.name) as Hospital["amenities"])
      : undefined,
    links:
      r.homepage_url || r.booking_url
        ? {
            homepage: r.homepage_url ?? undefined,
            naverBooking: r.booking_url ?? undefined,
          }
        : undefined,
    doctors: r.hospital_doctors?.length
      ? [...r.hospital_doctors]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((d) => ({ name: d.name, title: d.title ?? "", specialty: d.specialty ?? "" }))
      : undefined,
    faqs: r.hospital_faqs?.length
      ? r.hospital_faqs.map((f) => ({ q: f.q, a: f.a }))
      : undefined,
    updatedAt: r.updated_at ? r.updated_at.slice(0, 10) : undefined,
    seo: seoRow
      ? {
          title: seoRow.meta_title ?? undefined,
          description: seoRow.meta_description ?? undefined,
          keywords: seoRow.meta_keywords ?? undefined,
          ogImage: seoRow.og_image ?? undefined,
          noindex: seoRow.noindex || undefined,
        }
      : undefined,
  };
}

// --- Mock 폴백 ---
function mockMatches(h: Hospital, q: string): boolean {
  const n = q.trim().toLowerCase();
  return (
    h.name.toLowerCase().includes(n) ||
    h.departments.some((d) => d.toLowerCase().includes(n)) ||
    h.region.sigungu.toLowerCase().includes(n) ||
    h.type.toLowerCase().includes(n)
  );
}
function mockGetHospitals(f: HospitalSearchFilters): Paginated<Hospital> {
  const { q, department, type, region, sido, openNow, center, radiusKm, page = 1, pageSize = DEFAULT_PAGE_SIZE } = f;
  let results = MOCK_HOSPITALS.filter((h) => {
    if (q && !mockMatches(h, q)) return false;
    if (department && !h.departments.includes(department)) return false;
    if (type && h.type !== type) return false;
    if (region && h.region.sigungu !== region) return false;
    if (sido && h.region.sido !== sido) return false;
    if (openNow && !h.isOpenNow) return false;
    if (center && radiusKm && distanceInMeters(center, h.location) > radiusKm * 1000) return false;
    return true;
  });
  results = [...results].sort((a, b) =>
    center ? distanceInMeters(center, a.location) - distanceInMeters(center, b.location) : (b.rating ?? 0) - (a.rating ?? 0),
  );
  const start = (page - 1) * pageSize;
  return { items: results.slice(start, start + pageSize), total: results.length, page, pageSize };
}

/** 거리순 검색 (PostGIS RPC) — center 있을 때. 반경·페이지 무관하게 가까운 순. */
async function nearbyQuery(
  filters: HospitalSearchFilters,
): Promise<Paginated<Hospital>> {
  const { q, department, type, region, sido, openNow, center, radiusKm, page = 1, pageSize = DEFAULT_PAGE_SIZE } = filters;
  const { data, error } = await getSupabaseServer().rpc("search_hospitals_nearby", {
    p_lat: center!.lat,
    p_lng: center!.lng,
    p_radius_m: radiusKm ? radiusKm * 1000 : null,
    p_sido: sido ?? null,
    p_sigungu: region ?? null,
    p_type: type ?? null,
    p_q: q ?? null,
    p_department: department ?? null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw error;
  const rows = (data ?? []) as unknown as (HospitalRow & { total_count: number })[];
  let items = rows
    .map(rowToHospital)
    .map((h) => ({ ...h, isOpenNow: computeOpenNow(h.hours) }));
  if (openNow) items = items.filter((h) => h.isOpenNow === true);
  return { items, total: Number(rows[0]?.total_count ?? 0), page, pageSize };
}

/** 목록·검색·랜딩 공통 조회. center 있으면 거리순 RPC, 없으면 이름순. */
export async function getHospitals(
  filters: HospitalSearchFilters = {},
): Promise<Paginated<Hospital>> {
  if (!isSupabaseConfigured) return mockGetHospitals(filters);

  // 내 위치/반경 검색 → PostGIS 거리순. RPC 미설치 등 오류 시 아래 이름순 폴백.
  if (filters.center) {
    try {
      return await nearbyQuery(filters);
    } catch {
      /* fallthrough to name-order */
    }
  }

  const { q, department, type, region, sido, openNow, center, radiusKm, page = 1, pageSize = DEFAULT_PAGE_SIZE } = filters;
  const start = (page - 1) * pageSize;

  const baseSel =
    "*, hospital_hours(day,open,close,closed), hospital_photos(url,alt,category,is_primary,sort_order)";
  let query = getSupabaseServer()
    .from("hospitals")
    .select(
      department ? `${baseSel}, hospital_departments!inner(name)` : baseSel,
      // exact count는 진료과목 조인 필터에서 매우 느림(수만 건 카운트) → planned 추정치로 15배↑
      { count: "planned" },
    );

  if (type) query = query.eq("type", type);
  if (region) query = query.eq("sigungu", region);
  if (sido) query = query.eq("sido", sido);
  if (department) query = query.eq("hospital_departments.name", department);
  if (q) {
    const s = q.replace(/[,()%]/g, " ").trim();
    if (s) query = query.ilike("name", `%${s}%`);
  }
  // 반경: 위경도 bounding box 선필터
  if (center && radiusKm) {
    const dLat = radiusKm / 111;
    const dLng = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
    query = query
      .gte("lat", center.lat - dLat)
      .lte("lat", center.lat + dLat)
      .gte("lng", center.lng - dLng)
      .lte("lng", center.lng + dLng);
  }

  query = query.order("name").range(start, start + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  let items = (data as unknown as HospitalRow[])
    .map(rowToHospital)
    .map((h) => ({ ...h, isOpenNow: computeOpenNow(h.hours) }));
  // 영업중만 보기 — 해당 페이지 결과에서 영업중만 (무한스크롤이 계속 로드)
  if (openNow) items = items.filter((h) => h.isOpenNow === true);
  if (center && radiusKm) {
    items = items
      .filter((h) => distanceInMeters(center, h.location) <= radiusKm * 1000)
      .sort((a, b) => distanceInMeters(center, a.location) - distanceInMeters(center, b.location));
  }
  return { items, total: count ?? 0, page, pageSize };
}

const DETAIL_SELECT =
  "*, hospital_departments(name), hospital_hours(*), hospital_amenities(name), hospital_photos(*), hospital_faqs(*), hospital_doctors(*), hospital_seo(*)";

/** 상세 조회. 없으면 null */
export async function getHospitalById(id: string): Promise<Hospital | null> {
  if (!isSupabaseConfigured) return MOCK_HOSPITALS.find((h) => h.id === id) ?? null;

  const { data, error } = await getSupabaseServer()
    .from("hospitals")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToHospital(data as unknown as HospitalRow) : null;
}

/** 상세 조회 (slug 우선, 옛 URL 호환 위해 id 폴백). 없으면 null
 *  최근접 지하철역은 station_* 컬럼에 사전계산돼 있어 rowToHospital이 바로 채움(런타임 RPC 없음). */
export async function getHospitalBySlug(slug: string): Promise<Hospital | null> {
  if (!isSupabaseConfigured)
    return MOCK_HOSPITALS.find((h) => h.slug === slug || h.id === slug) ?? null;

  const sb = getSupabaseServer();
  const bySlug = await sb
    .from("hospitals")
    .select(DETAIL_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (bySlug.error) throw bySlug.error;
  if (bySlug.data) return rowToHospital(bySlug.data as unknown as HospitalRow);

  // slug 미스 → 옛 id로 시도 (301 리다이렉트 대상)
  const byId = await sb
    .from("hospitals")
    .select(DETAIL_SELECT)
    .eq("id", slug)
    .maybeSingle();
  if (byId.error) throw byId.error;
  return byId.data ? rowToHospital(byId.data as unknown as HospitalRow) : null;
}

/** 주변 비슷한 병원 (같은 시군구 + 거리순, 같은 종별 우선) */
export async function getRelatedHospitals(base: Hospital, limit = 4): Promise<Hospital[]> {
  if (!isSupabaseConfigured) {
    const { items } = mockGetHospitals({ region: base.region.sigungu, center: base.location, pageSize: 50 });
    return items.filter((h) => h.id !== base.id).slice(0, limit);
  }
  const { data, error } = await getSupabaseServer()
    .from("hospitals")
    .select("*")
    .eq("sigungu", base.region.sigungu)
    .neq("id", base.id)
    .limit(limit + 20);
  if (error) throw error;
  let pool = (data as unknown as HospitalRow[]).map(rowToHospital);
  pool = pool
    .sort((a, b) => distanceInMeters(base.location, a.location) - distanceInMeters(base.location, b.location))
    .sort((a, b) => (a.type === base.type ? 0 : 1) - (b.type === base.type ? 0 : 1));
  return pool.slice(0, limit);
}

export type LatLngBounds = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

/** 지도 뷰포트(bounds) 내 병원 — /map 마커·리스트용 (최대 500) */
export async function getHospitalsInBounds(
  bounds: LatLngBounds,
  filters: Pick<HospitalSearchFilters, "type" | "q" | "department"> = {},
): Promise<Hospital[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabaseServer().rpc("hospitals_in_bounds", {
    p_min_lat: bounds.minLat,
    p_min_lng: bounds.minLng,
    p_max_lat: bounds.maxLat,
    p_max_lng: bounds.maxLng,
    p_type: filters.type ?? null,
    p_q: filters.q ?? null,
    p_department: filters.department ?? null,
    p_limit: 500,
  });
  if (error) throw error;
  return (data as unknown as HospitalRow[])
    .map(rowToHospital)
    .map((h) => ({ ...h, isOpenNow: computeOpenNow(h.hours) }));
}

/** 뷰포트(bounds) 내 병원 개수만 — head count(행 미반환)로 가볍게 */
export async function getHospitalsInBoundsCount(
  bounds: LatLngBounds,
  filters: Pick<HospitalSearchFilters, "type" | "q" | "department"> = {},
): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  let query = getSupabaseServer()
    .from("hospitals")
    .select(filters.department ? "id, hospital_departments!inner(name)" : "id", {
      count: "exact",
      head: true,
    })
    .gte("lat", bounds.minLat)
    .lte("lat", bounds.maxLat)
    .gte("lng", bounds.minLng)
    .lte("lng", bounds.maxLng);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.q) {
    const s = filters.q.replace(/[,()%]/g, " ").trim();
    if (s) query = query.ilike("name", `%${s}%`);
  }
  if (filters.department) query = query.eq("hospital_departments.name", filters.department);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export type RegionCluster = {
  region: string;
  sido: string;
  cnt: number;
  lat: number;
  lng: number;
};

/** 지도 축소 시 지역(시도/시군구) 집계 클러스터 */
type ClusterFilters = Pick<HospitalSearchFilters, "type" | "q" | "department"> & {
  openNow?: boolean;
  night?: boolean;
};

export async function getRegionClusters(
  level: "sido" | "sigungu",
  bounds: LatLngBounds,
  filters: ClusterFilters = {},
): Promise<RegionCluster[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabaseServer().rpc("hospital_region_clusters", {
    p_level: level,
    p_min_lat: bounds.minLat,
    p_min_lng: bounds.minLng,
    p_max_lat: bounds.maxLat,
    p_max_lng: bounds.maxLng,
    p_type: filters.type ?? null,
    p_q: filters.q ?? null,
    p_department: filters.department ?? null,
    p_open: filters.openNow ?? false,
    p_night: filters.night ?? false,
  });
  if (error) return []; // RPC 미마이그레이션 등 → 빈 결과(빌드/런타임 안전)
  return (data ?? []) as RegionCluster[];
}

export type GridCluster = { lat: number; lng: number; cnt: number };

/** 중간 줌: 그리드 격자(step) 단위 카운트 버블 */
export async function getGridClusters(
  bounds: LatLngBounds,
  step: number,
  filters: ClusterFilters = {},
): Promise<GridCluster[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabaseServer().rpc("hospital_grid_clusters", {
    p_min_lat: bounds.minLat,
    p_min_lng: bounds.minLng,
    p_max_lat: bounds.maxLat,
    p_max_lng: bounds.maxLng,
    p_step: step,
    p_type: filters.type ?? null,
    p_q: filters.q ?? null,
    p_department: filters.department ?? null,
    p_open: filters.openNow ?? false,
    p_night: filters.night ?? false,
  });
  if (error) return [];
  return (data ?? []) as GridCluster[];
}

/** generateStaticParams 용. 78k건이라 빌드 시 미생성 → on-demand(ISR). mock일 때만 목록 반환. */
export async function getAllHospitalIds(): Promise<string[]> {
  if (!isSupabaseConfigured) return MOCK_HOSPITALS.map((h) => h.id);
  return [];
}
