import { isCuratedPostId } from "@/constants/hospital-keyword-pages";
import { publishedCutoff } from "@/lib/post-schedule";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  HospitalPost,
  HospitalPostAuthor,
  HospitalPostReviewer,
} from "@/types/hospital-post";

/**
 * 병원별 의료 콘텐츠(포스트) 접근. published만 공개(draft·hidden 제외).
 * 쓰기는 service_role(시드/운영자)만. (docs/HOSPITAL_CONTENT_SEO.md)
 */

type PostRow = {
  id: string;
  hospital_id: string;
  title: string;
  excerpt: string;
  thumbnail: string | null;
  summary: string[] | null;
  body_md: string | null;
  tags: string[] | null;
  faqs: HospitalPost["faqs"] | null;
  refs: HospitalPost["references"] | null;
  conditions: string[] | null;
  related_departments: HospitalPost["relatedDepartments"] | null;
  author: HospitalPostAuthor;
  reviewed_by: HospitalPostReviewer | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  og_image: string | null;
  noindex: boolean | null;
  status: HospitalPost["status"];
  reading_minutes: number;
  published_at: string | null;
  updated_at: string | null;
};

const isoDate = (v: string | null) => (v ? v.slice(0, 10) : "");

function rowToSeo(r: PostRow): HospitalPost["seo"] {
  const seo = {
    title: r.meta_title ?? undefined,
    description: r.meta_description ?? undefined,
    keywords: r.meta_keywords ?? undefined,
    ogImage: r.og_image ?? undefined,
    noindex: r.noindex || undefined,
  };
  return Object.values(seo).some((v) => v !== undefined) ? seo : undefined;
}

function rowToPost(r: PostRow): HospitalPost {
  return {
    id: r.id,
    hospitalId: r.hospital_id,
    title: r.title,
    excerpt: r.excerpt,
    thumbnail: r.thumbnail ?? undefined,
    summary: r.summary ?? [],
    body: r.body_md ?? "",
    tags: r.tags ?? undefined,
    faqs: r.faqs ?? undefined,
    references: r.refs ?? undefined,
    conditions: r.conditions ?? undefined,
    relatedDepartments: r.related_departments ?? undefined,
    author: r.author,
    reviewedBy: r.reviewed_by ?? undefined,
    seo: rowToSeo(r),
    status: r.status,
    publishedAt: isoDate(r.published_at),
    updatedAt: isoDate(r.updated_at),
    readingMinutes: r.reading_minutes,
  };
}

/** 한 병원의 게시 포스트 목록(최신순) */
export async function getHospitalPosts(hospitalId: string): Promise<HospitalPost[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabaseServer()
    .from("hospital_posts")
    .select("*")
    .eq("hospital_id", hospitalId)
    .eq("status", "published")
    .lte("published_at", publishedCutoff())
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data as PostRow[]).map(rowToPost);
}

/** 포스트 단건(게시중만). 없으면 null */
export async function getHospitalPost(postId: string): Promise<HospitalPost | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await getSupabaseServer()
    .from("hospital_posts")
    .select("*")
    .eq("id", postId)
    .eq("status", "published")
    .lte("published_at", publishedCutoff())
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPost(data as PostRow) : null;
}

/** generateStaticParams 용 — (hospital_id, post id) 목록은 빌드 시 비움(ISR on-demand) */
export async function getAllHospitalPostIds(): Promise<string[]> {
  return [];
}

/** 전체 병원 최신 게시 포스트 (홈 노출용) */
export type LatestHospitalPost = {
  id: string;
  title: string;
  excerpt: string;
  thumbnail?: string;
  publishedAt: string;
  hospitalSlug: string;
  hospitalName: string;
};

export async function getLatestHospitalPosts(
  limit = 6,
): Promise<LatestHospitalPost[]> {
  if (!isSupabaseConfigured) return [];
  // 여러 병원이 골고루 노출되도록 넉넉히 가져와 병원당 최신 1개만 남긴다.
  const { data, error } = await getSupabaseServer()
    .from("hospital_posts")
    .select("id,title,excerpt,thumbnail,published_at,hospital_id,hospital:hospitals(slug,name)")
    .eq("status", "published")
    .lte("published_at", publishedCutoff())
    .order("published_at", { ascending: false })
    .limit(Math.max(60, limit * 8));
  if (error) return [];
  type Row = {
    id: string;
    title: string;
    excerpt: string;
    thumbnail: string | null;
    published_at: string | null;
    hospital_id: string;
    hospital: { slug: string; name: string } | { slug: string; name: string }[] | null;
  };
  const out: LatestHospitalPost[] = [];
  const seenHospitals = new Set<string>();
  for (const r of (data ?? []) as Row[]) {
    const h = Array.isArray(r.hospital) ? r.hospital[0] : r.hospital;
    if (!h) continue;
    if (isCuratedPostId(r.id)) continue; // 키워드 허브 전용 글은 홈 피드에서 제외
    if (seenHospitals.has(r.hospital_id)) continue; // 병원당 1개
    seenHospitals.add(r.hospital_id);
    out.push({
      id: r.id,
      title: r.title,
      excerpt: r.excerpt,
      thumbnail: r.thumbnail ?? undefined,
      publishedAt: r.published_at ? r.published_at.slice(0, 10) : "",
      hospitalSlug: h.slug,
      hospitalName: h.name,
    });
    if (out.length >= limit) break;
  }
  return out;
}
