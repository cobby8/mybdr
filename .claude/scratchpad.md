# 작업 스크래치패드

## 현재 작업
- **요청**: 점수 정합성 영구 fix Sprint 1 — F3-α + F3-β + F5 + F2 통합 기획설계 (2026-05-21)
- **상태**: ✅ PR-1 (F3-α) + ✅ PR-2 (F3-β) + ✅ PR-3 (F5) developer 박제 완료 — tsc 0 / 회귀 0
- **현재 담당**: tester (PR-1 + PR-2 + PR-3 검증 진입 대기) → 이후 PR-4 (F2) developer
- **세션 산출물 (cumulative)**:
  - audit 2건: `Dev/score-consistency-audit-2026-05-21.md` (125 매치) + `Dev/paper-mode-precise-audit-2026-05-21.md` (paper 6 매치 상세)
  - script 2건: `scripts/_temp/score-consistency-audit.ts` + `scripts/_temp/paper-mode-precise-audit.ts` (모두 SELECT only / 사후 정리 예정)
  - errors.md +2 / decisions.md +2 / lessons.md +1 / index.md 갱신
- **paper 모드 결함 근본 원인 코드 위치 확정**:
  | 분류 | 코드 위치 | 결함 |
  |------|----------|------|
  | C (MPS +2점) | `match-sync.ts:488~559` | MPS upsert에 deleteMany 없음 (PBP만 가드) → stale stat 누적 |
  | D (헤더만 SET) | `tournaments/[id]/matches/[matchId]/route.ts:171~189` | PATCH route 가 헤더만 박제 / QS/MPS/PBP 박제 0 |
  | B (PBP 일부) | 위 두 결함 결합 패턴 (matches 208) | score-sheet 부분 박제 + 어드민 PATCH 헤더 단독 |
- **Sprint 1 재세팅 (6h → 8h)**: F5 (2h) + F2 (4h) + **F3 (2h) 상향**

## 구현 기록 (PR-1 F3-α MPS deleteMany NOT IN 가드 / developer 2026-05-21)

📝 구현한 기능: MPS upsert 전 `deleteMany NOT IN incoming ttp` 가드 — paper 매치 score-sheet submit 반복 호출 시 stale stat 정정 (강남구 매치 159/164/186 +2점 사일런트 누적 재발 차단)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/services/match-sync.ts` | +15 LOC (line 507~521) — `incomingTtpIds.map(BigInt)` 후 deleteMany NOT IN 호출. PBP 패턴 (line 581~592) 답습 / 주석 한국어 6줄 (errors.md [2026-05-21] 인용) | 수정 |
| `src/__tests__/lib/match-sync.test.ts` | +222 LOC (4 케이스 C1~C4) — describe block "MPS deleteMany NOT IN 가드 (F3-α)" 신규 / setupMocks + makeStat 헬퍼 + existingMatchStub | 수정 |

**검증 결과**:
- `npx tsc --noEmit` → EXIT=0 (0 errors)
- `npx vitest run src/__tests__/lib/match-sync.test.ts` → **27 tests passed (기존 23 + 신규 4)**
- `git diff --stat HEAD -- src/` PR-1 관련 라인:
  ```
  src/__tests__/lib/match-sync.test.ts  | 222 +++++++++++
  src/lib/services/match-sync.ts        |  15 ++
  ```

**vitest 4 케이스 결과**:
| 케이스 | 검증 포인트 | 결과 |
|--------|------------|------|
| C1 (incoming=기존 [1,2,3]) | deleteMany NOT IN [BigInt(1), BigInt(2), BigInt(3)] + upsert 3회 | ✅ PASS |
| C2 (incoming [1,2] / 기존 [1,2,3] 시나리오) | NOT IN [BigInt(1), BigInt(2)] → DB 가 ttp [3] 자동 정정 + upsert 2회 | ✅ PASS |
| C3 (신규 매치 incoming [4,5]) | NOT IN [BigInt(4), BigInt(5)] (실 삭제 0) + upsert 2회 | ✅ PASS |
| C4 (player_stats=undefined) | **deleteMany 미호출 (회귀 0 / 운영 stat 전체 보존)** | ✅ PASS |

💡 tester 참고:
- 테스트 방법: `npx vitest run src/__tests__/lib/match-sync.test.ts` (27/27 PASS 확인)
- 정상 동작:
  - paper 매치 score-sheet submit 반복 호출 시 incoming ttp set 외 stale stat 자동 삭제
  - Flutter sync (player_stats undefined 케이스) 는 기존 동작 보존 (회귀 0)
- 주의할 입력:
  - C4 (player_stats=undefined) = **회귀 가드의 핵심**. if 블록 진입 자체 차단 보장.
  - isReset 분기 (status='scheduled' + stats/PBP 0건) = 이미 line 498 전체 deleteMany 수행 → 이중 삭제 안 됨

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  1. PBP `deleteMany NOT IN` 패턴 (line 581~592) 답습 정확성 — `manual-fix-` 보호는 MPS 미해당 (단순 NOT IN 만)
  2. `BigInt(s.tournament_team_player_id)` 캐스팅 — Prisma `tournamentTeamPlayerId` 컬럼이 BigInt 이므로 일치
  3. 트랜잭션 X — PBP 패턴 동일 (deleteMany + upsert 순차 / 같은 if 블록 안)
  4. C4 회귀 가드 = if 블록 자체 미진입 = 운영 stat 손실 0 보장

## 구현 기록 (PR-3 F5 FIBA 룰 가드 / developer 2026-05-21)

📝 구현한 기능: PURE 헬퍼 `assertCompletedMatchFiba` 신규 + paper(score-sheet submit) + Flutter (v1 sync + batch-sync) 양면 호출 가드 — OT1 동점 + winner NULL completed 차단 (매치 124 OT2 사고 재발 방지 / FIBA Article 17.2)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/tournaments/fiba-rules.ts` | 121 LOC 신규 — PURE 헬퍼 `assertCompletedMatchFiba(input)` / DB I/O 0 / 6 분기 (OT1 동점 차단 + OT2+ 통과 + winner 있음 통과 + 점수차 통과 + in_progress 통과 + regulation 동점 차단) | **신규** |
| `src/__tests__/lib/fiba-rules.test.ts` | 202 LOC 신규 — 13 케이스 (F1~F6 위임 6 + winnerTeamId 타입 5 + currentQuarter 미박제 2) | **신규** |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | +30 LOC (import 3줄 + 가드 27줄 line ~1062 직전) — paper 모드 `winnerTeamId: null` + `currentQuarter: input.running_score?.currentPeriod` + 위반 시 422 `FIBA_*` 응답 | 수정 |
| `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` | +35 LOC (import 4줄 + 가드 28줄 line ~140 직후 modeRow 가드 다음) — Flutter sync body `match.current_quarter` 활용 / `winnerTeamId: null` (service 자동 결정) / 위반 시 422 `FIBA_*` 응답 | 수정 |
| `src/app/api/v1/tournaments/[id]/matches/batch-sync/route.ts` | +41 LOC (import 4줄 + per-match 가드 22줄 + catch safeReason 매핑 2건 추가) — `existing.winner_team_id` 활용 / `currentQuarter = quarterScores.length` 추정 / throw FIBA_* → 외부 catch 매핑 | 수정 |

**검증 결과**:
- `npx tsc --noEmit` → **EXIT=0 (0 errors)**
- `npx vitest run fiba-rules.test.ts + recording-mode.test.ts + match-sync.test.ts` → **60/60 PASS**
  - fiba-rules: 13/13 ✅
  - recording-mode (회귀): 20/20 ✅
  - match-sync (회귀): 27/27 ✅
- `git diff --stat HEAD -- src/` PR-3 관련 라인:
  ```
  src/app/api/v1/tournaments/[id]/matches/batch-sync/route.ts | 41 ++++++++++++++++
  src/app/api/v1/tournaments/[id]/matches/sync/route.ts      | 35 ++++++++++++++
  src/app/api/web/score-sheet/[matchId]/submit/route.ts      | 30 ++++++++++++
  src/lib/tournaments/fiba-rules.ts (신규)                    | 121 LOC
  src/__tests__/lib/fiba-rules.test.ts (신규)                | 202 LOC
  ```

**vitest 13 케이스 결과**:
| 케이스 | given | expect | 결과 |
|--------|-------|--------|------|
| F1 | OT1 (q=5) 70-70 winner=null completed | ❌ FIBA_OT1_TIE_REQUIRES_OT2 | ✅ PASS |
| F2 | OT1 70-72 winner=away(BigInt) completed | ✅ ok | ✅ PASS |
| F3 | OT2 (q=6) 70-70 winner=null completed | ✅ ok (OT2+ 통과) | ✅ PASS |
| F4 | regulation (q=4) 70-70 winner=null completed | ❌ FIBA_TIE_WITHOUT_WINNER | ✅ PASS |
| F5 | in_progress 70-70 winner=null | ✅ ok (진행 중 통과) | ✅ PASS |
| F6 | OT1 70-70 winner=home(BigInt) completed | ✅ ok (운영자 결정 보존) | ✅ PASS |
| 보너스 5건 | winnerTeamId = BigInt/string/number/''/0 hasWinner 판정 | 정확 | ✅ 5/5 PASS |
| 보너스 2건 | currentQuarter undefined 시 regulation 처리 + 점수차 통과 | 정확 | ✅ 2/2 PASS |

**회귀 0 보장 근거**:
1. **신규 헬퍼 = PURE 함수 / DB I/O 0** → service / Prisma / 기타 코드 영향 0
2. **score-sheet submit**: `winnerTeamId: null` 고정 + `currentQuarter` = running_score 의존 (없으면 regulation 처리) → 기존 paper 매치 종료 흐름 (점수차 매치) 100% 통과
3. **v1 sync**: 신규 가드 = modeRow 가드 다음 위치 / `currentQuarter` = Flutter sync body 의 optional 필드 → 기존 Flutter 매치 (점수차 매치 + winner 자동 결정) 100% 통과
4. **v1 batch-sync**: `existing.winner_team_id` 활용 → Flutter 기존 매치 winner 갱신 박제 흐름 보존. `currentQuarter` = `quarterScores.length` 추정 → 점수차 매치 100% 통과
5. **catch safeReason 매핑**: 신규 FIBA_OT1_TIE_REQUIRES_OT2 / FIBA_TIE_WITHOUT_WINNER 2건만 추가 → 기존 RECORDING_MODE_PAPER / Match not found / Sync failed 모두 보존

💡 tester 참고:
- 테스트 방법:
  1. **vitest**: `npx vitest run src/__tests__/lib/fiba-rules.test.ts` → 13/13 PASS 확인
  2. **paper 매치 (score-sheet submit)**: paper 매치에 OT1 70-70 + status=completed + running_score.currentPeriod=5 POST → **422 `FIBA_OT1_TIE_REQUIRES_OT2`**
  3. **paper 매치 정상**: paper 매치에 OT1 70-72 (점수차) + status=completed → **통과** (회귀 0)
  4. **paper 매치 OT2**: paper 매치에 OT2 70-70 (currentPeriod=6) + status=completed → **통과** (운영자 OT2 박제 흐름 보존)
  5. **Flutter sync (v1)**: Flutter app 이 OT1 동점 자동 종료 박제 → server-side 422 응답 (Flutter 앱 변경 0 / 사용자 결재 의무)
  6. **Flutter batch-sync**: Flutter app batch 동기화 시 OT1 동점 매치 1건 → errors[] 에 매치별 reason 박제 + 나머지 정상 매치 synced
- 정상 동작:
  - 응답 body: `{error: "OT1 동점 매치는 종료할 수 없습니다. ...", code: "FIBA_OT1_TIE_REQUIRES_OT2", match_id: "124"}`
  - in_progress 매치 = 모든 분기 통과 (가드 활성 X)
  - 점수차 매치 = 모든 분기 통과
- 주의할 입력:
  - **score-sheet submit**: `winnerTeamId: null` 고정 → paper 매치는 동점 시 항상 FIBA 가드 분기 진입 (의도된 동작)
  - **v1 sync**: `match.current_quarter` zod 범위 0~8 — `undefined` 시 regulation 처리 (Flutter 앱이 미박제 시)
  - **v1 batch-sync**: `quarterScores` 미박제 시 `currentQuarter = undefined` → regulation 처리. quarterScores 길이가 1~7 일 때 정상 분기

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  1. **PURE 헬퍼 분리** = vitest 단위 검증 가능 / 양면 호출자 단일 source / 변경 시 6 분기 일관 보장
  2. **paper 모드 `winnerTeamId: null` 고정 결정**: score-sheet submit 에는 winner 박제 0 (service 자동 결정) → null 로 가드 통과 시도. 의도 = 운영자가 OT2 진입 결정 없이 동점 매치 종료 시도 시 차단
  3. **v1 sync `winnerTeamId: null` 결정**: Flutter sync body 에 winner_team_id 박제 0 (service 자동 결정) → service 진입 전 가드라 db 의 기존 winner 확인 불가 → null. 단 batch-sync 는 existing row 확보되어 winner 활용 (더 정확)
  4. **batch-sync `currentQuarter` 추정**: quarterScores.length 추정 = approximation. OT2+ 매치 박제 시 quarterScores 길이 6~ 보장 (정확). regulation 매치 = length 4 (정확). 한계 = 비정상 quarterScores 박제 시 mis-classification 가능 (운영 영향 0 — 어느 분기든 결과 = FIBA_TIE_WITHOUT_WINNER vs FIBA_OT1_TIE_REQUIRES_OT2 중 1건 차단)
  5. **사용자 결재 (CLAUDE.md "Flutter 앱 변경 시 원영 사전 공지 의무")**: Flutter server-side 만 변경 / Flutter 클라이언트 코드 0 변경. OT1 동점 시 422 응답 → Flutter 앱이 받게 됨. **PR 머지 후 원영 사후 공지 의무** (PR 본문 + commit message 명시 필수)
  6. **OT2+ 통과 룰**: 매치 124 사고 박제 흐름 보존 — 운영자가 OT2 박제 진행 중 또는 사후 박제 케이스. 무한 OT 시 어느 시점 winner 결정 필요하지만 본 가드는 OT2+ 통과 (Sprint 2 별도 안내)

## 구현 기록 (PR-2 F3-β 어드민 PATCH paper 매치 score 차단 / developer 2026-05-21)

📝 구현한 기능: 어드민 PATCH route 에 paper 매치 score 차단 가드 — score-sheet BFF 단일 진입점 의무화 (강남구 매치 170/187 = 헤더만 박제 / 4 source 중 헤더 단독 박제 재발 차단)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts` | +20 LOC (import 3줄 line 18~20 + 가드 17줄 line 169~185) — `getRecordingMode({ settings: match.settings })` + paper && score 변경 시 403 `RECORDING_MODE_PAPER_SCORE_BLOCKED` 반환. updateMatch 호출 직전 위치 (effectiveStatus 계산 후) | 수정 |

**검증 결과**:
- `npx tsc --noEmit` → EXIT=0 (0 errors)
- `npx vitest run src/__tests__/lib/recording-mode.test.ts` → **20/20 PASS** (회귀 0 / 헬퍼 의존 검증)
- `git diff --stat HEAD -- src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts`:
  ```
  src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts | 20 ++++++++
  ```

**옵션 B 채택 사유 (route 안 인라인 가드 / vitest 통합 0)**:
- recording-mode 헬퍼는 이미 vitest 20 케이스 커버 (이중 검증 비용 ↑)
- 단순 분기 추가 (`if (recordingMode === "paper" && scoreFieldChanged)`) — route 통합 테스트 비용 高 (Prisma mock 全면 필요)
- Flutter 매치 = score 변경 통과 (기존 동작 보존) — 회귀 위험 매우 낮음

💡 tester 참고:
- 테스트 방법:
  1. paper 매치 (settings.recording_mode="paper") 에 `PATCH /api/web/tournaments/{id}/matches/{matchId}` body `{homeScore: 10}` 호출 → **403 응답 + code="RECORDING_MODE_PAPER_SCORE_BLOCKED"** 확인
  2. paper 매치에 score 외 메타 (venue_name 등) 만 수정 → **통과** 확인 (paper 매치도 메타 수정 허용)
  3. Flutter 매치 (settings.recording_mode 없음 또는 "flutter") 에 score 수정 → **통과** 확인 (회귀 0)
  4. paper 매치에 `body={awayScore: 5}` (homeScore 없음) → **403 차단** 확인 (awayScore 만 단독 변경도 차단)
- 정상 동작:
  - paper 매치 score 차단 메시지: "종이 기록지 모드 매치는 점수를 직접 수정할 수 없습니다. score-sheet 페이지에서 입력해주세요."
  - 응답 본문: `{error, code, match_id, current_mode: "paper"}` (snake_case 변환 자동)
- 주의할 입력:
  - body 에 `homeScore: null` (명시적 null) — `homeScore !== undefined` 이므로 가드 진입 → 차단 (의도된 동작 / paper 매치 score 정합성 보호)
  - body 에 `homeScore` 키 없음 — 가드 미진입 → 통과 (메타 수정 허용)

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  1. **가드 위치**: `effectiveStatus` 계산 직후 + `updateMatch` 호출 직전 — auto-schedule 흐름 (line 154~164) 영향 0 / homeTeamId·awayTeamId 진출 destination 가드 (line 95~132) 영향 0
  2. **`getRecordingMode({ settings: match.settings })`** — `getMatch` 가 `findFirst` 로 전체 필드 반환 (`src/lib/services/match.ts:93~97`) → `match.settings: Prisma.JsonValue | null` 자동 포함
  3. **score 외 메타 통과 의도**: venue / scheduledAt / status / 팀 (homeTeamId·awayTeamId) / winner_team_id / notes / roundName 모두 paper 매치에서도 수정 허용 — 운영자가 종이 기록지 외부에서 메타 정정 필요 케이스 보존
  4. **status="completed" + winner_team_id 만 변경 (score 미변경)** = 통과 → finalizeMatchCompletion 호출 진입. paper 매치 종료 운영 흐름 (별도 score-sheet finalize 이후 status 변경) 보존

## 구현 기록 (prospectus AI Phase 1-A + 1-B / PM 직접 박제 2026-05-19~20)
- **신규 파일 3건** (총 527L / 외부 npm 1건 추가 = `ai@^6.0.185`)
  - `src/lib/ai/prospectus-schema.ts` (167L / 1-A) — Zod schema 4그룹 + 필드별 `_confidence`+`_source_excerpt` + thresholds (0.95/0.6) + camelCase
  - `src/lib/ai/prospectus-prompt.ts` (120L / 1-A) — `buildSystemPrompt()` / `buildUserPrompt({source})` / `PROSPECTUS_PROMPT_VERSION="v1"` / `MAX_OUTPUT_TOKENS=2000`
  - `src/lib/ai/gateway.ts` (240L / 1-B 신규) — `analyzeProspectus()` + `AIAnalysisError(code)` 5종 분리 + AI_GATEWAY_API_KEY 사전 가드
- **Phase 1-B 핵심**: 모델 = `"anthropic/claude-sonnet-4"` plain 문자열 (Vercel Gateway 자동) / PDF (prompt) + image (vision messages `type:"image"` + `mediaType`) 분기 / `AbortSignal.timeout(30_000)` / audit 반환 = `usage`+`durationMs`+`promptVersion`+`modelId`
- **검증**: `npx tsc --noEmit` → 0 errors (양 commit) / 회귀 0 (신규 폴더 / 시그니처 변경 0)
- **참조 보고서**: `Dev/prospectus-ai-wizard-plan-2026-05-18.md` §3 §4

## 기획설계 (2026-05-21 — 점수 정합성 Sprint 1 / F3-α + F3-β + F5 + F2)

🎯 목표: 점수 4 source 정합성 영구 fix Sprint 1 (8h / 운영 영향 0 / 회귀 0) — 강남구 paper 매치 159/164/186 (F3-α) + 170/187 (F3-β) 재발 차단 + 매치 124 OT1 사고 (F5) 재발 차단 + 일일 검출 layer (F2)

### 📍 PR 분해 — 4개 별도 PR 권장 (1 통합 PR ❌ / 2 묶음 ❌)
| PR | 시간 | 코드 위치 | 회귀 위험 | 진입 순서 |
|----|------|----------|----------|----------|
| **PR-1 (F3-α)** | 1h | `src/lib/services/match-sync.ts:507~559` MPS upsert 전 deleteMany 추가 | 낮음 (PBP 패턴 답습 / Flutter+paper 양면 ttp 외 stat 삭제) | **1번째** — 단순/단일 함수/회귀 0 |
| **PR-2 (F3-β)** | 1h | `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts:165` 직전 paper 매치 score 차단 가드 | 낮음 (paper 매치만 차단 / Flutter 경로 보존) | **2번째** — 단일 route / vitest 4 케이스 |
| **PR-3 (F5)** | 2h | 신규 `src/lib/tournaments/fiba-rules.ts` PURE 헬퍼 + score-sheet submit + v1 sync route 양면 호출 | 중간 (Flutter v1 영향 / OT2 박제 시점 통과 룰) | **3번째** — 헬퍼 신규 / vitest 6 케이스 |
| **PR-4 (F2)** | 4h | 신규 `src/app/api/cron/score-consistency/route.ts` + `vercel.json` cron + admin 대시보드 위젯 1개 | 매우 낮음 (read-only / 검출만 / 박제 0) | **4번째** — 독립 신규 라우트 |

**1개 통합 PR 거절**: 4개 영역 (service / route / 헬퍼+양면 / cron+UI) 코드 위치 분산 → review 비용 ↑ + 부분 rollback 불가. 별도 PR = 각 PR 회귀 가드 독립 + 즉시 운영 진입.

### 🔧 PR-1 (F3-α) MPS deleteMany 가드
**변경 위치**: `match-sync.ts:507` `if (player_stats && player_stats.length > 0) {` 안 첫 줄 추가

```ts
// PBP 패턴 (line 567~578) 답습 — incoming ttp set 외 stale stat 삭제
const incomingTtpIds = player_stats.map(s => BigInt(s.tournament_team_player_id));
await prisma.matchPlayerStat.deleteMany({
  where: { tournamentMatchId: matchId, NOT: { tournamentTeamPlayerId: { in: incomingTtpIds } } },
});
```

**회귀 가드 + vitest** (`src/lib/services/__tests__/match-sync.test.ts` 추가):
| 케이스 | given | expect |
|--------|-------|--------|
| C1 | 기존 ttp [1,2,3] DB + incoming ttp [1,2,3] | upsert 3건 / delete 0건 |
| C2 | 기존 ttp [1,2,3] DB + incoming ttp [1,2] | ttp [3] 삭제 / [1,2] upsert |
| C3 | 기존 ttp [] DB + incoming ttp [4,5] | create 2건 / delete 0건 |
| C4 | `player_stats=undefined` | deleteMany 미실행 / 기존 stat 보존 (회귀 0) |

### 🔧 PR-2 (F3-β) 어드민 PATCH paper 매치 score 차단
**변경 위치**: `matches/[matchId]/route.ts:88` (winner_team_id 검증 직후)

```ts
// paper 매치 + score 변경 시 차단 — score-sheet 경유 의무 (decisions.md [2026-05-21])
const isPaperMode = getRecordingMode(match) === "paper";
const scoreFieldChanged = homeScore !== undefined || awayScore !== undefined;
if (isPaperMode && scoreFieldChanged) {
  return apiError("종이 기록지 모드 매치는 점수 직접 수정 불가. score-sheet 페이지에서 입력하세요.", 403, "RECORDING_MODE_PAPER_SCORE_BLOCKED");
}
```

**회귀 가드 + vitest** (`route.test.ts` 또는 통합 테스트):
| 케이스 | given | expect |
|--------|-------|--------|
| B1 | paper 매치 + body `{homeScore: 10}` | 403 RECORDING_MODE_PAPER_SCORE_BLOCKED |
| B2 | paper 매치 + body `{venue_name: "X"}` (score 외) | 통과 (paper 매치도 메타 수정 허용) |
| B3 | flutter 매치 + body `{homeScore: 10}` | 통과 (회귀 0 / 기존 동작) |
| B4 | paper 매치 + status=completed 이미 박제 + body `{homeScore: 10}` | 403 (운영자 정정 요청 시 별도 흐름 필요 — Sprint 3 F4) |

### 🔧 PR-3 (F5) FIBA 룰 가드 — PURE 헬퍼 분리 + 양면 호출
**신규 파일**: `src/lib/tournaments/fiba-rules.ts` (PURE 함수만 / DB I/O 0)

```ts
type FibaCheckInput = {
  homeScore: number;
  awayScore: number;
  status: string;
  winnerTeamId: bigint | null;
  currentQuarter?: number;  // 1~7 (Q1~Q4=1~4 / OT1~OT3=5~7)
  recordingMode: "flutter" | "paper";
};
type FibaCheckResult = { ok: true } | { ok: false; code: string; message: string };

export function assertCompletedMatchFiba(input: FibaCheckInput): FibaCheckResult {
  if (input.status !== "completed") return { ok: true };
  // 1) 동점 + winner NULL = FIBA 위반 (regulation/OT 무관)
  if (input.homeScore === input.awayScore && input.winnerTeamId === null) {
    return { ok: false, code: "FIBA_TIE_WITHOUT_WINNER", message: "..." };
  }
  // 2) OT1 (currentQuarter=5) + 동점 = FIBA 위반 (OT2 박제 필요)
  if (input.currentQuarter === 5 && input.homeScore === input.awayScore) {
    return { ok: false, code: "FIBA_OT1_TIE_REQUIRES_OT2", message: "..." };
  }
  return { ok: true };
}
```

**호출 위치 2건**:
1. `src/app/api/web/score-sheet/[matchId]/submit/route.ts` — service 호출 직전 paper 매치 check
2. `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` + `/batch-sync/route.ts` — service 호출 직전 flutter 매치 check

**회귀 가드 + vitest** (`fiba-rules.test.ts` PURE 헬퍼 단위):
| 케이스 | given | expect |
|--------|-------|--------|
| F1 | OT1 (quarter=5) 70-70 + winner NULL + completed | ❌ FIBA_OT1_TIE_REQUIRES_OT2 |
| F2 | OT1 70-72 + winner=away + completed | ✅ ok (정상 OT1 종료) |
| F3 | OT2 (quarter=6) 70-70 + winner NULL + completed | ✅ ok (운영자 OT2 박제 의도 보존 — 별도 안내 / Sprint 2) |
| F4 | regulation (quarter=4) 70-70 + winner NULL + completed | ❌ FIBA_TIE_WITHOUT_WINNER |
| F5 | in_progress + 70-70 + winner NULL | ✅ ok (진행 중 동점 정상) |
| F6 | OT1 70-70 + winner=home + completed (운영자 추첨 등) | ✅ ok (winner 있으면 통과 / 사용자 결재 의존) |

### 🔧 PR-4 (F2) Daily PBP vs MPS cron + admin 알림
**구조** (4 파일):
| 파일 | 역할 |
|------|------|
| `src/app/api/cron/score-consistency/route.ts` 신규 | CRON_SECRET Bearer 가드 + 125 매치 audit 로직 답습 + 결과 DB 박제 |
| `vercel.json` 수정 | `{ "path": "/api/cron/score-consistency", "schedule": "0 1 * * *" }` (매일 01:00 KST 새벽) |
| `prisma/schema.prisma` 수정 | 신규 모델 `score_consistency_audit` (NULL 허용 ADD / 무중단 / `audited_at` + `match_id` + `mismatch_type` + `details` JSON) |
| `src/app/(admin)/tournament-admin/page.tsx` 수정 | `ScoreConsistencyAlertCard` 위젯 1개 (최근 24h 불일치 매치 수 + "상세 보기" 링크) |

**cron 로직** (audit script 답습):
- completed 매치만 SELECT (paper + flutter 모두 / game_clock_seconds 무관)
- MPS 합 vs PBP 합 (made events) vs match.homeScore/awayScore 3-way 비교
- 불일치 시 `score_consistency_audit` INSERT (mismatch_type = "PBP_MPS_DIFF" | "MPS_HEADER_DIFF" | "QS_ZERO")
- 응답 = `{ ok: true, audited: N, mismatches: M }`

**회귀 가드 + vitest** (mock prisma + 합성 매치 데이터):
| 케이스 | given | expect |
|--------|-------|--------|
| A1 | 4 source 정합 매치 1건 | INSERT 0건 / response.mismatches=0 |
| A2 | MPS 9 / PBP 7 / 헤더 7 (159 패턴) | INSERT 1건 type=PBP_MPS_DIFF |
| A3 | MPS=PBP=헤더 7 / QS=0-0 (E 분류) | INSERT 1건 type=QS_ZERO |
| A4 | CRON_SECRET 헤더 누락 | 401 응답 / SELECT 0건 (가드 정확) |

### 🔗 기존 코드 연결
- F3-α = PBP `deleteMany NOT IN` 패턴 (line 567~578) 의 MPS 답습 (단일 source / Flutter+paper 양면)
- F3-β = `getRecordingMode(match)` 헬퍼 재사용 (`recording-mode.ts:49`) — 신규 분기 0
- F5 = `recording-mode.ts` 헬퍼 의존 0 (PURE 헬퍼 / mode 도 input 으로 받음 — 양면 호출자에서 추출)
- F2 = `series-counter-audit/route.ts` 패턴 답습 (Bearer 가드 + DRY-RUN + console.warn → DB INSERT 로 확장)

### 📋 실행 계획
| 순서 | 작업 | 담당 | 선행 | 비고 |
|------|------|------|------|------|
| 1 | PR-1 (F3-α) 박제 + vitest 4 케이스 | developer | 없음 | 1h |
| 2 | tester + reviewer (PR-1) | 둘 (병렬) | 1단계 | tsc + vitest + 회귀 가드 |
| 3 | PR-2 (F3-β) 박제 + vitest 4 케이스 | developer | 2단계 | 1h |
| 4 | tester + reviewer (PR-2) | 둘 (병렬) | 3단계 | |
| 5 | PR-3 (F5) 헬퍼 + 양면 호출 + vitest 6 케이스 | developer | 4단계 | 2h / **사용자 결재 §F5 OT2 통과 룰 확인 필수** |
| 6 | tester + reviewer (PR-3) | 둘 (병렬) | 5단계 | Flutter v1 영향 검토 |
| 7 | PR-4 (F2) cron + schema + admin 위젯 + vitest 4 케이스 | developer | 6단계 | 4h / **prisma db push NULL ADD 사용자 결재 필수** |

⚠️ developer 주의사항:
- **PR-1**: PBP deleteMany 패턴 (line 567~578) 정확 답습 — `manual-fix-` 보호는 MPS 미해당 (단순 NOT IN 만)
- **PR-2**: `getRecordingMode(match)` 호출 위치는 line 88 (winner_team_id 검증 직후 / updateMatch 호출 전)
- **PR-3**: PURE 헬퍼 vitest 가 양면 호출보다 우선 — 헬퍼 단위 6 케이스 통과 후 양면 통합
- **PR-4**: `prisma db push` NULL 허용 ADD COLUMN 만 (CLAUDE.md DB 정책 §1 — destructive 사용자 결재). `schema diff` 사용자 검토 후 진행
- **공통**: snake_case 자동 변환 (errors.md 2026-04-17 재발 5회) — 신규 응답 필드 추가 시 raw curl 1회 검증

📊 효과 예측 (audit 125 매치 기반):
| 분류 | 현재 | F3-α 후 | F3-β 후 | F5 후 | F2 후 |
|------|------|---------|---------|-------|-------|
| C (MPS 사일런트) | 3건 | 0건 (신규) | — | — | — |
| D (헤더 단독) | 2건 | — | 0건 (신규) | — | — |
| FIBA 위반 | 1건 (124) | — | — | 0건 (신규) | — |
| 검출 layer | 0 | — | — | — | 일일 검출 ✅ |

📝 분석 산출물 박제 위치 (knowledge):
- 본 기획설계 → 본 scratchpad
- F3-α + F3-β 코드 위치 확정 → errors.md [2026-05-21] 이미 박제
- F1~F6 우선순위 + Sprint 1 상향 → decisions.md [2026-05-21] 이미 박제

---

## 기획설계 (2026-05-18 — prospectus-ai-wizard)

🎯 목표: 대회 요강 PDF/이미지 업로드 → Claude Sonnet 4 분석 → wizard ~25 필드 자동 채움 (opt-in / 운영 DB 영향 0)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `src/lib/ai/gateway.ts` | Vercel AI Gateway 클라이언트 래퍼 | 신규 |
| `src/lib/ai/prospectus-prompt.ts` | system/user prompt + few-shot 2건 | 신규 |
| `src/lib/ai/prospectus-schema.ts` | Zod schema (필드 + confidence + source) | 신규 |
| `src/app/api/web/tournaments/wizard/analyze-prospectus/route.ts` | POST endpoint | 신규 |
| `prisma/schema.prisma` | `prospectus_ai_analysis` 모델 추가 (NULL 허용 ADD) | 수정 |
| `src/app/(admin)/.../wizard/prospectus/page.tsx` | 업로드+미리보기 UI | 신규 |
| `src/components/tournament/prospectus-upload-dropzone.tsx` | drag&drop+MIME 검증 | 신규 |
| `src/components/tournament/prospectus-analysis-preview.tsx` | 결과 표 (✅⚠️❌ 토글) | 신규 |
| `src/lib/tournaments/prospectus-to-draft.ts` | analysis → WizardDraft 매핑 | 신규 |
| `src/app/(admin)/.../wizard/page.tsx` | 헤더 우측 "📄 요강 업로드" 버튼 (시그니처 0) | 수정 |

🔗 기존 코드 연결:
- WizardDraft sessionStorage (`wizard:tournament:draft`) 그대로 사용 — 매핑만 추가
- 기존 4 폼 시그니처 변경 0 (회귀 0 보장)
- `apiSuccess`/`withAuth`/`RATE_LIMITS` 기존 패턴 재사용

📋 실행 계획:
| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | AI Gateway 활성화 + env | 사용자 | 결재 |
| 2 | schema + db push (NULL ADD) | developer | 1 |
| 3 | lib/ai/ 3파일 | developer | 2 |
| 4 | API route + 가드 | developer | 3 |
| 5 | vitest 단위 (mock AI) | tester | 4 |
| 6 | wizard/prospectus UI 3파일 | developer | 4 |
| 7 | tester + reviewer (병렬) | 둘 | 6 |

⚠️ developer 주의: snake_case 응답 / 4 폼 시그니처 동결 / Zod safeParse 통과 필드만 적용 / 비용 max_tokens 강제

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
| 2026-05-21 | PR-3 (F5) developer 박제 — FIBA 룰 가드 (OT1 동점 + winner NULL completed 차단) | ✅ `src/lib/tournaments/fiba-rules.ts` 신규 121 LOC (PURE 헬퍼 `assertCompletedMatchFiba` / 6 분기) + `src/__tests__/lib/fiba-rules.test.ts` 신규 202 LOC (13 케이스 = F1~F6 6 + 보너스 7) + 양면 호출 가드 3건 (score-sheet submit +30 / v1 sync +35 / v1 batch-sync +41 LOC) / tsc 0 / vitest 60/60 PASS (fiba 13 + recording-mode 20 회귀 + match-sync 27 회귀) / Flutter server-side / 클라이언트 코드 0 변경 / 매치 124 OT2 사고 재발 방지 / tester 검증 대기 / **원영 사후 공지 의무** |
| 2026-05-21 | PR-2 (F3-β) developer 박제 — 어드민 PATCH paper 매치 score 차단 가드 | ✅ `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts` +20 LOC (import 3줄 + 가드 17줄) / `getRecordingMode({ settings: match.settings })` + paper && (homeScore\|awayScore) 변경 시 403 `RECORDING_MODE_PAPER_SCORE_BLOCKED` / tsc 0 / vitest 20/20 PASS (recording-mode 회귀 0) / Flutter 매치 + paper 매치 메타 수정 보존 / tester 검증 대기 |
| 2026-05-21 | PR-1 (F3-α) developer 박제 — MPS deleteMany NOT IN 가드 | ✅ `src/lib/services/match-sync.ts` +15 LOC (line 507~521) + `src/__tests__/lib/match-sync.test.ts` +222 LOC (4 케이스) / tsc 0 / vitest 27/27 PASS (기존 23 + 신규 4) / PBP 패턴 답습 / 회귀 0 (C4 player_stats=undefined 가드) / tester 검증 대기 |
| 2026-05-21 | 점수 정합성 Sprint 1 통합 기획설계 (F3-α + F3-β + F5 + F2 / 8h) | ✅ planner-architect 분석 완료 / 4개 별도 PR 권장 (통합 PR 거절 — 영역 분산) / vitest 케이스 18건 박제 (F3-α 4 / F3-β 4 / F5 6 / F2 4) / F5 = `fiba-rules.ts` PURE 헬퍼 신규 (양면 호출 / vitest 가능) / F2 = `score_consistency_audit` 신규 모델 NULL ADD + cron `0 1 * * *` + admin 위젯 1개 / 진입 순서 F3-α → F3-β → F5 → F2 (단순→복잡) / 회귀 0 / 운영 영향 0 |
| 2026-05-21 | 점수 정합성 paper 모드 정밀 조사 + F3 Sprint 1 상향 | ✅ `scripts/_temp/paper-mode-precise-audit.ts` SELECT only / 6 매치 player별+audit log 추적 / `Dev/paper-mode-precise-audit-2026-05-21.md` 박제 / errors.md+decisions.md 각 +1 / 근본 원인 코드 위치 3건 확정 (match-sync.ts:488~559 MPS deleteMany 누락 + matches/[matchId]/route.ts:171~189 PATCH 헤더 단독 박제) / **F3 Sprint 1 상향** (2h 추가 / 총 8h) |
| 2026-05-21 | 점수 정합성 시스템 분석 — 운영 DB 전수 audit + F1~F6 영구 fix 우선순위 박제 | ✅ audit script 박제 (`scripts/_temp/score-consistency-audit.ts` SELECT only) + 실측 (125 매치 / 56% 불일치 / 5 토너먼트 분포) + `Dev/score-consistency-audit-2026-05-21.md` 박제 + errors.md/decisions.md/lessons.md 각 +1 |
| 2026-05-21 | 매치 124 (라이징 vs 제이크루 OT2 75:82) 박제 + 점수 4 source 불일치 진단 + 시스템 분석 | ✅ commit `95ddbea` (OT2 점수+stat+standings) + `d5e3805` (paper+nested) + `b0a49ae` (박스스코어 OT1/OT2 분리 UI) + `a4932bb` (knowledge 박제) / 모두 push / OT2 PBP 41건 INSERT / errors.md +1 lessons.md +2 decisions.md +1 / 영구 fix F1~F6 우선순위 박제 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-3 후속 — /games/[id]/edit 코트 picker 카드 | ✅ commit `fdfff27` / push / PR #633 / 1 파일 +36 -1 / .court-picker 카드 read-only / globals.css 재사용 / tsc 0 / GET /games/552/edit 200 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-3 — guest-apply + report 상단 GameCard 미니 | ✅ commit `7f2fc03` / PR #632 머지 / 2 파일 +138 -21 / 상단 GameCard + tags + report select 확장 / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-2c — 모바일 collapsible 미리보기 + 하단 fixed CTA | ✅ commit `43539f8` / PR #631 머지 / 2 파일 +125 -5 / mobile collapsible + 토글 + fixed CTA 44px / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-2b — 정기 모집 요일 picker + 코트 picker 카드 | ✅ commit `ced6c37` / PR #630 머지 / 3 파일 +371 -55 / RRULE BYDAY + 4주 예고 + court-picker 카드 / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-2a — /games/new 라이브 프리뷰 + 종별 컬러 즉시 반영 | ✅ commit `ffc46c3` / PR #629 머지 / 4 파일 +163 -7 / 2-col grid + 우 sticky GameCard + 인라인 매핑 / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-1c + admin view fix | ✅ commit `c8eaac3` (3-1c) + `f493c9f` (admin fix) / PR #628 머지 / 8 파일 +698 -65 / 2-col → 1-col + Ribbon + 모바일 sticky + 8 CTA 분기 (admin 포함) / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-1b — ParticipantsSlotBoard Concept B 10인 슬롯 | ✅ commit `ed4dcc7` / PR #627 머지 / 3 파일 +504 -8 / 5×2 grid + 호스트 prisma + apply-panel anchor / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 3-1a — GameDetailHero 풀폭 다크 hero band | ✅ commit `ac5e1be` / PR #626 머지 / 3 파일 +572 / hero gradient + countdown + 4-col meta / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 2-3 — /games/my-games 호스팅 GameCard 통일 | ✅ commit `3a9d52a` / PR #625 머지 / 1 파일 +44 -55 / .games-grid + deriveTags 인라인 / tsc 0 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 2-1 — GameCard 전면 리디자인 (Date Tile + Area Chip + Host) | ✅ commit `0399b73` / PR #624 머지 / 5 파일 +617 -262 / globals.css 398L 추가 / listGames +duration_hours / tsc 0 / GET /games 200 |
| 2026-05-20 | 경기 탭 v2.16 박제 Phase 1 — BDR-current 동기화 (v2.14 → v2.16) | ✅ commit `d66eb90` / PR #623 머지 (cobby8) / subin = dev fast-forward / 1218 파일 +279k -1.1k / v2.16 델타 + screens-gd + _archive 보존 |
| 2026-05-20 | prospectus AI wizard Phase 3 (wizard UI 진입 + 분석 미리보기 + sessionStorage 통합) | ✅ commit `c046f73` / +1154L / 4 신규 파일 + 헤더 1건 / 5 상태 분기 (idle/uploading/analyzing/done/failed) / tsc 0 |
| 2026-05-20 | prospectus AI wizard Phase 2 (analyze-prospectus API route + pdf-parse + file-type) | ✅ commit `138d1de` / +670L / 가드 다층 8단 / 응답 분기 8종 / RATE_LIMITS.aiAnalyze 5/min + 일 20건 / tsc 0 |
| 2026-05-20 | prospectus AI wizard Phase 1 PR #620 머지 + subin↔dev 동기화 | ✅ PR #620 머지 (mergedBy=cobby8) / subin = dev fast-forward (8c52ff8) |
| 2026-05-20 | prospectus AI wizard Phase 1-C (prisma `prospectus_ai_analysis` 모델 + db push) | ✅ commit `ea1bd44` / CREATE TABLE 1 + INDEX 3 / 운영 DB 1.55s / 무중단 / tsc 0 / .prisma 타입 399건 |
| 2026-05-20 | prospectus AI wizard Phase 1-B (gateway.ts + ai SDK v6 설치) | ✅ commit `e37ae80` / +345L / tsc 0 / AI_GATEWAY_API_KEY 사용자 발급 완료 |
| 2026-05-20 | 오늘 작업 시작 — dev 머지 + dev서버 실행 | ✅ `492819f` Merge origin/dev (7커밋 catch-up, 충돌 0) / npm run dev port 3001 Ready 4s (Next 16.1.6 Turbopack) |
| 2026-05-19 | prospectus AI wizard Phase 1-A 박제 (Zod schema + prompt 빌더) | ✅ commit `ca99e94` / 2 신규 파일 287L / tsc 0 |
| 2026-05-19 | nonggudan@mybdr.kr 비밀번호 변경 (제작진용 계정) | ✅ id=2989 / bcrypt salt 12 / 검증 PASS / DB UPDATE 1행 / 임시 스크립트 즉시 삭제 |
| 2026-05-18 | 대회 요강 AI 분석 → wizard 자동 채움 기획설계 보고서 | ✅ `Dev/prospectus-ai-wizard-plan-2026-05-18.md` 박제 / 2026-05-19 사용자 결재 완료 |

## 미푸시 commit
- **0건** (모두 push 완료. PR #623 머지 완료 / PR #624 머지 대기)

## 메모
- 강남구협회장배 시합 5/16~5/17 = 운영 중 즉시 fix 다수 (60+ PR main 머지)
- 시안 13 룰 / 운영 DB 정책 (destructive 작업 명시 결재) 모두 보존
- Flutter 앱 연동 = 별도 박제 예정 (사용자 명시)
- scratchpad 압축 룰: 100줄 이내 / 작업 로그 10건 / 가장 오래된 항목 자동 삭제

## 🔜 다음 단계 — Sprint 1 결재 진입 (F5 + F2 + F3 / 8h)
- **완료** (2026-05-21):
  - ✅ 운영 DB 전수 audit (125 매치 SELECT only / 운영 영향 0)
  - ✅ paper 모드 정밀 조사 (6 매치 player별 + audit log + service 코드 검토)
  - ✅ F1~F6 우선순위 + F3 Sprint 1 상향 (decisions.md [2026-05-21] 2건)
  - ✅ 근본 원인 코드 위치 3건 확정 (errors.md [2026-05-21] 2건)
- **Sprint 1 결재 권장 (8h / 운영 영향 0 / 회귀 0 / 즉시 진입 가능)**:
  - **F5 (2h)** FIBA 룰 가드 (OT1 동점 + winner NULL completed 차단 / 매치 124 재발 방지)
  - **F2 (4h)** PBP 검증 cron (daily PBP vs MPS 비교 + admin 대시보드 알림)
  - **F3-α (1h)** service `syncSingleMatch:507~559` MPS deleteMany NOT IN 가드 추가 (PBP 패턴 답습)
  - **F3-β (1h)** 어드민 PATCH `matches/[matchId]/route.ts:171~189` paper 매치 차단 + 운영자 안내
- **Sprint 2 결재 (≤8h / 운영 데이터 backfill 별도)**:
  - **F1 (8h)** quarterScores 자동 갱신 service layer (PBP/MPS → QS sync / 매치 종료 시점 trigger + paper 분기)
- **Sprint 3 결재 (≤17h+ / 사용자 결재 다수)**:
  - **F4 (16h+)** SSOT migration 일괄 정정 (E 분류 48건 매치별 결재 + paper 매치는 종이 기록지 외부 source 결재)
  - **F6 (1h)** stale 헤더 백필 (TEST 토너먼트 7건)
- **사후 정리**: `scripts/_temp/*-audit.ts` 2건 삭제 (운영 DB 자격 노출 방지 / Sprint 1 종료 시점)
