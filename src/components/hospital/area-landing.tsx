import Link from "next/link";

import { ActionChip, Text } from "@seed-design/react";

import { stationSegment } from "@/lib/station-landing";
import type { HospitalSearchFilters } from "@/types/hospital";

import { HospitalInfiniteList } from "./hospital-infinite-list";

type Props = {
  /**
   * URL에 쓰는 값. 표시 이름(region)과 다를 수 있다.
   * 시군구 이름이 시도끼리 겹치면 slug가 '서울-강서구'인데 표시는 '서울 강서구'다.
   * 이걸 섞으면 /area/서울 강서구 같은 깨진 링크가 나온다.
   */
  slug: string;
  /** 화면에 보이는 이름 */
  region: string;
  department?: string;
  /** 야간·일요일 진료 병원 수 — 0이면 배너를 숨긴다 */
  nightCount?: number;
  sundayCount?: number;
  /** 무한스크롤 목록 필터 (region[, department]) */
  filters: HospitalSearchFilters;
  /** 지역 내 진료과목 (허브·인접 탐색) */
  regionDepartments: string[];
  /** 인접 지역 (같은 시도) — 크롤러가 156개 지역을 다 돌 수 있게 하는 통로 */
  nearbyRegions?: { slug: string; label: string }[];
  /** 이 지역 주요 지하철역(clean 역명 — 역세권 랜딩 교차 링크) */
  stations?: string[];
  intro: string;
  faqs: { q: string; a: string }[];
};

export function AreaLanding({
  slug,
  region,
  department,
  nightCount = 0,
  sundayCount = 0,
  filters,
  regionDepartments,
  nearbyRegions = [],
  stations = [],
  intro,
  faqs,
}: Props) {
  const title = department ? `${region} ${department}` : `${region} 병원`;
  const otherDepartments = regionDepartments.filter((d) => d !== department);

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
          {department ? (
            <Link href={`/area/${slug}`}>{region}</Link>
          ) : (
            region
          )}
          {department && (
            <>
              {" › "}
              {department}
            </>
          )}
        </Text>
      </nav>

      {/* 헤더 */}
      <header className="mt-3">
        <Text as="h1" textStyle="t8Bold">
          {title}
        </Text>
        <Text as="p" textStyle="t5Regular" className="mt-3">
          {intro}
        </Text>
      </header>

      {/* region-only: 진료과목 허브 */}
      {!department && regionDepartments.length > 0 && (
        <nav aria-label="진료과목" className="mt-6 flex flex-wrap gap-2">
          {regionDepartments.map((d) => (
            <ChipLink key={d} href={`/area/${slug}/${d}`}>
              {d}
            </ChipLink>
          ))}
        </nav>
      )}

      {/*
       * 야간·일요일 진료 바로가기 — 우리만 가진 데이터로 만든 페이지로 보낸다.
       * "지금 문 연 병원"은 사용자가 가장 급하게 찾는 것이라 눈에 띄게 둔다.
       */}
      {!department && (nightCount > 0 || sundayCount > 0) && (
        <nav aria-label="시간대별 진료" className="mt-4 flex flex-wrap gap-2">
          {nightCount > 0 && (
            <Link
              href={`/area/${slug}/night`}
              className="inline-flex items-center gap-2 rounded-full bg-brand-weak px-4 py-2.5 text-sm font-bold text-brand transition-opacity hover:opacity-80"
            >
              🌙 야간진료 {nightCount}곳
            </Link>
          )}
          {sundayCount > 0 && (
            <Link
              href={`/area/${slug}/sunday`}
              className="inline-flex items-center gap-2 rounded-full bg-brand-weak px-4 py-2.5 text-sm font-bold text-brand transition-opacity hover:opacity-80"
            >
              ☀️ 일요일 진료 {sundayCount}곳
            </Link>
          )}
        </nav>
      )}

      {/* 병원 목록 — SSR 첫 페이지 + 무한스크롤 */}
      <section aria-labelledby="list" className="mt-8">
        <Text as="h2" id="list" textStyle="t7Bold">
          {title} 병원
        </Text>
        <div className="mt-3">
          <HospitalInfiniteList filters={filters} />
        </div>
      </section>

      {/* 지역 특화 FAQ */}
      <section aria-labelledby="faq" className="mt-8">
        <Text as="h2" id="faq" textStyle="t7Bold">
          {title} 자주 묻는 질문
        </Text>
        <dl className="mt-3 flex flex-col gap-4">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt>
                <Text as="h3" textStyle="t5Bold">
                  Q. {f.q}
                </Text>
              </dt>
              <dd className="mt-1">
                <Text as="p" textStyle="t5Regular">
                  {f.a}
                </Text>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 인접 탐색 (내부링크) */}
      <nav aria-label="인접 탐색" className="mt-8 flex flex-col gap-3">
        {stations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Text
              as="span"
              textStyle="t4Medium"
              style={{ color: "var(--seed-color-fg-neutral-muted)" }}
            >
              역세권으로 찾기
            </Text>
            {stations.map((s) => (
              <ChipLink
                key={s}
                href={
                  department
                    ? `/near/${stationSegment(s)}/${department}`
                    : `/near/${stationSegment(s)}`
                }
              >
                {stationSegment(s)} {department ?? ""}
              </ChipLink>
            ))}
          </div>
        )}
        {nearbyRegions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Text
              as="span"
              textStyle="t4Medium"
              style={{ color: "var(--seed-color-fg-neutral-muted)" }}
            >
              인접 지역
            </Text>
            {nearbyRegions.map((r) => (
              <ChipLink
                key={r.slug}
                href={
                  department
                    ? `/area/${r.slug}/${department}`
                    : `/area/${r.slug}`
                }
              >
                {r.label} {department ?? "병원"}
              </ChipLink>
            ))}
          </div>
        )}
        {department && otherDepartments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Text
              as="span"
              textStyle="t4Medium"
              style={{ color: "var(--seed-color-fg-neutral-muted)" }}
            >
              {region} 다른 과목
            </Text>
            {otherDepartments.map((d) => (
              <ChipLink key={d} href={`/area/${slug}/${d}`}>
                {d}
              </ChipLink>
            ))}
          </div>
        )}
      </nav>
    </article>
  );
}

function ChipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <ActionChip asChild size="small">
      <Link href={href}>{children}</Link>
    </ActionChip>
  );
}
