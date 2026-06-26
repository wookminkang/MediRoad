import { redirect } from "next/navigation";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function toStr(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/**
 * 통합 검색 진입 — 스코프(병원/건강 칼럼)에 따라 해당 검색 페이지로 리다이렉트.
 * 홈 검색바가 native GET으로 제출 → 서버에서 분기(무JS 동작).
 */
export default async function SearchRedirect({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = toStr(sp.q).trim();
  const scope = toStr(sp.scope);

  const base = scope === "건강 칼럼" ? "/health" : "/hospitals";
  redirect(q ? `${base}?q=${encodeURIComponent(q)}` : base);
}
