# 작업 스크래치패드

## 현재 작업
- **요청**: 권한 시스템 Phase 1-A + 1-C + Phase 2 통합 (1 PR)
- **상태**: ✅ 구현 완료 (tester/PM 검증 대기)
- **모드**: no-stop

## 진행 현황표
| 단계 | 상태 |
|------|------|
| §1 인벤토리 (8 헬퍼 + 4 layout + 9 admin actions) | ✅ |
| §2 super_admin 우회 일관성 점검 | ✅ |
| §3 발견 6건 + Phase 분해 | ✅ |
| §4 사용자 결재 5건 박제 | ✅ |
| §5 developer 진입 (Phase 1-A + 1-C + Phase 2) | ✅ |
| §6 tsc 0 / vitest 296/296 PASS | ✅ |
| §7 PM 커밋 대기 | ⏳ |

## 구현 기록 (developer) — 권한 시스템 super_admin 우회 + 통합

📝 구현 범위: Phase 1-A (partner-admin + RoleMatrixCard UI) + Phase 1-C (requireTournamentAdmin) + Phase 2 (isSuperAdmin 단일 source 통합)

### 변경 파일

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/auth/is-super-admin.ts` | isSuperAdmin 단일 source 신규 — `SuperAdminSession` 타입 + null/undefined 안전 | 신규 |
| `src/lib/auth/org-permission.ts` | 본체 → re-export (단일 source 위임) + @deprecated 마크 | 수정 |
| `src/lib/auth/tournament-permission.ts` | 인라인 isSuperAdmin 제거 → import 통합 | 수정 |
| `src/lib/auth/match-stream.ts` | 인라인 isSuperAdmin 제거 → import 통합 | 수정 |
| `src/lib/auth/match-lineup.ts` | 인라인 isSuperAdmin 제거 → import 통합 | 수정 |
| `src/lib/auth/require-score-sheet-access.ts` | 인라인 isSuperAdmin 변수 → 단일 source 호출 | 수정 |
| `src/lib/auth/tournament-auth.ts` | Phase 1-C super_admin 분기 추가 (requireTournamentAdmin) + isTournamentInsider 인라인 제거 | 수정 |
| `src/app/(web)/partner-admin/layout.tsx` | Phase 1-A super_admin 우회 (membership 없어도 진입) + sentinel "(super_admin 권한으로 진입)" 표시 | 수정 |
| `src/app/(admin)/admin/me/_components/role-matrix-card.tsx` | Phase 1-A UI 개선 — super_admin 안내 박스 + `superAdminAuto` prop ("보유 (Super 자동)" 표시) | 수정 |
| `src/__tests__/lib/is-super-admin.test.ts` | 신규 10 케이스 (null / undefined / role / admin_role / 둘 다 / 빈 / 다른 role 4종) | 신규 |

### isSuperAdmin 통합 결과
- **단일 source 위치**: `src/lib/auth/is-super-admin.ts` — `export function isSuperAdmin(session: SuperAdminSession | null | undefined): boolean`
- **5 파일 인라인 제거 결과**:
  - `tournament-permission.ts` — function 본체 제거 → import ✅
  - `match-stream.ts` — function 본체 제거 → import ✅
  - `match-lineup.ts` — function 본체 제거 → import ✅
  - `require-score-sheet-access.ts` — 인라인 변수 → import 호출 ✅
  - `tournament-auth.ts` — `isTournamentInsider` 인라인 조건문 → import 호출 ✅ (추가 발견 fix)
- **외부 호환**: `org-permission.ts` re-export 유지 (game-reports route 등 기존 호출자 영향 0)
- **`rbac.ts`**: role-only 시그니처 — 별도 사용처 (token role string 만 받는 케이스). 본 PR 범위 외 (의미 다름 — Phase 후속 deprecate 검토)

### Phase 1-C 범위 확장 점검 결과
- `canManageTournament` (tournament-permission) — ✅ 이미 분기 있음
- `resolveMatchStreamAuth` / `canManageMatchStream` (match-stream) — ✅ 이미 분기 있음
- `resolveLineupAuth` / `getLineupCanEdit` (match-lineup) — ✅ 이미 분기 있음
- `requireScoreSheetAccess` (require-score-sheet-access) — ✅ 이미 분기 있음 (단일 source 사용으로 통합)
- `isTournamentInsider` (tournament-auth) — ✅ 이미 분기 있음 (단일 source 위임 추가)
- **`requireTournamentAdmin` (tournament-auth)** — ❌ 누락 → ✅ Phase 1-C fix (tournament 존재 확인 후 super_admin 즉시 통과 분기)
- **결론**: super_admin 우회 누락은 본 1건만 추가 발견 (다른 헬퍼는 모두 이미 OK)

### Phase 1-A 핵심 변경 요약
1. **partner-admin/layout.tsx** — `isSuperAdmin(session)` 분기 후 membership 없어도 진입 허용. 표시 이름은 본인 partner 있으면 그것, 없으면 "(super_admin 권한으로 진입)" sentinel.
2. **RoleMatrixCard** — super_admin 시 상단 안내 박스 (BDR Red 강조 / shield_person 아이콘 / "모든 영역 자동 접근 가능"). `BooleanRow` 의 `superAdminAuto` prop 추가 — Site Admin / Tournament Admin 행에 적용 시 "보유 (Super 자동)" 회색 차분 표시. TournamentList / MembershipRow 는 실 데이터 그대로 표시 (사용자 결재 정책 — 위임/소속 현황 진실).

### 검증
- ✅ **tsc --noEmit 0 에러** (출력 0줄 PASS)
- ✅ **vitest 296/296 PASS** (기존 286 + 신규 10 — is-super-admin.test.ts) / 회귀 0
- ✅ **BigInt n 리터럴**: 0건 (신규 파일 grep)
- ✅ **lucide-react**: 0건 (role-matrix-card.tsx grep — Material Symbols 만)
- ✅ **핑크 hardcode**: 0건 (var(--color-*) 토큰만)

💡 tester 참고
- **vitest**: `npx vitest run` — 296/296 PASS 확인
- **수동 검증 1** (Phase 1-A partner-admin): super_admin 계정 (snukobe / isAdmin=true) 로 `/partner-admin` 진입 → membership 없으면 sentinel 표시, 있으면 본인 partner 표시
- **수동 검증 2** (Phase 1-A UI): super_admin 계정으로 `/admin/me` 진입 → 상단 BDR Red 안내 박스 + Site/Tournament Admin 행 "보유 (Super 자동)" 회색 표시
- **수동 검증 3** (Phase 1-C requireTournamentAdmin): super_admin 계정으로 본인이 organizer/TAM 아닌 토너먼트 admin 라우트 진입 — 403 → 200 통과 확인
- **회귀 가드**: 일반 사용자 (super_admin 아님) 동작 영향 0 — 6/6 권한 헬퍼 super_admin 분기는 모두 super_admin 한정 통과 path

⚠️ reviewer 참고
- **단일 source 시그니처**: `SuperAdminSession = { role?: string; admin_role?: string }` 가장 느슨한 입력 (JwtPayload + 옵셔널 admin_role 양쪽 호환).
- **org-permission.ts re-export**: `isSuperAdmin(session: JwtPayload)` 시그니처 유지 → 외부 호출자 (game-reports/page route) 호환. 신규 코드는 단일 source 직접 import 권장.
- **rbac.ts isSuperAdmin(role: string)**: role-only 시그니처 — JWT role 만 받는 별도 의미 (admin_role 미체크). 본 PR 통합 대상 아님 (사용처 검토 후 Phase 후속).
- **RoleMatrixCard TournamentList/MembershipRow**: 사용자 결재대로 실 데이터 그대로 표시 (super_admin 자동 포함 안내와 별개 — 위임/소속 현황 진실).
- **partner-admin sentinel**: super_admin 우회 시 partner 이름 "(super_admin 권한으로 진입)" 박제 — UX 단순화 (첫 active partner 자동 선택 대신 명시적 sentinel).

## 기획설계 (planner-architect) — 권한 시스템 종합 정리 + 개선 (2026-05-11)

🎯 **목표**: super_admin = 전능 권한 보장 (UI 표시 + 코드 우회 정합) + 8개 권한 type 인벤토리 박제 + 권한 헬퍼 중복 제거 우선순위 결정.

### A. 권한 시스템 인벤토리 (8 type)

| # | 권한 type | DB / 세션 컬럼 | 진입 조건 | 차단 영역 | 검증 헬퍼 | 사용처 (대표) |
|---|----------|--------------|---------|---------|----------|------------|
| 1 | **super_admin** | `User.isAdmin=true` → JWT `role` & `admin_role` 둘 다 `"super_admin"` | isAdmin DB 토글 (admin 페이지) | 전체 시스템 | `isSuperAdmin()` (5곳 중복: tournament-permission / match-stream / match-lineup / org-permission / rbac) | `(admin)` layout + 모든 가드 |
| 2 | **site_admin** | `User.admin_role="site_admin"` → JWT `admin_role` | 사용자가 admin 페이지에서 부여 | 유저/팀/코트/대회/커뮤니티 운영 | `summary.siteAdmin` (admin-roles) | `(admin)/admin/layout.tsx` 메뉴 필터 |
| 3 | **tournament_admin (membership)** | `User.membershipType=3` → JWT `role="tournament_admin"` | 결제 (₩199,000/월) | `/tournament-admin/*` 진입 | `session.role==="tournament_admin"` (직접 비교) | `(admin)/tournament-admin/layout.tsx` |
| 4 | **TAM (TournamentAdminMember)** | `tournament_admin_members` row (`userId` + `tournamentId` + `isActive=true`) | 대회 운영자가 위임 | 위임받은 단일 대회 | `canManageTournament()` / `requireTournamentAdmin()` / `isTournamentInsider()` / `resolveMatchStreamAuth()` / `resolveLineupAuth()` / `requireScoreSheetAccess()` (**6곳**) | 대회 운영 어드민 라우트 전체 |
| 5 | **tournament_recorders** | `tournament_recorders` row (`recorderId` + `tournamentId` + `isActive=true`) | 대회 운영자가 기록원 등록 | 점수 입력 (Flutter v1 + 웹 기록지) | `requireRecorder()` (Flutter) / `requireScoreSheetAccess()` (웹) | `/api/v1/matches/[id]/stats` + 웹 score-sheet |
| 6 | **partner_member** | `partner_members.user_id` + `is_active=true` | 파트너사 어드민이 멤버 추가 | 협력업체 광고/캠페인 관리 | `partner-admin/layout.tsx` DB SELECT 직접 | `/partner-admin/*` |
| 7 | **org_member** | `organization_members.user_id` + `is_active=true` | 단체 운영자가 멤버 추가 | 단체(시리즈) 운영 | `(admin)/admin/layout.tsx` + `(admin)/tournament-admin/layout.tsx` DB SELECT 직접 | 단체 관리 + admin 메뉴 |
| 8 | **association_admin (referee)** | `User.admin_role="association_admin"` + `AssociationAdmin.user_id` 매핑 + `role` (9종) | 협회 추가 (admin) | 심판/경기 운영 (협회별) | `getAssociationAdmin()` + `hasPermission()` + `requirePermission()` (admin-guard.ts — 12 permission 매트릭스) | `(referee)/referee/admin/*` |

**참고**: `roles.ts` 의 `team_leader / pickup_host / free` 는 membershipType 0~2 매핑 — 권한 게이팅보다 UI/결제 등급. 본 인벤토리에서 별도 type 으로 다루지 않음.

### B. super_admin 우회 일관성 점검 — 발견 5건

| # | 헬퍼/페이지 | super_admin 통과 | 문제 |
|---|-----------|----------------|------|
| 1 | `canManageTournament` (tournament-permission) | ✅ JWT `role`/`admin_role` 둘 다 체크 | OK |
| 2 | `requireTournamentAdmin` (tournament-auth) | ❌ **organizerId 비교만** — super_admin 도 organizer 아니면 TAM SELECT 단계 진입 | ⚠️ super_admin TAM row 0 이면 403 가능 (organizer 인 경우만 통과) |
| 3 | `isTournamentInsider` (tournament-auth) | ✅ JWT `role`/`admin_role` | OK |
| 4 | `canManageMatchStream` / `resolveMatchStreamAuth` | ✅ | OK |
| 5 | `resolveLineupAuth` / `getLineupCanEdit` (match-lineup) | ✅ | OK |
| 6 | `requireScoreSheetAccess` | ✅ | OK |
| 7 | `requireRecorder` (Flutter v1) | ✅ JWT `role` 만 (admin_role 미체크 — Flutter v1 박제) | OK (Flutter v1 JWT 박제 호환) |
| 8 | `getAssociationAdmin` (admin-guard) | ❌ **super_admin 우회 0** — admin_role 이 `"association_admin"` 아니면 차단 | ⚠️ super_admin 이 referee 관리 영역 진입 불가 |
| 9 | `(admin)/admin/layout.tsx` | ✅ super_admin = `roles=["super_admin"]` | OK |
| 10 | `(admin)/tournament-admin/layout.tsx` | ✅ `role==="tournament_admin" || "super_admin"` | OK |
| 11 | **`(web)/partner-admin/layout.tsx`** | ❌ **super_admin 우회 0** — `partner_members` SELECT 만 사용 → 소속 없으면 / redirect | 🔴 **발견 #1 (Phase 1)** super_admin 도 partner-admin 진입 불가 |
| 12 | `(referee)/referee/admin/layout.tsx` | ❌ **super_admin 우회 0** — `admin_role==="association_admin"` 검사만 | 🔴 **발견 #2 (Phase 1)** super_admin 이 referee 관리 진입 불가 |
| 13 | **RoleMatrixCard UI** (admin/me) | ❌ super_admin = "보유" 표시 / 다른 6 권한은 "없음" 표시 | 🟡 **발견 #3 (Phase 1)** super_admin 인데 매트릭스에 "없음" → 직관 어긋남 (사용자 보고) |

**super_admin 체크 코드 중복 — 8 헬퍼**:
- `isSuperAdmin()` 함수가 5 파일에 동일 구현 (tournament-permission / match-stream / match-lineup / org-permission / require-score-sheet-access 인라인)
- `rbac.ts` 의 `isSuperAdmin(role: string)` 은 role 만 받음 (admin_role 미체크) → 사용처 미흡
- `org-permission.ts` 의 `isSuperAdmin(session: JwtPayload)` 가 정식 시그니처

### C. 개선 후보 (6건)

| # | 영역 | 문제 | 개선 | 우선 | Phase |
|---|------|------|------|------|------|
| 1 | partner-admin/layout.tsx | super_admin 진입 불가 | session 체크 추가 — super_admin 이면 partner_members SELECT skip + 통과 (membership 정보는 first row 또는 안내) | 🔴 긴급 | 1 |
| 2 | referee/admin/layout.tsx | super_admin 진입 불가 | session 체크 추가 — super_admin 이면 association_admin 검증 skip | 🔴 긴급 | 1 |
| 3 | RoleMatrixCard UI | super_admin 인데 다른 권한 "없음" 표시 | super_admin 시 BooleanRow 6개에 "super_admin 자동 포함" 안내 배지 + 표시 변경 (회색 "없음" → 파란색 "super 권한") | 🔴 긴급 | 1 |
| 4 | `isSuperAdmin()` 5곳 중복 | 동일 함수 5번 박제 — JwtPayload 시그니처 정합성 약함 | `org-permission.ts` 의 `isSuperAdmin()` 단일 export → 5 곳 import 통합 (`rbac.ts` 도 deprecate) | 🟡 중요 | 2 |
| 5 | `requireTournamentAdmin` (tournament-auth) | super_admin 직접 통과 분기 없음 (organizer 비교 후 TAM SELECT) | super_admin 시 organizer/TAM 단계 skip — `canManageTournament` 와 동일 패턴 | 🟡 중요 | 2 |
| 6 | referee 권한 RoleMatrixCard 표시 | RoleMatrixCard 에 8번째 type (association_admin) 미표시 | `getAdminRoles()` 에 associationAdmin 추가 SELECT (`AssociationAdmin.user_id` + role + association name) + RoleMatrixCard 행 추가 | 🟢 후순위 | 3 |

### D. Phase 분해

| Phase | 범위 | 우선 | 영향 |
|------|------|------|------|
| **Phase 1 (긴급)** | 발견 #1~#3 fix — partner-admin/referee-admin super_admin 우회 + RoleMatrixCard UI | ⭐⭐⭐ | UI 보강 + 2 layout 가드 변경 (super_admin 한정 — 다른 사용자 영향 0) |
| **Phase 2 (중요)** | 발견 #4~#5 — `isSuperAdmin()` 헬퍼 통합 + `requireTournamentAdmin` super_admin 분기 명시 | ⭐⭐ | 리팩토링 (행동 동일 — 회귀 0 보장 필요) |
| **Phase 3 (후순위)** | 발견 #6 — referee 권한 RoleMatrixCard 표시 추가 | ⭐ | RoleMatrixCard 행 1개 + getAdminRoles SELECT 1회 추가 |

### Phase 1 상세 설계

#### Phase 1-A: partner-admin/layout.tsx super_admin 우회
- **수정 파일**: `src/app/(web)/partner-admin/layout.tsx`
- **변경**:
  ```ts
  // 기존: partner_members SELECT 없으면 redirect("/")
  // 신규: session.role === "super_admin" 면 SELECT skip + 안내 헤더 표시
  const isSuperAdmin = session.role === "super_admin" || session.admin_role === "super_admin";
  if (!isSuperAdmin) {
    const membership = await prisma.partner_members.findFirst({...});
    if (!membership) redirect("/");
  }
  ```
- **UX**: super_admin 인데 partner_members 소속 없으면 → partner 이름 = "(super_admin 권한으로 진입)" 표시
- **위험**: 0 (super_admin 한정 — 기존 partner 멤버 동작 영향 0)

#### Phase 1-B: referee/admin/layout.tsx super_admin 우회
- **수정 파일**: `src/app/(referee)/referee/admin/layout.tsx`
- **변경**: 같은 패턴 — super_admin 이면 `AssociationAdmin` 검증 skip → `<AccessDenied />` 대신 통과
- **위험**: `getAssociationAdmin()` 호출 페이지 (referee admin actions) 도 super_admin 우회 필요할 가능성 — Phase 1-B 안에 admin-guard.ts 도 같이 패치
- **추가 수정**: `src/lib/auth/admin-guard.ts` `getAssociationAdmin()` 도 super_admin 우회 — 다만 super_admin 은 어느 협회 소속도 아니므로 `associationId = 0n` 같은 sentinel 사용해야 함 → ⚠️ 도메인 복잡도 ↑

→ **결정 안건**: referee 영역은 협회 도메인 분리 강함 (admin-guard 의 12 permission 매트릭스). super_admin = "모든 협회 진입 가능" vs "어느 협회도 아님" 트레이드오프 — **사용자 결재 필요**

#### Phase 1-C: RoleMatrixCard UI 개선
- **수정 파일**: `src/app/(admin)/admin/me/_components/role-matrix-card.tsx`
- **변경**: super_admin 시 다른 6 BooleanRow + 4 TournamentList/MembershipRow 모두 "super_admin 권한으로 자동 포함" 배지 표시 (회색 "없음" 대신 파란색 "super 포함")
- **prop 추가**: `RoleMatrixCard({ roles })` → `roles.superAdmin` 으로 분기 — 이미 있음. UI 만 분기.
- **위험**: 0 (UI 만 변경 — 권한 체크 로직 0)

### 핵심 기술 결정 (decisions.md 후보)

- **[2026-05-11] super_admin = 전능 권한 보장 정책 확정**:
  - 모든 권한 헬퍼 + layout 가드 + UI 매트릭스가 super_admin 시 즉시 통과 / "보유" 표시.
  - 예외: Flutter v1 `requireRecorder` 는 JWT only (admin_role 미체크) — Flutter 호환 박제.
  - 새로 권한 가드 추가 시 super_admin 우회 분기 = MUST. PR 체크리스트 항목.

- **[2026-05-11] `isSuperAdmin()` 단일 진입점**:
  - `org-permission.ts` 의 `isSuperAdmin(session: JwtPayload)` 단일 export.
  - 5 헬퍼는 import 사용 (인라인 중복 0). `rbac.ts` 의 role-only 시그니처 deprecate.

### 위험 / 미해결

1. **referee 도메인 super_admin 의미** — 협회별로 분리된 도메인 (12 permission 매트릭스 / settlement / 자격증). super_admin 이 어느 협회로 진입할지 결정 필요 (모든 협회 / 협회 선택 UI / 첫 협회). **사용자 결재 안건 #2**
2. **`partner-admin/layout.tsx` super_admin 표시** — partner.name 무엇으로 보여줄지. "(super_admin 권한 진입)" 같은 sentinel ok? **사용자 결재 안건 #1**
3. **Phase 2 `isSuperAdmin()` 통합 회귀** — 5 헬퍼 동시 패치 시 vitest 회귀 가드 필요 (이미 admin-roles.test 286/286 + require-score-sheet-access.test). Phase 2 전 회귀 가드 확인 → 통합 후 vitest 동일 통과 보장.
4. **`requireRecorder` Flutter v1 ABI** — admin_role 추가 시 Flutter app 호환 영향. 현재 JWT-only 박제 = 의도적 (Flutter 만 사용). Phase 2 패치 시 admin_role 분기는 web caller 만 추가.

### 사용자 결재 사항 (developer 진입 전)

1. **partner-admin super_admin 진입 시 표시 이름** — "(super_admin 권한으로 진입)" sentinel 박제 OK? 또는 첫 active partner 자동 선택?
2. **referee/admin super_admin 진입 정책** — (a) 모든 협회 자동 통과 / (b) 협회 선택 UI 추가 / (c) Phase 1 에서는 referee 만 보류하고 partner + UI 만 진행 — **추천 (c)** (referee 도메인 분리 강함 — 별도 Phase)
3. **Phase 1 범위 확정** — 1-A (partner) + 1-C (UI) 만? 또는 1-B (referee) 까지 한번에?
4. **Phase 2 분기** — Phase 1 commit 후 즉시 Phase 2 진입? 또는 사용자 추가 결재?
5. **Phase 3 referee RoleMatrixCard 행 추가** — getAdminRoles + AssociationAdmin SELECT 추가하면 admin/me 진입 시 1 라운드트립 추가 (React.cache dedup). 진행?

### 추천 결재 (PM 카피 우선순위)

- **결재 #1**: Phase 1-A (partner-admin) + 1-C (RoleMatrixCard UI) **진행** — 영향 0 / UX 즉시 개선
- **결재 #2**: Phase 1-B (referee/admin) — **보류 / 별도 Phase** — admin-guard.ts 의 12 permission 매트릭스 정합 검토 필요
- **결재 #3**: Phase 2 (`isSuperAdmin()` 통합 + `requireTournamentAdmin` 분기) — **Phase 1 commit 후 진행** (벨이 회귀 가드 적정)
- **결재 #4**: Phase 3 (referee RoleMatrixCard 행) — **Phase 1-B 와 함께** (referee 정책 확정 후)

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-11 | (PM 커밋 대기) | **[권한 시스템 Phase 1-A + 1-C + 2 통합]** isSuperAdmin 단일 source 신규 + 5 파일 인라인 제거 + partner-admin super_admin 우회 + RoleMatrixCard "Super 자동" UI + requireTournamentAdmin 분기 추가. 10 파일 변경 / vitest 296/296 PASS (신규 10) / tsc 0. | ✅ |
| 2026-05-11 | (기획만) | **[권한 시스템 종합 분석]** 권한 8 type 인벤토리 + super_admin 우회 점검 13곳 (누락 3건 발견: partner-admin / referee-admin / RoleMatrixCard UI) + 헬퍼 중복 5곳 + 6 개선안 Phase 1~3 분해 + 사용자 결재 5건 (코드 변경 0). | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 3]** 알림 + 건의사항 + 비번 변경 진입점. 신규 2 컴포넌트 + me/page Phase 3 SELECT 4건. tsc 0 / vitest 286/286. ~+523 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 2]** 관리 토너먼트 + 본인인증 + 최근 활동. 신규 3 컴포넌트 + admin-roles 시그니처 발전 + vitest 286/286. ~+1,025 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1 강남구협회장배 유소년]** schema TT +3 / TTP +11 / 신규 3모델 + admin 페이지 + canManageTournament 헬퍼 + apply-token util. tsc 0 / vitest 275/277. | ✅ |
| 2026-05-11 | (조회만) | **펜타곤 김대진 명단 + 오늘 경기 등록 검증** — ttp.id=2562 active / matchId=123 ⑤예선. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 tester ✅]** tsc 0 / vitest 267/267. 권한 8/8 + BFF 5/5. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 종이 기록지 폼]** 14 파일 / +2,053. 권한 헬퍼 + score-sheet + 컴포넌트 5 + BFF zod + audit. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-1 sync route refactor]** match-sync service 추출 (494→204). vitest 252/252. | ✅ |
| 2026-05-11 | subin `05fa45b` | **[Phase 1-A recording_mode 게이팅]** settings JSON / 헬퍼 3종 + Flutter v1 3 라우트 가드 + admin 토글. | ✅ |
| 2026-05-11 | DB 작업 | **[열혈최강전 D-day 명단 검증]** 라이징이글스 13 + 펜타곤 11 / 박성후 TTP INSERT. | ✅ |
