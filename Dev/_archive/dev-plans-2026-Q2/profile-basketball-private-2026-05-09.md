# 마이페이지 "내 농구" (`/profile/basketball`) 설계 보고서 — 본인 전용 강화

작성일: 2026-05-09
담당: planner-architect
상태: 설계 (코드 변경 0 / DB 변경 0 / API 변경 0)
선행:
- Phase 1 — `Dev/public-profile-nba-style-2026-05-09.md` (공개프로필 NBA 카드 + 8열 통산)
- Phase 2 — `Dev/public-profile-activity-stats-2026-05-09.md` (활동 로그 + 통산 더보기 모달)

---

## 0. 목표 한 문장

마이페이지의 "내 농구" 페이지 (`/profile/basketball`) 를 **공개 프로필 (`/users/[id]`) 의 모든 정보 + 본인 전용 추가 가치** 를 한 화면에 모은 **풍부한 본인 농구 페이지** 로 재구성한다. 사용자 의도: *"공개 프로필 페이지를 더 자세하게 확인할 수 있는 페이지"* — 즉 공개 프로필의 강화판 (super-set).

---

## 1. 현황 분석

### 1.1 운영 페이지 현재 코드 (`src/app/(web)/profile/basketball/page.tsx`)

**구조** (239L, client component, SWR 2개):
- 헤더: `← 내 농구` (h1) — `/profile` 으로 돌아가기
- **3열 핵심 통계** (TossCard): 총 경기 / 승률 / PPG
- **커리어 평균 카드** — 3열 (RPG / APG / SPG)
- **소속 팀** 리스트 (TossListItem)
- **최근 경기** 리스트 (TossListItem 5건 — 단순 텍스트 행, NBA 카드 X)
- **참가 대회** 리스트 (TossListItem 5건)
- **주간 운동 리포트** 링크

**데이터 fetch 2건**:
- `/api/web/profile` (SWR) — user / teams / recentGames(`game_applications`) / tournaments
- `/api/web/profile/stats` (SWR) — careerAverages 6필드 + winRate + monthlyGames

**공개 프로필 vs 내 농구 — 갭 매트릭스**:

| 영역 | 공개 프로필 (Phase 1+2 / `/users/[id]`) | 내 농구 (현재) | 갭 |
|------|----------------------------------------|---------------|-----|
| Hero | 그라디언트 + 120px 아바타 + jerseyNumber + 키/몸무게/최근접속 + 팔로우 | h1 텍스트 only | ⚠️ 큼 |
| 통산 8열 | 경기/승률/PPG/RPG/APG/MIN/FG%/3P% | 3열 (PPG·승률·경기) + 보조 3열 | ⚠️ 큼 |
| 통산 더보기 모달 | 전체/연도별/대회별 3탭 8열 board | 없음 | ⚠️ 큼 |
| 활동 로그 5건 | match/mvp/team_joined/team_left/team_transferred/jersey_changed/signup 7종 + Material Symbols + 클릭 라우팅 | 없음 | ⚠️ 큼 |
| 최근 경기 카드 | PlayerMatchCard (대회상세 패턴 + 본인 기록 줄 + W/L 뱃지 + `/live/[id]` 클릭) | TossListItem 단순 텍스트 (game_applications 출처 — 매치 stat 0) | ⚠️ 매우 큼 |
| 소속 팀 | aside 카드 1건 (대표팀 1) | 리스트 N건 | 보완 (현재가 우월) |
| 참가 대회 | 표시 0 | 리스트 5건 | 보완 (현재가 우월) |
| 시즌 평균 | 모달 안 연도별 | 표시 0 | ⚠️ |
| 매치 클릭 | /live/[id] | /games/[id] (game_applications 기반 — 픽업 게임) | 데이터 출처 다름 |

### 1.2 데이터 출처의 핵심 차이 — game_applications vs matchPlayerStat

**현재 `/profile/basketball` recentGames** = `game_applications` (픽업 게임 신청, status=approved). **본인의 매치 출전 기록 (대회) 과 별개**.

**공개 프로필 recentGames** = `matchPlayerStat` (대회 매치 box score) + `tournamentMatch` join.

→ **두 페이지가 다른 의미의 "최근 경기"** 를 보여준다:
- 픽업 게임 (`/games/[id]`) — 본인이 신청해서 출전하는 캐주얼 경기
- 대회 매치 (`/live/[id]`) — 공식 대회 box score 가 있는 매치

**사용자가 기대하는 것** (의뢰): *"공개 프로필을 더 자세히"* → 공개 프로필 패턴 (matchPlayerStat 기반) 채택 + 본인 전용 추가 영역.

**현재 픽업 게임 출처는 별도 영역으로 분리** (예: "픽업 게임 신청 현황") — 정보 손실 0.

### 1.3 시안 (`Dev/design/BDR-current/screens/ProfileBasketball.jsx`)

198줄 단일 페이지. 4 영역:
1. **Hero** — `MY BASKETBALL` eyebrow + h1 + "2026 Spring · 47경기 · 30승 17패 · 승률 63.8%" + 우측 [전체 시즌 →] [정보 편집]
2. **4 핵심 스탯** (PPG / RPG / APG / +/-) — `var(--accent)` 첫 카드 강조 + sub 트렌드 (▲ +1.8 vs 직전)
3. **선수 정보 카드 + 세부 지표 카드** (좌 1.4fr / 우 1fr grid) — 6 필드 (포지션·손·키·경력·레벨·BDR 점수) + 8 필드 (FG%/3P%/FT%/TO/STL/BLK/EFF/MIN)
4. **최근 폼 표** — 5 행 board (날짜/상대/박스스코어/결과/+/-)

**시안 vs 운영 갭** (큼):
- 시안 4 핵심 + 8 세부 지표 vs 운영 3 핵심 + 3 보조
- 시안 선수 정보 6 필드 카드 vs 운영 0 (편집 페이지에서만)
- 시안 최근 폼 표 + +/- 컬럼 vs 운영 단순 TossListItem
- 시안 트렌드 (▲ +1.8 vs 직전) vs 운영 0 (currentVsPrev cron 미동작)

→ **의뢰 의도 = 공개 프로필 완전 흡수 + 시안 4 영역 적용** (시안 + 공개프로필 = super-set 합집합).

---

## 2. 본인 전용 추가 가치 — 9 영역 데이터 가용성 분석

공개 프로필에는 없고 **본인만 의미 있는** 영역 후보. 데이터 가용성 + 우선도 평가:

### A. 본인 진행 중 신청 + 액션 (private)

| 항목 | 데이터 출처 | 가용성 | 우선도 |
|------|------------|--------|--------|
| 가입 신청 pending | `team_join_requests.status='pending'` | ✅ 즉시 (테이블 존재) | ★★★ |
| 등번호 변경 pending | `team_member_requests.requestType='jersey_change'.status='pending'` | ✅ 즉시 | ★★★ |
| 휴면 신청 pending | `team_member_requests.requestType='dormant'.status='pending'` | ✅ 즉시 | ★★ |
| 탈퇴 신청 pending | `team_member_requests.requestType='withdraw'.status='pending'` | ✅ 즉시 | ★★ |
| 이적 신청 pending | `team_transfers` 양쪽 승인 state machine (5/5 PR10) | ✅ 즉시 | ★★ |

**판단**: 신청 진행 흐름 = 사용자가 "내가 어떤 상태인가" 알고 싶은 **최우선 본인 전용 가치**. 5/5 PR2~3 박제 완료된 `MemberPendingBadge` 패턴 재사용 가능 (시안 박제 박스 — `_archive` Phase A.5 reverse-sync). **★★★ 채택 추천**.

### B. 더 상세한 게임 로그 (페이지네이션)

| 항목 | 출처 | 우선도 |
|------|------|--------|
| 전체 매치 box score 페이지네이션 | matchPlayerStat findMany cursor | ★ |
| 매치별 상세 → /live/[id] | 동일 | ★★ |

**판단**: 공개 프로필 5건 → 본인 페이지 N건. 그러나 **공개 프로필 통산 모달이 이미 있음** (Phase 2). 모달의 "전체 탭" 이 같은 역할. 별도 페이지 신설 비용 vs 효용 낮음. **★ 보류 — Phase 후속**.

### C. 개인 목표 / 진척도 (private)

| 항목 | 출처 | 가용성 |
|------|------|--------|
| 시즌 PPG 목표 | ❌ 컬럼 없음 | ❌ 신규 컬럼 필요 |
| 출전 경기수 목표 | ❌ | ❌ |

**판단**: 신규 schema 필요 (user.season_goal_ppg / season_goal_games 등 4~6 컬럼). 본 작업 외 별도 PR 큐. **본 PR 채택 0**.

### D. 트렌드 차트 (시각화 강화)

| 항목 | 출처 | 가용성 |
|------|------|--------|
| 최근 N경기 PPG 꺾은선 | matchPlayerStat findMany take:10 + 클라 chart | ✅ |
| 시즌별 PPG 막대 | 통산 모달 데이터 재활용 | ✅ |
| 12주 활동 막대 | game_applications/matchPlayerStat 주별 그룹 | ⚠️ groupBy 비용 |

**판단**: 공개 프로필 모달 데이터 재활용 가능. 단순 SVG sparkline (마이페이지 hub 의 Spark 컴포넌트 재사용). **★★ 채택 — 통산 모달에 "트렌드" 4번째 탭 추가** 또는 **별도 "최근 폼" 카드 (시안 4 영역 #4 의 진화)**.

### E. Splits / Game Logs by Filter (NBA 모델)

| 항목 | 출처 | 가용성 | 비용 |
|------|------|--------|------|
| 홈/원정 | playerSide (Phase 1 변환 로직) | ✅ | 모달 5번째 탭 |
| 승/패 | winner_team_id == ttp.tournamentTeamId | ✅ | 모달 6번째 탭 |
| 상대팀별 | opponent (홈/원정 상대) | ⚠️ 그룹 비용 ↑ | 동일 |
| 월별 | scheduledAt 월 GROUP BY | ✅ | 동일 |

**판단**: NBA 충실 — 데이터 가공만으로 가능. **단 통산 모달 탭 폭주 (현재 3탭 + 트렌드 + splits 5탭)**. UX 결정 필요. **★ 보류 — 별도 PR 큐 (Splits 전용)**.

### F. 받은 리뷰 / 평가 (Reviews)

| 항목 | 출처 | 가용성 |
|------|------|--------|
| 본인이 받은 평가 | `Review` 모델 (player kind) | ⚠️ 미확인 — Q1 Reviews 박제 시 court 만 도입 (5/1 decision) |
| 매너 점수 / 실력 평가 | review.rating | ⚠️ |

**판단**: ContextReviews kind="player" 도입은 Q1 결정에서 후속 큐. 본 PR 외. **★ 보류**.

### G. 알림 / 메시지 활동 요약 (private)

| 항목 | 출처 | 가용성 |
|------|------|--------|
| 미읽 알림 카운트 | `notifications.read_at IS NULL` count | ✅ — 마이페이지 hub 에 이미 표시 |
| 최근 메시지 | `messages` table | ⚠️ |

**판단**: **마이페이지 hub (`/profile`) 가 이미 알림 카드 노출** (5/8 박제). 내 농구 페이지 = "농구 도메인" 한정 → 알림/메시지는 **범위 외**. **★ 채택 0**.

### H. 출전 예정 / 다음 경기

| 항목 | 출처 | 가용성 |
|------|------|--------|
| 다음 경기 (D-N) | `getProfile().nextGameApp` (game_applications.status=approved + games.scheduled_at 미래) | ✅ — `/api/web/profile.nextGame` 응답 이미 존재 |
| 내가 가입한 대회 매치 예정 | tournamentMatch.status='scheduled' + ttp 매핑 | ✅ |

**판단**: **마이페이지 hub 의 "다음 경기" 카드 이미 존재** (Tier 2). 내 농구 페이지는 "농구 통계 도메인" 강조 → 다음 경기는 hub 유지 + 내 농구 페이지에는 "예정 매치 (대회)" 만 별도 노출 가능. **★★ 채택 — 작은 영역**.

### I. 슛 차트 / Hot Zones

`shot_zone_stat` schema 만 존재, cron 미동작. **★ 보류 — Phase 13+**.

---

## 3. 신규 구조 — 공개 프로필 흡수 + 본인 전용 추가

### 3.1 전체 레이아웃 (제안)

```
┌─────────────────────────────────────────────────────────┐
│  [← 마이페이지]  내 농구                                │  헤더 (변경 0)
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📋 ① 본인 전용 — 진행 중 신청 (있을 때만)              │  ⭐ NEW (Q3 결재)
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⏳ 등번호 변경 신청 #99 — REDEEM 팀  pending     │   │  pending 0건이면 카드 자체 hidden
│  │ ⏳ 가입 신청 — XYZ 팀  3일 전                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🏀 ② Hero — 공개 프로필 PlayerHero 재사용              │  공개프로필 패턴
│  ┌─────────────────────────────────────────────────┐   │
│  │ [그라디언트] [아바타+jersey #N] 김수빈           │   │
│  │ 닉네임 / 지역 / 포지션 / Lv.8 ★평점              │   │
│  │ 키 178 / 체중 72 / 최근접속 -                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📊 ③ 통산 8열 + [더보기 →] (공개프로필 OverviewTab 좌)  │  공개프로필 패턴
│  ┌─────────────────────────────────────────────────┐   │
│  │ 경기 / 승률 / PPG / RPG / APG / MIN / FG% / 3P%  │   │  Phase 1 8열 그대로
│  │  [더보기 →] 클릭 → StatsDetailModal               │   │  Phase 2 모달 그대로
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📰 ④ 활동 로그 5건 (공개프로필 OverviewTab 우)         │  공개프로필 패턴
│  ┌─────────────────────────────────────────────────┐   │
│  │ ActivityLog 컴포넌트 — 5건 + Material Symbols   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🏆 ⑤ 최근 경기 — PlayerMatchCard 5건                   │  공개프로필 패턴 (Phase 1)
│  ┌─────────────────────────────────────────────────┐   │
│  │ 26-GG-MD21-006 │ B조 2경기 │ 5/2 15:30 [종료]     │   │  대회상세 카드
│  │  HM 24:18 AW   내기록: 22-14-3-2 (W)            │   │  본인 기록 줄
│  │ ... 5건                                          │   │
│  │ [공개 프로필 전체 보기 →]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  👥 ⑥ 소속 팀 (운영 페이지 보존 — 풀 리스트 N건)         │  운영 보존
│  ┌─────────────────────────────────────────────────┐   │
│  │ 팀 N건 TossListItem                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🏅 ⑦ 참가 대회 (운영 페이지 보존)                       │  운영 보존
│  ┌─────────────────────────────────────────────────┐   │
│  │ 대회 N건 TossListItem (#my-tournaments anchor)   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📅 ⑧ 본인 전용 — 다음 매치 (대회) — Q4 결재             │  ⭐ NEW (있을 때만)
│  ┌─────────────────────────────────────────────────┐   │
│  │ 5/12 (월) 19:30  몰텐배 21회 │ B조 결승           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🎯 ⑨ 픽업 게임 신청 현황 (운영 recent_games 보존)       │  운영 정보 손실 0
│  ┌─────────────────────────────────────────────────┐   │
│  │ /games/[id] 픽업 게임 N건 TossListItem            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📈 ⑩ 주간 운동 리포트 링크 (운영 보존)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**설계 요점**:
- ②~⑤ = **공개 프로필 컴포넌트 100% 재사용** (PlayerHero / 통산 8열 grid / StatsDetailModal / ActivityLog / PlayerMatchCard) → 정합성 자동 보장 + 유지보수 1곳
- ⑥~⑦, ⑨~⑩ = **운영 페이지 정보 손실 0** (소속 팀 풀 리스트 / 참가 대회 / 픽업 게임 / 주간 리포트)
- ①, ⑧ = **본인 전용 신규** (진행 중 신청 / 다음 대회 매치)

### 3.2 컴포넌트 재사용 매트릭스

| 컴포넌트 | 위치 | 재사용 가능? | 비고 |
|---------|------|------------|------|
| `PlayerHero` | `(web)/users/[id]/_v2/player-hero.tsx` | ✅ 직접 import | 본인 진입 시 팔로우 버튼 hidden 분기 추가 (`isOwner` prop) |
| 통산 8열 grid | `(web)/users/[id]/_v2/overview-tab.tsx` 안 | ⚠️ 추출 필요 | `<CareerStatsGrid stats={...} onMore={...} />` 추출 |
| `StatsDetailModal` | `(web)/users/[id]/_v2/stats-detail-modal.tsx` | ✅ 직접 import | 페이지 한정 위치였지만 본인 페이지도 같은 데이터 (Q5 결재 — 위치 이동 또는 그대로 import) |
| `ActivityLog` | `(web)/users/[id]/_v2/activity-log.tsx` | ✅ 직접 import | 동일 |
| `PlayerMatchCard` | `src/components/match/PlayerMatchCard.tsx` | ✅ 글로벌 | Phase 1 결정 E-1 (글로벌) — 그대로 사용 |

**추출 작업** (Q5):
- 옵션 X-1: 컴포넌트 그대로 `_v2` 폴더에서 import (cross-route import, 동작 OK / 디렉토리 룰 위반 X)
- 옵션 X-2 ⭐: `_v2` → `src/components/profile/` 로 이동 (글로벌 재사용 명시)
- 옵션 X-3: `/profile/basketball/_v2/` 새 폴더에 별도 카피

→ **추천: X-1** (cross-route import — 가장 단순). 또는 **X-2** (글로벌 컴포넌트 격상). Phase 2 시점에 결정.

---

## 4. 신규 컴포넌트 — 본인 전용 영역

### 4.1 `MyPendingRequestsCard` (영역 ① — Q3 결재)

**위치 옵션**:
- Z-1 ⭐: `src/app/(web)/profile/basketball/_components/my-pending-requests-card.tsx`
- Z-2: `src/components/profile/MyPendingRequestsCard.tsx` (글로벌 — `/profile` 메인에도 표시 가능)

**props**:
```ts
interface MyPendingRequestsCardProps {
  requests: PendingRequest[];
}

type PendingRequest =
  | { kind: "team_join"; teamName: string; teamId: string; requestedAt: string }
  | { kind: "jersey_change"; teamName: string; teamId: string; oldJersey: number | null; newJersey: number; requestedAt: string }
  | { kind: "dormant"; teamName: string; teamId: string; until: string | null; requestedAt: string }
  | { kind: "withdraw"; teamName: string; teamId: string; requestedAt: string }
  | { kind: "transfer_in"; teamName: string; teamId: string; requestedAt: string }
  | { kind: "transfer_out"; teamName: string; teamId: string; requestedAt: string };
```

**UI**:
```
┌─────────────────────────────────────────────┐
│ 📋 진행 중 신청 (3)              [전체 →]   │
├─────────────────────────────────────────────┤
│ ⏳  등번호 #99 변경 — REDEEM 팀     1일 전  │
│ ⏳  XYZ 팀 가입 신청              3일 전  │
│ ⏳  ABC → DEF 이적 (양쪽 승인 중)  5일 전  │
└─────────────────────────────────────────────┘
```

**카드 자체 conditional**: `requests.length === 0` 시 카드 미렌더링 (빈 카드 노이즈 0).

### 4.2 `NextTournamentMatchCard` (영역 ⑧ — Q4 결재)

**props**:
```ts
interface NextTournamentMatchCardProps {
  matchId: string;
  matchCode: string | null;
  scheduledAt: string;
  tournamentName: string;
  roundName: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  myTeamSide: "home" | "away";
}
```

**UI**:
```
📅 다음 매치 (대회)
┌─────────────────────────────────────────────┐
│ 5/12 (월) 19:30  D-3              [상세 →] │
│ 26-GG-MD21-019 │ 몰텐배 21회 │ B조 결승    │
│  REDEEM (우리팀)  vs  XYZ                   │
└─────────────────────────────────────────────┘
```

**카드 자체 conditional**: 미래 대회 매치 0건 시 미렌더링.

### 4.3 `CareerStatsGrid` 추출 (Q5)

현재 `overview-tab.tsx` 안 통산 8열 grid 를 별도 컴포넌트로 추출. 공개 프로필 + 본인 페이지 둘 다 사용.

```ts
interface CareerStatsGridProps {
  stats: {
    games: number;
    winRate: number | null;
    ppg: number | null;
    rpg: number | null;
    apg: number | null;
    mpg: number | null;
    fgPct: number | null;
    threePct: number | null;
  };
  onMoreClick: () => void;  // [더보기 →] 모달 트리거
}
```

**위치 옵션**:
- Y-1 ⭐: `src/app/(web)/users/[id]/_v2/career-stats-grid.tsx` 신규 + `(web)/profile/basketball` 에서 cross-route import
- Y-2: `src/components/profile/CareerStatsGrid.tsx` (글로벌)

→ **추천: Y-2** (글로벌). 사유: 공개 + 본인 둘 다 import → 글로벌 격상이 자연스러움.

---

## 5. 데이터 모델 — 기존 활용 매트릭스

### 5.1 영역별 데이터 출처

| 영역 | 데이터 출처 | 신규 컬럼 | 신규 API |
|------|------------|---------|---------|
| ② Hero | user (USER_DISPLAY_SELECT) + 대표 팀 + jerseyNumber | ❌ | ❌ |
| ③ 통산 8열 | matchPlayerStat aggregate (공식기록 가드) | ❌ | ❌ |
| ④ 활동 로그 | matchPlayerStat / tournamentMatch (mvp) / teamMemberHistory / user.createdAt | ❌ | ❌ |
| ⑤ 최근 경기 | matchPlayerStat findMany take:10 + tournamentMatch include | ❌ | ❌ |
| ⑥ 소속 팀 | user.teamMembers + team | ❌ | ❌ |
| ⑦ 참가 대회 | tournamentTeamPlayer + tournamentTeam.tournament | ❌ | ❌ |
| ① 진행 중 신청 | team_join_requests + team_member_requests + team_transfers | ❌ | ❌ |
| ⑧ 다음 매치 | tournamentMatch + ttp(userId) join | ❌ | ❌ |
| ⑨ 픽업 게임 신청 | game_applications + games | ❌ | ❌ |
| ⑩ 주간 리포트 | (링크만) | ❌ | ❌ |

→ **DB 변경 0 / 신규 API 0 / 기존 테이블 + 기존 API + 신규 fetch**.

### 5.2 client SWR vs server component 결정 (Q1)

**현재 운영** = client SWR (use client + 2 SWR hook).

**옵션**:
| 옵션 | 방식 | 장점 | 단점 |
|------|------|------|------|
| **K-1** ⭐ | server component 전환 (공개 프로필과 동일 패턴) | Promise.all 병렬 N쿼리 / SSR / SEO / 컴포넌트 재사용 깔끔 | client interactivity (모달 open/close) 분리 필요 |
| K-2 | client 유지 + SWR endpoint 신규 (`/api/web/profile/basketball-detail`) | 기존 패턴 유지 | API 파일 신규 / N+1 fetch / 공개프로필 server 컴포넌트와 패턴 다름 |
| K-3 | hybrid — server 메인 + client 카드 (모달 / pending) | 절충 | 복잡도 증가 |

→ **추천: K-1** (server component 전환).
- 공개 프로필 = server 패턴 사용
- 본인 페이지 = 같은 컴포넌트 재사용 → server 가 자연스러움
- 모달 open state = `<StatsDetailModal>` 부모 client wrapper 분리 (Phase 2 결정 — overview-tab.tsx "use client" 패턴 이미 있음)

### 5.3 page.tsx 쿼리 설계 (제안 — server component)

```ts
// src/app/(web)/profile/basketball/page.tsx
export default async function BasketballPage() {
  const session = await getWebSession();
  if (!session) redirect("/login?redirect=/profile/basketball");
  const userId = BigInt(session.sub);

  const [
    // ② Hero + ⑥ 소속팀 + ⑦ 참가 대회 (공개 프로필 #1 재사용)
    user,
    // ③ 통산 8열 (공개 프로필 #2 재사용)
    statAgg,
    // ⑤ 최근 경기 (공개 프로필 #3 재사용 — Phase 1 select 확장)
    recentGames,
    // ③ 승률 (공개 프로필 #4 재사용)
    playerStats,
    // ② Hero jerseyNumber (공개 프로필 #9 재사용)
    representativeJersey,
    // ④ 활동 로그 — MVP (공개 프로필 #10 재사용)
    mvpMatches,
    // ④ 활동 로그 — team history (공개 프로필 #11 재사용)
    teamHistoryRows,
    // ③ 통산 모달 prefetch (공개 프로필 #12 재사용)
    allStatsForModal,
    // ⑦ 참가 대회 (운영 보존)
    tournamentTeamPlayers,
    // ⑨ 픽업 게임 신청 (운영 보존)
    gameApplications,
    // ① 진행 중 신청 — team_join_requests
    pendingJoinRequests,
    // ① 진행 중 신청 — team_member_requests
    pendingMemberRequests,
    // ① 진행 중 신청 — team_transfers
    pendingTransfers,
    // ⑧ 다음 매치 (대회)
    nextTournamentMatches,
  ] = await Promise.all([ /* 14 쿼리 */ ]);

  // 변환 로직 (Phase 1+2 카피 + 본인 전용 추가)
  ...

  return ( /* 10 영역 JSX */ );
}
```

**총 쿼리 수**: 14건 병렬 (공개 프로필 12건 + 운영 보존 2건 + 신규 4건). 평균 200ms ~ 500ms (Vercel cold 제외).

---

## 6. 시안 박제 (`Dev/design/BDR-current/screens/ProfileBasketball.jsx`)

### 6.1 시안 vs 신규 설계 갭

| 영역 | 시안 (198L) | 신규 설계 |
|------|------------|---------|
| Hero | h1 + eyebrow "MY BASKETBALL" + "47경기 30승 17패 승률 63.8%" + [전체 시즌 →] | 공개프로필 PlayerHero 재사용 (그라디언트/아바타/jersey/신체 등) |
| 4 핵심 스탯 | PPG/RPG/APG/+/- (var(--accent) 강조 + 트렌드) | 통산 8열 grid (Phase 1) |
| 선수 정보 카드 | 6 필드 (포지션/손/키/경력/레벨/BDR점수) | Hero 안 통합 (공개프로필 패턴) |
| 세부 지표 카드 | 8 필드 (FG%/3P%/FT%/TO/STL/BLK/EFF/MIN) | 통산 모달 안 (Phase 2) |
| 최근 폼 표 | 5 행 board (날짜/상대/박스스코어/결과/+/-) | PlayerMatchCard 5건 |
| 활동 로그 | 없음 | ActivityLog 5건 ⭐ |
| 진행 중 신청 | 없음 | MyPendingRequestsCard ⭐ |
| 다음 매치 | 없음 | NextTournamentMatchCard ⭐ |
| 소속 팀 풀 리스트 | 없음 | 운영 보존 |
| 참가 대회 | 없음 | 운영 보존 |
| 픽업 게임 | 없음 | 운영 보존 |

### 6.2 시안 갱신 항목 (옵션 — Q6 결재)

**옵션 W-1** ⭐: 시안 ProfileBasketball.jsx 를 운영과 정합 (10 영역 박제) — **역방향 박제 룰 (CLAUDE.md §🔄)**
- 시안 100% 새로 작성 (~600L 예상)
- 산출: 시안 = 운영 baseline 유지

**옵션 W-2**: 시안 무수정 (운영만 변경)
- 갭 발생 — 5/7 발견 갭 재발
- ❌ 비추 (룰 위반)

**옵션 W-3**: 시안 핵심 영역만 추가 (활동 로그 + pending + 다음 매치)
- 절충
- 시안 + 운영 둘 다 부분 정합

→ **추천: W-1** (운영 동등 갱신). 사유: CLAUDE.md §🔄 운영 → 시안 동기화 룰 준수. 5/7 갭 재발 방지.

### 6.3 박제 룰 13 룰 검수 (시안 갱신 시)

- [x] AppNav 7 룰 = 본문 작업 무관
- [x] 토큰 — `var(--*)` / 핑크·살몬·코랄 ❌ / lucide-react ❌ / pill 9999 ❌ (정사각 원형은 50% OK)
- [x] 카피 — placeholder 5단어 / "예: " ❌
- [x] 720px 분기 + iOS input 16px + 버튼 44px

---

## 7. 실행 계획 (단계별)

### 7.1 단계 (5 step / 병렬 가능)

| 순서 | 작업 | 담당 | 선행 | 예상 시간 |
|------|------|------|------|----------|
| 1 | **컴포넌트 추출** — `CareerStatsGrid` 글로벌 추출 (overview-tab.tsx 분리) | developer | 결재 Q1~Q6 | 15분 |
| 2 | **`MyPendingRequestsCard` 신규** — 진행 중 신청 카드 (3종 query 변환 + UI) | developer | 결재 Q3 | 25분 |
| 3 | **`NextTournamentMatchCard` 신규** — 다음 대회 매치 카드 | developer | 결재 Q4 | 15분 |
| 4 | **page.tsx 재구성** — server component 전환 + 14 쿼리 병렬 + 10 영역 JSX | developer | 1, 2, 3 | 35분 |
| 5 | **시안 박제** + tester + reviewer 병렬 | developer + tester + reviewer | 1~4 | 30분 |

**병렬 가능**: 2 ↔ 3 (둘 다 결재 의존, 서로 무관 — 동시 작업 가능)

**총 예상 시간**: ~120분 (Q3+Q4 모두 채택 시) / ~80분 (Q3만 채택, Q4 보류 시)

### 7.2 결재 후 진행 흐름

```
[사용자 결재 Q1~Q6]
    ↓
[Step 1] CareerStatsGrid 추출 (Y-2 글로벌)
    ↓ (병렬 가능)
[Step 2] MyPendingRequestsCard ↔ [Step 3] NextTournamentMatchCard
    ↓
[Step 4] page.tsx 재구성 (server + 14 쿼리 + 10 영역)
    ↓
[Step 5] 시안 박제 (ProfileBasketball.jsx W-1 갱신) + tester + reviewer 병렬
    ↓
[PM 커밋] feat(profile): 내 농구 페이지 — 공개프로필 흡수 + 본인 전용 강화
```

---

## 8. 위험 + 회귀 0 보장

| 영역 | 위험 | 대응 |
|------|------|------|
| Flutter `/api/v1/*` | ❌ 0 | 본 작업 = `(web)/profile/basketball` + cross-route import |
| `/api/web/*` | ❌ 0 | 신규 endpoint 0 / 기존 호출 0 |
| Prisma schema | ❌ 0 | 컬럼 추가 0 / select 키 추가만 |
| 공개 프로필 (`/users/[id]`) Phase 1+2 | ⚠️ 컴포넌트 추출 | overview-tab.tsx 안 8열 grid → CareerStatsGrid 분리 = JSX 동등 변경 (회귀 검증 필수) |
| 마이페이지 hub (`/profile`) | ❌ 0 | hub 의 "내 농구" 카드 진입만 → /profile/basketball 페이지 자체 변경 |
| game_applications 데이터 | ✅ 보존 | 운영 영역 ⑨ 그대로 유지 |
| 본인 인증 가드 | ✅ 유지 | server component → getWebSession() + redirect("/login") |
| 픽업 게임 + 대회 매치 데이터 분리 | ⚠️ 사용자 인지 | "최근 경기 (대회)" + "픽업 게임" 명확히 라벨 분리 |

**회귀 검증 항목** (구현 후 tester 단계):
- [ ] 비로그인 진입 → /login redirect
- [ ] 본인 진입 → 정상 노출 (/profile redirect 없음)
- [ ] PlayerHero 본인 진입 시 팔로우 버튼 hidden (isOwner 분기)
- [ ] 통산 8열 + [더보기] 모달 정상 (Phase 2 모달 재사용)
- [ ] 활동 로그 5건 본인 데이터 정상
- [ ] PlayerMatchCard 5건 본인 매치 정상 (`/live/[id]` 클릭)
- [ ] MyPendingRequestsCard pending 0건 시 카드 미렌더링
- [ ] MyPendingRequestsCard pending N건 시 정렬 (최신 우선) + 클릭 → /teams/[id]
- [ ] NextTournamentMatchCard 미래 매치 0건 시 미렌더링
- [ ] 소속 팀 / 참가 대회 / 픽업 게임 / 주간 리포트 = 운영 보존 (정보 손실 0)
- [ ] tsc --noEmit 0 / build 통과
- [ ] 공개 프로필 (`/users/[id]`) 회귀 0 (CareerStatsGrid 추출 후)
- [ ] 모바일 720px 분기 정상 (10 영역 모두)

---

## 9. ⚠️ developer 주의사항

1. **server component 전환** (Q1=K-1) — 현재 `"use client"` 페이지 → server component. SWR 호출 제거. `useSWR` import 모두 제거.

2. **PlayerHero 재사용 — isOwner 분기** — 현재 PlayerHero 안에 `<ActionButtons isFollowing isLoggedIn>` 자식 prop 사용. 본인 진입 시 ActionButtons 자체 hidden 또는 다른 액션 (편집 등) 으로 교체. **신규 prop `isOwner: boolean` 추가 검토** (PlayerHero 시그니처 변경).

3. **CareerStatsGrid 추출** (Y-2) — `overview-tab.tsx` 안 통산 grid JSX 가 다른 영역과 강결합 가능. 분리 시 props 시그니처 정밀 정의 + onMoreClick callback (모달 open) 부모 client wrapper 에서 wire-up.

4. **StatsDetailModal cross-route import** — `_v2/stats-detail-modal.tsx` 위치 그대로 두고 `/profile/basketball/page.tsx` 에서 import 가능 (Next.js cross-route component import 정상 동작). 단 디렉토리 룰 명시는 글로벌 격상 (Q5=Y-2) 후 검토.

5. **3종 pending 신청 통합** (영역 ①):
   - `team_join_requests.findMany({ where: { userId, status: "pending" }})`
   - `team_member_requests.findMany({ where: { userId, status: "pending" }, include: { team: true } })` (jersey/dormant/withdraw 3종)
   - `team_transfers.findMany({ where: { user_id: userId, final_status: { in: ["pending"] } } })` (양쪽 승인 state — 5/5 PR10)
   - 클라이언트 병합 → `PendingRequest[]` 단일 배열 (정렬: createdAt desc)

6. **다음 매치 query 비용** (영역 ⑧):
   ```ts
   prisma.tournamentMatch.findMany({
     where: {
       status: "scheduled",
       scheduledAt: { gte: new Date() },
       OR: [
         { homeTeam: { players: { some: { userId } } } },
         { awayTeam: { players: { some: { userId } } } },
       ],
     },
     orderBy: { scheduledAt: "asc" },
     take: 1,
   })
   ```
   nested filter 비용 ↑ — 인덱스 검증 필요. 또는 ttp 직접 조회 후 `IN` 변환.

7. **사용자 결정 §6-1 카피 룰** — 시안 카피 우선. 신규 영역 카피는 시안에 같이 박제 (W-1 시안 갱신).

8. **truncated 파일 0** — 신규 4 파일 (~600L 예상) 끝줄 검증 필수 (Phase 1+2 패턴 — `}` / `</div>` / `window.PlayerProfile = ...` 등).

9. **모달 client wrapper 분리** — `<StatsDetailModal>` open state 는 client component 필요. server page → client wrapper (`<BasketballPageClient>`) 안에서 useState. 또는 통산 카드만 client (Phase 2 overview-tab.tsx 패턴 카피).

10. **마이페이지 hub의 "내 농구" 카드 4 stat** — 현재 PPG/APG/RPG/RTG (rtg=evaluation_rating). 본 작업 후에도 그대로 유지 (hub 변경 0). 단 새 페이지 진입 후 사용자가 더 자세히 보는 흐름.

---

## 10. 사용자 결재 항목 (Q1~Q6)

### Q1. 페이지 컴포넌트 모델

| 옵션 | 방식 | 추천 사유 |
|------|------|---------|
| **K-1** ⭐ | server component 전환 (Promise.all 14 쿼리) | 공개프로필과 일관 / SSR / 컴포넌트 재사용 |
| K-2 | client SWR 유지 + 신규 endpoint | 기존 패턴 보존 |
| K-3 | hybrid (server 메인 + client 카드) | 절충 |

→ **추천: K-1**.

### Q2. 영역 우선순위 (10 영역 모두 vs 핵심만)

| 옵션 | 영역 | 추천 |
|------|------|------|
| **L-1** ⭐ | 10 영역 모두 (Hero / 통산 / 활동 / 최근 / 소속팀 / 대회 / pending / 다음매치 / 픽업 / 주간리포트) | 의뢰 의도 100% (공개프로필 흡수 + 본인 강화) |
| L-2 | 7 영역 (① pending + ② Hero + ③ 통산 + ⑤ 최근경기 + ⑥ 소속팀 + ⑦ 대회 + ④ 활동) — Q4 다음매치 + ⑨ 픽업 보류 | 단순 |
| L-3 | 5 영역 (Hero + 통산 + 최근경기 + 소속팀 + 활동) | 미니멀 |

→ **추천: L-1**.

### Q3. 진행 중 신청 카드 (영역 ①) 채택?

| 옵션 | 추천 |
|------|------|
| **M-1** ⭐ | 채택 — 3종 (team_join + team_member_requests + team_transfers) 통합 | 본인 전용 최우선 가치 |
| M-2 | 채택 — 1종 (team_member_requests 만) | 단순 |
| M-3 | 보류 — Phase 후속 | 빠른 구현 |

→ **추천: M-1**.

### Q4. 다음 대회 매치 카드 (영역 ⑧) 채택?

| 옵션 | 추천 |
|------|------|
| **N-1** ⭐ | 채택 — 미래 매치 1건 카드 | 본인 전용 가치 |
| N-2 | 보류 — Phase 후속 | 마이페이지 hub 의 nextGame 으로 대체 가능 |

→ **추천: N-1** (작은 영역, 비용 낮음).

### Q5. 컴포넌트 추출 위치 (CareerStatsGrid)

| 옵션 | 위치 | 추천 |
|------|------|------|
| **Y-2** ⭐ | `src/components/profile/CareerStatsGrid.tsx` (글로벌) | 공개+본인 둘 다 사용 |
| Y-1 | `(web)/users/[id]/_v2/career-stats-grid.tsx` (페이지 한정) + cross-route import | 단순 |

→ **추천: Y-2**.

### Q6. 시안 박제 (ProfileBasketball.jsx)

| 옵션 | 방식 | 추천 |
|------|------|------|
| **W-1** ⭐ | 운영 동등 갱신 (10 영역 시안 박제) | CLAUDE.md §🔄 룰 준수 / 5/7 갭 재발 방지 |
| W-2 | 시안 무수정 | 갭 발생 |
| W-3 | 핵심 3 영역 추가 (pending + 활동 + 다음매치) | 절충 |

→ **추천: W-1**.

---

## 11. 결재 후 진행 흐름 + 분량 예상

```
[사용자 결재 Q1~Q6]
    ↓
[Step 1] CareerStatsGrid 추출 (15분)
    ↓ (병렬)
[Step 2] MyPendingRequestsCard 신규 (25분) ↔ [Step 3] NextTournamentMatchCard 신규 (15분)
    ↓
[Step 4] page.tsx 재구성 — server component + 14 쿼리 + 10 영역 (35분)
    ↓
[Step 5] 시안 박제 (W-1) + tester + reviewer 병렬 (30분)
    ↓
[PM 커밋] feat(profile/basketball): 공개프로필 흡수 + 본인 전용 영역 (pending/다음매치) 강화
```

**분량 예상**:
- 신규 컴포넌트: 3 파일 (~80 + ~150 + ~80 = ~310L)
- 수정: page.tsx (239L → ~500L) / overview-tab.tsx (CareerStatsGrid 분리, ~50L 변동) / ProfileBasketball.jsx (198L → ~600L)
- 산출 5 파일 변경
- DB 변경 0 / API 변경 0 / Flutter 영향 0
- 총 시간: **~120분 (2h)** (모든 결재 채택 시)

---

## 12. 후속 (Phase 후속 — 본 작업 외)

- **개인 목표 (영역 C)** — schema 추가 (user.season_goal_*) + 진척 차트
- **트렌드 차트 (영역 D)** — 통산 모달에 4번째 탭 (sparkline)
- **Splits (영역 E)** — 5번째 탭 (홈/원정/승/패/월별)
- **Reviews (영역 F)** — 받은 리뷰 (Q1 player kind 도입 시)
- **슛 차트 (영역 I)** — shot_zone_stat cron 활성 후

---

## 13. 의뢰 의도 vs 본 설계 매핑

| 의뢰 문구 | 본 설계 대응 |
|---------|-----------|
| *"공개 프로필 페이지를 더 자세하게 확인할 수 있는 페이지"* | 영역 ②③④⑤ = 공개프로필 100% 재사용 (super-set) |
| *"본인 전용 추가 정보"* | 영역 ① pending 신청 + 영역 ⑧ 다음 매치 + 영역 ⑨ 픽업 게임 |
| *"더 풍부한 표현"* | 통산 더보기 모달 (Phase 2) + 활동 로그 5건 (Phase 2) + PlayerMatchCard (Phase 1) + 시안 박제 (W-1) |

→ **본 설계 = 의뢰 의도 100% + 회귀 0 + 신규 컴포넌트 3 + 데이터 변경 0**.
