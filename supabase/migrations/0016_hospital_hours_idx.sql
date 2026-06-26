-- 클러스터 영업중/야간 필터 가속 — hospital_hours(hospital_id) 인덱스.
-- (넓은 bbox에서 진료시간 exists가 느려 타임아웃 → 빈 결과 방지)
create index if not exists hospital_hours_hid_idx on hospital_hours (hospital_id);
