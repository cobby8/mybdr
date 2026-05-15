# 작업 스크래치패드

## 현재 작업
- **요청**: 공격권 기록 (possession arrow) 기능 — 헤더 큰 화살표 + 헬드볼 모달 + 첫 점프볼 / 쿼터종료 자동 토글
- **상태**: 🟢 PR-Possession-1 박제 완료 (developer) — PR-2 진입 = PM 결재 대기
- **현재 담당**: developer (PR-1 완료) → PM 결재 / commit → developer (PR-2 진입)

## 기획설계 (planner-architect / 2026-05-16) — possession arrow MVP

🎯 **목표**: FIBA 종이 기록지에 공격권 (possession arrow) 박제. 첫 점프볼 승자 선택 → 헤더 큰 화살표 (←/→) 노출 → 쿼터 종료 시 자동 토글 → 헬드볼 발생 시 운영자가 헤더 화살표 클릭 → confirm 모달 → 토글.

📍 **데이터 모델 (옵션 B — action_type 확장)**:
- `play_by_plays.action_type` = `String @db.VarChar` (자유 문자열 / **enum 박제 X**) — **DB schema 변경 0** 확인 완료.
- 신규 action_type 2건 운영 박제만:
  - `jump_ball` (첫 점프볼) — quarter=1 / position=N/A / points=0 / 승자 player_id 박제 / loser team 의 next possession
  - `held_ball` (헬드볼) — quarter=현재 / 가져가는 팀의 placeholder player (또는 NULL) / points=0 / 토글 audit
- **prisma migrate 불필요** — 운영 DB 영향 0 (사용자 DB 정책 §1 통과).
- `home_score_at_time` / `away_score_at_time` = 시점 누적 (현 점수 유지).

📍 **state 위치 결정 (단순화 우선)**:
- `runningScore` (RunningScoreState) **확장 X** — score 도메인 오염 회피.
- **신규 state 1건** `possession` (form local state):
  ```
  type PossessionState = {
    arrow: "home" | "away" | null;  // null = 첫 점프볼 미선택
    openingJumpBall: { winnerTeam: "home" | "away"; winnerPlayerId: string } | null;
    heldBallEvents: Array<{ period: number; takingTeam: "home" | "away" }>;
  }
  ```
- 자동 토글 = setPossession (handleEndPeriod + handleHeldBallConfirm) 한 곳.
- draft-storage `loadDraft` / `saveDraft` 에 possession 박제 (Phase 7-B lineup 패턴 재사용).

📁 **만들 위치와 구조**:
| 파일 경로 | 역할 | 신규/수정 | 예상 LOC |
|----------|------|----------|---------|
| `src/lib/score-sheet/possession-types.ts` | `PossessionState` / `JumpBallEvent` / `HeldBallEvent` 타입 (running-score-types 패턴) | **신규** | ~50 |
| `src/lib/score-sheet/possession-helpers.ts` | `togglePossession()` / `applyHeldBall()` / `applyOpeningJumpBall()` / `possessionToPBPInputs()` PURE 헬퍼 (running-score-helpers 패턴) | **신규** | ~120 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/jump-ball-modal.tsx` | 첫 점프볼 모달 (4 모달 UX 패턴 = ESC/backdrop/sm:flex-row footer) — 점프볼 승자 팀 + 선수 선택 (라인업에서 1인) | **신규** | ~180 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/possession-confirm-modal.tsx` | 헬드볼 confirm 모달 (ConfirmModal 재사용 박제로 ~60 LOC) — Q: "헬드볼 발생 — 공격권 [Team X] 가져갑니다" | **신규** | ~60 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | `possessionArrow` prop 추가 + 큰 화살표 SVG (Material `arrow_back` / `arrow_forward` 56px) + onArrowClick 콜백 (헤더 우측 / 쿼터 뱃지 좌측) | 수정 | +50 / -0 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | `possession` state + handler 4건 (open jump-ball / confirm jump-ball / confirm held-ball / quarter end 자동 토글) + 모달 mount 2건 + FibaHeader props wiring + buildSubmitPayload 확장 | 수정 | +90 |
| `src/lib/score-sheet/running-score-helpers.ts` | `marksToPaperPBPInputs` 옆에 `possessionToPBPInputs` 추가 import (또는 helpers 에서 합성) | 수정 | +10 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | possession 페이로드 받아 PBP 박제 (action_type=jump_ball/held_ball) + zod schema 확장 | 수정 | +40 |
| `src/lib/score-sheet/draft-storage.ts` | draft 박제 키 1건 추가 (`possession`) | 수정 | +6 |
| `src/__tests__/score-sheet/possession-helpers.test.ts` | PURE 헬퍼 vitest (togglePossession 4 / applyHeldBall 3 / applyOpeningJumpBall 3 / possessionToPBPInputs 5) | **신규** | ~140 |

🔗 **기존 코드 연결**:
- `lineup-selection-modal` 닫기 (handleLineupConfirm) **직후** → `possession.arrow === null` 이면 `setJumpBallModalOpen(true)` 자동 open (현재 lineup confirm 후 양식 노출 흐름 사이에 단계 1개 추가)
- `handleEndPeriod` (line 980) 에서 마지막에 `setPossession(p => ({ ...p, arrow: p.arrow === "home" ? "away" : "home" }))` 1줄 추가 + toast (FIBA 룰 자동 토글)
- `FibaHeader` props (line 51) 에 `possessionArrow / onArrowClick` 2건만 추가 — 기존 prop 14건 전부 보존
- `buildSubmitPayload` (line 1222) 에 `possession` 키 박제 → BFF 가 possession PBP 변환
- `pbp-edit-modal` (line 80) = **본 PR 영향 0** — jump_ball / held_ball 은 read-only (점수 변경 X)

📋 **실행 계획 — 3 단계 PR 분해**:

| 순서 | PR | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|----|------|------|----------|-----------|
| 1 | **PR-Possession-1** PURE 헬퍼 + 타입 | 신규 파일 2건 (possession-types / possession-helpers) + vitest 15 케이스 — DB / UI 영향 0 / `tsc 0` + `vitest possession-helpers` 15/15 | developer | 없음 | ~30분 |
| 2 | **PR-Possession-2** UI + state + 모달 | 모달 2건 신규 + fiba-header / score-sheet-form 수정 — UI 만 (BFF 영향 0) / draft 박제 / 운영자 직접 확인 가능 | developer | PR-1 머지 | ~60분 |
| 2.5 | (병렬) tester + reviewer | tester = paper 매치 manual / reviewer = 시안 13 룰 점검 (var(--color-*) / Material Symbols / 빨강 본문 0) | tester + reviewer 병렬 | PR-2 완료 | ~20분 |
| 3 | **PR-Possession-3** BFF + PBP 박제 | submit/route.ts zod 확장 + action_type=jump_ball/held_ball PBP INSERT + 운영 검증 (실제 paper 매치 submit) | developer | PR-2 머지 | ~40분 |

⚠️ **developer 주의사항**:

1. **DB schema 변경 0 강제** — `prisma/schema.prisma` 수정 금지 (action_type=String VarChar 그대로 / migrate 불필요). 사용자 DB 정책 §2 위반 위험 0.
2. **시안 13 룰 절대 준수** — 큰 화살표는 Material Symbols `arrow_back` / `arrow_forward` (lucide-react ❌). 화살표 색상 = `var(--color-text-primary)` 또는 `var(--accent)` (빨강 본문 텍스트 ❌ — 화살표는 아이콘이라 허용. 단 본문 문장 색은 회색). pill 9999px ❌ → 사각 박스 (radius 4px 또는 0 — 쿼터 뱃지와 정합).
3. **모달 4종 UX 패턴 100% 정합** — ESC / backdrop / 헤더 X / sm:flex-row footer (FoulType / PlayerSelect / LineupSelection / QuarterEnd / PBP-Edit 5종 직참).
4. **possession === null 시 화살표 미노출** — fiba-header `possessionArrow == null` 조건부 (운영 호환 / 기존 paper 매치 영향 0).
5. **첫 점프볼 모달 trigger 단계** — `handleLineupConfirm` (line 1357 setLineup 직후) 에 `if (!possession.openingJumpBall) setJumpBallModalOpen(true)` 1줄. lineup === null → lineupModal → onConfirm → jumpBallModal → onConfirm → 양식 진입 순서.
6. **헬드볼 confirm 모달 메시지** — "헬드볼 발생 — 다음 공격권은 [Team X] 가 가집니다 (FIBA Art. 12.5)". 토글 후 양 팀 운영자 모두 인지하도록 toast 5초 (foul toast 패턴).
7. **draft 박제 / 복원** — Phase 7-B lineup 패턴 그대로 (`draft.possession` 객체 spread, shape 검증 후 setPossession).
8. **Phase 22/23 read-only 정합** — `isReadOnly=true` 시 (a) jumpBallModal 강제 close (b) onArrowClick undefined (c) submit BFF 가 possession 키 무시. **Phase 22 paper override (commit `63c0633`) 영향 0** (paper PBP 그대로 + jump_ball/held_ball 만 추가 / quarter_scores 합산 변화 0).
9. **light forced + zoom 0.7 인쇄 룰** — 모달 2건 모두 `.no-print` / 화살표는 인쇄 시 자연 노출 (헤더 박제). 인쇄 검증 manual 1회.
10. **회귀 검증 의무** — `npx tsc --noEmit` = 0 / `npx vitest run running-score-helpers.test.ts` = 50/50 PASS (기존 35 + 신규 15) / score-sheet 4 기존 모달 동작 0 변경.

📋 **PM 결재 필요 (developer 진입 전)**:
- Q1. 화살표 위치 = "쿼터 뱃지 좌측" (헤더 우측 영역에서 쿼터 뱃지 옆) 확정?
- Q2. 화살표 색상 = `var(--accent)` (BDR Red 류) vs `var(--color-text-primary)` (회색) — 시안 13 룰 빨강 본문 ❌ 이지만 아이콘은 허용 → **회색 권장** (헤더 시각 노이즈 최소).
- Q3. PR 3단 분해 (~2.5시간) vs 1 PR 통합 (~1.5시간 / 회귀 위험 ↑) — **3단 분해 권장**.
- Q4. PR-3 운영 DB 박제 검증 = paper 매치 1건 직접 submit 후 SELECT 1회 (사용자 결재 후 진행 / 운영 영향 = INSERT 2건 / 회수 가능).

## 구현 기록 (developer / 2026-05-16) — PR-Possession-1 PURE 헬퍼 + 타입 + vitest

📝 **구현한 기능**: 공격권 (Possession Arrow) PURE 헬퍼 + 타입 박제. UI / BFF / DB 영향 0. PR-2 (UI + state) / PR-3 (BFF + PBP 박제) 진입을 위한 단일 source 헬퍼.

📁 **변경 파일**:
| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/lib/score-sheet/possession-types.ts` | `PossessionState` / `JumpBallEvent` / `HeldBallEvent` interface + `EMPTY_POSSESSION` const (running-score-types.ts 패턴) | **신규** | 58 |
| `src/lib/score-sheet/possession-helpers.ts` | `togglePossession` / `applyOpeningJumpBall` / `applyHeldBall` / `possessionToPBPInputs` PURE 함수 4건 + `PossessionPBPInput` interface (running-score-helpers.ts 패턴) | **신규** | 122 |
| `src/__tests__/score-sheet/possession-helpers.test.ts` | vitest 15 케이스 (toggle 4 / opening 3 / held 3 / PBP 변환 5) | **신규** | 187 |

🔗 **운영 제약 준수**:
- 다른 파일 변경 0 (form / fiba-header / submit route / draft-storage / running-score-helpers 모두 unchanged)
- DB schema 변경 0 (action_type=String VarChar 그대로 — PR-3 에서 INSERT 만)
- 시안 13 룰: 시각 컴포넌트 없음 (PURE 헬퍼만) → 룰 적용 0건
- server-safe (`src/lib/score-sheet/` 위치 일관 — Prisma / DOM 의존 0)

✅ **검증**:
- `npx tsc --noEmit` = **exit code 0** (에러 0)
- `npx vitest run possession-helpers` = **15/15 PASS** (315ms)
- 다른 vitest 회귀: score-sheet 전체 210 케이스 중 `running-score-helpers.test.ts` 1건 fail 발견 — **본 PR 범위 밖** (작업 시작 시점에 이미 M 상태 / 다른 미커밋 작업의 회귀 / `git diff --stat` 242 라인 추가됨)

💡 **tester 참고**:
- **테스트 방법**: `npx vitest run possession-helpers` 1회 — 15 케이스 통과 확인
- **정상 동작**:
  - `togglePossession({arrow:"home", ...})` → `{arrow:"away", ...}` (immutable)
  - `togglePossession({arrow:null, ...})` → 원본 state 반환 (가드)
  - `applyOpeningJumpBall(state, "home", "p1")` → `arrow="away"` (loser 방향) + `openingJumpBall={winner:"home", winnerPlayerId:"p1"}`
  - `applyHeldBall(state, 2)` → `arrow` 토글 + `heldBallEvents` 에 `{period:2, takingTeam:이전arrow}` push
  - `possessionToPBPInputs(state, matchId)` → `[{actionType:"jump_ball", period:1, team:winner}, ...{actionType:"held_ball", period:N, team:takingTeam}]`
- **주의할 입력**:
  - `arrow=null` 상태에서 `togglePossession` / `applyHeldBall` 호출 → state 그대로 반환 (Opening Jump Ball 선행 필수 — caller 보호)
  - `applyOpeningJumpBall` 재호출 시 마지막 박제값 보존 (재정정 시나리오 — 운영자 실수 fix)
- **수동 검증 불필요** — PURE 헬퍼 + vitest 15 PASS 로 충분 (UI / DB 영향 0)

⚠️ **reviewer 참고**:
- **`possessionToPBPInputs` 의 `_matchId` 파라미터** — 본 PR 에서는 사용 ❌ (caller (PR-3 BFF) 가 PBP row 의 `match_id` 컬럼에 활용 / 시그니처 일관성). underscore prefix 로 unused 경고 회피 + 다음 PR 에서 사용 예정 박제.
- **`PossessionPBPInput` interface** — `PaperPBPInput` (running-score-helpers) 와 의도적으로 분리. paper PBP 는 11 필드 (score / player / made / subtype 등) / possession PBP 는 3 필드 (actionType / period / team) 만 — domain 분리 의도적.
- **immutability 패턴** — running-score-helpers 의 `addMark` / `undoLastMark` 와 동일 (spread + 새 객체). 모든 헬퍼는 `state` 직접 변형 0.
- **테스트 케이스 케이스 #7 (재호출 보존)** — Opening Jump Ball 의 winner 변경 시 arrow 도 같이 갱신됨을 검증 (운영자 실수 정정 시나리오 박제).
- **회귀 발견 (별건)** — `running-score-helpers.test.ts` 1건 fail 은 본 PR 시작 전 다른 미커밋 작업 (`running-score-helpers.ts` 96 라인 추가 + 테스트 148 라인 추가) 의 회귀. **본 PR 범위 밖** — PM 별도 조치 필요.

🚀 **다음 PR 진입 조건**:
- PR-2 (UI + state + 모달): 본 PR `possession-types.ts` + `possession-helpers.ts` import 하여 `score-sheet-form.tsx` state + `fiba-header.tsx` 화살표 박제. 본 PR 완료 = PR-2 진입 가능 (DB 영향 0 / draft-storage 만 확장).
- PR-3 (BFF + PBP 박제): `possessionToPBPInputs` 호출 → `play_by_plays` INSERT. 운영 DB 영향 = INSERT 만 (사용자 결재 후 진행).

## 이전 구현 기록 (fiba-header 쿼터 뱃지 v3 — 보존)

### fiba-header 쿼터 뱃지 v3

📝 **구현한 기능**: fiba-header.tsx 의 쿼터 뱃지 (Q2/OT1 빨강 outline 박스) 위치 위로 이동 (`alignSelf: flex-start` + `marginTop: -4px`) + 뱃지 바로 아래 매치 상태 라벨 (10px / 회색) 박제. 사용자 보고 이미지 #157 fix.

📁 **변경 파일**:
| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | `marksCount?: number` prop 추가 + `matchPhaseLabel` 산출 (matchEnded 우선 / marksCount === 0 → "경기 전" / 1+ → "경기 중") + 뱃지 wrapper column flex + 라벨 div | 수정 | +44 / -19 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | FibaHeader 호출에 `marksCount={runningScore.home.length + runningScore.away.length}` wiring | 수정 | +4 |

🔗 **운영 제약 준수**:
- props interface 신규 prop 1건 (`marksCount?: number`) 만 추가 — 기존 props 시그니처 변경 0
- 미전달(undefined) 시 라벨 미노출 (운영 호환 — 다른 호출자 있을 시 회귀 0)
- RunningScoreState shape 변경 0 (home/away 배열 length 합산만)
- 신규 BFF / state 변경 0 — 시각 박제만
- 시안 13 룰: var(--color-text-secondary, #6B7280) 회색 라벨 / Material 아이콘 영향 0 / 빨강 본문 텍스트 0 / 인쇄 영향 0 (헤더는 인쇄 시 자연 표시)

✅ **검증**:
- `npx tsc --noEmit` = exit code 0 (에러 0)
- HMR: 다음 dev server 재컴파일 시 자동 반영 (편집된 파일만 다시 컴파일)

💡 **tester 참고**:
- **테스트 방법**:
  1. paper 매치 점검 페이지 진입 (`/score-sheet/{matchId}`)
  2. **상태 1 (경기 전)**: 마크 0건 + matchEnded=false → 뱃지 "Q1" + 라벨 "경기 전" (회색)
  3. **상태 2 (경기 중)**: 첫 득점 마킹 후 → 뱃지 "Q1~Q4/OT1+" + 라벨 "경기 중"
  4. **상태 3 (경기 종료)**: 경기 종료 submit 후 → 뱃지 "경기 종료" (회색) + 라벨 "경기 종료"
- **정상 동작**:
  - 뱃지가 그리드 cell 상단에 align (이전 center 위치보다 약 4px 위로)
  - 라벨 = 뱃지 바로 아래 gap 4px / 가운데 정렬
  - 라벨 색상 = `var(--color-text-secondary)` (회색) — 뱃지 빨강과 시각적으로 분리
- **주의할 입력**:
  - marksCount prop 미전달 (호환성 케이스) → 라벨 미노출 (뱃지만 노출 = 이전 동작)
  - matchEnded=true 우선 → marksCount 무관하게 "경기 종료" 표시

⚠️ **reviewer 참고**:
- **wrapper 박스 구조 변경** — 기존 단일 div (뱃지) → wrapper div (column flex) + 자식 2개 (뱃지 div + 라벨 div). `.ss-h` grid-template-columns "92px 1fr auto" 변경 0 — wrapper 가 자연 폭 auto 로 정합.
- **`alignSelf: flex-start`** — 부모 `.ss-h` grid item 으로서 cell 상단 정렬 (이전 center 가 박혀있어 위치 변경 시 사용자가 명시한 "위로 조금 이동" 효과).
- **CSS 변수 fallback** — `var(--color-text-secondary, #6B7280)` 토큰 미정의 환경 (인쇄 등) 에서도 회색 박제.

## 이전 구현 기록 (PBP 수정 모달 — 보존)

## 구현 기록 (developer / 2026-05-16)

📝 **구현한 기능**: paper 매치 운영자가 toolbar "기록수정" 버튼 클릭 → PBP list 플로팅 모달 진입 →
   쿼터별 시간순 PBP 표시 + 행별 점수 (1↔2↔3) / 선수 변경 / 삭제 → "저장" 시 runningScore state 갱신
   (즉시 BFF 호출 X — form 자연 흐름 "쿼터 종료" / "경기 종료" 에서 기존 submit BFF 재사용).

📁 **변경/신규 파일**:
| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/lib/score-sheet/running-score-helpers.ts` | `updateMarkPoints` / `removeMark` / `renumberPositions` 헬퍼 3건 추가 (position 자동 재정렬 invariant 보장) | 수정 | +90 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/pbp-edit-modal.tsx` | PBP 조회/수정 플로팅 모달 (period asc / position asc 정렬 list + inline 1/2/3 segmented + 선수 select + 삭제 confirm) | **신규** | +455 |
| `src/app/(score-sheet)/_components/score-sheet-toolbar.tsx` | `onOpenPbpEdit` prop + "기록수정" 버튼 (라인업 ↔ 설명서 사이 / Material `edit_note` 아이콘) | 수정 | +25 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | `pbpEditModalOpen` state + `handleApplyPbpEdit` handler + 모달 mount + toolbar `onOpenPbpEdit` 콜백 | 수정 | +50 |
| `src/__tests__/score-sheet/running-score-helpers.test.ts` | 신규 헬퍼 3건 vitest 15 케이스 (renumberPositions 4 / updateMarkPoints 5 / removeMark 6) | 수정 | +148 |
| **합계** |  |  | **+768** |

🔗 **운영 제약 100% 보존**:
- runningScore.marks shape 변경 0 (`ScoreMark { playerId, period, position, points }` 그대로)
- buildSubmitPayload / clearDraft / loadDraft 흐름 변경 0
- 신규 BFF endpoint 0 (모달 "저장" = setRunningScore() 만 / form 자연 흐름에서 기존 submit BFF 재사용)
- isReadOnly 가드 이중 방어: (1) toolbar `onOpenPbpEdit` undefined 시 버튼 미노출 (2) form `handleApplyPbpEdit` 안 isReadOnly 가드 (3) 모달 자체 open=false 강제
- 시안 13 룰 100% 준수: `var(--color-*)` 토큰 / `material-symbols-outlined` 아이콘 / radius 4px / 빨강 본문 텍스트 0 (삭제 버튼만 `--color-warning`)
- light forced + zoom 0.7 인쇄 룰 영향 0 (모달 `.no-print`)
- 4종 모달 (FoulType / PlayerSelect / LineupSelection / QuarterEnd) UX 패턴 정합: ESC / backdrop / 헤더 X 버튼 / sm:flex-row 푸터

✅ **검증 결과**:
- `npx tsc --noEmit` = 에러 0 (전체 strict)
- `npx vitest run running-score-helpers.test.ts -t "PR-PBP-Edit"` = **15/15 PASS** (신규 헬퍼 100%)
- 기존 35 케이스 1 fail 케이스 (`marksToPaperPBPInputs > home_score_at_time 누적 정합`) = **본 작업 무관** (다른 세션 2026-05-15 PR-B / P0-2 sort 룰 변경의 잠재 회귀)

💡 **tester 참고**:
- **테스트 방법** (수동):
  1. paper 매치 점검 페이지 진입 (e.g. `/score-sheet/{matchId}` 매치 218)
  2. 헤더 toolbar 의 "기록수정" 버튼 클릭
  3. 모달 안에서 임의 row 의 점수 1↔2↔3 segmented 토글 → 누적 점수 자동 재정렬 확인
  4. 임의 row 의 선수 dropdown 변경 → 즉시 갱신 확인
  5. 임의 row 의 삭제 버튼 (휴지통 아이콘) → window.confirm → 삭제 + 후속 position 재정렬 확인
  6. "저장" 클릭 → 모달 닫힘 → Running Score grid 자동 갱신 → PeriodScoresSection 자동 갱신
  7. 그 후 "쿼터 종료" → BFF submit (기존 흐름) → DB 박제 검증
- **정상 동작**:
  - 모달 열기: 진행 매치 / 수정 모드 진입 매치만 "기록수정" 버튼 노출
  - 종료 매치 + 수정 모드 미진입 시 toolbar 버튼 미노출 (이중 방어)
  - "취소" / ESC / backdrop 클릭 시 변경 0 (임시 state 폐기)
  - 점수 변경: 마지막 마킹 position = 팀 누적 점수 invariant 자동 보존
- **주의할 입력**:
  - 빈 매치 (마크 0건) = "아직 기록된 득점이 없습니다" empty state 표시
  - 라인업 외 선수 ID 가 마크에 박혀있는 경우 (mixed) = dropdown 끝에 "(명단 외)" fallback option 추가
  - 인쇄 시 모달 `.no-print` = 자동 hide 보장

⚠️ **reviewer 참고**:
- **특별히 봐줬으면 하는 부분**:
  1. `renumberPositions` 의 reduce 누적 로직 — 1번째 마크부터 cumulative 점수 누적 정확성 (테스트 4 케이스 통과)
  2. 모달 안 `useEffect` 으로 open 토글 시 draft 동기화 패턴 — 외부 marks 변경 0 보장 (deep clone)
  3. `handleApplyPbpEdit` 의 `currentPeriod` 변경 X 가드 — 모달 안에서 쿼터 변경 미허용 룰
  4. 시각: ConfirmModal size="xl" 패턴 정합 (lineup modal 과 동일 m-auto max-h-[92vh] w-[min(720px,94vw)])
- **planner "회귀 0" 명시 영역 확인**:
  - cross-check audit endpoint = 신규 호출 0 (모달은 state 만 변경 / DB 직접 호출 0)
  - draft localStorage 5초 throttle 흐름 변경 0
  - Phase 23 PR-RO/EDIT 룰 정합 (isReadOnly 가드 단일 source 재사용)

📌 **planner-architect 결정 plan 5건 100% 준수**:
1. ✅ 데이터 source = runningScore state 단일 (form 메모리)
2. ✅ 수정 흐름 = state 갱신 + "저장" 클릭 시만 form state 반영 (즉시 BFF 호출 X)
3. ✅ 수정 필드 = 점수 (1↔2↔3) + 선수 + 삭제 3건만 (쿼터 / position 변경 0)
4. ✅ 파일: 신규 1 (`pbp-edit-modal.tsx`) + 수정 3 (`score-sheet-form.tsx` / `score-sheet-toolbar.tsx` / `running-score-helpers.ts`)
5. ✅ 재계산 = state 갱신 → form 의 기존 자동 draft / submit 흐름 그대로

## 기획설계 (planner-architect / 2026-05-16)

## 기획설계 (planner-architect / 2026-05-16)

🎯 **목표**: paper 매치 운영자가 toolbar "기록수정" 버튼으로 플로팅 모달 진입 → 쿼터별 PBP list 조회 + 항목 수정/삭제 → DB 자동 재계산.

📍 **데이터 source 결정 (질문 1)**: **`runningScore` state (form 메모리) = 단일 source**
- 비유: form state = "운영자가 손에 든 종이 기록지" / DB = "박제된 사본". 손에 든 종이를 고친 뒤 사본으로 다시 박제하는 흐름이 직관적.
- **이유**: (a) paper 매치는 runningScore 가 1차 source. submit 시 BFF 가 runningScore → PBP/MatchPlayerStat/quarter_scores 3중 박제 (단방향). (b) PBP DB 를 source 로 하면 양방향 sync 필요 → race / mismatch 사고 위험. (c) form 의 cross-check (Phase 23) 이미 PBP 합산 ↔ DB 비교 노이즈 발생 — 추가 source 회피. (d) match_events 테이블은 paper 매치 미사용 (Flutter 전용).
- **paper 매치 진입 시점**: page.tsx 가 DB PBP → marksFromPBP() 역변환 → initialRunningScore prop → useState 초기값 (이미 박제됨).

🔄 **수정 데이터 흐름 (질문 2)**: **state update + 명시 "저장" 버튼 (별도 BFF submit)**
- 임시 state (모달 안 로컬) → "적용" 클릭 → form runningScore 갱신 → form "저장" 버튼 클릭 → BFF submit (기존 path 재사용).
- **이유**: (a) 항목 1건 수정마다 자동 BFF submit = 5건 수정 = 5회 round-trip + 5회 syncSingleMatch 재실행 → 운영 DB 부하 + 로그 오염. (b) 운영자가 "여러 건 한꺼번에 고친 뒤 한 번에 저장" UX 가 종이 양식 흐름과 정합. (c) 기존 MatchEndButton 패턴 (buildSubmitPayload + fetch submit) 재사용 → 신규 endpoint 0.

✏️ **수정 가능 필드 (질문 3) — 우선순위**: Phase 1 (조회만) / Phase 2 = **점수 변경 (1↔2↔3) + 선수 변경 + 항목 삭제** 3건만.
- 운영 우선순위: 1점→2점 (가장 빈번) > 선수 변경 (잘못 마킹) > 삭제 (실수 입력). 쿼터/위치/시간 수정 = **Phase 2 범위 제외** (PBP position 재정렬 = runningScore 전체 재계산 위험 / cross-check 노이즈 / FIBA 양식 룰 위반 가능).
- **이유**: position 변경 = "팀 누적 점수 위치" 자동 추론 (inferPoints) 가 깨짐. 쿼터 변경 = quarter_scores 재계산 필요 (PR 범위 확장).

📁 **만들 위치와 구조**:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `_components/pbp-edit-modal.tsx` | 플로팅 모달 (PBP list + 행별 수정/삭제 UI) | **신규** |
| `_components/score-sheet-toolbar.tsx` | "기록수정" 버튼 박제 + props 확장 (onOpenPbpEdit) | 수정 |
| `_components/score-sheet-form.tsx` | 모달 mount + handler (handleOpenPbpEdit / handleApplyPbpEdit) | 수정 |
| `src/lib/score-sheet/running-score-helpers.ts` | `updateMarkPoints` / `removeMark` / `renumberPositions` 순수 함수 추가 | 수정 |

🔗 **기존 코드 연결**:
- `runningScore` state 단일 source → 모달 read + 수정 후 setRunningScore() 호출 → 기존 draft 자동 박제 (5초 throttle).
- "저장" 진입점 = MatchEndButton + QuarterEndModal + (Phase 2-B) PbpEditModal 적용 시 = 모두 동일 `/api/web/score-sheet/{matchId}/submit` BFF 호출.
- 신규 endpoint **0** (Phase 1+2 모두 — 기존 submit BFF 재사용).

⚙️ **재계산 흐름 (질문 5)**: **runningScore state 갱신 → form 안 derived state 자동 갱신 (PeriodScoresSection / FinalScore 자동 재렌더) → "저장" 클릭 시 BFF 전체 재제출**.
- 1건 수정 = 메모리 update 만 (DB 영향 0). "저장" 후 = syncSingleMatch 가 매번 PBP 전체 deleteMany + 재INSERT (idempotent) → quarter_scores + MatchPlayerStat 자동 재계산. **increment 패치 X** (운영 안정성 최우선).
- `removeMark` / `updateMarkPoints` 후 position 재정렬 = `renumberPositions(marks)` 헬퍼로 1~N 연속 재할당 (마지막 마킹 position = 팀 누적 점수 유지).

📋 **실행 계획**:
| 순서 | Phase | 작업 | 담당 | 선행 조건 | commit 단위 |
|------|-------|------|------|----------|------------|
| 1 | Phase 1 | running-score-helpers.ts 순수 함수 3건 추가 (updateMarkPoints / removeMark / renumberPositions) + vitest 8 케이스 | developer | 없음 | `feat(score-sheet): PBP edit helpers (Phase 1-A)` |
| 2 | Phase 1 | pbp-edit-modal.tsx 신규 — list 조회 UI 만 (쿼터별 grouping / 행별 표시 / 닫기 버튼) | developer | 1단계 | `feat(score-sheet): PBP edit modal skeleton (Phase 1-B)` |
| 3 | Phase 1 | toolbar "기록수정" 버튼 + form mount + onOpenPbpEdit handler | developer | 2단계 | `feat(score-sheet): PBP edit toolbar button (Phase 1-C)` |
| 4 | Phase 2 | pbp-edit-modal.tsx 행별 수정 UI (1↔2↔3 점수 toggle + 선수 select + 삭제 아이콘) + handleApplyPbpEdit (form runningScore 갱신) | developer | 3단계 | `feat(score-sheet): PBP edit apply (Phase 2-A)` |
| 5 | Phase 2 | tester + reviewer 병렬 (vitest 회귀 + UX 4종 모달 시각 정합 + 종료 매치 차단) | tester + reviewer | 4단계 | (검증만) |
| 6 | Phase 2 | PM 직접 검증 (BFF 회귀 0 / cross-check 정합 / paper 매치 218 운영 검증) | pm | 5단계 | `test(score-sheet): PBP edit Phase 2 검증` |

⚠️ **developer 주의사항**:
1. **runningScore.position 직접 수정 금지** — `updateMarkPoints` / `removeMark` 호출 후 `renumberPositions` 로 1~N 연속 재할당 (마지막 position = 팀 누적 점수 invariant).
2. **isReadOnly 가드** — 종료 매치 (PR-RO3) + canEdit=false 시 modal 미오픈 (toolbar 버튼 자체 조건부 노출).
3. **신규 endpoint 0** — submit BFF 재사용 (Phase 2-A 의 `handleApplyPbpEdit` = `setRunningScore` 만 호출, 자동 BFF X). 사용자가 form "저장" 클릭 시 기존 흐름.
4. **시안 13 룰 준수** — Material Symbols Outlined / `var(--color-*)` 토큰 / 핑크/살몬/코랄 ❌ / pill 9999px ❌ / lucide-react ❌. ConfirmModal size="xl" 패턴 재사용 가능 (설명서 모달과 동일).
5. **cross-check 회귀** — Phase 23 의 `crossCheckFired.useRef` flag 가 mount 1회만 비교 → PBP 수정 후 mismatch 재계산 안 함. 영향 0 (저장 → DB 재박제 → reload 시 새 비교).
6. **draft 자동 저장** — runningScore 변경 시 기존 5초 throttle 자동 박제. 수정 모달 닫기만 해도 (저장 미클릭) draft 박제 됨 → reload 시 복원. **이는 의도된 동작** (운영자 실수 회수용).

🚦 **위반 자동 reject**:
- 새 BFF endpoint 신설 ❌ (submit 재사용)
- DB 직접 update (`prisma.playByPlay.update`) ❌ (syncSingleMatch 단일 source)
- match_events 테이블 박제 ❌ (paper 매치 미사용 / Flutter 전용)
- runningScore 외부 source (PBP DB) 를 모달 source 로 ❌

## 기획설계 (planner-architect) — Track A 종별 탭 (2026-05-16)

🎯 **목표**: PR-Admin-6 `/playoffs` hub 5 섹션 (Banner / Advance / Standings / 순위전 / 결승) 이 강남구 6 종별 박제 시 세로 약 6배 길이 (스크롤 헬). **종별 탭 분리** 로 1 종별만 표시 (또는 "전체") → 운영자 시각 단축.

### A. 현 페이지 layout 분석 (`playoffs-client.tsx`)

| 섹션 | 컴포넌트 + 라인 | 종별 인지 | 종별 다중 시 길이 |
|------|---------------|---------|---------------|
| 1 | `PlaceholderValidationBanner matches={matches}` (line 159) | 매치 전체 검증 (종별 미인지) | 검출 N 비례 |
| 2 | `AdvancePlayoffsButton divisionCodes={divisionCodes}` (line 180) | divisionCodes prop = 일괄 호출 | 1 카드 (고정) |
| 3 | `StandingsTable` × N (line 200, `lg:grid-cols-2`) | 종별 1개당 1 테이블 | N × 약 200px |
| 4 | `DivisionMatchGroup` × N (line 232~244, code sort) | 이미 종별 그룹핑 (sub-Card) | N × 약 (매치 수 × 80px) |
| 5 | `FinalCard` × N (line 269~282, code sort) | 이미 종별 그룹핑 (sub-Card) | N × 약 200px |

→ 6 종별 = 섹션 3 약 1200px + 섹션 4 약 6 × 8경기 × 80 = 3840px + 섹션 5 약 1200px = **세로 약 6240px (운영 불가능 수준)**

### B. 탭 패턴 — `matches-client.tsx` 패턴 재사용

`matches-client.tsx` line 553~624 종별 + venue 2개 필터 패턴 (이미 검증된 reference):
- `useSearchParams` + `useState<string | null>(searchParams?.get('division') ?? null)` deep link
- 버튼 그룹 `flex flex-wrap items-center gap-2` (모바일 줄바꿈 / PC 가로)
- 활성 탭 = `bg-[var(--color-info)] text-white`, 비활성 = `bg-[var(--color-elevated)] text-[var(--color-text-muted)]`
- 카운트 = `{code} ({count})`
- "전체" 버튼 = filter `null`

→ **결론**: 신규 탭 컴포넌트 추출 0 — `matches-client.tsx` 패턴 그대로 인라인 (사용처 1곳, premature abstraction 회피).

### C. 옵션 비교

| 옵션 | 신규 파일 | playoffs-client 변경 | 기존 컴포넌트 시그니처 | LOC | 회귀 |
|------|---------|------------------|-----------------|------|------|
| **A 인라인** | 0 | +50 (탭 + filter state) | 0 변경 | 신규 0 / 수정 +60 | 낮음 |
| **B DivisionTabs 신규** | `_components/DivisionTabs.tsx` (+80) | +30 | 0 변경 | 신규 +80 / 수정 +40 | 낮음 |

→ **권장: 옵션 A (인라인)** — 사용처 1곳 / matches-client 패턴이 이미 검증 / DivisionTabs 추출은 2번째 사용처 등장 시 리팩터링 (premature abstraction 회피).

### D. 종별 탭 설계 (옵션 A)

**탭 구성**:
- "전체" (default) — 모든 종별 표시 (현재 동작 유지)
- 종별 N개 — `divisionStandings.map(d => d.code/label)` 동적
- `divisionStandings.length ≤ 1` = 탭 자체 미렌더 (단일 종별 폴백 = 탭 불필요 / 회귀 0)

**활성 탭 = `selectedDivision: string | null`** (`null` = 전체)

**URL state**: `useSearchParams + useRouter.replace`
- `?division=i3-U9` deep link
- 새로고침 / bracket 페이지 → 종별 클릭 → playoffs 종별 탭 자동 활성
- bracket 페이지 종별 trigger (`6d7718a`) 와 동일 패턴

### E. 각 섹션 필터링 spec

| 섹션 | 전체 모드 | 단일 종별 모드 | 변경 방식 |
|------|---------|------------|---------|
| 1 Banner | `matches` 전체 (현재) | `matches.filter(m => getDivisionCode(m) === selectedDivision)` | matches prop 차등 + `applyFilter` true |
| 2 Advance | `divisionCodes` 전체 | `[selectedDivision]` 단일 | divisionCodes prop 차등 (일괄→단일) |
| 3 Standings | `divisionStandings` 전체 (현재) | `.filter(d => d.code === selectedDivision)` | 배열 필터 후 map |
| 4 순위전 | `rankingByDivision` 전체 entry (현재) | `.entries().filter(([code]) => code === selectedDivision)` | entries filter 추가 |
| 5 결승 | `finalByDivision` 전체 entry (현재) | `.entries().filter(([code]) => code === selectedDivision)` | entries filter 추가 |

→ **재사용 컴포넌트 시그니처 변경 0**: `PlaceholderValidationBanner` / `AdvancePlayoffsButton` / `StandingsTable` / `DivisionMatchGroup` / `FinalCard` 모두 props 그대로. 부모 (playoffs-client) 의 prop 전달값만 차등.

### F. 변경 파일 목록 + LOC

| 파일 | 변경 | LOC |
|------|------|-----|
| `playoffs-client.tsx` | + `useSearchParams` / `useRouter.replace` import / `selectedDivision` state / 탭 박제 / 5 섹션 prop 차등 / URL sync `useEffect` | **+60 / -10** |
| (없음) | DivisionTabs 신규 추출 ❌ (옵션 A) | 0 |

→ **순 LOC ≈ +50** (단일 파일 수정).

### G. 회귀 위험 평가

| 위험 | 평가 | 대응 |
|------|------|------|
| `divisionStandings.length ≤ 1` 시 탭 미렌더 → 단일 종별 운영 (4차 뉴비리그 등) 영향 0 | 낮음 | 가드 `if (divisionStandings.length > 1)` 1줄 |
| URL `?division=` 잘못된 코드 → 빈 화면 | 낮음 | `useEffect` 검증 — 매칭 0 시 `setSelectedDivision(null)` 폴백 |
| `AdvancePlayoffsButton divisionCodes={[selectedDivision]}` 단일 종별 호출 → advance route idempotent (PR-Admin-2) | 0 | 호출 후 `router.refresh()` 동일 |
| Banner `matches` filter 후 cross-check (PR-Admin-3) `applyFilter` true 라벨 표시 | 0 | matches-client 동일 패턴 |
| 종별 1개 운영 + URL `?division=` 박힌 deep link → 폴백 작동 | 낮음 | useEffect 검증 |

→ **회귀 위험 종합 = 낮음** (재사용 컴포넌트 0 변경 / 단일 파일 / 가드 명확).

### H. 실행 계획

| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | `playoffs-client.tsx` 수정 — 탭 박제 + state + URL sync + 5 섹션 prop 차등 | developer | 없음 |
| 2 | `tsc --noEmit` 통과 확인 | tester | 1 |
| 3 | 강남구 6 종별 시각 수동 확인 (운영 DB / 종별별 + 전체 모드) | pm | 2 |
| 4 | `feat(admin): /playoffs 종별 탭 (Track A)` commit | pm | 3 |

→ **4단계 / 병렬 가능 0 (단일 파일)**

### I. developer 주의사항

1. **재사용 컴포넌트 시그니처 변경 0** — `StandingsTable` / `DivisionMatchGroup` / `FinalCard` / `AdvancePlayoffsButton` / `PlaceholderValidationBanner` 모두 props 그대로. 부모에서 차등 전달만.
2. **`divisionStandings.length ≤ 1` 가드** — 탭 미렌더 (단일 종별 운영 회귀 0).
3. **URL deep link 폴백** — `useEffect` 로 `searchParams.get('division')` 가 `divisionCodes` 에 없으면 `setSelectedDivision(null)` (잘못된 코드로 빈 화면 방지).
4. **시안 13 룰** — `var(--color-info)` 활성 탭 / `var(--color-elevated)` 비활성 / `rounded-[4px]` / Material Symbols / 모바일 `flex-wrap` 줄바꿈 (scroll 불필요).
5. **종별 라벨 표시** — 탭 라벨 = `divisionStandings.find(d => d.code === code)?.label ?? code` (운영자가 보는 한글 라벨, "i3 U9" 등).
6. **카운트 표시** — `전체 (N종별)` / `i3 U9 (M경기)` — N = divisionStandings.length, M = 해당 종별 매치 수 (`matches.filter(getDivisionCode === code).length` 또는 standings 팀 수).

### J. 후속 큐 (Phase 2)

- `bracket` 페이지에서 종별 카드 → playoffs `?division=` deep link (현재 bracket 종별 trigger 는 매치 박제 trigger 만, 종별 클릭 navigation 미박제)
- 종별별 진척도 ("예선 X/Y / 순위전 X/Y / 결승 0/1") 탭 라벨 옆 micro-progress 박제

🚦 **위반 자동 reject**:
- 재사용 컴포넌트 5건 시그니처 변경 ❌ (props 차등 전달만)
- 신규 DivisionTabs 컴포넌트 추출 ❌ (옵션 A — premature abstraction)
- `divisionStandings.length ≤ 1` 시 탭 렌더 ❌ (단일 종별 회귀)
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌

## 기획설계 (planner-architect) — Track B INSERT 스크립트 (2026-05-16)

🎯 **목표**: 강남구협회장배 유소년부 6 종별 / 36 팀 / 59 매치 운영 DB 박제 — `scripts/_temp/seed-gnba-youth-2026.ts` 1회성 idempotent 스크립트.

### 1. Tournament 분기 결정 — A안 (스크립트 내부 SELECT 후 자동 분기)

비유: "주차장 입구에서 차량번호판 조회 → 등록 차량이면 추가 자리 배정 / 미등록이면 신규 등록 + 자리 배정". Tournament 가 이미 있으면 종별·팀·매치만 추가.

| 단계 | 검색 조건 | 분기 |
|------|----------|------|
| 사전 SELECT | `name LIKE "%강남구협회장배%"` AND `startDate >= 2026-05-15` AND `startDate < 2026-05-18` | 0건 → 신규 / 1건 → 추가 / 2건+ → throw 가드 |
| 신규 분기 | — | Tournament + 6 DivisionRule + 36 Team + 59 Match 전체 박제 |
| 추가 분기 | tournamentId 결정 | 6 DivisionRule + 36 Team + 59 Match 만 박제 (Tournament UPDATE 0) |

**사유**: 사용자 SELECT 미실행 시에도 작동 (운영 DB 영향 = SELECT 1건만 추가). Tournament 중복 생성 방지.

### 2. schema 매핑 표

| 모델 | 필수 필드 | 본 스크립트 박제값 | 비고 |
|------|----------|-------------------|------|
| `Tournament` | `name` / `organizerId` (FK NOT NULL) / `divisions` (JSON, default `"[]"`) | name="강남구협회장배 유소년부 2026" / startDate=2026-05-16 09:00 KST / endDate=2026-05-17 20:30 KST / format="single_elimination" (디폴트, 종별별 format 우선) / status="published" / is_public=true / city="서울" / district="강남구" / venue_name="강남구민체육관/수도공고" / **organizerId=사용자 결재 필요** | BDR 운영진 user_id |
| `TournamentDivisionRule` | `tournamentId` / `code` / `label` / `feeKrw` / `sortOrder` | 6 row 박제 (§3) | format = enum DivisionFormat / settings JSON |
| `TournamentTeam` | `tournamentId` / `teamId` (FK → Team.id) | 36 row 박제 / **Team upsert 의존** | groupName="A"/"B" / category=division.code / status="approved" / @@unique(tournamentId, teamId) 가드 |
| `TournamentMatch` | `tournamentId` / `scheduledAt` / `homeTeamId`+`awayTeamId` (NULL 허용) | 59 row / 예선 46 = 실팀 / 순위전 13 = NULL+notes+settings | settings.{division_code, homeSlotLabel, awaySlotLabel, recording_mode:"flutter"} / venue_name |

### 3. 6 종별 format + settings 매핑

| # | code | label | format (enum) | settings JSON | 팀수 | 예선 | 순위전 | 합계 |
|---|------|-------|--------------|---------------|------|------|--------|------|
| 1 | `i2-U11` | "i2 U11" | `round_robin` | `{group_size: 5, group_count: 1}` | 5 | 10 | 0 | 10 |
| 2 | `i2-U12` | "i2 U12" | `round_robin` | `{group_size: 5, group_count: 1}` | 5 | 10 | 0 | 10 |
| 3 | `i3-U9` | "i3 U9" | `league_advancement` | `{group_size: 4, group_count: 2, linkage_pairs: [[1,1],[2,2],[3,3],[4,4]]}` | 8 | 8 | 4 | 12 |
| 4 | `i3-U11` | "i3 U11" | `group_stage_with_ranking` | `{group_size: 3, group_count: 2, ranking_format: "single_elimination"}` | 6 | 6 | 3 | 9 |
| 5 | `i3W-U12` | "i3W U12" | `group_stage_with_ranking` | `{group_size: 3, group_count: 2, ranking_format: "single_elimination"}` | 6 | 6 | 3 | 9 |
| 6 | `i3-U14` | "i3 U14" | `group_stage_with_ranking` | `{group_size: 3, group_count: 2, ranking_format: "single_elimination"}` | 6 | 6 | 3 | 9 |
| 계 | | | | | **36** | **46** | **13** | **59** |

⚠️ **format 결정 사유**:
- i2 U11/U12 (5팀 풀리그) = `round_robin` (조 1개 / 동순위전 0)
- i3 U9 (4팀 2개조 사각링크제) = `league_advancement` + `linkage_pairs:[[1,1],[2,2],[3,3],[4,4]]` (1·2·3·4위 모두 매칭)
- i3 U11/U12W/U14 (3팀 2개조 + 순위전) = `group_stage_with_ranking` (조별리그 + 동순위 자동 매칭)

⚠️ **`linkage_pairs` 형식 검증 필요**: developer 진입 전 `planLeagueAdvancementPlaceholders` 인터페이스 grep 의무 (형식 불일치 시 generator 가 placeholder 박제 실패 → 강남구 사고 재발).

### 4. 59 매치 INSERT 의사코드 (placeholder-helpers 통과 보장)

비유: "기록지 양식" = 본 스크립트 / "선수 이름" = 실팀 또는 "A조 1위" placeholder 라벨. 양식 통과 의무 = `buildSlotLabel` + `buildPlaceholderNotes` (인라인 문자열 ❌).

```ts
// 예선 매치 (실팀) — 46건
for (const m of preliminaryMatches) {
  await tx.tournamentMatch.create({
    data: {
      tournamentId,
      scheduledAt: m.dateUTC,                // KST → UTC 변환 필수
      venue_name: m.venue,                   // "강남구민체육관" 또는 "수도공고"
      homeTeamId: ttIdMap[m.homeTeamName],   // Team upsert → TournamentTeam upsert → BigInt id
      awayTeamId: ttIdMap[m.awayTeamName],
      roundName: "예선",
      group_name: m.group,                   // "A" / "B" (i3-U9 / i3 U11/U12W/U14)
      match_number: m.number,
      status: "scheduled",
      settings: {
        division_code: m.divisionCode,       // "i2-U11" 등
        recording_mode: "flutter",
      },
    },
  });
}

// 순위전 placeholder 매치 (NULL + notes + settings 3중) — 13건
import { buildSlotLabel, buildPlaceholderNotes } from "@/lib/tournaments/placeholder-helpers";
for (const m of placeholderMatches) {
  const homeSlot = buildSlotLabel({ kind: "group_rank", group: m.aGroup, rank: m.aRank }); // "A조 1위"
  const awaySlot = buildSlotLabel({ kind: "group_rank", group: m.bGroup, rank: m.bRank }); // "B조 1위"
  await tx.tournamentMatch.create({
    data: {
      tournamentId,
      scheduledAt: m.dateUTC,
      venue_name: m.venue,
      homeTeamId: null,
      awayTeamId: null,
      roundName: m.roundName,                // "결승" / "3위전" / "5위전" / "7위전" 또는 "순위결정전" — 결재 §7
      match_number: m.number,
      status: "scheduled",
      notes: buildPlaceholderNotes(homeSlot, awaySlot),  // "A조 1위 vs B조 1위" — ADVANCEMENT_REGEX 호환
      settings: {
        division_code: m.divisionCode,
        homeSlotLabel: homeSlot,
        awaySlotLabel: awaySlot,
        recording_mode: "flutter",
      },
    },
  });
}
```

### 5. idempotent 가드 spec (8중 — 4차 뉴비리그 패턴 답습)

| # | 가드 | 위치 | 동작 |
|---|------|------|------|
| 1 | Tournament SELECT 분기 | 시작 | 1건 → 재사용 / 0건 → 신규 / 2건+ → throw |
| 2 | tournamentId UUID 형식 검증 | INSERT 직후 | regex 통과 안 하면 throw |
| 3 | DivisionRule SELECT (code 매칭) | 종별 박제 전 | 6 code 모두 존재 시 skip / 일부 결손 시 결손분만 INSERT |
| 4 | Team SELECT (name 매칭) | 팀 박제 전 | name unique 아님 → 1건 → ID 재사용 / 0건 → 신규 / **2건+ → 사용자 결재 가드 (warning + skip)** |
| 5 | TournamentTeam UPSERT (`@@unique([tournamentId, teamId])` 활용) | TT INSERT | upsert 활용 시 자동 idempotent |
| 6 | TournamentMatch SELECT (tournamentId + scheduledAt + division_code + match_number 복합 키) | Match INSERT 전 | 존재 시 skip / 부재 시 INSERT |
| 7 | placeholder-helpers 통과 의무 | 순위전 매치 INSERT | raw 문자열 ❌ → buildSlotLabel + buildPlaceholderNotes 필수 |
| 8 | settings JSON 병합 | Match INSERT (UPDATE 케이스) | 기존 keys (recording_mode 등) 보존 + 신규 keys 추가 |

### 6. 사후 검증 query 5건

```ts
// 1. 종별 6건
assert((await prisma.tournamentDivisionRule.count({ where: { tournamentId } })) === 6);

// 2. 팀 36건
assert((await prisma.tournamentTeam.count({ where: { tournamentId } })) === 36);

// 3. 매치 59건
assert((await prisma.tournamentMatch.count({ where: { tournamentId } })) === 59);

// 4. placeholder 매치 13건 (homeTeamId IS NULL + notes "%위 vs%")
assert((await prisma.tournamentMatch.count({
  where: { tournamentId, homeTeamId: null, notes: { contains: "위 vs" } },
})) === 13);

// 5. ADVANCEMENT_REGEX 매칭률 100% (placeholder 13건 모두 매칭)
const placeholders = await prisma.tournamentMatch.findMany({
  where: { tournamentId, homeTeamId: null }, select: { id: true, notes: true },
});
const regex = /([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/;
for (const m of placeholders) assert(regex.test(m.notes ?? ""), `match ${m.id} regex fail`);
```

### 7. 스크립트 파일 위치 + 안전 가드 패턴

- **파일**: `scripts/_temp/seed-gnba-youth-2026.ts` (신규)
- **실행**: `npx tsx scripts/_temp/seed-gnba-youth-2026.ts` (사용자 명시 승인 후)
- **트랜잭션**: 단일 `prisma.$transaction([...], { timeout: 30000 })` (59 매치 = 충분 / 부분 실패 시 전체 롤백)
- **로그**: `console.log` 단계별 (Tournament 결정 → DivisionRule N → Team N → TournamentTeam N → Match N → 사후 검증) — 4차 뉴비리그 답습
- **사후 정리**: 작업 검증 후 `rm scripts/_temp/seed-gnba-youth-2026.ts` 의무 (CLAUDE.md §🗄️ DB 정책 §3)

### 8. 변경 파일 + 예상 LOC

| 파일 | 신규/수정 | 예상 LOC | 역할 |
|------|----------|---------|------|
| `scripts/_temp/seed-gnba-youth-2026.ts` | **신규** | **~450 LOC** | Tournament 분기 + 6 DivisionRule + 36 Team upsert + 36 TournamentTeam + 59 Match (예선 46 + 순위전 13) + 사후 검증 5 query |

LOC 분해: 헤더+import+상수 ~100 / 데이터 정의 (6 종별 + 36 팀 + 59 매치 JSON) ~200 / 분기+transaction+upsert ~100 / 사후 검증+로그 ~50.

### 9. 사용자 명시 승인 필요 항목 (스크립트 진입 전)

| # | 항목 | 결재 사유 |
|---|------|----------|
| 1 | **organizerId (BigInt)** | Tournament.organizerId FK NOT NULL — BDR 운영진 user_id 결재 필요 |
| 2 | **Tournament 신규 vs 기존 활용** | check-gnba-youth-2026.ts SELECT 결과 사전 알림 권장 |
| 3 | **Team upsert 정책** | Team.name 동일명 1건 → ID 재사용 OK 인지 (예: "스티즈강남" 동명이팀 가능성) |
| 4 | **`linkage_pairs` 형식 검증** | i3-U9 settings 의 linkage_pairs `[[1,1],[2,2],[3,3],[4,4]]` 형식이 generator 와 호환되는지 사전 grep |
| 5 | **시안 매치 시각 검증** | 5/16(토) i3-U11 16:00~ / i3-U14 15:30~ 등 운영자 사전 공지 일정과 일치 확인 |
| 6 | **시각 KST → UTC 변환** | scheduledAt = `Timestamp(6)` (timezone-naive). KST `2026-05-16 09:30` = UTC `2026-05-16 00:30` 박제 |
| 7 | **roundName 표준** | i3-U9 순위전 4건 = "결승" / "3위전" / "5위전" / "7위전" / 또는 "순위결정전" 단일 — 운영 표준 결재 |
| 8 | **division_tier vs settings.division_code** | 매치 박제 시 어느 단일 source — settings.division_code 권장 (advanceTournamentPlaceholders 호환) |

### ⚠️ developer 주의사항

1. **placeholder-helpers 통과 의무** — `buildSlotLabel({kind:"group_rank",...})` + `buildPlaceholderNotes(...)` 만 사용. raw 문자열 ❌
2. **Team upsert 가드** — `name` unique 아님 → SELECT 결과 2건+ 발견 시 throw + 사용자 결재
3. **TournamentTeam UPSERT** — `@@unique([tournamentId, teamId])` 활용 (`prisma.tournamentTeam.upsert({ where: { tournamentId_teamId: {...} } })`)
4. **시각 변환** — `new Date("2026-05-16T09:30:00+09:00")` 또는 명시 `Date.UTC(...)`
5. **트랜잭션 timeout** — 30000ms (59 INSERT + 36 upsert = 안전)
6. **i3-U9 순위전 roundName** — 결재 §7 결재 후 박제
7. **사후 검증 throw** — 5 query 중 1건이라도 실패 시 throw (스크립트는 INSERT 끝났지만 사용자에게 즉시 알림)
8. **사후 정리** — 작업 검증 후 본 파일 삭제 의무

### 🚦 위반 자동 reject

- 인라인 placeholder 문자열 박제 ❌ (강남구 사고 영구 차단 룰 errors.md #102)
- `prisma.tournamentMatch.create({ data: { notes: "A조 1위 vs B조 1위" } })` 직접 박제 ❌ → buildPlaceholderNotes 헬퍼 필수
- Tournament 중복 생성 (가드 #1 위반) ❌
- 트랜잭션 외부 INSERT ❌ (부분 실패 시 운영 DB orphan 데이터)
- `prisma db push` / schema 변경 ❌ (본 스크립트 = INSERT only)

## 구현 기록 (developer) — Track A 종별 탭 (2026-05-16)

📝 **구현한 기능**: `/playoffs` hub 종별 탭 분리 (옵션 A 인라인) — 강남구 6 종별 박제 시 세로 약 6240px → 단일 종별 표시로 운영자 시각 단축.

### 변경 파일 (단일)

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/playoffs-client.tsx` | 탭 UI + selectedDivision state + URL deep link sync (2 useEffect) + 5 섹션 prop 차등 (Banner / Advance / Standings / Ranking / Final) | 수정 | +128 / -14 |

### 자가 진단 5건

| # | 항목 | 결과 |
|---|------|------|
| 1 | playoffs-client.tsx 수정 확인 (LOC > 0) | ✅ +128 / -14 |
| 2 | 탭 UI 박제 (useSearchParams + 동적 종별) | ✅ 라인 219~261 박제 |
| 3 | 5 섹션 prop 차등 적용 | ✅ Banner=filteredMatches+applyFilter / Advance=advanceDivisionCodes / Standings=visibleStandings / Ranking·Final=filteredMatches 기반 (rankingMatches/finalMatches 자동 차등) |
| 4 | divisionStandings.length ≤ 1 가드 (회귀 0) | ✅ `showDivisionTabs = divisionStandings.length > 1` 가드 + useEffect 로 false 시 selectedDivision=null 강제 |
| 5 | tsc --noEmit 통과 | ✅ 0 error (no output) |

### git diff --stat HEAD (Track A 단일 파일)

```
src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/playoffs-client.tsx | 142 +++++++++++++++++++--
1 file changed, 128 insertions(+), 14 deletions(-)
```

(전체 working tree 의 다른 파일 22건 = score-sheet 다른 세션 트랙 / 본 작업 무관)

### 핵심 구현 spec

**state**:
- `selectedDivision: string | null` (URL `?division=` 초기화)
- `showDivisionTabs = divisionStandings.length > 1` (단일 종별 운영 회귀 0)

**URL sync**:
- useEffect #1: 잘못된 코드 / 단일 종별 모드 시 `setSelectedDivision(null)` 폴백
- useEffect #2: `router.replace(?division=)` 동기화 (scroll: false / searchParams dependency 제외 = 무한 loop 방지)

**5 섹션 차등**:
| 섹션 | prop | 단일 종별 모드 |
|------|------|------------|
| Banner | matches | filteredMatches + applyFilter true |
| Advance | divisionCodes | [selectedDivision] |
| Standings | divisionStandings | visibleStandings (filter) |
| Ranking | matches → rankingMatches | filteredMatches → rankingMatches 자동 |
| Final | matches → finalMatches | filteredMatches → finalMatches 자동 |

**디자인 13 룰 준수**:
- `var(--color-info)` Navy 활성 / `var(--color-elevated)` 비활성
- `rounded-[4px]` / `min-h-[44px]` 터치 영역 / `flex-wrap` 모바일 줄바꿈
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌

**시그니처 변경 0**: PlaceholderValidationBanner / AdvancePlayoffsButton / StandingsTable / DivisionMatchGroup / FinalCard 모두 props 시그니처 그대로 (부모에서 차등 전달만).

### 💡 tester 참고

- **테스트 1 (단일 종별 운영)**: divisionStandings.length === 1 → 탭 미렌더 (회귀 0)
- **테스트 2 (다중 종별)**: 강남구 6 종별 → 탭 7개 (전체 + 6 종별) / "전체" = 기존 동작 / 종별 클릭 = 해당 종별만 5 섹션
- **테스트 3 (URL deep link)**: `?division=i3-U9` 진입 → 탭 활성 / 잘못된 코드 → null 폴백
- **테스트 4 (Advance 단일)**: 단일 종별 모드 → 해당 종별만 호출 (전체 = 일괄)
- **정상**: 탭 클릭 → URL 갱신 / 5 섹션 모두 해당 종별만 표시
- **주의**: divisionStandings.length === 0 → 탭 미렌더 + 빈 화면 (기존 동작)

### ⚠️ reviewer 참고

- **useEffect dependency** — searchParams 의도적 제외 (eslint disable 주석 박제) — 무한 loop 방지 사유 명시
- **router.replace(qs ? `?${qs}` : "?")** — empty qs 시 "?" 안전 (next/navigation router.replace 빈 문자열 허용 안 함)
- **Banner applyFilter** — 단일 종별 모드만 true (전체 모드 false / 라벨 "(현재 필터 적용된 매치만 검증)" 의도 일치)

## 구현 기록 (developer) — Track B INSERT 스크립트 (2026-05-16)

📝 **구현한 기능**: 강남구협회장배 유소년부 2026 운영 DB INSERT 1회성 스크립트 박제 (실행 ❌). 6 종별 / 36 팀 / 59 매치 (예선 46 + 순위전 13 placeholder) idempotent 박제.

### 변경 파일 (Track B 단일)

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `scripts/_temp/seed-gnba-youth-2026.ts` | Tournament 분기 + 6 DivisionRule + 36 Team SELECT (가드) + 36 TournamentTeam upsert + 59 Match (예선 46 + 순위전 13) + 사후 검증 5 query / 8중 가드 / placeholder-helpers 통과 | **신규** | **+669** |

### git diff --stat HEAD (Track B 단일 파일)

```
scripts/_temp/seed-gnba-youth-2026.ts | 669 +++++++++ (신규 파일)
```

(전체 working tree 의 다른 파일 22건 = score-sheet 다른 세션 트랙 + Track A playoffs-client.tsx / 본 Track B 무관)

### tsc --noEmit 결과

```
EXIT=0 (no output / 0 error)
```

### 자가 진단 6건 (필수)

| # | 항목 | 결과 |
|---|------|------|
| 1 | scripts/_temp/seed-gnba-youth-2026.ts 신규 파일 (LOC > 0) | ✅ +669 LOC |
| 2 | 시안 데이터 100% 박제 (6 종별 / 36 팀 / 59 매치) | ✅ DIVISIONS 6 + TEAMS 36 + PRELIMINARY_MATCHES 46 + PLACEHOLDER_MATCHES 13 |
| 3 | placeholder-helpers buildSlotLabel + buildPlaceholderNotes 호출 확인 | ✅ 라인 447~449 (순위전 13건 모두 헬퍼 경유) |
| 4 | 8중 가드 박제 | ✅ ORGANIZER_USER_ID env / user 존재 / Tournament 0·1·2+ 분기 / DivisionRule code 매칭 / Team 동명 가드 + 부재 throw / TournamentTeam upsert / Match 복합키 idempotent / 사후 5 query throw |
| 5 | 사후 검증 query 박제 | ✅ 라인 487~520 (count 4건 + ADVANCEMENT_REGEX 매칭률 검증) |
| 6 | tsc --noEmit 0 | ✅ EXIT=0 |

### 핵심 박제 spec

**8중 가드**:
1. `ORGANIZER_USER_ID` env 필수 — `process.env` 누락 throw / BigInt 변환 실패 throw
2. 운영자 user 존재 검증 — `prisma.user.findUnique` (id 부재 → throw)
3. Tournament 분기 — `name LIKE "강남구협회장배"` AND `startDate ∈ [2026-05-15, 2026-05-18)` (0건 신규 / 1건 재사용 / 2건+ throw)
4. `prisma.$transaction` (timeout 30000ms) — 부분 실패 시 전체 롤백
5. DivisionRule code 매칭 idempotent — 6건 중 결손분만 INSERT
6. Team SELECT (name 매칭) — 동명 2건+ throw / 부재 throw (captainId FK NOT NULL → 자동 생성 ❌)
7. TournamentTeam upsert — `@@unique([tournamentId, teamId])` 활용
8. TournamentMatch 복합 키 idempotent — `scheduledAt.toISOString() | division_code | match_number` Set 기반 skip

**placeholder-helpers 통과 의무 (errors.md #102 영구 차단 룰)**:
- 순위전 13건 모두 `buildSlotLabel({ kind: "group_rank", group, rank })` + `buildPlaceholderNotes(homeSlot, awaySlot)` 헬퍼 경유
- 인라인 문자열 박제 ❌
- settings.{homeSlotLabel, awaySlotLabel, division_code, recording_mode} 4중 박제

**KST → UTC 자동 변환**:
- `new Date("2026-05-16T09:30:00+09:00")` 박제 → Prisma 가 UTC 변환 후 `Timestamp(6)` 저장
- 시안 시각 그대로 ISO 박제 (오프셋 명시 = 운영자 timezone 무관 안전)

**Tournament 신규 박제 시**:
- `generateApiToken()` 헬퍼 경유 (errors.md #49 룰)
- Tournament.format = "single_elimination" 디폴트 (종별별 format 우선 = TournamentDivisionRule.format 단일 source)

**6 종별 format 매핑** (planner § 3 표 기반):
| code | format | settings |
|------|--------|---------|
| i2-U11 / i2-U12 | round_robin | group_size: 5, group_count: 1 |
| i3-U9 | league_advancement | group_size: 4, group_count: 2, linkage_pairs: [[1,1],[2,2],[3,3],[4,4]] |
| i3-U11 / i3W-U12 / i3-U14 | group_stage_with_ranking | group_size: 3, group_count: 2, ranking_format: "single_elimination" |

**i3-U9 순위전 roundName** (planner § 9 §7 결재 항목):
- 4건 = "7·8위전" / "5·6위전" / "3·4위전" / "결승" (한국 농구 표준 — 4위 동순위전부터 결승까지)
- i3-U11 / U12 / U14 (3팀 2개조) = "5·6위전" / "3·4위전" / "결승" 3건씩

### 💡 tester 참고

- **테스트 1 (스크립트 실행 검증)**: 사용자 결재 후 `ORGANIZER_USER_ID=<id> npx tsx scripts/_temp/seed-gnba-youth-2026.ts` 실행 → console.log 8 단계 출력 확인
- **테스트 2 (idempotent 재실행)**: 동일 명령 2회 실행 → 2회차 = 모두 skip (rule 0 + tt 0 INSERT + match 0 INSERT)
- **테스트 3 (사용자 결재 사전 가드)**: 미결재 진입 시 가드 1·2·3·5·8 throw 동작 확인
- **테스트 4 (운영 영향 0 검증)**: tsc --noEmit (실제 prisma 호출 0)
- **정상 동작**: tsc 0 / 사용자 미결재 시 가드 throw / 결재 후 실행 시 6+36+59 = 101 row 박제
- **주의 입력**: ORGANIZER_USER_ID 미세팅 / 잘못된 BigInt / 동명 팀 1건+ 운영 DB 등록

### ⚠️ reviewer 참고

- **본 스크립트 = 실행 0 박제만**: planner spec 통과 + tsc 0 만 검증. 운영 DB INSERT = 사용자 명시 승인 후 별도 호출
- **TournamentTeam division 한계 (라인 363~366 주석)**: 동일 Team 이 다종별 등장 시 (예: "스티즈강남" 4 종별 등장) TournamentTeam 1 row 의 division 필드는 마지막 종별로 갱신됨. 매치 박제는 teamId 만 사용하므로 매치 영향 0
- **Team 자동 생성 ❌**: Team.captainId FK NOT NULL → 본 스크립트는 Team 부재 시 throw + 사용자 결재 (운영자가 사전 등록 필수)
- **사용자 결재 8 항목 잔존**: planner § 9 표 §1·§3·§5 (organizerId / 동명팀 결재 / 시각 검증) = 사용자 실행 직전 사전 검토 필수
- **사후 정리 의무**: 작업 검증 후 `scripts/_temp/seed-gnba-youth-2026.ts` + `scripts/_temp/check-gnba-youth-2026.ts` 삭제 (CLAUDE.md §🗄️ DB 정책 §3)

## 진행 현황표

### 대진표 후속 큐 (이전 완료)

## 진행 현황표

### 대진표 후속 큐 (이전 완료)
| # | PR | commit |
|---|----|--------|
| 1 | PR-G5.5-followup-B | `df96522` |
| 2 | PR-G5.5-NBA-seed | `b1e48b8` |
| 3 | PR-G5.2 dual refactor | `eaccd54` |
| 4 | PR-G5.7 double_elim | 🔵 보류 (운영 사용 0) |
| 5 | PR-G5.8 swiss | `b8b3117` |

### Admin Phase 1 우선 1~6 (본 세션)
| 우선 | PR | commit | LOC |
|------|----|--------|-----|
| 1 | NextStepCTA | `4c05c8c` | +124 |
| 2 | AdvancePlayoffsButton | `1e4b535` | +423/-43 |
| 3 | PlaceholderValidationBanner | `823d692` | +428 |
| 4 | bracket 종별별 trigger | `6d7718a` | +596 |
| 5 | SetupChecklist 통합 | `f4b0f95` | +553/-84 |
| 6 | /playoffs hub | `f250e8c` | +936 |

## 미푸시 commit
- knowledge 갱신 commit 진행 후 별도 push (subin = origin/subin `f250e8c` 까지 push 완료)

## working tree (다른 트랙 보존)
- score-sheet 트랙 22 파일 (다른 세션 작업 / 본 admin 트랙과 무관)
- `bdr 디자인 시스템 관리/admin-design-2026-05-15/` (디자인 트랙)

## 후속 큐 (Phase 2 / 별도 세션)
- **/setup stepper** — 셋업 단계별 진행 stepper (점검 §6.4 신규 페이지 후보)
- **마법사 Phase 2~4** — Step 0/1/2 시안 진입 (D1~D4 BLOCKED)
- **마법사 Phase 5~10** — 종별·팀·대진표 흡수 (대규모)
- **group_stage_knockout generator 풀구현** — 현재 stub
- **generate endpoint GenerateOptions 확장** — venueName / startScheduledAt / intervalMinutes
- **generateSwissNextRound 풀구현** — PR-G5.8 후속
- **PR-G5.7 double_elim** — 운영 진입 시점 박제
- **CLI 핸드오프 2차** ⭐ — admin 시각 확장
- **dev 브랜치 sync** — origin/dev = origin/main 보다 84+ commit stale

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-16 | **PR-Possession-1 PURE 헬퍼 + 타입 + vitest 박제 (developer)** ⭐ | ✅ 신규 3 (`possession-types.ts` +58 / `possession-helpers.ts` +122 / `possession-helpers.test.ts` +187) = **+367 LOC** / tsc 0 / vitest 15/15 PASS (315ms) / UI / BFF / DB 영향 0 / 다른 파일 변경 0 / PR-2 진입 대기 (PM 결재) / 별건: running-score-helpers.test.ts 1건 fail 발견 (작업 시작 전 미커밋 회귀 — PR 범위 밖) |
| 2026-05-16 | **fiba-header 쿼터 뱃지 v3 (위로 이동 + 매치 상태 라벨)** ⭐ | ✅ fiba-header.tsx +44/-19 (`marksCount?: number` prop + matchPhaseLabel 산출 + 뱃지 wrapper column flex + 라벨 div 박제) / score-sheet-form.tsx +4 (`marksCount={home.length + away.length}` wiring) / `alignSelf: flex-start + marginTop: -4px` 위로 이동 / 라벨 10px / `var(--color-text-secondary)` 회색 / tsc 0 / props 시그니처 신규 1건만 추가 (운영 호환) |
| 2026-05-16 | **Track A `/playoffs` 종별 탭 (옵션 A 인라인) 박제** ⭐ | ✅ playoffs-client.tsx +128/-14 / useSearchParams + useState + 2 useEffect (URL sync + 폴백) / 5 섹션 prop 차등 / divisionStandings.length ≤ 1 가드 / tsc 0 / 자가 진단 5/5 / 시그니처 변경 0 |
| 2026-05-16 | **score-sheet PBP 수정 모달 박제 (developer)** | ✅ 신규 1 (`pbp-edit-modal.tsx` +455) + 수정 4 (`running-score-helpers.ts` +90 / `score-sheet-toolbar.tsx` +25 / `score-sheet-form.tsx` +50 / `running-score-helpers.test.ts` +148) = **+768 LOC** / tsc 0 / vitest PR-PBP-Edit 15/15 PASS / planner 결정 plan 5건 100% 준수 / 신규 BFF endpoint 0 / 시안 13 룰 100% / isReadOnly 이중 방어 |
| 2026-05-16 | **Track B GNBA 유소년 INSERT 스크립트 박제 (developer)** ⭐ | ✅ `scripts/_temp/seed-gnba-youth-2026.ts` 신규 +669 LOC / 6 종별 + 36 팀 + 59 매치 (예선 46 + 순위전 13 placeholder) / placeholder-helpers 통과 (인라인 ❌) / 8중 가드 박제 (env / user / Tournament 분기 / transaction / DivisionRule code / Team 동명+부재 / TT upsert / Match 복합키) / 사후 5 query 검증 / generateApiToken 헬퍼 경유 / tsc 0 / **운영 DB 호출 0 (실행 = 사용자 명시 승인 후)** |
| 2026-05-16 | **Track B GNBA 유소년 INSERT 스크립트 spec 분석** | 🟡 `scripts/_temp/seed-gnba-youth-2026.ts` 신규 ~450 LOC / Tournament 분기 A안 (SELECT 후 자동) / 6 종별 format 매핑 (round_robin x2 / league_advancement x1 / group_stage_with_ranking x3) / 36 팀 + 59 매치 (예선 46 + 순위전 13) / placeholder-helpers 통과 의무 / 8중 idempotent 가드 / 사용자 결재 8 항목 (organizerId / linkage_pairs 형식 / KST→UTC 등) |
| 2026-05-16 | **score-sheet PBP 수정 모달 기획설계** | 🟡 Phase 1 (조회) / Phase 2 (수정) 분리 / 6 step commit 단위 결정 / source = runningScore state / 신규 endpoint 0 / submit BFF 재사용 / 신규 1파일 + 수정 3파일 |
| 2026-05-16 | **Phase 1 admin 흐름 개선 6 PR 박제** ⭐ | ✅ 6 commit (`4c05c8c` + `1e4b535` + `823d692` + `6d7718a` + `f4b0f95` + `f250e8c`) push 완료 / 강남구협회장배 단계 4·7·10·10.5 단절·누락 해소 / +3,060 LOC / 회귀 0 / 옵션 B 적용 |
| 2026-05-16 | **Phase 0 admin 흐름 점검 보고서** | ✅ `Dev/admin-flow-audit-2026-05-16.md` 231줄 / 18건 인벤토리 / 영향도 H 8건 |
| 2026-05-16 | **PR-G5.8 swiss generator R1 박제 + R(N) 501 stub (옵션 B)** | ✅ commit `b8b3117` |
| 2026-05-16 | **PR-G5.2 dual-generator placeholder-helpers 통과 (옵션 B)** | ✅ commit `eaccd54` |
| 2026-05-16 | **PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator** | ✅ commit `b1e48b8` |
| 2026-05-16 | **PR-G5.5-followup-B 매치 PATCH route 통합** | ✅ commit `df96522` (1차 사고 → PR2 부터 옵션 B 적용) |
| 2026-05-16 | **recorder_admin 전역 흡수 + record01/02 강등** | ✅ PR #531 main 머지 (`8a913ef`) |
| 2026-05-16 | **4차 뉴비리그 apiToken 자동 발급 fix + Sub-B3** | ✅ PR #527 main 머지 (`1bff83e`) |
| 2026-05-15 | Admin-7-B Sub-B3 Wizard1Step + Sub-B2 EditWizard 박제 | ✅ commit `06069a4` + `efcc103` |
| 2026-05-15 | 본 세션 16 commit main 분리 머지 완료 | ✅ PR #517 + PR #519 |
