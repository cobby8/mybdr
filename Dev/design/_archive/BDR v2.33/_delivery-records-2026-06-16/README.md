# BDR v2.33 — 팀/선수 기록 (경기별·대회별·시즌별)

> P1 · 박제 C/D → A · NBA.com Game Log / Season / Shot Chart 압축형.
> 백엔드 실측 완료 — **신규 DB 0**(시즌 박스평균은 MatchPlayerStat 매치 집계).

## 변경 요약 (v2.32 → v2.33)

선수 `/users/[id]` 와 팀 `/teams/[id]` 에 **3단위 세그먼트 토글**(경기별·대회별·시즌별) 기록 섹션을 신설했습니다. 같은 테이블 골격에 집계 단위만 전환하며, 시즌별은 **시즌 요약 + 슛차트(존별 효율) + 박스 평균**을 추가로 보여줍니다.

## 신규 산출물

| 파일 | 역할 |
|------|------|
| `screens/PlayerRecords.jsx` | 선수 기록 섹션 — 경기별(Game Log) / 대회별(groupBy) / 시즌별(요약+슛차트+박스평균) |
| `screens/TeamRecords.jsx` | 팀 로스터 집계 — 전체 선수 × 동일 3단위 토글 · 행→`/users/[id]` |
| `screens/TournamentRecords.jsx` | 대회 기록실 `/tournaments/[id]` — 선수 리더보드 / 팀 집계 / 경기 로그 토글 · 행→개인·팀·경기 |
| `records-shared.jsx` | 공통: `RecSeg`(세그먼트) · `RecTable`(sortable) · `ShotChart`(하프코트 존별) · `SeasonSummary` · 상태(`RecEmpty`/`RecLoading`/`RecUnclaimed`) |
| `records-data.jsx` | 목업 — 백엔드 실측 스키마 형태 |
| `records.css` | 기록 스타일 (토큰만 · pill 금지 · 720px 분기 + `.vp--mobile` 스코프) |
| `Team-Player Records.html` | 인터랙티브 시안 — 선수 · 팀 · 대회 기록실 **모두 PC(1240) + 모바일(375)** |
| `tokens.css` · `shell.css` · `shared.jsx` | v2.32 카피 (AppNav frozen 포함 · 변경 0) |

## 디자인 시스템

- **세그먼트 토글** `[경기별][대회별][시즌별]` — radius 4px(`--r-sm`), 활성 `--accent`. pill 9999px 미사용.
- **공통 sortable 테이블** — `--ff-mono` 우측정렬 숫자, `--bg-alt` 헤더, 헤더 클릭 정렬(활성 컬럼만 ▲▼), 첫 열 sticky + 가로 스크롤. 테이블은 내용 폭(content-width)으로 컬럼이 좌측부터 촘촘히 붙고, 카드보다 넓으면 가로 스크롤.
- **표준 박스 컬럼 (statCols 단일 팩토리)** — 모든 기록표(개인 경기·대회·시즌 / 팀 로스터 / 대회 기록실 선수·팀)가 글자 그대로 동일 양식: **MIN·PTS·FGM·FGA·FG%·3PM·3PA·3P%·FTM·FTA·FT%·OR·DR·REB·AST·STL·BLK·TO·PF·평점**. 경기별=raw 정수, 집계=평균(소수 1자리). 데이터는 makes/attempts 기반 단일 빌더(`avgLine`)로 통일 → PTS·FG%·REB 파생, 내부 정합성 보장.
- **슛차트** — 하프코트 SVG(존 마커 = attempts 크기, 효율 컬러스케일) + 존 효율 테이블. 컬러: `≥50% --accent / 40–49% --warn / <40% --ink-mute` (Stats.jsx `zc()` 재사용).
- **시즌 요약** — 경기·전적·평점·MVP·순위 스탯 카드 (`UserSeasonStat`). *(v2.33b: 슛차트·요약 인디케이터는 선수 시즌 뷰에서 제거 — 추후 다른 방식으로 재구현. 컴포넌트는 유지.)*
- **상태** — 로딩 스켈레톤 / 빈 기록 / 미클레임(개인 연동 전, `player_name`만).
- **진입 명칭 = "기록"** — 개인·팀 모두 기록 탭/섹션 명칭 통일.
- **팀 기록 드릴다운** — 팀 페이지 경기별·대회별은 **목록**(경기·대회)을 먼저 보여주고, 항목 클릭 → 해당 경기/대회의 **팀 전체 기록(선수별 박스 + 팀 합계/평균 행)**. 시즌별은 시즌 집계.
- **선수/팀 링크** — 모든 표의 선수명 → 개인 페이지, 팀/상대명 → 팀 페이지 링크(`Lnk`). 라우트: `/users/[id]?tab=records` · `/teams/[id]?tab=records` (실측 확정 · 기록 탭은 `?tab=` lazy 로드).
- **+/- (plus-minus)** — 모든 표준 박스 표에 PF 다음 컬럼으로 추가. 양수 녹색·음수 적색. 경기별=정수, 집계=평균. 팀(대회 기록실)은 득실(point diff)과 동일값. 실측 `MatchPlayerStat.plusMinus` 확인.일값.
- **팀 전체 평균 행** — 팀 페이지 각 탭(경기·대회·시즌) 상단에 연동 선수 합산 기반 팀 박스 평균을 `pinnedRows`로 고정(정렬 무관, 파란 강조).
- **스탯 리더 (대회 기록실)** — 카테고리별 **TOP 3** 간략 표시 + **더보기** → 해당 스탯 전체 선수 순위 모달.

## 데이터 매핑 (실측 · 신규 DB 0)

| 단위 | 출처 |
|------|------|
| 경기별 | `MatchPlayerStat` 행 = 매치 박스스코어(전 컬럼) |
| 대회별 | `MatchPlayerStat.groupBy(tournament)` 합계/평균 |
| 시즌별 박스평균 | `MatchPlayerStat` → `season_year` 집계 (사전저장 X · 매치 계산) |
| 시즌 요약 | `UserSeasonStat`(games_played·wins·losses·avg_rating·mvp_count·rank_position) |
| 슛차트 | `ShotZoneStat`(season_year·zone_code·attempts·made·efficiency) |
| 팀 로스터 | 글로벌 `Team`(`TeamMember.userId`) × 각 멤버 `MatchPlayerStat` |
| 팀 경기 박스 | `Team.id → TournamentTeam.team_id → TournamentMatch → MatchPlayerStat` (**대회 경기 한정** · 친선/픽업은 박스 없음) |
| +/- | `MatchPlayerStat.plusMinus`(`@map("plus_minus")`, Int) — 실측 확인 · 산출식 불필요 |
| 평점 | 박스와 출처 분리 — `game_player_ratings`/`avg_rating`(`MatchPlayerStat` 박스 컬럼과 별개) |

> 백엔드 실측 회신(2026-06-16): statCols 전 컬럼 `MatchPlayerStat` 매핑 OK · 신규 DB 0. `TeamMatch` 모델 부재 → 팀/선수 "경기별"은 위 `TournamentMatch` 경로로 확정.

**제약 반영**: ① 개인 박스 기록은 **클레임 선수(userId)** 한정 — 미클레임은 `player_name`만(미연동 뱃지·비활성). ② 시즌 박스평균 = 매치 집계 결과. ③ 팀 집계 = 글로벌 Team 로스터 기준(대회별 `TournamentTeam` 과 별개) — 푸터에 명시.

## 통합 지점 (운영 박제 시)

- **선수**: `UserPublicProfile.jsx` 의 기존 "시즌 기록" 카드(보존) **아래**에 `<PlayerRecords />` 삽입. `user-stats-section`·`user-radar-section`·소속팀 카드 변경 0.
- **팀**: `TeamDetail.jsx` 의 `tu2-tabs` 에 "전체 기록" 탭 추가 → `<TeamRecords />`. 기존 개요/로스터/최근/통계 탭 보존.
- 시안 데모는 보존 섹션을 안내 배너로 축약하고 신규 섹션을 실물로 렌더(통합 위치 확인용).

## 연결 (Connections)

- 진입: 선수/팀 페이지 탭.
- 경기별 행 → 경기 상세 · 대회별 행 → `/tournaments/[id]` 기록실 · 팀 선수 행 → `/users/[id]`.
- 복귀: 원 페이지(AppNav · 탭).

## 자체 검수

- §1 AppNav: shared.jsx frozen 카피 — 변경 0 (9탭·utility·우측 컨트롤 그대로).
- §3 토큰: `var(--*)` 만 · 하드코딩 hex 0 · 핑크/살몬/코랄 0 · pill 9999px 0(버튼/카드 4–8px).
- §4 카피: "전국 농구 매칭 플랫폼" 컨텍스트 · placeholder 없음.
- §5 모바일: 720px 분기 + `.vp--mobile` 스코프 · 첫 열 sticky + 가로 스크롤 · 슛차트 단일 컬럼 · 44px 터치.
- §3-3 상태: empty / loading 스켈레톤 / 미클레임 안내 모두 구현.

> 참고: 시안 미리보기에서 Material Symbols 글리프는 폰트 CDN 미로딩 시 텍스트로 보일 수 있음 — 네트워크 환경(운영)에선 아이콘으로 정상 표시.
