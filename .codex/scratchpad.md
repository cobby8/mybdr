# Scratchpad

- 2026-06-25 fix(tournament): 대회 포맷 표준을 6개(토너먼트/풀리그/듀얼토너먼트/조별리그+토너먼트/링크제/조별리그+동순위 순위결정전)로 정리하고 생성·관리·공개 라벨을 통일.
- 2026-06-25 feat(customer-signals): added help contact intake, customer signal email reports, and report/suggestion trigger hooks.
- 2026-06-25 feat(agents): added rule-based `record-app-impact` server API for `bdr_stat_v3` impact checks.
- 2026-06-25 docs(agents): set `bdr_stat_v3` as the record app source and documented server/agent integration protocol.
- 2026-06-25 docs(agents): added operating workflows for small fixes, UI, DB, `/api/v1`, release, and incident response.
- 2026-06-25 docs(agents): expanded BDR operations agents with release/ops/db/reviewer/content roles and record-app liaison workflow.
- 2026-06-25 feat(ranking): added API-keyless manual seed review report generator.
- 2026-06-24 feat(ranking): added candidate signal analysis fields for ranking research JSON.
- 2026-06-24 feat(ranking): added Daum BDR cafe seeds and Tavily web-search adapter candidate.
- 2026-06-24 feat(ranking): expanded ranking research collector to multi-source registry with official/manual source support.
- 2026-06-24 feat(ranking): added community basketball ranking research keyword seed and Naver search collection PoC.

## Current Task
- 2026-06-25 done: added customer inquiry/site error/correction request intake with automatic owner email reporting and existing report trigger hooks.
- 2026-06-25 done: fixed tournament admin info layout clipping and excessive stretched whitespace; browser-checked desktop/mobile.
- 2026-06-25 done: added division auto-draw API and admin button to assign approved teams into groups and seed order before bracket generation.
- 2026-06-25 done: aligned tournament creation and admin division data by saving division date/court assignments, and added approved-team division readiness summary.
- 2026-06-25 done: implemented Kakao-first tournament venue search, venue route links, public schedule directions, and match-day navigation reminders.
- 2026-06-25 done: merged tournament admin workspace work into dev, fixed tests, and verified `tsc`, full test, and build before production merge.
- 2026-06-25 done: aligned tournament admin setup with creation flow for sponsors, multi-venue/date/court data, global save, and mobile 2-row game preset chips.
- 2026-06-25 done: verified create flow preserves multi-venue/date/court division scheduling via `settings.div_schedule` and corrected generator copy.
- 2026-06-25 done: removed gender from tournament admin info card after confirming creation handles gender in division generator.
- 2026-06-25 done: removed tournament status field from admin info card and tightened workspace/game-settings vertical spacing.

## 진행 현황
| 작업 | 상태 | 비고 |
|---|---|---|
| 대회 관리자 워크스페이스 | 완료 | 단일 페이지, lazy panels, 생성 흐름 정합 |
| 지도/길안내 배선 | 완료 | 카카오 장소 검색, places JSON 보존, 공개 일정 링크, 경기장 알림 |
| dev 검증 및 푸시 | 완료 | `tsc`, `npm test`, `npm build` 통과 |
| 운영 머지 | 보류 | 최신 요청은 지도/길안내 구현, 푸시/머지 미요청 |

## 작업 로그
- 2026-06-25 feat(customer-signals): `/help/contact`와 `/api/web/customer-signals`를 추가하고 경기 신고·코트 제보·코트 수정 제안 생성 시 메일 보고를 예약.
- 2026-06-25 fix(referee): 심판/경기원 숙련도 표시를 KBA `3급/2급/1급` 및 `FIBA/국제` 등급 라벨로 통일.
- 2026-06-25 fix(referee): 경기원 현장 역할 세분화 라벨을 제거하고 배정/정산/단가 UI 표시를 `경기원` 단일로 통일.
- 2026-06-25 docs(referee): 운영 DB에 `scorer/timer` 구형 직군 데이터가 없음을 확인하고 스키마/API 주석을 `referee/game_official` 기준으로 정리.
- 2026-06-25 fix(referee): 배정·정산·단가·협회 마법사 라벨을 `경기원 - 기록/계시`로 통일.
- 2026-06-25 fix(referee): KBA/FIBA 기준에 맞춰 심판/경기원 직군을 `referee`/`game_official`로 통합하고 기록원·계시원 입력을 경기원으로 흡수.
- 2026-06-25 feat(admin): 참가팀 화면에서 종별별 승인팀 자동 조편성을 실행해 `groupName`과 `seedNumber`를 일괄 배정하는 API와 버튼 추가.
- 2026-06-25 feat(admin): 대회 생성의 종별 일정/체육관 배정값을 관리 저장 API와 연결하고 참가팀 화면에 종별별 승인팀/정원/대진 준비 현황을 추가.
- 2026-06-25 feat(tournament): 카카오 장소 검색과 경기장 길안내 링크/알림 흐름을 대회 생성·관리·공개 일정에 연결.
- 2026-06-25 release: dev를 main에 머지하기 위해 원격 dev/main 동기화, rebase, 테스트와 빌드 재검증.
- 2026-06-25 feat(admin): 대회 관리자 설정을 생성 흐름과 맞춰 다중 후원사, 체육관, 일정 저장과 모바일 2행 경기 프리셋을 반영.
- 2026-06-25 docs(tournament): 운영 src 더미 데이터 금지와 관리자 제어 배선 원칙을 추가하고 대회 영역 배선 점검.
- 2026-06-24 fix: PostCSS override로 Next 하위 취약 버전 제거, `npm audit` 0건 및 빌드 통과 확인.
- 2026-06-24 fix: 취약 `xlsx`를 제거하고 `.xlsx` 전용 파서와 스플릿 생성기로 교체, high/critical audit 0건 확인.

## Work Log Addendum
- 2026-06-25 fix(membership): unified membership grade and feature subscription checks across payment, profile, site navigation, team/tournament/court permissions, and admin user views.
