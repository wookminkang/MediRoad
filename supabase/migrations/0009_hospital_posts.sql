-- 병원별 의료 콘텐츠(포스트) — /hospitals/{slug}/posts/{postId}
-- 읽기: anon + RLS(게시글만). 쓰기: service_role(시드/운영자)만. (docs/HOSPITAL_CONTENT_SEO.md)
create table if not exists hospital_posts (
  id text primary key,                 -- 짧은 공개 id (URL의 postId)
  hospital_id text not null references hospitals(id) on delete cascade,
  title text not null,
  excerpt text not null,
  thumbnail text,

  summary jsonb not null default '[]'::jsonb,    -- string[] (TL;DR — GEO 인용 스니펫)
  body_md text not null default '',              -- 본문 마크다운
  tags jsonb not null default '[]'::jsonb,        -- string[]
  faqs jsonb not null default '[]'::jsonb,        -- {q,a}[] → FAQPage
  refs jsonb not null default '[]'::jsonb,        -- {title,url}[] 출처
  conditions jsonb not null default '[]'::jsonb,  -- string[] 다룬 질환
  related_departments jsonb not null default '[]'::jsonb,

  -- E-E-A-T
  author jsonb not null,            -- {name, role, license?}
  reviewed_by jsonb,                -- {name, specialty, bio?}

  -- SEO/GEO 메타 (비우면 앱이 title/excerpt 폴백)
  meta_title text,
  meta_description text,
  meta_keywords text[],
  og_image text,
  noindex boolean not null default false,

  status text not null default 'draft' check (status in ('published','draft','hidden')),
  reading_minutes int not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hp_post_hospital_idx on hospital_posts (hospital_id, status, published_at desc);
create index if not exists hp_post_pub_idx on hospital_posts (status, published_at desc);

drop trigger if exists trg_hospital_posts_updated on hospital_posts;
create trigger trg_hospital_posts_updated before update on hospital_posts
  for each row execute function set_updated_at();   -- 0001에서 정의된 함수 재사용

alter table hospital_posts enable row level security;
drop policy if exists "read published hospital_posts" on hospital_posts;
create policy "read published hospital_posts" on hospital_posts
  for select using (status = 'published');
