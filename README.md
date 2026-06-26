# MediRoad (메디로드)

병원·한의원·한방병원을 **지도로 탐색**하는 의료 지도 플랫폼.

> 현재 단계: **문서 정리 완료 · 화면 구현 전.**
> 코드는 설계 골격(폴더·Provider·타입·상수)만 존재하며, 화면은 와이어프레임 확정 후 구현합니다.

## 📄 문서 (docs/)

| 문서 | 내용 |
|---|---|
| [기획서 (PRD)](./docs/PRD.md) | 제품 개요·MVP 범위·기술 결정·사용자 플로우 |
| [아키텍처](./docs/ARCHITECTURE.md) | 폴더 구조·렌더링 전략·상태 경계·SEO/GEO 체크리스트 |
| [와이어프레임](./docs/WIREFRAME.md) | 메인·병원 목록·상세 화면 (데스크탑/모바일) |
| [SEO/GEO](./docs/SEO.md) | 색인 전략·지역 랜딩·구조화 데이터 풀세트 |
| [디자인 시스템](./docs/DESIGN_SYSTEM.md) | 컬러·타이포·간격·컴포넌트 토큰 (Tailwind v4) |

## 🛠 기술 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · TanStack Query v5 · 네이버지도(예정)

## 핵심 원칙

- **SEO/GEO 최우선** — SSR/SSG + JSON-LD + 시맨틱 마크업
- **Feature 기반 아키텍처** (비-FSD)
- **반응형 동등** (모바일·데스크탑)

## 개발

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run lint    # 린트
```
