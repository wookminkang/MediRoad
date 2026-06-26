import Link from "next/link";

import { ActionChip, Text } from "@seed-design/react";

import { FEATURED_REGIONS } from "@/constants/region";
import type { Hospital } from "@/types/hospital";

import { HospitalList } from "./hospital-list";

type Props = {
  region: string;
  department?: string;
  hospitals: Hospital[];
  total: number;
  /** 지역 내 진료과목 (허브·인접 탐색) */
  regionDepartments: string[];
  intro: string;
  faqs: { q: string; a: string }[];
};

export function AreaLanding({
  region,
  department,
  hospitals,
  total,
  regionDepartments,
  intro,
  faqs,
}: Props) {
  const title = department ? `${region} ${department}` : `${region} 병원`;
  const otherRegions = FEATURED_REGIONS.filter((r) => r !== region);
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
            <Link href={`/area/${region}`}>{region}</Link>
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
            <ChipLink key={d} href={`/area/${region}/${d}`}>
              {d}
            </ChipLink>
          ))}
        </nav>
      )}

      {/* 병원 목록 */}
      <section aria-labelledby="list" className="mt-8">
        <Text as="h2" id="list" textStyle="t7Bold">
          병원 {total}곳
        </Text>
        <div className="mt-3">
          <HospitalList hospitals={hospitals} />
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
        {otherRegions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Text
              as="span"
              textStyle="t4Medium"
              style={{ color: "var(--seed-color-fg-neutral-muted)" }}
            >
              인접 지역
            </Text>
            {otherRegions.map((r) => (
              <ChipLink
                key={r}
                href={department ? `/area/${r}/${department}` : `/area/${r}`}
              >
                {r} {department ?? "병원"}
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
              <ChipLink key={d} href={`/area/${region}/${d}`}>
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
