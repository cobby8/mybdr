# 작업 스크래치패드

## 현재 작업
- **요청**: PR-Admin-3 placeholder 검증 배너 (PlaceholderValidationBanner + detectInvalidPlaceholderMatches) 박제
- **상태**: ✅ 박제 완료 — PM 검증 대기 (tsc 0 / vitest 26 PASS / 4 파일 변경 — 신규 1 + 수정 3)
- **현재 담당**: developer → PM

## 구현 기록 (developer) — PR-Admin-3

📝 구현한 기능:
- 강남구협회장배 사고 (2026-05-15 / errors.md 102) 재발 방지 — 순위전 매치 placeholder 형식 위반 검출 + admin UI 배너
- detectInvalidPlaceholderMatches: read-only 검출 함수 (format-violation / missing-slot-label 2 reason)
- PlaceholderValidationBanner: matches-client.tsx 본문 박제 — 검출 0건 = null / 검출 ≥1건 = warning 톤 + 펼치기 토글

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/PlaceholderValidationBanner.tsx` | 신규 (165 LOC / warning 톤 카드 + expand 토글 + 분류별 요약) | 신규 |
| `src/lib/tournaments/placeholder-helpers.ts` | detectInvalidPlaceholderMatches 신규 export (+65 LOC / RANKING_ROUND_REGEX + 2-reason 분기) | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/matches/matches-client.tsx` | Match type 에 notes 필드 추가 + import 1줄 + 종별 필터 직전 배너 박제 (+11) | 수정 |
| `src/__tests__/lib/tournaments/placeholder-helpers.test.ts` | detectInvalidPlaceholderMatches 4 케이스 추가 (+84) | 수정 |

📊 검증 결과:

```
git diff --stat HEAD (PR-Admin-3 한정 — 3 파일 수정)
 .../lib/tournaments/placeholder-helpers.test.ts    | 84 ++++++++++++++++++++++
 .../tournaments/[id]/matches/matches-client.tsx    | 11 +++
 src/lib/tournaments/placeholder-helpers.ts         | 65 +++++++++++++++++
 3 files changed, 160 insertions(+)

git status (untracked — 신규 1 파일)
?? src/app/(admin)/tournament-admin/tournaments/[id]/_components/PlaceholderValidationBanner.tsx

npx tsc --noEmit: EXIT_CODE=0 (전체 PASS / 0 error)
npx vitest run src/__tests__/lib/tournaments/placeholder-helpers.test.ts: 26/26 PASS (신규 4 + 기존 22)
```

🔧 자가 진단 5건:

| # | 항목 | 결과 |
|---|------|------|
| 1 | PlaceholderValidationBanner.tsx 신규 파일 (LOC > 0) | ✅ 165 LOC |
| 2 | placeholder-helpers.ts detectInvalidPlaceholderMatches export 추가 | ✅ +65 LOC / RANKING_ROUND_REGEX 신규 |
| 3 | matches-client.tsx Match type 보강 + 배너 박제 | ✅ +11 LOC (notes 필드 + import + 컴포넌트) |
| 4 | vitest 신규 4 케이스 추가 + PASS | ✅ 26/26 PASS (정상 / 강남구 / missing-label / 예선) |
| 5 | tsc 0 | ✅ EXIT_CODE=0 |

🛡️ 디자인 13 룰 준수:
- ✅ var(--color-warning) 톤 사용 (오류 아닌 경고 — 운영 진행 가능 / 수동 조치 권장)
- ✅ rounded-[4px] 만 사용 (pill 9999px ❌)
- ✅ material-symbols-outlined "warning" / "expand_more" / "expand_less" (lucide-react ❌)
- ✅ 모바일 full-width / PC sm:flex-row / 36~44px 터치 영역
- ✅ 핑크/살몬/코랄 ❌

⚠️ 규약 준수:
- ✅ planner-architect 박제 spec 100% 일치 (4 파일 / +148 LOC 예상 → 실제 3 수정 +160 + 신규 1 = 부합)
- ✅ AdvancePlayoffsButton (PR-Admin-2) / NextStepCTA (PR-Admin-1) 변경 0 (영역 분리)
- ✅ placeholder-helpers 기존 시그니처 변경 0 (export 추가만 / 6 기존 함수 시그니처 그대로)
- ✅ matches-client.tsx 다른 영역 변경 0 (Match type 1 필드 + import 1 + 컴포넌트 박제 1만)
- ✅ 운영 DB SELECT 0 (read-only 검출 함수만)

💡 tester 참고:
- 테스트 방법:
  1. 강남구협회장배 ID 진입 → `/tournament-admin/tournaments/[id]/matches`
  2. 종별 필터 직전 위치에 warning 톤 배너 노출 확인 ("⚠️ 순위결정전 N건이 placeholder 형식이 아닙니다.")
  3. "상세 보기" 클릭 → 검출 매치 ID + roundName + notes + 권장 액션 노출
  4. 정상 운영 대회 (placeholder 형식 정합) 진입 → 배너 미표시 확인
- 정상 동작:
  - 모바일(≤720px): 배너 풀너비 + 헤더/버튼 세로 배치
  - PC(≥sm): 헤더 좌측 + 펼치기 버튼 우측 정렬
  - 종별 / 체육관 필터 적용 시 filteredMatches 만 검증 (applyFilter=true 라벨 노출)
- 주의할 입력:
  - matches 빈 배열 → 검출 0 → 배너 미표시 (정상)
  - roundName "예선" / null → 검증 대상 0 (조용히 skip)
  - format-violation + missing-slot-label 동시 만족 시 → format-violation 우선 보고 (continue 로 missing 중복 skip)

⚠️ reviewer 참고:
- detectInvalidPlaceholderMatches 검출 우선순위: format-violation > missing-slot-label (강남구 사고 패턴 = 더 시급한 운영 조치 신호)
- RANKING_ROUND_REGEX = /순위/ 단순 매치 — "순위결정전" / "순위전" / "동순위전" 모두 포함 / 향후 generator 가 신규 라운드명 추가해도 자동 매칭
- PlaceholderValidationBanner.tsx 165 LOC = planner 예상 70 LOC 초과 (펼치기 상세 + 분류 요약 추가 박제로 풍성화). 운영자 인지 비용 최소화가 본 PR 핵심 목적이라 의도된 확장.
- matches-client.tsx 의 settings type (`{ recording_mode?: ... [k: string]: unknown }`) 가 detectInvalidPlaceholderMatches 의 settings (`Record<string, unknown> | null`) 와 호환 — homeSlotLabel/awaySlotLabel 키는 [k: string]: unknown 으로 흡수.

## 구현 기록 (developer) — PR-Admin-1

📝 구현한 기능:
- admin-flow-audit §3 단계 4·7 단절 해소 — divisions / teams / bracket 페이지 footer 단일 카드 CTA
- NextStepCTA 컴포넌트 신규 박제 (disabled 분기 포함 / 단계 매핑 single source)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/NextStepCTA.tsx` | 신규 (109 LOC / disabled 분기 / 단계 매핑 single source / var(--color-info) Navy + arrow_forward) | 신규 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx` | import 1줄 + footer 박제 4줄 | 수정 (+5) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx` | import 2줄 + footer 박제 3줄 | 수정 (+5) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/bracket/page.tsx` | import 2줄 + footer 박제 3줄 | 수정 (+5) |

📊 검증 결과:

```
git diff --stat HEAD (PR-Admin-1 한정 + scratchpad)
 .claude/scratchpad.md                              | 189 ++++++++++++++++++++-
 .../tournaments/[id]/bracket/page.tsx              |   5 +
 .../tournaments/[id]/divisions/page.tsx            |   5 +
 .../tournaments/[id]/teams/page.tsx                |   5 +
 4 files changed, 201 insertions(+), 3 deletions(-)

git status (PR-Admin-1 한정)
 M src/app/(admin)/tournament-admin/tournaments/[id]/bracket/page.tsx
 M src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx
 M src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx
?? src/app/(admin)/tournament-admin/tournaments/[id]/_components/NextStepCTA.tsx

npx tsc --noEmit: 0 error (전체 PASS)
```

🔧 자가 진단 5건:

| # | 항목 | 결과 |
|---|------|------|
| 1 | NextStepCTA.tsx 신규 파일 (LOC > 0) | ✅ 109 LOC |
| 2 | divisions/page.tsx 변경 (NextStepCTA import + 박제) | ✅ +5 |
| 3 | teams/page.tsx 변경 (동일) | ✅ +5 |
| 4 | bracket/page.tsx 변경 (동일) | ✅ +5 |
| 5 | tsc 0 (본 PR 파일 한정) | ✅ 전체 PASS |

🛡️ 디자인 13 룰 준수:
- ✅ var(--color-info) Navy 토큰 사용 (라이트/다크 양면 정의 globals.css L2757/L2785)
- ✅ rounded-[4px] 만 사용 (pill 9999px ❌)
- ✅ material-symbols-outlined "arrow_forward" 사용 (lucide-react ❌)
- ✅ 모바일 full-width / PC sm:w-auto 우측 정렬 / 44px+ 터치 (minHeight: 44)
- ✅ 핑크/살몬/코랄 ❌

⚠️ 처리 사유 — JSX.Element 타입 명시 제거:
- 1차 박제 시 `JSX.Element | null` 반환 타입 명시 → tsc TS2503 에러 ("Cannot find namespace 'JSX'")
- 사유: 본 프로젝트는 React 19 + 새 JSX transform — 전역 `JSX` namespace 부재
- 수정: 반환 타입 추론에 위임 (명시 제거) — 동작 0 변경

💡 tester 참고:
- 테스트 방법:
  1. `/tournament-admin/tournaments/[id]/divisions` 진입 → 안내 카드 다음에 "다음: 팀 등록 →" Navy 카드 노출 확인
  2. CTA 클릭 → `/tournament-admin/tournaments/[id]/teams` 이동 확인
  3. teams 페이지 footer → "다음: 대진표 생성 →" 노출
  4. bracket 페이지 footer → "다음: 경기 관리 →" 노출
- 정상 동작:
  - 모바일(≤720px): 버튼 full-width / 44px 이상 터치 영역
  - PC(≥sm): 카드 우측 정렬 / 1줄 inline
  - matches 페이지 = CTA 미노출 (PR-Admin-2 단일 trigger 흡수 / 본 PR 변경 0)
- 주의할 입력:
  - tournamentId 비어있을 때 동작 0 (Link 항상 렌더링 — invalid id 시 404 라우팅 / NextStepCTA 책임 0)
  - disabled prop 미사용 (선행 단계 잠금 로직은 후속 PR — 본 PR = 항상 활성)

⚠️ reviewer 참고:
- 단계 매핑 테이블 (NEXT_STEP_MAP) = 컴포넌트 내부 single source. 신규 단계 추가 시 본 컴포넌트만 수정.
- matches → null 의도 = PR-Admin-2 단일 순위전 trigger 흡수 (planner 명시).
- bracket inline CTA (`bracket/page.tsx:578-583, 827-832, 899-904`) 는 종별 sub-Card 안의 "경기 관리로 이동 →" 별도 — 본 PR footer CTA 와 중복 박제 의도 (각 종별 단위 + 페이지 단위 모두 노출).

## 기획설계 (planner-architect) — PR-Admin-1/2/3

🎯 목표: admin 흐름 점검 §6.5 우선 1~3 (단계간 CTA / 단일 순위전 trigger / placeholder 검증 배너) 동시 박제. 강남구협회장배 시나리오 단계 4·10·10.5 단절 + 누락 동시 해소.

### §PR-Admin-1: 단계간 CTA (StepFooterCTA)

**현 layout 분석 (코드 인용)**:
| 페이지 | 헤더 우측 | 하단 | 다음 단계 CTA |
|-----|------|-----|----|
| `divisions/page.tsx:172-183` | (없음) | (없음) | ❌ 없음 ⭐ 핵심 |
| `teams/page.tsx:441-484` | CSV/카톡/순위전 자동 채우기 3 버튼 | (없음) | 🟡 "순위전 자동 채우기" 만 (PR-Admin-2 가 matches 로 이동 박제) |
| `bracket/page.tsx:226-251` | 버전 대시보드 + 생성 버튼 | (없음) | 🟡 dual + 종별 sub-Card 안 "경기 관리로 이동 →" inline (`bracket/page.tsx:578-583, 827-832, 899-904`) — 페이지 단위 footer CTA 0 |
| `matches/matches-client.tsx:485-508` | 대진표 재생성 버튼 | (없음) | ❌ 다음 단계 (= 예선 종료 후 순위전) CTA 0 |

**자연스러운 흐름**:
- `divisions` → `teams` ("다음: 팀 등록 →")
- `teams` → `bracket` ("다음: 대진표 생성 →")
- `bracket` → `matches` ("다음: 경기 관리 →") — 이미 sub-Card 안 inline 존재 / footer 단일 CTA 추가
- `matches` → ⚙️ PR-Admin-2 의 단일 순위전 trigger 로 흡수 (별 CTA 없음)

**신규 컴포넌트**:
```ts
// src/app/(admin)/tournament-admin/tournaments/[id]/_components/NextStepCTA.tsx
export function NextStepCTA(props: {
  tournamentId: string;
  currentStep: "divisions" | "teams" | "bracket" | "matches";
  // 선행 단계 미완성 시 비활성화 (선택). 빈 값 = 항상 활성.
  disabled?: boolean;
  disabledReason?: string;
}): JSX.Element;
```
- 단계 매핑 테이블 (CTA 라벨 + href) 컴포넌트 내부 single source.
- 페이지 footer (`</div>` 닫기 직전) 에 카드 형태 박제 — `<Card>` + `<Button>` + 라벨 "다음 단계: X →" + 모바일 full-width.
- 디자인 룰: BDR-current 토큰 (`var(--color-info)` Navy / `rounded-[4px]`).

**변경 파일**:
| 파일 | 변경 | LOC |
|-----|----|----|
| `_components/NextStepCTA.tsx` | 신규 | +60 |
| `divisions/page.tsx:311` (return 닫기 직전) | `<NextStepCTA currentStep="divisions" />` 1줄 | +1 |
| `teams/page.tsx:1259` (return 닫기 직전) | 동일 | +1 |
| `bracket/page.tsx:689` (return 닫기 직전) | 동일 | +1 |
| `matches/matches-client.tsx:698` | (PR-Admin-2 흡수 / 본 PR 불필요) | 0 |
| **합계** | | **+63** |

**회귀**: 0 (라우팅 + 신규 컴포넌트 + 기존 페이지 1줄 추가). vitest 불필요 (UI-only).

---

### §PR-Admin-2: matches 단일 순위전 trigger (AdvancePlayoffsButton)

**현 상황**:
- `teams/page.tsx:472-482` 에 이미 "순위전 자동 채우기" 버튼 존재 (헤더 우측 / `advance-placeholders` 호출). 운영 흐름상 부적절한 위치 — **§3 단계 10 = matches 페이지에서 예선 종료 → 순위전** 이동.
- 본 PR = matches 페이지로 **이동** (teams 에서 제거 + matches 에 신규 박제).

**핵심 로직 재사용**:
- `POST /api/web/admin/tournaments/[id]/advance-placeholders` (body `{}`) — 모든 종 일괄 — 완전 재사용 (route 수정 0).
- 응답: `{ totalUpdated, totalSkipped, totalErrors, results: [{ divisionCode, updated, skipped, errors }] }`.
- `match-sync.ts:674` 가 이미 자동 trigger 하지만 본 PR = **운영자 수동 fallback** (advance route 주석 line 13 참조).

**신규 컴포넌트**:
```ts
// src/app/(admin)/tournament-admin/tournaments/[id]/_components/AdvancePlayoffsButton.tsx
export function AdvancePlayoffsButton(props: {
  tournamentId: string;
  // 종별 N건. results 표 헤더 라벨용 (선택)
  divisionCodes?: string[];
  onSuccess?: () => void; // 호출자 (matches-client) refetch trigger
}): JSX.Element;
```

**UI 구성**:
1. matches 헤더 우측 `flex gap-2` 안 (`matches-client.tsx:492-507` "대진표 재생성" 버튼 옆) — `<Button variant="secondary">` "예선 종료 → 순위전 진출" / `material-symbols trending_up` 아이콘.
2. 클릭 → `confirm()` ("재호출 시 이미 채워진 슬롯은 보호됩니다 / placeholder 매치 N건 검출 …").
3. POST `/api/web/admin/tournaments/[id]/advance-placeholders` 호출.
4. 결과 모달 (`<Card>` 4 row 표) — 종별 / UPDATE / SKIP / 에러 + "확인" 버튼 → `onSuccess()` 호출 → matches `load()` refetch.
5. 에러 0 = `var(--color-success)` 배너 / 에러 ≥1 = `var(--color-warning)` 배너.

**변경 파일**:
| 파일 | 변경 | LOC |
|-----|----|----|
| `_components/AdvancePlayoffsButton.tsx` | 신규 (modal 포함) | +120 |
| `matches/matches-client.tsx:492` | 헤더 우측 button 추가 (1줄 import + 5줄 컴포넌트 박제) | +6 |
| `teams/page.tsx:472-482` | 기존 "순위전 자동 채우기" 버튼 제거 (PR-Admin-2 와 중복) | -10 |
| `teams/page.tsx:1571-1599` | `advancePlaceholders` 헬퍼 제거 (deadcode) | -29 |
| **합계** | | **+87** |

**회귀**: advance route idempotent 보장 (placeholder-helpers `isStandingsAutoFillable` + `division-advancement.ts` skip 로직 — 채워진 슬롯 보호 — `notes` 가 정규식 매칭 안 되면 skip). vitest 케이스:
- `__tests__/components/AdvancePlayoffsButton.test.tsx` (선택) — fetch mock + 모달 표시 검증 / 4 종별 응답 → 4 row 표 / 에러 case 톤 분기

**주의 (developer 인계)**:
- teams 헤더 우측 layout flex 가 PR-Admin-2 의 버튼 1개 제거 후에도 깨지지 않는지 확인 (현 3 버튼 → 2 버튼).
- `match-sync.ts:674` 자동 trigger 와 운영자 수동 호출 양면 박제 OK (route idempotent).

---

### §PR-Admin-3: placeholder 검증 배너 (PlaceholderValidationBanner)

**검출 로직 (read-only)**:
- input: `matches` (matches-client.tsx state) — 모든 매치
- 검사:
  1. `roundName` 가 "순위결정전" / "순위전" / "동순위전" 포함 (정규식)
  2. AND `homeTeamId !== null` OR `awayTeamId !== null` (이미 실팀 박혀있는데)
  3. AND `notes` 가 `placeholder-helpers` `parseSlotLabel` 통과 안 함 (= placeholder 형식 아님 = 강남구 사고 패턴 그대로)
- OR 케이스 2 (옵션):
  1. `roundName` 가 "순위결정전" 포함
  2. AND `settings.homeSlotLabel` 또는 `settings.awaySlotLabel` 미박제
  3. → 향후 G7 자동 fix 후보

**Match GET 응답 검증**:
- `lib/services/match.ts:23-41` `MATCH_LIST_INCLUDE` = include 만 사용 → `notes` / `settings` 컬럼 모두 반환 ✅.
- matches-client.tsx Match type (`line 14-34`) = `notes` 필드 부재 → **type 보강 필요** (`notes: string | null` 추가).

**신규 컴포넌트**:
```ts
// src/app/(admin)/tournament-admin/tournaments/[id]/_components/PlaceholderValidationBanner.tsx
export function PlaceholderValidationBanner(props: {
  matches: Array<{ id; roundName; homeTeamId; awayTeamId; notes; settings }>;
  // optional: divisionFilter 적용 후 매치만 검사 (false = 전체 / true = 필터 적용)
  applyFilter?: boolean;
}): JSX.Element | null;

// src/lib/tournaments/placeholder-helpers.ts
// 신규 export
export function detectInvalidPlaceholderMatches(
  matches: Array<{ id; roundName; homeTeamId; awayTeamId; notes }>,
): Array<{ matchId; reason: "format-violation" | "missing-slot-label" }>;
```

**UI 구성**:
- 검출 0건 = null 반환 (배너 미표시)
- 검출 ≥1건 = matches-client.tsx 종별 필터 (`line 524-595`) 위에 `<Card>` 배너 (warning 톤 — `var(--color-warning)`)
  - 메시지: "⚠️ 순위결정전 N건이 placeholder 형식이 아닙니다. (강남구협회장배 사고 재발 방지)"
  - 펼치기 → 매치 ID + roundName + 현재 notes 값 + 권장 액션 ("수동 fix 안내 문서 링크" / 향후 G7 auto-fix)
- 위치: matches-client.tsx `line 522` (error 배너 다음 / 종별 필터 직전)

**변경 파일**:
| 파일 | 변경 | LOC |
|-----|----|----|
| `_components/PlaceholderValidationBanner.tsx` | 신규 | +70 |
| `lib/tournaments/placeholder-helpers.ts` | `detectInvalidPlaceholderMatches` 신규 export | +25 |
| `matches/matches-client.tsx:14-34` | Match type 에 `notes: string \| null` 추가 (1줄) | +1 |
| `matches/matches-client.tsx:522` | 배너 박제 (1줄 import + 1줄 컴포넌트) | +2 |
| `__tests__/lib/tournaments/placeholder-helpers.test.ts` | `detectInvalidPlaceholderMatches` vitest (4 케이스) | +50 |
| **합계** | | **+148** |

**회귀**: 0 (read-only 검증). vitest 케이스 (필수):
1. 정상 placeholder ("A조 1위 vs B조 1위" + homeTeamId=null) → 0 검출
2. 강남구 사고 패턴 (실팀 박혀있고 notes 형식 위반) → 1 검출 / reason="format-violation"
3. settings.slotLabel 미박제 → reason="missing-slot-label"
4. roundName "예선" (순위전 아님) → 0 검출

**주의 (developer 인계)**:
- 정규식: `roundName` "순위" 포함 검사 — "순위결정전" / "순위전" / "동순위전" 모두 매치. `parseSlotLabel` 결과 null 이면 위반 판정.
- 향후 G7 auto-fix 옵션 = 별도 PR (본 PR = 검증·표시만).

---

### §종합: 3 PR 진행 권장

| 항목 | 평가 |
|-----|------|
| **공통 컴포넌트 추출** | `_components/NextStepCTA.tsx` / `AdvancePlayoffsButton.tsx` / `PlaceholderValidationBanner.tsx` 모두 독립 — 공통 wrapper 불필요 |
| **병렬 가능성** | ✅ 3 PR 독립 (NextStepCTA = 라우팅만 / AdvancePlayoffsButton = matches 헤더 / Banner = matches 본문). matches-client.tsx 가 PR-Admin-2 + PR-Admin-3 동시 수정 → 작은 conflict 위험 (다른 line / 다른 section) — 순차 처리 권장 |
| **권장 순서** | (1) PR-Admin-1 (가장 단순 / 회귀 0) → (2) PR-Admin-3 (matches 본문) → (3) PR-Admin-2 (matches 헤더 + teams 정리) |
| **developer 위임** | 1회 묶음 (3 PR 동시) vs 3회 분리 → **3회 분리 권장**: 회귀 위험 작음 + 검증 단순 + commit 분리 (rollback 용이) |
| **예상 총 LOC** | +298 (신규 250 / 수정 48) |
| **예상 시간** | 각 PR 30~45분 (developer + tester) × 3 = **약 2~3시간** |
| **vitest 신규** | 4 케이스 (PR-Admin-3 만) / 기존 240/240 PASS 유지 |
| **회귀 위험** | 모두 0 (read-only / UI / 라우팅 / advance route idempotent) |

**디자인 13 룰 준수**:
- `var(--color-info)` Navy / `var(--color-warning)` / `var(--color-success)` 토큰만
- `rounded-[4px]` 만 사용 (pill 9999px ❌)
- `material-symbols-outlined` 만 (lucide-react ❌)
- 모바일 44px min-height + 720px 분기

**knowledge 갱신 의무 (PM 수행)**:
- `decisions.md`: PR-Admin-1/2/3 도메인 결정 박제
- `architecture.md`: `_components/` 폴더 구조 (3 파일 신규)
- `index.md` 항목수 갱신

## 진행 현황표 (대진표 후속 큐)
| # | PR | 상태 | LOC | commit |
|---|----|------|------|--------|
| 1 | PR-G5.5-followup-B 매치 PATCH 통합 | ✅ | +63 | `df96522` |
| 2 | PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator | ✅ | +900 | `b1e48b8` |
| 3 | PR-G5.2 dual-generator placeholder-helpers 통과 | ✅ | +302 | `eaccd54` |
| 4 | PR-G5.7 double_elim | 🔵 보류 | - | 운영 사용 0 / 운영 진입 시점 박제 |
| 5 | PR-G5.8 swiss (옵션 B / R1 + R(N) 501 stub) | ✅ | +977 | `b8b3117` |

## 미푸시 commit
- **0건** (subin = origin/subin / `b8b3117` push 완료 / knowledge 갱신 commit 별도 진행)

## working tree (다른 트랙 보존)
- `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` (M / score-sheet 트랙)
- `src/app/(score-sheet)/score-sheet/[matchId]/_hooks/use-score-sheet-input-state.ts` (?? / score-sheet 트랙)
- `bdr 디자인 시스템 관리/admin-design-2026-05-15/` (?? / 디자인 트랙)
- 본 대진표 트랙과 무관

## 후속 큐
- **PR-G5.7 double_elim**: 운영 진입 시점에 박제 (planner 의견 — Q1=(b) / +820 LOC / W bracket = NBA-seed 재사용)
- **generateSwissNextRound 풀구현**: PR-G5.8 후속 PR (현재 501 stub) — 운영 진입 시점
- **CLI 핸드오프 2차** ⭐ — admin 시각 확장
- **AppNav utility 좌측 메뉴** / **AppNav SSR admin 메뉴 정합**
- **dev 브랜치 sync**: origin/dev = origin/main 보다 84+ commit stale
- Phase 6 PR3 / Phase 19 PR-T1~T5 / Phase 23 PR4 / Phase E 14 라우트 / GNBA 8팀
- recorder_admin Q1~Q6 결재 대기

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-16 | **PR-Admin-1/2/3 통합 설계 (planner-architect)** | ✅ scratchpad "기획설계" 섹션 박제 — NextStepCTA / AdvancePlayoffsButton / PlaceholderValidationBanner 3 컴포넌트 / 권장 순서 1→3→2 / 총 LOC +298 / vitest 4 케이스 / 회귀 0 |
| 2026-05-16 | **PR-G5.8 swiss generator R1 박제 + R(N) 501 stub (옵션 B)** | ✅ commit `b8b3117` — swiss-helpers + swiss-knockout 신규 / planSwissRound1 시드 양분 + planSwissNextRound Dutch+Buchholz+최근대전회피 / generateSwissNextRound 501 stub / vitest 240/240 PASS (신규 13 케이스) / 회귀 0 |
| 2026-05-16 | **PR-G5.2 dual-generator placeholder-helpers 통과 (옵션 B)** | ✅ commit `eaccd54` — 인라인 박제 12건 → buildSlotLabel / group_match_result kind 신규 / vitest 227/227 PASS |
| 2026-05-16 | **PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator (옵션 A opt-in)** | ✅ commit `b1e48b8` — 신규 파일 2건 + seed_number kind / 양분 트리 + BYE / vitest 219/219 PASS |
| 2026-05-16 | **PR-G5.5-followup-B 매치 PATCH route 통합** ⭐ | ✅ commit `df96522` — Web PATCH + Flutter match-sync 양면 박제 / 1차 사고 → PR2 PM 직접 검증 모드 옵션 B 진입 |
| 2026-05-16 | **recorder_admin 전역 흡수 + record01/02 강등** ⭐ | ✅ PR #531 main 머지 (`8a913ef`) |
| 2026-05-16 | **4차 뉴비리그 apiToken 자동 발급 fix + Sub-B3** | ✅ PR #527 main 머지 (`1bff83e`) |
| 2026-05-15 | Admin-7-B Sub-B3 Wizard1Step + Sub-B2 EditWizard 박제 | ✅ commit `06069a4` + `efcc103` |
| 2026-05-15 | 본 세션 16 commit main 분리 머지 완료 | ✅ PR #517 + PR #519 |
| 2026-05-15 | 라이브 페이지 정리 + 조별 순위표 + bracket aside 종합 정리 | ✅ commit `5f1e768` + `599c64c` + `0512fb5` 외 |
| 2026-05-15 | PR-G5.5-followup Tournament 단위 placeholder applier | ✅ commit `6d52a33` + `c78bbba` |
