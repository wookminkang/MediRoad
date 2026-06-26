import type { Hospital } from "@/types/hospital";
import type { HospitalPost } from "@/types/hospital-post";

/**
 * 병원 포스트 메타태그(title/description/keywords) 자동 보강.
 * 글 내용만으로는 지역 검색 노출이 약하므로 지역(시군구)·병원유형·진료과목·시설명을 결합.
 * post.seo.* 오버라이드가 있으면 그 값을 우선한다.
 */
export function buildPostMeta(h: Hospital, post: HospitalPost) {
  const sido = h.region.sido; // 서울
  const sigungu = h.region.sigungu; // 강동구
  const type = h.type; // 한방병원
  const name = h.name; // 리움한방병원
  // 진료과목 — DB가 비어 있으면 글 감수 전문과목으로 폴백
  const depts =
    h.departments && h.departments.length > 0
      ? (h.departments as string[])
      : post.reviewedBy?.specialty
        ? [post.reviewedBy.specialty]
        : [];
  const conds = post.conditions ?? [];

  // ── 제목: "{글제목} | {시군구} {병원유형} {병원명}"
  const title =
    post.seo?.title ?? `${post.title} | ${sigungu} ${type} ${name}`;

  // ── 설명: 지역·유형·시설 + 진료과목 + 본문 요약
  const deptStr = depts.length
    ? ` 진료과목: ${depts.slice(0, 4).join(", ")}.`
    : "";
  const rawDesc =
    post.seo?.description ??
    `${sido} ${sigungu} ${type} ${name}이(가) 전하는 건강정보.${deptStr} ${post.excerpt}`;
  const description =
    rawDesc.length > 158 ? `${rawDesc.slice(0, 157)}…` : rawDesc;

  // ── 키워드: 지역 결합형 (지역+질환, 지역+진료과목, 지역+유형, 시설명)
  const kw = new Set<string>();
  kw.add(name);
  kw.add(`${sigungu} ${name}`);
  kw.add(`${sigungu} ${type}`);
  kw.add(`${sido} ${sigungu} ${type}`);
  for (const c of conds) {
    kw.add(c);
    kw.add(`${sigungu} ${c}`);
    kw.add(`${sigungu} ${c} ${type}`);
  }
  for (const d of depts.slice(0, 5)) {
    kw.add(d);
    kw.add(`${sigungu} ${d}`);
  }
  for (const t of post.tags ?? []) kw.add(t);

  const keywords = post.seo?.keywords ?? [...kw];

  return { title, description, keywords };
}
