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

/**
 * 병원 포스트 상세 — 프리미엄 에디토리얼.
 * 다크 히어로(제목·이미지/빈박스·CTA) + 라이트 본문(요약카드·마크다운·FAQ) + 다크 CTA 밴드 + 관련.
 */
export function HospitalPostDetail({
  hospital: h,
  post,
}: {
  hospital: Hospital;
  post: HospitalPost;
}) {
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${h.name} ${h.region.sigungu}`)}`;
  const addr = h.roadAddress ?? h.address;

  return (
    <article className="flex flex-col gap-16">
      {/* ── HERO (다크) ─────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1B33] via-[#122242] to-[#0B1526] p-7 sm:p-10">
        {/* 우상단 은은한 글로우 */}
        <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#1E5BD6]/25 blur-3xl" />

        <nav aria-label="경로 안내" className="relative">
          <span className="text-[13px] text-white/55">
            <Link href="/" className="hover:text-white/80">
              홈
            </Link>
            {" / "}
            <Link
              href={`/hospitals/${h.slug}`}
              className="hover:text-white/80"
            >
              {h.name}
            </Link>
            {" / "}
            <span className="text-white/75">건강정보</span>
          </span>
        </nav>

        <div className="relative mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          {/* 텍스트 */}
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#7FA9F5]">
              {h.region.sigungu} · {h.type}
            </p>
            <h1 className="mt-3 text-[1.9rem] font-extrabold leading-[1.2] tracking-tight text-white sm:text-[2.6rem]">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
                {post.excerpt}
              </p>
            )}

            {/* CTA */}
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              {h.phone && (
                <a
                  href={`tel:${h.phone}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1E5BD6] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(44,107,229,0.45)] transition-colors hover:bg-[#1a4fbb]"
                >
                  <PhoneIcon />
                  {h.phone} 상담
                </a>
              )}
              <a
                href={naverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
              >
                오시는 길
              </a>
            </div>

            {/* 메타 */}
            <p className="mt-5 text-[13px] text-white/45">
              {post.author.name}
              {post.publishedAt && ` · ${fmtDate(post.publishedAt)}`}
              {post.readingMinutes ? ` · 약 ${post.readingMinutes}분` : ""}
            </p>
          </div>

          {/* 대표 이미지 — 없으면 빈 박스 */}
          {post.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnail}
              alt={post.title}
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[0_10px_30px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-white/20">
              <ImageIcon />
            </div>
          )}
        </div>
      </header>

      {/* ── 액션 바 (AI요약·공유) ────────────────────────── */}
      <div className="-mt-6 flex items-center justify-end border-b border-black/[0.06] pb-6">
        <PostActions
          title={post.title}
          summary={post.summary}
          bodyText={toPlain(post.body)}
        />
      </div>

      {/* ── 핵심 요약 카드 ───────────────────────────────── */}
      {post.summary && post.summary.length > 0 && (
        <Section eyebrow="SUMMARY" title="핵심 요약">
          <div className="grid gap-3 sm:grid-cols-2">
            {post.summary.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04]"
              >
                <span className="text-xs font-bold tracking-[0.15em] text-brand">
                  {`0${i + 1}`}
                </span>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral">
                  {s}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── 본문 ─────────────────────────────────────────── */}
      <Section eyebrow="ARTICLE" title="자세히 살펴보기" bare>
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04] sm:p-9">
          <Markdown>{post.body}</Markdown>

          {/* 출처 */}
          {post.references && post.references.length > 0 && (
            <ol className="mt-10 flex list-decimal flex-col gap-1.5 border-t border-black/[0.06] pl-5 pt-6 text-sm text-muted">
              {post.references.map((r, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand underline"
                  >
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
                <span
                  key={t}
                  className="rounded-full border border-black/[0.08] px-3.5 py-1.5 text-sm text-neutral"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      {post.faqs && post.faqs.length > 0 && (
        <Section eyebrow="FAQ" title="자주 묻는 질문">
          <FaqAccordion faqs={post.faqs} />
        </Section>
      )}

      {/* ── CTA 밴드 (다크) ──────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#122242] to-[#0B1526] px-6 py-12 text-center sm:px-10 sm:py-16">
        <h2 className="text-xl font-extrabold text-white sm:text-2xl">
          {h.name}에서 상담받으세요
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
          정확한 진료시간·휴진 여부는 방문 전 전화로 확인하시는 것을 권장합니다.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          {h.phone && (
            <a
              href={`tel:${h.phone}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#1E5BD6] px-6 py-3 text-sm font-bold text-white shadow-[0_6px_20px_rgba(44,107,229,0.45)] transition-colors hover:bg-[#1a4fbb]"
            >
              <PhoneIcon />
              {h.phone} 전화 상담
            </a>
          )}
          <a
            href={naverUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
          >
            네이버 지도 길찾기
          </a>
        </div>
        <p className="mt-6 text-[13px] text-white/40">{addr}</p>
      </section>

      {/* ── 관련 (진료과목/질환) ─────────────────────────── */}
      {(post.relatedDepartments?.length || post.conditions?.length) && (
        <Section eyebrow="RELATED" title="이런 점도 궁금하셨다면" bare>
          <div className="grid gap-3 sm:grid-cols-2">
            {(post.relatedDepartments ?? []).map((d) => (
              <Link
                key={`dep-${d}`}
                href={`/hospitals?department=${encodeURIComponent(d)}`}
                className="group flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04] transition-colors hover:ring-brand/40"
              >
                <span className="text-[15px] font-medium text-neutral">
                  {d} 병원 찾기
                </span>
                <span className="text-subtle transition-transform group-hover:translate-x-0.5">
                  <ChevronRightIcon />
                </span>
              </Link>
            ))}
            {(post.conditions ?? []).map((c) => (
              <div
                key={`cond-${c}`}
                className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04]"
              >
                <span className="text-[15px] font-medium text-neutral">
                  {c}
                </span>
                <span className="text-xs text-subtle">다룬 주제</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── E-E-A-T 면책 ─────────────────────────────────── */}
      <div className="flex gap-3 rounded-2xl bg-neutral-weak p-5">
        <span className="mt-0.5 shrink-0 text-subtle">
          <InfoIcon />
        </span>
        <div className="text-sm leading-relaxed text-muted">
          본 콘텐츠는 일반적인 건강정보이며, 개인의 증상·진단을 대신하지
          않습니다. 정확한 진단·치료는 반드시 의료진과 상담하세요.
          {post.reviewedBy && (
            <div className="mt-2 text-subtle">
              감수 · {post.reviewedBy.name} ({post.reviewedBy.specialty})
            </div>
          )}
        </div>
      </div>

      {/* 병원으로 돌아가기 */}
      <div className="text-center">
        <Link
          href={`/hospitals/${h.slug}`}
          className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] px-5 py-2.5 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
        >
          {h.name} 정보 보기
        </Link>
      </div>
    </article>
  );
}

/** 프리미엄 섹션 — eyebrow + 타이틀 + 콘텐츠 */
function Section({
  eyebrow,
  title,
  bare = false,
  children,
}: {
  eyebrow?: string;
  title: string;
  bare?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <div className="mb-4">
        {eyebrow && (
          <p className="text-xs font-bold tracking-[0.15em] text-brand">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-neutral">
          {title}
        </h2>
      </div>
      {bare ? (
        children
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04] sm:p-7">
          {children}
        </div>
      )}
    </section>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg {...iconProps} width={18} height={18} strokeWidth={2.2}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg {...iconProps} width={44} height={44} strokeWidth={1.4}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.5-3.5a2 2 0 0 0-3 0L5 21" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}
