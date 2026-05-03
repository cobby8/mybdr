# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[진행중] 옵션 A — 도메인별 sub-agent 신설 상세 계획** — 사용자 진단: 프로젝트 방대(웹 30+/api 50+/architecture.md 26K토큰)로 전수조사 디버깅 한계. 사용자 결정: **옵션 A 직진** (`tournaments-expert` / `live-expert` / `community-expert` / `admin-expert` / `referee-expert` / `flutter-api-expert` 등 도메인 에이전트 신설). planner-architect 위임 — 산출물: ① 어떤 도메인 에이전트 N개 만들지(경계 설정) ② 각 에이전트 system prompt 템플릿 ③ 시범영역 1개 선정 + KPI ④ Phase별 도입계획 ⑤ 롤백 기준 ⑥ 기존 6 knowledge 와의 연결 방식.

## 기획설계 (planner-architect)

### [2026-05-04] 옵션 A — 도메인 sub-agent 신설 상세 계획 (전체 보고서 박제)

> 전체 계획 = `C:\Users\user\.claude\plans\dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md` (10 섹션 + 부록 A/B). 이하 PM 보고용 압축 요약.

#### 1. 도메인 8개 확정 (정량 근거 = (web)/api/lib 파일 수 + 200 commits scope 빈도)
| 에이전트 | 담당 영역 | commit 빈도 (200) | 단독 가치 |
|---------|----------|------------------|----------|
| tournaments-expert | (web)/tournaments 48 + tournament-admin 24 + series + api/web 23 routes + lib/tournaments 13파일 | 43 | architecture 9항목 / 회귀 5종 / 매치코드 Phase 1~7 |
| **live-expert ⭐ (시범)** | /live/[id] + minutes-engine v3 + STL + PBP + mvp-aggregate | **44** | 알고리즘 깊이 (5/3 7회 보강) / 단일 파일 / test 21/21 |
| referee-expert | (referee) 26 pages + 38 routes + Association 14모델 | 31 | 라우트 그룹 분리 / 14모델 schema |
| flutter-api-expert | api/v1 27 routes + JWT + recorder + duo + batch sync | ~10 (저빈도·고위험) | 변경 시 모바일앱 깨짐 — 원영 사전공지 |
| admin-expert | (admin) 19 pages + admin/partner API 19 routes + cafe-sync 5파일 + news 7파일 + 알기자 | 54 | 운영 영향 최대 (DB destructive 가드) |
| teams-courts-expert | (web)/teams 25 + courts 29 + 픽업·대관 + mergePlaceholderUser | 29 | 핵심 함수 단위 응집 |
| profile-community-expert | profile 59 tsx + users + community 17 + 알림 + 인증 + Hybrid 박제 패턴 | 57 | D-N 8박제 + page-hero 공통룰 |
| design-system-expert | BDR-current 13룰 + AppNav frozen + globals.css + Hero + 모바일가드 | **133** | 모든 도메인 UI 박제 자동 검수자 |

**의도적으로 단독 도메인 안 한 것**: community(profile 결합) / auth-security(저빈도 안정) / games(tournaments+live 분산) / news(admin 결합)

#### 2. 시범 영역 = **live-expert 단독** (4가지 결정타)
1. 알고리즘 깊이 압도적 (minutes-engine v3 메인 path 4단계 + LRM cap + 양팀 union 가드 5~12)
2. 측정 용이성 — test 21/21 / git commit hash 별 정확도 추적 가능
3. 회복 비용 최저 — 단일 파일 + STL 응답 가공만 (DB 영구 보정 0)
4. 반복 작업 빈번 — "왜 X 출전시간이 Y인가?" 디버깅 패턴 전형

**보류 사유**: tournaments(작업 단위 너무 큼) / admin(운영 사고 위험) / referee(5월 첫주 빈도 0)

#### 3. KPI 3종 (시범 2주 측정)
| KPI | 목표 | 측정 |
|-----|------|------|
| 디버깅 첫 5분 grep/read 횟수 | -50% 이하 | scratchpad "조사 grep N회 / read M회" 명시 |
| 동일 작업 완료 시간 | -30% 이하 | commit timestamp 차이 (3건 이상) |
| 잘못된 파일 건드린 횟수 | 0회 | commit diff 자동 grep |

#### 4. Phase 5단계 (총 ~6주)
| Phase | 산출물 | 시간 | 진입조건 |
|-------|-------|------|---------|
| P1 | live-expert.md 박제 + decisions 입력 | 1.5h | 본 계획 사용자 승인 |
| P2 | 첫 케이스 측정 (KPI baseline) | 실작업 1건 (1~3h) | P1 + 실작업 발생 |
| P3 | KPI 2주 누적 → Go/No-Go 결정 | 2주 | 시범 시작 +14일 |
| P4 | 확대 1 (tournaments + admin) | 3h + 1주 | P3 Go |
| P5 | 전체 8개 + PM 호출 룰 갱신 | 8h + 1주 | P4 + 4주 누적 KPI 달성 |

#### 5. 롤백 기준 6종
- 도메인 경계 모호 (3건 이상 PM 30초+ 고민) / 잘못된 에이전트 호출 30%+ / KPI 미달 (개선 1회 후도) / 잘못된 파일 1회+ / 사용자 정성 부정 / knowledge sync 부담 ↑ (30일+ 미갱신)

#### 6. 리스크 8종 + 완화 (요약)
| 리스크 | 완화 |
|--------|------|
| 도메인 경계 모호 | system prompt 담당 영역 100% 명시 + PM 1차 판단 |
| knowledge sync 이중 관리 | 절대 룰만 system prompt 직접 + 핵심 지식은 knowledge 인용 1줄 (single source) |
| 에이전트 수 폭증 (8+8=16) | P1→P4→P5 점진 + PM 호출 룰 명문화 |
| 도메인 에이전트가 테스트·리뷰 잘못 처리 | 협업 규칙 = tester/reviewer 위임 의무 |
| 시범 1개 실패 → 전체 부정 | 3건 이상 평가 + referee/tournaments 재시도 1회 기회 |
| 운영 DB 사고 (admin) | admin 절대룰 1번 + P4 이후 도입 (위험 분리) |
| 도메인 미특정 영역 | developer/debugger 일반 처리 |
| Flutter 앱 깨짐 | 응답키 변경 ❌ + 원영 공지 + tester curl 검증 |

#### 7. 기존 시스템 통합
- **knowledge sync 룰**: 절대 룰 = system prompt 직접 박제 (변하지 않는 것) / 핵심 지식 = knowledge 단일 source + system prompt 1줄 인용 / PM 작업 완료 체크리스트에 "system prompt 영향 검토" 1줄 추가
- **PM 호출 우선순위** (P5 후): 1순위 도메인 에이전트(트리거 매칭) → 2순위 planner-architect(메타) → 3순위 developer/debugger(미특정) → 항상 tester+reviewer(병렬)
- **scratchpad**: 도메인 에이전트 별도 섹션 ❌ → 기존 섹션 공용 ("발견자" 필드만 도메인 명시). 작업 로그 한 줄 형식 유지 (도메인 prefix `[live]` 옵션)

#### 8. 8 에이전트 저장 위치 권장
`C:\0. Programing\mybdr\.claude\agents\<name>.md` (프로젝트 폴더 — mybdr 전용 도메인 격리). 글로벌(`~/.claude/agents/`) 도 무해하나 다른 프로젝트 노이즈.

#### 9. decisions.md 박제 형식 제안
> PM 이 본 계획 승인 후 decisions.md 최상단에 다음 추가 (전체 plan 부록 §9 참조):
```
### [2026-05-04] 도메인 sub-agent 시스템 도입 — 옵션 A 채택 + 시범 live-expert 단독 시작
- **분류**: decision
- **발견자**: planner-architect
- **내용**: [...8 도메인 확정 / 시범 live-expert / KPI 3종 / Phase 5단계 / 롤백 6종 / 리스크 8종 / sync 룰...]
- **참조횟수**: 0
```

#### 10. PM 즉시 액션
1. ✅ scratchpad "기획설계" 섹션 박제 (본 항목)
2. (다음) decisions.md 최상단 §9 형식 항목 추가
3. (다음) 사용자에게 P1 진행 승인 요청 — "live-expert.md 박제 1.5h 시작할까요?"
4. (P1 진행 시) `C:\0. Programing\mybdr\.claude\agents\live-expert.md` 작성 (전체 plan §2-2 카피)
5. (다음) 작업 로그 +1줄 / index.md 갱신 (decisions 94→95)

> **8 에이전트 system prompt 풀 텍스트 = 전체 plan 파일 §2-1~§2-8** (각 ~150줄 / 박제 가능 완성도). 본 scratchpad 압축 박제는 PM 보고용 개요만.

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
| 2026-05-04 | (P1 schema + P2~P3 코드 + P4 backfill 34건 + P5 박제) | **알기자 Phase 1 DB 영구 저장 마이그 (사용자 의도 100% 일치)** — 사용자 의도 ("경기종료 트리거 → 본기사+요약 2종 매치당 1회 보장 / 본=admin 검수 / 요약=즉시") vs 5/3 구현 비교 → Gap 4건 (G2 트리거 시점 / G3 영구 저장 / G4 트리거 통합 / G5 매치당 1회) 모두 해소. **P1**: `tournament_matches.summary_brief Json?` NULL 허용 ADD COLUMN (무중단) + prisma db push + dev server PID 2648 종료 후 client 재생성. **P2**: `auto-publish-match-brief.ts` 통합 — `Promise.allSettled([publishPhase1Summary, publishPhase2MatchBrief])` 독립 병렬, 한쪽 실패 ≠ 다른쪽 영향. fire-and-forget 패턴 + 시그니처 유지 (호출자 변경 0). **P3**: `tab-summary.tsx` client fetch 완전 제거 (useState/useEffect/BriefResponse 모두 삭제) → `match.summary_brief` props 직접 사용. `/api/live/[id]` 응답에 `summaryBrief` 필드 추가. cold start LLM 재호출 X. **P4**: backfill 35매치 (운영 endpoint phase1-section 호출 → DB UPDATE) — 34/35 성공 (평균 175자, 목표 150~250 적중) / 실패 1건 (#88 validate-brief "땀" reject — prompt 개선 큐). 1초 간격 rate-limit 회피, 임시 스크립트 2개 즉시 삭제. **P5**: architecture +1, decisions +2 (요약 저장 위치 / 트리거 통합 패턴), errors fix 항목 영구 해소 박제, index.md 갱신. tsc exit 0. 미푸시 = backfill DB 변경 + 코드 변경 미커밋 | ✅ |
| 2026-05-04 | (planner-architect / 메타 — 코드 0) | **옵션 A 도메인 sub-agent 신설 상세 계획 박제** — 정량 데이터 수집 (web 페이지/api routes/lib 파일/200 commits scope 빈도) 후 **8 도메인 확정** (tournaments-expert / live-expert / referee-expert / flutter-api-expert / admin-expert / teams-courts-expert / profile-community-expert / design-system-expert). 단독 도메인 안 한 것 = community(profile 결합) / auth-security(저빈도) / games(분산) / news(admin 결합). **시범 = live-expert 단독** (알고리즘 깊이 / 단일 파일 / test 21/21 / DB 영향 0 / 회복 비용 최저). KPI 3종 (grep/read -50% / 작업시간 -30% / 잘못된 파일 0회) 2주 측정. **Phase 5단계 (~6주)**: P1 박제 1.5h → P2 첫 케이스 → P3 KPI 2주 + Go/No-Go → P4 확대 3개 (tournaments+admin) → P5 전체 8개 + PM 룰 갱신. **롤백 6종** (도메인 모호 / 잘못된 호출 30%+ / KPI 미달 / 잘못된 파일 1회+ / 사용자 부정 / sync 부담). **리스크 8종 + 완화 명시**. system prompt vs knowledge sync 룰 = 절대 룰만 system prompt 박제 + 핵심 지식은 knowledge 인용 1줄 (single source). 8 에이전트 system prompt 풀 텍스트 (각 ~150줄) = `C:\Users\user\.claude\plans\dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md` 부록 §2-1~§2-8. scratchpad "기획설계" 압축 박제 완료 (10 섹션 요약). PM 다음 액션: decisions.md +1 (§9 형식) + 사용자 P1 승인 요청 + index.md 갱신 (decisions 94→95) | ✅ |
| 2026-05-04 | 9b4019a (dev) + 887b89c (main) merge + 운영 DB INSERT 7건 (post 1373~1379) | **알기자 누락 7매치 backfill 완료 (#141~#147)** — (a) subin→dev→main 머지 (settings.local.json conflict 해결: jumpball/awk/xargs git 3개 권한 통합) (b) 일회성 스크립트가 운영 endpoint `/api/live/{141..147}/brief?mode=phase2-match` 7번 fetch (1초 간격, rate-limit 회피) → 응답 brief 받아 운영 DB community_posts INSERT (status=draft, category=news, alkija user_id=3350, period_type=match) (c) 결과: 7/7 created, 0 skipped, 0 failed (post_id 1373~1379) (d) 임시 스크립트 2개 (`scripts/_temp/check-news-backfill.ts` + `backfill-news-141-147.ts`) 즉시 삭제 (e) errors.md 알기자 silent fail entry fix 항목에 ✅ backfill 완료 박제 (f) 운영자 admin/news 검수 → publish 대기 | ✅ |
| 2026-05-04 | 0b47489 + 9d72cf5 + 2bfb873 + 78b0bae + b141e53 (5 commits push) | **대회·경기 헤더 UI 개편** — (a) 대회 헤더 좌측 제목 + 우측 컨트롤 5개 (.games-header 패턴, 경기와 동일) (b) segmented 탭 풀폭 (글자 잘림 0) (c) 컨트롤 90% 축소: 검색/필터 36→32 (모바일 25 → 사용자 의도로 28 복원) / ViewToggle 모바일 px-1 py-0.5 (d) `.games-create-btn` height 36→32 + padding 0×10 / `.games-filter-btn` 32×32 통일 (e) GamesClient 가 헤더 통합 렌더 (filterOpen state 같은 client tree 보장) / KindTabBar filter 토글 prop 미전달. 미푸시 0 | ✅ |
| 2026-05-04 | 4658963 | **시간 데이터 소실 매치 안내 배너 + #141 stat 14건 박제** — 매치 #141 (블랙라벨 vs MSA 52:31) matchPlayerStat 14건 INSERT (블랙 8 + MSA 6 / minutesPlayed=null / isStarter=null). settings.timeDataMissing=true 플래그 + reason 메모. API route timeDataMissing 응답 추가 + game-result.tsx 인터페이스 +1 + Hero 직후 안내 배너 (info 아이콘 + warn 색). 합산 검증 PTS/FG/3P/REB/AST 모두 TEAM 합 정확 일치 | ✅ |
| 2026-05-04 | (debugger / 진단) | **카테고리 가로 스크롤 fade overlay 미표시 — 코드/CSS/배포 모두 정상 = 사용자 브라우저 캐시 본질** — 운영 HTML(`https://www.mybdr.kr/community`) curl + CSS chunk 4종 다운로드 검증. ① `community-aside.tsx` L100~131 wrap+fade 마크업 정상 (`<div className="aside-mobile-tabs-wrap">` + `<div className="aside-mobile-tabs-fade" aria-hidden>` + `chevron_right`). ② `community-content.tsx` L383~424 sort-bar-mobile-wrap+fade 정상. ③ `globals.css` L540~593 + L601~656 wrap/fade/PC 숨김 모두 정상. ④ 운영 CSS 빌드 정상: `.aside-mobile-tabs-wrap{margin:0 0 10px;position:relative}` + `.aside-mobile-tabs-fade{...display:flex;position:absolute;top:0;bottom:6px;right:0}` + `@media (min-width:1024px){.aside-mobile-tabs-wrap{display:none!important}}`. ⑤ 운영 머지 정상 (a049dcd → main `22e11e3`). ⑥ Material Symbols 폰트 운영 head 정상 로드 (Google Fonts). ⑦ Vercel cache STALE → revalidate 정상 (서버는 새 HTML/CSS 보유). **본질 = 시나리오 1(브라우저 캐시) — 사용자가 머지(05:04 01:52) 이전부터 열린 community 탭에서 hard reload 안 해 옛 hydrated 상태 유지**. SSR 미렌더 (community-content가 `"use client"` + fallbackPosts JSON props만 SSR) 이므로 hydration 후 client에서만 wrap/fade 마크업 생성됨. 옛 빌드 client bundle은 wrap 마크업 없음. **즉시 fix = 사용자에게 "Ctrl+F5 (또는 모바일 시크릿창)으로 hard reload 안내"**. 추가 코드 수정 불필요 | ✅ |
| 2026-05-04 | (developer / 미커밋) | **카테고리/정렬 바 가로 스크롤 시각 indicator 강화 (3차 fix)** — 사용자 3회 보고 "카테고리 4개만 보이고 우측 잘림 인지 못함". mask-image (24px fade) → wrap 래퍼 + fade overlay div + chevron_right 아이콘 마크업 패턴으로 교체. ① community-aside.tsx `CommunityMobileTabs` — `<div className="aside-mobile-tabs-wrap">` 래퍼 + 우측 fade overlay (`aria-hidden`). ② community-content.tsx 정렬바 — `sort-bar-mobile-wrap` 래퍼 + fade overlay. ③ globals.css — mask-image 제거, `.aside-mobile-tabs-wrap` (position:relative) + `.aside-mobile-tabs-fade` (position:absolute, right:0, bottom:6px, width:32px, linear-gradient bg, pointer-events:none, z-index:1) 신규. sort-bar 동일 패턴 (border-radius 우측 둥근 모서리 보존). 기존 .aside-mobile-tabs padding-right 24→36 (overlay 32px + 여유). PC(≥1024px) wrap 자체 숨김. tsc exit 0 | ✅ |
<!-- 5/3 모바일 Hero 추가 압축 / 5/3 모바일 카테고리 fix + Hero 공통 룰 도입 2건 절단 (5/4 알기자 Phase 1 마이그 신규 prepend로 10건 유지) — 필요 시 git log -- .claude/scratchpad.md 로 복원 -->
| 2026-05-03 | (debugger / SELECT only + curl) | **알기자 Phase 2 자동 트리거 진단** — 5/2~5/3 종료 매치 30건 vs 알기자 게시물 9건 (모두 published / cat=news / tournament_match_id 보유 / 132~139 매치). 자동 트리거 deploy = 5/3 13:44 (commit 2e6d367 / PR #130). deploy 이후 종료 7매치 (141,142,143,144,145,146,147) **게시물 0건**. 운영 curl 검증: 7매치 모두 `{ok:false, reason:"missing_api_key"}`. **본질 = 운영 GEMINI_API_KEY 미설정 + fire-and-forget silent fail (호출은 발동했으나 brief route 가 missing_api_key 응답 → community_posts INSERT skip)**. fix = 사용자가 Vercel production env 에 GEMINI_API_KEY 추가 + 재배포 + (옵션) admin/news 에서 누락 7매치 regenerate. errors.md 신규 entry 1건 추가. _temp 스크립트 정리 | ✅ |
| 2026-05-03 | (debugger / SELECT only) | **SKD #5 안원교 중복 진단** — User 3342(ph) status=merged + ttp/tm 잔재 0건 / User 3351(real) ttp 1건+tm 1건+stat 2경기 정상 / 같은 팀·대회 중복 0건. 진단 = 시나리오 B/C **캐시 문제** (DB 통합 완료 / API roster·members 응답 1건만 반환). 권장 = 운영자에게 앱 새로고침 안내. 처리 큐 ttp_id=2829/tm_id=2670 = 이미 3351 가리킴. _temp 스크립트 정리 완료 | ✅ |
<!-- 5/3 마무리 압축 / 매치 #145 진단 / 듀얼 시뮬 ROLLBACK / Admin-Web 시각 통합 Phase 1+2+3 (globals.css alias 9개 보강 + .admin-table thead var(--bg-head) + ThemeSwitch admin 마운트 — f8fe8f0+fcb6f92) 4건 절단 (10건 유지 — 5/4 옵션 A 도메인 에이전트 계획 prepend) — 필요 시 git log -- .claude/scratchpad.md 로 복원 -->
