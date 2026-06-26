import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR 환경에서 클라이언트가 마운트되자마자 즉시 refetch 하는 것을 방지
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // pending 상태의 쿼리까지 dehydrate 하여 스트리밍 SSR 대응
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    // 서버: 매 요청마다 새로운 QueryClient 생성
    return makeQueryClient();
  }
  // 브라우저: 최초 1회만 생성하여 재사용 (Suspense 등으로 인한 재렌더 시 재생성 방지)
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
