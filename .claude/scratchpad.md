# 작업 스크래치패드

## 현재 작업
- **요청**: 대진표 후속 큐 1~3 + 5 완료 + push 완료 / G5.7 double_elim 만 보류
- **상태**: ✅ 종료 — push origin/subin (`b8b3117`)
- **현재 담당**: pm

## 진행 현황표 (대진표 후속 큐)
| # | PR | 상태 | LOC | commit |
|---|----|------|------|--------|
| 1 | PR-G5.5-followup-B 매치 PATCH 통합 | ✅ | +63 | `df96522` |
| 2 | PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator | ✅ | +900 | `b1e48b8` |
| 3 | PR-G5.2 dual-generator placeholder-helpers 통과 | ✅ | +302 | `eaccd54` |
| 4 | PR-G5.7 double_elim | 🔵 보류 | - | 운영 사용 0 / 운영 진입 시점 박제 |
| 5 | PR-G5.8 swiss (옵션 B / R1 + R(N) 501 stub) | ✅ | +977 | `b8b3117` |

## 미푸시 commit
- **0건** (subin = origin/subin / `b8b3117` push 완료 / knowledge 갱신 commit 별도 진행)

## working tree (다른 트랙 보존)
- `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` (M / score-sheet 트랙)
- `src/app/(score-sheet)/score-sheet/[matchId]/_hooks/use-score-sheet-input-state.ts` (?? / score-sheet 트랙)
- `bdr 디자인 시스템 관리/admin-design-2026-05-15/` (?? / 디자인 트랙)
- 본 대진표 트랙과 무관

## 후속 큐
- **PR-G5.7 double_elim**: 운영 진입 시점에 박제 (planner 의견 — Q1=(b) / +820 LOC / W bracket = NBA-seed 재사용)
- **generateSwissNextRound 풀구현**: PR-G5.8 후속 PR (현재 501 stub) — 운영 진입 시점
- **CLI 핸드오프 2차** ⭐ — admin 시각 확장
- **AppNav utility 좌측 메뉴** / **AppNav SSR admin 메뉴 정합**
- **dev 브랜치 sync**: origin/dev = origin/main 보다 84+ commit stale
- Phase 6 PR3 / Phase 19 PR-T1~T5 / Phase 23 PR4 / Phase E 14 라우트 / GNBA 8팀
- recorder_admin Q1~Q6 결재 대기

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-16 | **PR-G5.8 swiss generator R1 박제 + R(N) 501 stub (옵션 B)** | ✅ commit `b8b3117` — swiss-helpers + swiss-knockout 신규 / planSwissRound1 시드 양분 + planSwissNextRound Dutch+Buchholz+최근대전회피 / generateSwissNextRound 501 stub / vitest 240/240 PASS (신규 13 케이스) / 회귀 0 |
| 2026-05-16 | **PR-G5.2 dual-generator placeholder-helpers 통과 (옵션 B)** | ✅ commit `eaccd54` — 인라인 박제 12건 → buildSlotLabel / group_match_result kind 신규 / vitest 227/227 PASS |
| 2026-05-16 | **PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator (옵션 A opt-in)** | ✅ commit `b1e48b8` — 신규 파일 2건 + seed_number kind / 양분 트리 + BYE / vitest 219/219 PASS |
| 2026-05-16 | **PR-G5.5-followup-B 매치 PATCH route 통합** ⭐ | ✅ commit `df96522` — Web PATCH + Flutter match-sync 양면 박제 / 1차 사고 → PR2 PM 직접 검증 모드 옵션 B 진입 |
| 2026-05-16 | **recorder_admin 전역 흡수 + record01/02 강등** ⭐ | ✅ PR #531 main 머지 (`8a913ef`) |
| 2026-05-16 | **4차 뉴비리그 apiToken 자동 발급 fix + Sub-B3** | ✅ PR #527 main 머지 (`1bff83e`) |
| 2026-05-15 | Admin-7-B Sub-B3 Wizard1Step + Sub-B2 EditWizard 박제 | ✅ commit `06069a4` + `efcc103` |
| 2026-05-15 | 본 세션 16 commit main 분리 머지 완료 | ✅ PR #517 + PR #519 |
| 2026-05-15 | 라이브 페이지 정리 + 조별 순위표 + bracket aside 종합 정리 | ✅ commit `5f1e768` + `599c64c` + `0512fb5` 외 |
| 2026-05-15 | PR-G5.5-followup Tournament 단위 placeholder applier | ✅ commit `6d52a33` + `c78bbba` |
