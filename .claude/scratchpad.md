# 작업 스크래치패드

## 현재 작업
- **요청**: 세션 정리 (2026-05-15 ~ 2026-05-18)
- **상태**: 세션 종합 보고 + knowledge 갱신 진행
- **현재 담당**: pm

## 진행 현황
| 영역 | 상태 |
|------|------|
| 강남구협회장배 5/16~5/17 시합 운영 | ✅ 완료 (60+ PR main 머지) |
| 열혈농구단 전국최강전 4위 플레이오프 | ✅ 완료 |
| 연습용 score-sheet (`/score-sheet/practice`) | ✅ 완료 |
| 강남구 한정 승점 룰 + 영구 컬럼 + 백필 31팀 | ✅ 완료 |
| FIBA Bench Tech + Delay of Game | ✅ 완료 (PR-Possession 1+2+3) |
| 임시번호 = 라인업 모달 단일 진입점 | ✅ 완료 |
| 종이 기록지 7장 → DB 박제 (i3 순위결정전) | ✅ 완료 |
| 순위결정전 advancer 가드 영구 fix | ✅ 완료 (= 전수 완료 시에만 매핑) |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-17 | 열혈농구단 플레이오프 4위까지 강조 (league-standings isPlayoff) | ✅ commit `4b51d2f` / PR #616 main 머지 |
| 2026-05-17 | 연습 모드 [기록 취소] 버튼 노출 fix (canEdit || isPractice) | ✅ commit `263b9e0` / PR #614 main 머지 |
| 2026-05-17 | 연습용 score-sheet 박제 (`/score-sheet/practice` + 5종 권한 가드 + fixture + localStorage) | ✅ commit `d06a6ce` / PR #612 main 머지 |
| 2026-05-17 | 임시번호 = 라인업 모달 row input 이동 (jersey-edit-modal 삭제) | ✅ commit `0a5a96c` / PR #608 main 머지 |
| 2026-05-17 | 강남구 대회 규정 4 섹션 박제 (`?tab=rules`) | ✅ commit `a0e2acb` / PR #605 main 머지 |
| 2026-05-17 | 강남구 한정 승점 룰 박제 + win_points 영구 컬럼 + 31팀 백필 | ✅ commit `e05e71a` / PR #598 main 머지 |
| 2026-05-17 | 모바일 hero column stack (Galaxy Z Fold 5 / < 480px) | ✅ commit `d681b5f` / PR #594 main 머지 |
| 2026-05-17 | 순위결정전 advancer 가드 영구 fix (전수 완료 시에만 매핑) | ✅ commit `552a8d6` / PR #586 main 머지 |
| 2026-05-17 | i3 종별 자동 halves + 점프볼 버튼 박제 | ✅ commit `9878576` / PR #554 main 머지 |
| 2026-05-17 | Bench Tech + Delay of Game (FIBA Art. 36) 전체 박제 | ✅ commit `9d43bb5` / PR #568 main 머지 |

## 미푸시 commit
- 0건 (모든 commit main 까지 머지 완료)

## 메모
- 강남구협회장배 시합 5/16~5/17 = 운영 중 즉시 fix 다수 (60+ PR main 머지)
- 시안 13 룰 / 운영 DB 정책 (destructive 작업 명시 결재) 모두 보존
- Flutter 앱 연동 = 별도 박제 예정 (사용자 명시)
- scratchpad 압축 룰: 100줄 이내 / 작업 로그 10건 / 가장 오래된 항목 자동 삭제
