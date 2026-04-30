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
| 2026-04-30 | (미커밋, subin) | **Phase 12-5 Portone JS SDK mock 통합** (developer): 신규 `src/components/identity/identity-verify-button.tsx`(255줄) — initialVerified=false면 cafe-blue "본인인증" 버튼, true면 verified 아이콘 + "인증완료" 배지. 클릭 시 mock 모달(실명/휴대폰/생년월일 3필드, role="dialog" aria-modal) → POST `/api/web/identity/verify`(12-3에서 이미 구현됨) → onVerified 콜백으로 부모 form.name+name_verified 갱신 + onSaved 양쪽 동기화. alert() 신규 0건(인라인 errorText state), var(--cafe-blue/--ok/--ink-mute/--ink-dim/--bg/--bg-alt/--border/--accent) 토큰만, Material Symbols verified 1종, radius 4px, 모달 overlay 클릭+ESC 닫기 가능. profile-section-v2.tsx(+33/-19): ProfileFormUser interface에 name_verified 추가, form state +1 필드, 실명 div를 flex 가로 배치(input flex:1 + 우측 버튼/배지), 도움말 텍스트 "전화번호 인증" → "본인인증" 정정. settings/page.tsx(+2): user state mapping에 name_verified 매핑 추가. user.ts PROFILE_DETAIL_SELECT(+3): name_verified + verified_at 노출 — getProfile 자동 반영. tsc 0 에러. 변경: 신규 1 + 수정 3 = 4 파일. PATCH name 가드(name_verified=true 시 차단)는 본 작업 범위 외 — 12-7에서 처리. **12-3 verify route.ts는 이전 세션에서 이미 구현**(zod + withWebAuth + name 자동 동기화). | ✅ |
| 2026-04-30 | (미커밋, subin) | **Phase 12-3 + 12-4 API 라우트 신규 + ProfileGrowth 데이터 연결** (developer): `src/app/api/web/identity/verify/route.ts`(87줄) 신규 — Portone 본인인증 콜백 mock 모드 POST. zod schema(verified_name/phone/birth/imp_uid 옵션) + withWebAuth 가드 + User UPDATE(verified_name/phone/birth/name_verified=true/verified_at=now() + 사용자 결정 §1: name 동기화) + apiSuccess BigInt 직렬화. Phase 12-5 에서 imp_uid 로 Portone API 재조회 추가 예정 — 현재는 클라 데이터 신뢰. `src/app/api/web/profile/season-stats/route.ts`(88줄) 신규 — UserSeasonStat 본인 시즌 누적 GET. season_year DESC + Decimal(avg_rating)·BigInt(id) 직렬화 + 현재 시즌(year) 누락 시 0으로 채운 빈 시즌 unshift(클라가 stats[0] 항상 가짐). `src/app/(web)/profile/growth/page.tsx`(+70/-23) 수정 — SeasonStat/SeasonStatsResponse 타입 추가 + SWR `/api/web/profile/season-stats` 병렬 호출 + 마일스톤 4종 데이터 연결: (1) 누적 경기 = season.games_played 우선 → court_stamps.count fallback (2) 평균 평점 = season.avg_rating null이면 "수집 중" + isDummy:true (3) 시즌 MVP = season.mvp_count 0회도 정식 표시 (4) 팀 멤버 추천 → 시즌 순위(🏆 #N위) 교체, rank_position null이면 "집계 중" + isDummy:true. 연속 출석은 gamification.streak 그대로, 커뮤니티 활동만 더미 유지. 다음 목표 CTA totalGames 기준 통일. 12주 spark / 평점 line 카드 2종은 더미 + "준비 중" 배지 그대로 유지(주간 집계 별도 큐). API/data fetch 0 회귀(기존 gamification SWR 동일). tsc 0 에러. 변경: 신규 2 파일(+175줄) + 수정 1 파일(+70/-23) = 3 파일. | ✅ |
| 2026-04-30 | (미커밋, subin) | **Phase 12-1 + 12-2 schema + dev DB push + 운영 SQL** (developer): `prisma/schema.prisma` User 모델에 본인인증 5컬럼(verified_name/phone/birth/name_verified/verified_at) + 4 relation(season_stats/shot_zones/scouting_received/scouting_given) 추가, schema 끝에 신규 모델 3종(UserSeasonStat / ShotZoneStat / ScoutingReport, @@map snake_case 테이블명) 추가. `npx prisma db push --accept-data-loss` dev DB 적용 완료. 운영 DB SQL `prisma/migrations/manual/phase_12_combined.sql`(115줄) 신규 — BEGIN/COMMIT 트랜잭션 + IF NOT EXISTS 멱등. dev DB 검증: User 본인인증 컬럼 5/5 ✓ / 신규 테이블 3/3 ✓ / 인덱스 10개 ✓. tsc 0 에러 + prisma generate ✓. **운영 DB 미적용 — dev 1주 안정화 후 사용자 직접 실행(PM 결정 6번)**. 변경: schema +93/-4 + manual SQL 신규 115줄 = 2 파일. | ✅ |
| 2026-04-30 | (계획서, subin) | **Phase 12 통합 계획서 작성** (planner-architect): `Dev/design/phase-12-plan-2026-04-30.md` 신규 — 옵션 3종(12-A 보수 6h / 12-B 통합 10h ⭐ / 12-AC 풀) + A 시즌 통계(user_season_stats / shot_zone_stats / scouting_reports 테이블 3) + C Portone 본인인증(User 컬럼 5: verified_name/phone/birth/name_verified/verified_at) 통합 마이그 SQL `phase_12_combined.sql`(멱등 IF NOT EXISTS + 트랜잭션) + 9단계 작업 분해(12-1~12-9) + 위험 6건/완화 + PR 3개 분리(schema/시즌통계/Portone) + PM 결정 7건(Q1~Q7) + B 디버깅 별도 분리(584c483 catch 로그). | ✅ |
| 2026-04-30 | (커밋 2건 대기, subin) | **BDR v2.2 P3-1 RefereeInfo 신규 라우트 박제** (subin): 시안 `Dev/design/BDR v2.2/screens/RefereeInfo.jsx` 1:1 박제 — 신규 라우트 `/referee-info` 신설 (사이트 `/referee` 는 심판 플랫폼 점유 → 별도 라우트). 공개 SEO 페이지(getWebSession 가드 X) + Open Graph 메타데이터. 박제 구성: (1) Hero full-bleed `linear-gradient(135deg, #1a1a1a, #000)` 다크 + eyebrow `BDR REFEREE PROGRAM` + h1 42px 2단(`var(--accent)` 강조 "심판") + lead 카피 + CTA 2단(가입하고 신청 → /signup, 활동 중인 심판 보기 → /referee) + 통계 strip 3종(활동 심판/주간 경기/평균 평점, auto-fit minmax). (2) Process 4 step grid(01~04, ff-display 34px 번호 + title/body, auto-fit minmax 모바일 1열). (3) Tiers 3등급 카드(BRONZE/SILVER/GOLD, fee/desc + 승급 요건 separator). (4) FAQ accordion 5건 — useState 필요해서 별도 클라이언트 컴포넌트 `_faq-client.tsx` 분리(서버 컴포넌트 page.tsx의 metadata export 보존), expand_more 회전 transition .2s. (5) Bottom CTA grad 배경 + 로그인/가입 2버튼(서버 컴포넌트라 isLoggedIn 분기 X — 공개 SEO 우선). more-groups.ts "둘러보기" 그룹 첫 항목으로 `refereeInfo` 추가({id, label:"심판 센터 안내", icon:"🦓", href:"/referee-info"}) + 시안 출처 코멘트 1줄. 박제 룰 준수: var(--accent/--ink-mute/--ink-dim/--ink-soft/--border/--ff-display) 토큰만, Material Symbols Outlined(expand_more) 1종, radius 4px(.btn .card 클래스 그대로), alert 신규 0건, 모바일 분기 인라인 auto-fit minmax. 시안 onClick(setRoute) → Next.js Link href 변환. 변경 +N/-N = 신규 2 파일 + 수정 1 파일. tsc 0 에러. | ✅ |
| 2026-04-30 | a2fba92 (subin) | **BDR v2.2 P2-1 ProfileCompletePreferences 박제** (subin): 시안 `Dev/design/BDR v2.2/screens/ProfileCompletePreferences.jsx` 1:1 박제 — 기존 redirect 옵션 A(28줄, /profile/settings?tab=preferences로 이동)를 시안의 4 step wizard로 재작성. 진입: ProfileComplete(P0-4) 완료 후 follow-up + /profile "프로필 보강하기" 카드. 박제 구성: (1) JSDoc 헤더 회귀 검수 매트릭스 6행(스킬/스타일/요일·시간/목표/완료). (2) 진행 막대(height:4 + cafe-blue fill + transition .3s, ProfileComplete 동일 톤) + 우상단 건너뛰기 → router.push("/"). (3) STEP 1 SKILLS 5축(슈팅/돌파/수비/패스/리바운드) 1~5 버튼 (선택값 이하 모두 활성, ff-mono 스코어 표시). (4) STEP 2 STYLE 6 카드 multi-select 2-col grid(공격적/팀플레이/슈터형/골밑형/올라운드/재미우선, 이모지+라벨+desc, 선택 시 cafe-blue 8% 배경). (5) STEP 3 WHEN 요일 7-col grid(월~일) + 시간대 6 chips hscroll(새벽/오전/점심/오후/저녁/심야). (6) STEP 4 GOALS 4 카드 multi-select(재미/경쟁/실력향상/소셜, Material Symbols sports_basketball/emoji_events/trending_up/group + 우측 22px 선택 원형). (7) 완료 화면(grad 원형 + 🎯 + "취향 설정 완료!" + 홈으로 → CTA). 박제 룰 준수: var(--cafe-blue/--ink-mute/--ink-dim/--ink-soft/--ink/--bg-alt/--bg-elev/--border/--ff-mono) 토큰만, Material Symbols Outlined 4종(STEP 4 아이콘만), radius 4px(버튼 .btn 클래스 그대로), alert 신규 0건, 모바일 분기 인라인 `repeat(2, minmax(0,1fr))` + `repeat(7, minmax(0,1fr))` + hscroll(시간대) — globals.css 자동 처리. 데이터 fetching 사이트 기존 방식(없음) 유지 — 시안에도 API 저장 호출 없음, 클라이언트 state로만 보유(추후 PATCH /api/web/profile/preferences 연동 큐). 사용자 결정 §2 위반 0건. 변경 +467/-19 = 1 파일. tsc 0 에러. | ✅ |
| 2026-04-30 | (미커밋, subin) | **BDR v2.2 P1-4 ProfileWeeklyReport 박제** (subin): 시안 `Dev/design/BDR v2.2/screens/ProfileWeeklyReport.jsx` 1:1 박제 — 기존 TossCard 기반 페이지(515줄)를 시안의 이메일 뉴스레터 톤(720 max-width 좁은 칼럼 + 섹션 stack + eyebrow 번호)으로 재작성. **API/data fetch 0 변경**: SWR `/api/web/profile/weekly-report` 그대로 + ReportData/WeekData 타입 0 변경 + isLoading/error 분기 0 변경. 박제 구성: (1) 빵부스러기 홈›내 프로필›주간 리포트(시안 L80). (2) HERO eyebrow `WEEKLY REPORT · 매주 월요일 도착` + h1 30px + period 표시 + 주차 navigation 3버튼(이전 W{n-1}/이번 주 활성/다음 W{n+1}, 모두 disabled — 추후 확장 큐, getWeekNumber ISO 주차 계산 헬퍼 추가). (3) 인사 + 레벨 (사이트 고유 데이터 nickname/emoji/level/title/streak 보존, 시안 미존재이지만 사용자 식별 정보 보존 의도). (4) SECTION 01 KPI 4 — 시안 슬롯에 사이트 데이터 매핑(경기=session_count / 운동시간=total_minutes 시간 단위 변환 / XP=total_xp / 방문코트=unique_courts), 인라인 grid `repeat(auto-fit, minmax(min(160px, 100%), 1fr))` 모바일 자동 1열, Delta 컴포넌트 동적 색상(flat 회색/up var(--ok)/down var(--bdr-red)) + ↑/↓ 부호. (5) SECTION 02 자주 방문 코트 — top_courts TOP 3 사이트 기존 데이터, 1금/2은/3동 원형 순위 뱃지 + chevron_right Link `/courts/[id]`. (6) SECTION 03 인사이트 3종 동적 카피 — streak 기반(연속 출석 vs 시작) / minutes_change 기반(증가 var(--ok)/감소 var(--bdr-red)/유지 var(--cafe-blue)) / 정적 다음 도전(추후 추천 엔진 연동 큐), 아이콘 박스 color-mix 14% 배경. (7) SECTION 04 지난주 상세 비교 — 사이트 고유 4행 비교(횟수/일수/코트/XP, 지난주 → 이번주 화살표). (8) FOOTER `이메일 구독 관리` Link `/profile/notification-settings` (사용자 결정 §4 준수, notification-settings 경로 실재 확인) + `12주 성장 추이 보기 → /profile/growth`. (9) 하단 뒤로가기 버튼 router.back() 보존. 박제 룰 준수: 시안 `var(--accent)` → 사이트 `var(--color-primary)` 매핑(이전 박제 컨벤션), `var(--ok/--bdr-red/--cafe-blue/--color-accent/--color-text-*/--color-border-subtle/--color-surface/--ff-mono/--ff-display)` 토큰만, Material Symbols Outlined만(local_fire_department/trending_up/trending_down/lightbulb/calendar_month/fitness_center/search/chevron_right/arrow_back/error_outline), radius 4px(아이콘 박스/카드/버튼 모두), alert 신규 0건, 인라인 `repeat(N,1fr)` 위반 0건(KPI grid는 auto-fit minmax, 코트 리스트는 flex). 모바일 분기는 인라인 minmax 자동 처리 + flex 1열. 기존 TossCard/TossSectionHeader/StatCard/ChangeIndicator 미사용 — 시안 톤 통일 위해 인라인 박스로 교체(다른 페이지 사용처 영향 0). 변경 +732/-327 = 1 파일. tsc 0 에러. 검수 매트릭스 page.tsx 헤더 6행 이식. | ✅ |
| 2026-04-30 | (미커밋, subin) | **BDR v2.2 P1-3 VenueDetail 박제** (subin): 시안 `Dev/design/BDR v2.2/screens/VenueDetail.jsx` D등급 P1-3 박제 — 기존 `(web)/venues/[slug]/page.tsx`(376줄, 이미 v2 톤 박제됨)에 v2.2 신규 4 섹션 보강. 보존: API/data fetch 0 변경(prisma.court_infos.findUnique + prisma.games.findMany 그대로), generateMetadata Open Graph 0 변경, getWebSession 미사용 유지(공개 SEO 페이지 룰). 신규: (1) JSDoc 헤더 7행 회귀 검수 매트릭스 v2.2 형식으로 교체(코트 기본 정보/지도/사진 갤러리/리뷰 요약/비로그인 가입 CTA/로그인 풀페이지/JSON-LD). (2) breadcrumb city 단계 추가(홈 › 코트 › [city] › 체육관명, court.city 있을 때만 조건부). (3) 사진 갤러리 4-up grid placeholder(시안 L100-110 박제, repeating-linear-gradient 사선 줄무늬 + PHOTO 1~4 ff-mono 라벨, DB에 코트 사진 컬렉션 없어 placeholder). (4) 리뷰 요약 섹션 — `prisma.court_reviews.findMany`(status:published + content:not null + take:3) 신규 1건 가벼운 select(id/rating/content/created_at + users.nickname), 시안 L113-128 1:1 박제(별점 5칸 ★ + 닉네임 + 본문, 전체 보기 → /courts/[id] Link). (5) 비로그인 가입 유도 CTA 카드 — 사이드바, accent 8% 그라디언트 배경, "이 코트에서 더 많이 즐기려면" 헤딩 + 진행 예정 픽업 카운트 + 리뷰 작성 + 채팅방 ul, "가입하고 시작" /signup 풀버튼 + "이미 회원이에요" /login 보조버튼 — 서버 컴포넌트라 항상 노출(시안의 isLoggedIn 분기는 클라이언트 전용, SEO 페이지 정책상 가입 동선 우선). (6) JSON-LD `SportsActivityLocation` script 태그 — name/description/address(PostalAddress)/geo(GeoCoordinates lat&lng 있을 때만)/sport=Basketball/aggregateRating(average_rating>0 일 때만), 검색엔진 구조화 데이터 강화. (7) 기존 "코트 상세 보기" 버튼 라벨을 시안 톤 "이 코트 풀 페이지 보기 →"로 교체(로그인 사용자 동선). 박제 룰 준수: var(--accent/--bg-alt/--bg-elev/--border/--ink-mute/--ink-dim/--ink-soft/--ff-mono) 토큰만, Material Symbols 사용 0건(헤더 hero 아이콘은 placeholder로 대체 — 시안의 sports_basketball 80px 검은 hero 대신 사선 줄무늬 일관 톤 유지), radius 4px(badge 시스템 그대로), alert 신규 0건, 모바일 분기는 globals.css 자동 처리 + grid `minmax(0,1fr) 340px` 기존 룰. 시안의 isLoggedIn prop 의존부는 서버 컴포넌트 정책상 단순화(항상 가입 CTA + 항상 풀페이지 링크). 변경 +200/-23 = 1 파일. tsc 0 에러. /signup 경로 확인(C:/0. Programing/mybdr/src/app/(web)/signup/ 존재). | ✅ |
| 2026-04-30 | (미커밋, subin) | **닉네임 중복확인 기능 추가** (developer): 76c9d26(P2002 → 409 친화 메시지) 후속 — 저장 전 사전 검증으로 회귀 차단. **신규 1 파일**: `src/app/api/web/profile/check-nickname/route.ts`(74줄) — withWebAuth + zod (2~20자, PATCH route.ts L91-95 룰 일치) + `prisma.user.findFirst({ where: { nickname, NOT: { id: ctx.userId } }, select: { id: true } })` (본인 nickname 은 충돌 X, 다른 사용자 id 노출 X). 응답 `{ available: boolean, message: string }` apiSuccess(snake_case 자동) + 400/500 친화 메시지. **수정 2 파일**: (1) `/profile/edit/page.tsx`(+82/-7) 기본 정보 탭 닉네임 input + 중복확인 버튼(`btn btn--sm`, type="button" submit 방지) + 결과 메시지(`var(--ok)` 사용 가능 / `var(--danger)` 사용 중 / `var(--ink-mute)` 에러), nicknameCheck state 5종 status(idle/checking/available/taken/error) + onChange 시 입력값이 검증값과 다르면 idle 리셋. (2) `profile-section-v2.tsx`(+126/-7) 동일 패턴 인라인 적용(기존 Field 컴포넌트는 input 외 children 미지원 → div 로 풀어냄). 박제 룰 준수: var(--*) 토큰만, alert 신규 0건, Material Symbols 미사용(텍스트 ✓ / ✕), radius 4px(.btn 클래스). tsc 0 에러. 검증: 본인 nickname → available:true / 다른 사용자 nickname → available:false / 빈 문자열 → 400. | ✅ |
