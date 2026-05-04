# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[Phase 4 진행중] 매치 코드 v4 generator 4종 통합** — Phase 1+2+3 + knowledge 박제 모두 push 완료 (5efca2d). developer 위임 — generator 4종 (single elim / full league / hybrid / dual) 신규 매치 생성 시 `generateMatchCode()` 자동 호출 + `generateUniqueMatchCode()` UNIQUE 충돌 fallback. 호출자 영향 0 (generator 내부 변경만). tester+reviewer 병렬 후 커밋.

---

## 🎯 다음 세션 진입점

### 🚀 1순위 — 매치 코드 v4 Phase 4~7 (~3.5h 잔여)

**진행 상태**: Phase 1+2+3 완료. 미푸시 1 (bec591b).

- **Phase 4 (~1.5h)**: generator 4종 통합 — `dual-tournament-generator.ts` + `generator.ts` (single elim / full league / hybrid) 신규 매치 생성 시 `generateMatchCode()` 자동 호출 + `generateUniqueMatchCode()` (UNIQUE 충돌 fallback max 10회) 추가
- **Phase 5 (~1h)**: UI 노출 (3~5 페이지) — `/games`, `/tournaments/[id]/bracket`, `/live/[id]` 매치 카드에 `match_code` 표시
- **Phase 7 (~1h, 옵션)**: deep link `/match/[code]` 라우트 — `parseMatchCode()` + tournament_match findFirst → `/live/[id]` redirect

**plan**: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md`

### 🚀 2순위 — 도메인 sub-agent P2 측정 누적 (P3 5/18 결정)
- live-expert P2 #1 baseline 완료 (live 도메인). P2 #2~#3 (Phase 1+2 / Phase 3 tournaments 영역) baseline = 일반 dev 컨텍스트 (system prompt 주입 0)
- 한계 1건: subagent_type 미등록 → P3 lessons 후보
- plan: `~/.claude/plans/dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md`

### 🚀 3순위 — 미커밋 잔여 (Option D 보존)
- `.claude/settings.local.json` 잔여 (이전 권한 통합 후속)

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
| **도메인 sub-agent (옵션 A)** | ✅ P1 박제 / ⏳ P2 측정 누적 / P3 5/18 |
| **매치 코드 v4** | ✅ Phase 1+2+3 / ⏳ Phase 4~7 (~3.5h) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-04 | (developer / 미커밋) | **매치 코드 v4 Phase 4 — generator 4종 통합** — `match-code.ts` 신규 함수 4종 (`categoryNameToLetter` 5매핑 / `parseCategoryDivision` 케이스①+④ 분기 / `applyMatchCodeFields` 호출자영향0 헬퍼 / `generateUniqueMatchCode` UNIQUE fallback maxRetry10) + 4 generator 통합 (league-generator createMany / tournament-seeding knockout+skeleton 2곳 / bracket route dual createMany + single elim closure 인라인). NULL 안전 (short_code/region_code 둘 중 하나라도 NULL → match_code NULL). 호출자 영향 0 (generator 내부 변경만). vitest 27→44 (8 신규 케이스, 사실상 17건 신규 — describe 블록 분리). tsc 0 / minutes-engine 21/21 회귀 0. KPI: 7 grep + 9 read + 잘못된 파일 0회 + ~50분 (as of 작업 시점) — 일반 dev 컨텍스트 (tournaments-expert 미박제). plan: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md` | ✅ |
| 2026-05-04 | 8af51eb push + bec591b 미푸시 + knowledge +3 | **매치 코드 v4 Phase 1+2+3 + knowledge 박제** — P1 schema 6컬럼 (Tournament short_code/region_code + Match match_code/category_letter/division_tier/group_letter, 운영 무중단 prisma db execute 우회) + P2 helper (`src/lib/tournaments/match-code.ts` 순수 함수 4종 + REGION_CODE_MAP 17 + alias 6 + CITY_TO_SIDO 26, vitest 27/27) + P3 backfill 61매치 (몰텐 27 case④ A/D3/group A-D + 열혈 34 case① 모두 NULL, 트랜잭션 wrap, UNIQUE 충돌 0). knowledge: errors+1 prisma relation camelCase / lessons+1 prisma generate EPERM Windows / conventions+1 prisma db execute 우회. tester+reviewer 모두 ✅. KPI P2 #2~#3 baseline (일반 dev 컨텍스트, tournaments 영역). plan: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md` | ✅ |
| 2026-05-04 | 1f8ee19 push | **[live] P2 #1 — 라이브 sticky 헤더 + 모바일 미니스코어 + 팀 비교 막대 옵션 C + P1 박제** — live-expert 시범 첫 케이스. 3파일 (page.tsx / tab-team-stats.tsx StatRow.kind+normalizeBar / .css HOME=accent AWAY=cafe-blue weak=opacity 0.4) + `.claude/agents/live-expert.md` P1. tsc 0 / vitest 21/21. KPI baseline 4에이전트: 21grep+18read+잘못된파일 0회+62분. 한계 1건: subagent_type 미등록 | ✅ |
| 2026-05-04 | 095938d | **알기자 linkify entries 헬퍼 통합 + conventions 박제 2건** — buildLinkifyEntries / Batch 헬퍼 통합 (-50줄) | ✅ |
| 2026-05-04 | (P1 schema + 코드 + P4 backfill + P5 박제) | **알기자 Phase 1 DB 영구 저장 마이그** — `tournament_matches.summary_brief Json?` ADD COLUMN + Promise.allSettled 트리거 통합 + tab-summary client fetch 제거 + backfill 34/35 | ✅ |
| 2026-05-04 | (planner / 메타) | **옵션 A 도메인 sub-agent 신설 상세 계획 박제** — 8도메인 + 시범 live-expert + KPI 3 + Phase 5 + 롤백 6 + 리스크 8 | ✅ |
| 2026-05-04 | 9b4019a + 887b89c + 운영 DB 7건 | **알기자 누락 7매치 backfill (#141~#147)** — community_posts INSERT 7건 (post 1373~1379) | ✅ |
| 2026-05-04 | 0b47489 + 4 commits | **대회·경기 헤더 UI 개편** — 좌제목+우컨트롤5 / segmented 풀폭 / 컨트롤 90% 축소 | ✅ |
| 2026-05-04 | 4658963 | **시간 데이터 소실 매치 안내 배너 + #141 stat 14건** — settings.timeDataMissing 플래그 + Hero 직후 안내 배너 | ✅ |
| 2026-05-04 | (debugger) | **카테고리 가로 스크롤 fade overlay = 브라우저 캐시 본질** — fix=hard reload 안내 | ✅ |
<!-- 5/4 가로 스크롤 indicator 1건 + 5/3 알기자 진단 1건 절단 (매치 코드 v4 Phase 1~4 누적 prepend로 10건 유지) — 복원: git log -- .claude/scratchpad.md -->
