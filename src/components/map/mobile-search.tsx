"use client";

import { useEffect, useRef, useState } from "react";

import type { Hospital } from "@/types/hospital";
import { formatDistance } from "@/utils/format";

const KEY = "mediroad:recentSearches";
// 추천 검색 — 병원명에 흔히 포함되는 진료과/유형(이름 검색으로 매칭됨)
const SUGGESTED = [
  "내과",
  "치과",
  "피부과",
  "정형외과",
  "한의원",
  "이비인후과",
  "안과",
  "소아청소년과",
];

function loadRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function saveRecent(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12)));
  } catch {
    /* ignore */
  }
}

/** 두 좌표 간 거리(m) — Haversine */
function distanceM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 매칭 부분 강조 */
function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-brand">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * 모바일 검색 전용 화면 — 디바운스 LIKE 자동완성.
 * 입력 중 매칭 병원 목록을 보여주고, 결과를 누르면 바로 해당 병원으로 이동.
 */
export function MobileSearch({
  open,
  initialQuery,
  userLoc,
  onClose,
  onSubmit,
  onPickHospital,
}: {
  open: boolean;
  initialQuery?: string;
  userLoc?: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmit: (q: string) => void;
  onPickHospital: (h: Hospital) => void;
}) {
  const [q, setQ] = useState(initialQuery ?? "");
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ(initialQuery ?? "");
    setRecent(loadRecent());
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, initialQuery, onClose]);

  // 디바운스 LIKE 자동완성
  const term = q.trim();
  useEffect(() => {
    if (!open) return;
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hospitals?q=${encodeURIComponent(term)}`, {
          signal: ac.signal,
        });
        const json = await res.json();
        let items: Hospital[] = json.items ?? [];
        if (userLoc) {
          items = [...items].sort((a, b) => {
            const da = a.location?.lat ? distanceM(userLoc, a.location) : Infinity;
            const db = b.location?.lat ? distanceM(userLoc, b.location) : Infinity;
            return da - db;
          });
        }
        setResults(items.slice(0, 12));
      } catch {
        /* abort/네트워크 — 무시 */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [term, open, userLoc]);

  if (!open) return null;

  const submit = (t: string) => {
    const v = t.trim();
    if (v.length < 2) return;
    const next = [v, ...recent.filter((r) => r !== v)].slice(0, 12);
    setRecent(next);
    saveRecent(next);
    onSubmit(v);
  };

  const pick = (h: Hospital) => {
    const next = [h.name, ...recent.filter((r) => r !== h.name)].slice(0, 12);
    saveRecent(next);
    onPickHospital(h);
  };

  const removeRecent = (t: string) => {
    const next = recent.filter((r) => r !== t);
    setRecent(next);
    saveRecent(next);
  };

  const showResults = term.length >= 2;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white md:hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-line px-2 py-2.5">
        <button
          type="button"
          aria-label="뒤로"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(q);
          }}
          className="flex flex-1 items-center gap-2 rounded-full bg-neutral-weak px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#1E5BD6]/40"
        >
          <svg className="shrink-0 text-subtle" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="병원 이름 검색"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-base text-neutral placeholder:text-subtle focus:outline-none"
          />
          {q && (
            <button
              type="button"
              aria-label="입력 지우기"
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/10 text-neutral"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showResults ? (
          <ul>
            {/* 입력어로 전체 검색 */}
            <li>
              <button
                type="button"
                onClick={() => submit(q)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <svg className="shrink-0 text-subtle" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="text-[15px] text-neutral">
                  <span className="text-brand">{term}</span> 전체 검색
                </span>
              </button>
            </li>

            {/* 매칭 병원 */}
            {results.map((h) => {
              const dist =
                userLoc && h.location?.lat
                  ? formatDistance(distanceM(userLoc, h.location))
                  : null;
              return (
                <li key={h.id} className="border-t border-line/60">
                  <button
                    type="button"
                    onClick={() => pick(h)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left"
                  >
                    <svg className="mt-0.5 shrink-0 text-subtle" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[15px] font-medium text-neutral">
                          <Highlight text={h.name} q={term} />
                        </span>
                        <span className="shrink-0 text-xs text-subtle">{h.type}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-muted">
                        {dist && <span className="text-neutral">{dist}</span>}
                        {dist && " · "}
                        {h.roadAddress ?? h.address}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}

            {loading && results.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted">
                검색 중…
              </li>
            )}
            {!loading && results.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted">
                검색 결과가 없습니다
              </li>
            )}
          </ul>
        ) : (
          <div className="px-4 py-5">
            {/* 최근 검색어 */}
            {recent.length > 0 && (
              <section className="mb-7">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-neutral">최근 검색어</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setRecent([]);
                      saveRecent([]);
                    }}
                    className="text-xs text-subtle"
                  >
                    전체 삭제
                  </button>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <li key={r}>
                      <span className="flex items-center gap-1.5 rounded-full bg-neutral-weak py-2 pl-3.5 pr-2 text-sm text-neutral">
                        <button
                          type="button"
                          onClick={() => submit(r)}
                          className="max-w-[180px] truncate"
                        >
                          {r}
                        </button>
                        <button
                          type="button"
                          aria-label={`${r} 삭제`}
                          onClick={() => removeRecent(r)}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-subtle"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 추천 검색 */}
            <section>
              <h2 className="mb-3 text-sm font-bold text-neutral">추천 검색</h2>
              <ul className="flex flex-wrap gap-2">
                {SUGGESTED.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => submit(s)}
                      className="rounded-full bg-brand-weak px-4 py-2 text-sm font-medium text-brand transition-opacity active:opacity-70"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
