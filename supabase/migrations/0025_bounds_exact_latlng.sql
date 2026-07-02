-- 마커/리스트 카운트 불일치 근본 수정.
-- hospitals_in_bounds가 `geom && envelope::geography`만 쓰면 지오그래피 bbox가 ~60m 팽창해
-- 셀 경계 밖 병원까지 잡힌다(그리드/지역 클러스터는 lat/lng between으로 정확히 셈 → 불일치).
-- → geom &&(GiST 인덱스 프리필터)는 유지하되, lat/lng between으로 정밀 필터를 추가해
--   그리드/지역 RPC와 동일한 공간 기준으로 통일한다.

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
    -- 정밀 필터: 그리드/지역 클러스터(lat/lng between)와 동일 기준 → 카운트 일치
    and h.lat between p_min_lat and p_max_lat
    and h.lng between p_min_lng and p_max_lng
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
