# 공개 프로필 (`/users/[id]`) NBA.com 스타일 개선 — 설계 보고서

작성일: 2026-05-09
담당: planner-architect
상태: 설계 (코드 변경 0 / DB 변경 0 / API 변경 0)

---

## 0. 목표 한 문장

타인 공개 프로필 (`/users/[id]`) 의 "최근 경기" 섹션을 **대회상세의 매치 카드 패턴 (ScheduleTimeline)** 과 동일한 카드형 UI 로 재구성하고, 카드 클릭 시 해당 매치 라이브 페이지(`/live/[id]`)로 이동시킨다. 더불어 NBA.com 선수 페이지 모델을 mybdr 운영 데이터 가용성에 매핑하여 **개인 기록 (통산/시즌)** 과 **경기별 box score 수치** 표시를 강화한다.

---

## 1. 현황 분석

### 1.1 운영 페이지 현재 구조 (`src/app/(web)/users/[id]/page.tsx`)

**Hero 영역** (`_v2/player-hero.tsx`)
- 그라디언트 배경 (소속팀 primaryColor)
- 아바타 120px / 이름 / 닉네임·지역·성별 / Lv·★평점 배지
- Physical strip 3열: 키 / 몸무게 / 최근 접속

**ProfileTabs 2개** (`_v2/profile-tabs.tsx`)
- `overview` (개요)
- `games` (최근 경기)

**OverviewTab** (`_v2/overview-tab.tsx`)
- 좌측 main: 자기소개 카드 + **통산 스탯 6열** (경기 / 승률 / PPG / APG / RPG / BPG)
- 우측 aside: 소속 팀 카드 / 활동 카드 (가입일·경기수·주최수) / 뱃지 4개 카드

**RecentGamesTab** (`_v2/recent-games-tab.tsx`)
- board__head + board__row 6열 grid (날짜 / 경기 / PTS / REB / AST / STL)
- **카드 X / 단순 텍스트 행 — 사용자가 개선 요청한 부분**
- 클릭 라우팅 X
- `gameTitle = roundName` 만 표시 (상대팀·점수·매치 코드 누락)

### 1.2 데이터 fetch (page.tsx 8 쿼리 병렬)

| # | 쿼리 | 산출 |
|---|------|------|
| 1 | `prisma.user.findUnique` + teamMembers join | user / 소속팀 |
| 2 | `prisma.matchPlayerStat.aggregate _avg` | 통산 평균 (PPG/APG/RPG/STL/BPG) |
| 3 | `prisma.matchPlayerStat.findMany take:10` | 최근 경기 10건 |
| 4 | `getPlayerStats(userId)` (`src/lib/services/user.ts`) | 승률 + careerAverages + seasonHighs |
| 5 | follows record | 팔로우 여부 |
| 6 | follows count | 팔로워 수 (현재 미사용) |
| 7 | follows count | 팔로잉 수 (현재 미사용) |
| 8 | `user_badges.findMany take:4` | 최근 뱃지 4건 |

**핵심 누락**: 쿼리 #3 의 select 가 매치 메타 (homeTeam / awayTeam / homeScore / awayScore / status / match_code / group_name 등) 를 전혀 fetch 하지 않음. 카드 표시에 필요한 데이터가 DB 에는 있지만 page.tsx 에서 안 가져오고 있음.

### 1.3 운영 DB 데이터 모델 (Prisma schema)

**TournamentMatch** (line 630~703, schema.prisma) — 풍부:
- `homeTeamId / awayTeamId / homeScore / awayScore`
- `status` (`scheduled / in_progress / live / completed`)
- `scheduledAt / started_at / ended_at / venue_name / court_number`
- `roundName / round_number / match_number / group_name / group_letter`
- **`match_code`** (Phase 5 매치 코드 v4 — 형식 `26-GG-MD21-001`)
- `winner_team_id / mvp_player_id`
- `quarterScores` (Json)

**MatchPlayerStat** (line 722~773) — NBA box score 수준 풍부:
- 득점: `points` / `fieldGoalsMade/Attempted` / `field_goal_percentage`
- 3점: `threePointersMade/Attempted` / `three_point_percentage`
- 자유투: `freeThrowsMade/Attempted` / `free_throw_percentage`
- 리바운드: `offensive_rebounds` / `defensive_rebounds` / `total_rebounds`
- 어시 / 스틸 / 블락: `assists` / `steals` / `blocks`
- 기타: `turnovers` / `personal_fouls` / `technicalFouls` / `unsportsmanlikeFouls`
- 출전: `minutesPlayed` / `isStarter` / `fouled_out` / `ejected`
- 효율: `plusMinus` / `efficiency` / `true_shooting_percentage` / `effective_fg_percentage` / `assist_turnover_ratio`
- 2점: `two_pointers_made/attempted` / `two_point_percentage`

**TournamentTeam** (link via TournamentMatch.homeTeamId/awayTeamId)
- `team` 관계로 실제 Team (logoUrl / primaryColor / name) 접근 가능

**UserSeasonStat** (line 2938~2960) — Phase 12-A 추가, **현재 집계 cron 미실행**:
- `season_year / season_label / games_played / wins / losses`
- `avg_rating / mvp_count / rank_position / total_minutes / total_xp`
- 비고: schema 상 컬럼은 있지만 cron 미동작 (Phase 13+ 예정). 현재 DB 거의 비어있음 (확인 필요)

**ShotZoneStat** (line 2965~2986) — schema 만 있음, 집계 cron 미동작:
- `zone_code / attempts / made / efficiency`

**MVP 카운트**: `tournament_matches.mvp_player_id` 직접 집계 가능 (테이블 신설 0)

### 1.4 대회상세 매치 카드 패턴 (`schedule-timeline.tsx`)

**카드 구조** (Image #12 일치):
1. **상단 메타 줄** (flex-wrap inline):
   - `match_code` (있으면) — `font-mono` 14자 ≪ 26-GG-MD21-001 ≫
     - 없으면 `#매치번호` fallback
   - 구분선 `|`
   - `roundName` (예: "B조 2경기")
   - 구분선 `|`
   - 시간 (예: "5/2(토) 15:30" — formatShortTime)
   - 구분선 `|`
   - 코트 번호
   - 우측: StatusBadge (`종료` info / `LIVE` error / `예정` default)
2. **하단 VS 행**:
   - 홈팀: 로고(좌) + 팀명 (truncate, font-bold)
   - 중앙 스코어 박스 (rounded-full bg-elevated, 종료/라이브 시): `XX : XX` (승팀 색상 primary)
   - 어웨이팀: 팀명 + 로고(우)
   - 예정 시: 중앙 박스 = `VS` (rounded-full bg-primary)
3. **링크**: `<Link href={`/live/${match.id}`}>` — block, hover:opacity-80, isHighlighted 시 left border primary

**팀 로고 (TeamLogo)**: 32px 모바일 / 36px 데스크톱, 원형(`rounded-full`), `object-contain`, 1px border. 없으면 첫 글자 fallback.

### 1.5 라우팅 — 매치 페이지

| 경로 | 역할 |
|------|------|
| `/live/[id]` | 정식 매치 상세 (101KB page.tsx — box score + play-by-play + 라이브) |
| `/match/[code]` | match_code v4 deep link → `/live/[id]` redirect |

→ **카드 클릭 라우팅은 `/live/${match.id}` 가 표준** (대회상세와 동일).

---

## 2. NBA.com 모델 매핑 (mybdr 운영 데이터 종속)

| NBA.com 섹션 | mybdr 적용 | 데이터 출처 / 가용성 |
|--------------|-----------|--------------------|
| **Profile Header** (사진/이름/팀/번호/포지션/신체) | ✅ 이미 있음 (PlayerHero) | User + TournamentTeamPlayer.jerseyNumber (현재 미반영 — 보강 가능) |
| **Career Stats — 통산 누적/평균** | ✅ 강화 가능 | matchPlayerStat aggregate. 현재 6열 → **12열 확장** 권장 |
| **Stats Per Game (Season)** — 시즌별 평균 | ⚠️ 부분 적용 | UserSeasonStat 집계 cron 미실행 → **온디맨드 GROUP BY** 또는 "준비 중" 표시 |
| **Recent Games / Game Log** — 경기별 box score | ✅ **강화 핵심** | matchPlayerStat findMany + tournamentMatch include (homeTeam/awayTeam/score 등) |
| **Splits** (홈/원정, 승/패, 월별) | ❌ 미지원 | 홈/원정 구분 = `tournamentTeam.id == homeTeamId/awayTeamId` 비교 필요. 복잡도 ↑ → **2차 후보** |
| **Shot Chart** (코트 위치별) | ❌ 미지원 | ShotZoneStat schema 있지만 cron 미동작. 표시 0. |
| **Awards / Highlights** (MVP·챔피언) | ✅ 적용 | tournamentMatch.mvp_player_id COUNT + tournament champion (별도 검토) |
| **Career Highlights / Hot Zones** | ❌ 미지원 | 데이터 없음 |

→ **mybdr 적용 범위 (Phase 1)**: Profile Header / Career Stats 12열 / Recent Games 카드형 / Awards (MVP 카운트). Splits / Shot Chart 는 후속.

---

## 3. 신규 디자인 구조 (NBA 스타일)

### 3.1 전체 레이아웃 (변경 점만)

```
[PlayerHero — 변경 0 / 기존 유지]
   - jerseyNumber 추가 노출 검토 (Q3)

[ProfileTabs]
   - 현재: overview / games (2개)
   - 옵션 A (단순): overview / games 유지 + games 만 카드형
   - 옵션 B (NBA 충실): overview / stats / games / awards (4개)
                       시즌별 평균 stats 탭 추가, awards 탭 추가
   → Q1 결재

[OverviewTab — 강화]
   - 통산 스탯 6열 → 12열 (PPG/RPG/APG/SPG/BPG/MIN | FG%/3P%/FT%/eFG%/TS%/+/-)
     · 모바일 분기: 6열 ▽ 6열 (2행) 또는 4열 ▽ 4열 ▽ 4열 (3행)
   - aside (소속팀 / 활동 / 뱃지) 변경 0

[RecentGamesTab — 카드형 재구성 ⭐ 핵심]
   - 기존 board 행 → 매치 카드 5건 (대회상세 ScheduleTimeline 패턴)
   - 카드 구조:
     ┌────────────────────────────────────────────────────┐
     │ 26-GG-MD21-006 | B조 2경기 | 5/2(토) 15:30 [종료]   │   상단 메타
     │  ┌────┐                       ┌────┐                │
     │  │ HM │ HOMETEAM   24 : 18   │ AW │ AWAYTEAM       │   VS 행
     │  └────┘                       └────┘                │
     │  ─────────────────────────────────────────────────   │
     │  내 기록: 22 PTS / 14 REB / 3 AST / 2 STL  (W)      │   ⭐ 추가 줄
     └────────────────────────────────────────────────────┘
   - 클릭 → /live/{matchId}

[(옵션 B) StatsTab — 신규]
   - 시즌별 평균 board (UserSeasonStat) — Q2 결재 (현재 cron 0 → "준비 중" 또는 온디맨드)

[(옵션 B) AwardsTab — 신규]
   - MVP 카운트 + 우승 횟수 + 뱃지 전체
```

### 3.2 매치 카드 props 시그니처 (제안)

```ts
// src/components/match/PlayerMatchCard.tsx (신규)
export interface PlayerMatchCardProps {
  // 매치 메타 (대회상세 ScheduleMatch 와 키 통일)
  matchId: string;
  matchCode: string | null;       // 26-GG-MD21-006 (없으면 #매치번호 fallback)
  matchNumber: number | null;
  groupName: string | null;        // "B조"
  roundName: string | null;        // "B조 2경기"
  scheduledAt: string | null;      // ISO
  courtNumber: string | null;
  status: string | null;           // scheduled / live / completed

  // 팀 (대회상세와 동일)
  homeTeamName: string | null;
  homeTeamLogoUrl: string | null;
  homeScore: number | null;
  awayTeamName: string | null;
  awayTeamLogoUrl: string | null;
  awayScore: number | null;

  // ⭐ 선수 본인 기록 (NBA Game Log 핵심 차별화)
  playerStat: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks?: number;
    minutesPlayed?: number | null;
    fgMade?: number;
    fgAttempted?: number;
    threeMade?: number;
    threeAttempted?: number;
    plusMinus?: number | null;
    isStarter?: boolean;
  };

  // 본인 팀이 어느 쪽인지 — 승/패 표시용
  playerSide: "home" | "away" | null;
}
```

→ **재사용 vs 신규 분리 결정**: 신규 분리 (`PlayerMatchCard`) 추천. 사유:
1. 대회상세 카드 = 매치 메타 only / 본 카드 = 매치 메타 + 선수 기록 줄 추가 (책임 다름)
2. 대회상세 `ScheduleTimeline` 은 검색·필터 로직 포함 — 강결합 분리 어려움
3. 시각 패턴은 동일 카피 → JSX 구조는 카피, props 인터페이스만 확장
4. 향후 팀 페이지 (`/teams/[id]`) 의 "최근 경기" 섹션도 동일 컴포넌트 재활용 가능 (한 번 잘 만들어두면 N곳 사용)

---

## 4. 카드 클릭 라우팅 결정

| 옵션 | 경로 | 장점 | 단점 |
|------|------|------|------|
| A ⭐ | `/live/${matchId}` | 매치 상세 ID 직접 / 대회상세와 일관 / DB 조회 0 redirect | match_code v4 가 노출 안 됨 (URL) |
| B | `/match/${matchCode}` (있으면) → `/live/[id]` redirect | 외부 공유 시 의미있는 URL | matchCode NULL 매치는 fallback 필요 / redirect 1회 추가 |

→ **A 채택 권장**. 사유: 대회상세 ScheduleTimeline 이 이미 `/live/${match.id}` 사용 중이라 패턴 일관. 외부 공유 시에는 사용자가 라이브 페이지에서 매치 코드 노출되는 별도 영역에서 카피 가능.

---

## 5. 데이터 fetch 설계

### 5.1 `page.tsx` 쿼리 #3 확장 (신규 API 0)

**현재**:
```ts
prisma.matchPlayerStat.findMany({
  where: { tournamentTeamPlayer: { userId: userIdBigInt } },
  select: {
    id: true, points: true, total_rebounds: true, assists: true, steals: true,
    tournamentMatch: { select: { roundName: true, scheduledAt: true } },
  },
  orderBy: { createdAt: "desc" },
  take: 10,
})
```

**확장 (제안)**:
```ts
prisma.matchPlayerStat.findMany({
  where: {
    tournamentTeamPlayer: { userId: userIdBigInt },
    // Phase 3: 공식 기록만 (officialMatchNestedFilter 가드 — 미래/예약 제외)
    tournamentMatch: officialMatchNestedFilter(),
  },
  select: {
    id: true,
    points: true,
    total_rebounds: true,
    assists: true,
    steals: true,
    blocks: true,
    minutesPlayed: true,
    fieldGoalsMade: true,
    fieldGoalsAttempted: true,
    threePointersMade: true,
    threePointersAttempted: true,
    plusMinus: true,
    isStarter: true,
    tournamentTeamPlayer: {
      select: { tournamentTeamId: true },
    },
    tournamentMatch: {
      select: {
        id: true,
        match_code: true,
        match_number: true,
        group_name: true,
        roundName: true,
        scheduledAt: true,
        court_number: true,
        status: true,
        homeScore: true,
        awayScore: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: {
          select: {
            id: true,
            name: true,
            team: { select: { logoUrl: true } },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            team: { select: { logoUrl: true } },
          },
        },
      },
    },
  },
  orderBy: { tournamentMatch: { scheduledAt: "desc" } },  // 시간 정렬 (생성순 ❌)
  take: 10,
})
```

**page.tsx 변환 로직 (신규)**:
```ts
const recentGameRows: PlayerMatchCardProps[] = recentGames.map((g) => {
  const m = g.tournamentMatch!;
  const playerTtId = g.tournamentTeamPlayer.tournamentTeamId;
  const playerSide: "home" | "away" | null =
    playerTtId === m.homeTeamId ? "home"
    : playerTtId === m.awayTeamId ? "away"
    : null;

  return {
    matchId: m.id.toString(),
    matchCode: m.match_code,
    matchNumber: m.match_number,
    groupName: m.group_name,
    roundName: m.roundName,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    courtNumber: m.court_number,
    status: m.status,
    homeTeamName: m.homeTeam?.name ?? null,
    homeTeamLogoUrl: m.homeTeam?.team?.logoUrl ?? null,
    homeScore: m.homeScore,
    awayTeamName: m.awayTeam?.name ?? null,
    awayTeamLogoUrl: m.awayTeam?.team?.logoUrl ?? null,
    awayScore: m.awayScore,
    playerStat: {
      points: g.points ?? 0,
      rebounds: g.total_rebounds ?? 0,
      assists: g.assists ?? 0,
      steals: g.steals ?? 0,
      blocks: g.blocks ?? 0,
      minutesPlayed: g.minutesPlayed,
      fgMade: g.fieldGoalsMade ?? 0,
      fgAttempted: g.fieldGoalsAttempted ?? 0,
      threeMade: g.threePointersMade ?? 0,
      threeAttempted: g.threePointersAttempted ?? 0,
      plusMinus: g.plusMinus,
      isStarter: g.isStarter ?? false,
    },
    playerSide,
  };
});
```

### 5.2 통산 스탯 12열 확장 (Q4 결재 — 6 → 12)

```ts
prisma.matchPlayerStat.aggregate({
  where: {
    tournamentTeamPlayer: { userId: userIdBigInt },
    tournamentMatch: officialMatchNestedFilter(),
  },
  _avg: {
    points: true,
    total_rebounds: true,
    assists: true,
    steals: true,
    blocks: true,
    minutesPlayed: true,            // ⭐ 추가
    field_goal_percentage: true,    // ⭐ 추가
    three_point_percentage: true,   // ⭐ 추가
    free_throw_percentage: true,    // ⭐ 추가
    effective_fg_percentage: true,  // ⭐ 추가 (또는 TS%)
    plusMinus: true,                // ⭐ 추가 (선택)
  },
  _count: { id: true },
});
```

→ DB 변경 0 / API 변경 0 / fetch 1건 그대로 — `_avg` 키만 추가.

### 5.3 (옵션) MVP 카운트 — Awards 탭 시

```ts
prisma.tournamentMatch.count({
  where: { mvp_player_id: userIdBigInt }
})
```

→ 신규 쿼리 1건 (병렬 prefetch 추가).

---

## 6. 시안 박제 (`Dev/design/BDR-current/screens/PlayerProfile.jsx` 갱신)

### 6.1 현재 시안 vs 운영 갭

| 항목 | 시안 (PlayerProfile.jsx) | 운영 코드 |
|------|-------------------------|----------|
| Hero | 그라디언트 + 120px 아바타 + jersey badge | ✅ 동일 |
| Tabs | overview / stats / games / vs (4개) | overview / games (2개 — D-P5 단순화) |
| 최근 경기 | board__row 8열 (날짜·상대·결과·스코어·PTS·REB·AST·STL) — **카드 X** | board__row 6열 (카드 X) |
| 슛 존 | 있음 (mock) | ❌ 제외 (D-P6 결정) |
| 스카우팅 리포트 | 있음 (mock) | ❌ 제외 (D-P6 결정) |
| vs 나와의 전적 | 있음 (mock) | ❌ 제외 (D-P5 결정) |

→ **시안도 동일하게 카드 X**. 본 작업의 핵심 = **시안 + 운영 동시 카드형 전환**.

### 6.2 시안 갱신 항목 (Phase 1 결재 후)

1. `screens/PlayerProfile.jsx` 의 `tab === 'games'` 블록을 카드형으로 재작성
   - 카드 메타 줄: `26-GG-MD21-006 | B조 2경기 | 5/2(토) 15:30 [종료]`
   - VS 행: 홈팀 로고+이름 / 스코어 박스 / 어웨이팀 이름+로고
   - 본인 기록 줄: `22 PTS · 14 REB · 3 AST · 2 STL  (W)`
2. `tab === 'overview'` 의 통산 스탯 grid 6열 → 12열 (옵션 — Q4 결재 종속)
3. (옵션 B 채택 시) `tab === 'stats'` / `tab === 'awards'` 활성

### 6.3 박제 룰 준수 체크 (claude-project-knowledge 13 룰)

- [x] AppNav 7 룰 = 본 작업 무관 (페이지 본문만)
- [x] 디자인 토큰 — 모든 색상 var(--*) 사용 / 핑크·살몬·코랄 ❌ / lucide-react ❌
- [x] 카피 — placeholder 5단어 이내, "예: " ❌ (해당 없음 — 본 페이지 input 0건)
- [x] 모바일 — 720px 분기 / 카드 mobile 1열 (대회상세 ScheduleTimeline 패턴 카피)
- [x] 사용자 결정 §1~§8 위반 0 (헤더/더보기/카피 영향 없음)

---

## 7. 회귀 0 보장 — 위험 분석

| 영역 | 위험 | 대응 |
|------|------|------|
| Flutter `/api/v1/*` | ❌ 0 | 본 작업 = `(web)/users/[id]/page.tsx` 한정 / API 0 변경 |
| `/api/web/*` | ❌ 0 | 신규 API 0 / 기존 호출 0 |
| Prisma schema | ❌ 0 | 컬럼 추가/변경 0 / select 키 추가만 (NULL 안전) |
| 본인 프로필 (`/profile`) | ❌ 0 | 본 페이지는 `/users/[id]` 한정. isOwner 시 redirect 유지 |
| 대회상세 ScheduleTimeline | ❌ 0 | 코드 카피만 (재사용 안 함) — 원본 미수정 |
| Phase 3 공식 기록 가드 | ✅ 강화 | 현재 page.tsx 쿼리 #3 에 가드 누락 → `officialMatchNestedFilter()` 추가로 회귀 fix 효과 |
| ISR 60초 | ✅ 유지 | export const revalidate = 60 그대로 |
| 비로그인 접근 | ✅ 유지 | 로그인 무관 공개 / session optional 유지 |

**회귀 검증 항목** (구현 후 tester 단계):
- [ ] 비로그인 진입 → 정상 노출
- [ ] 본인 진입 → /profile redirect (isOwner 가드)
- [ ] 본인 진입 + ?preview=1 → 공개 프로필 미리보기
- [ ] 매치 카드 클릭 → /live/[id] 정상 이동
- [ ] match_code NULL 매치 → #매치번호 fallback 표시
- [ ] homeTeam 또는 awayTeam NULL 매치 → "미정" fallback
- [ ] 모바일 720px 분기 → 카드 1열 + 본인 기록 줄 줄바꿈 정상
- [ ] tsc --noEmit 0 / lint 0
- [ ] Flutter `/api/v1/*` 응답 키 변경 0

---

## 8. 구현 단계 (5 step)

| 순서 | 작업 | 담당 | 선행 조건 | 산출 |
|------|------|------|----------|------|
| 1 | **데이터 쿼리 확장** — `page.tsx` 쿼리 #3 select 확장 + 변환 로직 작성 + 통산 _avg 키 추가 | developer | Q1~Q4 결재 | page.tsx 변경 |
| 2 | **`PlayerMatchCard` 컴포넌트 신규** — `src/components/match/PlayerMatchCard.tsx` (대회상세 카드 카피 + 본인 기록 줄 추가) | developer | 1단계 | 신규 1 파일 |
| 3 | **`RecentGamesTab` 카드형 교체** — board__row → PlayerMatchCard 매핑. 빈 상태/포맷 헬퍼 유지 | developer | 2단계 | recent-games-tab.tsx 변경 |
| 4 | **(옵션) OverviewTab 통산 12열 확장** — Q4 결재 시 | developer | 1단계 | overview-tab.tsx 변경 |
| 5 | **시안 갱신 + tester** — PlayerProfile.jsx games 블록 카드형 + 운영 검증 + tsc | developer + tester (병렬) | 1~4단계 | 시안 + 검증 |

**병렬 가능**: 4단계 (overview 12열) ↔ 2~3단계 (카드) 독립. 5단계 시안 갱신 ↔ tester 병렬.

**예상 시간**: 단계 1 (15분) / 2 (20분) / 3 (15분) / 4 (10분 — 옵션) / 5 (20분) = **80분 내외** (Q4 미채택 시 60분).

---

## 9. ⚠️ developer 주의사항

1. **`tournamentTeamPlayer.tournamentTeamId` 필수 select** — playerSide 판별 (홈/원정 + 승/패) 의 유일한 기준. 누락 시 W/L 표시 안 됨.
2. **승/패 표시 로직**:
   ```ts
   const playerWon = isCompleted &&
     ((playerSide === "home" && (homeScore ?? 0) > (awayScore ?? 0)) ||
      (playerSide === "away" && (awayScore ?? 0) > (homeScore ?? 0)));
   const wlBadge = playerSide === null ? null : playerWon ? "W" : "L";
   ```
3. **모바일 카드 본인 기록 줄** — 4 stat (PTS/REB/AST/STL) 만 노출. 5+ stat 은 줄바꿈 위험. 데스크톱 분기에서 +블락/+분 노출 검토.
4. **빈 데이터 fallback**:
   - `match_code` NULL → `#${match_number}` (대회상세 패턴 카피)
   - `homeTeam.name` NULL → "미정" + italic + opacity 0.7 (대회상세 패턴 카피)
   - `homeTeam.team?.logoUrl` NULL → 첫 글자 (TeamLogo 컴포넌트 카피)
   - `playerStat.points` 0 / NULL → "-" 또는 0 (Q5 결재)
5. **orderBy** — `tournamentMatch.scheduledAt desc` 으로 변경. 기존 `createdAt desc` 는 stat 입력 순서라 부정확 (백필 시 역전 가능).
6. **`officialMatchNestedFilter()` 추가** — 현재 page.tsx 쿼리 #3 에 누락. 미래/예약 매치가 noise 로 들어올 수 있음 (5/2 회귀와 동일).
7. **신규 컴포넌트 위치** — `src/components/match/PlayerMatchCard.tsx` (글로벌 재사용 의도) vs `src/app/(web)/users/[id]/_v2/player-match-card.tsx` (페이지 한정). Q6 결재.
8. **사용자 결정 §11 카피 룰** — 시안 카피는 시안 우선. 운영 페이지 카피 신규 생성 시 시안에 반영 (역방향 박제).

---

## 10. 사용자 결재 필요 항목 (Q1~Q6)

### Q1. 탭 구성 — 옵션 A vs 옵션 B

| 옵션 | 탭 구성 | 추천 사유 |
|------|---------|----------|
| **A** ⭐ | overview / games (현재 유지) — games 만 카드형 | 단순. D-P5 결정 보존. 80% 사용자 핵심 요구 충족 |
| B | overview / stats / games / awards (4개 — NBA 충실) | NBA 완전 모델. UserSeasonStat cron 미동작 → stats 탭 "준비 중" 위험 |

→ **추천: A**. B 는 데이터 cron 가동 후 Phase 2.

### Q2. 시즌별 통계 (Stats 탭) — 옵션 B 채택 시

| 옵션 | 방식 | 비용 |
|------|------|------|
| B-1 | UserSeasonStat 직접 read (cron 미동작 → 빈 행) | "준비 중" UX |
| B-2 | 온디맨드 GROUP BY season_year + matchPlayerStat aggregate | 쿼리 1건 추가 / 유연 |
| B-3 | 보류 | 후속 Phase |

→ Q1 = A 시 자동 보류.

### Q3. Hero — `jerseyNumber` 노출

시안: 아바타 우하단 jersey badge (#4) 표시. 운영: 미반영.
- **추천: 노출** — TournamentTeamPlayer (대표팀 1건) 의 jerseyNumber. 데이터 fetch 1건 추가 (기존 #1 쿼리에 포함 가능).
- 보류 시 시안과 갭 유지.

### Q4. 통산 스탯 12열 확장 — 6 → 12

| 옵션 | 열 구성 | 추천 |
|------|---------|------|
| C-1 ⭐ | 6열 유지 (경기/승률/PPG/APG/RPG/BPG) | 모바일 친화 / D-P6 단순화 보존 |
| C-2 | 12열 (+ MIN, FG%, 3P%, FT%, eFG%, +/-) | NBA 충실 — 모바일 분기 복잡 |
| C-3 | 8열 (+ MIN, FG%, 3P%, FT%) | 중간 절충 |

→ **추천: C-3** (FG%/3P%/FT% = NBA 핵심, MIN = 출전 시간). 모바일 4×2 grid 안전.

### Q5. 카드 본인 기록 줄 형식

| 옵션 | 표시 |
|------|------|
| **D-1** ⭐ | `22 PTS · 14 REB · 3 AST · 2 STL  [W]` (4 stat + W/L 배지) |
| D-2 | `22-14-3-2 (FG 8/15)  [W]` (압축형 + 슈팅) |
| D-3 | `MIN 24 / 22-14-3-2  [W]` (출전시간 + 4 stat) |

→ **추천: D-1**. 모바일 친화 + 핵심 4 stat 만.

### Q6. PlayerMatchCard 위치

| 옵션 | 경로 | 추천 사유 |
|------|------|----------|
| E-1 ⭐ | `src/components/match/PlayerMatchCard.tsx` | 향후 `/teams/[id]` "최근 경기" 도 사용 가능 |
| E-2 | `src/app/(web)/users/[id]/_v2/player-match-card.tsx` | 페이지 한정 — 결합도 낮음 |

→ **추천: E-1**. 매치 카드 = 글로벌 패턴.

---

## 11. 결재 후 진행 흐름 (제안)

```
[사용자 결재 Q1~Q6]
    ↓
[Step 1] page.tsx 쿼리 #3 select 확장 + officialMatchNestedFilter 가드 추가
    ↓
[Step 2] PlayerMatchCard 신규 (대회상세 패턴 카피 + 본인 기록 줄)
    ↓
[Step 3] RecentGamesTab 카드형 교체
    ↓ (병렬)
[Step 4] (옵션) OverviewTab 통산 8/12열 확장
    ↓
[Step 5] PlayerProfile.jsx 시안 박제 (역방향 sync 룰 준수)
    ↓
[tester + reviewer 병렬]
    ↓
[PM 커밋] feat(profile): /users/[id] NBA 스타일 매치 카드형 + 통산 강화
```

---

## 12. 후속 (Phase 2 — 본 작업 후)

- UserSeasonStat 집계 cron 활성 → Stats 탭 활성 (Q1=B 채택 시)
- ShotZoneStat 집계 cron 활성 → Hot Zones 차트 (NBA shot chart)
- Awards 탭 (MVP/우승) — 별도 대규모 검토
- Splits (홈/원정/월별) — 데이터 가공 cron 설계
- 팀 페이지 `/teams/[id]` 의 "최근 경기" 도 PlayerMatchCard 재사용 (E-1 채택 시)
