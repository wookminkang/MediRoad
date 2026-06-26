-- 축소 화면(그리드·지역 클러스터) 카운트에도 영업중/야간진료 필터 반영.
-- 진료시간(hospital_hours, "HHMM" 형식)으로 SQL에서 계산.
--   야간진료: 어느 요일이든 close >= '2000'
--   영업중  : 현재 KST 요일·시각이 open <= now < close (점심시간은 단순화로 무시)

-- 파라미터(반환 타입은 동일하지만 인자 추가 → 기존 함수 DROP 필요)
drop function if exists hospital_grid_clusters(
  double precision, double precision, double precision, double precision,
  double precision, text, text, text
);
drop function if exists hospital_region_clusters(
  text, double precision, double precision, double precision, double precision,
  text, text, text
);

-- 1) 그리드 클러스터
create or replace function hospital_grid_clusters(
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_step double precision,
  p_type text default null,
  p_q text default null,
  p_department text default null,
  p_open boolean default false,
  p_night boolean default false
)
returns table (lat double precision, lng double precision, cnt bigint)
language sql
stable
as $$
  select avg(h.lat) as lat, avg(h.lng) as lng, count(*) as cnt
  from hospitals h
  where h.lat between p_min_lat and p_max_lat
    and h.lng between p_min_lng and p_max_lng
    and (p_type is null or h.type = p_type)
    and (p_q is null or h.name ilike '%' || p_q || '%')
    and (
      p_department is null
      or exists (select 1 from hospital_departments d
                 where d.hospital_id = h.id and d.name = p_department)
    )
    and (
      not p_night
      or exists (select 1 from hospital_hours hh
                 where hh.hospital_id = h.id and coalesce(hh.closed,false) = false
                   and hh.close >= '2000')
    )
    and (
      not p_open
      or exists (select 1 from hospital_hours hh
                 where hh.hospital_id = h.id
                   and hh.day = extract(dow from (now() at time zone 'Asia/Seoul'))::int
                   and coalesce(hh.closed,false) = false
                   and hh.open <= to_char((now() at time zone 'Asia/Seoul'),'HH24MI')
                   and to_char((now() at time zone 'Asia/Seoul'),'HH24MI') < hh.close)
    )
  group by floor(h.lat / p_step), floor(h.lng / p_step);
$$;
grant execute on function hospital_grid_clusters to anon, authenticated;

-- 2) 지역 클러스터 (영업중/야간 시 사전계산 대신 즉석 집계)
create or replace function hospital_region_clusters(
  p_level text,
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_type text default null,
  p_q text default null,
  p_department text default null,
  p_open boolean default false,
  p_night boolean default false
)
returns table (region text, sido text, cnt bigint, lat double precision, lng double precision)
language sql
stable
as $$
  with visible as (
    select distinct
      case when p_level = 'sido' then h.sido else h.sigungu end as reg, h.sido
    from hospitals h
    where (case when p_level = 'sido' then h.sido else h.sigungu end) is not null
      and h.lat between p_min_lat and p_max_lat
      and h.lng between p_min_lng and p_max_lng
  )
  -- 필터 없음 → 사전계산 테이블(고속)
  select s.region, s.sido, s.cnt, s.lat, s.lng
  from hospital_region_stats s
  join visible v on v.reg = s.region and v.sido = s.sido
  where s.level = p_level
    and p_type is null and p_q is null and p_department is null
    and not p_open and not p_night

  union all

  -- 필터 있음 → 즉석 집계
  select f.reg, f.sido, count(*) as cnt, avg(f.lat) as lat, avg(f.lng) as lng
  from (
    select h.lat, h.lng, h.sido,
      case when p_level = 'sido' then h.sido else h.sigungu end as reg
    from hospitals h
    where not (p_type is null and p_q is null and p_department is null
               and not p_open and not p_night)
      and (p_type is null or h.type = p_type)
      and (p_q is null or h.name ilike '%' || p_q || '%')
      and (
        p_department is null
        or exists (select 1 from hospital_departments d
                   where d.hospital_id = h.id and d.name = p_department)
      )
      and (
        not p_night
        or exists (select 1 from hospital_hours hh
                   where hh.hospital_id = h.id and coalesce(hh.closed,false) = false
                     and hh.close >= '2000')
      )
      and (
        not p_open
        or exists (select 1 from hospital_hours hh
                   where hh.hospital_id = h.id
                     and hh.day = extract(dow from (now() at time zone 'Asia/Seoul'))::int
                     and coalesce(hh.closed,false) = false
                     and hh.open <= to_char((now() at time zone 'Asia/Seoul'),'HH24MI')
                     and to_char((now() at time zone 'Asia/Seoul'),'HH24MI') < hh.close)
      )
  ) f
  join visible v2 on v2.reg = f.reg and v2.sido = f.sido
  group by f.reg, f.sido;
$$;
grant execute on function hospital_region_clusters to anon, authenticated;
