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

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-03 | (api/live 옵션 D / tsc PASS) | **status-aware cap + F2 진행도 기반 expected** — `estimateProgressedSec()` 신규 + `applyTeamCap` cap 분기 (completed=만점 / live=5×progressed) + `calculateSubBasedMinutes(matchStatus)` 시그니처 + F2 expected 진행 중 쿼터는 5×(qLen-lastClockInQ) 축소. 검증 (운영 11 라이브 매치 + 4 종료 매치): #84 cap 12000→1520s/팀 (25.3m), #92 12000→7570s/팀 (126.2m). 종료 #132~#135 8400s/팀 만점 회귀 0. tsc PASS. 5/3 진행 매치 출전시간 부풀림 즉시 정상화 | ✅ |
| 2026-05-03 | (debugger / 분석 only) | **라이브 cap 부풀림 진단** — 운영 11 라이브 매치 SELECT. cap = 5×qLen×4 (Q4 만점, 200분/팀) 을 status 무관 적용 → Q1 진행 매치 id=84 (#5 starter 모두 999s = Flutter 999s cap) → applyTeamCap 의 partial 비례 확대 (12000/4995 ≈ 2.4배) → 각 선수 ~40분 부풀림. **fix 방향**: status='live' 일 때 cap = 5×qLen×(완료쿼터+(qLen-lastClock)/qLen) 동적 산출. F2 expected 도 진행 중 쿼터에선 5×(qLen-lastClock) 로 축소. 옵션 D 권장 (사용자 결정 대기) | ✅ 진단 |
| 2026-05-02 | (developer / tsc PASS) | **mergeTempMember 4-way 매칭 강화** — `realName = nickname \|\| name` 단일값 → `candidates[]` 양쪽값 수집 후 placeholder 의 nickname/name 컬럼과 교차(4가지 조합) OR 매칭. placeholder 가드 추가 (provider='placeholder' OR email LIKE 'temp_%') — 동명이인 미로그인 실사용자 오통합 방지. 백주익 (real nick=hifabric/name=백주익 ↔ ph nick=백주익) 케이스 매칭 가능 | ✅ |
| 2026-05-03 | (lib 4파일+테스트) | **알기자 brief Phase 1 정책 재설계 + 데이터 풀 확장 + ~다 통일** — 점프볼 단신 패턴 시도(평균 350자 폭증) → Phase 1 컨텍스트(매치 페이지 안 흐름·영웅 섹션) 재정의(평균 188자 적중). validate-brief 점수 검증 제거(쿼터/진행 점수 false positive 차단), 길이 400→350. 데이터 풀 확장: 양 팀 통계(야투/3점/리바/어시/스틸/블락/턴오버) + 모든 선수 stat + 더블더블/트리플더블 자동 검출 + 리바/어시/스틸/블락/+/-/3점 1위 자동 추출. 8건 모두 다른 관점(수비/3점폭격/턴오버/+/-/더블더블/야투율 비교) 작성. 어조 ~다 통일(~습니다 금지). 데이터 정확 (전인규 3점 11개 / 이영교 동명이인 닥터바스켓 OK 사용자 확인) | ✅ |
| 2026-05-02 | (developer / tsc PASS) | **일정 탭 TBD → slotLabel 표시** — public-schedule API settings JSON 추출(homeSlotLabel/awaySlotLabel) + tournament-tabs 매핑 + schedule-timeline interface 확장 + italic muted 스타일 (DualMatchCard 동일 패턴). 3 파일 / 팀 확정 매치 표시 변경 0 / DB 변경 0 | ✅ |
| 2026-05-03 | (검증 only) | **5/2 종료 9매치 전수 재조사 (debugger)** — DB 12건 발견 (몰텐배 8 ✅ + 열혈 4건 / 단 ended_at=5/2 기준 1건=#121만 사용자 진술 일치). G4 적용 후 9매치 모두 100.0% 정확 — 몰텐배 8건 280.0m/280.0m (qLen=420), 열혈 #121 400.0m/400.0m (qLen=600). 풀타임/DNP 산출 정상. 잔여 fix 필요 케이스 0건. 임시 스크립트 정리 완료 | ✅ |
| 2026-05-03 | (api/live G4 옵션 B) | **applyTeamCap trustedTotal-only fallback 추가** — variableTotal=0 케이스(#133 sub_in/sub_out 명시 매치) 처리. 풀타임 선수 (trustedSec >= qLen×4 - 5s) 절대 보호 + partial trusted 만 비례 확대. 검증: 4매치(#132~#135) 모두 280m 100% 정확 + #134 풀타임 (조현철/강동진) 1680s 그대로. tsc PASS | ✅ |
| 2026-05-03 | (DB 트랜잭션 3 phase) | **블랙라벨 정리 + 잔여 가입대기 정리 (16건 처리)** — Phase1 approveJoinRequests 14건 (블랙라벨 7 reject + 업템포 3 / 피벗 2 / 아울스 1 / MZ 1 = 7 approve_no_jersey) / Phase2 권도윤 3168→3318 통합 (tt+tm+captainId+req+merged 5단계) / Phase3 이삭 3326→3171 통합 (4단계). 블랙라벨 pending 9→0 ✅, tt_players 21 유지 ✅. status=merged +2 (총 11명) | ✅ |
| 2026-05-03 | (lib 신규+DB) | **자동 approve 함수 추출 + 슬로우 처리** — `src/lib/teams/approve-join-requests.ts` 신규 (130줄, 3 액션 트랜잭션 멱등). 슬로우 가입신청 8건 일괄 처리. 출전 8/8 ✅ + pending 0 ✅. 16팀 가입대기 39건 발견(스크래치패드 큐 #1) | ✅ |
| 2026-05-03 | (DB 트랜잭션) | **MSA 5명 INSERT** (5/3 11:00 경기 대비) — 왕준일 (uid=3108 기존) tt_players만 1건 + placeholder 4명(장동영/김승한/조우성/김병윤) 3단계 트랜잭션. 출전 17/17 ✅ + 마스터 18/18 ✅. placeholder 부채 89→93 | ✅ |
| 2026-05-03 | (DB 트랜잭션) | **블랙라벨 11명 placeholder INSERT** (5/3 11:00 경기 대비) — User+TeamMember+tt_players 3단계 트랜잭션 (id 3320~3330 / 2636~2646 / 2786~2796). 출전 명단 21/21 ✅ + 마스터 21/21 ✅. 사용자 명단 검증 100% 일치. 매치 코드 자동생성 작업은 복잡도 사유 다음 세션 이연 (4 결정 대기). placeholder User 부채 78→89명 발견 (scratchpad outdated 갱신) | ✅ |
