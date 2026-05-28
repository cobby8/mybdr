# 작업 스크래치패드

## 현재 작업
- **요청**: Auto Chain Master — 4단계 chain (v2.22 sync + Phase 2C/3C/4C = 25 PR)
- **상태**: 🔵 2단계 Phase 2C 진행 **3/10** (2C-1·2·3 ✅) / 다음 재개점 = **PR-2C-4 UA5 Live**
- **현재 담당**: pm
- **의뢰서**: `Dev/design/prompts/auto-chain-master-cli-prompt-2026-05-29.md`

## 🔑 Auto Chain 정책 (사용자 결재 2026-05-29)
- **데이터 통합 허용**: server 조회 + 새 web API route(`/api/web/*`) ✅. **금지(stop)**: `/api/v1`·DB schema(migrate/db push)·LOC>+2000·tsc실패·회귀6위반·디자인13룰위반. mock 금지(hide)
- **결재 default 자동**: sync A / 2C 결제 B(disabled) / 3C 모달 A / 4C Q1~Q4 lock
- **공유 컴포넌트(재사용)**: `src/components/bdr-v2/live-chip-row.tsx` (LiveChipRow) / `src/lib/services/live-chips.ts` (getLiveChips) — 홈·games 재사용 중, UA5도 재사용 가능

## Chain 진행 현황 (25 PR)
| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | v2.22 sync (Phase 3 팀 + 4 단체) | ✅ `dee2445` |
| 2 | Phase 2C 경기 (10 PR) | 🔵 **3/10** (2C-1·2·3 ✅) |
| 3 | Phase 3C 팀 (6 PR) | ⏸ |
| 4 | Phase 4C 단체 (8 PR) | ⏸ |

## 🔜 다음 재개점 — PR-2C-4 부터 (새 세션 시 여기부터)
| PR | 시안 | 운영 경로 | 핵심 |
|----|------|----------|------|
| **2C-4** | UA5 Live | `src/app/live/[id]/page.tsx` (**2662줄 거대**+16 _v2) | 대회/일반 분기 라벨 + 다음 경기 영역 / LiveChipRow 재사용 가능 / 거대 파일 주의 |
| 2C-5 | UA3 CreateGame | `/games/new` | 자동승인 토글(BG5) + 게스트 옵션(BG3) |
| 2C-6 | UA4 GuestApply | `/games/[id]/guest-apply` (page+form) | user.skill_level→experience prefill (BG3) / page.tsx는 host만 조회중 → 본인 user 조회 추가 |
| 2C-7 | UA2 GameDetail | `/games/[id]` (703줄+5 _v2) | 신청 step indicator sidebar (BG1) |
| 2C-8 | UB1 GameResult | `/games/[id]` status='completed' 분기 | MVP hero + 4카드 (신규 variant, 라우트 X) |
| 2C-9 | UD1 AdminGames | `/admin/games` (admin-games-content) | BG1 알림 모달 + BG5 출처 컬럼 |
| 2C-10 | UD2 AdminGameReports | `/admin` (신규 라우트?) | BG2 매너 통계 3탭 (game_player_ratings) |

→ 이후 3단계 Phase 3C (6 PR: TU3/TU1/TU5/TU2/TU4/TA) / 4단계 Phase 4C (8 PR: OU1~4/OA1/OO1/OO3/OO2). 의뢰서 §6·§7 참조.

## 구현 기록 (developer) — Phase 2C
- **2C-1 UC2 Home** (`13feb36`): LiveChipRow 공유 컴포넌트 신규 + page.tsx 진행중 tournamentMatch 조회. Hero·본문·AppNav 무변경. 0건 hide
- **2C-2 UA1 Games** (`70118ea`): LIVE 띠 재사용 + 종료 MVP 라인(BG4) + game.ts final_mvp select / getLiveChips 공유 추출(홈 동작 보존)
- **2C-3 UC1 MyActivity** (`b796834`): 내 경기 상태정렬 + 내 매너 카드(평균+flag종류만, 개별건수 0) + route type=manner 분기

## 진행 현황 (Phase 1C — 완료)
- ✅ Phase 1C 15/16 박제+머지 (PR #650~#653) / PA3 SKIP 보류 (decisions.md) / subin=dev=main 정합

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-29 | Phase 2C PR-2C-1·2·3 박제 (UC2/UA1/UC1) | ✅ `13feb36`/`70118ea`/`b796834` push / LiveChipRow·getLiveChips 공유 / 각 tsc0 회귀0 / 데이터 통합(server 조회+route 확장) |
| 2026-05-29 | Auto Chain 1단계 v2.22 sync (`dee2445`) | ✅ Phase 3 팀 + 4 단체 동시 / screens 33→46 / team·org-shared 신규 / 회귀16 통과 / pre-snapshot |
| 2026-05-29 | Auto Chain Master 사전 점검 | ✅ git/env/zip/v2.20 6/6 / 데이터 정책=통합 허용(직전 결재 우선) |
| 2026-05-29 | PR-1C-10 PA3 갭 분석 + Phase 1C 종료 | ✅ 결론 B(SKIP) DB실측 / Phase 1C 15/16 종료 |
| 2026-05-28 | Phase 1C 대형 3 박제+머지 (PA2/Teams/Bracket) | ✅ #652→#653 / 운영 배포 |
| 2026-05-28 | subin→dev→main 머지 (#650+#651) | ✅ 12 PR + v2.20 sync |
| 2026-05-28 | Phase 1C batch (PR-1C-5~13, PA3 SKIP) | ✅ 8 PR |
| 2026-05-28 | PR-1C-13 PA7 Completed (32f4d2b) | ✅ 종료 hub |
| 2026-05-28 | PR-1C-12 PA6 Divisions (05d961d) | ✅ 종별 hero |
| 2026-05-28 | PR-1C-11 PA9 Prospectus (4f5d4cc) | ✅ 진행도 bar |
