# MediRoad 기획서 (PRD)

> 메디로드(MediRoad) — 전국 병원·한의원·한방병원을 **지도로 탐색**하는 의료 지도 플랫폼.

---

## 1. 제품 개요

| 항목 | 내용 |
|---|---|
| 서비스명 | MediRoad (메디로드) |
| 한 줄 정의 | 병원·한의원·한방병원을 지도 기반으로 쉽고 빠르게 탐색하는 의료 지도 플랫폼 |
| 목표 | 위치 기반으로 적합한 병원을 즉시 찾고, 정보(진료과목·시간·위치·연락처)를 한눈에 확인 |
| 확장 방향 | 검색 → 리뷰 → 예약 → 길찾기로 단계적 확장 |

---

## 2. 핵심 제약 (설계 전반을 지배)

### 🔴 SEO / GEO 최우선
검색 유입이 서비스의 생명선. **GEO = 통합(둘 다)**:
- **① 생성형 엔진 최적화(GEO/AEO)**: ChatGPT·Perplexity 등 AI 검색이 인용하기 좋게 — 구조화 콘텐츠, `llms.txt`, Q&A형 시맨틱 마크업, 사실 기반 요약.
- **② 지역 로컬 SEO**: 병원=위치 기반 — 지역별 랜딩, `LocalBusiness`/`MedicalOrganization` 스키마, geo 메타, 지도 색인.

함의 → 페이지는 **SSR/SSG + 정확한 메타데이터 + JSON-LD** 중심. 클라이언트 렌더로 콘텐츠를 가리지 않는다.

### 시맨틱 + 계층 구조
`header/nav/main/section/article/aside/footer` 랜드마크와 명확한 heading 계층으로 검색봇이 구조를 쉽게 파악하도록 설계.

---

## 3. MVP 범위

**포함 (1차 런칭):** 검색 · 지도 · 상세 · **건강 칼럼**

| 기능 | 설명 |
|---|---|
| 병원 검색 | 키워드(병원명·증상·진료과목) + 진료과목 필터 |
| 지도 탐색 | 지도에 병원 마커 표시, 목록 ↔ 지도 동기화 |
| 병원 상세 | 사진 슬라이드·위치·연락처·진료시간·진료과목·FAQ |
| **건강 칼럼** | 의료진 감수 건강 정보 게시판(목록·카테고리·상세). **SEO/GEO 콘텐츠 허브** + 칼럼↔병원 내부링크 |
| **관리자 병원 CRUD** | 병원 등록·수정·삭제·공개상태 관리(인증 필요, `noindex`). 콘텐츠 운영 도구 |

**제외 (확장 슬롯만 확보):** 리뷰 작성 · 예약 · 길찾기 · 일반 사용자 로그인

---

## 4. 기술 결정 (확정)

| 항목 | 결정 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router) + React 19 | `params`/`searchParams`는 Promise(await) |
| 언어/스타일 | TypeScript · Tailwind CSS v4 | |
| 서버상태 | TanStack Query v5 | 클라이언트 인터랙션 보조용 (콘텐츠는 SSR) |
| 지도 | **네이버지도** (Maps JS v3) | 국내 장소·길찾기 |
| 데이터 | **Mock 시작** → repository 추상화 | 실API = **공공데이터(심평원 HIRA 병원정보서비스 등)**. region/좌표/종별/과목 필드 그대로 수용(§6) |
| 타깃 | **반응형 동등** (모바일·데스크탑) | 지도 서비스라 모바일 비중 큼 |
| 아키텍처 | **Feature 기반 (비-FSD)** | `shared` 레이어 미사용 |

---

## 5. 페이지 & 사용자 플로우

| 라우트 | 화면 | 렌더링 |
|---|---|---|
| `/` | 홈 (검색 진입 + 추천) | Static |
| `/hospitals?q=&department=` | 검색 결과 (목록 + 지도) | Dynamic (searchParams) |
| `/hospitals/[id]` | 병원 상세 | SSG |
| `/area/[region]`, `/area/[region]/[dept]` | 지역·진료과목 랜딩 (로컬 SEO) | SSG |
| `/health`, `/health/category/[c]` | 건강 칼럼 게시판 | Static/ISR |
| `/health/[id]` | 건강 칼럼 상세 (의료진 감수) | SSG/ISR |
| `/admin/hospitals`, `/new`, `/[id]/edit` | 관리자 병원 CRUD (인증·noindex) | Dynamic·auth |

**핵심 플로우**
```
홈 검색바 입력 / 진료과목 칩 클릭
      ↓ (form GET)
/hospitals?q=강남&department=정형외과   ← 필터는 URL에
      ↓ 지도 마커 + 목록(상호 하이라이트)
/hospitals/[id]   ← 카드 클릭 → 상세
```

---

## 6. 데이터 모델 (요약)

`Hospital`: id · name · type(병원/의원/한방병원/한의원/치과/약국) · departments(진료과목) · **region** · address · roadAddress · location(lat/lng) · phone · isOpenNow

### 지역(region) 정규화 — 확정

출처는 **공공데이터(심평원 HIRA 병원정보서비스 등)**이며, 지역은 **시도·시군구가 코드+명칭으로 분리**되어 내려온다. 이 구조를 그대로 수용한다.

```ts
region: {
  sido: string;       // 시도명     예) "서울"     ← HIRA sidoCdNm
  sidoCd: string;     // 시도 코드               ← HIRA sidoCd
  sigungu: string;    // 시군구명   예) "강남구"   ← HIRA sgguCdNm
  sgguCd: string;     // 시군구 코드(정합·중복방지 키) ← HIRA sgguCd
  emdong?: string;    // 읍면동명   예) "역삼동"   ← HIRA emdongNm
}
```

- **`/area` URL 세그먼트 = 시군구명**(`/area/강남구`), **내부 정합/중복 방지 키 = `sgguCd`**.
- **동명 시군구**(예: 여러 "중구")는 `sgguCd`로 구분. 충돌 시 URL을 `/area/서울-중구`로 확장 가능.
- HIRA 필드 직접 매핑: 좌표 `XPos/YPos → location`, 종별 `clCd/clCdNm → type`, 진료과목 `dgsbjtCd → departments`.
- **진료과목 코드→한글 매핑 상수** 필요(`constants`). 병원별 진료과목 목록은 기본 목록 API가 아니라 **별도 상세 조회**가 필요할 수 있음.

> 상세 정의는 `src/types/hospital.ts`. 화면 구현 시 rating·photos·openingHours 등 표시용 필드 확장 예정.

---

## 7. 비범위 / 향후 과제

- 리뷰·예약·길찾기·인증 (확장 단계)
- 실데이터 연동(공공데이터 API 등)
- 네이버지도 실연동 · `sitemap.ts` · `robots.ts` · `llms.txt`

---

## 관련 문서
- 아키텍처: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 와이어프레임: [WIREFRAME.md](./WIREFRAME.md)
