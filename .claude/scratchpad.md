# 작업 스크래치패드

## 현재 작업
- **요청**: FIBA SCORESHEET Phase 2 — Running Score 1-160 + Period 자동 + Final + Winner
- **상태**: Phase 2 구현 완료 — tsc 0 / vitest 381/381 (+31)
- **모드**: no-stop

## 진행 현황표 (FIBA 양식 6 Phase)
| Phase | 범위 | 우선 | 상태 |
|------|------|------|------|
| 1 | `(score-sheet)` route group + minimal layout + 헤더 + 양 팀 명단 | ⭐⭐⭐ | ✅ |
| 2 | **Running Score 1-160 시계열 grid** + Period 자동 합산 + Final + Winner | ⭐⭐⭐ | ✅ |
| 3 | Team Fouls + Player Fouls (1-5) + 5반칙 alert + 5+ FT 안내 | ⭐⭐ | ⏳ |
| 4 | Time-outs (Team A/B + 전반2/후반3/연장1 검증) | ⭐⭐ | ⏳ |
| 5 | 서명 영역 (Scorer/Timer/Referee/Captain) + 매치 종료 토글 + 제출 | ⭐ | ⏳ |
| 6 | A4 세로 인쇄 PDF 출력 (jsPDF + html2canvas) | ⭐ | ⏳ |

## 기획설계 (planner-architect) — 종이 기록지 FIBA 양식 재기획 (2026-05-11)

🎯 목표: FIBA SCORESHEET 표준 양식 (1 페이지 A4 세로) 그대로 화면에 재현 + 태블릿 세로 모드 터치 입력 최적화 + 풀스크린 (사이트 헤더 제거).

### A. 현재 Phase 1 구현 재활용 매트릭스

| 자산 | 재사용 / 폐기 | 비고 |
|------|-----------|------|
| BFF `/api/web/score-sheet/[matchId]/submit` | ⭐ 재사용 | body schema 확장 (player_stats / play_by_plays / settings.* 추가) |
| service `syncSingleMatch` + `existingMatch` 패턴 | ⭐ 재사용 | player_stats / play_by_plays 인자 활용 (Running Score) |
| 권한 헬퍼 `requireScoreSheetAccess` | ⭐ 재사용 | 변경 0 |
| 사전 라인업 자동 import (`MatchLineupConfirmed` + TTP fallback) | ⭐ 재사용 | 변경 0 |
| 모드 게이팅 `getRecordingMode` / `assertRecordingMode` | ⭐ 재사용 | 변경 0 |
| audit `source="web-score-sheet"` | ⭐ 재사용 | context 확장 (running_score 박제 사유 포함) |
| `score-sheet-header.tsx` | 부분 재사용 | FIBA 양식 라벨 정합 (Competition/Date/Time/Game No/Place/Referee/Umpires) |
| `team-roster.tsx` | 부분 재사용 | FIBA Players 표 (Licence/이름/No/Player in/Fouls 1-5) 로 재설계 |
| `quarter-score-grid.tsx` | ❌ 폐기 | Running Score 자동 합산으로 대체. Period Score 는 자동 계산 표시만 |
| `submit-bar.tsx` | 부분 재사용 | FIBA 룰 검증 확장 (5반칙 / Team fouls 5+ FT / 동점 OT 룰) |
| `score-sheet-form.tsx` | 전면 재설계 | FIBA 1 페이지 레이아웃 그대로 (좌 명단/팀파울/타임아웃 + 우 Running Score + 하 서명) |
| 22 stat 표 (기존 기획 Phase 2) | ❌ 폐기 | FIBA 표준 X / 자동 집계 영역 (PBP 로부터) |
| localStorage draft (5초 throttle) | ⭐ 재사용 | key prefix 그대로 |
| 모바일 가드 (720px 미만) | 변경 | "세로 모드로 회전해주세요" 가이드 화면으로 재설계 |

### B. 신규 페이지 구조

#### URL / Layout
- **route group 변경**: `(web)/score-sheet/` → `(score-sheet)/score-sheet/`
- `src/app/(score-sheet)/layout.tsx` — **minimal layout** 신규 (사이트 헤더 제거 / 풀스크린 viewport / 다크모드 토글만)
- `src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` — 기존 page.tsx 이전 + 재사용
- 진입 방법:
  - admin matches → ScoreModal → "📝 종이 기록지 입력 페이지로 이동" Link (기존 유지)
  - tournament-admin → 매치 detail → 동일 Link (기존 유지)
  - 직접 URL `/score-sheet/{matchId}`

#### 컴포넌트 트리 (FIBA 양식 1 페이지 A4 세로 재현)

```
ScoreSheetPage (server / 기존 page.tsx 이전)
└─ ScoreSheetForm (client / 전면 재설계 — FIBA 1 페이지 레이아웃)
   ├─ FibaHeader               상단 1/5 — FIBA 로고 / SCORESHEET 타이틀
   │  ├─ Team A·B 이름
   │  ├─ Competition / Date / Time / Game No / Place
   │  └─ Referee / Umpire 1·2 (입력)
   ├─ LeftColumn (좌 50% / 세로 2등분 — Team A 상 / Team B 하)
   │  ├─ TeamSection (Team A)
   │  │  ├─ TimeoutsBox (5칸 ✕ 표시 / 1탭 마킹)
   │  │  ├─ TeamFoulsBox (Period ①~④ × 1-2-3-4 + Extra)
   │  │  ├─ PlayersTable (12명 × Licence/이름/No/Player in/Fouls 1-5)
   │  │  └─ CoachInput (Coach / Asst Coach 텍스트)
   │  └─ TeamSection (Team B)  ← 동일 구조
   ├─ RightColumn (우 50% / 세로 전체)
   │  ├─ RunningScoreGrid (1-160 시계열 / 4 세트 × A|B 컬럼) ⭐ 핵심
   │  ├─ PeriodScoresSection (Period ①~④ + Extra periods — A/B 자동 합산)
   │  └─ FinalScoreSection (Team A / Team B / Name of winning team — 자동)
   └─ FooterSignatures (하단 5/5)
      └─ Scorer / Assistant scorer / Timer / Shot clock operator / Referee / Umpire 1·2 / Captain — 텍스트 입력
```

#### 태블릿 세로 모드 디자인 (768×1024 ~ 810×1080)

- viewport meta: `width=device-width, initial-scale=1, maximum-scale=1` (zoom 차단)
- A4 세로 비율 정합 (1:1.414) — viewport 가로 768 → 세로 1086 까지 자연
- 가로 모드 진입 시 → 회전 가이드 ("세로 모드로 회전해주세요" 아이콘 + 안내)
- 터치 영역 모두 44px+ (FIBA 양식 칸 크기 압축이라 별도 큰 버튼은 modal 형태로 보완 검토)
- 1탭 입력 패턴:
  - Running Score 칸 = 1탭 → 점수 자동 증가 (long press → 수정 모달)
  - Player Fouls 1-5 = 1탭 → 마킹 / 5번째 = 빨강 강조 (5반칙 퇴장)
  - Team Fouls 1-2-3-4 = 1탭 → 마킹 / 5번째부터 자유투 안내
  - Time-outs = 1탭 → ✕ 마킹
- 다크모드 토글 = layout 우상단 (사이트 헤더 없는 대체)
- "← 매치 관리로 돌아가기" 링크 = layout 좌상단

### C. 신규 Phase 분해 (6 단계)

| Phase | 범위 (산출물) | PR | 우선 | 추정 LOC |
|-------|-------------|----|-----|---------|
| 1 | `(score-sheet)` route group + minimal layout + FibaHeader + LeftColumn TeamSection 좌측 (PlayersTable + CoachInput / Timeouts·TeamFouls 는 빈 박스) | 1 | ⭐⭐⭐ | +400 |
| **2** | **RunningScoreGrid 1-160 시계열 입력 grid + Period 자동 합산 + Final + Winner** + BFF body schema 확장 (play_by_plays score event) + service 호출 | 1 | ⭐⭐⭐ | +600 |
| 3 | Team Fouls (Period 별 1-2-3-4 + Extra) + Player Fouls (1-5 토글 마킹) + 5반칙 자동 표시 + 5+ FT alert + BFF body schema 확장 (play_by_plays foul event 또는 settings.*) | 1 | ⭐⭐ | +400 |
| 4 | Time-outs (Team A/B 5칸 + 전반2/후반3/연장1 검증) + settings.timeouts JSON 박제 | 1 | ⭐⭐ | +200 |
| 5 | 서명 영역 (Scorer/Timer/Referee/Captain) + 매치 종료 토글 + 최종 제출 + settings.signatures JSON | 1 | ⭐ | +200 |
| 6 | A4 세로 인쇄 PDF (jsPDF + html2canvas / 양식 1 페이지 그대로 재현) | 1 | ⭐ | +300 |

총 6 PR / 약 2.5~3주.

### D. 데이터 모델 매핑 (FIBA 양식 → DB)

| FIBA 영역 | DB 위치 | 신규/기존 | 비고 |
|----------|---------|----------|-----|
| 헤더 (Comp/Date/Time/Game/Place) | Tournament + TournamentMatch (SELECT) | 기존 | 자동 fill (display only) |
| **Referee / Umpire 1·2** | `match.settings.officials` JSON (referee_main / umpire_1 / umpire_2) | 신규 키 | 입력 박제 |
| Team A·B 명단 | `TournamentTeamPlayer` + `MatchLineupConfirmed` | 기존 | 사전 라인업 자동 |
| Players Licence | `tournamentTeamPlayer.licence_no` (확인 — 미존재 시 신규 컬럼) | **결재 §3** | 미존재 시 settings.licences JSON 매핑 |
| **Coach / Asst Coach** | `tournament_team.coach_name` / `asst_coach_name` (확인) | **결재 §3** | 미존재 시 match.settings.coaches JSON |
| **Running Score (시계열)** | `play_by_plays` (event_type="score" + sequence + score_value + scoring_team) | **결재 §1** | 옵션 a: PBP / 옵션 b: 별도 테이블 / 옵션 c: settings.running_score JSON |
| Team Fouls (Period 별 1-4 + Extra) | (옵션) PBP foul event 자동 집계 / settings.team_fouls JSON | **결재 §2** | a: 자동 집계 / b: 수동 입력 박스 |
| Player Fouls 1-5 마킹 | (옵션) PBP foul event (player_id 별 카운트) / settings.player_fouls JSON | **결재 §2** | a: 자동 / b: 수동 |
| Time-outs (Team A/B) | `match.settings.timeouts` JSON `{home: [...], away: [...]}` | 신규 키 | period 정보 박제 (전반/후반/연장) |
| **Period Scores ①~④** | `match.quarterScores` JSON (기존 활용) | 기존 | Running Score 로부터 자동 계산 → 표시만 |
| **Final Score + Winner** | `match.homeScore` / `awayScore` / `winner_team_id` | 기존 | service 자동 처리 |
| **서명 영역** | `match.settings.signatures` JSON (scorer/asst_scorer/timer/shot_clock_op/referee/umpire1/umpire2/captain_a/captain_b) | 신규 키 | 텍스트 박제 (Phase 6 캡션 PDF 서명 capture 확장 가능) |

### E. 핵심 기술 결정 (decisions.md 후보)

#### E-1. Running Score 데이터 모델 — `play_by_plays` 채택 권장

| 옵션 | 장점 | 단점 |
|------|------|------|
| **a. play_by_plays (event_type="score" + sequence)** ⭐ | (1) 시계열 박제 정합 / (2) Flutter 기록앱 PBP 와 단일 source / (3) Phase 1-B-1 service paper-fix-{uuid} prefix + `[종이 기록]` description 보호 룰 그대로 활용 / (4) 통산 stat 자동 집계 (made/attempted 자동 산출) | (1) 1-160 개 row × 매치 = DB 부하 (수십만 row / 1만 매치) — 대회 단위 group 으로 충분 / (2) Phase 1-B-1 service 의 PBP UPDATE 정책 재확인 필요 |
| b. 별도 `running_scores` 테이블 (seq / team / value) | (1) 도메인 분리 / (2) PBP 와 격리 | (1) 신규 schema 변경 → migration 위험 / (2) PBP 와 이중 박제 (made shot 양쪽 분리) |
| c. settings.running_score JSON | (1) schema 0 / (2) 빠른 박제 | (1) 시계열 쿼리 부적합 / (2) 통산 stat 자동 집계 불가 / (3) JSON 사이즈 (1-160 entries × 메타) — settings 의 80% 점유 |

→ 권장: **a (play_by_plays)** — Phase 1-B-1 보호 룰 + Flutter sync 단일 source 정합.

#### E-2. Team Fouls + Player Fouls 입력 방식 — 자동 집계 권장

| 옵션 | 장점 | 단점 |
|------|------|------|
| **a. PBP foul event 자동 집계 (입력 ⇄ 표시 같은 source)** ⭐ | (1) 단일 source (made shot 과 동일 패턴) / (2) 5반칙 자동 마킹 / (3) Team fouls 5+ FT 자동 안내 | (1) 입력 시점 = 1탭 마킹 → 즉시 PBP row 박제 (서버 트립 vs 클라이언트 batch 결정) |
| b. settings.fouls JSON 직접 박제 (PBP 미생성) | (1) JSON 단순 / (2) 클라이언트 로직 단순 | (1) PBP 와 이중 박제 / (2) 자동 집계 불가 / (3) 통산 stat 누락 |

→ 권장: **a (자동 집계)** — 클라이언트 batch 박제 + 제출 1회 sync (BFF 가 PBP foul event 일괄 INSERT). 5반칙/Team fouls 5+ 검증은 클라이언트가 commit 시점에 합산 → alert.

#### E-3. Coach / Asst Coach + Licence DB — 결재 사항

기존 `tournament_team` 모델 확인 필요:
- 옵션 a: `tournament_team.coach_name` / `asst_coach_name` 컬럼 신설 (migration)
- 옵션 b: `match.settings.coaches` JSON `{home_coach, home_asst, away_coach, away_asst}` (schema 0)

→ Phase 1 진입 전 사용자 결재 (§E §3 참조).

#### E-4. route group `(score-sheet)` minimal layout 디자인

```
<html>
  <body className={pretendard.variable + spaceGrotesk.variable + "fullscreen-paper"}>
    <header className="paper-header-minimal">
      <Link href="/tournament-admin/...">← 매치 관리로</Link>
      <span>📝 종이 기록지</span>
      <DarkModeToggle />  {/* 다크모드 토글만 */}
    </header>
    <main>{children}</main>
  </body>
</html>
```

- 사이트 AppNav 제거 (route group `(web)` 와 격리)
- 풀스크린 (헤더만 44px 높이 / 본문 = viewport - 44)
- A4 세로 비율 정합 (max-width: 100% / aspect-ratio: 1/1.414)
- 다크모드 = 양식 자체는 light (FIBA 종이 양식 흰색 베이스) / 다크모드는 운영자 환경 선호도 (양식 색 invert 옵션 별도 검토)

#### E-5. 모바일 가드 (가로 vs 세로)

- 결재 §7 — 옵션 a (가로 진입 시 회전 가이드) / 옵션 b (가로/세로 둘 다 — 가로는 단순 align 조정) / 옵션 c (세로 strict)
- 권장: **a (회전 가이드)** — 가로는 책상 위 양식 자연이지만 컴포넌트 트리 2배 작업. Phase 6 후 검토.

### F. 사용자 결재 사항 (developer 진입 전) — 7건

| # | 사항 | 옵션 | 권장 |
|---|------|------|------|
| **§1** | Running Score 데이터 모델 | (a) play_by_plays / (b) 별도 테이블 / (c) settings JSON | **(a)** play_by_plays |
| **§2** | Team Fouls / Player Fouls 입력 | (a) 자동 집계 (PBP foul event) / (b) 수동 입력 박스 (settings JSON) | **(a)** 자동 집계 |
| **§3** | Coach/Asst + Licence DB | (a) tournament_team 컬럼 신설 / (b) match.settings.coaches JSON | **(b)** settings JSON (schema 0 위험 ↓) |
| **§4** | 서명 영역 | (a) 입력 텍스트만 / (b) Phase 6 PDF + 캡션 서명 capture 확장 | **(a)** 텍스트 (Phase 6 후 확장) |
| **§5** | Phase 1 진입 범위 | (a) 신규 Phase 1 (route group + layout + 헤더 + 명단) / (b) Phase 1+2 통합 (Running Score 포함 1 PR) | **(a)** 분리 (PR 단위 작게) |
| **§6** | 현재 `(web)/score-sheet` 처리 | (a) 폐기 (route group 이동) / (b) 별도 alias 유지 (구 URL 호환) | **(a)** 폐기 (운영 0 사용 / admin link 만 갱신) |
| **§7** | 가로 모드 대응 | (a) 회전 가이드 화면 / (b) 가로/세로 둘 다 / (c) 세로 strict | **(a)** 회전 가이드 |

### G. 위험 / 미해결

1. **Running Score PBP 박제** — Phase 1-B-1 service 의 PBP manual-fix 보호 룰 (`paper-fix-{uuid}` prefix + `[종이 기록]` description) 적용 → Flutter sync 시 자동 삭제 보호. 본 turn 결정 결재 §1 (a) 채택 시 service 가 score event 1-160 INSERT 시 동일 룰 자동 적용 확인 필요.
2. **5x5 vs 3x3 정합** — FIBA 5x5 양식 기준 (현 turn). 3x3 양식 (간소화) 은 별도 Phase 후속.
3. **Coach / Asst DB 모델 부재** — 결재 §3 (b) 채택 시 settings JSON 으로 우회 (schema 변경 0).
4. **가로 모드 대응** — 결재 §7 (a) 회전 가이드 채택 시 가로 진입 사용자 안내만. Phase 6 후 가로 양식 별도 검토.
5. **인쇄 PDF (Phase 6)** — 세로 A4 양식 정확 재현 (jsPDF + html2canvas) — 한글 폰트 박제 + 양식 픽셀 정합 위험.
6. **태블릿 768px Running Score 1-160 그리드** — A4 우측 절반 ~ 380px 안에 4 세트 × A|B 컬럼 × 40 row 박제. 폰트 ~10px / 칸 폭 ~24px / 칸 높이 ~16px 추정. 실제 사용 검증 필요 (Phase 2 prototype 후).
7. **localStorage draft → DB 박제 충돌** — 단말 2 개에서 동일 매치 진행 시 마지막 박제가 덮어쓰기. mode 게이팅 + status="in_progress" 차단으로 자체 차단되나 **운영자가 2 단말 동시 사용 시** 경고 안내 필요.

### H. 실행 계획 (developer 위임 — 결재 §5 (a) 가정)

| 순서 | 작업 | 담당 | 선행 조건 | 추정 시간 |
|------|------|------|----------|----------|
| 1 | `(score-sheet)` route group 신설 + minimal layout (다크모드 토글 / "← 매치 관리로" 링크) | developer | 결재 §6 (a) 확정 | 2h |
| 2 | 기존 `(web)/score-sheet/[matchId]/page.tsx` → `(score-sheet)/score-sheet/[matchId]/page.tsx` 이전 + admin link 갱신 | developer | 1 완료 | 1h |
| 3 | FibaHeader 컴포넌트 — Competition/Date/Time/Game No/Place (display) + Referee/Umpires (입력) | developer | 2 완료 | 3h |
| 4 | LeftColumn TeamSection — PlayersTable (FIBA 12명 양식: Licence/이름/No/Player in/Fouls 1-5 빈 박스) + CoachInput | developer | 2 완료 (병렬 3) | 3h |
| 5 | 회전 가이드 화면 (모바일 가로 진입 차단) | developer | 1 완료 | 1h |
| 6 | tsc + vitest (회귀 0 확인) | tester | 1~5 완료 | 1h |
| 7 | 디자인 검수 (BDR 13 룰 / 다크모드 / 토큰) | reviewer (병렬 6) | 1~5 완료 | 1h |

총 Phase 1 = 약 12시간 / 1.5일.

### I. 위반 자동 검수 (Phase 1 진입 전)

- ❌ AppNav 영향 (메인 9 탭 변경) — Phase 1 은 영향 0 (route group 격리)
- ❌ 신규 DB 컬럼 (schema 변경) — 결재 §3 (b) 채택 시 0
- ❌ `--color-primary` hardcode — globals.css 토큰만 사용
- ❌ lucide-react / 핑크/살몬/코랄 — Material Symbols Outlined 만
- ❌ pill 9999px — 정사각형 50% 회피 (FIBA 양식 사각형 / 박스 4px radius)

### J. 보고 형식 (PM 카피용)

- 현재 Phase 1 재활용 매트릭스 (12 자산 중 9 재사용 / 2 폐기 / 1 부분 재사용)
- 신규 Phase 분해 6 단계 (Running Score 우선 ⭐⭐⭐)
- 컴포넌트 트리 (FIBA 1 페이지 A4 세로 그대로)
- 데이터 모델 매핑 12 영역
- 핵심 기술 결정 5건 (§E-1 ~ §E-5)
- 사용자 결재 사항 7건 (§F)
- 위험 / 미해결 7건 (§G)
- 실행 계획 7 단계 / 약 1.5일 (Phase 1 만)

## 구현 기록 (developer) — FIBA 양식 종이 기록지 Phase 1

📝 구현 범위: `(score-sheet)` route group 신설 + minimal layout (다크모드 토글 + "← 매치 관리로" 링크 + RotationGuard) + FibaHeader (FIBA 양식 상단 자동 fill + 심판 3 입력) + LeftColumn TeamSection (Players 12 행 표 + Coach·Asst Coach 입력 + Time-outs/Team fouls placeholder) + 회전 가이드 + ScoreSheetForm 골조 + 기존 `(web)/score-sheet/` 디렉토리 폐기.

### 변경 파일
| 파일 | 변경 | LOC | 신규/수정 |
|------|------|-----|----------|
| `src/app/(score-sheet)/layout.tsx` | minimal layout (thin header + RotationGuard) | +52 | 신규 |
| `src/app/(score-sheet)/_components/rotation-guard.tsx` | matchMedia orientation + touch 감지 | +85 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` | server entry — 기존 loadTeamRoster + recording-mode 가드 재사용 | +213 | 신규 (이전) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | FIBA 양식 상단 (로고/Team A·B/Competition/Date/Time/Game No/Place/Referee/Umpire1·2) + splitDateTime 유틸 | +218 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | TeamSection (Time-outs 5 placeholder + Team fouls Period 1~4 placeholder + Players 12 행 표 + Coach·Asst Coach 입력) + fillRowsTo12 유틸 | +355 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section-types.ts` | RosterItem / TeamRosterData 공유 타입 (server/client 양쪽 import) | +25 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | client form 본체 (Phase 1 골조 — header + LeftColumn 만 / Phase 2~6 placeholder) + localStorage draft 5초 throttle | +143 | 신규 |
| `src/app/(web)/score-sheet/` (6 파일 전체) | 디렉토리 폐기 (page.tsx + _components × 5) | -1100 | 삭제 |
| `src/__tests__/score-sheet/fiba-header-split-datetime.test.ts` | splitDateTime 5 케이스 | +50 | 신규 |
| `src/__tests__/score-sheet/team-section-fill-rows.test.ts` | fillRowsTo12 4 케이스 | +60 | 신규 |

### route group 이전 영향
- URL = `/score-sheet/{matchId}` **동일** (route group 은 URL 미반영)
- admin link (`src/app/(admin)/tournament-admin/tournaments/[id]/matches/page.tsx` L356) **변경 0** (`target="_blank"` 이미 적용)
- 폐기 컴포넌트: `quarter-score-grid.tsx` (Phase 2 RunningScoreGrid 가 대체) / `team-roster.tsx` (FIBA PlayersTable 로 재설계) / `score-sheet-header.tsx` (FibaHeader 로 재설계) / `submit-bar.tsx` (Phase 5 부활 예정) / 기존 `score-sheet-form.tsx` (전면 재설계)
- BFF route `/api/web/score-sheet/{matchId}/submit` **그대로 살아있음** (Phase 1 = UI 만 — Phase 5 BFF body schema 확장 시 활용)
- 권한 헬퍼 `requireScoreSheetAccess` / mode 가드 `getRecordingMode` / 사전 라인업 loadTeamRoster 패턴 **변경 0** (page.tsx 이전 + 재사용)

### FibaHeader / TeamSection 핵심 UX
- **터치 영역 44px+**: Player in 체크박스 = `h-9 w-9` label wrapping + `touchAction: manipulation`
- **FIBA 양식 정합**: 입력 = border-bottom only (underscore) / 라벨 = ALL CAPS + tracking-wider / 자동 fill 값 = border-bottom 표시
- **로고**: BDR 자체 로고 (`/images/logo.png`) + Material Symbols `sports_basketball` 보조 — FIBA 로고 라이선스 회피
- **12 행 강제**: `fillRowsTo12()` — 명단 5명 = 5 player + 7 null / 12명 = 그대로 / 15명 = 그대로 (운영 안정성 — 잘라내지 X)
- **starter ◉ + captain ★ 표시 유지**: 기존 team-roster.tsx 패턴 재사용

### 회전 가이드 동작
- `matchMedia("(orientation: landscape)") && matchMedia("(hover: none) and (pointer: coarse)")` 동시 충족 시 풀스크린 안내
- PC (touch X) 가로 모드 = 통과 (pointer coarse X)
- Material Symbols `screen_rotation` + "종이 기록지는 세로 모드에서 사용해주세요"

### 검증 결과
- **tsc**: 0 에러 ✅
- **vitest**: 28 files / **350 tests PASS** (이전 341 + 신규 9 = +9 / 회귀 0)
  - 신규 9 케이스: splitDateTime 5 + fillRowsTo12 4
  - 기존 score-sheet-submit BFF 5 케이스 회귀 0 ✅
- **grep 회귀 0**:
  - `BigInt(N)n` 패턴 0건 ✅
  - `lucide-react` import 0건 (주석 3건은 룰 명시) ✅
  - 핑크/살몬/코랄 hardcode 0건 ✅
  - `text-[var(--color-primary)]` 본문 0건 ✅
- **schema 변경**: 0 ✅
- **Flutter v1 영향**: 0 ✅
- **API / BFF 시그니처**: 0 변경 ✅
- **AppNav frozen**: 0 영향 (route group 격리) ✅

### 다음 단계 (Phase 2 진입 전 검토)
- Phase 2 = **RunningScoreGrid (1-160 시계열)** + Period 자동 합산 + Final + Winner + BFF body schema 확장 (play_by_plays score event) — 약 +600 LOC / 별도 PR 권장
- Phase 1 만 PR 분리 = 검증 안전 (사용자 결재 §5 (a))

💡 tester 참고:
- **테스트 방법**:
  1. admin matches 페이지에서 매치 mode = paper 전환 → "📝 종이 기록지 입력 페이지로 이동" 클릭 → 새 탭
  2. URL = `/score-sheet/{matchId}` 진입 시 minimal layout (사이트 헤더 0 / 다크모드 토글 우상단 / "← 매치 관리로" 좌상단)
  3. FibaHeader = Team A/B 명 + 대회/날짜/시간/Game No/Place 자동 fill / Referee·Umpire 1·2 입력
  4. TeamSection 양쪽 = Players 12 행 (Licence 입력 + Player in 체크 + Coach·Asst Coach 입력)
  5. 태블릿 가로 회전 → "종이 기록지는 세로 모드에서 사용해주세요" 안내
  6. localStorage draft = 5초 후 자동 저장 / 페이지 reload → 입력 복원
- **정상 동작**:
  - mode=flutter 매치 진입 = "현재 Flutter 기록앱으로 진행 중" 안내 (라이브/운영자 페이지 링크)
  - 비로그인 / 권한 없음 = "접근할 수 없습니다" 에러 카드
  - 매치 없음 (잘못된 matchId) = `/` redirect
- **주의할 입력**:
  - Licence 입력 = 20자 제한 / Coach = 40자 제한 / Referee = 40자 제한
  - Player in 체크 = 큰 터치 영역 (44px+) — 행 클릭 시에도 동작
  - 다크모드 토글 = ThemeToggle 재사용 (사이트 헤더와 동일 동작)

⚠️ reviewer 참고:
- **route group 격리 검증**: `(score-sheet)` 안 import 가 `@/components/bdr-v2/app-nav` 또는 AppNav 관련 호출 0 확인 필요
- **FIBA 양식 정합**: 디자인 13 룰 §C / 02-design-system-tokens.md (var(--*) 토큰 / Material Symbols / 핑크 ❌) 모두 준수
- **터치 영역 44px+**: Player in 체크박스 (룰 13)
- **빨강 본문 텍스트 ❌**: 강조는 `var(--color-accent)` (starter ◉) / 캡틴 ★ = `var(--color-warning)` (기존 패턴 유지)
- **Phase 2 진입 시 RunningScoreGrid 768px 안 4 세트 × A|B × 40 row 박제 가능성 검증** (위험 §G §6 — 실제 prototype 후 확정)

## 구현 기록 (developer) — FIBA 양식 Phase 2 Running Score (2026-05-12)

📝 구현 범위: RunningScoreGrid (4 세트 × A|B × 40 row = 1-160) + PlayerSelectModal (풀스크린 12명 큰 버튼) + PeriodScoresSection (Q1~Q4 + OT 자동 합산 + Final + Winner) + ScoreSheetForm 2 컬럼 통합 + BFF body schema 확장 (running_score → PaperPBPInput[] 변환 → service play_by_plays 박제). 사용자 결재 4건 모두 구현.

### prototype 검증 결과 (768×1024 viewport)
- **칸 크기**: 컨테이너 384px ÷ 8 컬럼 = 48px 폭 × 16px 높이 (FIBA A4 정합)
- **터치 룰 44px+ 위반 회피**: 칸 자체는 작지만 1탭 → PlayerSelectModal 풀스크린 (60px+ 선수 큰 버튼) — 사용자 결재 §1 (b)
- **글꼴**: 빈 칸 9px (위치 번호) / 마킹 칸 8px (등번호 ●N) — 가독성 한계
- **채택 옵션**: 모달 + 칸 작게 (FIBA 양식 시각 정합 우선 + 터치는 모달로 보완)
- **마킹 시각**: 1점=● / 2점=◉ / 3점=◎ + 등번호 (점수 종류 자동 구분)
- **마지막 마킹 강조**: accent 25% mix 음영 — 1탭 = 해제 confirm

### 변경 파일
| 파일 | 변경 | LOC | 신규/수정 |
|------|------|-----|----------|
| `src/lib/score-sheet/running-score-types.ts` | ScoreMark / RunningScoreState / FinalScore / PeriodScoreLine 공유 타입 | +62 | 신규 |
| `src/lib/score-sheet/running-score-helpers.ts` | inferPoints / isValidMarkPosition / sumByPeriod / computeFinalScore / toQuarterScoresJson / marksToPaperPBPInputs / addMark / undoLastMark | +260 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/running-score-grid.tsx` | RunningScoreGrid (4 세트 × A\|B 컬럼 × 40 row + 빈/마킹/마지막 분기 셀) | +290 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/player-select-modal.tsx` | 풀스크린 모달 (12명 큰 버튼 grid + 점수 종류 안내 + ESC/외부 클릭 닫기) | +168 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/period-scores-section.tsx` | Period 표 (Q1~Q4 + OT 자동) + Final Score + Winner (그린/tie warning) + Period 진행 버튼 | +205 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | Phase 2 통합 (md+ 2 컬럼 / draft 에 runningScore 추가 / Period 진행 핸들러) | +60 | 수정 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | body schema `running_score` 추가 + PaperPBP → PlayByPlayInput 변환 + service play_by_plays 박제 | +85 | 수정 |
| `src/__tests__/score-sheet/running-score-helpers.test.ts` | 31 케이스 (점수 추론 / 유효성 / 합산 / final / quarter JSON / PBP 변환 / addMark / undoLastMark) | +280 | 신규 |

### 점수 자동 추론 알고리즘 정합 검증
- **1점/2점/3점 추론**: `position - lastPosition` = points (vitest 7 케이스)
- **음수 차단**: lastPosition 보다 작으면 `{ok: false, "이전 마킹 이후 칸을 선택해주세요"}` (vitest 1)
- **4+ 차단**: diff > 3 면 `{ok: false, "한 번에 N점 득점 불가"}` (vitest 1)
- **range 초과**: position > 160 차단 (vitest 1)
- **마지막 1탭 해제**: `undoLastMark` pop + window.confirm UX (vitest 2 + UI 통합)

### PBP 박제 룰 (BFF → service)
- **local_id**: `paper-fix-{uuid}` — service 의 manual-fix prefix 와 분리 (종이 기록 식별자)
- **description**: `[종이 기록] N점 득점` — Flutter sync 시 자동 삭제 보호 가능 (현 service 룰: manual-fix prefix 만 보호 / paper-fix-* 는 incoming local_id 에 포함되어 살아남으므로 OK)
- **mode 게이팅 의존**: 같은 매치에 Flutter sync + 종이 기록지 BFF 동시 호출 불가 — `recording_mode=paper` 매치는 Flutter API 가 403
- **action_type**: `shot_made` / **action_subtype**: `1pt` / `2pt` / `3pt`
- **home_score_at_time / away_score_at_time**: 시간순 정렬 후 누적 (vitest 검증)
- **idempotent**: 매번 전체 running_score 전송 → service deleteMany NOT IN (incoming local_id) → 마지막 마킹 해제도 자동 반영

### Period 자동 합산
- `sumByPeriod`: Period 1~4 항상 표시 (마킹 0이라도) + OT 마킹 시 5+ 추가
- `toQuarterScoresJson`: DB `match.quarterScores` 형식 변환 (Flutter sync 호환 — 현 turn 미사용 / Phase 5 BFF 활성화 시 활용)
- `computeFinalScore`: 마지막 마킹 position = 팀 총점 / 동점 = "tie" + warning / 차이 = "home"/"away" winner

### 검증 결과
- **tsc**: 0 에러 ✅
- **vitest**: 29 files / **381 tests PASS** (이전 350 + 신규 31 = +31 / 회귀 0)
  - 신규 31: inferPoints 7 + isValidMarkPosition 7 + sumByPeriod 3 + computeFinalScore 4 + toQuarterScoresJson 1 + addMark/undoLastMark 4 + marksToPaperPBPInputs 5
  - 기존 score-sheet-submit BFF 5 케이스 회귀 0 ✅ (running_score optional 호환)
- **grep 회귀 0**:
  - `BigInt(N)n` 패턴 0건 ✅
  - `lucide-react` import 0건 ✅
  - 핑크/살몬/코랄 hardcode 0건 ✅
  - `text-[var(--color-primary)]` 본문 0건 ✅
- **schema 변경**: 0 ✅
- **Flutter v1 영향**: 0 ✅
- **API / BFF 시그니처**: BFF body 확장만 (`running_score` optional) — 기존 호출처 회귀 0 ✅
- **AppNav frozen**: 0 영향 ✅

### 다음 단계 (Phase 3 진입 전 검토)
- Phase 3 = Team Fouls (Period 별 1-4 + Extra) + Player Fouls (1-5 토글) + 5반칙 alert + 5+ FT 안내 + BFF body 확장 (PBP foul event)
- Phase 2 만 별도 PR 권장 (LOC +1400 — 검증 안전)

💡 tester 참고:
- **테스트 방법**:
  1. admin matches → mode=paper 매치 → `/score-sheet/{matchId}` 진입 (Phase 1 동일 진입 흐름)
  2. 우측 (md+ viewport) 또는 하단 (md 미만) Running Score 4 세트 × A\|B 그리드 노출 (각 세트 40 row)
  3. 빈 칸 1탭 → 풀스크린 모달 → 12명 큰 버튼 (등번호 강조) → 선수 선택 → 칸에 ● + 등번호 마킹
  4. 점수 자동 추론: 이전 마킹 칸 5번 → 8번 클릭 = "3점 (3점슛)" 라벨 모달 헤더
  5. 마지막 마킹 칸 다시 탭 → confirm → 해제 (PBP 도 자동 제거)
  6. Period 진행: PeriodScoresSection 좌우 chevron 버튼 → currentPeriod 변경 → 새 마킹은 변경된 period 로 박제
  7. Final Score = 마지막 마킹 position 자동 / Winner 자동 결정 (동점 시 "⚠ 동점 — 연장 필요")
  8. localStorage draft = runningScore 포함 5초 throttle → reload 후 복원
- **정상 동작**:
  - 4+점 차단: 마지막 마킹 5 → 10 클릭 시 "한 번에 5점 득점 불가" alert
  - 역행 차단: 마지막 마킹 10 → 5 클릭 시 "이전 마킹 이후 칸을 선택해주세요" alert
  - 마킹된 칸 (마지막 X) 탭 시 "이미 마킹된 칸 — 마지막부터 차례로 해제" 안내
- **주의할 입력**:
  - 1점 (자유투) — Phase 3 자유투 기록 통합 전 우선 made shot 으로 박제
  - Period 7 (OT3) 초과 차단 — 현 룰 5x5 OT 최대 4까지 허용 (period 5~7 = OT1~OT3)
  - 양 팀 같은 period 마킹 시 home_score_at_time / away_score_at_time = 안정 정렬 (home 먼저) — 정확한 시간 순서는 Phase 3 game_clock 통합 시 보완

⚠️ reviewer 참고:
- **server-safe lib 위치**: 헬퍼/타입 = `src/lib/score-sheet/` (route group dir 의 client 옆에 두지 않음 — BFF + vitest 양쪽 안전 import)
- **paper-fix prefix 보호 룰**: service 의 manual-fix prefix 와 분리. 같은 매치 mode 게이팅이 보호의 핵심 (Flutter sync 가 종이 매치 호출 자체 403)
- **터치 영역 룰**: 칸 자체 16px 높이 (FIBA 정합) but PlayerSelectModal 큰 버튼 60px 로 룰 충족
- **마킹 시각 (1=● / 2=◉ / 3=◎)**: 검정 점 + 동그라미 조합 — 색상은 var(--color-accent) accent
- **2 컬럼 분기**: md (768px) 이상 = 좌 (TeamSection 2개 stack) + 우 (Grid + Period). md 미만 = 1 컬럼 stack — 모바일 가로는 RotationGuard 가 차단
- **BFF body schema 확장**: `running_score` optional → 기존 호출처 회귀 0 / Phase 3+ 도 동일 패턴 (optional 추가만)
- **Phase 3 진입 시 검토**: Team Fouls / Player Fouls 도 PBP foul event 자동 집계 채택 (결재 §2 (a)) — settings JSON 우회 불필요

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-12 | (커밋 대기) | **[FIBA 종이 기록지 Phase 2]** Running Score 1-160 grid + PlayerSelectModal 풀스크린 + PeriodScoresSection (Q1~OT 자동 + Final + Winner) + BFF running_score → PaperPBP 변환 → service play_by_plays 박제. server-safe lib 분리. vitest 381/381 (+31) / tsc 0. schema·Flutter v1·AppNav 영향 0. | ✅ |
| 2026-05-11 | (커밋 대기) | **[FIBA 종이 기록지 Phase 1]** `(score-sheet)` route group + minimal layout + RotationGuard + FibaHeader + TeamSection (Players 12 + Coach) + ScoreSheetForm 골조. 기존 `(web)/score-sheet/` 6 파일 폐기. vitest 350/350 (+9) / tsc 0. URL 동일 / admin link 변경 0 / BFF·service·schema·Flutter v1 변경 0. | ✅ |
| 2026-05-11 | (기획만) | **[종이 기록지 FIBA 재기획]** 6 Phase + 사용자 결재 7건 + 컴포넌트 트리 (FIBA 1 페이지 A4 세로) + DB 매핑 12 영역. Phase 1 = `(score-sheet)` route group + minimal layout + 헤더 + 명단 (12h 추정). 코드 변경 0 — developer 진입 결재 §1~§7 대기. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 디자인 13 룰 fix]** Critical 11건 + Major 4건 + conventions.md 박제 (44 → 45). 13 파일. tsc 0 / vitest 341/341. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[옵션 C Phase C]** status route safety net — match-score-recompute.ts + 8 케이스. vitest 341/341. Flutter 영향 0. | ✅ |
| 2026-05-11 | (커밋 ❌ scripts/_temp) | **[옵션 C Phase A apply]** PBP/playerStats 10건 UPDATE + audit. #132 + 열혈농구단 9건 영구 복구. | ✅ |
| 2026-05-11 | (커밋 ❌ scripts/_temp) | **[옵션 C Phase A DRY-RUN]** 12 매치 SELECT + PBP 재계산. UPDATE 0. | ✅ |
| 2026-05-11 | 9793b7f | **[옵션 C Phase B]** score-from-pbp 헬퍼 + live API 3단 fallback. vitest 320/320. | ✅ |
| 2026-05-11 | (기획만) | **[옵션 C 기획설계]** 6 Phase + 5 결재 + 원영 협의 4. 코드 변경 0. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[권한 시스템 Phase 1-B + 3 + rbac]** admin-guard sentinel + referee layout + RoleMatrixCard. vitest 312/312. | ✅ |
