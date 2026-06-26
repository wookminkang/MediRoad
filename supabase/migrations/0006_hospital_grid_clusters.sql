-- 중간 줌: 좌표 그리드(p_step 격자)로 묶은 원형 카운트 버블("219")용 집계
create or replace function hospital_grid_clusters(
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_step double precision,
  p_type text default null,
  p_q text default null,
  p_department text default null
)
returns table (
  lat double precision,
  lng double precision,
  cnt bigint
)
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
      or exists (
        select 1 from hospital_departments d
        where d.hospital_id = h.id and d.name = p_department
      )
    )
  group by floor(h.lat / p_step), floor(h.lng / p_step);
$$;

grant execute on function hospital_grid_clusters to anon, authenticated;
