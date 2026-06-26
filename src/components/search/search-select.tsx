"use client";

import { useEffect, useRef, useState } from "react";

import { Text } from "@seed-design/react";

type Props = {
  /** form 파라미터명 (예: "department" | "category" | "scope") */
  name: string;
  /** 미선택 시 표시 라벨 (예: "진료과목" | "카테고리") */
  label: string;
  /** 드롭다운 옵션 목록 */
  options: readonly string[];
  /** 초기 선택값 */
  defaultValue?: string;
  /** "전체"(빈값) 옵션 포함 여부. 스코프 선택처럼 항상 하나여야 하면 false */
  includeAll?: boolean;
};

/**
 * 검색바 좌측 커스텀 드롭다운 (범용) — 옵션을 props로 받음.
 * 선택값을 hidden input(name)에 담아 부모 native GET form으로 제출.
 */
export function SearchSelect({
  name,
  label,
  options,
  defaultValue = "",
  includeAll = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (value: string) => {
    setSelected(value);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <input type="hidden" name={name} value={selected} />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 font-bold text-neutral"
        style={{ fontSize: "16px" }}
      >
        {selected || label}
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
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 max-h-72 w-40 overflow-auto py-1"
          style={{
            backgroundColor: "var(--seed-color-bg-layer-default)",
            border: "1px solid var(--seed-color-stroke-neutral-weak)",
            borderRadius: "var(--seed-radius-r3)",
            boxShadow: "var(--seed-shadow-s2)",
          }}
        >
          {includeAll && (
            <Option
              label="전체"
              active={selected === ""}
              onSelect={() => choose("")}
            />
          )}
          {options.map((opt) => (
            <Option
              key={opt}
              label={opt}
              active={selected === opt}
              onSelect={() => choose(opt)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Option({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onClick={onSelect}
        className={`block w-full px-4 py-2 text-left hover:bg-[var(--seed-color-bg-neutral-weak)] ${
          active ? "font-bold text-brand" : "text-neutral"
        }`}
        style={{ fontSize: "15px" }}
      >
        {label}
      </button>
    </li>
  );
}
