import type { Metadata } from "next";
// Seed Design 토큰 + 컴포넌트 스타일 (CSS @layer 기반 — Tailwind와 캐스케이드 공존)
// all.layered = seed-base(토큰) + seed-components(레시피). base만 쓰면 컴포넌트가 미스타일링됨.
import "@seed-design/css/all.layered.css";
import "./brand.css"; // MediRoad 브랜드 색(메디컬 블루) — Seed brand 토큰 오버라이드(unlayered)
import "./globals.css"; // Pretendard 폰트 포함
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MediRoad — 병원·한의원·한방병원 지도",
    template: `%s | ${SITE_NAME}`,
  },
  description: "병원·한의원·한방병원을 지도로 탐색하는 의료 지도 플랫폼",
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, locale: "ko_KR", type: "website" },
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
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <SkipLink />
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <ChromeOnMap>
            <Footer />
          </ChromeOnMap>
        </AppProviders>
      </body>
    </html>
  );
}
