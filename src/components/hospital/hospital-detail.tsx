import Link from "next/link";

import {
  ActionButton,
  TagGroupItem,
  TagGroupItemLabel,
  TagGroupRoot,
} from "@seed-design/react";

import { MapPlaceholder } from "@/components/map/map-placeholder";
import { FaqAccordion } from "@/components/ui/faq-accordion";

import { HospitalMiniMap } from "./hospital-mini-map";
import { HospitalPostList } from "./hospital-post-list";
import { SectionNav } from "./section-nav";
import { TodayStatus } from "./today-status";
import { PostActions } from "@/components/hospital/post-actions";
import { isPartnerHospital } from "@/constants/partners";
import { buildAutoDescription, buildHospitalSummaryBullets } from "@/lib/hospital";
import { lineColor } from "@/lib/station";
import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

import { OpeningHoursTable } from "./opening-hours-table";

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

/** 병원 상세 — 좌측 섹션 내비 + 우측 단일 컬럼(상태·이름·사진·통계·CTA·진료시간·위치·주변) */
export function HospitalDetail({
  hospital: h,
  related = [],
  posts = [],
}: {
  hospital: Hospital;
  related?: Hospital[];
  posts?: HospitalPost[];
}) {
  const addr = h.roadAddress ?? h.address;
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${h.name} ${h.region.sigungu}`)}`;
  const st = h.nearestStation;
  const stWalk = st ? Math.max(1, Math.round(st.distanceM / 80)) : 0;
  const introText = h.description ?? buildAutoDescription(h);
  const summaryBullets = buildHospitalSummaryBullets(h);
  const hasHours = !!(h.hours && h.hours.length > 0);

  // 야간진료 여부 + 평일 마감 시각
  const weekday = (h.hours ?? []).find(
    (d) => d.day === 1 && !d.closed && d.close,
  );
  const weekdayClose = weekday?.close;
  const nightCare =
    !!h.amenities?.includes("야간진료") ||
    (h.hours ?? []).some(
      (d) =>
        d.day >= 1 &&
        d.day <= 5 &&
        !d.closed &&
        d.close &&
        parseInt(d.close, 10) >= 20,
    );

  // 사진(최대 5, 대표 먼저)
  const photos = [...(h.photos ?? [])]
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    .slice(0, 5);

  const navItems = [
    { id: "intro", label: "소개", icon: <DocDuoIcon /> },
    ...(hasHours ? [{ id: "hours", label: "진료시간", icon: <ClockDuoIcon /> }] : []),
    { id: "location", label: "위치", icon: <PinDuoIcon /> },
    ...(posts.length > 0
      ? [{ id: "posts", label: "포스팅", icon: <PostDuoIcon /> }]
      : []),
    ...(related.length > 0
      ? [{ id: "nearby", label: "주변 병원", icon: <HospitalDuoIcon /> }]
      : []),
  ];

  return (
    <article>
      <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col lg:order-2">
          {/* 소개 — 상태·이름·사진·소개·통계·주소·CTA */}
          <section id="intro" className="scroll-mt-24">
            {/* 상태 */}
            {hasHours && (
              <div className="mb-2">
                <TodayStatus hours={h.hours!} />
              </div>
            )}

            {/* 이름 + 제휴 배지 / AI요약·공유 */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-neutral sm:text-5xl">
                    {h.name}
                  </h1>
                  {isPartnerHospital(h.id) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand-weak px-2.5 py-1 text-xs font-bold text-brand">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                      제휴병원
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted">
                  {h.type} · {h.region.sigungu}
                </p>
              </div>
              <div className="shrink-0">
                <PostActions
                  title={h.name}
                  summary={summaryBullets}
                  bodyText={introText}
                  showSpeak={false}
                  showPrint={false}
                  statusSlot={
                    hasHours ? (
                      <TodayStatus hours={h.hours!} prominent />
                    ) : undefined
                  }
                />
              </div>
            </div>

            {/* 병원 사진 5칸 (없으면 플레이스홀더) */}
            <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              {photos.length > 0
                ? photos.map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={p.url}
                      alt={p.alt ?? `${h.name} 병원 사진 ${i + 1}`}
                      className="aspect-square w-full rounded-2xl object-cover"
                    />
                  ))
                : Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-2xl bg-neutral-weak"
                    />
                  ))}
            </div>

            {/* 소개 문장 */}
            <p className="mt-6 text-[15px] leading-relaxed text-neutral sm:text-base">
              {introText}
            </p>

            <hr className="my-6 border-t border-black/[0.07]" />

            {/* 3분할 통계 */}
            <div className="grid grid-cols-3 divide-x divide-black/[0.07] text-center">
              <Stat
                main={st ? `도보 ${stWalk}분` : "위치"}
                sub={
                  st
                    ? `${st.name} ${st.distanceM}m`
                    : `${h.region.sido} ${h.region.sigungu}`
                }
              />
              <Stat main={`${h.departments.length}개 과`} sub="진료과목" />
              <Stat
                main={nightCare ? "야간진료" : "평일진료"}
                sub={weekdayClose ? `평일 ${weekdayClose}까지` : "진료시간 확인"}
                brand={nightCare}
              />
            </div>

            <hr className="my-6 border-t border-black/[0.07]" />

            {/* 주소 + 진료과목 칩 */}
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-subtle">
                <PinSmallIcon />
              </span>
              <span className="text-[15px] text-neutral">{addr}</span>
            </div>
            {h.departments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
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

            {/* CTA — 전화 문의 / 길찾기 */}
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {h.phone ? (
                <ActionButton
                  asChild
                  variant="brandSolid"
                  size="large"
                  className="w-full"
                >
                  <a
                    href={`tel:${h.phone}`}
                    className="flex items-center justify-center gap-2"
                  >
                    <PhoneIcon />
                    전화 문의
                  </a>
                </ActionButton>
              ) : (
                <ActionButton
                  variant="brandSolid"
                  size="large"
                  className="w-full"
                  disabled
                >
                  전화번호 없음
                </ActionButton>
              )}
              <ActionButton
                asChild
                variant="neutralWeak"
                size="large"
                className="w-full"
              >
                <a href={naverUrl} target="_blank" rel="noopener noreferrer">
                  길찾기
                </a>
              </ActionButton>
            </div>
          </section>

          {/* 진료시간 */}
          {hasHours && (
            <section id="hours" className="mt-12 scroll-mt-24">
              <h2 className="text-lg font-bold text-neutral">진료시간</h2>
              <p className="mt-1 text-sm text-muted">
                요일별 진료시간이에요. 명절·임시 휴진은 다를 수 있어요.
              </p>
              <div className="mt-4">
                <OpeningHoursTable
                  hours={h.hours!}
                  holidayClosed={h.holidayClosed}
                />
              </div>
            </section>
          )}

          {/* 위치 */}
          <section id="location" className="mt-12 scroll-mt-24">
            <h2 className="text-lg font-bold text-neutral">위치</h2>
            <p className="mt-1 text-sm text-muted">
              지도에서 위치를 확인하고 길찾기로 바로 안내받으세요.
            </p>
            <div className="mt-4 grid gap-5 lg:grid-cols-2">
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
                    <a href={naverUrl} target="_blank" rel="noopener noreferrer">
                      길찾기
                    </a>
                  </ActionButton>
                </div>
              </div>
            </div>
          </section>

          {/* 포스팅 — 위치 아래 */}
          <HospitalPostList hospital={h} posts={posts} />

          {/* 자주 묻는 질문 */}
          {h.faqs && h.faqs.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-bold text-neutral">자주 묻는 질문</h2>
              <div className="mt-4">
                <FaqAccordion faqs={h.faqs} />
              </div>
            </section>
          )}

          {/* 주변 병원 */}
          {related.length > 0 && (
            <section id="nearby" className="mt-12 scroll-mt-24">
              <h2 className="text-lg font-bold text-neutral">이 근처 추천 병원</h2>
              <p className="mt-1 text-sm text-muted">
                같은 종별·진료과목의 가까운 병원을 거리순으로 모았어요.
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {related.map((r) => {
                  const d = distM(h.location, r.location);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/hospitals/${r.slug}`}
                        className="group flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:bg-neutral-weak"
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
            </section>
          )}

          {/* 출처 */}
          <footer className="mt-12 border-t border-black/[0.06] pt-5">
            <p className="text-xs text-subtle">
              {h.updatedAt ? `정보 업데이트: ${h.updatedAt} · ` : ""}출처
              건강보험심사평가원(HIRA)
            </p>
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

/** 3분할 통계 셀 */
function Stat({
  main,
  sub,
  brand = false,
}: {
  main: string;
  sub: string;
  brand?: boolean;
}) {
  return (
    <div className="px-2">
      <p
        className={`text-lg font-extrabold leading-tight sm:text-xl ${
          brand ? "text-brand" : "text-neutral"
        }`}
      >
        {main}
      </p>
      <p className="mt-1 text-xs text-muted sm:text-[13px]">{sub}</p>
    </div>
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

/* ── 아이콘 ── */
const duoProps = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none" } as const;
const DUO_TINT = "#D6E4FF";
const DUO_TINT2 = "#AEC8FA";
const DUO_BRAND = "#1E5BD6";

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
      <path d="M11 8.4h2v2.4h2.4v2H13v2.4h-2V12.8H8.6v-2H11Z" fill="#F0466E" />
    </svg>
  );
}
function PostDuoIcon() {
  return (
    <svg {...duoProps} aria-hidden>
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.4" fill={DUO_TINT} />
      <rect x="6" y="7.4" width="5.2" height="5.2" rx="1.2" fill={DUO_BRAND} />
      <rect x="12.6" y="8" width="4.8" height="1.8" rx="0.9" fill={DUO_TINT2} />
      <rect x="12.6" y="11" width="3.4" height="1.8" rx="0.9" fill={DUO_TINT2} />
      <rect x="6" y="15" width="11.4" height="1.8" rx="0.9" fill={DUO_BRAND} />
    </svg>
  );
}
function PinSmallIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 2.6a2 2 0 0 0-2 1.9C4.1 12 12 19.9 19.5 19.4a2 2 0 0 0 1.9-2v-2.4a1.6 1.6 0 0 0-1.4-1.6l-2.5-.34a1.6 1.6 0 0 0-1.45.53l-.95 1a13 13 0 0 1-5.5-5.5l1-.95a1.6 1.6 0 0 0 .53-1.45L10.2 4a1.6 1.6 0 0 0-1.6-1.4Z" />
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
