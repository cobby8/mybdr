# Scratchpad

## 현재 작업
- 2026-06-24 대회 운영자 워크스페이스 WS5 대진/순위전 운영 흐름 보강.

## 진행 현황표
| 작업 | 상태 | 비고 |
|---|---|---|
| 릴리스 정합 | 완료 | PR #754/#755 merge, `dev == main == fc72e9c` |
| 대회 운영자 WS4 | 완료 | 경기/기록 카드에 운영 흐름 4단계 추가, API/DB 변경 없음 |
| 대회 운영자 WS5 | 완료 | 대진/순위전 카드에 후반 운영 흐름 4단계 추가, API/DB 변경 없음 |
| 일관성 QA | 준비 중 | v2.40 기준 Claude.ai 전달 패키지 작성 |
| STAGE E/F/G | 정리 중 | QA → E → F → G 순서 문서화 |

## 작업 로그
- 2026-06-24 feat(admin): 대회 운영자 워크스페이스 대진/순위전 운영 흐름 4단계 보강.
- 2026-06-24 feat(admin): 대회 운영자 워크스페이스 경기/기록 운영 흐름 4단계 보강.
- 2026-06-23 docs: 일관성 QA v2.40 패키지와 STAGE E/F/G 실행 순서 문서화 진행.
- 2026-06-23 release: dev→main PR #755를 merge하고 dev/main 정합을 `fc72e9c`로 맞춤.
- 2026-06-23 release: dev→main PR #754를 merge하고 dev/main 정합을 `23081b8`로 맞춤.
- 2026-06-23 release-prep: `origin/main` 27커밋을 dev에 충돌 없이 병합하고 main/dev 분기 해소 상태를 기록.
- 2026-06-23 docs: 실제 phase-ledger 경로를 `.claude/phase-ledger.md`로 정정하고 v2.40 정착·main/dev 분기 상태를 기록.
- 2026-06-23 design(sync): v2.40 통합 Admin Console 원본을 `BDR-current/_handoff-admin-v2.40-unified/`에 흡수하고 큐 상태를 정정.
- 2026-06-23 housekeeping: 사용 완료된 `scripts/_temp/count-news-photo.mjs` 임시 실측 스크립트 정리.
- 2026-06-23 docs: 라이브 도메인 전담 에이전트 정의 `live-expert`를 `.codex/agents`에 추가.
