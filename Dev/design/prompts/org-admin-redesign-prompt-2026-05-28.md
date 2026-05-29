# 클로드 디자인 의뢰 — 단체 관리자 측 (Phase 4A · 단체 운영자 + super-admin)

> **의뢰일**: 2026-05-28
> **상위 계획서**: `organization-user-admin-connectivity-plan-2026-05-28.md` (BO1~BO8)
> **본 의뢰 범위**: 4 시안 (OO1~OO3 + OA1) — 2 측 관리자 (**단체 운영자 3 + super-admin 1**)
> **차이 의뢰서**: `org-user-redesign-prompt-2026-05-28.md` (Phase 4B · 사용자 4 시안)

---

## 0. 진입 표준 절차

→ team-admin 의뢰서 §0 답습 + 본 Phase 추가:
- ★ **2 측 관리자 시안 분리 명확** — 단체 운영자 (tournament-admin · Series Operator) ≠ super-admin (Site Operator)
- ★ Phase 1A PA3 답습 패턴 — super-admin badge "Site Operator" / 단체 운영자 badge "Series Operator"

---

## 1. 한 줄 요약

`/tournament-admin/organizations/*` (OO1 + OO2 · 단체 운영자 측) + `/tournament-admin/series/*` (OO3 · 시리즈 hub + 회차 마법사) + `/admin/organizations` (OA1 보강 · super-admin) = **4 시안**.

---

## 2. 결재 룰 (Phase 4 관리자 측 특수 + Phase 1A PA3 답습)

### Phase 4 관리자 측 특수 결재 (2026-05-28)
- ✅ **2 측 badge 분리** — Phase 1A PA3 답습 / Site Operator vs Series Operator
- ✅ **BO1 승인 모달** = Phase 2 UD1 답습 + 알림 체크박스 ✅ 기본
- ✅ **BO3 멤버 role** = Phase 3 TU4 권한 위임 답습 (owner / admin / member)
- ✅ **BO4 시리즈 마법사** = Phase 1A PA3 답습 (3-step 단순화) + 회차 추가 = 모달
- ❌ **새 라우트 ❌** (OO1~OO3 + OA1 모두 기존 / 옵션 A 모달 권장 — 사용자 결재 시점)
- ❌ **Phase 1A PA3 협회 마법사 변경 ❌** (carry-over)

---

## 3. 4 시안 사양

### OO1 — OrgAdminList + New (단체 운영자 진입) · `/tournament-admin/organizations` + `/new`

**현황**: list (223 line · 박제 ❌) + new (218 line · 박제 ❌)

**시안 (신규 박제)**:
- Hero band — "내 단체 N · 활성 N · 신청 중 N"
- 본인 운영 단체 카드 그리드 (organization_members.role IN [owner, admin] + organizations.status='approved')
- "+ 새 단체 신청하기" CTA → `/organizations/apply` (OU3 사용자 측) 안내 또는 `/tournament-admin/organizations/new` 진입
- 새 단체 등록 form (Phase 1A PA3 답습 패턴) — 사용자 결정 후 super-admin 검수
- Series Operator badge 명시

### OO2 — OrgAdminDetail (자기 단체 hub · 거대 시안) · `/tournament-admin/organizations/[orgId]`

**현황**: 648 line (거대 · 박제 ❌) + members 246 line

**시안 (신규 박제 · 6 sub-tab 통합)** — Phase 3 TU4 답습 패턴:

```
[탭 1] 기본 정보 (default)
  - 단체 정보 (name / description / region / logo / banner)
  - 활성 상태 (super-admin 측 status) + 본인 권한 (owner/admin)
  
[탭 2] 멤버 (BO3 핵심)
  - role badge (owner / admin / member · Phase 3 TU4 답습)
  - owner only 액션 — 멤버 추가 / 권한 위임 / 제거
  - admin 액션 — 멤버 추가 (제한)
  
[탭 3] 시리즈 (BO2 · 단체 안 시리즈 list)
  - tournament_series list 카드 (각 시리즈 + 진행 회차 + 대회 N)
  - "+ 새 시리즈" CTA → OO3 진입
  
[탭 4] 회차 + 대회 (BO8 cross-domain)
  - 모든 회차 timeline (진행 중 + 종료)
  - 각 회차 → Phase 1 (Tournament) 대회 list 진입
  
[탭 5] 운영진 (Phase 1A PA3 협회 마법사 진입)
  - 시리즈별 종별 위임 (super_admin → 시리즈 운영진 위임)
  - Phase 1A PA3 답습 (4-step stepper)
  
[탭 6] 활동 / 통계
  - 단체 활동 timeline (최근 시리즈 / 회차 / 대회 / 멤버 변경)
  - 통계 카드 (시리즈 N · 회차 M · 진행 중 대회 K · 멤버 L)
```

상단 = 단체 mini Hero (logo + name + region + Series Operator badge)

### OO3 — SeriesAdmin (시리즈 hub + 회차 마법사) · `/tournament-admin/series/*`

**현황**: list 90 + new 216 + [id] 247 + edit 108 + add-edition 118 = 779 LOC (5 page · 박제 ❌)

**시안 (5 page 통합 / 또는 hub + 마법사 모달)**:

OO3-A · 시리즈 list (`/tournament-admin/series`) — 본인 운영 시리즈 카드 그리드
OO3-B · 시리즈 detail (`/tournament-admin/series/[id]`) — 시리즈 Hero + 회차 timeline + 운영 액션 (회차 추가 / 편집 / 종별 위임)
OO3-C · 시리즈 생성 마법사 (`/tournament-admin/series/new`) — **Phase 1A PA3 답습 3-step** (단체 선택 → 시리즈 정보 → 종별 위임)
OO3-D · 시리즈 편집 (`/tournament-admin/series/[id]/edit`) — 작은 form / 모달 가능
OO3-E · 회차 추가 (`/tournament-admin/series/[id]/add-edition`) — **모달 권장** (Phase 1A PA3 답습 미니)

**가드**: Phase 1A PA3 협회 마법사 = 시리즈 생성 마법사의 superset. PA3 시각 변경 ❌ / OO3-C 는 PA3 의 simplified 3-step.

### OA1 — AdminOrganizations (보강 · super-admin) · `/admin/organizations`

**현황**: 243 line · v2.14 박제 ✅ (Admin-5-C — pending/approved/rejected)

**보강** (소폭 갱신):
- BO5 알림 모달 = Phase 2 UD1 답습 (승인/거절 시 "사용자 알림 ✅ 기본" + "처리 + 알림" CTA)
- 상태 분포 chart (pending N · approved N · rejected N · 해산 N)
- 검색 + 필터 강화 (region / kind / status / owner)
- super-admin 액션 모달 (활성 → 정지 / 해산) — Phase 3 TA2 답습
- Site Operator badge 시각 일관

---

## 4. 양측 의존 검증

| BO | 단체 운영자 측 (OO) | super-admin 측 (OA) | 사용자 측 (org-user) | 데이터 모델 |
|----|------------------|-------------------|-------------------|-----------|
| BO1 | (없음) | OA1 승인 모달 | OU3 신청 | `organizations.status` |
| BO2 | OO2 시리즈 탭 + OO3 hub | (없음) | OU2 events / OU4 위계 | `organizations → series → editions` |
| BO3 | OO2 멤버 탭 (role 위임) | (없음) | OU2 members tab read-only | `organization_members.role` |
| BO4 | OO3 시리즈 마법사 + 회차 추가 | (없음) | OU4 list 보기 | `tournament_series` + `editions` |
| BO5 | (없음) | OA1 활성/정지/해산 모달 | (영향) | `organizations.status` 변경 |
| BO8 | OO3 회차 → Phase 1 진입 | (없음) | OU4 회차 → 대회 진입 | `Tournament.series_id` |

---

## 5. 13 룰 + 본 의뢰 특수 가드

- ❌ AppNav 변경 ❌
- ❌ 새 라우트 ❌ (모두 기존 / OO3-E 회차 추가 = 모달 권장)
- ✅ Phase 1A PA3 협회 마법사 carry-over (변경 ❌)
- ✅ Phase 2 UD1 알림 모달 답습 (OA1 보강)
- ✅ Phase 3 TU4 5 sub-tab 패턴 답습 (OO2 거대 단체 detail)
- ✅ Phase 3 TU4 권한 위임 답습 (OO2 멤버 tab)
- ✅ Phase 1A PA3 super-admin badge 패턴 답습 (Site Operator / Series Operator)

---

## 6. 자체 검수 — Phase 3 답습 + Phase 4 특수

기본 12 케이스 + Phase 4 관리자 특수:
- ✅ Site Operator badge (OA1) vs Series Operator badge (OO1~OO3) 시각 분리
- ✅ OO2 6 sub-tab = Phase 3 TU4 답습 (?tab=members/series/editions/officers/activity)
- ✅ OO3-C 시리즈 마법사 = Phase 1A PA3 답습 (3-step / 4-step 단순화)
- ✅ OA1 알림 체크박스 = Phase 2 UD1 답습 ("처리 + 알림" CTA)

---

## 7. 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — 단체 관리자 측 (Phase 4A · 2 측 = 단체 운영자 + super-admin)

이해: OO1 (운영자 진입) + OO2 (자기 단체 6 sub-tab 거대) + OO3 (시리즈 hub + 회차 마법사) + OA1 (super-admin 보강) = 4 시안.
양측 의존 = BO1 (승인) + BO3 (멤버 role) + BO4 (시리즈 마법사) + BO5 (super-admin 상태) + BO8 (cross-domain).
2 측 badge = Site Operator (super-admin) vs Series Operator (단체 운영자) 분리.
Phase 1A PA3 협회 마법사 carry-over / Phase 3 TU4 6 sub-tab + 권한 위임 답습 / Phase 2 UD1 알림 모달 답습.
자체 검수: 06 §관리자 hub / 마법사 / 모달 / 6-tab
작업 시작.
```

---

**의뢰서 끝.**
