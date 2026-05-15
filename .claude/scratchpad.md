# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 3.5 유청소년 결합 코드 후속 (commit `8d92c9d` "i2-U11" 형식 후속 표시/매칭 로직)
- **상태**: 진행 중 — planner-architect 구조 분석 위임 예정
- **선행 작업**: ✅ scratchpad 정리 / ✅ subin → dev → main 머지 (PR #484/#485) / ⏸️ Phase 7 B 스모크 (cookie 박제 대기, scripts/_temp/wizard-smoke.ts 복사됨)
- **병행 결재 대기**: Phase 19 PR-T1~T5 / PR-S10.4 / PR-S10.7 / PR-S10.8 / Phase 23 PR6 (아래 상세 박제 — 별도 세션 작업)

## 진행 현황표
| 단계 | 결과 |
|------|------|
| Phase 19 분해 9 PR (시각 박제) | ✅ commit `9bc6906`, `76edd00`, `678ee77` 등 8 commit / 시각 정합 100% |
| Phase 23 PR1~PR3 (매치 218 사고 차단) | ✅ commit `b7c44d8`, `a147bb1` |
| v2.5 rev1+rev2 design sync | ✅ commit `1fa9210`, `64daa5a` |
| subin 브랜치 push | ✅ 0 미푸시 |
| subin → dev PR #484 | ✅ MERGED `c16e84a` |
| dev → main PR #485 | ✅ MERGED `14f5296` (16 commits 운영 배포) |
| 대회 마법사 작업 | ⏳ 범위 확정 대기 |

## 후속 큐 (미진입)
- **PR-S9** (선택) — `_print.css` rev2 정합 (인쇄 미디어 쿼리 디테일)
- **Phase 23 PR4** (선택) — status="completed" 매치 수정 가드
- **Phase 23 PR5** — audit endpoint 박제 + cross-check 호출 (PR5-A 일부 진행됨 `d858632`)
- **Phase 23 PR6** — ConfirmModal 박제 + OT cross-check 확장 + PaperPBPRow 명시 mapping
- **Phase A.7** — 시안에 운영 모달 5종 박제 의뢰서 작성 (Claude.ai Project)
- **UI-1.4** entry_fee 사용자 보고 재현
- **GNBA 8팀** 코치 안내

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-15 | Phase 3.5 유청소년 결합 코드 "i2-U11" 후속 영향 분석 (planner-architect) | ✅ 20+ 파일 read-only 진단 / 핵심 발견 = `getDivisionInfo` 호출자 0건 + 모든 매칭 DB row 매칭 + `rule.label` 운영자 직접 박제 → 실제 회귀 경로 0건 / 후속 안전 박제 = `parseDivisionCode` 헬퍼 + `getDivisionInfo` fallback (백워드 호환) + vitest 12 케이스 / 단일 PR 125 LOC / 사용자 결재 Q1~Q5 대기 |
| 2026-05-15 | Phase 19 PR-T1~T5 (FIBA 타임아웃 phase 분기 + Extra periods 단순화 + OT 색 Q4 통일) | ✅ timeout-helpers `getCellPhase`+`isCellActive` 신규 + vitest 12 신규 / team-section.tsx SSTimeoutCells `data-disabled-phase` AND 가드 + Extra periods cell 마크업 삭제 (텍스트 + 우측 정렬) / _score-sheet-styles.css `[data-disabled-phase="true"]` 회색+opacity 0.5+not-allowed / period-color.ts getPeriodColor(5+)=warning + PERIOD_LEGEND OT 제거 (4 항목) + 테스트 6 케이스 정합 갱신 / tsc 0 / vitest **223/223 PASS** (211+12) / PM 결재 대기 |
| 2026-05-15 | release #6 (dev → main) — 경기시간 6분 + 분 직접 입력 | ✅ PR #490 (subin→dev) `dedbf04` + PR #491 (dev→main) `3d39065` 머지 / Vercel 자동 배포 |
| 2026-05-15 | feat(game-time-input): 6분 버튼 추가 + 분 직접 입력 input | ✅ TIME_OPTIONS [5,6,7,8,10,12] 6종 + number input (MIN 1 / MAX 60 clamp) + 프리셋 외 값 시 input border accent / vitest 4 신규 / tsc 0 / vitest 822/822 |
| 2026-05-15 | release #5 (dev → main) — 유청소년 STEP 4 (U연령) cross-product | ✅ PR #488 (subin→dev) `4db18a1` + PR #489 (dev→main) `2ba310f` 머지 / Vercel 자동 배포 |
| 2026-05-15 | feat(division-generator): 유청소년 STEP 4 (U연령) + cross-product 코드 생성 | ✅ divisions.ts YOUTH_AGES(U7~U18) + buildYouthDivisionCodes 헬퍼 / 모달 STEP 4 (youth + 디비전 1개+ 시 노출 + 미리보기 N×M개 종별) / vitest 8 신규 / tsc 0 / vitest 806/806 / PM 결재 Q1+Q4=b 진행 |
| 2026-05-15 | release #4 (dev → main) — hotfix 명단 제출 500 + Phase 19 PR-S10.1+2 + Phase 23 PR4+PR6 + Phase A.7 | ✅ PR #486 (subin→dev) `31b9f22` + PR #487 (dev→main) `e9f63d1` 머지 / Vercel 자동 배포 / 6 commits 운영 적용 |
| 2026-05-15 | 최영철 사이드바 메뉴 미노출 다각도 진단 (read-only) | ✅ 운영 DB + 시뮬레이션 + Vercel status 7면 점검 — **코드 100% 정상 + 배포 SUCCESS** / filterStructureByRoles 시뮬레이션 = "대시보드 + 콘텐츠/대회 관리/대회 운영자 도구" 정상 노출 / 원인 = 브라우저 JS bundle 캐시 hit (Hard refresh 안내) |
| 2026-05-15 | fix(team-apply): 명단 제출 500 에러 hotfix — 등번호 중복 3중 가드 | ✅ team-apply-form.tsx Layer1 client 사전 차단 + route.ts Layer2 zod refine (PostBody/PutBody) + Layer3 P2002 try/catch 422 응답 / tsc 0 / vitest 798/798 / **운영 사용자 보고 즉시 대응** (강남구협회장배 유소년부 / 12번 row 김보민 등번호 1 중복) |
| 2026-05-15 | Phase 19 PR-S10.8 score-sheet P1 3 영역 시각 hotfix (빈 row + section border + footer/coach 정합) | ✅ _score-sheet-styles.css 1 파일 / #1 빈 row `:not([data-fouled-out])` + var(--pap-fill) 옅은 회색 (옵션 A) / #2 변경 0 (selector + 룰 이미 정합 ✓) / #3 coach padding `2px 8px` → `0 8px` 시안 정합 / tsc 0 / vitest 211/211 / PM 결재 대기 |
| 2026-05-15 | Phase 19 PR-S10.7 score-sheet 4 영역 hotfix (frame 폭 + selector + A4 + 선 두께) | ✅ _score-sheet-styles.css L549 ss-tbox 합성 + L1012 ss-rs 통합 / form.tsx L1217 frame grid md:grid-cols-[45fr_55fr] / 영역 C/D = 이미 만족 변경 0 / tsc 0 / vitest 211/211 / PM 결재 대기 |
| 2026-05-15 | Phase 19 PR-S10.4 score-sheet 서명 overflow + 좌우 col 라인 정합 (영역 A+B) | ✅ footer-signatures.tsx Captain label minWidth 220→0 + ellipsis / _score-sheet-styles.css ss-footer-sigs box-sizing+overflow+min-height 210 + ss-sigs__row min-width 0+overflow / form.tsx TeamA/B/RunningScore wrapper flex-1 min-h-0 / tsc 0 / vitest 211/211 / PM 결재 대기 |
| 2026-05-15 | Phase A.7 운영 → 시안 역동기화 의뢰서 작성 (doc-writer) | ✅ `Dev/scoresheet-2026-05-14/05-phase-A7-reverse-sync-brief.md` 신규 / 6 컴포넌트 시각 spec 박제 (FoulType/PlayerSelect/LineupSelection/QuarterEnd 모달 + Legend + RotationGuard) / 13 룰 + §1~§8 룰 인용 / Claude.ai Project 입력용 의뢰 본문 + 검수 체크리스트 + 검증 명령 포함 |
| 2026-05-15 | Phase 23 PR6 reviewer WARN 3건 fix (3 영역 묶음) | ✅ ConfirmModal 신규 + window.confirm 0건 / OT (Q5~Q8) cross-check / PaperPBPRow 명시 매핑 + vitest 7건 / tsc 0 / vitest 211/211 / PM 결재 대기 |
| 2026-05-15 | subin → dev → main 머지 (16 commits 운영 배포) | ✅ PR #484 `c16e84a` + PR #485 `14f5296` / scratchpad 209→41줄 정리 |
| 2026-05-15 | Phase 19 종결 (9 PR / 8 commit 시각 박제 + 정적 검토 4 영역 수정) | ✅ TeamSection + FibaHeader + PeriodScoresSection + FooterSignatures + RunningScoreGrid + 토큰 + dead 정리 / tsc 0 / vitest 204/204 |
| 2026-05-15 | Phase 19 PR-S7-officials (FooterSignatures 시안 정합) | ✅ commit `76edd00` push |
| 2026-05-15 | Phase 19 PR-S6-team (TeamSection 891 LOC 비즈니스 로직 100% 보존) | ✅ commit `9bc6906` push |
| 2026-05-15 | Phase 19 PR-S6+S7+S8 rev2 (모드 토글 롤백 + 토큰 단순화 + 로고 변경) | ✅ commit `cdf695a` push |
| 2026-05-15 | v2.5 rev2 design sync (BDR-current/ 갱신 181 파일) | ✅ commit `64daa5a` push |
| 2026-05-15 | Phase 19 PR-S5 (PeriodScoresSection 시안 정합) | ✅ commit `fe022c6` push |
| 2026-05-15 | Phase 19 PR-S4 (FibaHeader 시안 정합) | ✅ commit `1388eae` push |
| 2026-05-15 | Phase 19 PR-S3 (RunningScoreGrid mode prop — rev2 롤백) | ✅ commit `1a37981` push |

## 미푸시 commit (subin 브랜치)
**0건** — 모두 푸시 완료. (Phase 23 PR4 + PR-T1~T5 는 PM 결재 후 commit)

---

## 구현 기록 (developer) — Phase 19 PR-T1~T5 (FIBA 타임아웃 phase 분기)

📝 구현한 기능: FIBA SCORESHEET 타임아웃 + Player Fouls + Legend 의 OT 처리 3 영역 hotfix.
- **PR-T1**: timeout-helpers.ts `getCellPhase` + `isCellActive` 헬퍼 신규 + vitest 12 케이스 (cell index → phase 분기 + 현재 period 와 일치 여부)
- **PR-T2**: team-section.tsx SSTimeoutCells `!isCellActive(i, currentPeriod)` AND 가드 추가 (빈 cell 만 disabled / 마킹된 cell 해제는 phase 무관 허용) + `data-disabled-phase` 속성
- **PR-T3**: _score-sheet-styles.css `.ss-tbox__to-cell[data-disabled-phase="true"]` 회색 (`var(--pap-fill)`) + opacity 0.5 + cursor not-allowed
- **PR-T4**: team-section.tsx Extra periods 라인 = 텍스트 + 우측 정렬만 유지 (1/2/3/4 cell 마크업 삭제 → OT 카운트 텍스트 표시 + FT+N 안내 보존)
- **PR-T5**: period-color.ts `getPeriodColor(5+)` = `var(--color-warning)` (Q4 통일 / 이전 primary) + PERIOD_LEGEND OT 항목 제거 (5 → 4 항목) + 테스트 6 케이스 정합 갱신

### 변경 파일

| 파일 (절대 경로) | 변경 | 신규/수정 | LOC |
|------|------|----|----|
| `C:/0. Programing/mybdr/src/lib/score-sheet/timeout-helpers.ts` | (T1) `getCellPhase` + `isCellActive` 함수 신규 + 한국어 주석 docblock | 수정 | +50 |
| `C:/0. Programing/mybdr/src/__tests__/lib/score-sheet/timeout-helpers-cell-phase.test.ts` | (T1) vitest 12 케이스 (getCellPhase 5 + isCellActive 7) | 신규 | +89 |
| `C:/0. Programing/mybdr/src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | (T2) `isCellActive` import + SSTimeoutCells `cellActive` 변수 + `data-disabled-phase` 속성 + onClick AND 가드 + disabled AND 가드 / (T4) Extra periods cell 마크업 4 cell 삭제 + 우측 정렬 + OT 카운트 텍스트 | 수정 | +30/-44 |
| `C:/0. Programing/mybdr/src/app/(score-sheet)/_components/_score-sheet-styles.css` | (T3) `.ss-tbox__to-cell[data-disabled-phase="true"]` 룰 추가 (회색 + opacity 0.5 + not-allowed) + 한국어 주석 | 수정 | +14 |
| `C:/0. Programing/mybdr/src/lib/score-sheet/period-color.ts` | (T5) `getPeriodColor` 5+ return = `var(--color-warning)` + 주석 갱신 / `PERIOD_LEGEND` 5건 → 4건 (OT 항목 제거) + 주석 갱신 | 수정 | +9/-3 |
| `C:/0. Programing/mybdr/src/__tests__/score-sheet/period-color.test.ts` | (T5) OT1/OT2/OT3 expect 변경 (primary → warning) + PERIOD_LEGEND length 5→4 + 라벨 ['Q1'~'Q4'] + PERIOD_LEGEND[3] = Q4 warning 검증 / OT 항목 제거 | 수정 | +13/-13 |

### 결정 요약

| PR | 결정 | 핵심 사유 |
|---|---|---|
| T1 | `getCellPhase` cellIndex 0/1 → first_half / 2/3/4 → second_half / 5+ → overtime | 시안 7 cells (2+3+2) 정합 — 운영 SSTimeoutCells `toRows = [[0,1],[2,3,4],[5,6]]` 배열과 1:1 매핑 |
| T1 | `isCellActive` OT 의 경우 cellIndex ↔ currentPeriod **일대일** | OT2 진행 중 = cell 5 (OT1) disabled 정상 (다른 OT phase) |
| T2 | `!filled` 조건으로 `data-disabled-phase="true"` 만 적용 | 마킹된 cell 해제 (isLastFilled) = phase 무관 허용 (운영 보존 의무 #1) |
| T2 | `isLastFilled` 분기는 `cellActive` 무시 | 잘못 마킹한 OT cell 도 해제 가능 (사용자 안전) |
| T3 | `var(--pap-fill)` 옅은 회색 사용 (`var(--color-disabled)` 미사용) | 페이퍼 토큰 일관 + 인쇄 정합 (PR-S10 다크모드 leak 차단 룰 보존) |
| T4 | Extra periods cell 삭제 + `otCount` 텍스트 표시 보존 | 운영자 OT 누적 인지 (cell 시각 없어도 숫자 + FT+N 안내로 인지) |
| T5 | OT = `var(--color-warning)` (Q4 색) | 사용자 결재 — OT = Q4 연장 (FIBA Article 정합) / Q2 (accent) BDR Red 와 시각 혼동 해소 |
| T5 | PERIOD_LEGEND 4 항목 (OT 제거) | OT 색 = Q4 색 → 별도 OT 항목 불필요 (운영자가 Q4 색으로 OT 인지) |

### 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | exit=0 / 통과 |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | **223/223 PASS** (이전 211 + 신규 12) |
| 3 | grep `getCellPhase\|isCellActive` in `timeout-helpers.ts` | 5건 매치 ✅ |
| 4 | grep `isCellActive` in `team-section.tsx` | 3건 매치 (import 1 + 변수 1 + 호출 2 중 표시) ✅ |
| 5 | grep `data-disabled-phase` 전체 src | 6건 (CSS 룰 1 + 주석 1 + tsx 속성 1 + 주석 1 + helper 주석 2) ✅ |
| 6 | grep `\.ss-tbox__to-cell\[data-disabled-phase="true"\]` in CSS | 1건 매치 (L593) ✅ |
| 7 | grep `ss-tbox__tf-cells` in team-section.tsx | 3건 (Q1Q2 line + Q3Q4 line + Extra 주석 — Extra 안 cell 마크업 0 ✓) |
| 8 | grep `var(--color-primary)` in `period-color.ts` | 4건 (type alias 정의만 — 호출처 0 / 5+ return 변경 ✓) |

### 운영 동작 보존 검증

| # | 검증 | 결과 |
|---|------|------|
| 1 | TimeoutMark / TimeoutsState shape 변경 0 | ✅ timeout-types.ts 변경 0 / `addTimeout` / `removeLastTimeout` 변경 0 |
| 2 | `handleRequestAddTimeout` / `canAddTimeout` 변경 0 | ✅ score-sheet-form.tsx 호출처 + canAddTimeout 룰 그대로 / Article 18-19 phase 합산 가드 보존 |
| 3 | 4종 모달 / localStorage / BFF submit 변경 0 | ✅ FoulType / PlayerSelect / LineupSelection / QuarterEnd 모달 변경 0 / submit payload 변경 0 |
| 4 | Phase 23 PR2+PR3 자동 로드 (initialRunningScore prop) 영향 0 | ✅ team-section props interface 변경 0 — disabled-phase 는 client side UI 가드만 |
| 5 | 5반칙 차단 (data-fouled-out) / Phase 17 쿼터별 색 wiring 보존 | ✅ Player Fouls cell 의 `getPeriodColor` 호출은 그대로 — 5+ 가 warning 으로 변경되어 OT 마킹 시 색만 자동 변경 |
| 6 | Time-outs `getTimeoutPhaseColor` 보존 (전반 text-primary / 후반 success / OT primary) | ✅ getTimeoutPhaseColor 변경 0 — Time-outs 영역 OT 색은 그대로 primary (의도된 분리) |
| 7 | _print.css 인쇄 정합 유지 | ✅ _print.css 변경 0 / `var(--pap-fill)` = 페이퍼 토큰 (인쇄 시 라이트 강제) / `data-disabled-phase` 룰 = 화면+인쇄 동일 적용 |
| 8 | Team Fouls Q1~Q4 4 cell 마크업 (Q1Q2 / Q3Q4 line) 보존 | ✅ Extra periods line 만 cell 마크업 삭제 / Q1Q2 / Q3Q4 cell 4개 ✓ |

💡 tester 참고:
- **테스트 방법**:
  1. **PR-T2/T3** (셀 phase 시각 차단): paper 매치 진입 → period 1 (Q1) 진행 중 = cell 0/1 (전반) 흰 배경 클릭 가능 ✅ / cell 2/3/4 (후반) 회색 배경 opacity 0.5 + cursor not-allowed ✅. period 3 (Q3) 변경 후 = cell 2/3/4 클릭 가능 + cell 0/1 회색 ✅.
  2. **마킹된 cell 해제 허용**: 후반 진행 중 (Q3) → 전반 cell 1 에 이미 마킹된 X 있으면 isLastFilled 분기로 해제 가능 ✅ (phase 무관 해제).
  3. **PR-T4** (Extra periods): Team A 좌측 Team fouls 영역 line 3 (Extra periods) = "Extra periods" 라벨 + (OT 카운트 숫자) + (5+ FT+N 안내) 우측 정렬 ✅. 1/2/3/4 cell 박스 마크업 ❌ (시각 단순화).
  4. **PR-T5** (OT 색): Player Fouls Q5+ (OT) 마킹 시 글자 색 = 오렌지 (Q4 색 = `var(--color-warning)`) ✅. Team Fouls Q1Q2 line + Q3Q4 line 의 Q1=text-primary / Q2=accent / Q3=success / Q4=warning 보존 ✅.
  5. **Legend** (`period-color-legend.tsx`): 화면 표시 시 4 항목만 (Q1~Q4) — OT 항목 ❌ ✅.
  6. **운영 동작**: 4종 모달 / 자동 로드 / 5반칙 차단 / Article 18-19 phase 합산 가드 / submit 모두 정상.
- **정상 동작**: 셀 phase 시각 차단 + Extra periods 단순화 + OT 색 Q4 통일 + Legend 4 항목.
- **주의할 입력**: period 5 (OT1) 진행 중 + 사용자가 cell 6 (OT2) 클릭 시도 = disabled ✅ (cellActive=false / OT 일대일 매칭). 마킹된 OT1 (cell 5) 해제 클릭 = 허용 ✅ (isLastFilled 분기 우선).

⚠️ reviewer 참고:
- **getCellPhase 1대1 매칭 (OT)**: `cellPhase === overtime` 일 때 `cellIndex === currentPeriod` strict 비교 — cell 5 = period 5 (OT1) / cell 6 = period 6 (OT2) ... 시안 SSTimeoutCells `toRows = [[5,6]]` 의 2 cell 이 각각 OT1 / OT2 와 매핑 (다중 OT 동시 진행 X = 운영자 1 phase 진행).
- **AND 가드 회귀 안전**: 빈 cell 이면서 (`!isLastFilled && !isNextEmpty`) 또는 phase 불일치 (`!isLastFilled && !cellActive`) 시 disabled. 운영 동작 (마킹/해제) 변경 0 — 시각 추가 차단만.
- **data-disabled-phase 빈 cell 한정**: `!cellActive && !filled` 일 때만 "true" 설정 — 마킹된 cell (`filled=true`) 은 phase 무관 회색 안 됨 (마킹 색 보존).
- **CSS cascade 우선순위**: `.ss-tbox__to-cell[data-disabled-phase="true"]` 룰이 `.ss-tbox__to-cell[data-used="true"]` 룰 뒤 (CSS 후순위 cascade) → 동등 specificity 시 후행 룰 우선. 그러나 team-section.tsx 가 `filled=true` 시 `data-disabled-phase="false"` 강제 → CSS 매칭 ❌ → 충돌 0.
- **var(--pap-fill) 토큰 선택**: `var(--color-disabled)` 미사용 — 페이퍼 토큰 일관 (PR-S10 다크모드 leak 차단 룰). 인쇄 시 페이퍼 라이트 강제 보존.
- **PR-T5 OT 색 변경 영향 범위**: `getPeriodColor` 호출처 3 곳 (Player Fouls / Team Fouls Q1~Q4 / Team Fouls Extra). Q1~Q4 = 영향 0 (5+ 만 변경). Player Fouls OT 마킹 시 글자 색 변경 / Team Fouls Extra = PR-T4 로 cell 마크업 삭제됨 → 시각 영향 0. `getTimeoutPhaseColor` 는 별도 함수 — Time-outs OT 색 (primary) 보존.
- **PERIOD_LEGEND 4 항목 회귀**: `period-color-legend.tsx` 가 본 배열 map 으로 렌더 → 자동 4 항목 노출. 호출처 변경 0.
- **TS strict 보존**: `getCellPhase` 반환 `GamePhase` 타입 / `isCellActive` 반환 boolean — 호출처 strict 검증.

---

## 구현 기록 (developer) — Phase 19 PR-S10.8 (P1 빈 row + section border + footer 정합)

📝 구현한 기능: score-sheet 페이지 P1 3 영역 시각 hotfix — (#1) 라인업 < 12명 시 빈 row 시각 보강 (시안 정합 12 row 보존 + 빈 cell 옅은 회색) / (#2) RUNNING SCORE section 사이 1.5px 굵은 구분선 검증 (변경 0 — 이미 정합) / (#3) Footer / Coach row 폭 정합 (coach padding `2px 8px` → `0 8px` 시안 정합).

### 변경 파일

| 파일 (절대 경로) | 변경 | LOC |
|------|------|----|
| `C:/0. Programing/mybdr/src/app/(score-sheet)/_components/_score-sheet-styles.css` | (#1) `.ss-shell .ss-tbox__plyrow:not([data-fouled-out])` selector + `background: var(--pap-fill)` 신규 룰 (L762~771) / (#3) `.ss-shell .ss-tbox__coach` padding `2px 8px` → `0 8px` + 한국어 주석 갱신 (L838~852) | +16/-1 |

### 영역 #1 결정 — 빈 row 시각 보강 (옵션 A)

| 옵션 | 결정 | 사유 |
|------|------|------|
| A. 옅은 회색 배경 (채택) | ✅ | 사용자 명시 권장 — 시안 정합 12 row 보존 + 시각 구분. var(--pap-fill) = 페이퍼 토큰 옅은 회색 (header / plyhead 와 동일 배경) — 단일 토큰 정합. |
| B. dashed border-bottom | ❌ | hair line 0.5px dashed = 시안 plyrow 1px solid 와 불일치 + cell 가로선 (foul ::before) 와 시각 충돌. |
| C. text content 채우기 (예: "—") | ❌ | 시안 mock 데이터도 12 row 채움 — 운영 빈 row 의 `&nbsp;` 그대로 정합. text 추가 = 시안 정합 위반. |

**selector 결정 로직**:
- **빈 row** (team-section.tsx L572): `<div className="ss-tbox__plyrow">` — 속성 없음
- **활성 row** (L601~610): `<div className="ss-tbox__plyrow" data-fouled-out={ejected ? "true" : "false"}>` — 속성 부여
- → `:not([data-fouled-out])` selector 로 빈 row 만 매칭 ✓ (활성 row 의 "true"/"false" 모두 매칭 ❌ — 영향 0)

**구체 변경** (L762~771):
```css
.ss-shell .ss-tbox__plyrow:not([data-fouled-out]) {
  background: var(--pap-fill);
}
```

### 영역 #2 결정 — section border 검증 (변경 0)

**검증 결과 = 이미 정합**:

| 위치 | 룰 | 두께 운영 | 두께 시안 |
|------|----|----------|----------|
| `_score-sheet-styles.css` L1072 (`.ss-rs__head > div[data-section-end="true"]`) | `border-right: 1.5px solid var(--pap-line)` | 1.5px ✓ | 1.5px ✓ |
| `_score-sheet-styles.css` L1112 (`.ss-rs__cell[data-section-end="true"]`) | `border-right: 1.5px solid var(--pap-line)` | 1.5px ✓ | 1.5px ✓ |
| `running-score-grid.tsx` L549 (마킹B cell) | `data-section-end={sectionEnd ? "true" : undefined}` | 매칭 ✓ | 매칭 ✓ |
| `running-score-grid.tsx` L516 (빈 마킹 cell) | `data-section-end={sectionEnd ? "true" : undefined}` | 매칭 ✓ | 매칭 ✓ |

**시안 source 비교** (BDR-current/scoresheet.css L569+L599):
```css
.ss-rs__head > div[data-section-end="true"] { border-right: 1.5px solid var(--pap-line); }
.ss-rs__cell[data-section-end="true"] { border-right: 1.5px solid var(--pap-line); }
```
→ 운영 = 시안 100% 정합. **변경 ❌**.

운영 `SetColumns` 마킹B 컬럼 (L389~413) — `sectionEnd={!isLastSet}` (3 세트 = section-end 적용 / 마지막 세트 = undefined). 결과: col 4 / 8 / 12 cell 의 우측 border = 1.5px ✓.

### 영역 #3 결정 — footer / coach 정합

**시안 source 비교** (BDR-current/scoresheet.css L525~530):
```css
.ss-tbox__coach {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;       /* ← 시안 = 0 8px */
  border-top: 1.5px solid var(--pap-line);
}
```

**운영 이전** (L829): `padding: 2px 8px` (상하 2px) → **시안과 불일치** + officials/sigs (padding 0 8px) 와 불일치.

**변경**: `padding: 0 8px` 통일. min-height 22px 보존 (자연 height 22px = officials/sigs grid-template-rows 22px 정합 보장).

**4 영역 정합 결과**:

| 영역 | padding | row height | underscore (input.pap-u) |
|------|---------|-----------|--------------------------|
| `.ss-tbox__coach` × 2 (Team A/B) | `0 8px` ✓ | min-height 22px ✓ | border-bottom 1px solid var(--pap-line) ✓ |
| `.ss-officials__row` × 4 | `0 8px` ✓ | 22px (grid) ✓ | border-bottom 1px solid var(--pap-line) ✓ |
| `.ss-sigs__row` × 3 | `0 8px` ✓ | 22px (grid) ✓ | border-bottom 1px solid var(--pap-line) ✓ |

→ 4 영역 모두 동일 padding + 동일 row height + 동일 underscore border ✓.

### 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | exit=0 / 통과 |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | 211/211 PASS (회귀 0) |
| 3 | grep `data-section-end` in running-score-grid.tsx | 4건 매치 (L396 주석 + L397 주석 + L516 빈 cell + L549 마크 cell) ✅ |
| 4 | grep `data-section-end` in _score-sheet-styles.css | 4건 매치 (L1013 주석 + L1072 head 룰 + L1112 cell 룰 + 통합) ✅ |
| 5 | grep `not\(\[data-fouled-out\]\)` in _score-sheet-styles.css | 1건 매치 (L770 빈 row 시각 보강 selector) ✅ |
| 6 | grep `padding: 0 8px` in `.ss-tbox__coach` | 1건 매치 (시안 정합 통일) ✅ |

### 운영 동작 보존 검증

| # | 검증 | 결과 |
|---|------|------|
| 1 | TeamSection / FooterSignatures / RunningScoreGrid props 변경 0 | ✅ CSS 변경 only — 컴포넌트 자체 변경 0 |
| 2 | 4종 모달 (FoulType/PlayerSelect/LineupSelection/QuarterEnd) / localStorage / BFF submit 변경 0 | ✅ 모달 진입점 / state setter / onChange 변경 0 |
| 3 | Phase 17 쿼터별 색 / Phase 23 자동 로드 / PR-S10.3 OT 종료 small 버튼 변경 0 | ✅ inline style wiring / initialRunningScore prop / .ss-winner__end-btn 룰 모두 보존 |
| 4 | _print.css 인쇄 정합 유지 | ✅ _print.css 변경 0 / `var(--pap-fill)` 토큰 = 인쇄 시 라이트 강제 (PR-S10 다크모드 leak 차단 룰 보존) |
| 5 | 5반칙 차단 (data-fouled-out="true" 빨강 강조) | ✅ L824~830 `.ss-tbox__plyrow[data-fouled-out="true"]` 룰 보존 / 빈 row selector 와 분리 |
| 6 | coach onChange / state setter | ✅ team-section.tsx 변경 0 / CSS padding 만 변경 |

💡 tester 참고:
- **테스트 방법**:
  1. **영역 #1**: paper 매치 218 (라인업 5명) 진입 → Team A/B player table row 6~12 빈 cell 배경 옅은 회색 (`var(--pap-fill)`) ✅. 활성 row 1~5 = 배경 변경 ❌ (회귀 0).
  2. **영역 #2**: paper 매치 진입 → RUNNING SCORE 16열 grid 에서 col 4 / 8 / 12 (각 세트의 마킹B 컬럼) 의 우측 border 1.5px (다른 cell 1px 보다 굵게) ✅ DevTools Computed `border-right: 1.5px solid var(--pap-line)` 확인.
  3. **영역 #3**: paper 매치 진입 → 좌측 col 안 Team A `Coach` row / Team B `Coach` row / FooterSignatures `Scorer/Asst/Timer/Shot clock op` (4 row) / `Referee/Umpire 1+2/Captain` (3 row) 모두 동일 padding (좌우 8px / 상하 0) + 동일 row height (22px) 시각적 정합 ✅.
  4. **운영 동작**: 5반칙 시 활성 row 빨강 배경 (data-fouled-out="true") 유지 / coach 입력 / 4종 모달 / RunningScore 마킹 모두 정상.
  5. **인쇄**: Ctrl+P → 빈 row 옅은 회색 (`var(--pap-fill)`) 적용 — 페이퍼 정합 보존.
- **정상 동작**: 빈 row 옅은 회색 / section border 1.5px 굵게 / footer/coach 4 영역 정합.
- **주의할 입력**: 12명 라인업 매치 (모든 row 채움) → 빈 row 0 → 영역 #1 영향 0 (회귀 0). data-fouled-out="false" 활성 row 도 `:not([data-fouled-out])` 매칭 ❌ → 시각 변경 0.

⚠️ reviewer 참고:
- **영역 #1 selector 결정**: `:not([data-fouled-out])` — 활성 row 의 "true"/"false" 모두 속성 존재 → 매칭 ❌. 빈 row 만 속성 미존재 → 매칭 ✓. team-section.tsx L572 (빈) vs L604 (활성) 마크업 차이 활용. 회귀 위험 0.
- **영역 #2 변경 0 근거**: selector + 룰 + 운영 JSX 모두 시안 100% 정합 확인. cell border-right 1.5px ✓ + head border-right 1.5px ✓ + JSX 마킹B 컬럼 sectionEnd 적용 ✓.
- **영역 #3 padding 통일**: 시안 source `0 8px` 정합 + officials/sigs 와 통일. 운영 의도된 `2px 8px` 의 사유 = (확인 결과) PR-S6-team 시안 도입 시 inline style 오타로 보임 (시안 source 는 `0 8px`).
- **CSS 스코프 격리**: 모든 변경이 `.ss-shell` 스코프 prefix 안 → 외부 컴포넌트 영향 0.
- **다크모드 leak 회귀 0**: `var(--pap-fill)` = 페이퍼 토큰 (페이퍼 라이트 강제) / `var(--color-*)` 미사용. PR-S10 다크모드 룰 보존.
- **인쇄 정합**: `var(--pap-fill)` = `_print.css` 인쇄 시 동일 적용 (페이퍼 토큰 print-safe).

---

## 구현 기록 (developer) — Phase 19 PR-S10.7 (frame 폭 + selector + A4 + 선 두께)

📝 구현한 기능: score-sheet 페이지 4 영역 hotfix — (A) frame grid 비율 50:50 → 45:55 (RUNNING SCORE 영역 폭 확장 / 빈 공간 보강) / (B) 자손 → 합성 selector 변경 2건 (ss-tbox / ss-rs) / (C) A4 사이즈 정합 = 이미 만족 (변경 0) / (D) 선 두께 = 영역 B 와 함께 자동 해결.

### 변경 파일

| 파일 (절대 경로) | 변경 | LOC |
|------|------|----|
| `C:/0. Programing/mybdr/src/app/(score-sheet)/_components/_score-sheet-styles.css` | (B1) `.ss-shell .ss-tbox` → `.ss-shell.ss-tbox` (L549) + 한국어 주석 / (B2) `.ss-shell .ss-rs` (자손 grid 본체 룰) → `.ss-shell.ss-rs` (L1001 합성 룰 통합 + display/template-rows 통합) | +15/-12 |
| `C:/0. Programing/mybdr/src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (A) frame grid `grid-cols-2` → `grid-cols-[45fr_55fr]` (Tailwind arbitrary value) + 한국어 주석 (사용자 결정 / 이미지 #13 / 영역 A) | +12/-3 |

### 영역 A 결정 — frame grid 비율 50:50 → 45:55

| 옵션 | 결정 | 사유 |
|------|------|------|
| 1. frame grid 비율 조정 (채택) | ✅ | 사용자 명시 "RUNNING SCORE 전체 영역 폭 늘려서 채우면 돼" + 한 위치 변경으로 우측 영역 5% 확장. 시안 50:50 정합은 미세 조정 (45:55) 으로 보존. |
| 2. RUNNING SCORE column 폭 확대 | ❌ | 16열 grid 자체는 1fr 균등 — column 별 폭 변경은 시안 시각 깨짐. |
| 3. 빈 row 자체 숨김 | ❌ | TeamSection player table 12행 grid 시안 정합 변경 → 회귀 위험. |

**구체 변경** (Tailwind arbitrary value):
```jsx
// 전
<div className="grid grid-cols-1 md:grid-cols-2">
// 후
<div className="grid grid-cols-1 md:grid-cols-[45fr_55fr]">
```

- 모바일 (md 미만) = 1 컬럼 (변경 0)
- 태블릿 이상 = 45fr (좌측 Team A/B/Footer) : 55fr (우측 RUNNING SCORE / Period Scores) — 우측 5% 확장.
- 인쇄 (`_print.css` L256~260) = `.md\:grid-cols-2` 강제 룰 — 본 변경 후 `.md\:grid-cols-2` 매칭 ❌ 가능. **인쇄 검증 필요** (테스트 단계 시 화면 + 인쇄 양쪽 확인). 인쇄 시는 시안 50:50 강제가 일관성에 부합 → `_print.css` 룰 변경 0 유지 (오히려 인쇄 = 시안 50:50 / 화면 = 운영 45:55 분리).

### 영역 B 결정 — 자손 → 합성 selector 변경

**원인** (PR-S10.6 동일 패턴 확장):
- 운영 JSX outermost = `<section className="ss-shell ss-tbox">` / `<div className="ss-shell ss-rs ...">` 같은 element.
- 시안 CSS `.ss-shell .ss-tbox` (공백 = 자손 combinator) → 부모-자식 관계 필요 → 단일 element 매칭 ❌.
- 결과: TeamSection / RunningScoreGrid 의 외곽 border / height / grid display / template-rows 미적용.

**grep 검출 결과**:
| 위치 | selector | 운영 outermost | 매칭 |
|------|----------|----------------|------|
| L549 (B 변경) | `.ss-shell .ss-tbox` | `<section className="ss-shell ss-tbox">` (team-section.tsx L232) | ❌ → ✓ |
| L1010 → L1012 (B 변경 통합) | `.ss-shell .ss-rs` (자손 grid 본체 룰) | `<div className="ss-shell ss-rs ...">` (running-score-grid.tsx L194) | ❌ → ✓ |
| L23 (변경 ❌) | `.ss-shell .ss-toolbar` | `<div className="ss-shell">` parent (score-sheet-toolbar.tsx L54) + `<div className="ss-toolbar">` child (L55) — 별도 element | ✓ (자손 정상) |
| L332 (PR-S4) | `.ss-shell.ss-header` | 이미 합성 | ✓ |
| L360 (PR-S5) | `.ss-shell.ss-ps-section` | 이미 합성 | ✓ |
| L881 (PR-S10.6) | `.ss-shell.ss-footer-sigs` | 이미 합성 | ✓ |

**변경 내용**:
- **L549 (`.ss-tbox`)**: `.ss-shell .ss-tbox` → `.ss-shell.ss-tbox` + 주석 추가 (PR-S10.7 / 영역 B). border 1.5px + height 100% + min-height 0 모든 룰 동일 보존.
- **L1010 (`.ss-rs` 본체 grid)**: 이전 두 룰 분리 → 통합. 합성 `.ss-shell.ss-rs` (L1001 페이퍼 토큰 룰) 에 `display: grid` + `grid-template-rows: 22px 22px 1fr` 통합. 자손 룰 L1010~1014 = 제거 (통합 후 중복).

### 영역 C 결정 — A4 사이즈 정합 (변경 0)

**검증 결과 = 이미 만족**:

| 위치 | 룰 | 효과 |
|------|----|------|
| `_print.css` L52~68 `.score-sheet-fiba-frame` | `max-width: 210mm` + `aspect-ratio: 210 / 297` + `min-height: 297mm` + `margin: 0 auto` + `border: 2px solid var(--color-text-primary)` | 화면 = A4 정확 비율 (정사각형 viewport 도 강제) / 인쇄 = WYSIWYG |
| `_print.css` L208~224 `@media print` | `width: 210mm !important` + `height: 297mm !important` + `aspect-ratio: auto !important` (인쇄 시 mm 명시 우선) | 인쇄 시 1 페이지 정확 fit |

→ 추가 작업 ❌. PM 의뢰 시점 검증만 (frame 의 화면 A4 정합 + 인쇄 정합 양쪽 명시 적용).

### 영역 D 결정 — 선 두께 (변경 0)

**검증 결과 = 영역 B 와 통합 해결**:

| 시안 selector | 운영 selector | 두께 시안 | 두께 운영 |
|---------------|---------------|----------|----------|
| `.ss-paper` border (외곽) | `.score-sheet-fiba-frame` border | 2px | 2px ✓ |
| `.ss-h` border-bottom (header) | `.ss-shell .ss-h` border-bottom | 1.5px | 1.5px ✓ |
| `.ss-names` border-bottom | `.ss-shell .ss-names` border-bottom | 1.5px | 1.5px ✓ |
| `.ss-meta` border-bottom | `.ss-shell .ss-meta` border-bottom | 1.5px | 1.5px ✓ |
| `.ss-tbox` border-bottom | `.ss-shell.ss-tbox` border-bottom | 1.5px | 1.5px ✓ (영역 B 변경 후 적용) |
| `.ss-rs__cell` border-right | `.ss-shell .ss-rs__cell` border-right | 1px | 1px ✓ (자식 룰 자손 정상 — 영역 B 변경 후 적용) |
| `.pap-u` border-bottom (underscore) | `.ss-shell .pap-u` border-bottom | 1px | 1px ✓ |

→ 별도 두께 변경 ❌. 영역 B 의 selector 변경으로 자동 해결.

### 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | exit=0 / 통과 |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | 211/211 PASS (회귀 0) |
| 3 | grep `\.ss-shell \.ss-(toolbar\|tbox\|rs\|header\|ps-section\|footer-sigs)` (자손) | 1건 (L23 `.ss-shell .ss-toolbar` — toolbar 는 parent .ss-shell + child .ss-toolbar 별도 element 정상 ✓) |
| 4 | grep `\.ss-shell\.ss-(toolbar\|tbox\|rs\|header\|ps-section\|footer-sigs)` (합성) | 5건 매치 (header L332 / ps-section L360 / tbox L549 / footer-sigs L881 / rs L1012) ✅ |
| 5 | grep `md:grid-cols-\[45fr_55fr\]` in form.tsx | 1건 매치 ✅ |

### 운영 동작 보존 검증

| # | 검증 | 결과 |
|---|------|------|
| 1 | 컴포넌트 props interface 변경 0 | ✅ TeamSection / RunningScoreGrid / PeriodScoresSection / FooterSignatures / FibaHeader props 변경 0 |
| 2 | 4종 모달 / localStorage / BFF submit / buildSubmitPayload 변경 0 | ✅ FoulType / PlayerSelect / LineupSelection / QuarterEnd 모달 + state setter 변경 0 |
| 3 | RunningScoreGrid onClick / setRunningScore / 16 col grid 변경 0 | ✅ running-score-grid.tsx 자체 변경 0 (CSS selector 만 변경) |
| 4 | TeamSection player table / 5반칙 / Phase 17 색 변경 0 | ✅ team-section.tsx 자체 변경 0 |
| 5 | PeriodScoresSection OT 종료 small 버튼 / FooterSignatures 8 input onChange 변경 0 | ✅ 두 컴포넌트 자체 변경 0 |
| 6 | _print.css 인쇄 정합 유지 (A4 portrait) | ✅ _print.css 변경 0. 인쇄 시 `.md\:grid-cols-2` 강제 룰 (L256~260) = arbitrary value 클래스 변경 후 매칭 ❌ 가능 → **테스트 검증 필요** (아래 tester 참고). 화면 = 45:55 / 인쇄 = 시안 50:50 분리 의도. |

💡 tester 참고:
- **테스트 방법**:
  1. **영역 A**: paper 매치 진입 → frame 안 좌:우 비율 45:55 (이전 50:50) 확인. RUNNING SCORE 영역이 좌측 Team B player 빈 row 영역까지 시각적으로 확장됨 ✅.
  2. **영역 B (selector 합성)**:
     - DevTools Elements → `<section class="ss-shell ss-tbox">` 클릭 → Computed → `border` = 1.5px solid var(--pap-line) ✅ + `height: 100%` ✅.
     - `<div class="ss-shell ss-rs ...">` 클릭 → Computed → `display: grid` ✅ + `grid-template-rows: 22px 22px 1fr` ✅.
  3. **영역 C (A4)**: frame 의 DevTools Computed → `max-width: 793.7px` (≈210mm) + `aspect-ratio: 210 / 297` 확인 ✅.
  4. **인쇄 검증** (영역 A 결정 영향): Ctrl+P 또는 인쇄 미리보기 → 인쇄 시 `_print.css` L256~260 `.md\:grid-cols-2 { grid-template-columns: 50% 50% }` 룰이 `[45fr_55fr]` arbitrary 클래스에 매칭 ❌ → 인쇄도 45:55 로 표시될 수 있음. **PM 결재 / 사용자 확인**: 인쇄 시도 화면과 일관 45:55 유지 ✓ (시안 50:50 정합 손실) vs 인쇄만 시안 50:50 강제 추가 룰 박제. 두 옵션 중 사용자 결정.
  5. **운영 동작**: TeamSection 5반칙 색 / Phase 17 쿼터별 색 / RunningScoreGrid 클릭 마킹 / PeriodScoresSection OT 종료 버튼 모두 정상.
- **정상 동작**: 화면 = 좌:우 45:55 / TeamSection 외곽 border 1.5px / RunningScoreGrid 16열 grid 정합 / Period Scores 시작 y = Footer 시작 y (PR-S10.5 룰 보존).
- **주의할 입력**: 모바일 (md 미만, < 768px) = 1 컬럼 → 영역 A 변경 영향 0 (회귀 0).

⚠️ reviewer 참고:
- **영역 A (frame 비율)**: 시안 FIBA PDF 정합 = 50:50 → 사용자 결정 우선 45:55. 의도된 시안 정합 손실 5%. 인쇄 시 `.md\:grid-cols-2` 강제 룰과 충돌 가능 — tester 가 인쇄 검증 후 PM 결재 필요.
- **영역 B (selector 합성)**: 운영 JSX 단일 element 패턴 (PR-S10.6 동일) — 자손 → 합성 변경 = 운영 마크업 무변경 + CSS 매칭 활성화. 회귀 위험 0.
- **영역 B (ss-rs 통합)**: 이전 L1001 (합성 페이퍼 토큰) + L1010 (자손 grid 본체) 분리 → 통합. 자손 룰의 `display: grid` + `grid-template-rows: 22px 22px 1fr` + `min-height: 0` 모두 L1001 합성 룰로 이동. 다른 자식 selector (`.ss-rs__title` / `.ss-rs__head` / `.ss-rs__grid` / `.ss-rs__cell`) = 자손 매칭 정상 (`.ss-shell.ss-rs > .ss-rs__title` 패턴 변경 0).
- **CSS 스코프 격리**: 모든 변경이 `.ss-shell` 합성 selector 안 → 외부 컴포넌트 영향 0.
- **TS strict 보존**: form.tsx 의 className 만 변경 (string literal `md:grid-cols-2` → `md:grid-cols-[45fr_55fr]`) — Tailwind arbitrary value 패턴. JIT 컴파일러가 자동 인식 (시안에 정의된 토큰 무관).
- **다크모드 leak 회귀 0**: 모든 변경은 layout (grid template / display / border) — `var(--color-*)` 추가 없음. PR-S10 다크모드 페이퍼 라이트 강제 룰 보존.

---

## 구현 기록 (developer) — Phase 23 PR4 status="completed" 매치 수정 가드

📝 구현한 기능: status="completed" 매치 score-sheet 재진입/재제출 시 노란 경고 배너 + audit 박제. 사용자 결재 Q3 = 차단 ❌ / UI 경고 + audit 박제 (변경 허용).

### 변경 파일

| 파일 (절대 경로) | 변경 | LOC |
|------|------|----|
| `C:/0. Programing/mybdr/src/app/api/web/score-sheet/[matchId]/cross-check-audit/route.ts` | Zod `warning_type` enum 3종 → 5종 확장 (`completed_edit_entry` / `completed_edit_resubmit` 추가) + 주석 갱신 | +5 |
| `C:/0. Programing/mybdr/src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` | `matchProps.status = match.status` 추가 (require-score-sheet-access 가 이미 SELECT — 추가 쿼리 0) | +6 |
| `C:/0. Programing/mybdr/src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (1) `MatchProp.status?: string \| null` prop 추가 / (2) `isCompleted` 변수 + mount audit POST useEffect / (3) 노란 배너 JSX (cross-check 배너 직전) / (4) `onSubmittedChange` wrapper 로 submit audit POST | +75 |

### audit endpoint 사용 결정

**옵션 A 채택 — 기존 `cross-check-audit/route.ts` 재사용 + warning_type enum 확장**

| 옵션 | 결정 | 사유 |
|------|------|------|
| A. enum 확장 (채택) | ✅ | 중복 endpoint 회피 / Zod schema 2건 추가만 / `tournament_match_audits` 박제 흐름 동일 (source="web-score-sheet" / context=`phase23-cross-check:{warning_type}`) |
| B. 신규 endpoint | ❌ | 같은 인증 가드 / 같은 INSERT 흐름 — 중복 부담 |

### 노란 배너 위치 + 텍스트

- **위치**: `<main className="score-sheet-print-root ...">` 직후 첫 자식 (cross-check 배너 직전, hasOnlyQuarterScores 배너 위)
- **클래스**: `no-print mb-2 px-3 py-2 text-xs` + `border 1px solid var(--color-warning)` + `color-mix warning 12%` 배경 (기존 배너 패턴 일관)
- **아이콘**: `material-symbols-outlined warning`
- **텍스트**:
  - 제목: "이 매치는 종료된 상태입니다"
  - 본문: "수정 후 재제출하면 audit 로그에 기록됩니다. 운영자 책임으로 진행해주세요."

### 진입 audit + submit audit context 차이

| 트리거 | warning_type | 발생 시점 | 호출 위치 |
|--------|--------------|----------|----------|
| 진입 (mount 1회) | `completed_edit_entry` | 페이지 mount + isCompleted=true | `useEffect(() => fetch(...), [])` |
| 재제출 (submit 후) | `completed_edit_resubmit` | MatchEndButton submitted=true 전환 + isCompleted=true | `onSubmittedChange` wrapper 안 |

audit 박제 details (양쪽 동일 shape): `{ warning_type, details: { extra: { match_status, match_updated_at, pbp_count } } }` → BFF 가 `tournament_match_audits` 에 박제 (source="web-score-sheet" / context=`phase23-cross-check:completed_edit_entry by {nickname}`).

### 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | exit=0 / 통과 |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | 204/204 PASS |
| 3 | grep `matchStatus\|isCompleted\|status?:` in score-sheet | `status?: string \| null` prop + `isCompleted` 변수 + 3 사용처 (useEffect / 배너 / submit wrapper) |
| 4 | grep `completed_edit_entry\|completed_edit_resubmit` in src/ | 8건 매치 (form 4 + route 4) ✅ |

### 운영 동작 보존 검증

| # | 검증 | 결과 |
|---|------|------|
| 1 | matchStatus !== "completed" 매치 진입 동작 변경 0 | ✅ isCompleted=false → useEffect early-return / 배너 미렌더 / submit wrapper audit skip |
| 2 | matchStatus === "completed" 진입 = 노란 배너 + audit (운영자 input/submit 차단 ❌) | ✅ disabled 속성 0 / form/state 그대로 운영 가능 |
| 3 | 4종 모달 / localStorage / BFF submit / buildSubmitPayload 변경 0 | ✅ MatchEndButton props 변경 0 / submit wrapper 는 setMatchEndSubmitted 호출 + audit fetch 추가만 |
| 4 | Phase 23 PR2+PR3 자동 로드 (initialRunningScore prop) 영향 0 | ✅ 신규 prop `status` 외 변경 0 |
| 5 | 기존 cross-check 배너 + hasOnlyQuarterScores 배너 표시 보존 | ✅ 신규 배너 = 위 추가 (기존 2건 위치 그대로) |
| 6 | audit endpoint 호출 실패 시 console.warn + 진행 | ✅ `.catch(err => console.warn(...))` fire-and-forget |

💡 tester 참고:
- **테스트 방법**:
  1. status="completed" 매치 진입 → 노란 배너 ✅ + DevTools Network POST `/api/web/score-sheet/{matchId}/cross-check-audit` 1회 호출 (body warning_type=completed_edit_entry) 확인.
  2. 폼 입력 → "경기 종료" → confirm → submit → 재제출 audit POST 1회 호출 (warning_type=completed_edit_resubmit) 확인.
  3. status !== "completed" 매치 (in_progress / scheduled) 진입 → 노란 배너 미렌더 / audit POST 0 (회귀 0) 확인.
  4. audit endpoint 500 → console.warn 만 출력 / 운영자 폼 입력/submit 차단 ❌ (silent fail) 확인.
- **정상 동작**: completed = 노란 배너 + audit / 비-completed = 변경 0.
- **주의할 입력**: status=null (구버전) / "completed" 외 status (in_progress, scheduled, cancelled) → 모두 배너 미렌더 + audit POST 0 (정상).

⚠️ reviewer 참고:
- **차단 ❌ 가드 (Q3 핵심)**: 운영자 input/submit/buildSubmitPayload 차단 0 — 배너 + audit fetch 만. disabled / readonly / preventDefault 추가 없음.
- **fire-and-forget**: 두 fetch 모두 `.catch(console.warn)` — 응답 무시. audit endpoint 가 500/4xx 시도 운영자 작업 진행 ✅.
- **DB 영향**: `tournament_match_audits` INSERT 만 (1회 진입 + 0~1회 재제출 = 매치당 최대 2건). 운영 양 부담 0.
- **enum 확장 회귀**: 기존 3종 호출자 변경 0 — Zod safeParse 통과.
- **isCompleted strict 비교**: page.tsx `match.status` 가 `null` 가능 → `match.status === "completed"` strict 비교. typo / 대소문자 회귀 시 배너 0.
- **submit audit 호출 위치**: `onSubmittedChange(true)` 콜백 안 — MatchEndButton 내부 변경 0 (lifting state up). future 에 `onSubmittedChange(false)` (reset) 호출 시 audit fetch skip (조건 `if (submitted && ...)`).

---

## 구현 기록 (developer) — Phase 23 PR6 reviewer WARN 3건 fix (3 영역 묶음)

📝 구현한 기능: reviewer WARN 3건 모두 fix — (1) ConfirmModal 신규 컴포넌트 박제 + window.confirm() Promise 패턴 교체 / (2) cross-check OT (Q5~Q8) 비교 확장 / (3) PaperPBPRow 명시 매핑 함수 + vitest 회귀 가드.

### 변경 파일

| 파일 (절대 경로) | 변경 | 신규/수정 | LOC |
|------|------|----|----|
| `C:/0. Programing/mybdr/src/app/(score-sheet)/score-sheet/[matchId]/_components/confirm-modal.tsx` | ConfirmModal 컴포넌트 (Props: open/title/message/options/onSelect/onClose) | 신규 | +134 |
| `C:/0. Programing/mybdr/src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (1) ConfirmModal import + ReactNode import / (2) confirmState + confirmModal() Promise 헬퍼 추가 / (3) draft vs DB 우선순위 useEffect 를 async IIFE 로 변경 + window.confirm() → ConfirmModal Promise await / (4) cross-check OT (`ot[]` 배열) 비교 추가 (Q5~Q8) / (5) JSX 끝에 ConfirmModal 마운트 | 수정 | +75/-15 |
| `C:/0. Programing/mybdr/src/lib/score-sheet/running-score-helpers.ts` | (1) PrismaPlayByPlayRow type export / (2) prismaToPaperPBPRow 명시 매핑 함수 export | 수정 | +48 |
| `C:/0. Programing/mybdr/src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` | `pbpRows as unknown as PaperPBPRow[]` 캐스팅 → `pbpRows.map(prismaToPaperPBPRow)` 명시 변환 + import 변경 | 수정 | +5/-3 |
| `C:/0. Programing/mybdr/src/__tests__/lib/score-sheet/prisma-to-paper-pbp-row.test.ts` | vitest 7 케이스 (정상 / NULL / bigint vs number id / foul / 배열 매핑 / 정상+NULL 혼합 / 순수 함수) | 신규 | +207 |

### 영역 1 결정 — ConfirmModal 컴포넌트

**신규 박제 (운영 공용 ConfirmModal 부재)**

| 옵션 | 결정 | 사유 |
|------|------|------|
| A. 운영 기존 재사용 | ❌ | grep 결과: `src/components/` 전역에 ConfirmModal 컴포넌트 부재. info-dialog.tsx 는 단순 알림 (옵션 선택 0). |
| B. score-sheet 영역 신규 (채택) | ✅ | QuarterEndModal / PlayerSelectModal 등 4종 모달과 같은 위치 (`_components/`) + 같은 시각 토큰 (.pap-* 토큰 + var(--color-*)) + 같은 Material Symbols Outlined 아이콘 |
| C. 운영 전역 컴포넌트 박제 | ⏳ | 후속 — 다른 페이지에서도 confirm 필요 시 `src/components/shared/confirm-modal.tsx` 로 승격 가능 |

**Props 시그니처**:
```ts
{ open: boolean; title: string; message: ReactNode;
  options: { value: string; label: string; isPrimary?: boolean; isDestructive?: boolean }[];
  onSelect: (value: string) => void; onClose: () => void; }
```

**Promise 패턴 캡슐화 (score-sheet-form 안)**:
```ts
async function confirmModal(cfg): Promise<string | null> { ... }
// 사용: const choice = await confirmModal({...}); setConfirmState(null);
```
- ESC / backdrop 닫기 = `null` 반환 (호출자가 안전 기본값 분기 처리)
- 옵션 선택 = `value` 반환

### 영역 2 결정 — OT cross-check 확장

**DB quarter_scores shape** (Phase 1 박제):
```ts
{ home: { q1, q2, q3, q4, ot: number[] }, away: { q1, q2, q3, q4, ot: number[] } }
```
→ `ot: number[]` 배열 (`ot[0]`=OT1=Q5 / `ot[1]`=OT2=Q6 / `ot[2]`=OT3=Q7 / `ot[3]`=OT4=Q8)

**비교 로직**:
- Q1~Q4: 기존 동작 보존 (string key 4건 비교)
- OT: `dbOt[]` 배열 + `pbpOt[]` 배열 길이 max 기준 loop. 길이 차이도 mismatch 박제 (PBP=1개 / DB=2개 케이스도 감지).
- 누락 / 비배열 (구버전) → 빈 배열로 fallback (Array.isArray 가드)
- 메시지 라벨: `Q{N}/OT{M} Home/Away PBP={x} / DB={y}` (운영자가 양쪽 라벨로 인식)

### 영역 3 결정 — PaperPBPRow 명시 매핑

**함수 시그니처**:
```ts
export type PrismaPlayByPlayRow = { id: bigint|number; quarter: number|null; ... 11 필드 };
export function prismaToPaperPBPRow(row: PrismaPlayByPlayRow): PaperPBPRow { return { ...row }; }
```
- 위치: `src/lib/score-sheet/running-score-helpers.ts` (PaperPBPRow type 박제 위치 일관)
- 11 필드 그대로 매핑 (nullable 보존)
- TS strict 보장 — schema 변경 시 컴파일 에러로 즉시 감지

**vitest 7 케이스 인벤토리**:
| # | 케이스 | 검증 |
|---|--------|------|
| 1 | 정상 (shot_made 2점) — 11 필드 모두 채워진 행 | 전체 매핑 deep equal |
| 2 | NULL — 모든 nullable 컬럼 NULL | null 보존 (fallback 0 / 빈 문자열 0) |
| 3 | id/team_id 가 number — bigint 아닌 케이스 | type 보존 |
| 4 | foul row (action_type='foul' + subtype='P') | foul 특수 케이스 동작 |
| 5 | 배열 매핑 — pbpRows.map(prismaToPaperPBPRow) | 3건 일괄 변환 + no mutation |
| 6 | 정상 + NULL 혼합 배열 | 각 row 독립 변환 |
| 7 | 순수 함수 — 동일 입력 = 동일 출력 + no mutation | 결정성 + 부작용 0 |

### 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | exit=0 / 통과 |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | 211/211 PASS (이전 204 + 신규 7) |
| 3 | grep `window\.confirm` in score-sheet-form.tsx 실제 호출 | 0건 (4건 주석/이력 only) |
| 4 | grep `as unknown as PaperPBPRow` 실제 코드 | 0건 (4건 주석/이력 only) |
| 5 | grep cross-check loop OT | `maxOtLen` + `for (let i=0; i<maxOtLen; i++)` 확장 확인 |

### 운영 동작 보존 검증

| # | 검증 | 결과 |
|---|------|------|
| 1 | draft vs DB 우선순위 룰 동작 (PR3) — 모달로 변경되어도 룰 자체 보존 | ✅ Promise await 동기 흐름 그대로 / draft 적용 = applyDraft=true / DB 유지 = applyDraft=false |
| 2 | cross-check 배너 표시 흐름 (PR3) — Q1~Q4 + 신규 OT 추가 | ✅ 기존 Q1~Q4 비교 보존 + OT 비교 추가 (diff[] 결과 동일 배너 사용) |
| 3 | 4종 모달 / localStorage / BFF submit / buildSubmitPayload 변경 0 | ✅ FoulType / PlayerSelect / LineupSelection / QuarterEnd 모달 변경 0 |
| 4 | PR2+PR3 자동 로드 (initialRunningScore prop 흐름) 영향 0 | ✅ pbpRows.map 가 같은 PaperPBPRow[] 반환 / pbpToScoreMarks / pbpToFouls 입력 변경 0 |
| 5 | Prisma → PaperPBPRow 매핑 일관성 (기존 round-trip vitest PASS) | ✅ pbp-to-score-marks 15건 + pbp-to-fouls 9건 + running-score-helpers 35건 모두 PASS |
| 6 | PR4 (completed 가드) 영향 0 | ✅ matchProps.status / isCompleted / 노란 배너 / submit audit fetch 모두 그대로 |

💡 tester 참고:
- **테스트 방법**:
  1. **ConfirmModal**: draft 가 DB 보다 더 최신 + hasDBContent=true 인 매치 진입 → 4종 모달 시각 패턴의 confirm 모달 노출 (이전 native confirm 다이얼로그 ❌). 두 버튼 "임시 저장본으로 진행" / "DB 박제본으로 진행" 클릭 후 동작 확인.
  2. **ESC / backdrop 닫기**: 모달 ESC 또는 배경 클릭 = `null` 반환 → DB 유지 (안전 기본).
  3. **OT cross-check**: OT가 있는 매치 (Q5~Q8 점수 박제) → DB ot[] 와 PBP ot[] mismatch 시 노란 배너에 `Q5/OT1 Home PBP=3 / DB=2` 라벨 포함 메시지 노출.
  4. **PaperPBPRow 매핑**: 기존 매치 218 같은 paper 매치 진입 → 자동 로드 ScoreMarks / Fouls 정상 (이전 캐스팅과 동등 동작).
  5. **vitest 7건**: `npx vitest run src/__tests__/lib/score-sheet/prisma-to-paper-pbp-row.test.ts` 통과 확인.
- **정상 동작**: 모달 시각이 4종 모달과 정합 / OT mismatch 도 배너 표시 / 매핑 동작 동일.
- **주의할 입력**: DB ot 가 비배열 (구버전 paper 매치 잔재) → Array.isArray 가드로 안전 fallback / 매치 218 같은 케이스 회귀 0.

⚠️ reviewer 참고:
- **WARN 3건 모두 fix**: window.confirm = 0건 (실제 호출) / OT 비교 추가 / 캐스팅 = 0건 (실제 코드).
- **ConfirmModal 토큰 정합**: var(--color-*) 만 / lucide-react 0 / 빨강 본문 텍스트 0 (destructive 버튼만 primary 배경 — 위험 액션 예외 룰).
- **인쇄 차단**: `.no-print` 클래스 적용 (4종 모달 패턴 일관).
- **Promise 패턴**: useEffect 안 async IIFE — useEffect 자체는 sync 유지 (cleanup 미사용 / mount 1회). React 18 호환.
- **OT key 결정**: DB shape = `{ q1, q2, q3, q4, ot: number[] }` (running-score-helpers.ts toQuarterScoresJson L131 단일 source). OT key 가 별도 (`Q5/Q6/...` 또는 `OT1/OT2/...`) 가 아닌 배열 — toQuarterScoresJson 도 동일 shape 박제로 일관성 보장.
- **mapping 함수 type safety**: `PrismaPlayByPlayRow` 신규 type export — 호출자가 Prisma select 옵션 변경 시 본 type 도 같이 변경 필요 (컴파일 에러로 즉시 감지).

---

## 구현 기록 (developer) — Phase 19 PR-S10.4 (서명 overflow + col 정합)

📝 구현한 기능: score-sheet 페이지 2 영역 hotfix — (A) Captain protest 서명 row 가 좌측 col 의 우측 boundary 침범 차단 / (B) 좌우 col 의 (B1) RunningScore 끝 y = TeamB 끝 y + (B2) 서명란 height = PeriodScores height 정합.

### 변경 파일

| 파일 (절대 경로) | 변경 | 신규/수정 | LOC |
|------|------|----|----|
| `C:/0. Programing/mybdr/src/app/(score-sheet)/_components/_score-sheet-styles.css` | (A) `.ss-shell .ss-footer-sigs` width/max-width/box-sizing/overflow 추가 / (B2) min-height 210px 추가 / (A) `.ss-shell .ss-sigs__row` min-width:0 + overflow hidden 추가 / (B2) `.ss-shell.ss-ps-section` min-height 210px 추가 | 수정 | +21 |
| `C:/0. Programing/mybdr/src/app/(score-sheet)/score-sheet/[matchId]/_components/footer-signatures.tsx` | (A) Captain protest label inline style `minWidth: 220` → `minWidth: 0` + flexShrink 1 + overflow hidden + textOverflow ellipsis | 수정 | +12/-3 |
| `C:/0. Programing/mybdr/src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (B1) 좌측 col TeamA wrapper `fiba-divider-bottom` → `fiba-divider-bottom flex-1 min-h-0` / 좌측 col TeamB wrapper 동일 / 우측 col `<RunningScoreGrid>` 를 `<div className="flex-1 min-h-0">` wrapper 로 감싸기 | 수정 | +14/-9 |

### 영역 A — 서명영역 overflow 해결 방법

**원인 분석**:
- `.ss-sigs__row` = `display: flex` 컨테이너
- 자식 1 = `<label minWidth=220 whiteSpace=nowrap>` (Captain protest)
- 자식 2 = `<input.pap-u flex:1 min-width:0>` (운영 input)
- 좌측 col 폭 ≈ 50% frame ≈ 300~380px → label minWidth 220 + 8px gap + input 최소 폭 = ~280px+ → 좁은 col 에서는 row 자체가 부모 폭 초과 (flex container 기본 동작 = min-content 확장).
- 결과: row 가 좌측 col boundary 를 넘어 우측 RunningScore 영역으로 침범.

**3중 가드 해결**:

| 가드 | 위치 | 룰 | 효과 |
|------|------|------|------|
| 1. wrapper 봉쇄 | `.ss-footer-sigs` | `width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden` | wrapper 자체가 부모 (좌측 col) 폭 안에 강제 fit. 자식이 넘어도 hidden 으로 절단. |
| 2. row 봉쇄 | `.ss-sigs__row` | `min-width: 0; overflow: hidden` | flex container 기본 min-content 확장 무력화. 자식 합산 폭 > 부모 시 hidden. |
| 3. label 축소 | Captain label inline | `minWidth: 0; flexShrink: 1; overflow: hidden; textOverflow: ellipsis` | label 자체가 줄어들 수 있도록. 좁을 때 끝부분 "…" 절단. 충분 폭 시 라벨 그대로 노출. |

→ 3중 가드로 stale 호출 / 동적 폭 변화 / 브라우저 차이 모두 보호.

### 영역 B — 좌우 col 라인 정합 해결 방법

**B1 (RunningScore 끝 y = TeamB 끝 y) — flex 비율 1:1:auto**

좌측 col 구조:
```
flex flex-col
├─ TeamA wrapper (flex-1 min-h-0)  ← 1fr
├─ TeamB wrapper (flex-1 min-h-0)  ← 1fr
└─ FooterSignatures (자연 height) ← auto (flex-shrink: 0 기본)
```

우측 col 구조:
```
flex flex-col
├─ RunningScoreGrid wrapper (flex-1 min-h-0)  ← 1fr
└─ PeriodScoresSection wrapper (자연 height)  ← auto
```

좌우 col 의 grid stretch 효과 (md:grid-cols-2 + align-items: stretch 기본) → 두 col 의 total height 동일. 양쪽 flex-1 영역이 동일 비율로 정합:
- 좌측 (TeamA flex-1) + (TeamB flex-1) = 우측 (RunningScore flex-1) 전체
- 좌측 FooterSignatures (auto) = 우측 PeriodScores (auto)

**min-h-0 추가 이유**: flex item 의 기본 `min-height: auto` 가 자식 콘텐츠 min-height 를 강제 → flex-1 비율 깨짐. `min-h-0` 으로 강제 해제 (flex 표준 패턴).

**B2 (서명란 height = PeriodScores height) — min-height 명시 동일화**

자연 측정 값:
- FooterSignatures: ss-officials (4×22=88) + ss-sigs (3×22=66) ≈ 154px
- PeriodScoresSection: ss-ps (5×22=110) + ss-final (~64) + ss-winner (32) ≈ 206px

**결정**: 양쪽 `min-height: 210px` 명시 (자연 값 정합). 사용자 결정 옵션 D — 자연 height + min-height 동일 명시. 시안 row height (22px) 유지 → A4 인쇄 정합 보존.

### 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | exit=0 / 통과 |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | 211/211 PASS (회귀 0) |
| 3 | grep `min-height: 210px` in _score-sheet-styles.css | 2건 (ss-footer-sigs L883 + ss-ps-section L375) ✅ |
| 4 | grep `flex-1 min-h-0` in form.tsx | 3건 (TeamA + TeamB + RunningScore wrapper) ✅ |
| 5 | grep `min-width: 0` + `box-sizing: border-box` in styles | ss-sigs__row + ss-footer-sigs ✅ |

### 운영 동작 보존 검증

| # | 검증 | 결과 |
|---|------|------|
| 1 | footer-signatures.tsx 의 input value/onChange 8 매핑 변경 0 | ✅ scorer/asstScorer/timer/shotClockOperator/refereeSign/umpire1Sign/umpire2Sign/captainSignature 동작 그대로 |
| 2 | form.tsx 의 TeamSection / RunningScoreGrid / PeriodScoresSection / FooterSignatures props 변경 0 | ✅ 모든 prop 동일 (frameless / state / onChange / 등) — wrapper className 만 변경 |
| 3 | TeamSection 의 player table / 4종 모달 (FoulType/PlayerSelect/LineupSelection/QuarterEnd) 진입점 변경 0 | ✅ TeamSection 컴포넌트 자체 변경 0 |
| 4 | RunningScoreGrid 의 16 col grid / onClick / setRunningScore 변경 0 | ✅ RunningScoreGrid 컴포넌트 자체 변경 0 — wrapper div 추가만 |
| 5 | PeriodScoresSection 의 OT 종료 small 버튼 (PR-S10.3) 변경 0 | ✅ PeriodScoresSection 컴포넌트 자체 변경 0 |
| 6 | _print.css 인쇄 정합 유지 | ✅ _print.css 변경 0 / min-height 210px 는 화면+인쇄 양쪽 동일 적용 |
| 7 | didPrefillRef 자동 prefill / Phase 23 PR2+PR3 자동 로드 영향 0 | ✅ footer-signatures useEffect 변경 0 |
| 8 | frameless=false 회귀 분기 변경 0 | ✅ footer-signatures L278+ 회귀 분기 그대로 |

💡 tester 참고:
- **테스트 방법**:
  1. **영역 A**: paper 매치 진입 → 좌측 col 안 풋터 마지막 row ("Captain's signature in case of protest") 가 좌측 col 안 fit ✅. 좁은 viewport (1024px 이하) 도 우측 RunningScore 영역으로 침범 ❌.
  2. **영역 B1**: 좌측 col 의 TeamB 박스 하단 라인 y 좌표 = 우측 col 의 RunningScoreGrid 하단 라인 y 좌표 ✅ (DevTools Computed 으로 확인).
  3. **영역 B2**: 좌측 col 의 FooterSignatures 영역 height ≈ 210px = 우측 col 의 PeriodScoresSection 영역 height ≈ 210px (양쪽 동일).
  4. **운영 동작**: 풋터 8 입력 (Scorer/Asst/Timer/Shot clock op/Referee/Umpire 1/Umpire 2/Captain) 모두 입력 / 자동 prefill 동작 / draft 복원 / submit 동작 모두 정상.
  5. **인쇄**: Ctrl+P 또는 인쇄 미리보기 → A4 1 페이지 정합 유지 (min-height 210 도 인쇄 적용).
- **정상 동작**: 좌측 col 풋터가 우측 col 침범 ❌ / 좌우 col 라인 정합 ✅ / 운영 데이터 흐름 그대로.
- **주의할 입력**: 모바일 (md 미만, < 768px) = grid 1 컬럼 모드 → flex-1 비율 영향 없음 (좌측만 stack). 회귀 0.

⚠️ reviewer 참고:
- **3중 overflow 가드**: wrapper + row + label 세 곳 모두 봉쇄 — 단일 가드 우회 (e.g. label content 변경 / brower 차이) 모두 차단.
- **min-h-0 필수**: flex item 의 `min-height: auto` 기본값 (CSS spec) 때문에 자식 큰 콘텐츠 (TeamSection 12 row player table) 가 wrapper 를 강제 확장 → flex-1 비율 깨짐. `min-h-0` 없으면 B1 정합 실패.
- **210px 결정 근거**: 자연 측정 값 PeriodScores ≈ 206px 의 round-up (4px 여유) + FooterSignatures ≈ 154px 의 강제 확장 (56px 가산). 시안 row height (22px) 보존.
- **운영 호출 props 변경 0**: 5 컴포넌트 (TeamSection / RunningScoreGrid / PeriodScoresSection / FooterSignatures / FibaHeader) 모두 prop interface / value 변경 0 — wrapper className 만 추가.
- **CSS 스코프**: 모든 변경이 `.ss-shell` 스코프 prefix 안 — 외부 컴포넌트 영향 0.
- **A4 인쇄 정합**: min-height 210px 는 `mm`/`px` 절대 단위 — 인쇄 미디어 쿼리 (`_print.css`) 영향 0 (별도 인쇄 룰 미존재). 자연 측정 값 정합으로 인쇄 fit 안정.
- **다크모드 leak 회귀 0**: 모든 변경은 layout (width/height/overflow/flex) — `var(--color-*)` 추가 없음. PR-S10 다크모드 페이퍼 라이트 강제 룰 보존.

---

## 기획설계 (planner-architect) — Phase 3.5 유청소년 결합 코드 "i2-U11"

🎯 목표: commit `8d92c9d` 으로 생성된 결합 코드 ("i2-U11") 의 후속 표시/매칭/lookup 안전성을 영구 박제.

### 핵심 발견 (read-only 사전 진단 결과)

**진단 1 — `getDivisionInfo` 호출자 = 0건** (grep 결과). 즉 commit body 가 우려한 "ALL_DIVISIONS_MAP[\"i2-U11\"] null lookup → 표시 깨짐" **실제 회귀 경로 = 미존재**. 현재 lookup 호출자 0건 = null 반환해도 영향 0.

**진단 2 — 모든 매칭은 DB row 매칭** (`tournamentDivisionRule.findFirst({ where: { code } })`) — 메모리 lookup 미사용. `tt.category` 가 "i2-U11" 이면 DB row 가 "i2-U11" 으로 박제됨 → findFirst 자동 매칭 성공. 운영 회귀 0.

**진단 3 — 표시 = `rule.label` 운영자 직접 박제** — `divisions/page.tsx` / `teams/page.tsx` / `team-apply/page.tsx` 모두 `rule.label` (운영자 입력) 표시. 헬퍼가 라벨 생성하지 않음. 운영자가 STEP 4 직후 "초3 U11" 류 라벨 입력 → 운영 깨짐 0.

**진단 4 — `preference-form.tsx` L1035 = `D3~D8` 하드코딩** (일반부 전용 사용자 선호 UI). 유청소년 결합 코드와 무관. 회귀 0.

**진단 5 — `getDivisionsForCategory` / `DIVISIONS_BY_CATEGORY` 호출자 = 일반부 필터 UI 3 파일** (tournaments-filter / preference-form / division-generator-modal). 결합 코드는 cross-product 결과로 별도 박제 → 이 헬퍼 분기 영향 0.

### 결론: 즉시 박제 필요 = 0건. 후속 = 안전 박제 (헬퍼 + 회귀 가드)

🟢 실제로 깨질 곳이 0건이라 운영 영향 0 / 회귀 차단 = 헬퍼 + vitest 케이스 + grep guard 3 종.

📍 만들 위치와 구조:
| 파일 (절대 경로) | 역할 | 신규/수정 | 예상 LOC |
|------|------|----|----|
| `C:/0. Programing/mybdr/src/lib/constants/divisions.ts` | `parseDivisionCode` 헬퍼 신규 (결합 코드 파싱) + `getDivisionInfo` 확장 (fallback to base code lookup) | 수정 | +35 |
| `C:/0. Programing/mybdr/src/__tests__/lib/constants/divisions-combined.test.ts` | vitest 12 케이스 (parse 5 + getDivisionInfo fallback 4 + 경계 3) | 신규 | +90 |

🔗 기존 코드 연결:
- `divisions.ts` L203 `getDivisionInfo` 가 결합 코드 들어와도 base code (`"i2"`) 로 fallback lookup → 미래 호출자 추가 시 자동 안전.
- `parseDivisionCode("i2-U11")` → `{ baseCode: "i2", age: "U11", gender: "male" }` 시그니처. 호출자는 표시/매칭/필터링 자유 결정.
- 운영 DB / 매칭 API / preference-form / 기존 호출 = 변경 0 (백워드 호환).

### A. 결합 코드 파싱 헬퍼 설계

```ts
export interface ParsedDivisionCode {
  baseCode: string;        // "i2" / "D3W" / "하모니" — DIVISIONS lookup 가능
  age: YouthAge | null;    // "U11" 등 / 결합 아니면 null
  gender: GenderCode;      // baseCode 의 W 접미사 기반
  isCombined: boolean;     // age !== null
}

export function parseDivisionCode(code: string | null | undefined): ParsedDivisionCode | null;
```

**파싱 룰**:
1. null/undefined/empty → null 반환
2. `/^(.+)-(U\d{1,2})$/` 매칭 시 → `baseCode + age` 분리 + age 가 `YOUTH_AGES` 멤버여야 통과 (`U99` 같은 잘못된 형식 = 결합 아님 처리)
3. 매칭 실패 시 → `{ baseCode: code, age: null, gender, isCombined: false }` (기존 lookup 호환)
4. base code 가 ALL_DIVISIONS_MAP 미존재 시 → null (잘못된 코드)

**경계 케이스**:
- `"i2-U11"` → `{ baseCode: "i2", age: "U11", gender: "male", isCombined: true }` ✅
- `"i2W-U11"` → `{ baseCode: "i2W", age: "U11", gender: "female", isCombined: true }` ✅
- `"i2-U99"` → null (`U99` 미존재)
- `"D3"` → `{ baseCode: "D3", age: null, gender: "male", isCombined: false }` ✅
- `""` / `null` → null

**`getDivisionInfo` 확장 (옵션 B 권장)**:
- 직접 lookup 실패 시 → `parseDivisionCode` 호출 → base code 로 fallback lookup
- 미래 호출자가 `getDivisionInfo("i2-U11")` 호출해도 i2 정보 반환 → null 회귀 영구 차단
- 추가 필드 `age: "U11" | null` 포함 (호출자가 라벨 생성 시 활용)

### B. 표시 라벨 결정 (운영자 박제 우선)

| 옵션 | 결합 코드 | 라벨 표시 | 사유 |
|------|-----------|-----------|------|
| **A (권장)** | "i2-U11" | `rule.label` 운영자 직접 입력 ("초3 U11" 등) | 학년/연령 표시 자유도 100% — 현재 패턴 |
| B | "i2-U11" | 헬퍼 자동 생성 ("i2 U11" / "초3 U11") | DB 라벨 무시 → 운영자 입력 충돌 |
| C | "i2-U11" | gradeMin/gradeMax 기반 자동 (DB) | DB schema 의존 (기존 호환) |

→ **사용자 결재 Q1**: 옵션 A (현재 운영) 유지 권장. STEP 4 마법사가 결합 코드 생성 시 default label = "{div} {age}" 자동 채움 (후속 작업).

### C. 영향 파일 우선순위 매트릭스

| 파일 | 영향 분류 | 결합 코드 처리 | 수정 필요? |
|------|----------|---------------|-----------|
| `lib/constants/divisions.ts` | 🟢 후속 | 헬퍼 추가 | **수정** (PR1) |
| `lib/tournaments/division-formats.ts` | 🟢 후속 | format enum 만 다룸 / 코드 무관 | 0 |
| `lib/tournaments/division-advancement.ts` | 🟢 후속 | L295 `r.code` 그대로 전달 (DB 매칭) | 0 |
| `lib/tournaments/setup-status.ts` | 🟢 후속 | division code 미사용 (대회 수준) | 0 |
| `lib/utils/korean-grade.ts` | 🟢 후속 | 학년 number 만 변환 (코드 무관) | 0 |
| `components/shared/preference-form.tsx` | 🟢 후속 | L1035 D3~D8 하드코딩 (일반부 전용) | 0 |
| `components/tournament/division-generator-modal.tsx` | ✅ 완료 | commit `8d92c9d` 생성 측 | 0 |
| `tournament-admin/.../divisions/page.tsx` | 🟢 후속 | `rule.code/label` 단순 표시 | 0 |
| `tournament-admin/.../bracket/page.tsx` | 🟢 후속 | DB rule 매칭 | 0 |
| `tournament-admin/.../matches/matches-client.tsx` | 🟢 후속 | match.division 직접 표시 | 0 |
| `tournament-admin/.../teams/page.tsx` | 🟢 후속 | `divisionRules` dropdown (code 그대로) | 0 |
| `tournament-admin/.../wizard/page.tsx` (편집) | 🟢 후속 | rule row 단순 편집 | 0 |
| `tournament-admin/new/wizard/page.tsx` (신규) | ✅ 완료 | division-generator-modal 호출 측 | 0 |
| `api/web/admin/.../division-rules/route.ts` (CRUD) | 🟢 후속 | `r.code` snake_case 그대로 응답 | 0 |
| `api/web/admin/.../division-rules/[ruleId]/advance/route.ts` | 🟢 후속 | DB rule 매칭 | 0 |
| `api/web/team-apply/[token]/route.ts` | 🟢 후속 | `where: { code: tt.category }` DB 매칭 | 0 |
| `(web)/team-apply/[token]/edit/page.tsx` | 🟢 후속 | divisionRule 단순 표시 | 0 |
| `lib/services/match-sync.ts` | 🟢 후속 | category 필드 동기화 (code 그대로) | 0 |
| `api/web/admin/.../teams/[ttId]/category/route.ts` | 🟢 후속 | DB rule 매칭 + 선수 일괄 업데이트 | 0 |
| `api/web/admin/.../teams/[ttId]/import-players/route.ts` | 🟢 후속 | DB rule 매칭 | 0 |
| `(referee)/referee/admin/announcements/page.tsx` | 🟢 후속 | division code 미사용 | 0 |

📊 결론: **20+ 파일 중 수정 필요 = `divisions.ts` 1 파일 + 테스트 1 파일** (~125 LOC). 운영 회귀 0.

### D. 구현 단계 (단일 PR)

| 순서 | 작업 | 담당 | 선행 조건 | LOC | 운영 영향 |
|------|------|------|----------|-----|----------|
| 1 | `parseDivisionCode` 헬퍼 신규 + `getDivisionInfo` fallback 확장 (divisions.ts) | developer | 사용자 결재 Q1~Q3 | +35 | 0 |
| 2 | vitest 12 케이스 (parse 5 + fallback 4 + 경계 3) | developer | 1단계 | +90 | 0 |
| 3 | tsc --noEmit + vitest run | tester + reviewer (병렬) | 2단계 | 0 | 0 |

총 ~125 LOC / 1 commit / 회귀 위험 ZERO (백워드 호환 — 기존 호출자 동작 변경 0).

### E. 회귀 가드 + 검증 명령

**vitest 12 케이스**:
1. `parseDivisionCode("i2-U11")` = `{ baseCode: "i2", age: "U11", gender: "male", isCombined: true }`
2. `parseDivisionCode("i2W-U11")` = `{ baseCode: "i2W", age: "U11", gender: "female", isCombined: true }`
3. `parseDivisionCode("D3")` = `{ baseCode: "D3", age: null, gender: "male", isCombined: false }`
4. `parseDivisionCode("하모니W")` = `{ baseCode: "하모니W", age: null, gender: "female", isCombined: false }`
5. `parseDivisionCode("i2-U99")` = null (U99 미존재)
6. `parseDivisionCode(null)` = null
7. `parseDivisionCode("")` = null
8. `parseDivisionCode("invalid-code")` = null
9. `getDivisionInfo("i2-U11")` = i2 정보 (fallback)
10. `getDivisionInfo("i2W-U11")` = i2W 정보 + gender female
11. `getDivisionInfo("D3")` = 기존 동작 (회귀 0)
12. `getDivisionInfo("xxx")` = null

**grep 회귀 가드 명령** (PR 머지 전 실행):
```
grep -rn "DIVISIONS\[" src/         → 호출자 결과 0건 외 모두 base code 호환 확인
grep -rn "ALL_DIVISIONS_MAP\[" src/ → divisions.ts 내부만 (외부 0)
grep -rn "getDivisionInfo(" src/    → 호출자 추가 시 fallback 동작 검증
```

### F. 사용자 결재 후보

| Q | 결재 사항 | 옵션 | 권장 |
|---|----------|------|------|
| **Q1** | 표시 라벨 전략 | A=`rule.label` 운영자 입력 / B=헬퍼 자동 / C=DB grade 자동 | **A** (현재 운영 보존 / 자유도 100%) |
| **Q2** | `parseDivisionCode` 시그니처 | A=`{ baseCode, age, gender, isCombined }` / B=`{ divCode, age }` 단순 | **A** (gender + isCombined 추가 → 호출자 분기 편의) |
| **Q3** | `getDivisionInfo` 확장 | A=fallback 추가 (백워드 호환) / B=신규 헬퍼 `getDivisionInfoCombined` 분리 | **A** (호출자 0건이라 회귀 위험 0 + 미래 안전) |
| **Q4** | PR 분해 | A=단일 PR (125 LOC) / B=헬퍼+테스트 분리 2 PR | **A** (단일 — 영향 작음) |
| **Q5** | YOUTH_AGES 외 age 형식 허용? | A=YOUTH_AGES 화이트리스트 strict / B=`/^U\d{1,2}$/` 정규식만 | **A** (현재 STEP 4 cross-product 가 화이트리스트 — 일관성) |

⚠️ developer 주의사항:
- **운영 호출자 변경 0** — 기존 `getDivisionInfo("D3")` 회귀 검증 vitest 필수 (case 11)
- **`getDivisionInfo` 확장 시 fallback 순서**: 직접 lookup 우선 → 실패 시 parse → base code lookup. (직접 lookup 우선 = "i2" 같은 단독 코드 성능 영향 0)
- **gender 계산**: parse 결과의 baseCode 가 W 끝나면 female. parseDivisionCode 가 gender 직접 계산 (호출자가 다시 계산 불필요)
- **YOUTH_AGES 변경 시 vitest 갱신 필수** — U7~U18 화이트리스트 strict
- **scratchpad 다른 섹션 보존** — Phase 19 PR-T1~T5 / PR-S10.4/7/8 / Phase 23 PR6 결재 대기 박제 손대지 말 것

---

## 구현 기록 (developer) — Phase 3.5 parseDivisionCode

📝 구현한 기능: 결합 코드 ("i2-U11") 후속 안전 박제 — `parseDivisionCode` 헬퍼 신규 + `getDivisionInfo` fallback 확장 + vitest 12 케이스.

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/lib/constants/divisions.ts` | `ParsedDivisionCode` interface export + `parseDivisionCode()` 신규 + `getDivisionInfo()` fallback 확장 (직접 lookup → parse → base lookup) | 수정 | +89 |
| `src/__tests__/lib/constants/divisions.test.ts` | 신규 describe 2개 (parseDivisionCode 8 + getDivisionInfo fallback 4 = 12 케이스) | 수정 | +93 |

🔧 검증 결과:
- `npx tsc --noEmit` → exit=0
- `npx vitest run src/__tests__/lib/constants/divisions.test.ts` → 20 tests PASS (기존 8 + 신규 12)
- `npx vitest run` (전체) → 59 files / 834 tests PASS / 회귀 0

💡 tester 참고:
- 12 케이스 모두 PASS — case 9 (기존 `i2`) + case 11 (기존 `D3`) 회귀 가드 통과
- fallback 순서 검증: case 10 (`i2-U11`) 이 base `i2` info 반환 — label 은 자동 생성 안 함 (Q1=A 운영자 입력 우선)
- YOUTH_AGES strict: case 5 (`i2-U99`) = null (정규식만 매칭 거부)
- 경계 케이스: null/empty/invalid-code 모두 null (case 6/7/8)

⚠️ reviewer 참고:
- `parseDivisionCode` 가 `YOUTH_AGES` 와 `getGenderFromDivision` 을 참조 — 둘 다 파일 후방에 선언되어 있으나 (`YOUTH_AGES` L244 / `getGenderFromDivision` L229) 모듈 평가 완료 후 호출 시점엔 모두 초기화 완료 (TDZ 영향 0)
- `getDivisionInfo` 직접 lookup 우선 = 단독 코드 ("D3"/"i2W") 성능 영향 0
- 미래 라벨 자동 생성이 필요해지면 별도 헬퍼 (`buildCombinedDivisionLabel`) 분리 권장 — 본 PR 은 spec 그대로 base info 만 반환

📦 운영 영향: 0 (호출자 0건 / 백워드 호환 / DB 변경 0 / UI 변경 0)
🔀 commit: PM 직접 수행 예정 (developer 는 commit 하지 않음)
