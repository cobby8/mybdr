# /stats 실데이터 연결 박제 설계 (2026-06-14)

> PR-MOCK-TO-REAL ① — read-only 분석/설계. **코드·DB 변경 0.**
> 작성: planner-architect | 산출물: 본 설계서 + scratchpad `## 기획설계` 추가

---

## 0. 핵심 결론 (먼저)

**census 가정 "3테이블 전부 존재"는 맞다. 그러나 populated 실측 결과 2테이블이 빈 껍데기다.**

| 테이블 | schema | 운영 행 수 | 채우는 주체 | 결론 |
|--------|--------|-----------|------------|------|
| `match_player_stats` (L786) | ✅ 존재 | **2375행** | Flutter sync + score-sheet BFF (운영 가동 중) | ★ **유일한 실데이터 source** |
| `user_season_stats` (L3022) | ✅ 존재 | **0행** | cron/배치 (미동작 — Phase 13+ 예정) | ❌ 빈 테이블. 직접 조회 불가 |
| `shot_zone_stats` (L3049) | ✅ 존재 | **0행** | 트리거/배치 (미동작 — Phase 13+ 예정) | ❌ 빈 테이블. ZONES hide |

→ **`UserSeasonStat` / `ShotZoneStat` 을 직접 SELECT 하면 항상 0건 = "준비중" 빈화면**. 의뢰 명세의 "TOTALS=UserSeasonStat / ZONES=ShotZoneStat" 직접 매핑은 **mock보다 더 나쁜 영구 빈화면**이 된다.

**채택 전략 — `match_player_stats` 단일 source + JS 시즌 가공 (= 기존 선례 답습)**:
공개 프로필(`/profile`)이 이미 같은 상황에서 동일 결정을 내렸다.
decisions.md [2026-05-09] **Q7=A 채택 / Q7=D(UserSeasonStat) 거부 — "cron 미동작 (Phase 13+ 예정)"**.
→ `/stats`도 **UserSeasonStat 우회 + MatchPlayerStat aggregate/findMany + JS 가공**으로 TOTALS/SPLITS/GAME_LOG/RANKINGS를 실데이터로 채우고, **ZONES만 hide(준비중 배지)** 한다.

이로써 시안 대시보드의 KPI 8칸·요약·경기로그·클럽순위는 **전부 실데이터**, 슈팅존만 정직하게 "집계 준비중"이 된다. mock 0 / 0스키마 / 빈화면 0.

---

## 1. 3테이블 필드맵 (schema 정독 실측)

### (A) MatchPlayerStat — `match_player_stats` (L786) ★ 실 source
본인 연결 경로: **`User.id` → `TournamentTeamPlayer.userId`(L619, NULL 허용) → `MatchPlayerStat.tournamentTeamPlayerId`(L788)**

| Prisma 필드 | DB 컬럼(@map) | 용도 |
|------------|--------------|------|
| `tournamentTeamPlayerId` | `tournament_team_player_id` | ttp 조인 키 (→ userId) |
| `tournamentMatchId` | `tournament_match_id` | 매치 조인 (시즌연도·승패·상대) |
| `points` | `points` | PPG / GAME_LOG PTS / RANKINGS |
| `assists` | `assists` | APG / AST |
| `total_rebounds` | `total_rebounds` | RPG / REB |
| `steals` | `steals` | SPG |
| `blocks` | `blocks` | (보조) |
| `minutesPlayed` | `minutes_played` | MIN / total_minutes |
| `fieldGoalsMade` / `fieldGoalsAttempted` | `field_goals_made` / `field_goals_attempted` | FG% (시즌합 made/att) |
| `threePointersMade` / `threePointersAttempted` | `three_pointers_made` / `three_pointers_attempted` | 3P% / GAME_LOG 3P |
| `freeThrowsMade` / `freeThrowsAttempted` | `free_throws_made` / `free_throws_attempted` | FT% |
| 관계 `tournamentMatch` | — | `scheduledAt`(시즌연도) / `status` / `homeScore`·`awayScore` / `winnerTeamId` / `homeTeamId`·`awayTeamId` |
| 관계 `tournamentTeamPlayer` | — | `userId` / `player_name` / `tournamentTeamId`(승패 판정) |

- `@@unique([tournamentMatchId, tournamentTeamPlayerId])` — 매치당 선수 1행 = GAME_LOG가 "경기=1 row" 그대로 매핑.
- 인덱스: `points` / `assists` / `total_rebounds` / `tournamentTeamPlayerId` 전부 보유 → groupBy/orderBy 효율 O.
- ★ **시즌 경계 컬럼이 MatchPlayerStat에 없다** → `tournamentMatch.scheduledAt`의 **연도(getFullYear)**로 시즌 판정. 실측: 본인 ttp 7경기 전부 scheduledAt NOT NULL → 2026 시즌 1개로 정상 집계됨.

### (B) UserSeasonStat — `user_season_stats` (L3022) — ❌ 0행
컬럼: `user_id` / `season_year`(Int) / `season_label` / `games_played` / `wins` / `losses` / `avg_rating`(Decimal 3,2) / `mvp_count` / `rank_position` / `total_minutes` / `total_xp`. `@@unique([user_id, season_year])`.
주석(schema): "Phase 13+ 에서 집계 잡 + UI 추가 예정". **현재 채우는 cron 없음 → 0행.**
→ 직접 조회 ❌. **MatchPlayerStat로 동등 산출**: games_played=경기수 / wins·losses=$queryRaw winner 판정 / avg_rating=DB 미보유(별도 evaluation_rating, 시안 "레이팅"엔 PER 류 산식 또는 hide) / mvp_count·rank_position·total_xp=DB 미보유 → hide.

### (C) ShotZoneStat — `shot_zone_stats` (L3049) — ❌ 0행
컬럼: `user_id` / `season_year` / `zone_code`(VarChar20: RA/PAINT/MID_LEFT…) / `attempts` / `made` / `efficiency`(Decimal5,4). `@@unique([user_id, season_year, zone_code])`.
주석(schema): "Phase 13+ 에서 집계 잡 + UI 추가 예정". **0행.**
→ ZONES 탭 = **hide(준비중 배지)**. MatchPlayerStat에는 슛 위치(존) 정보가 전혀 없어 **억지 매핑 불가**(Stop condition 준수). PBP(play_by_plays)에도 좌표 컬럼 없음 → 후속 Phase 13 집계잡 도입 전까지 불가.

---

## 2. 본인/시즌 쿼리 설계 (server component, prisma 직접 = camelCase)

### 2-1. 본인 식별 + 비로그인 분기
```
getWebSession() → JwtPayload | null   (web-session.ts L17)
  · payload.sub = user.id.toString()  (jwt.ts L50)  → BigInt(session.sub)
  · null = 비로그인 → 로그인 유도 카드 (시안 빈상태 셸 .ex-empty + /login CTA)
```
`/stats`는 "본인 시즌 스탯"이라 **로그인 필수**. 비로그인은 mock 노출 ❌ → 로그인 안내.

### 2-2. 재사용 자산 — `getPlayerStats(userId)` (user.ts L252)
이미 존재하는 집계 함수가 70% 커버:
- ttp 조회 → `matchPlayerStat.aggregate` (_avg: points/total_rebounds/assists/steals/blocks/minutesPlayed + _count) + `officialMatchNestedFilter()` 가드
- winRate = `$queryRaw`(winner_team_id = ttp.tournament_team_id FILTER) → wins/total
- seasonHighs = _max

**보강 필요(현 getPlayerStats에 없는 것)**:
1. **시즌(연도) 필터** — 현재 전체 누적(career). 시안은 시즌 셀렉터(2026S/2025W/career). → `scheduledAt` 연도 분기 추가.
2. **FG%/3P%/FT%** — 현재 _avg에 없음. → `_sum: {fieldGoalsMade, fieldGoalsAttempted, threePointersMade, threePointersAttempted, freeThrowsMade, freeThrowsAttempted}` 추가 → 시즌합 made/att 비율(평균의 평균 ❌, 합산 비율 ○).
3. **GAME_LOG / 클럽순위(RANKINGS)** — 신규.

### 2-3. 신규 헬퍼 권장 — `src/lib/stats/my-season-stats.ts` (신규 파일, 0스키마)
`stat-leaders.ts`(L1, 0스키마 groupBy 선례)와 동형 구조로 신규 작성 권장. `getPlayerStats` 직접 확장도 가능하나, 그 함수는 공개 프로필 등 **여러 호출처 공유**라 시그니처 변경 시 회귀면이 넓음 → **신규 헬퍼 분리 = 회귀 격리**(lessons "공유 컴포넌트 격리" 원칙의 함수 버전).

```ts
// my-season-stats.ts (server-only, camelCase)
export interface MySeasonTotals {
  seasonYear: number | "career";
  gamesPlayed: number;
  wins: number; losses: number; winRate: number | null;
  ppg: number; apg: number; rpg: number; spg: number;
  fgPct: number | null; tpPct: number | null; ftPct: number | null;
}
export interface MyGameLogRow {
  date: string;        // scheduledAt → "MM.DD"
  opponentName: string | null;
  minutes: number; points: number; rebounds: number; assists: number;
  fg: string; tp: string;  // "made/att"
  result: "W" | "L" | "-";
}
export interface MyClubRank { label: string; rank: number; of: number; }  // SPLITS/RANKINGS

export async function getMySeasonStats(userId: bigint, season: number | "career"):
  Promise<{ totals: MySeasonTotals | null; gameLog: MyGameLogRow[]; clubRanks: MyClubRank[]; seasons: number[] }>
```

**쿼리 흐름 (전부 read-only)**:
1. ttp ids = `tournamentTeamPlayer.findMany({ where:{userId}, select:{id, tournamentTeamId} })`. 0건 → `{totals:null,...}`(빈상태).
2. `matchPlayerStat.findMany({ where:{ ttpId in ids, tournamentMatch: officialMatchNestedFilter() }, select:{...스탯, tournamentMatch:{ scheduledAt, status, homeScore, awayScore, homeTeamId, awayTeamId, winnerTeamId, homeTeam/awayTeam name } }, orderBy:{ tournamentMatch:{ scheduledAt:'desc' } } })`.
   - **findMany 1건 + JS 가공** 채택(decisions Q7=A 답습): groupBy는 _sum+_avg 동시 불가 + 시즌 분기 + 승패 + GAME_LOG가 한 쿼리로 안 풀림. 평균 사용자 <100경기(실측 max 7경기) → JS 비용 무시.
3. JS에서: 매치 `scheduledAt.getFullYear()`로 시즌 그룹 → `seasons[]` 산출 + 선택 시즌 필터.
4. **TOTALS**: 선택 시즌 합산 → ppg/apg/rpg/spg = sum/games. fgPct = Σfgm/Σfga*100 (att 0이면 null). 동일 3P/FT.
5. **승패**: 매치별 `winnerTeamId === ttp.tournamentTeamId`(home/away 중 본인팀) → W/L. winnerTeamId NULL = "-". wins/losses/winRate.
   - 실측: 본인 7경기 전부 completed+점수 → 판정 가능.
6. **GAME_LOG**: 최근 N(예: 10) row 그대로. opponent = 본인팀 아닌 쪽 팀명.
7. **clubRanks(SPLITS/RANKINGS)**: 시안 "클럽 내 순위"는 **팀(클럽) 동료 대비 본인 순위**. 본인 팀(tournamentTeamId) 동료 ttp들의 시즌 합산 → 부문별 본인 등수/N. **연결 가능 범위만**(득점/어시/리바/3점/자유투 = MatchPlayerStat 보유). 데이터 부족 시(동료 1명 등) 해당 부문 row 생략. **포지션/구장/시간대 SPLIT은 hide**(아래 §3).

---

## 3. 시안 섹션별 데이터 매핑 (연결가능 / hide)

시안 `Stats.jsx`: KPI 8칸 + 3탭(요약/슈팅존/경기로그). 요약=득점추이 SVG + 클럽순위. 의뢰 명세의 TOTALS/ZONES/SPLITS/GAME_LOG/TREND/RANKINGS를 시안 실구조에 매핑.

| 시안 섹션 | 의뢰 명세 | source | 상태 |
|----------|----------|--------|------|
| **KPI 8칸** (PPG/APG/RPG/SPG/FG%/3P%/FT%/레이팅) | TOTALS | MatchPlayerStat 시즌 합산 | ✅ **연결** (레이팅만 hide/대체 — 아래) |
| KPI "레이팅" 8번째 칸 | TOTALS.avg_rating | DB 미보유(UserSeasonStat 0행 + MPS 무) | ⚠️ **대체 or hide**: PER류 산식 ❌(억지) → "—" 표기 또는 칸 자체 7칸으로 |
| **요약 > 시즌 득점 추이(TREND SVG)** | TREND | GAME_LOG points 시계열(최근 N경기) | ✅ **연결** (시안 trend[] → 실 경기별 득점 배열) |
| **요약 > 클럽 내 순위(RANKINGS)** | SPLITS/RANKINGS | 본인팀 동료 대비 시즌 부문 순위 | 🟡 **부분 연결**: 득점/어시/리바/3점/자유투만. 동료 데이터 충분 시 표시·부족 시 row 생략 |
| **슈팅 존(ZONES)** | ZONES | ShotZoneStat 0행 + MPS 존정보 무 | ❌ **hide** — 탭 자체 "집계 준비중" 빈상태 |
| **경기 로그(GAME_LOG)** | GAME_LOG | MatchPlayerStat findMany 최근 N | ✅ **연결** (날짜/상대/MIN/PTS/REB/AST/FG/3P/결과 전부 보유) |
| **포지션/레벨/구장/시간대 SPLIT** | SPLITS | 구장=매치 venue 일부 가능하나 표본 희박 / 포지션·레벨·시간대 집계 없음 | ❌ **hide** (억지 매핑 금지) |

**시즌 셀렉터**: 시안 `seasons=[2026S/2025W/2025F/career]` mock → 실 시즌 = `getMySeasonStats`의 `seasons[]`(scheduledAt 연도 distinct) + "커리어". 데이터 없는 시즌 칩 미생성.

---

## 4. 빈 상태 분기 (mock 복원 ❌)

| 조건 | 화면 |
|------|------|
| 비로그인 (session null) | `.ex-empty` 셸 + "로그인하고 내 시즌 스탯 보기" + `/login` CTA |
| 로그인 O · ttp 0건 (대회 출전 이력 0) | `.ex-empty` "출전 기록이 아직 없습니다" + `/tournaments` CTA |
| 로그인 O · ttp O · 선택 시즌 기록 0건 | KPI/로그 영역에 "이번 시즌 기록이 아직 없습니다" (다른 시즌 칩은 노출) |
| ZONES 탭 (항상) | "슈팅 존 집계 준비 중" 배지 빈상태 (ShotZoneStat 채워지면 자동 노출 — Phase 13+) |
| 클럽순위 동료 부족 | 해당 부문 row 생략 (카드 자체는 표시, rows 0이면 카드 hide) |

→ **어떤 경우에도 시안 mock(kpi 14.2 / log '장충픽업' / trend[] 등) 박제 0.** 더미 상수 전량 삭제.

---

## 5. server / client 구조

현재 `page.tsx` = 순수 server 빈상태(use client 없음). 시안은 시즌 셀렉터·탭 = 인터랙션 → **server fetch + client 뷰** 분리.

```
stats/page.tsx                        [server] — getWebSession + getMySeasonStats(기본시즌)
  · 비로그인/ttp0 = 빈상태 직접 렌더(client 불요)
  · 데이터 O → <StatsClient initial={...} seasons={...} />  로 prop 전달(BigInt→string 직렬화)
stats/_v2/stats-client.tsx            [client] — "use client"
  · 시즌 셀렉터(useState season) + 탭(useState mode: overview/zones/log)
  · 시즌 전환 = 옵션 A: page.tsx가 전 시즌 미리 계산해 prop(클라 필터, 추가 fetch 0)  ← 권장(소량)
                옵션 B: /api/web/... 신규 라우트 fetch  ← Stop("라우트 변경 ❌") 위반 → 채택 ❌
  · TREND SVG / 클럽순위 / ZONES(준비중) / GAME_LOG 테이블 = 시안 마크업 토큰화 이식
```
- **옵션 A 채택**(시즌 전환 = 클라 필터): 실측 데이터 소량(<100경기) → page.tsx가 전 시즌 데이터를 한 번에 계산·직렬화하여 prop. 신규 api 라우트 0(Stop 준수).
- 직렬화: server prisma = camelCase. client prop도 그대로 camelCase JSON. **apiSuccess 미경유 = snake 변환 없음** → snake/camel 혼동 함정(errors 재발6회) **해당 없음**. (만약 후속에 /api/web 라우트를 쓴다면 그때만 snake. 본 설계는 라우트 0이라 camelCase 일관.)

---

## 6. populated 실측 결과 (운영 SELECT, read-only 영향 0 / 임시 스크립트 정리 완료)

```
== ROW COUNTS ==
user_season_stats: 0   ← ❌ 빈 테이블 (cron 미동작)
shot_zone_stats:   0   ← ❌ 빈 테이블 (배치 미동작)
match_player_stats: 2375  ← ✅ 실 source

== UserSeasonStat / ShotZoneStat season_year 분포 == (없음 / 없음)

== MatchPlayerStat userId 연결 ttp 샘플 ==
userId=2892 문수인 pts=13 ast=3 reb=13 / userId=2903 ... (정상 연결)

== stat 최다 ttp ==  ttpId=2572 userId=2837 이광욱 7경기 등

== 본인(userId=2837) 시즌 집계 시뮬 ==
2026: 7경기 PPG=3.1 APG=2.3 RPG=3.1 FG%=39.3 3P%=0.0 FT%=-(att0)
completed+점수 7/7 → 승패 판정 가능 / scheduledAt NULL 0/7 → 시즌경계 신뢰 O
```

**해석**:
- TOTALS/GAME_LOG/TREND/RANKINGS = MatchPlayerStat로 **실제 산출됨**(시뮬 통과).
- FT% 등 시도 0인 부문은 `null`("-") 정직 표기(0%로 왜곡 ❌).
- UserSeasonStat/ShotZoneStat 직접 의존 = **영구 빈화면 보장** → 우회 필수.

---

## 7. 규모 / 회귀 위험

| 항목 | 규모 | 위험 |
|------|------|------|
| `my-season-stats.ts` 신규 헬퍼 | +180~240 LOC | 낮음 (read-only / 0스키마 / stat-leaders.ts·getPlayerStats 패턴 답습) |
| `page.tsx` server fetch+분기 재작성 | +60/-50 | 낮음 (현재 빈상태→데이터 와이어 / 데이터패칭 신규지만 API/라우트 무변경) |
| `_v2/stats-client.tsx` 신규(시안 뷰) | +260~340 LOC | 중 (탭·SVG·테이블 마크업 + 토큰치환 + 빈상태 분기 다수) |
| `globals.css` `.st-*` 이식 | +90~130 | 낮음 (Batch A/B 토큰치환 표준 답습 / `*/` 조기종료 postcss 검증 의무) |
| BDR-current sync | 시안 이미 존재 | 0 (역박제 불요 — 시안이 source) |

**회귀 0 가드**:
- `getPlayerStats`(공유 함수) **미변경** — 신규 헬퍼 분리로 공개 프로필 회귀 격리.
- DB schema/마이그레이션 0 / api/v1·api/web 라우트 0 / AppNav 0.
- 토큰: 시안 `var(--accent)`(빨강 폴백) 강조 → errors[06-10] 함정 점검. 단 Stats.jsx는 Tweaks inline 주입 패널 **없음** → `--accent`가 진짜 확정 강조색. 그대로 사용 가능(승자/MVP 의미색 아닌 일반 강조 → **CSS 룰상 강조는 `--cafe-blue` 권장** vs 시안 `--accent`(빨강) — PM 확인 §8①).
- CSS `*/` 조기종료 → **postcss walkRules 검증**(errors[06-14] grep 거짓음성).

---

## 8. PM 확인 필요 (3건)

1. **강조색**: 시안 KPI/순위/추이 강조 = `var(--accent)`(=빨강 #E31B23). Stats.jsx엔 Tweaks 데모패널 없어 빨강이 확정 의도색. 그대로 빨강 채택 vs 디자인룰 "강조=cafe-blue, 빨강=CTA/의미색"에 맞춰 `--cafe-blue` 치환? (권장: **cafe-blue 치환** — 06-10 함정·룰 일관. 단 시안 디자이너 의도 존중 시 빨강 유지도 가능)
2. **KPI 8번째 "레이팅" 칸**: avg_rating(UserSeasonStat 0행) / PER 산식(억지) 둘 다 불가. → (a) "—" 표기 후 7실값+1placeholder 유지 / (b) 칸 7개로 축소 / (c) evaluation_rating(유저 평가점수, getPlayerStats 인접) 대체. 권장 (a) 또는 (c).
3. **시즌 전환 방식**: 옵션 A(page.tsx 전 시즌 선계산+클라 필터, 라우트 0) vs 후속 api 라우트. 본 설계 권장 = **옵션 A**(Stop "라우트 변경 ❌" 준수). 단 시즌·경기 많아지면(현재 max 7경기라 무관) 재검토.

---

## 9. 실행 계획 (최대 7단계)

| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | `my-season-stats.ts` 신규 헬퍼(시즌 집계+승패+게임로그+클럽순위, read-only) | developer | 없음 |
| 2 | `stats/page.tsx` server 재작성(session+헬퍼+빈상태 분기+prop 직렬화) | developer | 1 |
| 3 | `_v2/stats-client.tsx` 신규(시즌셀렉터·3탭·KPI·TREND·순위·GAME_LOG·ZONES 준비중) | developer | 2 |
| 4 | `globals.css` `.st-*` 이식(토큰치환 + postcss 검증) | developer | 3 |
| 5 | tester(렌더·빈상태 4분기·실데이터 와이어·snake/camel 무관 확인) + reviewer(0스키마·라우트0·getPlayerStats diff0·토큰·`*/` postcss) **병렬** | tester + reviewer | 4 |
| 6 | (PASS 시) PM 커밋 | pm | 5 |

1~4 순차(의존). 5 병렬. **DB UPDATE/스키마 변경 단계 0** (전부 read-only 조회).

---

## ⚠️ developer 주의사항

- **UserSeasonStat / ShotZoneStat 직접 SELECT 금지** — 0행이라 영구 빈화면. MatchPlayerStat로 산출.
- **시안 mock 상수(kpi/ranks/zones/log/trend/seasons) 전량 삭제** — 박제 0.
- **getPlayerStats(user.ts) 미변경** — 신규 헬퍼로 분리(회귀 격리). git diff로 user.ts diff 0 실측.
- **FG%/3P%/FT% = 시즌 합산 made/att 비율** (경기별 %의 평균 ❌). att 0 = null("-"), 0% 왜곡 금지.
- **승패 = winnerTeamId === ttp.tournamentTeamId** (본인 소속팀이 home/away 어느 쪽인지 매핑). winnerTeamId NULL = "-".
- **ZONES = 무조건 "준비중" 빈상태** — MPS에 존 정보 0, 억지 매핑 금지(Stop).
- **server prisma = camelCase** (apiSuccess 미경유). 신규 api 라우트 만들지 말 것 → snake/camel 혼동 회피 + Stop "라우트 변경 ❌" 준수.
- **토큰**: 하드코딩 hex/lucide/pill9999 0. 강조색 PM 확인(§8①). CSS 주석 `/` 구분자 금지(`*/` 조기종료) → postcss walkRules 검증.
- **BigInt 직렬화**: server→client prop은 BigInt→string.
