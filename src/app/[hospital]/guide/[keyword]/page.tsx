import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { getHospitalBySlug } from "@/api/hospital";
import { getHospitalPost } from "@/api/hospital-post";
import { HospitalMiniMap } from "@/components/hospital/hospital-mini-map";
import { OpeningHoursTable } from "@/components/hospital/opening-hours-table";
import { MapPlaceholder } from "@/components/map/map-placeholder";
import { PageContainer } from "@/components/ui/page-container";
import {
  findGuide,
  guidesForHospital,
  guideTitle,
  guideUrl,
  type HospitalGuide,
  postUrl,
} from "@/constants/hospital-keyword-pages";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import { buildHospitalGlanceBrief, walkMinutes } from "@/lib/hospital";
import { buildMedicalClinicLd } from "@/lib/seo/hospital-jsonld";
import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

type Params = Promise<{ hospital: string; keyword: string }>;

// 큐레이션 가이드만 렌더(그 외 404). on-demand ISR.
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

/** 마지막 글자에 받침이 있으면 true (조사 을/를·은/는 선택용). */
function hasBatchim(s: string): boolean {
  const t = s.trim();
  const c = t.charCodeAt(t.length - 1);
  if (Number.isNaN(c) || c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}

/** 허브 한줄 요약(2~3문장) — 키워드 중심, 의료광고법 안전(효과 단정 없음). */
function guideSummary(g: HospitalGuide, h: Hospital): string {
  if (g.intro) return g.intro;
  const kw = g.keyword;
  const josa = hasBatchim(kw) ? "을" : "를";
  return (
    `${kw}${josa} 알아보고 있다면, 관련 진료·치료 정보를 이 페이지에서 한곳에 모아 확인할 수 있어요. ` +
    `${h.name}의 관련 콘텐츠와 위치·진료시간 등 기본 정보를 함께 정리했습니다.`
  );
}

async function load(
  params: Params,
): Promise<{ h: Hospital; guide: HospitalGuide; slug: string } | null> {
  const { hospital, keyword: kw } = await params;
  const slug = decodeURIComponent(hospital);
  const h = await getHospitalBySlug(slug); // 옛 slug 별칭도 정규 slug로 해석
  if (!h) return null;
  const guide = findGuide(h.slug, decodeURIComponent(kw)); // 정규 slug로 큐레이션 조회
  if (!guide) return null; // 큐레이션에 없는 가이드 → 404
  return { h, guide, slug };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const data = await load(params);
  if (!data) {
    return { title: "페이지를 찾을 수 없어요", robots: { index: false, follow: false } };
  }
  const { h, guide, slug } = data;
  const url = `${SITE_URL}${guideUrl(slug, guide.keyword)}`;
  const description = guideSummary(guide, h);
  // 검색 의도형 허브 제목 — "{키워드 자연어} | {병원명}" (40자 이내로 짧은 병원명 사용)
  const title = `${guideTitle(guide)} | ${h.name}`;
  // 대표 이미지 = 가이드 첫 포스팅 썸네일(있으면)
  const firstPostId = guide.postIds[0];
  const firstPost = firstPostId ? await getHospitalPost(firstPostId) : null;
  const image = firstPost?.thumbnail;
  return {
    title: { absolute: title },
    description,
    keywords: [guide.keyword, h.name, `${h.region.sigungu} ${h.type}`],
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      ...(image && { images: [{ url: image, alt: guide.keyword }] }),
    },
  };
}

export default async function HospitalGuideHubPage({
  params,
}: {
  params: Params;
}) {
  const data = await load(params);
  if (!data) notFound();
  const { h, guide, slug } = data;
  // 옛 slug로 들어오면 정규 slug 허브로 301
  if (slug !== h.slug) permanentRedirect(guideUrl(h.slug, guide.keyword));

  const summary = guideSummary(guide, h);
  const detailUrl = `/hospitals/${encodeURIComponent(h.slug)}`;
  const url = `${SITE_URL}${guideUrl(slug, guide.keyword)}`;

  // 병원 기본 정보(허브 전용 조립) — 주소 → 진료시간 → 지도 → 한눈에 보는 순
  const addr = h.roadAddress ?? h.address;
  const station = h.nearestStation;
  const hasHours = !!(h.hours && h.hours.length > 0);
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(`${h.name} ${h.region.sigungu}`)}`;
  // 한눈에 보는 = 병원 1줄 소개 + 입원실(운영 시). 진료시간은 위 별도 섹션이 담당해 생략.
  const glanceBullets = buildHospitalGlanceBrief(h, { includeHours: false });

  // 가이드에 묶인 포스팅(순서 유지) — 이 허브의 핵심 콘텐츠
  const guidePosts = (
    await Promise.all(guide.postIds.map((id) => getHospitalPost(id)))
  ).filter((p): p is HospitalPost => Boolean(p));
  const repImage = guidePosts.find((p) => p.thumbnail)?.thumbnail;
  // 이 병원의 다른 대표 키워드(현재 키워드 제외) — 허브 간 내부링크
  const otherGuides = guidesForHospital(h.slug).filter(
    (g) => g.keyword !== guide.keyword,
  );

  // ── JSON-LD @graph — BreadcrumbList·WebPage·MedicalClinic·ItemList·ImageObject ──
  const clinicUrl = `${SITE_URL}${detailUrl}`;
  const clinicNode: Record<string, unknown> = {
    ...buildMedicalClinicLd(h),
    "@id": `${clinicUrl}#clinic`,
  };
  delete clinicNode["@context"]; // @graph 내부 노드는 @context를 갖지 않는다

  const imageNode = repImage
    ? {
        "@type": "ImageObject",
        "@id": `${url}#primaryimage`,
        url: repImage,
        contentUrl: repImage,
      }
    : null;

  const breadcrumbNode = {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "메디로드", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: h.name, item: clinicUrl },
      { "@type": "ListItem", position: 3, name: guide.keyword, item: url },
    ],
  };

  const itemListNode =
    guidePosts.length > 0
      ? {
          "@type": "ItemList",
          "@id": `${url}#itemlist`,
          name: `${guide.keyword} 관련 포스팅`,
          numberOfItems: guidePosts.length,
          itemListElement: guidePosts.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}${postUrl(h.slug, p.id)}`,
            name: p.title,
          })),
        }
      : null;

  const webPageNode = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: `${guideTitle(guide)} | ${h.name}`,
    description: summary,
    inLanguage: "ko-KR",
    about: { "@id": clinicNode["@id"] },
    breadcrumb: { "@id": breadcrumbNode["@id"] },
    ...(imageNode && { primaryImageOfPage: { "@id": imageNode["@id"] } }),
    ...(itemListNode && { mainEntity: { "@id": itemListNode["@id"] } }),
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".guide-summary"],
    },
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      webPageNode,
      breadcrumbNode,
      clinicNode,
      itemListNode,
      imageNode,
    ].filter(Boolean),
  };

  return (
    <PageContainer maxWidth="max-w-5xl">
      {/* 경로 안내 */}
      <nav aria-label="경로 안내" className="text-sm text-muted">
        <Link href="/" className="hover:underline">
          메디로드
        </Link>
        {" › "}
        <Link href={detailUrl} className="hover:underline">
          {h.name}
        </Link>
        {" › "}
        <span className="text-neutral">{guide.keyword}</span>
      </nav>

      {/* H1 = 키워드 */}
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral sm:text-4xl">
        {guide.keyword}
      </h1>

      {/* H2 한줄 요약 */}
      <section aria-labelledby="guide-summary" className="mt-6">
        <h2
          id="guide-summary"
          className="text-lg font-extrabold tracking-tight text-neutral"
        >
          한줄 요약
        </h2>
        <p className="guide-summary mt-2 max-w-3xl text-[15px] leading-relaxed text-neutral">
          {summary}
        </p>
      </section>

      {/* H2 관련 포스팅 (이 가이드의 포스팅 목록) — Topic Hub 핵심 */}
      {guidePosts.length > 0 && (
        <section aria-labelledby="guide-posts" className="mt-8">
          <h2
            id="guide-posts"
            className="text-lg font-extrabold tracking-tight text-neutral"
          >
            {guide.keyword} 관련 글
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {guidePosts.map((p) => (
              <li key={p.id}>
                <Link
                  href={postUrl(h.slug, p.id)}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line transition-colors hover:bg-neutral-weak"
                >
                  {p.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.thumbnail}
                      alt=""
                      className="aspect-[16/9] w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[15px] font-bold leading-snug text-neutral">
                      {p.title}
                    </p>
                    {p.excerpt && (
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                        {p.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* H2 대표 키워드 — 이 병원의 다른 키워드 허브로 크로스링크 */}
      {otherGuides.length > 0 && (
        <section aria-labelledby="hub-keywords" className="mt-10">
          <h2
            id="hub-keywords"
            className="text-lg font-extrabold tracking-tight text-neutral"
          >
            {h.name} 대표 키워드
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {otherGuides.map((g) => (
              <Link
                key={g.keyword}
                href={guideUrl(h.slug, g.keyword)}
                className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-neutral transition-colors hover:border-brand hover:text-brand"
              >
                {g.keyword}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* H2 병원 기본 정보 — 허브 전용: 주소 → 진료시간 → 지도 → 한눈에 보는 */}
      <section
        aria-labelledby="guide-hospital"
        className="mt-10 border-t border-black/[0.06] pt-8"
      >
        <h2
          id="guide-hospital"
          className="text-lg font-extrabold tracking-tight text-neutral"
        >
          병원 기본 정보
        </h2>

        <div className="mt-5 flex flex-col gap-8">
          {/* 1. 한눈에 보는 (병원 1줄 소개 · 입원실) */}
          {glanceBullets.length > 0 && (
            <div className="rounded-2xl bg-neutral-weak p-5">
              <h3 className="text-[15px] font-bold text-neutral">
                한눈에 보는 {h.name}
              </h3>
              <ul className="mt-3 flex flex-col gap-1.5">
                {glanceBullets.map((s) => (
                  <li
                    key={s}
                    className="flex gap-2 text-[14px] leading-relaxed text-neutral"
                  >
                    <span aria-hidden className="text-brand">
                      ·
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. 주소 · 오시는 길 */}
          <div>
            <h3 className="text-[15px] font-bold text-neutral">주소 · 오시는 길</h3>
            <address className="mt-2 text-[15px] not-italic text-neutral">
              {addr}
            </address>
            {station && (
              <p className="mt-1 text-sm text-muted">
                {station.name}
                {station.line ? ` (${station.line})` : ""}
                {station.exit ? ` ${station.exit}번 출구` : ""} 도보{" "}
                {walkMinutes(station.distanceM)}분
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2.5">
              {h.phone && (
                <a
                  href={`tel:${h.phone}`}
                  className="inline-flex items-center rounded-full bg-brand-solid px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  {h.phone}
                </a>
              )}
              <a
                href={naverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-black/[0.12] bg-white px-5 py-2.5 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
              >
                네이버 지도 길찾기
              </a>
            </div>
          </div>

          {/* 3. 지도 (주소 바로 아래) */}
          <div>
            <h3 className="text-[15px] font-bold text-neutral">지도</h3>
            <div className="mt-3">
              {h.location?.lat && h.location?.lng ? (
                <HospitalMiniMap
                  lat={h.location.lat}
                  lng={h.location.lng}
                  className="h-52 w-full overflow-hidden rounded-xl"
                />
              ) : (
                <MapPlaceholder className="min-h-[13rem] rounded-xl" />
              )}
            </div>
          </div>

          {/* 4. 진료시간 */}
          {hasHours && (
            <div>
              <h3 className="text-[15px] font-bold text-neutral">진료시간</h3>
              <p className="mt-1 text-[13px] text-muted">
                명절·임시 휴진은 다를 수 있어요. 방문 전 확인을 권장합니다.
              </p>
              <div className="mt-3">
                <OpeningHoursTable hours={h.hours!} holidayClosed={h.holidayClosed} />
              </div>
            </div>
          )}

        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
    </PageContainer>
  );
}
