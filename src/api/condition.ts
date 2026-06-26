import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  Condition,
  ConditionFaq,
  ConditionGroup,
} from "@/types/condition";

/** 증상·질환 데이터 접근. published만 공개. 쓰기는 service_role. */

type ConditionRow = {
  id: string;
  name: string;
  body_part: string;
  departments: string[] | null;
  symptoms: string[] | null;
  excerpt: string;
  summary: string[] | null;
  body_md: string | null;
  faqs: ConditionFaq[] | null;
  thumbnail: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  og_image: string | null;
  noindex: boolean | null;
  status: Condition["status"];
  sort_order: number;
  updated_at: string | null;
};

function rowToCondition(r: ConditionRow): Condition {
  const seo = {
    title: r.meta_title ?? undefined,
    description: r.meta_description ?? undefined,
    keywords: r.meta_keywords ?? undefined,
    ogImage: r.og_image ?? undefined,
    noindex: r.noindex || undefined,
  };
  return {
    id: r.id,
    name: r.name,
    bodyPart: r.body_part,
    departments: (r.departments ?? []) as Condition["departments"],
    symptoms: r.symptoms ?? [],
    excerpt: r.excerpt,
    summary: r.summary ?? [],
    body: r.body_md ?? "",
    faqs: r.faqs ?? undefined,
    thumbnail: r.thumbnail ?? undefined,
    seo: Object.values(seo).some((v) => v !== undefined) ? seo : undefined,
    status: r.status,
    sortOrder: r.sort_order,
    updatedAt: r.updated_at ? r.updated_at.slice(0, 10) : "",
  };
}

/** 전체 게시 질환 (정렬: sort_order). 테이블 미생성 등 오류 시 빈 배열. */
export async function getConditions(): Promise<Condition[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabaseServer()
    .from("conditions")
    .select("*")
    .eq("status", "published")
    .order("sort_order");
  if (error) return [];
  return (data as ConditionRow[]).map(rowToCondition);
}

/** 부위별 그룹 (허브용) */
export async function getConditionsGrouped(): Promise<ConditionGroup[]> {
  const list = await getConditions();
  const map = new Map<string, Condition[]>();
  for (const c of list) {
    const arr = map.get(c.bodyPart);
    if (arr) arr.push(c);
    else map.set(c.bodyPart, [c]);
  }
  return [...map.entries()].map(([bodyPart, conditions]) => ({ bodyPart, conditions }));
}

/** 질환 단건 (게시중만) */
export async function getConditionBySlug(slug: string): Promise<Condition | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await getSupabaseServer()
    .from("conditions")
    .select("*")
    .eq("id", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) return null;
  return data ? rowToCondition(data as ConditionRow) : null;
}

export async function getAllConditionIds(): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabaseServer()
    .from("conditions")
    .select("id")
    .eq("status", "published");
  if (error) return [];
  return (data as { id: string }[]).map((r) => r.id);
}

/** 질환 관련 콘텐츠 자동 집계 — 이 질환을 다룬 병원 포스트 + 그 병원들 */
export type ConditionRelatedPost = {
  id: string;
  title: string;
  excerpt: string;
  thumbnail?: string;
  hospitalSlug: string;
  hospitalName: string;
};
export type ConditionRelatedHospital = { slug: string; name: string };

export async function getConditionRelated(name: string): Promise<{
  posts: ConditionRelatedPost[];
  hospitals: ConditionRelatedHospital[];
}> {
  if (!isSupabaseConfigured) return { posts: [], hospitals: [] };
  const { data, error } = await getSupabaseServer()
    .from("hospital_posts")
    .select("id,title,excerpt,thumbnail,hospital:hospitals(slug,name)")
    .eq("status", "published")
    .contains("conditions", JSON.stringify([name])) // jsonb @> '["name"]'
    .order("published_at", { ascending: false })
    .limit(12);
  if (error) return { posts: [], hospitals: [] };

  type Row = {
    id: string;
    title: string;
    excerpt: string;
    thumbnail: string | null;
    hospital: { slug: string; name: string } | { slug: string; name: string }[] | null;
  };
  const posts: ConditionRelatedPost[] = [];
  const seen = new Set<string>();
  const hospitals: ConditionRelatedHospital[] = [];
  for (const r of (data ?? []) as Row[]) {
    const h = Array.isArray(r.hospital) ? r.hospital[0] : r.hospital;
    if (!h) continue;
    posts.push({
      id: r.id,
      title: r.title,
      excerpt: r.excerpt,
      thumbnail: r.thumbnail ?? undefined,
      hospitalSlug: h.slug,
      hospitalName: h.name,
    });
    if (!seen.has(h.slug)) {
      seen.add(h.slug);
      hospitals.push({ slug: h.slug, name: h.name });
    }
  }
  return { posts, hospitals };
}
