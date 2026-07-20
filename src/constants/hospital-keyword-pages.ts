/**
 * 병원별 "가이드(Topic Hub)" 큐레이션.
 *
 * 구조: 가이드 1개 = 키워드 1개. 각 가이드는 그 검색의도에 맞는 포스팅 5~7개를 묶는 대표 랜딩이다.
 *  - 가이드 허브 URL: /[병원slug]/guide/[키워드slug]   (예: /리움한방병원-강동송파/guide/강동구-재활통증치료)
 *  - 개별 포스팅 URL: /[병원slug]/[postId]              (예: /리움한방병원-강동송파/rium-gangdong-rehab-pain)
 *  - 허브 ↔ 포스팅 양방향 내부링크.
 *
 * 정책: **사람이 고른 키워드/포스팅만** 페이지가 된다(목록에 없으면 404 — doorway 금지).
 * 키워드는 실제 진료·위치 기반, 의료광고법 위반 소지(경쟁 병원명·효과 단정) 없이 고른다.
 */
export type HospitalGuide = {
  /** 대상 병원 slug (URL 첫 세그먼트) */
  hospitalSlug: string;
  /** 허브 대표 키워드 (지역+증상/유형) — URL slug·검색 타깃 */
  keyword: string;
  /** 허브 H1(검색의도형, 브랜드 없음). 없으면 keyword 사용 */
  title?: string;
  /** 허브 소개문(선택). 없으면 병원 데이터 자동 생성 */
  intro?: string;
  /** 이 가이드에 묶이는 포스팅 id들(hospital_posts.id) 5~7개 */
  postIds: string[];
};

export const HOSPITAL_GUIDES: HospitalGuide[] = [
  // ── 샘플 가이드: 강동구 재활통증치료 (포스팅 5편) ──
  {
    hospitalSlug: "리움한방병원-강동송파",
    keyword: "강동구 재활통증치료",
    title: "강동구 재활통증치료 어디서 받을까",
    postIds: [
      "rium-gangdong-rehab-pain",
      "rium-gangdong-traffic-injury",
      "rium-gangdong-chuna",
      "rium-gangdong-disc",
      "rium-gangdong-yakchim",
    ],
  },
  // ── 강동 암재활 가이드 (기존 암 관련 2편) ──
  {
    hospitalSlug: "리움한방병원-강동송파",
    keyword: "강동 암재활",
    title: "강동 암재활, 무엇을 어떻게 관리할까",
    postIds: ["rium-gangdong-cancer-rehab-guide", "rium-gangdong-breast-cancer-rehab"],
  },
  // ── 강동구 요양병원 가이드 (한방 입원·요양·회복 5편) ──
  {
    hospitalSlug: "리움한방병원-강동송파",
    keyword: "강동구 요양병원",
    title: "강동구 요양병원, 어떻게 골라야 할까",
    postIds: [
      "rium-gangdong-yoyang-guide",
      "rium-gangdong-yoyang-cancer",
      "rium-gangdong-yoyang-admission",
      "rium-gangdong-yoyang-recovery",
      "rium-gangdong-yoyang-hanbang",
    ],
  },
  // ── 둔촌동 요양병원 가이드 (다른 각도 5편: 위치·생활·영양·보호자·퇴원) ──
  {
    hospitalSlug: "리움한방병원-강동송파",
    keyword: "둔촌동 요양병원",
    title: "둔촌동 요양병원, 무엇을 살펴볼까",
    postIds: [
      "rium-dunchon-yoyang-location",
      "rium-dunchon-yoyang-daily",
      "rium-dunchon-yoyang-nutrition",
      "rium-dunchon-yoyang-family",
      "rium-dunchon-yoyang-discharge",
    ],
  },
  // ── 아산병원 근처 요양병원 가이드 (전원·연계 각도 5편) ──
  {
    hospitalSlug: "리움한방병원-강동송파",
    keyword: "아산병원 근처 요양병원",
    title: "아산병원 근처 요양병원, 치료 후 요양 어디서 이어갈까",
    postIds: [
      "rium-asan-yoyang-guide",
      "rium-asan-yoyang-transfer",
      "rium-asan-yoyang-cancer",
      "rium-asan-yoyang-access",
      "rium-asan-yoyang-coop",
    ],
  },
];

/** 키워드 → URL slug(공백→하이픈). 예: "강동구 재활통증치료" → "강동구-재활통증치료" */
export function guideSlug(keyword: string): string {
  return keyword.trim().replace(/\s+/g, "-");
}

/** 허브 표시 제목(없으면 키워드). */
export function guideTitle(g: HospitalGuide): string {
  return g.title ?? g.keyword;
}

/** 이 병원의 가이드들. */
export function guidesForHospital(hospitalSlug: string): HospitalGuide[] {
  return HOSPITAL_GUIDES.filter((g) => g.hospitalSlug === hospitalSlug);
}

/** (병원slug, slug 또는 원본 키워드)로 가이드 찾기 — 없으면 undefined(→404). */
export function findGuide(
  hospitalSlug: string,
  slugOrKeyword: string,
): HospitalGuide | undefined {
  const s = slugOrKeyword.trim();
  const asKeyword = s.replace(/-/g, " ");
  return HOSPITAL_GUIDES.find(
    (g) =>
      g.hospitalSlug === hospitalSlug &&
      (guideSlug(g.keyword) === s || g.keyword === s || g.keyword === asKeyword),
  );
}

/** 이 포스팅이 속한 가이드(백링크용). */
export function findGuideForPost(
  hospitalSlug: string,
  postId: string,
): HospitalGuide | undefined {
  return HOSPITAL_GUIDES.find(
    (g) => g.hospitalSlug === hospitalSlug && g.postIds.includes(postId),
  );
}

/** (병원slug, postId)가 큐레이션된 포스팅인가(포스팅 라우트 whitelist·긴 URL 301 판정). */
export function isGuidePost(hospitalSlug: string, postId: string): boolean {
  return HOSPITAL_GUIDES.some(
    (g) => g.hospitalSlug === hospitalSlug && g.postIds.includes(postId),
  );
}

/** postId가 어느 병원이든 큐레이션 포스팅인가(getSitemapPosts 제외 판정). */
export function isCuratedPostId(postId: string): boolean {
  return HOSPITAL_GUIDES.some((g) => g.postIds.includes(postId));
}

/**
 * 포스팅이 속한 가이드 내 순번(0-based) — 없으면 -1.
 * 썸네일 액센트·배경사진을 가이드 순서대로 배정해, 한 캐러셀 안에서 서로 겹치지 않게 한다.
 */
export function curatedPostIndex(postId: string): number {
  for (const g of HOSPITAL_GUIDES) {
    const i = g.postIds.indexOf(postId);
    if (i >= 0) return i;
  }
  return -1;
}

/** 가이드 허브 URL — /[병원slug]/guide/[키워드slug]. */
export function guideUrl(hospitalSlug: string, keyword: string): string {
  return `/${encodeURIComponent(hospitalSlug)}/guide/${encodeURIComponent(guideSlug(keyword))}`;
}

/** 개별 포스팅 URL — /[병원slug]/[postId]. */
export function postUrl(hospitalSlug: string, postId: string): string {
  return `/${encodeURIComponent(hospitalSlug)}/${encodeURIComponent(postId)}`;
}

/** 모든 (병원slug, postId) — 사이트맵·301 공용(중복 제거). */
export function allGuidePosts(): { hospitalSlug: string; postId: string }[] {
  const seen = new Set<string>();
  const out: { hospitalSlug: string; postId: string }[] = [];
  for (const g of HOSPITAL_GUIDES) {
    for (const postId of g.postIds) {
      const key = `${g.hospitalSlug}|${postId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ hospitalSlug: g.hospitalSlug, postId });
    }
  }
  return out;
}
