"use client";

import Link from "next/link";
import { useState } from "react";

import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

const fmtDate = (iso: string) => iso.replaceAll("-", ".");
const INITIAL = 6; // 처음 노출 개수 — 나머지는 "더보기"로 펼침

/** 병원 상세 내 "포스팅" 섹션 — 그 병원이 쓴 포스트 (한 카드 · 2×2 그리드) */
export function HospitalPostList({
  hospital,
  posts,
}: {
  hospital: Hospital;
  posts: HospitalPost[];
}) {
  const [expanded, setExpanded] = useState(false);
  if (!posts.length) return null;

  const hasMore = posts.length > INITIAL;
  const collapsed = hasMore && !expanded;
  const shown = collapsed ? posts.slice(0, INITIAL) : posts;
  const rows = Math.ceil(shown.length / 2);

  return (
    <section id="posts" aria-labelledby="hospital-posts" className="mt-12 scroll-mt-24">
      <h2 id="hospital-posts" className="text-lg font-bold text-neutral">
        포스팅
      </h2>
      <div
        className={`relative mt-4 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] ${
          collapsed ? "pb-16" : ""
        }`}
      >
        <ul className="grid sm:grid-cols-2">
          {shown.map((p, i) => {
            const notLast = i < shown.length - 1;
            const notLastRow = Math.floor(i / 2) < rows - 1;
            return (
              <li
                key={p.id}
                className={`border-black/[0.06] ${notLast ? "border-b" : ""} ${
                  i % 2 === 0 ? "sm:border-r" : ""
                } ${notLastRow ? "sm:border-b" : "sm:border-b-0"}`}
              >
                <Link
                  href={`/hospitals/${hospital.slug}/posts/${p.id}`}
                  className="flex h-full items-center gap-3.5 p-4 transition-colors hover:bg-neutral-weak"
                >
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="h-22 w-22 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-22 w-22 shrink-0 rounded-xl bg-neutral-weak" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-neutral">
                      {p.title}
                    </h3>
                    {p.publishedAt && (
                      <p className="mt-1.5 text-xs text-subtle">
                        <time dateTime={p.publishedAt}>{fmtDate(p.publishedAt)}</time>
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 접힘 상태 + 더 있을 때: 하단 페이드로 살짝 흐리게 + 더보기 버튼 */}
        {collapsed && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/85 to-transparent"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-black/[0.1] bg-white px-5 py-2.5 text-sm font-bold text-neutral shadow-sm transition-colors hover:bg-neutral-weak"
              >
                포스팅 더보기
                <span className="text-subtle">({posts.length - INITIAL})</span>
                <ChevronDownIcon />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
