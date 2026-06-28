# 병원별 의료 콘텐츠 (SEO/GEO 설계)

> 병원이 직접 작성하는 오리지널 의료 콘텐츠를 **병원 엔티티(지역)와 결속**해 SEO/GEO로 흡수하는 설계.
> 전역 정책은 [SEO.md](./SEO.md), 칼럼 인프라는 `0001_columns.sql` 참고 (본 기능은 그 구조를 재사용).

---

## 1. 목표 / 원칙

> 📌 **방향(v2)**: 병원 포스트는 **"우리 병원 이용 설명서"(방문·이용·운영 안내)** 다. 질환·증상 일반정보는 **건강 칼럼**에 작성하고 중복하지 않는다. 작성 규칙·템플릿·DB 매핑은 [HOSPITAL_POST_GUIDE.md](./HOSPITAL_POST_GUIDE.md) 참고.

- **thin 디렉터리 → 이용 권위 페이지로 격상**: 78k 병원 대부분은 주소·전화만 있는 얇은 페이지. 고유 안내 콘텐츠가 붙은 병원만 "리움한방병원 × 초진/주차/교통 안내" 같은 **병원+이용맥락+지역** 권위 페이지가 됨.
- **오리지널 + 결속**: 병원이 쓴 고유 안내 글을 그 병원 페이지 하위에 두어, 로컬 신뢰도·내부링크 자산을 물려받음.
- **역할 분리**: 병원 포스트=방문/운영 안내, 건강 칼럼=질환/증상 일반정보. (중복 금지)
- **YMYL 준수**: 작성자·검수자·출처·최종확인일 필수.
- **양산 금지**: 템플릿 자동생성은 thin/중복 패널티. **글이 있는 병원만** 색인.

---

## 2. 라우트 & 색인 정책

| 라우트 | 색인 | canonical | 비고 |
|---|---|---|---|
| `/hospitals/[slug]` | ✅ index | self | 병원 상세. slug=한글병원명(동명 시 지역 접미). 같은 라우트에 id로 접근 시 canonical slug로 301 |
| `/hospitals/[slug]/post/[postId]` | ✅ index (게시중만) | self | **병원 작성 글 — 핵심 색인 페이지**. draft·hidden=noindex |
| `/conditions/[condition]` | ✅ index | self | 질환 허브 — 여러 병원 글 + 관련 병원 집계 (로컬 GEO) |
| 빈 글 / 미게시 | 🚫 noindex | — | soft-404 방지 |

- **중첩 URL**(`/hospitals/[slug]/post/...`)로 병원의 지역 컨텍스트·링크 에쿼티 상속.
- 병원 상세 slug 설계는 본 변경에서 적용 완료(`hospitals.slug` 컬럼 + backfill). 포스트는 `post_id`로 식별.
- 렌더링: **ISR**(`revalidate` + `dynamicParams: true`). 게시된 글만 `generateStaticParams`/sitemap 포함.
- 모든 색인 페이지 자기참조 canonical.

---

## 3. DB 스키마 (`0008_hospital_posts.sql`)

칼럼(`columns`) 구조를 미러링하되 **`hospital_id` FK + 슬러그**를 추가. (읽기: anon+RLS 게시글만 / 쓰기: service_role)

```sql
create table if not exists hospital_posts (
  id text primary key,                 -- 짧은 공개 id (URL: /hospitals/{병원slug}/post/{id})
  hospital_id text not null references hospitals(id) on delete cascade,
  title text not null,
  excerpt text not null,
  thumbnail text,

  summary jsonb not null default '[]'::jsonb,   -- string[] (TL;DR — GEO 인용 스니펫)
  body_md text not null default '',             -- 본문 마크다운
  tags jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,       -- {q,a}[] → FAQPage
  refs jsonb not null default '[]'::jsonb,       -- {title,url}[] 출처
  conditions jsonb not null default '[]'::jsonb, -- string[] 다룬 질환 (질환 허브 연결)
  related_departments jsonb not null default '[]'::jsonb,

  -- E-E-A-T (필수)
  author jsonb not null,            -- {name, role, license?}  예: {name:"리움한방병원", role:"한의원"}
  reviewed_by jsonb,                -- {name, specialty, bio?} 의료진 검수

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
  updated_at timestamptz not null default now(),
  unique (hospital_id, slug)
);

create index if not exists hp_hospital_idx on hospital_posts (hospital_id, status);
create index if not exists hp_pub_idx on hospital_posts (status, published_at desc);

drop trigger if exists trg_hp_updated on hospital_posts;
create trigger trg_hp_updated before update on hospital_posts
  for each row execute function set_updated_at();   -- 0001에서 정의된 함수 재사용

alter table hospital_posts enable row level security;
drop policy if exists "read published hospital_posts" on hospital_posts;
create policy "read published hospital_posts" on hospital_posts
  for select using (status = 'published');
```

---

## 4. JSON-LD 템플릿 (의료 결속의 핵심)

글 상세 페이지에 **MedicalWebPage + 작성자 + 다룬 질환 + 병원(geo)** 을 함께 임베드해 "콘텐츠 ↔ 위치 ↔ 질환"을 연결.

```jsonc
{
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "headline": "{title}",
  "datePublished": "{published_at}",
  "dateModified": "{updated_at}",
  "author": {                       // E-E-A-T: 실제 작성 주체
    "@type": "MedicalClinic",       // (의료진 개인이면 Physician)
    "name": "{병원명}",
    "medicalSpecialty": "{진료과}"
  },
  "reviewedBy": {                   // 검수 의료진(있으면)
    "@type": "Physician",
    "name": "{reviewed_by.name}",
    "medicalSpecialty": "{reviewed_by.specialty}"
  },
  "about": { "@type": "MedicalCondition", "name": "{condition}" },
  "mainEntityOfPage": {             // 콘텐츠를 병원(위치)에 결속 → 로컬 GEO
    "@type": "MedicalClinic",
    "name": "{병원명}",
    "address": { "@type": "PostalAddress", "streetAddress": "{도로명주소}", "addressRegion": "{시도}", "addressLocality": "{시군구}" },
    "geo": { "@type": "GeoCoordinates", "latitude": "{lat}", "longitude": "{lng}" }
  }
}
```
- FAQ 블록이 있으면 별도 `FAQPage` JSON-LD 동봉(기존 칼럼 패턴 재사용).
- 질환 허브 페이지: `MedicalCondition` + 관련 `MedicalClinic` 리스트.

---

## 5. 내부링크 / 토픽 클러스터

```
병원 상세 ──(글 목록)──▶ 병원 글 ──(다룬 질환)──▶ 질환 허브
   ▲                         │                      │
   └──────(관련 병원)◀────────┴──(지역)──▶ /area/[region]
```
- 병원 글 → 본문에서 자기 병원 상세·관련 질환·지역 랜딩으로 내부링크.
- 질환 허브(`/conditions/디스크`) → 그 질환 글을 가진 병원들 집계 → 양방향 권위 강화.

---

## 6. 작성 가이드 (E-E-A-T + GEO)

> 📌 상세 작성 규칙·카테고리·제목 템플릿·DB 필드 매핑·표현 가이드는 **[HOSPITAL_POST_GUIDE.md](./HOSPITAL_POST_GUIDE.md)** 로 이전(v2). 아래는 요지.

**성격**: 방문·이용·운영 **안내**(초진·예약·접수·주차·교통·의료진일정·공지). 질환정보는 칼럼으로.

**구조 (답변 우선)**
1. 상단 **요약(summary)** = 한눈에 보기(위치/역/예약/접수마감/주차)
2. 질문형 H2/H3 → 한 줄 직답 → 상세
3. 병원명·지역·역을 방문 맥락에서 자연스럽게 명시
4. 하단 FAQ(3~5개) + 병원 상세/진료시간/오시는길 내부링크

**신뢰도 (필수)**: 작성자=실제 병원/검토부서, 작성·최종확인일 노출, 의학적 면책, 과장·단정·후기·비교 금지

---

## 7. 의료광고법 체크리스트 (운영 정책)

> 병원이 작성한 의료 콘텐츠는 **의료광고로 간주될 수 있음**(의료법 §56). 게시 전 검토.

- [ ] 치료 효과 **보장·단정** 표현 금지 ("100% 완치" 등)
- [ ] 환자 **치료 경험담/후기** 게재 금지
- [ ] 다른 의료기관과 **비교·최상급**("최고", "유일") 금지
- [ ] 비급여 진료비 **할인·이벤트** 유인 표현 주의
- [ ] 전문의 자격 등 **허위·과장 표시** 금지
- [ ] 필요 시 **의료광고 사전심의** 대상 여부 확인 (매체·도달범위 기준)
- [ ] 본문에 **의학적 면책**(개인차·전문의 상담 권고) 명시

---

## 8. 구현 단계

1. **마이그레이션** `0008_hospital_posts.sql` (위 스키마) — 사용자가 Supabase SQL Editor에서 실행
2. **API/조회** `src/api/hospital-post.ts` — 병원별 글 목록·상세, 게시글만 (mock 폴백)
3. **라우트**
   - `/hospitals/[id]/posts/[slug]/page.tsx` — ISR, `generateMetadata`(canonical/noindex), JSON-LD
   - 병원 상세(`/hospitals/[id]`)에 글 목록 섹션 추가
   - `/conditions/[condition]/page.tsx` — 질환 허브 (후순위)
4. **컴포넌트 재사용** — `column/markdown.tsx`(본문), `share-buttons`, 카드 등 칼럼 컴포넌트 그대로
5. **sitemap/robots** — 게시 글만 sitemap 포함, draft/hidden noindex
6. **작성 도구** — 우선 service_role 시드/스크립트로 입력(칼럼과 동일), 이후 입력 UI 검토

---

## 9. 결정 대기 항목

- 작성 주체: **병원 직접 입력 UI** vs **운영자 대행 입력**(초기엔 후자 권장)
- 질환 허브(`/conditions`)를 1차에 포함할지, 글 축적 후 2차로 뺄지
- `author`를 병원 단위로 둘지, 의료진 개인(Physician) 프로필 테이블까지 둘지
