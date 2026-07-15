#!/usr/bin/env bash
# 입원·응급 sync를 끝날 때까지 자동 재시작한다.
# 백그라운드 프로세스가 일정 시간마다 죽는 환경이라, 죽으면 커서에서 이어 재실행한다.
# 두 번 연속 커서가 안 움직이면(더 처리할 게 없으면) 종료한다.
set -u
cd "$(dirname "$0")/.."

CURSOR_FILE="scripts/.inpatient-cursor"
prev=""
same=0

for i in $(seq 1 40); do
  echo "── 라운드 $i 시작 ($(date '+%H:%M:%S')) ──"
  node --env-file=.env.local --import tsx scripts/sync-inpatient-er.mts 2>&1 | tail -2
  cur=$(cat "$CURSOR_FILE" 2>/dev/null)
  echo "  라운드 $i 종료, 커서: $cur"
  if [ "$cur" = "$prev" ]; then
    same=$((same+1))
    [ "$same" -ge 2 ] && { echo "커서 정지 — 전체 완료로 판단, 종료"; break; }
  else
    same=0
  fi
  prev="$cur"
  sleep 2
done
echo "루프 종료"
