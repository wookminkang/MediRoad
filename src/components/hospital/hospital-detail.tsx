import type { ReactNode } from "react";

import Link from "next/link";

import {
  ActionButton,
  ActionChip,
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
import { isPartnerHospital } from "@/constants/partners";
import { buildAutoDescription } from "@/lib/hospital";
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
  const dept = h.departments[0];
  const addr = h.roadAddress ?? h.address;
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${h.name} ${h.region.sigungu}`)}`;
  const st = h.nearestStation;
  const stWalk = st ? Math.max(1, Math.round(st.distanceM / 80)) : 0;

  // 사진(최대 5, 대표 먼저) — 관리자 업로드분
  const photos = [...(h.photos ?? [])]
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    .slice(0, 5);

  const navItems = [
    { id: "intro", label: "소개", icon: <DocIcon /> },
    { id: "hours", label: "진료시간", icon: <ClockMiniIcon /> },
    { id: "location", label: "위치", icon: <PinMiniIcon /> },
    ...(related.length > 0
      ? [{ id: "nearby", label: "주변 병원", icon: <BuildingIcon /> }]
      : []),
  ];

  return (
    <article>
      {/* breadcrumb */}
      <nav aria-label="경로 안내" className="mb-4">
        <Text as="span" textStyle="t3Regular" className="text-subtle">
          <Link href="/">홈</Link>
          {" › "}
          <Link href={`/area/${h.region.sigungu}`}>{h.region.sigungu}</Link>
          {dept && (
            <>
              {" › "}
              <Link href={`/area/${h.region.sigungu}/${dept}`}>{dept}</Link>
            </>
          )}
          {" › "}
          {h.name}
        </Text>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        {/* 카드 스택 */}
        <div className="flex min-w-0 flex-col gap-6 lg:order-2">
          {/* 병원 사진 (있을 때만) — 4열 그리드 */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
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

          {/* 소개 — 상호명 헤더(카드 밖) + 본문 카드 */}
          <section id="intro" className="scroll-mt-24">
            <div className="px-1">
              {h.hours && h.hours.length > 0 && (
                <div className="mb-3">
                  <TodayStatus hours={h.hours} />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Text as="h1" textStyle="t8Bold">
                  {h.name}
                </Text>
                {isPartnerHospital(h.id) && (
                  <Badge variant="solid" tone="brand">
                    제휴
                  </Badge>
                )}
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

            <div className="mt-4 rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                {/* 좌: 정보 */}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-relaxed text-neutral">
                    {h.description ?? buildAutoDescription(h)}
                  </p>

                  {/* 정보 칩: 지하철 / 주소 */}
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {st && (
                      <div className="flex items-start gap-2 rounded-xl bg-neutral-weak px-3.5 py-3">
                        <span className="mt-0.5 shrink-0 text-subtle">
                          <SubwayIcon />
                        </span>
                        <span className="text-[13px] text-neutral">
                          {st.name}
                          {st.exit && ` ${st.exit}번 출구`} 도보 약 {stWalk}분 (
                          {st.distanceM}m)
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 rounded-xl bg-neutral-weak px-3.5 py-3">
                      <span className="mt-0.5 shrink-0 text-subtle">
                        <PinMiniIcon />
                      </span>
                      <span className="text-[13px] text-neutral">{addr}</span>
                    </div>
                  </div>

                  {h.departments.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {h.departments.map((d) => (
                        <ActionChip key={d} asChild size="small">
                          <Link
                            href={`/hospitals?department=${encodeURIComponent(d)}`}
                          >
                            {d}
                          </Link>
                        </ActionChip>
                      ))}
                    </div>
                  )}
                </div>

                {/* 우: 전화 박스 */}
                <div className="shrink-0 rounded-2xl border border-line p-5 lg:w-64">
                  {h.phone ? (
                    <>
                      <div className="flex items-center justify-center gap-2 text-neutral">
                        <PhoneIcon />
                        <span className="text-lg font-bold">{h.phone}</span>
                      </div>
                      <div className="mt-5">
                        <ActionButton
                          asChild
                          variant="brandSolid"
                          size="large"
                          className="w-full"
                        >
                          <a href={`tel:${h.phone}`}>전화 문의</a>
                        </ActionButton>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-sm text-muted">
                      전화번호 정보가 없습니다
                    </p>
                  )}
                  {(h.links?.naverBooking || h.links?.homepage) && (
                    <div className="mt-3 flex justify-center gap-4 text-sm">
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
            <Card id="hours" title="진료시간" icon={<ClockMiniIcon />}>
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
                  <p className="flex flex-wrap items-center gap-1.5 text-sm">
                    {st.line && <LineBadge line={st.line} />}
                    <span className="font-bold text-neutral">{st.name}</span>
                    <span className="text-muted">
                      {st.exit && `${st.exit}번 출구 `}도보 약 {stWalk}분 (
                      {st.distanceM}m)
                    </span>
                  </p>
                )}
                <div>
                  <ActionButton asChild variant="brandSolid" size="medium">
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
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-weak text-brand">
                          <BuildingIcon />
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
          <Text as="h2" textStyle="t7Bold">
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

function DocIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
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
    <svg {...iconProps}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
function PinMiniIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function ClockMiniIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function SubwayIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="3" width="16" height="14" rx="3" />
      <path d="M8 17l-2 4M16 17l2 4M6 13h12" />
    </svg>
  );
}
