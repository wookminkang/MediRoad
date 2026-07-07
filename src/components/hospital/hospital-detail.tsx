import type { ReactNode } from "react";

import Link from "next/link";

import {
  ActionButton,
  Badge,
  TagGroupItem,
  TagGroupItemLabel,
  TagGroupRoot,
  Text,
} from "@seed-design/react";

import { MapPlaceholder } from "@/components/map/map-placeholder";
import { FaqAccordion } from "@/components/ui/faq-accordion";

import { HospitalMiniMap } from "./hospital-mini-map";
import { SectionNav } from "./section-nav";
import { TodayStatus } from "./today-status";
import { PostActions } from "@/components/hospital/post-actions";
import { isPartnerHospital } from "@/constants/partners";
import { buildAutoDescription, buildHospitalSummaryBullets } from "@/lib/hospital";
import { lineColor } from "@/lib/station";
import type { Hospital } from "@/types/hospital";

import { OpeningHoursTable } from "./opening-hours-table";

const TIME_AMENITIES = new Set(["야간진료", "일요일진료", "공휴일진료"]);

/** 두 좌표 간 거리(m) — Haversine */
function distM(
  a?: { lat: number; lng: number },
  b?: { lat: number; lng: number },
) {
  if (!a?.lat || !b?.lat) return null;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const fmtDist = (m: number) =>
  m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;

/** 병원 상세 — 좌측 섹션 내비 + 우측 카드 스택 레이아웃 */
export function HospitalDetail({
  hospital: h,
  related = [],
}: {
  hospital: Hospital;
  related?: Hospital[];
}) {
  const addr = h.roadAddress ?? h.address;
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${h.name} ${h.region.sigungu}`)}`;
  const st = h.nearestStation;
  const stWalk = st ? Math.max(1, Math.round(st.distanceM / 80)) : 0;
  const introText = h.description ?? buildAutoDescription(h);
  const summaryBullets = buildHospitalSummaryBullets(h);

  // 사진(최대 5, 대표 먼저) — 관리자 업로드분
  const photos = [...(h.photos ?? [])]
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    .slice(0, 5);

  const navItems = [
    { id: "intro", label: "소개", icon: <DocDuoIcon /> },
    { id: "hours", label: "진료시간", icon: <ClockDuoIcon /> },
    { id: "location", label: "위치", icon: <PinDuoIcon /> },
    ...(related.length > 0
      ? [{ id: "nearby", label: "주변 병원", icon: <HospitalDuoIcon /> }]
      : []),
  ];

  return (
    <article>
      {/* breadcrumb — 홈 › 지역 › 상호명 (진료과목 제외) */}
      <nav aria-label="경로 안내" className="mb-4">
        <Text as="span" textStyle="t3Regular" className="text-subtle">
          <Link href="/">홈</Link>
          {" › "}
          <Link href={`/area/${h.region.sigungu}`}>{h.region.sigungu}</Link>
          {" › "}
          {h.name}
        </Text>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        {/* 카드 스택 */}
        <div className="flex min-w-0 flex-col gap-10 lg:order-2">
          {/* 소개 — 상호명 헤더 → 사진 → 본문 카드 */}
          <section id="intro" className="scroll-mt-24">
            <div className="px-1">
              {h.hours && h.hours.length > 0 && (
                <div className="mb-3">
                  <TodayStatus hours={h.hours} />
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-neutral sm:text-6xl">
                    {h.name}
                  </h1>
                  {isPartnerHospital(h.id) && (
                    <Badge variant="solid" tone="brand">
                      제휴
                    </Badge>
                  )}
                </div>
                {/* AI 요약 · 공유 — 상호명 행 우측(별도 영역 차지 X) */}
                <div className="shrink-0">
                  <PostActions
                    title={h.name}
                    summary={summaryBullets}
                    bodyText={introText}
                    showSpeak={false}
                    showPrint={false}
                    statusSlot={
                      h.hours && h.hours.length > 0 ? (
                        <TodayStatus hours={h.hours} prominent />
                      ) : undefined
                    }
                  />
                </div>
              </div>
              <p className="mt-1.5 text-sm text-muted">
                {h.type} · {h.region.sigungu}
              </p>
              {h.amenities && h.amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {h.amenities.map((a) => (
                    <Badge
                      key={a}
                      variant="weak"
                      tone={TIME_AMENITIES.has(a) ? "positive" : "neutral"}
                    >
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 병원 사진 — 타이틀 아래 (있을 때만) */}
            {photos.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {photos.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={p.url}
                    alt={p.alt ?? `${h.name} 병원 사진 ${i + 1}`}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}

            <div className="mt-5 rounded-2xl bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.05] sm:p-8">
              <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
                {/* 좌: 소개 + 위치 + 진료과목 */}
                <div className="min-w-0 flex-1">
                  <p className="max-w-2xl text-[15px] leading-[1.85] text-neutral sm:text-base">
                    {introText}
                  </p>

                  {/* 위치·교통 — 아이콘 원형 행 */}
                  <div className="mt-6 space-y-3">
                    {st && (
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-weak text-brand">
                          <SubwayIcon />
                        </span>
                        <span className="text-sm text-neutral">
                          {st.name}
                          {st.exit && ` ${st.exit}번 출구`} · 도보 약 {stWalk}분 (
                          {st.distanceM}m)
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-weak">
                        <PinDuoIcon />
                      </span>
                      <span className="text-sm text-neutral">{addr}</span>
                    </div>
                  </div>

                  {/* 진료과목 — 아웃라인 칩 */}
                  {h.departments.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-1.5">
                      {h.departments.map((d) => (
                        <Link
                          key={d}
                          href={`/hospitals?department=${encodeURIComponent(d)}`}
                          className="rounded-full border border-black/[0.08] px-3 py-1 text-[13px] font-medium text-neutral transition-colors hover:border-brand hover:text-brand"
                        >
                          {d}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* 우: 연락 카드 — 구분선 기반(모바일 상단선 / 데스크탑 좌측선) */}
                <div className="shrink-0 border-t border-black/[0.06] pt-6 lg:w-64 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  {h.phone ? (
                    <>
                      <p className="text-xs font-medium text-subtle">전화 문의</p>
                      <div className="mt-1.5 flex items-center gap-2 text-neutral">
                        <span className="text-brand">
                          <PhoneIcon />
                        </span>
                        <span className="text-[1.35rem] font-bold tracking-tight">
                          {h.phone}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-2">
                        <ActionButton
                          asChild
                          variant="brandSolid"
                          size="large"
                          className="w-full"
                        >
                          <a href={`tel:${h.phone}`}>전화 문의</a>
                        </ActionButton>
                        <ActionButton
                          asChild
                          variant="neutralWeak"
                          size="large"
                          className="w-full"
                        >
                          <a
                            href={naverUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            길찾기
                          </a>
                        </ActionButton>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted">
                        전화번호 정보가 없습니다
                      </p>
                      <div className="mt-3">
                        <ActionButton
                          asChild
                          variant="brandSolid"
                          size="large"
                          className="w-full"
                        >
                          <a
                            href={naverUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            길찾기
                          </a>
                        </ActionButton>
                      </div>
                    </>
                  )}
                  {(h.links?.naverBooking || h.links?.homepage) && (
                    <div className="mt-3 flex gap-4 text-sm">
                      {h.links?.naverBooking && (
                        <a
                          href={h.links.naverBooking}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-brand"
                        >
                          예약
                        </a>
                      )}
                      {h.links?.homepage && (
                        <a
                          href={h.links.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-brand"
                        >
                          홈페이지
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 진료시간 카드 */}
          {h.hours && h.hours.length > 0 && (
            <Card
              id="hours"
              title="진료시간"
              subtitle="요일별 진료시간이에요. 명절·임시 휴진은 다를 수 있어요."
            >
              <OpeningHoursTable
                hours={h.hours}
                holidayClosed={h.holidayClosed}
              />
            </Card>
          )}

          {/* 위치 카드 — 지도 좌측 배치 */}
          <Card
            id="location"
            title="위치"
            subtitle="지도에서 위치를 확인하고 길찾기로 바로 안내받으세요."
          >
            <div className="grid gap-5 lg:grid-cols-2">
              {h.location?.lat && h.location?.lng ? (
                <HospitalMiniMap
                  lat={h.location.lat}
                  lng={h.location.lng}
                  className="h-52 w-full overflow-hidden rounded-xl"
                />
              ) : (
                <MapPlaceholder className="min-h-[13rem] rounded-xl" />
              )}
              <div className="flex flex-col gap-3">
                <p className="text-[15px] text-neutral">{addr}</p>
                {st && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {st.line && <LineBadge line={st.line} />}
                    <TagGroupRoot size="t3" tone="neutralSubtle">
                      <TagGroupItem>
                        <TagGroupItemLabel>{st.name}</TagGroupItemLabel>
                      </TagGroupItem>
                      <TagGroupItem>
                        <TagGroupItemLabel>
                          {st.exit ? `${st.exit}번 출구 ` : ""}도보 약 {stWalk}분
                        </TagGroupItemLabel>
                      </TagGroupItem>
                      <TagGroupItem tone="brand">
                        <TagGroupItemLabel
                          style={{ color: "var(--seed-color-fg-brand)" }}
                        >
                          {st.distanceM}m
                        </TagGroupItemLabel>
                      </TagGroupItem>
                    </TagGroupRoot>
                  </div>
                )}
                <div>
                  <ActionButton
                    asChild
                    variant="brandSolid"
                    size="medium"
                    className="w-full sm:w-auto"
                  >
                    <a
                      href={naverUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      길찾기
                    </a>
                  </ActionButton>
                </div>
              </div>
            </div>
          </Card>

          {/* 자주 묻는 질문 (데이터 있을 때만) */}
          {h.faqs && h.faqs.length > 0 && (
            <Card title="자주 묻는 질문">
              <FaqAccordion faqs={h.faqs} />
            </Card>
          )}

          {/* 주변 병원 카드 */}
          {related.length > 0 && (
            <Card
              id="nearby"
              title="이 근처 추천 병원"
              subtitle="같은 종별·진료과목의 가까운 병원을 거리순으로 모았어요."
            >
              <ul className="grid gap-[1.225rem] sm:grid-cols-2">
                {related.map((r) => {
                  const d = distM(h.location, r.location);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/hospitals/${r.slug}`}
                        className="group flex items-center gap-3"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-weak">
                          <HospitalDuoIcon />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-bold leading-tight text-neutral">
                            {r.name}
                          </p>
                          <div className="mt-0.5 flex">
                            <TagGroupRoot size="t3" tone="neutralSubtle">
                              <TagGroupItem>
                                <TagGroupItemLabel>{r.type}</TagGroupItemLabel>
                              </TagGroupItem>
                              <TagGroupItem>
                                <TagGroupItemLabel>
                                  {r.region.sigungu}
                                </TagGroupItemLabel>
                              </TagGroupItem>
                              {r.region.emdong && (
                                <TagGroupItem>
                                  <TagGroupItemLabel>
                                    {r.region.emdong}
                                  </TagGroupItemLabel>
                                </TagGroupItem>
                              )}
                              {d != null && (
                                <TagGroupItem tone="brand">
                                  <TagGroupItemLabel
                                    style={{
                                      color: "var(--seed-color-fg-brand)",
                                    }}
                                  >
                                    {fmtDist(d)}
                                  </TagGroupItemLabel>
                                </TagGroupItem>
                              )}
                            </TagGroupRoot>
                          </div>
                        </div>
                        <span className="shrink-0 text-subtle transition-transform group-hover:translate-x-0.5">
                          <ChevronRightIcon />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {/* 출처 푸터 */}
          <footer className="px-1 pt-1">
            <Text as="p" textStyle="t3Regular" className="text-subtle">
              {h.updatedAt ? `정보 업데이트: ${h.updatedAt} · ` : ""}출처
              건강보험심사평가원(HIRA)
            </Text>
          </footer>
        </div>

        {/* 좌측 섹션 내비 (lg 이상) */}
        <aside className="hidden lg:order-1 lg:block">
          <SectionNav items={navItems} />
        </aside>
      </div>
    </article>
  );
}

function Card({
  id,
  title,
  subtitle,
  icon,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      {/* 제목은 카드 밖 */}
      <div className="mb-3 px-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-brand">{icon}</span>}
          <Text as="h2" textStyle="t8Bold">
            {title}
          </Text>
        </div>
        {subtitle && (
          <div className="mt-1.5">
            <Text as="p" textStyle="t4Regular" style={{ color: "#6B7280" }}>
              {subtitle}
            </Text>
          </div>
        )}
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] sm:p-7">
        {children}
      </div>
    </section>
  );
}

function LineBadge({ line }: { line: string }) {
  const color = lineColor(line);
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {line}
    </span>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ── 사이드바(SectionNav) 전용 듀오톤 아이콘 (토스풍: 연한 채움 + 브랜드블루 포인트) ── */
const duoProps = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none" } as const;
const DUO_TINT = "#D6E4FF"; // 연한 블루 채움
const DUO_TINT2 = "#AEC8FA"; // 조금 진한 틴트(접힘·바닥)
const DUO_BRAND = "#1E5BD6"; // 브랜드블루 포인트

function DocDuoIcon() {
  return (
    <svg {...duoProps} aria-hidden>
      <path
        d="M6.2 2.6h6L18 8.2v11.1a2.1 2.1 0 0 1-2.1 2.1H6.2A2.1 2.1 0 0 1 4 19.3V4.7A2.1 2.1 0 0 1 6.2 2.6Z"
        fill={DUO_TINT}
      />
      <path d="M12 2.7v3.8A1.7 1.7 0 0 0 13.7 8.2H18Z" fill={DUO_TINT2} />
      <rect x="7.2" y="12" width="8" height="1.8" rx="0.9" fill={DUO_BRAND} />
      <rect x="7.2" y="15.5" width="5.4" height="1.8" rx="0.9" fill={DUO_BRAND} />
    </svg>
  );
}
function ClockDuoIcon() {
  return (
    <svg {...duoProps} aria-hidden>
      <circle cx="12" cy="12" r="9" fill={DUO_TINT} />
      <path
        d="M12 7.2v5l3.1 1.9"
        stroke={DUO_BRAND}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PinDuoIcon() {
  return (
    <svg {...duoProps} aria-hidden>
      <path
        d="M12 2.2c-3.9 0-7 3-7 6.9 0 4.9 5.5 10.6 6.4 11.6a.8.8 0 0 0 1.2 0c.9-1 6.4-6.7 6.4-11.6 0-3.9-3.1-6.9-7-6.9Z"
        fill={DUO_BRAND}
      />
      <circle cx="12" cy="9.1" r="2.6" fill="#fff" />
    </svg>
  );
}
function HospitalDuoIcon() {
  return (
    <svg {...duoProps} aria-hidden>
      <path
        d="M5 20.4V6.3A2.1 2.1 0 0 1 7.1 4.2H16.9A2.1 2.1 0 0 1 19 6.3V20.4Z"
        fill={DUO_TINT}
      />
      <rect x="3.2" y="19.5" width="17.6" height="2" rx="1" fill={DUO_TINT2} />
      <path
        d="M11 8.4h2v2.4h2.4v2H13v2.4h-2V12.8H8.6v-2H11Z"
        fill="#F0466E"
      />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={DUO_BRAND} aria-hidden>
      <path d="M6.6 2.6a2 2 0 0 0-2 1.9C4.1 12 12 19.9 19.5 19.4a2 2 0 0 0 1.9-2v-2.4a1.6 1.6 0 0 0-1.4-1.6l-2.5-.34a1.6 1.6 0 0 0-1.45.53l-.95 1a13 13 0 0 1-5.5-5.5l1-.95a1.6 1.6 0 0 0 .53-1.45L10.2 4a1.6 1.6 0 0 0-1.6-1.4Z" />
    </svg>
  );
}
function SubwayIcon() {
  return (
    <svg {...duoProps} aria-hidden>
      <rect x="5" y="3" width="14" height="14" rx="4.5" fill={DUO_TINT} />
      <rect x="7.6" y="6" width="8.8" height="4" rx="1.3" fill={DUO_BRAND} />
      <circle cx="8.8" cy="12.7" r="1.15" fill={DUO_BRAND} />
      <circle cx="15.2" cy="12.7" r="1.15" fill={DUO_BRAND} />
      <path
        d="M9 17 7.2 20.3M15 17 16.8 20.3"
        stroke={DUO_TINT2}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}
