# MediRoad 와이어프레임

> 메디로드(MediRoad) — 병원·한의원·한방병원을 지도로 탐색하는 의료 지도 플랫폼.
> 이 문서는 **화면을 그리기 전** 구조·레이아웃을 확정하는 와이어프레임 설계서다.

---

## 1. 설계 원칙

| 원칙 | 내용 |
|---|---|
| **SEO/GEO 최우선** | 페이지 본문은 SSR/SSG. 콘텐츠가 HTML에 그대로 존재해야 함(클라이언트 fetch로 가리지 않음). |
| **시맨틱 + 계층 구조** | `header/nav/main/section/article/aside/footer` 랜드마크 + 페이지당 `h1` 1개. 검색봇이 구조를 쉽게 파악. |
| **반응형 동등** | 모바일·데스크탑 동등 대응. 지도 기반이라 모바일 사용 비중 높음. |
| **구조화 데이터** | 상세는 `MedicalClinic` JSON-LD(주소·geo·진료과목·평점) → 로컬SEO + 생성형 엔진 인용. |
| **무JS 동작** | 검색은 네이티브 `<form method="get">` → JS 없이도 크롤링·동작. |

범례: `🟢 SSR 콘텐츠` · `🔵 URL 상태(searchParams)` · `🟣 클라이언트 인터랙션` · `🟡 구조화데이터/SEO`

---

## 2. 사이트맵 (MVP)

```
/                     홈 (검색 진입 + 추천)              [Static]
/hospitals            검색 결과 (목록 + 지도)            [Dynamic · searchParams]
  ?q=강남
  ?department=정형외과
/hospitals/[id]       병원 상세 (사진슬라이드+지도+정보)  [SSG]

/health              건강 칼럼 목록 (게시판)             [Static/ISR]
/health/category/[c] 카테고리별 칼럼                    [SSG]
/health/[id]         건강 칼럼 상세 (아티클·짧은 고유ID)   [SSG/ISR]

/area/[region]            지역 랜딩 (로컬 SEO)           [SSG]
/area/[region]/[dept]     지역×진료과목 랜딩             [SSG]

── 관리자 (인증 필요 · noindex) ──
/admin/hospitals           병원 관리 목록                [Dynamic·auth]
/admin/hospitals/new       병원 등록 폼                  [Dynamic·auth]
/admin/hospitals/[id]/edit 병원 수정 폼                  [Dynamic·auth]
/admin/health             칼럼 관리 목록                [Dynamic·auth]
/admin/health/new         칼럼 작성 폼                  [Dynamic·auth]
/admin/health/[id]/edit   칼럼 수정 폼                  [Dynamic·auth]
   ※ 공개 상세 URL = 짧은 고유 ID (/hospitals/[id]·/health/[id]), 편집도 동일 id

(확장 슬롯) /reviews · /reservation · /directions
```

---

## 3. 공통 레이아웃 (랜드마크 구조)

```
┌──────────────────────────────────────────────┐
│ <a> 본문 바로가기 (skip link, 포커스 시 노출)   │
├──────────────────────────────────────────────┤
│ <header>  🏥 MediRoad        [병원 찾기] …     │  banner (sticky)
├──────────────────────────────────────────────┤
│ <main id="main">                              │  ← 페이지별 콘텐츠 주입
│        … 각 화면 …                             │
│ </main>                                        │
├──────────────────────────────────────────────┤
│ <footer>  지역 인덱스 · 진료과목 인덱스 · 회사  │  contentinfo (내부링크/SEO)
└──────────────────────────────────────────────┘
```
- 페이지는 **자체 `<main>`을 두지 않음** → 레이아웃의 `<main>` 공유(랜드마크 중복 방지).

---

## 4. 화면별 와이어프레임

### 4-1. 홈 `/`

**데스크탑**
```
┌──────────────────────────────────────────────────┐
│ <header> 🏥 MediRoad            [병원 찾기]        │
├──────────────────────────────────────────────────┤
│ <section aria-labelledby="hero">                  │
│                                                  │
│            🏥  메디로드      ← <h1>                 │
│         우리 동네 병원, 지도로 빠르게               │
│                                                  │
│   ┌────────────────────────────┐ [ 검색 ]         │ 🔵 form GET → /hospitals
│   │ 🔍 병원명·증상·진료과목       │                 │
│   └────────────────────────────┘                 │
│    [내과][소아과][정형외과][치과][한방][안과]        │ 진료과목 칩(링크)
│ </section>                                        │
│                                                  │
│ <section aria-labelledby="nearby"> [📍위치 허용]   │ 🟢 SSR 기본 + 🟣 위치재정렬
│  내 근처 병원   ← <h2>                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  (ul>li)         │
│  │[img]│ │[img]│ │[img]│ │[img]│  ← 카드 썸네일     │
│  │ 카드 │ │ 카드 │ │ 카드 │ │ 카드 │                │
│  └─────┘ └─────┘ └─────┘ └─────┘  ·거리 표시(0.8km)│
│ </section>                                        │
│                                                  │
│ <section aria-labelledby="about">                 │ 🟢🟡 서비스 정의(GEO)
│  메디로드는?   ← <h2>                              │   "어떤 사이트"
│  전국 병원·한의원·한방병원을 지도로 찾는            │   1~2문단 SSR 텍스트
│  의료 지도 플랫폼. 위치·진료과목·진료시간·          │   → AI 브랜드 인식
│  리뷰를 한눈에. (진료과목·지역 카테고리 링크)        │
│ </section>                                        │
│                                                  │
│ <nav aria-label="둘러보기"> [전체 병원 보기] </nav> │
├──────────────────────────────────────────────────┤
│ <footer> 지역으로 찾기 │ 진료과목으로 찾기 │ 회사   │
└──────────────────────────────────────────────────┘
```

**모바일**
```
┌───────────────┐
│ ☰ MediRoad    │ <header>
├───────────────┤
│   🏥 메디로드   │ <h1>
│ 동네 병원 지도  │
│ ┌───────────┐ │
│ │ 🔍 검색…   │ │ form GET
│ └───────────┘ │
│ [내과][소아과]→│ 칩 가로스크롤
│               │
│ 📍 내 근처 병원 │ <h2>
│ ┌───────────┐ │
│ │ [  img  ] │ │ 카드 세로 스택
│ │ 카드       │ │
│ ├───────────┤ │
│ │ [  img  ] │ │
│ │ 카드       │ │
│ └───────────┘ │
│ 메디로드는?    │ <h2> 소개
│ 병원 지도 플랫폼│ GEO 정의
├───────────────┤
│ <footer> 인덱스│
└───────────────┘
```

**시맨틱 구조**
```
main
 ├─ section[aria-labelledby=hero]      → h1, 검색 form, 진료과목 칩(ul)
 ├─ section[aria-labelledby=nearby]    → h2(내 근처 병원), 병원 카드(ul>li)
 ├─ section[aria-labelledby=about]     → h2(메디로드는?), 서비스 소개(GEO 브랜드 정의)
 └─ nav[aria-label=둘러보기]
```

**홈 메타·구조화 사양**
- 메타(루트 layout): `title.default="MediRoad · 병원·한의원 지도 검색"` + `template="%s · MediRoad"`, description(서비스 한 줄), `canonical="https://mediroad.kr"`, OG(`type=website`·title·description·image·`siteName=MediRoad`·`locale=ko_KR`)·twitter.
- JSON-LD: **WebSite + SearchAction**(sitelinks 검색창) · **Organization**(브랜드 엔티티 — `description`·`areaServed:KR`·`knowsAbout` 포함, [SEO.md](./SEO.md) §3-2).
- "메디로드는?" 섹션 텍스트 = Organization `description`과 정합 → 검색·AI가 동일 정의 인식.

> **"내 근처 병원" 위치 처리**: 정확한 위치는 클라이언트 Geolocation(권한 필요)이라 순수 SSR 불가.
> - **기본 위치(fallback) = 서울 강남역** (`lat 37.4979, lng 127.0276`). 위치 **꺼짐·거부·미지원** 시 강남역 기준으로 근처 병원 표시.
> - **SSR도 강남역 기준**으로 렌더(일관된 초기 콘텐츠·SEO 보장) → 위치 **허용 시 클라이언트에서 실제 위치로 거리순 재정렬**·거리 표시.
> - 상수: `DEFAULT_LOCATION = { name: '강남역', lat: 37.4979, lng: 127.0276 }` (`constants`). 위치 출처 라벨(예: "강남역 기준" / "현재 위치 기준") 노출.

---

### 4-2. 검색 결과 `/hospitals?q=…&department=…`

**데스크탑 (좌 목록 · 우 지도)**
```
┌─────────────────────────────────────────────────────────┐
│ <header(page)>                                          │
│  강남 정형외과 검색 결과   ← <h1>                          │
│  ┌──────────────────────────┐ [검색]   (form GET)         │ 🔵 URL: q
│  │ 🔍 강남 정형외과            │                          │
│  └──────────────────────────┘                          │
│  [내과][소아과][정형외과✓][치과]…  ← 활성칩 aria-current    │ 🔵 URL: department
│ </header>                                               │
├────────────────────────────┬────────────────────────────┤
│ <section aria-labelledby>   │ <aside aria-label="지도">   │
│  결과 128건  ← <h2>          │  (sticky)                  │
│  <ol>                       │   ┌──────────────────────┐ │
│  │① [img] 서울정형외과       │   │      🗺  지도          │ │ 🟣 네이버지도
│  │   ★4.5 · 강남구 · 영업중  │   │   📍① 📍②  📍③         │ │   (client)
│  ├─────────────────────────┤   │      📍④  📍⑤          │ │
│  │② [img] 강남튼튼병원  ◀────┼───┼─ 카드 hover→마커 강조   │ │ 🟣 지도↔목록
│  │   ★4.2 · 강남구          │   │     [현위치][+/−]      │ │   동기화 Context
│  ├─────────────────────────┤   └──────────────────────┘ │   (/hospitals 범위)
│  │③ …                      │                            │
│  </ol>                      │                            │
│ </section>                  │ </aside>                   │
└────────────────────────────┴────────────────────────────┘
```

**모바일 (지도 풀 + 바텀시트 목록)**
```
┌───────────────┐
│ ← 🔍[검색] 필터│ <header>
├───────────────┤
│               │
│    🗺  지도    │ <aside> (기본 노출)
│   📍 📍 📍     │
│      📍[현위치] │
│               │
├─ ═══ ─────────┤ 드래그 핸들
│ 결과 128건 정렬│ <section> (바텀시트)
│ <ol>          │
│ │①[img]서울정형│
│ │  ★4.5 강남구 │
│ ├─────────────│
│ │②[img]강남튼튼│
│ </ol>         │
└───────────────┘
   [지도] ⇄ [목록] 토글
```

**시맨틱 구조**
```
main
 ├─ header        → h1(검색어 반영), 검색 form, 진료과목 칩
 └─ div(grid)
     ├─ section[aria-labelledby=results] → h2(결과 N건), 목록(ol>li)
     └─ aside[aria-label=지도]            → 지도(마커)
```
- 필터(`q`·`department`)는 **URL searchParams** → 공유 URL·뒤로가기·색인.

---

### 4-3. 병원 상세 `/hospitals/[id]` — SEO/GEO 핵심

**데스크탑**
```
┌─────────────────────────────────────────────────────────┐
│ <article>                                               │
│ <nav: breadcrumb> 홈 › 강남구 › 정형외과 › 서울정형외과    │ 🟡 내부링크
│                                                         │
│ <header> 서울정형외과의원  [영업중]   ← <h1>+Badge         │
│          정형외과 · ★4.5 (213)                           │
│                                                         │
│ <nav aria-label="바로가기">                              │ 🟣 CTA 액션 바
│   [📞 전화]  [🧭 길찾기]  [🔗 공유]  [⭐ 저장]            │   길찾기=네이버
│                                                         │
│ ┌ 한눈 요약 (TL;DR) ───────────────────┐                │ 🟢🟡 AI 인용 1순위
│ │ 강남구 역삼동 정형외과 의원 · 강남역 250m│                │   데이터 자동 1~2줄
│ │ 평일 09–18시(토 09–13) · ★4.5 · 영업중  │                │
│ └─────────────────────────────────────┘                │
│                                                         │
│ ┌─ <section aria-label="사진"> 이미지 슬라이드 ─────────┐ │ 🟣 캐러셀(client)
│ │  ‹      [   병원 사진 1 / 4   ]      ›   ● ○ ○ ○     │ │   scroll-snap
│ └─────────────────────────────────────────────────────┘ │ 🟡 SEO alt
│                                                         │
│ ┌──────────────────┐   <aside aria-label="기본정보">     │
│ │   🗺 위치지도      │   주소  서울 강남구 테헤란로 201     │ 🟣 네이버지도
│ │ 📍[서울정형외과의원]│   🚇 지하철  강남역 2번출구 250m     │   마커+상호명 라벨
│ │                  │   전화  02-123-4567 (tel:)         │ 🟡 로컬SEO
│ └──────────────────┘   </aside>                         │
│                                                         │
│ <section> ## 병원 소개   (소개글·진료 철학·특징)           │ 🟢🟡 생성형엔진 인용
│   서울정형외과의원은 … 2~3문단 소개 텍스트 …              │
│                                                         │
│ <section> ## 진료시간          오늘(화) 09:00–18:00 ●영업 │ 🟢 요일별 표
│   월 09:00–18:00   목 09:00–18:00    토 09:00–13:00     │   오늘 강조
│   화 09:00–18:00 ◀ 금 09:00–18:00    일 휴진            │   점심·휴진
│   수 09:00–18:00   점심 13:00–14:00   공휴일 휴진         │
│                                                         │
│ <section> ## 진료 안내   (사실기반 텍스트)                 │ 🟢🟡 생성형엔진 인용
│ <section> ## 의료진      원장 홍길동 · 정형외과 전문의      │ 🟢 E-E-A-T 신뢰
│ <section> ## 리뷰   ★4.5 (213)  ▓▓▓▓░   [리뷰 미리보기…] │ 🟢 평점 요약
│ <section> ## 자주 묻는 질문 (3문항 Q&A→FAQPage) ┌───┐  │ 🟡 구조화데이터
│   Q.주차? Q.예약없이방문? Q.진료시간?            │   │  │   GEO 노출
│ <section> ## 주변 비슷한 병원 (카드 ItemList)     │ ▲ │  │ 🟣 플로팅(client)
│ <footer> 최종 업데이트 2026.06.15 ·             ├───┤  │ 🟡 E-E-A-T 최신성
│   정보 출처: 병원 제공·공공데이터 [정보 수정 제안]│ ▼ │  │   신뢰 신호
│ </article>                                      └───┘  │
│ <script ld+json> MedicalClinic + BreadcrumbList + FAQPage  │ 🟡 JSON-LD
└─────────────────────────────────────────────────────────┘
  ⤷ <head>(generateMetadata): title·description·keywords·canonical·robots
     og:title/description/image/url·twitter·geo.position/ICBM   🟡 SEO 메타
     keywords = 브랜드+지역+역+진료과목+의도 조합(hospitalKeywords)
```

**모바일**
```
┌───────────────┐
│ 홈›강남구›…     │ breadcrumb
│ 서울정형외과    │ <h1>
│ 정형외과 ★4.5  │
│ ┌─ 한눈요약 ─┐ │ TL;DR(데이터)
│ │강남 정형외과│ │ 강남역250m
│ │평일09-18 영업││ ★4.5
│ └───────────┘ │
│ ┌───────────┐ │
│ │‹ [사진1/4]›│ │ 이미지 슬라이드
│ │  ● ○ ○ ○  │ │ (스와이프)
│ └───────────┘ │
│ ┌───────────┐ │
│ │🗺📍[서울정형]│ │ 마커+상호명
│ └───────────┘ │
│ 주소           │ <aside> dl
│ 🚇 강남역2번250m│
│ 전화           │
│ ## 병원 소개   │ 소개글
│ ─ 진료시간 ─   │ 오늘 강조 표
│ 오늘(화)09–18● │
│ 월~금 09–18    │
│ 토09–13/일 휴진 │
│ ## 진료 안내   │
│ ## 의료진      │
│ ## 리뷰 ★4.5   │
│ ## FAQ        │
│ ## 주변 병원   │
│ ⓘ 최종업뎃·출처│ E-E-A-T footer
│        [▲][▼]│ ← 플로팅 위로/아래로
├───────────────┤
│[📞전화][🧭길찾기]│ ← 하단 sticky CTA
└───────────────┘
```

**이미지 슬라이드 사양**
- CSS `scroll-snap`(가로) → 모바일 스와이프 / 데스크탑 좌우 버튼·도트
- 슬라이드 전부 `<img alt>`로 HTML 존재(SEO). 실사진 없으면 플레이스홀더.
- 데이터: `Hospital.photos?: { url; alt?; caption?; category?('외관'|'접수'|'진료실'|'대기실'|'기타'); isPrimary? }[]` (없으면 N장 플레이스홀더).
- **alt 자동 보강**: 비우면 `{병원명} {분류}`로 생성(예: "서울정형외과의원 진료실") → 이미지 SEO. 대표(`isPrimary`)는 썸네일·OG 이미지로 사용.

**사진 업로드 사양 (관리자)**
- 병원 **내부·외관 사진** 다중 업로드 + 드래그 정렬 + 대표(★) 지정.
- 사진별 **분류 태그 + 캡션/alt** 입력(미입력 시 자동 alt). → 상세 슬라이드로 노출.

**지하철역 거리 표기 사양**
- 형식: `{역명} {출구}번 출구 {거리}m` (예: `강남역 2번 출구 250m`). 도보 분(약 4분)도 병기 가능.
- 가장 가까운 1개 역 기준(필요 시 복수 역 노출). 텍스트로 HTML에 존재 → 로컬SEO.
- 데이터: `Hospital.nearestStation?: { name; exit?; distanceM }` (없으면 미표시).
  거리는 사전 계산해 저장(역 좌표 ↔ 병원 좌표). 실API/지오코딩 단계에서 채움.

**위치 지도 마커 사양**
- 네이버지도 로드 후 병원 좌표(`Hospital.location`)에 **단일 마커** + **상호명 라벨**(마커 위/옆에 병원명 텍스트 항상 표시).
- 구현: 네이버 Maps `Marker` 커스텀 HTML(아이콘+라벨) 또는 항상 열린 `InfoWindow`(상호명·주소).
- 지도 중심 = 병원 위치, 적정 줌. 마커 클릭 시 InfoWindow(상호명·주소) 또는 길찾기 연결.
- 지도는 client(JS 필요). 상호명·주소는 `<h1>`/`<aside>`에도 텍스트로 존재하므로 SEO 영향 없음.

**CTA 액션 바 사양**
- 항목: 전화(`tel:`) · 길찾기(네이버지도 deep link/URL) · 공유(Web Share API, 미지원 시 링크 복사) · 저장(즐겨찾기).
- 데스크탑: 헤더 하단 인라인 / 모바일: **하단 sticky 바**(전화·길찾기 우선).
- `<nav aria-label="바로가기">`로 마크업.

**상단·하단 이동(플로팅) 버튼 사양**
- 우측 하단 고정 플로팅: **▲ 맨 위로** / **▼ 맨 아래로** → 누르면 페이지 최상단/최하단으로 스무스 스크롤 이동.
- 동작: `window.scrollTo({ top: 0 | document.body.scrollHeight, behavior: "smooth" })` (client 컴포넌트).
- 노출: 일정 스크롤 이상일 때만 표시(예: ▲는 스크롤 후, ▼는 하단 근접 시 숨김). 모바일은 sticky CTA 위에 배치.
- 접근성: `<button aria-label="맨 위로">` / `aria-label="맨 아래로">`. 키보드 포커스 가능.

**한눈 요약(TL;DR) 사양** — GEO 인용 1순위
- 본문 상단(CTA 아래)에 1~2줄 핵심 요약. `<p>` 또는 `<section aria-label="요약">`.
- **데이터에서 자동 생성**(별도 입력 불필요): `{지역} {진료과목} {종별} · {가까운역 거리} · {대표 진료시간} · ★{평점} · {영업상태}`.
  예) "강남구 역삼동 정형외과 의원 · 강남역 250m · 평일 09–18시(토 09–13) · ★4.5 · 영업중".
- 사실 위주 한 문장 → 생성형 엔진이 그대로 인용하기 좋음. 화면값과 동일(NAP 일관).

**정보 최신성·출처 사양(`<footer>`)** — E-E-A-T
- 최종 업데이트일(`Hospital.updatedAt`) + 출처(병원 제공/공공데이터) + [정보 수정 제안] 링크.
- 의료·로컬 정보의 신뢰·최신성 신호(생성형 엔진·구글 모두 중시).

**진료시간 표 사양**
- 요일별(월~일) open/close + 점심시간 + **오늘 요일 강조** + 영업중/마감 상태 배지. `<table>`(thead/th) 시맨틱 권장.
- 휴진일(일·공휴일), 야간진료 표기. JSON-LD `openingHoursSpecification` 연동은 추후(SEO 단계).
- 데이터: `Hospital.hours?: { day: 0~6; open?; close?; lunch?; closed? }[]` + `holidayClosed?`.

**병원 소개 사양**
- 병원 소개글(진료 철학·특징·강점) 2~3문단. `<section>` + `h2 병원 소개`, 본문은 SSR 텍스트.
- 사실 기반 서술 → 생성형 엔진 인용 + JSON-LD `description`에 활용.
- 데이터: `Hospital.description?: string`. 없으면 진료과목·지역 기반 기본 문안으로 대체.

**의료진 / 리뷰 사양**
- 의료진: `Hospital.doctors?: { name; title; specialty }[]` — 원장/전문의(E-E-A-T 신뢰).
- 리뷰: 헤더는 평점 요약(`rating`·`reviewCount`, 별점 막대). 미리보기 N개.
  데이터 `Hospital.reviews?: Review[]` (작성 기능은 확장 — MVP는 조회/요약만).

**FAQ 사양 (GEO 노출 핵심)**
- `## 자주 묻는 질문` 섹션 + **`FAQPage` JSON-LD**. **최소 3문항** Q&A.
- 검색 의도 기반 예시: ① 주차 가능한가요? ② 예약 없이 방문할 수 있나요? ③ 진료시간·점심시간은 어떻게 되나요? (병원별 맞춤)
- 데이터: `Hospital.faqs?: { q; a }[]` (없으면 주차·예약·진료시간 등 데이터로 기본 3문항 자동 구성).
- 질문은 `<h3>`(또는 `<dt>`), 답변은 `<dd>`/`<p>` — 화면 텍스트와 JSON-LD 동일.

**SEO 메타태그 사양 (`generateMetadata`)**

상세 페이지는 병원별로 동적 메타를 생성한다. `app/hospitals/[id]/page.tsx`의 `generateMetadata`:

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const h = await getHospitalById((await params).id);   // 없으면 404 + noindex
  // ★ 관리자 입력값(h.seo) 우선, 없으면 데이터 기반 자동 생성
  const title = h.seo?.title
    ?? `${h.name} · ${h.region} ${h.departments[0]}`;
  const description = h.seo?.description
    ?? `${h.region} ${h.type} ${h.name} — ${h.departments.join(", ")} 진료. ` +
       `위치·진료시간·연락처·길찾기 안내.`;
  const url = `https://mediroad.kr/hospitals/${h.id}`;   // 짧은 고유 ID
  const image = h.seo?.ogImage ?? h.photos?.[0] ?? "/og/hospital-default.png";
  const { lat, lng } = h.location;

  return {
    title,                                   // <title> (+ layout 템플릿 "%s · MediRoad")
    description,                             // <meta name="description">
    keywords: h.seo?.keywords ?? hospitalKeywords(h),  // 관리자 지정 or 자동
    alternates: { canonical: url },          // <link rel="canonical">
    robots: { index: !h.seo?.noindex, follow: true },  // 개별 noindex 가능
    openGraph: {                             // og:* (카카오톡·페북 공유)
      type: "website", url, title, description,
      siteName: "MediRoad", locale: "ko_KR",
      images: [{ url: image, width: 1200, height: 630, alt: `${h.name} 사진` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    other: {                                 // 로컬 SEO geo 메타
      "geo.region": "KR",
      "geo.placename": h.region,
      "geo.position": `${lat};${lng}`,
      "ICBM": `${lat}, ${lng}`,
    },
  };
}
```

렌더되는 핵심 태그: `<title>` · `meta[description]` · `meta[keywords]` · `link[canonical]` · `meta[robots]` · `og:title/description/image/url/type/locale` · `twitter:card` · `geo.position`·`ICBM`. (홈·검색 페이지도 각자 `generateMetadata` 보유 — 검색은 q/department 반영.)

**키워드 전략 (`hospitalKeywords`)**

병원 데이터로 **지역·역·진료과목 조합 + 검색 의도** 키워드를 동적 생성한다.

```ts
function hospitalKeywords(h: Hospital): string[] {
  const st = h.nearestStation?.name;            // 예: 강남역
  return Array.from(new Set([
    h.name,                                      // 서울정형외과의원
    h.type,                                      // 의원
    h.region,                                    // 강남구
    ...h.departments,                            // 정형외과, 재활의학과
    ...h.departments.map((d) => `${h.region} ${d}`),        // 강남구 정형외과
    ...(st ? h.departments.map((d) => `${st} ${d}`) : []),  // 강남역 정형외과
    ...h.departments.map((d) => `${d} 추천`),    // 정형외과 추천
    `${h.region} 병원`, `${h.region} ${h.type}`, // 강남구 병원 / 강남구 의원
    `${h.region} 병원 추천`,
    "내 주변 병원", "병원 찾기",
  ]));
}
// 예) 서울정형외과의원, 강남구, 정형외과, 강남구 정형외과, 강남역 정형외과,
//     정형외과 추천, 강남구 병원, 내 주변 병원 …
```

| 축 | 예시 |
|---|---|
| 브랜드 | 서울정형외과의원 |
| 지역 | 강남구, 강남구 병원, 강남구 의원 |
| 역세권 | 강남역 정형외과 |
| 진료과목 | 정형외과, 재활의학과 |
| 지역×과목 | 강남구 정형외과 |
| 의도 | 정형외과 추천, 병원 찾기, 내 주변 병원 |

> ⚠️ `meta[keywords]`는 구글 랭킹 가중치는 거의 없음(네이버·일부 엔진은 참고). **진짜 효과는 동일 키워드를 `<title>`·`<h1>`·소개글·`<h2>`·JSON-LD에 자연스럽게 노출**하는 것 → 위 키워드 축을 콘텐츠에도 반영한다.

**시맨틱 구조**
```
main
 └─ article
     ├─ nav[breadcrumb]
     ├─ header                  → h1 + 상태 Badge + 메타(평점)
     ├─ nav[aria-label=바로가기]  → CTA(전화·길찾기·공유·저장)
     ├─ section[aria-label=사진]  → 이미지 슬라이드(캐러셀)
     ├─ div(grid) ├ figure/지도   └ aside[기본정보](주소·지하철·전화)
     ├─ section → h2 병원 소개(소개글)
     ├─ section → h2 진료시간(요일별 표, 오늘 강조)
     ├─ section → h2 진료 안내
     ├─ section → h2 의료진
     ├─ section → h2 리뷰(평점 요약 + 미리보기)
     ├─ section → h2 FAQ
     └─ section → h2 주변 병원(카드)
 + 우측 하단 플로팅: ▲ 맨 위로 / ▼ 맨 아래로 (스무스 스크롤)
 + 모바일: 하단 sticky CTA 바
 + <script ld+json> MedicalClinic + BreadcrumbList + FAQPage
```

---

### 4-4. 지역·진료과목 랜딩 `/area/[region]` · `/area/[region]/[department]` — 로컬 SEO 색인 주력

검색(`/hospitals?…`)은 noindex. **색인 수요("강남구 정형외과")는 이 정식 랜딩이 흡수**한다(고유 콘텐츠).
큐레이션된 (지역 × 주요 과목) 조합만 `generateStaticParams`로 SSG → 무한 thin page 방지.

**데스크탑 — `/area/[region]/[department]` (지역×과목)**
```
┌─────────────────────────────────────────────────────────┐
│ <main>                                                  │
│ <nav breadcrumb> 홈 › 강남구 › 정형외과                  │ 🟡 내부링크
│ <header>                                                │
│   <h1>강남구 정형외과</h1>                ← 키워드 h1     │ 🟢🟡 색인 타깃
│   강남구 정형외과 병원 N곳 · 위치·진료시간·연락처 안내      │   지역×과목 고유
│   강남구에서 정형외과를 찾는다면… (1~2문단 소개)           │   소개문(thin 방지)
│ </header>                                               │
│ <section aria-labelledby="list">                        │ 🟢 SSR 목록
│   병원 N곳  ← <h2>                        [🗺 지도 보기]  │   HospitalCard 재사용
│   <ol>                                                  │   (검색결과와 동일 카드)
│   │① [img] 서울정형외과의원  ★4.5 · 강남구 · 영업중        │
│   │② [img] 강남튼튼병원      ★4.2 · 강남구               │
│   │③ …                                                 │
│   </ol>                                                 │
│ </section>                                              │
│ <section aria-labelledby="faq">                         │ 🟡 지역특화 FAQ
│   ## 강남구 정형외과 자주 묻는 질문         ← <h2>         │   → FAQPage
│   Q. 강남구 정형외과 야간진료 되나요?                     │
│   Q. 주말(토·일) 진료하는 곳이 있나요?                    │
│ </section>                                              │
│ <nav aria-label="인접 탐색">                            │ 🟡 내부링크(권위 전파)
│   인접 지역  [서초구 정형외과] [송파구 정형외과]           │
│   다른 과목  [강남구 신경외과] [강남구 재활의학과] [강남구 내과]│
│ </nav>                                                  │
│ <script ld+json> CollectionPage + ItemList + BreadcrumbList + FAQPage │ 🟡
└─────────────────────────────────────────────────────────┘
```

**데스크탑 — `/area/[region]` (지역만, 과목 미지정)**
```
┌─────────────────────────────────────────────────────────┐
│ <nav breadcrumb> 홈 › 강남구                             │
│ <header> <h1>강남구 병원</h1>                            │ 🟢🟡 색인 타깃
│   강남구 병원·의원 N곳 — 진료과목별로 찾아보세요.          │
│ <nav aria-label="진료과목"> ← 과목별 랜딩으로 분기         │ 🟡 내부링크 허브
│   [내과][정형외과][소아과][치과][한방][안과]…             │   → /area/강남구/정형외과
│ <section> 병원 N곳 (대표/전체 목록, 카드)  ← <h2>          │ 🟢 SSR 목록
│ <section> ## 강남구 병원 이용 안내 / FAQ                  │ 🟡
│ <nav> 인접 지역 [서초구][송파구][관악구]                  │ 🟡
│ <script ld+json> CollectionPage + ItemList + BreadcrumbList │
└─────────────────────────────────────────────────────────┘
```

**모바일** (공통 — 세로 스택)
```
┌───────────────┐
│ 홈›강남구›정형 │ breadcrumb
│ 강남구 정형외과 │ <h1>
│ 병원 N곳·안내   │ 소개문
│ [🗺 지도 보기]  │
│ ┌───────────┐ │
│ │①[img]서울정형│ │ 카드 세로 스택
│ │ ★4.5 영업중 │ │ (HospitalCard 재사용)
│ ├───────────┤ │
│ │②[img]강남튼튼│ │
│ └───────────┘ │
│ ## 지역 FAQ    │ <h2>
│ Q.야간진료?    │
│ ─ 인접 탐색 ─  │ <nav>
│[서초구 정형][…]│ 인접지역·다른과목
└───────────────┘
```

**시맨틱 구조**
```
main
 ├─ nav[breadcrumb]
 ├─ header → h1(지역[×과목] 키워드) + 고유 소개문(1~2문단)
 ├─ (지역만) nav[aria-label=진료과목] → 과목별 랜딩 링크
 ├─ section[aria-labelledby=list] → h2(병원 N곳) + ol>li(HospitalCard 재사용)
 ├─ section[aria-labelledby=faq]  → h2(지역특화 FAQ) → FAQPage
 └─ nav[aria-label=인접 탐색] → 인접 지역·다른 과목 내부링크
 + <script ld+json> CollectionPage + ItemList + BreadcrumbList (+ FAQPage)
```

**사양**
- **데이터 재사용**: `getHospitals({ region, department })` — 검색결과와 동일 조회/카드. 지도는 옵션(목록 우선, "지도 보기"는 `/hospitals?...`로 연결 가능).
- **생성 범위(화이트리스트)**: `generateStaticParams`로 **실수요 (지역 × 주요 과목) 조합만** SSG. 화이트리스트는 `constants`(예 `AREA_LANDINGS`)로 관리 → 무한 thin page 차단.
- **고유 소개문(thin 방지 핵심)**: 지역×과목별 1~2문단. 1차는 `{지역} {과목} 데이터 기반 자동 문안`(병원 수·대표 지하철·범위), 이후 주요 조합은 수기 보강.
- **메타**: `title="{지역} {과목} 병원 | MediRoad"`, description(지역×과목+병원수), self canonical, `geo.*`=지역 중심 좌표(대표값), robots index.
- **region(지역) 정규화 — 확정**: 공공데이터(HIRA)가 **시도·시군구를 코드+명칭으로** 제공 → `region = { sido, sidoCd, sigungu, sgguCd, emdong? }`. **URL 세그먼트=시군구명**(`/area/강남구`), **정합/중복 키=`sgguCd`**, 동명 시군구는 코드로 구분(필요 시 `/area/서울-중구` 확장). 상세: [PRD §6](./PRD.md).
- **연결**: 병원 상세 breadcrumb(홈›지역›과목›병원)의 지역·과목 노드가 이 랜딩으로 링크. 검색결과(noindex)에서도 "이 지역 랜딩 보기" 내부링크 권장.

---

### 4-5. 상태 화면 (loading / error / not-found)

Next App Router 특수 파일로 로딩·에러·404를 라우트별 제공.

| 파일 | 화면 | 내용 |
|---|---|---|
| `app/hospitals/loading.tsx` | 목록 로딩 | 카드/지도 스켈레톤 |
| `app/hospitals/[id]/loading.tsx` | 상세 로딩 | 사진·정보 스켈레톤 |
| `app/hospitals/[id]/not-found.tsx` | 404 | 없는 병원 → 검색/홈 이동 |
| `app/error.tsx` (또는 라우트별) | 에러 | 재시도 버튼 |

```
[로딩 스켈레톤 — 상세]        [404 — 없는 병원]        [에러]
┌───────────────┐          ┌───────────────┐      ┌───────────────┐
│ ▭▭▭▭ (제목)    │          │      🔍❓       │      │      ⚠️         │
│ ▭▭ ▭▭▭        │          │ 병원을 찾을 수   │      │ 정보를 불러오지 │
│ ┌───────────┐ │          │ 없어요          │      │ 못했어요        │
│ │ ░░ 사진 ░░ │ │          │ [병원 검색][홈] │      │ [다시 시도]     │
│ └───────────┘ │          └───────────────┘      └───────────────┘
│ ▭▭▭ ▭▭        │
└───────────────┘
```
- 로딩: `loading.tsx`가 자동으로 `<Suspense>` 경계 → 스트리밍.
- 404: `notFound()` 호출 시 노출. 메타 `robots: noindex`.

---

### 4-6. 건강 칼럼 목록 `/health` (게시판)

의료진 감수 건강 정보 게시판. **SEO/GEO 핵심 콘텐츠 허브**(검색·생성형 엔진 유입 + 칼럼→병원 내부링크).

**데스크탑**
```
┌──────────────────────────────────────────────────────────┐
│ <header(page)> <h1>건강 칼럼</h1>                          │
│   의료진이 감수한 믿을 수 있는 건강 정보                     │
│   ┌────────────────────────────┐ [검색]  (form GET)        │ 🔵 /health?q=…
│   │ 🔍 궁금한 증상·질환 검색       │                         │   제목+내용 검색
│   └────────────────────────────┘                          │
│   [전체][당뇨][고혈압][다이어트][정형외과][한방]…   ← 탭(링크)│ 🟡 카테고리 내부링크
├──────────────────────────────────────────────────────────┤
│ <section aria-labelledby="list">  칼럼 124건  [최신순 ▾]   │ 🟢 SSR 목록
│  <ol>                                                    │
│  ┌───────────────────┐ ┌───────────────────┐             │
│  │ [    썸네일    ]   │ │ [    썸네일    ]   │             │
│  │ [당뇨]            │ │ [정형외과]        │  카테고리 배지 │
│  │ 당뇨병 초기증상…   │ │ 무릎 통증 원인…    │  <h2>제목     │
│  │ 요약 두 줄 …       │ │ 요약 …            │             │
│  │ 👤감수 김의사·06.10·5분│ 👤감수 이의사·06.08│  감수·날짜·분 │ 🟡 E-E-A-T
│  └───────────────────┘ └───────────────────┘             │
│  … [1][2][3]…  페이지네이션                                │
│ </section>                  <aside aria-label="추천">      │
│                              인기 칼럼 · 진료과목별 바로가기 │ 🟡 내부링크
└──────────────────────────────────────────────────────────┘
```

**모바일**
```
┌───────────────┐
│ 건강 칼럼      │ <h1>
│ ┌───────────┐ │
│ │🔍 증상 검색 │ │ form GET
│ └───────────┘ │
│[전체][당뇨][고]→│ 탭 가로스크롤
│ ┌───────────┐ │
│ │ [썸네일]   │ │ 카드 세로 스택
│ │ [당뇨]제목 │ │
│ │ 요약…       │ │
│ │👤김의사·5분 │ │
│ ├───────────┤ │
│ │ [썸네일]…   │ │
│ └───────────┘ │
│  [1][2][3]    │
└───────────────┘
```

**시맨틱 / SEO**
```
main
 ├─ header → h1(건강 칼럼) + form[role=search] + nav[카테고리 탭]
 └─ section[aria-labelledby=list] → ol > li (article 카드: h2)
 └─ aside[추천]
```
- **검색**: `<form action="/health" method="get" role="search">`(JS 없이 동작). **제목 + 내용(본문)** 대상. 결과는 `/health?q=…`.
  - Mock 단계: `title + body` 텍스트 `includes` 매칭. 실API 단계: 전문검색(인덱스/형태소) 권장.
- 라우트: `/health`(전체) · `/health/category/[category]`(카테고리, 색인) · `?q=`·`?sort=`(검색·정렬 변형 → noindex).
- 구조화: `Blog` + `ItemList`(칼럼). 카테고리 페이지는 `CollectionPage` + BreadcrumbList.
- 색인: 목록·카테고리 index, 검색(`?q=`)·정렬·페이지 변형은 noindex + canonical 대표화.

---

### 4-7. 건강 칼럼 상세 `/health/[id]` (아티클)

**데스크탑**
```
┌─────────────────────────────────────────────────────────┐
│ <article>                                               │
│ <nav breadcrumb> 홈 › 건강칼럼 › 당뇨 › 당뇨병 초기증상   │ 🟡 내부링크
│ <header>                                                │
│   [당뇨]  ← 카테고리 배지                                 │
│   <h1>당뇨병 초기증상과 관리법</h1>                       │
│   👤 감수 김의사 (내분비내과 전문의)                       │ 🟡 E-E-A-T 감수
│   작성 2026.06.10 · 수정 2026.06.15 · 읽기 5분            │   reviewedBy
│   [🔗 공유하기]  (카카오톡·X·링크복사)                     │ 🟣 공유(client)
│ </header>                                               │
│ ┌─────────────────────────────────────┐                │
│ │            대표 이미지 (alt)            │  🟡 OG·이미지  │
│ └─────────────────────────────────────┘                │
│ ┌ 핵심 요약 (TL;DR) ───────────────────┐                │ 🟢🟡 AI 인용 1순위
│ │ • 당뇨 초기엔 갈증·다뇨·체중감소…       │                │   3~4줄 불릿
│ │ • 공복혈당 126↑ 시 진단, 조기관리 핵심  │                │   글 맨 위 배치
│ └─────────────────────────────────────┘                │
│ <nav aria-label="목차"> 목차 ▸ h2 자동 추출              │ 🟡 GEO 구조화
│ <section> 본문 (h2/h3 시맨틱 · 표 · 리스트)               │ 🟢🟡 생성형엔진 인용
│   ## 당뇨병이란   ## 초기 증상   ## 관리·예방              │
│ <section> ## 자주 묻는 질문 (3문항 FAQ → FAQPage)       │ 🟡 구조화·GEO
│   Q.초기증상은? Q.진단기준은? Q.예방·관리법은?           │   주제 기반
│ <section> ## 출처·참고문헌                               │ 🟡 E-E-A-T·AI신뢰
│   1. 대한당뇨병학회 진료지침 …(link)                      │   기관·논문 링크
│ <aside aria-label="관련 병원">                          │ 🟡 칼럼→병원
│   이 글과 관련된 병원   [강남구 내분비내과 보기 →]         │   내부링크/전환
│ <section> ## 관련 칼럼 (카드 ItemList)                   │ 🟡 내부링크
│ <footer> ⓘ 의학적 면책: 본 정보는 일반적 건강정보이며     │ 🟡 YMYL 신뢰·안전
│   진단·치료를 대신하지 않습니다. 증상 시 전문의 상담.      │   면책 고지
│ </article>                                              │
│ <script ld+json> MedicalWebPage+Article+FAQPage+Breadcrumb│ 🟡 reviewedBy·날짜
└─────────────────────────────────────────────────────────┘
  ⤷ <head>(generateMetadata): title·description·canonical·robots·keywords·
     og:type=article·article:published_time·modified_time·author   🟡 SEO 메타
```

**모바일**
```
┌───────────────┐
│ 홈›칼럼›당뇨    │ breadcrumb
│ [당뇨]         │
│ 당뇨병 초기증상 │ <h1>
│ 👤김의사·5분 🔗│ 감수+공유
│ ┌───────────┐ │
│ │ 대표 이미지 │ │
│ └───────────┘ │
│ ┌─ 핵심요약 ─┐ │ TL;DR 불릿
│ │•갈증·다뇨… │ │
│ └───────────┘ │
│ ▸ 목차         │ TOC
│ ## 당뇨병이란   │ 본문
│ ## 초기 증상    │
│ ## 관리·예방    │
│ ## FAQ        │
│ ## 출처·참고문헌│ 신뢰 근거
│ ─ 관련 병원 ─  │ <aside>
│ [내분비내과 →] │ 칼럼→병원
│ ## 관련 칼럼   │
│ ⓘ 의학적 면책  │ YMYL 고지
└───────────────┘
```

**시맨틱 / SEO·GEO**
```
main
 └─ article
     ├─ nav[breadcrumb]
     ├─ header → 카테고리 + h1 + 감수(reviewedBy)·작성/수정일·읽기시간 + 공유 버튼
     ├─ figure → 대표 이미지(alt)
     ├─ section[핵심요약 TL;DR] → 3~4줄 불릿(AI 인용 1순위)
     ├─ nav[aria-label=목차] → TOC(h2 추출)
     ├─ section → 본문(h2/h3, 표/리스트 — 답변형 구조)
     ├─ section → h2 FAQ
     ├─ section → h2 출처·참고문헌(기관·논문 링크)
     ├─ aside[관련 병원] → 진료과목 병원 CTA(내부링크/전환)
     ├─ section → h2 관련 칼럼
     └─ footer → 의학적 면책 고지(YMYL)
 + <script ld+json> MedicalWebPage + Article(abstract=요약, citation=출처) + FAQPage + BreadcrumbList
```
- **E-E-A-T(의료=YMYL 핵심)**: `author` + **`reviewedBy`(감수 의료진)** + `datePublished`/`dateModified`/`lastReviewed`.
- **GEO**: **핵심 요약(TL;DR)** + 명확한 h2 질문형 소제목 + 목차 + 표/리스트 → 생성형 엔진 인용 1순위.
- **신뢰 근거**: **출처·참고문헌**(기관·논문 링크) → Article `citation`에도 매핑.
- **토픽 권위·전환**: 칼럼 ↔ 관련 병원(진료과목) 상호 내부링크.
- **공유하기 버튼**: 헤더에 배치. **카카오톡 공유**(Kakao SDK) + **링크 복사**(clipboard) + 모바일은 **Web Share API**(`navigator.share`, 미지원 시 메뉴 폴백). OG 메타(`og:title/description/image`)가 공유 카드에 그대로 노출되므로 메타 품질이 곧 공유 품질. `ShareButton`(client).
- **FAQ(GEO 노출 핵심)**: `## 자주 묻는 질문` + **`FAQPage` JSON-LD**, **최소 3문항**. 주제 기반 예(당뇨): ① 초기증상은? ② 진단(공복혈당) 기준은? ③ 예방·관리법은? 질문=`<h3>`/`<dt>`, 답변=`<dd>`/`<p>`.
- 데이터: `Column { id(짧은 고유); title; category; tags?; excerpt; summary(TL;DR bullets); body; thumbnail; author; reviewedBy{name,specialty,bio?}; references?[{title,url}]; faqs?[{q,a}]; status; publishedAt; updatedAt; readingMinutes; relatedDepartments; seo?{title,description,ogImage,keywords,noindex} }`.

**칼럼 상세 `generateMetadata`** — `robots`·`canonical` 포함(발행상태 반영):
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const c = await getColumnById((await params).id);   // 없으면 404
  const url = `https://mediroad.kr/health/${c.id}`;    // canonical = self
  return {
    title: c.seo?.title ?? c.title,
    description: c.seo?.description ?? c.excerpt,
    keywords: c.seo?.keywords ?? [c.category, ...(c.tags ?? [])],
    alternates: { canonical: url },                    // ✅ canonical
    robots: {                                          // ✅ robots
      index: c.status === "published" && !c.seo?.noindex,  // 게시중만 색인
      follow: true,
    },
    openGraph: {
      type: "article", url, title: c.seo?.title ?? c.title,
      description: c.seo?.description ?? c.excerpt,
      images: [c.seo?.ogImage ?? c.thumbnail],
      publishedTime: c.publishedAt, modifiedTime: c.updatedAt,
      authors: [c.reviewedBy.name],
    },
  };
}
```
> 임시저장(draft)·숨김 → `index:false`. 게시중 + `seo.noindex=false`만 색인.

> 구조화 데이터(Article/MedicalWebPage)·색인 정책 상세는 [SEO.md](./SEO.md) 참고.

**🎯 칼럼 상세 작업 체크리스트 (3대 축 동시 충족)**

① **구조화 데이터**
- [ ] `MedicalWebPage+Article` (headline·image·datePublished·dateModified·lastReviewed·author·**reviewedBy**·publisher·`about:MedicalCondition`·mainEntityOfPage)
- [ ] `Article.abstract`=TL;DR · `Article.citation`=출처
- [ ] `FAQPage` · `BreadcrumbList`

② **시맨틱 태그**
- [ ] `article > header(h1+감수+날짜) · figure(alt) · nav[목차] · section(h2/h3) · aside(관련병원) · footer(면책)`
- [ ] 페이지당 **h1 1개**, h2/h3 논리적 위계(답변형 소제목)
- [ ] 목록=`ul/ol`, 표=`table(thead/th)`, 인용=`blockquote`, 정의=`dl` — 의미 태그 사용
- [ ] 이미지 `alt`, 링크는 의미 있는 텍스트

③ **콘텐츠 품질 (E-E-A-T / YMYL)**
- [ ] **전문성**: 의료진 감수 + 자격 표기, 정확한 용어 + 쉬운 설명
- [ ] **신뢰**: 출처·참고문헌(기관·논문), 최종 검토일·최신성
- [ ] **가독성/GEO**: 핵심요약(TL;DR) + 답변형 구조 + 짧은 문단 + 표/리스트
- [ ] **깊이·독창성**: 증상→원인→진단→치료→예방 등 충분한 구성(복붙 금지)
- [ ] **검색의도 충족**: 사용자 질문 + FAQ로 해소
- [ ] **안전(YMYL)**: 의학적 면책 고지 + 전문의 상담 권고

---

### 4-8. 관리자 — 병원 목록 `/admin/hospitals`

> ⚠️ **관리자 영역은 공개 페이지와 정반대**: **인증 필수** · 전체 `noindex,nofollow` + `robots Disallow: /admin` · 폼 **변이(mutation)** 중심(Client + Server Actions). SEO 대상 아님.

**데스크탑**
```
┌──────────────────────────────────────────────────────────┐
│ [Admin] MediRoad 관리자          관리자님 ▾  [로그아웃]     │ 관리자 헤더(별도)
├──────────────────────────────────────────────────────────┤
│ <h1>병원 관리</h1>                       [+ 병원 등록]     │ 🟣 /admin/hospitals/new
│ 🔍[검색…] [종별▾][지역▾][상태▾]                총 124건    │ 필터·검색
│ ┌────────────────────────────────────────────────────┐  │
│ │ ☐ 병원명         종별  지역   진료과목  상태   관리   │  │ <table> 헤더
│ ├────────────────────────────────────────────────────┤  │
│ │ ☐ 서울정형외과의원 의원 강남구 정형외과 🟢게시중 [수정][삭제]│
│ │ ☐ 강남튼튼병원    병원 강남구 정형외과 🟢게시중 [수정][삭제]│
│ │ ☐ 역삼연세내과    의원 강남구 내과    ⚪숨김  [수정][삭제]│
│ └────────────────────────────────────────────────────┘  │
│ [선택 삭제]                          ◁ [1][2][3]… ▷       │ 일괄·페이지네이션
└──────────────────────────────────────────────────────────┘
```
- 행 [수정] → `/admin/hospitals/[id]/edit` · [삭제] → 확인 모달.
- 상태(게시중/숨김)는 공개 노출 토글(숨김=공개 사이트에서 미표시).

**모바일**: 테이블 → 카드 리스트(병원명·상태·[수정][삭제]) 변환.

---

### 4-9. 관리자 — 병원 등록 / 수정 (`/admin/hospitals/new` · `/[id]/edit`)

등록·수정 **동일 폼**(수정은 기존값 prefill). 

```
┌──────────────────────────────────────────────────────────┐
│ <nav breadcrumb> 병원 관리 › 병원 등록                     │
│ <h1>병원 등록</h1>   (수정 시 "병원 수정")                 │
│ <form>  (client + Server Action)                         │
│ ── 기본 정보 ──────────────────────────                    │
│   병원명 *      [____________________]                    │
│   종별 *        [의원 ▾]                                  │
│   진료과목 *    [정형외과 ✕][재활의학과 ✕] [+ 추가]        │ 멀티선택
│   전화          [____________________]                    │
│ ── 위치 ──────────────────────────────                    │
│   주소 *        [________________] [주소검색]             │ 우편번호 API
│   상세주소      [____________________]                    │
│   좌표          [lat 37.50][lng 127.03]  🗺 지도에서 핀    │
│   지하철역      [강남역][2]번출구 [250]m                   │
│ ── 운영 ──────────────────────────────                    │
│   진료시간      월~금[09:00]~[18:00] 점심[13:00~14:00]…    │ 요일별
│   공개 상태     (●) 게시중   ( ) 숨김                      │
│ ── 사진 (내부·외관) ───────────────────                    │
│   병원 사진     [⬆ 업로드]  다중 · 드래그 정렬              │ → 상세 슬라이드
│    ┌────┐ ┌────┐ ┌────┐ ┌────┐                           │
│    │★대표│ │ img │ │ img │ │ img │  각 사진: ✕삭제·⠿정렬   │ ★=대표(썸네일)
│    │외관 │ │접수 │ │진료실│ │대기실│  분류 태그 + 캡션/alt   │ 🟡 SEO alt
│    └────┘ └────┘ └────┘ └────┘                           │
│ ── 콘텐츠 ────────────────────────────                    │
│   병원 소개      [textarea ……………………]                    │
│ ── SEO 설정 (검색 최적화) ─────────────                    │ 🟡 메타 직접 제어
│   SEO 타이틀     [____________________]          12/60     │ 비우면 자동생성
│     ⓘ 자동: 서울정형외과의원 · 강남구 정형외과               │
│   메타 디스크립션 [textarea ………………]            48/155     │ 비우면 자동생성
│     ⓘ 자동: 강남구 의원 서울정형외과의원 — 정형외과 진료…     │
│   URL           /hospitals/h3Kf9aQ2  (짧은 고유 ID·자동)    │ 변경 불가
│   OG 이미지      [⬆ 업로드]  (미설정 시 대표사진 사용)       │ 공유 썸네일
│   검색 노출      (●) 색인 허용   ( ) 색인 제외(noindex)      │
│  ┌ 검색결과 미리보기 ─────────────────────┐               │ 구글 스니펫 프리뷰
│  │ 서울정형외과의원 · 강남구 정형외과         │               │
│  │ mediroad.kr › hospitals › seoul-ortho   │               │
│  │ 강남구 의원 서울정형외과의원 — 정형외과 …  │               │
│  └─────────────────────────────────────────┘               │
│                                                          │
│   * 필수    [취소]                          [저장]        │ 🟣 변이
│ </form>                                                   │
└──────────────────────────────────────────────────────────┘
```

**삭제 확인 모달**
```
┌───────────────────────────┐
│ 병원을 삭제할까요?           │
│ '서울정형외과의원'           │
│ 삭제 후 복구할 수 없습니다.   │
│        [취소]   [삭제]      │ 🟣 destructive
└───────────────────────────┘
```

**사양 (관리자 공통)**
- **인증·권한**: `/admin/*`는 미들웨어/세션으로 관리자만. 비인가 → 로그인 리다이렉트.
- **색인**: 전체 `robots:{index:false,follow:false}` + `robots.ts` `Disallow:/admin` (공개 SEO와 분리).
- **변이**: 등록=`createHospital` / 수정=`updateHospital` / 삭제=`deleteHospital` — repository **write 메서드** 추가(Mock→실API). Server Actions 또는 Route Handler, TanStack Query mutation으로 목록 갱신(낙관적 업데이트·invalidate).
- **유효성**: 필수(병원명·종별·진료과목·주소) + 형식(전화·좌표) 검증. zod 스키마 권장, 서버에서도 재검증.
- **폼 공유**: `HospitalForm`(등록/수정 공용), 저장 후 목록으로 리다이렉트 + 토스트.

**SEO 설정 사양 (메타 직접 제어)**
- 관리자가 병원별 **SEO 타이틀·메타 디스크립션**을 직접 입력. **비우면 데이터 기반 자동 생성값** 사용(override 우선).
- 글자수 카운터: 타이틀 권장 ≤60, 디스크립션 ≤155(초과 경고). 자동값을 placeholder/ⓘ로 안내.
- **URL = 짧은 고유 ID 자동**(`/hospitals/[id]`) — 직접 편집 불필요, 불변(301 관리 없음).
- **OG 이미지** 개별 지정(미설정 시 대표사진). **검색 노출 토글**(개별 noindex 가능).
- **검색결과 미리보기**(구글 스니펫): 입력값 실시간 반영.
- 데이터: `Hospital.seo?: { title?; description?; ogImage?; keywords?; noindex? }`.
  `generateMetadata`는 `seo.* ?? 자동생성값` 순으로 적용.

**시맨틱 구조**
```
(admin layout: 별도 header/nav — 공개 Header/Footer 미사용)
main
 ├─ 목록: h1 + 검색/필터 + table(또는 카드) + pagination
 └─ 폼:   h1 + form(fieldset[기본/위치/운영/콘텐츠/SEO] + 액션)
```

---

### 4-10. 관리자 — 건강 칼럼 CRUD (`/admin/health`, `/new`, `/[id]/edit`)

병원과 동일한 패턴(인증·noindex·변이). 콘텐츠 중심이라 **에디터 + 감수자 + SEO** 비중이 큼.

**목록 `/admin/health`**
```
┌──────────────────────────────────────────────────────────┐
│ <h1>칼럼 관리</h1>                        [+ 칼럼 작성]    │
│ 🔍[검색…] [카테고리▾][상태▾]                  총 124건    │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 제목            카테고리 감수자  상태   발행일   관리   │  │ <table>
│ │ 당뇨병 초기증상… 당뇨    김의사  게시중 06.10 [수정][삭제]│
│ │ 무릎통증 원인…   정형외과 이의사  임시저장 —   [수정][삭제]│
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```
- 상태: 게시중 / 임시저장(draft) / 숨김. 임시저장은 공개·색인 제외.

**등록/수정 폼 `/new` · `/[id]/edit`** (동일 폼, 수정은 prefill)
```
┌──────────────────────────────────────────────────────────┐
│ <h1>칼럼 작성</h1>                                        │
│ <form> (client + Server Action)                          │
│ ── 기본 ──────────────────────────                        │
│   제목 *        [____________________]                    │
│   카테고리 *    [당뇨 ▾]      태그 [+당뇨][+혈당]          │
│   대표 이미지    [⬆ 업로드]                                │
│   감수 의료진 *  [김의사 ▾] (이름·전문분야 연결)            │ 🟡 E-E-A-T
│ ── 콘텐츠 ────────────────────────                        │
│   핵심 요약      [textarea …3~4줄 불릿]                    │ 🟡 TL;DR
│   본문 *        [에디터 — h2/h3·표·이미지·링크]            │ 🟢 답변형 구조
│   출처·참고문헌  [제목][URL] [+ 추가]                      │ 🟡 신뢰 근거
│   관련 진료과목  [내분비내과 ✕] [+ 추가]                   │ 칼럼→병원 링크
│ ── SEO 설정 ──────────────────────                        │ 🟡 메타 제어(병원과 동일)
│   SEO 타이틀     [____________]  /60   (비우면 제목 기반)  │
│   메타 디스크립션 [textarea …]  /155  (비우면 요약 기반)   │
│   URL           /health/8XphQ2  (짧은 고유 ID·자동)       │
│   OG 이미지·검색노출(noindex)  + [검색결과 미리보기]        │
│ ── 발행 ──────────────────────────                        │
│   상태  (●) 게시중  ( ) 임시저장  ( ) 숨김                 │
│   [취소]                       [임시저장]   [발행]        │
│ </form>                                                   │
└──────────────────────────────────────────────────────────┘
```

**사양**
- 본문은 리치 에디터(또는 MDX) → **h2/h3 시맨틱·표·리스트** 산출(GEO).
- SEO 설정: 병원 폼과 동일(`Column.seo` override, 비우면 자동: title=제목, description=요약/excerpt).
- 변이: `createColumn`·`updateColumn`·`deleteColumn`(+`publish`/`draft` 상태). 발행 시 `publishedAt`, 수정 시 `updatedAt`/`lastReviewed` 갱신.
- 감수자 선택 → 상세의 `reviewedBy` JSON-LD에 연결.

---

## 5. 컴포넌트 인벤토리 (와이어프레임 → 컴포넌트 매핑)

> 위치 = 플랫 구조([ARCHITECTURE.md §1](./ARCHITECTURE.md)). 도메인은 `components/{도메인}` 폴더로 구분(배럴 없음).

| 컴포넌트 | 위치(폴더) | 화면 | 종류 |
|---|---|---|---|
| Header / Footer | `components/layout` | 전역 | Server |
| SearchBar | `components/search` | 홈·검색 | Server(form) |
| CategoryChips | `components/search` | 홈·검색 | Server |
| HospitalCard | `components/hospital` | 홈·검색·상세 | Server |
| HospitalList | `components/hospital` | 검색 | Server |
| HospitalGallery(슬라이드) | `components/hospital` | 상세 | **Client** |
| HospitalDetail | `components/hospital` | 상세 | Server |
| HospitalActionBar(CTA) | `components/hospital` | 상세 | **Client**(공유·저장) |
| ScrollToButtons(▲▼) | `components/ui` | 상세 | **Client**(스크롤 이동) |
| OpeningHoursTable(진료시간) | `components/hospital` | 상세 | Server |
| DoctorList(의료진) | `components/hospital` | 상세 | Server |
| ReviewSummary(리뷰) | `components/hospital` | 상세 | Server |
| Map(마커)/MapPlaceholder | `components/map` | 검색·상세 | **Client**(추후) |
| ColumnCard / ColumnList | `components/column` | 칼럼 목록 | Server |
| ColumnDetail | `components/column` | 칼럼 상세 | Server |
| TableOfContents(목차) | `components/column` | 칼럼 상세 | **Client**(스크롤스파이) |
| ShareButton(공유하기) | `components/ui` | 칼럼·병원 상세 | **Client**(카카오·복사·Web Share) |
| CategoryTabs / Pagination | `components/ui` | 칼럼 목록 | Server |
| Badge | `components/ui` | 카드·상세 | Server |
| Skeleton / EmptyState | `components/ui` | 상태화면 | Server |
| HospitalAdminTable | `components/admin` | 관리자 목록 | **Client**(선택·삭제) |
| HospitalForm(등록/수정 공용) | `components/admin` | 관리자 폼 | **Client**(변이) |
| ColumnAdminTable | `components/admin` | 관리자 목록 | **Client**(선택·삭제) |
| ColumnForm(등록/수정 공용) | `components/admin` | 관리자 폼 | **Client**(에디터·변이) |
| SeoMetaFields(공용) | `components/admin` | 병원·칼럼 폼 | **Client**(미리보기) |
| DeleteDialog(공용) | `components/ui` | 관리자 | **Client**(확인) |
| AdminHeader | `components/layout` | 관리자 전역 | Server |

---

## 6. 데이터 (어디서 오는가)

- 출처: **`api/hospital.ts` (데이터 접근) + `api/mock/`** → 실API(**심평원 HIRA 병원정보서비스 등 공공데이터**)로 교체 가능하게 추상화. 페이지가 `@/api/hospital`에서 import해 SSR 호출.
- 페이지(Server Component)가 repository를 `await` 직접 호출 → SSR 렌더.
- `Hospital` 필드: id·name·type·departments·address·**region**`{sido,sidoCd,sigungu,sgguCd,emdong?}`·location·rating·openingHours·**photos**.
- **공공데이터 매핑**: HIRA `sidoCd/sgguCd(+명)`→region, `XPos/YPos`→location, `clCd`→type, `dgsbjtCd`→departments(코드→한글 매핑 상수). 상세 [PRD §6](./PRD.md).
- **읽기**(공개): `getHospitals`·`getHospitalById`·`getAllHospitalIds`.
- **쓰기**(관리자): `createHospital`·`updateHospital`·`deleteHospital` — Server Action/Route Handler에서 호출, Mock 단계는 인메모리, 실API 전환 시 교체.

### 식별자 / URL 정책 (확정)
- **상세 페이지 = 짧은 고유 ID.** 병원·칼럼 공개 URL 모두 ID 기반.
  - `/hospitals/[id]` · `/health/[id]` (예: `/hospitals/h3Kf9aQ2`, `/health/8XphQ2`).
  - `id` = **짧은 고유 ID**(nanoid/base62 ~8–12자 또는 숫자). 풀 UUID(36자)는 URL이 길어 지양, 짧은 ID 사용.
  - id는 **불변 PK** → 내부 참조·편집 라우트(`/admin/{...}/[id]/edit`)·공개 URL에 동일 사용. 별도 slug 불필요.
- **이유**: URL 슬러그는 약한 랭킹 신호 → 키워드 랭킹은 title·h1·본문·JSON-LD가 담당. 운영 단순(중복·301 관리 불필요). 강남언니·모두닥·네이버블로그·브런치도 ID URL.
- **로컬 SEO 키워드는 랜딩이 담당**: `/area/[region]/[department]`(키워드 경로, 색인). 상세는 랜딩에서 내부링크로 연결.
- 칼럼도 동일(ID). 글의 랭킹은 제목·TL;DR·Article 구조화데이터가 끌어줌.

---

## 7. 다음 단계 (와이어프레임 확정 후)

1. 이 문서 검토·수정 → 레이아웃/계층 확정
2. 디자인 토큰(색·타이포·간격) 정의
3. 화면 구현(컴포넌트 → 페이지)
4. 네이버지도 실연동 · sitemap/robots · 실사진

---

## 관련 문서
- 기획서: [PRD.md](./PRD.md)
- 아키텍처: [ARCHITECTURE.md](./ARCHITECTURE.md)
