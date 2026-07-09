import Link from "next/link";

import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

const fmtDate = (iso: string) => iso.replaceAll("-", ".");

/** 병원 상세 내 "포스팅" 섹션 — 그 병원이 쓴 포스트 (한 카드 · 2×2 그리드) */
export function HospitalPostList({
  hospital,
  posts,
}: {
  hospital: Hospital;
  posts: HospitalPost[];
}) {
  if (!posts.length) return null;
  const rows = Math.ceil(posts.length / 2);
  return (
    <section aria-labelledby="hospital-posts" className="mt-12">
      <h2 id="hospital-posts" className="text-lg font-bold text-neutral">
        포스팅
      </h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <ul className="grid sm:grid-cols-2">
          {posts.map((p, i) => {
            const notLast = i < posts.length - 1;
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
                    <p className="line-clamp-2 text-[15px] font-bold leading-snug text-neutral">
                      {p.title}
                    </p>
                    {p.publishedAt && (
                      <p className="mt-1.5 text-xs text-subtle">
                        {fmtDate(p.publishedAt)}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
