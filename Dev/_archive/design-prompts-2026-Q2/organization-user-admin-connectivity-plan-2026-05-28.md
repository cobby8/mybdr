# Phase 4 — 단체(Organizations) 영역 다측 연결 다리 점검 리포트

> **작성일**: 2026-05-28
> **작성**: Cowork (mybdr 메인 프로젝트)
> **선행 박제**: Phase 1 (대회) + Phase 2 (경기) + Phase 3 (팀) 모두 Claude.ai 박제 완료
> **결재**: 영역 = 단체 ✅ (2026-05-28)
> **특수성**: ★ **3 측 다중 stakeholder** = 일반 사용자 + 단체 운영자 (tournament-admin) + super-admin (사이트 운영자)

---

## 0. 분석 범위 + 다측 stakeholder

### 0-1. 영역 매핑 — 3 측 stakeholder

| 측 | 라우트 영역 | 핵심 역할 |
|----|------------|----------|
| **사용자** (일반) | `/organizations/*` + `/series/*` | 단체 발견 / 시리즈 탐색 / 단체 신청 |
| **단체 운영자** (Series Operator) | `/tournament-admin/organizations/*` + `/tournament-admin/series/*` | 자기 단체 운영 / 시리즈 생성 / 회차 추가 / 멤버 관리 |
| **super-admin** (Site Operator) | `/admin/organizations` | 단체 신청 승인 / 거절 / 활성/정지 |

→ 3 측 모두 시안 박제 필요. Phase 3 답습 (사용자 + super-admin 2측) 대비 **확장 패턴** (3측).

### 0-2. 라우트 + LOC 인벤토리

**사용자 측 (8 page · ~1255 LOC)**:

| ID 후보 | 라우트 | LOC | v2 박제 흔적 |
|---------|--------|-----|------------|
| OU1 | `/organizations` (list) | 91 | ✅ 부분 (orgs-list-v2 / org-card-v2) |
| OU2 | `/organizations/[slug]` (상세) | 210 | ✅ 완료 (Hero + 4 tab v2 — overview/teams/events/members) |
| OU3 | `/organizations/apply` (신청) | 229 | ❌ 박제 0 |
| OU4 | `/organizations/[slug]/series/[seriesSlug]` | 229 | ⚠ 부분 |
| OU5 | `/series` (list) | 204 | ⚠ 미확인 |
| OU6 | `/series/[slug]` (상세) | 226 | ⚠ 미확인 |
| OU7 | `/series/[slug]/[editionNumber]` (회차) | 31 (wrapper) | ⚠ 미확인 |
| OU8 | `/series/new` | 35 (wrapper) | ⚠ 미확인 |

**단체 운영자 측 (9 page · ~2100 LOC)**:

| ID 후보 | 라우트 | LOC | v2 박제 흔적 |
|---------|--------|-----|------------|
| OO1 | `/tournament-admin/organizations` (list) | 223 | ❌ |
| OO2 | `/tournament-admin/organizations/new` | 218 | ❌ |
| OO3 | `/tournament-admin/organizations/[orgId]` (상세 · **거대**) | 648 | ❌ |
| OO4 | `/tournament-admin/organizations/[orgId]/members` | 246 | ❌ |
| OO5 | `/tournament-admin/series` (list) | 90 | ❌ |
| OO6 | `/tournament-admin/series/new` | 216 | ❌ |
| OO7 | `/tournament-admin/series/[id]` (상세) | 247 | ❌ |
| OO8 | `/tournament-admin/series/[id]/edit` | 108 | ❌ |
| OO9 | `/tournament-admin/series/[id]/add-edition` (회차 추가) | 118 | ❌ |

**super-admin 측 (1 page · ~243 LOC)**:

| ID 후보 | 라우트 | LOC | v2 박제 흔적 |
|---------|--------|-----|------------|
| OA1 | `/admin/organizations` | 243 | ✅ Admin-5-C 박제 (BDR v2.14) — pending/approved/rejected 승인 흐름 |

**총** = 18 page / ~3600 LOC.

### 0-3. Prisma 모델

```
organizations (소문자 명명!)
  - name / slug / logo_url / banner_url / description
  - region / contact_email / contact_phone / website_url
  - owner_id (User FK) / status (pending/approved/rejected · default approved)
  - is_public / series_count (캐시)
  - approved_at / approved_by / rejection_reason / rejection_at / apply_note

organization_members
  - organization_id / user_id
  - role (owner / admin / member · default member)
  - is_active

tournament_series (line 2072 · 별 모델)
  - 단체 안 시리즈 (예: "BDR 서머 오픈" = 시리즈)
  - 회차 = TournamentEdition 별 모델 (시리즈 안 회차)
```

→ 위계: organizations → tournament_series → editions → Tournament (Phase 1 영역).

### 0-4. Phase 1A PA3 협회 마법사 후속 연결

Phase 1A PA3 `AdminWizardAssociation` (4-step stepper = 협회 → 시리즈 → 종별 위임 → 권한) = 본 Phase 4 의 **단체 영역 진입 마법사**.

→ Phase 4 의 OO 영역 (tournament-admin) 시안 = **PA3 마법사 후속 흐름 박제**.

---

## 1. 갭 식별 (BO1~BO8) — 영향도 분석

### BO1 — 단체 신청 흐름 (★★★★)

**현황**:
- 사용자: `/organizations/apply` (229 line · 박제 0)
- super-admin: `/admin/organizations` (243 line · v2.14 박제 ✅ pending/approved/rejected 승인)
- 사용자 측 본인 신청 상태 추적 = 마이페이지 어디? — **UC1 보강 필요?** (Phase 3 BT1 답습)

**갭**:
- 사용자 측 신청 시각 박제 0 / step indicator (Phase 2 UA2 답습)
- 본인 신청 상태 = 마이페이지 "내 단체 신청" 카드 (UC1 보강 후보)
- 승인 시 자동 organization_members owner 추가 흐름 시각

**의뢰 대상**: OU3 (apply 신규) + super-admin OA1 (보강만) + UC1 보강 (옵션)

### BO2 — 단체 ↔ 시리즈 ↔ 회차 위계 시각화 (★★★★)

**현황**:
- `/organizations/[slug]` v2 박제 ✅ (4 tab — overview/teams/events/members)
- `/series/[slug]` 위계 불명확 (시리즈 = 단체 안? 또는 독립?)
- `/series/[slug]/[editionNumber]` 회차 (31 wrapper)
- Phase 1A PA3 협회 마법사 = 시리즈 + 종별 위임 마법사

**갭**:
- 위계 = 단체 → 시리즈 → 회차 → 대회 시각 명확화 필요
- /series list 가 어떤 단체와 연결되는지 시각화
- /series/[slug]/[editionNumber] 안 대회 list 진입 (Phase 1 cross-domain)

**의뢰 대상**: OU5 + OU6 + OU7 + OO5 + OO7

### BO3 — 단체 운영자 측 운영 hub (★★★★)

**현황**:
- `/tournament-admin/organizations/[orgId]` (648 line · 거대 단체 detail) — 박제 ❌
- `/tournament-admin/organizations/[orgId]/members` (246 line) — 박제 ❌
- 단체 운영자 본인 시야 — 자기 단체 관리

**갭**:
- 단체 detail 큰 LOC = 5~7 sub-tab 통합 필요 (Phase 3 TU4 답습 패턴)
- 멤버 운영 = owner/admin/member 역할 위임 (Phase 3 TU4 권한 위임 답습)
- 시리즈 생성 진입 (OO6) / 회차 추가 (OO9)

**의뢰 대상**: OO3 (단체 detail 5-7 sub-tab) + OO4 (멤버 관리)

### BO4 — 시리즈 생성 + 회차 추가 마법사 (★★★)

**현황**:
- `/tournament-admin/series/new` (216 line · 박제 ❌)
- `/tournament-admin/series/[id]/add-edition` (118 line · 박제 ❌)
- Phase 1A PA3 협회 마법사 후속 (시리즈 → 종별 위임)

**갭**:
- 시리즈 생성 마법사 = PA3 답습 + 단순화 (3-step?)
- 회차 추가 = 시리즈 안 새 edition / 작은 모달 가능

**의뢰 대상**: OO6 + OO9

### BO5 — super-admin 단체 검수 (★★)

**현황**:
- `/admin/organizations` (243 line · v2.14 박제 ✅ Admin-5-C)
- pending/approved/rejected 상태 처리

**갭**:
- 보강만 (시각 박제 이미 OK) — Phase 2 UD1 알림 ✅ 체크박스 추가
- 단체 활성/정지/해산 모달 (Phase 3 TA2 답습)

**의뢰 대상**: OA1 (보강)

### BO6 — 단체 멤버 다이렉트 가입 / 직접 권한 (★★)

**현황**:
- `organization_members` 테이블 + members API ✅
- 사용자가 단체에 직접 가입 신청? — 운영 흐름 미확인 (대개 owner 측 초대만)

**갭**:
- 초대 흐름 vs 직접 신청 흐름 — Phase 3 BT4 답습 가능
- 단체 멤버 = team_invite 류 토큰 기반?

**의뢰 대상**: 본 Phase 보류 (Phase 4 후속 또는 Phase 5)

### BO7 — 단체 ↔ 팀 cross-domain 다리 (★★★)

**현황**:
- `/organizations/[slug]` 안 "teams-tab-v2" 박제 ✅ (단체 안 팀 list)
- Phase 3 TU2 sidebar "이 팀으로 대회 참가" cross-domain CTA

**갭**:
- 양측 일관 — Phase 3 결과 활용
- /organizations/[slug] teams-tab 안 = TournamentTeam (대회 참가팀) 또는 Series-Team 연결?

**의뢰 대상**: OU2 보강 (이미 박제됨, BO7 가드만 추가)

### BO8 — 시리즈 ↔ 대회 (Tournament) 위계 (★★★)

**현황**:
- `/series/[slug]/[editionNumber]` (31 line wrapper) — Tournament 와 어떻게 연결?
- Phase 1 = 대회 (Tournament) / Phase 4 = 시리즈 (Series) — cross-domain

**갭**:
- 시리즈 회차 안 = 대회 list (Phase 1 영향)
- Phase 1A PA3 협회 마법사 → 시리즈 생성 → 대회 (Tournament) 추가 흐름 연결

**의뢰 대상**: OU7 (회차 = 대회 list 진입) + OO9 (회차 추가 마법사)

---

## 2. 의뢰 범위 — 8 시안 (사용자 4 + 단체 운영자 3 + super-admin 1)

### Phase 4B 사용자 측 (4 시안)

| ID | 화면 | 라우트 | 분류 | LOC | 주 갭 |
|----|------|--------|------|-----|------|
| OU1 | Organizations list (보강) | `/organizations` | 보강 | 91 + 244 v2 | BO1 신청 CTA / 카드 보강 |
| OU2 | OrganizationDetail (보강) | `/organizations/[slug]` | 보강 | 210 + 6 v2 tab | BO7 팀 cross-domain / BO2 시리즈 위계 |
| OU3 | OrganizationApply (신규) | `/organizations/apply` | **신규** | 229 | BO1 신청 흐름 + step indicator |
| OU4 | Series list + detail (신규) | `/series` + `/series/[slug]` + edition | **신규** | 461 + 31 wrapper | BO2 위계 + BO8 cross-domain |

### Phase 4O 단체 운영자 측 (3 시안 · tournament-admin)

| ID | 화면 | 라우트 | 분류 | LOC | 주 갭 |
|----|------|--------|------|-----|------|
| OO1 | OrgAdminList + New (자기 단체 진입) | `/tournament-admin/organizations` + `/new` | **신규** | 223 + 218 | BO3 진입 / Phase 1A PA3 후속 |
| OO2 | OrgAdminDetail (자기 단체 hub) | `/tournament-admin/organizations/[orgId]` | **신규** | 648 + 246 (멤버) | BO3 5-7 sub-tab 통합 / BO6 멤버 운영 |
| OO3 | SeriesAdmin (시리즈 hub + 회차 마법사) | `/tournament-admin/series/*` 5 page | **신규** | 779 | BO4 + BO8 |

### Phase 4A super-admin 측 (1 시안)

| ID | 화면 | 라우트 | 분류 | LOC | 주 갭 |
|----|------|--------|------|-----|------|
| OA1 | AdminOrganizations (보강) | `/admin/organizations` | 보강 | 243 (v2.14 박제 ✅) | BO5 알림 모달 + 활성/정지 보강 |

**총 = 8 시안** (사용자 4 + 단체 운영자 3 + super-admin 1)

### 양측 다리 (BO 시리즈)

| BO | 등급 | 사용자 ↔ 단체 운영자 ↔ super-admin | 운영 데이터 |
|----|------|--------------------------------|-----------|
| BO1 | ★★★★ | OU3 신청 + UC1 "내 신청" ↔ (없음) ↔ OA1 승인 | `organizations.status` (pending/approved/rejected) |
| BO2 | ★★★★ | OU2 4 tab + OU4 시리즈 list ↔ OO2 detail ↔ (없음) | `organizations → tournament_series → editions` |
| BO3 | ★★★★ | (사용자 시야 없음) ↔ OO2 hub | `organization_members.role` (owner/admin/member) |
| BO4 | ★★★ | OU4 시리즈 list 보기 ↔ OO3 시리즈 생성/회차 추가 | `tournament_series` + `tournament_editions` |
| BO5 | ★★ | (없음) ↔ (없음) ↔ OA1 보강 | super-admin role |
| BO7 | ★★★ | OU2 teams-tab ↔ Phase 3 TU2 sidebar cross-domain | `Team` + `Organization` |
| BO8 | ★★★ | OU4 회차 → 대회 진입 ↔ OO3 회차 추가 → Phase 1 | `Tournament.series_id` + `edition_number` |

→ **양측 의존 핵심**:
- BO1: OU3 사용자 신청 → OA1 super-admin 승인 → organization_members owner 자동 추가
- BO3: OO2 멤버 role (owner/admin/member) ↔ Phase 3 BT4 답습 (TeamOfficerPermissions 패턴)
- BO8: OU4 회차 진입 → Phase 1 (Tournament) cross-domain

---

## 3. 사용자 결재 필요 — Phase 4 진입 결재

```
□ 영역 = 단체 ✅ (2026-05-28 결재)
□ stakeholder 측 = 3 (사용자 + 단체 운영자 + super-admin)
□ 의뢰 범위 = 8 시안 (OU1~4 + OO1~3 + OA1)
□ 갭 = 8 (BO1~BO8) 식별 — 우선순위 ★★★★+ = BO1/BO2/BO3
□ Claude.ai 전달 = 1 세션 통합 (Phase 3 답습)
□ Phase 4C 운영 박제 = sync 후 별 의뢰서 (PR ~8건 예상)
```

→ 위 결재 후 의뢰서 3건 + delivery prompt + zip 자동 생성. ※ Phase 3 답습 (의뢰서 2건) 대비 본 Phase = **의뢰서 3건** (사용자 + 단체 운영자 + super-admin 측 분리).

---

## 4. Phase 4 진행 흐름 (phase-ledger 답습)

```
① 점검 리포트  ✅ 본 문서 (2026-05-28)
② 갭 분석     ✅ BO1~BO8 = 8 갭
③ 사용자 결재  ⏳ 본 결재 (영역 + 8 시안 + 양측 다리)
④ 의뢰 작성   ⏸ org-user / org-orgadmin / org-superadmin (3건)
⑤ phase-ledger 갱신  ⏸
⑥ git commit  ⏸
⑦ Claude.ai 전달  ⏸ 수빈 (drag-drop 5건 + paste)
⑧ 시안 박제    ⏸ Claude.ai (BDR v2.22)
⑨ zip 출력    ⏸
⑩ sync 실행   ⏸ CLI
⑪ 운영 박제 (Phase 4C)  ⏸ CLI (PR ~8)
⑫ ~ ⑭          ⏸
```

---

**리포트 끝.** §3 결재 후 의뢰서 3 + delivery prompt + zip 자동 생성.
