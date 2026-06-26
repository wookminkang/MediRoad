-- MediRoad 건강 칼럼 스키마 (Supabase / Postgres)
-- 읽기: anon + RLS 공개정책(게시글만). 쓰기: service_role(MCP·시드)만.

-- 1. 카테고리 (룩업 — 영문 id + 한글 라벨. 탈모처럼 유연하게 추가)
create table if not exists column_categories (
  id text primary key,              -- 영문 고유 id. 필터 쿼리: /health?category={id}  (예: "hair-loss")
  name text not null,               -- 표시 라벨(한글) (예: "탈모")
  sort_order int not null default 0
);

-- 2. 칼럼
create table if not exists columns (
  id text primary key,              -- 짧은 공개 id. URL: /health/{id}
  title text not null,
  category text not null references column_categories(id),
  excerpt text not null,
  thumbnail text,                   -- Supabase Storage 공개 URL

  summary jsonb not null default '[]'::jsonb,             -- string[]
  body_md text not null default '',                       -- 본문 마크다운 원문 (이미지 ![alt](url) 인라인)
  tags jsonb not null default '[]'::jsonb,                -- string[]
  faqs jsonb not null default '[]'::jsonb,                -- {q,a}[]
  refs jsonb not null default '[]'::jsonb,                -- {title,url}[] (references=SQL 예약어 → refs)
  related_departments jsonb not null default '[]'::jsonb, -- string[]

  author text not null default '메디로드',
  reviewed_by jsonb not null,       -- {name,specialty,bio?}

  -- SEO/GEO 메타 (검색 핵심 → 명시 컬럼으로 관리·검증. 비우면 앱이 title/excerpt로 폴백)
  meta_title text,                  -- <title>·og:title 오버라이드
  meta_description text,            -- meta description (150~160자 권장)
  meta_keywords text[],             -- string[] (GEO·일부 엔진용)
  og_image text,                    -- og:image 오버라이드
  noindex boolean not null default false,

  status text not null default 'draft' check (status in ('published','draft','hidden')),
  reading_minutes int not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists columns_pub_idx on columns (status, published_at desc);
create index if not exists columns_cat_idx on columns (category);

-- 3. updated_at 자동 갱신
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_columns_updated on columns;
create trigger trg_columns_updated
  before update on columns
  for each row execute function set_updated_at();

-- 4. RLS — 공개 읽기는 게시글만. insert/update/delete 정책 없음 → service_role만 가능.
alter table column_categories enable row level security;
alter table columns enable row level security;

drop policy if exists "read categories" on column_categories;
create policy "read categories" on column_categories
  for select using (true);

-- (참고) columns.category = column_categories.id (영문 slug). 표시 라벨은 name.

drop policy if exists "read published columns" on columns;
create policy "read published columns" on columns
  for select using (status = 'published');

-- 5. 카테고리 시드 (constants/column.ts COLUMN_CATEGORIES와 동일: id=영문, name=한글)
insert into column_categories (id, name, sort_order) values
  ('diabetes', '당뇨', 1),
  ('hypertension', '고혈압', 2),
  ('diet', '다이어트', 3),
  ('orthopedics', '정형외과', 4),
  ('oriental-medicine', '한방', 5),
  ('hair-loss', '탈모', 6),
  ('skin', '피부', 7),
  ('procedure', '기타 시술', 8)
on conflict (id) do nothing;
