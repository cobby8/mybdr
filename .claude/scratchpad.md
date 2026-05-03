# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**시간 시스템 작업 종료 (2026-05-03 저녁)** — minutes-engine v3 7회 보강 완료. 종료 매치 100% / 라이브 ~99% / Unit test 21/21 PASS / Fallback 발동 0회. 다음 진입점은 매치 코드 신규 체계 도입 (Phase 1~7).

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

#### 🔍 5/2 추가 분석 — 자동 생성 규칙 (HOLD, 결정 4건 대기)
- 운영 56건 SELECT 결과: BDR 시리즈 11건만 자동 가능 / 라인농구교실배 동일명 4건 등 충돌 / 한국어 약어 추출 모호 → 단일 알고리즘 ❌
- **권장 = C 하이브리드** (자동 추천 후보 + 운영자 확정)
- 다음 세션 결정 4건: Q1 A/B/C / Q2 형식(3~7자/영대+숫자/첫글자영문) / Q3 변경정책(영구 추천) / Q4 series.short_code 컬럼 신설 여부

---

### 🟡 HOLD 큐
- **자율 QA 봇 시스템** (사용자: "내가 얘기 안 꺼내면 환기해줘") — Phase 1~5 / 9d
- **BDR 기자봇 v2** — Phase 1 완료 (알기자 / Gemini 2.5 Flash). Phase 2~7 (DB articles + 게시판 'news' 카테고리 + 사용자 선별 + 피드백) 대기

---

## 🟡 경기 종료 후 즉시 처리 (5/3 14:30 SKD vs 슬로우 종료 후)

| # | 항목 | 우선 |
|---|---|------|
| **HOT** | **SKD #5 안원교 (uid=3342→3351) 통합** — placeholder 와 본인 직접 가입자 (awk122@naver.com) 분리 발견. 진행 중 경기 영향 우려로 종료 후 처리. ttp_id=2829 + tm_id=2670 의 userId 3342→3351 UPDATE + User 3342 status=merged. 권도윤/이삭 통합 패턴 동일 | 🔴 |

---

## 🔴 5/2 대회 종료 후 즉시 처리 큐

| # | 항목 | 상태 |
|---|---|---|
| 1 | 셋업팀 가입 대기 17명 정리 + **자동 approve 함수 추출 ✅** (`src/lib/teams/approve-join-requests.ts`) | ✅ |
| 2 | 셋업팀 ttp user 매핑 — **완료** (김병주는 이미 매핑됨 / 이영기·이준호 2026-05-03 통합) | ✅ |
| 3 | placeholder User **89명** (5/3 박백호 -1 + 셋업 -2 + 18건 일괄 -18 = 누적 -21). 보류 3건 (오승준/이상현/이정민 — 동명이인). 잔여 86건 LOW (본인 미가입). | 🟡 89/107 |
| 4 | mergeTempMember 함수 강화 — **완료** (`mergePlaceholderUser` 신규 + 기존 위임 / commit e029fac / vitest 30/30 PASS) | ✅ |
| 5 | 16팀 ttp 부족팀 5팀 (MI 9 / 슬로우 8 / MZ 11 / SA 9 / 우아한 9 — 12명 미만) — 운영 룰 검토 (대회 진행 중) | 🟡 |
| 6 | 미가입 명단 placeholder INSERT — **블랙라벨 11 ✅ + MSA 5 ✅ + 슬로우 8 ✅ (5/3)** / SKD 13명 ✅ / MI 9명 (3명 부족) | 🟡 부분 |
| 7 | **16팀 가입신청 정리** — 5/3 일괄 처리 완료. pending 16건 → 0건 (MI 8 + SKD 4 + 닥터 1 + 다이나믹 2 + 업템포 1 / no_jersey 모드 / tm 14건 신규 INSERT, 2건 기존 멤버 skip) | ✅ |

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
| 2026-05-03 | (doc-writer / scratchpad 압축 + knowledge 5 파일 갱신) | **시간 시스템 작업 종료 마무리** — scratchpad 363→100줄 압축 (구현 기록 5건 → 작업 로그 통합) + knowledge 갱신 (architecture +1 minutes-engine v3 / conventions +1 가드 union 통일 / decisions +1 B 옵션 / lessons +1 raw 측정 함정 / errors 0 — 기존 항목 재사용 / index.md 항목 수+요약 갱신). 미푸시 0건 | ✅ |
| 2026-05-03 | d3984db | **minutes-engine endLineup chain 가드 범위 fix** — L196 `>=3 && <=7` (단일팀) → `>=5 && <=12` (양팀 union, DB starter 가드 L131 일관). 신규 test 케이스 L (양팀 5+5 starter chain 통과). 21/21 PASS. 라이브 매치 양팀 합 +15~17%p 정확도 회복. 종료 매치 LRM cap 흡수로 변화 0 (안전) | ✅ |
| 2026-05-03 | 72aa643 | **minutes-engine 리팩토링 B 옵션** — PBP 추정 fallback `inferStartersFromPbp()` 헬퍼 격리 + 메인 path (Q1 DB / Q2+ chain / boundary / LRM cap) 4분기 if/else 명확화 + 알고리즘 설계 헤더 주석. calculateMinutes 191→133줄 (-30%). 동작 변경 0. 20/20 PASS | ✅ |
| 2026-05-03 | 133d0de | **minutes-engine Tier 3** — starter 첫 segment qLen 강제 (firstGap 손실 0) + lastGap 보정 (다음 쿼터 PBP 존재 시 endClock=0 강제) + 라이브 마지막 쿼터 endClock=lastPbpClock 보존 (회귀 방지). 신규 test J/K/K-2. 20/20 PASS. 종료 raw 89.6% → 95%+ 향상 | ✅ |
| 2026-05-03 | 678a875 | **minutes-engine Tier 2** — `MinutesInput.dbStartersByTeam` 옵션 추가. Q1 starter = DB union 우선 (PBP 추정 무시) → fallback PBP. Q2~ = 직전 쿼터 endLineup chain. route.ts에서 playerStats.isStarter 매핑 주입. 신규 test G/H/I. 17/17 PASS. 정확도 92→99% | ✅ |
| 2026-05-03 | 7ea0174 | **minutes-engine `applyCompletedCap` LRM cap** — 단순 round → Largest Remainder Method. floor 후 잔여 fractional 큰 순 +1 분배. 양팀 합 ±1초 오차 0 (139:59/140:01 → 140:00). 신규 test D/E/F. 14/14 PASS | ✅ |
| 2026-05-03 | 9b4d3d5 | **dual_tournament advanceWinner 이중 가드** — sync route tasks 분기 (isDual 시 advanceWinner skip + cursor 패턴) + advanceWinner 진입부 format 조회 early return. dual D조 무한 루프 corrupt 차단 | ✅ |
| 2026-05-03 | 163a600 | **MIN 컬럼 소수점 → MM:SS round 표시 정확화** | ✅ |
| 2026-05-03 | e029fac | **mergeTempMember 강화** — `mergePlaceholderUser` 신규 + 기존 위임 (skipTmTransfer:true). 일반화 함수 (운영 backfill 직접 호출 / 가입 hook 자동 위임). 3 UNIQUE 우회 (jersey/nickname/team_user). vitest 30/30 PASS | ✅ |
| 2026-05-03 | (PM / 일괄 처리) | **5/2 큐 #5~#7 잔여 점검 + #7 pending 16건 일괄 approve** — `approveJoinRequests` 함수로 16건 모두 `approve_no_jersey` 일괄 호출 → approved 16/16 / tm 신규 14건 / pending 5팀 모두 0건. 매치 진행 (15 completed / 1 live / 11 pending) | ✅ |
