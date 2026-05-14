# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 19 PR-S6-team — TeamSection 시안 시각 정합 (운영 891 LOC 비즈니스 로직 100% 보존)
- **상태**: developer 구현 완료 (PM 결재 대기 / 1 commit)
- **모드**: no-stop

## 진행 현황표 (2026-05-14~15 누적)
| 영역 | 결과 |
|------|------|
| main release | ✅ 2건 (`1c843b1` 08:51 + `0ad2a40` 09:19) — Phase C / 23 PR1/PR2+PR3 / 22 knowledge / 19 PR-S1 운영 가동 |
| 운영 DB 변경 | ✅ 1건 — `tournaments_series_edition_unique` UNIQUE INDEX (96ms, raw SQL via prisma client) |
| 시안 무관 commit (본 turn) | Phase 5 A+B / Phase 5 C / editions retry + cross-check audit / knowledge / Phase 1 vitest |
| 시안 관련 commit (Claude Desktop) | PR-S2/S3/S4/S5 + 후속 + S6~S8 누적 (별도 진행) |
| 검증 누적 | vitest 782/782 PASS / tsc 0 |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-15 | Phase 19 PR-S6-team — TeamSection 시안 시각 정합 (운영 891 LOC 보존) | ✅ 2 파일 / tsc 0 / vitest 204/204 / 충돌 0 / PM 결재 대기 |
| 2026-05-15 | 마법사 Phase 1 vitest 회귀 가드 (wizard-draft 12 + wizard-constants 13) | ✅ 25/25 / 전체 782/782 / commit `a4ded2e` |
| 2026-05-15 | Phase 7 작업 C — 회귀 체크리스트 + knowledge 박제 (4 파일) | ✅ wizard-regression-checklist.md 신규 / commit `3e406aa` |
| 2026-05-14 | editions retry 보강 + Phase 23 PR5-A cross-check audit endpoint | ✅ tsc 0 / 자체 9/9 / commit `d858632` |
| 2026-05-14 | 마법사 Phase 5 C — DB unique 인덱스 운영 적용 (raw SQL, 96ms) | ✅ btree 인덱스 정상 / commit `b28545f` |
| 2026-05-14 | 마법사 Phase 5 A+B — last-edition GET + editions POST 확장 | ✅ tsc 0 / 자체 10/10 / commit `5306a2c` |
| 2026-05-14 | Phase 19 PR-S3+PR-S4 reviewer 검증 (Claude Desktop) | ✅ 6/6 + 7/7 통과 |
| 2026-05-14 | Phase 19 PR-S2 후속 권장 3건 수정 (3중 방어선) | ✅ vitest 204/204 / commit `4e0a43d` |
| 2026-05-14 | 마법사 Phase 1 — 공통 타입·draft 인프라 (lib 3 파일) | ✅ self-check 6/6 / commit `7be3aca` |
| 2026-05-14 | release #2 — Phase 23 PR2+PR3 + Phase 19 PR-S1 + BDR sync | ✅ PR #479 머지 `0ad2a40` |

## 미푸시 commit (subin 브랜치)
**0건** — 전부 push 완료.

## subin 미release commit (dev 보다 앞섬)
| commit | 영역 | 검증 |
|--------|------|------|
| `a4ded2e` | test(wizard): Phase 1 vitest 25 케이스 | ✅ 본 turn |
| `3e406aa` | docs(knowledge): wizard-regression-checklist + decisions + lessons | ✅ 본 turn |
| `d858632` | feat(api): editions retry + cross-check audit | ✅ 본 turn 9/9 |
| `b28545f` | feat(db): tournaments_series_edition unique 인덱스 | ✅ 운영 적용 완료 |
| `5306a2c` | feat(api): last-edition + editions 확장 | ✅ 본 turn 10/10 |
| `7be3aca` | feat(wizard): Phase 1 공통 타입·draft 인프라 | ✅ 본 turn (이전 세션) |
| (시안 관련) | PR-S2/S3/S4/S5/S6~S8 + Claude Desktop 작업 | 별도 |

## 시안 무관 후속 큐

### 본 세션 진행 가능 (순차)
1. **Phase 5 신규 API vitest** — last-edition / editions retry / cross-check audit 단위 (prisma mock)
2. **architecture.md 갱신** — 오늘 시안 무관 작업 구조 박제 (마법사 인프라 / cross-check audit / Phase 5 API)
3. (선택) **Phase 7 작업 B 스모크 스크립트 박제** — 실행은 사용자 결재 후 (운영 DB INSERT/DELETE)

### Phase 5 후속 (시안 무관)
- editions/route.ts 분기 단위 검증 (status="draft" 강제 / hasFullPayload 분기)

### Phase 23 후속 (시안 의존도 보류)
- PR4: status="completed" 매치 수정 가드 (UI 영역)
- PR5-B: form.tsx cross-check useEffect fetch wiring (UI 시안 진행 중)
- PR6: ConfirmModal 도메인 컴포넌트 (UI 영역)

### 마법사 후속 (시안 의존 BLOCKED)
- Phase 2/3/4/6 — D1~D4 디자인 시안 도착 후 진입

### 기타
- UI-1.4 entry_fee 재현 (커뮤니케이션)
- GNBA 8팀 코치 안내

## 운영 가동 중 (오늘 적용)
- Phase C status="completed" score safety net — sync 누락 자동 보정 (Flutter 매치 #132 패턴 영구 차단)
- Phase 23 PR2+PR3 — score-sheet 매치 재진입 자동 로드 (매치 218 사고 영구 차단)
- Phase 23 PR1 — PBP → ScoreMark/FoulMark 역변환 헬퍼 (lib only)
- Phase 19 PR-S1 — BDR v2.5 시안 토큰 운영 도입 (.ss-shell 스코프)
- Phase 22 knowledge — paper PBP clock=0 STL 보정 충돌 + 잘못 백필 lesson
- **Phase 5 C — tournaments_series_edition unique 인덱스** (마법사 회차 race 차단)

---

## 구현 기록 (developer) — Phase 19 PR-S6-team (2026-05-15)

📝 구현한 기능: TeamSection 시안 시각 정합 — JSX 트리만 시안 rev2 `.ss-tbox*` 정합, 운영 891 LOC 비즈니스 로직 100% 보존.

### 변경 파일

| 파일 (절대 경로) | LOC | 변경 영역 |
|------|-----|----------|
| `C:\0. Programing\mybdr\src\app\(score-sheet)\_components\_score-sheet-styles.css` | +236 | `.ss-shell .ss-tbox*` / `.ss-c-*` / `.ss-h-fouls*` 룰 시안 정합 이식 (시안 출처 L283~535) |
| `C:\0. Programing\mybdr\src\app\(score-sheet)\score-sheet\[matchId]\_components\team-section.tsx` | +316 -442 (정미 -126) | JSX 시각 재구성: `<table>` → `<div className="ss-tbox__plybody">` grid / Time-outs 6+OT → **7 cells (2+3+2 FIBA 정합)** / Coach inline input → `.ss-tbox__coach` + `.pap-lbl` + `input.pap-u` / props interface 변경 0 |

### 시각 재구성 매핑

| 시안 영역 | 운영 매핑 |
|----------|----------|
| `.ss-shell.ss-tbox` outermost | `<section>` outermost (frameless prop 보존 / 사용자 핵심 제약 #1) |
| `.ss-tbox__head` + `.pap-lbl` + `.pap-u` | sideLabel + teamName |
| `.ss-tbox__tt` (92px \| 1fr grid) | Time-outs 좌 / Team fouls 우 |
| `.ss-tbox__to` (7 cells = 2+3+2) | timeouts state + Phase 17 색 inline wiring |
| `.ss-tbox__tf` 3-line (Period ①②/③④/Extra) | getTeamFoulCountByPeriod + Phase 17 색 + 5+ FT 안내 |
| `.ss-tbox__plyhead` (9 col grid) | Licence/Players/No/P.in/Fouls 1-5 |
| `.ss-tbox__plybody` (12 rows × 9 col grid) | fillRowsTo12 + 5반칙 차단 (data-fouled-out) |
| `.ss-tbox__coach` × 2 | Coach / Assistant Coach |

### 모달 진입점 보존 검증 (4종)

| # | 진입점 | 운영 보존 위치 |
|---|--------|--------------|
| 1 | FoulTypeModal | `.ss-c-foul` button onClick → `onRequestAddFoul(p.tournamentTeamPlayerId)` (운영 흐름 그대로) |
| 2 | PlayerSelectModal | TeamSection 안 직접 진입점 없음 (form.tsx 가 별도 trigger) — 영향 0 |
| 3 | LineupSelectionModal | TeamSection 안 직접 진입점 없음 (form.tsx 가 lineupModalOpen 제어) — 영향 0 |
| 4 | 5반칙 차단 | `ejected = getEjectionReason(...).ejected` → `if (ejected && !isLastFilled) return;` 분기 그대로 / `data-fouled-out="true"` CSS 시각 (`.ss-tbox__plyrow[data-fouled-out="true"]` 빨강 옅게) |

### Phase 17 쿼터별 색 적용 검증

| 위치 | wiring 방식 |
|------|-----------|
| Time-out cell | `getTimeoutPhaseColor(timeouts[i].period)` → filled 시 inline `backgroundColor` + `color: #FFFFFF` (CSS `data-used="true"` 룰 override) |
| Team Foul cell (P1~P4) | `getPeriodColor(period)` → filled 시 inline (단 bonus = `data-bonus="true"` CSS 룰의 `--pap-bonus` 우선) |
| Extra Foul cell (OT) | `getPeriodColor(5)` → 동일 패턴 |
| Player Foul cell | 글자 = `getPeriodColor(mark.period)` / 배경 = `FOUL_TYPE_BG_COLOR[mark.type]` 옅은 톤 (Phase 17 하이브리드 100% 보존) |

### 충돌 grep 결과

| 패턴 | 결과 |
|------|------|
| `ss-tbox\|ss-c-licence\|ss-c-name\|ss-c-no\|ss-c-pin\|ss-c-foul\|ss-h-fouls` (전체 src) | **2 파일** (styles.css 56 + team-section.tsx 61 = 117 occurrences) — 의도된 도입 영역만 / 외부 충돌 0 |

### 운영 동작 보존 검증 (13/13 PASS)

| # | 항목 | 결과 |
|---|------|------|
| 1 | props interface | ✅ TeamSectionProps 변경 0 (frameless 포함) — `_framelessUnused` 로 rename 받기만 |
| 2 | FoulTypeModal 진입점 | ✅ `.ss-c-foul` onClick → `onRequestAddFoul` 그대로 |
| 3 | PlayerSelect/Lineup 진입점 | ✅ TeamSection 안 진입점 없음 — form.tsx 가 보유 / 영향 0 |
| 4 | LineupSelection 진입점 | ✅ 동상 |
| 5 | Timeout cell onClick → setter | ✅ `onRequestAddTimeout` / `onRequestRemoveTimeout` 그대로 |
| 6 | Team foul cell onClick | ✅ Team Foul cells = read-only display (Player Foul 합산) — onClick 없음 / 운영 동작 동일 |
| 7 | 5반칙 차단 handleFoul | ✅ form.tsx handleFoul = 외부 / TeamSection 안 `if (ejected && !isLastFilled) return;` 그대로 |
| 8 | Team fouls 5+ 자유투 안내 | ✅ `ftAwarded = teamCount >= 5` → `FT+{teamCount-4}` 표시 그대로 / form.tsx toast 영향 0 |
| 9 | Phase 17 쿼터별 색 위치 | ✅ getPeriodColor / getTimeoutPhaseColor 호출 위치 동일 (inline style wiring) |
| 10 | Coach / Asst Coach onChange | ✅ `updateCoach("coach")` / `updateCoach("asstCoach")` 그대로 |
| 11 | 외부 컴포넌트 영향 | ✅ FibaHeader / RunningScoreGrid / PeriodScoresSection / FooterSignatures = 0 변경 |
| 12 | Phase 23 자동 로드 | ✅ form.tsx initialFouls/initialTimeouts → TeamSection props 영향 0 |
| 13 | _print.css 인쇄 | ✅ `mark` 클래스 유지 (foul cell) — _print.css 의 `.mark` 검정 강제 룰 그대로 |

### 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT=0 (에러 0) |
| `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | ✅ **204/204 PASS** (11 test files / 668ms) |
| `team-section-fill-rows.test.ts` 단독 | ✅ 8/8 PASS (fillRowsTo12 동작 변경 0) |
| `foul-helpers.test.ts` 단독 | ✅ 42/42 PASS (Article 41 / 5+ 합산 영향 0) |
| 충돌 grep (외부 컴포넌트) | ✅ 0건 (시안 className = 시안 도입 영역만) |

### tester 참고

- **테스트 방법**:
  1. 운영 (mybdr.kr) `/score-sheet/{matchId}` 진입 → TeamSection 시각 = 시안 정합 (Players 12행 × 9 col grid / Time-outs 7 cells 2+3+2 / Team fouls 3-line Period ①② / ③④ / Extra)
  2. Player Foul cell 클릭 → FoulTypeModal open (P/T/U/D 선택) → addFoul 정상
  3. 5반칙 도달 시 행 빨강 옅게 + 이름 빨강 강조 + 추가 클릭 차단 (마지막 해제만 허용)
  4. Team fouls 5+ 도달 시 4번째 cell `--pap-bonus` (BDR Red) 강조 + "FT+N" 안내 영구 표시
  5. Time-out cell 클릭 → Article 18-19 검증 후 마킹 (X 글자) + Phase 17 색 (Q1=검정 / Q2=네이비 / Q3=그린 / Q4=오렌지 / OT=빨강)
  6. Coach / Assistant Coach input = 운영 onChange 그대로 (40자 maxLength)
  7. 인쇄 (Ctrl+P) → `.mark` 검정 강제 룰 적용 (회색 글자도 검정 출력)
- **정상 동작**:
  - 5반칙 차단 = `data-fouled-out="true"` 시각 적용 + onClick `if (ejected && !isLastFilled) return;` 분기
  - Phase 17 쿼터별 색 = filled cell 의 inline style 로 CSS `data-used`/`data-on` 룰 색 override
  - 시안 .ss-shell.ss-tbox outermost = 자체 border 1.5px (frameless prop 무시 — 시안 정합 유지)
- **주의할 입력**:
  - **Phase 23 mid-game reload** = initialFouls / initialTimeouts 자동 로드 → TeamSection 마킹 복원 그대로 표시
  - **OT 진입 시** = Time-out cells 동적 확장 (7 → 8+) / Extra Foul cells = period 5+ 합산
  - **5반칙 직전 (4 fouls)** → 5번째 클릭 시 FoulTypeModal open → 종류 선택 후 form.tsx 의 addFoul + Article 41 차단 분기 (D type / 합산 5 등) → toast 표시 + ejected 시각 즉시 적용

### reviewer 참고

- **특별히 봐줬으면 하는 부분**:
  1. **frameless prop 보존** — `frameless: _framelessUnused` + `void _framelessUnused` 패턴으로 props interface 변경 0 보장 (사용자 핵심 제약 #1). form.tsx 호출 위치 (L1040~L1058 등) 의 `frameless={...}` 전달 그대로 동작.
  2. **Time-outs 7 cells 시안 정합** — 시안 SSTimeoutCells = 1행 2 + 2행 3 + 3행 2 = 7 fixed. 운영 OT 진입 시 8번째+ 동적 확장 (`Math.max(7, timeouts.length)` + extra row push). 이전 6+OT grid-cols-3 폐기.
  3. **Phase 17 쿼터별 색 wiring** — CSS `.ss-tbox__to-cell[data-used="true"]` = 검정 + 흰 / `.ss-tbox__tf-cell[data-on="true"]` = 검정 + 흰. inline style 의 `backgroundColor` + `color: #FFFFFF` 로 override (filled 시). bonus (5+ 4번째 cell) = `data-bonus="true"` CSS 룰의 `--pap-bonus` (BDR Red) 우선 → inline 미설정 분기.
  4. **`.ss-c-foul` 버튼 elements** — 시안에서는 read-only `<div>` 였지만 운영은 `<button type="button">`. CSS `.ss-c-foul` 룰에 `background: transparent / border: 0 / cursor: pointer` 추가로 button 기본 inset 제거. 외관 = 시안 정합 / 동작 = 운영 보존.
  5. **5반칙 시각** — `data-fouled-out="true"` CSS 룰 (`background: rgba(227,27,35,0.10)` + `.ss-c-name color: var(--pap-bonus)`). 이전 inline style 의 `opacity: 0.6 / cursor: not-allowed` 폐기 — 시안 정합 단순화.
  6. **rows 변수 shadowing 회피** — Time-out IIFE 내부 `const toRows` rename (외부 `const rows = fillRowsTo12(players)` 와 구분).
  7. **vitest 204/204 PASS** — team-section-fill-rows 8 / foul-helpers 42 그대로 통과 (fillRowsTo12 / Article 41 합산 영향 0).

### 후속 PR 진입 시 사전 작업

- **PR-S7 FooterSignatures rev2 마무리** (선택): 현재 footer-signatures.tsx 는 PR-S8 에서 `.pap-lbl` / `.pap-u` 도입 완료. 잔여 = 시안 .ss-foot* 마크업 (signature 박스 grid / 6 영역) 정합 검토.
- **PR-S6 후속**: 인쇄 (_print.css) 에서 `.ss-tbox` 의 border 1.5px 가 단일 외곽으로 보이는지 검증 (form.tsx 의 `fiba-divider-bottom` wrapper 와 시각 연속). 필요 시 _print.css 에 `.ss-tbox` 룰 추가.

PM 결재 후 1 commit (`feat(score-sheet): Phase 19 PR-S6-team — TeamSection 시안 시각 정합 (운영 891 LOC 보존)`). commit/push 는 PM.
