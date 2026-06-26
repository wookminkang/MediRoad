-- 지역 라벨 위치/개수 고정 — 뷰포트 내 평균이 아니라 "지역 전체"의 중심·총개수로.
-- 화면에 일부라도 보이는 지역만 반환하되, 좌표·개수는 그 지역 전체 기준(이동해도 안 흔들림).
create or replace function hospital_region_clusters(
  p_level text,
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_type text default null,
  p_q text default null,
  p_department text default null
)
returns table (
  region text,
  sido text,
  cnt bigint,
  lat double precision,
  lng double precision
)
language sql
stable
as $$
  with f as (
    select
      h.lat, h.lng, h.sido,
      case when p_level = 'sido' then h.sido else h.sigungu end as reg
    from hospitals h
    where (p_type is null or h.type = p_type)
      and (p_q is null or h.name ilike '%' || p_q || '%')
      and (
        p_department is null
        or exists (
          select 1 from hospital_departments d
          where d.hospital_id = h.id and d.name = p_department
        )
      )
  ),
  visible as (
    select distinct reg, sido
    from f
    where reg is not null
      and lat between p_min_lat and p_max_lat
      and lng between p_min_lng and p_max_lng
  )
  select f.reg as region, f.sido, count(*) as cnt, avg(f.lat) as lat, avg(f.lng) as lng
  from f
  join visible v on v.reg = f.reg and v.sido = f.sido
  group by f.reg, f.sido;
$$;
