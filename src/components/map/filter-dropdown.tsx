"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

/** 네이버 부동산식 알약 필터 — 버튼 클릭 시 칩 패널 드롭다운(단일 선택) */
export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  panelWidthPx = 288,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  panelWidthPx?: number;
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const active = !!selected;

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    // 버튼 위치를 측정해 패널 배치 — 모바일은 화면 폭에 맞춰 고정, 데스크톱은 버튼 아래
    const r = btnRef.current?.getBoundingClientRect();
    const mobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (r && mobile) {
      setPanelStyle({ position: "fixed", top: r.bottom + 8, left: 12, right: 12 });
    } else {
      setPanelStyle({
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        width: panelWidthPx,
      });
    }
    setOpen(true);
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium shadow-md transition-colors ${
          active
            ? "border-transparent bg-[#1E5BD6] text-white"
            : open
              ? "border-[#1E5BD6] bg-white text-neutral"
              : "border-black/5 bg-white text-neutral hover:bg-neutral-weak"
        }`}
      >
        <span>{active ? selected.label : label}</span>
        <svg
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={panelStyle}
          className="z-30 max-h-[60vh] overflow-y-auto rounded-2xl border border-line bg-white p-4 shadow-xl"
        >
          <p className="mb-3 text-base font-bold text-neutral">{label}</p>
          <div className="flex flex-wrap gap-2">
            <Chip selected={!active} onClick={() => onChange("")}>
              전체
            </Chip>
            {options.map((o) => (
              <Chip
                key={o.value}
                selected={o.value === value}
                onClick={() => onChange(o.value === value ? "" : o.value)}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "border border-[#1E5BD6] bg-white text-[#1E5BD6]"
          : "bg-neutral-weak text-subtle hover:opacity-80"
      }`}
    >
      {selected && (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {children}
    </button>
  );
}
