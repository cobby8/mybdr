# Phase 6.3 — 마이페이지 후반부 (성장·주간리포트·설정) 점검 리포트

> **작성일**: 2026-05-31
> **결재**: Phase 6.1 + 6.2 후속 = 6.3 = **Phase 6 묶음 완전 종료**
> **특수**: 모두 **이미 옛 v2 박제됨** (보강 의뢰) → 작은 규모 (3 시안)

---

## 0. 영역 매핑

| ID | 화면 | 라우트 | LOC | 기존 박제 |
|----|------|--------|-----|----------|
| GU1 | ProfileGrowth (보강) | `/profile/growth` | 835 | ✅ v2.2 P1-1 박제 (게이미피케이션) |
| GU2 | WeeklyReport (보강) | `/profile/weekly-report` | 1125 | ✅ v2.4 D-3 Hybrid 박제 (시안 + 진짜 데이터) |
| GU3 | ProfileSettings (보강) | `/profile/settings` | 256 | ✅ v2.3 박제 (Settings 7 섹션 + PreferenceForm) |

**총 LOC = 2216** (작은 규모).

`/profile/preferences` (20 wrapper) + `/profile/notification-settings` (13 wrapper) = GU3 안 `?section=feed` / `?section=notify` redirect 매핑됨 (이미 박제). 별 시안 ❌.

---

## 1. 갭 식별 (BG1~BG3)

### BG1 — 성장 → 마일스톤 ↔ 업적 cross-domain (★★★)

**현황**: GU1 v2.2 박제 (게이미피케이션 + 12주 spark + 마일스톤 6) / Phase 6.1 PU4 업적 (user_badges + Phase 1A PA7 우승)

**갭**:
- GU1 마일스톤 = PU4 user_badges 동일 데이터 source / 시각 정합
- 다음 목표 progress + CTA → 활동/박제 영역 link
- DB 미지원 (xp / streak) 등 "준비 중" 라벨 명확화

**의뢰 대상**: GU1 보강

### BG2 — 주간 리포트 진짜 데이터 + Highlight 신규 (★★★)

**현황**: GU2 v2.4 D-3 Hybrid 박제 — KPI 4 + Highlight (placeholder) + 인사이트 + TOP 3 코트 (진짜) + 다음 주 추천 (placeholder) + 지난주 상세 비교 (진짜)

**갭**:
- Highlight 베스트 1경기 = DB 미지원 → "곧 제공" placeholder
- 다음 주 추천 = DB 미지원 → "곧 제공"
- 이메일 구독 관리 → GU3 notification-settings link

**의뢰 대상**: GU2 보강 (placeholder 시각 정리만)

### BG3 — 설정 7 섹션 통합 hub (★★★★)

**현황**: GU3 v2.3 박제 — 7 섹션 (account / feed / notify / bottomNav / billing / display / danger) + 좌측 sticky nav

**갭**:
- billing 섹션 = Phase 6.2 박제 후 link 활성 (BU3 ProfileBilling 진입)
- BottomNav 편집기 (C3 Phase B) = 작은 옵션 박제 보강
- danger zone (계정 삭제) 시각 강화 (BDR Red + 2차 confirm)
- account 섹션 안 IdentityVerifyButton 시각 강화

**의뢰 대상**: GU3 보강

---

## 2. 의뢰 범위 — 3 시안

| ID | 화면 | 라우트 | 분류 |
|----|------|--------|------|
| GU1 | ProfileGrowth (보강) | /profile/growth | 보강 |
| GU2 | WeeklyReport (보강) | /profile/weekly-report | 보강 (placeholder 정리) |
| GU3 | ProfileSettings (보강) | /profile/settings | 보강 (billing link + danger 강화) |

→ Phase 6 묶음 = 6.1 (본체 6) + 6.2 (결제 7) + 6.3 (후반부 3) = **총 16 시안** 완전 종료.

---

**리포트 끝.**
