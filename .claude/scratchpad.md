# 작업 스크래치패드

## 현재 작업
- **요청**: 토너먼트 경기 종료 시 score sync 누락 버그 — **Phase B (live API fallback 3단 강화 + PBP→점수 헬퍼)** 구현 완료
- **상태**: ✅ developer — Phase B 구현 완료 / tsc 0 / vitest 320/320 PASS / tester 검증 대기
- **모드**: no-stop
- **사용자 결재 ⚠️**: Flutter `/api/v1/*` 변경 시 원영 사전 공지 필수 (CLAUDE.md) — Phase B 는 서버 응답 보강만 (영향 0)

## 진단 결과 박제 (매치 #132 실측)
| 저장소 | 상태 |
|--------|------|
| PBP (play_by_plays) | ✅ 263행 / made 36 / Q1:15-10 Q2:6-6 Q3:5-2 Q4:13-8 / 합 39:26 |
| tournamentMatch.homeScore/awayScore | ⚠️ 0 / 0 누락 |
| tournamentMatch.quarterScores JSON | ⚠️ `{"current_quarter":1}` Q1~Q4 ❌ |
| match_player_stats | ⚠️ 26행 생성됐는데 모든 pts/fgm/min = 0 |
| winner_team_id | ✅ 245 (피벗) |
| route.ts L1131~1137 fallback | ❌ playerStats.pts 도 0이라 작동 안함 |

## 기획설계 (planner-architect) — 점수 sync 옵션 C 근본 해결 (2026-05-11)

🎯 **목표**: PBP source-of-truth 정책 박제 + 종료 매치 일관 sync 보장 (PBP + playerStats + tournamentMatch 합계 + quarterScores) + 기존 누락 backfill + 안전망 fallback 강화 + 재계산 admin endpoint.

---

### A. 인벤토리 — 기록앱 ↔ 백엔드 sync 흐름

#### A-1. Flutter `/api/v1/matches/[id]/*` endpoint 8건 (현재 매치별 액션)
| Endpoint | 메서드 | 역할 | sync 범위 |
|---------|--------|------|---------|
| `/status` | PATCH | 매치 상태 전환 (in_progress / completed / cancelled) | **❌ 점수/playerStats/quarterScores 미박제** — `updateMatchStatus()` 만 호출 (status + winner 자동 결정 + advance/standings + brief) |
| `/events` | GET/POST | 단건 이벤트 박제 + 점수 자동 increment (`updateScoreForEvent`) | 매치 homeScore/awayScore atomic increment / **playerStats 0 / PBP 0** |
| `/events/batch` | POST | 다건 이벤트 batch | 위와 동일 |
| `/events/[eventId]/undo` | PATCH | 이벤트 undo (점수 차감) | undo 만 |
| `/stats` | GET/POST | match_player_stats 단/일괄 박제 | **playerStats 만** (점수/PBP 무관) |
| `/stats/[stat_id]` | PATCH/DELETE | 개별 stat 수정/삭제 | 단건 stat |
| `/roster` | GET | 명단 조회 | read-only |
| `/live-token` | POST | 라이브 토큰 발급 | 토큰 |

→ **단점**: 매치별 action 이 분산 (status / events / stats 각각). **종료 시점에 "모든 sync 일괄 보장" 헬퍼 없음**.

#### A-2. Flutter `/api/v1/tournaments/[id]/matches/*` 일괄 sync endpoint 2건
| Endpoint | 메서드 | sync 범위 | 비고 |
|---------|--------|---------|------|
| `/sync` | POST | **PBP + playerStats + match (score+status+winner+quarterScores) 일괄** — `syncSingleMatch()` 호출 | ⭐ **완전한 sync path 이미 존재** (5/11 Phase 1-B refactor) |
| `/batch-sync` | POST | match (score+status+quarterScores) 만 — **playerStats / PBP 미박제** | ⚠️ 부분 sync (이전 batch sync v1 잔존) |

→ **핵심 발견**: 매치 #132 가 `/sync` 가 아닌 `/batch-sync` 또는 `/events` + `/stats` (분산 path) 로 박제됐을 가능성. PBP 263 행 + playerStats 26 행 모두 0 = **`/sync` 한번도 호출 안 됨** + **`/stats` 도 호출 안 됨** + **PBP 만 `/events` 로 박제** 시나리오 추정.

#### A-3. 백엔드 service layer (이미 추출됨)
| 파일 | 역할 |
|------|------|
| `src/lib/services/match.ts` | `updateMatchStatus()` (status + winner + advance + brief) / `updateMatch()` / `createMatchEvent()` / `getMatchScore()` |
| `src/lib/services/match-sync.ts` ⭐ | `syncSingleMatch()` — **완전 sync core** (score + status + winner + quarterScores + playerStats + PBP + advance + standings + brief). caller = `/sync` route + 웹 종이 기록지 BFF |
| `src/lib/tournaments/score-updater.ts` | `updateScoreForEvent` — events route 가 호출, homeScore atomic increment 만 |
| `src/lib/tournaments/match-audit.ts` | `recordMatchAudit()` — TRACKED_FIELDS 7개 (homeTeamId/awayTeamId/winner/status/homeScore/awayScore/scheduledAt) audit. AuditSource = `"flutter" \| "admin" \| "system" \| "mode_switch" \| "web-score-sheet"` |

#### A-4. live API fallback (이미 인지된 안전망)
- `src/app/api/live/[id]/route.ts` L1131~1137:
  ```ts
  const homePlayerPts = homePlayers.reduce((s,p) => s+p.pts, 0);
  const finalHomeScore = (match.homeScore && match.homeScore > 0) ? match.homeScore : homePlayerPts;
  ```
- 운영진 이미 인지 — "match 102" 케이스 언급. **그러나 playerStats.pts 도 0 이면 fallback 작동 ❌** (매치 #132 케이스).

#### A-5. PBP → playerStats 집계 로직?
- **존재 안 함** — playerStats 는 Flutter 가 직접 `/stats` POST 또는 `/sync` 의 `player_stats[]` 로 박제. PBP 기반 서버 집계 헬퍼 없음.
- → Phase B 의 fallback 강화는 PBP 합산 자체를 추가해야 함 (신규 코드).

---

### B. 사용자 결재 사항 (5건 + 원영 협의 분리)

| # | 결재 안건 | 옵션 / 추천 |
|---|---------|------------|
| 1 | **종료 시 sync 책임 (Flutter vs 백엔드 집계)** | (a) Flutter 가 종료 시 `/sync` 강제 호출 (현재 path 활용 — 단일 source) ⭐ / (b) Flutter 는 `/events` + `/stats` 만 박제 / 백엔드가 종료 시 PBP→playerStats 집계 자동 — 신규 코드 / **추천 (a)** — sync core 이미 완비 + Flutter 변경 최소 (호출 1회 추가) |
| 2 | **트랜잭션 vs 멱등성** | (a) 종료 endpoint 한번 호출 시 모두 박제 (트랜잭션) — sync route 가 이미 `await Promise.all` + `Promise.allSettled` 패턴 / (b) 여러번 호출 안전 (멱등 sync) — 이미 upsert + `local_id` unique + `tournamentMatchId_tournamentTeamPlayerId` unique 로 멱등 보장됨 / **추천 (a+b 통합)** — 현재 sync route 가 멱등 트랜잭션 (변경 없음) |
| 3 | **재계산 (recompute) admin endpoint 신설** | (a) 운영자 매치별 수동 trigger `/api/web/admin/tournaments/[id]/matches/[mid]/recompute-score` — PBP 기준 homeScore/awayScore/quarterScores 재계산 + audit / (b) cron 자동 (전체 score=0 + PBP 있음 매치) / **추천 (a)** — Phase D 박제. cron 은 Phase E 모니터링만 |
| 4 | **backfill 스코프** | (a) 매치 #132 1건 / (b) #132 + 열혈농구단 9건 / (c) 전체 DB 의 score=0 + completed + PBP>0 매치 일괄 — DRY-RUN SELECT 후 사용자 승인 후 UPDATE / **추천 (c)** — 한번에 누락 데이터 모두 복구 + DRY-RUN 가드로 운영 안전 |
| 5 | **PBP source-of-truth 정책** | (a) PBP = 진실 → homeScore/awayScore 는 derived (재계산 가능) / DB trigger 자동 (PostgreSQL trigger) / (b) PBP = 진실 → 명시적 endpoint 호출 시만 sync (현재 `syncSingleMatch` 그대로) / **추천 (b)** — trigger 는 운영 리스크 ↑ (Prisma schema 외 SQL). Phase C+D 로 명시적 호출만 |

#### ⚠️ 원영 협의 사항 (Flutter app 영향 = 사전 공지 의무)

| # | 협의 안건 | Flutter app 영향 | 공지 시점 |
|---|---------|---------------|---------|
| 1 | **Phase C 종료 시 `/sync` 강제 호출 룰 정착** | Flutter app 이 매치 종료 시 `/sync` 호출 (현재 일부만 호출 가능성) — 클라이언트 코드 변경 필요 가능 | Phase B 완료 후 / Phase C 진입 전 ⚠️ |
| 2 | **`/batch-sync` deprecate 검토** | playerStats/PBP 미박제 = 부분 sync. `/sync` 로 통합 추천 → Flutter app 의 호출 path 통일 | Phase C 진입 전 ⚠️ |
| 3 | **`/events` + `/stats` 분산 path 유지 vs `/sync` 단일화** | 현재 라이브 진행 중에는 `/events` 가 atomic increment 박제 (실시간성) → 유지. 종료 시 `/sync` 일괄 보장만 추가 | Phase C 진입 전 ⚠️ |
| 4 | **ABI 호환 — `/sync` 요청 schema 변경 0 보장** | 현재 schema 그대로 호출 0 변경 (Flutter side 변경 없음 — 호출 횟수만 추가) | 영향 0 |

→ **공지 카피 (Phase C 진입 전)**: "원영아 — Flutter 기록앱이 매치 종료 시 `/api/v1/tournaments/[id]/matches/sync` 호출 보장 룰 박제 검토 필요. 현재 일부 매치 (#132 / 열혈농구단 9건) 가 종료됐는데 score=0 + playerStats=0 박제 — `/sync` 가 한번도 호출 안 된 패턴. Flutter app 의 sync 호출 path 확인 필요."

---

### C. Phase A~E 분해

#### Phase A — 즉시 데이터 복구 (1회 스크립트)

| 항목 | 내용 |
|------|------|
| **목적** | PBP 기반 매치 #132 + 열혈농구단 9건 + 전체 누락 매치 backfill |
| **신규 파일** | `scripts/_temp/backfill-match-score-from-pbp.ts` (1회용, `scripts/_temp/` 룰 준수) |
| **로직** | (1) DRY-RUN SELECT — `status="completed"` + `homeScore=0` + `awayScore=0` + PBP count > 0 매치 list / (2) PBP 합산 → quarterScores JSON 생성 (Q1~Q4 + OT) / homeScore = home team PBP `points_scored` 합 / awayScore = away team PBP 합 / (3) winner 자동 결정 (`decideWinnerTeamId` 헬퍼 재사용 — service export) / (4) 사용자 승인 후 batch UPDATE (각 매치별 트랜잭션 + audit `recordMatchAudit({source: "system", context: "backfill-pbp-2026-05-11"})`) |
| **변경 파일** | `scripts/_temp/backfill-match-score-from-pbp.ts` 신규 / `src/lib/services/match-sync.ts` (필요 시 `decideWinnerTeamId` 와 `correctScoresFromQuarters` 재사용 — 이미 export) |
| **위험** | 🟡 운영 DB UPDATE — CLAUDE.md DB 정책 준수: SELECT 검증 → 사용자 승인 → batch 단위 UPDATE → 사후 count groupBy 검증 |
| **테스트** | 단위: PBP→quarterScores 변환 헬퍼 (신규 `pbpToQuarterScores()` 헬퍼) vitest / 통합: DRY-RUN 매치 list 출력 1회 확인 |
| **의존** | 없음 (Phase B/C 와 독립) |
| **소요** | 30~45분 |

#### Phase B — live API fallback 강화 (안전망)

| 항목 | 내용 |
|------|------|
| **목적** | playerStats 도 0인 케이스 (#132) 에서 PBP 합산 fallback 추가 — 운영 0 영향 (라이브 페이지 표시만 보강) |
| **변경 파일** | `src/app/api/live/[id]/route.ts` L1131~1137 |
| **변경 카피** | `finalHomeScore = (match.homeScore > 0) ? match.homeScore : (homePlayerPts > 0) ? homePlayerPts : pbpHomePts` (3단 fallback) |
| **신규 헬퍼** | `src/lib/tournaments/score-from-pbp.ts` — `computeScoreFromPbp(pbps: PBPRow[], homeTeamId, awayTeamId)` 순수 함수 (테스트 가능). Phase A backfill 스크립트도 동일 헬퍼 재사용 (단일 source) |
| **위험** | 🟢 0 — fallback 만 추가 (homeScore>0 케이스 영향 0) |
| **테스트** | vitest — score-from-pbp 헬퍼 (정상 / 동점 / OT / Q4까지 진행 / 빈 PBP) 5 케이스 |
| **의존** | 없음 (Phase A 와 동일 헬퍼 공유) |
| **소요** | 20~30분 |

#### Phase C — Flutter 종료 endpoint 보강 ⚠️ 원영 공지 필수

| 항목 | 내용 |
|------|------|
| **목적** | 종료 시 sync 보장 — `/api/v1/matches/[id]/status` PATCH 가 completed 전환 시 자동으로 score 정합성 검증 + PBP 기반 보정 |
| **옵션 (c1)** | status route 가 completed 전환 직전 PBP 합산 검증 → homeScore=0 + PBP>0 시 자동 PBP 합산 박제 (사용자 결재 #1 옵션 a 의 백엔드측 safety net). Flutter 호출 변경 0. |
| **옵션 (c2)** | status route 에 `auto_compute_from_pbp: true` 플래그 신규 (request body) — 명시적 opt-in. Flutter app 변경 필요 (1줄). |
| **추천** | **c1** — Flutter 변경 0 / 운영 매치 모두 자동 safety. PBP 0 매치 (events 미박제) 는 그대로 유지 (영향 0) |
| **변경 파일** | `src/app/api/v1/matches/[id]/status/route.ts` — completed 전환 분기 안에 score 검증 + 자동 보정 / `src/lib/services/match.ts` `updateMatchStatus()` 시그니처 확장 (optional `recomputeFromPbp: boolean`) |
| **트랜잭션** | `updateMatchStatus` 가 이미 `prisma.$transaction` — 그 안에 PBP SELECT + score UPDATE 추가 (단일 트랜잭션 보장) |
| **위험** | 🟡 Flutter 호출은 변경 0 이나 status route 의 응답 시간 ↑ (PBP SELECT 1회 추가). 매치당 PBP 평균 200~300 행 = 30~50ms 추가. 허용 범위. |
| **원영 협의** | 본 path 동작 변경 = Flutter 입장에서 응답 body 동일 / 동작만 추가. 사전 공지 룰 위반 X (서버측 safety 추가). 원영 협의 = "확인 fyi" 수준 |
| **테스트** | vitest — `updateMatchStatus` 신규 분기 (homeScore=0 + PBP 있음 → 자동 보정 / homeScore>0 → 보정 skip / PBP 없음 → 보정 skip) 3 케이스 |
| **의존** | Phase B 의 `computeScoreFromPbp` 헬퍼 재사용 |
| **소요** | 45~60분 |

#### Phase D — 재계산 admin endpoint (수동 trigger)

| 항목 | 내용 |
|------|------|
| **목적** | 운영자가 특정 매치 score 강제 재계산 (Phase C 가 놓친 케이스 / 사고 보정) |
| **신규 파일** | `src/app/api/web/admin/tournaments/[id]/matches/[mid]/recompute-score/route.ts` (POST) + admin UI 버튼 (`(admin)/admin/tournaments/[id]/matches/_components/score-recompute-button.tsx`) |
| **권한** | `canManageTournament()` 헬퍼 재사용 (super_admin / organizer / TAM is_active) |
| **로직** | (1) PBP SELECT / (2) `computeScoreFromPbp` 호출 / (3) `tournamentMatch.update` (homeScore/awayScore/quarterScores/winner_team_id) + `recordMatchAudit({source: "admin", context: "recompute-pbp"})` / (4) DRY-RUN 모드 옵션 (`?dryRun=1`) — 응답에 신규 score 만 미리보기 |
| **UI** | admin 매치 상세 페이지에 "PBP 기반 재계산" 버튼 — 클릭 시 DRY-RUN preview 모달 → 확인 시 실제 UPDATE |
| **위험** | 🟡 운영자가 수동 실행 = audit 박제 + DRY-RUN 가드. 권한 검증 통과 매치만. |
| **테스트** | vitest — endpoint (권한 / DRY-RUN / 실제 UPDATE) + audit 박제 확인 3 케이스 |
| **의존** | Phase B 의 헬퍼 / Phase C 의 score safety logic 재사용 |
| **소요** | 60~90분 |

#### Phase E — 모니터링 / 알림 가드

| 항목 | 내용 |
|------|------|
| **목적** | 종료 매치인데 homeScore=0 + PBP 있음 패턴 자동 감지 + admin 대시보드 카드 / 로그 |
| **신규 파일** | `src/app/api/cron/check-score-sync-gap/route.ts` (Vercel cron, 매일 1회) + `src/lib/monitoring/score-sync-gap.ts` (헬퍼) |
| **로직** | SELECT — `completed` + `homeScore=0` + PBP count > 0 매치 list → 0 건이면 OK / >0 건이면 console.error + admin 알림 (Sentry / Slack webhook — Phase E2) |
| **UI 옵션** | admin 대시보드에 "Score Sync 갭" 카드 (count > 0 시만 표시 / 클릭 → 매치 list 페이지) |
| **위험** | 🟢 0 — read-only 모니터링 |
| **의존** | Phase A 가 backfill 완료 → 이후 신규 갭 발생 감지 |
| **소요** | 30~45분 |

---

### D. 원영 협의 사항 정리 (Flutter API 영향 + 공지 시점)

| 협의 안건 | Flutter app 영향 | ABI 호환 | 공지 시점 |
|---------|---------------|---------|---------|
| Phase A backfill | 0 (DB 직접 UPDATE) | 영향 0 | 불필요 (사용자 승인만) |
| Phase B live API fallback | 0 (서버 응답 보강만) | 응답 schema 동일 | 불필요 |
| Phase C status route safety net | 0 (서버측 자동 보정 / 응답 body 동일) | ABI 동일 | "fyi 공지" — Phase C 머지 후 |
| Phase D recompute admin | 0 (admin 웹 전용 endpoint) | 영향 0 | 불필요 |
| Phase E 모니터링 | 0 (read-only cron) | 영향 0 | 불필요 |
| **`/batch-sync` deprecate 검토** ⚠️ | Flutter app 의 호출 path 통일 (sync 로 마이그) — 클라이언트 변경 필요 가능 | breaking 가능성 ↑ | **Phase C 머지 후 원영 협의 시작 — 별도 Phase F (후속)** |

→ **원영 공지 카피 표준**:
```
원영아, mybdr 토너먼트 매치 종료 시 점수 sync 누락 패턴 진단 결과:
- 매치 #132 (몰텐배 26-GG-MD21-001 결승) PBP 263행 정상이지만 tournamentMatch.homeScore=0, playerStats 모두 0
- 추정 원인 = Flutter app 이 종료 시 /api/v1/tournaments/[id]/matches/sync 한번도 호출 안 함

내가 처리할 것 (Flutter 영향 0):
1) Phase A: 누락 매치 PBP 기반 backfill 1회 스크립트
2) Phase B: live API fallback 강화 (homeScore=0 + playerStats=0 시 PBP 합산)
3) Phase C: /api/v1/matches/[id]/status 가 completed 전환 시 PBP 자동 보정 (서버측 safety net)

너 확인 부탁 (Flutter app side):
- bdr_stat 앱이 매치 종료 시 /sync 호출하는가?
- /batch-sync 가 playerStats/PBP 미박제 — 현재 사용 중이면 /sync 로 통합 검토 가능?

답변 받고 Phase F (Flutter side 변경) 진행 결정.
```

---

### E. 추천 진행 순서

| 순서 | Phase | 사유 |
|------|------|------|
| 1 | **Phase B (fallback 강화)** | 가장 안전 (서버 응답 보강만) / 즉시 효과 / 헬퍼 = Phase A/C/D 모두 재사용 = 단일 source 박제 |
| 2 | **Phase A (backfill 1회 스크립트)** | Phase B 헬퍼 검증 후 즉시 운영 DB 적용 / DRY-RUN 가드 + 사용자 승인 |
| 3 | **Phase D (recompute admin endpoint)** | 운영자 수동 trigger — Phase A 누락분 + 향후 사고 보정. UI 작업 포함 |
| 4 | **Phase C (status route safety net)** | 신규 종료 매치 자동 보정 — 원영 fyi 공지 후 머지 |
| 5 | **Phase E (모니터링)** | Phase A~C 완료 후 잔여 갭 감지 — long-term |
| 6 | **Phase F (Flutter app 협의)** | 원영 답변 후 — `/batch-sync` deprecate 또는 `/sync` 호출 룰 정착 (별도 turn) |

**병렬 실행 검토**: B + A 는 헬퍼 공유 (의존) → 순차. C + D 는 독립 (헬퍼만 재사용) → 병렬 가능. E 는 운영 안정화 후.

---

### F. knowledge 박제 후보

#### `errors.md` 신규 항목 (2026-05-11)
```
### [2026-05-11] 토너먼트 종료 매치 homeScore/awayScore=0 sync 누락 패턴 — PBP source / 별도 박제 채널 누락
- 매치 #132 (몰텐배 26-GG-MD21-001 결승) 실측: PBP 263행 / playerStats 26행 (모두 0) / homeScore=0 / quarterScores={current_quarter:1}
- 추정: Flutter app 이 종료 시 /sync 호출 안 함 — /events 만 박제 (PBP) + /stats 미호출 (playerStats 0) + /batch-sync 사용 (score 만)
- 안전망: live API L1131 fallback `playerStats.pts 합` — 본 케이스에서 playerStats 도 0이라 작동 ❌
- fix: Phase B (fallback 3단 — score → playerStats → PBP 합) + Phase C (status route safety net)
- 회귀 가드: PBP 합산 헬퍼 `computeScoreFromPbp` 단일 source / Phase E 모니터링 cron
```

#### `decisions.md` 신규 항목 (2026-05-11)
```
### [2026-05-11] 점수 sync source-of-truth = PBP / 멱등 sync / Flutter 영향 0 safety net
- 정책 1: PBP = source-of-truth. homeScore/awayScore/quarterScores 는 derived (PBP 합산으로 재계산 가능)
- 정책 2: 멱등 sync — syncSingleMatch (upsert + local_id unique + tournamentMatchId_tournamentTeamPlayerId unique) 이미 보장. 트랜잭션 + 멱등 동시 만족.
- 정책 3: Flutter 영향 0 safety net 우선 — Phase C 가 status route 안에서 자동 보정. Flutter app 변경 없이 차후 회귀 0 보장.
- 정책 4: /batch-sync deprecate 후보 (playerStats/PBP 미박제 부분 sync) — 원영 협의 후 Phase F. /sync 로 통합 권장.
- 정책 5: Flutter `/api/v1/*` 변경 시 원영 사전 공지 룰 재확인 (CLAUDE.md). Phase C 머지 후 fyi 공지.
```

#### `architecture.md` 신규 항목 (2026-05-11)
```
### [2026-05-11] 매치 score data flow — PBP / playerStats / tournamentMatch 합계 / quarterScores 4 저장소 관계
- 4 저장소:
  - `play_by_plays` — 이벤트 단위 row (action_type / points_scored / quarter / tournament_team_id) — PBP source-of-truth
  - `match_player_stats` — 선수별 22 필드 boxscore (points 합 / FG made/attempted) — Flutter `/stats` 또는 `/sync` 박제
  - `tournamentMatch.homeScore/awayScore` Int — 합계 (Flutter `/events` atomic increment 또는 `/sync` 박제)
  - `tournamentMatch.quarterScores` Json — `{home: {q1, q2, q3, q4, ot}, away: {...}, current_quarter}`
- 4 채널 sync path:
  - `/api/v1/matches/[id]/events` POST → score atomic increment + PBP 박제 (라이브 진행 중)
  - `/api/v1/matches/[id]/stats` POST → playerStats 박제 (종료 후)
  - `/api/v1/tournaments/[id]/matches/sync` POST → 4 저장소 일괄 박제 (syncSingleMatch 호출 / 완전한 path) ⭐
  - `/api/v1/tournaments/[id]/matches/batch-sync` POST → score + quarterScores 만 (playerStats/PBP 미박제) ⚠️
- live API (`/api/live/[id]`) fallback 3단: homeScore > 0 → match.homeScore / homeScore=0 → playerStats.pts 합 / playerStats=0 → PBP 합산 (Phase B 신규)
- 재계산 admin: `POST /api/web/admin/tournaments/[id]/matches/[mid]/recompute-score` (Phase D — PBP 기반 강제 재계산 + audit)
- audit source 종류: "flutter" / "admin" / "system" / "mode_switch" / "web-score-sheet" + 신규 "system-backfill" / "admin-recompute" 추가 검토
```

---

### G. developer 진입 전 사용자 결재 체크리스트

| # | 결재 안건 | 추천 |
|---|---------|------|
| 1 | Phase 진행 순서 (B → A → D → C → E → F) | ⭐ 추천대로 진행 |
| 2 | Phase A backfill 스코프 (전체 score=0 + PBP>0 일괄) | DRY-RUN SELECT 1회 → 사용자 승인 → batch UPDATE |
| 3 | Phase C status route safety net 옵션 c1 (자동 보정) | ⭐ Flutter 변경 0 / 매치당 30~50ms 응답 시간 ↑ 허용 |
| 4 | Phase F (Flutter 협의) 시점 | Phase C 머지 후 원영 fyi 공지 → 별도 turn |
| 5 | knowledge 박제 시점 | 각 Phase 머지 후 PM 박제 (errors/decisions/architecture) |
| 6 | 원영 공지 카피 | 위 §D 카피 확정 / Phase C 머지 후 송부 |

## 구현 기록 (developer) — Phase B: live API fallback 3단 강화 (2026-05-11)

📝 구현 요약: live API `/api/live/[id]` 의 점수 fallback 을 **2단 → 3단**으로 강화 + PBP→점수 합산 순수 헬퍼 신규 추출 (Phase A/C/D 재사용 가능한 단일 source).

### 변경 파일

| 파일 | 신규/수정 | LOC | 변경 내용 |
|------|---------|-----|---------|
| `src/lib/tournaments/score-from-pbp.ts` | 신규 | +92 | `computeScoreFromPbp()` 순수 함수 — PBP made shot 필터 → home/away total + quarter 별 합산. BigInt/number 혼용 안전 (Number 캐스팅 비교). route.ts L820~835 quarterScores 로직과 동일 패턴 |
| `src/__tests__/lib/tournaments/score-from-pbp.test.ts` | 신규 | +173 | 8 케이스 — 빈 PBP / is_made=false 무시 / quarter 합산 / quarter null fallback / pts null 가드 / 매치 #132 실측 / 알 수 없는 team_id / BigInt 혼용 |
| `src/app/api/live/[id]/route.ts` | 수정 | +20/-4 | (1) import `computeScoreFromPbp` 추가 (2) L1131~1137 fallback 2단 → 3단 강화 |

### 신규 헬퍼 시그니처

```ts
export function computeScoreFromPbp(
  pbps: PbpRowForScore[],
  homeTeamId: bigint | number,
  awayTeamId: bigint | number,
): ScoreFromPbp
// 반환: { home: number; away: number; quarters: Record<number, {home, away}> }
```

규칙:
- `is_made === true` 만 카운트 (route.ts L825 와 동일)
- `points_scored` 합산 (null/0 무시)
- `quarter` null → 1 fallback
- team_id 가 home/away 둘 다 아닌 행 → 무시 (정합성 가드)

### 3단 fallback 카피 (before / after)

**Before** (L1131~1137):
```ts
const homePlayerPts = homePlayers.reduce((sum, p) => sum + p.pts, 0);
const awayPlayerPts = awayPlayers.reduce((sum, p) => sum + p.pts, 0);
const finalHomeScore = (match.homeScore && match.homeScore > 0) ? match.homeScore : homePlayerPts;
const finalAwayScore = (match.awayScore && match.awayScore > 0) ? match.awayScore : awayPlayerPts;
```

**After** (3단 fallback):
```ts
const homePlayerPts = homePlayers.reduce((sum, p) => sum + p.pts, 0);
const awayPlayerPts = awayPlayers.reduce((sum, p) => sum + p.pts, 0);
const pbpScore = computeScoreFromPbp(allPbps, match.homeTeamId ?? 0, match.awayTeamId ?? 0);
const finalHomeScore = (match.homeScore && match.homeScore > 0)
  ? match.homeScore
  : (homePlayerPts > 0 ? homePlayerPts : pbpScore.home);
const finalAwayScore = (match.awayScore && match.awayScore > 0)
  ? match.awayScore
  : (awayPlayerPts > 0 ? awayPlayerPts : pbpScore.away);
```

### 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 0 에러 |
| `npx vitest run` (전체) | ✅ **320/320 PASS** (이전 312 + 신규 8) |
| 신규 score-from-pbp 단위 테스트 | ✅ 8/8 PASS |
| BigInt `Nn` 리터럴 grep | ✅ 0건 (BigInt() 생성자 사용) |
| lucide-react / 핑크 hardcode grep | ✅ 0건 (서버 코드 무관) |

### 💡 tester 참고 — 수동 검증 가이드

| 케이스 | 경로 | 기대 동작 |
|--------|------|---------|
| 매치 #132 (sync 누락) | `http://localhost:3001/live/132` | 상단 큰 점수 = **피벗 39 / SYBC 26** (이전 0/0 → fix). TOTAL 행도 39/26. Q1~Q4 분기는 그대로 정상. |
| 정상 매치 (homeScore>0) | `/live/<26-GG-MD21-002 SA vs 셋업 matchId>` | **영향 0** — `match.homeScore=54 > 0` 분기로 통과. 54:49 그대로 표시. |
| 매치 #102 (homeScore=0 + playerStats>0) | `/live/102` | playerStats.pts 합산으로 fallback (2단 동작 그대로 유지) |
| DB 변경 | 없음 | fallback 만 강화 — `match.homeScore` 컬럼은 0 유지 (Phase A backfill 별도) |

### ⚠️ reviewer 참고

- **BigInt 안전성**: `computeScoreFromPbp` 가 BigInt/number 혼용 입력 지원 — Prisma 가 `tournament_team_id` 를 BigInt 로 반환하므로 `Number()` 캐스팅 후 비교 (route.ts L827, L830 패턴 동일). `0n` 리터럴 안 쓰고 number `0` fallback 사용 (tsconfig target ES2020 미만 호환 + CLAUDE.md 글로벌 룰).
- **`is_made` 필터 일관성**: route.ts L820~835 의 quarterScores 계산 (`p.is_made !== true continue`) 과 헬퍼의 필터 로직이 **동일** — 두 곳의 합산 결과가 항상 일치 (단일 source 박제).
- **미래 Phase 의존성**: Phase A backfill 스크립트도 `computeScoreFromPbp` 재사용 예정 (`scripts/_temp/backfill-match-score-from-pbp.ts`). Phase D recompute admin endpoint 도 동일 헬퍼 호출. Phase C status route safety net 도 동일. **한 함수 = 4개 Phase 단일 source**.
- **route.ts 변경 범위 최소**: import 1줄 + L1131~1137 변경만. 다른 로직 (quarterScores / 보정 / debug payload) 영향 0.
- **다른 Phase 미터치**: Phase A backfill 스크립트 / Phase C status route / Phase D recompute endpoint / Phase E cron — **이번 작업 범위 ❌** (기획만 박제됨 — 위 §C 참조).

## 진행 현황표
| 단계 | 상태 |
|------|------|
| §A 인벤토리 (8 endpoint + service + fallback) | ✅ |
| §B 사용자 결재 5건 + 원영 협의 4건 | ✅ |
| §C Phase A~E 분해 | ✅ |
| §D 원영 협의 사항 + 공지 카피 | ✅ |
| §E 추천 진행 순서 | ✅ |
| §F knowledge 박제 후보 (errors/decisions/architecture) | ✅ |
| §G 사용자 결재 6건 박제 | ✅ |
| **Phase B 구현 (developer)** | ✅ tsc 0 / vitest 320/320 |
| Phase A backfill (후속) | ⏳ |
| Phase C status safety (후속) | ⏳ |
| Phase D recompute admin (후속) | ⏳ |
| Phase E 모니터링 cron (후속) | ⏳ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-11 | (PM 커밋 대기) | **[Phase B score-from-pbp + live API 3단 fallback]** computeScoreFromPbp 헬퍼 신규 (92 LOC) + 단위 테스트 8 케이스 (매치 #132 실측 포함) + live route.ts L1131 fallback 강화 (homeScore>0 → playerStats>0 → PBP). tsc 0 / vitest 320/320 PASS (회귀 0). 3 파일 변경. | ✅ |
| 2026-05-11 | (기획만) | **[score sync 옵션 C 기획설계]** A 인벤토리 (Flutter endpoint 8개 + sync/batch-sync 2개 + service 4개 + live fallback) / B 결재 5 + 원영 협의 4 / C Phase A~E 분해 / D 원영 공지 카피 / E 추천 순서 / F knowledge 후보 3. 코드 변경 0. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[권한 시스템 Phase 1-B + 3 + rbac cleanup]** admin-guard sentinel + 첫 활성 협회 자동 + hasPermission 12 자동 통과 + referee layout/dashboard + RoleMatrixCard 8번째 행 + rbac.ts dead code 삭제. tsc 0 / vitest 312/312 PASS. 8 파일 변경. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[권한 시스템 Phase 1-A + 1-C + 2]** isSuperAdmin 단일 source + 5 파일 인라인 제거 + partner-admin super_admin 우회 + RoleMatrixCard UI + requireTournamentAdmin 분기. 10 파일 / vitest 296/296. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 3]** 알림 + 건의사항 + 비번 변경 진입점. ~+523 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 2]** 관리 토너먼트 + 본인인증 + 최근 활동. ~+1,025 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1 강남구협회장배 유소년]** schema TT +3 / TTP +11 / 신규 3모델 + admin 페이지 + canManageTournament 헬퍼 + apply-token util. tsc 0 / vitest 275/277. | ✅ |
| 2026-05-11 | (조회만) | **펜타곤 김대진 명단 + 오늘 경기 등록 검증** — ttp.id=2562 active / matchId=123 ⑤예선. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 종이 기록지 폼]** 14 파일 / +2,053. 권한 헬퍼 + score-sheet + 컴포넌트 5 + BFF zod + audit. tsc 0 / vitest 267/267. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-1 sync route refactor]** match-sync service 추출 (494→204). vitest 252/252. | ✅ |
