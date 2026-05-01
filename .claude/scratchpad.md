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

- **요청 4**: v2.4 새 다운로드 재박제 — R-A 시안 회귀 정리 + R-B' 룰 9 갱신 + R-C-4 운영 헤더 03 frozen 재적용 — **완료 (이번 작업)**
- **상태**: developer 완료
- **현재 담당**: PM (테스트 + 커밋 3건)
- **브랜치**: subin

### 구현 기록 (R-A + R-B' + R-C-4 통합)

📝 구현 내용:

**R-A: v2.4 시안 회귀 정리**
- components.jsx AppNav 함수 → uploads/03 §1 frozen 코드 그대로 카피
  - moreOpen/setMoreOpen state 제거 + 더보기 ▼ dropdown trigger 제거 + RDM rdm_captain 아바타 제거
  - main bar 우측 = 다크 + 검색 + 쪽지(Icon.mail 신규) + 알림 + 햄버거(모바일) 5컨트롤 (.app-nav__icon-btn 일관)
  - 9번째 탭 '더보기' = drawer 토글 (dropdown 패널 X)
  - util-left 클래스 분리 (좌측 모바일 hidden / 우측 그대로)
  - drawer 안에 5그룹 IA (refereeInfo + mypage 포함, 가짜 4건 제외)
- ThemeSwitch → uploads/03 §2 viewport 분기 (PC 듀얼 / 모바일 단일 .theme-switch--mobile)
- screens/{Referee,GameReport,GameResult,GuestApps}.jsx 4 파일 제거 (_archived/ 에 보존)
- MyBDR.html: script 참조 4건 + 라우트 매칭 4건 영구 제거 + RefereeInfo / mypage 매칭 신규 추가
- 카피 (서울 3x3 / 다음카페) **변경 0** (사용자 결정 시안 보존)

**R-B': 룰 9 갱신 (시안 우선 정책 2026-05-01)**
- claude-project-knowledge/00-master-guide.md 룰 9: "전국 농구 매칭 플랫폼" → 시안 우선 + "서울 3x3 농구 커뮤니티" / "다음카페" 허용
- claude-project-knowledge/01-user-design-decisions.md §6-1: 이전 결정 폐기 + 갱신 결정 명시 (commit 46e5d1b 운영 코드는 보존)
- claude-project-knowledge/06-self-checklist.md §4 카피 검수 + §9 자동화 스크립트 [4] 항목 갱신 (서울 3x3 검수 폐기)
- CLAUDE.md L96 룰 11 갱신 (시안 우선 명시)
- About 운영진 실명 박제 금지 → **보존** (룰 9 후반부)
- Footer.tsx → 변경 0 (사업자 정보 보존, 글로벌 슬로건 자체가 시안 톤 무관)

**R-C-4: 운영 app-nav.tsx 03 frozen 재적용**
- tabs 배열에서 `kind: "trigger"` 필드 영구 제거 (단일 종류)
- moreOpen/setMoreOpen state 제거 + moreRef ref 제거 + 외부 클릭/ESC 닫힘 effect 제거
- MorePanel 컴포넌트 함수 (~190줄) 영구 제거 — AppDrawer 가 동등한 5그룹 IA + super_admin/referee 운영 그룹 처리
- 9번째 탭 'more' = drawer 토글 button (PC/모바일 동일)
- import 정리: useRef 제거 / MORE_GROUPS, MoreGroup import 제거
- AppDrawer prop type 갱신: kind 필드 제거 + 'more' id sentinel 만 본문 제외 (filter)
- Phase 19 보존: 검색 / 쪽지(mail_outline + /messages) / 알림 + 빨간 점 뱃지

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| Dev/design/BDR v2.4/components.jsx | Icon.mail 추가 + AppNav 함수 03 §1 frozen 카피 + ThemeSwitch viewport 분기 | 수정 |
| Dev/design/BDR v2.4/screens/Referee.jsx | _archived/ 에 보존 — 본 폴더에서 제거 | 삭제 |
| Dev/design/BDR v2.4/screens/GameReport.jsx | _archived/ 에 보존 — 본 폴더에서 제거 | 삭제 |
| Dev/design/BDR v2.4/screens/GameResult.jsx | _archived/ 에 보존 — 본 폴더에서 제거 | 삭제 |
| Dev/design/BDR v2.4/screens/GuestApps.jsx | _archived/ 에 보존 — 본 폴더에서 제거 | 삭제 |
| Dev/design/BDR v2.4/MyBDR.html | script 4 + 라우트 4 제거 + RefereeInfo + mypage 신규 매칭 | 수정 |
| Dev/design/claude-project-knowledge/00-master-guide.md | 룰 9 갱신 (시안 우선) | 수정 |
| Dev/design/claude-project-knowledge/01-user-design-decisions.md | §6-1 폐기 + 갱신 명시 | 수정 |
| Dev/design/claude-project-knowledge/06-self-checklist.md | §4 + §9 자동화 [4] 갱신 | 수정 |
| CLAUDE.md | L96 룰 11 갱신 | 수정 |
| src/components/bdr-v2/app-nav.tsx | tabs kind 제거 + MorePanel 함수 제거 (~190줄) + state/ref 제거 + 9번째 'more' = drawer 토글 | 수정 |
| src/components/bdr-v2/app-drawer.tsx | tabs prop kind 필드 제거 + 'more' id 본문 제외 filter | 수정 |

🔧 자동 검수:
| 항목 | 기대 | 결과 |
|----|----|----|
| 시안 회귀 (더보기 ▼/RDM/moreOpen 코드 매칭) | 0 | 0 (코멘트 가드만) ✓ |
| 시안 Icon.mail | 1+ | 1 ✓ |
| 시안 가짜 4 screens/ | 0 | 0 ✓ |
| MyBDR.html 가짜 라우트 매칭 | 0 | 0 ✓ |
| 운영 app-nav 회귀 코드 매칭 | 0 | 0 (코멘트 가드만) ✓ |
| 운영 app-nav mail_outline + /messages | 1+ | 3 ✓ |
| tsc --noEmit | EXIT=0 | EXIT=0 ✓ |

💡 tester 참고:
- 운영 헤더 9번째 '더보기' 탭 클릭 → drawer 열림 (PC/모바일 동일). dropdown 패널 X
- main bar 우측 = 다크 + 검색 + 쪽지(로그인 시) + 알림(로그인 시) + 햄버거(모바일). RDM 아바타 X
- 비로그인: 검색 + 로그인(btn--accent) + 햄버거. 더보기 탭은 비로그인도 클릭 시 drawer 열림
- /messages 라우트 정상 동작 (Phase 8 박제). 빨간 점 뱃지: unreadCount > 0 시만 (알림만) — 쪽지는 No-badge
- 룰 9 갱신: 시안 카피 (서울 3x3, 다음카페) 보존 — 운영 코드 변경 0
- v2.4 시안 회귀 가드: components.jsx 의 코멘트 매칭은 의도된 가드 (실제 위반 0)

⚠️ reviewer 참고:
- MorePanel 제거로 PC dropdown 패널 사라짐 — 사용자 멘탈 모델 변화 (이전: PC=dropdown / 모바일=drawer → 변경 후: PC/모바일 모두 drawer). 우측 슬라이드 drawer 가 PC 에서도 작동 (CSS 그대로). 사용자 결정 §1-3 명시
- AppDrawer 의 super_admin / referee 운영 그룹 보존 (drawer 안에서 처리)
- AppDrawer 의 tabs prop 타입 변경 (kind 필드 제거) — 다른 호출처는 AppNav 만이라 영향 0
- v2.4 시안 components.jsx 의 drawer 더보기 5그룹 패널 디자인은 03 §1 코드 그대로 + 운영의 AppDrawer 와 IA 정합 (refereeInfo + mypage + 가짜링크 4건 제외)

📦 PM 액션:
- 커밋 3건 분리 (R-A / R-B' / R-C-4)
- subin 만 push, main/dev push 금지

### 이전 구현 기록 (v2.4 풍부 디테일 통합 — 재박제)

📝 구현: 시안 v2.4 Profile.jsx (125줄) 의 풍부 디테일을 운영 /profile 에 옵션 B 통합 (이전 박제 83a9363 의 Hero+hub+aside 보존 + 시안 디테일 추가).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/profile/_v2/hero-card.tsx | team.primaryColor 수신 + 96 그라디언트 (linear-gradient 145deg, team.color, #000) — 이미지 없을 때만 노출 | 수정 |
| src/app/(web)/profile/_v2/activity-timeline.tsx | kind 5종 확장 (post/application/match/win/loss/team) + badgeClass 매핑 (win=ok, loss=red, post/match/team=soft) | 수정 |
| src/app/(web)/profile/page.tsx | HeroCard team primaryColor 전달 + 상단 Hero 큰 배너도 heroAvatarBg(team color → 검정) 적용 | 수정 |
| src/app/(web)/profile/_archived/* | _components/ 14종 격리 (radar-chart 제외 — users/[id] 사용 중) | 신규(이동) |
| src/app/(web)/profile/_archived/ability-section.tsx | radar-chart import 경로 ../_components/radar-chart 로 수정 | 수정 |

🔧 자동 검수:
| 항목 | 결과 |
|----|----|
| tsc --noEmit | EXIT=0 ✓ |
| 시안 v2.4 stats 6 매칭 | 경기/승률/PPG/APG/RPG/레이팅 ✓ |
| 시안 v2.4 timeline 5 매칭 | kind 5종 + 색 매핑 ✓ |
| 시안 v2.4 badges 4 매칭 | 2x2 grid 이모지+이름+날짜 ✓ |
| 시안 v2.4 96 그라디언트 (team.color) | HeroCard + 큰 Hero 둘 다 ✓ |
| _components/ 격리 | 14/15 (radar-chart 보존) ✓ |
| API/route.ts 변경 | 0 ✓ |
| 이전 박제 (83a9363) 풍부 hub 보존 | Hero+hub+quick+aside 그대로 ✓ |

💡 tester 참고:
- 테스트: 로그인 후 /profile → (1) 상단 큰 Hero 아바타가 팀 primary_color → 검정 그라디언트 (팀 없으면 BDR Red 폴백) (2) 우측 sticky aside HeroCard 도 동일 그라디언트 (3) ActivityTimeline 5건 + tag 색 (post=soft, application=ok)
- _archived/ 14 컴포넌트가 운영 어디에서도 import 0 — 빌드/런타임 영향 0 (radar-chart 만 _components/ 잔존)

⚠️ reviewer 참고:
- 시안 vs 캡처 16 미스매치: 시안 v2.4 Profile.jsx 는 단순 hub (좌 320 / 우 1fr) — 이전 박제 83a9363 의 풍부 hub (Hero + hub + quick + aside) 와 다름. **옵션 B 채택**: 풍부 hub 보존 + 시안 디테일만 통합. 이유: 사용자 의뢰서 + 캡처 16 의 의도는 풍부 hub
- timeline kind 5종 확장: 데이터는 현재 post/application 2종만 발생, 나머지(match/win/loss/team)는 향후 데이터 연결 시 자동 활성. 호환 0 깨짐
- _components/radar-chart.tsx 만 보존: users/[id]/_components/user-radar-section.tsx 가 import 사용 중 (격리 시 빌드 깨짐)
- _archived/ability-section.tsx 의 import 경로 수정: ../_components/radar-chart — _archived 자체가 미사용이지만 tsc 검사 대상이라 깨지면 안됨

### 구현 기록 (v2.4 마이페이지 hub 박제 — 이번 작업)

📝 구현한 기능:
- /profile 페이지 상단에 **큰 Hero 카드** 신규 (96 빨간 그라디언트 아바타 + MY PAGE eyebrow + h1 "닉네임 의 농구" + 메타 + 뱃지 3종 + 버튼 3종)
- 본문 좌측 1fr 에 **마이페이지 hub** 신규 ("내 활동을 한곳에서" eyebrow+h2+sub + Tier 1 큰 카드 4 + Tier 2 quick 카드 4)
- 우측 320 sticky aside 에 기존 v2.3 컴포넌트 재배치 (HeroCard/SeasonStats/UpcomingGames/TeamSideCard/ActivityTimeline/BadgesSideCard) — **옵션 B 통합**
- 더보기 메뉴 "계정·도움" 그룹에 "마이페이지" 1 항목 추가 (의뢰서 §3-7 진입점 2)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/profile/_v2/mypage-hub-data.ts | HUB_CARDS_TIER1 (4) + HUB_QUICK_BASE (4) 데이터 상수 | 신규 |
| src/app/(web)/profile/_v2/mypage-hub-card.tsx | MyPageHubQuickCard — Tier 2 작은 카드 | 신규 |
| src/app/(web)/profile/_v2/mypage-hub.tsx | MyPageHub — eyebrow+h2 + Tier 1 grid + Tier 2 grid | 신규 |
| src/app/(web)/profile/page.tsx | Hero 카드 (전폭) 추가 + 본문 2열 좌우 swap (좌 hub / 우 320 aside) + Tier 1 4 슬롯 JSX | 수정 |
| src/components/bdr-v2/more-groups.ts | "계정·도움" 첫 항목에 마이페이지 (🏠 /profile) 추가 | 수정 |
| src/app/globals.css | .mypage-hub-grid (1열 분기) / .mypage-quick-grid (2x2 분기) 720px | 수정 |

🔧 자동 검수:
| 항목 | 기대 | 결과 |
|----|----|----|
| tsc --noEmit | EXIT=0 | EXIT=0 ✓ |
| 하드코딩 hex | 0 | #fff 텍스트색만 (운영 보편) ✓ |
| lucide-react | 0 | 0 ✓ |
| Material Symbols | 사용 | hub 1 + card 1 ✓ |
| 720 분기 (룰 13) | 2 클래스 | hub-grid + quick-grid ✓ |
| API/route.ts 변경 | 0 | 0 ✓ |
| 신규 라우트 | 0 | 0 ✓ |
| getWebSession + Promise.all 7쿼리 | 보존 | 보존 ✓ |
| 9 서브 라우트 (/profile/{edit,bookings,...}) | 진입 그대로 | 그대로 ✓ |

💡 tester 참고:
- 테스트 방법: 로그인 후 /profile 진입 → 상단 큰 Hero 카드 → 본문 좌 마이페이지 hub → 우 sticky aside 노출 확인
- 정상 동작:
  (1) 큰 카드 4개 클릭 → /profile/{edit, basketball, growth, activity} 이동
  (2) quick 4개 클릭 → /profile/bookings, /profile/weekly-report, /notifications, /profile/achievements 이동
  (3) 모바일(<720px): hub-grid 1열, quick-grid 2x2 분기
  (4) name_verified=true → ✓ 인증완료 / false → 미인증 뱃지
  (5) unreadCount > 0 시 quick 알림 카드 우상단 코너 뱃지 + Hero 알림 버튼 카운트
  (6) 더보기 "계정·도움" 첫 항목 🏠 마이페이지 → /profile
- 주의할 입력:
  (a) 비로그인 → 기존 로그인 유도 UI (변경 0)
  (b) primaryTeam null → Hero 메타에 팀명 미노출, 우 사이드 TeamSideCard 미표시
  (c) seasonStatsData.ppg/apg/rpg null → "—" 폴백 (basketball 카드)
  (d) Hero h1 "닉네임 의 농구" — 닉네임이 영문/한글 혼합 시 var(--accent) 색상만 닉네임에 적용

⚠️ reviewer 참고:
- **레이아웃 swap**: v2.3 좌 320 / 우 1fr → v2.4 좌 1fr / 우 320. profile-grid 720 분기는 두 케이스 모두 1열 stack 처리하므로 변경 불필요
- **HeroCard 중복**: 상단 큰 Hero 카드와 우측 sticky aside 의 기존 HeroCard 가 동시 노출 — bio/별점/주최 경기 정보가 좌측 사이드 HeroCard 에만 있어 보존 (옵션: 사용자 단순화 요청 시 우측 HeroCard 제거 가능)
- **Hero h1 색상**: 닉네임=var(--accent) + " 의 농구"=var(--ink-soft) (시안 캡처 16)
- **Tier 1 본문 슬롯**: profile=dl 4행 / basketball=PPG/APG/RPG 3 통계(borderLeft+Right 구분) / growth=차트 placeholder / activity=정적 막대 7개 [40,60,30,80,70,50,90]. growth/activity placeholder 는 의뢰서 §6 "API 0 변경" 룰 준수 (실 데이터는 클릭 후 서브 페이지)
- **공개 프로필 버튼**: `/users/${user.id.toString()}` (BigInt → string)
- **데이터 패칭 0 변경**: page.tsx 기존 7 쿼리 + Promise.all 그대로. user.id 추가 select 도 0 (이미 select 됨)
- **이전 작업 (referee-info)와의 침범 0**: developer 동시 진행이지만 영역 분리 — 이번 작업은 /profile 만 수정

📦 PM 액션:
- 커밋 메시지: `feat(profile): 마이페이지 hub 박제 — Hero + 4 카드 그리드 + quick 카드 (의뢰서 + 캡처 16)`
- referee-info 작업과 별도 커밋 권장 (변경 영역 분리)

### 이전 작업 — v2.4 진짜 변경 박제 (RefereeInfo + CourtAdd + SeriesCreate)

### 구현 기록 (v2.4 진짜 변경 박제 — 4 영역)

📝 구현 내용:
- **RefereeInfo (A 등급, 215줄)**: 마케팅 SEO 랜딩 → 정적 SEO 카드 단순화. hero(다크 그라디언트)+4-step+tier 표+FAQ accordion → 중앙 hero+카드 3종(등록/교육/배정 borderLeft accent)+CTA 단일. _faq-client.tsx 제거. generateMetadata + Open Graph 보존 + 비로그인 정책 보존.
- **CourtAdd (B 등급, 12줄)**: placeholder 3곳 일반화 (코트 이름 / 도로명 또는 지번 주소 / 코트 분위기·이용 팁 등)
- **SeriesCreate (B 등급, 12줄)**: placeholder 3곳 일반화 (시리즈 이름 / 대회 슬로건 / 개최 장소)
- **Match (B 등급, 12줄)**: 운영 박제 대상 없음 — Match.jsx의 OpenRunPanel/MatchDetail은 운영의 어떤 페이지에도 박제된 흔적 없음 (시안 카피 텍스트 grep 0). 작업 외.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/app/(web)/referee-info/page.tsx | v2.4 정적 카드 재구성 (-433/+106) | 수정 |
| src/app/(web)/referee-info/_faq-client.tsx | v2.4 FAQ 제거로 컴포넌트 삭제 | 제거 |
| src/app/(web)/courts/submit/_form/court-submit-form.tsx | placeholder 3곳 일반화 | 수정 |
| src/app/(web)/series/new/_form/series-create-form.tsx | placeholder 3곳 일반화 | 수정 |

🔧 자동 검수:
| 항목 | 결과 |
|----|----|
| tsc --noEmit | EXIT=0 ✓ |
| 13 룰 토큰 (var(--*) only) | ✓ (#fff/#0B0D10 하드코딩 제거됨) |
| 13 룰 아이콘 (Material Symbols) | ✓ |
| 13 룰 라운딩 (4-8px) | ✓ |
| 720 분기 (auto-fit minmax) | ✓ |
| API/route.ts 변경 | 0 ✓ |
| /profile 영역 침범 | 0 ✓ (다른 developer 작업 그대로 유지) |

💡 tester 참고:
- 테스트 방법: `/referee-info` (비로그인 OK) — 정적 카드 3종 + 운영팀 문의 CTA → /help 이동
- `/courts/submit` Step 1/3 placeholder 새 텍스트 확인
- `/series/new` Step 1 + Step 2 placeholder 새 텍스트 확인
- 정상 동작: (1) /referee-info 모바일(<540px) 카드 1열 자동 (2) Open Graph 메타 유지 (3) /help 라우트 정상 이동
- 주의할 입력: (a) /referee-info 비로그인 접근 — 가드 0 ✓ (b) Open Graph type=website 유지

⚠️ reviewer 참고:
- v2.4 시안의 setRoute('help') → 운영의 next/link href="/help"로 매핑 (라우트 보존)
- _faq-client.tsx 제거는 v2.4 시안 의도와 일치 (FAQ 영역 통째로 빠짐)
- Match.jsx 12줄 변경은 운영에 박제된 적 없는 영역 (작업 외) — Tournament 상세 카피 문구는 운영의 tournaments/[id]는 자체 V2TournamentHero/TournamentAbout 컴포넌트라 시안 카피 미박제

📦 커밋 (2건):
- 002aeae: `feat(referee-info): v2.4 시안 정적 카드 재구성 (A 등급 215줄)`
- 2661542: `style(misc): v2.4 시안 미세 동기화 — CourtAdd / SeriesCreate placeholder`

### 이전 구현 기록 (v2.4 Games.jsx 박제 검증 — 변경 0)

📝 결론: `Dev/design/BDR v2.4/screens/Games.jsx` 는 v2.2/v2.3 과 byte 일치 (`diff -w` 0 출력, 모두 101줄). Phase 1 시점에 운영 코드(`src/app/(web)/games/page.tsx` + `_components/games-client.tsx` + `src/components/bdr-v2/game-card.tsx` + `kind-tab-bar.tsx` + `filter-chip-bar.tsx`)에 시안 1:1 박제 완료. v2.4 신규 변경분 0 → **운영 변경 0**.

| 시안 요소 | 운영 매칭 | 상태 |
|----|----|----|
| eyebrow + h1 + 서브 + CTA | page.tsx L185-210 | ✓ |
| 탭 4종 (전체/픽업/게스트 모집/연습경기) + counts | kind-tab-bar.tsx | ✓ |
| 필터 칩 7종 (URL 4 + 클라 3) | filter-chip-bar.tsx | ✓ |
| 카드 (stripe + 배지 + 지역 + 제목 + 4행 + tags + 진행률 + 신청) | game-card.tsx | ✓ |
| 토큰 var(--cafe-blue/--bdr-red/--ok) | game-card.tsx L72-76 | ✓ |
| Material Symbols `add` (Icon.plus 대체) | page.tsx L204 | ✓ |
| 720px 분기 (auto-fill minmax 320,1fr) | games-client.tsx L142 | ✓ |

🔧 자동 검수:
| 항목 | 결과 |
|----|----|
| `diff -w v2.2/v2.3/v2.4 Games.jsx` | 0 출력 ✓ |
| `wc -l` 3 시안 | 101/101/101 ✓ |
| 운영 시안 매칭 8 케이스 | 8/8 ✓ |
| tsc --noEmit | EXIT=0 ✓ |
| 토큰 위반 (하드코딩 hex) | 0 ✓ |
| lucide 위반 | 0 ✓ |

💡 PM 참고:
- 시안 v2.2 → v2.4 차이 0 = 사용자 캡처 17의 디자인은 이미 운영에 반영된 상태. 사용자가 특정 차이를 본 게 아니라 "현재 운영 모습이 v2.4와 동일한가?" 확인 요청으로 해석 가능
- DB 매핑 차이 0: 시안 `g.kind` ↔ 운영 `gameType` (0/1/2 매핑) / `g.spots` ↔ `maxParticipants` / `g.applied` ↔ `currentParticipants` / `g.fee` ↔ `feePerPerson` / `g.area` ↔ `city+district` / `g.host` ↔ `authorNickname`. 모두 game-card.tsx 에서 정합 처리 완료
- tags: DB 컬럼 부재 → games-client.tsx `deriveTags()` 에서 fee=0/skill=초보/주말 3종 자동 파생 (DQ3 방침)
- 카드 그리드: 시안 명시 `repeat(auto-fill, minmax(320px, 1fr))` = 데스크톱 3~4열 + 480 미만 자동 1열 (720 분기 별도 미디어 룰 불필요)

📦 다음 PM 액션:
- 운영 변경 0 → 커밋 0 → push 0
- 다음 박제 후보: BDR v2.4 미박제 시안(About/Achievements/Awards/Calendar/Search 등) 또는 사용자 캡처 다른 화면

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
| 2026-05-01 | (커밋 3건 대기, subin) | **R-A + R-B' + R-C-4 통합 (developer)**: v2.4 새 다운로드 재박제. R-A 시안 회귀 정리: components.jsx AppNav 함수 03 §1 frozen 카피 (moreOpen/dropdown trigger/RDM 아바타 영구 제거 + Icon.mail 신규 + util-left 분리 + drawer 5그룹) + ThemeSwitch viewport 분기 + screens/{Referee,GameReport,GameResult,GuestApps}.jsx 4 파일 제거 + MyBDR.html 가짜 라우트 4 매칭 + script 4 참조 제거 + RefereeInfo/mypage 매칭 신규. R-B' 룰 9 갱신 (시안 우선 정책 2026-05-01): 00-master-guide / 01-user-design-decisions §6-1 / 06-self-checklist §4+§9 / CLAUDE.md L96 "서울 3x3 / 다음카페" 허용. About 운영진 실명 박제 금지는 보존. Footer.tsx 변경 0. R-C-4 운영 app-nav.tsx 03 frozen 재적용: tabs kind 필드 제거 + moreOpen state 제거 + MorePanel 함수 (~190줄) 영구 제거 + 9번째 'more' = drawer 토글 (PC/모바일 동일). AppDrawer prop type 갱신. tsc EXIT=0. 자동 검수 7 케이스 모두 통과. 변경: 시안 7 + knowledge 3 + CLAUDE.md 1 + 운영 2 = 13 파일 (이 중 4 파일 삭제). | ✅ |
| 2026-04-30 | (미커밋, subin) | **v2.4 풍부 디테일 통합 — 재박제 (developer)**: 시안 v2.4 Profile.jsx (125줄) 풍부 디테일을 운영 /profile 에 옵션 B 통합. (1) HeroCard 96 아바타 = team.primaryColor → 검정 그라디언트 (이미지 없을 때만, 팀 없으면 BDR Red 폴백). (2) 상단 큰 Hero 배너 아바타도 heroAvatarBg 적용. (3) ActivityTimeline kind 5종 확장 (post/application/match/win/loss/team) + badgeClass 매핑 (win=ok, loss=red, post/match/team=soft). (4) _components/ 14종 → _archived/ 격리 (radar-chart만 보존 — users/[id] 사용 중). _archived/ability-section.tsx import 경로 ../_components/radar-chart 수정. tsc EXIT=0. 이전 박제 83a9363 의 Hero+hub+quick+aside 풍부 구조 100% 보존. API/route.ts 변경 0. 변경: 3 파일 수정 + 14 파일 이동. | ✅ |
| 2026-04-30 | (미커밋, subin) | **v2.4 마이페이지 hub 박제 — Hero + 4 카드 + quick (developer)**: 의뢰서 (852줄) + 캡처 16 기준. 신규 3 파일(_v2/mypage-hub-data.ts / mypage-hub-card.tsx / mypage-hub.tsx). 수정 3 파일(profile/page.tsx 상단 큰 Hero 카드+본문 좌우 swap+Tier 1 4 슬롯, more-groups.ts "마이페이지" 1 항목 추가, globals.css 720 분기 2 클래스). 옵션 B 통합 — 우측 sticky aside 에 기존 v2.3 컴포넌트 6종 보존. tsc EXIT=0. 박제 룰 검수 통과 (var(--*) 토큰 / Material Symbols / 720 분기 / API 0 / 신규 라우트 0). 변경: 6 파일. | ✅ |
| 2026-04-30 | 002aeae+2661542 (subin, 미푸시) | **v2.4 진짜 변경 박제 — 4 영역 (developer)**: A 등급 RefereeInfo (215줄) — SEO 마케팅 hero+4-step+tier+FAQ → 정적 카드 3종(등록/교육/배정 borderLeft accent)+CTA 단일 재구성. _faq-client.tsx 제거. generateMetadata+Open Graph+비로그인 정책 보존. B 등급 CourtAdd/SeriesCreate placeholder 각 3곳 일반화. Match.jsx 변경 12줄은 운영 박제 대상 없음 확인(grep 0). tsc 0. /profile 영역 침범 0. 변경 4 파일(+112/-439). | ✅ |
| 2026-04-30 | (변경 0, 커밋 0) | **v2.4 Games.jsx 박제 검증** (developer): `Dev/design/BDR v2.4/screens/Games.jsx` byte 차이 0 (v2.2=v2.3=v2.4 모두 101줄, `diff -w` 빈 출력) — Phase 1 박제 시점에 v2.4 시안도 100% 운영 동기화 완료. 운영 매칭 8 케이스(eyebrow/h1/CTA/탭4/칩7/카드 stripe/토큰/720분기) 모두 통과. tsc 0. 운영 코드 변경 0. PM 다음 박제 후보로 진행 권장. | ✅ |
| 2026-04-30 | (미커밋, subin) | **Phase C — AppNav frozen Phase 19 쪽지 아이콘 운영 동기화** (developer): `src/components/bdr-v2/app-nav.tsx` 검색 ↔ 알림 사이에 쪽지 Link 신규 — Material Symbols `mail_outline` + href=/messages + `app-nav__icon-btn` + 로그인 가드. /messages 라우트는 Phase 8 박제로 이미 운영 중 → stub 신규 0. 빨간 점 뱃지 No-badge 시작(messages unread prop 미존재 — 후속 큐). /profile 본문은 v2.3 ↔ v2.4 `diff -w` 0 출력으로 Skip. 검수 6 케이스 모두 통과 (RDM 위반 0 / mail_outline 매칭 3 / icon-btn 3 Link / btn--sm 위반 0 / tsc 0 / /messages 존재). 변경: 수정 1 파일(+18/-1). | ✅ |
| 2026-04-30 | (커밋 2건 대기, subin) | **v2.4 시안 자체 정리 Phase A + B 일괄** (developer): `Dev/design/BDR v2.4/` 시안 자체 박제 룰 적용 (운영 코드 변경 0). Phase A AppNav frozen (uploads/03 §1) 카피 — 9탭(더보기 9번째) + ThemeSwitch viewport 분기 + util-left class + Phase 19 Icon.mail + 우측 5컨트롤 + drawer 5그룹. moreGroups: bracket/tournamentEnroll/guestApply/refereeRequest 4건 제거(PM 큐) + communityNew/gameNew + refereeInfo 별칭. screens/_archived/ 폴더 (4건 격리). RefereeInfo.jsx 신규. tokens.css frozen CSS 6종. Phase B 카피 룰 11/12/13 — "서울 3x3 농구" 5건 / "다음카페" 4건 / placeholder "예:" 12건 / pill 999px 2건 일괄 픽스. 자동 검수 13 케이스 통과. 변경: 16 파일. PM 결정 큐 3건. | ✅ |
| 2026-05-01 | (변경 0, 커밋 0) | **v2.3 P1 영역 A+B+C+D 동기화 검증** (developer): EditProfile/Settings/Billing/MyActivity v2.2 ↔ v2.3 시안 byte 차이는 EOL 변환만(`diff -w` 0) — 박제 코드 변경 0. tsc 0 에러. PM 액션: 시안 변경 의도 있었다면 시안 누락 가능성. | ✅ |
| 2026-05-01 | (미커밋, subin) | **v2.3 마이페이지 hub 박제 — `/profile` Profile.jsx 1:1** (developer): Profile.jsx 시안 박제. page.tsx user select +name_verified / teamMember select 모드 / game_applications findMany take:3 / nextGames status:Int 0/1 보존 / HeroCard +jerseyNumber, UpcomingGames game→games 배열. _v2/hero-card.tsx 메타 1줄 "팀·포지션·#N" + flexWrap. _v2/team-side-card.tsx +wins/losses/draws + "12W 5L · 외 N팀". _v2/upcoming-games.tsx + status:number\|null + scheduledAt non-null + badgeFor() 헬퍼. _v2/season-stats.tsx + .season-stats-grid. globals.css 720 미디어 룰 3종 추가. **API fetch 0 변경** (select 컬럼만 추가). 변경: 6 파일. | ✅ |
| 2026-04-30 | (커밋 2건 대기, subin) | **P0 Step 4 + 5 백버튼 18 페이지 + 커뮤니티 모바일 탭** (developer): `page-back-button.tsx`(60줄) 신규 + history.length 가드 + fallbackHref + lg:hidden + 44px. profile 9 + organizations 4 + courts 5 = 18 페이지 일괄. community-aside.tsx fragment 분기 모바일 8 카테고리 가로 스크롤 탭. globals.css `.aside-mobile-tabs` +50줄. tsc 0. 변경: 21 파일. | ✅ |
| 2026-04-30 | (미커밋, subin) | **P0 Step 1 + 3 가입+대회 흐름 + 404** (developer): onboarding/setup done "프로필 추가 완성하기 →" CTA / tournaments/[id]/join "내 신청 내역 보기" 1순위 CTA / pricing/checkout 401 redirect 보존 + isValidRedirect / (web)/not-found.tsx 신규(60줄, search_off + 3 CTA). 변경: 4 파일. tsc 0. | ✅ |
