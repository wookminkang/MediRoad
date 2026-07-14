import type { Metadata } from "next";

import { renderOpenLate } from "../open-late";

type Params = Promise<{ region: string }>;

/** ○○구 일요일 진료 병원 목록. 정적 세그먼트 "sunday". */
export const dynamicParams = true;
export const revalidate = 86400;

export function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  return renderOpenLate.metadata(props.params, "sunday");
}

export default function Page(props: { params: Params }) {
  return renderOpenLate.page(props.params, "sunday");
}

export { generateStaticParams } from "../open-late";
