# BDR v2.19 — 대회 생성/관리 흐름 전면 리디자인 (Phase 1A)

> **의뢰**: `uploads/tournament-admin-redesign-prompt-2026-05-25.md`
> **선행 분석**: planner-architect 의 대회 생성/관리 UX 점검 (`.claude/scratchpad.md` `## 기획설계` 섹션)
> **상위 계획서**: `tournament-user-admin-connectivity-plan-2026-05-25.md` (Phase 1 재구성)
> **선행 박제**: BDR v2.18 (Phase 1B — 사용자 측 8 시안) sync 완료 (2026-05-25)
> **운영 코드 변경**: **0** — 시안 박제만 (운영 박제는 Phase 1C 별 Phase)

---

## v2.19 갱신 (2026-05-26) — Phase 1A

### 수정 (7건)

- **PA1 AdminTournamentAdminList** — A1 · 단일 hero CTA → 4 옵션 인라인 panel (Quick / Legacy / Prospectus / 협회) + 상태 탭 + 카드 list
- **PA2 AdminTournamentWizard1Step** — A2 · 4 옵션 sub-tab + QuickCreate 압축 폼 + draft 복구 배너 + 3-step 흐름 안내
- **PA3 AdminWizardAssociation** — A3 · 4-step stepper (협회 → 시리즈 → 종별 위임 → 권한) + 각 step 컨텍스트 가드 (super_admin 전용)
- **PA4 AdminTournamentSetupHub** — B1 · depends_on 시각화 (잠금 STEP 7·8) + 잠금 toast + 모바일 sticky 공개 버튼. Phase 1B B7 (사용자 미리보기 카드) 보존
- **PA5 AdminTournamentMatches** — C1 · PlaceholderValidationBanner 3-tone (err / warn / ok) 표준 + 기록 모드 + 매치 표
- **PA6 AdminTournamentDivisions** — C2 · 종별 추가 hero CTA + 5 예시 + 멀티 종별 운영 안내 + 종별 카드 grid
- **(보조) admin.css** — Phase 1A 9 신규 패턴 (entry-cta / wizard-stepper / vban / divisions / completed / playoffs / prospectus) 추가

### 신규 (3건)

- **PA7 AdminTournamentCompleted** — D1 · 종료 후 5 카드 hub (결과 / 통계 / 알기자 / 사진영상 / 사이트 archive) + 🏆 우승팀 hero. S5 종료 후 흐름 누락 해소
- **PA8 AdminTournamentPlayoffs** — E1 · 5 섹션 탭 (순위표 / 8강 / 4강 / 결승 / 결과) + AdvancePlayoffsButton. G1 (playoffs 시안 부재) 해소
- **PA9 AdminTournamentProspectus** — E2 · 4-step (PDF 업로드 → AI 분석 → 미리보기 → wizard 자동 채움) + 신뢰도 high/mid/low chip + 수동 입력 fallback. G2/G3 해소

---

## 파일 구조

```
BDR v2.19/
├── README.md                              (본 파일)
├── index.html                             (Phase 1A + Phase 1B 통합 목차)
├── tokens.css                             (v2.18 carryover · 변경 0)
├── shell.css                              (v2.18 carryover · 변경 0)
├── admin.css                              (v2.18 + Phase 1A 패턴 9건 추가)
├── shared.jsx                             (v2.18 carryover · 변경 0)
│
├── pa1-admin-list.html                    (PA1 preview · A1)
├── pa2-admin-wizard.html                  (PA2 preview · A2)
├── pa3-admin-assoc.html                   (PA3 preview · A3)
├── pa5-admin-matches.html                 (PA5 preview · C1)
├── pa6-admin-divisions.html               (PA6 preview · C2)
├── pa7-admin-completed.html               (PA7 preview · D1 · NEW)
├── pa8-admin-playoffs.html                (PA8 preview · E1 · NEW)
├── pa9-admin-prospectus.html              (PA9 preview · E2 · NEW)
│
├── ud3-admin-setup.html                   (PA4 preview · B1 + B7 보강 · v2.18 파일 재활용)
│
│  — v2.18 Phase 1B 시안 carryover (변경 0) —
├── ua1-tournaments.html
├── ua2-tournament-detail.html
├── ua3-tournament-enroll.html
├── ub1-tournament-completed.html
├── uc1-my-activity.html
├── ud1-admin-teams.html
├── ud2-admin-bracket.html
│
└── screens/
    │  — Phase 1A 신규 / 갱신 —
    ├── AdminTournamentAdminList.jsx       (PA1 · A1 · 갱신)
    ├── AdminTournamentWizard1Step.jsx     (PA2 · A2 · 갱신)
    ├── AdminWizardAssociation.jsx         (PA3 · A3 · 갱신)
    ├── AdminTournamentSetupHub.jsx        (PA4 · B1 · 갱신 — v2.18 B7 보존 위 B1 추가)
    ├── AdminTournamentMatches.jsx         (PA5 · C1 · 갱신)
    ├── AdminTournamentDivisions.jsx       (PA6 · C2 · 갱신)
    ├── AdminTournamentCompleted.jsx       (PA7 · D1 · NEW)
    ├── AdminTournamentPlayoffs.jsx        (PA8 · E1 · NEW)
    ├── AdminTournamentProspectus.jsx      (PA9 · E2 · NEW)
    │
    │  — v2.18 Phase 1B 사용자 측 + 관리자 보강 (변경 0) —
    ├── Tournaments.jsx + tournaments.css
    ├── TournamentDetail.jsx + tournament-detail.css
    ├── TournamentEnroll.jsx + tournament-enroll.css
    ├── TournamentCompleted.jsx + tournament-completed.css
    ├── MyActivity.jsx + my-activity.css
    ├── MyRegistrationStatus.jsx + my-registration-status.css
    ├── AdminTournamentTeams.jsx
    └── AdminTournamentBracket.jsx
```

→ **총 jsx 17 + css 11 + html 17** = 박제 단일 폴더 (CLAUDE.md §🗂️ 룰 준수).

---

## S1~S9 사각지대 → 시안 매핑

| 사각지대 | 영향도 | 해소 시안 | 영역 |
|---------|-------|---------|------|
| S1 진입점 3중화 | ★★★★★ | PA1 + PA2 + PA3 (단일 CTA + sub-tab 4 옵션) | A |
| S2 셋업 hub 진행도 | ★★★★ | PA4 (depends_on + 잠금 toast) | B |
| S3 draft 복구 | ★★★★ | PA2 + PA9 (draft 복구 배너) | A + E |
| S4 다중 종별 발견성 | ★★★★ | PA6 (종별 추가 hero + 5 예시) | C |
| S5 종료 후 흐름 | ★★★ | PA7 (종료 후 5 카드 hub · NEW) | D |
| S6 권한 분기 UI 비대칭 | ★★★ | PA1 / PA3 (권한 가드 + super_admin chip) | A |
| S7 모바일 셋업 hub | ★★★ | PA4 (모바일 sticky 공개 버튼) | B |
| S8 검증 피드백 산발 | ★★★ | PA5 (PlaceholderValidationBanner 3-tone 표준) | C |
| S9 AppNav vs 어드민 정합 | ★★ | (운영 박제 단계에서 별도 처리 — Phase 1C) | — |

→ S1~S8 = 8건 중 8건 시안 해소. S9 = 운영 박제 단계로 이관.

## BDR-current/ 갭 3건 → 시안 매핑

| 갭 | 시안 | 비고 |
|----|------|------|
| G1 playoffs hub | PA8 `AdminTournamentPlayoffs.jsx` (NEW) | 5 섹션 운영 패턴 |
| G2 prospectus 진입점 | PA9 `AdminTournamentProspectus.jsx` (NEW) | PDF→AI 4-step |
| G3 wizard 자동 채움 | PA9 (4-step → wizard 진입) | 미리보기 → wizard |

---

## 자체 검수 (06-self-checklist) · E 등급 자체 영역

본 의뢰는 **E 등급** (어드민 — AppNav 적용 외 / 자체 sidebar 셸).
00-master-guide §13 룰 중 §A AppNav 7 룰은 적용 외. §B / §C / §D 만 강제.

### §1 AppNav — 적용 외 (E 등급)
- 본 의뢰 시안 = `<window.AdminShell />` (shared.jsx) 자체 sidebar 사용 / AppNav 그리지 않음
- 위반 검수 4 케이스 자체 발생 0 (AppNav 없음)

### §2 더보기 — 가짜링크 신규 0
- gameResult / gameReport / guestApps / referee 신규 추가 ❌
- 어드민 sidebar (`ADMIN_NAV_GROUPS`) 도 동일 — 가짜링크 신규 ❌

### §3 디자인 토큰 ✅ 100%
- `tokens.css` var(--*) 만 / hex 0건 / `--color-*` 폐기 토큰 0건 / lucide-react 0건
- 색상: accent (BDR Red) / cafe-blue / bdr-navy / ok / warn / err / ink-* 토큰만
- 핑크 · 살몬 · 코랄 · 따뜻한 베이지 ❌

### §3 라운딩 ✅
- 버튼 / 카드 4-8px (`--r-sm` 4px / `--r-md` 6px / `--r-lg` 8px)
- pill `9999px` 0건 (acp-hero__trophy 만 50% 원형 — W=H 정사각형)

### §4 아이콘 ✅
- Material Symbols Outlined 100% / lucide-react 0건
- 검증된 이모지: 🏆 (PA7 우승 hero)

### §5 모바일 ✅ (룰 13 / 사용자 결정 §7)
- 720px 분기: 모든 admin.css 섹션에 `@media (max-width: 720px)` + `.vp--mobile` 미러
- iOS input 16px: PA2 QuickCreate `awz-form__input` `font-size: 16px`
- 버튼 44px 터치: 모바일 sticky 공개 버튼 `.atsh-mobile-sticky .btn { min-height: 44px }`
- 인라인 grid repeat(N, 1fr) 사용 시 720px 분기 ✅ (aen-grid / acp-grid / adv-grid / apl-bracket)

### §6 연결성 ✅
- 10 시안 모두 상단 JSDoc 매트릭스 (진입 / 복귀 / 에러)
- 양측 연계: D1 (PA7) ↔ UB1 / E1 (PA8) → D1 / E2 (PA9) → A2 wizard

### §7 E 등급 자체 영역 룰 ✅
- 어드민 sidebar 자체 디자인 (shared.jsx ADMIN_NAV_GROUPS) — AppNav 가드 적용 외
- 시안 검수 — 일반 사용자 시선 / 운영자 시선 분리 (PA4 의 B7 카드 = 운영자가 사용자 미리보기 진입)

### §8 산출물 체크리스트 ✅
- BDR v2.19/ 단일 폴더 / README 갱신 (본 파일)
- 의뢰 시안 10건 모두 박제 (수정 7 + 신규 3) + admin.css 패턴 9건 추가

---

## 사용자 결정 §1~§8 보존

| § | 결정 | v2.19 영향 |
|---|------|----------|
| §1 헤더 (AppNav) | 9 메인 탭 / 더보기 / utility bar | E 등급 — 적용 외 (어드민 sidebar 자체) |
| §2 더보기 5그룹 | 가짜링크 4건 ❌ | 어드민 sidebar 도 가짜링크 신규 ❌ |
| §3 팀 페이지 | 레이팅 stat 제거 | 영향 없음 |
| §4 프로필 | 이모지 아이콘 / 사이드바 | 영향 없음 |
| §5 메인 페이지 | Hero 카로셀 | 영향 없음 |
| §6-1 글로벌 카피 | "서울 3x3 농구 커뮤니티" 보존 | 어드민 카피 — 일반 라벨 사용 |
| §6-2 About 운영진 실명 ❌ | 일반 라벨 | PA3 종별 위임 TAM = `김민수` (mock 일반 라벨) / 실명 추가 ❌ |
| §7 모바일 (720px / iOS 16px / 44px) | 글로벌 가드 | ✅ 10 시안 모두 적용 |
| §8 인증/권한 | captainId 매칭 | PA3 super_admin 권한 가드 시안만 (운영 구현 Phase 1C) |

---

## 다음 단계 (Phase 1C — 운영 박제)

본 시안 박제 완료 후 운영 코드 박제는 별 Phase. PR 그룹 제안:

### Phase 1A 운영 박제 (10 PR 그룹)

- **PR-A1** AdminTournamentAdminList — 단일 진입점 CTA + 4 옵션 모달
- **PR-A2** AdminTournamentWizard1Step — sub-tab + draft 복구 (sessionStorage / DB draft 검출)
- **PR-A3** AdminWizardAssociation — 4-step stepper UI + 종별 위임 권한 분리
- **PR-B1** AdminTournamentSetupHub — depends_on 시각화 + 잠금 toast + 모바일 sticky (Phase 1B B7 위 추가)
- **PR-C1** AdminTournamentMatches — PlaceholderValidationBanner 표준 (모든 어드민 페이지 baseline)
- **PR-C2** AdminTournamentDivisions — 종별 추가 hero + 5 예시 라벨
- **PR-D1** AdminTournamentCompleted (NEW) — 종료 후 hub 신규 라우트 + status=completed 분기 (UB1 사용자 측과 연계)
- **PR-E1** AdminTournamentPlayoffs (NEW) — playoffs hub 5 섹션 + AdvancePlayoffsButton
- **PR-E2** AdminTournamentProspectus (NEW) — PDF 분석 API + 미리보기 + wizard 자동 채움 (G2/G3)
- **PR-css** admin.css 패턴 9건 운영 SCSS 변환

Phase 1A + Phase 1B 합산 = **18 시안** + 1 컴포넌트 = 19 파일 / 8 + 10 = 18 PR.

---

## 9 사각지대 전체 (참고)

| # | 사각지대 | 영향도 | v2.19 처리 |
|---|---------|-------|----------|
| S1 | 대회 생성 진입점 3중화 | ★★★★★ | PA1 + PA2 + PA3 |
| S2 | 셋업 hub 진행도 표기 미사용 | ★★★★ | PA4 |
| S3 | 재진입 시 draft 복구 미지원 | ★★★★ | PA2 + PA9 |
| S4 | 다중 종별 대회 흐름 발견성 약함 | ★★★★ | PA6 |
| S5 | 종료 후 흐름 누락 | ★★★ | PA7 (NEW) |
| S6 | 권한 분기 UI 비대칭 | ★★★ | PA1 / PA3 |
| S7 | 모바일 (≤720px) 셋업 hub 미흡 | ★★★ | PA4 |
| S8 | 에러 / 검증 피드백 산발 | ★★★ | PA5 (vban 표준) |
| S9 | AppNav frozen vs 어드민 영역 정합 | ★★ | Phase 1C 운영 박제 단계 |
