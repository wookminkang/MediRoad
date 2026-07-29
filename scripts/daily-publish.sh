#!/usr/bin/env bash
# MediRoad 일일 건강 칼럼 자동 생성(draft) — launchd가 매일 23:30 실행.
#   1) DB 기존 주제 조회(중복 방지)  2) Claude Code 헤드리스로 새 칼럼 MD 생성  3) Supabase 적재(draft)
# 생성물은 status=draft → 사람이 검토 후 Supabase에서 published로 전환.
set -euo pipefail
cd "$(dirname "$0")/.."

# launchd는 PATH가 최소 → nvm의 최신 node bin을 PATH에 추가 (node/npm/claude/tsx 인식용)
NVM_BIN_DIR="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1 || true)"
[ -n "${NVM_BIN_DIR:-}" ] && export PATH="${NVM_BIN_DIR}:${PATH}"

DATE="$(date +%F)"
ID="$(openssl rand -hex 4)"   # 8자리 짧은 id (pipefail-safe)
FILE="content/columns/${DATE}-${ID}.md"

echo "[$(date '+%F %T')] 시작 — id=${ID}"

# 1) 기존 주제(제목+카테고리) — 중복 방지용
EXISTING="$(node --env-file=.env.local --import tsx scripts/list-topics.mts || echo '(조회 실패 — 빈 목록으로 진행)')"

# 2) Claude Code 헤드리스 생성 (Write 도구만 허용)
# 선택적 주제 지정: ./scripts/daily-publish.sh "기미 주근깨"
TOPIC="${1:-}"
TOPIC_LINE=""
[ -n "$TOPIC" ] && TOPIC_LINE="

## 지정 주제 (이 주제로 작성)
${TOPIC}"

PROMPT="$(cat scripts/daily-prompt.md)

## 사용할 값
- 프론트매터 id: ${ID}
- 프론트매터 publishedAt: ${DATE}
- 저장 파일 경로: ${FILE}${TOPIC_LINE}

## 이미 존재하는 주제 (절대 중복 금지)
${EXISTING}"

claude -p "${PROMPT}" --allowedTools "Write"

# 2-1) publishedAt 보정 — 없으면 실행일(DATE)로 주입.
# ingest는 publishedAt이 없으면 "적재 실행일"을 쓴다. 적재가 실패해 다음날 재시도되면
# 발행일이 하루 밀리므로, 모델이 빠뜨렸을 때를 대비해 여기서 확정한다.
if [ -f "$FILE" ] && ! grep -q '^publishedAt:' "$FILE"; then
  awk -v d="$DATE" 'NR==1 && $0=="---" { print; print "publishedAt: \"" d "\""; next } { print }' \
    "$FILE" > "${FILE}.tmp" && mv "${FILE}.tmp" "$FILE"
  echo "publishedAt 주입 — ${DATE}"
fi

# 3) Supabase 적재 (draft)
npm run ingest

echo "[$(date '+%F %T')] 완료 — ${FILE} (status=published)"
