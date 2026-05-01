# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22 재정의)

> 일반 모드 / 카페 모드 분리 — 기존 룰 그대로

- **일반 모드**: mybdr 본 프로젝트 작업 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 쇼핑몰 작업 (`scratchpad-cafe-sync.md` 별도)

## 🚧 추후 구현 목록 (DB/API 확장 필요)

> Phase 10 적용으로 일부 해결됨

**해결됨 ✅**
- 경기 평가/신고 / 게스트 지원 / 팀 팔로우 / 온보딩 데이터
- /teams v2 지역/정렬 chip-bar (P0-A A-1) / /teams/[id] 부팀장 manage (A-3) / /notifications actionUrl 자동 read (A-5)

**미해결 ⏳**
- 슛존 성공률 (heatmap) — A-2 ghost / 스카우팅 리포트 — A-2 ghost
- 프로필 시즌 통계 / VS 비교 — A-2 ghost (Phase 12 일부 해결)
- 커뮤니티 댓글 답글 / 좋아요 — A-4 ghost (UI/action 미연결)
- 커뮤니티 게시글 북마크 — bookmarks 테이블 미구현
- waitlist / no-show / QR 티켓
- **AppNav 쪽지 unread count 뱃지** — Phase 19 추가 시 No-badge 시작 (후속 큐 — messages unread API 추가 시 prop 추가 + 활성화)

## 현재 작업

- **요청**: Phase C — P0 박제 (/profile + AppNav frozen 운영 동기화)
- **상태**: developer 완료 — AppNav Phase 19 쪽지 아이콘 추가
- **현재 담당**: PM (커밋 + push)
- **브랜치**: subin

### 구현 기록 (Phase C — AppNav frozen Phase 19 운영 동기화)

📝 구현 내용: `src/components/bdr-v2/app-nav.tsx` Phase 19 쪽지 아이콘 추가. AppNav frozen `uploads/03 §1` 시안 기준으로 운영 코드 동기화. main bar 우측 = 검색 → 쪽지(신규) → 알림 → 다크 → 햄버거 5컨트롤. /messages 라우트는 **이미 운영 중** (Phase 8 박제) → 신규 stub 불필요. /profile 본문 v2.4 동기화는 v2.3 ↔ v2.4 `diff -w` 빈 출력 → **Skip**.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/components/bdr-v2/app-nav.tsx | 검색 ↔ 알림 사이에 쪽지 Link 신규 (Material Symbols `mail_outline`, href=/messages, app-nav__icon-btn 클래스, 로그인 시에만 표시). 빨간 점 뱃지 No-badge 시작 (운영에 messages unread prop 미존재 — 후속 큐) | 수정 |

🔧 핵심 패턴:
- **AppNav frozen 1:1 카피** — uploads/03 §1 코드 순서(검색 → 쪽지 → 알림) 그대로 운영에 반영. 알림은 기존 코드 그대로 보존
- **app-nav__icon-btn 클래스** — 검색/쪽지/알림 모두 동일 (border/box 없음, 룰 5)
- **Material Symbols** — `mail_outline` 1종 추가 (lucide-react 0)
- **/messages 라우트** — Phase 8 (Dev/design/BDR v2/screens/Messages.jsx) 박제로 이미 운영 중 (3컬럼 list/thread/profile + 모바일 푸시-네비)
- **빨간 점 뱃지** — frozen 코드는 항상 점 표시 / 운영은 unread API 미연계 → 일단 점 미표시. 후속 큐 (messages unread API 추가 시 prop + 조건부 표시)

🔧 자동 검수 (06 self-checklist + 작업 프롬프트):
| 검수 항목 | 기대 | 결과 |
|----------|------|------|
| RDM rdm_captain / 아바타 닉네임 추가 | 0 | 0 ✓ |
| Phase 19 mail_outline + /messages | 1+ | 3 ✓ (link href + icon + 코멘트) |
| app-nav__icon-btn (검색/쪽지/알림 3 Link) | 3+ | 3 ✓ |
| btn--sm 검색/쪽지/알림 위반 | 0 | 0 ✓ |
| TypeScript strict (tsc --noEmit) | 0 에러 | EXIT=0 ✓ |
| /messages 라우트 존재 | 1 | 1 ✓ (Phase 8 박제) |
| /profile 본문 v2.3 ↔ v2.4 diff -w | 0 | 0 ✓ Skip |

💡 tester 참고:
- 테스트 방법: 로그인 후 데스크톱 헤더 우측 = ThemeSwitch + 검색 + 쪽지 + 알림 + (모바일 햄버거) 5개 / 비로그인 = 검색 + 로그인 버튼 + 햄버거
- 정상 동작: (1) 쪽지 아이콘 클릭 → /messages 이동 (3컬럼 메신저 UI) (2) 모바일(<720px) 쪽지 아이콘 노출 (3) 데스크톱 hover 시 var(--bg-alt) 배경 hover 효과
- 주의할 입력: (a) 비로그인 사용자에 쪽지 아이콘 표시 X (user 가드) (b) /messages 페이지는 "준비 중" 안내 + 더미 데이터 (Phase 8 박제 그대로) (c) 빨간 점 뱃지 일단 표시 X — unread API 추가 시 활성화

⚠️ reviewer 참고:
- AppNav frozen `uploads/03 §1` 시안과의 차이: (1) 운영은 다크모드 토글이 우측 끝이 아닌 좌측 (ThemeSwitch 시안과 같음) — 기존 운영 패턴 보존 (2) 운영 빨간 점 표시는 unreadCount prop 기반 — 시안은 무조건 표시. 운영 안정성 우선
- Link href="/messages" 신규 매칭으로 운영 페이지(`src/app/(web)/messages/page.tsx`) 자동 연결. 추가 라우트 작업 0
- /profile 본문 동기화 결정: v2.3 시안과 v2.4 시안 `diff -w` 0 출력 — Skip 정합. 사용자 결정 "B" (Skip 옵션) 일치

📦 다음 PM 액션:
- 커밋 1건 (subin): `feat(app-nav): Phase 19 쪽지 아이콘 추가` → push origin subin
- Phase D 4 병렬 위임 가능 (PM 결정 큐 활용)
- 후속 큐: messages unread count API + AppNav prop 활성화 (별도 작업)

## 진행 현황표

| 영역 | 작업 | 상태 |
|------|------|------|
| 디자인 시안 박제 (Phase 9) | 31% (32/117) | ⏳ |
| Phase 10 운영 DB | 4 테이블 적용 | ✅ |
| BDR v2.4 시안 자체 정리 | Phase A+B (16 파일) | ✅ |
| BDR v2.4 운영 동기화 P0 | Phase C: AppNav Phase 19 + Profile Skip | ✅ |
| Phase 12 (시즌 통계 + Portone) | schema/SQL/API/UI 4단계 | ✅ |
| 헤더 구조 정리 | 더보기 가짜 4건 제거 + Phase 19 쪽지 | ✅ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-04-30 | (미커밋, subin) | **Phase C — AppNav frozen Phase 19 쪽지 아이콘 운영 동기화** (developer): `src/components/bdr-v2/app-nav.tsx` 검색 ↔ 알림 사이에 쪽지 Link 신규 — Material Symbols `mail_outline` + href=/messages + `app-nav__icon-btn` + 로그인 가드. /messages 라우트는 Phase 8 박제로 이미 운영 중 → stub 신규 0. 빨간 점 뱃지 No-badge 시작(messages unread prop 미존재 — 후속 큐). /profile 본문은 v2.3 ↔ v2.4 `diff -w` 0 출력으로 Skip. 검수 6 케이스 모두 통과 (RDM 위반 0 / mail_outline 매칭 3 / icon-btn 3 Link / btn--sm 위반 0 / tsc 0 / /messages 존재). 변경: 수정 1 파일(+18/-1). | ✅ |
| 2026-04-30 | (커밋 2건 대기, subin) | **v2.4 시안 자체 정리 Phase A + B 일괄** (developer): `Dev/design/BDR v2.4/` 시안 자체 박제 룰 적용 (운영 코드 변경 0). Phase A AppNav frozen (uploads/03 §1) 카피 — 9탭(더보기 9번째) + ThemeSwitch viewport 분기 + util-left class + Phase 19 Icon.mail + 우측 5컨트롤 + drawer 5그룹. moreGroups: bracket/tournamentEnroll/guestApply/refereeRequest 4건 제거(PM 큐) + communityNew/gameNew + refereeInfo 별칭. screens/_archived/ 폴더 (4건 격리). RefereeInfo.jsx 신규. tokens.css frozen CSS 6종. Phase B 카피 룰 11/12/13 — "서울 3x3 농구" 5건 / "다음카페" 4건 / placeholder "예:" 12건 / pill 999px 2건 일괄 픽스. 자동 검수 13 케이스 통과. 변경: 16 파일. PM 결정 큐 3건. | ✅ |
| 2026-05-01 | (변경 0, 커밋 0) | **v2.3 P1 영역 A+B+C+D 동기화 검증** (developer): EditProfile/Settings/Billing/MyActivity v2.2 ↔ v2.3 시안 byte 차이는 EOL 변환만(`diff -w` 0) — 박제 코드 변경 0. tsc 0 에러. PM 액션: 시안 변경 의도 있었다면 시안 누락 가능성. | ✅ |
| 2026-05-01 | (미커밋, subin) | **v2.3 마이페이지 hub 박제 — `/profile` Profile.jsx 1:1** (developer): Profile.jsx 시안 박제. page.tsx user select +name_verified / teamMember select 모드 / game_applications findMany take:3 / nextGames status:Int 0/1 보존 / HeroCard +jerseyNumber, UpcomingGames game→games 배열. _v2/hero-card.tsx 메타 1줄 "팀·포지션·#N" + flexWrap. _v2/team-side-card.tsx +wins/losses/draws + "12W 5L · 외 N팀". _v2/upcoming-games.tsx + status:number\|null + scheduledAt non-null + badgeFor() 헬퍼. _v2/season-stats.tsx + .season-stats-grid. globals.css 720 미디어 룰 3종 추가. **API fetch 0 변경** (select 컬럼만 추가). 변경: 6 파일. | ✅ |
| 2026-04-30 | (커밋 2건 대기, subin) | **P0 Step 4 + 5 백버튼 18 페이지 + 커뮤니티 모바일 탭** (developer): `page-back-button.tsx`(60줄) 신규 + history.length 가드 + fallbackHref + lg:hidden + 44px. profile 9 + organizations 4 + courts 5 = 18 페이지 일괄. community-aside.tsx fragment 분기 모바일 8 카테고리 가로 스크롤 탭. globals.css `.aside-mobile-tabs` +50줄. tsc 0. 변경: 21 파일. | ✅ |
| 2026-04-30 | (미커밋, subin) | **P0 Step 1 + 3 가입+대회 흐름 + 404** (developer): onboarding/setup done "프로필 추가 완성하기 →" CTA / tournaments/[id]/join "내 신청 내역 보기" 1순위 CTA / pricing/checkout 401 redirect 보존 + isValidRedirect / (web)/not-found.tsx 신규(60줄, search_off + 3 CTA). 변경: 4 파일. tsc 0. | ✅ |
| 2026-04-30 | (미커밋, subin) | **프로필 입력창 모바일 가독성** (developer): /profile/edit 캡처 51 픽스 — .profile-edit-row 768 1열 stack + 720 input padding 44px 터치 + .btn--sm 보강. 변경: 2 파일. tsc 0. | ✅ |
| 2026-04-30 | (미커밋, subin) | **Phase 12-3 + 12-4 API + ProfileGrowth 데이터 연결** (developer): `api/web/identity/verify`(87줄) Portone mock POST + zod + name 동기화. `api/web/profile/season-stats`(88줄) UserSeasonStat GET + Decimal·BigInt 직렬화 + 빈 시즌 unshift. profile/growth 마일스톤 4종 데이터 연결 (누적 경기/평균 평점/MVP/순위). 12주 spark/평점 line 더미 유지(별도 큐). 변경: 3 파일. tsc 0. | ✅ |
| 2026-04-30 | (미커밋, subin) | **Phase 12-1 + 12-2 schema + dev DB push + 운영 SQL** (developer): User 본인인증 5컬럼 + 4 relation + 신규 모델 3(UserSeasonStat/ShotZoneStat/ScoutingReport). dev DB push 완료. 운영 SQL `phase_12_combined.sql`(115줄, 트랜잭션 + IF NOT EXISTS). 운영 미적용 — dev 1주 안정화 후 사용자 직접. 변경: 2 파일. | ✅ |
| 2026-04-30 | (계획서, subin) | **Phase 12 통합 계획서** (planner-architect): `phase-12-plan-2026-04-30.md` — 옵션 3종(12-A 6h / 12-B 통합 10h ⭐ / 12-AC 풀) + 통합 마이그 SQL + 9단계 + PM 결정 7건. | ✅ |
