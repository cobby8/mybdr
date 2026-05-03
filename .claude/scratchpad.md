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
| 2026-05-03 | (developer / D-day fix / 145 Q1 진행 중 / tsc PASS) | **dual_tournament advanceWinner 무한 루프 corrupt 영구 fix** — 2 패치 이중 가드. ① `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` L371~377: tasks 배열에서 isDual 일 때 advanceWinner skip + results 인덱스 동적 산출 (cursor 패턴, advanceWinner 빠질 때 standings/dual 인덱스 어긋남 방지). ② `src/lib/tournaments/update-standings.ts` L7~22: advanceWinner 진입부 dual_tournament guard (format 조회 후 dual 이면 early return). dual 진출은 progressDualMatch 가 전담 (loser bracket 포함). 5/2 C조 / 5/3 D조 audit 11~12회 self-heal 무한 루프 본질 차단. tsc 0 에러. self-heal (progressDualMatch) 코드 무변 (작동 중) | ✅ |
| 2026-05-03 | (debugger / D-day 긴급 / SELECT only / errors+lessons 기록) | **D조 진출 슬롯 양팀 동일 본질 fix 발견** — 5/3 D조 승자전 (#15, m146) audit 12회 분석: 144 종료 후 5분간 ~20초 간격 11회 self-heal → 본질 = `advanceWinner` (update-standings.ts L30~36) 가 dual 매치도 호출되어 빈 슬롯(146.away) 에 winner=246(슬로우) 자동 채움 → progressDualMatch self-heal 이 nullify → advanceWinner 가 다시 채움 무한 루프. 5/2 C조 동일 패턴 7회 audit 확인. 5/2 회귀 방지 5종 모두 우회 (audit 미호출 경로). **현재 146 stable** (home=슬로우/away=null). **임시 fix 불필요** (현재 OK). **영구 fix 권장**: sync route L371~381 isDual 시 advanceWinner skip (중복+잘못된 슬롯 위험). 145 종료 전 적용 필수. 임시 스크립트 정리 | ✅ 진단 |
| 2026-05-03 | (debugger / SELECT only / errors+lessons 기록) | **PBP 미달 본질 원인 분석 (5/2+5/3 11매치 22팀)** — 분포: 100% 정확 0팀 / lastClock 절단 21팀(95%) / firstClock 절단 1팀 / 쿼터 전환 lineup 불일치 22팀 모두. 본질 = Flutter 앱 운영자 입력 누락 3종: ① **starter lineup PBP 미입력** (1차, 22팀 모두) ② **lastClock 절단** (set 종료 지연, 21팀) ③ **firstClock 절단** (set 시작 지연, 1팀+OT). 코드 cap 은 합 정확화 OK / 개별 sec 신뢰도 ~5%. Flutter fix 권장 = quarter_start/quarter_end boundary PBP + starter lineup 자동 INSERT (원영 검토). errors.md + lessons.md 신규 entry 1건씩. 임시 스크립트 정리 완료 | ✅ 분석 |
| 2026-05-03 | (옵션 C cap / tsc PASS / 11/11 test PASS) | **종료 매치 풀타임 보호 cap 추가** — `applyCompletedCap()` neuf (`src/lib/live/minutes-engine.ts`, +59줄) export. route.ts (status === 'completed' 일 때만 home/away 별 sec map 분리 후 cap 호출, +21줄). 풀타임 임계 = qLen×numQ-5s. 풀타임 sec 절대 변경 X / 풀타임 외 비례 분배. 단위 테스트 +3 (만점 매칭 / 풀타임 보호 / edge 풀타임만 expected 도달) → 11/11 PASS. 운영 검증 (5/2+5/3 5매치): #132 home 137:40→139:59 / #134 home 127:05→140:00 / #142 home 131:42→140:00 / #143 home 134:12→140:00 / #144 (live) 57:45 그대로 ✅ cap 미적용. tsc 0 에러. DB/Flutter 영향 0 | ✅ |
| 2026-05-03 | (api/live PBP-only 단순화) | **출전시간 PBP-only 단일 엔진 분리** — `src/lib/live/minutes-engine.ts` (~140줄) 신규: PBP substitution → starter 추정(swap 케이스 보강: subOut+seenBeforeFirstSub 룰) → active set 시뮬 → 쿼터별/총 출전초. route.ts 시간 부분만 교체 (점수/DNP/라인업 무변): minutesQL/minutesEngineInput/calculateMinutes 1회 호출 → getPbpSec/getPbpQuarterSec 헬퍼 → 진행중/종료 분기 모두 row.min/min_seconds + quarter_stats[q].min_seconds 일괄 주입. 폐기: estimateMinutesFromPbp / getSecondsPlayed / R3 보충 / startersByTeam / quarterStatsJson 의 min 추출 (plus_minus 만 유지). 단위 테스트 8/8 PASS (풀타임/swap/DNP/라이브/OT/빈입력/컬럼sub/byQuarter). 운영 회귀 29매치 — 부풀림 0건 (max ≤ qLen×Q cap), 합 ~135분/팀 (qLen=420×4) 정확. tsc 0 에러 | ✅ |
| 2026-05-03 | (Phase E 신규 2 페이지) | **알기자 Phase E /news 노출 UI** — `/news` 매거진 메인(카드 그리드 + 페이지네이션 + SEO metadata) + `/news/match/[matchId]` 상세(LinkifyNewsBody + 알기자 뱃지 🤖 + 매치 헤드라인 + view_count +1 + 좋아요/댓글 표준). published 만 노출 / draft·rejected 숨김. tsc PASS, smoke test HTTP 200. (Phase B 확장 = 라운드/일자 종합 prompt + Phase F 작성자 페이지 큐) | ✅ |
| 2026-05-03 | (Phase 2 통합 + DB 보정) | **알기자 BDR NEWS Phase 2 통합 발행 시스템** — community_posts +4컬럼(tournament_match_id/tournament_id/period_type/period_key) + 알기자 User uid=3350 + Phase 2 prompt(독립 기사 400~700자) + match-brief-generator mode 분기 + auto-publish-match-brief(매치 종료 시 fire-and-forget) + updateMatch/updateMatchStatus hook + admin/news 검수 UI(Server Actions 4종 publish/reject/regenerate/edit) + linkify-news-body(선수/팀 자동 링크). 5/2 9매치 backfill draft 9건 생성. **NEXT_PUBLIC_APP_URL 함정 발견**(server internal fetch 가 운영 URL 가는 사고 → VERCEL_URL+localhost 폴백). 부수: MZ 김민중·우아한스포츠 이형민 실명 set + 게시물 1건 재생성 / 6건 placeholder↔real 통합(피벗 조현철·이준모·배성문 / 업템포 김상훈·이원섭 / 아울스 이하성, 매치 stat/PBP 보존 ttp.id 그대로) + 영향 4건 게시물 재생성 / MZ team_id=234 dissolved | ✅ |
| 2026-05-03 | (api/live 옵션 D / tsc PASS) | **status-aware cap + F2 진행도 기반 expected** — `estimateProgressedSec()` 신규 + `applyTeamCap` cap 분기 (completed=만점 / live=5×progressed) + `calculateSubBasedMinutes(matchStatus)` 시그니처 + F2 expected 진행 중 쿼터는 5×(qLen-lastClockInQ) 축소. 검증 (운영 11 라이브 매치 + 4 종료 매치): #84 cap 12000→1520s/팀 (25.3m), #92 12000→7570s/팀 (126.2m). 종료 #132~#135 8400s/팀 만점 회귀 0. tsc PASS. 5/3 진행 매치 출전시간 부풀림 즉시 정상화 | ✅ |
| 2026-05-03 | (debugger / 분석 only) | **라이브 cap 부풀림 진단** — 운영 11 라이브 매치 SELECT. cap = 5×qLen×4 (Q4 만점, 200분/팀) 을 status 무관 적용 → Q1 진행 매치 id=84 (#5 starter 모두 999s = Flutter 999s cap) → applyTeamCap 의 partial 비례 확대 (12000/4995 ≈ 2.4배) → 각 선수 ~40분 부풀림. **fix 방향**: status='live' 일 때 cap = 5×qLen×(완료쿼터+(qLen-lastClock)/qLen) 동적 산출. F2 expected 도 진행 중 쿼터에선 5×(qLen-lastClock) 로 축소. 옵션 D 권장 (사용자 결정 대기) | ✅ 진단 |
| 2026-05-02 | (developer / tsc PASS) | **mergeTempMember 4-way 매칭 강화** — `realName = nickname \|\| name` 단일값 → `candidates[]` 양쪽값 수집 후 placeholder 의 nickname/name 컬럼과 교차(4가지 조합) OR 매칭. placeholder 가드 추가 (provider='placeholder' OR email LIKE 'temp_%') — 동명이인 미로그인 실사용자 오통합 방지. 백주익 (real nick=hifabric/name=백주익 ↔ ph nick=백주익) 케이스 매칭 가능 | ✅ |
| 2026-05-03 | (lib 4파일+테스트) | **알기자 brief Phase 1 정책 재설계 + 데이터 풀 확장 + ~다 통일** — 점프볼 단신 패턴 시도(평균 350자 폭증) → Phase 1 컨텍스트(매치 페이지 안 흐름·영웅 섹션) 재정의(평균 188자 적중). validate-brief 점수 검증 제거(쿼터/진행 점수 false positive 차단), 길이 400→350. 데이터 풀 확장: 양 팀 통계(야투/3점/리바/어시/스틸/블락/턴오버) + 모든 선수 stat + 더블더블/트리플더블 자동 검출 + 리바/어시/스틸/블락/+/-/3점 1위 자동 추출. 8건 모두 다른 관점(수비/3점폭격/턴오버/+/-/더블더블/야투율 비교) 작성. 어조 ~다 통일(~습니다 금지). 데이터 정확 (전인규 3점 11개 / 이영교 동명이인 닥터바스켓 OK 사용자 확인) | ✅ |
