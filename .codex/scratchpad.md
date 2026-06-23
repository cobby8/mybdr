# Scratchpad

## 현재 작업
- 2026-06-24 보안 감사 마무리: PostCSS override 적용으로 `npm audit` 0건 검증 완료.

## 진행 현황표
| 작업 | 상태 | 비고 |
|---|---|---|
| 엑셀 보안 개선 | 완료 | `xlsx` 제거, `read-excel-file`/`write-excel-file` 전환 |
| PostCSS 보안 개선 | 완료 | `overrides.postcss="$postcss"`로 Next 내부 취약 사본 제거 |
| 검증 | 완료 | `npm audit` 0건, `tsc`, `next build`, `git diff --check` 확인 |

## 작업 로그
- 2026-06-24 fix: PostCSS override로 Next 내부 취약 사본 제거, `npm audit` 0건 및 빌드 통과 확인.
- 2026-06-24 fix: 취약 `xlsx`를 제거하고 `.xlsx` 전용 파서/템플릿 생성기로 교체, high/critical audit 0건 확인.
- 2026-06-23 docs: 일관성 QA v2.40 패키지와 STAGE E/F/G 실행 순서 문서화 진행.
- 2026-06-23 release: dev→main PR #755를 merge하고 dev/main 정합을 `fc72e9c`로 맞춤.
- 2026-06-23 release: dev→main PR #754를 merge하고 dev/main 정합을 `23081b8`로 맞춤.
- 2026-06-23 release-prep: `origin/main` 27커밋을 dev에 충돌 없이 병합하고 main/dev 분기 해소 상태를 기록.
- 2026-06-23 docs: 실제 phase-ledger 경로를 `.claude/phase-ledger.md`로 정정하고 v2.40 정착·main/dev 분기 상태를 기록.
- 2026-06-23 design(sync): v2.40 통합 Admin Console 원본을 `BDR-current/_handoff-admin-v2.40-unified/`에 흡수하고 큐 상태를 정정.
- 2026-06-23 housekeeping: 사용 완료된 `scripts/_temp/count-news-photo.mjs` 임시 실측 스크립트 정리.
- 2026-06-23 docs: 라이브 도메인 전담 에이전트 정의 `live-expert`를 `.codex/agents`에 추가.
