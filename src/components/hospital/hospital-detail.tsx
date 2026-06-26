import type { ReactNode } from "react";

import Link from "next/link";

import { ActionButton, ActionChip, Badge, Text } from "@seed-design/react";

import { ImagePlaceholder } from "@/components/home/image-placeholder";
import { MapPlaceholder } from "@/components/map/map-placeholder";
import { FaqAccordion } from "@/components/ui/faq-accordion";

import { HospitalGridCard } from "./hospital-grid-card";
import { HospitalMiniMap } from "./hospital-mini-map";
import { TodayStatus } from "./today-status";
import { isPartnerHospital } from "@/constants/partners";
import type { Hospital } from "@/types/hospital";

import { OpeningHoursTable } from "./opening-hours-table";

/** 시간 관련 편의(검색수요 큼)는 강조(positive) 배지로 */
const TIME_AMENITIES = new Set(["야간진료", "일요일진료", "공휴일진료"]);

/** 병원 상세 본문 — 당근 동네업체 프로필형 (상단 사진 + 2열 + 후기). */
export function HospitalDetail({
  hospital: h,
  related = [],
}: {
  hospital: Hospital;
  related?: Hospital[];
}) {
  const dept = h.departments[0];
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${h.name} ${h.region.sigungu}`)}`;
  const photos = h.photos?.length ? h.photos.slice(0, 5) : [];

  return (
    <article>
      {/* breadcrumb */}
      <nav aria-label="경로 안내">
        <Text
          as="span"
          textStyle="t3Regular"
          style={{ color: "var(--seed-color-fg-neutral-muted)" }}
        >
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

      {/* 상단 사진 갤러리 (가로 스트립 — 없으면 플레이스홀더) */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => {
          const photo = photos[i];
          return photo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={photo.url}
              alt={photo.alt ?? `${h.name} 사진 ${i + 1}`}
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />
          ) : (
            <ImagePlaceholder
              key={i}
              rounded="rounded-xl"
              className="aspect-[4/3] w-full"
            />
          );
        })}
      </div>

      {/* 타이틀 블록 */}
      <header className="mt-6">
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

        {/* 평점·후기(공간) · 종별·지역 */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <span className="flex items-center gap-1 font-bold text-neutral">
            <StarIcon />
            {h.rating ?? "—"}
          </span>
          <span className="text-subtle">·</span>
          <span>후기 {h.reviewCount ?? 0}</span>
          <span className="text-subtle">·</span>
          <span>{h.type}</span>
          <span className="text-subtle">·</span>
          <span>{h.region.sigungu}</span>
        </div>

        {h.hours && h.hours.length > 0 && (
          <div className="mt-3">
            <TodayStatus hours={h.hours} />
          </div>
        )}

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
      </header>

      {/* 2열: 본문(좌) + 정보 사이드바(우) */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* 본문 (좌) */}
        <div className="flex min-w-0 flex-col gap-10">
          {h.description && (
            <Section title="소개">
              <Text as="p" textStyle="t5Regular" style={{ lineHeight: 1.8 }}>
                {h.description}
              </Text>
            </Section>
          )}

          {h.symptoms && h.symptoms.length > 0 && (
            <Section title="진료 키워드">
              <div className="flex flex-wrap gap-2">
                {h.symptoms.map((s) => (
                  <ActionChip key={s} asChild size="small">
                    <Link href={`/hospitals?q=${encodeURIComponent(s)}`}>{s}</Link>
                  </ActionChip>
                ))}
              </div>
            </Section>
          )}

          {h.hours && (
            <Section title="진료시간">
              <OpeningHoursTable hours={h.hours} holidayClosed={h.holidayClosed} />
            </Section>
          )}

          {h.doctors && h.doctors.length > 0 && (
            <Section title="의료진">
              <ul className="flex flex-col gap-2">
                {h.doctors.map((d) => (
                  <li key={d.name}>
                    <Text as="span" textStyle="t5Medium">
                      {d.title} {d.name}
                    </Text>{" "}
                    <Text
                      as="span"
                      textStyle="t4Regular"
                      style={{ color: "var(--seed-color-fg-neutral-muted)" }}
                    >
                      · {d.specialty}
                    </Text>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {h.faqs && h.faqs.length > 0 && (
            <Section title="자주 묻는 질문">
              <FaqAccordion faqs={h.faqs} />
            </Section>
          )}

          {/* 후기 (공간만 — 준비 중) */}
          <ReviewSection />
        </div>

        {/* 정보 사이드바 (우) */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <div className="flex flex-col gap-4 rounded-2xl border border-line p-5">
            {/* 진료시간 요약 */}
            {h.hours && h.hours.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-subtle">
                  <ClockMiniIcon />
                </span>
                <div>
                  <TodayStatus hours={h.hours} />
                </div>
              </div>
            )}

            {/* 전화 */}
            {h.phone && (
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-subtle">
                  <PhoneIcon />
                </span>
                <a href={`tel:${h.phone}`} className="text-sm text-neutral">
                  {h.phone}
                </a>
              </div>
            )}

            {/* 주소 */}
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-subtle">
                <PinMiniIcon />
              </span>
              <p className="text-sm text-neutral">{h.roadAddress ?? h.address}</p>
            </div>

            {/* 미니맵 (좌표 있으면 실지도 + 마커) */}
            {h.location?.lat && h.location?.lng ? (
              <HospitalMiniMap
                lat={h.location.lat}
                lng={h.location.lng}
                className="h-44 w-full overflow-hidden rounded-xl"
              />
            ) : (
              <MapPlaceholder className="min-h-[9rem] rounded-xl" />
            )}

            {/* 지도 아래: 가까운 지하철역 + 도보 분 */}
            {h.nearestStation && (
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-subtle">
                  <SubwayIcon />
                </span>
                <p className="text-sm text-neutral">
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    {h.nearestStation.line && (
                      <LineBadge line={h.nearestStation.line} />
                    )}
                    <span className="font-bold">{h.nearestStation.name}</span>
                    {h.nearestStation.exit && (
                      <span className="text-muted">
                        {h.nearestStation.exit}번 출구
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-muted">
                    도보 약 {Math.max(1, Math.round(h.nearestStation.distanceM / 80))}분
                    ({h.nearestStation.distanceM}m)
                  </span>
                </p>
              </div>
            )}

            {/* 액션 */}
            {h.phone && (
              <ActionButton asChild variant="brandSolid" size="large" className="w-full">
                <a href={`tel:${h.phone}`}>전화 문의</a>
              </ActionButton>
            )}
            <div className="grid grid-cols-3 gap-2">
              <ActionTile href={naverUrl} icon={<NavIcon />} label="길찾기" />
              {h.links?.naverBooking && (
                <ActionTile
                  href={h.links.naverBooking}
                  icon={<CalendarIcon />}
                  label="예약"
                />
              )}
              {h.links?.homepage && (
                <ActionTile
                  href={h.links.homepage}
                  icon={<GlobeIcon />}
                  label="홈페이지"
                />
              )}
            </div>
          </div>

        </aside>
      </div>

      {/* 주변 비슷한 병원 */}
      {related.length > 0 && (
        <section aria-labelledby="nearby" className="mt-14">
          <Text as="h2" id="nearby" textStyle="t7Bold">
            이 근처 {h.region.sigungu} 병원
          </Text>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.id}>
                <HospitalGridCard hospital={r} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {h.updatedAt && (
        <footer className="mt-14">
          <Text as="p" textStyle="t3Regular" className="text-subtle">
            정보 업데이트: {h.updatedAt} · 출처 건강보험심사평가원(HIRA)
          </Text>
        </footer>
      )}
    </article>
  );
}

/** 후기 섹션 — 공간만(준비 중). 구조 스켈레톤 + 빈 이미지. */
function ReviewSection() {
  return (
    <section aria-labelledby="reviews">
      <div className="flex items-center justify-between border-b-2 border-neutral pb-3">
        <Text as="h2" id="reviews" textStyle="t7Bold">
          후기
        </Text>
        <span className="text-sm text-subtle">준비 중</span>
      </div>
      <ul className="mt-4 flex flex-col gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <ImagePlaceholder rounded="rounded-full" className="h-9 w-9" />
              <div className="flex flex-col gap-1.5">
                <span className="block h-3 w-24 rounded bg-neutral-weak" />
                <span className="block h-2.5 w-32 rounded bg-neutral-weak" />
              </div>
            </div>
            <ImagePlaceholder className="aspect-[3/2] w-40" rounded="rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <span className="block h-2.5 w-full max-w-md rounded bg-neutral-weak" />
              <span className="block h-2.5 w-2/3 max-w-sm rounded bg-neutral-weak" />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-sm text-subtle">
        후기 기능은 준비 중이에요.
      </p>
    </section>
  );
}

/** 수도권 전철 노선별 공식 색상 */
const LINE_COLORS: Record<string, string> = {
  "1호선": "#0052A4",
  "2호선": "#00A84D",
  "3호선": "#EF7C1C",
  "4호선": "#00A5DE",
  "5호선": "#996CAC",
  "6호선": "#CD7C2F",
  "7호선": "#747F00",
  "8호선": "#E6186C",
  "9호선": "#BDB092",
  수인분당선: "#FABE00",
  신분당선: "#D4003B",
  경의중앙선: "#77C4A3",
  공항철도: "#0090D2",
};

function LineBadge({ line }: { line: string }) {
  const color = LINE_COLORS[line] ?? "var(--seed-color-fg-neutral)";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {line}
    </span>
  );
}

function ActionTile({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 rounded-2xl py-3 transition-colors hover:bg-neutral-weak active:scale-95"
    >
      <span
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-weak text-brand"
      >
        {icon}
      </span>
      <Text as="span" textStyle="t3Medium" className="text-muted">
        {label}
      </Text>
    </a>
  );
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function NavIcon() {
  return (
    <svg {...iconProps}>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
      <circle cx="8.5" cy="9" r="0.5" fill="currentColor" />
      <circle cx="15.5" cy="9" r="0.5" fill="currentColor" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-warning" aria-hidden>
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="border-b-2 border-neutral pb-3">
        <Text as="h2" textStyle="t7Bold">
          {title}
        </Text>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
