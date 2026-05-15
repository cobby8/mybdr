# 작업 스크래치패드

## 현재 작업
- **요청**: BDR v2.14 시안 전체 박제 완료 — Admin-9 WizardAssociation commit + push 완료
- **상태**: 종료
- **현재 담당**: pm

## 진행 현황표 (Admin 박제 — BDR v2.14)
| 단계 | 상태 |
|------|------|
| Admin-1~7-A 시안 박제 | ✅ main 진입 완료 (다른 세션 PR #517) |
| Admin-7-B Sub-B1 (SetupHub) | ✅ commit `24fcf7b` |
| Admin-7-B Sub-B2 (EditWizard) | ✅ commit `efcc103` |
| Admin-7-B Sub-B3 (Wizard1Step new/wizard) | ✅ commit `06069a4` |
| Admin-8-A (Games/Courts/Teams) | ✅ no-op (Admin-4-B `a9e7f05` 박제 완료) |
| Admin-8-B (TournamentDetail/AuditLog/TransferOrganizer) | ✅ no-op (Admin-4-A `705ebd0` 박제 완료) |
| **Admin-9 (WizardAssociation)** | ✅ **commit `4c482cd` push 완료 — 본 세션 박제** |
| **BDR v2.14 시안 전체 박제 완료** 🎉 | ✅ 미박제 시안 0건 |

## 후속 큐 (별도 세션)
- **AppNav utility 좌측 메뉴 (소개/요금제/도움말)**: 임시 숨김 (JSX 주석 보존). 후속 결정 = 페이지 콘텐츠 박제 후 복원 / 영구 제거 / footer·drawer 이전
- **AppNav SSR admin 메뉴 정합**: 첫 페인트부터 admin 진입 노출 — (web)/layout.tsx getAuthUser 에 admin_role / association SELECT 확장
- **PR-G5.5-followup-B**: 매치 PATCH route 통합 (status='completed' 시 division_rule=0 분기 → advanceTournamentPlaceholders)
- **PR-G5.5-NBA-seed**: 8강/4강 NBA 시드 표준 generator (교차 시드 + 2^N 올림 + bye)
- PR-G5.7 double_elim / PR-G5.8 swiss (운영 사용 0)
- PR-G5.2 dual-generator refactor
- recorder_admin Q1~Q6 결재 대기 (PR1~3 commit 완료)
- Phase 6 PR3 협회 마법사 referee 옵션 (PR2 완료 후 후속)
- Phase 19 PR-T1~T5 / PR-S10.4 / PR-S10.7 / PR-S10.8 / PR-Stat1~Stat5 결재 대기
- Phase 23 PR4 / PR6 / Phase A.7 의뢰서
- Phase 3.5 유청소년 결합 코드 후속
- PR-S9 / UI-1.4 entry_fee / GNBA 8팀 코치 안내
- Phase E 잔여 14 라우트 시안 박제 → CLI 박제

## 미푸시 commit (subin 브랜치)
- **0건** (`4c482cd` Admin-9 + `06069a4` Sub-B3 + `40a3f87` editions apiToken 모두 origin/subin push 완료)

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 기획설계 (planner-architect)

### Admin-9 WizardAssociation 박제 — 영향 분석 (2026-05-16)

#### 🚨 핵심 발견 — 미박제 (Admin-N 시각 박제 0건) + Phase 6 PR2 비즈 본문 보존 영역
- **운영 commit 이력**: `39e7aab` (PR1 API) / `79e72de` (PR2 본체) / `12daf56` (PR3 Step 4 Referee) — Admin-N 시각 박제 commit **0건**
- **grep 박제 마크**: `Admin-9|AdminPageHeader|hideHeader|topbarRight` 검색 결과 = **0 hit** (다른 "박제" 단어는 Phase 6 비즈 박제 의미)
- **WizardShell.tsx 헤더**: line 49~57 `<h1>새 협회 만들기</h1>` + `<p>super_admin 전용 — ...</p>` 인라인 Tailwind. **eyebrow / breadcrumbs / × 종료 / 일반 마법사 전환 링크 = 모두 미박제**

#### 시안 vs 운영 매핑
| 시안 (AdminWizardAssociation 69 LOC) | 운영 위치 | 박제 |
|--------------------------------------|----------|------|
| `<AdminShell hideHeader={true}>` — AppShell 헤더 숨김 | `page.tsx` (헤더 별도 컴포넌트 없음 — admin layout 이 처리) | ❌ |
| `topbarRight` eyebrow "협회 마법사 · 진행 중" (Navy 11px uppercase mono) | 운영 미존재 | ❌ |
| `topbarRight` "일반 대회 마법사로" Link → `setRoute('adminWizardTournament')` | 운영 미존재 | ❌ |
| `topbarRight` × 종료 button (confirm + `setRoute('adminDashboard')`) | 운영 미존재 (WizardShell.tsx 가 progress + nav 만) | ❌ |
| `<AssociationWizard backRoute backLabel shellMode="admin">` 본문 | `WizardShell.tsx` + `Step1~4` + `WizardConfirm` 6 파일 (Phase 6 PR2/PR3 비즈) | ✅ 비즈 본문 박제됨 |
| (시안 미반영) progress bar 4 step 원형 | `WizardShell.tsx` line 60~101 progress bar 5 step | ✅ 운영 우위 |
| (시안 미반영) 이전/다음/생성 버튼 | `WizardShell.tsx` line 116~147 | ✅ 운영 우위 |

→ **시안 = 얇은 wrapper (헤더 슬롯만)** / **운영 = 비즈 본문 (Step 1~5 + 권한 가드 + sessionStorage + API 4 호출)**

#### 운영 우위 (시안 미반영)
- **Step 5 확인 단계** (PR2): 시안 4 step 만 / 운영 5 step (확인 = 최종 제출 가드)
- **Step 4 Referee 사전 등록** (PR3 `12daf56`): 시안 미반영
- **권한 4분기** (`loading` / `unauthenticated` / `unauthorized` / `authorized`): 시안 mockHasPermission boolean 만
- **POST API 4건 순차 호출** + rollback 없음 (운영자 수동 정정 spec)
- **sessionStorage draft 박제** (`useAssociationWizardDraft` hook)

#### Phase 6 PR2/PR3 비즈 보존 영역 — 절대 건드리지 말 것
- **`page.tsx`**: 인증 useEffect (line 47~95) / canProceedAtStep (line 99~134) / handleSubmit POST 4건 (line 155~288) / 5 step JSX 분기 (line 326~351)
- **`WizardShell.tsx`**: progress bar 5 step / canProceed disabled 가드 / submitting label 변경 / error 표시
- **Step1~4 + WizardConfirm**: 폼 본문 (Zod 정합 검증 / Step2 user 검색 / Step3 4 fee 정수 / Step4 referee row 추가)

#### 박제 옵션 결정 — **권장 옵션 A (보수적)**

| 옵션 | 범위 | 비즈 보존 | LOC | 위험 | 권장 |
|------|------|-----------|-----|------|------|
| 0 (no-op) | 변경 없음 | ✅ | 0 | NIL | ❌ Admin-7-B Sub-B1~B3 와 일관성 깨짐 (다른 마법사는 모두 AdminPageHeader 박제) |
| **A (보수적)** | `WizardShell.tsx` line 49~57 헤더 블록을 AdminPageHeader 로 교체 + breadcrumbs 신규 + actions slot 에 (1) "일반 대회 마법사로" 링크 + (2) × 종료 confirm 버튼 박제 | ✅ 100% (progress / nav / Step 본문 0 변경) | +30/-9 | LOW | ⭐ |
| B (중간) | A + sidebar mode 시각 (v2.8.1 사용자 결정 2026-05-15) 박제 — admin layout 이 이미 sidebar 제공이므로 시안 의도와 자동 일치. 추가 작업 0 | ✅ | +0 | NIL | (A 와 통합 — 별도 작업 불필요) |
| C (적극적) | B + 진입 카드 시안 박제 (v2.7 풀스크린 → v2.8.1 sidebar 이행 시각) | ⚠️ Step 1~5 흐름 외부에 진입 카드 추가 = 별 페이지 | +60 | MEDIUM | ❌ 별 PR (진입 카드 = `/tournament-admin` 메인의 협회 마법사 진입 카드 영역 — 별 페이지 박제 큐) |

**권장 사유 (옵션 A)**:
1. **Sub-B1 / Sub-B2 / Sub-B3 패턴 일관성** — 마법사 페이지 = 모두 AdminPageHeader (eyebrow + breadcrumbs + actions slot) 박제 완료. 본 페이지만 인라인 Tailwind 헤더 = 시각 불일치
2. **시안 topbarRight 3 요소 100% 동등 박제 가능** — eyebrow (Sub-B3 와 동일 카피 패턴) + Link (router.push) + button (confirm + router.push)
3. **Phase 6 PR2/PR3 비즈 0 위협** — 헤더 블록 (`<div className="mb-6"> ... </div>` 9 LOC) 만 교체. progress bar / Step 본문 / nav / error / API 호출 모두 변경 0
4. **v2.8.1 sidebar 유지 자동 보존** — admin layout 이 이미 sidebar 제공 (CLAUDE.md AppNav 룰) → 시안 의도와 자동 일치 (시안의 v2.7 풀스크린 회귀 위험 0)

**옵션 C 보류 사유**:
- 시안 진입 카드 = `/tournament-admin` 메인 페이지의 협회 마법사 진입 카드 영역 — 본 페이지 (`/tournament-admin/wizard/association`) 범위 외
- 진입 카드 박제는 별 페이지 (Admin Dashboard 진입 카드) 큐로 분리 권장

#### developer TODO (옵션 A)

1. **`WizardShell.tsx` 헤더 교체** (line 49~57, 9 LOC) → AdminPageHeader 블록 (대략 30 LOC):
   ```tsx
   <AdminPageHeader
     breadcrumbs={[
       { label: "ADMIN" },
       { label: "대회 운영자 도구" },
       { label: "협회 마법사" },
     ]}
     eyebrow="협회 마법사 · 진행 중"
     title="새 협회 만들기"
     subtitle="super_admin 전용 — 협회 본체 + 사무국장 + 단가표를 차례로 등록합니다."
     actions={
       <>
         <Link
           href="/tournament-admin/tournaments/new/wizard"
           className="text-xs text-[var(--color-text-muted)] underline underline-offset-[3px]"
         >
           일반 대회 마법사로
         </Link>
         <button
           type="button"
           onClick={() => {
             if (confirm("진행 중인 작성을 종료하시겠습니까?")) {
               router.push("/tournament-admin");
             }
           }}
           className="btn btn--sm"
           aria-label="작성 종료"
         >
           <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
           종료
         </button>
       </>
     }
   />
   ```
2. **import 추가**: `AdminPageHeader` + `Link` (next/link) + `useRouter` (next/navigation) — `WizardShell.tsx` 가 client component 이므로 useRouter 사용 가능
3. **container 보존**: `<div className="mx-auto max-w-3xl">` 유지 (Sub-B2 max-w-3xl 와 일치)
4. **WizardShell.tsx 의 다른 영역 (progress bar / Step children slot / error / nav 버튼) 변경 0**
5. **page.tsx 변경 0** — WizardShell 만 prop 인터페이스 유지 (currentStep / canProceed / submitting / error / onPrev / onNext / onSubmit / children)
6. **검증**:
   - `npx tsc --noEmit` errors=0
   - grep 보존: `handleSubmit` `clearDraft` `current_step` `Step1AssociationForm` `Step4RefereeRegister` `WizardConfirm` 모두 hit 유지
   - 진입 `/tournament-admin/wizard/association` 시각 = 헤더만 변경 (breadcrumbs 추가 + eyebrow Navy + actions 우측 2 요소)
   - `/api/web/admin/associations` POST 정상 동작 (Phase 6 PR2 비즈 회귀 0)

#### 위험도 + 갭
- **위험도**: LOW — Sub-B1/B2/B3 동일 패턴, WizardShell.tsx 헤더 영역 단일 블록만 변경 (+30/-9)
- **v2.8.1 sidebar 유지 (사용자 결정 2026-05-15)** 자동 보존 — admin layout 의 sidebar 가 시안 의도 일치
- **breadcrumbs onClick 미설정** — Sub-B1/B2/B3 동일 패턴 (label only). 후속 PR 에서 일괄 router.push 추가 가능
- **별 PR 권장**:
  - 옵션 C (진입 카드 박제) — `/tournament-admin` 메인 페이지 영역 / 본 PR 범위 외
  - Step 4 Referee 사전 등록 PR3 (`12daf56`) UI 시각 강화 — 별 PR (PR3 비즈 의도와 UI 디자인 결정 분리)
- **단일 PR**: 본 박제 = WizardShell.tsx 1 파일 헤더 단일 블록 — Sub-B3 동일 LOC 규모, 단일 commit `style(admin): Admin-9 WizardAssociation 박제` 권장

---

### Admin-8-B TournamentDetail/AuditLog/TransferOrganizer 박제 — 영향 분석 (2026-05-16)

#### 🚨 핵심 발견 — Admin-4-A 가 이미 박제 완료 + TournamentDetail page.tsx 운영 미존재
- **`audit-log/page.tsx`** + **`transfer-organizer/page.tsx`** 2 파일 모두 commit `705ebd0` (2026-05-15 Admin-4-A) 에서 **AdminPageHeader + admin-stat-pill[data-tone] 박제 완료**. 박제 마크 코멘트 `2026-05-15 Admin-4-A 박제 (v2.14)` 명시.
- **`[id]/page.tsx` 운영 파일 미존재** — `705ebd0` commit 메시지 명시: `"/admin/tournaments/[id]/page.tsx" 운영 미존재 (모달 + sub-route 패턴) → 박제 스킵 (신규 라우트 박제 금지 룰)`. 운영은 `/admin/tournaments` 리스트 → 모달 → sub-route (audit-log / transfer-organizer) 패턴.
- **`transfer-organizer-form.tsx`** = 클라이언트 폼. `705ebd0` 박제 범위 외 (commit 메시지 명시: `본 PR 미변경 — 별 PR 권장`). 다만 이미 신 토큰 (`var(--color-*)`) 사용 중.

#### 박제 현황 (3 파일)
| 파일 | LOC | 박제 마크 | AdminPageHeader | admin-stat-pill | 상태 |
|------|-----|----------|-----------------|-----------------|------|
| `[id]/page.tsx` | N/A | — | — | — | ❌ **운영 파일 미존재 (의도적)** |
| `[id]/audit-log/page.tsx` | 232 | `Admin-4-A 박제 (v2.14)` line 24~27 + line 125 + line 209 | ✅ line 126 (4단계 breadcrumbs + actions) | ✅ line 211 SEVERITY_TONE info/warn/err/err 매핑 | ✅ 박제 완료 |
| `[id]/transfer-organizer/page.tsx` | 188 | `Admin-4-A 박제 (v2.14)` line 22~26 + line 79 | ✅ line 80 (4단계 breadcrumbs + actions arrow_back) | ⚠️ "현 주최자/위임 운영자 카드 = '읽기 전용' admin-stat-pill 보조" 명시되었으나 line 105~ 는 inline `var(--color-border)` border 카드 — 박제 부분 누락 | ✅ 박제 완료 (보조 pill 누락은 의도) |
| `[id]/transfer-organizer/transfer-organizer-form.tsx` | 352 | line 197 inline 코멘트만 (`warning 박제`) | ❌ 클라이언트 폼 — header 없음 | ❌ 미적용 | ❌ Admin-4-A 박제 제외 — 별 PR 큐 |

#### Admin-4-A `705ebd0` 박제 범위 (commit body 발췌)
1. `/admin/tournaments` — admin-tournaments-content.tsx STATUS_TONE + admin-stat-pill[data-tone]
2. `audit-log/page.tsx` — AdminPageHeader + SEVERITY_TONE (info/warn/err) admin-stat-pill
3. `transfer-organizer/page.tsx` — AdminPageHeader (eyebrow + breadcrumbs + actions)

**보존 검증 (commit body)**: `prisma.` / `fetch(` / `useState` / `useEffect` / `server.action` / `admin_logs` / `TournamentAdminMember` = 0 코드 매치. 코멘트만 변경. tsc errors=0.

#### 박제 범위 결정 — **권장 옵션 0 (no-op)**

| 옵션 | 범위 | LOC 증가 | 위험도 | 권장 |
|------|------|----------|--------|------|
| **0 (no-op)** | 이미 박제 완료 — 변경 없음. 본 PR skip | 0 | NIL | ⭐ |
| A1 (검수) | 박제 마크 코멘트 일관성 검수 / SEVERITY_TONE 키 정렬 / breadcrumbs onClick 비교만 | +0/-0 ~ +5/-5 | LOW | 보완 차원만 |
| B (transfer-organizer-form 박제) | 클라이언트 폼 (action 분기 / 검색 / 결과 리스트) UI 시각 갱신 — 시안의 위험 액션 패턴 (warning callout / confirm modal) 박제 | +60/-30 | MEDIUM | ❌ 별 PR (위험 액션 영역) |
| C (TournamentDetail page.tsx 신규 생성) | `[id]/page.tsx` 신규 — 시안 454 LOC 박제. 모달 패턴 → 페이지 패턴 IA 전환 | +454 + 모달 제거 | HIGH | ❌ **신규 라우트 박제 금지 룰 위반** |

**권장 사유 (옵션 0)**:
1. **Admin-4-A `705ebd0` 이미 박제 완료** — 2 파일 모두 박제 마크 코멘트 + AdminPageHeader + SEVERITY_TONE 매핑 적용. 추가 박제 = 중복
2. **TournamentDetail page.tsx 운영 미존재 (의도)** — `705ebd0` commit 메시지가 명시: "운영 미존재 (모달 + sub-route 패턴) → 박제 스킵 (신규 라우트 박제 금지 룰)". 운영은 모달 → sub-route IA 채택. 시안 page.tsx 박제 = 운영 IA 재설계 (DB 영향 0 / UI 영향 HIGH)
3. **transfer-organizer-form.tsx 별 PR 권장** — Admin-4-A 도 의도적 skip. 위험 액션 (Tournament.organizerId UPDATE / TAM INSERT) UI 변경은 별도 사용자 결정 필요 (시안 warning callout / confirm modal 패턴 채택 결정)

**옵션 A1 (검수) 발견 사항** (옵션 0 채택 시 후속 큐로만):
- `transfer-organizer/page.tsx` line 24 코멘트 `현 주최자 / 위임 운영자 카드 = "읽기 전용" admin-stat-pill 보조` 가 실제 line 105~ 에 미적용 (inline `var(--color-border)` border 카드 유지). 박제 의도 vs 적용 갭. 별 PR 권장.

#### developer TODO (옵션 0 채택 시)
- **3 파일 변경 0** — 본 PR skip
- scratchpad 작업 로그 1줄 추가: `Admin-8-B 박제 영향 분석 → 옵션 0 (no-op) — Admin-4-A 이미 박제 완료 + page.tsx 운영 미존재 (의도)`
- 다음 작업: Admin-8-C 또는 별 페이지 큐로 이동

#### developer TODO (옵션 A1 채택 시 — 검수 보완만)
1. `audit-log/page.tsx` SEVERITY_TONE 키 정렬 검수 ✓ (info/warning/error/critical 의도)
2. `transfer-organizer/page.tsx` line 105~ "읽기 전용 admin-stat-pill 보조" 박제 누락 확인 → 별 PR 또는 본 PR 보강 결정
3. breadcrumbs onClick 미설정 (Sub-B1/B2/B3 동일 패턴) — 라벨만 표시 ✓
4. tsc 0 확인 / git diff 0 또는 +5/-5 이내

#### 단일 vs 분리 PR 결정
- **옵션 0 채택 시**: PR 자체 미발생. scratchpad 분석 로그만
- **옵션 A1 채택 시**: 단일 commit `style(admin): Admin-8-B 검수 보완` (1~2 파일 < 20 LOC)
- **옵션 B 시도 시**: 별 PR `feat(admin): transfer-organizer-form 위험 액션 UI 박제` — Server Action / Tournament.organizerId UPDATE 동작 보존 + 시안 warning callout + confirm modal 패턴 분석 별도 의뢰

#### 위험도 + 갭
- **위험도**: NIL (옵션 0) / LOW (옵션 A1)
- **의도된 갭 (시안 vs 운영 — 박제 보류)**:
  - **TournamentDetail page.tsx**: 시안은 단일 페이지 (454 LOC) / 운영은 모달 + 2 sub-route (audit-log + transfer-organizer). IA 재설계 = 별 PR (사용자 결정 필요)
  - **AuditLog 시안 추가 요소**: severity timeline 시각 / changes_made JSON diff 시각 / 필터 (action / severity / 기간) — 모두 미박제. 박제 시 DB 쿼리 변경 가능성 (현재 description LIKE %UUID% fallback)
  - **TransferOrganizer 시안 추가 요소**: warning callout (영구 변경 경고) / confirm 2-step modal / 변경 이력 미리보기 — 모두 transfer-organizer-form.tsx 영역 (별 PR)
- **재발 방지**: PM 이 Admin-N-X 박제 요청 시 commit `705ebd0` (Admin-4-A) 박제 범위 + commit body 의 "운영 미존재 (의도)" 명시 확인 후 의뢰 진행

#### Server Action / Prisma 쿼리 보존 영역 (옵션 0/A1 채택 시 자동 보존, 옵션 B 시 필수 주의)
- `audit-log/page.tsx`: `prisma.admin_logs.findMany` (line 56~76 description LIKE fallback) + `prisma.user.findMany` (line 99~ admin_id 매핑) + `enrichDescription` 로직
- `transfer-organizer/page.tsx`: `prisma.tournament.findUnique` (line 40~56 series.organization 조회) + `prisma.tournamentAdminMember.findMany` (line 62~68 TAM 리스트)
- `transfer-organizer-form.tsx`: `/api/web/admin/tournaments/[id]/eligible-users` 검색 fetch + `transfer` / `add` 액션 분기 POST (line 36~352)

---

### Admin-8-A Games/Courts/Teams 박제 — 영향 분석 (2026-05-16)

#### 🚨 핵심 발견 — Admin-4-B 가 이미 박제 완료
3 페이지 모두 **AdminPageHeader (eyebrow + breadcrumbs) + STATUS_TONE 매핑** Admin-4-B `a9e7f05` 박제 완료 상태. Admin-5-A 옵션 A 패턴 = **이미 적용됨**. Admin-8-A 가 동일 범위 박제 시 LOC 변화 거의 0 (no-op).

#### 시안 매핑 (3 페이지)
| 시안 | page.tsx LOC | content.tsx LOC | 시안 status tone (이미 박제 ✅) | 시안 추가 시각 (미박제) |
|------|--------------|-----------------|--------------------------------|----------------------|
| AdminGames (540) | 92 | 268 | live=info / scheduled=ok / done=mute / cancelled=err | live pulse dot / 점수 셀 / live period accent / MOCK selector |
| AdminCourts (552) | 132 | 698 | active=ok / maintenance=warn / closed=err / pending=info | 코트 아이콘 (business/park) / rating star / facilities pill / type pill |
| AdminTeams (540) | 80 | 170 | active=ok / new=info / dormant=mute / suspended=err | 팀 이니셜 아바타 / rating tone pill (A/B/C/D) / admin-progress 게이지 / rating range filter |

#### 운영 vs 시안 STATUS_TONE 매핑 정합성
| 페이지 | 운영 매핑 | 시안 매핑 | 정합 |
|--------|---------|---------|------|
| Games | 1.모집중=ok / 2.확정=info / 3.완료=mute / 4.취소=err | live=info / scheduled=ok / done=mute / cancelled=err | ✅ 의미 동일 (운영 enum 1~4 vs 시안 string — `4.취소=err` `3.완료=mute` 등 1:1 매핑) |
| Courts | active=ok / inactive=err | active=ok / maintenance=warn / closed=err / pending=info | ⚠️ DB enum 2가지만 (active/inactive) — 시안 4-state 미지원. 갭 의도 |
| Teams | active=ok / inactive=err | active=ok / new=info / dormant=mute / suspended=err | ⚠️ DB enum 2가지만 — 시안 4-state 미지원. 갭 의도 |
| Courts.Suggestion | 항상 info (대기중) | (시안 미반영) | ✅ 운영 위키 제안 시스템 (Toss 추가 — 시안 미반영 영역) |
| Courts.Ambassador | pending=warn / active=ok / revoked=err | (시안 미반영) | ✅ 운영 앰배서더 시스템 — 시안 미반영 영역 |

#### 박제 범위 결정 — **권장 옵션 0 (no-op)**

| 옵션 | 범위 | LOC 증가 | 위험도 | 권장 |
|------|------|----------|--------|------|
| **0 (no-op)** | 이미 박제 완료 — 변경 없음. 본 PR skip | 0 | NIL | ⭐ |
| A1 (검수) | 박제 코멘트 누락 보강 / STATUS_TONE 키 정렬 검수만 | +0/-0 ~ +5/-5 | LOW | 보완 차원만 |
| B (시각 강화 — live pulse) | Games row 의 live status 에 admin-pulse dot 박제 (시안 라인 252) + status_tone='info' 매핑 강화 | +6/-2 | LOW | 갭 메우기 단계로만 |
| C (Teams admin-progress) | Teams 에 activity_score / win_rate 컬럼 박제 + admin-progress 박제 — DB members_count 외에 activity_score 미존재 → **DB 미지원 기능** → CLAUDE.md `리디자인 작업 원칙` 위배 | +60 | HIGH | ❌ 거절 |
| D (Courts pending 상태) | Courts pending/maintenance 상태 enum 확장 — DB schema 변경 + 운영 영향 | +30/-10 + schema | HIGH | ❌ 거절 (단일 DB 정책) |

**권장 사유 (옵션 0)**:
1. **Admin-4-B `a9e7f05` 이미 박제 완료** — `STATUS_TONE` 매핑 + `AdminPageHeader` + admin-stat-pill class 모두 6 파일에 박제 마크 코멘트 포함 (`2026-05-15 Admin-4-B 박제`). 추가 박제 = 중복
2. **시안 시각 강화 (live pulse / 팀 아바타 / activity 게이지) 는 DB 미지원** 또는 운영 영향 — CLAUDE.md "API/데이터 패칭 절대 변경 금지" 위배
3. **Admin-5-A 패턴 (Users/GameReports/Suggestions)** 과 의미 동등 — Admin-5-A 가 동일 옵션 A 박제 후 후속 PR 없이 종결한 패턴 그대로 적용

**옵션 B (live pulse) 부분 박제 가능성**:
- 운영 `status=2(확정)` 시각 = `info` tone (이미 적용). 시안의 `live` pulse 는 운영의 "진행 중인 경기 (실시간)" 개념과 매칭 — DB 에 `live` 상태 없음, 시각만 추가 가능
- 그러나 DB schema 보강 없이 단순 시각 효과만 박제는 시안 의도 (실시간 진행) 와 불일치 → **별 PR 권장 (RealTime indicator 별도 설계)**

#### developer TODO (옵션 0 채택 시)
- **6 파일 변경 0** — 본 PR skip
- scratchpad 작업 로그 1줄 추가: `Admin-8-A 박제 영향 분석 → 옵션 0 (no-op) — Admin-4-B 이미 박제 완료`
- 다음 작업: Admin-8-B 또는 별 페이지 큐로 이동

#### developer TODO (옵션 A1 채택 시 — 검수 보완만)
1. `games/admin-games-content.tsx` STATUS_TONE 순서 검수 (1234 → ok/info/mute/err 의도 ✅)
2. `courts/admin-courts-content.tsx` AMBASSADOR_STATUS_TONE 박제 코멘트 검수 ✅
3. `teams/admin-teams-content.tsx` STATUS_TONE 박제 코멘트 검수 ✅
4. tsc 0 확인 / git diff 0 또는 +5/-5 이내

#### 단일 vs 분리 PR 결정
- **옵션 0 채택 시**: PR 자체 미발생. scratchpad 분석 로그만
- **옵션 A1 채택 시**: 단일 commit `style(admin): Admin-8-A 검수 보완` (3 파일 < 30 LOC)
- **옵션 B 시도 시**: 별 PR `feat(admin): Games live pulse indicator` — DB schema 영향 검토 후 별도 의뢰

#### 위험도 + 갭
- **위험도**: NIL (옵션 0) / LOW (옵션 A1)
- **의도된 갭 (시안 vs 운영 — 박제 보류)**:
  - Games: live pulse dot / 점수 셀 (team_a/team_b/score_a/score_b) / period accent / 호스트 컬럼 — DB schema 보강 없이 시각만 박제 불가
  - Courts: 코트 type 아이콘 (business/park) / rating star + review_count / facilities chip / hourly_fee 표시 / 핵심 지표 3카드 — UI 만 추가 가능하나 운영 위키/앰배서더 시스템 (Toss) 과 별도 영역
  - Teams: 팀 이니셜 아바타 / rating tone pill (A/B/C/D) / admin-progress 활동 게이지 / 핵심 지표 3카드 — DB 에 `avg_rating` / `activity_score` 미존재 → **DB 미지원**
- **재발 방지**: PM 이 Admin-N-X 박제 요청 시 commit `a9e7f05` (Phase C-3+) 박제 범위 확인 후 의뢰 진행

---

### Sub-B3 Wizard1Step 박제 — 영향 분석 + 박제 범위

#### 운영 파일 구조 (1,619 LOC)
| 영역 | 라인 | 설명 |
|------|------|------|
| import | 1~26 | TossCard / ScheduleForm / 등 컴포넌트 import |
| STEPS / FORMAT_OPTIONS / GENDER_OPTIONS | 28~46 | LegacyWizardForm 용 상수 |
| inputCls / pillCls / SectionTitle | 49~69 | 공유 스타일 |
| **default export = 라우터 분기** | 86~95 | `?legacy=1` → LegacyWizardForm / else → QuickCreateForm (UI-2 핵심) |
| **QuickCreateForm** | 114~498 | 본 박제 대상 (385 LOC) |
| ┣ state | 115~140 | name / startDate / seriesId / 등 |
| ┣ useEffect 인증 + Phase 6 PR2 분기 | 142~169 | 변경 ❌ |
| ┣ useEffect 시리즈/단체 로드 | 178~228 | 변경 ❌ |
| ┣ handleCreate POST | 267~309 | UI-2 비즈 핵심 — 변경 ❌ |
| ┣ **JSX 헤더 (Admin-3 박제)** | 311~343 | `d98ff79` 이미 박제 — eyebrow + h1 + p + × 종료 |
| ┣ JSX Phase 6 PR2 카드 | 345~373 | 변경 ❌ (super_admin/협회 분기) |
| ┣ JSX 에러 메시지 | 375~380 | 변경 ❌ |
| ┣ JSX 폼 (TossCard + 대회명/시작일/시리즈/안내) | 382~478 | UI-2 핵심 비즈 |
| ┣ JSX CTA + legacy 링크 | 480~495 | 변경 ❌ |
| **LegacyWizardForm** | 508~1619 | `?legacy=1` 분기 — 1주 후 폐기 예정. 박제 ❌ |

#### Admin-3 박제 (`d98ff79`) 현황 — 이미 박제됨
**라인 311~343** (+30 -6 LOC):
- ✅ eyebrow "대회 운영자 도구 · 마법사 진행 중" (Navy `var(--color-info)` uppercase 11px tracking)
- ✅ h1 "새 대회 만들기" (text-xl sm:text-2xl)
- ✅ subtitle "이름만 입력해도 ..." (text-sm muted)
- ✅ × 종료 버튼 (Material Symbols `close` + confirm 1회 → `/tournament-admin`)
- ❌ breadcrumbs (시안: ADMIN › 대회 운영자 도구 › 새 대회)
- ❌ 좌측 sticky aside "이 마법사 이후" 4단계 NextStep
- ❌ 1-step 압축 안내 배너 (`auto_awesome` + 좌측 accent border)
- ❌ Section 컴포넌트 numbered (1/2/3/4) 카드 시각
- ❌ AdminPageHeader 공통 컴포넌트 사용 안 함 (Tailwind inline)

#### UI-2 (`60dd37e`) 보존 영역 — 절대 건드리지 말 것
- **라인 86~95** default export 라우터 분기 (`?legacy=1`)
- **라인 114~309** QuickCreateForm 비즈 (state / useEffect / handleCreate POST body)
- **라인 382~478** JSX 폼 (TossCard + 대회명 + 시작일 + 시리즈 + InlineSeriesForm + 안내 박스)
- **라인 508~1619** LegacyWizardForm (1주 후 폐기 예정 — 의도적 skip)

#### 시안 vs 운영 갭

**이미 박제 (Admin-3 d98ff79)**:
- 헤더 eyebrow + 제목 + 부제 + × 종료

**시안 신선 요소 (미박제)**:
1. AdminPageHeader 공통 컴포넌트 (Sub-B1/B2 와 일관성) — 운영은 인라인 Tailwind / 시안은 AdminShell.eyebrow/title/subtitle/breadcrumbs/actions props
2. breadcrumbs `ADMIN › 대회 운영자 도구 › 새 대회` (시안 88~92)
3. 2-column grid (좌 1.4fr 폼 / 우 1fr sticky aside) — 운영은 `max-w-2xl` 단일 column
4. 좌측: 1-step 압축 안내 배너 (`auto_awesome` + accent borderLeft)
5. 좌측: Section numbered (1/2/3/4) 카드 시각 (`width: 22 height: 22 borderRadius: 50` 원형 번호 + cardStyle border)
6. 우측 sticky aside "이 마법사 이후" 4 NextStep + 참고 박스 (v2.6 5-step 미리보기 링크)
7. CTA: "draft 만들고 hub 로 이동" (운영: "대회 만들기") — 카피 차이
8. `auto_awesome` 아이콘 CTA 좌측

**운영 우위 (시안 미반영)**:
- Phase 6 PR2 협회 마법사 카드 (super_admin) — 시안에 없음
- InlineSeriesForm (UI-1.3) — 시안은 AdminInlineForm 추상화
- `?legacy=1` 안전망 + "예전 상세 폼" 링크 — 시안에 없음

#### 박제 범위 결정 — **권장 옵션 A (보수적)**

| 옵션 | 범위 | UI-2 보존 | Admin-3 보존 | 위험도 | LOC 증가 |
|------|------|-----------|--------------|--------|----------|
| **A (보수적)** | 헤더만 AdminPageHeader 로 정합 + breadcrumbs 신규 박제. 본문 손대지 않음 | ✅ 100% | ✅ 시각 동등 박제 (eyebrow/title/subtitle 유지) | LOW | +5/-25 |
| B (중간) | A + 우측 sticky aside "이 마법사 이후" 박제 (`max-w-2xl` → 2-column grid 전환) | ⚠️ 좌측 폼 유지 / grid 컨테이너 신규 | ✅ | MEDIUM | +60 |
| C (적극적) | B + 좌측 1-step 안내 배너 + Section numbered 카드 시각 | ⚠️ 폼 내부 시각 갱신 (state 비즈 ❌ 변경) | ✅ | HIGH | +120 |

**권장 사유 (옵션 A)**:
1. **Sub-B1 / Sub-B2 패턴 일관성** — `[id]/page.tsx` + `[id]/wizard/page.tsx` 모두 AdminPageHeader + 옵션 A 보수적 적용. 본 페이지도 동일 패턴 = 운영자 시각 통일성 ↑
2. **Admin-3 박제 (`d98ff79`) 의 시각 자산 100% 동등 이전** — eyebrow Navy + × 종료 모두 AdminPageHeader props 로 표현 가능 (breadcrumbs / eyebrow / actions slot)
3. **UI-2 비즈 흐름 (`60dd37e`) 0 위협** — 폼 본문 / 라우터 분기 / POST body 손 안 댐
4. **옵션 B/C 위험 회피** — 2-column grid 전환 시 Phase 6 PR2 협회 카드 / InlineSeriesForm / `?legacy=1` 링크 배치 재설계 필요 → 별 PR 권장

**옵션 B/C 보류 사유**:
- 시안 aside "v2.6 5-step 미리보기" 링크 = `?legacy=1` 과 충돌 (운영 흐름: 1주 후 폐기 / 시안: v2.6 미리보기 보존). 카피 차이 해결 결정 필요
- 시안 Section numbered 카드 시각 = TossCard 와 디자인 충돌 → TossCard 교체 영향 분석 별도 필요
- 2-column grid 전환 시 모바일 ≤768px 1-column 폴백 검증 필요

#### developer TODO (옵션 A)

1. **AdminPageHeader 박제** — 라인 311~343 (33줄) 을 다음으로 교체:
   ```tsx
   <AdminPageHeader
     breadcrumbs={[
       { label: "ADMIN", onClick: () => router.push("/admin") },
       { label: "대회 운영자 도구", onClick: () => router.push("/tournament-admin") },
       { label: "새 대회" },
     ]}
     eyebrow="대회 운영자 도구 · 마법사 진행 중"
     title="새 대회 만들기"
     subtitle="이름만 입력해도 대회를 만들 수 있어요. 나머지 설정은 대회 대시보드에서 차근차근 진행하세요."
     actions={
       <button
         type="button"
         onClick={() => {
           if (confirm("진행 중인 작성을 종료하시겠습니까?")) {
             router.push("/tournament-admin");
           }
         }}
         className="btn"
         aria-label="작성 종료"
       >
         <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
         종료
       </button>
     }
   />
   ```
2. **import 추가**: `import { AdminPageHeader } from "@/components/admin/admin-page-header";` (라인 25 근처)
3. **컨테이너 클래스 보존**: `<div className="mx-auto max-w-2xl">` 유지 — AdminPageHeader 만 교체
4. **LegacyWizardForm (508~1619) 손대지 말 것** — `?legacy=1` 안전망 그대로 박제 보존
5. **handleCreate / state / useEffect / Phase 6 PR2 카드 / InlineSeriesForm 절대 변경 ❌**
6. **검증**:
   - `npx tsc --noEmit` errors=0
   - grep 보존 검증: `seriesId` `handleCreate` `?legacy=1` `showAssociationCard` 모두 grep hit 유지
   - 운영 진입 `/tournament-admin/tournaments/new/wizard` 시각 변경 = 헤더만 (breadcrumbs 추가 + AdminPageHeader 스타일 적용)

#### 위험도 + 갭
- **위험도**: LOW (옵션 A) — Sub-B1/B2 와 동일 패턴, +5/-25 LOC 미세 정합
- **`var(--ff-mono)` 처리**: Admin-3 commit 의 inline `style={{ fontFamily: "var(--ff-mono, ...)" }}` 는 AdminPageHeader 의 `.admin-pageheader__eyebrow` CSS 에 이미 반영되어야 함 — admin.css 확인 필요 (developer 가 박제 시 검증)
- **breadcrumbs onClick router.push 사용** — 시안의 `setRoute('adminDashboard')` 패턴은 Next.js 라우터로 매핑
- **별 PR 권장**: 옵션 B/C 는 본 박제 후속 PR 로 분리. 이유 = UI-2 1-step 압축 + Phase 6 PR2 협회 카드 + `?legacy=1` 가 시안 grid/aside 와 충돌 가능 — 사용자 결정 필요

## 구현 기록 (developer)

### Admin-9 WizardAssociation 박제 — AdminPageHeader (옵션 A) (2026-05-16)

📝 구현한 기능: `src/app/(admin)/tournament-admin/wizard/association/_components/WizardShell.tsx` 헤더 블록 (line 49~57, 9 LOC) 을 AdminPageHeader 공통 컴포넌트로 교체. Sub-B1/B2/B3 마법사 일관성 박제 — eyebrow "협회 마법사 · 진행 중" / breadcrumbs 3단계 (ADMIN / 대회 운영자 도구 / 협회 마법사) / actions slot 2 요소 (1) "일반 대회 마법사로" Link → `/tournament-admin/tournaments/new/wizard` / (2) × 종료 button confirm 후 `router.push("/admin")`. Phase 6 PR2 (협회 마법사 비즈) + PR3 (Step 4 Referee 옵션) 비즈 100% 보존. v2.8.1 sidebar 유지 (admin layout 의 sidebar 가 자동 보존). 풀스크린 회귀 0.

| 파일 | 변경 | 신규/수정 |
|-----|-----|---------|
| `src/app/(admin)/tournament-admin/wizard/association/_components/WizardShell.tsx` | import 4줄 추가 (Link / useRouter / AdminPageHeader) + 컴포넌트 본문 시작에 `const router = useRouter()` 추가 + 헤더 블록 9줄 → AdminPageHeader 블록 41줄 (Prettier 멀티라인 포맷팅) 교체 | 수정 |

**비즈 보존 검증 (grep)**:
- progress bar 5 step: `ASSOCIATION_WIZARD_STEPS.map` (line 100) / `step.id === currentStep` (line 102) / `step.id < currentStep` (line 103) / `step.id` (line 122) / `step.label` (line 133) — 모두 보존 ✅
- canProceed / submitting / error 가드: line 25~30 props + line 110~113 error 표시 + line 159~161 disabled + line 173, 184 disabled — 변경 0 ✅
- Nav 버튼: `onClick={onPrev}` (line 157) / `onClick={onSubmit}` (line 168) / `onClick={onNext}` (line 178) — 모두 보존 ✅
- isLastStep (line 48) / isFirstStep (line 49) — 변경 0 ✅
- container `<div className="mx-auto max-w-3xl">` 보존 ✅
- WizardShellProps interface (line 22~31) 변경 0 ✅ — page.tsx 호출 시그니처 100% 보존

**tsc 결과**: exit 0 (no output, 60s 내 완료)

**LOC 변화**: +47 / -9 (의뢰서 예상 +30/-9 ± 17 — Prettier 멀티라인 포맷팅 차이. 본질 코드량은 의뢰서 시안과 동일: props 5개 + actions 2 요소)

**갭 (의도 — 옵션 C 보류)**:
- 옵션 C (진입 카드 박제): `/tournament-admin` 메인 페이지의 협회 마법사 진입 카드 영역 — 본 페이지 범위 외 → 별 페이지 큐
- Step 4 Referee 사전 등록 UI 시각 강화 (PR3 `12daf56`) — 별 PR 큐

💡 tester 참고:
- 테스트 경로: `/tournament-admin/wizard/association` (subin 브랜치 dev 머지 후 vercel 프리뷰)
- 정상 동작:
  1. 헤더 영역에 AdminPageHeader 박제 (breadcrumbs `ADMIN › 대회 운영자 도구 › 협회 마법사` 표시)
  2. eyebrow Navy "협회 마법사 · 진행 중" + uppercase 11px tracking 유지 (admin.css `.admin-pageheader__eyebrow`)
  3. title "새 협회 만들기" / subtitle "super_admin 전용 — ..." 유지
  4. 우측 상단 actions:
     - "일반 대회 마법사로" Link 클릭 → `/tournament-admin/tournaments/new/wizard` 이동
     - × 종료 버튼 클릭 → confirm "진행 중인 작성을 종료하시겠습니까?" → 확인 시 `/admin` 이동
  5. progress bar (1~5 step) + Step 본문 + 이전/다음/생성 버튼 + error 표시 모두 정상 동작 (Phase 6 PR2/PR3 비즈 회귀 0)
  6. 협회 생성 시 POST API 4건 (협회 본체 + 사무국장 + 단가표 + Referee 옵션) 정상 호출
- 주의할 입력:
  - super_admin 권한 가드 (인증 useEffect line 47~95) 정상 분기 확인
  - sessionStorage draft (`useAssociationWizardDraft`) 정상 저장/복원
  - Step 4 Referee 사전 등록 (PR3 옵션) 정상 노출

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  1. AdminPageHeader 가 `<div className="mx-auto max-w-3xl">` 컨테이너 안쪽에 배치 — Sub-B2/B3 동일 패턴 (mx-auto 가 페이지 폭 제어, AdminPageHeader 가 헤더 시각만 제공)
  2. actions Link className `btn btn--sm` — Sub-B3 의 × 종료 버튼 admin.css 박제 클래스와 일관 패턴
  3. breadcrumbs onClick 미설정 (Sub-B1/B2/B3 동일) — 라벨만 표시. router.push 가 필요한 경우 후속 PR 에서 일괄 추가
  4. router.push("/admin") — 의뢰서 명시 ("종료" 시 /admin 으로). Sub-B3 (Wizard1Step) 은 `/tournament-admin` 으로 이동했으나, 본 페이지는 super_admin 전용이라 /admin (관리자 대시보드) 으로 복귀 = 의뢰서 spec 준수
  5. v2.8.1 sidebar 유지 — admin layout 의 sidebar 가 시안 의도와 자동 일치. 풀스크린 회귀 0
  6. import 순서 — next/link → next/navigation → @/components/admin/admin-page-header → @/lib/tournaments/... = ESM 표준 정합

### Sub-B3 Wizard1Step 박제 — AdminPageHeader (옵션 A) (2026-05-15)

📝 구현한 기능: `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` QuickCreateForm 헤더 영역 (라인 313~343, 33줄) 을 AdminPageHeader 공통 컴포넌트로 교체. Sub-B1/Sub-B2 와 시각 일관성 박제 (eyebrow + breadcrumbs 3단계 + actions slot). Admin-3 `d98ff79` 시각 자산 (eyebrow Navy + × 종료 confirm 1회 + router.push("/tournament-admin")) 100% 동등 이전. UI-2 `60dd37e` 비즈 (라우터 분기 / QuickCreateForm state / handleCreate POST / Phase 6 PR2 카드 / InlineSeriesForm) 변경 0.

| 파일 | 변경 | 신규/수정 |
|-----|-----|---------|
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` | import 3줄 (AdminPageHeader + 박제 주석 2줄) + 헤더 33줄 → 27줄 (AdminPageHeader 블록 + 박제 주석 5줄) 교체 | 수정 |

**비즈 보존 검증 (grep)**:
- UI-2 라우터 분기: `useSearchParams` (line 4, 90) / `?legacy=1` (line 77, 82, 85, 491, 493) / `isLegacy` (line 92) — 모두 보존 ✅
- QuickCreateForm 비즈: `handleCreate` (line 270, 384) / `setName` (line 128, 394) / `seriesId` (line 138, 296, 420~421) / `setSeriesId` (line 138, 236, 421) / `BDR_PRIMARY_HEX` / `BDR_SECONDARY_HEX` (POST body) — 모두 보존 ✅
- 시리즈/단체 로드: `seriesOptions` / `myOrgs` / `showSeriesForm` useEffect — 변경 0 ✅
- LegacyWizardForm: line 95 (`<LegacyWizardForm />` 분기) / line 510 (`function LegacyWizardForm()`) / line 522~1619 비즈 본문 — 변경 0 ✅
- Admin-3 시각 자산 동등 이전:
  - eyebrow "대회 운영자 도구 · 마법사 진행 중" → AdminPageHeader `eyebrow` prop (admin.css `.admin-pageheader__eyebrow` 가 Navy + uppercase + ff-mono 박제)
  - title "새 대회 만들기" → `title` prop
  - subtitle "이름만 입력해도..." → `subtitle` prop
  - × 종료 confirm + router.push("/tournament-admin") → `actions` slot 그대로 박제 (button + confirm 메시지 / 라우터 경로 / aria-label "작성 종료" 동일)
- breadcrumbs 신규: `[{label:"ADMIN"},{label:"대회 운영자 도구"},{label:"새 대회"}]` (Sub-B1/B2 동일 패턴 — label only, onClick 없음)

**tsc 결과**: exit 0 (no output, 60s 내 완료)

**LOC 변화**: +32 / -30 (planner 예상 +5/-25 범위 ±10 정합 — 33줄 헤더 블록 → 27줄 AdminPageHeader + import 3줄 comment + 박제 주석 5줄)

**갭 (의도 — 옵션 B/C 보류)**:
- 옵션 B (우측 sticky aside "이 마법사 이후" 박제): UI-2 1-step 압축 흐름 + `?legacy=1` 안전망과 시안 v2.6 5-step 미리보기 링크 충돌 가능 → 사용자 결정 필요 후 별 PR
- 옵션 C (좌측 1-step 안내 배너 + Section numbered 카드): TossCard 시각 교체 영향 분석 필요 (운영 폼 본문 5개 카드 모두 영향) → 별 PR
- 시안 좌측 sticky aside / 1-step 안내 배너 / Section numbered 카드 시각 = 모두 후속 PR 큐

💡 tester 참고:
- 테스트 경로: `/tournament-admin/tournaments/new/wizard` (subin 브랜치 dev 머지 후 vercel 프리뷰)
- 정상 동작:
  1. 헤더 영역에 AdminPageHeader 박제 (breadcrumbs `ADMIN › 대회 운영자 도구 › 새 대회` 표시)
  2. eyebrow Navy 색상 + uppercase 11px tracking 유지 (admin.css `.admin-pageheader__eyebrow`)
  3. title "새 대회 만들기" / subtitle 유지
  4. 우측 상단 × 종료 버튼 클릭 → confirm "진행 중인 작성을 종료하시겠습니까?" → 확인 시 `/tournament-admin` 이동
  5. 대회 이름 입력 + "대회 만들기" 클릭 → POST 정상 동작 + redirect_url 이동 (비즈 변경 0)
  6. `?legacy=1` 진입 시 LegacyWizardForm 정상 노출 (1주 후 폐기 예정 안전망)
  7. Phase 6 PR2 협회 마법사 카드 (super_admin 진입 시) 헤더 아래 정상 노출
- 주의할 입력: `?legacy=1` 분기 / Phase 6 PR2 카드 노출 분기 (super_admin / association_admin 매핑) 변경 0 확인

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  1. AdminPageHeader 가 `<div className="mx-auto max-w-2xl">` 컨테이너 안쪽에 배치 — Sub-B2 의 `max-w-3xl` 안쪽 배치와 동일 패턴 (mx-auto 가 페이지 폭 제어, AdminPageHeader 가 헤더 시각만 제공)
  2. `var(--ff-mono)` 처리는 admin.css `.admin-pageheader__eyebrow` 가 박제 — inline style 제거 시 mono font + Navy 색상 변경 0 (admin.css 박제 확인 필요)
  3. breadcrumbs onClick 미설정 (Sub-B1/B2 동일) — 라벨만 표시. router.push 가 필요한 경우 후속 PR 에서 일괄 추가
  4. × 종료 버튼 className `btn btn--sm` 사용 — Admin-3 commit 의 `inline-flex shrink-0 ... rounded-[4px]` Tailwind inline 에서 admin.css 박제 클래스로 전환. 시안 회귀 0 (btn--sm 가 sm 사이즈 + rounded-[4px] 박제)

## 테스트 결과 (tester)

### Sub-B3 Wizard1Step 박제 검증 (2026-05-15)

**tsc**: exit 0 ✓ (60s 내 완료, 에러 0)

**UI-2 grep 보존 (박제 전 HEAD vs 후 working tree)**:
| 패턴 | 전 | 후 | 분석 |
|------|-----|-----|------|
| 라우터 분기 (useSearchParams\|isLegacy\|legacy) | 10 | 10 | ✅ 보존 |
| QuickCreateForm 비즈 (handleCreate\|setName\|seriesId\|setSeriesId\|fetch) | 29 | 30 | ✅ +1 = line 320 박제 주석 키워드 "handleCreate" 언급 — 실제 비즈 변경 0 |
| Phase 6 PR2 (showAssociationCard) | 2 | 2 | ✅ 보존 |
| InlineSeriesForm | 6 | 7 | ✅ +1 = line 320 박제 주석 키워드 "InlineSeriesForm" 언급 — import 1 + 사용 4건 (line 20 / 86 / 463 / 995 / 1042 / 1044) 모두 보존 |
| LegacyWizardForm | 6 | 6 | ✅ 보존 |

**비즈 호출 라인 회귀 검증**:
- handleCreate 정의: line 270 (QuickCreate) / 827 (Legacy) — 변경 0 ✓
- handleCreate 호출: line 384 (QuickCreate onSubmit) / 1554 (Legacy onClick) — 변경 0 ✓
- LegacyWizardForm: line 95 분기 / 510 정의 — 변경 0 ✓

**Admin-3 시각 자산 100% 동등 박제**: ✓
- eyebrow "대회 운영자 도구 · 마법사 진행 중" → AdminPageHeader.eyebrow prop ✓
- title "새 대회 만들기" → AdminPageHeader.title prop ✓
- subtitle "이름만 입력해도..." → AdminPageHeader.subtitle prop ✓
- × 종료 confirm "진행 중인 작성을 종료하시겠습니까?" + router.push("/tournament-admin") + aria-label "작성 종료" → AdminPageHeader.actions slot 그대로 ✓
- admin.css `.admin-pageheader__eyebrow` (line 345~) 박제 검증: font 11px / weight 700 / letter-spacing 0.12em / uppercase / ink-dim 색상 + ::before accent bar ✓

**breadcrumbs 신규 박제**: ✓ 3단계 [ADMIN / 대회 운영자 도구 / 새 대회] (Sub-B1/B2 동일 패턴 — label only, onClick 미설정)

**git diff**: +32/-30 (planner 예상 +32/-30 일치 ✓)

**AdminPageHeader props 정합**: ✓ (eyebrow / title / subtitle / breadcrumbs / actions slot 모두 admin-page-header.tsx line 22~32 시그니처와 일치 / `mx-auto max-w-2xl` wrapper 보존)

**LegacyWizardForm (508~1619) 변경 0**: ✓ diff 영역 = QuickCreateForm 헤더 단일 블록만

**최종 판정**: PASS ✓

**문제**: 없음. 옵션 A 보수적 박제 완벽 적용. UI-2 1-step 압축 비즈 100% 보존 + Admin-3 시각 자산 100% 동등 이전 + breadcrumbs 신규 박제 + Sub-B1/B2 패턴 일관성 달성. PM 커밋 진행 가능.

### Admin-9 WizardShell 박제 검증 (2026-05-16)

**tsc**: exit 0 ✓ (에러 0)

**Phase 6 PR2/PR3 grep 보존 (박제 전 HEAD vs 후 working tree)**:
| 패턴 | 전 | 후 | 분석 |
|------|-----|-----|------|
| 비즈 키워드 (progress\|currentStep\|onPrev\|onNext\|canProceed\|step\|submitting) | 38 | 38 | ✅ 보존 |
| WizardShellProps\|interface.*Wizard | 2 | 2 | ✅ 인터페이스 보존 |
| Nav 버튼 (Nav\|button.*type\|이전\|다음\|제출) | 7 | 7 | ✅ 보존 |

**git diff**: +47/-9 (planner 예상 +47/-9 일치 ✓ — Prettier 멀티라인 포맷팅 차이 정상)

**AdminPageHeader props 정합**: ✓
- eyebrow "협회 마법사 · 진행 중" (line 57) ✓
- title "새 협회 만들기" + subtitle 운영 카피 (line 58-59) ✓
- breadcrumbs 3단계 [ADMIN / 대회 운영자 도구 / 협회 마법사] (line 60-64) ✓
- actions 2 요소: Link "일반 대회 마법사로" → `/tournament-admin/tournaments/new/wizard` (line 68-73) + × 종료 button + confirm "진행 중인 작성을 종료하시겠습니까?" + router.push("/admin") (line 74-92) ✓

**Phase 6 PR2 (협회 마법사 본체 `79e72de`) 보존**: ✓ progress bar 5 step + Step 본문 + Nav 3 버튼 (이전/다음/생성) + error 표시 — 모두 변경 0
**Phase 6 PR3 (Step 4 Referee `12daf56`) 보존**: ✓ currentStep 타입 `1|2|3|4|5` + isLastStep === 5 판정 보존
**v2.8.1 sidebar 풀스크린 회귀 0**: ✓ `mx-auto max-w-3xl` wrapper 유지 (헤더 외 시각 변경 0)
**import 정합**: ✓ Link / useRouter / AdminPageHeader 4줄 추가 (line 16-20) — kebab-case 일치

**다른 파일 변경 0 검증**: ⚠️ score-sheet-form.tsx 변경 감지 (12 LOC) — Phase 15 풋터 정렬 별건. Admin-9 박제 범위 밖. PM 분리 commit 권장

**최종 판정**: PASS ✓ (옵션 A 보수적 박제 완벽 적용. Phase 6 PR2/PR3 비즈 100% 보존 + AdminPageHeader 패턴 일관성 달성)

## 리뷰 결과 (reviewer)

### Admin-9 WizardShell 박제 리뷰 (2026-05-16)

**총평**: PASS

**Sub-B 패턴 일관성**: ✓ (AdminPageHeader 호출 시그니처 `title/subtitle/eyebrow/breadcrumbs/actions` 5 prop = Sub-B1/B2/B3 동일. breadcrumbs 3단계 label-only [ADMIN / 대회 운영자 도구 / 협회 마법사] = Sub-B3 새 대회 패턴 정합. `<div className="mx-auto max-w-3xl">` 컨테이너 안쪽 배치 = Sub-B2 와 동일)
**시안 카피 보존**: ✓ (eyebrow "협회 마법사 · 진행 중" line 57 / "일반 대회 마법사로" Link line 72 / × 종료 confirm "진행 중인 작성을 종료하시겠습니까?" line 78 / subtitle 운영 카피 보존 line 59 — 의뢰서 시안 v2.8.1 동등)
**v2.8.1 sidebar 유지**: ✓ (`hideHeader` / 풀스크린 prop 사용 0 — admin layout sidebar 자동 보존)
**Phase 6 PR2/PR3 비즈 보존**: ✓ (ASSOCIATION_WIZARD_STEPS.map line 100 / canProceed+submitting+error props line 26~30 / onPrev+onNext+onSubmit handler line 31~33 / Nav 버튼 line 154~185 / isLastStep+isFirstStep line 48~49 / container line 54 / WizardShellProps interface 변경 0 → page.tsx 호출 시그니처 100% 보존)
**import 정합**: ✓ (`next/link` → `next/navigation` → `@/components/admin/admin-page-header` (kebab-case) → `@/lib/tournaments/...` = ESM 표준 + Sub-B3 동일 순서. useRouter 호출 위치 line 51 컴포넌트 본문 시작부)
**Prettier 포맷팅 (+47 vs 예상 +30)**: 합리적 ✓ (멀티라인 actions Fragment + breadcrumbs 배열 + AdminPageHeader props 7줄 분할 = Prettier 표준 멀티라인 포맷. 본질 코드량은 의뢰서 시안과 동일)
**컨벤션**: ✓ (Material Symbols Outlined `close` line 86~90 / lucide-react 0 / 하드코딩 색상 0 — admin.css `btn btn--sm` 토큰 위임 / inline-style 신규 = × 아이콘 `fontSize:16` 1건만 Sub-B3 허용 패턴)

**의도된 차이 (Sub-B 시리즈 정합)**:
- breadcrumbs 단계: B1/B2 4단계 vs B3/Admin-9 3단계 — Wizard 페이지 (name state 미존재) 패턴 정합 ✓
- actions 2 요소 fragment: Sub-B 시리즈 첫 사례 — 시안 v2.8.1 "일반 마법사 Link + × 종료 button" 동등 박제 ✓
- router.push 목적지: Sub-B3 `/tournament-admin` vs Admin-9 `/admin` — super_admin 전용 페이지라 관리자 대시보드 복귀 = 의뢰서 spec 준수 ✓

**개선 권장 (있으면)**:
- 없음. 옵션 A (헤더만 정합) 범위 100% 준수. 헤더 외 시각 변경 0 / 신규 컴포넌트 0 / Phase 6 PR2+PR3 비즈 100% 보존. tsc 0 안전망 통과.

### Sub-B3 Wizard1Step 박제 리뷰 (2026-05-15)

**총평**: PASS

**Sub-B1/B2 패턴 일관성**: ✓ (AdminPageHeader 시그니처 + breadcrumbs label-only + actions slot btn--sm 모두 Sub-B2 `[id]/wizard/page.tsx` 와 동일 패턴)
**Admin-3 시각 자산 보존**: ✓ (eyebrow / title / subtitle / × 종료 confirm 문구 / router.push("/tournament-admin") / aria-label "작성 종료" / Material Symbols `close` fontSize:16 모두 동등 이전. inline Tailwind `rounded-[4px]` → admin.css `btn btn--sm` 클래스 박제 = 시각 회귀 0)
**inline-style 신규 0**: ✓ (× 아이콘 fontSize:16 만 — Sub-B1/B2 동일 허용 패턴)
**import 정합**: ✓ (`@/components/admin/admin-page-header` kebab-case — Sub-B1/B2 일치. 라인 28 배치 + 박제 의도 주석 2줄 동봉)
**UI-2 비즈 보존**: ✓ (grep 29건 `handleCreate|seriesId|showAssociationCard|LegacyWizardForm|isLegacy|?legacy=1` 모두 hit. 라우터 분기 86~95 / QuickCreateForm 114~309 / 폼 본문 382~478 / CTA 480~495 / LegacyWizardForm 508~1619 변경 0)
**컨벤션**: ✓ (Material Symbols Outlined 사용 / lucide-react 0 / 하드코딩 색상 0 — admin.css 토큰 위임)

**의도된 차이 (Sub-B1 vs Sub-B2 vs Sub-B3)**:
- breadcrumbs 단계 수 — Sub-B2 4단계 (`ADMIN › 대회 운영자 도구 › {name} › 수정 wizard`) vs Sub-B3 3단계 (`ADMIN › 대회 운영자 도구 › 새 대회`). 새 대회는 name state 미존재 → 3단계가 정합 ✓
- actions 카피 — Sub-B2 "설정 hub 로" (Link arrow_back) vs Sub-B3 "종료" (button close + confirm). 페이지 컨텍스트 부합 (수정=hub 복귀 / 생성=draft 폐기 confirm) ✓
- eyebrow — Sub-B2 "ADMIN · 대회 수정" vs Sub-B3 "대회 운영자 도구 · 마법사 진행 중". Admin-3 `d98ff79` 박제 카피 보존 (시안 의도) ✓

**개선 권장 (있으면)**:
- 없음. 옵션 A 범위 (헤더만 정합) 100% 준수. 신규 컴포넌트 0 / 헤더 외 시각 변경 0 / Phase 6 PR2 카드 + InlineSeriesForm + `?legacy=1` 보존.

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-16 | **Admin-9 WizardAssociation 박제 — WizardShell.tsx 헤더 → AdminPageHeader (옵션 A)** | ✅ subin 브랜치 박제 완료 — eyebrow "협회 마법사 · 진행 중" + breadcrumbs 3단계 + actions 2 요소 (일반 마법사 Link + × 종료 confirm → /admin) / Phase 6 PR2 + PR3 비즈 100% 보존 / v2.8.1 sidebar 유지 / tsc 0 / +47/-9 LOC (Prettier 포맷 차이) / commit 대기 |
| 2026-05-16 | Admin-8-B TournamentDetail/AuditLog/TransferOrganizer 박제 영향 분석 (planner-architect) | ✅ 옵션 0 권장 — Admin-4-A `705ebd0` 이미 박제 완료 (audit-log + transfer-organizer 2 파일 AdminPageHeader + SEVERITY_TONE admin-stat-pill) / `[id]/page.tsx` 운영 미존재 (모달+sub-route IA 의도) / transfer-organizer-form 별 PR 큐 |
| 2026-05-15 | **Flutter 앱 4차 뉴비리그 "Token parameter required" fix** | ✅ 원인 = `editions/route.ts` 가 `tx.tournament.create()` 직접 호출 → `createTournament()` 서비스 우회 → `apiToken` 박제 누락 → 4차 뉴비리그 NULL. 즉시 1행 UPDATE (64자 hex 발급) + 재발 방지 = `generateApiToken()` 헬퍼 분리 (`tournament.ts`) + editions/ 두 path (legacy + wizard) 박제. tsc 0 / vitest createTournament 4/4 / errors.md 49항목. commit 대기 (미푸시 +1) |
| 2026-05-15 | Admin-7-B Sub-B3 Wizard1Step 박제 영향 분석 (planner-architect) | ✅ 옵션 A 권장 — AdminPageHeader 패턴만 정합 (+5/-25 LOC) / Admin-3 `d98ff79` 시각 자산 100% 동등 이전 / UI-2 `60dd37e` 비즈 0 변경 / 옵션 B/C (aside + Section 카드) 별 PR 보류 |
| 2026-05-15 | Admin-7-B Sub-B2 EditWizard 박제 (`[id]/wizard/page.tsx` 1,169→1,183 LOC) | ✅ commit `efcc103` (subin push 대기) — AdminPageHeader 패턴 (Sub-B1 동일) + 보존 4 commit (UI-1.1~1.5 + UI-3 + UI-4) 100% grep 검증 / +25/-11 / tsc 0 / 옵션 A (보수적 헤더만) / 시안 sticky ToC + SectionCard + sticky 저장 바 = 운영 3-step 흐름과 양립 불가 → 별 PR 보류. (cherry-pick 정정: 초기 dev 에 잘못 commit → subin 으로 옮기고 dev reset --hard origin/dev 정리) |
| 2026-05-15 | **본 세션 16 commit main 분리 머지 완료** | ✅ PR #517 (subin → dev → main 통합) + **PR #519** (temp/session-merge-2026-05-15-live → main 본 세션 2건 분리) / 본 세션 작업 16건 모두 main 박제 / scratchpad 정리 완료 |
| 2026-05-15 | 라이브 페이지 정리 (toolbar + 홈 버튼) | ✅ commit `5f1e768` (toolbar — 예정 라벨 + 모바일 기록하기 버튼 삭제 / PC 버전 통합) + `599c64c` (헤더 홈 버튼 삭제) |
| 2026-05-15 | 조별 순위표 + bracket aside 종합 정리 (모든 대회) | ✅ commit `0512fb5` (풀리그+조편성 분기) + `ea43d41` (V2BracketHeader 숨김) + `4c7b9a5` (ADVANCED/무/승점 삭제 + 가로스크롤 제거 + 시드 순위 카드 삭제) + `e649c81` (조 탭 → 세로 배열) + `0144595` (팀 로고 logoUrl + 이니셜 fallback) |
| 2026-05-15 | wizard 일정 및 장소 legacy venue_name 표시 보강 | ✅ commit `baaf74f` — 4차 뉴비리그 places=null + venue_name 단독 박제 케이스 분기 추가 |
| 2026-05-15 | 프론트 헤더 utility 정리 (관리자 진입 + 좌측 메뉴 숨김) | ✅ commit `ed42f1c` (관리자 진입 메뉴) + `57d7029` (글자색 통일) + `d6cf751` (소개/요금제/도움말 임시 숨김 + 후속 큐) |
| 2026-05-15 | wizard 저장 status enum mismatch fix (운영 DB legacy 17종 허용) | ✅ commit `ddb1dfc` — Zod 5종 → 17종 확장 (tournament-status.ts 정합) + `b50f6aa` (errors.md 박제 48항목) |
| 2026-05-15 | 종별 참가비 입력란 UI 삭제 (registration-settings-form.tsx) | ✅ commit `c88ea99` — 데이터 layer 보존 / 호출처 영향 0 |
| 2026-05-15 | PR-G5.5-followup Tournament 단위 placeholder applier (4차 BDR 뉴비리그 5/16 운영) | ✅ commit `6d52a33` — 신규 함수 2 + vitest 5 + 운영 매치 232 UPDATE / tsc 0 / vitest 926/926 / 강남구 회귀 0 + `c78bbba` (scratchpad 1223→49줄 정리) |
| 2026-05-15 | PR-G5 대진표 generator placeholder 박제 자동화 (강남구 사고 영구 차단) | ✅ commit `eba655d` + `72b818b` — 6 format 보강 / 헬퍼 박제 / vitest 32 케이스 |
| 2026-05-15 | Phase 23 PR-RO1~RO4 종료 매치 read-only 차단 (5계층 방어) | ✅ commit `fab2697` |
