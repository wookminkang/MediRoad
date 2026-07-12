"use client";

import { useEffect, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";

const RECENT_KEY = "mediroad:recent-searches";
const RECENT_MAX = 8;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    /* 사파리 프라이빗 모드 등 — 저장 실패는 무시 */
  }
}

/**
 * 검색 트리거(돋보기) + 전체화면 검색 패널.
 *
 * 목록 화면에서 인라인 검색바(≈56px)를 걷어내고 아이콘만 남긴다. 검색은 의도가 명확할 때만
 * 쓰는 기능이라 상시 노출할 이유가 없고, 그 자리를 리스트에 돌려준다. (올리브영·당근 패턴)
 *
 * 주의: 조상에 backdrop-filter/transform이 있으면 position:fixed가 그 안에 갇히므로
 * 스티키 바에서 backdrop-blur를 뺐다. (포털을 쓰면 next/link 내비게이션이 죽는다)
 */
export function SearchTrigger({
  action,
  placeholder,
  suggestions = [],
  q,
}: {
  /** 제출 대상 (/hospitals · /health · /briefing) */
  action: string;
  placeholder: string;
  /** 추천 키워드 칩 */
  suggestions?: string[];
  /** 현재 검색어 */
  q?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(q ?? "");
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const sp = useSearchParams();

  // 검색이 실행되면(URL 변경) 패널을 닫는다. 의존성은 반드시 문자열 —
  // useSearchParams()는 렌더마다 새 객체라 [sp]로 걸면 열자마자 닫힌다.
  const spKey = sp.toString();
  useEffect(() => {
    setOpen(false);
  }, [spKey]);

  useEffect(() => {
    if (!open) return;
    setRecent(loadRecent());
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hrefFor = (term: string) =>
    `${action}?q=${encodeURIComponent(term.trim())}`;

  /**
   * 최근 검색어 저장. 이동은 일반 <a>(브라우저 기본 동작)가 한다 —
   * 이 패널 안에서는 next/link의 클라이언트 내비게이션이 커밋되지 않아 URL이 바뀌지 않는다.
   * 검색은 페이지가 통째로 바뀌는 동작이라 전체 로드로 충분하고, JS 없이도 동작한다.
   */
  const remember = (term: string) => {
    const v = term.trim();
    if (!v) return;
    saveRecent([v, ...loadRecent().filter((r) => r !== v)]);
  };

  const onSubmit = () => remember(value);

  const clearRecent = () => {
    saveRecent([]);
    setRecent([]);
  };

  const panel = open ? (
    <div className="shell-fixed inset-y-0 z-50 flex flex-col bg-white">
      {/* 상단 바 — 뒤로가기 + 검색 입력 */}
      <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="검색 닫기"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral hover:bg-neutral-weak"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <form
          action={action}
          method="get"
          onSubmit={onSubmit}
          role="search"
          className="relative flex-1"
        >
          <input
            ref={inputRef}
            name="q"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            enterKeyHint="search"
            aria-label={placeholder}
            className="w-full rounded-xl bg-[#F3F5FB] py-3 pl-4 pr-11 text-[15px] text-neutral placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-[#1E5BD6]/30"
            style={{ fontSize: "16px" }} /* iOS 자동 확대 방지 */
          />
          <button
            type="submit"
            aria-label="검색"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-subtle hover:text-brand"
          >
            <SearchIcon />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* 추천 키워드 */}
        {suggestions.length > 0 && (
          <section>
            <h2 className="text-[15px] font-bold text-neutral">추천 검색어</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <a
                    href={hrefFor(s)}
                    onClick={() => remember(s)}
                    className="inline-block rounded-full bg-[#F3F5FB] px-3.5 py-2 text-sm font-medium text-neutral transition-colors hover:bg-brand-weak hover:text-brand"
                  >
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 최근 검색어 */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-neutral">최근 검색어</h2>
            {recent.length > 0 && (
              <button
                type="button"
                onClick={clearRecent}
                className="text-xs text-subtle hover:text-neutral"
              >
                전체 삭제
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-subtle">최근 검색어가 없어요.</p>
          ) : (
            <ul className="mt-2">
              {recent.map((r) => (
                <li key={r} className="flex items-center">
                  <a
                    href={hrefFor(r)}
                    onClick={() => remember(r)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5 text-left text-[15px] text-neutral"
                  >
                    <span className="shrink-0 text-subtle">
                      <ClockIcon />
                    </span>
                    <span className="truncate">{r}</span>
                  </a>
                  <button
                    type="button"
                    aria-label={`${r} 삭제`}
                    onClick={() => {
                      const next = recent.filter((x) => x !== r);
                      saveRecent(next);
                      setRecent(next);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-subtle hover:bg-neutral-weak"
                  >
                    <CloseIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="검색"
        aria-haspopup="dialog"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral transition-colors hover:bg-neutral-weak"
      >
        <SearchIcon size={22} />
      </button>

      {/*
       * 포털을 쓰지 않는다. createPortal(document.body) 안에서는 next/link 내비게이션이
       * 동작하지 않아 검색이 먹통이 된다. 대신 스티키 바에서 backdrop-blur를 걷어냈으므로
       * (backdrop-filter가 있으면 fixed가 그 안에 갇힌다) 인라인 fixed로 충분하다.
       */}
      {panel}
    </>
  );
}

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
