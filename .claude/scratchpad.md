# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**시간 시스템 작업 종료 (2026-05-03 저녁)** — minutes-engine v3 7회 보강 완료. 종료 매치 100% / 라이브 ~99% / Unit test 21/21 PASS / Fallback 발동 0회. 다음 진입점은 매치 코드 신규 체계 도입 (Phase 1~7).

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
| 2026-05-03 | (developer / 미커밋) | **모바일 Hero 추가 압축 + 가로스크롤 fade mask** — globals.css 3구역 수정. ① `.page` 모바일 padding 32/80 → 16/40 (게임 페이지 Hero 처럼 첫 컨텐츠 도달 빠르게). ② `.page-hero` 모바일 margin-bottom 12→6 / __title margin 0/2→0 / __eyebrow 4→2 (5 페이지 일괄 적용 — community/tournaments/teams/rankings/courts). 데스크톱(720+) margin-bottom 16→12. ③ `.aside-mobile-tabs` & `.sort-bar-mobile` 가로스크롤 강화 — scrollbar 4→6px / 우측 24px mask-image fade gradient (iOS Safari/Android Chrome 에서 scrollbar 무시되어도 fade 로 "더 있음" 시각 신호) + padding-right 24px (마지막 탭 가려짐 방지). +34/-13 lines. tsc 통과 | ✅ |
| 2026-05-03 | (developer / 미커밋) | **커뮤니티 모바일 카테고리 fix + Hero 공통 룰 도입** — globals.css 신규 3종 (.aside-mobile-tabs scrollbar 4px accent / .sort-bar-mobile 가로스크롤+인디케이터 / .page-hero+__eyebrow+__title+__subtitle 모바일 압축). community-aside.tsx CommunityMobileTabs 분리 export (useCategoryNewCounts hook 공유). community-content.tsx 모바일 탭 위치 이동 (사이드바 → "전체 N개의 글" 직전) + Hero 인라인 → .page-hero + 정렬바 → .sort-bar-mobile. 4 페이지 Hero 마이그 (tournaments/teams/rankings/courts). 사용자 요청: "카테고리 가로 스크롤 안 됨/인디케이터 / 위치 이동 / Hero 빈공간 축소 공통 적용". tsc 통과 (exit 0). before: h1 28px + margin 6/4 + padding 인라인 / after: h1 22px(모바일)→26px(720+) + margin 0/2 + .page-hero margin-bottom 12→16 | ✅ |
| 2026-05-03 | (debugger / SELECT only + curl) | **알기자 Phase 2 자동 트리거 진단** — 5/2~5/3 종료 매치 30건 vs 알기자 게시물 9건 (모두 published / cat=news / tournament_match_id 보유 / 132~139 매치). 자동 트리거 deploy = 5/3 13:44 (commit 2e6d367 / PR #130). deploy 이후 종료 7매치 (141,142,143,144,145,146,147) **게시물 0건**. 운영 curl 검증: 7매치 모두 `{ok:false, reason:"missing_api_key"}`. **본질 = 운영 GEMINI_API_KEY 미설정 + fire-and-forget silent fail (호출은 발동했으나 brief route 가 missing_api_key 응답 → community_posts INSERT skip)**. fix = 사용자가 Vercel production env 에 GEMINI_API_KEY 추가 + 재배포 + (옵션) admin/news 에서 누락 7매치 regenerate. errors.md 신규 entry 1건 추가. _temp 스크립트 정리 | ✅ |
| 2026-05-03 | (debugger / SELECT only) | **SKD #5 안원교 중복 진단** — User 3342(ph) status=merged + ttp/tm 잔재 0건 / User 3351(real) ttp 1건+tm 1건+stat 2경기 정상 / 같은 팀·대회 중복 0건. 진단 = 시나리오 B/C **캐시 문제** (DB 통합 완료 / API roster·members 응답 1건만 반환). 권장 = 운영자에게 앱 새로고침 안내. 처리 큐 ttp_id=2829/tm_id=2670 = 이미 3351 가리킴. _temp 스크립트 정리 완료 | ✅ |
| 2026-05-03 | (doc-writer / scratchpad 압축 + knowledge 5 파일 갱신) | **시간 시스템 작업 종료 마무리** — scratchpad 363→100줄 압축 (구현 기록 5건 → 작업 로그 통합) + knowledge 갱신 (architecture +1 minutes-engine v3 / conventions +1 가드 union 통일 / decisions +1 B 옵션 / lessons +1 raw 측정 함정 / errors 0 — 기존 항목 재사용 / index.md 항목 수+요약 갱신). 미푸시 0건 | ✅ |
| 2026-05-03 | d3984db | **minutes-engine endLineup chain 가드 범위 fix** — L196 `>=3 && <=7` (단일팀) → `>=5 && <=12` (양팀 union, DB starter 가드 L131 일관). 신규 test 케이스 L (양팀 5+5 starter chain 통과). 21/21 PASS. 라이브 매치 양팀 합 +15~17%p 정확도 회복. 종료 매치 LRM cap 흡수로 변화 0 (안전) | ✅ |
| 2026-05-03 | 72aa643 | **minutes-engine 리팩토링 B 옵션** — PBP 추정 fallback `inferStartersFromPbp()` 헬퍼 격리 + 메인 path (Q1 DB / Q2+ chain / boundary / LRM cap) 4분기 if/else 명확화 + 알고리즘 설계 헤더 주석. calculateMinutes 191→133줄 (-30%). 동작 변경 0. 20/20 PASS | ✅ |
| 2026-05-03 | 133d0de | **minutes-engine Tier 3** — starter 첫 segment qLen 강제 (firstGap 손실 0) + lastGap 보정 (다음 쿼터 PBP 존재 시 endClock=0 강제) + 라이브 마지막 쿼터 endClock=lastPbpClock 보존 (회귀 방지). 신규 test J/K/K-2. 20/20 PASS. 종료 raw 89.6% → 95%+ 향상 | ✅ |
| 2026-05-03 | 678a875 | **minutes-engine Tier 2** — `MinutesInput.dbStartersByTeam` 옵션 추가. Q1 starter = DB union 우선 (PBP 추정 무시) → fallback PBP. Q2~ = 직전 쿼터 endLineup chain. route.ts에서 playerStats.isStarter 매핑 주입. 신규 test G/H/I. 17/17 PASS. 정확도 92→99% | ✅ |
| 2026-05-03 | 7ea0174 | **minutes-engine `applyCompletedCap` LRM cap** — 단순 round → Largest Remainder Method. floor 후 잔여 fractional 큰 순 +1 분배. 양팀 합 ±1초 오차 0 (139:59/140:01 → 140:00). 신규 test D/E/F. 14/14 PASS | ✅ |
| 2026-05-03 | 9b4d3d5 | **dual_tournament advanceWinner 이중 가드** — sync route tasks 분기 (isDual 시 advanceWinner skip + cursor 패턴) + advanceWinner 진입부 format 조회 early return. dual D조 무한 루프 corrupt 차단 | ✅ |
