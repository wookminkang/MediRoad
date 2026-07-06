import type { Metadata } from "next";
import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";

import { ActionButton, Text } from "@seed-design/react";

import { getColumns } from "@/api/column";
import { getLatestHospitalPosts } from "@/api/hospital-post";
import { ColumnCard } from "@/components/column/column-card";
import { SITE_URL } from "@/constants/site";
// import { ImagePlaceholder } from "@/components/home/image-placeholder"; // CTA 밴드 보류로 미사용

// 홈 self-canonical (사이트맵 홈 URL과 동일 — 슬래시 없는 SITE_URL)
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

// ISR — 정적 프리렌더 + 10분마다 백그라운드 재생성(매 요청 DB 대기 제거 → 즉시 서빙)
export const revalidate = 600;

/** 진료과목 (원형 카드) */
const CONCERNS: { dept: string; hint: string; icon: string }[] = [
  { dept: "내과", hint: "감기·소화기·만성질환", icon: "/내과.svg" },
  { dept: "소아청소년과", hint: "우리 아이 진료", icon: "/소아청소년과.svg" },
  { dept: "치과", hint: "충치·교정·임플란트", icon: "/치과.svg" },
  { dept: "피부과", hint: "피부 질환·트러블", icon: "/피부과.svg" },
  { dept: "이비인후과", hint: "코·목·귀", icon: "/이비인후과.svg" },
  { dept: "안과", hint: "시력·눈 질환", icon: "/안과.svg" },
  { dept: "정신건강의학과", hint: "마음·수면·스트레스", icon: "/정신건강의학과.svg" },
  { dept: "한방", hint: "한의원·한방병원", icon: "/한의과.svg" },
];

/** 메디로드 가치 (아이콘 블록) */
const VALUES: { icon: ReactNode; title: string; desc: string }[] = [
  {
    icon: <PinIcon />,
    title: "가까운 순서로 보여드려요",
    desc: "현재 위치를 기준으로 가장 가까운 병원부터 정확한 거리와 함께 정렬합니다.",
  },
  {
    icon: <ClockIcon />,
    title: "지금 문 연 병원을 한눈에",
    desc: "실시간 진료시간을 반영해 '영업중'인 병원만 골라볼 수 있어요.",
  },
  {
    icon: <ShieldIcon />,
    title: "공공데이터 기반의 신뢰",
    desc: "전국 병·의원 공식 정보를 바탕으로 위치·진료과목·연락처를 믿고 확인하세요.",
  },
];

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
const areaMapHref = (r: { lat: number; lng: number }) =>
  `/map?lat=${r.lat}&lng=${r.lng}&zoom=14`;

export default async function Home() {
  const [{ items: columns }, posts] = await Promise.all([
    getColumns({ pageSize: 3 }),
    getLatestHospitalPosts(3),
  ]);

  return (
    <>
      {/* Hero — 배경 이미지 + 카피 오버레이 */}
      <section aria-labelledby="hero" className="relative h-[420px] overflow-hidden sm:h-[540px]">
        <Image
          src="/main_hero_banner_1.jpg"
          alt="메디로드 - 내 주변 병원·한의원을 지도로 찾는 서비스"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
        <div
          className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-24 sm:pb-28"
          style={{ textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}
        >
          <p className="text-base font-semibold text-white sm:text-xl">
            우리 동네 병원을 가장 쉽게 찾는 방법
          </p>
          <h1
            id="hero"
            className="mt-3 text-4xl font-bold leading-[1.15] text-white sm:text-6xl"
          >
            내 주변 병원,
            <br />
            지도로 빠르게 찾으세요
          </h1>
          <p className="mt-4 max-w-lg text-base text-white/90 sm:text-lg">
            위치·진료시간·진료과목까지, 우리 동네 병원·한의원을 한눈에.
          </p>
          <div className="mt-7">
            <ActionButton asChild variant="brandSolid" size="large">
              <Link href="/map">지도에서 병원 찾기</Link>
            </ActionButton>
          </div>
        </div>
      </section>

      {/* 진료과목 — 어디서부터 찾을지 모를 때 */}
      <section aria-labelledby="concerns" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            title={"어떤 병원을 찾아야 할지,\n어디서부터 시작할지 모를 때"}
            sub="증상·진료과목별로 가까운 병원을 바로 찾아보세요."
            id="concerns"
          />
          <ul className="mt-12 grid grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4">
            {CONCERNS.map(({ dept, hint, icon }) => (
              <li key={dept}>
                <Link
                  href={`/hospitals?department=${encodeURIComponent(dept)}`}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <Image
                    src={icon}
                    alt={`${dept} 진료과목`}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-16 w-16 rounded-2xl transition-transform hover:scale-105 sm:h-20 sm:w-20"
                  />
                  <span className="font-bold text-neutral">{dept}</span>
                  <span className="text-xs text-muted">{hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 가치 — 병원 상태에 따라 (좌측 제목 + 우측 문단 + 3블록) */}
      <section aria-labelledby="values" className="bg-neutral-weak">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid items-start gap-x-10 gap-y-12 md:grid-cols-2">
            {/* 좌: 제목 + 가치 블록 */}
            <div>
              <h2
                id="values"
                className="whitespace-pre-line text-2xl font-bold leading-snug text-neutral sm:text-3xl"
              >
                {"무작정 찾기보다,\n기준이 있는 병원 찾기"}
              </h2>
              <div className="mt-10 flex flex-col gap-8">
                {VALUES.map((v) => (
                  <div key={v.title} className="flex items-start gap-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                      {v.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-neutral">{v.title}</h3>
                      <p className="mt-1 text-muted">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 우: 설명 문단 + 지도 이미지 */}
            <div>
              <p className="text-muted">
                메디로드는 병원 정보를 단순히 모아두는 데 그치지 않습니다. 내 위치와 지금
                시간, 진료과목까지 고려해 정말 필요한 병원을 빠르게 찾도록 돕는 것을
                목표로 합니다.
              </p>
              <Image
                src="/main_map.png"
                alt="메디로드 지도 화면 미리보기"
                width={1200}
                height={800}
                className="mt-6 w-full rounded-2xl border border-line shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 어디에서나 — 인기 지역 (사진 카드) */}
      <section aria-labelledby="regions" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
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
          <ul className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {REGIONS.map((r) => (
              <li key={r.name}>
                <Link href={areaMapHref(r)} className="block">
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
                    <Link href={areaMapHref(r)}>병원 둘러보기</Link>
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 병원이 전하는 건강정보 — 병원별 포스트 (실데이터) */}
      {posts.length > 0 && (
        <section aria-labelledby="hospital-posts" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionHeading
              title={"병원이 직접 전하는,\n건강정보"}
              sub="병원이 작성한 진료 이야기와 건강 정보를 만나보세요."
              align="left"
              id="hospital-posts"
            />
            <ul className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-3">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/hospitals/${p.hospitalSlug}/posts/${p.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {/* 브랜드 틴트 헤더 (썸네일 대체 — 아이콘 + 병원명) */}
                    <div className="relative flex items-center gap-2.5 overflow-hidden bg-brand-weak px-5 py-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E5BD6] text-white">
                        <PostMarkIcon />
                      </span>
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

      {/* 건강 이야기 — 최신 칼럼 (실데이터) */}
      {columns.length > 0 && (
        <section aria-labelledby="insights" className="bg-neutral-weak">
          <div className="mx-auto max-w-6xl px-4 py-20">
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
            <ul className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-3">
              {columns.map((c) => (
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

/* ── 아이콘 ── */
function PostMarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M8 12h2l1.5 3 2-6L15 12h1" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
