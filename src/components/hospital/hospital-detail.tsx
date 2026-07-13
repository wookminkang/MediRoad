import Link from "next/link";

import {
  ActionButton,
  AvatarFallback,
  AvatarRoot,
  TagGroupItem,
  TagGroupItemLabel,
  TagGroupRoot,
} from "@seed-design/react";

import { MapPlaceholder } from "@/components/map/map-placeholder";
import { FaqAccordion } from "@/components/ui/faq-accordion";

import { ExpandableText } from "./expandable-text";
import { HospitalMiniMap } from "./hospital-mini-map";
import { HospitalPostList } from "./hospital-post-list";
import { TodayStatus } from "./today-status";
import { isPartnerHospital } from "@/constants/partners";
import {
  buildAutoDescription,
  buildHospitalSummaryBullets,
  walkMinutes,
} from "@/lib/hospital";
import { lineColor } from "@/lib/station";
import { cleanStationName, stationSegment } from "@/lib/station-landing";
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
  const stWalk = st ? walkMinutes(st.distanceM) : 0;
  const introText = h.description ?? buildAutoDescription(h);
  const summaryBullets = buildHospitalSummaryBullets(h);
  const hasHours = !!(h.hours && h.hours.length > 0);
  const hasFaqs = !!(h.faqs && h.faqs.length > 0);

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


  return (
    <article>
      <div className="flex flex-col">
        <div className="flex min-w-0 flex-col">
          {/* 빵부스러기 — BreadcrumbList JSON-LD와 동일 경로 */}
          <nav aria-label="현재 위치" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-subtle">
              <li>
                <Link href="/" className="hover:text-brand hover:underline">
                  홈
                </Link>
              </li>
              <li aria-hidden className="text-subtle/50">
                ›
              </li>
              <li>
                <Link
                  href={`/area/${encodeURIComponent(h.region.sigungu)}`}
                  className="hover:text-brand hover:underline"
                >
                  {h.region.sigungu}
                </Link>
              </li>
              <li aria-hidden className="text-subtle/50">
                ›
              </li>
              <li aria-current="page" className="font-semibold text-neutral">
                {h.name}
              </li>
            </ol>
          </nav>

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
                  {/*
                   * H1은 "{병원명} | {지역} {기관유형}" (SEO 가이드 §3-2).
                   * 병원명만 두면 "강동구 한방병원" 같은 질의에 걸릴 맥락이 H1에 없다.
                   * 지역·유형을 h1 안의 두 번째 줄로 넣어 문서 주제를 한 줄로 말하게 한다.
                   */}
                  <h1 className="min-w-0">
                    <span className="block text-4xl font-extrabold leading-tight tracking-tight text-neutral sm:text-5xl">
                      {h.name}
                    </span>
                    <span className="mt-2 block text-sm text-muted">
                      {h.region.sigungu} {h.type}
                      {h.nearestStation ? ` · ${h.nearestStation.name}` : ""}
                    </span>
                  </h1>
                  {isPartnerHospital(h.id) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand-weak px-2.5 py-1 text-xs font-bold text-brand">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                      제휴병원
                    </span>
                  )}
                </div>
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

            {/*
             * 소개 문장 — 접어서 보여준다. 병원이 소개글을 채우면 문단이 길어져
             * 아무도 안 읽는다. 다만 텍스트는 DOM에 전부 남는다(line-clamp는 시각적 절단일 뿐).
             * 소개글은 AI가 인용하는 GEO 자산이라 잘라내면 안 된다.
             */}
            <ExpandableText text={introText} lines={3} />

            {/*
             * 한눈에 보는 정보 — AI·검색엔진이 그대로 인용할 사실 문장. (SEO 가이드 §3-2)
             *
             * 같은 문장을 "AI요약" 모달에도 쓰지만, 모달은 클릭해야 열리므로 크롤러·AI는 못 본다.
             * 인용되길 바라는 문장은 본문에 있어야 한다.
             */}
            <section
              aria-labelledby="at-a-glance"
              className="mt-5 rounded-2xl bg-neutral-weak p-5"
            >
              <h2
                id="at-a-glance"
                className="text-[15px] font-bold text-neutral"
              >
                한눈에 보는 {h.name}
              </h2>
              <ul className="mt-3 flex flex-col gap-1.5">
                {summaryBullets.map((s) => (
                  <li
                    key={s}
                    className="flex gap-2 text-[14px] leading-relaxed text-neutral"
                  >
                    <span aria-hidden className="text-brand">
                      ·
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/*
             * 진료 키워드 — 지금까지 symptoms는 JSON-LD(keywords)에만 넣고 화면에는 안 그렸다.
             * 가이드 §3-3이 금지하는 "사용자에게 보이지 않는 정보를 JSON-LD에만 넣는 방식"이고,
             * AI는 본문을 읽으므로 GEO 효과도 없었다. 화면에 사실로 적는다.
             */}
            {h.symptoms && h.symptoms.length > 0 && (
              <section aria-labelledby="care-topics" className="mt-6">
                <h2
                  id="care-topics"
                  className="text-[15px] font-bold text-neutral"
                >
                  {h.name}이 진료하는 항목
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {h.symptoms.map((s) => (
                    <li
                      key={s}
                      className="rounded-full bg-brand-weak px-3 py-1.5 text-[13px] font-medium text-brand"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-subtle">
                  병원이 제공한 진료 항목입니다. 실제 진료 가능 여부는 환자
                  상태와 의료진 판단에 따라 달라질 수 있으며, 방문 전 상담으로
                  확인하시기 바랍니다.
                </p>
              </section>
            )}

            {/*
             * 의료진 — E-E-A-T. hospital_doctors 테이블은 진작 있었는데 화면에도 JSON-LD에도
             * 안 그려서, 데이터를 넣어도 아무 데도 안 보였다. "누가 진료하는가"는 AI가 병원을
             * 신뢰할지 판단하는 핵심 근거라 본문에 이름·직함·전문분야를 그대로 적는다.
             */}
            {h.doctors && h.doctors.length > 0 && (
              <section aria-labelledby="doctors" className="mt-6">
                <h2 id="doctors" className="text-[15px] font-bold text-neutral">
                  {h.name} 의료진
                </h2>
                <ul className="mt-3 flex flex-col gap-4">
                  {h.doctors.map((d) => (
                    <li key={`${d.name}-${d.title}`} className="flex gap-3.5">
                      {/* 사진은 쓰지 않는다(초상권). 이름 이니셜 폴백으로 충분하다 */}
                      <AvatarRoot className="h-12 w-12 shrink-0">
                        <AvatarFallback>{d.name.slice(0, 1)}</AvatarFallback>
                      </AvatarRoot>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[15px] font-bold text-neutral">
                            {d.name}
                          </span>
                          <span className="text-[13px] text-muted">
                            {d.title}
                          </span>
                        </p>
                        {d.specialty && (
                          <p className="mt-1 text-[13px] leading-relaxed text-subtle">
                            {d.specialty}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

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
            <address className="flex items-start gap-2 not-italic">
              <span className="mt-0.5 shrink-0 text-subtle">
                <PinSmallIcon />
              </span>
              <span className="text-[15px] text-neutral">{addr}</span>
            </address>
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
            <div className="mt-4 grid gap-5">
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
                <address className="text-[15px] not-italic text-neutral">
                  {addr}
                </address>
                {st && (
                  <div className="flex flex-col gap-2">
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
                    <Link
                      href={`/near/${stationSegment(cleanStationName(st.name))}`}
                      className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-brand hover:underline"
                    >
                      {stationSegment(cleanStationName(st.name))} 주변 병원 보기
                      <ChevronRightIcon />
                    </Link>
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
          {hasFaqs && (
            <section
              id="faq"
              aria-labelledby="hospital-faq"
              className="mt-12 scroll-mt-24"
            >
              <h2 id="hospital-faq" className="text-lg font-bold text-neutral">
                자주 묻는 질문
              </h2>
              <p className="mt-1 text-sm text-muted">
                진료시간·위치·진료과목 등 방문 전 자주 확인하는 내용이에요.
              </p>
              <div className="mt-4">
                <FaqAccordion faqs={h.faqs!} />
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
              {h.updatedAt && (
                <>
                  정보 업데이트:{" "}
                  <time dateTime={h.updatedAt}>{h.updatedAt}</time> ·{" "}
                </>
              )}
              출처 건강보험심사평가원(HIRA)
            </p>
          </footer>
        </div>

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
