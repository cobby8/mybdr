# Scratchpad

- 2026-06-25 feat(ranking): added API-keyless manual seed review report generator.
- 2026-06-24 feat(ranking): added candidate signal analysis fields for ranking research JSON.
- 2026-06-24 feat(ranking): added Daum BDR cafe seeds and Tavily web-search adapter candidate.
- 2026-06-24 feat(ranking): expanded ranking research collector to multi-source registry with official/manual source support.
- 2026-06-24 feat(ranking): added community basketball ranking research keyword seed and Naver search collection PoC.

## Current Task
- 2026-06-25 done: merged tournament admin workspace work into dev, fixed tests, and verified `tsc`, full test, and build before production merge.
- 2026-06-25 done: aligned tournament admin setup with creation flow for sponsors, multi-venue/date/court data, global save, and mobile 2-row game preset chips.
- 2026-06-25 done: verified create flow preserves multi-venue/date/court division scheduling via `settings.div_schedule` and corrected generator copy.
- 2026-06-25 done: removed gender from tournament admin info card after confirming creation handles gender in division generator.
- 2026-06-25 done: removed tournament status field from admin info card and tightened workspace/game-settings vertical spacing.

## 진행 현황
| 작업 | 상태 | 비고 |
|---|---|---|
| 대회 관리자 워크스페이스 | 완료 | 단일 페이지, lazy panels, 생성 흐름 정합 |
| dev 검증 및 푸시 | 완료 | `tsc`, `npm test`, `npm build` 통과 |
| 운영 머지 | 진행 중 | `dev -> main` 충돌 정리 중 |

## 작업 로그
- 2026-06-25 release: dev를 main에 머지하기 위해 원격 dev/main 동기화, rebase, 테스트와 빌드 재검증.
- 2026-06-25 feat(admin): 대회 관리자 설정을 생성 흐름과 맞춰 다중 후원사, 체육관, 일정 저장과 모바일 2행 경기 프리셋을 반영.
- 2026-06-25 docs(tournament): 운영 src 더미 데이터 금지와 관리자 제어 배선 원칙을 추가하고 대회 영역 배선 점검.
- 2026-06-24 fix: PostCSS override로 Next 하위 취약 버전 제거, `npm audit` 0건 및 빌드 통과 확인.
- 2026-06-24 fix: 취약 `xlsx`를 제거하고 `.xlsx` 전용 파서와 스플릿 생성기로 교체, high/critical audit 0건 확인.
