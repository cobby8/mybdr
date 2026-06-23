# CLI 박제 프롬프트 — 기록(Records) 기능 (선수·팀·대회)

> 시안 = `Dev/design/BDR v2.33/_delivery-records-2026-06-16/` (확정·백엔드 수렴). subin 브랜치.
> **신규 DB 0**(매치 집계만). 공개 페이지(읽기). API/데이터 유지 + UI 추가 원칙.

## 0. 공통 규약 (필수)
- **공식기록 가드 필수**: 모든 대회 매치 집계는 `officialMatchNestedFilter()`/`officialMatchWhere()`(`src/lib/tournaments/official-match.ts`) 적용 — stat-leaders.ts 패턴 동일. (status∈completed,live + scheduledAt 과거)
- 응답 `apiSuccess()`(자동 snake_case). 프론트 접근자 snake.
- **선수 식별**: `TournamentTeamPlayer.userId`(클레임)만 개인 집계 → `/users/[id]` 링크. 미연동은 `player_name` 만(링크 없음).
- **시즌(연도)**: `MatchPlayerStat` 를 매치 날짜→`season_year` 로 집계(사전저장 없음).
- 집계 엔진: `stat-leaders.ts` 의 `groupBy(tournamentTeamPlayerId, _sum)` 재사용·확장.
- **평균/누적 토글 대응 (rev.3)**: 응답에 **`_sum`(누적) + `GP`(경기수) 양형 노출** → 평균=`_sum/GP`, 누적=`_sum`(직접). ⚠️ 누적을 `평균×G` 로 역산 금지(반올림 드리프트). 퍼센트(FG%·3P%·FT%)·평점은 평균/누적 동일(비율 유지). 경기별(단일 경기) 표는 토글 N/A.

## 1. statCols (21컬럼) — MatchPlayerStat 매핑
MIN(minutes_played)·PTS(points)·FGM/FGA(field_goals_*)·FG%(field_goal_percentage)·3PM/3PA/3P%·FTM/FTA/FT%·OR(offensive_rebounds)·DR(defensive_rebounds)·REB(total_rebounds)·AST(assists)·STL(steals)·BLK(blocks)·TO(turnovers)·PF(personal_fouls)·+/-(plus_minus)·평점.
- **평점은 박스 아님** — `game_player_ratings`/`avg_rating` 별도 소스. 출처 분리(없으면 '–').
- %는 `*_percentage` 있으면 사용, 없으면 makes/attempts 산출. REB 없으면 OR+DR.

## 2. 화면 ① 대회 기록실 — `/tournaments/[id]?tab=records`
- `tournament-tabs.tsx` 에 "기록실" 탭(icon `leaderboard`) 추가, lazy 로드(기존 탭 패턴).
- 서브: **[선수][팀][경기]**. 선수=리더 카테고리별 TOP3+더보기 + 전체 선수표 / 팀=순위(승–패·득실)+팀 박스 / 경기=대진 로그.
- API: 기존 `/api/v1/tournaments/[id]/player-stats` 재사용 또는 웹 `/api/web/tournaments/[id]/records` 신설(동일 집계, 공식가드). 시안 `TournamentRecords.jsx` 박제.

## 3. 화면 ② 선수 기록 — `/users/[id]` "기록" 탭
- `_v2/profile-tabs.tsx` 에 3번째 탭 "기록" 추가(현재 overview·games 2탭, 로컬 state — `?tab=records` 지원 추가 권장).
- 세그먼트 **[경기별][대회별][시즌별]**: 경기별=`MatchPlayerStat` 행(userId 매치, 공식가드) / 대회별=groupBy(tournament) 평균 / 시즌별=groupBy(season_year) 평균.
- 기존 시즌 스탯 카드·레이더·소속팀 **보존** → 그 아래/탭. 시안 `PlayerRecords.jsx` 박제.
- API: `/api/web/users/[id]/records?scope=games|tournaments|seasons` 신설(또는 `/v1/players/[id]/stats` 확장).

## 4. 화면 ③ 팀 기록 — `/teams/[id]` "기록" 탭
- 조인: `Team.id → TournamentTeam.team_id → TournamentMatch(공식가드) → MatchPlayerStat`.
- **[경기별][대회별]** = 목록 → 항목 클릭 → 해당 경기/대회 **팀 전체 박스(선수별 + 팀 합계/평균 pinned 행)** + "목록으로". **[시즌별]** = 로스터 집계 + 팀 평균 pinned.
- ⚠️ **대회 경기 한정**(친선/픽업 박스 없음) — 빈 상태 카피 "대회 경기 기록만 표시".
- API: `/api/web/teams/[id]/records?scope=...` 신설. 시안 `TeamRecords.jsx` 박제.

## 5. 공통 컴포넌트
- 시안 `records-shared.jsx`(statCols·RecTable 정렬/sticky/pinnedRows·Lnk) + `records.css` 반입.
- `Lnk` 해시 → 실제 라우트(`/users/[id]?tab=records`·`/teams/[id]?tab=records`).
- 슛차트(`ShotChart`)·시즌요약(`SeasonSummary`)은 컴포넌트 유지하되 **이번 박제 보류**(PM 재도입 결정 후 `ShotZoneStat` 바인딩).

## 6. 검증·기록
- 공식가드 누락 0(미래/비공식 매치 집계 금지) 확인. 클레임 선수만 링크 동작.
- 빈/로딩/미연동 상태 + 모바일 720px 분기. curl raw(snake) 확인. `npm run build`.
- `scratchpad.md` 1줄 + 신규 라우트 `architecture.md`. 미푸시 커밋 알림.
- **운영→시안 동기화 룰**: 새 공유 컴포넌트(RecTable 등) 추가 → `BDR-current/` 반영 검토(CLAUDE.md §운영→시안 동기화).
