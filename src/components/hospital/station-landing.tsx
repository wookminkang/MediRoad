import Link from "next/link";

import { ActionChip, Text } from "@seed-design/react";

import type { HospitalSearchFilters } from "@/types/hospital";

import { HospitalInfiniteList } from "./hospital-infinite-list";

type Props = {
  /** 표시·URL용 역명(예: "서울대입구역") */
  station: string;
  department?: string;
  /** 무한스크롤 목록 필터 (station[, department]) */
  filters: HospitalSearchFilters;
  /** 이 역 주변에서 등장하는 진료과목 (허브·인접 탐색) */
  stationDepartments: string[];
  /** 역이 속한 시군구 (지역 랜딩 교차 링크) */
  sigungu?: string;
  /** 같은 시군구의 다른 역 (clean 역명, 내부링크) */
  nearbyStations?: string[];
  /** 인접 자치구 (지역 랜딩 교차 링크) */
  neighborGus?: string[];
  intro: string;
  faqs: { q: string; a: string }[];
};

export function StationLanding({
  station,
  department,
  filters,
  stationDepartments,
  sigungu,
  nearbyStations = [],
  neighborGus = [],
  intro,
  faqs,
}: Props) {
  const deptSuffix = department ? `/${department}` : "";
  const title = department ? `${station} ${department}` : `${station} 병원`;
  const otherDepartments = stationDepartments.filter((d) => d !== department);

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
          {department ? <Link href={`/near/${station}`}>{station}</Link> : station}
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

      {/* 역 허브: 진료과목 칩 */}
      {!department && stationDepartments.length > 0 && (
        <nav aria-label="진료과목" className="mt-6 flex flex-wrap gap-2">
          {stationDepartments.map((d) => (
            <ChipLink key={d} href={`/near/${station}/${d}`}>
              {d}
            </ChipLink>
          ))}
        </nav>
      )}

      {/* 병원 목록 — SSR 첫 페이지 + 무한스크롤 */}
      <section aria-labelledby="list" className="mt-8">
        <Text as="h2" id="list" textStyle="t7Bold">
          {station} {department ?? ""} 병원
        </Text>
        <div className="mt-3">
          <HospitalInfiniteList filters={filters} />
        </div>
      </section>

      {/* 역세권 FAQ */}
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
        {department && otherDepartments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Text
              as="span"
              textStyle="t4Medium"
              style={{ color: "var(--seed-color-fg-neutral-muted)" }}
            >
              {station} 다른 과목
            </Text>
            {otherDepartments.map((d) => (
              <ChipLink key={d} href={`/near/${station}/${d}`}>
                {d}
              </ChipLink>
            ))}
          </div>
        )}
        {nearbyStations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Text
              as="span"
              textStyle="t4Medium"
              style={{ color: "var(--seed-color-fg-neutral-muted)" }}
            >
              {sigungu ? `${sigungu} 다른 역` : "가까운 역"}
            </Text>
            {nearbyStations.map((s) => (
              <ChipLink key={s} href={`/near/${s}역${deptSuffix}`}>
                {s}역 {department ?? "병원"}
              </ChipLink>
            ))}
          </div>
        )}
        {sigungu && (
          <div className="flex flex-wrap items-center gap-2">
            <Text
              as="span"
              textStyle="t4Medium"
              style={{ color: "var(--seed-color-fg-neutral-muted)" }}
            >
              지역으로 보기
            </Text>
            <ChipLink href={department ? `/area/${sigungu}/${department}` : `/area/${sigungu}`}>
              {sigungu} {department ?? "병원"}
            </ChipLink>
            {neighborGus.map((gu) => (
              <ChipLink key={gu} href={department ? `/area/${gu}/${department}` : `/area/${gu}`}>
                {gu} {department ?? "병원"}
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
