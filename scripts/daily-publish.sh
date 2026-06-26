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
- 저장 파일 경로: ${FILE}${TOPIC_LINE}

## 이미 존재하는 주제 (절대 중복 금지)
${EXISTING}"

claude -p "${PROMPT}" --allowedTools "Write"

# 3) Supabase 적재 (draft)
npm run ingest

echo "[$(date '+%F %T')] 완료 — ${FILE} (status=published)"
