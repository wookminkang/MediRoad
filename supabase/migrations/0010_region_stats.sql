-- 지역 클러스터 고속화 — 무필터 집계를 사전계산 테이블에서 즉시 조회.
-- (0007은 매 호출마다 전국 78k를 집계해 ~1s 소요 → 초기 /map 로딩 지연)

create table if not exists hospital_region_stats (
  level text not null,          -- 'sido' | 'sigungu'
  region text not null,         -- 시도명 또는 시군구명
  sido text not null,
  cnt bigint not null,
  lat double precision,
  lng double precision,
  primary key (level, region, sido)
);

-- 사전계산 갱신 (동기화 후 호출). 시도/시군구 단위 개수·중심좌표.
create or replace function refresh_hospital_region_stats() returns void
language sql as $$
  delete from hospital_region_stats;
  insert into hospital_region_stats (level, region, sido, cnt, lat, lng)
    select 'sido', h.sido, h.sido, count(*), avg(h.lat), avg(h.lng)
    from hospitals h where h.sido is not null group by h.sido
  union all
    select 'sigungu', h.sigungu, h.sido, count(*), avg(h.lat), avg(h.lng)
    from hospitals h where h.sigungu is not null group by h.sigungu, h.sido;
$$;

select refresh_hospital_region_stats();

-- 클러스터 RPC 재정의: 무필터 → 사전계산(고속), 필터 → 즉석 집계(결과 적음).
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
  -- 화면(bbox)에 보이는 지역 키
  with visible as (
    select distinct
      case when p_level = 'sido' then h.sido else h.sigungu end as reg,
      h.sido
    from hospitals h
    where (case when p_level = 'sido' then h.sido else h.sigungu end) is not null
      and h.lat between p_min_lat and p_max_lat
      and h.lng between p_min_lng and p_max_lng
  )
  -- 무필터: 사전계산 테이블 조인(즉시)
  select s.region, s.sido, s.cnt, s.lat, s.lng
  from hospital_region_stats s
  join visible v on v.reg = s.region and v.sido = s.sido
  where s.level = p_level
    and p_type is null and p_q is null and p_department is null

  union all

  -- 필터 있음: 즉석 집계 (필터로 행이 적어 비교적 빠름)
  select f.reg, f.sido, count(*) as cnt, avg(f.lat) as lat, avg(f.lng) as lng
  from (
    select h.lat, h.lng, h.sido,
      case when p_level = 'sido' then h.sido else h.sigungu end as reg
    from hospitals h
    where not (p_type is null and p_q is null and p_department is null)
      and (p_type is null or h.type = p_type)
      and (p_q is null or h.name ilike '%' || p_q || '%')
      and (
        p_department is null
        or exists (
          select 1 from hospital_departments d
          where d.hospital_id = h.id and d.name = p_department
        )
      )
  ) f
  join visible v2 on v2.reg = f.reg and v2.sido = f.sido
  group by f.reg, f.sido;
$$;

grant execute on function hospital_region_clusters to anon, authenticated;
