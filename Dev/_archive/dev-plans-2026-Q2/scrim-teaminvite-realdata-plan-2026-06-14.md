# PR-MOCK-TO-REAL ④ /scrim + ⑤ /team-invite 실연결 가능성 실측 + 설계

> 작성: planner-architect / 2026-06-15 (의뢰일 2026-06-14)
> **코드·DB 변경 0 — read-only 실측 + 설계만.**
> 핵심: 의도 정합 + populated 두 함정(테이블존재≠데이터 / 억지매핑) 모두 검증.

---

## 0. 한눈 결론

| 화면 | 후보 테이블 | 테이블 실재 | populated | 의도 정합 | 백엔드 API | **판정** |
|------|-----------|:---:|:---:|:---:|:---:|------|
| ④ /scrim | `team_match_requests` | ✅ (L503) | ❌ **0행** | ✅ 정합 | ✅ **완비** | **연결(인프라 완성·데이터 0=빈상태)** |
| ⑤ /team-invite | `team_join_requests` / `TeamMemberRequest` | ✅ (L2019/L3165) | ✅ 238행 / 6행 | ❌ **방향 반대·필드 부재** | (가입신청용) | **STOP — 준비중 유지** |

- ④ = **억지매핑 아님 + 인프라 완성**인데 **데이터 0행**. → "준비중" 박제는 부정확(주석 "scrim_* 부재"는 prefix 오판). **실데이터 와이어 + 빈상태**로 박제 가능. 0스키마.
- ⑤ = 테이블은 populated지만 **화면 의도(팀→유저 초대 수락)와 모델 의도(유저→팀 가입신청)가 반대**. 토큰/만료/초대메시지/초대대상 필드 전무. → **억지매핑 = STOP 조건**. 준비중 유지.

---

## ④ /scrim — 연결 가능 (인프라 완성 / 데이터 0행 = 빈상태)

### A. 테이블 필드맵 — `team_match_requests` (schema L503)

| 컬럼 | 타입 | 의미 | 시안 매핑 |
|------|------|------|----------|
| id | BigInt PK | | row key |
| from_team_id | BigInt | **제안자 측 팀** | 보낸 제안의 "To 상대" 역산 / 받은 제안의 발신팀 |
| to_team_id | BigInt | **호스트(받는) 측 팀** | 받은 제안 인박스 기준 |
| proposer_id | BigInt | 제안한 유저 | @by(작성자) |
| message | String? | 제안 메시지 | sc-row__note / sc-prop msg |
| preferred_date | DateTime? | 희망 일시 | sc-row__when(event) |
| status | String=pending | pending/accepted/rejected/cancelled | ex-badge(NEW/응답대기/수락됨) |
| created_at / updated_at | DateTime | | at(N시간 전) |
| from_team / to_team | Team relation | name·primaryColor·city·district | sc-row__name·av·지역 |
| proposer | User relation | 닉네임 | @by |

> 인덱스: `[to_team_id, status]`(인박스 정렬) + `[from_team_id]`(보낸함). 시안 탭 조회에 정확히 부합.

### B. 의도 정합 판정 → **정합 (연결)**

- 시안 Scrim = "팀 vs 팀, 연습경기 잡기" / 3탭(상대찾기·받은제안·보낸제안). 단 시안 `find`(상대 찾기)는 공개 모집 리스트.
- `team_match_requests` = from_team→to_team **친선/연습경기 제안** (schema 주석 명시: "친선/연습경기 제안"). → **시안 받은제안/보낸제안 2탭과 1:1 정합**.
- ⚠️ **단 "상대 찾기"(공개 모집 보드) 탭은 모델에 대응 없음** — team_match_requests는 1:1 제안만, "공개 OPEN 모집" 개념 없음. → 상대찾기 탭은 **별도 모집 테이블 부재 = 준비중**(또는 팀 목록 링크로 대체).

### C. 백엔드 API — **이미 완비** (신규 0)

| 경로 | 메서드 | 역할 | 비고 |
|------|--------|------|------|
| `teams/[id]/match-requests` | GET | `[id]=to_team_id` 인박스(받은 제안) + from_team/proposer include | snake_case 응답 |
| `teams/[id]/match-request` | POST | from_team→to_team 제안 생성 + to_team captain 알림 + pending 중복차단 | IDOR: from_team 운영진 검증 |
| `teams/[id]/match-request/[reqId]` | PATCH | accepted/rejected(to_team captain) / cancelled(from_team) + 알림 | 스푸핑 가드 |

> **보낸 제안 조회**: GET이 to_team 기준만 있음 → 보낸함은 `from_team_id` 필터 GET 추가 필요할 수 있음(현재 match-requests GET은 to만). 인덱스는 이미 존재.

### D. populated 실측 (운영 read-only 2026-06-15)

```
team_match_requests_total = 0     ← 전 행 비어있음
by_status = []
```

→ **인프라 완성 + 데이터 0행**. lessons[06-14] "테이블존재≠populated" 직접 케이스. mock 더미(MONKEYZ 1812 등) 복원 절대 금지.

### E. 박제 전략 (연결)

1. **page.tsx = 서버 컴포넌트 유지** + getWebSession 인증.
2. **내 운영팀 해소**: `me/activity` 패턴 재사용 — `captainId===me` 1순위 + role(captain/vice/manager) fallback. 운영팀 0개면 "팀 운영자만 사용" 안내 빈상태.
3. **받은제안 탭** = `match-requests` GET(`[id]=내 운영팀`) 와이어. **데이터 0 → `.ex-empty` "받은 제안 없음"**.
4. **보낸제안 탭** = `from_team_id=내 운영팀` 조회(GET 확장 or 신규 쿼리). 0 → 빈상태.
5. **상대찾기 탭** = 모델 부재 → **준비중 빈상태** 또는 `/teams` 링크(팀 목록에서 매치신청 CTA가 이미 동작).
6. **제안 보내기/수락/거절** = 기존 POST/PATCH 와이어(client 인터랙션 복원). 단 화면 규모↑.
7. **강조색**: 시안 `ex-badge--red`(D-day) = `var(--bdr-red)` 의미색 OK / 그 외 강조 = `var(--cafe-blue)` (errors[06-10]).

### F. 규모 / 위험

- **규모**: 중(中). page.tsx 서버화 + 2~3탭 client + 보낸함 GET 1개 신규(또는 필터 추가). +200~350 LOC.
- **위험**: (R1) 데이터 0행 = 전 탭 빈상태라 "연결했으나 화면 변화 없음"으로 보일 수 있음 → 사용자에게 "인프라 연결·실데이터 발생 시 자동 표시"로 보고. (R2) 상대찾기 탭은 모델 부재 = 부분 연결. (R3) "use client" 복원 시 인터랙션(제안/수락) 회귀 점검 필요.
- **대안(권장)**: ④는 **데이터 0행**이므로 "지금 당장 실데이터 효과 0". 단순 빈상태 박제만 유지하고, **첫 실 데이터 발생 시점에 연결**하는 것도 합리적. → **사용자 결재 1건**: (가) 지금 인프라 연결(빈상태라도 정직) (나) 데이터 생길 때까지 준비중 유지.

---

## ⑤ /team-invite — STOP (준비중 유지)

### A. 후보 테이블 필드맵

**`team_join_requests` (schema L2019)** — populated 238행

| 컬럼 | 의미 | 시안 정합? |
|------|------|-----------|
| team_id / user_id | **유저→팀** 방향 | ❌ 시안은 팀→유저 |
| status | pending/approved/rejected | (가입신청 상태) |
| message / preferred_position / preferred_jersey_number | 가입 희망 정보 | ❌ 초대 메시지 아님 |
| processed_by_id / processed_at | 팀 운영진 처리 | |
| **(부재)** | invite_token / expires_at / inviter_id / invited_user_id | ❌ **초대 모델 필드 전무** |

**`TeamMemberRequest` (schema L3165)** — 6행

| request_type | 의미 |
|------|------|
| jersey_change / dormant / withdraw | 등번호변경·휴면·탈퇴 신청 (★초대·가입 무관) |

### B. 의도 정합 판정 → **불일치 = STOP**

- 시안 TeamInvite = **팀장이 보낸 초대를 유저가 수락/거절** (banner "팀 초대가 도착했어요" / "초대 수락" / "2026.05.05까지 유효" = 만료 토큰 UX).
- `team_join_requests` = **유저가 팀에 가입 신청** (역방향). 시스템 전반(my-application·me/activity·my-pending-requests-card)이 전부 "가입신청" 의미로만 사용.
- `TeamMemberRequest` = 등번호/휴면/탈퇴 — 초대와 무관.
- **초대 고유 필드(토큰·만료·초대자·피초대자·초대메시지) 어느 테이블에도 없음.**
- → **억지로 team_join_requests를 초대로 매핑하면 방향 거짓 + 만료/토큰 UX 거짓** = lessons "억지매핑 금지" 정면 위반. **STOP 조건.**

### C. populated 실측 (운영 read-only 2026-06-15)

```
team_join_requests = 238 (approved 215 / rejected 18 / pending 5)
team_member_requests = 6 (jersey_change pending 3·approved 2 / withdraw approved 1)
```

→ 데이터는 충분하나 **의도 불일치라 무의미**. 데이터 존재가 연결 근거가 못 됨.

### D. 판정 + 향후

- **현행 "준비중 빈상태" 박제 유지가 정답.** 기존 page.tsx 주석("TeamInvitation 미존재")은 결론적으로 정확.
- **향후 연결 조건(버킷B 신규테이블)**: `TeamInvitation`(team_id·inviter_id·invited_user_id·token·expires_at·message·status·jersey_number?) 신설 + GET/accept/decline API + `/team-invite/[token]` 동적 라우트. = 0스키마 위반(신규 테이블) → **본 PR 범위 밖**.
- **참고**: 시안의 "팀원 초대" 수요가 실재한다면, **반대 방향 재활용**은 가능 — `/teams/[id]/manage`의 가입신청(team_join_requests pending 5건) **승인** 흐름이 이미 동작. 단 이는 "초대 수락" 화면이 아니라 "신청 승인" 화면이므로 시안과 다른 페이지. team-invite는 STOP.

---

## 종합 보고 (PM용)

| 항목 | ④ /scrim | ⑤ /team-invite |
|------|----------|-----------------|
| **판정** | **연결 가능**(인프라 완성) | **STOP**(억지매핑) |
| 후보 테이블 | team_match_requests | team_join_requests / TeamMemberRequest |
| populated | **0행** | 238 / 6행 |
| 의도 정합 | ✅(받은/보낸 제안) ·상대찾기탭만 부재 | ❌ 방향 반대·초대필드 전무 |
| 백엔드 | GET/POST/PATCH+알림 **완비** | (가입신청용) |
| 박제 규모 | 中(+200~350 LOC) | 0(현행 유지) |
| 0스키마 | ✅(연결만) | 신규테이블 필요(범위밖) |
| **사용자 결재 필요** | (가)지금 인프라연결(빈상태) vs (나)데이터 생길때 연결 | 없음(준비중 유지) |

### Stop conditions 점검
- 신규 테이블·컬럼 ❌ — ④ 연결은 0스키마(기존 테이블+API), ⑤는 신규테이블 필요해 STOP.
- 억지 매핑 ❌ — ⑤ team_join_requests↔초대 = 방향 반대로 STOP 보고.
- mock 복원 ❌ — ④ 0행 = 빈상태(MONKEYZ 더미 복원 금지).
- api/v1·라우트 신설 ❌ — ④ 기존 web API 재사용(보낸함 GET 필터만 검토).

### 실행 계획 (사용자 ④ "(가) 연결" 선택 시)

| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | /scrim page.tsx 서버화 + 내 운영팀 해소(me/activity 패턴) | developer | 없음 |
| 2 | 받은제안 탭 = match-requests GET 와이어 + .ex-empty | developer | 1 |
| 3 | 보낸제안 탭 = from_team_id 필터 GET(확장 or 신규 쿼리) | developer | 1 |
| 4 | 제안/수락/거절 client 인터랙션 복원(POST/PATCH) | developer | 2,3 |
| 5 | 상대찾기 탭 = 준비중 빈상태 or /teams 링크 | developer | 1 |
| 6 | tester(빈상태 렌더·인증 가드) + reviewer(강조색·snake_case) 병렬 | tester+reviewer | 1-5 |

⚠️ developer 주의:
- API 응답 `apiSuccess` snake_case 자동변환 → 프론트 접근자 snake (errors ★재발6회).
- 데이터 0행 = 전 탭 빈상태 정상. 더미 복원 금지.
- 강조색: D-day만 `--bdr-red`, 나머지 `--cafe-blue`.
- 보낸함 GET이 현재 to_team 기준만 → from_team 필터 경로 확인 후 작업.
