# 작업 스크래치패드

## 현재 작업
- **요청**: 운영 검증 6 issue (이미지 29~34) 옵션 A — 작은 fix 4건 본 세션
- **상태**: ✅ 3건 완료 / 33+34 별 PR 보류
- **모드**: no-stop (자동 머지 위임)

## 진행 현황표 (옵션 A — 본 세션)
| # | 이슈 | 작업 | 상태 |
|---|------|------|------|
| 31 | 빨강 버튼 디자인 위반 | organizations 2 페이지 6 토큰 → btn--primary / accent / info | ✅ |
| 30/32 | 단체 페이지 흐름 | snukobe org_members admin INSERT (강남구농구협회 orgId=3) | ✅ |
| 29 | 대회 자동 종료 로직 | auto-complete.ts + match-sync 통합 + vitest +8 + 운영 1건 backfill | ✅ |
| 32-추가 | 단체 관리/페이지 관리 메뉴 | 단체 상세 추가 메뉴 link 보강 | 보류 (별 PR) |
| 33 | 대진표 고도화 | dual_tournament rounds/brackets 매핑 강화 | 보류 (별 PR) |
| 34 | 권한 자동 부여 | 단체 admin → 대회 운영자 자동 부여 (헬퍼 또는 트리거) | 보류 (별 PR) |

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 8]** PDF 1:1 완전 정합 — 단일 외곽 박스 통합 + 헤더 컴팩트 4 줄 + Players 행 28px + Footer 가로 펼침 (Scorer/Asst/Timer/Shot Clock 4열 + Referee/Umpire1·2 3열). 7 파일 +450/-258. tsc 0 / vitest 541/541. 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 7.1]** LineupSelectionModal 확장 — 전체 선택/해제 + FIBA 12명 cap (Article 4.2.2) + 13번째 차단 + applyRosterCap 헬퍼 + isLineupSelectionValid 12명 상한. tsc 0 / vitest 533/533 (+7). 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | d89f600 | **[live]** score-match swap-aware 백포트 — 5/10 결승 영상 사고 2차 fix | ✅ |
| 2026-05-12 | ff190a7 | **[live]** 결승 영상 매핑 오류 fix — auto-register 1:1 매핑 가드 백포트 | ✅ |
| 2026-05-12 | 32b8ec9 | **[live]** TeamLink href 404 — TournamentTeam.id → Team.id 분리 | ✅ |
| 2026-05-12 | eead692 | **[stats]** 통산 스탯 3 결함 일괄 — mpg 모달 회귀 + 승률 source + FG%/3P% NBA 표준 | ✅ |
| 2026-05-12 | 714eda3 | **[stats]** 통산 mpg 단위 변환 — DB 초 → 표시 분 (사용자 보고) | ✅ |
| 2026-05-12 | eba91f9 | **[fix]** middleware.ts 삭제 — Next.js 16 proxy 단일 source 통합 | ✅ |
| 2026-05-12 | (다건) | **[FIBA Phase 7]** 디자인 PDF 1:1 + LineupSelectionModal + QuarterEndModal (Q4/OT 분기) | ✅ |
| 2026-05-12 | (다건) | **[강남구협회장배]** 36팀 + 59경기 + 종별 룰 + 토큰 + 모달 (Phase 1~4-B) | ✅ |

## 구현 기록 (developer) — FIBA Phase 8 PDF 1:1 완전 정합 (2026-05-12)

📝 구현 범위: 단일 박스 + 헤더 컴팩트 + Players 표 28px + Footer 가로 펼침 + 검정 border

### FIBA PDF 측정값 (이미지 직접 분석)
- 외곽 박스: A4 세로 / 검정 1px solid / rounded 0 / shadow X
- 헤더 영역: ~12% 비율 / 4 줄 컴팩트 (로고 + Scoresheet / Team A·B / Competition·Date·Time·Referee / Game No·Place·Umpire1·2)
- 좌측 50%: Team A 상 / Team B 하 (세로 분할 = 1px 검정)
- 우측 50%: Running Score 4 세트 + Period 합산 + Final + Winner (세로 누적)
- Players 행 높이: ~28px (15행 / FIBA PDF 정합)
- 하단 풋터: ~12% 비율 / 가로 펼침 (Scorer/Asst/Timer/Shot Clock 4 컬럼 + Referee/Umpire1·2 3 컬럼 + Captain)

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `_components/_print.css` | `.score-sheet-fiba-frame` + `.fiba-divider-*` + `.fiba-frameless` + `.md-fiba-divider-right` 클래스 신규 / 인쇄 시 border 검정 #000 강제 (회색 #ccc → 검정) | 수정 |
| `_components/fiba-header.tsx` | `frameless` prop 추가 / 4 줄 컴팩트 레이아웃 (로고 + Scoresheet / Team A·B / Comp·Date·Time·Referee / GameNo·Place·Umpire1·2) / `InlineFieldDisplay` + `InlineFieldInput` 신규 / legacy `FieldDisplay`+`FieldInput` 제거 | 수정 |
| `_components/team-section.tsx` | `frameless` prop / Time-outs + Team fouls 가로 1줄 인라인 / Players 행 28px 박제 / Coach·Asst Coach 인라인 underscore / 타임아웃 칸 h-9 → h-6 컴팩트 | 수정 |
| `_components/running-score-grid.tsx` | `frameless` prop / 자체 border 제거 옵션 | 수정 |
| `_components/period-scores-section.tsx` | `frameless` prop / Period 표 + Final Score 박스 자체 border 제거 옵션 / frameless 시 상단 분할선만 (border-top) | 수정 |
| `_components/footer-signatures.tsx` | `frameless` prop / 가로 펼침 (Scorer/Asst/Timer/Shot Clock 4열 + Referee/Umpire1·2 3열 + Captain) / `SigInput` `inline` 옵션 추가 (라벨 + underscore 한 줄) / Signatures 헤더 제거 (FIBA PDF 정합) | 수정 |
| `_components/score-sheet-form.tsx` | `score-sheet-fiba-frame` div 한 겹으로 5 영역 통합 / 모든 자식 `frameless` prop 주입 / 좌·우 컬럼 사이 `md-fiba-divider-right` 분할선 / 헤더·풋터 분할선 (`fiba-divider-bottom`/`fiba-divider-top`) / main padding px-2 → px-1 컴팩트 | 수정 |

### 단일 박스 통합 동작
- 외곽 = `score-sheet-fiba-frame` (검정 1px solid + rounded 0 + shadow X)
- 내부 5 영역 = 자체 border 제거 (`fiba-frameless` 적용) + 내부 1px 분할선 (`fiba-divider-bottom`/`fiba-divider-right`/`fiba-divider-top`)
- 다크 모드 = 외곽/분할선 모두 `var(--color-text-primary)` (흰색) 자동 적용
- 라이트 모드 = 검정 (`var(--color-text-primary)` = ink 토큰)
- 인쇄 시 = 모든 border 검정 #000 강제 (`_print.css` override)

### 헤더 4 줄 컴팩트 (FIBA PDF 정합)
- 1줄: 로고 + "Basketball Daily Routine" 작은 라벨 + "SCORESHEET" 타이틀
- 2줄: Team A 라벨 + 팀명 underscore / Team B 라벨 + 팀명 underscore (2 컬럼)
- 3줄: Competition / Date / Time / Referee (4 컬럼 inline underscore)
- 4줄: Game No / Place / Umpire 1 / Umpire 2 (4 컬럼 inline underscore)

### Footer 가로 펼침
- 1줄: Scorer / Assistant scorer / Timer / Shot clock operator (4 컬럼)
- 2줄: Referee / Umpire 1 / Umpire 2 (3 컬럼)
- 3줄: Captain's signature in case of protest (1 컬럼 full)
- Notes textarea (선택) 유지

### 검증
- tsc 0 에러
- vitest 541/541 PASS (기존 533 → 신규 8 추가 — fiba-header-split-datetime / quarter-end-modal 등 / 회귀 0)
- BigInt n literal 0 / lucide-react 0 / 핑크-빨강 hardcode 0
- schema 변경 0 / Flutter v1 영향 0 / AppNav 영향 0 / BFF·service 변경 0

### 회귀 안전망
- 모든 컴포넌트의 `frameless` prop = 선택값 (기본 false). 기존 호출자가 prop 미주입 시 = 기존 박스 모드 그대로
- 본 PR 에서 score-sheet-form.tsx 만 frameless 활성. 다른 파일이 5 컴포넌트 직접 import 하는 경우 영향 없음 (기본 모드 유지)
- 회귀 가드: `SigInput` 비 inline 모드도 함수 내 분기로 보존
- localStorage draft (header / teamA / teamB / runningScore / fouls / timeouts / signatures / lineup) 모두 기존 형식 유지 → mid-game reload 시 복원 동일

### 💡 tester 참고
- 테스트 방법: score-sheet/[matchId] 진입 → 라인업 모달 확정 → 단일 외곽 박스 + 4 줄 헤더 + 좌·우 분할 + 컴팩트 Players 표 + 가로 풋터 표시
- 정상: tsc 0 / vitest 541 PASS / FIBA PDF 시각 정합
- 주의: 다크 모드 진입 시 박스 외곽 + 분할선 = 흰색 / 라이트 모드 = 검정 / 인쇄 시 무조건 검정 + 라이트 강제 (기존 동작 유지)
- 시각 검증 우선 (FIBA PDF 와 1:1 비교 필요)

### ⚠️ reviewer 참고
- 단일 박스 통합으로 5 카드 분리 폐기 → CSS 룰 충돌 가능성 검토 (`.fiba-frameless` 가 `.score-sheet-fiba-frame` 안에서만 동작하도록 prefix)
- `md-fiba-divider-right` = Tailwind 인식 X → `_print.css` 의 `@media (min-width: 768px)` 미디어쿼리에서 적용 (커스텀 클래스)
- frameless prop 디폴트 false = 기존 호출자 회귀 0 보장. score-sheet-form.tsx 만 true 주입

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

