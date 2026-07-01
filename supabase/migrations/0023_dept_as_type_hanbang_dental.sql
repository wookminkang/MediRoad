-- 지도 필터(마커/그리드)에서 "한방"·"치과"를 진료과목이 아닌 종별(type)로 처리.
--  - 한방: 표시과목명(침구과·한방내과 등)으로만 등록 → 과목명 '한방' 매칭 0건
--    → 종별 한의원+한방병원(약 15.3k)으로 잡아야 함.
--  - 치과: 대부분 구강내과·치과보철과 등으로 등록 → 과목명 '치과' 매칭 소수
--    → 종별 치과(약 19.3k)로 잡아야 함.
-- getHospitals(목록)는 앱 코드에서 처리했고, 여기선 지도 RPC 2종을 보정.

-- 1) 뷰포트 마커
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
  id text, slug text, name text, type text, sido text, sigungu text,
  address text, phone text, lat double precision, lng double precision,
  hospital_hours jsonb, hospital_photos jsonb
)
language sql
stable
as $$
  select
    h.id, h.slug, h.name, h.type, h.sido, h.sigungu, h.address, h.phone, h.lat, h.lng,
    (select jsonb_agg(jsonb_build_object('day', hh.day, 'open', hh.open, 'close', hh.close, 'closed', hh.closed))
     from hospital_hours hh where hh.hospital_id = h.id) as hospital_hours,
    (select jsonb_agg(jsonb_build_object('url', hp.url, 'alt', hp.alt, 'category', hp.category,
        'is_primary', hp.is_primary, 'sort_order', hp.sort_order) order by hp.is_primary desc, hp.sort_order)
     from hospital_photos hp where hp.hospital_id = h.id) as hospital_photos
  from hospitals h
  where h.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)::geography
    and (p_type is null or h.type = p_type)
    and (p_q is null or h.name ilike '%' || p_q || '%')
    and (
      p_department is null
      or (p_department = '한방' and h.type in ('한의원','한방병원'))
      or (p_department = '치과' and h.type = '치과')
      or (p_department not in ('한방','치과') and (
            h.name ilike '%' || p_department || '%'
            or exists (select 1 from hospital_departments d
                       where d.hospital_id = h.id and d.name = p_department)
          ))
    )
  limit p_limit;
$$;
grant execute on function hospitals_in_bounds to anon, authenticated;

-- 2) 그리드 클러스터
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
                   and hh.day = extract(dow from (now() at time zone 'Asia/Seoul'))::int
                   and coalesce(hh.closed,false) = false
                   and hh.open <= to_char((now() at time zone 'Asia/Seoul'),'HH24MI')
                   and to_char((now() at time zone 'Asia/Seoul'),'HH24MI') < hh.close)
    )
  group by floor(h.lat / p_step), floor(h.lng / p_step);
$$;
grant execute on function hospital_grid_clusters to anon, authenticated;
