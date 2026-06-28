# Phase 1C — Master Batch 의뢰서 (PR-1C-2 ~ PR-1C-16, 15 PR 일괄)

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행 완료**: PR-1C-1 UA1 ✅ PR #650 (2026-05-28)
> **선행 의뢰**: `phase-1C-kickoff-cli-prompt-2026-05-28.md` (§2 사전 점검 / §6 자체 검수 / §7 역박제 / §8 안전 가드)
> **개별 prompt 답습**: `phase-1C-2-ua2-uc2-cli-prompt-2026-05-28.md` / `phase-1C-3-ub1-cli-prompt-2026-05-28.md` / `phase-1C-4-ua3-cli-prompt-2026-05-28.md` (각 PR 의 특수 가드 그대로)
> **본 의뢰 범위**: PR-1C-2 ~ PR-1C-16 = **15 PR 일괄 박제** (각 PR commit 분리 / 사용자 결재 시점 1 회)

---

## 1. 한 줄 요약

Phase 1C 잔여 15 PR (사용자 4 + UC1 1 + 관리자 9 + carryover 2) 을 한 batch session 으로 박제. 각 PR = 별 commit + 별 subin → dev PR. 사용자 결재 1 회 (PR-1C-4 §4 결제 옵션) + stop conditions 발동 시 즉시 중단.

---

## 2. 사전 점검 — 1 회만 (kickoff §2 답습)

```
□ git remote -v / fetch / 브랜치 = subin / .env / .env.local
□ PR-1C-1 (#650) 머지 상태 확인 — main 머지면 dev pull 후 진행 / dev only 면 dev pull
□ unstaged: .gitignore (Dev/design/_zips/) — chore commit 으로 우선 처리 후 batch 진입
□ BDR-current/screens/ = 32 파일 (jsx 26 + css 6) — Phase 1A/1B sync 후 cumulative
□ phase-ledger Phase 1 ⑪ = PR-1C-1 만 ✅ 확인
```

→ 결과 요약 → **"이대로 15 PR batch 시작해도 될까요?" 사용자 결재 1 회.**

승인 후 batch 진행. 중간 사용자 결재 = PR-1C-4 §4 결제 옵션 1 회만 (그 외엔 stop conditions 발동 시).

---

## 3. 진행 룰 (★ 가장 중요 — 위반 시 batch 중단)

### 3-1. PR 단위 룰
- ✅ **1 PR = 1 commit = 1 PR**. squash ❌
- ✅ 각 PR 박제 끝나면 즉시 `git push origin subin` + GitHub PR 생성
- ✅ 다음 PR 시작 전 = phase-ledger Phase 1 ⑪ 에 직전 PR ✅ 갱신
- ✅ 각 PR 박제 후 자체 회귀 검수 6 케이스 (kickoff §6) 통과 후 진행. 위반 = batch 중단

### 3-2. 진행 보고 룰
- 매 PR 완료 후 = 사용자에게 1 줄 보고:
  ```
  ✅ PR-1C-N (시안ID) 완료 — PR #XXX. LOC +X -X. 검수 6/6. 다음 PR-1C-(N+1) 시작.
  ```
- 사용자 결재 대기 = ❌ (PR-1C-4 §4 제외). 사용자가 응답 안 해도 자동 다음 PR 시작.
- 1 batch = 1 batch session — 중간 CLI 재시작 ❌ (context 손실 방지)

### 3-3. Stop Conditions (★ 1 건이라도 발동 시 batch 중단 + 사용자 보고)
- ❌ `lint` 또는 `npx tsc --noEmit` 실패
- ❌ 자체 회귀 검수 6 케이스 1 건 이상 위반
- ❌ DB destructive SQL 필요 (DROP / TRUNCATE / 대량 DELETE/UPDATE)
- ❌ 새 API 라우트 / 새 Prisma query / 새 fetch 필요 (리디자인 룰 위반)
- ❌ 시안 의도가 사용자 결정 §1~§8 위반 (가짜링크 / 헤더 변경 / 카피 변경 등)
- ❌ 운영 데이터 모델에 시안 필드 없음 + 카드 hide 로 대응 불가 (예: PA7 디자인 의도 데이터 부족)
- ❌ 사용자 결재 필요 항목 발견 (PR-1C-4 §4 외 신규)

→ 1 건 발동 = 즉시 stop / 이미 push 된 PR 들은 유지 / 미박제 PR 은 보고 후 사용자 결정 기다림.

### 3-4. 사용자 결재 시점 (Pause 필수)
- **PR-1C-4 §4 결제 옵션**: 옵션 A/B/C 중 사용자 결정 받기 전 PR-1C-4 박제 ❌. 결재 받고 진행 후 batch 재개. (권장 = 옵션 B)
- 그 외엔 stop conditions 발동 시만 pause.

---

## 4. PR 순서 + 의존성

| PR | 시안 | 운영 LOC | 기준 | 의존 | 사용자 결재 |
|----|------|---------|------|------|------------|
| 1C-2 | UA2 TournamentDetail + UC2 MyRegistrationStatus | 684 | 사용자 진입 핵심 | PR-1C-1 ✅ | ❌ |
| 1C-3 | UB1 TournamentCompleted (status='completed' 분기) | 684+ (UA2 갱신본) | UA2 위에 분기 추가 | PR-1C-2 | ❌ |
| **1C-4** | **UA3 TournamentEnroll (B3 보강)** | **1563** | 결제 옵션 결정 | PR-1C-3 | **✅ §4 결재** |
| 1C-5 | UC1 MyActivity | 881 | 사용자 마지막 | PR-1C-2 (MyRegistrationStatus variant) | ❌ |
| 1C-6 | PA5 AdminTournamentMatches | 74 | admin 최소 | (독립) | ❌ |
| 1C-7 | PA1 AdminTournamentAdminList | 137 | admin 진입 | PR-1C-6 | ❌ |
| 1C-8 | PA8 AdminTournamentPlayoffs | 165 | | PR-1C-7 | ❌ |
| 1C-9 | PA4 AdminTournamentSetupHub (B1+B7) | 289 | 1B B7 보존 위 1A B1 추가 | PR-1C-8 | ❌ |
| 1C-10 | PA3 AdminWizardAssociation | 353 | super_admin 가드 | PR-1C-9 | ❌ |
| 1C-11 | PA9 AdminTournamentProspectus (PDF→AI→wizard) | 387 | 4-step + 신뢰도 chip | PR-1C-10 | ❌ |
| 1C-12 | PA6 AdminTournamentDivisions | 547 | | PR-1C-11 | ❌ |
| 1C-13 | PA7 AdminTournamentCompleted (신규 라우트) | 0 (신규) | `[id]/completed/page.tsx` 신규 | PR-1C-12 | ❌ |
| 1C-14 | PA2 AdminTournamentWizard1Step (4 옵션 sub-tab) | 1668 | 가장 큰 PR — 마지막에 | PR-1C-13 | ❌ |
| 1C-15 | AdminTournamentTeams (carryover) | 1599 | v2.18 carry / 변경 최소 | PR-1C-14 | ❌ |
| 1C-16 | AdminTournamentBracket (carryover) | 976 | v2.18 carry / 변경 최소 | PR-1C-15 | ❌ |

**합계**: 15 PR / 운영 ~9400 LOC / 시안 ~3500 LOC / 예상 박제 시간 = 1 session

---

## 5. PR 별 압축 spec

### PR-1C-2 / 1C-3 / 1C-4 — 개별 prompt 참조
- PR-1C-2 = `phase-1C-2-ua2-uc2-cli-prompt-2026-05-28.md` 그대로
- PR-1C-3 = `phase-1C-3-ub1-cli-prompt-2026-05-28.md` 그대로
- PR-1C-4 = `phase-1C-4-ua3-cli-prompt-2026-05-28.md` 그대로 + §4 사용자 결재 필수

### PR-1C-5 — UC1 MyActivity (881 line)

**시안**: `BDR-current/screens/MyActivity.jsx` (B1 갭의 진입 보강 — MyRegistrationStatus 재사용)
**운영**: `src/app/(web)/profile/activity/page.tsx`
**핵심**:
- 4 섹션 = 내 대회 / 내 신청 경기 / 내 팀 / 저장한 항목
- 5 상태 필터 = 전체 / 승인 대기 / 결제 대기 / 진행 중 / 종료
- "내 대회" 섹션 안 = `<MyRegistrationStatus variant="compact" />` 재사용 (PR-1C-2 결과)
- 더보기 메뉴 신규 추가 ❌ (룰 §2)
- "내 매너" 카드 추가 (Phase 2B 의 BG2 양측 의존 — 본 PR 에서는 시안만 박제, 데이터는 Phase 2 sync 후)
**추출 컴포넌트**: 0~3 (my-activity-section / my-activity-filter 등 — 기존 활용 가능 시 추출 ❌)
**가드**: MyRegistrationStatus 위치 이동 ❌ (PR-1C-2 와 동일 — `_components/my-registration-status.tsx` 그대로)

### PR-1C-6 — PA5 AdminTournamentMatches (74 line · admin 최소)

**시안**: PA5 (C1 PlaceholderValidationBanner 3-tone + 기록 모드 + 매치 표)
**운영**: `src/app/(admin)/tournament-admin/tournaments/[id]/matches/page.tsx`
**핵심**: 운영 작아 (74 line) → 시안 단순 박제. PlaceholderValidationBanner 컴포넌트 추출 (err/warn/ok 3-tone)
**추출 컴포넌트**: 1~2 (placeholder-validation-banner.tsx / matches-table.tsx)

### PR-1C-7 — PA1 AdminTournamentAdminList (137 line · admin 진입)

**시안**: PA1 (A1 · 4 옵션 인라인 panel = Quick / Legacy / Prospectus / 협회 + 상태 탭 + 카드 list)
**운영**: `src/app/(admin)/tournament-admin/tournaments/page.tsx`
**핵심**: 단일 hero CTA → 4 옵션 인라인 panel 전환. 4 옵션 = 시안 그대로 (Quick / Legacy / Prospectus / 협회)
**추출 컴포넌트**: 1~2 (admin-entry-cta.tsx — 4 옵션 panel)

### PR-1C-8 — PA8 AdminTournamentPlayoffs (165 line)

**시안**: PA8 (E1 · 5 섹션 탭 = 순위표 / 8강 / 4강 / 결승 / 결과 + AdvancePlayoffsButton)
**운영**: `src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/page.tsx`
**핵심**: 5 섹션 탭 박제. AdvancePlayoffsButton 컴포넌트 추출. G1 (playoffs 시안 부재) 해소
**추출 컴포넌트**: 1~2 (advance-playoffs-button.tsx / playoffs-tabs.tsx)

### PR-1C-9 — PA4 AdminTournamentSetupHub (289 line · B1 + B7 보존)

**시안**: PA4 (B1 depends_on 시각화 + 잠금 STEP 7·8 toast + 모바일 sticky 공개 버튼 + **Phase 1B B7 사용자 미리보기 카드 보존**)
**운영**: `src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx`
**핵심**: B1 + B7 같이. 운영 기존 B7 (사용자 미리보기 카드) **변경 ❌**. B1 (depends_on / 잠금 toast / sticky 공개) 추가
**추출 컴포넌트**: 1~2 (setup-hub-step-lock.tsx / setup-hub-mobile-sticky.tsx)

### PR-1C-10 — PA3 AdminWizardAssociation (353 line · super_admin 가드)

**시안**: PA3 (A3 · 4-step stepper = 협회 → 시리즈 → 종별 위임 → 권한)
**운영**: `src/app/(admin)/tournament-admin/wizard/association/page.tsx`
**핵심**: 4-step stepper + super_admin 가드 (시안 헤더 명시). 각 step 컨텍스트 가드 — 운영 미인증 ❌ 인 경우 redirect/error
**추출 컴포넌트**: 1~2 (association-wizard-stepper.tsx)
**가드**: super_admin role 검증 = 기존 운영 로직 유지 (시각만)

### PR-1C-11 — PA9 AdminTournamentProspectus (387 line · PDF→AI→wizard)

**시안**: PA9 (E2 · 4-step = PDF 업로드 → AI 분석 → 미리보기 → wizard 자동 채움 + 신뢰도 high/mid/low chip + 수동 입력 fallback)
**운영**: `src/app/(admin)/tournament-admin/tournaments/new/wizard/prospectus/page.tsx`
**핵심**: 4-step UI 박제. AI 분석 결과 신뢰도 chip (high/mid/low). 수동 입력 fallback 보강
**추출 컴포넌트**: 2~3 (prospectus-step-upload / prospectus-confidence-chip / prospectus-manual-fallback)
**가드**: AI API 추가 ❌ — 운영 기존 AI 호출 흐름 유지 (시각만)

### PR-1C-12 — PA6 AdminTournamentDivisions (547 line)

**시안**: PA6 (C2 · 종별 추가 hero CTA + 5 예시 + 멀티 종별 운영 안내 + 종별 카드 grid)
**운영**: `src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx`
**추출 컴포넌트**: 1~3 (division-add-cta / division-card / multi-division-notice)

### PR-1C-13 — PA7 AdminTournamentCompleted (신규 라우트)

**시안**: PA7 (D1 · 5 카드 hub = 결과 / 통계 / 알기자 / 사진영상 / 사이트 archive + 🏆 우승팀 hero)
**운영**: **신규 라우트** `src/app/(admin)/tournament-admin/tournaments/[id]/completed/page.tsx`
**핵심**:
- ❌ UB1 (사용자 측 종료) 와 혼동 금지 — UB1 = `/tournaments/[id]` status 분기 / PA7 = `/tournament-admin/tournaments/[id]/completed` 신규
- 5 카드 = 결과 / 통계 / 알기자 / 사진영상 / 사이트 archive (관리자 측 후속 작업 hub)
- Setup Hub (PA4 / `[id]/page.tsx`) 의 status='completed' 일 때 CTA "종료 후 hub" 링크 추가
**추출 컴포넌트**: 2~3 (admin-completed-hero / admin-completed-card-grid)
**가드**: 신규 라우트는 사이드바 (admin nav) 에 항목 추가 — 기존 admin nav 구조 검증 + 추가

### PR-1C-14 — PA2 AdminTournamentWizard1Step (1668 line · 가장 큰 PR)

**시안**: PA2 (A2 · 4 옵션 sub-tab + QuickCreate 압축 폼 + draft 복구 배너 + 3-step 흐름 안내)
**운영**: `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx`
**핵심**:
- 4 옵션 sub-tab = Quick / Legacy / Prospectus / 협회 (PA1 의 4 옵션과 동일 — 일관 노출)
- QuickCreate 압축 폼 — 최소 필드 (name / dates / venue)
- draft 복구 배너 — localStorage 또는 server-side draft 데이터 (기존 활용)
- 3-step 흐름 안내
**추출 컴포넌트**: 3~5 (wizard-sub-tab / wizard-quick-create-form / wizard-draft-banner / wizard-step-guide)
**가드**: 가장 큰 PR — LOC +600 ~ +1000 예상. 박제 1 session 내 완수 가능 여부 확인 후 진행. 분할 필요 시 stop + 보고

### PR-1C-15 — AdminTournamentTeams (carryover · 1599 line)

**시안**: Phase 1B v2.18 carryover (변경 0 — v2.19 에 그대로 유지)
**운영**: `src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx`
**핵심**: 변경 최소 — 운영 코드 안 시안 패턴 (Material Symbols / var(--*) / 4px radius) 일관 검수
**추출 컴포넌트**: 0 (기존 활용)
**가드**: 시안 변경 0 = 운영 변경도 최소 (시각 일관성 검수 PR)

### PR-1C-16 — AdminTournamentBracket (carryover · 976 line)

**시안**: Phase 1B v2.18 carryover
**운영**: `src/app/(admin)/tournament-admin/tournaments/[id]/bracket/page.tsx`
**핵심**: 동일 — 변경 최소 / 시각 일관성 검수
**추출 컴포넌트**: 0

---

## 6. 안전 가드 (kickoff §8 답습 — 매 PR 적용)

### 절대 금지
- ❌ main 직접 push (subin → dev PR 만)
- ❌ 운영 DB destructive 작업 (DROP / TRUNCATE / 대량 DELETE/UPDATE) — 본 batch = UI 박제 / DB 변경 0 이 정상
- ❌ prisma migrate reset / db push --accept-data-loss
- ❌ /api/v1/* 변경 (Flutter 영향)
- ❌ 새 API 라우트 / 새 Prisma query / 새 fetch
- ❌ 신규 BDR-current/ 폴더 (CLI sync 가 처리 / Phase 1A/1B sync 결과 변경 ❌)

### 의무
- ✅ /api/web/* 응답 키 = snake_case 검증 (errors.md 재발 5회)
- ✅ Material Symbols Outlined + Pretendard + Space Grotesk
- ✅ var(--color-*) 변수만 (하드코딩 색상 0)
- ✅ lucide-react import 0
- ✅ rounded-full / 9999px 0 (정사각형 W=H 50% OK)
- ✅ 가짜링크 (gameResult / gameReport / guestApps / referee) 0
- ✅ 13 룰 위반 자동 reject (Project Knowledge 00 §13 룰)

---

## 7. 자체 회귀 검수 6 케이스 (매 PR 후 필수 — kickoff §6 답습)

```
□ ❌ main bar 우측 "더보기 ▼" / 아바타 노출 = 없음
□ ❌ 모바일(≤768px) 듀얼 라벨 = 없음
□ ❌ 검색·쪽지·알림 box (.btn 박스) = 없음
□ ❌ main bar 5 아이콘 순서 = [다크, 검색, 쪽지, 알림, 햄버거]
□ ❌ 하드코딩 색상 = 0 (var(--color-*) 변수만)
□ ❌ lucide-react import = 0
```

→ 위반 1 건 발견 = 해당 PR 박제 reject + batch 중단 + 사용자 보고.

---

## 8. 산출물 (CLI → 사용자, batch 끝)

```
1. PR-1C-2 ~ PR-1C-16 = 15 PR push 완료 + GitHub PR 링크 list
2. phase-ledger Phase 1 ⑪ = 15 PR ✅ 갱신
3. .claude/scratchpad.md = batch 작업 로그 15 줄
4. 신규 컴포넌트 list (_components/ + _v2/ + admin/_components/ 등)
5. 미푸시 commit 알림 (있을 경우)
6. stop conditions 발동 PR list (있을 경우) + 미박제 PR + 사용자 결재 대기 항목
```

**최종 status table 예시**:
```
| PR     | 시안 ID | 상태 | PR # | LOC      | 검수  |
|--------|--------|------|------|----------|------|
| 1C-2   | UA2+UC2 | ✅   | #651 | +X -X    | 6/6 |
| 1C-3   | UB1    | ✅   | #652 | +X -X    | 6/6 |
| 1C-4   | UA3    | ⏸    | -    | -        | -   | (사용자 §4 결재 대기)
| ...    | ...    | ...  | ...  | ...      | ... |
```

---

## 9. 사용자 (수빈) 의 다음 액션

### batch 시작 시
```
☐ 본 prompt CLI 에 전달 → §2 사전 점검 결재 1 회
```

### batch 진행 중
```
☐ PR-1C-4 §4 결제 옵션 결재 (CLI 가 도달 시점에 질의)
☐ stop conditions 발동 시 결재 (있을 경우)
```

### batch 끝 후
```
☐ 15 PR (또는 박제된 PR) subin → dev → main 결재 (CLAUDE.md §🚦)
☐ 미박제 PR 또는 stop conditions 발동 PR 후속 처리 결정
```

---

## 10. 결재 후 CLI 다음 한 줄 응답 형식

```
✅ Phase 1C Batch 의뢰 확인 — 15 PR 일괄 박제

이해: PR-1C-2 ~ PR-1C-16 = 사용자 4 + UC1 1 + 관리자 9 + carryover 2 = 15 PR. 각 PR commit 분리. 사용자 결재 1 회 (PR-1C-4 §4). stop conditions 7 종 발동 시 즉시 중단.

사전 점검 6 단계 시작. 결재 받기 전 박제 ❌.
```

→ 위 형식으로 응답 후 §2 사전 점검 6 단계 실행 + 결재 1 회 → batch 진입.

---

## 11. 시작 — CLI 에 한 줄로 전달

```
Read Dev/design/prompts/phase-1C-batch-cli-prompt-2026-05-28.md 하고 §2 사전 점검부터 시작해줘. unstaged .gitignore 는 PR-1C-2 진입 전에 chore commit 으로 우선 처리해줘.
```

---

**의뢰서 끝.** 본 batch 한 session 으로 PR-1C-2 ~ PR-1C-16 박제 완수 / 사용자 결재 1 회 + stop conditions 시 / 끝나면 최종 status table 보고.
