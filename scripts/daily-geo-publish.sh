#!/usr/bin/env bash
# MediRoad GEO 브리핑 일일 자동 발행 — launchd가 매일 11:00 실행.
#   1) 큐(content/geo-briefings/queue.json)에서 미발행 항목 1건 + DB 병원 사실 추출
#   2) Claude Code 헤드리스로 원고 JSON 생성 (facts 밖 사실 사용 금지)
#   3) 검증 게이트 통과 시 즉시 published / 실패 시 draft 저장 + 로그
#   4) 썸네일 생성 (실패해도 발행 유지)
# 검수 없는 자동 발행이므로 안전선은 scripts/seed-geo-briefing.cjs가 담당한다.
set -euo pipefail
cd "$(dirname "$0")/.."

# launchd는 PATH가 최소 → nvm의 최신 node bin을 PATH에 추가 (node/npm/claude/tsx 인식용)
NVM_BIN_DIR="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1 || true)"
[ -n "${NVM_BIN_DIR:-}" ] && export PATH="${NVM_BIN_DIR}:${PATH}"

# 이 Mac에는 .env만 있는 환경도 있어서 .env.local → .env 순으로 쓴다
ENV_FILE=".env.local"
[ -f "$ENV_FILE" ] || ENV_FILE=".env"

DATE="$(date +%F)"
echo "[$(date '+%F %T')] GEO 브리핑 시작"

# 1) 다음 발행 대상 + 사실 데이터 (exit 3 = 큐 소진)
set +e
FACTS_JSON="$(node --env-file="$ENV_FILE" --import tsx scripts/geo-briefing-facts.mts --date "$DATE")"
rc=$?
set -e
if [ $rc -eq 3 ]; then
  echo "큐 소진 — queue.json에 키워드를 추가하기 전까지 발행 없음"
  exit 0
fi
[ $rc -ne 0 ] && { echo "facts 추출 실패(rc=$rc)"; exit $rc; }

ITEM_ID="$(printf '%s' "$FACTS_JSON" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).queueItem.id))")"
OUT_JSON="content/geo-briefings/out/${DATE}-${ITEM_ID}.json"
FACTS_FILE="content/geo-briefings/out/${DATE}-${ITEM_ID}.facts.json"
echo "대상: ${ITEM_ID}"

# 2) Claude Code 헤드리스 생성 (Write 도구만 허용)
PROMPT="$(cat scripts/geo-briefing-prompt.md)

## 사용할 값
- id: ${ITEM_ID}
- 발행일(publishedDate): ${DATE}
- 저장 파일 경로: ${OUT_JSON}

## 사실 데이터(facts) — 이 데이터 밖의 병원명·주소·수치는 한 글자도 쓸 수 없다
${FACTS_JSON}"

claude -p "${PROMPT}" --allowedTools "Write"

[ -f "$OUT_JSON" ] || { echo "원고 파일이 생성되지 않음: $OUT_JSON"; exit 1; }

# 3) 검증 게이트 + 발행 (실패 시 draft 저장 후 exit 1 → 아래 썸네일 건너뜀)
node --env-file="$ENV_FILE" scripts/seed-geo-briefing.cjs "$OUT_JSON" --facts "$FACTS_FILE"

# 4) 썸네일 — OpenAI 장애가 발행을 막으면 안 되므로 비치명
node --env-file="$ENV_FILE" --import tsx scripts/gen-geo-briefing-thumbnail.mts --article "$OUT_JSON" \
  || echo "썸네일 실패(비치명) — 발행은 유지, 나중에 수동 재실행 가능"

echo "[$(date '+%F %T')] 완료 — /briefing/${ITEM_ID}"
