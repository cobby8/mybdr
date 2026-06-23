# Scratchpad

## 현재 작업
- 2026-06-23 대회 운영자 도구 워크스페이스 구조 개편 WS1 완료.

## 진행 현황표
| 작업 | 상태 | 비고 |
|---|---|---|
| WS1 운영 워크스페이스 | 완료 | `[id]/page.tsx` 구조 전환, API/DB 변경 없음 |

## 작업 로그
- 2026-06-23 design(sync): v2.40 통합 Admin Console 원본을 `BDR-current/_handoff-admin-v2.40-unified/`에 흡수하고 큐 상태를 정정.
- 2026-06-23 housekeeping: 사용 완료된 `scripts/_temp/count-news-photo.mjs` 임시 실측 스크립트 정리.
- 2026-06-23 docs: 라이브 도메인 전담 에이전트 정의 `live-expert`를 `.codex/agents`에 추가.
- 2026-06-23 docs: 프로젝트 작업 규칙 `AGENTS.md`를 repo 기준 문서로 추가.
- 2026-06-23 docs: 루트 대회상태/기록실 CLI·시안 문서와 시안 커버리지 전수조사 문서를 이력으로 정리.
- 2026-06-23 docs: `Dev/` 루트의 매칭/Toss/새대회 한글 지시서·검증 문서를 작업 이력으로 정리.
- 2026-06-23 design: 새 대회 생성폼 Toss P0 전달물 10개를 `BDR-current` handoff 산출물로 보존.
- 2026-06-23 design: 매칭 M2~M5 v2.34~v2.36 전달물 48개를 `_archive` 시안 아카이브로 묶어 정리.
- 2026-06-23 docs: `Dev/` 루트의 6/13~6/21 계획·감사·주간상태 문서 17개를 작업 이력으로 정리.
- 2026-06-23 WS1 후속: `TournamentWorkspace` 수정 상태를 확인했으나 현재 코드 diff 없음. 문서 정리와 분리 유지.
- 2026-06-23 docs: 루트 Admin-Console 기획/검증/프롬프트 문서와 S4 진단 문서를 한 묶음으로 정리.
- 2026-06-23 docs: 6/7~6/22 디자인 CLI 큐·next-actions·박제 프롬프트 43개를 `Dev/design/prompts/` 이력 문서로 묶어 정리.
- 2026-06-23 housekeeping: `Dev/design/BDR v2.33/_delivery-records-*`가 `_archive/BDR v2.33`에 동일 blob으로 보존됨을 확인하고 최상위 잔존 삭제 정리 진행.
- 2026-06-23 상태정정: 09:00 큐의 `.git/config`/미push 차단 이슈가 현재 해소됨을 확인하고 6/23 next-actions/CLI 큐를 실제 상태로 갱신.
- 2026-06-23 WS1: `/tournament-admin/tournaments/[id]`를 섹션 탭 기반 운영 워크스페이스로 개편하고 tsc 검증 통과.
- 2026-06-23 WS2: ready section summary rows added with existing page data; no API/DB changes.
- 2026-06-23 WS3: divisions-teams-bracket flow hints added with existing counts; no API/DB changes.
- 2026-06-23 WS4-WS6: matches, bracket, staff/completion workflow hints strengthened without new queries.
