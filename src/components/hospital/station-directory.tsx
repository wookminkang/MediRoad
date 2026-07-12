"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { stationSegment } from "@/lib/station-landing";

type Station = { name: string; count: number };
type Section = { sido: string; stations: Station[] };

const CAP = 24; // 시도별 기본 노출 수 (나머지는 더보기/검색)

/** 역 디렉토리 — 검색 우선 UX. 전국 역을 한 번에 쏟지 않고 시도별 상위 + 검색으로 탐색. */
export function StationDirectory({ sections }: { sections: Section[] }) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const query = q.trim();

  const results = useMemo(() => {
    if (!query) return null;
    return sections
      .flatMap((s) => s.stations)
      .filter((st) => st.name.includes(query))
      .sort((a, b) => b.count - a.count)
      .slice(0, 80);
  }, [query, sections]);

  const toggle = (sido: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(sido) ? next.delete(sido) : next.add(sido);
      return next;
    });

  return (
    <div className="mt-6">
      {/* 검색 */}
      <div className="relative max-w-md">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="역 이름 검색 (예: 서울대입구)"
          aria-label="역 이름 검색"
          className="w-full rounded-xl border border-black/[0.1] bg-white py-3 pl-11 pr-4 text-[15px] text-neutral outline-none transition-colors focus:border-brand"
        />
      </div>

      {results ? (
        results.length > 0 ? (
          <div className="mt-6">
            <p className="mb-3 text-sm text-muted">
              “{query}” 검색 결과 {results.length}개
            </p>
            <StationChips stations={results} />
          </div>
        ) : (
          <p className="mt-8 text-[15px] text-muted">
            “{query}”에 해당하는 역이 없어요. 다른 이름으로 검색해보세요.
          </p>
        )
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {sections.map((sec) => {
            const isExp = expanded.has(sec.sido);
            const shown = isExp ? sec.stations : sec.stations.slice(0, CAP);
            const more = sec.stations.length - shown.length;
            return (
              <section key={sec.sido} aria-labelledby={`sido-${sec.sido}`}>
                <h2
                  id={`sido-${sec.sido}`}
                  className="text-base font-bold text-neutral"
                >
                  {sec.sido}{" "}
                  <span className="text-muted">{sec.stations.length}개 역</span>
                </h2>
                <div className="mt-3">
                  <StationChips stations={shown} />
                </div>
                {(more > 0 || isExp) && (
                  <button
                    type="button"
                    onClick={() => toggle(sec.sido)}
                    className="mt-3 text-sm font-semibold text-brand hover:underline"
                  >
                    {isExp ? "접기" : `＋${more}개 더보기`}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StationChips({ stations }: { stations: Station[] }) {
  return (
    <nav aria-label="역 목록" className="flex flex-wrap gap-2">
      {stations.map((s) => (
        <Link
          key={s.name}
          href={`/near/${stationSegment(s.name)}`}
          className="rounded-full border border-black/[0.08] px-3 py-1.5 text-[13px] font-medium text-neutral transition-colors hover:border-brand hover:text-brand"
        >
          {stationSegment(s.name)}
        </Link>
      ))}
    </nav>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
