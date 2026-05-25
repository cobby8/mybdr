# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 1B v2.18 BDR-current sync (Cowork 의뢰서 §0~§6)
- **상태**: ✅ 완료 — sync + 회귀 검수 6 케이스 통과 + phase-ledger ⑩ ✅ + commit + push 완료
- **현재 담당**: pm (대기)
- **다음**: Phase 1A 의뢰 (관리자 10 시안) Claude.ai 전달 (사용자 수동) → zip 도착 시 동일 절차로 sync

## 기획설계 (planner-architect) — 대회 생성/관리 UX 점검 + 시안 설계 / 2026-05-25

🎯 목표: 대회 생성/관리 흐름의 UI/UX 사각지대 식별 + Claude.ai 시안 설계 의뢰 패키지 + 운영 박제 4 Phase 계획 수립 (코드 변경 0).

---

### 1. 인벤토리 — 대회 생성/관리 페이지 트리 (페이지 24건 + 컴포넌트 12건)

**비유**: 건물의 층별 안내도. 1F = 대시보드 hub, 2F = 대회 셋업, 3F = 운영 진행, 4F = 종료 처리.

| 영역 | 경로 | 역할 | 시안 (BDR-current) | 박제 등급 |
|------|------|------|------------------|----------|
| 진입 | `/tournament-admin` | 대시보드 (탭 5개 + 단체 카드 + 검색) | AdminTournamentAdminHome.jsx ✅ | A |
| 단체 | `/tournament-admin/organizations` | 내 단체 목록 | AdminOrganizations.jsx ✅ | A |
| 단체 | `/tournament-admin/organizations/[orgId]` | 단체 상세 + 시리즈 관리 + AbsorbTournaments + MoveSeries | (시안 없음) | E |
| 단체 | `/tournament-admin/organizations/[orgId]/members` | 단체 멤버 권한 | (시안 없음) | E |
| 단체 | `/tournament-admin/organizations/new` | 새 단체 만들기 | (시안 없음) | E |
| 시리즈 | `/tournament-admin/series` | 시리즈 목록 | (시안 부분) | C |
| 시리즈 | `/tournament-admin/series/[id]` | 시리즈 상세 + 회차 list | (시안 없음) | E |
| 시리즈 | `/tournament-admin/series/[id]/add-edition` | 회차 추가 (간단 폼) | (시안 없음) | E |
| 시리즈 | `/tournament-admin/series/[id]/edit` | 시리즈 편집 | (시안 없음) | E |
| 시리즈 | `/tournament-admin/series/new` | 새 시리즈 만들기 | (시안 없음) | E |
| 대회 생성 | `/tournament-admin/tournaments/new/wizard` (기본) | **QuickCreateForm** 압축 1-step (이름 + 시작일 + 시리즈) | AdminTournamentWizard1Step.jsx ✅ | A |
| 대회 생성 | `/tournament-admin/tournaments/new/wizard?legacy=1` | **LegacyWizardForm** 3-step (대회정보→참가설정→확인) | (시안 없음 / 폐기 예정) | E |
| 대회 생성 | `/tournament-admin/tournaments/new/wizard/prospectus` | **prospectus AI 분석** (PDF 업로드→분석→draft) | (시안 없음 / Phase 3 박제) | E |
| 대회 생성 | `/tournament-admin/wizard/association` | **협회 마법사** (super_admin / 4-step) | AdminWizardAssociation.jsx ✅ | A |
| 대회 목록 | `/tournament-admin/tournaments` | 본인 대회 카드 list | AdminTournamentAdminList.jsx ✅ | A |
| 대회 설정 hub | `/tournament-admin/tournaments/[id]` | **SetupChecklist 8 항목 + 진행도 bar + 공개 게이트** | AdminTournamentSetupHub.jsx ✅ | A |
| 대회 편집 | `/tournament-admin/tournaments/[id]/wizard` | EditWizard 3-step (대회정보→참가설정→확인) | AdminTournamentEditWizard.jsx ✅ | A |
| 대회 설정 | `/tournament-admin/tournaments/[id]/divisions` | 종별 운영 방식 (format + settings) | AdminTournamentDivisions.jsx ✅ | A |
| 대회 설정 | `/tournament-admin/tournaments/[id]/teams` | 참가팀 관리 (토큰 발급 / 매뉴얼 신청) | AdminTournamentTeams.jsx ✅ | A |
| 대회 설정 | `/tournament-admin/tournaments/[id]/bracket` | 대진표 생성 + DualGroup 에디터 + DivisionGenerate | AdminTournamentBracket.jsx ✅ | A |
| 대회 설정 | `/tournament-admin/tournaments/[id]/site` | 사이트 공개 설정 (서브도메인 / 템플릿 / 색상) | AdminTournamentSite.jsx ✅ | A |
| 대회 운영 | `/tournament-admin/tournaments/[id]/matches` | 매치 표 + 기록 모드 + 스코어 입력 | AdminTournamentMatches.jsx ✅ | A |
| 대회 운영 | `/tournament-admin/tournaments/[id]/playoffs` | 순위전 hub (5 섹션 / 결승 / standings) | (시안 없음 / Phase 1 PR-6) | C |
| 대회 운영 | `/tournament-admin/tournaments/[id]/admins` | 대회 관리자 권한 | AdminTournamentAdmins.jsx ✅ | A |
| 대회 운영 | `/tournament-admin/tournaments/[id]/recorders` | 기록원 지정 | AdminTournamentRecorders.jsx ✅ | A |
| 기타 | `/tournament-admin/templates` | 사이트 템플릿 (준비중) | (없음) | E |

**컴포넌트 12건** (`src/components/tournament/`): schedule-form / registration-settings-form / team-settings-form / bracket-settings-form / inline-series-form / division-generator-modal / tournament-copy-modal / game-time-input / game-ball-input / game-method-input / prospectus-upload-dropzone / prospectus-analysis-preview

**`_components/` 페이지 전용**: NextStepCTA / PlaceholderValidationBanner / AdvancePlayoffsButton / DivisionGenerateButton / SetupChecklist / StandingsTable / recording-mode-card / recording-mode-trigger

---

### 2. UX 사각지대 식별 — 9 가지 (영향도 우선순위)

| # | 사각지대 | 영향도 | 사용자 시나리오 | 비유 |
|---|---------|-------|---------------|------|
| **S1** | **대회 생성 진입점 3중화** — QuickCreate / LegacyWizard / Prospectus AI / 협회 마법사가 모두 `/tournament-admin/tournaments/new/wizard*` 아래 분산. 사용자는 어떤 걸 써야 할지 모름 | ★★★★★ | "이전에 만든 대회 비슷하게 만들고 싶은데 어디 가야 하지?" / Prospectus 진입점은 헤더 actions 의 작은 "요강 분석" 버튼만 — 발견 0 | 같은 식당 입구가 3개인데 안내문이 없음 |
| **S2** | **셋업 hub 진행도 표기 미사용** — SetupChecklist 8 항목 중 잠금 의존(depends_on) 시각화 약함. 사용자는 "지금 5번을 클릭했는데 왜 잠겼지?" 추측 필요 | ★★★★ | 신규 운영자가 "5번 신청 정책" 카드 클릭 → 무반응 → 이탈 | 건물 엘리베이터에 "5층은 4층 통과 후" 안내 부재 |
| **S3** | **재진입 시 draft 복구 미지원** — QuickCreate는 즉시 DB INSERT (draft) / LegacyWizard는 state in-memory / Prospectus는 sessionStorage. 3가지 다른 동작 | ★★★★ | 사용자가 LegacyWizard 2단계까지 입력 → 실수로 탭 닫음 → 처음부터 다시 | 종이 신청서 작성 중 화재로 다 타는데 사본이 없음 |
| **S4** | **다중 종별 대회 흐름 발견성 약함** — `/divisions` 페이지가 셋업 hub 3번 카드 안에만 있고 (이전 3+4 통합), 신규 운영자는 종별이 뭔지부터 막힘 | ★★★★ | 강남구협회장배 같은 유소년 6종별 대회에서 "U10 / U12 / U14 / U16" 룰 박제 흐름 발견 어려움 | 건물 안내도에 "전용 공간"이 작게 표시됨 |
| **S5** | **종료 후 흐름 누락** — 대회 종료 (status='completed') 후 결과 박제 / 통계 / 알기자 발행 / 영상 매핑 / 사진 첨부 진입점이 분산 | ★★★ | 운영자가 "이번 대회 우승팀이 누구지? 결과 페이지가 어디?" / 알기자 카피 검수는 `/admin/news` (별 영역) | 졸업식 끝났는데 졸업장 어디서 받는지 모름 |
| **S6** | **권한 분기 UI 비대칭** — super_admin / organizer / TAM / 단체 admin 4 권한이 페이지마다 다르게 분기 (대시보드는 합산 / [id] 페이지는 organizer+TAM만 / playoffs도 그 룰). 위임받은 TAM 이 "관리" 버튼 누르면 페이지마다 다름 | ★★★ | TAM 운영자가 대시보드에선 보이지만 시리즈 페이지에서 안 보임 | 동일 사원증인데 층마다 출입 가능/불가 |
| **S7** | **모바일 (≤720px) 셋업 hub 미흡** — 8 카드 grid는 sm:grid-cols-2 만 적용 (모바일 1열). progress bar 위치 / 공개 버튼 sticky 부재 | ★★★ | 운영자가 대회 당일 모바일로 점검 시 스크롤 多 + 공개 버튼 찾기 어려움 | 모바일 화면에서 핵심 버튼이 화면 밖 |
| **S8** | **에러 / 검증 피드백 산발** — PlaceholderValidationBanner (PR-Admin-3) 는 matches 페이지만. 다른 페이지의 검증 (사이트 미박제 / 종별 0건 / 매치 0건) 은 SetupChecklist에서만 노출 | ★★★ | 운영자가 site 페이지에서 publish 버튼 누름 → 422 → "필수 항목 미완료" 안내가 hub에만 있음 | 식당 문 앞에서 거절당했는데 사유 안내가 없음 |
| **S9** | **AppNav frozen / 어드민 영역 정합** — 어드민은 별도 sidebar + TournamentAdminNav (sub-nav) 사용 → AppNav 의 9 메인 탭과 단절. 일반 사용자가 어드민 진입점 발견 어려움 | ★★ | 사용자가 본인이 운영자인지 인지 안 됨 → 햄버거 메뉴 → 더보기 → "관리·도움" 그룹 안 깊숙이 | 본관과 별관이 다른 입구를 쓰는데 연결 통로 안내 없음 |

---

### 3. 운영 vs 시안 갭 (BDR-current/) — **갭 거의 0** ✅

- **BDR-current last sync**: `2026-05-20 03:31` (commit "design: BDR-current sync v2.16 (경기 탭 list/detail/create 시안)")
- **운영 admin commits 이후**: 단 1건 (`948ab04` cron F2 PR-4 위젯) — admin UI 영향 거의 0 (대시보드 위젯 추가만)
- **시안 박제 상태**: 대회 생성/관리 핵심 13 화면 모두 A 등급 ✅
  - AdminTournamentAdminHome (대시보드) / AdminTournamentAdminList (목록) / AdminTournamentSetupHub (셋업 hub) / AdminTournamentWizard1Step (QuickCreate) / AdminTournamentEditWizard (편집) / AdminTournamentDivisions (종별) / AdminTournamentTeams (팀) / AdminTournamentBracket (대진표) / AdminTournamentSite (사이트) / AdminTournamentMatches (매치) / AdminTournamentAdmins (권한) / AdminTournamentRecorders (기록원) / AdminWizardAssociation (협회)

**갭 발견 ⚠️**:
- **G1**: `/playoffs` (Phase 1 PR-Admin-6 신규 hub) — 시안 없음 (5/16 박제 / 5/20 sync 이전)
- **G2**: `/tournaments/new/wizard/prospectus` (Phase 3 박제) — 시안 없음 (5/20 박제 / 5/20 sync 이전 또는 동일 timestamp)
- **G3**: prospectus 결과 → wizard 자동 채움 흐름 — 시안 없음

→ **결론**: Phase 0 (운영 → 시안 역박제) **불필요** — 갭 3건 모두 신규 운영 기능 (시안 미박제) / 5/20 이후 시각 패턴 변경 0. 본 분석 결과로 신규 시안 의뢰가 자연스러움.

---

### 4. 작업 계획 — 4 Phase (총 7~10일 예상)

📋 실행 계획 표:

| Phase | 작업명 | 담당 | 선행 | 시간 | 산출물 |
|-------|--------|------|------|------|--------|
| **0** | (생략) 운영 → 시안 역박제 | — | — | 0 | 갭 0 / 불필요 |
| **1** | 시안 의뢰 패키지 박제 | planner-architect → 사용자 결재 | — | 2h | `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` |
| **2** | 사용자 → Claude.ai Project 시안 의뢰 | 사용자 (외부) | Phase 1 | 1~3일 | 새 zip (BDR vX.Y) |
| **3** | 시안 zip → BDR-current/ 동기화 | pm | Phase 2 | 30분 | `_archive/BDR vX.Y` + `BDR-current/` 갱신 + `design: BDR-current sync` commit |
| **4** | 운영 src/ 박제 (CLI batch) | planner-architect → developer | Phase 3 | 5~7일 | `Dev/design/prompts/tournament-admin-cli-batch-*.md` + 운영 코드 commit 다수 |
| **5** | 박제 후 사후 검수 (Phase A.5 패턴) | tester + reviewer 병렬 | Phase 4 | 1일 | self-checklist 06 통과 + 회귀 0 검증 |

⚠️ developer 주의사항 (Phase 4):
- **API/데이터 패칭 절대 변경 금지** (CLAUDE.md 디자인 작업 원칙)
- AppNav frozen (`03-appnav-frozen-component.md`) 100% 카피
- 디자인 토큰 (`02-design-system-tokens.md`) — var(--color-*) / Material Symbols / 4px / pill 9999px ❌
- 자체 검수 (`06-self-checklist.md`) 13 룰 통과 의무
- 권한 분기 (super_admin / organizer / TAM / 단체 admin) 기존 로직 100% 보존
- 비즈 로직 시그니처 변경 0 (SetupChecklist / SetupProgress / canPublish / DivisionGenerateButton 등)

---

### 5. 시안 의뢰 패키지 (초안 — Phase 1 박제용)

**파일명**: `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (사용자 결재 후 박제)

**핵심 내용 (10줄 초안)**:
1. **작업명**: "대회 생성/관리 흐름 전면 리디자인 Phase X (2026-05-25)" — 9 사각지대 (S1~S9) 해소 + 단일 진입점 일관화
2. **사용자 결정 §1~§8 보존**: 의무. 헤더 / 더보기 / 카피 / 모바일 (`01-user-design-decisions.md`)
3. **AppNav frozen**: 03 카피 100% 그대로 — 어드민 sidebar / TournamentAdminNav 와의 정합성 의뢰 (S9)
4. **디자인 토큰**: 02 — var(--color-*) / Material Symbols / rounded-[4px] / pill 9999px ❌
5. **대상 페이지** (4 그룹 + 신규 2):
   - **A. 진입 통합**: AdminTournamentAdminHome (대시보드 — 3 진입점 안내) + AdminTournamentWizard1Step (마법사 — Prospectus 진입점 부각 / S1)
   - **B. 셋업 hub 강화**: AdminTournamentSetupHub (depends_on 시각화 / 모바일 sticky / S2, S7)
   - **C. 운영 진행 통합**: AdminTournamentMatches + AdminTournamentBracket + AdminTournamentDivisions + Playoffs hub 박제 (S4) + **신규 시안 1**: `AdminTournamentPlayoffs.jsx` (G1)
   - **D. 종료 흐름**: 신규 시안 1: `AdminTournamentCompleted.jsx` (결과 박제 / 알기자 진입 / 사진 첨부 진입 — S5)
   - **E. prospectus AI**: **신규 시안 1**: `AdminTournamentProspectus.jsx` (PDF 업로드 → 미리보기 → wizard 진입 — G2, G3)
6. **재진입 / draft 복구 UX 의뢰**: S3 — wizard 진입 시 "이전 작성 이어하기" 배너 (sessionStorage 또는 DB draft 검출)
7. **에러 / 검증 통합 패턴**: S8 — PlaceholderValidationBanner 패턴을 모든 페이지에 일관 적용 (배너 컴포넌트 1개)
8. **권한 분기 UI**: S6 — 위임 (TAM) / 소유 (organizer) / super_admin 시각 구분 표준 (배지 / 색상)
9. **자체 검수 06 §체크리스트**: 13 룰 완수
10. **산출물 형식**: 새 BDR vX.Y zip / `Dev/design/BDR vX.Y/screens/Admin*.jsx` 형식

---

### 6. 위험 + 가드

| 위험 | 가드 |
|------|------|
| API/데이터 패칭 변경 (회귀 위험) | Phase 4 developer prompt 에 명시 + reviewer git diff 검증 의무 |
| SetupChecklist 비즈 로직 (canPublish / SetupProgress) 변경 | 시그니처 변경 0 강제 / vitest 회귀 가드 |
| 권한 분기 (4 권한) 시각 변경 시 누수 | tester 가 각 권한 가드 통과 검증 (super_admin / organizer / TAM / 단체 admin 4 시나리오) |
| AppNav frozen 위반 (메인 탭 9개 변경) | 자동 reject (`06-self-checklist.md`) |
| 시리즈 inline 박제 회귀 | InlineSeriesForm 시그니처 보존 |
| **Prospectus AI fix unstaged 5 파일과 충돌** | Phase 4 진입 전 사용자 결재 — 7번 권장 |
| **wizard step state 회귀** (LegacyWizard 폐기 시점) | LegacyWizardForm 의 `?legacy=1` 안전망 유지 / 1주 운영 검증 후 별도 PR 폐기 |

---

### 7. prospectus AI unstaged 5 파일 처리 권장

**현재 unstaged 파일** (M 5건):
- `package-lock.json` / `package.json`
- `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx`
- `src/app/api/web/tournaments/wizard/analyze-prospectus/route.ts`
- `src/components/tournament/prospectus-analysis-preview.tsx`
- `src/lib/ai/prospectus-prompt.ts`
- `src/lib/ai/prospectus-schema.ts`

**권장 옵션**: **A. 분리 commit (즉시) + push 보류**

**사유** (왜):
1. 5 파일 모두 prospectus AI 영역 (Phase 1~3) — 사용자가 "보류" 결정했지만 코드는 진행됐던 fix 1~3 (errors 매핑 / prompt 보강 / schema 보강 / UI 보강) 으로 추정 → 잃기 아까움
2. Phase 4 (운영 박제) 시 `wizard/page.tsx` 가 충돌할 수 있음 — 사전 commit 으로 git 충돌 회피
3. 보류 = "이후 우선순위 결정 보류" 이지 "코드 폐기" 가 아님 — git 히스토리 보존이 안전
4. push 보류 = dev / main 머지 시점은 사용자 결재 후 (디자인 시안 완료 후 통합)

**대안 옵션 평가**:
- B. stash: git stash 는 IDE 재시작 시 잃기 쉬움 (3+ 일 보존 위험) ❌
- C. 그대로: Phase 4 진입 시 매번 우회 — 다른 세션과 충돌 위험 ❌
- D. 폐기 (git checkout --): 작업물 손실 ❌

**구체 commit 안** (사용자 결재 후 PM 진행):
```bash
git add src/lib/ai/prospectus-prompt.ts src/lib/ai/prospectus-schema.ts \
  src/components/tournament/prospectus-analysis-preview.tsx \
  src/app/api/web/tournaments/wizard/analyze-prospectus/route.ts \
  src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx \
  package.json package-lock.json
git commit -m "fix(ai): prospectus AI Phase 3 fix 1~3 보류 보존"
# push 보류 (subin 로컬만 / 사용자 결재 후 dev 머지)
```

---

### 📋 다음 단계 (사용자 결재 대기)

| # | 단계 | 결재 필요 | 결과물 |
|---|------|----------|--------|
| 1 | unstaged 5 파일 — 옵션 A 분리 commit 진행? | 사용자 결재 | commit 1건 (subin 로컬 / push 보류) |
| 2 | Phase 1 시안 의뢰 패키지 박제? | ✅ 완료 | `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (617 LOC) |
| 3 | Phase 2 (Claude.ai Project 의뢰) 진행 시기? | 사용자 자체 일정 | 새 zip |
| 4 | Phase 4 (운영 박제) CLI batch 분해 시점? | 사용자 결재 (시안 완료 후) | `Dev/design/prompts/tournament-admin-cli-batch-*.md` 다수 |

### 8. Phase 1 박제 완료 (2026-05-25)
- 의뢰 패키지: `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (617 LOC)
- 영역 A/B/C/D/E 정의 + 신규 시안 3건 (playoffs/completed/prospectus) 요구
- 9 사각지대 (S1~S9) + 3 갭 (G1~G3) → 10 시안 (수정 7 + 신규 3) 매핑 부록 첨부
- 13 룰 일괄 + 사용자 결정 §1~§8 보존 명시 + 첫 응답 형식 + 위반 시 즉시 중단 룰 포함
- 사용자: Claude.ai Project (BDR 디자인 시스템 관리) 에 본 파일 전달 시 의뢰 시작 가능

## 구현 기록 (developer)
(아직 없음)

## 테스트 결과 (tester)
(아직 없음)

## 리뷰 결과 (reviewer)
(아직 없음)

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-26 | Phase 1B v2.18 BDR-current sync (Cowork 의뢰서 §0~§6) | ✅ commit `a71c9a3` + push (3 commit 전송 / origin/subin 정합) / BDR-current = 15 파일 (jsx 9 UA1~UD3 + css 6) / pre-snapshot `_archive/BDR-current-2026-05-26-pre-v2.18/` 149 파일 보존 / 회귀 검수 6 케이스 통과 (더보기/RDM/--color-*/lucide-react/9999px/가짜링크/icon-btn) / 인코딩 우회 = UTF-8 BOM 임시 파일 1회성 (원본 스크립트 변경 0) / phase-ledger ⑩ ✅ + 다음 액션 ☑ |
| 2026-05-25 | Phase 1 — 대회 생성/관리 리디자인 시안 의뢰 패키지 박제 (planner-architect) | ✅ `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (617 LOC / 범위 500~800 권장 안) / 10 시안 정의 (수정 7 = A1 list / A2 wizard1step / A3 association / B1 setupHub / C1 matches / C2 divisions + 신규 3 = D1 completed / E1 playoffs / E2 prospectus) / 9 사각지대 + 3 갭 → 시안 매핑 부록 첨부 / 13 룰 + 사용자 결정 §1~§8 보존 명시 / 첫 응답 형식 + 위반 시 중단 룰 / 사용자 → Claude.ai Project (BDR 디자인 시스템 관리) 전달 가능 |
| 2026-05-25 | 대회 생성/관리 UX 점검 + 시안 설계 계획 수립 (planner-architect) | ✅ 인벤토리 24 페이지 + 12 컴포넌트 / 9 사각지대 (S1~S9 / 우선순위 매트릭스) / 운영 vs BDR-current 갭 3건 (G1 playoffs / G2 prospectus / G3 wizard 자동 채움) / 4 Phase 계획 (Phase 0 역박제 불필요 → Phase 1 의뢰 패키지 박제 → Phase 4 CLI batch) / unstaged 5 파일 옵션 A (분리 commit + push 보류) 권장 / scratchpad 박제 / 코드 변경 0 / 사용자 결재 4건 대기 |
| 2026-05-25 | Sprint 4 F4-γ LEGACY QS 형식 일괄 정정 (34건 / 사용자 결재 EXECUTE) | ✅ 139 매치 audit → LEGACY 44건 → 안전 정정 34건 (변환 + 헤더 정확 일치) → 일괄 UPDATE → 사후 검증 34/34 OK / LEGACY MISMATCH 10건 보류 / INVALID 25건 별도 분석 / paper SSOT 충돌 0 (형식 변환만) / F2 cron false positive 34건 해결 / `Dev/f4-legacy-qs-audit-2026-05-25.md` 박제 / script 2 정리 |
| 2026-05-25 | Sprint 3 F4 옵션 A 안전 정정 — matchId 257 quarterScores UPDATE | ✅ audit (f4-safe-fix-audit.ts SELECT only) / 139 매치 / 옵션 A 후보 1건 / 사용자 명시 결재 후 UPDATE / 사후 검증 5/45=5/45 OK / Flutter legacy QS 형식 (`{Q4:{home,away}}`) → nested 형식 정정 / script 2 정리 / `Dev/f4-safe-fix-audit-2026-05-25.md` 박제 |
| 2026-05-24 | 제 2회 BDR W 대학동아리 농구대회 결승 대진 박제 (m260 home/away UPDATE) | ✅ 운영 DB UPDATE 1건 / 사전 가드 7건 통과 / home=이화여대 에폭시 ttId=334 (A1 +6) vs away=한체대 KANCE ttId=339 (B1 +48) / status=scheduled 유지 / 임시 스크립트 3건 사후 정리 / 코드 커밋 0 |
| 2026-05-23 | PR-6 (backfill) DRY-RUN | ✅ 2 신규 (backfill-quarter-scores.ts 335 LOC + DRY-RUN 보고서 92 LOC) / 후보 29건 (paper 87 skip 정확) / PBP_MATCHES_HEADER 4건 (m101/110/111/269) 안전 정정 대상 / EXECUTE 금지 (PM 결재 대기) |
| 2026-05-23 | PR-5 (F1 본체) quarterScores 자동 갱신 service layer | ✅ 4 파일 (quarter-scores-sync.ts 148 LOC PURE 헬퍼 + vitest 244 LOC 10 케이스 + match-sync.ts +52 + 테스트 +321) / vitest 78/78 PASS / paper skip 보장 / 회귀 0 |
| 2026-05-23 | Sprint 2 F1 기획설계 (8h) | ✅ 2 PR 권장 (PR-5 본체 6h + PR-6 backfill 2h) / 옵션 A 채택 (service syncSingleMatch + PBP 합 + paper skip = LIVE API L933) |
| 2026-05-21 | PR-4 (F2) daily cron + admin 위젯 + score_consistency_audit 모델 | ✅ 6 파일 (schema +20 / route 316 신규 / 위젯 154 신규 / vitest 248 신규) / 4/4 PASS / 회귀 65/65 PASS / db push + CRON_SECRET 운영 대기 |
| 2026-05-21 | PR-3 (F5) FIBA 룰 가드 (OT1 동점 + winner NULL 차단) | ✅ fiba-rules.ts 121 LOC PURE 헬퍼 + vitest 202 LOC 13 케이스 + 양면 호출 가드 3건 / vitest 60/60 PASS / 매치 124 OT2 재발 방지 |
| 2026-05-21 | PR-2 (F3-β) 어드민 PATCH paper 매치 score 차단 | ✅ matches/[matchId]/route.ts +20 LOC / paper && (homeScore\|awayScore) 변경 시 403 / vitest 20/20 PASS |
| 2026-05-21 | PR-1 (F3-α) MPS deleteMany NOT IN 가드 | ✅ match-sync.ts +15 LOC + vitest +222 LOC 4 케이스 / vitest 27/27 PASS / PBP 패턴 답습 / 회귀 0 |
| 2026-05-21 | Sprint 1 통합 기획설계 (8h) | ✅ 4 별도 PR 권장 (통합 거절 — 영역 분산) / vitest 케이스 18건 박제 / 진입 순서 F3-α → F3-β → F5 → F2 |
| 2026-05-21 | 점수 정합성 paper 모드 정밀 조사 + 시스템 분석 | ✅ paper-mode-precise-audit.ts + Dev/paper-mode-precise-audit-2026-05-21.md / 근본 원인 코드 3건 확정 / F3 Sprint 1 상향 (2h 추가) |
