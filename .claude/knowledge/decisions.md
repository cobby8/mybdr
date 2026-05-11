# 기술 결정 이력
<!-- 담당: planner-architect | 최대 30항목 -->
<!-- "왜 A 대신 B를 선택했는지" 기술 결정의 배경과 이유를 기록 -->

### [2026-05-12] settings JSON 단일 UPDATE 통합 패턴 — Phase 4 timeouts + Phase 5 signatures
- **분류**: decision/pattern (Prisma JSON 컬럼 박제)
- **결정 사항**:
  - 동일 row 의 settings JSON 에 여러 키를 박제할 때 (timeouts / signatures / recording_mode 등) **단일 prisma.update** 로 통합 처리
  - 패턴:
    ```ts
    if (input.timeouts || input.signatures) {
      const base = { ...(match.settings as Record<string, unknown>) };
      if (input.timeouts) base.timeouts = { ... };
      if (input.signatures) base.signatures = { ... };
      await prisma.tournamentMatch.update({ where, data: { settings: base } });
    }
    ```
  - 둘 다 미전송 = UPDATE skip (운영 DB 부하 0)
  - match.settings 가 null / array / primitive 시 빈 객체에서 시작 (방어)
  - 기존 키 (recording_mode 등) 자동 보존 (object spread)
- **대안 비교**:
  - (A) 키별 분리 UPDATE 2회 → DB 왕복 2회 + race condition 위험 ❌
  - (B) 단일 UPDATE 통합 ✅ (채택)
  - (C) Prisma JSON merge 연산자 (Postgres `||`) → Prisma 미지원 / raw SQL 필요 ❌
- **재사용 위치**: 동일 row 의 settings JSON 에 여러 키 박제하는 모든 BFF (FIBA Phase 6 PDF 인쇄 시 settings.print_history 등 추가 시 동일 패턴 적용)
- **참조횟수**: 0

### [2026-05-11] 유소년 매직링크 토큰 정책 — CSPRNG 32바이트 hex + DB UNIQUE + 만료 분리
- **분류**: decision/security (apply_token / claim_token)
- **결정 사항**:
  - **엔트로피**: `randomBytes(32).toString('hex')` = 256bit / 64자. 추측 불가.
  - **DB UNIQUE INDEX**: tournament_teams.apply_token + claim_tokens.token (서로 다른 모델). 중복 방지 + 빠른 검색.
  - **만료 분리**: 토큰 컬럼 + 만료 컬럼 분리 (apply_token_expires_at) — 만료 검증 단순화. URL은 만료 시 null로 화면 노출.
  - **D-Day 계산**: tournament.startDate +7일 (있을 때) / fallback createdAt +30일 (UTC `setUTCDate`).
- **사유**:
  - 추측형 토큰(짧은 코드)은 brute-force 위험 → 256bit CSPRNG.
  - URL 외부 노출 가정(코치/학부모 메신저 공유) → 만료 분리로 정책 유연.
- **참조횟수**: 0

### [2026-05-11] DB 단일 정책 UNIQUE 추가 우회 패턴 — @unique 일시 제거 후 별도 SQL CREATE INDEX
- **분류**: decision/db-ops (운영 DB 무중단 UNIQUE 추가)
- **상황**:
  - `prisma db push` 시 신규 UNIQUE constraint 추가는 `--accept-data-loss` flag 요구 (실제 데이터 손실 0건임에도).
  - CLAUDE.md 절대 금지 룰: `prisma db push --accept-data-loss` 운영 DB ❌.
- **결정 사항** (옵션 B 사용자 승인):
  1. schema.prisma 의 `@unique` 일시 제거 → `prisma db push --skip-generate` (컬럼만 ADD)
  2. `prisma db execute --file ...sql` 로 `CREATE UNIQUE INDEX` 직접 실행 (additive — DROP 0건)
  3. schema.prisma 의 `@unique` 복원 (DB와 sync 유지)
- **재사용 위치**: 운영 DB에 신규 UNIQUE 추가 시 동일 패턴 (옵션 A `--accept-data-loss`는 절대 금지).
- **참조횟수**: 0

### [2026-05-11] 웹 종이 기록지 Flutter ↔ 웹 데이터 호환 전략 — sync API 재사용 + BFF wrap + strict lock
- **분류**: decision (Flutter API 호환 / 신규 페이지 통합 전략)
- **결정자**: planner-architect (본 turn 기획 / 사용자 결재 5건 대기)
- **참조횟수**: 0
- **선택**: `POST /api/v1/tournaments/[id]/matches/sync` 단일 매치 sync API **그대로 재사용** + 웹 BFF `/api/web/score-sheet/[matchId]/submit` 로 wrap (web 세션 → API token 변환 server-to-server fetch). Flutter 기록앱과 **단일 source 박제 path** 통합.
- **사유**:
  1. sync API 가 이미 `MatchPlayerStat` 22 필드 + `quarterScores` + `play_by_plays` + status 전체 박제. 재구현 = 0.
  2. completed 신규 전환 시 `waitUntil(triggerMatchBriefPublish)` 내장 (5/9 fix) → 알기자 자동 발행 + dual_tournament 진출 자동.
  3. `updateScoreForBatchEvents` / `progressDualMatch` / `advanceWinner` / `updateTeamStandings` 모두 자동 호출 → 라이브/박스스코어/통산 자동 갱신.
  4. Flutter v1 코드 변경 0 → 원영 사전 공지 불필요 (CLAUDE.md 룰 준수).
- **대안 (기각)**:
  - **신규 테이블 + 별도 API**: sync 와 별도 박제 → 라이브/박스스코어/통산/알기자 모두 재구현 (수십 PR). 단일 source 깨짐.
  - **Flutter sync API 직접 호출 (browser)**: JWT 노출 위험 + CORS. BFF wrap 으로 회피.
  - **prisma 직접 update from web**: sync API 의 보정 로직 (BUG-04 quarterScores 정합 / dual 자동 진출 / waitUntil) 누락 → 재발 위험.
- **충돌 가드 (Flutter ↔ 웹 동시 진행)** — **2026-05-11 사용자 결재 = 매치별 mode 게이팅 (결재 3)**:
  - `TournamentMatch.settings.recording_mode` JSON 필드 신설 (`"flutter" | "paper"`). 기본값 = `"flutter"` (운영 그대로).
  - 매치 생성/배정 시 운영진(admin/organizer)이 매치별 mode 선택. 한 매치 = 한 mode만. 충돌 자체 차단.
  - **Flutter API server-side 차단**: `/api/v1/matches/[id]/sync` + `batch-sync` + `[id]/status` 라우트가 `settings.recording_mode === "paper"` 면 403 반환. Flutter v1 코드 0 변경 (서버만 가드 추가).
  - **웹 폼 server-side 차단**: `/api/web/score-sheet/[matchId]/submit` 가 `recording_mode === "flutter"` 면 403.
  - **mode 전환**: completed 매치 score 보정 케이스 = admin 만 mode 강제 변경 가능. audit `mode_switch` + 사유 박제.
  - last-write-wins 위험 = mode 토글로 원천 차단. strict lock 보다 강한 룰.
- **저장 단위**: 배치 (최종 제출 1회 sync). 임시 저장 = localStorage / draft. 실시간 입력은 Flutter 기록앱 영역.
- **검증**: client (즉시 alert) + server (sync 직전 zod schema + 비즈니스 룰). 룰 = 합산 정합 / 5반칙 자동 표시 / 팀파울 5+ FT 안내. 데이터 오류 = 422.
- **권한**: web 세션 (`getAuthUser`) + `tournament_recorders` OR `organizer` OR `tournamentAdminMember` OR `super_admin`. 신규 헬퍼 `requireScoreSheetAccess(matchId, userId)` (requireRecorder 의 web 세션 대응판).
- **PBP 정책**: Phase 1~4 = PBP 0 (단순 boxscore + quarter score). Phase 5 시계열 입력 = local_id 접두 "paper-fix-{uuid}" + description "[종이 기록]" — Flutter sync 시 자동 삭제 보호 (이미 매치 132 운영자 수동 보정 보호 룰 활용).
- **audit / 로그**: `tournament_match_audits.source = "web-score-sheet"` 신규 분류. score / status 변경 시 `admin_logs` warning + 사유 박제 (forfeit fix 5단계 절차 패턴 차용).
- **사용자 결재 5건 완료 (2026-05-11)**:
  1. Phase 우선순위 = **Phase 1+2 MVP** (3 PR / 1.5~2주)
  2. UX 디바이스 = **PC 우선 + 모바일 가드**
  3. 충돌 룰 = **매치별 mode 게이팅** (위 §충돌 가드 항목 — strict lock 보다 강한 룰)
  4. 작전 타임아웃·팀파울 = **settings JSON 박제** (schema 변경 0)
  5. 인쇄 PDF = **Phase 6 후순위 보류**

### [2026-05-09] FIBA 5x5 forfeit (Art.21) 운영 표준 — 20-0 점수 + 통계 0 + audit 명시 박제
- **분류**: decision (대회 운영 / FIBA 룰 적용)
- **결정자**: PM (사용자 결재 — 5/9 #20 슬로우 vs MI 케이스)
- **참조횟수**: 0
- **선택**: FIBA 5x5 Article 21 (Forfeit) 표준 적용 — 사전 기권 시 **20-0** (이긴 팀 20 / 진 팀 0). 3x3 forfeit (21-0) 미적용.
- **사유**: 본 대회 (제21회 몰텐배 동호회최강전) = 5x5 정규 농구 (`tournament.format = "dual_tournament"` 5x5). 3x3 룰 적용 부적합.
- **운영 처리 절차**:
  1. `tournamentMatch.update`: status="completed" / homeScore=20 / awayScore=0 / winner_team_id (홈팀 또는 어웨이팀) / ended_at
  2. `tournament_match_audits` 별도 audit 박제 — context "MI 기권 forfeit 처리 — FIBA 5x5 Art.21 (20-0)"
  3. `notes` 컬럼 표준 형식 박제 — "{기권팀} 기권 (사유: {사유}) — FIBA 5x5 Art.21 forfeit 20-0"
  4. `progressDualMatch` 또는 `advanceWinner` 호출 → 진출 자동 처리
  5. `updateTeamStandings` 호출 → 전적 산정 (forfeit win/loss)
  6. 통계 = PBP/stat 0 (FIBA Art.21.4 — forfeit 매치 개인 stat 미적용)
- **반려 옵션**:
  - 21-0 (3x3 룰) — 종목 불일치
  - 별도 status="forfeit" enum 추가 — 현 단계 미필요 (notes + 사후 가드로 충분)
- **재사용**: 차후 forfeit 발생 시 본 절차 그대로 적용. 코드 자동 가드 = `auto-publish-match-brief.ts` `detectForfeit(notes)` 헬퍼 + `tab-summary.tsx` `summary_brief.forfeit === true` 분기

### [2026-05-09] 알기자 forfeit 매치 자동 발행 = LLM 우회 + 사전 정의 카피 (사실 왜곡 회피)
- **분류**: decision (LLM 가드 / 사전 카피 우선)
- **결정자**: PM (사용자 결재 — 5/9 #20 forfeit 매치)
- **참조횟수**: 0
- **선택**: forfeit 매치는 LLM brief route 호출 우회 + 사전 정의 카피 사용. summary_brief JSON 에 `forfeit: true` + `forfeit_reason` 메타 박음.
- **사유**: LLM (Gemini 2.5) 이 점수 (예: 20-0) 만 보고 "20점차 압승" / "대승" 류 카피 자동 생성 → forfeit 매치 (실 경기 미진행) 에 부적절. 사용자 직접 보고 = "기권승에 맞는 표현만 사용해야지".
- **카피 빌더 2 종**:
  - `buildForfeitPhase1Brief` (라이브 [Lead] 130~200자) — "{승팀}가 {라운드}에서 {사유로 경기 진행 불가}, FIBA Art.21 적용 {점수}-0(forfeit win) 처리"
  - `buildForfeitPhase2` (게시판 본기사 title + content) — "{승팀}, {패팀} 기권으로 {라운드} 부전승 — {사유} 사유" / 본문 4 단락
- **반려 옵션**:
  - LLM 에 forfeit 신호 전달 후 LLM 이 분기 작성 — LLM 결과 가변 / 안전성 떨어짐
  - 라이브 [Lead] / 게시판 양쪽 발행 자체 skip — 사용자 가시성 손실
  - 운영자 수동 작성 — 자동화 가치 손실 / forfeit 빈도 낮지만 수동 부담
- **재사용 (forfeit 매치 표시 영역)**:
  - 라이브 [Headline] 부제: `tab-summary.tsx` summaryBlocks 분기 ("기권승 (FIBA Art.21 · {사유} 사유)")
  - 라이브 Stats 4 카드: 처리 / 결과 / 공식 점수 / 사유 (점수차 분석 무의미 회피)
  - 알기자 게시판 카드: 사전 정의 본문 + draft 검수 후 publish

### [2026-05-09] 알기자 dual_tournament 구조 LLM 인지 — brief route 데이터 + prompts safety 양면 보강
- **분류**: decision (LLM 입력 데이터 + 가이드 양면)
- **결정자**: PM (사용자 결재 — 5/9 #19 "C조 1위 수성" 사실 오류)
- **참조횟수**: 0
- **선택**: B + A 조합 — brief route 가 사실 데이터 자동 산출 + prompts 가 추측 차단 가이드.
- **B (근본)**: `brief route` 가 매치별 산출 → `MatchBriefInput` type 확장 + LLM 입력에 명시:
  - `tournamentFormat`: "dual_tournament" 등
  - `roundContext`: 라운드 의미 자연어 (조 최종전 = 2/3위 결정전 / 조 승자전 = 1위 확정 / 8강 = 4강 진출 / 결승 = 우승 등)
  - `advancement`: next_match_id 기반 진출 narrative ("MZ → 8강 진출 (조 2위 자격) / 우아한스포츠 → 탈락 (조 3위)")
- **A (safety net)**: `alkija-system.ts` (Phase 1) + `alkija-system-phase2-match.ts` (Phase 2) 양쪽 system prompt 끝에 [Dual Tournament 구조 가이드] 단락 추가:
  - "조 최종전 단어만 보고 1위/우승/결승 표현 금지"
  - "조 최종전 = 조 2위/3위 결정전 (조 1위는 이미 승자전에서 결정)"
  - "입력 [매치 결과 진출] narrative 그대로 인용"
  - "명시되지 않은 순위 (1위/2위/3위) 절대 추측 금지"
- **반려 옵션**:
  - 사후 검증 (publish 후 키워드 reject) — LLM 결과 가변, 자동화 한계
  - 사전 정의 카피 (forfeit 처럼) — 단조로움 / LLM 가치 손실
  - prompts 만 강화 (B 미적용) — 데이터 없이 가이드만 → 효과 약함
- **재사용**: 다른 토너먼트 포맷 (single_elimination / round_robin) 도 동일 패턴 — `roundContext` 분기에 케이스 추가 + prompts 가이드 확장
- **commit**: `8963dae` (PR #303→#304)

### [2026-05-09] 마이페이지 "내 농구" (`/profile/basketball`) 공개프로필 흡수 + 본인 전용 강화 — Q1~Q6 결재 대기
- **분류**: decision (마이페이지 / 공개프로필 super-set / 본인 전용 영역)
- **결정자**: planner-architect (사용자 결재 대기 — Q1~Q6 모두 추천 안 일괄 채택 권장)
- **참조횟수**: 0
- **배경**: 사용자 의뢰 5/9 — *"마이페이지의 내농구가 공개프로필 페이지를 더 자세하게 확인할 수 있는 페이지가 되는게 좋을거 같아"*. 운영 `/profile/basketball` (239L client SWR) = 공개프로필 (Phase 1+2) 대비 빈약 (3열 통계 / 단순 TossListItem 최근경기 / 활동로그 0 / 모달 0 / Hero 0 / jerseyNumber 0). 동시에 픽업게임 (game_applications) 정보는 운영 보존 필요.
- **9 본인 전용 가치 분석**:
  - ★★★ A. pending 신청 — team_join_requests + team_member_requests (jersey/dormant/withdraw) + team_transfers (5/5 PR10) — 즉시 가능, 3 테이블 통합
  - ★★ D. 트렌드 차트 — 통산 모달 데이터 재활용 가능 (후속 큐)
  - ★★ H. 다음 매치 (대회) — tournamentMatch.scheduled + ttp 매핑
  - ★ B. 게임 로그 페이지네이션 — 통산 모달 "전체" 탭이 이미 역할. 별도 페이지 비용 vs 효용 낮음
  - ★ E. Splits (홈/원정/승/패/월별) — 가능하나 모달 탭 폭주 (별도 PR 큐)
  - ❌ C. 개인 목표 — schema 신규 필요 (user.season_goal_*)
  - ❌ F. Reviews (받은 평가) — Q1 player kind 도입 후속
  - ❌ G. 알림/메시지 — 마이페이지 hub 가 이미 노출, 본 페이지 = 농구 도메인 한정
  - ❌ I. 슛 차트 — shot_zone_stat cron 미동작
- **10 영역 신규 구조**:
  1. ① pending 신청 카드 (신규 / 0건이면 hidden) — Q3
  2. ② Hero (PlayerHero 재사용 — isOwner 분기 추가)
  3. ③ 통산 8열 + [더보기] (CareerStatsGrid 추출 / StatsDetailModal cross-route)
  4. ④ ActivityLog 5건 재사용
  5. ⑤ 최근 경기 PlayerMatchCard 5건 (Phase 1 재사용)
  6. ⑥ 소속 팀 풀 리스트 (운영 보존)
  7. ⑦ 참가 대회 (운영 보존 — `#my-tournaments` anchor 보존)
  8. ⑧ 다음 매치 (대회) 카드 (신규 / 0건이면 hidden) — Q4
  9. ⑨ 픽업 게임 신청 현황 (운영 game_applications 보존)
  10. ⑩ 주간 리포트 링크 (운영 보존)
- **6 결재 추천**:
  1. **Q1=K-1 server component 전환** — 공개프로필과 일관 / Promise.all 14 쿼리 / SSR. K-2 (client SWR) / K-3 (hybrid) 거부
  2. **Q2=L-1 10 영역 모두** — 의뢰 의도 100%. L-2 (7) / L-3 (5) 거부 (정보 손실)
  3. **Q3=M-1 pending 3종 통합** — team_join + team_member_requests + team_transfers. M-2 (1종) 거부 (이적 신청 누락)
  4. **Q4=N-1 다음 매치 채택** — 작은 영역, 비용 낮음. hub 의 nextGame 은 픽업 + 매치 혼재 → 분리 의미
  5. **Q5=Y-2 CareerStatsGrid 글로벌 추출** — `src/components/profile/CareerStatsGrid.tsx`. 공개+본인 둘 다 사용 → 글로벌 격상 자연스러움. Y-1 (페이지 한정 + cross-route) 거부
  6. **Q6=W-1 시안 박제 (운영 동등 갱신)** — CLAUDE.md §🔄 운영 → 시안 동기화 룰 준수. 5/7 갭 재발 방지. W-2 (무수정) / W-3 (핵심 3 영역) 거부
- **회귀 0**: DB schema 0 / API 0 / Flutter v1 0 / 공개프로필 Phase 1+2 영향 0 (CareerStatsGrid JSX 동등 추출만) / 마이페이지 hub 0 / 픽업 게임 데이터 손실 0 (영역 ⑨ 보존)
- **5 step / ~120분**: (1) CareerStatsGrid 추출 15분 → (2,3 병렬) MyPendingRequestsCard 25분 + NextTournamentMatchCard 15분 → (4) page.tsx 재구성 35분 → (5) 시안 박제 + tester + reviewer 30분
- **신규 컴포넌트 3 (~310L)**: CareerStatsGrid (~80L) + MyPendingRequestsCard (~150L) + NextTournamentMatchCard (~80L)
- **수정 3**: page.tsx 239→500L / overview-tab.tsx ~50L 변동 (CareerStatsGrid 분리) / ProfileBasketball.jsx 198→600L (W-1 시안 박제)
- **참조**: `Dev/profile-basketball-private-2026-05-09.md` 13 섹션
- **선행**: Phase 1 `Dev/public-profile-nba-style-2026-05-09.md` + Phase 2 `Dev/public-profile-activity-stats-2026-05-09.md`

### [2026-05-09] 공개 프로필 활동 로그 + 통산 더보기 설계 (Phase 2) — Q1~Q8 일괄 추천 A
- **분류**: decision (공개 프로필 / NBA 스타일 Phase 2 / 활동 로그 / 통산 분해)
- **결정자**: planner-architect (사용자 결재 대기 — Q1~Q8 모두 A 추천)
- **참조횟수**: 0
- **배경**: Phase 1 (NBA 카드형 + 8열 통산) 완료 후 사용자 Image #13 요구 — (1) 활동 카드 단순 텍스트 → 5건 활동 로그 (2) 통산 우상단 [더보기] → 연도/대회별 모달 (3) 동시 발견 버그: 활동 "경기 참가 0" vs 통산 카드 2경기 (데이터 소스 불일치)
- **결정 핵심**:
  1. **Q1=A 활동 로그 5종 통합** — match (matchPlayerStat) + mvp (tournamentMatch.mvp_player_id) + team_history (joined/left/transferred) + jersey_changed (TeamMemberHistory.payload.old/new) + signup (user.createdAt). UNION 쿼리 4건 + 클라 sort
  2. **Q2=A 버그 fix 통일** — `activity.gamesPlayed = statAgg._count.id` (matchPlayerStat 통일). `total_games_participated` 카운터는 admin/leaderboard 가 사용 가능 → 컴포넌트에서만 분리 (백필은 별 작업)
  3. **Q3=A 모달 채택** — Phase 1 의 2탭 (Q1=A) 결정 보존. 별도 페이지 / 탭 추가 거부. 모바일 풀스크린 / Escape 닫기 / body scroll lock
  4. **Q4=A activity-log.tsx 페이지 한정** + **Q6=A stats-detail-modal.tsx 페이지 한정** — `_v2/` 폴더. 재사용 시점에 글로벌화
  5. **Q5=A 활동 로그 클릭** — match/mvp = `/live/[id]` / team = `/teams/[id]` / jersey/signup 클릭 0
  6. **Q7=A findMany 1건 + 클라 groupBy** — Prisma groupBy 한계 (sum + avg 동시 불가) + raw SQL (타입 보장 ↓) + UserSeasonStat (cron 미동작) 거부. 평균 사용자 100경기 미만 → JS 가공 비용 무시
  7. **Q8=A 정렬 최신 우선** — 연도 desc / 대회 startDate desc + 커리어 평균 마지막 행 강조
- **거부 옵션**:
  - Q1=B (3종) — 활동 흐름 빈약
  - Q2=B (cron 백필) — 본 작업 외 / 시간 ↑
  - Q3=B (별도 페이지) — 라우트 추가 / 화면 전환 비용
  - Q3=C (탭 추가) — Q1=A 결정 번복
  - Q7=D (UserSeasonStat) — cron 미동작 (Phase 13+ 예정)
- **회귀 0**: Flutter `/api/v1/*` 0 / `/api/web/*` 신규 0 / Prisma schema 0 / Phase 1 (NBA 카드 + 8열) 0 / ISR 60초 유지 / 비로그인 접근 유지
- **신규 2 파일** (`activity-log.tsx` ~120L + `stats-detail-modal.tsx` ~250L) + **수정 5 파일** (page.tsx 쿼리 #10~#12 / overview-tab.tsx prop / overview-tab.css / PlayerProfile.jsx 시안 / decisions.md)
- **위험**: TeamMemberHistory.payload Json 형식 가정 (`{old:{jersey},new:{jersey}}`) — 실측 검증 필요. 형식 다르면 타입 가드 fallback "등번호 변경" 으로 표시
- **보고서**: `Dev/public-profile-activity-stats-2026-05-09.md` (14 섹션 / Q1~Q8 / 5 step ~75분)

### [2026-05-08] 본인인증 mock 자체 입력 폴백 모드 설계 — 사용자 결정 B 톤 다운 + 자체 입력
- **분류**: decision (onboarding / mock 폴백 / 환경변수 단일 신호 / DB ADD COLUMN)
- **결정자**: 사용자 (B 톤 다운 + 자체 입력 폴백) + planner-architect (구조 설계)
- **참조횟수**: 0
- **배경**: 5/8 PR3 main 배포 후 `mybdr.kr/onboarding/identity` 진입 시 빨간 에러 ("본인인증 설정이 완료되지 않았습니다. 운영자에게 문의해 주세요.") → 사용자 onboarding 1단계 완전 막힘. PortOne 콘솔 채널 발급 = 이번 주 내 예상 → 그 전까지 운영 사용자가 다음 단계 진입 불가능
- **사용자 결정**: 옵션 B (톤 다운) + 자체 입력 폴백 — 환경변수 추가 시점에 자동 PortOne 모드 복귀
- **설계 핵심 6가지**:
  1. **신규 컴포넌트** `MockIdentityModal.tsx` (≈180L) — 실명/휴대폰/생년월일(선택) 폼, ForceActionModal 패턴 카피, `var(--ink-mute)` 회색 톤
  2. **신규 endpoint** `POST /api/web/identity/mock-verify` (≈100L) — 진입 시 `isIdentityGateEnabled()` 가드 → channel key 존재 시 503 자동 거부 (mock 우회 차단). withWebAuth + 본인 user 한정
  3. **IdentityVerifyButton 분기** (+25L) — `if (!isIdentityGateEnabled())` 모달 오픈 / else PortOne SDK (기존)
  4. **DB ADD COLUMN** `user.identity_method String? @db.VarChar(20)` — 값 = `mock` / `portone` / `null`(미인증·백필미). NULL 허용 무중단. 사후 식별 핵심
  5. **톤 다운** = 빨간 에러 (`var(--accent)`) 제거 → mock 모달 오픈으로 대체. 헤더 "임시 정보 입력 (출시 준비 중)". 버튼 라벨 분기 (mock="임시 정보 입력" / portone="본인인증 시작")
  6. **자동 전환 메커니즘** = 환경변수 단일 신호 `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 가 클라/서버/가드 3 위치 일괄 판정. 코드 변경 0 / 롤백 1초
- **보안 가드 3 단**:
  - (1) 환경변수 단일 신호 (3 위치 동일 판정)
  - (2) mock endpoint 자체에 `isIdentityGateEnabled()` 체크 (PortOne 활성 후 503 자동)
  - (3) withWebAuth + 본인 user 한정 (타 사용자 update 불가)
- **mock 통과자 정책 (Q3 권장)**: 옵션 C — 권유 안내 + 그대로 인정. 옵션 B (강제 invalidate) / 옵션 D (핵심 액션 차단) 거부 — mock 사용 기간 짧음 (며칠) + 영향 사용자 적음 → 강제 차단 비용 > 효과
- **회귀 0 보장**: Flutter v1 / 기존 `/api/web/identity/verify` (PortOne) / 5/8 PR3 layout 가드 / 5/7 PR1.5.a/b / 기존 DB 컬럼 모두 변경 X
- **거부 옵션 A** (기존 `/identity/verify` endpoint 분기): 클라가 `mock=true` 강제 가능 → PortOne 활성 후에도 mock 우회 가능 (보안 ❌)
- **거부 옵션 C** (서버 미사용, 클라 직접 user update): 서버 게이트 0 → 위변조 가능 (보안 ❌)
- **PM 결재 필요 Q1~Q5**: Q1 생년월일 필수/선택 (권장 선택) / Q2 안내 톤 회색/노란 (권장 회색) / Q3 mock 통과자 처리 (권장 C) / Q4 ADD COLUMN 승인 / Q5 admin_logs 기록 (권장 기록)
- **상태**: 본 turn 설계만, 코드/DB 변경 0. 사용자 Q1~Q5 결재 후 developer 진입 (3 파일 신규 + 1 파일 수정 + DB 1 컬럼 / ≈ 310 라인)
- **보고서**: `Dev/identity-mock-fallback-design-2026-05-08.md` (14 섹션)

### [2026-05-08] PR3 layout 가드 mock flag — 옵션 a (channel key 환경변수 존재 = 가드 ON)
- **분류**: decision (onboarding 가드 / mock 모드 / 외부 작업 분리)
- **결정자**: planner-architect (PM 결재 대기)
- **참조횟수**: 0
- **배경**: PortOne 콘솔 채널 발급 + Vercel `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 추가가 외부 작업으로 대기 중. 환경변수 없는 동안에도 가드 코드를 미리 작성 + push 해두고, 환경변수 추가 시점에 즉시 활성화 필요. 보고서: `Dev/pr3-layout-guard-design-2026-05-08.md`
- **검토 4 옵션**:
  - (a) channel key 환경변수 존재 시 = 가드 ON
  - (b) explicit flag (`PORTONE_IDENTITY_GATE_ENABLED=true`) 추가 — 가드 / channel key 분리
  - (c) dev only 활성화 (`NODE_ENV==="development"`)
  - (d) a+b 결합
- **채택 (a)**: `isIdentityGateEnabled() = !!process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY`
- **사유**:
  1. 외부 작업 1회 (channel key 추가) → 가드 자동 ON. 사용자 약속 "환경변수 추가 시점에 즉시 활성화" 만족
  2. PortOne SDK 자체가 channel key 없으면 에러 → 가드를 channel key 있을 때만 켜야 일관 (UX 함정 차단)
  3. 옵션 b = 운영자 실수 위험 (key 추가 / flag 누락 → 가드 OFF) / 옵션 c = mock 의도와 반대 (운영 영향 0 = 활성화 시점에 코드 수정 또 필요)
- **롤백 = 환경변수 제거** — 활성화 후 문제 발생 시 코드 revert 불필요, 환경변수만 제거 → 즉시 mock 모드 복구
- **위험**: PortOne SDK 자체 에러 (콘솔 설정 문제) 시 가드 통과 불가 → 활성화 전 `/onboarding/identity` 수동 검증 필수
- **가드 위치 결정 별도**: 페이지 server component 직접 분기 (옵션 D) — middleware / 라우트 그룹 / layout 통합 거부 (사유: 보고서 §2.1)
- **가드 대상**: 3 페이지 (`(web)/games/[id]/page.tsx` / `(web)/teams/[id]/page.tsx` / `(web)/tournaments/[id]/join/page.tsx`) — PR1.5.b 클라 안내 4 페이지와 동일 범위 (match-request 모달은 teams/[id] 부모로 자동 차단)
- **상태**: 본 turn 설계만, 코드 변경 0. PM 사용자 결재 (Q1~Q5) 후 developer 진입

### [2026-05-05] 첫 로그인 onboarding 10단계 — 옵션 B 합의 (선호값 6종, DB 영향 0)
- **분류**: decision (onboarding 시스템 / 게이미피케이션 / 분기 정책)
- **결정자**: 사용자 ("회원가입 직후 첫 로그인에서 필수 설정 3단계 ... 10단계 모두 완료시 활동 점수 부여")
- **참조횟수**: 0
- **배경**: 가입 후 프로필 자율 입력으로는 매칭 정확도 / 대회 출전 자격 검증 어려움. 단계별 강제 + 게이미피케이션으로 완성도 유도 필요
- **10단계 설계**:
  1. 본인인증 (실명/생년월일/휴대폰 자동) — 🔴 모두 필수, 기존 IdentityVerifyButton 재사용 (Phase 12-5 mock)
  2. 활동 환경 (활동지역 17시도 + 관심 경기 유형 6종) — 🔴 모두 필수
  3. 출전 정보 (등번호/선출/포지션/신장/체중) — 🔴 길농 외 선택자 필수 / 🟡 길농만 선택자 선택
  4. 팀 (생성 or 가입 신청) — 🔴 길농 외 / 🟡 길농만
  5. 프로필 사진 — 🟡 선택
  6. 자기소개 + SNS (bio + Instagram/YouTube) — 🟡 선택
  7. 플레이 스타일 (주력 손/실력/강점) — 🟡 선택
  8. 테마/표시 (다크모드/폰트크기) — 🟡 선택 (신규)
  9. 맞춤 보기 (`/profile/settings?section=feed` PreferenceForm 통째 흡수) — 🟡 선택
  10. 알림 설정 (notification-settings 푸시 카테고리) — 🟡 선택
- **6종 경기 유형** (2단계 chip): `street-ball`(길농) / `pickup` / `guest` / `practice` / `regular` / `tournament`
  - 분기 룰: `selected.length===1 && selected[0]==="street-ball"` → 3,4 선택 / 그 외 → 3,4 필수
- **거부된 옵션 A** (game.game_type 0~5 마이그레이션): 56개 파일 + DB 영향. 별도 PR로 보류
- **채택 옵션 B**: User.preferred_game_types Json 키만 6종 확장 (DB schema 변경 0, 영향 3~4 파일)
- **점수**: 각 단계 10점 / 100점 만점 / 길농만 사용자도 자율로 100점 도달 가능
- **거부된 9단계 분리안**: 8 활동시간 + 9 맞춤필터 + 10 알림 분리 = settings/feed 한 페이지 안에 이미 통합됨 → 중복 입력 UX 나쁨
- **채택 9단계 통합안**: settings/feed PreferenceForm 통째 흡수 + 8 신규 "테마/표시" + 10 알림은 notification-settings 페이지
- **PR 분해**: PR1 본인인증(1d) → PR2 2~4단계 분기(1.5d) → PR3 미들웨어 가드(0.5d) → PR4 5~10단계 + 점수 시스템(2d) → PR5 profile/edit 정리(0.5d). 총 ~5.5d
- **즉시 진행 추천**: PR5 먼저 (활동지역 제거 + 도움말 제거 = 가시 효과)
- **본 turn 결과**: 합의만, 코드 변경 없음. 다음 세션 PR1 진입

### [2026-05-05] admin/users 관리자 권한 12→3필드 축소 — PIPA 본인정정권 준수
- **분류**: decision (개인정보 보호 / 운영 권한 정책)
- **결정자**: 사용자 ("관리자가 직접 수정할 수 있는 정보 범위가 너무 넓은거 아닌가? 일반적인 개인정보 취급 방침을 자세하게 검토해서 꼭 필요한 정보만 긴급한 상황에서 관리자가 변경할 수 있는 정도로")
- **참조횟수**: 0
- **배경**: 5/5 admin/users 모달 Step 2 (인라인 편집)에서 12필드 자유 편집 권한 = PIPA 본인정정권 위반 위험. 관리자가 신원/연락처/거주지/신체정보 변경 = 위조/사고 가능성
- **거부된 옵션**: 12필드 유지 (운영 편의 우선 — PIPA/GDPR 위반)
- **채택**: **3필드만 유지 (운영 긴급 케이스)** — `nickname` (부적절 신고 처리) / `bio` (부적절 소개 삭제) / `is_elite` (대회 자격 검증)
- **권한 회수 9필드**: name / phone / birth_date (신원 — 본인 정정권) / city / district (거주지) / height / weight (신체 민감) / position / default_jersey_number (본인 선호)
- **추가 안전 장치**:
  - 변경 사유 textarea 필수 (5자 이상 — 감사 추적)
  - admin_logs `severity=warning` (긴급 변경 표시)
  - 닉네임 자동 초기화 버튼 (`user_<id>`)
  - 소개글 전체 삭제 버튼
  - 폼 톤 warning border + "⚠ 긴급 변경" 라벨
- **commit**: `06d1376` + `8c95565` (auth fix와 묶임), `ef7e78e` (선수 배번 정책)

### [2026-05-05] 선수 배번 필수 정책 — role 분기 (player 필수 / coach·captain 선택)
- **분류**: decision (대회 운영 / 데이터 정합성 정책)
- **결정자**: 사용자 ("팀 역할이 선수가 아닌 감독, 팀장, 매니저 등의 경우 배번 입력은 선택사항. 단, 선수로 대회 출전을 목적으로 하는 경우 반드시 배번이 입력되어 있어야하며 ... 배번이 입력이 안 된 선수를 선택해서 대회 참가신청을 하면 경고창과 함께 대회 신청이 안되게 해야해")
- **참조횟수**: 0
- **배경**: 5/2 동호회최강전 다이나믹팀 6명 + 5/9 열혈농구단 라이징이글스 4명 등 출전 선수 배번 누락 11건 발견. 점검 결과 player 7명 (진짜 누락) + coach 4명 (정상 — 라이징이글스 서장훈/전태풍/김태술/산다라박 코치진)
- **분기 룰**:
  - `role==="player"` (또는 default) → 배번 **필수** (대회 신청 차단)
  - `role==="coach" / "captain" / "manager"` → 배번 **선택** (벤치/운영진)
- **신청 차단 (web)**: `/api/web/tournaments/[id]/join` zod 통과 후 추가 검증 — 누락 선수 닉네임 나열 + 422
- **admin 직접 추가 (web)**: `/api/web/tournaments/[id]/teams/[teamId]/players` POST — role==="player" + jersey null 차단 + "역할을 코치/주장으로 변경" 안내
- **현장 등록 (Flutter)**: `/api/v1/.../players` 변경 0 (zod schema 이미 jersey_number required)
- **admin/users 모달**: TournamentRow role 분기 — player+누락 → 빨간 ⚠ / coach+누락 → 회색 "—" + role 라벨 표시
- **commit**: `ef7e78e`

### [2026-05-04] 회원가입 흐름 단순화 — 가입=인증 / 프로필=활동 / 선호=정밀화 분리 (3단계 통합 폐기)
- **분류**: decision (가입 흐름 / UX / 데이터 분류 통일)
- **결정자**: 사용자 ("가입은 간단하게, 로그인 이후 활동을 위해 정보 설정을 쉽게")
- **참조횟수**: 0
- **배경**: 회원가입 → onboarding → profile/complete → verify 4 wizard 흐름이 데이터 분류 불일치 (포지션 5/3종, 실력 5/6단계, 지역 17시도/서울 18구) + 중복 입력 + 사용자 혼란
- **거부된 옵션**:
  - 3-step signup 유지 + onboarding 통합 (분류 불일치 해소 못함)
  - signup 1-step + onboarding 1회 위저드 진입 (별도 wizard 페이지 추가 = 사용자 부담)
- **채택 패턴**: **3단계 분리**
  1. **가입 = 인증** (signup 1-step): 이메일 + 비밀번호 + 닉네임 + 약관 4가지만
  2. **프로필 = 활동 준비** (profile/edit § 활동 환경): 포지션 + 신장 + 등번호 + 17시도 + 5단계 실력 + 5종 게임유형
  3. **선호 = 정밀화** (profile/edit § 활동 환경 확장): 12 스타일 + 4 빈도 + 6 목표 (알림은 settings 별도)
- **사용자 동선**:
  - signup 1-step (1분 이내) → /login → 홈
  - 홈 ProfileCtaCard "프로필 완성하기" CTA (선택, 7일 닫기 가능)
  - profile/edit 에서 점진적 입력 → profile_completed 자동 갱신 → CTA 자동 숨김
- **데이터 분류 통일** (signup 기준):
  - 포지션 5종 (PG/SG/SF/PF/C) — onboarding 3종 폐기
  - 실력 5단계 (초보/초중급/중급/중상급/상급) — onboarding 6단계 (선출급) 폐기, 선출은 `is_elite` Boolean 분리
  - 지역 17 시도 (전국 목표) — onboarding 서울 18구 폐기
  - 게임 유형 5종 (픽업/게스트/연습경기/대회/길농)
- **폐기 페이지 (server redirect)**:
  - `/profile/complete` → `/profile/edit`
  - `/profile/complete/preferences` → `/profile/edit`
  - `/onboarding/setup` → `/profile/edit` (외부 링크/북마크 안전)
- **자동 로그인 비활성** (직전 d248e50 commit):
  - signupAction → cookies.set 제거 + redirect("/login?signup=success")
  - 헤더 SSR 세션 인지 + /profile 가드 추가
- **profile_completed 자동 갱신**:
  - PATCH /api/web/profile 시 핵심 5필드 (position+height+preferred_regions+skill_level+preferred_game_types) 모두 입력 → true
  - 빈배열 안전 가드 + 응답에 포함
  - ProfileCtaCard SWR revalidate 시 자동 숨김
- **schema 변경 0** (모든 컬럼 기존 존재 — Phase 10-5 적용분 + preferred_*)
- **운영 영향**:
  - 신규 가입자: 1분 이내 가입 + 점진 보완 (편의 ↑)
  - 기존 사용자: profile/edit § 활동 환경 신규 섹션 → NULL/빈배열 → 점진 입력
  - DB 마이그 0 (NULL default 활용)
- **참조 commit**: d248e50 (P1+P4 자동 로그인 비활성) → 5cfd586 (F1+F2+F5 가입 간소화) → 6531452 (F3+F4 profile/edit 통합)

### [2026-05-04] "길농" 신규 게임 유형 도입 — 길거리농구 줄임말 / 야외코트 매칭용
- **분류**: decision (게임 유형 / 매칭 시스템 / 신규 카테고리)
- **결정자**: 사용자 ("정기팀 → 길농 변경 / 길거리농구의 줄임말로 추후 야외코트 주로 활동하는 유저의 선호로 매칭 예정")
- **참조횟수**: 0
- **배경**: 회원가입 Step 3 (활동 환경) 의 "관심 경기 유형" 5개 옵션 중 "정기팀" 폐기 + "길농" 신규 도입
- **거부된 옵션**: "정기팀" 유지 (사용자 명시 폐기)
- **채택 "길농"**:
  - 정의 = "길거리농구"의 줄임말
  - 의도 = 야외코트 주 활동 유저의 선호 매칭
  - DB 저장값 = 한글 `"길농"` (preferred_game_types JSON 배열 항목)
  - 게임 유형 5개 표준 = `["픽업", "게스트", "연습경기", "대회", "길농"]`
- **미래 활용 큐**:
  - 야외코트 매칭 알고리즘 도입 시 활용 (사용자 preferred_game_types 에 "길농" 포함된 유저 → 야외 court 우선 추천)
  - 픽업/게스트/연습경기 와의 정의 차이 명확화 (위치 = 야외코트, 단발성 = 픽업과 유사)
- **첫 적용**: signup/page.tsx Step 3 (commit 본 작업 직후)
- **참조**: 사용자 결정 — 스크린샷 5 (회원가입 Step 3)

### [2026-05-04] 듀얼 토너먼트 표준 default = sequential pairing + adjacent 옵션 보존
- **분류**: decision (대회 포맷 표준 / generator 설계)
- **결정자**: 사용자 (5/2 동호회최강전 운영 후 + planner-architect 분석)
- **참조횟수**: 0
- **배경**: 5/2 동호회최강전 (138b22d8) 운영 후 듀얼 토너먼트 포맷 표준화 필요. 기존 generator 코드는 NBA 크로스 (1+4 / 2+3 4강 매핑)이었으나 운영 데이터는 5/4 PM fix로 1+2 / 3+4 매핑이 됨. 사용자 검토 후 두 8강 페어링 패턴 (옵션 X / 옵션 Y) 비교.
- **옵션 비교** (사용자 명확화 후 — 단일 코트 순차 진행 가정):
  - **옵션 X (5/2 adjacent)**: B1+A2, D1+C2, A1+B2, C1+D2 — AB / CD 진영 분리, 같은 조 4강 가능
  - **옵션 Y (sequential)**: A1+D2, B1+C2, C1+B2, D1+A2 — 같은 조 출신 결승까지 분리, 단일 코트 순차 진행 효율, 매치 다양성 ↑
- **사용자 채택**: **옵션 Y = 표준 default** (모든 신규 대회) + **옵션 X = 5/2 운영 패턴 보존** (settings.bracket.semifinalPairing="adjacent")
- **사유 4건**:
  1. **시드 분리** — 같은 조 1위/2위 결승까지 안 만남 (시드 정의 충실)
  2. **단일 코트 순차 효율** — 8강 1+2 종료 직후 4강 1 시작 가능
  3. **매치 다양성** — 4그룹 모두 8강 등장 (대진 흥미도 ↑)
  4. **인덱스 단순성** — 4강 1=8강 1+2 / 4강 2=8강 3+4 (인접 인덱스, 사용자 인지)
- **5/2 운영 데이터 처리**: 매치 27건 그대로 유지 (5/4 PM fix 결과) + settings.bracket.semifinalPairing="adjacent" 명시 추가 (운영 패턴 식별) + 영향 0
- **결과**: schema 변경 0 + 점진 수정 (P1~P7 ~8.5h) — P1+P2 (이번 commit) = `dual-defaults.ts` 신설 + `dual-tournament-generator.ts` pairing 분기 + 4강 SPEC 통일 (1+4/2+3 → 1+2/3+4). P3~P7 별도 진행 (settings-form / admin UI / bracket-builder 옵션 / E2E 검증)
- **거부된 옵션**: 옵션 X 만 표준 (5/2 통일) → 정식 대회 시드 균형 약함 / 옵션 Y 만 (X 미지원) → 5/2 운영자 익숙한 패턴 손실

### [2026-05-04] 도메인 sub-agent 시스템 P3 결정 — C 채택 (live-expert 유지 + 신규 박제 0)
- **분류**: decision (메타 / 에이전트 시스템 / 시범 종료 평가)
- **결정자**: 사용자 (C 직진) + planner-architect (KPI 6건 누적 본질 분석 + 7 사유)
- **참조횟수**: 0
- **배경**: 옵션 A 도메인 sub-agent 시스템 도입 (5/4 결정 = 8 도메인 + 시범 live-expert) Phase 1 박제 후 Phase 2 KPI 측정 6건 누적 (live #1 + tournaments #2~6, 매치 코드 v4 작업 진행 중). 시범 시작 +14일 (5/18) 전 조기 결정 (사용자 의도 = 에이전트 세분화 흐름 진행). 본질 데이터로 P3 Go/No-Go 평가.
- **거부된 옵션**:
  - **A (Go 전체 8개 확대)**: ~6h 비용 + 효과 입증 0 = 매몰비용
  - **B (부분 Go 2~3개)**: ~3h 비용 + 효과 입증 0 = 매몰비용 축소판
  - **D (No-Go 전체 종료)**: live-expert 박제 보존 가치 손실 (5/3 7회 보강된 알고리즘 깊이)
  - **E (5/18 정식 대기)**: 14일 추가 측정 한계 효용 ≈ 0 (본 6건으로 본질 명확)
- **채택 C**: live-expert 유지 + 신규 박제 0 (실용적 균형점)
- **본질 데이터 (KPI 6건)**:
  - 잘못된 파일 0회 = **6/6 = 100%** ✅
  - 그 중 system prompt 주입 적용 = **1/6** (P2 #1 live만, planner 거쳐 수동 주입)
  - 나머지 5건 (P2 #2~#6 tournaments) = **일반 dev 컨텍스트** = 주입 ❌ → 그래도 잘못된 파일 0회
  - 결론: **system prompt 주입 marginal gain ≈ 0**, planner 사전 분석 (파일 경로 정확 박제) 이 진짜 효과의 본질
- **사유 7건**:
  1. system prompt 주입 marginal gain ≈ 0 (5/6 일반 dev 0회 달성)
  2. 본질 가치 4종 모두 약함/미작동 (KPI 1·2 측정 불가 / KPI 3 planner 동등 / Task subagent_type 미등록 / knowledge 인용 동등)
  3. 명확 정의 작업 위주 한계 — 모호 디버깅 케이스 0건 (도메인 에이전트 진짜 가치 미발견)
  4. 확대 비용 > 효과 (A 6h / B 3h 모두 매몰비용)
  5. live-expert 박제 보존 가치 (알고리즘 깊은 도메인 재활용)
  6. 5/18 대기 한계 효용 ≈ 0
  7. 사용자 의도 부분 존중 (시범 1개 영구 = 에이전트 세분화 정신 보존)
- **후속 액션 (C 채택)**:
  - `.claude/agents/live-expert.md` 영구 운영 (삭제 ❌)
  - 신규 도메인 에이전트 박제 0 (tournaments-expert / admin-expert 등 보류)
  - KPI 측정 종료 (P2 #6 마지막)
  - PM 호출 룰 미갱신 (기존 8 일반 에이전트 + live-expert 1개 = 9개 운영)
  - lessons.md 박제 3건 (system prompt marginal / KPI 작업 복잡도 통제 / Task 미등록 한계)
  - 미래 모호 디버깅 케이스 발생 시 재진입 옵션 보존 (문 열어둠)
- **Task subagent_type 미등록 한계** (P2 시범 발견 → P3 결정 핵심 인풋):
  - `.claude/agents/<name>.md` 박제만으로는 Task 도구의 subagent_type 목록 자동 등록 ❌
  - planner/dev 에 system prompt 컨텍스트 주입으로 우회 가능 but planner 거쳐야 함 = 비용 ↑
  - 본 한계 자체가 도메인 에이전트 자동화의 critical bottleneck → 향후 해결 시 P3 재평가 가능
- **참조 산출물**: plan §11 = `C:\Users\user\.claude\plans\dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md` (P3 결정 결과 7섹션)
- **이전 결정 무효화 ❌**: 5/4 옵션 A 도입 결정 (decisions.md 직전 항목) 은 **Phase 1+2 시범 적용 단계까지 유효** + Phase 3~5 (확대) **본 P3 결정으로 보류**

### [2026-05-04] 매치 코드 v4 체계 채택 — `{YY}-{지역}-{대회이니셜+회차}-{매치번호}` (전국 + 운영 2대회 컨텍스트)
- **분류**: decision (DB schema / 매치 식별 체계 / v3 폐기)
- **결정자**: 사용자 ("A v4 + 권장" 직진) + planner-architect (사용자 정보 2건 반영 재수립)
- **참조횟수**: 0
- **배경**: v3 (`{T}-[XY]-{NNN}`) 직전 분석 완료 후 사용자 핵심 정보 2건 추가 → 권장 뒤집힘
  - 향후 목표 = **전국 사용** (수도권 90% 편중 무효, v4 region 정보가치 미래 ↑)
  - 실 운영 대회 = **2개만** (동호회 최강전 / 열혈농구단 전국최강전) — 나머지 54건 목 데이터
- **거부된 옵션**:
  - **v3** (`M21-001` 7~10자): 미래 v3→v4 재구축 비용 / 글로벌 식별성 약 / 사용자 의도 (v4 직접 제안) 어긋남
  - **하이브리드** (v3 코드 + region_code 컬럼): 직전 분석 권장이었으나 "수도권 90% 편중" 사유 무효되며 폐기
- **채택 v4**: `{YY}-{region 17시도 영문약어 2자}-{대회 영문 이니셜 2자 + 시즌/회차 2자리}-{매치번호 3자리}`
  - 예: `26-GG-MD21-001` (2026-경기-몰텐배제21회-001번 매치) / `26-GG-HJ02-001` (2026-경기-열혈SEASON2-001번 매치)
- **6 결정 (Q5~Q10) — 권장안 그대로 채택**:
  - Q5 구분자 = `-` (가독성+파싱)
  - Q6 매치번호 자릿수 = 3자리 (001~999)
  - Q7 17시도 = 영문약어 2자 (SE/BS/DG/IC/GJ/DJ/US/SJ/GG/GW/CB/CN/JB/JN/GB/GN/JJ)
  - Q8 두자리 숫자 = 시즌/회차 (몰텐=21 / 열혈=02)
  - Q9 종별/디비전 = 별도 컬럼 (`category_letter` + `division_tier`) — 케이스 ① 시 NULL
  - Q10 풀리그 group_name = 별도 컬럼 (`group_letter` VarChar(1)) — 몰텐 A/B/C/D 4조 (planner 재수립 시 NEW 발견)
- **schema 6컬럼** (NULL 허용 ADD COLUMN 무중단):
  - `Tournament.short_code VarChar(7) UNIQUE` (대회 이니셜+회차 — MD21/HJ02)
  - `Tournament.region_code VarChar(2)` (17시도 영문약어 — GG/SE)
  - `TournamentMatch.match_code VarChar(20) UNIQUE` (전체 코드)
  - `TournamentMatch.category_letter VarChar(1)` (A/Y/S/W/U)
  - `TournamentMatch.division_tier VarChar(2)` (D1~D9)
  - `TournamentMatch.group_letter VarChar(1)` (A/B/C/D 풀리그)
- **사유 7건**: ① 사용자 v4 직접 제안 → 의도 정합성 ② 미래 전국 17시도 → region_code 정보가치 ↑ ③ 백필 비용 ≈ 0 (운영 2대회 10분, 목 54대회 생략) ④ 글로벌 식별성 (단일 코드 = 4 정보) ⑤ Phase 5h ≤ v3 6h ≤ 하이브리드 6.5h ⑥ 미래 v3→v4 재구축 비용 회피 ⑦ Q5~Q10 1회 일괄 결정 5분
- **운영 2 대회 검증** (61매치):
  - 몰텐배 동호회최강전 (제21회): id=138b22d8 / 27매치 / 남양주→GG / 케이스 ④ (일반부+D3) + group A/B/C/D 4조 풀리그
  - 열혈농구단 SEASON2 전국최강전: id=d83e8b83 / 34매치 / 화성→GG / 케이스 ① + 풀리그+토너 혼합
- **Phase 1~7 (~5h)**: ① schema 6컬럼 (사용자 승인 받음 / 무중단) 30분 → ② match-code.ts helper + region 정규화 1.5h → ③ 운영 2대회 61매치 backfill (사용자 승인 필요) 30분 → ④ generator 4종 통합 1.5h → ⑤ UI 노출 1h → ⑥ 목 54대회 **생략** → ⑦ deep link `/match/[code]` (옵션) 1h
- **참조 산출물**: 전체 plan = `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md` (~280줄)
- **v3 (decisions 2026-05-02 항목) 무효화**: 본 v4 결정으로 v3 (`{T}-[XY]-{NNN}`) 항목은 deprecated. 형식 ① M21-001 / ② M21-D1-001 / ③ M21-A-001 / ④ M21-A1-001 모두 폐기.

### [2026-05-04] 알기자 기사 사진 schema = `news_photos` 별도 테이블 채택 (옵션 B)
- **분류**: decision (사진 메타 저장 위치 / 확장성)
- **결정자**: PM + 사용자 ("추천대로 진행")
- **참조횟수**: 0
- **배경**: 알기자 기사 사진 첨부 기능 도입. 매치당 N장 사진 + 메타 (Hero 지정 / 정렬 / caption / EXIF / 업로드자 / size) 저장 위치 옵션 검토.
- **검토된 옵션**:
  - **A. `community_posts.images` JSON 활용**: 기존 컬럼 재사용, 새 테이블 X — 단 검색/정렬/메타 풍부도 ↓ (JSON 구조 변경 시 마이그 비용 / EXIF 메타 확장 어려움 / matchId 인덱스 X)
  - **C. 사진 URL 만 별도 테이블 + 메타 X (단순 list)**: 메타 부재로 Hero/정렬/caption 모두 미지원
- **채택 옵션 B**: `news_photos` 별도 테이블 신설 (NULL ADD COLUMN + 신규 테이블, 무중단)
  - **사유 1**: 매치 1:N 관계 자연스러움 (사진은 매치 종속)
  - **사유 2**: 인덱스 풍부 (match_id / match_id+is_hero / match_id+display_order) — 갤러리 정렬/Hero 조회 빠름
  - **사유 3**: 메타 풍부 (caption / exif_meta JSON / size_bytes / uploaded_by) — Phase 2 EXIF 매핑 / Phase 3 AI Vision 메타 확장 용이
  - **사유 4**: Cascade 정책 (매치 삭제 시 사진 자동 정리, 운영 사고 방지)
- **결과**: schema 변경 +25줄 (모델 1개 + 인덱스 3종 + relation 2종) / `community_posts.images` 영향 0 (카페 댓글 메타용 그대로 유지)
- **추후 확장**: 라운드/일자 종합 기사 도입 시 `news_photos.round_id` / `daily_date` 같은 추가 컬럼 검토 가능 (현재 매치 1:N 만)

### [2026-05-04] 도메인 sub-agent 시스템 도입 — 옵션 A 채택 + 시범 live-expert 단독 시작
- **분류**: decision (메타 / 에이전트 시스템 확장 / 도메인별 관리자)
- **결정자**: 사용자 (옵션 A 직진 명시) + planner-architect (8 도메인 / 시범 영역 / Phase 5단계)
- **참조횟수**: 0
- **배경**: mybdr 프로젝트가 (web) 페이지 30+ / api/web 50+ / api/v1 27 / lib 다수 + architecture.md 26K 토큰으로 일반 8 에이전트 (developer/debugger 등) 의 전수조사 디버깅 한계 도달. 사용자 진단: "전수조사 방식으로는 디버깅·기능조사를 정확하게 할 수 없다."
- **거부된 옵션**:
  - **B (knowledge 도메인 분할)**: architecture.md 등을 도메인별로 쪼개고 index 라우팅 — 토큰 회피는 되지만 "에이전트가 자기 도메인을 깊이 안다"는 효과 부재
  - **C (feature-map 인덱스 파일)**: 영역별 진입점 1페이지 요약 — 효과 점진적, 시범 측정 어려움
  - **D (MCP-style 도메인 search agent)**: 좁은 검색 권한만 — 코드 변경·판단은 일반 에이전트가 해야 해 분리 효과 약함
  - **E (A+B+C 조합)**: 가장 강력하나 초기 비용 ↑, 시범 단계 KPI 분리 어려움
- **채택 옵션 A**: 도메인별 sub-agent 신설 — 각 에이전트가 자기 영역만 깊이 알고, 영역 knowledge·핵심 파일 경로를 system prompt 에 박제
  - **사유**: ① 시범 1개로 KPI 명확 측정 가능 ② 기존 8 일반 에이전트와 충돌 없이 점진 도입 ③ 도메인 지식 누적 가시화 ④ 사용자가 명시 선택
- **8 도메인 확정** (정량 근거 = (web)/api/lib 파일 수 + 200 commits scope 빈도):
  - tournaments-expert (43 commits) / live-expert ⭐ (44, 시범) / referee-expert (31) / flutter-api-expert (~10, 저빈도·고위험)
  - admin-expert (54) / teams-courts-expert (29) / profile-community-expert (57) / design-system-expert (133)
- **단독 도메인 안 한 것**: community(profile 결합) / auth-security(저빈도 안정) / games(tournaments+live 분산) / news(admin 결합)
- **시범 영역 = live-expert 단독** (4가지 결정타): ① 알고리즘 깊이 압도적 (minutes-engine v3 메인 path 4단계 + LRM cap) ② 측정 용이성 (test 21/21 / commit hash 별 정확도 추적) ③ 회복 비용 최저 (단일 파일 + STL 응답 가공만 / DB 영구 보정 0) ④ 반복 작업 빈번 ("왜 X 출전시간이 Y인가?" 디버깅 패턴 전형)
- **KPI 3종** (2주 측정): grep/read 횟수 -50% / 작업 시간 -30% / 잘못된 파일 0회
- **Phase 5단계** (~6주): P1 박제 1.5h → P2 첫 케이스 측정 → P3 KPI 2주 + Go/No-Go → P4 확대 3개 (tournaments+admin) → P5 전체 8개 + PM 호출 룰 갱신
- **롤백 6종**: 도메인 모호 (3건+ PM 30초+ 고민) / 잘못된 호출 30%+ / KPI 미달 (개선 1회 후도) / 잘못된 파일 1회+ / 사용자 부정 평가 / knowledge sync 30일+ 미갱신
- **리스크 8종 + 완화 명시**: 도메인 경계 모호 / sync 이중 관리 / 에이전트 수 폭증 (8+8=16) / 테스트·리뷰 잘못 처리 / 시범 1개 실패 → 전체 부정 / 운영 DB 사고 (admin) / 도메인 미특정 영역 / Flutter 앱 깨짐
- **system prompt vs knowledge sync 룰**: 절대 룰만 system prompt 직접 박제 (변하지 않는 것) + 핵심 지식은 knowledge 단일 source 인용 1줄 (single source) + PM 작업 완료 체크리스트에 sync 검토 1줄 추가
- **저장 위치**: `C:\0. Programing\mybdr\.claude\agents\<name>.md` (프로젝트 폴더 — mybdr 전용 도메인 격리)
- **참조 산출물**: 전체 plan = `C:\Users\user\.claude\plans\dreamy-wobbling-wolf-agent-aaff2dda867c98b9c.md` (10 섹션 + 부록 A/B / 8 에이전트 system prompt 풀 텍스트 ~150줄/each)
- **P1 박제 완료**: `.claude/agents/live-expert.md` (2026-05-04, 본 결정과 동일 커밋)

### [2026-05-04] 알기자 Phase 1 영구 저장 위치 = `tournament_matches.summary_brief` JSON 컬럼 채택
- **분류**: decision (LLM 결과 영구 저장 위치 / DB 스키마)
- **결정자**: PM + 사용자 ("추천대로 진행")
- **참조횟수**: 0
- **배경**: 알기자 Phase 1 (라이브 페이지 [Lead] 요약) 가 메모리 캐시만 사용 → cold start 마다 재호출 + Vercel instance 별 다중 호출. 영구 저장으로 마이그 결정 후 위치 옵션 3개 비교.
- **검토된 옵션**:
  - **A. `community_posts` 같은 테이블에 `phase` 컬럼 추가**: 단일 테이블 / 검수 액션 재사용 가능 — 단 community_posts 에 사용자 비공개 요약이 섞이고 status 분기 복잡화
  - **C. 별도 `match_summaries` 테이블 신설**: 의미 분리 명확 / 라운드·일자 종합 요약 확장 용이 — 단 테이블 추가 + migration 필요 + JOIN 1번 추가
- **채택 옵션 B**: `tournament_matches.summary_brief Json?` 컬럼 추가 (NULL 허용 ADD COLUMN 무중단 변경)
  - **사유 1**: 매치와 1:1 관계라 가장 자연스러움 (요약은 특정 매치에 종속, 라운드/일자는 별도 큐)
  - **사유 2**: 라이브 페이지 fetch 시 매치 데이터와 함께 1번에 가져옴 (JOIN 추가 X, 응답 latency 영향 0)
  - **사유 3**: JSON 형식 `{ brief, generated_at, mode }` 으로 metadata 함께 저장 — 검색/필터링 약함은 trade-off (요약은 매치 단위 read 위주라 무관)
- **결과**: schema 변경 1줄 + auto-publish-match-brief.ts 분기 추가 + tab-summary.tsx client fetch 제거 = 깔끔한 마이그
- **추후 확장**: 라운드/일자 종합 요약 도입 시 별도 테이블 (`match_summaries` 또는 `news_summaries`) 신설 검토 — 매치 1:1 형태와 다른 1:N 관계라 분리 자연스러움

### [2026-05-04] 알기자 트리거 통합 = `Promise.allSettled` 패턴 채택 (Phase 1 + Phase 2 독립 실행)
- **분류**: decision (트리거 흐름 / 에러 격리 패턴)
- **결정자**: PM + 사용자 ("매치당 본 1 + 요약 1 = 2개 보장")
- **참조횟수**: 0
- **배경**: 5/3 까지 본기사 (Phase 2) 만 자동 트리거. 요약 (Phase 1) 은 client fetch 분리. 사용자 의도 = 경기 종료 1회 트리거 → 2개 동시 생성. 통합 패턴 옵션 검토.
- **검토된 옵션**:
  - **A. 순차 실행 (`await phase1; await phase2`)**: Phase 1 실패 시 Phase 2 미진행 — 한쪽 실패가 다른쪽 차단
  - **C. 단일 함수에 합치기 (한 LLM 호출로 두 결과 추출)**: prompt 복잡화 + 검증 로직 분리 어려움
- **채택 옵션 B**: `Promise.allSettled([publishPhase1Summary, publishPhase2MatchBrief])` — 두 작업 독립 병렬 실행
  - **사유 1**: 한쪽 실패 ≠ 다른쪽 영향 (사용자 의도 "매치당 정확히 2개" 보장)
  - **사유 2**: fire-and-forget 패턴 유지 (호출자 = match.ts PATCH route 응답 시간 영향 0)
  - **사유 3**: 각 함수 멱등성 독립 (Phase 1=summary_brief 있으면 skip / Phase 2=community_post 있으면 skip)
  - **사유 4**: 향후 Phase 3 (라운드/일자 종합) 추가 시 같은 패턴으로 확장 가능
- **결과**: `triggerMatchBriefPublish(matchId)` 함수 시그니처 유지 (호출자 변경 0) + 내부 흐름만 변경

### [2026-05-03] minutes-engine B 옵션 채택 — PBP 추정 fallback 격리 + 메인 path 명확화
- **분류**: decision (코드 정리 옵션 / 안전망 vs 가독성 균형)
- **결정자**: PM + 사용자 (5/3 D-day 동안 7회 보강 후 정리 시점)
- **참조횟수**: 0
- **배경**: 5/3 D-day 동안 minutes-engine 7회 보강 후 코드가 메인 path + fallback 혼재 → 가독성 저하. calculateMinutes 본체 191줄 (절반 이상이 PBP 추정 fallback). 정리 옵션 3개 검토.
- **거부된 옵션**:
  - **A1 (PBP 추정 fallback 완전 제거)**: isStarter 누락 매치 발생 시 starter=0 으로 시작 → 양팀 출전시간 0초 위험. DB 데이터 100% 입력 보장 못함 → 거부
  - **A2 (제거 + 풀타임 안전 fallback)**: PBP 추정보다 단순하나 starter 식별 정확도 ↓. raw 정확도 회귀 위험
- **채택 옵션 B**: PBP 추정 fallback 별도 헬퍼 함수 격리 + 메인 path 명확화 + 알고리즘 설계 문서 주석
  - **사유**: 시간 정확도 최우선, 안전망 유지 + 가독성 향상 균형
- **결과**:
  - `inferStartersFromPbp(qPbps)` 헬퍼 분리 (PBP-only fallback 전용, "fallback only" 명시)
  - `calculateMinutes` 본체 191→133줄 (-58줄, -30%)
  - 메인 path 4단계 (#1 DB / #2 chain / #3 boundary / #4 LRM cap) 인라인 주석 명확화
  - 파일 헤더 알고리즘 설계 문서 주석 +22줄 추가
  - 동작 변경 0 (회귀 0) — vitest 20/20 PASS (당시), 후속 endLineup 가드 fix 후 21/21
- **확장 가능성**: 향후 PBP 추정 룰 변경/실험 시 `inferStartersFromPbp` 만 수정. 메인 path 와 분리되어 회귀 위험 낮음
- **참조 커밋**: 72aa643

### [2026-05-02] 매치 코드 신규 체계 v3 — `{T}-[XY]-{NNN}` 7~10자 (다음 세션 진입점)
- **분류**: decision (DB schema / 매치 식별 체계 / 미구현 — 계획 확정)
- **결정자**: pm + 사용자 (계획 v1 → v2 간소화 → v3 정정)
- **배경**: 매치번호 부여 일관성 부재 (몰텐배 27/27 ✅ / TEST 0/16 ❌ / 열혈 3/34 ❌). UNIQUE 인덱스 부재. 단순 숫자만으론 글로벌 식별 불가.
- **거부된 옵션**:
  - v1: `SEL-MOLTEN-V21-AMA-D1-G1A03` 24자 — 너무 김. 사용자 거부.
  - 종별/디비전 혼동 — 종별=일반부/유청소년 등, 디비전=D3/D4 등. 사용자 정정.
- **채택 v3**: `{토너먼트 short_code}-[종별letter][디비전숫자]-{NNN}` 7~10자
  - ① 단일/단일: `M21-001`
  - ② 디비전만 분리: `M21-D1-001`
  - ③ 종별만 분리: `M21-A-001` (A=일반/Y=유청/S=시니어/W=여성/U=대학)
  - ④ 둘 다 분리: `M21-A1-001`
- **운영 대회 25개 분석 결과**:
  - `tournaments.divisions/division_tiers` 거의 비어있음 (legacy)
  - `tournaments.categories` JSON `{종별: [디비전]}` 만 채워짐 (몰텐배·TEST 만)
  - 약 60% 가 케이스 ① / 30% 케이스 ③ / 10% 케이스 ②
- **Phase 1~7 미구현** — 구현 시작 시점이 다음 세션 진입점
- **참조횟수**: 0

### [2026-05-02] dual_tournament 진출 슬롯 회귀 방지 5종 (A~E)
- **분류**: decision (data integrity / 회귀 가드 다층화)
- **결정자**: pm + 사용자 (5/2 운영 중 양쪽 같은 팀 케이스 2회 = 피벗·아울스 / 8강 #21)
- **5종 가드**:
  - A. progressDualMatch 자가 치유 (반대 슬롯 NULL 정정)
  - B. admin web matches PATCH 진출 슬롯 차단 (next_match destination 매치)
  - C. **admin frontend dirty tracking** (변경된 필드만 PATCH — 근본 원인 fix)
  - D. 검출 스크립트 (`scripts/_templates/detect-dual-conflicts.ts`)
  - E. **TournamentMatch audit log** (신규 `tournament_match_audits` 테이블 + helper + admin/flutter/system 통합)
- **추가 강화 (cfa64a6)**: progressDualMatch self-heal context 에 source matchId 명시 + updateMatch/updateMatchStatus legacy 진출에도 self-heal+audit 추가 (single elim 보호)
- **시뮬레이션 검증**: 27매치 결승까지 가상 진행 → self-heal 8건 발동 / 양쪽 같은 팀 0건
- **관련**: errors.md "양쪽 같은 팀 (피벗·아울스)" / commit cf2eea1, 90759d5, cfa64a6
- **참조횟수**: 0

### [2026-05-02] Admin-Web 시각 통합 — alias 보강 방식 채택 (admin 코드 변경 0 / web 영향 0)
- **분류**: decision (디자인 시스템 / 토큰 통합 / 점진 마이그레이션)
- **결정자**: pm + 사용자 (Q1·Q2 추천안 채택)
- **참조횟수**: 0
- **배경**: `mybdr.kr/admin/users` 운영 화면이 (web) BDR-current 디자인 시스템과 시각 갭 (검색 버튼 카페블루 대신 색 미적용 / ★ 빨간색 안 보임 등). 진단: admin 코드 405건이 사용 중인 alias 9개가 `globals.css` 에 미정의 → 빈 값으로 그려짐.
- **검토 옵션 3개**:
  1. **alias 9개 추가** ⭐ — `globals.css` 1 파일만 변경, admin 코드 0 수정, web 무영향
  2. admin 코드 405건 일괄 변경 — `var(--color-accent)` → `var(--accent)` 직접 참조로
  3. admin 다크모드 강제 — 라이트모드 시안 부재 회피용. **사용자 명시 거부** ("다크모드 강제는 안 됨")
- **채택**: **옵션 1 ⭐⭐⭐** — `:root,[data-theme="light"]` + `[data-theme="dark"]` 양쪽 블록에 9 alias 추가 (commit f8fe8f0). 라이트=cafe-blue / 다크=BDR Red 사용자 토글 그대로 유지.
- **추가된 alias 9개**: `--color-accent` `--color-accent-hover` `--color-accent-light` `--color-error` `--color-warning` `--color-success` `--color-border-subtle` `--color-text-dim` `--shadow-card`
- **Phase 2 동시 진행**: `.admin-table thead` background → `var(--bg-head)` (web `.board__head` 톤 일치)
- **사유 — 옵션 1 vs 옵션 2**:
  - 옵션 1: 5분 작업 / 위험 0 / 점진 후속 가능 / Phase A~E 회귀 0
  - 옵션 2: 8h+ 작업 / 페이지별 회귀 위험 / 점진 불가 / 운영 중 D-day 작업과 충돌
- **사유 — 다크모드 강제 거부**: 사용자가 라이트/다크 토글을 운영자 선호로 존중. (admin) 라이트모드 시안 부재는 alias 매핑이 (web) 라이트와 자동 정합되도록 해결.
- **추후 큐 (Phase 3~7)**: 인라인 라운드 px → 토큰 / 인라인 buttons-inputs → `.btn`/`.input` 글로벌 클래스 / 17 페이지 점진 적용. 별도 큐 (대회 후).
- **확장 가능성**: 같은 패턴으로 `(referee)/referee/admin/` `(web)/tournament-admin/` 영역도 alias 보강 가능.

### [2026-05-02] STL Phase 1 도입 — Flutter app 수정 없이 라이브 데이터 무결성 보장 (사용자 화면)
- **분류**: decision (architecture / 데이터 무결성 / Flutter 의존성 격리)
- **결정자**: pm + 사용자 (옵션 분석 후 진행 승인)
- **참조횟수**: 0
- **배경**: Flutter app 의 PBP 누락 (made_shot/올아웃 sub) 이 운영 18 매치 중 10건 (56%) 발생. 매치 헤더 vs 쿼터 점수 합 불일치. Flutter app fix 가 근본 해결이지만 별도 프로젝트 (원영 담당) 라 시간 소요. 서버 측에서 즉시 보완 필요.
- **검토 옵션 5개**:
  1. **응답 가공** (DB 안 건드림) ⭐ — score_at_time 시계열 + 매치 헤더 cap
  2. 자동 PBP INSERT (DB 영구 보정 cron)
  3. 무결성 알림만 (운영자 인지)
  4. quarterStatsJson 점수 활용 — ❌ **불가** (필드 = `min`/`pm` 만, 점수 X)
  5. 음수 gap 처리 (헤더 < PBP) — 별도 검토
- **채택**: **옵션 1 (응답 가공) 단독 ⭐⭐⭐** — DB 무결성 0, Flutter sync 영향 0, 라이브 매치 즉시 효과.
- **STL 룰 (8개 → 7개로 정비, R5 폐기)**:
  - **R1** 쿼터 점수 score_at_time 보정 + 매치 헤더 cap (사용자 통찰: 마지막 쿼터 일괄 분배 ❌ → score_at_time 시계열 정확 분배)
  - **R2** 음수 gap 가드 (R1 Step 3 통합)
  - **R3** quarterStatsJson 부분 누락 쿼터 PBP 시뮬 보충
  - **R4** minutesPlayed=0 fallback (B-2)
  - ~~R5~~ 코트 정원 위반 — **폐기** (사용자 지적: 농구 룰상 발생 불가)
  - **R6** matchPlayerStat 우선 (R1 흡수)
  - **R7** 누락 쿼터 추정 (R1 흡수)
  - **R8** quarter length 동적 추정 (PBP max clock → 420/480/600/720 매핑)
- **검증 매치 6건 모두 통과**: 101/102/103/132/133/95
- **사용자 통찰 반영 사례**: R1 알고리즘 v1 (마지막 쿼터 일괄 분배) → v2 (score_at_time 시계열 + cap) — 사용자가 "나중에 문제될 것 같다" 지적 후 매치 102 검증으로 정확한 쿼터 식별 가능 확인.
- **배제 대안**:
  - 옵션 2 (DB INSERT) — 가짜 PBP 시점 부정확 + Flutter sync 가드 추가 부담
  - 옵션 4 (quarterStatsJson 점수) — 데이터 불가
  - Flutter app 수정 단독 — 별도 프로젝트 + 즉시 효과 X
- **관련 commit**: 0f8da8e (R1) / b18227c (R3) / 1bec5c3 (sync 이중 가드) / f0278b4 (R8) / 8ccd4dd (R4 라이브 fix)
- **관련 보고서**: `Dev/bug-report-flutter-allout-pbp-2026-05-02.md` (원영 전달용) / `Dev/bug-report-quarter-score-mismatch-2026-05-02.md`

### [2026-05-02] 듀얼토너먼트 — schema 변경 0 + 5 Phase 점진 도입 + 결정 6건
- **분류**: decision
- **결정자**: planner-architect (사용자 결정 6건 추천안)
- **참조횟수**: 0
- **배경**: B 대회 (id=`138b22d8…`) format=`dual_tournament` 16팀 등록 완료, 매치 0건. 현재 코드 — `bracket-settings-form` 이 `dual_tournament` 도 `isSingleElim=true` 로 처리 (settings 분기 부재) / `bracket-generator.ts` 에 dual 함수 0 / `bracket/route.ts` POST 가 league vs single elim 만 분기 → dual 진입 시 잘못된 single elim 트리 생성. 사용자 요구 = 단순 INSERT 가 아닌 "system 기능 정착".
- **결정 6건 (모두 추천안 채택)**:
  - **결정 1 — 조 배정 방식**: B 옵션 채택 (`settings.bracket.groupAssignment` 수동) + C 옵션 (관리자 드래그&드롭 UI) Phase F 큐로 분리. 사유: B 대회 사진은 BDR 랭킹 + 운영자 수동 배정이라 snake 자동과 결과 다름 / 즉시 적용 필요
  - **결정 2 — 시드 결정**: C 옵션 채택 (`TournamentTeam.seedNumber` 기존 컬럼 활용). 사유: BDR 랭킹 외부 API 의존성 회피 / 운영자가 16팀 사전 UPDATE 가능
  - **결정 3 — 자동 진출 트리거**: A 옵션 채택 (`matches/[matchId]/route.ts` PATCH 통합). 사유: single elim / full_league_knockout 도 next_match 슬롯 채우기 부재 — 통합 시 3 format 모두 혜택. 회귀 테스트 Phase B5 + C7 게이트
  - **결정 4 — 결승/3·4위전**: (a) 단판 + (b) 3·4위전 없음 (사진 그대로). 사유: 사진 일정 27 매치 정합. bracket-settings-form 옵션 노출은 유지하되 default
  - **결정 5 — bracket route clear 정책**: A 옵션 채택 (single 패턴 그대로 — `clear: false` 시 ALREADY_EXISTS 409). 사유: B 대회 매치 0건이라 첫 생성은 OK / 재생성은 사용자 명시 확인 후 `clear: true`
  - **결정 6 — bracket-builder dual 시각화**: A 옵션 채택 (Phase A~E 범위는 round_number 그룹핑 유지) + C 옵션 (Phase F 별도 큐 — `buildDualRoundGroups` 분기). 사유: 관리자 페이지는 Stage 5섹션 카드로 충분 / 공개 페이지 토너먼트 트리는 별도 시각화 작업 필요
- **schema 변경 0 보장**: TournamentMatch 의 기존 컬럼 (`next_match_id` / `next_match_slot` / `group_name` / `bracket_level` / `bracket_position` / `roundName` / `settings JSON` / `winner_team_id`) 모두 활용. 패자 진출 추적은 `settings.loserNextMatchId+loserNextMatchSlot` 신규 필드 (JSON) 로 처리 — schema 변경 회피
- **대안 배제**:
  - schema 변경안 (loser_next_match_id 컬럼 신설): 운영 DB 작업 비용 + 기존 single elim 무관 = 과잉. settings JSON 으로 충분
  - generator 1개 통합 (`generateBracket(format, ...)`): 유지보수성 ↓ + format 별 책임 분리 원칙 위배. 별도 파일 분리 (`dual-tournament-generator.ts`) 가 league-generator 와 동일 패턴
- **위험**: 결정 3 (PATCH route 통합) 시 single elim 회귀 발생 가능 → Phase B5 + C7 회귀 테스트 게이트 명시. Phase E 운영 DB 작업은 사용자 승인 게이트 필수

### [2026-05-02] 단일 Supabase project 운영/개발 겸용 정책 확정
- **분류**: decision (인프라 / 운영 정책 / 안전 가드)
- **결정자**: 사용자 (PM 옵션 C 채택)
- **배경**: lessons.md 04-18 "개발 DB라 믿은 .env가 사실 운영 DB" 발견 후 7개월간 옵션 결정 보류. 2026-05 동호회최강전 데이터 정리 (16팀 + 112선수 + 22 placeholder + Phase 1~5 schema 변경) 모두 .env 운영 DB 직접 작업으로 진행 — 별도 dev DB 미운영 현실 재확인.
- **결정**: **단일 Supabase project = 운영/개발 겸용** (옵션 C). CLAUDE.md 룰 갱신:
  - "🚨 절대 금지" #2,#3 갱신: ".env에 운영 DB URL 금지" → "destructive 작업 사용자 승인 없이 실행 금지" / "prisma migrate reset 금지" 등 더 정밀한 가드
  - "🗄️ DB 정책" 신설: 단일 project + 위험 + 5단 안전 가드 (사용자 승인 / schema diff / 임시 스크립트 정리 / 사후 검증 / 운영 영향 0 작업)
  - .env 표기 변경: "개발 DB" → "운영 DB + localhost"
- **대안 배제**:
  - **A 현 상태 유지** (룰 차이 무시): 신규 에이전트 헷갈림. lessons 4월 항목 vs 실제 다른 동작 → 같은 함정 재발 위험
  - **B 분리 시도** (별도 dev DB): Supabase project 비용 증가 + 데이터 동기화 부담. 동호회최강전 같은 운영 데이터 작업 시 dev → 운영 마이그레이션 비용
- **영향**: CLAUDE.md + lessons.md 룰 정합. 향후 모든 DB 작업 시 단일 운영 DB 가정 + 5단 가드 준수
- **참조횟수**: 0

### [2026-05-01] 선수명단 실명 표시 규칙 — 5건 결정 + 본인인증 자동입력 정책
- **분류**: decision (표시 정책 / 운영 데이터 표현 일관성 / 미래 인증 시스템 연동)
- **결정자**: pm + 사용자 (planner 추천안 모두 채택)
- **배경**: 동호회최강전 데이터 정리 중 선수명단에 nickname 우선 표시 발견 (사진의 "w / 종훈 / LL" 등). 운영 8 패턴 혼재 — nickname 우선 7건 / name 우선 2건 / nickname 단독 5건 / player_name 단독 3건. placeholder User 22명 (`nickname=null, name=실명`) + 자동 매칭 9명 + 기존 활성 멤버 (짧은 닉네임) 시각 통일 필요.
- **결정**:
  1. **표시 우선순위**: `User.name → nickname → player_name → '#{jersey}'` fallback (실명 우선)
  2. **헬퍼 위치**: lib 유틸 1개 (`getDisplayName(user, ttp?)`) — JSX/raw SQL/Flutter API 모두 호환
  3. **Prisma select preset**: `USER_DISPLAY_SELECT` 상수 신설 (`{ id, name, nickname }`) — select 누락 회귀 방지
  4. **Phase 분할**: A→B→C→D→E 순차 진행 (A 영향 0, 안전 시작)
  5. **입력 폼 라벨**: "실명 (필수)" + placeholder "예: 홍길동" (강제 X, 가이드만)
- **추가 정책 (사용자)**: **본인인증 작동 시 실명·전화 필수 라벨 폐기 + 자동입력 전환**. 간편가입(소셜 OAuth) 개선 시 동일. 현재 라벨은 임시 정책 — 인증 시스템 활성화 시 폐기. 본인인증 진입점은 D-6 EditProfile §1 hero 에 이미 존재 (`name_verified` 플래그)
- **대안 배제**:
  - **A nickname 우선** : 운영 다수 패턴이지만 사용자 의도(실명 표시) 위반. placeholder User 22명 (nickname=null) 가 "—" 표시되는 회귀
  - **C 실명 강제 (fallback X)** : User.name=null 케이스 (자동 매칭된 진짜 가입자 일부) 빈 칸 노출 — 사용자 경험 열등
  - **헬퍼 컴포넌트 (`<PlayerName />`)** : raw SQL/Flutter API 응답에서 사용 불가 (JSX 외 환경 미지원)
  - **inline select 매번** : 17개소 회귀 가능성 — 신규 페이지 추가 시마다 누락 위험
- **영향**: 신규 2 (헬퍼 + select preset) + 수정 17 (페이지/API) + DB schema **0**. API 응답 schema 변경 0 (값만 닉네임 → 실명). Flutter 앱 호환 — Phase D 진행 전 모바일팀 사전 공지 필요
- **참조횟수**: 0

### [2026-05-01] Q1 Reviews 옵션 A 비노출 / B 코트만 / C 동시 마이그 채택
- **분류**: decision (시안 박제 + 컴포넌트 재사용 범위 + 토큰 마이그 타이밍)
- **결정자**: pm + 사용자 (auto mode 권장안 채택)
- **결정**: 시안 [Phase 16] 통합 리뷰 4탭 → 1탭 박제 시 3 결정:
  - **A. 4탭 축소 처리** = **비노출** (탭 자체 깔끔 제거, 주석 X). 향후 복구는 git log 가능.
  - **B. ContextReviews 도입 범위** = **코트만 우선** (kind="court"). /tournaments + /users 동시 도입은 별도 큐 (Phase 16~17).
  - **C. court-reviews.tsx 옛 토큰 정리** = **동시 처리**. ContextReviews 도입 시 같이 BDR v3 토큰 마이그.
- **배경**: 시안은 4탭(대회/코트/팀/심판) 통합 페이지였으나 사용자 결정으로 코트만 활성. 옛 court-reviews.tsx 가 v2 토큰 사용 중이라 마이그 타이밍이 별도 vs 동시 선택지.
- **대안 배제**:
  - **A 주석** : dead code 부채 + 4탭 복구 시 주석 해제만으로 작동 안 함 (다른 컴포넌트 변경 필요). git log 복구가 더 깔끔.
  - **B /tournaments + /users 동시 도입** : 작업량 ×2~3 + 시리즈/플레이어 리뷰 시안 미정 + DB 확장 필요. 한 번에 너무 큼.
  - **C 별도 commit** : v3 토큰 마이그가 ContextReviews 도입과 겹치는 4 파일이라 동시 처리가 효율적 (별도 commit 시 같은 파일 두 번 수정).
- **영향**: 변경 7건 (신규 2 / 삭제 1 / 수정 4) / 정보 손실 0 / REVIEW_CATEGORIES 5항목 + SWR/POST/DELETE 100% 보존 / `_components/` 다른 파일 옛 토큰은 별도 큐.
- **참조**: architecture.md 2026-05-01 "Q1 Reviews + ContextReviews 박제" / 시안 ContextReviews.jsx + Reviews.jsx
- **참조횟수**: 0

### [2026-05-01] D-3 ProfileWeeklyReport 옵션 B (Hybrid) 채택 — TOP 3 코트 손실 0
- **분류**: decision (시안 박제 + 데이터 보존)
- **결정자**: pm + 사용자 (auto mode 옵션 B 선택)
- **결정**: 시안 v2.4 (KPI 4종 변경 + Highlight + 다음 주 추천 신설) 박제 + **옛 운영 §04 TOP 3 코트 + §06 지난주 비교 보존**. 정보 손실 0.
- **배경**: 시안 v2.4 가 KPI 라벨 변경 (session_count → 경기 / total_minutes → 활동 시간 / total_xp → XP / 평균 평점 신규) + Highlight 1경기 + 다음 주 추천 3 신설. TOP 3 코트 = 운영 진짜 데이터 (session_count 집계) → 시안 제거됨.
- **대안 배제**:
  - **(A) 시안 그대로** : TOP 3 코트 진짜 데이터 손실. Highlight + 다음 주 추천 = DB 미지원 더미. 진짜 데이터 손실 + 더미 추가 = 사용자 가치 다운그레이드.
  - **(C) 보류** : 다음 세션 재검토. v3-rebake 박제 진행 정체.
- **영향**: page.tsx 920→1125 (+205). KPI 4 라벨 (시안 박제) + §02/§05 placeholder + ComingSoonBadge / §04+§06 운영 진짜 데이터 보존. 운영 KPI 5종 (unique_courts 포함) 모두 §01+§06 분산 표시. 손실 0.
- **후속 큐**: ComingSoonBadge 공통 컴포넌트 격상 (다른 v3 페이지 재사용) / §02 Highlight = MatchPlayerStat 평점 연동 시 활성화 / §05 추천 엔진 연동 시 시안 3카드 (GAME/COACH/TEAM) 교체
- **참조**: architecture.md 2026-05-01 "D-3 ProfileWeeklyReport Hybrid 박제" / 시안 Dev/design/BDR-current/screens/ProfileWeeklyReport.jsx
- **참조횟수**: 0

### [2026-05-01] ProfileShell 폐기 결정 — children passthrough 채택 (분기 확장 대안 배제)
- **분류**: decision (component lifecycle)
- **결정자**: pm + 사용자 (Cowork 직접 patch)
- **결정**: `src/app/(web)/profile/layout.tsx` 의 `<ProfileShell>` wrap 을 제거하고 단순 `<>{children}</>` passthrough 채택. ProfileShell 컴포넌트 자체 의존성 0 → 후속 cleanup commit 으로 삭제 예정.
- **배경**: v2.3 마이페이지 hub 시안 = MyPage 카드 진입 → 깊은 페이지 단독 (sidebar 0). ProfileShell 의 isHubRoot 분기 (hub root only hide / sub 220px aside 노출) 가 v2.3 sidebar 0 원칙 위반. dev server 에서 사용자가 발견.
- **대안 배제**:
  - **(B) isHubRoot 조건 확장 — 모든 path hide** : `usePathname()` 분기를 `pathname.startsWith('/profile')` 등으로 확장하여 모든 sub 도 sidebar 0 처리. ProfileShell 컴포넌트는 살림.
    → 배제 사유: v2.3 시안에서 sidebar 의도 자체 0 = ProfileShell 존재 자체가 부채. wrapper 가 항상 children 만 통과시킨다면 wrapper 자체가 무의미. component lifecycle 단순화 우선.
  - **(C) ProfileShell 안에 다른 v2.3 정합 UI 추가** : sidebar 대신 다른 hub 카드 wrapper 등을 ProfileShell 에 흡수. → 배제: 시안에 그런 wrapper UI 자체 없음. YAGNI.
- **영향**: `/profile/*` 모든 sub 페이지에서 외부 sidebar 사라짐 (v2.3 hub 모델 일관 적용). ProfileShell + ProfileSideNav 컴포넌트 의존성 0 → 후속 cleanup commit 가능.
- **참조**: architecture.md 2026-05-01 "ProfileShell 폐기" / lessons.md 2026-05-01 "revert + 부분 hub 패치 잔재"
- **참조횟수**: 0

### [2026-05-01] D-6 EditProfile Hybrid 옵션 B 채택 — 시안 단일 스크롤 + 5번째 섹션으로 진짜 기능 흡수
- **분류**: decision (시안 박제 + 데이터 보존)
- **결정자**: pm + 사용자 (auto mode 옵션 B 선택)
- **결정**: 시안 v2.3 (단일 스크롤 + Hero + 4섹션) 박제 + **§5 "추가 설정" 섹션 신설**로 운영의 진짜 기능 4종 (환불 계좌·회원 탈퇴·닉네임 중복확인·AI bio) 흡수. 정보 손실 0.
- **배경**: 운영은 v2(1) 5탭 사이드 + 6 sub-tab 구조. 시안 v2.3 는 단일 스크롤 + 4섹션으로 전면 재구성됐으나 시안에 진짜 기능 4종 자리 없음.
- **대안 배제**:
  - **(A) 시안 그대로** : 진짜 기능 4종 별도 페이지 또는 누락. 회원 탈퇴 누락 = 법적 이슈 가능 / 환불 계좌 누락 = 결제 환불 불가. 손실 영향 D-3 (TOP 3 코트 손실)보다 큼.
  - **(C) 보류** : 다음 세션 재검토. v3-rebake 박제 진행 정체.
- **영향**: page.tsx 1547→1233 (-314 / 5탭 사이드 + 6 sub-tab → 단일 스크롤 + Hero + 5섹션). edit-profile.css 신규 603줄 (시안 profile-settings.css EditProfile 부분 1:1 박제 + chip 베이스). 운영 진짜 기능 100% 보존. 시안에 없는 §2/§4 신규 UI 는 DB 미저장 시각 박제 (백엔드 PATCH 확장 시 별도 작업 큐).
- **후속 큐 (reviewer 권장)**: `.chip` 클래스 BEM 격리 또는 globals.css 승격 / §2 사용손/실력/강점 priv-note 추가 / §3 인스타·유튜브 sub "준비 중" 명시
- **참조**: architecture.md 2026-05-01 "D-6 EditProfile Hybrid 박제" / 시안 Dev/design/BDR-current/screens/EditProfile.jsx
- **참조횟수**: 0

### [2026-04-29] 모바일 브레이크포인트 720px 통일 (Tailwind 768px 미사용)
- **분류**: decision (디자인 시스템)
- **결정자**: pm + 디자이너
- **결정**: BDR v2 모바일/데스크톱 분기 브레이크포인트를 **720px로 통일**. Tailwind default(640px sm / 768px md)를 그대로 쓰지 않고 `@media (max-width: 720px)` 글로벌 룰 + Tailwind config 커스텀.
- **배경**: (1) mybdr 기존 컨벤션이 720px (이전 작업물에서 720px 분기 다수 사용), (2) 768px(iPad mini portrait)을 데스크톱으로 보내면 가로 폭 부족, (3) 720px이 모바일/태블릿 경계로 직관적 (대부분 폰 가로/태블릿 세로 모두 모바일 처리).
- **대안 배제**: (B) Tailwind 768px md 그대로 — iPad mini가 데스크톱 사이드바 받아 좁음. (C) 640px sm — 큰 폰(iPhone Pro Max 430px) 직후 데스크톱 받아 어색.
- **영향**: globals.css `@media (max-width: 720px)` 글로벌 룰 (input 16px / btn 44px / overflow-x:hidden). v2 컴포넌트는 `sm:`/`md:` Tailwind 분기 + 720px global guard 이중 적용.
- **참조**: conventions.md "모바일 최적화 체크리스트" 10번 / errors.md "모바일 가로 overflow"
- **참조횟수**: 0

### [2026-04-29] Hero 카로셀 외부 라이브러리 0 — 직접 touch 핸들러 + setInterval
- **분류**: decision (의존성 관리)
- **결정자**: pm + developer
- **결정**: BDR v2 홈 Hero 카로셀에 embla-carousel / swiper / keen-slider 등 외부 라이브러리 미도입. 직접 구현 — useState로 currentIndex 관리 + setInterval 자동 슬라이드(5초) + onTouchStart/Move/End 3핸들러 + 좌우 화살표 버튼.
- **배경**: (1) 슬라이드 5종 + 자동 전환 + 터치 스와이프 + 점 인디케이터 = 직접 구현 ~80줄로 충분, (2) embla 14kb / swiper 130kb 추가 묶음 비용 vs 80줄 코드 직관적 비교, (3) 카로셀 패턴이 단순(서버 슬라이드 5종 absolute stacking + opacity 토글)이라 라이브러리 추상화 불필요.
- **대안 배제**: (B) embla-carousel — 가벼운 편이나 14kb 추가 + DOM 조작 추상화로 SEO 슬라이드 인덱싱 비표준화 위험. (C) swiper — 130kb 너무 무거움. (D) react-slick — jQuery 의존, deprecated 추세.
- **영향**: 의존성 +0. `src/components/bdr-v2/hero-carousel.tsx` 1파일에 client controller 자체 포함. 향후 추가 카로셀 필요 시 동일 패턴 재사용 가능.
- **참조**: lessons.md "Hero 카로셀 1일 → 2시간 단축" / decisions.md "카로셀 stacking 방식"
- **참조횟수**: 0

### [2026-04-29] Hero 카로셀 stacking 방식 — 모든 슬라이드 absolute + opacity 토글 (SEO 인덱싱)
- **분류**: decision (component pattern)
- **결정자**: planner-architect + developer
- **결정**: 카로셀 슬라이드를 transform translate로 옆으로 미는 방식이 아닌, **모든 슬라이드를 동시에 DOM에 absolute로 배치 + opacity 0/1 토글**로 전환.
- **배경**: (1) transform 슬라이딩은 active 슬라이드 1개만 viewport에 보이고 나머지는 off-screen → SEO crawler가 visible 슬라이드만 인덱싱 가능성, (2) 모든 슬라이드 동시 DOM 렌더는 5개 server 컴포넌트(prefetch 4종) 한꺼번에 SSR → 모든 슬라이드 콘텐츠가 HTML에 포함 → SEO/접근성 보장, (3) opacity 토글은 transition 250ms로 부드럽고 GPU 가속 가능.
- **대안 배제**: (B) transform translateX — SEO crawler가 hidden 슬라이드를 인덱싱 안 할 위험 + virtualization 없으면 어차피 모두 DOM. (C) display:none 토글 — transition 불가. (D) conditional render(active만 렌더) — fade transition 불가 + prefetch 효과 상실.
- **영향**: 5개 슬라이드 동시 SSR로 초기 HTML 폭 증가하나 prefetch가 어차피 4종 병렬이라 비용 동일. opacity 토글로 active만 클릭 가능하도록 `pointer-events: none` 분기 추가.
- **참조**: decisions.md "Hero 카로셀 외부 라이브러리 0"
- **참조횟수**: 0

### [2026-04-29] 모바일 input font-size: 16px !important — iOS Safari 자동 줌 차단
- **분류**: decision (모바일 UX)
- **결정자**: pm
- **결정**: 모바일에서 모든 폼 입력 요소(`input`/`select`/`textarea`)에 **`font-size: 16px !important` 강제 적용** (globals.css `@media (max-width: 720px)`).
- **배경**: (1) iOS Safari는 input font-size가 16px 미만이면 포커스 시 자동으로 viewport를 확대(자동 줌)하는 동작 — 입력 후 줌이 풀리지 않아 UX 파괴, (2) 14px이 기본 디자인 토큰이라 모바일에서도 14px 유지하려면 자동 줌 발생, (3) Tailwind v4 + globals.css 글로벌 룰로 강제하면 컴포넌트별 분기 불필요.
- **대안 배제**: (B) viewport meta `user-scalable=no` — 접근성 위반(WCAG 2.1 1.4.4 Resize text), (C) 컴포넌트별 font-size: 16px — 누락 위험 + 14px 디자인 의도 깨짐 일관 불가, (D) iOS detection JS — SSR 시점 detection 불가능.
- **영향**: 모바일에서만 16px, 데스크톱은 디자인 토큰 14px 유지. !important는 Tailwind 클래스 우선순위 이김. 영향 범위 = `<input> <select> <textarea>` 모든 인스턴스.
- **참조**: conventions.md "모바일 최적화 체크리스트" 5번 항목
- **참조횟수**: 0

### [2026-04-27] Phase 10-1 경기 평가 — manner_score는 응답시점 aggregate(캐시 X) 권장
- **분류**: decision (Phase 10-1 경기 평가/신고 시스템)
- **결정자**: planner-architect (PM 결정 보고용 추천안)
- **결정**: game_player_ratings의 평균을 user별로 사전 캐시하지 않고, **프로필/리스트 응답 시점에 매번 `prisma.game_player_ratings.aggregate({ where:{rated_user_id}, _avg:rating })`** 호출. count도 함께 반환해 N건 미만이면 표시 안 함.
- **배경**: (1) mybdr 사용자 규모상 GROUP BY 1회 비용 무시 가능, (2) 리포트 제출 트랜잭션에 캐시 갱신 끼우면 race condition 위험 + reporter 다중 동시 제출 시 정합성 깨짐, (3) cron 옵션은 24h 지연 — 사용자 체감 부정적, (4) 응답시점 aggregate는 인덱스(`@@index([rated_user_id])`)로 즉시 처리.
- **대안 배제**: (B) 리포트 제출 시 캐시 갱신 — race + 트랜잭션 비대화, (C) nightly cron — 24h 지연 + cron job 추가 비용, (D) Postgres trigger — Prisma 외부 SQL 의존성 + DB 마이그 위험.
- **영향**: schema에 별도 manner 캐시 컬럼 추가 불필요(Q1 옵션 A — evaluation_rating 재활용 또는 manner_score 컬럼 신설은 별도 결정). 응답 helper(`getMannerScore(userId)`) 1개 추가. 부하 증가 시 cron으로 전환 가능 (가드만 교체).
- **참조횟수**: 0

### [2026-04-27] Phase 10-1 — 신고 플래그 enum 미도입, String[] + zod 검증 채택
- **분류**: decision (Phase 10-1)
- **결정자**: planner-architect
- **결정**: game_player_ratings.flags를 Postgres enum 또는 lookup 테이블이 아닌 **`String[]` (TEXT[]) + zod `z.enum(["noshow","manner","foul","verbal","cheat"])` 런타임 검증**으로 처리.
- **배경**: (1) 신규 플래그 추가 시 enum은 ALTER TYPE 마이그 필요, lookup은 join 비용, (2) 시안 5종 외 추가 가능성 낮음 + 추가 시도 application layer 변경만, (3) Postgres GIN 인덱스 가능, (4) noshow는 시안에서 체크박스로 별도 UI → `is_noshow boolean` 별도 컬럼으로 분리(Q2 옵션 B).
- **대안 배제**: (B) Postgres enum — 마이그 비용, (C) lookup 테이블 game_report_flag_types — over-engineering, (D) 단일 String + 콤마 분리 — 검색 X.
- **영향**: prisma `flags String[] @default([])` + zod 검증 + admin 큐에서 GIN 인덱스 활용 가능. is_noshow는 unique 별도 컬럼이라 매너 점수 집계에서 제외 가능.
- **참조횟수**: 0

### [2026-04-25] 코트 대관 — court_managers N:M 모델 보류, court_infos.user_id + user_subscriptions 검사로 단순화
- **분류**: decision (코트 대관 시스템 Phase A MVP)
- **결정자**: planner-architect (pm 결정 보고용 추천안)
- **결정**: 코트 운영자 ↔ 코트 매핑을 위해 신규 `court_managers` N:M 테이블을 만들지 않고, 기존 **`court_infos.user_id`(코트 등록자, 1:1)** + **`user_subscriptions.feature_key="court_rental" status="active"`(멤버십 활성)** 2개 조건의 AND 검사로 운영자 권한 판정. 가드 유틸 `src/lib/courts/court-manager-guard.ts` 1개로 모든 운영자 API에서 호출.
- **배경**: (1) MVP 단계에 N:M 매핑 수요 0 (1코트=1운영자 충분), (2) Prisma 모델 1개 절감 + 마이그레이션 위험 감소, (3) 멤버십 만료 시 자동 권한 회수(가드만 통과 못함, DB row 정리 불요), (4) 향후 N:M 필요 시 Phase D에서 court_managers 도입 + 가드만 교체하면 페이지·API 수정 0.
- **대안 배제**: (B) court_managers N:M 신규 테이블 — 1코트=다중운영자/권한 분리(owner/admin/member) 가능하나 MVP 과잉. (C) `users.role` 추가 — 권한 시스템 비대화 + 멤버십 분리 어려움.
- **영향**: Phase A 신규 테이블 1개(court_bookings)로 한정. court_infos에는 booking_mode + booking_fee_per_hour 2컬럼만 추가. Phase D에서 다중 운영자 요구 발생 시 court_managers 도입 + 가드 교체 (페이지·API 0수정).
- **참조횟수**: 0

### [2026-04-25] 코트 대관 — payments.payable_type 다형성 재활용 ("CourtBooking" 추가)
- **분류**: decision (코트 대관 시스템 Phase B 결제 통합)
- **결정자**: planner-architect
- **결정**: 코트 예약 결제를 위해 `payments` 모델을 신규 생성하지 않고, 기존 `payable_type` 다형성에 `"CourtBooking"` 값 추가로 처리. 토스페이먼츠 confirm 흐름은 `/api/web/payments/confirm/booking` 신규 라우트(또는 기존 confirm/route.ts 분기)에서 처리. court_bookings.payment_id로 1:1 연결.
- **배경**: (1) 기존 payments 모델이 이미 `payable_type+payable_id` 인덱스 보유 (현재 "Plan"만 사용, 다형성 의도 명백), (2) 토스 secret key + confirm 호출 + 토스 응답 저장 + 환불 필드 전부 그대로 재활용 가능, (3) 신규 모델 생성 시 환불·실패 처리 등 중복 코드 발생.
- **대안 배제**: (B) `booking_payments` 신규 테이블 — 환불·토스 응답 필드 중복, 코드 분기 비대화. (C) court_bookings에 결제 필드 직접 임베드 — payments 통합 조회/관리자 페이지 깨짐.
- **영향**: Phase B에서 confirm 라우트 1개 신규(또는 분기) + payments에 `platform_fee` 1컬럼 추가만. payments 다형성으로 admin/payments 페이지에서도 통합 조회 가능.
- **참조횟수**: 0

### [2026-04-21] 세션 역할 재정의 — 본 세션 = 다음카페 sync 전용
- **분류**: decision (운영 워크플로우)
- **결정자**: pm + 수빈 (2026-04-21 승인)
- **결정**: 2026-04-21부로 **본 세션(이 Claude Code 터미널) = 다음카페 sync 전용**으로 역할 뒤집음. 이전(2026-04-20) "본=일반, 다른=카페" 합의 폐기. 옵션 A 조합 채택: (1) **브랜치**: 양 세션 `subin` 공용 유지. (2) **커밋 스코프**: 본 세션 모든 커밋에 `(cafe-sync)` 스코프 필수 — `feat/fix/docs/chore/refactor(cafe-sync):`. (3) **PR**: 신규 카페 작업은 별도 PR로 오픈. PR #55(혼재)는 그대로 머지. (4) **scratchpad**: 공용 `.claude/scratchpad.md` 유지 + "카페 작업 로그" 섹션 분리(담당=`pm-cafe`). (5) **충돌 방지**: push 전 `git fetch origin subin` 필수, scratchpad 동시 편집 금지(섹션 다르면 OK).
- **배경**: 2026-04-20부터 "본=일반" 원칙이었으나 실제 `subin` 브랜치 커밋 이력상 카페 sync 작업이 혼재됐고, PR 분리 시도 2회(`531b3261` / `98433ca`·`2f67ddc` Revert) 모두 되돌림. PR #55도 "L2 + 보이스카우트 + 카페 sync 후속 (통합)" 혼재 상태. 더 이상 같은 세션에서 두 도메인을 섞지 않고 이 터미널을 **카페 전용**으로 굳히는 게 리뷰/검수 부담 최소.
- **대안 배제**: (B) `subin-cafe` 브랜치 분리 → 과거 PR 분리 실패 이력 + 브랜치 관리 오버헤드. 필요시 나중에 전환. (C) 현 상태 유지(두 도메인 섞기) → PR 리뷰 난이도 높음, 책임 경계 모호.
- **영향**: 본 세션은 `src/lib/cafe-sync/**`, `src/lib/parsers/cafe-*.ts`, `scripts/sync-cafe.ts`, `scripts/cafe-login.ts`, `scripts/backfill-*cafe*.ts`, `scripts/_tmp-cafe-*`, `Dev/cafe-*.md`, `Dev/prompt-cafe-*.md`, 프리즈마 cafe migration **만** 수정. 그 외 파일 터치 시 PM이 차단. 다른 세션(일반)은 반대로 이 목록을 금지 파일로.
- **참조횟수**: 0

### [2026-04-21] 카페 sync 3게시판 전면 board 강제 + parser 힌트 메타데이터화
- **분류**: decision (카페 sync Phase 2b 후속)
- **결정자**: pm + developer (2026-04-21 승인)
- **결정**: IVHA/Dilr/MptT **3게시판 모두** `board.gameType` → `game_type` 1:1 강제 매핑. parser(`cafe-game-parser.ts`) 가 본문 키워드로 뽑는 `parsed.gameType` 은 **소비하지 않음**. 불일치 시 `metadata.mixed_type_hint` + `metadata.parser_game_type` 으로 보존 (정보 손실 방지). 기존 혼재 레코드(IVHA 7건)는 `scripts/backfill-cafe-game-type.ts --execute` 로 UPDATE. 구현: `src/lib/cafe-sync/upsert.ts` 의 `resolveGameType(board)` + pure fn `buildMetadataHints()` 분리. `cafe-game-parser.ts` 무수정(vitest 59/59 보호).
- **배경**: 2026-04-20 까지는 MptT(PRACTICE) 만 board 강제였고 IVHA/Dilr 는 `parsed.gameType ?? board.gameType` 패턴이라 본문에 타 유형 키워드가 섞이면 parser 가 재분류 (예: IVHA에 "게스트 모집" 문구 → GUEST 로 뒤바뀜). 실측 IVHA 7건이 `game_type=1(GUEST)` 로 저장돼 `/games?type=0` 탭에서 사라짐. 운영자의 "어느 게시판에 올렸는가" 가 본문 키워드보다 훨씬 강한 의도 신호라 판단.
- **대안 배제**: (A) parser 재튜닝 → 각 게시판마다 오염 키워드 셋이 다르고 MptT 에서 이미 강제로 해결 완료된 접근과 분기 발생. 파서 59/59 테스트 회귀 위험. (B) admin UI 수동 재분류 → 건마다 사람 개입 필요, 지속 sync 에서 계속 재발. (C) `games.game_type` 컬럼 외 별도 `board_game_type` 컬럼 추가 → 운영 DB 마이그레이션 필요(CLAUDE.md 금지 규칙 충돌).
- **영향**: `insertGameFromCafe`/`previewUpsert` 두 경로 동기. 혼재 글 수집 시 탭 표시(/games?type=N)가 운영자 의도와 항상 일치. `metadata.mixed_type_hint` 로 admin "혼재 의심" 필터/통계 재활용 가능. 백필 스크립트가 매핑 소스(`resolveGameType` export) 재사용하여 매핑 규칙 단일 진입점 유지.
- **참조횟수**: 0

### [2026-04-21] L2 본인/타인 프로필 통합 — 정책 Q1~Q7 + 편집 경로
- **분류**: decision (L2 본 설계)
- **결정자**: planner-architect + pm (수빈 확정)
- **결정**: Q1 경로 = **A. 단일 `/users/[id]`** (본인 접근 시 분기). Q2 비공개 기본 범위 = **① 본인만**(현재 select whitelist 유지). Q3 `User.is_public` = **② select-level 유지**(Prisma 마이그레이션 0 — 운영 DB 변경 금지 준수). Q4 티어/레벨 = **① 레벨 하나로 통합**(`getTierBadge` 제거, 본인·타인 동일 Lv.N 배지). Q5 `/profile` = **① 대시보드로 재정의**(BasicInfo/Refund → `/profile/edit`로 이관). Q6 MVP 카드 = **③ 장식 존치**. Q7 Teams 섹션 = **① 추가**(공개 팀만, `team.is_public !== false`). **편집 경로 = B. 기존 `/profile/edit` 재활용**(신규 `/users/[me]/edit` 도입 시 네비 중복 + 308 리다이렉트 ≥4건 부담).
- **배경**: L2 audit(2026-04-20) 완료 후 간극 10건·정책 질문 7건 확정 필요. Prisma 마이그레이션은 운영 DB 분리 완료(ops-db-sync-plan) 전까지 금지라 스키마 변경 옵션(Q3 ①/③) 전부 배제. 티어-레벨 이중 배지는 사용자 인지 부하 + 의미 중복(경기수는 이미 Hero 미니스탯에 표시)으로 레벨 통합 채택.
- **대안 배제**: Q1 (B) 공용 컴포넌트만 분리 + 경로 유지 → "본인 시점 미리보기" UX 별도 구현 부담. Q4 (②) 타인=티어/본인=레벨 분리 → 중복 의미 축 혼란. Q5 프로필 정보 카드 유지 → 대시보드 성격 모호. 편집 경로 A(신규 `/users/[me]/edit`) → 기존 6개 `/profile/*` 서브 라우트와 네비 중복.
- **영향**: 공용 3종(`src/components/profile/{profile-hero, mini-stat, recent-games}.tsx`) + `/api/web/users/[id]/gamification`(공개) + `UserTeamsGrid`(타인용) + `OwnerEditButton`. 레거시 `profile-header.tsx` 삭제. 총 공수 ~8h(병렬 반영).
- **참조횟수**: 0

### [2026-04-20] L3 Organization 라우트 방식 — 기존 `/organizations/[slug]` 활용 (신규 라우트 금지)
- **분류**: decision (L3 다음 단위 설계)
- **결정자**: planner-architect
- **결정**: L3 다음 단위(Organization 브레드크럼) 작업 시 **이미 존재하는** `src/app/(web)/organizations/[slug]/page.tsx`에 shared/Breadcrumb만 삽입. 신규 라우트 생성/이동 금지
- **배경**: Dev/long-term-plan-L3.md 기획서는 "영향 페이지" 목록에 organizations/[slug]를 올렸지만 신규 여부 명시 없음. 실제 확인 시 이미 존재하고 시리즈 카드 목록까지 구현돼 있음 — 브레드크럼만 누락
- **대안 배제**: (A) 신규 라우트 신설 → URL 중복 + 리다이렉트 설계 추가 부담. (B) 기존 파일 재구성 → 로고/배너/멤버 섹션 회귀 리스크
- **영향**: 예상 공수 -30분(신규 페이지 제작 생략)

### [2026-04-20] EditionSwitcher 동작 규약 — 3버튼 비대칭 비활성 + 전체 보기 중앙 배치
- **분류**: decision (L3 다음 단위 설계)
- **결정자**: planner-architect
- **결정**: `src/components/shared/edition-switcher.tsx` 신규 공용 컴포넌트. (1) 좌측 "이전 회차"/중앙 "시리즈 전체 N회차"/우측 "다음 회차" 3버튼. (2) prev/next null(현재가 첫/끝 회차)이면 `<span>` 폴백(Link 아님) + `aria-disabled="true"` + 회색 처리. (3) 키보드 글로벌 ←→ 핸들러 미포함(페이지별 다른 단축키 충돌 방지, Link의 포커스 + Enter만). (4) 중앙 "전체 보기"는 항상 활성(`/series/{slug}`). (5) Material Symbols `chevron_left`/`apps`/`chevron_right` 고정. (6) 색상 전부 CSS 변수.
- **배경**: 기획서 결정 C는 "이전/다음/전체 보기 3버튼"만 명시. disabled UX, 키보드 지원 범위, 중앙 버튼 역할은 미정이라 본 설계 단계에서 규약 확정
- **대안 배제**: (A) disabled Link href="#" → 접근성 경고. (B) 키보드 ←→ 글로벌 → 대회 페이지 내 다른 슬라이더/캐러셀 충돌 우려
- **영향**: SeriesCard 카드 내부에 내장 배치 — 별도 블록 없이 맥락 일체화

### [2026-04-20] 카페 sync Pagination — `/api/v1/common-articles` cursor-based API
- **분류**: decision (Phase 3 #6)
- **결정자**: planner-architect
- **결정**: 20건 상한 극복을 위해 **Daum 카페 모바일 내부 XHR API** 사용. `GET https://m.cafe.daum.net/api/v1/common-articles?grpid=IGaj&fldid={board}&targetPage={N}&afterBbsDepth={cursor}&pageSize={20~50}`
- **배경**: 각 게시판 1페이지(20건)만 긁히는 한계. 3게시판 × 20 = 60건 상한. 전체 수집을 위해 pagination 필요.
- **실측 근거 (2026-04-20)**:
  - `?page=N` / `?p=N` / `?curpage=N` / `?pageNo=N` / `?listNum=N` / `?offset=20` / `/IVHA/2` — **전부 무효** (모바일 SSR이 쿼리 무시, 동일 응답)
  - PC `cafe.daum.net/dongarry/_c21_/bbs_list?page=N` — **404**
  - 번들 역공학(`general_articles-5f488a9d60.min.js` Vue 컴포넌트)에서 `Ns.get("/api/v1/common-articles", { params: {grpid, fldid, targetPage, afterBbsDepth, pageSize} })` 확인
  - 실측: 커서 필수(`afterBbsDepth=0`이면 빈 배열), pageSize **50 OK / 100은 서버 500**
  - 종료: `{"articles":[],"nextPage":N}` 반환으로 감지
- **선택지**:
  - A. cursor-based common-articles API ✅ (번들 역공학 + 실측 확정)
  - B. Playwright로 무한 스크롤 재현 — **비권장** (무겁고 403 위험 ↑)
  - C. 모바일 HTML만 반복 스크래핑 — **불가능** (SSR이 항상 1페이지)
- **구현 방침**:
  - 1페이지: **기존 HTML SSR 경로 유지** (`articles.push` 정규식). `bbsDepth` 필드 추출만 추가.
  - 2페이지+: common-articles JSON API. 응답 필드명이 articles.push 블록과 **동일**(dataid/title/writerNickname/articleElapsedTime/bbsDepth) → parser 재사용.
  - CLI: `--max-pages=N` 신규 (기본 1, 호환). 페이지 간 sleep 3초(9가드 #1).
  - 중단: articles=[] / maxPages 도달 / dataid 중복 / 403·429·500 연속 3회
- **필수 헤더**: `Referer: https://m.cafe.daum.net/dongarry/{fldid}` + `X-Requested-With: XMLHttpRequest` + `Accept: application/json, text/plain, */*`
- **운영 가드**: 
  - pageSize 50 상한 코드 강제 (서버 500 방지)
  - API 실패 시 1페이지 HTML 수집은 그대로 동작 (이중 안전망)
  - 9가드 #1(3초) / #8(연속 3회 중단) 기존 로직 재사용
- **영향**: `board-map.ts`(+ GRP_CODE 상수), `fetcher.ts`(+ fetchBoardListApi), `scripts/sync-cafe.ts`(페이지 루프). 스키마 0, 운영 DB 영향 0.
- **재검토 트리거**: API 스펙 변경(무고지 고장) → 이중 안전망으로 1페이지는 유지. 알림이 "2P 이후 0건" 감지
- **참조**: scratchpad-cafe-sync.md "📋 Phase 3 #6 Pagination 설계안"
- **참조횟수**: 0

### [2026-04-20] 카페 sync 과거 글 시분 확보 불가 — 원천 미제공 (HTML 한계)
- **분류**: decision (기술적 한계 확정)
- **결정자**: pm + Explore 실측 분석
- **결정**: 과거 글(당일 외) 시분(HH:MM) 추출을 **포기**. 분 단위 정렬 + `dataid` tie-break 조합으로 카페 표시 순서를 사실상 100% 복원.
- **배경**: Phase 3 체크리스트 #7 "시분 정확도"를 원래 상세 페이지 파싱으로 해결하려 했으나, 실측(tmp/cafe-debug-article-IVHA-{3919,3920,3923,3924,3925}.html 5건) 결과 상세 HTML에서도 과거 글은 `YY.MM.DD`만 노출. 당일 글만 `HH:MM` 표시.
- **실측 근거**:
  - 상세 유일 시간 소스 `<span class="num_subject">`: 당일=`13:40` / 과거=`26.04.17`
  - 기타 후보 전부 부재: `articleElapsedTime`, `regDttm`, `createdAt`, `JSON-LD datePublished`, `og:published_time`
  - 5/5 과거 글이 모두 날짜 형식 (샘플 부족 아닌 패턴 확정)
- **대체 전략**: `dataid` 단조 증가 특성(실측 3926→3896 역순) 활용 → `games.metadata.cafe_article_id` 2차 정렬키로 같은 날 여러 글의 순서를 완벽 복원.
- **사용자 체감**: 과거 글은 날짜 단위 정렬 + 같은 날 내 dataid desc → 카페 표시 순서와 일치.
- **미래 확장 가능성 (비추천)**: 모바일 API 직접 호출로 시분초 확보 가능성 있으나 비공개 API + 차단 위험 → 비용 대비 이득 낮음.

### [2026-04-20] 카페 sync dataid tie-break — metadata JSON 키 (cafe_article_id Int)
- **분류**: decision
- **결정자**: planner-architect + pm
- **결정**: dataid를 `games.metadata.cafe_article_id` (Int, JSON 내부 키)로 저장하여 정렬 2차키로 사용
- **배경**: 같은 분(HH:MM)에 카페 글 여러 건 업로드 시 `created_at DESC` 단일 정렬로는 순서 보장 불가. dataid는 카페 게시 순서대로 단조 증가(실측 3926→3896).
- **선택지**:
  - A. `games.metadata.cafe_article_id` (Int JSON 키) ✅
  - B. `games.cafe_article_id` 컬럼 신규 — **❌ Prisma 마이그레이션 필요** (CLAUDE.md 금지)
  - C. `cafe_posts.cafe_article_id` 컬럼 — games 정렬에 조인 필요로 쿼리 복잡
- **선택 이유**:
  - 운영 DB 스키마 drift 방지 (JSON 키 추가는 스키마 변경 아님)
  - 기존 metadata 7키 구조와 동질적 (cafe_dataid/cafe_board/source_url/... + cafe_article_id)
  - 데이터 규모(최대 수천 건)에서 JSON path 정렬 성능 충분
- **트레이드오프**: Prisma orderBy가 JSON path 미지원 → `listGames()`에서 메모리 정렬(대안 1)로 tie-break 구현 (take=60 기준 성능 차 무시)

### [2026-04-20] 카페 공지 필터 — noticeContainer 구간 방어적 드랍
- **분류**: decision
- **결정자**: planner-architect
- **결정**: fetcher 정규식 매칭 전 `<div id="noticeContainer">...` 구간을 HTML에서 제거
- **배경**: 실측(tmp/cafe-debug-IVHA.html) 결과 공지는 `<div id="noticeContainer">` DOM에만 있고 `<script>articles.push` 블록에는 일반글만 존재 → 현재도 공지 수집 0건. 다만 카페 측 레이아웃 변경에 대비한 방어적 가드 필요.
- **선택지**:
  - A. noticeContainer 구간 HTML 통째 드랍 (lookahead로 articles 선언 직전까지) ✅
  - B. articles.push 블록별 공지 플래그 검사 — 현재 articles.push에 공지 안 들어옴 → 불필요
  - C. 무수정 — 미래 레이아웃 변경 시 공지 혼입 위험
- **선택 이유**: 5줄 추가로 방어력 확보, 오삭제 위험 0 (lookahead로 articles 블록 안전)

### [2026-04-19] W1 Quick Wins 12종 묶음 처리 결정 — 단일 통합 PR 채택
- **분류**: decision
- **결정자**: 수빈 + pm
- **결정**: W1 Quick Wins 12개를 **개별 PR이 아닌 단일 통합 PR(#45)** 로 dev 머지
- **배경**: Q1~Q12 모두 1주 내 작은 단위 변경(라우트/라벨/배지/배너/맥락 안내 등). Coworker(다른 터미널) + PM(이 터미널) 동시 작업
- **선택지**:
  - A. Q별 개별 PR 12개 — 리뷰 단위 명확하나 PR 부하 큼
  - B. Q 묶음별 PR 3~4개 — 절충, 묶음 기준 모호
  - **C. 단일 통합 PR** ✅ — 1주 결과물 한 번에. PR 본문에 Q별 커밋 해시 표로 추적성 유지
- **선택 이유**:
  - 모든 Q가 사용자 가시(UX) 영역 → 한 번에 시각 점검 효율적
  - dev Vercel 프리뷰 1회 검증으로 12개 모두 확인
  - 커밋 의미 단위 분리 유지 → 추적성 손실 없음
  - 다음카페 Phase 1~2a + 보조 작업도 함께 묶어 "1주 1 PR" 패턴 정립
- **검증 6단계 (PR 생성 전 자동)**:
  1. `git fetch dev` + 충돌 확인
  2. `npx tsc --noEmit` 통과
  3. 6개 308 redirect curl 검증 (Q1+Q2+Q3)
  4. 변경 페이지 10건 HTTP 200
  5. PR 본문에 Q별 커밋 해시 표
  6. 시각 점검은 사용자(Vercel 프리뷰)
- **재검토 시점**: W2(M1 프로필 IA) 같은 큰 변경은 별도 PR로 분리. Quick Wins 패턴은 후속 주차에도 동일 적용
- **참조**: PR #45 (subin → dev, 22커밋), scratchpad 04-19 "W1 완료"

### [2026-04-19] 다음카페 자동 동기화 아키텍처 + 조건부 진행 결정 (9가드 전제)
- **분류**: decision
- **결정자**: 수빈 (사용자) + pm (조건부 승인 예정)
- **배경**: 다음카페(dongarry) 3개 게시판(IVHA 픽업 / Dilr 게스트 / MptT 연습) 신규 글을 30분 주기로 `/games`에 자동 반영하는 시스템이 필요. 외부 크롤러 112건 주입 후 2026-04-09에 멈춘 상태. `cafe_posts` 테이블은 존재하나 0건.
- **기술 결정**:
  1. **수집 방식**: HTTP fetch(모바일 목록) + Playwright(본문, 로그인 쿠키 기반) 하이브리드
  2. **스케줄**: Vercel Cron 30분(목록) + GH Actions 30분~2시간(본문 워커)
  3. **데이터 모델**: `cafe_posts` 재활용 + `games.metadata` JSON 확장만. **schema.prisma 변경 없음**
  4. **중복 방지 키**: `cafe_posts.@@unique(cafe_code, board_id, dataid)` + `games.metadata.cafe_dataid`
  5. **파서**: 기존 `src/lib/parsers/cafe-game-parser.ts` (vitest 59/59) **재사용, 수정 금지**
- **파일 구조** (`src/lib/cafe-sync/` 신규 격리):
  - `board-map.ts`(매핑 상수) / `fetcher.ts`(목록 HTTP) / `article-fetcher.ts`(본문 HTTP+Playwright) / `upsert.ts`(cafe_posts + games 동기화)
  - `scripts/sync-cafe.ts` (수동 실행, dry-run 기본)
  - `src/app/api/cron/cafe-sync/route.ts` (Phase 3)
  - `.github/workflows/cafe-sync-deep.yml` (Phase 3 Playwright 워커)
- **대안 기각**:
  - Vercel 단일 실행: Playwright 불가 → 본문 수집 불가
  - 새 테이블 신설: 이미 `cafe_posts` 있음
  - 공식 RSS/Open API: apis.daum.net ECONNREFUSED, 미제공 확정
  - 기존 외부 크롤러 복원: 소스 위치 불명 + 4/9 이후 멈춤 원인 불명 → **자연 소멸 처리**
- **법적 리스크 평가** (2026-04-19 general-purpose 리서치):

| 영역 | 법적 위반 | 실제 차단 | 핵심 근거 |
|------|----------|----------|----------|
| 약관 위반 | 낮음 | 중간 | 카카오 약관 크롤링 명시 없음, 포괄조항 "비정상적 방법"만. 회원 본인 범위는 인정 가능성 낮음 |
| 저작권 | 중간 | 낮음 | 본문 전문 UI 노출은 위험. **요약+원본링크는 공정이용 범위 근접** (저작권법 제28·35조의5) |
| 업무방해 | 매우낮음 | 매우낮음 | 야놀자 판례(대법원 2021도1533): **1,594만 회도 무죄**. MyBDR 일 100회 미만 |
| 개인정보 | 중간 | 낮음 | 닉네임=조건부 개인정보 / 본문 내 전화·계좌 **마스킹 필수** |
| 정보통신망법(제48조) | 낮음 | 낮음 | 수빈 본인 계정 쿠키 = 정당한 접근권한 |
| 부정경쟁방지법 | 낮음 | 낮음 | 농구 플랫폼 vs 동아리 카페 = 경쟁 관계 X (잡코리아 vs 사람인 판례 적용 안됨) |

- **9가드 (Phase 1 진입 전제 조건)**:
  1. 요청 간격 3초 유지
  2. 새벽 1~6시(KST) 회피 — Cron 시간 설정 시 UTC 환산 주의
  3. 수빈 본인 계정 쿠키만 사용 (다중 계정 금지)
  4. **본문 원문은 `cafe_posts.content` DB 저장만, UI는 요약(100~200자) + 원본 링크**
  5. 전화번호·계좌번호 정규식 마스킹 유틸 Phase 2에 추가 (`src/lib/security/mask-personal-info.ts`)
  6. 작성자 삭제 요청 시 즉시 DB 삭제 프로세스 (Phase 3 admin UI)
  7. 일반 모바일 브라우저 UA 유지 (봇 명시 X — 차단 위험 > 투명성 이익)
  8. 403/429 3회 연속 시 해당 주기 스킵 + 알림
  9. 카페/카카오 중단 요청 시 즉시 중단 (cs.daum.net 대응 매뉴얼화)
- **재검토 트리거**: 카카오 공식 중단 서신 / 차단 24h 내 3회 이상 / 본문 민감정보 빈도 증가 / 경쟁 관계 확장
- **운영 가드**: dry-run 기본 + UA 명시 + 3초 sleep + 운영 DB 직접 연결 경고 프로토콜 적용
- **Phase 소요**: P1(2~3h) + P2(4~6h) + P3(6~8h) = **총 12~17h**
- **참조**: lessons.md "다음카페 정규식 파서 95%", errors.md (없음), Sources: 카카오 이용약관 / robots.txt / 대법원 2021도1533 / 개인정보보호위 2024.2 가이드
- **승격됨**: CLAUDE.md [미승격, 추후 Phase 2~3 진입 시 검토]

### [2026-04-18] 운영 DB 직접 연결 유지 + 마이그레이션도 조건부 허용 (개발/운영 DB 분리 유보)
- **분류**: decision
- **결정자**: 수빈 (사용자)
- **배경**: 운영 API와 로컬 `/api/web/games` 응답 id=391까지 완전 동일 → `.env`가 사실 운영 DB. 현재 기능 개발이 촉박해서 개발 DB 신설/싱크 비용을 감당하기 어려움
- **최종 결정 (2026-04-18)**:
  - 당분간 **운영 DB 직접 연결 + 스키마 마이그레이션도 진행**하면서 개발
  - **위험 작업 실행 전 PM이 반드시 사전 경고**
  - 기능 어느 정도 안정화되면 **개발 DB 분리 작업 진행** (별도 과제)
- **경고 프로토콜 (필수 수행)**:
  PM은 아래 작업 유형을 수행하기 전 반드시 경고 + 사용자 승인 받기:

  | 분류 | 예시 | 경고 내용 |
  |------|------|----------|
  | **스키마 변경** | `prisma db push`, `prisma migrate dev/deploy`, `schema.prisma` 수정 후 DB 반영 | 영향 받는 테이블/컬럼 + 기존 데이터 손실 가능성 + 롤백 방법 |
  | **DELETE** | `prisma.X.delete()`, `DELETE FROM ...` | 삭제 대상 건수 + 복구 불가 고지 |
  | **파괴적 UPDATE** | 기존 값이 있는 컬럼을 덮어쓰는 UPDATE (NULL → 값 채움 제외) | 영향 건수 + 원본 백업 여부 |
  | **대량 UPDATE (20건+)** | 비파괴라도 20건 이상 한 번에 바꿀 때 | 영향 건수 + dry-run 결과 표본 |
  | **프로덕션 크롤러/배치 수정** | 실시간 데이터 인입 로직 변경 | 데이터 흐름 중단 리스크 |
  | **외부 서비스 호출** | 푸시 알림 대량 발송, 결제 테스트, 이메일 발송 | 영향 받는 사용자 수 |

  경고 형식:
  ```
  ⚠️ 위험 작업 경고
  - 작업: [무엇을]
  - 영향: [테이블/건수/사용자]
  - 되돌리기: [가능/불가능, 방법]
  - dry-run 결과: [있으면 요약]
  → 진행해도 될까요?
  ```

- **항상 권장 (경고는 아니지만)**:
  - 대량 UPDATE는 dry-run 먼저 → 표본 확인 → --execute
  - 스키마 변경 시 `prisma migrate diff` 또는 `db pull`로 현재 상태 확인
  - 마이그레이션 시 이전 스키마 백업 (`schema.prisma` git 커밋 먼저)
- **재검토 시점**:
  - 기능 안정화 시점 (사용자 판단) → 개발 Supabase 프로젝트 신설 + `.env.local` 오버라이드
  - CLAUDE.md의 "운영 DB URL 금지", "prisma db push 금지" 문구는 **현재 상황과 불일치** — 별도 조정 필요 (사용자 승인 대기)
- **참조**: lessons.md "개발 DB라고 믿은 .env가 사실 운영 DB"

### [2026-04-17] 다음카페 본문 정규식 파서 도입 + game_type 자동 분류 (LLM 기각)
- **분류**: decision
- **발견자**: pm + developer
- **결정**: 외부 스크래퍼가 다음카페 게시판 본문을 `games.description`에 통째로 저장(구조화 필드 비움/부정확)하는 상태에서, **순수 함수 정규식 파서**(`src/lib/parsers/cafe-game-parser.ts`)를 도입해 시각/장소/비용/모집인원/game_type 자동 추출. 백필 스크립트로 257건 중 147건(57%) 컬럼 채움 + game_type 66건 재분류 완료(개발 DB).
- **대안 비교**:
  - **A. 정규식 파서**(채택) — 4~6h, 무료, 95%+ 정확도. 본문 양식이 "1. 라벨 : 값" 9항목으로 매우 일관적이라 가능
  - B. LLM(Claude API) — 90~95% 정확도, 월 $30~50, 외부 의존
  - C. 입력 위자드(스크래핑 폐기) — 100% 정확하지만 다음카페 인입 끊김
  - D. 하이브리드(정규식 + LLM 폴백) — 95%, 12~16h, 비용 $10~20
- **이유**: (1) 본문 양식 표본 5건 검증 결과 일관성 매우 높음 → 정규식만으로 충분. (2) LLM은 빠른 프로토타입 가치 있지만 비용·외부 의존이 부담. (3) 입력 위자드는 다음카페 데이터 인입을 끊으므로 비현실적. (4) D(하이브리드)는 정규식이 75% 미만일 때만 가치 — 표본상 95%+이므로 보류.
- **운영 가드**: 백필 스크립트는 dry-run 기본 + `--execute` 명시 + 운영 DB 호스트 화이트리스트(`bwoorsgoijvlgutkrcvs`). 덮어쓰기 금지(`venue/city/district`는 NULL일 때만, `fee`는 0/NULL일 때만, `scheduled_at`은 created_at과 5분 이내일 때만). game_type은 `--reclassify-types --execute` 추가 옵트인 시에만 + null 보류 케이스(85건)는 변경 안 함.
- **참조**: lessons.md "다음카페 본문 양식이 매우 일관적" / conventions.md "외부 게시판 본문 파서 패턴"
- **참조횟수**: 0

### [2026-04-17] 공식 기록 가드 전역 적용 (officialMatchWhere 공통 유틸)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 순위/선수기록/팀기록/서브도메인 경기결과/최근 경기 위젯 등 **"이미 치러진 공식 경기"만 집계해야 하는 쿼리**에 다음 3조건을 공통 유틸로 강제 적용 — (1) `status IN (completed, live)` (2) `scheduledAt <= NOW()` (3) `scheduledAt IS NOT NULL`. 유틸 위치: `src/lib/tournaments/official-match.ts` → `officialMatchWhere(extra?)` + nested용 `officialMatchNestedFilter()`. **적용 대상(subin 범위)**: teams/[id]/page.tsx 승패집계, overview-tab/games-tab 최근경기(이미 수동 적용 → 유틸로 교체), public-standings 순위 탭, services/user.ts getPlayerStats aggregate 2회+ raw SQL 승률, api/live/route.ts recentCompleted, _site/results+_site/page.tsx. **적용 제외**: 대진표·일정 뷰(예정 경기 노출 필요), admin/편집/생성/CRUD, 기록원/심판/예약 API, sync/seeding/league-generator 빌더. **원영 담당 분리**: public-bracket/route.ts는 PR #16 homeScore fallback 로직과 중첩이라 원영 선처리 후 적용 협의. tournament-tabs.tsx는 prisma 미사용(API fetch)이라 가드 무관.
- **근거**: (a) Flutter 앱에서 미래 경기를 `status=live`로 세팅하는 테스트 케이스 실측(id=120, 2026-04-18) — 순위표/커리어 평균을 오염시킴. (b) games-tab/overview-tab 2곳만 수동 방어 중 → 나머지 영역(공식 랭킹/커리어 스탯) 구멍 잔존. (c) 유틸화하지 않으면 새 페이지 추가 시 3조건 중 1개 빠뜨릴 위험. (d) raw SQL 1곳(user.ts L188) 포함해 9개 지점 일관 적용.
- **대안 비교**: ① Prisma middleware로 전역 필터 — 거부(대진표/일정/편집 쿼리까지 잘라내 부작용 큼). ② DB에 check constraint/뷰 — 거부(Rails 호환 schema 수정 금지 + live에서 미래를 막으면 Flutter 테스트 흐름도 깨짐). ③ 각 쿼리마다 인라인 3조건 반복 — 채택 안 함(3회째 중복 발생 + 누락 위험). → **공통 유틸 함수**로 채택: Prisma WhereInput을 그대로 반환하므로 Prisma 타입 추론/컴파일 체크가 그대로 동작, 단위 테스트도 단순.
- **참조횟수**: 0

### [2026-04-16] ⛔ 정정됨 — 대회 선수 userId 자동 연결 v2 (회원가입 hook) **미구현 확정**
- **분류**: decision(취소)
- **발견자**: planner-architect → **정정: pm(사용자 지시)**
- **정정 내용(2026-04-17)**: 위 결정은 **취소**. 열혈농구단 SEASON2는 **일회성 백필**(Phase A 25건 UPDATE + MatchPlayerStat 197건 연결, 2026-04-17 완료)로 처리. **회원가입 hook / link-player-user 개선 구현 안 함**. 이유: (1) 추가 가입자가 tournament_team_player와 연결되는 경우는 향후 드물게 발생(주로 admin이 대회 생성 시 일괄 처리 or 팀 가입 흐름) → 전체 가입 플로우에 훅 추가는 과잉. (2) 이름 기반 전역 hook은 동명이인 위험 지속. (3) 기존 4시나리오 **A>D>B>C** 유지(2026-04-13 결정 그대로). admin 수동 연결(C)로도 충분.
- **후속**: 2026-04-17 Phase C(팀 병합) 결정으로 대체됨. 아래 2026-04-17 항목 참조.
- **참조횟수**: 0

### [2026-04-17] 열혈농구단 SEASON2 일회성 선수 userId 백필 + 팀 병합
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (Phase A) 대회 `d83e8b83-66d3-4f2f-ac41-3b594dbc38f6`에 한해 일회성 스크립트로 player_name ↔ BDR user 매칭 — 25건 UPDATE 완료, MatchPlayerStat 197건 자동 연결, 데이터 손실 0. (Phase C) 동일 대회에서 드러난 **중복 팀 병합**: teamId=196 "셋업(SET UP)" ← "경기 셋업" 흡수, teamId=198 "쓰리포인트" ← "원주 3포인트" 흡수. 2026-04-13 B안(TournamentTeam.teamId UPDATE) **확장 적용** — 이번엔 Team 자체도 소프트 비활성화(status="merged", is_public=false, name에 "[merged into N]" 표시). DELETE 금지, 데이터 보존. 동명이인 가짜 계정(2984/2985)도 users.status="merged" 소프트 처리. 실행은 트랜잭션 + 사전/사후 카운트 검증.
- **이유**: (1) 열혈SEASON2 대회는 공식 운영 전 과도기 데이터 → 수기 등록/가짜계정/중복팀이 혼재 → 구조적 개선보다 "이 대회 한정 정리"가 최소 위험. (2) 중복 팀은 웹 팀 상세 페이지에서 경기 기록이 분산되는 UX 문제 유발 → 병합 필수. (3) 사용자 증언에 의해 동일 팀 확정 → 기술적 병합만 남음. (4) 일회성 처리이므로 회원가입 hook처럼 지속 유지보수 부담 없음.
- **대안 기각**: (A) 회원가입 hook 구현(2026-04-16 취소된 결정) — 과잉, 동명이인 리스크. (B) DELETE로 완전 삭제 — 참조 무결성 위반 위험, 복구 불가. (C) 대회 후 병합 — UX 문제 지속.
- **참조횟수**: 0

### [2026-04-14] 순위 로직: KBL 방식 (승률 → 득실차 → 다득점)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 정렬 기준: 승률 1차 → 득실차 2차 → 다득점 3차 (KBL 공식 방식). (2) 공동순위 처리: 대회 진행 중에는 승률만 일치해도 공동순위, 대회 종료 후에는 세부 기준까지 전부 일치해야 공동순위. (3) 집계 소스: Team.wins/losses 필드 대신 tournament_matches에서 실시간 집계(status="completed"+"live" 둘 다 포함). (4) 무승부는 농구에 없으므로 제외.
- **이유**: (1) KBL 방식은 한국 팬에게 가장 익숙한 기준. (2) Team.wins/losses는 자동 갱신되지 않아 실시간성 손상 — 매 쿼리 집계가 정확. (3) 진행 중 공동순위를 너무 엄격히 잡으면 UX가 혼란.
- **대안 기각**: (A) NBA 방식(승률만) — 득실차를 무시해 한국 정서와 거리. (B) Team 필드 자동 갱신 트리거 — Flutter 앱 경로와 동기화 위험.
- **참조횟수**: 0

### [2026-04-14] 대진표 자동 생성 흐름 (뼈대 선생성 + 리그 완료 시 할당)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 풀리그 자동 생성: N*(N-1)/2 조합을 league-generator.ts에서 생성. (2) 토너먼트 뼈대 미리 생성: 팀 미확정 상태여도 match 레코드를 전부 만들고 settings.homeSlotLabel("A조 1위")로 플레이스홀더 저장. (3) 리그 완료 시 자동 팀 할당: assignTeamsToKnockout()이 순위 기반 TournamentTeam.seedNumber + homeTeamId 설정. (4) 2의 제곱 아닌 knockoutSize(6팀, 12팀 등)도 BYE 자동 처리.
- **이유**: (1) 뼈대 선생성하면 대진표 UI에서 "다음 경기는 A조 1위 vs B조 2위"를 미리 보여줄 수 있어 UX 개선. (2) BYE 자동 처리로 admin이 수동으로 부전승을 배치하지 않아도 됨. (3) seedNumber가 남아있어야 UI에서 시드 뱃지 표시 가능.
- **대안 기각**: (A) 리그 종료 시점에 match 레코드를 일괄 생성 — 진행 중 대진표 미리보기 불가. (B) homeTeamId를 null로 두고 문자열 라벨 필드 추가 — DB 필드 증가, settings Json으로 해결 가능.
- **참조횟수**: 0

### [2026-04-14] 대회 선수 userId 자동 연결: 이름 정확 일치만 허용
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 현장등록(Flutter v1) 시 player_name을 TeamMember.name과 정확 일치로 매칭하여 TournamentTeamPlayer.userId 자동 설정. (2) 유사 매칭(레벤슈타인 등) 미사용. (3) 매칭 후보 2명 이상이면 skip. (4) 기존 NULL 데이터 정리용 admin 배치 API 제공. (5) 로직을 link-player-user.ts로 분리해 4곳에서 재사용.
- **이유**: (1) 동명이인 오매칭이 한 번 발생하면 유저 기록이 엉뚱한 사람에게 연결되어 되돌리기 어려움. (2) 정확 일치만으로도 현장등록의 90%+가 자동 연결됨(팀 가입자는 이미 TeamMember에 이름 있음). (3) 실패 케이스는 admin 수동 연결로 해결.
- **대안 기각**: (A) Flutter 앱에서 userId를 직접 전송 — 앱 업데이트 필요, 즉시 효과 없음. (B) 유사 매칭 — 오매칭 위험.
- **참조횟수**: 0

### [2026-04-14] 사이트 전역 팀명/선수명을 Link로 전환
- **분류**: decision
- **발견자**: pm
- **결정**: 모든 팀명 → /teams/{teamId}, 선수명 → /users/{userId} 링크. 예외: 일정 카드 내부 팀명(카드 자체가 Link라 중첩 불가).
- **이유**: (1) 대회/경기 맥락에서 "이 팀 뭐지? 이 선수 누구지?"를 한 번의 클릭으로 해소 — 탐색성 향상. (2) Link 중첩은 HTML 유효성 위반 + 접근성 문제 → 카드형은 예외 처리.
- **대안 기각**: 모달 팝업 — 페이지 이동이 더 직관적, 뒤로가기로 복귀 가능.
- **참조횟수**: 0

### [2026-04-13] 대회 기록 자동 연결: 4시나리오 우선순위 A>D>B>C
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 시나리오 A(현장등록 시 자동 매칭)가 최우선 -- Flutter v1 players API에서 create 직후 팀 멤버 이름 매칭으로 userId 설정. (2) 시나리오 D(배치 정리)가 2순위 -- 기존 NULL 데이터 일괄 정리용 admin API. (3) 시나리오 B(팀 가입 시 과거 연결) 3순위 -- teams join에서 과거 대회 기록 소급 연결. (4) 시나리오 C(admin 수동 연결) 4순위 -- 자동 매칭 실패 케이스 수동 해결. 핵심 로직을 link-player-user.ts로 분리하여 4곳에서 재사용.
- **이유**: (1) 현장등록이 userId NULL의 유일한 원인이므로 근본 해결. (2) 이름 매칭은 정확 일치만 적용 -- 유사 매칭은 오매칭 위험. (3) 매칭 후보 2명 이상이면 skip(안전). (4) 기존 API 응답 형식 변경 없음(userId null->값, 하위호환).
- **대안 기각**: (A) Flutter 앱에서 userId를 보내도록 수정 -- 앱 업데이트 필요, 즉시 적용 불가. (B) 이름 유사 매칭(레벤슈타인) -- 동명이인 오매칭 위험, 과잉 설계.
- **참조횟수**: 0

### [2026-04-13] 중복 팀 병합: TournamentTeam.teamId만 변경 (B안 채택)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 대회 참가팀(TournamentTeam)의 teamId FK만 대회팀->본팀으로 UPDATE. 대회 경기/스탯 데이터는 TournamentTeam.id(PK)를 참조하므로 변경 불필요. 미참가 중복팀(멤버 0, 참조 0)은 외래키 검증 후 DELETE.
- **이유**: (1) TournamentMatch.homeTeamId/awayTeamId는 TournamentTeam.id(PK)를 참조하므로 teamId 변경이 경기 데이터에 영향 없음. (2) 1개 UPDATE 쿼리로 완료되어 트랜잭션 범위 최소. (3) TournamentTeam에 unique(tournamentId, teamId) 제약이 있으므로 같은 대회에 본팀이 이미 참가하지 않았는지 사전 확인 필수.
- **대안 기각**: (A) 대회 후 병합 -- 안전하지만 대회 진행 중 웹 팀 상세 페이지에서 대회 기록이 분산 표시되는 UX 문제 지속. (C) Team 자체 교체(211 삭제, 200으로 모든 참조 이전) -- 변경 테이블 6+개, 위험도 높음.
- **참조횟수**: 0

### [2026-04-13] 대회 형식 프리셋 시스템: settings Json 활용 + DB 변경 없음
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 대회 조편성/토너먼트 자동 구성 설정을 Tournament.settings(Json) 필드에 preset 객체로 저장. DB 스키마 변경 없음. (2) 프리셋은 프론트 상수로 정의하되 settings에도 저장하여 서버에서 참조 가능. (3) 조편성은 스네이크 드래프트 방식(시드 기반 지그재그 배치). (4) 토너먼트 시딩은 교차 배치(같은 조 팀이 결승 전까지 안 만남). (5) 조별리그 경기는 group_name만 설정하고 round_number/bracket_position은 null. (6) 3/4위전은 결승과 같은 round_number에 별도 bracket_position. (7) 로직을 3파일로 분리: preset.ts(프리셋 정의), group-draw.ts(조편성), knockout-seeding.ts(토너먼트 시딩).
- **이유**: (1) Tournament.settings가 Json={}로 이미 존재하여 스키마 변경 불필요. 운영 DB 마이그레이션 위험 제거. (2) TournamentTeam.groupName/seedNumber/group_order와 TournamentMatch.group_name이 이미 존재하여 조별리그 데이터 모델 완비. (3) 스네이크 드래프트는 축구 월드컵/프로 스포츠에서 표준 방식으로 조간 균형 보장. (4) 로직 분리는 단위 테스트와 재사용성 확보.
- **대안 기각**: (A) 별도 tournament_presets/tournament_groups 테이블 신설 -- DB 마이그레이션 필요, Flutter 앱 호환성 문제. (B) format 필드에 세부 설정을 인코딩 -- VarChar 하나로는 조 수/진출 수 등 표현 불가. (C) 프론트에서만 프리셋 관리(서버 미저장) -- 대진표 생성 API에서 설정 참조 불가.
- **참조횟수**: 0

### [2026-04-13] 대진표 탭: format 기반 조건부 렌더링 + 조별 전적 경기결과 집계
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) public-bracket API에서 tournament.format을 반환하여 프론트에서 대회 형식별 UI 분기. (2) 조별 경기(group_name 있는 경기)를 별도로 조회하여 groupMatches로 반환. (3) GroupStandings의 wins/losses를 tournament_teams 테이블에서 읽지 않고 경기 결과에서 직접 집계 (public-standings와 동일 패턴). (4) format 분기: round_robin=조편성+경기결과만, single_elimination/double_elimination=토너먼트 트리만, group_stage=조별리그+토너먼트 트리 둘 다.
- **이유**: (1) tournament_teams.wins/losses가 갱신되지 않는 문제를 public-standings에서 이미 경기결과 집계로 우회함 → 동일 패턴 적용. (2) 현재 API가 format을 안 읽어서 프론트가 대회 형식을 모름 → 리그전/토너먼트 구분 불가. (3) 조별 경기는 group_name만 있고 round_number/bracket_position이 없어서 현재 bracketOnlyMatches 필터에서 제외됨.
- **대안 기각**: (A) tournament_teams.wins/losses를 경기 완료 시 자동 갱신하도록 수정 — DB 트리거 또는 API 후처리 필요, 기존 Flutter 앱과의 호환성 문제. (B) 별도 API 엔드포인트 신설 — 기존 public-bracket을 확장하는 것이 더 단순.
### [2026-04-15] 헬스체크 cron 2차 — self-fetch + Promise.allSettled 병렬
- **분류**: decision
- **발견자**: planner-architect
- **결정**: `/api/cron/referee-healthcheck`의 8항목 점검을 (1) **self-fetch 방식으로 자기 도메인 API를 실제 호출**, (2) **Promise.allSettled로 병렬 실행**, (3) **실패해도 끝까지 진행 후 종합 기록**하도록 결정.
- **대안 검토**:
  (A) 내부 함수 직접 호출 (prisma + 서비스 함수 호출) → 빠르지만 미들웨어/라우팅/쿠키 경로를 건너뛰어 "실제 유저 경로 고장"을 못 잡음. 헬스체크 본래 목적과 어긋남.
  (B) **[채택]** self-fetch + Promise.allSettled 병렬 + 개별 5초 타임아웃 → 실제 유저와 동일 경로 검증 + 8항목 5~7초 완료 + Vercel Hobby 10초 제한 내.
  (C) 순차 실행 → 총 시간 40초+로 Vercel 10초 제한 초과. 실패 1건이 뒤를 막음.
- **이유**: (1) "진짜 문 열어보기" — cron은 관측자 역할이므로 미들웨어 버그/인증 쿠키/라우팅 설정까지 전부 통과한 경로를 재현해야 의미가 있다. (2) 8항목이 서로 독립이라 병렬이 자연스럽고, allSettled는 1건 실패가 나머지를 막지 않음. (3) 중단 없이 끝까지 감 — 헬스체크의 목적은 "어디가 고장났는지" 전부 파악. (4) Vercel self-fetch는 공식 지원, cold start는 매시간 유지되는 cron 특성상 warm 상태.
- **부차 결정**:
  (1) 봇 로그인은 Admin/Referee 각 1회만 실행 후 set-cookie 파싱해 이후 점검에 재사용 — 매번 로그인 시 5배 지연.
  (2) HealthCheckRun은 시작 시 running 생성 → 끝에 passed/partial/failed 업데이트. 결과 8건은 createMany 1회 batch.
  (3) 개별 타임아웃 5초 (AbortController) — 심각한 지연의 명확한 지표, 전체 10초 안에 수렴.
  (4) baseUrl 선택 우선순위: `APP_URL` → `VERCEL_URL` → `req.nextUrl.origin`.
- **구현 예외 (2026-04-15 구현 시 조정)**:
  check3(봇 로그인)만 self-fetch가 아닌 **내부 함수 호출**로 대체. 이유: 프로젝트의 웹 로그인이 Server Action(`loginAction`) 기반이라 JSON POST 엔드포인트가 없음. cron의 `performBotLogin`은 `loginAction`의 4단계(findUnique → status 확인 → bcrypt.compare → generateToken)를 동일 순서로 재현하여 로그인 계약 회귀는 충분히 탐지. check4/5/6/7/8은 설계대로 self-fetch 유지.
- **참조횟수**: 0

### [2026-04-13] 심판 알림 — 신규 Notification 모델 만들지 않고 기존 `notifications` 재사용
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 신규 RefereeNotification 모델을 만들지 않고 **기존 Rails 호환 `notifications` 테이블 그대로 사용**.
- **대안 검토**:
  (A) RefereeNotification 신규 모델 (필드 축소형) → 조회 분리로 쿼리 단순, 그러나 테이블 2개 관리, 통합 벨 UI 시 union 쿼리 필요.
  (B) **[채택]** 기존 notifications 재사용 + NOTIFICATION_TYPES에 referee.* 5종 추가 → 모델 0 추가, 헬퍼/UI 완전 재사용, bdr 웹과 심판 플랫폼 알림 통합 가능.
  (C) Referee 자체 소셜 알림함 구축 → 과잉 설계.
- **이유**: 기존 `src/lib/notifications/create.ts` 인프라 + createNotificationBulk + tournament-reminders cron 패턴이 완비됨. Referee는 User.id 갖고 있으므로 user_id 기반 조회로 자연 통합. 향후 mybdr 본체 알림과 한 벨에서 보는 것이 UX에 유리.
- **부차 결정**:
  (1) 공고 마감은 **lazy close 우선 + Cron 2차** — 목록 GET 시 updateMany 1회로 99% 커버, Cron은 새벽 누락분 정리용.
  (2) 정산 상태 5종 중 **paid/cancelled/refunded 3종만 알림** — pending/scheduled는 내부 상태라 알림 피로도 방지.
  (3) 알림 생성 실패는 **메인 트랜잭션 외부 try/catch** — 선정/배정 성공이 우선, 알림 에러는 로그만.
  (4) Flutter 앱 알림은 기존 v1 API 체계와 분리 — 이번 단계는 웹 플랫폼 내부 벨만.
- **참조횟수**: 0

### [2026-04-13] 심판 배정 워크플로우 — 기존 RefereeAssignment를 "현장 배정" 단계로 재정의 + 앞단 4모델 추가
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 기존 1모델 CRUD를 버리지 않고 **앞단에 공고/신청/선정/책임자 4모델을 쌓는** 방식 채택. RefereeAssignment에는 pool_id FK 1개만 nullable 추가.
- **대안 검토**:
  (A) RefereeAssignment 폐기 + 신규 모델로 전면 교체 → 기존 데이터/페이지/API 모두 이관 필요. 작업량 2~3배.
  (B) **[채택]** RefereeAssignment 유지 + pool_id nullable 추가 + 앞단만 신설 → 기존 0변경, 점진 마이그레이션 가능, 과도기 2경로 운영 가능.
  (C) Announcement 하나에 모든 것 때려넣기 (dates/applications/pool을 JSON으로) → 검색/조인 불가, 인덱스 불가.
- **이유**: 바이브 코더 원칙(단순성 + 작동하는 코드 리팩토링 금지 + 점진적 확장). 기존 assignments 페이지가 이미 운영 중이라 중단 리스크 회피 필요. pool_id를 nullable로 두면 "기존 방식 배정"과 "신규 풀 기반 배정"이 공존 가능.
- **부차 결정**:
  (1) is_chief를 DailyAssignmentPool 컬럼 1개로 처리 (별도 Chief 테이블 X) — 조인 절감 + 단순성 우선.
  (2) dates는 Postgres `DateTime[] @db.Date` 배열 사용 (JSON 대신) — 인덱스 가능, 쿼리 편의.
  (3) required_count만 JSON — "일자 → {referee: N, scorer: M}" 형태로 키가 동적.
  (4) 새 권한 키 추가 안 함 — 기존 `assignment_manage` 재사용. 공고/신청/선정/책임자 지정 모두 팀장급 동일 권한.
- **참조횟수**: 0

### [2026-04-14] 서류 이미지 저장 + OCR + 업로드 방식 확정
- **분류**: decision
- **발견자**: pm (사용자 확정)
- **결정**: (1) 이미지: sharp 1500px+그레이스케일+JPEG Q70 → ~200KB/장, AES-256 암호화 DB 저장. (2) OCR: **Naver Clova OCR** (한국 서버, 개인정보 보안 최우선). (3) 신분증 OCR 미사용 (수동 입력). (4) 업로드 주체: **개인이 직접 업로드가 기본**, 관리자도 대리 업로드 가능.
- **이유**: (1) Clova는 한국 서버라 개인정보 국외이전 이슈 없음. 한국 서류 템플릿 보유. (2) 개인이 자기 서류를 직접 올리는 게 개인정보 자기결정권 원칙에 부합. (3) 비용 월 100건 무료 + 건당 5원, 충분히 저렴.
- **참조횟수**: 0

### [2026-04-13] v3 협회 주도 사전 등록 + 유저 매칭 시스템
- **분류**: decision
- **발견자**: pm (planner-architect 분석 + 사용자 확정)
- **결정**: 심판/경기원은 "자기 등록" 방식에서 "협회 관리자가 사전 등록 → 유저 매칭" 방식으로 전환. Referee.user_id를 nullable로 변경하여 User 없이도 Referee 레코드 생성 가능. 매칭 키는 이름+전화번호. 자기 등록은 1차에서 제외.
- **이유**: (1) 실제 심판 자격은 협회가 부여하는 것이지 자기 선언이 아님. (2) 정산용 주민번호 등 민감 정보는 관리자가 입력해야 안전. (3) 기존 mybdr 유저 + 신규 가입 유저 모두 자연스럽게 매칭 가능.
- **참조횟수**: 0

### [2026-04-13] 협회 관리자 역할 9종 세분화 (임원 열람 전용)
- **분류**: decision
- **발견자**: pm (사용자 확정)
- **결정**: AssociationAdmin에 role 필드 추가. 임원 3종(president/vice_president/director)은 모든 기능 열람만. 실무 6종(secretary_general/staff/referee_chief/referee_clerk/game_chief/game_clerk)이 실제 관리 수행. 관리자 추가/삭제 + 주민번호 열람은 회장+사무국장만.
- **이유**: 실제 협회 조직 구조 반영. 임원은 의사결정 레벨이라 실무 관여 안 함.
- **참조횟수**: 0

### [2026-04-13] 심판 플랫폼 아키텍처 — 분리형 + 도메인/DB 공유
- **분류**: decision
- **발견자**: pm (planner-architect 분석 + 사용자 승인)
- **결정**: 심판/경기원 플랫폼은 메인 사이트와 "분리형"으로 운영. 단, 도메인(mybdr.co.kr/referee)과 DB(단일 PostgreSQL)는 공유. Next.js App Router의 `(referee)` 라우트 그룹 + 독립 셸(referee-shell.tsx)로 코드 레벨 분리.
- **이유**: (1) 심판 플랫폼은 "업무 도구"(배정/정산/자격증)이므로 일반 유저 UX와 섞이면 혼란. (2) DB 공유 필수 — User/Tournament/Game 참조가 핵심(분리 시 크로스 DB 조인 불가). (3) 같은 도메인이라 인증(쿠키/세션) 자동 공유. (4) Vercel 단일 앱 배포로 운영 단순. (5) 이미 11페이지+17 API가 분리형으로 구현 완료.
- **대안 기각**: (A) 통합형(메인 네비에 심판 메뉴 추가) — 일반 유저에 불필요한 메뉴 노출, 기존 구현 롤백 비용 큼. (B) DB 분리 — User 조회용 별도 API, 크로스 DB 조인 불가, Prisma 멀티 DB 복잡도 급증. (C) 서브도메인(referee.mybdr.co.kr) — 쿠키 공유 설정 변경 필요, localhost 테스트 까다로움, 실익 없음.
- **향후 확장**: 트래픽 폭증 시 서브도메인 → 별도 Vercel 앱 → DB 읽기 복제본 순으로 단계적 분리 가능. 현재 규모(심판 수백명)에서는 수년간 불필요.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 최종확정 - 관리자-협회 연결은 매핑 테이블(옵션 B)
- **분류**: decision
- **발견자**: pm (사용자 승인)
- **결정**: `users` 테이블에 `managed_association_id` 컬럼을 추가하지 않고, 별도 `association_admins(user_id unique, association_id)` 매핑 테이블 1개로 해결. ALTER TABLE 0건 유지.
- **이유**: (1) 브랜치 격리 DB 전략의 핵심 원칙 "기존 테이블 0수정" 일관성. (2) 한 사람 = 한 협회 1차 제약도 `user_id unique`로 동일하게 강제 가능. (3) 향후 복수 협회 관리 확장 시 unique만 제거하면 됨.
- **대안 기각**: 옵션 A(users ADD COLUMN managed_association_id) — ALTER TABLE 1건 발생, 운영 DB 공유 환경에서 위험.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 최종확정 - Referee↔User 관계는 v1 양방향 (User 1줄 추가)
- **분류**: decision
- **발견자**: pm (사용자 승인)
- **결정**: `prisma/schema.prisma`의 User 모델에 `referee Referee?` 1줄만 추가하고, Referee 모델에는 `user User @relation(fields: [user_id], references: [id], onDelete: Cascade)` 선언. DB users 테이블은 컬럼/인덱스/FK 전혀 건드리지 않음(Prisma 메타데이터일 뿐).
- **이유**: (1) `referees.user_id`에 DB 레벨 FK 제약이 생겨 "존재하지 않는 user_id로 Referee 생성" 불가. 앱 레벨 검증보다 훨씬 안전. (2) User 모델 1줄 추가는 users 테이블 스키마 영향 0 — "기존 테이블 수정 금지" 원칙의 예외로 인정. (3) Prisma Client에서 `user.referee` nested include 가능 → 코드 단순화.
- **대안 기각**: v2(단방향 FK 없음) — 무결성 앱 책임으로 구멍 발생 위험.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 최종확정 - RefereeAssignment는 TournamentMatch 단독 FK
- **분류**: decision
- **발견자**: pm (사용자 결정)
- **결정**: `RefereeAssignment.game_id` 필드 제거. `tournament_match_id BigInt NOT NULL`만 남김. 일반 경기(`games` 테이블, 픽업/친선)는 심판 배정 대상이 아님.
- **이유**: (1) 사용자가 "일반경기는 배정 기능 필요 없음"이라고 명시. (2) CHECK 제약(둘 중 하나만 채움) zod 로직 불필요 → 코드 단순화. (3) KBL/WKBL 포함 모든 공식 배정 대상은 `tournament_matches`로 집약. (4) NOT NULL로 만들 수 있어 데이터 무결성 강화.
- **대안 기각**: (A) game_id + tournament_match_id 동시 보유 — 실제 사용 없음, 복잡도만 증가. (B) game_id 단독 — 공식 대회 배정 불가.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 - 협회 계층형 모델 (Association)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: Association 모델을 계층형(self-relation parent_id)으로 설계, 총 20개 시드(KBA 1 + 시도 17 + KBL/WKBL 2). level 필드로 national/sido/pro_league 구분. code는 KBA-XX (ISO 3166-2:KR 기반) + KBL/WKBL. KBL/WKBL은 KBA 산하가 아닌 독립 pro_league로 parent_id=null.
- **이유**: (1) 추후 시군구 협회 확장을 자체 구조 변경 없이 수용 가능 (parent_id만 추가). (2) 시도 17개는 src/lib/constants/regions.ts의 REGIONS 키와 정확히 일치하므로 단일 소스 오브 트루스로 재사용. (3) 프로리그는 시도 체계와 직교하므로 level 필드로 분리하는 게 가장 단순.
- **대안 기각**: (A) 평면 Association 테이블(parent_id 없음) — 시군구 확장 불가. (B) enum으로 고정 20개 — 추후 조직 변경 시 마이그레이션 필요.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 - 자격증 파일 업로드 제거 + 교차검증
- **분류**: decision
- **발견자**: planner-architect
- **결정**: RefereeCertificate.file_url 필드 완전 제거. 대신 cert_number + User(name/birth_date/phone) 조합으로 협회 측 명단과 교차검증하여 verified=true 설정.
- **이유**: (1) 파일 업로드는 Vercel Blob/S3 설정 + 개인정보 저장 + 열람 권한 설계가 필요해 1차 범위 초과. (2) 협회 측이 공식 자격증 명단을 Excel로 보유 중 — 파일보다 데이터 매칭이 검증으로 더 강력. (3) 위변조 파일 수동 검토 부담 제거.
- **대안 기각**: (A) file_url + verified 병행 — 검증 기준 이중화로 혼선. (B) PDF OCR — 정확도/구현 비용 과다.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 - Excel 일괄 + 개별 토글 2-way 검증
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 협회 관리자의 자격증 검증 방식을 두 가지 모두 제공. (1) Excel 업로드: 9컬럼 xlsx → preview(파싱+매칭, DB미변경) → confirm(트랜잭션 일괄 verified=true) 2단계. (2) 개별 토글: admin/members/[id]에서 자격증별 PATCH /verify 엔드포인트로 버튼 클릭 토글. Excel은 5MB/500행 제한, 파일은 저장하지 않고 즉시 폐기.
- **이유**: (1) 대량 신규 등록 시 Excel이 효율적, (2) 예외 케이스(오타/이력 변경)는 개별 토글이 필요. (3) 2단계 UX는 실수 롤백 가능성 확보. (4) 파일 미저장은 개인정보 최소수집 원칙 준수.
- **대안 기각**: (A) Excel만 — 예외 처리 불가. (B) 개별만 — 초기 대량 검증 비효율. (C) 1단계 즉시 반영 — 실수 복구 불가.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 - 심판 공개 목록 제거
- **분류**: decision
- **발견자**: planner-architect
- **결정**: /referee/registry 경로 삭제. 심판 목록은 (a) 본인 profile/ 조회 + (b) admin/members/ 관리자 목록 두 컨텍스트만. 일반 유저는 심판 목록 페이지 접근 불가. 1차에선 경기 배정 UI도 없으므로 실제 노출 경로는 0개.
- **이유**: (1) 개인정보 보호 — 실명/생년월일/자격증 번호는 공개 목록에 부적합. (2) 심판은 "경기 배정 도구"로만 노출되어야 하며, 시장 탐색용 디렉터리가 아님. (3) 공개 목록은 스팸/괴롭힘 대상이 될 수 있음. (4) 경기 배정 기능이 구현되면 그 안에서만 드러나도록 격리.
- **대안 기각**: (A) 로그인 필수 공개 목록 — 여전히 개인정보 유출 리스크. (B) 닉네임만 공개 — 2-way 검증에 실명이 필요하므로 모델 분리가 복잡.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 - 실명 노출 (User.name)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: Referee 표시 이름은 User.name(실명) 사용. 기존 User 모델에 name(String?), birth_date, phone이 모두 존재하므로 그대로 활용. verified_name/verified_birth_date/verified_phone은 검증 시점 스냅샷으로 Referee에 별도 저장(추후 User 변경 감지용).
- **이유**: (1) 심판은 공식 자격으로 활동하므로 실명 식별이 필수. nickname은 커뮤니티용. (2) Excel 교차검증 키(실명+생년월일+전화번호)와 일치해야 함. (3) User 필드가 이미 존재 → 별도 컬럼 추가 불필요. (4) 스냅샷을 Referee에 두면 User 변경 시 재검증 필요 여부 감지 가능.
- **대안 기각**: (A) Referee에 real_name 별도 컬럼 — User.name과 중복, 동기화 부담. (B) nickname 노출 — 검증 시스템과 불일치.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 - 배정/정산 조회 전용 1차 포함
- **분류**: decision
- **발견자**: planner-architect
- **결정**: RefereeAssignment + RefereeSettlement 2모델을 1차 범위에 포함. 단 생성 로직(관리자 배정 UI, 정산 계산 자동화)은 2차로 분리. 1차엔 조회 API + 본인 페이지만 구현, 테스트 데이터는 DB 수동 insert 또는 seed 확장. 경기 엔티티 FK는 tournament_match_id / game_id 2개 분리 컬럼(어느 한쪽만 채움), Prisma @relation은 선언하지 않음(기존 games/TournamentMatch 모델 0수정).
- **이유**: (1) 스키마를 미리 확정하면 나중에 배정 생성 로직 추가 시 테이블 변경 없이 API만 추가 가능. (2) 본인 대시보드에서 "최근 배정"/"미정산 금액"을 1차부터 보여주는 UX 가치가 큼. (3) 경기 엔티티 FK 분리는 pickup games와 공식 tournament 둘 다 배정 대상이 될 수 있어 양쪽 지원. (4) @relation 생략은 기존 모델 수정 금지 원칙 준수의 대가 — 조회 시 별도 쿼리 2회 발생하지만 1차 볼륨에선 무시할 만함.
- **대안 기각**: (A) 2차로 전체 연기 — 본인 대시보드 가치 미확보. (B) 단일 `entity_type + entity_id` 폴리모픽 — 타입 안정성 저하 + 인덱스 효율 낮음. (C) games/TournamentMatch에 역방향 relation 추가 — 기존 모델 수정, 원칙 위반.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 v2 - AssociationAdmin 매핑 테이블 (User 0수정)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 협회 관리자(association_admin)의 소속 협회 식별을 위해 User에 컬럼을 추가하지 않고 **AssociationAdmin(user_id unique, association_id)** 매핑 테이블을 신설. 권한 체크는 `User.admin_role === "association_admin"` AND `AssociationAdmin` 행 존재 이중 조건. admin_role 필드는 기존에 있으므로 값만 "association_admin" 추가하여 컬럼 변경 0건.
- **이유**: (1) users 테이블은 73 컬럼으로 이미 비대 — 추가 ALTER 최소화. (2) subin-referee 브랜치 격리 DB 전략과 일관: "CREATE TABLE만 허용, ALTER 금지". (3) 1인 1협회 제약은 user_id unique로 강제. (4) 추후 1인 다협회 확장 시 unique만 해제하면 되어 유연. (5) admin_role 기존 값("super_admin"/"org_admin"/"content_admin")에 값 하나 추가하는 것은 컬럼 변경 아님.
- **검증**: `prisma db push --dry-run` 결과가 `ALTER TABLE users`를 포함하면 즉시 중단. 정상이면 CREATE 6건(associations/association_admins/referees/referee_certificates/referee_assignments/referee_settlements)만 출력.
- **대안 기각**: (A) users에 managed_association_id BigInt? 컬럼 추가 — ALTER 1건 발생, 운영 DB 공유 환경에서 위험. (B) admin_role에 "association_admin:123" 같은 복합 값 저장 — 파싱 필요, 인덱스 불가, 스키마 오염.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 샌드위치 구조 (referee 라우트 그룹 + 2 신규 테이블)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) `(referee)` 라우트 그룹 신설, 기존 `(web)`/`(admin)`/`(site)` 건드리지 않음. (2) Prisma 신규 테이블 2개(`referees`, `referee_certificates`)만 추가, 기존 테이블 0건 수정. (3) Referee 셸 레이아웃은 `(web)/layout.tsx`를 재활용하지 않고 독자 구현. (4) 한 유저 1 Referee 프로필 원칙(1:1), role_type 단일값. (5) 자격증 파일 업로드는 1차에서 file_url(외부 링크)만. (6) verified 플래그는 관리자 수동 승인(admin UI 없음), API에선 verified 수정 금지.
- **이유**: (1) 기존 layout은 거대한 "use client" 파일로 검색/알림/슬라이드메뉴 로직이 섞여 있어 referee에 과함 + 의존성 분리가 어렵다. 자체 셸이 단순하고 격리된다. (2) 신규 테이블만 추가하면 `prisma db push`가 기존 데이터 파괴 없이 CREATE TABLE만 실행 — 브랜치 격리 DB 전략(아래 항목)과 결합해 운영 안전. (3) 1:1 원칙은 role_type을 certificates로 옮겨 처리 가능하므로 모델 복잡도 감소. (4) 파일 업로드는 Vercel Blob/S3 설정이 별도 필요하므로 2차 분리.
- **대안 기각**: (A) (web)에 /referee 경로로 섞기 — 기존 layout 의존성 증가, 사이드바에 "심판 플랫폼" 추가 필요 → (web) 수정 금지 제약 위반. (B) User 모델에 referee_level/license 컬럼 직접 추가 — User 테이블 ALTER 발생 + 100+ 필드 User 더 비대해짐. (C) RefereeRole 다중 프로필 — YAGNI, 1차 스코프 밖.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 DB 전략: User 모델 0줄 수정 + 단방향 relation
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) User 모델에 `referee Referee?` back-relation을 **선언하지 않는다**. (2) Referee 쪽에서만 `user_id BigInt @unique`로 FK 보유(단방향). (3) Prisma 6는 단방향 relation에 경고를 낼 수 있으나, referee 쪽에서 `@relation`을 선언하지 않고 순수 FK 컬럼으로만 두면 Prisma는 User와의 관계를 인식하지 않음 → User 모델 파일 diff 0줄. (4) 쿼리 시 join이 필요하면 `prisma.user.findUnique({ where: { id }})` + `prisma.referee.findUnique({ where: { user_id }})`를 두 번 쿼리하거나, Referee include에서 별도 로드.
- **이유**: (1) User.id 타입이 BigInt라 Referee.user_id도 BigInt 필수 — 이 점만 맞으면 @relation 선언 없이도 FK 무결성을 DB 제약으로는 강제 가능하나 Prisma Client의 nested include가 안 됨. **대안 채택**: Referee 쪽에만 `@relation`을 선언하되 `references: [id]`로 User를 참조하면 Prisma는 User 쪽 back-relation을 요구한다. 따라서 **최종 결정**: User 모델에 `referee Referee?` 1줄만 추가(다른 필드/속성 전부 보존). `prisma db push`는 이 1줄로 **ALTER TABLE을 발생시키지 않는다** (순수 Prisma-level 관계 선언, DB 스키마 영향 0).
- **검증**: Prisma의 relation 선언은 DB 마이그레이션 SQL을 생성하지 않음. FK 제약은 Referee 모델의 `@relation` + `references`로 정의되며, `referees` 테이블 CREATE 시 `REFERENCES users(id)` 제약으로 추가됨. `users` 테이블은 미변경.
- **대안 기각**: (A) User 모델 전체 미수정(단방향) — Prisma가 검증 시 에러. (B) User에 referee 필드 + 다른 커스텀 필드 — 스코프 넘침.
- **참조횟수**: 0

### [2026-04-12] 심판 플랫폼 브랜치 격리 DB 전략
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 개발/운영 DB가 물리적으로 분리되어 있지 않으므로, subin-referee 브랜치에서 `prisma db push` 실행 시 **오직 신규 테이블 추가만 발생**해야 한다. (2) Prisma 모델 추가 후 반드시 `prisma db push --dry-run`으로 DROP/ALTER 여부를 먼저 확인하고, 순수 CREATE TABLE 2건만 나오는지 검증한 후 실제 push. (3) 기존 테이블/컬럼은 절대 수정하지 않음 (User 관계 추가조차 Prisma-level). (4) 브랜치 머지 시 main → dev → main 워크플로 따름, dev 브랜치에서 통합 검증.
- **이유**: (1) 운영 DB와 개발 DB가 같은 인스턴스를 공유한다면 테이블 변경은 즉시 운영에 반영됨 — 파괴적 변경 절대 금지. (2) CREATE TABLE은 기존 데이터에 영향이 0이므로 안전. (3) dry-run 체크는 planner가 강제 규칙으로 넣어서 developer가 실수로 DROP을 실행하지 못하게 함.
- **대안 기각**: (A) 별도 DB 신설 — 인프라 작업 범위 밖. (B) shadow database로 마이그레이션 — Prisma Migrate를 쓰려면 history 관리 필요, 현재 프로젝트는 `db push` 기반이라 history 불일치 위험.
- **참조횟수**: 0

### [2026-04-02] 맞춤 설정 강화: 실력 7단계 + 메뉴 토글 + 카테고리 분리
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 실력 구분을 4단계(초급/중급/중상/상급)에서 7단계(최하/하/중하/중/중상/상/최상)로 변경. 코드값: lowest/low/mid_low/mid/mid_high/high/highest. (2) DB 스키마 변경 불필요 -- games.skill_level은 VarChar, User.preferred_skill_levels는 Json 배열이므로 새 코드값 저장 가능. (3) 기존 4단계 코드값(beginner 등)은 SKILL_BADGE에 fallback 유지하여 하위 호환. (4) 메뉴 토글은 User.hidden_menus Json 배열로 구현 -- 숨기고 싶은 메뉴 slug 저장. (5) 맞춤 설정을 프로필 드롭다운/아코디언에서 "내 정보" 하위가 아닌 단독 카테고리로 승격. (6) 파일명/라우트(/profile/preferences)는 변경하지 않음 -- URL 변경 시 기존 북마크/딥링크 깨짐 위험.
- **이유**: (1) 4단계는 실력 분포가 너무 넓어 "중급"이 범위가 큼. 7단계로 세분화하면 더 정확한 매칭 가능. (2) VarChar/Json이라 DB 마이그레이션 없이 코드만 변경. (3) 인라인 SKILL_LABEL이 4개 파일에 중복 정의되어 있으므로 game-status.ts의 SKILL_BADGE로 통합 권장.
- **대안 기각**: (A) 파일명을 customization으로 변경 -- 기존 import 경로 대량 수정 필요, 이득 적음. (B) 실력을 숫자(1~10)로 변경 -- 직관성 부족, 라벨 매핑 필요.
- **참조횟수**: 0

### [2026-03-29] GPS 밀집도 히트맵: Canvas 오버레이 + simpleheat 방식
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 카카오맵에는 공식 히트맵 레이어가 없으므로 CustomOverlay + canvas 방식 채택. (2) simpleheat.js(3KB) 경량 라이브러리 또는 직접 canvas 2D gradient 구현. (3) 데이터는 court_sessions를 시간대별(오전/오후/저녁) groupBy하여 코트별 세션 수를 weight로 사용. (4) 별도 DB 테이블 불필요 -- 기존 court_sessions + court_infos.lat/lng로 충분. (5) ISR 10분 캐시로 서버 부하 최소화.
- **이유**: (1) 카카오맵 히트맵 미지원 확인 (네이버맵은 지원하나 카카오맵으로 이미 통일). (2) Google Maps처럼 HeatmapLayer가 없으므로 canvas 오버레이가 유일한 방법. (3) simpleheat는 3KB로 번들 영향 최소. (4) 대안으로 원형 오버레이(크기=세션수)도 가능하지만 히트맵이 시각적으로 더 직관적.
- **대안 기각**: (A) 네이버맵 전환 -- 기존 카카오맵 코드 전체 교체 비용 과다. (B) Mapbox/Leaflet 전환 -- 동일한 이유. (C) 코트별 단순 숫자 뱃지 -- 밀집도 표현력 부족.
- **참조횟수**: 0

### [2026-03-29] 코트 3x3 이벤트: 기존 tournament과 완전 분리
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) court_events + court_event_teams + court_event_players + court_event_matches 4테이블 신설. (2) 기존 Tournament 모델과 완전 분리. (3) 대진표는 4~8팀 단순 single_elimination/round_robin만 지원 (bracket-builder 재사용 가능하나 간소 버전). (4) 코트 상세 페이지에 "이 코트의 3x3 이벤트" 섹션 추가.
- **이유**: (1) Tournament은 UUID PK + series + 서브도메인 사이트 + 디비전 + 복잡한 팀 등록 워크플로를 가진 공식 대회 시스템. 3x3 이벤트는 "오늘 저녁 코트에서 4팀 미니대회" 수준의 가벼운 이벤트. (2) Tournament에 is_3x3 플래그를 추가하면 기존 tournament API/UI 전체에 분기 로직이 침투. (3) 3x3 이벤트는 court_infos에 종속(코트가 주체), tournament은 독립적(어느 코트에서든 개최 가능).
- **대안 기각**: (A) Tournament에 type 필드 추가 -- 기존 17개 파일에 분기 필요, 위험. (B) pickup_games 확장 -- 픽업게임은 개인 참가, 3x3은 팀 참가로 구조가 다름.
- **참조횟수**: 0

### [2026-03-29] 코트 앰배서더: court_ambassadors 테이블 + 위키 바이패스
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) court_ambassadors 테이블 신설 (user_id, court_info_id, status). (2) 앰배서더는 해당 코트의 court_edit_suggestions를 직접 승인 가능 (관리자 승인 바이패스). (3) 앰배서더 자신의 수정은 승인 없이 직접 반영. (4) 신청 → 관리자 승인 워크플로. (5) 앰배서더 뱃지 + 활동 시 XP 보너스.
- **이유**: (1) 672개 코트를 관리자 혼자 관리할 수 없음 -- 코트별 "동네 관리자"가 필요. (2) 위키 시스템의 승인 병목 해소 -- 앰배서더가 있는 코트는 즉시 정보 갱신 가능. (3) 앰배서더 뱃지는 커뮤니티 기여 인정 + 게이미피케이션 연계.
- **대안 기각**: (A) 누구나 직접 수정 (승인 없음) -- 악의적 수정 위험. (B) 등급 기반 자동 승인 (Lv5+) -- 레벨이 높아도 해당 코트에 대한 지식이 없을 수 있음.
- **참조횟수**: 0

### [2026-03-29] 주간 운동 리포트: DB 없이 court_sessions 실시간 집계 + Vercel Cron
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 별도 weekly_reports 테이블 불필요 -- court_sessions에서 지난주 범위로 집계. (2) /profile/weekly-report 페이지에서 클라이언트가 GET 요청 시 실시간 계산. (3) Web Push는 Vercel Cron(매주 월 09:00 KST)으로 발송하되, 1차로는 notifications 테이블 INSERT만 (앱 내 알림). (4) 진짜 Web Push는 Push API 구독 관리가 필요하므로 2차 확장으로 분리.
- **이유**: (1) 주간 데이터를 별도 저장하면 court_sessions과 이중 관리 -- 집계 쿼리가 충분히 빠름 (인덱스 있음). (2) Vercel Cron은 vercel.json에 1줄 추가로 설정 가능, 별도 인프라 불필요. (3) Web Push 구독 관리(PushSubscription 저장)는 별도 테이블이 필요하므로 1차에서는 앱 내 알림만.
- **대안 기각**: (A) weekly_reports 캐시 테이블 -- 조회 빈도가 주 1회 수준이라 캐시 효용 낮음. (B) 이메일 발송 -- 이메일 인프라(SendGrid 등) 추가 비용+설정 필요.
- **참조횟수**: 0

### [2026-03-29] 코트 유저 위키: court_edit_suggestions 1테이블 + changes JSON diff 방식
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) court_edit_suggestions 테이블 1개 신설 — 제안+이력을 한 테이블에서 관리. (2) changes 필드는 JSON으로 `{"필드명": {"old": 이전값, "new": 새값}}` 형태 — 여러 필드를 한 번에 제안 가능 + diff 표시 용이. (3) 상태 3종: pending→approved/rejected. (4) 승인 시 트랜잭션으로 court_infos 업데이트 + XP 10 지급. (5) 같은 코트에 같은 유저의 pending 제안 있으면 중복 차단. (6) court_reports(상태 제보)와 완전 분리 — reports는 물리적 문제 신고(119 신고), suggestions는 정보 보정(위키 편집).
- **이유**: (1) 필드별 테이블(court_field_edits)은 "바닥재+조명+화장실"을 동시에 제안할 때 3행이 생겨 관리 복잡. JSON이면 1행. (2) old/new 구조로 관리자가 "null→우레탄" 같은 변경을 한눈에 볼 수 있어 승인 판단 용이. (3) court_reports의 report_type은 "hoop_broken" 같은 고정 유형인 반면, edit_suggestions는 court_infos의 14개 필드 중 아무거나 수정 가능해야 해서 구조가 다름.
- **대안 기각**: (A) court_reports 테이블 재활용 — 목적이 다름(신고 vs 보정), report_type 필드가 맞지 않음, 상태 워크플로도 다름(active/resolved vs pending/approved). (B) 필드별 별도 행 — 한 번에 5개 필드 수정 시 5행 생성, 승인도 5번 해야 함, UX 나쁨. (C) 자동 승인 — 초기에는 관리자 검수가 필요, 악의적 수정 방지. 향후 신뢰 기여자 자동 승인은 확장 가능.
- **참조횟수**: 0

### [2026-03-29] 픽업게임 모집: 별도 pickup_games 테이블 신설 (기존 games와 분리)
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) pickup_games + pickup_participants 2개 테이블을 신규 생성하여 court_infos와 직접 연결. (2) 기존 games 모델(game_type=0)을 재활용하지 않음. (3) 참가 방식은 "즉시 확정"(confirmed) — games의 "신청→승인" 워크플로와 다름. (4) 상태 5종: recruiting→full→in_progress→completed→cancelled. (5) cron 없이 조회 시 자동 상태 전이 (날짜 지나면 completed). (6) courts API에 pickupCount 서브쿼리 추가하여 "픽업게임" pill 필터 구현.
- **이유**: (1) games.court_id는 courts(레거시 테이블) 참조 — court_infos와 FK 연결 불가. (2) game_applications의 status=0→1→2 승인 워크플로는 픽업게임의 "버튼 누르면 바로 참가" UX와 맞지 않음. (3) games는 팀매치/대회경기와 혼재되어 있어 코트 시스템 내에서 독립적 진화가 어려움. (4) 픽업게임은 가볍고 빈번(하루 수십 건)한 반면 games는 공식적이고 드문 이벤트 — 라이프사이클이 다름.
- **대안 기각**: (A) games 모델에 game_type=0 활용 — FK 충돌(courts vs court_infos) + 참가 워크플로 불일치. (B) games에 court_info_id 필드 추가 — 기존 games/game_applications 코드 전체 수정 필요, 리스크 대비 이익 적음.
- **참조횟수**: 0

### [2026-03-29] 코트 데이터 품질 정리: 불확실한 필드 null 초기화 + 유저 위키 시스템
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 672개 코트 중 verified=false인 658개의 is_free, surface_type, hoops_count를 null로 초기화. 스크립트 기본값("아스팔트", "마루", hoops_count=2, is_free=true/false)은 실제 확인된 정보가 아니라 추정값이므로 "모름"으로 표시하는 것이 정직함. (2) is_free 필드를 Boolean에서 Boolean?(nullable)로 변경하여 "무료/유료/알 수 없음" 3상태 표현. (3) UI에서 null인 필드는 "미확인" 회색 뱃지로 표시하여 사용자에게 정보 부재를 솔직히 알림. (4) court_edit_suggestions 테이블 신설로 유저가 위키처럼 코트 정보를 수정 제안할 수 있게 함. 관리자 승인 후 반영.
- **이유**: (1) "아스팔트 바닥, 무료"로 표시된 코트를 찾아갔더니 실내 체육관이거나 유료인 경우 사용자 신뢰 추락. 거짓 정보보다 "미확인"이 나음. (2) 실내 체육관 105개가 "무료"로 표시되어 있는데 실내 체육관은 대부분 유료 — 명백한 데이터 오류. (3) 유저 위키 방식은 플랫폼 운영자의 전수 조사 없이도 데이터 품질을 점진적으로 개선할 수 있는 확장 가능한 방법.
- **대안 기각**: (A) 전수 수동 조사 — 672개를 일일이 카카오맵에서 확인하는 것은 비현실적. (B) 불확실한 코트 삭제 — 위치+이름은 정확하므로 코트 자체를 삭제하면 커버리지 손실. (C) Boolean 유지 + 별도 confidence 필드 — 필드 수 증가, 복잡도 대비 효용 낮음.
- **데이터 출처별 신뢰 등급**: manual_curation(14개)=높음, kakao_search(131개)=위치만 높음/상세 낮음, google(527개)=위치만 높음/상세 낮음.
- **참조횟수**: 0

### [2026-03-29] 게이미피케이션 시스템: User 직접 확장 + 뱃지 별도 테이블
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) XP/레벨/스트릭 3개 필드를 User 테이블에 직접 추가. (2) 뱃지는 user_badges 별도 테이블로 분리 (1:N 관계). (3) XP 적립은 별도 API 없이 기존 체크아웃/리뷰/제보 API 내부에서 addXP() 호출. (4) 도장깨기 카운트는 court_sessions의 DISTINCT court_id로 실시간 계산 (별도 캐시 컬럼 불필요). (5) 스트릭은 한국시간(KST) 기준 날짜 비교.
- **이유**: (1) User에 4필드 추가는 별도 user_stats 테이블 대비 JOIN 없이 프로필 조회 가능 — 프로필 페이지가 useSWR로 자주 호출되므로 쿼리 단순화 중요. (2) 뱃지는 한 유저가 N개 보유 + 종류 확장 가능하므로 별도 테이블이 적합. (3) XP 적립 API를 별도로 만들면 클라이언트가 호출 안 하는 실수 가능 — 서버사이드에서 강제 호출이 안전. (4) 도장깨기는 672개 코트 중 유저당 방문 코트가 많아야 수십 개 — DISTINCT count가 충분히 빠름.
- **대안 기각**: (A) user_gamification 별도 테이블 — 4필드에 불과하여 테이블 오버헤드. (B) xp_logs 이력 테이블 — 현 단계에서 이력 추적 불필요, court_sessions/reviews/reports가 이미 이력 역할. (C) 프론트에서 XP API 호출 — 호출 누락 위험.
- **참조횟수**: 0

### [2026-03-29] 코트 리뷰 5항목 세부 별점 + 사진 업로드 방식
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 기존 court_reviews 테이블에 5개 세부 별점 필드를 nullable Int로 추가 (기존 데이터 보존). rating 필드는 5항목 평균으로 자동 계산하여 호환성 유지. (2) 사진 업로드는 서버 proxy 방식: 클라이언트 → /api/web/upload/court-photo → Supabase Storage. photos 필드는 Json 배열. (3) 중복 리뷰 방지를 @@unique([court_info_id, user_id])로 DB 레벨에서 강제. (4) 상태 제보(court_reports)는 별도 테이블 신규 생성. 리뷰와 분리하는 이유: 리뷰는 평가(별점+감상), 제보는 문제 신고(유형+긴급도) — 목적과 수명주기가 다름. 제보는 해결되면 비활성화, 리뷰는 영구 보존.
- **이유**: (1) nullable 추가는 기존 데이터에 영향 없는 가장 안전한 확장 방법. (2) 클라이언트 직접 Supabase 업로드는 NEXT_PUBLIC_ 키 노출 필요 — 보안 규칙 위반. (3) 리뷰+제보 합치면 UI가 복잡해지고 평균 별점 계산에 제보가 섞임.
- **대안 기각**: (A) 별도 court_review_ratings 테이블 — 조인 비용 + 복잡도 증가, 필드 5개면 컬럼 추가가 단순. (B) rating을 Json으로 변경 — 집계 쿼리 불가.
- **참조횟수**: 0

### [2026-03-29] 웹(PWA) 백그라운드 위치 기반 자동 체크인 -- 기술 불가 판정
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 웹 PWA에서 백그라운드 자동 체크인은 기술적으로 불가능. QR 코드 원탭 체크인을 1순위 대안으로 채택.
- **이유**: (1) Geolocation API는 Service Worker에서 접근 불가 (W3C 제안만 존재, 구현 없음). (2) 탭/앱이 백그라운드로 가면 위치 추적 즉시 중단 (특히 iOS Safari). (3) Web Geofencing API는 Editor's Draft에서 방치, 브라우저 구현 전무. (4) Web NFC는 Android Chrome만 지원 (iOS Safari 미지원). (5) BLE Beacon은 웹에서 접근 불가.
- **대안 채택 순위**: QR 코드(1순위, 크로스플랫폼 100%) > 포그라운드 근접 감지(2순위, 앱 열려있을 때) > NFC(3순위, Android만) > Flutter 앱(장기, 완전 자동)
- **참조횟수**: 0

### [2026-03-28] BDR-join-v1 대회 생성 기능 MyBDR 이식 방침
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) BDR-join-v1의 대회 생성 7가지 기능 영역(기본정보/일정장소/결제/경기장/상세정보/미디어/종별디비전)을 MyBDR의 기존 7탭 위자드에 병합. (2) 신규 추가 필드 6개: organizer, host, sponsors, game_time, game_ball, game_method — DB 마이그레이션 필요. (3) 경기장 검색을 기존 Google Places에서 유지하되, 복수 경기장 지원을 위해 places JSON 배열 필드 추가. (4) 종별/디비전 생성기(DivisionGeneratorModal)를 이식하여 성별+종별+디비전 3단계 자동 생성 지원. (5) 참가신청 시 선수명단 작성 기능은 불필요(MyBDR은 가입 유저+팀 기반). (6) 이전 대회 불러오기(복사) 기능 이식. (7) 포스터 이미지 업로드는 MyBDR의 기존 이미지 인프라 활용.
- **이유**: BDR-join-v1은 실제 대회 운영 경험에서 나온 필드 구성. 특히 game_time/game_ball/game_method는 대회 요강의 핵심 정보인데 MyBDR에 누락. 복수 경기장은 실제 대회에서 2~3개 체육관 동시 운영이 흔함.
- **대안 기각**: BDR-join-v1의 Supabase 직접 연동 방식은 부적합 — MyBDR은 Prisma+PostgreSQL이므로 API 라우트를 통해야 함.
- **참조횟수**: 0

### [2026-03-28] 토스 스타일 UI 전면 개편: TOSS 실험 브랜치 + CSS 변수 기반 전환
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) TOSS 브랜치에서 독립 실험. merge 여부는 비교 후 결정. (2) CSS 변수(@theme) 값만 교체하여 전체 색상/라운딩/그림자 일괄 전환. (3) 레이아웃을 데스크탑 사이드바에서 모바일 퍼스트 하단 네비로 전환. (4) API/데이터 패칭 절대 변경 금지, UI 렌더링만 교체. (5) 기존 BDR 컴포넌트는 보존하고, 토스 전용 컴포넌트를 src/components/toss/에 신규 생성. (6) Primary 색상: BDR Red -> 토스 블루(#3182F6). (7) 기본 테마: 다크 -> 라이트.
- **이유**: (1) 실험이므로 본 코드에 영향 주면 안 됨. (2) 기존 CSS 변수 시스템 덕분에 globals.css만 바꾸면 하위 컴포넌트 자동 반영 -- 이전 작업에서 하드코딩 색상을 전부 CSS 변수로 전환해놨기 때문에 가능. (3) 토스의 핵심 UX는 "모바일 앱 같은 느낌"이므로 하단 네비가 필수. (4) Flutter 앱 호환 API를 건드리면 안 됨. (5) 비교 평가를 위해 원본 보존.
- **대안 기각**: (A) 기존 컴포넌트를 직접 수정 -- 롤백이 어려움. (B) 별도 프로젝트로 복사 -- 유지보수 이중화. (C) CSS-in-JS 테마 전환 -- 현재 Tailwind CSS 4 기반이라 CSS 변수 방식이 자연스러움.
- **참조횟수**: 0

### [2026-03-28] 관리자 UI 전체 개편: 요약 테이블 + 상세 패널 + 상태 탭
- **분류**: decision
- **발견자**: planner-architect
- **결정**: admin 13개 페이지 중 8개(유저/토너먼트/경기/팀/코트/커뮤니티/결제/건의사항)에 3가지 패턴 적용: (1) AdminDetailPanel 공통 우측 슬라이드 패널 -- 테이블 행 클릭 시 상세 정보 표시 (유저 모달 패턴을 패널로 확장). (2) AdminStatusTabs 공통 상태 탭 -- 전체/활성/비활성 등 상태별 클라이언트 필터링. (3) 테이블 컬럼 축소 -- 핵심 3~5개만 노출, 나머지는 패널로 이동. 서버+클라이언트 분리 패턴(page.tsx 서버 데이터 패칭 + admin-{name}-content.tsx 클라이언트 UI) 적용.
- **이유**: (1) 사용자 피드백 "한눈에 안 들어옴, 정보량 과다" 반영. (2) 유저 관리의 기존 모달이 잘 작동하므로 이 패턴을 다른 페이지에 확대 적용. (3) 프론트의 FloatingFilterPanel/탭 패턴을 admin에도 도입하여 UX 일관성 확보. (4) 서버 컴포넌트 유지로 prisma 직접 쿼리 보존, API 신규 생성 불필요.
- **대안 기각**: (A) 전체 클라이언트 전환 + /api/admin/* fetch -- API 13개 신규 생성 필요, 과도한 작업량. (B) 공통 AdminTable 추상화 -- 각 테이블 컬럼/기능이 달라 추상화 비용 높음. (C) 모달 대신 별도 상세 페이지 -- 페이지 이동 시 목록 컨텍스트 유실.
- **참조횟수**: 0

### [2026-03-28] 관리자 UI 개선 전략: 공통 패턴 정의 + 점진 통일
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 관리자 9개 페이지를 전면 리디자인하지 않고, (1) 공통 AdminPageHeader 컴포넌트 1개 신규 생성, (2) 테이블 헤더 스타일 통일(bg-surface + border-b), (3) 대시보드 최근 활동 실데이터 연결, (4) 건의사항만 카드->테이블 변환+상태변경 기능 추가의 4가지 핵심 변경만 진행.
- **이유**: (1) users/logs/settings는 이미 완성도가 높아 대규모 변경 불필요. (2) 프론트처럼 2열 레이아웃/시안 기반 리디자인이 아니라, 관리자는 "데이터를 빨리 찾고 조작하는" 것이 목적이므로 심플함이 최우선. (3) 공통 컴포넌트 1개로 9개 페이지의 헤더 일관성을 확보하면 작업량 대비 효과가 큼. (4) 건의사항만 기능이 부족(상태 변경 불가)하므로 기능 추가 포함.
- **대안 기각**: (A) 전면 리디자인 -- 시안 없고 현재도 동작하므로 과투자. (B) 공통 AdminTable 컴포넌트 -- 각 테이블의 컬럼/기능이 달라 추상화 비용이 높음, 스타일만 통일하는 것이 실용적.
- **참조횟수**: 0

### [2026-03-28] 상수 공통화 전략: 로컬 하드코딩 -> lib/constants 중앙화
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 프론트/admin/API 전체 검토 후 6개 영역에서 상수 불일치 발견. (1) 대회 상태/형식 라벨: 3곳(공통/목록/상세)에서 각각 다르게 정의 -> tournament-status.ts 하나로 통일. (2) 유저 역할: admin-users-table.tsx 로컬 ROLE_MAP -> roles.ts MEMBERSHIP_LABELS 재사용. (3) 경기 유형/상태: games 로컬 _constants -> lib/constants/game-status.ts로 이동. (4) 결제/건의/요금제 상수: admin 전용이므로 현재 위치 유지 (프론트 사용 시 이동). (5) API 응답: 5개 API가 NextResponse.json 직접 사용(apiSuccess 우회) -> 점진 전환.
- **이유**: (1) 같은 상태(active)가 "진행중"/"모집중"으로 표시되는 실제 불일치 존재. (2) 공통 상수 1곳 수정으로 전체 반영 가능. (3) 카드 UI에서 약어가 필요한 경우 _SHORT variant 별도 제공. (4) admin 전용 상수는 사용 범위가 1곳이면 이동 불필요(YAGNI). (5) apiSuccess 우회 5곳은 프론트가 이미 해당 형식에 맞춤 코딩되어 즉시 수정 불필요.
- **참조횟수**: 0

### [2026-03-27] 홈 TTFB 코드 레벨 최적화: ISR 살리기 (getWebSession 분리) 선택
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 7가지 방법(SSG/Streaming/Edge/Redis/ISR분리/Accelerate/전용API) 비교 후 "ISR 살리기" 선택. page.tsx에서 getWebSession() 제거하면 cookies() 미호출 -> revalidate=60이 정상 작동 -> Vercel CDN 캐시 히트 시 50-100ms. 로그인 판단과 개인화는 클라이언트로 이동.
- **이유**: (1) 변경 파일 1-2개로 최소 수정 (2) 외부 서비스/비용 없음 (3) 4개 프리페치 중 3.5개가 로그인 무관 (4) ISR이 살면 DB가 인도여도 60초에 1번만 쿼리 (5) Redis/Accelerate는 ISR로 충분한데 과도한 추가 복잡도
- **대안 기각**: SSG(SEO불리+스켈레톤), Edge(Prisma호환성), Redis(ISR로충분), Accelerate(유료+ISR로충분)
- **참조횟수**: 0

### [2026-03-27] 홈 화면 3초 TTFB 근본 원인: DB 리전(인도) + 동적 렌더링 + cold start
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 3초의 근본 원인 3가지 규명. (1) Supabase DB가 ap-south-1(인도 뭄바이)에 위치하여 모든 Prisma 쿼리마다 150-300ms 네트워크 왕복 추가. 홈페이지 6-8개 쿼리 x 200ms = 1.2-1.8초. (2) page.tsx에 revalidate=60이 있지만 getWebSession()이 cookies()를 호출하여 Next.js가 동적 렌더링으로 전환. ISR 캐시가 작동하지 않아 매 요청마다 DB 조회. (3) Vercel 서버리스 cold start 시 Prisma connection pool 초기화 500-800ms 추가.
- **해결 우선순위**: (1) Vercel 함수 리전 도쿄 설정 (즉시, 1줄). (2) Supabase DB 리전 이전 (중기). (3) 비로그인 ISR 분리 (중기). (4) Prisma 글로벌 캐시 (즉시, 1줄).
- **참조횟수**: 0

### [2026-03-27] 성능 병목 2차 심층 분석: Places API 폭포수 + 대회 중복 쿼리
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 이전 최적화(SWR/캐시/폰트/프리페치) 이후에도 느린 원인을 6개 도출. 해결 우선순위: (1) Google Places API 카드별 개별 호출을 batch API로 전환 (2) 대회 상세의 6개 중복 Prisma 쿼리를 탭별 lazy loading으로 전환 (3) listGames() select 누락 수정 (4) prefetchCommunity() content 전체 로드 최적화
- **이유**: (1) 경기 목록 60개 표시 시 place-photo API 60번 동시 호출 = 브라우저 동시 연결 제한(6개)에 걸려 이미지 로딩이 직렬화됨. (2) 대회 상세에서 tournamentMatch 2번, tournamentTeam 3번 중복 조회 + 사용자가 보지 않는 탭 데이터까지 전부 로드. (3) games 40컬럼 전체 반환 vs 필요한 10컬럼. (4) content(수천자) 30건 로드 후 120자만 사용.
- **참조횟수**: 0

### [2026-03-26] 외부 BDR 랭킹: 서버사이드 xlsx proxy + 3탭 구조
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 서버사이드 API proxy 방식으로 GitHub xlsx를 fetch+파싱. (2) 클라이언트에서 xlsx 직접 파싱하지 않음. (3) 기존 /api/web/rankings API는 수정 없이 별도 /api/web/rankings/bdr 경로로 분리. (4) 탭 3개(BDR 랭킹/플랫폼 팀/플랫폼 개인)로 확장. (5) BDR 랭킹 내에 일반부/대학부 서브탭 + 지역 클라이언트 필터.
- **이유**: (1)(2) XLSX.js가 200KB+라서 브라우저에 보내면 무거움. 서버에서 파싱하고 JSON으로 변환하면 클라이언트는 가벼운 데이터만 받음. (3) 기존 API 안정성 유지 -- 외부 데이터 장애가 내부 랭킹에 영향 주면 안 됨. (4) BDR 공식 랭킹과 플랫폼 자체 랭킹은 성격이 다르므로 탭 분리. (5) 지역 필터는 데이터 양이 적어(50~100팀) 클라이언트 사이드로 충분.
- **대안**: (A) 클라이언트에서 직접 xlsx fetch+파싱 -- 무거움 (B) 외부 데이터를 DB에 주기적 동기화 -- 과설계 (데이터가 수동 업데이트되는 엑셀이므로)
- **참조횟수**: 0

### [2026-03-25] 필터 UI를 플로팅 패널 공통 컴포넌트로 통합
- **분류**: decision
- **발견자**: planner-architect
- **내용**: 4개 페이지(games/teams/tournaments/community)의 필터가 각각 다른 방식(인라인 select, 탭 버튼, 커스텀 드롭다운, pill 탭)으로 구현되어 있어 일관성 없음. 공통 FloatingFilterPanel 컴포넌트를 만들어 페이지별 config 객체로 필터 항목을 전달하는 방식으로 통합. 선택 이유: (1) 화면 공간 절약 -- 필터가 항상 보이지 않고 필요할 때만 열림 (2) 일관된 UX -- 모든 페이지에서 동일한 패턴 (3) 모바일 친화 -- 좁은 화면에서 인라인 필터 4개가 2줄로 깨지는 문제 해결. 아이콘은 "tune" (filter_list보다 조절/설정 느낌이 강함). 패널은 모바일 하단시트 + 데스크탑 우측 슬라이드. 기존 필터 로직(URL params, state, API 호출)은 100% 유지하고 UI만 교체.
- **참조횟수**: 0

### [2026-03-25] 홈 프리페치: SWR fallbackData 방식 선택 (3안 비교)
- **분류**: decision
- **발견자**: planner-architect
- **내용**: 홈페이지 서버 프리페치 3가지 방법 비교 후 방법 A(SWR fallbackData) 선택. (A) page.tsx에서 Prisma 직접 조회 -> 각 컴포넌트에 fallbackData prop -> SWR이 초기값으로 사용 + 백그라운드 revalidate. (B) Props 직접 전달(SWR 제거) -> 리밸리데이션 상실, 전면 재작성 필요. (C) RSC+Suspense -> layout.tsx가 "use client"라서 사실상 불가능, 레이아웃 리팩토링 필수. 선택 이유: 기존 코드 변경 최소, SWR 기능 100% 유지, 단계적 적용 가능, 롤백 1분. 주의: snake_case 변환 필요(apiSuccess와 동일 형식), YouTube/profile-stats는 프리페치 제외(외부 API/복잡도).
- **참조횟수**: 0

### [2026-03-25] 성능 근본 원인: 폰트 렌더링 차단 + YouTube 서버리스 캐시 미스 + 클라이언트 waterfall
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 코드 레벨 심층 분석 결과, 이전 SWR/캐시 개선으로도 체감 속도가 나아지지 않은 이유가 3가지: (1) layout.tsx `<head>`에서 외부 폰트 CSS 3종(Pretendard, Material Symbols, Quicksand)을 동기 로딩하여 브라우저 렌더링 자체를 차단. (2) YouTube recommend API가 Vercel 서버리스에서 인메모리 캐시를 쓰므로 인스턴스 cold start 시 YouTube API 6번 호출(3~5초). (3) 홈페이지가 서버에서 데이터를 안 가져오고 모두 클라이언트 SWR에 위임하여, HTML 도착 후 다시 API 5~7개 waterfall 발생. 추가로 recommended-games API에 Cache-Control 누락, getPlayerStats 3단계 순차 쿼리 발견.
- **이유**: SWR 중복 제거와 캐시 헤더는 "같은 데이터를 덜 가져오는" 최적화였지만, 근본 문제는 "데이터를 가져오기도 전에 화면이 멈추는 것(폰트 차단)"과 "서버가 할 수 있는 일을 클라이언트에 떠넘기는 구조"였다.
- **참조횟수**: 0

### [2026-03-25] 성능 개선: 레이아웃 구조 변경 없이 SWR+캐시로 최적화
- **분류**: decision
- **발견자**: planner-architect
- **결정**: layout.tsx의 "use client" 구조는 유지하고 그 안에서 가능한 개선만 진행. 6영역 9개 항목: (A) SWR 글로벌 설정 + 홈 6개 컴포넌트 useSWR 전환 -> /api/web/teams, youtube/recommend 중복 호출 자동 제거. (B) 알림 폴링을 pathname 의존에서 30초 setInterval로 변경. (C) 미사용 패키지 3개(lucide-react, @sentry/nextjs, next-auth) + 미사용 파일 3개(1,075줄) 제거. (D) API 3개에 Cache-Control 헤더 추가 (recommended-games, teams, stats). (E) YouTube 인메모리 캐시를 Upstash Redis로 전환. (F) 랭킹/승률 Prisma 쿼리 병렬화.
- **이유**: 레이아웃 서버 컴포넌트 전환(아일랜드 패턴)은 60+개 하위 페이지에 영향, 대규모 리팩토링이라 위험도가 높다. 현재 구조 내에서 SWR 중복 제거만으로 홈 API 호출을 8~9건에서 6건으로 줄일 수 있고, 캐시 헤더 추가로 서버 부하를 줄일 수 있다.
- **참조횟수**: 1

### [2026-03-25] 팔로우 시스템: follows 전용 테이블 + Server Action + 공통 FollowButton
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) follows 전용 테이블 (follower_id + following_id + @@unique). (2) Server Action (actions/follow.ts 신규 파일). (3) 카운터 캐시 없음 (followers_count 필드 추가 안 함). (4) FollowButton 공통 컴포넌트를 src/components/에 배치하여 커뮤니티 사이드바 + 타인 프로필 두 곳에서 재사용. (5) 낙관적 업데이트 (LikeButton 패턴 동일).
- **이유**: (1) 좋아요와 동일한 단순 구조 우선. (2) 기존 community.ts의 toggleLikeAction과 패턴 통일하되, 팔로우는 커뮤니티 전용이 아니므로 별도 파일. (3) 현재 팔로워 수를 표시하는 UI가 없어 카운터 캐시는 YAGNI. (4) 두 곳에서 사용하므로 페이지 내 _components가 아닌 공통 위치. (5) 즉각 반응 UX.
- **참조횟수**: 0

### [2026-03-25] 좋아요 시스템: 전용 테이블 + Server Action + 낙관적 업데이트
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) community_post_likes 전용 테이블 (polymorphic 아님). (2) API route 아닌 Server Action 방식 (기존 댓글과 동일 패턴). (3) likes_count 카운터 캐시 필드 추가 (매번 count 쿼리 방지). (4) LikeButton 클라이언트 컴포넌트에서 낙관적 업데이트.
- **이유**: (1) 현재 좋아요가 필요한 곳이 community_posts뿐이라 polymorphic은 과설계. 나중에 필요하면 전환 가능. (2) 상세 페이지가 서버 컴포넌트이고 댓글도 Server Action이라 패턴 통일. (3) comments_count와 동일한 카운터 캐시 패턴으로 성능과 일관성 확보. (4) 좋아요는 즉각 반응이 중요한 UX.
- **참조횟수**: 0

### [2026-03-25] 랭킹 페이지: DB 변경 없이 기존 필드 활용 + groupBy 합산
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 팀 랭킹은 Team.wins로 직접 정렬 (별도 집계 테이블 없이). (2) 개인 랭킹은 TournamentTeamPlayer의 누적 스탯 필드를 groupBy+_sum으로 합산 (MatchPlayerStat aggregate 대신). (3) 페이지네이션은 클라이언트 사이드 (API 50건, 프론트 20건/페이지). (4) 디자인 시안 없으므로 팀 목록 페이지의 테이블 스타일 응용.
- **이유**: (1) Team에 이미 wins/losses 카운터 캐시가 있어 추가 쿼리 불필요. (2) TournamentTeamPlayer에 total_points 등 누적 필드가 있어 MatchPlayerStat를 매번 aggregate하는 것보다 성능 우수. (3) 50건이면 클라이언트 처리 충분, 기존 팀/대회와 패턴 통일. (4) 시안 없는 기능은 기존 UI 패턴 재활용이 가장 안전.
- **참조횟수**: 0

### [2026-03-23] 커뮤니티 리디자인: API 최소 확장 + 좋아요 미구현 + 티어 숨김
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) /api/web/community 응답에 authorProfileImage + contentPreview 2개 필드만 추가(기존 필드 변경 없음). (2) 좋아요 기능은 DB에 likes_count 필드가 없어 버튼 UI만 배치하고 동작 미구현. (3) 티어 배지(GOLD 등)는 User에 tier 필드가 없어 숨김 처리. (4) 인기글 사이드바는 별도 API 없이 기존 응답의 view_count 기준 정렬로 대체. (5) 팔로우 기능은 DB에 없어 버튼 UI만 배치(비활성). (6) 카테고리 7개 탭은 UI만 표시, 실제 DB는 기존 4개 유지.
- **이유**: (1) 시안 반영에 최소한의 데이터(아바타+미리보기)만 필요. (2)(3)(5) DB 스키마 변경은 별도 작업으로 분리하여 리스크 최소화. (4) 30건 내 정렬이라 서버 추가 쿼리 불필요. (6) 카테고리 확장은 글쓰기 페이지와 함께 진행해야 의미 있음.
- **참조횟수**: 0

### [2026-03-23] 대회 리디자인: API 유지 + 클라이언트 필터/페이지네이션 + bracket-builder 유지
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) /api/web/tournaments 응답 구조 변경 없음. (2) Region/Date/Fee 필터는 클라이언트 사이드 구현(API는 status만 지원). (3) 페이지네이션도 클라이언트 사이드(API take:60 고정, 팀 목록과 동일 패턴). (4) bracket-builder.ts 유틸리티 함수/타입 변경 없음. (5) 대회 상세의 parseDescription 로직은 유지하고 렌더러만 분리. (6) 경기장 이미지는 DB 필드 없으므로 CSS 그라디언트로 대체. (7) 대진표에 조별리그 순위표 통합(tournamentTeam groupName 기반).
- **이유**: (1)(4) 경기/팀/프로필 리디자인과 동일한 "기존 로직 유지, UI만 변경" 원칙. (2)(3) 서버 사이드 필터 추가는 API 변경이 필요하므로 별도 작업으로 분리. (5) parseDescription은 안정적으로 동작하므로 리스크 최소화. (6) 외부 이미지 URL 사용은 보안/성능 이슈. (7) 시안이 대진표 페이지 내에 조별리그를 통합 표시.
- **참조횟수**: 0

### [2026-03-23] 프로필 리디자인: SVG 직접 구현 레이더 차트 + API 유지 + prisma 확장 허용
- **분류**: decision
- **발견자**: planner-architect
- **결정**: (1) 레이더/헥사곤 차트는 recharts/chart.js 없이 SVG polygon으로 직접 구현. (2) 내 프로필 API(/api/web/profile, /api/web/profile/stats)는 변경하지 않음. (3) 타인 프로필(users/[id]/page.tsx)은 서버 컴포넌트이므로 matchPlayerStat 추가 쿼리 허용(기존 user 쿼리 유지). (4) 티어 배지(GOLD I 등)는 DB에 없으므로 총 경기수 기반 프론트 계산. (5) 데이터 없는 요소(승률/팔로워/야투성공률)는 숨기거나 placeholder 처리.
- **이유**: (1) 정적 도형이라 라이브러리 불필요, 번들 크기 절약. (2) 경기/팀 리디자인과 동일한 "API 유지, UI만 변경" 원칙. (3) 타인 프로필은 서버 컴포넌트라 prisma 직접 쿼리가 자연스러움. (4)(5) 시안 100% 재현보다 있는 데이터로 깔끔하게 보여주는 것이 현실적.
- **참조횟수**: 0

### [2026-03-22] 경기 페이지 리디자인: API 로직 유지, UI만 변경
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 경기 3종 페이지 리디자인 시 데이터 호출 로직(fetch URL, Server Action, 서비스 함수)은 일절 변경하지 않고 UI 렌더링 부분만 교체한다.
- **이유**: (1) API가 Flutter 앱과 100% 호환되어야 하므로 건드리면 위험. (2) 현재 데이터 흐름이 안정적으로 동작 중. (3) 리디자인 범위를 UI로 한정해야 작업 시간과 리스크를 줄일 수 있음.
- **대안**: 경기 이미지(image_url) 등 신규 필드가 필요한 경우 DB에 없으면 placeholder로 대체, API 변경은 별도 작업으로 분리.
- **참조횟수**: 0

### [2026-03-22] 경기 생성 위자드: fixed 오버레이 -> 일반 페이지 내 배치
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 현재 경기 생성 위자드가 `fixed inset-0 z-[100]`으로 전체 화면을 덮는 오버레이인데, 디자인 시안에서는 일반 페이지 내 2열 레이아웃(폼+Summary)으로 변경.
- **이유**: (1) 시안이 사이드바가 보이는 일반 페이지 내 배치를 보여줌. (2) 오버레이 방식은 모바일에서는 좋지만 데스크탑에서 사이드바 네비게이션이 가려져 UX가 단절됨.
- **주의**: 모바일에서는 여전히 전체화면처럼 보이도록 반응형 처리 필요 (xl: 이상에서만 2열).
- **참조횟수**: 0

### [2026-03-23] lucide-react → Material Symbols Outlined 전체 교체
- **분류**: decision
- **발견자**: pm
- **결정**: 레이아웃만 교체(B안)가 아닌, 프로젝트 전체에서 lucide-react를 제거하고 Material Symbols Outlined로 통일(A안).
- **이유**: (1) 디자인 시안이 Material Symbols 기준으로 작성됨. (2) 두 라이브러리 혼용은 번들 크기 증가+일관성 저하. (3) 사용자가 A안 선택.
- **영향**: 19파일, ~50개 아이콘 교체. lucide-react 의존성 제거 가능.
- **참조횟수**: 1

### [2026-03-23] 팀 페이지 리디자인: API 유지 + 클라이언트 사이드 페이지네이션
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 팀 목록/상세 리디자인 시 기존 API(/api/web/teams, prisma 직접 쿼리)는 변경하지 않는다. 페이지네이션은 클라이언트 사이드로 처리(API가 take:60 고정). 디비전 배지는 DB 필드 없으므로 승수 기반 임시 계산. 배경 배너는 팀 고유색 그라디언트로 대체.
- **이유**: (1) 경기 페이지 리디자인과 동일한 원칙(API 로직 유지, UI만 변경). (2) 서버 사이드 페이지네이션 추가는 API 변경이 필요하므로 별도 작업으로 분리. (3) 60팀이면 클라이언트 사이드로 충분.
- **참조횟수**: 0

### [2026-03-23] YouTube 인기 영상: Search API → playlistItems 페이지네이션
- **분류**: decision
- **발견자**: pm (디버깅 과정에서)
- **결정**: YouTube Search API(order=viewCount)가 실제 조회수와 다른 결과를 반환하여, playlistItems 3페이지(150개) + Videos API 실제 조회수 조회 + 서버 정렬 방식으로 변경.
- **이유**: (1) Search API 부정확 (10,092뷰 영상이 1,518뷰 아래 표시). (2) 쿼터 97% 절약 (200→6). (3) playlistItems+Videos는 정확한 viewCount 반환.
- **대안**: YouTube Analytics API (더 정확하지만 OAuth 필요, 구현 복잡도 높음)
- **참조**: errors.md "YouTube Search API" / lessons.md "YouTube API"
- **참조횟수**: 1
