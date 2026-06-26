import Link from "next/link";

import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

const fmtDate = (iso: string) => iso.replaceAll("-", ".");

/** 병원 상세 내 "건강정보" 섹션 — 그 병원이 쓴 포스트 목록 */
export function HospitalPostList({
  hospital,
  posts,
}: {
  hospital: Hospital;
  posts: HospitalPost[];
}) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="hospital-posts" className="mt-12">
      <h2 id="hospital-posts" className="text-xl font-bold text-neutral">
        {hospital.name} 건강정보
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {posts.map((p) => (
          <li key={p.id}>
            <Link
              href={`/hospitals/${hospital.slug}/posts/${p.id}`}
              className="flex h-full gap-3 rounded-xl border border-line p-4 transition-colors hover:bg-neutral-weak"
            >
              {p.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.thumbnail}
                  alt={p.title}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-weak text-xs font-bold text-brand">
                  건강
                </div>
              )}
              <div className="min-w-0">
                <p className="line-clamp-2 font-bold text-neutral">{p.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                {p.publishedAt && (
                  <p className="mt-1 text-xs text-subtle">{fmtDate(p.publishedAt)}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
