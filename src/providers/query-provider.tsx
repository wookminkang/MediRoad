"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

import { getQueryClient } from "@/lib/react-query";

export default function QueryProvider({ children }: { children: ReactNode }) {
  // useState로 감싸지 않는 이유: getQueryClient가 이미 브라우저에서 싱글톤을 보장함
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
