/**
 * 병원 공식 안내형 포스트 — 리움한방병원(종로점).
 * HOSPITAL_POST_GUIDE.md(v2) 사실 기반 골격: 무엇→어디→무슨 진료→이용안내→FAQ.
 * 실행: node --env-file=.env.local --import tsx scripts/seed-rium-jongno-visit-guide.mts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const { data: h, error: hErr } = await sb
  .from("hospitals")
  .select("id, name, slug")
  .eq("slug", "리움한방병원")
  .maybeSingle();
if (hErr) throw hErr;
if (!h) throw new Error("리움한방병원(종로)을 찾을 수 없습니다.");

const SLUG = h.slug; // 리움한방병원
const body = `## 어떤 병원인가요?

리움한방병원(종로점)은 서울 종로구 대학로에 위치한 **한방병원**입니다. 한의학에 기반한 진료를 보며, 침·뜸·부항·약침·추나요법·한약 처방 등이 한방병원의 대표적인 진료 방식입니다. 진료받고자 하는 증상의 진료 가능 여부는 방문 전 전화로 확인하시는 것을 권장합니다.

## 어디에 있나요?

- **주소**: 서울특별시 종로구 대학로 89, 대학로빌딩 지하1, 지상2~6층 (연건동)
- **가까운 역**: 4호선 **혜화역**에서 도보 약 5분
- 자세한 위치와 지도는 [오시는 길](/hospitals/${SLUG}#location)에서 확인할 수 있습니다.

## 진료시간은 어떻게 되나요?

- **평일(월~금)**: 09:00 ~ 18:00
- **토요일**: 09:00 ~ 13:00 (오전 진료)
- **일요일**: 휴진

> 진료시간·점심시간·휴진 여부는 변경될 수 있으니, 방문 전 [진료시간](/hospitals/${SLUG}#hours)을 함께 확인해 주세요.

## 예약·접수는 어떻게 하나요?

예약 및 당일 접수 가능 여부, 접수 마감 시간은 진료 일정에 따라 달라질 수 있습니다. 방문 전 전화(02-6213-1010)로 확인하시면 대기 시간을 줄일 수 있습니다.

## 자주 묻는 질문

### 토요일에도 진료하나요?

토요일은 오전(09:00~13:00) 진료합니다. 일요일은 휴진입니다.

### 일요일·공휴일에 진료하나요?

일요일은 휴진입니다. 공휴일 진료 여부는 방문 전 전화로 확인하시는 것이 좋습니다.

### 예약 없이 방문할 수 있나요?

당일 접수 가능 여부는 진료 상황에 따라 달라질 수 있어, 방문 전 전화로 확인하시길 권장합니다.

### 진료시간은 어디에서 확인하나요?

최신 진료시간은 [리움한방병원 상세 페이지](/hospitals/${SLUG}#hours)에서 확인할 수 있습니다.

## 병원 정보 다시 확인하기

- [리움한방병원 상세 정보](/hospitals/${SLUG})
- [진료시간 확인](/hospitals/${SLUG}#hours)
- [오시는 길 확인](/hospitals/${SLUG}#location)
- 전화 문의: 02-6213-1010

---

**작성**: 리움한방병원 · **안내**: 진료시간 및 운영 정보는 변경될 수 있습니다. 방문 전 최신 정보를 확인해 주세요.
`;

const post = {
  id: "rium-jongno-visit-guide",
  hospital_id: h.id,
  title: "리움한방병원(종로·대학로) 진료시간·찾아오는 길·이용 안내",
  excerpt:
    "종로구 대학로 한방병원 리움한방병원의 위치, 진료시간, 혜화역에서 찾아오는 길과 이용 정보를 안내합니다.",
  thumbnail: null,
  summary: [
    "서울 종로구 대학로에 위치한 한방병원으로, 4호선 혜화역에서 도보 약 5분 거리입니다.",
    "평일은 09:00~18:00, 토요일은 09:00~13:00 오전 진료하며 일요일은 휴진입니다.",
    "예약·당일접수·접수마감은 방문 전 전화(02-6213-1010)로 확인하시는 것을 권장합니다.",
  ],
  body_md: body,
  tags: ["방문안내", "종로구 한방병원", "리움한방병원", "혜화역 한방병원"],
  faqs: [
    {
      q: "토요일에도 진료하나요?",
      a: "토요일은 오전(09:00~13:00) 진료합니다. 일요일은 휴진입니다.",
    },
    {
      q: "일요일·공휴일에 진료하나요?",
      a: "일요일은 휴진입니다. 공휴일 진료 여부는 방문 전 전화로 확인하시는 것이 좋습니다.",
    },
    {
      q: "예약 없이 방문할 수 있나요?",
      a: "당일 접수 가능 여부는 진료 상황에 따라 달라질 수 있어, 방문 전 전화로 확인하시길 권장합니다.",
    },
  ],
  refs: [],
  conditions: [],
  related_departments: [],
  author: { name: h.name, role: "한방병원" },
  reviewed_by: null,
  status: "published",
  reading_minutes: 3,
  published_at: new Date().toISOString(),
};

const { error } = await sb
  .from("hospital_posts")
  .upsert(post, { onConflict: "id" });
if (error) throw error;
console.log(`발행 완료 → ${h.name}(종로) 포스트 "${post.id}"`);
console.log(`확인: /hospitals/${SLUG}/posts/${post.id}`);
