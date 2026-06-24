# Scratchpad

- 2026-06-25 feat(ranking): added API-keyless manual seed review report generator.
- 2026-06-24 feat(ranking): added candidate signal analysis fields for ranking research JSON.
- 2026-06-24 feat(ranking): added Daum BDR cafe seeds and Tavily web-search adapter candidate.
- 2026-06-24 feat(ranking): expanded ranking research collector to multi-source registry with official/manual source support.
- 2026-06-24 feat(ranking): added community basketball ranking research keyword seed and Naver search collection PoC.

## Current Task
- 2026-06-25 done: aligned tournament admin setup with creation flow for sponsors, multi-venue/date/court data, global save, and mobile 2-row game preset chips; tsc passed.
- 2026-06-25 done: verified create flow preserves multi-venue/date/court division scheduling via settings.div_schedule and corrected generator copy; tsc passed.
- 2026-06-25 done: removed gender input from tournament admin info card after confirming creation handles gender in division generator; tsc passed.
- 2026-06-25 done: removed tournament status field from admin info card and tightened workspace/game-settings vertical spacing; tsc passed.
- 2026-06-25 done: compacted tournament admin workspace layout, merged info/schedule card, redistributed right rail, compressed game rules grid; tsc passed.
- 2026-06-24 done: second UX pass on tournament admin workspace; verified section navigation, compacted panel loading states, and confirmed warm panel APIs around 200-330ms.
- 2026-06-24 done: refined tournament admin workspace UX after first review; compressed header, moved save action to card header, grouped setup fields, and clarified right rail as operation status.
- 2026-06-24 done: tightened tournament admin workspace UI into a two-column layout matching the tournament creation flow; build passed.
- 2026-06-24 done: rebuilt existing tournament admin operation as a single workspace at `/tournament-admin/tournaments/[id]`; build passed; full test still has 4 unrelated failures.

## 현재 작업
- 2026-06-24 대회 운영자 상세 전체를 대회 생성 화면 톤의 2열/카드/칩 UI로 정리 완료.
- 2026-06-24 대회 운영자 종별·디비전 생성 기준/운영 룰 동기화 수정 완료.
- 2026-06-24 bdr_stat_v3 경기 규칙/프리셋/앱 응답 정합 반영 완료.
- 2026-06-24 대회 운영자 모바일 관리 UX 보강 완료.
- 2026-06-24 대회 운영자 참가팀 패널 UI/모바일 명단 표시 정리 완료.
- 2026-06-25 대회 운영자 경기 운영 패널 UI/모바일 경기 카드 정리 완료.

## 진행 현황표
| 작업 | 상태 | 비고 |
|---|---|---|
| 릴리스 정합 | 완료 | PR #754/#755 merge, `dev == main == fc72e9c` |
| 대회 운영자 WS4 | 완료 | 경기/기록 카드에 운영 흐름 4단계 추가, API/DB 변경 없음 |
| 대회 운영자 WS5 | 완료 | 대진/순위전 카드에 후반 운영 흐름 4단계 추가, API/DB 변경 없음 |
| 대회 운영자 WS6 | 완료 | 운영 인력/종료 카드에 마감 흐름 4단계 추가, API/DB 변경 없음 |
| 대회 운영자 메뉴 IA | 완료 | 별도 도구 메뉴 제거, `/tournament-admin` → 목록 redirect, 대회 관리 단일 진입 |
| 대회 운영자 모바일 UX | 완료 | sticky 섹션 네비, 하단 저장바, 터치 타깃, 문맥 드로어 보강 |
| 기록앱 경기 설정 정합 | 완료 | bdr_stat_v3 규칙 키/8종 프리셋/앱 full-data 응답 반영 |
| 종별·디비전 정합 | 완료 | 생성 기준 admin_categories와 운영 룰 동기화, 상세 패널 선택/저장 UI 보강 |
| 운영자 상세 UI 통일 | 완료 | 생성 화면 `ct/ts` 토큰 기반 2열·카드·칩 흐름 적용 |
| 일관성 QA | 준비 중 | v2.40 기준 Claude.ai 전달 패키지 작성 |
| STAGE E/F/G | 정리 중 | QA → E → F → G 순서 문서화 |

## 작업 로그
- 2026-06-25 feat(admin): 대회 관리자 설정을 생성 흐름과 맞춰 다중 후원사·체육관·일정 저장과 모바일 2행 경기 프리셋을 반영.
- 2026-06-25 docs(tournament): 운영 src 더미 데이터 금지·관리자 제어 배선 원칙을 추가하고 대회 영역 배선 점검.
- 2026-06-25 style(admin): 경기 운영 패널과 기록 방식 카드를 생성 화면 톤으로 정리.
- 2026-06-24 style(admin): 대회 운영자 상세 전체를 생성 화면 톤의 2열/카드/칩 UI로 정리.
- 2026-06-24 style(admin): 참가팀 패널 카드/모달/모바일 명단을 생성 화면 톤으로 정리.
- 2026-06-24 feat(tournament): 생성 종별 기준과 운영자 division_rules 동기화 경로를 추가하고 종별 패널을 간소화.
- 2026-06-24 feat(tournament): bdr_stat_v3 경기 규칙 정본과 8종 프리셋을 생성/운영자/API 응답에 연결.
- 2026-06-24 feat(admin): 대회 운영자 워크스페이스 모바일 관리 UX와 터치 동선을 보강.
- 2026-06-24 refactor(admin): 대회 운영자 도구 메뉴를 제거하고 대회 관리 목록으로 진입점 단순화.
- 2026-06-24 feat(admin): 대회 운영자 워크스페이스 운영 인력/종료 흐름 4단계 보강.
- 2026-06-24 feat(admin): 대회 운영자 워크스페이스 대진/순위전 운영 흐름 4단계 보강.
