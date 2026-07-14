import { MOCK_HOSPITALS } from "@/api/mock/hospitals";
import { PARTNER_HOSPITAL_IDS } from "@/constants/partners";
import {
  fmtTime,
  type HourRow,
  isNightOpenClock,
  latestWeekdayClose,
  latestWeekdayCloseClock,
  NIGHT_FROM,
  sundayHours,
  sundayLabelClock,
} from "@/lib/open-hours";
import { publishedCutoff } from "@/lib/post-schedule";
import { normalizeLine, normalizeStationName } from "@/lib/station";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Paginated } from "@/types";
import type {
  Hospital,
  HospitalSearchFilters,
  OpeningHours,
} from "@/types/hospital";
import { distanceInMeters } from "@/utils/distance";

/**
 * 진료과목 필터지만 실제로는 "종별(type)"로 잡아야 하는 값.
 * 한방·치과는 표시과목명(침구과·구강내과 등)으로 등록돼 있어 과목 조인이 거의 0건 →
 * 종별(한의원+한방병원 / 치과)로 필터해야 전체가 잡힌다.
 */
const DEPT_AS_TYPE: Record<string, readonly string[]> = {
  한방: ["한의원", "한방병원"],
  치과: ["치과"],
};

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
          name: normalizeStationName(r.station_name),
          line: r.station_line ? normalizeLine(r.station_line) : undefined,
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
  const { q, department, type, region, station, sido, openNow, center, radiusKm, page = 1, pageSize = DEFAULT_PAGE_SIZE } = f;
  let results = MOCK_HOSPITALS.filter((h) => {
    if (q && !mockMatches(h, q)) return false;
    if (department && !h.departments.includes(department)) return false;
    if (type && h.type !== type) return false;
    if (region && h.region.sigungu !== region) return false;
    if (station && !(h.nearestStation?.name ?? "").startsWith(station)) return false;
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
  const sb = getSupabaseServer();
  // 한방·치과는 과목이 아니라 종별 → RPC엔 종별로(단일 종별만 전달 가능), 다중(한방)은 결과 후처리
  const deptTypes = department ? DEPT_AS_TYPE[department] : undefined;
  const rpcType = deptTypes && deptTypes.length === 1 ? deptTypes[0] : (type ?? null);
  const rpcDept = deptTypes ? null : (department ?? null);
  // RPC(가까운 N개, KNN 조기종료)와 총개수(bbox planned, 가벼움)를 병렬 조회
  const rpcCall = sb.rpc("search_hospitals_nearby", {
    p_lat: center!.lat,
    p_lng: center!.lng,
    p_radius_m: radiusKm ? radiusKm * 1000 : null,
    p_sido: sido ?? null,
    p_sigungu: region ?? null,
    p_type: rpcType,
    p_q: q ?? null,
    p_department: rpcDept,
    p_limit: deptTypes && deptTypes.length > 1 ? pageSize * 3 : pageSize,
    p_offset: (page - 1) * pageSize,
  });
  const [{ data, error }, total] = await Promise.all([
    rpcCall,
    page === 1 ? countNearby(center!, radiusKm, { q, department, type, sido }) : Promise.resolve(0),
  ]);
  if (error) throw error;
  const rows = (data ?? []) as unknown as HospitalRow[];
  let items = rows
    .map(rowToHospital)
    .map((h) => ({ ...h, isOpenNow: computeOpenNow(h.hours) }));
  // 다중 종별(한방) 후처리 필터
  if (deptTypes && deptTypes.length > 1)
    items = items.filter((h) => deptTypes.includes(h.type)).slice(0, pageSize);
  if (openNow) items = items.filter((h) => h.isOpenNow === true);
  return { items, total, page, pageSize };
}

/** 거리검색 총개수 — 반경을 bbox로 근사해 planned 카운트(빠름). RPC의 exact 카운트 대체 */
async function countNearby(
  center: { lat: number; lng: number },
  radiusKm: number | undefined,
  f: { q?: string; department?: string; type?: string; sido?: string },
): Promise<number> {
  const sb = getSupabaseServer();
  let query = sb
    .from("hospitals")
    .select(
      f.department && !DEPT_AS_TYPE[f.department]
        ? "id, hospital_departments!inner(name)"
        : "id",
      { count: "planned", head: true },
    );
  if (f.type) query = query.eq("type", f.type);
  if (f.sido) query = query.eq("sido", f.sido);
  if (f.department && DEPT_AS_TYPE[f.department])
    query = query.in("type", DEPT_AS_TYPE[f.department] as string[]);
  else if (f.department)
    query = query.eq("hospital_departments.name", f.department);
  if (f.q) {
    const s = f.q.replace(/[,()%]/g, " ").trim();
    if (s) query = query.ilike("name", `%${s}%`);
  }
  if (radiusKm) {
    const dLat = radiusKm / 111;
    const dLng = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
    query = query
      .gte("lat", center.lat - dLat)
      .lte("lat", center.lat + dLat)
      .gte("lng", center.lng - dLng)
      .lte("lng", center.lng + dLng);
  }
  const { count } = await query;
  return count ?? 0;
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

  const { q, department, type, region, station, sido, openNow, openLate, center, radiusKm, page = 1, pageSize = DEFAULT_PAGE_SIZE } = filters;
  const start = (page - 1) * pageSize;

  // 야간·일요일은 시간 판정을 코드에서 하므로 DB 페이지네이션과 안 맞는다.
  // 지역 전체를 판정·정렬한 뒤 페이지만큼 잘라 넘긴다(무한스크롤이 같은 카드로 그린다).
  if (openLate && sido && region) {
    return openLatePage(sido, region, openLate, page, pageSize);
  }

  const deptTypes = department ? DEPT_AS_TYPE[department] : undefined;
  const useDeptJoin = Boolean(department) && !deptTypes; // 한방·치과는 조인 대신 종별
  const baseSel =
    "*, hospital_hours(day,open,close,closed), hospital_photos(url,alt,category,is_primary,sort_order)";
  /**
   * 진료과목은 필터를 걸든 안 걸든 항상 가져온다.
   *
   * 예전엔 필터가 걸렸을 때만(!inner) 가져왔다. 그래서 지역만으로 조회하면
   * 모든 병원의 departments가 빈 배열이었고, departmentsOf()가 늘 0개를 반환해
   * /area/[구]/[진료과목] 페이지가 한 개도 생성되지 않았다. dynamicParams=false라
   * 생성 안 된 주소는 전부 404 — "강남구 내과" 같은 최대 검색량 페이지가 통째로 없었다.
   *
   * !inner는 "이 과목이 있는 병원만" 이라는 필터 역할이라 조회 시에만 붙인다.
   */
  const deptSel = useDeptJoin
    ? "hospital_departments!inner(name)"
    : "hospital_departments(name)";
  const sel = `${baseSel}, ${deptSel}`;

  /**
   * 필터가 적용된 조회를 새로 만든다 — 제휴 조회와 본 조회가 같은 조건을 공유해야
   * 어긋나지 않는다. 클로저가 매번 fresh 쿼리를 만들어 반환하므로 타입도 깔끔하다.
   */
  const makeFiltered = () => {
    let qb = getSupabaseServer()
      .from("hospitals")
      // exact count는 진료과목 조인 필터에서 매우 느림 → planned 추정치
      .select(sel, { count: "planned" });
    if (type) qb = qb.eq("type", type);
    if (region) qb = qb.eq("sigungu", region);
    // 역세권: station_name은 "역" 접미 없이 저장되고 일부는 괄호 부기명 → clean 접두 매칭
    if (station) qb = qb.ilike("station_name", `${station}%`);
    if (sido) qb = qb.eq("sido", sido);
    if (deptTypes) qb = qb.in("type", deptTypes as string[]);
    else if (department) qb = qb.eq("hospital_departments.name", department);
    if (q) {
      const s = q.replace(/[,()%]/g, " ").trim();
      if (s) qb = qb.ilike("name", `%${s}%`);
    }
    if (center && radiusKm) {
      const dLat = radiusKm / 111;
      const dLng = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
      qb = qb
        .gte("lat", center.lat - dLat)
        .lte("lat", center.lat + dLat)
        .gte("lng", center.lng - dLng)
        .lte("lng", center.lng + dLng);
    }
    return qb;
  };

  /**
   * 제휴 병원을 목록 맨 앞에 보여준다.
   *
   * 첫 페이지에서만 제휴를 따로 조회해 앞에 붙이고, 본 목록에서는 제휴를 제외한다.
   * 이렇게 해야 제휴가 중복으로 뜨지 않고, 페이지네이션(range)도 어긋나지 않는다.
   * 화면에는 "제휴" 표시를 하지 않으므로(뱃지 제거) 자연스러운 상위 노출로 보인다.
   */
  const partnerIds = [...PARTNER_HOSPITAL_IDS];

  let partnerItems: Hospital[] = [];
  if (page === 1) {
    const { data: pData, error: pErr } = await makeFiltered()
      .in("id", partnerIds)
      .order("name");
    if (pErr) throw pErr;
    partnerItems = (pData as unknown as HospitalRow[])
      .map(rowToHospital)
      .map((h) => ({ ...h, isOpenNow: computeOpenNow(h.hours) }));
  }

  const { data, count, error } = await makeFiltered()
    .not("id", "in", `(${partnerIds.join(",")})`)
    .order("name")
    .range(start, start + pageSize - 1);
  if (error) throw error;

  let items = [
    ...partnerItems,
    ...(data as unknown as HospitalRow[])
      .map(rowToHospital)
      .map((h) => ({ ...h, isOpenNow: computeOpenNow(h.hours) })),
  ];
  // 영업중만 보기 — 해당 페이지 결과에서 영업중만 (무한스크롤이 계속 로드)
  if (openNow) items = items.filter((h) => h.isOpenNow === true);
  if (center && radiusKm) {
    items = items
      .filter((h) => distanceInMeters(center, h.location) <= radiusKm * 1000)
      .sort((a, b) => distanceInMeters(center, a.location) - distanceInMeters(center, b.location));
  }
  return { items, total: count ?? 0, page, pageSize };
}

/**
 * 야간·일요일 진료 병원 — 시간 판정 후 페이지네이션.
 *
 * DB에서 시간으로 못 거른다(심평원 표기가 "2600"·"0000" 등 지저분). 지역 전체를
 * 가져와 코드로 판정·정렬한 뒤 page만큼 슬라이스한다. 지역 하나는 최대 3,000곳이라
 * 감당 가능하고, 한 번 캐시되면 페이지마다 다시 안 훑는다(ISR revalidate).
 * 반환 타입은 Hospital 그대로라 무한스크롤이 같은 카드로 그린다.
 */
async function openLatePage(
  sido: string,
  region: string,
  kind: "night" | "sunday",
  page: number,
  pageSize: number,
): Promise<Paginated<Hospital>> {
  const rows: HospitalRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await getSupabaseServer()
      .from("hospitals")
      .select(
        "*, hospital_hours(day,open,close,closed)," +
          " hospital_photos(url,alt,category,is_primary,sort_order)," +
          " hospital_departments(name)",
      )
      .eq("sido", sido)
      .eq("sigungu", region)
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...(data as unknown as HospitalRow[]));
    if (data.length < 1000) break;
  }

  const all = rows
    .map(rowToHospital)
    .map((h) => ({ ...h, isOpenNow: computeOpenNow(h.hours) }))
    .filter((h) =>
      kind === "night"
        ? isNightOpenClock(h.hours ?? [])
        : Boolean(sundayLabelClock(h.hours ?? [])),
    );

  // 늦게 닫는 순 (일요일은 일요일 마감 순) — 사용자가 궁금해하는 순서
  all.sort((a, b) => openLateSortKey(b, kind) - openLateSortKey(a, kind));

  const startIdx = (page - 1) * pageSize;
  return {
    items: all.slice(startIdx, startIdx + pageSize),
    total: all.length,
    page,
    pageSize,
  };
}

function openLateSortKey(h: Hospital, kind: "night" | "sunday"): number {
  if (kind === "night") return latestWeekdayCloseClock(h.hours ?? []) ?? 0;
  const sun = (h.hours ?? []).find((x) => x.day === 7 && !x.closed && x.close);
  return sun?.close ? Number.parseInt(sun.close.replace(":", ""), 10) : 0;
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

/**
 * 이 근처 추천 병원 — 현재 병원의 종별 + 진료과목을 접목해 가까운 순으로 추천(연계).
 * geom KNN(search_hospitals_nearby)로 진짜 최근접을 뽑고, 부족하면 같은 종별로 폴백.
 */
export async function getRelatedHospitals(base: Hospital, limit = 4): Promise<Hospital[]> {
  if (!isSupabaseConfigured) {
    const { items } = mockGetHospitals({ region: base.region.sigungu, center: base.location, pageSize: 50 });
    return items.filter((h) => h.id !== base.id).slice(0, limit);
  }
  const dept = base.departments[0] ?? null;
  const nearby = (p_department: string | null, p_type: string | null) =>
    getSupabaseServer().rpc("search_hospitals_nearby", {
      p_lat: base.location.lat,
      p_lng: base.location.lng,
      p_radius_m: null,
      p_sido: null,
      p_sigungu: null,
      p_type,
      p_q: null,
      p_department,
      p_limit: limit + 5,
      p_offset: 0,
    });

  const collected = new Map<string, Hospital>();
  const push = (rows: unknown) => {
    for (const r of (rows ?? []) as HospitalRow[]) {
      if (r.id === base.id || collected.has(r.id)) continue;
      collected.set(r.id, rowToHospital(r));
      if (collected.size >= limit) return;
    }
  };

  // 1) 같은 종별 + 같은 진료과목의 최근접
  if (dept) push((await nearby(dept, base.type)).data);
  // 2) 부족하면 같은 종별 최근접으로 채움
  if (collected.size < limit) push((await nearby(null, base.type)).data);
  return [...collected.values()].slice(0, limit);
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
    p_limit: 1200, // 개별마커/전체셀 조회 — 초밀집 구역(강남 등) 500 초과 잘림 방지
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

/** 야간·일요일 진료 목록에 쓰는 최소 정보 */
export type OpenLateHospital = {
  id: string;
  slug: string;
  name: string;
  type: string;
  phone: string | null;
  address: string | null;
  station: string | null;
  /** 야간: 평일 가장 늦은 마감 "21:30" / 일요일: "09:00~13:00" */
  hoursLabel: string;
  /** 정렬용 — 야간은 마감 시각(HHMM), 일요일은 마감 시각 */
  sortKey: number;
  departments: string[];
};

/**
 * 지역별 야간·일요일 진료 병원.
 *
 * 이 데이터는 공공데이터에 있지만 아무도 지역별로 정리해두지 않았다.
 * "송파구에서 밤 9시까지 하는 병원"을 찾으려면 지금은 병원을 하나씩 눌러봐야 한다.
 *
 * 진료시간 필터를 DB에서 걸지 않고 가져와서 판정한다. 심평원 시간 표기가
 * 지저분해서(자정 넘김을 "2600"으로 적는 등) SQL 비교로는 놓치는 게 생긴다.
 * 지역 하나의 병원 수는 최대 3,000곳 남짓이라 메모리에서 걸러도 부담이 없다.
 */
export async function getOpenLateHospitals(
  sido: string,
  sigungu: string,
  kind: "night" | "sunday",
): Promise<{ items: OpenLateHospital[]; total: number }> {
  if (!isSupabaseConfigured) return { items: [], total: 0 };

  const rows: HospitalRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await getSupabaseServer()
      .from("hospitals")
      .select(
        "id,slug,name,type,phone,address,road_address,station_name,station_line," +
          "hospital_hours(day,open,close,closed), hospital_departments(name)",
      )
      .eq("sido", sido)
      .eq("sigungu", sigungu)
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...(data as unknown as HospitalRow[]));
    if (data.length < 1000) break;
  }

  const items: OpenLateHospital[] = [];
  for (const r of rows) {
    if (!r.slug) continue; // 슬러그 없는 레코드는 링크를 걸 수 없다
    const hours = (r.hospital_hours ?? []) as HourRow[];
    let hoursLabel = "";
    let sortKey = 0;

    if (kind === "night") {
      const close = latestWeekdayClose(hours);
      if (close === null || close < NIGHT_FROM) continue;
      hoursLabel = `평일 ${fmtTime(String(close).padStart(4, "0"))}까지`;
      sortKey = close;
    } else {
      const sun = sundayHours(hours);
      if (!sun) continue;
      hoursLabel = `일요일 ${fmtTime(sun.open)}~${fmtTime(sun.close)}`;
      sortKey = Number.parseInt(sun.close ?? "0", 10) || 0;
    }

    items.push({
      id: r.id,
      slug: r.slug,
      name: r.name,
      type: r.type,
      phone: r.phone ?? null,
      address: r.road_address ?? r.address ?? null,
      station: r.station_name
        ? `${r.station_line ?? ""} ${r.station_name}역`.trim()
        : null,
      hoursLabel,
      sortKey,
      departments: (r.hospital_departments ?? []).map((d) => d.name),
    });
  }

  // 늦게까지 하는 순 — 사용자가 실제로 궁금해하는 순서다
  items.sort((a, b) => b.sortKey - a.sortKey || a.name.localeCompare(b.name));
  return { items, total: items.length };
}

/**
 * 사이트맵 "정예" 대상 병원 — 제휴 병원 + 포스트 보유 병원.
 * 신생 도메인 색인 전략: 품질 확실한 페이지부터 크롤 유도(78k 전량은 후속 확장).
 */
export async function getSitemapHospitals(): Promise<
  { slug: string; updatedAt: string | null }[]
> {
  if (!isSupabaseConfigured) return [];
  const sb = getSupabaseServer();
  const { data: postRows } = await sb
    .from("hospital_posts")
    .select("hospital_id")
    .eq("status", "published")
    .lte("published_at", publishedCutoff());
  const postHids = [...new Set((postRows ?? []).map((r) => r.hospital_id))];
  const ids = [...new Set([...PARTNER_HOSPITAL_IDS, ...postHids])];
  if (ids.length === 0) return [];
  const { data } = await sb
    .from("hospitals")
    .select("slug, updated_at")
    .in("id", ids);
  return ((data ?? []) as { slug: string; updated_at: string | null }[]).map(
    (h) => ({ slug: h.slug, updatedAt: h.updated_at }),
  );
}

/** 사이트맵용 병원 포스트 페이지 목록(published). */
export async function getSitemapPosts(): Promise<
  { slug: string; postId: string; updatedAt: string | null }[]
> {
  if (!isSupabaseConfigured) return [];
  const sb = getSupabaseServer();
  const { data } = await sb
    .from("hospital_posts")
    .select("id, updated_at, hospital:hospitals(slug)")
    .eq("status", "published")
    .lte("published_at", publishedCutoff());
  return ((data ?? []) as unknown as {
    id: string;
    updated_at: string | null;
    hospital: { slug: string } | null;
  }[])
    .filter((r) => r.hospital?.slug)
    .map((r) => ({
      slug: r.hospital!.slug,
      postId: r.id,
      updatedAt: r.updated_at,
    }));
}
