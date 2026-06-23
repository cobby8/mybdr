# Scratchpad

## 현재 작업
- 2026-06-23 일관성 QA v2.40 패키지 + STAGE E/F/G 실행 순서 정리.

## 진행 현황표
| 작업 | 상태 | 비고 |
|---|---|---|
| 릴리스 정합 | 완료 | PR #754/#755 merge, `dev == main == fc72e9c` |
| 일관성 QA | 준비 중 | v2.40 기준 Claude.ai 전달 패키지 작성 |
| STAGE E/F/G | 정리 중 | QA → E → F → G 순서 문서화 |

## 작업 로그
- 2026-06-23 docs: 일관성 QA v2.40 패키지와 STAGE E/F/G 실행 순서 문서화 진행.
- 2026-06-23 release: dev→main PR #755를 merge하고 dev/main 정합을 `fc72e9c`로 맞춤.
- 2026-06-23 release: dev→main PR #754를 merge하고 dev/main 정합을 `23081b8`로 맞춤.
- 2026-06-23 release-prep: `origin/main` 27커밋을 dev에 충돌 없이 병합하고 main/dev 분기 해소 상태를 기록.
- 2026-06-23 docs: 실제 phase-ledger 경로를 `.claude/phase-ledger.md`로 정정하고 v2.40 정착·main/dev 분기 상태를 기록.
- 2026-06-23 design(sync): v2.40 통합 Admin Console 원본을 `BDR-current/_handoff-admin-v2.40-unified/`에 흡수하고 큐 상태를 정정.
- 2026-06-23 housekeeping: 사용 완료된 `scripts/_temp/count-news-photo.mjs` 임시 실측 스크립트 정리.
- 2026-06-23 docs: 라이브 도메인 전담 에이전트 정의 `live-expert`를 `.codex/agents`에 추가.
- 2026-06-23 docs: 프로젝트 작업 규칙 `AGENTS.md`를 repo 기준 문서로 추가.
- 2026-06-23 docs: 루트 대회상태/기록실 CLI·시안 문서와 시안 커버리지 전수조사 문서를 이력으로 정리.
