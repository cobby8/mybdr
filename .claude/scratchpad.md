# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 23 설계 분석 (read-only) — score-sheet 매치 재진입 시 자동 로드 설계
- **상태**: 분석 완료 / 사용자 결재 대기 / 코드 변경 0
- **모드**: no-stop (사용자 명시 요청)

## Phase 23 설계 (planner-architect)

목표: score-sheet/[matchId] 재진입 시 PBP/quarter_scores/playerStats/lineup 자동 로드 → 빈 폼 재제출 → 잘못 박제 (매치 218 사례) 영구 차단.

### 1) 현재 페이지 구조 (실측)

| 파일 (실제 경로) | 역할 | 현재 자동 로드 |
|------|------|--------------|
| `src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` (Server) | 권한 + 모드 가드 + 라인업 prop drilling 진입점 | 라인업만 (Match​Lineup​Confirmed + TTP) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` (Client, 968L) | 폼 본체 상태 7종 (header / teamA / teamB / runningScore / fouls / timeouts / signatures / lineup) | **localStorage 만** (key=`fiba-score-sheet-draft-{matchId}`) |
| `_components/{running-score-grid, period-scores-section, team-section, foul-type-modal, quarter-end-modal, lineup-selection-modal, footer-signatures, fiba-header, match-end-button}` | 자식 컴포넌트 | n/a (state setter prop drilling 만) |
| `src/lib/score-sheet/running-score-helpers.ts` | 정방향 `marksToPaperPBPInputs` (Score​Mark → PBP) | 역변환 없음 |
| `src/lib/score-sheet/foul-helpers.ts` | 정방향 `foulsToPBPEvents` (Foul​Mark → PBP) | 역변환 없음 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` (BFF, 743L) | 박제 path (PBP + quarter_scores + player_stats + lineup + settings.timeouts/signatures + notes) | 일방향 박제 (재진입 SELECT 없음) |

**현재 진입 흐름** (page.tsx):
1. `requireScoreSheetAccess` → match SELECT (`quarterScores`, `settings`, `homeScore` 이미 포함 — 사용 안 함)
2. `getRecordingMode(match)` → paper 가드
3. `loadTeamRoster` × 2 (lineup + TTP roster)
4. `<ScoreSheetForm initialLineup={...} />` — **라인업 외 모든 상태 = EMPTY**

**왜 재진입 시 빈 폼**:
- `score-sheet-form.tsx` `useState(EMPTY_RUNNING_SCORE/EMPTY_FOULS/EMPTY_TIMEOUTS/EMPTY_SIGNATURES)` 초기값 = 무조건 빈 객체
- localStorage draft 는 **같은 브라우저 + 같은 도메인 + 미만료** 케이스만 복원 → 다른 기기/시크릿/캐시 삭제 = 빈 폼 그대로
- DB 에 박제된 PBP/quarter_scores 는 진입 시 SELECT 자체 안 함

### 2) 데이터 source 매핑 (대칭 박제 ↔ 역변환)

| 박제 path (submit/route.ts) | 박제 위치 | 재진입 SELECT | 역변환 키 |
|---|---|---|---|
| `running_score` → `play_by_plays` (action_type="shot_made") | `play_by_plays` 테이블 (local_id `paper-fix-*` prefix) | `prisma.play_by_plays.findMany({ where: { tournament_match_id, action_type: "shot_made" }, orderBy: ... })` | `home_score_at_time` (position) + `quarter` (period) + `points_scored` + `tournament_team_id` (home/away 판정) + `tournament_team_player_id` (playerId) |
| `fouls` → `play_by_plays` (action_type="foul") | 동일 PBP 테이블 | `where: { action_type: "foul" }` | `description` 끝 글자 (P/T/U/D) + `quarter` + `tournament_team_id` + `tournament_team_player_id` |
| `quarter_scores` → `TournamentMatch.quarterScores` | JSON `{home: {q1..q4, ot[]}, away: {...}}` | 이미 SELECT 됨 (`match.quarterScores`) | 신뢰 source (FIBA Phase 22 결재). 단, PBP 합산과 mismatch 케이스 가드 필요 |
| `player_stats` → `MatchPlayerStat` | 22 컬럼 row × 선수 | `prisma.matchPlayerStat.findMany({ tournamentMatchId })` | running_score 역변환 가능 → 별도 SELECT 불필요 (PBP 가 source of truth) |
| `lineup` → `MatchLineupConfirmed` | `home/away` 각 1 row (starters/substitutes bigint[]) | **이미 SELECT 됨** (`loadTeamRoster`) | 변경 없음 |
| `settings.timeouts` JSON | `match.settings.timeouts.{home,away}: [{period}]` | 이미 SELECT 됨 (`match.settings`) | JSON 직렬화 그대로 복원 |
| `settings.signatures` JSON | `match.settings.signatures.{scorer, ...}` | 동일 | JSON 직렬화 그대로 복원 |
| `notes` → `TournamentMatch.notes` | text | 동일 (`match.notes`) | 그대로 signatures.notes 에 복원 |
| `referee_main/sub1/sub2` (header) | audit context 만 (DB 컬럼 없음) | **복원 불가** | audit context 파싱은 비용 대비 효과 낮음 — Phase 23 범위 외 |

**핵심 인사이트**: PBP 단일 source 로 score events + foul events 양쪽 역변환 가능. quarter_scores 는 cross-check 용. player_stats 는 PBP 에서 재집계 가능 (`buildPlayerStatsFromRunningScore` 그대로 재사용).

### 3) 역변환 헬퍼 설계

**정방향 (이미 박제)** — `marksToPaperPBPInputs`:
```
ScoreMark(position, playerId, period, points)
→ PBP { quarter=period, tournament_team_player_id, tournament_team_id(via team_side),
        action_type="shot_made", action_subtype="1pt|2pt|3pt", points_scored,
        home_score_at_time=homeCum (= 마지막 home 마킹 position), away_score_at_time=awayCum,
        is_made=true, game_clock_seconds=0, local_id=paper-fix-{uuid} }
```

**역변환 신규 헬퍼** — `pbpToScoreMarks` (running-score-helpers.ts 동일 파일):

| 입력 | 처리 | 출력 |
|---|---|---|
| `PaperPBPRow[]` (DB row) + `homeTeamId` + `awayTeamId` | (a) `action_type==="shot_made"` 만 필터 / (b) `tournament_team_id===homeTeamId` → home / 외 → away / (c) home/away 각각 `quarter` ASC + `home_score_at_time`(home) / `away_score_at_time`(away) ASC 정렬 / (d) ScoreMark 매핑 = `{position: home_score_at_time, playerId: tournament_team_player_id.toString(), period: quarter, points: points_scored}` | `RunningScoreState { home, away, currentPeriod }` |

**currentPeriod 결정 룰**:
- match.status === "completed" → 마지막 PBP 의 quarter (또는 4 / max)
- status !== "completed" → max(home/away 최대 period, 1)

**역변환 신규 헬퍼** — `pbpToFouls` (foul-helpers.ts 동일 파일):

| 입력 | 처리 | 출력 |
|---|---|---|
| `PaperPBPRow[]` + `homeTeamId` + `awayTeamId` | (a) `action_type==="foul"` 필터 / (b) `description` 정규식 `/ ([PTUD])$/` 로 type 추출 (실패 시 "P" 폴백) / (c) team_id 분기 / (d) FoulMark 매핑 | `FoulsState { home, away }` |

**주의 사항**:
1. **순서 안정성**: 정방향이 `period → side(home먼저) → position` 정렬. 역변환 시 같은 score_at_time 충돌 없음 (position 누적값). 단 created_at + id 보조 정렬 추천.
2. **action_subtype vs points_scored**: 둘 다 박제됨. `points_scored` 우선 (1/2/3 정수 확실).
3. **clock=0 특성**: paper PBP 는 모두 `game_clock_seconds=0` → FIBA Phase 22 lesson (LIVE STL 보정 skip 룰) 그대로. 역변환에는 영향 0 (시간 무시).
4. **mixed 매치 차단**: Flutter 가 박제한 PBP (`local_id` ≠ `paper-fix-*` prefix) 가 섞여 있으면 역변환 거부 / 경고 표시 — paper 모드 가드로 사실상 불가능하지만 안전망.

### 4) 폼 초기값 prop drilling 경로

**현재**:
```
page.tsx (Server) ──initialLineup──> ScoreSheetForm (Client)
                                       └── useState(EMPTY_*) × 7 (라인업 외 모두 빈 객체)
```

**Phase 23 후**:
```
page.tsx (Server)
  ├ requireScoreSheetAccess (match + settings + quarterScores 이미 보유)
  ├ NEW: prisma.play_by_plays.findMany (paper-fix-* 만)
  ├ NEW: pbpToScoreMarks + pbpToFouls (server-side 변환 — server-safe lib)
  └──props──> ScoreSheetForm
                ├ initialRunningScore?: RunningScoreState
                ├ initialFouls?: FoulsState
                ├ initialTimeouts?: TimeoutsState   (match.settings.timeouts JSON)
                ├ initialSignatures?: SignaturesState (match.settings.signatures JSON)
                ├ initialNotes?: string             (match.notes)
                ├ initialQuarterScoresDB?: QSJson   (cross-check 경고용)
                └ (기존 initialLineup 유지)
              ↓
              useState(initialRunningScore ?? EMPTY_RUNNING_SCORE)
              ...
              (mount 1회 useEffect 의 localStorage draft 복원과 우선순위 결정 필요 — §5 edge case (g))
```

**경계 (Server/Client)**:
- 역변환 헬퍼 = `src/lib/score-sheet/*.ts` (이미 server-safe, DOM 의존 0)
- DB SELECT = page.tsx (Server) 1회 추가
- BigInt → string 직렬화 필수 (Next.js 15 server → client prop = JSON only) — `tournament_team_player_id.toString()`, `tournament_team_id` 도 비교용 string 필요

**수정 컴포넌트**:
| 컴포넌트 | 변경 |
|---|---|
| page.tsx | PBP findMany + 헬퍼 호출 + 신규 props 5종 전달 |
| score-sheet-form.tsx | useState 초기값 → `initial* ?? EMPTY_*` / localStorage 복원 우선순위 룰 / DB cross-check 경고 |
| `running-score-helpers.ts` | `pbpToScoreMarks` 헬퍼 + vitest |
| `foul-helpers.ts` | `pbpToFouls` 헬퍼 + vitest |
| 자식 컴포넌트 (running-score-grid 등) | **변경 0** (props=state 패턴 그대로) |

### 5) Edge cases

| 케이스 | 처리 |
|---|---|
| (a) PBP 0건 빈 매치 재진입 | initialRunningScore / initialFouls = undefined → EMPTY_* 폴백. 신규 박제 흐름 그대로 |
| (b) quarter_scores 만 있고 PBP 없는 (수기 score 만 박제) | running_score 복원 불가 + quarter_scores 만 표시 → **경고 모달**: "이 매치는 PBP 없이 quarter 점수만 박제됨. 재박제 시 PBP 새로 생성" — 사용자 결재 옵션 (A: 무조건 빈 폼 시작 / B: quarter_scores 만 PeriodScoresSection 에 readonly 표시) |
| (c) playerStats 만 있는 케이스 | (b) 와 동일 path. playerStats 는 PBP source 아니므로 무시. 단 점수/박스스코어 mismatch 가능 → audit 박제 |
| (d) Flutter 박제 매치 (paper 아님) | 이미 차단 (`getRecordingMode !== "paper"` → 안내 페이지). 추가 작업 0 |
| (e) game_clock_seconds=0 시계 정보 | paper PBP 표준. 역변환에 영향 0 (timeline 무시). 정렬은 quarter + score_at_time + id |
| (f) `description` 파싱 실패 (수기 raw SQL 박제 등) | FoulType "P" 폴백 + audit warning. 운영 영향 0 |
| (g) localStorage draft + DB initial 충돌 (draft savedAt > DB updatedAt 가능) | **사용자 결재 항목 (Phase 23-1)**: 옵션 A (DB 우선 — 본 작업 안전) / 옵션 B (draft 가 더 최신 시 draft 우선 + 모달 confirm) / 옵션 C (병합) — **권장 A** (DB = source of truth / draft 는 mid-submit 백업용 강등) |
| (h) status="completed" 매치 재진입 시 수정 허용 여부 | 현재 BFF 가 strict 차단 없음 (decisions.md = "score 수정만 허용"). 재진입 자동 로드 후 수정 → 재제출 → audit `source="web-score-sheet" / 수정 진입` 박제. 별도 가드 필요 — Phase 23-3 결재 |
| (i) Flutter sync 와 last-write-wins | 본 작업이 paper PBP (`paper-fix-*`) 만 SELECT → Flutter PBP (`pbp-*` 등) 영향 0. service 의 deleteMany NOT IN 룰 그대로 |
| (j) quarter_scores JSON vs PBP 합산 mismatch | FIBA Phase 22 룰 = paper 매치는 quarter_scores DB 신뢰. **재진입 시 cross-check** — 다르면 audit 박제 + UI 경고. 사용자 결재: 어느 쪽 표시? (권장: PBP 합산을 ScoreMarks 로 / quarter_scores 는 PeriodScoresSection 만 표시 비교) |

### 6) 단계 분할 (작은 PR 3 개로)

| PR | 작업 | 변경 LOC 추정 | 검증 기준 |
|---|---|---|---|
| **PR1** | `pbpToScoreMarks` + `pbpToFouls` 헬퍼 + vitest | +180 / -0 (lib 파일 2개 추가, 기존 export 보존) | (a) vitest 10+ 케이스 (정방향 → 역변환 round-trip / 빈 배열 / Q5 OT / 5x5 케이스 / description 파싱 실패 폴백 / 정렬 안정성) (b) tsc 0 (c) marksToPaperPBPInputs(pbpToScoreMarks(pbp)) === pbp 멱등성 |
| **PR2** | page.tsx PBP findMany + 직렬화 + 신규 props 전달 | +80 / -10 (page.tsx 만) | (a) tsc 0 (b) 실제 매치 218 진입 → 점수 화면 렌더링 (E2E 수동) (c) BigInt 직렬화 확인 (Console error 0) (d) Flutter 매치 진입 = 변경 0 회귀 검증 |
| **PR3** | score-sheet-form.tsx 초기값 prop drilling + draft 우선순위 + cross-check 경고 | +60 / -30 (form 본체 1 파일) | (a) tsc 0 (b) vitest 회귀 (기존 form 테스트가 있다면) (c) 수동 시나리오: 빈 매치 / 박제된 매치 / draft 충돌 / quarter_scores mismatch (d) 사용자 검증 (매치 218 그대로 박제 / status 변경 X) |
| **(선택) PR4** | status="completed" 진입 시 수정 가드 (BFF + UI 경고 모달) + 회귀 방지 (cron 또는 audit log monitoring) | +40 / -0 | 사용자 결재 후 분리 진행 |

PR1 → PR2 → PR3 순서 의무 (의존). PR4 는 별도 결재.

### 7) 위험 / 회귀 가능성

| 위험 | 영향 | 대응 |
|---|---|---|
| (R1) paper 매치 외 영향 | 0 — `paper-fix-*` prefix 가드 + getRecordingMode 가드 양면 보호 | 변경 없음 |
| (R2) Flutter v1 API 영향 | 0 — sync API path 변경 0 (consume only). 원영 사전 공지 불필요 | 변경 없음 |
| (R3) 기존 박제된 매치 재진입 부작용 | 중간 위험 — DB 우선 룰 적용 시 draft (운영자 진행 중) 가 무시될 수 있음 | 옵션 A 권장 + draft 도 모달 비교 표시 (사용자 결재) |
| (R4) quarter_scores vs PBP mismatch (FIBA Phase 22 패턴 재발) | 매치 218 root cause = 빈 폼 재제출. Phase 23 = 자동 로드 → 매치 218 영구 차단. 단, 신규 매치에서 mismatch 발생 시 어느 쪽 신뢰? | cross-check 후 audit + UI 경고. 사용자 결재: paper 매치는 PBP 신뢰 (DB quarter_scores 는 표시만 / 박제 시 overwrite) |
| (R5) localStorage draft 손실 (DB 우선 시) | UX 후퇴 — 진행 중 박제 작업 손실 | 사용자 결재 §(g): 모달 "DB 박제 vs draft" 비교 제공 (savedAt vs match.updatedAt) |
| (R6) PBP description 파싱 안정성 | 운영 매치 = description 일관 (정방향 헬퍼 단일 source). 단 수기 raw SQL 박제 케이스 = "P" 폴백 + audit warning | foul-helpers 정규식 `/[\s ](P|T|U|D)$/` 견고하게 |
| (R7) MatchPlayerStat 재집계 부정합 | PBP 가 source of truth → playerStats 는 buildPlayerStatsFromRunningScore 재호출로 멱등. 별도 SELECT 불필요 | 영향 0 |
| (R8) tournament_match_audits 가 신규 source 분류 추가? | "web-score-sheet" 그대로 사용 + context 에 "재진입 자동 로드" 명시 | audit 박제 context 보강만 |
| (R9) BigInt 직렬화 함정 | Next.js 15 server→client = JSON only / BigInt 미지원 | 모든 id .toString() — 기존 페이지 패턴 그대로 |

### 결론

**다음 단계 진입 가능** — 단, 다음 5건 사용자 결재 선결재 필요:

| # | 결재 항목 | 권장안 |
|---|---|---|
| Q1 | localStorage draft vs DB 우선순위 (§(g)) | A (DB 우선 / draft 모달 비교) |
| Q2 | quarter_scores 만 있고 PBP 0건 매치 진입 (§(b)) | B (PeriodScoresSection readonly 표시 + 경고) |
| Q3 | status="completed" 매치 수정 허용 여부 (§(h)) | UI 경고 모달 + audit 박제 (변경 허용) |
| Q4 | quarter_scores vs PBP mismatch 시 신뢰 source (§j / R4) | PBP 신뢰 + cross-check audit |
| Q5 | PR4 (completed 가드) 별도 분리 vs PR3 흡수 | 별도 분리 — 본 작업 결재 후 |

결재 후 PR1 진입.



## 구현 기록 (developer) — Phase 23 PR1 (2026-05-14)

📝 구현한 기능: PBP → ScoreMark / FoulMark 역변환 헬퍼 2개 + 단위 테스트 24 케이스. score-sheet 재진입 시 자동 로드 (PR2/PR3) 의 단일 source. 정방향 (marksToPaperPBPInputs / foulsToPBPEvents) 과 대칭 + round-trip 멱등성 보장.

### 변경 파일

| 파일 (절대 경로) | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `C:\0. Programing\mybdr\src\lib\score-sheet\running-score-helpers.ts` | `PaperPBPRow` 타입 + `pbpToScoreMarks` export 추가 (+126 LOC, 기존 export 보존) | 수정 |
| `C:\0. Programing\mybdr\src\lib\score-sheet\foul-helpers.ts` | `pbpToFouls` export 추가 + `PaperPBPRow` re-import (+98 LOC) | 수정 |
| `C:\0. Programing\mybdr\src\__tests__\lib\score-sheet\pbp-to-score-marks.test.ts` | 12 describe-it 케이스 (vitest 카운트 = 15) | 신규 |
| `C:\0. Programing\mybdr\src\__tests__\lib\score-sheet\pbp-to-fouls.test.ts` | 9 describe-it 케이스 | 신규 |

### 신규 export 시그니처

```ts
// running-score-helpers.ts
export type PaperPBPRow = {
  id: bigint | number;
  quarter: number | null;
  action_type: string | null;
  action_subtype: string | null;
  is_made: boolean | null;
  points_scored: number | null;
  home_score_at_time: number | null;
  away_score_at_time: number | null;
  tournament_team_id: bigint | number | null;
  tournament_team_player_id: bigint | number | null;
  description: string | null;
};

export function pbpToScoreMarks(
  pbpRows: PaperPBPRow[],
  homeTeamId: bigint | string | number,
  awayTeamId: bigint | string | number,
): RunningScoreState;

// foul-helpers.ts (PaperPBPRow 동일 타입 재사용)
export function pbpToFouls(
  pbpRows: PaperPBPRow[],
  homeTeamId: bigint | string | number,
  awayTeamId: bigint | string | number,
): FoulsState;
```

### 검증 결과

| 검증 | 명령 | 결과 |
|------|------|------|
| TypeScript strict (target ES2017) | `npx tsc --noEmit` | ✅ 에러 0 |
| 본 PR vitest | `npx vitest run src/__tests__/lib/score-sheet/` | ✅ 24/24 PASS (611ms) |
| score-sheet 전체 회귀 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | ✅ 204/204 PASS (708ms) — 정방향 헬퍼 회귀 0 |

### 핵심 설계 결정

1. **`PaperPBPRow` 단일 source** = `running-score-helpers.ts` 정의 → `foul-helpers.ts` 가 `import type` 으로 재사용. 양 헬퍼가 동일 DB row 소비.
2. **BigInt 비교 회피** (errors.md 2026-04-17 패턴) = 모든 team_id 비교를 `Number()` 캐스팅 후 (`score-from-pbp.ts` 동일 패턴). bigint / string / number 입력 호환.
3. **points_scored 우선** (의뢰 §1.4) = `action_subtype` 폴백 없음. 1/2/3 외 값 → row 무시 (안전망).
4. **description 정규식** = `/(?:^|\s)([PTUD])$/` — 시작 또는 공백 직후 끝 글자만 매치. "PTUD" 같은 가비지 문자열 끝 글자 잘못 매치 방지.
5. **currentPeriod 폴백** = `max(home/away period 최대값, 1)` — 호출자가 `match.status` 모르므로 안전한 기본값.
6. **mixed 매치 안전망** = `homeTeamId/awayTeamId` 외 team_id row 무시 (Flutter PBP 가 paper-fix 와 섞일 경우 대비).
7. **BigInt 리터럴 회피** (`1n` ❌ → `BigInt(1)` ✅) — tsconfig target ES2017 호환 (`score-from-pbp.test.ts` 동일 패턴).
8. **round-trip 검증 방식** = 정방향 헬퍼 호출 → DB row 형태로 변환 (테스트 헬퍼 `inputsToRows`) → 역변환 → 원본과 비교. 정방향 + 역방향 함께 깨지면 같이 fail (의존성 정상).

### 케이스 인벤토리

**pbp-to-score-marks (15 vitest count)**:
1. 빈 배열 → 빈 결과
2-a/b/c. home/away/혼합 round-trip
3. Q1~Q5 (OT 포함) round-trip
4. 1/2/3점 혼합 round-trip
5. 정렬 안정성 (id 역순 입력 → quarter ASC 정렬)
6. mixed 매치 — rogue team_id + NULL 무시
7. action_type !== "shot_made" 무시 (foul / shot_missed / is_made=false)
8-a/b. BigInt + string 입력 양쪽
9. 3-pass 멱등 (정→역→정)
10. points_scored ∉ {1,2,3} 무시
11. currentPeriod = max(periods, 1)
12. 빈 PBP → currentPeriod=1 폴백

**pbp-to-fouls (9 vitest count)**:
1. 빈 배열
2. P/T/U/D 4종 round-trip
3. description 파싱 실패 → P 폴백 (정상 매치 / 영문 / NULL / X)
4. Q1~Q4 정렬 안정성
5. mixed 매치 안전망
6. shot_made 무시
7. BigInt + string 양쪽
8. 3-pass 멱등
9. tournament_team_player_id NULL 무시

### 💡 tester 참고

- **테스트 방법**: `npx vitest run src/__tests__/lib/score-sheet/` → 24/24 PASS 확인
- **회귀 검증**: `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` → 204/204 PASS (정방향 헬퍼 회귀 0)
- **tsc**: `npx tsc --noEmit` → 에러 0
- **수동 검증 불가** (PR1 = lib 헬퍼만 / page.tsx 변경 ❌ → 실제 매치 진입 동작 변화 0)
- **주의할 입력**: 운영 매치 PBP 에 실제로 NULL team_id 또는 NULL player_id row 가 섞여 있을 수 있음 → 본 헬퍼는 무시. PR2 에서 page.tsx 가 SELECT 시 audit warning 박제 결정 필요

### ⚠️ reviewer 참고

- **`detectTeamSideLocal` 중복**: foul-helpers.ts 가 running-score-helpers.ts 의 `detectTeamSide` 와 동일 4줄 함수를 내부적으로 보유. 의도적 중복 (모듈 결합도 vs 4줄 인라인 trade-off). 향후 둘 다 export 필요 시 통합.
- **`is_made === false` 인 `shot_made` 안전망**: 정방향은 항상 `is_made=true` 박제하므로 발생 불가. raw SQL 박제 매치 대비 무시 처리.
- **순서 안정성**: 정방향은 같은 quarter 안에서 home 먼저 + position ASC 박제. 역방향은 side 별 분리 후 quarter → score_at_time → id 순. 정상 케이스 일치 보장. 운영 매치에서 home_score_at_time 동률 row 존재 가능성 = 0 (cumulative 값이라 strictly increasing).
- **`PaperPBPRow.description: string | null`**: foul 만 description 사용 (P/T/U/D 추출). score 헬퍼는 description 무시 (points_scored 만 사용).

### 다음 단계

1. **PM 검증** — 코드 / 테스트 / scratchpad 박제 확인
2. **tester** (선택) — 이미 vitest 24/24 + tsc 0 통과 → 사용자가 commit 결재만 진행하면 충분
3. **commit** — `feat(score-sheet): Phase 23 PR1 — PBP 역변환 헬퍼 2개 + vitest 24` 권장
4. **PR2 진입** — `page.tsx` PBP findMany + 직렬화 + 신규 props 전달 (별도 turn)

## 진행 현황표
| 단계 | 결과 |
|------|------|
| Phase 23 설계 (read-only) | ✅ 완료 (사용자 결재 5건 수락) |
| Phase 23 PR1 헬퍼 구현 | ✅ 완료 (running-score-helpers + foul-helpers) |
| Phase 23 PR1 vitest | ✅ 24/24 PASS (회귀 204/204 PASS) |
| Phase 23 PR1 tsc | ✅ 에러 0 |
| Phase 23 PR1 commit | PM 결재 대기 |
| Phase 23 PR2/PR3 | 미진입 (PR1 commit 후 별도 turn) |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-14 | Phase 23 PR1 — PBP → ScoreMark / FoulMark 역변환 헬퍼 2개 + PaperPBPRow 타입 + vitest 24 케이스 | ✅ tsc 0 / 본 PR vitest 24/24 / 회귀 204/204 / page.tsx 변경 0 / commit 대기 |
| 2026-05-14 | Phase 23 설계 분석 (planner-architect / read-only) — score-sheet 재진입 자동 로드 (PBP 역변환 + prop drilling + edge case 10) | ✅ 분석 박제 완료 / 사용자 결재 5건 대기 / 코드 변경 0 / PR 3+1 분해 |
| 2026-05-14 | Phase C — status="completed" score safety net (sync 누락 자동 보정) + Phase 22 knowledge 박제 + scripts/_temp 정리 | ✅ vitest 8/8 / tsc 0 / commit 분리 (Phase C + knowledge) |
| 2026-05-13 | FIBA Phase 21+22 — 종이 매치 박스스코어 6 컬럼 hide + LIVE API OT 표시 fix (paper PBP `clock=0` ↔ STL 보정 충돌) | ✅ tsc 0 / vitest 725/726 / commit `171de67` + `63c0633` / PR #474 dev + #475 main 머지 / 운영 배포 / 사용자 검증 완료 (OT1=3/2 / 박스스코어 13 컬럼) |
| 2026-05-13 | UI-3 wizard bracketSettings + UI-4 사이트 영역 제거 (-249 LOC) | ✅ commit `8478a24` |
| 2026-05-13 | UI-2 wizard 압축 (3-step → 1-step) + ?legacy=1 안전망 | ✅ commit `60dd37e` |
| 2026-05-13 | P2 dual 정합성 경고 + UI-1.5 ?step=2 anchor | ✅ commit `e8adc1a` |
| 2026-05-13 | P0 GameTime 역파싱 + P1 divFees 입력 UI 핫픽스 | ✅ commit `8a27f8a` |
| 2026-05-13 | FIBA Phase 20 PTS 자동 집계 | ✅ commit `5a53fb3` |
| 2026-05-13 | UI-1.1/1.2/1.3 wizard UX 보강 (textarea + 시리즈 인라인) | ✅ 묶음 commit |
| 2026-05-13 | 코치 자가수정 — 최초 1회 setup 흐름 4-분기 | ✅ commit `7689e3f` |
| 2026-05-12 | FIBA Phase 17.1 Team Fouls 박스 글자 색 충돌 fix | ✅ commit `07089a7` |

## 미푸시 commit (subin 브랜치)
**0건** — Phase C (`eb4ad9c`) + Phase 22 knowledge (`074c1f7`) + **Phase 23 PR1 (`b7c44d8`)** push 완료. PR #476 (subin → dev) title 갱신 "Phase C + Phase 23 PR1 묶음" — 결재 대기.

## 후속 큐 (미진입)
- **Phase 23 후보** (별도 결재 필요): `score-sheet/[matchId]/page.tsx` 매치 재진입 시 자동 로드 미구현. 현재 라인업만 자동 fill / PBP·quarter_scores 복원 0 → 운영자 빈 폼에서 시작 → 잘못 박제 위험 (본 turn 매치 218 "그대로 진행" → 빈 폼 재제출 → q3 흡수 root). 필요: PBP → ScoreMark 역변환 헬퍼 + form 초기값 prop drilling. 큰 작업 별 PR.
- UI-1.4 entry_fee 사용자 보고 재현 (커뮤니케이션 — 코드 0)
- **GNBA 8팀 코치 안내**: 자가수정 진입 시 본인 이름/전화 입력 = 자동 setup. 시드 이름 mismatch 시 401 → 운영자 수동 보정 필요
