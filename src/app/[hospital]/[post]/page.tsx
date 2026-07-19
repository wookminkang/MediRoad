import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { getHospitalBySlug } from "@/api/hospital";
import { getHospitalPost } from "@/api/hospital-post";
import { HospitalPostDetail } from "@/components/hospital/hospital-post-detail";
import { PageContainer } from "@/components/ui/page-container";
import {
  findGuideForPost,
  guideTitle,
  guideUrl,
  isGuidePost,
  postUrl,
} from "@/constants/hospital-keyword-pages";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { buildPostGraphLd } from "@/lib/seo/hospital-post-jsonld";
import { buildPostMeta } from "@/lib/seo/hospital-post-meta";
import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

type Params = Promise<{ hospital: string; post: string }>;

// 큐레이션된 포스팅만 렌더(그 외 404 → 2세그먼트 catch-all doorway 차단).
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  return []; // ISR on-demand (빌드 프리렌더 안 함)
}

/** "{제목} | {브랜드}"를 limit자 이내로. 지점 포함 브랜드→짧은 병원명→제목 절단 순. */
function buildTitleWithinLimit(
  base: string,
  brandFull: string,
  brandShort: string,
  limit: number,
): string {
  const full = `${base} | ${brandFull}`;
  if (full.length <= limit) return full;
  const short = `${base} | ${brandShort}`;
  if (short.length <= limit) return short;
  const suffix = ` | ${brandShort}`;
  const room = Math.max(0, limit - suffix.length - 1); // -1: 말줄임표
  return `${base.slice(0, room).trimEnd()}…${suffix}`;
}

async function load(
  params: Params,
): Promise<{ h: Hospital; post: HospitalPost; slug: string } | null> {
  const { hospital, post: postSeg } = await params;
  const slug = decodeURIComponent(hospital);
  const postId = decodeURIComponent(postSeg);
  const h = await getHospitalBySlug(slug); // 옛 slug 별칭도 정규 slug로 해석
  if (!h) return null;
  // 큐레이션(가이드에 묶인 포스팅)에 없으면 노출하지 않는다.
  if (!isGuidePost(h.slug, postId)) return null;
  const post = await getHospitalPost(postId);
  if (!post || post.hospitalId !== h.id) return null;
  return { h, post, slug };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const data = await load(params);
  if (!data) {
    return { title: "글을 찾을 수 없어요", robots: { index: false, follow: false } };
  }
  const { h, post } = data;
  const url = `${SITE_URL}${postUrl(h.slug, post.id)}`;
  const { description, keywords } = buildPostMeta(h, post);
  // 검색 의도형 제목 — "{지역 증상 진료 자연어} | {병원명 지점}". <title> 40자 이내.
  const title = buildTitleWithinLimit(post.title, post.author.name, h.name, 40);
  const image = post.seo?.ogImage ?? post.thumbnail;

  return {
    title: { absolute: title },
    description,
    keywords,
    authors: [{ name: h.name }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: { canonical: url },
    robots: {
      index: !post.seo?.noindex,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      ...(post.publishedAt && { publishedTime: post.publishedAt }),
      ...(post.updatedAt && { modifiedTime: post.updatedAt }),
      authors: [h.name],
      ...(image && { images: [{ url: image, alt: post.title }] }),
    },
    other: {
      "geo.region": "KR",
      "geo.placename": `${h.region.sido} ${h.region.sigungu}`,
      "geo.position": `${h.location.lat};${h.location.lng}`,
      ICBM: `${h.location.lat}, ${h.location.lng}`,
      copyright: SITE_NAME,
      "article:section": "병원 건강정보",
    },
  };
}

export default async function HospitalPostPage({
  params,
}: {
  params: Params;
}) {
  const data = await load(params);
  if (!data) notFound();
  const { h, post, slug } = data;
  // 옛 slug로 들어오면 정규 slug 포스팅으로 301
  if (slug !== h.slug) permanentRedirect(postUrl(h.slug, post.id));

  const url = `${SITE_URL}${postUrl(h.slug, post.id)}`;
  const jsonLd = [buildPostGraphLd(h, post, url)];

  // 양방향 링크: 소속 가이드 + 같은 가이드의 다른 글
  const guide = findGuideForPost(h.slug, post.id);
  const siblings = guide
    ? (
        await Promise.all(
          guide.postIds
            .filter((id) => id !== post.id)
            .map((id) => getHospitalPost(id)),
        )
      ).filter((p): p is HospitalPost => Boolean(p))
    : [];

  return (
    <PageContainer maxWidth="max-w-3xl">
      {/* 상단 뒤로가기 링크는 제거. 허브 연결은 하단 "가이드 전체 보기 →"가 담당 */}
      <HospitalPostDetail hospital={h} post={post} />

      {/* 허브 연결(내부) — 외부 홈페이지 대신 메디로드 허브로 유도. 가이드 있으면 항상 노출 */}
      {guide && (
        <section className="mt-10 border-t border-black/[0.07] pt-8">
          {siblings.length > 0 && (
            <>
              <h2 className="text-lg font-extrabold tracking-tight text-neutral">
                같은 주제의 다른 글
              </h2>
              <ul className="mt-4 flex flex-col gap-2">
                {siblings.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={postUrl(h.slug, s.id)}
                      className="flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-[15px] font-medium text-neutral transition-colors hover:bg-neutral-weak"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Link
            href={guideUrl(h.slug, guide.keyword)}
            className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-brand/20 bg-brand-weak px-5 py-4 text-[15px] font-bold text-neutral transition-colors hover:bg-brand-weak/70"
          >
            <span>{guideTitle(guide)} 가이드에서 더 보기</span>
            <span aria-hidden style={{ color: "var(--seed-color-fg-brand)" }}>
              →
            </span>
          </Link>
        </section>
      )}

      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
    </PageContainer>
  );
}
