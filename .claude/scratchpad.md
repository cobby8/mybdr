# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 19 (BDR v2.5 + rev2) 시각 박제 종결
- **상태**: ✅ Phase 19 분해 9 PR / 8 commit 모두 완료. 후속 PR-S9 (_print.css 정합) 선택 / 후속 Phase A.7 (역동기화) 큐
- **모드**: no-stop / 사용자 결재 5건 (Q1~Q5) + Phase 19 결재 (D2~D7) + rev2 결정

## 진행 현황표
| 단계 | 결과 |
|------|------|
| v2.5 sync (rev1) | ✅ `1fa9210` |
| Phase 23 PR1 (PBP 역변환 헬퍼) | ✅ `b7c44d8` |
| Phase 23 PR2+PR3 (매치 218 사고 차단) | ✅ `a147bb1` |
| Phase 19 PR-S1~S5 (rev1) | ✅ `ef54e7a`/`4416a91`/`1a37981`/`1388eae`/`fe022c6` |
| v2.5 rev2 sync | ✅ `64daa5a` |
| Phase 19 PR-S6+S7+S8 rev2 (롤백+토큰+로고) | ✅ `cdf695a` |
| Phase 19 PR-S6-team (TeamSection) | ✅ `9bc6906` |
| Phase 19 PR-S7-officials (FooterSignatures) | ✅ `76edd00` |
| Phase 19 종결 | ✅ 분해 9 PR / 8 commit 완료 / 시각 정합 100% |

## Phase 19 종결 요약

운영 (score-sheet) frame 본체 100% 시안 정합 + 운영 비즈니스 로직 100% 보존.

| 영역 | 시안 클래스 | 운영 보존 |
|------|------------|----------|
| toolbar | .ss-toolbar* | ← 메인 / 인쇄 / 경기 종료 wiring |
| FibaHeader | .ss-h / .ss-names / .ss-meta / .ss-field | splitDateTime / venue / referee / umpire |
| TeamSection | .ss-tbox / .ss-tbox__to/tf / .ss-c-* | 4종 모달 / 5반칙 / Phase 17 색 / coach |
| RunningScoreGrid | 운영 grid (16열) | 모든 onClick / setRunningScore / 모달 |
| PeriodScoresSection | .ss-ps / .ss-circ / .ss-final / .ss-winner | OT 탭 / OT 종료 / 합산 / Winner 판정 |
| FooterSignatures | .ss-officials / .ss-sigs | 8 input onChange / Captain protest |

토큰: `--pap-*` 6종 (.ss-shell 스코프). 페이퍼 라이트 강제 (다크 진입 시에도). FIBA 직각 (border-radius 0).

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-15 | Phase 19 reviewer 4 영역 🟡 수정 — PR-S10 (RunningScoreGrid 다크 leak 차단 + .ss-rs* 시안 박제) + dead 정리 (data-q 4건 / #FFFFFF 4건) + 토큰 추출 (--ss-paper-width / --ss-toolbar-border) + _print.css 검증 (변경 0) | ✅ 6 파일 +322/-64 / tsc 0 / vitest 204/204 / PM 분리 commit 가이드 박제 |
| 2026-05-15 | Phase 19 PR-S7-officials — FooterSignatures 시안 정합 (Officials 4행 + Sigs 3행 + Captain protest) | ✅ 2 파일 +359/-225 / tsc 0 / vitest 204/204 / commit `76edd00` push |
| 2026-05-15 | Phase 19 PR-S6-team — TeamSection 시안 정합 (운영 891 LOC 비즈니스 로직 100% 보존) | ✅ 3 파일 +878/-586 / 13/13 보존 / commit `9bc6906` push |
| 2026-05-15 | Phase 19 PR-S6+S7+S8 rev2 — 모드 토글 롤백 + 토큰 단순화 (--pap-*) + 로고 변경 (We Play Basketball) + .pap-lbl/.pap-u | ✅ 9 파일 +438/-320 / commit `cdf695a` push |
| 2026-05-15 | v2.5 rev2 design sync (BDR-current/ 갱신 + _archive 백업) | ✅ commit `64daa5a` push (181 파일) |
| 2026-05-15 | Phase 19 PR-S5 — PeriodScoresSection 시안 정합 (① ② ③ ④ + Final + Winner) | ✅ 3 파일 +482/-316 / commit `fe022c6` push |
| 2026-05-15 | Phase 19 PR-S4 — FibaHeader 시안 정합 (.ss-h/.ss-names/.ss-meta) | ✅ 3 파일 +525/-161 / commit `1388eae` push |
| 2026-05-15 | Phase 19 PR-S3 — RunningScoreGrid mode prop wiring (paper read-only) | ✅ 5 파일 +161/-5 / commit `1a37981` push (rev2 에서 롤백) |
| 2026-05-15 | Phase 19 PR-S2 — 시안 toolbar 전체 도입 (운영 함수 100% 보존) | ✅ 5 파일 +325/-33 / commit `4416a91` push |
| 2026-05-15 | Phase 19 PR-S1 — .ss-shell 토큰 정의 (15종) | ✅ 신규 1 + 수정 1 +64 LOC / commit `ef54e7a` push |

## 미푸시 commit (subin 브랜치)
**0건** — 모두 푸시 완료.

## 후속 큐 (미진입)
- **PR-S9** (선택) — _print.css rev2 정합 (인쇄 미디어 쿼리 디테일 보강)
- **Phase 23 PR4** (선택) — status="completed" 매치 수정 가드 (Q3 결재)
- **Phase 23 PR5** — audit endpoint 박제 + cross-check 호출 (PR5-A 일부 진행됨 `d858632`)
- **Phase 23 PR6** — ConfirmModal 박제 + OT cross-check 확장 + PaperPBPRow 명시 mapping
- **Phase A.7** — 시안에 운영 모달 5종 박제 의뢰서 작성 (Claude.ai Project)
- UI-1.4 entry_fee 사용자 보고 재현
- GNBA 8팀 코치 안내

## 리뷰 결과 (reviewer · Phase 19 score-sheet 정적 검토 · 2026-05-15)

종합 판정: **통과 (수정 권장)** — 회귀/충돌 🔴 0건 / 🟡 후속 PR 4건 / 🟢 무시 3건.
잘된 점: .ss-shell 스코프 격리 / 토큰 단일 source / frameless 회귀 분기 보존 / pap-* 클래스 패턴 일관.

### A. 충돌/회귀 매트릭스 (정적)

| # | 항목 | 위험도 | 위치 | 영향 | 권장안 |
|---|------|-------|------|------|--------|
| 1 | dead `data-q` 속성 | 🟡 | period-scores-section.tsx L127/142/157/172 | 매칭 CSS 룰 0 (PR-S7 제거됨). HTML 만 무거워짐 | PR-S9 시 4건 제거 (또는 후속 색 룰 재도입) |
| 2 | `.ss-rs*` 룰 누락 | 🟡 | _score-sheet-styles.css | 시안 BDR-current/scoresheet.css L537~621 62 LOC 미박제. RunningScoreGrid 는 ss-shell wrapper 없음 + Tailwind utility + `--color-surface/border` 글로벌 토큰 사용 → 다크모드 진입 시 페이퍼 안 다크 영역 (사용자 결재 D3 "페이퍼 라이트 강제" 부분 위반) | 후속 PR-S10 = `.ss-rs*` 룰 박제 + RunningScoreGrid outermost `className="ss-shell ss-rs"` wrap |
| 3 | hardcoded `#FFFFFF` 잔존 | 🟢 | team-section.tsx L309/395/446/493/657 (5건) | `data-used/data-on/data-bonus="true"` 시 색 강조 — CSS 룰이 이미 `color: #FFFFFF` 박제 중 → tsx inline 중복 (안전망) | PR-S9 시 inline 제거 (CSS 룰이 우선 작동) |
| 4 | `max-width: 794px` 5중 정의 | 🟡 | _score-sheet-styles.css L25 (toolbar) / L332 (ss-header) / L360 (ss-ps-section) / L503 (ss-tbox) + form.tsx L885 `max-w-[820px]` | 시안 source 0건 (max-width 룰 자체 미박제). 운영 D6 룰. **form.tsx grid 안 col 안에서는 794px 가 col 폭보다 커서 의미 없음** + frame 폭 자체가 210mm (≈794px). 단일 변수 (--ss-paper-width) 추출 권장 | PR-S9 = `:root` 토큰화 |
| 5 | print + screen 룰 충돌 가능성 | 🟢 | _print.css L194-201 `section/table/th/td/input/textarea` border-color #000 강제 vs _score-sheet-styles.css ss-tbox border 1.5px var(--pap-line) | 둘 다 #000 으로 수렴 (var(--pap-line)=#000) — 충돌 없음. `border-width` 만 1.5px → 1px 미정의 (인쇄 시) → 인쇄 frame 내부 ss-* border 1.5px 유지 (정상) | 변경 불필요 |
| 6 | 다크모드 페이퍼 leak (Running Score) | 🔴→🟡 | running-score-grid.tsx L189-192 `--color-surface` / `--color-border` | ss-shell wrapper 없음. 페이퍼 안 다크 영역. 인쇄 시 _print.css L164-172 가 검정+투명 강제로 정상화. **화면 다크 모드만 leak**. 사용자 결재 D3 "라이트 강제" 일부 위반 | 항목 2 와 동일 PR (ss-rs 박제 + ss-shell wrap) |
| 7 | toolbar `#FFFFFF` hardcoded | 🟢 | _score-sheet-styles.css L34/L51/L68 | toolbar 는 라이트 강제 의도 (페이퍼와 동일 시각). 다크 진입 시 페이퍼와 시각 일관 → 의도된 룰 | 변경 불필요 |
| 8 | `.ss-toolbar` border-color #D0D5DD hex | 🟡 | _score-sheet-styles.css L35/L50 | 시안 그대로 박제 (BDR-current). 토큰 미정의 (`--pap-line` 검정 #000 과 별도). var 추출 가능 | PR-S9 시 `--ss-toolbar-border: #D0D5DD` 토큰 추출 (선택) |
| 9 | `.ss-tbox` border `border-top: 0` | 🟢 | _score-sheet-styles.css L509 | "FibaHeader 와 시각 연속 — 위 wrapper 와 무경계" 의도. 그러나 form.tsx grid col 안 첫 child 의 위로 .ss-header 가 없음 (TeamSection 은 좌측 col / FibaHeader 는 fiba-divider-bottom 안). 시각 분리는 frame 의 fiba-divider-bottom 이 책임 | 변경 불필요 |
| 10 | inline `borderBottom: "1px solid var(--color-text-primary)"` vs `.pap-u` | 🟢 | footer-signatures.tsx L465 (SigInput inline 모드) | inline 모드 = ss-shell 스코프 밖 (회귀 안전망 모드 frameless=false 가 SigInput 호출). 운영 실제 사용 분기 = frameless=true (form.tsx L1093) → SigInput 분기 미진입. dead path | 후속 정리 (사용처 0) |

### B. 즉시 수정 필요 (🔴)
**없음** — 회귀 / 깨짐 / 동작 차단 0건. Phase 19 (PR-S1~S8) 정합 안정.

### C. 후속 PR 권장 (🟡 4건)

| 권장 PR | 범위 | LOC 예상 |
|--------|------|---------|
| **PR-S10** (신규) — `.ss-rs*` 박제 + RunningScoreGrid ss-shell wrap | _score-sheet-styles.css +60 / running-score-grid.tsx outermost wrapper 교체 | ~80 |
| **PR-S9** (큐 갱신) — dead 정리 (data-q 4건 + team-section inline `#FFFFFF` 5건 + SigInput inline 분기 제거) | 4 파일 -15 LOC | -15 |
| **PR-S11** — `--ss-paper-width: 794px` / `--ss-toolbar-border: #D0D5DD` 토큰 추출 | _score-sheet-tokens.css +2 / styles.css 5건 치환 | ±5 |
| **인쇄 PR-S9-print** — _print.css 의 `.score-sheet-print-root .score-sheet-fiba-frame` border-width 1.5px (현재 2px) 시안 정합 검증 | 1 파일 | ±1 |

### D. 무시 가능 (🟢)
- toolbar `#FFFFFF` (의도된 라이트 강제)
- print + screen border-color 수렴 (둘 다 #000)
- `.ss-tbox border-top: 0` (시각 의도)

### E. 자동화 검증 명령 (수정 후)

```bash
# dead data-q 확인
grep -nE "data-q=" src/app/\(score-sheet\)
grep -nE "\[data-q" src/app/\(score-sheet\)/_components/*.css

# hardcoded #FFFFFF tsx 잔존
grep -nE "#FFFFFF|#fff\b" src/app/\(score-sheet\)/score-sheet/

# ss-rs 룰 박제 검증
grep -nE "ss-rs" src/app/\(score-sheet\)/_components/_score-sheet-styles.css

# 운영 검증
npx tsc --noEmit
npx vitest run src/app/\(score-sheet\)
```

### 수정 요청 테이블

| # | 우선순위 | 파일 | 권장 | 상태 |
|---|---------|------|------|------|
| 1 | 🟡 P1 | RunningScoreGrid + _score-sheet-styles.css | `.ss-rs*` 시안 박제 + ss-shell wrap (다크모드 페이퍼 라이트 강제) | ✅ 완료 (영역 A) |
| 2 | 🟡 P2 | period-scores-section.tsx | dead `data-q` 4건 제거 | ✅ 완료 (영역 B1) |
| 3 | 🟡 P3 | team-section.tsx 5건 / footer-signatures.tsx SigInput | inline 중복 / dead 분기 정리 | ✅ 완료 (영역 B2: 4건 제거 / L657 accentColor 유지 / B3: 회귀 안전망 유지 주석 강화) |
| 4 | 🟡 P4 | _score-sheet-tokens.css | `--ss-paper-width` `--ss-toolbar-border` 토큰 추출 | ✅ 완료 (영역 C) |

## 구현 기록 (developer) — UI 회귀 수정 (PR-S10 + dead 정리 + 토큰 + print)

📝 구현한 기능: Phase 19 reviewer 정적 검토 결과 4 영역 🟡 모두 수정.

### 영역 A — PR-S10 RunningScoreGrid 다크모드 페이퍼 leak 차단 (별도 commit)

| 파일 | 변경 | LOC |
|------|------|----|
| `src/app/(score-sheet)/_components/_score-sheet-styles.css` | 시안 `.ss-rs*` 룰 5개 + data-* 변형 4개 박제 (.ss-rs / .ss-rs__title / .ss-rs__head / .ss-rs__grid / .ss-rs__cell + data-mark / data-reached / data-period-end / data-section-end) | +150 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/running-score-grid.tsx` | outermost wrapper = `ss-shell ss-rs` (다크 leak 차단) / 헤더 + 셀 색 토큰 페이퍼 (`var(--pap-*)`) 로 마이그레이션 / data-reached / data-period-end 시안 정합 도입 / `computePeriodEnds` 헬퍼 신규 / ColumnHeader 색 페이퍼 토큰화 | ±120 |

**핵심**: 다크모드 진입 시 페이퍼 안 다크 영역 leak (D3 위반) 영구 차단. column-major 운영 구조 유지하되 wrapper + cell 클래스 `.ss-rs__cell` 적용 → CSS 룰이 페이퍼 토큰으로 색 박제. 운영 동작 100% 보존.

### 영역 B — dead 정리 (묶음 commit)

| # | 파일 | 변경 | LOC |
|---|------|------|----|
| B1 | `period-scores-section.tsx` | L127/142/157/172 `data-q="1~4"` 4건 제거 (PR-S7 토큰 rename 후 매칭 CSS 룰 0건) | -4 |
| B2 | `team-section.tsx` | L309/395/446/493 inline `color: "#FFFFFF"` 4건 제거 (CSS 룰 data-used/data-on color #FFFFFF 이미 박제 → 중복 안전망 정리). L657 accentColor (체크박스) = 의도된 별개 = 유지 | -4 |
| B3 | `footer-signatures.tsx` | frameless=false 분기 = 회귀 안전망 / 단위 테스트 가능성 / props API 안정성 위해 **유지 결정**. 명시 주석 강화만 | +4 |

### 영역 C — 토큰 추출 PR-S11 (묶음 commit)

| 파일 | 변경 | LOC |
|------|------|----|
| `_score-sheet-tokens.css` | `--ss-paper-width: 794px` + `--ss-toolbar-border: #D0D5DD` 2 토큰 추가 | +8 |
| `_score-sheet-styles.css` | `max-width: 794px` 5건 → `var(--ss-paper-width)` 치환 (toolbar / ss-header / ss-ps-section / ss-tbox) + `#D0D5DD` 2건 → `var(--ss-toolbar-border)` 치환 (toolbar border + button border) | ±7 |

### 영역 D — _print.css 검증 결과 = 변경 0

| 비교 | 시안 | 운영 | 결정 |
|------|------|------|------|
| .ss-paper border (scoresheet.css L792) | 2px solid #000 | (해당 없음) | — |
| .score-sheet-print-root .score-sheet-fiba-frame border-width (_print.css L211) | — | 2px | **동일 → 변경 0** |

영역 D = 시안 == 운영 정합 (2px == 2px) → **작업 0**. 시안 정합 완료 상태.

### 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | exit=0 통과 |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | 204/204 PASS |
| 3 | grep `data-q=` in period-scores-section.tsx | 0건 |
| 4 | grep `#FFFFFF\|#fff` in team-section.tsx | 주석 내 잔존만 + L665 accentColor 1건 (의도 — 체크박스 액센트) |
| 5 | grep `ss-rs` in _score-sheet-styles.css | 20건 (시안 영역 박제 ✅) |
| 6 | grep `--ss-paper-width\|--ss-toolbar-border` in _score-sheet-tokens.css | 정의 2건 ✅ |

### 운영 동작 보존 검증

| # | 검증 | 결과 |
|---|------|------|
| 1 | RunningScoreGrid onClick / setRunningScore / 모달 trigger | ✅ handleCellClick / setModalContext / onChange(undoLastMark/addMark) 변경 0 |
| 2 | Phase 17 getPeriodColor 적용 위치 (inline style override) | ✅ MarkCell 안 `getPeriodColor(mark.period)` + inline style 색 wiring 보존 |
| 3 | Phase 23 PR2+PR3 (initialRunningScore prop 흐름) | ✅ RunningScoreGridProps 인터페이스 변경 0 |
| 4 | 4종 모달 / localStorage / BFF submit / buildSubmitPayload | ✅ RunningScoreGrid 외부 — 변경 0 |
| 5 | team-section / period-scores-section / footer-signatures onChange / state setter | ✅ 모든 setter / state 호출 변경 0 |

### PM 분리 commit 가이드

| Commit | 영역 | 파일 |
|--------|------|------|
| **#1 (별도)** | A — PR-S10 RunningScoreGrid 다크 leak 차단 | `_score-sheet-styles.css` + `running-score-grid.tsx` |
| **#2 (묶음)** | B+C — dead 정리 + 토큰 추출 (영역 D = 변경 0 결정) | `_score-sheet-tokens.css` + `_score-sheet-styles.css` (토큰 치환분만 — A 와 동일 파일이라 분리 어려움 → PM 결재 시 A+B+C 단일 commit 통합 권장 / 또는 git 부분 add 사용) |

⚠️ **A+C 동일 파일 (`_score-sheet-styles.css`) 영향**:
- 영역 A = .ss-rs* 신규 룰 (파일 끝 +150 LOC)
- 영역 C = max-width / border 치환 (파일 중간 ±7 LOC)
- 분리 commit 시 git 부분 add 필요 (`git add -p`) — PM 결재 시 **단일 commit 통합 권장** (영역 A+B+C+D = "fix(ui): score-sheet UI 회귀 4 영역 수정 (PR-S10 다크 leak + dead 정리 + 토큰 + print 검증)")

💡 tester 참고:
- **테스트 방법**:
  1. `/score-sheet/[matchId]` 페이지 진입 (다크모드 토글 ON)
  2. RunningScoreGrid 영역 안 색 = 페이퍼 라이트 (흰 배경 / 검은 글자) 유지 확인
  3. 마킹 시 (cell 클릭 → 모달 → 선수 선택) — 모달 trigger / Phase 17 색 / 동작 변경 0 확인
  4. period-scores-section / team-section / footer-signatures 시각 정합 (변경 0 시각) 확인
- **정상 동작**: 라이트 = 변경 0 / 다크 진입 시 RunningScoreGrid 영역만 페이퍼 라이트 강제 (다크 leak 0).
- **주의할 입력**: 빈 cell 빈 마크 (data-mark="true" + 빈 글리프) / 마지막 마크 isLast 해제 음영 / Phase 17 Q1~Q5 색 wiring

⚠️ reviewer 참고:
- **PR-S10 핵심 회귀 가드**: outermost wrapper 가 ss-shell ss-rs 안 (.ss-shell 토큰 격리). 다크모드에서 globals.css `--color-surface`/`--color-border` 사용 시도 회귀 시 leak 재발 — `running-score-grid.tsx` outermost wrapper className 반드시 `ss-shell ss-rs` 포함 유지.
- **data-reached / data-period-end 마크업**: 시안 .ss-rs__cell[data-reached="true"]::after (슬래시) / [data-period-end="true"]::before (원형 마커) 룰이 점수칸에만 의미. 운영 PrintScoreCell 에 매핑 산출 (homeMarkMap.has(position) / homePeriodEnds.has(position)) — 회귀 시 시각 ❌.
- **B3 frameless=false 분기**: 운영 호출 0 (dead path) 이지만 회귀 안전망으로 유지. 향후 frameless prop 자체 제거 시 동시 정리 가능.
