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

- **요청**: BDR v2.1 모바일 분기 일괄 이식 P0-1 (Dev/design/v2.1-cli-prompts-2026-04-29.md)
- **상태**: developer 완료 (7커밋)
- **현재 담당**: developer → tester/reviewer
- **브랜치**: design_v2 (미푸시 7건 누적 — G-1~G-9)

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
| 2026-04-30 | (미커밋, subin) | **BDR v2.2 P0-1 PostEdit 박제** (subin): `(web)/community/[id]/edit/page.tsx` v2.2 시안 1:1 박제 (+398/-62) — 시안 출처 `Dev/design/BDR v2.2/screens/PostEdit.jsx`. 추가: breadcrumb(홈›게시판›글›수정), eyebrow "EDIT · COMMUNITY" + H1 "게시글 수정", 자동저장 라벨, 첨부 사진 prefill 섹션(hscroll + 삭제 + "+추가" disabled, UI만), 댓글 허용/비밀글 체크박스(disabled — 백엔드 미구현), 수정 이력 안내(history 아이콘 + "수정됨"), 권한 없음 view(lock 아이콘 + 상세/목록 복귀 — meId !== post.user_id 시). 보존 사항: useActionState(updatePostAction)/hidden public_id/fetch /api/web/community/[id]/CommunityAsideNav 모두 0 변경. 신규 fetch /api/web/me 병렬 호출(권한 체크용 meId 획득). 진입 `post-actions.tsx` dropdown 이미 존재. var(--*) 토큰만(흰색 #fff 1건은 시안 그대로 — 빨간 배경 위 ×아이콘 onColor). tsc 0건. check:design 신규 위반 0건(기존 grid repeat 45·lucide 1·hex 342은 본 파일과 무관). 1 파일. | ✅ |
| 2026-04-29 | (미커밋) | **/profile/settings 선수 프로필 섹션 재구성** (design_v2): `_components_v2/profile-section-v2.tsx` 폼 마크업 재구성 — (1) 실명 readOnly+disabled 처리 + bg-alt 배경 + cursor-not-allowed + opacity 0.7 + 11px 안내문구("전화번호 인증 후 자동 입력. 직접 수정할 수 없습니다") + PATCH body에서 `name` 키 제외(서버 안 보냄). (2) 포지션 자유 입력 → 3열 버튼 카드(G/F/C, onboarding/setup-form.tsx L44-48 패턴 차용, 선택 시 cafe-blue 2px 테두리+bg-alt). (3) 도시/구·동 단일 input 2개 → `RegionPicker max=1` (cascading select, 시/도→시/군/구), regions Region[] state 추가, useEffect에서 user.city/district→첫 슬롯 매핑, submit 시 firstRegion.city/district로 PATCH. (4) 레이아웃 2열 grid 고정 → space-y-4 1열 stack 기본 + 키/몸무게만 sm:grid-cols-2(데스크톱 2열, 모바일 1열). API/DB/route.ts 0 변경. tsc 0 에러. 1 파일. 근거: 사용자 캡처 43 + Explore 분석 | ✅ |
| 2026-04-30 | (미커밋) | **사용자 디자인 결정 영구 보존 문서 작성** (design_v2): 신규 `Dev/design/user-design-decisions-2026-04-30.md` 작성(~280줄, 10개 섹션 — 헤더/더보기/팀/프로필/메인/카피/모바일/인증/회귀방지/PWA). 각 결정에 commit hash + "회귀 금지" 명시 + 향후 변경 체크리스트 포함. README.md "영구 참조" 표에 신규 행 1줄 추가. DESIGN.md 마지막에 "사용자 결정 영구 보존" 섹션 + 참조 링크 1줄 추가. 목적: 자동 작업/리팩토링이 사용자 직접 결정을 되돌리지 않도록 명시적 가드. 3 파일(신규 1 + 갱신 2). | ✅ |
| 2026-04-29 | (미커밋) | **v2.1 시안 vs 현재 사이트 격차 4건 픽스** (design_v2): P0 theme-switch.tsx 단일 아이콘(3796f55)→두 라벨 토글 복원 — components.jsx L77~88 마크업 그대로(`<div.theme-switch role="group">` + `<button.theme-switch__btn data-active>`×2 with light_mode/dark_mode + 라이트/다크 텍스트), CSS는 globals.css L600~631 기존 룰 재사용(추가 0). P1-1 hero-card.tsx 알림 카운트 — **이미 L215에 `unreadCount > 0 ? '알림 ${n}건 확인' : '알림 확인'` 구현돼 있고 page.tsx L342에서 unreadCount 전달 중** → 추가 작업 0(검증만). P1-2 profile-side-nav.tsx 모바일 nav 제거 — `<nav.lg:hidden>` 가로 chip 블록 통째 삭제(주석으로 의도 보존), NAV_ITEMS_FLAT 미사용 const 함께 제거(복구 1줄), PC 좌측 사이드바(lg:block)는 그대로 유지. P2 settings-side-nav-v2.tsx PC 사이드바 아이콘 Material Symbols→이모지(👤🏀🔔🔒💳⚠️) — 시안 캡처 38 매칭, span 클래스 material-symbols-outlined 제거 + fontSize 18→20 + opacity 비활성 0.7, 모바일 탭은 텍스트 only 유지(이모지 영향 X). 디자인 토큰 var(--*)만 사용, 데스크톱 회귀 0. tsc 0건. 4 파일(theme-switch / hero-card는 검증만 / profile-side-nav / settings-side-nav-v2). 근거: 사용자 캡처 36/37/38/39 + components.jsx + tokens.css | ✅ |
| 2026-04-29 | bbdc2a9, f80d2ed, 162ac8c (3건 미푸시) | **BDR v2.1 DataTableV2 P2** (design_v2): 신규 컴포넌트 `src/components/bdr-v2/data-table.tsx`(~95줄) — DataTableColumn<T> 명세(primary/actions/width/render) + grid-template-columns 합성 + onRowClick 옵셔널. 모바일 ≤720px globals.css G-1 룰이 자동 카드형 변환. 적용 2/3: (1) **referee/admin/members** 7컬럼(이름 primary + 등급/매칭/자격증/검증/상태 + 상세 actions) — 데스크톱 `<table>`/모바일 `<ul>` 분기 통합, MatchBadge/VerificationBadge 재사용. (3) **admin/users** 5컬럼(닉네임 primary + 이메일/역할/관리자/상태) + onRowClick 모달 열기, statusBadge를 모듈 스코프로 끌어올림. (2) **referee/admin/settlements skip** — 9컬럼+체크박스 헤더(toggleAll)+일괄 선택 바+상태/수정 모달 2종+선택 시 fixed 액션 바 등 DataTableV2 단순 grid 모델로 흡수 불가(체크박스 컬럼 + 헤더 인터랙션 없음), 명세 "단순 표만 교체" 원칙 따라 보류. fetcher/state/handler 0 변경. tsc 0건. 변경 4 파일(컴포넌트+2 페이지+컴포넌트 onRowClick 확장). 근거: Dev/design/v2.1-cli-prompts-2026-04-29.md P2 + v2.1-vs-site-gap-2026-04-29.md §5 P2 | ✅ |
| 2026-04-29 | (미커밋) | **BDR v2.1 more-groups 신규 진입점 P0-2 검증** (design_v2): v2.1 components.jsx moreGroups 28개 vs 사이트 more-groups.ts 33개 대조. 후보 8건(courtAdd/teamManage/searchResults/editProfile/notificationSettings/safety/passwordReset/onboardingV2) 라우트 모두 존재(find page.tsx 8/8) + 본 파일에 이미 모두 등록 확인 → **실제 추가 0건**. 가짜 링크 정책상 제외 3건(gameReport/guestApply/refereeRequest) 의도적 미추가 유지. 추적성 위해 파일 헤더 코멘트 1줄(P0-2 검증 결과) 추가만 수행. id 카운트 33 유지. tsc 0건. 1 파일. 근거: Dev/design/v2.1-cli-prompts-2026-04-29.md P0-2 | ✅ |
| 2026-04-29 | 9b14439~8401325 (7건 미푸시) | **BDR v2.1 모바일 분기 일괄 이식 P0-1** (design_v2): globals.css 모바일 분기(`@media max-width:720px`) 7커밋 분리 이식. G-1 .data-table 카드형 변환 신규(+66 — 사용 0건 선이식) / G-2 3-col 포스터 → 2-col `.page` 스코프 교체(+11/-3) / G-3 season-stats 6열 → 3열(+11) / G-4 with-aside 폭 5종(340/320/300/280/360) `.page--wide`+`.page`+aside `order:-1` 모두 5종 확장(+24/-8) / G-6 sticky aside/nav static `.page` 전체+nav 포함+top:auto(+14) / G-7 fontSize 96→48 / 48(opacity:.4)→24 공백 양쪽 매처(+16) / G-8/G-9 5종 wide table → 1열 stack + row 4종 + .card 140→100(+47). 1604→1782줄(+178). v2.1 추출본 538줄 중 9개 갭만 이식, 나머지 ~360줄(메시지/라이트박스/브래킷/캘린더/hero watermark/hscroll)은 P0-2~P1 후속. tsc 0건 / check:design 신규 위반 0건. 근거: Dev/design/v2.1-cli-prompts-2026-04-29.md P0-1 + v2.1-vs-site-gap-2026-04-29.md §3-1 | ✅ |
| 2026-04-29 | (미커밋) | **시안 박제 하드코딩 텍스트 13건 일괄 처리** (design_v2): B형(개인정보) — `(web)/about/page.tsx` 운영진 6명 실명(김승철/이경진/박상우/최지혜/정혁수/한수민)→일반 팀 라벨(기획팀/개발팀/운영팀/디자인팀/커뮤니티팀/사업팀) + 직책 일반화. A형(글로벌 카피) — "서울 3x3 농구 커뮤니티"/"서울의 농구를 더 가깝게" 3곳 통일: about metadata description + Hero H1("농구를 더 가깝게") + Hero 리드("전국 농구 매칭 플랫폼") / login/page.tsx L81 sub-copy. C형(통계 4건) — about L48-51 통계는 L159 "예시" 라벨 명시되어 있어 변경 X, phase-9-future-features.md 섹션 4 Phase 11+ 큐에 항목 17 신규 추가(users/teams/tournaments COUNT + 운영기간 동적). 디자인/API/DB 0 변경. 3 파일 수정(about, login, phase-9-future-features) + 잔여 grep 검증(src/ 내 실명 0건, "서울 3x3" 본문 0건). tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | **ProfileSideNav 미정의 토큰 픽스** (design_v2): globals.css 폐기 예정인 `--color-*` 토큰을 v2 정의 토큰으로 교체 — 4 파일: profile-side-nav.tsx (active+hover 6 토큰: --color-primary→--accent / --color-text-secondary→--ink-mute / --color-text-primary→--ink / --color-surface→--bg-alt / --color-background→--bg / --color-border→--border + 모바일 border-b-2→border-b-[3px] TeamTabsV2 일관) / settings-side-nav-v2.tsx (모바일 active border 1줄 --color-primary→--accent + 3px) / activity/page.tsx (StatusBadge 8건+탭 active+EmptyState+rejected/단일 카드 background 16건 매핑) / billing/page.tsx (sed 일괄 50+건 매핑: text/primary/error/success/surface/card/border/on-primary 전체). 잔여 var(--color-*) 0건. v1/레거시 페이지(complete/edit/loading)는 Phase 1~9 점진 마이그레이션 범위라 보류. tsc 0건 | ✅ |
| 2026-04-29 | (미커밋) | **선수 프로필 저장 안 됨 픽스 A+C** (design_v2): A안 — `(web)/settings/page.tsx` 박제 390줄 → redirect 5줄(`/profile/settings`로 영구 이동), `(web)/safety/page.tsx` L122 브레드크럼 링크 `/settings`→`/profile/settings`. C안 — `lib/services/user.ts` updateProfile select 6→9필드(weight/district/birth_date 추가, schema.prisma User 모델의 snake_case 필드명 매칭, @map 없음). 디자인/API 라우트/`/profile/settings` 페이지 변경 0. tsc 0건. 3 파일. | ✅ |
