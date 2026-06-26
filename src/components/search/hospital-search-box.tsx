"use client";

import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

/** /hospitals 병원명 검색 — 기존 필터(진료과·지역 등)는 유지하고 q만 갱신 */
export function HospitalSearchBox() {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get("q") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(sp.toString());
    const v = value.trim();
    if (v) params.set("q", v);
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/hospitals?${qs}` : "/hospitals");
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="병원 이름으로 검색"
          className="w-full rounded-full border border-line bg-white py-2.5 pl-11 pr-4 text-sm shadow-sm focus:border-[#1E5BD6] focus:outline-none focus:ring-2 focus:ring-[#1E5BD6]/30"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-[#1E5BD6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a4fbb]"
      >
        검색
      </button>
    </form>
  );
}
