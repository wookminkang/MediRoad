#!/usr/bin/env bash
# 대시보드에서 건강칼럼 작성을 트리거하는 얇은 wrapper.
# 실제 작성/적재는 기존 daily-publish.sh(주제 인자 지원, launchd가 매일 23:30 실행하는 것과 동일 로직)를
# 그대로 재사용한다. daily-prompt.md가 status: "published"를 강제하므로
# ingest 시점에 별도 후처리 없이 바로 Supabase에 published로 반영된다.
#
# 락(scripts/.dashboard.lock)은 daily-publish.sh 자신이 소유한다(launchd 자동 실행과
# 이 wrapper 양쪽 진입점을 모두 커버하기 위함) — 이 wrapper는 별도로 락을 잡지 않는다.
#
# 사용: scripts/dashboard-trigger.sh "<키워드>"
set -euo pipefail
cd "$(dirname "$0")/.."

KEYWORD="${1:?사용법: dashboard-trigger.sh <키워드>}"
FOLDER_PATH="$(pwd)"
FOLDER_ID="folder3"
# shellcheck source=/Users/mwkang/Desktop/에이전트/lib/dashboard-common.sh
source /Users/mwkang/Desktop/에이전트/lib/dashboard-common.sh

db_write_status running
db_log "MediRoad 건강칼럼 트리거 — 키워드: ${KEYWORD}"

# daily-publish.sh는 npm run ingest가 부분 실패(예: 이미지 생성 실패로 0/1 적재)해도
# exit 0으로 끝나는 경우가 있다(자체 스크립트의 기존 동작). 그래서 exit code만으로는
# 실제 발행 성공 여부를 믿을 수 없고, _ingested/에 "새 파일이 실제로 생겼는지"로 판정한다.
# (mapfile/readarray는 bash 4+ 전용이라 macOS 기본 /bin/bash 3.2에서 동작하지 않으므로 쓰지 않는다)
BEFORE_INGESTED=()
while IFS= read -r line; do
  [ -n "$line" ] && BEFORE_INGESTED+=("$line")
done < <(ls content/columns/_ingested/*.md 2>/dev/null || true)

set +e
./scripts/daily-publish.sh "$KEYWORD"
RC=$?
set -e

if [ $RC -eq 75 ]; then
  ERR="이미 다른 원고 작업이 진행 중입니다 (자동 발행 스케줄 또는 다른 트리거와 겹침). 잠시 후 다시 시도하세요."
  db_write_status failed "null" "$ERR"
  db_append_history "$KEYWORD" failed
  db_log "건너뜀 — 락 충돌"
  exit 0
fi

AFTER_INGESTED=()
while IFS= read -r line; do
  [ -n "$line" ] && AFTER_INGESTED+=("$line")
done < <(ls content/columns/_ingested/*.md 2>/dev/null || true)
NEW_FILE=""
for f in "${AFTER_INGESTED[@]}"; do
  is_new=1
  for b in "${BEFORE_INGESTED[@]}"; do
    if [ "$f" = "$b" ]; then
      is_new=0
      break
    fi
  done
  if [ $is_new -eq 1 ]; then
    NEW_FILE="$f"
    break
  fi
done

if [ $RC -ne 0 ] || [ -z "$NEW_FILE" ]; then
  ERR="$(tail -8 "$LOG_FILE" 2>/dev/null || echo '(로그 없음)')"
  db_write_status failed "null" "$ERR"
  db_append_history "$KEYWORD" failed
  db_log "실패 또는 미적재 (exit $RC, _ingested/에 새 파일 없음 — OpenAI 크레딧 소진 등 ingest 실패 가능성)"
  exit 1
fi

TITLE="$(sed -n 's/^title: *"\(.*\)"$/\1/p' "$NEW_FILE" | head -1)"
if [ -z "$TITLE" ]; then
  TITLE="$KEYWORD"
fi

db_write_status success
db_append_history "$TITLE" success "{\"localOnly\": false}"
db_log "완료 — ${TITLE}"
