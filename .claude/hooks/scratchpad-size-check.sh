#!/usr/bin/env bash
# Stop hook: .claude/scratchpad.md 비대화 감지.
# 120줄 초과 시 PM에게 scratchpad-keeper 정리를 유도(decision:block).
# jq 미설치 환경 대비 — 순수 sh/coreutils만 사용.

input=$(cat)

# 무한 루프 방지: Stop hook 재트리거(stop_hook_active=true) 시 통과
compact=$(printf '%s' "$input" | tr -d ' \n\t\r')
case "$compact" in
  *'"stop_hook_active":true'*) exit 0 ;;
esac

f="${CLAUDE_PROJECT_DIR:-.}/.claude/scratchpad.md"
[ -f "$f" ] || exit 0

n=$(wc -l < "$f" | tr -d ' ')
[ "$n" -gt 200 ] || exit 0

printf '{"decision":"block","reason":"⚠️ scratchpad.md가 %s줄입니다(임계 200). scratchpad-keeper 에이전트로 완료·커밋된 작업 상세를 압축하세요. 미커밋 작업은 보존."}' "$n"
exit 0
