# 작업 스크래치패드

## 현재 작업
- **요청**: 임시번호 부여 UI 이동 (team-section No. cell → lineup-selection-modal 안 row input)
- **상태**: 박제 완료 (developer) / tsc 0 error / vitest score-sheet 13/13 (lineup-selection-modal) PASS / PM 검수 대기
- **현재 담당**: developer → pm

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
| 2026-05-17 | **임시번호 부여 UI 이동** (team-section No. cell → lineup-selection-modal row input / 사용자 결재 옵션 A+A) | ✅ `lineup-selection-modal.tsx` 임시번호 input + diff 기반 BFF POST/DELETE 일괄 박제 (+183 LOC) / `team-section.tsx` No. cell button 폐기 + onRequestEditJersey prop 제거 (-32 LOC) / `jersey-edit-modal.tsx` 파일 삭제 (-268 LOC) / `score-sheet-form.tsx` import + state(jerseyEditCtx) + handler 3건 + mount JSX + TeamSection prop 전달 일괄 정리 (-130 LOC) / BFF API 변경 0 (재사용) / DB schema 변경 0 / 라이브 영향 0 / tsc 0 error / vitest score-sheet lineup-selection-modal 13/13 PASS |
| 2026-05-17 | **강남구협회장배 규정 4 섹션 박제** (`?tab=rules` / 이미지 #183) | ✅ 신규 `gnba-rules.tsx` (4 섹션: 경기방식 i2/i3U9/i3 + 로컬룰 공통/승점/동률 + 경기메뉴얼 + 시상 / +217 LOC) / `page.tsx` settings.points_rule==="gnba" 분기 + tournament.rules 자유텍스트 양립 보존 / 다른 대회 회귀 0 (기존 폴백 유지) / 13 룰 정합 (var(--color-*) / Material Symbols / radius 4px / 데스크탑 2×2 grid → 모바일 column) / tsc 0 error |
| 2026-05-17 | **🚨 강남구협회장배 한정 승점 룰 박제 + 영구 컬럼 + 종료 매치 백필** | ✅ 신규 헬퍼 `standings-points.ts` (calculateMatchPoints / i2=20/30 / i3=10/15 분기 / +85 LOC) / vitest 25/25 PASS (강남구 i2/i3/i3w + default + edge 9 케이스) / `TournamentTeam.win_points` 컬럼 ADD (NULL 허용 / 무중단) / `Tournament.settings.points_rule="gnba"` 강남구 박제 / update-standings + public-standings + public-bracket 정렬 1차키 = winPoints / GroupStandings + LeagueStandings P 컬럼 (강남구 한정) / v2-bracket-wrapper 4곳 pointsRule prop 전달 / 백필 LIVE 완료 31팀 (사후 검증 31/31 정합) / tsc 0 error / vitest 281/281 / 임시 script 정리 |
| 2026-05-17 | **대회 hero 모바일 비율 사고 fix** (v2-tournament-hero.tsx column grid 분기) | ✅ < 480px = column / ≥ 480px = 기존 200px 보존 / 로고 max 140×196 / +30 LOC / tsc 0 error / 데스크탑 시각 변경 0 |
| 2026-05-17 | **5/17 예선1경기 종별 뱃지 누락 fix** (settings.division_code 1행 박제) | ✅ 매치 199 / `i3w-U12` jsonb merge UPDATE / 다른 settings 키 보존 / 사후 검증 19/19 박제 / 임시 script 2개 삭제 / errors.md 기록 |
| 2026-05-17 | score-sheet 임시번호 적용 + 부여 UI (No. cell 모달) | ✅ commit `87169a9` |
| 2026-05-17 | score-sheet 설명서 i3 자동 → 전후반 모드 일반 설명 | ✅ commit `4829360` |
| 2026-05-17 | score-sheet 설명서 신규 3 섹션 (벤치T + Delay + i3 자동) | ✅ commit `fbd566c` |
| 2026-05-17 | score-sheet Delay = Extra periods 같은 행 통합 | ✅ commit `c649b5a` |
## 미푸시 commit
- 직전 push 이후 미푸시 commit: **0건** (`8cdb481` + `16e27da` push 완료 — d681b5f..16e27da subin → subin)

## 구현 기록 (developer — 2026-05-17 임시번호 부여 UI 이동)

📝 구현한 기능: 임시번호 부여 UI 위치 이동 (사용자 결재 옵션 A + A).
- **기존**: team-section No. cell 클릭 → JerseyEditModal open → 1건씩 박제.
- **변경**: LineupSelectionModal 안 각 선수 row 우측 임시번호 input 추가 → 라인업 확정 시 변경분 일괄 BFF 호출.
- BFF API 변경 0 (재사용 — POST/DELETE `/api/web/tournaments/[id]/matches/[matchId]/jersey-override`).
- DB schema 변경 0 (MatchPlayerJersey 박혀있음). 라이브 페이지 영향 0 (3초 polling 자동 반영).

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|----|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/lineup-selection-modal.tsx` | 각 row 우측 임시번호 input + state(jerseyOverrides + baseline) + buildJerseyDiff + callJerseyApi + Promise.allSettled 일괄 호출 + props 확장 (tournamentId/matchId/onAfterJerseyUpdate) | 수정 | +183 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | No. cell button 분기 폐기 (read-only div 만) + onRequestEditJersey prop 폐기 (인터페이스에서 제거) | 수정 | -32 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/jersey-edit-modal.tsx` | **파일 전체 삭제** | 삭제 | -268 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | JerseyEditModal import + state(jerseyEditCtx) + handler 3건 + mount JSX 일괄 삭제 / LineupSelectionModal 에 tournamentId/matchId/onAfterJerseyUpdate prop 전달 / TeamSection 의 onRequestEditJersey wiring 2건 제거 | 수정 | -130 |

원리 (왜):
- 사용자 명시 = 라인업 모달이 이미 양 팀 선수 전체를 보여주는 단일 진입점 → 임시번호 박제도 같이 처리하면 운영자 흐름 끊김 0.
- 변경분 diff 계산 = baseline (모달 open 시점 RosterItem.jerseyNumber / page.tsx resolveMatchJerseysBatch 결과) vs edit state. 4 케이스:
  - baseline null + edit "" = no-op
  - baseline null + edit number = POST (신규)
  - baseline number + edit "" = DELETE (해제)
  - baseline number + edit 다른 number = POST upsert
- Promise.allSettled = 작은 매치 (12명 미만) = 동시 호출 OK. 일부 실패 = 모달 input 값 보존 → 운영자 재시도.
- onAfterJerseyUpdate = caller (form) 가 router.refresh() 호출 → server roster 갱신 → No. cell 즉시 반영.

💡 tester 참고:
- 검증 URL: 임의 score-sheet 매치 진입 (`/score-sheet/[matchId]`) → 라인업 모달 자동 open.
- 정상 시나리오 6단계 (PM 명시):
  1. score-sheet 진입 → 라인업 모달 자동 open
  2. 각 선수 row = "✓ 김수호 #11 [임시: ___] [S]"
  3. 임시번호 input 변경 (예: 11 → 20)
  4. 라인업 확정 → BFF 호출 → toast "임시번호 N건 박제 완료" → router.refresh()
  5. 양식 No. cell = #20 (= 임시번호 반영)
  6. 라이브 페이지도 #20 (= 3초 polling 자동 반영)
- 회귀 위험: 임시번호 변경 0 시 = BFF 호출 0 / 곧바로 onConfirm 호출 (= 기존 동작 동일).
- 일부 실패 시 = toast error + 모달 그대로 (입력값 보존) → 운영자 재시도 가능.
- team-section No. cell = 일반 div (클릭 동작 0 / 시각 변경 0).

⚠️ reviewer 참고:
- BFF API 변경 0 (재사용) — `/api/web/tournaments/[id]/matches/[matchId]/jersey-override` POST/DELETE 그대로.
- DB schema 변경 0 (MatchPlayerJersey 박혀있음).
- 라이브 페이지 영향 0 (3초 polling 의 jerseyMap 재계산 = 자동 반영).
- score-sheet UX 변경 0 (4종 모달 / draft / Phase 23 read-only / lineup 확정 흐름 / 양식 시각 / printable).
- Flutter 앱 영향 0 (별도 박제 예정).
- 시안 13 룰: input fontSize 16px (iOS 자동 줌 방지) / var(--color-*) 토큰 / Material Symbols / radius 0 (FIBA 정합 input border).
- 일부 실패 케이스 사전 검증: 409 JERSEY_CONFLICT (= 같은 매치 같은 번호 다른 선수 사용 중) / 403 (= 권한 없음) / 422 (= zod 검증 실패). 첫 실패 메시지 = toast 안내.
- tsc 0 error / vitest score-sheet/lineup-selection-modal 13/13 PASS.
- 사전 회귀 1건 (running-score-helpers.test.ts PBP score 정합) = 본 작업 변경 0 / 기존 사전 회귀.

---

## 메모
- 직전 작업 (승점 룰 박제) 상세: 작업 로그 1줄 + 위 구현 기록 (규정 박제) 참조

- 어드민 수동 매치 추가 경로 `division_code` 박제 가드 → 후속 PR 안건
- scratchpad 자동 압축 룰: 100줄 이내 유지, 작업 로그 10건 초과 시 가장 오래된 항목 삭제
