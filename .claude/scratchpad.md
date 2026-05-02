# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 다음 세션 진입점 (2026-05-02 종료 시점)

### **🚀 1순위 — 매치 코드 신규 체계 도입 (Phase 1~7)**

**계획 v3 확정** (사용자 결정 받음 — 길이 7~10자):

```
{토너먼트 short_code}[종별][디비전]-{NNN}

① 단일/단일:        M21-001         (7자)
② 디비전만 분리:    M21-D1-001      (9자)
③ 종별만 분리:      M21-A-001       (8자, A=일반부 / Y=유청 / S=시니어 / W=여성 / U=대학)
④ 둘 다 분리:       M21-A1-001      (9자, 종별letter + 디비전숫자)
```

**핵심 발견 (운영 25개 대회 분석)**:
- `tournaments.divisions` / `division_tiers` 거의 비어있음 (legacy)
- `tournaments.categories` JSON `{종별: [디비전]}` 만 채워짐 (몰텐배·TEST 만)
- `tournament_teams.category` / `division_tier` 거의 null
- 매치번호 부여 일관성 X — dual_tournament 만 부여 / TEST(0/16) / 열혈(3/34) 미부여
- `match_number` UNIQUE 인덱스 부재 (잠재 중복 위험)

**Phase 단계** (사용자 결정 후 진행):
1. DB schema: `tournaments.short_code` + `tournament_matches.match_code` 컬럼 + UNIQUE 인덱스 + `tournament_matches.category/division_tier` denormalize
2. helper module (`generateMatchCode.ts`, `generateTournamentShortCode.ts`)
3. 운영 토너먼트 backfill (몰텐배 short_code 부여 + 27매치 코드 부여)
4. match generator 4종 통합 (dual / single elim / round robin / group knockout)
5. UI 노출 (일정 카드 / 대진표 카드 / 매치 상세 / URL deep link)
6. 미부여 매치 backfill (TEST 16개, 열혈 31개)
7. (옵션) URL deep link `/tournaments/[id]/m/M21-013`

**예상 시간**: ~3~4시간 (Phase 1~6)

---

### 🟡 HOLD 큐
- **자율 QA 봇 시스템** (사용자: "내가 얘기 안 꺼내면 환기해줘") — Phase 1~5 / 9d
- **BDR 기자봇 v2** — Phase 1 완료 (알기자 / Gemini 2.5 Flash). Phase 2~7 (DB articles + 게시판 'news' 카테고리 + 사용자 선별 + 피드백) 대기

### 구현 기록 — BDR NEWS 알기자 Phase 1 (2026-05-02)

📝 매치 종료 매치 단신 기사 LLM (Gemini 2.5 Flash) 통합. 진행 중 매치는 호출 X / 종료 매치만 메모리 캐시 후 1회 생성.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `package.json` | `@google/genai@^1.51.0` 추가 (Google 공식 신규 SDK) | 수정 |
| `.env.example` | `GEMINI_API_KEY` 항목 추가 | 수정 |
| `src/lib/news/gemini-client.ts` | Gemini SDK 래퍼 / `generateText()` / thinkingBudget=0 | 신규 (45줄) |
| `src/lib/news/prompts/alkija-system.ts` | 알기자 system prompt (격식70+친근30, 300자 룰) | 신규 (35줄) |
| `src/lib/news/match-brief-generator.ts` | MatchBriefInput 정의 + buildUserPrompt + 메모리 캐시 | 신규 (155줄) |
| `src/lib/news/validate-brief.ts` | 점수/팀명/길이/hallucination 키워드 검증 | 신규 (75줄) |
| `src/app/api/live/[id]/brief/route.ts` | GET endpoint — completed 매치만 LLM 호출 | 신규 (290줄) |
| `src/app/live/[id]/_v2/tab-summary.tsx` | LLM brief fetch (useEffect) + Phase 0 fallback + "✍️ 알기자" 시그니처 | 수정 (+62줄) |

💡 tester 참고:
- 테스트 방법:
  1. `.env` 에 `GEMINI_API_KEY=` 설정 (운영 .env 에 이미 추가됨)
  2. dev server `npm run dev` (port 3001)
  3. 종료 매치 페이지 (예: `/live/134`) 접속 → 요약 탭 Lead 부분이 LLM 응답으로 교체되는지 확인
  4. 시그니처 "✍️ 알기자 · BDR NEWS AI" 표기 확인
- 정상 동작:
  - 종료 매치 (status=completed) → LLM 단신 기사 (3~5문장, 300자 이내) 표시
  - 진행 중 매치 (status=live) → Phase 0 템플릿 그대로 (LLM 호출 X)
  - GEMINI_API_KEY 미설정 / LLM 실패 → Phase 0 템플릿 fallback (시그니처 X)
- 검증 통과 케이스 (스크립트 단위): "셋업 55-43 MZ" 가상 입력 → 259자 단신 기사 (점수 정확, 양 팀명 등장)
- 주의할 입력:
  - 점수 0-0 매치 → flow="default" 분기 OK
  - 양 팀 모두 DNP만 (playerStats 0건) → MVP/최다득점 null + 흐름 hint 만으로 LLM 호출 (정상 처리되어야)
  - PBP 0건 매치 → quarterScores 빈 배열 + flow="default" — 점수차 + 팀명 만으로 LLM 호출

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  - `match-brief-generator.ts` 메모리 캐시 (Map) — Vercel serverless 인스턴스 별이라 cold start 시 재생성. 무료 tier 1500 RPD 충분 (운영 평소 360 호출).
  - `validate-brief.ts` hallucination 키워드 11개 — 운영 데이터에 없는 사실 ("관중", "환호" 등) 검출. 운영 후 LLM 응답 패턴 보면서 추가 가능.
  - `tab-summary.tsx` SWR 미사용 — 매치당 1회 fetch 라 단순 useEffect 채택. 다중 탭 동시 접속 시 중복 호출 가능하나 서버 메모리 캐시로 LLM 비용 0.
- 안전 가드:
  - DB schema 변경 0 (Phase 2 영역)
  - Flutter `/api/v1/...` 응답 변경 0
  - 진행 중 매치 LLM 호출 0
  - LLM 실패 시 Phase 0 템플릿 영구 fallback (사용자 영향 0)

---

## 🔴 5/2 대회 종료 후 즉시 처리 큐

| # | 항목 | 상태 |
|---|---|---|
| 1 | 셋업팀 가입 대기 17명 정리 | ✅ |
| 2 | 셋업팀 ttp user 매핑 (6/9, 잔여 3명: 김병주/이영기/이준호) | ⏳ |
| 3 | 셋업팀 placeholder user 5명 정리 | ⏳ |
| 4 | mergeTempMember 함수 강화 (name 매칭 추가) | ⏳ |
| 5 | 16팀 미매핑 8팀 `tournament_team_players` 보정 (잔여 = MI / SKD 명단 0팀) | ⏳ |
| 6 | 11명 명단 미가입 (블랙라벨 11 + MSA 5 + 슬로우 3 = 19명, userId=null INSERT 또는 가입 후 매칭) | ⏳ |

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
| Live `/live/[id]` v2 | ✅ STL Phase 1~2 (출전시간 280m 만점) |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-02 | (Phase 1) | **알기자 BDR NEWS Phase 1** — Gemini 2.5 Flash + system prompt + match-brief-generator + validate-brief + `/api/live/[id]/brief` route + tab-summary LLM 통합 (Phase 0 fallback 영구 유지). 신규 5 + 수정 3 파일. 검증 매치 #134 가상 입력 259자 단신 통과. tsc PASS. completed 매치만 LLM 호출 — 라이브 영향 0 | ✅ |
| 2026-05-02 | (DB UPDATE+박제) | **5팀 명단/배번 보정** (MZ id=233 정정 + 동명이인 발견) — 1차 매칭 32명 + [유사] User 15명 INSERT. MZ 11/11 ✅ / 우아한 9/9 ✅ / 잔여 19명 (User 미가입) | ✅ |
| 2026-05-02 | (DB 트랜잭션) | **김영훈 placeholder ↔ real user 통합** (uid 2954→2853) — ttp/Stat/PBP/tm 7단계 트랜잭션. 매치#133 매칭률 80%→96%. lessons.md 박제 | ✅ |
| 2026-05-02 | cf2eea1 | **dual 진출 회귀 방지 4종** (A 자가치유 + B PATCH 차단 + C dirty tracking + D 검출). errors.md 박제 | ✅ |
| 2026-05-02 | ebd335f | api/live G1 DNP 가드 (#136 -44m 회복) | ✅ |
| 2026-05-02 | 90759d5 | **audit log E** — `tournament_match_audits` 신규 테이블 + helper + admin/flutter/system 통합. prisma db push 무중단 | ✅ |
| 2026-05-02 | b728abb | PC 우승 예측 → 참가비 박스 아래 이동 + 대진표 풀폭 (모든 탭 sticky) | ✅ |
| 2026-05-02 | a437829 | PC 일정 카드 콤팩트 + 매치번호 표시 + 그리드 (md 2열/xl 3열). 매치번호 부여 미흡 발견 (TEST 0/16, 열혈 3/34) | ✅ |
| 2026-05-02 | (DB UPDATE) | **Match #21 8강 home=away fix** (피벗·아울스 2번째 케이스). audit log 9건 self-heal 자동 정정 흔적 추적 | ✅ |
| 2026-05-02 | cfa64a6 | **트리 배정 로직 점검** — progressDualMatch self-heal context 강화 (source 명시) + updateMatch/updateMatchStatus legacy 진출에 self-heal+audit 추가 | ✅ |
| 2026-05-02 | (시뮬 ROLLBACK) | **결승 시뮬레이션 검증** — 27매치 결승까지 가상 진행. self-heal 8건 자동 정정 / 양쪽 같은 팀 0건 / 우승=아울스 (가상). 운영 영향 0 | ✅ |
