import { notFound, permanentRedirect } from "next/navigation";

import { findGuide, guideUrl } from "@/constants/hospital-keyword-pages";

type Params = Promise<{ hospital: string; keyword: string }>;

// 옛 키워드 랜딩 → 가이드 허브로 통합(301). 큐레이션에 없으면 404.
export const dynamicParams = true;

export default async function SearchToGuideRedirect({
  params,
}: {
  params: Params;
}) {
  const { hospital, keyword } = await params;
  const slug = decodeURIComponent(hospital);
  const guide = findGuide(slug, decodeURIComponent(keyword));
  if (!guide) notFound();
  permanentRedirect(guideUrl(slug, guide.keyword));
}
