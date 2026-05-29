# Phase 4 — 단체(Organizations) 영역 Claude.ai 시안 박제 의뢰 (단일 paste 의뢰서)

> **목적**: 수빈이 Claude.ai BDR 디자인 시스템 Project 에 한 번 paste 로 Phase 4 (단체 영역 8 시안) 박제 시작
> **작성일**: 2026-05-28
> **선행 완료**: Phase 1 + 2 + 3 Claude.ai 박제 완료
> **선행 가이드**: `organization-user-admin-connectivity-plan-2026-05-28.md` (BO1~BO8)
> **다음 단계**: Phase 4 zip 회신 후 = Cowork 가 sync CLI 의뢰서 자동 작성

---

## ⭐ 수빈 본인 액션 — 2 단계 (~2분)

### Step 1 — Claude.ai 세션 열고 첨부 4 건 업로드

**첨부 zip** (Cowork 가 미리 생성):
- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase4-baseline-2026-05-28.zip` (308KB / 102 파일)
- v2.21 박제 결과 그대로 = Phase 1~3 누적 시안 + `_phase4_operational_refs/` (13 운영 파일 + Prisma spec)

**첨부 의뢰서 3 건**:
1. `Dev/design/prompts/organization-user-admin-connectivity-plan-2026-05-28.md` (점검 리포트)
2. `Dev/design/prompts/org-user-redesign-prompt-2026-05-28.md` (Phase 4B · 사용자 4 시안)
3. `Dev/design/prompts/org-admin-redesign-prompt-2026-05-28.md` (Phase 4A · 관리자 4 시안 = 단체 운영자 3 + super-admin 1)

→ **★ 첨부 확인 룰**: 총 4 첨부 (zip 1 + .md 3) 모두 drag-drop 했는지 시각 확인 후 paste.

### Step 2 — 아래 §메시지 본체 그대로 paste

---

## 메시지 본체 — Claude.ai 에 paste (아래 ``` 블록 전체 복사)

```
Phase 4 — 단체(Organizations) 영역 리디자인 의뢰 (총 8 시안 + 양측 다리 8 BO) 시작합니다.

[선행]
- Phase 1 (대회 v2.19) + Phase 2 (경기 v2.20) + Phase 3 (팀 v2.21) 박제 완료
- v2.21 sync 의뢰서 대기 — 운영 변경 0 (BDR-current 가 v2.21 superset 으로 cumulative)
- 첨부 zip = BDR v2.21 박제 결과 그대로 (BDR-current/ 안 32 jsx + 6 css + game-shared.jsx + team-shared.jsx + team-shared.css + screens/_baseline/ 10)

[상위 계획서]
organization-user-admin-connectivity-plan-2026-05-28.md (BO1~BO8 = 8 갭)

[★ 본 Phase 의 특수성]
3 측 stakeholder = 일반 사용자 + 단체 운영자 (Series Operator) + super-admin (Site Operator)
→ 의뢰서 2건 묶음 패턴 답습 (Phase 3 Team 답습)
→ 시안 안 2 측 badge 분리 (Phase 1A PA3 super-admin 답습)

[의뢰서 2건 — 첨부]
1. org-user-redesign-prompt-2026-05-28.md (Phase 4B · 사용자 4 시안 = OU1 + OU2 + OU3 + OU4)
2. org-admin-redesign-prompt-2026-05-28.md (Phase 4A · 관리자 4 시안 = OO1 + OO2 + OO3 + OA1)

[첨부 zip 안]
BDR-current/ — Phase 1~3 박제 결과 v2.21 그대로 (32 jsx + 6 css + game-shared + team-shared + _baseline/)
_phase4_operational_refs/ — Phase 4 박제용 운영 reference 13 파일:
  - OU1~OU4 운영 page.tsx (4 사용자 측)
  - OO1~OO3 운영 page.tsx (7 단체 운영자 측 — 거대 OO2 는 head/tail 발췌)
  - OA1 운영 page.tsx (super-admin)
  - PRISMA_organization_models_spec.md (organizations / organization_members / tournament_series 등)

[Phase 4 박제 시안 = 8 시안 (사용자 4 + 관리자 4)]

사용자 측 (OU1~OU4 · A 등급):
- OU1 Organizations list 보강 /organizations · BO1 신청 CTA + 필터/추천
- OU2 OrganizationDetail 보강 /organizations/[slug] · BO2 위계 + BO7 cross-domain (Phase 3 TU2 답습)
- OU3 OrganizationApply 신규 박제 /organizations/apply · BO1 5-step form + 사후 안내 (Phase 1B UA3 답습)
- OU4 Series list + detail + edition 신규 박제 /series/* · BO2 위계 + BO8 cross-domain

관리자 측 (OO1~OO3 + OA1 · 2 측 = Series Operator + Site Operator):
- OO1 OrgAdminList + New /tournament-admin/organizations + /new · BO3 진입 / PA3 답습
- OO2 OrgAdminDetail /tournament-admin/organizations/[orgId] · 거대 6 sub-tab 통합 (Phase 3 TU4 답습)
- OO3 SeriesAdmin /tournament-admin/series/* · 5 page hub (list/new/detail/edit/add-edition) · PA3 3-step 마법사 답습
- OA1 AdminOrganizations 보강 /admin/organizations · BO5 활성/정지 모달 (Phase 3 TA2 답습) + BO1 알림 체크박스 (Phase 2 UD1 답습)

[2026-05-28 결재 룰 — 박제 중 반드시 준수]
- BO1 신청 = OU3 신청 → OA1 super-admin 승인 = 동일 organizations.status (pending/approved/rejected)
- BO2 위계 = 단체 → 시리즈 → 회차 → 대회 (Phase 1 cross-domain) breadcrumb 일관
- BO3 멤버 = OO2 owner/admin/member role 위임 (Phase 3 TU4 권한 위임 답습)
- BO4 시리즈 = OO3 마법사 = Phase 1A PA3 3-step 답습 (단순화) / 회차 추가 = 모달
- BO5 super-admin = OA1 활성/정지/해산 모달 (Phase 3 TA2 답습) + 알림 체크박스 (Phase 2 UD1 답습)
- BO7 cross-domain 팀 = OU2 teams-tab + Phase 3 TU2 sidebar "운영 액션" 일관
- BO8 cross-domain 대회 = OU4 회차 → Phase 1 대회 list 진입
- 2 측 badge 시각 분리 — Site Operator (super-admin) vs Series Operator (단체 운영자)
- Phase 1A PA3 협회 마법사 carry-over (변경 ❌)
- Phase 1A/1B/2/3 시안 (BDR-current/ 안 32 jsx + 6 css + game-shared + team-shared) carry-over (변경 ❌)

[작업 흐름 요청]
1. 첫 응답 = 의뢰서 2건 각각의 §7 첫 응답 형식
   ✅ BDR 디자인 의뢰 확인 — Phase 4B 단체 사용자 측 + 위계 (OU1~OU4)
   ✅ BDR 디자인 의뢰 확인 — Phase 4A 단체 관리자 측 (OO1~OO3 + OA1)
   각 §7 카피 / 13 룰 / 사용자 결정 §1~§8 / Phase 1~3 carry-over

2. 박제 순서 (권장):
   - 사용자 측: OU1 → OU2 → OU3 → OU4
   - 관리자 측: OA1 (보강 작음) → OO1 → OO3 → OO2 (가장 큰 6 sub-tab)
   
3. 박제 완료 후 새 zip 회신 (예상: BDR v2.22/ 폴더 포함)

4. 13 룰 위반 발견 시 자체 reject + 알림

[양측 의존 갭 검증 — 박제 마지막 단계 필수]
- BO1: OU3 신청 form 필드 = OA1 승인 모달 표시 필드 = 동일 organizations 컬럼
- BO2: OU2 events-tab 위계 + OU4 series 위계 + OO2 series-tab 위계 = 동일 breadcrumb 구조
- BO3: OO2 멤버 role 위임 = Phase 3 TU4 권한 위임 (시각 동일)
- BO4: OO3 시리즈 마법사 = Phase 1A PA3 (3-step 단순화) 시각 답습
- BO7: OU2 teams-tab = Phase 3 TU2 sidebar cross-domain CTA 일관

[자체 검수 4 + 8 + Phase 4 특수]

4 케이스 (00 §회귀 방지) + 8 케이스 (06 §자체 검수) — Phase 1~3 답습.

Phase 4 특수 4 케이스:
- ✅ 2 측 badge (Site Operator vs Series Operator) 시각 분리 일관
- ✅ 위계 breadcrumb (홈 → 단체 → 시리즈 → 회차 → 대회) 모든 시안 일치
- ✅ OO2 6 sub-tab = ?tab=basic/members/series/editions/officers/activity 명확
- ✅ OO3 시리즈 마법사 = PA3 답습 (Site Operator badge ❌ — Series Operator only)

[질문/가정 처리]
- 의뢰서에 결정 0 인 항목 = §7 형식 질문 batch 후 박제 진행
- 사용자 결정 §1~§8 또는 BO1~BO8 결재 룰 위반 가능성 = 즉시 중단 + 보고
- 운영 코드 내부 phase 명명 (예: Phase 12 §G 모바일 백버튼) 변경 ❌

시작해 주세요.
```

→ 위 블록 ``` 사이 본문을 Claude.ai 에 paste. 첫 응답 → 박제 시작.

---

## 예상 Claude.ai 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — Phase 4B 단체 사용자 측 + 위계 시각화 (OU1~OU4)
이해: OU1 list 보강 + OU2 detail 보강 + OU3 신청 신규 + OU4 시리즈 위계 신규.
양측 의존 = BO1/BO2/BO7/BO8.
사용자 결정 §1~§8 보존 / AppNav frozen / 13 룰 / Phase 1~3 carry-over (변경 ❌) / Phase 1A PA3 carry-over.
자체 검수: 06 §사용자 hub / 위계 / 모달
작업 시작.

✅ BDR 디자인 의뢰 확인 — Phase 4A 단체 관리자 측 (OO1~OO3 + OA1)
이해: OO1 진입 + OO2 거대 6 sub-tab + OO3 시리즈 마법사 + OA1 super-admin 보강.
양측 의존 = BO1/BO3/BO4/BO5/BO8.
2 측 badge 분리 (Site Operator vs Series Operator) / Phase 1A PA3 carry-over / Phase 3 TU4 6 sub-tab 답습 / Phase 2 UD1 알림 모달 답습.
자체 검수: 06 §관리자 hub / 마법사 / 모달
작업 시작.
```

→ 위 형식 안 나오면 = 진입 표준 절차 미준수 → 재요청.

---

## 박제 진행 중 수빈 본인 액션 — 없음

> Claude.ai 가 박제 끝낼 때까지 대기. 중간 질문 batch 오면 응답.

---

## Phase 4 zip 회신 후 — 수빈 본인 액션 1 단계 (~10초)

```
☐ Claude.ai 가 새 zip (BDR v2 (7).zip 예상) 출력 → Downloads/ 다운로드
☐ Cowork 에 한 줄 알림: "Phase 4 zip 도착 — <파일명>"
```

→ Cowork 가 자동으로:
1. zip vs BDR-current 차이 분석
2. Phase 4 sync CLI 의뢰서 작성 (`phase-4-vX.Y-sync-cli-prompt-2026-05-XX.md`)
3. 수빈에게 안내

---

## 의뢰서 작성 자체 검수 (Cowork)

- ✅ Step 1 zip 자동 생성 (Cowork bash · 308KB / 102 파일 / 13 운영 reference 포함)
- ✅ Step 1 첨부 4건 (zip + 의뢰서 3) drag-drop 룰 명시
- ✅ Step 2 메시지 본체 single paste (~3000자)
- ✅ Phase 1~3 carry-over (변경 ❌) 가드 명시
- ✅ 3 측 stakeholder + 2 측 badge 분리 명시
- ✅ Phase 1A PA3 협회 마법사 carry-over 명시 (시리즈 마법사 OO3 = PA3 답습)
- ✅ 양측 의존 BO1/BO2/BO3/BO4/BO5/BO7/BO8 박제 마지막 단계 검증 의무
- ✅ 수빈 본인 액션 = 2 단계 (~2분) + zip 도착 1 단계 (~10초) = 총 ~2 분 + 10 초

---

**의뢰서 끝.** 수빈이 §⭐ 2 단계 따라 진행. zip 회신 후 Cowork 자동 sync CLI 의뢰서 작성.
