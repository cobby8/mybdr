# 에러 및 함정 모음
<!-- 담당: debugger, tester | 최대 30항목 -->
<!-- 이 프로젝트에서 반복되는 에러 패턴, 함정, 주의사항을 기록 -->

### [2026-05-03] minutes-engine 의 starter PBP-only 추정 = `MatchPlayerStat.isStarter` 미사용 (정확도 손실 ~10%)
- **분류**: error/lesson (기존 데이터 미활용으로 인한 추정 의존)
- **발견자**: debugger (사용자 제안 "starter 등록되어 있으면 자동 sub_in 처리" 검증 중)
- **본질**: `MatchPlayerStat.isStarter` 컬럼이 **모든 종료 매치에 양팀 정확히 5명씩 (총 10명) 100% 채워져 있음에도** minutes-engine 은 이 데이터를 무시하고 PBP 만으로 starter 추정 → "쿼터 첫 sub 이전 액션 없는 starter" 미식별 → 시간 누락.
- **실측 (t388 몰텐배 13 매치)**:
  - DB `isStarter` 데이터 존재율: 13/13 매치 (100%) / 매치당 정확히 양팀 10명
  - DB starter vs PBP-only Q1 추정 일치율: 24/26 팀×Q1 (92.3%) — 불일치 2건 모두 "DB 5명 / PBP 추정 3~4명" (DB 가 더 정확)
  - PBP-only 출전시간 정확도: 92.16% (205157s / 222600s)
  - DB starter + endLineup chain + lastGap=0 보강: **103.21% (over-shoot, LRM cap 으로 정확화 가능)**
- **데이터 출처**: Flutter 앱이 매치 시작 시 운영자 입력으로 `MatchPlayerStat` INSERT 시 `isStarter` 같이 sync. 즉 **운영자는 이미 starter 정보를 입력하고 있음**. minutes-engine 만 모를 뿐.
- **fix 권장**:
  1. **단순 — Q1 starter 만 isStarter 사용**: 영향 ~5~7% 정확도 향상. minutes-engine input 에 `dbStartersByTeam` 추가, Q1 만 PBP 추정 대신 DB 값 채택.
  2. **중간 — Q1 isStarter + Q2~Q4 endLineup chain**: 영향 ~10% 향상. Q2~Q4 starter = 직전 쿼터 endLineup (영역 4 97.5% 정확).
  3. **고급 — 영역 1+2+3+4 모두**: 영역 2 (firstGap/lastGap=0 강제) 추가, LRM cap 으로 over-shoot 흡수. 100% 회복 가능. DB 무변경.
- **회귀 위험 0**: DB 무변경, minutes-engine input 에 `dbStarters` 옵션 추가 + 분기. 기존 PBP-only 동작은 그대로 유지 (옵션 미주입 시 fallback).
- **참조횟수**: 0
- **관련**: 직전 entry "PBP 미달 본질 원인" — Flutter 앱 측 fix 안 하고도 서버측에서 80% 회복 가능

### [2026-05-03] PBP 0건 종료 매치 — minutes-engine cap 알고리즘 무효화 (#141 블랙라벨 vs MSA 패턴)
- **분류**: error (sync 누락 — 데이터 손상 X / live 페이지 출전시간 전부 00:00 표시)
- **발견자**: debugger (t388 전수 검증 13/13 매치 cap 일치도 측정 중)
- **증상**: status=`completed` + homeScore/awayScore 정상 (52:31) 인데 `play_by_plays` 0건 + `match_player_stats` 0건. live 페이지 박스스코어 = 모든 선수 DNP / 출전시간 합 = 0s.
- **재현 매치**: tournament `138b22d8...` (몰텐배 동호회최강전) match_id=141 (#10, C조 2경기, 블랙라벨 vs MSA, qLen=600 추정 default).
- **근본 원인**: Flutter 운영자가 매치 결과 집계 화면에서 점수만 manual entry → PBP/박스 sync API 호출 단계 자체 누락. `applyCompletedCap` 은 `bySec` 에 등록된 선수가 1명이라도 있어야 비례 분배 가능 — 비어 있으면 expected 도달 X (raw=0, partial=0 → early return).
- **신뢰도 영향**: 13 매치 중 1 매치 = 7.7% 매치 신뢰도 누락. capped 합 정확도 89.6% (PBP 0건 매치 1건이 expected 24000s 통째로 누락 → 분모 229800 의 ~10.4% 차감). 매치 0~12 만 보면 100% 정확.
- **fix 방향 1 (권장 — Flutter 측)**: 매치 종료 sync 시 PBP 0건 + score 양수 인 케이스 경고 + 운영자에게 sync 재실행 prompt. (원영 영역)
- **fix 방향 2 (대시보드 표시 가드)**: live 페이지/대시보드 카드 노출 시 `pbp_count = 0 && status = completed` → "출전시간 미입력" 배지 + sec 표시 숨김 (현재 모두 00:00 표시 → 사용자 혼란).
- **fix 방향 3 (cap 보강 — 미권장)**: PBP 0건 시 roster 전원에 expected/N 균등 분배 — 가짜 출전시간 생성 위험으로 비추천.
- **검증 방법**: `SELECT m.id, m.status, m.home_score, m.away_score, COUNT(p.id) AS pbp FROM tournament_matches m LEFT JOIN play_by_plays p ON p.tournament_match_id = m.id WHERE m.status = 'completed' GROUP BY m.id HAVING COUNT(p.id) = 0;`
- **참고**: PBP 일부 누락 케이스(이전 entry "PBP 미달 본질 원인 분석" 22팀 / 2026-05-03)는 cap 으로 흡수되지만, **PBP 전무 케이스는 cap 으로 복구 불가**. 분리 처리 필요.

### [2026-05-03] dual_tournament 진출 매치 양팀 동일 — `advanceWinner` 가 진짜 범인 (5/2 fix 무효 재발)
- **분류**: error (data corruption — 진출 슬롯 충돌, 5/2 회귀 방지 5종 우회)
- **발견자**: debugger (5/3 D-day D조 승자전 재발 audit log 추적)
- **증상**: 듀얼 조별 승자전 매치 (`bracket_position`=3) 의 `homeTeamId === awayTeamId`. 5/3 D조 (#15, matchId=146) 144 종료 직후 11번 self-heal 발생. **5/2 C조 (#11, matchId=142) 동일 패턴 7번** (errors.md 위 entry 와 같은 매치).
- **재현 시퀀스 (5/3 D조 audit 정확)**:
  - 06:54:06 — 144 sync 첫 호출 → `progressDualMatch(144, 246)` → 146.home=246 ✅ + `advanceWinner(144)` → 146 조회 시 home=246 (방금 set) → **slot=`awayTeamId` (home 채워짐) → 146.away=246 set 🚨** (audit X)
  - 06:54:40~06:58:20 — Flutter 144 sync 11번 반복 (5분 동안 ~20초 간격) → 매번 progressDualMatch self-heal (away=246→null, audit O) + 매번 advanceWinner 가 다시 away=246 set (audit X)
- **근본 원인 코드 위치**: `src/lib/tournaments/update-standings.ts` L30~36 `advanceWinner`
  ```ts
  const slot = nextMatch.homeTeamId === null ? "homeTeamId" : "awayTeamId";  // ← 빈 슬롯 자동 선택 = dual 에서 잘못된 슬롯
  await prisma.tournamentMatch.update({
    where: { id: match.next_match_id },
    data: { [slot]: match.winner_team_id },  // ← audit 호출 X
  });
  ```
- **호출 경로**: `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` L371~381 `Promise.allSettled([advanceWinner, updateTeamStandings, dual])` — dual 매치도 advanceWinner 항상 실행. dual 은 next_match_slot 이 source 매치별로 명시되어 있어 advanceWinner 의 "빈 슬롯 자동 채움" 로직이 잘못된 슬롯에 들어감.
- **5/2 회귀 방지 5종 우회 이유**: A(자가 치유) = self-heal 가드는 작동하지만 corrupt 가 매번 재발생 → 무한 루프. B(admin PATCH 차단) = 작동 OK 이나 범인이 admin 이 아님. C(dirty tracking) = 무관. D(검출 스크립트) = 수동 실행 — 실시간 감지 X. E(audit log) = audit 호출 안 하는 경로(advanceWinner)가 corrupt source 라 보이지 않았음.
- **즉시 fix (수동, 매치 종료 시)**:
  ```sql
  UPDATE tournament_matches
  SET away_team_id = NULL
  WHERE id = <next_match_id>
    AND away_team_id = home_team_id;
  ```
  단, **다음 sync 가 또 corrupt** 시키므로 영구 fix 까지 fix 후 즉시 코드 패치 필요.
- **영구 fix (권장)**: sync route L371~381 `advanceWinner` 호출을 **dual 매치 시 skip** (progressDualMatch 가 winner+loser 둘 다 처리하므로 중복 + 잘못된 슬롯 채움 위험만 만듦):
  ```ts
  const tasks: Promise<unknown>[] = [
    ...(isDual ? [] : [advanceWinner(matchId)]),  // dual 면 advanceWinner skip
    updateTeamStandings(matchId),
  ];
  ```
  추가 안전: `advanceWinner` 자체도 tournament.format 체크 후 dual 이면 early return (이중 가드).
- **재발 위험 매치**: 145 (D조 2경기) 종료 시 동일 패턴 — 145.next_match_slot=away 이므로 progressDualMatch 가 146.away set, 그 후 advanceWinner 가 146.home (이미 246=슬로우) 을 또 손대지는 않음 — 그러나 **147 (D조 패자전)** 도 144→loserNextMatchSlot=home, 145→loserNextMatchSlot=away 동일 시나리오 — 145 종료 시 147.away=loser(245) set + advanceWinner 가 147.home (이미 247=SKD) 을 안 건드림 → 안전. **단 그 이후 8강·4강 (151/154/155) 진출 시 모두 동일 위험**. 영구 fix 필수.
- **검증 방법**: fix 후 145 종료 → audit log 에서 self-heal 0 회 확인 + 146.home=슬로우 / 146.away=145winner 정상 확인.
- **참조횟수**: 0
- **관련 commit**: 5/2 e3df321(C조 첫 fix) + 1bec5c3(sync 가드) + 08b7e1e(manual-fix prefix) — 모두 본질 원인 미해결

### [2026-05-03] PBP 미달 = Flutter 운영자 sub 입력 누락 (출전시간 95~98% 미달의 본질 원인)
- **분류**: error/trap (Flutter 앱 운영 패턴 — 데이터 자체는 일관, 운영자 입력 누락이 본질)
- **발견자**: debugger (5/2+5/3 종료 11매치 22팀 전수 분석)
- **증상**: PBP-only 출전시간 엔진 적용 후 종료 매치 합 95~98% 미달 (140분 기대값 대비 -1~25분). cap (옵션 C) 으로 합은 정확화 되지만 본질 데이터 부족.
- **분석 결과 (22 팀 분포)**:
  - 100% 정확: 0 팀
  - lastClock 절단 (쿼터 종료 PBP 누락): **21 팀 (95%)**
  - firstClock 절단 (쿼터 시작 PBP 누락): 1 팀
  - 쿼터 전환 lineup 불일치 (sub 누락): 22 팀 모두 (사실상 1차 원인)
- **원인 (Flutter 앱 운영 패턴 3가지)**:
  - **A. 쿼터 시작 starter lineup 명시 PBP 미입력** — Flutter 앱이 쿼터 시작 시 starter 5명을 PBP 에 기록 안 함. 엔진은 `everSeen ∩ ¬sub_in` 로 추정 → 첫 sub 이전 액션 0 명 = 추정 실패 (예: 22 팀 모두 다음 쿼터 starter 1~4명만 식별, 나머지 2~4명 미식별 → 0초 산출).
  - **B. 쿼터 종료 직전 PBP 누락 (lastClock > 0)** — 쿼터 종료 직전 N초 (5~113초) PBP 무이벤트 / 운영자가 다음 쿼터 시작 후 set 종료 처리. 엔진은 마지막 PBP clock 까지만 누적 → N초 × 5명 = 25~565초 미달.
  - **C. 쿼터 시작 직후 PBP 지연 입력 (firstClockGap > 0)** — 쿼터 시작 후 N초 (10~125초) 무이벤트 (운영자 set 시작 지연 또는 사이드 미기록). 엔진은 첫 PBP clock 부터 시작 → 동일 미달.
- **검증** (대표 매치):
  - #133 home (81.7%) — Q1 firstGap=42s + Q3 lastCut=34s + Q3->Q4 lineup 4명 변경 (sub 미입력)
  - #140 away (76.5%) — Q5 OT firstGap=240s (4분 시작 지연) + Q4->Q5 lineup 3명 변경
  - #134 home/away (88~90%) — Q4 lastCut=113s (마지막 1:53 PBP 0건) → 양팀 동시 절단 = 운영자가 Q4 종료 1:53 전 set 종료
- **fix 방향**:
  - **단기 (코드)**: 종료 매치 cap (`applyCompletedCap`) 적용 완료 — 합은 100% 정확. 풀타임 보호.
  - **중장기 (Flutter 앱 — 원영 검토 대상)**:
    1. 🔴 **쿼터 시작 시 starter 5명 lineup PBP 자동 INSERT** (action_type='lineup_start' 또는 substitution sub_in 5건) — 1차 원인 해결.
    2. 🟡 **쿼터 종료 시 lastClock=0 자동 boundary PBP INSERT** (action_type='quarter_end') — lastClock 절단 방지.
    3. 🟡 **쿼터 시작 시 firstClock=qLen 자동 boundary PBP INSERT** (action_type='quarter_start') — firstClock 절단 방지.
    4. 🟡 운영자 가이드: "set 종료 즉시 누르기 (지연 금지)" / "쿼터 시작 시 lineup 확정 후 시작 누르기"
- **회귀 방지**: applyCompletedCap (옵션 C) 으로 종료 매치 합 100% 정확화 — 라이브 / 진행 중 매치는 cap 미적용 (부풀림 방지). Flutter app fix 미적용 시 라이브 매치 출전시간 정확도 90~98% 유지.
- **참조횟수**: 0

### [2026-05-03] NEXT_PUBLIC_APP_URL 을 server-side internal fetch 에 사용 시 dev → 운영 서버로 가는 사고
- **분류**: error/trap (env var 함정 / dev → 운영 cross-call)
- **증상**: `auto-publish-match-brief.ts` 에서 매치 종료 hook fire-and-forget 으로 `/api/live/[id]/brief?mode=phase2-match` 호출 → 모두 `missing_api_key` 응답. 같은 dev server 에 curl 직접 호출은 정상.
- **원인**: `getBaseUrl()` 우선순위에서 `process.env.NEXT_PUBLIC_APP_URL` 가 먼저 읽힘 → `.env` 의 운영 URL `https://www.mybdr.kr` 가 set 되어 있어서 dev 환경에서 운영 서버로 fetch. 운영 서버에는 `GEMINI_API_KEY` 미설정 → `missing_api_key` 응답.
- **검증**: fetch URL 출력 추가 → `https://www.mybdr.kr/api/live/132/brief?mode=phase2-match` 확인 → 즉시 인지.
- **fix**: `NEXT_PUBLIC_APP_URL` 사용 제거. `VERCEL_URL` (Vercel deployment 자기 자신) → fallback `http://localhost:3001`.
- **회귀 방지 룰**:
  - **NEXT_PUBLIC_* 환경변수는 client-side 용** — server-side internal fetch 에 사용 금지.
  - server-side 자기 자신 fetch 시 baseUrl: `process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3001"`.
  - 더 안전한 방법: server internal call 시 fetch 대신 함수 직접 호출 (input 빌드 로직 추출).
- **부수 발견**: dev 환경에서 운영 DB 작업 + 운영 fetch 가 섞여 있었음. dev 작업이 운영 환경으로 leak 가능 — 서비스 분리 강화 필요.

### [2026-05-03] team_members.userId NOT NULL → 명단 INSERT 시 placeholder User CREATE 강제
- **분류**: convention/trap (schema 제약 → 부채 패턴)
- **증상**: 미가입 선수 (회원가입 전, 명단만 받은 사람)를 `team_members` 에 등록하려면 `userId` FK 가 NOT NULL 이라 placeholder User 신규 생성 강제. `tournament_team_players` 는 nullable 이라 placeholder 안 만들어도 되지만, 팀 마스터 명단 노출이 필요하면 둘 다 INSERT 필요.
- **운영 영향**: placeholder User 부채 누적. 5/2 이전 약 78명, 5/3 블랙라벨 11명 추가 → **89명**. scratchpad 큐 #3 카운트 outdated (5명 → 89명).
- **표준 패턴** (placeholder INSERT 3단계 트랜잭션):
  1. `User CREATE { email: "placeholder-{teamId}-{jersey}@bdr.placeholder", passwordDigest: "$2a$12$placeholderHASH.NEVER...", name: "{실명}", nickname: "{실명}", status: "active" }` — email UNIQUE 충돌 방지 + 로그인 영구 차단
  2. `TeamMember CREATE { teamId, userId: <new>, jerseyNumber, role: "member", status: "active", joined_at: now() }`
  3. `TournamentTeamPlayer CREATE { tournamentTeamId, userId: <new>, jerseyNumber, player_name: "{실명}", role: "player", is_active: true, auto_registered: true }`
- **사전 검증 필수**: email 충돌 / `(teamId, jerseyNumber)` UNIQUE 충돌 / `(tournamentTeamId, jerseyNumber)` UNIQUE 충돌 3건 SELECT 후 진행.
- **사후 통합 패턴**: 실제 가입 시 `mergeTempMember` 함수가 placeholder User → real User ID 통합 (FK 7단계 트랜잭션, 4-30 김영훈 케이스). 단 함수 강화 큐 #4 미완 — name 매칭만으로는 불충분.
- **회귀 방지**: 신규 placeholder INSERT 시 email 패턴 `placeholder-{teamId}-{jersey}@bdr.placeholder` 통일 (mergeTempMember 의 SQL LIKE 검색 일관성).

### [2026-05-02] dual_tournament 진출 후 next_match 양 슬롯 같은 팀 (피벗·아울스 케이스)
- **분류**: error (data corruption — 진출 슬롯 충돌)
- **증상**: 듀얼 조별 승자전 매치의 `homeTeamId === awayTeamId` (양쪽 같은 팀). 운영 발생 2건 (피벗 / 아울스 B조 #7).
- **재현 조건**: Match #5(B조 G1) 완료 → progressDualMatch 정상 → next #7.home set ✅. 그러나 1초 후 Match #7.awayTeamId 도 같은 winnerTeamId 로 잘못 set.
- **추적 시도** (모두 정상 코드):
  - `progressDualMatch` (dual-progression.ts) — 단일 슬롯 (`targetField` 동적, home or away 한 쪽만)
  - `updateMatch` (match.ts L148) — slot==='home' / slot==='away' 분기
  - `updateMatchStatus` (match.ts L266) — 단일 슬롯
  - Flutter v1 `/matches/[id]/status` — updateMatchStatus 만 호출
- **의심 경로**: **`/api/web/tournaments/[id]/matches/[matchId]` PATCH (L104~109) 가 `homeTeamId` / `awayTeamId` 를 body 로 직접 받아 set 가능**. admin frontend 가 진출 처리 후 stale data 로 추가 PATCH 또는 운영자 수동 슬롯 설정 실수 추정.
- **즉시 fix 패턴**: `awayTeamId` 또는 `homeTeamId` (잘못 set 된 쪽) NULL UPDATE. Match 가 pending 이고 next_match_slot 의 source 매치가 아직 진행중이면 안전 (그 매치 종료 시 progressDualMatch 가 자동 덮어쓰기).
- **근본 원인 정확 식별 (2026-05-02 코드 점검)**: `/tournament-admin/tournaments/[id]/matches/page.tsx` (운영자 매치 관리 페이지) 가 변경 안 된 필드도 항상 PATCH body 에 포함. 운영자가 venue/scheduledAt 만 수정해도 React state 의 초기값 (homeTeamId/awayTeamId) 이 그대로 send 되어, progressDualMatch 가 채운 슬롯이 stale data 로 덮어써짐.
- **회귀 방지 (2026-05-02 적용 완료)**:
  - ✅ A. progressDualMatch 자가 치유 가드 — 반대 슬롯에 같은 team 있으면 NULL 정정 후 정상 진출 (dual-progression.ts +30줄)
  - ✅ B. admin web matches PATCH 의 진출 슬롯 차단 — 다른 매치의 next_match_id/loserNextMatchId 가 가리키는 매치는 home/away 변경 거부 (route.ts +35줄)
  - ✅ C. **admin frontend dirty tracking** — 변경된 필드만 PATCH body 에 포함 (page.tsx, **근본 원인 fix**)
  - ✅ D. 검출 스크립트 — scripts/_templates/detect-dual-conflicts.ts (수동 실행, 5/2 첫 실행 0건)
  - ✅ E. **TournamentMatch audit log** — `tournament_match_audits` 신규 테이블 + `match-audit.ts` helper. 추적 필드: homeTeamId/awayTeamId/winner_team_id/status/homeScore/awayScore/scheduledAt. source: admin/flutter/system. progressDualMatch (자가 치유 + winner/loser 진출) + updateMatch (admin PATCH) + updateMatchStatus (Flutter v1) 모두 audit 호출. 다음 회귀 시 정확한 출처 + before/after + changedBy 추적 가능.
- **참조**: 5/2 commit (A+B+C+D) / 즉시 fix DB UPDATE
- **관련 작업 로그**: 5/2 e3df321(피벗 케이스) + 5/2 (아울스 #7) 두 건 동일 패턴 — 회귀 방지 후 재발 0 예상
- **참조횟수**: 0

### [2026-05-02] quarterStatsJson 쿼터별 미달 — Flutter app 이 last_clock 까지의 lineup 시간만 누적 (140 player-min 기준 미달 케이스)
- **분류**: error (Flutter app 데이터 산출 룰 / 데이터 자체는 일관 — 사용자 기대값과 차이)
- **발견자**: 사용자 (검증 시 매치별 양팀 합 280 player-min 기준 비교) + debugger
- **증상**: 운영 매치 일부에서 quarterStatsJson 의 양팀 분당 합이 정확히 8400s/140m 미달.
  - 매치 #133 Q3: 2060s/팀 (Δ-40s × 2팀 = -80s, 약 -0.7m/팀)
  - 매치 #134 Q3: 1955s/팀 (Δ-145s × 2팀)
  - 매치 #134 Q4: 1770s/팀 (Δ-330s × 2팀, 합 -7.9m/팀)
- **원인 (PBP 시계열 분석으로 100% 확정)**:
  - PBP `game_clock_seconds` 의 마지막 값(last_clock) = 쿼터 종료 시점이 0초 미달:
    - 매치 #134 Q4 last_clock = **113s** (1:53 남기고 끊김) → qsJson Q4 = 1770s 정확 일치 (2100 - 330 = 1770 / 코트 5명 × 113s ≈ 565s 미반영, 근사값)
    - 매치 #134 Q3 last_clock = 29s → qsJson Q3 = 1955s
    - 매치 #133 Q3 last_clock = 31s → qsJson Q3 = 2060s
  - 비교 정상 매치 (#132 Q4 last_clock=11s / #135 Q4 last_clock=64s) 은 끝점 가까워서 미달 미미.
  - **Flutter app 의 quarterStatsJson 산출 알고리즘 = 마지막 PBP clock 까지의 lineup 시간만 누적**. 그 이후 시간 (예: #134 Q4 113→0초 1:53) 은 PBP 가 생성되지 않아 qsJson 에 반영 안 됨.
- **트리거 시나리오 (Flutter app 측)**:
  - 점수 격차 → 운영자가 의미 없는 마지막 시간 동안 사이드라인 액션 미입력
  - 경기 조기 종료 (시간 만료 부저 X)
  - undo/정정 후 재입력 누락
  - matchPlayerStat 의 minutesPlayed 는 Flutter app 이 sync 시 직접 보냄 (별도 산출) — qsJson 과 다른 데이터 출처
- **데이터 자체는 일관**: lineup 의 실제 "코트 위 기록된 시간" 이므로 의미상 정확. 사용자 기대값 (= 7m × 4Q × 5명 = 140m 기계적 합) 과 다를 뿐.
- **보정 옵션 (사용자 결정 필요)**:
  1. **DB 그대로 유지** (현 상태) — qsJson 표시값 = 실제 PBP 입력된 시간. 의미 일관
  2. **STL Phase 1 R8 패턴 응답 가공** — 매치 헤더 quarter end (0초) 까지 last_clock 이후 시간을 마지막 lineup 5명에 균등 분배. lineup 추적 (substitution PBP) 시점 정확하면 가능. 별도 작업 필요 (~1h)
  3. **운영자 가이드** — Flutter app 에서 쿼터 종료 직전 부저까지 마지막 액션 입력 권장 (행동 변경)
- **✅ 2026-05-02 STL Phase 2 채택 — sub 기반 lineup tracking + MAX 전략**:
  - `src/app/api/live/[id]/route.ts` `calculateSubBasedMinutes` 함수 추가
  - 알고리즘: PBP `action_subtype="in:X,out:Y"` 파싱 → 쿼터별 lineup tracking → 쿼터 종료 시 코트 잔존 선수 0초까지 자동 누적
  - 채택 룰: `max(subBased, qsJson, minutesPlayed, pbpSim)` — sub 가 더 큰 경우만 회복 (정상 매치 영향 0)
  - 검증 결과: #134 +11.38m 회복 (264.17→275.55), #133 +0.53m 회복, #132/#135 280m 만점 유지
- **✅ 2026-05-02 STL Phase 2 강화 (F3 + F2) — 4매치 모두 정확히 280m 회복**:
  - **F3 (starter 추정 정확화)**: Q2~Q4 starter = 직전 쿼터 종료 시 코트 5명 (lineup chain 추적)
    - 기존 단점 해소: "직전 쿼터에서 들어와 그 쿼터 코트 끝까지 잔존 + 현재 쿼터 PBP 등장 0건" 선수가 starter 미인정 → 시간 누락 케이스
    - `prevQuarterEndLineup: Map<teamId, Set<ttpId>>` 팀별 chain 보유. endLineup 사이즈 비현실 (3명 미만 / 7명 초과) 시 fallback (Q1 방식)
  - **F2 (쿼터별 합 미달 보정)**: 팀별 / 쿼터별 합 < 5×qLen 시 deficit 을 출전 선수에 가중 분배
    - 가드: `0 < deficit < quarterLengthSec` (음수 / 비합리 큰 값 제외) + 팀 출전 1명 이상
    - 분배: 팀 내 출전 시간 비율 가중치 (출전 0 시 균등)
  - **데이터 구조 변경**: `result: Map<bigint, number>` 단일 → `quarterPlayerSec: Map<quarter, Map<ttpId, sec>>` 쿼터별 분리 → 최종 합산
  - **검증 결과 (4매치 모두 PASS ±0.1m)**:
    | 매치 | sub-only (F3+F2 전) | F3+F2 후 |
    |------|---------------------|----------|
    | #132 | 264.63m | **280.02m** |
    | #133 | 255.05m | **280.00m** |
    | #134 | 273.95m | **280.00m** |
    | #135 | 267.70m | **280.00m** |
  - **MAX 전략 유지**: getSecondsPlayed 의 `MAX(sub, qsJson, dbMin, pbpSim)` 그대로. F3+F2 강화로 sub 가 항상 280 근접 → 4매치 sub 채택. 회귀 영향 0 (sub PBP 없는 매치는 알고리즘 진입 X)
- **✅ 2026-05-02 G3 — 신뢰도 기반 분리 + 풀타임 보호 + 팀 cap**:
  - **배경**: G1 DNP 가드 후 #132 +3.3m, #135 +4.9m, #136 +5.8m 잔여 over-distribution. F2 가중분배가 정상 출전 선수에게도 시간 추가 → 합 cap 초과. 단순 비율 축소 (F4) 는 풀타임 28m 선수도 비율 축소되는 문제. 사용자 결정: **풀타임 선수 시간을 비율 축소하면 안 됨** → 신뢰도 기반 분리 필수.
  - **신뢰도 채널 분리** (PlayerTimeBreakdown):
    | 채널 | 출처 | 보호 룰 |
    |------|------|---------|
    | 🟢 trustedSec (HIGH) | `sub_in→sub_out` 양 끝 명시 segment + 풀타임 starter (한 쿼터 sub 0건 = 정확히 qLen) + qsJson/dbMin/pbpSim fallback (외부 출처) | 절대 축소 X |
    | 🟡 mediumSec (MEDIUM) | `starter→sub_out` (시작 qLen 추정) / `sub_in→쿼터끝` (끝 0초 추정) | 우선 보존, distributed 부족 시만 축소 |
    | 🔴 distributedSec (LOW) | F2 deficit 가중분배 | cap 초과 시 첫 축소 대상 |
  - **`getSecondsPlayed` 우선순위 (G3)**:
    1. trustedSec ≥ 4×qLen-2 → 풀타임 선수, 그대로 채택 (cap 보호)
    2. qsJson ±60s 근접 sub_total → qsJson 채택 (외부 출처 = trustedSec)
    3. sub_total 합리값 → 3채널 그대로 (cap 시 distributed 우선 축소)
    4. max(qsJson, dbMin, pbpSim) → trustedSec (외부 출처)
    5. DNP → 0
  - **`applyTeamCap` (응답 직전 팀별)**: cap = 5×qLen×4 (팀 코트시간). teamTotal > cap 시:
    - trustedTotal > cap → 데이터 이상 경고 + 그대로 (풀타임 절대 보호)
    - medium ≤ remaining → distributed 만 비율 축소 (medium 살림)
    - 그 외 → distributed=0 + medium 비율 축소
  - **데이터 구조 변경**:
    - `SubBasedMinutesResult.perPlayer`: `Map<bigint, number>` → `Map<bigint, PlayerTimeBreakdown>`
    - `quarterPlayerSec`: 쿼터별 채널 분리 누적 (`ensureBreakdown` + `addQSec(channel)`)
    - `getSecondsPlayed` return: `number` → `{ sec, breakdown }`
    - PlayerRow 에 임시 `_minBreakdown` 첨부 → cap 적용 후 응답 직전 strip
  - **검증**:
    - cap 함수 unit test 4 시나리오 모두 PASS (cap 미초과 / distributed 만 축소 / medium 까지 축소 / trusted > cap 데이터 이상)
    - 5매치 (#132~#136) sub-based raw output 측정: cap 미발동 (sub_total < cap) — 라이브 API 의 STL R3 추가 보충 후에야 280m 근접. cap 은 distributed 가 큰 이상치 매치에서만 발동.
    - **풀타임 보호 검증**: #134 조현철·강동진 trustedSec=28.00m 정확 보존, cap 적용 후에도 변화 0
  - **회귀 영향 0**:
    - sub PBP 없는 매치 → quarterPlayerSec 비어있음 → cap 발동 안 함 → 기존 동작
    - qsJson 만점 매치 → getSecondsPlayed 2순위 (qsJson trustedSec) → cap 미초과 → 변화 0
    - DNP 가드 (G1) 동작 유지 (everSeen Set + hasRealRecord 검사)
- **회귀 방지 / 진단 패턴**:
  - 출전시간 미달 신고 시 → PBP 쿼터별 last_clock 1차 확인 (`SELECT MIN(game_clock_seconds) GROUP BY quarter`)
  - last_clock > 0 이면 그 시간 × 5명 ≈ qsJson 미달 시간 확인
  - 정확히 일치하면 Flutter 산출 룰 = 사용자 기대값 차이 → 코드 버그 아님
- **관련**: STL Phase 1 R3 (quarterStatsJson 부분 누락 보충 = 다른 케이스, Q*.min=0 인 쿼터 전체 누락 보충용 / 본 케이스는 부분 미달)
- **참조횟수**: 1

### [2026-05-02] Flutter app 의 PBP 누락 패턴 — 박스스코어 입력 vs PBP 생성 분리 (운영 18 매치 56% 발생)
- **분류**: error (Flutter app 데이터 무결성 / 서버 측 fallback 으로 보완)
- **발견자**: 사용자 (라이브 매치 132/133 점수 합 불일치 발견) + 분석
- **증상**: 운영 18 매치 중 10건 (56%) 매치 헤더 점수 vs PBP 점수 합 불일치. 매치당 평균 4.8점 누락. 양팀 minutesPlayed 합도 정상값 미달.
  - 매치 132: SYBC Q1 헤더 17 vs PBP 합 15 (임강휘 2점 made_shot PBP 미생성)
  - 매치 133: 양팀 starter Q3.min=0 (Q3 진행 시간 quarterStatsJson 미반영)
  - 매치 102: gap +4/+4 / 매치 103: gap +4/+2 / 매치 99: gap +2/0
- **원인 (Flutter app 측 8가지 시나리오)**:
  1. 빠른 점수 입력 단축 버튼 (선수 +2/+3) → matchPlayerStat 만 갱신, made_shot PBP 미생성
  2. 박스스코어 직접 편집 (운영자 수동 점수 보정) → matchPlayerStat 만 수정
  3. PBP 입력 후 undo → PBP 삭제 + matchPlayerStat 차감 누락
  4. 자유투 시퀀스 (3-shot) 일부만 PBP 생성
  5. 2점/3점 정정 → PBP update 누락
  6. **올아웃 기능 (작전타임/쿼터 시작 5명 일괄 교체)** — sub PBP 5건 일괄 생성에서 일부 누락 (매치 132: 15건 중 7건만 PBP)
  7. 네트워크 끊김 (PBP 생성 후 sync 실패)
  8. 앱 crash (로컬 저장 시점 의존)
- **다른 이벤트는 정상 player_id**: matchPlayerStat 100% 정확, sub_in/out/rebound/foul 등 부속 PBP 정상 — made_shot/sub PBP 만 일부 누락
- **서버 측 해결 (Flutter app 수정 0)**: STL Phase 1 (Single Truth Layer) 도입 — `src/app/api/live/[id]/route.ts`
  - **R1**: PBP `home_score_at_time`/`away_score_at_time` 시계열로 쿼터별 누락 점수 식별 + 그 쿼터에 직접 분배 + 매치 헤더 cap (사용자 통찰: 마지막 쿼터 일괄 분배보다 정확)
  - **R3**: quarterStatsJson 부분 누락 쿼터 (Q*.min=0) 에 PBP 시뮬값 보충 (매치 133 Q3 케이스)
  - **R4**: minutesPlayed=0 fallback (B-2)
  - **R8**: quarter length 동적 추정 (7분/10분 매치 자동 인식)
- **PBP sync 가드** (`/api/v1/tournaments/[id]/matches/sync`): 운영자 수동 INSERT PBP (`local_id` startsWith `manual-fix-` OR `description` startsWith `[수동 보정]`) 는 Flutter sync 시 deleteMany 에서 제외 — 영구 보존
- **검증**: 매치 101/102/103/132/133/95 6 케이스 모두 매치 헤더 = 쿼터 합 정확 일치 (음수 gap 케이스만 안전 미보정)
- **관련 commit**: 0f8da8e (R1) / b18227c (R3) / 1bec5c3 (sync 이중 가드) / f0278b4 (R8)
- **관련 보고서**: `Dev/bug-report-flutter-allout-pbp-2026-05-02.md` + `Dev/bug-report-quarter-score-mismatch-2026-05-02.md` (원영 전달용)

### [2026-05-02] 폴드5 외부 (~388px) 등 극세 viewport 분기 부재 — 480 미만 단일 분기 → 팀명/TOTAL 헤더 잘림
- **분류**: error (반응형 분기 누락 / 모바일 안티패턴)
- **발견자**: 사용자 (갤럭시폴드5 외부 화면 ~388px 캡처)
- **증상**: 라이브 페이지 (`/live/[id]`) Hero 팀명 "셋업(SET UP)" → "셋업(S..." ellipsis / 쿼터 테이블 TOTAL 헤더 → "TOTA..." 잘림.
- **원인**: 모바일 분기가 0~479px 단일 — 폴드5 외부 (388px) / 갤럭시 일부 좁은 viewport / 작은 폰 폭 미고려. 480px+ 분기 활성화는 일반 모바일에 맞춤이라 그 이하에서는 base 가 그대로 적용.
  - Hero 팀명 13px × 8자 ≈ 95~100px / 5 column grid `48/1fr/40/1fr/48` 에서 1fr 폭 ≈ 102px → 한계점 ellipsis
  - 쿼터 테이블 TOTAL `minmax(48px, 1fr)` → 11px "TOTAL" 5자 (≈55px) 들어가야 하는데 1fr 분배 후 약 57px → 한계
- **수정**: `hero-scoreboard.css` 에 `< 400px` base + `400px+` 분기 추가 (3-tier: base/400/480/720/1024)
  - Hero 그리드 base: 40/1fr/32/1fr/40 (gap 3px) → 400+: 기존 48/1fr/40/1fr/48
  - 팀명 폰트 base: 11px (letter-spacing -0.03em) → 400+: 13px → 480+: 16px
  - 점수 폰트 base: 28px → 400+: 36px → 480+: 52px
  - dash base: 18px → 400+: 22px
  - 쿼터 테이블 TOTAL: minmax(48px, 1fr) → minmax(60px, 1fr) (모바일 base, "TOTAL" 5자 fit)
- **회귀 방지 룰**: 모바일 분기 작성 시 폴드5 외부 (~388px) 와 갤럭시 일반 (~400px) 양쪽 검증. 단일 분기로 묶으면 한쪽 깨짐 가능. **Tailwind `xs:` (≤479px) 또는 명시적 `< 400px` base + `400px+` 분기 권장**.
- **관련 commit**: d046ab1 (폴드5 외부 fix)

### [2026-05-02] Flutter v1 sync 가 winner_team_id 미설정 + dual 진출 hook 누락 — 듀얼토너먼트 자동 진출 안 됨 (D-day 발견)
- **분류**: error (API route 흐름 누락 / web PATCH 와 v1 sync 패턴 불일치)
- **발견자**: 사용자 (5/2 동호회최강전 D-day 운영 중) + developer
- **증상**: Flutter 기록앱이 매치 종료 후 sync 호출했지만 듀얼토너먼트 다음 매치(승자전/패자전)에 home/away 팀이 자동 채워지지 않음. 첫 매치 (피벗 vs SYBC, matchId=132) 운영 DB 수동 UPDATE 3건으로 보정.
- **원인**: `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` 가 (1) `winner_team_id` 자동 결정 코드 없음 — Flutter sync 가 winner 를 안 보냄 → DB winner_team_id=null → `advanceWinner` 가 즉시 return (winner_team_id 가드) → single elim 진출조차 안 됨. (2) `tournament.format === "dual_tournament"` 분기 없음 → `progressDualMatch` 호출 0건 → loser 진출 + idempotent winner 진출 모두 누락. **web PATCH 흐름 (`src/lib/services/match.ts:160~170`) 에는 dual 분기가 있는데 v1 sync route 에는 누락** — Flutter 가 sync 만 사용하므로 web PATCH 분기는 한 번도 안 타는 코드 경로였음.
- **진단 방법**: 매치 132 종료 후 운영 DB 의 다음 매치 home/away 팀 NULL 확인 → sync route 코드 읽기 → `advanceWinner` 의 winner_team_id 가드 확인 → web PATCH (`updateMatch` / `updateMatchStatus`) 에는 dual 분기 + winner 자동 결정 있는데 v1 sync 에는 둘 다 없는 것 확인.
- **수정 (2026-05-02 commit 예정)**:
  1. `import { progressDualMatch }` 추가
  2. `existing` 매치 조회 후 `tournament.format` 1회 SELECT
  3. `correctedHomeScore/AwayScore` 보정 후 winner 자동 결정 (`existing.winner_team_id` 없고 status="completed" 시 점수 비교)
  4. `update data` 에 `winner_team_id` 조건부 추가 (변경 시만)
  5. `match.status === "completed"` 후처리에 `progressDualMatch` 추가 (`tasks` 배열에 푸시 + Promise.allSettled)
  6. `dualResult` rejected 시 warnings 추가 (best effort, sync 자체는 성공 유지)
- **회귀 방지**:
  - **API 패턴 룰 (신설)**: web 과 v1 (Flutter) 양쪽이 같은 도메인 동작 (매치 완료 후 진출) 을 처리할 때 한쪽만 fix 하면 다른 쪽이 silent break. **반드시 `src/lib/services/` 공통 함수로 추출 후 양쪽 호출** 또는 양쪽 동시 검증 (해당 작업은 최소 변경 원칙으로 추출 안 함, 추후 리팩토링 큐).
  - **검증 룰**: web PATCH 와 v1 sync 동시 점검 — 매치 종료 시 winner_team_id / next_match 진출 / dual loser 진출 3가지 모두 양쪽 흐름에서 동작하는지 확인.
  - **Flutter 의존 흐름**: Flutter 앱이 사용하는 v1 route 는 web PATCH 와 별도 흐름 — web 만 fix 하면 Flutter 사용자가 사일런트 break. v1 변경 시 Flutter 재빌드 불필요 (서버만 배포) 인 점 활용.
- **참조횟수**: 0

### [2026-05-02] `/live/[id]` 라이브 페이지 awayTeam 선수명단 빈칸 — TournamentTeam 등록 시 team_members 동기화 누락
- **분류**: error (DB 데이터 결손 / 코드 버그 아님)
- **발견자**: 사용자 + debugger
- **증상**: `/live/133` 셋업팀 명단 0명 표시 (홈 SA 9명 정상). API/UI 정상, DB 의 `tournament_team_players` 가 비어있음. 5/2 동호회최강전 16팀 중 9팀이 동일 증상 (셋업/MZ/블랙라벨/다이나믹/MI/슬로우/우아한스포츠/MSA/SKD).
- **원인**: `Team` → `TournamentTeam` (대회 등록) 시 원본 `team_members` 를 `tournament_team_players` 로 자동 복사하는 hook 누락. 등록 row 만 생기고 선수 명단은 0건. API (`src/app/api/live/[id]/route.ts:36-48`) 는 `tournament_team.players` 만 조회하므로 빈 배열 응답 → UI 빈칸.
- **진단 방법**: prisma 로 `tournamentTeam.findUnique({ id, include: { players, team: { include: { members } } } })` 호출 → `players=0` vs `members=15` 비교로 결손 즉시 확인.
- **수정 (1팀 임시 보정)**: `scripts/_temp/sync-setup-tournament-players-2026-05-02.ts` 일회성 스크립트 — DRY-RUN → role 분포 확인 (manager/coach 제외, member/captain 만) → INSERT createMany. 13건 INSERT 후 검증 후 스크립트 즉시 삭제. **코드 변경 0**.
- **회귀 방지**:
  1. **장기**: 대회 가입/팀 등록 hook (`linkPlayersToUsers` 인근) 에 `team_members → tournament_team_players` 동기화 추가 검토 (장기 큐 추후 구현 목록에 이미 등재)
  2. **단기 운영 룰**: 대회 시작 전 16팀 명단 일괄 점검 SELECT (player_count=0 인 tournament_team 검출) — 추후 admin 페이지에 노출 검토
  3. **CLI 진단 패턴**: 라이브 페이지 빈칸 신고 → 즉시 prisma `tournament_team.players.length` vs `team.members.length` 비교 → 0 vs 양수면 동기화 누락 확정
- **잔여**: 8팀 (MZ/블랙라벨/다이나믹/MI/슬로우/우아한스포츠/MSA/SKD) 동일 보정 PM 큐 — 같은 스크립트 패턴으로 일괄 가능
- **참조횟수**: 0

### [2026-05-02] profile PATCH 409 '이미 등록된 정보' — 운영 DB partial unique index 가 prisma schema 누락
- **분류**: error (schema drift / P2002 친화 메시지 누락)
- **발견자**: 사용자 + pm
- **증상**: mybdr.kr/profile/edit 저장 시 "이미 등록된 정보입니다. 입력값을 확인해주세요." 빨간 메시지. nickname 충돌이 아닌 다른 unique 컬럼 충돌인데 친화 메시지 분기 누락.
- **원인**: 운영 DB 의 `users` 테이블에 partial unique index 5종 (`email` / `nickname` partial / `phone` partial / `provider+uid` / `public_id`) 존재. **prisma schema 에는 phone/nickname @unique 누락** (Rails 시절 DB pull 후 schema 미반영 추정). PATCH 시 phone/email 변경 시 P2002 발생 → catch 에서 nickname target 만 친화 메시지 분기 → 다른 target 은 일반 fallback "이미 등록된 정보" 메시지 → 어떤 필드 충돌인지 사용자가 알 수 없음.
- **진단 방법**: 로컬 tsx 스크립트 (`scripts/_temp/diagnose-profile-p2002.ts` — 작업 후 정리됨) 로 (1) `pg_indexes` 직접 쿼리 → unique index 5종 확인 (2) 사용자 (id=2836) 본인 값 update 성공 (3) 다른 user nickname 으로 update 시도 → P2002 (target: nickname) 재현.
- **수정**: `src/app/api/web/profile/route.ts` catch 블록에 phone/email target 분기 추가 + unhandled target 은 console.error + targets.join 메시지로 디버깅 가능:
  ```ts
  if (targets.includes("phone")) return apiError("이미 등록된 전화번호입니다. ...", 409);
  if (targets.includes("email")) return apiError("이미 사용 중인 이메일입니다.", 409);
  console.error("[PATCH /api/web/profile] P2002 unhandled target:", targets);
  return apiError(`이미 등록된 정보입니다. (${targets.join(", ")})`, 409);
  ```
- **회귀 방지**:
  - prisma schema 와 운영 DB unique index 일치 검증 — 추후 큐 (schema 갱신 후 db pull 또는 수동 @unique 추가)
  - 모든 P2002 catch 분기에 unhandled target console.error 필수 (Vercel logs 못 봐도 향후 진단 시 useful)
- **참조**: 본 사례 의 친화 메시지 fix commit / lessons.md "운영 DB 직접 진단 패턴"
- **참조횟수**: 0

### [2026-05-01] profile PATCH 500 'Internal error' — birth_date Invalid Date 미가드
- **분류**: error (API route 파싱 가드 누락 / Vercel 로그 접근 불가 환경 진단 패턴)
- **발견자**: 사용자 + pm
- **증상**: mybdr.kr/profile/edit 에서 저장 시 'Internal error' 메시지. 콘솔 1x 500. 응답 body `{"error":"Internal error"}` 만.
- **원인**: `src/app/api/web/profile/route.ts:119` 의 `new Date(birth_date as string)` 가 잘못된 형식 (빈 문자열 아닌 부분 입력 "2024-13-45" / 사용자 임의 텍스트) 받으면 Invalid Date 객체 생성 → `prisma.user.update()` 가 `PrismaClientValidationError: Provided Date object is invalid. Expected Date.` throw → catch fallthrough → 500.
- **진단 방법**: 로컬에서 `.env` 운영 DB 로 connect 후 prisma.user.update 를 단계별 (필드별) 직접 호출하는 진단 스크립트 (`scripts/_temp/diagnose-profile-save.ts` — 작업 후 정리됨) 로 재현. Test E (`new Date("")` Invalid Date 가설) 만 실패 → 원인 확정. **Vercel 로그 접근 불가 환경에서 효과적인 진단 패턴** (lessons.md 박제).
- **수정 (이중 방어선)**:
  1. 백엔드 (`route.ts:111-122`): birth_date 파싱을 update 호출 전 분리 + `isNaN(d.getTime())` 가드 → 잘못되면 `apiError("생년월일 형식이 올바르지 않습니다.", 400)` 명시 응답
  2. 프론트 (`profile/edit/page.tsx:370-374`): payload 구성 시 동일 isNaN 체크 → 잘못된 입력은 null 로 송출 (UX 보정)
- **회귀 방지 룰 (신설)**:
  - API route 에서 `new Date(externalString)` 패턴 사용 시 **항상 `isNaN(d.getTime())` 가드 필수**. 가드 없으면 prisma 호출 시 PrismaClientValidationError 로 500 fallthrough.
  - 점검 대상 후보 (이번 픽스 범위 밖, 추후 일괄 점검): tournament `startDate` / `endDate` / `registration_start_at` / `registration_end_at`, game `scheduled_at`, 기타 string→Date 변환 지점.
- **부수 발견 (별건)**:
  - 사용자 (id=2836, nickname=수빈) DB 의 `position` 컬럼 값이 `"PG,SG,SF"` — comma-separated multi. 시안 폼은 단일 선택만 보내므로 저장 시 multi 데이터 손실 위험. 별건 추적 필요.
- **참조횟수**: 0

### [2026-05-01] organizations 목록 status 필터에 실재하지 않는 값 'active' 박힘
- **분류**: error (status enum 불일치, 페이지 ↔ 생성 API ↔ 스키마 cross-check 누락)
- **발견자**: pm
- **증상**: `/organizations` 페이지가 항상 빈 목록. 단체 생성해도 노출 안 됨. 내일 동호회최강전 대회 세팅 중 발견 (2026-05-01).
- **원인**: `src/app/(web)/organizations/page.tsx:34` 의 필터가 `where: { is_public: true, status: "active" }`. 하지만 schema/생성 API/admin approve route 등 모든 곳은 `"approved" | "pending" | "rejected"` 사용 (`api/web/organizations/route.ts:45,75` 생성 시 'approved'/'pending', `prisma/schema.prisma:2222`, `series/route.ts:49` 가드도 'approved'). `"active"` 는 organizations 컨텍스트에서 **절대 발생하지 않는 값** (tournament_series 의 status='active' 와 혼동 추정).
- **수정**: 1줄. `status: "active"` → `status: "approved"`. commit `08898cb`.
- **재발 방지 체크리스트**:
  1. **status 필터 추가/수정 시**: schema.prisma default + 생성 API + admin approve/reject route 까지 cross-check (4지점 일관 검증)
  2. **모델별 status 도메인 분리 인지**: `organizations.status` (approved/pending/rejected) ≠ `tournament_series.status` (active 등) ≠ `tournament.status` (draft/published/registration_open/...). 모델별 enum 다름
  3. **회귀 점검 grep**: `prisma\.{모델}.*status.*"{값}"` 멀티라인으로 다른 사용처 동시 점검
  4. (장기) 단체 생성 후 목록 페이지 노출 e2e/스모크 테스트 부재 → 추가 검토 큐
- **관련**: `src/app/(web)/organizations/page.tsx:34` (수정), `src/app/api/web/organizations/route.ts:45,75` (생성 API), `prisma/schema.prisma:2222` (스키마), `src/app/api/web/series/route.ts:49` (다른 'approved' 가드 사용처)
- **참조횟수**: 0

### [2026-05-01] PATCH 후 JWT 재발급 누락 → referee 영역 stale session.name (해소)
- **분류**: error (세션 일관성, 7일 stale)
- **발견자**: pm
- **증상**: 사용자 nickname 변경 후 헤더는 즉시 갱신되지만 (referee)/* 영역에 session.name 직접 사용한 3건이 JWT 만료(7일) 까지 옛 값 유지
- **원인**: PATCH /api/web/profile 가 DB만 update + JWT 재발급 누락 → 발급 시점 nickname 7일 박힘
- **해결**: PATCH catch 위에서 nickname 변경 감지 → generateToken 재발급 + cookieStore.set Set-Cookie
- **재발 방지**: nickname 외 다른 user 정보(이메일/role) 변경 PATCH 라우트도 JWT 재발급 추가 필요 시 동일 패턴
- **참조횟수**: 0

### [2026-04-30] PATCH /api/web/profile P2002 nickname unique 위반 → 'Internal error' 마스킹으로 진단 1시간 지연
- **분류**: error (catch 마스킹 + 사용자 친화 메시지 누락 패턴, 진단 절차 표준화)
- **발견자**: pm
- **증상**: 사용자가 /profile/edit 에서 닉네임을 다른 사용자가 이미 쓰고 있는 값으로 변경 후 저장 → 'Internal error' (500). raw error 미노출 → 진단 1시간 지연.
- **잘못된 가설 (모두 헛수고)**:
  1. Service Worker 캐시 (mybdr 자체 SW 등록 0건이라 무관)
  2. Vercel CDN 캐시 (배포 헤더로 검증 후 기각)
  3. Phase 12 schema 신규 컬럼 (`name_verified` 등) vs 운영 DB 불일치 (a2081ba 픽스 후에도 재현돼서 의심했지만 무관)
  4. weight/district 컬럼 운영 DB 부재 (GET 통과로 기각)
- **진짜 원인**:
  1. PATCH /api/web/profile 의 catch 가 모든 에러를 `apiError("Internal error", 500)` 로 마스킹 → P2002 (Unique constraint failed on the fields: ["nickname"]) 도 동일 응답
  2. 클라/서버 어디에도 닉네임 중복 사전 검증 없음 (길이 검증만 있음)
  3. apiError 가 raw 노출 안 함 → 클라에선 무조건 'Internal error' → 사용자/PM 모두 운영 회귀로 오인
- **진단 패턴 표준화 (앞으로 운영 catch 마스킹 500 추적 절차)**:
  1. 코드 레벨 가능 가설 모두 점검 (schema, route, SW, CDN) — 본 사례에서 1시간 소요
  2. 결정 안 나면 **임시 raw error 노출 패치** 1줄 → 운영 배포 → 사용자 1회 시도 캡처
  3. 패치 형태:
     ```ts
     const code = (e as { code?: string })?.code ?? "NO_CODE";
     const meta = (e as { meta?: unknown })?.meta;
     const metaStr = meta ? ` meta=${JSON.stringify(meta).slice(0, 200)}` : "";
     return apiError(`[DEBUG-PATCH] ${code} :: ${msg.slice(0, 400)}${metaStr}`, 500);
     ```
  4. P-code + meta 확보 후 즉시 닫기 (1분 내 별도 커밋)
- **진짜 해결**: PATCH catch 에 P2002 + target=nickname 케이스 분기 → 409 "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요." 친화 메시지
- **재발 방지 체크리스트**:
  1. **unique 제약이 있는 필드(nickname/email/phone 등)의 PATCH/POST 라우트는 모두 P2002 분기 필수**
  2. **신규 @unique 컬럼 추가 시**: schema @unique → API route catch 분기 추가 → 친화 메시지 정의 → (선택) 클라 사전 검증
  3. catch 에 raw `console.error` 는 유지 (errors.md 04-30 a2081ba 룰), 단 클라 응답에는 친화 메시지만
  4. **운영 회귀 진단 우선순위**: (1) 사용자 입력값 의심 (가장 흔함) → (2) catch 마스킹 의심 → (3) 직전 커밋 회귀 → (4) DB 불일치
- **참조횟수**: 0

### [2026-04-29] "OAuth 후 팀 분리" 사용자 보고 → DB 정상 (재현 불가) — 진단 절차 표준화
- **분류**: error (사용자 보고 vs 실제 데이터 불일치, 진단 패턴)
- **발견자**: debugger
- **증상**: 사용자가 "일반 가입으로 루나틱 팀을 만든 뒤 카카오 OAuth로 다시 로그인하니 팀이 본인 계정과 분리됐다"고 보고.
- **실제 진단 결과 (dev DB, scripts/debug-kakao-link-2026-04-29.ts)**:
  1. 김병곤 user는 단 1명 (id=3007, provider=kakao, uid=4868813440, email=ragonida@naver.com, phone=01033210922) — 일반 가입 user A는 존재하지 않음
  2. 루나틱 팀(id=215) captain_id=3007 으로 정확히 연결
  3. team_members(id=2348, team_id=215, user_id=3007, role=director, status=active) 정상 존재
  4. 같은 phone/email로 다른 user 없음 → 가설 1(중복 user) 배제
  5. user 생성일 2026-04-28, 팀 생성일 2026-04-29 → "OAuth 가입 후 팀 생성" 순서 (사용자 인식과 반대)
- **원인 (확정)**: 사용자가 카카오로 가입한 뒤 팀을 만들었기 때문에 일반 가입 흔적이 애초에 없음. "분리됐다"는 인식은 (a) 다른 디바이스/브라우저에서 비로그인 상태였거나 (b) profile 페이지 캐시 문제, (c) 다른 계정으로 잘못 로그인한 가능성. **코드/DB 결함 아님.**
- **OAuth 매칭 로직 검증**:
  - 활성 핸들러는 `src/app/api/auth/callback/kakao/route.ts` → `src/lib/auth/oauth.ts#handleOAuthLogin` (다른 경로 `api/auth/kakao/callback`은 logout 복귀용)
  - handleOAuthLogin: ① provider+uid로 검색 → ② email로 기존 계정 찾으면 provider/uid 업데이트(연결) → ③ 신규 생성 — **3단계 매칭 정상**
  - JWT sub = user.id.toString(), withWebAuth가 BigInt(session.sub)로 복원 → 세션 id 불일치 가능성 0
- **재발 방지 / 진단 절차 표준화**:
  1. "OAuth 후 X가 사라졌다" 류 보고는 **DB 직접 조회를 1순위로**: 같은 이름/email/phone의 user row 개수, owner_id 일치 여부, 생성 timestamp 순서.
  2. 1명만 나오면 코드 결함 아님 → 사용자에게 ① 어느 디바이스/브라우저, ② 로그인된 계정의 email/닉네임, ③ /profile 직접 접속 시 보이는 팀 카드 스크린샷 요청.
  3. provider+uid 또는 email 매칭이 **두 번째**로 의심 — 매칭 실패 시 user row 2개가 만들어지므로 ①에서 잡힘.
  4. 진단 스크립트 보존: `scripts/debug-kakao-link-2026-04-29.ts` (User + Team(captain/manager) + TeamMember + phone/email 중복 검사 4섹션 1회 실행)
- **참조횟수**: 0

### [2026-04-29] schema 변경 + db push + prisma generate 후 dev 서버 미재시작 → `Invalid \`tx.team.create()\` invocation` (Unknown argument)
- **분류**: error (워크플로우 함정)
- **발견자**: debugger
- **증상**: `/teams/new` 등 신규 필드를 쓰는 server action 실행 시 `Invalid \`tx.team.create()\` invocation in C:\…\.next\dev\server\chunks\ssr\…` 에러. 코드/schema/DB 모두 정상이고 직접 tsx로 같은 페이로드를 호출하면 성공.
- **원인**: `prisma db push` + `prisma generate` 로 신규 필드(`home_color`, `away_color`)가 schema/DB/`node_modules/.prisma/client` 에는 반영됐지만, 이미 가동 중인 **Next.js dev 서버가 옛 PrismaClient 모듈을 메모리에 캐싱** 중이라 신규 필드를 모름 → `Unknown argument` 런타임 에러.
- **해결**: dev 서버 재시작.
  1. `netstat -ano | findstr :3001` → PID 확인
  2. `taskkill //f //pid <PID>` (절대 `taskkill //f //im node.exe` 금지)
  3. `npm run dev` 재기동
- **재발 방지**:
  - schema.prisma 변경 후 체크리스트: ① `prisma db push` ② `prisma generate` ③ **dev 서버 재시작** (3단계 모두 필수)
  - actions/teams.ts 같이 `e.message.slice(0, 100)`로 잘라 보여주는 catch는 디버깅을 어렵게 만듦. 적어도 `console.error`로 풀 메시지를 남기는 패턴은 유지 (현재 라인 102 `console.error("[createTeamAction]", e)` OK).
- **검증 방법**: `node_modules/.prisma/client/index.d.ts` 의 mtime 과 dev 서버 프로세스 StartTime 비교 → 후자가 더 빠르면 무조건 재시작 필요.
- **참조횟수**: 0

### [2026-04-29] 모바일 가로 overflow — 인라인 gridTemplateColumns 모바일 미대응 안티패턴 (Phase 9-Mobile)
- **분류**: error (UI, **재발 8건+** Phase 9-Mobile Refinement 1라운드)
- **발견자**: pm + 사용자 (366px 강제 검증)
- **증상**: 366px viewport에서 페이지 우측이 잘리거나 가로 스크롤바 발생. 데스크톱(≥1024px)에선 정상, 모바일에서만 깨짐. v2 컴포넌트 8건+에서 동일 패턴 발견 (DivisionGrid / RankingTable / TeamCard / EventCalendar / GameSchedule 등).
- **원인**: 인라인 스타일에 `gridTemplateColumns: "repeat(N, 1fr)"` 또는 `"repeat(N, minmax(150px, 1fr))"`을 모바일 분기 없이 적용. (1) N이 3 이상이면 366px 안에서 1fr이 0보다 작아져 자식이 부모 폭 침범, (2) `minmax(150px, ...)` 값이 컨테이너 폭을 합쳐 넘김, (3) Tailwind sm:/md: 분기로 했어야 할 곳을 인라인 style로 처리.
- **해결**:
  1. 인라인 `gridTemplateColumns: "repeat(N, 1fr)"` → Tailwind `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-N` (mobile-first 분기)
  2. 자식 1fr 컬럼에 `minWidth: 0` 가드 추가 (text overflow 차단)
  3. globals.css `@media (max-width: 720px)` 글로벌 룰: `html, body { overflow-x: hidden; }`
- **재발 방지**:
  1. **컨벤션 문서화** (conventions.md "모바일 최적화 체크리스트 10항목" 2026-04-29 추가) — grid 인라인 repeat 금지 1순위
  2. PR 리뷰 시 `gridTemplateColumns: "repeat(` 검색으로 1차 차단
  3. 신규 컴포넌트는 366px 강제 검증을 빌드 체크리스트에 포함
- **참조**: conventions.md "모바일 최적화 체크리스트" / lessons.md "Phase 9-Mobile 안티패턴 재발"
- **참조횟수**: 0

### [2026-04-29] Avatar 영문 텍스트 박스 밖 overflow (clamp + overflow:hidden 누락)
- **분류**: error (UI)
- **발견자**: pm + 사용자
- **증상**: 모바일에서 Avatar 컴포넌트가 박스 모양은 유지되나 내부 영문/이니셜 텍스트가 박스 경계를 넘어 튀어나옴. 한글은 정상, 영문 닉네임 시 발생.
- **원인**: (1) Avatar에 `font-size`만 px 고정 → 컨테이너가 작을 때 글자가 박스보다 큼. (2) `overflow: hidden` 누락 → 부모 박스가 자식 텍스트를 잘라주지 못함. (3) 영문 한 글자가 한글보다 폭이 넓어 같은 px에서도 한글은 안 튀어나오나 영문은 튀어나옴.
- **해결**: Avatar 컴포넌트에 (a) `font-size: clamp(10px, 4vw, 16px)` (b) `overflow: hidden` (c) `display: flex; align-items: center; justify-content: center` 3종 동시 적용.
- **재발 방지**:
  1. 텍스트가 들어가는 작은 박스(Avatar/Badge/Tag)는 **clamp font-size + overflow:hidden 쌍**을 default로
  2. 한글로만 테스트하지 말 것 — 영문/숫자 닉네임 케이스 추가 (DilDeRabbits / 5pointGuards 같은 폭 넓은 영문)
- **참조**: conventions.md "모바일 최적화 체크리스트" 8번 항목
- **참조횟수**: 0

### [2026-04-20] 다음카페 상세 HTML에 시간 소스가 `.num_subject` 단 하나 (함정)
- **분류**: error (외부 시스템 함정, 재발 위험: 파서 확장 시)
- **발견자**: pm + Explore (실측 tmp/cafe-debug-article-IVHA-{3919,3920,3923,3924,3925}.html 5건)
- **증상**: `extractPostedAt()`가 5/5 글 모두 `null` 반환. sync-cafe dry-run 출력에 `postedAt: null` 반복. `r.postedAt ?? it.postedAt` fallback으로 목록값이 덮어 실피해는 없으나 코드 위생 악화.
- **원인**: 상세 페이지 HTML에 파서가 찾던 모든 소스(`articleElapsedTime` JS 변수, `regDttm`/`createdAt` JS 변수, `<script type="application/ld+json">` datePublished)가 **전부 존재하지 않음**. 유일한 시간 소스는 `<span class="num_subject">...</span>` DOM 요소.
- **해결**: `extractPostedAt()` 4번째 fallback으로 `$("span.num_subject").first().text()` 추가. `parseCafeDate`가 이미 `"HH:MM"`/`"YY.MM.DD"` 두 형식 지원 (article-fetcher.ts `c84aba0`).
- **예방**:
  - 다음카페 상세 파서를 수정하거나 추가 필드(수정일/좋아요수/조회수 등)를 뽑을 때 **HTML 덤프 실측 필수** (`--debug` 플래그)
  - `articleElapsedTime`/`regDttm`/`JSON-LD`는 **목록 페이지에만 존재**하고 상세에는 없음 (목록 ≠ 상세 구조)
  - 당일 글 vs 과거 글 샘플 둘 다 수집해 비교

### [2026-04-17] API 미들웨어(apiSuccess의 convertKeysToSnakeCase) 놓치고 컴포넌트 인터페이스 거꾸로 변환
- **분류**: error (**재발 7회**, 2026-04-29 organizations/apply에서 또 발견 — `data.data?.status`/`data.data?.slug` 접근 → "단체 신청 사일런트 실패 + /organizations/undefined 리다이렉트")
- **발견자**: pm + 사용자 + tester + reviewer
- **증상**: `/games` 카드의 시각/장소/가격이 안 뜸. 진단 시 "API 응답이 camelCase인데 컴포넌트가 snake_case 기대"로 잘못 판단해 컴포넌트를 camelCase로 통일 → 모든 필드 undefined로 폴백. **2026-04-19 M1 Day 7**: `/profile`의 `followersCount/followingCount/nextGame` 3필드가 페이지에서 camelCase로 접근 → 팔로워/팔로잉 항상 0, 다음 경기 항상 "없음"으로 표시 (사일런트 버그). **2026-04-20 M6**: ① `src/app/(web)/layout.tsx`에서 헤더 알림 뱃지가 `data.unreadCount`로 접근 → **헤더 뱃지 자체가 무용지물**(항상 0)이었음. M6 작업 중 발견·수정. ② `src/components/shared/header.tsx` L61/L72 동일 패턴 (dead code, 정리 권장). ③ **[해소됨 2026-04-20]** `src/app/(referee)/referee/_components/notification-bell.tsx` L86 + `referee/notifications/page.tsx` L90 — `json?.data` 접근(apiSuccess는 `{data:...}` 래핑 X)을 `json` 직접 접근으로 교체 + 주석 가드 추가. referee 벨 뱃지/드롭다운/전체 알림 페이지 모두 정상화.
- **원인**: `src/lib/api/response.ts:5` `apiSuccess(data) → NextResponse.json(convertKeysToSnakeCase(data))`. route.ts에서 camelCase로 직렬화하는 것처럼 보여도 미들웨어가 다시 snake_case로 변환. **route.ts 코드만 보고 응답 형태 추정 금지.**
- **해결**:
  1. `curl` 또는 DevTools Network 탭으로 raw 응답 확인 → 컴포넌트 인터페이스를 응답 형태에 맞게 정합 (snake_case 유지)
  2. 프로젝트 컨벤션: API 응답 = snake_case (Flutter 호환), TS 내부 = camelCase
- **재발 방지**:
  1. **API 응답 인터페이스 변경 전 반드시 `curl` 1회** — 코드 추정 금지
  2. **신규 필드 추가 시 프론트는 반드시 snake_case로 받기** — 서버가 camelCase 반환해도 apiSuccess가 변환함
  3. 같은 종류 버그 5회 재발 — fetcher 래퍼로 일괄 역변환(`convertKeysToCamelCase`) 적용 검토 시급
- **참조**: lessons.md "API 미들웨어 변환을 잊고 컴포넌트 인터페이스를 거꾸로 바꿈"
- **참조횟수**: 1
- **승격됨**: CLAUDE.md 2026-04-19 (5회 재발로 핵심 가드 승격)

### [2026-04-17] Next.js 16 next/image 외부 호스트 미허용 (카카오 CDN 2종 누락)
- **분류**: error
- **발견자**: debugger
- **증상**: `Invalid src prop (http://img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg) on next/image, hostname "img1.kakaocdn.net" is not configured under images in your next.config.js` — userId 2862 카카오 가입자 프로필 렌더링 중 발생
- **원인**: `next.config.ts`의 `images.remotePatterns`에 `k.kakaocdn.net`, `p.kakaocdn.net`만 있고 **썸네일 프록시(`img1.kakaocdn.net`)**와 **기본 프로필 원본(`t1.kakaocdn.net`)**이 빠져 있었음. 카카오 OAuth 기본 프로필은 `img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg` 구조로, 실제로 2개 호스트를 동시에 타므로 둘 다 허용 필요. 추가로 에러 URL이 http였음 — OAuth 제공자가 http/https 섞어 내려주는 경우 있음.
- **해결**: `remotePatterns`에 4개 엔트리 추가 — `img1.kakaocdn.net`(http/https × pathname=/thumb/**) + `t1.kakaocdn.net`(http/https × pathname=/account_images/**). `pathname` 제한으로 임의 경로 오남용 차단.
- **재발 방지**:
  1. OAuth 제공자(카카오/네이버/구글) 추가 시 **CDN 도메인 패턴을 함께 등록** — 로그인 CDN만이 아니라 프로필 썸네일 프록시까지
  2. `remotePatterns`는 가능하면 `pathname: "/특정경로/**"`로 범위 제한 (보안 + 오남용 방지)
  3. `next.config.ts` 수정 후 dev 서버 **재시작 필수** (HMR 미반영)
- **참조**: conventions.md "next/image 외부 호스트 등록 패턴"(승격 후보)
- **참조횟수**: 0

### [2026-04-16] sticky 셀 가로 스크롤 겹침 — 배경 투명 + z-index 누락 이중 원인
- **분류**: error (UI)
- **발견자**: pm
- **증상**: 박스스코어 모바일 가로 스크롤 시 sticky 번호/이름 컬럼 뒤로 다른 스탯 숫자가 비쳐 겹쳐 보임
- **원인 2개 동시 발생**:
  1. `<tr>` 배경이 `transparent` → sticky 셀 `bg-inherit`도 투명 → 뒤 콘텐츠 비침
  2. sticky 셀에 `z-index` 없음(기본 auto) → 스크롤되는 셀이 앞 레이어에 그려짐
- **해결**: (a) 모든 tr 배경 불투명화(`var(--color-card)` + `color-mix`로 zebra), (b) sticky 셀에 `z-10` 명시
- **재발 방지**: sticky 셀 규칙 — **불투명 배경 + 명시적 z-index** 쌍은 항상 같이
- **참조**: conventions.md "sticky 셀 규칙"
- **참조횟수**: 0

### [2026-04-16] Chrome @page CSS를 가상 프린터(Hancom PDF)가 무시
- **분류**: error (platform limit)
- **발견자**: pm (사용자 제보)
- **증상**: `@page { size: A4 landscape }` 지정해도 **Hancom PDF 프린터**로 저장하면 세로 방향 PDF 생성
- **원인**: Chrome "PDF로 저장"은 @page를 존중하지만, Hancom PDF 같은 Windows 가상 프린터는 OS 드라이버를 경유해 @page를 무시하고 드라이버 기본값 사용
- **해결**: 웹에서 강제 불가 (브라우저/OS 레벨). 사용자에게 "프린터를 Chrome 'PDF로 저장'으로 변경" 안내 배너 + "인쇄 방향: 가로" 수동 선택 가이드
- **잘못된 시도**: `html, body { width: 297mm !important }` 강제 → Chrome PDF 메타데이터 더 깨짐 (롤백)
- **재발 방지**: 프린트 기능 추가 시 **표준 @page 키워드**(A4 landscape)만 쓰고 불가능한 OS 제어는 UI 안내로 대체
- **참조**: lessons.md "브라우저 프린트 API 한계"
- **참조횟수**: 0

### [2026-04-16] 프린트 `<th>` center vs `<td>` left 기본값 불일치 — 정렬 깨짐
- **분류**: error (UI)
- **발견자**: pm (사용자 제보)
- **증상**: 프린트된 박스스코어에서 헤더와 데이터 행의 숫자 컬럼이 살짝 어긋남
- **원인**: HTML 기본 정렬이 `<th>` center, `<td>` left. 숫자 컬럼(MIN/PTS/FG)이 서로 다른 축으로 정렬됨. 추가로 `td:nth-child(2) { max-width }`만 적용하고 `th`엔 미적용이라 이름 폭 차이로 뒤 컬럼 밀림
- **해결**: 프린트 영역 th/td 모두 `text-align: center` + `table-layout: fixed` + `th:nth-child(n)`와 `td:nth-child(n)` 폭 둘 다 제어
- **재발 방지**: 프린트 테이블은 **table-layout: fixed + 명시적 정렬/폭** 쌍으로
- **참조횟수**: 0

### [2026-04-15] 신규 파일 git add 누락 → 로컬은 OK인데 원격 Vercel 빌드 실패
- **분류**: error
- **발견자**: pm (원영 핫픽스 `d94beb6`로 문제 파악)
- **증상**: Phase 2B 커밋(c53fb71)에서 `@/lib/validation/team` import는 했지만 **실제 파일은 로컬에만 있고 원격엔 없음**. 로컬 tsc/dev 서버 모두 정상 → 커밋/푸시/dev 머지까지 문제 없어 보임 → Vercel 빌드에서 `Module not found: Can't resolve '@/lib/validation/team'`로 실패.
- **원인**: `git status`에 `??` (Untracked)로 표시된 신규 파일을 add하지 않고 커밋함. `git add -A`/`git add .`를 안 쓰고 특정 파일만 add하는 워크플로의 단점.
- **해결**: 원영님이 dev/main에 응급으로 `validation/team.ts` 최소 버전 직접 추가 (d94beb6, 9d64342). 이후 수빈이 Phase 2C에서 완전판으로 확장.
- **재발 방지**:
  1. 커밋 전 `git status --short` 실행 → `??` 표시된 신규 파일이 커밋 대상에 포함되는지 **매번** 확인
  2. 신규 파일이 import되는 시점(같은 커밋)에 함께 add
  3. Vercel preview 빌드가 꺼져있는 개인 브랜치(subin)는 머지 전까지 문제가 숨겨질 수 있음 — dev 머지 후 즉시 Vercel dev preview 체크
- **참조**: lessons.md "신규 파일 add 누락 방지"
- **참조횟수**: 0

### [2026-04-15] 🚨 prisma db push --accept-data-loss로 타 브랜치 테이블 drop 사고 (최우선)
- **분류**: error (중대한 운영 사고 위험)
- **발견자**: pm
- **증상**: Team 모델에 컬럼 추가 목적으로 `npx prisma db push --accept-data-loss` 실행. 그런데 schema.prisma에 정의 안 된 테이블 4개가 drop됨 — associations(20rows), association_admins(1row), referees(1row), referee_documents(1row). subin-referee 브랜치에서 작업 중이던 Referee 시스템 테이블이 전부 사라짐.
- **원인**: `db push`는 "schema ↔ DB 완전 동기화" 명령. 현재 브랜치 schema에 없는 테이블은 "불필요한 잔재"로 판단해 삭제 시도. `--accept-data-loss` 플래그가 이를 허용. 브랜치마다 schema가 다르게 진화 중인 상황에서 위험.
- **해결**: subin-referee 브랜치의 schema.prisma에서 Referee 시스템 14개 모델을 현재 schema에 통합 복사 → 재 `db push`로 테이블 구조 복원. 데이터는 손실 (개발 DB라 허용, 운영 DB였으면 대참사).
- **재발 방지**:
  1. 브랜치별로 독립 schema 작업 중일 때는 `db push --accept-data-loss` **절대 금지**
  2. 대신 `prisma migrate dev --create-only`로 마이그레이션 파일만 생성 후 수동 검토
  3. schema 차이가 큰 경우 `db pull`로 현재 DB 상태를 schema에 먼저 가져온 뒤 수정
  4. 운영 DB에는 절대 db push 실행 금지 (CLAUDE.md 최상단 규칙 재확인)
- **참조횟수**: 0

### [2026-04-12] Turbopack dev: "Jest worker encountered N child process exceptions"
- **분류**: error
- **발견자**: pm (사용자 제보)
- **증상**: 로컬 `npm run dev`(Next.js 16.1.6 Turbopack) 중 `Jest worker encountered 2 child process exceptions, exceeding retry limit` 런타임 에러. Vercel 배포/운영(mybdr.kr)에선 정상, 로컬에서만 발생.
- **원인**: Turbopack dev 서버는 HMR을 위해 Worker Pool을 메모리에 유지하는데, 짧은 시간에 여러 파일이 연속 수정되면 워커가 recompile을 겹쳐 받아 상태가 꼬이고 child process가 예외를 2회 이상 던지면 retry 한도를 넘어 에러. 코드 문법 이슈 아님 (빌드/운영은 멀쩡).
- **해결**: (1) 포트 기반 dev 서버 재시작 — `netstat -ano | findstr :3001` → 해당 PID만 `taskkill //f //pid <PID>` → `npm run dev`. (2) 안 되면 `.next` 삭제 후 재시작. **절대 `taskkill //f //im node.exe` 쓰지 말 것** (다른 프로젝트 dev 서버/Claude Code까지 죽음).
- **재발 방지**: 대량 파일 수정 시 중간에 dev 서버 한 번 재시작. 같은 PC에서 dev 서버 여러 개(worktree별) 동시 실행 시 메모리 압박 큼 — 하나씩만 돌리기. **신규 라우트/시드 추가 직후 첫 접근 전에도 재시작 권장**.
- **참조횟수**: 2 (2026-04-21 L3 재발 — 신규 라우트 `/organizations/[slug]/series/[seriesSlug]` + BDR 시리즈 시드 직후 첫 접근 시 동일 500. `.next` 삭제 + PID 재시작으로 200 / 0.28s 복구) (2026-05-01 재발 — 동호회최강전 데이터 대량 INSERT + Phase A 신규 2 파일 추가 + 다른 에이전트 Settings 박제 동시 변경 후 발생. PID 35872 단일 kill 로 해결)

### [2026-04-12] Prisma schema drift — users.gender 컬럼 누락 (db push 시 파괴적 DROP 예고)
- **분류**: error / trap
- **발견자**: developer (Commit 1 dry-run 중)
- **내용**: `prisma/schema.prisma`의 User 모델에 `gender` 필드가 없는데, 실제 DB(`users` 테이블)에는 `gender character varying nullable` 컬럼이 존재하는 drift 상태. 이 상태에서 `prisma db push`를 실행하면 Prisma가 "schema가 진리"라고 판단해 `ALTER TABLE "users" DROP COLUMN "gender"`를 자동 생성 → 운영/개발 DB에서 컬럼과 데이터가 파괴됨.
- **원인 추정**: Rails → Next.js 마이그레이션 당시 `prisma db pull`이 누락했거나 이후 수동 삭제된 필드. schema는 쓰지 않지만 DB에는 legacy 컬럼이 남아 있음.
- **해결 방법 (이번 적용)**:
  1. 신규 모델 추가 후 **반드시 `prisma migrate diff --from-schema-datasource ... --to-schema-datamodel ... --script`로 전체 SQL 미리보기**
  2. 기존 테이블에 대한 `ALTER TABLE`/`DROP`이 발견되면 **즉시 중단**
  3. `information_schema.columns`에서 해당 컬럼의 정확한 타입/nullable/default 조회
  4. Prisma 타입으로 역매핑하여 schema에 해당 필드 1줄 복원 (예: `gender String? @db.VarChar`)
  5. 재 dry-run으로 기존 테이블 변경 0건 확인 후 push
- **예방**: 신규 테이블만 추가하는 작업에서도 **항상 dry-run 전체를 눈으로 검토**. `CREATE TABLE`만 있을 것이라는 가정 금지. 브랜치 격리 DB 전략 하에서는 특히 중요 (다른 worktree/원본과 DB 공유).
- **참조**: decisions.md "심판 v2 최종확정 - TournamentMatch 단독 FK" 직전 항목들
- **참조횟수**: 0

### [2026-03-23] YouTube Search API order=viewCount 정렬 부정확
- **분류**: error
- **발견자**: pm (디버깅 과정에서)
- **내용**: YouTube Search API에 `order=viewCount`를 지정해도 실제 조회수 순서와 다른 결과를 반환함. 실제 10,092뷰 영상이 1,518뷰 영상보다 낮은 순위로 나옴.
- **해결**: Search API 대신 playlistItems API로 최대 150개(3페이지)를 가져와서 Videos API로 실제 조회수를 조회한 뒤 서버에서 정렬.
- **쿼터 비교**: Search API 200쿼터/호출 vs playlistItems+Videos 6쿼터/호출
- **참조**: decisions.md "YouTube 인기 영상" / lessons.md "YouTube API"
- **참조횟수**: 1

### [2026-03-23] 라이트모드 CSS 변수 미적용 (html.light 클래스 누락)
- **분류**: error
- **발견자**: developer
- **내용**: globals.css에 `html.light { }` 블록으로 라이트모드 변수를 정의했는데, ThemeToggle 컴포넌트가 `dark` 클래스만 제거하고 `light` 클래스를 추가하지 않아서 라이트모드 변수가 적용되지 않았음. 또한 layout.tsx/slide-menu.tsx에 하드코딩된 다크 색상(#131313, #111111 등)이 30곳 이상 있어서 테마 전환 시 색상이 안 바뀌는 문제도 있었음.
- **해결**: (1) ThemeToggle에서 dark/light 클래스 동시 토글. (2) layout.tsx, slide-menu.tsx의 하드코딩 색상을 CSS 변수로 교체.
- **예방**: 새 컴포넌트 작성 시 하드코딩 색상 대신 반드시 CSS 변수(var(--color-*)) 사용.
- **참조**: lessons.md "라이트/다크 테마 전환"
- **참조횟수**: 1

### [2026-03-23] admin 페이지 레이아웃 이중 적용 (로드 안 됨)
- **분류**: error
- **발견자**: debugger
- **내용**: admin이 `(web)` 라우트 그룹 안에 있어서 `(web)/layout.tsx` 사이드바+헤더+하단네비가 admin에도 적용됨. admin/layout.tsx의 AdminSidebar와 겹쳐서 콘텐츠가 밀리고 로드 안 되는 것처럼 보임.
- **해결**: `src/app/(web)/admin/` → `src/app/(admin)/admin/`으로 라우트 그룹 분리.
- **예방**: 독립 레이아웃이 필요한 섹션(admin, auth 등)은 별도 라우트 그룹으로 분리.
- **참조횟수**: 0

### [2026-03-25] apiSuccess 응답에 .data로 접근하는 버그 (존재하지 않는 래핑)
- **분류**: error
- **발견자**: debugger
- **내용**: `apiSuccess()`는 전달받은 객체를 snake_case 변환 후 **직접** JSON 응답으로 반환한다. `{ data: ... }` 래핑이 없다. 그런데 클라이언트에서 `response.value.data.teams` 같이 `.data`를 한 단계 더 거쳐 접근하면 항상 `undefined`가 되어 fallback만 표시된다.
- **해결**: `.value.data.X` -> `.value.X`로 수정. 또한 apiSuccess가 snake_case 변환을 하므로 camelCase 키(`careerAverages`)가 아닌 snake_case 키(`career_averages`)로 접근해야 한다.
- **예방**: API 응답 접근 시 항상 (1) apiSuccess에 data 래핑이 없음을 기억하고, (2) 응답 키가 snake_case로 자동 변환됨을 고려할 것.
- **영향 파일**: right-sidebar-guest.tsx, right-sidebar-logged-in.tsx (총 6곳), tournament-tabs.tsx (4개 탭 전부)
- **재발 (2026-04-13)**: tournament-tabs.tsx에서 동일 패턴 재발. fetcher에 convertKeysToCamelCase() 적용하여 snake_case→camelCase 자동 변환으로 해결.
- **참조횟수**: 1

### [2026-03-28] categories JSON이 boolean/array 혼용 — Array.isArray 체크 필수
- **분류**: error
- **발견자**: debugger
- **내용**: 디비전 마이그레이션 후 Tournament.categories가 `{"general": true}` (boolean) 형태로 저장됨. 기존 코드는 `{"general": ["D6","D7"]}` (array) 형태를 기대하고 `.map()`/`.join()` 호출 → `true.map is not a function` 에러.
- **해결**: `Array.isArray(divs)` 체크 후 분기. boolean이면 카테고리명으로 대체.
- **예방**: JSON 필드 접근 시 항상 타입 체크. 마이그레이션으로 형식이 바뀔 수 있음.
- **영향 파일**: tournaments/[id]/page.tsx, tournament-about.tsx
- **참조횟수**: 0

### [2026-04-02] 커뮤니티 맞춤 필터 미적용 — setLoggedIn 이중 호출 경쟁 조건
- **분류**: error
- **발견자**: debugger
- **내용**: `header.tsx`와 `layout.tsx`가 각각 독립적으로 `/api/web/me`를 fetch한 후 `setLoggedIn`을 호출함. `layout.tsx`는 `setLoggedIn(true, preferEnabled)`로 올바르게 호출하지만, `header.tsx`는 `setLoggedIn(true)`로 preferEnabled 없이 호출. preferEnabled가 undefined이면 `preferDefault = false`로 설정되므로, header.tsx 호출이 나중에 실행되면 맞춤 필터가 꺼짐. 결과적으로 커뮤니티 API에 `prefer=true`가 전달되지 않아 모든 게시판이 표시됨.
- **해결**: header.tsx의 `setLoggedIn(!!userData)` 호출 제거 (layout.tsx에서 이미 처리) 또는 preferEnabled 전달 추가.
- **예방**: 전역 상태를 설정하는 함수는 **한 곳에서만** 호출할 것. 여러 컴포넌트가 동일 상태를 독립적으로 초기화하면 경쟁 조건(race condition) 발생.
- **영향 파일**: header.tsx (60행), layout.tsx (372행), prefer-filter-context.tsx
- **참조횟수**: 0

### [2026-03-29] SWR GET 응답과 POST 409 응답의 정보 불일치로 UI 분기 누락
- **분류**: error
- **발견자**: debugger
- **내용**: 코트 체크인 UI에서 조건 분기가 3단계로 나뉘어 있었음. (1) isCheckedInElsewhere (SWR GET) → 메시지만, 버튼 없음. (2) checkedInCourtId (POST 409) → 버튼 있음. 페이지 진입 시 GET만 호출되므로 (1)에 걸려서 "체크인 중인 농구장 보기"와 "체크아웃" 버튼이 표시되지 않았음.
- **해결**: GET API에서 다른 코트 체크인 시 court_name도 반환하도록 수정. UI에서 SWR 데이터 변경 시 useEffect로 checkedInCourtId/Name state를 설정하여 버튼이 있는 분기로 통합.
- **예방**: API 응답 설계 시 GET과 POST 에러 응답의 정보를 일관되게 유지할 것. UI 조건 분기에서 같은 상태를 다른 경로로 도달할 수 있는지 확인할 것.
- **영향 파일**: api/web/courts/[id]/checkin/route.ts, court-checkin.tsx
- **참조횟수**: 0

### [2026-04-02] Next.js 개발서버 무한 로딩 (hung 상태, 메모리 1.67GB)
- **분류**: error
- **발견자**: debugger
- **내용**: 개발서버(PID 106908)가 메모리 1.67GB를 사용하며 모든 HTTP 요청에 응답하지 않는 hung 상태. 커뮤니티뿐 아니라 홈(/), 로그인(/login), API(/api/web/me) 등 모든 엔드포인트가 타임아웃. curl --max-time 5로 테스트 시 HTTP 응답 코드 000 (연결은 되지만 응답 없음). 코드 자체에는 tsc 에러 없고, DB 쿼리(Prisma)도 별도 프로세스에서는 정상 동작. hidden_menus 컬럼도 DB에 이미 존재 확인됨. 개발서버 프로세스 자체가 과부하로 멈춘 상태.
- **해결**: 개발서버 재시작 필요. (1) `netstat -ano | findstr :3001`로 PID 확인 (2) `taskkill //f //pid <PID>`로 해당 프로세스만 종료 (3) `npm run dev`로 재시작. 주의: `taskkill //f //im node.exe`는 다른 node 프로세스도 죽이므로 절대 사용 금지.
- **예방**: 개발서버가 장시간 실행되며 메모리 누수/과부하가 쌓일 수 있음. 응답이 멈추면 코드 에러 의심 전에 먼저 개발서버 메모리와 프로세스 상태를 확인할 것. Turbopack 대신 webpack 모드 사용 검토.
- **참조횟수**: 0
