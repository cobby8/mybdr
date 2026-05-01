# 클로드 디자인 업그레이드 프롬프트 — 2026-04-30

> **사용법**: 아래 § "프롬프트 (복사 시작)" 부터 § "프롬프트 (복사 끝)" 까지 통째로 복사해서 클로드 디자인에 붙여넣기.
> **작성**: BDR (MyBDR) — 농구 매칭 플랫폼 / Phase 9 시안 박제 진행 중
> **시안 버전 목표**: BDR v2.1 → BDR v2.2 (이 작업의 산출물)

---

## 프롬프트 (복사 시작)

# BDR (MyBDR) 디자인 업그레이드 의뢰 — Phase 11 (BDR v2.2)

당신은 BDR(농구 매칭 플랫폼 MyBDR)의 디자인 시스템을 업그레이드하는 시니어 프로덕트 디자이너입니다. 이번 작업의 산출물은 **`Dev/design/BDR v2.2/`** 폴더로, 클로드 CLI가 그대로 박제할 수 있는 상태가 되어야 합니다.

---

## 1. 프로젝트 컨텍스트

### 1-1. 무엇을 만드는 플랫폼인가
- **MyBDR (Basketball Daily Routine)** — 전국 농구 매칭 플랫폼 (서울 3x3 한정 X)
- 코트 예약 / 픽업 게임 / 게스트 모집 / 토너먼트 참가 / 팀 운영 / 심판 배정 통합
- 다크모드 기본 (쿨 그레이 + BDR Red `#E31B23`)

### 1-2. 디자인 시스템 (BDR v2.1 시안 기반)
- **색상**: BDR Red `#E31B23` (primary) + BDR Navy `#1B3C87` (accent) + 쿨 그레이 중성색
- **폰트**: Pretendard (한글 본문) + Space Grotesk (영문 제목)
- **아이콘**: Material Symbols Outlined **만 사용** (lucide-react 등 외부 라이브러리 금지)
- **버튼 라운딩**: 4px (pill 9999px **금지**)
- **금지 색상**: 핑크/살몬/코랄/따뜻한 베이지 (모든 hex 변형 포함)
- **다크/라이트** 동시 지원 (CSS 변수 토큰 기반)
- **모바일 브레이크포인트**: 720px (이하 = phone, 1024px = lg)
- **컨테이너**: 데스크톱 max-width 1200px, gutter 24px / 모바일 14px

### 1-3. 시안 진행 상황 (Phase 9 → Phase 11 브리지)
- **현재 박제율**: 32 / 117 페이지 (27%) — A등급(완벽) 32, B등급(80%+) 14, C등급(부분) 9, D등급(박제 안됨) 11, E등급(시안 외) 50, F등급(라우트 누락) 1
- **시안 폴더**: `Dev/design/BDR v2.1/` (이미 통합됨)
- **컴포넌트 시스템**: tokens.css / components.jsx / data.jsx / extras-data.jsx / responsive.css / MyBDR.html / _mobile_audit.html

---

## 2. 사용자 직접 결정 (절대 회귀 금지) — 영구 보존

> 이 결정들은 사용자가 직접 지시·확정한 내역. 이 결정에 반하는 디자인 제안 금지. 본 항목과 충돌하는 변경은 사용자 확인 후에만 가능.

### 2-1. 헤더 (AppNav)
- **글로벌 헤더 단일화** — `(web)` 라우트 그룹은 AppNav 하나만. 페이지 안에 별도 nav 추가 X
- **utility bar (상단 파란 띠)**:
  - 좌측: "MyBDR 커뮤니티 / 소개 / 요금제 / 도움말" (모바일 hidden)
  - 우측: "계정 / 설정 / 로그아웃" (**모바일에서도 표시**)
- **main bar 우측 컨트롤**: 검색 + 알림 + 다크모드 토글 + 햄버거(모바일)
  - **삭제됨**: 더보기 드롭다운 트리거, 계정 아이콘+닉네임 (다시 추가 금지)
- **메인 탭 9개**: 홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/**더보기** (마지막 탭)
- **검색 + 알림**: btn--sm 박스 X → `app-nav__icon-btn` 아이콘만. 알림 빨간 점 뱃지 유지
- **다크모드 토글 — 하이브리드**:
  - 데스크톱 (md ≥ 768px): 두 라벨 토글 ("라이트 / 다크") — v2.1 시안 매칭
  - 모바일 (md < 768px): 단일 아이콘 토글 (☀/☾) — 햄버거 영역 압박 해소
- **AppNav 모바일 닉네임**: hidden (햄버거 충돌 방지)

### 2-2. 더보기 메뉴 (5그룹 IA)
- **5그룹**: 내 활동 / 경기·대회 / 등록·예약 / 둘러보기 / 계정·도움
- **DB 미지원 가짜링크 4건 영구 제거**: guestApps / gameResult / gameReport / referee
- **신규 진입점 8건 등록 완료**: courtAdd / teamManage / searchResults / editProfile / notificationSettings / safety / passwordReset / onboardingV2

### 2-3. 팀 페이지
- **팀 카드 간소화 (목록)**: 로고 + 팀명 + 창단년도 + 상세 보기 단일 버튼만 (세로 배치). 레이팅/승/패/매치신청 **노출 금지** (미구현)
- **팀 상세 히어로**: 레이팅 stat 제거 / 220px 워터마크 모바일 hidden / Avatar overflow-hidden + clamp 글자 크기
- **팀 생성**: 4스텝 (기본정보/엠블럼/활동/검토)
  - **홈/어웨이 유니폼 색상 분리** (단일 컬러 X)
  - **자유 컬러피커** (HTML5 native, preset 강제 X)
  - **로고 업로드 기본 제공** (BDR+ 멤버 게이트 X)

### 2-4. 프로필 페이지
- **ProfileSideNav 모바일 nav 제거** — PC 좌측 사이드바만. 모바일 가로 chip 통째 삭제
- **/profile/settings 메뉴 — 이모지 아이콘** 사용:
  - 👤 계정 / 🏀 프로필 / 🔔 알림 / 🔒 개인정보·공개 / 💳 결제·멤버십 / ⚠️ 계정 관리
- **/settings 더미 페이지** → /profile/settings redirect (8줄). 박제 시안 복원 금지
- **탭 강조선 3px 통일** (border-b-[3px])

### 2-5. 메인 (홈) 페이지
- **Hero 카로셀 3슬라이드**: 임박 대회 / 곧 시작 게임 / 최근 MVP
- 정적 fallback 1개 항상 보장 (BDR 커뮤니티 참여)
- 5초 자동 회전 / hover 일시정지 / prefers-reduced-motion OFF
- **외부 라이브러리 0** (HTML5 + 직접 touch)
- TEST 토너먼트 차단

### 2-6. 글로벌 카피
- 메인 슬로건: **"전국 농구 매칭 플랫폼"** (서울 3x3 한정 표현 금지)
- About 페이지 운영진: 일반 라벨 (기획팀/개발팀 등). 실명 박제 금지

### 2-7. 모바일 최적화
- **720px 통일 브레이크포인트**
- **글로벌 가드**: `@media (max-width: 768px)` html/body `overflow-x: hidden` + `max-width: 100vw`. `.page` 도 동일.
- **iOS 자동 줌 차단**: 720px 이하 input/select/textarea `font-size: 16px !important`
- **버튼 터치 타겟**: 720px 이하 `.btn min-height: 44px`
- **인라인 grid**: `gridTemplateColumns: repeat(N, 1fr)` 고정 폭 사용 시 모바일 분기 필수 (또는 `auto-fit, minmax(...)`)

### 2-8. 시안 적용 + 라이브 시 보존 (DB 미지원)
- DB 미지원 기능은 UI에서 제거하지 말고 **"준비 중"** 표시 + scratchpad 추후 구현 큐
- **alert("준비 중") 신규 추가 시 라우트 존재 여부 점검 필수** (existing 라우트 있으면 alert 금지)

---

## 3. 현재 사이트 페이지 인벤토리

### 3-1. (web) 사용자용 페이지 (총 100+) — 박제 등급별

#### A등급 (완벽 박제, 시안 1:1) — 32개

```
/                        (홈 — Home.jsx)
/about                   (About.jsx — 운영진 일반 라벨)
/awards                  (Awards.jsx)
/calendar                (Calendar.jsx — 7일 그리드 가로 스크롤 모바일)
/coaches                 (Coaches.jsx)
/community/new           (PostWrite.jsx)
/community/[id]          (PostDetail.jsx)
/courts/[id]/booking     (CourtBooking.jsx)
/forgot-password         (PasswordReset.jsx)
/gallery                 (Gallery.jsx)
/games/[id]/guest-apply  (GuestApply.jsx)
/games/[id]/report       (GameReport.jsx)
/guest-apps              (GuestApps.jsx)
/help                    (Help.jsx)
/match → /tournaments    (Match.jsx — 라우트 정책 결정 대기)
/messages                (Messages.jsx — msg-shell 3-col)
/onboarding/setup        (OnboardingV2.jsx)
/organizations/[slug]    (OrgDetail.jsx)
/pricing                 (Pricing.jsx)
/pricing/checkout        (Checkout.jsx)
/pricing/fail            (PricingFail.jsx)
/pricing/success         (PricingSuccess.jsx)
/privacy                 (Privacy.jsx)
/profile/billing         (Billing.jsx)
/profile/edit            (EditProfile.jsx)
/profile/activity        (MyActivity.jsx)
/profile/settings        (Settings.jsx — 6 섹션 + 이모지 아이콘)
/profile/achievements    (Achievements.jsx)
/safety                  (Safety.jsx)
/saved                   (Saved.jsx)
/reset-password          (PasswordReset.jsx)
/reviews                 (Reviews.jsx)
/scrim                   (Scrim.jsx)
/search                  (Search.jsx)
/series                  (Series.jsx)
/series/new              (SeriesCreate.jsx)
/series/[slug]           (SeriesDetail.jsx)
/shop                    (Shop.jsx)
/stats                   (Stats.jsx)
/team-invite             (TeamInvite.jsx)
/teams/[id]/manage       (TeamManage.jsx)
/terms                   (Terms.jsx)
/tournaments             (Match.jsx 목록)
/tournaments/[id]        (Match.jsx 상세)
/tournaments/[id]/join   (TournamentEnroll.jsx)
/tournaments/[id]/referee-request  (RefereeRequest.jsx)
/courts/submit           (CourtAdd.jsx)
/verify                  (Verify.jsx)
```

#### B등급 (80%+ 박제, 디테일 누락) — 14개
```
/                        (홈 hero 카로셀 보강 필요)
/games                   (Games.jsx — 필터 칩 보강)
/games/my-games          (MyGames.jsx — alert 6건 정리)
/games/[id]              (GameDetail.jsx)
/teams                   (Team.jsx — 지역/정렬 필터 v2 신규)
/teams/[id]              (TeamDetail.jsx)
/courts                  (Court.jsx)
/courts/[id]             (CourtDetail.jsx)
/organizations           (Orgs.jsx)
/profile                 (Profile.jsx — 시즌/슛존 탭 누락)
/users/[id]              (PlayerProfile.jsx)
/login                   (Login.jsx)
/signup                  (Signup.jsx)
/notifications           (Notifications.jsx)
```

#### C등급 (부분 박제) — 9개
```
/community               (BoardList.jsx — 헤더 코멘트 누락)
/rankings                (Rank.jsx — wrapper 코멘트)
/help/glossary           (Help.jsx 일부 — redirect 검토)
/safety                  (Safety.jsx — 진입점 부재)
/scrim                   (Scrim.jsx — DB 미연결, alert 다수)
/match                   (Match.jsx — 진입점 0건, DB 미연결)
/onboarding/setup        (회원가입 직후 자동 redirect 미구현)
/courts/[id]/manage      (시안 외 자체 — E 재분류 가능)
/notifications           (actionUrl 클릭 복귀 — 픽스됨)
```

#### D등급 (박제 안됨, 시안 톤 미적용) — 11개 ★ 이번 업그레이드 핵심 대상
```
🔴 /community/[id]/edit   (PostWrite.jsx 패턴 차용 필요)
🔴 /games/[id]/edit       (CreateGame.jsx 3카드 분할 패턴)
🔴 /games/new             (NewGameForm 박제 검수)
🔴 /teams/new             (NewTeamForm 박제 검수 — 4스텝 + 자유 컬러피커)
🔴 /profile/bookings      (시안 없음 → 자체 디자인 신규 필요)
🔴 /profile/growth        (Profile.jsx 게이미피케이션 톤)
🔴 /profile/weekly-report (시안 없음 → 자체 디자인)
🔴 /profile/complete      (OnboardingV2.jsx 톤 일치)
🔴 /profile/complete/preferences (단계 페이지 v2)
🔴 /venues/[slug]         (CourtDetail.jsx 응용)
🔴 /help/glossary         (/help redirect 또는 v2 재박제)
```

#### F등급 (시안 있는데 라우트 없음) — 1개
```
/referee   (Referee.jsx — 사용자용 vs 심판 플랫폼 충돌. 정책 결정 필요)
```

### 3-2. /admin 자체 영역 (시안 외) — 18개

> 별도 디자인 시스템 가능. v2 토큰만 일치하면 OK. **이번 업그레이드 대상 X** (백오피스 우선순위 낮음)

```
/admin                /admin/analytics       /admin/campaigns       /admin/community
/admin/courts         /admin/game-reports    /admin/games           /admin/logs
/admin/notifications  /admin/organizations   /admin/partners        /admin/payments
/admin/plans          /admin/settings        /admin/suggestions     /admin/teams
/admin/tournaments    /admin/users
```

### 3-3. /tournament-admin (시안 외) — 20개 + /partner-admin 4개 + /referee 28개 + /_site 6개

→ 시안 외 자체 영역. 디자인 토큰 일치만 검수.

---

## 4. 잔여 갭 (이번 업그레이드의 작업 대상)

### 4-1. 🔴 D등급 11개 — 신규 시안 작업 필요

각 페이지마다:
- **Why (목적)** — 사용자가 이 페이지에서 뭘 해야 하는가
- **Layout** — 데스크톱 / 모바일 와이어프레임
- **Components** — 어떤 컴포넌트 (eyebrow / card / form / button)
- **Interaction states** — empty / loading / success / error / disabled
- **Connections** — 어디서 들어오고 어디로 나가는가 (다음 §6 참조)

### 4-2. F등급 1개 — Referee.jsx 정책 결정

옵션 A: 시안 폐기 (사용자용 라우트 안 만듦)
옵션 B: `/referee-info` 같은 SEO 페이지 신규 (기존 `/referee` 심판 플랫폼과 분리)
옵션 C: `/referee` 메인 대시보드의 빈 상태 UI 에 시안 톤 차용

### 4-3. UI 깨진 페이지 (모바일 회귀 위험) — v2.1 매처에 안 잡힘

```
/live/[id] tab-players          14열 grid (라이브 경기 기록) → 가로 스크롤 래퍼
/stats                          8/11열 stat 표 → 가로 스크롤 또는 data-table
/rankings v2-team-board         6열 표 → DataTableV2 변환
/rankings v2-player-board       8열 표 → DataTableV2
/safety 5열 비교 표              data-table
/pricing 4열 비교 표             data-table
/signup positions                repeat(5, 1fr) 모바일 → repeat(2/3)
```

### 4-4. 회귀된 라우트 — `/live/[id]` finished 분기 (P0-5)

- 박제 시 옛 레이아웃·기능이 누락됨
- **시안 룰**: "색/폰트만 v2 유지 + 레이아웃·기능 옛 디자인 복원"

---

## 5. 디자인 업그레이드 명세 (이번 의뢰)

### 5-1. 산출물 폴더 구조 — `Dev/design/BDR v2.2/`

```
Dev/design/BDR v2.2/
├── tokens.css                  (BDR v2.1 동일, 변경 시 명시)
├── components.jsx              (moreGroups 5그룹 + AppNav v2.1 결정 그대로)
├── data.jsx                    (BDR v2.1 동일)
├── extras-data.jsx             (OPEN_RUNS + 신규 D등급 페이지 데이터)
├── responsive.css              (v2.1 + G-10 가로 스크롤 + 큰 표 분기 추가)
├── MyBDR.html                  (라우트 추가: 11 D등급 + Referee 결정)
├── _mobile_audit.html          (그룹 추가: D등급 + 회귀 페이지)
├── _mobile_audit_report.html   (자체 모바일 감사)
├── README.md                   (v2.1 → v2.2 변경 요약)
└── screens/
    ├── (BDR v2.1 의 72 파일 모두 보존)
    ├── PostEdit.jsx            (신규 — /community/[id]/edit)
    ├── GameEdit.jsx            (신규 — /games/[id]/edit)
    ├── ProfileGrowth.jsx       (신규 — /profile/growth)
    ├── ProfileBookings.jsx     (신규 — /profile/bookings)
    ├── ProfileWeeklyReport.jsx (신규 — /profile/weekly-report)
    ├── ProfileComplete.jsx     (신규 — /profile/complete)
    ├── VenueDetail.jsx         (신규 — /venues/[slug])
    ├── LiveResult.jsx          (회귀 픽스 — /live/[id] finished, 옛 레이아웃 복원)
    └── (기타 잔여 페이지 시안)
```

### 5-2. 신규 시안 작업 — D등급 11개

각 페이지에 대해 다음 항목 모두 명세:

#### 5-2-1. `PostEdit.jsx` (`/community/[id]/edit`)
- **Why**: 본인 게시글 수정 (제목 / 본문 / 카테고리 / 첨부 사진)
- **시안 패턴**: PostWrite.jsx 와 동일하되, 기존 데이터 prefill + "취소"·"수정 완료" 액션
- **Connection**:
  - 진입: `/community/[id]` 의 본인 글에서 "수정" 메뉴 (점-3개 dropdown)
  - 복귀: 수정 후 → `/community/[id]` (수정된 상세) / 취소 → `/community/[id]`
- **Empty / Error**: 권한 없음 (작성자 != 본인) → "수정 권한 없음" + 상세 페이지 복귀 버튼

#### 5-2-2. `GameEdit.jsx` (`/games/[id]/edit`)
- **Why**: 본인 호스트 경기 수정 (날짜 / 코트 / 인원 / 회비 / 모집 조건)
- **시안 패턴**: CreateGame.jsx 의 3카드 분할 (when/where + conditions + advanced)
- **Connection**:
  - 진입: `/games/[id]` 호스트 본인일 때 "경기 수정" 버튼
  - 복귀: 저장 → `/games/[id]` / 취소 → `/games/[id]`
- **Edge cases**: 신청자 0명 일 때만 일부 필드 편집 가능 (예: 인원 변경)

#### 5-2-3. `ProfileGrowth.jsx` (`/profile/growth`)
- **Why**: 사용자 성장 트래킹 (경기 수 / 평점 추이 / 마일스톤)
- **시안 패턴**: Profile.jsx 의 게이미피케이션 카드 톤 + `/profile/achievements` 와 일관
- **Connection**:
  - 진입: `/profile` 본인 프로필 → "내 성장" 카드 / `/profile/settings` 의 프로필 탭에서 링크
  - 복귀: AppNav 뒤로가기 / 햄버거 → `/profile`
- **Data**: DB 미구현 부분은 더미 + "준비 중" 라벨

#### 5-2-4. `ProfileBookings.jsx` (`/profile/bookings`)
- **Why**: 본인 예약 내역 (코트 예약 / 토너먼트 신청 / 게스트 신청)
- **시안 패턴**: 카테고리별 카드 + 상태 필터 (예약중 / 완료 / 취소)
- **Connection**:
  - 진입: `/profile/settings` 빌링 탭 / `/games/my-games` 옆 탭 / 더보기 메뉴
  - 복귀: 항목 클릭 → 해당 상세 (`/courts/[id]` 또는 `/tournaments/[id]`) / 뒤로 → `/profile`

#### 5-2-5. `ProfileWeeklyReport.jsx` (`/profile/weekly-report`)
- **Why**: 주간 활동 요약 (이번 주 경기 / 평균 평점 / 다가올 경기)
- **시안 패턴**: 캘린더 미니뷰 + 활동 그래프 + 다음 액션 추천
- **Connection**:
  - 진입: `/profile` 본인 프로필 → "이번 주 요약" 카드 / 주간 알림 (cron) 클릭
  - 복귀: 액션 클릭 → 해당 페이지 / 뒤로 → `/profile`

#### 5-2-6. `ProfileComplete.jsx` (`/profile/complete`)
- **Why**: 가입 후 프로필 완성 유도 (포지션 / 키 / 활동 지역 / 사진)
- **시안 패턴**: OnboardingV2.jsx 의 단계형 폼 (M5 압축)
- **Connection**:
  - 진입: 신규 가입 → `/verify` 직후 자동 redirect / `/profile` 의 "프로필 완성도 60%" 배너
  - 복귀: 완료 시 → `/onboarding/setup` 또는 `/` (홈)

#### 5-2-7. `VenueDetail.jsx` (`/venues/[slug]`)
- **Why**: 공개 SEO 코트 페이지 (비로그인 열람 가능)
- **시안 패턴**: CourtDetail.jsx 의 히어로 + 정보 카드 차용 (단순화)
- **Connection**:
  - 진입: 외부 검색엔진 (SEO) / 코트 공유 링크
  - 복귀: 비로그인 → `/login` 유도 / 로그인 → `/courts/[id]` 의 풀 기능 페이지로 자동 redirect 옵션

#### 5-2-8. 기타 (`/help/glossary`, `/profile/complete/preferences`, NewGameForm 검수, NewTeamForm 검수)
- 각각 명세 — 글로사리 redirect 또는 v2 박제 / 단계 페이지 / 폼 컴포넌트 검수

### 5-3. 회귀 픽스 — `LiveResult.jsx` (`/live/[id]` finished)

- **시안 룰**: 색/폰트만 v2 유지 + 레이아웃·기능 옛 디자인 복원
- 옛 레이아웃 핵심: 큰 스코어보드 / 쿼터별 점수 / MVP / 경기원 평가 진입점 / "기록 보기" 액션
- v2 적용 부분: 색상 토큰 / 폰트 / 카드 라운딩 4px / 모바일 그리드

### 5-4. 모바일 깨짐 회귀 픽스

다음 패턴들을 `responsive.css` 에 G-10 으로 추가:

```css
/* G-10: 큰 N열 표 가로 스크롤 보존 (v2.1 매처 안 잡힘) */
@media (max-width: 720px) {
  .page div[style*="grid-template-columns: repeat(7"],
  .page div[style*="grid-template-columns: repeat(8"],
  .page div[style*="grid-template-columns: repeat(9"],
  .page div[style*="grid-template-columns: repeat(10"],
  .page div[style*="grid-template-columns: repeat(11"],
  .page div[style*="grid-template-columns: repeat(12"],
  .page div[style*="grid-template-columns: repeat(13"],
  .page div[style*="grid-template-columns: repeat(14"] {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  /* G-9 보호: 1fr auto 1fr (스코어보드) 모바일 1열 stack 차단 */
  .page div[style*="grid-template-columns: 1fr auto 1fr"]:not([data-keep-cols]):not(.scoreboard) {
    grid-template-columns: 1fr !important;
  }
  .page .scoreboard,
  .page [data-keep-cols] {
    /* 다열 모바일 유지 (사용자 의도 보존) */
  }
}
```

---

## 6. 페이지 간 연결성 명세 (필수 검증)

이번 업그레이드의 핵심 요구: **모든 페이지에 "어디서 왔는가" + "어디로 가는가" + "어떻게 돌아가는가"** 명시.

### 6-1. 글로벌 네비게이션 (모든 페이지 공통)

- **AppNav 단일 헤더** (글로벌, 모든 페이지 상단):
  - 로고 클릭 → `/`
  - 메인 탭 9개 → 해당 라우트
  - 더보기 → 5그룹 패널
  - 검색 / 알림 / 다크모드 / 햄버거(모바일) 우측

- **뒤로가기 패턴**:
  - **모바일**: 헤더 좌측 ← 아이콘 (브레드크럼 대체)
  - **데스크톱**: 페이지 상단 breadcrumb (예: `홈 / 팀 / 리딤`)
  - 폼 페이지 (글쓰기/수정/생성): "취소" 버튼 (router.back)

### 6-2. 페이지별 진입·복귀 매트릭스 (D등급 + 회귀 페이지)

```
페이지                       진입 (어디서)                    복귀 (어디로)
─────────────────────────────────────────────────────────────────────────
/community/[id]/edit         /community/[id] "수정" 메뉴      → /community/[id] (저장/취소)
/games/[id]/edit             /games/[id] "경기 수정" 버튼     → /games/[id] (저장/취소)
/games/new                   /games "+ 경기 등록" / 더보기    → /games/[id] (생성 후) / /games (취소)
/teams/new                   /teams "+ 팀 만들기" / 더보기   → /teams/[id] (생성 후) / /teams (취소)
/profile/growth              /profile "내 성장" 카드          → /profile (뒤로)
/profile/bookings            /profile/settings 빌링 / 더보기  → 항목별 상세 / /profile (뒤로)
/profile/weekly-report       /profile 주간 카드 / 알림        → /profile (뒤로)
/profile/complete            /verify 자동 / 미완성 배너       → /onboarding/setup / / (완료 시)
/venues/[slug]               외부 SEO / 코트 공유 링크         → /login (비로그인) / /courts/[id] (로그인)
/live/[id] finished          /live/[id] (경기 종료 자동)      → /games/[id] / /games/my-games (목록)
```

### 6-3. 깊은 흐름 — 핵심 사용자 여정 (Critical Path)

#### 여정 A: 신규 가입 → 첫 경기 신청
```
/signup → /verify → /onboarding/setup → /profile/complete (선택) →
→ / (홈) → /games → /games/[id] → "신청" → /pricing/checkout (필요시) →
→ /games/my-games → /games/[id]/report (경기 후)
```

#### 여정 B: 게스트 모집 → 호스트 → 평가
```
/games/new → /games/[id] (호스트 뷰) → 신청자 수락 →
→ 경기 종료 → /live/[id] (경기 진행) → /live/[id] finished →
→ /games/[id]/report (호스트 평가) → /profile/activity
```

#### 여정 C: 팀 생성 → 운영
```
/teams/new (4스텝) → /teams/[id] (생성된 팀) → /teams/[id]/manage →
→ 멤버 초대 / 매치 신청 / 토너먼트 참가 등
```

#### 여정 D: 토너먼트 참가
```
/tournaments → /tournaments/[id] → /tournaments/[id]/join (4스텝) →
→ /pricing/checkout (참가비) → /tournaments/[id]/teams (확정 후) →
→ /tournaments/[id]/bracket / schedule
```

이 4 여정을 각 D등급 시안에 반영. **모든 페이지가 적어도 1개 critical path 에 속해야 함**.

---

## 7. 일관성 룰 (모든 시안 적용)

### 7-1. 페이지 셸 구조
```jsx
<div className="page">                     // 또는 .page--wide
  <div className="eyebrow">EYEBROW · CATEGORY</div>
  <h1>페이지 제목</h1>
  <p className="page__sub">서브 텍스트</p>

  {/* 본문 콘텐츠 */}
  <div className="card">{/* 카드 */}</div>
</div>
```

### 7-2. 폼 페이지 표준
- 카드 컨테이너 + eyebrow + h1 + 필드 그룹 + 액션 영역 (취소 / 저장)
- 필수 필드: 빨간 별표 또는 "필수"
- 에러 상태: 인풋 border-red + 에러 메시지 below
- 성공 상태: 토스트 또는 confirmation 화면
- 저장 중: 버튼 disabled + spinner

### 7-3. 리스트 페이지 표준
- 검색바 + 필터 칩 + 정렬 select + 카드 그리드
- Empty: 일러스트 + 짧은 설명 + 1차 CTA
- Loading: 스켈레톤 카드 (3-6개)
- Pagination 또는 무한 스크롤

### 7-4. 상세 페이지 표준
- 히어로 (배경/제목/메타) + 탭 네비 + 탭별 콘텐츠
- breadcrumb (상위 / 본 페이지)
- 사이드바 (관련 액션 / 메타 정보)

### 7-5. 빈 상태 / 에러 / 권한 없음
- **빈 상태**: 일러스트 + "아직 X가 없어요" + 1차 액션
- **권한 없음**: 자물쇠 아이콘 + "권한이 필요합니다" + 로그인/복귀 버튼
- **404**: BDR 농구 일러스트 + "페이지를 찾을 수 없어요" + 홈 복귀 버튼
- **에러**: 빨간 alert 카드 + 재시도 버튼

### 7-6. 모바일 반응형
- 모든 grid 인라인 style 은 `repeat(N, 1fr)` 또는 `MMpx 1fr` 패턴 사용 시 720px 미만에서 1열 stack
- 표 형 콘텐츠 (5열+) 는 가로 스크롤 또는 카드형 변환
- aside 사이드바는 모바일에서 main 위로 이동 + sticky 해제
- 폰트 크기: H1 28→22, H2 22→18, body 14→13

---

## 8. 기능 보존 룰 (회귀 0)

업그레이드된 시안이 **기존에 동작하던 기능을 절대 제거하면 안 됨**. 박제 회귀 점검 5항목:

1. ✅ 옛 페이지의 카드/탭/CTA 모두 시안에 보존되었는가
2. ✅ 권한 분기 (isCaptain / isPro 등) 보존되었는가
3. ✅ 진입점 (다른 페이지에서 이 페이지로 오는 길) 끊기지 않았는가
4. ✅ 데이터 fetching 흐름이 박제 후에도 가능한가
5. ✅ 모바일에서도 모든 기능 사용 가능한가

### 8-1. 검수 매트릭스

각 D등급 시안 작성 후 다음 매트릭스 표를 시안에 첨부:

| 기능 | 옛 페이지 | 시안 v2.2 | 진입점 보존 | 모바일 동작 |
|------|----------|---------|-----------|-----------|
| (예: 게시글 수정) | ✅ /community/[id]/edit 옛 디자인 | ✅ PostEdit.jsx | ✅ /community/[id] dropdown | ✅ 모바일 1열 |
| ... | | | | |

### 8-2. 시안 외 기능 처리

DB 미구현 기능은 다음 중 1택:
- **A. UI 자리만 박제** + "준비 중" 배지 + scratchpad 추후 구현 큐 추가
- **B. UI에서 제거** + phase-9-future-features.md 큐로 이관
- **C. 기존 라우트로 대체 진입점 변경** (예: `/games/[id]/report` 라우트 존재 → alert 대신 Link)

---

## 9. 산출물 체크리스트 (의뢰 완료 기준)

- [ ] `Dev/design/BDR v2.2/` 폴더 생성 (BDR v2.1 모든 파일 보존)
- [ ] `tokens.css` (필요 시 변경 사항 명시)
- [ ] `components.jsx` (AppNav v2.1 결정 그대로 + 신규 컴포넌트)
- [ ] `extras-data.jsx` (신규 D등급 페이지 더미 데이터)
- [ ] `responsive.css` (v2.1 + G-10 가로 스크롤 + G-9 보호 가드 추가)
- [ ] `MyBDR.html` (라우트 11+ 추가)
- [ ] `_mobile_audit.html` (그룹 추가)
- [ ] **`README.md`** — v2.1 → v2.2 변경 요약 (신규 시안 / 변경 시안 / 삭제 시안)
- [ ] **`screens/`** — D등급 11 신규 + LiveResult 회귀 픽스
- [ ] **검수 매트릭스** — 각 신규 시안에 §8-1 표 첨부
- [ ] **연결성 매트릭스** — §6-2 표 시안 별로 채워서 첨부

---

## 10. 우선순위 (시안 작성 순서)

### 🔴 P0 (이번 의뢰 핵심) — 사용자가 직접 영향 받는 페이지
1. `PostEdit.jsx` — 게시글 수정 (사용자 일상 사용)
2. `GameEdit.jsx` — 경기 수정 (호스트 일상 사용)
3. `LiveResult.jsx` — 회귀 픽스 (긴급)
4. `ProfileComplete.jsx` — 신규 가입 핵심 흐름
5. `responsive.css` G-10 추가 (모바일 깨짐 즉시 해소)

### 🟠 P1 (사용자 경험 향상)
6. `ProfileGrowth.jsx`
7. `ProfileBookings.jsx`
8. `VenueDetail.jsx`
9. `ProfileWeeklyReport.jsx`

### 🟡 P2 (보조 페이지)
10. `ProfileComplete/preferences.jsx`
11. `/help/glossary` redirect 또는 박제

### 🟢 P3 (정책 결정 후)
12. `Referee.jsx` — F등급 정책 (옵션 A/B/C)

---

## 11. 작업 시작 시 첫 응답 형식 (필수)

이 프롬프트를 받은 직후, 다음 형식으로 한 번 응답:

```
✅ BDR v2.2 디자인 업그레이드 의뢰 확인 완료.

이해한 내용 요약:
- 사용자 직접 결정 [N건] 영구 보존 (회귀 금지)
- D등급 11개 신규 시안 + 회귀 픽스 1건 + 모바일 G-10 추가
- 산출물: Dev/design/BDR v2.2/ 폴더 (BDR v2.1 보존 + 신규)
- 페이지 간 연결성 매트릭스 시안별 첨부

질문 / 가정:
1. (필요한 경우 PM 결정 항목 1-2개 제안)
2. ...

작업 시작 순서: P0-1 PostEdit.jsx 부터 시작합니다.
```

---

## 12. 최종 룰

1. **사용자 직접 결정 (§2) 절대 회귀 금지** — 충돌 제안 시 사용자 확인
2. **시안에 새 패턴 도입 시 합당한 이유 명시** (예: "5열 표는 모바일 가로 스크롤 — 사용자가 가로 스크롤 못 보면 정보 누락 위험")
3. **외부 라이브러리 0** — 시안 HTML/JSX 는 npm 의존성 없이 동작
4. **이미지/아이콘**: Material Symbols (시안의 이모지는 OK — 4-2 결정 참조)
5. **다크/라이트 동시 보장** — 모든 시안이 양쪽 모드에서 시각 검증

이 룰을 어기는 디자인 제안은 자동 reject. 의문 있으면 작업 시작 전 PM 확인.

---

**작업 시작 신호**: "P0-1 PostEdit.jsx 부터 시작합니다." 메시지 후 첫 시안 파일 (BDR v2.2/screens/PostEdit.jsx) 부터 차례로 만들어 갑니다.

## 프롬프트 (복사 끝)

---

## 부록 A — 출처 (참고 문서)

이 프롬프트가 인용한 내부 문서들:

- `Dev/design/DESIGN.md` — 디자인 시스템 명세 (영구)
- `Dev/design/user-design-decisions-2026-04-30.md` — 사용자 직접 결정 (회귀 방지)
- `Dev/design/phase-9-paste-completeness.md` — 117 페이지 박제 등급
- `Dev/design/phase-9-audit.md` — UI 진입점 단절 감사
- `Dev/design/phase-9-future-features.md` — 시안-only 기능 큐 (추후 구현)
- `Dev/design/ghost-features-and-breakage-2026-04-29.md` — 유령 기능 분석
- `Dev/design/v2.1-vs-site-gap-2026-04-29.md` — v2.1 시안과 사이트 갭
- `Dev/design/user-modifications-protection-2026-04-30.md` — 사용자 수정 보호 분석
- `Dev/design/regression-recovery-2026-04-30.md` — 회귀 복원 가이드
- `CLAUDE.md` — 프로젝트 룰
- `.claude/knowledge/conventions.md` — 모바일 최적화 체크리스트

## 부록 B — 사용 안내

1. § "프롬프트 (복사 시작)" 부터 § "프롬프트 (복사 끝)" 까지 통째로 복사
2. 클로드 디자인 (또는 Claude Web/Desktop 의 디자인 모드) 새 세션에 붙여넣기
3. 첫 응답 (§11 형식) 받으면 진행 OK 신호 송신
4. 시안 파일이 생성되는 대로 `C:\0. Programing\mybdr\Dev\design\BDR v2.2\` 에 직접 저장 요청 (zip 다운로드 X)
5. 시안 1 페이지 완료 시마다 클로드 CLI 에 박제 작업 요청 (반복)

권장 토큰 절약:
- 한 세션에 여러 페이지 시안 한 번에 요청 (1 메시지당 2-3 페이지)
- 토큰 부족 시 P0 5개만 우선 받고 P1-P3 는 다음 세션
