-- 지도 이동 시 마커(bounds) 로딩 가속 — PostGIS geom GiST 인덱스 사용.
-- 기존: lat between … and lng between … (composite btree는 lat 범위만 선두 활용, 2D엔 비최적)
-- 이후: geom && ST_MakeEnvelope(…) (geography GiST 인덱스로 진짜 2D 박스 스캔)
-- 반환 타입/필터 동일 → create or replace 로 교체.
create or replace function hospitals_in_bounds(
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_type text default null,
  p_q text default null,
  p_department text default null,
  p_limit int default 500
)
returns table (
  id text,
  slug text,
  name text,
  type text,
  sido text,
  sigungu text,
  address text,
  phone text,
  lat double precision,
  lng double precision,
  hospital_hours jsonb
)
language sql
stable
as $$
  select
    h.id, h.slug, h.name, h.type, h.sido, h.sigungu, h.address, h.phone, h.lat, h.lng,
    (
      select jsonb_agg(jsonb_build_object(
        'day', hh.day, 'open', hh.open, 'close', hh.close, 'closed', hh.closed))
      from hospital_hours hh where hh.hospital_id = h.id
    ) as hospital_hours
  from hospitals h
  where h.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)::geography
    and (p_type is null or h.type = p_type)
    and (p_q is null or h.name ilike '%' || p_q || '%')
    and (
      p_department is null
      or h.name ilike '%' || p_department || '%'   -- 병원명 매칭(폴백)
      or exists (
        select 1 from hospital_departments d
        where d.hospital_id = h.id and d.name = p_department
      )
    )
  limit p_limit;
$$;

grant execute on function hospitals_in_bounds to anon, authenticated;
