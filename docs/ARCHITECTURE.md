# MediRoad 아키텍처

> Feature 기반(비-FSD) · Next.js 16 App Router · SEO/GEO 최우선.

---

## 1. 폴더 구조 — 완전 플랫 (No FSD)

**`features/` 슬라이스·배럴(public-API)·엄격한 import 경계 전부 없앤다.** 관용적 Next.js 평면 구조: UI는 `components/`(도메인 하위폴더), 로직·데이터는 `lib/`, 나머지는 top-level. **도메인은 폴더명으로만 구분**한다.

```
src/
├─ app/                       # 라우팅 전용 (Server Components — SEO 핵심)
│  ├─ layout.tsx              #   RootLayout → Header/Footer + <AppProviders>
│  ├─ page.tsx                #   홈
│  ├─ globals.css · brand.css
│  ├─ hospitals/              #   /hospitals(검색결과) · /hospitals/[id](상세)
│  ├─ area/                   #   /area/[region]/[department] 랜딩
│  ├─ health/                 #   /health(칼럼 목록·상세)
│  └─ admin/                  #   관리자 (인증·noindex)
│
├─ components/                # 모든 UI 컴포넌트 (도메인별 폴더 · 배럴 없음)
│  ├─ ui/                     #   디자인 시스템 원자 — PageContainer·PageHeader·Badge·Skeleton·DeleteDialog·ShareButton·ScrollToButtons …
│  ├─ layout/                 #   Header·Footer·AdminHeader·SkipLink
│  ├─ hospital/               #   HospitalCard·HospitalList·HospitalDetail·OpeningHoursTable·DoctorList·HospitalGallery(client)·HospitalActionBar(client)
│  ├─ search/                 #   SearchBar(form)·CategoryChips
│  ├─ map/                    #   Map(client)·MapPlaceholder
│  ├─ column/                 #   ColumnCard·ColumnList·ColumnDetail·TableOfContents(client)
│  └─ admin/                  #   HospitalForm(client)·HospitalAdminTable(client)·ColumnForm(client)·SeoMetaFields(client)
│
├─ api/                       # 데이터 접근 레이어 — 페이지가 직접 import. Mock→실API 교체 지점
│  ├─ hospital.ts             #   getHospitals·getHospitalById·getAllHospitalIds · create/update/delete
│  ├─ column.ts
│  ├─ http.ts                 #   fetch 래퍼(실API 전환 시 baseURL·헤더·에러)
│  └─ mock/                   #   mock 데이터 (hospitals.ts · columns.ts)
│
├─ lib/                       # 그 외 도메인 로직·연동 (데이터접근 아님, UI 아님)
│  ├─ hospital.ts             #   도메인 로직 (hospitalKeywords·TL;DR 생성 등)
│  ├─ seo/                    #   JSON-LD 빌더·메타 헬퍼
│  └─ react-query.ts          #   get-query-client
│
├─ utils/                     # 도메인 무관 순수 헬퍼 함수 (의존성 없음)
│  ├─ format.ts               #   날짜·시간·전화번호 포맷
│  ├─ distance.ts             #   좌표 간 거리 계산
│  └─ cn.ts                   #   className 병합
│
├─ hooks/                     # 공용 훅
├─ constants/                 # 진료과목·종별·지역(area) 화이트리스트
├─ types/                     # 도메인·전역 타입 — hospital.ts · column.ts · index.ts(LatLng 등)
└─ providers/                 # 전역 Provider 합성 (app-providers·query-provider·theme-provider)
```

### 규칙 (No-FSD)
- **배럴(`index.ts` public-API) 금지.** 컴포넌트는 파일에서 직접 import (`@/components/hospital/hospital-card`).
- **`shared`/`entities`/`widgets`/`features` 레이어 명칭 금지.** 도메인 = 폴더명.
- **import 경계 강제 안 함.** 어디서든 필요한 모듈을 직접 가져온다 (단방향 규칙 없음).
- **역할별 분리만 지킨다**:
  - `components/` = 공통 **UI** (도메인별 하위폴더)
  - `api/` = **데이터 접근** (repository 함수·mock·http). **페이지가 여기서 import**해 SSR 호출. Mock→실API 교체 지점
  - `lib/` = **그 외 도메인 로직·연동** (JSON-LD 빌더·도메인 헬퍼·react-query) — 데이터 접근 아님
  - `utils/` = **도메인 무관 순수 함수** (format·distance·cn) — 의존성 없는 헬퍼
  - `types/` = 타입, `constants/` = 상수, `hooks/` = 공용 훅, `providers/` = 전역 Provider
- **api vs lib vs utils**: 데이터를 가져오면 `api/`, 데이터접근 외 도메인/연동 로직이면 `lib/`, 입력→출력만 하는 순수 함수면 `utils/`.

---

## 2. Next 16 제약 (코드에 반영)

| 제약 | 처리 |
|---|---|
| `params`/`searchParams`는 **Promise** | 페이지·`generateMetadata`에서 `await` 필수 |
| **한글/비-ASCII 동적 세그먼트는 URL-인코딩되어 전달** | `params`의 한글 값(예 `/area/[region]`)은 `%EA…`로 올 수 있음 → **`decodeURIComponent`로 디코드 후 비교/사용**. (ASCII id는 무관) |
| Context Provider | `"use client"` 모듈로 분리 후 Server Layout에서 import |
| `app/`은 라우팅 전용 | 기능 코드는 `components/`(UI)·`lib/`(로직)에 분리 |
| Cache Components | 기본 off (현 모델 유지) |
| 콜로케이션 | 라우트 내부 `_components` 안 씀 — app 외부 평면 분리(`components/`·`lib/`) 채택 |

---

## 3. 렌더링 전략 (SEO/GEO 핵심)

| 페이지 | 전략 | 이유 |
|---|---|---|
| `/` 홈 | Static | 콘텐츠 고정 |
| `/hospitals` 검색 | Dynamic (SSR) | searchParams 의존 |
| `/hospitals/[id]` 상세 | SSG (`generateStaticParams`) | 색인·속도 최적, JSON-LD |
| `/health/[id]` 칼럼 | SSG/ISR | 콘텐츠, 주기적 갱신 |
| `/admin/**` 관리자 | Dynamic + **auth** | 인증 필요, `noindex` |

원칙:
- **페이지 본문 = Server Component.** repository를 `await` 직접 호출해 SSR로 렌더 → 콘텐츠가 HTML에 존재.
- **TanStack Query는 보조.** 지도 인터랙션 등 클라이언트 상호작용에만. 콘텐츠를 client fetch로 가리지 않는다.
- **검색 = 네이티브 `<form method="get">`.** JS 없이 동작·크롤링 가능.
- **관리자 변이 = Server Actions/Route Handler.** 폼(Client)에서 호출, TanStack Query mutation으로 목록 invalidate. `/admin`은 미들웨어 인증 + `noindex`/robots disallow.

---

## 4. 상태 관리 경계 (성능 골든룰: "상태 밀어내기")

| 상태 | 위치 | 방식 | 이유 |
|---|---|---|---|
| 서버/원격 데이터 | 전역 | TanStack Query | Context 아님 |
| 테마(다크모드) | 전역 | `ThemeProvider` | 앱 전역 단일값 |
| **검색 필터**(q·과목·지역) | 라우트 | **URL searchParams** | 공유·뒤로가기·색인 → Context 금지 |
| **지도 ↔ 목록 동기화** | `/hospitals` 범위 | **라우트 스코프 Context** | 해당 화면에만 스코프(전역 오염 X) |

### Provider 합성
`app/layout.tsx`(Server) → `<AppProviders>`(client 합성) → `QueryProvider` > `ThemeProvider`. Provider 추가/제거는 `app-providers.tsx` 한 곳에서 관리.

### TanStack Query 사용 지침

> **대원칙: "콘텐츠는 RSC, Query는 인터랙션."** 공개 콘텐츠를 client `useQuery`로 가져오면 HTML에 안 들어가 SEO가 깨진다. **읽기는 RSC `await` 우선**, Query는 (1)관리자 변이 (2)지도·무한스크롤 등 클라이언트 전용 재조회에만.

**어디에 쓰나**

| 화면 | 데이터 방식 | Query |
|---|---|---|
| 홈·병원상세·area·칼럼 | RSC `await api/…` | ❌ |
| 검색 **필터링** | URL searchParams → 네비게이션 시 RSC 재실행 | ❌ (URL이 대신) |
| 검색결과 지도 이동/위치 재정렬 | 클라 재조회 | ✅ |
| 목록 무한스크롤(noindex) | 클라 페이지 추가 | ✅ |
| 관리자 CRUD | 변이 + 무효화 | ✅ |

**훅 선택 — `useSuspenseQuery` 기본** (`lib/react-query.ts`에 스트리밍 dehydrate 설정됨)
- `data`가 항상 정의 → `isLoading` 분기 없음. **fallback=`loading.tsx`/`<Suspense>`, 에러=`error.tsx`(Error Boundary)**.
- **읽기**: 서버에서 `prefetchQuery`(SEO 위해 `await`) → `<HydrationBoundary>` → 클라 `useSuspenseQuery`(동일 queryKey).
- **재조회 깜빡임 방지**: queryKey 변경(필터·지도) 시 재-suspend됨 → **상태 변경을 `useTransition`의 `startTransition`으로 감싸** 이전 UI 유지(성능 골든룰 #4와 동일 원리).
- **예외**: `useSuspenseQuery`는 `enabled`·`placeholderData` 미지원 → 조건부/의존 쿼리는 컴포넌트 분리, 안 되면 일반 `useQuery`.

**무한스크롤 — `useSuspenseInfiniteQuery`**
- 첫 페이지 = SSR(`prefetchInfiniteQuery` `await` → HTML·LCP·색인), 이후 페이지만 클라.
- `getNextPageParam`은 `Paginated<T>`(items·total·page·pageSize)로 계산. 바닥 감지=IntersectionObserver sentinel → `hasNextPage && !isFetchingNextPage`면 `fetchNextPage()`.
- ⚠️ **SEO 분기**: **색인 목록(area·`/health`)은 크롤 가능한 URL 페이지네이션**(`?page=`, RSC) 기본 — 무한스크롤만 두면 깊은 항목 색인 안 됨. **noindex 목록(검색결과)만 무한스크롤 단독 OK**. 색인 목록에 무한스크롤 얹을 땐 `?page=` 링크/`rel=next` 병행.

**관리자 변이** — `useMutation({ mutationFn: <Server Action>, onSuccess: () => qc.invalidateQueries(...) })`. 낙관적 업데이트 옵션.

**컨벤션**:
- **queryKey는 쿼리키 팩토리(`lib/query-keys.ts`)로만 생성** — 직접 배열 작성 금지. `hospitalKeys.list(filters)`·`hospitalKeys.detail(id)`·`adminHospitalKeys.list()`. 계층 구조라 무효화 범위 조절 쉬움(`hospitalKeys.all`로 전체, `hospitalKeys.detail(id)`로 단건).
- queryFn = `api/` 함수 재사용(서버) / Route Handler fetch(클라). 훅은 `hooks/`. 클라 재조회용 Route Handler(`app/api/…`)는 RSC와 **같은 `api/` 함수**를 호출(단일 소스).

---

## 5. 데이터 레이어 (Mock → 실API)

- `api/hospital.ts`에 **데이터 접근 함수 + Mock 구현** 분리. mock 데이터는 `api/mock/`. **페이지(Server Component)가 `@/api/hospital`에서 import**해 `await` 직접 호출 → SSR.
- 페이지는 함수 시그니처에만 의존 → Mock 구현을 실API(**심평원 HIRA** 등 공공데이터) 구현으로 **교체만** 하면 됨.
- 외부 API DTO → 도메인 모델(`types/hospital.ts`) 매핑은 `api/` 내부에서 처리(HIRA `sgguCd`→region, `XPos/YPos`→location 등. [PRD §6](./PRD.md)).
- `api/http.ts`의 fetch 래퍼는 실API 전환 시 baseURL·헤더·에러를 한 곳에서 관리.
- **읽기/쓰기 분리**: 읽기(`getHospitals`·`getHospitalById`·`getAllHospitalIds`)는 공개 페이지가 직접 호출. 쓰기(`createHospital`·`updateHospital`·`deleteHospital`)는 관리자 Server Action에서만 호출.

### 5-1. 건강 칼럼 = Supabase (DB) + 마크다운
- 스키마: `supabase/migrations/0001_columns.sql` (`columns` + `column_categories`).
  - **본문 `body_md text`** = 마크다운 원문(이미지는 `![alt](url)` 인라인). SEO 메타는 명시 컬럼(`meta_title`·`meta_description`·`meta_keywords`·`og_image`·`noindex`). 나머지 중첩 데이터(summary·faqs·refs·reviewed_by 등)는 JSONB.
- 렌더: `Column.body: string`(마크다운) → `components/column/markdown.tsx`(react-markdown + remark-gfm + rehype-sanitize, RSC). 스타일은 `globals.css` `.markdown` 스코프(Seed 토큰).
- 클라이언트: `src/lib/supabase/server.ts`(anon, 읽기) · `src/lib/supabase/admin.ts`(service_role, 쓰기·시드·MCP 전용, `server-only`).
- `api/column.ts`는 **env 설정 시 Supabase, 미설정 시 mock 폴백**(`isSupabaseConfigured`). 페이지·타입은 무변경.
- **RLS**: 공개 읽기는 `status='published'`만. insert/update는 service_role(=MCP)만.
- **콘텐츠 파이프라인** (매일 배치):
  - `content/columns/*.md` (frontmatter 메타 + 마크다운 본문 + `[이미지:N]` 자리표시). 포맷은 `_template.md`.
  - `npm run ingest` (`scripts/ingest-columns.ts`): frontmatter 파싱 → 로컬 이미지 **Supabase Storage(`column-images`) 업로드** → `[이미지:N]`→`![alt](url)` 치환·검증 → `reading_minutes` 자동계산 → `columns` upsert(+카테고리 자동 등록).
  - 이미지 도메인은 `next.config` `images.remotePatterns`(`*.supabase.co`)에 등록됨.
- 시드(기존 mock 이전): `npm run seed:columns`.

---

## 6. SEO / GEO

핵심 요약(전체 사양은 **[SEO.md](./SEO.md)**):
- **색인 전략**: 검색(`/hospitals?…`)은 noindex, **지역·과목 랜딩**(`/area/…`)을 색인 — 중복·thin 방지.
- **구조화 데이터 풀세트**: WebSite+SearchAction·Organization(전역) / MedicalClinic·BreadcrumbList·FAQPage(상세) / CollectionPage+ItemList(랜딩).
- **NAP 일관성**: 이름·주소·전화를 화면 ↔ JSON-LD 동일.

체크리스트:
- [ ] 페이지별 `generateMetadata` (title·description·keywords·canonical·OG·geo)
- [ ] 색인 정책(검색 noindex / 랜딩 index) + 자기참조 canonical
- [ ] 구조화 데이터 풀세트 (SEO.md 매트릭스)
- [ ] 시맨틱 랜드마크 + 페이지당 h1 1개 + section `aria-labelledby`
- [ ] 빵부스러기 + 지역·진료과목 내부 링크
- [ ] `sitemap.ts` · `robots.ts` · `llms.txt` (다음 단계)
- [ ] 이미지 `alt` · `next/image`

---

## 관련 문서
- 기획서: [PRD.md](./PRD.md)
- SEO/GEO: [SEO.md](./SEO.md)
- 와이어프레임: [WIREFRAME.md](./WIREFRAME.md)
