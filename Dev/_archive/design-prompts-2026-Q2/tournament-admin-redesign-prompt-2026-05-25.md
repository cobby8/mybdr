# 클로드 디자인 의뢰 — 대회 생성/관리 흐름 전면 리디자인

> **의뢰일**: 2026-05-25
> **수신**: 클로드 디자인 (Claude.ai Project — bdr 디자인 시스템 관리)
> **선행 분석**: planner-architect 의 대회 생성/관리 UX 점검 (`.claude/scratchpad.md` `## 기획설계` 섹션)
>   - 인벤토리 24 페이지 + 12 컴포넌트
>   - UX 사각지대 9건 (S1~S9 / 영향도 ★★★★★ ~ ★★)
>   - BDR-current/ 갭 3건 (G1 playoffs / G2 prospectus / G3 wizard 자동 채움)
>   - 사용자 결정 — 기능 개발 보류 / 디자인 시안 우선 / 원점에서 재검토
> **이번 의뢰**: 진입점 통합 + 셋업 hub 강화 + 종료 흐름 신규 + 신규 시안 3건 (playoffs / completed / prospectus)
> **활성 시안**: `Dev/design/BDR-current/` 단일 폴더 (CLAUDE.md §🗂️ 단일 폴더 룰 — 2026-05-01)

---

## 0. 진입 — 표준 절차 (BDR 디자인 시스템 관리)

**Step 1**: `Dev/design/claude-project-knowledge/00-master-guide.md` 읽기 (13 룰 인지)
**Step 2**: 본 의뢰의 영향 받는 보조 파일 — 01 (사용자 결정 §1~§8) / 02 (토큰) / 03 (AppNav frozen) / 04 (페이지 인벤토리) / 06 (자체 검수)
**Step 3**: 첫 응답 (표준 형식):

```
✅ BDR 디자인 의뢰 확인 — 대회 생성/관리 흐름 전면 리디자인
이해: 진입점 통합 + 셋업 hub 강화 + 종료 흐름 신규 + 신규 시안 3건 (playoffs / completed / prospectus)
사용자 결정 §1~§8 보존 / AppNav frozen — 03 카피
자체 검수: 06 §1, §2, §3, §5, §6, §7 (E등급 자체 영역)
작업 시작.
```

---

## 1. 의뢰 배경 (왜 — 9 사각지대 핵심 3건)

본 의뢰는 **운영 코드 변경 0** / 시안 박제만 진행. 사용자가 "prospectus AI 기능 개발 보류 / 원점에서 대회 생성 흐름 UI/UX 재검토" 결정.

### 1-1. S1 — 대회 생성 진입점 3중화 (★★★★★)

현 `/tournament-admin/tournaments/new/wizard*` 아래 진입점이 3종 분산:

- `wizard/` (기본) — **QuickCreate** (1-step 압축 — 이름 + 시작일 + 시리즈)
- `wizard?legacy=1` — **LegacyWizard** (3-step 기존 — 대회정보 / 참가설정 / 확인)
- `wizard/prospectus` — **prospectus AI 분석** (PDF 업로드 → 분석 → draft)
- `/tournament-admin/wizard/association` — **협회 마법사** (super_admin 4-step)

→ 사용자 시나리오: "이전 대회 비슷하게 만들고 싶은데 어디 가야 하지?" / Prospectus 진입점은 헤더 actions 의 작은 "요강 분석" 버튼만 — 발견 0.
→ **비유**: 같은 식당 입구가 3개인데 안내문 없음.

### 1-2. S2 — 셋업 hub 진행도 표기 미사용 (★★★★)

`/tournament-admin/tournaments/[id]` 셋업 hub 의 **SetupChecklist 8 항목** 중 잠금 의존(`depends_on`) 시각화 약함.

→ 신규 운영자가 "5번 신청 정책" 카드 클릭 → 무반응 (앞 단계 미완) → 이탈.
→ **비유**: 엘리베이터에 "5층은 4층 통과 후" 안내 부재.

### 1-3. S3 — 재진입 시 draft 복구 미지원 (★★★★)

3 진입점이 모두 다른 동작:
- QuickCreate = 즉시 DB INSERT (draft)
- LegacyWizard = state in-memory (탭 닫으면 휘발)
- Prospectus = sessionStorage

→ 사용자가 LegacyWizard 2단계까지 입력 → 실수로 탭 닫음 → 처음부터.
→ **비유**: 종이 신청서 작성 중 화재로 다 타는데 사본이 없음.

### 1-4. 9 사각지대 전체 (참고)

| # | 사각지대 | 영향도 |
|---|---------|-------|
| S1 | 대회 생성 진입점 3중화 | ★★★★★ |
| S2 | 셋업 hub 진행도 표기 미사용 (depends_on) | ★★★★ |
| S3 | 재진입 시 draft 복구 미지원 | ★★★★ |
| S4 | 다중 종별 대회 흐름 발견성 약함 | ★★★★ |
| S5 | 종료 후 흐름 누락 (결과/통계/알기자/사진 진입점 분산) | ★★★ |
| S6 | 권한 분기 UI 비대칭 (super_admin / organizer / TAM / 단체 admin) | ★★★ |
| S7 | 모바일 (≤720px) 셋업 hub 미흡 | ★★★ |
| S8 | 에러 / 검증 피드백 산발 (PlaceholderValidationBanner 가 matches 페이지만) | ★★★ |
| S9 | AppNav frozen vs 어드민 영역 정합 (별도 sidebar 와 단절) | ★★ |

---

## 2. 대상 페이지 (영역별 그룹 — 5 영역 / 10 시안)

본 의뢰는 5 영역 / 10 시안 (수정 7 + 신규 3) 으로 묶임.

### 영역 A. 진입점 통합 (수정 — 3 파일)

| 파일 | 라우트 (참고) | 역할 |
|------|------------|------|
| `AdminTournamentAdminList.jsx` | `/tournament-admin/tournaments` | 본인 대회 카드 list — "새 대회 만들기" CTA 흐름 정의 |
| `AdminTournamentWizard1Step.jsx` | `/tournament-admin/tournaments/new/wizard` | QuickCreate — 단일 진입점 통합 (sub-tab 4 옵션) |
| `AdminWizardAssociation.jsx` | `/tournament-admin/wizard/association` | 협회 마법사 (super_admin 4-step) — 진입점 노출 정책 |

### 영역 B. 셋업 hub 강화 (수정 — 1 파일)

| 파일 | 라우트 (참고) | 역할 |
|------|------------|------|
| `AdminTournamentSetupHub.jsx` | `/tournament-admin/tournaments/[id]` | depends_on 시각화 + 진행도 + 모바일 sticky 공개 버튼 |

### 영역 C. 운영 진행 통합 (수정 — 2 파일)

| 파일 | 라우트 (참고) | 역할 |
|------|------------|------|
| `AdminTournamentMatches.jsx` | `/tournament-admin/tournaments/[id]/matches` | 매치 표 + 검증 banner 통합 패턴 (PlaceholderValidationBanner 표준화) |
| `AdminTournamentDivisions.jsx` | `/tournament-admin/tournaments/[id]/divisions` | 다중 종별 발견성 강화 (U10/U12/U14/U16 등) |

### 영역 D. 종료 흐름 (신규 — 1 파일)

| 파일 | 라우트 (참고) | 역할 |
|------|------------|------|
| `AdminTournamentCompleted.jsx` | `/tournament-admin/tournaments/[id]` (status=completed) | 종료 후 결과/통계/알기자/사진 hub |

### 영역 E. 운영 신규 기능 시안 (신규 — 2 파일 / BDR-current 갭 G1/G2)

| 파일 | 라우트 (참고) | 역할 | 갭 |
|------|------------|------|---|
| `AdminTournamentPlayoffs.jsx` | `/tournament-admin/tournaments/[id]/playoffs` | 순위전 hub (5 섹션 / 결승 / standings) | G1 |
| `AdminTournamentProspectus.jsx` | `/tournament-admin/tournaments/new/wizard/prospectus` | PDF 업로드 → AI 분석 → 미리보기 → wizard 자동 채움 | G2 / G3 |

---

## 3. 각 페이지 상세 요구사항

### 3-A1. `AdminTournamentAdminList.jsx` — 대회 목록 + 단일 진입점 CTA

**현재 결함**:
- "새 대회 만들기" CTA 1개만 노출 — 4 옵션 (Quick / Legacy / Prospectus / 협회) 의 분기 인지 0.
- 사용자 시나리오: "이전 대회 비슷하게 만들고 싶은데 어떤 버튼?" → 추측.

**시안 요구사항**:
- **단일 진입점 CTA 카드 1개** (상단 hero CTA — "새 대회 만들기")
- 클릭 시 **모달 or 인라인 panel** 노출 → **4 옵션 sub-tab**:
  1. **Quick** — "빠르게 시작" (이름 + 시작일만 입력 — 1분)
  2. **Legacy** — "단계별 설정" (3-step 마법사 — 5분)
  3. **Prospectus** — "PDF 요강에서 자동" (요강 업로드 → AI 추출 — 3분)
  4. **협회** — "협회 대회로 박제" (super_admin 전용 / 일반 organizer 에겐 hidden)
- 각 옵션에 **추천 사용 케이스** 1줄 + **예상 시간** 라벨
- 대회 카드 list 는 기존 디자인 보존 (상태 뱃지 / 진행도 bar / 권한 표시)

**보존 항목**:
- 검색 / 필터 / 페이지네이션 (기존 동작)
- 권한별 카드 노출 룰 (super_admin / organizer / TAM / 단체 admin)
- 대회 카드 클릭 시 셋업 hub (`/tournament-admin/tournaments/[id]`) 이동

**모바일 (≤720px)**:
- CTA 카드 풀폭 / 4 옵션 = 모달 1열 stack (탭 X)
- 대회 카드 list 1열 (기존 유지)

**자체 검수**:
- 06 §3 (디자인 토큰) — var(--*) / Material Symbols / 4px 라운딩
- 06 §5 (모바일) — 720px 분기 / 버튼 44px / iOS input 16px
- 06 §6 (연결성) — 진입/복귀/edge cases JSDoc

---

### 3-A2. `AdminTournamentWizard1Step.jsx` — QuickCreate (단일 진입점 통합)

**현재 결함**:
- 1-step 압축 폼만 노출 — 다른 진입점 (Legacy / Prospectus) 으로의 전환 0.
- 사용자 시나리오: QuickCreate 진입 후 "더 자세히 설정하고 싶은데 다른 마법사로 가려면?" → 답 없음.

**시안 요구사항**:
- 상단에 **진입점 sub-tab** 노출 (4 옵션 — A1 동일):
  - Quick (현재 활성 / 압축 1-step)
  - Legacy (3-step 으로 전환 — `?legacy=1` 라우팅)
  - Prospectus (PDF 업로드로 전환 — `/wizard/prospectus`)
  - 협회 (super_admin 전용)
- 본문 = 현재 QuickCreate 압축 폼 (이름 / 시작일 / 시리즈 inline 폼)
- **S3 draft 복구 배너** — 페이지 진입 시 sessionStorage / DB draft 검출 시 상단에 "이전 작성 이어하기 →" 노출 (보존 항목)
- **다음 단계 안내**: 폼 하단에 "생성 후 셋업 hub 8 카드 → 공개" 흐름 일러스트 (텍스트 3줄)

**보존 항목**:
- `InlineSeriesForm` 시그니처 (시리즈 생성 inline 동작 그대로)
- DB INSERT (draft) 시점 보존
- 권한 가드 (organizer + super_admin)

**모바일 (≤720px)**:
- sub-tab = 가로 스크롤 칩 (4개)
- 폼 1열 stack / 버튼 sticky bottom

**자체 검수**:
- 06 §3 / §5 / §6 동일

---

### 3-A3. `AdminWizardAssociation.jsx` — 협회 마법사 (super_admin 4-step)

**현재 결함**:
- 진입점이 별도 라우트 (`/wizard/association`) 분리 — 일반 organizer 에게는 노출 0 (정책 OK).
- 4-step 진행도 시각화 약함 (현재 step 표시 외 잠금/완료 시각 부재).

**시안 요구사항**:
- 진입점 표시 = **A1 sub-tab 의 4번째 옵션** (super_admin 권한 가드)
- 4-step 진행도 bar 강화: ✅ 완료 / 🔵 현재 / ⚪ 미완 / 🔒 잠금
- 각 step 의 "왜 이 단계가 필요한가" 1줄 안내 (협회 정책 가드 컨텍스트)
- step 간 이동 = 이전/다음 (회귀 시 데이터 보존)

**보존 항목**:
- super_admin 권한 가드 (organizer / TAM 에는 진입 차단)
- 4-step 자체 (협회 박제 / 시리즈 / 종별 / 권한 위임)
- step 간 데이터 흐름 (state)

**모바일 (≤720px)**:
- 진행도 bar = 가로 스크롤 칩 (4 step)
- 본문 1열 stack

**자체 검수**:
- 06 §3 / §5 / §6 / §7 (E등급 자체 영역 — AppNav X / 어드민 sidebar 사용)

---

### 3-B1. `AdminTournamentSetupHub.jsx` — 셋업 hub (depends_on 시각화 + 모바일 sticky)

**현재 결함**:
- 8 카드 grid (`sm:grid-cols-2`) — 모바일 1열 / 잠금 의존 시각화 약함.
- 사용자 시나리오: "5번 신청 정책" 카드 클릭 → 무반응 → 이탈.
- 모바일에서 공개 버튼 (sticky 부재) — 스크롤 多.

**시안 요구사항**:
- **8 카드 진행도 bar 강화**:
  - 상단에 큰 progress bar (예: "5/8 완료 / 공개까지 3 단계")
  - 각 카드에 ✅ 완료 / 🔵 진행중 / ⚪ 미시작 / 🔒 잠금 상태 뱃지
  - 잠금 카드 클릭 시 **toast** ("3번 종별을 먼저 완료해주세요") — 비활성 카드는 disabled 시각
- **depends_on 시각 화살표 / 의존선** — 카드 간 연결선 (PC) / 모바일은 텍스트 ("→ 3번 완료 후")
- **모바일 (≤720px) 공개 버튼 sticky bottom** — "공개하기" 또는 "필수 항목 N개 남음"
- 각 카드 본문 = 현재 SetupChecklist 패턴 유지 (제목 / 요약 / 액션 버튼)
- 8 카드 = 시리즈 / 대회정보 / 종별 / 팀 / 대진표 / 매치 / 사이트 / 공개 (운영 룰 그대로)

**보존 항목**:
- `SetupChecklist` / `SetupProgress` / `canPublish` 비즈 로직 시그니처 (변경 0)
- 각 카드 라우팅 (clicking → /divisions / /teams / /bracket 등)
- 공개 게이트 (모든 필수 완료 시만 publish 활성)

**모바일 (≤720px)**:
- 8 카드 1열 stack + 의존 텍스트
- 공개 버튼 sticky bottom (`position: sticky; bottom: 0`)
- progress bar = 카드 상단 고정 (스크롤 시 보임)

**자체 검수**:
- 06 §3 / §5 / §6 / §7

---

### 3-C1. `AdminTournamentMatches.jsx` — 매치 표 (검증 banner 통합)

**현재 결함**:
- `PlaceholderValidationBanner` (PR-Admin-3) 가 matches 페이지에만 표시 — 다른 페이지의 검증은 SetupChecklist 에만.
- 사용자가 site 페이지에서 publish → 422 → 사유 안내가 hub 에만.

**시안 요구사항**:
- **PlaceholderValidationBanner 패턴 표준화** — 모든 어드민 페이지 상단에 동일 배너 패턴:
  - 빨간 ⚠️ banner (필수 항목 미완) — 사이트 미박제 / 종별 0건 / 매치 0건 / 기록원 0명 등
  - 노란 ⚠️ banner (권장 항목 미완) — 사진 미첨부 / 알기자 미발행 등
  - 녹색 ✅ banner (모든 통과)
- 본 시안에는 matches 페이지의 banner 위치 + 톤 명시 (모든 페이지에 카피 적용할 베이스)
- 매치 표 본문 = 현재 디자인 보존 (기록 모드 / 스코어 입력 / Q-by-Q)

**보존 항목**:
- 기록 모드 카드 (`recording-mode-card`)
- 스코어 입력 동작
- 매치 표 컬럼 (시간 / 코트 / 팀A vs 팀B / 종별 / 상태)

**모바일 (≤720px)**:
- 매치 표 = 카드 1열 + 가로 스크롤 (필요 시)
- banner = 풀폭

**자체 검수**:
- 06 §3 / §5 / §6 / §7

---

### 3-C2. `AdminTournamentDivisions.jsx` — 종별 운영 (다중 종별 발견성)

**현재 결함**:
- 다중 종별 (예: 강남구협회장배 U10/U12/U14/U16) 의 발견성 약함 — 신규 운영자가 종별이 뭔지부터 막힘.
- `/divisions` 페이지가 셋업 hub 3번 카드 안에만 진입.

**시안 요구사항**:
- 상단에 **종별 추가 hero CTA** — "종별 추가하기" (예시: "유소년 U10 / U12 / U14 / U16 박제")
- 종별 list = **카드 grid** (각 카드 = 종별명 / format / settings 요약 / 팀 수 / 매치 수)
- 카드 클릭 시 inline edit (`format` selector + `settings` 박스)
- 빈 상태 = "첫 종별 추가하기" CTA + 예시 5개 (3x3 男 / 3x3 女 / 5x5 / U16 / 시니어)
- 멀티 종별 사용 사례 안내 1줄 ("강남구협회장배 = U10/U12/U14/U16 4 종별 박제")

**보존 항목**:
- `division-generator-modal` 시그니처
- `format` / `settings` 데이터 구조
- 종별 추가/수정/삭제 API 동작

**모바일 (≤720px)**:
- 카드 1열 / inline edit 풀폭
- 추가 CTA sticky bottom

**자체 검수**:
- 06 §3 / §5 / §6 / §7

---

### 3-D1. `AdminTournamentCompleted.jsx` — 종료 후 hub (신규)

**현재 결함 (S5)**:
- 대회 종료 (status='completed') 후 결과 박제 / 통계 / 알기자 발행 / 영상 매핑 / 사진 첨부 진입점이 분산.
- 운영자가 "이번 대회 우승팀이 누구지? 결과 페이지가 어디?" — 추측.
- 알기자 카피 검수는 `/admin/news` (별 영역) — 점프 어려움.

**시안 요구사항**:
- 셋업 hub 와 유사한 **카드 grid** — 5 카드:
  1. **결과 박제** — 우승팀 / 준우승 / 4강 / 베스트5 / MVP (자동 채움 + 수동 보정)
  2. **통계 대시보드** — 매치 수 / 득점 / 베스트 플레이어 차트
  3. **알기자 발행** — 종료 알기자 draft 생성 → `/admin/news` 이동
  4. **사진/영상 첨부** — 사진 업로드 + 라이브 영상 매핑
  5. **사이트 archive** — 공개 사이트 종료 상태 박제 (포스터 / 결과 정리)
- 상단 hero = 우승팀 표시 (트로피 이모지 🏆 + 팀명 + 사진)
- 모든 카드 = 진행도 뱃지 (✅ 완료 / ⚪ 미완)

**보존 항목**:
- 기존 결과 데이터 (final_standings) API 동작
- `/admin/news` 라우팅 (별 영역 진입)

**모바일 (≤720px)**:
- 5 카드 1열 / hero 풀폭
- sticky bottom = "공개 사이트 보기" CTA

**자체 검수**:
- 06 §3 / §5 / §6 / §7 (E등급)

**JSDoc 매트릭스 의무** (06 §6):
```
* 진입: 셋업 hub (status='completed' 자동 전환) / 직접 라우팅 가능
* 복귀: AdminTournamentAdminList (목록)
* 에러: 권한 없음 = 일반 사용자 redirect / 미종료 = 셋업 hub redirect
```

---

### 3-E1. `AdminTournamentPlayoffs.jsx` — 순위전 hub (신규 / G1)

**현재 결함 (G1 갭)**:
- 운영 `/playoffs` 라우트는 Phase 1 PR-Admin-6 으로 박제 진행 중 — 시안 부재 (5/16 박제 / 5/20 BDR-current sync 이전).
- 5 섹션 (결선 토너먼트 / 8강 / 4강 / 결승 / standings) 운영 패턴 시안 X.

**시안 요구사항**:
- 5 섹션 = **탭 또는 stack**:
  1. **순위표 (standings)** — 조별 순위 + 승점 + 득실
  2. **8강 진출** — 8 팀 매트릭스
  3. **4강** — 4 팀 매트릭스
  4. **결승** — 2 팀 매치 카드 (큰)
  5. **결과 박제** — 우승 / 준우승 / 3위 결정전
- 각 섹션 = 매치 카드 grid (팀A vs 팀B 점수 + 코트 + 시간 + LIVE pulse)
- `AdvancePlayoffsButton` 위치 = standings 섹션 하단 (진출 확정 후 다음 단계 활성화)
- 시각 일관 = `AdminTournamentBracket.jsx` 시각 패턴 카피 (사용자 영역 `/tournaments/[id]/bracket` 와 다른 점 = action 버튼 있음)

**보존 항목**:
- `AdvancePlayoffsButton` 시그니처 + 진출 로직
- `StandingsTable` 데이터 구조

**모바일 (≤720px)**:
- 탭 = 가로 스크롤 칩
- 매치 카드 1열

**자체 검수**:
- 06 §3 / §5 / §6 / §7

---

### 3-E2. `AdminTournamentProspectus.jsx` — PDF 분석 → wizard 자동 채움 (신규 / G2+G3)

**현재 결함 (G2/G3 갭)**:
- 운영 `/wizard/prospectus` 박제 진행 중 — 시안 부재.
- 흐름: PDF 업로드 → AI 분석 → 미리보기 → wizard 진입 (자동 채움) — 시각 미정.
- 진입점 부각 0 (헤더 actions 작은 "요강 분석" 버튼만).

**시안 요구사항**:
- 4-step 진행:
  1. **PDF 업로드** — `prospectus-upload-dropzone` 활용 (드래그/드롭 + 클릭 업로드)
  2. **AI 분석 진행** — loading spinner + "추출 중 N/M 항목" 진행도
  3. **미리보기** — `prospectus-analysis-preview` 활용 (추출된 필드 시각 — 대회명 / 일시 / 종별 / 신청정책 / 시상 등)
  4. **확인 → wizard 진입** — "다음" 버튼 클릭 시 wizard 자동 채움 + 사용자 검토
- 각 step 진행도 bar
- AI 실패 / 추출 부족 시 = "수동 입력으로 전환" CTA (Legacy wizard 진입)
- 진입점 표시 = **A1 / A2 sub-tab 의 3번째 옵션** (대회 목록 + QuickCreate 양쪽에서 진입)
- **draft 복구 배너** — 미완 prospectus draft 검출 시 "이전 분석 이어하기 →"

**보존 항목**:
- `prospectus-upload-dropzone` / `prospectus-analysis-preview` 컴포넌트 시그니처 (현재 박제 중 — fix 1~3 보존)
- sessionStorage draft 동작
- AI 분석 API (`/api/web/tournaments/wizard/analyze-prospectus`) 시그니처

**모바일 (≤720px)**:
- 4-step = 가로 스크롤 칩
- 미리보기 = 1열 stack (필드별 카드)
- 드롭존 = 풀폭 + 클릭 업로드 강조

**자체 검수**:
- 06 §3 / §5 / §6 / §7

---

## 4. 디자인 원칙 13 룰 (00-master-guide §13 룰 일괄)

> 본 의뢰는 **E등급 자체 영역** (어드민 — AppNav X / 별도 sidebar 사용). 13 룰 중 §A AppNav 7 룰은 적용 외 (S9 갭은 운영 박제 단계에서 별도 처리). §B / §C / §D 만 강제.

### 4-A. AppNav (헤더) 7 룰 — **적용 외**

본 의뢰는 어드민 영역 — AppNav 적용 X (별도 sidebar / TournamentAdminNav 셸 사용).

→ 시안 작업 시 AppNav 컴포넌트는 그리지 않음. 어드민 셸은 **자체 디자인** (06 §7 E등급 자체 영역 룰).

### 4-B. 더보기 5그룹 IA 룰 (룰 8~9)

```
8. 가짜링크 4건 영구 제거: gameResult / gameReport / guestApps / referee 추가 ❌
9. refereeInfo (둘러보기 그룹) + mypage (계정·도움 첫 항목) — 기존 유지
```

→ 본 의뢰는 어드민 영역 — 더보기 메뉴 직접 영향 0. 단 어드민 sidebar 메뉴에서도 가짜링크 신규 추가 ❌.

### 4-C. 디자인 토큰 룰 4가지 (룰 10~13)

```
10. 색상: var(--accent / --cafe-blue / --ok / --bg-alt / --ink-mute) 등 토큰만
    ❌ #ff6b88 같은 하드코딩 hex 금지
    ❌ 핑크 / 살몬 / 코랄 / 따뜻한 베이지 절대 금지

11. 아이콘: Material Symbols Outlined 또는 시안 검증된 이모지
    ❌ lucide-react 금지

12. 라운딩: 버튼 / 카드 4px 표준 (8px 카드도 OK)
    ❌ pill 9999px 금지 (정사각형 W=H 원형 = 50% 사용)

13. 모바일: 720px 통일 / iOS input 16px / 버튼 44px 터치 타겟
    인라인 grid repeat(N, 1fr) 사용 시 720px 분기 필수
```

→ **본 의뢰 강조**:
- 어드민 sidebar / TournamentAdminNav 셸도 var(--*) 토큰만
- 진행도 bar = `var(--accent)` (BDR Red)
- 잠금 카드 = `var(--ink-mute)` + 50% opacity
- ✅ 완료 = `var(--ok)` / ⚠️ 경고 = `var(--warn)` / ⚠️ 에러 = `var(--err)`

### 4-D. 카피 / 모바일 룰 (룰 11~13 — 위 4-C 와 중복)

추가 강조:
- placeholder 5단어 이내 / "예: " 시작 ❌
- 어드민 버튼 카피 = 격식 / 짧고 명확 (예: "공개하기" / "종별 추가" / "PDF 업로드")
- 모바일 720px 분기 + 버튼 44px + iOS input 16px

---

## 5. 사용자 결정 §1~§8 보존 명시

본 의뢰는 어드민 영역 (E등급) — 사용자 결정 §1~§8 의 직접 영향은 §1 (AppNav) / §2 (더보기) 적용 외. 단 다음은 보존 의무:

| § | 결정 | 본 의뢰 영향 |
|---|------|------------|
| §1 헤더 (AppNav) | 9 메인 탭 / 더보기 / utility bar | 어드민 영역 — 적용 외 (별도 sidebar) |
| §2 더보기 5그룹 | 가짜링크 4건 ❌ | 어드민 sidebar 도 가짜링크 신규 ❌ |
| §3 팀 페이지 | 레이팅 stat 제거 | 본 의뢰 직접 영향 0 |
| §4 프로필 | 이모지 아이콘 / 사이드바 | 본 의뢰 직접 영향 0 |
| §5 메인 페이지 | Hero 카로셀 | 본 의뢰 직접 영향 0 |
| §6-1 글로벌 카피 | "서울 3x3 농구 커뮤니티" / "다음카페" 보존 (시안 우선) | 어드민 카피 — 일반 라벨 사용 |
| §6-2 About 운영진 실명 ❌ | 일반 라벨 | 본 의뢰 직접 영향 0 |
| §7 모바일 (720px / iOS 16px / 44px) | 글로벌 가드 | **본 의뢰 적용 의무** ✅ |
| §8 인증/권한 | captainId 매칭 | 본 의뢰 직접 영향 0 |

→ **본 의뢰 강제 적용 = §7 모바일 룰**. 나머지는 충돌 시 사용자 확인 필수.

---

## 6. 산출물 형식

### 6-1. 산출물 위치

```
사용자 → Claude.ai Project (BDR 디자인 시스템 관리) 에 본 의뢰 전달
  ↓
Claude.ai → 새 zip 생성 (BDR vX.Y 또는 동일 vX.Y 갱신)
  ↓
사용자 → zip 풀이 → 임시 폴더
  ↓
PM (Claude Code) → CLAUDE.md §🗂️ 워크플로우 5단계 진행:
  1. 새 zip 풀이 → 임시 폴더
  2. 기존 Dev/design/BDR-current/ → Dev/design/_archive/BDR vX.Y/ 이동
  3. 새 zip 의 Dev/design/BDR vX.Y/ → Dev/design/BDR-current/ 카피
  4. zip 최상위 옛 시안 (있으면) → _archive/v2-original/
  5. Dev/design/README.md 갱신 + commit "design: BDR-current sync vX.Y"
```

### 6-2. 산출물 파일 (10 시안)

**수정 시안 7건** (기존 `Dev/design/BDR-current/screens/` 갱신):
1. `AdminTournamentAdminList.jsx` (A1 / 진입점 통합 CTA)
2. `AdminTournamentWizard1Step.jsx` (A2 / sub-tab 4 옵션)
3. `AdminWizardAssociation.jsx` (A3 / 4-step 진행도)
4. `AdminTournamentSetupHub.jsx` (B1 / depends_on 시각화 + 모바일 sticky)
5. `AdminTournamentMatches.jsx` (C1 / PlaceholderValidationBanner 표준화)
6. `AdminTournamentDivisions.jsx` (C2 / 다중 종별 발견성)
7. (선택) `components.jsx` / `tokens.css` — 새 컴포넌트 (검증 banner / 진행도 bar) 추가 시

**신규 시안 3건** (`Dev/design/BDR-current/screens/` 추가):
8. `AdminTournamentPlayoffs.jsx` (E1 / 5 섹션 / 결승 / standings — G1)
9. `AdminTournamentCompleted.jsx` (D1 / 종료 후 5 카드 hub — S5)
10. `AdminTournamentProspectus.jsx` (E2 / PDF → AI → 미리보기 → wizard — G2/G3)

### 6-3. README.md 갱신

`Dev/design/BDR-current/README.md` 에 다음 추가:
```markdown
## vX.Y 갱신 (2026-05-XX) — 대회 생성/관리 흐름 리디자인

### 수정 (7건)
- AdminTournamentAdminList — 단일 진입점 CTA + 4 옵션 sub-tab
- AdminTournamentWizard1Step — sub-tab 추가 / draft 복구 배너
- AdminWizardAssociation — 4-step 진행도 강화
- AdminTournamentSetupHub — depends_on 시각화 + 모바일 sticky
- AdminTournamentMatches — PlaceholderValidationBanner 표준화
- AdminTournamentDivisions — 다중 종별 발견성

### 신규 (3건)
- AdminTournamentPlayoffs — 5 섹션 순위전 hub
- AdminTournamentCompleted — 종료 후 5 카드 hub
- AdminTournamentProspectus — PDF → AI → wizard 자동 채움
```

### 6-4. 박제 후 자체 검수 (06 의무)

박제 완료 후 `06-self-checklist.md` 모든 항목 ✅ 의무:
- §1 AppNav — **적용 외** (E등급 자체 영역)
- §2 더보기 — 가짜링크 신규 0
- §3 디자인 토큰 — var(--*) 100% / hex 0 / lucide-react 0
- §5 모바일 — 720px / iOS 16px / 44px 통과
- §6 연결성 — JSDoc 매트릭스 첨부
- §7 E등급 자체 영역 룰 통과
- §8 산출물 체크리스트 (BDR-current 갱신 / README 갱신)

---

## 7. 첫 응답 형식 (Claude.ai 응답 의무)

00-master-guide §3 답습:

```
✅ BDR 디자인 의뢰 확인 — 대회 생성/관리 흐름 전면 리디자인

이해:
- 진입점 통합 (A1/A2/A3) — 단일 CTA + 4 옵션 sub-tab
- 셋업 hub 강화 (B1) — depends_on 시각화 + 모바일 sticky
- 운영 진행 통합 (C1/C2) — PlaceholderValidationBanner 표준 + 다중 종별 발견성
- 종료 흐름 신규 (D1) — 5 카드 hub (결과/통계/알기자/사진/사이트)
- 운영 신규 시안 (E1/E2) — playoffs / prospectus

사용자 결정 §1~§8 보존:
- §7 모바일 (720px / iOS 16px / 44px) 적용 의무
- §1 / §2 (AppNav / 더보기) — E등급 자체 영역이라 적용 외

AppNav frozen — 03 카피 (본 의뢰는 어드민 영역 — 적용 외)

자체 검수 (06):
- §3 디자인 토큰 (var(--*) / 라운딩 4px / Material Symbols)
- §5 모바일 (720px / iOS 16px / 44px)
- §6 연결성 (JSDoc 매트릭스)
- §7 E등급 자체 영역 룰

산출물: Dev/design/BDR-current/screens/ (수정 7 + 신규 3 = 10 시안) + README.md 갱신

질문 / 가정 (PM 결정 필요 시):
1. [필요 시 진행 중 보고]

작업 시작.
```

---

## 8. 위반 시 즉시 중단

00-master-guide §"위반 시 즉시 중단" 답습 — 다음 발견 시 작업 중단 + PM 보고:

- **사용자 결정 §1~§8 위반** (헤더 / 더보기 / 카피 / 모바일)
- **신규 메인 탭 추가** (메인 탭 9개 변경 — PM 확인 필수)
- **DB 미지원 기능을 시안에** (라우트 존재 / 데이터 출처 불명)
- **API/데이터 패칭 변경 제안** — 본 의뢰는 UI만 (운영 코드 변경 0)
- **AppNav frozen 변경 제안** — 03 카피만, 재구성 ❌

### 위반 자동 검수 4 케이스 (00 §회귀 방지)

- ❌ main bar 우측에 "더보기 ▼" dropdown 또는 아바타 노출
- ❌ 모바일(≤768px)에서 "☀ 라이트 ☾ 다크" 듀얼 라벨 노출
- ❌ 검색/쪽지/알림 버튼에 border/bg 박스 (`.btn` / `.btn--sm` 등) 적용
- ❌ main bar 우측 아이콘 순서가 [다크, 검색, 쪽지, 알림, 햄버거] 이외로 변경·누락

→ 본 의뢰는 어드민 영역이라 위 4 케이스 자체가 발생 0 (AppNav 적용 외). 단 어드민 셸 (sidebar / TournamentAdminNav) 도 유사한 회귀 검수 (sidebar 아이콘 / 그룹 / 카피) 적용.

---

## 부록 A — 9 사각지대 → 시안 매핑

| 사각지대 | 영향도 | 해소 시안 | 영역 |
|---------|-------|---------|------|
| S1 진입점 3중화 | ★★★★★ | A1 + A2 + A3 (단일 CTA + sub-tab 4 옵션) | 진입점 통합 |
| S2 셋업 hub 진행도 | ★★★★ | B1 (depends_on 시각화 + progress bar) | 셋업 hub |
| S3 draft 복구 | ★★★★ | A2 + E2 (draft 복구 배너) | 진입점 통합 + 신규 |
| S4 다중 종별 발견성 | ★★★★ | C2 (종별 추가 hero CTA + 5 예시) | 운영 진행 |
| S5 종료 후 흐름 | ★★★ | D1 (종료 후 5 카드 hub) | 종료 흐름 (신규) |
| S6 권한 분기 UI 비대칭 | ★★★ | A1 (권한 가드 + 시각 분리 — 보조) | 진입점 통합 |
| S7 모바일 셋업 hub | ★★★ | B1 (모바일 sticky 공개 버튼) | 셋업 hub |
| S8 검증 피드백 산발 | ★★★ | C1 (PlaceholderValidationBanner 표준) | 운영 진행 |
| S9 AppNav vs 어드민 정합 | ★★ | (운영 박제 단계에서 별도 처리 — 본 의뢰 외) | — |

## 부록 B — BDR-current/ 갭 3건 → 시안 매핑

| 갭 | 시안 | 영역 |
|----|------|------|
| G1 playoffs hub | E1 `AdminTournamentPlayoffs.jsx` (신규) | 운영 신규 |
| G2 prospectus 진입점 | E2 `AdminTournamentProspectus.jsx` (신규) | 운영 신규 |
| G3 wizard 자동 채움 | E2 (4-step → wizard 진입) | 운영 신규 |

---

**의뢰 끝.** 사용자가 본 파일을 Claude.ai Project (BDR 디자인 시스템 관리) 에 그대로 붙여 넣어 의뢰 시작 가능.
