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
import AppProviders from "@/providers/app-providers";

export const metadata: Metadata = {
  title: "MediRoad",
  description: "병원·한의원·한방병원을 지도로 탐색하는 의료 지도 플랫폼",
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
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <SkipLink />
          <ChromeOnMap>
            <Header />
          </ChromeOnMap>
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
