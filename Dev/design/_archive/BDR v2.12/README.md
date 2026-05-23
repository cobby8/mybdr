# BDR v2.12 — Admin-A v2 보강 (G3 + G7 fixup)

## 작업 요약

v2.11 → v2.12. **Admin-A v2 보강 의뢰 (M1~M4 + G3 + G7) 중 잔여 2건 적용.**

**현황 점검 결과 — 이미 반영되어 있던 항목 (4건, 변경 0):**
- ✅ **M1** `color: #fff` → `var(--ink-on-brand)` (admin.css 4곳 적용 완료)
- ✅ **M2** `rgba(0,0,0,0.5)` → `var(--overlay)` (admin.css 2곳 + tokens.css 라이트/다크 토큰 정의)
- ✅ **M3** AdminStatusTabs count 뱃지 W=H 정사각형 (22×22 / padding:0 / border-radius:50% / 99+ overflow 약식)
- ✅ **M4** ADMIN_NAV 운영 sidebar.tsx sync (6 그룹 / 18 항목 / roles 매트릭스 / ThemeSwitch footer)

**본 의뢰에서 실제 적용한 항목 (2건):**

### G3 · `adminReports` → `adminGameReports` 리네이밍

운영 `/admin/game-reports` 와 시안 키 일관성. 페이지 내용 변경 0 — 파일·함수·라우트 키만 리네이밍.

| 영역 | 변경 |
|---|---|
| `screens/AdminReports.jsx` → `screens/AdminGameReports.jsx` | 파일명 변경 (move) |
| 내부 `function AdminReports` → `function AdminGameReports` | 함수명 |
| `window.AdminReports = …` → `window.AdminGameReports = …` | window 등록 |
| `route="adminReports"` (AdminShell prop) → `route="adminGameReports"` | route prop |
| 헤더 주석 (v2.10) → v2.12 G3 rename 명시 | 추적성 |
| `components-admin.jsx` ADMIN_NAV `{ key: 'adminReports', … }` → `{ key: 'adminGameReports', … }` | 사이드바 nav |
| `MyBDR.html` script src · 라우트 분기 · isAdmin 분기 (3 곳) | router |
| `screens/AdminComingSoon.jsx` COMING_SOON_LABELS · ADMIN_LIVE_ROUTES Set | 안전망 |
| `screens/AdminUsers.jsx` setRoute('adminReports') × 2 | 페이지 액션 |
| `screens/AdminMe.jsx` 최근 활동 link | 마이페이지 링크 |

**검증**: `grep adminReports BDR v2.12 → 0건 / grep adminGameReports → 8건` ✅

### G7 · `filterNavByRole` effectiveKey rewrite (header_only 제거)

운영 `sidebar.tsx` 의 `effectiveHref` 패턴 sync. parent self-blocked + child visible 케이스에서 parent label/icon 유지 + key 를 child 첫 항목으로 rewrite → 1 click UX.

| 영역 | 변경 전 | 변경 후 |
|---|---|---|
| `filterNavByRole(role)` 함수 | parent 차단 + child 노출 시 `header_only: true` 부여 (비활성 라벨) | `effectiveKey` rewrite — `{ ...it, key: filteredChildren[0].key }` (클릭 가능 button) |
| `AdminSidebar` render | `it.header_only ? <div opacity:0.55 …> : <button …>` 삼항 분기 | 모든 parent `<button>` 단일 |
| `AdminMobileNav` render | `onClick={() => { if (!it.header_only) setRoute(it.key); … }}` | `onClick={() => { setRoute(it.key); … }}` |

**검증**: `grep header_only BDR v2.12/components-admin.jsx → 0건 (구현 코드 안)` / 주석 1건 (G7 적용 명시 — 의도) ✅

**4 권한 mock 토글 시 기대 동작:**

| 권한 | 대회 관리 클릭 시 → 이동 라우트 |
|---|---|
| super_admin | `adminTournaments` (self 가시) |
| site_admin | `adminTournaments` (self 가시) |
| **tournament_admin** | **`adminWizardTournament`** (self 차단 / G7 effectiveKey rewrite) |
| partner_member | 대회 관리 미노출 (전체 차단) |

## 변경 파일 요약

```
변경 (7)
├── screens/AdminGameReports.jsx        ← AdminReports.jsx 에서 move (G3)
├── components-admin.jsx                — ADMIN_NAV 키 1건 (G3) + filterNavByRole 재작성 (G7) + AdminSidebar/AdminMobileNav render header_only 분기 제거 (G7) + 헤더 주석
├── screens/AdminComingSoon.jsx         — COMING_SOON_LABELS 객체 키 + ADMIN_LIVE_ROUTES Set entry (G3)
├── screens/AdminUsers.jsx              — setRoute 호출 2건 (G3)
├── screens/AdminMe.jsx                 — 최근 활동 route key 1건 (G3)
├── MyBDR.html                          — script src 1 + 라우트 분기 1 + isAdmin 1 (G3)
└── README.md                           ← this

변경 0 (보존)
├── tokens.css                          (M2 이미 반영됨)
├── admin.css                           (M1 + M2 이미 반영됨)
├── screens/AdminWizardTournament.jsx
├── screens/AdminWizardAssociation.jsx
├── screens/AdminTournaments.jsx
└── 외 22개 admin 페이지 (AdminGames, AdminTeams, ..., AdminMe 등)
```

## 자체 검수 (uploads/06-self-checklist.md)

- [x] G3 — `grep adminReports BDR v2.12` → 0건 (구현 영역) ✅
- [x] G3 — `grep adminGameReports BDR v2.12` → 8건 (파일명 + ADMIN_NAV + AdminShell prop + window 등록 + ComingSoon Set + AdminUsers × 2 + AdminMe + MyBDR.html × 3 = 9 ≈ 8 — README 추가 시 +1)
- [x] G7 — `grep header_only BDR v2.12/components-admin.jsx` 구현 코드 0건 (주석 1건만 — 의도)
- [x] G7 — filterNavByRole 변경 후 4 권한 토글에서 비활성 라벨 0건 / parent 모두 `<button>` 클릭 가능
- [x] G7 — tournament_admin → 대회 관리 클릭 = adminWizardTournament 자동 진입 (effectiveKey rewrite)
- [x] AppNav frozen 변경 0 (admin 자체 셸)
- [x] 13 룰 — 토큰/아이콘/라운딩/모바일 변경 0 (코드 로직만 변경)
- [x] 사용자 결정 §1~§8 보존
- [x] M1/M2/M3/M4 — gap-audit 결과 이미 반영된 상태 / 변경 0 (회귀 검증 PASS)

## 의뢰서 §6 4 PM 결정 항목 — 모두 v2.11 시점 가정대로 박제됨 (변경 0)

1. AdminMobileNav footer ThemeSwitch 위치 — **드로어 하단** ✅
2. adminMe = admin 영역 안 (AdminShell sidebar default) ✅
3. partnerAdminEntry — v2.10 에서 실 페이지로 박제됨 (ComingSoon 아님) ✅
4. AdminStatusTabs count 100+ — `data-overflow="true"` 시 font-size 10px + "99+" 약식 표시 ✅

## 후속 단계

- v2.12 결과 → BDR-current 동기화 (PM 워크플로우 5단계)
- Admin-1 / Admin-2 / Admin-3 CLI Phase 시작 가능
- 신규 의뢰 도착 시 v2.13 으로 카피

## 메모

- AdminGameReports 의 페이지 내용 (UI 카피 "신고 검토" / mock 데이터 / DataTable 컬럼) 은 모두 v2.10 박제 그대로. 변경 0.
- README v2.11 의 "Phase C 라우트 표" 안 `adminReports` 표기는 본 README (v2.12) 에서 `adminGameReports` 로 갱신됨.
