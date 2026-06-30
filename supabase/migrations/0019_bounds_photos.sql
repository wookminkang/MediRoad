-- 지도 마커 클릭 리스트 썸네일 — hospitals_in_bounds 가 대표 사진을 함께 반환하도록.
-- 기존 함수는 사진을 반환하지 않아 리스트가 항상 플레이스홀더로 표시됨.
-- 반환 컬럼에 hospital_photos(jsonb) 추가 → rowToHospital 이 그대로 매핑.
-- 반환 타입 변경이라 create or replace 불가 → 기존 함수 DROP 후 재생성.
drop function if exists hospitals_in_bounds(
  double precision, double precision, double precision, double precision,
  text, text, text, integer
);

create function hospitals_in_bounds(
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
  hospital_hours jsonb,
  hospital_photos jsonb
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
    ) as hospital_hours,
    (
      select jsonb_agg(jsonb_build_object(
        'url', hp.url, 'alt', hp.alt, 'category', hp.category,
        'is_primary', hp.is_primary, 'sort_order', hp.sort_order)
        order by hp.is_primary desc, hp.sort_order)
      from hospital_photos hp where hp.hospital_id = h.id
    ) as hospital_photos
  from hospitals h
  where h.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)::geography
    and (p_type is null or h.type = p_type)
    and (p_q is null or h.name ilike '%' || p_q || '%')
    and (
      p_department is null
      or h.name ilike '%' || p_department || '%'
      or exists (
        select 1 from hospital_departments d
        where d.hospital_id = h.id and d.name = p_department
      )
    )
  limit p_limit;
$$;

grant execute on function hospitals_in_bounds to anon, authenticated;
