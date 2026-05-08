# 홈 시안 100% 디자인 시스템 본격 적용 — 기획 / 마이그레이션 계획서

작성: 2026-05-09 / planner-architect
대상 시안: `Dev/design/BDR-current/screens/Home.jsx` (978 라인)
대상 운영: `src/app/(web)/page.tsx` (372 라인)
선행: 5/9 옵션 B (`ce0102e`) + StatsStrip 최하단 (`946b8b8`) — 헤더 통일 / 사이드바 매핑 1차 완료
본 문서: 시안 12 섹션 100% 정합 — 본격 본문/사이드바 구조 도입

---

## §1. 배경 / 정책

### 왜 본격 본문 구조 도입인가
- 5/9 P0 부활 (`c8d5f22`) — `MySummaryHero` + `RecommendedGames` + `RecommendedVideos` 운영에 import 만 추가 (3 컴포넌트 부활)
- 5/9 옵션 B (`ce0102e`) — `RecommendedRail` 통일 헤더 + 헤더 교체 (2 컴포넌트)
- 5/9 StatsStrip 최하단 (`946b8b8`) — 시안 `CommunityPulse` 사이드바 매핑

→ **현재 핵심 매치 매칭 가치는 회복** 했으나 **시안 12 섹션 vs 운영 7 섹션** 의 **본문/사이드바/카드 디자인 갭** 잔존.

### 적용 정책 (CLAUDE.md / 디자인 13 룰 / 운영→시안 동기화 룰 5/7)
1. **AppNav frozen 7 룰** (03) — 본 작업은 헤더 영역 X (영향 0)
2. **디자인 토큰 룰** (10) — `var(--*)` 토큰만 / 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌ / Material Symbols Outlined ✅
3. **빌드 에러 회피** (5/9 박제) — `Dev/.../*.md` 파일에 `bg-[var(--ASTERISK)]` 텍스트 금지 → 본 문서는 placeholder `--TOKEN` 사용
4. **카피 룰** (11) — 시안 우선 (placeholder 5단어 이내 / "예: " 시작 ❌)
5. **회귀 0 우선** — Flutter `/api/v1/*` 변경 0 / DB schema 변경 0 / 운영 영향 최소화
6. **운영 → 시안 동기화 룰 5/7** — 시각 패턴 변경 시 `BDR-current/` 같이 갱신

---

## §2. 시안 12 섹션 vs 운영 7 섹션 매트릭스

| # | 시안 섹션 (line) | 운영 매핑 | 상태 |
|---|---------------|---------|------|
| 1 | Header `eyebrow + h1 + 우측 CTA + 통계 1줄` (L46~75) | (없음 — HeroCarousel 단독) | ❌ 갭 A |
| 2 | HeroBento `좌 promo + 우 라이브/접수 Bento` (L80~86) | HeroCarousel (`bdr-v2/hero-carousel`) | ⚠️ 부분 (컨셉 다름 — 갭 B) |
| 3 | MySummaryHero (L91) | `MySummaryHero` (`home/my-summary-hero`) | ✅ 정합 (5/9 부활) |
| 4 | RecommendedRail #1 곧 시작할 경기 (L96~104) | `RecommendedGames` (`home/recommended-games` + `bdr-v2/recommended-rail`) | ✅ 정합 (5/9 옵션 B) |
| 5 | RecommendedRail #2 열린 대회 (L109~117) | CardPanel "열린 대회" + TournamentRow (정적 게시판형) | ❌ 갭 C |
| 6 | RecommendedRail #2.5 BDR 추천 영상 (L124~132) | `RecommendedVideos` + `RecommendedRail` | ✅ 정합 (5/9 옵션 B) |
| 7-1 | NoticeCard + HotPostsCard 2분할 (L144~151) | 통합 CardPanel "공지·인기글" 1개 (HotPostRow) | ⚠️ 부분 (갭 D — 분리 X) |
| 7-2 | NewsFeed 방금 올라온 글 (L154) | BoardRow "방금 올라온 글" 풀 테이블 | ✅ 정합 |
| 7-3 | RecommendedRail #3 주목할 팀 (본문) (L157~166) | (없음) | ❌ 갭 E |
| 7-4-A | ProfileWidget (사이드바) (L174) | (없음 — MySummaryHero 본문 흡수) | ❌ 갭 F-1 |
| 7-4-B | NotableOrgs (사이드바) (L175) | (없음) | ❌ 갭 F-2 |
| 7-4-C | CommunityPulse (사이드바) (L176) | StatsStrip (최하단 풀폭 4열) | ⚠️ 부분 (위치 다름 — 5/9 매핑) |

### 갭 영역 7건 정리 (A~G)
- **A. Header** — eyebrow + h1 + CTA 2개 + 통계 1줄 → 운영 X
- **B. HeroBento** — 좌 promo + 우 라이브/접수 Bento 분할 → 운영 HeroCarousel 자동 슬라이드 (컨셉 다름)
- **C. RecommendedRail #2 열린 대회 빅 배너** → 운영 CardPanel/TournamentRow 정적 row
- **D. NoticeCard / HotPostsCard 분리** → 운영 통합 CardPanel 1개
- **E. RecommendedRail #3 주목할 팀** → 운영 X (단, `home/notable-teams` 미사용 자산 존재)
- **F. 사이드바 (ProfileWidget + NotableOrgs)** → 운영 X (단, `home/profile-widget` 미사용 자산 존재)
- **G. 카드 디자인 시안 정합** — `GameMiniCard` / `TourneyMiniCard` / `TeamMiniCard` (시안) vs 운영 `GameCard` / `TournamentRow` 시각 차이

---

## §3. 갭 7 영역 상세 분석

### 갭 A — Header (eyebrow + h1 + CTA + 통계)
- **시안 정의** (L46~75)
  - eyebrow `"전국 농구 매칭 플랫폼"` (`.eyebrow` class)
  - h1 `"오늘도 코트에서 만나요"` — `var(--accent)` "코트" 강조 / `var(--ff-display)` / 28~40px
  - 통계 한 줄 `"전국 N명 · 지금 M명 접속 중"` 13px / `var(--ink-mute)`
  - 우측 `[검색]` `[+ 모집글 작성]` 2개 (Icon.search / Icon.plus)
- **운영 현재** — HeroCarousel (4종 슬라이드 자동회전) 단독, eyebrow/h1/CTA 없음
- **신규 컴포넌트** — `<HomeHeader />` 신규 (~70L 서버 컴포넌트)
- **데이터 출처** — `prefetchStats()` (이미 호출됨) → `members + onlineNow` 표시
  - `onlineNow` = DB 실시간 카운트 부재 → "지금 접속 중" 부분 생략 또는 `"-"` placeholder
- **회귀 위험** — 0 (신규 섹션 추가만 / HeroCarousel 영향 0)

### 갭 B — HeroBento (좌 promo + 우 라이브/접수)
- **시안 정의** (L199~304)
  - 좌 `1.6fr` Promo (대회 메인) — 28×28px 패딩 / `eyebrow + h2 + p + [지금 신청] [전체 대회 →]` CTA
  - 우 `1fr` 라이브/마감임박 카드 + 빠른 진입 4 grid (경기/코트/팀/랭킹)
  - 모바일 ≤900px → 1열 stack
- **운영 현재** — HeroCarousel 4종 슬라이드 자동회전 (대회/게임/MVP/정적). 컴포넌트 자체 풍부 (banner_url / live_match / 사용자별 fallback)
- **선택지**
  - **B-1**. HeroBento 신규 도입 + HeroCarousel 폐기 → 시안 100% 매핑 (변경 大)
  - **B-2**. HeroBento + HeroCarousel 병행 (HeroBento 위 / HeroCarousel 아래) → 정보 중복
  - **B-3**. HeroCarousel 유지 + HeroBento 미도입 → 갭 유지 (현재 상태)
  - **B-4**. HeroCarousel 시각만 시안 정합 (eyebrow + h2 + CTA 톤) → 신규 컴포넌트 0 / 시각만 정합
- **신규 컴포넌트** (B-1 선택 시) — `<HomeHeroBento />` (~180L 서버 컴포넌트, mainTourney + closingTourney + liveMatch + liveRun props)
- **데이터 출처** — 신규 prefetch 함수 필요 (`prefetchClosingTournament` + `prefetchLiveTournament` + `prefetchOpenRun`)
- **기존 자산** — `src/components/home/hero-bento.tsx` 이미 존재 (341L) — 단 시안 컨셉과 다름 (YouTube 슬라이드)
- **회귀 위험** — HeroCarousel 사용자 영향 大 (B-1 선택 시 운영자 검토 필요)

### 갭 C — RecommendedRail #2 열린 대회 빅 배너
- **시안 정의** (L109~117 + L495~522 TourneyMiniCard)
  - `RecommendedRail title="열린 대회" eyebrow="TOURNAMENTS"` 가로 스크롤
  - TourneyMiniCard — Poster (110px h / accent 그라디언트) + 메타 (status badge + applied/capacity + court · dates + format)
- **운영 현재** — CardPanel "열린 대회" 안에 TournamentRow 5건 (좌측 54×54 accent 블록 + 메타 row)
- **신규 컴포넌트** — `<TourneyMiniCard />` (~80L 서버 컴포넌트)
- **데이터 출처** — `prefetchOpenTournaments()` (이미 호출됨, 본문 그대로 재활용)
- **변경** — page.tsx 에서 CardPanel "열린 대회" → `RecommendedRail` 가로 스크롤로 교체
- **회귀 위험** — 0 (데이터 동일 / wrapper 만 교체)

### 갭 D — NoticeCard / HotPostsCard 분리
- **시안 정의** (L144~151 + L648~750)
  - 본문 좌측 위 — `gridTemplateColumns: repeat(auto-fit, minmax(280px, 1fr))` 2분할
  - NoticeCard — 빨간 줄 `var(--accent)` + "공지사항" + 4건 (고정/공지 배지 + 제목 + 날짜)
  - HotPostsCard — 파란 줄 `var(--cafe-blue)` + "인기글" + N건 (rank 1~3 강조 + 제목+댓글 + 조회수)
- **운영 현재** — CardPanel "공지 · 인기글" 통합 1개 (HotPostRow 5건, 공지=red badge)
- **신규 컴포넌트** — `<NoticeCard />` / `<HotPostsCard />` 2개 (~100L 각 서버 컴포넌트)
- **데이터 출처**
  - 공지 — `prefetchCommunity()` 의 `category === "notice"` 필터 4건
  - 인기글 — `prefetchCommunity()` 의 `views_count desc` (현재 created_at desc 정렬 → 변경 필요)
  - **신규 prefetch 분기 필요** — `prefetchNotices()` + `prefetchHotPosts()` 분리 (or 단일 prefetch 결과를 분기)
- **회귀 위험** — 데이터 정렬 변경 (HotPostsCard 인기 정렬 = views_count desc) — 운영 영향 작음 (동일 데이터 다른 정렬)

### 갭 E — RecommendedRail #3 주목할 팀
- **시안 정의** (L157~166 + L616~643 TeamMiniCard)
  - `RecommendedRail title="주목할 팀" eyebrow="TEAMS · 레이팅 상위" inset` 본문 내부 (220px 폭)
  - TeamMiniCard — Avatar (44×44 / team.color) + 팀명 + 승패 + 승률 + 레이팅 (mono / cafe-blue-deep)
- **운영 현재** — 없음. 단 미사용 자산 `src/components/home/notable-teams.tsx` (139L) 존재 — useSWR `/api/web/teams` (TossSectionHeader / 세로 리스트)
- **신규 컴포넌트** — `<TeamMiniCard />` (~50L 서버 컴포넌트)
- **데이터 출처**
  - **선택지 E-1** — 기존 `prefetchTeams()` (`home.ts` line 31) 재활용 (이미 정의됨, 60건 take, status=active)
  - **선택지 E-2** — `home/notable-teams.tsx` 활용 (useSWR `/api/web/teams` + TossSectionHeader 헤더 만 교체)
  - 권장: **E-1 — `prefetchTeams()` 재활용 + `<TeamMiniCard />` 신규 + `RecommendedRail inset` wrapper**
  - rating 컬럼 — `team` 모델에 rating/wins 컬럼 존재 확인 필요 (schema 검토)
- **회귀 위험** — 0 (신규 섹션 / 기존 prefetch 재활용)

### 갭 F — 사이드바 (ProfileWidget + NotableOrgs)
- **시안 정의** (L170~177 + L852~941)
  - 우측 300px aside `display: flex; flex-direction: column; gap: 16; align-self: start`
  - ProfileWidget — Avatar 40×40 + 이름 + L.N + 3 stat (승률/경기/평점) + 4 link (mygames/saved/messages/notifications)
  - NotableOrgs — 4건 단체 list (Avatar 32×32 + 단체명 + kind/teams/members)
  - 모바일 ≤900px → home__split 1열 stack (사이드바 본문 아래)
- **운영 현재** — 없음. 단 미사용 자산 풍부:
  - `src/components/home/profile-widget.tsx` (248L) — XP/레벨/연속출석/뱃지 (시안과 다른 게이미피케이션 컨셉)
  - `src/components/home/right-sidebar-logged-in.tsx` (256L) / `right-sidebar-guest.tsx` (270L)
- **선택지 F-A**. 시안 ProfileWidget 시각 그대로 신규 작성 (3 stat: 승률/경기/평점)
- **선택지 F-B**. 운영 `profile-widget.tsx` (XP/레벨/뱃지) 컨셉 유지 + 시안 시각만 정합
- **신규 컴포넌트** (F-A 선택 시)
  - `<ProfileWidgetCompact />` (~120L) — useSWR `/api/web/profile/stats` (이미 MySummaryHero에서 사용 중)
  - `<NotableOrgs />` (~80L) — useSWR or prefetch `/api/web/organizations` (신규 endpoint 필요 검토)
- **데이터 출처**
  - ProfileWidget — `/api/web/profile/stats` (재활용)
  - NotableOrgs — **신규 endpoint 필요** (`/api/web/organizations` 또는 `/api/web/orgs`) — 현재 운영에 없음
  - schema.prisma `organization` 모델 확인 필요 (스키마 컬럼 부재 가능)
- **회귀 위험** — NotableOrgs 신규 API 추가 (Flutter v1 영향 0 — `/api/web/*` 한정)

### 갭 G — 카드 디자인 시안 정합
- **시안 정의**
  - GameMiniCard (L445~490) — 3px top accent (kind 색상) + 타이틀 + meta + progress bar + 점선 border
  - TourneyMiniCard (L495~522) — Poster 110px h + status badge + applied/capacity + court · dates + format
  - VideoMiniCard (L533~611) — 16:9 thumbnail + LIVE 뱃지 + 듀레이션 뱃지 + 제목 uppercase
  - TeamMiniCard (L616~643) — Avatar 44×44 + 팀명 + 승패 + 승률 + 레이팅
- **운영 현재**
  - `src/components/bdr-v2/game-card.tsx` — RecommendedGames 가 inline 렌더 (시안 GameMiniCard와 다름 / 280×112)
  - `src/components/home/recommended-videos.tsx` 자체 카드 inline (시안 VideoMiniCard 와 일부 정합 — NBA 2K 톤)
  - TourneyMiniCard / TeamMiniCard — 운영 부재
- **선택지 G-1**. 4 카드 모두 시안 카피로 신규 추출 (`bdr-v2/mini-cards/*.tsx` 4 파일 ~80L 각)
- **선택지 G-2**. RecommendedGames + RecommendedVideos 내부 카드 인라인 보존 + 신규 카드만 추출 (TourneyMiniCard / TeamMiniCard 2개)
- **권장 G-2** — 변경 영향 최소화 (5/9 부활 컴포넌트 보존)
- **회귀 위험** — G-1 선택 시 운영 RecommendedGames + RecommendedVideos 카드 시각 변경 大

---

## §4. 신규 컴포넌트 N개 설계 (~10 컴포넌트)

| # | 위치 | 신규/수정 | 추정 라인 | server/client | props |
|---|------|---------|---------|--------------|-------|
| C1 | `src/components/bdr-v2/home-header.tsx` | 신규 | ~70 | server | `{ stats: { user_count, online_now? } }` |
| C2 | `src/components/bdr-v2/home-hero-bento.tsx` | 신규 (선택 B-1) | ~180 | server | `{ main, closing, live, liveRun }` |
| C3 | `src/components/bdr-v2/mini-cards/tourney-mini-card.tsx` | 신규 | ~80 | server | `{ tournament, href }` |
| C4 | `src/components/bdr-v2/mini-cards/team-mini-card.tsx` | 신규 | ~50 | server | `{ team, href }` |
| C5 | `src/components/bdr-v2/notice-card.tsx` | 신규 | ~100 | server | `{ notices, moreHref }` |
| C6 | `src/components/bdr-v2/hot-posts-card.tsx` | 신규 | ~100 | server | `{ posts, moreHref }` |
| C7 | `src/components/bdr-v2/profile-widget-compact.tsx` | 신규 (선택 F-A) | ~120 | client (useSWR) | (없음 — 자체 fetch) |
| C8 | `src/components/bdr-v2/notable-orgs.tsx` | 신규 (선택 F) | ~80 | client (useSWR) | (없음) or props `{ orgs }` |
| C9 | `src/components/bdr-v2/notable-teams-rail.tsx` | 신규 (선택 E) | ~50 (얇은 wrapper) | server | `{ teams }` (RecommendedRail + TeamMiniCard map) |
| C10 | `src/components/bdr-v2/community-pulse.tsx` | 신규 (선택 F-3 사이드바 컴팩트) | ~70 | server | `{ stats }` (StatsStrip 사이드바 폭 변형) |

### 수정 컴포넌트 (page.tsx 만 — 시안 12 섹션 wire)
- `src/app/(web)/page.tsx` — 372L → ~480L 추정 (섹션 추가 + 본문/사이드바 split + 컴포넌트 wire)

### 신규 prefetch 함수 (`src/lib/services/home.ts`)
| # | 함수 | 용도 | 추정 라인 |
|---|------|-----|---------|
| P1 | `prefetchClosingTournament()` | HeroBento 우 (마감임박) | ~30 |
| P2 | `prefetchLiveTournament()` | HeroBento 우 (라이브) | ~30 |
| P3 | `prefetchOpenRun()` | HeroBento 우 (즉석 매칭 — `games` table status=in_progress?) | ~30 |
| P4 | `prefetchNotablesOrgs()` | NotableOrgs 사이드바 | ~40 (DB 모델 확인 후) |
| P5 | `prefetchTeamsForRail()` | RecommendedRail #3 (rating desc 6건) | ~30 (`prefetchTeams()` 의 inset 변형) |
| P6 | (split) `prefetchNotices()` | NoticeCard (category="notice") | ~20 |
| P7 | (split) `prefetchHotPosts()` | HotPostsCard (views desc) | ~25 |

---

## §5. 데이터 출처 정합

| 신규 섹션 | API/DB 출처 | 신규/재활용 | 비고 |
|---------|----------|-----------|------|
| HomeHeader 통계 | `prefetchStats()` 재활용 | 재활용 | online_now = "-" placeholder |
| HeroBento main | `prefetchHeroSlides()` (인프로그레스 우선) 재활용 | 재활용 | (선택 B-1 채택 시) |
| HeroBento closing | `prefetchClosingTournament()` 신규 | 신규 (~30L) | `registration_end_at` 7일 이내 1건 |
| HeroBento live | `prefetchLiveTournament()` 신규 | 신규 (~30L) | tournamentMatch status="live" |
| HeroBento liveRun | `prefetchOpenRun()` 신규 | 신규 (~30L) | games status=2 (recruiting in progress) |
| HeroBento 빠른 진입 | (없음 — 정적 4 link) | 정적 | `/games` `/courts` `/teams` `/leaderboard` |
| TourneyRail #2 | `prefetchOpenTournaments()` 재활용 | 재활용 | wrapper 변경만 |
| NoticeCard | `prefetchCommunity()` filter `category="notice"` | 재활용 (분기) | top 4건 |
| HotPostsCard | `prefetchCommunity()` order by views_count desc | 재활용 (정렬 변경) | top 5건 |
| TeamRail #3 | `prefetchTeams()` 재활용 | 재활용 | rating/wins desc 6건 |
| ProfileWidget (사이드바) | `/api/web/profile/stats` (clientside SWR) | 재활용 | useSWR + dedupingInterval 활용 |
| NotableOrgs | **신규 endpoint** `/api/web/organizations` | **신규 API** | schema.prisma `organization` 모델 검토 필요 |
| CommunityPulse (사이드바) | `prefetchStats()` 재활용 | 재활용 | StatsStrip 사이드바 변형 |

### 신규 API 라우트 (1건)
- `src/app/api/web/organizations/route.ts` — `GET` `is_public + status=active` 4건 list (Flutter `/api/v1/*` 영향 0)

---

## §6. 마이그 단계 (3 Phase)

### Phase 1 — P0 즉시 가치 (~3~4h)
**목표**: 시각 임팩트 큰 항목 선반영 + 운영 영향 최소
- (A) HomeHeader 신규 — eyebrow + h1 + 통계 + CTA (HeroCarousel 위)
- (D) NoticeCard / HotPostsCard 분리 — 통합 CardPanel → 2분할 grid
- (C) RecommendedRail #2 열린 대회 빅 배너 — CardPanel/TournamentRow → RecommendedRail/TourneyMiniCard
- 완료 후: 운영 7섹션 → 9섹션 / 시안 정합도 50% → 70%
- 회귀: 데이터 출처 동일 (정렬만 변경) / 신규 API 0

### Phase 2 — P1 도메인 진입 (~3~4h)
**목표**: 본문 추가 섹션 (주목할 팀)
- (E) RecommendedRail #3 주목할 팀 — `prefetchTeams()` 재활용 + `<TeamMiniCard />` 신규 + RecommendedRail inset wrapper
- (B-4) HeroCarousel 시각만 시안 톤 정합 — eyebrow + h2 + CTA 컬러 매핑 (B-1 도입 보류)
- 완료 후: 시안 정합도 70% → 85%
- 회귀: HeroCarousel 사용자 영향 작음 (시각만)

### Phase 3 — P2 사이드바 + 카드 시안 정합 (~5~7h)
**목표**: 본문/사이드바 split + 카드 시각 정합
- (F-1) ProfileWidget (사이드바) 신규 — useSWR `/api/web/profile/stats`
- (F-2) NotableOrgs 신규 — 신규 API `/api/web/organizations` route + 컴포넌트
- (F-3) CommunityPulse (사이드바) 신규 — StatsStrip 사이드바 변형 + 본문 풀폭 StatsStrip 폐기 검토
- (G) 카드 디자인 시안 정합 (선택 G-2 권장 — TourneyMiniCard / TeamMiniCard 만 추출)
- 본문/사이드바 split 도입 — `display: grid; grid-template-columns: minmax(0, 1fr) 300px`
- 완료 후: 시안 정합도 85% → 100%
- 회귀: 신규 API 1건 추가 (Flutter v1 영향 0)

---

## §7. PR 분할 (~5 PR)

| PR | 영역 | 변경 파일 | 추정 라인 (+/-) | 리스크 |
|----|------|---------|--------------|------|
| PR1 | Phase 1A — HomeHeader 신규 | `bdr-v2/home-header.tsx` 신규 + page.tsx wire | +90 / -0 | 낮음 |
| PR2 | Phase 1D — NoticeCard / HotPostsCard 분리 | `bdr-v2/notice-card.tsx` + `bdr-v2/hot-posts-card.tsx` 신규 + `home.ts` prefetch 분기 + page.tsx | +250 / -50 | 중 (정렬 변경) |
| PR3 | Phase 1C — RecommendedRail #2 열린 대회 | `bdr-v2/mini-cards/tourney-mini-card.tsx` 신규 + page.tsx wire | +120 / -50 | 낮음 |
| PR4 | Phase 2E — 주목할 팀 RecommendedRail | `bdr-v2/mini-cards/team-mini-card.tsx` + `bdr-v2/notable-teams-rail.tsx` 신규 + `home.ts` `prefetchTeams()` 활용 + page.tsx | +130 / -0 | 낮음 |
| PR5 | Phase 3F + G — 사이드바 + 카드 시안 정합 | `bdr-v2/profile-widget-compact.tsx` + `bdr-v2/notable-orgs.tsx` + `bdr-v2/community-pulse.tsx` 신규 + 신규 API `api/web/organizations/route.ts` + page.tsx 본문/사이드바 split + StatsStrip 폐기 | +500 / -50 | 중 (신규 API + 레이아웃 大 변경) |

---

## §8. 회귀 평가

### Flutter v1 (`/api/v1/*`)
- ✅ 변경 0 — 본 작업 모두 `/api/web/*` + 컴포넌트 한정

### DB schema
- ✅ 변경 0 — 기존 모델 (`tournament` / `team` / `community_posts` / `users`) 재활용
- ⚠️ schema 확인 필요 — `organization` 모델 (NotableOrgs 신규 API)

### API 응답 envelope (snake_case)
- ✅ 일관 — `apiSuccess()` 자동 변환 / 프론트 접근자 snake_case
- 신규 API 1건 (`/api/web/organizations`) — `withAuth` 미적용 (공개 list) + `apiSuccess()` 사용

### 운영 영향
- Phase 1A — HomeHeader 신규 추가만 (영향 0)
- Phase 1D — 정렬 변경 (인기글 = views desc) — 운영 영향 작음
- Phase 1C — TournamentRow → TourneyMiniCard 시각 변경 (사용자 시각 영향 中)
- Phase 2E — RecommendedRail #3 신규 추가만 (영향 0)
- Phase 3F — 본문 단일 컬럼 → 본문/사이드바 split (사용자 시각 영향 大)
- Phase 3G — 카드 디자인 일부 시각 변경 (TourneyMiniCard / TeamMiniCard 한정 — RecommendedGames / RecommendedVideos 카드 보존)

### 빌드 에러 회피 룰 (5/9 박제)
- ✅ 본 문서에서 `bg-[var(--ASTERISK)]` 텍스트 사용 0 — placeholder `--TOKEN` 사용
- 코드 작성 시 `style={{ background: "var(--accent)" }}` 패턴 사용 (Tailwind arbitrary value 회피)

---

## §9. 추정 시간 / 분배 권장

| Phase | 작업 | 추정 시간 |
|-------|------|---------|
| Phase 1 (P0) | HomeHeader + NoticeCard 분리 + 열린 대회 RecommendedRail | 3~4h |
| Phase 2 (P1) | 주목할 팀 RecommendedRail + HeroCarousel 시각 정합 | 3~4h |
| Phase 3 (P2) | 사이드바 도입 + 카드 시안 정합 + 신규 API | 5~7h |
| **합계** | **3 Phase** | **11~15h** |

### 분배 권장 (사용자 결정 항목)
- 옵션 1: 즉시 (5/9) Phase 1 P0 진행
- 옵션 2: 5/10 후 분배 (Phase 1 5/10 / Phase 2 5/13 / Phase 3 5/15)
- 옵션 3: 1주 분배 (Phase 1 5/10 / Phase 2 5/12 / Phase 3 5/15)
- 권장: **옵션 2** — 5/9 옵션 B + StatsStrip 변경 검증 후 Phase 1 진입

---

## §10. 사용자 결재 항목 (Q1~Q10)

### Q1. HeroCarousel 처분 (갭 B)
- **A**. **B-4 — HeroCarousel 유지 + 시각만 시안 톤 정합 (Phase 2 안 / 운영 영향 최소)**
- B. B-1 — HeroBento 신규 도입 + HeroCarousel 폐기 (시안 100% 매핑 / 변경 大)
- C. B-2 — HeroBento + HeroCarousel 병행 (정보 중복)
- D. B-3 — HeroCarousel 유지 + HeroBento 미도입 (현재 상태 유지)
- 권장: **A**

### Q2. 사이드바 도입 시점 (갭 F)
- **A**. **Phase 3 도입 — 본문/사이드바 split + ProfileWidget + NotableOrgs + CommunityPulse**
- B. 단일 컬럼 유지 — 사이드바 미도입 (StatsStrip 본문 풀폭 보존)
- 권장: **A** (시안 100% 매핑 목표)

### Q3. NoticeCard 분리 (갭 D) 시점
- **A**. **Phase 1 — NoticeCard / HotPostsCard 2분할 (시각 임팩트 큼)**
- B. Phase 3로 미룸 (사이드바 도입 시 같이)
- C. 통합 CardPanel 유지 (분리 안함)
- 권장: **A**

### Q4. 카드 디자인 정합 (갭 G) 깊이
- **A**. **G-2 — RecommendedGames + RecommendedVideos 카드 보존 + 신규 카드만 추출 (TourneyMiniCard / TeamMiniCard)**
- B. G-1 — 4 카드 모두 시안 카피 (RecommendedGames + RecommendedVideos 카드 변경)
- C. 카드 정합 생략 (섹션 wire 만)
- 권장: **A** (5/9 부활 컴포넌트 보존)

### Q5. 신규 API (NotableOrgs)
- **A**. **신규 API `/api/web/organizations` 추가 (Phase 3)**
- B. NotableOrgs 시안 미반영 (사이드바 = ProfileWidget + CommunityPulse 만)
- C. 정적 mock 데이터 (운영 미연동 / 시각 매핑 만)
- 권장: **A** (단, schema.prisma `organization` 모델 검토 후 / 모델 부재 시 → C)

### Q6. ProfileWidget 컨셉 (갭 F-1)
- **A**. **시안 그대로 — 3 stat (승률/경기/평점) + 4 link (mygames/saved/messages/notifications)**
- B. 운영 `profile-widget.tsx` 컨셉 (XP/레벨/뱃지) + 시각만 시안 정합
- 권장: **A** (시안 우선)

### Q7. 진행 시점
- A. 즉시 (5/9 진행)
- **B**. **5/10 후 분배 (3 Phase 단계 진행 / 5/9 옵션 B + StatsStrip 검증 후)**
- C. PortOne 후 (다른 우선 작업 후 진행)
- 권장: **B**

### Q8. PR 분할 전략
- **A**. **§7 5 PR 분할 (Phase 1A/1D/1C/2/3)**
- B. 3 PR (Phase 별 1 PR 통합)
- C. 1 PR (대형 — 영향 평가 어려움)
- 권장: **A** (영향 평가 가능 + 롤백 용이)

### Q9. 본문 RecommendedRail 카드 추출 (현재 children 직접 패스 → 카드 추출)
- **A**. **Phase 3 G-2 — TourneyMiniCard / TeamMiniCard 만 추출 (RecommendedGames + RecommendedVideos 카드 보존)**
- B. Phase 1C 부터 추출 (PR3 라인 +50)
- 권장: **A** (5/9 부활 컴포넌트 영향 0)

### Q10. CommunityPulse 사이드바 도입 후 StatsStrip 본문 풀폭 처분
- **A**. **StatsStrip 본문 풀폭 폐기 (사이드바 CommunityPulse 로 통합 — 시안 정합)**
- B. 본문 풀폭 + 사이드바 양쪽 동시 표시 (정보 중복)
- C. 모바일 ≤900px 1열 stack 시 본문 풀폭 fallback
- 권장: **A** (시안 매핑) 또는 **C** (모바일 fallback 유지)

---

## §11. 권장 결재안 요약

| Q | 권장 |
|---|------|
| Q1 HeroCarousel | **A** (B-4 시각만 정합 / Phase 2) |
| Q2 사이드바 | **A** (Phase 3 도입) |
| Q3 NoticeCard 분리 | **A** (Phase 1 분리) |
| Q4 카드 정합 | **A** (G-2 신규만 추출) |
| Q5 NotableOrgs API | **A** (신규 API / schema 검토 후) |
| Q6 ProfileWidget | **A** (시안 그대로) |
| Q7 시점 | **B** (5/10 후 분배) |
| Q8 PR 분할 | **A** (5 PR) |
| Q9 카드 추출 | **A** (Phase 3 G-2) |
| Q10 StatsStrip 처분 | **A** (사이드바 통합 / 본문 풀폭 폐기) |

### 즉시 진행 가능 (사용자 결재 후)
- **Phase 1 P0** (3~4h) — HomeHeader + NoticeCard 분리 + 열린 대회 RecommendedRail
- 회귀 0 / 신규 API 0 / 시안 정합도 50% → 70%
- PR 3개 (PR1 + PR2 + PR3) 순차 또는 1 PR 통합

### 후속 (Phase 2 / Phase 3) — 별도 결재
- Phase 2 (3~4h) — 주목할 팀 + HeroCarousel 시각 정합
- Phase 3 (5~7h) — 사이드바 + 신규 API + 카드 시안 정합

---

## §12. 검토 깊이 (planner-architect 보장)

- ✅ `Dev/design/BDR-current/screens/Home.jsx` 전체 read (978L / 12 섹션 + RecommendedRail line 405 + 시안 카드 함수 정의 8종)
- ✅ 운영 `src/app/(web)/page.tsx` 전체 read (372L)
- ✅ `src/lib/services/home.ts` 전체 read (890L) — 9 prefetch 함수 매핑 가능 여부 검토
- ✅ `src/components/home/` 디렉토리 list (20 파일 / 4047L) — 미사용 자산 인지 (hero-bento/profile-widget/notable-teams 등)
- ✅ `src/components/bdr-v2/` 디렉토리 list (15 파일) — 시안 카피 도메인 인지 (recommended-rail / hero-carousel / card-panel 등)
- ✅ `recommended-rail.tsx` 전체 read (179L) — 5/9 옵션 B 박제 코드 검토
- ✅ recent commits 20건 — 5/9 옵션 B + StatsStrip 변경 이력 추적
- ✅ knowledge: CLAUDE.md / DESIGN.md / 디자인 13 룰 / 운영→시안 동기화 룰 5/7

---

## §13. 다음 단계

1. **사용자 Q1~Q10 결재**
2. 결재 후 → planner-architect Phase 1 P0 상세 설계서 작성 (구현 단계 분 + tester/reviewer 분리)
3. Phase 1 진행 → tester/reviewer 병렬 → PM 커밋 + 진행 현황표 갱신
4. Phase 1 완료 후 → 검증 + Phase 2 진행 결재
5. Phase 2 완료 후 → Phase 3 결재 (신규 API + 사이드바 + StatsStrip 처분)
