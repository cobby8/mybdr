# 클로드 디자인 의뢰 — 단체 사용자 측 + 위계 시각화 (Phase 4B)

> **의뢰일**: 2026-05-28
> **상위 계획서**: `organization-user-admin-connectivity-plan-2026-05-28.md` (BO1~BO8)
> **선행 박제**: Phase 1 (대회) + Phase 2 (경기) + Phase 3 (팀) 박제 완료
> **본 의뢰 범위**: 4 시안 (OU1~OU4) — 사용자 측
> **차이 의뢰서**: `org-admin-redesign-prompt-2026-05-28.md` (Phase 4 관리자 측 = 단체 운영자 3 + super-admin 1 = 4 시안)

---

## 0. 진입 표준 절차

→ 의뢰서 §0 진입 표준 절차 (claude-project-knowledge/00 §3) 답습.

**본 의뢰 특수**:
- Phase 1A/1B/2/3 시안 carry-over (변경 ❌) 가드 — BDR-current/ 안 27 jsx + Phase 3 추가 5 + game-shared.jsx + team-shared.jsx + team-shared.css
- ★ **위계 시각화 핵심**: 단체 → 시리즈 → 회차 → 대회 (Phase 1 영역) cross-domain

---

## 1. 한 줄 요약

`/organizations` (OU1 보강) + `/organizations/[slug]` (OU2 보강) + `/organizations/apply` (OU3 신규) + `/series/*` (OU4 신규 / 시리즈 + 회차 위계) = **4 시안**. Phase 1A PA3 협회 마법사 후속 + Phase 3 BT7 cross-domain 답습.

---

## 2. 결재 룰 (사용자 결정 §1~§8 + Phase 4 신규)

### Phase 4 결재 룰 (2026-05-28)
- ✅ **BO1 신청 모델 = 통일**: OU3 사용자 신청 → OA1 super-admin 승인 = 동일 `organizations.status` (pending/approved/rejected)
- ✅ **BO2 위계 시각화**: 단체 → 시리즈 → 회차 → 대회 = 시안 안 breadcrumb / sidebar 일관
- ✅ **BO7 단체 ↔ 팀 cross-domain** = Phase 3 TU2 sidebar "운영 액션" 패턴 답습
- ✅ **BO8 회차 → 대회 cross-domain** = `/series/[slug]/[editionNumber]` 안 Phase 1 대회 list 진입
- ❌ **새 라우트 ❌**: OU1~OU4 모두 기존 라우트 사용 / 가짜링크 추가 ❌
- ❌ **Phase 1A PA3 협회 마법사 시각 변경 ❌** (그대로 carry-over)

---

## 3. 4 시안 사양

### OU1 — Organizations list (보강) · `/organizations`

**현황**: 91 line wrapper + OrgsListV2 (86) + OrgCardV2 (158) v2 박제 ✅

**보강**:
- BO1 신청 진입 CTA — list 상단 "단체 신청하기" Hero CTA (현재 본인 신청 상태 = pending/approved 카드 안 노출)
- 필터 보강 — 지역 (region) / 종류 (kind: 리그/협회/동호회) / 활성도 (series_count)
- 추천 영역 — "내 지역 활성 단체 5" (region 매칭 + series_count > 0)
- 빈 상태 — "공개 단체가 없습니다" + "단체 신청하기" CTA

### OU2 — OrganizationDetail (보강) · `/organizations/[slug]`

**현황**: 210 line + _components_v2/ (6 component — Hero / Tabs / Overview / Teams / Events / Members) v2 박제 ✅

**보강**:
- OU2-A · Hero 보강 — 단체 상태 badge (활성 / 신청 중 / 정지) + 지역 / 종류 / 시리즈 N + 멤버 M
- OU2-B · teams-tab 안 cross-domain (BO7) — 이 단체에 등록한 팀 list (TournamentTeam 또는 Organization 안 Teams) + Phase 3 TU2 답습 ("이 팀 더 보기" CTA)
- OU2-C · events-tab 안 위계 (BO2) — 단체 안 시리즈 list (현재) + 각 시리즈 안 회차 N (드릴다운)
- OU2-D · members-tab 안 role badge (owner / admin / member) — Phase 3 TU2 답습
- OU2-E · sidebar (캡틴/매니저 본인만) — "내 권한" 카드 (Phase 3 TU2 답습) — owner/admin/member

### OU3 — OrganizationApply (신규 박제) · `/organizations/apply`

**현황**: 229 line · 박제 ❌ (Phase 12 §G 모바일 백버튼만)

**시안 (신규 박제)**:
- Hero band — "단체 신청"
- 5 step form (시안 박제 패턴):
  - Step 1: 기본 정보 (name / slug / description)
  - Step 2: 연락처 (contact_email / contact_phone / website_url)
  - Step 3: 활동 정보 (region / kind)
  - Step 4: 로고 + 배너 (logo_url / banner_url 업로드)
  - Step 5: 신청 메모 (apply_note · 목적 / 소개)
- 사후 안내 (Phase 1B UA3 답습) — "신청이 접수되었습니다 (검토 1~3일)" hero + CTA
- sidebar = 본인 신청 상태 / 사전 안내 (검토 절차 / 검토 시간 / 문의 채널)

### OU4 — Series list + detail + edition (신규 / 보강) · `/series/*`

**현황**:
- `/series` (204 line · 박제 미확인)
- `/series/[slug]` (226 line)
- `/series/[slug]/[editionNumber]` (31 line wrapper)
- `/series/new` (35 line wrapper · 사용자가 시리즈 만들기? — 운영 미확인)

**시안 (신규 / 보강)**:
- OU4-A · `/series` (list) — 시리즈 카드 그리드 + 단체 정보 + 회차 수 + 진행 중 대회 chip
- OU4-B · `/series/[slug]` (상세) — 시리즈 Hero + 회차 timeline + 진행 중 회차 강조
- OU4-C · `/series/[slug]/[editionNumber]` (회차 상세) — 회차 안 대회 (Tournament) list (Phase 1 cross-domain · BO8) — 대회 카드 + 진입 CTA
- OU4-D · 단체 breadcrumb — `홈 → 단체 → [단체명] → [시리즈명] → [회차]` 위계 시각화

---

## 4. 양측 의존 검증

| BO | 사용자 측 (본 의뢰) | 관리자 측 (org-admin) | 데이터 모델 |
|----|-------------------|---------------------|-----------|
| BO1 | OU3 신청 + (UC1 보강 옵션) | OA1 승인 | `organizations.status` |
| BO2 | OU2 events-tab + OU4 위계 | OO2 단체 detail + OO3 시리즈 hub | `organizations → tournament_series → editions` |
| BO7 | OU2 teams-tab cross-domain | (없음) | `Team` + `Organization` |
| BO8 | OU4 회차 → 대회 진입 | OO3 회차 추가 → Phase 1 | `Tournament.series_id` + `edition_number` |

→ 박제 마지막 단계 = 같은 row → 같은 단계 / 같은 위계 시각 검증.

---

## 5. 13 룰 + AppNav frozen + Phase 1~3 carry-over

### 본 의뢰 특수 가드
- ❌ AppNav 9 탭 변경 ❌
- ❌ 새 라우트 ❌ (OU1~OU4 기존)
- ❌ Phase 1A PA3 협회 마법사 시안 변경 ❌
- ✅ Phase 1A/1B/2/3 시안 carry-over (변경 ❌)
- ✅ BO1 신청 모달 = Phase 2 UD1 답습 ("승인 + 알림" CTA · 체크박스 ✅ 기본)
- ✅ BO7 cross-domain = Phase 3 TU2 답습 (sidebar "운영 액션" 패턴)

---

## 6. 자체 검수 — Phase 3 답습 (4 + 8 케이스 + Phase 4 특수)

기본 12 케이스 (Phase 3 답습) + Phase 4 특수:
- ✅ 위계 breadcrumb 일관 (홈 → 단체 → 시리즈 → 회차) 모든 시안 일치
- ✅ 단체 status badge (활성/신청중/정지/해산) Phase 3 답습 + 색상 일관
- ✅ Phase 1A PA3 협회 마법사 carry-over 확인
- ✅ OU3 step indicator = Phase 1B UA3 답습 (사후 안내 hero + CTA)

---

## 7. 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — 단체 사용자 측 + 위계 시각화 (Phase 4B)

이해: OU1~OU4 = 4 시안 (Organizations list 보강 + OrganizationDetail 보강 + OrganizationApply 신규 + Series 위계).
양측 의존 = BO1 (신청) + BO2 (위계) + BO7 (cross-domain 팀) + BO8 (cross-domain 대회).
사용자 결정 §1~§8 보존 / AppNav frozen — 03 카피 / 13 룰 인지 / Phase 1~3 carry-over (변경 ❌) / Phase 1A PA3 carry-over.
자체 검수: 06 §사용자 hub / 카드 / 위계 / 모달
작업 시작.
```

---

**의뢰서 끝.**
