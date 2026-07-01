-- 거리순 검색(내 위치) 가속 — search_hospitals_nearby.
-- 문제: count(*) over()가 매칭 전체를 세느라 geom KNN 인덱스의 조기종료(limit 24)를 막아
--       무필터 ~440ms, +진료과목 ~710ms.
-- 해결: base CTE에서 KNN 정렬 + limit로 가장 가까운 N만 뽑고(인덱스 조기종료),
--       total_count는 0으로 반환(총 개수는 앱에서 가벼운 bbox planned 카운트로 별도 계산).
-- 반환 컬럼 동일 → create or replace 가능.
create or replace function search_hospitals_nearby(
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision default null,
  p_sido text default null,
  p_sigungu text default null,
  p_type text default null,
  p_q text default null,
  p_department text default null,
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id text,
  slug text,
  name text,
  type text,
  sido text,
  sigungu text,
  emdong text,
  address text,
  road_address text,
  phone text,
  lat double precision,
  lng double precision,
  updated_at timestamptz,
  hospital_hours jsonb,
  distance_m double precision,
  total_count bigint
)
language sql
stable
as $$
  with pt as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  ),
  base as (
    select h.*, (h.geom <-> (select g from pt)) as dist
    from hospitals h
    where h.geom is not null
      and (p_sido is null or h.sido = p_sido)
      and (p_sigungu is null or h.sigungu = p_sigungu)
      and (p_type is null or h.type = p_type)
      and (p_q is null or h.name ilike '%' || p_q || '%')
      and (
        p_department is null
        or exists (
          select 1 from hospital_departments d
          where d.hospital_id = h.id and d.name = p_department
        )
      )
      and (
        p_radius_m is null
        or st_dwithin(h.geom, (select g from pt), p_radius_m)
      )
    order by h.geom <-> (select g from pt)   -- KNN 인덱스 조기종료
    limit p_limit offset p_offset
  )
  select
    b.id, b.slug, b.name, b.type, b.sido, b.sigungu, b.emdong, b.address,
    b.road_address, b.phone, b.lat, b.lng, b.updated_at,
    (
      select jsonb_agg(jsonb_build_object(
        'day', hh.day, 'open', hh.open, 'close', hh.close, 'closed', hh.closed))
      from hospital_hours hh where hh.hospital_id = b.id
    ) as hospital_hours,
    b.dist as distance_m,
    0::bigint as total_count
  from base b
  order by b.dist;
$$;

grant execute on function search_hospitals_nearby to anon, authenticated;
