# 공개 프로필 — 활동 로그 + 통산 스탯 더보기 설계 보고서

작성일: 2026-05-09
담당: planner-architect
상태: 설계 (코드 변경 0 / DB 변경 0 / API 변경 0)
선행: `Dev/public-profile-nba-style-2026-05-09.md` (Phase 1 완료 — Q1=A 2탭 / Q3=jersey / Q4=C-3 8열 / Q5=D-1 / Q6=E-1)

---

## 0. 목표 한 문장

타인 공개 프로필 (`/users/[id]`) 의 **활동 카드** 를 단순 텍스트 (가입일·경기수) 에서 **시간순 활동 로그 5건** 으로 강화하고, **통산 스탯 카드 우측 상단 "더보기"** 버튼을 통해 **연도별·대회별 상세 스탯** 을 모달 또는 별도 영역으로 노출한다. 더불어 현재 "경기 참가 0" 과 통산 스탯 "경기 2건" 데이터 소스 불일치 버그를 통합한다.

---

## 1. 현황 분석

### 1.1 활동 카드 현재 코드 (`overview-tab.tsx` L286~328)

```tsx
<div className="card">
  <div>활동</div>
  <div>
    {activity.joinedAt && <>가입일 · {fmtYearMonthDay(joinedAt)}</>}
    경기 참가 · <b>{activity.gamesPlayed.toLocaleString()}</b>
    {activity.gamesHosted > 0 && <>주최 · {activity.gamesHosted}</>}
    {activity.lastSeen && <>최근 접속 · {activity.lastSeen}</>}
  </div>
</div>
```

→ **단순 4줄 메타** (가입일 / 경기수 / 주최수 / 최근접속). 활동 흐름 0.

### 1.2 ⚠️ 데이터 소스 불일치 버그 ("경기 참가 0" vs 통산 2경기)

**위치**: `page.tsx` L378~384
```tsx
const activity = {
  joinedAt: user.createdAt?.toISOString() ?? null,
  gamesPlayed: user.total_games_participated ?? 0,  // ⚠️ User 카운터 컬럼
  gamesHosted: user.total_games_hosted ?? 0,
  lastSeen: null,
};
```

**대비** — 통산 스탯 카드 데이터 소스 (`page.tsx` L309):
```tsx
const gamesPlayed = statAgg?._count?.id ?? 0;  // matchPlayerStat aggregate 실측
```

→ **두 카운터 소스 다름**:
| 항목 | 활동 카드 | 통산 스탯 카드 |
|------|----------|--------------|
| 데이터 | `user.total_games_participated` | `matchPlayerStat._count.id` |
| 갱신 | 미상 (트리거 / 수동 / cron 모두 가능) — 실측 0 | matchPlayerStat 실측 (DB INSERT 시점) |
| 사용자 결과 | 0 | 2 |

**원인 추정**: `total_games_participated` 카운터가 어딘가에서 increment 되지 않거나, 백필 시 누락. 본 작업과 별개로 데이터 일관성 문제. → **§3 통합 결정 필요**.

### 1.3 통산 스탯 카드 현재 (8열 평균만)

**위치**: `overview-tab.tsx` L122~196
- 8열: 경기 / 승률 / PPG / RPG / APG / MIN / FG% / 3P%
- 평균만 표시 — **시즌별 / 대회별 분해 0**
- "더보기" 버튼 0

### 1.4 운영 데이터 모델 — 활동 로그 후보 6종

| 후보 | 모델 | 가용성 | 표시 예 |
|------|------|--------|--------|
| **A. 경기 참가** | `matchPlayerStat` + `tournamentMatch` | ✅ 즉시 (Phase 1 쿼리 #3 재활용) | "5/2 RDM vs MK 52:47 W" |
| **B. MVP 수상** | `tournamentMatch.mvp_player_id` | ✅ COUNT/findMany 1쿼리 | "5/1 [경기명] MVP" |
| **C. 등번호 변경** | `team_member_history` (eventType=`jersey_changed`) | ✅ 5/5 PR2~3 박제 완료 | "4/28 #7 → #8 [팀명]" |
| **D. 팀 가입/탈퇴/이적** | `team_member_history` (`joined`/`left`/`withdrawn`/`transferred_in`/`transferred_out`) | ✅ | "4/15 [팀명] 가입" |
| **E. 가입일** | `user.createdAt` | ✅ 1건 한정 | "5/1 mybdr 가입" |
| **F. 시즌 종료/뱃지** | `user_badges` (이미 우측 aside 카드) | ⚠️ 중복 가능 | "5/8 'MVP' 뱃지 획득" |

→ **활동 로그 통합 = A+B+C+D+E** (F는 별도 카드와 중복 회피). UNION 쿼리 또는 N개 fetch + 클라이언트 병합.

### 1.5 통산 스탯 분해 — 데이터 가용성

**연도별** (시즌):
- `tournamentMatch.scheduledAt` 의 연도 (예: 2026)
- 또는 `tournament` join → series 분류 (예: "2026 Spring" / "2025 Winter")
- → **scheduledAt 연도 기준 단순 분해 추천** (series_id 매핑은 일부만 채워져 있음 — 검증 후 결정)

**대회별**:
- `tournamentMatch.tournamentId` 기준 그룹
- `tournament.name` (예: "몰텐배 21회") + `short_code` (`MD21`) + `start_date` 표시 가능

**UserSeasonStat cron 재검토**:
- schema 존재 (line 2938~2960) — `user_id + season_year` UNIQUE / wins / losses / avg_rating / mvp_count / total_minutes
- **cron 코드 검색 결과 — 미발견** (Phase 13+ 예정 — 디자인 보고서 §1.3 명시)
- 빈 테이블 가능성 큼 → **온디맨드 matchPlayerStat aggregate** 로 직접 집계 추천

---

## 2. NBA.com 패턴 매핑 (확장)

| NBA 섹션 | mybdr Phase 2 적용 | 결정 |
|----------|-------------------|------|
| **Player News / Activity Feed** | 활동 로그 (좌 column 또는 aside 카드) | **신규 ActivityLog 컴포넌트** |
| **Season Stats — Per Game** (시즌별) | "더보기" → 시즌 (연도) 분해 | **모달 또는 탭** |
| **Career Stats — All-Time** (전체 평균) | 현재 8열 카드 유지 | 변경 0 |
| **Career Highs** (시즌하이) | Phase 3 후보 | 본 작업 외 |
| **Splits** (홈/원정/월별) | Phase 3 후보 | 본 작업 외 |

---

## 3. ⚠️ "경기 참가 0" 버그 — 통합 결정 (Q2)

| 옵션 | 방식 | 장점 | 단점 |
|------|------|------|------|
| **A** ⭐ | 활동 카드의 `gamesPlayed` 를 `statAgg._count.id` 로 통일 (이미 fetch 중) | 즉시 fix / 신규 쿼리 0 / 통산 카드와 일관 | `total_games_participated` 컬럼 unused 화 (소거는 별개) |
| B | `total_games_participated` 카운터를 cron 으로 backfill | 컬럼 의미 보존 | 작업량 ↑ / 본 작업 범위 초과 |
| C | "활동 로그 길이" 로 카운트 (5건 한정) | 활동 로그 강조 | 의미 없음 (5+ 무한 표시 X) |

→ **추천: A**. 사유: 통산 카드 = matchPlayerStat 실측이 정답. 활동 카드도 동일 source 로 통일. `total_games_participated` 는 admin/leaderboard 용 카운터로 별도 backfill cron 검토 (본 작업 외).

---

## 4. 활동 로그 설계 (Q1, Q4)

### 4.1 데이터 소스 결정 — Q1

| 옵션 | 포함 | 쿼리 비용 |
|------|------|----------|
| **A** ⭐ | A(경기) + B(MVP) + C(등번호) + D(팀이력) + E(가입) — 5종 | findMany 4건 (E=user.createdAt 재활용) |
| B | A(경기) + D(팀이력) + E(가입) — 핵심 3종 | findMany 2건 |
| C | A 만 (경기 5건) | 기존 쿼리 #3 재활용 |

→ **추천: A** (5종 통합). 사유: 활동 흐름이 풍부 + N+1 위험 0 (모두 단순 findMany).

### 4.2 통합 쿼리 설계 — Promise.all 4건 추가

```ts
const [
  ...기존 9 쿼리,
  // 10) MVP 수상 이력 (최근 5건)
  prisma.tournamentMatch.findMany({
    where: { mvp_player_id: userIdBigInt },
    select: {
      id: true, match_code: true, match_number: true,
      scheduledAt: true, ended_at: true,
      tournament: { select: { name: true, short_code: true } },
    },
    orderBy: [
      { ended_at: { sort: "desc", nulls: "last" } },
      { scheduledAt: "desc" },
    ],
    take: 5,
  }).catch(() => []),

  // 11) 팀 멤버 이력 (joined/left/jersey_changed/transferred_in 등)
  prisma.teamMemberHistory.findMany({
    where: {
      userId: userIdBigInt,
      eventType: { in: [
        "joined", "left", "withdrawn",
        "jersey_changed", "jersey_change_approved",
        "transferred_in", "transferred_out",
      ] },
    },
    select: {
      id: true, eventType: true, payload: true, createdAt: true,
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,  // 후처리 후 5건만 표시 (멀티 이벤트 동일 일시 합산 여유)
  }).catch(() => []),
];
```

→ **신규 쿼리 2건** (10, 11). #1, #3 (recentGames) 는 재활용.

### 4.3 ActivityEvent 통합 타입

```ts
type ActivityEvent =
  | { type: "match"; date: string; matchId: string; matchCode: string | null;
      title: string; subtitle: string; result: "W" | "L" | null }
  | { type: "mvp"; date: string; matchId: string; tournamentName: string }
  | { type: "team_joined"; date: string; teamId: string; teamName: string }
  | { type: "team_left"; date: string; teamId: string; teamName: string }
  | { type: "team_transferred"; date: string; teamId: string; teamName: string;
      direction: "in" | "out" }
  | { type: "jersey_changed"; date: string; teamId: string; teamName: string;
      oldJersey: number | null; newJersey: number | null }
  | { type: "signup"; date: string };
```

### 4.4 클라이언트 병합 + 정렬

```ts
const events: ActivityEvent[] = [
  ...recentGameEvents,    // recentGames → match 타입 매핑
  ...mvpEvents,           // mvpMatches → mvp 타입
  ...teamHistoryEvents,   // teamMemberHistory → team_*/jersey_changed 타입
  { type: "signup", date: user.createdAt.toISOString() },
];

events.sort((a, b) => b.date.localeCompare(a.date));  // ISO 문자열 비교
const top5 = events.slice(0, 5);
```

### 4.5 UI 컴포넌트 — `ActivityLog.tsx`

**위치**: `src/app/(web)/users/[id]/_v2/activity-log.tsx` (페이지 한정 — Q4 결재)

```tsx
function ActivityLog({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <div>활동 기록이 없습니다.</div>;
  }

  return (
    <ul className="activity-log">
      {events.map((e, i) => (
        <li key={i} className="activity-log__item">
          <span className="activity-log__icon">{getIcon(e)}</span>
          <div className="activity-log__body">
            <div className="activity-log__title">{getTitle(e)}</div>
            <div className="activity-log__date">{fmtRelativeOrDate(e.date)}</div>
          </div>
          {/* match / mvp 는 클릭 → /live/[id] */}
          {(e.type === "match" || e.type === "mvp") && (
            <Link href={`/live/${e.matchId}`} className="activity-log__link" />
          )}
        </li>
      ))}
    </ul>
  );
}
```

### 4.6 아이콘 매핑 (Material Symbols Outlined — lucide-react 금지 / CLAUDE.md §디자인 핵심)

| type | Material Symbol | 의미 |
|------|----------------|------|
| match | `sports_basketball` | 경기 참가 |
| mvp | `emoji_events` | MVP 수상 |
| team_joined | `group_add` | 팀 가입 |
| team_left | `logout` | 팀 탈퇴 |
| team_transferred | `swap_horiz` | 이적 |
| jersey_changed | `numbers` | 등번호 변경 |
| signup | `person_add` | mybdr 가입 |

### 4.7 표시 카피 예 (Q5)

| type | 카피 |
|------|------|
| match | `경기 참가 · 우리팀 52:47 상대팀  W` |
| mvp | `MVP 수상 · [대회명]` |
| team_joined | `[팀명] 가입` |
| team_left | `[팀명] 탈퇴` |
| team_transferred (in) | `[팀명] 이적 (가입)` |
| team_transferred (out) | `[팀명] 이적 (탈퇴)` |
| jersey_changed | `[팀명] 등번호 #7 → #8` |
| signup | `mybdr 가입` |

날짜 포맷: 7일 이내 = "3일 전" / 그 외 = "5/2 (토)"

---

## 5. 통산 스탯 더보기 설계 (Q3, Q6, Q7)

### 5.1 UX 옵션 결정 — Q3

| 옵션 | 방식 | 장점 | 단점 |
|------|------|------|------|
| **A** ⭐ | 모달 (인라인 펼침) | 페이지 이동 0 / Phase 1 변경 최소 | 모달 안 NBA-like 8열 테이블 / 모바일 좁음 |
| B | 별도 페이지 `/users/[id]/stats` 신규 | 자세한 분석 + 차트 가능 | 페이지 1 신규 / 라우트 추가 |
| C | 탭 추가 (overview / **stats** / games — 3탭) | 이전 시안 (Q1=A 결정 전) 형태 복원 | Q1=A 결정 번복 |

→ **추천: A 모달**. 사유: Phase 1 의 2탭 단순화 결정 (Q1=A) 보존 + 페이지 라우트 0 + 화면 전환 0. 모바일은 모달 풀스크린 (top: 0) 으로 처리.

### 5.2 모달 구조 — `StatsDetailModal.tsx`

```
┌────────────────────────────────────────────────┐
│ 통산 스탯 — 김수빈 · 종합              [×]    │  ← header
├────────────────────────────────────────────────┤
│ [전체] [연도별] [대회별]                       │  ← tab 3개
├────────────────────────────────────────────────┤
│  연도 / 경기 / 승률 / PPG / RPG / APG / MIN /  │  ← table head
│       FG% / 3P%                                │
│  ──────────────────────────────────────────    │
│  2026 │ 28 │ 71% │ 17.1 │ 10.9 │ 2.8 │ 24 │   │
│       │    │     │      │      │     │    │    │
│       │    │     │      │ 54%  │ 32% │    │    │
│  2025 │ 22 │ 64% │ ... (동일 8열)              │
│  ─────────────────────────────────────────     │
│  커리어 │ 50 │ 68% │ 16.4 │ 10.5 │ ...  │     │  ← bold + bg
└────────────────────────────────────────────────┘
```

3 탭:
- **전체** (기본 노출 카드와 동일 — 컨텍스트 강화)
- **연도별** (스크롤 N행)
- **대회별** (스크롤 N행 — 대회명 + short_code)

### 5.3 위치 결정 — Q6

| 옵션 | 위치 | 추천 사유 |
|------|------|----------|
| **F-1** ⭐ | `src/app/(web)/users/[id]/_v2/stats-detail-modal.tsx` | 페이지 한정 (재사용 가능성 낮음 — career table 은 본인 /profile 도 별도) |
| F-2 | `src/components/stats/StatsDetailModal.tsx` | 글로벌 — 향후 /profile, /teams/[id] 재사용 |

→ **추천: F-1**. 사유: 모달 안 데이터 형식이 공개프로필 한정 (private 데이터 0). 재사용 시점에 글로벌화.

### 5.4 데이터 fetch — Q7 (집계 방식)

| 옵션 | 방식 | 장점 | 단점 |
|------|------|------|------|
| **G-1** ⭐ | findMany 1건 + 클라 가공 (groupBy) | DB 쿼리 1건 / 단순 | 사용자 100경기+ 시 데이터 ↑ (~5KB) |
| G-2 | Prisma `groupBy` 2건 (year + tournament) | 가공 0 / 쿼리 N건 | groupBy 한계 (sum + avg 동시 불가 / @@map 컬럼 주의) |
| G-3 | raw SQL `$queryRaw` | 자유로운 GROUP BY | snake_case 처리 / 타입 보장 ↓ |
| G-4 | UserSeasonStat cron 활성 후 직접 read | 완전 캐시 | cron 미동작 — Phase 13+ |

→ **추천: G-1** (단일 findMany + 클라 가공). 사유: 평균 사용자 경기 수 ≪ 100. JS map+reduce 1ms 비용 무시 가능. cron 활성화 후 G-4 로 마이그.

### 5.5 통산 fetch 쿼리 (모달 열기 시 또는 prefetch)

```ts
// 옵션 5.5.a — page.tsx 에서 prefetch (10번째 쿼리 추가, 모달 열 때 즉시 노출)
prisma.matchPlayerStat.findMany({
  where: {
    tournamentTeamPlayer: { userId: userIdBigInt },
    tournamentMatch: officialMatchNestedFilter(),
  },
  select: {
    points: true, total_rebounds: true, assists: true,
    steals: true, blocks: true, minutesPlayed: true,
    field_goal_percentage: true, three_point_percentage: true,
    tournamentMatch: {
      select: {
        scheduledAt: true,
        homeScore: true, awayScore: true,
        homeTeamId: true, awayTeamId: true,
        tournament: {
          select: {
            id: true, name: true, short_code: true,
          },
        },
      },
    },
    tournamentTeamPlayer: { select: { tournamentTeamId: true } },
  },
  orderBy: { tournamentMatch: { scheduledAt: "desc" } },
  // take: 0 → 전부 fetch (사용자 100건 미만 가정)
});
```

### 5.6 클라이언트 가공 (groupBy + avg)

```ts
type SeasonRow = {
  key: string;          // "2026" 또는 "MD21"
  label: string;        // "2026 시즌" 또는 "몰텐배 21회"
  games: number;
  wins: number;
  ppg: number; rpg: number; apg: number;
  mpg: number; fgPct: number; threePct: number;
};

function groupByYear(rows: ...): SeasonRow[] {
  const map = new Map<number, SeasonRow>();
  for (const r of rows) {
    const yr = new Date(r.tournamentMatch.scheduledAt).getFullYear();
    const cur = map.get(yr) ?? { key: String(yr), label: `${yr} 시즌`, games: 0, wins: 0, ... };
    cur.games += 1;
    if (won(r)) cur.wins += 1;
    cur.ppg = (cur.ppg * (cur.games - 1) + r.points) / cur.games;  // 누적 평균
    // ... 동일 패턴
    map.set(yr, cur);
  }
  return Array.from(map.values()).sort((a, b) => Number(b.key) - Number(a.key));  // 최신 우선
}

function groupByTournament(rows: ...): SeasonRow[] { /* tournamentId 기준 동일 */ }
```

### 5.7 정렬 — Q8

| 옵션 | 방식 |
|------|------|
| **H-1** ⭐ | 최신 우선 (연도 desc / 대회 startDate desc) |
| H-2 | 오름차순 (연도 asc) |

→ **추천: H-1**. 사유: 사용자가 가장 최근 활동 먼저 보는 패턴 자연스러움. 커리어 통산 = 마지막 행.

---

## 6. 시안 박제 (`Dev/design/BDR-current/screens/PlayerProfile.jsx`)

### 6.1 현재 시안 vs 설계 갭

| 항목 | 현재 시안 | 설계 |
|------|----------|------|
| 활동 카드 | 단순 3줄 (커뮤글·가입일·최근접속) + 최근작성글 보기 링크 | 5건 활동 로그 (icon + title + date) |
| 통산 더보기 | stats 탭 (현재 운영 X) 에 시즌별 8열 board | overview 탭 통산 카드 우상단 [더보기] → 모달 |
| 모달 | 0 | StatsDetailModal (전체/연도/대회 3탭) |

### 6.2 시안 갱신 항목

1. **활동 카드 재작성** (PlayerProfile.jsx L225~233):
   - mock activity events 5건 (match / mvp / team_joined / jersey_changed / signup)
   - icon (Material Symbol) + title + date 3열 배치
   - 최근작성글 보기 링크 = 제거 (커뮤니티 페이지로 이동)

2. **통산 카드 우상단 [더보기] 버튼 추가** (overview 의 통산 8열 grid):
   ```jsx
   <h2>통산 스탯 <button onClick={openModal}>더보기 →</button></h2>
   ```

3. **StatsDetailModal mock** 추가:
   - 3 탭 (전체 / 연도별 / 대회별)
   - 연도별 mock 4행 (2026 Spring, 2025 Winter, ...) + 커리어 평균 1행
   - 대회별 mock 3행 (몰텐배 21회 / 열혈SEASON2 / ...)
   - 8열 (현재 stats 탭 mock 패턴 재사용)
   - 모바일 풀스크린 (top: 0 / overflow-y: auto)

4. **stats 탭 제거** (Q1=A 채택 = 2탭 유지 → stats 탭 mock = 모달 안으로 이동)

### 6.3 박제 룰 준수

- [x] AppNav 7 룰 무관 (페이지 본문)
- [x] 디자인 토큰 — `var(--*)` / 핑크·살몬·코랄 ❌ / lucide-react ❌
- [x] 카피 5단어 이내 / "예: " ❌
- [x] 720px 분기 / 모달 모바일 풀스크린

---

## 7. 신규 컴포넌트 + 수정 파일 정리

### 7.1 신규 (2 파일)

| 경로 | 역할 | 라인 수 예상 |
|------|------|----------|
| `src/app/(web)/users/[id]/_v2/activity-log.tsx` | 활동 로그 5건 표시 + 아이콘 + 날짜 + 클릭 링크 | ~120L |
| `src/app/(web)/users/[id]/_v2/stats-detail-modal.tsx` | 모달 + 3 탭 + 테이블 + 모바일 풀스크린 | ~250L |

### 7.2 수정 (5 파일)

| 경로 | 변경 |
|------|------|
| `src/app/(web)/users/[id]/page.tsx` | 쿼리 추가 #10 (MVP) #11 (teamHistory) #12 (전체 matchPlayerStat — 모달 prefetch) + ActivityEvent 변환 + activity prop 변경 |
| `src/app/(web)/users/[id]/_v2/overview-tab.tsx` | activity prop 시그니처 변경 (`gamesPlayed:number` → `events:ActivityEvent[]`) + 통산 카드에 [더보기] 버튼 추가 + 모달 state |
| `src/app/(web)/users/[id]/_v2/overview-tab.css` | 활동 로그 li 스타일 + 모달 .open 스타일 |
| `Dev/design/BDR-current/screens/PlayerProfile.jsx` | 활동 카드 재작성 + 통산 [더보기] + 모달 mock |
| `.claude/knowledge/decisions.md` | Q1~Q8 결정 박제 |

---

## 8. 구현 단계 (5 step / ~75분)

| 순서 | 작업 | 담당 | 선행 | 시간 |
|------|------|------|------|------|
| 1 | **데이터 쿼리 #10~#12 추가 + ActivityEvent 변환 + statsDetail 행 변환** | developer | Q1, Q2 결재 | ~20분 |
| 2 | **`ActivityLog.tsx` 신규** + activity prop 변경 + overview-tab 적용 | developer | 1 | ~15분 |
| 3 | **`StatsDetailModal.tsx` 신규** + 3 탭 + groupBy 함수 + open/close state | developer | 1 | ~25분 |
| 4 | **overview-tab.tsx 통산 카드 [더보기] 버튼 + 모달 wire-up** | developer | 3 | ~10분 |
| 5 | **시안 박제** (PlayerProfile.jsx 활동 카드 + 통산 더보기 + 모달 mock) + tester + reviewer 병렬 | developer + tester + reviewer | 1~4 | ~15분 |

**병렬 가능**: 2 ↔ 3 (둘 다 1 의존, 서로 무관) — 동시 작업 가능. 5 의 시안 + tester 병렬.

---

## 9. ⚠️ developer 주의사항

1. **데이터 소스 통일** (Q2=A 결정 시) — `activity.gamesPlayed` 제거. Phase 1 의 `statAgg._count.id` 를 활동 카드도 사용 (이미 fetch 중). `total_games_participated` 컬럼은 컴포넌트에서 미사용 → page.tsx 변환 단계 삭제.

2. **scheduledAt NULL 안전** — TournamentMatch.scheduledAt = `DateTime?` (line 641). NULL 매치는 활동 로그에서 제외 또는 fallback "미정". 통산 더보기 연도별 그룹에서는 NULL 행 제외 (year 알 수 없음).

3. **payload Json 파싱** (TeamMemberHistory) — `eventType=jersey_changed` 시 payload 형식이 `{ old:{jersey:7}, new:{jersey:8} }` 가정. 타입 파싱 시 `as { old?: { jersey?: number }, new?: { jersey?: number } }` 안전 가드 필수. 형식 알 수 없을 시 "등번호 변경" 으로만 표시.

4. **이벤트 중복 제거** — `joined` + `transferred_in` 이 같은 일시에 발생 가능 (이적 자동 처리). 중복 시 `transferred_in` 우선 (의미 더 명확).

5. **모달 접근성** — `aria-modal="true"` / Escape 키 닫기 / 외부 클릭 닫기 / focus trap. 모바일 풀스크린은 body scroll lock.

6. **모바일 반응형** — 모달 풀스크린 (≤720px) / 테이블 8열 = `overflow-x: auto` (가로 스크롤). 활동 로그는 1열 + 아이콘+title+date 인라인.

7. **payload 타입 가드** — `team_member_history.payload` 가 NULL 인 경우 (백필 시 가능) `payload as Record<string, unknown> | null` 후 옵셔널 체이닝.

8. **Q3=A 모달 채택 시** — open state 는 client component 필요. overview-tab.tsx 가 server 였으면 `"use client"` 추가, 또는 [더보기]+모달 만 분리한 client wrapper 사용. **현재 overview-tab.tsx 는 server (default)** → client wrapper 분리 추천 (`<StatsCardWithModal stats={...} careerRows={...} />`).

9. **`window` 가드** — body scroll lock 코드는 `useEffect` 안에서만 (SSR safety).

10. **사용자 결정 §6-1 카피 룰** — 시안 카피 우선. 운영 신규 카피는 시안에도 같이 박제 (역방향 동기 — CLAUDE.md §🔄).

---

## 10. 회귀 위험 + 0 보장

| 영역 | 위험 | 대응 |
|------|------|------|
| Flutter `/api/v1/*` | ❌ 0 | 본 작업 = `(web)/users/[id]` 한정 |
| `/api/web/*` | ❌ 0 | 신규 endpoint 0 / 기존 호출 0 |
| Prisma schema | ❌ 0 | 컬럼 추가 0 / select 키 추가만 |
| 본인 `/profile` | ❌ 0 | redirect 유지 (D-P7) |
| Phase 1 (NBA 카드 + 8열) | ❌ 0 | 카드는 변경 0 / overview-tab.tsx 만 prop 시그니처 변경 |
| ISR 60초 | ✅ 유지 | revalidate=60 그대로 |
| 비로그인 접근 | ✅ 유지 | session optional |
| `total_games_participated` 카운터 | ⚠️ orphaned | 컴포넌트 미사용. admin/leaderboard 가 사용 중인지 별도 검증 (본 작업 외) |

**검증 항목** (구현 후 tester):
- [ ] 활동 로그 5건 정렬 (최신 우선) 정확
- [ ] 활동 0건 사용자 → "활동 기록이 없습니다" fallback
- [ ] 활동 1~4건 사용자 → 가용한 만큼만 표시 (5건 강제 X)
- [ ] match / mvp 클릭 → /live/[id] 이동
- [ ] team_* / jersey_changed → 클릭 영역 0 (또는 /teams/[id] — Q5)
- [ ] [더보기] 클릭 → 모달 open / Escape 닫기 / 외부 클릭 닫기 / body scroll lock
- [ ] 모달 3 탭 (전체/연도/대회) 전환 정상
- [ ] 연도별 / 대회별 행 정렬 (최신 우선)
- [ ] 커리어 평균 행 (마지막) 강조 표시
- [ ] 모바일 모달 풀스크린 + 8열 가로 스크롤
- [ ] tsc --noEmit 0 / build 통과 / truncated 7파일 마지막 줄 정상

---

## 11. 사용자 결재 항목 (Q1~Q8)

### Q1. 활동 로그 데이터 소스
| 옵션 | 포함 | 추천 |
|------|------|------|
| **A** ⭐ | match + mvp + team_joined/left/transferred + jersey_changed + signup (5종 통합) | NBA-like 풍부 |
| B | match + team(joined/left) + signup (핵심 3종) | 단순 |
| C | match 만 (5건) | 미니멀 |

→ **추천: A**.

### Q2. "경기 참가 0" 버그 처리
| 옵션 | 방식 | 추천 |
|------|------|------|
| **A** ⭐ | activity.gamesPlayed = statAgg._count.id (matchPlayerStat 통일) | 즉시 fix |
| B | total_games_participated cron 백필 | 본 작업 외 |
| C | 활동 로그 길이로 카운트 | 의미 약함 |

→ **추천: A**.

### Q3. 통산 스탯 더보기 UX
| 옵션 | 방식 | 추천 |
|------|------|------|
| **A** ⭐ | 모달 (인라인 펼침) | 페이지 이동 0 |
| B | 별도 페이지 `/users/[id]/stats` | 라우트 추가 |
| C | 탭 추가 (3탭 — Q1=A 번복) | Phase 1 결정 번복 |

→ **추천: A**.

### Q4. 활동 로그 컴포넌트 위치
| 옵션 | 경로 | 추천 |
|------|------|------|
| **A** ⭐ | `src/app/(web)/users/[id]/_v2/activity-log.tsx` (페이지 한정) | 결합 적정 |
| B | `src/components/profile/ActivityLog.tsx` (글로벌) | 향후 /profile 재사용 가능 |

→ **추천: A**. /profile 은 다른 활동 셋 (사적 알림 등) 일 수 있어 재사용 시점 별도 결정.

### Q5. 활동 로그 클릭 동작
| 옵션 | 동작 | 추천 |
|------|------|------|
| **A** ⭐ | match/mvp = /live/[id] / 그 외 = /teams/[id] | 자연스러운 흐름 |
| B | match/mvp 만 클릭 / 그 외 클릭 0 | 단순 |
| C | 모두 클릭 0 (정보 표시만) | 미니멀 |

→ **추천: A**.

### Q6. StatsDetailModal 위치
| 옵션 | 경로 | 추천 |
|------|------|------|
| **A** ⭐ | `src/app/(web)/users/[id]/_v2/stats-detail-modal.tsx` (페이지 한정) | 데이터 형식이 공개프로필 한정 |
| B | `src/components/stats/StatsDetailModal.tsx` (글로벌) | 향후 /profile, /teams 재사용 |

→ **추천: A**.

### Q7. 통산 분해 집계 방식
| 옵션 | 방식 | 추천 |
|------|------|------|
| **A** ⭐ | findMany 1건 + 클라 groupBy (JS) | 단순 / 평균 사용자 100경기 미만 |
| B | Prisma groupBy 2건 (year + tournament) | groupBy 한계 |
| C | raw SQL | 타입 보장 ↓ |
| D | UserSeasonStat read | cron 미동작 |

→ **추천: A**.

### Q8. 정렬 순서
| 옵션 | 방식 | 추천 |
|------|------|------|
| **A** ⭐ | 최신 우선 (연도 desc / 대회 startDate desc) + 커리어 평균 마지막 | 자연스러운 흐름 |
| B | 오름차순 (옛날부터) | 시간순 흐름 강조 |

→ **추천: A**.

---

## 12. 결재 후 진행 흐름

```
[사용자 결재 Q1~Q8]
    ↓
[Step 1] page.tsx 쿼리 #10~#12 추가 + ActivityEvent / SeasonRow 변환
    ↓ (병렬)
[Step 2] ActivityLog.tsx 신규  ↔  [Step 3] StatsDetailModal.tsx 신규
    ↓
[Step 4] overview-tab.tsx 통산 [더보기] + 모달 wire-up + activity prop 시그니처 변경
    ↓
[Step 5] 시안 박제 (PlayerProfile.jsx) + tester + reviewer 병렬
    ↓
[PM 커밋] feat(profile): /users/[id] 활동 로그 + 통산 더보기 모달
```

---

## 13. 후속 (Phase 3 — 본 작업 후)

- **UserSeasonStat 집계 cron 활성** → G-4 마이그 (모달 prefetch 비용 ↓)
- **`total_games_participated` 카운터 backfill** → admin/leaderboard 일관성
- **활동 로그 더보기** (`/users/[id]/activity` 별도 페이지 — 무한 스크롤)
- **시즌하이 (Career Highs)** — Phase 1 통산 평균 + 단일 경기 max 합쳐서 새 카드
- **Splits** (홈/원정/월별) — 모달에 4 탭 추가

---

## 14. 분량 + 결재 추천 일괄

- **0.5d (~75분)** 예상
- 결재 8건 일괄 추천: **Q1=A / Q2=A / Q3=A / Q4=A / Q5=A / Q6=A / Q7=A / Q8=A** (모두 A 추천)
- 산출물: 신규 2 파일 + 수정 5 파일 (시안 + decisions.md 포함)
- DB 변경 0 / API 변경 0 / Flutter 영향 0
