# MediRoad SEO / GEO 사양

> 사이트 전역 SEO/GEO 설계. (페이지별 메타태그·키워드는 [WIREFRAME.md](./WIREFRAME.md) 상세 섹션 참고)
> GEO = 통합: **① 생성형 엔진 최적화** + **② 지역 로컬 SEO**.

---

## 1. 색인 전략 (Indexing Strategy)

### 1-1. 라우트별 색인 정책

| 라우트 | 색인 | canonical | 비고 |
|---|---|---|---|
| `/` | ✅ index | self | 홈 |
| `/hospitals` (필터 없음) | ✅ index | self | 전체 목록 진입 |
| `/hospitals?q=…&department=…` | 🚫 **noindex, follow** | → 해당 지역/과목 **랜딩** 또는 `/hospitals` | 필터 조합은 무한 생성 → 중복·얇은 콘텐츠 방지 |
| `/area/[region]` | ✅ index | self | 지역 랜딩(고유 콘텐츠) |
| `/area/[region]/[department]` | ✅ index | self | 지역×과목 랜딩 |
| `/hospitals/[id]` | ✅ index | self | 병원 상세 |
| `/health` (필터 없음) | ✅ index | self | 건강 칼럼 전체 목록 |
| `/health/[id]` | ✅ index (게시중만) | self | 건강 칼럼 상세 — **핵심 색인 페이지**. 임시저장·숨김=noindex |
| `/health?q=…`·`?category=…` 변형 | 🚫 **noindex, follow** | → `/health` | 칼럼 검색·**카테고리 필터**(쿼리)는 색인 제외 |
| `/admin/**` (관리자) | 🚫 **noindex, nofollow** | — | 인증 필요 · `robots.ts` `Disallow:/admin` |
| `not-found` / 빈 검색결과 | 🚫 noindex | — | soft-404 방지 |

### 1-2. 핵심 원칙
- **검색 결과(`/hospitals?…`)는 색인하지 않는다.** 사용자 탐색용. `follow`는 유지해 링크 전파.
- **색인은 "랜딩 페이지"가 담당.** 검색 수요가 확실한 조합만 **큐레이션**해 고유 콘텐츠 페이지로 생성(아래 2).
- 빈 결과·존재하지 않는 병원 → `noindex` (얇은/soft-404 페이지 색인 차단).
- 모든 색인 페이지는 **자기참조 canonical**. 파라미터/정렬 변형은 canonical로 대표 URL 지정.

```ts
// 검색 페이지 generateMetadata
return { robots: { index: false, follow: true },
         alternates: { canonical: "https://mediroad.kr/hospitals" } };
```

---

## 2. 지역·진료과목 랜딩 페이지 (로컬 SEO 핵심)

검색 쿼리(noindex) 대신 **색인 가능한 정식 랜딩**으로 "강남구 정형외과" 류 검색 수요를 흡수.

### 2-1. 라우트
```
/area/[region]                예) /area/강남구          → "강남구 병원"
/area/[region]/[department]   예) /area/강남구/정형외과   → "강남구 정형외과"
```
- **큐레이션·유한 생성**: `generateStaticParams`로 (실수요 있는 지역 × 주요 과목) 조합만 SSG.
  → 무한 thin page 방지. 조합 화이트리스트는 `constants`로 관리.

### 2-2. 랜딩 콘텐츠 (얇지 않게 — 고유성 확보)
```
<main>
 <header> <h1>강남구 정형외과</h1>  지역×과목 고유 소개문(1~2문단) </header>
 <section> 병원 목록(ol) — HospitalCard 재사용 (SSR)           </section>
 <section> ## 강남구 정형외과 자주 묻는 질문 (지역 특화 FAQ)     </section>
 <nav> 인접 지역/과목 내부링크 (강남구 신경외과 · 서초구 정형외과) </nav>
</main>
```
- 구조화 데이터: `CollectionPage` + `ItemList`(병원) + `BreadcrumbList`(홈›지역›과목).
- 메타: `title = "{지역} {과목} 병원 | MediRoad"`, geo 메타(지역 중심 좌표).

### 2-3. URL / 식별자 정책 (확정)
- **상세 페이지 = 짧은 고유 ID** (병원·칼럼 공통): `/hospitals/[id]` · `/health/[id]`.
  - `id` = nanoid/base62 ~8–12자(또는 숫자). 풀 UUID(36자)는 길어 지양.
  - id 불변 → 공개 URL·내부 PK·편집 라우트 동일. **별도 slug·중복검사·301 불필요**.
  - 근거: URL 슬러그는 약한 랭킹 신호. 키워드 랭킹은 title·h1·본문·JSON-LD가 담당. (강남언니·모두닥·네이버블로그·브런치도 ID URL)
- **키워드는 랜딩 경로가 담당**: `/area/강남구/정형외과` 처럼 **지역/과목 세그먼트는 키워드**(한글 또는 영문). 상세는 랜딩에서 내부링크로 연결.
- 소문자·트레일링슬래시 일관성 고정.

---

## 3. 구조화 데이터 풀세트 (JSON-LD)

### 3-1. 페이지별 적용 매트릭스

| 스키마 | 홈 `/` | 검색/랜딩 | 병원 상세 | 칼럼 목록 | 칼럼 상세 |
|---|:--:|:--:|:--:|:--:|:--:|
| `WebSite` + `SearchAction` | ✅ | | | | |
| `Organization` | ✅ | | | | |
| `BreadcrumbList` | | ✅(랜딩) | ✅ | ✅ | ✅ |
| `CollectionPage` + `ItemList` | | ✅ | | ✅ | |
| `MedicalClinic`(보강) | | | ✅ | | |
| `MedicalWebPage` + `Article` | | | | | ✅ |
| `FAQPage` | | ✅(랜딩 FAQ) | ✅ | | ✅ |

### 3-2. 사이트 전역 (root layout)

**WebSite + SearchAction** — 구글 sitelinks 검색창:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "MediRoad",
  "url": "https://mediroad.kr",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://mediroad.kr/hospitals?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**Organization** — 브랜드 엔티티("메디로드란?"을 검색·AI가 인식):
```jsonc
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MediRoad",
  "alternateName": "메디로드",
  "url": "https://mediroad.kr",
  "logo": "https://mediroad.kr/logo.png",
  "description": "전국 병원·한의원·한방병원을 지도로 찾는 의료 지도 플랫폼. 위치·진료과목·진료시간·리뷰를 한눈에.",  // ← 엔티티 정의(홈 소개와 동일)
  "areaServed": { "@type": "Country", "name": "KR" },     // ← 서비스 지역
  "knowsAbout": ["병원 검색", "진료과목", "지역 의료", "건강 정보"],
  "sameAs": ["https://www.instagram.com/…", "https://blog.naver.com/…"]
}
```
> 홈 "메디로드는?" 섹션 텍스트 = 이 `description`과 **동일하게** → 검색·생성형 엔진이 일관된 브랜드 정의 인식.

### 3-3. 상세 — `MedicalClinic` 보강

현재 와이어프레임의 `MedicalClinic`에 다음을 **추가**한다(누락분):
```jsonc
{
  "@type": "MedicalClinic",
  "name": "서울정형외과의원",
  "description": "<병원 소개글>",                // ← 병원 소개 연동
  "url": "https://mediroad.kr/hospitals/h3Kf9aQ2",
  "telephone": "+82-2-123-4567",
  "image": ["…photo1.jpg", "…photo2.jpg"],       // ← 사진 (누락분)
  "address": {                                    // ← 전체 주소 구조화
    "@type": "PostalAddress",
    "streetAddress": "테헤란로 201",
    "addressLocality": "강남구",
    "addressRegion": "서울",
    "postalCode": "06236",
    "addressCountry": "KR"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 37.5006, "longitude": 127.0366 },
  "hasMap": "https://map.naver.com/…",            // ← 지도 링크 (누락분)
  "medicalSpecialty": ["Orthopedic", "정형외과"],
  "openingHoursSpecification": [                   // ← 진료시간 (누락분)
    { "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "09:00", "closes": "18:00" },
    { "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday", "opens": "09:00", "closes": "13:00" }
  ],
  "aggregateRating": {                             // ← 평점 (누락분)
    "@type": "AggregateRating", "ratingValue": 4.5, "reviewCount": 213
  }
}
```
> ⚠️ **NAP 일관성**: name·address·telephone은 JSON-LD ↔ 화면(h1·aside)에서 **완전히 동일**해야 한다(로컬 SEO 핵심 신호).

### 3-4. BreadcrumbList (상세·랜딩)
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type":"ListItem","position":1,"name":"홈","item":"https://mediroad.kr" },
    { "@type":"ListItem","position":2,"name":"강남구","item":"https://mediroad.kr/area/강남구" },
    { "@type":"ListItem","position":3,"name":"정형외과","item":"https://mediroad.kr/area/강남구/정형외과" },
    { "@type":"ListItem","position":4,"name":"서울정형외과의원" }
  ]
}
```

### 3-5. ItemList (검색/랜딩 목록)
```json
{
  "@type":"ItemList",
  "itemListElement":[
    {"@type":"ListItem","position":1,"url":"https://mediroad.kr/hospitals/h3Kf9aQ2"},
    {"@type":"ListItem","position":2,"url":"https://mediroad.kr/hospitals/gangnam-toontoon"}
  ]
}
```

### 3-6. FAQPage (상세·랜딩 FAQ)
```json
{
  "@type":"FAQPage",
  "mainEntity":[
    {"@type":"Question","name":"예약 없이 방문 가능한가요?",
     "acceptedAnswer":{"@type":"Answer","text":"…"}}
  ]
}
```

### 3-7. 건강 칼럼 — `MedicalWebPage` + `Article` (E-E-A-T 핵심)

의료 콘텐츠(YMYL)는 **작성자 + 의료진 감수 + 날짜**가 신뢰의 핵심.
```jsonc
{
  "@context": "https://schema.org",
  "@type": ["MedicalWebPage", "Article"],
  "headline": "당뇨병 초기증상과 관리법",
  "image": ["https://mediroad.kr/health/diabetes/cover.jpg"],
  "datePublished": "2026-06-10",
  "dateModified": "2026-06-15",
  "lastReviewed": "2026-06-15",                  // 의료 콘텐츠 최종 감수일
  "author":   { "@type": "Organization", "name": "MediRoad 편집팀" },
  "reviewedBy": {                                 // ★ 의료진 감수 = E-E-A-T
    "@type": "Person", "name": "김의사",
    "jobTitle": "내분비내과 전문의"
  },
  "publisher": { "@type": "Organization", "name": "MediRoad",
                 "logo": { "@type": "ImageObject", "url": "https://mediroad.kr/logo.png" } },
  "about": { "@type": "MedicalCondition", "name": "당뇨병" },
  "mainEntityOfPage": "https://mediroad.kr/health/8XphQ2"
}
```
> **GEO 포인트**: 명확한 `headline`·`about`·`reviewedBy`·날짜는 생성형 엔진이 **출처를 신뢰·인용**하는 핵심 신호. 본문은 질문형 h2 + 표/리스트로 답변 친화 구조화.

### 3-8. 칼럼 ↔ 병원 내부링크 (토픽 권위 + 전환)
- 칼럼 상세 → **관련 진료과목 병원** 링크(예: 당뇨 칼럼 → 내분비내과 병원/지역 랜딩).
- 병원 상세 → 관련 칼럼(진료과목 기반).
- 효과: 토픽 클러스터(콘텐츠 허브 ↔ 병원 페이지) 형성 → 색인·권위·전환 동시 강화.

---

## 4. 구현 체크리스트

- [ ] 검색 페이지 `robots:{index:false,follow:true}` + canonical → 대표 URL
- [ ] `/area/[region]`, `/area/[region]/[department]` 라우트 + 화이트리스트 `generateStaticParams`
- [ ] 상세 URL 서술형 슬러그 + 301 정책
- [ ] root layout: WebSite+SearchAction · Organization JSON-LD
- [ ] 상세: MedicalClinic 보강 + BreadcrumbList + FAQPage
- [ ] 검색/랜딩: CollectionPage + ItemList + BreadcrumbList
- [ ] 칼럼 상세: MedicalWebPage+Article(`reviewedBy`·날짜) + FAQPage + BreadcrumbList
- [ ] 칼럼 ↔ 병원 상호 내부링크(토픽 클러스터)
- [ ] NAP 일관성 검증(화면 ↔ JSON-LD)

### 기술 SEO 파일 (구현 완료)
- `src/app/sitemap.ts` — 색인 대상만 수록(홈·/hospitals·/health·/area 랜딩·병원 상세·칼럼 카테고리/상세). lastmod=updatedAt. URL은 canonical과 동일(한글 세그먼트). 필터·/search·/admin 제외.
- `src/app/robots.ts` — `Allow:/`, `Disallow:/admin,/search`, `Sitemap` 링크. 필터 페이지(/hospitals?…)는 robots에서 막지 않음(meta noindex,follow로 링크 전파 유지).
- `public/llms.txt` — AI/LLM용 사이트 안내(llmstxt.org). 주요 랜딩·건강정보 링크 + 의료 면책·데이터 출처.

> 다음 단계 후보(미선택): 성능(CWV)·동적 OG 이미지·리뷰 영역·관리자 인증/CRUD.

---

## 관련 문서
- 아키텍처: [ARCHITECTURE.md](./ARCHITECTURE.md) · 기획: [PRD.md](./PRD.md) · 와이어프레임: [WIREFRAME.md](./WIREFRAME.md)
