# 🤝 코워크 전달 패키지 — 팀/선수/대회 **기록** (BDR v2.33)

> **From**: 디자인 클로드 (BDR v2.33)
> **To**: 프론트엔드 담당 · 백엔드 · PM
> **기능**: `/users/[id]` · `/teams/[id]` · `/tournaments/[id]` **기록** (NBA Game Log / Season / Shot 압축형)
> **상태**: ✅ **시안 확정 · 백엔드 실측 회신 반영(2026-06-16) · 검증 통과** · 운영 코드 변경 0 · 신규 DB 0
> **날짜**: 2026-06-16 (rev.2 — 백엔드 회신 반영)

---

## 0. 5초 요약

- **단일 표준 박스 양식**(statCols)으로 모든 기록표 통일 — 개인(경기·대회·시즌)·팀 로스터·대회 기록실이 **글자 그대로 동일 컬럼**: MIN·PTS·FGM·FGA·FG%·3PM·3PA·3P%·FTM·FTA·FT%·OR·DR·REB·AST·STL·BLK·TO·PF·**+/-**·평점.
- **진입 명칭 = "기록"**(개인·팀 탭/섹션 통일). 대회는 "기록실".
- **팀 기록 드릴다운**: 경기별·대회별은 **목록** → 항목 클릭 → 해당 경기/대회의 **팀 전체 기록(선수별 박스 + 팀 합계/평균 행)**. ⚠️ 경기별은 **대회 경기(TournamentMatch) 한정**(친선/픽업은 박스 없음).
- **선수/팀명 링크** 전 표 적용(개인·팀 페이지).
- 신규 DB 0 — 시즌 박스평균은 `MatchPlayerStat` 매치 집계. 미연동 선수는 대회 명단 이름만(`player_name`).

---

## 1. 패키지 구성 (자체 실행)

```
_delivery-records-2026-06-16/
├── DELIVERY.md                  ← (이 문서)
├── README.md                    ← 변경요약 · 데이터 매핑 · 통합 지점
├── Team-Player Records.html     ← 진입점 (선수·팀·대회 PC1240 + 모바일375)
├── records-data.jsx             ← 목업(실측 스키마 형태) + 집계 엔진(avgLine/aggregate)
├── records-shared.jsx           ← ★ statCols(표준 컬럼) · RecTable(정렬·sticky·pinnedRows) · Lnk · 슛차트/상태
├── records.css                  ← 기록 스타일 (토큰만 · 720px 분기)
├── screens/PlayerRecords.jsx    ← 선수 기록 (경기/대회/시즌)
├── screens/TeamRecords.jsx      ← 팀 기록 (목록→드릴다운, 팀 평균 행)
├── screens/TournamentRecords.jsx← 대회 기록실 (선수/팀/경기 + 스탯리더 TOP3+더보기)
├── tokens.css · shell.css · shared.jsx  ← v2.32 카피 (AppNav frozen · 변경 0)
```

**실행**: `Team-Player Records.html` 더블클릭. 빌드/서버 불필요.

---

## 2. ★ 표준 박스 컬럼 — `statCols` (단일 진실원)

`records-shared.jsx` 의 `statCols({ avg })` 가 모든 표의 스탯 컬럼을 생성합니다. 표마다 식별 컬럼(날짜/선수/대회 등)만 앞에 붙이고 동일 블록을 펼칩니다.

| 항목 | 규칙 |
|------|------|
| 컬럼 순서 | MIN · PTS · FGM · FGA · FG% · 3PM · 3PA · 3P% · FTM · FTA · FT% · OR · DR · REB · AST · STL · BLK · TO · PF · +/- · 평점 |
| `avg:false` | 경기별/단일경기 — raw 정수 |
| `avg:true` | 집계 — 평균(소수 1자리) |
| FG%/3P%/FT% | `*_pct` 있으면 사용, 없으면 makes/attempts에서 산출 |
| REB | `reb` 있으면 사용, 없으면 `oreb+dreb` |
| +/- | 양수 녹색·음수 적색 · 경기=정수/집계=평균 · 팀=득실(diff) |
| 무기록/미연동 | 각 값 null → '–' · 정렬 시 최하위 |

> **데이터 정합성**: 손수 평균은 `avgLine(makes/attempts)` 단일 빌더로 작성 → PTS(=2·FGM+3PM+FTM)·FG%·REB 파생. 행마다 내부 일관.

---

## 3. 화면별 동작

### 3-A. 선수 `/users/[id]` — "기록"
- 세그먼트 **[경기별][대회별][시즌별]**. 경기별=풀 박스 Game Log, 대회별=`groupBy` 평균, 시즌별=`season_year` 박스 평균표.
- 기존 시즌 스탯 카드·레이더·소속팀 **보존** 후 그 아래 확장.
- ⚠️ 시즌 **슛차트/요약 인디케이터는 제거**(추후 다른 방식 재구현 — 컴포넌트 `SeasonSummary`/`ShotChart`는 코드에 유지).

### 3-B. 팀 `/teams/[id]` — "기록"
- **경기별 / 대회별** = 목록 먼저 → 항목 클릭 → 해당 경기/대회 **팀 전체 기록**(선수별 박스 + 팀 합계/평균 행 고정) + "목록으로" 뒤로가기.
- **시즌별** = 시즌 스코프 로스터 집계 + **팀 평균 행** 상단 고정(`pinnedRows`).

### 3-C. 대회 `/tournaments/[id]` — "기록실"
- **[선수][팀][경기]**. 선수=스탯 리더 **카테고리별 TOP 3 + 더보기(전체 모달)** + 전체 선수표. 팀=순위(승–패·득실)+팀 박스. 경기=대진 로그.

모든 표: 선수명→개인 페이지, 팀/상대명→팀 페이지 링크(실측 라우트 `/users/[id]?tab=records`·`/teams/[id]?tab=records`).

---

## 4. 데이터 매핑 (실측 · 신규 DB 0)

| 단위 | 출처 |
|------|------|
| 경기별 | `MatchPlayerStat` 행 = 매치 박스스코어 |
| 대회별 | `MatchPlayerStat.groupBy(tournament)` 평균 |
| 시즌별 박스평균 | `MatchPlayerStat` → `season_year` 집계(사전저장 X) |
| 팀 로스터 | 글로벌 `Team`(`TeamMember.userId`) × 멤버 `MatchPlayerStat` |
| 팀 경기 박스 | `Team.id → TournamentTeam.team_id → TournamentMatch → MatchPlayerStat` (**대회 경기 한정** · 친선/픽업 박스 없음) |
| 대회 기록실 | `MatchPlayerStat`(대회 한정) · `TournamentTeam` · `TournamentMatch` |
| +/- | `MatchPlayerStat.plus_minus`(경기) / 집계 평균 / 팀=점수차 |

**제약**: ① 개인 박스는 클레임 선수(userId) 한정 — 미연동은 `player_name`만. ② 시즌 박스평균=매치 집계. ③ 팀 집계=글로벌 Team 로스터 기준(대회별 `TournamentTeam`과 별개).

---

## 5. 운영 박제 시 통합 지점

| 화면 | 통합 |
|------|------|
| `UserPublicProfile.jsx` | 기존 시즌 기록 카드(보존) **아래** `<PlayerRecords />` 삽입 · 탭/섹션명 "기록" |
| `TeamDetail.jsx` | 탭에 "기록" 추가 → `<TeamRecords />` |
| `TournamentDetail` | "기록실" 탭 → `<TournamentRecords />` |
| 공통 | `records-shared.jsx`(statCols·RecTable·Lnk) + `records.css` 반입 · `Lnk`는 실측 라우트(`?tab=records`)로 출력 — 기록 탭은 `?tab=` lazy 로드 |

---

## 6. 백엔드 실측 회신 반영 (2026-06-16) — ✅ 4건 종결

| # | 항목 | 회신 | 시안 반영 |
|---|------|------|----------|
| 1 | **+/-(plus_minus)** | `MatchPlayerStat.plusMinus`(`@map("plus_minus")`, Int) 실재 · 산출식 불필요 | 그대로 유지(경기=정수/집계=평균/팀=점수차) |
| 2 | **시즌 슛차트** | `ShotZoneStat`(season_year·zone_code·attempts·made·efficiency) 실재 | 컴포넌트 유지 · 재도입 방식 PM 결정 대기 |
| 3 | **팀 경기 박스** ⚠️정정 | `TeamMatch` **부재** · 박스는 `tournament_match_id` 에만 연결 → **대회 경기 한정** | 경기별 안내/주석을 `Team.id→TournamentTeam→TournamentMatch→MatchPlayerStat` 경로로 교체 · "대회 경기에서만 기록" 명시 · 친선/픽업 박스 없음 표기 |
| 4 | **링크 라우트** | `/users/[id]`·`/teams/[id]`·`/tournaments/[id]` 실재 · 기록 탭은 `?tab=records` lazy | `Lnk` 해시 → 실제 라우트 치환 완료 |

**추가 확인**: statCols 전 컬럼 `MatchPlayerStat` 매핑 OK(OR=offensive_rebounds·DR=defensive_rebounds·REB=total_rebounds·TO=turnovers·PF=personal_fouls). **평점은 박스와 출처 분리** — `game_player_ratings`/`avg_rating`(박스 컬럼 아님) → 박제 시 출처 분리 매핑.

> 정정 1건(팀 경기=대회 경기 한정)만 라벨/카피 반영 완료 → **운영 박제 착수 가능.** 박제 신규: 3개 탭(users/teams/tournaments `?tab=records`) + 웹 집계 엔드포인트(기존 `/v1/tournaments/[id]/player-stats`·`stat-leaders.ts` 재사용).

---

## 7. 자체 검수

- AppNav frozen 카피 · `var(--*)` 토큰만 · 핑크/살몬 0 · pill 9999px 0(4–8px) · 720px 분기 · 콘솔 에러 0.
- 미연동/빈/로딩 상태 · 모바일(선수·팀·대회 375) 모두 구현.
- 참고: 미리보기에서 Material Symbols가 텍스트로 보이는 건 폰트 CDN 오프라인 탓 — 네트워크 환경에선 글리프 정상.
