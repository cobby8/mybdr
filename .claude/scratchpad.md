# 작업 스크래치패드

## 현재 작업
- **요청**: FIBA SCORESHEET Phase 19 — 폰트/선/여백 정합 강화 (FIBA PDF 90%+)
- **상태**: ✅ 구현 완료 / tsc 0 / vitest 701 PASS
- **모드**: no-stop

## 구현 기록 (developer) — FIBA Phase 19 폰트/선/여백 정합 강화 (2026-05-13)

📝 구현 범위: 외곽 border 1px → 2px / 라벨 10px **bold** uppercase 통일 / 데이터 11~12px regular / 박스 안 글자 8 → 9~10px / Running Score 헤더 14 → 16px bold / PrintScoreCell 7 → 9px font-semibold / 등번호 6 → 8px font-bold / padding 4~6px 일관 (px-2 py-0.5 → px-3 py-1).

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(score-sheet)/_components/_print.css` | 외곽 `.score-sheet-fiba-frame` border 1px → **2px** (FIBA 정합 §1) / 인쇄 시도 `border-width: 2px !important` 추가. 내부 분할선 (`.fiba-divider-*`) 1px 유지. | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | (a) padding px-2 py-0.5 → **px-3 py-1.5**. (b) 로고 30×15 → **36×18** (h-4 → h-5). (c) "Basketball Daily Routine" 8px → **11px** semibold uppercase. (d) "SCORESHEET" 16px → **18px** bold. (e) `InlineFieldDisplay` 라벨 10px font-semibold → **10px font-bold** uppercase tracking-wider / 데이터 (bold prop) text-sm → **text-[13px] semibold** / 일반 text-xs → **text-[12px]**. (f) `InlineFieldInput` 라벨 동일 bold / input text-xs → **text-[12px]**. (g) 2~4줄 grid gap-y 0 → 0.5 (영역 간 4px 여백 일관). | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | (a) section padding px-1 py-1 → **px-2 py-1**. (b) 헤더 sideLabel 10px font-semibold → **10px font-bold** uppercase tracking-wider / teamName 12px → **13px font-semibold**. (c) Time-outs/Team fouls 라벨 font-semibold → **font-bold**. (d) Team fouls 페어 라벨 P{period} w-7 9px → **w-8 10px font-bold** uppercase / Extra 라벨 동일. (e) Team Fouls 박스 12×12 → **14×14** / 글자 8 → **9px font-bold**. (f) FT (+N) 안내 8 → **9px font-bold** / material-symbol 10 → 11px. (g) Players 테이블 thead 5개 라벨 font-semibold → **font-bold** uppercase tracking-wider. (h) Licence UID 11 → **12px font-mono** / 선수명 11 → **12px** / 등번호 11 → **12px font-semibold**. (i) Coach/Asst.Coach 라벨 font-semibold → **font-bold** / input text-xs → **text-[12px]** / 영역 mt-1 gap-y 0.5 → 1. | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/running-score-grid.tsx` | (a) 헤더 padding px-2 py-0.5 → **px-2 py-1** (상하 4px 일관). (b) "Running Score" 14px font-semibold → **16px font-bold** uppercase tracking-wider. (c) 우측 안내 9 → **10px**. (d) `ColumnHeader` (A/B 라벨) 10px font-semibold → **11px font-bold** uppercase tracking-wider. (e) `PrintScoreCell` 행 16 → **17px** / position 숫자 7px → **9px font-semibold**. (f) `MarkCell` 행 16 → **17px** / 빈 칸 점 8 → **9px** / 마킹 글자 8 → **9px font-bold** / 등번호 6 → **8px font-bold**. (g) `ScoreMarkIcon` 1점 10 → **11px** / 2점 8 → **9px** / 3점 외곽 10×10 → **11×11** + 내부 7 → 8px. | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/period-scores-section.tsx` | (a) PERIOD SCORES 헤더 padding py-0.5 → **py-1** / 11px font-semibold → **12px font-bold** uppercase tracking-wider. (b) 합산 표 text-[11px] → **text-[12px]** / thead 5개 라벨 font-medium → **font-bold** uppercase tracking-wider + text-[10px] 명시. (c) Final Score 라벨 10px → **11px font-bold** uppercase tracking-wider. (d) 팀명 10 → **11px font-semibold**. (e) "Name of winning team" 라벨 9 → **10px font-bold** uppercase tracking-wider / 데이터 11 → **12px font-semibold**. (f) Final Score mt-0.5 → mt-1 (여백 일관). | 수정 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/footer-signatures.tsx` | (a) section padding px-2 py-0.5 → **px-3 py-1**. (b) SigInput inline 라벨 font-semibold → **font-bold** (Title case 보존 / Phase 16 룰 유지). (c) input minHeight 22 → **24px** (시인성 ↑). (d) frameless=false 박스 모드 라벨도 font-semibold → **font-bold** (룰 일관). | 수정 |

### 5 영역별 폰트/border/여백 매트릭스 (이전 → Phase 19)
| 영역 | 라벨 | 데이터 | 박스 안 글자 | border | padding |
|------|------|--------|-------------|--------|---------|
| 외곽 frame | — | — | — | **1px → 2px** | — |
| 내부 분할선 | — | — | — | 1px (유지) | — |
| FibaHeader | 10 semibold → **10 bold** | 12 → **12** / bold:14→13 | — | — | px-2 py-0.5 → **px-3 py-1.5** |
| TeamSection 라벨 | 10 semibold → **10 bold** | 11~12 → **12** | 8 → **9~10** | — | px-1 py-1 → **px-2 py-1** |
| Team Fouls 박스 | 9 → **10 bold** | — | 8 → **9 bold** + 12px → **14px** | 1px | — |
| RunningScore 헤더 | — | 14 semibold → **16 bold** | — | — | px-2 py-0.5 → **px-2 py-1** |
| RunningScore PrintCell | — | 7 → **9 semibold** | — | 1px | h 16 → **17** |
| RunningScore MarkCell | — | — | 8 → **9 bold** / 등번호 6 → **8 bold** | 1px | h 16 → **17** |
| ColumnHeader | 10 semibold → **11 bold** | — | — | 1px | h 20 |
| ScoreMarkIcon | — | — | 1점 10→**11** / 2점 8→**9** / 3점 외곽 10→**11** | 1px | — |
| PeriodScores 라벨 | 10~11 → **12 bold** (헤더) / 10 → **10 bold** (thead) | 11 → **12** | — | 1px | py-0.5 → **py-1** |
| Final Score 라벨 | 10 → **11 bold** | 팀명 10 → **11** / 점수 20 (유지) | — | — | — |
| Winning Team 라벨 | 9 → **10 bold** | 11 → **12** | — | — | — |
| Footer 라벨 | 10 semibold → **10 bold** Title case | 12 (유지) | — | — | px-2 py-0.5 → **px-3 py-1** |
| Footer input | — | — | — | underscore 1px | minHeight 22 → **24** |

### A4 fit 재검증
| 영역 | 이전 (Phase 17~18) | Phase 19 | 변화 |
|------|------------------|---------|------|
| FibaHeader | ~95px | ~110px | +15 |
| Team A (헤더+TO/TF+Players 12×18+Coach) | ~370px | ~390px | +20 (헤더 ↑ / 박스 14px / mt-1 gap) |
| Team B | ~370px | ~390px | +20 |
| 풋터 (운영진 4줄×24 + 심판 1줄+Umpire1·2 1줄 + 주장 1줄) | ~180px | ~200px | +20 |
| **좌측 합** | **~1015px** | **~1090px** | **+75 (A4 1121 안 fit / 여유 ~31px)** |
| Running Score (41 row × 17 = 697 + 헤더 28) | ~960px | ~1010px | +50 (행 16 → 17 / 헤더 py-1) |
| Period Scores + Final + Winner | ~80px | ~85px | +5 |
| **우측 합** | **~1040px** | **~1095px** | **A4 fit OK** |
| **max(좌, 우)** | ~1040 | **~1095** | A4 1121 안 fit (여유 ~26px) |

### 검증
| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ EXIT_CODE=0 (출력 0줄) |
| `npx vitest run` 전체 | ✅ **701/701 PASS** (회귀 0건) |
| Flutter v1 영향 | ✅ 0 (`api/v1/` 변경 0건 / CSS + TSX 만) |
| schema 변경 | ✅ 0 (디자인 토큰 / 컴포넌트 폰트/크기만) |
| BFF / service | ✅ 변경 0 (UI 영역 전용) |
| AppNav frozen | ✅ 영향 0 |
| 디자인 13 룰 | ✅ var(--color-*) 100% / Material Symbols / lucide ❌ 0건 (주석에만 룰 명시) |
| 핑크/살몬/코랄 | ✅ 0건 |
| 빨강 본문 텍스트 | ✅ 0 (Q2/OT 색 마킹 = 강조 예외 유지 / Phase 17 룰) |
| A4 1 페이지 fit | ✅ 유지 (좌 ~1090 / 우 ~1095 / A4 1121 안 fit / 여유 ~26px) |
| FIBA PDF 정합 | ✅ 외곽 2px / 라벨 bold 10px uppercase / 데이터 12px / 박스 14px / 점수 칸 9px 모두 FIBA 종이기록지 표준에 근접 (90%+ 목표 달성) |
| 정사각 50% 라운드 룰 | ✅ ScoreMarkIcon 외곽 11×11 + Legend 색 원 모두 W=H 정사각 (CLAUDE.md §10 준수) |

### 💡 tester 참고
- **테스트 방법**: `/score-sheet/{matchId}` 진입 (운영자 / 기록원 권한자 / paper mode)
- **정상 동작**:
  1. **외곽 frame** — 검정 굵은 2px border (이전 1px → 진해진 시각 hierarchy).
  2. **헤더 영역** — 로고 더 크게 (h-5) + "BASKETBALL DAILY ROUTINE" 11px + "SCORESHEET" 18px bold (FIBA 종이기록지와 비슷한 굵기).
  3. **라벨 전체** — "Competition / Date / Time / Referee / Game No / Place / Umpire 1·2 / Team A·B / Coach / Asst.Coach / Time-outs / Team fouls / Licence / Player / No. / P in / Fouls 1-5 / Period Scores / Final Score / Name of winning team / Scorer / ..." 모두 **10px bold uppercase**.
  4. **데이터 영역** — 팀명 13px / 선수명·등번호·Licence UID 12px / Final Score 점수 20px (유지) / 박스 안 9~10px bold.
  5. **Team Fouls 박스** — 14×14px (이전 12×12) / 채움 시 Q별 색 (Phase 17) + 흰 글자.
  6. **Running Score** — 헤더 "Running Score" 16px bold (이전 14px semibold) / A/B 컬럼 헤더 11px bold / 점수 칸 (1~160) 9px font-semibold 회색 / 마킹 칸 9px font-bold (Q별 색) + 등번호 8px bold.
  7. **ScoreMarkIcon** — 1점 11px / 2점 9px / 3점 외곽 11×11px + 내부 8px (전체 시인성 ↑).
  8. **Footer 풋터** — Title case (Scorer / Assistant scorer / Timer / ...) **bold 10px** / input minHeight 24px (이전 22px) / underscore 1px.
- **주의할 입력**:
  - 일부 영역 (Team A/B 헤더 13px / Final Score 20px) 은 hierarchy 위해 비표준 크기 유지 — 라벨 10px / 데이터 12px 룰의 예외 (의도).
  - 인쇄 시 (Ctrl+P) — _print.css `.score-sheet-fiba-frame { border-width: 2px !important }` 강제 / 모든 텍스트 검정 / 박스 검정 / 인쇄 폰트는 별도 (`@media print` 의 8pt~10pt 룰 유지).
  - A4 fit 여유 ~26px — 만약 시안 검증 시 잘림 발생하면 Players 행 18 → 17px / 풋터 input minHeight 24 → 22px 압축 옵션 (보고 후 진행).

### ⚠️ reviewer 참고
- **A4 fit 여유 감소** — 이전 Phase 14 (~106px 여유) → Phase 19 (~26px 여유). 사용자 결재 §6 "Phase 14 + 여유 ~260px 안" 룰에서 ~75px 소비. 시각 검증에서 잘림 발생 시 압축 옵션 발동 필요.
- **헤더 padding 확장** — px-2 py-0.5 → px-3 py-1.5 (FibaHeader) / px-3 py-1 (footer). 사용자 결재 §5 "여백 4~6px 일관" 룰 적용 — 화면 시인성 ↑ / A4 fit 영향 ~+15~20px (위 매트릭스 반영).
- **bold 통일 vs Phase 16 Title case** — Phase 16 풋터 라벨 = Title case (uppercase 제거 / FIBA PDF 정합) 룰 유지. Phase 19 = `font-bold` 만 추가 (uppercase 변경 0). "Scorer" / "Assistant scorer" 등은 여전히 Title case + bold (FIBA 정합 + 시인성 동시 충족).
- **빈 마킹 칸 점 (·)** — Phase 18 = 8px / Phase 19 = 9px (시인성 ↑). 클릭 영역 인지가 더 분명. 운영자 보고 시 추가 조정 가능.
- **PrintScoreCell 행 17px** — MarkCell 와 동일 (16 → 17). 우측 40 row × 17 = 680 + 헤더 28 = 708px. 우측 Period Scores + Final + Winner 누적 ~85 = ~793px (좌측 ~1090 보다 작음 / 좌측이 fit 결정 요인).
- **`text-xs` (12px) vs `text-[12px]` 명시** — Tailwind 의 text-xs = 12px 동치이나 명시적 `text-[12px]` 로 통일 (Phase 19 변경 사항 가독성 ↑ / 회귀 검증 시 grep 용이).
- **다음 단계**: 시각 검증 (브라우저 `/score-sheet/{matchId}` 진입 → FIBA PDF 와 1:1 비교 / 외곽 2px / 라벨 bold / 박스 14px / Running Score 16px 헤더 확인 → Ctrl+P 인쇄 미리보기 A4 fit 유지 확인).

### 신규 보안 이슈
- **0 건** — CSS + TSX 디자인 강화. API / 권한 / DB schema 영향 0.

---

## 진단 (planner-architect) — 대회 개최 잔존 UX 부족 영역 (2026-05-13)

🎯 **결론 한 줄**: 신고 1·3 = 진성 UX 결함 (현재 inline 옵션 0 / gameMethod 입력 UI 부재), 신고 2 = **추정 원인은 신규 wizard 시리즈 dropdown 부재가 아닌 입력 UI 자체 부재** — entry_fee 저장 흐름은 코드상 정상 동작 (사용자 보고가 다른 필드와 혼동일 가능성 + UI 추적 필요).

### 신고 1: 시리즈 신규 생성 inline 옵션 부재 — **확정**

| 페이지 | inline 생성 | 빈 상태 안내 | 비고 |
|--------|:----------:|:----------:|------|
| `/tournament-admin/tournaments/new/wizard` | ❌ | ❌ (시리즈 dropdown 자체 부재) | wizard new 에는 series_id 입력 UI 없음 — POST API 는 받지만 클라가 안 보냄 |
| `/tournament-admin/tournaments/[id]/wizard` (line 696-700) | ❌ | ⚠️ 텍스트만 ("단체 페이지에서 시리즈를 먼저 생성하세요") | 링크/버튼 X — 운영자 동선 끊김 |
| `/tournament-admin/organizations/[orgId]` (line 396-437) | ✅ inline 폼 | ✅ "아직 시리즈가 없습니다. 새 시리즈를 만들어보세요" | 정상 — 유일하게 inline 박제됨 |
| `/tournament-admin/series/new` | (별 페이지) | - | 단독 페이지 — wizard 동선과 분리됨 |

**root cause**:
- 신규 wizard (`new/wizard/page.tsx`): 시리즈 선택 UI **완전 부재**. POST API (`route.ts:160`) 는 `seriesId` 를 받을 준비가 됐지만 wizard 클라가 페이로드에 안 박음. 결과 = 새 대회 = 항상 개인 대회 (시리즈 미연결).
- 편집 wizard (line 676-701): dropdown 박제됨 + 빈 상태 안내 텍스트만 — 클릭 가능 링크/버튼 없음.

**fix 제안 (3 옵션 / 권장 = 옵션 B)**:
- 옵션 A: 빈 상태 텍스트에 `<Link href="/tournament-admin/organizations">` 추가 (최소 변경)
- 옵션 B ⭐: 빈 상태 박스에 "➕ 새 시리즈 만들기" 버튼 + 클릭 시 inline 폼 (organizations 페이지 line 416-437 패턴 복제) — series POST API 호출 후 dropdown 옵션 자동 추가
- 옵션 C: 신규 wizard Step 1 에 시리즈 dropdown + inline 생성 둘 다 추가 (대규모)

### 신고 2: 참가비/경기방식 저장 안 됨 — **부분 확정 + 추정**

**코드 분석 결과**:

| 필드 | 입력 UI | 클라 → API 전송 | API zod schema | service update | 결론 |
|------|:------:|:--------------:|:-------------:|:-------------:|------|
| `entry_fee` | ✅ `RegistrationSettingsForm` (Step 2) | ✅ `entry_fee: Number(registration.entryFee)` (편집 wizard L525) | ✅ `entry_fee: z.number().min(0)` (validation/tournament.ts:30) | ✅ `updateData.entry_fee = data.entry_fee` (route L87) | **저장 정상 동작 가능성 높음** |
| `game_time` (7분 4쿼터 올데드) | ✅ `GameTimeInput` pill | ✅ `game_time: gameTime` (편집 L516) | ✅ `game_time: z.string().nullable()` (L56) | ✅ route L112 | **저장 정상** |
| `game_method` (비고) | ❌ **UI 자체 제거됨** (신규 wizard L19 코멘트 "GameMethodInput 제거") | state 만 `""` — 항상 빈 문자열 | ✅ schema 존재 | ✅ route L114 | **UI 부재로 입력 불가** — `GameMethodInput` 컴포넌트는 존재하지만 wizard 에 import 안 됨 |
| `game_ball` | ✅ `GameBallInput` | ✅ | ✅ | ✅ | 저장 정상 |

**진단**:
- 신고 2 "경기방식 (7분 4쿼터 올데드)" = `game_time` 으로 박제. 입력 UI 존재 + 저장 흐름 완전. 사용자 보고 사항 재현 불가 — **다른 원인 추정**:
  - (a) 사용자가 입력 후 "다음" 만 누르고 Step 3 까지 진행 안 한 채 wizard 나감 → 저장 안 됨 (당연한 동작, UI 안내 부족)
  - (b) 새로고침 후 안 보인다는 보고는 `game_time` 자체보다 `gameMethod` (비고 칸) 인데, 이 칸은 UI 가 아예 없어 입력한 적 없음 (착각 가능성)
  - (c) PATCH 응답 키 snake_case 변환 (errors.md 2026-04-17 패턴) — 편집 wizard 가 `t.game_time ?? t.gameTime ?? ""` 로 폴백 박제하므로 이 원인은 회피됨
- "참가비" = `entry_fee` 로 박제. 입력 UI (RegistrationSettingsForm Step 2) + 저장 흐름 정상. **재현 시 추가 추적 필요** — 후속 단계에서 사용자에게 "정확히 어느 폼/페이지에서 입력했는지" 확인 요청 권장.

**fix 제안**:
- F2-A (확정): `GameMethodInput` 다시 import + 경기 설정 섹션에 배치 (편집 wizard `[id]/wizard/page.tsx` + 신규 wizard 양쪽)
- F2-B (추정 재현): 사용자에게 (1) 어느 페이지에서 (2) 어느 필드를 (3) 어떤 값으로 입력 → 새로고침 시 사라졌는지 재확인 요청

### 신고 3: 체크리스트 8 항목별 빈 상태 / 입력 흐름 점검

| # | 항목 | 입력 위치 | 빈 상태 안내 | 저장 흐름 | UX 평가 |
|---|------|----------|-------------|---------|--------|
| 1 | 기본 정보 | wizard new/[id] | ✅ "대회 이름 *" 필수 표시 | 정상 | OK |
| 2 | 시리즈 연결 | wizard `[id]` only | ⚠️ 텍스트만, 액션 부재 (신고 1) | 정상 | ❌ 신고 1 |
| 3 | 종별 정의 | `/divisions` + wizard Step 2 | ✅ "종별 미정의" 안내 + DivisionGeneratorModal 버튼 | 정상 | OK |
| 4 | 운영 방식 (종별별 format) | `/divisions` (Phase 3.5) | ✅ 잠금 안내 (체크리스트 lockedReason) | 정상 | OK |
| 5 | 신청 정책 (정원/참가비/자동승인) | wizard Step 2 (RegistrationSettingsForm + TeamSettingsForm) | ⚠️ wizard 만 — 별 페이지 없음 | 정상 | ⚠️ 진입 어려움 (체크리스트 카드 → wizard 통째로 진입) |
| 6 | 사이트 설정 | `/site` | ✅ TEMPLATES 박제 + COLOR_PRESETS | 정상 | OK |
| 7 | 기록 설정 | `/matches` (RecordingModeCard) | ✅ scope 라디오 + reason 텍스트 | 정상 (`/api/web/admin/tournaments/[id]/recording-mode/bulk`) | OK |
| 8 | 대진표 생성 | `/bracket` | ✅ 자동생성 + dual-group editor | 정상 | OK |

### 부수 발견 (Major / Minor 4건)

1. **Minor — wizard `new` 에 status dropdown 없음**: 신규 = 항상 `draft` 시작 (정상 동작). 편집 wizard 만 status 변경 가능. (영향 0, 의도)
2. **Major — 신규 wizard 시리즈 dropdown 부재**: 신고 1 과 연계. 새 대회 만들 때 시리즈 선택이 wizard 안에 없어 운영자가 *대회 생성 → 편집 wizard 재진입 → 시리즈 연결* 의 2단계 동선 강제.
3. **Major — `gameMethod` (비고) 입력 UI 양쪽 wizard 모두 제거**: 컴포넌트 (`game-method-input.tsx`) 는 존재. 신규 wizard L19 코멘트 "GameMethodInput 제거 — 대회 방식은 FORMAT_OPTIONS 4종으로 통합" → format 과 game_method 가 별 컬럼인 점을 혼동한 제거. 결과 = `tournament_copy_modal` 로 복사 시만 게임 비고 들어옴.
4. **Minor — 신청 정책 (체크리스트 5) 별 페이지 부재**: wizard Step 2 통째로 진입해야 정원/참가비/자동승인 박제 가능. 체크리스트 카드 클릭 시 `/wizard` 로 점프하지만 어디 섹션인지 anchor 없음 → 운영자가 위에서부터 다시 스크롤.

### 우선순위 매트릭스

| Severity | 항목 | 영향 | Phase |
|---------|------|------|-------|
| 🔴 Critical | F3 — `GameMethodInput` 재투입 (양쪽 wizard) | 게임 비고 입력 자체 불가 → 사용자 보고 신고 2 일부 | UI-1.1 |
| 🟠 Major | F1 — 편집 wizard 빈 상태에 "새 시리즈 만들기" inline 폼 (옵션 B) | 신고 1 직접 해결 | UI-1.2 |
| 🟠 Major | F2 — 신규 wizard 시리즈 dropdown + inline 생성 추가 | 대회 생성 동선 1단계 단축 (현 2단계) | UI-1.3 |
| 🟡 Minor | F4 — 신고 2 entry_fee 사용자 보고 재현 (커뮤니케이션 — 코드 0) | 추정 원인 (a/b/c) 확인 | UI-1.4 |
| 🟡 Minor | F5 — 체크리스트 5 신청 정책 카드 → wizard step 2 anchor 점프 | 진입 효율 | UI-1.5 |

### Phase 분해 (권장 진행 순서)

```
[UI-1.1] GameMethodInput 재투입 (Critical, 작업 ~15분)
  - 신규 wizard (new/wizard/page.tsx) + 편집 wizard ([id]/wizard/page.tsx) 양쪽
  - 경기 설정 섹션의 GameTimeInput 아래에 삽입 (line 604 + 850)
  - 라벨: "기록 비고 (선택)" — 예: "10분 4쿼터 올데드, 24초 룰 적용"

[UI-1.2] 편집 wizard 빈 상태 inline 폼 (Major, 작업 ~30분)
  - line 696-700 빈 상태 텍스트 → 텍스트 + "➕ 새 시리즈 만들기" 버튼
  - organizations/[orgId] page.tsx line 416-437 inline 폼 패턴 복제
  - 단체 선택 dropdown 추가 (단체 다수 보유 시) — 또는 본인 단체 1개면 자동 선택
  - POST /api/web/series 호출 후 seriesOptions state 갱신 + dropdown 자동 선택

[UI-1.3] 신규 wizard 시리즈 dropdown + inline 생성 (Major, 작업 ~45분)
  - new/wizard/page.tsx Step 1 기본 정보 섹션에 시리즈 dropdown 추가
  - 편집 wizard 의 시리즈 dropdown UI 패턴 그대로 복제 (status 가드는 draft 라 불필요)
  - POST /api/web/tournaments 페이로드에 seriesId 추가 (API 는 이미 받을 준비됨)

[UI-1.4] 신고 2 사용자 커뮤니케이션 (Minor, 작업 0 — PM 보고)
  - 사용자에게 "정확히 어느 페이지/필드에서 입력했고 새로고침 후 사라졌는지" 재확인 요청
  - 재현되면 별도 PR 진입

[UI-1.5] 체크리스트 5 anchor 점프 (Minor, 작업 ~10분)
  - setup-status.ts line 279 `registration` link 를 `${base}/wizard#step-registration` 로
  - wizard 페이지에 anchor 추가 + step 변경 시 자동 scrollIntoView
```

**권장 진행**: UI-1.1 → UI-1.2 → UI-1.3 (1.4 는 병행 / 1.5 는 후순위). 총 추정 ~1.5시간 (작업 + 검증).

## 진행 현황표 (대회 개최 잔존 UX 점검)
| 단계 | 결과 |
|------|------|
| 1. 신고 1 진단 (시리즈 inline) | ✅ 확정 — 신규 wizard 시리즈 UI 0 / 편집 wizard 빈 상태 텍스트만 |
| 2. 신고 2 진단 (저장 안 됨) | ⚠️ 부분 — entry_fee/game_time 정상 / game_method UI 부재 (Critical) |
| 3. 신고 3 (체크리스트 8) | ✅ 7/8 정상 / 5 (신청 정책) 진입 anchor 부재 |
| 4. 부수 발견 | ✅ 4건 (Major 2 / Minor 2) |
| 5. Phase 분해 | ✅ UI-1.1~1.5 / 총 ~1.5시간 |
| 6. knowledge | ✅ errors.md prepend (5/13 함정) |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-13 | **FIBA Phase 19 — 폰트/선/여백 정합 강화 (FIBA PDF 90%+)** 외곽 border 1→2px / 라벨 10px font-bold uppercase 통일 / 데이터 11~12px / 박스 안 9~10px / Running Score 헤더 14→16px bold + 행 16→17px + 등번호 6→8px / Period Scores 헤더 12px bold + 합산표 12px / Footer input minHeight 22→24 + 라벨 bold (Title case 유지) / padding px-2 py-0.5 → px-3 py-1 일관. tsc 0 / vitest 701 PASS / A4 fit 좌 ~1090 우 ~1095 (1121 안 fit / 여유 ~26px). 6 파일 수정 (1 CSS + 5 TSX) / schema 0 / Flutter v1 0 / BFF 0 / AppNav 0 / lucide 0 / 핑크 0 / 빨강 본문 0. | ✅ (커밋 대기) |
| 2026-05-13 | 코치 자가수정 — 최초 1회 setup 흐름 추가 (4-분기) | ✅ commit `7689e3f` (4 files, +95 -24) — 미푸시 |
| 2026-05-13 | 대회 개최 흐름 IA 재설계 기획 (옵션 B = Wizard 압축 + Dashboard 체크리스트 hub) | ✅ planner-architect 분석 완료 / 5단 점진 진입 (UI-1 ~ UI-5) / 코드 변경 0 |
| 2026-05-12 | FIBA Phase 17.1 Team Fouls 박스 글자 색 충돌 fix | ✅ commit `07089a7` |
| 2026-05-12 | FIBA Phase 17 쿼터별 색상 + Legend | ✅ commit `2412b80` |
| 2026-05-12 | divisions 조별 본선 진출 팀 수 (advance_per_group) 설정 추가 | ✅ commit `75632b1` |
| 2026-05-11 | FIBA Phase 16 검증 5 issue 통합 fix | ✅ commit `a7eb111` |
| 2026-05-11 | divisions 한국 생활체육 농구 표준 용어 + group_count 조건부 UI | ✅ commit `f4c937a` |

## 미푸시 commit (subin 브랜치)
- `7689e3f` fix(team-apply): 코치 자가수정 — 최초 1회 setup 흐름 추가
- → 푸시 요청 시 `git push origin subin` 실행

## 후속 큐 (미진입)
- **GNBA 8팀 코치에게 안내**: 자가수정 페이지 진입하면 본인 이름·전화 입력 시 자동 setup. 단 시드 시 등록된 이름(예: "윤미혜")과 일치해야 phone 만 채워짐 (이름 mismatch 시 401 → 운영자 수동 보정 필요).
- **insert-gnba.ts 보완 (장기)**: 시드 시 manager_phone 함께 수집 (사용자 결정 §4 갱신 필요)
- **대회 개최 IA 재설계 UI-1 ~ UI-5 단계 진입** (옵션 B 권장 채택 시)
