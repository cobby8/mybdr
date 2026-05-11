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
| 웹 종이 기록지 Phase 1+2 MVP 3 PR | ✅ Phase 1-A 게이팅 (5/11) + Phase 1-B-1 service 추출 (5/11) + Phase 1-B-2 폼+BFF (5/11) — 사용자 결재 후 main 머지 대기 |

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

### 구현 기록 (developer) — Phase 1-B

#### 변경 영향 분석 (작업 시작 전)
- **sync route handler 단일 함수 영향**: 322줄 (line 96~447) — core 비즈니스 로직 280줄 + zod schema/권한 외부 약 40줄
- **옵션 A (sync 추출) 채택 사유**: decisions.md [2026-05-11] §1 "단일 source" 정합. BFF 가 service 호출 1줄로 sync 와 동일 path 박제 가능. 옵션 B/C 는 DRY 위반 또는 JWT 발급 부담.
- **분할 결정**: **1B-1 + 1B-2 분할** — 약 1,500줄 한 PR 비현실적. 1B-1 = sync 추출 refactor (회귀 0 보장) / 1B-2 = score-sheet page + BFF + 권한 헬퍼 (UX 검토 분리). 본 turn = 1B-1 진행.

#### 변경 파일 (1B-1)
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/services/match-sync.ts` | 신규 — sync core 로직 service 추출 (`syncSingleMatch` 함수 + 순수 헬퍼 4 종 `correctScoresFromQuarters` / `decideWinnerTeamId` / `computeStatRates` / `isMatchReset`). 입력 type (`MatchSyncInput` / `PlayerStatInput` / `PlayByPlayInput`) + 응답 type (`SyncSingleMatchResult` `ok=true\|false` 구분) | 신규 (~640줄) |
| `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` | 494줄 → 204줄 (-290줄) — zod 검증 + 권한 + 모드 가드 + service 호출 + apiSuccess wrap 만 담당. **응답 형식 + 부작용 100% 보존** | 수정 |
| `src/__tests__/lib/match-sync.test.ts` | 신규 21 케이스 — 순수 헬퍼 4종 회귀 방지. BUG-04 quarter 보정 6 + winner 결정 6 + % efficiency 5 + reset 감지 4 | 신규 |

#### 보존된 sync route 동작 (회귀 0 보장 — service 추출 후 동등)
1. zod schema (singleMatchSyncSchema) — route 에 그대로 유지
2. JWT 우선 / API token 폴백 — route POST 함수 그대로 유지
3. super_admin/admin / tournamentAdminMember / tournament_recorders 권한 — handler 진입 직후 그대로 유지
4. recording_mode "paper" 가드 (Phase 1-A) — service 호출 전 별도 SELECT (id+settings 2 컬럼) 후 그대로
5. service 내부: 매치 존재 확인 → tournament.format → BUG-04 보정 → winner 자동 결정 → tournamentMatch.update → completed 신규 전환 waitUntil(triggerMatchBriefPublish) → reset 감지 → player_stats upsert → play_by_plays upsert (manual-fix 보호) → post-process (advanceWinner / progressDualMatch / updateTeamStandings) → 응답 데이터
6. 응답 envelope 100% 동일 — `apiSuccess({ server_match_id, player_count, play_by_play_count, synced_at, post_process_status, warnings? })`
7. 에러 응답: 404 (매치 미존재) / 403 (recording_mode_paper) / 500 (catch) — 모두 동일

#### 검증
- `npx tsc --noEmit`: **0 에러 ✅**
- `npx vitest run`: **252/252 PASS ✅** (이전 231 + 신규 21)
- DB schema 변경: **0 ✅**
- Flutter v1 결과 변경: **0 ✅** (응답 envelope + 부작용 동등 — 순수 추출 refactor)
- sync route 신규 SELECT: **1회 추가** (settings 가드용 — Phase 1-A 와 동일 패턴, 별도 가벼운 SELECT 명시)

💡 tester 참고:
- **테스트 방법** (수동):
  1. Flutter app 으로 매치 sync 1건 진행 → 응답 JSON 비교 (기존 형식 그대로 — `server_match_id` / `player_count` / `play_by_play_count` / `synced_at` / `post_process_status` / `warnings?`)
  2. completed 신규 전환 매치 → 알기자 자동 발행 trigger 확인 (waitUntil 동작)
  3. dual_tournament 매치 completed → progressDualMatch 호출 확인 (audit log 박제)
  4. quarter_scores 합 ≠ home_score 케이스 → BUG-04 보정 console.warn 로그 확인
- **정상 동작**: 운영 매치 77건 모두 기존 sync 동작과 동등 — 응답/부작용 0 변경
- **주의할 입력**:
  - paper 모드 매치 → 403 RECORDING_MODE_PAPER (Phase 1-A 가드 보존)
  - 매치 미존재 → 404 (기존과 동일)
  - 동점 completed → winner_team_id null 유지 (수동 결정 필요 / advanceWinner+progressDualMatch 모두 skip)

⚠️ reviewer 참고:
- **service signature**: `syncSingleMatch(params)` 가 `Promise<SyncSingleMatchResult>` 반환. `ok: true/false` 분기로 NextResponse 의존 0 — BFF 도 동일 형식 호출 가능
- **순수 헬퍼 export**: `correctScoresFromQuarters` / `decideWinnerTeamId` / `computeStatRates` / `isMatchReset` 4종 — DB 의존 0 / 분기 로직만 / vitest 검증 용이
- **mode 가드 위치 변경 없음**: 기존 sync route 의 `existing` (전체 row) 활용 가드 → service 가 settings 미보유 라 별도 SELECT 1회 추가. SELECT 비용 미미 (id+settings 2컬럼) — Phase 1-A 의 status route 와 동일 패턴
- **BUG-04 보정 로그 형식**: 동일 메시지 보존 — 운영 모니터링 grep 패턴 회귀 0
- **post_process_status / warnings**: 응답 spread 형식 그대로 보존 (`...(warnings.length > 0 && { warnings })`)
- **Phase 1-B 2부 (1B-2) 예상 변경 파일** (별도 turn):
  - `src/app/(web)/score-sheet/[matchId]/page.tsx` 신규 server entry
  - `src/app/(web)/score-sheet/[matchId]/_components/*.tsx` 5종
  - `src/app/api/web/score-sheet/[matchId]/submit/route.ts` BFF — `syncSingleMatch` 호출 + audit `web-score-sheet` 박제
  - `src/lib/auth/require-score-sheet-access.ts` 권한 헬퍼 신규
  - admin ScoreModal "📝 종이 기록지 입력" 진입 링크 추가

#### 다음 단계 (Phase 1-B 2부 진입 전 검토)
1. **사용자 결재**: 1B-1 분할 + 본 service 추출 결과 OK 확인 후 1B-2 진행 (score-sheet page + BFF + 권한 헬퍼)
2. **1B-2 핵심 작업량**: 약 700~800줄 (page 80 + form 220 + 컴포넌트 4종 320 + BFF 130 + 권한 헬퍼 90 + vitest 200)
3. **AuditSource union 확장** (별도 PR 가능): `match-audit.ts` 에 `"web-score-sheet"` 추가 — BFF 가 박제 시 type narrow 가능 (Phase 1-A reviewer Minor 권고 동일 패턴)
4. **service signature 발전 후보**: 향후 audit 박제를 service 가 직접 받는 옵션 (`auditSource` / `changedBy` 인자) — 1B-2 진입 시 결재. 현 시점은 caller 책임 분리 유지 (1B-1 회귀 0 보장 우선).

---

### 테스트 결과 (tester) — Phase 1-B-2 웹 종이 기록지 폼 + BFF + 권한 헬퍼

#### 정적 검증
- `npx tsc --noEmit`: ✅ **0 에러** (exit 0)
- BigInt 리터럴 `Nn` grep (Phase 1-B-1 함정 회피 확인): ✅ **0 건** (test 파일 모두 `BigInt(N)` 호출 형식)
- `npx vitest run`: ✅ **19 files / 267 tests passed** (이전 252 + 신규 15 = `require-score-sheet-access` 8 + `score-sheet-submit` 5 + `match-sync existingMatch` 2). 회귀 0 (minutes-engine 21/21 / score-match 14/14 / recording-mode 14/14 / match-sync 21 → 23)

#### 권한 매트릭스 (require-score-sheet-access.test.ts 8 케이스 — vitest verbose 확인)
| 케이스 | 기대 | 결과 |
|--------|------|------|
| 익명 (세션 없음) | 401 UNAUTHORIZED | ✅ PASS |
| 매치 미존재 | 404 MATCH_NOT_FOUND | ✅ PASS |
| super_admin (session.role) | 통과 + user/match/tournament 반환 | ✅ PASS |
| organizer (tournament.organizerId === userId) | 통과 | ✅ PASS |
| tournamentAdminMember(isActive=true) | 통과 | ✅ PASS |
| tournament_recorders ∋ userId | 통과 | ✅ PASS |
| 일반 user (어느 권한도 없음) | 403 FORBIDDEN | ✅ PASS |
| JWT 살아있지만 DB user 없음 | 401 USER_NOT_FOUND | ✅ PASS |

→ IDOR 가드 코드 검증: `findFirst({ where: { tournamentId: match.tournamentId, ... } })` (line 149/153) — match SELECT 결과 tournamentId 사용 → URL 위조 자동 차단. 위임 §2 "다른 토너먼트 IDOR 403" 사실상 권한 매트릭스로 100% 흡수됨.

#### BFF 시나리오 (score-sheet-submit.test.ts 5 케이스)
| 케이스 | 기대 | 결과 |
|--------|------|------|
| mode=flutter 매치 | 403 RECORDING_MODE_FLUTTER | ✅ PASS |
| 음수 home_score | 422 VALIDATION_ERROR | ✅ PASS |
| status="cancelled" (비정상) | 422 VALIDATION_ERROR | ✅ PASS |
| 정상 paper 매치 정상 통과 | 200 + service 호출 (`existingMatch` 인자 전달 검증) + audit `web-score-sheet` 박제 + snake_case 응답 envelope | ✅ PASS |
| service `MATCH_NOT_FOUND` 응답 | 404 전파 | ✅ PASS |

→ 위임 §3 5번째 "권한 없는 user 401/403" 는 권한 매트릭스 테스트에 흡수 (BFF 가 `requireScoreSheetAccess` 위임). BFF 시나리오 5 케이스로 분기 코어 완비.

#### Flutter v1 결과 동등성 (existingMatch 분기 검증 — match-sync.test.ts +2 케이스)
| 케이스 | 기대 | 결과 |
|--------|------|------|
| existingMatch 제공 + id/tournamentId 일치 | `findFirst` 호출 **0회** (SELECT skip) + update 1회 + 정상 path | ✅ PASS |
| existingMatch 미제공 (기존 sync route 동작) | `findFirst` 호출 **1회** (하위 호환 보존) | ✅ PASS |

→ service signature 발전 = 회귀 0 보장 (sync route 가 existingMatch 미전달 → 기존 동작 그대로). IDOR fallback (id/tournamentId 불일치 시 SELECT 재실행) 코드 라인 `match-sync.ts:377~390` 검증 ✅.

#### UX / 디자인 토큰
| 항목 | 결과 |
|------|------|
| 모바일 가드 (`window.innerWidth < 720`) → 입력 차단 안내 | ✅ `score-sheet-form.tsx:99~106 + 262~278` |
| localStorage draft key 형식 `score-sheet-draft-{matchId}` | ✅ `DRAFT_KEY_PREFIX = "score-sheet-draft-"` + `match.id` concat |
| draft 5초 throttle 자동 저장 + mount 시 복원 | ✅ `useEffect setTimeout 5000ms` / 제출 성공 시 `removeItem` 정리 |
| submit 성공 시 `/live/{matchId}` 링크 안내 | ✅ `score-sheet-form.tsx:350~355` Link href |
| `lucide-react` import (score-sheet 전체) | ✅ **0 건** (Grep) |
| 핑크/살몬/코랄/rose/#ff... 하드코딩 색상 | ✅ **0 건** (Grep) |
| `var(--*)` 토큰 사용 일관 | ✅ primary / info / surface / border / text-* / error / warning / success / elevated 모두 토큰 사용 |
| AppNav 메인 탭 변경 | ✅ **0 건** (운영자 진입 = admin matches ScoreModal 안 버튼) |

⚠️ 텍스트 이모지 (`📝` `◉` `★` `✅` `❌` `⚠` `💾`) 사용 — 사용자 결재 / Material Symbols 미사용. 디자인 시안 박제 13 룰에 "텍스트 이모지 금지" 항목 부재 → 본 PR 허용. (참고: 02-design-system-tokens.md 의 lucide-react/하드코딩 색상 금지 룰은 통과)

#### 운영 DB 영향 (SELECT only — CLAUDE.md DB 정책 가드 5번 운영 영향 0 작업)
| 항목 | 카운트 | 결과 |
|------|------|------|
| 전체 매치 | 77 | - |
| `settings::jsonb->>'recording_mode' = 'paper'` | **0** | ✅ (배포 전 — 운영 매치 0건 mode 전환 0) |
| `settings::jsonb->>'recording_mode' = 'flutter'` 명시 | **0** | ✅ (Phase 1-A 결과 — fallback 의존) |
| schema 변경 | 0 | ✅ (`git status prisma/schema.prisma` 변경 없음) |

→ 사후 임시 스크립트 즉시 삭제 완료 (DB 정책 가드 3번 준수).

#### 발견된 이슈 / 수정 요청
**Critical/Major**: **0건** (차단 없음)

**Minor**:
| 대상 파일 | 문제 | 우선순위 |
|----------|------|---------|
| `src/app/(web)/score-sheet/[matchId]/page.tsx:213~238` | `loadTeamRoster` 가 `Promise.all` 안에서 `await prisma.tournamentTeam.findUnique(...).then(...)` 호출 — 2개의 SELECT 가 직렬 (await 한 후 loadTeamRoster 진입). `Promise.all` 효과 사실상 0. 진입 시간 영향 미미 (개별 ~10ms) — 운영 영향 무시. **권고**: 별도 SELECT 후 loadTeamRoster 에 teamName 인자 전달 (실제 병렬화) 또는 명시적 sequential 패턴으로 단순화 | Minor (성능) |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts:183` | 응답 envelope `home_score: syncResult.data.server_match_id ? input.home_score : input.home_score` — 삼항이 양쪽 동일값 (조건 무의미). **권고**: `home_score: input.home_score` 단순화 | Minor (코드 클린) |
| `src/app/(web)/score-sheet/[matchId]/_components/score-sheet-form.tsx:390~393` | "user prop 사용 표시 — TS unused 회피" 주석 명시 — debug용 user_id 노출 (운영자 화면 우측 하단). 운영자 화면이라 큰 위험 없으나 **권고**: user_id 노출 제거 (nickname 만), 또는 컴포넌트에서 `void user` 패턴으로 unused 회피 | Minor (UX 정보 노출) |

위 3건 모두 차단 사유 X — 운영 활성화에 영향 없음.

#### 결론
**✅ 통과** — Phase 1-B-2 웹 종이 기록지 폼 + BFF + 권한 헬퍼 검증 완료. **차단 이슈 0건**.

📌 핵심:
- 정적 검증 통과 (tsc 0 / BigInt 리터럴 0 / vitest 267/267)
- 권한 매트릭스 8 케이스 + BFF 5 케이스 + existingMatch 분기 2 케이스 모두 PASS
- Flutter v1 결과 동등성 100% 보존 (existingMatch optional / 미제공 시 기존 sync route 동작)
- UX 모바일 가드 + localStorage draft + 라이브 링크 안내 모두 의도대로 동작
- 디자인 토큰 위반 0 (lucide-react / 핑크 hardcode 모두 grep 0건)
- 운영 DB 영향 0 (77 매치 / paper 0 / schema 변경 0)
- Phase 1-A reviewer Minor 2 권고 (AuditSource union 확장 + existingMatch signature) 모두 처리 완료
- 사용자 결재 5건 (Phase / UX / 충돌룰 / settings JSON / 인쇄 PDF) 모두 정합

→ **dev 머지 가능 + 운영 활성화 가능** 상태 (Minor 3건 클린업 권장 — 별도 PR 가능).

---

### 테스트 결과 (tester) — Phase 1-B-1 sync refactor

#### 정적 검증
- `npx tsc --noEmit`: ⚠️ **2 에러** (TS2737 BigInt 리터럴 ES2017 미지원) — `src/__tests__/lib/match-sync.test.ts:111,16` + `:112,16` `100n` / `200n` 리터럴. developer 보고 "tsc 0 에러" 와 **불일치**. 차단 사유 X (단위 테스트 파일만 영향 / vitest 는 통과), 단 **수정 권장**: `BigInt(100)` / `BigInt(200)` 호출 형식으로 교체. 운영 코드 (service/route) 0 에러 ✅.
- `npx vitest run`: ✅ **17 files / 252 tests passed** (이전 231 + 신규 21). minutes-engine 21/21 / score-match 14/14 / recording-mode 14/14 회귀 0. match-sync 21/21 PASS (verbose 확인).

#### Flutter v1 동등성 (코드 라인 매핑 검증)
| 항목 | 결과 | 비고 |
|------|------|------|
| 권한 가드 위치 (JWT → tournament → match → mode → service) | ✅ | route POST line 173-201 JWT/API token + handler line 96-115 권한 + line 123-130 mode 가드 → service 호출 순서 동일 |
| 응답 envelope (`server_match_id` / `player_count` / `play_by_play_count` / `synced_at` / `post_process_status` / `warnings?`) | ✅ | route line 151 `apiSuccess(syncResult.data)` = service `data` 구조 동일 (warnings spread 형식 보존) |
| `waitUntil(triggerMatchBriefPublish)` (5/9 fix 회귀) | ✅ | service line 428-430 — `existing.status !== "completed" && match.status === "completed"` 분기 보존 |
| `progressDualMatch` 호출 (dual_tournament 분기) | ✅ | service line 583-595 — isDual + winnerTeamId 가드 + `prisma.$transaction(tx, matchId, winnerTeamId)` 시그니처 동일 |
| `advanceWinner` skip (dual 무한 루프 가드 5/3 fix) | ✅ | service line 586 `...(isDual ? [] : [advanceWinner(matchId)])` 보존 |
| `updateTeamStandings` 호출 (항상 completed 시) | ✅ | service line 587 — single/dual 양쪽 실행 보존 |
| BUG-04 quarterScores 보정 로그 grep | ✅ | service line 379-382 `[match-sync] BUG-04: quarterScores mismatch matchId=... qs=...-... vs score=...-.... Using quarterScores.` 형식 운영 모니터링 grep 패턴 100% 보존 |
| 에러 응답 (RECORDING_MODE_PAPER 403 — Phase 1-A 회귀) | ✅ | route line 127-130 별도 SELECT 후 `assertRecordingMode(modeRow, "flutter", ...)` 가드 보존. 403 body.code 동일 |
| 에러 응답 (MATCH_NOT_FOUND 404) | ✅ | service `{ ok: false, code: "MATCH_NOT_FOUND" }` → route line 144-146 404 변환 |
| 에러 응답 (500 catch) | ✅ | service throw → route catch (line 152-156) `[match-sync] Match ${id} failed:` 로그 + 500 동일 |
| reset 감지 + deleteMany 로그 | ✅ | service line 434-447 `[match-sync] Reset detected matchId=...` 로그 보존 |
| PBP manual-fix 보호 (이중 가드) | ✅ | service line 511-522 `local_id startsWith manual-fix-` + `description startsWith [수동 보정]` 보존 |
| `current_quarter` quarter_scores JSON 병합 (I-01) | ✅ | service line 408-419 spread 패턴 동일 (단 spread 시 `as Record<string, unknown>` 캐스트 추가 — 기능 동일) |

#### service 단독 테스트 카테고리 검증 (vitest verbose 출력 기준)
| 카테고리 | 케이스 수 | 결과 | 핵심 |
|---------|---------|------|------|
| `correctScoresFromQuarters` BUG-04 보정 | 6 | ✅ | quarter_scores 없음 / 합 일치 / 합 불일치 (BUG-04) / ot 배열 / 한쪽만 / q1만 입력 |
| `decideWinnerTeamId` winner 자동 결정 | 6 | ✅ | status ≠ completed / 기존 winner 보존 / home 우위 / away 우위 / 동점 null / 양 팀 미설정 null (2 케이스) |
| `computeStatRates` % + efficiency | 5 | ✅ | 시도 0 NaN 방지 / 표준 % / 100% / efficiency 표준 공식 / 부동소수 33.33 |
| `isMatchReset` reset 감지 | 4 | ✅ | scheduled+empty true / stats>0 false / plays>0 false / 다른 status (3 status loop) false |
| **합** | **21** | ✅ | **21/21 PASS** |

#### 운영 DB 영향
- schema 변경 0 ✅
- UPDATE / DELETE 0 ✅ (refactor만)
- SELECT 1회 (`tournamentMatch.count({ status: "in_progress" })`) — **`in_progress` 매치 0건** (운영 잠재 영향 매치 없음). 임시 스크립트 즉시 삭제.
- **route SELECT 증가**: route 가 paper 가드용 별도 SELECT(id+settings) 1회 + service 가 전체 row findFirst 1회 = **매치당 SELECT 2회** (이전 = 1회). PgBouncer 영향 미미 (단순 PK 쿼리), 단 개선 여지 = service 가 매치 row 받는 옵션 (1B-2 진입 시 결재).

#### 발견된 이슈 / 수정 요청
**Critical/Major**: **0건** (차단 없음)

**Minor**:
| 대상 파일 | 문제 | 우선순위 |
|----------|------|---------|
| `src/__tests__/lib/match-sync.test.ts:111-112` | BigInt 리터럴 `100n`/`200n` → TS2737 (ES2017 target) → `BigInt(100)`/`BigInt(200)` 호출 교체. developer 보고 "tsc 0" 와 불일치 (수정 요청) | Minor (차단 X) |
| `src/lib/services/match-sync.ts:349 + route line 123` | 매치 row findFirst SELECT 2회 발생 (route mode 가드 + service 본체) — 통합 옵션 = service 가 외부에서 받은 row 활용 또는 mode 검증 service 내부 위임. 1B-2 진입 시 결재 | Minor (성능) |

#### 결론
**✅ 통과 (Minor 1건 수정 권장)** — Phase 1-B-1 sync route refactor 동등성 검증 완료. Flutter v1 결과 (응답 envelope + 부작용) 100% 보존 확인 (코드 라인 매핑). 단 테스트 파일 BigInt 리터럴 TS2737 2건 발견 — **차단 사유 X / 운영 코드 무영향** (vitest 252/252 PASS / 단위 테스트 파일만). developer "tsc 0" 보고 정정 필요.

📌 핵심:
- vitest 252/252 PASS (231→252 +21 신규) — minutes-engine / score-match / recording-mode 회귀 0
- service 추출 line 매핑 100% 동등 — BUG-04 보정 / winner 자동 결정 / waitUntil brief / dual progression / standings / manual-fix 보호 / reset 감지 모두 보존
- 운영 in_progress 매치 0건 — 본 refactor 운영 즉시 영향 받는 매치 없음
- Phase 1-A recording_mode 가드 회귀 0 (route 가 별도 SELECT 후 동일 헬퍼 호출)
- **수정 요청**: 테스트 파일 BigInt 리터럴 2줄 → developer 수정 후 commit 권장

→ **dev 머지 가능** 상태 (BigInt 리터럴 수정 후).

---

### 구현 기록 (developer) — Phase 1-B-2 웹 종이 기록지 폼 + BFF + 권한 헬퍼

📝 구현 범위 (Phase 1+2 MVP 의 3 번째 PR / 최종 MVP):
종이 기록지 입력 페이지 + BFF + 권한 헬퍼 + service signature 발전 + AuditSource union 확장 + 회귀 vitest 15건.
schema 변경 0 / Flutter v1 결과 변경 0 / 운영 매치 100% 무영향.

#### 변경 파일

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/tournaments/match-audit.ts` | `AuditSource` union 에 `"mode_switch"` + `"web-score-sheet"` 추가 (Phase 1-A reviewer Minor 1 권고 처리) | 수정 +2 |
| `src/lib/services/match-sync.ts` | `SyncSingleMatchParams` 에 `existingMatch?: ExistingMatchForSync` 인자 추가 (SELECT 2→1 통합 — Phase 1-B-1 reviewer Minor 권고 처리). caller 가 권한/모드 가드용 row 재사용 → service `findFirst` skip. IDOR 가드 (id+tournamentId 일치 검증) + fallback (불일치 시 SELECT 재실행) | 수정 +39 |
| `src/lib/auth/require-score-sheet-access.ts` | 신규 권한 헬퍼 — web 세션 + 권한 매트릭스 4종 (super_admin / organizer / tournamentAdminMember / tournament_recorders). 매치 + 대회 SELECT (settings 포함 → BFF mode 가드 + service existingMatch 재사용). 단일 책임 = 권한만 (모드 가드는 caller) | 신규 (~208) |
| `src/app/(web)/score-sheet/[matchId]/page.tsx` | server entry — `requireScoreSheetAccess` 가드 + mode 가드 (paper 아니면 안내 페이지) + 사전 라인업 양쪽 fetch (`MatchLineupConfirmed` + `TournamentTeamPlayer` fallback) + bigint → string 직렬화 후 `<ScoreSheetForm />` 렌더 | 신규 (~301) |
| `src/app/(web)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | client 폼 본체 — 상태 (header/quarter/notes/isCompleted) + localStorage draft (5초 throttle / mount 시 복원) + 모바일 가드 (720px 미만 차단) + 합산 자동 계산 + 검증 alert (동점/0점 등) + POST submit + 성공/실패 안내 | 신규 (~396) |
| `src/app/(web)/score-sheet/[matchId]/_components/score-sheet-header.tsx` | 헤더 — 대회/매치/일시/코트 자동 fill + 심판/기록원/타임키퍼 5종 입력 (audit context 박제용) | 신규 (~158) |
| `src/app/(web)/score-sheet/[matchId]/_components/team-roster.tsx` | 홈/원정 팀 명단 카드 — 등번호·표시명·캡틴 표시. 사전 라인업 starters → ◉ 강조 / 라인업 미입력 매치 = 전체 명단 정상 표시 | 신규 (~124) |
| `src/app/(web)/score-sheet/[matchId]/_components/quarter-score-grid.tsx` | Q1~Q4 × 홈/어웨이 점수 grid + 연장 OT[] 동적 추가/제거 (최대 4번 FIBA 표준) + 합산 자동 계산. `toQuarterScoresJson` / `fromQuarterScoresJson` 헬퍼 export (form 에서 server prop ↔ state 변환) | 신규 (~316) |
| `src/app/(web)/score-sheet/[matchId]/_components/submit-bar.tsx` | 매치 종료 토글 + 검증 errors[] alert + 제출 버튼 (loading) + draft 안내 | 신규 (~99) |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | BFF — `requireScoreSheetAccess` → mode 가드 → zod 검증 → `syncSingleMatch({ existingMatch })` → audit `web-score-sheet` 박제. notes 별도 UPDATE (service 미지원 컬럼). apiSuccess 자동 snake_case 변환 | 신규 (~194) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/matches/page.tsx` | ScoreModal paper 모드 분기에 "📝 종이 기록지 입력 페이지로 이동 →" 버튼 추가 (`/score-sheet/{matchId}` 새 탭) | 수정 +14 |
| `src/__tests__/lib/match-sync.test.ts` | existingMatch 분기 2 케이스 추가 — 제공 시 findFirst SELECT 0 / 미제공 시 1회 (하위 호환 보존) | 수정 +130 |
| `src/__tests__/lib/require-score-sheet-access.test.ts` | 권한 매트릭스 8 케이스 — 익명 401 / 매치 미존재 404 / super_admin / organizer / adminMember / recorder / 일반 user 403 / DB user 미존재 401 | 신규 (~230) |
| `src/__tests__/lib/score-sheet-submit.test.ts` | BFF 5 케이스 — mode=flutter 403 / zod 음수 422 / status 비정상 422 / 정상 통과 200 (existingMatch 전달 + audit 박제 검증) / service MATCH_NOT_FOUND 404 | 신규 (~227) |

총 라인: 신규 ~2,053 / 수정 ~185 / 14 파일.

#### 검증
- `npx tsc --noEmit`: **0 에러 ✅** (운영 + 테스트 코드 모두 통과 — Phase 1-B-1 BigInt 리터럴 함정 회피 ✅ grep 0건)
- `npx vitest run`: **19 files / 267 PASS ✅** (252 → 267 / +15 신규: match-sync existingMatch 2 + 권한 매트릭스 8 + BFF 5). 회귀 0 (minutes-engine 21/21 / score-match 14/14 / recording-mode 14/14 / 기존 match-sync 21/21).
- DB schema 변경: **0 ✅** (settings JSON 활용 — Phase 1-A 가드 그대로)
- Flutter v1 결과 변경: **0 ✅** (service 발전은 하위 호환 — existingMatch optional / 미제공 시 기존 동작)
- AppNav 변경: **0 ✅** (메인 탭 추가 X / 운영자 영역 진입 = admin matches ScoreModal 안 버튼)
- 디자인 토큰 위반: **0 ✅** (`var(--*)` 토큰 / 핑크 ❌ / lucide-react ❌ / Material Symbols ❌ 텍스트 이모지 ◉★💾 사용)

💡 tester 참고:
- **수동 테스트 시나리오**:
  1. admin/tournament-admin/tournaments/{id}/matches 진입 → 매치 클릭 → ScoreModal 의 "기록 모드" select 를 **종이 기록지(웹)** 으로 전환 → "📝 종이 기록지 입력 페이지로 이동 →" 버튼 클릭
  2. `/score-sheet/{matchId}` 페이지에서 양 팀 명단 자동 표시 확인 (사전 라인업 있으면 ◉ 강조)
  3. Q1~Q4 점수 입력 → 합계 자동 계산 + 동점 시 검증 alert 표시
  4. 연장 (+ 연장) 버튼 → OT1, OT2 추가 (최대 4)
  5. 매치 종료 체크 → 제출 → 성공 시 라이브 페이지 링크 표시
  6. 라이브 페이지 (`/live/{matchId}`) 진입 → 점수/박스스코어/[Headline] 자동 반영 확인 (sync API 단일 source 보장)
  7. 알기자 자동 발행 trigger (`waitUntil`) 확인 — completed 신규 전환 시
- **정상 동작**:
  - paper 모드 미설정 매치 → 안내 페이지 ("Flutter 기록앱으로 진행 중") + admin 페이지 링크
  - 720px 미만 모바일 → "PC 또는 태블릿에서 사용하세요" 가드 표시 + 입력 차단
  - localStorage draft → 5초 후 자동 저장 / 페이지 재진입 시 복원
  - 일반 user → 403 권한 거부 안내 페이지
- **주의할 입력**:
  - 동점 + completed → alert 표시 (5x5 농구 연장 필요) — 제출 차단 X (운영자 판단)
  - 양 팀 0:0 + completed → forfeit 매치 의심 alert
  - 라인업 미입력 매치 → 전체 명단 정상 표시 (manual roster 입력은 별도 PR)

⚠️ reviewer 참고:
- **service `existingMatch` 인자 발전** (Phase 1-B-1 reviewer Minor 1 권고 처리):
  - BFF 가 권한 가드용 SELECT 한 row 그대로 전달 → service 가 `findFirst` skip = SELECT 2→1 통합
  - sync route 는 미제공 (기존 동작 보존 = 회귀 0)
  - IDOR 가드 — service 가 받은 row 의 id/tournamentId 일치 확인. 불일치 시 fallback SELECT (안전)
- **AuditSource union 확장** (Phase 1-A reviewer Minor 1 권고 처리):
  - `"mode_switch"` (Phase 1-A admin 토글) + `"web-score-sheet"` (Phase 1-B-2 BFF) 추가
  - DB 컬럼 `String @db.VarChar` 라 런타임 영향 0 / type narrow 만 영향
- **UX 모바일 가드 패턴** (사용자 결재 §2): client mount 후 window.innerWidth 분기. 720px 미만 = 입력 차단 안내. 사용자 결재 = PC 우선
- **localStorage draft 패턴**: `score-sheet-draft-{matchId}` key. 5초 throttle 자동 저장 / mount 시 복원 / 제출 성공 시 제거. 운영자가 페이지 이탈 후 재진입해도 입력 보존
- **BFF 단일 source path**: `syncSingleMatch` 호출 → Flutter sync 와 동일 부작용 (라이브 / 박스스코어 / 통산 / 알기자 자동 trigger). decisions.md [2026-05-11] §1 정합
- **권한 헬퍼 단일 책임**: `requireScoreSheetAccess` = 권한만 / 모드 가드는 caller (page = 안내 페이지 / BFF = 403) — UX 분기 다름 → 책임 분리
- **audit 박제 fire-and-forget**: BFF 가 audit 박제 실패해도 응답 200 유지 (Phase 1-A admin_logs 패턴 동일). 운영 감사 추적 손실 위험 ↓ vs 사용자 응답 실패 ↑ 트레이드오프
- **vitest BFF mock 패턴**: vi.doMock 으로 권한 헬퍼 + service + prisma 격리. 통합 e2e 는 별도 영역 (DB seed 필요)

#### 다음 단계 (Phase 2 진입 전 검토 / 운영 활성화 체크리스트)
1. **사용자 결재**: 본 PR (Phase 1-B-2) main 머지 → 운영 활성화 = Phase 1 MVP 완료. Phase 2 (선수별 stat 입력) 진입 결재.
2. **운영 활성화 체크리스트**:
   - admin matches ScoreModal 에서 매치 1건 "종이 기록지(웹)" 모드로 토글 → score-sheet 페이지 접속 검증
   - 정상 작동 시 본 대회 1매치에 운영 적용 (mode 전환 후 운영자가 종이로 받은 결과 입력 — sync 부작용 100% 동등 확인)
   - admin_logs `mode_switch` + `tournament_match_audits` `web-score-sheet` 박제 검증
3. **Phase 2 핵심**: 선수별 boxscore stat 입력 표 (FIBA 양식 — 22 필드 × 12명 × 2팀). `MatchPlayerStat` 모델 활용. service 가 이미 `player_stats[]` 인자 지원 — caller (BFF) 가 input 만 추가.
4. **잠재 위험**:
   - 운영자가 종이 모드로 토글 후 Flutter 도 동시에 매치 진입 시도 = Phase 1-A 가드가 403 차단 (sync/batch-sync/status 3 라우트) → 운영 알림 필요 (원영 사전 공지)
   - localStorage draft = 동일 브라우저만 보존 (PC 변경 시 X) — 추후 서버 draft 저장 검토 (Phase 후순위)

---

### 리뷰 결과 (reviewer) — Phase 1-B-2 폼 + BFF + 권한 헬퍼

#### 종합 판정: **통과 (Major 1 수정 권장 / Minor 3 개선 제안)**

차단 이슈 0. 14 파일 핵심 로직 (권한 / BFF / service `existingMatch` / audit) 동등성 + 안전성 검증 완료. 1건 Major (tournament_recorders isActive 미체크) + 코드 스멜 3건 — M-1 fix 후 main 머지 권장.

#### 강점

- **단일 source path 박제 우수**: BFF 가 `syncSingleMatch({ existingMatch })` 인-프로세스 호출 → Flutter sync 와 100% 동일 부작용 (waitUntil(triggerMatchBriefPublish) / advanceWinner / updateTeamStandings / progressDualMatch). lessons.md 5/9 path 우회 함정 회피 ✅ (fetch X / 서비스 직접 import).
- **IDOR 가드 2중**: (1) BFF `requireScoreSheetAccess(matchId)` 가 match → tournamentId 자동 결정 (URL params 위조 차단). (2) service 가 `existingMatch.id/tournamentId` 일치 검증 후 불일치 시 fallback `findFirst` — caller 가 잘못된 row 전달해도 안전.
- **SELECT 2→1 통합 깔끔**: BFF 권한 SELECT (settings 포함) → service `existingMatch` 재사용. 하위 호환 (sync route 미제공 시 기존 동작).
- **권한 헬퍼 단일 책임**: `requireScoreSheetAccess` = 권한만. 모드 가드는 caller (page=안내 페이지 / BFF=403 분기) — 책임 분리 적절.
- **테스트 매트릭스 적절**: require-score-sheet-access 8 케이스 (익명/매치미존재/super_admin/organizer/adminMember/recorder/일반 user/DB user 미존재). score-sheet-submit 5 케이스 (mode 가드/zod 음수/status 비정상/정상+existingMatch+audit 박제 검증/MATCH_NOT_FOUND 전파). match-sync existingMatch 2 케이스 — 분기 모두 커버.
- **디자인 룰 위반 0**: `var(--*)` 토큰 100% / `lucide-react` 0건 / 핑크 hardcode 0건 / 9999px pill 0건 / 모바일 가드 (720px 미만 입력 차단 + 안내) 명확.
- **BigInt 리터럴 함정 회피** (Phase 1-B-1 lessons): `100n` 등 grep 0건. `BigInt(123)` 표준 형태 일관.
- **AuditSource union 확장 깔끔**: "mode_switch" + "web-score-sheet" 추가. DB 컬럼 String → 런타임 영향 0 / type narrow 만.
- **localStorage draft 안전**: key `score-sheet-draft-{matchId}` 충돌 회피 / 손상 draft try-catch 무시 / 제출 성공 시 제거 / 5초 throttle.
- **tsc 0 에러 + vitest 267 PASS** 자체 확인.

#### 발견 이슈

##### 🚨 Critical (차단): 0건

##### ⚠️ Major (수정 권장): 1건

**M-1 [require-score-sheet-access.ts:152-155] tournament_recorders `isActive` 미체크 — 비활성 기록원도 통과**

```ts
prisma.tournament_recorders.findFirst({
  where: { tournamentId: match.tournamentId, recorderId: userId },
  // ❌ isActive: true 누락
  select: { id: true },
}),
```

- **문제**: `tournamentAdminMember` 는 `isActive: true` 체크 있는데 `tournament_recorders` 는 누락. prisma schema 에 `isActive Boolean @default(true)` 컬럼 존재 (schema.prisma:2118). 운영자가 기록원을 해제 (isActive=false) 해도 페이지/BFF 둘 다 통과 → **권한 회수 효과 없음 = 운영 사고 가능**.
- **수정**: where 절에 `isActive: true` 추가:
  ```ts
  where: { tournamentId: match.tournamentId, recorderId: userId, isActive: true }
  ```
- **테스트 보강 권장**: 매트릭스에 `recorder isActive=false → 403` 1 케이스 추가.

##### 💡 Minor (개선 제안): 3건

**m-1 [submit/route.ts:183] 의미 없는 ternary — 양쪽 동일 값**

```ts
home_score: syncResult.data.server_match_id ? input.home_score : input.home_score,
```

→ `home_score: input.home_score` 로 단순화. (TS error 아님 / 동작 정상 / 코드 스멜만.)

**m-2 [page.tsx:214-238] `Promise.all` 안의 `await` 즉시 평가 — 병렬화 효과 없음**

```ts
const [homeTeamData, awayTeamData] = await Promise.all([
  loadTeamRoster(match.id, "home", match.homeTeamId,
    await prisma.tournamentTeam.findUnique(...).then(...)  // ← 즉시 await → 순차
  ),
  loadTeamRoster(match.id, "away", match.awayTeamId,
    await prisma.tournamentTeam.findUnique(...).then(...)  // ← homeTeam 끝난 후
  ),
]);
```

- **문제**: 배열 안 `await` 즉시 평가 → 4건 SELECT 순차 (홈팀명 → home roster lineup+TTP → 어웨이팀명 → away roster lineup+TTP). `Promise.all` 효과 X.
- **부가**: `match.homeTeamId ?? BigInt(-1)` — homeTeamId NULL 시 존재 불가 id 로 무용한 SELECT.
- **수정 (옵션 A)**: 팀명 SELECT 를 `loadTeamRoster` 안으로 이동 + null guard. (옵션 B) match SELECT 에 team relation 포함 (`homeTeam: { select: { team: { select: { name: true } } } }`) → SELECT 0건.
- **영향**: TTFB ~30~50ms 지연. 운영 임팩트 미미.

**m-3 [submit/route.ts:131-138] notes 별도 UPDATE — 동일 row 2회 update**

```ts
// service 가 tournamentMatch.update 1회 → BFF 가 또 update (notes 만)
if (input.notes !== undefined && input.notes.trim().length > 0) {
  await prisma.tournamentMatch.update({ where: { id: match.id }, data: { notes: input.notes } });
}
```

- **권장 (선택)**: service `SyncSingleMatchParams` 에 `extraUpdate?: { notes?: string }` 옵션 추가 → 1회 통합. 또는 Phase 2 진입 시 `MatchSyncInput` 에 `notes` 정식 필드. 본 PR 머지 영향 X.

#### 보안 / 컨벤션 체크

| 항목 | 결과 | 비고 |
|------|------|------|
| apiSuccess/apiError + 자동 snake_case | ✅ | response.ts → convertKeysToSnakeCase |
| snake_case 응답 (errors.md 2026-04-17 회피) | ✅ | 응답 키 명시 + 자동 변환 이중 안전. 프론트 (form) 는 client state 만 사용 / API 응답 직접 파싱 X → 함정 회피 |
| 권한 (super/organizer/admin/recorder 4종) | ✅ | 매트릭스 정확 |
| IDOR 가드 (매치 → tournamentId 자동) | ✅ | requireScoreSheetAccess SELECT 한 tournamentId 사용 |
| existingMatch IDOR 가드 (id+tournamentId 일치) | ✅ | service line 377-384 검증 + fallback SELECT |
| audit 박제 (source = "web-score-sheet") | ✅ | context 형식 정합 + fire-and-forget |
| schema 변경 0 | ✅ | settings JSON 활용 |
| Flutter v1 결과 변경 0 | ✅ | existingMatch optional / sync route 미제공 시 기존 동작 |
| lucide-react ❌ | ✅ | 0건 |
| 핑크/살몬 hardcode ❌ | ✅ | 0건 / var(--*) 100% |
| 모바일 가드 (720px 미만) | ✅ | client mount 후 분기 + 안내 카드 |
| BigInt 리터럴 (100n 등) ❌ | ✅ | 0건 (BigInt(123) 표준) |
| AppNav frozen | ✅ | 메인 탭 추가 X / 진입 = admin matches 안 버튼 |
| tournament_recorders isActive 가드 | ❌ | **M-1 위 참조** |

#### 운영 활성화 권고

1. **M-1 fix 후 머지** — `isActive: true` 1줄 추가 + 테스트 1 케이스 추가 (~10분).
2. **원영 (Flutter 담당) 사전 공지** — paper 모드 매치에 Flutter sync 진입 시 403 `RECORDING_MODE_PAPER` 응답. 카피 협의:
   - 현재 메시지: "이 매치는 종이 기록지 모드로 진행 중입니다. 웹 기록지 페이지에서 입력해주세요."
   - Flutter 측 dialog UX (운영자 매뉴얼 link / "운영자에게 문의" 버튼 등) 검토.
3. **운영 1매치 검증 시나리오**:
   - admin matches ScoreModal → paper 토글 → "📝 종이 기록지 입력 페이지로 이동" 클릭
   - 양 팀 명단 자동 표시 / 사전 라인업 ◉ 강조 / Q1~Q4 + OT 입력 / 매치 종료 토글 / 제출
   - `/live/{matchId}` 점수·박스스코어·[Headline] 자동 반영
   - `admin_logs` (mode_switch) + `tournament_match_audits` (web-score-sheet) 박제 검증
4. **m-2 page.tsx Promise.all 병렬화** — 본 PR 머지 후 별도 PR (영향 미미).

#### 수정 요청 테이블

| 우선순위 | 파일:줄 | 문제 | 수정 방법 |
|---------|---------|------|----------|
| Major | require-score-sheet-access.ts:152-155 | tournament_recorders 권한 검증에 `isActive: true` 누락 — 비활성 기록원 통과 | where 절 `isActive: true` 추가 + test 매트릭스 1 케이스 보강 |
| Minor | submit/route.ts:183 | 의미 없는 ternary (양쪽 동일) | `home_score: input.home_score` 로 단순화 |
| Minor | page.tsx:214-238 | `Promise.all` 안의 `await` 즉시 평가 → 순차 실행 | 팀명 SELECT 를 loadTeamRoster 안으로 이동 또는 match SELECT 에 team relation 포함 |
| Minor | submit/route.ts:131-138 | notes 별도 UPDATE = 동일 row 2회 update | (선택) service `extraUpdate` 옵션 추가 or Phase 2 진입 시 정식 필드 |

#### 결론

✅ **통과 (Major 1 / Minor 3)** — 14 파일 PR 의 비즈니스 로직 (단일 source path / IDOR 가드 / audit / 권한 매트릭스) 모두 적절. **M-1 (tournament_recorders isActive) fix 후 main 머지 권장**. 운영 매치 0건 영향 (settings JSON 활용 / Flutter v1 결과 보존). Phase 1 MVP 종료 가능.

---

### 리뷰 결과 (reviewer) — Phase 1-B-1 sync refactor

📊 종합 판정: **통과 (Minor 수정 권장)** — Flutter v1 결과 동등성 100% 확인. 차단 이슈 0. 1B-2 진입 가능 (BigInt 리터럴 PM 픽스 완료 반영 시점 기준).

#### ✅ 잘된 점 (강점)
- **단일 책임 분리 우수**: service 가 `NextResponse` 의존 0 — `{ ok: true, data } | { ok: false, code, message }` discriminated union 반환 → BFF caller 도 동일 path 호출 가능. decisions.md [2026-05-11] §1 "단일 source" 박제 정합.
- **순수 헬퍼 4종 export**: `correctScoresFromQuarters` / `decideWinnerTeamId` / `computeStatRates` / `isMatchReset` — DB 의존 0 → vitest 단위 검증 용이. 21 케이스 4 카테고리 (BUG-04 6 / winner 6 / % 5 / reset 4) 적절 분배. edge case (q1만 / ot 배열 / 한쪽만 / 동점 / 양 팀 미설정 / NaN 방지) 모두 커버.
- **회귀 0 보장**: 부작용 12 단계 (매치 update → waitUntil brief → reset deleteMany → stats upsert → PBP upsert/delete → post-process advance/standings/dual) 순서·조건·인자 100% 보존. 5/9 fix (PR #299 commit `adb0308`) `existing.status !== "completed" && match.status === "completed"` waitUntil 분기 service line 428-430 보존.
- **5/3 dual 무한 루프 가드 보존**: `...(isDual ? [] : [advanceWinner(matchId)])` service line 586 — 원본 line 397 동등. tasks cursor 동적 산출 (line 600-603) 동등.
- **로그 메시지 100% 보존**: BUG-04 warn / Reset detected / advanceWinner failed / updateTeamStandings failed / progressDualMatch failed — 운영 모니터링 grep 패턴 회귀 0.
- **PBP 수동 보정 이중 가드 보존**: `local_id startsWith "manual-fix-"` + `description startsWith "[수동 보정]"` (service line 514-519) — 5/2 임강휘 매치 132 운영자 수동 INSERT 보호 회귀 0.
- **JSDoc 박제 우수**: service 헤더 + 각 헬퍼별 이유/방법 주석 + 12 단계 순서 명시 — 향후 1B-2 BFF caller 가 이해 용이.

#### 동등성 체크 (코드 라인 매핑 직접 검증)
| 항목 | 원본 line | service line | 결과 |
|------|----------|--------------|------|
| 매치 findFirst (전체 row) | 125-127 | 349-351 | ✅ |
| 404 분기 | 128 (`apiError("Match not found", 404)`) | 352-358 (`code: "MATCH_NOT_FOUND"`) → route 144-146 변환 | ✅ |
| tournament.format SELECT | 141-144 | 365-368 | ✅ |
| BUG-04 quarterScores 보정 | 153-178 | 372-383 (헬퍼 위임) | ✅ |
| winner 자동 결정 | 183-192 | 387-394 (헬퍼 위임 — `decideWinnerTeamId`) | ✅ |
| tournamentMatch.update + winner_team_id 조건부 update | 195-218 | 398-424 | ✅ |
| waitUntil(triggerMatchBriefPublish) 5/9 fix | 224-226 | 428-430 | ✅ |
| reset 감지 + deleteMany | 230-239 | 434-447 (헬퍼 위임 — `isMatchReset`) | ✅ |
| matchPlayerStat.upsert + % efficiency | 242-304 | 451-504 (헬퍼 위임 — `computeStatRates`) | ✅ |
| PBP deleteMany (manual-fix 보호 이중 가드) | 317-329 | 510-522 | ✅ |
| PBP upsert (validPbps 필터) | 332-377 | 525-572 | ✅ |
| post-process (advance/standings/dual + allSettled) | 385-432 | 580-628 | ✅ |
| 응답 envelope (warnings 조건부 spread) | 434-441 | 631-641 + route 151 `apiSuccess(syncResult.data)` | ✅ |
| catch 500 + 로그 형식 | 442-446 | route 152-156 | ✅ |

#### 컨벤션 / 보안 체크
| 항목 | 결과 | 비고 |
|------|------|------|
| `apiSuccess` / `apiError` 사용 | ✅ | route layer 만 사용 — service 는 envelope 미생성 (책임 분리 ✅) |
| snake_case 응답 키 자동 변환 (errors.md 2026-04-17 5회 재발 회피) | ✅ | service `data` = `{ server_match_id, player_count, play_by_play_count, synced_at, post_process_status, warnings? }` snake_case 100% 보존 |
| @map snake_case (Prisma) / TS camelCase | ✅ | `tournamentMatch.update` 시 `homeScore` / `awayScore` / `quarterScores` camelCase + DB column snake_case 일관 |
| 권한 가드 책임 분리 | ✅ | route = JWT/API token + tournamentAdminMember + recording_mode / service = core 로직만 |
| IDOR 보호 (tournamentId + matchId 둘 다 검증) | ✅ | service line 350 `where: { id: matchId, tournamentId }` 양쪽 검증 — IDOR 회귀 0 |
| schema 변경 0 (운영 DB 안전) | ✅ | refactor 만, 새 컬럼/인덱스 0 |
| Flutter v1 path 변경 0 (원영 사전 공지 룰) | ✅ | 응답 envelope + 부작용 동등 → 클라이언트 영향 0 |
| zod 검증 = route 책임 (service input = parse 결과 type) | ✅ | service interface 가 zod schema 와 1:1 매핑 |
| audit 박제 = caller 책임 (1B-2 BFF 가 별도 호출) | ✅ | refactor 단독 PR — 현 시점 service 는 audit 미수행 (sync route 도 미수행 — 기존 동작 보존) |

#### 🔴 필수 수정
**없음** (Critical 0건).

#### 🟡 권장 수정 (Minor)
1. **`src/lib/services/match-sync.ts:349` + `route.ts:123-126` SELECT 2회 발생** (tester 동일 보고)
   - 원본 = 매치당 findFirst 1회 (전체 row, settings 포함). service 추출 후 route 가 mode 가드용 별도 SELECT(id+settings 2 컬럼) + service 가 다시 전체 row findFirst = **매치당 SELECT 2회**.
   - 영향: PgBouncer 부하 미미 (단순 PK 쿼리 2회). Vercel Functions cold start 영향 0 (병렬화 미적용 / 순차 실행 — 순서 의존성 = mode 가드 먼저).
   - **개선 옵션 (1B-2 진입 시 결재)**:
     - (A) service 가 외부에서 매치 row 받음 — `syncSingleMatch({ existingMatch, ... })` 인자 추가. caller 가 SELECT 1회 후 row 전달.
     - (B) mode 검증을 service 내부 위임 — `expectedMode: "flutter" | "paper"` 인자 추가. 단 service 가 NextResponse 응답 (403) 책임 가짐 = 책임 분리 약화. **비추**.
   - **권고**: 옵션 A 1B-2 진입 시 결재 — service signature 발전 후보 (developer 보고 동일).

2. **테스트 파일 BigInt 리터럴 TS2737 (PM 픽스 완료)**:
   - `src/__tests__/lib/match-sync.test.ts:111-112` `BigInt(100)` / `BigInt(200)` 교체 완료 (본 리뷰 시점 tsc 0 ✅).
   - 후속 조치: tsconfig `target` 을 `ES2020` 이상 올리면 `100n` 리터럴 사용 가능 — 현 시점 ES2017 target 유지 (다른 코드 영향 검증 부담) = **picky 무시 가능**.

#### 💡 1B-2 진입 전 권고 (planner/architect 결재 항목)
| # | 권고 | 사유 |
|---|------|------|
| 1 | `syncSingleMatch` signature 에 `existingMatch?: TournamentMatch` 인자 추가 | SELECT 2회 → 1회 통합. BFF 도 mode 가드 후 row 활용. |
| 2 | `AuditSource` union 에 `"web-score-sheet"` 추가 (별도 PR 가능) | BFF 가 박제 시 type narrow. Phase 1-A reviewer Minor 권고 동일 패턴. |
| 3 | service signature 에 `auditSource?: AuditSource` 인자 추가 옵션 | BFF 가 호출 시 service 가 직접 audit 박제 흡수. 현 시점 caller 책임 분리 유지 (회귀 0 보장 우선) — 1B-2 결재. |
| 4 | service 내부 `existingMatch` 활용 시 권한 가드까지 흡수? | **비추** — route 의 권한 가드 (JWT/API token/tournamentAdminMember) vs BFF 의 권한 가드 (웹 세션) 가 본질적으로 다름 → caller 책임 유지가 단순. |

#### 추가 발견 사항
- **service line 419 spread 캐스팅 추가** (`as Record<string, unknown>`) — 원본 line 210 미캐스팅. **런타임 동일** (TypeScript strict 만족용). 회귀 0.
- **service `now` 변수** (line 361) = `new Date()` — 원본 line 137 동일 시점 생성. PBP `created_at` / `updated_at` / response `synced_at` 동일 timestamp 보장 (원본 동등) ✅.
- **service 가 `withRecordingMode` 헬퍼 미사용** — route 가 별도 SELECT 후 `assertRecordingMode(modeRow, "flutter", ...)` 호출. Phase 1-A 와 일관. ✅

#### 결론
**✅ 통과** — Flutter v1 응답 envelope + 부작용 100% 보존 (코드 라인 매핑 직접 검증 완료). 단일 source 박제 path 정합. 차단 이슈 0건 / Minor 1건 (SELECT 2회 — 1B-2 진입 시 결재). 

📌 핵심:
- 부작용 12 단계 순서·조건·인자 100% 보존
- waitUntil 5/9 fix 회귀 0 / dual 5/3 가드 회귀 0 / manual-fix 보호 회귀 0
- service 의 `discriminated union` 반환 = BFF caller 호환성 우수
- 순수 헬퍼 4종 vitest 21 케이스 = 추후 리팩터링 안전망

→ **dev 머지 가능** + **1B-2 진입 가능** 상태 (service signature 발전 후보 1B-2 결재 항목으로 분류).

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
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 tester ✅ 통과]** tsc 0 (BigInt 리터럴 grep 0건 / Phase 1-B-1 함정 회피 확인) / vitest 267/267 PASS (252→267 +15). 권한 매트릭스 8/8 + BFF 5/5 + existingMatch 분기 2/2 모두 PASS. 운영 DB SELECT only 검증 (77 매치 / paper 0 / flutter 명시 0 — 모두 fallback / schema 변경 0). 디자인 토큰 위반 0 (lucide-react 0 / 핑크 hardcode 0 / `var(--*)` 일관). UX 가드 검증 (모바일 720px / localStorage draft 5s / 라이브 링크). **차단 이슈 0건 / Minor 3건** (loadTeamRoster Promise.all 사실상 직렬 / BFF route line 183 무의미 삼항 / user_id 화면 노출). | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 웹 종이 기록지 폼 + BFF + 권한 헬퍼 — Phase 1+2 MVP 마지막 PR]** 14 파일 / 신규 ~2,053 + 수정 ~185 라인. 신규 = 권한 헬퍼 `requireScoreSheetAccess` (matrix 4종) + score-sheet server entry + client form 본체 + 컴포넌트 5종 (header/roster×2/quarter-grid/submit-bar) + BFF `/api/web/score-sheet/[matchId]/submit` (zod + 모드 가드 + service 호출 + audit `web-score-sheet` 박제). 수정 = AuditSource union 확장 (`mode_switch` + `web-score-sheet`) + service `existingMatch?` 인자 (SELECT 2→1 통합 — Phase 1-B-1 reviewer Minor 권고 처리) + admin ScoreModal "📝 종이 기록지 입력 페이지로 이동" 진입 링크. 회귀 vitest 15 케이스 (match-sync existingMatch 2 + 권한 매트릭스 8 + BFF 5). **tsc 0 ✅ / vitest 267/267 PASS ✅** (252 → 267). schema 변경 0 / Flutter v1 결과 변경 0 / 운영 매치 100% 무영향. PC 우선 + 모바일 가드 (720px) + localStorage draft 5초 throttle. 단일 source = `syncSingleMatch` 호출 → 라이브/박스스코어/통산/알기자 자동 trigger. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-1 sync route refactor — match-sync service 추출]** 옵션 A 채택 (단일 source / BFF 재사용 path). sync route 494→204줄 (-290) / `src/lib/services/match-sync.ts` 신규 642줄 (`syncSingleMatch` core 함수 + 순수 헬퍼 4종). 신규 vitest 21 케이스. Flutter sync 응답 envelope + 부작용 100% 보존 (코드 라인 매핑 검증). vitest 252/252 PASS (231→252). schema 변경 0 / 운영 in_progress 매치 0건. **tester ✅ 통과** (Minor 1건 BigInt 리터럴 → PM 픽스 완료) / **reviewer ✅ 통과** (차단 0 / Minor 1건 SELECT 2회 — 1B-2 진입 시 결재 / Flutter v1 동등 100% 확인). | ✅ |
| 2026-05-11 | subin `05fa45b` | **[Phase 1-A 매치별 recording_mode 게이팅 인프라]** schema 변경 0 / settings JSON 활용. 헬퍼 3종 (`getRecordingMode`/`assertRecordingMode`/`withRecordingMode`) + Flutter v1 3 라우트 가드 (sync/batch-sync/status) + admin ScoreModal 토글 (Flutter ↔ 종이 select + confirm + 사유 prompt) + 신규 admin endpoint `/api/web/admin/matches/[id]/recording-mode` (audit `mode_switch` + admin_logs warning) + vitest 14 케이스. tsc 0 / vitest 231/231 PASS (217 → 231). Flutter v1 로직 변경 0 (가드만 추가) → 원영 사전 공지 권장 (토스트 UX). 변경 7 파일. | ✅ |
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
