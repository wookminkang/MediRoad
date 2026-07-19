import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";

import { getHospitalsByIds } from "@/api/hospital";
import { stationPartnerHospitalIds } from "@/constants/partner-stations";
import type { Paginated } from "@/types";
import type { Hospital } from "@/types/hospital";

/**
 * 큐레이션 제휴 병원을 /near 첫 페이지 최상단에 주입.
 *
 * station_name 접두 매칭(getHospitals)으로는 안 잡히는 인근 역에서도 병원을 노출하기 위해,
 * 서버에서 prefetch한 첫 페이지 캐시에 직접 prepend(중복 제거)한다. queryKey를 바꾸지
 * 않으므로 클라이언트 하이드레이션·2페이지+ 무한스크롤과 어긋나지 않는다(주입 병원은
 * 다른 역 소속이라 station 필터가 걸린 2페이지+에는 다시 나타나지 않는다).
 *
 * 예) /near/서울대입구역/한방 → 봉천 소속 이음손을 상단에, /near/둔촌동역/한방 → 둔촌오륜
 * 소속 리움을 상단에.
 */
export async function injectPartners(
  queryClient: QueryClient,
  key: QueryKey,
  stationBase: string,
  department?: string,
): Promise<void> {
  const ids = stationPartnerHospitalIds(stationBase);
  if (!ids.length) return;

  const injected = await getHospitalsByIds(
    ids,
    department ? { department } : {},
  );
  if (!injected.length) return;

  const cached = queryClient.getQueryData(key) as
    | InfiniteData<Paginated<Hospital>>
    | undefined;
  const page0 = cached?.pages?.[0];
  if (!cached || !page0) return;

  const injIds = new Set(injected.map((h) => h.id));
  const merged = [...injected, ...page0.items.filter((h) => !injIds.has(h.id))];
  queryClient.setQueryData(key, {
    ...cached,
    pages: [{ ...page0, items: merged }, ...cached.pages.slice(1)],
  });
}
