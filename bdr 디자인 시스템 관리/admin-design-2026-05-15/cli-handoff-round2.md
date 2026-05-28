# CLI 핸드오프 2 차 의뢰서 — 시각 변화 확장 + 누락 영역 박제 (2026-05-16)

> **CLI 진입점 2차**. Cowork (또는 Claude Code) 새 세션에 본 마크다운 전체 paste.
> 본 의뢰 = 1차 핸드오프 (`cli-handoff-master.md`) 의 12 commit 후 잔여 작업 처리.
> 작업 대상: `C:\0. Programing\mybdr\`

---

## 0. 배경 — 1차 CLI 결과 분석

### 0-1. 1차 CLI 가 한 것 (12 commit)
- ✅ `d43704a` BDR-current sync v2.14
- ✅ `05caa04` Admin-1 — components/admin 신규 5 (AdminShell / AdminStatCard / AdminEmptyState / AdminChecklistCard / AdminProgressBar) + admin.css 1173 LOC
- ✅ `d98ff79` Admin-3 — wizard 상단 헤더
- ✅ `705ebd0` Admin-4-A — Tournament 영역 3 (헤더 + 뱃지만)
- ✅ `00e65a9` Admin-4-C — Community + News (헤더만)
- ✅ `dbbe9f0` Admin-5-A — Users + GameReports + Suggestions
- ✅ `0994a4d` Admin-5-B — Plans + Payments + Campaigns
- ✅ `959ed0c` Admin-5-C — Partners + Organizations
- ✅ `721150f` Admin-6 — 시스템/me 5 페이지
- ✅ `24fcf7b` Admin-7-B Sub-B1 — SetupHub
- ✅ `efcc103` Admin-7-B Sub-B2 — EditWizard
- ✅ `06069a4` Admin-7-B Sub-B3 — Wizard1Step
- ✅ `4c482cd` Admin-9 — WizardAssociation (잘못 라벨)

### 0-2. 1차 CLI 의 박제 한계 (PM 보고)
1차 박제는 **AdminPageHeader + 상태 뱃지** 만 진행. 시각 변화가 작아 PM 이 "변경된게 크게 없는거 같지" 라고 평가:

| 영역 | 1차 처리 | 시각 변화 |
|------|---------|---------|
| 페이지 상단 헤더 | ✅ 시안 패턴 적용 | 적음 (eyebrow + breadcrumbs 추가) |
| 상태 뱃지 | ✅ admin-stat-pill[data-tone] | 미묘 (색상만) |
| AdminShell wrapper | ❌ 신규 박제만 / layout.tsx 채택 안 함 | **0** |
| Sidebar 시각 | ❌ 기존 sidebar.tsx 그대로 | **0** |
| Dashboard 본문 (StatCard 그리드 / 차트 / 로그) | ❌ 기존 그대로 | **0** |
| 페이지 본문 (테이블 / 카드 / 폼) | ❌ 기존 그대로 | 적음 |

### 0-3. 1차 CLI 누락 영역
- ❌ Admin-2 별도 commit 없음 (Dashboard 본문 미박제 — page.tsx 주석만 있고 본문 시각 변경 안 됨)
- ❌ Admin-4-B Games / Teams / Courts (3 페이지)
- ❌ Admin-7-A AdminHome / AdminList / Series + SeriesCreate + SeriesDetail (5 페이지)
- ❌ Admin-7-B 잔여 Teams / Admins / Recorders / Site / Bracket / Matches / Divisions (7 페이지)
- ❌ Admin-8 Phase F 잔여 토큰 매핑 (referee / partner-admin)
- ❌ Admin-9 자동 검증 (라벨링은 했지만 실제 grep / tsc / eslint 미실행)

---

## 1. 본 의뢰 목표 (PM 결정 2026-05-16)

PM 결정:
1. **시각 변화 확장** — 헤더만 전략 탈피. AdminShell 채택 + sidebar 시각 교체 + 페이지 본문까지 시안 패턴 적용
2. **누락 영역 모두 처리** — Admin-2 / 4-B / 7-A 잔여 / 7-B 잔여 / 8 / 9

→ 본 의뢰 완료 = admin 디자인 시스템 100% 박제 + 사용자 시각 변화 명확.

---

## 2. 사전 점검 (작업 시작 전)

```bash
cd "C:\0. Programing\mybdr"
git branch --show-current        # subin 이어야 함
git status -s | wc -l            # 0 (clean) 기대
git log -3 --oneline             # 마지막 = 6638575 또는 그 이후 commit
ls src/components/admin/         # admin-shell.tsx / admin-stat-card.tsx 등 1차 박제 결과 확인
```

→ "1차 박제 결과 위에서 2차 진행해도 될까요?" PM 결재 받기. **승인 전 작업 진행 금지.**

---

## 3. Phase 1 — AdminShell 채택 + sidebar 시각 교체 ⭐ 가장 큰 시각 변화

### 3-1. 작업 영역
- `src/app/(admin)/admin/layout.tsx` — AdminSidebar / AdminMobileNav 직접 사용 → **AdminShell wrap** 으로 변경
- `src/components/admin/sidebar.tsx` — 시안 `admin-aside` CSS 패턴 시각 교체 (className 만 변경 / navStructure 유지)
- `src/components/admin/mobile-admin-nav.tsx` — 시안 `admin-mobile-nav` CSS 패턴 시각 교체

### 3-2. layout.tsx 변경 패턴
```tsx
// AS-IS (현재)
<div className="min-h-screen bg-[var(--color-background)]">
  <div className="hidden lg:block"><AdminSidebar ... /></div>
  <div className="lg:hidden"><AdminMobileNav ... /></div>
  <main className="lg:ml-64">
    <div className="hidden lg:flex justify-end px-6 pt-4"><UserMenu ... /></div>
    <div className="mx-auto max-w-7xl p-6 pt-16 lg:pt-2">{children}</div>
  </main>
</div>

// TO-BE (시안 AdminShell 채택)
<AdminShell
  sidebar={<AdminSidebar roles={summary.roles} />}
  mobileNav={<AdminMobileNav roles={summary.roles} user={{ ... }} />}
  topbarRight={<UserMenu nickname={...} email={...} />}
>
  {children}
</AdminShell>
```

### 3-3. sidebar.tsx 시각 교체 패턴
시안 `BDR-current/components-admin.jsx` 의 AdminSidebar 의 JSX 패턴을 운영 sidebar.tsx 에 카피:
- `<aside className="admin-aside">`
- `<div className="admin-aside__logo">` + ADMIN 빨간 배지
- `<div className="admin-aside__group">` + `<div className="admin-aside__title">` + `<button className="admin-aside__link" data-active={...} data-child={...}>`
- 하단 footer: ThemeSwitch + 마이페이지 + 사이트로 돌아가기

비즈니스 로직 (navStructure / filterStructureByRoles / renderItem) **변경 0** — JSX 클래스명 + 구조만 시안 패턴으로 교체.

### 3-4. mobile-admin-nav.tsx 시각 교체
시안 `BDR-current/components-admin.jsx` 의 AdminMobileNav 패턴 (햄버거 + 좌측 드로어 + 오버레이) 카피.

### 3-5. 자체 검수
□ localhost:3001/admin 진입 시 sidebar 시각 변화 확인 (admin-aside CSS 패턴)
□ 모바일 (<1024px) 햄버거 + 드로어 정상 동작
□ 4 권한 (super/site/tournament/partner) sidebar 차이 시각 확인
□ 라이트/다크 토글 정상 동작
□ navStructure / 권한 필터 로직 변경 0 확인 — tsc 0 errors

### 3-6. commit
```
refactor(admin): Phase 1 — AdminShell 채택 + sidebar 시각 교체 (시안 v2.14 admin-aside CSS 패턴)
```

---

## 4. Phase 2 — Admin-1 잔여 컴포넌트 시각 갱신

### 4-1. 작업 영역
- `src/components/admin/admin-page-header.tsx` — 시안 AdminPageHeader 패턴 (eyebrow / title / subtitle / actions / breadcrumbs) 박제
- `src/components/admin/admin-status-tabs.tsx` — 시안 AdminStatusTabs (count 뱃지 W=H 정사각형) 박제
- `src/components/admin/admin-detail-modal.tsx` — 시안 AdminDetailModal (우측 슬라이드인) 박제

### 4-2. 변경
각 기존 컴포넌트의 JSX 구조 + className 만 시안 패턴으로 교체. props 시그니처 변경 0 (호출하는 18+ 페이지 영향 0).

### 4-3. commit
```
refactor(admin): Phase 2 — admin-page-header / status-tabs / detail-modal 시안 v2.14 시각 박제
```

---

## 5. Phase 3 — AdminDashboard 본문 박제 (Admin-2 완성)

### 5-1. 작업 영역
- `src/app/(admin)/admin/page.tsx` — 통계 그리드 + 7일 차트 + 최근 활동 본문 박제

### 5-2. 시안 → 운영 매핑
시안 `BDR-current/screens/AdminDashboard.jsx` 의 다음 영역 박제:
- 통계 그리드 = `<div className="admin-stat-grid">` + AdminStatCard × 4
- 7일 차트 = `<div className="admin-chart">` + `admin-chart__head` + `admin-chart__body` + `admin-chart__bar[data-zero]`
- 최근 활동 = `<div className="admin-log-card">` + `admin-log-row` × 5 + severity dot

### 5-3. 비즈니스 로직 보존
- Prisma query 4건 (userCount / tournamentCount / matchCount / teamCount) **변경 0**
- raw SQL (7일 차트) **변경 0**
- ACTION_LABEL 매핑 **변경 0**

### 5-4. commit
```
refactor(admin): Phase 3 — Admin-2 AdminDashboard 본문 박제 (admin-stat-grid + admin-chart + admin-log-card)
```

---

## 6. Phase 4 — Admin-4-B 누락 3 페이지 박제

### 6-1. 작업 영역
- `src/app/(admin)/admin/games/page.tsx` — AdminPageHeader + AdminStatusTabs + DataTable 본문 + 상태 뱃지
- `src/app/(admin)/admin/teams/page.tsx` — AdminPageHeader + DataTable 본문
- `src/app/(admin)/admin/courts/page.tsx` — AdminPageHeader + DataTable + "코트 추가" CTA

### 6-2. 패턴 = Admin-5-A/B/C 동일 (헤더 + 뱃지 + 본문 시각 갱신)

### 6-3. commit
```
refactor(admin): Phase 4 — Admin-4-B Games + Teams + Courts 시안 박제 (BDR v2.14)
```

---

## 7. Phase 5 — Admin-7-A 누락 5 페이지 박제

### 7-1. 작업 영역
- `src/app/(admin)/tournament-admin/page.tsx` — AdminHome (대회 운영자 도구 홈)
- `src/app/(admin)/tournament-admin/tournaments/page.tsx` — AdminList (본인 대회 목록)
- `src/app/(admin)/tournament-admin/series/page.tsx` — Series 목록
- `src/app/(admin)/tournament-admin/series/new/page.tsx` — SeriesCreate
- `src/app/(admin)/tournament-admin/series/[id]/page.tsx` — SeriesDetail

### 7-2. 시안 source
- `BDR-current/screens/AdminTournamentAdminHome.jsx`
- `BDR-current/screens/AdminTournamentAdminList.jsx`
- `BDR-current/screens/Series.jsx`
- `BDR-current/screens/SeriesCreate.jsx`
- `BDR-current/screens/SeriesDetail.jsx`

### 7-3. commit
```
refactor(tournament-admin): Phase 5 — Admin-7-A AdminHome + List + Series 5 페이지 시안 박제
```

---

## 8. Phase 6 — Admin-7-B 잔여 7 페이지 시각 갱신

### 8-1. 작업 영역 (시안 v2.14 미박제이지만 운영 페이지는 존재)
- `src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx`
- `.../admins/page.tsx`
- `.../recorders/page.tsx`
- `.../site/page.tsx`
- `.../bracket/page.tsx`
- `.../matches/page.tsx`
- `.../divisions/page.tsx`

### 8-2. 박제 범위 (시안 부재 — 헤더만 시안 패턴 적용)
- 각 페이지에 AdminPageHeader (eyebrow "ADMIN · 대회 운영" + breadcrumbs 4단계 + actions) 박제
- 본문 시각 = 기존 운영 그대로 유지 (시안 부재)

### 8-3. commit
```
refactor(tournament-admin): Phase 6 — Admin-7-B 잔여 7 페이지 헤더 통일 (시안 v2.14 AdminPageHeader 패턴)
```

---

## 9. Phase 7 — 본문 시각 확장 (선택 — 분량 결정 후 진행)

### 9-1. 본 Phase 의 목표
1차 + 본 의뢰 Phase 1~6 완료 시점에 페이지 본문이 여전히 운영 그대로면 시각 변화 부족.
본 Phase = 페이지별 본문 (DataTable / 카드 그리드 / 필터바) 을 시안 패턴으로 확장.

### 9-2. 박제 영역 (페이지 별)
- 모든 admin 페이지의 DataTable → admin-data-table 클래스 (필요 시 신규 컴포넌트 박제)
- AdminFilterBar 신규 — 검색 + 상태 필터 + 정렬
- AdminPagination 신규 (필요 시)
- 각 페이지의 카드 그리드 → `admin-stat-grid` / `admin-card-grid` 클래스 적용

### 9-3. 신규 컴포넌트 (옵션)
- `src/components/admin/admin-data-table.tsx` — 테이블 표준화
- `src/components/admin/admin-filter-bar.tsx` — 필터 표준화

### 9-4. 위험 인지
본 Phase = 분량 큼. PM 결재 받고 영역별 분할 진행. 본 의뢰서는 Phase 1~6 완료 후 별 의뢰서로 진행 권장.

### 9-5. commit (영역별 분할)
```
feat(admin): Phase 7-A — AdminDataTable / AdminFilterBar 신규 컴포넌트 박제
refactor(admin): Phase 7-B — Phase B 페이지 본문 시각 확장
refactor(admin): Phase 7-C — Phase C 페이지 본문 시각 확장
... 등 영역별 분할
```

---

## 10. Phase 8 — Admin-8 잔여 토큰 매핑

### 10-1. 작업 영역
- `src/app/(referee)/*` (28 파일)
- `src/app/(referee-public)/*` (3 파일)
- `src/app/(web)/partner-admin/*` (5 파일)
- 기타 grep `var(--color-*)` 잔여

### 10-2. 토큰 매핑 (Phase F 표준)
- `--color-primary` → `--accent`
- `--color-card` → `--bg-card`
- `--color-surface` → `--bg-elev`
- `--color-border` → `--border`
- `--color-text-muted` → `--ink-mute`
- ... (총 11 매핑)

### 10-3. 작업 방법
```bash
# Step 1: grep 으로 잔여 영역 식별
grep -rl "var(--color-" src/app/\(referee\)/ src/app/\(referee-public\)/ src/app/\(web\)/partner-admin/

# Step 2: sed 일괄 매핑 (dry-run 먼저 — --echo-only)
# Step 3: PM 승인 후 실행
```

### 10-4. commit (영역별 분리)
```
refactor(referee): Phase 8-A — referee 토큰 일괄 매핑 (Phase F)
refactor(referee-public): Phase 8-B — referee-public 토큰 일괄 매핑
refactor(partner-admin): Phase 8-C — partner-admin 토큰 일괄 매핑
```

---

## 11. Phase 9 — 자동 검증

### 11-1. 검증 명령
```bash
# 폐기 토큰 0 확인
grep -r "var(--color-" src/ | wc -l    # → 0 기대

# TypeScript 0 errors
npx tsc --noEmit

# ESLint 0 errors
npx eslint src/

# 시각 검증 (PM)
# localhost:3001/admin/* — 모든 admin 페이지 라이트/다크 진입
# 4 권한 mock (super/site/tournament/partner) sidebar 차이 확인
# /tournament-admin/* — tournament-admin 진입점 확인
```

### 11-2. 검증 실패 시
실패 항목 발견 시 즉시 PM 보고 + 보완 commit. 통과 시 본 의뢰 완료 commit:

### 11-3. commit
```
test(admin): Phase 9 — 자동 검증 통과 (grep var(--color-) src/ → 0 / tsc 0 / eslint 0 / 시각 4 권한 OK)
```

---

## 12. 작업 진행 명령 (CLI 가 본 의뢰 받으면)

```
1. §2 사전 점검 → PM 결재
2. §3 Phase 1 (AdminShell + sidebar 시각) → commit → 시각 검증 → PM 결재
3. §4 Phase 2 (잔여 3 컴포넌트 시각) → commit → 검증
4. §5 Phase 3 (Dashboard 본문) → commit → 검증
5. §6 Phase 4 (Admin-4-B 3 페이지) → commit
6. §7 Phase 5 (Admin-7-A 5 페이지) → commit
7. §8 Phase 6 (Admin-7-B 잔여 7 페이지 헤더) → commit
8. §9 Phase 7 (본문 확장) — PM 결재 후 진행 여부 결정
9. §10 Phase 8 (잔여 토큰 매핑) → commit (영역별 분리)
10. §11 Phase 9 (자동 검증) → 최종 commit + 보고
```

각 Phase 후 사용자 시각 검증 + 다음 진행 결재. 본 의뢰는 multi-session 작업 가능성.

---

## 13. 안전 가드 (CLAUDE.md §🚦)

- ✅ `subin` 브랜치만 — main / dev 직접 push 금지
- ✅ DB destructive 작업 0 (UI 시각만)
- ✅ 운영 DB 영향 0
- ✅ 비즈니스 로직 변경 0 — Prisma query / action / state 보존 (Phase 1~6 모두)
- ✅ Phase 별 commit 분리 — 회귀 발견 시 revert 용이
- ✅ 시각 검증 의무 (localhost:3001) — Phase 별
- ✅ push 는 PM 결재 후
- ⚠️ Phase 1 의 AdminShell 채택 = layout.tsx 변경 = 전체 admin 영역 영향. 시각 회귀 검증 최우선

---

## 14. 위험 + 분할 옵션

### 14-1. 위험
- Phase 1 (AdminShell 채택) = 전체 admin layout 변경 = 회귀 위험 최고
- Phase 7 (본문 확장) = 분량 가장 큼 — 별 의뢰서 분할 권장
- Admin-1 신규 5 컴포넌트가 박제됐어도 실제 사용 X 가능성 — 본 의뢰의 Phase 1 이 채택 보장

### 14-2. 분할 가이드
본 의뢰서 = 큰 흐름. 영역별 작은 의뢰서 분할 가능:
- `cli-handoff-round2-A.md` = Phase 1 + 2 (AdminShell + 잔여 컴포넌트)
- `cli-handoff-round2-B.md` = Phase 3 ~ 6 (페이지 박제)
- `cli-handoff-round2-C.md` = Phase 7 (본문 확장) — 별 의뢰서
- `cli-handoff-round2-D.md` = Phase 8 + 9 (토큰 + 검증)

Cowork context 부담되면 위 4 분할 권장.

---

## 15. 본 의뢰 완료 기준

```
□ Phase 1 AdminShell 채택 commit + 시각 검증 (sidebar 시각 변화 확인)
□ Phase 2 잔여 3 컴포넌트 시각 갱신 commit
□ Phase 3 Dashboard 본문 commit + 시각 검증
□ Phase 4 Admin-4-B 3 페이지 commit
□ Phase 5 Admin-7-A 5 페이지 commit
□ Phase 6 Admin-7-B 잔여 7 페이지 헤더 commit
□ (선택) Phase 7 본문 확장 — PM 결재 후
□ Phase 8 잔여 토큰 매핑 commit
□ Phase 9 자동 검증 통과 + 최종 commit
□ grep var(--color-*) src/ → 0
□ admin 영역 전체 라이트/다크 4 권한 시각 검증 통과
```

→ 본 의뢰 완료 = admin 디자인 시스템 100% 박제 + 사용자 시각 변화 명확.

---

작업 시작.
