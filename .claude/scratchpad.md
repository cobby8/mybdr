# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**5/4 알기자 backfill 완료** — 운영 GEMINI_API_KEY 설정 후 누락 7매치(#141~#147) draft INSERT (post 1373~1379). 운영자 admin/news 검수 후 publish 대기. 다음 진입점 = 매치 코드 신규 체계 (Phase 1~7).

---

## 🎯 다음 세션 진입점 (2026-05-02 종료 시점)

### **🚀 1순위 — 매치 코드 신규 체계 도입 (Phase 1~7, ~3~4h)**

**형식**: `{short_code}[종별][디비전]-{NNN}` 7~10자 (예: `M21-001` / `M21-D1-001` / `M21-A-001` / `M21-A1-001`)

**Phase**: ① schema (short_code + match_code + UNIQUE + category denorm) → ② helper module → ③ 운영 backfill (몰텐배 27매치) → ④ generator 4종 통합 → ⑤ UI 노출 → ⑥ 미부여 backfill (TEST 16/열혈 31) → ⑦ deep link (옵션)

**결정 4건 대기**: Q1 자동생성 알고리즘 A/B/C(권장 C 하이브리드) / Q2 형식(3~7자/영대+숫자/첫글자영문) / Q3 변경정책(영구 추천) / Q4 `series.short_code` 컬럼 신설 여부

**핵심 분석 (운영 25개 대회)**: `tournaments.categories` JSON 만 채워짐 (몰텐배·TEST), `tournament_teams.category/division_tier` 거의 null, 매치번호 부여 일관성 X, `match_number` UNIQUE 인덱스 부재

---

### 🟡 HOLD 큐
- **자율 QA 봇 시스템** (사용자: "내가 얘기 안 꺼내면 환기해줘") — Phase 1~5 / 9d
- **BDR 기자봇 v2** — Phase 1 완료 (알기자 / Gemini 2.5 Flash). Phase 2~7 (DB articles + 게시판 'news' 카테고리 + 사용자 선별 + 피드백) 대기

---

## 🔴 5/2 대회 종료 후 잔여 큐 (미완료만)

| # | 항목 | 상태 |
|---|---|---|
| **A** | **placeholder User 89명** — 5/3 누적 -21 (박백호 -1 + 셋업 -2 + 18건 일괄 -18). 보류 3건 (오승준/이상현/이정민 동명이인). 잔여 86건 LOW (본인 미가입 — 본인 가입 시점에 mergeTempMember 자동 처리) | 🟡 89/107 |
| **B** | **ttp 부족팀 5팀** — MI 9 / 슬로우 8 / MZ 11 / SA 9 / 우아한 9 (12명 미만). 운영팀 명단 컨택 필요 | 🟡 사용자 액션 |

**5/2~5/3 완료** (압축 — 상세는 git log): 셋업팀 가입 대기 17명 정리 + approveJoinRequests 함수 ✅ / 셋업 ttp 매핑 ✅ / mergeTempMember 강화 (e029fac) ✅ / 미가입 명단 INSERT (블랙라벨 11/MSA 5/슬로우 8) ✅ / 가입신청 pending 16건 일괄 approve ✅

---

## 우선순위 2 — 결정 대기 큐 (사용자 판단 후 구현)

| 영역 | 결정 건수 | 산출물 |
|---|---|---|
| **관리자페이지 UI 개선** | 6건 (Phase A 모바일 가드 1순위) | `git log -- .claude/scratchpad.md` "관리자페이지 UI 개선" |
| **Games 박제 Phase A** (dead code 정리) | 별도 commit 큐 | commit `f4b55c2` 직전 |
| **Phase F2 wrapper 연결** | mount 완료 (a437829) | commit `2dc9af8` |
| **Teams Phase A** | dead code 5 파일 삭제 commit | commit `dfe5eb5` 직전 |

---

## 우선순위 3 — 인프라 / 영구 큐
- 카카오맵 SDK Places 통합 / 미매칭 placeholder 73명 통합 / PortOne 본인인증 / 대회 로컬룰
- 슛존 / 스카우팅 / 시즌통계 / VS비교 / 커뮤니티 답글 / waitlist / QR 티켓
- AppNav 쪽지 unread count 뱃지 / D-6 §2~§4 / D-3 §02·§05 / Q1 후속 옛 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| **5/2 동호회최강전 D-day 운영** | ✅ DB 16팀 + 27경기 + 회귀 방지 5종 + audit log |
| **dual_tournament 진출 슬롯 회귀 방지** | ✅ A~E 5종 (자가 치유 / PATCH 차단 / dirty tracking / 검출 / audit log) |
| **PC UI** | ✅ 우승예측 사이드바 / 일정 카드 콤팩트+그리드+매치번호 |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| 듀얼토너먼트 풀 시스템 | ✅ Phase A~F2 |
| **Live `/live/[id]` v2** | ✅ STL Phase 1~2 + **minutes-engine v3 (메인 path 4단계 + LRM cap, 종료 100%/라이브 99%, test 21/21)** |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-04 | 9b4019a (dev) + 887b89c (main) merge + 운영 DB INSERT 7건 (post 1373~1379) | **알기자 누락 7매치 backfill 완료 (#141~#147)** — (a) subin→dev→main 머지 (settings.local.json conflict 해결: jumpball/awk/xargs git 3개 권한 통합) (b) 일회성 스크립트가 운영 endpoint `/api/live/{141..147}/brief?mode=phase2-match` 7번 fetch (1초 간격, rate-limit 회피) → 응답 brief 받아 운영 DB community_posts INSERT (status=draft, category=news, alkija user_id=3350, period_type=match) (c) 결과: 7/7 created, 0 skipped, 0 failed (post_id 1373~1379) (d) 임시 스크립트 2개 (`scripts/_temp/check-news-backfill.ts` + `backfill-news-141-147.ts`) 즉시 삭제 (e) errors.md 알기자 silent fail entry fix 항목에 ✅ backfill 완료 박제 (f) 운영자 admin/news 검수 → publish 대기 | ✅ |
| 2026-05-04 | 0b47489 + 9d72cf5 + 2bfb873 + 78b0bae + b141e53 (5 commits push) | **대회·경기 헤더 UI 개편** — (a) 대회 헤더 좌측 제목 + 우측 컨트롤 5개 (.games-header 패턴, 경기와 동일) (b) segmented 탭 풀폭 (글자 잘림 0) (c) 컨트롤 90% 축소: 검색/필터 36→32 (모바일 25 → 사용자 의도로 28 복원) / ViewToggle 모바일 px-1 py-0.5 (d) `.games-create-btn` height 36→32 + padding 0×10 / `.games-filter-btn` 32×32 통일 (e) GamesClient 가 헤더 통합 렌더 (filterOpen state 같은 client tree 보장) / KindTabBar filter 토글 prop 미전달. 미푸시 0 | ✅ |
| 2026-05-04 | 4658963 | **시간 데이터 소실 매치 안내 배너 + #141 stat 14건 박제** — 매치 #141 (블랙라벨 vs MSA 52:31) matchPlayerStat 14건 INSERT (블랙 8 + MSA 6 / minutesPlayed=null / isStarter=null). settings.timeDataMissing=true 플래그 + reason 메모. API route timeDataMissing 응답 추가 + game-result.tsx 인터페이스 +1 + Hero 직후 안내 배너 (info 아이콘 + warn 색). 합산 검증 PTS/FG/3P/REB/AST 모두 TEAM 합 정확 일치 | ✅ |
| 2026-05-04 | (debugger / 진단) | **카테고리 가로 스크롤 fade overlay 미표시 — 코드/CSS/배포 모두 정상 = 사용자 브라우저 캐시 본질** — 운영 HTML(`https://www.mybdr.kr/community`) curl + CSS chunk 4종 다운로드 검증. ① `community-aside.tsx` L100~131 wrap+fade 마크업 정상 (`<div className="aside-mobile-tabs-wrap">` + `<div className="aside-mobile-tabs-fade" aria-hidden>` + `chevron_right`). ② `community-content.tsx` L383~424 sort-bar-mobile-wrap+fade 정상. ③ `globals.css` L540~593 + L601~656 wrap/fade/PC 숨김 모두 정상. ④ 운영 CSS 빌드 정상: `.aside-mobile-tabs-wrap{margin:0 0 10px;position:relative}` + `.aside-mobile-tabs-fade{...display:flex;position:absolute;top:0;bottom:6px;right:0}` + `@media (min-width:1024px){.aside-mobile-tabs-wrap{display:none!important}}`. ⑤ 운영 머지 정상 (a049dcd → main `22e11e3`). ⑥ Material Symbols 폰트 운영 head 정상 로드 (Google Fonts). ⑦ Vercel cache STALE → revalidate 정상 (서버는 새 HTML/CSS 보유). **본질 = 시나리오 1(브라우저 캐시) — 사용자가 머지(05:04 01:52) 이전부터 열린 community 탭에서 hard reload 안 해 옛 hydrated 상태 유지**. SSR 미렌더 (community-content가 `"use client"` + fallbackPosts JSON props만 SSR) 이므로 hydration 후 client에서만 wrap/fade 마크업 생성됨. 옛 빌드 client bundle은 wrap 마크업 없음. **즉시 fix = 사용자에게 "Ctrl+F5 (또는 모바일 시크릿창)으로 hard reload 안내"**. 추가 코드 수정 불필요 | ✅ |
| 2026-05-04 | (developer / 미커밋) | **카테고리/정렬 바 가로 스크롤 시각 indicator 강화 (3차 fix)** — 사용자 3회 보고 "카테고리 4개만 보이고 우측 잘림 인지 못함". mask-image (24px fade) → wrap 래퍼 + fade overlay div + chevron_right 아이콘 마크업 패턴으로 교체. ① community-aside.tsx `CommunityMobileTabs` — `<div className="aside-mobile-tabs-wrap">` 래퍼 + 우측 fade overlay (`aria-hidden`). ② community-content.tsx 정렬바 — `sort-bar-mobile-wrap` 래퍼 + fade overlay. ③ globals.css — mask-image 제거, `.aside-mobile-tabs-wrap` (position:relative) + `.aside-mobile-tabs-fade` (position:absolute, right:0, bottom:6px, width:32px, linear-gradient bg, pointer-events:none, z-index:1) 신규. sort-bar 동일 패턴 (border-radius 우측 둥근 모서리 보존). 기존 .aside-mobile-tabs padding-right 24→36 (overlay 32px + 여유). PC(≥1024px) wrap 자체 숨김. tsc exit 0 | ✅ |
| 2026-05-03 | (developer / 미커밋) | **모바일 Hero 추가 압축 + 가로스크롤 fade mask** — globals.css 3구역 수정. ① `.page` 모바일 padding 32/80 → 16/40 (게임 페이지 Hero 처럼 첫 컨텐츠 도달 빠르게). ② `.page-hero` 모바일 margin-bottom 12→6 / __title margin 0/2→0 / __eyebrow 4→2 (5 페이지 일괄 적용 — community/tournaments/teams/rankings/courts). 데스크톱(720+) margin-bottom 16→12. ③ `.aside-mobile-tabs` & `.sort-bar-mobile` 가로스크롤 강화 — scrollbar 4→6px / 우측 24px mask-image fade gradient (iOS Safari/Android Chrome 에서 scrollbar 무시되어도 fade 로 "더 있음" 시각 신호) + padding-right 24px (마지막 탭 가려짐 방지). +34/-13 lines. tsc 통과 | ✅ |
| 2026-05-03 | (developer / 미커밋) | **커뮤니티 모바일 카테고리 fix + Hero 공통 룰 도입** — globals.css 신규 3종 (.aside-mobile-tabs scrollbar 4px accent / .sort-bar-mobile 가로스크롤+인디케이터 / .page-hero+__eyebrow+__title+__subtitle 모바일 압축). community-aside.tsx CommunityMobileTabs 분리 export (useCategoryNewCounts hook 공유). community-content.tsx 모바일 탭 위치 이동 (사이드바 → "전체 N개의 글" 직전) + Hero 인라인 → .page-hero + 정렬바 → .sort-bar-mobile. 4 페이지 Hero 마이그 (tournaments/teams/rankings/courts). 사용자 요청: "카테고리 가로 스크롤 안 됨/인디케이터 / 위치 이동 / Hero 빈공간 축소 공통 적용". tsc 통과 (exit 0). before: h1 28px + margin 6/4 + padding 인라인 / after: h1 22px(모바일)→26px(720+) + margin 0/2 + .page-hero margin-bottom 12→16 | ✅ |
| 2026-05-03 | (debugger / SELECT only + curl) | **알기자 Phase 2 자동 트리거 진단** — 5/2~5/3 종료 매치 30건 vs 알기자 게시물 9건 (모두 published / cat=news / tournament_match_id 보유 / 132~139 매치). 자동 트리거 deploy = 5/3 13:44 (commit 2e6d367 / PR #130). deploy 이후 종료 7매치 (141,142,143,144,145,146,147) **게시물 0건**. 운영 curl 검증: 7매치 모두 `{ok:false, reason:"missing_api_key"}`. **본질 = 운영 GEMINI_API_KEY 미설정 + fire-and-forget silent fail (호출은 발동했으나 brief route 가 missing_api_key 응답 → community_posts INSERT skip)**. fix = 사용자가 Vercel production env 에 GEMINI_API_KEY 추가 + 재배포 + (옵션) admin/news 에서 누락 7매치 regenerate. errors.md 신규 entry 1건 추가. _temp 스크립트 정리 | ✅ |
| 2026-05-03 | (debugger / SELECT only) | **SKD #5 안원교 중복 진단** — User 3342(ph) status=merged + ttp/tm 잔재 0건 / User 3351(real) ttp 1건+tm 1건+stat 2경기 정상 / 같은 팀·대회 중복 0건. 진단 = 시나리오 B/C **캐시 문제** (DB 통합 완료 / API roster·members 응답 1건만 반환). 권장 = 운영자에게 앱 새로고침 안내. 처리 큐 ttp_id=2829/tm_id=2670 = 이미 3351 가리킴. _temp 스크립트 정리 완료 | ✅ |
| 2026-05-03 | f8fe8f0 + fcb6f92 | **Admin-Web 시각 통합 Phase 1+2+3** — `globals.css` alias 9개 보강 (`--color-accent` `-hover` `-light` `-error` `-warning` `-success` `-border-subtle` `-text-dim` `--shadow-card`) + `.admin-table thead` `var(--bg-head)` 톤 정합 + admin sidebar/mobile-admin-nav 에 `ThemeSwitch` 마운트 (theme-preference localStorage 키 web 일관). admin 코드 변경 0 (alias 보강만으로 405건 자동 정합) / web 영향 0 / 다크모드 강제 ❌ / decisions.md +1 박제 | ✅ |
<!-- 5/3 마무리 압축 / 매치 #145 진단 / 듀얼 시뮬 ROLLBACK 3건 절단 (10건 유지 — 신규 1건 prepend, 5/4 알기자 backfill 추가) — 필요 시 git log -- .claude/scratchpad.md 로 복원 -->
