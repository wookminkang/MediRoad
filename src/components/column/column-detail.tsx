import Link from "next/link";

import { FaqAccordion } from "@/components/ui/faq-accordion";
import { PostActions } from "@/components/hospital/post-actions";
import { anyCategoryLabel } from "@/constants/briefing";
import type { Column } from "@/types/column";

import { Markdown } from "./markdown";

const fmtDate = (iso: string) => iso.replaceAll("-", "/");

/** 본문 마크다운 → 평문(음성 읽기용) */
const toPlain = (md: string) =>
  md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*`>_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

      {/* 메타(날짜) + 액션(AI요약·음성·공유·인쇄) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <span className="text-[15px] text-muted">{fmtDate(c.publishedAt)}</span>
        <PostActions title={c.title} summary={c.summary} bodyText={toPlain(c.body)} />
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

      {/* 태그 */}
      {c.tags && c.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {c.tags.map((t) => (
            <Link
              key={t}
              href={`${basePath}?q=${encodeURIComponent(t)}`}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm text-neutral transition-colors hover:bg-neutral-weak"
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* 관련 병원 */}
      {c.relatedDepartments && c.relatedDepartments.length > 0 && (
        <section aria-label="관련 병원" className="mt-10">
          <h2 className="text-base font-bold text-neutral">이 글과 관련된 병원</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.relatedDepartments.map((d) => (
              <Link
                key={d}
                href={`/hospitals?department=${encodeURIComponent(d)}`}
                className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-weak"
              >
                {d} 병원 보기
              </Link>
            ))}
          </div>
        </section>
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
          {/*
           * 개별 감수자 이름은 노출하지 않는다. 실제 감수자로 확인되지 않은 이름을
           * 표기하면 오히려 신뢰도(E-E-A-T)에 해가 된다. "검수됨"이라는 신뢰 신호만
           * 편집팀 명의로 유지한다.
           */}
          <div className="mt-2 text-subtle">메디로드 의료편집팀 검수</div>
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
