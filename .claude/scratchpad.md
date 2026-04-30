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

- **요청**: BDR v2.2 P1-4 ProfileWeeklyReport 박제 (Dev/design/v2.2-cli-batch-prompt-2026-04-30.md §4-4)
- **상태**: developer 완료 (미커밋, subin 브랜치)
- **현재 담당**: → PM 커밋 or 다음 Step 4 통합 검증
- **브랜치**: subin

### 구현 기록 (P0-1)

7커밋으로 v2.1 모바일 분기(`@media max-width:720px`) 일괄 이식. 사이트 `globals.css` L1395 직전 모바일 분기 닫기 `}` 앞에 신규 룰 + 기존 1종 룰 5종 확장 교체.

| 커밋 | 갭 | 라인 (+/-) | 내용 |
|------|-----|----------|------|
| 9b14439 | G-1 | +66/0 | `.data-table` 카드형 변환(헤더 숨김+data-label/primary/actions). 사용 0건이라 선이식 |
| 1ad2c55 | G-2 | +11/-3 | 3-col 포스터 → 2-col(`minmax(0,1fr)`). v2의 3열 유지 룰 교체 |
| c340f01 | G-3 | +11/0 | season-stats 6열 → 3열 |
| d713d21 | G-4 | +24/-8 | with-aside 폭 5종(340/320/300/280/360) — `.page--wide` + `.page` + aside `order:-1` 모두 5종 |
| f82974a | G-6 | +14/0 | sticky aside/nav static — `.page--wide` → `.page` 전체 + `nav[sticky]` 포함, `top:auto` 추가 |
| db2d976 | G-7 | +16/0 | fontSize 96→48 / 48(opacity:.4)→24 (공백 있/없 양쪽 매처) |
| 8401325 | G-8/G-9 | +47/0 | 5종 wide table → 1열 stack + row 4종 + .card 140→100 |

총 +189/-11 = 순증 178줄. v2.1 추출본 538줄 중 P0-1 지정 9개 갭(7커밋)만 이식 — 나머지 ~360줄(메시지 3-col, 라이트박스, 브래킷, 캘린더, hero linear-gradient watermark, hscroll 등)은 P0-2~P1 후속 큐.

💡 tester 참고:
- 검증: `npm run check:design` → 신규 위반 0건 확인 (기존 issue: grid repeat 44건/lucide 1건/hex 342건은 P0-1 무관)
- TS: `npx tsc --noEmit` 0건
- 시각 확인: `/teams`, `/tournaments`, `/games/[id]`, `/courts/[id]` 모바일 375px viewport
  - G-2: /teams 또는 /tournaments 포스터 그리드 2-col인지
  - G-4: 코트 디테일/매치 디테일 사이드바가 상단으로 이동(order:-1) + 1열 stack
  - G-6: sticky 사이드바(/courts/[id] 지도)가 모바일에서 static인지
  - G-7: GameResult/MatchDetail 큰 점수가 48px로 줄었는지
- 주의: `.data-table` 사용처 0건이라 G-1은 시각 변화 0 (기능 회귀 X 검증만)

⚠️ reviewer 참고:
- 매처 문자열 공백 1칸 차이 깨짐 — v2.1 시안 그대로 보존했는지 확인 (특히 `minmax(0,1fr)`/`minmax(0, 1fr)`, `fontSize:96`/`fontSize: 96`)
- !important 강제 — 인라인 style 우선순위 이김 위해 모두 필수
- G-4에서 의도적으로 v2 룰 8줄 삭제 후 5종으로 재작성 (revert 시 원본 복구는 git revert d713d21로 가능)
- check:design 신규 위반 0건이지만 기존 hex 342건/lucide 1건은 별개 큐

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
| 2026-04-30 | (미커밋, subin) | **BDR v2.2 P1-4 ProfileWeeklyReport 박제** (subin): 시안 `Dev/design/BDR v2.2/screens/ProfileWeeklyReport.jsx` 1:1 박제 — 기존 TossCard 기반 페이지(515줄)를 시안의 이메일 뉴스레터 톤(720 max-width 좁은 칼럼 + 섹션 stack + eyebrow 번호)으로 재작성. **API/data fetch 0 변경**: SWR `/api/web/profile/weekly-report` 그대로 + ReportData/WeekData 타입 0 변경 + isLoading/error 분기 0 변경. 박제 구성: (1) 빵부스러기 홈›내 프로필›주간 리포트(시안 L80). (2) HERO eyebrow `WEEKLY REPORT · 매주 월요일 도착` + h1 30px + period 표시 + 주차 navigation 3버튼(이전 W{n-1}/이번 주 활성/다음 W{n+1}, 모두 disabled — 추후 확장 큐, getWeekNumber ISO 주차 계산 헬퍼 추가). (3) 인사 + 레벨 (사이트 고유 데이터 nickname/emoji/level/title/streak 보존, 시안 미존재이지만 사용자 식별 정보 보존 의도). (4) SECTION 01 KPI 4 — 시안 슬롯에 사이트 데이터 매핑(경기=session_count / 운동시간=total_minutes 시간 단위 변환 / XP=total_xp / 방문코트=unique_courts), 인라인 grid `repeat(auto-fit, minmax(min(160px, 100%), 1fr))` 모바일 자동 1열, Delta 컴포넌트 동적 색상(flat 회색/up var(--ok)/down var(--bdr-red)) + ↑/↓ 부호. (5) SECTION 02 자주 방문 코트 — top_courts TOP 3 사이트 기존 데이터, 1금/2은/3동 원형 순위 뱃지 + chevron_right Link `/courts/[id]`. (6) SECTION 03 인사이트 3종 동적 카피 — streak 기반(연속 출석 vs 시작) / minutes_change 기반(증가 var(--ok)/감소 var(--bdr-red)/유지 var(--cafe-blue)) / 정적 다음 도전(추후 추천 엔진 연동 큐), 아이콘 박스 color-mix 14% 배경. (7) SECTION 04 지난주 상세 비교 — 사이트 고유 4행 비교(횟수/일수/코트/XP, 지난주 → 이번주 화살표). (8) FOOTER `이메일 구독 관리` Link `/profile/notification-settings` (사용자 결정 §4 준수, notification-settings 경로 실재 확인) + `12주 성장 추이 보기 → /profile/growth`. (9) 하단 뒤로가기 버튼 router.back() 보존. 박제 룰 준수: 시안 `var(--accent)` → 사이트 `var(--color-primary)` 매핑(이전 박제 컨벤션), `var(--ok/--bdr-red/--cafe-blue/--color-accent/--color-text-*/--color-border-subtle/--color-surface/--ff-mono/--ff-display)` 토큰만, Material Symbols Outlined만(local_fire_department/trending_up/trending_down/lightbulb/calendar_month/fitness_center/search/chevron_right/arrow_back/error_outline), radius 4px(아이콘 박스/카드/버튼 모두), alert 신규 0건, 인라인 `repeat(N,1fr)` 위반 0건(KPI grid는 auto-fit minmax, 코트 리스트는 flex). 모바일 분기는 인라인 minmax 자동 처리 + flex 1열. 기존 TossCard/TossSectionHeader/StatCard/ChangeIndicator 미사용 — 시안 톤 통일 위해 인라인 박스로 교체(다른 페이지 사용처 영향 0). 변경 +732/-327 = 1 파일. tsc 0 에러. 검수 매트릭스 page.tsx 헤더 6행 이식. | ✅ |
| 2026-04-30 | (미커밋, subin) | **BDR v2.2 P1-3 VenueDetail 박제** (subin): 시안 `Dev/design/BDR v2.2/screens/VenueDetail.jsx` D등급 P1-3 박제 — 기존 `(web)/venues/[slug]/page.tsx`(376줄, 이미 v2 톤 박제됨)에 v2.2 신규 4 섹션 보강. 보존: API/data fetch 0 변경(prisma.court_infos.findUnique + prisma.games.findMany 그대로), generateMetadata Open Graph 0 변경, getWebSession 미사용 유지(공개 SEO 페이지 룰). 신규: (1) JSDoc 헤더 7행 회귀 검수 매트릭스 v2.2 형식으로 교체(코트 기본 정보/지도/사진 갤러리/리뷰 요약/비로그인 가입 CTA/로그인 풀페이지/JSON-LD). (2) breadcrumb city 단계 추가(홈 › 코트 › [city] › 체육관명, court.city 있을 때만 조건부). (3) 사진 갤러리 4-up grid placeholder(시안 L100-110 박제, repeating-linear-gradient 사선 줄무늬 + PHOTO 1~4 ff-mono 라벨, DB에 코트 사진 컬렉션 없어 placeholder). (4) 리뷰 요약 섹션 — `prisma.court_reviews.findMany`(status:published + content:not null + take:3) 신규 1건 가벼운 select(id/rating/content/created_at + users.nickname), 시안 L113-128 1:1 박제(별점 5칸 ★ + 닉네임 + 본문, 전체 보기 → /courts/[id] Link). (5) 비로그인 가입 유도 CTA 카드 — 사이드바, accent 8% 그라디언트 배경, "이 코트에서 더 많이 즐기려면" 헤딩 + 진행 예정 픽업 카운트 + 리뷰 작성 + 채팅방 ul, "가입하고 시작" /signup 풀버튼 + "이미 회원이에요" /login 보조버튼 — 서버 컴포넌트라 항상 노출(시안의 isLoggedIn 분기는 클라이언트 전용, SEO 페이지 정책상 가입 동선 우선). (6) JSON-LD `SportsActivityLocation` script 태그 — name/description/address(PostalAddress)/geo(GeoCoordinates lat&lng 있을 때만)/sport=Basketball/aggregateRating(average_rating>0 일 때만), 검색엔진 구조화 데이터 강화. (7) 기존 "코트 상세 보기" 버튼 라벨을 시안 톤 "이 코트 풀 페이지 보기 →"로 교체(로그인 사용자 동선). 박제 룰 준수: var(--accent/--bg-alt/--bg-elev/--border/--ink-mute/--ink-dim/--ink-soft/--ff-mono) 토큰만, Material Symbols 사용 0건(헤더 hero 아이콘은 placeholder로 대체 — 시안의 sports_basketball 80px 검은 hero 대신 사선 줄무늬 일관 톤 유지), radius 4px(badge 시스템 그대로), alert 신규 0건, 모바일 분기는 globals.css 자동 처리 + grid `minmax(0,1fr) 340px` 기존 룰. 시안의 isLoggedIn prop 의존부는 서버 컴포넌트 정책상 단순화(항상 가입 CTA + 항상 풀페이지 링크). 변경 +200/-23 = 1 파일. tsc 0 에러. /signup 경로 확인(C:/0. Programing/mybdr/src/app/(web)/signup/ 존재). | ✅ |
| 2026-04-30 | (미커밋, subin) | **BDR v2.2 P1-2 ProfileBookings 박제** (subin): 시안 `Dev/design/BDR v2.2/screens/ProfileBookings.jsx` 1:1 박제 — 기존 단일 코트 예약 페이지(_bookings-list-client.tsx, 327줄)에서 시안의 3종 통합 카테고리 탭(전체/코트/토너먼트/게스트)으로 재구성. **데이터 페칭 확장 0 보존**: court_bookings 기존 쿼리 그대로 + tournament_teams(via registered_by_id) 신규 + game_applications(is_guest=true) 신규 — Promise.all 3종 병렬. 시안 데이터 형식(id/kind/title/sub/status/meta/href/sortAt) 단일 BookingItemV2 인터페이스로 통일. status 압축 매핑 헬퍼 3종(mapCourtStatus/mapTournamentStatus/mapGuestStatus) — 사이트의 confirmed/pending/completed/refunded/approved/rejected/숫자 코드(0~3)를 시안 3종(upcoming/done/cancelled)으로 압축. 신규 클라이언트 컴포넌트 `_bookings-list-v2.tsx`(326줄) — 시안 L14-119 1:1: 빵부스러기/eyebrow/h1 30px/탭 4종(hscroll + 3px borderBottom 활성)/상태 칩 4종(`var(--radius-chip)` + 활성 `var(--ink)/var(--bg)` 반전)/카드 리스트(좌측 8x48 컬러 바 + 종류 배지 + ● 상태 + 제목/서브/메타 + chevron_right). 시안 `var(--accent)` → 사이트 `var(--color-primary)` 매핑(globals.css 미정의), 그 외 var(--cafe-blue/--ok/--bdr-red/--ink-mute/--ink-dim/--ff-mono/--bg-alt/--border) 토큰 그대로. 진입점은 이미 `profile-side-nav.tsx` "활동" 그룹에 등록됨(추가 작업 0). 사용자 결정 §1-3 빌링 탭 X 정책 준수(결제 영수증 혼동 방지). 박제 룰 준수: 하드코딩 색상 1건만 시안 그대로(#10B981 게스트 그린 — 시안에서도 var 미사용), Material Symbols Outlined 1종(chevron_right), radius 4px 카드/3px 종류 배지(시안 그대로), alert 신규 0건(취소 액션은 시안에 없으므로 제거 — 상세 페이지에서 처리 정책), 모바일 분기 hscroll + flex-wrap. 시안의 onClick(setRoute) → Next.js Link href 변환(시맨틱 + 키보드 접근성). 변경: page.tsx +191/-105 + 신규 v2 클라이언트 +326 = 2 파일. 기존 `_bookings-list-client.tsx`는 unused로 보존(회귀 위험 0, 별도 정리 큐). tsc 0 에러. 검수 매트릭스 page.tsx 헤더 7행 이식. | ✅ |
| 2026-04-30 | (미커밋, subin) | **BDR v2.2 P1-1 ProfileGrowth 박제** (subin): 시안 `Dev/design/BDR v2.2/screens/ProfileGrowth.jsx` 1:1 박제 — 기존 Profile/XpLevelCard/StreakCard/CourtStamps/BadgeCollection 자식 컴포넌트 wrapping 형태(285줄)를 시안의 단일 페이지 통합 박제(769줄)로 재작성. 보존 0 변경: SWR `/api/web/profile/gamification` fetch 동일, GamificationData 타입 동일, 로딩/비로그인 분기 동일. 박제 구성: (1) 빵부스러기 홈›내 프로필›내 성장 3단(시안 L40-44). (2) eyebrow `GROWTH · MY JOURNEY` + h1 30px(시안 L46-50). (3) HERO 그라디언트 카드 — 80px 원형 L{level} 뱃지(accent→#FF6B35 그라디언트) + XP 진행 막대(progress%/xp_to_next_level 매핑) + STREAK 🔥 카운트(streak 매핑), 인라인 grid `repeat(auto-fit, minmax(min(180px, 100%), 1fr))`로 모바일 자동 1열. (4) 12주 추이 2-카드(주간 경기수 spark bar + 평균 평점 SVG polyline) — DB 집계 미구현이라 `[4,5,3,6,4,7,5,8,6,9,7,8]`/`[3.8...4.6]` 더미 + "준비 중" 배지 명시, hscroll 가로 스크롤. (5) 마일스톤 6 cards `repeat(auto-fit, minmax(min(220px, 100%), 1fr))` — 누적 경기·연속 출석 2개는 court_stamps.count + streak DB 매핑(isDummy:false), 평점·MVP·커뮤니티·팀추천 4개는 더미(isDummy:true → "준비 중" 배지). (6) 다음 목표 CTA(flag 아이콘 + 50경기-totalCourts 동적 계산 + Link `/games` 경기 찾기). (7) "준비 중" 배너(구간별 상세 분석 미구현 명시). 박제 룰 준수: 시안 `var(--accent)` → 사이트 `var(--color-primary)` 매핑, 그 외 `var(--cafe-blue)/--ok/--bg-alt/--ink-dim/--ff-display/--ff-mono` 토큰 그대로 사용 가능(globals.css에 정의 확인), Material Symbols Outlined `flag` 1종, radius 4px, 인라인 `repeat(N,1fr)` 위반 0건(모두 auto-fit). +612/-127 = 1 파일. tsc 0 에러. | ✅ |
| 2026-04-30 | 7b38231, 77b94e3 (2건 미푸시) | **BDR v2.2 P0-4 ProfileComplete + verify redirect** (subin): 시안 `Dev/design/BDR v2.2/screens/ProfileComplete.jsx` 1:1 박제 — 기존 M5 압축형(choose→fill 3필드)을 시안의 4 step wizard로 재작성. Step 1 POSITION 5칩(PG/SG/SF/PF/C, 복수 선택, eyebrow + 라벨/desc), Step 2 BODY 키/체중 range slider + 비공개 체크(체크 시 PATCH height/weight 제외), Step 3 AREA RegionPicker max=3(시안의 14개 고정 칩 대신 사이트 컨벤션 cascade 유지), Step 4 PHOTO drop zone UI + /profile/edit 링크(M5 정책 — 실제 업로드는 별도 페이지). 진행 막대(height:4 + accent fill + transition .3s) + 우상단 건너뛰기 + 완료 화면(농구공 그라디언트 원 + CTA 2개: 나중에/취향 설정). 보존: PATCH `/api/web/profile` 0 변경(기존 nickname/position/city/district/height/weight 모두 받음), profile_completed 의도적 미전송(게임 신청 가드 보존), prefill 로직 + togglePosition 0 변경. verify/page.tsx redirect 분기 추가: 인증 완료 후 GET `/api/web/profile` 호출 → `user.profile_completed=false`면 `/profile/complete`, `onboarding_completed_at=null`이면 `/onboarding/setup`, 모두 완료면 `/`. fallback은 기존 동작(`/onboarding/setup`) 유지. DB 컬럼 이미 존재 확인: `profile_completed` Boolean + `onboarding_completed_at` DateTime? (시안의 `onboarded_at` 명칭은 schema와 다름 — 후자로 매핑). 박제 룰 준수: var(--accent/--ink-mute/--ink-dim/--bg-alt/--bg-elev/--border) 토큰만 + Material Symbols Outlined(sports_basketball/person) + radius 4px + 인라인 grid `minmax(min(150px, 100%), 1fr)` 모바일 wrap. tsc 0 에러 / check:design 신규 위반 0건. 변경 +584/-220 = 2 파일. | ✅ |
| 2026-04-30 | (미커밋, subin) | **BDR v2.2 P0-3 LiveResult 회귀 픽스** (subin): 사이트 현황은 **이미 GameResultV2로 복원됨(부분 매칭)** — finished/completed 분기에서 `<GameResultV2 match={...} />` 단일 렌더 중. 시안 `Dev/design/BDR v2.2/screens/LiveResult.jsx` 회귀 검수 매트릭스 5건 중 **3건 기 매칭(FINAL/쿼터/MVP)** + **2건 미복원(평가/기록)** 보강. 시안 L94~L115 CTA 카드 2단을 `_v2/game-result.tsx` 탭 컨텐츠 하단에 추가 — `/games/[id]/report`(rate_review 아이콘 + cafe-blue 12% 배경) + `/profile/activity`(insights 아이콘 + accent 12% 배경) Link 카드, var(--cafe-blue/--accent/--ink-mute) 토큰 + Material Symbols Outlined + radius 4px 준수. `_v2/hero-scoreboard.tsx` 큰 점수 grid에 `className="scoreboard"` 추가 → globals.css L1593 G-9 보호 룰(`.page .scoreboard`) 자동 적용으로 모바일 720px 이하에서 1fr/auto/1fr 다열 유지(가로 스코어 보존). page.tsx 헤더 코멘트에 P0-3 회귀 검수 매트릭스 5건 + 시안 출처 + 진입/복귀 경로 명시. 보존: API/data fetch 0 변경, HeroScoreboard 쿼터 표·MvpBanner·5탭 구조 0 변경, 라이브/진행중 UI(L631+) 0 변경. 하이라이트 클립(시안 L68~L91)은 DB 데이터 없어 박제 보류(시안 §5-3 "옛 디자인 기능 복원" 원칙 — 옛 v1엔 클립 없음). 모바일 분기는 globals.css 모바일 룰이 자동 처리. 변경 +145/-1 = 3 파일 (_v2/game-result.tsx +129 / _v2/hero-scoreboard.tsx +3/-1 / page.tsx +13). tsc 0 에러. | ✅ |
| 2026-04-30 | (미커밋, subin) | **BDR v2.2 P0-2 GameEdit 박제** (subin): `(web)/games/[id]/edit/page.tsx` v2.2 시안 1:1 박제 (+472/-45) + `api/web/games/[id]/route.ts` GET 응답에 `current_participants` 1필드 추가 (+4). 시안 출처 `Dev/design/BDR v2.2/screens/GameEdit.jsx`. JSDoc 헤더 v2.2 형식 + Edge cases 5종 분기 적용: (1) noPermission view(forbidden state + lock 아이콘 + "/games/[id]" 복귀, fetch 403/PATCH 403 양쪽 잡기). (2) finished noEdit view(status 3=종료/4=완료/5=취소, event_busy 아이콘 + 종료 시만 `/games/[id]/report` 진입 링크). (3) applicantCount=0 → 모든 필드 편집(기존 유지). (4) applicantCount≥1 → 인원/회비/날짜 잠금 배너(warning + bdr-red 8% 배경 + 각 필드 `· 잠김` 라벨 + disabled). (5) 경기 시작<24h → "취소만 가능" danger 카드(schedule 아이콘 + bdr-red 12% 배경) + 모든 필드 disabled + 저장 버튼 disabled, hoursUntilStart 계산 헬퍼 추가. 위험 액션 카드(경기 취소) 신규 — DELETE /api/web/games/[id] 호출 + confirm 모달 + 신청자 수 안내 분기. 보존 사항: GET/PATCH/DELETE 라우트 0 변경(GET response 1필드만 추가 — 신규 키라 기존 호출처 영향 0), useEffect/handleSubmit/parseRequirements/buildRequirements 0 변경. 진입점 이미 존재(`_components/host-actions.tsx` "경기 수정" 버튼). 모바일 분기: 모든 grid를 `repeat(auto-fit, minmax(min(N, 100%), 1fr))` 패턴으로 — 인라인 `repeat(N,1fr)` 위반 0. var(--*) 토큰만, Material Symbols Outlined만, 버튼 4px 유지. tsc 0건. 2 파일. | ✅ |
| 2026-04-29 | (미커밋) | **/profile/settings 선수 프로필 섹션 재구성** (design_v2): `_components_v2/profile-section-v2.tsx` 폼 마크업 재구성 — (1) 실명 readOnly+disabled 처리 + bg-alt 배경 + cursor-not-allowed + opacity 0.7 + 11px 안내문구("전화번호 인증 후 자동 입력. 직접 수정할 수 없습니다") + PATCH body에서 `name` 키 제외(서버 안 보냄). (2) 포지션 자유 입력 → 3열 버튼 카드(G/F/C, onboarding/setup-form.tsx L44-48 패턴 차용, 선택 시 cafe-blue 2px 테두리+bg-alt). (3) 도시/구·동 단일 input 2개 → `RegionPicker max=1` (cascading select, 시/도→시/군/구), regions Region[] state 추가, useEffect에서 user.city/district→첫 슬롯 매핑, submit 시 firstRegion.city/district로 PATCH. (4) 레이아웃 2열 grid 고정 → space-y-4 1열 stack 기본 + 키/몸무게만 sm:grid-cols-2(데스크톱 2열, 모바일 1열). API/DB/route.ts 0 변경. tsc 0 에러. 1 파일. 근거: 사용자 캡처 43 + Explore 분석 | ✅ |
| 2026-04-30 | (미커밋) | **사용자 디자인 결정 영구 보존 문서 작성** (design_v2): 신규 `Dev/design/user-design-decisions-2026-04-30.md` 작성(~280줄, 10개 섹션 — 헤더/더보기/팀/프로필/메인/카피/모바일/인증/회귀방지/PWA). 각 결정에 commit hash + "회귀 금지" 명시 + 향후 변경 체크리스트 포함. README.md "영구 참조" 표에 신규 행 1줄 추가. DESIGN.md 마지막에 "사용자 결정 영구 보존" 섹션 + 참조 링크 1줄 추가. 목적: 자동 작업/리팩토링이 사용자 직접 결정을 되돌리지 않도록 명시적 가드. 3 파일(신규 1 + 갱신 2). | ✅ |
