import Link from "next/link";

import { ActionChip } from "@seed-design/react";

import { COLUMN_CATEGORIES, type ColumnCategory } from "@/constants/column";

/**
 * 카테고리 탭 — 전체(/health) + 카테고리(/health/category/[c]) 링크. 활성 aria-current. (WIREFRAME 4-6)
 * 카테고리는 색인 라우트로 연결(SEO §1).
 */
export function CategoryTabs({ active }: { active?: ColumnCategory }) {
  return (
    <ul className="flex flex-wrap gap-2">
      <li>
        <ChipLink href="/health" active={!active}>
          전체
        </ChipLink>
      </li>
      {COLUMN_CATEGORIES.map((c) => (
        <li key={c.id}>
          <ChipLink href={`/health?category=${c.id}`} active={active === c.id}>
            {c.label}
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
