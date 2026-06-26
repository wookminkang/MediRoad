-- 병원 거리 정렬 (PostGIS) — 내 위치/반경 검색을 DB에서 거리순으로 정확히 정렬
create extension if not exists postgis;

-- 좌표 → geography(Point) 생성 컬럼 + 공간 인덱스(GiST, KNN)
alter table hospitals
  add column if not exists geom geography(Point, 4326)
  generated always as (
    case
      when lat is not null and lng is not null
      then st_setsrid(st_makepoint(lng, lat), 4326)::geography
    end
  ) stored;

create index if not exists hospitals_geom_idx on hospitals using gist (geom);

-- 근처 병원 검색 RPC: 필터 + 반경(옵션) + 거리순 정렬 + 페이지네이션 + 총개수
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
  )
  select
    b.id, b.name, b.type, b.sido, b.sigungu, b.emdong, b.address,
    b.road_address, b.phone, b.lat, b.lng, b.updated_at,
    (
      select jsonb_agg(jsonb_build_object(
        'day', hh.day, 'open', hh.open, 'close', hh.close, 'closed', hh.closed))
      from hospital_hours hh where hh.hospital_id = b.id
    ) as hospital_hours,
    b.dist as distance_m,
    count(*) over () as total_count
  from base b
  order by b.dist
  limit p_limit offset p_offset;
$$;

grant execute on function search_hospitals_nearby to anon, authenticated;
