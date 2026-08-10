/**
 * GEO 브리핑 검증 게이트 + 발행 — 사람 검토 없이 자동 발행되므로 여기가 안전핀이다.
 *
 * 입력: claude -p가 생성한 원고 JSON + geo-briefing-facts.mts가 저장한 facts JSON.
 *
 * ── 발행을 막는 것 ──
 * 1. 의료광고법(§56) 금지 표현 — "추천"은 지역 안내 원고에서 그 자체로 금지.
 * 2. 필수 필드 누락 / category !== 'region-guide'.
 * 3. 제목 규칙 위반(하이픈·40자 초과·"추천").
 * 4. 본문 링크가 실존 라우트가 아니거나(허브·병원상세·지역), 외부 링크가 본문에 섞임.
 * 5. facts에 없는 병원명·주소 (환각).
 * 6. 중심 병원이 원고 지역 밖인데 소재지 미표기 (소비자 오인).
 * 7. 필수 내부링크(병원 상세·허브·지역) 누락.
 * 8. 기존 브리핑과 제목 중복.
 *
 * 실패 시: status='draft'로 저장(사람이 Supabase에서 확인·수정) + 사유 출력 + exit 1.
 * 통과 시: status='published', published_at = 발행일 09:00 KST.
 *
 * 실행: node --env-file=.env scripts/seed-geo-briefing.cjs <원고.json> --facts <facts.json> [--dry]
 */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const ROOT = path.resolve(__dirname, "..");
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const articlePath = argv.find((a) => a.endsWith(".json") && !a.includes(".facts."));
const factsIdx = argv.indexOf("--facts");
const factsPath = factsIdx >= 0 ? argv[factsIdx + 1] : null;
if (!articlePath || !factsPath) {
  console.error("사용법: node --env-file=.env scripts/seed-geo-briefing.cjs <원고.json> --facts <facts.json> [--dry]");
  process.exit(1);
}

const article = JSON.parse(fs.readFileSync(articlePath, "utf8"));
const facts = JSON.parse(fs.readFileSync(factsPath, "utf8"));

// ── 1. 금지 표현 ──────────────────────────────────────────────
// seed-briefings-from-json.cjs + seed-partners-geo-from-json.cjs 목록의 합집합에
// 지역 안내 특화("추천"·비교 우위)를 얹었다. 새 우회 표현을 발견하면 여기에 추가한다.
const BANNED = [
  "완치", "재발 방지", "재발방지", "효과가 입증", "효과 보장", "확실히 좋아",
  "부작용 없", "부담이 적습니다", "호전되는 경우가 많", "최고의", "최상의",
  "유일한", "국내 1위", "명의", "1등", "후기", "평점", "100% ",
  "추천", "잘하는", "가장 잘", "TOP", "BEST", "순위", "제일 좋",
];
// 오탐 제거: "원장 명의의 글"(名義), 경고 맥락의 과장 표현 인용.
const BENIGN = [/명의의\s/g, /명의로\s/g, /(과장|거짓|허위)\s?광고/g];

const failures = [];

function scanText() {
  let text = [
    article.title, article.excerpt, ...(article.summary ?? []), article.body_md,
    ...(article.faqs ?? []).flatMap((x) => [x.q, x.a]),
    ...(article.tags ?? []),
    article.meta_description, article.thumbnailTitle,
  ].filter(Boolean).join(" ");
  for (const re of BENIGN) text = text.replace(re, " ");
  const bad = BANNED.filter((w) => text.includes(w));
  if (bad.length) failures.push(`의료광고 금지표현: ${bad.join(", ")}`);
}

// ── 2. 필수 필드 ─────────────────────────────────────────────
function checkRequired() {
  if (article.category !== "region-guide") failures.push(`카테고리가 region-guide가 아님: ${article.category}`);
  if (article.id !== facts.queueItem.id) failures.push(`id 불일치 — 원고 ${article.id} vs 큐 ${facts.queueItem.id}`);
  if (!article.title || !article.body_md || !article.excerpt) failures.push("title/excerpt/body_md 누락");
  if (!article.reviewed_by || !article.reviewed_by.name) failures.push("reviewed_by 누락 (columns NOT NULL)");
  if ((article.summary ?? []).length < 3) failures.push("summary 3개 미만");
  if ((article.faqs ?? []).length < 3) failures.push("FAQ 3개 미만");
  if (!(article.refs ?? []).length) failures.push("refs(공공 출처) 없음");
  if (!article.publishedDate) failures.push("publishedDate 없음");
  const bodyLen = (article.body_md ?? "").replace(/\s/g, "").length;
  if (bodyLen < 900) failures.push(`본문이 너무 짧음 (공백 제외 ${bodyLen}자)`);
}

// ── 3. 제목 규칙 ─────────────────────────────────────────────
function checkTitle() {
  const t = article.title ?? "";
  if (/[-–—]/.test(t)) failures.push(`제목에 하이픈: ${t}`);
  if (t.length > 40) failures.push(`제목 40자 초과 (${t.length}자)`);
  const tt = article.thumbnailTitle ?? "";
  if (/[-–—]/.test(tt)) failures.push(`썸네일 제목에 하이픈: ${tt}`);
  if (tt.replace(/\\n|\n/g, "").length > 14) failures.push(`썸네일 제목이 너무 김: ${tt}`);
}

// ── 4. 내부링크 실존 검증 ─────────────────────────────────────
function loadValidRoutes() {
  const guidesSrc = fs.readFileSync(path.join(ROOT, "src/constants/hospital-keyword-pages.ts"), "utf8");
  const hubs = new Set(
    [...guidesSrc.matchAll(/hospitalSlug:\s*"([^"]+)",\s*keyword:\s*"([^"]+)"/g)]
      .map((m) => `/${m[1]}/guide/${m[2].trim().replace(/\s+/g, "-")}`),
  );
  const areaSrc = fs.readFileSync(path.join(ROOT, "src/constants/area-regions.ts"), "utf8");
  const areas = new Set([...areaSrc.matchAll(/"slug":\s*"([^"]+)"/g)].map((m) => m[1]));
  return { hubs, areas };
}

async function checkLinks() {
  const { hubs, areas } = loadValidRoutes();
  const body = article.body_md ?? "";
  const links = [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => decodeURIComponent(m[1].trim()));

  for (const href of links) {
    if (/^https?:\/\//.test(href)) {
      failures.push(`본문에 외부 링크 금지 (refs에만): ${href}`);
      continue;
    }
    if (href.startsWith("/hospitals/")) {
      const slug = href.replace("/hospitals/", "").split("/")[0];
      const { data } = await sb.from("hospitals").select("id").eq("slug", slug).limit(1);
      if (!(data ?? []).length) failures.push(`실존하지 않는 병원 상세 링크: ${href}`);
    } else if (/^\/[^/]+\/guide\//.test(href)) {
      if (!hubs.has(href)) failures.push(`실존하지 않는 허브 링크: ${href}`);
    } else if (href.startsWith("/area/")) {
      if (!areas.has(href.replace("/area/", "").split("/")[0])) failures.push(`실존하지 않는 지역 링크: ${href}`);
    } else if (href.startsWith("/briefing") || href.startsWith("/health")) {
      // 허용 (콘텐츠 상호 링크)
    } else {
      failures.push(`허용 목록 밖 링크: ${href}`);
    }
  }

  // 필수 링크가 실제로 들어갔는지
  const q = facts.queueItem;
  const mustHave = [facts.mainHospital.detailUrl, ...q.hubLinks, ...(q.areaLink ? [q.areaLink] : [])];
  for (const need of mustHave) {
    if (!links.includes(need)) failures.push(`필수 내부링크 누락: ${need}`);
  }
}

// ── 5. 사실 대조: facts 밖 병원명·주소 = 환각 ──────────────────
const norm = (s) => (s ?? "").replace(/[\s()（）]/g, "");
function checkFacts() {
  const knownNames = [
    facts.mainHospital.name,
    facts.mainHospital.station_name,
    ...(facts.landmark ? [facts.landmark.name, facts.landmark.label] : []),
    ...facts.comparisonHospitals.flatMap((h) => [h.name, h.station_name]),
  ].filter(Boolean).map(norm);
  // 고유명사 없이 쓰이는 일반 명칭은 허용
  const GENERIC = ["요양병원", "한방병원", "대학병원", "종합병원", "상급종합병원", "한의원", "병원", "의원"];
  // 질의 원문 표기("건국대학병원", "삼성병원")는 FAQ에서 질문을 인용할 때 자연스럽다
  const queryNorm = norm(facts.queueItem.query);

  const text = [article.title, article.excerpt, ...(article.summary ?? []), article.body_md,
    ...(article.faqs ?? []).flatMap((x) => [x.q, x.a])].join(" ");
  const candidates = text.match(/[가-힣A-Za-z0-9()（）]{2,}(?:요양병원|한방병원|병원|의원)/g) ?? [];
  const matchesKnown = (c) =>
    GENERIC.includes(c) ||
    knownNames.some((k) => k.includes(c) || c.includes(k)) ||
    queryNorm.includes(c);
  for (const raw of new Set(candidates)) {
    // "1곳(리움한방병원"처럼 숫자·괄호가 붙어 추출될 수 있으니 괄호 단위로 쪼개서도 대조.
    // facts 병원명(또는 역 이름)의 일부이거나, 큐 질의 원문에 그대로 있는 표기는 통과.
    const variants = [norm(raw), ...raw.split(/[()（）]/).map(norm)].filter((v) => v.length >= 2);
    if (!variants.some(matchesKnown)) failures.push(`facts에 없는 병원명(환각 의심): ${raw}`);
  }

  // 주소 조각(도로명+번호)이 facts 주소 어딘가에 있어야 한다
  const addrKnown = [facts.mainHospital.address, ...facts.comparisonHospitals.map((h) => h.address),
    ...(facts.landmark ? [facts.landmark.address] : [])].map(norm);
  const addrCandidates = text.match(/[가-힣0-9]+(?:로|길)\s?\d+(?:-\d+)?/g) ?? [];
  for (const raw of new Set(addrCandidates)) {
    const c = norm(raw);
    if (!addrKnown.some((k) => k.includes(c))) failures.push(`facts에 없는 주소(환각 의심): ${raw}`);
  }

  const featureMode = facts.queueItem.featureMode ?? "section";
  if (featureMode === "section") {
    // 소재지 밖 중심 병원 → 소재지(구) 표기 필수
    if (facts.mainOutsideRegion && !text.includes(facts.mainHospital.sigungu)) {
      failures.push(`중심 병원이 ${facts.queueItem.region.sigungu} 밖(${facts.mainHospital.sigungu})인데 소재지 미표기`);
    }
  } else {
    // link-only: 중심 병원은 링크 앵커에만 허용 — 본문 서술에 나오면 중립성이 깨져
    // AI 검색 인용 확률을 깎는다(광고성 판정). 링크를 지운 프로즈에서 이름을 찾는다.
    const baseName = norm(facts.mainHospital.name.split(/[(（]/)[0]); // "리움한방병원"
    const prose = norm(
      [article.excerpt, ...(article.summary ?? []),
        (article.body_md ?? "").replace(/\[[^\]]*\]\([^)]*\)/g, " "),
        ...(article.faqs ?? []).flatMap((x) => [x.q, x.a])].join(" "),
    );
    if (prose.includes(baseName)) {
      failures.push(`featureMode=link-only인데 본문 서술에 중심 병원(${facts.mainHospital.name}) 언급 — 링크 앵커에만 허용`);
    }
  }
}

// ── 6. 제목 중복 ─────────────────────────────────────────────
async function checkDup() {
  const { data } = await sb.from("columns").select("id,title").eq("kind", "briefing").neq("id", article.id);
  for (const r of data ?? []) {
    if (r.title === article.title) failures.push(`기존 브리핑과 제목 동일: ${r.id}`);
  }
}

(async () => {
  scanText();
  checkRequired();
  checkTitle();
  await checkLinks();
  checkFacts();
  await checkDup();

  const passed = failures.length === 0;
  const row = {
    id: article.id,
    kind: "briefing",
    category: "region-guide",
    title: article.title,
    excerpt: article.excerpt,
    summary: article.summary ?? [],
    body_md: article.body_md,
    faqs: article.faqs ?? [],
    refs: article.refs ?? [],
    tags: article.tags ?? [],
    related_departments: article.related_departments ?? [],
    author: article.author ?? "메디로드 편집팀",
    reviewed_by: article.reviewed_by,
    meta_description: article.meta_description ?? null,
    meta_keywords: article.tags ?? [],
    noindex: false,
    status: passed ? "published" : "draft",
    reading_minutes: article.reading_minutes ?? 4,
    published_at: `${article.publishedDate}T00:00:00+00:00`,
  };

  if (!DRY) {
    const { error } = await sb.from("columns").upsert(row, { onConflict: "id" });
    if (error) {
      if (String(error.message).includes("column_categories")) {
        console.error("카테고리 FK 오류 — supabase/migrations/0026_briefing_region_guide_category.sql을 먼저 적용하세요.");
      }
      throw error;
    }
  }

  if (passed) {
    console.log(`${DRY ? "[dry] " : ""}✅ 발행 — /briefing/${article.id} (${article.title})`);
  } else {
    console.error(`${DRY ? "[dry] " : ""}❌ 검증 실패 — draft로 저장. 사유:`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
})();
