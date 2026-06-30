"use client";

import { useState } from "react";

import { Badge, Text } from "@seed-design/react";

type Group = { category: string; items: { q: string; a: string }[] };

/** FAQ 카테고리 + 펼침형 아코디언 (seed Badge/Text + 플랫 카드, 테두리 없음) */
export function FaqGroups({ groups }: { groups: Group[] }) {
  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <section key={group.category}>
          <div className="mb-3 flex items-center gap-2">
            <Badge size="medium" variant="weak" tone="brand">
              {group.category}
            </Badge>
          </div>
          <ul className="flex flex-col gap-2.5">
            {group.items.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li
      className="overflow-hidden rounded-2xl transition-colors"
      style={{ backgroundColor: "var(--seed-color-bg-neutral-weak)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <Text
          as="span"
          textStyle="t5Bold"
          className="shrink-0 text-brand"
          aria-hidden
        >
          Q
        </Text>
        <Text as="h3" textStyle="t5Bold" className="flex-1">
          {q}
        </Text>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`shrink-0 text-subtle transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="flex gap-3 px-5 pb-5 pt-0">
          <Text
            as="span"
            textStyle="t5Bold"
            className="shrink-0 text-subtle"
            style={{ lineHeight: 1.7 }}
            aria-hidden
          >
            A
          </Text>
          <Text
            as="p"
            textStyle="t5Regular"
            className="text-subtle"
            style={{ lineHeight: 1.7 }}
          >
            {a}
          </Text>
        </div>
      )}
    </li>
  );
}
