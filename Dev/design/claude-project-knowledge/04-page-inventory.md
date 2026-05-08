# BDR 페이지 인벤토리 — 117 페이지 박제 등급

> 시안 작업 시 어느 페이지가 박제 대상인지, 어디 시안이 이미 있는지, 어떤 영역은 자체 디자인 가능한지 참고.

---

## 1. 등급 매트릭스

| 등급 | 정의 | 페이지 수 |
|------|------|---------|
| A | 시안 1:1 박제 (출처 명시 + 핵심 기능 + 시각 톤 일치) | **43** |
| B | 80%+ 박제 (디테일 누락) | 14 |
| C | 부분 박제 (일부 누락 / 옛 UI 잔존) | 9 |
| D | 박제 안됨 → v2.2 박제로 **0** | 0 |
| E | 시안 외 자체 영역 (admin/referee/tournament-admin/_site/partner-admin) | 50 |
| F | 시안 있는데 라우트 없음 → v2.2 박제로 **0** | 0 |
| **총** | | **117** |

→ **사용자 영역 박제율**: 64% (43/67) A 등급만 + 99% (66/67) A+B+C 진행.

---

## 2. A등급 (시안 1:1) — 43 페이지

```
/                            (홈 — Home.jsx)
/about                       (About.jsx)
/awards                      (Awards.jsx)
/calendar                    (Calendar.jsx)
/coaches                     (Coaches.jsx)
/community/new               (PostWrite.jsx)
/community/[id]              (PostDetail.jsx)
/community/[id]/edit         (PostEdit.jsx — v2.2)
/courts/[id]/booking         (CourtBooking.jsx)
/courts/submit               (CourtAdd.jsx)
/forgot-password             (PasswordReset.jsx)
/gallery                     (Gallery.jsx)
/games/[id]/edit             (GameEdit.jsx — v2.2)
/games/[id]/guest-apply      (GuestApply.jsx)
/games/[id]/report           (GameReport.jsx)
/guest-apps                  (GuestApps.jsx)
/help                        (Help.jsx)
/help/glossary               (HelpGlossary.jsx — v2.2)
/live/[id] (finished)        (LiveResult.jsx — v2.2 회귀 픽스)
/match → /tournaments        (Match.jsx)
/messages                    (Messages.jsx)
/onboarding/setup            (OnboardingV2.jsx)
/organizations/[slug]        (OrgDetail.jsx)
/pricing                     (Pricing.jsx)
/pricing/checkout            (Checkout.jsx)
/pricing/fail                (PricingFail.jsx)
/pricing/success             (PricingSuccess.jsx)
/privacy                     (Privacy.jsx)
/profile/billing             (Billing.jsx)
/profile/edit                (EditProfile.jsx)
/profile/activity            (MyActivity.jsx)
/profile/settings            (Settings.jsx)
/profile/achievements        (Achievements.jsx)
/profile/bookings            (ProfileBookings.jsx — v2.2)
/profile/complete            (ProfileComplete.jsx — v2.2)
/profile/complete/preferences (ProfileCompletePreferences.jsx — v2.2)
/profile/growth              (ProfileGrowth.jsx — v2.2)
/profile/weekly-report       (ProfileWeeklyReport.jsx — v2.2)
/referee-info                (RefereeInfo.jsx — v2.2 신규)
/reset-password              (PasswordReset.jsx)
/reviews                     (Reviews.jsx)
/safety                      (Safety.jsx)
/saved                       (Saved.jsx)
/scrim                       (Scrim.jsx)
/search                      (Search.jsx)
/series                      (Series.jsx)
/series/new                  (SeriesCreate.jsx)
/series/[slug]               (SeriesDetail.jsx)
/shop                        (Shop.jsx)
/stats                       (Stats.jsx)
/team-invite                 (TeamInvite.jsx)
/teams/[id]/manage           (TeamManage.jsx)
/terms                       (Terms.jsx)
/tournaments                 (Match.jsx 목록)
/tournaments/[id]            (Match.jsx 상세)
/tournaments/[id]/join       (TournamentEnroll.jsx)
/tournaments/[id]/referee-request  (RefereeRequest.jsx)
/venues/[slug]               (VenueDetail.jsx — v2.2)
/verify                      (Verify.jsx)
```

---

## 3. B등급 (80%+ 박제, 디테일 누락) — 14 페이지

> 새 시안 작업 시 디테일 보강하면 A 승격 가능

```
/                       (홈 — Hero 카로셀 보강)
/games                  (Games.jsx — 필터 칩)
/games/my-games         (MyGames.jsx — alert 6건 정리)
/games/[id]             (GameDetail.jsx)
/teams                  (Team.jsx — 지역/정렬 필터)
/teams/[id]             (TeamDetail.jsx)
/courts                 (Court.jsx)
/courts/[id]            (CourtDetail.jsx)
/organizations          (Orgs.jsx)
/profile                (Profile.jsx — 시즌 탭 누락 → Phase 13 마이페이지 hub 통합 예정)
/users/[id]             (PlayerProfile.jsx)
/login                  (Login.jsx)
/signup                 (Signup.jsx)
/notifications          (Notifications.jsx)
```

---

## 4. C등급 (부분 박제) — 9 페이지

```
/community              (BoardList.jsx — wrapper 코멘트)
/rankings               (Rank.jsx)
/help/glossary          (Help 일부)
/safety                 (Safety.jsx — DB 0%)
/scrim                  (Scrim.jsx — DB 미연결)
/match                  (Match.jsx — 진입점 0)
/onboarding/setup       (자동 redirect 추가됨 v2.2)
/courts/[id]/manage     (시안 외 — E 재분류 가능)
/notifications          (actionUrl 픽스됨)
```

---

## 5. E등급 (시안 외 자체 영역) — 50 페이지

> **박제 대상 X**. 자체 디자인 OK. 디자인 토큰만 일치하면 됨. AppNav 적용 X (별도 셸).

### 5-1. (admin)/admin/* (백오피스, 18 페이지)

```
/admin                  /admin/analytics       /admin/campaigns       /admin/community
/admin/courts           /admin/game-reports    /admin/games           /admin/logs
/admin/notifications    /admin/organizations   /admin/partners        /admin/payments
/admin/plans            /admin/settings        /admin/suggestions     /admin/teams
/admin/tournaments      /admin/users
```

→ 자체 셸 (`AdminSidebar`). 시안 박제 대상 X.

### 5-2. (web)/tournament-admin/* (대회 관리자, 20 페이지)

```
/tournament-admin / organizations / series / templates / tournaments / wizard / matches / bracket / recorders / site / teams / admins
(/tournament-admin 의 다양한 서브 라우트)
```

→ 자체 셸 (`TournamentAdminNav`). 시안 박제 대상 X.

### 5-3. (web)/partner-admin/* (협력업체, 4 페이지)

```
/partner-admin
/partner-admin/venue
/partner-admin/campaigns
/partner-admin/campaigns/[id]
```

→ 자체 셸. 시안 박제 대상 X.

### 5-4. (referee)/referee/* (심판 플랫폼, 28 페이지)

```
(referee)/referee/page.tsx                        (대시보드)
(referee)/referee/profile/page.tsx                (프로필)
(referee)/referee/profile/edit
(referee)/referee/certificates                    (자격증)
(referee)/referee/documents                       (서류)
(referee)/referee/assignments                     (배정)
(referee)/referee/applications                    (신청)
(referee)/referee/settlements                     (정산)
(referee)/referee/notifications                   (알림)
(referee)/referee/admin/* (12 페이지)              (관리자 대시보드)
(referee-public)/referee/login                    (심판 전용 로그인)
(referee-public)/referee/signup
```

→ 자체 셸 (`RefereeShell`). 시안 박제 대상 X.

### 5-5. _site/* (서브도메인 토너먼트, 6 페이지)

```
_site / [[...path]] / registration / results / schedule / teams
```

→ `site-templates/classic` 등 별도 템플릿. 시안 박제 대상 X.

---

## 5-A. 더보기 메뉴 5그룹 IA — Phase 19 슬림화 (2026-05-04 ~ 05-07)

> 사용자 직접 정리 — 30 항목 → **15 항목** (50% 감축). 이유: 메인 페이지 하위로 통합 / 헤더 중복 / 가짜링크 제거.
> Source of truth: `src/components/bdr-v2/more-groups.ts`

| 그룹 | 이전 (v2.2 시안) | 현재 (운영) | 제거 사유 |
|------|----------------|------------|----------|
| **내 활동** | 7 | **3** | mygames(/games/my-games 직접) / messages(헤더 아이콘 중복) / achievements(/profile/achievements 직접) / communityNew(/community/new 직접) 제거. 잔존: 내 일정, 보관함, 스탯 분석 |
| **경기·대회** | 3 | **2** | gameNew(/games/new = games 하위 + "만들기 버튼") 제거. 잔존: 라이브 중계, 연습경기 매칭 |
| **등록·예약** | 4 | **0 (그룹 자체 제거)** | courtBooking, courtAdd, teamCreate, teamManage 모두 메인 페이지 하위 또는 중복. 그룹 통째 제거 |
| **둘러보기** | 7 | **6** | searchResults(헤더 검색 + drawer 검색 + 본 메뉴 = 3중 중복) 제거. 잔존: 심판 센터 안내, 코치·트레이너, 리뷰, 수상 아카이브, 갤러리, 샵 |
| **계정·도움** | 9 | **4** | mypage / editProfile / notificationSettings / passwordReset / onboardingV2 제거. 잔존: 안전·차단, 소개, 요금제, 도움말 |
| **합계** | **30** | **15** | -50% |

→ **회귀 가드**: 시안에서 위 제거 항목을 다시 추가하지 말 것. 메인 페이지 하위 진입 또는 헤더 직접 진입으로 대체.

---

## 5-B. BDR v2 디자인 시스템 마이그레이션 상태 (2026-05-07 실측)

> `_v2` 폴더 적용 여부 + `--color-*` (폐기 토큰) 잔존 여부 = 마이그레이션 상태 indicator.

### 5-B-1. _v2 폴더 적용 완료 (16 영역, A등급 핵심)

```
src/app/(web)/awards/_v2
src/app/(web)/games/new/_v2
src/app/(web)/games/[id]/_v2
src/app/(web)/organizations/[slug]/_components_v2
src/app/(web)/pricing/_v2
src/app/(web)/profile/_v2
src/app/(web)/profile/achievements/_v2
src/app/(web)/profile/settings/_components_v2
src/app/(web)/reviews/_v2
src/app/(web)/saved/_v2
src/app/(web)/team-invite/_v2
src/app/(web)/teams/new/_v2
src/app/(web)/teams/[id]/_components_v2
src/app/(web)/tournaments/[id]/join/_v2
src/app/(web)/users/[id]/_v2
src/app/live/[id]/_v2
```

→ 위 영역은 BDR v2 토큰 (`--accent`, `--bg-card`, `--ink`, `--ink-mute` 등) 사용. 시안 박제 완료.

### 5-B-2. 폐기 토큰 (`--color-*`) 잔존 — 329 파일 / 4 영역

| 영역 | 파일 수 | 마이그레이션 우선순위 |
|------|--------|---------------------|
| `(web)/*` | 157 | **P1** — 사용자 직접 노출. _v2 미적용 페이지 + 메인 라우트 page.tsx |
| `src/components/*` | 75 | **P1** — 글로벌 컴포넌트 (game-card, board-row 등) |
| `(admin)/*` | 49 | P2 — E등급 자체 영역. 토큰 일치만 하면 OK |
| `(referee)/*` | 31 | P2 — E등급 자체 영역 |
| `live/*`, `_site/*` 외 | 17 | P3 |

→ **P1 영역 마이그레이션** 시 `02-design-system-tokens.md §9` 의 폐기→신규 매핑 표 사용. 일괄 sed/grep replace 가능.

### 5-B-3. _v2 미적용 (web) 페이지 — 시안 박제 후속 의뢰 후보

다음 페이지는 사용자 영역이지만 `_v2` 폴더 미생성. legacy 마크업 + `--color-*` 잔존 가능성 큼:

```
/about /awards /coaches /community/* /courts/* /forgot-password /gallery
/games (목록) /help /messages /notifications /onboarding/setup /organizations
/privacy /profile/billing /profile/edit /profile/activity /reset-password
/scrim /search /series/* /shop /stats /teams /tournaments (목록 페이지)
/terms /verify
```

→ 이들 중 자주 사용되는 `/games`, `/teams`, `/tournaments`, `/community`, `/courts`, `/messages`, `/notifications`, `/profile/edit`, `/profile/settings` 가 P1 박제 의뢰 우선순위.

---

## 6. 박제 작업 시 의사결정 트리

```
새 페이지 / 시안 작업 의뢰 도착
  ↓
[Q1] 사용자가 사용하는 (web) 영역 페이지인가?
  YES → A/B/C/D 등급 — 시안 박제 진행
  NO  → E 등급 — 자체 디자인 OK (디자인 토큰만 일치)
  ↓
[Q2] 시안이 이미 BDR v2.2 에 있는가?
  YES → 기존 시안 그대로 카피 + 변경 부분만 신규
  NO  → 새 시안 신규 (D → A 승격 또는 신규 라우트)
  ↓
[Q3] AppNav / 헤더 부분이 포함되는가?
  YES → 03-appnav-frozen-component.md 의 코드 그대로 카피 (절대 재구성 X)
  NO  → 본문만 신규 디자인
  ↓
[Q4] 사용자 결정 §1~§8 과 충돌하는가?
  YES → PM 확인 후에만 진행
  NO  → 작업 진행
  ↓
[Q5] 시안 완료 후 06-self-checklist.md 모두 통과?
  YES → 산출물 제출
  NO  → 위반 픽스 후 재제출
```

---

## 7. 시안 작업 시 우선순위

### 7-1. P0 — 사용자 직접 영향

> 가입자 / 일상 사용 / 대회 참가 페이지 우선

```
/                       /signup            /verify
/onboarding/setup       /tournaments       /tournaments/[id]
/tournaments/[id]/join  /pricing/checkout  /games/my-games
/profile                /profile/edit      /profile/settings
```

### 7-2. P1 — 사용자 경험 향상

> 본인 데이터 / 검색 / 부수 기능

```
/profile/* (편집 외 영역)   /games           /games/[id]
/teams                       /courts          /community
/messages                    /notifications
```

### 7-3. P2 — 보조 페이지

```
/about                  /help              /privacy
/terms                  /coaches           /gallery
/awards                 /shop
```

### 7-4. P3 — 백오피스 / 자체 영역 (E)

> 시안 박제 대상 아님. 디자인 토큰 일치만.

```
/admin/*                 /tournament-admin/*       /partner-admin/*
/referee/*               /_site/*
```

---

## 8. 박제 등급 KPI (현재)

| 지표 | 이전 | 현재 |
|------|------|------|
| A등급 | 32 | **43** ✅ +11 |
| D등급 (박제 안됨) | 11 | **0** ✅ |
| F등급 (라우트 누락) | 1 | **0** ✅ |
| 사용자 영역 박제율 (A only) | 48% (32/67) | **64% (43/67)** |
| 사용자 영역 박제 진행률 (A+B+C) | 82% (55/67) | **99% (66/67)** ✅ |
| 모바일 G-10/G-9 보호 | 미적용 | **적용** ✅ |

---

## 9. 출처

- `Dev/design/phase-9-paste-completeness.md` (5+1 등급 분류)
- `Dev/design/v2.2-review-2026-04-30.md` (v2.2 인수 검토)
- `Dev/design/v2.2-cli-batch-prompt-2026-04-30.md` (v2.2 박제 일괄 위임)
- `src/app/(web)`, `(admin)`, `(referee)`, `_site/` 디렉토리
