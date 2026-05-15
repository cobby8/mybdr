# Phase A.7 — 운영 → 시안 역동기화 의뢰서

> **목적**: 운영 `src/app/(score-sheet)/` 에 박제된 모달 4종 + period-color-legend + rotation-guard 시각을 시안 `BDR-current/` 에 역박제 (운영 → 시안 동기화).
> **의뢰 일자**: 2026-05-15
> **베이스**: BDR-current/ v2.5 rev2 + 운영 Phase 19 완료 (PR-S1~S10 commit `185e1d2` / Phase 23 PR4·PR6 commit `29ac1dd`)
> **사유**: BDR-current/ 에 운영 score-sheet 모달 5종 + rotation-guard 시각이 부재 — 차후 디자인 fine-tune 시 stale baseline 위에서 작업할 위험 (`CLAUDE.md` §🔄 운영 → 시안 동기화 룰).
> **수신자**: Claude.ai Project (BDR 시안 작업용)
> **작성자**: doc-writer (mybdr / Phase A.7)

---

## 1. 컨텍스트

### 1-1. 운영 → 시안 동기화 룰 (CLAUDE.md §🔄)

> **룰**: 운영 src/ UI 변경 = BDR-current/ 같이 갱신 (역방향 박제). 갭 발생 시 클로드 디자인이 stale baseline 위에서 작업하게 됨.
>
> **트리거**:
> 1. 시각 패턴 변경 — 새 카드 / 모달 / 컴포넌트 / 뱃지 / 레이아웃 / 색상 룰
> 2. AppNav / Drawer 변경 — frozen 룰 영향
> 3. 공유 컴포넌트 추가 — NavBadge / PasswordInput / ForceActionModal 같은 표준 컴포넌트
> 4. 사용자 직접 UI 수정 commit — `fix(ui)` / `feat(ui)` 류
> 5. 사용자 결정 §1~§8 재확인 또는 갱신

### 1-2. 갭 분석 (시안 vs 운영)

운영 `src/app/(score-sheet)/score-sheet/[matchId]/` 는 Phase 1 ~ Phase 19 + Phase 23 PR4·PR6 까지 완료. 시안 `BDR-current/screens/ScoreSheet*` 에는 다음 시각 박제 누락:

| 컴포넌트 | 운영 위치 | 운영 Phase | 시안 상태 | 박제 의뢰 |
|---|---|---|---|---|
| **FoulTypeModal** | `score-sheet/[matchId]/_components/foul-type-modal.tsx` | Phase 3.5 (2026-05-12) | ❌ 미박제 | ✅ §2-1 |
| **PlayerSelectModal** | `score-sheet/[matchId]/_components/player-select-modal.tsx` | Phase 2 (2026-05-12) | ❌ 미박제 | ✅ §2-2 |
| **LineupSelectionModal** | `score-sheet/[matchId]/_components/lineup-selection-modal.tsx` | Phase 7-B + 7.1 (2026-05-12) | ❌ 미박제 | ✅ §2-3 |
| **QuarterEndModal** | `score-sheet/[matchId]/_components/quarter-end-modal.tsx` | Phase 7-C (2026-05-12) | ❌ 미박제 | ✅ §2-4 |
| **PeriodColorLegend** (카드) | `score-sheet/[matchId]/_components/period-color-legend.tsx` | Phase 17 + 18 (2026-05-13) | ❌ 미박제 | ✅ §2-5 |
| **RotationGuard** | `(score-sheet)/_components/rotation-guard.tsx` | Phase 1 (2026-05-11) | ❌ 미박제 | ✅ §2-6 |

### 1-3. 박제 산출 위치 (시안)

- 활성 폴더: `BDR-current/`
- 신규 파일 제안: `BDR-current/screens/ScoreSheet.modals.jsx` (4 모달 통합) + `BDR-current/screens/ScoreSheet.legend.jsx` (Legend) + `BDR-current/screens/ScoreSheet.rotation-guard.jsx`
- 기존 score-sheet 시안 파일 `BDR-current/screens/ScoreSheet.jsx` 또는 `ScoreSheet.parts.jsx` 에 통합도 무방 (Claude.ai 가 시안 구조에 맞게 결정)

---

## 2. 박제 대상 6종

### 2-1. FoulTypeModal — 파울 종류 선택 (Personal/Technical/Unsportsmanlike/Disqualifying)

#### 운영 정보

- **운영 경로**: `src/app/(score-sheet)/score-sheet/[matchId]/_components/foul-type-modal.tsx`
- **운영 Phase**: Phase 3.5 (2026-05-12, FIBA Article 36-39 정합)
- **사유**: 파울 빈 칸 클릭 시 4 종류 (P/T/U/D) 분기 선택 — Article 41 5반칙 룰 정확 적용

#### Props

```ts
interface FoulTypeModalProps {
  open: boolean;
  playerName: string;       // 선수명 (헤더 표시)
  jerseyNumber: number | null; // 등번호 (#5 형식)
  period: number;           // 현재 Period (1~7)
  onSelect: (type: "P" | "T" | "U" | "D") => void;
  onCancel: () => void;     // ESC / 외부 클릭 / 취소 버튼
}
```

#### 시각 spec

- **오버레이**: `fixed inset-0` / `z-50` / `flex items-center justify-center px-4` / `background-color: color-mix(in srgb, #000 60%, transparent)` (≈ rgba(0,0,0,0.6))
- **본체 (dialog)**:
  - `max-w-sm` (~ 384px) / `rounded-[4px]` / `p-4`
  - `backgroundColor: var(--color-background)` / `border: 1px solid var(--color-border)`
- **헤더 (제목 + 컨텍스트)**:
  - 작은 eyebrow: "파울 종류 선택" — `text-sm font-semibold uppercase tracking-wider` / `color: var(--color-text-muted)`
  - 큰 컨텍스트: `#5 김민수 · Period 2` 형식 — `text-base font-semibold`
- **4 옵션 버튼 (2×2 grid)**:
  - `grid grid-cols-2 gap-2`
  - 각 버튼: `min-h-[64px] flex flex-col items-center justify-center rounded-[4px]` (터치 영역 60px+ 필수 — 사용자 결재 §2)
  - 종류별 색상 매핑:
    | 종류 | 라벨 | 배경 | 글자 | 설명 |
    |---|---|---|---|---|
    | **P** | Personal | `var(--color-elevated)` | `var(--color-text-primary)` | 신체 접촉 (가장 흔함) |
    | **T** | Technical | `color-mix(in srgb, var(--color-warning) 20%, transparent)` | `var(--color-warning)` | 비스포츠 행위 |
    | **U** | Unsportsmanlike | `color-mix(in srgb, var(--color-accent) 25%, transparent)` | `var(--color-accent)` | 고의 거친 행동 |
    | **D** | Disqualifying | `var(--color-primary)` (BDR Red 배경) | `#fff` | 즉시 퇴장 |
  - 버튼 내용 (3행): 큰 글자 종류 코드 (`text-xl font-bold` "P") / 중간 라벨 (`text-[10px]` "Personal") / 작은 설명 (`text-[9px] opacity-80` "신체 접촉")
- **취소 버튼** (우하단): `rounded-[4px] px-3 py-2 text-xs` / border + muted 글자

#### 동작

- ESC 키 = onCancel
- 백드롭(외부) 클릭 = onCancel
- 본체 클릭 전파 차단 (`onClick={(e) => e.stopPropagation()}`)
- 종류 버튼 클릭 → `onSelect("P"|"T"|"U"|"D")` + 모달 자동 닫힘 (caller 책임)

#### 절대 룰 — 박제 시 준수

- `no-print` 클래스 필수 (인쇄 시 모달 제거 — FIBA 양식 정합)
- `var(--*)` 토큰만 / lucide-react ❌ / Material Symbols Outlined 만 (D 버튼은 빨강 본문 텍스트 금지 룰의 **예외** — 위험 액션 강조 허용)
- 정사각형 (W=H) 원형은 `border-radius: 50%` (9999px 회피 룰 — 사용자 결재 §A·10)
- 터치 영역 60px+ (룰 13 의 44px 초과 충족)

---

### 2-2. PlayerSelectModal — 득점 선수 선택 (1/2/3점 추론)

#### 운영 정보

- **운영 경로**: `src/app/(score-sheet)/score-sheet/[matchId]/_components/player-select-modal.tsx`
- **운영 Phase**: Phase 2 (2026-05-12)
- **사유**: FIBA 양식 Running Score 칸 ~48×22px → 터치 룰 44px+ 위반 → 풀스크린 모달 60px+ 큰 버튼 전환

#### Props

```ts
interface PlayerSelectModalProps {
  open: boolean;
  team: "home" | "away";
  teamName: string;
  players: RosterItem[];   // 12명 명단 (필터 X)
  inferredPoints: 1 | 2 | 3 | null;  // 마지막 마킹 차이로 추론
  newPosition: number | null;        // 클릭된 칸 번호 1~160
  onSelect: (playerId: string) => void;
  onClose: () => void;
}
```

`RosterItem` 핵심 필드: `tournamentTeamPlayerId` / `jerseyNumber` / `displayName` / `isStarter`

#### 시각 spec

- **오버레이**: `fixed inset-0 z-50 flex items-stretch justify-stretch` / `backgroundColor: rgba(0,0,0,0.55)`
- **본체**:
  - `m-auto flex max-h-[92vh] w-[min(540px,94vw)] flex-col rounded-[8px] shadow-2xl`
  - `backgroundColor: var(--color-bg)` / `border: 1px solid var(--color-border)`
- **헤더 (제목 + 닫기)**:
  - `rounded-t-[8px] px-4 py-3` / `backgroundColor: var(--color-surface)` / `border-bottom: 1px solid var(--color-border)`
  - 좌측 (점수 컨텍스트):
    - 작은 eyebrow: `TEAM A — {팀명}` (uppercase tracking-wider muted)
    - 큰 라벨: 점수 종류 칩 (`backgroundColor: var(--color-accent)` 흰 글자 `rounded-[4px] px-2 py-0.5`) + `칸 #{n}` 우측
    - 점수 라벨 텍스트: `"1점 (자유투)"` / `"2점 (필드골)"` / `"3점 (3점슛)"` / `"점수"` (null)
  - 우측 닫기 버튼: `h-11 min-w-11 rounded-[4px]` + Material Symbols `close` + " 취소" 텍스트
- **본문 (선수 그리드)**:
  - `flex-1 overflow-y-auto p-3`
  - 빈 명단 시: `flex h-32 items-center justify-center text-sm` "선수 명단이 비어있습니다."
  - 그리드: `grid grid-cols-2 gap-2 sm:grid-cols-3` (모바일 2열 / sm+ 3열)
  - 각 선수 버튼:
    - `min-h-[60px] flex flex-col items-center justify-center gap-0.5 rounded-[4px]`
    - `border: 1px solid var(--color-border)` / `backgroundColor: var(--color-surface)`
    - 등번호 큰 글자: `text-2xl font-bold` / `color: var(--color-accent)` (BDR Red)
    - 선수명: `line-clamp-1 text-xs leading-tight`
    - 주전 표시 (`isStarter`): `text-[10px] muted` "◉ 주전"
- **푸터 안내**:
  - `rounded-b-[8px] px-4 py-2 text-[11px]`
  - `backgroundColor: var(--color-surface)` / `border-top: 1px solid var(--color-border)` / muted 글자
  - 텍스트: "※ FIBA 양식 — 칸 위치 차이로 1/2/3점 자동 추론. 잘못 선택했다면 모달 닫고 마지막 마킹 칸을 다시 탭하면 해제됩니다."

#### 동작

- ESC = onClose / 외부 클릭 = onClose / 닫기 버튼 = onClose
- 선수 버튼 클릭 → `onSelect(playerId)` (모달 닫힘은 caller 책임)

#### 절대 룰

- `no-print` 클래스 필수
- 등번호 강조 = `var(--color-accent)` (예외 허용 — 강조용)
- 터치 영역 60px (룰 13)

---

### 2-3. LineupSelectionModal — 출전 명단 + 선발 5인 선택

#### 운영 정보

- **운영 경로**: `src/app/(score-sheet)/score-sheet/[matchId]/_components/lineup-selection-modal.tsx`
- **운영 Phase**: Phase 7-B + 7.1 (2026-05-12, FIBA Article 4.2.2 / MatchLineupConfirmed)
- **사유**: 12 행 자동 fill 운영 사고 (오늘 출전 X 선수 포함) 방지 — 진입 시 다중 체크 강제

#### Props

```ts
interface LineupSelectionModalProps {
  open: boolean;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: RosterItem[];
  awayPlayers: RosterItem[];
  initialHome?: TeamLineupSelection;  // 사전 라인업 prefill
  initialAway?: TeamLineupSelection;
  onConfirm: (result: LineupSelectionResult) => void;
  onCancel?: () => void;
  onToast?: (message: string, type?: "success"|"error"|"info") => void;
}

interface TeamLineupSelection {
  starters: string[];      // 선발 5인 (id string)
  substitutes: string[];   // 후보 (출전 - 선발)
}
interface LineupSelectionResult { home: TeamLineupSelection; away: TeamLineupSelection; }

const MAX_ROSTER_PER_TEAM = 12;  // FIBA Article 4.2.2
```

#### 시각 spec

- **오버레이**: `no-print fixed inset-0 z-50 flex items-center justify-center px-2 py-4` / `backgroundColor: color-mix(in srgb, #000 60%, transparent)`
- **본체**:
  - `max-h-full w-full max-w-3xl overflow-auto p-4`
  - `backgroundColor: var(--color-background)` / `border: 1px solid var(--color-border)`
- **헤더**:
  - 제목: `text-base font-bold` "오늘 출전 명단 선택"
  - 설명: `mt-1 text-xs muted` "오늘 출전할 선수를 양 팀 각각 체크하고, 선발 5인을 선택해주세요. 출전 미체크 선수는 양식에 표시되지 않습니다."
- **양 팀 패널 (2 컬럼)**:
  - `mt-3 grid grid-cols-1 gap-3 md:grid-cols-2` (모바일 1열 stack / md+ 2 컬럼)
  - 각 패널 `<section className="p-3" border: 1px solid var(--color-border)`
  - 패널 헤더: `Team A` (uppercase tracking-wider) + 팀명 우측 정렬 굵게
  - **전체 선택 / 전체 해제 버튼** (`flex gap-2`):
    - 전체 선택: `flex flex-1 items-center justify-center gap-1 py-1 text-[11px]` + border + `var(--color-accent)` 글자 + Material `select_all` 아이콘 + `min-height: 32`
    - 전체 해제: 동일 폼 + muted 글자 + Material `deselect` 아이콘
  - **상태 안내** (`flex justify-between text-[11px]`):
    - 출전 카운트: `출전 5/12명 ✓` (조건 충족 = `var(--color-success)` / 미충족 = `var(--color-warning)`)
    - 선발 카운트: `선발 5/5명 ✓`
  - **선수 목록** (`flex flex-col gap-1`):
    - 각 행: `flex items-center justify-between gap-2 px-1 py-1 border-bottom: 1px solid var(--color-border)`
    - 선발 행 배경 강조 (사용자 결재 §4): `backgroundColor: color-mix(in srgb, var(--color-accent) 12%, transparent)`
    - 좌측 (출전 체크 + 정보):
      - 체크박스 `h-5 w-5` (`min-height: 36` 터치 영역)
      - 등번호 `text-xs font-mono` muted `min-width: 24` "#5"
      - 이름 `text-sm` (선발이면 `font-bold`)
      - 사전 등록 선발 표시: `text-[10px]` accent "(사전 ◉)"
    - 우측 "S" 토글 버튼:
      - `h-9 w-9 flex items-center justify-center text-xs font-bold`
      - 선발 상태: `backgroundColor: var(--color-accent)` 흰 글자
      - 미선발: 투명 배경 muted 글자
      - 비활성: opacity 30 / cursor-default
- **버튼 영역** (`mt-4 flex gap-2`):
  - 취소 (조건부): `flex-1 py-2 text-sm` border + primary 글자
  - 라인업 확정: `flex-1 py-2 text-sm font-semibold` / `backgroundColor: var(--color-accent)` 흰 글자 / 비활성 시 opacity 40

#### 동작

- 출전 체크 토글: 13번째 추가 시도 차단 + onToast 경고
- 출전 해제 시 선발에서도 자동 제거 (불일치 방지)
- 선발 5명 차면 미선발 선수 "S" 비활성
- 라인업 확정 조건: 양 팀 각각 (출전 5~12명 + 선발 = 5명)

#### 절대 룰

- `no-print` 필수 / `var(--*)` 토큰만 / 빨강 본문 텍스트 ❌
- FIBA Article 4.2.2 = 팀 명단 최대 12명 (UI 강제)
- 터치 영역 36~44px (체크박스 + S 버튼)

---

### 2-4. QuarterEndModal — Q4 / OT 종료 분기 (경기 종료 vs 다음 진행)

#### 운영 정보

- **운영 경로**: `src/app/(score-sheet)/score-sheet/[matchId]/_components/quarter-end-modal.tsx`
- **운영 Phase**: Phase 7-C (2026-05-12)
- **사유**: Q4 종료 시 자동 OT1 진입 = 운영 사고 (대부분 매치 OT 없음). 동점일 때 FIBA 룰 OT 강제

#### Props

```ts
interface QuarterEndModalProps {
  open: boolean;
  mode: "quarter4" | "overtime";
  currentPeriod: number;   // 4=Q4 / 5=OT1 / 6=OT2 / 7=OT3
  homeTeamName: string;
  awayTeamName: string;
  homeTotal: number;
  awayTotal: number;
  onEndMatch: () => void;             // 경기 종료 → status=completed 발행
  onContinueToOvertime: () => void;   // OT 진입 / 다음 OT
  onCancel?: () => void;
}
```

#### 시각 spec

- **오버레이**: `no-print fixed inset-0 z-50 flex items-center justify-center px-4` / `backgroundColor: color-mix(in srgb, #000 60%, transparent)`
- **본체**: `w-full max-w-md p-4` / `backgroundColor: var(--color-background)` / `border: 1px solid var(--color-border)`
- **제목**: `text-base font-bold` — "Q4 종료" 또는 "OT1 종료" / "OT2 종료" / "OT3 종료" (자동 산출)
- **점수 요약 카드** (`mt-3 p-3`):
  - `backgroundColor: var(--color-surface)` / `border: 1px solid var(--color-border)`
  - `flex items-center justify-between gap-2`
  - 양 팀 좌우 (각 `flex-1 text-center`):
    - 팀명 `line-clamp-1 text-xs muted`
    - 점수 `font-mono text-2xl font-bold` primary 글자
  - 가운데 ":" `text-base font-semibold muted`
- **동점 안내** (조건부, 동점 시만):
  - `mt-3 px-3 py-2 text-xs`
  - `backgroundColor: color-mix(in srgb, var(--color-warning) 15%, transparent)`
  - `color: var(--color-warning)` / `border: 1px solid var(--color-warning)`
  - Material `warning` 아이콘 + "동점입니다. FIBA 룰에 따라 연장전(OT) 진행이 필요합니다."
- **안내 텍스트** (`mt-3 text-sm muted`):
  - 동점: "OT1 진행 후 다시 종료 여부를 판단할 수 있습니다."
  - 비동점: "경기를 종료하거나 OT1 으로 진행할 수 있습니다."
- **2 버튼 영역** (`mt-4 flex flex-col gap-2 sm:flex-row` — 모바일 stack / sm+ 가로):
  - **경기 종료** (좌):
    - `flex-1 py-3 text-sm font-semibold`
    - 활성 = `backgroundColor: var(--color-primary)` (BDR Red 배경) 흰 글자 (위험 액션 예외)
    - 비활성 (동점) = `backgroundColor: var(--color-surface)` muted 글자 opacity 30
    - Material `flag` 아이콘 + "경기 종료"
  - **다음 진행** (우):
    - `flex-1 py-3 text-sm font-semibold`
    - `backgroundColor: var(--color-accent)` 흰 글자
    - 비활성 (OT3 종료) = opacity 30
    - Material `skip_next` 아이콘 + "OT1 진행" (또는 "OT3 종료")
- **취소 (조건부)**: `mt-2 w-full py-2 text-xs muted` "나중에 결정 (모달 닫기)"

#### 동작

- 동점 (homeTotal === awayTotal) → "경기 종료" disabled (FIBA OT 강제)
- OT3 (period=7) 종료 시 → "다음 진행" disabled
- ESC = onCancel (조건부)

#### 절대 룰

- `no-print` 필수
- BDR Red 배경 (`--color-primary`) — 위험 액션 예외 허용
- 터치 영역 44px+ (`py-3` = 약 48px)

---

### 2-5. PeriodColorLegend — 쿼터 색상 + 점수 표기 안내 (카드 — 모달 아님)

#### 운영 정보

- **운영 경로**: `src/app/(score-sheet)/score-sheet/[matchId]/_components/period-color-legend.tsx`
- **운영 Phase**: Phase 17 + 18 (2026-05-13)
- **사유**: Phase 17 = Running Score / Player Fouls / Team Fouls / Time-outs 마킹 색을 쿼터별 분기 → 운영자/관객이 색의 의미 인지. Phase 18 = FIBA 표준 1/2/3점 시각 표기 (· / ● / ●+○) 안내 추가
- **참조 데이터**: `@/lib/score-sheet/period-color.ts` → `PERIOD_LEGEND` (배열, 각 항목 `{ label: string, color: string }`)

#### Props

없음 (static). `PERIOD_LEGEND` 가져와서 렌더.

`PERIOD_LEGEND` 예시 구조 (시안 박제 시 동일 패턴 — color 값은 운영 토큰 매칭 권장):
- `{ label: "Q1", color: "var(--color-period-q1)" }` (또는 매핑된 토큰)
- `{ label: "Q2", color: "var(--color-period-q2)" }`
- Q3, Q4, OT1, OT2, OT3 등

(시안 박제 시 PERIOD_LEGEND 동등 mock 객체로 충분 — 실제 색 토큰은 02-design-system-tokens.md 매핑 권장)

#### 시각 spec

- **위치**: score-sheet frame **외부** (인쇄 영역 밖), MatchEndButton / 라인업 다시 선택 버튼 인근
- **컨테이너**:
  - `no-print mx-auto mt-3 flex w-full max-w-[820px] flex-col gap-y-1.5 px-2 py-1.5 text-xs`
  - `backgroundColor: var(--color-surface)` / `border: 1px solid var(--color-border)`
  - `aria-label="쿼터 색상 + 점수 표기 안내"`
- **(1) 쿼터 색상 안내 (상단)**:
  - `flex flex-wrap items-center justify-center gap-x-3 gap-y-1`
  - 좌측 라벨: "색상 안내" `shrink-0 font-semibold` muted
  - 각 쿼터:
    - `inline-flex items-center gap-1`
    - 색 원: `inline-block h-2.5 w-2.5` / `backgroundColor: {p.color}` / `border-radius: 50%` (정사각 9999px 회피 룰)
    - 라벨: `text-[11px] font-semibold` / `color: {p.color}` ("Q1", "Q2", ...)
- **(2) 점수 표기 안내 (하단)**:
  - `flex flex-wrap items-center justify-center gap-x-3 gap-y-1`
  - 구분선: `border-top: 1px solid var(--color-border)` / `padding-top: 4px`
  - 좌측 라벨: "점수 표기" `shrink-0 font-semibold` muted
  - **1점**: `· (점)` 작게 `font-size: 14px` + "= 1점 (자유투)"
  - **2점**: `●` `font-size: 10px` + "= 2점"
  - **3점**: `●` 외곽 원 (`border: 1px solid var(--color-text-primary)` / `border-radius: 50%` / `h-3 w-3`) 안에 작은 `●` (`font-size: 8px`) + "= 3점"
  - 각 라벨 `text-[11px] font-semibold` primary 글자

#### 동작

- 정적 — 상호작용 없음
- 인쇄 제외 (`no-print` → `_print.css` 가 `display:none`)

#### 절대 룰

- `no-print` 필수
- 정사각형 (W=H) 원형은 `border-radius: 50%` (9999px 회피 룰 — 사용자 결재 §A·10)
- `var(--*)` 토큰만 / lucide-react ❌
- Phase 17 색상 = `period-color.ts` 단일 source (시안에서는 동등 mock 가능)

---

### 2-6. RotationGuard — 모바일/태블릿 가로 회전 안내

#### 운영 정보

- **운영 경로**: `src/app/(score-sheet)/_components/rotation-guard.tsx`
- **운영 Phase**: Phase 1 (2026-05-11)
- **사유**: FIBA 종이 기록지 = A4 세로 (1:1.414). 태블릿 가로 모드 진입 시 양식 가독성 파괴 + 칸 비율 깨짐

#### Props

```ts
interface RotationGuardProps {
  children: React.ReactNode;  // wrapper — 가로 X 일 때 정상 렌더
}
```

#### 시각 spec

- **차단 화면** (가로 + touch 디바이스 시만):
  - `fixed inset-0 z-50 flex flex-col items-center justify-center px-6`
  - `backgroundColor: var(--color-background)`
  - **회전 아이콘**: Material Symbols `screen_rotation` / `font-size: 96px` / `color: var(--color-text-primary)`
  - **제목** (`mt-6 text-center text-xl font-bold` primary): "종이 기록지는 세로 모드에서 사용해주세요"
  - **설명** (`mt-2 text-center text-sm muted`): "기기를 세로로 회전하세요."
- **정상 모드**: `<>{children}</>` 그대로 렌더

#### 동작

- `window.matchMedia("(orientation: landscape)")` + `("(hover: none) and (pointer: coarse)")` 둘 다 true 일 때만 차단
- PC 가로 모드 = 통과 (touch 디바이스만 차단)
- SSR 안전 (mounted state — 깜빡임 회피)

#### 절대 룰

- Material Symbols Outlined `screen_rotation` (lucide-react ❌)
- `var(--*)` 토큰만
- 빨강 본문 텍스트 ❌

#### 박제 우선순위

**선택**: 시안은 PC 위주 표시이므로 RotationGuard 박제는 **2-1 ~ 2-5 다음 후순위** 가능. Claude.ai 가 시안 표현 범위에 따라 결정.

---

## 3. 13 룰 + 사용자 결정 §1~§8 준수

### 3-1. 13 룰 (CLAUDE.md §🎨 / 00-master-guide.md)

박제 시 다음 항목 자동 준수:

- **룰 10**: `var(--*)` 토큰만 / 핑크·살몬·코랄 ❌ / lucide-react ❌ / pill 9999px ❌ (단 정사각형 W=H 원형 = `border-radius: 50%` 허용 — Legend 색 원 / 3점 외곽 원 적용 ✅)
- **룰 11**: 시안 우선 카피 보존 (운영 문구 그대로 — "오늘 출전 명단 선택" / "FIBA 룰에 따라" / "종이 기록지는 세로 모드에서 사용해주세요" 등 박제 그대로)
- **룰 12**: placeholder 5단어 이내 (예: "기기를 세로로 회전하세요." ✅)
- **룰 13**: 720px 분기 / iOS input 16px / 버튼 44px (PlayerSelect 60px+ / FoulType 64px+ / LineupSelection S 버튼 36px / QuarterEnd 48px+)

**위반 자동 reject 케이스**:
- 빨강 본문 텍스트 (D 파울 버튼 / 경기 종료 버튼 BDR Red **배경** 은 예외 허용 — 위험 액션 강조)
- lucide-react import / 9999px pill / 하드코딩 hex

### 3-2. AppNav frozen — 본 박제 영역 무관

score-sheet 페이지는 자체 셸 (AppNav 미사용 — RotationGuard wrapper 만). AppNav 03 frozen 룰 본 의뢰에 적용 X (단 시안 폴더 내 다른 페이지 영향 없도록 주의).

### 3-3. 사용자 결정 §1~§8 (`01-user-design-decisions.md`)

- **§6-1 글로벌 카피 시안 우선** — 운영 문구 ("Personal" / "Technical" / "선발 5인" / "라인업 확정" 등) 시안 박제 그대로
- **§A·10 / 02-design-system-tokens.md §4-1** — 정사각형 (W=H) 원형 50% 허용 룰 적용 (Legend 색 원 / 3점 외곽 원)
- **§4 선발 행 강조** — LineupSelection 선발 행 배경 강조 + 글자 굵게 박제 그대로

---

## 4. Claude.ai Project 작업 본문 (의뢰 영역)

### 4-1. 의뢰 본문 (Claude.ai 입력용)

```
# BDR 시안 의뢰 — Phase A.7 운영 → 시안 역동기화 (score-sheet 모달 5 + RotationGuard)

## 1. 컨텍스트
- 의뢰 대상: BDR-current/screens/ScoreSheet.* (신규 또는 기존 파일 확장)
- 우선순위: P1 (운영 stale baseline 위험 회피)
- 박제 등급 변화: 현재 score-sheet 모달 시각 부재 → 운영 정합 박제
- 시급도: 다음 시안 fine-tune 작업 전 완료 필요

## 2. 변경 요구사항

### 2-1. 핵심 변경 (시안 신규 박제)
다음 6 컴포넌트의 운영 시각을 시안에 박제 (의뢰서 본 문서 §2-1 ~ §2-6 참조):
1. FoulTypeModal (Phase 3.5 — P/T/U/D 4 옵션 grid)
2. PlayerSelectModal (Phase 2 — 선수 12 큰 버튼 grid + 점수 추론)
3. LineupSelectionModal (Phase 7-B + 7.1 — 양 팀 출전 12명 cap + 선발 5인)
4. QuarterEndModal (Phase 7-C — Q4/OT 종료 2 버튼 분기)
5. PeriodColorLegend (Phase 17 + 18 — 쿼터 색상 + 점수 표기 카드)
6. RotationGuard (Phase 1 — 모바일 회전 안내, 후순위)

### 2-2. 박제 위치 (제안 — 시안 구조에 맞게 조정 가능)
- 신규 `BDR-current/screens/ScoreSheet.modals.jsx` (4 모달 통합)
- 신규 `BDR-current/screens/ScoreSheet.legend.jsx` (PeriodColorLegend)
- 신규 `BDR-current/screens/ScoreSheet.rotation-guard.jsx` (RotationGuard)
- 또는 기존 `BDR-current/screens/ScoreSheet.jsx` / `ScoreSheet.parts.jsx` 확장

### 2-3. 보존 (변경 금지)
- BDR-current/ 의 다른 시안 파일 (Profile / Home / Court / Community 등)
- AppNav frozen (03-appnav-frozen-component.md) — score-sheet 페이지는 자체 셸이므로 무관
- 사용자 결정 §1~§8 (특히 §6-1 카피 시안 우선)

## 3. 디자인 명세

### 3-1. 시각 spec — 의뢰서 §2-1 ~ §2-6 참조

각 컴포넌트별 다음 항목 박제 그대로:
- 오버레이 / dialog 크기 / 패딩 / 보더 / 라운딩
- 헤더 / 본문 / 푸터 구조
- 버튼 그리드 (FoulType 2×2 / PlayerSelect 2~3 컬럼 / LineupSelection 양 팀 2 컬럼)
- 색상 매핑 (P=elevated / T=warning / U=accent / D=primary)
- 상태별 스타일 (선발 행 강조 / 동점 안내 / 비활성)
- 카피 (운영 문구 그대로)

### 3-2. Interaction states (시각만 박제, 실제 동작 X)
- open / closed (open=true 가정 시각)
- empty (PlayerSelect "선수 명단이 비어있습니다.")
- disabled ("경기 종료" 동점 시 비활성 / S 버튼 5명 차면 비활성)
- info / warning toast (LineupSelection 13번째 차단 — caller 책임이므로 시안 X)

### 3-3. Connections
- 진입: score-sheet 운영 흐름 — 칸 클릭 / 라인업 진입 / Q4·OT 종료 시점
- 시안에서는 단순 렌더 (실제 동작 X) — 모달 mock 표시

## 4. 박제 룰 (자동 적용)
✅ 00-master-guide.md 의 13 룰 모두 준수
✅ AppNav frozen 룰 무관 (score-sheet 자체 셸)
✅ 디자인 토큰 02 사용 (var(--*) 만)
✅ 사용자 결정 §1~§8 보존 (§6-1 카피 시안 우선)
✅ 06-self-checklist.md 모든 항목 ✅

## 5. 산출물
- `BDR-current/screens/ScoreSheet.modals.jsx` (또는 통합 위치)
- `BDR-current/screens/ScoreSheet.legend.jsx`
- `BDR-current/screens/ScoreSheet.rotation-guard.jsx` (후순위)
- BDR-current/ README 또는 변경 요약 (Phase A.7 박제 완료)

## 6. 추가 컨텍스트
본 의뢰서 (`Dev/scoresheet-2026-05-14/05-phase-A7-reverse-sync-brief.md`) §2-1 ~ §2-6 의 시각 spec 모두 참조 — 운영 코드 분석 결과 박제.
```

### 4-2. 첫 응답 형식 (Claude.ai 가 의뢰 받은 직후)

```
✅ BDR 시안 의뢰 확인 — Phase A.7 운영 → 시안 역동기화

이해:
- score-sheet 모달 4종 (FoulType / PlayerSelect / LineupSelection / QuarterEnd) + Legend + RotationGuard 박제
- 운영 src/ → BDR-current/ 단방향 박제 (운영 코드 변경 X)
- 사용자 결정 §6-1 시안 우선 보존 / §A·10 정사각 50% 룰
- AppNav frozen 무관 (score-sheet 자체 셸)
- 산출물: BDR-current/screens/ScoreSheet.modals.jsx (+ legend / rotation-guard)

자체 검수:
- 06-self-checklist.md §1 (토큰) / §2 (모바일 44px+) / §3 (Material Symbols)

작업 시작.
```

---

## 5. 완료 체크리스트 (Claude.ai 박제 후 자체 검수)

```
[ ] FoulTypeModal — 4 버튼 grid (2×2) / 60px+ / P·T·U·D 색상 매핑 정합
[ ] PlayerSelectModal — 헤더 점수 칩 / 12 선수 grid (2~3 col) / 등번호 accent 글자
[ ] LineupSelectionModal — 양 팀 2 컬럼 / 12명 cap / 선발 행 강조 / S 토글 / 전체 선택/해제
[ ] QuarterEndModal — 점수 요약 카드 / 동점 안내 / 2 버튼 분기 / OT 라벨 자동 산출
[ ] PeriodColorLegend — 2 영역 (색상 / 점수 표기) / 정사각 50% 색 원 / no-print
[ ] RotationGuard — Material screen_rotation 96px / 세로 안내 카피
[ ] no-print 클래스 = 모든 모달 + Legend (인쇄 시 제거)
[ ] var(--*) 토큰만 (하드코딩 hex 0) / lucide-react ❌
[ ] 빨강 본문 텍스트 ❌ (D 파울 / 경기 종료 = 배경만 BDR Red — 위험 액션 예외 ✅)
[ ] 정사각형 (W=H) 원형 = 50% (Legend 색 원 / 3점 외곽 원) ✅
[ ] 카피 운영 문구 그대로 (시안 우선 §6-1 — "오늘 출전 명단 선택" / "FIBA 룰에 따라" 등)
[ ] 06-self-checklist.md 항목 모두 ✅
```

---

## 6. 박제 후 검증 명령 (운영 측 — 사용자 수동)

### 6-1. 시안 갱신 후 운영 ↔ 시안 정합 검증

```bash
# (1) BDR-current/ 갱신 commit 확인
git log -5 --oneline -- Dev/design/BDR-current/screens/

# (2) 시안 신규 파일 존재 확인
ls Dev/design/BDR-current/screens/ScoreSheet*.jsx

# (3) 운영 _score-sheet-styles.css 와 토큰 정합 (시각 비교용)
grep -E "(--color-primary|--color-accent|--color-warning|--color-success)" \
  src/app/(score-sheet)/_score-sheet-styles.css

# (4) 시안에 lucide-react 침투 0
grep -r "lucide-react" Dev/design/BDR-current/screens/ScoreSheet*.jsx || echo "OK"

# (5) 시안에 하드코딩 hex 0 (var(--*) 만)
grep -rE "#[0-9a-fA-F]{3,6}" Dev/design/BDR-current/screens/ScoreSheet*.jsx \
  | grep -v "// " | grep -v "rgba\|color-mix" || echo "OK"
```

### 6-2. 향후 fine-tune 시 stale 0 확인

```bash
# BDR-current/ 마지막 commit
git log -1 --format="%ai" -- Dev/design/BDR-current/screens/ScoreSheet.modals.jsx

# 위 날짜 이후 운영 score-sheet UI 변경
git log --since="<above>" --oneline -- "src/app/(score-sheet)/" \
  | grep -iE "modal|legend|rotation|ui|design"
# 결과 비어있어야 stale 0
```

---

## 7. 참고 / 부록

### 7-1. 운영 commit 추적

- Phase 1 (RotationGuard) — 2026-05-11
- Phase 2 (PlayerSelectModal) — 2026-05-12
- Phase 3.5 (FoulTypeModal) — 2026-05-12
- Phase 7-B + 7.1 (LineupSelectionModal) — 2026-05-12
- Phase 7-C (QuarterEndModal) — 2026-05-12
- Phase 17 + 18 (PeriodColorLegend) — 2026-05-13
- 통합 commit: PR-S1~S10 commit `185e1d2` / Phase 23 PR4·PR6 commit `29ac1dd`

### 7-2. 시안 박제 후 후속 작업

- BDR-current/ commit 메시지: `design(sync): score-sheet 모달 5 + RotationGuard 운영 박제 (Phase A.7)`
- CLAUDE.md §🔄 동기화 룰 — 갭 검증 명령 통과 확인
- 다음 fine-tune 작업 시 BDR-current/ 안 score-sheet 모달 시안 직접 참조 가능

### 7-3. 의뢰서 사용 흐름

1. 본 의뢰서 Claude.ai Project (BDR 시안) 에 전달
2. Claude.ai 가 §4-2 첫 응답 형식대로 응답 → 작업 시작
3. Claude.ai 박제 결과 (BDR-current/screens/ScoreSheet*.jsx) 사용자에게 전달
4. 사용자가 mybdr 리포로 가져와서 commit (`design(sync):` 형식)
5. §6 검증 명령 통과 시 완료

---

**작성**: doc-writer / Phase A.7
**의뢰 대상**: Claude.ai Project (BDR 시안)
**산출물**: BDR-current/screens/ScoreSheet.modals.jsx + ScoreSheet.legend.jsx + ScoreSheet.rotation-guard.jsx
