# 기록(Records) 기능 CLI 박제 — 기획설계서

> 작성: planner-architect (2026-06-16, read-only 실측 기반)
> 시안: `Dev/design/BDR v2.33/_delivery-records-2026-06-16/`
> 원칙: 신규 DB 0 · 공식가드 필수 · API/데이터 유지 + UI 추가 · 공개(읽기) 페이지
> **코드·DB·push 0 — 본 문서는 설계만. 구현은 developer가 단계별 진행.**

---

## 0. 5초 요약

선수·팀·대회 3개 화면에 "기록" 탭을 신설한다. 핵심 데이터는 전부 **`MatchPlayerStat`(2375행 실재)에서 JS 집계**로 산출하며 신규 테이블/컬럼은 0이다. 시안의 표준 21컬럼 박스(statCols)는 `MatchPlayerStat`에 **21/21 전부 매핑 가능**(평점만 별도 소스). 기존 인프라 `my-season-stats.ts`(선수 시즌 집계)와 `stat-leaders.ts`(대회 리더보드)를 재사용·확장한다.

**비유**: 이미 창고(`MatchPlayerStat`)에 모든 부품이 다 들어있다. 새 부품을 사올 필요 없이(DB 0), 창고에서 부품을 꺼내 3가지 진열장(선수/팀/대회 기록 탭)에 맞게 조립만 하면 된다.

---

## 1. 시안 분석

### 1-A. 공통 컴포넌트 (`records-shared.jsx`)
- `statCols({ avg })` — **표준 박스 컬럼 팩토리**. 모든 표가 동일 양식. avg=false(경기별 raw 정수) / avg=true(집계 평균 소수1자리). 컬럼 21개: MIN·PTS·FGM·FGA·FG%·3PM·3PA·3P%·FTM·FTA·FT%·OR·DR·REB·AST·STL·BLK·TO·PF·+/-·평점.
- `RecTable` — 정렬(헤더 클릭)·sticky 첫열·가로스크롤·`pinnedRows`(팀 평균 행 고정).
- `RecSeg` — 세그먼트 토글(경기별/대회별/시즌별 등).
- `Lnk` / `userHref(id)` / `teamHref(name)` — 링크. **시안은 teamHref를 팀명으로 만드나, 운영은 Team.id 필요**(아래 §6 결재).
- `RecEmpty` / `RecLoading` / `RecUnclaimed` — 빈/로딩/미연동 상태.
- `ShotChart` / `SeasonSummary` — **이번 박제 보류**(컴포넌트는 코드 유지, 시안도 시즌뷰에서 인디케이터 제거 명시).

### 1-B. 데이터 형태 기대치 (`records-data.jsx`)
시안이 기대하는 행(row) 키 = statCols가 읽는 키. 운영 DTO는 **이 키 이름에 정확히 맞춰야** 시안 컴포넌트가 그대로 동작:

| 시안 키 | 의미 | MatchPlayerStat 출처 |
|---------|------|---------------------|
| `min` | 출전시간 | minutesPlayed |
| `pts` | 득점 | points |
| `fgm`/`fga` | 야투 성공/시도 | fieldGoalsMade / fieldGoalsAttempted |
| `fg_pct` | 야투% | field_goal_percentage (또는 makes/att 산출) |
| `tpm`/`tpa`/`tp_pct` | 3점 | threePointersMade / threePointersAttempted / three_point_percentage |
| `ftm`/`fta`/`ft_pct` | 자유투 | freeThrowsMade / freeThrowsAttempted / free_throw_percentage |
| `oreb`/`dreb`/`reb` | 리바운드 | offensive_rebounds / defensive_rebounds / total_rebounds |
| `ast`/`stl`/`blk`/`tov`/`pf` | 어시·스틸·블록·턴오버·파울 | assists / steals / blocks / turnovers / personal_fouls |
| `pm` | +/- | plusMinus |
| `rating` | 평점 | **별도 소스(§4 참조)** |
| `g` | 경기수 | 집계 시 row 개수 |
| `result` | W/L | winner_team_id vs 내 팀 |

> ⚠️ statCols의 % 렌더는 `fg_pct`가 없으면 `fgm/fga`로 자동 산출한다. 따라서 운영은 **% 컬럼을 안 줘도 makes/attempts만 정확하면 시안이 산출**한다(이중 안전).

### 1-C. 3개 화면
- **PlayerRecords** (`/users/[id]` 기록 탭): 세그먼트 [경기별][대회별][시즌별]. 경기별=Game Log 풀 박스 / 대회별=대회 groupBy 평균 / 시즌별=연도 groupBy 평균표. 슛차트/요약 제거.
- **TeamRecords** (`/teams/[id]` 기록 탭): [경기별][대회별]=목록→클릭→해당 경기/대회 팀 전체 박스(선수별 + 팀 합계/평균 pinned). [시즌별]=로스터 집계+팀 평균 pinned. **대회 경기 한정**(친선/픽업 박스 없음).
- **TournamentRecords** (`/tournaments/[id]?tab=records` 기록실): [선수][팀][경기]. 선수=리더 카테고리별 TOP3+더보기 모달+전체선수표 / 팀=순위(승–패·득실)+팀 박스 / 경기=대진 로그.

### 1-D. CSS — 충돌 위험 0
`records.css` 전체 클래스가 `.rec-` prefix로 격리됨(실측). 기존 globals.css와 충돌 없음. 강조색은 `var(--accent)` 사용 → **errors.md 빨강 폴백 함정 주의**(아래 §6, var(--cafe-blue) 치환 필요).

---

## 2. 기존 코드 실측 결과

### 2-A. 집계 엔진 `src/lib/tournaments/stat-leaders.ts`
- `getStatLeaders(tournamentId: string): Promise<StatLeaders | null>`
- groupBy `["tournamentTeamPlayerId"]`, `_sum: {points, total_rebounds, assists, threePointersMade}`, 매치 IN 필터(officialMatchNestedFilter), desc 정렬 slice(0,3), 값>0 필터.
- ttp→선수명·팀명 매핑(player_name → users.nickname → name 폴백).
- **재사용 범위**: 현재 **4부문(득점/리바/어시/3점) 누적 합 TOP3**만. 시안은 **6카테고리(+스틸/블록/3P%) 평균(PPG)** 요구 → **확장 필요**(아래 §3, §5).

### 2-B. 선수 시즌 집계 `src/lib/stats/my-season-stats.ts` ★재사용 핵심
- `getMySeasonStats(userId, season): Promise<MySeasonStatsResult>`
- **MatchPlayerStat findMany 1건 + JS 가공** 패턴 완비: KPI 8칸·게임로그·트렌드·클럽순위·시즌목록. 공식가드(officialMatchNestedFilter) 적용. 승패 판정(winner_team_id vs ttp.tournamentTeamId)·상대팀명 산출 로직 이미 있음.
- **단** 현재 KPI 8칸만(ppg/apg/rpg/spg/fg%/tp%/ft%). 시안 21컬럼 박스(fgm/fga/oreb/dreb/blk/tov/pf/pm 등)는 미포함 → **select 확장 + 집계 함수 추가 필요**.
- season_year 없음 확인 → **scheduledAt.getFullYear()로 파생**(이 파일이 이미 그렇게 함 = 표준 패턴).

### 2-C. 공식가드 `src/lib/tournaments/official-match.ts`
| export | 용도 |
|--------|------|
| `officialMatchWhere(extra?)` | `tournamentMatch.findMany` 최상위 where |
| `officialMatchNestedFilter()` | `matchPlayerStat.findMany`의 `tournamentMatch:` nested 필터 |
| `pastOrOngoingSchedule()` | scheduledAt 가드만 |
| `OFFICIAL_MATCH_SQL_CONDITION` | raw SQL용 문자열 |
- 공통조건: `status IN (completed, live) AND scheduledAt <= NOW() AND scheduledAt IS NOT NULL`.
- **모든 신설 집계는 이 가드 필수**(미래/비공식 매치 집계 금지 — 재발 방지).

### 2-D. 21컬럼 스키마 실측 — `MatchPlayerStat` (schema L794~845)
**21/21 전부 존재**. 상세 매핑표는 §4.

### 2-E. 탭 구조 실측
| 화면 | 파일 | ?tab= | lazy | 현재 탭 |
|------|------|-------|------|---------|
| 대회 | `tournaments/[id]/_components/tournament-tabs.tsx` | ✅ 지원(L366~380, page.tsx ALLOWED_TABS L117) | ✅ SWR | overview/schedule/bracket/teams/rules (5) |
| 팀 | `teams/[id]/_components_v2/team-tabs-v2.tsx` + page.tsx(L70~84) | ✅ 지원(Link href ?tab=) | 서버조회 | overview/roster/recent/**stats(라벨="기록")** (4) |
| 선수 | `users/[id]/_v2/profile-tabs.tsx` | ❌ **미지원**(local state, 2탭) | SSR prefetch | overview/games (2) |

- **대회**: TabKey union·TAB_META 배열·조건부 렌더·ALLOWED_TABS 4곳에 "records" 추가. lazy SWR 패턴 답습.
- **팀**: ⚠️ **이미 "기록" 라벨의 `stats` 탭 존재**(StatsTabV2). 시안 TeamRecords와 충돌/중복 → §6 결재.
- **선수**: TABS 배열에 "records" 추가 + props records:ReactNode 추가. **?tab= 미지원이라 지시서의 "?tab=records 지원 추가 권장" = local state 유지 vs URL param 전환 결재**(§6).

### 2-F. 기존 API `/api/v1/tournaments/[id]/player-stats`
- **JWT(withAuth) 가드 = 공개 아님**. 웹 공개 페이지에서 직접 못 씀.
- 응답 = apiSuccess(snake_case 자동변환). 매치별 선수 stat 행(pivot 미가공).
- **결론**: 대회 기록실(공개)은 이 API 재사용 불가 → **웹 신설 필요**.

---

## 3. API 설계 결정 (화면별)

> 공통: 전부 `/api/web/...` 공개 GET. `apiSuccess()` 사용 → **응답 키 자동 snake_case**. 서버 컴포넌트에서 직접 prisma 호출(server component)도 가능하나, 시안이 client 토글·정렬을 요구하므로 **client fetch + 웹 API 신설**이 자연스럽다(단 SSR 직주입도 옵션 — §6 결재).

### 3-A. 대회 기록실 — **신설** `/api/web/tournaments/[id]/records`
- **근거**: `/api/v1/.../player-stats`는 JWT 가드·미가공이라 공개 기록실 부적합. `stat-leaders.ts`는 4부문 누적만이라 부족. 한 엔드포인트로 선수/팀/경기 3종을 한번에 주는 게 효율적.
- **쿼리**: `?scope=players|teams|games`(또는 전부 한번에 반환 후 client 토글 — 데이터량 적어 후자 권장).
- **공식가드**: `tournamentMatch.findMany({ where: officialMatchWhere({ tournamentId }) })`로 매치 IN 집합 → MatchPlayerStat groupBy.
- **응답 DTO(snake_case)**:
```
{
  meta: { status, division, teams_n, games_n, mvp_name },
  players: [{ user_id, player_name, team_name, team_id, claimed, g,
              min, pts, fgm, fga, fg_pct, tpm, tpa, tp_pct, ftm, fta, ft_pct,
              oreb, dreb, reb, ast, stl, blk, tov, pf, pm, rating,
              ppg, rpg, apg, spg, bpg }],   // 평균 + 리더보드 별칭
  teams: [{ team_id, name, g, w, l, ppg, oppg, diff, pm, ...box평균 }],
  games: [{ match_id, date, round, home, home_id, away, away_id, hs, as }]
}
```
- **선수 식별**: ttp.userId(클레임)만 user_id 채움→`/users/[id]?tab=records` 링크. 미연동은 player_name만(링크 없음).

### 3-B. 선수 기록 — **신설** `/api/web/users/[id]/records?scope=games|tournaments|seasons`
- **근거**: `my-season-stats.ts`는 "본인 세션" 한정·KPI 8칸뿐. 공개 프로필(타인 조회)·21컬럼 박스가 필요 → 별도 신설(단 my-season-stats.ts의 findMany+JS가공+승패판정 **로직을 헬퍼로 추출·재사용**).
- **공식가드**: `matchPlayerStat.findMany({ where: { tournamentTeamPlayerId: { in: 해당user의 ttpIds }, tournamentMatch: officialMatchNestedFilter() } })`.
- **scope별**:
  - `games`: 매치 행 그대로(raw 박스 21컬럼 + date/opponent/tournament/result).
  - `tournaments`: tournamentId로 groupBy 평균.
  - `seasons`: scheduledAt 연도로 groupBy 평균.
- **미연동(userId 없는 ttp는 조회 불가 = 정상)**. 공개 프로필이라 IDOR 가드 불필요(읽기·공개).
- **대안(절약)**: 신설 대신 **서버 컴포넌트에서 직접 헬퍼 호출 + RecordsTabContent에 prop 주입**(profile-tabs가 SSR prefetch 방식이므로 정합). API 신설 회피 가능 → §6 결재.

### 3-C. 팀 기록 — **신설** `/api/web/teams/[id]/records?scope=games|tournaments|seasons`
- **조인**: `Team.id → TournamentTeam(team_id) → TournamentMatch(공식가드) → MatchPlayerStat`.
- **⚠️ 대회 경기 한정**(친선/픽업 박스 없음 — 시안 카피 "대회 경기 기록만 표시").
- **scope별**:
  - `games`: 이 팀이 뛴 TournamentMatch 목록(date/opp/result/score). 항목 클릭 → 해당 매치의 팀 선수별 박스 + 팀 합계 행.
  - `tournaments`: 대회 목록 → 클릭 → 대회 내 팀 로스터 집계 + 팀 평균.
  - `seasons`: 시즌별 로스터 집계 + 팀 평균.
- **로스터 기준**: 시안은 "글로벌 Team 로스터(TeamMember.userId)"라 하나, 운영 실측은 대회 단위 `TournamentTeamPlayer`가 stat 연결고리 → **TournamentTeam 경유 ttp 집계가 정확**(시안의 글로벌 로스터와 차이 → §6 결재).

---

## 4. statCols 21컬럼 ↔ MatchPlayerStat 매핑표

| # | 시안 statCols 키 | 실제 DB 컬럼(Prisma) | 존재 | 산출식/대체 |
|---|------------------|---------------------|------|------------|
| 1 | min | minutesPlayed (`@map minutes_played`) | ✅ | 집계=평균 |
| 2 | pts | points | ✅ | |
| 3 | fgm | fieldGoalsMade | ✅ | |
| 4 | fga | fieldGoalsAttempted | ✅ | |
| 5 | fg_pct | field_goal_percentage (Decimal 5,1) | ✅ | 없으면 fgm/fga·100 (집계는 합산 makes/att 권장) |
| 6 | tpm | threePointersMade | ✅ | |
| 7 | tpa | threePointersAttempted | ✅ | |
| 8 | tp_pct | three_point_percentage | ✅ | 없으면 tpm/tpa |
| 9 | ftm | freeThrowsMade | ✅ | |
| 10 | fta | freeThrowsAttempted | ✅ | |
| 11 | ft_pct | free_throw_percentage | ✅ | 없으면 ftm/fta |
| 12 | oreb | offensive_rebounds | ✅ | |
| 13 | dreb | defensive_rebounds | ✅ | |
| 14 | reb | total_rebounds | ✅ | 없으면 oreb+dreb |
| 15 | ast | assists | ✅ | |
| 16 | stl | steals | ✅ | |
| 17 | blk | blocks | ✅ | |
| 18 | tov | turnovers | ✅ | |
| 19 | pf | personal_fouls | ✅ | |
| 20 | pm | plusMinus (`@map plus_minus`) | ✅ | 경기=정수/집계=평균/팀=점수차 |
| 21 | **rating** | **MatchPlayerStat에 없음** | ❌ | **별도 소스(아래)** |

### ★평점(rating) 분리 — 박스 컬럼 아님
- **소스 후보 1**: `game_player_ratings.rating`(1~5점 정수, game_report 기반 동행자 매너평가). **매치 박스와 연결 끊김**(game_report_id 기반, tournament_match와 직접 조인 어려움). 척도도 1~5(시안은 7.4~9.2 = 10점 기여도).
- **소스 후보 2**: `UserSeasonStat.avg_rating`(Decimal 1.00~5.00). **단 UserSeasonStat = 0행**(cron 미동작, Phase 13+ 예정 — my-season-stats.ts 주석 명시).
- **결론**: 평점은 현재 **연결 가능한 매치 단위 데이터 없음** → 시안대로 **null → '–' 표시**가 정직. statCols가 null을 자동 '–' 처리하므로 **평점 컬럼은 비워두고 렌더만**(억지 매핑 금지). §6 결재로 확정.

> **결과**: 20/21 컬럼 실데이터 와이어 가능. 평점 1개만 '–'(데이터 부재 정직 표기).

---

## 5. 박제 단계 분해 (developer 1단계씩)

> 각 단계 독립 검증 가능. tsc·build 통과 단위. snake_case·공식가드 매 단계 점검.

| 단계 | 작업 | 담당 | 변경 파일(예상) | 규모 | 선행 |
|------|------|------|----------------|------|------|
| **[1]** | 공통 컴포넌트·CSS 반입 | developer | `_components/records/records-shared.tsx`(jsx→tsx 변환·React import·window전역 제거·타입화) + `records.css`(globals import 또는 동위치) | 中(+300) | 없음 |
| **[2]** | 집계 헬퍼 lib | developer | `src/lib/records/match-stat-aggregate.ts`(21컬럼 box 평균/합산 PURE) + my-season-stats.ts 승패판정·상대팀 로직 추출 재사용. 공식가드 적용 | 中(+250) | [1] |
| **[3]** | 대회 기록실 API+UI | developer | `api/web/tournaments/[id]/records/route.ts`(신설) + tournament-tabs.tsx records 탭(4곳) + `RecordsTabContent`(시안 TournamentRecords 박제) | 大(+450) | [1][2] |
| **[4]** | 선수 기록 API/헬퍼+UI | developer | `api/web/users/[id]/records`(또는 서버헬퍼) + profile-tabs.tsx 3번째 탭 + page.tsx records prop + `PlayerRecordsTab`(시안 박제) | 大(+400) | [1][2] |
| **[5]** | 팀 기록 API+UI | developer | `api/web/teams/[id]/records` + team-tabs 기록 탭(§6 결재: stats 교체 or 신규) + `TeamRecordsTab`(시안 박제·드릴다운) | 大(+450) | [1][2] |
| **[6]** | 검증 + 역박제 | tester + reviewer (병렬) | 공식가드 누락0·클레임링크·빈/로딩/미연동·720px·curl raw(snake)·build. BDR-current/ 역박제 검토 | 中 | [3][4][5] |

- **[3][4][5]는 [1][2] 완료 후 상호 독립** → 병렬 가능(단 멀티세션 파일 충돌 주의: 각자 다른 탭 파일).
- **최소 MVP 우선순위**: [1][2]→[3](대회 기록실, 신규 가치 가장 큼) 먼저, [4][5] 후속 가능.

### ⚠️ developer 주의사항
1. **공식가드 필수**: 모든 MatchPlayerStat 집계 = `officialMatchNestedFilter()` / TournamentMatch 조회 = `officialMatchWhere()`. **누락 시 미래/비공식 매치 오집계**(errors.md 재발 패턴).
2. **snake_case 함정(★재발 6회)**: `apiSuccess()` = 응답 키 자동 snake. 프론트 fetch 접근자도 snake(`data.players[0].fg_pct`). **단 서버 컴포넌트 직접 prisma는 camelCase**(혼동 금지). 신규 필드 추가 전 curl raw 1회 확인.
3. **평점 = null→'–'**: 억지 매핑 금지(§4). game_player_ratings/UserSeasonStat 둘 다 부적합.
4. **강조색 함정**: 시안 `var(--accent)`=빨강 폴백. 박제 시 `var(--cafe-blue)` 계열로 치환(errors 06-10·종료뷰 선례). 빨강 의미색(승자/LIVE)만 `--bdr-red` 유지.
5. **jsx→tsx**: 시안은 `window.RECORDS`/`window.RecShared` 전역. 박제 시 React import·named export·prop 타입화. 목업 데이터(records-data.jsx) 박제 금지 — 실 API 와이어.
6. **선수 식별**: ttp.userId 있는 선수만 링크. `claimed_user_id`(부모클레임)와 혼동 금지 — 개인 집계는 `userId` 기준.
7. **시안 teamHref(name)→실제 Team.id 필요**: 시안은 팀명으로 링크하나 운영은 `/teams/[Team.id]?tab=records`. DTO에 team_id 포함 필수.
8. **ShotChart/SeasonSummary 보류**: 컴포넌트 코드 유지하되 렌더 호출 안 함(시안도 시즌뷰 제거 명시). ShotZoneStat 바인딩은 PM 재도입 결정 후.

---

## 6. PM 결재 필요 항목 (사용자 확인)

| # | 항목 | 선택지 | 권장 | 사유 |
|---|------|--------|------|------|
| **Q1** | 평점(rating) 소스 | (가)null→'–' 표시 / (나)game_player_ratings 1~5 매핑 / (다)UserSeasonStat | **(가)** | game_player_ratings=매치 연결 끊김·척도 다름(1~5 vs 10점). UserSeasonStat=0행. 억지 매핑 = 사일런트 오류 |
| **Q2** | 팀 "기록" 탭 — 기존 stats 탭과 충돌 | (가)stats 탭 교체(TeamRecords로) / (나)별도 "기록실" 탭 신규 / (다)stats 안에 통합 | **(가) 또는 (다)** | team-tabs에 이미 "기록"(stats=StatsTabV2) 존재. 중복 탭 2개는 혼란. StatsTabV2 현재 내용 확인 후 결정 |
| **Q3** | 선수 탭 state 방식 | (가)local state 유지(2→3탭) / (나)?tab= URL param 전환 | **(나)** | 시안이 `?tab=records` 링크 출력. local이면 외부 링크 진입 시 기록 탭 못 열림. 단 전환은 추가 작업 |
| **Q4** | API vs 서버 직주입 | (가)웹 API 신설(client fetch+토글) / (나)서버 컴포넌트 헬퍼 직주입 | **화면별 혼합** | 대회=client 토글 많아 API / 선수=profile-tabs SSR prefetch라 직주입 절약 가능 / 팀=드릴다운 많아 API |
| **Q5** | 대회 리더보드 카테고리 | (가)시안 6종(+스틸/블록/3P%) 평균 / (나)기존 stat-leaders 4종 누적 재사용 | **(가) 확장** | 시안 6카테고리·평균 요구. stat-leaders 확장 or 신규 집계. 기존 종료뷰 카드(4종 누적)는 그대로 보존 |
| **Q6** | 팀 로스터 기준 | (가)글로벌 Team(TeamMember.userId) / (나)대회별 TournamentTeam 경유 ttp | **(나)** | stat 연결고리가 ttp뿐. 글로벌 TeamMember는 MatchPlayerStat 직접 연결 없음. 시안 가정과 차이 |
| **Q7** | 박제 순서/범위 | (가)[3]대회만 MVP 먼저 / (나)3화면 일괄 | **(가) 권장** | 대회 기록실 = 신규 가치 최대·독립적. 선수/팀은 후속 가능 |

---

## 7. 위험·함정 요약

- **공식가드 누락** → 미래/비공식 매치 오집계 (설계 단계에서 매 집계에 가드 명시 — §3·§5 주의1).
- **snake_case 자동변환** → 프론트 undefined 사일런트 버그 (★재발 6회·§5 주의2).
- **평점 억지 매핑** → 잘못된 점수 표시 (§4·Q1).
- **팀 탭 중복** → UX 혼란 (Q2).
- **선수 ?tab= 미지원** → 외부 링크 진입 실패 (Q3).
- **강조색 빨강 폴백** → 색상 오박 (§5 주의4).
- **시안 목업 박제** → mock 노출 (§5 주의5 — 실 API 와이어).

---

## 부록. 신규 라우트(architecture.md 기록용)
- `GET /api/web/tournaments/[id]/records` (공개·공식가드·선수/팀/경기 집계)
- `GET /api/web/users/[id]/records?scope=games|tournaments|seasons` (또는 서버헬퍼)
- `GET /api/web/teams/[id]/records?scope=games|tournaments|seasons` (대회 경기 한정)
- 신규 lib: `src/lib/records/match-stat-aggregate.ts` (21컬럼 box 집계 PURE)
- 신규 컴포넌트: `records-shared.tsx`(statCols·RecTable·Lnk) + 화면별 3 탭 컴포넌트
