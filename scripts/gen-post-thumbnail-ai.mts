/**
 * 병원 포스트 썸네일 — 배경을 OpenAI로 생성한다.
 *
 * 병원 실사진이 5장뿐인데 포스트가 20편이 넘으면 같은 사진이 계속 돈다.
 * 그래서 배경만 글 주제에 맞춰 생성하고, 합성(스크림·병원명·제목·장식)은
 * 사진 버전과 똑같은 걸 쓴다(lib/post-thumb.mts). 사이트 톤이 갈라지면 안 된다.
 *
 * ── 이미지에도 의료광고법(§56)이 걸린다 ──
 * 이미지가 치료 효과를 암시하면 글이 아무리 조심해도 소용없다. 그래서 프롬프트에서
 * 아예 막는다:
 *   - 사람 금지        — 환자나 의료진처럼 보이면 그 자체로 오인 소지가 있다
 *   - 치료 장면 금지   — 시술·주사·기기 사용 장면은 효과 암시로 읽힌다
 *   - 전후 비교 금지
 *   - 글자 금지        — 한글이 깨져 나오고, 배경 글자는 우리 제목과 겹친다
 * 대신 정물·공간·빛 같은 정적인 이미지를 쓴다. 잡지 표지처럼.
 *
 * 중앙은 비워야 한다 — 병원명과 제목이 한가운데 얹히기 때문이다.
 *
 * 실행:
 *   node --env-file=.env.local --import tsx scripts/gen-post-thumbnail-ai.mts <postId...>
 *   node --env-file=.env.local --import tsx scripts/gen-post-thumbnail-ai.mts --hospital C1110185
 *   ... --force  (이미 썸네일 있어도 새로 만든다)
 */
import { createClient } from "@supabase/supabase-js";

import { BUCKET, compose, seedOf } from "./lib/post-thumb.mjs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

/** 모든 프롬프트에 붙는 안전선 + 구도 지시 */
const GUARD = [
  "Editorial magazine cover photography, calm and quiet.",
  "ABSOLUTELY NO people, no faces, no hands, no bodies.",
  "No medical procedures, no injections, no needles, no treatment scenes, no medical devices in use.",
  "No text, no letters, no numbers, no logos, no watermarks anywhere in the image.",
  "Composition: the center of the frame is empty and simple (a caption will be placed there).",
  "Subject sits toward the edges. Soft natural light, shallow depth of field, muted calm palette.",
  "Photorealistic, high quality, no illustration, no 3D render.",
].join(" ");

/**
 * 글 주제 → 배경 소재.
 * 제목 키워드로 고른다. 못 고르면 기본값(잔잔한 진료 공간).
 * 암 이야기라고 어둡게 갈 필요는 없다 — 차분하고 단정한 쪽이 낫다.
 */
const VISUALS: { match: RegExp; scene: string }[] = [
  {
    match: /식단|영양|식사|음식|비타민|수분|단백질|저잔사|채소|설탕/,
    scene:
      "A still life of simple wholesome food on a pale linen table by a window: a bowl of clear soup, steamed vegetables, a glass of water, a small plate of fruit. Warm morning light from the side.",
  },
  {
    match: /재활|운동|근력|걷기|스트레칭|물리치료|도수/,
    scene:
      "An empty, sunlit rehabilitation studio: a wooden floor, a neatly rolled exercise mat, a low wooden bench, a large window with sheer curtains. Nobody present. Quiet morning atmosphere.",
  },
  {
    match: /온열|고주파|장비|치료기/,
    scene:
      "A calm, tidy clinic room with soft indirect lighting: a neatly made treatment bed with folded white linen, a wooden side table, a small green plant. Nobody present. No devices switched on.",
  },
  {
    match: /수술|항암|방사선|치료 중|컨디션|부작용|메스꺼|구토/,
    scene:
      "A quiet hospital window scene: a clean windowsill with a small potted plant and a folded blanket on a chair, soft daylight, a blurred garden outside. Nobody present. Peaceful and reassuring.",
  },
  {
    match: /림프|부종|피부|상처|감염|위생|생활습관/,
    scene:
      "A serene still life of self-care essentials on a pale stone surface: folded clean cotton towels, a bar of unscented soap, a glass of water, soft daylight from a window.",
  },
  {
    match: /수면|불면|스트레스|마음|우울|불안/,
    scene:
      "A tranquil bedroom corner at dawn: a neatly made bed with white linen, a bedside table with a small lamp and a book, sheer curtains glowing with soft light. Nobody present.",
  },
  {
    match: /한약|침|뜸|약침|추나|한방/,
    scene:
      "A quiet Korean-medicine dispensary still life: dried herbs in small ceramic bowls, a wooden tray, a linen cloth, on a dark wood table. Warm low light. No people, no needles.",
  },
  {
    match: /상담|방문|안내|준비|검사|기록/,
    scene:
      "A calm consultation desk by a window: a closed notebook, a pen, a pair of reading glasses, a glass of water on a light wood table. Nobody present. Soft daylight.",
  },
];

const DEFAULT_SCENE =
  "A calm, empty clinic waiting area: light wood bench, a large window with soft daylight, a green plant in a corner. Nobody present. Quiet and clean.";

function sceneFor(title: string): string {
  return VISUALS.find((v) => v.match.test(title))?.scene ?? DEFAULT_SCENE;
}

async function genImage(prompt: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
      prompt,
      size: "1024x1024", // 썸네일이 정사각(1080)이라 정사각으로 뽑는다
      quality: "high",
      output_format: "png",
      n: 1,
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const json = await res.json();
  const it = json.data?.[0];
  if (it?.b64_json) return Buffer.from(it.b64_json, "base64");
  return Buffer.from(await (await fetch(it.url)).arrayBuffer());
}

async function genOne(postId: string, force: boolean) {
  const { data: post } = await sb
    .from("hospital_posts")
    .select("id,title,thumbnail,hospital_id,hospital:hospitals(name,sigungu)")
    .eq("id", postId)
    .single();
  if (!post) {
    console.log(`  ✗ ${postId}: 포스트 없음`);
    return;
  }
  if (post.thumbnail && !force) {
    console.log(`  ⏭️  ${postId}: 이미 썸네일 있음 (--force로 덮어쓰기)`);
    return;
  }
  const hosp = Array.isArray(post.hospital) ? post.hospital[0] : post.hospital;
  const region = (hosp?.sigungu ?? "").replace(/[구시군]$/, "");
  const nameText = region ? `${hosp?.name} (${region})` : (hosp?.name ?? "");

  const bg = await genImage(`${sceneFor(post.title)} ${GUARD}`);
  // 색·구도를 서로 다른 해시로(같은 seed면 상관되므로 salt로 분리)
  const webp = await compose(
    bg,
    nameText,
    post.title,
    seedOf(post.id + "#accent"),
    seedOf(post.id + "#layout"),
  );

  const key = `post-thumbs/${post.id}.webp`;
  const up = await sb.storage
    .from(BUCKET)
    .upload(key, webp, { contentType: "image/webp", upsert: true });
  if (up.error) throw up.error;
  const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  const { error } = await sb
    .from("hospital_posts")
    .update({ thumbnail: url })
    .eq("id", post.id);
  if (error) throw error;
  console.log(`  ✅ ${post.id} — ${post.title.slice(0, 34)}`);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const hIdx = args.indexOf("--hospital");
// --hospital이 없으면 hIdx가 -1이라, args[hIdx+1]은 args[0] — 첫 번째 postId다.
// 그걸 "옵션 값"으로 착각해 걸러내면 첫 글이 조용히 빠진다. 실제로 그랬다.
const optValue = hIdx >= 0 ? args[hIdx + 1] : undefined;
const ids = args.filter((a) => !a.startsWith("--") && a !== optValue);

let targets: string[] = ids;
if (hIdx >= 0) {
  const hid = args[hIdx + 1];
  const { data } = await sb
    .from("hospital_posts")
    .select("id,thumbnail")
    .eq("hospital_id", hid)
    .eq("status", "published");
  targets = (data ?? []).filter((p) => force || !p.thumbnail).map((p) => p.id);
}
if (!targets.length) {
  console.error("대상 없음. postId를 넘기거나 --hospital <id>를 쓰세요.");
  process.exit(1);
}

console.log(`대상 ${targets.length}개`);
for (const id of targets) await genOne(id, force);
console.log("완료");
