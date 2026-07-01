-- 검색·목록 성능 인덱스.
-- 문제: /hospitals 진료과목 필터 + 이름순 정렬이 최대 ~2초.
--  - hospitals(name)에 btree가 없어(GIN trgm만 존재) ORDER BY name가 수만 행을 정렬.
--  - 진료과목 조인 필터가 (name, hospital_id) 복합 인덱스 없이 동작.

-- 1) 이름순 정렬 가속 (무필터·필터 목록 공통)
create index if not exists hospitals_name_idx on hospitals (name);

-- 2) 진료과목 조인 필터 index-only 스캔 (name → hospital_id)
create index if not exists hospital_departments_name_hospital_idx
  on hospital_departments (name, hospital_id);

-- 통계 갱신(플래너가 새 인덱스를 즉시 활용)
analyze hospitals;
analyze hospital_departments;
