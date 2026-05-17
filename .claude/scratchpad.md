# 작업 스크래치패드

## 현재 작업
- **요청**: 5/17 예선1경기 종별 매칭 누락 확인/수정
- **상태**: 완료 (매치 199 settings.division_code 박제 + 사후 검증 통과)
- **현재 담당**: pm

## 진행 현황
| 영역 | 상태 |
|------|------|
| 5/17 종별 뱃지 누락 fix | ✅ 완료 (매치 199 i3w-U12 박제) |
| score-sheet 임시번호 UI | ✅ 완료 (87169a9 외 4 commit) |
| Phase 1 admin 흐름 개선 6 PR | ✅ main 머지 완료 |
| Track B GNBA 유소년 INSERT | 🟡 spec 분석 완료, 결재 8 항목 대기 |
| score-sheet Bench Tech + Delay 박제 | 🟡 design 검토 완료, Q1~Q3 결재 대기 |
| score-sheet PBP 수정 모달 | 🟡 기획설계 완료, 박제 대기 |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-17 | **5/17 예선1경기 종별 뱃지 누락 fix** (settings.division_code 1행 박제) | ✅ 매치 199 / `i3w-U12` jsonb merge UPDATE / 다른 settings 키 보존 / 사후 검증 19/19 박제 / 임시 script 2개 삭제 / errors.md 기록 |
| 2026-05-17 | score-sheet 임시번호 적용 + 부여 UI (No. cell 모달) | ✅ commit `87169a9` |
| 2026-05-17 | score-sheet 설명서 i3 자동 → 전후반 모드 일반 설명 | ✅ commit `4829360` |
| 2026-05-17 | score-sheet 설명서 신규 3 섹션 (벤치T + Delay + i3 자동) | ✅ commit `fbd566c` |
| 2026-05-17 | score-sheet Delay = Extra periods 같은 행 통합 | ✅ commit `c649b5a` |
| 2026-05-17 | score-sheet Delay/벤치T 시인성 + Delay 위치 이동 | ✅ commit `f3d7b96` |
| 2026-05-17 | 🚨 i3w-U12 stale 매핑 영구 fix + 매치 205/207 복원 | ✅ division-advancement 가드 강화 / vitest 35/35 통과 |
| 2026-05-16 | score-sheet Bench Tech + Delay 박제 design 검토 | 🟡 Phase 1~6 (+1090 LOC / 18h / 3 PR 분해) / Q1~Q3 대기 |
| 2026-05-16 | Track B GNBA 유소년 INSERT spec 분석 | 🟡 8중 idempotent 가드 / 결재 8 항목 대기 |
| 2026-05-16 | Phase 1 admin 흐름 개선 6 PR 박제 | ✅ 6 commit push / +3,060 LOC / 회귀 0 |

## 미푸시 commit
- 본 fix = 운영 DB 1행 UPDATE 만, 코드 변경 0 → commit 불필요
- 직전 push 이후 미푸시 commit: **0건**

## 메모
- 어드민 수동 매치 추가 경로 `division_code` 박제 가드 → 후속 PR 안건
- scratchpad 자동 압축 룰: 100줄 이내 유지, 작업 로그 10건 초과 시 가장 오래된 항목 삭제
