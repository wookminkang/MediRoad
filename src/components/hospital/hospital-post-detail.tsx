import Link from "next/link";

import { Markdown } from "@/components/column/markdown";
import { MapPlaceholder } from "@/components/map/map-placeholder";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { extractHeadings } from "@/lib/headings";
import { walkMinutes } from "@/lib/hospital";
import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

import { HospitalMiniMap } from "./hospital-mini-map";
import { OpeningHoursTable } from "./opening-hours-table";
import { PostToc } from "./post-toc";

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
  const toc = extractHeadings(post.body);
  const station = h.nearestStation;
  const hasHours = !!(h.hours && h.hours.length > 0);

  return (
    <article className="flex flex-col gap-10">
      {/* ── 표제 ─────────────────────────────────────────── */}
      <header className="border-b-2 border-neutral/85 pb-7">
        <nav aria-label="경로 안내" className="mb-4">
          <span className="text-[13px] text-subtle">
            <Link href="/" className="hover:text-neutral">
              메디로드
            </Link>
            {" / "}
            <Link href={`/hospitals/${h.slug}`} className="hover:text-neutral">
              {h.name}
            </Link>
          </span>
        </nav>

        <h1 className="text-pretty text-[1.7rem] font-extrabold leading-[1.32] tracking-tight text-neutral sm:text-[2.1rem]">
          {post.title}
        </h1>
        <p className="mt-4 text-[13px] text-subtle">
          메디로드
          {post.publishedAt && ` · ${fmtDate(post.publishedAt)}`}
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

      {/* ── 목차 (상단 sticky 가로 탭) ───────────────────── */}
      <PostToc headings={toc} />

      {/* ── 병원 정보 박스 ───────────────────────────────── */}
      <div className="rounded-2xl border border-black/[0.07] bg-neutral-weak/40 px-5 py-4">
        <p className="text-[15px] font-bold text-neutral">
          {h.name} <span className="font-medium text-muted">({h.type})</span>
        </p>
        <dl className="mt-2.5 flex flex-col gap-1.5 text-[13px] text-muted">
          <div className="flex gap-2">
            <dt className="w-9 shrink-0 font-semibold text-subtle">주소</dt>
            <dd>{addr}</dd>
          </div>
          {h.phone && (
            <div className="flex gap-2">
              <dt className="w-9 shrink-0 font-semibold text-subtle">전화</dt>
              <dd>{h.phone}</dd>
            </div>
          )}
          {station && (
            <div className="flex gap-2">
              <dt className="w-9 shrink-0 font-semibold text-subtle">위치</dt>
              <dd>
                {station.name}
                {station.line ? ` (${station.line})` : ""} 도보{" "}
                {walkMinutes(station.distanceM)}분
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* ── 핵심 요약 — AI가 통째로 인용하는 문장들(speakable) ─────── */}
      {post.summary && post.summary.length > 0 && (
        <section className="post-tldr rounded-2xl bg-brand-weak px-6 py-6 sm:px-7">
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

      {/* ── 콘텐츠 하단 대표 이미지(썸네일) ─────────────────── */}
      {post.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.thumbnail}
          alt={post.title}
          className="aspect-[16/9] w-full rounded-2xl object-cover ring-1 ring-black/[0.06]"
        />
      )}

      {/* ── 찾아오시는 길 · 진료시간 ─────────────────────── */}
      <section className="border-t border-black/[0.07] pt-9">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral">
          {h.name} 찾아오시는 길
        </h2>
        <div className="mt-5 grid gap-5">
          {h.location?.lat && h.location?.lng ? (
            <HospitalMiniMap
              lat={h.location.lat}
              lng={h.location.lng}
              className="h-52 w-full overflow-hidden rounded-xl"
            />
          ) : (
            <MapPlaceholder className="min-h-[13rem] rounded-xl" />
          )}
          <div className="flex flex-col gap-2.5">
            <address className="text-[15px] not-italic text-neutral">
              {addr}
            </address>
            {station && (
              <p className="text-sm text-muted">
                {station.name}
                {station.line ? ` (${station.line})` : ""}
                {station.exit ? ` ${station.exit}번 출구` : ""} 도보{" "}
                {walkMinutes(station.distanceM)}분
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-2.5">
              {h.phone && (
                <a
                  href={`tel:${h.phone}`}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-solid px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  <PhoneIcon />
                  {h.phone}
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
          </div>
        </div>

        {hasHours && (
          <div className="mt-8">
            <h3 className="text-base font-bold text-neutral">진료시간</h3>
            <p className="mt-1 text-[13px] text-muted">
              명절·임시 휴진은 다를 수 있어요. 방문 전 확인을 권장합니다.
            </p>
            <div className="mt-3">
              <OpeningHoursTable hours={h.hours!} holidayClosed={h.holidayClosed} />
            </div>
          </div>
        )}
      </section>

      {/* ── E-E-A-T 면책 ─────────────────────────────────── */}
      <div className="flex gap-3 rounded-2xl bg-neutral-weak p-5">
        <span className="mt-0.5 shrink-0 text-subtle">
          <InfoIcon />
        </span>
        <div className="text-sm leading-relaxed text-muted">
          본 콘텐츠는 일반적인 건강정보이며, 개인의 증상·진단을 대신하지 않습니다.
          정확한 진단·치료는 반드시 의료진과 상담하세요.
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
