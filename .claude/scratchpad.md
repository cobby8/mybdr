# 작업 스크래치패드

## 현재 작업
- **요청**: 통합 마법사 (단체 → 시리즈 → 대회 → 회차) — Phase 1 공통 인프라
- **상태**: ✅ Phase 1 박제 완료 (3 파일 신규 / +336 LOC / tsc 0). PM 검증 → commit 대기
- **모드**: no-stop / Phase 1~7 순차

## 진행 현황표
| 단계 | 결과 |
|------|------|
| Phase 19 PR-S1+S2 / Phase 23 PR2+PR3 | ✅ 직전 commit (`ef54e7a`/`4416a91`/`a147bb1`) |
| **마법사 Phase 1** (shared-types / draft / constants) | ✅ 신규 3 파일 / tsc 0 / KEY 1건 |
| **Phase 19 PR-S3** (mode prop wiring) | ✅ 4 파일 +88 LOC / tsc 0 / vitest 204/204 / commit 대기 |
| 마법사 Phase 2 (Step 0 단체) | ⏳ 대기 |
| 마법사 Phase 3~7 | ⏳ 대기 |

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

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
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
| 2026-05-14 | Phase C — status="completed" score safety net + Phase 22 knowledge | ✅ vitest 8/8 / tsc 0 / 분리 commit |
| 2026-05-13 | FIBA Phase 21+22 — 박스스코어 6 컬럼 hide + LIVE OT 표시 fix | ✅ commit `171de67`+`63c0633` / 운영 배포 |

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
