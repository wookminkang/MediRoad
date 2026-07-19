import Link from "next/link";

import { FaqAccordion } from "@/components/ui/faq-accordion";
import { anyCategoryLabel } from "@/constants/briefing";
import type { Column } from "@/types/column";

import { Markdown } from "./markdown";

const fmtDate = (iso: string) => iso.replaceAll("-", "/");

/** 칼럼/브리핑 상세 — 뉴스룸형 에디토리얼. basePath로 /health·/briefing 공용. */
export function ColumnDetail({
  column: c,
  basePath = "/health",
  backLabel = "건강정보 더 보기",
}: {
  column: Column;
  basePath?: string;
  backLabel?: string;
}) {
  return (
    <article>
      {/* 카테고리 */}
      <Link
        href={`${basePath}?category=${c.category}`}
        className="text-sm font-bold text-brand hover:underline"
      >
        {anyCategoryLabel(c.category)}
      </Link>

      {/* 제목 */}
      <h1 className="mt-3 text-[28px] font-bold leading-[1.3] text-neutral sm:text-[38px]">
        {c.title}
      </h1>

      {/* 메타(날짜) */}
      <div className="mt-6 border-b border-line pb-6">
        <span className="text-[15px] text-muted">{fmtDate(c.publishedAt)}</span>
      </div>

      {/* 본문 */}
      <div className="mt-10">
        <Markdown>{c.body}</Markdown>
      </div>

      {/* 출처(각주) */}
      {c.references && c.references.length > 0 && (
        <ol className="mt-12 flex list-decimal flex-col gap-1.5 border-t border-line pl-5 pt-6 text-sm text-muted">
          {c.references.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer" className="text-brand underline">
                {r.title}
              </a>
            </li>
          ))}
        </ol>
      )}

      {/* FAQ */}
      {c.faqs && c.faqs.length > 0 && (
        <section aria-labelledby="column-faq" className="mt-12">
          <h2 id="column-faq" className="text-xl font-bold text-neutral">
            자주 묻는 질문
          </h2>
          <div className="mt-4">
            <FaqAccordion faqs={c.faqs} />
          </div>
        </section>
      )}

      {/* 안내(의학적 면책) 박스 */}
      <div className="mt-12 flex gap-3 rounded-xl bg-neutral-weak p-5">
        <span className="mt-0.5 shrink-0 text-subtle">
          <InfoIcon />
        </span>
        <div className="text-sm leading-relaxed text-muted">
          본 콘텐츠는 <b className="text-neutral">{c.author}</b>이(가) 작성한 일반적인 건강
          정보로, 개인의 증상·질환에 대한 진단이나 치료를 대체하지 않습니다. 정확한 진단과
          치료는 반드시 의료진과 상담하세요.
        </div>
      </div>

      {/* 목록으로 */}
      <div className="mt-10 text-center">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
        >
          {backLabel}
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
