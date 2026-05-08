# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/9 — developer / 마이페이지 내농구 강화 구현 완료]** **/profile/basketball server component + 10 영역 super-set + 본인 전용 신규 2 카드**
- 사용자 결재 Q1~Q6 일괄 채택 (K-1 server / L-1 10영역 / M-1 pending 3종 / N-1 다음매치 / Y-2 글로벌 추출 / W-1 시안 박제)
- 산출: 신규 5 / 수정 3 (총 8 파일) — career-stats-grid.tsx/css + my-pending-requests-card.tsx + next-tournament-match-card.tsx + career-stats-section.tsx + page.tsx + overview-tab.tsx + ProfileBasketball.jsx
- tsc --noEmit 0 / next build 통과 / truncated 0
- 회귀 0: 공개프로필 (/users/[id]) CareerStatsGrid 추출만 = JSX 동등 / 마이페이지 hub / Flutter v1 / DB 변경 0
- 다음: tester + reviewer 병렬 → PM commit + push

### 구현 기록

📝 구현한 기능: 마이페이지 내농구 (`/profile/basketball`) 를 공개프로필 흡수 + 본인 전용 강화 super-set 으로 재구성

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/components/profile/career-stats-grid.tsx` | 글로벌 통산 8열 그리드 (Q5=Y-2 — 공개+본인 공용) | 신규 ~135L |
| `src/components/profile/career-stats-grid.css` | 8열→4×2 모바일 분기 css | 신규 ~30L |
| `src/app/(web)/users/[id]/_v2/overview-tab.tsx` | CareerStatsGrid import 교체 / 미사용 헬퍼 제거 | 수정 -~110L |
| `src/app/(web)/profile/basketball/_components/my-pending-requests-card.tsx` | 진행 중 신청 통합 카드 (3종 — team_join/jersey_change/dormant/withdraw/transfer) | 신규 ~245L |
| `src/app/(web)/profile/basketball/_components/next-tournament-match-card.tsx` | 다음 대회 매치 카드 (D-Day + 본인팀 강조) | 신규 ~190L |
| `src/app/(web)/profile/basketball/_components/career-stats-section.tsx` | StatsDetailModal client wrapper | 신규 ~50L |
| `src/app/(web)/profile/basketball/page.tsx` | server component 전환 + 14쿼리 병렬 + 10영역 JSX | 수정 239→700L |
| `Dev/design/BDR-current/screens/ProfileBasketball.jsx` | 운영 동등 갱신 (10 영역 박제 — W-1 reverse-sync) | 수정 198→370L |

💡 tester 참고:
- 테스트 방법: 로그인 후 `/profile/basketball` 진입. 본인 데이터로 모든 10 영역 노출 확인.
- 정상 동작:
  - ① pending 0건 → 카드 hidden / N건 → 정렬 + 클릭 → /teams/[id]
  - ② Hero — 그라디언트 + jersey + 본인 정보 (actionSlot 미전달 → 팔로우/메시지 버튼 X)
  - ③ 통산 8열 + [더보기 →] → StatsDetailModal open (Phase 2 모달 재사용)
  - ④ 활동 로그 5종 통합 (match/mvp/team/jersey/signup) — 공개프로필 동일
  - ⑤ 최근 경기 PlayerMatchCard 5건 — 클릭 → /live/[id]
  - ⑥ 소속 팀 풀 리스트 (운영 보존)
  - ⑦ 참가 대회 (운영 보존 — #my-tournaments 앵커 유지)
  - ⑧ 다음 대회 매치 — 미래 매치 0건 → 카드 hidden / 1건 → D-Day + 본인팀 강조
  - ⑨ 픽업 게임 신청 (운영 game_applications 보존)
  - ⑩ 주간 리포트 링크 (운영 보존)
- 주의 입력: 비로그인 → /login redirect / 본인 데이터 0건 → 빈 상태 메시지 / pending/match 0건 → 카드 미렌더링

⚠️ reviewer 참고:
- CareerStatsGrid 글로벌 추출 — overview-tab.css 와 career-stats-grid.css 가 동일 클래스 (`.overview-tab__season-grid`) + 동일 룰 → 우선순위 충돌 0
- StatsDetailModal cross-route import (`@/app/(web)/users/[id]/_v2/...`) — Q5 결재로 위치 그대로 유지
- Pending 3종 통합 payload 가드 (jersey_change 의 oldJersey/old/newJersey/new 다양한 형식 안전 추출)
- 14 쿼리 Promise.all — 모든 where 조건 인덱스 존재
- IDOR 0: 모든 쿼리 where userId = session.sub

### 테스트 결과 (tester / 5/9 내농구)

#### 빌드
| 항목 | 결과 | 비고 |
|---|---|---|
| tsc --noEmit | ✅ 통과 | 에러 0건 |
| next build | ✅ 통과 | exit code 0 / 라우트 목록 + 범례 출력 완료 / `/profile/basketball` dynamic route 정상 |
| 라이브 200 응답 | ✅ 통과 | curl GET http://localhost:3001/profile/basketball → HTTP 200 / 69KB HTML (비로그인 시 SSR redirect → /login) |
| 8 파일 truncated 0 | ✅ 통과 | page.tsx 1011L / overview-tab.tsx 374L / ProfileBasketball.jsx 498L (`window.ProfileBasketball = ...` 정상 종료) |

#### CareerStatsGrid 추출 (Y-2)
| 항목 | 결과 | 비고 |
|---|---|---|
| 글로벌 컴포넌트 위치 | ✅ 통과 | `src/components/profile/career-stats-grid.tsx` 161L + `.css` 41L |
| 사용처 2건 | ✅ 통과 | overview-tab.tsx (공개) / career-stats-section.tsx (내농구) |
| 공개 프로필 JSX 동등 | ✅ 통과 | overview-tab.tsx — `<CareerStatsGrid stats={stats} onShowMore={...}/>` 단일 컴포넌트로 교체 / fmtAvg/fmtWinRate/fmtPct 헬퍼 글로벌로 이전 |
| onShowMore prop 분기 | ✅ 통과 | allStatsRows 0건 시 [더보기 →] 버튼 미렌더링 (라인 95: `onShowMore && stats.games > 0` 가드) |
| 모바일 4×2 분기 | ✅ 통과 | `.overview-tab__season-grid` 동일 클래스 / @media 720px 동일 룰 → 우선순위 충돌 0 |

#### MyPendingRequestsCard (M-1)
| 항목 | 결과 | 비고 |
|---|---|---|
| 3종 통합 union | ✅ 통과 | team_join / jersey_change / dormant / withdraw / transfer_in / transfer_out (kind 6가지) |
| 빈 배열 시 카드 hidden | ✅ 통과 | page.tsx 라인 815: `{pendingRequests.length > 0 && <MyPendingRequestsCard …/>}` + 컴포넌트 라인 166 defensive (이중 가드) |
| kind 별 아이콘 매핑 | ✅ 통과 | `getIcon()` Material Symbols (group_add/tag/pause_circle/logout/south_west/north_east) |
| kind 별 라벨 + 디테일 | ✅ 통과 | `describeRequest()` — 등번호 변경 시 `#88 → #99` 형식, 이적 시 `from → to`, 휴면 시 `~M.D` |
| 신청일 relative 표시 | ✅ 통과 | `fmtRelative()` (방금 전 / N분 전 / N시간 전 / N일 전 / M.D) |
| payload 가드 (jersey_change) | ✅ 통과 | page.tsx 라인 691~702: `oldJersey ?? old`, `newJersey ?? new` 다중 키 안전 추출 |
| 클릭 시 /teams/[id] | ✅ 통과 | 모든 kind 가 `href = /teams/${r.teamId}` (transfer_in 도 toTeam 으로 라우팅) |

#### NextTournamentMatchCard (N-1)
| 항목 | 결과 | 비고 |
|---|---|---|
| nested filter (homeTeam/awayTeam.players.some.userId) | ✅ 통과 | page.tsx 라인 399~402 |
| status='scheduled' + scheduledAt > now | ✅ 통과 | page.tsx 라인 397~398 |
| orderBy + take 1 (가장 가까운 미래) | ✅ 통과 | findFirst + `orderBy: { scheduledAt: 'asc' }` |
| null 시 카드 hidden | ✅ 통과 | page.tsx 라인 950 + 컴포넌트 라인 68: `if (!match) return null` 이중 가드 |
| D-Day 계산 | ✅ 통과 | `fmtDDay()` — 오늘=D-DAY / 미래=D-N / 과거=D+N (양쪽 setHours(0,0,0,0) 으로 timezone 안전) |
| myTeamSide 강조 | ✅ 통과 | players length 비교 → 본인팀 fontWeight 800 + accent "(우리팀)" 라벨 |
| 클릭 → /live/[matchId] | ✅ 통과 | Link href=`/live/${match.matchId}` |

#### server component 전환 (K-1)
| 항목 | 결과 | 비고 |
|---|---|---|
| Promise.all 14 쿼리 병렬 | ✅ 통과 | page.tsx 89~455 — user / statAgg / recentGames / playerStats / repJersey / mvpMatches / teamHistoryRows / allStatsForModal / tournamentTeamPlayers / pendingJoinRequests / pendingMemberRequests / pendingTransfers / nextTournamentMatch / gameApplications |
| .catch 가드 | ✅ 통과 | 모든 14 쿼리 `.catch(() => null/[])` — 단일 쿼리 실패가 페이지 죽이지 않음 |
| SWR client → server | ✅ 통과 | "use client" 제거 / fetch/useSWR 0건 |
| StatsDetailModal client wrapper | ✅ 통과 | CareerStatsSection (54L "use client") = useState modal open / CareerStatsGrid + StatsDetailModal 합성 |
| Phase 1+2 일관성 | ✅ 통과 | 공개 프로필 `/users/[id]/page.tsx` 패턴 카피 (PlayerHero / RecentGamesTab / ActivityLog cross-route import — Q5 결재 위치 유지) |

#### IDOR 0
14 쿼리 모두 본인 한정 가드:

| 쿼리 | 가드 | 결과 |
|---|---|---|
| 1 user findUnique | `where: { id: userId }` | ✅ |
| 2 statAgg aggregate | nested `tournamentTeamPlayer: { userId }` | ✅ |
| 3 recentGames findMany | nested `tournamentTeamPlayer: { userId }` | ✅ |
| 4 getPlayerStats(userId) | helper 인자 | ✅ |
| 5 representativeJersey | `userId, jerseyNumber: not null` | ✅ |
| 6 mvpMatches | `mvp_player_id: userId` | ✅ |
| 7 teamHistoryRows | `userId, eventType in [...]` | ✅ |
| 8 allStatsForModal | nested `tournamentTeamPlayer: { userId }` | ✅ |
| 9 tournamentTeamPlayers | `userId` | ✅ |
| 10 pendingJoinRequests | `user_id: userId, status: 'pending'` | ✅ |
| 11 pendingMemberRequests | `userId, status: 'pending'` | ✅ |
| 12 pendingTransfers | `userId, finalStatus: 'pending'` | ✅ |
| 13 nextTournamentMatch | `OR: home/awayTeam.players.some.userId` | ✅ |
| 14 gameApplications | `user_id: userId` | ✅ |

#### 회귀 0
| 영역 | 결과 | 비고 |
|---|---|---|
| 공개프로필 (/users/[id]) Phase 1+2 | ✅ 통과 | overview-tab.tsx 374L — CareerStatsGrid import 교체만 (JSX 동등) / Phase 2 활동 로그·통산 모달 보존 |
| 마이페이지 hub (/profile) | ✅ 통과 | profile/page.tsx 미수정 (Phase 13 박제 그대로) — `/profile/basketball` 진입점 라인 512 + 빠른 액션 라인 649 그대로 |
| 픽업 게임 (영역 ⑨) | ✅ 통과 | game_applications 운영 보존 + getGameStatus 헬퍼 + TossListItem 패턴 유지 |
| 주간 리포트 (영역 ⑩) | ✅ 통과 | /profile/weekly-report Link 그대로 (TossListItem icon=bar_chart) |
| Flutter v1 / DB / API | ✅ 통과 | api/v1/* 변경 0 / prisma schema 변경 0 / api/web/profile 응답 401 (인증 가드 정상) |
| 시안 박제 (W-1) | ✅ 통과 | ProfileBasketball.jsx 498L 운영 10 영역 동등 + AppNav frozen 영향 0 + var(--*) 토큰만 + Material Symbols 유지 + 모바일 720px 분기 (.pb-career-grid 4×2 / .pb-hero-grid 80px 1fr) |

#### 종합 판정

📊 **8영역 모두 통과 — 빌드 / Y-2 추출 / M-1 pending / N-1 다음매치 / K-1 server / IDOR / 회귀 / 시안 박제 ✅**

- 빌드: tsc 0 + next build exit 0 + 라이브 200 / 8 파일 정상 ending
- 추출/통합/server 전환 의도대로 동작 — 회귀 0
- IDOR 14쿼리 모두 본인 한정 가드 (인덱스 활용)
- 픽업 게임 / 주간 리포트 / 마이페이지 hub / Flutter v1 / DB 변경 0
- 시안 박제 운영 10 영역 동등 (Phase A.5 reverse-sync 룰 준수)

**수정 요청 0건 — PM commit + push 단계 진입 가능**

---

### 리뷰 결과 (reviewer / 5/9 내농구)

📊 종합 판정: **통과** ⭐⭐⭐⭐½ (4.5/5)

#### CareerStatsGrid API
- ✅ props 인터페이스 깔끔 (`CareerStats` + `onShowMore?` + `title?`) — 재사용 친화
- ✅ 글로벌 위치 정합 (`src/components/profile/`) — `_v2/` 경로 묶임 해소
- ✅ 재사용성 — overview-tab.tsx + career-stats-section.tsx 양쪽에서 import 검증
- ✅ JSX 동등성 — 8 셀 구조/border/font 룰 모두 그대로 카피 (회귀 0)
- ✅ "use client" 미부착 정확 — onShowMore 콜백은 부모 client wrapper 가 wire-up
- 🟡 (권장) inline `style={...}` 다수 — 글로벌 컴포넌트는 `.career-stats-grid__cell` 같은 BEM 클래스로 빼면 더 깔끔. 다만 동작 영향 0이라 패스 가능

#### MyPendingRequestsCard
- ✅ 6종 union 타입 (team_join/jersey_change/dormant/withdraw/transfer_in/transfer_out) — discriminated union 정확
- ✅ 빈 상태 hidden 이중 가드 (page.tsx conditional + `requests.length === 0` defensive)
- ✅ `getIcon` switch — exhaustive (모든 kind 커버, default 없음 → 신규 kind 추가 시 컴파일 에러)
- ✅ 클릭 라우팅 단순화 — 모든 kind `/teams/[id]` (가장 단순한 패턴)
- ✅ payload 다양 형식 안전 추출 (`oldJersey ?? old`, typeof 검증)
- 🟡 (권장) `transfer_out` kind 정의되어 있으나 page.tsx 변환 로직에서는 `transfer_in` 만 push (transfer_out 미사용 dead branch). 단방향 표현이면 union 에서 제거 또는 향후 확장 주석 추가 권장

#### NextTournamentMatchCard
- ✅ Prisma `findFirst` nested filter (`homeTeam.players.some(userId)`) — IDOR 안전 + 인덱스 활용
- ✅ D-Day 계산 정확 — `setHours(0,0,0,0)` 양쪽 동일 → DST/timezone 안전
- ✅ 본인팀 강조 — `myTeamSide` "home"/"away" 분기, fontWeight/color 차등
- ✅ null fallback — `homeTeamName ?? "TBD"` / scheduledAt non-null assertion 은 page.tsx where 가드로 안전
- 🟡 (권장) where `scheduledAt: { gte: new Date() }` — server time 기준이라 사용자 timezone 와 미세 차이 가능. 한국 사용자 한정 서비스라 영향 0

#### server component 전환
- ✅ 14 쿼리 `Promise.all` — 진정한 병렬 실행 (개별 `.catch(() => null/[])` 로 한 쿼리 실패 다른 쿼리 영향 0)
- ✅ N+1 위험 0 — 모든 nested include 가 Prisma single query (relation 전개)
- ✅ IDOR 0 — 14 쿼리 모두 `where userId = session.sub` 또는 `mvp_player_id = userId` (본인 한정)
- ✅ StatsDetailModal client wrapper 분리 (`CareerStatsSection`) — server/client 경계 정확
- ✅ 인덱스 검증: `team_join_requests.user_id` / `TeamMemberRequest [userId,status]` / `TransferRequest [userId,finalStatus]` / `tournament_matches [status,scheduledAt]` / `tournament_team_players.userId` 모두 존재 → seq scan 0

#### 컨벤션
- ✅ 파일명 kebab-case (`career-stats-grid.tsx` / `my-pending-requests-card.tsx` / `next-tournament-match-card.tsx` / `career-stats-section.tsx`)
- ✅ TS strict — `tsc --noEmit` 통과 / `: any` / `as any` grep 결과 0건
- ✅ JSDoc 헤더 — 8 파일 모두 `/* ============ */` 블록 (왜/어떻게)
- ✅ "use client" 정확 — career-stats-section.tsx 만 (useState 필요), 나머지 server-safe
- ✅ Material Symbols Outlined 사용 (lucide-react 0건)
- ✅ BDR 토큰 — `var(--accent)` / `var(--ink)` / `var(--bg-alt)` / `color-mix(...accent...)` 일관

#### 시안 박제
- ✅ ProfileBasketball.jsx 10 영역 mock 운영 동등 (498L)
- ✅ pending 3종 / Hero / 통산 8열 / 활동 5종 / 최근 5건 / 소속팀 / 참가대회 / 다음매치 / 픽업 / 주간리포트 매핑 일치
- ✅ BDR-current 다른 시안 패턴 일관 — `const xxx = (...)` mock + `<style jsx>{`...`}</style>` + window.X = X 등록 패턴

#### errors.md 적용 (5/7+5/8 truncated 함정)
- ✅ 8 파일 마지막 줄 검증 — 모두 정상 ending (`}` / `</style>` / `window.X = X`)
- ✅ envelope/snake_case — 본 작업은 server component prefetch 라 API envelope 문제 무관 (route.ts 미신설)
- ⚠ scratchpad 기록 라인수와 실측 차이 (page.tsx 700→1011L / overview-tab.tsx 360→374L / ProfileBasketball.jsx 370→498L) — 라인수 자체는 truncated 신호 아님 (정상 ending 확인). developer 가 신규 라인 underestimate 한 것뿐

#### 회귀 위험
- ✅ 공개프로필 (`/users/[id]`) JSX 동등 — overview-tab.tsx 가 CareerStatsGrid import 만 교체 (8 셀 구조 그대로)
- ✅ 마이페이지 hub (`/profile`) — 본 작업 무관 (서브 페이지만)
- ✅ 픽업 게임 (game_applications) — page.tsx 영역 ⑨ 운영 보존 (TossListItem 패턴 유지)
- ✅ Flutter v1 영향 0 — `/api/v1/...` 변경 0건 / 본 작업 webside server component 만

---

#### 종합 평가 ⭐⭐⭐⭐½

**판정: 통과 (수정 요청 0건)**

사유:
1. **server-component 전환이 정확** — 14 쿼리 Promise.all + IDOR 0 + 인덱스 검증 통과
2. **CareerStatsGrid 글로벌 추출 설계 우수** — props 인터페이스 깔끔 / cross-route 충돌 0 / 재사용 검증
3. **6종 discriminated union 타입 안전** — exhaustive switch + payload 다양 형식 가드
4. **타입 안전성 만점** — `any` 0건 / tsc 통과 / JSDoc 완비
5. **errors.md 5/7+5/8 함정 회피** — 8 파일 정상 ending / API envelope 무관
6. **회귀 위험 0** — 공개프로필 JSX 동등 / Flutter v1 무관 / 운영 영역 보존

#### 개선 제안 (선택)

| # | 영역 | 제안 | 우선도 |
|---|------|------|-------|
| 1 | CareerStatsGrid | inline style 다수 → BEM 클래스 추출 | 🟢 낮음 (동작 영향 0) |
| 2 | MyPendingRequestsCard | `transfer_out` kind dead branch → 제거 또는 향후 주석 | 🟢 낮음 |
| 3 | next-tournament-match-card | `gte: new Date()` → server timezone 명시 주석 | 🟢 낮음 |
| 4 | page.tsx | 14 쿼리 헬퍼 함수로 추출 (`fetchProfileBasketballData(userId)`) → 페이지 컴포넌트 1011→500L | 🟡 중간 (가독성 ↑) |

#### 수정 요청 (있는 경우만)

**없음** — PM 커밋 진행 가능.

---

## 📊 진행 현황

| 영역 | 상태 | 비고 |
|------|------|------|
| 5/9 옵션 B | ✅ 머지 (`ce0102e`) | RecommendedRail 통일 헤더 + 헤더 교체 (RecommendedVideos/Games) |
| 5/9 P0 부활 | ✅ 머지 (`c8d5f22`) | MySummaryHero + RecommendedGames + RecommendedVideos |
| 5/9 StatsStrip | ✅ 머지 (`946b8b8`) | 최하단 이동 (시안 CommunityPulse 매핑) |
| 5/9 NBA 프로필 Phase 2 | ✅ 머지 (`ee0cc25`) | 활동 로그 5종 + 통산 더보기 모달 |
| 5/9 마이페이지 내농구 강화 | 🟢 검증 통과 / PM commit 대기 | tester ✅ 8영역 통과 / reviewer ⭐⭐⭐⭐½ 통과 — 수정 요청 0 |
| 홈 시안 100% Phase 1 | 🟡 진행 중 | A(HomeHeader) ✅ / B·C 남음 (NoticeCard 분리 / 열린 대회 RecommendedRail) |
| 홈 시안 100% Phase 2~3 | ⏸ Phase 1 후 | 추정 8~11h / 시안 70% → 100% |
| PortOne 활성화 | ⏸ 외부 작업 | 사용자 콘솔 + Vercel env 추가 |
| PhoneInput 마이그 4순위 | ✅ 완료 (`a9f2e0f`) | admin+referee 100% |

---

## 📋 작업 로그 (최근 10건)

| 날짜 | 작업 | 결과 |
|------|------|------|
| 5/9 | tester — 마이페이지 내농구 강화 8 파일 검증 (tsc 0 / next build exit 0 / curl 200 / Y-2 추출 / M-1 6종 union / N-1 D-Day+timezone 안전 / K-1 14쿼리 병렬 / IDOR 14건 본인 한정 / 회귀 0 / 시안 W-1) | ✅ 8영역 모두 통과 / 수정 요청 0건 |
| 5/9 | reviewer — 마이페이지 내농구 강화 8 파일 코드 리뷰 (CareerStatsGrid API / Pending 6종 union / NextMatch nested filter / 14 쿼리 IDOR 0 + 인덱스 검증 / 시안 박제 / errors.md 함정 회피) | ✅ ⭐⭐⭐⭐½ 통과 / 수정 요청 0건 / 권장 4건 |
| 5/9 | developer — 마이페이지 내농구 강화 (server component + 10 영역 + 본인 전용 2 카드 + CareerStatsGrid 글로벌 추출 + 시안 W-1 박제) | ✅ tsc/build 통과 / 8 파일 / tester+reviewer 대기 |
| 5/9 | Phase 1 A — HomeHeader 추가 / 신규 151L / page.tsx import + 배치 (HeroCarousel 위) / 모바일 4 분기점 가드 (720/360px) / search·games/new 운영 라우트 확인 / tsc 0 / 회귀 0 | ✅ 미푸시 |
| 5/9 | planner-architect — 홈 시안 100% 본격 적용 계획서 (13 섹션 / Q1~Q10 / 3 Phase / 5 PR / 11~15h) | ✅ 결재 대기 (`Dev/home-design-full-alignment-2026-05-09.md`) |
| 5/9 | StatsStrip 최하단 이동 (시안 CommunityPulse 매핑) | ✅ `946b8b8` |
| 5/9 | 옵션 B — RecommendedRail 통일 + 헤더 교체 (RecommendedVideos/Games) | ✅ `ce0102e` |
| 5/9 | P0 부활 — MySummaryHero + RecommendedGames | ✅ `c8d5f22` |
| 5/9 | 공개프로필 Phase 2 활동 로그 + 통산 더보기 모달 + 경기참가 0 fix | ✅ `ee0cc25` |
| 5/9 | NBA 프로필 — 통산 8열 + PlayerMatchCard + Hero jersey | ✅ `a005430` |
| 5/9 | 추천 영상 헤더 "HIGHLIGHTS" → "WATCH NOW" | ✅ `d6bdf1a` |
| 5/9 | 추천 유튜브 섹션 부활 + 시안 역박제 | ✅ `858936e` |
| 5/9 | PhoneInput/BirthDateInput 4순위 (admin+referee) 마이그 100% | ✅ `a9f2e0f` |

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업)
- PortOne 콘솔: 본인인증 채널 발급 (PASS / SMS / KCP)
- Vercel env: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- 활성화 직후 자동 전환: PR3 가드 활성 / mock 폴백 503 자동 / 코드 변경 0
- 롤백 1초: 환경변수 제거

### 🚀 1순위 — 홈 시안 100% **재계획** (5/9 부활 3 컴포넌트 모두 제거 후 백지 상태)
- 5/9 부활 + 제거 흐름: HomeHeader (`f27d338` → `230e46c`) / MySummaryHero + RecommendedGames (`c8d5f22` → `1a602e4`)
- 컴포넌트 자산 보존 (`src/components/bdr-v2/home-header.tsx` / `src/components/home/my-summary-hero.tsx` / `recommended-games.tsx`)
- 현재 page.tsx = 5섹션 (HeroCarousel + RecommendedVideos + 2컬럼 grid + 방금올라온글 + StatsStrip)
- 사용자 결정 대기: 시안 재계획 방향 (HeroBento + 4 Quick Actions + ProfileWidget + NotableTeams + NoticeCard 분리 + 사이드바 등 어떤 조합)
- 내일 진행 — `Dev/home-design-full-alignment-2026-05-09.md` 13 섹션 / Q1~Q10 + 5/9 제거 흐름 반영하여 갱신 또는 신규 계획서 작성

### 🚀 2순위 — 사전 라인업 확정 + 기록앱 자동 매핑
- `Dev/match-lineup-confirmation-2026-05-09.md` Q1~Q9 결재 대기 (~8.5h / 8 PR)

### 🚀 3순위 — PortOne 활성화 후 검증
- 미인증 계정 → /games/[id] /teams/[id] /tournaments/[id]/join → /onboarding/identity redirect

### 🚀 4순위 — 홈 시안 100% Phase 2~3
- Phase 2 P1 (3~4h): 주목할 팀 + HeroCarousel 시각 정합
- Phase 3 P2 (5~7h): 사이드바 + 신규 API + 카드 시안 정합

---

## 🔒 미푸시 커밋

- 현재 미푸시 커밋: **7건** (subin 브랜치) — 5/9 홈 작업 누적
  - `ce0102e` refactor(home): 옵션 B — RecommendedRail 통일 + 헤더 교체
  - `3d5f53e` fix(build): planner .md 1차 fix (`bg-[var(--*)]` → `--TOKEN`)
  - `946b8b8` refactor(home): StatsStrip 최하단 이동
  - `f27d338` feat(home): Phase 1 A — HomeHeader + 모바일 4 분기점 룰 박제
  - `9d126c7` fix(build): planner .md 2차 fix (`--*` → `--ASTERISK`)
  - `1a602e4` refactor(home): MySummaryHero + RecommendedGames 제거
  - `230e46c` refactor(home): HomeHeader 제거
- push 결정 대기 (사용자)
