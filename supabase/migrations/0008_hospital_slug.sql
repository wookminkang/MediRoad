-- 병원 상세 URL 슬러그(한글명, 동명 시 지역/​id 접미) — /hospital/{slug}
-- 컬럼 추가 후 backfill 스크립트(scripts/backfill-slugs.mts)로 값 채움.
alter table hospitals add column if not exists slug text;
create unique index if not exists hospitals_slug_idx on hospitals (slug);

-- RPC들이 slug도 반환하도록 재정의 (지도/거리정렬 결과 링크에 필요) --------------
-- 반환 타입(컬럼)이 바뀌므로 create or replace 불가 → 먼저 DROP
drop function if exists search_hospitals_nearby(
  double precision, double precision, double precision, text, text, text, text, text, integer, integer
);
drop function if exists hospitals_in_bounds(
  double precision, double precision, double precision, double precision, text, text, text, integer
);

-- 1) 거리정렬 검색
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
    count(*) over () as total_count
  from base b
  order by b.dist
  limit p_limit offset p_offset;
$$;

grant execute on function search_hospitals_nearby to anon, authenticated;

-- 2) 뷰포트(bounds) 조회
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
