import {
  allGuidePosts,
  postUrl,
} from "@/constants/hospital-keyword-pages";
import { SITE_URL } from "@/constants/site";
import { type SitemapUrl, urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

/*
 * 개별 포스팅(/[병원slug]/[postId]) 사이트맵.
 * 가이드에 묶인 큐레이션 포스팅만 — 짧은 URL이 정식. 같은 글의 긴 URL(/hospitals/.../posts/...)은
 * 301되고 posts.xml에서 제외된다.
 */
export const revalidate = 3600;

export function GET() {
  const urls: SitemapUrl[] = allGuidePosts().map((p) => ({
    url: `${SITE_URL}${postUrl(p.hospitalSlug, p.postId)}`,
    changefreq: "monthly",
    priority: 0.7,
  }));
  return xmlResponse(urlsetXml(urls));
}
