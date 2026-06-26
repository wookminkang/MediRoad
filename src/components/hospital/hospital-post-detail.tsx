import Link from "next/link";

import { FaqAccordion } from "@/components/ui/faq-accordion";
import { Markdown } from "@/components/column/markdown";
import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

import { PostActions } from "./post-actions";

const fmtDate = (iso: string) => iso.replaceAll("-", "/");

/** 본문 마크다운 → 평문(음성 읽기용) */
const toPlain = (md: string) =>
  md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*`>_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** 병원 포스트 상세 — 뉴스룸형 에디토리얼(좁은 중앙 칼럼). */
export function HospitalPostDetail({
  hospital,
  post,
}: {
  hospital: Hospital;
  post: HospitalPost;
}) {
  return (
    <article>
      {/* 병원(카테고리) */}
      <Link
        href={`/hospitals/${hospital.slug}`}
        className="text-sm font-bold text-brand hover:underline"
      >
        {hospital.name}
      </Link>

      {/* 제목 */}
      <h1 className="mt-3 text-[28px] font-bold leading-[1.3] text-neutral sm:text-[38px]">
        {post.title}
      </h1>

      {/* 메타(날짜) + 액션(AI요약·음성·공유·인쇄) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <span className="text-[15px] text-muted">
          {post.publishedAt && fmtDate(post.publishedAt)}
        </span>
        <PostActions
          title={post.title}
          summary={post.summary}
          bodyText={toPlain(post.body)}
        />
      </div>

      {/* 본문 */}
      <div className="mt-10">
        <Markdown>{post.body}</Markdown>
      </div>

      {/* 출처(각주) */}
      {post.references && post.references.length > 0 && (
        <ol className="mt-12 flex list-decimal flex-col gap-1.5 border-t border-line pl-5 pt-6 text-sm text-muted">
          {post.references.map((r, i) => (
            <li key={i}>
              <a href={r.url} target="_blank" rel="noreferrer" className="text-brand underline">
                {r.title}
              </a>
            </li>
          ))}
        </ol>
      )}

      {/* 태그 */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={`/hospitals?q=${encodeURIComponent(t)}`}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm text-neutral transition-colors hover:bg-neutral-weak"
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* FAQ */}
      {post.faqs && post.faqs.length > 0 && (
        <section aria-labelledby="post-faq" className="mt-12">
          <h2 id="post-faq" className="text-xl font-bold text-neutral">
            자주 묻는 질문
          </h2>
          <div className="mt-4">
            <FaqAccordion faqs={post.faqs} />
          </div>
        </section>
      )}

      {/* 안내(의학적 면책) 박스 */}
      <div className="mt-12 flex gap-3 rounded-xl bg-neutral-weak p-5">
        <span className="mt-0.5 shrink-0 text-subtle">
          <InfoIcon />
        </span>
        <div className="text-sm leading-relaxed text-muted">
          본 콘텐츠는 <b className="text-neutral">{post.author.name}</b>이(가) 작성한 일반적인
          건강 정보로, 개인의 증상·질환에 대한 진단이나 치료를 대체하지 않습니다. 정확한
          진단과 치료는 반드시 의료진과 상담하세요.
          {post.reviewedBy && (
            <div className="mt-2 text-subtle">
              감수 · {post.reviewedBy.name} ({post.reviewedBy.specialty})
            </div>
          )}
        </div>
      </div>

      {/* 병원으로 돌아가기 */}
      <div className="mt-10 text-center">
        <Link
          href={`/hospitals/${hospital.slug}`}
          className="inline-flex items-center gap-1 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
        >
          {hospital.name} 정보 보기
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}
