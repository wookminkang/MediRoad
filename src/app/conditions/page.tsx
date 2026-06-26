import type { Metadata } from "next";

import { SymptomChecker } from "@/components/condition/symptom-checker";
import { SITE_URL } from "@/constants/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "증상으로 병원 찾기",
  description:
    "증상을 입력하면 어느 진료과·병원에 가야 할지 AI가 안내해 드려요. 허리디스크·두통·비염 등.",
  alternates: { canonical: `${SITE_URL}/conditions` },
};

export default function ConditionsPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-white">
      {/* 앰비언트 라이트 — 흰 배경 위 은은한 블루 빛 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-[8%] h-[520px] w-[720px] -translate-x-1/2 rounded-full blur-[140px]"
          style={{
            background: "rgba(30,91,214,0.16)",
            animation: "mediroad-drift1 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-[8%] top-[36%] h-[420px] w-[420px] rounded-full blur-[140px]"
          style={{
            background: "rgba(64,120,255,0.12)",
            animation: "mediroad-drift2 15s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[6%] top-[28%] h-[400px] w-[400px] rounded-full blur-[140px]"
          style={{
            background: "rgba(30,91,214,0.12)",
            animation: "mediroad-drift1 18s ease-in-out infinite reverse",
          }}
        />
      </div>

      <div
        className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:py-28"
        style={{ animation: "mediroad-rise 0.6s ease-out both" }}
      >
        {/* AI 아이콘 (브랜드 글로우 호흡) */}
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E5BD6] ring-1 ring-white/40"
          style={{ animation: "mediroad-aiglow 3s ease-in-out infinite" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" aria-hidden>
            <path d="M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9L12 2z" />
            <path d="M19 13l.9 2.6L22 16.5l-2.1 1L19 20l-.9-2.5L16 16.5l2.1-.9L19 13z" />
          </svg>
        </div>
        <p className="text-sm font-bold tracking-wide text-brand">AI 증상 분석</p>
        <h1 className="mt-2 text-3xl font-bold text-neutral sm:text-4xl">
          어디가 불편하세요?
        </h1>
        <p className="mt-3 text-muted">
          증상을 입력하면 어느 진료과·병원에 가야 할지 AI가 안내해 드려요.
        </p>
        <div className="mt-10">
          <SymptomChecker />
        </div>
      </div>
    </div>
  );
}
