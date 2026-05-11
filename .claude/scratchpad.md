# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

## 🚨 5/10 결승 영상 매핑 오류 fix (긴급 처리)

**증상**: /live/158 (결승, 슬로우 vs 아울스, 4쿼터 진행 중) 가 video_id `zIU3_RDRKuk` (4강 #157 영상 "아울스 vs 업템포") 잘못 재생.

**근본 원인 (audit log 기반 100% 확정)**:
- audit `auto_register_youtube_video` (PR-B `/api/web/match-stream/auto-register/[matchId]`) 가 score=120 으로 박음 (home_team 30 + away_team 30 + time 60)
- 알고리즘 결함 2건:
  1. **auto-register 1:1 매핑 가드 부재** — 다른 매치에 이미 박힌 video_id 가 후보 pool 에 남음 (cron 5분 폴링은 `usedSet` 가드 보유 / auto-register 누락)
  2. **score-match.ts haystack 단순 substring 매칭** — 영상 "아울스 vs 업템포" + 매치 "슬로우 vs 아울스" 에서 "아울스" 1팀 매칭 + description 토큰 hit 으로 30+30 부여 가능 (cron 의 v3 `extractTeamsFromTitle` swap-aware 알고리즘 미적용)

**1단계 fix (DB UPDATE)**:
- 매치 158 `youtube_video_id` zIU3_RDRKuk → NULL / `youtube_status` auto_pending → NULL / `youtube_verified_at` NULL
- admin_logs `manual_clear_youtube_video` (severity=warning) 박제
- 사후 검증: SELECT count=1 NULL 확인 ✅

**2단계 fix (재발 방지 — code change)**:
- `src/app/api/web/match-stream/auto-register/[matchId]/route.ts` 에 cron `usedSet` 가드 백포트 (Step 9-1): `youtube_video_id IS NOT NULL` SELECT → Set → `availableVideos` 필터링 → top 1건 후보 pool 에서 제외
- 동일 video_id 가 다른 매치에 박혀 있으면 자동 제외 → 158 NULL 해제 후 재매핑 차단

**남은 위험 (후속 PR 권고)**:
- `score-match.ts` 의 home/away swap 인식 부재 — cron v3 `extractTeamsFromTitle` 알고리즘 백포트 권장
- 1팀 부분 매칭만으로 30+30 부여 케이스 — `home_team + away_team = 60` 만으로는 80 미달이지만 `time=60` 만 추가되면 통과 (다른 시간대 운영자 영상이 동시에 publish 시 위험)

**3단계 fix (5/10 후속 — score-match swap-aware 백포트 / 본 turn 완료)**:
- `src/lib/youtube/score-match.ts` 에 `extractTeamsFromTitle` + `normalizeTeamName` 헬퍼 export 추가 (cron v3 동일)
- `scoreMatch()` home/away 점수 부여 로직 = 단순 substring 매칭 → swap-aware 정확/swap 일치만 30+30 부여 (반쪽 매칭 0점)
- cron route 가 score-match.ts 헬퍼 import — 단일 source 통합 (cron 점수 체계 v3 25+25+20+20+10 별도 유지 / 팀명 토큰 추출만 공용)
- 회귀 방지 vitest 14건 추가 (`src/__tests__/youtube/score-match.test.ts`) — 5/10 사고 시나리오 직접 재현 차단
- 검증: tsc 0 에러 / vitest 217/217 PASS (minutes-engine 21/21 회귀 0)

**main 머지 권한**: 본 fix 는 dev → main 머지 필요 (수빈/원영). 사용자 결재 대기.

---

**[5/9 D-day 종료 — 알기자 시스템 4 fix + 운영 5건 처리]**

main 최종 = `86c6d93` (PR #304). subin = dev = main 동기화. 미푸시 0.

### D-day 운영 처리 (DB 작업)
- ✅ 박찬웅 MZ #7 긴급 등록 (userId=3000 / ttpId=2847) — 충돌 없음 검증 (라이징이글스 = SEASON2 별 대회)
- ✅ 이현승 (블랙라벨 #27) 선출 처리
- ✅ MZ 3인 (이용기 #5 / 박찬웅 #7 / 곽용성 #41) 선출 일괄 처리
- ✅ #20 슬로우 vs MI = MI 기권 처리 (FIBA 5x5 Art.21 forfeit 20-0) + notes "부상 등 인원부족" + 진출 (블랙라벨 vs 슬로우 8강 자동 채워짐)
- ✅ 5/9 알기자 수동 발행 5건 (post#1380~1385) — Flutter sync path trigger fix 운영 반영 전 종료 매치 보강

### 알기자 시스템 fix 4 PR (오늘 핵심)
| PR | 머지 | fix |
|----|------|------|
| #286 (1e2272d) | dev→main | community draft 노출 차단 (prefetchCommunity + getPost status published) |
| #297→#299 (adb0308) | dev→main | **Flutter sync path trigger 추가 — 자동 발행 미작동 근본 원인** (sync/batch-sync 가 updateMatchStatus 헬퍼 우회 발견) |
| #302 (eff595e) | dev→main 통합 | forfeit 매치 = auto-publish notes 감지 LLM 우회 + 사전 정의 카피 / 라이브 [Headline]/Stats 점수차·압승 라벨 → "기권승 (FIBA Art.21)" |
| #303→#304 (86c6d93) | dev→main 통합 | dual_tournament LLM 인지 — brief route 가 tournament.format + roundContext + advancement 자동 LLM 입력 / prompts 양쪽 (Phase 1 + 2) "1위/우승" 추측 차단 가이드 |

### 발견된 회귀 패턴 (knowledge 박제 완료)
- Flutter 기록앱이 `/api/v1/matches/[id]/status` 가 아닌 `sync` / `batch-sync` 라우트 사용 → updateMatchStatus 헬퍼 우회 → 5/4 PR 부터 누적 자동 발행 0건. 진단 = audit 테이블 status 변경 audit 0건 + news_publish_attempts 0건 패턴.

---

## 🎯 다음 세션 진입점 (5/10 결승전 D-day)

### 🚀 1순위 — 5/10 4강 + 결승 진행
- 4강 #25 (12:00) / 4강 #26 (13:00) / 결승 #27 (14:30 KST)
- **Flutter sync path trigger 적용 = 자동 발행 첫 운영 검증** (5/9 fix 후 첫 매치 종료 시점)
- forfeit + dual 가이드 활성 = 결승 매치는 토너먼트 단계라 "결승전 = 우승" 정확 표기 자동 적용

### 🟡 보류
- Flutter PR6 (`Dev/lineup-pr6-flutter-prompt-2026-05-10.md` §2 — 사용자 별도 세션)
- 기존 draft 알기자 검수 publish 결정 (post#1380~1385 / admin 결정 — 1위 수성 류 교체 필요 시 admin/news 의 "재생성" 액션)
- PortOne 본인인증 운영 활성화 (`NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 추가)
- PlayerMatchCard 글로벌 재사용 확장
- Phase 3 cron (UserSeasonStat / Splits / ShotZoneStat)

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 알기자 자동 발행 (waitUntil + sync trigger + draft 차단 + forfeit + dual) | ✅ main 배포 |
| 라이브 페이지 forfeit 매치 표시 (Headline/Stats 분기) | ✅ main 배포 |
| YouTube 자동 매칭 cron 5분 | ✅ main 배포 |
| 사전 라인업 PR1~5 (web) | ✅ main / PR6 (Flutter) ⏳ 사용자 |
| PlayerLink/TeamLink 1~3-A + 후속 4 단계 | ✅ main 배포 |
| 모바일 박스스코어 PDF | ✅ main 배포 |
| 본 대회 (제21회 몰텐배) D-day 운영 | ✅ 5/9 8강·4강 일부 종료 / 5/10 4강·결승 예정 |

---

## 기획설계 (planner-architect) — 웹 종이 기록지 (FIBA 5x5)

### 🟢 사용자 결재 완료 (2026-05-11)
| # | 결재 | 결과 |
|---|------|------|
| 1 | Phase | **Phase 1+2 MVP** (3 PR / 1.5~2주) |
| 2 | UX | **PC 우선 + 모바일 가드** |
| 3 | 충돌 룰 | **매치별 mode 게이팅** (`settings.recording_mode = "flutter" \| "paper"` / Flutter API server-side 차단 / Flutter v1 코드 0 변경) |
| 4 | 작전 타임아웃·팀파울 | **settings JSON 박제** (schema 변경 0) |
| 5 | 인쇄 PDF | **Phase 6 후순위 보류** |

→ **다음 액션**: developer Phase 1 위임 (mode 게이팅 + 폼 골격 + 헤더 + 양 팀 명단(라인업 자동) + 쿼터점수 + 종료).

---

🎯 목표: 미교육 기록원이 종이 FIBA 기록지로 적은 결과를 **웹 폼**으로 박제 → Flutter 기록앱과 동일 결과(라이브/박스스코어/통산/알기자) 산출. **Flutter API 미변경 + 기존 자산 최대 재사용**.

### 배경 / 원칙
- Flutter 기록앱(`/api/v1/...`) = primary, 종이 기록지 = fallback. 별 시스템 X.
- **기존 sync API 재사용 우선** (`POST /api/v1/tournaments/[id]/matches/sync`) — 단일 매치 1회 호출로 score + status + player_stats + (선택)play_by_plays 일괄 박제. 라이브/박스스코어/알기자/통산 자동 trigger.
- 신규 페이지 = 입력 폼 (단순 UI). API 신규 = 최소 (BFF wrapper 1개) — Flutter v1 불변.
- AppNav 9 메인 탭 영향 0. 운영자 메뉴 / admin 영역에 배치.

### Phase 분해 (점진 6 Phase)
| Phase | 범위 | 산출물 | PR 수 | 우선순위 |
|-------|------|--------|------|---------|
| Phase 1 | 입력 폼 MVP — 헤더 + 양 팀 명단(라인업 자동) + 4쿼터 합산 점수만 + 매치종료 | `(web)/score-sheet/[matchId]/page.tsx` + `_components/*` + BFF `/api/web/score-sheet/[matchId]/submit` | 2 | ⭐⭐⭐ |
| Phase 2 | 선수별 스탯 입력 표 (FIBA 양식) — points/3P/FT/리바운드/A/S/B/TO/PF | 폼 확장 + zod schema | 1 | ⭐⭐⭐ |
| Phase 3 | 개인 파울 P1~P5 + T/U/D + 5반칙 자동 표시 + 팀파울 쿼터별 4건 박스 | 컴포넌트 분리 + validation rule | 1 | ⭐⭐ |
| Phase 4 | 작전 타임아웃 (전반2/후반3/연장1) + 검증 룰 (점수 합산 자동 검증) | TimeoutTracker + 사전 보정 alert | 1 | ⭐⭐ |
| Phase 5 | (선택) 런닝 스코어 시계열 — 1점/2점/3점 시간순 누적 | RunningScoreGrid (PBP 변환 옵션) | 1 | ⭐ |
| Phase 6 | (선택) 인쇄용 PDF 출력 — FIBA 양식 1장 | jsPDF 정적 양식 + 모바일 박스스코어 PDF 패턴 재사용 | 1 | ⭐ |

→ Phase 1+2 = 최소 운영 가능 (3 PR / 약 1.5~2주). Phase 3~6 = 부가 가치.

### URL / 페이지 구조
- **위치**: `src/app/(web)/score-sheet/[matchId]/` (운영자 전용 / 비공개)
  - `page.tsx` — 서버 컴포넌트, requireRecorder 동등 가드 (web 세션 + tournament_recorders OR organizer OR super_admin)
  - `_components/score-sheet-form.tsx` — 클라이언트 폼 본체
  - `_components/score-sheet-header.tsx` — 대회명/매치/심판/기록원
  - `_components/team-roster.tsx` — 좌/우 12명 표 (사전 라인업 자동 반영)
  - `_components/team-stats-grid.tsx` — Phase 2 선수별 스탯 표
  - `_components/foul-tracker.tsx` — Phase 3 개인 파울 + 팀 파울
  - `_components/timeout-tracker.tsx` — Phase 4
  - `_components/running-score-grid.tsx` — Phase 5 (선택)
  - `_components/submit-bar.tsx` — 저장/제출 + 검증 alert
- **연결 (AppNav 영향 0)**:
  - 운영자 메뉴 (더보기 5그룹 → "관리·도움" 그룹) 의 admin 영역
  - admin 토너먼트 매치 상세 페이지에 "📝 종이 기록지로 입력" 버튼 추가
- **인쇄 (Phase 6)**: `score-sheet/[matchId]/print/page.tsx` — A4 1장 FIBA 양식 (jsPDF + html2canvas, 박스스코어 PDF 패턴 재사용)

### 데이터 모델 매핑 (신규 테이블 0 / 기존 활용)
| FIBA 기록지 요소 | mybdr DB 모델 | 소스 | 비고 |
|----------------|--------------|-----|-----|
| 헤더 (대회/매치/심판/기록원) | `Tournament` + `TournamentMatch` | SELECT only | 심판/기록원 = `tournament_recorders` + 별도 표시 텍스트 (서명용) |
| 양 팀 명단 (12명) | `TournamentTeamPlayer` | 사전 라인업 PR1~5 활용 | `MatchLineupConfirmed.starters[5]` + `substitutes[7]` 자동 채움 |
| 캡틴 / 주전(스타터) | `tournamentTeamPlayer.isStarter` + `MatchLineupConfirmed.starters` | 사전 라인업 우선 / 폴백 = TTP.isStarter |
| 최종 점수 + 쿼터별 점수 | `TournamentMatch.homeScore/awayScore/quarterScores` | sync API 본체 | quarterScores JSON {home:{q1..q4,ot[]},away:{...}} |
| 선수별 boxscore 22필드 | `MatchPlayerStat` (이미 모든 필드 보유) | sync API `player_stats[]` | FG/3P/FT made-attempted, OREB/DREB/AST/STL/BLK/TO/PF/TF/UF |
| 5반칙 / 퇴장 | `MatchPlayerStat.fouled_out / ejected` | sync API | 자동 표시 = personal_fouls ≥ 5 |
| 팀 파울 (쿼터별) | `MatchPlayerStat.personal_fouls` 집계 OR `play_by_plays` 이벤트 | Phase 3 = 합산만 / Phase 5 = 시계열 | 별도 컬럼 신규 X — 집계로 처리 |
| 작전 타임아웃 | (현재 DB 컬럼 없음) | settings JSON 추가 OR play_by_plays event_type="timeout" | Phase 4 결정 사항 |
| 런닝 스코어 | `play_by_plays` (Flutter 와 동일 시계열) | Phase 5 sync API `play_by_plays[]` | 단순 입력 = PBP 미사용 / 시계열 = PBP 변환 |
| 매치 종료 trigger | `TournamentMatch.status="completed"` | sync API 자동 | `waitUntil(triggerMatchBriefPublish)` 자동 발화 (sync route 의 5/9 fix) |

### UI 컴포넌트 트리 (개략)
```
ScoreSheetPage (server / 가드)
└── ScoreSheetForm (client)
    ├── ScoreSheetHeader   ─ 대회명·매치코드·일시·코트·심판3·기록원
    ├── TeamRoster (×2)    ─ 좌/우 12명, 캡틴 ★, 주전 체크, 등번호/실명
    ├── QuarterScoreInput  ─ 1q/2q/3q/4q (+OT) × 2팀 = 단순 점수 입력 + 자동 합산
    ├── TeamStatsGrid (×2) ─ Phase 2: 12명 × 22 stat 표 (탭/엔터 keyboard navigation)
    ├── FoulTracker        ─ Phase 3: 개인 P1~P5+T/U/D + 팀파울 쿼터별 boxes
    ├── TimeoutTracker     ─ Phase 4: 전2/후3/연1
    ├── RunningScoreGrid   ─ Phase 5: 시계열 1/2/3점 입력
    ├── ValidationPanel    ─ 점수 합산 일치 / 5반칙 / 팀파울 5+ FT 알림
    └── SubmitBar          ─ "임시 저장" / "최종 제출 (매치 종료)"
```

### 핵심 기술 결정 (decisions.md 박제 후보 — A~G 7건)
1. **A. sync API 재사용** (신규 테이블/엔드포인트 0) — Flutter 와 동일 결과 자동 보장 (라이브/박스스코어/통산/알기자 모두 자동). **결정**: `POST /api/v1/tournaments/[id]/matches/sync` 를 BFF `/api/web/score-sheet/[matchId]/submit` 로 wrap (web 세션 → API token 변환 → server-to-server fetch). Flutter 코드 영향 0 / 원영 사전 공지 0.
2. **B. 권한 가드 = requireRecorder 동등** — web 세션 (`getAuthUser`) + tournament_recorders OR organizer OR tournamentAdminMember OR super_admin. `lineup-confirm` 페이지와 동일 패턴 차용. 일반 사용자/관전자 차단.
3. **C. 입력 UX = (A) PC FIBA 양식 닮은 1페이지 폼 우선** — 모바일 가드 (`@media max-width:768px`) = "PC 권장" 안내 + 최소 입력 모드. 사유: 종이 기록지는 책상에서 보고 옮기는 작업 → PC 키보드 입력이 정확. 모바일 대응은 Phase 후순위.
4. **D. 저장 단위 = 배치 (최종 제출 시 1회 sync)** + 임시 저장 (localStorage / 폼 draft) — 실시간 sync 와 충돌 회피. 이유: 종이 기록 = 매치 종료 후 옮기는 케이스 가정. 실시간 입력은 Flutter 기록앱 사용.
5. **E. Flutter ↔ 웹 충돌 가드 = strict lock** — 매치 status `in_progress` 이면 웹 제출 차단 ("Flutter 기록 중") + audit 로 마지막 sync source 표시. status `completed` 후 score 수정만 web 허용 (사고 보정). 사용자 결재 필요 (B-1).
6. **F. 검증 = client + server 양면** — client (즉시 alert) + server (sync 직전 schema + 비즈니스 룰). 룰: 합산 정합 / 5반칙 자동 표시 / 팀파울 5+ FT 안내 (block X). 잘못된 데이터는 422.
7. **G. play_by_plays 옵션** — Phase 1~4 = PBP 0 (단순 boxscore + quarter score 만). Phase 5 시계열 입력 시 PBP 변환 (운영자 1회 입력 → server 가 local_id="paper-fix-{uuid}" prefix + "[종이 기록]" description). 매치 132 케이스 (Flutter 운영자 수동 보정 보호 룰) 와 동일 패턴.

### 보안 / 운영 가드
- 가드 = `requireScoreSheetAccess(matchId, userId)` 신규 헬퍼 (web 버전, requireRecorder 의 web 세션 대응판)
- audit 박제 = `tournament_match_audits.source = "web-score-sheet"` (admin/flutter/system 외 신규 분류)
- 매치 status / score 변경 시 `admin_logs` warning 박제 (forfeit fix 5단계 절차 참조)
- 결과 검증 사후 자동 = sync 응답 `post_process_status: "ok"` 확인 + 응답 표시

### 위험 / 미해결
- **R1**: Flutter sync 와 동시 진행 시 last-write-wins (Flutter sync 가 나중에 들어오면 web 입력값 덮어쓰기). 가드 D 로 회피 가능하나 운영 룰 명확화 필요.
- **R2**: 사전 라인업 미입력 매치 (PR1~5 운영 정착 전) → roster 자동 채움 0 / 12명 수동 입력 필요. 폼이 fallback UI 제공 필요.
- **R3**: 팀파울 / 작전 타임아웃 = DB 컬럼 없음 → settings JSON 또는 PBP 사용 (B-3 결재).
- **R4**: 통산 스탯 sum/sum 정합성 (5/10 fix) 영향 = MatchPlayerStat 박제 시 made/attempted 정확히 들어가야 함 (% 자동 재계산 → DB 컬럼 percent 도 server 가 동시 박제).
- **R5**: 종이 기록지 원본 보관 — 입력 후 종이 폐기 X (감독/심판 서명본). 정책 명시 필요.

### 다음 단계 (developer 위임 전 사용자 결재 사항 — 5건)
1. **결재 1 (Phase 우선순위)**: Phase 1+2 (3 PR) 만으로 충분한가? Phase 3~6 추후 우선순위는?
2. **결재 2 (UX 디바이스)**: PC 우선 + 모바일 가드 vs 모바일·태블릿도 동시 (개발 비용 ↑)?
3. **결재 3 (충돌 룰)**: in_progress 매치 web 제출 차단(strict) vs 경고만(warn) vs 항상 web 우선(force-overwrite)?
4. **결재 4 (작전 타임아웃 저장 방식)**: settings JSON 추가 vs PBP event_type="timeout" 활용 vs Phase 4 박제 보류?
5. **결재 5 (인쇄 PDF)**: Phase 6 필요? (감독·심판 서명 종이 양식)

### 예상 일정 (Phase 1+2 MVP)
- Phase 1 = 폼 골격 + BFF + sync wrap + 가드: 3~4일 (1 PR)
- Phase 1 보강 (모바일 가드 / 검증 alert / 라인업 폴백): 1~2일 (1 PR)
- Phase 2 = 선수별 stat 표 + zod schema + keyboard nav: 2~3일 (1 PR)
- 총 ~ 1.5~2주 (PR 3건)

---

### 구현 기록 (developer) — Phase 1-A 매치별 recording_mode 게이팅

📝 구현 범위: 매치별 mode 게이팅 인프라 (Flutter API server-side 차단 + admin 토글 + audit). schema 변경 0. 기존 운영 매치 100% (settings null / `{}`) 무영향.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/tournaments/recording-mode.ts` | 신규 헬퍼 3종: `getRecordingMode(match)` / `assertRecordingMode(match, expected, ctx)` 403 가드 / `withRecordingMode(settings, mode)` settings 보존 갱신 | 신규 (~140줄) |
| `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` | match 조회 직후 `assertRecordingMode(existing, "flutter", ...)` 1줄 추가 + import. 기존 로직 0 변경 | 수정 (+8줄) |
| `src/app/api/v1/tournaments/[id]/matches/batch-sync/route.ts` | per-match try 안에서 `getRecordingMode` 검사 + `throw "RECORDING_MODE_PAPER"` → safeReason 화이트리스트 분기. errors[] 매치별 reason 반환 | 수정 (+15줄) |
| `src/app/api/v1/matches/[id]/status/route.ts` | `getMatchScore` (settings 미포함) 후 별도 SELECT 1회 (id+settings 2컬럼) → 가드 | 수정 (+15줄) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/matches/page.tsx` | ScoreModal에 mode select 토글 + recordingMode state + save() 모드 변경 분기 (confirm + 별도 endpoint 호출 + 사유 prompt) + Match 타입에 settings 필드 + `readRecordingMode` 헬퍼 | 수정 (+60줄) |
| `src/app/api/web/admin/matches/[id]/recording-mode/route.ts` | 신규 POST endpoint — zod 검증 + `canManageMatchStream` 권한 가드 + 트랜잭션 (settings UPDATE + tournament_match_audits source="mode_switch") + adminLog warning | 신규 (~160줄) |
| `src/__tests__/lib/recording-mode.test.ts` | 14 케이스 (getRecordingMode 8 / assertRecordingMode 3 / withRecordingMode 3) — 위임 7 케이스 + 보너스 7 (배열/string/다른키만 / Phase 1-B 시나리오 등) | 신규 |

#### 검증
- `npx tsc --noEmit`: **0 에러 ✅**
- `npx vitest run`: **231/231 PASS ✅** (기존 217 + 신규 14)
- DB schema 변경: **0 ✅** (settings JSON 컬럼 이미 존재 — schema.prisma:659)
- Flutter v1 로직 변경: **0 ✅** (가드 1줄 추가만 — 기존 sync/batch-sync/status 모든 로직 그대로 보존)
- 운영 영향 (기존 매치): **0 ✅** (settings null/`{}` → fallback "flutter" 자동 보장)

💡 tester 참고:
- **테스트 방법** (수동):
  1. admin/tournament-admin/tournaments/{id}/matches 진입 → 매치 클릭 → 모달에 "기록 모드" select 노출 확인 (Flutter/종이 2개 옵션)
  2. 종이 모드로 전환 → confirm + 사유 prompt → 저장 → curl 로 Flutter sync API 호출 → 403 RECORDING_MODE_PAPER 응답 확인
  3. tournament_match_audits + admin_logs 박제 확인 (source="mode_switch" / severity="warning")
  4. 다시 flutter 로 복원 → Flutter sync 정상 통과 확인
- **정상 동작**: 기존 매치 (5/10 결승 등 운영 데이터 100%) 는 mode 미지정 → fallback flutter → Flutter sync 영향 0
- **주의할 입력**:
  - paper 매치로 batch-sync 호출 시 errors[]에 매치별 reason "이 매치는 종이 기록지 모드로 진행 중입니다." 반환 (다른 매치 sync 는 정상 통과)
  - settings 가 비객체 (string/array/primitive) 인 매치 → fallback flutter (안전 가드)
  - 동일 모드로 다시 토글 시 (idempotent) → audit/admin_logs 박제 skip + `changed: false` 응답

⚠️ reviewer 참고:
- **원영 사전 공지 권장 항목**: Flutter v1 sync / batch-sync / status 라우트 server-side gate 추가 — Flutter 측 클라이언트 코드 0 변경. Flutter 측 토스트 처리 협의 필요 (RECORDING_MODE_PAPER 403 응답 처리 UX). 본 turn 코드 자체는 Flutter 미변경.
- **권한 가드 = `canManageMatchStream` 차용**: super_admin / organizer / tournamentAdminMember(is_active). recorder 제외 — youtube-stream Q7 결재 패턴 동일 (점수 입력 권한 ≠ 매치 운영 메타 변경 권한).
- **route 위치**: 위임은 `/api/v1/matches/[id]/sync` `/api/v1/matches/[id]/batch-sync` 였으나 실제 sync/batch-sync 는 `/api/v1/tournaments/[id]/matches/...` 경로. decisions.md [2026-05-11] §1 의 "sync API 재사용" 결정과 일치하는 경로로 가드 추가. status 만 `/api/v1/matches/[id]/status` 로 위임 그대로.
- **admin UI 위치**: 기존 `tournament-admin/tournaments/[id]/matches` ScoreModal 안 토글 (신규 페이지 미생성 — 운영자 UX 일관성).
- **사유 prompt UX**: window.prompt 단순 사용. 향후 modal 디자인 시안 도착 시 교체 가능 (현재는 minimal).
- **batch-sync per-match throw 패턴**: 트랜잭션 안에서 throw → 외부 catch 화이트리스트 분기. 트랜잭션 자체는 정상 rollback (settings UPDATE 발생 X — paper 검사가 update 보다 앞).

#### 다음 단계 (Phase 1-B 진입 전 검토)
1. **Phase 1-B 핵심**: `/api/web/score-sheet/[matchId]/submit` BFF — 본 헬퍼 `assertRecordingMode(match, "paper", ...)` 재사용 (역방향 가드). Flutter sync API server-to-server fetch.
2. **Flutter 측 협의** (원영): RECORDING_MODE_PAPER 403 응답 시 토스트/모달 카피 결정. body.code 직접 분기 가능 (snake_case 자동 변환 OK).
3. **batch-sync 부분 실패 UX**: 현재 errors[] 매치별 reason. Flutter 가 매치 단위 retry 가능 — 변경 0 (기존 batch 패턴 그대로).

---

### 리뷰 결과 (reviewer) — Phase 1-A 매치별 recording_mode 게이팅

#### 종합 판정
**✅ 통과 (수정 권장 — Minor 2건만)**. Critical/Major 차단 없음. mode 게이팅 인프라의 핵심 의도 (Flutter v1 로직 0 변경 + 운영 매치 100% 무영향 + schema 0 변경) 모두 달성. 헬퍼 안전 가드 (배열/primitive/INVALID 모두 fallback) 완비. 테스트 14건이 fallback 매트릭스 + 양방향 assert (flutter↔paper) + settings 보존을 모두 커버.

#### 강점
- **헬퍼 안전 가드 완비** — `getRecordingMode` 가 `null` / `[]` / primitive (`"paper"` string 자체) / `{ recording_mode: "INVALID" }` 모두 fallback `"flutter"` 반환. 운영 매치 settings 가 어떤 비정상 상태여도 Flutter 호환 깨지지 않음.
- **`assertRecordingMode` 가 throw 아닌 NextResponse 반환** — 호출처가 `if (guard) return guard;` 패턴으로 일관. throw + 외부 catch 패턴 (sync 의 try/catch 와 충돌) 회피.
- **추가 SELECT 0건** (sync / batch-sync) — `findFirst` 가 전체 row 가져오므로 `settings` 컬럼 포함. N+1 위험 없음. (status 라우트만 별도 SELECT 1회 — 아래 Minor)
- **batch-sync throw 패턴 안전** — throw 가 settings UPDATE **이전** 라인이라 트랜잭션 rollback = 부분 변경 0. safeReason 화이트리스트 +1 정확.
- **권한 가드 (admin 토글)** = `canManageMatchStream` 차용 — super_admin / organizer / tournamentAdminMember(is_active) 3종. recorder 제외 (Q7 youtube-stream 패턴 일관). 내부에서 matchId → tournament 매핑 자동 검증 → **IDOR 방어 ✅**.
- **snake_case 응답 키 정확** — admin UI 가 `match.settings.recording_mode` 직접 접근 (camelCase X). errors.md 2026-04-17 "재발 5회" 함정 회피.
- **audit 박제 2건** — `tournament_match_audits` (source=`mode_switch` + 트랜잭션 안) + `admin_logs` (severity=`warning` + previousValues + changesMade). 트랜잭션 분리도 정확 (admin_logs 는 fire-and-forget 외부 — 박제 실패가 토글 응답 실패로 안 번짐).
- **테스트 14건** — getRecordingMode 8 (null/{}/명시 2/INVALID/다른 키/string/배열) + assertRecordingMode 3 (양방향) + withRecordingMode 3 (보존/null/primitive). Phase 1-B 사전 시나리오 (`flutter 매치 + expected="paper"`) 포함.
- **idempotent 토글** — `oldMode === newMode` 시 audit/admin_logs 박제 skip + `changed: false` 응답. 노이즈 회피.

#### 발견 이슈 (심각도별)

**🚨 Critical (차단)**: 없음

**⚠️ Major (수정 권장)**: 없음 (아래 1건은 Major-Minor 경계)

**💡 Minor (개선 제안)**:

1. **`AuditSource` union 미확장** (`src/lib/tournaments/match-audit.ts:24`):
   - 현재 정의: `export type AuditSource = "admin" | "flutter" | "system";`
   - schema 주석 (`prisma/schema.prisma:2166`): `"admin" | "flutter" | "system"`
   - 본 PR 이 `source: "mode_switch"` 신규 값을 audit 박제 (recording-mode/route.ts:126).
   - DB 컬럼은 `String @db.VarChar` 라 enum 차단 없음 → 정상 박제 가능 (런타임 영향 0).
   - 다만 향후 audit 통계/필터링 코드가 `AuditSource` union 으로 type narrow 시 `"mode_switch"` 누락 위험.
   - **권고** (별도 PR 가능): `AuditSource` union 에 `| "mode_switch"` 추가 + schema 주석 갱신.

2. **`getMatchScore` select 확장 권고** (`src/lib/services/match.ts:550`):
   - 현재 status/route.ts 가 `getMatchScore` 후 별도 `findUnique({ select: { id, settings } })` 1회 추가 호출.
   - select 에 `settings: true` 1줄 추가하면 DB round trip 1회 절약 가능.
   - 영향 범위 검토 필요 (다른 호출처가 `settings` 미수신 가정 시) — 본 fix 외부 영향 무시 수준 (TS 타입 자동 확장).
   - **권고**: Phase 1-B 진입 시 `getMatchScore` 호출 + 별도 settings SELECT 패턴 횟수 증가 가능 → 통합 시점 고려.

3. **사유 prompt UX** (admin UI / 본 PR 보고 항목):
   - `window.prompt` 단순 사용 — 사용자 cancel 시 reason undefined (정상 / body 에서 omit). 운영자 UX 차원에서 모달 컴포넌트 교체 권고만 표시 (decisions 명시 = minimal Phase 1-A).

4. **진행 중 (in_progress) 매치 mode 전환 차단 미적용**:
   - 현재 admin UI confirm 만 의존 (`진행 중 매치는 신중히 결정하세요`).
   - 운영 룰 = `in_progress` + paper 전환 = Flutter 사용자가 모르고 sync 시도 → 403 알림 도달까지 점수 입력 불가 시간 발생.
   - **권고** (운영 활성화 전): admin 토글 endpoint 의 `match.status === "in_progress"` 조건일 때 추가 confirm 또는 server-side 차단 (사용자 결재 필요 — Phase 1-A 범위 외 가능).

5. **확인 confirm 거부 시 UX 미세** (admin UI line 147~149):
   - `setRecordingMode(initialMode); return;` 직후 `setSaving(false)` 가 finally 에서 실행 ✅. 사용자에게 "취소됨" 알림 0 — error state 미설정. 사용자 경험상 무반응. **권고**: `setError("모드 전환이 취소되었습니다.")` 짧은 안내.

#### 보안 / 컨벤션 체크

| 항목 | 결과 |
|------|------|
| apiSuccess / apiError 사용 | ✅ |
| snake_case 응답 키 (errors.md 2026-04-17) | ✅ (settings.recording_mode 직접 접근 정확) |
| Flutter v1 로직 0 변경 | ✅ (가드 1줄 + import 만 추가) |
| JWT (Flutter) vs 웹세션 (admin) 분리 | ✅ (sync/batch-sync/status = withAuth/verifyToken / recording-mode = getWebSession) |
| 권한 가드 (canManageMatchStream / IDOR) | ✅ (matchId → tournament 자동 매핑) |
| schema 변경 0 | ✅ (settings JSON 컬럼 이미 존재) |
| audit 박제 2건 (tournament_match_audits + admin_logs) | ✅ (트랜잭션 안 + warning severity) |
| 테스트 커버리지 14건 | ✅ (fallback 매트릭스 + 양방향 assert + 보존) |
| zod 검증 (body) | ✅ (mode enum + reason 200자 trim) |
| 운영 매치 100% 무영향 | ✅ (settings null/`{}` → fallback "flutter") |

#### 운영 활성화 전 권고
1. **원영 사전 공지** (Flutter 측 카피 협의) — Flutter 앱이 sync/batch-sync/status 호출 시 `RECORDING_MODE_PAPER` 403 응답 받음. 토스트/모달 카피 (`"이 매치는 종이 기록지 모드로 진행 중입니다."`) 그대로 사용 가능. body.code = `RECORDING_MODE_PAPER` 직접 분기 권장.
2. **AuditSource union 확장** (별도 PR 가능) — `match-audit.ts:24` + schema 주석 동기화.
3. **진행 중 매치 mode 전환 정책 명시** (사용자 결재) — admin 측 server-side 추가 차단 여부.
4. **`getMatchScore` select 확장** (Phase 1-B 진입 전) — settings 컬럼 포함 시 status 라우트 round trip 1회 절약.

#### 수정 요청 (Minor만 — 차단 없음)
| 대상 파일 | 문제 | 우선순위 |
|----------|------|---------|
| `src/lib/tournaments/match-audit.ts:24` | `AuditSource` union 에 `"mode_switch"` 추가 + schema 주석 갱신 | Minor |
| `src/lib/services/match.ts:550` (getMatchScore) | select 에 `settings: true` 추가 → status 라우트 별도 SELECT 제거 가능 | Minor |
| `src/app/api/web/admin/matches/[id]/recording-mode/route.ts` | (선택) `match.status === "in_progress"` 시 추가 confirm 또는 server-side 차단 정책 — 사용자 결재 후 적용 | Minor |
| `src/app/(admin)/tournament-admin/tournaments/[id]/matches/page.tsx:147` | 사용자 confirm 거부 시 `setError("모드 전환이 취소되었습니다.")` 짧은 안내 | Minor |

---

### 테스트 결과 (tester) — Phase 1-A

#### 정적 검증
- `npx tsc --noEmit`: ✅ **0 에러** (exit 0)
- `npx vitest run`: ✅ **16 files / 231 tests passed** (217 기존 + 14 신규 `recording-mode.test.ts`). minutes-engine 21/21 / score-match 14/14 회귀 0

#### 동작 검증 (A~E)
| 항목 | 결과 | 비고 |
|------|------|------|
| A. `getRecordingMode` 5+ fallback (null/`{}`/명시 flutter·paper/INVALID/배열/string) | ✅ | vitest 8 케이스 PASS — 안전 가드 (Array.isArray + typeof object) 검증 |
| A. `assertRecordingMode` 403 + code 양방향 | ✅ | RECORDING_MODE_PAPER + RECORDING_MODE_FLUTTER body.code + status 검증. 3 케이스 PASS |
| A. `withRecordingMode` 기존 keys 보존 | ✅ | loserNextMatchId 등 기존 settings 보존 + recording_mode set. 비객체 settings 안전 가드 검증 |
| B. sync route 가드 (`findFirst` 후 line 133) | ✅ | existing 전체 row → 별도 SELECT 0. 기존 BUG-04 보정 + winnerTeamId + tournamentMatch.update 0 변경 |
| B. batch-sync 가드 (트랜잭션 내 throw + safeReason) | ✅ | line 41-43 paper 검사 → throw 후 외부 catch 화이트리스트 (line 82-83). settings UPDATE 도달 X (paper 가드가 update 앞) |
| B. status route 가드 (별도 SELECT 1회) | ✅ | getMatchScore 후 id+settings 2컬럼 SELECT 추가. 기존 RECORDER_TRANSITIONS / updateMatchStatus 0 변경 |
| C. admin 토글 API 권한 (canManageMatchStream) | ✅ | super_admin/organizer/tournamentAdminMember 통과. recorder 제외 — youtube-stream Q7 패턴 일치 |
| C. zod 검증 + 422 응답 | ✅ | mode enum + reason optional max(200). 422 VALIDATION_ERROR |
| C. settings 보존 갱신 (withRecordingMode) | ✅ | 기존 keys 보존 + recording_mode 만 set. 트랜잭션 내 settings UPDATE + audit 1쌍 보장 |
| C. audit 박제 2건 | ✅ | tournament_match_audits source="mode_switch" + admin_logs action="match_recording_mode_change" severity="warning" |
| C. 멱등 idempotent | ✅ | oldMode === newMode 시 audit/admin_logs 박제 skip + `{ changed: false }` 응답 |
| D. ScoreModal 토글 UI (Select + ⚠ 경고) | ✅ | line 332-353 모달 안 select 추가. paper 시 경고 텍스트. value/setRecordingMode 정합 |
| D. confirm + 사유 prompt UX | ✅ | mode 변경 시 confirm → 취소 시 토글 원복 (line 148). window.prompt 사유 (선택) → POST recording-mode |
| D. snake_case 함정 회피 (errors.md 2026-04-17) | ✅ | Match.settings 타입 `{ recording_mode?: ... }` (line 33) + readRecordingMode 헬퍼 직접 접근. `recording_mode` 키가 이미 snake_case이라 apiSuccess 변환 무관 |
| E. 기존 비즈니스 로직 0 변경 | ✅ | sync diff = import 1줄 + 가드 5줄. batch-sync diff = import 1줄 + 가드 5줄 + safeReason 1분기. status diff = import 1줄 + SELECT+가드 11줄. 회귀 0 |

#### DB 영향 검증 (운영 SELECT only — 사후 임시 스크립트 즉시 삭제, CLAUDE.md 가드 4번 준수)
| 항목 | 카운트 | 기대값 | 결과 |
|------|------|------|------|
| 전체 매치 | 77 | - | - |
| settings IS NULL | 0 | (NULL 도 fallback flutter 안전) | ✅ |
| recording_mode = "paper" | **0** | **0** (배포 전) | ✅ |
| recording_mode = "flutter" 명시 | 0 | (옵션) | ✅ |
| status=in_progress + paper | **0** | **0** | ✅ |

→ 운영 매치 77건 100% 가 `getRecordingMode → "flutter"` 자동 fallback (settings 값이 `{}` 또는 다른 keys 만 보유, recording_mode 키 미존재). **Flutter sync 영향 0** 확인.

#### 운영 시나리오 영향 분석
| 시나리오 | 기대 동작 | 검증 |
|---------|---------|------|
| 기존 진행 중 매치 (settings=`{}` 또는 다른 keys) Flutter sync 호출 | 정상 통과 (`getRecordingMode → "flutter"`) | ✅ 운영 77/77 fallback 안전 |
| admin이 종료 매치 mode→"paper" 전환 후 Flutter sync 호출 | 403 `RECORDING_MODE_PAPER` 차단 | ✅ sync route line 133 + body.code 응답 |
| admin이 진행 중 매치 mode→"paper" 전환 시도 | **허용** (UI confirm 만 경고 — 서버는 status 무관 전환) | ⚠️ **주의** — developer 의도 일치 (운영자 판단 위임). reviewer Minor 사항으로 사용자 결재 후 정책 결정 권장 |
| batch-sync 5건 중 1건 paper 매치 포함 | 1건만 errors[] / 나머지 4건 정상 박제 | ✅ per-match try-catch + 207 multi-status |
| 권한 없는 일반 user admin 토글 API 호출 | 401 (미로그인) / 403 (권한 없음) | ✅ session 401 + canManageMatchStream 403 |
| settings 비객체 (string/array) 우연 매치 | fallback "flutter" 안전 | ✅ Array.isArray + typeof object 가드 + vitest 보너스 |

#### 발견된 이슈 / 수정 요청
**Critical/Major**: 0건 (차단 없음)
**Minor**: reviewer 가 이미 4건 추적 — 추가 발견 없음
- 1건 보강: admin status='in_progress' 강제 차단 가드는 미적용 (developer 의도). 사용자 결재 후 정책 결정 권장

#### 결론
**✅ 통과** — Phase 1-A 매치별 recording_mode 게이팅 검증 완료. **차단 이슈 0건**. reviewer Minor 4건과 일치 (신규 발견 0).

📌 핵심:
- 정적 검증 모두 통과 (tsc 0 + vitest 231/231 PASS)
- 7 파일 동작 검증 모든 항목 ✅
- 운영 DB 매치 77건 100% fallback 안전 (settings.recording_mode 키 0건)
- snake_case 함정 회피 정상 (recording_mode 키가 이미 snake_case)
- Flutter v1 비즈니스 로직 0 변경 — 가드 라인만 추가
- 원영 사전 공지 권장 (Flutter 토스트 UX 협의 — 본 PR 코드 자체는 Flutter 미변경)

→ **dev 머지 가능** 상태.

---

### 구현 기록 (5/10 통산 스탯 3 결함 fix)

📝 구현한 기능: 통산 스탯 정합성 3 결함 일괄 fix (mpg 모달 회귀 + 승률 source 일치 + FG%/3P% NBA 표준 sum/sum)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/users/[id]/page.tsx | statAgg `_avg` → `_sum` 전환 (FG/3P/FT made/attempted) + allStatsForModal select 확장 (made/attempted + winner_team_id) + 시즌 stats sum/sum 계산 + allStatsRows 변환 (minutes /60 + won winner_team_id 기반 + raw made/attempted 전달) | 수정 |
| src/app/(web)/profile/basketball/page.tsx | 동일 패턴 카피 (statAgg + allStatsForModal + careerStats + allStatsRows) | 수정 |
| src/app/(web)/users/[id]/_v2/stats-detail-modal.tsx | AllStatsRow 타입 — `fgPct/threePct` 단순 % → `fgMade/fgAttempted/threeMade/threeAttempted/ftMade/ftAttempted` 확장 + buildRow sum/sum NBA 표준 계산 | 수정 |

💡 tester 참고:
- 테스트 방법: 정환조 (userId=3107) `/users/3107` + (본인 로그인 시) `/profile/basketball` 진입 → 통산 카드 + "더보기 →" 모달 비교
- 정상 동작: 경기 5 / 승률 100% / PPG 5.2 / MIN 13.2분 (모달 동일) / FG% 31.0% / 3P% 8.3%
- 주의할 입력: 라이브 매치 (winner_team_id=null) 보유 사용자 → 모달 won 카운트 0 처리 일관 / 시도 0 매치 보유 사용자 → 매치별 % 평균 X (sum/sum 으로 0 가중치 0)

⚠️ reviewer 참고:
- `users/[id]/page.tsx` allStatsRows 변환 `won = m.winner_team_id !== null && matchTtId !== null && winner === matchTtId` — 라이브 매치 분자 0 + 분모는 모달 buildRow 내부 `rows.length` 기반 (미세 왜곡 케이스 발생 가능 — 사용자 결재 = 페이지 상단 winRate 와 일관 우선)
- AllStatsRow 타입 변경 (breaking) — 같은 타입 import 한 페이지 2개만 변경 영향 (검증 완료 — tsc --noEmit 0 에러)
- Flutter v1 (`api/v1/players/[id]/stats/route.ts` line 89) 잔존 — 원영 사전 공지 룰 (별도 결재)

#### 검증
- `npx tsc --noEmit` 0 에러 ✅
- DB schema 변경 0 ✅
- Flutter v1 영향 0 ✅
- 박스스코어 (formatGameClock) 영향 0 (초 그대로 사용 유지) ✅

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-A 매치별 recording_mode 게이팅 인프라]** schema 변경 0 / settings JSON 활용. 헬퍼 3종 (`getRecordingMode`/`assertRecordingMode`/`withRecordingMode`) + Flutter v1 3 라우트 가드 (sync/batch-sync/status) + admin ScoreModal 토글 (Flutter ↔ 종이 select + confirm + 사유 prompt) + 신규 admin endpoint `/api/web/admin/matches/[id]/recording-mode` (audit `mode_switch` + admin_logs warning) + vitest 14 케이스. tsc 0 / vitest 231/231 PASS (217 → 231). Flutter v1 로직 변경 0 (가드만 추가) → 원영 사전 공지 권장 (토스트 UX). 변경 7 파일. | ✅ |
| 2026-05-11 | DB 작업 (commit 무관) | **[열혈최강전 D-day 명단 검증]** 라이징이글스(13명) + 펜타곤(11명) 이미지 ↔ DB 대조. 라이징이글스 출전 10명 + 불참 3명 모두 DB 등록 ✅ / 펜타곤 #21 박성후 (User 3382, 5/5 가입) DB 미등록 발견 → 사용자 결재 후 TTP id=2848 INSERT (admin_logs id=87 박제 / snukobe 결재 / phone 카피 / 13명 cap). 라이징이글스 더미 4명(서장훈·전태풍·김태술·산다라박, jersey NULL = 출전 차단) + 펜타곤 잉여 2명(이병희·김대진) 그대로 두기 결정. | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **[live] 5/10 결승 영상 매핑 swap-aware 백포트 (3차 fix)** — score-match.ts 에 cron v3 `extractTeamsFromTitle` + `normalizeTeamName` export 추가. `scoreMatch()` home/away 점수 = 단순 substring → swap-aware 정확/swap 일치만 30+30 부여 (반쪽 매칭 0점). cron route 가 헬퍼 import — 단일 source 통합. 회귀 방지 vitest 14 케이스 추가 (5/10 사고 직접 재현 차단). tsc 0 에러 / vitest 217/217 PASS (minutes-engine 21/21 회귀 0). 변경 3 파일. | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **[live] 5/10 결승 영상 매핑 오류 긴급 fix** — /live/158 결승 (슬로우 vs 아울스, 4쿼터 진행) 가 video_id zIU3_RDRKuk (= 4강 #157 "아울스 vs 업템포") 잘못 재생. 진단 = audit log score=120 (home_team:30+away_team:30+time:60) → 알고리즘 결함 2건 (auto-register 1:1 가드 부재 + score-match swap-aware 미적용). 1단계 = 158 youtube_video_id NULL UPDATE + admin_logs warning 박제. 2단계 = auto-register/[matchId]/route.ts Step 9-1 추가 (cron `usedSet` 가드 백포트). tsc 0 에러. 후속 = score-match.ts cron v3 extractTeamsFromTitle 백포트 (별도 PR). | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **통산 스탯 3 결함 일괄 fix** (진단→fix 통합) — 정환조(3107) 5경기 raw 검증. (1) 모달 mpg `/60` 변환 (page.tsx 2 + AllStatsRow buildRow 단위 일관) (2) 승률 source 일치 (모달 won = winner_team_id 기반 — 상단 통산 100% 와 일관 / 라이브 매치 분모 제외) (3) FG%/3P% NBA 표준 sum/sum (statAgg _sum + AllStatsRow made/attempted + buildRow 누적 — 매치별 % 산술평균 39.8% → 31.0%). 3 파일 변경. tsc 통과. errors.md fix 결과 박제. Flutter v1 잔존 (원영 결재). | ✅ |
| 2026-05-09 | main `86c6d93` (PR #304) | **알기자 forfeit + dual_tournament 통합 fix** — auto-publish forfeit 카피 / 라이브 [Headline]·Stats 분기 / brief route roundContext+advancement / prompts Phase 1+2 가이드. notes 표준 "{팀} 기권 (사유: ...) — FIBA 5x5 Art.21 forfeit {점수}" 형식 박제. | ✅ |
| 2026-05-09 | main `adb0308` (PR #299) | **Flutter sync path 알기자 trigger 추가 (근본 fix)** — sync/route.ts + batch-sync/route.ts 의 prisma.tournamentMatch.update 직후 `waitUntil(triggerMatchBriefPublish)` 추가. updateMatchStatus 헬퍼 우회 path 보강. 멱등 가드 내장. errors.md 박제. | ✅ |
| 2026-05-09 | main `1e2272d` (PR #286) | **알기자 draft 사이트 노출 차단** — prefetchCommunity (`where: {}` → status="published") + getPost (findUnique → findFirst+status). /community SSR 진입 + 직접 URL 양쪽 차단. | ✅ |
| 2026-05-09 | DB 작업 (commit 무관) | **D-day 운영 5건** — 박찬웅 MZ #7 등록 (userId=3000) / 이현승 (블랙라벨 #27) + MZ 3인 (이용기·박찬웅·곽용성) 선출 / #20 MI 기권 FIBA forfeit 20-0 (notes "부상 등 인원부족") + 진출 자동 / 알기자 수동 발행 5건 (post#1380~1385 — sync trigger fix 운영 전 종료 매치). | ✅ |
| 2026-05-10 | main 시리즈 (#291~#301) | **PlayerLink/TeamLink 박제 시리즈 5 단계** — 1단계 글로벌 컴포넌트 (`b4e437d`) / 2단계 라이브 페이지 (`ec3f4ff`) / 3-A 대회 페이지 (`a5d5e37`) / 후속 A+B+C+D 일괄 (`b735db5`) — TeamLink 24 + PlayerLink 17 누적 마이그. children + onClick 확장 패턴 (nested anchor 회피). | ✅ |
| 2026-05-10 | main 시리즈 (#266~#290) | **모바일 박스스코어 PDF 시리즈 11 PR** — Fix A→D html2canvas+jspdf 근본 해결 / 양식 PC 프린트 동등 / globals.css single source / errors.md 박제 ("모바일 print = window.print 금지") | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 / 5/5 ae4ffd7~5d62f7f 팀 멤버 라이프사이클+Jersey 5 Phase 16 PR / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 인증 흐름 재설계 / 5/6 PR1e DROP COLUMN + UI fix 13건 / 5/7 main 21회 신기록 Onboarding 10단계 + PortOne V2 + Phase A.5 / 5/8 main 7회 PR3 mock + PhoneInput + 시안 11 commit / 5/9 main 9회 알기자 시스템 4 fix + 운영 5건 / 5/10 PR #246+#247 scoreMatch+Live.jsx 시안 박제 / PR #248+#249 자동 트리거+PR4+Tailwind 3차 / 5/10 아울스 #64 + 이하성 sync + stale pending 3건 정정) — 복원: git log -- .claude/scratchpad.md -->
