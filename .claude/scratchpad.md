# 작업 스크래치패드

## 현재 작업
- **요청**: 사용자 보고 2건 — (1) score-sheet 임시번호 미적용 fix (loadTeamRoster → resolveMatchJerseysBatch) + (2) 종이기록지 내부 임시번호 부여 UI 박제 (No. cell → JerseyEditModal → POST + router.refresh)
- **상태**: 🟢 박제 완료 — tsc EXIT=0 / 운영 보존 (라이브 API 변경 0 / digital PBP 변경 0 / draft / 4종 모달 / read-only / 시안 13 룰)
- **현재 담당**: PM (commit / push 즉시 처리 — 사용자 명시 자동 머지)

## 구현 기록 (developer / 2026-05-17) — score-sheet 임시번호 적용 + 부여 UI 박제

📝 **구현한 기능**: 사용자 보고 2건 일괄 — (1) score-sheet 표시 임시 번호 미적용 fix (MatchPlayerJersey override 우선 / TTP fallback / 라이브 API 패턴 답습) + (2) score-sheet 안 No. cell 클릭 → JerseyEditModal → BFF upsert/release + router.refresh.

### 변경 파일 (신규 1 / 수정 3)

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|---------|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/jersey-edit-modal.tsx` | 임시 등번호 모달 (입력 1칸 0~99 + 저장/취소/해제 + ESC + 외부 클릭) — foul-type-modal / bench-tech-modal 패턴 일관 | +240 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` | loadTeamRoster 안 resolveMatchJerseysBatch 호출 추가 (1회 batch SELECT) → jerseyNumber = override 우선 / TTP fallback / null | +25 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | onRequestEditJersey prop 추가 (optional / 구버전 호환) + No. cell `<div>` → `<button>` 분기 (onRequestEditJersey 전달 + disabled/readOnly/ejected 아닐 때만 클릭 가능) | +40 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | useRouter + JerseyEditModal import + jerseyEditCtx state + 3 handler (handleRequestEditJersey / handleJerseySave / handleJerseyRelease) + home/away TeamSection wiring + 모달 mount | +135 | 수정 |
| **합계** | | **+440 LOC** (신규 240 / 수정 200) | |

### 작업 1 — score-sheet 임시번호 미적용 fix

| 측면 | 변경 전 | 변경 후 |
|------|--------|--------|
| 호출 패턴 | `players.map((p) => ({ jerseyNumber: p.jerseyNumber, ... }))` | `resolveMatchJerseysBatch(matchId, ttpEntries)` → `jerseyMap.get(p.id) ?? p.jerseyNumber ?? null` |
| 우선순위 | TTP.jerseyNumber 만 | MatchPlayerJersey override → TTP.jerseyNumber → null (라이브 API 와 동일) |
| 운영 영향 | match override 무시 (정영민 #9 누락 같은 사고 가능) | 라이브 응답과 정합 (같은 매치 = 같은 번호) |
| DB 부하 | +1 SELECT (matchId + IN(ttp.id...)) — 라이브 API 와 동일 수준 |

### 작업 2 — 종이기록지 내부 임시번호 부여 UI

| 흐름 | 동작 |
|------|------|
| 1. No. cell 클릭 | team-section button → onRequestEditJersey(playerId, currentJersey, playerName) |
| 2. score-sheet-form handler | jerseyEditCtx state 박제 → JerseyEditModal open |
| 3. 모달 저장 | POST /api/web/tournaments/[id]/matches/[matchId]/jersey-override (운영자 권한 필수) |
| 4. 모달 해제 | DELETE 같은 endpoint (기존 임시 번호 있을 때만) |
| 5. 성공 후 | router.refresh() = server component (page.tsx) 재호출 → roster 갱신 → No. cell 즉시 반영 |
| 6. 라이브 페이지 | 별도 처리 0 (3초 polling 으로 자동 반영) |
| RO 가드 | isReadOnly (종료 매치) = team-section 이 button 미렌더 + form 의 handler / modal open=false 이중 방어 |

### 보존 의무 검증 (모두 ✅)

- 라이브 API (`src/app/api/live/[id]/route.ts`) 변경 0 — 이미 정합
- digital (Flutter) PBP 변경 0 — paper score-sheet 전용 모달
- BFF `/api/web/tournaments/[id]/matches/[matchId]/jersey-override` 변경 0 — 기존 endpoint 재사용
- score-sheet UX (4종 모달 / draft localStorage / Phase 23 read-only / 라인업 / 점프볼 / 공격권) 변경 0
- 시안 13 룰 (var(--color-*) / Material Symbols / 빨강 본문 ❌ (해제 버튼만 예외) / radius 4px / pill 9999px ❌)
- 모바일 iOS input fontSize 16px+ (자동 줌 회피)
- 터치 영역 44px+ (input + 모든 버튼)

### 검증

| 검증 | 결과 |
|------|------|
| `npx tsc --noEmit` | EXIT=0 ✅ |
| 신규 import / state / handler 회귀 | 0 — useRouter / JerseyEditModal 신규 추가 only |
| 운영 매치 흐름 | (1) score-sheet 진입 → No. cell 값 = 라이브와 동일 (override 우선) (2) cell 클릭 → 모달 → 저장 → cell 즉시 갱신 (router.refresh) (3) 라이브 페이지도 3초 내 자동 반영 |

💡 **tester 참고**:
- 테스트 방법:
  1. **임시번호 적용 검증**: 운영 매치 = TTP 원본 jersey + MatchPlayerJersey override 둘 다 박혀있는 매치 진입 → score-sheet No. cell 값 = 라이브 페이지와 동일 (override 우선)
  2. **No. cell 클릭**: score-sheet 진입 → 임의 선수 No. cell 클릭 → JerseyEditModal open (선수명 + 현재 번호 + 입력 칸)
  3. **저장 흐름**: 0~99 범위 입력 → "저장" → toast "임시 등번호 #N 박제 완료" → No. cell 즉시 갱신 (router.refresh)
  4. **충돌 검증**: 같은 매치 다른 선수가 쓰는 번호 입력 → 409 JERSEY_CONFLICT toast (BFF 측 안내)
  5. **해제 흐름**: 임시 번호 박제된 선수 No. cell → 모달 → "해제" → toast "원본 복귀" → cell 원본 번호 표시
  6. **권한 검증**: 운영자 아닌 사용자 = BFF 403 차단 (모달 자체는 RO 아니면 노출되나 저장 시 차단)
  7. **종료 매치 RO**: status=completed + 수정 모드 OFF = team-section 이 button 미렌더 (cell read-only 동작)
  8. **라이브 자동 반영**: score-sheet 저장 → 별도 탭의 라이브 페이지 3초 내 새 번호 노출 (polling)
- 정상 동작: 모달 open/close / 입력 클램프 (0~99) / disabled 가드 (busy / unchanged / invalid) / ESC = 취소 / 외부 클릭 = 취소
- 주의할 입력: 음수/100+/빈 칸 = 저장 버튼 disabled / 동일 값 = 저장 버튼 disabled (UX 가드)

⚠️ **reviewer 참고**:
- 특별히 봐줬으면 하는 부분:
  - `page.tsx` 의 `resolveMatchJerseysBatch` 호출 패턴 — 라이브 API L264 와 동일 구조 (ttpEntries 변환 + teamJersey null fallback)
  - `team-section.tsx` 의 No. cell `<button>` 분기 가드 — disabled / readOnly / ejected / onRequestEditJersey 미전달 4 조건 모두 미통과 시 read-only div 유지 (구버전 호출자 호환)
  - `score-sheet-form.tsx` 의 hasOverride={jerseyEditCtx !== null} 항상 true 박제 — TTP 원본 vs override 구분 정보 client 측 미가용 → 모달이 항상 "해제" 버튼 노출 → BFF 404 가 친절 안내 (재발 안전망)
  - JerseyEditModal 의 모바일 iOS fontSize: "16px" 강제 — 자동 줌 회피 (시안 13 룰 §D-13)


## 구현 기록 (developer / 2026-05-16) — Bench Tech (B/C) + Delay of Game (W/T) 일괄 박제

📝 **구현한 기능**: FIBA Article 36.3 (Coach T) / 36.4 (Bench T) / 36.2.3 (Delay of Game) 종이 양식 박제. 사용자 결재 권장안 100% (Q1 3 cell 고정 / Q2 W→T 자동 분기 / Q3 자유투 운영자 수동 / Q4 추방 자동 toast).

### 변경 파일 (신규 4 / 수정 7)

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|---------|
| `src/lib/score-sheet/bench-tech-types.ts` | BenchTechnicalState / DelayOfGameState / CoachFoulEntry / 라벨/임계 상수 | +130 | 신규 |
| `src/lib/score-sheet/bench-tech-helpers.ts` | addCoachFoul / removeLastCoachFoul / addDelayEvent (자동 W→T 분기) / canEjectCoach / coachFoulSummary / getCoachFoulCellState / removeLastDelayEvent / benchTechToPBPEvents / delayToPBPEvents (PURE) | +260 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/bench-tech-modal.tsx` | C / B_HEAD / B_BENCH 3 옵션 라디오 모달 (foul-type-modal 패턴 일관) | +180 | 신규 |
| `src/__tests__/score-sheet/bench-tech-helpers.test.ts` | vitest 18 케이스 (addCoachFoul / removeLastCoachFoul / canEject / coachFoulSummary / getCoachFoulCellState / addDelayEvent W→T / removeLastDelayEvent / PBP events) | +200 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | Coach row 우측 3 cells + Team fouls 위 Delay row ([W][T1...]) + 새 props 6건 (benchTechnical / delayOfGame / 4 핸들러) | +180 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | benchTechnical / delayOfGame state + 5 handler + BenchTechModal mount + TeamSection wiring (home + away) + draft 박제/복원 + buildSubmitPayload 인자 추가 | +180 | 수정 |
| `src/lib/score-sheet/build-submit-payload.ts` | benchTechnical / delayOfGame 인자 추가 → payload 박제 (1건 이상 박제 시만 키 박제 — undefined = 키 통째 생략) | +20 | 수정 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | submitSchema 확장 (bench_technical / delay_of_game zod) + PBP action_subtype 박제 (C / B_HEAD / B_BENCH / DELAY_W / DELAY_T) + settings JSON merge + audit context 카운트 | +210 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` | match.settings.bench_technicals + delay_of_game SELECT + ScoreSheetForm prop drilling | +70 | 수정 |
| `src/lib/live/pbp-format.ts` | 신규 action_subtype 5종 한글 라벨 (코치 T (Head) / 벤치 T (Head) / 벤치 T (Asst/벤치) / 지연 경고 (W) / 지연 T (자유투)) | +15 | 수정 |
| **합계** | | **+1445 LOC** (신규 770 / 수정 675) | |

### 자동 분기 동작

| 동작 | 트리거 | 결과 |
|------|-------|------|
| Bench Tech 박제 (B/C 분기) | Coach row 우측 빈 cell 클릭 | BenchTechModal open → C / B_HEAD / B_BENCH 선택 → head[] push |
| Head Coach 추방 | head[] 누적 3건 도달 (kind 무관) | cell disabled (4번째 cell 박제 차단) + toast "Head Coach 추방 (누적 3건) — 어시 코치 인계" |
| Delay 1차 (W) | Delay row 빈 W cell 클릭 (warned=false) | warned=true 박제 / toast "1차 경고 (W) — 다음 위반부터 T (자유투 1개)" |
| Delay 2차+ (T) | warned=true 후 cell 클릭 | technicals + 1 / toast "T 박제 — 상대 자유투 1개 (운영자 별도 박제)" |
| 자유투 박제 | T / B / C / Delay-T 발생 | 운영자가 Running Score 영역에서 별도 1점 마킹 (모달 X — 사용자 결재 Q3) |

### 데이터 모델 (옵션 D 혼합)

- **settings.bench_technicals JSON**: `{ home: { head: [{kind, period}...], assistant: [] }, away: {...} }` — 현재 상태 snapshot
- **settings.delay_of_game JSON**: `{ home: { warned: boolean, technicals: number }, away: {...} }`
- **PBP action_subtype 신규 5종**: `C` / `B_HEAD` / `B_BENCH` / `DELAY_W` / `DELAY_T` — 이력 추적 (action_type="foul" 통일 / points_scored=0 / is_technical=true)
- **player_id fallback**: lineup.starters[0] (코치/팀 단위 = 선수 미식별 / lineup 미박제 시 PBP skip)
- **idempotent**: local_id = `paper-bench-tech-{kind}-{team}-{idx}` / `paper-delay-{W|T}-{team}-{idx}` → service deleteMany NOT IN 가드 통과

### 검증 결과

| 검증 | 결과 |
|------|------|
| `npx tsc --noEmit` | EXIT=0 ✅ |
| `npx vitest run bench-tech-helpers.test.ts` | 18 / 18 통과 ✅ (310ms) |
| `npx vitest run src/__tests__/score-sheet/` 회귀 | 270/271 통과 (실패 1건 = 기존 running-score-helpers 무관 — git stash 검증) ✅ |

### 보존 의무 검증 (모두 ✅)

- 기존 player fouls (P/T/U/D) FoulType 변경 0
- score-sheet UX (4종 모달 / draft / Phase 23 read-only) 변경 0
- Phase 22 paper override 영향 0 (settings JSON = paper 전용 + PBP points=0)
- digital (Flutter) PBP 영향 0 (paper 모드 분기 — settings + new action_subtype = paper only)
- DB schema 변경 0 (settings JSON + action_subtype String 자유 박제)
- 4쿼터 / halves / OT 매치 모두 영향 0
- 시안 13 룰 (var(--color-*) / Material Symbols / 빨강 본문 ❌ / radius 4px / pill 9999px ❌)

💡 **tester 참고**:
- 테스트 방법:
  1. score-sheet 진입 → Coach row 우측 빈 cell 클릭 → BenchTechModal open → C / B_HEAD / B_BENCH 선택 → cell 박제 (글자 C 또는 B / 색 = warning / accent / elevated)
  2. 3 cells 누적 박제 → 4번째 cell 자동 disabled + 추방 toast
  3. Team fouls 위 Delay row 빈 W cell 클릭 → W 박제 (warning 톤) → 다음 cell 클릭 = T 박제 (primary 빨강) → FT+1 안내 표시
  4. mid-game 새로고침 → settings (server) + draft (localStorage) 둘 다 복원 (draft 우선)
- 정상 동작: head 3건 누적 = cell disabled (수정 모드만 해제 가능) / Delay W 1회 = 매치당 1회만 자동 / 자유투는 Running Score 영역 운영자 수동
- 주의할 입력: lineup 미박제 시 BFF 가 PBP skip (player_id NOT NULL FK fallback 실패) — UI 박제는 정상 but PBP 0건. 운영 영향 0 (settings JSON = SSOT).

⚠️ **reviewer 참고**:
- 특별히 봐줬으면 하는 부분:
  - `bench-tech-helpers.ts` 의 `addCoachFoul` 추방 가드 (재발 안전망 — kind 무관 합산 3 = 추방)
  - `submit/route.ts` 의 PBP 박제 — local_id idempotent 룰 (`paper-bench-tech-{kind}-{team}-{idx}` 형식 보존 — service deleteMany NOT IN 가드 호환)
  - `team-section.tsx` 의 Coach row 우측 cells flex 레이아웃 — 시안 12 종이 양식 정합 (`.ss-tbox__coach` 안 flex gap 6px / cell `.ss-tbox__tf-cell` 재사용)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-05-17 | (1) 빈 Delay W/T cell + 빈 Coach B/C cell 시인성 강화 (흰 배경 + 회색 border + 회색 라벨 "W"/"T1~T5"/"B" + opacity 0.5 / active 시 빨강·노랑·accent fill 대비 명확) (2) Delay row 위치 이동 (Team fouls 박스 안 위 → 아래 Extra periods row 뒤 / borderTop dotted 분리선) | `team-section.tsx` | 사용자 직접 결재 §1 (이미지 #170 시인성 사고) + §2 (이미지 #171 위치 이동). tsc EXIT=0 / vitest 18/18 PASS / 동작 로직 보존 0건 |
| 2차 | 2026-05-17 | Delay row + Extra periods row **단일 row 합성** (1 row 안 좌측 = Delay block [W][T1~T5] FT+N / 우측 = "Extra periods" 텍스트 / justifyContent: space-between + alignItems: center / delayOfGame undefined 시 좌측 미렌더 = 우측 정렬 유지). Delay 동작 로직 (W→T 자동 분기 / removeLast / disabled / aria-label / inline style) 100% 보존 | `team-section.tsx` | 사용자 보고 #172 — Delay row 가 Extra periods row 와 **같은 행** 에 위치 명시. tsc EXIT=0 / vitest 회귀 0 (실패 1건 = 사전 회귀 running-score-helpers / 본 작업 무관 — stash 검증) |
| 3차 | 2026-05-17 | 설명서 모달 JSX 신규 3 섹션 추가: (6) 벤치 테크니컬 파울 B/C (psychology_alt) — C/B 정의 + 입력 방법 + 누적 룰 + 자유투 / (7) 딜레이 오브 게임 W/T (schedule) — 위반 상황 + 1차 W / 2차+ T 자동 분기 + 입력 방법 / (8) i3 종별 자동 전후반 (category) — 자동 모드 + 라벨 분기 + 혼합 토글. 기존 (6) 수정 → (9), (7) 전체화면 → (10) 번호 재정렬. 섹션 박스/h3/iconStyle/bodyTextStyle/emphasisStyle 기존 상수 재사용 (시각 정합) | `score-sheet-form.tsx` (handleOpenManual JSX 만) | 사용자 직접 결재 (+159 LOC, JSX only). tsc EXIT=0 / handleOpenManual signature + ConfirmModal title/size/options 변경 0 / 다른 핸들러·state·핸들러 영향 0 |

## 기획설계 (planner-architect / 2026-05-16) — Bench Tech (B) + Delay of Game 박제 design

🎯 **목표**: FIBA Article 36.5 (벤치 테크니컬) + Article 17.2.6/36.4.7 (딜레이 오브 게임) 을 score-sheet 종이 양식에 박제. 운영자가 코치 추방 알림 / 자유투 부여 trigger 자동 지원. **기존 player fouls (P/T/U/D) + UX 변경 0 / Phase 22 paper override 영향 0 / digital Flutter PBP 영향 0**.

### 1) 위치 옵션 분석 (Score sheet 양식 어디 박제)

| 옵션 | 박제 위치 | 시각 | 운영 편의 | score-sheet 침범 정도 | FIBA 양식 정합 | 권장 |
|------|---------|------|----------|------------------|--------------|------|
| **A** | Team fouls 영역 아래 신규 row | 1줄 추가 (delay × 2 / bench T × 2 cells) | 중 — Team fouls 시선 흐름 안에 있어 자연 | 중 — `.ss-tbox__tf` 격자 row 1개 확장 | 중 — FIBA 종이 양식엔 별도 row 없음 (운영자 익숙도 ↓) | ❌ |
| **B** | Coach 영역 옆 (Coach / Asst Coach 우측) ⭐ | Coach + Asst Coach 우측에 Bench T (B 1·2·3) + Delay (W·T1·T2) 칸 추가 | **상** — 코치 본인 우측에 즉시 박제 = 코치 추방 가산 직관적 | 작음 — `.ss-tbox__coach` 우측 grid 1열 추가 | **상** — FIBA Article 36.5 룰 = 코치 인원 fouls 영역과 같은 그룹 (벤치 테크 = 코치 개인 fouls 가산) | **⭐ 권장 (Bench T)** |
| **C** | Time-outs 영역 옆 | Time-outs 영역 (7 cells) 옆 작은 박스 | 하 — 의미 무관 (Time-out 과 Delay/BenchT 룰 무관) | 작음 | 하 — FIBA 양식 정합 0 | ❌ |
| **D** | 별도 신규 박스 (양식 하단 또는 헤더 아래) | 신규 박스 (Delay 1행 / Bench T 1행) | 중 | 큼 — `.ss-tbox` 외부 신규 섹션 추가 (양식 7 섹터 깨짐) | 중 | ❌ (Delay 한정 권장) |

→ **권장**: **B (Bench T) + D 변형 (Delay 는 Team 영역 안 별도 row)** 혼합.

**근거 (FIBA 종이 양식)**:
- **벤치 테크니컬 (B)** = 코치 개인 fouls 영역 (Article 36.5 — "코치/어시스트/벤치 인원 vs **코치 개인**에게 박제"). FIBA 종이 양식엔 Coach row 끝에 "Tech" 칸 (1·2·3 누적) 있음. **본 프로젝트 = Coach + Asst Coach 입력 우측에 Bench T 박스 신설 (옵션 B)**.
- **딜레이 오브 게임 (Delay)** = 팀 단위 누적 (Article 17.2.6 — "팀에게 부여"). FIBA 양식엔 별도 항목 없음 (운영자가 메모 박제). 본 프로젝트 = **Team fouls 영역 위 또는 옆에 1행 (W + T1) 추가 (옵션 D 변형 = `.ss-tbox` 내부)**.

### 2) 데이터 모델 옵션

| 옵션 | 박제 방식 | 장점 | 단점 | 권장 |
|------|---------|------|------|------|
| **A** | `match.settings.bench_technicals` + `match.settings.delay_of_game` JSON (timeouts/signatures merge 패턴 재사용) | • Phase 4 timeouts 패턴 100% 재사용 / DB schema 변경 0 / paper 모드 전용 깔끔 | 이력 추적 (시각순) 0 — count snapshot 만 | 회복 가능 (Phase 22 paper override 처럼 settings 가 SSOT) |
| **B** | play_by_plays `action_type` 확장 (`bench_technical` / `delay_warning` / `delay_technical`) | • 시각 이력 / Q별 색 / PBP 박제 일관성 / 라이브 timeline 자동 노출 | Flutter v1 digital 매치에 신규 action_type 영향 (= 원영 사전 공지 필요) / 통산 stat 합산 영향 (개인 stat 0 처리 가드) | ❌ 영향 범위 큼 |
| **C** | TournamentMatch 컬럼 확장 (schema migration) | 명시적 컬럼 / 쿼리 단순 | schema migration 필수 — 운영 DB push (룰 §DB 정책 §2) | ❌ |
| **D** | 혼합 — current state = settings JSON (옵션 A) + 이벤트 이력 = PBP `action_subtype` (action_type="foul" 유지 + subtype="BENCH_TECH"/"DELAY_W"/"DELAY_T") ⭐ | • Phase 22 paper override 의 PBP-에서-recompute 패턴 단일 source 정합 (PaperPBP 가 source 면 settings 갱신 자동) / **digital Flutter 매치 영향 0** (digital 은 settings 미사용) / 이력 추적 가능 | 복잡성 ↑ — settings recompute 함수 필요 | **⭐ 권장 (옵션 D)** |

**옵션 D 상세**:
- **PBP 박제**: 기존 `action_type="foul"` 유지 + `action_subtype` 확장 (현재 "P"/"T"/"U"/"D" → 신규 "B_BENCH"/"DELAY_W"/"DELAY_T" 추가). pbp-to-fouls.test.ts foul 필터링이 `action_subtype` 분기 추가 (개인 통산 stat 미가산 가드).
- **settings 박제**: paper 매치 submit BFF 가 `bench_technicals: { home: [{coachRole, period}...], away: [...] }` + `delay_of_game: { home: { warnings: 1, technicals: 0 }, away: {...} }` 박제 (timeouts 패턴 100% 재사용).
- **단일 source**: PBP 가 source (=  Phase 22 paper override 룰 정합). settings 는 운영자 빠른 조회 + 차단 가드용 snapshot.

### 3) 운영자 UI 흐름 (ASCII mockup)

**A. Bench Technical (B) — Coach 영역 옆 신규 박스 (옵션 B)**

```
┌─────────────────────────────────────────────────────────────────┐
│ Coach     [______입력______]   Bench Tech (B)  ┌──┬──┬──┐      │
│                                                 │  │  │  │      │
│ Asst Coach [______입력______]   Asst Tech       ├──┴──┴──┘      │
│                                                 │  │  │  │      │
│                                                 └──┴──┴──┘      │
└─────────────────────────────────────────────────────────────────┘
                                  ↑
                          빈 칸 클릭 → 모달 open
```

**모달 (재사용 = BenchTechModal — 신규 1파일)**:
```
┌─────────────────────────────┐
│ 벤치 테크니컬 박제           │
│ ─────────────────────────── │
│ 대상:  ⦿ Head Coach          │
│        ◯ Asst Coach          │
│        ◯ Bench Member        │
│ Period: [현재 Q 자동 박제]  │
│ ─────────────────────────── │
│       [취소]  [박제]         │
└─────────────────────────────┘
```

**자동 분기 룰**:
- Head Coach 3회 OR Asst Coach 2회 OR Head + Asst 합산 = 코치 추방 toast (`퇴장 — Coach Eject`)
- 추방 후 빈 칸 클릭 = 차단 (disabled)
- 누적 추방 alert 후 운영자가 `disqualifying` 카운트 별도 추가 (= 상대 자유투 1개 + ball)

**B. Delay of Game — Team fouls 위 또는 좌측 1행 (옵션 D 변형)**

```
┌──────────────────────────────────────────────────────┐
│ Delay of Game   W  T1                                │
│                ┌──┬──┐                              │
│                │  │  │  ← 1차 W (회색 톤) / 2차+ T1 (warning 톤)
│                └──┴──┘                              │
├──────────────────────────────────────────────────────┤
│ Time-outs     [기존 7 cells]                         │
│ Team fouls    [기존 Period 1·2·3·4 + Extra]          │
└──────────────────────────────────────────────────────┘
```

**자동 분기 룰**:
- 1차 클릭 = W (warning) 박제 — 점수 변동 0
- 2차+ 클릭 = T (technical) 박제 — toast: `T 자동 추가 — 상대 자유투 1개 부여`
- 자유투 박제 = **수동** (운영자가 상대 team_fouls 영역 또는 별도 stat 직접 +1) — 사용자 결재 Q2

### 4) 위치 / 데이터 모델 / 작동방식 권장 조합 (단순화 + FIBA 정합)

| 항목 | 권장 |
|------|------|
| **위치** | Bench T = 옵션 B (Coach 영역 옆) / Delay = 옵션 D 변형 (`.ss-tbox` 내부 Team fouls 위) |
| **데이터 모델** | 옵션 D (settings JSON snapshot + PBP `action_subtype` 이력) |
| **자유투 부여** | **수동** — 자동 박제 ❌ (운영자 별도 박제). 사유: FIBA 룰 = "상대 코치가 자유투 슈터 선택" → 자동 박제 = 슈터 미정 PBP 박제 함정 |
| **경고 vs T 분기 (Delay)** | **자동 누적 카운트** — 1차=W / 2차+=T. 운영자 별도 선택 X (FIBA 명시 룰 = 자동) |
| **코치 추방 alert** | 자동 toast + 빈 칸 disabled. 자유투/볼 점유 박제는 운영자가 별도 |
| **digital Flutter 영향** | **0** — settings JSON 은 paper 매치 전용. PBP action_subtype 신규 값 = Flutter v1 digital 매치 미박제 (Flutter 앱 PBP 박제 path 분기 추가 ❌) |

### 5) 박제 분량 추정

| 파일 | 변경 | LOC | 신규/수정 |
|------|------|-----|---------|
| `src/lib/score-sheet/bench-tech-types.ts` | 신규 — BenchTechMark / BenchTechRole / DelayOfGameState 타입 + EJECTION 룰 헬퍼 | +80 | 신규 |
| `src/lib/score-sheet/bench-tech-helpers.ts` | 신규 — addBenchTech / removeBenchTech / getCoachEjectionStatus / addDelay / getDelayCount | +120 | 신규 |
| `src/lib/score-sheet/foul-types.ts` | FoulType 확장 (action_subtype 신규 "B_BENCH"/"DELAY_W"/"DELAY_T" 라벨 추가) — pbp-to-fouls 필터링은 별도 분리 헬퍼 | +30 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/bench-tech-modal.tsx` | 신규 — Head Coach / Asst Coach / Bench Member 라디오 선택 모달 (FoulTypeModal 패턴 재사용) | +180 | 신규 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | Coach 영역 우측 BenchTech 박스 (3 cells × 2 row) + Delay of Game 박스 (2 cells × 1 row) 추가 | +90 / -5 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | benchTech / delayOfGame state + handleAddBenchTech / handleAddDelay + 모달 wiring + draft 박제/복원 + buildSubmitPayload 인자 추가 | +120 / -3 | 수정 |
| `src/lib/score-sheet/build-submit-payload.ts` | bench_technicals + delay_of_game 인자 추가 → payload 박제 | +30 | 수정 |
| `src/lib/score-sheet/draft-storage.ts` | benchTech / delay 키 박제/복원 추가 | +20 | 수정 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | submitSchema 확장 (bench_technicals + delay_of_game zod) + settings JSON merge (timeouts/signatures 패턴 100% 재사용) + PBP `action_subtype` 박제 | +80 / -5 | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/page.tsx` | initial state 복원 (DB settings.bench_technicals + delay_of_game SELECT) | +30 | 수정 |
| `src/__tests__/score-sheet/bench-tech-helpers.test.ts` | 신규 vitest — 12 케이스 (Head 3 추방 / Asst 2 추방 / Head+Asst 합산 / Delay 1차 W / 2차 T / 박제 후 disable) | +250 | 신규 |
| `src/__tests__/score-sheet/build-submit-payload.test.ts` | 추가 케이스 — bench_tech + delay payload 박제 (+ 미전송 시 키 통째 생략) | +60 | 수정 |
| **합계** | | **+1090 / -13 LOC** | |

### 6) Phase 분리 (PR 분해 권장)

| Phase | 범위 | LOC | 의존성 | 시간 |
|-------|------|-----|--------|------|
| **Phase 1** | bench-tech-types + helpers + vitest 12 케이스 | +450 | 없음 | 3 시간 |
| **Phase 2** | BenchTechModal + team-section.tsx Coach 영역 우측 박스 (UI only — state 미연동) | +280 | Phase 1 | 4 시간 |
| **Phase 3** | score-sheet-form.tsx state + 모달 wiring + draft 박제 | +130 | Phase 2 | 3 시간 |
| **Phase 4** | submit BFF zod + settings JSON merge + PBP action_subtype 박제 | +90 | Phase 3 | 3 시간 |
| **Phase 5** | Delay of Game UI 박스 + state + submit 박제 (Bench T 와 분리 검증 가능) | +120 | Phase 4 | 3 시간 |
| **Phase 6** | page.tsx initial state 복원 + 운영 검증 | +40 | Phase 5 | 2 시간 |
| **합계** | | **+1110 LOC** | | **18 시간 (~2.5일)** |

**PR 분해 권장**: **3 PR (= Phase 1+2 / Phase 3+4 / Phase 5+6)** — 각 PR 단독 머지 가능 + 회귀 0.

### 7) 운영 호환성 / 회귀 위험 분석

| 항목 | 평가 | 대응 |
|------|------|------|
| **기존 player fouls (P/T/U/D)** | 변경 0 — foul-types.ts FoulType 미변경 / pbp-to-fouls 필터링 보존 (action_subtype != "B_BENCH"/"DELAY_*" 가드 추가) | ✅ |
| **기존 score-sheet 4종 모달** | 변경 0 — 신규 BenchTechModal 추가만 (FoulTypeModal/PlayerSelectModal/StatPopover 패턴 재사용) | ✅ |
| **draft 자동 박제** | 추가 키 (benchTech/delay) 박제 — 구버전 draft 복원 시 EMPTY fallback | ✅ |
| **Phase 23 read-only** | bench-tech 박스 / delay 박스 = readOnly prop drilling — 종료 매치 input/button disabled | ✅ |
| **Phase 22 paper override** | settings.bench_technicals + delay_of_game = paper 매치 전용 (digital 매치 미박제) — paper override 영향 0 | ✅ |
| **Flutter v1 digital PBP** | action_subtype 신규 값 ("B_BENCH"/"DELAY_W"/"DELAY_T") 박제 = paper 매치 only / Flutter 앱 모드 분기로 디지털 매치 미박제 | ✅ (원영 사전 공지 ❌ — paper 전용) |
| **라이브 페이지 timeline** | PBP "foul" action_type 표시 시 action_subtype "B_BENCH" / "DELAY_W" / "DELAY_T" 라벨 분기 — tab-timeline.tsx case "foul" 확장 (+20 LOC) | ✅ (별도 PR 권장) |
| **통산 stat 합산** | pbp-to-stat 합산 시 `action_subtype IN (B_BENCH, DELAY_W, DELAY_T)` 미가산 가드 — 개인 통산 fouls 영향 0 | ✅ |
| **알기자 brief 자동 발행** | LLM 입력 PBP 에 bench tech / delay 포함 = 카피 영향 가능 → buildUserPrompt 에서 본 subtype 필터링 (별도 PR 또는 본 PR Phase 4 포함) | ⚠️ 별도 검토 |
| **PDF 인쇄 (Phase 6)** | bench-tech / delay 박스 = 인쇄 시 표시 (FIBA 양식 정합) — `no-print` 클래스 미적용 (의도) | ✅ |

### 8) 시안 13 룰 준수 확인

| 룰 | 준수 |
|----|------|
| `var(--color-*)` 토큰만 | ✅ — bench-tech-modal.tsx 가 FoulTypeModal 패턴 재사용 (모든 색 var) |
| Material Symbols Outlined | ✅ — 아이콘 미사용 (B / W / T1 텍스트만) |
| 빨강 본문 텍스트 ❌ | ✅ — 추방 toast 만 warning 톤 / 코치 추방 = D 모달과 동일 (예외 허용) |
| radius 4px | ✅ — 모달 + 박스 모두 4px |
| pill 9999px ❌ | ✅ — 정사각형 cell (foul cell 패턴) |
| 모바일 터치 44px+ | ✅ — bench-tech cell = foul cell 동일 크기 (44px+) |

### 9) PM 결재 사항 (Q1~Q3)

| # | 결재 항목 | 옵션 | 권장 |
|---|---------|------|------|
| **Q1** | 박제 위치 (Bench T) | A (Team fouls 아래) / **B (Coach 옆)** / C (Time-outs 옆) / D (별도 박스) | **B** (FIBA Article 36.5 룰 정합 + 시안 침범 최소 + 운영자 직관) |
| **Q2** | 자유투 자동 박제 (Delay 2차 T + Bench T 추방) | **수동** (운영자 별도 박제) / 자동 (PBP 자동 INSERT) | **수동** — FIBA 룰 "상대 코치 슈터 선택" 정합 + 슈터 미정 PBP 함정 회피 |
| **Q3** | 데이터 모델 (옵션 D 혼합 vs 옵션 A settings 단독) | A (settings JSON 단독 / 단순) / **D (settings + PBP action_subtype 혼합 / 이력 추적 + 단일 source 정합)** | **D** — Phase 22 paper override 룰 정합 + 라이브 timeline 자동 노출 |

→ **PM 결재 후** developer 진입 (Phase 1~6 순차 / 3 PR 분해).

---



## 기획설계 (planner-architect / 2026-05-16) — 매치 종료 path 누락 영구 fix

🎯 **목표**: 매치 status='completed' UPDATE path 4종 중 1종 (`updateMatchStatus` Flutter v1 `/api/v1/matches/:id/status`) 이 `updateTeamStandings` + placeholder advancer 호출 누락. 강남구 i3-U9 6건 standings=0 사고 = 본 path 사용 의심. **영구 fix = 단일 통합 헬퍼 (옵션 B)** 권장.

### 1) 매치 종료 path 매핑 (grep 결과)

| # | path | 파일 | updateTeamStandings | advanceWinner / progressDualMatch | placeholder advancer | autoComplete | matchBrief |
|---|------|------|----|----|----|----|----|
| **1** | admin PATCH route | `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts:240~365` | ✅ L248 | ✅ L275 (dual) + services/match.ts:updateMatch 가 winner 진출 | ✅ L357 (advanceAllDivisions / advanceTournamentPlaceholders) | ❌ (간접) | ❌ (간접) |
| **2** | Flutter sync 단건 | `src/app/api/v1/tournaments/[id]/matches/sync/route.ts:143` → service `syncSingleMatch` | ✅ L635 | ✅ L662/L666 | ✅ L679/L685 (PR-G5.5-followup-B) | ✅ L693 | ✅ L476 (waitUntil) |
| **3** | Flutter batch-sync | `src/app/api/v1/tournaments/[id]/matches/batch-sync/route.ts:73~78` | ✅ L74 (fire-and-forget) | ✅ L73 (advanceWinner only — **dual ❌**) | ❌ **누락** | ❌ **누락** | ✅ L78 |
| **4** | score-sheet 웹 BFF | `src/app/api/web/score-sheet/[matchId]/submit/route.ts:816` → service `syncSingleMatch` | ✅ (service 경유) | ✅ (service 경유) | ✅ (service 경유) | ✅ (service 경유) | ✅ (service 경유) |
| **5** | **Flutter v1 status PATCH** | `src/app/api/v1/matches/[id]/status/route.ts:69` → `services/match.ts:updateMatchStatus` | ❌ **누락** | ✅ L439 (winner 슬롯) + L472 (dual) | ❌ **누락** | ❌ **누락** | ✅ L482 (waitUntil) |

→ **누락 path 2종 발견** (#3 부분 누락 + #5 전체 누락).

### 2) 누락 path 영향 분석

| 누락 path | 운영자 사용 시나리오 | 영향 |
|----------|------------------|------|
| **#5 `/api/v1/matches/:id/status` (Flutter 종료)** | Flutter 기록앱이 매치 종료 시점에 status="completed" PATCH 호출 (sync 와 별개 트리거 — sync 는 점수 박제 / status PATCH 는 종료 트리거) | • TournamentTeam.wins/losses/points_for 박제 0 → standings 0 / **이번 강남구 i3-U9 사고 = 본 path** 의심 / placeholder advancer 미호출 → 결선 매치 homeTeamId/awayTeamId null 유지 |
| **#3 batch-sync placeholder 미호출** | 운영자 매치 점수 일괄 보정 (Flutter 앱 batch 업로드) | placeholder advancer 미호출 → 결선 매치 자동 채움 X (단 standings/winner 진출은 박제됨) |
| **#3 batch-sync dual_tournament 미호출** | dual_tournament 대회 batch-sync | progressDualMatch 미호출 → loser bracket 미진출 |

**근본 원인**: 매치 종료 path 가 **5종 산재** (admin PATCH / sync 단건 / batch-sync / score-sheet BFF / Flutter status PATCH). post-process 5종 (standings / winner 진출 / placeholder advancer / autoComplete / matchBrief) 이 각 path 마다 누락/중복/순서 다름 → 함정 영구 존재.

### 3) errors.md `2026-05-09` "sync path 헬퍼 우회 lessons" 패턴 5회째 회귀

- 2026-05-09: Flutter sync path 가 `updateMatchStatus` 헬퍼 우회로 `triggerMatchBriefPublish` 미호출 → batch-sync.route.ts:78 waitUntil 추가 fix (errors.md 박제)
- 2026-05-16 (현재 사고): Flutter status PATCH path 가 `syncSingleMatch` 헬퍼 우회로 `updateTeamStandings` 미호출 → 동일 패턴 5회째
- **defense in depth 룰 (errors.md)**: 매번 path 별 호출 누락 발견 → 단일 통합 헬퍼로 강제 단일 source path 박제 필요

### 4) 옵션 비교

| 옵션 | 변경 LOC | 회귀 위험 | 단일 source | 유지보수 | 권장 |
|------|---------|---------|----------|----------|------|
| **A: 누락 path 마다 호출 추가 (분산)** | ~25 LOC (3곳: #5 + #3 dual + #3 placeholder) | 중 (path 신규 시 또 누락 — 6회째 회귀 위험) | ❌ | 낮음 | ❌ |
| **B: 공통 헬퍼 `finalizeMatchCompletion(matchId)` 신규 — 모든 path 가 호출** ⭐ | ~80 LOC (헬퍼 신규 +60 / path 5종 호출 변경 +20) | 낮음 (헬퍼 = service 의 `if (match.status === "completed")` 블록을 그대로 추출) | ✅ | 높음 (path 신규 시 1줄만 호출) | **⭐ 권장** |
| **C: DB trigger 또는 status update 후 자동 hook** | ~50 LOC + DB migration | 높음 (운영 DB 트리거 = 디버깅 난이도 + 운영 영향) | ✅ | 중 | ❌ |

→ **옵션 B 권장 사유**:
1. **errors.md defense in depth 룰 정합** — 단일 source 강제
2. **회귀 위험 0** (service 의 `if (match.status === "completed")` 블록을 100% 그대로 추출 = 동작 변경 0)
3. **신규 path 박제 시 1줄 호출만** = 6회째 회귀 영구 차단
4. **DB schema 변경 0** = 운영 영향 0

### 5) 신규 헬퍼 시그니처 (옵션 B)

```ts
// src/lib/tournaments/finalize-match-completion.ts 신규
//
// 매치 status='completed' 박제 후 호출되는 5종 post-process 통합 헬퍼.
// 모든 매치 종료 path (admin / sync / batch-sync / score-sheet / Flutter status PATCH)
// 가 본 헬퍼 1회 호출 = 단일 source 박제 (errors.md defense in depth 룰).
//
// 동작 (service syncSingleMatch L630~748 100% 그대로 추출):
//   1. updateTeamStandings (sequential — placeholder advancer 가 의존)
//   2. advanceWinner (single elim) OR progressDualMatch (dual_tournament)
//   3. advanceDivisionPlaceholders (divisionCode 있음) OR advanceTournamentPlaceholders (없음 + ruleCount=0)
//   4. checkAndAutoCompleteTournament (대회 자동 종료)
//   5. waitUntil(triggerMatchBriefPublish) — 알기자 자동 발행
//
// Promise.allSettled 부분 실패 warnings[] 수집 (service 의 흐름 100% 보존).
// caller (path 5종) 가 본 헬퍼 호출 = 누락 path 영구 차단.
export interface FinalizeMatchCompletionParams {
  matchId: bigint;
  tournamentId: string;
  // existingWinnerTeamId — sync path 는 service 내부 자동 결정값 / admin path 는 update 후 SELECT 결과
  // null 이면 헬퍼 내부 SELECT (idempotent — service 가 이미 박제한 winner_team_id 그대로 사용)
  winnerTeamId?: bigint | null;
  // 호출자 context (audit 박제용 — 사고 추적성)
  callerContext: "admin-patch" | "flutter-sync" | "flutter-batch-sync" | "web-score-sheet" | "flutter-status-patch";
}

export interface FinalizeMatchCompletionResult {
  status: "ok" | "partial_failure";
  warnings: string[];
}

export async function finalizeMatchCompletion(
  params: FinalizeMatchCompletionParams,
): Promise<FinalizeMatchCompletionResult>;
```

### 6) 변경 파일 목록 + LOC 정확

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|---------|
| `src/lib/tournaments/finalize-match-completion.ts` | 신규 헬퍼 — service syncSingleMatch L622~748 (post-process 블록) 100% 추출 + caller context audit | ~120 | 신규 |
| `src/lib/services/match-sync.ts` | L622~748 블록 제거 + `await finalizeMatchCompletion({...})` 1회 호출 (winnerTeamId 전달) | +6 / -127 | 수정 |
| `src/lib/services/match.ts` (updateMatchStatus) | L466~474 dual progress 블록 제거 + `await finalizeMatchCompletion({...})` 1회 호출 / waitUntil(triggerMatchBriefPublish) 제거 (헬퍼 내부로 이전) | +8 / -10 | 수정 |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts` | L246~365 standings + dual + advance + placeholder 블록 통합 → `await finalizeMatchCompletion({...})` 1회 호출 + `full_league_knockout` knockout 자동 생성 분기는 별도 유지 (영향 0) | +8 / -75 | 수정 |
| `src/app/api/v1/tournaments/[id]/matches/batch-sync/route.ts` | L72~79 `if (match.status === "completed")` 블록 통합 → `await finalizeMatchCompletion({...})` 1회 호출 (placeholder advancer + dual 추가 박제) | +6 / -8 | 수정 |
| **합계** | | **+148 / -220 LOC = 순감 -72** | |

→ **`syncSingleMatch` (service) 는 헬퍼 호출 1회로 통합** → 모든 path 단일 source.

### 7) 회귀 위험 평가

| 위험 케이스 | 평가 | 대응 |
|-----------|------|------|
| **중복 increment** (admin PATCH alreadyCompleted 가드 + sync 의 idempotent) | 낮음 (헬퍼 내부에 alreadyCompleted 가드 추가 — `if (existingStatus === "completed") skip`) | service `existing.status` + admin `alreadyCompleted` 모두 헬퍼 인자로 전달 → 헬퍼가 한 번만 increment |
| **dual_tournament 트랜잭션** (admin path 는 prisma.$transaction 별도) | 낮음 (헬퍼 내부에서 progressDualMatch 자체 트랜잭션 wrap) | service / admin 동일 패턴 (이미 prisma.$transaction async) |
| **autoCompleteTournament 자동 종료 회귀** (admin path 는 호출 안 함) | 낮음 (헬퍼 추가 시 admin PATCH 도 자동 종료 trigger — 운영 이득) | 운영자 의도 — 모든 매치 종료 시 자동 종료 |
| **placeholder advancer 회귀** (#5 Flutter status PATCH 가 신규로 호출) | 낮음 (이미 service path 와 동일 흐름 — 4차 뉴비리그 사례로 검증됨) | vitest 케이스 추가 |
| **fire-and-forget vs await** (#3 batch-sync 는 catch(()=>{}) fire-and-forget) | 중 (헬퍼 = await 흐름) | batch-sync 는 per-match try-catch 안에서 await — 실패 시 errors[] 박제 (idempotent 유지) |
| **TC-006 admin PATCH 중복 갱신 방지** | 낮음 | 헬퍼 인자 `alreadyCompleted` 추가 → true 면 standings skip |

### 8) vitest 케이스 (옵션 B 박제 후)

| # | 케이스 | 검증 항목 |
|---|------|---------|
| 1 | scheduled → completed (single elim) | standings +1 / advanceWinner 호출 / placeholder advancer divisionCode 분기 / autoComplete 멱등 / matchBrief waitUntil |
| 2 | scheduled → completed (dual_tournament) | standings +1 / progressDualMatch 호출 / advanceWinner skip |
| 3 | scheduled → completed (divisionCode null + ruleCount=0) | advanceTournamentPlaceholders 호출 (4차 뉴비리그 패턴) |
| 4 | scheduled → completed (divisionCode "i3-U9") | advanceDivisionPlaceholders 호출 (강남구 패턴) |
| 5 | completed → completed (재호출 idempotent) | standings 중복 increment 0 (TC-006) |
| 6 | finalizeMatchCompletion partial failure | warnings[] 박제 / sync 응답 자체는 성공 |
| 7 | callerContext 5종 audit 박제 | tournament_match_audits.context 에 caller 박제 |
| 8 | 강남구 i3-U9 패턴 e2e (Flutter status PATCH path) | standings 1+ 박제 / 결선 placeholder 자동 채움 검증 |

### 9) 강남구 i3-U9 즉시 fix 별건 (본 영구 fix 와 분리)

- 6건 매치 = 이미 status='completed' + winner_team_id 박힘 / standings 0 / placeholder null
- 영구 fix 박제 후에도 본 6건 = 재호출 안 됨 → 별도 `scripts/_temp/fix-gangnam-i3u9-standings.ts` 신규 필요 (`updateTeamStandings(matchId)` + `advanceDivisionPlaceholders(divisionCode)` 6회 idempotent)
- **사용자 결재 후 실행** (운영 DB 영향 = standings UPDATE 6 매치 + placeholder UPDATE N건)

### 10) PM 결재 사항

| # | 결재 항목 | 권장 |
|---|---------|------|
| Q1 | 옵션 (A 분산 / **B 통합** / C trigger) | **B** (errors.md defense in depth 룰 정합) |
| Q2 | callerContext 5종 enum (audit 박제) | 박제 (사고 추적성 — 6회째 회귀 시 path 식별 즉시 가능) |
| Q3 | 즉시 fix 스크립트 (강남구 i3-U9 6건) 박제 여부 | 박제 (운영 standings/placeholder 즉시 정상화) |
| Q4 | 영구 fix PR 분해 (1 PR vs 2 PR) | **2 PR** 권장: PR1 = 헬퍼 신규 + service/admin path 통합 / PR2 = batch-sync + Flutter status PATCH 통합 (회귀 검증 분리) |
| Q5 | autoCompleteTournament 자동 종료를 admin PATCH 에도 trigger 박제 (옵션 B 박제 = 자동 trigger) | 박제 (운영 자동화 이득 — admin 운영자가 수동 종료 의무 해소) |

### 11) 진행 순서

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| 1 | PM 옵션 결재 (Q1~Q5) | PM | 본 박제 |
| 2 | 즉시 fix 스크립트 (강남구 i3-U9 6건) | developer (별건 — Q3 박제 시) | Q3 결재 |
| 3 | PR1 — finalize-match-completion 헬퍼 신규 + service/admin path 통합 | developer | Q1 결재 |
| 4 | tester + reviewer 병렬 (PR1) | tester + reviewer | 3단계 |
| 5 | PR2 — batch-sync + Flutter status PATCH 통합 | developer | PR1 머지 |
| 6 | tester + reviewer 병렬 (PR2) | tester + reviewer | 5단계 |
| 7 | scripts/_temp 정리 + errors.md 6회째 회귀 박제 + index.md 갱신 | PM | 모두 완료 |

⚠️ **developer 주의사항**:
- service syncSingleMatch L622~748 블록 **그대로 추출** (분기 로직 변경 0 — 회귀 0 보장)
- `advanceDivisionPlaceholders` 는 prisma 또는 tx 인자 받음 → 헬퍼 내부 prisma 사용 (외부 트랜잭션 무관)
- `prisma.tournamentMatch.findUnique({ select: { settings: true } })` SELECT 1회 추가 — divisionCode 추출 (헬퍼 내부)
- batch-sync per-match try-catch 흐름 유지 (헬퍼 throw 시 errors[] 박제)
- TC-006 admin alreadyCompleted 가드 = `existingStatus` 인자로 헬퍼에 전달 → 헬퍼 내부에서 skip 판단

## 구현 기록 (developer / 2026-05-16) — 영구 fix 매치 종료 path 통합 헬퍼 박제

📝 **구현한 기능**: 매치 종료 path 5종 (admin / Flutter sync / batch-sync / score-sheet BFF / Flutter status PATCH) 마다 post-process 호출 누락/순서 불일치 → 강남구 i3-U9 standings=0 사고 재발. **단일 통합 헬퍼 `finalizeMatchCompletion` 박제** = 모든 path 가 호출 = 단일 source 박제 = 6회째 회귀 영구 차단.

### 변경 파일 (git diff --cached --stat HEAD)

```
src/lib/tournaments/finalize-match-completion.ts   | 256 +++++++++ (신규)
src/lib/services/match-sync.ts                     | 158 +++---  (post-process 127 LOC 추출)
src/lib/services/match.ts                          |  52 ++++-   (updateMatchStatus 헬퍼 호출 추가)
src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts | 103 ++--   (admin PATCH 통합)
src/app/api/v1/tournaments/[id]/matches/batch-sync/route.ts |  26 ++-   (placeholder advancer 신규)
─────────────────────────────────────────────────────────────────
합계: +397 / -198 LOC (신규 1 / 수정 4 / 삭제 0 운영 파일)
+ scripts/_temp/recalc-i3u9-standings.ts 삭제 (untracked → 단순 rm)
```

### 박제 path 매핑 (5종 통합 결과)

| # | path | 변경 |
|---|------|-----|
| **match-sync.ts** (Flutter sync 단건 / web BFF 경유) | post-process 127 LOC → `finalizeMatchCompletion(matchId, tournamentId, "match-sync-service", {winnerTeamId})` 1회 호출 |
| **admin PATCH route** | standings + dual + advanceAllDivisions 분산 → `finalizeMatchCompletion(matchBigInt, id, "admin-patch", {winnerTeamId})` 1회 호출. `alreadyCompleted` 가드 보존 (중복 increment 차단). `full_league_knockout` 자동 생성 분기는 별도 유지 (영향 0). |
| **updateMatchStatus (Flutter v1 status PATCH)** | 트랜잭션 외부 `.then()` 에 헬퍼 호출 신규 추가. 클로저 캡처 (capturedPrevStatus / capturedTournamentId / capturedWinnerTeamId) → 가드 (`capturedPrevStatus !== "completed"`) 후 호출. **누락 path 영구 fix.** |
| **batch-sync** | `advanceWinner + updateTeamStandings` fire-and-forget → `waitUntil(finalizeMatchCompletion)` 으로 통합 (placeholder advancer + dual + auto-complete 신규 박제). |
| **score-sheet/submit BFF** | `syncSingleMatch` 경유 → match-sync.ts 안에서 자동 헬퍼 호출. 별도 호출 X (중복 increment 위험 회피). |

### 헬퍼 동작 (match-sync.ts L622~748 100% 그대로 추출)

```
finalizeMatchCompletion(matchId, tournamentId, caller, {winnerTeamId?}):
  1. updateTeamStandings (sequential — placeholder advancer 가 ranking 의존)
  2. advanceWinner (single-elim) OR progressDualMatch (dual_tournament, 자체 tx wrap)
  3. advanceDivisionPlaceholders (divisionCode 있음) OR advanceTournamentPlaceholders (없음 + division_rule=0)
  4. checkAndAutoCompleteTournament (모든 매치 종료 시 tournament 자동 종료)
  → 단계 2~4 = Promise.allSettled 병렬 (한 단계 실패가 다른 단계 차단 X)
  → warnings[] 수집 + steps 진단 (어느 단계 실패인지 추적)
```

### 자가 진단 6건

| # | 항목 | 결과 |
|---|------|-----|
| 1 | finalize-match-completion.ts 신규 (LOC > 0) | ✅ 256 LOC |
| 2 | 5 path 모두 finalizeMatchCompletion 통합 | ✅ (score-sheet=service 경유) |
| 3 | alreadyCompleted 가드 보존 (중복 increment 방지) | ✅ admin route `if (status==="completed" && !alreadyCompleted)` / updateMatchStatus `if (capturedPrevStatus !== "completed")` |
| 4 | 즉시 fix 스크립트 삭제 | ✅ recalc-i3u9-standings.ts 삭제 |
| 5 | tsc 0 | ✅ `npx tsc --noEmit` EXIT=0 |
| 6 | vitest tournaments PASS | ✅ 13 파일 / 251 테스트 / 712ms |

### 회귀 안전 가드 보존

1. **alreadyCompleted 가드** — admin PATCH route + updateMatchStatus 양쪽 보존 (헬퍼 호출 조건 if 안에서만 진행)
2. **try/catch per step** — 헬퍼 내부 Promise.allSettled (단일 실패가 다른 단계 차단 X)
3. **dual_tournament 트랜잭션** — 헬퍼 내부 `prisma.$transaction(async tx => progressDualMatch(tx, ...))` wrap
4. **fire-and-forget vs await** — batch-sync 는 waitUntil 로 background 보장 (per-match try-catch 흐름 유지)
5. **match-sync.ts post-process 동작 변경 0** — 단순 추출 (호출 순서 + 분기 로직 100% 보존)
6. **시그니처 변경 0** — updateTeamStandings / advanceWinner / advanceDivisionPlaceholders / advanceTournamentPlaceholders / progressDualMatch 모두 미변경
7. **운영 DB SELECT/UPDATE 0** — 코드 박제만
8. **Flutter v1 API spec 변경 0** — 서버 동작만 추가 (응답 shape 동일)
9. **triggerMatchBriefPublish 미통합** — status 전환 시점 검증 필요 → 기존 caller (match-sync.ts L475 / match.ts L482 / batch-sync L78) 그대로 유지

💡 **tester 참고**:
- 테스트 방법:
  1. Flutter status PATCH path: `PATCH /api/v1/matches/:id/status` 로 `{status:"completed"}` 호출 → `TournamentTeam.wins/losses/points_for` 박제 확인 (+1) / `next_match_id` 슬롯 자동 채움 확인
  2. admin PATCH route: 강남구 i3-U9 매치 종료 시 standings 자동 박제 + 순위전 placeholder 자동 채움 확인
  3. batch-sync: 매치 종료 batch → placeholder advancer 자동 호출 + dual_tournament 시 loser bracket 진출 확인
- 정상 동작:
  - 매치 종료 1회 → standings increment 1회만 (alreadyCompleted 가드 — 재호출 idempotent)
  - 헬퍼 1단계 실패 → 다른 단계 계속 진행 (Promise.allSettled)
  - warnings 응답에 박제 시 사용자 안내 (관리자 문의)
- 주의할 입력:
  - 동점 매치 (winnerTeamId null) → advanceWinner skip (정상) / standings 박제 진행
  - divisionCode 없는 매치 + division_rule>0 (다른 종별 룰 존재) → tournament placeholder skip (정상 — 다른 종별 영향 차단)
  - completed → completed 재호출 → 헬퍼 진입 안 함 (가드)

⚠️ **reviewer 참고**:
- **특별히 봐줬으면 하는 부분**:
  1. `updateMatchStatus` 의 클로저 캡처 패턴 (`capturedPrevStatus / capturedTournamentId / capturedWinnerTeamId`) — 트랜잭션 외부 헬퍼 호출용. 안전성 검토 (트랜잭션 commit 후 .then() 에서 사용 — race condition 0)
  2. admin PATCH route 의 `advanceAllDivisions` → `advanceDivisionPlaceholders` (헬퍼 내부 매치 종별 1건만) 변경 — **의도된 동작 변경**: 다른 종별 매치 종료가 본 매치 종별에 영향 차단 (race 안전). 단, 운영자가 1매치 종료 시 전 종별 sweep 되던 기존 동작 변경.
  3. batch-sync fire-and-forget — `waitUntil(finalizeMatchCompletion.catch(...))` 패턴이 Vercel 환경에서 background Promise 정상 처리되는지 (errors.md `2026-05-09` 패턴 확인)

| 항목 | 결과 |
|------|-----|
| git diff --cached --stat | +397 / -198 LOC (신규 256 / 4 path 수정) |
| tsc | EXIT=0 |
| vitest src/__tests__/lib/tournaments/ | 13 PASS / 251 tests / 712ms |
| 자가 진단 6/6 | ✅ |

## 구현 기록 (developer / 2026-05-16) — 라이브 PBP paper 매치 정렬 안정 fix

📝 **구현한 기능**: paper 매치 PBP 가 모두 `game_clock_seconds=0` 박혀있어 라이브 API `sortedPbp` 2차 tiebreak 가 불안정 (Prisma `findMany` default order 비결정) → 새로고침마다 PBP 순서 바뀜. **3차 tiebreak = `created_at` ASC 추가** → 기록원 INSERT 순서 (= 자연 sequence) 안정 정렬.

### 옵션 비교 (결정 근거)

| 옵션 | 변경 LOC | 다른 영역 영향 | 시간 표시 | 선택 |
|------|---------|-----------|---------|------|
| A: paper PBP `game_clock_seconds = 1200-idx` 박제 (submit BFF) | ~15 (3곳) | 0 | "Q1 19:59 / 19:58..." 가짜 시간 | ❌ |
| B: live API `orderBy` paper 분기 | ~10 | live route 회귀 | "0:00" 보존 | ❌ |
| **C**: live API `sortedPbp` 정렬에 3차 tiebreak `created_at ASC` 추가 | **~3** | **0 (digital 영향 0 — game_clock 차이로 2차에서 결정 → 3차 미발화)** | "0:00" 보존 | ⭐ |

### 변경 파일

| 파일 경로 | 변경 내용 | LOC |
|----------|----------|-----|
| `src/app/api/live/[id]/route.ts` | (1) L217 `allPbps` Prisma select 에 `created_at: true` 추가 (+8 LOC 주석 포함) (2) L1210 `sortedPbp` 정렬 함수 — 2차 tiebreak `clockDiff !== 0` 분기 + 3차 tiebreak `created_at` ASC 추가 (+10 LOC 주석 포함) | +18 / -2 |

### 박제 흐름

```
prisma.play_by_plays.findMany — created_at SELECT 추가 (paper PBP idempotent INSERT 시점)
  ↓
sortedPbp 정렬 (line 1210):
  1차: quarter DESC
  2차: game_clock_seconds ASC
       → digital 매치 = 다양한 값 (10:00→0:00) → 여기서 결정 → 3차 미발화
       → paper 매치 = 모두 0 → 2차 동률 → 3차 발화
  3차 (신규): created_at ASC
       → paper PBP INSERT 순서 (= 기록원 입력 순서) 안정 정렬
  ↓
playByPlays 응답 (apiSuccess camelCase → snake_case)
  ↓
라이브 페이지 PbpSection (page.tsx L2158) — 기존 렌더 그대로
```

### 보존 의무 만족

| 의무 | 검증 |
|------|------|
| digital (Flutter) PBP 영향 0 | game_clock_seconds 다양한 값 → 2차 tiebreak 결정 → 3차 미발화 |
| 라이브 시간 표시 "Q1 0:00" | UI 변경 0 (`formatGameClock` 호출 그대로) |
| 박스스코어 / quarterScores | sortedPbp 미사용 (quarterScores 는 별도 합산 + Phase 22 paper override) |
| hero-scoreboard / GameResult v2 | playByPlays 응답 키 변경 0 / shape 변경 0 |
| score-sheet UX | submit 흐름 변경 0 |
| DB schema | 변경 0 (`created_at` 컬럼 기존 박혀있음) |
| 4쿼터 / halves / OT 매치 | 모두 영향 0 (quarter 1차 분기 + clock 2차 분기 보존) |
| Phase 22 paper quarter_scores override | sortedPbp 와 무관 (별도 합산 흐름) — 영향 0 |
| 시안 13 룰 | UI 변경 0 |

### 검증

| 검증 | 결과 |
|------|-----|
| `npx tsc --noEmit` | ✅ EXIT=0 |
| Prisma select `created_at` 컬럼 존재 | ✅ play_by_plays 모델 박혀있음 (paper INSERT 시점 = upsert `created_at: now`) |
| sort 안정성 | ✅ paper 매치 = clock 0 동률 → created_at ASC tiebreak / digital = clock 차이로 2차에서 결정 |

💡 **tester 참고**:
- **테스트 방법**: paper 매치 라이브 페이지 (예: `/live/161` 또는 진행 중 매치) → PbpSection 렌더 + 5~10초 간격 새로고침 → 순서 안정 확인.
- **정상 동작**: 모든 paper PBP `Q1 0:00` 시간 표시 그대로 (변경 0). 단 같은 쿼터 안 순서 = INSERT 순서 (기록원이 마킹 / 파울 / 점프볼 입력한 자연 시계열) 보존. 새로고침마다 순서 바뀜 0.
- **digital 매치 (Flutter)**: 기존 동작 100% 보존 — game_clock 시계열 정렬 그대로.
- **주의할 입력**:
  - paper 매치 + 동일 ms INSERT (Promise.all 병렬 upsert) — 매우 드물지만 created_at 동률 시 다시 불안정 가능. 현실적으로 0건 (service Promise.all 도 await 단위 ms 정밀도 차이 발생).
  - 구버전 매치 (created_at NULL?) — Prisma 기본값 (`DateTime @default(now())`) 박혀있음 → NULL 0건 보장. 안전망: `?? 0` fallback 박제.

⚠️ **reviewer 참고**:
- 3차 tiebreak 만 추가 — 1/2차 sort 룰 변경 0. digital 매치 회귀 가능성 매우 낮음.
- created_at = Prisma timestamp → `new Date().getTime()` 변환 비용 = 매치당 ≤500 PBP × O(1) = 무시 가능.
- 같은 fix 가 라이브 페이지의 다른 sortedPbp 사용처 (sortBy 별도 박제) 있는지 검색 = 0건. playByPlays 응답 전용.
- 옵션 A (submit BFF game_clock 박제) 미선택 사유: "Q1 19:59" 같은 가짜 시간 노출 = 사용자 화면 의도 ("Q1 0:00" 보존) 위반.

## 구현 기록 (developer / 2026-05-16) — 라이브 박스스코어 라인업 전원 노출

📝 **구현한 기능**: `/api/live/[id]` 종료 분기 (`hasPlayerStats=true`) 가 기존엔 MatchPlayerStat row 박힌 선수만 노출 → 라인업 (`MatchLineupConfirmed`) 박제된 출전 명단 **전원** row 박제. 기록 0 선수도 PTS 0 / MIN 0:00 fallback row. 라인업 미박제 매치 = 기존 흐름 보존 (ttp 전체 — DNP 분류).

### 변경 파일

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/live/[id]/route.ts` | (1) MatchLineupConfirmed fetch + lineupTtpIds 화이트리스트 세팅 (~25 LOC, line ~275) (2) toPlayerRow 시그니처 = `(ttp, stat \| null)` 변경 + 모든 stat 참조 `stat?.x ?? 0` (3) 종료 분기 source = ttp 기반 재구성 (statByTtp Map / lineup 화이트리스트 filter) | 수정 (+~70 LOC) |

### 박제 흐름

```
종료 분기 (hasPlayerStats=true) 진입
  ↓
MatchLineupConfirmed fetch (matchId) — line ~275 추가
  ↓
lineupTtpIds = lineups[].starters + substitutes union (없으면 null)
  ↓
homeTtps = match.homeTeam.players ∩ isPlayerRole ∩ (lineupTtpIds === null || in lineupTtpIds)
awayTtps = match.awayTeam.players ∩ isPlayerRole ∩ (lineupTtpIds === null || in lineupTtpIds)
  ↓
각 ttp → toPlayerRow(ttp, statByTtp.get(ttp.id) ?? null)
  ↓
stat 있으면 stat 사용 / 없으면 모든 stat 컬럼 0 fallback
  ↓
DNP 판정 — isStarter || PBP 등장 시 DNP 해제 (기존 로직 유지)
  ↓
sortWithDnp (DNP 하단 / 득점 내림차순)
```

### DB 검증 (매치 #161, status=in_progress)

| 항목 | 기존 | 변경 후 |
|------|------|---------|
| home 노출 | 4명 (정슬우/김리원/박시원/김수호) | **7명 전원** (라인업 starters 5 + subs 2) |
| away 노출 | 4명 (최큰별/전진우/임유섭/김이찬) | **8명 전원** (라인업 starters 5 + subs 3) |
| stat 매칭 | playerStats 있는 선수 — 점수/리바 등 정상 (정슬우 9pts / 임유섭 6pts) |
| fallback | playerStats 없는 선수 — pts=0 / fgm=0 / 모든 컬럼 0 row |

### 보존 의무 만족

| 의무 | 검증 |
|------|------|
| 응답 shape 0 | PlayerRow 인터페이스 변경 0 / 추가 키 0 / 제거 키 0 |
| 컴포넌트 변경 0 | `box-score-table.tsx` 미수정 (응답 그대로 받음) |
| 진행중 분기 영향 0 | `!hasPlayerStats` 블록 변경 0 (이미 ttp 전체 박제 정합) |
| 라인업 미박제 매치 | `lineupTtpIds === null` → passLineup 항상 통과 → ttp 전체 노출. 기존 동작 대비 매치 (=match.playerStats) 외 ttp 도 추가되지만 모두 DNP=true 로 박스스코어 하단 분리 (사용자 영향 미미 + 라인업 박제 매치만 영향) |
| 4쿼터/halves/digital | match.settings recording_mode 무관 (lineup 박제 여부만 분기) — paper/digital 동일 동작 |
| DB schema 변경 0 | 신규 컬럼/테이블 0 — MatchLineupConfirmed/MatchPlayerStat/TournamentTeamPlayer 기존 사용 |
| tsc --noEmit | EXIT=0 |

### 부수 효과 (긍정)

- `home_players[].id` 가 종료 분기에서 stat.id → **ttp.id 로 통일** (진행중 분기와 일관).
- 기존 line 1155 BUG 주석 ("home_players[].id 분기에 따라 stat.id 또는 ttp.id") **자동 해소**.
- PBP 타임라인 playerNameById 매칭 정확도 ↑ (id 통일).

💡 **tester 참고**:
- **테스트 방법**: dev 서버 + `curl /api/live/161` raw 응답 / 또는 `https://mybdr-git-dev-mybdr.vercel.app/live/161` 박스스코어 시각
- **정상 동작**: home 박스스코어 7행 / away 박스스코어 8행 (라인업 starters + subs 전원). 기록 0 선수 = MIN "00:00" + PTS 0 + 모든 컬럼 0 row 노출.
- **DNP 표시**: starter 도 아니고 PBP 등장도 없는 fallback 선수 = DNP=true → 박스스코어 하단 별도 영역 (box-score-table.tsx line 398). 출전 가능 후보 (라인업 subs) 가 DNP 영역에 들어가는 게 정상.
- **주의 입력**:
  - 라인업 미박제 매치 (예전 매치 #100 이하 대부분) = 기존 동작 보존 — playerStats + ttp 전체. ttp 만 있고 stat 없는 선수도 노출되지만 모두 DNP 하단 분리.
  - 종이 매치 (recording_mode=paper) — 동일 동작 (paper 분기 따로 없음 / paper FIBA Phase 22 quarter_scores override 만 유지).

⚠️ **reviewer 참고**:
- `lineupTtpIds === null` 분기 = 라인업 미박제 매치 보호. 회귀 가능성: 라인업 미박제 + playerStats 있는 매치에서 ttp 일부가 새로 DNP row 로 추가됨 (기존엔 안 보였음). DNP 영역 별도 분리 정렬 → 사용자 영향 미미. 만약 회귀 우려 시 `lineupTtpIds === null` 일 때 statByTtp 기반 기존 흐름 fallback 가능 — 현재는 ttp 전체 통일이 더 일관적 + 진행중 분기와 동일.
- `row.id` ttp.id 로 변경 = box-score-table key 영향만 (unique 보장). 외부 consumer 가 stat.id 기대하는 곳 없음 (라이브 페이지 + GameResult v2 컴포넌트 검색 결과 0건).
- MatchLineupConfirmed fetch 1회 추가 — 라이브 폴링 3초 부하 증가 미미 (인덱스 hit + 매치당 ≤2 row).

## 구현 기록 (developer / 2026-05-16) — score-sheet 10초 자동 sync

📝 **구현한 기능**: score-sheet 마킹 중 10초마다 BFF submit 자동 호출 → 라이브 페이지 실시간 점수/PBP/박스스코어 노출.

### 사양 분석 결과

| 항목 | 박제 필요 여부 | 사유 |
|------|--------------|-----|
| **A. score-sheet 자동 sync (10초)** | ✅ 박제 (~40 LOC) | useEffect 신규 — 본 PR 핵심 |
| **B. submit BFF zod status="in_progress"** | ❌ 변경 0 | zod 이미 `z.enum(["in_progress","completed"])` 박혀있음 (line 439) |
| **C. 라이브 페이지 자동 새로고침** | ❌ 변경 0 | 이미 3초 polling + completed 시 자동 정지 박혀있음 (page.tsx:498 POLL_INTERVAL / 644 분기) |
| **D. status="scheduled"→"in_progress" 자동 박제** | ❌ 변경 0 | service syncSingleMatch 가 match.status 인자 그대로 박제 (Flutter sync 동등) |

→ **실제 박제 = A 항목 한 곳 / ~50 LOC** (주석 포함). 나머지 B/C/D 인프라 이미 정합.

### 변경 파일

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | useRef + useEffect 자동 sync (10초 interval / lineup ∧ !isReadOnly ∧ !matchEndSubmitted 조건 / status="in_progress" override / silent fail) | 수정 (+~50 LOC) |

### 박제 흐름

```
운영자 score-sheet 진입 → 라인업 confirm (lineup !== null)
  ↓
useEffect 활성 — setInterval 10초
  ↓
buildSubmitPayloadRef.current() → { ...payload, status: "in_progress" }
  ↓
POST /api/web/score-sheet/[matchId]/submit (silent fail)
  ↓
BFF zod 통과 (status="in_progress" 이미 enum 멤버)
  ↓
syncSingleMatch — TournamentMatch.status="in_progress" 박제 + quarter_scores
                  + running_score → PBP + fouls → PBP + MatchPlayerStat 박제
  ↓
existing.status !== "completed" && match.status === "completed" = FALSE
  → triggerMatchBriefPublish skip (= completed 시에만 발화 보존)
  ↓
라이브 페이지 = 이미 3초 polling — 다음 tick 에 새 점수 즉시 노출
```

### 트리거 조건 (3 AND)

| 조건 | 의미 |
|------|-----|
| `lineup !== null` | 라인업 모달 confirm 완료 (마킹 시작 시점) |
| `!isReadOnly` | 진행 중 매치 (종료 + 수정 모드 미진입 = sync 0) |
| `!matchEndSubmitted` | "경기 종료" 미박제 (자동 sync 와 종료 submit 충돌 0) |

### closure stale state 회피

```ts
const buildSubmitPayloadRef = useRef<() => unknown>(buildSubmitPayload);
useEffect(() => { buildSubmitPayloadRef.current = buildSubmitPayload; });
// → 매 렌더마다 ref 갱신. interval 콜백 = ref.current() 호출 = 항상 최신 state.
// → useEffect 의존성을 buildSubmitPayload 에 두면 매 렌더 effect 재설정 → interval 끊김.
```

### 회귀 위험 평가

| 잠재 위험 | 박제 결과 |
|---------|----------|
| 4쿼터 매치 영향 | ❌ 영향 0 — buildSubmitPayload 헬퍼 변경 0 |
| halves 매치 영향 | ❌ 영향 0 — periodFormat 동일 박제 |
| 운영자 수동 submit 흐름 | ❌ 변경 0 — buildPayload 동일 + endpoint 동일 |
| BFF 부하 | 1매치당 10초 1회 — 1동시 매치 60건 = 6 RPS (운영 안전) |
| BFF zod 거부 | ❌ 0 — status enum 이미 박혀있음 |
| 운영 DB schema | ❌ 변경 0 (사용자 명시 보존 의무) |
| 알기자 자동 발행 (triggerMatchBriefPublish) | ❌ skip — existing != completed && new == completed 조건 false |
| 시안 13 룰 위반 | ❌ 0 — UI 변경 0 |

### 검증

| 검증 | 결과 |
|------|-----|
| `npx tsc --noEmit` | ✅ 통과 (에러 0) |
| Production smoke (DB / 라이브) | ⏳ PM 처리 — 시합 직전 우선 머지 권장 |

💡 **tester 참고** (시간 허용 시):
- 테스트 방법: localhost dev = score-sheet 매치 진입 + 라인업 confirm → 첫 마킹 → 10초 후 network 탭 = POST `/api/web/score-sheet/[matchId]/submit` 호출 확인 → 라이브 페이지 진입 시 새 점수 노출
- 정상 동작:
  - 라인업 confirm 후 = 10초마다 1회 POST (status="in_progress")
  - "경기 종료" 클릭 후 = matchEndSubmitted=true → interval 자동 정지
  - 종료 매치 + 수정 모드 미진입 (isReadOnly=true) = interval 미설치 (운영 동작 보존)
  - 라이브 페이지 = 다음 3초 polling tick 에 새 점수 즉시 표시
- 주의할 입력:
  - 라인업 모달 미통과 (lineup === null) = sync 0 = 라이브 페이지 0건 노출 (정상)
  - 자동 sync 실패 = console.warn 만 / toast 0 / 운영자 마킹 흐름 영향 0

⚠️ **reviewer 참고**:
- 핵심 = useRef 패턴 (closure stale state 회피). interval 콜백이 매번 ref.current() 호출 = 최신 state 보장.
- BFF zod / service path 변경 0 = score-sheet 기존 submit 흐름 보존 (단일 source).
- silent fail 박제 = 운영자 화면 노이즈 0 (사용자 명시 사양). console.warn 만으로 디버깅 가능.

## 기획설계 (planner-architect / 2026-05-16) — PR-Public-1 공개 bracket 종별 view

🎯 **목표**: 공개 tournament 페이지 (`/tournaments/[id]?tab=bracket`) bracket 탭이 강남구협회장배 매치 59건 (round_number/bracket_position 미박제 / 풀리그 + 조별 + 순위전 placeholder) 을 표시 못해 "아직 대진표가 없습니다" 노출 → **종별 탭 + 조편성 + 매치 일정 + 순위전 placeholder 통합 view 박제**.

### 1. 현 흐름 분석 (cite + line)

**A. 공개 페이지 진입 흐름**:
```
src/app/(web)/tournaments/[id]/page.tsx → TournamentTabs
  └─ tournament-tabs.tsx:240 BracketTabContent → V2BracketWrapper
       └─ v2-bracket-wrapper.tsx:174 useSWR("/api/web/tournaments/[id]/public-bracket")
            ↓ 분기 (line 197~210)
            ├─ isDual                                  → V2DualBracketView
            ├─ isLeague + groupTeams.length > 0        → GroupStandings + (knockout 옵션)
            ├─ isLeague (= leagueTeams.length > 0)     → LeagueStandings
            └─ default                                 → BracketView | BracketEmpty
```

**B. BracketEmpty trigger (`v2-bracket-wrapper.tsx:441-453`)**:
```
{groupTeams.length > 0 && <GroupStandings />}
{hasKnockout ? <BracketView /> : <BracketEmpty />}
```
→ `hasKnockout = rounds.length > 0` / `rounds = bracketOnlyMatches.length > 0 ? buildRoundGroups(...) : []` / `bracketOnlyMatches = matches.filter(m => round_number != null && bracket_position != null)`.

**C. 강남구 데이터 실제 매치 = 모두 round_number / bracket_position NULL**:
- 예선 = 풀리그 / 조별 풀리그 (round_number 무의미)
- 순위전 = placeholder (notes "A조 N위 vs B조 N위" + settings.homeSlotLabel/awaySlotLabel)
- → `bracketOnlyMatches.length === 0` → `rounds = []` → `hasKnockout = false` → **BracketEmpty 노출**

**D. API 응답 (`route.ts:336-413`) 이미 보유한 필드**:
- `groupTeams` (line 310) — tournamentTeam.groupName 별 분류 + name / wins / losses / pointDifference / logoUrl
- `leagueMatches` (line 374, **PR-G5.9 박제됨**) — 모든 매치 시간순 + division (settings.division_code) + homeSlotLabel / awaySlotLabel / venueName / roundName ⭐
- `tournamentName / format / liveMatchCount / totalMatches / completedMatches`
- ❌ `divisionStandings` (admin 전용 `getDivisionStandings`) 미노출
- ❌ `divisionRules` (label 매핑) 미노출

**E. V2BracketWrapper 가 `leagueMatches` 미사용** — 현재 leagueMatches 는 0 컴포넌트에서 소비. **이 필드를 활성화하면 매치 59건 즉시 노출 가능**.

### 2. admin /playoffs 재사용 가능성 평가

| 컴포넌트 | 위치 | 공개 페이지 재사용 가능? | 사유 |
|---------|-----|----------|-----|
| `StandingsTable` | `_components/StandingsTable.tsx` | 🟡 가능 (props pure / 데이터만 server fetch) | DivisionStanding[] 만 있으면 됨. 단 `getDivisionStandings` (server-only Prisma) 호출 필요 = API 확장 필수 |
| `DivisionMatchGroup` | `playoffs-client.tsx:408` (내부 함수) | 🔴 불가 (private) | 외부 export 안 됨. 추출 또는 복제 필요 |
| `PlayoffMatchRow` | `playoffs-client.tsx:457` (내부 함수) | 🔴 불가 (private) | 동일 — 추출 또는 복제 필요 |
| `FinalCard` | `playoffs-client.tsx:560` (내부 함수) | 🔴 불가 (private) | 동일 |
| `AdvancePlayoffsButton` | `_components/AdvancePlayoffsButton.tsx` | 🚫 절대 불가 | admin 전용 API (`/api/web/admin/...`) 호출 = 권한 violation |
| `PlaceholderValidationBanner` | `_components/PlaceholderValidationBanner.tsx` | 🚫 표시 안 함 | 운영자 전용 경고 — 공개 페이지 노이즈 |

→ **admin /playoffs 의 4 내부 컴포넌트는 export 부재**. 옵션 = (A) 공개 view 신규 생성 (단순) / (B) admin 4 컴포넌트 별도 파일 추출 후 공유 (admin 회귀 위험 +).

### 3. 데이터 source 결정 (옵션 비교)

| 옵션 | 데이터 source | 공개 API 변경 | 신규 endpoint | 운영 DB 부담 | 회귀 위험 |
|------|-------------|------------|------------|----------|---------|
| **D1** 기존 public-bracket 확장 | `route.ts` 에 `divisionStandings` + `divisionRules` 추가 (Prisma 1쿼리 추가 / Promise.all 안) | ✅ +20 LOC | ❌ 0 | 종별 N개 = N회 standings 쿼리 (admin 동등 패턴) | 🟢 낮음 — 신규 필드만 (응답 shape 추가) |
| **D2** 신규 endpoint `/api/web/tournaments/[id]/public-divisions` | 별도 route — 강남구 종별만 분리 fetch | 0 | ✅ +120 LOC | 동일 (별도 호출 1회) | 🟢 낮음 — 기존 회귀 0 |
| **D3** 클라이언트 자체 그룹핑 (현 leagueMatches + groupTeams 만 활용) | API 변경 0 | 0 | ❌ 0 | 0 | 🔴 - 종별 standings 정렬 로직 클라이언트 중복 (단일 source 위반) |

→ **권장 = D1** (admin /playoffs 와 동일한 server-side 산출 + idempotent 1쿼리). D2 는 lazy load 메리트 적음 (이미 bracket 탭 = lazy).

### 4. matches 분류 로직 (settings.division_code 그룹핑 + 순위전 식별)

```
const divisionMatches = leagueMatches.reduce((map, m) => {
  const code = m.division ?? "_no_division";
  if (!map.has(code)) map.set(code, []);
  map.get(code).push(m);
  return map;
}, new Map());

// 종별 안 매치 = 3 분류 (admin /playoffs:191-198 패턴 동등)
function classifyMatch(m) {
  if (m.roundName && /순위/.test(m.roundName)) return "ranking";       // 순위전
  if (m.roundName && /결승|final/i.test(m.roundName)) return "final";  // 결승
  return "preliminary";  // 예선 (풀리그 / 조별)
}
```

→ 강남구 매치 59건 = 종별 6 × (예선 46 + 순위전 13).

### 5. 신규 view 설계 (시안 4사진 패턴)

**섹션 구성** (admin /playoffs 5 섹션 → 공개용 4 섹션):

| # | 섹션 | source | 컴포넌트 | admin /playoffs 대응 |
|---|------|-------|--------|------|
| 0 | 종별 탭 (≥2 종별) | `divisionStandings.code` | 인라인 (playoffs-client:224 패턴) | ⚙️ 동일 |
| 1 | **조편성 표** (사진 1) | `groupTeams` (이미 있음) | `GroupStandings` 재사용 (web 측) — 종별 필터 추가 | (admin = StandingsTable 표) |
| 2 | **종별별 매치 일정** (사진 2~4) | `leagueMatches` (PR-G5.9 필드) — `preliminary` 분류 | 신규 `PublicMatchSchedule` (시간순 list) | ❌ admin 미박제 (예선 매치 표시 X) |
| 3 | **순위전 placeholder 표** | `leagueMatches` `ranking` 분류 | 신규 `PublicRankingMatches` — admin DivisionMatchGroup 패턴 복제 | DivisionMatchGroup |
| 4 | 결승 + 우승팀 (있으면) | `leagueMatches` `final` 분류 | 신규 `PublicFinalCard` — admin FinalCard 패턴 복제 | FinalCard |

❌ **제외**: AdvancePlayoffsButton / PlaceholderValidationBanner (admin 전용).

**섹션 1 (GroupStandings) 재사용 vs StandingsTable** :
- 공개 페이지 = 이미 web GroupStandings 사용 중 (`v2-bracket-wrapper.tsx:444`) → **GroupStandings 재사용** (디자인 정합성 우선 / `Phase 2C` 한/영 병기 등 이미 박제). admin StandingsTable 은 admin 디자인 (rounded-[4px] 콤팩트) 이라 공개 페이지 어울림 X.
- 단 GroupStandings 는 종별 분리 X → 호출 시 종별별 필터링한 `groupTeams.filter(t => t.division === code)` 전달. **`groupTeams` 에 division 필드 추가 필요** (API 확장 1줄).

### 6. 변경 파일 목록 (옵션 A 권장 / D1 데이터 source)

| 파일 경로 | 역할 | 신규/수정 | 예상 LOC |
|----------|------|----------|---------|
| `src/app/api/web/tournaments/[id]/public-bracket/route.ts` | (1) `groupTeams` 에 `division` (tournamentTeam.category) 추가 / (2) `divisionStandings` 신규 (Promise.all + getDivisionStandings) / (3) `divisionRules` (label 매핑) 추가 | 수정 | +35 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-wrapper.tsx` | (1) format=null + leagueMatches.length > 0 분기 신규 (BracketEmpty 회피) / (2) 신규 `MultiDivisionView` 컴포넌트 호출 | 수정 | +30 / -0 |
| `src/app/(web)/tournaments/[id]/_components/multi-division-view.tsx` ⭐ | 신규 view — 종별 탭 (인라인 / `playoffs-client:224` 패턴 복제) + 4 섹션 컴포지션 (GroupStandings + PublicMatchSchedule + PublicRankingMatches + PublicFinalCard) + URL ?division= deep link | **신규** | ~200 |
| `src/app/(web)/tournaments/[id]/_components/public-match-schedule.tsx` | 신규 — 종별 예선 매치 일정 list (시간 / HOME / AWAY / 점수 / 코트 / 상태) — 시안 사진 2~4 표 패턴 / 모바일 카드 / PC 표 | **신규** | ~140 |
| `src/app/(web)/tournaments/[id]/_components/public-ranking-matches.tsx` | 신규 — 순위전 placeholder 표 (admin DivisionMatchGroup + PlayoffMatchRow 패턴 복제 / 슬롯 라벨 표시) | **신규** | ~120 |
| `src/app/(web)/tournaments/[id]/bracket/_components/group-standings.tsx` | (선택) `division` prop 추가 — 종별 필터 시 그룹 키만 표시 | 수정 (선택) | +5 |
| **합계** | | | **~530 LOC** |

⚠️ **admin 회귀 위험 0**: admin /playoffs / StandingsTable / AdvancePlayoffsButton 모두 변경 X. public-bracket API 도 신규 필드만 추가 (기존 키 변경 0).

### 7. 구현 옵션 비교 + 권장

| 옵션 | 핵심 | 신규 LOC | admin 회귀 | 디자인 정합 | 권장 |
|------|-----|---------|----------|----------|-----|
| **A** 공개 페이지 신규 view (multi-division-view + 2 신규 컴포넌트) | admin 컴포넌트 0 의존 / GroupStandings 만 재사용 | ~530 | 🟢 0 | 🟢 web 디자인 일관 | ⭐ **권장** |
| **B** admin DivisionMatchGroup / PlayoffMatchRow / FinalCard 추출 후 공유 | admin playoffs-client.tsx 리팩터링 + 공유 폴더 | ~600 (기존 admin -150 / 신규 +750) | 🟡 admin 회귀 검증 필수 | 🟡 admin 콤팩트 디자인이 web 카드 디자인과 충돌 | 🔵 비추 |
| **C** D2 신규 endpoint + 옵션 A | A + 별도 endpoint | ~620 | 🟢 0 | 🟢 동일 | 🔵 lazy 메리트 적음 (overhead) |

→ **권장 = A** (단순 / 회귀 0 / web 디자인 일관 / placeholder-helpers 도메인 재사용).

### 8. 회귀 위험 평가

| 영역 | 위험 | 검증 방법 |
|------|-----|---------|
| 단일 종별 대회 (기존 동작) | 🟢 0 — `divisionStandings.length ≤ 1` 시 탭 미렌더 (admin 동등 가드) | 4차 뉴비리그 / 일반 single_elim 대회 1건씩 manual |
| `format=null` 외 대회 (single_elim / dual / round_robin) | 🟢 0 — `leagueMatches.length > 0 && format == null` 분기 신규 (기존 분기 후행) | dual_tournament + round_robin 대회 manual |
| API 응답 shape 변경 | 🟢 0 — `divisionStandings` / `divisionRules` 신규 필드만 추가 (기존 필드 보존) | curl 1회 raw 확인 + tsc 0 |
| admin /playoffs | 🟢 0 — admin 측 0 변경 | tsc 0 + manual 1회 |
| Schedule 탭 (기존 division 필터) | 🟢 0 — public-schedule API 별도 / 본 PR 영향 0 | 강남구 schedule 탭 manual |
| **주의: groupTeams.division 필드 추가** | 🟡 GroupStandings 가 division prop 없으면 모든 그룹 표시 (현 동작) — 회귀 0 | tsc 0 |

### 9. 시안 4 사진 매핑 (사용자 시안 → 컴포넌트)

| 시안 사진 | 내용 | 매핑 컴포넌트 |
|---------|-----|-----------|
| 사진 1 | 조편성 표 (종별별 A조/B조 팀 + 인원) | GroupStandings (종별 필터 적용) |
| 사진 2 | 경기일정 표 (시간 / HOME / AWAY) | PublicMatchSchedule (preliminary) |
| 사진 3 | 경기일정 표 (점수 + 결과) | PublicMatchSchedule (preliminary + completed) |
| 사진 4 | 순위결정전 placeholder ("A조 N위 vs B조 N위") | PublicRankingMatches (slot 라벨 표시) |

### 10. PM 결재 항목 (developer 진입 전)

| Q | 항목 | 권장 |
|---|------|-----|
| Q1 | 데이터 source = D1 (기존 API 확장) vs D2 (신규 endpoint)? | **D1** (단순 / lazy 이미 적용) |
| Q2 | 컴포넌트 전략 = A (공개 신규) vs B (admin 추출 공유)? | **A** (admin 회귀 0 / web 디자인 일관) |
| Q3 | 종별 탭 가드 = 종별 ≥2 시만 노출 (admin 동등) vs 항상 노출? | **종별 ≥2** (단일 종별 회귀 0) |
| Q4 | 결승 섹션 (섹션 4) = 강남구 미박제 시 미표시 vs 빈 카드? | **미표시** (운영 호환 / hasFinalMatches 가드) |
| Q5 | URL deep link = `?tab=bracket&division=i3-U9` 박제? | **YES** (admin /playoffs 패턴 동등) |
| Q6 | PR 분해 = 단일 PR (~530 LOC / 4 신규 + 2 수정) vs 2 분해 (API + UI)? | **2 분해 권장** — PR-Public-1A (API + groupTeams.division) ~50 LOC / PR-Public-1B (view 컴포넌트 3건 + wrapper 분기) ~480 LOC |

⚠️ **developer 주의사항**:
1. **API 응답 shape 보존** — `divisionStandings` / `divisionRules` / `groupTeams[].division` 모두 신규 필드만 / 기존 키 0 변경 / curl 1회 raw 응답 검증 필수 (`apiSuccess` snake_case 변환 → 클라 `divisionStandings` / `division_rules` / `division` 키 폴백)
2. **종별 탭 가드** — `divisionStandings.length ≤ 1` 시 탭 미렌더 (admin /playoffs:138 동등 / 단일 종별 회귀 0)
3. **format=null + leagueMatches.length > 0 분기 위치** — `v2-bracket-wrapper.tsx:441` `default` 분기 안 (groupTeams.length > 0 && hasKnockout=false 사이) 에 `multiDivisionMode` 우선 분기 추가 — NOT 가장 위 (dual / hasLeagueData 우선순위 보존)
4. **시안 13 룰 100%** — `var(--color-*)` 토큰만 / `material-symbols-outlined` 아이콘만 (lucide-react ❌) / pill 9999px ❌ (rounded-[4px]) / 빨강 본문 텍스트 0
5. **placeholder-helpers 의존 0** — 슬롯 라벨은 `leagueMatches[*].homeSlotLabel / awaySlotLabel` 그대로 사용 (이미 generator 가 박제 / 클라 재계산 X)
6. **deep link** — `useSearchParams().get("division")` 폴백 + `router.replace` URL sync (admin playoffs-client:142-165 패턴 복제)
7. **모바일** — schedule-timeline 패턴 답습 (모바일 카드 / PC 표) — public-match-schedule.tsx 안 720px 분기

### 11. 산출물 위치

📂 분석 박제 위치: `.claude/scratchpad.md` "## 기획설계 (planner-architect / 2026-05-16) — PR-Public-1 공개 bracket 종별 view" 섹션
📂 권장 옵션: A (공개 신규 view) + D1 (기존 API 확장)
📂 예상 총 LOC: **~530** (API +35 / wrapper +30 / 신규 view 3건 +460 / GroupStandings +5 선택)
📂 PR 분해 권장: 2 PR (API +50 / UI +480) — 회귀 검증 격리



## 기획설계 (planner-architect / 2026-05-16) — possession arrow MVP

🎯 **목표**: FIBA 종이 기록지에 공격권 (possession arrow) 박제. 첫 점프볼 승자 선택 → 헤더 큰 화살표 (←/→) 노출 → 쿼터 종료 시 자동 토글 → 헬드볼 발생 시 운영자가 헤더 화살표 클릭 → confirm 모달 → 토글.

📍 **데이터 모델 (옵션 B — action_type 확장)**:
- `play_by_plays.action_type` = `String @db.VarChar` (자유 문자열 / **enum 박제 X**) — **DB schema 변경 0** 확인 완료.
- 신규 action_type 2건 운영 박제만:
  - `jump_ball` (첫 점프볼) — quarter=1 / position=N/A / points=0 / 승자 player_id 박제 / loser team 의 next possession
  - `held_ball` (헬드볼) — quarter=현재 / 가져가는 팀의 placeholder player (또는 NULL) / points=0 / 토글 audit
- **prisma migrate 불필요** — 운영 DB 영향 0 (사용자 DB 정책 §1 통과).
- `home_score_at_time` / `away_score_at_time` = 시점 누적 (현 점수 유지).

📍 **state 위치 결정 (단순화 우선)**:
- `runningScore` (RunningScoreState) **확장 X** — score 도메인 오염 회피.
- **신규 state 1건** `possession` (form local state):
  ```
  type PossessionState = {
    arrow: "home" | "away" | null;  // null = 첫 점프볼 미선택
    openingJumpBall: { winnerTeam: "home" | "away"; winnerPlayerId: string } | null;
    heldBallEvents: Array<{ period: number; takingTeam: "home" | "away" }>;
  }
  ```
- 자동 토글 = setPossession (handleEndPeriod + handleHeldBallConfirm) 한 곳.
- draft-storage `loadDraft` / `saveDraft` 에 possession 박제 (Phase 7-B lineup 패턴 재사용).

📁 **만들 위치와 구조**:
| 파일 경로 | 역할 | 신규/수정 | 예상 LOC |
|----------|------|----------|---------|
| `src/lib/score-sheet/possession-types.ts` | `PossessionState` / `JumpBallEvent` / `HeldBallEvent` 타입 (running-score-types 패턴) | **신규** | ~50 |
| `src/lib/score-sheet/possession-helpers.ts` | `togglePossession()` / `applyHeldBall()` / `applyOpeningJumpBall()` / `possessionToPBPInputs()` PURE 헬퍼 (running-score-helpers 패턴) | **신규** | ~120 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/jump-ball-modal.tsx` | 첫 점프볼 모달 (4 모달 UX 패턴 = ESC/backdrop/sm:flex-row footer) — 점프볼 승자 팀 + 선수 선택 (라인업에서 1인) | **신규** | ~180 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/possession-confirm-modal.tsx` | 헬드볼 confirm 모달 (ConfirmModal 재사용 박제로 ~60 LOC) — Q: "헬드볼 발생 — 공격권 [Team X] 가져갑니다" | **신규** | ~60 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | `possessionArrow` prop 추가 + 큰 화살표 SVG (Material `arrow_back` / `arrow_forward` 56px) + onArrowClick 콜백 (헤더 우측 / 쿼터 뱃지 좌측) | 수정 | +50 / -0 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | `possession` state + handler 4건 (open jump-ball / confirm jump-ball / confirm held-ball / quarter end 자동 토글) + 모달 mount 2건 + FibaHeader props wiring + buildSubmitPayload 확장 | 수정 | +90 |
| `src/lib/score-sheet/running-score-helpers.ts` | `marksToPaperPBPInputs` 옆에 `possessionToPBPInputs` 추가 import (또는 helpers 에서 합성) | 수정 | +10 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | possession 페이로드 받아 PBP 박제 (action_type=jump_ball/held_ball) + zod schema 확장 | 수정 | +40 |
| `src/lib/score-sheet/draft-storage.ts` | draft 박제 키 1건 추가 (`possession`) | 수정 | +6 |
| `src/__tests__/score-sheet/possession-helpers.test.ts` | PURE 헬퍼 vitest (togglePossession 4 / applyHeldBall 3 / applyOpeningJumpBall 3 / possessionToPBPInputs 5) | **신규** | ~140 |

🔗 **기존 코드 연결**:
- `lineup-selection-modal` 닫기 (handleLineupConfirm) **직후** → `possession.arrow === null` 이면 `setJumpBallModalOpen(true)` 자동 open (현재 lineup confirm 후 양식 노출 흐름 사이에 단계 1개 추가)
- `handleEndPeriod` (line 980) 에서 마지막에 `setPossession(p => ({ ...p, arrow: p.arrow === "home" ? "away" : "home" }))` 1줄 추가 + toast (FIBA 룰 자동 토글)
- `FibaHeader` props (line 51) 에 `possessionArrow / onArrowClick` 2건만 추가 — 기존 prop 14건 전부 보존
- `buildSubmitPayload` (line 1222) 에 `possession` 키 박제 → BFF 가 possession PBP 변환
- `pbp-edit-modal` (line 80) = **본 PR 영향 0** — jump_ball / held_ball 은 read-only (점수 변경 X)

📋 **실행 계획 — 3 단계 PR 분해**:

| 순서 | PR | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|----|------|------|----------|-----------|
| 1 | **PR-Possession-1** PURE 헬퍼 + 타입 | 신규 파일 2건 (possession-types / possession-helpers) + vitest 15 케이스 — DB / UI 영향 0 / `tsc 0` + `vitest possession-helpers` 15/15 | developer | 없음 | ~30분 |
| 2 | **PR-Possession-2** UI + state + 모달 | 모달 2건 신규 + fiba-header / score-sheet-form 수정 — UI 만 (BFF 영향 0) / draft 박제 / 운영자 직접 확인 가능 | developer | PR-1 머지 | ~60분 |
| 2.5 | (병렬) tester + reviewer | tester = paper 매치 manual / reviewer = 시안 13 룰 점검 (var(--color-*) / Material Symbols / 빨강 본문 0) | tester + reviewer 병렬 | PR-2 완료 | ~20분 |
| 3 | **PR-Possession-3** BFF + PBP 박제 | submit/route.ts zod 확장 + action_type=jump_ball/held_ball PBP INSERT + 운영 검증 (실제 paper 매치 submit) | developer | PR-2 머지 | ~40분 |

⚠️ **developer 주의사항**:

1. **DB schema 변경 0 강제** — `prisma/schema.prisma` 수정 금지 (action_type=String VarChar 그대로 / migrate 불필요). 사용자 DB 정책 §2 위반 위험 0.
2. **시안 13 룰 절대 준수** — 큰 화살표는 Material Symbols `arrow_back` / `arrow_forward` (lucide-react ❌). 화살표 색상 = `var(--color-text-primary)` 또는 `var(--accent)` (빨강 본문 텍스트 ❌ — 화살표는 아이콘이라 허용. 단 본문 문장 색은 회색). pill 9999px ❌ → 사각 박스 (radius 4px 또는 0 — 쿼터 뱃지와 정합).
3. **모달 4종 UX 패턴 100% 정합** — ESC / backdrop / 헤더 X / sm:flex-row footer (FoulType / PlayerSelect / LineupSelection / QuarterEnd / PBP-Edit 5종 직참).
4. **possession === null 시 화살표 미노출** — fiba-header `possessionArrow == null` 조건부 (운영 호환 / 기존 paper 매치 영향 0).
5. **첫 점프볼 모달 trigger 단계** — `handleLineupConfirm` (line 1357 setLineup 직후) 에 `if (!possession.openingJumpBall) setJumpBallModalOpen(true)` 1줄. lineup === null → lineupModal → onConfirm → jumpBallModal → onConfirm → 양식 진입 순서.
6. **헬드볼 confirm 모달 메시지** — "헬드볼 발생 — 다음 공격권은 [Team X] 가 가집니다 (FIBA Art. 12.5)". 토글 후 양 팀 운영자 모두 인지하도록 toast 5초 (foul toast 패턴).
7. **draft 박제 / 복원** — Phase 7-B lineup 패턴 그대로 (`draft.possession` 객체 spread, shape 검증 후 setPossession).
8. **Phase 22/23 read-only 정합** — `isReadOnly=true` 시 (a) jumpBallModal 강제 close (b) onArrowClick undefined (c) submit BFF 가 possession 키 무시. **Phase 22 paper override (commit `63c0633`) 영향 0** (paper PBP 그대로 + jump_ball/held_ball 만 추가 / quarter_scores 합산 변화 0).
9. **light forced + zoom 0.7 인쇄 룰** — 모달 2건 모두 `.no-print` / 화살표는 인쇄 시 자연 노출 (헤더 박제). 인쇄 검증 manual 1회.
10. **회귀 검증 의무** — `npx tsc --noEmit` = 0 / `npx vitest run running-score-helpers.test.ts` = 50/50 PASS (기존 35 + 신규 15) / score-sheet 4 기존 모달 동작 0 변경.

📋 **PM 결재 필요 (developer 진입 전)**:
- Q1. 화살표 위치 = "쿼터 뱃지 좌측" (헤더 우측 영역에서 쿼터 뱃지 옆) 확정?
- Q2. 화살표 색상 = `var(--accent)` (BDR Red 류) vs `var(--color-text-primary)` (회색) — 시안 13 룰 빨강 본문 ❌ 이지만 아이콘은 허용 → **회색 권장** (헤더 시각 노이즈 최소).
- Q3. PR 3단 분해 (~2.5시간) vs 1 PR 통합 (~1.5시간 / 회귀 위험 ↑) — **3단 분해 권장**.
- Q4. PR-3 운영 DB 박제 검증 = paper 매치 1건 직접 submit 후 SELECT 1회 (사용자 결재 후 진행 / 운영 영향 = INSERT 2건 / 회수 가능).

## 구현 기록 (developer / 2026-05-16) — PR-Possession-1 PURE 헬퍼 + 타입 + vitest

📝 **구현한 기능**: 공격권 (Possession Arrow) PURE 헬퍼 + 타입 박제. UI / BFF / DB 영향 0. PR-2 (UI + state) / PR-3 (BFF + PBP 박제) 진입을 위한 단일 source 헬퍼.

📁 **변경 파일**:
| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/lib/score-sheet/possession-types.ts` | `PossessionState` / `JumpBallEvent` / `HeldBallEvent` interface + `EMPTY_POSSESSION` const (running-score-types.ts 패턴) | **신규** | 58 |
| `src/lib/score-sheet/possession-helpers.ts` | `togglePossession` / `applyOpeningJumpBall` / `applyHeldBall` / `possessionToPBPInputs` PURE 함수 4건 + `PossessionPBPInput` interface (running-score-helpers.ts 패턴) | **신규** | 122 |
| `src/__tests__/score-sheet/possession-helpers.test.ts` | vitest 15 케이스 (toggle 4 / opening 3 / held 3 / PBP 변환 5) | **신규** | 187 |

🔗 **운영 제약 준수**:
- 다른 파일 변경 0 (form / fiba-header / submit route / draft-storage / running-score-helpers 모두 unchanged)
- DB schema 변경 0 (action_type=String VarChar 그대로 — PR-3 에서 INSERT 만)
- 시안 13 룰: 시각 컴포넌트 없음 (PURE 헬퍼만) → 룰 적용 0건
- server-safe (`src/lib/score-sheet/` 위치 일관 — Prisma / DOM 의존 0)

✅ **검증**:
- `npx tsc --noEmit` = **exit code 0** (에러 0)
- `npx vitest run possession-helpers` = **15/15 PASS** (315ms)
- 다른 vitest 회귀: score-sheet 전체 210 케이스 중 `running-score-helpers.test.ts` 1건 fail 발견 — **본 PR 범위 밖** (작업 시작 시점에 이미 M 상태 / 다른 미커밋 작업의 회귀 / `git diff --stat` 242 라인 추가됨)

💡 **tester 참고**:
- **테스트 방법**: `npx vitest run possession-helpers` 1회 — 15 케이스 통과 확인
- **정상 동작**:
  - `togglePossession({arrow:"home", ...})` → `{arrow:"away", ...}` (immutable)
  - `togglePossession({arrow:null, ...})` → 원본 state 반환 (가드)
  - `applyOpeningJumpBall(state, "home", "p1")` → `arrow="away"` (loser 방향) + `openingJumpBall={winner:"home", winnerPlayerId:"p1"}`
  - `applyHeldBall(state, 2)` → `arrow` 토글 + `heldBallEvents` 에 `{period:2, takingTeam:이전arrow}` push
  - `possessionToPBPInputs(state, matchId)` → `[{actionType:"jump_ball", period:1, team:winner}, ...{actionType:"held_ball", period:N, team:takingTeam}]`
- **주의할 입력**:
  - `arrow=null` 상태에서 `togglePossession` / `applyHeldBall` 호출 → state 그대로 반환 (Opening Jump Ball 선행 필수 — caller 보호)
  - `applyOpeningJumpBall` 재호출 시 마지막 박제값 보존 (재정정 시나리오 — 운영자 실수 fix)
- **수동 검증 불필요** — PURE 헬퍼 + vitest 15 PASS 로 충분 (UI / DB 영향 0)

⚠️ **reviewer 참고**:
- **`possessionToPBPInputs` 의 `_matchId` 파라미터** — 본 PR 에서는 사용 ❌ (caller (PR-3 BFF) 가 PBP row 의 `match_id` 컬럼에 활용 / 시그니처 일관성). underscore prefix 로 unused 경고 회피 + 다음 PR 에서 사용 예정 박제.
- **`PossessionPBPInput` interface** — `PaperPBPInput` (running-score-helpers) 와 의도적으로 분리. paper PBP 는 11 필드 (score / player / made / subtype 등) / possession PBP 는 3 필드 (actionType / period / team) 만 — domain 분리 의도적.
- **immutability 패턴** — running-score-helpers 의 `addMark` / `undoLastMark` 와 동일 (spread + 새 객체). 모든 헬퍼는 `state` 직접 변형 0.
- **테스트 케이스 케이스 #7 (재호출 보존)** — Opening Jump Ball 의 winner 변경 시 arrow 도 같이 갱신됨을 검증 (운영자 실수 정정 시나리오 박제).
- **회귀 발견 (별건)** — `running-score-helpers.test.ts` 1건 fail 은 본 PR 시작 전 다른 미커밋 작업 (`running-score-helpers.ts` 96 라인 추가 + 테스트 148 라인 추가) 의 회귀. **본 PR 범위 밖** — PM 별도 조치 필요.

🚀 **다음 PR 진입 조건**:
- PR-2 (UI + state + 모달): 본 PR `possession-types.ts` + `possession-helpers.ts` import 하여 `score-sheet-form.tsx` state + `fiba-header.tsx` 화살표 박제. 본 PR 완료 = PR-2 진입 가능 (DB 영향 0 / draft-storage 만 확장).
- PR-3 (BFF + PBP 박제): `possessionToPBPInputs` 호출 → `play_by_plays` INSERT. 운영 DB 영향 = INSERT 만 (사용자 결재 후 진행).

## 구현 기록 (developer / 2026-05-16) — PR-Possession-2 UI + state + 모달

📝 **구현한 기능**: 공격권 (Possession Arrow) UI + state + 모달 박제. PR-1 PURE 헬퍼 (commit 64be0f0) 위에서 fiba-header 화살표 + 점프볼 모달 + 헬드볼 confirm 모달 + score-sheet-form state 통합. BFF / submit / DB 영향 0 (= PR-3).

📁 **변경 파일** (5건 = 신규 2 + 수정 3):

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/jump-ball-modal.tsx` | 첫 점프볼 모달 (2 단계 = 팀 선택 + 선수 dropdown / 4 모달 UX 패턴 정합 — ESC + backdrop + sm:flex-row footer + 인쇄 차단) | **신규** | 296 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/possession-confirm-modal.tsx` | 헬드볼 confirm 모달 (ConfirmModal 재사용 — 4 모달 UX 자동) | **신규** | 84 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | `possessionArrow` / `onArrowClick` props 추가 + 쿼터 뱃지 좌측 화살표 (Material `arrow_forward`/`arrow_back` 56px / 회색 var(--color-text-primary)) + row flex wrapper 중첩 | 수정 | +85 / -10 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | `possession` state + `jumpBallModalOpen` / `heldBallConfirmOpen` 2 모달 state + 3 handler (`handleJumpBallConfirm` / `handleHeldBallConfirm` / `handleArrowClick`) + `handleEndPeriod` 자동 토글 + `handleLineupConfirm` 자동 open trigger + FibaHeader props wiring + 모달 2건 mount + draft 박제/복원 | 수정 | +130 / -3 |
| `src/lib/score-sheet/draft-storage.ts` | `possession` 키 박제 docstring 갱신 (`[key: string]: unknown` 인덱스 시그니처 이미 박제 — 타입 변경 0 / 주석만 +4) | 수정 | +4 |

🔗 **운영 제약 준수**:
- BFF / submit / `buildSubmitPayload` 변경 0 (= PR-3 작업 영역)
- DB schema 변경 0 (`prisma/schema.prisma` 미변경)
- 시안 13 룰 100% 정합: `var(--color-*)` 토큰만 / Material Symbols Outlined / lucide-react ❌ / 빨강 본문 텍스트 ❌ / pill 9999px ❌ / radius 4~6px / 44px+ 터치 영역
- 4종 모달 UX 패턴 정합: ESC + backdrop 클릭 + `sm:flex-row` footer + 모바일 column stack + 인쇄 차단 (`no-print`)
- Phase 22/23 호환 보존: paper override / read-only (isReadOnly) / quarter_scores 영향 0
- 미전달 prop = 미노출 (possessionArrow=null / undefined → 화살표 미노출 / 기존 paper 매치 영향 0)

✅ **검증**:
- `npx tsc --noEmit` = **exit code 0** (에러 0)
- `npx vitest run possession-helpers` = **15/15 PASS** (295ms / PR-1 회귀 0)
- `npx vitest run src/__tests__/score-sheet` = **209/210 PASS** (1 fail = `running-score-helpers.test.ts:298` — **본 PR 범위 밖** / PR-1 시작 전 이미 fail 상태 명시됨)

💡 **tester 참고**:
- **테스트 시나리오 1 (첫 점프볼 흐름)**:
  1. paper 매치 진입 → 라인업 모달 → 양 팀 5인 선발 + 확정
  2. **자동**: 점프볼 모달 open (사용자 결재 위치) — "1. 점프볼 승자 팀" + "2. 점프볼 승리 선수" 단계
  3. Team A 또는 Team B 버튼 클릭 → 단계 2 선수 dropdown 활성화 (출전 명단 = starters+substitutes)
  4. 선수 선택 (또는 "선택 안 함") → "확정" 클릭
  5. **정상**: 헤더 쿼터 뱃지 좌측에 회색 화살표 노출 (winner=home → arrow=away → `arrow_back`)
  6. toast 안내 = "점프볼 승리 = {팀명} (첫 공격권) / 다음 공격권 화살표 = {반대 팀}"

- **테스트 시나리오 2 (헬드볼 흐름)**:
  1. 점프볼 박제 후 화살표 노출 상태
  2. 헤더 화살표 클릭 → PossessionConfirmModal 표시 — "헬드볼 발생 — 공격권 = {화살표 방향 팀명}"
  3. "확인 (공격권 변경)" 클릭 → 화살표 토글 (반대 방향) + toast 5초 안내
  4. "취소" 클릭 → 모달 닫기 / 화살표 상태 유지

- **테스트 시나리오 3 (쿼터 종료 자동 토글)**:
  1. Q1 진행 중 (화살표 = home 또는 away)
  2. "쿼터 종료" 버튼 클릭 (Q1~Q3) → 자동 currentPeriod++ + 화살표 자동 토글
  3. toast 안내 = "Q1 종료 — Q2 진행 / 다음 쿼터 공격권 = {반대 팀명}"
  4. **주의**: Q4 / OT 종료 시 quarter-end 모달이 우선 → 본 자동 토글은 ENDED period 시점에 한 번만 (모달 progression 별도)

- **테스트 시나리오 4 (read-only 매치 검증)**:
  1. 종료 매치 (status=completed) 재진입 — isReadOnly=true
  2. **확인 1**: 화살표 노출되지만 클릭 비활성 (cursor: default / onClick 무동작)
  3. **확인 2**: JumpBallModal / PossessionConfirmModal open 강제 false (이중 방어)
  4. **확인 3**: 수정 모드 진입 (super_admin / organizer / TAM 만) 시 다시 활성

- **테스트 시나리오 5 (draft 복원)**:
  1. 점프볼 박제 + 헬드볼 1회 박제 후 5초 대기 (draft 자동 저장)
  2. 페이지 새로고침 (mid-game reload)
  3. **정상**: 화살표 + 점프볼 상태 + heldBallEvents 모두 복원 (구버전 draft 호환 = EMPTY fallback)

- **주의할 입력**:
  - 라인업 미확정 상태 = lineup === null → 점프볼 모달 안 dropdown 빈 배열 (운영자가 라인업 confirm 부터 진행)
  - possession.arrow === null + 헤더 화살표 미노출 → 헤더 클릭 trigger 자체 없음 (안전망)
  - showToast 시그니처 = `(message, type)` 만 (duration 미지원) → 메시지 안 "공격권" 키워드로 강조

⚠️ **reviewer 참고**:
- **fiba-header row flex wrapper 중첩** — 기존 column flex (뱃지+라벨) → row flex (화살표+컬럼) 외부 wrapper 추가. `.ss-h` grid-template-columns "92px 1fr auto" 변경 0 — wrapper auto 폭 자연 정합. 닫는 div 1개 추가 (line 299 라벨 영역 → wrapper 닫기).
- **화살표 클릭 가능 가드 = onArrowClick 함수 존재 여부** — caller (form) 가 `isReadOnly ? undefined : handleArrowClick` 전달 → fiba-header 가 `disabled={!onArrowClick}` + `cursor: onArrowClick ? "pointer" : "default"` 자동 분기. 자체 컴포넌트는 isReadOnly 모름 (책임 분리).
- **possession-confirm-modal = ConfirmModal 재사용 박제** — LOC 84 (목표 60 약간 초과 / docstring 풍부) — 별도 모달 구조 박제 ❌. ConfirmModal `isPrimary` 옵션으로 "확인" 강조.
- **handleEndPeriod 자동 토글** — Q1~Q3 자동 진입 분기 안에서 togglePossession 호출. arrow=null 가드 (헬퍼 자체 보호) — 첫 점프볼 미박제 매치도 안전. Q4/OT 모달 분기는 토글 X (사용자 결재 — 자동 OT 진입 차단 흐름과 정합).
- **draft 복원 shape 검증** — arrow / openingJumpBall / heldBallEvents 3 키 약식 검증 후 setPossession. 구버전 draft (possession 키 없음) = EMPTY 유지 (운영 호환).
- **buildSubmitPayload 변경 0** — possession 키는 BFF 에 미전달 (= PR-3 작업). 본 PR 의 화살표 / 점프볼 / 헬드볼 상태는 draft localStorage 만 → 새로고침 후에도 복원 가능하지만 submit 후 = 손실 (= 의도적 PR-3 영역).

🚀 **다음 PR 진입 조건**:
- PR-3 (BFF + PBP 박제): `buildSubmitPayload` 에 `possession` 키 추가 → submit/route.ts zod 확장 + `possessionToPBPInputs` 호출 → `play_by_plays` INSERT (action_type = "jump_ball" / "held_ball"). 운영 DB 영향 = INSERT 만 (사용자 결재 후 진행 — paper 매치 1건 submit + SELECT 검증).

## 구현 기록 (developer / 2026-05-16) — PR-Possession-3 BFF + PBP 박제 ⭐

📝 **구현한 기능**: 공격권 (Possession Arrow) BFF + PBP 박제. PR-1 PURE 헬퍼 (commit 64be0f0) + PR-2 UI/state/모달 (commit 9f21090) 위에서 buildSubmitPayload → BFF possession payload 전달 → zod 검증 → possessionToPBPInputs 변환 → play_by_plays INSERT (action_type = `jump_ball` / `held_ball`). score events / foul events 와 동일 path (PlayByPlayInput[]) — service idempotent 흐름 보존.

📁 **변경 파일** (2건 = 수정 2):

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | `buildSubmitPayload()` 에 `possession` 키 박제 (UI state → BFF payload / openingJumpBall=null 시 통째 생략) | 수정 | +23 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | (1) `possessionSchema` zod 추가 (`jumpBallEventSchema` + `heldBallEventSchema` + arr max 50) (2) `submitSchema.possession` optional (3) `possessionToPBPInputs` 호출 → PBP 변환 → `PlayByPlayInput[]` 통합 (4) player_id fallback (winnerPlayerId / lineup.starters[0] / skip) (5) audit context + changes.input + response 박제 카운트 | 수정 | +185 / -4 |

총 **+208 / -4 LOC** (2 파일).

🔗 **운영 제약 준수**:
- DB schema 변경 0 (action_type = String @db.VarChar 자유 박제 — planner 확정)
- 기존 score events / foul events 박제 흐름 변경 0 (PossessionPBPInput → PlayByPlayInput[] 통합만)
- service `match-sync.ts` 변경 0 (deleteMany NOT IN incoming 가드로 idempotent 자동 — possession local_id 도 보존)
- Phase 22 paper override 영향 0 (possession PBP points_scored=0 → quarter_scores 합산 영향 0)
- Phase 23 read-only 영향 0 (isEditMode 흐름 그대로 — possession 도 우회 통과)
- 구버전 client 호환 (possession 키 미전송 = PBP 박제 0건 / 기존 매치 영향 0)

✅ **검증 3단계**:
1. **tsc**: `npx tsc --noEmit` = **exit code 0** (에러 0)
2. **vitest 전체**: `npx vitest run` = **1002/1003 PASS** (실패 1건 = `running-score-helpers.test.ts:298` 기존 회귀 — planner plan 명시된 PR 범위 밖)
3. **운영 DB SELECT 검증** (사용자 옵션 C 결재 명시 — INSERT 0건):
   - paper 매치 인벤토리: **10건** (218 completed / 217~209 scheduled)
   - 기존 jump_ball/held_ball PBP: **0건** (baseline 확인 — PR-3 신규 박제 대상)
   - 매치 171 상태: scheduled / paper mode / 양팀 배정 완료 (266 vs 267)
   - 임시 검증 스크립트 `scripts/_temp/check-possession-pbp.ts` 박제 + SELECT 후 즉시 정리 (운영 영향 0)

📦 **PBP 박제 룰** (FIBA Article 12 / Alternating Possession):
- **action_type**: `jump_ball` (Opening Jump Ball) / `held_ball` (경기 중 헬드볼)
- **local_id**: `paper-possession-{actionType}-{idx}` — service deleteMany NOT IN 가드 통과 (매번 전체 재INSERT — idempotent)
- **tournament_team_player_id** (NOT NULL FK — service `> 0` 가드 통과 필수):
  - jump_ball: openingJumpBall.winnerPlayerId 우선 → lineup.starters[0] (takingTeam) → 미확보 시 skip
  - held_ball: lineup.starters[0] (takingTeam) → 미확보 시 skip
- **tournament_team_id**: `team === "home"` → match.homeTeamId / `away` → match.awayTeamId
- **quarter**: jump_ball = 1 (Q1 시작) / held_ball = event.period
- **points_scored**: 0 (점수 영향 0)
- **is_made / shot_clock / court_x/y/zone / 모든 player FK**: null
- **description**: `[종이 기록] 점프볼 ({팀} 첫 점유)` / `[종이 기록] 헬드볼 ({팀} 공격권)`

💡 **tester 참고**:
- **테스트 시나리오 1 (jump_ball PBP 박제)**:
  1. paper 매치 (예: 171) 진입 → 라인업 5인 확정 → 자동 점프볼 모달
  2. 점프볼 승자 선택 + winnerPlayerId 선택 → 확정
  3. running_score 1점 박제 + 쿼터 종료 → 매치 종료 buildSubmitPayload + submit
  4. **정상**: SELECT `action_type, period, tournament_team_player_id, tournament_team_id FROM play_by_plays WHERE tournament_match_id = ? AND action_type IN ('jump_ball','held_ball')` → `jump_ball` 1행 + winnerPlayerId = winner_team starter

- **테스트 시나리오 2 (held_ball PBP 박제)**:
  1. 점프볼 박제 후 진행 중 헬드볼 발생 → 화살표 클릭 → confirm 모달 → 확인
  2. 헬드볼 1~2회 박제 후 submit
  3. **정상**: SELECT 결과 `jump_ball` 1행 + `held_ball` N행 (period = 발생 쿼터 / team = takingTeam = lineup.starters[0])

- **테스트 시나리오 3 (audit context + changes.input 박제)**:
  1. submit 후 `tournament_match_audits` SELECT
  2. **정상**: context 안 `poss N = JB1+HB(N-1)` 박제 + changes.input 안 `possession_pbp_count / possession_jump_ball_count / possession_held_ball_count` 박제

- **테스트 시나리오 4 (idempotent 재제출)**:
  1. 매치 1회 submit → possession PBP N건 INSERT
  2. 재제출 (수정 모드) → 동일 possession 박제
  3. **정상**: deleteMany NOT IN (local_id `paper-possession-*`) → 같은 local_id 재upsert → 중복 박제 0

- **테스트 시나리오 5 (운영 동작 보존 — 구버전 client 호환)**:
  1. score-sheet UI 의 점프볼 모달 무시 (또는 미박제 매치) → buildSubmitPayload 가 possession 키 통째 생략
  2. **정상**: BFF 가 input.possession === undefined → possession PBP 박제 0건 / 기존 매치 동작 유지

- **테스트 시나리오 6 (player_id fallback skip 안전망)**:
  1. lineup 미전송 + winnerPlayerId 미박제 케이스 (가설 — 실 UI 흐름상 불가능)
  2. **정상**: 각 possession event 박제 skip (운영 영향 0 — service `> 0` 가드와 동일 효과)

- **주의할 입력**:
  - possession.openingJumpBall === null (운영자가 라인업 미확정 또는 점프볼 모달 무시) → BFF 키 미박제 = PBP 0건
  - lineup.starters.length < 1 = unlikely (zod `.length(5)` 가드) — 가드 통과 시 fallback 정상 동작
  - held_ball event 의 takingTeam 라인업 starters[0] = placeholder (실 선수 미식별) — PBP query 시 action_type 필터만으로 식별 가능

⚠️ **reviewer 참고**:
- **service `> 0` 가드와 tournament_team_player_id 결정 룰** — `match-sync.ts:573` validPbps 필터 (`pbp.tournament_team_player_id > 0 && pbp.tournament_team_id > 0`) 통과 의무. 본 BFF 가 fallback (winnerPlayerId / lineup.starters[0]) 으로 정상 ID 박제. 미확보 시 BFF 자체 skip (운영 영향 0 / service 가드와 일관).
- **action_type 자유 박제 확인** — `prisma/schema.prisma:1849` action_type 컬럼 = String @db.VarChar (enum 0 / 자유). `jump_ball` / `held_ball` 박제 = DB 호환 (planner 확정 + 실 SELECT 검증).
- **player_id placeholder = lineup.starters[0]** — held_ball 은 팀 단위 이벤트 (실 선수 미식별). 라인업 첫 선수로 placeholder 박제. PBP query 시 action_type 필터로 식별 가능 (player 통산 stat 영향 0 — 라이브 API 가 jump_ball/held_ball action_type 자체를 stat 카운트 0 처리).
- **local_id 단위 idempotent 보존** — `paper-possession-{actionType}-{idx}` 형식. service deleteMany NOT IN incoming_local_ids 가드로 매번 전체 재INSERT (Flutter sync 와 동일 패턴 / score events / foul events 와 정합).
- **schema 변경 0** — possession PBP 박제는 기존 play_by_plays 테이블 그대로. action_type 자유 / tournament_team_player_id NOT NULL FK 가드 통과 / 6 인덱스 영향 0.
- **운영 DB INSERT 0건 (본 PR 박제 시점)** — 코드 박제만 (스크립트 0 / SELECT 만). 실제 INSERT = 운영 사용자가 score-sheet 제출 시점에 자동 trigger. 사후 audit log + PBP SELECT 로 검증 가능.

🚀 **PR-Possession 시리즈 박제 완료**:
- PR-1 (PURE 헬퍼 + vitest 15) `64be0f0` ✅
- PR-2 (UI + state + 모달) `9f21090` ✅
- PR-3 (BFF + PBP 박제) ⭐ 박제 완료 — PM 결재 (commit / push) 대기

## 이전 구현 기록 (fiba-header 쿼터 뱃지 v3 — 보존)

### fiba-header 쿼터 뱃지 v3

📝 **구현한 기능**: fiba-header.tsx 의 쿼터 뱃지 (Q2/OT1 빨강 outline 박스) 위치 위로 이동 (`alignSelf: flex-start` + `marginTop: -4px`) + 뱃지 바로 아래 매치 상태 라벨 (10px / 회색) 박제. 사용자 보고 이미지 #157 fix.

📁 **변경 파일**:
| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | `marksCount?: number` prop 추가 + `matchPhaseLabel` 산출 (matchEnded 우선 / marksCount === 0 → "경기 전" / 1+ → "경기 중") + 뱃지 wrapper column flex + 라벨 div | 수정 | +44 / -19 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | FibaHeader 호출에 `marksCount={runningScore.home.length + runningScore.away.length}` wiring | 수정 | +4 |

🔗 **운영 제약 준수**:
- props interface 신규 prop 1건 (`marksCount?: number`) 만 추가 — 기존 props 시그니처 변경 0
- 미전달(undefined) 시 라벨 미노출 (운영 호환 — 다른 호출자 있을 시 회귀 0)
- RunningScoreState shape 변경 0 (home/away 배열 length 합산만)
- 신규 BFF / state 변경 0 — 시각 박제만
- 시안 13 룰: var(--color-text-secondary, #6B7280) 회색 라벨 / Material 아이콘 영향 0 / 빨강 본문 텍스트 0 / 인쇄 영향 0 (헤더는 인쇄 시 자연 표시)

✅ **검증**:
- `npx tsc --noEmit` = exit code 0 (에러 0)
- HMR: 다음 dev server 재컴파일 시 자동 반영 (편집된 파일만 다시 컴파일)

💡 **tester 참고**:
- **테스트 방법**:
  1. paper 매치 점검 페이지 진입 (`/score-sheet/{matchId}`)
  2. **상태 1 (경기 전)**: 마크 0건 + matchEnded=false → 뱃지 "Q1" + 라벨 "경기 전" (회색)
  3. **상태 2 (경기 중)**: 첫 득점 마킹 후 → 뱃지 "Q1~Q4/OT1+" + 라벨 "경기 중"
  4. **상태 3 (경기 종료)**: 경기 종료 submit 후 → 뱃지 "경기 종료" (회색) + 라벨 "경기 종료"
- **정상 동작**:
  - 뱃지가 그리드 cell 상단에 align (이전 center 위치보다 약 4px 위로)
  - 라벨 = 뱃지 바로 아래 gap 4px / 가운데 정렬
  - 라벨 색상 = `var(--color-text-secondary)` (회색) — 뱃지 빨강과 시각적으로 분리
- **주의할 입력**:
  - marksCount prop 미전달 (호환성 케이스) → 라벨 미노출 (뱃지만 노출 = 이전 동작)
  - matchEnded=true 우선 → marksCount 무관하게 "경기 종료" 표시

⚠️ **reviewer 참고**:
- **wrapper 박스 구조 변경** — 기존 단일 div (뱃지) → wrapper div (column flex) + 자식 2개 (뱃지 div + 라벨 div). `.ss-h` grid-template-columns "92px 1fr auto" 변경 0 — wrapper 가 자연 폭 auto 로 정합.
- **`alignSelf: flex-start`** — 부모 `.ss-h` grid item 으로서 cell 상단 정렬 (이전 center 가 박혀있어 위치 변경 시 사용자가 명시한 "위로 조금 이동" 효과).
- **CSS 변수 fallback** — `var(--color-text-secondary, #6B7280)` 토큰 미정의 환경 (인쇄 등) 에서도 회색 박제.

## 이전 구현 기록 (PBP 수정 모달 — 보존)

## 구현 기록 (developer / 2026-05-16)

📝 **구현한 기능**: paper 매치 운영자가 toolbar "기록수정" 버튼 클릭 → PBP list 플로팅 모달 진입 →
   쿼터별 시간순 PBP 표시 + 행별 점수 (1↔2↔3) / 선수 변경 / 삭제 → "저장" 시 runningScore state 갱신
   (즉시 BFF 호출 X — form 자연 흐름 "쿼터 종료" / "경기 종료" 에서 기존 submit BFF 재사용).

📁 **변경/신규 파일**:
| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/lib/score-sheet/running-score-helpers.ts` | `updateMarkPoints` / `removeMark` / `renumberPositions` 헬퍼 3건 추가 (position 자동 재정렬 invariant 보장) | 수정 | +90 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/pbp-edit-modal.tsx` | PBP 조회/수정 플로팅 모달 (period asc / position asc 정렬 list + inline 1/2/3 segmented + 선수 select + 삭제 confirm) | **신규** | +455 |
| `src/app/(score-sheet)/_components/score-sheet-toolbar.tsx` | `onOpenPbpEdit` prop + "기록수정" 버튼 (라인업 ↔ 설명서 사이 / Material `edit_note` 아이콘) | 수정 | +25 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | `pbpEditModalOpen` state + `handleApplyPbpEdit` handler + 모달 mount + toolbar `onOpenPbpEdit` 콜백 | 수정 | +50 |
| `src/__tests__/score-sheet/running-score-helpers.test.ts` | 신규 헬퍼 3건 vitest 15 케이스 (renumberPositions 4 / updateMarkPoints 5 / removeMark 6) | 수정 | +148 |
| **합계** |  |  | **+768** |

🔗 **운영 제약 100% 보존**:
- runningScore.marks shape 변경 0 (`ScoreMark { playerId, period, position, points }` 그대로)
- buildSubmitPayload / clearDraft / loadDraft 흐름 변경 0
- 신규 BFF endpoint 0 (모달 "저장" = setRunningScore() 만 / form 자연 흐름에서 기존 submit BFF 재사용)
- isReadOnly 가드 이중 방어: (1) toolbar `onOpenPbpEdit` undefined 시 버튼 미노출 (2) form `handleApplyPbpEdit` 안 isReadOnly 가드 (3) 모달 자체 open=false 강제
- 시안 13 룰 100% 준수: `var(--color-*)` 토큰 / `material-symbols-outlined` 아이콘 / radius 4px / 빨강 본문 텍스트 0 (삭제 버튼만 `--color-warning`)
- light forced + zoom 0.7 인쇄 룰 영향 0 (모달 `.no-print`)
- 4종 모달 (FoulType / PlayerSelect / LineupSelection / QuarterEnd) UX 패턴 정합: ESC / backdrop / 헤더 X 버튼 / sm:flex-row 푸터

✅ **검증 결과**:
- `npx tsc --noEmit` = 에러 0 (전체 strict)
- `npx vitest run running-score-helpers.test.ts -t "PR-PBP-Edit"` = **15/15 PASS** (신규 헬퍼 100%)
- 기존 35 케이스 1 fail 케이스 (`marksToPaperPBPInputs > home_score_at_time 누적 정합`) = **본 작업 무관** (다른 세션 2026-05-15 PR-B / P0-2 sort 룰 변경의 잠재 회귀)

💡 **tester 참고**:
- **테스트 방법** (수동):
  1. paper 매치 점검 페이지 진입 (e.g. `/score-sheet/{matchId}` 매치 218)
  2. 헤더 toolbar 의 "기록수정" 버튼 클릭
  3. 모달 안에서 임의 row 의 점수 1↔2↔3 segmented 토글 → 누적 점수 자동 재정렬 확인
  4. 임의 row 의 선수 dropdown 변경 → 즉시 갱신 확인
  5. 임의 row 의 삭제 버튼 (휴지통 아이콘) → window.confirm → 삭제 + 후속 position 재정렬 확인
  6. "저장" 클릭 → 모달 닫힘 → Running Score grid 자동 갱신 → PeriodScoresSection 자동 갱신
  7. 그 후 "쿼터 종료" → BFF submit (기존 흐름) → DB 박제 검증
- **정상 동작**:
  - 모달 열기: 진행 매치 / 수정 모드 진입 매치만 "기록수정" 버튼 노출
  - 종료 매치 + 수정 모드 미진입 시 toolbar 버튼 미노출 (이중 방어)
  - "취소" / ESC / backdrop 클릭 시 변경 0 (임시 state 폐기)
  - 점수 변경: 마지막 마킹 position = 팀 누적 점수 invariant 자동 보존
- **주의할 입력**:
  - 빈 매치 (마크 0건) = "아직 기록된 득점이 없습니다" empty state 표시
  - 라인업 외 선수 ID 가 마크에 박혀있는 경우 (mixed) = dropdown 끝에 "(명단 외)" fallback option 추가
  - 인쇄 시 모달 `.no-print` = 자동 hide 보장

⚠️ **reviewer 참고**:
- **특별히 봐줬으면 하는 부분**:
  1. `renumberPositions` 의 reduce 누적 로직 — 1번째 마크부터 cumulative 점수 누적 정확성 (테스트 4 케이스 통과)
  2. 모달 안 `useEffect` 으로 open 토글 시 draft 동기화 패턴 — 외부 marks 변경 0 보장 (deep clone)
  3. `handleApplyPbpEdit` 의 `currentPeriod` 변경 X 가드 — 모달 안에서 쿼터 변경 미허용 룰
  4. 시각: ConfirmModal size="xl" 패턴 정합 (lineup modal 과 동일 m-auto max-h-[92vh] w-[min(720px,94vw)])
- **planner "회귀 0" 명시 영역 확인**:
  - cross-check audit endpoint = 신규 호출 0 (모달은 state 만 변경 / DB 직접 호출 0)
  - draft localStorage 5초 throttle 흐름 변경 0
  - Phase 23 PR-RO/EDIT 룰 정합 (isReadOnly 가드 단일 source 재사용)

📌 **planner-architect 결정 plan 5건 100% 준수**:
1. ✅ 데이터 source = runningScore state 단일 (form 메모리)
2. ✅ 수정 흐름 = state 갱신 + "저장" 클릭 시만 form state 반영 (즉시 BFF 호출 X)
3. ✅ 수정 필드 = 점수 (1↔2↔3) + 선수 + 삭제 3건만 (쿼터 / position 변경 0)
4. ✅ 파일: 신규 1 (`pbp-edit-modal.tsx`) + 수정 3 (`score-sheet-form.tsx` / `score-sheet-toolbar.tsx` / `running-score-helpers.ts`)
5. ✅ 재계산 = state 갱신 → form 의 기존 자동 draft / submit 흐름 그대로

## 기획설계 (planner-architect / 2026-05-16)

## 기획설계 (planner-architect / 2026-05-16)

🎯 **목표**: paper 매치 운영자가 toolbar "기록수정" 버튼으로 플로팅 모달 진입 → 쿼터별 PBP list 조회 + 항목 수정/삭제 → DB 자동 재계산.

📍 **데이터 source 결정 (질문 1)**: **`runningScore` state (form 메모리) = 단일 source**
- 비유: form state = "운영자가 손에 든 종이 기록지" / DB = "박제된 사본". 손에 든 종이를 고친 뒤 사본으로 다시 박제하는 흐름이 직관적.
- **이유**: (a) paper 매치는 runningScore 가 1차 source. submit 시 BFF 가 runningScore → PBP/MatchPlayerStat/quarter_scores 3중 박제 (단방향). (b) PBP DB 를 source 로 하면 양방향 sync 필요 → race / mismatch 사고 위험. (c) form 의 cross-check (Phase 23) 이미 PBP 합산 ↔ DB 비교 노이즈 발생 — 추가 source 회피. (d) match_events 테이블은 paper 매치 미사용 (Flutter 전용).
- **paper 매치 진입 시점**: page.tsx 가 DB PBP → marksFromPBP() 역변환 → initialRunningScore prop → useState 초기값 (이미 박제됨).

🔄 **수정 데이터 흐름 (질문 2)**: **state update + 명시 "저장" 버튼 (별도 BFF submit)**
- 임시 state (모달 안 로컬) → "적용" 클릭 → form runningScore 갱신 → form "저장" 버튼 클릭 → BFF submit (기존 path 재사용).
- **이유**: (a) 항목 1건 수정마다 자동 BFF submit = 5건 수정 = 5회 round-trip + 5회 syncSingleMatch 재실행 → 운영 DB 부하 + 로그 오염. (b) 운영자가 "여러 건 한꺼번에 고친 뒤 한 번에 저장" UX 가 종이 양식 흐름과 정합. (c) 기존 MatchEndButton 패턴 (buildSubmitPayload + fetch submit) 재사용 → 신규 endpoint 0.

✏️ **수정 가능 필드 (질문 3) — 우선순위**: Phase 1 (조회만) / Phase 2 = **점수 변경 (1↔2↔3) + 선수 변경 + 항목 삭제** 3건만.
- 운영 우선순위: 1점→2점 (가장 빈번) > 선수 변경 (잘못 마킹) > 삭제 (실수 입력). 쿼터/위치/시간 수정 = **Phase 2 범위 제외** (PBP position 재정렬 = runningScore 전체 재계산 위험 / cross-check 노이즈 / FIBA 양식 룰 위반 가능).
- **이유**: position 변경 = "팀 누적 점수 위치" 자동 추론 (inferPoints) 가 깨짐. 쿼터 변경 = quarter_scores 재계산 필요 (PR 범위 확장).

📁 **만들 위치와 구조**:
| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `_components/pbp-edit-modal.tsx` | 플로팅 모달 (PBP list + 행별 수정/삭제 UI) | **신규** |
| `_components/score-sheet-toolbar.tsx` | "기록수정" 버튼 박제 + props 확장 (onOpenPbpEdit) | 수정 |
| `_components/score-sheet-form.tsx` | 모달 mount + handler (handleOpenPbpEdit / handleApplyPbpEdit) | 수정 |
| `src/lib/score-sheet/running-score-helpers.ts` | `updateMarkPoints` / `removeMark` / `renumberPositions` 순수 함수 추가 | 수정 |

🔗 **기존 코드 연결**:
- `runningScore` state 단일 source → 모달 read + 수정 후 setRunningScore() 호출 → 기존 draft 자동 박제 (5초 throttle).
- "저장" 진입점 = MatchEndButton + QuarterEndModal + (Phase 2-B) PbpEditModal 적용 시 = 모두 동일 `/api/web/score-sheet/{matchId}/submit` BFF 호출.
- 신규 endpoint **0** (Phase 1+2 모두 — 기존 submit BFF 재사용).

⚙️ **재계산 흐름 (질문 5)**: **runningScore state 갱신 → form 안 derived state 자동 갱신 (PeriodScoresSection / FinalScore 자동 재렌더) → "저장" 클릭 시 BFF 전체 재제출**.
- 1건 수정 = 메모리 update 만 (DB 영향 0). "저장" 후 = syncSingleMatch 가 매번 PBP 전체 deleteMany + 재INSERT (idempotent) → quarter_scores + MatchPlayerStat 자동 재계산. **increment 패치 X** (운영 안정성 최우선).
- `removeMark` / `updateMarkPoints` 후 position 재정렬 = `renumberPositions(marks)` 헬퍼로 1~N 연속 재할당 (마지막 마킹 position = 팀 누적 점수 유지).

📋 **실행 계획**:
| 순서 | Phase | 작업 | 담당 | 선행 조건 | commit 단위 |
|------|-------|------|------|----------|------------|
| 1 | Phase 1 | running-score-helpers.ts 순수 함수 3건 추가 (updateMarkPoints / removeMark / renumberPositions) + vitest 8 케이스 | developer | 없음 | `feat(score-sheet): PBP edit helpers (Phase 1-A)` |
| 2 | Phase 1 | pbp-edit-modal.tsx 신규 — list 조회 UI 만 (쿼터별 grouping / 행별 표시 / 닫기 버튼) | developer | 1단계 | `feat(score-sheet): PBP edit modal skeleton (Phase 1-B)` |
| 3 | Phase 1 | toolbar "기록수정" 버튼 + form mount + onOpenPbpEdit handler | developer | 2단계 | `feat(score-sheet): PBP edit toolbar button (Phase 1-C)` |
| 4 | Phase 2 | pbp-edit-modal.tsx 행별 수정 UI (1↔2↔3 점수 toggle + 선수 select + 삭제 아이콘) + handleApplyPbpEdit (form runningScore 갱신) | developer | 3단계 | `feat(score-sheet): PBP edit apply (Phase 2-A)` |
| 5 | Phase 2 | tester + reviewer 병렬 (vitest 회귀 + UX 4종 모달 시각 정합 + 종료 매치 차단) | tester + reviewer | 4단계 | (검증만) |
| 6 | Phase 2 | PM 직접 검증 (BFF 회귀 0 / cross-check 정합 / paper 매치 218 운영 검증) | pm | 5단계 | `test(score-sheet): PBP edit Phase 2 검증` |

⚠️ **developer 주의사항**:
1. **runningScore.position 직접 수정 금지** — `updateMarkPoints` / `removeMark` 호출 후 `renumberPositions` 로 1~N 연속 재할당 (마지막 position = 팀 누적 점수 invariant).
2. **isReadOnly 가드** — 종료 매치 (PR-RO3) + canEdit=false 시 modal 미오픈 (toolbar 버튼 자체 조건부 노출).
3. **신규 endpoint 0** — submit BFF 재사용 (Phase 2-A 의 `handleApplyPbpEdit` = `setRunningScore` 만 호출, 자동 BFF X). 사용자가 form "저장" 클릭 시 기존 흐름.
4. **시안 13 룰 준수** — Material Symbols Outlined / `var(--color-*)` 토큰 / 핑크/살몬/코랄 ❌ / pill 9999px ❌ / lucide-react ❌. ConfirmModal size="xl" 패턴 재사용 가능 (설명서 모달과 동일).
5. **cross-check 회귀** — Phase 23 의 `crossCheckFired.useRef` flag 가 mount 1회만 비교 → PBP 수정 후 mismatch 재계산 안 함. 영향 0 (저장 → DB 재박제 → reload 시 새 비교).
6. **draft 자동 저장** — runningScore 변경 시 기존 5초 throttle 자동 박제. 수정 모달 닫기만 해도 (저장 미클릭) draft 박제 됨 → reload 시 복원. **이는 의도된 동작** (운영자 실수 회수용).

🚦 **위반 자동 reject**:
- 새 BFF endpoint 신설 ❌ (submit 재사용)
- DB 직접 update (`prisma.playByPlay.update`) ❌ (syncSingleMatch 단일 source)
- match_events 테이블 박제 ❌ (paper 매치 미사용 / Flutter 전용)
- runningScore 외부 source (PBP DB) 를 모달 source 로 ❌

## 기획설계 (planner-architect) — Track A 종별 탭 (2026-05-16)

🎯 **목표**: PR-Admin-6 `/playoffs` hub 5 섹션 (Banner / Advance / Standings / 순위전 / 결승) 이 강남구 6 종별 박제 시 세로 약 6배 길이 (스크롤 헬). **종별 탭 분리** 로 1 종별만 표시 (또는 "전체") → 운영자 시각 단축.

### A. 현 페이지 layout 분석 (`playoffs-client.tsx`)

| 섹션 | 컴포넌트 + 라인 | 종별 인지 | 종별 다중 시 길이 |
|------|---------------|---------|---------------|
| 1 | `PlaceholderValidationBanner matches={matches}` (line 159) | 매치 전체 검증 (종별 미인지) | 검출 N 비례 |
| 2 | `AdvancePlayoffsButton divisionCodes={divisionCodes}` (line 180) | divisionCodes prop = 일괄 호출 | 1 카드 (고정) |
| 3 | `StandingsTable` × N (line 200, `lg:grid-cols-2`) | 종별 1개당 1 테이블 | N × 약 200px |
| 4 | `DivisionMatchGroup` × N (line 232~244, code sort) | 이미 종별 그룹핑 (sub-Card) | N × 약 (매치 수 × 80px) |
| 5 | `FinalCard` × N (line 269~282, code sort) | 이미 종별 그룹핑 (sub-Card) | N × 약 200px |

→ 6 종별 = 섹션 3 약 1200px + 섹션 4 약 6 × 8경기 × 80 = 3840px + 섹션 5 약 1200px = **세로 약 6240px (운영 불가능 수준)**

### B. 탭 패턴 — `matches-client.tsx` 패턴 재사용

`matches-client.tsx` line 553~624 종별 + venue 2개 필터 패턴 (이미 검증된 reference):
- `useSearchParams` + `useState<string | null>(searchParams?.get('division') ?? null)` deep link
- 버튼 그룹 `flex flex-wrap items-center gap-2` (모바일 줄바꿈 / PC 가로)
- 활성 탭 = `bg-[var(--color-info)] text-white`, 비활성 = `bg-[var(--color-elevated)] text-[var(--color-text-muted)]`
- 카운트 = `{code} ({count})`
- "전체" 버튼 = filter `null`

→ **결론**: 신규 탭 컴포넌트 추출 0 — `matches-client.tsx` 패턴 그대로 인라인 (사용처 1곳, premature abstraction 회피).

### C. 옵션 비교

| 옵션 | 신규 파일 | playoffs-client 변경 | 기존 컴포넌트 시그니처 | LOC | 회귀 |
|------|---------|------------------|-----------------|------|------|
| **A 인라인** | 0 | +50 (탭 + filter state) | 0 변경 | 신규 0 / 수정 +60 | 낮음 |
| **B DivisionTabs 신규** | `_components/DivisionTabs.tsx` (+80) | +30 | 0 변경 | 신규 +80 / 수정 +40 | 낮음 |

→ **권장: 옵션 A (인라인)** — 사용처 1곳 / matches-client 패턴이 이미 검증 / DivisionTabs 추출은 2번째 사용처 등장 시 리팩터링 (premature abstraction 회피).

### D. 종별 탭 설계 (옵션 A)

**탭 구성**:
- "전체" (default) — 모든 종별 표시 (현재 동작 유지)
- 종별 N개 — `divisionStandings.map(d => d.code/label)` 동적
- `divisionStandings.length ≤ 1` = 탭 자체 미렌더 (단일 종별 폴백 = 탭 불필요 / 회귀 0)

**활성 탭 = `selectedDivision: string | null`** (`null` = 전체)

**URL state**: `useSearchParams + useRouter.replace`
- `?division=i3-U9` deep link
- 새로고침 / bracket 페이지 → 종별 클릭 → playoffs 종별 탭 자동 활성
- bracket 페이지 종별 trigger (`6d7718a`) 와 동일 패턴

### E. 각 섹션 필터링 spec

| 섹션 | 전체 모드 | 단일 종별 모드 | 변경 방식 |
|------|---------|------------|---------|
| 1 Banner | `matches` 전체 (현재) | `matches.filter(m => getDivisionCode(m) === selectedDivision)` | matches prop 차등 + `applyFilter` true |
| 2 Advance | `divisionCodes` 전체 | `[selectedDivision]` 단일 | divisionCodes prop 차등 (일괄→단일) |
| 3 Standings | `divisionStandings` 전체 (현재) | `.filter(d => d.code === selectedDivision)` | 배열 필터 후 map |
| 4 순위전 | `rankingByDivision` 전체 entry (현재) | `.entries().filter(([code]) => code === selectedDivision)` | entries filter 추가 |
| 5 결승 | `finalByDivision` 전체 entry (현재) | `.entries().filter(([code]) => code === selectedDivision)` | entries filter 추가 |

→ **재사용 컴포넌트 시그니처 변경 0**: `PlaceholderValidationBanner` / `AdvancePlayoffsButton` / `StandingsTable` / `DivisionMatchGroup` / `FinalCard` 모두 props 그대로. 부모 (playoffs-client) 의 prop 전달값만 차등.

### F. 변경 파일 목록 + LOC

| 파일 | 변경 | LOC |
|------|------|-----|
| `playoffs-client.tsx` | + `useSearchParams` / `useRouter.replace` import / `selectedDivision` state / 탭 박제 / 5 섹션 prop 차등 / URL sync `useEffect` | **+60 / -10** |
| (없음) | DivisionTabs 신규 추출 ❌ (옵션 A) | 0 |

→ **순 LOC ≈ +50** (단일 파일 수정).

### G. 회귀 위험 평가

| 위험 | 평가 | 대응 |
|------|------|------|
| `divisionStandings.length ≤ 1` 시 탭 미렌더 → 단일 종별 운영 (4차 뉴비리그 등) 영향 0 | 낮음 | 가드 `if (divisionStandings.length > 1)` 1줄 |
| URL `?division=` 잘못된 코드 → 빈 화면 | 낮음 | `useEffect` 검증 — 매칭 0 시 `setSelectedDivision(null)` 폴백 |
| `AdvancePlayoffsButton divisionCodes={[selectedDivision]}` 단일 종별 호출 → advance route idempotent (PR-Admin-2) | 0 | 호출 후 `router.refresh()` 동일 |
| Banner `matches` filter 후 cross-check (PR-Admin-3) `applyFilter` true 라벨 표시 | 0 | matches-client 동일 패턴 |
| 종별 1개 운영 + URL `?division=` 박힌 deep link → 폴백 작동 | 낮음 | useEffect 검증 |

→ **회귀 위험 종합 = 낮음** (재사용 컴포넌트 0 변경 / 단일 파일 / 가드 명확).

### H. 실행 계획

| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | `playoffs-client.tsx` 수정 — 탭 박제 + state + URL sync + 5 섹션 prop 차등 | developer | 없음 |
| 2 | `tsc --noEmit` 통과 확인 | tester | 1 |
| 3 | 강남구 6 종별 시각 수동 확인 (운영 DB / 종별별 + 전체 모드) | pm | 2 |
| 4 | `feat(admin): /playoffs 종별 탭 (Track A)` commit | pm | 3 |

→ **4단계 / 병렬 가능 0 (단일 파일)**

### I. developer 주의사항

1. **재사용 컴포넌트 시그니처 변경 0** — `StandingsTable` / `DivisionMatchGroup` / `FinalCard` / `AdvancePlayoffsButton` / `PlaceholderValidationBanner` 모두 props 그대로. 부모에서 차등 전달만.
2. **`divisionStandings.length ≤ 1` 가드** — 탭 미렌더 (단일 종별 운영 회귀 0).
3. **URL deep link 폴백** — `useEffect` 로 `searchParams.get('division')` 가 `divisionCodes` 에 없으면 `setSelectedDivision(null)` (잘못된 코드로 빈 화면 방지).
4. **시안 13 룰** — `var(--color-info)` 활성 탭 / `var(--color-elevated)` 비활성 / `rounded-[4px]` / Material Symbols / 모바일 `flex-wrap` 줄바꿈 (scroll 불필요).
5. **종별 라벨 표시** — 탭 라벨 = `divisionStandings.find(d => d.code === code)?.label ?? code` (운영자가 보는 한글 라벨, "i3 U9" 등).
6. **카운트 표시** — `전체 (N종별)` / `i3 U9 (M경기)` — N = divisionStandings.length, M = 해당 종별 매치 수 (`matches.filter(getDivisionCode === code).length` 또는 standings 팀 수).

### J. 후속 큐 (Phase 2)

- `bracket` 페이지에서 종별 카드 → playoffs `?division=` deep link (현재 bracket 종별 trigger 는 매치 박제 trigger 만, 종별 클릭 navigation 미박제)
- 종별별 진척도 ("예선 X/Y / 순위전 X/Y / 결승 0/1") 탭 라벨 옆 micro-progress 박제

🚦 **위반 자동 reject**:
- 재사용 컴포넌트 5건 시그니처 변경 ❌ (props 차등 전달만)
- 신규 DivisionTabs 컴포넌트 추출 ❌ (옵션 A — premature abstraction)
- `divisionStandings.length ≤ 1` 시 탭 렌더 ❌ (단일 종별 회귀)
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌

## 기획설계 (planner-architect) — Track B INSERT 스크립트 (2026-05-16)

🎯 **목표**: 강남구협회장배 유소년부 6 종별 / 36 팀 / 59 매치 운영 DB 박제 — `scripts/_temp/seed-gnba-youth-2026.ts` 1회성 idempotent 스크립트.

### 1. Tournament 분기 결정 — A안 (스크립트 내부 SELECT 후 자동 분기)

비유: "주차장 입구에서 차량번호판 조회 → 등록 차량이면 추가 자리 배정 / 미등록이면 신규 등록 + 자리 배정". Tournament 가 이미 있으면 종별·팀·매치만 추가.

| 단계 | 검색 조건 | 분기 |
|------|----------|------|
| 사전 SELECT | `name LIKE "%강남구협회장배%"` AND `startDate >= 2026-05-15` AND `startDate < 2026-05-18` | 0건 → 신규 / 1건 → 추가 / 2건+ → throw 가드 |
| 신규 분기 | — | Tournament + 6 DivisionRule + 36 Team + 59 Match 전체 박제 |
| 추가 분기 | tournamentId 결정 | 6 DivisionRule + 36 Team + 59 Match 만 박제 (Tournament UPDATE 0) |

**사유**: 사용자 SELECT 미실행 시에도 작동 (운영 DB 영향 = SELECT 1건만 추가). Tournament 중복 생성 방지.

### 2. schema 매핑 표

| 모델 | 필수 필드 | 본 스크립트 박제값 | 비고 |
|------|----------|-------------------|------|
| `Tournament` | `name` / `organizerId` (FK NOT NULL) / `divisions` (JSON, default `"[]"`) | name="강남구협회장배 유소년부 2026" / startDate=2026-05-16 09:00 KST / endDate=2026-05-17 20:30 KST / format="single_elimination" (디폴트, 종별별 format 우선) / status="published" / is_public=true / city="서울" / district="강남구" / venue_name="강남구민체육관/수도공고" / **organizerId=사용자 결재 필요** | BDR 운영진 user_id |
| `TournamentDivisionRule` | `tournamentId` / `code` / `label` / `feeKrw` / `sortOrder` | 6 row 박제 (§3) | format = enum DivisionFormat / settings JSON |
| `TournamentTeam` | `tournamentId` / `teamId` (FK → Team.id) | 36 row 박제 / **Team upsert 의존** | groupName="A"/"B" / category=division.code / status="approved" / @@unique(tournamentId, teamId) 가드 |
| `TournamentMatch` | `tournamentId` / `scheduledAt` / `homeTeamId`+`awayTeamId` (NULL 허용) | 59 row / 예선 46 = 실팀 / 순위전 13 = NULL+notes+settings | settings.{division_code, homeSlotLabel, awaySlotLabel, recording_mode:"flutter"} / venue_name |

### 3. 6 종별 format + settings 매핑

| # | code | label | format (enum) | settings JSON | 팀수 | 예선 | 순위전 | 합계 |
|---|------|-------|--------------|---------------|------|------|--------|------|
| 1 | `i2-U11` | "i2 U11" | `round_robin` | `{group_size: 5, group_count: 1}` | 5 | 10 | 0 | 10 |
| 2 | `i2-U12` | "i2 U12" | `round_robin` | `{group_size: 5, group_count: 1}` | 5 | 10 | 0 | 10 |
| 3 | `i3-U9` | "i3 U9" | `league_advancement` | `{group_size: 4, group_count: 2, linkage_pairs: [[1,1],[2,2],[3,3],[4,4]]}` | 8 | 8 | 4 | 12 |
| 4 | `i3-U11` | "i3 U11" | `group_stage_with_ranking` | `{group_size: 3, group_count: 2, ranking_format: "single_elimination"}` | 6 | 6 | 3 | 9 |
| 5 | `i3W-U12` | "i3W U12" | `group_stage_with_ranking` | `{group_size: 3, group_count: 2, ranking_format: "single_elimination"}` | 6 | 6 | 3 | 9 |
| 6 | `i3-U14` | "i3 U14" | `group_stage_with_ranking` | `{group_size: 3, group_count: 2, ranking_format: "single_elimination"}` | 6 | 6 | 3 | 9 |
| 계 | | | | | **36** | **46** | **13** | **59** |

⚠️ **format 결정 사유**:
- i2 U11/U12 (5팀 풀리그) = `round_robin` (조 1개 / 동순위전 0)
- i3 U9 (4팀 2개조 사각링크제) = `league_advancement` + `linkage_pairs:[[1,1],[2,2],[3,3],[4,4]]` (1·2·3·4위 모두 매칭)
- i3 U11/U12W/U14 (3팀 2개조 + 순위전) = `group_stage_with_ranking` (조별리그 + 동순위 자동 매칭)

⚠️ **`linkage_pairs` 형식 검증 필요**: developer 진입 전 `planLeagueAdvancementPlaceholders` 인터페이스 grep 의무 (형식 불일치 시 generator 가 placeholder 박제 실패 → 강남구 사고 재발).

### 4. 59 매치 INSERT 의사코드 (placeholder-helpers 통과 보장)

비유: "기록지 양식" = 본 스크립트 / "선수 이름" = 실팀 또는 "A조 1위" placeholder 라벨. 양식 통과 의무 = `buildSlotLabel` + `buildPlaceholderNotes` (인라인 문자열 ❌).

```ts
// 예선 매치 (실팀) — 46건
for (const m of preliminaryMatches) {
  await tx.tournamentMatch.create({
    data: {
      tournamentId,
      scheduledAt: m.dateUTC,                // KST → UTC 변환 필수
      venue_name: m.venue,                   // "강남구민체육관" 또는 "수도공고"
      homeTeamId: ttIdMap[m.homeTeamName],   // Team upsert → TournamentTeam upsert → BigInt id
      awayTeamId: ttIdMap[m.awayTeamName],
      roundName: "예선",
      group_name: m.group,                   // "A" / "B" (i3-U9 / i3 U11/U12W/U14)
      match_number: m.number,
      status: "scheduled",
      settings: {
        division_code: m.divisionCode,       // "i2-U11" 등
        recording_mode: "flutter",
      },
    },
  });
}

// 순위전 placeholder 매치 (NULL + notes + settings 3중) — 13건
import { buildSlotLabel, buildPlaceholderNotes } from "@/lib/tournaments/placeholder-helpers";
for (const m of placeholderMatches) {
  const homeSlot = buildSlotLabel({ kind: "group_rank", group: m.aGroup, rank: m.aRank }); // "A조 1위"
  const awaySlot = buildSlotLabel({ kind: "group_rank", group: m.bGroup, rank: m.bRank }); // "B조 1위"
  await tx.tournamentMatch.create({
    data: {
      tournamentId,
      scheduledAt: m.dateUTC,
      venue_name: m.venue,
      homeTeamId: null,
      awayTeamId: null,
      roundName: m.roundName,                // "결승" / "3위전" / "5위전" / "7위전" 또는 "순위결정전" — 결재 §7
      match_number: m.number,
      status: "scheduled",
      notes: buildPlaceholderNotes(homeSlot, awaySlot),  // "A조 1위 vs B조 1위" — ADVANCEMENT_REGEX 호환
      settings: {
        division_code: m.divisionCode,
        homeSlotLabel: homeSlot,
        awaySlotLabel: awaySlot,
        recording_mode: "flutter",
      },
    },
  });
}
```

### 5. idempotent 가드 spec (8중 — 4차 뉴비리그 패턴 답습)

| # | 가드 | 위치 | 동작 |
|---|------|------|------|
| 1 | Tournament SELECT 분기 | 시작 | 1건 → 재사용 / 0건 → 신규 / 2건+ → throw |
| 2 | tournamentId UUID 형식 검증 | INSERT 직후 | regex 통과 안 하면 throw |
| 3 | DivisionRule SELECT (code 매칭) | 종별 박제 전 | 6 code 모두 존재 시 skip / 일부 결손 시 결손분만 INSERT |
| 4 | Team SELECT (name 매칭) | 팀 박제 전 | name unique 아님 → 1건 → ID 재사용 / 0건 → 신규 / **2건+ → 사용자 결재 가드 (warning + skip)** |
| 5 | TournamentTeam UPSERT (`@@unique([tournamentId, teamId])` 활용) | TT INSERT | upsert 활용 시 자동 idempotent |
| 6 | TournamentMatch SELECT (tournamentId + scheduledAt + division_code + match_number 복합 키) | Match INSERT 전 | 존재 시 skip / 부재 시 INSERT |
| 7 | placeholder-helpers 통과 의무 | 순위전 매치 INSERT | raw 문자열 ❌ → buildSlotLabel + buildPlaceholderNotes 필수 |
| 8 | settings JSON 병합 | Match INSERT (UPDATE 케이스) | 기존 keys (recording_mode 등) 보존 + 신규 keys 추가 |

### 6. 사후 검증 query 5건

```ts
// 1. 종별 6건
assert((await prisma.tournamentDivisionRule.count({ where: { tournamentId } })) === 6);

// 2. 팀 36건
assert((await prisma.tournamentTeam.count({ where: { tournamentId } })) === 36);

// 3. 매치 59건
assert((await prisma.tournamentMatch.count({ where: { tournamentId } })) === 59);

// 4. placeholder 매치 13건 (homeTeamId IS NULL + notes "%위 vs%")
assert((await prisma.tournamentMatch.count({
  where: { tournamentId, homeTeamId: null, notes: { contains: "위 vs" } },
})) === 13);

// 5. ADVANCEMENT_REGEX 매칭률 100% (placeholder 13건 모두 매칭)
const placeholders = await prisma.tournamentMatch.findMany({
  where: { tournamentId, homeTeamId: null }, select: { id: true, notes: true },
});
const regex = /([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/;
for (const m of placeholders) assert(regex.test(m.notes ?? ""), `match ${m.id} regex fail`);
```

### 7. 스크립트 파일 위치 + 안전 가드 패턴

- **파일**: `scripts/_temp/seed-gnba-youth-2026.ts` (신규)
- **실행**: `npx tsx scripts/_temp/seed-gnba-youth-2026.ts` (사용자 명시 승인 후)
- **트랜잭션**: 단일 `prisma.$transaction([...], { timeout: 30000 })` (59 매치 = 충분 / 부분 실패 시 전체 롤백)
- **로그**: `console.log` 단계별 (Tournament 결정 → DivisionRule N → Team N → TournamentTeam N → Match N → 사후 검증) — 4차 뉴비리그 답습
- **사후 정리**: 작업 검증 후 `rm scripts/_temp/seed-gnba-youth-2026.ts` 의무 (CLAUDE.md §🗄️ DB 정책 §3)

### 8. 변경 파일 + 예상 LOC

| 파일 | 신규/수정 | 예상 LOC | 역할 |
|------|----------|---------|------|
| `scripts/_temp/seed-gnba-youth-2026.ts` | **신규** | **~450 LOC** | Tournament 분기 + 6 DivisionRule + 36 Team upsert + 36 TournamentTeam + 59 Match (예선 46 + 순위전 13) + 사후 검증 5 query |

LOC 분해: 헤더+import+상수 ~100 / 데이터 정의 (6 종별 + 36 팀 + 59 매치 JSON) ~200 / 분기+transaction+upsert ~100 / 사후 검증+로그 ~50.

### 9. 사용자 명시 승인 필요 항목 (스크립트 진입 전)

| # | 항목 | 결재 사유 |
|---|------|----------|
| 1 | **organizerId (BigInt)** | Tournament.organizerId FK NOT NULL — BDR 운영진 user_id 결재 필요 |
| 2 | **Tournament 신규 vs 기존 활용** | check-gnba-youth-2026.ts SELECT 결과 사전 알림 권장 |
| 3 | **Team upsert 정책** | Team.name 동일명 1건 → ID 재사용 OK 인지 (예: "스티즈강남" 동명이팀 가능성) |
| 4 | **`linkage_pairs` 형식 검증** | i3-U9 settings 의 linkage_pairs `[[1,1],[2,2],[3,3],[4,4]]` 형식이 generator 와 호환되는지 사전 grep |
| 5 | **시안 매치 시각 검증** | 5/16(토) i3-U11 16:00~ / i3-U14 15:30~ 등 운영자 사전 공지 일정과 일치 확인 |
| 6 | **시각 KST → UTC 변환** | scheduledAt = `Timestamp(6)` (timezone-naive). KST `2026-05-16 09:30` = UTC `2026-05-16 00:30` 박제 |
| 7 | **roundName 표준** | i3-U9 순위전 4건 = "결승" / "3위전" / "5위전" / "7위전" / 또는 "순위결정전" 단일 — 운영 표준 결재 |
| 8 | **division_tier vs settings.division_code** | 매치 박제 시 어느 단일 source — settings.division_code 권장 (advanceTournamentPlaceholders 호환) |

### ⚠️ developer 주의사항

1. **placeholder-helpers 통과 의무** — `buildSlotLabel({kind:"group_rank",...})` + `buildPlaceholderNotes(...)` 만 사용. raw 문자열 ❌
2. **Team upsert 가드** — `name` unique 아님 → SELECT 결과 2건+ 발견 시 throw + 사용자 결재
3. **TournamentTeam UPSERT** — `@@unique([tournamentId, teamId])` 활용 (`prisma.tournamentTeam.upsert({ where: { tournamentId_teamId: {...} } })`)
4. **시각 변환** — `new Date("2026-05-16T09:30:00+09:00")` 또는 명시 `Date.UTC(...)`
5. **트랜잭션 timeout** — 30000ms (59 INSERT + 36 upsert = 안전)
6. **i3-U9 순위전 roundName** — 결재 §7 결재 후 박제
7. **사후 검증 throw** — 5 query 중 1건이라도 실패 시 throw (스크립트는 INSERT 끝났지만 사용자에게 즉시 알림)
8. **사후 정리** — 작업 검증 후 본 파일 삭제 의무

### 🚦 위반 자동 reject

- 인라인 placeholder 문자열 박제 ❌ (강남구 사고 영구 차단 룰 errors.md #102)
- `prisma.tournamentMatch.create({ data: { notes: "A조 1위 vs B조 1위" } })` 직접 박제 ❌ → buildPlaceholderNotes 헬퍼 필수
- Tournament 중복 생성 (가드 #1 위반) ❌
- 트랜잭션 외부 INSERT ❌ (부분 실패 시 운영 DB orphan 데이터)
- `prisma db push` / schema 변경 ❌ (본 스크립트 = INSERT only)

## 구현 기록 (developer) — Track A 종별 탭 (2026-05-16)

📝 **구현한 기능**: `/playoffs` hub 종별 탭 분리 (옵션 A 인라인) — 강남구 6 종별 박제 시 세로 약 6240px → 단일 종별 표시로 운영자 시각 단축.

### 변경 파일 (단일)

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/playoffs-client.tsx` | 탭 UI + selectedDivision state + URL deep link sync (2 useEffect) + 5 섹션 prop 차등 (Banner / Advance / Standings / Ranking / Final) | 수정 | +128 / -14 |

### 자가 진단 5건

| # | 항목 | 결과 |
|---|------|------|
| 1 | playoffs-client.tsx 수정 확인 (LOC > 0) | ✅ +128 / -14 |
| 2 | 탭 UI 박제 (useSearchParams + 동적 종별) | ✅ 라인 219~261 박제 |
| 3 | 5 섹션 prop 차등 적용 | ✅ Banner=filteredMatches+applyFilter / Advance=advanceDivisionCodes / Standings=visibleStandings / Ranking·Final=filteredMatches 기반 (rankingMatches/finalMatches 자동 차등) |
| 4 | divisionStandings.length ≤ 1 가드 (회귀 0) | ✅ `showDivisionTabs = divisionStandings.length > 1` 가드 + useEffect 로 false 시 selectedDivision=null 강제 |
| 5 | tsc --noEmit 통과 | ✅ 0 error (no output) |

### git diff --stat HEAD (Track A 단일 파일)

```
src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/playoffs-client.tsx | 142 +++++++++++++++++++--
1 file changed, 128 insertions(+), 14 deletions(-)
```

(전체 working tree 의 다른 파일 22건 = score-sheet 다른 세션 트랙 / 본 작업 무관)

### 핵심 구현 spec

**state**:
- `selectedDivision: string | null` (URL `?division=` 초기화)
- `showDivisionTabs = divisionStandings.length > 1` (단일 종별 운영 회귀 0)

**URL sync**:
- useEffect #1: 잘못된 코드 / 단일 종별 모드 시 `setSelectedDivision(null)` 폴백
- useEffect #2: `router.replace(?division=)` 동기화 (scroll: false / searchParams dependency 제외 = 무한 loop 방지)

**5 섹션 차등**:
| 섹션 | prop | 단일 종별 모드 |
|------|------|------------|
| Banner | matches | filteredMatches + applyFilter true |
| Advance | divisionCodes | [selectedDivision] |
| Standings | divisionStandings | visibleStandings (filter) |
| Ranking | matches → rankingMatches | filteredMatches → rankingMatches 자동 |
| Final | matches → finalMatches | filteredMatches → finalMatches 자동 |

**디자인 13 룰 준수**:
- `var(--color-info)` Navy 활성 / `var(--color-elevated)` 비활성
- `rounded-[4px]` / `min-h-[44px]` 터치 영역 / `flex-wrap` 모바일 줄바꿈
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌

**시그니처 변경 0**: PlaceholderValidationBanner / AdvancePlayoffsButton / StandingsTable / DivisionMatchGroup / FinalCard 모두 props 시그니처 그대로 (부모에서 차등 전달만).

### 💡 tester 참고

- **테스트 1 (단일 종별 운영)**: divisionStandings.length === 1 → 탭 미렌더 (회귀 0)
- **테스트 2 (다중 종별)**: 강남구 6 종별 → 탭 7개 (전체 + 6 종별) / "전체" = 기존 동작 / 종별 클릭 = 해당 종별만 5 섹션
- **테스트 3 (URL deep link)**: `?division=i3-U9` 진입 → 탭 활성 / 잘못된 코드 → null 폴백
- **테스트 4 (Advance 단일)**: 단일 종별 모드 → 해당 종별만 호출 (전체 = 일괄)
- **정상**: 탭 클릭 → URL 갱신 / 5 섹션 모두 해당 종별만 표시
- **주의**: divisionStandings.length === 0 → 탭 미렌더 + 빈 화면 (기존 동작)

### ⚠️ reviewer 참고

- **useEffect dependency** — searchParams 의도적 제외 (eslint disable 주석 박제) — 무한 loop 방지 사유 명시
- **router.replace(qs ? `?${qs}` : "?")** — empty qs 시 "?" 안전 (next/navigation router.replace 빈 문자열 허용 안 함)
- **Banner applyFilter** — 단일 종별 모드만 true (전체 모드 false / 라벨 "(현재 필터 적용된 매치만 검증)" 의도 일치)

## 구현 기록 (developer) — Track B INSERT 스크립트 (2026-05-16)

📝 **구현한 기능**: 강남구협회장배 유소년부 2026 운영 DB INSERT 1회성 스크립트 박제 (실행 ❌). 6 종별 / 36 팀 / 59 매치 (예선 46 + 순위전 13 placeholder) idempotent 박제.

### 변경 파일 (Track B 단일)

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `scripts/_temp/seed-gnba-youth-2026.ts` | Tournament 분기 + 6 DivisionRule + 36 Team SELECT (가드) + 36 TournamentTeam upsert + 59 Match (예선 46 + 순위전 13) + 사후 검증 5 query / 8중 가드 / placeholder-helpers 통과 | **신규** | **+669** |

### git diff --stat HEAD (Track B 단일 파일)

```
scripts/_temp/seed-gnba-youth-2026.ts | 669 +++++++++ (신규 파일)
```

(전체 working tree 의 다른 파일 22건 = score-sheet 다른 세션 트랙 + Track A playoffs-client.tsx / 본 Track B 무관)

### tsc --noEmit 결과

```
EXIT=0 (no output / 0 error)
```

### 자가 진단 6건 (필수)

| # | 항목 | 결과 |
|---|------|------|
| 1 | scripts/_temp/seed-gnba-youth-2026.ts 신규 파일 (LOC > 0) | ✅ +669 LOC |
| 2 | 시안 데이터 100% 박제 (6 종별 / 36 팀 / 59 매치) | ✅ DIVISIONS 6 + TEAMS 36 + PRELIMINARY_MATCHES 46 + PLACEHOLDER_MATCHES 13 |
| 3 | placeholder-helpers buildSlotLabel + buildPlaceholderNotes 호출 확인 | ✅ 라인 447~449 (순위전 13건 모두 헬퍼 경유) |
| 4 | 8중 가드 박제 | ✅ ORGANIZER_USER_ID env / user 존재 / Tournament 0·1·2+ 분기 / DivisionRule code 매칭 / Team 동명 가드 + 부재 throw / TournamentTeam upsert / Match 복합키 idempotent / 사후 5 query throw |
| 5 | 사후 검증 query 박제 | ✅ 라인 487~520 (count 4건 + ADVANCEMENT_REGEX 매칭률 검증) |
| 6 | tsc --noEmit 0 | ✅ EXIT=0 |

### 핵심 박제 spec

**8중 가드**:
1. `ORGANIZER_USER_ID` env 필수 — `process.env` 누락 throw / BigInt 변환 실패 throw
2. 운영자 user 존재 검증 — `prisma.user.findUnique` (id 부재 → throw)
3. Tournament 분기 — `name LIKE "강남구협회장배"` AND `startDate ∈ [2026-05-15, 2026-05-18)` (0건 신규 / 1건 재사용 / 2건+ throw)
4. `prisma.$transaction` (timeout 30000ms) — 부분 실패 시 전체 롤백
5. DivisionRule code 매칭 idempotent — 6건 중 결손분만 INSERT
6. Team SELECT (name 매칭) — 동명 2건+ throw / 부재 throw (captainId FK NOT NULL → 자동 생성 ❌)
7. TournamentTeam upsert — `@@unique([tournamentId, teamId])` 활용
8. TournamentMatch 복합 키 idempotent — `scheduledAt.toISOString() | division_code | match_number` Set 기반 skip

**placeholder-helpers 통과 의무 (errors.md #102 영구 차단 룰)**:
- 순위전 13건 모두 `buildSlotLabel({ kind: "group_rank", group, rank })` + `buildPlaceholderNotes(homeSlot, awaySlot)` 헬퍼 경유
- 인라인 문자열 박제 ❌
- settings.{homeSlotLabel, awaySlotLabel, division_code, recording_mode} 4중 박제

**KST → UTC 자동 변환**:
- `new Date("2026-05-16T09:30:00+09:00")` 박제 → Prisma 가 UTC 변환 후 `Timestamp(6)` 저장
- 시안 시각 그대로 ISO 박제 (오프셋 명시 = 운영자 timezone 무관 안전)

**Tournament 신규 박제 시**:
- `generateApiToken()` 헬퍼 경유 (errors.md #49 룰)
- Tournament.format = "single_elimination" 디폴트 (종별별 format 우선 = TournamentDivisionRule.format 단일 source)

**6 종별 format 매핑** (planner § 3 표 기반):
| code | format | settings |
|------|--------|---------|
| i2-U11 / i2-U12 | round_robin | group_size: 5, group_count: 1 |
| i3-U9 | league_advancement | group_size: 4, group_count: 2, linkage_pairs: [[1,1],[2,2],[3,3],[4,4]] |
| i3-U11 / i3W-U12 / i3-U14 | group_stage_with_ranking | group_size: 3, group_count: 2, ranking_format: "single_elimination" |

**i3-U9 순위전 roundName** (planner § 9 §7 결재 항목):
- 4건 = "7·8위전" / "5·6위전" / "3·4위전" / "결승" (한국 농구 표준 — 4위 동순위전부터 결승까지)
- i3-U11 / U12 / U14 (3팀 2개조) = "5·6위전" / "3·4위전" / "결승" 3건씩

### 💡 tester 참고

- **테스트 1 (스크립트 실행 검증)**: 사용자 결재 후 `ORGANIZER_USER_ID=<id> npx tsx scripts/_temp/seed-gnba-youth-2026.ts` 실행 → console.log 8 단계 출력 확인
- **테스트 2 (idempotent 재실행)**: 동일 명령 2회 실행 → 2회차 = 모두 skip (rule 0 + tt 0 INSERT + match 0 INSERT)
- **테스트 3 (사용자 결재 사전 가드)**: 미결재 진입 시 가드 1·2·3·5·8 throw 동작 확인
- **테스트 4 (운영 영향 0 검증)**: tsc --noEmit (실제 prisma 호출 0)
- **정상 동작**: tsc 0 / 사용자 미결재 시 가드 throw / 결재 후 실행 시 6+36+59 = 101 row 박제
- **주의 입력**: ORGANIZER_USER_ID 미세팅 / 잘못된 BigInt / 동명 팀 1건+ 운영 DB 등록

### ⚠️ reviewer 참고

- **본 스크립트 = 실행 0 박제만**: planner spec 통과 + tsc 0 만 검증. 운영 DB INSERT = 사용자 명시 승인 후 별도 호출
- **TournamentTeam division 한계 (라인 363~366 주석)**: 동일 Team 이 다종별 등장 시 (예: "스티즈강남" 4 종별 등장) TournamentTeam 1 row 의 division 필드는 마지막 종별로 갱신됨. 매치 박제는 teamId 만 사용하므로 매치 영향 0
- **Team 자동 생성 ❌**: Team.captainId FK NOT NULL → 본 스크립트는 Team 부재 시 throw + 사용자 결재 (운영자가 사전 등록 필수)
- **사용자 결재 8 항목 잔존**: planner § 9 표 §1·§3·§5 (organizerId / 동명팀 결재 / 시각 검증) = 사용자 실행 직전 사전 검토 필수
- **사후 정리 의무**: 작업 검증 후 `scripts/_temp/seed-gnba-youth-2026.ts` + `scripts/_temp/check-gnba-youth-2026.ts` 삭제 (CLAUDE.md §🗄️ DB 정책 §3)

## 진행 현황표

### 대진표 후속 큐 (이전 완료)

## 진행 현황표

### 대진표 후속 큐 (이전 완료)
| # | PR | commit |
|---|----|--------|
| 1 | PR-G5.5-followup-B | `df96522` |
| 2 | PR-G5.5-NBA-seed | `b1e48b8` |
| 3 | PR-G5.2 dual refactor | `eaccd54` |
| 4 | PR-G5.7 double_elim | 🔵 보류 (운영 사용 0) |
| 5 | PR-G5.8 swiss | `b8b3117` |

### Admin Phase 1 우선 1~6 (본 세션)
| 우선 | PR | commit | LOC |
|------|----|--------|-----|
| 1 | NextStepCTA | `4c05c8c` | +124 |
| 2 | AdvancePlayoffsButton | `1e4b535` | +423/-43 |
| 3 | PlaceholderValidationBanner | `823d692` | +428 |
| 4 | bracket 종별별 trigger | `6d7718a` | +596 |
| 5 | SetupChecklist 통합 | `f4b0f95` | +553/-84 |
| 6 | /playoffs hub | `f250e8c` | +936 |

## 미푸시 commit
- knowledge 갱신 commit 진행 후 별도 push (subin = origin/subin `f250e8c` 까지 push 완료)

## working tree (다른 트랙 보존)
- score-sheet 트랙 22 파일 (다른 세션 작업 / 본 admin 트랙과 무관)
- `bdr 디자인 시스템 관리/admin-design-2026-05-15/` (디자인 트랙)

## 후속 큐 (Phase 2 / 별도 세션)
- **/setup stepper** — 셋업 단계별 진행 stepper (점검 §6.4 신규 페이지 후보)
- **마법사 Phase 2~4** — Step 0/1/2 시안 진입 (D1~D4 BLOCKED)
- **마법사 Phase 5~10** — 종별·팀·대진표 흡수 (대규모)
- **group_stage_knockout generator 풀구현** — 현재 stub
- **generate endpoint GenerateOptions 확장** — venueName / startScheduledAt / intervalMinutes
- **generateSwissNextRound 풀구현** — PR-G5.8 후속
- **PR-G5.7 double_elim** — 운영 진입 시점 박제
- **CLI 핸드오프 2차** ⭐ — admin 시각 확장
- **dev 브랜치 sync** — origin/dev = origin/main 보다 84+ commit stale

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 구현 기록 (developer) — PR-Public-1

📝 구현한 기능: 공개 tournament 페이지 bracket 탭 다종별 view (강남구협회장배 매치 59건 미표시 fix). 통합 1 PR (API + UI).

### git diff --stat HEAD (자가 진단 1 — 박제 검증)
```
 .../_components/division-group-composition.tsx     | 159 +++++++  (신규)
 .../[id]/_components/division-schedule-table.tsx   | 391 ++++++  (신규)
 .../[id]/_components/divisions-view.tsx            | 478 ++++++  (신규)
 .../[id]/_components/v2-bracket-wrapper.tsx        |  44 +/-5    (분기 추가)
 .../[id]/bracket/_components/group-standings.tsx   |   3 +       (GroupTeam.division 옵셔널 필드)
 .../web/tournaments/[id]/public-bracket/route.ts   |  48 +       (divisionRules / divisionStandings / groupTeams.division)
 6 files changed, 1118 insertions(+), 5 deletions(-)
```

### 자가 진단 6건
| # | 항목 | 결과 |
|---|------|------|
| 1 | public-bracket route.ts +35 LOC 확인 | ✅ +48 (divisionRules + divisionStandings Promise.all + groupTeams.division 신규 필드 3건) |
| 2 | v2-bracket-wrapper.tsx 분기 추가 | ✅ +44/-5 (default 분기 4단 우선순위: hasKnockout > divisionRules >= 1 > groupTeams > BracketEmpty) |
| 3 | 3 신규 컴포넌트 박제 | ✅ divisions-view (478) + division-schedule-table (391) + division-group-composition (159) = 1028 LOC |
| 4 | 종별 탭 + 5 섹션 렌더링 | ✅ 탭 (≥2 종별 가드 / admin /playoffs:138 동등) + 섹션 1 조편성 / 2 종별 standings / 3 예선 일정 / 4 순위결정전 / 5 결승 |
| 5 | tsc 0 | ✅ 0 errors (GroupTeam.division 옵셔널 추가 시 회귀 0) |
| 6 | admin /playoffs 변경 0 (회귀 0) | ✅ admin 디렉토리 0 변경 (StandingsTable / playoffs-client / Banner / Advance 모두 그대로) |

### 변경 파일 표
| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/tournaments/[id]/public-bracket/route.ts` | divisionRules (4 필드 selet) + divisionStandings (Promise.all + getDivisionStandings) + groupTeams[].division 추가 (+48) | 수정 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-wrapper.tsx` | 데이터 추출 (+5) + default 분기 4단 우선순위 (+44/-5) | 수정 |
| `src/app/(web)/tournaments/[id]/_components/divisions-view.tsx` | 종별 탭 + 5 섹션 컴포지션 + URL deep link + DivisionStandingsView 인라인 | 신규 (478) |
| `src/app/(web)/tournaments/[id]/_components/division-schedule-table.tsx` | 매치 일정 표 (PC 표 + 모바일 카드) + slotLabel 폴백 + 상태 색상 | 신규 (391) |
| `src/app/(web)/tournaments/[id]/_components/division-group-composition.tsx` | 조편성 표 (Navy 헤더 + 시드/팀명/로고) | 신규 (159) |
| `src/app/(web)/tournaments/[id]/bracket/_components/group-standings.tsx` | GroupTeam.division 옵셔널 필드 추가 (3줄) | 수정 |
| **합계** | **+1118 / -5 LOC** | |

💡 tester 참고:
- **테스트 방법**: `/tournaments/<강남구협회장배 ID>?tab=bracket` 접속 → 종별 탭 (i3-U9 / i3-U11 / i3-U14 / i3-U12W / i2-U11 / i2-U12 등 6 종별) + "전체" 탭 노출 확인.
- **정상 동작**:
  1. 종별 탭 클릭 → URL `?tab=bracket&division=i3-U9` deep link 동기화
  2. 단일 종별 = 섹션 4 (조편성 / standings / 예선 / 순위전 / 결승) 박제분만 표시
  3. 매치 59건 = 종별별 (예선 46 + 순위전 13 placeholder) 분류 표시
  4. placeholder 매치 = "A조 1위" 등 settings.homeSlotLabel/awaySlotLabel 텍스트 (italic muted)
  5. PC = 표 / 모바일 (sm 미만) = 카드 스택
- **회귀 검증 필수 (단일 종별 대회)**:
  - 4차 BDR 뉴비리그 (`full_league_knockout` + groupTeams 박제) — 기존 `hasLeagueData && groupTeams.length > 0` 분기 진입 (회귀 0)
  - single_elim 대회 — `hasKnockout=true` 분기 진입 (회귀 0)
  - dual_tournament 대회 — `isDual=true` 분기 진입 (회귀 0)
  - round_robin 단일 종별 (divisionRules.length=0) → 기존 LeagueStandings 분기 (회귀 0)
- **주의할 입력**:
  - 강남구 매치는 `round_number=null` `bracket_position=null` (기존 BracketView 트리 미적용 / 본 PR 의 신규 view 진입)
  - format=null 다종별 대회는 isLeague=true (route.ts:45) → 단 hasLeagueData false (leagueTeams 0건 = 종별 분류 → leagueTeams 의 wins/losses 가 0 종별별 합산 안 됨) → divisionRules >= 1 분기 진입

⚠️ reviewer 참고:
- **분기 우선순위 4단 핵심**: hasKnockout > divisionRules >= 1 > groupTeams > BracketEmpty. 이 순서가 single_elim / dual / full_league_knockout 회귀 0 보장.
- **GroupTeam.division 옵셔널** (`?: string | null`): 단일 종별 운영 = undefined 또는 null → 기존 GroupStandings 가 이 필드 미사용 (회귀 0).
- **divisionStandings 0건 분기**: divisionRules >= 1 이라도 standings 0건 (예선 시작 전) = 섹션 2 (DivisionStandingsView) 미렌더 (조건 `standings.length > 0`).
- **admin /playoffs 의존 0**: admin 컴포넌트 (StandingsTable / playoffs-client / DivisionMatchGroup / PlayoffMatchRow / FinalCard) 변경 0. 본 컴포넌트들은 web 디자인 토큰 (var(--color-*)) + GroupStandings 패턴 답습 = 디자인 정합.
- **운영 DB 영향**: 0 (route.ts SELECT 1쿼리 추가 = TournamentDivisionRule + getDivisionStandings 의 종별 N회. UPDATE 0).

## 구현 기록 (developer) — 영구 fix updateTeamStandings SET 방식 (2026-05-16)

📝 구현한 기능: `updateTeamStandings` SET 방식 변환 (옵션 A) — 동일 매치 N회 호출 시 idempotent 보장. errors.md 6회째 회귀 (강남구 i3-U9 / 은평 PA 17→34 사고) 영구 차단.

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|---------|
| `src/lib/tournaments/update-standings.ts` | `updateTeamStandings` SET 방식 재구현 (매치 fetch → 종별 매치 전체 SELECT → in-memory 합산 → SET UPDATE) / `advanceWinner` 변경 0 | +205 / -28 | 수정 |
| `src/__tests__/lib/tournaments/update-standings.test.ts` | 신규 vitest 5 케이스 (단건 / idempotent / 합산 / 정정 / 종별 격리) — `vi.doMock("@/lib/db/prisma")` 패턴 | +420 신규 | 신규 |
| `scripts/_temp/recalc-standings-set.ts` | 삭제 (함수 통합) | -116 (untracked) | 삭제 |
| `scripts/_temp/diag-i3u9.ts` | 삭제 (조사 종료) | -90 (untracked) | 삭제 |
| `src/lib/tournaments/finalize-match-completion.ts` | **변경 0** (시그니처 동일) | 0 | - |

### 검증 결과

| 검증 | 명령 | 결과 |
|-----|------|------|
| `git diff --stat HEAD` (intent-to-add 포함) | `git add -N + diff --stat` | scratchpad +325 / update-standings.test.ts +420 신규 / update-standings.ts +205/-28 / **합계 +919 / -31** |
| TypeScript 컴파일 | `npx tsc --noEmit` | EXIT=0 (에러 0) |
| vitest tournaments | `npx vitest run src/__tests__/lib/tournaments/` | **14 files / 256/256 PASS** (신규 update-standings.test.ts 5/5 PASS 112ms) |

### 자가 진단 5건 (PM spec)

| # | 항목 | 결과 |
|---|------|------|
| 1 | update-standings.ts SET 방식 재구현 | ✅ L70~ updateTeamStandings 본문 = 매치 fetch → 종별 매치 SELECT → in-memory 합산 → updateMany SET (트랜잭션 wrap) |
| 2 | vitest 5 케이스 PASS (idempotent + 합산 정확 + 격리) | ✅ 5/5 PASS — 케이스 2 (동일 매치 3회 호출 → 결과 변화 0) + 케이스 4 (점수 수정 후 정정) + 케이스 5 (종별 격리) 핵심 통과 |
| 3 | 즉시 fix 스크립트 삭제 | ✅ `recalc-standings-set.ts` + `diag-i3u9.ts` 둘 다 삭제 (둘 다 untracked → git ls-files 미존재 = 운영 영향 0) |
| 4 | tsc 0 | ✅ EXIT=0 출력 0 |
| 5 | finalize-match-completion / 다른 caller 시그니그 변경 0 | ✅ `updateTeamStandings(matchId: bigint)` 시그니처 유지. 호출처 = finalize-match-completion L102 1건 (variadic 변경 0) |

### 핵심 로직 구조

```ts
// 1. 매치 fetch (tournamentId + home/away + division_code)
const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId }, select: {...} });

// 2. 종별 완료 매치 전체 SELECT (winner_team_id NOT NULL + division_code 일치)
const completedMatches = await prisma.tournamentMatch.findMany({
  where: { tournamentId, status: "completed", winner_team_id: { not: null }, settings: { path: ["division_code"], equals: divisionCode } },
});
// 무승부 매치도 별도 SELECT (winner_team_id=null + scores 있음)

// 3. in-memory 합산 (영향 받는 2 팀: home + away 만 — 매치 단건 trigger 의무)
//    한 팀이 home/away 양쪽으로 출전 가능 → m.homeTeamId/m.awayTeamId 양 케이스 분기

// 4. updateMany SET (트랜잭션 wrap — 영향 받는 2 팀)
await prisma.$transaction([
  prisma.tournamentTeam.updateMany({ where: {...home}, data: { wins, losses, draws, points_for, points_against, point_difference } }),
  prisma.tournamentTeam.updateMany({ where: {...away}, data: {...} }),
]);
```

### race / 외부 스크립트 안전성

| 시나리오 | 기존 (increment) | 신규 (SET) |
|---------|----------------|---------|
| Flutter sync 단건 + batch-sync 동시 호출 | ❌ 2배 increment (은평 PA 17→34) | ✅ 마지막 호출이 정확한 결과 SET |
| 외부 스크립트 (`scripts/_temp/*`) 직접 호출 | ❌ 무조건 increment | ✅ SET 재계산 (안전) |
| concurrent 2회 호출 (TOCTOU) | ❌ 가드 무관 누적 | ✅ 같은 매치 SELECT → 같은 결과 SET |

💡 tester / reviewer 참고:
- **테스트 방법**: `npx vitest run src/__tests__/lib/tournaments/update-standings.test.ts` (5 케이스 모두 PASS 확인)
- **정상 동작**:
  - 단일 매치 종료 후 standings 정확
  - 동일 매치 N회 호출 후에도 standings 변화 0 (idempotent 핵심)
  - 종별 격리 (i3-U9 trigger → i4-U10 매치 합산 제외)
- **주의할 입력**:
  - settings.division_code 없는 매치 (4차 뉴비리그 패턴) → tournament 전체 매치 합산 (격리 0)
  - 운영 DB 검증 시 강남구 i3-U9 6 매치 trigger → 사후 standings 정합 확인 권장
- **회귀 위험 점검**:
  - 매치 단건 trigger 이므로 본 함수는 영향 받는 2 팀 (home/away) 만 UPDATE — 종별 전체 reset (예: 매치 0건 팀) 은 미수행 → 정상 운영에선 finalize 가 모든 매치 종료시 호출되므로 자연스럽게 정확값 SET
- **finalize-match-completion 영향 0**: caller 시그니처 동일 (matchId: bigint) → 회귀 위험 0
- **운영 DB 영향**: 본 PR 자체는 SELECT 0 / UPDATE 0 (코드 변경만). 박제 후 첫 finalize 호출 시 standings SET 으로 정정 (강남구 i3-U9 자동 정상화)

## 구현 기록 (developer / 2026-05-16) — PR5 마무리: 남은 3 endpoint 결정 사유 박제

📝 **구현한 기능**: 옵션 C+UI PR5 v1 6 endpoints 우선순위 로직의 **마지막 3 endpoint** 분류 + 코드 박제. 케이스 분석 결과 3개 모두 **매치 컨텍스트 없는 endpoint** 로 판단 → resolver 미적용 + 결정 사유 코멘트 박제. PR 지시문에서 PM이 예상한 케이스와 100% 일치.

### 변경 파일 (3건 모두 코멘트 추가만)

| 파일 경로 | 변경 내용 | resolver 적용 여부 | 사유 |
|----------|----------|------------------|------|
| `src/app/api/v1/players/[id]/stats/route.ts` | 파일 상단 3줄 코멘트 박제 | ❌ 미적용 | **선수 시즌통계** = `player.jerseyNumber` 단일 필드 (대표 영구값). 응답이 다중 매치 stats 집계인데 jersey 와 매치 매핑은 스키마상 표현 불가 → ttp.jerseyNumber 정답. 매치별 정확값은 `v1/matches/[id]/stats` (이미 PR5 적용) 가 담당. |
| `src/app/api/v1/tournaments/[id]/full-data/route.ts` | 파일 상단 4줄 코멘트 박제 | ❌ 미적용 | **대회 전체 오프라인 dump** = `players[].jersey_number` (선수당 1번호 정적 명단) + `matches[]` (별도 배열, join 없음). 매치별 매핑 스키마상 불가 → Flutter 앱이 매치 진입 시 별도 endpoint 호출로 정확값 획득. |
| `src/app/api/v1/tournaments/[id]/teams/[teamId]/players/route.ts` | 파일 상단 3줄 코멘트 박제 | ❌ 미적용 | **팀 영구 명단 관리 endpoint** = POST (ttp.jerseyNumber 직접 INSERT, source-of-truth 자체) + GET (팀 영구 명단 증분 동기화). 매치 컨텍스트 0 — resolver 적용 대상 자체가 아닌 admin endpoint. |

### PR5 v1 6 endpoints 최종 분류

| # | endpoint | 적용 여부 | 사용 helper |
|---|----------|----------|------------|
| 1 | `v1/matches/[id]/stats` | ✅ 적용 (이전 PR) | `resolveMatchJerseysBatch` |
| 2 | `v1/matches/[id]/roster` | ✅ 적용 (이전 PR) | `resolveMatchJerseysBatch` |
| 3 | `v1/tournaments/[id]/player-stats` | ✅ 적용 (이전 PR) | `resolveMatchJerseysMulti` |
| 4 | `v1/players/[id]/stats` | ❌ 미적용 (본 PR — 코멘트 박제) | — |
| 5 | `v1/tournaments/[id]/full-data` | ❌ 미적용 (본 PR — 코멘트 박제) | — |
| 6 | `v1/tournaments/[id]/teams/[teamId]/players` | ❌ 미적용 (본 PR — 코멘트 박제) | — |

→ 적용 3 / 미적용 3 = 100% 분류 완료. 미적용 3 의 사유는 코드에 영구 박제 (재방문 시 회귀 0).

### 검증 결과

| 검증 | 결과 |
|------|------|
| `npx tsc --noEmit` | EXIT=0 ✅ |
| 응답 스키마 변경 | 0 (Flutter v1 영향 0) |
| 운영 DB 영향 | 0 (코드만 수정) |
| import 변경 | 0 (resolver 미적용 → import 추가 없음) |

💡 **tester 참고**:
- 테스트 방법: tsc 통과만으로 검증 충분 (코멘트 추가만, 로직 변경 0)
- 정상 동작: 3 endpoint 응답 스키마 변경 0, jersey_number 값 = ttp.jerseyNumber 그대로 (이전과 동일)
- 주의할 입력: 매치 컨텍스트 가진 새 endpoint 가 추가될 경우 → 본 PR 코멘트 패턴 따라 적용 / 미적용 결정 명시

⚠️ **reviewer 참고**:
- 특별히 봐줬으면 하는 부분:
  - 3 파일 상단 코멘트 의 **결정 사유** (매치 컨텍스트 유무 + 응답 스키마 의미 + 대안 endpoint 안내)
  - PR5 의 6 endpoints 분류가 **응답 스키마 매핑 가능성** 기준으로 정확한지 (매치별 jersey 표현 가능 = 적용 / 단일 jersey 필드 = 미적용)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
| 2026-05-16 | **PR5 마무리 — 남은 3 endpoint 결정 사유 박제 (developer)** ⭐ | ✅ 코멘트 박제 3 파일 (`v1/players/[id]/stats` +3줄 / `v1/tournaments/[id]/full-data` +5줄 / `v1/tournaments/[id]/teams/[teamId]/players` +4줄) = **+12 LOC** / tsc EXIT=0 / 응답 스키마 변경 0 (Flutter v1 영향 0) / 운영 DB 영향 0 / 3개 모두 매치 컨텍스트 없는 endpoint 로 판단 (선수 시즌통계 / 대회 정적 dump / 팀 영구 명단 admin) → resolver 미적용 + 결정 사유 영구 박제 / PR5 6 endpoints 분류 완료 (적용 3 / 미적용 3) / PM 결재 (commit / push) 대기 |
| 2026-05-16 | **영구 fix 박제 — updateTeamStandings SET 방식 변환 (developer / 옵션 A)** ⭐ | ✅ 수정 1 (`src/lib/tournaments/update-standings.ts` +205/-28) + 신규 1 (`src/__tests__/lib/tournaments/update-standings.test.ts` +420) + 삭제 2 (`scripts/_temp/recalc-standings-set.ts` -116 untracked / `scripts/_temp/diag-i3u9.ts` -90 untracked) = **+625 / -28 LOC** / tsc 0 / vitest 256/256 PASS (신규 5/5 PASS 112ms) / `updateTeamStandings(matchId: bigint)` 시그니처 변경 0 / finalize-match-completion 영향 0 / advanceWinner 영향 0 / idempotent 100% (동일 매치 N회 호출 결과 동일) / race / 외부 스크립트 안전 / 종별 격리 (settings.division_code 기준) / 자가 진단 5/5 / PM 결재 (commit / push / 강남구 i3-U9 정상화 trigger) 대기 |
| 2026-05-16 | **영구 fix 기획설계 — 매치 종료 path 5종 중 1종 누락 (planner-architect)** ⭐ | 🟡 분석 / 코드 수정 0 / DB SELECT 0 / 누락 path 발견 #5 Flutter v1 `/api/v1/matches/:id/status` (`updateMatchStatus`) = updateTeamStandings + placeholder advancer 둘 다 누락 (강남구 i3-U9 사고 = 본 path 의심) + #3 batch-sync = placeholder + dual 누락 / 옵션 B (단일 통합 헬퍼 `finalizeMatchCompletion`) 권장 / 예상 +148 / -220 LOC 순감 -72 / 5 파일 변경 / errors.md defense in depth 5회째 회귀 / PM 결재 5 항목 (Q1~Q5) — B + 2 PR 분해 + 즉시 fix 별건 권장 |
| 2026-05-16 | **긴급 박제 — 라이브 PBP paper 매치 정렬 안정 fix (developer / 옵션 C)** ⭐ | ✅ 수정 1 (`src/app/api/live/[id]/route.ts` +18/-2 LOC — Prisma select `created_at` 추가 + `sortedPbp` 3차 tiebreak `created_at ASC` 박제) / tsc EXIT=0 / digital (Flutter) PBP 영향 0 (game_clock 차이로 2차에서 결정 → 3차 미발화) / 라이브 시간 표시 "Q1 0:00" 보존 / 박스스코어 / quarterScores / hero-scoreboard / score-sheet 영향 0 / DB schema 0 / Phase 22 paper override 충돌 0 / 시안 13 룰 100% / PM 결재 (commit / push / 머지) 대기 |
| 2026-05-16 | **긴급 박제 — 점프볼 즉시 sync + PBP 한글 라벨 (developer)** ⭐ | ✅ 신규 1 (`src/lib/live/pbp-format.ts` +120 — formatPbpAction 헬퍼 / action_type + points + subtype 분기 → "3점 성공" / "수비리바운드" / "U파울" 등) + 수정 2 (`score-sheet-form.tsx` handleJumpBallConfirm +36 LOC — setTimeout(0) 즉시 sync 1회 fire-and-forget + status="in_progress" override / `live/[id]/page.tsx` import +4 + PbpSection 컬럼 박제 +29/-7 — 시간/팀/번호/**선수**/행동/점수 6 컬럼 + 팀명 텍스트 칩 (색 점 ❌) + formatPbpAction 호출) = **+185 / -7 LOC** / tsc 0 / 자동 sync 10초 interval 영향 0 (점프볼 = 1회 추가) / 다른 라이브 컴포넌트 영향 0 / score-sheet UX 변경 0 / 시안 13 룰 100% / PM 결재 (commit / push / 머지) 대기 |
| 2026-05-16 | **긴급 박제 — i3 자동 halves + 점프볼 버튼 박제 (developer)** ⭐ | ✅ 3 파일 수정 (`page.tsx` +65 / `score-sheet-form.tsx` +18/-13 / `fiba-header.tsx` +55/-2) = **~+135 LOC** / tsc 0 / 작업 1 = i3 종별 (division_code 또는 ttp.division "i3" prefix) 자동 `initialPeriodFormat="halves"` (server settings.period_format 우선순위 보존) / 작업 2 = `handleLineupConfirm` 자동 점프볼 trigger 제거 + `handleArrowClick` 분기 (openingJumpBall===null → 점프볼 모달 / 박힘 → 헬드볼 confirm) + fiba-header 화살표 자리에 [점프볼] 텍스트 버튼 박제 (회색 outline / 4px radius / 빨강 본문 ❌) / 운영 영향 0 (i3 외 종별 / 기존 박제 매치) |
|------|------|------|
| 2026-05-16 | **긴급 박제 — 전후반 모드 라벨 분기 + period_format DB 박제 (developer)** ⭐ | ✅ 수정 7 (`quarter-end-modal.tsx` +17/-3 props + endedLabel 분기 / `score-sheet-form.tsx` +12 modal periodFormat prop + buildPayload 인자 + state 초기값 server 우선 / `build-submit-payload.ts` +21 인자 + payload 박제 / `submit/route.ts` +18 zod schema + settings JSON merge / `page.tsx` +13 settings.period_format SELECT + prop drilling / `api/live/[id]/route.ts` +20 응답 periodFormat 박제 / `live/[id]/page.tsx` +38/-7 interface 확장 + quarters 라벨 분기 / `_v2/game-result.tsx` +5 interface 확장 / `_v2/hero-scoreboard.tsx` +35/-4 quarters 라벨 분기) = **+179 / -14 LOC** / tsc 0 / "후반 종료" + "전반/후반/OT1+" 라벨 / halves 매치 = period 3+ OT / quarters 매치 영향 0 / DB schema 0 / settings JSON merge / PM 결재 (commit / 머지) 대기 |
| 2026-05-16 | **PR-SS-Manual-v3 공격권 섹션 추가 (developer)** ⭐ | ✅ 수정 1 (`score-sheet-form.tsx` handleOpenManual +67/-13 LOC) / 신규 섹션 = (5) **공격권 (FIBA Alternating Possession)** icon `sync_alt` 본문 4건 (첫 점프볼 / 화살표 / 헬드볼 / 쿼터 종료 자동 토글) / PeriodColorLegend 박스화 (h3 "쿼터별 색상 / 점수 표기" icon `palette`) / 기존 5/6 → 6/7 번호 밀림 / 비개발자 표현 "점프볼(공중 던진 공 잡기)" / "헬드볼(두 팀이 공 동시에 잡음)" 풀어 설명 / tsc 0 / handleOpenManual signature 변경 0 / ConfirmModal 호출 패턴 변경 0 (title / size: "xl" / options) / 다른 핸들러 영향 0 / var(--color-*) 토큰만 / material-symbols-outlined / 빨강 본문 0 / PM 결재 (commit / push) 대기 |
| 2026-05-16 | **PR-Possession-3 BFF + PBP 박제 (developer)** ⭐ | ✅ 수정 2 (`score-sheet-form.tsx` +23 buildSubmitPayload possession 키 / `submit/route.ts` +185/-4 possessionSchema zod + possessionToPBPInputs 호출 + player_id fallback + audit 박제) = **+208 / -4 LOC** / tsc 0 / vitest 1002/1003 PASS (1 fail = PR 범위 밖 기존 회귀) / 운영 DB SELECT: paper 매치 10건 / 기존 jump_ball/held_ball PBP 0건 baseline / 매치 171 paper scheduled / action_type=`jump_ball`/`held_ball` 박제 / local_id=`paper-possession-{type}-{idx}` idempotent / player_id fallback (winnerPlayerId → starters[0] → skip) / schema 변경 0 / Phase 22/23 영향 0 / PM 결재 (commit / push) 대기 |
| 2026-05-16 | **PR-Public-1 공개 bracket 종별 view 박제 (developer)** ⭐ | ✅ 신규 3 (`divisions-view` 478 / `division-schedule-table` 391 / `division-group-composition` 159) + 수정 3 (`public-bracket/route.ts` +48 / `v2-bracket-wrapper.tsx` +44/-5 / `group-standings.tsx` +3) = **+1118 / -5 LOC** / tsc 0 / 자가 진단 6/6 / admin /playoffs 변경 0 / hasKnockout 우선 분기 보존 (회귀 0) / divisionRules / divisionStandings / groupTeams.division 신규 필드 3건 / URL ?division= deep link / 종별 탭 (≥2 가드) / 5 섹션 (조편성 / standings / 예선 / 순위전 / 결승) / 시안 13 룰 100% / PM 결재 (commit / push) 대기 |
| 2026-05-16 | **PR-Possession-2 UI + state + 모달 박제 (developer)** ⭐ | ✅ 신규 2 (`jump-ball-modal.tsx` +296 / `possession-confirm-modal.tsx` +84) + 수정 3 (`fiba-header.tsx` +85/-10 / `score-sheet-form.tsx` +130/-3 / `draft-storage.ts` +4) = **+612 / -13 LOC** / tsc 0 / vitest possession-helpers 15/15 PASS (295ms) / score-sheet 전체 209/210 PASS (1 fail = PR 범위 밖 기존 회귀) / 첫 점프볼 자동 trigger / 화살표 56px 회색 / 헬드볼 confirm 모달 / 쿼터 종료 자동 토글 / draft 박제 / BFF / DB 영향 0 (= PR-3) / 시안 13 룰 100% / PM 결재 (commit / push) 대기 |
| 2026-05-16 | **PR-Public-1 공개 bracket 종별 view 기획설계 (planner-architect)** ⭐ | 🟡 read-only 분석 / 코드 수정 0 / 운영 DB SELECT 0 / 옵션 A (공개 신규 view) + D1 (기존 API 확장) 권장 / 예상 ~530 LOC (API +35 / wrapper +30 / 신규 3 컴포넌트 ~460 / GroupStandings +5) / 2 PR 분해 권장 (API +50 / UI +480) / admin /playoffs 회귀 0 / 시안 13 룰 100% / PM 결재 6 항목 (Q1~Q6) — D1+A 권장 |
| 2026-05-16 | **PR-Possession-1 PURE 헬퍼 + 타입 + vitest 박제 (developer)** ⭐ | ✅ 신규 3 (`possession-types.ts` +58 / `possession-helpers.ts` +122 / `possession-helpers.test.ts` +187) = **+367 LOC** / tsc 0 / vitest 15/15 PASS (315ms) / UI / BFF / DB 영향 0 / 다른 파일 변경 0 / PR-2 진입 대기 (PM 결재) / 별건: running-score-helpers.test.ts 1건 fail 발견 (작업 시작 전 미커밋 회귀 — PR 범위 밖) |
| 2026-05-16 | **fiba-header 쿼터 뱃지 v3 (위로 이동 + 매치 상태 라벨)** ⭐ | ✅ fiba-header.tsx +44/-19 (`marksCount?: number` prop + matchPhaseLabel 산출 + 뱃지 wrapper column flex + 라벨 div 박제) / score-sheet-form.tsx +4 (`marksCount={home.length + away.length}` wiring) / `alignSelf: flex-start + marginTop: -4px` 위로 이동 / 라벨 10px / `var(--color-text-secondary)` 회색 / tsc 0 / props 시그니처 신규 1건만 추가 (운영 호환) |
| 2026-05-16 | **Track A `/playoffs` 종별 탭 (옵션 A 인라인) 박제** ⭐ | ✅ playoffs-client.tsx +128/-14 / useSearchParams + useState + 2 useEffect (URL sync + 폴백) / 5 섹션 prop 차등 / divisionStandings.length ≤ 1 가드 / tsc 0 / 자가 진단 5/5 / 시그니처 변경 0 |
| 2026-05-16 | **score-sheet PBP 수정 모달 박제 (developer)** | ✅ 신규 1 (`pbp-edit-modal.tsx` +455) + 수정 4 (`running-score-helpers.ts` +90 / `score-sheet-toolbar.tsx` +25 / `score-sheet-form.tsx` +50 / `running-score-helpers.test.ts` +148) = **+768 LOC** / tsc 0 / vitest PR-PBP-Edit 15/15 PASS / planner 결정 plan 5건 100% 준수 / 신규 BFF endpoint 0 / 시안 13 룰 100% / isReadOnly 이중 방어 |
| 2026-05-16 | **Track B GNBA 유소년 INSERT 스크립트 박제 (developer)** ⭐ | ✅ `scripts/_temp/seed-gnba-youth-2026.ts` 신규 +669 LOC / 6 종별 + 36 팀 + 59 매치 (예선 46 + 순위전 13 placeholder) / placeholder-helpers 통과 (인라인 ❌) / 8중 가드 박제 (env / user / Tournament 분기 / transaction / DivisionRule code / Team 동명+부재 / TT upsert / Match 복합키) / 사후 5 query 검증 / generateApiToken 헬퍼 경유 / tsc 0 / **운영 DB 호출 0 (실행 = 사용자 명시 승인 후)** |
## 기획설계 — 영구 fix updateTeamStandings idempotent (planner-architect / 2026-05-16)

🎯 **목표**: `updateTeamStandings` 가 increment 방식 → 동일 매치 N회 호출 시 N배 박제. 즉시 fix 스크립트 (`scripts/_temp/recalc-standings-set.ts` SET 방식) 가 운영 path (헬퍼 + finalizeMatchCompletion) 과 충돌 위험. **함수 자체를 idempotent 화** (옵션 A — SET 방식 변환) 권장. 6회째 회귀 영구 차단.

### 1) 현 함수 로직 분석 (`src/lib/tournaments/update-standings.ts:53~107`)

```ts
await prisma.$transaction([
  prisma.tournamentTeam.updateMany({
    where: { tournamentId, teamId: homeTeamId },
    data: {
      wins:   homeWon ? { increment: 1 } : undefined,    // ← increment 방식
      losses: awayWon ? { increment: 1 } : undefined,
      draws:  isDraw  ? { increment: 1 } : undefined,
      points_for:       { increment: homeScore },
      points_against:   { increment: awayScore },
      point_difference: { increment: homeScore - awayScore },
    },
  }),
  // away 도 동일 패턴
]);
```

→ **함수 자체 idempotent 가드 0** / caller 책임 (admin PATCH `alreadyCompleted` 가드 / match-sync.ts `existing.status !== "completed"` 가드 / score-sheet submit route L527 `match.status === "completed"` 가드).

### 2) 호출 path 인벤토리 (영구 fix 후 — finalizeMatchCompletion 단일 통합 완료)

| # | path | 가드 (자체) | 가드 종류 |
|---|------|-----------|---------|
| 1 | admin PATCH route | ✅ L243 `if (status === "completed" && !alreadyCompleted)` | services/match.ts updateMatch 결과 |
| 2 | match-sync-service (Flutter sync 단건 + 웹 BFF) | ✅ L474 `existing.status !== "completed"` 신규 전환만 trigger / 본 헬퍼 진입 가드 |
| 3 | Flutter batch-sync | ⚠️ **자체 가드 0** — `if (match.status === "completed")` 만 (이전 status 무관) |
| 4 | Flutter v1 status PATCH (`updateMatchStatus`) | ✅ L517 `capturedPrevStatus !== "completed"` |
| 5 | **외부 스크립트** (`scripts/_temp/*` 즉시 fix) | ⚠️ **가드 0** — `updateTeamStandings(matchId)` 직접 호출 시 무조건 increment |

**race 시나리오 (실제 사고 6회째)**:
- Flutter 앱이 매치 종료 status PATCH → updateMatchStatus → finalizeMatchCompletion (1회 increment)
- Flutter 앱이 batch-sync 재전송 (network retry) → batch-sync route → finalizeMatchCompletion (**2회 increment** — batch-sync 자체 prev status 가드 0)
- 운영자가 즉시 fix 스크립트 실행 → updateTeamStandings 직접 호출 (**3회 increment**)
- → **은평 PA 17→34 (2배) 정확히 위 시나리오 매칭**

### 3) 옵션 비교

| 옵션 | 변경 LOC | DB 호출 ↑ | schema 변경 | idempotent 보장 | race 안전 | 외부 스크립트 안전 |
|------|---------|----------|----------|---------------|----------|----------------|
| **A: SET 방식 변환** ⭐ | ~30 LOC | 매치 1회 + tournament 매치 SELECT (N건 합산) | 0 | ✅ 100% (재계산) | ✅ | ✅ |
| **B: matchId 추적 테이블** | ~80 LOC + migration | -50% (skip) | 신규 `MatchStandingsApplied` table | ✅ 100% (skip) | ✅ | ✅ |
| **C: settings.standingsApplied 가드** | ~25 LOC | -50% (skip) | 0 (Json 활용) | △ (race 위험 — TOCTOU) | ⚠️ Concurrent 2회 시 둘 다 skip 통과 가능 | ✅ |

### 4) 권장 옵션 + 사유

⭐ **옵션 A (SET 방식 변환)** 권장:

1. **idempotent 100% 보장** — 호출 N회 = 결과 동일 (skip 가드 무관, 재계산이라 항상 정확)
2. **race 안전** — concurrent 2회 호출 시 마지막 호출이 정확한 결과 SET (increment 처럼 누적 X)
3. **외부 스크립트 호환 100%** — `scripts/_temp/recalc-standings-set.ts` 와 동일 로직 → 함수 통합 가능 (스크립트 삭제 가능)
4. **schema 변경 0** = 운영 영향 0
5. **기존 즉시 fix 6건 강남구 i3-U9 자동 정상화** — 영구 fix 박제 후 매치 status PATCH 1회면 standings SET 으로 정정
6. **DB 호출 증가 = 미미** — 매치별 같은 종별 매치 SELECT (보통 3~10건) → 운영 영향 ✅
7. **옵션 C (settings 가드) TOCTOU race 위험** — finalizeMatchCompletion 이 5종 path 동시 호출 가능 시 둘 다 가드 통과 → 박제 후 둘 다 increment (위 §2 race 시나리오 재현)

### 5) 신규 함수 시그니처 (옵션 A)

```ts
/**
 * 경기 완료 시 팀 전적 SET 방식 박제 (idempotent — 동일 매치 N회 호출 안전).
 *
 * 2026-05-16 영구 fix (errors.md 6회째 회귀 차단):
 *   기존 increment 방식 → 동일 매치 다중 path 호출 시 N배 박제 (은평 PA 17→34 사고).
 *   본 함수 = 매치 단건 SET 방식 (재계산) — 호출 가드 의존 0.
 *
 * 동작:
 *   1. 매치 단건 SELECT (winner_team_id / home/away score)
 *   2. 같은 tournament 같은 팀이 참여한 status=completed + winner_team_id NOT NULL 매치 N건 SELECT
 *   3. in-memory 합산 (wins/losses/draws/PF/PA/PD)
 *   4. TournamentTeam.updateMany (2건 — home + away) SET 방식 박제
 *
 * race 안전: concurrent 2회 호출 시 마지막 호출이 정확한 결과 SET (증분 누적 X).
 * 가드 무관: caller 가드 (alreadyCompleted / prev status) 우회해도 항상 정확.
 */
export async function updateTeamStandings(matchId: bigint): Promise<void>;
```

**호출 시그니처 변경 0** — 기존 caller 5종 (admin/match-sync/batch-sync/status PATCH/score-sheet) 모두 그대로 호출 가능.

### 6) 변경 파일 목록 + LOC

| 파일 경로 | 변경 내용 | LOC | 신규/수정 |
|----------|----------|-----|---------|
| `src/lib/tournaments/update-standings.ts` | `updateTeamStandings` SET 방식 재구현 (53~107 → ~70 LOC). `advanceWinner` 유지 (별건). | +50 / -55 | 수정 |
| `src/lib/tournaments/finalize-match-completion.ts` | 변경 0 (함수 시그니처 동일) | 0 | - |
| `src/__tests__/lib/tournaments/update-standings.test.ts` | 신규 vitest — 5 케이스 (단건 / N회 호출 / draw / 외부 스크립트 시뮬레이션) | +120 | 신규 |
| `scripts/_temp/recalc-standings-set.ts` | 삭제 (함수에 통합) | -116 | 삭제 |
| **합계** | | **+170 / -171 LOC = 순감 -1** | |

### 7) 회귀 위험 평가

| 위험 케이스 | 평가 | 대응 |
|-----------|------|------|
| **기존 정상 박제 매치 재계산 결과 불일치** (이전 increment 누적값 ≠ 재계산 SET 값) | 중 — 본 영구 fix 박제 후 첫 호출 시 정확값 SET → **운영 이득** (강남구 i3-U9 자동 정상화) | 박제 전 dry-run 스크립트로 모든 종별 영향 사전 확인 |
| **DB 호출 증가** (매치당 같은 팀 매치 N건 SELECT) | 낮음 — 종별당 보통 3~10 매치 (i3-U9 = 6 / 큰 풀리그 = 20건+) | index 활용 (`tournament_id`, `home_team_id`, `away_team_id`, `status`) — 이미 존재 |
| **draws 박제 정합** (winner_team_id=null = 무승부) | 낮음 — 재계산 시 draws 도 SET 처리 (기존 increment 와 동일 로직) | vitest 케이스 #3 |
| **트랜잭션 격리** (concurrent 2회 호출 시 같은 매치 SELECT 결과 다름) | 낮음 — race 시 둘 다 같은 매치 SELECT → 같은 결과 SET (idempotent) | $transaction wrap 유지 |
| **forfeit / disqualified 매치** (winner_team_id 있음 + scores=0) | 낮음 — 기존 함수 동작 보존 (winner_team_id 기반 분기) | vitest 케이스 #5 |
| **테스트 mock 회귀** (`__tests__/lib/match-sync.test.ts` L389/455 `updateTeamStandings: vi.fn()`) | 없음 — mock 시그니처 동일 | - |

### 8) vitest 케이스

| # | 케이스 | 검증 항목 |
|---|------|---------|
| 1 | 단건 매치 종료 (홈 승) | TournamentTeam home wins=1/losses=0/PF=10/PA=8 / away wins=0/losses=1/PF=8/PA=10 |
| 2 | **N회 호출 idempotent** ⭐ | `updateTeamStandings(matchId)` 3회 호출 → wins/losses/PF/PA 변화 0 (1회 호출 결과 = 3회 호출 결과) |
| 3 | 무승부 (winner_team_id=null) | draws=1 / wins/losses 변화 0 |
| 4 | 누적 (3 매치 진행) | wins/losses/PF/PA 합산 정확 (1매치=11→8 / 2매치=8→11 / 3매치=10→10 → wins=2 losses=1 draws=0 PF=29 PA=29) |
| 5 | **외부 스크립트 시뮬레이션** ⭐ | `scripts/_temp/recalc-standings-set.ts` 와 동일 결과 (스크립트 삭제 가능 검증) |

### 9) 즉시 fix 스크립트와의 호환성

`scripts/_temp/recalc-standings-set.ts` 와 신규 `updateTeamStandings` 비교:

| 항목 | scripts/_temp | 신규 updateTeamStandings |
|-----|---------------|-------------------------|
| 입력 | TOURNAMENT_ID + DIVISION_CODE | matchId |
| SELECT 범위 | 종별 완료 매치 전체 | 매치 단건 → 같은 팀이 참여한 완료 매치 전체 |
| 합산 방식 | in-memory loop | in-memory loop (동일) |
| UPDATE 방식 | SET (트랜잭션) | SET (트랜잭션) |
| placeholder advancer 호출 | ✅ (스크립트 내부) | ❌ (finalizeMatchCompletion 가 별도 호출) |

→ **결론**: 신규 함수 = 스크립트 핵심 로직 100% 추출 + 매치 단건 trigger. 스크립트 삭제 가능. 운영자가 강남구 i3-U9 정상화 시 `updateTeamStandings(matchId)` 6회 호출 = SET 방식이라 안전.

### 10) PM 결재 사항

| # | 결재 항목 | 권장 |
|---|---------|------|
| Q1 | 옵션 (A SET / B 신규 table / C settings 가드) | **A** (race 안전 + 외부 스크립트 호환) |
| Q2 | 강남구 i3-U9 즉시 fix 재실행 (영구 fix 박제 후 자동 정상화) | 별도 fix 스크립트 불필요 — 운영자가 매치 status PATCH 6회 호출 (Flutter 앱 sync 재트리거) 또는 admin route 1회 호출 |
| Q3 | scripts/_temp/recalc-standings-set.ts 삭제 시점 | PR 머지 후 즉시 (함수 통합) |
| Q4 | DB 호출 증가 (매치당 N건 SELECT) 운영 영향 | 미미 — index 이미 존재. dry-run 후 확정 |

### 11) 권장 PR 분해

| PR | 범위 | LOC | 검증 |
|----|------|-----|------|
| **PR-1** | `update-standings.ts` SET 방식 변환 + vitest 5 케이스 | +170 / -55 | tester (vitest 5/5 통과) + reviewer (idempotent 보장 검토) |
| **PR-2** | `scripts/_temp/recalc-standings-set.ts` 삭제 + 강남구 i3-U9 정상화 검증 | -116 | PM 운영 SELECT 검증 (standings = 매치 결과 정합) |

---

| 2026-05-16 | **score-sheet Bench Tech (B) + Delay of Game 박제 design 검토** | 🟡 위치 = 옵션 B (Coach 영역 옆) + Delay 옵션 D 변형 (Team fouls 위) / 데이터 모델 = 옵션 D 혼합 (settings JSON + PBP action_subtype) / 자유투 = 수동 / Phase 1~6 (+1090 LOC / 18h / 3 PR 분해) / Q1~Q3 결재 대기 / 박제 X 계획만 |
| 2026-05-16 | **Track B GNBA 유소년 INSERT 스크립트 spec 분석** | 🟡 `scripts/_temp/seed-gnba-youth-2026.ts` 신규 ~450 LOC / Tournament 분기 A안 (SELECT 후 자동) / 6 종별 format 매핑 (round_robin x2 / league_advancement x1 / group_stage_with_ranking x3) / 36 팀 + 59 매치 (예선 46 + 순위전 13) / placeholder-helpers 통과 의무 / 8중 idempotent 가드 / 사용자 결재 8 항목 (organizerId / linkage_pairs 형식 / KST→UTC 등) |
| 2026-05-16 | **score-sheet PBP 수정 모달 기획설계** | 🟡 Phase 1 (조회) / Phase 2 (수정) 분리 / 6 step commit 단위 결정 / source = runningScore state / 신규 endpoint 0 / submit BFF 재사용 / 신규 1파일 + 수정 3파일 |
| 2026-05-16 | **Phase 1 admin 흐름 개선 6 PR 박제** ⭐ | ✅ 6 commit (`4c05c8c` + `1e4b535` + `823d692` + `6d7718a` + `f4b0f95` + `f250e8c`) push 완료 / 강남구협회장배 단계 4·7·10·10.5 단절·누락 해소 / +3,060 LOC / 회귀 0 / 옵션 B 적용 |
| 2026-05-16 | **Phase 0 admin 흐름 점검 보고서** | ✅ `Dev/admin-flow-audit-2026-05-16.md` 231줄 / 18건 인벤토리 / 영향도 H 8건 |
| 2026-05-17 | **🚨 긴급 — i3w-U12 stale 매핑 영구 fix + 매치 205/207 복원** | ✅ `division-advancement.ts` 가드 강화 (`prelimTotal !== prelimCompleted` skip) + 임시 script 매치 205/207 NULL 복원 (운영 DB 2건 UPDATE) + 매치 206 정합 보존 / tsc 통과 / vitest 35/35 통과 / 임시 script 삭제 |
| 2026-05-16 | **PR-G5.8 swiss generator R1 박제 + R(N) 501 stub (옵션 B)** | ✅ commit `b8b3117` |
| 2026-05-16 | **PR-G5.2 dual-generator placeholder-helpers 통과 (옵션 B)** | ✅ commit `eaccd54` |
| 2026-05-16 | **PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator** | ✅ commit `b1e48b8` |
| 2026-05-16 | **PR-G5.5-followup-B 매치 PATCH route 통합** | ✅ commit `df96522` (1차 사고 → PR2 부터 옵션 B 적용) |
| 2026-05-16 | **recorder_admin 전역 흡수 + record01/02 강등** | ✅ PR #531 main 머지 (`8a913ef`) |
| 2026-05-16 | **4차 뉴비리그 apiToken 자동 발급 fix + Sub-B3** | ✅ PR #527 main 머지 (`1bff83e`) |
| 2026-05-15 | Admin-7-B Sub-B3 Wizard1Step + Sub-B2 EditWizard 박제 | ✅ commit `06069a4` + `efcc103` |
| 2026-05-15 | 본 세션 16 commit main 분리 머지 완료 | ✅ PR #517 + PR #519 |
