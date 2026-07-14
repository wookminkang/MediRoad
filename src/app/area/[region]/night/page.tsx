import type { Metadata } from "next";

import { renderOpenLate } from "../open-late";

type Params = Promise<{ region: string }>;

/**
 * ○○구 야간진료 병원 목록.
 *
 * 정적 세그먼트 "night"라서 [department] 동적 라우트보다 먼저 매칭된다
 * (Next.js는 정적 > 동적). 그래서 /area/강남구/내과 와 충돌하지 않는다.
 */
export const dynamicParams = true;
export const revalidate = 86400;

export function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  return renderOpenLate.metadata(props.params, "night");
}

export default function Page(props: { params: Params }) {
  return renderOpenLate.page(props.params, "night");
}

export { generateStaticParams } from "../open-late";
