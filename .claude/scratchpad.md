# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22 재정의)

> 일반 모드 / 카페 모드 분리 — 기존 룰 그대로

- **일반 모드**: mybdr 본 프로젝트 작업 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 쇼핑몰 작업 (`scratchpad-cafe-sync.md` 별도)
- 두 세션은 컨텍스트/지식/커밋이 섞이지 않도록 분리

## 🚧 추후 구현 목록 (DB/API 확장 필요)

> Phase 10 적용으로 일부 해결됨

**해결됨 ✅**
- 경기 평가/신고
- 게스트 지원
- 팀 팔로우
- 온보딩 데이터

**미해결 ⏳**
- 슛존 성공률 (heatmap) — A-2 ghost (phase-9-future-features.md #12)
- 스카우팅 리포트 — A-2 ghost (#13)
- 프로필 시즌 통계 탭 — A-2 ghost (#11), season_stats 집계 테이블 필요
- 프로필 VS 나 비교 — A-2 ghost (#14)
- 커뮤니티 댓글 답글 — A-4 ghost (#15), parent_id DB 있음 + UI/action 미연결
- 커뮤니티 댓글 좋아요 — A-4 ghost (#16), action 함수만 있고 UI 미연결
- 커뮤니티 게시글 북마크 — bookmarks 테이블 미구현 (#5)
- waitlist (대기열)
- no-show 처리
- QR 티켓 발급/검증
- 기타 박제 시안 중 데이터 패칭이 필요한 항목들

**해결됨 추가 ✅ (2026-04-29 P0-A)**
- /teams v2 지역/정렬 chip-bar 재구현 (A-1)
- /teams/[id] 부팀장·매니저 manage 진입점 — captainId 매칭 보강 (A-3)
- /notifications actionUrl 클릭 시 자동 read 처리 (A-5)

## 현재 작업

- **요청**: Phase 12 통합 계획서 (시즌 통계 + Portone 본인인증 + 프로필 디버깅)
- **상태**: planner-architect 완료 — `Dev/design/phase-12-plan-2026-04-30.md` 작성
- **현재 담당**: PM 결정 7건 대기 (Q1~Q7) → 옵션 확정 시 developer 착수
- **브랜치**: subin

### 기획설계 (Phase 12)

🎯 목표: 시즌 통계 DB + Portone 본인인증을 단일 마이그레이션으로 통합 (옵션 12-B 추천, 10h)

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| prisma/schema.prisma | 신규 모델 3 + User 컬럼 5 | 수정 |
| prisma/migrations/manual/phase_12_combined.sql | 통합 마이그 SQL (멱등) | 신규 |
| src/app/api/web/identity/verify/route.ts | Portone 검증 + DB 저장 | 신규 |
| src/app/api/web/profile/season-stats/route.ts | 시즌 통계 fetch | 신규 |
| src/lib/identity/portone-client.ts | Portone API Secret 래퍼 | 신규 |
| src/components/identity/verify-button.tsx | JS SDK 위젯 | 신규 |
| src/app/(web)/profile/growth/page.tsx | 더미 → 실데이터 | 수정 |

🔗 기존 코드 연결:
- ProfileGrowth(P1-1 박제) `isDummy:true` 4건 → season_stats fetch 후 `isDummy:false` 전환
- /profile/edit name 필드 → verify-button 삽입, name_verified=true면 readonly + 배지
- .env에 `PORTONE_API_SECRET` + `PORTONE_CHANNEL_KEY` 2개 추가 (NEXT_PUBLIC_ 금지)

📋 실행 계획 (옵션 12-B):
| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| 12-1 | Prisma schema 신규 테이블 3 + User 컬럼 5 | developer | 없음 |
| 12-2 | dev DB push + 운영 SQL 작성 | developer | 12-1 |
| 12-3 | API 라우트 2종 (identity/verify + season-stats) | developer | 12-2 |
| 12-4 | ProfileGrowth 더미→실데이터 (병렬 가능) | developer | 12-3 |
| 12-5 | Portone JS SDK + 인증 버튼 (병렬 가능) | developer | 12-3 |
| 12-6 | Portone 가입 + 키 발급 | **사용자** | 12-5 |
| 12-7 | 실제 본인인증 테스트 | developer + 사용자 | 12-6 |
| 12-8 | 운영 DB SQL 적용 | **사용자** | 12-7 (1주 안정화) |
| 12-9 | 운영 배포 + 검증 | pm | 12-8 |

⚠️ developer 주의사항:
- prisma schema 변경 후 **dev 서버 재시작 필수** (errors.md 04-29 — Unknown argument 캐싱 함정)
- Portone API Secret은 서버 사이드만, 클라가 보낸 verified_name 절대 신뢰 X (서버가 Portone 재조회)
- name_verified=true 후 PATCH 차단 (재인증은 별도 API)
- 운영 DB SQL은 **트랜잭션 + IF NOT EXISTS 멱등**, 04-15 db push 사고 재방지
- PR 3개 분리 (PR1=schema / PR2=시즌통계 / PR3=Portone) — revert 안전

### 구현 기록 (v2.3 마이페이지 hub 박제 — `/profile` Profile.jsx 1:1)

📝 구현 내용: v2.3 시안 `Dev/design/BDR v2.3/screens/Profile.jsx` 1:1 박제. 좌 320 sticky aside (HeroCard / TeamSideCard / BadgesSideCard) + 우 1fr (SeasonStats / UpcomingGames / ActivityTimeline) 그리드 보존. v2.2 박제와의 갭 5건 정합 — UpcomingGames 1건→3건 / SeasonStats 6열 모바일 분기 / HeroCard 등번호 / TeamSideCard W/L / 인증완료 name_verified 우선. API/data fetch 0 변경 (select 컬럼 추가만).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/profile/page.tsx | (1) user select +name_verified (Phase 12 컬럼) (2) teamMember select 모드 변환 + jerseyNumber/team.wins/losses/draws (3) game_applications findFirst→findMany take:3 (4) primaryTeamMember.jerseyNumber 으로 jerseyNumber 변수 도출 (5) primaryTeam wins/losses/draws 0 폴백 (6) nextGames 배열 변환 — status:Int(0=pending/1=approved) 보존 (7) HeroCard prop +jerseyNumber / UpcomingGames prop game→games 배열 / 변수명 nextGameApp→nextGameApps | 수정 |
| src/app/(web)/profile/_v2/hero-card.tsx | (1) HeroCardUser interface +jerseyNumber:number\|null (2) 메타 1줄 v2.3 시안 정합 — "팀 · 포지션 · #N" (지역 제외) (3) 메타 2줄 — 지역 + 성별 + ★ rating · join (4) flexWrap 추가로 모바일 줄바꿈 안전 | 수정 |
| src/app/(web)/profile/_v2/team-side-card.tsx | (1) TeamSideItem interface +wins/losses/draws:number (2) "외 N팀" 메타 → "12W 5L · 외 N팀" 정합. 0/0 이면 전적 생략 | 수정 |
| src/app/(web)/profile/_v2/upcoming-games.tsx | (1) UpcomingGame interface scheduledAt non-null + status:number\|null (2) UpcomingGamesProps game:single → games:array (3) 본체 — flex-column gap:10 list 렌더 + .upcoming-row className 추가 (모바일 분기용) (4) badgeFor() 헬퍼 — status===1 "참가확정" / 0 "신청중" / 그 외 D-N 폴백 | 수정 |
| src/app/(web)/profile/_v2/season-stats.tsx | (1) 6열 grid 컨테이너 +.season-stats-grid className (2) 셀 +.season-stats-cell + data-cell-index 속성 (모바일 분기 selector 용) | 수정 |
| src/app/globals.css | 720px @media block 내 Profile v2.3 룰 3종 추가: (1) .season-stats-grid → repeat(3,1fr) + cell-index 3/4/5 borderTop + 3 borderLeft:0 (2) .upcoming-row → 1fr/auto grid + grid-template-areas "date status / body body" + nth-child(1)/(2)/(3) area 매핑 | 수정 |

🔧 핵심 패턴:
- **API/data fetch 0 변경** — select 컬럼만 확장 (Team.wins/losses/draws + TeamMember.jerseyNumber + User.name_verified). 새 fetch 0건.
- **status: Int (game_applications)** — DB schema.prisma L1290 확인. 0=pending, 1=approved, 2=rejected, 3=cancelled (기존 my-games/page.tsx 동일 패턴)
- **인증 컬럼 폴백 체인**: name_verified (Phase 12) || profile_completed (legacy) — Phase 12 SQL 적용 안 된 환경 보호
- **모바일 분기 룰 13 충족** — 인라인 grid `repeat(6,1fr)` + `72px/1fr/auto` 두 곳 모두 720px 분기 추가

💡 tester 참고:
- 테스트 방법: `/profile` 진입 → 데스크톱 1280px 좌 320 + 우 1fr 2열 / 모바일 720px 이하 1열 stack 검증
- 정상 동작: (1) 메타 "팀 · 포지션 · #N" 표시 (등번호 없으면 "팀 · 포지션") (2) SeasonStats 데스크톱 6열 / 모바일 3열 2행 + 사이 horizontal border (3) UpcomingGames 최대 3건, 신청 상태별 badge (참가확정 녹색/신청중 soft) (4) TeamSideCard "12W 5L" 표시 (전적 0/0 면 생략, 외 N팀만 표시)
- 주의할 입력: (a) name_verified 컬럼 미적용 운영 DB → profile_completed fallback (b) 등번호 미등록 멤버 → "#N" 생략 (c) game_applications.status 코드 미존재 → D-N 폴백
- viewport 4종: 366 / 390 / 768 / 1280 가로 overflow 0 검증

⚠️ reviewer 참고:
- TeamMember select 모드 전환 — 기존 include 모드를 select로 명시화하여 불필요 컬럼 차단 (createdAt/updatedAt 제외)
- BigInt → string 직렬화 보존: primaryTeamMember.team.id.toString()
- next/image 도메인 변경 0 — TeamSideCard logoUrl/HeroCard profile_image_url 기존 도메인 그대로
- 720px 미디어 쿼리 내 룰 3종 — `.profile-grid` `.profile-aside` 하단에 추가하여 기존 룰 충돌 0
- 박제 룰 자체 검수: var(--*) 토큰만 / Material Symbols person_off 1종 (lucide 0) / radius 4-6-8 / 720 분기 / repeat(N,1fr) 분기 필수 ✅

📦 다음 액션 (후속, 본 작업 외):
- v2.3 P1: /profile/edit / /profile/settings / /profile/billing / /profile/activity (각 1~1.5h)
- v2.3 P2: 다른 변경 시안 61건 미세 동기화

## 진행 현황표

| 영역 | 작업 | 상태 |
|------|------|------|
| 디자인 시안 박제 (Phase 9) | 31% (32/117) | ⏳ |
| Phase 10 운영 DB | 4 테이블 적용 | ✅ |
| Hero 카로셀 | 3슬라이드 + fallback | ✅ |
| 헤더 구조 정리 | 더보기 가짜 4건 제거 | ✅ |
| 모바일 최적화 (P1~P5) | board separator + input 16px + btn 44px + card min-h | ✅ |
| BDR v2.1 모바일 이식 P0-1 | G-1~G-9 7커밋 (+178줄) | ✅ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-05-01 | (미커밋, subin) | **v2.3 마이페이지 hub 박제 — `/profile` Profile.jsx 1:1** (developer): 시안 `Dev/design/BDR v2.3/screens/Profile.jsx` 박제. 좌 320 sticky aside + 우 1fr grid는 v2.2 박제로 이미 적용 — 갭 5건 정합. (1) `page.tsx` user select +name_verified(Phase 12 컬럼) / teamMember select 모드로 변환 + jerseyNumber + team.wins/losses/draws / game_applications findFirst→findMany take:3 / primaryTeam wins/losses/draws + jerseyNumber 변환 / nextGames 배열 변환(status:Int 0/1 보존) / HeroCard prop +jerseyNumber, UpcomingGames prop game→games 배열. (2) `_v2/hero-card.tsx` HeroCardUser +jerseyNumber, 메타 1줄 v2.3 정합 "팀 · 포지션 · #N", 메타 2줄 지역+성별+★, flexWrap 모바일 안전. (3) `_v2/team-side-card.tsx` +wins/losses/draws, "12W 5L · 외 N팀" 표시(0/0 면 전적 생략). (4) `_v2/upcoming-games.tsx` UpcomingGame.status:number\|null + scheduledAt non-null, props game→games 배열, 본체 flex-column gap:10 list, badgeFor() 헬퍼(1=참가확정/0=신청중/그 외 D-N), .upcoming-row className 추가. (5) `_v2/season-stats.tsx` 컨테이너 .season-stats-grid + 셀 .season-stats-cell + data-cell-index. (6) `globals.css` 720 미디어 내 룰 3종 추가 — .season-stats-grid repeat(3,1fr) + cell 3/4/5 borderTop + 3 borderLeft:0, .upcoming-row 1fr/auto + grid-template-areas 재배치. **API/data fetch 0 변경** (select 컬럼 추가만). 인증 컬럼 폴백 체인: name_verified \|\| profile_completed (Phase 12 SQL 미적용 환경 보호). status 코드는 schema.prisma L1290 Int 0=pending/1=approved/2=rejected/3=cancelled. 박제 룰 준수: var(--*) 토큰만 / Material Symbols person_off 1종(lucide 0) / radius 4-6-8 / 720 분기 / repeat(N,1fr) 분기 필수 ✅. tsc 0 에러. 변경: 수정 6 파일(page.tsx + _v2 4종 + globals.css). | ✅ |
| 2026-04-30 | (커밋 2건 대기, subin) | **P0 Step 4 + Step 5 백버튼 컴포넌트 + 18 페이지 + 커뮤니티 모바일 탭 회귀** (developer): 인계 문서 §4 + §5. 사용자 직접 보고 2건 해소. (1) `src/components/shared/page-back-button.tsx`(60줄) 신규 — Material Symbols arrow_back + lg:hidden + history.length 가드 + fallbackHref + minHeight 44px + radius 4px. "use client" + useRouter + window.history.length>1 분기 → router.back() / fallback. (2) profile 9 페이지(page/achievements/activity/billing/bookings/complete/complete-preferences/edit/growth) + organizations 4 페이지(page/[slug]/[slug]/series/[seriesSlug]/apply) + courts 5 페이지(page/[id]/booking/[id]/booking/payment-fail/[id]/checkin/[id]/manage) = **18 페이지** 일괄 적용. 각 페이지 fallbackHref 의미 매핑(동적 slug params 보존). 인계 문서 21 vs 실제 18 차이 — LegacyRedirect 4 개(notification-settings/payments/preferences/subscription) 제외 + settings 누락. 서버 컴포넌트는 wrapper div padding `12px var(--gutter) 0` 패턴 + 클라이언트 페이지는 .page 첫 줄 직접 삽입. (3) `community-aside.tsx`(+27/-3) — 기존 단일 <aside> → fragment 분기: 모바일 `.aside-mobile-tabs lg:hidden` 가로 스크롤 탭 8 카테고리 + 데스크톱 `hidden lg:block` 사이드바 그대로. role=tablist/tab + aria-selected. (4) `globals.css`(+50) — `.aside-mobile-tabs` overflow-x:auto + scrollbar 숨김 + `padding 8px var(--gutter)` + 음수 margin으로 화면 끝까지 + border-bottom var(--border). `.aside-mobile-tab` radius 4px + min-height 36px + var(--ink-mute). `.active` var(--accent) 배경 + 흰 글씨. 박제 룰 준수: var(--*) 토큰만, Material Symbols arrow_back 1종, radius 4px, alert 신규 0, API/data 0 변경(UI 만), lg:hidden Tailwind 1024px 분기. tsc 0 에러. 변경: 신규 1 + 수정 20 = 21 파일. PageBackButton 적용 카운트 grep 18 페이지 확인. | ✅ |
| 2026-04-30 | (미커밋, subin) | **P0 Step 1 + Step 3 가입+대회 흐름 + 404** (developer): 대회 직전 §A-2 §C-1 §C-2 §D-3 4 영역 일괄(사용자 명시 "대회 시급부터"). (1) onboarding/setup done 화면 "프로필 추가 완성하기 →" 보조 CTA 추가(옵션 A, /profile/complete, text 링크 톤). (2) tournaments/[id]/join success "내 신청 내역 보기 →" `/games/my-games` 1순위 CTA(btn--primary minWidth 200) + 기존 "대회 페이지로" 2순위 보존. tournament 전용 탭 미존재 → 단순 라우트. (3) pricing/checkout L117 401 redirect → `?redirect=${encodeURIComponent(currentUrl)}` 보존. /login isValidRedirect open redirect 방어 확인(page.tsx L29 + L57) → 적용. SSR 안전 typeof window 가드. (4) (web)/not-found.tsx 신규(60줄) — search_off 64px + h1 24px + 3 CTA(홈→ btn--primary / 경기 둘러보기 / 대회 보기). (web) 한정으로 (site) 서브도메인 영향 0. 박제 룰: var(--*) 토큰만, Material Symbols 1종(search_off), .btn 클래스 radius 4px, alert/API fetch 신규 0. 변경: 신규 1 + 수정 3 = 4 파일. tsc 0 에러. | ✅ |
| 2026-04-30 | (미커밋, subin) | **프로필 입력창/버튼 모바일 가독성** (developer): 캡처 51 /profile/edit 닉네임+중복확인+이름 한 줄 우겨넣기 픽스. .profile-edit-row 클래스 768px 이하 1열 stack + globals.css 720px 이하 .input/.textarea/.select padding 44px 터치 타겟 + .btn--sm 보강. ProfileSectionV2 자동 보강. 변경 +33/-23 = 2 파일. tsc 0. | ✅ |
| 2026-04-30 | (미커밋, subin) | **Phase 12-3 + 12-4 API 라우트 신규 + ProfileGrowth 데이터 연결** (developer): `src/app/api/web/identity/verify/route.ts`(87줄) 신규 — Portone 본인인증 콜백 mock 모드 POST. zod schema(verified_name/phone/birth/imp_uid 옵션) + withWebAuth 가드 + User UPDATE(verified_name/phone/birth/name_verified=true/verified_at=now() + 사용자 결정 §1: name 동기화) + apiSuccess BigInt 직렬화. Phase 12-5 에서 imp_uid 로 Portone API 재조회 추가 예정 — 현재는 클라 데이터 신뢰. `src/app/api/web/profile/season-stats/route.ts`(88줄) 신규 — UserSeasonStat 본인 시즌 누적 GET. season_year DESC + Decimal(avg_rating)·BigInt(id) 직렬화 + 현재 시즌(year) 누락 시 0으로 채운 빈 시즌 unshift(클라가 stats[0] 항상 가짐). `src/app/(web)/profile/growth/page.tsx`(+70/-23) 수정 — SeasonStat/SeasonStatsResponse 타입 추가 + SWR `/api/web/profile/season-stats` 병렬 호출 + 마일스톤 4종 데이터 연결: (1) 누적 경기 = season.games_played 우선 → court_stamps.count fallback (2) 평균 평점 = season.avg_rating null이면 "수집 중" + isDummy:true (3) 시즌 MVP = season.mvp_count 0회도 정식 표시 (4) 팀 멤버 추천 → 시즌 순위(🏆 #N위) 교체, rank_position null이면 "집계 중" + isDummy:true. 연속 출석은 gamification.streak 그대로, 커뮤니티 활동만 더미 유지. 다음 목표 CTA totalGames 기준 통일. 12주 spark / 평점 line 카드 2종은 더미 + "준비 중" 배지 그대로 유지(주간 집계 별도 큐). API/data fetch 0 회귀(기존 gamification SWR 동일). tsc 0 에러. 변경: 신규 2 파일(+175줄) + 수정 1 파일(+70/-23) = 3 파일. | ✅ |
| 2026-04-30 | (미커밋, subin) | **Phase 12-1 + 12-2 schema + dev DB push + 운영 SQL** (developer): `prisma/schema.prisma` User 모델에 본인인증 5컬럼(verified_name/phone/birth/name_verified/verified_at) + 4 relation(season_stats/shot_zones/scouting_received/scouting_given) 추가, schema 끝에 신규 모델 3종(UserSeasonStat / ShotZoneStat / ScoutingReport, @@map snake_case 테이블명) 추가. `npx prisma db push --accept-data-loss` dev DB 적용 완료. 운영 DB SQL `prisma/migrations/manual/phase_12_combined.sql`(115줄) 신규 — BEGIN/COMMIT 트랜잭션 + IF NOT EXISTS 멱등. dev DB 검증: User 본인인증 컬럼 5/5 ✓ / 신규 테이블 3/3 ✓ / 인덱스 10개 ✓. tsc 0 에러 + prisma generate ✓. **운영 DB 미적용 — dev 1주 안정화 후 사용자 직접 실행(PM 결정 6번)**. 변경: schema +93/-4 + manual SQL 신규 115줄 = 2 파일. | ✅ |
| 2026-04-30 | (계획서, subin) | **Phase 12 통합 계획서 작성** (planner-architect): `Dev/design/phase-12-plan-2026-04-30.md` 신규 — 옵션 3종(12-A 보수 6h / 12-B 통합 10h ⭐ / 12-AC 풀) + A 시즌 통계(user_season_stats / shot_zone_stats / scouting_reports 테이블 3) + C Portone 본인인증(User 컬럼 5: verified_name/phone/birth/name_verified/verified_at) 통합 마이그 SQL `phase_12_combined.sql`(멱등 IF NOT EXISTS + 트랜잭션) + 9단계 작업 분해(12-1~12-9) + 위험 6건/완화 + PR 3개 분리(schema/시즌통계/Portone) + PM 결정 7건(Q1~Q7) + B 디버깅 별도 분리(584c483 catch 로그). | ✅ |
| 2026-04-30 | (커밋 2건 대기, subin) | **BDR v2.2 P3-1 RefereeInfo 신규 라우트 박제** (subin): 시안 `Dev/design/BDR v2.2/screens/RefereeInfo.jsx` 1:1 박제 — 신규 라우트 `/referee-info` 신설 (사이트 `/referee` 는 심판 플랫폼 점유 → 별도 라우트). 공개 SEO 페이지(getWebSession 가드 X) + Open Graph 메타데이터. 박제 구성: (1) Hero full-bleed `linear-gradient(135deg, #1a1a1a, #000)` 다크 + eyebrow `BDR REFEREE PROGRAM` + h1 42px 2단(`var(--accent)` 강조 "심판") + lead 카피 + CTA 2단(가입하고 신청 → /signup, 활동 중인 심판 보기 → /referee) + 통계 strip 3종(활동 심판/주간 경기/평균 평점, auto-fit minmax). (2) Process 4 step grid(01~04, ff-display 34px 번호 + title/body, auto-fit minmax 모바일 1열). (3) Tiers 3등급 카드(BRONZE/SILVER/GOLD, fee/desc + 승급 요건 separator). (4) FAQ accordion 5건 — useState 필요해서 별도 클라이언트 컴포넌트 `_faq-client.tsx` 분리(서버 컴포넌트 page.tsx의 metadata export 보존), expand_more 회전 transition .2s. (5) Bottom CTA grad 배경 + 로그인/가입 2버튼(서버 컴포넌트라 isLoggedIn 분기 X — 공개 SEO 우선). more-groups.ts "둘러보기" 그룹 첫 항목으로 `refereeInfo` 추가({id, label:"심판 센터 안내", icon:"🦓", href:"/referee-info"}) + 시안 출처 코멘트 1줄. 박제 룰 준수: var(--accent/--ink-mute/--ink-dim/--ink-soft/--border/--ff-display) 토큰만, Material Symbols Outlined(expand_more) 1종, radius 4px(.btn .card 클래스 그대로), alert 신규 0건, 모바일 분기 인라인 auto-fit minmax. 시안 onClick(setRoute) → Next.js Link href 변환. 변경 +N/-N = 신규 2 파일 + 수정 1 파일. tsc 0 에러. | ✅ |
