-- 0010 누락 수정: hospital_region_stats 공개 읽기 권한.
-- (anon이 못 읽어 클러스터가 빈 결과로 나오던 문제 해결)
alter table hospital_region_stats enable row level security;
drop policy if exists "read region stats" on hospital_region_stats;
create policy "read region stats" on hospital_region_stats
  for select using (true);
grant select on hospital_region_stats to anon, authenticated;
