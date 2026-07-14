import Link from "next/link";

import { Markdown } from "@/components/column/markdown";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

const fmtDate = (iso: string) => iso.replaceAll("-", ".");

/**
 * 병원 포스트 상세 — 화이트 에디토리얼.
 *
 * 다크 히어로 + 다크 CTA 밴드였던 걸 화이트 문서형으로 바꿨다. 이 글들은 훑는
 * 페이지가 아니라 읽는 페이지다. 암 환자와 보호자가 "수술 후 뭘 먹어야 하나"를
 * 찾아 들어와 끝까지 읽는다. 배경이 어두우면 긴 글이 읽히지 않는다.
 *
 * 읽는 순서를 그대로 화면 순서로 뒀다.
 *   표제 → 핵심 요약(AI가 인용하는 문장) → 본문 → FAQ → 상담 → 면책
 *
 * 본문 스타일(제목 옆 파란 바, 핵심 답변 인용 박스)은 .post-body 스코프다.
 * .markdown 전역을 건드리면 건강정보·메디브리핑까지 같이 바뀐다.
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
    <article className="flex flex-col gap-10">
      {/* ── 표제 ─────────────────────────────────────────── */}
      <header className="border-b-2 border-neutral/85 pb-7">
        <nav aria-label="경로 안내" className="mb-4">
          <span className="text-[13px] text-subtle">
            <Link href="/" className="hover:text-neutral">
              홈
            </Link>
            {" / "}
            <Link href={`/hospitals/${h.slug}`} className="hover:text-neutral">
              {h.name}
            </Link>
            {" / "}
            <span className="text-muted">건강정보</span>
          </span>
        </nav>

        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
          {h.name} · {h.region.sigungu}
        </p>
        <h1 className="mt-2.5 text-pretty text-[1.7rem] font-extrabold leading-[1.32] tracking-tight text-neutral sm:text-[2.1rem]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-3.5 max-w-[60ch] text-[15px] leading-relaxed text-muted">
            {post.excerpt}
          </p>
        )}

        <p className="mt-4 text-[13px] text-subtle">
          {post.author.name}
          {post.publishedAt && ` · ${fmtDate(post.publishedAt)}`}
          {post.readingMinutes ? ` · 읽는 데 약 ${post.readingMinutes}분` : ""}
        </p>

        {post.conditions && post.conditions.length > 0 && (
          <ul className="mt-3.5 flex flex-wrap gap-1.5">
            {post.conditions.map((c) => (
              <li
                key={c}
                className="rounded-full bg-brand-weak px-2.5 py-1 text-xs font-semibold text-brand"
              >
                {c}
              </li>
            ))}
          </ul>
        )}
      </header>

      {post.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.thumbnail}
          alt=""
          className="-mt-3 aspect-[16/9] w-full rounded-2xl object-cover ring-1 ring-black/[0.06]"
        />
      )}

      {/* ── 핵심 요약 — AI가 통째로 인용하는 문장들 ─────── */}
      {post.summary && post.summary.length > 0 && (
        <section className="rounded-2xl bg-brand-weak px-6 py-6 sm:px-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand">
            핵심 요약
          </p>
          <ul className="mt-3.5 flex list-disc flex-col gap-2 pl-4 marker:text-brand">
            {post.summary.map((s) => (
              <li key={s} className="text-[15px] leading-[1.7] text-neutral">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 본문 ─────────────────────────────────────────── */}
      <section className="post-body max-w-[65ch]">
        <Markdown>{post.body}</Markdown>

        {post.references && post.references.length > 0 && (
          <ol className="mt-10 flex list-decimal flex-col gap-1.5 border-t border-black/[0.07] pl-5 pt-6 text-sm text-muted">
            {post.references.map((r) => (
              <li key={r.url}>
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

        {post.tags && post.tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <li
                key={t}
                className="rounded-full border border-black/[0.08] px-3.5 py-1.5 text-sm text-muted"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      {post.faqs && post.faqs.length > 0 && (
        <section className="border-t border-black/[0.07] pt-9">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">
            자주 묻는 질문
          </p>
          <h2 className="mt-1.5 mb-4 text-xl font-extrabold tracking-tight text-neutral">
            {post.title.replace(/[?？]$/, "")}에 대해 많이 묻는 것
          </h2>
          <FaqAccordion faqs={post.faqs} />
        </section>
      )}

      {/* ── 상담 안내 ────────────────────────────────────── */}
      <section className="rounded-2xl border border-brand/20 bg-brand-weak px-6 py-9 text-center sm:px-10">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral">
          {h.name}에서 상담받으세요
        </h2>
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted">
          정확한 진료시간·휴진 여부는 방문 전 전화로 확인하시는 것을 권장합니다.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {h.phone && (
            <a
              href={`tel:${h.phone}`}
              className="inline-flex items-center gap-2 rounded-full bg-brand-solid px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <PhoneIcon />
              {h.phone} 전화 상담
            </a>
          )}
          <a
            href={naverUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.12] bg-white px-6 py-3 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
          >
            네이버 지도 길찾기
          </a>
        </div>
        <p className="mt-5 text-[13px] text-subtle">{addr}</p>
      </section>

      {/* ── E-E-A-T 면책 ─────────────────────────────────── */}
      <div className="flex gap-3 rounded-2xl bg-neutral-weak p-5">
        <span className="mt-0.5 shrink-0 text-subtle">
          <InfoIcon />
        </span>
        <div className="text-sm leading-relaxed text-muted">
          본 콘텐츠는 일반적인 건강정보이며, 개인의 증상·진단을 대신하지 않습니다.
          정확한 진단·치료는 반드시 의료진과 상담하세요.
          {post.reviewedBy && (
            <div className="mt-2 text-subtle">
              감수 · {post.reviewedBy.name} ({post.reviewedBy.specialty})
            </div>
          )}
        </div>
      </div>

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
function InfoIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}
