-- 버그 수정 + 인덱스.
-- (1) 클러스터 "영업중" 판정 요일 버그: hospital_hours.day는 E-Gen(1=월…7=일)인데
--     extract(dow)는 0=일…6=토 → 일요일 매칭 실패·요일 밀림. isodow(1=월…7=일)로 정정.
-- (2) hospital_posts.conditions(jsonb) 포함검색 풀스캔 → GIN 인덱스.

-- (1a) 그리드 클러스터 (0023 정의 + isodow)
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
      or (p_department = '한방' and h.type in ('한의원','한방병원'))
      or (p_department = '치과' and h.type = '치과')
      or (p_department not in ('한방','치과') and exists (
            select 1 from hospital_departments d
            where d.hospital_id = h.id and d.name = p_department))
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
                   and hh.day = extract(isodow from (now() at time zone 'Asia/Seoul'))::int
                   and coalesce(hh.closed,false) = false
                   and hh.open <= to_char((now() at time zone 'Asia/Seoul'),'HH24MI')
                   and to_char((now() at time zone 'Asia/Seoul'),'HH24MI') < hh.close)
    )
  group by floor(h.lat / p_step), floor(h.lng / p_step);
$$;
grant execute on function hospital_grid_clusters to anon, authenticated;

-- (1b) 지역 클러스터 (0015 정의 + isodow)
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
  select s.region, s.sido, s.cnt, s.lat, s.lng
  from hospital_region_stats s
  join visible v on v.reg = s.region and v.sido = s.sido
  where s.level = p_level
    and p_type is null and p_q is null and p_department is null
    and not p_open and not p_night

  union all

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
                     and hh.day = extract(isodow from (now() at time zone 'Asia/Seoul'))::int
                     and coalesce(hh.closed,false) = false
                     and hh.open <= to_char((now() at time zone 'Asia/Seoul'),'HH24MI')
                     and to_char((now() at time zone 'Asia/Seoul'),'HH24MI') < hh.close)
      )
  ) f
  join visible v2 on v2.reg = f.reg and v2.sido = f.sido
  group by f.reg, f.sido;
$$;
grant execute on function hospital_region_clusters to anon, authenticated;

-- (2) 질환 관련 포스트 포함검색 가속
create index if not exists hospital_posts_conditions_gin
  on hospital_posts using gin (conditions jsonb_path_ops);
