import Link from "next/link";

import { ActionChip } from "@seed-design/react";

import {
  BRIEFING_CATEGORIES,
  type BriefingCategory,
} from "@/constants/briefing";

/** 메디브리핑 카테고리 탭 — 전체 + 카테고리(/briefing?category=). */
export function BriefingTabs({ active }: { active?: BriefingCategory }) {
  return (
    <ul className="flex flex-wrap gap-2">
      <li>
        <ChipLink href="/briefing" active={!active}>
          전체
        </ChipLink>
      </li>
      {BRIEFING_CATEGORIES.map((c) => (
        <li key={c.id}>
          <ChipLink href={`/briefing?category=${c.id}`} active={active === c.id}>
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
