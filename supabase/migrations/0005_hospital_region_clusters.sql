-- 지도 축소 시 지역(시도/시군구) 단위 집계 — "성북구 1,210곳" 클러스터 라벨용
-- p_level: 'sido' | 'sigungu'. 뷰포트(bounds) 내에서 그룹별 개수 + 중심좌표(평균) 반환.
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
  select
    case when p_level = 'sido' then h.sido else h.sigungu end as region,
    h.sido,
    count(*) as cnt,
    avg(h.lat) as lat,
    avg(h.lng) as lng
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
  group by 1, h.sido
  having case when p_level = 'sido' then h.sido else h.sigungu end is not null;
$$;

grant execute on function hospital_region_clusters to anon, authenticated;
