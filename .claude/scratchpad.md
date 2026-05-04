# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[Phase 1+2 완료] 매치 코드 v4 schema + helper** — developer 작업 완료. tester+reviewer 병렬 대기. **사용자 액션 1건 필요**: dev server 재시작 후 `npx prisma generate` (Windows EPERM 으로 dev server 가 query_engine 잠금 중).

---

## 구현 기록 (developer / Phase 1+2) — 2026-05-04

📝 매치 코드 v4 schema + helper 통합 구현 (사용자 승인 받음 / 운영 DB 무중단 push 완료)

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `prisma/schema.prisma` | Tournament +2컬럼 (short_code UNIQUE, region_code) / TournamentMatch +4컬럼 (match_code UNIQUE, category_letter, division_tier, group_letter) | 수정 (+12줄) |
| `src/lib/tournaments/match-code.ts` | 순수 helper 5종 (REGION_CODE_MAP 17 + alias 풀네임 6 + CITY_TO_SIDO 26 / normalizeRegion / generateMatchCode / parseMatchCode / isValidShortCode) | 신규 |
| `src/__tests__/lib/tournaments/match-code.test.ts` | vitest 27 케이스 (REGION_MAP 17개 / generate 4 / parse 7 / normalizeRegion 8 / isValidShortCode 6) | 신규 |

✅ **검증 통과**:
- 운영 DB ADD COLUMN 6개 + UNIQUE 2개 적용 (`prisma db execute` 직접 SQL — `db push --accept-data-loss` 회피 / 사전 SELECT 1건 + 사후 verify 통과 / tournaments 56 + matches 77 무영향)
- vitest 27/27 PASS / tsc --noEmit exit 0

⚠️ **사용자 액션 1건**: dev server (port 3001 PID 20952) 재시작 후 `npx prisma generate` 1회. 현재 query_engine.dll 잠금 상태로 client 미재생성 — 신규 6컬럼 TS 자동완성/타입체크 미반영. 런타임 영향 0 (Phase 4 generator 작성 전까지 신규 컬럼 사용 0).

💡 tester 참고:
- 테스트 방법: `npx vitest run src/__tests__/lib/tournaments/match-code.test.ts` → 27/27 PASS
- 운영 DB 검증: `tournaments` / `tournament_matches` 컬럼 information_schema 조회 → 6컬럼 + 2 UNIQUE 존재
- 정상 동작: `generateMatchCode({year:2026,regionCode:"GG",shortCode:"MD21",matchNumber:1})` → `"26-GG-MD21-001"` / `normalizeRegion("남양주시")` → `"GG"` / `parseMatchCode("26-GG-MD21-001")` → `{year:2026,...}`
- 주의 입력: 17 시도 외 region (예: "XX") 은 정규식만 통과 → Phase 4 generator 가 별도 검증

⚠️ reviewer 참고:
- helper 는 **순수 함수만** (DB 의존성 0, prisma client import 0 — Phase 4 generator 가 의존성 주입)
- REGION_FULLNAME_ALIAS 추가 사유 = "충청남도"는 "충남"을 substring 으로 포함 안 함 (운영 표기 호환)
- CITY_TO_SIDO 26 도시 = 운영 2대회 + 빈출 도시. 새 도시 발견 시 점진 보강 (decisions.md "v4 채택" 항목 후속 액션)
- UNIQUE 제약: PostgreSQL NULL 다중 허용 → backfill 점진 안전 (충돌 0)

📊 **KPI 자가 측정** (P2 #2 baseline 비교군):
- grep 1회 / read 6회 / 잘못된 파일 0회 / edit 9회 / 약 30분 (사전 검증 + 직접 SQL 우회 + alias 추가)
- as of: subin HEAD = d660a53
- 체감: tournaments 영역 작업이지만 일반 developer 컨텍스트로 진행. 시범 외 영역이라 system prompt 주입 없음. helper 구조 / region 정규화 / vitest 케이스 모두 plan 부록 그대로 따름 → 시범 영역 (live-expert) 과 비교 시 "도메인 깊이 필요 ↓" 케이스라 baseline 가치 약함.

---

## 테스트 결과 (tester) — 2026-05-04 매치 코드 v4 Phase 1+2

| # | 검증 항목 | 결과 |
|---|----------|------|
| 1 | tsc --noEmit | ✅ exit 0 |
| 2 | vitest match-code 27/27 | ✅ 362ms |
| 3 | minutes-engine 21/21 (회귀 0) | ✅ 529ms |
| 4 | 운영 DB 6컬럼 + 2 UNIQUE | ✅ tournaments(short_code VARCHAR(7)/region_code VARCHAR(2)) + matches(match_code VARCHAR(20)/category_letter/division_tier/group_letter) + UNIQUE 2건 |
| 5 | 미커밋 변경 보존 | ✅ 4 modified + 2 신규 그대로 |
| 6 | helper 동작 (운영 12케이스) | ✅ 남양주시→GG / 경기도화성시→GG / 서울특별시→SE / 외국→null / MD21·HJ02 valid / md21·M21 reject |
| 7 | 운영 INSERT/UPDATE/DELETE 0 | ✅ SELECT만 (count 56/77 무영향, 신규 6컬럼 100% NULL) |

**판정**: ✅ 통과 (7/7). 발견 사항 0. KPI: grep 1 / read 4 / 시간 ~10분 / as of d660a53.

---

## 리뷰 결과 (reviewer) — 2026-05-04 매치 코드 v4 Phase 1+2

| # | 영역 | 결과 | 비고 |
|---|------|------|------|
| 1 | 코드 품질 | ✅ | 순수함수 4종 + side effect 0 + prisma import 0 / regex 정확 (`^(\d{2})-([A-Z]{2})-([A-Z]{2}\d{2})-(\d{3})$`) / REGION 17 + alias 6 + CITY 26 매핑 무오타 / padStart 3 정확 / parse null 일관 |
| 2 | 사용자 결정 6건 정합성 | ✅ | Q5 `-` / Q6 3자리 / Q7 영문2자 17 / Q8 `[A-Z]{2}\d{2}` / Q9 별도컬럼 미관여 / Q10 별도컬럼 미관여 — decisions.md 일치 |
| 3 | schema 정합성 | ✅ | short_code(7) UNIQUE / region_code(2) / match_code(20) UNIQUE / category(1) / division(2) / group(1) 모두 decisions 정의와 일치. snake_case map 컨벤션 준수 |
| 4 | region 정규화 | ✅ | 운영 2대회 (남양주→GG / 화성→GG) 통과. 접미사 4종 (특별자치도/특별자치시/특별시/광역시) + 풀네임 alias 6 + CITY 26 + null 일관. 영문 입력은 매핑 외 → null (의도된 동작) |
| 5 | UNIQUE 안전성 | ✅ | PostgreSQL NULL 다중 허용 → backfill 점진 안전. UNIQUE 충돌 fallback 은 Phase 4 위임 (L277~281 TODO 주석 명시) |
| 6 | 회귀 / 사이드이펙트 | ✅ | 호출자 0 (Phase 4 generator 미작성) / minutes-engine·STL·AppNav 무관 |
| 7 | 보안 / 운영 | ✅ | NULL ADD COLUMN 무중단 / 운영 데이터 변경 0 / secret 노출 0 / NEXT_PUBLIC 위반 0 |

**개선 제안 (LOW, Phase 4 큐)**:
- L218 `MATCH_CODE_REGEX` 가 `[A-Z]{2}` region 만 검사 — 17시도 외 (예: "XX") 도 통과. parseMatchCode docstring L223 "별도 함수 (호출자 책임)" 명시되어 있어 의도된 분리. Phase 4 generator 가 Prisma 조회 + RegionCode 검증 책임
- `generateUniqueMatchCode` (UNIQUE 충돌 fallback) Phase 4 큐 → L277~281 TODO 주석 명시되어 정상
- LESSONS 후보 1: `prisma generate` EPERM (Windows dev server query_engine 잠금) — 사용자 액션 필요. lessons.md 박제 후보
- CONVENTIONS 후보 1: `prisma db push --accept-data-loss` 회피 = `prisma db execute` 직접 SQL 우회 결정 (CLAUDE.md DB 정책 안전 가드 준수). conventions.md 박제 후보

**판정**: ✅ 통과 (LOW 큐 없음 — Phase 4 정상 위임)
**KPI**: reviewer grep 1 / read 5 / 시간 ~12분 / 잘못된 파일 0

---

## 기획설계 (planner-architect) — 2026-05-04 매치 코드 v4 **재수립** (사용자 정보 2건 반영)

🎯 목표: 사용자 추가 정보 2건 (① 향후 전국 ② 운영 2대회만) 으로 직전 권장 (하이브리드) 무효 → 재검토.

📂 **plan 갱신**: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md` (~280줄)

❌ **직전 분석 무효** (4건):
- "수도권 90% → v4 정보가치 ↓" → 무효 (전국 미래 = ↑)
- "56대회 백필 +50%" → 무효 (실 운영 = 2대회 ~10분)
- "운영 100% 케이스 ①" → 무효 (몰텐배 = 케이스 ④ `{"일반부":["D3"]}`)
- "결정 부담 5건" → 부분 유효 (Q5~Q10, Q10 = 풀리그 group_letter NEW)

📊 **운영 2 대회 SELECT** (61매치):
- 몰텐배 (id=138b22d8): 27매치 / city=남양주시 → GG / 케이스 ④ / **group_name A/B/C/D 4조 풀리그** ⭐
- 열혈 SEASON2 (id=d83e8b83): 34매치 / city=경기도 district=화성시 → GG / 케이스 ① / 풀리그+토너 혼합
- 56대회 city: 수도권 84% (47/56) / 비수도권 7% (4건) / NULL 7%

📋 **v3 vs v4 vs 하이브리드 (재비교)**:

| 항목 | v3 | v4 ⭐ | 하이브리드 |
|------|-----|------|------|
| 미래 정보가치 (전국) | 약 | **강** | 중 |
| 운영 백필 (61매치 / 2대회) | 5분 | 10분 | 10분 |
| 코드 길이 | 7~10자 | 12~14자 | 7~10자 |
| Phase 일정 | 6h | **5h** | 6.5h |
| 사용자 의도 정합성 | 약 | **강** | 중 |
| 결정 부담 | Q1~4 | Q5~10 (6건 일괄) | Q7 1건 |

📋 **Q5~Q10 권장** (6건 일괄):
- Q5 구분자 = **B (전부 `-`)**
- Q6 매치번호 자릿수 = **3자리 (001~999)**
- Q7 17시도 = **B (영문 약어 2자, SE/BS/DG/IC/GJ/DJ/US/SJ/GG/GW/CB/CN/JB/JN/GB/GN/JJ)**
- Q8 두자리 숫자 = **A (시즌/회차, 21/02)**
- Q9 종별/디비전 = **D (category_letter+division_tier 별도 컬럼)**
- Q10 풀리그 group_name = **A (group_letter VarChar(1) 별도 컬럼)** ⭐ NEW

🎯 **단호한 권장: B. v4 직진** (7가지 사유)
1. 사용자 v4 직접 제안 → 의도 정합성
2. 미래 전국 17시도 분산 → region_code 정보가치 ↑
3. 백필 비용 ≈ 0 (운영 2대회만 = 10분)
4. 글로벌 식별성 (`26-GG-MD21-001` 단일 코드 = 연도+지역+대회+매치)
5. Phase 5h (목 백필 생략) ≤ v3 6h ≤ 하이브리드 6.5h
6. v4 처음부터 = 미래 v3→v4 재구축 비용 회피
7. Q5~10 1회 일괄 결정 (5분) → 하이브리드 Q7 1건이지만 미래 비용 전이

📍 schema (v4, 5컬럼):
```prisma
model Tournament {
  short_code   String?  @unique @db.VarChar(7)  // MD21 / HJ02
  region_code  String?  @db.VarChar(2)          // GG / SE
}
model TournamentMatch {
  match_code      String?  @unique @db.VarChar(20)  // 26-GG-MD21-001
  category_letter String?  @db.VarChar(1)           // A=일반/Y=유청/S=시니어/W=여성/U=대학
  division_tier   String?  @db.VarChar(2)           // D1~D9
  group_letter    String?  @db.VarChar(1)           // A/B/C/D 풀리그 (NEW)
}
```

📋 **Phase 1~7 (~5h)**: ① schema 5컬럼 (승인) → ② match-code.ts helper + region 정규화 1.5h → ③ 운영 2대회 61매치 backfill (승인) 30분 → ④ generator 4종 1.5h → ⑤ UI 1h → ⑥ 목 54대회 생략 → ⑦ deep link 1h

⚠️ 다음 PM 액션 (사용자 결정 1회 일괄):
1. 방향 결정: v3 / 하이브리드 / **v4 (권장)**
2. v4 채택 시 Q5~Q10 6건 일괄 확정 (권장안 그대로 OR 일부 반려)
3. 이니셜 입력: 몰텐배 = "MD" + 21 / 열혈 = "HJ" + 02
4. Phase 1 schema push 승인 (5컬럼 ADD COLUMN, NULL 허용 무중단)

---

## 🎯 다음 세션 진입점

### 🚀 1순위 — 매치 코드 v4 신규 체계 (Phase 1~7, ~5h)

**상태**: v4 재수립 완료 (사용자 정보 2건 반영) → **v4 직진 권장** (직전 하이브리드 무효). 사용자 방향 결정 + Q5~Q10 6건 일괄 + 이니셜 (MD/HJ) 입력 + schema push 승인 → developer 위임.

**핵심 결정 대기**: 사용자에게 §기획설계 §단호한 권장 (v4 직진 7사유) 제시 → Q5~Q10 일괄 확정 → 이니셜 (몰텐 "MD"+21 / 열혈 "HJ"+02) → Phase 1 5컬럼 schema push 승인

**Phase (v4)**: ① schema 5컬럼 30분 (승인) → ② match-code.ts + region 정규화 1.5h → ③ **운영 2대회 61매치 backfill** 30분 (승인) → ④ generator 4종 1.5h → ⑤ UI 1h → ⑥ 목 54대회 **생략** → ⑦ deep link 1h

**plan 풀텍스트**: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md` (재수립 ~280줄)

### 🚀 2순위 — 도메인 sub-agent P2 측정 누적 (P3 5/18 결정)
- live-expert P2 #1 baseline 완료. #2~#3 = 다음 live 작업 자연 발생 시 누적
- **한계 1건**: `.claude/agents/<name>.md` 박제 후 Task subagent_type 미등록 → planner/dev 에 system prompt 주입 우회. P3 lessons.md 박제 후보
- **전체 plan**: `~/.claude/plans/dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md` (8 에이전트 system prompt 풀 텍스트 + Phase 5단계 + 부록 A/B)
- **decisions.md** 박제됨 (97번째 항목)

### 🚀 3순위 — 미커밋 잔여 정리 (사용자 결정 보류)
- 8파일 modified (prisma/schema +114 / community-content +171 / globals.css +75 / admin/news +62 / community/[id] +55 / news/match +29 / settings +10) + 신규 3 (admin/news/_components/ / api/web/upload/news-photo/ / lib/news/news-photo-gallery.tsx) — 추정 = **알기자 뉴스 사진 갤러리** 작업 미커밋
- Option D (보존) 결정 — 본 세션 미터치

---

## 🟡 HOLD 큐
- **자율 QA 봇 시스템** (사용자: "내가 얘기 안 꺼내면 환기해줘") — Phase 1~5 / 9d
- **BDR 기자봇 v2** — Phase 1 완료. Phase 2~7 (DB articles + news 카테고리 + 선별 + 피드백) 대기

---

## 🔴 5/2 대회 종료 후 잔여 큐

| # | 항목 | 상태 |
|---|---|---|
| **A** | placeholder User 89명 — 잔여 86건 LOW (본인 가입 시 mergeTempMember 자동) | 🟡 89/107 |
| **B** | ttp 부족팀 5팀 — MI 9 / 슬로우 8 / MZ 11 / SA 9 / 우아한 9. 운영팀 컨택 | 🟡 사용자 액션 |

---

## 우선순위 2 — 결정 대기 큐

| 영역 | 결정 건수 | 산출물 |
|---|---|---|
| 관리자페이지 UI 개선 | 6건 (Phase A 모바일 가드 1순위) | `git log` "관리자페이지 UI 개선" |
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
| 5/2 동호회최강전 D-day 운영 | ✅ DB 16팀 + 27경기 + 회귀 5종 + audit log |
| dual_tournament 진출 슬롯 회귀 방지 | ✅ A~E 5종 |
| PC UI | ✅ 우승예측 사이드바 + 일정 콤팩트+매치번호 |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| 듀얼토너먼트 풀 시스템 | ✅ Phase A~F2 |
| **Live `/live/[id]` v2** | ✅ STL + minutes-engine v3 + **5/4 sticky+팀비교 옵션C (1f8ee19)** |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |
| **도메인 sub-agent (옵션 A)** | ✅ P1 박제 / ⏳ P2 측정 누적 / P3 5/18 |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-04 | (developer / 미커밋) | **매치 코드 v4 Phase 1+2 구현** — schema +12줄 (Tournament 2 + Match 4 = 6컬럼 + 2 UNIQUE) / 운영 DB `prisma db execute` 직접 SQL 무중단 push (사전 SELECT + 사후 verify, tournaments 56 + matches 77 무영향) / `match-code.ts` 순수 helper 5종 (REGION 17 + alias 6 + CITY_TO_SIDO 26) / vitest 27/27 PASS / tsc 0. 사용자 액션: dev server 재시작 + `npx prisma generate` | ✅ |
| 2026-05-04 | (planner) | **[메타] v4 계획 재수립 — 사용자 정보 2건 (전국 미래 + 운영 2대회) → 직전 하이브리드 권장 무효 → v4 직진 권장** — 운영 2대회 SELECT (몰텐 27 + 열혈 34 = 61매치 / 몰텐=케이스④ ⭐ / 풀리그 group_name 발견 → Q10 NEW). 56대회 수도권 84%. 단호 권장 = v4 직진 (7사유). Phase 5h (목 백필 생략). plan 갱신 (~280줄). | ✅ |
| 2026-05-04 | (planner) | **매치 코드 v3 Phase 1 기획설계 박제** — 운영 SELECT (56 대회 / 77 매치 / 30 팀) 검증. Q1~Q4 옵션·권장 (C 하이브리드 / A 3~7자 수동 / A 영구 / B series 미신설). schema 4 컬럼. Phase 1~7 ~6h | ✅ |
| 2026-05-04 | 1f8ee19 push | **[live] P2 #1 — 라이브 sticky 헤더 + 모바일 미니스코어 + 팀 비교 막대 옵션 C 정규화 + P1 박제 통합** — live-expert 시범 첫 케이스. 3파일 (page.tsx sticky+미니스코어+abbreviateTeamName / tab-team-stats.tsx StatRow.kind+normalizeBar / .css HOME=accent AWAY=cafe-blue weak=opacity 0.4) + `.claude/agents/live-expert.md` P1 신규. tsc 0 / vitest 21/21. tester+reviewer ✅. **KPI baseline 4에이전트 누적**: 21grep+18read+잘못된파일 0회+62분. 한계 1건: subagent_type 미등록 → system prompt 주입 우회 (P3 lessons 후보) | ✅ |
| 2026-05-04 | 095938d | **알기자 linkify entries 헬퍼 통합 + conventions 박제 2건** — buildLinkifyEntries / Batch 헬퍼 통합 (-50줄). conventions 31→33 + errors 30→31 + index | ✅ |
| 2026-05-04 | (P1 schema + 코드 + P4 backfill + P5 박제) | **알기자 Phase 1 DB 영구 저장 마이그** — `tournament_matches.summary_brief Json?` ADD COLUMN + `Promise.allSettled` 트리거 통합 + tab-summary client fetch 제거 + backfill 34/35. architecture +1, decisions +2 | ✅ |
| 2026-05-04 | (planner / 메타) | **옵션 A 도메인 sub-agent 신설 상세 계획 박제** — 8도메인 + 시범 live-expert + KPI 3 + Phase 5 + 롤백 6 + 리스크 8. plan 파일 풀텍스트 박제 | ✅ |
| 2026-05-04 | 9b4019a + 887b89c + 운영 DB 7건 | **알기자 누락 7매치 backfill (#141~#147)** — subin→dev→main 머지 + 운영 endpoint fetch + community_posts INSERT 7건 (post 1373~1379) | ✅ |
| 2026-05-04 | 0b47489 + 9d72cf5 + 2bfb873 + 78b0bae + b141e53 | **대회·경기 헤더 UI 개편** — 좌제목+우컨트롤5 / segmented 풀폭 / 컨트롤 90% 축소 / GamesClient 헤더 통합 | ✅ |
| 2026-05-04 | 4658963 | **시간 데이터 소실 매치 안내 배너 + #141 stat 14건** — matchPlayerStat INSERT + settings.timeDataMissing 플래그 + Hero 직후 안내 배너 | ✅ |
<!-- 5/3~5/4 압축 (모바일 Hero / SKD #5 / Admin-Web / 듀얼시뮬 / #145 등 6건 절단). P2 #1 분석/구현/테스트/리뷰 섹션은 1f8ee19 commit + 작업 로그 한 줄로 흡수. 복원: git log -- .claude/scratchpad.md / plan 파일 / commit hash diff -->
