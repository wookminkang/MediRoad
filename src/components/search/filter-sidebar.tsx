import Link from "next/link";

import { Text } from "@seed-design/react";

import { MEDICAL_DEPARTMENTS, type MedicalDepartment } from "@/constants/hospital";
import { SIDO_LIST } from "@/constants/region";

import { LocationButton } from "./location-button";

type Props = {
  q?: string;
  activeDepartment?: MedicalDepartment;
  activeSido?: string;
  activeRadius?: string;
  lat?: string;
  lng?: string;
  openNow?: boolean;
};

const RADIUS_OPTIONS = ["1", "3", "5", "10"] as const;

function buildUrl(opts: {
  q?: string;
  department?: MedicalDepartment;
  sido?: string;
  radius?: string;
  lat?: string;
  lng?: string;
  openNow?: boolean;
}) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.department) p.set("department", opts.department);
  if (opts.sido) p.set("sido", opts.sido);
  if (opts.radius) p.set("radius", opts.radius);
  if (opts.lat) p.set("lat", opts.lat);
  if (opts.lng) p.set("lng", opts.lng);
  if (opts.openNow) p.set("open", "1");
  const qs = p.toString();
  return qs ? `/hospitals?${qs}` : "/hospitals";
}

/** 검색결과 좌측 필터 — URL 기반(무JS 동작). 반경·지역(시도)·진료과목 + 영업중. */
export function FilterSidebar({
  q,
  activeDepartment,
  activeSido,
  activeRadius,
  lat,
  lng,
  openNow,
}: Props) {
  // 모든 링크에 공통으로 유지할 현재 상태
  const base = {
    q,
    department: activeDepartment,
    sido: activeSido,
    radius: activeRadius,
    lat,
    lng,
    openNow,
  };

  return (
    <aside
      aria-label="필터"
      className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto"
    >
      <div className="flex items-center justify-between">
        <Text as="h2" textStyle="t6Bold">
          필터
        </Text>
        <Link href="/hospitals">
          <Text as="span" textStyle="t4Regular" className="text-muted">
            초기화
          </Text>
        </Link>
      </div>

      {/* 내 위치 */}
      <LocationButton />

      <Divider />

      {/* 영업중만 보기 (토글) */}
      <Link
        href={buildUrl({ ...base, openNow: !openNow })}
        className="flex items-center gap-2"
      >
        <CheckBox checked={!!openNow} />
        <Text as="span" textStyle="t4Regular">
          영업중만 보기
        </Text>
      </Link>

      <Divider />

      {/* 반경 (기준: 내 위치 / 강남역) */}
      <div className="flex flex-col gap-2">
        <Text as="span" textStyle="t5Bold">
          반경
        </Text>
        <ul className="grid grid-cols-2">
          <RadioRow
            label="전체"
            active={!activeRadius}
            href={buildUrl({ ...base, radius: undefined })}
          />
          {RADIUS_OPTIONS.map((r) => (
            <RadioRow
              key={r}
              label={`${r}km`}
              active={activeRadius === r}
              href={buildUrl({ ...base, radius: r })}
            />
          ))}
        </ul>
      </div>

      <Divider />

      {/* 지역 (시도) */}
      <div className="flex flex-col gap-2">
        <Text as="span" textStyle="t5Bold">
          지역
        </Text>
        <ul className="grid grid-cols-2">
          <RadioRow
            label="전체"
            active={!activeSido}
            href={buildUrl({ ...base, sido: undefined })}
          />
          {SIDO_LIST.map((s) => (
            <RadioRow
              key={s}
              label={s}
              active={activeSido === s}
              href={buildUrl({ ...base, sido: s })}
            />
          ))}
        </ul>
      </div>

      <Divider />

      {/* 진료과목 */}
      <div className="flex flex-col gap-2">
        <Text as="span" textStyle="t5Bold">
          진료과목
        </Text>
        <ul className="grid grid-cols-2">
          <RadioRow
            label="전체"
            active={!activeDepartment}
            href={buildUrl({ ...base, department: undefined })}
          />
          {MEDICAL_DEPARTMENTS.map((d) => (
            <RadioRow
              key={d}
              label={d}
              active={activeDepartment === d}
              href={buildUrl({ ...base, department: d })}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Divider() {
  return (
    <span
      aria-hidden
      className="h-px w-full"
      style={{ backgroundColor: "var(--seed-color-stroke-neutral-weak)" }}
    />
  );
}

function RadioRow({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className="flex items-center gap-2 py-1.5"
      >
        <span
          aria-hidden
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
          style={{
            border: `2px solid ${
              active
                ? "var(--seed-color-bg-brand-solid)"
                : "var(--seed-color-stroke-neutral-muted)"
            }`,
          }}
        >
          {active && (
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--seed-color-bg-brand-solid)" }}
            />
          )}
        </span>
        <Text
          as="span"
          textStyle="t4Regular"
          className={active ? "font-bold text-neutral" : "text-muted"}
        >
          {label}
        </Text>
      </Link>
    </li>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className="flex h-5 w-5 shrink-0 items-center justify-center"
      style={{
        borderRadius: "var(--seed-radius-r1)",
        backgroundColor: checked
          ? "var(--seed-color-bg-brand-solid)"
          : "transparent",
        border: checked
          ? "none"
          : "1.5px solid var(--seed-color-stroke-neutral-muted)",
      }}
    >
      {checked && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </span>
  );
}
