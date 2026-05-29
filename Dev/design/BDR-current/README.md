# BDR v2.22 — Phase 4 (단체 영역) 박제

> **박제일**: 2026-05-28
> **선행**: Phase 1A v2.19 (대회 관리자 10) + Phase 1B v2.18 (대회 사용자 8) + Phase 2 v2.20 (경기 10) + Phase 3 v2.21 (팀 7) carry-over
> **선행 의뢰**: `org-user-redesign-prompt-2026-05-28.md` + `org-admin-redesign-prompt-2026-05-28.md` + `organization-user-admin-connectivity-plan-2026-05-28.md`
> **결재 결과**:
>   - Q1 Series Operator badge 시각 = **navy + silver** (Site Operator dark+gold 와 분리) ✅
>   - Q2 OO2 6 sub-tab 순서 = basic / members / series / editions / officers / activity ✅
>   - Q3 OO3 마법사 3-step = 기본+단체 / 설명·로고·정기성 / 검토+첫 회차 옵션 ✅
>   - Q4 OU3 5-step = 기본 / 지역·공개 / 연락 / 검토 메모 / 검토+제출 ✅

---

## 1. Phase 4 박제 시안 = 8 (사용자 4 + 관리자 4)

### Phase 4B — 사용자 측 + 양측 다리 (OU1~OU4 · A 등급)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| OU1 | Organizations list | `/organizations` | 보강 | BO1 등록 CTA + BO2 위계 |
| OU2 | OrganizationDetail (4 탭) | `/organizations/[slug]` | 보강 (4 탭) | BO2 + BO7 + BO8 |
| OU3 | OrganizationApply (5-step) | `/organizations/apply` | **신규** | BO1 ★★★ |
| OU4 | Series list + detail | `/series` + `/series/[slug]` | **신규** | BO2 + BO8 ★★ |

### Phase 4A — 관리자 측 (OA1 + OO1~OO3 · E 등급 · 2측)

| ID | 화면 | 라우트 | 분류 | 측 | 주 갭 |
|----|------|--------|------|----|-------|
| OA1 | AdminOrganizations | `/admin/organizations` | 보강 | **Site Operator** | BO1 + BO5 ★★★ |
| OO1 | OrgAdminList + New | `/tournament-admin/organizations` + `/new` | **신규** | **Series Operator** | BO3 |
| OO2 | OrgAdminDetail (6 sub-tab · 가장 큼) | `/tournament-admin/organizations/[orgId]` | **신규** | **Series Operator** | BO2 + BO3 ★★★ |
| OO3 | SeriesAdmin (list + 3-step + detail) | `/tournament-admin/series/*` | **신규** | **Series Operator** | BO4 ★★ |

---

## 2. BO 양측 의존 검증

| BO | 등급 | 사용자 측 ↔ 관리자 측 | 데이터 모델 |
|----|------|---------------------|-----------|
| BO1 | ★★★ | OU3 신청 form ↔ OA1 모달 동일 필드 | `organizations.{name/description/region/contact_email/website_url/apply_note}` |
| BO2 | ★★★ | OU2 events + OU4 위계 ↔ OO2 series-tab 위계 | OrgHierarchyCrumbs 공용 컴포넌트 |
| BO3 | ★★ | (OO2 only — 단체 내부) | `organization_members.role` (owner/admin/member) |
| BO4 | ★★ | (OO3 only) | `tournament_series` + `tournament_editions` |
| BO5 | ★★★ | (OA1 only — super-admin) | `organizations.status` (pending/approved/rejected/archived) |
| BO7 | ★ | OU2 teams-tab → Phase 3 TU2 ↔ (다리 없음) | `Team` cross-domain |
| BO8 | ★★ | OU2 sidebar + OU4 회차 → Phase 1 대회 ↔ (다리 없음) | `tournaments.id` cross-domain |

---

## 3. carry-over (변경 ❌)

### 파일
- `tokens.css` / `shell.css` / `shared.jsx` / `game-shared.jsx` / `team-shared.jsx` / `team-shared.css` 모두 v2.21 그대로
- Phase 1A v2.19 (관리자 10 시안 + admin.css)
- Phase 1B v2.18 (사용자 6 시안)
- Phase 2 v2.20 (사용자 8 + 관리자 2)
- Phase 3 v2.21 (팀 7)

### 신규 추가
- `org-shared.jsx` — 단체/시리즈 mock + OrgLogo / SeriesOperatorBadge / OrgStatusBadge / OrgHierarchyCrumbs / OrgCard / SeriesCard / OrgHero / SeriesOperatorShell
- `org-shared.css` — Phase 4 전용 스타일 (.org-card / .ou1-page / .ou2-* / .ou3-* / .ou4-* / .ops-shell / .oo1-* / .oo2-* / .oo3-* / .oa1-*)
- `screens/AdminOrganizations.jsx` (OA1) — BO5 모달
- `screens/OrganizationsList.jsx` (OU1)
- `screens/OrganizationDetail.jsx` (OU2)
- `screens/OrganizationApply.jsx` (OU3)
- `screens/Series.jsx` (OU4 — SeriesList + SeriesDetail)
- `screens/OrgAdmin.jsx` (OO1 — OrgAdminList + OrgAdminNew)
- `screens/OrgAdminDetail.jsx` (OO2 — 6 sub-tab)
- `screens/SeriesAdmin.jsx` (OO3 — SeriesAdminList + SeriesAdminNew + SeriesAdminDetail)
- 8 wrapper HTML (oa1 / ou1~4 / oo1~3)

---

## 4. 자체 검수 — 4 + 8 + Phase 4 특수 4 통과 ✅

### AppNav 4 케이스 (OU1~OU4 사용자 시안)
- ✅ main bar 우측 "더보기 ▼" / 아바타 = 0 (AppNav 03 frozen 카피)
- ✅ 모바일(≤768px) 듀얼 라벨 = 0
- ✅ 검색/쪽지/알림 box (.btn) = 0 (`.app-nav__icon-btn` 만)
- ✅ main bar 5 아이콘 순서 = [검색, 쪽지, 알림, 다크, 햄버거]

### 13 룰 8 케이스
- ✅ 하드코딩 색상 = 0 — `var(--*)` 토큰만 (예외: `organizations.brand_color` 운영 column · 단체 mock data only)
- ✅ lucide-react = 0 — Material Symbols Outlined 만
- ✅ rounded-full / 9999px = 0 — 정사각형 50% 만 (OrgLogo / avatar)
- ✅ 가짜링크 = 0 (gameResult / gameReport / guestApps / referee)
- ✅ button 4px / 카드 6~8px
- ✅ placeholder 5단어 이내 / "예: " 시작 0
- ✅ 720px 분기 / iOS input 16px / 버튼 44px
- ✅ Pretendard + Archivo + JetBrains Mono 만

### Phase 4 특수 4 케이스
- ✅ **2 측 badge 시각 분리** — Site Operator (`OperatorBadge` · dark+gold) vs Series Operator (`SeriesOperatorBadge` · navy+silver) 모든 시안 일관
- ✅ **위계 breadcrumb** (홈 → 단체 → 시리즈 → 회차 → 대회) — OU2 / OU4 / OO2 모두 동일 `OrgHierarchyCrumbs` 컴포넌트
- ✅ **OO2 6 sub-tab** = `?tab=basic / members / series / editions / officers / activity` 명확
- ✅ **OO3 시리즈 마법사** = PA3 답습 (Site Operator badge ❌ · Series Operator only) · 회차 추가 = 모달 (옵션 A 답습)

---

## 5. 결재 결과 — 4 가정 lock (의뢰서 결정 0)

작업 시작 시 §4 첫 응답 form 안 commit:

- **Q1 Series Operator badge** = `linear-gradient(135deg, #1B3C87, #0F234F)` + silver `apartment` icon → Site Operator dark+gold 와 시각 분리
- **Q2 OO2 6 sub-tab 순서** = basic → members → series → editions → officers → activity (의뢰서 명시 순서 보존)
- **Q3 OO3 3-step** = 기본 (이름+소속) / 설명·로고·정기성 / 검토+첫 회차 모달 trigger 옵션 — PA3 4-step 협회 마법사 단순화
- **Q4 OU3 5-step** = 단체 기본 / 활동 지역·공개 / 연락 / 검토 메모 / 검토+제출 (이후 success 화면 = 1-2일 검토 안내)

---

## 6. 다음 단계 (Cowork)

1. zip 자동 묶음 (BDR v2.22/ 폴더 = 약 100 파일)
2. Phase 4 sync CLI 의뢰서 자동 작성 (`phase-4-v2.22-sync-cli-prompt-2026-05-XX.md`)
3. 수빈에게 "CLI 던질 prompt" 안내 — 운영 코드 변경 0 (carry-over).

---

**박제 끝.** v2.21 carry-over 위 신규 8 시안 + org-shared.jsx/css 추가. 운영 코드 변경 0.
