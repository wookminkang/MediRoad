import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ActionButton, Text } from "@seed-design/react";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
  robots: { index: false, follow: true },
};

/** 전역 404 — 로고를 활용한 플랫 디자인. 헤더는 그대로 노출됨. */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      {/* 로고 */}
      <Image
        src="/mediroad_logo.svg"
        alt="MediRoad"
        width={132}
        height={66}
        priority
        className="opacity-90"
      />

      {/* 404 */}
      <p
        className="mt-8 text-[88px] font-extrabold leading-none tracking-tight text-brand"
        style={{ letterSpacing: "-0.04em" }}
        aria-hidden
      >
        404
      </p>

      <div className="mt-4">
        <Text as="h1" textStyle="t7Bold">
          페이지를 찾을 수 없어요
        </Text>
      </div>
      <div className="mt-2">
        <Text as="p" textStyle="t5Regular" className="text-subtle">
          주소가 바뀌었거나 삭제된 페이지일 수 있어요.
          <br />
          아래에서 길을 다시 찾아보세요.
        </Text>
      </div>

      {/* 액션 */}
      <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">
        <ActionButton asChild variant="brandSolid" size="medium">
          <Link href="/map">병원 찾기</Link>
        </ActionButton>
        <ActionButton asChild variant="neutralWeak" size="medium">
          <Link href="/">홈으로</Link>
        </ActionButton>
      </div>

      <Link
        href="/faq"
        className="mt-5 text-sm font-medium text-subtle underline-offset-2 hover:underline"
      >
        자주 묻는 질문 보기
      </Link>
    </div>
  );
}
