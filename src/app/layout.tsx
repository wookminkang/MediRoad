import type { Metadata, Viewport } from "next";
// Seed Design 토큰 + 컴포넌트 스타일 (CSS @layer 기반 — Tailwind와 캐스케이드 공존)
// all.layered = seed-base(토큰) + seed-components(레시피). base만 쓰면 컴포넌트가 미스타일링됨.
import "@seed-design/css/all.layered.css";
import "./brand.css"; // MediRoad 브랜드 색(메디컬 블루) — Seed brand 토큰 오버라이드(unlayered)
import "./globals.css"; // Pretendard 폰트 포함
import { BottomNav } from "@/components/layout/bottom-nav";
import { ChromeOnMap } from "@/components/layout/chrome-on-map";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SkipLink } from "@/components/layout/skip-link";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import AppProviders from "@/providers/app-providers";

const GOOGLE_VERIFY = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const NAVER_VERIFY =
  process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ??
  "9300c3be7933bbd4a0ef49326fb4f0673be37dd9";

const SITE_DESCRIPTION =
  "전국 병원·의원·치과·한의원·한방병원을 지도에서. 위치·진료시간·진료과목·야간진료를 한눈에 확인하고 가까운 병원을 빠르게 찾으세요.";

// 모바일에서 인풋 포커스 시 자동 확대(iOS) 및 핀치 줌 차단
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "메디로드 - 내 주변 병원 찾기 | 진료시간·야간진료 지도",
    template: "%s | 메디로드",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "병원 찾기",
    "내 주변 병원",
    "병원 지도",
    "진료시간",
    "야간진료",
    "지금 문 연 병원",
    "동네 병원",
    "진료과목별 병원",
    "치과",
    "한의원",
    "한방병원",
    "메디로드",
  ],
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    url: SITE_URL,
    title: "메디로드 - 내 주변 병원 찾기 | 진료시간·야간진료 지도",
    description: SITE_DESCRIPTION,
  },
  ...((GOOGLE_VERIFY || NAVER_VERIFY) && {
    verification: {
      ...(GOOGLE_VERIFY && { google: GOOGLE_VERIFY }),
      ...(NAVER_VERIFY && {
        other: { "naver-site-verification": NAVER_VERIFY },
      }),
    },
  }),
};

// 사이트 전역 구조화 데이터 — WebSite + 사이트링크 검색창(SearchAction)
const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "ko-KR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/hospitals?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      data-seed
      data-seed-color-mode="light-only"
      className="h-full antialiased"
    >
      <head>
        {/* 네이버 지도 스크립트 로드 가속 (지도 페이지 체감속도) */}
        <link rel="preconnect" href="https://oapi.map.naver.com" />
        <link rel="dns-prefetch" href="https://oapi.map.naver.com" />
        {/* 사이트 전역 구조화 데이터 — WebSite + 검색창 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }}
        />
      </head>
      {/*
       * 앱 쉘 — 데스크톱에서도 모바일 UI를 좁은 칸에 그대로. (강남언니 패턴)
       * 폭은 globals.css의 --app-shell-max 한 곳에서 정한다.
       * 바깥은 배경색, 안쪽 칸이 앱 화면. 쉘 폭이 좁으므로
       * ≥768(md/lg/xl)을 가정한 레이아웃은 이 코드베이스에서 쓰지 않는다.
       */}
      {/* 쉘 바깥 배경 — Seed가 body 배경을 흰색으로 잡아 Tailwind 클래스가 밀린다. 인라인으로 확정 */}
      <body className="min-h-full" style={{ backgroundColor: "#EDF0F4" }}>
        <AppProviders>
          <SkipLink />
          {/* 폭은 인라인으로 — 임의값 클래스 생성에 기대지 않고 CSS 변수 한 곳(globals.css)만 본다 */}
          <div
            className="mx-auto flex min-h-dvh w-full flex-col bg-white"
            style={{ maxWidth: "var(--app-shell-max)" }}
          >
            <Header />
            <main id="main" className="flex-1">
              {children}
            </main>
            <ChromeOnMap>
              <Footer />
            </ChromeOnMap>
            {/* 하단 탭바 — fixed지만 .shell-fixed로 쉘 폭에 갇힌다. 지도에서는 스스로 렌더 안 함 */}
            <BottomNav />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
