import { MOCK_COLUMNS } from "@/api/mock/columns";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Paginated } from "@/types";
import type { Column, ColumnFilters, ColumnReviewer } from "@/types/column";

/**
 * 건강 칼럼 데이터 접근. Supabase env가 설정되면 DB에서, 아니면 mock에서 읽는다.
 * 공개 목록/상세는 published만 노출(draft·hidden 제외). (SEO §1 · ARCHITECTURE §5)
 */

const DEFAULT_PAGE_SIZE = 12;

// --- Supabase row → Column 매핑 ---
type ColumnRow = {
  id: string;
  kind: Column["kind"] | null;
  title: string;
  category: Column["category"];
  excerpt: string;
  thumbnail: string | null;
  summary: string[] | null;
  body_md: string | null;
  tags: string[] | null;
  faqs: Column["faqs"] | null;
  refs: Column["references"] | null;
  related_departments: Column["relatedDepartments"] | null;
  author: string;
  reviewed_by: ColumnReviewer;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  og_image: string | null;
  noindex: boolean | null;
  status: Column["status"];
  reading_minutes: number;
  published_at: string | null;
  updated_at: string | null;
};

const isoDate = (v: string | null) => (v ? v.slice(0, 10) : "");

/** kind 컬럼 미존재(마이그레이션 0020 전) 에러 감지 → 필터 생략 폴백 */
function isMissingKindColumn(err: { code?: string; message?: string }): boolean {
  return (
    err?.code === "42703" || /column .*kind.* does not exist/i.test(err?.message ?? "")
  );
}

/** 분리된 SEO 컬럼 → Column.seo 객체로 복원(전부 비면 undefined) */
function rowToSeo(r: ColumnRow): Column["seo"] {
  const seo = {
    title: r.meta_title ?? undefined,
    description: r.meta_description ?? undefined,
    keywords: r.meta_keywords ?? undefined,
    ogImage: r.og_image ?? undefined,
    noindex: r.noindex || undefined,
  };
  return Object.values(seo).some((v) => v !== undefined) ? seo : undefined;
}

function rowToColumn(r: ColumnRow): Column {
  return {
    id: r.id,
    kind: r.kind ?? "column",
    title: r.title,
    category: r.category,
    excerpt: r.excerpt,
    thumbnail: r.thumbnail ?? undefined,
    summary: r.summary ?? [],
    body: r.body_md ?? "",
    tags: r.tags ?? undefined,
    faqs: r.faqs ?? undefined,
    references: r.refs ?? undefined,
    relatedDepartments: r.related_departments ?? undefined,
    author: r.author,
    reviewedBy: r.reviewed_by,
    seo: rowToSeo(r),
    status: r.status,
    publishedAt: isoDate(r.published_at),
    updatedAt: isoDate(r.updated_at),
    readingMinutes: r.reading_minutes,
  };
}

// --- Mock 폴백 ---
function mockMatchesQuery(c: Column, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    c.title.toLowerCase().includes(needle) ||
    c.excerpt.toLowerCase().includes(needle) ||
    c.category.toLowerCase().includes(needle) ||
    (c.tags ?? []).some((t) => t.toLowerCase().includes(needle))
  );
}

function mockGetColumns(filters: ColumnFilters): Paginated<Column> {
  const { q, category, kind = "column", page = 1, pageSize = DEFAULT_PAGE_SIZE } =
    filters;
  const results = MOCK_COLUMNS.filter((c) => c.status === "published")
    .filter((c) => (c.kind ?? "column") === kind)
    .filter((c) => (category ? c.category === category : true))
    .filter((c) => (q ? mockMatchesQuery(c, q) : true))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  const start = (page - 1) * pageSize;
  return {
    items: results.slice(start, start + pageSize),
    total: results.length,
    page,
    pageSize,
  };
}

export async function getColumns(
  filters: ColumnFilters = {},
): Promise<Paginated<Column>> {
  if (!isSupabaseConfigured) return mockGetColumns(filters);

  const { q, category, kind = "column", page = 1, pageSize = DEFAULT_PAGE_SIZE } =
    filters;
  const start = (page - 1) * pageSize;

  // kind 컬럼이 마이그레이션 전이면 필터 생략(배포-마이그레이션 공백 대비)
  const build = (withKind: boolean) => {
    let query = getSupabaseServer()
      .from("columns")
      .select("*", { count: "exact" })
      .eq("status", "published");
    if (withKind) query = query.eq("kind", kind);
    query = query
      .order("published_at", { ascending: false })
      .range(start, start + pageSize - 1);
    if (category) query = query.eq("category", category);
    if (q) {
      const safe = q.replace(/[,()%]/g, " ").trim();
      if (safe) query = query.or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`);
    }
    return query;
  };

  let { data, count, error } = await build(true);
  if (error && isMissingKindColumn(error)) {
    // 마이그레이션 전: 브리핑은 빈 목록, 칼럼은 kind 없이 전체
    if (kind === "briefing") return { items: [], total: 0, page, pageSize };
    ({ data, count, error } = await build(false));
  }
  if (error) throw error;

  return {
    items: (data as ColumnRow[]).map(rowToColumn),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** 상세 — published만 반환(그 외 null → 페이지에서 notFound) */
export async function getColumnById(id: string): Promise<Column | null> {
  if (!isSupabaseConfigured) {
    const c = MOCK_COLUMNS.find((x) => x.id === id);
    return c && c.status === "published" ? c : null;
  }

  const { data, error } = await getSupabaseServer()
    .from("columns")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return data ? rowToColumn(data as ColumnRow) : null;
}

/** generateStaticParams 용 — published 칼럼 ID (kind 기본 column) */
export async function getAllColumnIds(
  kind: Column["kind"] = "column",
): Promise<string[]> {
  if (!isSupabaseConfigured) {
    return MOCK_COLUMNS.filter(
      (c) => c.status === "published" && (c.kind ?? "column") === kind,
    ).map((c) => c.id);
  }

  const sb = getSupabaseServer();
  let { data, error } = await sb
    .from("columns")
    .select("id")
    .eq("status", "published")
    .eq("kind", kind);
  if (error && isMissingKindColumn(error)) {
    // 마이그레이션 전: kind 필터 없이(브리핑은 빈 목록처럼 동작)
    if (kind === "briefing") return [];
    ({ data, error } = await sb.from("columns").select("id").eq("status", "published"));
  }
  if (error) throw error;
  return (data as { id: string }[]).map((r) => r.id);
}
