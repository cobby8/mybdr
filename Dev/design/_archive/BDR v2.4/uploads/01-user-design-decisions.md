# BDR v2 사용자 디자인 결정 기록

> **상태**: active (영구 참조)
> **작성**: 2026-04-30
> **목적**: 사용자가 직접 지시한 디자인 결정사항을 보존. 향후 자동 작업/리팩토링이 이 결정들을 되돌리지 않도록 명시적 가드.
> **회귀 방지 룰**: 본 문서의 결정과 충돌하는 변경 제안 시 사용자 확인 필수.
> **상위 문서**: [DESIGN.md](./DESIGN.md), [README.md](./README.md)

## 1. 헤더 구조 (AppNav)

### 1-1. 글로벌 헤더 단일화
- **결정**: (web) 라우트 그룹은 AppNav 단일 헤더만 사용
- **근거**: 직전 헤더 중첩 이슈 (이중 헤더) 방지
- **회귀 금지**: 페이지 자체에 별도 nav 추가 X
- **commit**: aa61003

### 1-2. utility bar (상단 파란 바)
- **결정**: 좌측 "MyBDR 커뮤니티 / 소개 / 요금제 / 도움말" + 우측 "계정 / 설정 / 로그아웃"
- **모바일 가시성**: 우측 "계정/설정/로그아웃" 모두 표시 (좌측만 hide)
- **회귀 금지**: utility bar에서 우측 메뉴 숨기지 말 것
- **commit**: aa61003

### 1-3. main bar 우측 컨트롤
- **결정**: 검색 + 알림 + 다크모드 토글 + 햄버거 (모바일)
- **삭제됨**: 더보기 드롭다운 트리거, 계정 아이콘+닉네임
- **회귀 금지**: 더보기 드롭다운을 main bar로 다시 옮기지 말 것
- **commit**: aa61003

### 1-4. 메인 탭 9개
- **결정**: 홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/**더보기**
- **더보기 동작**: 마지막 탭, 클릭 시 MorePanel 토글
- **회귀 금지**: "더보기"를 별도 위치(우측 드롭다운 등)로 옮기지 말 것

### 1-5. 검색 + 알림 박스 제거
- **결정**: btn--sm border/배경 → app-nav__icon-btn 아이콘만
- **알림 빨간 점 뱃지**: 유지 (`.app-nav__notif-dot`)
- **회귀 금지**: 박스 다시 씌우지 말 것
- **commit**: 3796f55

### 1-6. 다크모드 토글 — 하이브리드
- **결정**:
  - 데스크톱 (md ≥ 768px): 두 라벨 토글 ("라이트 / 다크") — v2.1 시안 매칭
  - 모바일 (md < 768px): 단일 아이콘 토글 (☀/☾) — 햄버거 영역 압박 해소
- **회귀 금지**: 한 형태로만 통합하지 말 것 (각 viewport 의도 다름)
- **commit**: 42c290f
- **근거**: 사용자 캡처 36/38 (데스크톱 시안), 캡처 41 (모바일 잘림)

### 1-7. AppNav 모바일 닉네임
- **결정**: 모바일에서 닉네임 hidden (햄버거와 충돌 방지) — span에 hidden sm:inline
- **commit**: db69eea

## 2. 더보기 메뉴 (more-groups)

### 2-1. 5그룹 구조
- 내 활동 / 경기·대회 / 등록·예약 / 둘러보기 / 계정·도움
- **commit**: aa61003

### 2-2. 가짜링크 4건 제거
- **결정**: DB/API 미지원 가짜 링크 제거
  - guestApps / gameResult / gameReport / referee
- **회귀 금지**: 라우트 미존재 항목을 메뉴에 추가하지 말 것 (phase-9-future-features.md §1-A 정책)
- **commit**: aa61003

### 2-3. v2.1 신규 진입점 8건
- **결정**: courtAdd / teamManage / searchResults / editProfile / notificationSettings / safety / passwordReset / onboardingV2 모두 등록 (라우트 존재 확인됨)
- **commit**: eb096de

## 3. 팀 페이지 (/teams + /teams/[id])

### 3-1. 팀 카드 간소화 (목록)
- **결정**: 로고 + 팀명 + 창단년도 + 상세 보기 단일 버튼만 (세로 배치)
- **삭제됨**: 레이팅 / 승 / 패 / 매치 신청 / 정렬 라벨 / 순위 #N 뱃지
- **모바일 2열**: grid-cols-2 md:grid-cols-3 xl:grid-cols-4
- **회귀 금지**: 레이팅(미구현) 노출하지 말 것
- **commit**: 61a170d, 87c59d4

### 3-2. 팀 상세 히어로
- **결정**:
  - padding 모바일 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-9
  - 220px 워터마크 모바일 hidden sm:block (글자 겹침 방지)
  - **레이팅 stat 제거** (미구현 기능) — 승/패/승률만 유지
  - Avatar overflow-hidden + clamp(14px, 4vw, 22px)
- **회귀 금지**: 레이팅 stat 다시 추가하지 말 것
- **commit**: 61a170d, 87c59d4

### 3-3. 팀 생성 (/teams/new)
- **결정**:
  - 4스텝 (기본정보/엠블럼/활동/검토)
  - **홈/어웨이 유니폼 색상** 분리 (단일 팀 컬러 X)
  - **자유 컬러피커** (HTML5 native, preset 10색 X)
  - **로고 업로드 기본 제공** (BDR+ 멤버 전용 X)
  - Supabase team-logos 버킷 사용
- **회귀 금지**: 단일 컬러 / preset 강제 / BDR+ 게이트 다시 추가하지 말 것
- **commit**: b723d4a, e45d77d, 1ff7dfc

### 3-4. 팀 관리 페이지
- **결정**: 생성 시 입력 필드 모두 편집 가능
  - home_color / away_color / logo_url 필드 추가
  - 기존 primary/secondary는 하위 호환 유지
- **권한**: captain_id 직접 매칭 추가 (team_members.role 외에도 captainId 일치 시 권한 부여)
- **commit**: de6a252, b578c46

## 4. 프로필 페이지 (/profile + /profile/settings)

### 4-1. ProfileSideNav 모바일 nav 제거
- **결정**: PC 좌측 사이드바만 유지 (모바일 가로 chip 통째 삭제)
- **시안 출처**: 캡처 36/38에 모바일 서브 네비 없음
- **회귀 금지**: 모바일에서 chip 다시 노출하지 말 것
- **commit**: d766e36

### 4-2. /profile/settings 메뉴 — 이모지 아이콘
- **결정**: PC 사이드바 아이콘을 이모지로 변경
  - 👤 계정 / 🏀 프로필 / 🔔 알림 / 🔒 개인정보·공개 / 💳 결제·멤버십 / ⚠️ 계정 관리
- **CLAUDE.md 룰 해석**: "타 라이브러리 금지" = 의존성 금지. 이모지는 Unicode → 룰 위반 X.
- **회귀 금지**: Material Symbols Outlined로 되돌리지 말 것 (시안 매칭 우선)
- **commit**: d766e36

### 4-3. /settings 더미 페이지 → /profile/settings redirect
- **결정**: 640줄 박제 페이지를 8줄 redirect로 교체
- **회귀 금지**: 박제 시안 다시 복원하지 말 것 (저장 동작 X로 사용자 혼란)
- **commit**: 9f81dc2

### 4-4. 미정의 CSS 토큰 매핑
- **결정**: var(--color-primary) 등 미정의 토큰을 v2 정의 토큰으로 매핑
  - --color-primary → --accent
  - --color-text-primary → --ink
  - --color-text-secondary/muted → --ink-mute
  - --color-success → --ok / --color-error → --danger
  - --color-surface → --bg-alt / --color-card → --bg-card
- **commit**: a88be51

### 4-5. 탭 강조선 3px 통일 (TeamTabsV2 일관)
- **결정**: profile-side-nav, settings-side-nav-v2, profile/activity 모두 border-b-[3px]
- **commit**: a88be51

## 5. 메인 페이지 (/)

### 5-1. Hero 카로셀 (3슬라이드)
- **결정**:
  - 임박 대회 / 곧 시작 게임 / 최근 MVP
  - 정적 fallback 1개 항상 보장 (BDR 커뮤니티 참여)
  - 5초 자동 회전 / hover 일시정지 / prefers-reduced-motion OFF
  - **외부 라이브러리 0** (HTML5 + 직접 touch)
  - stacking 방식 (모든 슬라이드 absolute + opacity 토글) — SEO 보장
  - TEST 토너먼트 차단 (`name NOT ILIKE '%test%'`)
- **commit**: 79cc57e

## 6. 공통 카피 / 콘텐츠

### 6-1. 글로벌 카피 통일
- **결정**: "서울 3x3 농구 커뮤니티" → "전국 농구 매칭 플랫폼"
- **이유**: mybdr는 전국 + 5x5/3x3 모두 지원
- **위치**: about/login 메타+히어로
- **commit**: 46e5d1b

### 6-2. About 운영진 실명 → 일반 라벨
- **결정**: 김승철/이경진 등 6명 실명 → 기획팀/개발팀 등 일반 라벨
- **이유**: 동의 없는 실명 노출 위험
- **회귀 금지**: 실명 다시 박제하지 말 것
- **commit**: 46e5d1b

## 7. 모바일 최적화 (Phase 9-Mobile)

### 7-1. 720px 브레이크포인트 통일
- **commit**: dc1e38a

### 7-2. 글로벌 가드 (안전망)
- @media (max-width: 768px): html/body overflow-x: hidden + max-width: 100vw
- .page overflow-x: hidden
- **commit**: f972aaf

### 7-3. iOS 자동 줌 차단
- @media (max-width: 720px) input/select/textarea { font-size: 16px !important }
- **commit**: dc1e38a

### 7-4. 버튼 44px 터치 타겟
- @media (max-width: 720px) .btn min-height: 44px
- **commit**: dc1e38a

### 7-5. 모바일 그리드 안티패턴 일괄 픽스
- 인라인 gridTemplateColumns repeat(N,1fr) 모바일 미대응 → auto-fit minmax 또는 className 분기
- 8건+ 픽스 + globals.css 글로벌 가드
- **회귀 금지**: 인라인 gridTemplateColumns 고정폭 추가 시 conventions.md 모바일 체크리스트 통과 필수
- **commit**: 4afb4f9, f972aaf

## 8. 인증/권한

### 8-1. 카카오 OAuth → 기존 user 매칭 (3단계)
- provider+uid → email → 신규 생성
- **commit**: (기존 oauth.ts 검증)

### 8-2. team.captainId 직접 매칭으로 권한 부여
- **결정**: team_members.role 매칭 외에도 team.captainId === userId 시 manager 권한 자동
- **이유**: 비표준 role(예: "director") 사용자도 captain 권한 보유 시 차단 안 되게
- **commit**: b578c46

## 9. 회귀 방지 인프라

### 9-1. PR 템플릿
- 박제 회귀 점검 5항목 + UI 깨짐 3항목 + 디자인 토큰 + Material Symbols 의무
- **commit**: 4bc8602

### 9-2. check:design 스크립트
- alert("준비 중") 신규 추가 / 인라인 grid repeat / lucide-react / 하드코딩 hex 자동 검출
- npm run check:design
- **commit**: 4bc8602

## 10. PWA + 운영 인프라

### 10-1. PWA 아이콘 BDR 로고
- BDR Navy #1B3C87 배경 + 로고 중앙 (any 70%, maskable 55%)
- 5종 정사각형 PNG 생성 (sharp 활용)
- **commit**: 1ff7dfc

### 10-2. Vercel paid plan + cron 5개
- expire-pending-bookings + game-report-reminders 추가
- **commit**: 3e23273

### 10-3. Phase 10 운영 DB 적용 완료
- game_reports / game_player_ratings / team_follows / team_match_requests
- users.styles/active_areas/goals/play_frequency
- game_applications.experience_years/accepted_terms
- teams.home_color/away_color
- teams.name_primary VarChar(10)
- 운영 DB SQL 사용자 직접 적용 완료

---

## 향후 변경 시 체크리스트

이 문서의 결정과 충돌하는 변경을 자동/수동으로 진행할 때:

1. **본 문서를 grep해서 해당 항목 확인**
2. **"회귀 금지" 명시 결정은 사용자 확인 후에만 변경**
3. **변경 시 본 문서 갱신 (날짜/사유/commit hash)**
4. **회귀 발견 시 즉시 stash/revert로 되돌리기**

## 관련 문서
- `Dev/design/DESIGN.md` — 디자인 시스템 (색상/타이포)
- `Dev/design/README.md` — Phase 9 진행 허브
- `Dev/design/phase-9-future-features.md` — 추후 구현 큐
- `Dev/design/ghost-features-and-breakage-2026-04-29.md` — 유령 기능 분석
- `.claude/knowledge/conventions.md` — 모바일 최적화 체크리스트 10항목
