"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";

/** 전역 폴백 에러 바운더리 (라우트별 error.tsx 없는 곳 커버) */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorState reset={reset} />;
}
