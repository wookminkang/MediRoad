-- MediRoad 병원 스키마 (정규화) — E-Gen(국립중앙의료원) 동기화 + 편집 데이터
-- 읽기: anon + RLS 공개. 쓰기: service_role(동기화·관리)만.

-- 1. 병원 핵심 (E-Gen 동기화 + 편집 1:1 필드)
create table if not exists hospitals (
  id text primary key,              -- E-Gen hpid (고유)
  name text not null,
  type text not null,               -- 병원/의원/한방병원/한의원/치과/약국 (dutyDivNam 정규화)
  sido text not null,               -- "서울"
  sigungu text not null,            -- "강남구"
  emdong text,
  address text not null,            -- dutyAddr
  road_address text,
  postal_code text,
  phone text,                       -- dutyTel1
  lat double precision,             -- wgs84Lat
  lng double precision,             -- wgs84Lon
  er_available boolean,             -- 응급실(dutyEryn=1)
  beds int,                         -- 병상수(dutyHano)
  directions text,                  -- 오시는 길(dutyMapimg)
  note text,                        -- 기타(dutyEtc)
  -- 편집(E-Gen에 없음, 관리자/추후 입력)
  description text,
  homepage_url text,
  booking_url text,
  station_name text,                -- 가까운 지하철역
  station_line text,
  station_exit text,
  station_distance_m int,
  synced_at timestamptz,            -- 마지막 E-Gen 동기화 시각
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hospitals_region_idx on hospitals (sido, sigungu);
create index if not exists hospitals_type_idx on hospitals (type);
create index if not exists hospitals_geo_idx on hospitals (lat, lng);

-- 2. 진료과목 (행당 1과목) — dgidIdName 분해
create table if not exists hospital_departments (
  hospital_id text not null references hospitals(id) on delete cascade,
  name text not null,               -- "내과", "정형외과"…
  primary key (hospital_id, name)
);
create index if not exists hospital_departments_name_idx on hospital_departments (name);

-- 3. 요일별 진료시간
create table if not exists hospital_hours (
  hospital_id text not null references hospitals(id) on delete cascade,
  day smallint not null,            -- 1=월 … 7=일, 8=공휴일
  open text,                        -- "0900"
  close text,                       -- "1800"
  closed boolean not null default false,
  primary key (hospital_id, day)
);

-- 4. 편의·특화 (주차·야간진료 등)
create table if not exists hospital_amenities (
  hospital_id text not null references hospitals(id) on delete cascade,
  name text not null,
  primary key (hospital_id, name)
);

-- 5. 사진 (편집)
create table if not exists hospital_photos (
  id uuid primary key default gen_random_uuid(),
  hospital_id text not null references hospitals(id) on delete cascade,
  url text not null,
  alt text,
  category text,                    -- 외관/접수/진료실/대기실/기타
  is_primary boolean not null default false,
  sort_order int not null default 0
);
create index if not exists hospital_photos_hid_idx on hospital_photos (hospital_id, sort_order);

-- 6. FAQ (편집)
create table if not exists hospital_faqs (
  id uuid primary key default gen_random_uuid(),
  hospital_id text not null references hospitals(id) on delete cascade,
  q text not null,
  a text not null,
  sort_order int not null default 0
);
create index if not exists hospital_faqs_hid_idx on hospital_faqs (hospital_id, sort_order);

-- 7. 의료진 (편집)
create table if not exists hospital_doctors (
  id uuid primary key default gen_random_uuid(),
  hospital_id text not null references hospitals(id) on delete cascade,
  name text not null,
  title text,                       -- 원장 등
  specialty text,
  sort_order int not null default 0
);
create index if not exists hospital_doctors_hid_idx on hospital_doctors (hospital_id, sort_order);

-- 8. SEO 메타 (편집, 1:1)
create table if not exists hospital_seo (
  hospital_id text primary key references hospitals(id) on delete cascade,
  meta_title text,
  meta_description text,
  meta_keywords text[],
  og_image text,
  noindex boolean not null default false
);

-- updated_at 자동 갱신 (set_updated_at()는 0001에서 생성됨)
drop trigger if exists trg_hospitals_updated on hospitals;
create trigger trg_hospitals_updated
  before update on hospitals
  for each row execute function set_updated_at();

-- RLS: 모든 테이블 공개 읽기, 쓰기는 service_role만
do $$
declare t text;
begin
  foreach t in array array[
    'hospitals','hospital_departments','hospital_hours','hospital_amenities',
    'hospital_photos','hospital_faqs','hospital_doctors','hospital_seo'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select using (true)', t);
  end loop;
end $$;
