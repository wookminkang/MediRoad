-- 지도 뷰포트(bounds) 내 병원 조회 RPC — /map 마커·리스트용
-- 보이는 사각 영역(min/max lat·lng) 안의 병원을 반환. 필터(종별·진료과목·검색) 지원.
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
    h.id, h.name, h.type, h.sido, h.sigungu, h.address, h.phone, h.lat, h.lng,
    (
      select jsonb_agg(jsonb_build_object(
        'day', hh.day, 'open', hh.open, 'close', hh.close, 'closed', hh.closed))
      from hospital_hours hh where hh.hospital_id = h.id
    ) as hospital_hours
  from hospitals h
  where h.lat between p_min_lat and p_max_lat
    and h.lng between p_min_lng and p_max_lng
    and (p_type is null or h.type = p_type)
    and (p_q is null or h.name ilike '%' || p_q || '%')
    and (
      p_department is null
      or exists (
        select 1 from hospital_departments d
        where d.hospital_id = h.id and d.name = p_department
      )
    )
  limit p_limit;
$$;

grant execute on function hospitals_in_bounds to anon, authenticated;
