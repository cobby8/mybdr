# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 23 PR6 reviewer WARN 3건 fix (ConfirmModal + OT cross-check + PaperPBPRow 명시 매핑)
- **상태**: developer 완료 — PM 결재 대기 (5 파일 변경 + vitest 211/211)
- **선행 작업**: ✅ scratchpad 정리 / ✅ subin → dev → main 머지 / ✅ Phase 23 PR4 commit `79b497e`

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
**0건** — 모두 푸시 완료. (Phase 23 PR4 는 PM 결재 후 commit)

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
