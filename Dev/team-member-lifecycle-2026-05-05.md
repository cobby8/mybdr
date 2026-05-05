# 팀 멤버 라이프사이클 + Jersey 도메인 통합 재설계 (2026-05-05)

> 본 보고서는 `Dev/jersey-redesign-2026-05-05.md` (옵션 C+UI) 를 흡수하여 팀 멤버 라이프사이클 거버넌스 전체로 확장.

## 0. 요약

**5 영역 통합 재설계**:
1. **Jersey 도메인** (기존 보고서 — 옵션 C+UI 채택, ttp 자동 sync + match_player_jersey 신설)
2. **회원 상태** (active / dormant / withdrawn) — 신청/승인 워크플로
3. **번호 변경** — 본인 신청 → 팀장 승인 (충돌 검증) + 팀장 강제 변경
4. **유령회원** — 3개월 미접속+활동 0 → 팀장 분류 → 강제 탈퇴/변경
5. **팀 이적** — 양쪽 팀장 승인 state machine
6. **운영진 권한 위임** — 팀장이 manager/coach/treasurer/director 에게 권한 분배

총 작업량 = ~15~18d (Phase 1~5 단계 진행)

---

## 1. 회원 상태 모델 (3 상태)

| 상태 | 의미 | 진입 조건 | 진입 권한 |
|------|------|----------|----------|
| **active** | 정상 활동 | 기본값 | — |
| **dormant** | 휴면 | 본인 신청 → 팀장 승인 | 본인 (시작) + 팀장 (확정) |
| **withdrawn** | 탈퇴 | (a) 본인 신청 → 팀장 승인 / (b) 유령 분류 → 팀장 강제 탈퇴 | 본인 또는 팀장 |

### 탈퇴 후 처리
- 명단에서 완전 삭제 가능 (`team_members` row DELETE) — **로그만 보존**
- 로그 보존 = `team_member_history` 신규 테이블 (jersey 변경 / 상태 변경 / 탈퇴 이력)

---

## 2. 신청/승인 워크플로 (통합 인프라)

### 2-1. 단일 테이블 `team_member_requests` (jersey/dormant/withdraw 통합)

```sql
CREATE TABLE team_member_requests (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  request_type VARCHAR(20) NOT NULL,  -- 'jersey_change' | 'dormant' | 'withdraw'
  payload JSONB NOT NULL,             -- 타입별 디테일 (예: {old: 10, new: 99} / {until: '2026-08-05'})
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | approved | rejected | cancelled
  processed_by_id BIGINT REFERENCES users(id),
  processed_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_team_member_requests_team_status ON team_member_requests(team_id, status);
CREATE INDEX idx_team_member_requests_user ON team_member_requests(user_id, status);
```

### 2-2. 이적 별도 테이블 `transfer_requests` (양쪽 팀장 승인 state machine)

```sql
CREATE TABLE transfer_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  from_team_id BIGINT NOT NULL REFERENCES teams(id),
  to_team_id BIGINT NOT NULL REFERENCES teams(id),
  reason TEXT,
  from_team_status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  to_team_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  final_status VARCHAR(20) NOT NULL DEFAULT 'pending',     -- pending | approved | rejected | cancelled
  from_processed_by_id BIGINT REFERENCES users(id),
  from_processed_at TIMESTAMP,
  to_processed_by_id BIGINT REFERENCES users(id),
  to_processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

State machine:
- 양쪽 모두 `approved` → `final_status = approved` (자동 트리거) → 멤버 이동 (from_team `team_members` DELETE + to_team INSERT)
- 한쪽이라도 `rejected` → `final_status = rejected`

---

## 3. 유령회원 시스템

### 3-1. 활동 추적 컬럼

`team_members.last_activity_at` (TIMESTAMP, NULL 허용) 신규.

### 3-2. 활동 정의 (last_activity_at 갱신 트리거)

| 활동 | 갱신 시점 |
|------|----------|
| 팀 페이지 접속 | `/teams/[id]` GET 시 본인 row 갱신 |
| 대회 출전 | tournament_team_players INSERT 시 |
| 매치 통계 기록 | match_player_stats INSERT 시 |
| 팀 게시판 작성 | community_posts/comments INSERT 시 |
| 로그인 | user.last_login_at 과 분리 (팀별 활동) |

### 3-3. 유령 분류 룰

`last_activity_at < NOW() - 3 months` 인 멤버 = "유령 후보". 팀장 UI 에서 일괄 조회 + 수동 분류.

분류 후 권한:
- 강제 jersey 변경 (충돌 해결 등)
- 강제 탈퇴 (본인 동의 X)
- 멤버 정보 조회/관리

---

## 4. 운영진 권한 위임

### 4-1. 신규 테이블 `team_officer_permissions`

```sql
CREATE TABLE team_officer_permissions (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  permissions JSONB NOT NULL DEFAULT '{}',  -- {jersey_change_approve: true, dormant_approve: true, ...}
  granted_by_id BIGINT NOT NULL REFERENCES users(id),  -- 보통 captain
  granted_at TIMESTAMP NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP,
  UNIQUE (team_id, user_id)
);
```

### 4-2. 권한 매트릭스

| 액션 | 본인 | captain | 위임 가능 권한 |
|------|------|---------|---------------|
| 번호 변경 신청 | ✅ | — | — |
| 번호 변경 승인 | — | ✅ (기본) | `jersey_change_approve` |
| 휴면 신청 | ✅ | — | — |
| 휴면 승인 | — | ✅ | `dormant_approve` |
| 탈퇴 신청 (활성) | ✅ | — | — |
| 탈퇴 승인 / 강제 탈퇴 | — | ✅ | `withdraw_approve` |
| 유령 분류 | — | ✅ | `ghost_classify` |
| 강제 jersey 변경 | — | ✅ | `force_change` |
| 이적 신청 | ✅ | — | — |
| 이적 승인 (현팀/새팀) | — | ✅ | `transfer_approve` |
| 운영진 권한 위임/회수 | — | ✅ (only) | — (위임 불가, captain 전용) |

→ team_members.role (`captain` / `manager` / `coach` / `treasurer` / `director` / `member`) 활용. captain 만 위임 가능.

---

## 5. PR 분해 (5 Phase, ~15~18d)

### Phase 1: Jersey 도메인 (기존 보고서 5 PR)

| PR | 분량 | 핵심 |
|----|------|------|
| PR1 | 0.5d | `default_jersey_number` 사용처 정리 + DROP |
| PR2 | 1.5d | 가입 폼 + 자동 복사 + 팀 페이지 본인 수정 + 마이페이지 내 팀 목록 확장 |
| PR3 | 0.5d | tournament join → ttp 자동 복사 |
| PR4 | 1.0d | `match_player_jersey` + W1 라이브 페이지 운영자 모달 |
| PR5 | 0.5d | v1 6 endpoints 우선순위 helper |

**소계 ~4.0d** ⚠ Phase 1 PR2 = 본인 수정 단순 흐름 (신청/승인 X, Phase 2 에서 수정)

### Phase 2: 신청/승인 워크플로 인프라

| PR | 분량 | 핵심 |
|----|------|------|
| PR6 | 1.0d | `team_member_requests` 테이블 + 신청/승인/거부 API + 알림 + admin_logs |
| PR7 | 0.7d | 번호 변경 = 신청 흐름으로 전환 (PR2 본인 수정 → 신청 모달) + 팀장 승인 UI |
| PR8 | 0.5d | 휴면 신청 UI + 승인 흐름 + 멤버 상태 표시 |
| PR9 | 1.0d | 탈퇴 신청 UI + 승인 + 명단 삭제 (history 보존) + `team_member_history` 테이블 |

**소계 ~3.2d**

### Phase 3: 팀 이적

| PR | 분량 | 핵심 |
|----|------|------|
| PR10 | 1.5d | `transfer_requests` 테이블 + state machine + 양쪽 팀장 알림 + 자동 이동 |
| PR11 | 0.5d | 이적 신청 UI (마이페이지) + 양쪽 팀장 승인 페이지 |

**소계 ~2.0d**

### Phase 4: 운영진 권한 위임

| PR | 분량 | 핵심 |
|----|------|------|
| PR12 | 1.0d | `team_officer_permissions` 테이블 + 위임 UI + 권한 검증 미들웨어 (`requireTeamOfficerPermission`) |
| PR13 | 0.3d | 권한 매트릭스 모든 승인 API 적용 (PR6/7/8/9/10 의 권한 검증 통합) |

**소계 ~1.3d**

### Phase 5: 유령회원 시스템

| PR | 분량 | 핵심 |
|----|------|------|
| PR14 | 1.0d | `last_activity_at` 컬럼 추가 + 활동 추적 hook (페이지 접속 / 대회 출전 / 통계 / 게시판) |
| PR15 | 1.0d | 팀장 유령 분류 UI (3개월 미활동 후보 일괄 조회) + 강제 jersey/탈퇴 액션 |
| PR16 | 0.7d | 회원 상태 컬럼 (`team_members.member_status`) + 마이그레이션 (기존 `status` 와 분리 또는 통합) + 표시 UI |

**소계 ~2.7d**

---

## 6. 총 작업량 + 의존성

| Phase | 분량 | 의존 |
|-------|------|------|
| Phase 1 (Jersey) | ~4.0d | 독립 |
| Phase 2 (워크플로 인프라) | ~3.2d | Phase 1 PR2 (jersey 본인 수정) 후 PR7 로 신청 흐름 전환 |
| Phase 3 (이적) | ~2.0d | Phase 2 (request 패턴 인프라 활용) |
| Phase 4 (권한 위임) | ~1.3d | Phase 2 + 3 (모든 승인 API 적용) |
| Phase 5 (유령회원) | ~2.7d | Phase 2 (탈퇴/강제 변경 인프라 활용) + Phase 4 (권한 검증) |

**총 ~13~14d** (병렬 0). 실제 일정 = 사용자 결정 우선순위 따라.

---

## 7. 권장 진행 순서 + 사용자 결정 항목

### 7-1. 권장 순서

1. **Phase 1 우선** (~4d) — 사용자 신고 (이도균) 즉시 해결 + jersey 도메인 정리
2. **Phase 2 다음** (~3.2d) — 번호 변경 신청 흐름 + 휴면/탈퇴 인프라
3. **Phase 4 (~1.3d)** + **Phase 3 (~2d)** 중 선택 — 권한 위임 먼저 (Phase 5 의존) 또는 이적 먼저
4. **Phase 5 마지막** (~2.7d) — 유령회원 (활동 추적 컬럼 + 분류 UI)

### 7-2. 사용자 결정 항목 (Y/N)

| # | 항목 | 권장 |
|---|------|------|
| 1 | 5 Phase 순차 진행 (Phase 1 → 2 → 4 → 3 → 5) | Y |
| 2 | `team_member_requests` 단일 통합 테이블 (jersey/dormant/withdraw) + `transfer_requests` 별도 | Y |
| 3 | 활동 정의 = 팀 페이지 접속 + 대회 출전 + 매치 통계 + 게시판 + 로그인 (5종) | Y |
| 4 | 운영진 권한 위임 = captain 만 가능 (위임받은 자가 재위임 불가) | Y |
| 5 | 탈퇴 후 명단 완전 삭제 + `team_member_history` 로그 보존 | Y |
| 6 | 휴면 기간 자동 복구 = 기본 3개월 / 본인 시작/종료 가능 / 기간 만료 시 자동 active | Y (Phase 2 PR8) |
| 7 | 유령 후보 자동 알림 = 팀장에게 매월 1회 (3개월 미활동 멤버 N명) | Y (Phase 5 PR15) |
| 8 | Phase 1 PR2 본인 수정 = 단순 직접 변경 → Phase 2 PR7 에서 신청 흐름 전환 (이중 작업 발생) — 또는 Phase 1 PR2 자체를 신청 흐름으로 시작 | **결정 필요** |

### 7-3. 핵심 결정 #8 (Phase 1 PR2 흐름)

**(a)** Phase 1 PR2 = 단순 본인 직접 수정 (빠르게 이도균 사례 해결) → Phase 2 PR7 에서 신청 흐름으로 전환 (이중 작업 +0.5d)
**(b)** Phase 1 PR2 자체를 신청 흐름으로 시작 (Phase 2 PR6 인프라 의존 → Phase 1 + Phase 2 통합 ~7d) — 더 깔끔 / 진행 느림

---

## 8. 미묘 케이스 룰 (점검 보완 — 6건)

| # | 케이스 | 룰 |
|---|-------|-----|
| 1 | 같은 (team, user) 다중 pending 신청 | `team_member_requests` UNIQUE INDEX `(team_id, user_id) WHERE status='pending'` — 1건만 허용 |
| 2 | 휴면 기간 자동 만료 → active 복구 | **lazy 복구** — 페이지 진입 시 expires_at 체크 + UPDATE (cron 불필요) |
| 3 | last_activity_at 갱신 빈도 | **5분 throttle** — 마지막 갱신 < 5분이면 skip. background queue 검토 (Phase 5 PR14) |
| 4 | captain 변경 (이적/탈퇴/위임) 시 기존 권한 위임 처리 | **자동 회수** — `team_officer_permissions.revoked_at = now()` + 새 captain 이 재위임 |
| 5 | 유령 분류된 멤버 본인 복귀 (로그인/활동) | **활동 감지 시 자동 active 복귀** + 팀장에 알림 |
| 6 | 회원 상태 컬럼 (`active`/`dormant`/`withdrawn`) | **기존 `team_members.status` 컬럼 활용** (값 추가, 신규 컬럼 X) |

## 9. 후속 검토 (Phase 5 후)

- 이적 시 jersey/통계 처리 — 새 팀에서 다시 입력 / ttp historical 그대로 / from_team 의 멤버 history 보존
- 운영진 위임 알림 룰 — 위임/회수 시 본인+팀장에 알림
- 휴면 중 대회 출전 — 차단 (기존 active 검증 강화)
- 탈퇴 후 재가입 — `team_member_history` 조회로 과거 jersey 추천?

---

## 결정 후 다음 단계

사용자 결정 → scratchpad 갱신 → Phase 1 PR1 진입 (운영 DB DROP COLUMN 별도 명시 승인) 또는 결정 #8 따라 통합 진행.
