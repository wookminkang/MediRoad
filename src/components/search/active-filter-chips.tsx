"use client";

import { useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** 검색박스 하단 — 현재 적용된 필터를 칩으로 표시 + X로 개별/전체 해제 */
export function ActiveFilterChips() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const chips: { id: string; label: string; keys: string[] }[] = [];
  const q = sp.get("q");
  if (q) chips.push({ id: "q", label: `"${q}"`, keys: ["q"] });
  const dep = sp.get("department");
  if (dep) chips.push({ id: "dep", label: dep, keys: ["department"] });
  const sido = sp.get("sido");
  if (sido) chips.push({ id: "sido", label: sido, keys: ["sido"] });
  if (sp.get("open") === "1")
    chips.push({ id: "open", label: "영업중", keys: ["open"] });
  const radius = sp.get("radius");
  if (radius)
    chips.push({
      id: "radius",
      label: `반경 ${radius}km`,
      keys: ["radius", "lat", "lng"],
    });
  else if (sp.get("lat") && sp.get("lng"))
    chips.push({ id: "near", label: "내 주변", keys: ["lat", "lng"] });

  if (chips.length === 0) return null;

  const removeKeys = (keys: string[]) => {
    const next = new URLSearchParams(sp.toString());
    keys.forEach((k) => next.delete(k));
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => removeKeys(c.keys)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-weak py-1.5 pl-3.5 pr-2.5 text-sm font-medium text-brand transition-opacity hover:opacity-80"
        >
          <span className="max-w-[200px] truncate">{c.label}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push(pathname))}
          className="ml-1 text-sm text-subtle hover:text-neutral"
        >
          전체 해제
        </button>
      )}
    </div>
  );
}
