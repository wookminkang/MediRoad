/**
 * 메디브리핑 샘플 글 1건 시드 — columns 테이블(kind='briefing').
 * 선행: 마이그레이션 0020(kind 컬럼) 적용 필요.
 * 실행: node --env-file=.env.local --import tsx scripts/seed-briefing-sample.mts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const body = `## 여름철, 온열질환은 누구에게나 생길 수 있습니다

기온과 습도가 함께 오르는 한여름에는 우리 몸이 스스로 체온을 조절하기 어려워집니다. 야외 작업자나 어르신뿐 아니라 건강한 사람도 무더위에 오래 노출되면 **열탈진·열사병** 같은 온열질환을 겪을 수 있습니다.

## 대표적인 온열질환과 신호

- **열탈진** — 무력감, 어지럼, 메스꺼움, 많은 땀. 시원한 곳에서 휴식하고 수분을 보충하면 대개 회복됩니다.
- **열사병** — 체온이 40℃ 가까이 오르고 **의식이 흐려지는** 응급 상황입니다. 즉시 119에 신고해야 합니다.
- **열경련 · 열실신** — 근육 경련이나 일시적 실신. 더운 환경에서 무리한 활동 뒤 나타납니다.

> 어지럼·두통·메스꺼움은 몸이 보내는 **초기 경고 신호**입니다. 무시하지 말고 즉시 활동을 멈추세요.

## 예방을 위한 생활 수칙

1. **가장 더운 12~17시**에는 야외활동·작업을 피합니다.
2. **갈증을 느끼기 전에** 물을 자주 마십니다(카페인·알코올 음료는 피하세요).
3. 헐렁하고 밝은 색의 통풍이 잘 되는 옷을 입습니다.
4. 외출 시 양산·모자로 직사광선을 가립니다.
5. 차 안 등 **밀폐된 공간에 잠깐이라도** 사람·아이를 두지 않습니다.

## 이럴 때는 응급 대처

의식이 흐려지거나 체온이 매우 높을 때:

1. **119에 신고**합니다.
2. 시원하고 그늘진 곳으로 옮깁니다.
3. 옷을 느슨하게 하고, 물수건·찬물로 몸을 식힙니다.
4. 의식이 없으면 **억지로 물을 먹이지 않습니다**(기도 막힘 위험).

무더위가 이어지는 시기에는 평소보다 몸 상태에 주의를 기울이고, 증상이 심하거나 회복되지 않으면 가까운 의료기관에서 진료를 받는 것이 안전합니다.`;

const row = {
  id: "briefing-summer-heat-illness",
  kind: "briefing",
  title: "폭염 속 온열질환, 이렇게 예방하세요 — 여름철 건강 수칙",
  category: "seasonal",
  excerpt:
    "기온이 치솟는 여름, 온열질환은 누구에게나 생길 수 있습니다. 열탈진·열사병의 신호와 예방 수칙, 응급 대처법을 한눈에 정리했습니다.",
  summary: [
    "가장 더운 12~17시 야외활동·작업은 피하세요",
    "갈증을 느끼기 전에 물을 자주 마시세요",
    "어지럼·메스꺼움·두통은 온열질환의 초기 신호입니다",
    "의식이 흐려지면 즉시 119에 신고하고 시원한 곳으로 옮기세요",
  ],
  body_md: body,
  tags: ["온열질환", "폭염", "여름건강", "열사병", "열탈진"],
  faqs: [
    {
      q: "온열질환은 어떤 사람에게 잘 생기나요?",
      a: "어르신, 만성질환자, 야외 작업자가 특히 취약하지만, 건강한 사람도 무더위에 오래 노출되면 누구나 겪을 수 있습니다.",
    },
    {
      q: "물을 어느 정도 마셔야 하나요?",
      a: "갈증을 느끼기 전부터 규칙적으로 마시는 것이 좋습니다. 다만 신장질환 등으로 수분 제한이 있는 경우 주치의 안내를 따르세요.",
    },
  ],
  refs: [
    {
      title: "질병관리청 — 온열질환 예방 행동수칙",
      url: "https://www.kdca.go.kr",
    },
  ],
  author: "메디로드 편집팀",
  reviewed_by: { name: "메디로드 의료편집팀", specialty: "건강정보 감수" },
  status: "published",
  reading_minutes: 4,
  published_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const { error } = await sb.from("columns").upsert(row, { onConflict: "id" });
if (error) {
  console.error("삽입 실패:", error.message);
  process.exit(1);
}
console.log("✅ 메디브리핑 샘플 1건 발행:", row.title);
