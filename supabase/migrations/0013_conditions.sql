-- 증상·질환 허브 — /conditions, /conditions/{slug}
-- 질환 개요는 운영자/AI가 작성, 관련 병원·콘텐츠는 앱이 자동 집계.
-- 읽기: anon + RLS(게시중만). 쓰기: service_role.
create table if not exists conditions (
  id text primary key,                 -- slug (URL: /conditions/{id}, 한글 가능 예: "허리디스크")
  name text not null,                  -- 표시명
  body_part text not null,             -- 부위 그룹 (예: "허리·관절", "머리·신경")
  departments jsonb not null default '[]'::jsonb, -- 관련 진료과 string[]
  symptoms jsonb not null default '[]'::jsonb,    -- 관련 증상 키워드 string[]
  excerpt text not null,               -- 한 줄 설명(목록·메타)
  summary jsonb not null default '[]'::jsonb,     -- 핵심 요약 string[]
  body_md text not null default '',                -- 개요 본문(마크다운)
  faqs jsonb not null default '[]'::jsonb,          -- {q,a}[]
  thumbnail text,

  -- SEO/GEO
  meta_title text,
  meta_description text,
  meta_keywords text[],
  og_image text,
  noindex boolean not null default false,

  status text not null default 'published' check (status in ('published','draft','hidden')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conditions_pub_idx on conditions (status, sort_order);
create index if not exists conditions_part_idx on conditions (body_part);

drop trigger if exists trg_conditions_updated on conditions;
create trigger trg_conditions_updated before update on conditions
  for each row execute function set_updated_at();   -- 0001 정의 함수 재사용

alter table conditions enable row level security;
drop policy if exists "read published conditions" on conditions;
create policy "read published conditions" on conditions
  for select using (status = 'published');
