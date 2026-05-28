# Phase 3 — 팀(Teams) 영역 사용자↔관리자 연결 다리 점검 리포트

> **작성일**: 2026-05-28
> **작성**: Cowork (mybdr 메인 프로젝트)
> **선행 박제**: Phase 1 (대회) + Phase 2 (경기) Claude.ai 박제 + sync 완료
> **상위 흐름**: AppNav 5번째 탭 = 팀 / 사용자 결재 결과 = 2026-05-28 영역 결정

---

## 0. 분석 범위

본 점검 = 팀 영역 (사용자 측 + 관리자 측 + 양측 다리) 의 운영 코드 현황 + 갭 식별 + Phase 3 의뢰서 범위 도출.

### 0-1. 영역 매핑

| 영역 | 라우트 | 운영 LOC | v2 박제 상태 |
|------|--------|---------|------------|
| **사용자 측 (이미 박제됨)** | | | |
| 팀 list | `/teams` | 28 (wrapper) + TeamsContentV2 488 | ✅ v2 완료 |
| 팀 상세 | `/teams/[id]` | 366 + _components_v2/ 8 컴포넌트 | ✅ v2 완료 |
| 팀 생성 | `/teams/new` | 20 + _v2/ 6 step | ✅ v2 완료 |
| 팀 초대 (DB 미지원 박제) | `/team-invite` | 34 + _v2/ 205 | ✅ Phase 8 박제 (DB 미지원도 "준비 중" 박제) |
| 가입 토큰 (비로그인) | `/team-apply/[token]` | 199 + 144 (edit) | ✅ Phase 3-A 박제 |
| **사용자 측 (박제 미완료)** | | | |
| 운영 팀 hub | `/teams/manage` | 357 | ❌ — TU3 시안 대상 |
| 개별 팀 관리 | `/teams/[id]/manage` | 2292 (거대) | ❌ — TU4 시안 대상 |
| 가입 신청 처리 | `/teams/[id]/manage/requests` | 25 (wrapper · ?tab=requests) | ❌ — TU4 안 sub |
| 마이페이지 "내 팀" 보강 | `/profile/activity` | 881 | ⚠ — UC1 위에 TU5 추가 |
| **관리자 측 (박제 미완료)** | | | |
| super-admin 팀 hub | `/admin/teams` | 80 | ❌ — TA1 시안 대상 |
| **양측 다리 (다음 §2 참조)** | | | |
| 매치 신청 / 처리 | `/api/web/teams/[id]/match-request` API | ?? | ❌ — BT5 |
| 가입 신청 | `team_join_requests` table | ?? | ⚠ — BT1 |
| 멤버 변경 | `TeamMemberRequest` table | ?? | ⚠ — BT2 |

### 0-2. Prisma 모델 (8 모델)

```
Team                     ← 기본 + 색상 home/away + max_members + auto_accept_members
TeamMember               ← role (captain/vice/manager/member) + status (active/dormant/withdrawn) + last_activity_at
TeamMemberRequest        ← request_type (jersey_change/dormant/withdraw) + payload + status
TeamMemberHistory        ← event_type 영구 이력 (joined/left/jersey_changed/transferred/등)
TeamOfficerPermissions   ← 임원 권한 위임 (captain only)
team_join_requests       ← 팀 가입 신청 (사용자→팀)
team_member_histories    ← 이적/변경 이력
TournamentTeam           ← 대회 참가팀 (BT7 다리)
```

### 0-3. v2 박제 흔적 (운영 코드 내부 phase 명명 ≠ Cowork phase-ledger)

운영 src/ 안 phase 명명 (혼동 주의):
- `Phase 3` = 운영 코드 내 Phase 3 시안 적용 (예: `/teams/[id]/page.tsx` 헤더 "Phase 3 Teams 상세 v2 — 8개 컴포넌트 조립")
- `Phase 4 PR12` = OfficerPermissionsTab
- `Phase 5 PR14/15/16` = last_activity_at / 유령 후보 / 탈퇴 멤버 이력
- `Phase 8 박제` = team-invite

**Cowork phase-ledger 의 Phase 3** = 본 의뢰서 = "AppNav 5번째 탭 = 팀 영역 리디자인" — 차원이 다르므로 의뢰서에서 명확히 분리.

---

## 1. 갭 식별 (BT1~BT8) — 영향도 분석

### BT1 — 가입 신청 흐름 (★★★★)

**현황**:
- 사용자 측: `/teams/[id]` 에 "가입 신청" 버튼 (team-join-button-v2.tsx) ✅
- 관리자 측: `/teams/[id]/manage?tab=requests` 신청 처리 ❌ (시각 박제 미완)
- 알림 / step indicator / 양측 일관성 = Phase 2 BG1 답습 필요

**갭**:
- 사용자 측 본인 신청 상태 추적 = 마이페이지 어디서? UC1 위에 "내 팀 신청" 카드 필요
- 관리자 측 신청 처리 모달 = Phase 2 UD1 패턴 답습 (status 변경 + 알림 ✅ 체크박스)
- auto_accept_members=true 인 팀 = 자동 승인 흐름 (BG5 답습)

**의뢰 대상**: TU4 (manage 가입 신청 탭) + UC1 보강 (TU5)

### BT2 — 멤버 변경 신청 (★★★)

**현황**:
- TeamMemberRequest 모델 = jersey_change / dormant / withdraw 3 종
- 사용자 측 신청 = `_components_v2/` 안 dormant-request-modal / jersey-change-request-modal / withdraw-request-modal 박제 ✅
- 관리자 측 처리 = `/teams/[id]/manage` 안 sub (시각 박제 미완)

**갭**:
- 매니저 측 처리 UX = 신청 type 별 모달 다름 (jersey 새 번호 / dormant 기간 / withdraw 사유) — 통합 처리 hub 필요
- 사용자 측 신청 상태 추적 = 마이페이지 "내 팀 변경 신청" 카드 (UC1 보강 안)

**의뢰 대상**: TU4 (manage 변경 신청 탭) + UC1 보강 (TU5)

### BT3 — 유령 회원 (3개월 미활동) (★★)

**현황**:
- last_activity_at + Phase 5 PR15 박혀 있음 (GhostCandidatesTab.tsx ✅)
- 캡틴 / ghostClassify 권한 only

**갭**:
- 사용자 측 "휴면 예정" 사전 알림 = 마이페이지 어디? 활동 트래커 위젯 (TU5)
- 관리자 측 유령 후보 탭 시각 박제 = 운영 박제 안 → TU4 안 탭

**의뢰 대상**: TU4 (manage 유령 후보 탭) + UC1 보강 (TU5 "활동 트래커")

### BT4 — 임원 권한 위임 (★★)

**현황**:
- TeamOfficerPermissions + Phase 4 PR12 박혀 있음 (OfficerPermissionsTab.tsx ✅)
- 캡틴 only

**갭**:
- 매니저/부캡틴 본인 권한 시각 = 마이페이지 또는 팀 상세 sidebar — 현재 ❌
- 캡틴 측 권한 위임 UX = manage 안 탭 (시각 박제 미완)

**의뢰 대상**: TU4 (manage 권한 위임 탭) + UC1 보강 (TU5 "내 권한 = 부캡틴")

### BT5 — 매치 신청 (팀 vs 팀) (★★)

**현황**:
- team-match-request API ✅ (route.ts 4개)
- 사용자 측: team-match-request-modal.tsx 박제 ✅ (팀 상세에서 신청)
- 관리자 측: 받은 매치 list — 시각 박제 ❌

**갭**:
- 매니저 측 받은 매치 list / 수락-거절 UX = `/teams/[id]/manage` 안 탭 (현재 ❌)
- 매치 → 경기 (game) 생성 흐름 — Phase 2 와 연결 다리?

**의뢰 대상**: TU4 (manage 매치 신청 탭) + 양측 다리

### BT6 — 팀 통계 / 기록 (★★★)

**현황**:
- wins/losses/draws/tournaments_count 컬럼 ✅
- `/teams/[id]` stats-tab-v2.tsx 박제 ✅
- super-admin 측 = `/admin/teams` 매우 작음 (80 line — 통계 ❌)

**갭**:
- super-admin 팀 hub = 통계 / 활동도 / 상태 분포 = TA1 대상
- 팀 상세 stat 탭 추가 보강 (Phase 1A PA7 우승 카드 답습 — 대회 우승 이력 카드 / MVP 멤버 카드)

**의뢰 대상**: TA1 + TU2 보강

### BT7 — 팀 ↔ 대회 ↔ 경기 연결 다리 (★★★)

**현황**:
- TournamentTeam ↔ Team relation ✅
- 팀 상세 → 대회 참가 / 경기 신청 CTA = 현재 ❌

**갭**:
- "이 팀으로 대회 참가" CTA — 팀 캡틴/매니저 본인 운영 시
- "이 팀 멤버 경기 신청" / "팀원 모두 게스트 신청" — 캡틴 본인 운영 시
- Phase 1 / Phase 2 영역과 cross-domain 연결

**의뢰 대상**: TU2 보강 (팀 상세 우측 sidebar "운영 액션") + 양측 다리

### BT8 — super-admin 팀 hub (★) — 새 영역

**현황**:
- `/admin/teams` (80 line · super-admin 전용)
- 검색 + 상태 변경 (active / approve / suspend) — 옛 운영 UX

**갭**:
- 시각 박제 미완 — 시안 필요 (Phase 1A PA1 admin-list 답습)
- 통계 카드 / 활동 분포 / 미승인 팀 list / 정지 팀 list / 매너 통계 (Phase 2 BG2 응용)

**의뢰 대상**: TA1 신규 시안

---

## 2. 의뢰 범위 — 7 시안 (사용자 5 + 관리자 2)

### Phase 3B 사용자 측 (5 시안 · A 등급 — 모두 작은 보강 또는 신규)

| ID | 화면 | 라우트 | 분류 | LOC | 주 갭 |
|----|------|--------|------|-----|------|
| TU1 | Teams (list) | `/teams` | 보강 | 488 v2 | BT1 CTA / BT2 필터 / 추천 |
| TU2 | TeamDetail (상세) | `/teams/[id]` | 보강 | 366 + 8 v2 | BT5/BT6/BT7 진입 |
| TU3 | TeamManage (운영 팀 hub) | `/teams/manage` | **신규** | 357 | 0/1/N 분기 시각 박제 |
| TU4 | TeamManageDetail (개별 팀 관리) | `/teams/[id]/manage` | **신규** | 2292 거대 | BT1/BT2/BT3/BT4/BT5 5 탭 통합 |
| TU5 | UC1 MyActivity 보강 | `/profile/activity` | 보강 | 881 + Phase 2 갱신본 | "내 팀" 섹션 (BT1/BT2 상태 + BT3 활동 + BT4 권한) |

### Phase 3A 관리자 측 (2 시안 · E 등급 — super-admin only)

| ID | 화면 | 라우트 | 분류 | LOC | 주 갭 |
|----|------|--------|------|-----|------|
| TA1 | AdminTeams (super-admin 허브) | `/admin/teams` | **신규** | 80 | BT8 통계/상태/매너 hub |
| TA2 | AdminTeamDetail (super-admin 측 팀 검수) | `/admin/teams/[id]` 또는 modal | **신규** | 0 | 정지/수상/이양 처리 |

**총 = 7 시안** (TU1~5 + TA1~2)

### 양측 다리 (BG 답습 - BT 시리즈)

| BT | 등급 | 사용자 측 ↔ 관리자 측 | 운영 데이터 |
|----|------|---------------------|-----------|
| BT1 | ★★★★ | TU4 가입 신청 탭 + TU5 "내 신청" 카드 ↔ (TA1 통계만, super-admin 직접 처리 ❌) | `team_join_requests.status` |
| BT2 | ★★★ | TU4 변경 신청 탭 + TU5 "내 변경 신청" 카드 ↔ (다리 없음 — 팀 내부) | `TeamMemberRequest.status` |
| BT3 | ★★ | TU4 유령 후보 + TU5 "휴면 예정" ↔ TA1 활동도 분포 | `TeamMember.last_activity_at` |
| BT5 | ★★ | TU2/TU4 매치 신청 + 받은 매치 list | team-match-request API |
| BT6 | ★★★ | TU2 stats 보강 ↔ TA1 통계 hub | `wins/losses/draws/tournaments_count` |
| BT7 | ★★★ | TU2 sidebar "운영 액션" ↔ Phase 1/2 cross-domain | `TournamentTeam` + `game_applications` |
| BT8 | ★ | (해당 없음) ↔ TA1 신규 | super-admin role |

→ **양측 의존 핵심**:
- BT1 데이터 모델 = TU4 큐 ↔ TU5 "내 신청" 단계 = 동일 row
- BT3 룰 = 3 개월 미활동 = TU4 후보 ↔ TU5 알림 = 동일 last_activity_at 기준
- BT6 통계 = TU2 stat ↔ TA1 통계 = 동일 wins/losses 컬럼

---

## 3. 사용자 결재 필요 — Phase 3 진입 결재

```
□ 영역 = 팀 ✅ (2026-05-28 결재)
□ 의뢰 범위 = 7 시안 (TU1~5 + TA1~2)
□ 갭 = 8 (BT1~BT8) 으로 식별 — 우선순위 ★★★★+ = BT1 / ★★★ = BT2/BT6/BT7
□ Claude.ai 전달 = 1 세션 통합 (Phase 2 답습 옵션 B 권장)
□ Phase 3C 운영 박제 = sync 후 별 의뢰서 (PR ~7건 예상)
```

→ 위 결재 후 `team-user-redesign-prompt-2026-05-28.md` + `team-admin-redesign-prompt-2026-05-28.md` 작성 + `phase-3-claude-ai-delivery-prompt-2026-05-28.md` paste-ready 생성 + zip 자동 묶음.

---

## 4. Phase 3 진행 흐름 (phase-ledger 답습)

```
① 점검 리포트  ✅ 본 문서 (2026-05-28)
② 갭 분석     ✅ 본 문서 §1 (BT1~BT8 = 8 갭)
③ 사용자 결재  ⏳ 본 결재 (영역 + 7 시안 + 양측 다리)
④ 의뢰 작성   ⏸ team-user / team-admin
⑤ phase-ledger 갱신  ⏸ Phase 3 entry 추가
⑥ git commit  ⏸
⑦ Claude.ai 전달  ⏸ 수빈 (drag-drop + paste 2 단계)
⑧ 시안 박제    ⏸ Claude.ai (BDR v2.21)
⑨ zip 출력    ⏸
⑩ sync 실행   ⏸ CLI
⑪ 운영 박제 (Phase 3C)  ⏸ CLI (PR ~7)
⑫ 회귀 검수   ⏸
⑬ PR 결재    ⏸ 수빈
⑭ Phase 완료  ⏸ Cowork
```

---

**리포트 끝.** §3 결재 후 의뢰서 2 + delivery prompt + zip 자동 생성.
