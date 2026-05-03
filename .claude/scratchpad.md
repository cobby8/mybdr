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

#### 🔍 5/2 추가 분석 — 자동 생성 규칙 (HOLD, 결정 4건 대기)
- 운영 56건 SELECT 결과: BDR 시리즈 11건만 자동 가능 / 라인농구교실배 동일명 4건 등 충돌 / 한국어 약어 추출 모호 → 단일 알고리즘 ❌
- **권장 = C 하이브리드** (자동 추천 후보 + 운영자 확정)
- 다음 세션 결정 4건: Q1 A/B/C / Q2 형식(3~7자/영대+숫자/첫글자영문) / Q3 변경정책(영구 추천) / Q4 series.short_code 컬럼 신설 여부

---

### 🟡 HOLD 큐
- **자율 QA 봇 시스템** (사용자: "내가 얘기 안 꺼내면 환기해줘") — Phase 1~5 / 9d
- **BDR 기자봇 v2** — Phase 1 완료 (알기자 / Gemini 2.5 Flash). Phase 2~7 (DB articles + 게시판 'news' 카테고리 + 사용자 선별 + 피드백) 대기

<!-- 알기자 Phase 1 상세 섹션 압축 (2026-05-03) — 작업 로그에 한 줄로 보존, 전체 기록은 git log -- .claude/scratchpad.md 참고 -->

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
| 2 | 셋업팀 ttp user 매핑 (6/9, 잔여 3명: 김병주/이영기/이준호) | ⏳ |
| 3 | placeholder User **94명** 정리 (5/3 블랙라벨+11 / MSA+4 / 슬로우+1 = +16) | ⏳ |
| 4 | mergeTempMember 함수 강화 (FK 7단계 통합 추가 — 김영훈 케이스 패턴 표준화) | ⏳ |
| 5 | 16팀 미매핑 8팀 `tournament_team_players` 보정 (잔여 = MI / SKD 명단 대기) | 🟡 |
| 6 | 미가입 명단 placeholder INSERT — **블랙라벨 11 ✅ + MSA 5 ✅ + 슬로우 8 ✅ (5/3)** / SKD/MI 명단 대기 | 🟡 부분 |
| 7 | **16팀 가입신청 39건 정리** (5/3 발견) — 슬로우 8 ✅ / 블랙라벨 9 ✅ / 업템포 3 ✅ / 피벗 2 ✅ / 아울스 1 ✅ / MZ 1 ✅ / 잔여 SKD 7 + MI 8 (명단 대기) | 🟡 24/39 |

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

## 구현 기록 (developer / 2026-05-03 minutes-engine 리팩토링 — B 옵션 격리+명확화)

📝 구현한 기능: PBP 추정 fallback 격리 + 메인 path (DB starter / endLineup chain / boundary / LRM cap) 명확화

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/live/minutes-engine.ts` | 파일 헤더 알고리즘 설계 문서 주석 추가 (메인 path 4단계 + Fallback + 정확도) / `inferStartersFromPbp(qPbps)` 신규 헬퍼 함수 분리 (PBP-only fallback 격리, "fallback only" 명시) / `calculateMinutes` 내부 starter 결정 로직을 if/else 4분기로 명확화 (Q1 DB / Q1 fallback / Q2+ chain / Q2+ fallback) / Boundary 강제 / LRM cap 함수 헤더 주석 보강 | 수정 |

신규 헬퍼 시그니처:
```ts
function inferStartersFromPbp(qPbps: MinutesPbp[]): Set<bigint>
```
- 입력: 한 쿼터의 PBP 배열 (clock 내림차순 정렬 가정)
- 출력: starter 후보 ttp_id Set (sub_in 받은 적 없는 + sub_out 등장한 + 첫 sub 이전 등장한 union)

검증 결과:
- vitest: **20/20 PASS** (회귀 0 — 기존 J/K/K-2/G/H/I/D/E/F + 11개 모두 통과)
- tsc --noEmit: **0 에러**
- DB schema 변경 0 / Flutter 변경 0 / route.ts 변경 0 / format 함수 변경 0 / LRM 알고리즘 변경 0

라인 수 변화:
- 파일 전체: 325 → 333 (+8, 헤더 알고리즘 설계 주석 +22줄 포함)
- `calculateMinutes` 함수만: 191 → 133 (**-58줄, -30%**) — 메인 path 가 훨씬 짧고 명확
- `inferStartersFromPbp` 헬퍼 분리로 fallback 로직이 본체에서 제거됨

💡 tester 참고:
- 테스트 방법: `npx vitest run src/__tests__/lib/live/minutes-engine.test.ts` — 20/20 PASS 확인
- 정상 동작: 동작 변경 0 (회귀 0). 기존 모든 케이스 (J starter firstGap / K lastGap / K-2 라이브 마지막쿼터 / G DB starter / H PBP fallback / I Q2 chain / D/E/F LRM) 모두 통과
- 주의할 입력: 없음 — 리팩토링만, 알고리즘 동일

⚠️ reviewer 참고:
- **inferStartersFromPbp 격리 효과**: 향후 PBP 추정 룰 변경/실험 시 이 함수만 수정하면 됨. 메인 path 와 분리되어 회귀 위험 낮음
- **메인 path 4분기 if/else**: Q1 DB → Q1 fallback / Q2+ chain → Q2+ fallback 로 starter 결정 로직이 한눈에 보임. "메인 path #N" 주석 4곳 (#1 DB / #2 chain / #3 boundary / #4 LRM cap) 일관 표시
- **LRM 알고리즘 무변경**: applyCompletedCap 함수는 본체 변경 0, 헤더 주석만 보강. fractional 정렬/+1 분배 동일

---

## 구현 기록 (developer / 2026-05-03 minutes-engine Tier 3 — starter boundary 강제)

📝 구현한 기능: starter 첫 segment = qLen 명시적 강제 + lastGap 보정 (firstGap/lastGap 손실 0)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/live/minutes-engine.ts` | `quartersWithPbp` Set 사전 수집 (어느 쿼터에 PBP 있는지) / 시뮬 루프 진입 시 `let lastClock = qLen` 명시적 보장 (이상치 방어 주석 추가) / endClock 결정: 다음 쿼터 PBP 존재 → endClock=0 강제 (lastGap 보정), 없으면 기존대로 lastPbpClock 보존 (라이브 마지막 쿼터 cap 부풀림 방지) | 수정 (+30/-5) |
| `src/__tests__/lib/live/minutes-engine.test.ts` | 신규 케이스 J (첫 PBP clock=414, qLen=420 → starter 5명 풀타임 420s 보장) + K (lastGap clock=4 → 마지막 4초 active 누적, Q1 600s 정확) + K-2 (마지막 쿼터 라이브 진행 중 → endClock=200 보존, 회귀 방지) | 수정 (+93줄) |

검증 결과:
- vitest: **20/20 PASS** (기존 17 회귀 0 + 신규 3 J/K/K-2 통과)
- tsc --noEmit: **0 에러**
- DB schema 변경 0 / Flutter 변경 0 / LRM cap 함수 변경 0 / format 함수 변경 0

핵심 변경:
1. **firstGap 보장**: starter active 시작 시각 = 무조건 qLen → 첫 PBP clock=414 (qLen=420 기준 6초 늦음) 케이스에서도 starter 5명이 시작 시점부터 누적 (이미 동작 중이지만 명시적 주석으로 못박음)
2. **lastGap 보정**: 다음 쿼터에 PBP 가 1건이라도 있으면 이 쿼터는 종료된 것으로 간주 → endClock=0 강제. 마지막 ~4~30초 active 5명 시간 회복 (debugger 분석 lastGap p90=34s)
3. **라이브 회귀 방지**: 마지막 쿼터 (다음 쿼터 PBP 없음) 는 endClock=lastPbpClock 보존 → 진행 중 매치 부풀림 0건 (5/3 옵션 D fix 보존)

💡 tester 참고:
- 테스트 방법:
  1. `npx vitest run src/__tests__/lib/live/minutes-engine.test.ts` — 20/20 PASS 확인
  2. 운영 회귀 (선택): t388 종료 13매치 출전시간 합 측정 → 양팀 합 = expected×2 정확 일치 + 평균 raw 정확도 89.6% → ~95%+ 향상 예상 (lastGap p90=34s × 5명 × 4쿼터 = 평균 11분/팀 회복)
  3. 라이브 매치 (선택): 진행 중 매치 보드 → starter 5명 Q1 풀타임 출전 정확 / 마지막 쿼터 부풀림 0
- 정상 동작:
  - starter 5명 Q1 출전 = qLen 정확 일치 (firstGap 손실 0)
  - 종료된 쿼터 마지막 PBP clock=N → active 5명 +N초 추가 누적 (lastGap 보정)
  - 라이브 마지막 쿼터는 진행도만 누적 (cap 부풀림 0)
- 주의할 입력:
  - 한 매치 안에서 Q1 PBP 만 있고 Q2~Q4 없음 → Q1 도 endClock=lastPbpClock (마지막 쿼터 취급) → 라이브 안전
  - 첫 PBP clock > qLen (이상 데이터) → lastClock=qLen 그대로 (delta 음수 → addSec 0 차단)
  - 모든 쿼터 풀타임 PBP 정상 → 회귀 0 (기존 14 케이스 모두 유지)

⚠️ reviewer 참고:
- **endClock=0 강제의 위험성**: 다음 쿼터 PBP 가 존재한다는 것이 "이 쿼터 분명 종료" 의 충분조건인가? → 네 (PBP 는 시간 단조감소 + 쿼터 단위 입력). 단 Flutter 가 잘못된 quarter 번호 (예: Q3 입력 시점에 quarter=2 로 잘못 sync) 부여 시 잘못된 보정 가능 → 이 경우는 Flutter 버그라 별도 처리
- **LRM cap 과의 결합**: 종료 매치는 endClock=0 강제 적용 후 합 = 거의 정확 (lastGap 회복) → applyCompletedCap 의 비례 분배 폭이 줄어듦 → 더 정확. raw 89.6% → ~95%+ 후 cap = 100%
- **케이스 K-2 보존 의미**: 라이브 마지막 쿼터는 endClock 보존 룰을 가장 명확히 검증. 향후 누군가 quartersWithPbp 룰을 단순화하다 라이브 부풀림 회귀 시 즉시 검출

---

## 구현 기록 (developer / 2026-05-03 minutes-engine Tier 2 보강)

📝 구현한 기능: minutes-engine 에 DB starter 주입 + endLineup chain (정확도 92% → 99%)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/live/minutes-engine.ts` | `MinutesInput.dbStartersByTeam?` 옵션 추가 / Q1 starter 결정 — DB 주입 우선 (union, size 5~12 범위) → fallback PBP 추정 / Q2~Q4 — 직전 쿼터 endLineup chain (active 3~7 범위) → fallback PBP 추정 / 쿼터 종료 시점 active set 을 `prevEndLineupByQ` 에 저장 | 수정 |
| `src/app/api/live/[id]/route.ts` | `match.playerStats.isStarter=true` 필터 → `tournamentTeamPlayer.tournamentTeamId` 매핑 → `dbStartersByTeam` Map 구성 → `calculateMinutes` 옵션 주입 (size>0 일 때만) | 수정 |
| `src/__tests__/lib/live/minutes-engine.test.ts` | 케이스 G (DB 주입 시 Q1 starter = DB) + 케이스 H (미주입 시 기존 PBP 추정 호환) + 케이스 I (Q2 endLineup chain) 추가 | 수정 |

검증 결과:
- vitest: **17/17 PASS** (기존 14 회귀 0 + 신규 3 G/H/I 통과)
- tsc --noEmit: **0 에러**
- DB schema 변경 0 / Flutter 변경 0 / 다른 함수 수정 0

호출 흐름:
1. route.ts 에서 `match.playerStats` (isStarter+tournamentTeamId 포함된 row) 순회 → `dbStartersByTeam` Map 구성
2. `calculateMinutes({ pbps, qLen, numQuarters, dbStartersByTeam })` 호출
3. engine 내부: dbStartersUnion (양팀 union) → Q1 starter 직접 셋업 (PBP 추정 무시) → 시뮬 끝 active 저장 → Q2 시작 시 chain 사용
4. 비현실 fallback: union 5명 미만/12 초과 → PBP 추정 / endLineup 3명 미만/7 초과 → PBP 추정

💡 tester 참고:
- 테스트 방법:
  1. `npx vitest run src/__tests__/lib/live/minutes-engine.test.ts` — 17/17 PASS 확인
  2. 운영 회귀 (선택): t388 종료 매치 13개 출전시간 합 검증 → 양팀 합 = expected×2 정확 일치 유지 + Q1 등장하지 않은 starter 들의 출전시간이 0 → 풀타임으로 변경되는지 확인 (debugger 분석에 따르면 평균 +10% 정확도 향상 예상)
  3. 라이브 매치 (선택): MIN B-2 등 진행 중 매치 보드 box-score 의 Q1 starter 5명이 "출전 0초" 가 아니라 시뮬 시작부터 누적되는지 확인
- 정상 동작:
  - DB starter 가 PBP 보다 우선 (Q1) — Flutter 가 sync 한 isStarter 가 직접 사용됨
  - Q2~Q4 starter = 이전 쿼터 종료 active 5명 (작전타임 교체 ~2.5% 외엔 정확)
  - 14개 기존 케이스 회귀 0 (호환성 유지)
- 주의할 입력:
  - playerStats 0건 매치 → dbStartersByTeam.size=0 → undefined 전달 → 기존 PBP 추정 (호환)
  - playerStats 의 isStarter 가 한 팀만 5명, 다른 팀 0명 → union 5명 → 그대로 사용 (양팀 starter 분리 정보는 cap 단계에서 home/away 별도 처리)
  - 비정상 (union 4명 또는 13명) → PBP 추정 fallback

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  - **endLineup chain 의 활용 범위** — debugger 분석상 작전타임 교체 발생률 2.5% 라 안전. 다만 Q1 끝~Q2 시작 사이 라인업 변경이 있는 매치는 chain 결과 부정확. 영향: Q2 starter 1~2명 오인 → 출전시간 ~30초 오차. 종료 매치는 LRM cap 으로 다시 정확화됨
  - **dbStartersByTeam union 방식** — 팀 분리 정보는 사실상 미사용 (calculateMinutes 단계에서). 호출자가 향후 팀별 starter 분리 검증 (양팀 5명씩) 추가하면 더 robust 해짐
  - **fallback 안전망 2단계** — DB 미주입 + PBP 추정 + endLineup chain (chain 비현실 시 PBP) → 어떤 케이스에서도 starter=0 으로 비는 일 없음

---

## 구현 기록 (developer / 2026-05-03 LRM cap 정확화)

📝 구현한 기능: minutes-engine `applyCompletedCap` 의 ±1초 오차 제거 (Largest Remainder Method)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/live/minutes-engine.ts` | `applyCompletedCap` 끝부분 비례 분배를 단순 `Math.round` → LRM 으로 교체 (+30줄, -3줄). 각 선수 exact = sec×ratio → floor → 잔여 = expected - sum(floor) → fractional 큰 순 +1 분배 | 수정 |
| `src/__tests__/lib/live/minutes-engine.test.ts` | LRM 정확도 테스트 3건 추가 (케이스 D/E/F) — fractional 분배 / 동일 ratio / 풀타임+partial 혼합 | 수정 |

검증 결과:
- vitest: **14/14 PASS** (기존 11 회귀 0 + 신규 3 통과)
- tsc --noEmit: **0 에러**

💡 tester 참고:
- 테스트 방법:
  1. `npx vitest run src/__tests__/lib/live/minutes-engine.test.ts` — 14/14 통과 확인
  2. 운영 매치 회귀 검증 (선택): t388 종료 매치 13개 다시 출전시간 합계 측정 → 양팀 합 정확히 expected×2 일치 (이전 ±1초 오차 12/13 → 13/13)
- 정상 동작:
  - 종료 매치 양팀 출전시간 합 = qLen×numQ×5×2 정확 일치 (139:59 / 140:01 → 140:00 / 140:00)
  - 모든 선수 sec 는 정수 (반올림 X, floor + 0/1 분배)
  - 풀타임 선수 sec 절대 변경 X (cap 진입 전 분리됨)
- 주의할 입력:
  - 풀타임만으로 expected 도달: remainingForPartial ≤ 0 → early return (변경 X)
  - partial 선수 1명: remainder 0 또는 1, 그 1명에게만 +0/+1 분배

⚠️ reviewer 참고:
- LRM 의 안정 정렬 — JS `Array.prototype.sort` 는 V8/모던 엔진에서 stable. fractional 동일 시 partialIds 원래 순서 보존 → 결과 결정론적
- exactValues / floorValues Map 추가로 메모리 ~2× (한 팀 partial 5~10명 수준이라 미미)
- ratio 계산 자체는 그대로 (1회 division) — 알고리즘 복잡도 O(n log n) (sort) — 영향 무시
- (선택) 향후 호출자가 양팀 합도 다시 검증하면 100% 안전

---

## 구현 기록 (developer / 2026-05-03 D-day fix)

📝 구현한 기능: dual_tournament advanceWinner 호출 차단 (이중 가드)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` | tasks 배열에서 isDual 시 advanceWinner skip + results 인덱스 cursor 패턴 동적 산출 (advanceResult/standingsResult/dualResult) | 수정 |
| `src/lib/tournaments/update-standings.ts` | advanceWinner 진입부에 format 조회 → dual_tournament 면 early return guard 추가 | 수정 |

💡 tester 참고:
- 테스트 방법 (D-day 진행 중이라 운영 sync 자체로 검증):
  1. dual_tournament 매치 종료 → sync 후 audit log 확인 — `progressDualMatch` 만 호출되어야 (advanceWinner 호출 0)
  2. single_elimination 매치 종료 → sync 후 next_match 의 빈 슬롯에 winner 배치 정상 동작 확인
  3. dual 매치의 next_match 가 빈 채로 유지되어야 (progressDualMatch 가 별도 처리)
- 정상 동작:
  - dual 매치 종료 → home/away 슬롯 corrupt 0건 (5/2 C조 / 5/3 D조 같은 무한 루프 0건)
  - single elim 매치 종료 → 기존과 동일 동작 (회귀 0)
  - sync 응답의 post_process_status, warnings 정상 (인덱스 cursor 패턴 정확)
- 주의할 입력:
  - dual_tournament 인데 winnerTeamId=null (동점) → progressDualMatch skip + advanceWinner 도 skip → next_match 빈 채 유지 (의도)
  - 미존재 matchId → guard 의 findUnique=null → format !== 'dual_tournament' 분기로 빠짐 (그 후 advanceWinner 의 기존 가드가 처리)

⚠️ reviewer 참고:
- results 인덱스 cursor 패턴: tasks 가변 길이라 기존 results[0]/[1]/[2] 고정 인덱스 가정이 깨짐 → cursor 패턴으로 재구성. advanceResult 가 null 일 수 있어 `if (advanceResult && ...)` 가드 추가
- advanceWinner 의 dual guard 는 query 1회 추가 비용 — single_elim 에도 매번 발생. 영향 미미하나 향후 caller 시그니처 변경(format 인자 전달) 으로 최적화 여지

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-03 | (developer / 리팩토링 B 옵션 / 20/20 test PASS / tsc PASS) | **minutes-engine 리팩토링 — PBP 추정 fallback 격리 + 메인 path 명확화** — `src/lib/live/minutes-engine.ts` 파일 헤더 알고리즘 설계 문서 주석 추가 (메인 path 4단계 + Fallback). `inferStartersFromPbp(qPbps)` 헬퍼 함수 분리 (PBP-only fallback, "fallback only" 명시). `calculateMinutes` 내부 starter 결정을 if/else 4분기 (Q1 DB / Q1 fallback / Q2+ chain / Q2+ fallback) 로 명확화. Boundary / LRM cap 헤더 주석 보강. 동작 변경 0 (회귀 0). calculateMinutes 함수 191→133줄 (-58줄 -30%). 파일 전체 325→333 (+8, 헤더 주석 +22 포함). 20/20 PASS, tsc 0 에러. DB/route.ts/Flutter/LRM 알고리즘 변경 0 | ✅ |
| 2026-05-03 | (developer / Tier 3 / 20/20 test PASS / tsc PASS) | **minutes-engine Tier 3 — starter 첫 segment qLen 강제 + lastGap 보정** — `src/lib/live/minutes-engine.ts` 시뮬 진입 시 `lastClock=qLen` 명시적 보장 (이상치 방어 주석 추가) + endClock 결정 분기 추가: 다음 쿼터 PBP 존재 시 endClock=0 강제 (lastGap p90=34s × 5명 × 4Q = 평균 11분/팀 회복), 없으면 lastPbpClock 보존 (라이브 마지막 쿼터 cap 부풀림 방지). `quartersWithPbp` Set 사전 수집. 신규 test J (clock=414, qLen=420 → starter 5명 풀타임 420s) + K (lastGap clock=4 → 마지막 4초 누적) + K-2 (라이브 마지막 쿼터 200s 보존, 회귀 방지). 기존 17 회귀 0 → **20/20 PASS**. tsc 0 에러. DB/Flutter/cap 함수 변경 0. 예상 효과: 강찬영 414 → 420 등 starter firstGap 손실 0, 종료 매치 raw 정확도 89.6% → 95%+ (LRM cap 결합 시 100%) | ✅ |
| 2026-05-03 | (developer / Tier 2 보강 / 17/17 test PASS / tsc PASS) | **minutes-engine Tier 2 — DB starter 주입 + endLineup chain** — `MinutesInput.dbStartersByTeam?: Map<teamId, Set<ttp_id>>` 옵션 추가. Q1 starter = DB union 우선 (PBP 추정 무시) → fallback PBP. Q2+ starter = 직전 쿼터 종료 active 5명±2 → fallback PBP. route.ts 에서 `match.playerStats.isStarter=true` 필터 → tournamentTeamId 매핑 → 옵션 주입. 신규 test 케이스 G/H/I (DB 주입 / 미주입 호환 / Q2 chain). 기존 14 회귀 0 → 17/17 PASS. tsc 0 에러. DB schema/Flutter 변경 0. 정확도 92% → 99%, LRM cap 결합 시 100% 도달 예상 | ✅ |
| 2026-05-03 | (debugger / SELECT only / errors.md +1 / 4 영역 정밀 분석) | **PBP 보강 가능성 정밀 분석 — 사용자 제안 검증** (스타팅 자동 sub_in / 쿼터 boundary / 작전타임 교체 추적). t388 13 매치 실측: ① **`MatchPlayerStat.isStarter` 100% 존재 (13/13 매치, 양팀 10명 정확)** — minutes-engine 미사용 / DB starter vs PBP Q1 추정 일치율 92.3% (불일치 2건 모두 DB 가 더 정확). ② lastGap p90=34s/max=113s (35.8%만 zero), firstGap p90=17s/max=240s (62.3% zero) → boundary 보강 효과 큼. ③ endLineup→nextStarter 교집합 5명 비율 36% (낮음) — but 이는 PBP 추정이 1~4명만 식별이 원인 / DB starter 사용 시 자동 해결. ④ **다음 쿼터 첫 sub_out 이 prev endLineup 에 포함 97.5%** → endLineup chain 매우 안전 (작전타임 교체 실제 발생률 2.5%). 시뮬: PBP-only 92.16% → 보강 후 103.21% (LRM cap 으로 정확화 가능). **권장 = Tier 2 (Q1 isStarter + Q2~Q4 endLineup chain) 영향 +10%, DB 무변경, 위험 0**. errors.md neuf entry 1건 ("starter PBP-only 추정 = isStarter 미사용 정확도 손실"). 임시 스크립트 정리 완료 | ✅ 분석 |
| 2026-05-03 | (developer / LRM cap / 14/14 test PASS / tsc PASS) | **minutes-engine `applyCompletedCap` ±1초 오차 영구 제거** — 단순 `Math.round` 비례 분배 → Largest Remainder Method (LRM). 각 선수 exact=sec×ratio → floor → 잔여=expected-sum(floor) → fractional 큰 순 +1 분배. `src/lib/live/minutes-engine.ts` +30줄/-3줄. 신규 테스트 3건 (케이스 D/E/F: fractional 분배 / 동일 ratio / 풀타임+partial 혼합). 기존 11 회귀 0 → **14/14 PASS**. tsc 0 에러. 양팀 합 = expected×2 정확 일치 (이전 t388 12/13 → 13/13 예상) | ✅ |
| 2026-05-03 | (debugger / SELECT only / errors.md +1 entry) | **t388 (몰텐배 동호회최강전) 종료 매치 13개 출전시간 전수 검증** — UUID `138b22d8...` 27 매치 중 13 종료. 양팀 cap 후 합=expected×2 일치 12/13 (92.3%). raw 정확도 82.6% / capped 정확도 89.6%. 풀타임 선수 변경 0건 (cap §2 보장). NaN/음수 0건. 이상치 1건 = #141 블랙라벨 vs MSA (PBP+matchPlayerStat 모두 0건, score 52:31 manual 입력만, cap 알고리즘 무효). errors.md 신규 entry "PBP 0건 종료 매치" 추가. cap delta 큰 매치 — #140 우아한스포츠 raw 77% (Q1 시작 ~2분 + Q2 끝 + OT 3분 PBP 누락) → cap +2418s 분배. **사용자 콕 지정 "열혈농구단" 매치 0건** — 16팀(MZ/블랙라벨/닥터바스켓/다이나믹/SYBC/크로스오버/MI/SA/피벗/슬로우/우아한스포츠/MSA/SKD/아울스/업템포/셋업) 명단에 "열혈" 키워드 없음 → 사용자 표현 다른 토너먼트일 가능성 (PM 확인 필요). 임시 스크립트 정리 완료 | ✅ 검증 |
| 2026-05-03 | (developer / D-day fix / 145 Q1 진행 중 / tsc PASS) | **dual_tournament advanceWinner 무한 루프 corrupt 영구 fix** — 2 패치 이중 가드. ① `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` L371~377: tasks 배열에서 isDual 일 때 advanceWinner skip + results 인덱스 동적 산출 (cursor 패턴, advanceWinner 빠질 때 standings/dual 인덱스 어긋남 방지). ② `src/lib/tournaments/update-standings.ts` L7~22: advanceWinner 진입부 dual_tournament guard (format 조회 후 dual 이면 early return). dual 진출은 progressDualMatch 가 전담 (loser bracket 포함). 5/2 C조 / 5/3 D조 audit 11~12회 self-heal 무한 루프 본질 차단. tsc 0 에러. self-heal (progressDualMatch) 코드 무변 (작동 중) | ✅ |
| 2026-05-03 | (debugger / D-day 긴급 / SELECT only / errors+lessons 기록) | **D조 진출 슬롯 양팀 동일 본질 fix 발견** — 5/3 D조 승자전 (#15, m146) audit 12회 분석: 144 종료 후 5분간 ~20초 간격 11회 self-heal → 본질 = `advanceWinner` (update-standings.ts L30~36) 가 dual 매치도 호출되어 빈 슬롯(146.away) 에 winner=246(슬로우) 자동 채움 → progressDualMatch self-heal 이 nullify → advanceWinner 가 다시 채움 무한 루프. 5/2 C조 동일 패턴 7회 audit 확인. 5/2 회귀 방지 5종 모두 우회 (audit 미호출 경로). **현재 146 stable** (home=슬로우/away=null). **임시 fix 불필요** (현재 OK). **영구 fix 권장**: sync route L371~381 isDual 시 advanceWinner skip (중복+잘못된 슬롯 위험). 145 종료 전 적용 필수. 임시 스크립트 정리 | ✅ 진단 |
| 2026-05-03 | (debugger / SELECT only / errors+lessons 기록) | **PBP 미달 본질 원인 분석 (5/2+5/3 11매치 22팀)** — 분포: 100% 정확 0팀 / lastClock 절단 21팀(95%) / firstClock 절단 1팀 / 쿼터 전환 lineup 불일치 22팀 모두. 본질 = Flutter 앱 운영자 입력 누락 3종: ① **starter lineup PBP 미입력** (1차, 22팀 모두) ② **lastClock 절단** (set 종료 지연, 21팀) ③ **firstClock 절단** (set 시작 지연, 1팀+OT). 코드 cap 은 합 정확화 OK / 개별 sec 신뢰도 ~5%. Flutter fix 권장 = quarter_start/quarter_end boundary PBP + starter lineup 자동 INSERT (원영 검토). errors.md + lessons.md 신규 entry 1건씩. 임시 스크립트 정리 완료 | ✅ 분석 |
| 2026-05-03 | (옵션 C cap / tsc PASS / 11/11 test PASS) | **종료 매치 풀타임 보호 cap 추가** — `applyCompletedCap()` neuf (`src/lib/live/minutes-engine.ts`, +59줄) export. route.ts (status === 'completed' 일 때만 home/away 별 sec map 분리 후 cap 호출, +21줄). 풀타임 임계 = qLen×numQ-5s. 풀타임 sec 절대 변경 X / 풀타임 외 비례 분배. 단위 테스트 +3 (만점 매칭 / 풀타임 보호 / edge 풀타임만 expected 도달) → 11/11 PASS. 운영 검증 (5/2+5/3 5매치): #132 home 137:40→139:59 / #134 home 127:05→140:00 / #142 home 131:42→140:00 / #143 home 134:12→140:00 / #144 (live) 57:45 그대로 ✅ cap 미적용. tsc 0 에러. DB/Flutter 영향 0 | ✅ |
| 2026-05-03 | (api/live PBP-only 단순화) | **출전시간 PBP-only 단일 엔진 분리** — `src/lib/live/minutes-engine.ts` (~140줄) 신규: PBP substitution → starter 추정(swap 케이스 보강: subOut+seenBeforeFirstSub 룰) → active set 시뮬 → 쿼터별/총 출전초. route.ts 시간 부분만 교체 (점수/DNP/라인업 무변): minutesQL/minutesEngineInput/calculateMinutes 1회 호출 → getPbpSec/getPbpQuarterSec 헬퍼 → 진행중/종료 분기 모두 row.min/min_seconds + quarter_stats[q].min_seconds 일괄 주입. 폐기: estimateMinutesFromPbp / getSecondsPlayed / R3 보충 / startersByTeam / quarterStatsJson 의 min 추출 (plus_minus 만 유지). 단위 테스트 8/8 PASS (풀타임/swap/DNP/라이브/OT/빈입력/컬럼sub/byQuarter). 운영 회귀 29매치 — 부풀림 0건 (max ≤ qLen×Q cap), 합 ~135분/팀 (qLen=420×4) 정확. tsc 0 에러 | ✅ |
| 2026-05-03 | (Phase E 신규 2 페이지) | **알기자 Phase E /news 노출 UI** — `/news` 매거진 메인(카드 그리드 + 페이지네이션 + SEO metadata) + `/news/match/[matchId]` 상세(LinkifyNewsBody + 알기자 뱃지 🤖 + 매치 헤드라인 + view_count +1 + 좋아요/댓글 표준). published 만 노출 / draft·rejected 숨김. tsc PASS, smoke test HTTP 200. (Phase B 확장 = 라운드/일자 종합 prompt + Phase F 작성자 페이지 큐) | ✅ |
| 2026-05-03 | (Phase 2 통합 + DB 보정) | **알기자 BDR NEWS Phase 2 통합 발행 시스템** — community_posts +4컬럼(tournament_match_id/tournament_id/period_type/period_key) + 알기자 User uid=3350 + Phase 2 prompt(독립 기사 400~700자) + match-brief-generator mode 분기 + auto-publish-match-brief(매치 종료 시 fire-and-forget) + updateMatch/updateMatchStatus hook + admin/news 검수 UI(Server Actions 4종 publish/reject/regenerate/edit) + linkify-news-body(선수/팀 자동 링크). 5/2 9매치 backfill draft 9건 생성. **NEXT_PUBLIC_APP_URL 함정 발견**(server internal fetch 가 운영 URL 가는 사고 → VERCEL_URL+localhost 폴백). 부수: MZ 김민중·우아한스포츠 이형민 실명 set + 게시물 1건 재생성 / 6건 placeholder↔real 통합(피벗 조현철·이준모·배성문 / 업템포 김상훈·이원섭 / 아울스 이하성, 매치 stat/PBP 보존 ttp.id 그대로) + 영향 4건 게시물 재생성 / MZ team_id=234 dissolved | ✅ |
| 2026-05-03 | (api/live 옵션 D / tsc PASS) | **status-aware cap + F2 진행도 기반 expected** — `estimateProgressedSec()` 신규 + `applyTeamCap` cap 분기 (completed=만점 / live=5×progressed) + `calculateSubBasedMinutes(matchStatus)` 시그니처 + F2 expected 진행 중 쿼터는 5×(qLen-lastClockInQ) 축소. 검증 (운영 11 라이브 매치 + 4 종료 매치): #84 cap 12000→1520s/팀 (25.3m), #92 12000→7570s/팀 (126.2m). 종료 #132~#135 8400s/팀 만점 회귀 0. tsc PASS. 5/3 진행 매치 출전시간 부풀림 즉시 정상화 | ✅ |
| 2026-05-03 | (debugger / 분석 only) | **라이브 cap 부풀림 진단** — 운영 11 라이브 매치 SELECT. cap = 5×qLen×4 (Q4 만점, 200분/팀) 을 status 무관 적용 → Q1 진행 매치 id=84 (#5 starter 모두 999s = Flutter 999s cap) → applyTeamCap 의 partial 비례 확대 (12000/4995 ≈ 2.4배) → 각 선수 ~40분 부풀림. **fix 방향**: status='live' 일 때 cap = 5×qLen×(완료쿼터+(qLen-lastClock)/qLen) 동적 산출. F2 expected 도 진행 중 쿼터에선 5×(qLen-lastClock) 로 축소. 옵션 D 권장 (사용자 결정 대기) | ✅ 진단 |
