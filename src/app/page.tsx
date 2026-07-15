import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";

import { ActionButton } from "@seed-design/react";

import { getColumns } from "@/api/column";
import { getLatestHospitalPosts } from "@/api/hospital-post";
import { ColumnCard } from "@/components/column/column-card";
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel";
import {
  PromoCarousel,
  type PromoSlide,
} from "@/components/home/promo-carousel";
import { ScrollRow } from "@/components/home/scroll-row";
import { AREA_REGIONS } from "@/constants/area-regions";
import { SITE_URL } from "@/constants/site";
// import { ImagePlaceholder } from "@/components/home/image-placeholder"; // CTA 밴드 보류로 미사용

// 홈 self-canonical (사이트맵 홈 URL과 동일 — 슬래시 없는 SITE_URL)
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

// ISR — 정적 프리렌더 + 10분마다 백그라운드 재생성(매 요청 DB 대기 제거 → 즉시 서빙)
export const revalidate = 600;

/**
 * 히어로 캐러셀 슬라이드.
 * 카피는 의료광고 안전선(§5-4)을 따른다 — 효과·최고·완치를 암시하지 않고,
 * "찾기·확인" 같은 정보 서비스의 사실만 말한다.
 */
const HERO_SLIDES: HeroSlide[] = [
  {
    image: "/home/hero-v7-1-map.webp",
    badge: "지도로 찾기",
    title: "내 주변 병원,\n지도로 빠르게",
    sub: "위치·진료시간·진료과목을 한눈에",
    href: "/map",
  },
  {
    image: "/home/hero-v7-2-night.webp",
    badge: "지금 문 연 병원",
    title: "지금 진료 중인\n병원만 모아보기",
    sub: "영업 중인 병원을 바로 확인하세요",
    href: "/hospitals?open=1",
  },
  {
    image: "/home/hero-v7-3-time.webp",
    badge: "진료시간 확인",
    title: "헛걸음 없이,\n진료시간부터 확인",
    sub: "요일별 진료시간과 휴진일을 미리 확인하세요",
    href: "/hospitals",
  },
  {
    image: "/home/hero-v7-4-area.webp",
    badge: "지역·지하철역",
    title: "우리 동네부터\n역세권 병원까지",
    sub: "지역과 지하철역으로 가까운 병원 찾기",
    href: "/near",
  },
  {
    image: "/home/hero-v7-5-health.webp",
    badge: "건강정보",
    title: "증상이 궁금할 때\n먼저 읽어보세요",
    sub: "의료진이 감수한 증상·질환·관리법",
    href: "/health",
  },
];

/** 프로모 배너 — 콘텐츠(건강정보·메디브리핑) 진입 */
const PROMO_SLIDES: PromoSlide[] = [
  {
    image: "/home/promo-1-briefing.webp",
    title: "메디브리핑",
    sub: "의료 정책·건강 이슈를 한눈에",
    href: "/briefing",
  },
  {
    image: "/home/promo-2-health.webp",
    title: "건강정보",
    sub: "증상·질환·관리법을 쉽게 풀어드려요",
    href: "/health",
  },
  // 허브 진입점 — 오늘 늘린 지역·야간 데이터로 들어가는 입구
  {
    image: "/home/promo-3-openlate.webp",
    title: "야간·일요일 진료",
    sub: "지금 문 여는 병원을 지역별로",
    href: "/area/송파구/night",
  },
  {
    image: "/home/promo-4-area.webp",
    title: "지역별 병원 찾기",
    sub: "전국 시·군·구에서 진료과목별로",
    href: "/area",
  },
];

/**
 * 바로가기 타일 — 진료과목과 같은 줄에 놓이므로 아이콘 규격도 동일하다.
 * 실제로 있는 라우트·필터로만 연결한다(없는 필터로 링크하면 빈 결과가 나온다).
 */
const SHORTCUTS: { label: string; href: string; icon: string }[] = [
  { label: "지금 진료중", href: "/hospitals?open=1", icon: "/home/icon-open-now.webp" },
  { label: "지도로 찾기", href: "/map", icon: "/home/icon-map.webp" },
  { label: "지역별", href: "/area/강남구", icon: "/home/icon-area.webp" },
  { label: "지하철역", href: "/near", icon: "/home/icon-station.webp" },
];

/** 진료과목 (원형 카드) */
const CONCERNS: { dept: string; hint: string; icon: string }[] = [
  { dept: "내과", hint: "감기·소화기·만성질환", icon: "/dept3d/내과.webp" },
  { dept: "소아청소년과", hint: "우리 아이 진료", icon: "/dept3d/소아청소년과.webp" },
  { dept: "치과", hint: "충치·교정·임플란트", icon: "/dept3d/치과.webp" },
  { dept: "피부과", hint: "피부 질환·트러블", icon: "/dept3d/피부과.webp" },
  { dept: "이비인후과", hint: "코·목·귀", icon: "/dept3d/이비인후과.webp" },
  { dept: "안과", hint: "시력·눈 질환", icon: "/dept3d/안과.webp" },
  { dept: "정신건강의학과", hint: "마음·수면·스트레스", icon: "/dept3d/정신건강의학과.webp" },
  { dept: "한방", hint: "한의원·한방병원", icon: "/dept3d/한방.webp" },
];

/** 주요 지역 바로가기 — 병원 수 상위 24곳. 홈에서 지역 랜딩으로 가는 크롤 경로. */
const TOP_REGIONS = [...AREA_REGIONS]
  .sort((a, b) => b.count - a.count)
  .slice(0, 24)
  .map((r) => ({ slug: r.slug, label: r.label }));

/** 인기 지역 (사진 카드) */
const REGIONS: {
  name: string;
  desc: string;
  image: string;
  lat: number;
  lng: number;
}[] = [
  {
    name: "강남구",
    desc: "정형외과·피부과·치과가 밀집한 지역",
    image: "/main_area_01.png",
    lat: 37.5172,
    lng: 127.0473,
  },
  {
    name: "서초구",
    desc: "내과·소아과 등 생활 진료 중심",
    image: "/main_area_03.png",
    lat: 37.4837,
    lng: 127.0324,
  },
  {
    name: "송파구",
    desc: "대형 병원과 동네 의원이 고루 분포",
    image: "/main_area_02.png",
    lat: 37.5145,
    lng: 127.1066,
  },
  {
    name: "영등포구",
    desc: "여의도 일대 직장인 진료 수요 집중",
    image: "/main_area_04.png",
    lat: 37.5264,
    lng: 126.8962,
  },
];

/** 지역 카드 → 지도 이동 링크 (좌표 + 구 단위 줌) */
/**
 * 인기 지역 카드는 지역 랜딩으로 보낸다.
 *
 * 예전엔 지도(/map?lat=…&lng=…)로 갔다. 지도는 콘텐츠 페이지가 아니라서, 홈이
 * 지역 랜딩 2,144개에 링크를 하나도 주지 않는 상태였다. 사이트맵에만 있고 링크가
 * 없는 페이지를 구글은 "발견됨 — 색인되지 않음"으로 방치한다.
 */
const areaHref = (r: { name: string }) => `/area/${r.name}`;

export default async function Home() {
  const [{ items: columns }, posts] = await Promise.all([
    getColumns({ pageSize: 4 }), // 건강 이야기 — 최대 4개
    getLatestHospitalPosts(6), // 1열 목록 — 최대 6개
  ]);

  return (
    <>
      {/*
       * 홈의 H1 — 캐러셀이 히어로를 대신하면서 화면에는 큰 제목이 없다.
       * 문서에 H1이 하나도 없으면 SEO상 손해라 스크린리더·크롤러용으로 남긴다. (SEO §6-1)
       */}
      <h1 className="sr-only">
        내 주변 병원 찾기 — 위치·진료시간·진료과목을 지도에서 한눈에
      </h1>

      <HeroCarousel slides={HERO_SLIDES} />

      {/*
       * 진료과목 + 바로가기 타일 — 2줄 고정, 넘치면 좌우 스크롤. (올리브영 카테고리 그리드)
       *
       * grid-flow-col + grid-rows-2 로 세로 2칸을 채운 뒤 다음 열로 넘어간다.
       * 한 열 폭을 화면의 1/4로 잡아 4열이 보이고 나머지는 스크롤로 이어진다
       * (딱 떨어지면 더 있다는 게 안 보이므로 4.3열이 걸치게 둔다).
       * 좌우 거터는 음수 마진으로 뚫어 스크롤이 화면 끝까지 이어진다.
       */}
      <section aria-labelledby="concerns" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:pb-20 sm:pt-10">
          <ScrollRow
            ariaLabel="진료과목·바로가기"
            className="no-scrollbar -mx-4 grid auto-cols-[23%] grid-flow-col grid-rows-2 gap-x-2 gap-y-5 overflow-x-auto px-4 sm:auto-cols-[16%] sm:gap-x-4"
          >
            {CONCERNS.map(({ dept, icon }) => (
              <li key={dept}>
                <TileLink
                  href={`/hospitals?department=${encodeURIComponent(dept)}`}
                  icon={icon}
                  alt={`${dept} 진료과목`}
                  label={dept}
                />
              </li>
            ))}
            {SHORTCUTS.map(({ label, href, icon }) => (
              <li key={label}>
                <TileLink href={href} icon={icon} alt={label} label={label} />
              </li>
            ))}
          </ScrollRow>

          <h2 id="concerns" className="sr-only">
            진료과목·바로가기
          </h2>
        </div>
      </section>

      <PromoCarousel slides={PROMO_SLIDES} />

      {/* 병원이 전하는 건강정보 — 병원별 포스트 (실데이터) */}
      {posts.length > 0 && (
        <section aria-labelledby="hospital-posts" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <SectionHeading
              title={"병원이 직접 전하는,\n건강정보"}
              sub="병원이 작성한 진료 이야기와 건강 정보를 만나보세요."
              align="left"
              id="hospital-posts"
            />
            {/* 1열 목록 — 카드 폭이 넓어져 제목·발췌가 잘리지 않는다. 최대 6개 */}
            <ul className="mt-10 flex flex-col gap-4">
              {posts.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/hospitals/${p.hospitalSlug}/posts/${p.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {/* 브랜드 틴트 헤더 (썸네일 대체 — 3D 아이콘 + 병원명) */}
                    <div className="relative flex items-center gap-2.5 overflow-hidden bg-brand-weak px-5 py-4">
                      {/* 3D 아이콘은 자체 파란 타일이 있어 배경 span 없이 그대로 얹는다 */}
                      <Image
                        src="/home/post-health-icon.webp"
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0"
                      />
                      <span className="truncate text-sm font-bold text-brand">
                        {p.hospitalName}
                      </span>
                      {/* 데코 따옴표 */}
                      <svg
                        className="pointer-events-none absolute -right-1 -top-2 text-brand/10"
                        width="76"
                        height="76"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M7 7h4v4c0 3-2 5-5 5v-2c1.7 0 3-1.3 3-3H7V7zm8 0h4v4c0 3-2 5-5 5v-2c1.7 0 3-1.3 3-3h-2V7z" />
                      </svg>
                    </div>
                    {/* 본문 */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-2 text-lg font-bold text-neutral">
                        {p.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">
                        {p.excerpt}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand">
                        자세히 보기
                        <svg
                          className="transition-transform group-hover:translate-x-0.5"
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 어디에서나 — 인기 지역 (사진 카드) */}
      <section aria-labelledby="regions" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              title={"어디에서나,\n같은 기준의 병원 찾기"}
              align="left"
              id="regions"
            />
            <ActionButton asChild variant="neutralWeak" size="medium">
              <Link href="/map">지도에서 찾기</Link>
            </ActionButton>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-6">
            {REGIONS.map((r) => (
              <li key={r.name}>
                <Link href={areaHref(r)} className="block">
                  <Image
                    src={r.image}
                    alt={`${r.name} 병원 찾기`}
                    width={600}
                    height={450}
                    className="aspect-[4/3] w-full rounded-2xl object-cover"
                  />
                  <h3 className="mt-4 text-lg font-bold text-neutral">{r.name}</h3>
                  <p className="mt-1 text-sm text-muted">{r.desc}</p>
                </Link>
                <div className="mt-4">
                  <ActionButton asChild variant="neutralWeak" size="small">
                    <Link href={areaHref(r)}>병원 둘러보기</Link>
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>

          {/*
           * 주요 지역 바로가기 — 크롤 경로의 시작점.
           * 구글은 내부 링크로 "무엇이 중요한지"를 판단한다. 지역 랜딩이 2,144개인데
           * 홈에서 링크가 없으면 아무리 사이트맵에 넣어도 색인이 밀린다.
           */}
          <nav aria-label="주요 지역" className="mt-10 border-t border-line pt-8">
            <p className="text-sm font-bold text-neutral">주요 지역 바로가기</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {TOP_REGIONS.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/area/${r.slug}`}
                    className="inline-block rounded-full border border-line px-3.5 py-2 text-sm text-neutral transition-colors hover:border-brand hover:bg-brand-weak"
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <ActionButton asChild variant="neutralWeak" size="small">
                <Link href="/area">전국 지역 전체보기</Link>
              </ActionButton>
            </div>
          </nav>
        </div>
      </section>

      {/* 건강 이야기 — 최신 칼럼 (실데이터) */}
      {columns.length > 0 && (
        <section aria-labelledby="insights" className="bg-neutral-weak">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionHeading
                title={"메디로드가 전하는,\n건강 이야기"}
                align="left"
                id="insights"
              />
              <ActionButton asChild variant="neutralOutline" size="medium">
                <Link href="/health">모든 건강정보 보기</Link>
              </ActionButton>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-6">
              {columns.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <ColumnCard column={c} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CTA 밴드 — 보류(주석 처리). 다시 노출하려면 주석 해제
      <section className="bg-brand-solid">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text as="h2" textStyle="t7Bold" className="text-white" style={{ color: "#fff" }}>
              내 주변 병원이 궁금하다면
            </Text>
            <p className="mt-2 text-white/85">
              가까운 병원을 위치·진료시간과 함께 지금 바로 찾아보세요.
            </p>
            <div className="mt-6">
              <ActionButton asChild variant="neutralSolid" size="large">
                <Link href="/map">지도에서 병원 찾기</Link>
              </ActionButton>
            </div>
          </div>
          <div className="grid w-full max-w-sm grid-cols-3 gap-3">
            <ImagePlaceholder className="aspect-square" rounded="rounded-xl" />
            <ImagePlaceholder className="aspect-square" rounded="rounded-xl" />
            <ImagePlaceholder className="aspect-square" rounded="rounded-xl" />
          </div>
        </div>
      </section>
      */}
    </>
  );
}

/* ── 섹션 헤딩 (큰 제목 + 보조설명) ── */
function SectionHeading({
  title,
  sub,
  align = "center",
  id,
}: {
  title: string;
  sub?: string;
  align?: "center" | "left";
  id?: string;
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <h2
        id={id}
        className="whitespace-pre-line text-2xl font-bold leading-snug text-neutral sm:text-3xl"
      >
        {title}
      </h2>
      {sub && <p className="mt-3 text-muted">{sub}</p>}
    </div>
  );
}

/** 아이콘 타일 + 라벨 — 진료과목·바로가기가 같은 규격을 쓴다 */
function TileLink({
  href,
  icon,
  alt,
  label,
}: {
  href: string;
  icon: string;
  alt: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 text-center"
    >
      <Image
        src={icon}
        alt={alt}
        width={88}
        height={88}
        unoptimized
        className="h-[64px] w-[64px] rounded-2xl transition-transform group-hover:scale-105 sm:h-[76px] sm:w-[76px]"
      />
      <span className="text-[12px] font-bold leading-tight text-neutral sm:text-[13px]">
        {label}
      </span>
    </Link>
  );
}

/* ── 아이콘 ── */
