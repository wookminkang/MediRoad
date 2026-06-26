import Link from "next/link";

import { ActionChip } from "@seed-design/react";

import { MEDICAL_DEPARTMENTS, type MedicalDepartment } from "@/constants/hospital";

type Props = {
  /** 현재 검색어 (필터 변경 시 유지) */
  q?: string;
  /** 활성 진료과목 */
  active?: MedicalDepartment;
};

/**
 * 진료과목 필터 칩 (검색결과) — URL searchParams 기반 링크. 활성칩 aria-current. (WIREFRAME 4-2)
 * 필터는 URL이므로 Server Component(네비게이션으로 RSC 재실행).
 */
export function DepartmentFilter({ q, active }: Props) {
  const href = (dept?: MedicalDepartment) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (dept) params.set("department", dept);
    const qs = params.toString();
    return qs ? `/hospitals?${qs}` : "/hospitals";
  };

  return (
    <ul className="flex flex-wrap gap-2">
      <li>
        <ChipLink href={href(undefined)} active={!active}>
          전체
        </ChipLink>
      </li>
      {MEDICAL_DEPARTMENTS.map((dept) => (
        <li key={dept}>
          <ChipLink href={href(dept)} active={active === dept}>
            {dept}
          </ChipLink>
        </li>
      ))}
    </ul>
  );
}

function ChipLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <ActionChip
      asChild
      size="small"
      aria-current={active ? "true" : undefined}
      style={
        active
          ? {
              backgroundColor: "var(--seed-color-bg-brand-weak)",
              color: "var(--seed-color-fg-brand)",
            }
          : undefined
      }
    >
      <Link href={href}>{children}</Link>
    </ActionChip>
  );
}
