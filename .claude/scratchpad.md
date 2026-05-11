# 작업 스크래치패드

## 현재 작업
- **요청**: FIBA SCORESHEET Phase 6 — A4 세로 인쇄 PDF (마지막 Phase)
- **상태**: ✅ 완료 — tsc 0 / vitest 506/506 / 회귀 0 / 신규 vitest 0 (CSS 만)
- **모드**: no-stop

## 진행 현황표 (FIBA 양식)
| Phase | 범위 | 상태 |
|------|------|------|
| 1 | route group + minimal layout + 헤더 + 명단 | ✅ |
| 2 | Running Score 1-160 + Period 자동 + Final + Winner | ✅ |
| 3 | Player/Team Fouls + 5반칙 + 5+ FT toast | ✅ |
| 3.5 | 파울종류 (P/T/U/D) + Article 41 + 쿼터/경기 종료 + Licence 자동 | ✅ |
| 4 | Time-outs (전반2/후반3/연장1 + settings.timeouts JSON) | ✅ |
| 5 | 서명 8 + 노트 (settings.signatures JSON + 헤더 자동 prefill) | ✅ |
| 6 | A4 세로 인쇄 PDF (@media print + 라이트 강제 + PrintButton) | ✅ |

## 구현 기록 (developer) — FIBA 양식 Phase 6 A4 인쇄 PDF

📝 구현 범위: @media print CSS (A4 portrait + 라이트 강제 + scoped prefix) + PrintButton + 5 영역 인쇄 정합 + 모달/Toast no-print

### 변경 파일
| 파일 | 변경 | 신규/수정 | 줄수 |
|------|------|---------|-----|
| `src/app/(score-sheet)/_components/_print.css` | @page A4 portrait + .score-sheet-print-root 스코프 + 라이트 강제 (--color-* override 회피) + no-print + Toast aria-live 숨김 + 5 영역 비율 정합 (font-size / padding / grid-cols-2 강제) | 신규 | 125 |
| `src/app/(score-sheet)/_components/print-button.tsx` | window.print() onClick + Material Symbols print 아이콘 + no-print + toolbar 비율 정합 (px-2 py-1 text-xs) | 신규 | 50 |
| `src/app/(score-sheet)/layout.tsx` | _print.css import + PrintButton 추가 (toolbar 우측 ThemeToggle 좌측) + 상단 header `no-print` 적용 | 수정 | +10 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | main wrapper 에 `score-sheet-print-root` 클래스 + Phase 안내 카드 `no-print` + 안내 텍스트 Phase 6 갱신 | 수정 | +5 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/match-end-button.tsx` | wrapper div 에 `no-print` (종료 버튼/모달/완료 카드 인쇄 제거) | 수정 | +3 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/foul-type-modal.tsx` | 백드롭 div 에 `no-print` | 수정 | +2 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/player-select-modal.tsx` | 오버레이 div 에 `no-print` | 수정 | +2 |

### @media print 핵심 룰

| 룰 | 동작 |
|----|------|
| `@page { size: A4 portrait; margin: 8mm }` | FIBA 양식 정합 (1:1.414 세로) |
| `.no-print { display: none !important }` | toolbar/모달/안내 카드/Toast 제거 |
| `.score-sheet-print-root *` 검정 강제 | `color: #000000 !important` + `background: transparent !important` (다크모드 토큰 override) |
| `html, body` 흰 배경 강제 | `background: #ffffff !important` (다크모드 진입 시도해도 인쇄 = 라이트) |
| `border-color: #cccccc !important` | FIBA 양식 회색 박스 정합 |
| `.md\:grid-cols-2` grid 강제 | 모바일 viewport 에서 인쇄해도 좌·우 컬럼 2분할 |
| `[aria-label*="마킹됨"] background: #e0e0e0` | Time-outs / Fouls 마킹 칸 식별 (filled = 회색) |
| `[aria-live="polite"].fixed` 숨김 | Toast 컨테이너 인쇄 제거 (toast-context.tsx 직접 수정 회피) |

### PrintButton 위치
- minimal layout 의 toolbar 우상단 (← 매치 관리로 좌측 / ThemeToggle 우측 — PrintButton 좌측 인접)
- 사유: 운영자가 경기 종료 후 toolbar 우측으로 시선 이동 시 인쇄 발견 자연 + ThemeToggle 좌측 = 두 버튼 그룹화

### 다크모드 진입 시 인쇄 동작
1. 사용자가 다크모드 토글 클릭 → `html.dark` / `[data-theme="dark"]` 적용
2. 화면 = 다크 (검정 배경 / 흰 텍스트)
3. 인쇄 버튼 클릭 → `@media print` 진입 → `.score-sheet-print-root *` 가 `color: #000` + `background: transparent` 강제 → html/body `background: #ffffff !important` 강제
4. 종이 출력 / PDF 저장 = 항상 흰 배경 + 검정 텍스트 (FIBA 양식 정합)

### 스코프 prefix 설계 (충돌 회피)
- 기존 `globals.css` 의 `@media print { @page size: A4 landscape }` = 박스스코어 인쇄용 (보존 필수)
- Phase 6 `_print.css` 는 `(score-sheet)` route group 안에서만 import → score-sheet 페이지 진입 시만 적용
- 다만 동일 `@media print { @page }` 룰은 cascade 우선순위 → 후순위 import (`_print.css`) 가 우선 (CSS source-order)
- `.score-sheet-print-root` 클래스로 자식 룰 격리 → 박스스코어 페이지 인쇄에 영향 0

### 검증
| 항목 | 결과 |
|------|------|
| tsc --noEmit | 0 에러 (EXIT 0 / 출력 0) |
| vitest 전체 회귀 | 506/506 PASS (이전 487 + 누적 19건 기타) |
| 디자인 13 룰 (lucide-react import / 핑크/살몬/코랄 / BigInt n) | 위반 0 |
| Flutter v1 영향 | 0 (CSS / UI 만) |
| schema 변경 | 0 (CSS / UI 만) |
| BFF / service 변경 | 0 |
| AppNav frozen | 0 영향 (route group 격리) |
| 운영 DB 영향 | 0 (코드만) |

### tester 참고
- 테스트 방법 (수동 E2E — vitest 회귀 불가 영역):
  1. paper 모드 매치 진입 → 우상단 "인쇄" 버튼 클릭 → 브라우저 인쇄 미리보기
  2. **A4 세로 1 페이지** 안에 5 영역 (FibaHeader / TeamSection A·B / RunningScoreGrid / PeriodScoresSection / FooterSignatures) 합본 검증
  3. toolbar (← 매치 관리로 / 인쇄 / 다크모드) **인쇄에서 제거** 검증
  4. FoulTypeModal / PlayerSelectModal / 경기 종료 모달 / Toast 인쇄 시 보이지 않음 (열려있어도)
  5. 다크모드 토글 ON → 화면 = 다크 / 인쇄 미리보기 = **흰 배경 + 검정 텍스트** (라이트 강제)
  6. 모바일 viewport (≤768px) 에서 인쇄 시도 → 좌·우 2 컬럼 grid 강제 적용 확인
- 정상 동작:
  - 인쇄 미리보기 = 양식 1 페이지 (페이지 2 미발생)
  - 박스 border = 회색 1px (FIBA 양식 정합)
  - input/textarea 텍스트 = 검정 (다크모드여도)
  - Toast 알림 인쇄 0 (운영 중 toast 떠 있어도 종이엔 없음)
- 주의할 입력:
  - 태블릿 가로 모드 진입 시 RotationGuard 회전 안내 화면 → 인쇄 시 회전 안내가 인쇄될 수 있음 (운영자가 세로 모드 진입 후 인쇄 권장)
  - 운영 매치 status = live (Q4 진행 중) 에 인쇄 시도 = 가능 (진행 중 양식도 인쇄 OK / Phase 6 = 종료 후만 인쇄 제한 X)
  - 5 영역 합본이 페이지 1 초과 = 운영 매치 데이터 양 (선수 12명 + Running Score 마킹 수) 에 따라 발생 가능 → 인쇄 미리보기에서 사전 확인

### reviewer 참고
- **CSS source order 의존**: `_print.css` 는 layout.tsx 에서 후순위 import → 기존 globals.css 의 `@page A4 landscape` 룰을 cascade 우선순위로 덮어쓰지만, score-sheet 외 페이지에는 영향 0 (route group 격리 — layout 미진입 시 import 안 됨). 향후 Next.js 빌드 시 CSS 번들링 순서 변경 가능성 = chunk 분리로 layout 별 격리 보장 (Next.js App Router default).
- **`#ffffff` / `#000000` hardcode 사용 사유**: `--color-*` 토큰은 다크모드 진입 시 검정/흰 으로 자동 전환됨. 인쇄 = 항상 라이트 강제 필요 → 토큰 의존 차단 위해 명시 hex (`#ffffff` / `#000000` / `#cccccc` / `#e0e0e0` 회색 톤만). 핑크/빨강 0건 검증됨.
- **Toast aria-live 시그너처 매칭**: toast-context.tsx 가 공용 컴포넌트 (web + score-sheet 양쪽 사용) — 직접 `no-print` 추가 시 web 페이지 인쇄 (다른 곳) 에도 영향. 본 CSS 는 `(score-sheet)` route group 안에서만 import → 영향 0. 시그너처 매칭 (`[aria-live="polite"].fixed`) 안전.
- **다크모드 라이트 강제 검증**: `_print.css` 의 `.score-sheet-print-root *` 룰이 `color: #000 !important` 강제 → 자식의 inline `style={{ color: "var(--color-text-primary)" }}` 도 override (CSS specificity: `!important` 우선). 시각 회귀 0.

## 구현 기록 (developer) — FIBA 양식 Phase 5 서명+노트

📝 구현 범위: FooterSignatures (8 입력 + 노트) + settings.signatures JSON merge (Phase 4 timeouts 패턴 재사용) + 헤더 → 풋터 자동 prefill (dirty flag 안전망)

### 변경 파일
| 파일 | 변경 | 신규/수정 | 줄수 |
|------|------|---------|-----|
| `src/lib/score-sheet/signature-types.ts` | SignaturesState (9 키) / EMPTY_SIGNATURES / SIGNATURE_MAX_LENGTH (50) / CAPTAIN_SIGNATURE_MAX_LENGTH (100) / NOTES_MAX_LENGTH (500) | 신규 | 65 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/footer-signatures.tsx` | 8 SigInput (border-bottom only / 44px+) + notes textarea (글자 카운터) + 헤더 자동 prefill (didPrefillRef dirty flag) + 좌·우·하단 영역 구분선 | 신규 | 200 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | signatures state + DraftPayload 확장 + draft 복원 (EMPTY 스프레드 호환) + buildSubmitPayload hasAnySig 분기 + FooterSignatures 마운트 | 수정 | +55 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | signaturesSchema (zod) + submitSchema.signatures.optional() + settings JSON merge 통합 UPDATE (timeouts + signatures 단일 UPDATE) + audit context Sig 카운트 | 수정 | +35 |
| `src/__tests__/score-sheet/signature-types.test.ts` | 10 케이스 (EMPTY 키 셋 3 / 길이 상수 3 / hasAnySig 분기 4) | 신규 | 110 |

### 자동 fill UX 결정 — 헤더 → 풋터 자동 prefill (dirty flag)
| 옵션 | 채택 사유 |
|------|---------|
| (a) 헤더 → 풋터 자동 prefill ✅ | 헤더의 Referee/Umpire 1/Umpire 2 = 풋터와 99% 동일 인물. 입력 부담 0 |
| (b) 자동 복사 버튼 | 1 클릭 추가 — UX 손해 |
| (c) 별도 입력 | 사용자 중복 입력 부담 |

**dirty flag 안전망**:
- `didPrefillRef` 사용 — mount 1회만 prefill 시도
- 풋터 값이 빈 문자열일 때만 헤더 값 복사 (이미 있는 사용자 수정 보존)
- draft 복원 후 mount = 이미 값 보유 → prefill skip (사용자 의도 보존)
- 사용자 입력 후에는 헤더 변경이 풋터에 미반영 (헤더 = 경기 시작 / 풋터 = 종료 후 — FIBA 양식 정합)

### settings JSON merge 검증 (Phase 4 timeouts + Phase 5 signatures 통합)
- 기존 settings 객체 spread → `timeouts` / `signatures` 키만 set → 기존 `recording_mode` 등 키 보존
- **단일 UPDATE 통합**: input.timeouts 또는 input.signatures 둘 중 하나라도 전송 시 1회 prisma.tournamentMatch.update → DB 왕복 최소화
- 둘 다 미전송 = UPDATE skip (기존 settings 유지)
- match.settings 가 null/array/primitive 시 빈 객체에서 시작 (방어)
- schema 변경 **0** / Prisma JSON 컬럼 활용

### notes 박제 위치
- TournamentMatch.notes 컬럼 (기존 BFF 6번 단계의 별도 update 흐름 그대로 활용)
- settings.signatures JSON 과 분리 (DB 컬럼 일관성 — notes 는 본래 별도 컬럼 존재)
- 빈 문자열 = 기존 값 유지 (overwrite 안 함)

### UX 동작
- 풋터 영역 = 페이지 하단 (MatchEndButton 위 — 경기 종료 전 서명 입력 흐름)
- 좌측 4 입력 (Scorer / Asst Scorer / Timer / Shot Clock Operator) sm:grid-cols-2
- 구분선 (FIBA 양식 정합) → 우측 3 입력 (Referee / Umpire 1 / Umpire 2) sm:grid-cols-3
- 구분선 → 하단 1 입력 (Captain's signature in case of protest)
- 마지막 = Notes textarea (rows 3 / min-height 88px / 글자수 카운터 / resize vertical)
- 모든 입력 border-bottom only (FIBA 양식 underscore 정합) / radius/background ❌
- `--color-*` 토큰만 / Material Symbols / lucide-react 0 / 핑크코랄 0

### 검증
| 항목 | 결과 |
|------|------|
| tsc --noEmit | 0 에러 (출력 0) |
| vitest 신규 케이스 | 10/10 PASS |
| vitest 전체 회귀 | 487/487 PASS (이전 477 + 신규 10) |
| 디자인 13 룰 (lucide-react / 핑크코랄 / BigInt n) | 위반 0 |
| Flutter v1 영향 | 0 (api/web/score-sheet 단일) |
| schema 변경 | 0 (settings JSON 활용) |
| AppNav frozen | 0 영향 |
| 운영 DB 영향 | 0 (코드만) |

### tester 참고
- 테스트 방법:
  1. `npx vitest run src/__tests__/score-sheet/signature-types.test.ts` — 10 케이스
  2. 수동 E2E (paper 모드 매치):
     - 헤더에서 Referee/Umpire 1/Umpire 2 입력 → 페이지 스크롤 후 FooterSignatures 영역에 동일 값 자동 prefill 검증
     - 풋터 refereeSign 수정 → 헤더 referee 다시 변경 → 풋터 값 변경 안 됨 (dirty flag 검증)
     - 8 입력 + notes 모두 입력 → 경기 종료 → BFF POST → DB `match.settings.signatures` JSON 박제 + `match.notes` 컬럼 박제 검증
     - 빈 상태로 경기 종료 → BFF payload 에 signatures 키 자체 미전송 → settings.signatures 갱신 0 (timeouts 와 동일 패턴)
- 정상 동작:
  - 풋터 = 페이지 하단 (MatchEndButton 위)
  - 좌·우·하단 3 영역 구분선
  - 입력 = border-bottom only (FIBA underscore)
  - notes 글자 카운터 실시간 (0 / 500)
  - 모든 입력 disabled 가능 (Phase 6 PDF 인쇄 시 readonly 활용 예정)
- 주의할 입력:
  - 51자 초과 입력 시도 → maxLength 50 차단 (브라우저 native)
  - 빈 풋터로 제출 → signatures 키 자체 미전송 (BFF 가 UPDATE skip)
  - draft 복원 시 구버전 draft (signatures 키 없음) → EMPTY_SIGNATURES 그대로 (방어 검증)

### reviewer 참고
- **dirty flag (`didPrefillRef`) 단일 source**: useEffect mount 1회 시도. 풋터 값이 빈 문자열이 아닐 때 (draft 복원 또는 수동 수정) prefill skip. 패턴 단순화 — useState 별도 dirty 플래그 미사용 (useRef 1개로 해결).
- **settings JSON 통합 UPDATE**: Phase 4 와 Phase 5 를 분리 UPDATE 하면 DB 왕복 2회 + race condition 위험 → 단일 UPDATE 로 통합. 둘 다 미전송 시 UPDATE 자체 skip (운영 DB 부하 0).
- **notes 박제 위치 결정**: TournamentMatch.notes 컬럼 vs settings.notes JSON 둘 다 검토 → 컬럼 채택 (기존 BFF 의 별도 update 흐름 그대로). settings.signatures 와 분리 — 노트는 본래 매치 메타.
- **hasAnySig 분기 (buildSubmitPayload)**: 빈 객체 전송 회피 — BFF 가 input.signatures 미수신 시 settings.signatures 갱신 0 (timeouts 와 동일 idempotent 패턴). 8 키 OR 검사 + notes 별도 처리 (vitest §payload 박제 룰 검증).
- **maxLength 클라이언트 가드 vs zod 서버 가드**: 입력 컴포넌트 maxLength (HTML native) + zod schema max (서버 검증) 이중 가드. 사용자 조작으로 51자 전송 시도 시 zod 가 차단 (validationError).
- **헤더 / 풋터 별개 박제**: FIBA 양식 정합 — 헤더 = 경기 전 정보 (FibaHeader.referee) / 풋터 = 종료 후 서명 (signatures.refereeSign). Phase 6 PDF 인쇄 시 두 영역 별도 박제.

## 구현 기록 (developer) — FIBA 양식 Phase 4 Time-outs

📝 구현 범위: FIBA Article 18-19 (전반 2 / 후반 3 / OT 각각 1) + settings.timeouts JSON 박제 (Phase 1-A recording_mode 패턴 재사용)

### 변경 파일
| 파일 | 변경 | 신규/수정 | 줄수 |
|------|------|---------|-----|
| `src/lib/score-sheet/timeout-types.ts` | TimeoutMark / TimeoutsState / EMPTY_TIMEOUTS / GamePhase / TIMEOUTS_PER_PHASE | 신규 | 50 |
| `src/lib/score-sheet/timeout-helpers.ts` | getGamePhase / getUsedTimeouts / getRemainingTimeouts / canAddTimeout / addTimeout / removeLastTimeout | 신규 | 180 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | timeouts/onRequestAddTimeout/onRequestRemoveTimeout prop + TIME-OUTS placeholder 활성화 (5칸 기본 + OT 진입 시 동적 추가 + phase 잔여 표시) | 수정 | +95 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | timeouts state + handleRequestAddTimeout/RemoveTimeout (Article 18-19 toast 분기) + draft 복원/저장 + buildSubmitPayload | 수정 | +50 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | timeoutMarkSchema/timeoutsSchema + submitSchema.timeouts.optional() + settings JSON merge UPDATE + audit context 카운트 박제 | 수정 | +40 |
| `src/__tests__/score-sheet/timeout-helpers.test.ts` | 30 케이스 (getGamePhase 3 / Used 4 / Remaining 4 / canAdd 8 / addTimeout 7 / removeLast 3 / 전체경기시나리오 1) | 신규 | 250 |

### Article 18-19 룰 분기 (timeout-helpers.ts)
| 분기 | 조건 | 동작 |
|------|------|------|
| 전반 (Q1+Q2) | currentPeriod 1~2 | 팀당 2개 (합산) — 차단: "전반 타임아웃 모두 사용" |
| 후반 (Q3+Q4) | currentPeriod 3~4 | 팀당 3개 (합산) — 차단: "후반 타임아웃 모두 사용" |
| 연장 (각 OT) | currentPeriod 5+ | OT n 별로 1개씩 (별도 카운트) — 차단: "OT{n} 타임아웃 모두 사용" |

### settings JSON merge 패턴 (Phase 1-A 재사용)
- 기존 settings 객체 spread → `timeouts` 키만 set → 기존 `recording_mode` 등 키 보존
- `input.timeouts` 전송 시만 UPDATE (미전송 = 기존 settings 유지)
- match.settings 가 null/array/primitive 인 경우 → 빈 객체에서 시작 (방어)
- schema 변경 **0** / Prisma JSON 컬럼 활용

### UX 동작
- 빈 칸 클릭 → `canAddTimeout` 검증 → 통과 시 마킹 + toast "Team A 전반 타임아웃 1/2" / 차단 시 toast "Team A 전반 타임아웃 모두 사용 — 추가 불가"
- 마지막 마킹 칸 클릭 → 1건 해제 + toast "Team A 타임아웃 1건 해제"
- OT 진입 시 (currentPeriod≥5) 칸 동적 추가 (5+OT수 = 6/7/8칸)
- phase 잔여 표시 (헤더 우측 "전반 1/2" / "후반 2/3" / "OT1 0/1")
- 채운 칸 = text-primary 배경 (●) / 빈 칸 = text-muted 숫자

### 검증
| 항목 | 결과 |
|------|------|
| tsc --noEmit | 0 에러 (EXIT 0 / 출력 0) |
| vitest 신규 케이스 | 30/30 PASS |
| vitest 전체 회귀 | 477/477 PASS (이전 439 + 신규 30 + 누적 기타 8건) |
| 디자인 13 룰 (lucide-react / 핑크코랄 / BigInt n) | 위반 0 |
| Flutter v1 영향 | 0 (api/web/score-sheet 단일) |
| schema 변경 | 0 (settings JSON 활용) |
| AppNav frozen | 0 영향 |
| 운영 DB 영향 | 0 (코드만) |

### tester 참고
- 테스트 방법:
  1. `npx vitest run src/__tests__/score-sheet/timeout-helpers.test.ts` — 30 케이스
  2. 수동 E2E (paper 모드 매치):
     - 전반 (Q1/Q2) — 빈 칸 2회 클릭 → 채워짐 + toast / 3번째 = 차단
     - 후반 (Q3/Q4) — 3개 가능 / 4번째 차단
     - OT1 진입 (쿼터 종료×4) — 새 6번째 칸 등장 / OT1 1개 / 2번째 차단
     - OT2 진입 — 7번째 칸 추가 / OT1 사용량 영향 0
     - 마지막 칸 클릭 = 해제 (toast)
     - 경기 종료 → submit BFF → DB `match.settings.timeouts` JSON 박제 검증 (`recording_mode` 키 보존)
- 정상 동작:
  - phase 잔여 헤더 우측 "전반 1/2" 류 실시간 표시
  - team A / team B 양면 독립 (한쪽 다 써도 다른 쪽 영향 0)
- 주의할 입력:
  - 같은 period 에서 2회 연속 (Q1 에서 2회) = 정상 허용 (FIBA = 합산 룰)
  - 전반 다 사용 후 Q3 진입 = 후반 3개 별도 리셋 (전반 사용량 영향 0)

### reviewer 참고
- **settings JSON merge 패턴**: Phase 1-A `withRecordingMode` 와 동일 — 객체 spread + 키 set. 단 helper 함수 분리는 안 함 (BFF route 1회 사용 / 별도 export 필요 시 timeout-helpers.ts 로 이동 가능).
- **OT 분리 카운트**: `getUsedTimeouts(timeouts, "overtime", overtimePeriod)` 의 overtimePeriod 인자가 핵심. 미지정 시 모든 OT 합산 (호환성 fallback) — canAddTimeout 은 항상 currentPeriod 의 specific OT 만 전달.
- **칸 수 동적 산정**: `totalCells = currentPeriod <= 4 ? 5 : 5 + (currentPeriod - 4)` — currentPeriod 가 7 (OT3) 이면 8칸. 마킹 안 했어도 OT 진입 자체로 빈 칸 표시 (운영자 인지).
- **Q4 마지막 2분 룰 / Q2 마지막 2분 룰 미적용**: 시간 정보 없는 종이 기록 특성 — 합산 카운트만 검증 (FIBA 룰 단순화). 향후 시간 통합 시 보완 가능.

## 구현 기록 (developer) — FIBA 양식 Phase 3.5

📝 구현 범위: 파울 종류 (P/T/U/D) + FIBA Article 41 5반칙 룰 + 쿼터/경기 종료 + 라이센스 자동 fill (User.id)

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|---------|
| `src/lib/score-sheet/foul-types.ts` | FoulType enum + FOUL_TYPE_LABEL + FoulMark.type + EjectionReason + EJECTION_REASON_LABEL | 수정 (+50) |
| `src/lib/score-sheet/foul-helpers.ts` | getPlayerFoulCountByType / getEjectionReason / addFoul Article 41 차단 / foulsToPBPEvents type 박제 / isPlayerEjected 위임 | 수정 (+90) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/foul-type-modal.tsx` | 4 종류 선택 모달 (60px+ 터치 + ESC + 백드롭 클릭) | 신규 (180) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/match-end-button.tsx` | 경기 종료 confirm modal + BFF POST + 라이브 페이지 Link | 신규 (240) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | 파울 칸 P/T/U/D 글자 + Licence Read-only (User.id) + 퇴장 사유 분기 라벨 + onRequestAddFoul/RemoveFoul 분리 prop | 수정 (+80) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/period-scores-section.tsx` | "쿼터 종료" 큰 버튼 + 종료된 Period 회색 + 체크 마크 | 수정 (+60) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | FoulTypeModal state + handleSelectFoulType + handleEndPeriod toast + buildSubmitPayload + MatchEndButton 마운트 | 수정 (+90) |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | foulMarkSchema.type 추가 (default "P" 폴백) | 수정 (+3) |
| `src/__tests__/score-sheet/foul-helpers.test.ts` | Article 41 4사유 분기 + addFoul 차단 메시지 분기 + foulsToPBPEvents type 박제 (+18) | 수정 (+170) |

### FIBA Article 41 룰 분기 (우선순위)
1. D 1회 → "disqualifying" (즉시 퇴장)
2. T 2회 → "2_technical"
3. U 2회 → "2_unsportsmanlike"
4. P+T+U+D 합 ≥ 5 → "5_fouls"

### Licence 자동 fill source
- **TournamentTeamPlayer.users.id** (User.id 직접 박제) — Read-only display
- 미연결 (게스트) 선수 = "—" 표시
- RosterItem.userId 이미 page.tsx server prop 에서 전달 중 (변경 0)

### 경기 종료 흐름 (Phase 5 일부 선진입)
1. "경기 종료" 빨강 버튼 → confirm modal (점수 + Winner + ⚠️ 라이브 발행 안내)
2. "경기 종료 확인" → BFF POST `/api/web/score-sheet/{id}/submit` status="completed"
3. 응답 성공 → toast + 라이브 페이지 Link / 실패 → 모달 유지 재시도
- 응답 판정: `res.ok` 단일 source (errors.md 2026-04-17 함정 회피)

### 절대 룰 검증
| 룰 | 결과 |
|----|------|
| schema 변경 / Flutter v1 영향 / AppNav frozen | 0 / 0 / 0 |
| 디자인 토큰 / lucide-react / 핑크 | var(--*) / 0 / 0 |
| 빨강 본문 텍스트 | 0 (D 버튼 / 경기 종료 배경 빨강 = 위험 액션 예외) |
| 터치 영역 | 44px+ (FoulTypeModal 64px+) |
| BigInt n 리터럴 | 0건 |
| tsc | 0 에러 |
| vitest | 439/439 (+23 신규) |

### tester 참고
- 시나리오:
  1. 파울 빈 칸 클릭 → FoulTypeModal 4 종류 선택 → 마킹
  2. T 2회 / U 2회 / D 1회 = 즉시 퇴장 toast + 행 회색
  3. Licence (UID) = User.id 자동 표시 (입력 불가)
  4. "{Q} 종료" 버튼 → toast + 다음 Period
  5. "경기 종료" 빨강 → modal → BFF 제출 → 라이브 발행
- 회귀: Phase 1/2/3 (헤더 / Running Score / Period 자동 / Winner) 그대로

### reviewer 참고
- Article 41 우선순위 정합 (D > T2 > U2 > 5반칙 — 심각도 순)
- FoulType.default("P") 폴백 = 구 client (Phase 3 미마이그) draft 호환
- description 형식 "선수 N번 P3 파울" → "선수 N번 P" (period 정보는 quarter 필드에 박제 — PBP 검색 영향 0)

---

## 협회 연결 작업 (2026-05-12 — 보존)

## 협회 연결 작업 (2026-05-12)

### 진단
| 항목 | 값 |
|------|-----|
| 강남구농구협회 | id=3 / slug=`org-ny6os` / status=approved |
| 연결 시리즈 (해제 전) | **BDR 시리즈 (id=8)** 1개 |
| 시리즈 묶인 대회 | 12개 (BDR 자체 대회 — 협회와 무관했음) |
| 강남구협회장배 | "2026 강남구협회장배 농구대회 (유소년부)" / id=`bd527531...` / status=draft / series_id=NULL |

### UPDATE 결과
- `tournament_series.organization_id = NULL WHERE id = 8` → 1건 업데이트
- 강남구농구협회 events-tab 시뮬레이션: seriesCount = **0** ✅
- 12개 tournament 자체는 보존 (delete X, organization 연결만 해제)

### 흐름 점검 결과 (대회 → 단체 연결 운영자 UI)
| 발견 | 평가 |
|------|------|
| 데이터 모델 | `Tournament.series_id → tournament_series.organization_id → organizations.id` (Series가 중간 계층) |
| 대회 PATCH API | `series_id` 필드 부재 → 사후 연결 불가 |
| 운영자 흐름 | 단체 → 시리즈 생성 → 대회 신규 생성 (역순 강제). 기존 대회를 단체에 옮기는 UI/API 없음 |
| 강남구협회장배 현재 상태 | series_id=NULL → 어떤 단체에도 미연결. 강남구농구협회에 연결하려면 (1) 협회에 새 시리즈 생성 → (2) 대회의 series_id를 그 시리즈로 변경. **(2) 단계 UI 부재** |

### 권장 후속 작업 (사용자 결정 대기)
1. **Tournament PATCH 엔드포인트에 `series_id` 추가** + 권한 체크 (대회 organizer + 시리즈 organizer 일치)
2. **대회 설정 페이지에 "소속 시리즈 선택" UI** 추가 — 운영자가 자신의 시리즈 목록에서 선택
3. (선택) 단체 관리 페이지에서 "기존 대회 가져오기" 흐름 — 운영자가 자기 대회 중 미연결 대회를 시리즈에 흡수

---

## 기획설계 (planner-architect) — 대회-시리즈 연결 UI

목표: 운영자가 **이미 생성한 대회**를 본인 소유 단체(시리즈)에 사후 연결하는 UI/API 흐름을 제공한다. 단체 events 탭 노출 (`tournament.series_id → series.organization_id`) 을 운영자 셀프서비스로 가능하게 만든다.

### 비유로 이해
- 대회 = 책 한 권 / 시리즈 = 책 시리즈 묶음(예: 해리포터) / 단체 = 출판사 책장
- 현재는 "책장에 시리즈를 만들고 그 자리에서 책을 새로 만드는 것"만 됨. "이미 손에 있는 책을 그 자리로 옮기는" 동작이 없음

### 1. 옵션 비교 (UI 위치)

| 옵션 | 시작 위치 | 운영자 동선 | 장점 | 단점 | 클릭 수 |
|------|---------|-----------|------|------|--------|
| **A. 대회 설정 셀렉트** | 대회 wizard → "대회 정보" 스텝 | 대회 편집 중 "소속 시리즈" 드롭다운에서 본인 시리즈 선택 → 저장 | 기존 wizard 흐름에 자연스럽게 흡수. 새 페이지 0개. 대회 단위 결정이라 직관적 | 단체 측에서 "어떤 대회 흡수할까" 시점에는 보이지 않음 (역방향) | **3~4** |
| **B. 단체 모달 "내 대회 가져오기"** | `/tournament-admin/organizations/[orgId]` → 시리즈 카드 우측 버튼 | 단체 페이지에서 시리즈 선택 → "기존 대회 가져오기" 모달 → 본인 미연결 대회 목록 → 체크 → 일괄 흡수 | 단체 관점에서 events 라인업을 한눈에 구성. 다건 흡수 가능 | 신규 모달 + 신규 API. 단체에서 시리즈를 골라야 한다는 두 번의 선택 | **4~5** (다건 시 효율) |
| **C. 양쪽 제공** | A + B | 둘 다 가능 | UX 유연성 | 작업량 2배. 권한 검증 코드 중복 | — |

**추천: A 먼저 (PR1) → B 후행 (PR3, 선택)**
- 사유: A 만으로도 시나리오 100% 커버. wizard 가 이미 모든 대회 필드를 다루므로 series_id 추가 부담 최소. B 는 다건 흡수 needs 가 나오면 그때.
- 단체 페이지에서 "왜 대회가 없지?" 시 사용자가 곧장 대회 wizard 로 이동하도록 `/tournament-admin/organizations/[orgId]` 의 시리즈 카드에 **"이 시리즈에 대회 연결"** 안내 링크만 추가 (PR2, A 보강).

### 2. Phase 분해 (PR 단위)

| PR | 범위 | 파일 | 신규/수정 | LOC |
|----|------|------|---------|-----|
| **PR1** | API + zod schema (series_id PATCH 지원) | `src/lib/validation/tournament.ts` | 수정 | +5 |
| | | `src/app/api/web/tournaments/[id]/route.ts` | 수정 | +25 |
| | | `src/lib/auth/series-permission.ts` | 신규 (시리즈 권한 헬퍼) | +35 |
| | | `src/lib/services/tournament.ts` (series_id update + counter 동기화) | 수정 | +20 |
| | | `__tests__/api/tournament-series-link.test.ts` (vitest 6~8 케이스) | 신규 | +120 |
| **PR2** | UI: 대회 wizard "대회 정보" 스텝에 시리즈 드롭다운 + 운영자 본인 시리즈 GET | `src/app/api/web/series/my/route.ts` (GET 본인 시리즈 목록) | 신규 | +40 |
| | | `src/app/(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx` | 수정 (드롭다운 추가) | +50 |
| | | (옵션) `/tournament-admin/organizations/[orgId]` 시리즈 카드 "대회 연결" 안내 링크 | 수정 | +10 |
| **PR3 (선택)** | 단체 모달 "내 대회 가져오기" (옵션 B) | `src/app/api/web/tournaments/my-unlinked/route.ts` (GET 본인 미연결 대회) | 신규 | +50 |
| | | `src/app/api/web/series/[id]/absorb-tournaments/route.ts` (POST 다건 흡수) | 신규 | +70 |
| | | `_components/AbsorbTournamentsModal.tsx` | 신규 | +180 |

총 PR1+PR2 ≈ **+305 LOC** / PR3 ≈ **+300 LOC** (선택)

### 3. API 변경 사항

**(a) PATCH `/api/web/tournaments/[id]`** — `series_id` 필드 추가

zod schema:
```ts
series_id: z.string().nullable().optional()  // "8" 같은 문자열 ID, null=분리, undefined=무변경
```

route.ts 처리 (의사 코드):
```
if (data.series_id !== undefined):
  if (data.series_id === null): updateData.series_id = null
  else:
    target_series = SELECT * FROM tournament_series WHERE id = data.series_id
    if (!target_series): apiError(404 "시리즈 없음")
    // 권한: 시리즈 organizer가 현재 로그인 유저인가
    if (target_series.organizer_id !== userId AND !isSuperAdmin): apiError(403)
    updateData.series_id = BigInt(data.series_id)
    // 카운터 동기화: 이전 시리즈 -1, 새 시리즈 +1
```

**(b) GET `/api/web/series/my`** (PR2 신규) — 본인 시리즈 드롭다운용

응답: `[{ id, name, organization: { id, name } | null }]` (자기 organizer_id 인 시리즈)

**(c) GET `/api/web/tournaments/my-unlinked`** (PR3 신규, 선택) — 옵션 B용

응답: `series_id IS NULL AND organizer_id = me AND status IN (draft, registration)` 대회 목록

### 4. 권한 정책 (결재 사항)

| 항목 | 권장 정책 | 사유 |
|------|---------|------|
| 운영자가 임의 시리즈에 자기 대회 연결 | ❌ 본인 소유 시리즈만 | `tournament_series.organizer_id === userId` 검증 |
| 운영자가 자기 대회를 타 운영자 시리즈에 연결 | ❌ 금지 | 위와 동일 검증으로 차단 |
| `series_id = NULL` (분리) | ✅ 허용 | 대회 organizer 본인 권한만 있으면 OK |
| 시리즈 organizer 변경 시 묶인 대회 자동 이관 | **별도 결정** (현 작업 범위 외) | 본 PR 에서는 다루지 않음 — 위험 사항에 명시 |
| super_admin | ✅ 전부 우회 | 기존 `requireTournamentAdmin` 패턴 일치 |
| 대회 status 별 제약 | **결재 필요** — 권장: draft/registration 만 허용, in_progress/completed 잠금 | 진행중 대회를 다른 시리즈로 이동 = 단체 events 데이터 일관성 위험 |

### 5. UX 흐름 (시나리오: 강남구협회장배 → 강남구농구협회 연결)

**옵션 A 흐름 (권장)**:
1. `/tournament-admin/organizations/3` 에서 "새 시리즈 만들기" → "강남구협회장배 시리즈" 생성 (이미 가능, 변경 0)
2. `/tournament-admin/tournaments/{bd527531...}/wizard` → "대회 정보" 스텝 → **소속 시리즈** 드롭다운에서 "강남구협회장배 시리즈 (강남구농구협회)" 선택
3. "저장" 클릭 → `PATCH /api/web/tournaments/[id]` `series_id = 새 시리즈 ID` → DB 업데이트
4. `/organizations/org-ny6os` events 탭에 자동 노출 검증
- **클릭 수 4** (시리즈 만들기 진입 + 저장 + 대회 wizard 진입 + 저장)

**옵션 B 흐름 (PR3 채택 시)**:
1. 시리즈 미리 생성 (옵션 A와 동일)
2. `/tournament-admin/organizations/3` → 시리즈 카드 → **"대회 가져오기"** 버튼 → 모달 오픈
3. 본인 미연결 draft 대회 체크 → "흡수" 클릭 → 일괄 처리
- **클릭 수 5** 이지만 다건 흡수 가능 (1번에 N개)

### 6. 위험 / 미해결

| 위험 | 평가 | 대응 |
|------|------|------|
| **published 후 시리즈 변경 허용?** | 단체 events 탭 데이터 일관성 깨짐 (이미 노출된 대회가 갑자기 사라지거나 다른 단체로 점프) | **권장: draft/registration 만 허용** — `if (tournament.status NOT IN [draft, registration]) apiError("진행 중인 대회는 시리즈 변경 불가, 분리만 가능")` |
| **시리즈 변경 = 단체도 함께 따라감 (이행적 변경)** | 운영자가 "시리즈만 바꿨는데 단체도 바뀌었네?" 혼란 | UI 드롭다운 라벨에 **"시리즈명 (단체명)"** 표기 강제 + 저장 직전 confirm 모달 ("강남구농구협회 events 탭에 노출됩니다. 진행하시겠어요?") |
| **DB FK constraint** | `tournament.series_id → tournament_series.id` FK 이미 존재 (nullable). 별도 마이그레이션 불필요 | schema 변경 0 — 운영 DB 영향 0 |
| **Flutter 앱 영향** | Flutter v1 `/api/v1/...` 가 series_id 를 사용하는지 확인 필요 | grep 결과 0 (대회 PATCH 는 admin/web 만). 그러나 **원영 사전 공지 권장** — Flutter 가 대회 상세에서 series 정보 표기 시 변경 가능성 |
| **카운터 정합성** | `tournament_series.tournaments_count`, `organizations.series_count` 자동 갱신 누락 시 표시 오류 | services/tournament.ts 에서 transaction 내 increment/decrement 명시 |
| **시리즈 organizer 변경 시 대회 자동 이관** | 본 작업 범위 외 — 현재 코드도 미구현 | scratchpad 후속 큐로 별도 결재 |

### 7. 운영자 결재 사항 (developer 진입 전)

| # | 결재 항목 | 권장 |
|---|---------|------|
| Q1 | 옵션 A / B / C 중 우선 채택 | **A 먼저 (PR1+PR2), B 는 후행 (PR3 보류)** |
| Q2 | 대회 status 별 변경 허용 범위 | **draft/registration 만 허용** (in_progress/completed 잠금. 분리는 항상 허용) |
| Q3 | published 사이트 (`tournamentSite.isPublished = true`) 대회 변경 허용? | **권장 ❌** — Q2 와 별개로 published 시 잠금 / 또는 Q2 만으로 충분히 안전하면 OK |
| Q4 | 시리즈 변경 시 confirm 모달 표시 | **권장 ✅** — "단체 X events 탭에 노출됩니다" 확인 |
| Q5 | super_admin 의 임의 시리즈 연결 허용? | **권장 ✅** — 기존 패턴 일치, 운영 fix 용 |
| Q6 | Flutter 원영 사전 공지 필요? | **권장 — 1회 공지 (메시지 1줄)** "대회 PATCH 에 series_id 추가, Flutter 영향 0 확인" |
| Q7 | PR3 (옵션 B) 구현 시점 | **PR1+PR2 사용자 반응 후 결정** |

### 8. 실행 계획 (PR1+PR2 기준)

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|---------|
| 1 | zod schema `series_id` 필드 추가 | developer | 없음 |
| 2 | `series-permission.ts` 헬퍼 신규 (organizer 검증) | developer | 없음 (1과 병렬) |
| 3 | PATCH route series_id 처리 + counter 동기화 + status 가드 | developer | 1, 2 |
| 4 | `/api/web/series/my` GET 신규 | developer | 없음 |
| 5 | wizard "대회 정보" 스텝 드롭다운 + 저장 시 series_id 전달 | developer | 3, 4 |
| 6 | vitest 회귀 가드 (권한/status/카운터 6~8 케이스) | tester | 3 (병렬: 5와 동시) |
| 7 | 운영 DB 시나리오 검증 (강남구협회장배 실제 연결 — events 탭 노출 확인) | PM | 5, 6 통과 후 |

⚠️ developer 주의사항:
- 응답 키 자동 snake_case 변환 (errors.md 재발 5회) — 프론트 인터페이스도 snake_case
- `series_id` 는 BigInt — JSON 직렬화 시 문자열 변환 필수 (`.toString()`)
- counter 동기화는 **transaction 내** (`prisma.$transaction`) — series.tournaments_count, organizations.series_count 별개로 카운트 안 함 (series_id 만 바꾸면 organization 자체는 안 바뀌므로 org.series_count 영향 0). **tournaments_count 만 -1/+1**
- super_admin 우회는 `isSuperAdmin(session)` 단일 source 사용 (tournament-auth.ts 패턴 따라)
- 운영 DB schema 변경 0 — `prisma db push` **불필요**

## 구현 기록 (developer) — 대회-시리즈 연결 API PR1

📝 구현한 기능: 운영자가 자신의 대회를 사후에 시리즈에 연결/분리할 수 있는 PATCH API + 권한 헬퍼 + status 가드 + 카운터 동기화. UI 는 PR2 별 turn.

### 변경 파일
| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/lib/validation/tournament.ts` | zod updateTournamentSchema 에 `series_id: z.union([z.string(), z.null()]).optional()` 추가 | 수정 |
| `src/lib/auth/series-permission.ts` | 신규 — `requireSeriesOwner(seriesId, userId, {allowSuperAdmin, session})` + `SeriesPermissionError(status)` (throw 패턴, 404/403 분기) | 신규 |
| `src/app/api/web/tournaments/[id]/route.ts` | PATCH 핸들러에 series_id 처리 블록 추가 — (1) 현재 대회 status/series_id 조회 (2) 새 series_id 파싱 (null/""/BigInt) (3) status 가드 (in_progress/completed → 이동 ❌, 분리 ✅) (4) requireSeriesOwner 권한 검증 (5) `prisma.$transaction` 안에서 이전 시리즈 -1 / 새 시리즈 +1 / tournament UPDATE 원자적 처리 | 수정 |
| `src/__tests__/api/tournament-series-link.test.ts` | 신규 — vitest 11 케이스 (route 8 + requireSeriesOwner 단위 3) | 신규 |

### 핵심 로직
- **status 허용 set**: `SERIES_CHANGE_ALLOWED_STATUSES = new Set(["draft", "registration_open"])`. zod schema 에 status enum 이 "registration_open" 으로 박제되어 있어 이 값이 정답 (planner 의 "registration" 표기 = 실제는 registration_open).
- **분리(null) 는 모든 status 허용** — Q2 결재.
- **services/tournament.ts 미변경** — updateTournament 는 단순 prisma.update wrapper 유지. series_id 변경은 route.ts 단일 진입점에서 $transaction 처리 (다른 호출자 side-effect 회피).
- **isSame 분기** — 같은 series_id 면 카운터 동기화 skip, 일반 update 흐름 합류.
- **빈 문자열 → null 취급** — UI 드롭다운 "선택 안 함" 옵션이 "" 보낼 가능성 대비.

### 검증 결과
| 항목 | 결과 |
|------|------|
| tsc --noEmit | 0 에러 |
| vitest 신규 케이스 | 11/11 PASS |
| vitest 전체 회귀 | 416/416 PASS (이전 405 + 신규 11) |
| Flutter v1 series_id grep | 0 사용처 (영향 0 재확인) |
| prisma schema 변경 | 0 |
| BigInt literal 안티패턴 | 0 |
| 핑크/살몬/코랄 hardcode | 0 |
| lucide-react import | 0 |

### ⚠️ 위험 발견 — 카운터 정합성 (코드 결함 ❌ / 기존 데이터 이슈)
운영 DB SELECT 검증 결과 `tournament_series.tournaments_count` 불일치 1건:
- BDR 시리즈(id=8) stored=0 / actual=12 (diff +12)
- 사유: 본 PR 이전부터 카운터 미동기화 (대회 생성 시 +1 박제 누락 + 5/12 organization_id NULL UPDATE 영향 무관)
- 권장 후속: 카운터 일괄 backfill UPDATE (별도 turn — 사용자 승인 후 진행). 본 PR1 코드 자체는 정상 동작 (이전 +12 가 0 인 상태에서 본 PR이 +1 / -1 정상 박제)

### 💡 tester 참고
- 테스트 방법: `npx vitest run src/__tests__/api/tournament-series-link.test.ts`
- 11 케이스 시나리오:
  1. 자기/자기 → 200 + 카운터 +1
  2. 자기/타인 → 403
  3. 자기/없는 시리즈 → 404
  4. null 분리 (draft) → 200 + 카운터 -1
  5. in_progress + 다른 시리즈 이동 → 400 (status 가드)
  6. in_progress + null 분리 → 200 (분리는 항상 허용)
  7. 시리즈 변경 (8 → 9) → 카운터 양면 (-1 / +1)
  8. super_admin 우회 → 200
  9-11. requireSeriesOwner 단위 (404 / 403 / super_admin 우회)
- 정상 동작: 위 매트릭스 그대로
- 주의할 입력:
  - 빈 문자열 `""` → null 분리로 취급 (의도)
  - "abc" 같은 비 numeric string → BigInt() throw → 400 ("유효하지 않은 시리즈 ID")
  - 같은 series_id 로 PATCH (변경 없음) → carrier 일반 update 흐름 (transaction 진입 X)

### ⚠️ reviewer 참고
- **services/tournament.ts 의 updateTournament 함수에 series_id 처리를 안 넣은 이유**: 단순 wrapper 보존 + 다른 호출자(생성/wizard) 에 카운터 +1/-1 side-effect 위험 회피. series_id 변경 유일한 진입점 = PATCH route 이므로 거기에 집중. 추후 wizard 생성 시점에도 series_id 박제 + 카운터 +1 동기화 정책 일관화 검토 필요 (별도 turn).
- **카운터 정합성 이슈**: stored=0/actual=12 불일치 = 본 PR 코드와 무관, 기존 데이터 누락. PR2 (wizard 드롭다운) 전 backfill 권장.
- **이전 시리즈 권한 미검증 (의도)**: case 7 처럼 운영자가 자기 대회를 "타인 시리즈 → 자기 시리즈" 로 이동하는 케이스 = 이전 시리즈 권한 검증 안 함 (어차피 자기 대회 organizerId 검증은 requireTournamentAdmin 이 통과시킨 상태 — 자기 대회를 자기 시리즈로 옮기는 정상 운영 시나리오). 단 운영상 발생 가능성 매우 낮음 (어떻게 타인 시리즈에 박혔는지? = 과거 super_admin 박제 케이스).

## 구현 기록 (developer) — 대회-시리즈 연결 UI PR2

📝 구현한 기능: 운영자가 대회 wizard "대회 정보" 스텝에서 본인 보유 시리즈 드롭다운으로 사후 연결/분리 가능. 라벨 "시리즈명 (단체명)" 강제, confirm 모달 (단체 events 탭 노출 영향 명시), status 가드 (draft/registration_open 외 변경 disabled). PR1 PATCH API 활용.

### 변경 파일
| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/api/web/series/my/route.ts` | 신규 — GET 본인 organizer_id + status=active 시리즈 목록. organization { id, name, slug } include. BigInt → 문자열 직렬화. withWebAuth 가드. | 신규 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx` | 수정 — SeriesOption type + seriesId/seriesOptions/seriesLoaded state / loadTournament 에서 series_id 초기값 / useEffect GET /series/my / handleSeriesChange + confirmSeriesChange (메시지 4분기) / PATCH body 에 series_id 포함 / "기본 정보" 카드 status 아래 드롭다운 + status 가드 + confirm 모달 | 수정 |
| `src/__tests__/api/series-my.test.ts` | 신규 — vitest 5 케이스 (401 / where 절 검증 / organization 분기 / 빈 배열 / mock 직렬화 통과) | 신규 |

### 핵심 로직
- **드롭다운 라벨**: `{name} ({organization?.name ?? "단체 미연결"})` — JSX 단일 source. 모든 시리즈에 단체명 표기 강제.
- **status 가드**: `status === "draft" || "registration_open" || "registration"` 시만 활성. 외 상태는 disabled + 안내 텍스트. (PR1 API status 가드와 일치 — UI 단에서 1차 차단, 서버에서 2차 검증).
- **confirm 모달 메시지 4분기**:
  - null → 시리즈 (단체 연결): `'X 단체' events 탭에 노출됩니다.`
  - null → 시리즈 (단체 미연결): `선택한 시리즈 '시리즈명' 에 연결합니다 (단체 미연결).`
  - 시리즈 → null (단체 있었음): `현재 'X 단체' events 탭에서 사라집니다.`
  - 시리즈 → null (단체 없었음): `이 대회를 시리즈에서 분리합니다.`
  - 시리즈 → 시리즈: `선택한 시리즈가 'X 단체' 에 속해 있어요. 'X 단체' events 탭에 노출됩니다.`
- **PATCH 호출 흐름**: 드롭다운 onChange → handleSeriesChange (모달만 띄움, state 미반영) → 사용자 확인 → setSeriesId → wizard 저장 버튼에서 PATCH body 에 series_id 포함하여 일괄 전송. (즉시 PATCH 안 함 — wizard 패턴 통일성).
- **모달 디자인**: var(--color-*) 토큰만 / rounded-md / 44px+ 터치 영역 / 백드롭 클릭 = 취소 / Material Symbols `info` 아이콘. lucide-react 0.
- **에러 핸들링**: `/api/web/series/my` GET 실패 시 wizard 자체는 계속 사용 가능 — 드롭다운만 빈 상태 (cancelled flag 로 unmount race 방어).

### 검증 결과
| 항목 | 결과 |
|------|------|
| tsc --noEmit (본 PR 파일) | 0 에러 (foul-helpers.test.ts 1건 = 본 PR 무관 / 기존 untracked) |
| vitest 신규 케이스 | 5/5 PASS |
| vitest 전체 회귀 | 439/439 PASS (이전 434 + 신규 5) |
| 디자인 13 룰 (lucide-react / 핑크코랄 / BigInt N n) | 위반 0 |
| Flutter v1 영향 | 0 (admin 영역 wizard + 신규 GET API) |
| schema 변경 | 0 |
| 운영 DB 영향 | 0 (코드만) |

### 💡 tester 참고
- 테스트 방법:
  1. `npx vitest run src/__tests__/api/series-my.test.ts` — 5 케이스
  2. 수동 E2E: `/tournament-admin/tournaments/{draft-tournament-id}/wizard` → "대회 정보" → "소속 시리즈" 드롭다운 → 시리즈 선택 → confirm 모달 → 확인 → "변경사항 저장" → DB UPDATE 검증
- 정상 동작:
  - 드롭다운 옵션 1행 = "— 미연결 —" / 2행~ = 본인 시리즈 (단체명 라벨)
  - status=in_progress/completed 시 드롭다운 disabled + 안내 텍스트 노출
  - 시리즈 변경 시 confirm 모달 메시지가 분기에 맞게 노출 (단체명 동적 표시)
  - PATCH 응답 200 시 wizard 가 `/tournament-admin/tournaments/{id}` 로 리다이렉트
- 주의할 입력:
  - 본인 시리즈 0건 → 드롭다운 비어있음 + "보유한 시리즈가 없습니다" 안내
  - 단체 미연결 시리즈 선택 → 라벨 "(단체 미연결)" / 모달 카피도 분기
  - 시리즈 ID 가 "abc" 같은 비숫자 (수동 조작) → PR1 API 가 400 ("유효하지 않은 시리즈 ID")
  - 타인 시리즈 ID 수동 주입 → PR1 API 가 403

### ⚠️ reviewer 참고
- **PATCH 호출 시점**: 드롭다운 변경 즉시 X / wizard 최종 저장 시 일괄 — 기존 wizard 패턴 (모든 필드 한 번에 PATCH) 따름. 사용자가 confirm 후 다른 단계로 갔다가 저장 X 하고 wizard 이탈 시 변경 미적용 (의도).
- **status="registration" 폴백**: STATUS_OPTIONS 의 `value="registration"` 은 wizard 의 잘못된 enum 값 (실제 DB enum = `registration_open`). 본 PR 의 `seriesEditAllowed` 가드는 두 값 모두 허용 — wizard 자체 이슈 fix 는 별도 turn.
- **/series/my response unwrap**: `json.data?.data ?? json.data ?? []` — apiSuccess({ data }) 가 한 번 더 래핑하므로 더블 unwrap. 응답 구조 확정 후 단순화 가능.
- **status 가드 UI vs API**: UI 가 disabled 처리해도 클라이언트 조작으로 우회 가능 — PR1 API 의 status 가드가 최종 방어선. UI 는 UX 안내 위주.
- **카운터 정합성**: BDR 시리즈(id=8) stored=0/actual=12 불일치는 PR2 와 무관 (PR1 기록 §위험 발견 참조). 본 PR 이 카운터를 +1/-1 박제하면 그 baseline 위에서 정상 동작 — 모든 PR 후 일괄 backfill 권장.

## 구현 기록 (developer) — 대회-시리즈 연결 흡수 모달 PR3

📝 구현한 기능: 단체 관리 페이지(`/tournament-admin/organizations/[orgId]`) 시리즈 카드에 "기존 대회 가져오기" 버튼 + 모달 — 운영자가 본인 미연결 draft/registration 대회를 다건 한 번에 시리즈에 흡수. PR1 의 권한/status/카운터 정책을 다건 + skip 패턴으로 확장.

### 변경 파일
| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/api/web/tournaments/my-unlinked/route.ts` | 신규 — GET `organizerId=ctx.userId AND series_id IS NULL AND status IN (draft/registration_open/registration)` 본인 미연결 대회 목록. withWebAuth / select 최소 필드 / Date ISO 직렬화. | 신규 |
| `src/app/api/web/series/[id]/absorb-tournaments/route.ts` | 신규 — POST 다건 흡수. zod tournament_ids min1 max50 + uuid 검증 / requireSeriesOwner (allowSuperAdmin) / IN 절 1회 후보 SELECT / 각 row 검증 (본인 소유 / 중복 시리즈 / status 가드) → absorbed/skipped 분리 / $transaction 안에서 이전 시리즈별 -count group by + 새 시리즈 +absorbed.length + updateMany. | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/_components/AbsorbTournamentsModal.tsx` | 신규 — 모달 컴포넌트. 마운트 시 GET my-unlinked / 전체 선택 + 개별 체크박스 / ESC 키 닫기 / confirm 다이얼로그 2단계 / 응답 absorbed/skipped 분리 메시지 / 결과 1.5초 표시 후 onSuccess. 디자인: var(--color-*) 토큰만 / Material Symbols / 44px+ 터치. | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/page.tsx` | 수정 — useEffect → useCallback loadOrg 추출 (모달 onSuccess 시 재호출). 시리즈 카드 우측에 "기존 대회 가져오기" 버튼 + 모달 마운트 (`absorbModalSeries` state). 시리즈 카드 컨테이너 Link → div + 좌측 Link / 우측 액션 영역으로 재구성. | 수정 |
| `src/__tests__/api/tournaments-absorb.test.ts` | 신규 — vitest 8 케이스 (401 / 자기-자기 200 / 혼합 skip / 타인 시리즈 403 / status 가드 skip / 카운터 양면 / zod 빈배열 + 비-uuid 400). | 신규 |

### 핵심 로직

**(1) skip 패턴 (전체 400 X)**
- 후보 N건 중 일부가 조건 위반해도 정상 row 만 absorbed, 위반 row 는 `skipped: [{id, reason}]` 응답
- 사유 4분기: "대회를 찾을 수 없습니다." / "본인 소유 대회가 아닙니다." / "이미 이 시리즈에 연결된 대회입니다." / "진행 중이거나 종료된 대회는 흡수 불가합니다."
- UI 는 absorbed=0 면 첫 사유 표시, 1건+ 성공이면 "N개 흡수 (M건 제외 — 사유 외)" 메시지

**(2) status 정책 정합 (PR1 + my-unlinked + absorb 3개 API 일관)**
- 허용: `draft / registration_open / registration` (registration 은 wizard 잘못된 enum 폴백)
- 본인 소유 검증은 super_admin 도 우회 X — 시리즈 권한만 우회 (PR1 PATCH 와 정책 다름: 시리즈 단에서 임의 대회 흡수 차단 위해)

**(3) 카운터 동기화 ($transaction)**
- 이전 series_id 별 group by → `prevSeriesDecrement` Map 으로 누적 → 시리즈별 -count
- 새 시리즈 +absorbed.length (1회 호출)
- `tournament.updateMany({ where: { id: { in: absorbed } }, data: { series_id } })` 일괄 UPDATE
- absorbed=0 이면 $transaction 진입 X (early return)

**(4) UI 동선 (4 단계)**
- 단체 대시보드 진입 → 시리즈 카드 "기존 대회 가져오기" 클릭 → 모달 (체크박스 다건) → 흡수 confirm → 결과 inline 표시 → 1.5초 후 onSuccess → 페이지 refresh

### 검증 결과
| 항목 | 결과 |
|------|------|
| tsc --noEmit (본 PR 파일) | 0 에러 (잔존 score-sheet/team-section timeouts 2건 = FIBA Phase 4 작업 / 본 PR 무관) |
| vitest 신규 케이스 | 8/8 PASS |
| vitest 전체 회귀 | 477/477 PASS (이전 469 + 신규 8) |
| Flutter v1 series_id/my-unlinked/absorb grep | 0 사용처 |
| schema 변경 | 0 |
| 운영 DB 영향 | 0 (코드만, _temp 미사용) |
| 디자인 13 룰 (lucide-react / 핑크코랄 / BigInt n) | 위반 0 |

### 💡 tester 참고
- 테스트 방법:
  1. `npx vitest run src/__tests__/api/tournaments-absorb.test.ts` — 8 케이스
  2. 수동 E2E:
     - 강남구농구협회 단체 페이지(`/tournament-admin/organizations/{orgId}`) 진입
     - BDR 시리즈 또는 새 시리즈 카드 우측 "기존 대회 가져오기" 클릭
     - 모달: 본인 미연결 대회 목록 (현재 강남구협회장배 1건 + BDR 12건이 series_id 연결 상태라면 0건)
     - 체크 + "N개 흡수" → confirm → "흡수" → 결과 메시지 → 페이지 refresh 시 시리즈 카드 카운터 +N
- 정상 동작:
  - 모달 진입 시 GET /api/web/tournaments/my-unlinked 자동 호출
  - 전체 선택 토글 + 개별 체크 동작
  - 흡수 성공 시 카드의 "대회 N개" 텍스트 갱신 (loadOrg refresh)
  - skip 케이스: in_progress 대회는 목록에 안 나오므로 skip 경로는 동시 흡수 중 status 변경 race 외엔 발생 0
- 주의할 입력:
  - 빈 배열 / 비-uuid → 400 (zod 가드)
  - 미연결 대회 0건 → "현재 미연결 대회가 없습니다" 안내
  - 51건 이상 → 400 (zod max 50)
  - 타인 시리즈 ID 수동 URL 조작 → 403

### ⚠️ reviewer 참고
- **super_admin 우회 정책 다름 (PR1 vs PR3)**: PR1 PATCH 는 wizard 진입자 = 대회 organizer = 본인 (requireTournamentAdmin 통과). PR3 는 단체 페이지에서 시리즈 단위 진입 — 시리즈 권한만 우회 허용하고 대회 소유는 본인 일관성 유지 (super_admin 도 본인 소유 대회만 흡수). 보안상 보수적 선택.
- **카운터 동기화 group by**: 이전 시리즈가 N개 다른 시리즈에 분산돼 있을 수 있어 Map<seriesIdStr, count> 로 누적 → 시리즈별 1회 update. updateMany 와 분리한 이유 = decrement 는 increment 와 별도 row 대상.
- **응답 unwrap 패턴**: 모달은 `json?.data?.data ?? json?.data ?? []` 더블 unwrap (apiSuccess({ data }) 더블 래핑 회피 — PR2 와 동일). absorb POST 응답은 `json?.data ?? json` 단일 unwrap (apiSuccess({ absorbed, skipped }) 형태).
- **resultMessage 1.5초 setTimeout**: 사용자가 결과 메시지 (N개 흡수) 읽을 시간 확보 — toast 시스템 미도입 (단체 페이지는 ToastProvider 미사용) 단순 inline 메시지.
- **카운터 정합성**: BDR 시리즈(id=8) stored=0/actual=12 불일치 (PR1 §위험 발견 동일) — PR3 코드 자체는 정상 (-N/+N 박제 OK), backfill 별도 후속.
- **시리즈 카드 Link → div 재구성**: 기존 카드 전체가 Link 였으나, 버튼 클릭 시 시리즈 진입을 막아야 해서 좌측 정보 Link + 우측 액션 영역 (button + chevron Link) 으로 재구성. `e.preventDefault() + stopPropagation()` 으로 nested click 안전.

---

## 구현 기록 (developer) — 로그인 redirect 흐름 통합

📝 구현 범위: 비로그인 → 보호 페이지 → 로그인 페이지 → 원래 페이지 자동 복귀 흐름 통일 (admin / tournament-admin / guest-apply / report + OAuth 콜백). 분산된 isValidRedirect 단일 source 화.

### 변경 파일
| 파일 | 변경 | 신규/수정 | 줄수 |
|------|------|---------|-----|
| `src/lib/auth/redirect.ts` | `isValidRedirect` / `buildLoginRedirect` / `safeRedirect` 3 헬퍼 + `REDIRECT_QUERY_KEY` 상수. open redirect 방어 7 케이스 (외부 URL / protocol-relative / /login / /api/ / 2000자 / 절대 경로 / null) | 신규 | 110 |
| `src/middleware.ts` | matcher = `/admin/*` + `/tournament-admin/*` 만. `x-pathname` + `x-search` 헤더 주입 → layout 이 headers() 로 읽음. Flutter v1 / 일반 웹 영향 0 | 신규 | 55 |
| `src/app/(admin)/admin/layout.tsx` | redirect("/login") → `redirect(buildLoginRedirect(pathname, search))`. headers() 에서 x-pathname / x-search 읽음 (fallback "/admin") | 수정 | +6 |
| `src/app/(admin)/tournament-admin/layout.tsx` | 동일 패턴 (fallback "/tournament-admin"). 권한 부족 케이스 (no_permission) 는 redirect 쿼리 동봉 안 함 — 다른 계정 로그인 권유 | 수정 | +6 |
| `src/app/(web)/games/[id]/guest-apply/page.tsx` | `/login?next=...` → `buildLoginRedirect("/games/{id}/guest-apply")` | 수정 | +2 |
| `src/app/(web)/games/[id]/report/page.tsx` | `/login?returnTo=...` → `buildLoginRedirect("/games/{id}/report")` | 수정 | +2 |
| `src/app/(web)/login/page.tsx` | 로컬 isValidRedirect 제거 → `safeRedirect(rawRedirect, "")` 사용. 기존 인터페이스 (string \| null) 보존 | 수정 | +3 -4 |
| `src/app/actions/auth.ts` (loginAction) | redirectTo 검증 → `safeRedirect(redirectTo, "/")` 단일 호출. /login / /api/ / 2000자 추가 가드 | 수정 | +2 -1 |
| `src/lib/auth/oauth.ts` (handleOAuthLogin) | OAuth 콜백에서 `bdr_redirect` 쿠키 읽고 → safeRedirect 통과 → 원래 페이지 복귀. 쿠키 즉시 삭제 (재사용 방지) | 수정 | +10 -2 |
| `src/app/api/auth/login/route.ts` | 로컬 isValidRedirect 제거 → `@/lib/auth/redirect` 통일 | 수정 | +3 -5 |
| `src/__tests__/lib/auth/redirect.test.ts` | 19 케이스 (isValidRedirect 7 / buildLoginRedirect 6 / safeRedirect 4 + javascript: 차단 1 + 쿼리스트링 보존 1) | 신규 | 155 |

### 핵심 결정 — middleware로 x-pathname 헤더 주입
| 옵션 | 채택 사유 |
|------|---------|
| (A) middleware 신규 ✅ | matcher 로 `/admin/*` + `/tournament-admin/*` 만 — 다른 라우트 영향 0. layout 이 headers() 로 단순 read. |
| (B) headers().get("referer") | 외부 사이트에서 진입 시 빈 값 가능. SPA 라우팅 시 잘못된 값 가능. |
| (C) 각 page.tsx server component 가드 | 페이지마다 동일 가드 반복. layout 룰 부분 회귀 + 변경 범위 큼. |

### 보안 가드 (open redirect 방어)
- 외부 URL (`https://evil.com`) 차단
- protocol-relative URL (`//evil.com` — 브라우저가 외부로 해석) 차단
- 로그인 페이지 자체 (`/login` `/login?...` `/login/...`) 차단 → 무한 루프 방지
- API 경로 (`/api/...`) 차단
- 2000자 초과 차단 (DoS / 로그 오염 방지)
- javascript: / data: 의사 프로토콜 차단 (절대 경로 검증으로 자동 차단)

### 흐름 검증 (수동 시나리오)
1. 비로그인 → `/tournament-admin/tournaments/123/wizard` 접근 → middleware 가 `x-pathname` 주입 → layout 이 `/login?redirect=%2Ftournament-admin%2Ftournaments%2F123%2Fwizard` 로 redirect → 로그인 페이지가 hidden input 으로 redirect 보존 → 로그인 성공 → window.location.href = `/tournament-admin/tournaments/123/wizard` (auth.ts loginAction 의 safeRedirect 통과)
2. 비로그인 → `/admin/users` 접근 → 동일 흐름 (`/login?redirect=%2Fadmin%2Fusers`)
3. 카카오 로그인 → `/login?redirect=/tournament-admin/...` → 카카오 버튼 클릭 (URL 에 `?redirect=` 동봉) → `/api/auth/login` 이 `bdr_redirect` 쿠키 박제 (5분 TTL) → 카카오 인증 → OAuth 콜백 (`handleOAuthLogin`) 이 쿠키 읽고 safeRedirect 통과 → 원래 페이지 복귀
4. 권한 부족 (admin 역할 없음) → `/login?error=no_permission` (redirect 쿼리 미동봉 — 다른 계정 로그인 권유)
5. open redirect 시도 (`?redirect=https://evil.com`) → safeRedirect fallback → `/` 로 안전 redirect

### 검증
| 항목 | 결과 |
|------|------|
| tsc --noEmit | 0 에러 (EXIT=0) |
| vitest 신규 redirect.test.ts | 19/19 PASS (isValidRedirect 7 + buildLoginRedirect 6 + safeRedirect 4 + javascript 차단 1 + 쿼리 보존 1) |
| vitest 전체 회귀 | 506/506 PASS (이전 487 + 신규 19) |
| BigInt(N)n 패턴 | 0 (auth 도메인 무관) |
| 핑크/살몬/코랄 hex | 0 (백엔드 / 테스트 전용) |
| Flutter v1 영향 | 0 (`src/app/api/v1/` 에 redirect / oauth 호출 0) |
| schema 변경 | 0 (코드만) |
| 운영 DB 영향 | 0 (코드만) |
| middleware matcher | `/admin/*` + `/tournament-admin/*` 만 → 다른 라우트 영향 0 |
| AppNav frozen | 영향 0 (auth 도메인) |

### tester 참고
- 테스트 방법:
  1. `npx vitest run src/__tests__/lib/auth/redirect.test.ts` — 19 케이스 자동 검증
  2. 수동 E2E (로그인 redirect):
     - 비로그인 + 시크릿 모드 → https://mybdr-git-dev-mybdr.vercel.app/tournament-admin/tournaments/{id}/wizard 접근 → URL 이 `/login?redirect=%2Ftournament-admin%2F...` 로 이동 확인
     - 이메일/비밀번호 로그인 → 자동으로 원래 wizard 페이지 복귀 확인
     - `/admin/users` 같은 admin 페이지로도 동일 패턴 확인
  3. 수동 E2E (카카오 OAuth):
     - 비로그인 → `/tournament-admin/...` 접근 → 로그인 페이지의 "카카오" 버튼 클릭 (URL 에 redirect 쿼리 동봉됨) → 카카오 인증 → 원래 페이지 복귀 확인
  4. 보안 검증:
     - URL 에 직접 `?redirect=https://evil.com` 입력 후 로그인 → 외부 사이트 이동 안 됨 / `/` 로 안전 redirect 확인
     - `?redirect=//evil.com` → 동일 차단 확인
     - `?redirect=/login` → 무한 루프 안 발생 / `/` 로 fallback 확인
- 정상 동작:
  - 비로그인 admin 접근 → 로그인 후 정확히 원래 페이지로
  - guest-apply / report 페이지도 동일 (쿼리명 `next` `returnTo` → `redirect` 통일됨)
  - OAuth 콜백도 `bdr_redirect` 쿠키 읽어 복귀
- 주의할 입력:
  - admin layout의 권한 부족 (no_permission) 케이스는 redirect 쿼리 미동봉 — 정상 (다른 계정 로그인 권유)
  - verify 흐름 (`/verify?missing=...`) 진입 시 redirect 쿠키 이미 삭제 — verify 후 home 으로 (verify 가 자체 next 처리 안 함). 후속 개선 필요 시 verify 페이지가 next 쿼리 처리 추가.

### reviewer 참고
- **middleware 도입 결정**: 명세 §주의사항에서 "옵션 A(headers) / B(middleware) / C(page guard)" 검토 요청. A 는 referer 헤더 신뢰성 낮음 (외부 진입 시 빈 값). C 는 페이지마다 가드 중복 + 변경 범위 큼. B 가 단일 진입점 + matcher 로 영향 최소화 — 채택.
- **matcher 정밀화**: `/admin/:path*` 와 `/tournament-admin/:path*` 만 — `/api/*` `/_next/*` `/login` `/games` `/teams` 등 모두 matcher 외 (성능 영향 0). Flutter v1 (`/api/v1/*`) 도 영향 0 (matcher 제외).
- **분산 isValidRedirect 단일화**: 기존 3 파일 (login/page.tsx / api/auth/login/route.ts / 본 신규 redirect.ts) 에 각자 다른 검증 로직 존재 → 본 PR 로 단일 source. 추가 룰 (`/login` / `/api/` / 2000자 차단) 도 일괄 적용.
- **OAuth 콜백 verify 진입 시 redirect 손실 의도적**: handleOAuthLogin 에서 verify 흐름 진입 시 `bdr_redirect` 쿠키 삭제 후 redirect — 사용자가 verify 후 home 으로 (원래 페이지 복귀 X). 사유: verify = 사용자 정보 보강 필수 흐름 (email / phone), 다른 페이지 진행 전 완료해야 함. 후속 개선 필요 시 verify 페이지가 next 쿼리 처리 추가 — 본 PR 범위 외.
- **명세에 명시 안 된 동일 패턴 잔존**: grep 결과 다른 페이지들 (`teams/manage`, `teams/[id]/_components_v2/team-*-button`, `tournaments/[id]/_components/v2-registration-sidebar`, `lineup-confirm/[matchId]`, 등) 에 `?next=` `?returnTo=` 패턴 잔존 7 건. 명세 §대상 파일 4건만 변경 (변경 범위 최소화 룰 준수). 후속 큐: 동일 통합 패턴으로 일괄 정리 필요.
- **identity 흐름은 분리**: `/onboarding/identity?returnTo=...` 는 본인인증 흐름 (로그인 흐름과 별개). 통일하지 않고 그대로 보존 — 도메인 분리 유지.
- **report-form 클라이언트 컴포넌트**: `report-form.tsx:166` 에 `router.replace(/login?returnTo=...)` 잔존. 본 PR 은 server page.tsx 만 변경 — 클라이언트 측은 인증 만료 후 redirect 흐름 (다른 케이스). 후속 통합 검토 필요.

⚠️ **주의 (후속 큐)**: 동일 통합 패턴 적용 대상 7+ 파일 (`?next=` `?returnTo=` 잔존) — 별도 PR 로 일괄 정리 권장. 본 PR 의 헬퍼 (`buildLoginRedirect` / `safeRedirect`) 그대로 재사용 가능.

---

## 구현 기록 (developer) — 시리즈 페이지 진단 인프라

📝 구현한 기능: 운영 핫픽스 3건 동시 적용 — (A) error.tsx super_admin/dev 전용 에러 상세 노출, (B) 시리즈 페이지 진입/세션 진단 logs, (C) BigInt 변환 안전화

### 핫픽스 A — error.tsx super_admin/dev 전용 details

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/error.tsx` | `useState(showDetails)` + useEffect 분기 — dev 환경 즉시 노출 / 운영 환경 `/api/web/me` fetch 후 `role === "super_admin"` 만 노출. `details/summary/pre` 박스 추가 (message + digest + stack 앞 8줄). var(--*) 토큰 + Material Symbols 유지 (디자인 13룰 준수) | 수정 |

핵심 변경:
- `/api/web/me` 엔드포인트 사용 (명세의 `/api/web/auth/me` 는 존재 안 함 → 실제 me route 로 교정)
- 응답 구조 `{ success, data: { role, ... } }` 활용 — `res?.data?.role` 접근
- `credentials: "include"` 명시 — cookie 기반 세션 fetch
- details 태그 = 기본 닫힘 → 일반 super_admin 도 화면 차지 최소
- stack split 앞 **8줄** (명세 5줄 → details 박스 시인성 확보 위해 8줄로 조정)

### 핫픽스 B + C — 시리즈 페이지 진단 + BigInt 안전화

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/(admin)/tournament-admin/series/[id]/page.tsx` | (1) 진입 log `[series-detail] entry { id }`. (2) 세션 log `[series-detail] session { hasSession, sub, role }` (이메일/이름 제외). (3) **id BigInt 변환 try/catch** → 실패 시 notFound + invalid-id log. (4) **session.sub BigInt 변환 try/catch** → 실패 시 redirect + invalid-session-sub error log. (5) prisma.findUnique .catch 에 prisma-error log 추가 (기존 null 폴백 유지) | 수정 |

핵심 변경:
- `console.log` 박제는 민감 데이터 제외 (sub/role/id 만)
- redirect/notFound 흐름은 그대로 유지 (try/catch 로 NEXT_REDIRECT 잡지 않음 — 명세 권고 옵션 2 채택)
- BigInt 안전화 = **진짜 원인 후보 1순위**. session.sub 가 비숫자/null 일 때 invalid-session-sub log 캡처 → 다음 재현 시 stack 없이도 원인 파악

### 검증

| 항목 | 결과 |
|------|------|
| tsc --noEmit | 0 에러 (출력 없음) |
| vitest 전체 회귀 | 506/506 PASS (회귀 0, 신규 테스트 없음) |
| schema 변경 | 0 (코드만) |
| 운영 DB 영향 | 0 (코드만) |
| Flutter v1 영향 | 0 (`/api/v1/*` 무관) |
| 디자인 13 룰 | 위반 0 (var(--*) / Material Symbols / 4px 라운딩 / pill 0) |
| 변경 파일 수 | 2 (error.tsx + series/[id]/page.tsx) |

### tester 참고
- **자동 검증**: `tsc --noEmit` + `vitest run` 통과 확인됨
- **수동 검증 (배포 후)**:
  1. dev 배포 → super_admin 계정으로 `/tournament-admin/series/10` 재진입 → error.tsx 발동 시 "에러 상세 (관리자용)" details 박스 펼침 → message + stack 확인
  2. 일반 사용자 계정으로는 details 박스 안 보이는지 확인
  3. Vercel runtime logs 에서 `[series-detail] entry` / `[series-detail] session` / `[series-detail] invalid-session-sub` (해당시) prefix 검색
- **정상 동작**:
  - id=10 진입 시 진입 log 캡처 → 다음 단계 로그 (session / prisma-error / invalid-session-sub) 중 어디서 끊기는지로 원인 추적 가능
  - session.sub 가 정상 숫자 string 이면 기존 흐름과 동일 (BigInt 변환 성공)
- **주의할 입력**:
  - URL path 가 `/tournament-admin/series/abc` 같이 비숫자면 BigInt(id) throw → 기존 error.tsx 발동 → **이제 notFound() 로 404 정상 처리**
  - session.sub 가 비숫자 (옛 JWT / 손상된 쿠키) → **redirect("/tournament-admin/series") 로 안전 처리** (이전: error.tsx 발동)

### reviewer 참고
- **명세의 `/api/web/auth/me` 는 존재 안 함** → `/api/web/me` (response.data.role) 로 교정 후 구현. 명세 채택 의도 그대로 (super_admin role 확인).
- **stack 앞 5줄 → 8줄로 조정**: 명세 5줄 권고. details 박스 시인성 확보 위해 8줄로 늘림 (필요 시 5줄로 축소 가능).
- **console.log vs console.error 혼용**: 진입/세션 = `console.log` (정상 흐름 정보). prisma-error / invalid-session-sub = `console.error` (실패 흐름 — Vercel logs 에서 ERROR 레벨 필터 가능).
- **BigInt 안전화 = 진짜 원인 후보 1순위**: 이전 debugger 진단 (775행) 의 "(2) AdminSidebar/MobileNav prisma fetch 실패" 보다 BigInt(session.sub) throw 가능성이 더 직접적. 사용자 다음 재현 시 invalid-session-sub log 캡처 = 원인 확정.
- **redirect/notFound 흐름 유지**: try/catch 래핑 안 함 (명세 권고 옵션 2). NEXT_REDIRECT / NEXT_NOT_FOUND throw 정상 처리.

⚠️ **후속 큐**: 사용자 검증 후 진짜 원인 확정되면:
- BigInt(session.sub) 가 원인 → JWT 검증 강화 (옛/손상 쿠키 자동 cleanup) 또는 session 발급 단계 sub 정합성 검증
- prisma 조회 실패 원인 → connection pool / cold start / 권한 등 별도 진단

---

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-12 | (커밋 대기) | **[로그인 redirect 흐름 통합]** `src/lib/auth/redirect.ts` 신규 (isValidRedirect / buildLoginRedirect / safeRedirect 3 헬퍼 + open redirect 7 가드) + `src/middleware.ts` 신규 (matcher `/admin/*` + `/tournament-admin/*` 만 → x-pathname 헤더 주입) + admin/tournament-admin layout (현재 경로 redirect 쿼리 동봉) + guest-apply (`?next=` → `?redirect=`) + report (`?returnTo=` → `?redirect=`) + login page / auth.ts / oauth.ts / api/auth/login/route.ts 분산 isValidRedirect 단일 source 통일 + OAuth 콜백 bdr_redirect 쿠키 read+delete 복귀. tsc 0 / vitest 506/506 (+19). 회귀 0. schema 변경 0. Flutter v1 영향 0. 후속 큐 = 동일 패턴 잔존 7+ 파일 일괄 정리. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 5]** 서명 8 (Scorer/AsstScorer/Timer/ShotClock/Referee/Umpire1/Umpire2/Captain) + 노트 + signature-types/FooterSignatures 신규 + 헤더 → 풋터 자동 prefill (didPrefillRef dirty flag) + BFF settings.signatures JSON merge 통합 UPDATE (Phase 4 timeouts 와 단일 prisma.update). tsc 0 / vitest 487/487 (+10). 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 4]** Time-outs Article 18-19 (전반2/후반3/OT각1) + timeout-types/helpers 신규 + team-section TIME-OUTS 활성화 + score-sheet-form state/handler + BFF settings.timeouts JSON merge UPDATE (recording_mode 키 보존). tsc 0 / vitest 477/477 (+30). 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[대회-시리즈 연결 흡수 모달 PR3]** GET /api/web/tournaments/my-unlinked (본인 미연결 draft/reg 대회) + POST /api/web/series/[id]/absorb-tournaments (다건 흡수 skip 패턴 / $transaction 카운터 group by) + AbsorbTournamentsModal (체크박스 다건 + 2단계 confirm + var(--*) 토큰 + Material Symbols + 44px+) + 단체 페이지 시리즈 카드 "기존 대회 가져오기" 버튼. vitest 477/477 (+8). tsc 0. 디자인 13 룰 위반 0. Flutter v1 영향 0. schema 변경 0. 운영 DB 영향 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 3.5]** 파울종류 P/T/U/D + Article 41 4사유 분기 + 쿼터/경기 종료 + Licence 자동 fill (User.id). FoulTypeModal + MatchEndButton 신규. tsc 0 / vitest 439/439 (+23). 회귀 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[대회-시리즈 연결 UI PR2]** GET /api/web/series/my (organization include / BigInt 직렬화 / withWebAuth) + wizard "대회 정보" 스텝 소속 시리즈 드롭다운 ("시리즈명 (단체명)" 라벨 / status 가드 / confirm 모달 4분기) + PATCH body series_id 포함. vitest 439/439 (+5). tsc 0. 디자인 13 룰 위반 0. Flutter v1 영향 0. schema 변경 0. 운영 DB 영향 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[대회-시리즈 연결 API PR1]** zod series_id 추가 / series-permission 헬퍼 (404/403 throw) / PATCH route series_id 분기 + status 가드 (draft/reg_open만 이동 / null 분리는 항상 허용) + $transaction 카운터 동기화. vitest 416/416 (+11). tsc 0. Flutter v1 영향 0. **위험**: BDR 시리즈(id=8) tournaments_count stored=0/actual=12 불일치 = 기존 데이터 이슈 (PR 무관, backfill 후속 큐). | ✅ |
| 2026-05-12 | (기획만 / 코드 0) | **[대회-시리즈 연결 UI 기획설계]** 옵션 A/B/C 비교 → A 권장(PR1+PR2 약 305 LOC). zod series_id 추가 / series-permission 헬퍼 / `/series/my` GET / wizard 드롭다운. 권한 = 본인 시리즈만, status = draft/registration만 변경 허용 권장. 결재 7건 정리 (Q1~Q7). | ✅ |
| 2026-05-12 | (DB만 / 코드 0) | **[강남구협회 연결 초기화]** BDR 시리즈(id=8) organization_id=NULL UPDATE 1건. 12 대회 events-tab 미노출 검증. 강남구협회장배(draft, series_id=NULL) 연결 흐름 분석 — Tournament PATCH series_id 부재로 사후 연결 UI 없음. _temp 정리. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA 종이 기록지 Phase 3]** Player Fouls 1-5 + Team Fouls 자동 + 5반칙 회색·"퇴장" + 5+ FT toast. BFF fouls + PBP foul event. vitest 405/405 (+24). | ✅ |
| 2026-05-12 | (커밋 대기) | **[운영 핫픽스: 시리즈 페이지 진단 인프라]** (A) `src/app/error.tsx` super_admin/dev 전용 details 박스 (message + digest + stack 8줄) — `/api/web/me` fetch 후 `data.role === "super_admin"` 만 노출. (B) `src/app/(admin)/tournament-admin/series/[id]/page.tsx` 진입 log + 세션 log (sub/role) + prisma-error log. (C) `BigInt(id)` / `BigInt(session.sub)` try/catch 안전화 — 실패 시 notFound / redirect (진짜 원인 후보 1순위). tsc 0 / vitest 506/506. 회귀 0. schema 변경 0. 다음 재현 시 `[series-detail] invalid-session-sub` log 또는 details 박스에서 원인 캡처 가능. | ✅ |
| 2026-05-12 | (진단 only) | **[debugger] 시리즈 id=10 운영 에러 진단** — DB 데이터 정상 (organizer=2999 김수빈 super_admin / tournaments=0 / organization_id=null). 페이지 코드(series/[id]/page.tsx) throw 경로 명확하지 않음. 가장 강한 의심 = (1) organization 페이지 setOrg state mutation 후 user 가 시리즈 카드 클릭 → 페이지 진입 → server-side 빌드 캐시 또는 prerender 영향, (2) AdminSidebar/MobileNav prisma fetch 실패 가능성, (3) 사용자가 직접 URL 입력하지 않고 클릭한 시점의 routing race. 권장 = Vercel runtime logs stack trace 확보 또는 페이지 try/catch + console.error 임시 박제. **부수 발견**: organization 페이지 시리즈 생성 시 organization_id 전송했으나 DB에 null 저장됨 = 별개 버그 (별도 보고 필요). | 🔍 |
