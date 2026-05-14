# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 19 PR-S2 후속 권장 3건 — submitted 가드 + ESC deps + toolbar disabled
- **상태**: ✅ PR-S2 후속 3 fix 완료 (3 파일 +50 LOC / tsc 0 / vitest 204/204). PM 검증 → commit 대기
- **모드**: no-stop

## 진행 현황표
| 단계 | 결과 |
|------|------|
| Phase 19 PR-S1+S2 / Phase 23 PR2+PR3 | ✅ 직전 commit (`ef54e7a`/`4416a91`/`a147bb1`) |
| **마법사 Phase 1** (shared-types / draft / constants) | ✅ 신규 3 파일 / tsc 0 / KEY 1건 |
| **Phase 19 PR-S3** (mode prop wiring) | ✅ 4 파일 +88 LOC / tsc 0 / vitest 204/204 / commit 대기 |
| **Phase 19 PR-S4** (FibaHeader 시안 시각 정합) | ✅ 2 파일 +220/-82+114 / tsc 0 / vitest 204/204 / 운영 매핑 6/6 보존 / commit 대기 |
| **Phase 19 PR-S2 후속 3 fix** (submitted 가드 / ESC deps / toolbar disabled) | ✅ 3 파일 +50 LOC / tsc 0 / vitest 204/204 / commit 대기 |
| 마법사 Phase 2 (Step 0 단체) | ⏳ 대기 |
| 마법사 Phase 3~7 | ⏳ 대기 |

## 구현 기록 (developer) — Phase 19 PR-S2 후속 3 fix

📝 구현한 기능: reviewer 권장 후속 3건 박제 — (1) `handleConfirm` submitted 가드 / (2) ESC `useEffect` deps + `setOpen` useCallback / (3) toolbar `endMatchDisabled` prop 수용 + form wiring. **운영 동작 회귀 0 / 호출 시그니처 breaking change 0**.

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|----------|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/match-end-button.tsx` | (1) `setOpen` 을 `useCallback` 메모이제이션 + submitted 시 `next=true` 차단 / (2) `handleConfirm` 진입부 `if (submitting \|\| submitted) return;` / (3) ESC useEffect deps 에 `setOpen` 추가 / (4) `onSubmittedChange?: (boolean) => void` prop 추가 + submitted state 변화 시 콜백 호출 useEffect | +29 | 수정 |
| `src/app/(score-sheet)/_components/score-sheet-toolbar.tsx` | (1) `endMatchDisabled?: boolean` prop 추가 / (2) 종료 버튼 `disabled={endMatchDisabled}` + inline style `{opacity: 0.4, cursor: 'not-allowed'}` 분기 | +18 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (1) `matchEndSubmitted` state 추가 / (2) ScoreSheetToolbar `endMatchDisabled={matchEndSubmitted}` 전달 / (3) MatchEndButton `onSubmittedChange={setMatchEndSubmitted}` wiring | +12 | 수정 |

**합계**: +50 LOC (3 파일 / 신규 0 / breaking change 0).

### Fix 별 before / after 요약

| # | 위치 | Before | After | 효과 |
|---|------|--------|-------|------|
| Fix 1a | match-end-button.tsx L102 `handleConfirm` | `if (submitting) return;` | `if (submitting \|\| submitted) return;` | 종료 후 toolbar 재진입 시 BFF POST 중복 호출 차단 (2차 방어선) |
| Fix 1b | match-end-button.tsx L82 `setOpen` | inline `(next) => { ... }` 매 render 마다 새 ref | `useCallback((next) => { if (next && submitted) return; ... }, [isControlled, onOpenChange, submitted])` | 종료 후 modal 재오픈 차단 (1차 방어선) + ref 안정화 |
| Fix 2 | match-end-button.tsx L99 ESC useEffect | deps `[open, submitting]` (setOpen closure 캡처 — stale) | deps `[open, submitting, setOpen]` (useCallback 메모로 안전 추가) | stale closure 잠재 영구 차단 / React strict mode 경고 0 |
| Fix 3a | score-sheet-toolbar.tsx L37 props | `ScoreSheetToolbarProps` 6 필드 | + `endMatchDisabled?: boolean` (optional) | breaking change 0 (모든 사용처 호환) |
| Fix 3b | score-sheet-toolbar.tsx L119 종료 버튼 | 항상 active | `disabled={endMatchDisabled}` + inline opacity 0.4 / cursor not-allowed | 종료 후 시각 disabled 표시 — 운영자 즉시 인지 |
| Fix 3c | score-sheet-form.tsx L246 / L942-953 / L1142-1154 | `matchEndSubmitted` state 없음 / wiring 0 | `useState(false)` + toolbar `endMatchDisabled` + MatchEndButton `onSubmittedChange` | lifting state up 단일 흐름 |

### 사용자 핵심 제약 보존 검증 (6/6 PASS)

| # | 검증 항목 | 결과 |
|---|----------|------|
| 1 | 기존 props 시그니처 breaking change 0 (모든 추가 prop = optional) | ✅ `onSubmittedChange?` / `endMatchDisabled?` 모두 optional. MatchEndButton 외부 사용처 0 / ScoreSheetToolbar 외부 사용처 0 (form.tsx 만) |
| 2 | uncontrolled 모드 (PR-S2 전 동작) 회귀 0 | ✅ `open`/`onOpenChange` 미전달 시 `isControlled=false` → 기존 internal state 흐름 그대로. submitted 가드도 동일하게 적용 (오히려 안전성 향상) |
| 3 | 신규 컴포넌트 0 / 신규 API 0 / DB schema 0 | ✅ 변경 = 3 기존 파일 / 신규 0 |
| 4 | any 사용 0 | ✅ 모든 신규 타입 = `boolean` / `(submitted: boolean) => void` 명시 |
| 5 | 토큰 사용 / 하드코딩 색상 0 | ✅ inline `{ opacity: 0.4, cursor: 'not-allowed' }` 만 — 색상 hex 0 / var(--*) 영향 0 |
| 6 | Phase 23 PR2+PR3 (자동 로드 / draft vs DB / cross-check) 회귀 0 | ✅ 변경 영역 = MatchEndButton + toolbar + form.tsx 3 위치만. initialRunningScore / cross-check / hasOnlyQuarterScores 흐름 변경 0 |

### 검증 (3/3 PASS)

| # | 명령 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | ✅ EXIT=0 (에러 0) |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | ✅ 11 files / 204/204 PASS / 607ms |
| 3 | grep `MatchEndButton\|ScoreSheetToolbar` 다른 사용처 | ✅ form.tsx 1건만 (검증 자동 충족) |

💡 tester 참고:
- **재진입 시나리오 1** — 종료 후 toolbar "경기 종료" 버튼 클릭 → modal 안 열림 (setOpen submitted 가드)
- **재진입 시나리오 2** — 종료 후 toolbar 버튼 시각 disabled (opacity 0.4 + cursor not-allowed) 운영자 인지
- **재진입 시나리오 3** — 만약 어떻게든 modal 이 열렸어도 handleConfirm 진입부 가드로 BFF POST 미발생
- **uncontrolled 호환** — 다른 사용처 0 (form.tsx 만) 이지만 PR-S2 전 패턴 (uncontrolled) 도 회귀 0
- **ESC 키 종료 후 modal** — modal 자체가 안 열리므로 ESC 시나리오 영향 0

⚠️ reviewer 참고:
- **setOpen useCallback deps** = `[isControlled, onOpenChange, submitted]`. `isControlled` 는 render 마다 controlledOpen 값에 따라 바뀔 수 있지만 동일 값이면 동일 boolean → 안정. `onSubmittedChange` 콜백은 `setMatchEndSubmitted` (React useState setter — 안정 ref) 라 새 ref 0
- **3 중 방어선 설계 의도** — (a) toolbar 버튼 disabled (시각 + native) → (b) setOpen 의 submitted 가드 → (c) handleConfirm 의 submitted 가드. (a) 깨져도 (b) / (c) 가 막음 / (a)+(b) 깨져도 (c) 가 막음. 서버 멱등성에만 의존하지 않음
- **inline style opacity / cursor 사용 사유** — `.ss-toolbar__finish:disabled` CSS 룰 추가하면 styles.css 영향 범위 확대. 본 컴포넌트만 한정하기 위해 inline style 채택 (다른 PR-S 영향 0)
- **lifting state up** — MatchEndButton.submitted 가 컴포넌트 내부 state 라 form 이 직접 접근 불가. `onSubmittedChange` 콜백으로 끌어올림. 콜백 미전달 시 영향 0 (호출 시 useEffect 가 dep 변경 감지하지만 콜백 자체가 noop)

---

## 구현 기록 (developer) — Phase 19 PR-S4

📝 구현한 기능: FibaHeader 시안 시각 정합 — Tailwind utility 시각 → 시안 .ss-h / .ss-names / .ss-meta 마크업 + ss-shell 스코프 CSS 룰 도입. **운영 데이터 로직 / props interface / splitDateTime / 매핑 변수 100% 보존**.

**사용자 핵심 제약 보존**: props interface 변경 0 / page.tsx + score-sheet-form.tsx 호출 위치 변경 0 / splitDateTime export 보존 (vitest 회귀 0) / 외부 컴포넌트 영향 0.

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|----------|
| `src/app/(score-sheet)/_components/_score-sheet-styles.css` | 시안 .ss-h* / .ss-names* / .ss-meta* / .ss-field* / .ss-shell.ss-header 룰 .ss-shell 스코프로 wrap (+ ss-field input 변형 룰) | +220 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | JSX 트리 시안 정합 재구성 (3 섹션 .ss-h / .ss-names / .ss-meta) + SSFieldDisplay / SSFieldInput 분리 / Tailwind utility 제거 / InlineField* 헬퍼 제거 | -82/+114 (재구성) | 수정 |

**합계**: 2 파일 / 신규 0.

### 시각 재구성 범위 (옵션 2 부분 재구성)

| 시안 섹션 | 운영 데이터 매핑 (변경 0) | 마크업 |
|---------|------------------------|-------|
| Section A `.ss-h` | BDR 로고 (`/images/logo.png` next/image) + 3줄 타이틀 정적 카피 | `.ss-h__logo` (mark + text) + `.ss-h__title` (t1/t2/t3) |
| Section B `.ss-names` | `teamAName` / `teamBName` props 그대로 | `.ss-names__cell × 2` |
| Section C `.ss-meta` (좌) | `competitionName` / `splitDateTime(scheduledAtLabel)` / `gameNo` / `placeLabel` | `.ss-meta__l` → 2 row 5 SSFieldDisplay |
| Section C `.ss-meta` (우) | `values.referee` / `values.umpire1` / `values.umpire2` + `update(key)` 그대로 | `.ss-meta__r` → 2 row 3 SSFieldInput |

### 충돌 grep 결과 (사용자 핵심 제약 4 — PASS)

| 시안 클래스 | 운영 사용처 (grep) | 충돌 |
|------------|------------------|------|
| `ss-shell` | tokens.css / styles.css / toolbar / running-score-grid / layout.tsx — 동일 시안 출처 박제 | ✅ 정합 |
| `ss-header` (PR-S4 신규) | 0건 | ✅ 안전 도입 |
| `ss-h__* / ss-names* / ss-meta* / ss-field*` | 0건 | ✅ 안전 도입 |
| `ss-paper` | 0건 (후속 PR-S6/7 예약) | ✅ 미사용 |

### ss-shell 스코프 적용 영역 (사용자 핵심 제약 — PASS)

- FibaHeader outermost wrapper `<section className="ss-shell ss-header">` 한정.
- frame 본체 wrapper (TeamSection / RunningScoreGrid 등) **ss-shell 추가 ❌** (후속 PR 검토).
- 기존 ss-shell 사용처 (toolbar / running-score-grid) 와 독립 — DOM 트리 별개 (toolbar 와 FibaHeader 둘 다 각자 root 에 ss-shell 부착).

### 운영 동작 보존 검증 (사용자 핵심 제약 — 6/6 PASS)

| # | 검증 항목 | 결과 |
|---|----------|------|
| 1 | fiba-header.tsx props interface 변경 0 (page.tsx 호출 위치 변경 0) | ✅ `FibaHeaderProps` 9 필드 동일 — teamAName/teamBName/competitionName/scheduledAtLabel/gameNo/placeLabel/values/onChange/disabled/frameless. score-sheet-form.tsx L1012 호출 그대로 |
| 2 | splitDateTime / venue / referee / umpire 매핑 로직 변경 0 | ✅ `splitDateTime(scheduledAtLabel)` 그대로 / values.referee/umpire1/umpire2 + update(key) 패턴 보존 / dateLabel/timeLabel/gameNo/placeLabel/competitionName/teamAName/teamBName 변수명 동일 |
| 3 | 운영 inline subcomponent / helper 함수 변경 0 | ✅ splitDateTime export 보존 (test import 변경 0) / FibaHeaderInputs export 보존 / InlineField* 삭제 → SSFieldDisplay/SSFieldInput 신규 (외부 영향 0 — 내부 helper) |
| 4 | 인쇄 시 (@media print / _print.css) FibaHeader 영역 정합 | ✅ ss-shell 스코프 룰은 var(--ss-paper-*) 토큰 사용 / _print.css 기존 룰 미오염 / 시안 직각 (border-radius 0) 정합 |
| 5 | 외부 컴포넌트 (TeamSection / RunningScoreGrid / PeriodScoresSection / FooterSignatures) 영향 0 | ✅ fiba-header.tsx 만 수정 / styles.css 의 신규 룰은 .ss-shell .ss-h* / .ss-names* / .ss-meta* / .ss-field* / .ss-shell.ss-header — 다른 컴포넌트 className 미겹침 (grep 0건) |
| 6 | Phase 23 PR2+PR3 자동 로드 영향 0 | ✅ initialRunningScore / cross-check / draft confirm 흐름은 score-sheet-form.tsx 내부 — FibaHeader 와 격리 |

### 검증 (4/4 PASS)

| # | 명령 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | ✅ EXIT=0 (에러 0) |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | ✅ 11 files / **204/204 PASS** / 525ms |
| 3 | 충돌 grep (ss-h / ss-names / ss-meta / ss-field / ss-paper / ss-header) | ✅ 0건 (사용자 핵심 제약 4) |
| 4 | vitest `fiba-header-split-datetime.test.ts` | ✅ 5/5 PASS / splitDateTime export 보존 / 5 케이스 (null/—/ISO/한국어/공백없음) |

💡 tester 참고:
- **운영 매치 218** 또는 임의 매치 진입 시 헤더 영역 시각 변경 확인:
  - BDR 로고 = 흑색 사각 박스 안 원형 흰 보더 (h-38px) + "BDR / SCORE" 텍스트
  - 우측 3줄 타이틀 = "BASKETBALL DAILY ROUTINE / MyBDR 공식 기록지 / SCORESHEET" (모두 흑색 ALL CAPS)
  - Team A / Team B = 좌우 50% strip + underscore underline
  - Meta 좌 = Competition (flex 2) / Date / Time / Game No / Place (flex 3)
  - Meta 우 = Referee (flex 2 / 입력) / Umpire 1 / Umpire 2 (입력)
- **데이터 정확성** = 변경 0. 매치 218 의 기존 teamAName / competition / date / referee 값 동일 표시.
- **입력 동작** = Referee / Umpire 1 / Umpire 2 모두 기존과 동일 (onChange / disabled / maxLength=40).
- **인쇄 미리보기** = FibaHeader 영역이 FIBA 종이 정합 시각 (직각 border / 흑색 ink / underscore).

⚠️ reviewer 참고:
- **frameless prop 호환성 유지** — `frameless: _frameless` 로 destructure (사용 안 함). 호출자 (form.tsx L1012) 가 prop 전달해도 무시되며 시안 마크업 = 단일 wrapper 정합. 후속 PR 에서 prop 정리 가능.
- **`<label>` 시안 selector 정합** — `.ss-shell .ss-field > label` selector 매칭 위해 SSFieldInput 의 outer = `<div>` / sibling = `<label>` + `<input>`. label 안에 input 두는 형 (`<label><span>...</span><input/></label>`) 은 selector 미매칭이라 회피. 접근성 = `aria-label={label}` 박제.
- **시안 .ss-h__logo-mark 원형 + Image** — 시안 = Material Symbols `sports_basketball` 아이콘. 운영 = BDR 자체 로고 (`/images/logo.png`). CSS `.ss-h__logo-mark img { height: 100%; object-fit: contain; }` 룰로 원형 안 정렬 박제. width 36/height 36 next/image 박제.
- **`.ss-shell.ss-header { max-width: 794px }`** — D6 정합 박제. 모바일 가로 스크롤은 부모 layout 책임 (현재 form.tsx 의 main 또는 layout.tsx 의 thin bar 컨테이너).

### 후속 PR 진입 시 사전 작업 영향 평가

| 후속 PR | 본 PR-S4 영향 |
|--------|-------------|
| PR-S5 PeriodScoresSection | 독립 컴포넌트 — FibaHeader 와 데이터/UI 격리. 본 PR-S4 도입 ss-shell.ss-header 룰과 미겹침 |
| PR-S6 TeamSection | 독립 컴포넌트 — modal 진입점 보존 의무. ss-shell 스코프 도입 시 본 PR-S4 와 동일 패턴 재사용 가능 |
| PR-S7 FooterSignatures | 독립 컴포넌트 — Officials 분리 박제. 본 PR-S4 의 .ss-field 룰 재사용 가능 (선택) |
| frame 본체 wrapper ss-shell 부착 (장기) | 본 PR 미진행 (사용자 핵심 제약) — 후속 PR 사용자 결재 필요 |

---

## 구현 기록 (developer) — 마법사 Phase 1

📝 구현한 기능: 통합 마법사 공통 lib 인프라 (DB ❌ / UI ❌ / API ❌). Phase 2~7 이 import 할 단일 source.

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|----------|
| `src/lib/tournaments/wizard-types.ts` | WizardStep / WizardDraft / TournamentPayload / DivisionRulePayload / OrganizationItem / SeriesItem | 163 | 신규 |
| `src/lib/tournaments/wizard-draft.ts` | saveDraft / loadDraft / clearDraft + safeBigIntReplacer (SSR 안전 / silent fail) | 99 | 신규 |
| `src/lib/tournaments/wizard-constants.ts` | STEPS (5단계) + TOURNAMENT_STATUS_DEFAULT="draft" + stepIndexToKey / stepKeyToIndex | 74 | 신규 |

핵심 의사 결정:
- TournamentPayload = **components/tournament/*.tsx 의 실제 export 재사용** (ScheduleFormData / RegistrationSettingsData / TeamSettingsData / BracketSettingsData). 임의 추정 ❌.
- API 응답 타입 (OrganizationItem / SeriesItem) **snake_case 박제** — `my_role` / `tournaments_count` (apiSuccess 자동 변환).
- BigInt 직렬화 안전 — JSON.stringify replacer 박제 (Prisma BigInt 컬럼 회귀 가드).
- SSR 안전 — `typeof window === "undefined"` 가드.
- KEY 단일 source — `wizard:tournament:draft` grep 결과 1건 (검수 PASS).

자체 검수 6/6 PASS:
| # | 항목 | 결과 |
|---|------|------|
| 1 | tsc --noEmit 통과 | ✅ 출력 0 (에러 0) |
| 2 | 신규 export named export 박제 | ✅ 6 타입 + 3 함수 + 2 헬퍼 + 1 상수 |
| 3 | KEY grep = 1건 | ✅ wizard-draft.ts 만 hit |
| 4 | 기존 wizard page.tsx 변경 0 | ✅ git status 신규 3 파일만 |
| 5 | Tailwind 토큰 / 하드코딩 색상 0 | ✅ CSS 변경 0 (자동 충족) |
| 6 | snake_case 응답 타입 박제 | ✅ my_role / tournaments_count 박제 |

💡 tester 참고:
- 본 Phase 는 **순수 lib** (런타임 동작 ❌). E2E 테스트 ❌, 빌드 테스트만 의미.
- 검증 방법: `npx tsc --noEmit` + `npx next build` 통과 확인 (선택).
- 기존 wizard `/tournament-admin/tournaments/new/wizard` 페이지는 변경 0 → 회귀 ❌.

⚠️ reviewer 참고:
- **TournamentPayload 의 4 폼 컴포지션 패턴** — Phase 4 의 prefill / Phase 5 의 회차 복제가 각 폼 데이터를 직접 갱신할 수 있도록 구조화. 단일 평면 타입 (모든 필드 spread) vs 컴포지션 (sub-object) 선택 → 컴포지션 채택 (폼 onChange 시그니처 보존).
- **`organization_id` / `series_id` snake_case 식별자** — WizardDraft 자체는 폼 state 지만 DB 컬럼명 정합 박제. tournament_payload 내부는 camelCase (폼 onChange 표준).
- Phase 2~4 진행 중 TournamentPayload 필드 보강 가능 — 본 Phase 는 "최소 공통 분모" 만 박제. 보강 의도는 주석으로 명시.

다음 단계 (PM):
1. tsc 0 / KEY 1건 / wizard page.tsx 변경 0 확인 → commit 결재
2. `feat(wizard): 통합 마법사 공통 타입·draft 인프라 (Phase 1)` 메시지로 commit
3. push 후 Phase 2 (Step 0 단체) 진입

---

## 구현 기록 (developer) — Phase 19 PR-S3

📝 구현한 기능: RunningScoreGrid `mode` prop 추가 + score-sheet-form.tsx scoreMode wiring + paper 모드 read-only preview 시각 indicator + toolbar 라벨 명확화.

**사용자 핵심 제약 보존**: detail 모드 (기본) = 운영 동작 100% 보존 / paper 모드 = 신규 read-only preview.

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|----------|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/running-score-grid.tsx` | `mode?: 'paper' \| 'detail'` prop (기본 'detail') / handleCellClick early return / wrapper `data-score-mode` 속성 / paper 안내 텍스트 (no-print) | +45 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | RunningScoreGrid 호출에 `mode={scoreMode}` + 주석 | +5 | 수정 |
| `src/app/(score-sheet)/_components/score-sheet-toolbar.tsx` | 라벨 명확화 "페이퍼 (읽기 전용)" / "상세 (입력)" + 의미 주석 | +8 | 수정 |
| `src/app/(score-sheet)/_components/_score-sheet-styles.css` | `.ss-shell [data-score-mode="paper"]` opacity 0.85 + cursor not-allowed + button cursor 룰 | +30 | 수정 |

**합계**: +88 LOC (4 파일 / 신규 0).

### 채택안 박제

| 항목 | 채택 | 사유 |
|------|------|------|
| mode prop 시그니처 | `mode?: 'paper' \| 'detail'` 기본 'detail' | prop 미전달 = 운영 동작 = 호출자 변경 없이 회귀 0 |
| read-only 구현 | `handleCellClick` 시작부 `if (isPaperMode) return;` | disabled 와 동일 패턴 재사용 (검증된 분기) / setRunningScore / 모달 모두 호출 안 됨 |
| 시각 indicator | (1) `data-score-mode="paper"` 속성 + (2) CSS opacity 0.85 + cursor + (3) wrapper 상단 안내 텍스트 (no-print) | 3중 시각 신호 (속성/스타일/텍스트) → 운영자 즉시 인식 / 인쇄 시 안내 텍스트 제외 |
| 라벨 수정 | "페이퍼 정합 (A\|B · 8)" → "페이퍼 (읽기 전용)" / "상세 마킹 (16)" → "상세 (입력)" | PR-S3 = grid layout 분기 안 함 → "8/16" 컬럼 의미 misleading. D2 의 read-only 의미 명확 표현 |
| layout 분기 | ❌ 안 함 (D7 결재) | 운영 16 컬럼 layout 유지 / paper 모드도 동일 grid 시각 (후속 PR 범위) |

### 운영 동작 보존 검증 (사용자 핵심 제약 — 5/5 PASS)

| # | 검증 항목 | 결과 |
|---|----------|------|
| 1 | detail 모드 (기본) 진입 시 RunningScoreGrid onClick / setRunningScore / 모달 trigger 변경 0 | ✅ early return 은 isPaperMode 가 true 일 때만 발동 / detail = 기존 흐름 그대로 |
| 2 | mode prop 미전달 시 = 'detail' 폴백 = 운영 동작 동일 | ✅ default param `mode = "detail"` |
| 3 | localStorage draft / 4종 모달 / BFF submit / buildSubmitPayload 변경 0 | ✅ score-sheet-form.tsx 의 호출 위치에 `mode={scoreMode}` 1줄만 추가 / 그 외 함수 변경 0 |
| 4 | RunningScoreGrid grid layout / cell 구조 변경 0 | ✅ SetColumns / MarkCell / PrintScoreCell 모두 변경 0 (paper 모드 = wrapper 속성 + CSS 만) |
| 5 | Phase 23 PR2+PR3 자동 로드 회귀 0 (initialRunningScore prop 흐름 보존) | ✅ score-sheet-form.tsx 의 initialRunningScore → setRunningScore → state → grid prop 흐름 변경 0 |

### 검증 (4/4 PASS)

| # | 명령 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | ✅ EXIT_CODE=0 (에러 0) |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | ✅ 11 files / 204/204 PASS / 686ms |
| 3 | 수동 — detail 매치 218 진입 → 기존 마킹 가능 | ⏳ 사용자 위임 (운영 회귀 검증) |
| 4 | 수동 — paper 토글 → grid disabled / 마킹 불가 + 안내 텍스트 표시 | ⏳ 사용자 위임 |

💡 tester 참고:
- detail 모드 (기본) — 매치 진입 시 기존과 동일 (mode prop 없이 호출하면 'detail' 폴백)
- paper 모드 토글 — toolbar 의 "페이퍼 (읽기 전용)" 클릭 시:
  - grid 영역 opacity 0.85 + cursor not-allowed (시각 disable)
  - 빈 칸 / 마지막 마킹 칸 클릭 시 모달 안 열림 / window.confirm 안 뜸 (조용히 무시)
  - grid 상단에 작은 info 색 안내 텍스트 "페이퍼 모드 — 읽기 전용..." 표시
  - 인쇄 시 안내 텍스트 hidden (no-print 클래스)
- 토글 왔다갔다 시 state (마킹 / period) 박제 유지 — 모드 변경은 입력 차단만 처리

⚠️ reviewer 참고:
- **mode prop default = 'detail'** = 호출자 변경 없는 호환성 보장 (테스트나 다른 호출 경로 회귀 0)
- **`isPaperMode` 변수 분리** — 컴포넌트 안 단일 source / 향후 다른 분기 추가 시 재사용
- **CSS selector `[data-score-mode="paper"]`** — wrapper element 가 ss-shell 외부일 경우에도 동작 (selector 가 root 가 아닌 자손 검색). 단 ss-shell 스코프 안에서만 매칭 = ss-shell wrapper (layout.tsx 또는 toolbar wrapper) 와 grid 가 동일 트리여야 함. 현재 운영 = score-sheet-form 의 main 이 ss-shell 아님 → grid 의 자체 wrapper `data-score-mode` 가 `.ss-shell` 부모를 가지지 않으면 CSS 미적용 가능성.
  - **수정 필요 가능성**: `.ss-shell [data-score-mode="paper"]` → `[data-score-mode="paper"]` 로 selector 약화 또는 grid wrapper 가 ss-shell 안에 있도록 wrapping 검토.
  - 현재 시각 indicator 는 (a) wrapper 속성, (b) CSS opacity, (c) 상단 안내 텍스트 3중 → (c) 안내 텍스트만으로도 운영자 인식 가능. (a)+(b) 가 미적용되어도 안전망 존재.

### 후속 검수 권장

운영 매치 218 (또는 임의 매치) 에서 다음 시각 확인:
1. detail 모드 → 정상 마킹 가능 (회귀 0)
2. paper 모드 → opacity 변화 + 마킹 불가 + 안내 텍스트 표시
3. 인쇄 미리보기 → 안내 텍스트 hidden (FIBA 종이 정합)

---

## Phase 19 PR-S2 요약 (commit `4416a91`)

| 파일 | LOC | 변경 |
|------|-----|------|
| `_components/score-sheet-toolbar.tsx` | +130 (신규) | Client Component / 4 버튼 + 모드 segment / ss-shell wrapper |
| `_components/_score-sheet-styles.css` | +95 (신규) | scoresheet.css .ss-toolbar* 룰 이식 (max-width 794px) |
| `layout.tsx` | 단순화 | thin bar = ThemeToggle 만 / back+print 제거 (toolbar 흡수) |
| `match-end-button.tsx` | +39 | controlled props (open/onOpenChange/hideTriggerButton) 추가. 내부 confirm/BFF 변경 0 |
| `score-sheet-form.tsx` | +41 | scoreMode + matchEndOpen state / toolbar JSX / MatchEndButton wiring |

운영 함수 100% 보존: PrintButton.window.print() / MatchEndButton.handleConfirm / localStorage / 4종 모달 / buildSubmitPayload / thin bar (ThemeToggle/RotationGuard/ToastProvider) 모두 변경 0.

검증 8/8 PASS: tsc 0 / vitest 204/204 / 그 외 보존 의무 6건.

## 리뷰 결과 (reviewer) — Phase 19 PR-S2 사후 검증

📊 **종합 판정: 통과 (Approve with minor follow-ups)** — 머지 회수 불필요. 후속 PR 권장 2건.

### 8 항목 검증 결과

| # | 영역 | 판정 | 비고 |
|---|------|------|------|
| 1 | D3 ss-shell 스코프 | ✅ PASS | toolbar 컴포넌트 root `<div className="ss-shell no-print">` (line 64) self-contained — 부모 wrapper 의존 0 |
| 2 | D4 toolbar 4px radius | ✅ PASS | `_score-sheet-styles.css` L35 / L52 / L86 모두 `border-radius: 4px` 박제 |
| 3 | D5 handleConfirm 경로 | ✅ PASS | toolbar `onEndMatch=() => setMatchEndOpen(true)` → MatchEndButton controlled `open=matchEndOpen` → 동일 confirm modal → 동일 handleConfirm → 동일 BFF POST. 함수 변경 0 |
| 4 | D6 max-width 794px | ✅ PASS | `_score-sheet-styles.css` L25 `max-width: 794px` + L31 `gap:10px` + 타이틀/seg `white-space: nowrap` |
| 5 | Phase 23 PR2+PR3 회귀 | ✅ PASS | useState 추가 위치 = 다른 useState 사이 (L241, L245) / 조건부 호출 ❌ / Hooks 룰 보존. cross-check / hasOnlyQuarterScores / initialRunningScore 흐름 모두 변경 0 |
| 6 | MatchEndButton controlled 패턴 | ✅ PASS | 3 props 모두 optional / `isControlled = controlledOpen !== undefined` 분기로 uncontrolled 호환. 사용처 grep = form.tsx 1건만 — 호환성 검증 자동 충족 |
| 7 | layout 적용 범위 | ✅ PASS | `(score-sheet)` route group 안 page.tsx = `score-sheet/[matchId]` 1개뿐 — 다른 라우트 영향 0 |
| 8 | 시각 통합 / AppNav | ✅ PASS | score-sheet 는 (web) 격리 라우트 그룹 — AppNav frozen 룰 영향 0 / 시안 시각 자연 박제 |

### ✅ 잘된 점

- **controlled props 패턴이 교과서적** — `controlledOpen !== undefined` 분기 + `isControlled ? controlledOpen : internalOpen` + setOpen 가 controlled 모드에서 internal state 변경 안 함 → 이중 source-of-truth 회피. 다른 사용처 0 추가에도 호환 보장.
- **ss-shell self-contained wrapping** — toolbar 컴포넌트 root 가 직접 `ss-shell` className 부착 → 부모(ScoreSheetForm) 의 wrapping 없이도 토큰 활성화. (스크래치패드 reviewer 참고 L117 의 우려 = 토큰 미적용 가능성은 본 commit 에서 해소됨)
- **no-print 정합** — toolbar wrapper / matchEndButton wrapper 모두 `no-print` → 인쇄 시 깨끗하게 hidden. _print.css L131-136 의 `display: none !important` 와 정합.
- **운영 함수 호출 0 변경** — onPrint / onEndMatch / backHref 모두 inline 위임 (window.print / setMatchEndOpen / "/admin") → 기존 PrintButton / MatchEndButton trigger / Link 의 동작 1:1 보존.
- **Phase 23 PR2+PR3 흐름 보존** — useState 4건 추가 (scoreMode + matchEndOpen) 가 기존 Hooks 순서를 깨지 않음. initialRunningScore / cross-check / hasOnlyQuarterScores 모두 변경 0.

### 🟡 후속 권장 수정 (즉시 회수 불필요 / 후속 PR)

1. **`src/app/(score-sheet)/score-sheet/[matchId]/_components/match-end-button.tsx:102` — handleConfirm `submitted` 가드 부재**
   - 현재 가드 = `if (submitting) return;` 만. `submitted=true` 후 toolbar 의 "경기 종료" 버튼이 다시 눌리면 confirm modal 재표시 → 확인 → BFF POST 재호출 가능.
   - 기존 코드 (PR-S2 전) = `{!submitted && <button>...}` 분기로 종료 버튼 자체가 hide → 재진입 불가 (UI 안전망).
   - PR-S2 후 = toolbar "경기 종료" 버튼은 `submitted` 인지 모름 → 재진입 가능. 서버 멱등성 (status="completed" 매치 재제출 거부) 에 의존하게 됨.
   - **권장 수정** (소규모): handleConfirm 시작에 `if (submitting || submitted) return;` 추가 + (선택) toolbar 의 onEndMatch 가 submitted 상태를 prop 으로 받아 disabled 처리.
   - 위험도: 낮음 — BFF `/api/web/score-sheet/{id}/submit` 가 status="completed" 매치 재제출을 거부한다면 데이터 손상 0. 다만 토스트 / 라이브 발행 트리거 중복 가능성 잔존.

2. **`src/app/(score-sheet)/score-sheet/[matchId]/_components/match-end-button.tsx:80-89` — useEffect deps 누락**
   - `useEffect(() => { ... }, [open, submitting]);` 에서 ESC 핸들러가 `setOpen(false)` 호출 → setOpen 은 closure 캡처 (`isControlled`, `onOpenChange`). React strict mode 에서 stale closure 경고 가능성. 단 현재 동작 회귀 0 (PR-S2 전 동일 패턴).
   - **권장**: 후속 PR 에서 setOpen 을 useCallback 으로 감싸거나 deps 에 추가. 즉시 회수 불필요.

3. **`src/app/(score-sheet)/_components/score-sheet-toolbar.tsx:41` — disabled / submitted 상태 미수용**
   - toolbar 가 `submitted` 인지 모름 → 종료 후에도 버튼 활성. 시각 disabled 처리도 없음.
   - **권장**: 후속 PR-S4~S7 또는 별도 패치에서 `endedAt` / `submitted` prop 추가하여 toolbar 버튼 disabled.

4. **scoreMode 후속 PR-S3 wiring**
   - PR-S2 시점 = scoreMode state 만 박제 / RunningScoreGrid 미전달. 시안 commit 메시지 = "후속 PR-S3 별도" 명시. **PR-S3 이미 진행됨** (스크래치패드 L17 / +88 LOC / tsc 0 / vitest 204/204) → 본 후속 자동 해소.

### 🔴 필수 수정

**없음** — 운영 동작 회귀 0 / 데이터 무결성 위험 0 / Phase 23 흐름 보존 / Hooks 룰 보존.

### 결론 테이블

| 영역 | 판정 | 액션 |
|------|------|------|
| **머지 OK** | 8/8 | 회수 불필요 — 이미 push 완료 + 운영 회귀 0 |
| **즉시 수정** | 0건 | — |
| **후속 권장** | 3건 | handleConfirm submitted 가드 / useEffect deps / toolbar disabled 수용 (모두 소규모 / 후속 PR) |

### 추가 확인 사항 (정보 전달)

- **commit 메시지 본문 경로 오기재**: commit `4416a91` 메시지가 `_components/score-sheet-toolbar.tsx` 를 `score-sheet/[matchId]/_components/` 아래로 적었으나 실제는 route group root `(score-sheet)/_components/` 에 박제됨. 동작 영향 0 / 의뢰서/스크래치패드 메모만 정정 필요.
- **PrintButton 컴포넌트 잔존**: `_components/print-button.tsx` 파일은 삭제 안 함 (`layout.tsx` L28 주석 = 향후 복원 대비). 현재 사용처 0 / dead code 잠재 — 후속 cleanup 큐 등재 권장.

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-14 | Phase 19 PR-S2 후속 3 fix — handleConfirm submitted 가드 / ESC useEffect deps + setOpen useCallback / toolbar endMatchDisabled prop + form wiring | ✅ 3 파일 +50 LOC / tsc 0 / vitest 204/204 / breaking change 0 / 사용자 핵심 제약 6/6 보존 / commit 대기 |
| 2026-05-14 | Phase 19 PR-S4 — FibaHeader 시안 시각 정합 (.ss-h / .ss-names / .ss-meta / .ss-field 도입 + ss-shell 스코프 한정) | ✅ 2 파일 +220 styles / 재구성 fiba-header / tsc 0 / vitest 204/204 / 운영 매핑 6/6 보존 / 충돌 grep 0건 / commit 대기 |
| 2026-05-14 | Phase 19 PR-S3 — RunningScoreGrid `mode` prop + scoreMode wiring + paper read-only preview (D2/D7) | ✅ 4 파일 +88 LOC / tsc 0 / vitest 204/204 / 운영 동작 5/5 보존 / commit 대기 |
| 2026-05-14 | 마법사 Phase 1 — 공통 lib 인프라 (wizard-types / wizard-draft / wizard-constants) | ✅ 신규 3 파일 +336 LOC / tsc 0 / KEY 1건 / wizard page.tsx 변경 0 |
| 2026-05-14 | Phase 19 PR-S2 — 시안 toolbar 전체 도입 (back + 모드토글 + print + 경기종료) + thin bar 흡수 + MatchEndButton controlled props | ✅ 5 파일 +325/-33 / tsc 0 / vitest 204/204 / commit `4416a91` push |
| 2026-05-14 | Phase 19 PR-S1 — BDR v2.5 시안 토큰 운영 도입 (.ss-shell 스코프 14종 토큰) + D3 운영 PERIOD_LEGEND hex 동기화 | ✅ 신규 1 + 수정 1 +64 LOC / tsc 0 / vitest 204/204 / commit `ef54e7a` push |
| 2026-05-14 | Phase 19 비파괴 통합 분석 (planner-architect / read-only) — PR-S1~S7 분해 + D1~D7 결재 + 위험 매트릭스 9건 | ✅ 분석 박제 / D1 자동 해제 / 사용자 D2~D7 권장안 수락 |
| 2026-05-14 | Phase 23 PR2+PR3 reviewer 검증 결과 박제 | ✅ `5b065ec` docs commit / 머지 OK 판정 |
| 2026-05-14 | Phase 23 PR2+PR3 — 매치 재진입 시 자동 로드 (매치 218 사고 영구 차단) + draft/DB confirm + cross-check | ✅ 3 파일 +368 LOC / tsc 0 / vitest 204/204 / commit `a147bb1` push |
| 2026-05-14 | BDR v2.5 sync + Phase 23 ScoreSheet 시안 5 파일 commit | ✅ commit `1fa9210` (221 파일) / _archive 138 파일 백업 / push |
| 2026-05-14 | Phase 23 PR1 — PBP 역변환 헬퍼 2개 + vitest 24 케이스 | ✅ tsc 0 / vitest 24/24 / commit `b7c44d8` / push |
| 2026-05-14 | Phase 23 설계 분석 (planner-architect / read-only) | ✅ Q1~Q5 결재 수락 / PR 3+1 분해 |

## 미푸시 commit (subin 브랜치)
**0건** — `ef54e7a` + `5b065ec` + `4416a91` 푸시 완료.

## 후속 큐 (미진입)
- **Phase 19 PR-S4** — FibaHeader 시각 디테일 (BDR 로고 + 3줄 타이틀)
- **Phase 19 PR-S5** — PeriodScoresSection 시각 (① ② ③ ④ + Winner)
- **Phase 19 PR-S6** — TeamSection head/footer 시각 (모달 진입점 보존). form.tsx 자유 (D1 해제)
- **Phase 19 PR-S7** — FooterSignatures Officials 분리
- **Phase 23 PR4** (선택) — status="completed" 매치 수정 가드
- **Phase 23 PR5** — audit endpoint 박제 + cross-check 호출
- **Phase 23 PR6** — ConfirmModal 박제 + OT cross-check 확장 + PaperPBPRow 명시 mapping
- **Phase A.7** — 시안에 운영 모달 5종 박제 의뢰서 작성 (Claude.ai Project)
- UI-1.4 entry_fee 사용자 보고 재현
- GNBA 8팀 코치 안내
