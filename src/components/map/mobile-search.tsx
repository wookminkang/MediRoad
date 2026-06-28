"use client";

import { useEffect, useRef, useState } from "react";

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

/**
 * 모바일 검색 전용 화면 — 검색 입력 탭 시 풀스크린으로 노출.
 * 최근 검색어(localStorage) + 추천 검색 칩. 제출 시 onSubmit(q) 후 닫힘.
 */
export function MobileSearch({
  open,
  initialQuery,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSubmit: (q: string) => void;
}) {
  const [q, setQ] = useState(initialQuery ?? "");
  const [recent, setRecent] = useState<string[]>([]);
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

  if (!open) return null;

  const submit = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 12);
    setRecent(next);
    saveRecent(next);
    onSubmit(t);
  };

  const removeRecent = (term: string) => {
    const next = recent.filter((r) => r !== term);
    setRecent(next);
    saveRecent(next);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white md:hidden">
      {/* 헤더: 뒤로 + 입력 */}
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
          className="flex flex-1 items-center gap-2 rounded-full bg-neutral-weak px-4 py-2.5"
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
            className="min-w-0 flex-1 bg-transparent text-[15px] text-neutral placeholder:text-subtle focus:outline-none"
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

      <div className="flex-1 overflow-y-auto px-4 py-5">
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
              {recent.map((term) => (
                <li key={term}>
                  <span className="flex items-center gap-1.5 rounded-full bg-neutral-weak py-2 pl-3.5 pr-2 text-sm text-neutral">
                    <button
                      type="button"
                      onClick={() => submit(term)}
                      className="max-w-[180px] truncate"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      aria-label={`${term} 삭제`}
                      onClick={() => removeRecent(term)}
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
            {SUGGESTED.map((term) => (
              <li key={term}>
                <button
                  type="button"
                  onClick={() => submit(term)}
                  className="rounded-full bg-brand-weak px-4 py-2 text-sm font-medium text-brand transition-opacity active:opacity-70"
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
