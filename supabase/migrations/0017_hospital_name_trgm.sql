-- 병원명 검색 가속 — pg_trgm 트라이그램 GIN 인덱스.
-- 기존: name ILIKE '%term%' (양쪽 와일드카드) → B-tree 미사용, 78k행 풀스캔으로 느림.
-- 이후: 트라이그램 GIN 인덱스로 부분일치 ILIKE도 인덱스 스캔 → 자동완성 응답 빨라짐.
create extension if not exists pg_trgm;

create index if not exists hospitals_name_trgm_idx
  on hospitals using gin (name gin_trgm_ops);

analyze hospitals;
