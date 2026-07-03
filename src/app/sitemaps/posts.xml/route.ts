import { getSitemapPosts } from "@/api/hospital";
import { SITE_URL } from "@/constants/site";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

// 병원 포스트 상세(published) — 가장 알찬 콘텐츠 페이지
export const revalidate = 3600;

export async function GET() {
  const posts = await getSitemapPosts();
  const urls: SitemapUrl[] = posts.map((p) => ({
    url: `${SITE_URL}/hospitals/${p.slug}/posts/${p.postId}`,
    lastmod: p.updatedAt ?? undefined,
    changefreq: "monthly",
    priority: 0.7,
  }));
  return xmlResponse(urlsetXml(urls));
}
