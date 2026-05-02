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
- **BDR 기자봇 v2** — `Dev/bdr-reporter-bot-plan-v2-2026-05-02.md` (Phase 0~7 / ~38h, Q1~Q10 결정 대기)

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
