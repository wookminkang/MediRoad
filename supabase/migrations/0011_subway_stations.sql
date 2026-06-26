-- 지하철역 좌표 + 병원별 최근접 역 계산 (PostGIS KNN)
-- 데이터: 공공데이터 전국도시철도역사정보(도시철도역사정보.xlsx) → 적재 스크립트로 채움.

drop table if exists subway_stations;
create table subway_stations (
  id text primary key,            -- 역번호-노선번호
  name text not null,             -- 역사명
  line text,                      -- 노선명
  lat double precision,
  lng double precision,
  geom geography(Point, 4326) generated always as (
    case
      when lat is not null and lng is not null
      then st_setsrid(st_makepoint(lng, lat), 4326)::geography
    end
  ) stored
);
create index subway_stations_geom_idx on subway_stations using gist (geom);

alter table subway_stations enable row level security;
drop policy if exists "read subway" on subway_stations;
create policy "read subway" on subway_stations for select using (true);

-- 좌표에서 가장 가까운 역 1곳 (도보 가능권 1.5km 이내만)
create or replace function nearest_subway(
  p_lat double precision,
  p_lng double precision
)
returns table (name text, line text, distance_m int)
language sql
stable
as $$
  select x.name, x.line, x.distance_m
  from (
    select
      s.name,
      s.line,
      round(
        st_distance(
          s.geom,
          st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
        )
      )::int as distance_m
    from subway_stations s
    where s.geom is not null
    order by s.geom <-> st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    limit 1
  ) x
  where x.distance_m <= 1500;
$$;

grant execute on function nearest_subway to anon, authenticated;
