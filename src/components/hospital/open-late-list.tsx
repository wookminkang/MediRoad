import Link from "next/link";

import { Badge, Text } from "@seed-design/react";

import type { OpenLateHospital } from "@/api/hospital";

/**
 * 야간·일요일 진료 병원 목록.
 *
 * 목록 자체가 콘텐츠다. AI가 이 페이지를 인용할 때 "○○구에서 밤 늦게까지 하는 병원은
 * A, B, C"라고 병원 이름과 진료시간을 그대로 가져간다. 그래서 이름·시간·전화를 전부
 * 텍스트로 노출한다(이미지·JS 뒤에 숨기지 않는다).
 */
export function OpenLateList({
  regionLabel,
  kind,
  items,
  updatedLabel,
}: {
  regionLabel: string;
  kind: "night" | "sunday";
  items: OpenLateHospital[];
  updatedLabel: string;
}) {
  const heading =
    kind === "night"
      ? `${regionLabel} 야간진료 병원`
      : `${regionLabel} 일요일 진료 병원`;
  const lead =
    kind === "night"
      ? `${regionLabel}에서 평일 저녁 8시 이후까지 진료하는 병원 ${items.length}곳입니다. 늦게 닫는 순으로 정리했습니다.`
      : `${regionLabel}에서 일요일에 진료하는 병원 ${items.length}곳입니다.`;

  return (
    <article>
      <nav aria-label="경로 안내" className="mb-3">
        <Text as="span" textStyle="t3Regular" className="text-subtle">
          <Link href="/">홈</Link>
          {" › "}
          <Link href="/area">지역별</Link>
          {" › "}
          {regionLabel}
        </Text>
      </nav>

      <header>
        <Badge size="medium" variant="weak" tone="brand">
          {kind === "night" ? "야간진료" : "일요일 진료"}
        </Badge>
        <Text as="h1" textStyle="t8Bold" className="mt-3">
          {heading} {items.length}곳
        </Text>
        <Text as="p" textStyle="t5Regular" className="mt-3 text-muted">
          {lead}
        </Text>
        <Text as="p" textStyle="t3Regular" className="mt-2 text-subtle">
          {updatedLabel} 기준 · 보건복지부·건강보험심사평가원 공공데이터. 명절·임시
          휴진은 반영되지 않을 수 있으니 방문 전 전화로 확인하세요.
        </Text>
      </header>

      <ul className="mt-8 flex flex-col gap-3">
        {items.map((h, i) => (
          <li
            key={h.id}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-subtle">
                    {i + 1}
                  </span>
                  <Link
                    href={`/hospitals/${h.slug}`}
                    className="text-[17px] font-bold text-neutral hover:text-brand"
                  >
                    {h.name}
                  </Link>
                </div>
                <Text as="p" textStyle="t3Regular" className="mt-1 text-subtle">
                  {h.type}
                  {h.station ? ` · ${h.station}` : ""}
                </Text>
                {h.address && (
                  <Text
                    as="p"
                    textStyle="t3Regular"
                    className="mt-0.5 text-subtle"
                  >
                    {h.address}
                  </Text>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-brand-weak px-3 py-1.5 text-sm font-bold text-brand">
                {h.hoursLabel}
              </span>
            </div>

            {h.phone && (
              <a
                href={`tel:${h.phone}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-neutral"
              >
                <PhoneIcon />
                {h.phone}
              </a>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

function PhoneIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
