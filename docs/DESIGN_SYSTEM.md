# MediRoad 디자인 시스템 — Seed Design 채택

> **당근(Daangn) Seed Design**(`@seed-design/react`)을 컴포넌트·토큰 기반으로 채택.
> Next 16 + SSR 동작 검증 완료(`seed-test` 라우트). 레이아웃·커스텀은 Tailwind v4 병행.

---

## 1. 설치 & 세팅 (검증됨)

```bash
npm install @seed-design/react @seed-design/css
```
- `@seed-design/react@1.2.14` (peer: `@seed-design/css >=1.1.17`, react >=18). 내부적으로 Radix 유틸 사용.

**`src/app/layout.tsx`** (적용 완료):
```tsx
// all.layered = seed-base(토큰) + seed-components(레시피). CSS @layer → Tailwind와 공존.
import "@seed-design/css/all.layered.css";
import "./globals.css";                      // 그 뒤에 Tailwind

<html lang="ko" data-seed data-seed-color-mode="light-only"> … </html>
```

> ⚠️ **CSS는 반드시 수동 import해야 한다 (검증됨).**
> `@seed-design/react`는 컴포넌트 안에서 CSS를 **import하지 않는다**(lib 내 `.css` 참조 0개).
> `package.json`의 `sideEffects: ["*.css"]`는 "css를 트리셰이킹하지 말라"는 번들러 힌트일 뿐,
> 자동 주입 기능이 **아니다**. 따라서:
> - `base.layered.css` = `@layer seed-base` (토큰만, ~37KB) → **컴포넌트 미스타일링**
> - `all.layered.css` = `seed-base` + `seed-components`(레시피 전체, ~251KB min) → **정상 스타일**
>
> **CSS 적용 전략 (결정):** 현재는 정확성 우선으로 `all.layered.css` 일괄 import.
> 추후 성능 최적화 시 사용하는 컴포넌트의 레시피만 골라 import 가능:
> `import "@seed-design/css/recipes/action-button.layered.css"` (컴포넌트별 파일 존재).

- **테마 속성**: `data-seed-color-mode`(`system`|`light-only`|`dark-only`) + `data-seed-user-color-scheme`(`light`|`dark`) + `data-seed-platform`(`ios`…).
- **다크모드 정책: light-only 확정 (v1).** 의료 플랫폼 특성상 라이트 고정. `<html data-seed-color-mode="light-only">` 유지.
  - 🧹 정리 필요: `ThemeProvider`가 light/dark/system을 지원하나 light-only와 어긋남 → **ThemeProvider의 다크 로직 제거 또는 light 고정으로 단순화** 대상.
  - 향후 다크 도입 시: `data-seed-color-mode="system"` + `@seed-design/css/theming`의 `generateThemingScript({mode})`를 `<head>` 인라인 주입(FOUC 방지).
- **SSR/SEO**: Seed 컴포넌트는 전부 `"use client"` 내장이지만 SSR로 HTML이 그려지므로(서버에서 렌더 후 hydration) SEO 영향 없음. Server Component 안에서 직접 import 가능(자동 클라이언트 경계).

---

## 2. 스타일 전략 & 규칙 (Seed + Tailwind 공존)

역할 분담:

| 용도 | 사용 |
|---|---|
| **UI 컴포넌트** (버튼·배지·시트·필드·다이얼로그…) | **Seed `@seed-design/react`** |
| **레이아웃·간격·반응형·커스텀** | **Tailwind v4** |
| **디자인 토큰**(색·간격·radius) | **Seed `@seed-design/css/vars`** 우선, 부족분만 Tailwind |

### 규칙 (반드시 준수)

1. **Seed 컴포넌트 우선 (Seed-first).** 버튼·배지·칩·시트·다이얼로그·폼 입력 등 UI 요소는
   Seed에 있으면 **반드시 Seed 컴포넌트를 쓴다.** Tailwind로 버튼을 새로 만들거나
   `<button className="...">`로 재구현하는 것 **금지.** 3번 섹션 매핑표를 먼저 확인.

2. **Seed에 없을 때만 직접 제작.** 매핑표에 없는 요소만 Tailwind/커스텀으로 만들되,
   그때도 색·radius·간격은 Seed 토큰(규칙 4)을 따른다.

3. **Tailwind의 역할 = 배치(layout)지 외형(skin)이 아니다.** Tailwind는
   `flex`/`grid`/`gap`/`max-w`/`px` 같은 **레이아웃·간격·반응형 유틸**에만 쓴다.
   Seed 컴포넌트의 색·테두리·그림자 등 **외형을 Tailwind로 덮어쓰지 않는다.**
   레이아웃조차 Seed `Box`/`Flex`/`Stack`/`Grid`가 있으면 그쪽을 우선 고려.

4. **색·타이포·radius는 Seed 토큰만.** Tailwind 임의 색(`bg-blue-500`, `text-[#xxx]`) 금지.
   배경은 `bg/*`(예 `bg/brand-solid`, `bg/layer-default`), 전경은 `fg/*`(예 `fg/neutral`, `fg/brand`)
   토큰을 사용. 토큰 목록은 5번 섹션 / `@seed-design/css/vars` 참고.

5. **캐스케이드 레이어 순서.** import 순서상 `seed-base → seed-components → tailwind`라
   동일 명시도면 **Tailwind 유틸이 Seed 컴포넌트 스타일을 이긴다.** 즉 레이아웃 보정은
   Tailwind 클래스로 가능하되, 이를 외형 오버라이드 수단으로 악용하지 말 것(규칙 3).

6. **컴파운드 컴포넌트는 namespace로.** `Chip` 등 일부는 `<Chip>` 직접 사용 불가 →
   `Chip.Root`/`Chip.Label` 형태(3번 섹션 주석 참고).

7. **당근 전용 컴포넌트 미사용.** `MannerTemp`, `Celsius`, `ReactionButton` 등 당근 서비스
   전용 요소는 MediRoad에서 쓰지 않는다.

8. **버튼 높이는 size로만, CTA는 large 고정.** 버튼 높이를 화면마다 임의로 만들지 않는다.
   CTA(주요 행동)는 항상 `size="large"`(52px). 상세는 3번 섹션 「버튼 사이즈 & CTA 규칙」.

---

## 3. 컴포넌트 매핑 (와이어프레임 인벤토리 → Seed)

| 와이어프레임 요소 | Seed 컴포넌트 |
|---|---|
| 버튼(검색·저장·CTA·삭제) | `ActionButton` — variant: `brandSolid`(기본)/`neutralSolid`/`neutralWeak`/`criticalSolid`/`brandOutline`/`neutralOutline`/`ghost` · size: `xsmall`/`small`/`medium`(기본)/`large` · layout: `withText`(기본)/`iconOnly` |
| 영업중/카테고리 배지 | `Badge` — variant: `solid`/`weak`/`outline` · tone: `brand`/`positive`/`warning`/`critical`/`neutral`/`informative` · size: `medium`/`large` |
| 진료과목·카테고리 칩/탭 | `Chip`*, `ChipTabs`, `ActionChip`, `ControlChip`, `SegmentedControl` |
| 모바일 검색결과 바텀시트 | `BottomSheet`, `BottomSheetHandle` |
| 공유·정렬 등 시트 메뉴 | `ActionSheet`, `ExtendedActionSheet`, `MenuSheet` |
| 삭제 확인 모달 | `Dialog` |
| 관리자 폼 입력 | `Field`, `Fieldset`, `FieldButton`, `Checkbox`, `RadioGroup`/`RadioGroupField`, `SelectBox`, `Slider` |
| 토스트/안내 | `Snackbar`, `Callout`, `InlineBanner`, `PageBanner` |
| 로딩/스켈레톤 | `Skeleton`, `ContentPlaceholder`, `LoadingIndicator`, `ProgressCircle` |
| 플로팅(▲▼·FAB) | `Fab`, `FloatingActionButton`, `ContextualFloatingButton` |
| 이미지/비율 | `AspectRatio`, `ImageFrame` |
| 레이아웃 | `Box`, `Flex`, `Grid`/`GridItem`, `Columns`, `Inline`, `Divider`, `List` |
| 아바타·아이콘 | `Avatar`, `Icon` |

> *`Chip`·일부는 **컴파운드(namespace) 컴포넌트** — `Chip.Root`/`Chip.Label` 식으로 사용(직접 `<Chip>` JSX 불가).
> 🚫 당근 전용(미사용): `MannerTemp`, `Celsius`, `ReactionButton` 등.

#### ✅ 버튼 사이즈 & CTA 규칙 (정의 v1)

ActionButton 높이는 size로만 정해진다(고정값). **버튼마다 높이를 임의로 만들지 않는다.**

| size | 높이 | 용도 |
|---|---|---|
| `xsmall` | 32px | 인라인 보조(태그 옆 등) |
| `small` | 36px | 조밀한 영역의 보조 액션 |
| `medium`(기본) | 40px | 일반 액션 |
| **`large`** | **52px** | **CTA 전용** |

- **CTA(주요 행동: 검색·길찾기·예약/문의·저장 등)는 항상 `size="large"`(52px) 고정.**
- **주 CTA variant = `brandSolid`**(메디컬 블루). 보조 = `neutralWeak`/`neutralOutline`, 위험(삭제) = `criticalSolid`.
- 한 화면에서 같은 위계의 버튼은 **같은 size** 사용(높이 들쭉날쭉 금지).
- 풀폭 CTA: `<ActionButton size="large">` + 컨테이너에 `w-full`(레이아웃은 Tailwind, 외형은 Seed).
- 🚫 Tailwind `h-[…]`로 버튼 높이 강제 금지(규칙 3) — 높이는 Seed size로만 제어.

```tsx
// 주 CTA 예시
<ActionButton variant="brandSolid" size="large">길찾기</ActionButton>
```

---

## 4. 디자인 토큰 (Foundations) — 검증됨

모든 토큰은 CSS 변수 `--seed-*`로 노출(`@seed-design/css/all.layered.css`에 포함).
TS 상수로 쓰려면 `@seed-design/css/vars/{color,radius,dimension,font-size,...}`. **임의 하드코딩 값 대신 아래 토큰만 사용한다.**

### 4-1. 색 (`--seed-color-*`, 536개)
의미 기반(semantic) 토큰 우선 사용. MCP `retrieve_color_variable_names`로 전체 조회 가능.

| 스코프 | 변수 예시 | 용도 |
|---|---|---|
| `bg/*` | `--seed-color-bg-brand-solid`, `--seed-color-bg-layer-default`, `--seed-color-bg-neutral-weak`, `--seed-color-bg-disabled` | 배경 |
| `fg/*` | `--seed-color-fg-neutral`, `--seed-color-fg-neutral-muted`, `--seed-color-fg-brand`, `--seed-color-fg-critical` | 전경(텍스트·아이콘) |
| `stroke/*` | `--seed-color-stroke-neutral`, `--seed-color-stroke-brand` | 테두리·구분선 |
| `palette/*` | 원시 팔레트 | semantic 부족 시에만 |

- 톤 체계: `brand`/`neutral`/`positive`/`warning`/`critical`/`informative`/`magic` × `solid`/`weak` × `-pressed` 상태.
- 레이어 배경: `layer-basement`/`layer-default`/`layer-fill`/`layer-floating` (깊이 표현).

### 4-2. 타이포그래피 — `Text` 컴포넌트로 적용
직접 `font-size`를 쓰지 말고 **`<Text textStyle="..." as="...">`** 사용 (스케일 + line-height 일괄 적용).
**시맨틱 분리(SEO 필수):** `as`로 `h1~h6`/`p`/`span`/`strong` 등 실제 태그를 지정하고,
`textStyle`로 시각 크기를 따로 정한다. → 제목 위계(h1·h2…)와 보이는 크기를 독립적으로 제어.

```tsx
import { Text } from "@seed-design/react";
<Text as="h1" textStyle="t8Bold">서울내과의원</Text>          // 페이지 타이틀
<Text as="p"  textStyle="t5Regular" style={{ color: "var(--seed-color-fg-neutral-muted)" }}>
  강남구 · 내과 · 영업중
</Text>                                                        // 보조 타이틀
```

**Seed 타입 스케일(실측):** t1=11 · t2=12 · t3=13 · t4=14 · **t5=16(기본 본문)** · t6=18 · t7=20 · t8=22 · t9=24 · t10=26 (px). 각 레벨 × `Regular`(400)/`Medium`(500)/`Bold`(700).
`*Static*` 변형 = 사용자 글자배율 비반응(고정). 일반 UI는 비-Static 사용.

#### ✅ MediRoad 텍스트 역할(Role) — 페이지 공통 (정의 v1, 웹 16px 기준)

| 역할 | 태그(`as`) | `textStyle` | 크기/두께 | 색 토큰 |
|---|---|---|---|---|
| **페이지 타이틀** (H1) | `h1` | `t8Bold` | 22 / 700 | `fg/neutral` |
| **보조 타이틀** (타이틀 하단 설명) | `p` | `t5Regular` | 16 / 400 | `fg/neutral-muted` |
| 섹션 타이틀 (H2) | `h2` | `t7Bold` | 20 / 700 | `fg/neutral` |
| 하위 제목 (H3) | `h3` | `t6Bold` | 18 / 700 | `fg/neutral` |
| 본문 | `p` | `t5Regular` | 16 / 400 | `fg/neutral` |
| 본문 강조 | `span`/`strong` | `t5Medium` | 16 / 500 | `fg/neutral` |
| 캡션·메타 (거리·영업시간) | `span` | `t4Regular` | 14 / 400 | `fg/neutral-muted` |
| 라벨 (폼·태그) | `span` | `t4Medium` | 14 / 500 | `fg/neutral` |
| 약한 보조 (저작권 등) | `span` | `t3Regular` | 13 / 400 | `fg/neutral-subtle` |

- 색 위계: `fg/neutral`(기본) > `fg/neutral-muted`(보조) > `fg/neutral-subtle`(가장 약함). 브랜드 강조는 `fg/brand`, 경고/삭제는 `fg/critical`.
- **데스크톱 확대(옵션):** 큰 화면에서 타이틀을 키우려면 브레이크포인트로 `textStyle` 교체(예 H1 `t8Bold`→`md:t9Bold`). 기본은 단일 사이즈로 단순 유지.
- 옵션 props: `maxLines`(`single`/`multi` 말줄임), `textDecorationLine`(`underline`/`line-through`).

### 4-3. 간격 & 페이지 수직 리듬 (`--seed-dimension-*`)

**4px 그리드 단일 기준.** Seed `xN = N×4px`이고 **Tailwind v4 기본 간격도 4px 그리드라 1:1로 일치**한다
→ 레이아웃 간격은 **Tailwind 유틸로 적용하되, 아래 허용 step만 사용**(임의 px·`mt-[13px]` 금지).

| Tailwind | px | = Seed |
|---|---|---|
| `1` | 4 | x1 | `2` | 8 | x2 |
| `3` | 12 | x3 | `4` | 16 | x4 |
| `5` | 20 | x5 | `6` | 24 | x6 |
| `8` | 32 | x8 | `10` | 40 | x10 |
| `14` | 56 | x14 | `16` | 64 | x16 |

#### ✅ MediRoad 페이지 여백 규칙 (정의 v1) — 모든 페이지 동일 적용

```
[헤더]
  ↕ 24 (pt-6)        페이지 상단 → 타이틀 영역
┌─ 타이틀 영역 ──────────────┐
│  H1 페이지 타이틀           │
│  ↕ 6 (mt-1.5)   타이틀 → 보조타이틀
│  보조 타이틀                │
└────────────────────────────┘
  ↕ 24 (mt-6)   ★ 타이틀 영역 → 콘텐츠 영역 (고정)
┌─ 콘텐츠 영역 ──────────────┐
│  섹션                       │
│  ↕ 32 (gap-8)  섹션 ↔ 섹션  │
│  섹션                       │
└────────────────────────────┘
  ↕ 56 (pb-14)       페이지 하단 여백
```

| 구간 | 값(px) | Tailwind |
|---|---|---|
| 화면 좌우 거터 | 모바일 16 / 데스크톱 24 | `px-4 md:px-6` |
| 페이지 상단 → 타이틀 영역 | 24 | `pt-6` |
| 타이틀 → 보조 타이틀 | 6 | `mt-1.5` |
| **★ 타이틀 영역 → 콘텐츠 영역** | **24** | `mt-6` |
| 섹션 ↔ 섹션 | 32 | `gap-8` (또는 `space-y-8`) |
| 섹션 타이틀 → 섹션 본문 | 12 | `mt-3` |
| 본문 문단 사이 | 8 | `gap-2` |
| 리스트/카드 아이템 사이 | 12 | `gap-3` |
| 카드 내부 패딩 | 16 | `p-4` |
| 페이지 하단 여백 | 56 | `pb-14` |

> **일관성 보장(다음 스텝):** 위 리듬을 공유 레이아웃 컴포넌트로 강제한다 —
> `<PageContainer>`(거터·상하 패딩) + `<PageHeader title subtitle>`(타이틀 영역 + 콘텐츠 간 `mt-6` 내장).
> 페이지마다 직접 마진을 쓰지 말고 이 컴포넌트를 통해 동일 여백을 재사용.

- Seed 의미 간격 토큰(참고): `spacing-x-global-gutter`(=16), `spacing-y-nav-to-title`(=20), `spacing-y-screen-bottom`(=56), `spacing-y-between-text`(=6).

### 4-4. 모서리 (`--seed-radius-*`)
`r0`(0) `r1 r2 r3 r4 r5 r6`(점증) `full`(원형). 카드·버튼 등은 토큰 사용, 임의 px 금지.

### 4-5. 그림자 (`--seed-shadow-*`)
`s1`(약) `s2` `s3`(강). floating/elevated 표면에 사용.

> **Tailwind 연동(권장 셋업, 미적용):** `globals.css`의 `@theme`에 Seed 토큰을 매핑하면
> Tailwind 유틸로도 토큰을 쓸 수 있다 — 예 `--color-brand: var(--seed-color-bg-brand-solid)` → `bg-brand`.
> 이 매핑 정의 여부는 [다음 스텝]에서 결정.

---

## 5. 브랜딩 (MediRoad 메디컬 블루) — 확정 v1

**메인 컬러: 메디컬 블루 `#1E5BD6`** (차분·신뢰·전문). Seed 기본 brand(당근 carrot 주황)를
brand 계열 semantic 토큰만 블루로 오버라이드. 나머지 톤(neutral/critical/positive…)은 Seed 기본 유지.

**적용 위치:** `src/app/brand.css` (unlayered → seed-base 레이어를 항상 이김) → `layout.tsx`에서
`all.layered.css` 다음에 import. 라이트 고정이라 `[data-seed]`에 일괄 적용.

| 토큰 | 값 | 용도 |
|---|---|---|
| `bg/brand-solid` | `#1E5BD6` | 메인 버튼/CTA 배경 |
| `bg/brand-solid-pressed` | `#1A4FBD` | 눌림 |
| `bg/brand-weak` | `#EAF0FC` | 연한 틴트 배경(선택 칩·강조 영역) |
| `bg/brand-weak-pressed` | `#D8E3F8` | 연한 틴트 눌림 |
| `fg/brand` | `#1E5BD6` | 브랜드 텍스트·아이콘·링크 |
| `fg/brand-contrast` | `#1A4FBD` | weak 배경 위 진한 브랜드 텍스트 |
| `stroke/brand-solid` | `#1A4FBD` | 브랜드 테두리 |
| `stroke/brand-weak` | `#B9CDF2` | 연한 브랜드 테두리 |

- 사용법: 직접 hex 쓰지 말고 위 **토큰**(또는 `<ActionButton variant="brandSolid">` 등 Seed 컴포넌트)을 통해 사용.
- 흰 글씨 on `#1E5BD6` 대비 ≈ 6.2:1 → WCAG AA 통과.
- 보조/강조색(예: 영업중 positive 등)은 Seed 기본 의미색 사용. 별도 서브 브랜드색은 현재 미도입.

---

## 6. 접근성
- Seed 컴포넌트는 Radix 기반 접근성 내장(포커스·키보드·ARIA). 커스텀 영역도 동일 기준(대비 AA·focus-visible·터치 44px) 유지.
- 시맨틱 태그 구조(WIREFRAME)는 그대로 — Seed는 UI 요소, 페이지 골격은 우리 시맨틱 마크업.

---

## 7. 검증 상태
- ✅ 설치 + Next 16 빌드 + SSR 렌더 확인(`/seed-test`).
- ✅ **CSS 적용 정정**: 기존엔 `base.layered.css`(토큰만)만 import → 컴포넌트 레시피 CSS 누락(미스타일링)이었음.
  `all.layered.css`로 교체해 실제 스타일 적용되도록 수정.
- 다음: 브랜드 테마 적용 · 컴포넌트별 실제 적용(폼·시트·다이얼로그) · `seed-test` 정리 · (성능) 레시피 선택 import 전환 검토.

---

## 관련 문서
- 기획: [PRD.md](./PRD.md) · 아키텍처: [ARCHITECTURE.md](./ARCHITECTURE.md) · 와이어프레임: [WIREFRAME.md](./WIREFRAME.md) · SEO/GEO: [SEO.md](./SEO.md)
