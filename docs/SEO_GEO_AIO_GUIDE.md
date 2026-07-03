# 메디로드 페이지 제작 SEO·GEO·AIO 가이드

> 버전: 1.0  
> 작성일: 2026-07-03  
> 적용 대상: 메디로드의 병원 상세, 지역·진료과목 랜딩, 병원 공식 포스팅, 건강 매거진, 검색·지도 결과 페이지  
> 목적: 검색엔진과 AI 기반 검색이 페이지를 정확히 이해할 수 있도록 만들고, 사용자가 신뢰할 수 있는 병원 정보를 제공한다.

---

## 프로젝트 적용 노트 (MediRoad 실제 구조) — 먼저 읽기

이 가이드는 일반 규칙이고, **아래 매핑이 이 코드베이스의 실제 진실**이다. 페이지/SEO 작업 시 가이드 본문과 아래를 함께 본다. 가이드의 예시 URL·파일명과 실제가 다르면 **실제 구조를 따른다.**

### URL 규칙 (가이드 예시 → 실제)
| 가이드 예시 | MediRoad 실제 |
|---|---|
| `/hospitals/{id}-{slug}` | `/hospitals/{slug}` — slug는 **한글**(예: `무이재한방병원`, 동명은 `-강동구` 접미). 비정규 slug 접근 시 canonical로 **301**(`permanentRedirect`) |
| `/hospitals/{sido}/{sigungu}/{specialty}` | 지역 랜딩은 **`/area/{sigungu}`**, 지역×과목은 **`/area/{sigungu}/{department}`** (한글 세그먼트) |
| `/hospitals/{...}/posts/{postSlug}` | `/hospitals/{slug}/posts/{postId}` (postId는 영문 슬러그, 예: `jaram-thermal`) |
| `/magazine/{category}/{postSlug}` | 건강 매거진은 두 갈래 — **건강정보 `/health/{id}`**, **메디브리핑 `/briefing/{id}`** |

### 핵심 파일 위치
- **메타데이터**: 각 `src/app/**/page.tsx`의 `generateMetadata`(서버). 루트 기본값·template·keywords·OG는 `src/app/layout.tsx`
- **robots**: `src/app/robots.ts` (SITE_URL=`https://mediroad.io`, `/admin`·`/search` disallow)
- **사이트맵**: **인덱스 구조** — `src/app/sitemap.xml/route.ts`(= `<sitemapindex>`) + 자식 `src/app/sitemaps/{static,hospitals,posts,content}.xml/route.ts`. XML 빌더는 `src/lib/sitemap-xml.ts`. 대상 병원/포스트는 `getSitemapHospitals`·`getSitemapPosts`(`src/api/hospital.ts`)
- **구조화 데이터(JSON-LD)**: `src/lib/seo/` — `hospital-jsonld.ts`(MedicalClinic·Breadcrumb·FAQ), `hospital-post-jsonld.ts`, `area-jsonld.ts`(CollectionPage·ItemList), column/briefing jsonld, `faq.ts`
- **상수**: `src/constants/site.ts`(SITE_URL·SITE_NAME), `hospital.ts`(MEDICAL_DEPARTMENTS 14), `partners.ts`(제휴), `briefing.ts`·`column.ts`(카테고리)

### 현재 색인/데이터 정책 (실제 반영됨)
- **noindex**: 검색결과 `/hospitals?…`, `/map`, 필터변형(`/health?q=`·`?category=`), 404 상세 — 전부 `follow:true`
- **index**: 홈·병원상세(`seo.noindex` 아니면)·건강정보·메디브리핑·질환·`/area/*`·FAQ
- **사이트맵 색인 전략(중요)**: 신생 도메인이라 **"정예 먼저"** — 현재 hospitals 사이트맵은 **제휴 병원 + 포스트 보유 병원만**. 78k 전량은 도메인 신뢰도↑ 후 청크 추가(`getSitemapHospitals` 확장 + 자식 사이트맵 추가)
- **의료광고법**: 리뷰·평점·전후사진·효과 단정 **금지**(§5-4). 병원 상세에 리뷰 UI 없음이 의도
- **요일 규약**: `hospital_hours.day`는 **E-Gen 1=월…7=일, 8=공휴일**(JS 0-6 아님). SQL은 `extract(isodow)`

### 병원 포스트/브리핑 작성 시
- 테이블: 포스트=`hospital_posts`, 칼럼/브리핑=`columns`(`kind='briefing'|'column'`). **쓰기는 service_role**(시드 스크립트, `scripts/seed-*.cjs`)
- 필드: `summary[]`(TL;DR·GEO 스니펫), `body_md`(마크다운, GFM 표 지원 `src/components/column/markdown.tsx`), `faqs[]`, `refs[]`, `related_departments[]`(MEDICAL_DEPARTMENTS 14개만), `author`, `reviewed_by`(**columns는 NOT NULL**)
- 내부링크: 원고의 "관련 글"은 실제 라우트로 변환해 상호연결(§12)
- 감수자·게시 전 체크: 각 원고 README의 `medical_reviewer`·의료광고 검토 확인

### 관련 기존 문서
`docs/SEO.md`, `docs/HOSPITAL_CONTENT_SEO.md`, `docs/HOSPITAL_POST_GUIDE.md`, `docs/ARCHITECTURE.md` 와 함께 본다.

---

## 0. 이 가이드의 핵심 원칙

이 문서는 단순히 `title`, `description`, `sitemap.xml`을 넣는 방법을 정리한 문서가 아니다. 메디로드처럼 **전국 병원 정보를 다루는 서비스**는 아래 네 가지를 동시에 관리해야 한다.

1. **사용자 가치**: 사용자가 병원 선택·방문·예약 전 확인해야 하는 실제 정보를 빠르게 찾을 수 있어야 한다.
2. **정보 신뢰성**: 병원명, 주소, 연락처, 진료시간, 진료과목, 입원·예약 여부 등은 출처와 확인일이 관리되어야 한다.
3. **검색 기술 품질**: 페이지가 크롤링·렌더링·색인될 수 있고, 중복 URL이 정리되어야 한다.
4. **운영 가능성**: 병원이 수만 곳으로 늘어나도 sitemap, `noindex`, canonical, 데이터 갱신 기준이 무너지지 않아야 한다.

### 한 줄 원칙

> **검색 유입을 위해 페이지를 대량 생성하지 말고, 사용자가 실제로 선택에 활용할 수 있는 정보를 가진 페이지를 체계적으로 색인한다.**

---

## 1. SEO·GEO·AIO를 어떻게 이해할 것인가

### 1-1. SEO의 4개 축

| 구분 | 목적 | 메디로드에서의 예시 |
|---|---|---|
| 콘텐츠 SEO | 사용자의 검색 의도에 답하는 콘텐츠 작성 | “부천 한방병원”, “강남구 피부과 야간진료”, “항암치료 중 식사” |
| 테크니컬 SEO | 크롤링·색인·성능·중복 URL 관리 | SSR, canonical, sitemap, robots, 404/301, 성능 |
| 온서프 SEO | 검색결과에서 페이지 의미를 명확히 보여 주기 | 제목, 설명, OG 이미지, Breadcrumb, JSON-LD |
| 오프페이지 SEO | 외부에서 브랜드·페이지 신뢰를 얻기 | 공식 병원 링크, 인용, 지역 기관·언론·블로그 언급 |

### 1-2. GEO·AIO는 별도 마법이 아니다

GEO(Generative Engine Optimization), AIO(AI Optimization), AEO(Answer Engine Optimization)는 AI 검색·답변 엔진에 정보가 잘 인용되도록 만드는 실무적 표현이다. 그러나 Google은 **AI 검색용 특수 스키마나 특정 문체가 필요하지 않다**고 안내한다.

메디로드에서 GEO/AIO를 위해 해야 할 일은 다음과 같다.

- 첫 문단에서 페이지의 핵심 답을 명확히 제시한다.
- 정보의 출처, 확인일, 작성·검토 주체를 공개한다.
- 병원 데이터와 본문 내용이 서로 모순되지 않게 한다.
- `Hospital`/`MedicalOrganization`, `Article`, `BreadcrumbList` 등 적절한 구조화 데이터를 추가한다.
- AI가 읽기 좋다는 이유로 키워드만 반복하거나, 문장을 잘게 쪼개는 작업은 하지 않는다.
- `llms.txt` 같은 파일은 우선순위가 낮다. Google Search에서는 이를 요구하지 않으며, 가시성이나 순위를 높이는 신호로 보지 않는다.

### 1-3. 페이지 품질 판단 질문

새 페이지를 만들기 전 아래 질문에 모두 “예”라고 답할 수 있어야 한다.

- 이 페이지가 없으면 사용자가 실제로 불편한가?
- 다른 페이지의 문장만 바꾼 수준이 아니라, 이 URL만의 고유 정보가 있는가?
- 정보의 출처와 마지막 확인일을 표시할 수 있는가?
- 페이지 내용이 제목·구조화 데이터·sitemap URL과 일치하는가?
- 검색에서 유입된 사용자가 다음 행동(전화, 길찾기, 비교, 공식 홈페이지 확인)을 할 수 있는가?

---

## 2. 메디로드의 페이지 유형과 기본 색인 정책

### 2-1. 권장 URL 구조

병원명만으로 URL을 만들지 않는다. 병원명 변경, 동명 병원, 지점명 변경에 취약하기 때문이다.

```text
권장
/hospitals/{hospitalId}-{slug}
/hospitals/12345-reum-korean-medicine-hospital-gangdong

지역·진료과목
/hospitals/{sido}/{sigungu}
/hospitals/{sido}/{sigungu}/{specialty}
/hospitals/seoul/gangnam-gu/dermatology

병원 공식 포스팅
/hospitals/{hospitalId}-{slug}/posts/{postSlug}

건강 매거진
/magazine/{category}/{postSlug}
```

### 2-2. 페이지별 기본 정책

| 페이지 유형 | 기본 색인 | sitemap 포함 | 핵심 목적 |
|---|---:|---:|---|
| 메인·서비스 소개 | index | 포함 | 브랜드와 서비스 이해 |
| 병원 상세 | 정보 품질 충족 시 index | 포함 | 병원 선택에 필요한 핵심 정보 |
| 지역 페이지 | 실제 검색 수요와 고유 정보가 있을 때 index | 포함 | “지역 + 병원/진료과목” 탐색 |
| 진료과목 페이지 | 실제 목록·설명·FAQ가 있을 때 index | 포함 | 진료과목 탐색 |
| 병원 공식 포스팅 | 검수·출처·작성일이 있을 때 index | 포함 | 병원별 전문 안내 |
| 건강 매거진 | 의료 검토·근거·수정일이 있을 때 index | 포함 | 정보성 검색 유입 |
| 지도 반경/정렬/필터 조합 | noindex, follow 권장 | 제외 | 서비스 내 탐색 |
| 빈 검색 결과 | noindex | 제외 | 얇은 콘텐츠 방지 |
| 로그인·마이페이지·관리자 | noindex 또는 접근 제어 | 제외 | 개인정보·운영 영역 보호 |
| 광고 캠페인 랜딩 | 원칙적으로 noindex | 제외 | 유료 캠페인 전용 |

---

## 3. 병원 상세페이지: 메디로드의 가장 중요한 SEO 자산

### 3-1. 병원 상세페이지가 색인되기 위한 최소 데이터

아래 항목이 모두 있으면 `seoIndexable = true` 후보로 본다.

- 병원 고유 ID
- 정식 병원명과 지점명
- 도로명 주소 또는 확인 가능한 주소
- 위도·경도
- 대표 전화번호 또는 공식 연결 수단
- 진료과목 또는 기관 유형
- 운영 상태: 운영 중 / 휴업 / 폐업 / 확인 필요
- 데이터 출처
- 마지막 확인일
- canonical URL
- 중복 여부 판정 결과

아래 중 **2개 이상**이 추가되면 상세페이지 품질이 더 높아진다.

- 진료시간·휴무일
- 예약·주차·입원·야간진료 등 편의 정보
- 대중교통·건물·층수 등 방문 정보
- 공식 홈페이지 또는 공식 채널
- 병원 사진 또는 공식 제공 이미지
- 병원 공식 포스팅
- 사용자에게 설명 가능한 진료 특징
- 운영 정보 변경 이력

### 3-2. 상세페이지의 권장 정보 구조

```text
H1: {병원명} {지점명} | {지역} {기관유형}

1. 한눈에 보는 병원 정보
   - 주소 / 전화 / 진료과목 / 운영 상태 / 마지막 확인일

2. 위치와 방문 정보
   - 지도 / 대중교통 / 주차 / 건물·층 정보

3. 진료시간 및 휴무 안내
   - 요일별 시간 / 점심시간 / 공휴일 진료 여부 / 정보 출처

4. 진료과목 및 제공 정보
   - 실제 확인된 진료과목만 표시

5. 병원 공식 안내·포스팅
   - 병원이 작성하거나 확인한 콘텐츠 연결

6. 주변에서 함께 찾는 병원
   - 단순 자동 추천이 아니라, 지역·진료과목 기준을 공개

7. 자주 묻는 질문
   - 예약 여부, 주차, 운영시간 확인 방법 등 실제 사용 질문

8. 정보 출처 및 수정 이력
   - 데이터 출처 / 마지막 확인일 / 정정 요청 경로
```

### 3-3. 상세페이지에서 피해야 할 것

- 모든 병원에 똑같은 500자 소개문을 자동 생성하는 방식
- 실제 확인되지 않은 “전문”, “유명”, “잘하는”, “최고”, “추천” 표현
- 후기·평점이 없는데 평점처럼 보이게 설계하는 방식
- 병원명을 바꾸거나 주소가 다른 중복 상세페이지를 동시에 색인하는 방식
- 사용자에게 보이지 않는 정보를 JSON-LD에만 넣는 방식
- 사라진 병원을 200 상태 코드로 계속 노출하는 방식

### 3-4. 병원 데이터 품질 상태값

```ts
export type SeoIndexStatus =
  | 'INDEXABLE'       // 정보 품질 기준 충족
  | 'NOINDEX_PENDING' // 정보 보완 대기
  | 'NOINDEX_DUPLICATE'
  | 'NOINDEX_CLOSED'
  | 'NOINDEX_PRIVATE'
```

권장 운영 규칙:

```ts
const shouldIndexHospital =
  hospital.status === 'ACTIVE' &&
  hospital.name &&
  hospital.address &&
  hospital.latitude &&
  hospital.longitude &&
  hospital.category &&
  hospital.canonicalUrl &&
  hospital.sourceUrl &&
  !hospital.isDuplicate &&
  hospital.lastVerifiedAt
```

---

## 4. 지역·진료과목 랜딩페이지 설계

### 4-1. 색인할 조합은 제한한다

아래처럼 필터가 무한히 조합되는 URL을 모두 색인하면 안 된다.

```text
/hospitals?region=seoul&sort=distance
/hospitals?openNow=true
/hospitals?specialty=dermatology&parking=true
/hospitals?lat=37.5&lng=127.0&radius=3
```

대신 실제 검색 수요가 있고, 지속적으로 관리할 수 있는 대표 조합만 고정 URL로 만든다.

```text
/hospitals/seoul
/hospitals/seoul/gangnam-gu
/hospitals/seoul/gangnam-gu/dermatology
/hospitals/gyeonggi/bucheon-si/korean-medicine
```

### 4-2. 랜딩페이지 최소 구성

단순 병원 카드 리스트만 있는 페이지는 색인 품질이 낮을 수 있다. 아래를 포함한다.

1. **첫 문단 요약**: 이 지역·진료과목에서 무엇을 찾을 수 있는지 2~4문장으로 설명
2. **목록 기준**: 거리, 행정구역, 진료과목, 운영 정보 등 정렬·선정 기준 설명
3. **실제 병원 목록**: 빈 카드가 아닌 병원명·주소·대표 정보 제공
4. **지역 방문 정보**: 역, 주요 도로, 주차 등 실제 탐색에 도움 되는 정보
5. **FAQ**: 야간진료, 공휴일 진료, 예약 확인 방법 등
6. **관련 내부링크**: 인접 지역·연관 진료과목·매거진 콘텐츠
7. **업데이트 표기**: “병원 정보는 변동될 수 있으며, 최종 확인은 병원에 문의”

### 4-3. 페이지 생성 기준 예시

```text
색인 허용 후보
- “강남구 피부과”처럼 명확한 지역·진료과목 조합
- 목록이 충분하고 실제로 다른 지역 페이지와 구분되는 경우
- 소개 문단, FAQ, 내부링크, 최신 확인일을 운영할 수 있는 경우

색인 보류 후보
- 결과가 0~2개뿐인 좁은 조합
- 주소만 바뀐 유사한 지역 페이지
- 정렬·반경·영업중 필터만 다른 페이지
- 페이지마다 자동 생성 문구만 다른 경우
```

---

## 5. 병원 공식 포스팅과 건강 매거진의 콘텐츠 기준

### 5-1. 두 콘텐츠를 구분한다

| 구분 | 병원 공식 포스팅 | 건강 매거진 |
|---|---|---|
| 주체 | 개별 병원 | 메디로드 편집팀 또는 검토 의료진 |
| 목적 | 병원 운영 정보·공식 안내 | 질환·증상·방문 전 확인사항의 일반 정보 |
| 예시 | “추석 연휴 진료일정 안내”, “입원 상담 안내” | “항암치료 중 식사에서 확인할 점” |
| 필수 표기 | 병원명, 작성·수정일, 공식 출처 | 작성자, 검토자, 근거 출처, 수정일 |
| 주의 | 과장 의료광고 금지 | 치료 조언·개별 처방처럼 보이지 않게 작성 |

### 5-2. 좋은 콘텐츠의 기본 순서

```text
H1: 사용자의 질문을 그대로 반영한 제목

첫 문단: 결론 또는 핵심 안내 2~4문장

H2: 이 글이 답하는 질문
H2: 실제로 확인해야 할 정보
H2: 상황별 차이 또는 예외
H2: 병원 방문·상담 전 준비사항
H2: 자주 묻는 질문
H2: 참고 출처·작성자·검토자·수정일
```

### 5-3. 의료·건강 정보 콘텐츠의 신뢰성 요소

건강·의료 주제는 잘못된 정보가 사용자에게 직접적인 위해를 줄 수 있다. 따라서 아래 요소를 기본으로 둔다.

- 작성자와 검토자 이름·직함·역할 표시
- 근거 자료, 공공기관 자료, 진료지침, 공식 의료기관 자료 링크
- 게시일과 최종 수정일
- 근거가 부족한 부분은 단정하지 않고 “상담이 필요할 수 있습니다”처럼 한계를 표시
- 응급 증상 또는 위험 신호는 명확히 분리
- 병원 자체 서비스 소개와 일반 의학 정보를 섞지 않기
- 모든 치료 설명은 실제 운영·허가·의료진 판단 범위 내에서만 작성

### 5-4. 의료광고 안전선

다음 표현은 확인·검토 없이 사용하지 않는다.

```text
완치 / 재발 방지 / 부작용 완화 보장 / 최고의 치료 / 유일한 방법
잘하는 병원 / 효과가 입증된 병원 / 반드시 좋아집니다
전후 사진으로 효과 보장 / 환자 후기만으로 치료 효과 암시
```

대신 아래처럼 사실 중심으로 작성한다.

```text
- {치료실/장비/상담 프로그램}을 운영합니다.
- 적용 여부는 환자 상태와 의료진 판단에 따라 달라질 수 있습니다.
- 진료 내용은 개인의 치료 경과와 기존 치료 계획을 고려해 안내합니다.
- 자세한 진료 가능 여부는 상담을 통해 확인할 수 있습니다.
```

---

## 6. 제목, 메타 설명, H1, OG 이미지 작성 규칙

### 6-1. 제목(title)과 H1은 역할이 다르다

- `title`: 검색결과·브라우저 탭에서 보이는 대표 문구
- `H1`: 페이지 안에서 사용자가 확인하는 최상위 제목
- 둘은 의미가 일치해야 하지만 완전히 동일할 필요는 없다.

### 6-2. 제목 작성 템플릿

```text
병원 상세
{병원명} {지점명} | 주소·진료시간·진료과목 | 메디로드

지역 랜딩
{지역} {진료과목} 찾기 | 진료시간·위치 확인 | 메디로드

병원 공식 포스팅
{핵심 안내 주제} | {병원명} 공식 안내

건강 매거진
{증상/상황}에서 확인할 점 | {정보 목적이 드러나는 부제}
```

### 6-3. 메타 설명 작성 규칙

- 페이지에 실제로 있는 정보만 요약한다.
- 병원 상세는 주소·진료과목·시간·확인일 등 핵심 사실을 넣는다.
- 지역 랜딩은 지역·진료과목·목록 제공 기준을 넣는다.
- 매거진은 “누가, 어떤 상황에서, 무엇을 확인해야 하는지”를 담는다.
- 모든 페이지가 같은 설명을 쓰지 않도록 한다.

### 6-4. OG 이미지

공유 이미지에는 다음 정보만 명확하게 보여 준다.

- 병원 상세: 병원명, 지역, 핵심 정보 1개
- 지역 랜딩: 지역명, 진료과목, 메디로드 브랜드
- 매거진: 질문형 제목, 카테고리, 작성/수정일은 작게

이미지에 작은 글자를 과도하게 넣지 않는다. OG 이미지는 검색 순위용 이미지가 아니라 공유 문맥을 명확히 하는 자산이다.

---

## 7. 기술 SEO: 반드시 통일해야 하는 규칙

### 7-1. 서버에서 읽을 수 있는 핵심 콘텐츠

병원명, 주소, 진료시간, 핵심 설명, 본문, 내부링크 등 페이지의 중요한 텍스트는 초기 HTML 또는 안정적인 서버 렌더링 결과에서 확인할 수 있어야 한다.

- 지도, 정렬, 북마크, 후기 작성 등 상호작용은 클라이언트 컴포넌트여도 된다.
- 검색엔진이 읽어야 할 본문까지 로딩 스피너 뒤에 숨기지 않는다.
- 404 병원은 404 상태 코드로 반환한다.
- 폐업·통합된 병원은 상황에 따라 410 또는 대체 병원 페이지로 301을 검토한다.

### 7-2. canonical 정책

동일하거나 거의 같은 내용이 여러 URL에서 열릴 수 있으면 대표 URL을 하나로 정한다.

```text
대표 URL
/hospitals/12345-reum-korean-medicine-hospital-gangdong

중복 가능 URL
/hospital/reum-korean-medicine-hospital-gangdong
/hospitals/12345-reum-korean-medicine-hospital-gangdong?utm_source=naver
/hospitals/12345-reum-korean-medicine-hospital-gangdong?tab=info
```

필수 규칙:

1. 대표 URL은 self-canonical을 가진다.
2. 내부링크는 항상 대표 URL로 연결한다.
3. sitemap에는 대표 URL만 넣는다.
4. 이전 URL은 가능한 한 1:1로 301 리디렉션한다.
5. trailing slash, 대소문자, `www`, HTTP/HTTPS 규칙을 하나로 통일한다.

### 7-3. robots.txt와 noindex의 역할 구분

- `robots.txt`: 크롤러가 불필요한 경로를 과도하게 요청하지 않도록 관리하는 용도
- `noindex`: 검색결과에 페이지를 표시하지 않도록 하는 용도
- 로그인·개인정보·관리자 영역: robots만 믿지 말고 접근 제어를 적용

```text
robots.txt 예시

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /my/
Disallow: /search/
Disallow: /auth/
Sitemap: https://www.mediroad.example/sitemap.xml
```

> 주의: `robots.txt`로 막은 URL도 외부 링크 등으로 인해 검색결과에 URL만 노출될 수 있다. 검색결과 제외가 목적이면 `noindex` 또는 접근 제어를 사용한다.

### 7-4. HTTP 상태 코드 원칙

| 상황 | 권장 상태 코드 |
|---|---|
| 정상 공개 페이지 | 200 |
| URL이 새 URL로 영구 이동 | 301 |
| 일시적 점검·임시 이동 | 302 또는 307 |
| 존재하지 않는 병원·게시글 | 404 |
| 의도적으로 영구 삭제 | 410 검토 |
| 로그인 필요 | 401/403 또는 로그인 흐름 |
| 서버 오류 | 5xx를 정상 페이지처럼 숨기지 말고 모니터링 |

---

## 8. sitemap 운영 가이드

### 8-1. sitemap에 넣을 URL

sitemap에는 아래 조건을 동시에 충족하는 **canonical URL**만 넣는다.

- 200 응답
- `index, follow`
- self-canonical 또는 정식 canonical 지정
- robots로 차단되지 않음
- 사용자에게 실제로 공개되는 페이지
- 정보 품질 기준 충족

### 8-2. 추천 sitemap 구조

```text
/sitemap.xml                    # sitemap index
/sitemaps/static.xml            # 메인, 서비스, 정책 등
/sitemaps/regions.xml           # 지역·진료과목 랜딩
/sitemaps/hospitals-01.xml      # 병원 상세 1
/sitemaps/hospitals-02.xml      # 병원 상세 2
/sitemaps/hospital-posts.xml    # 병원 공식 포스팅
/sitemaps/magazine.xml          # 건강 매거진
```

- sitemap 한 개는 최대 **50,000개 URL 또는 50MB(압축 해제 기준)**를 넘지 않게 한다.
- 운영 편의를 위해 병원 상세 sitemap은 파일당 10,000~20,000 URL 정도로 나누는 것을 권장한다.
- sitemap 파일을 분리하면 Search Console에서 유형별 색인·오류를 더 쉽게 추적할 수 있다.

### 8-3. `lastmod` 운영 원칙

다음처럼 검색 가치가 있는 정보가 변경되었을 때만 `lastmod`를 갱신한다.

- 병원명, 주소, 전화번호 변경
- 운영 상태 변경
- 진료시간·휴무일 변경
- 진료과목 변경
- 공식 포스팅·사진·방문 정보 추가
- 기사 본문에서 실질적인 내용 수정

단순 크롤링 시간이나 DB 배치 수행 시간으로 모든 URL의 `lastmod`를 오늘 날짜로 바꾸지 않는다.

### 8-4. sitemap에서 제외할 URL

```text
- ?sort=distance, ?page=2, ?openNow=true 같은 필터·정렬 URL
- 로그인·회원·관리자 영역
- 중복 병원 상세
- 빈 검색 결과
- noindex 페이지
- 404/410 페이지
- 임시 프리뷰·캠페인 페이지
```

---

## 9. 구조화 데이터(JSON-LD) 원칙

### 9-1. 구조화 데이터의 역할

구조화 데이터는 검색엔진에게 “이 페이지가 어떤 유형의 정보인지”를 명확히 알려준다. 다만 리치 결과 노출을 보장하지 않으며, 사용자에게 보이지 않는 내용을 넣으면 안 된다.

### 9-2. 페이지별 권장 타입

| 페이지 | 권장 타입 | 비고 |
|---|---|---|
| 메인 | `Organization`, `WebSite` | 브랜드·로고·공식 URL 정리 |
| 병원 상세 | `Hospital` 또는 `MedicalOrganization` | Google 리치 결과 보장용이 아니라 엔터티 이해용 |
| 지역·진료과목 목록 | `ItemList`, `BreadcrumbList` | 실제 목록과 순서가 화면에 보여야 함 |
| 병원 공식 포스팅 | `Article`, `BreadcrumbList` | 작성자·수정일·대표 이미지 일치 |
| 건강 매거진 | `Article`, `BreadcrumbList` | 작성자·검토자·출처 정보 강화 |
| 모든 하위 페이지 | `BreadcrumbList` | 사용자의 현재 위치와 URL 구조 명확화 |

### 9-3. FAQ 구조화 데이터 정책

FAQ 콘텐츠는 유지한다. 사용자가 읽기 좋고, AI 검색에서도 질문과 답을 이해하는 데 도움이 될 수 있기 때문이다.

다만 **Google은 2026년 5월 7일부터 FAQ 리치 결과를 더 이상 표시하지 않으며, 2026년 6월 관련 문서를 제거했다.** 따라서 `FAQPage`를 “검색결과 확장 노출”을 노리고 구현하는 것은 우선순위가 낮다.

### 9-4. 병원 상세 JSON-LD 예시

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Hospital',
  name: hospital.name,
  url: canonicalUrl,
  telephone: hospital.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: hospital.roadAddress,
    addressLocality: hospital.sigungu,
    addressRegion: hospital.sido,
    addressCountry: 'KR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: hospital.latitude,
    longitude: hospital.longitude,
  },
  medicalSpecialty: hospital.specialties,
}

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  }}
/>
```

구현 규칙:

- JSON-LD의 값은 화면에서 확인 가능한 정보와 일치해야 한다.
- `aggregateRating`, `review`는 실제 정책·수집 근거가 있을 때만 사용한다.
- 가짜 후기, 자체 평점, 확인되지 않은 진료 특징을 구조화 데이터에 넣지 않는다.
- 배포 전 Rich Results Test 또는 Schema Markup Validator로 검증한다.

---

## 10. Next.js App Router 구현 기준

### 10-1. 메타데이터는 서버 컴포넌트에서 생성

```tsx
import type { Metadata } from 'next'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hospital = await getHospital(params.slug)
  const canonical = `https://www.mediroad.example/hospitals/${hospital.id}-${hospital.slug}`

  return {
    title: `${hospital.name} | 주소·진료시간·진료과목 | 메디로드`,
    description: `${hospital.name}의 주소, 대표전화, 진료시간, 진료과목과 방문 정보를 확인하세요. 정보 확인일: ${hospital.lastVerifiedAt}.`,
    alternates: { canonical },
    robots: hospital.seoIndexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: 'website',
      title: `${hospital.name} | 메디로드`,
      description: `${hospital.roadAddress} · ${hospital.category}`,
      url: canonical,
    },
  }
}
```

### 10-2. `robots.ts` 예시

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/my/', '/auth/', '/search/'],
    },
    sitemap: 'https://www.mediroad.example/sitemap.xml',
  }
}
```

### 10-3. `sitemap.ts` 구현 원칙

- 소규모 정적 URL은 `app/sitemap.ts`에서 생성한다.
- 병원 데이터가 많아지면 sitemap을 유형·지역·번호 단위로 분할한다.
- sitemap 생성 쿼리는 `seoIndexable = true` 상태의 canonical URL만 가져온다.
- 병원 운영 상태가 폐업·중복으로 바뀌면 sitemap에서 즉시 제외한다.

### 10-4. 파일 구조 예시

```text
app/
  layout.tsx
  robots.ts
  sitemap.ts
  hospitals/
    [hospitalIdSlug]/
      page.tsx
      opengraph-image.tsx
      posts/
        [postSlug]/
          page.tsx
  magazine/
    [category]/
      [postSlug]/
        page.tsx
  hospitals/
    [sido]/
      [sigungu]/
        [specialty]/
          page.tsx
```

---

## 11. 성능·모바일·접근성 체크

### 11-1. Core Web Vitals 목표

실사용자 데이터의 75백분위 기준으로 아래를 목표로 한다.

| 지표 | 권장 목표 | 실무 의미 |
|---|---:|---|
| LCP | 2.5초 이하 | 메인 콘텐츠가 빨리 보이는가 |
| INP | 200ms 이하 | 버튼·필터·탭이 빠르게 반응하는가 |
| CLS | 0.1 이하 | 화면이 로딩 중 갑자기 흔들리지 않는가 |

### 11-2. 메디로드에서 특히 주의할 요소

- 지도 SDK, 광고 스크립트, 채팅 위젯은 본문 렌더링을 막지 않도록 지연 로드한다.
- 병원 대표 이미지는 넓이·높이를 미리 지정해 CLS를 막는다.
- 지도는 최초 화면에서 핵심 텍스트를 가리지 않게 한다.
- 필터·정렬·무한 스크롤은 검색을 위한 페이지가 아니라 서비스 탐색 경험으로 설계한다.
- 버튼과 링크는 텍스트 또는 접근 가능한 이름을 가져야 한다.
- 이미지 대체 텍스트는 “병원 사진”이 아니라 실제 장면·용도를 설명한다.

---

## 12. 내부링크 설계

### 12-1. 기본 규칙

- 링크는 실제로 관련 있는 페이지끼리 연결한다.
- 앵커 텍스트에 “여기”, “더보기”만 반복하지 않는다.
- 병원 상세는 지역·진료과목·공식 포스팅으로 연결한다.
- 매거진은 관련 병원 광고로 바로 몰아넣기보다, 의료 정보와 지역 탐색을 분리해 자연스럽게 연결한다.

### 12-2. 권장 연결 구조

```text
지역·진료과목 랜딩
  → 병원 상세
  → 병원 공식 포스팅
  → 관련 건강 매거진

건강 매거진
  → 관련 진료과목 탐색 페이지
  → 지역별 병원 찾기
  → 참고 자료·작성자 페이지

병원 상세
  → 같은 지역의 관련 기관유형
  → 병원 공식 포스팅
  → 주소·진료시간 정정 요청
```

---

## 13. 페이지 발행 전 체크리스트

### 13-1. 콘텐츠 체크

- [ ] H1이 페이지의 실제 목적을 말하는가?
- [ ] 첫 문단만 읽어도 핵심 내용을 이해할 수 있는가?
- [ ] 다른 페이지와 구분되는 고유 정보가 있는가?
- [ ] 병원명, 주소, 전화번호, 진료시간, 진료과목이 사실과 일치하는가?
- [ ] 출처와 마지막 확인일이 표시되는가?
- [ ] 건강 콘텐츠에 작성자·검토자·참고자료가 있는가?
- [ ] 의료광고상 과장·보장·우월 표현이 없는가?

### 13-2. 기술 체크

- [ ] URL이 짧고 안정적이며 병원 고유 ID를 포함하는가?
- [ ] canonical이 대표 URL과 일치하는가?
- [ ] `title`, `description`, OG 정보가 고유한가?
- [ ] index/noindex 정책이 맞는가?
- [ ] 200/301/404 상태 코드가 의도대로 동작하는가?
- [ ] JSON-LD가 화면 정보와 일치하는가?
- [ ] 이미지의 크기와 alt가 적절한가?
- [ ] 모바일에서 본문·버튼·지도·표가 깨지지 않는가?

### 13-3. 색인 체크

- [ ] index 대상이면 sitemap에 포함되었는가?
- [ ] noindex 대상이면 sitemap에서 제외되었는가?
- [ ] robots로 중요한 CSS/JS/이미지를 막지 않았는가?
- [ ] Search Console URL 검사에서 페이지가 정상 렌더링되는가?
- [ ] 네이버 서치어드바이저에서 robots·sitemap을 확인했는가?

---

## 14. 발행 후 운영 지표

### 14-1. Google Search Console

| 지표 | 확인할 질문 | 개선 방향 |
|---|---|---|
| 노출수 | 어떤 검색어에서 보이는가? | 제목·콘텐츠 의도 점검 |
| 클릭수·CTR | 보이지만 클릭되지 않는가? | title·description·검색 의도 수정 |
| 평균 게재순위 | 특정 주제에서 낮은가? | 콘텐츠 깊이·내부링크·중복 점검 |
| 색인 상태 | 제외 사유는 무엇인가? | noindex, canonical, robots, 404 점검 |
| Core Web Vitals | 모바일 사용자 경험이 나쁜가? | 지도·스크립트·이미지 최적화 |

### 14-2. 네이버 서치어드바이저

- 사이트 소유 확인
- sitemap 제출
- robots.txt 수집·검증
- 수집·색인 현황 확인
- 제목·설명·대표 URL·응답 코드 확인

### 14-3. 월간 운영 루틴

```text
매주
- 오류 URL, 404, 서버 오류, sitemap 생성 실패 확인
- 새 병원·폐업 병원·중복 병원 상태 반영

매월
- 상위 유입 쿼리와 랜딩페이지 분석
- noindex → index 승격 후보 검토
- 오래된 병원 정보·영업시간 재확인
- 콘텐츠 업데이트 후보 선정

분기별
- sitemap 구조·색인률·중복 URL 점검
- 지역·진료과목 랜딩의 실제 검색 수요 재평가
- Core Web Vitals 개선 작업
- 의료 콘텐츠 검토자·근거 출처 갱신
```

---

## 15. 하지 말아야 할 SEO·GEO 작업

- 검색량이 있어 보인다는 이유만으로 지역×진료과목×필터 조합을 무제한 생성
- 병원마다 단어만 바꾼 AI 소개문 배포
- 없는 후기·평점·전문성·장비·진료과목을 넣기
- `robots.txt`를 `noindex` 대체 수단으로 사용
- URL 변경 후 301 없이 기존 페이지 삭제
- 모든 페이지의 `lastmod`를 배치 실행 시간으로 매일 갱신
- FAQ 스키마만 넣으면 검색결과가 확장된다고 기대
- AI 검색을 위해 키워드를 부자연스럽게 반복
- `llms.txt`부터 만들고 본문·출처·데이터 품질을 뒤로 미루기
- 메타태그만 바꾸고 실제 본문은 빈 카드·로딩 UI로 남기기

---

## 16. 신규 페이지 작업용 브리프 템플릿

아래 블록을 새 페이지 작업 티켓 또는 MD 파일 맨 위에 복사해 사용한다.

```md
---
page_type: hospital_detail | regional_landing | hospital_post | magazine
url: /
canonical_url: /
index_policy: index | noindex
sitemap_group: static | regions | hospitals | hospital_posts | magazine
primary_query: 
secondary_queries:
  - 
user_intent: 
source_of_truth:
  - 
last_verified_at: YYYY-MM-DD
content_owner: 
medical_reviewer: 
structured_data:
  - BreadcrumbList
  - 
internal_links_in:
  - 
internal_links_out:
  - 
---

# H1

## 한 줄 요약

## 사용자가 가장 궁금해하는 내용

## 핵심 정보

## 확인 방법 또는 상담 전 준비사항

## FAQ

## 정보 출처 및 수정 이력
```

---

## 17. 참고 자료

### 원문 참고

- [프론트엔드 개발자가 알아야 할 SEO — 쿠키의 주저리](https://insengnewbie.tistory.com/635)

### 공식 문서

- [Google Search Central — SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google Search Central — Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google Search Central — Canonical URL 지정](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google Search Central — robots.txt 가이드](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Google Search Central — 구조화 데이터 기본 가이드](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Google Search Central — 생성형 AI 검색 최적화 가이드](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google Search Central — FAQ rich result 종료 관련 업데이트](https://developers.google.com/search/updates#removing-faq-rich-result)
- [NAVER Search Advisor — 웹 사이트를 만들 때](https://searchadvisor.naver.com/guide/seo-basic-create)
- [NAVER Search Advisor — robots.txt 설정하기](https://searchadvisor.naver.com/guide/seo-basic-robots)
- [Next.js — Metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Next.js — robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js — sitemap.xml](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js — JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
- [web.dev — Core Web Vitals](https://web.dev/articles/vitals)

> 운영 원칙: 검색엔진 권장사항과 Next.js 기능은 바뀔 수 있으므로, 이 문서는 분기별로 공식 문서를 기준으로 갱신한다.
