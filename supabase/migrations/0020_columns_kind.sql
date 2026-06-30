-- 메디브리핑 — columns 테이블에 콘텐츠 종류(kind) 추가.
-- 기존 행은 모두 건강칼럼('column')으로 자동 처리. 'briefing'이면 메디브리핑.
alter table columns
  add column if not exists kind text not null default 'column';

-- 목록 쿼리(kind + status + published_at 정렬) 가속
create index if not exists idx_columns_kind_status_published
  on columns (kind, status, published_at desc);
