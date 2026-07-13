"use client";

import { Suspense } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { SearchTrigger } from "@/components/search/search-trigger";
import { DEFAULT_SEARCH, matchSection } from "@/constants/nav";

/**
 * 모바일 앱바 (md 미만).
 *
 * 홈       : 로고 ······················ 검색
 * 하위 섹션: 뒤로가기 ── 페이지명(가운데) ── 검색
 *
 * 좌우 슬롯을 같은 폭(2.5rem)으로 고정해야 제목이 화면 정중앙에 온다.
 * 검색은 지금 섹션을 따른다 — 건강정보에서 열면 건강정보를, 메디브리핑에서 열면
 * 메디브리핑을 검색한다. (그래서 각 목록 페이지의 인라인 검색 아이콘은 모바일에서 감춘다)
 */
export function MobileAppBar() {
  const pathname = usePathname();
  const section = matchSection(pathname);
  const search = section?.search ?? DEFAULT_SEARCH;

  if (!section) {
    return (
      <div className="flex w-full items-center justify-between">
        <Logo />
        <HeaderSearch {...search} />
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-[2.5rem_1fr_2.5rem] items-center">
      <BackButton />
      {/*
       * 헤딩(h1~h6)으로 만들면 안 된다. 이 문구는 페이지 주제가 아니라 내비게이션 라벨인데,
       * 헤딩으로 두면 문서 아웃라인에서 본문 H1보다 앞서 나와("병원찾기" → "리움한방병원")
       * 크롤러·AI가 페이지 주제를 잘못 읽는다.
       */}
      <p className="truncate text-center text-[17px] font-bold text-neutral">
        {section.label}
      </p>
      <div className="flex justify-end">
        <HeaderSearch {...search} />
      </div>
    </div>
  );
}

/** 뒤로가기. 외부 유입(히스토리 없음)이면 홈으로 — 빈 화면으로 나가지 않게. */
function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="뒤로 가기"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="flex h-10 w-10 items-center justify-center rounded-full text-neutral transition-colors hover:bg-neutral-weak"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

function Logo() {
  return (
    <Link href="/" aria-label="메디로드 홈" className="flex items-center">
      <Image
        src="/mediroad_logo.svg"
        alt="MediRoad"
        width={86}
        height={43}
        priority
      />
    </Link>
  );
}

/**
 * SearchTrigger는 useSearchParams를 쓴다. 앱바는 루트 레이아웃(헤더)에 있으므로
 * Suspense가 없으면 정적 프리렌더 페이지의 프로덕션 빌드가 깨진다
 * (missing-suspense-with-csr-bailout). 폴백은 같은 크기의 빈 자리.
 */
function HeaderSearch({
  action,
  placeholder,
  suggestions,
}: {
  action: string;
  placeholder: string;
  suggestions: string[];
}) {
  return (
    <Suspense fallback={<div className="h-10 w-10" />}>
      <SearchTrigger
        action={action}
        placeholder={placeholder}
        suggestions={suggestions}
      />
    </Suspense>
  );
}
