# 클로드 디자인 의뢰 — 팀 관리자 측 (Phase 3A · super-admin)

> **의뢰일**: 2026-05-28
> **상위 계획서**: `team-user-admin-connectivity-plan-2026-05-28.md` (BT1~BT8 갭)
> **본 의뢰 범위**: 2 시안 (TA1~TA2) — super-admin (사이트 운영자) 측
> **차이 의뢰서**: `team-user-redesign-prompt-2026-05-28.md` (Phase 3B · 사용자 + 양측 다리 5 시안)

---

## 0. 진입 표준 절차 (claude-project-knowledge/00 §3)

→ team-user 의뢰서 §0 동일.

**관리자 측 차이**:
- super-admin role 가드 명시 시각 — "site admin" 또는 "Operator" badge
- 일반 사용자 / 캡틴/매니저 (팀 내부 운영) ≠ super-admin (사이트 운영) — 시각 분리 (Phase 1A PA3 답습)

---

## 1. 한 줄 요약

`/admin/teams` (TA1 신규 · BT8 통계/상태/매너 hub) + TA2 (팀 검수 상세 · 정지/수상/이양 모달 또는 신규 라우트) = **2 시안**. super-admin 만 진입 가능.

---

## 2. 결재 룰 (사용자 결정 §1~§8 + Phase 3 관리자 측 특수)

### Phase 3 관리자 측 특수 결재 (2026-05-28)
- ✅ **super-admin 가드 명시 시각** — Phase 1A PA3 협회 마법사 답습 (각 화면 헤더에 "Site Operator only" badge)
- ✅ **팀 매너 통계 = Phase 2 BG2 룰 답습** — 평균 매너 ★ + flag 종류만 / 개별 평가 건수 ❌
- ✅ **상태 변경 모달** = Phase 2 UD1 답습 — "사용자에게 알림 보내기" ✅ 체크박스 기본 ✅
- ❌ 캡틴 권한 위임 / 멤버 변경 / 가입 신청 = TA 측에서는 처리 ❌ (TU4 사용자 측 manage 에서만)
- ❌ 새 라우트 ❌ (TA1 = `/admin/teams` 기존 / TA2 = modal 또는 `/admin/teams/[id]` 신규 결정 필요)

---

## 3. 2 시안 사양

### TA1 — AdminTeams (super-admin 팀 hub · 신규 박제) · `/admin/teams`

**현황**: 80 line · search + 상태 변경 (active / approve / suspend) 옛 UX

**시안 (신규 박제)**:

```
Hero band
  - "팀 전체 N · 활성 N · 미승인 N · 정지 N · 해산 N"  (status 분포 카운트)
  - 우측 = super-admin badge ("Site Operator")

[검색 + 필터 row]
  - 검색바 (name / city / captain 닉네임)
  - 상태 chip filter (active / pending / suspended / dissolved)
  - 활동도 filter (지난 30일 활동 / 60일 / 90일+ 무활동)
  - 매너 ★ filter (4.5+ / 3.5-4.5 / 3.5-)

[탭]
  - 탭 1 = 활성 팀 (default) — 카드 list
  - 탭 2 = 미승인 (pending) — 카드 list + 승인/거절 CTA
  - 탭 3 = 정지 / 해산 (ban) — 카드 list + 해제 CTA
  - 탭 4 = 매너 통계 (BG2 답습) — 평균 매너 분포 chart + 하위 매너 팀 list (평균 3.0- 또는 flags 5+)

[카드]
  - 팀 logo + name + city
  - 멤버 수 / 진행 중 신청 N / 매너 ★
  - 본인 (super-admin) 액션: status 변경 chip → 모달
```

**모달 (status 변경)**:
- Phase 2 UD1 답습 패턴
- 변경 후 status + "사용자에게 알림 보내기" ✅ 체크박스 기본 ✅ + "변경 + 알림" CTA
- 정지 / 해산 사유 입력 (rejection_reason 또는 별 필드)

### TA2 — AdminTeamDetail (팀 검수 상세 · 신규)

**현황**: 0 (운영 라우트 없음)

**라우트 결정** (사용자 결재 필요):
- **옵션 A** (권장): 모달 (TA1 카드 클릭 → side-panel 모달 — 신규 라우트 ❌ · 더보기 가짜링크 ❌ 룰 통과)
- **옵션 B**: 신규 라우트 `/admin/teams/[id]` (라우트 1 추가)

**옵션 A 권장 이유**:
- 사용자 결정 §2 (더보기 가짜링크 ❌) 룰 답습
- 빠른 검수 (TA1 list 에서 즉시 처리)
- Phase 1A PA1 admin-list 답습 패턴 (4 옵션 인라인 panel)

**시안 (옵션 A 기준 · 모달)**:

```
[상단] 팀 hero 미니 (logo / name / captain / city / 만든 날짜)
[탭 1] 기본 정보 (read-only) — name / description / city / district / home_court
[탭 2] 멤버 (read-only) — list + role badge + 매너 ★ 평균
[탭 3] 활동 — 최근 30일 / 60일 / 90일 활동 그래프 (last_activity_at 기반)
[탭 4] 매너 통계 — 평균 매너 ★ + 받은 flag 종류만 (BG2 답습) / 개별 건수 ❌
[탭 5] 이력 — TeamMemberHistory 안 event_type 변경 list (joined / left / transferred / 등)

[하단 CTA 그룹] — super-admin 액션
  - 활성화 (pending → active)
  - 정지 (active → suspended)
  - 해산 (active → dissolved)
  - 캡틴 이양 (이양 모달 → 새 user_id 입력)
  
  각 CTA = Phase 2 UD1 알림 체크박스 ✅ 기본
```

---

## 4. 양측 의존 검증

| BT | 본 의뢰 (관리자) | 사용자 측 (team-user) | 데이터 모델 |
|----|-----------------|---------------------|-----------|
| BT3 | TA1 활동도 분포 + TA2 활동 탭 | TU4 유령 후보 + TU5 휴면 예정 | `TeamMember.last_activity_at` |
| BT6 | TA1 통계 hub + TA2 매너 통계 | TU2 stats 보강 | `wins/losses/draws` + 매너 |
| BT8 | TA1 + TA2 = super-admin 팀 hub (신규) | (해당 없음) | super-admin role |

→ BT3 휴면 룰 = 사용자 측 TU4/TU5 와 같은 3개월 미활동 기준 / BT6 통계 = 동일 wins/losses/draws / BT8 = 본 의뢰 단독 영역.

---

## 5. 13 룰 + Phase 1A/1B/2 carry-over

### 본 의뢰 특수 가드
- ❌ AppNav 변경 ❌
- ❌ 새 라우트 ❌ (TA1 = `/admin/teams` 기존 / TA2 = 모달 권장)
- ❌ super-admin 권한 가드 운영 코드 변경 ❌ (시각만)
- ✅ Phase 1A 시안 (관리자 11 jsx) carry-over (변경 ❌)
- ✅ Phase 1A PA3 super-admin 시각 패턴 답습 (Site Operator badge)
- ✅ Phase 2 UD1 알림 체크박스 패턴 답습 (status 변경 모달)
- ✅ Phase 2 BG2 매너 룰 답습 (평균 + 종류만 / 개별 건수 ❌)

---

## 6. 자체 검수 (06 §자체 검수)

→ team-user §6 동일 (4 + 8 케이스).

**관리자 측 추가**:
- ✅ super-admin badge 시각 일관 (모든 화면)
- ✅ 상태 변경 모달 = Phase 2 UD1 답습 (체크박스 ✅ 기본)
- ✅ 매너 통계 = 평균 + flag 종류만 (개별 건수 ❌)

---

## 7. 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — 팀 관리자 측 (Phase 3A · super-admin)

이해: TA1 = /admin/teams 신규 박제 (BT8 통계/상태/매너 hub) + TA2 = 팀 검수 모달 (권장 옵션 A — 새 라우트 ❌).
양측 의존 = BT3 (휴면 룰) + BT6 (통계) + BT8 (super-admin 신규).
Phase 1A PA3 super-admin 시각 답습 / Phase 2 UD1 알림 모달 답습 / Phase 2 BG2 매너 룰 답습.
자체 검수: 06 §관리자 hub / 통계 / 모달
작업 시작.
```

→ TA2 의 라우트 결정 (옵션 A vs B) 은 박제 진행 전 사용자 (수빈) 결재 받기.

---

**의뢰서 끝.** Claude.ai 가 본 의뢰서 첫 응답 → TA2 옵션 결재 → 박제 → zip 회신.
