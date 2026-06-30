# PUB-0a — 공개웹 리뉴얼 IA 델타 리포트

> 작성: design-system-expert / 2026-06-30
> 대상: BDR-current (PUB-v1.0, 87 screens) vs src/app/(web) 운영 라우트
> 목적: 대량 박제 전 시안↔라우트 매핑 + IA 델타 + 결재 항목 식별
> **읽기 전용 분석. src/ 및 BDR-current/ 수정 없음.**

---

## 1. 시안 화면 ↔ (web) 라우트 매핑

### 1-A. 대응 확인 (운영 라우트 존재, 대응 가능)

| 시안 화면 | 운영 라우트 | 비고 |
|---|---|---|
| Home.jsx | / (page.tsx) | 완전 대응 |
| Games.jsx | /games | 완전 대응 |
| GameDetail.jsx | /games/[id] | 완전 대응 |
| CreateGame.jsx | /games/new | 완전 대응 |
| MyGames.jsx | /games/my-games | 완전 대응 |
| GuestApply.jsx | /games/[id]/guest-apply | 완전 대응 |
| GameReport.jsx | /games/[id]/report | 완전 대응 |
| Scrim.jsx | /scrim | 완전 대응 |
| Bracket.jsx | /tournaments/[id]/bracket | 완전 대응 |
| Calendar.jsx | /calendar | 완전 대응 |
| TournamentDetail.jsx | /tournaments/[id] | 완전 대응 |
| TournamentSchedule.jsx | /tournaments/[id]/schedule | 완전 대응 |
| TournamentTeams.jsx | /tournaments/[id]/teams | 완전 대응 |
| TournamentEnroll.jsx | /tournaments/[id]/join | 완전 대응 |
| Series.jsx | /series | 완전 대응 |
| SeriesDetail.jsx | /series/[slug] | 완전 대응 |
| SeriesCreate.jsx | /series/new | 완전 대응 |
| Orgs.jsx | /organizations | 완전 대응 |
| OrgDetail.jsx | /organizations/[id] | 완전 대응 |
| Team.jsx | /teams | 완전 대응 |
| TeamDetail.jsx | /teams/[id] | 완전 대응 |
| CreateTeam.jsx | /teams/new | TeamCreate.jsx와 동명 파일 중복 — 확인 필요 |
| TeamManage.jsx | /teams/manage 또는 /teams/[id]/manage | 양쪽 라우트 존재 |
| TeamInvite.jsx | /team-invite | 완전 대응 |
| PlayerProfile.jsx | /users/[id] | 완전 대응 |
| Coaches.jsx | /coaches | 완전 대응 |
| Court.jsx | /courts | 완전 대응 |
| CourtDetail.jsx | /courts/[id] | 완전 대응 |
| CourtBooking.jsx | /courts/[id]/booking | 완전 대응 |
| CourtAdd.jsx | /courts/submit | 완전 대응 |
| Rank.jsx | /rankings | 완전 대응 |
| Stats.jsx | /stats | 완전 대응 |
| Awards.jsx | /awards | 완전 대응 |
| Reviews.jsx | /reviews | 완전 대응 |
| Gallery.jsx | /gallery | 완전 대응 |
| BoardList.jsx | /community | 커뮤니티 게시판 |
| PostDetail.jsx | /community/[id] | 완전 대응 |
| PostWrite.jsx | /community/new | 완전 대응 |
| MyActivity.jsx | /my | 완전 대응 |
| MyRegistrationStatus.jsx | /my/registrations | 완전 대응 |
| Saved.jsx | /saved | 완전 대응 |
| Messages.jsx | /messages | 완전 대응 |
| Notifications.jsx | /notifications | 완전 대응 |
| Profile.jsx | /profile | 완전 대응 |
| ProfileBasketball.jsx | /profile (탭) | 탭/섹션으로 내장 가능 |
| ProfilePreferences.jsx | /profile (탭) | 탭/섹션으로 내장 가능 |
| ProfilePayments.jsx | /profile (탭) | 탭/섹션으로 내장 가능 |
| ProfileSubscription.jsx | /profile (탭) | 탭/섹션으로 내장 가능 |
| ProfileNotificationSettings.jsx | /settings | 탭/섹션으로 내장 가능 |
| EditProfile.jsx | /profile (편집 모드) | 완전 대응 |
| Settings.jsx | /settings | 완전 대응 |
| NotificationSettings.jsx | /settings | 설정 하위 탭 |
| Pricing.jsx | /pricing | 완전 대응 |
| Invite.jsx | /invite | 완전 대응 |
| Login.jsx | /login | 완전 대응 |
| Signup.jsx | /signup | 완전 대응 |
| PasswordReset.jsx | /forgot-password, /reset-password | 양쪽 라우트 대응 |
| Verify.jsx | /verify | 완전 대응 |
| OnboardingV2.jsx | /onboarding | 완전 대응 |
| OnboardingBasketball.jsx | /onboarding (step) | 온보딩 플로우 내부 |
| OnboardingEnvironment.jsx | /onboarding (step) | 온보딩 플로우 내부 |
| OnboardingIdentity.jsx | /onboarding (step) | 온보딩 플로우 내부 |
| OnboardingPreferences.jsx | /onboarding (step) | 온보딩 플로우 내부 |
| OnboardingSetup.jsx | /onboarding (step) | 온보딩 플로우 내부 |
| About.jsx | /about | 완전 대응 |
| Help.jsx | /help | 완전 대응 |
| Safety.jsx | /safety | 완전 대응 |
| Shop.jsx | /shop | 완전 대응 |
| Search.jsx | /search | 완전 대응 |
| SearchResults.jsx | /search (결과 상태) | Search와 같은 라우트 통합 가능 |
| Referee.jsx | /referee-info | 완전 대응 |
| RefereeRequest.jsx | /tournaments/[id]/referee-request | 완전 대응 |
| Terms.jsx | /terms | 완전 대응 |
| Privacy.jsx | /privacy | 완전 대응 |
| GuestApps.jsx | /guest-apps | 완전 대응 |

### 1-B. 신규 라우트 필요 (시안에 있으나 운영 라우트 없음)

| 시안 화면 | 현황 | 비고 |
|---|---|---|
| Live.jsx | /news/match/[matchId] 간접 대응 | 라우트 다름. 시안 `live` → 운영 live 전담 라우트 별도 필요 여부 결재 필요 |
| Match.jsx | 운영에 /matches 라우트 없음 | "매칭" 화면 — 신규 라우트 또는 games 하위 통합 결정 필요 |
| GameResult.jsx | /games/[id] 내 포함 추정 | 별도 라우트 없음 — games/[id] 상세에 결과 탭/섹션으로 통합 가능 |
| Achievements.jsx | 별도 라우트 없음 | /profile/achievements 또는 /rankings/achievements 신설 필요 여부 |
| Billing.jsx | 별도 라우트 없음 | /billing 신설 또는 /pricing 내 탭 통합 |
| Checkout.jsx | /courts/[id]/booking/payment-fail 부분 존재 | 일반 결제 checkout 라우트 신설 여부 |
| PricingSuccess.jsx | 없음 | /pricing/success 신설 필요 여부 |
| PricingFail.jsx | 없음 | /pricing/fail 신설 필요 여부 |

### 1-C. 운영에는 있으나 시안에 화면 없음 (기존 라우트 유지 여부 결재 필요)

| 운영 라우트 | 시안 화면 | 비고 |
|---|---|---|
| /news | 없음 | 뉴스/공지 화면 — 유지? 삭제? |
| /news/match/[matchId] | Live.jsx로 간접 대응 | 라이브 경기 전용 라우트 — 재매핑 여부 |
| /partner-admin | 없음 | 공개웹 제거 확정? (admin-v2로 이전) |
| /lineup-confirm | 없음 | 라인업 확인 — 유지? 경기 상세로 통합? |
| /courts/[id]/checkin | 없음 | 코트 체크인 — 유지? |
| /courts/[id]/manage | 없음 | 코트 관리 — admin-v2로 이전? |
| /team-apply | 없음 | 팀 지원 — 유지? 팀 상세로 통합? |
| /venues | 없음 | 경기장 목록 — 유지? courts와 통합? |

### 1-D. 특수 케이스

| 파일명 | 실제 내용 | 비고 |
|---|---|---|
| screens/More.jsx | NotFound + About 컴포넌트 담음 | "더보기" 독립 화면 없음 — 시안에서 더보기 탭 자체가 사라짐 |
| screens/_GlobalComponents.jsx | 글로벌 공용 컴포넌트 | 화면 아님 — 박제 대상 아님 |
| screens/CreateTeam.jsx + TeamCreate.jsx | 양쪽 모두 존재 | 화면 중복 — 하나로 통합 확인 필요 |

---

## 2. IA 델타 (가장 중요)

### 2-A. 셸 구조 충돌 — DualSideNav vs AppNav frozen

**근거: 실제 파일 확인 결과**

시안 `dual-sidenav.jsx` 상단 주석:
> "DualSideNav — 2-tier left navigation shell (v4). An icon **rail** (main sections) + a **context panel** (per-section submenu)"

시안 `README.md` 명시:
> "components.jsx — 공용 컴포넌트(Icon, ThemeSwitch, NavBadge, Onboarding, Pager, Sidebar, Modal, Avatar 등). **AppNav는 DualSideNav로 대체되어 제거됨.**"

시안 `tokens.css` 내 AppNav 클래스 분석:
- `.app-nav` / `.app-nav__tab` 등 **AppNav CSS 클래스가 tokens.css에 그대로 존재**
- 단, `components.jsx` 의 실제 AppNav 컴포넌트는 제거됨
- tokens.css의 AppNav CSS는 잔류 (공존 상태)

| 항목 | 현행 AppNav (frozen) | 시안 DualSideNav |
|---|---|---|
| 위치 | 상단 고정 헤더 | 좌측 2단 사이드바 |
| 너비 | 전체 뷰포트 | 레일 76px + 패널 234px = 310px |
| 메인 내비 방향 | 수평 탭 | 수직 아이콘+라벨 |
| 서브메뉴 | 더보기 drawer / 없음 | 컨텍스트 패널 (섹션별 서브메뉴) |
| 모바일 동작 | 탭 숨김 + 햄버거 drawer | 드래그 핸들 3단 스냅 오버레이 |
| 검색 위치 | 헤더 우측 아이콘 | 패널 상단 인라인 검색바 |
| 테마 토글 | 헤더 우측 듀얼 라벨(PC)/단일아이콘(모바일) | 패널 하단 footer |
| 계정/설정 | utility bar 우측 | 패널 하단 footer |
| "더보기" | 9번째 탭 (drawer 열기) | **없음** — "마이" 섹션으로 대체 |

**13룰 A(AppNav frozen 7룰) 충돌 판정:**

| 룰 | 현행 frozen 룰 | 시안 | 충돌 |
|---|---|---|---|
| 1 | 9메인탭 (홈~더보기) | 9섹션 (홈~마이) | 충돌 (더보기→마이 교체) |
| 2 | utility bar 우측 모바일 표시 | 패널 footer로 이동 | 충돌 (UI 이동) |
| 3 | main bar 우측 5개 (검색/쪽지/알림/다크/햄버거) | main bar 자체 없음 | 충돌 (상단 bar 제거) |
| 4 | 다크모드 PC 듀얼/모바일 단일 | 패널 footer 위치 | 충돌 (위치 변경) |
| 5 | 검색/쪽지/알림 app-nav__icon-btn | 검색=패널 내 인라인 | 충돌 (구조 완전 다름) |
| 6 | 모바일 닉네임 hidden | 해당 없음 | 해당 없음 |
| 7 | 더보기 = 9번째 탭 drawer | 더보기 탭 없음 | 충돌 (탭 자체 삭제) |

**결론: 13룰 A 7개 중 6개 충돌. 충돌이 아닌 것은 룰6(닉네임 hidden)뿐.**
시안은 AppNav를 "재구성"한 것이 아니라 완전히 다른 셸로 **교체**한 것임.

이것은 `03-appnav-frozen-component.md`의 "재작성/재구성 절대 금지" 룰이 상정한 범위를 넘어선 설계 변경이다. PUB 박제 전 수빈이 "AppNav frozen 룰을 PUB 도메인에서 면제하고 DualSideNav로 전환"을 승인해야 한다.

### 2-B. 메인 탭 변경 (레일 섹션)

| # | 현행 AppNav 9탭 | 시안 DualSideNav 9섹션 | 변경 여부 |
|---|---|---|---|
| 1 | 홈 | 홈 | 동일 |
| 2 | 경기 | 경기 | 동일 |
| 3 | 대회 | 대회 | 동일 |
| 4 | 단체 | 단체 | 동일 |
| 5 | 팀 | 팀 | 동일 |
| 6 | 코트 | 코트 | 동일 |
| 7 | 랭킹 | 랭킹 | 동일 |
| 8 | 커뮤니티 | 커뮤니티 | 동일 |
| 9 | **더보기** | **마이** | **교체** |

아이콘: 시안에서 Material Symbols Outlined 단일 시스템 사용 (규칙 준수).

### 2-C. 더보기 그룹 변경

**현행 `more-groups.ts` (Phase19 슬림 4그룹 15항목):**

| 그룹 | 항목 |
|---|---|
| 내 활동 | calendar, saved, stats |
| 경기·대회 | live, scrim |
| 둘러보기 | refereeInfo, coaches, reviews, awards, gallery, shop |
| 계정·도움 | safety, about, pricing, help |

**시안 분석 결과:**
시안에는 "더보기" 독립 화면이 없다. `screens/More.jsx` 파일에는 `NotFound`와 `About` 컴포넌트만 담겨 있으며, 더보기 drawer나 패널이 별도로 존재하지 않는다.

기존 "더보기" 항목들은 DualSideNav 각 섹션의 서브메뉴(컨텍스트 패널)로 분산·통합됐다:

| 기존 더보기 항목 | 시안 배치 위치 |
|---|---|
| calendar | 경기 섹션 "내 경기" 그룹 → `calendar` |
| saved | 마이 섹션 "내 활동" 그룹 → `saved` |
| stats | 랭킹 섹션 → `stats` |
| live | 경기 섹션 → `live` |
| scrim | 경기 섹션 → `scrim` |
| refereeInfo | (드롭) — referee-info 라우트 존재하나 서브메뉴 미배치 |
| coaches | (드롭) — coaches 라우트 존재하나 서브메뉴 미배치 |
| reviews | 커뮤니티 섹션 → `reviews` |
| awards | 랭킹 섹션 → `awards` |
| gallery | 커뮤니티 섹션 → `gallery` |
| shop | (드롭) — shop 라우트 존재하나 서브메뉴 미배치 |
| safety | (드롭) — about 페이지나 마이 섹션 미배치 |
| about | (드롭) — More.jsx에 About 컴포넌트는 있으나 서브메뉴 미배치 |
| pricing | 마이 섹션 "계정·설정" 그룹 → `pricing` |
| help | (드롭) — 서브메뉴 미배치 |

**더보기 그룹 변경 요약**: 4그룹 15항목 → 각 섹션 서브메뉴로 분산. "더보기" 개념 자체가 폐지됨. refereeInfo / coaches / shop / safety / about / help 6항목은 시안 서브메뉴에서 누락 (진입점 소멸 상태 — 별도 결재 필요).

### 2-D. Phase19 제거 항목 재등장

Phase19 slim에서 제거됐던 항목들이 시안에서 재등장했다. 시안 `MyBDR.html`의 `NAV_CTX` 실확인 결과:

| 항목 | Phase19 상태 | 시안 배치 | 재등장 위치 |
|---|---|---|---|
| mygames | 더보기에서 제거 (2026-05-04) | **재등장** | 경기 섹션 "내 경기" 그룹 서브메뉴 |
| messages | 더보기에서 제거 (헤더 중복 이유) | **재등장** | 마이 섹션 "내 활동" 그룹 서브메뉴 |
| achievements | 더보기에서 제거 | **재등장** | 랭킹 섹션 서브메뉴 |
| courtBooking | "등록·예약" 그룹 전체 제거 | **재등장** | 코트 섹션 서브메뉴 |
| courtAdd | "등록·예약" 그룹 전체 제거 | **재등장** | 코트 섹션 서브메뉴 |
| teamCreate | "등록·예약" 그룹 전체 제거 | **재등장** | 팀 섹션 서브메뉴 (`createTeam`) |
| teamManage | "등록·예약" 그룹 전체 제거 | **재등장** | 팀 섹션 서브메뉴 |
| notifications | 헤더 아이콘에 있어 제거 | **재등장** | 마이 섹션 "내 활동" 그룹 서브메뉴 |
| editProfile | Phase19 제거 | **재등장** | 마이 섹션 "계정·설정" 그룹 서브메뉴 |
| searchResults | "검색 3중 중복" 이유 제거 | Search 화면은 존재 | 서브메뉴 미배치 (헤더 검색 없음 → 패널 내 인라인 검색으로 대체) |
| gameNew(createGame) | 더보기에서 제거 (경기 목록에 버튼) | **재등장** | 경기 섹션 서브메뉴 (`createGame`) |

**Phase19 제거 이유가 DualSideNav 셸에서는 무효화됨:**
- "헤더 중복 이유로 제거"한 항목들(messages/notifications) → 헤더 자체가 없어져 중복 문제 소멸, 서브메뉴 재배치가 합리적
- "경기 목록 하위 버튼 있어 제거"한 항목들(courtBooking/createGame 등) → 서브메뉴 직접 진입이 UX상 유효
- 따라서 Phase19 제거 결정의 근거 대부분이 셸 교체와 함께 자연 해소됨. **재등장 자체는 정당하다**고 판단.

### 2-E. 신규/삭제 라우트 요약

| 분류 | 목록 |
|---|---|
| 신규 필요 (시안 기준) | /matches (Match.jsx), /achievements, /billing, /checkout, /pricing/success, /pricing/fail |
| 삭제 검토 (시안 미포함) | /news, /lineup-confirm, /courts/[id]/checkin, /courts/[id]/manage, /team-apply, /venues, /partner-admin |
| 라우트 재매핑 | Live.jsx → /news/match/[matchId] 또는 신규 /live/[id] |

---

## 3. 색상 시스템 쟁점

### 3-A. 시안 README 명시 내용

```
LIGHT = 클린 어드민 (토스 블루 단일 포인트)
DARK  = 스포티 소프트 (BDR 레드 단일 포인트)
```

### 3-B. tokens.css 실제 포인트 컬러 값 (파일 직접 확인)

**라이트 모드:**
```css
/* 단일 포인트 = 토스 블루 */
--cafe-blue:       #3182F6;
--cafe-blue-deep:  #1B64DA;
--cafe-blue-soft:  #E8F1FE;
--accent:      #3182F6;
--primary:      #3182F6;
--primary-deep: #1B64DA;
```

**다크 모드:**
```css
/* 단일 포인트 = BDR 레드 */
--cafe-blue:       #E31B23;
--cafe-blue-deep:  #B3141A;
--accent:      #E31B23;
--primary:      #E31B23;
--primary-deep: #B3141A;
```

**고정 토큰 (모드 공통):**
```css
--bdr-red: #E31B23;  /* LIVE/기록/브랜드 모먼트 전용 */
--info: #3182F6;     /* 시맨틱 info 고정 (토스블루) */
```

### 3-C. CLAUDE.md 정책과의 대조

CLAUDE.md `디자인 핵심`:
> "색상: Primary #E31B23, Navy #1B3C87, Info #0079B9"
> (admin-v2 Toss와 완전 별개로 공개웹 BDR Red 사용)

| 모드 | 시안 포인트 | CLAUDE.md 정책 | 충돌 |
|---|---|---|---|
| 라이트 | #3182F6 (토스 블루) | #E31B23 (BDR 레드) | **충돌** |
| 다크 | #E31B23 (BDR 레드) | #E31B23 (BDR 레드) | 일치 |

**충돌 성격 분석:**
- CLAUDE.md의 "공개웹=BDR Red" 정책은 admin-v2의 토스블루와 구분하려는 취지로 기록됨
- 그러나 새 시안(PUB-v1.0)은 라이트 모드를 의도적으로 "클린 어드민 = 토스블루"로 설계함
- 시안 README 설명: "라이트 = 클린 어드민 (포인트 = 토스 블루), 다크 = 스포티 소프트 (포인트 = BDR 레드)"
- 이 듀얼 모드 포인트 설계는 UX 관점에서 의도된 것(라이트=정보 중심, 다크=스포티 정체성)

**충돌 판정: 실제 충돌 맞음.** 라이트 모드에서 포인트 컬러가 토스블루(#3182F6)이며, CLAUDE.md의 "공개웹=BDR Red" 정책과 상충함. 단, 이것은 시안 설계자가 의도적으로 선택한 것으로 결재를 통해 정책 갱신이 필요한 사안.

---

## 4. 결론: 수빈 결재 필요 항목 우선순위

### [P0] PUB 박제 진행 전 필수 결재 (블로커)

| # | 쟁점 | 현황 | 선택지 |
|---|---|---|---|
| **P0-1** | **셸 구조: DualSideNav vs AppNav frozen** | 시안이 AppNav를 DualSideNav로 완전 교체. README에 "AppNav 제거됨" 명시. 13룰 A 7룰 중 6룰 충돌 | A) PUB 도메인에서 13룰 A 면제 → DualSideNav로 전환 (시안 그대로 박제) / B) AppNav frozen 유지 → 시안 셸 무시하고 기존 AppNav 위에 콘텐츠만 박제 |
| **P0-2** | **라이트 모드 포인트 컬러: 토스블루 vs BDR레드** | 시안 토큰 확인: 라이트=#3182F6, 다크=#E31B23. CLAUDE.md "공개웹=BDR Red" 정책과 라이트 충돌 | A) 시안 그대로 (라이트=토스블루, 다크=BDR레드) — CLAUDE.md 정책 갱신 / B) 양 모드 BDR레드 통일 — 시안 tokens.css 수정 |
| **P0-3** | **9탭 "더보기" → "마이" 교체** | 시안에서 더보기 탭 완전 삭제, 마이(mypage)로 교체. 더보기 IA 분산 | A) 시안 그대로 승인 (마이 섹션 채택) / B) 더보기 유지 (시안과 달라짐) |

### [P1] 박제 중 결정 (블로커 아님 — P0 승인 후 진행 가능)

| # | 쟁점 | 비고 |
|---|---|---|
| **P1-1** | 시안 서브메뉴 미배치 항목 6건 (refereeInfo/coaches/shop/safety/about/help) 진입점 처리 | 풋터 링크로 보완? 서브메뉴 추가? 별도 결정 |
| **P1-2** | 운영 전용 라우트 유지/삭제 (news, lineup-confirm, venues, team-apply 등) | 공개웹 정리 범위 결정 |
| **P1-3** | 신규 라우트 신설 여부 (Match.jsx, Achievements.jsx, Billing.jsx 등) | 기능 범위 결정 |
| **P1-4** | screens/More.jsx — NotFound+About 파일 구성 의도 (파일명과 내용 불일치) | 확인 후 about 별도 분리 가능 |

### 결재 판정 요약

```
┌─────────────────────────────────────────────────────────────────────────┐
│ P0-1 셸 구조    DualSideNav ↔ AppNav frozen 6룰 충돌                     │
│                → "PUB에서 AppNav frozen 면제 + DualSideNav 전환" 결재 필요│
│                                                                         │
│ P0-2 색상 시스템 라이트=토스블루 ↔ CLAUDE.md 공개웹=BDR레드 충돌           │
│                → 라이트 포인트 컬러 방향 결재 필요                         │
│                                                                         │
│ P0-3 9탭 변경   더보기 탭 삭제 + 마이 섹션 신설                           │
│                → 더보기 IA 폐지 승인 결재 필요                             │
│                                                                         │
│ 위 3건 중 P0-1이 가장 범위가 크며, P0-1 결재가 P0-2·P0-3을 함께 내포한다.  │
│ 사실상 "PUB 시안 DualSideNav 셸 채택 여부" 단 하나의 결재로 수렴.           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 부록: 시안 화면 카운트 정확도

- `screens/` 파일 실측: **87개** (ls 카운트)
- 그 중 실제 화면 컴포넌트: 약 **85개** (_GlobalComponents.jsx 제외, More.jsx에 NotFound+About 2개 내장)
- 운영 라우트 직접 대응: **72개 이상** (신규 필요 8개, 미대응 또는 간접 대응 7개)
