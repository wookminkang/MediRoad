import Link from "next/link";

import { FaqAccordion } from "@/components/ui/faq-accordion";
import { Markdown } from "@/components/column/markdown";
import type {
  ConditionRelatedHospital,
  ConditionRelatedPost,
} from "@/api/condition";
import type { Condition } from "@/types/condition";

/** 증상·질환 상세 — 개요 + 관련 진료과/병원/콘텐츠 집계 */
export function ConditionDetail({
  condition: c,
  posts,
  hospitals,
}: {
  condition: Condition;
  posts: ConditionRelatedPost[];
  hospitals: ConditionRelatedHospital[];
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/conditions" className="text-sm font-bold text-brand hover:underline">
        ← 증상·질환
      </Link>

      <h1 className="mt-3 text-[28px] font-bold leading-[1.3] text-neutral sm:text-[34px]">
        {c.name}
      </h1>
      <p className="mt-3 text-lg text-muted">{c.excerpt}</p>

      {/* 핵심 요약 */}
      {c.summary.length > 0 && (
        <div className="mt-6 rounded-2xl bg-brand-weak p-5">
          <p className="text-sm font-bold text-brand">핵심 요약</p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-neutral">
            {c.summary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 관련 진료과 + 내 주변 */}
      <div className="mt-8 rounded-2xl border border-line p-5">
        <p className="text-sm font-bold text-neutral">어느 병원에 가야 하나요?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {c.departments.map((d) => (
            <Link
              key={d}
              href={`/hospitals?department=${encodeURIComponent(d)}`}
              className="rounded-full border border-[#1E5BD6] px-3.5 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-weak"
            >
              {d}
            </Link>
          ))}
          <Link
            href="/map"
            className="rounded-full bg-[#1E5BD6] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a4fbb]"
          >
            내 주변에서 찾기
          </Link>
        </div>
      </div>

      {/* 개요 본문 */}
      <div className="mt-10">
        <Markdown>{c.body}</Markdown>
      </div>

      {/* 이 질환을 다루는 병원 */}
      {hospitals.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-neutral">이 질환을 다루는 병원</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {hospitals.map((h) => (
              <Link
                key={h.slug}
                href={`/hospitals/${h.slug}`}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
              >
                {h.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 관련 건강정보(병원 포스트) */}
      {posts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-neutral">{c.name} 관련 건강정보</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/hospitals/${p.hospitalSlug}/posts/${p.id}`}
                  className="flex h-full flex-col gap-1 rounded-xl border border-line p-4 transition-colors hover:bg-neutral-weak"
                >
                  <span className="text-xs font-bold text-brand">{p.hospitalName}</span>
                  <span className="line-clamp-2 font-bold text-neutral">{p.title}</span>
                  <span className="line-clamp-2 text-sm text-muted">{p.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      {c.faqs && c.faqs.length > 0 && (
        <section aria-labelledby="cond-faq" className="mt-12">
          <h2 id="cond-faq" className="text-xl font-bold text-neutral">
            자주 묻는 질문
          </h2>
          <div className="mt-4">
            <FaqAccordion faqs={c.faqs} />
          </div>
        </section>
      )}

      {/* 안내 */}
      <p className="mt-12 rounded-xl bg-neutral-weak p-5 text-sm leading-relaxed text-muted">
        본 정보는 일반적인 건강 정보로, 개인의 증상·질환에 대한 진단이나 치료를 대체하지
        않습니다. 정확한 진단과 치료는 반드시 의료진과 상담하세요.
      </p>
    </article>
  );
}
