"use client";

import { useState } from "react";

import { ActionButton, Text } from "@seed-design/react";

/** 칼럼 공유 — 모바일: 네이티브 공유(카카오톡 등) / 데스크탑: 링크 복사·X·페이스북 */
export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const currentUrl = () => window.location.href;

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: currentUrl() });
      } catch {
        /* 사용자 취소 무시 */
      }
    } else {
      copyLink();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 실패 무시 */
    }
  };

  return (
    <div>
      <Text as="span" textStyle="t4Bold" className="text-neutral">
        공유하기
      </Text>
      <div className="mt-2 flex flex-col gap-2">
        <ActionButton
          variant="neutralWeak"
          size="medium"
          className="w-full"
          onClick={nativeShare}
        >
          공유
        </ActionButton>
        <ActionButton
          variant="neutralOutline"
          size="medium"
          className="w-full"
          onClick={copyLink}
        >
          {copied ? "링크 복사됨!" : "링크 복사"}
        </ActionButton>
      </div>
    </div>
  );
}
