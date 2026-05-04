# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[P3~P7 완료 — 미커밋]** 듀얼 토너먼트 표준 default = sequential 적용 (P1+P2 commit `68ac727` 후속). P3 settings-form + new/edit wizard 자동 default + bracket route pairing 인자 / P4 DualGroupAssignmentEditor 신설 (16팀 → 4그룹 select + 자동시드 + 저장+생성) / P5 bracket-builder useNextMatchId 옵션 (i/2 fallback 안전) / P6 E2E 시뮬 79/79 pass (sequential+adjacent+default) / P7 5/2 영향 0 입증 (매치 27건 + semifinalPairing="adjacent" + groupAssignment 4조 모두 보존). tsc 0 + vitest 203/203 회귀 0. 임시 스크립트 즉시 삭제.

---

## 🎯 다음 세션 진입점

### 🚀 1순위 — 매치 코드 v4 전 Phase 완료, 미커밋 정리

**진행 상태**: Phase 1+2+3+4+5+7 완료. 미커밋 (Phase 4 + Phase 5 + Phase 7).

tester+reviewer 병렬 후 누적 커밋 1건 (3 Phase 묶음) — PM 처리.

**plan**: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md`

### 🚀 2순위 — 도메인 sub-agent P2 측정 누적 (P3 5/18 결정)
- live-expert P2 #1 baseline 완료 (live 도메인). P2 #2~#3 (Phase 1+2 / Phase 3 tournaments 영역) baseline = 일반 dev 컨텍스트 (system prompt 주입 0)
- 한계 1건: subagent_type 미등록 → P3 lessons 후보
- plan: `~/.claude/plans/dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md`

### 🚀 3순위 — 미커밋 잔여 (Option D 보존)
- `.claude/settings.local.json` 잔여 (이전 권한 통합 후속)

---

## 기획설계 (planner-architect / 5/4 듀얼 표준 포맷화)

→ **완료** (P1+P2 commit `68ac727` + P3~P7 미커밋). 작업 로그 참조.
→ 표준 default = sequential (DUAL_DEFAULT_PAIRING). adjacent 옵션 보존 (5/2 호환).
→ 신규 파일: `dual-defaults.ts` + `dual-group-assignment-editor.tsx`. 수정 파일: dual-tournament-generator / bracket-settings-form / new+edit wizard / admin bracket page+route / bracket-builder.

---

## 🟡 HOLD 큐
- **자율 QA 봇 시스템** — Phase 1~5 / 9d
- **BDR 기자봇 v2** — Phase 1 완료, Phase 2~7 대기

---

## 🔴 5/2 대회 종료 후 잔여 큐

| # | 항목 | 상태 |
|---|---|---|
| **A** | placeholder User 89명 — 잔여 86건 LOW (본인 가입 시 mergeTempMember 자동) | 🟡 89/107 |
| **B** | ttp 부족팀 5팀 — MI 9 / 슬로우 8 / MZ 11 / SA 9 / 우아한 9 | 🟡 사용자 액션 |

---

## 우선순위 2 — 결정 대기 큐

| 영역 | 결정 건수 | 산출물 |
|---|---|---|
| 관리자페이지 UI 개선 | 6건 (Phase A 모바일 가드) | `git log` "관리자페이지 UI 개선" |
| Games 박제 Phase A (dead code) | 별도 큐 | commit `f4b55c2` 직전 |
| Phase F2 wrapper 연결 | mount 완료 | commit `2dc9af8` |
| Teams Phase A | dead code 5파일 | commit `dfe5eb5` 직전 |

---

## 우선순위 3 — 인프라 / 영구 큐
카카오맵 SDK / placeholder 73명 통합 / PortOne / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 커뮤니티 답글 / waitlist / QR 티켓 / AppNav 쪽지 뱃지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 (1f8ee19) |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |
| 듀얼토너먼트 풀 시스템 | ✅ Phase A~F2 |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| **도메인 sub-agent (옵션 A)** | ✅ P1+P2+P3 완료 (C 채택 — live-expert 영구 / 신규 박제 0) |
| **매치 코드 v4** | ✅ Phase 1+2+3+4+5+7 (전 Phase 완료) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-04 | 481001c → main 머지 (17 commits 누적) | **5/4 UI 통합 세션 — 햄버거 강화 + 팀 카드/상세 + 대회 운영자 도구 admin 통합 + Hero 6차 본질 + fade indicator** — (1) **햄버거 4단계 정리** (여백 -42% padding 14→8, 폭 60→42vw, MORE_GROUPS 28→13항목 메인 페이지 하위 제거, NEW dot 뱃지 newGameCount+newCommunityCount+unreadCount, 박스 안쪽 우상단 정렬) (2) **팀 페이지** (카드 가로 배치 + 로고 60px / 상세 Hero Avatar 96→144px = 150% 확대 + logoUrl props 추가) (3) **대회 운영자 도구 admin 통합** (토너먼트→"대회 관리" 통일 + tournament-admin (web)→(admin) 라우트 그룹 이동 + admin/users 패턴: eyebrow + 검색 + 5탭(전체/준비중/접수중/진행중/종료) + admin-table + 새 대회 만들기 우측 상단 인라인 마크업) (4) **Hero 6차 본질 fix** `.with-aside > main { min-width: 0 }` — CSS Grid item default `min-width: auto` 함정 (자식 nowrap 컨텐츠로 main 을 viewport 너머 확장) (5) **fade chevron 원형 배지 통일** `.h-scroll-bar-wrap` generic class (courts 5필터칩 + teams 지역/정렬칩) (6) **메인 4곳 PageBackButton 제거** (courts/profile/organizations/profile-complete — BottomNav 가 홈 이동 대체) (7) **팀 비교 막대 A안** globalCountMax 절대 정규화 (행 간 비교 가능 — 득점 73=100% / 블록 1=1.4%) (8) tournament-admin (web)→(admin) 라우트 그룹 이동 git mv 25 파일 + AdminSidebar/AdminMobileNav 통합. 메인까지 push 완료 (subin → dev → main). | ✅ |
| 2026-05-04 | (developer / 미커밋) | **듀얼 토너먼트 표준 default P3~P7 — admin UI + bracket-builder 옵션 + E2E 검증** — P1+P2 commit `68ac727` 후속 5 Phase 일괄. **P3** (3 파일): bracket-settings-form `BracketSettingsData.semifinalPairing` 추가 + dual 분기에 페어링 select UI / new+edit wizard `DUAL_DEFAULT_BRACKET` 자동 채우기 (format 변경 시 16팀 4조 27매치 표준 일괄 적용 + semifinalPairing 보존) + payload `settings.bracket.semifinalPairing/hasGroupFinal/teamsPerGroup` 추가 / bracket route POST `generateDualTournament(assignment, id, pairing)` 호출 시 `bracket?.semifinalPairing` 참조 (default sequential). **P4** (1 신규 컴포넌트 + 2 파일): `_components/dual-group-assignment-editor.tsx` 신규 (16팀 → 4×4 select + usedTeamIds disable + 자동시드 추천 (seedNumber asc) + 검증 (16unique) + 페어링 select + 저장/생성 버튼) / bracket page.tsx mount (매치 0건 + 16팀 승인 시) / route GET 응답에 `settings` 추가 (groupAssignment 복원). **P5** (1 파일): bracket-builder.ts `BracketBuilderOptions { useNextMatchId? }` 추가 / `computeMatchPositions+computeConnectorPaths` 양 모드 분기 (true=nextMatchId feeders 정확 매핑 + fallback i/2 / false=기존 i/2 회귀 0). **P6** E2E 시뮬 79/79 pass (sequential 8강 A1+D2/B1+C2/C1+B2/D1+A2 + adjacent 5/2 패턴 B1+A2/D1+C2/A1+B2/C1+D2 + 4강 1+2/3+4 양모드 동일 + next match chain + bracketLevel 분포 20/4/2/1 + DUAL_DEFAULT_PAIRING=sequential default 검증). **P7** 5/2 (`138b22d8`) 영향 0 입증: 매치 27건 그대로 + `semifinalPairing="adjacent"` 박힘 보존 + groupAssignment 4조 그대로. tsc 0 + vitest 203/203 회귀 0. 임시 스크립트 (`scripts/_temp/dual-e2e-sim` + `dual-5-2-impact-check`) 작업 후 즉시 삭제 (CLAUDE.md DB 정책 준수). API/비즈니스 로직 변경 0 — UI + 새 SPEC 적용만. | ✅ |
| 2026-05-04 | (developer / 미커밋) | **회원가입 Step 2 활성화 — 포지션·키·등번호 DB 저장** — 2 파일 (signup/page.tsx + actions/auth.ts). signup/page: "준비 중" 뱃지 3건 제거 + POSITION_OPTIONS 영문코드/한글라벨 매핑 + togglePosition 멀티 토글 + active 시 accent-soft 스타일 + height/jersey number input(type=number, min/max) + hidden inputs 3건 (position CSV / height / jersey_number). actions/auth: signupAction 에 position(CSV trim) + height(100~250 검증) + default_jersey_number(0~99 검증) 3 필드 추가. 잘못된 입력은 NULL 저장 (가입 흐름 무영향). schema 변경 0 (User.position/height/default_jersey_number 컬럼 이미 존재). profile/edit POSITIONS=["PG","SG","SF","PF","C"] CSV 패턴과 일관성 유지. tsc exit 0 / vitest 203/203 회귀 0. | ✅ |
| 2026-05-04 | (planner / 분석 only / scratchpad 박제) | **듀얼토너먼트 표준 포맷화 기획설계 — 옵션 C 점진 수정 권장 (8.5h / 7 Phase)** — 5/2 baseline 운영 DB 실측 + 코드 점검 (lib/tournaments 9파일 + bracket-settings-form + admin bracket page). 핵심 발견: 코드 중복 0 / 책임 분리 명확. 격차 3종: ① `SEMI_FINAL_SPECS` 4강 페어링 (코드 NBA 크로스 1+4 vs 운영 DB 1+2 페어 — 5/4 SQL 우회 박힘 / commit 부재) ② admin UI 부재 (조 배정 16개 select) ③ bracket-builder i/2 페어링 한계 (next_match_id 무시 / dual 만 우회). 표준 정의 위치 = `dual-defaults.ts` 신규 + `DUAL_DEFAULT_BRACKET` 상수. Phase 1~7. 운영 5/2 대회 영향 0 보장 (신규 대회만 적용 / schema 변경 0). 본 turn 분석만 — 실작업 ❌. | ✅ |
| 2026-05-04 | (planner / 메타 / plan §11 갱신) | **도메인 sub-agent P3 Go/No-Go 결정 — C 권장 (live-expert 유지 + 신규 박제 0)** — P2 6건 KPI 누적 분석. 잘못된 파일 0회 6/6 중 5건 = system prompt 주입 ❌ (일반 dev) → **planner 사전 분석이 진짜 효과의 본질**, system prompt 주입 marginal gain ≈ 0. 본질 가치 4종 모두 약함/미작동 (KPI 1·2 측정 불가, KPI 3 planner 동등, Task subagent_type 미등록). 명확 정의 작업 위주 한계 (모호 디버깅 케이스 0건). 7 사유로 **C 권장** (A 6h 매몰비용 / B 3h 매몰비용 / D live 박제 손실 / E 14일 추가 한계 효용 0 모두 거부). 후속: live-expert.md 영구 운영 + 신규 박제 0 + KPI 측정 종료 + PM 호출 룰 미갱신 + lessons 3건 박제 (system prompt marginal / KPI 작업 복잡도 통제 / Task 미등록 한계). plan §11 (P3 결정 결과 + decisions.md 박제 형식 제안) 갱신. PM 액션 = 사용자 C 승인 받기 → lessons 박제 + decisions.md 항목 추가. | ✅ |
| 2026-05-04 | (developer / 미커밋) | **매치 코드 v4 Phase 7 — deep link `/match/[code]` 라우트 (옵션, v4 마지막)** — 신규 라우트 2 파일 (page.tsx + not-found.tsx) + generateMetadata. tsc 0 / vitest 65/65 회귀 0. KPI: 5 grep + 4 read + 잘못된 파일 0회 + ~25분. 매치 코드 v4 Phase 1+2+3+4+5+7 모두 완료. | ✅ |
| 2026-05-04 | (developer / 미커밋) | **매치 코드 v4 Phase 5 — UI 노출 (3페이지)** — 3페이지 매치 카드에 `match_code` 표시. ① `/live/[id]` v2 hero-scoreboard 상단 배지 (FINAL · 대회명 옆 `.match-code--hero` 어두운 배경 대비) ② `/tournaments/[id]?tab=bracket` MobileMatchCard + DualMatchCard 매치번호 자리 우선 표시 (NULL 시 `#매치번호` fallback) ③ `/tournaments/[id]?tab=schedule` schedule-timeline 카드 inline 메타 우선 표시. 변경 8 파일: globals.css(.match-code+.match-code--hero 클래스 신규) / bracket-builder.ts(BracketMatch.matchCode + DbMatch.match_code 옵셔널 추가) / public-bracket route(include 자동) / public-schedule route(matchCode select+직렬화) / admin bracket route(select 명시) / live route(응답 matchCode 추가) / hero-scoreboard.tsx(배지) / match-card.tsx MobileMatchCard / v2-dual-bracket-sections.tsx DualMatchCard / schedule-timeline.tsx + tournament-tabs.tsx 매핑. NULL 안전 (모두 `{match.matchCode && ...}` 분기). BDR-current 13룰 토큰만 (var(--*)) / Material Symbols X / pill 9999px X / 하드코딩 색 X. 모바일 360px viewport 14자 영숫자 한 줄 안전 (font-size 10px + tabular-nums). tsc 0 / vitest 65/65 (minutes-engine 21 + match-code 44) 회귀 0. KPI: 12 grep + 14 read + 잘못된 파일 0회 + ~70분 (tournaments+UI 영역, live-expert 영역 침범 1건 — `/live/[id]` 헤더). | ✅ |
| 2026-05-04 | (developer / 미커밋) | **매치 코드 v4 Phase 4 — generator 4종 통합** — `match-code.ts` 신규 함수 4종 (`categoryNameToLetter` 5매핑 / `parseCategoryDivision` 케이스①+④ 분기 / `applyMatchCodeFields` 호출자영향0 헬퍼 / `generateUniqueMatchCode` UNIQUE fallback maxRetry10) + 4 generator 통합 (league-generator createMany / tournament-seeding knockout+skeleton 2곳 / bracket route dual createMany + single elim closure 인라인). NULL 안전 (short_code/region_code 둘 중 하나라도 NULL → match_code NULL). 호출자 영향 0 (generator 내부 변경만). vitest 27→44 (8 신규 케이스, 사실상 17건 신규 — describe 블록 분리). tsc 0 / minutes-engine 21/21 회귀 0. KPI: 7 grep + 9 read + 잘못된 파일 0회 + ~50분 (as of 작업 시점) — 일반 dev 컨텍스트 (tournaments-expert 미박제). plan: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md` | ✅ |
| 2026-05-04 | 8af51eb push + bec591b 미푸시 + knowledge +3 | **매치 코드 v4 Phase 1+2+3 + knowledge 박제** — P1 schema 6컬럼 (Tournament short_code/region_code + Match match_code/category_letter/division_tier/group_letter, 운영 무중단 prisma db execute 우회) + P2 helper (`src/lib/tournaments/match-code.ts` 순수 함수 4종 + REGION_CODE_MAP 17 + alias 6 + CITY_TO_SIDO 26, vitest 27/27) + P3 backfill 61매치 (몰텐 27 case④ A/D3/group A-D + 열혈 34 case① 모두 NULL, 트랜잭션 wrap, UNIQUE 충돌 0). knowledge: errors+1 prisma relation camelCase / lessons+1 prisma generate EPERM Windows / conventions+1 prisma db execute 우회. tester+reviewer 모두 ✅. KPI P2 #2~#3 baseline (일반 dev 컨텍스트, tournaments 영역). plan: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md` | ✅ |
| 2026-05-04 | 1f8ee19 push | **[live] P2 #1 — 라이브 sticky 헤더 + 모바일 미니스코어 + 팀 비교 막대 옵션 C + P1 박제** — live-expert 시범 첫 케이스. 3파일 (page.tsx / tab-team-stats.tsx StatRow.kind+normalizeBar / .css HOME=accent AWAY=cafe-blue weak=opacity 0.4) + `.claude/agents/live-expert.md` P1. tsc 0 / vitest 21/21. KPI baseline 4에이전트: 21grep+18read+잘못된파일 0회+62분. 한계 1건: subagent_type 미등록 | ✅ |
<!-- 5/4 알기자 linkify + 5/3 알기자 backfill + 가로 스크롤 indicator + 5/3 알기자 진단 + 5/4 카테고리 fade overlay + 시간 데이터 소실 매치 안내 배너 + 5/4 대회·경기 헤더 UI 개편 + 알기자 Phase 1 DB 마이그 + 옵션 A 도메인 sub-agent 박제 절단 (5/4 UI 통합 세션 prepend로 10건 유지) — 복원: git log -- .claude/scratchpad.md -->
