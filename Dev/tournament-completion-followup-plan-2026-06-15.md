# 대회 종료 후속 작업 3종 통합 설계서 (read-only)

> 작성: planner-architect / 2026-06-15 / **코드·DB 변경 0 (설계만)**
> 전제 Phase: 대회 종료 판정 이원화 완료 (경기기반 `checkAndAutoCompleteTournament` / 날짜기반 Phase3 백필 / 표시 `effectiveTournamentStatus`)
> 산출 근거: 운영 schema + src/ 실측 (Explore 정밀조사 + 핵심 파일 정독)

---

## 0. 한눈에 — 우선순위 + 의존관계

| 순위 | 작업 | 규모 | 위험도 | 의존 | 비고 |
|------|------|------|--------|------|------|
| **1** | ① 우승팀 자동 set 유틸 | 中 (+120~180) | 中 | 없음 (독립) | ③의 **전제**. finalize 헬퍼에 통합 |
| **2** | ② Phase3 cron 자동화 | 小 (+90~130) | 低 | 없음 (독립) | ①과 무관 (매치0=우승 없음) |
| **3** | ③ 4차/열혈 결선 종료 흐름 | 운영 절차 (코드 0~소) | 低 | **①에 의존** | ① 완성 시 자동화. 코드보다 운영 절차 |

**의존관계 핵심**:
- **① → ③**: ③(4차 결승·열혈 결선)이 실제 경기 진행되면, ①이 통합돼 있어야 종료 시 우승팀이 자동 박제된다. ① 없으면 ③은 종료만 되고 우승팀은 또 수동.
- **② 는 완전 독립**: ②(매치0 공지전용 대회)는 결승이 없어 우승팀 개념 자체가 없음. ①과 교차점 0. 병렬 진행 가능.
- **권장 순서**: ① 먼저 (③의 전제) → ②는 ①과 병렬 가능 → ③은 ① 머지 후 운영 진행.

---

## ① 우승팀 자동 set 유틸 (핵심)

### 🎯 목표
대회가 경기기반으로 종료(`checkAndAutoCompleteTournament` 가 status='completed' set)될 때, **포맷에 맞는 우승팀을 판정해 `Tournament.champion_team_id` 를 자동 박제**한다. 현재 champion은 100% 수동.

### ★ 결정적 실측 사실 (설계 제약)
| 사실 | 출처 | 설계 영향 |
|------|------|----------|
| `champion_team_id` = **Team.id** FK (BigInt?, NULL) | schema L322/353 | 박제 값은 **Team.id** |
| `winner_team_id` = **TournamentTeam.id** FK (BigInt?) | schema L746 | 결승 승자 → **변환 필수** (`tt.teamId`) |
| **champion_team_id SET 코드 = 0건** (현재 전무) | Grep 결과 (읽기만 9파일) | 100% 신규 / 회귀 면 0 |
| `checkAndAutoCompleteTournament` = `finalizeMatchCompletion` L180 에서 호출 (모든 종료 path 단일 진입점) | finalize-match-completion.ts | **여기에 통합** (별도 유틸 ❌) |
| `mvp_player_id` = User FK | schema L357 | 본 작업 범위 외 (champion만) |

### 🔧 접근 — 별도 유틸 vs auto-complete 통합

| 옵션 | 내용 | 판정 |
|------|------|------|
| A. auto-complete.ts 내부에 박제 | `checkAndAutoCompleteTournament` 가 status update 직후 champion도 set | ❌ 함수 단일책임 위반 (이름=auto-complete) + 멱등성·테스트 결합 |
| **B. 신규 유틸 `setTournamentChampion()` + finalize 헬퍼에서 호출** | auto-complete 가 `updated:true` 반환 시에만 champion 유틸 호출 | ✅ **채택** — 단일책임 / 멱등 독립 / vitest 분리 / 회귀 0 |
| C. cron 일괄 박제 | 별도 cron 이 completed+champion null 대회 백필 | ❌ 실시간성 0 + ②와 책임 혼동 |

**B 채택 사유**:
- `finalizeMatchCompletion` 이 이미 단일 진입점 → 종료 path 5종 전부 자동 적용 (admin PATCH / Flutter sync 단건 / batch-sync / score-sheet BFF / Flutter status PATCH).
- auto-complete 반환값 `{ updated, reason }` 에 이미 종료 발생 신호 있음 → `updated===true` 일 때만 champion 박제 (낭비 0).
- 신규 유틸은 PURE 판정부 + DB 박제부 분리 → 포맷별 판정 vitest 검증 가능 (운영 데이터 0 보완).

### 📍 만들 위치와 구조
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `src/lib/tournaments/set-champion.ts` | **신규** — `resolveChampionTeamId()`(판정) + `setTournamentChampion()`(박제) | 신규 |
| `src/lib/tournaments/finalize-match-completion.ts` | autoComplete `updated:true` 시 `setTournamentChampion()` 호출 추가 (Promise.allSettled 뒤 후처리 1블록) | 수정 |
| `src/__tests__/lib/tournaments/set-champion.test.ts` | 포맷별 판정 + 멱등성 vitest | 신규 |

### 📋 포맷별 우승 판정 로직 (★ 핵심 산출)

`resolveChampionTeamId(prisma, tournamentId, format)` → `Team.id | null` 반환:

| format | 판정 방식 | 데이터원 | 변환 |
|--------|----------|----------|------|
| `single_elimination` | 결승 매치(`next_match_id IS NULL` + roundName LIKE 결승\|final\|championship) 의 `winner_team_id` | tournament_matches | **winner_team_id(TT.id) → tt.teamId** |
| `full_league_knockout` | 위와 동일 (결선 knockout 최종전 승자) | tournament_matches | 동일 변환 |
| `group_stage_knockout` | 위와 동일 | tournament_matches | 동일 변환 |
| `dual_tournament` | 위와 동일 (최종 매치 승자) | tournament_matches | 동일 변환 |
| `round_robin` / `league` | **결승 없음** → `calculateLeagueRanking()` 1위 | tournament-seeding.ts | rank=1 의 tournamentTeamId → tt.teamId |
| `group_stage` (knockout 없음) | 단일조면 standings 1위 / 다조면 **판정 보류**(null) | division-advancement | 다조 우승 모호 → PM 확인 |
| 미지정/null/그외 | 결승 매치 fallback → 없으면 null | — | — |

**결승 매치 식별 (knockout 계열 공통)** — awards/page.tsx L131-138 패턴 답습:
```
1순위: roundName LIKE '결승'|'final'|'finals'|'championship' (insensitive) + winner_team_id NOT NULL
       → scheduledAt desc take 1
2순위(폴백): next_match_id IS NULL + winner_team_id NOT NULL + round_number 최대
       → 결승 라운드명 미박제 대회 방어
3순위: 없으면 null 반환 (champion 박제 skip — 덮어쓰기 ❌)
```
※ `next_match_id IS NULL` 단독은 부정확(예선 매치도 next 없을 수 있음) → roundName 1순위, next_match_id 는 폴백 보조.

### ⚙️ 멱등성 (MVP 결정 필요 — PM 확인 ①-Q1)
| 정책 | 동작 | 권장 |
|------|------|------|
| **skip (보수)** | champion_team_id 이미 NOT NULL → 그대로 둠 (수동 박제 보호) | ✅ **권장 MVP** |
| overwrite | 재판정값으로 항상 덮어쓰기 | ❌ 운영자 수동 수정분 날림 위험 |

권장: **이미 있으면 skip**. 단 "결승 재경기로 우승팀 바뀜" 같은 케이스는 운영자 수동 UPDATE(어드민)로 처리. 자동 유틸은 NULL→값 채움만.

### 🔗 기존 코드 연결
- `finalize-match-completion.ts` L183 `Promise.allSettled(tasks)` 직후, `autoCompleteResult` 가 `updated:true` 일 때 (L231~245 블록 내) `setTournamentChampion()` 추가 호출. **autoComplete 실패/no-change 시 호출 안 함**(낭비 0).
- 판정부는 `calculateLeagueRanking`(tournament-seeding.ts L108) / `getDivisionStandings`(division-advancement.ts L70) 재사용.
- TT.id → Team.id: 결승 매치 조회 시 `winnerTeam: { select: { teamId: true } }` include 1회.

### 🛡️ 회귀 / 안전
- champion SET 코드 0건이었으므로 **기존 종료 흐름에 추가만**(add-only) → 종료 자체 회귀 0.
- champion 박제 실패는 **warnings 미추가 + silent**(autoComplete 실패 패턴 답습 L225) — 매치 처리/종료와 무관하게 운영 차단 0.
- 결승 없는 포맷(round_robin) 안전: standings 1위 없으면(0팀) null → skip.
- DB schema 변경 **0** (champion_team_id 컬럼 기존재).

### ⚠️ developer 주의사항
- `winner_team_id` 를 **그대로 champion_team_id 에 넣으면 안 됨**(TT.id ≠ Team.id, FK 깨짐). 반드시 `tt.teamId` 변환.
- 판정부 PURE 분리 → vitest 로 포맷별 케이스 검증(single_elim 결승승자 / round_robin 1위 / 결승없음 null / champion 이미존재 skip).
- finalize 헬퍼 추가 호출은 **autoComplete updated:true 분기 안에만** (no-change/실패 시 호출 금지).

### 📏 규모: 中 (+120~180 LOC) / 위험도: 中 (포맷 분기 정확성)

---

## ② Phase 3 cron 자동화

### 🎯 목표
공지전용(매치 0건) + 종료일 경과 + 미종료 대회를 주기적으로 `status='completed'` 자동 백필. (Phase3 STEP2 수동 작업의 cron화)

### ★ 실측 사실
| 사실 | 출처 |
|------|------|
| cron 표준 패턴 = Bearer `CRON_SECRET` 가드 + updateMany + admin_logs createMany + resolveSystemAdminId | stale-pending-fix/route.ts |
| vercel.json crons 배열에 등록 (10건 기존) | vercel.json |
| TERMINAL = completed/ended/closed/cancelled / NO_TIME_OVERRIDE = draft/upcoming/final/preopen | tournament-status.ts L65/L75 |
| Phase3 수동 백필 = "매치0 + 경과 + 미종료" id IN updateMany (작업로그 06-15) | scratchpad |

### 📍 만들 위치와 구조
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `src/app/api/cron/auto-complete-tournaments/route.ts` | **신규** — Bearer 가드 → WHERE 백필 → admin_logs | 신규 |
| `vercel.json` | crons 배열에 1줄 추가 (매일 KST 03:00 = UTC 18:00 → `0 18 * * *`) | 수정 |

### 📋 WHERE 조건 (★ 안전 핵심 — 진짜 대회 강제종료 금지)
```
status NOT IN (TERMINAL: completed/ended/closed/cancelled)        ← 미종료
  AND status NOT IN (NO_TIME_OVERRIDE: draft/upcoming/final/preopen)  ← 표시레이어와 동일 가드
  AND (endDate ?? startDate) < (오늘 KST 00:00 기준 경과)            ← 종료일 경과
  AND 매치 0건  ★★★ (tournamentMatch.count === 0)                  ← 공지전용만 (진짜 대회 제외)
```

**매치0 한정을 코드로 보장하는 방법** (단순 안전 우선):
1. 후보 대회 SELECT (status 가드 + 날짜 경과) → id 목록
2. **각 후보의 매치 count 조회 → count===0 인 id만 필터** (또는 `matches: { none: {} }` relation 필터 1쿼리)
3. count>0(=경기 있는 대회)은 `checkAndAutoCompleteTournament` 소관 → **이 cron 이 절대 건드리지 않음**
4. 최종 id IN updateMany(status='completed')

→ 매치 있는 대회는 경기 종료 흐름(①·finalize)으로만 종료. cron 은 매치0 전용. **두 종료 경로 완전 분리**.

### ⚙️ 날짜 경과 판정
- `effectiveTournamentStatus` 는 표시용(서버/클라 TZ 혼재 minor 있음). cron 은 **KST 고정 00:00 비교** 권장 — "어제까지 종료일인 대회"만. 당일 진행 대회 보호.
- 날짜 둘 다 NULL → 제외(경과 판정 불가).

### 🔗 ① 유틸과 관계 (명확히)
- 이 cron 이 종료시키는 대회는 **매치 0건 = 결승 없음 = 우승 개념 없음** → ① champion 유틸 **호출 안 함**(호출해도 결승 매치 0 → null → skip).
- ①은 **경기기반 종료**(finalize 경로)에만 적용. ② cron 은 champion 무관. **교차점 0** 명시.

### 🛡️ 회귀 / 안전
- 매치 있는 대회 절대 미접촉(WHERE 매치0 가드) → 진행 중 대회 강제종료 위험 0.
- champion·mvp 미접촉(status만 UPDATE).
- 0건 → 200 idle 응답(stale-pending 패턴).
- admin_logs 박제(action="auto_complete_tournament_cron", severity=info) → 추적성.
- DB schema 변경 0.

### ⚠️ developer 주의사항
- WHERE 에서 **매치0 필터를 반드시** (relation `matches: { none: {} }` 또는 사후 count 필터). 빠지면 진행 대회 강제종료 = 운영 사고.
- updateMany WHERE 에 status NOT IN TERMINAL **재확인**(race 방지, stale-pending 패턴 답습).
- CRON_SECRET Bearer 가드 필수(미인증 호출 차단).
- KST 경과 비교(서버 UTC 주의).

### 📏 규모: 小 (+90~130 LOC) / 위험도: 低 (단 매치0 가드가 생명선)

---

## ③ 4차/열혈 결선 종료 흐름

### 🎯 목표
미진행 결선(4차 뉴비리그 결승 #232 / 열혈 SEASON2 결선)이 실제 진행될 때, **① 유틸로 종료+우승 자동화**. 코드 작업보다 **운영 절차 정리**.

### 📋 현황 + 자동화 흐름
| 대상 | 현 상태 | 진행 시 자동화 (① 머지 후) |
|------|---------|---------------------------|
| **4차 뉴비리그** 결승 #232 (CBL vs ATLAS) | scheduled 0:0 미진행 | 운영자가 실경기 결과 박제(Flutter or score-sheet) → status=completed → **finalize 헬퍼 자동 호출** → 예선6+결승1 전부 종료 → `checkAndAutoCompleteTournament` updated:true → **① champion 자동(결승 승자 tt.teamId)** |
| **열혈 SEASON2** 결선(준결승2+결승) | 생성됨·진행 대기 | 준결승 진행→advanceWinner로 결승 슬롯 채움→결승 진행→completed→finalize→① champion 자동 |

### 🔧 접근 — 코드 vs 운영 절차
- **코드 작업 거의 없음**: ①이 finalize 헬퍼에 통합되면, 이 두 대회는 경기 진행→종료만으로 우승 자동 박제. 신규 코드 0.
- **운영 절차** (수동 개입 최소화):
  1. 실경기 진행 → 결과를 **정규 경로로 박제**(Flutter 기록앱 sync OR 웹 score-sheet) — 직접 DB UPDATE ❌ (finalize 헬퍼 우회 방지)
  2. 마지막 매치 completed 시 finalize 자동 실행 → 종료+champion 자동
  3. 사후 검증: champion_team_id NOT NULL + 표시 확인(SELECT 1회)

### ⚠️ 주의 — 직접 DB UPDATE 금지
- 결승 결과를 `tournamentMatch` 직접 UPDATE(status=completed)하면 **finalize 헬퍼 미경유 → champion·standings·advance 전부 누락**(errors.md "sync path 헬퍼 우회 5회 재발" 패턴).
- 반드시 score-sheet BFF 또는 Flutter sync 경유. 운영자 수동 종료가 불가피하면 admin PATCH route(finalize 호출 보유) 사용.

### 🔗 ①·② 관계
- ③ = ① 의 **첫 실사용 케이스**. ① 없이 ③ 진행하면 종료는 되나 champion 또 수동.
- ② 와 무관(매치 있는 진짜 대회).

### 📏 규모: 운영 절차 (코드 0~소) / 위험도: 低 (① 머지 전제 시)

---

## PM 확인 필요 사항 (결재)

| # | 항목 | 선택지 | planner 권장 |
|---|------|--------|-------------|
| **①-Q1** | champion 멱등성 | (가) 이미 있으면 skip / (나) 항상 덮어쓰기 | **(가) skip** (수동 박제 보호) |
| **①-Q2** | round_robin/league 우승 = standings 1위 자동 박제 OK? | (가) 자동 / (나) 보류(null) | **(가)** (calculateLeagueRanking 1위) |
| **①-Q3** | group_stage(knockout 없음) 다조 우승 | (가) 보류 null + 운영자 수동 / (나) 통합standings 1위 | **(가) 보류** (다조 우승 모호) |
| **②-Q1** | cron 주기 | 매일 KST 03:00 (`0 18 * * *` UTC) / 다른 시각 | **매일 03:00 KST** |
| **②-Q2** | cron 백필 대상 = 매치0 한정 확정? | 확정 / 매치有도 포함 | **매치0 한정 확정** (진짜 대회 보호) |
| **③-Q1** | 4차 결승·열혈 결선 실경기 진행 주체/일정 | 운영 결정 | — (운영자 진행 후 알림) |
| **공통** | 진행 순서 | ①→②병렬→③ / 다른 순서 | **① 먼저(③전제) + ② 병렬** |

---

## 담당 에이전트 배정 (결재 후)

| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | ① set-champion.ts + finalize 통합 + vitest | developer | ①-Q1~Q3 결재 |
| 2 | ① 검증 (vitest 포맷별 + 회귀) | tester | 1 |
| 3 | ② auto-complete-tournaments cron + vercel.json | developer | ②-Q1~Q2 결재 (1과 병렬 가능) |
| 4 | ② 검증 (Bearer 가드 + 매치0 WHERE + idle) | tester + reviewer (병렬) | 3 |
| 5 | ③ 운영 절차 — ① 머지 후 실경기 진행 시 자동 (코드 0) | pm/운영 | ① 머지 |

> **DB/코드 변경은 위 결재 완료 후 별도 진입.** 본 문서는 설계만 (운영 영향 0).
