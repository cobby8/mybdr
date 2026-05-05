# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/5 세션 마무리]** 인증 흐름 재설계 main 배포 완료 (`3f016c9`). 탈퇴 회원 쿠키 자동 cleanup 본질 해결 = 사용자 검증 통과. 빈 화면 회귀 = 배포 직후 chunk 캐시 mismatch (강력 새로고침 안내). 다음 세션 진입 = onboarding PR1~5 또는 박성후/이도균 등록 (내일).

---

## 🎯 다음 세션 진입점

### 🚀 0순위 — 박성후 등록 (이도균 ✅ 완료 5/5)
- ~~**이도균** (user_id=3352) — 5/5 완료: ttpId=2830 #70 / team_members.jersey=70 동시 갱신 (옵션 2 트랜잭션).~~
- **박성후** (펜타곤 #21) — users 0건 완전 미가입. 사용자가 본인 가입 유도 후 처리.

### 🛠️ 잠재 fix — jersey 도메인 단방향 sync (errors.md 5/5 + 5/2 통합)
- **함정**: `user.default_jersey_number` ↔ `team_members.jersey_number` ↔ `tournament_team_players.jerseyNumber` 자동 sync 0건. 사용자가 마이페이지 등번호 입력 = 메모만 (이도균 사례).
- **단기 fix (UX, ~0.5d)**: 마이페이지 등번호 입력 라벨/안내 = "본인 선호. 대회 출전 시 별도 등록" 명확화
- **중기 fix (~1d)**: `default_jersey_number` 변경 시 `team_members.jersey_number=NULL` row 자동 채우기 hook
- **장기 fix (~2d)**: TournamentTeam 등록 시 team_members → ttp 자동 복사 hook (errors.md 5/2 항목 통합)
- 우선순위 = onboarding PR1~5 보다 낮음. 운영자 수동 fix 가능 + 신고 빈도 1/주 미만 가정.

### 🚀 1순위 — onboarding 10단계 시스템 PR1~5 (옵션 B 합의됨)

**PR 분해** (~5.5d):
- PR1 (1d): 1단계 본인인증 통합 + `/onboarding` 라우트 — IdentityVerifyButton 재사용
- PR2 (1.5d): 2~4단계 (필수 분기 룰 — 길농만 선택 시 3,4 스킵 가능)
- PR3 (0.5d): 미들웨어 가드 — 분기 룰 반영
- PR4 (2d): 5~10단계 (자율) + 9단계 settings/feed PreferenceForm 흡수 + 점수/뱃지
- PR5 (0.5d): 기존 `/profile/edit` 정리 (활동지역 제거 + 도움말 제거 + readonly)

**즉시 진행 추천**: PR5 먼저 (가시 효과 빠름) → PR1~4 순차

decisions.md `[2026-05-05]` 항목 참조

### 🚀 2순위 — game.game_type 0~5 마이그레이션 (옵션 A, 보류)
- 56 파일 + DB 영향 작업
- onboarding 옵션 B 운영 안정 후 결정
- 카페 동기화 룰 + UI 전반 영향 사전 점검 필요

### 🚀 3순위 — 매치 코드 v4 후속 (Phase 6 미진행)
- 5/4 완료: Phase 1+2+3+4+5+7 (commit `8af51eb` + `bec591b`)
- Phase 6 = 라이브 페이지 deep link 미진행 (옵션)
- plan: `~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md`

---

## 기획설계 (planner-architect / 5/5)

- **팀 멤버 라이프사이클 + Jersey 통합 재설계** (보고서 `Dev/team-member-lifecycle-2026-05-05.md` — jersey 보고서 흡수). **8 결정 모두 Y + 미묘 6건 룰 반영 + (b) Phase 1+2 통합 진입**. 5 Phase 분해 (~13~14d, $100 으로 Phase 1+2 + 일부 4 가능 / 3+5 다음 세션). **Phase 1 PR1 진입 (default_jersey_number 사용처 정리 + DROP COLUMN 별도 명시 승인)**.
- **인증 흐름 재설계** — ✅ 완료 (`Dev/auth-flow-redesign-2026-05-05.md` / `3f016c9` main).

---

## 구현 기록 (Phase 5 PR14+PR15+PR16 — 활동 추적 + 유령회원 시스템 + 회원 상태 정비) 🎉 Phase 5 완료

📝 구현한 기능: TeamMember.last_activity_at 컬럼 + INDEX / trackTeamMemberActivity 5분 throttle helper + 5종 호출 위치 wiring / 유령 후보 조회 API + manage 탭 UI / 강제 액션 API (jersey/withdraw/role) + 모달 / 회원 상태 정비 (탈퇴 멤버 별도 탭 + 완전 삭제 API) / 알림 3종 (GHOST_CLASSIFIED / FORCE_WITHDRAWN / FORCE_JERSEY_CHANGED).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `prisma/schema.prisma` | TeamMember.last_activity_at 컬럼 (NULL 허용 ADD COLUMN — 무중단) + (teamId, last_activity_at) 인덱스 | 수정 |
| `src/lib/team-members/track-activity.ts` | trackTeamMemberActivity (5분 throttle 단일 SELECT+조건부 UPDATE) + trackTeamMemberActivityForUser (본인 모든 active 팀 일괄 — updateMany 1회) | 신규 |
| `src/app/(web)/teams/[id]/page.tsx` | trackTeamMemberActivity 호출 (#1 팀 페이지 접속) — silent fail | 수정 |
| `src/app/api/web/tournaments/[id]/join/route.ts` | trackTeamMemberActivity for-loop (#2 대회 출전 player 별) | 수정 |
| `src/app/api/v1/matches/[id]/stats/route.ts` | trackTeamMemberActivityForUser (#3 통계 기록 운영자) — bulk + single 둘 다 | 수정 |
| `src/app/actions/community.ts` | trackTeamMemberActivityForUser (#4 게시판 작성 — 본인 모든 active 팀) | 수정 |
| `src/app/(web)/profile/page.tsx` | trackTeamMemberActivityForUser (#5 마이페이지/로그인) | 수정 |
| `src/lib/notifications/types.ts` | 알림 3종 추가 (GHOST_CLASSIFIED / FORCE_WITHDRAWN / FORCE_JERSEY_CHANGED) | 수정 |
| `src/app/api/web/teams/[id]/ghost-candidates/route.ts` | GET 3개월 미활동 active 멤버 조회 (last_activity_at < now-3m OR (NULL AND createdAt < now-3m)) — ghostClassify 권한 | 신규 |
| `src/app/api/web/teams/[id]/members/[memberId]/force-action/route.ts` | POST action='force_jersey_change' (forceChange 권한 + 충돌 검증) / 'force_withdraw' (withdrawApprove 권한 + 사유 필수) / 'force_change_role' (forceChange 권한) — 트랜잭션 history INSERT eventType='force_changed/force_withdrawn' + 알림 발송 | 신규 |
| `src/app/api/web/teams/[id]/members/[memberId]/permanent-delete/route.ts` | DELETE captain only (위임 X) — status='withdrawn' row 만 통과 + history 보존 (eventType='permanent_deleted') | 신규 |
| `src/app/api/web/teams/[id]/members/route.ts` | GET ?status=withdrawn 쿼리 파라미터 지원 (기본 'active' 회귀 0) — withdrawn 분기 응답 (jersey/role/position/left_at/createdAt) | 수정 |
| `src/app/(web)/teams/[id]/manage/_components/ghost-candidates-tab.tsx` | 유령 후보 탭 UI — 후보 목록 + 액션 (jersey 변경 / 강제 탈퇴 / 분류 해제) + prompt/confirm 모달 + busy 상태 + 카운트 분기 라벨 | 신규 |
| `src/app/(web)/teams/[id]/manage/_components/withdrawn-members-section.tsx` | 탈퇴 멤버 이력 탭 UI — captain only 표시 + 완전 삭제 버튼 + 2단계 confirmation | 신규 |
| `src/app/(web)/teams/[id]/manage/page.tsx` | ManageTab 'ghosts' + 'withdrawn' 추가 + resolveInitialTab 매핑 + tabs 배열 (ghosts 모두 / withdrawn captain 한정) + ghosts/withdrawn 탭 컨텐츠 마운트 + import 2종 | 수정 |

### Schema diff (PM 검토 필요)

```prisma
model TeamMember {
  // ... 기존 동일 ...
  last_activity_at DateTime? @map("last_activity_at") @db.Timestamp(6)  // 신규 — NULL 허용
  // ... 기존 동일 ...
  @@index([teamId, last_activity_at], map: "index_team_members_on_team_id_and_last_activity_at")  // 신규
}
```

NULL 허용 ADD COLUMN + INDEX = 무중단 변경 (운영 영향 0). prisma generate ✅.

### 활동 추적 흐름 (5분 throttle)

```ts
// 1) 본인 active 멤버 조회 + last_activity_at 1회 SELECT
// 2) THROTTLE_MS (5분) 이내면 즉시 false 반환 (UPDATE skip)
// 3) 5분 경과 시 last_activity_at = now() UPDATE
// 평균 호출당 SELECT 1회 + 5분에 한 번만 UPDATE — 운영 부하 최소
```

### 유령 후보 조회 룰 (보고서 §3-3)

```ts
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

where: {
  teamId, status: "active",
  OR: [
    { last_activity_at: { lt: threeMonthsAgo } },
    { AND: [{ last_activity_at: null }, { createdAt: { lt: threeMonthsAgo } }] },  // PR14 신설 전 가입자 fallback
  ]
}
```

### 강제 액션 권한 매트릭스

| Action | 권한 키 | 추가 검증 |
|--------|--------|----------|
| force_jersey_change | forceChange | 다른 active 멤버와 jersey 충돌 X |
| force_withdraw | withdrawApprove | 사유 1자 이상 필수 |
| force_change_role | forceChange | newRole ∈ [member, manager, coach, treasurer, director] (captain X) |
| permanent-delete | **captain only** (위임 X) | status='withdrawn' 만 통과 + 자기자신 차단 |

### 호출 위치 5종 wiring (보고서 §3-2)

| # | 위치 | 호출 함수 | 트리거 시점 |
|---|------|----------|-----------|
| 1 | `(web)/teams/[id]/page.tsx` | trackTeamMemberActivity(teamId, userId) | 본인 active 멤버 SSR 진입 |
| 2 | `api/web/tournaments/[id]/join` | trackTeamMemberActivity(teamId, p.userId) for-loop | ttp INSERT 직후 player 별 |
| 3 | `api/v1/matches/[id]/stats` | trackTeamMemberActivityForUser(ctx.userId) | bulk + single create 직후 |
| 4 | `actions/community.ts` createPostAction | trackTeamMemberActivityForUser(session.sub) | community_posts.create 직후 |
| 5 | `(web)/profile/page.tsx` | trackTeamMemberActivityForUser(userId) | 마이페이지 SSR 진입 |

모두 `.catch(() => {})` fire-and-forget — 실패 시 본 흐름 영향 0.

### tsc 결과

`npx tsc --noEmit` exit code = **0** (errors 0).

💡 tester 참고:
- **사전 조건**: PM 사용자 승인 후 `npx prisma db push` 로 last_activity_at 컬럼 + 인덱스 추가 필요. 미실행 시 모든 trackTeamMemberActivity 호출이 prisma 에러 (silent fail 처리되어 본 흐름은 진행 — 단 활동 추적 0)
- **테스트 시나리오 (PR14 활동 추적)**:
  1. 본인 팀 페이지 진입 → DB SELECT + last_activity_at UPDATE (5분 만에 1회)
  2. 5분 내 재진입 → SELECT 만, UPDATE skip (DB 부하 회피)
  3. 5분+ 경과 후 재진입 → UPDATE 발생
  4. 대회 join → 모든 player 별 trackTeamMemberActivity 호출 (본 팀 → ttp 의 user 들 last_activity_at 갱신)
  5. 마이페이지 진입 → 본인 모든 active 팀 last_activity_at 일괄 갱신 (updateMany 1회)
  6. 게시판 글 작성 → 본인 모든 active 팀 last_activity_at 일괄 갱신
  7. v1 stats POST (Flutter 운영자) → 운영자 본인의 모든 active 팀 갱신
- **테스트 시나리오 (PR15 유령 후보 + 강제 액션)**:
  1. captain 으로 manage `?tab=ghosts` 진입 → "유령 후보" 탭 → GET 통과
  2. 위임받은 ghostClassify manager 로 같은 진입 → GET 통과
  3. 위임 X manager 로 진입 → 403 (UI 의 빈 표시 — 권한 안내)
  4. 후보 목록 표시 — 3개월 미활동 + last_activity_at NULL (가입 3개월+) 둘 다 표시
  5. "jersey 변경" 클릭 → prompt → POST force-action force_jersey_change → DB UPDATE + history 'force_changed' INSERT + 대상 알림
  6. "강제 탈퇴" 클릭 → 사유 prompt + confirm → POST force_withdraw → status='withdrawn' UPDATE + history 'force_withdrawn' INSERT + 대상 알림
  7. "분류 해제" 클릭 → UI state 만 제거 (서버 호출 X — 운영자 false positive 메모)
- **테스트 시나리오 (PR16 회원 상태 정비 + 완전 삭제)**:
  1. captain 으로 manage `?tab=withdrawn` 진입 → "탈퇴 멤버 이력" 탭 표시
  2. 비-captain 진입 → 권한 안내 메시지 ("팀장만 조회 / 관리")
  3. 탈퇴 멤버 row 표시 (이름 / 가입일 / 탈퇴일 + opacity 0.7 톤 다운)
  4. "완전 삭제" 클릭 → 2단계 confirm → DELETE permanent-delete → row 사라짐
  5. team_member_history 에 eventType='permanent_deleted' INSERT 보존 확인 (source of truth)
  6. status='active' 멤버에 대해 permanent-delete 시도 (직접 fetch) → 404 MEMBER_NOT_FOUND_OR_NOT_WITHDRAWN
  7. 비-captain 이 직접 fetch permanent-delete → 403 FORBIDDEN
- **테스트 시나리오 (회귀)**:
  1. force_jersey_change newJersey=null → jerseyNumber UPDATE NULL 처리 정상
  2. 같은 jersey 충돌 → 409 JERSEY_CONFLICT
  3. force_withdraw 사유 1자 미만 → 400 VALIDATION_FAILED
  4. force_change_role newRole='captain' → zod enum 미통과 400
  5. captain 본인을 force-action 대상 → 403 CANNOT_FORCE_CAPTAIN
  6. 운영자 본인을 대상 → 403 CANNOT_FORCE_SELF
  7. members?status=withdrawn 미운영자 → 403 FORBIDDEN

⚠️ reviewer 참고:
- **운영 부하 최적화 (5분 throttle)**: 미묘 룰 #3 (보고서 §8) 엄수. 평균 호출당 SELECT 1회. 5종 wiring 위치가 모두 인기 있는 진입점 (팀 페이지/마이페이지) 인데도 throttle 로 운영 부하 안전.
- **fire-and-forget 일관성**: 모든 trackTeamMemberActivity 호출 = `.catch(() => {})` 패턴. 함수 내부도 try/catch 로 추가 안전망 — 활동 추적 실패가 본 흐름을 막지 않음.
- **NULL fallback 룰**: PR14 컬럼 신설 전 가입자 = last_activity_at NULL → createdAt 기준 평가. 따라서 6개월+ 전 가입한 모든 미활동 멤버가 즉시 후보로 노출 — 운영자가 수동 분류 (false positive 처리).
- **자기 자신 / captain 보호**: force-action 이 captain 본인 / 호출자 자신을 대상으로 할 수 없음. permanent-delete 도 자기 자신 row 차단.
- **history source of truth**: permanent-delete 가 row DELETE 해도 team_member_history 에 'permanent_deleted' INSERT — 향후 재가입 시 과거 이력 추적 가능.
- **알림 3종 silent fail**: createNotification.catch(() => {}) — 알림 실패가 force-action 트랜잭션 자체를 막지 않음.
- **commit X / db push X** — PM 검토 후 진행.

### 다음 작업 (PM)

1. PM 검토 + `npx prisma db push` (last_activity_at 컬럼 + 인덱스)
2. 활동 추적 5종 동작 검증 (DB last_activity_at 값 갱신 여부)
3. 유령 후보 / 강제 액션 / 완전 삭제 UI 동작 검증

### Phase 5 완료 — 전체 회고

| Phase | PR 범위 | 상태 |
|-------|---------|------|
| Phase 1 (Jersey 도메인) | PR1~5 | ✅ 완료 |
| Phase 2 (신청/승인 인프라) | PR6~9 | ✅ 완료 |
| Phase 3 (팀 이적) | PR10~11 | ✅ 완료 |
| Phase 4 (운영진 권한 위임) | PR12~13 | ✅ 완료 |
| Phase 5 (유령회원 + 회원 상태) | **PR14~16** | **✅ 완료** |

총 ~13~14d 분량 → Phase 1~5 모두 commit 보류 + db push 보류 상태로 코드 박제 완료.

---

## 구현 기록 (Phase 4 PR12+PR13 — 운영진 권한 위임 인프라 + 모든 승인 API 통합)

📝 구현한 기능: TeamOfficerPermissions 모델 + 위임 API (POST/DELETE/GET) + manage 운영진 권한 탭 + permissions helper (hasTeamOfficerPermission/isTeamCaptain) + 자동 회수 helper + PR6/7/8/9/10 권한 검증 통합 (5 endpoint).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `prisma/schema.prisma` | TeamOfficerPermissions 모델 신설 (BigInt id + permissions JSON + grantedById + revokedAt + UNIQUE(teamId,userId,revokedAt) + 1 index + 3 FK) + User 2 reverse + Team 1 reverse | 수정 |
| `src/lib/team-members/permissions.ts` | `hasTeamOfficerPermission(teamId,userId,permission)` (captain 자동 true / 위임 row revokedAt=null + permissions JSON 키 true) + `isTeamCaptain` helper | 신규 |
| `src/lib/team-members/auto-revoke-officer-permissions.ts` | captain 변경 시 본 팀 활성 권한 일괄 회수 (revokedAt=now) + 위임받은 자 알림 | 신규 |
| `src/lib/notifications/types.ts` | TEAM_OFFICER_PERMISSION_GRANTED/REVOKED 2종 추가 | 수정 |
| `src/app/api/web/teams/[id]/officer-permissions/route.ts` | POST (captain only, 자기위임차단, 대상 active+role∈delegable, 기존 활성 row UPDATE or 신설, 알림) / DELETE (revokedAt=now soft delete + 알림) / GET (captain: 본 팀 grants 전체 / member: 본인 grant 1건) | 신규 |
| `src/app/api/web/teams/[id]/requests/[requestId]/route.ts` | PR13 권한 통합 — captain+manager 직접 검증 → `hasTeamOfficerPermission` (requestType 별 매핑: jersey_change→jerseyChangeApprove / dormant→dormantApprove / withdraw→withdrawApprove) | 수정 |
| `src/app/api/web/teams/[id]/requests/route.ts` | GET 시야 결정 = 3 권한 중 1개라도 보유 시 canSeeAll / POST 알림 = captain + 해당 type 위임 운영진 N명 (Set 중복 제거) | 수정 |
| `src/app/api/web/transfer-requests/[requestId]/route.ts` | PATCH 권한 통합 — side 별 captain 직접 검증 → `hasTeamOfficerPermission(targetTeamId, transferApprove)` | 수정 |
| `src/app/api/web/transfer-requests/route.ts` | POST 알림 확장 — fromTeam captain + transferApprove 위임받은 자 N명 | 수정 |
| `src/app/api/web/teams/[id]/transfer-requests/route.ts` | GET 권한 통합 — captain 직접 검증 → `hasTeamOfficerPermission(transferApprove)` | 수정 |
| `src/app/(web)/teams/[id]/manage/_components/officer-permissions-tab.tsx` | OfficerPermissionsTab 컴포넌트 — DELEGABLE_ROLES 필터 + 6 권한 체크박스 + dirty 검사 + 저장/회수 버튼 + 위임됨 뱃지 + 빈 상태 안내 | 신규 |
| `src/app/(web)/teams/[id]/manage/page.tsx` | ManageTab 'officers' 추가 + tabs 배열 captain 한정 노출 + 운영진 권한 탭 컨텐츠 마운트 + 비-captain fallback 메시지 + import | 수정 |

### 권한 매트릭스 BEFORE/AFTER

| Endpoint | BEFORE | AFTER |
|----------|--------|-------|
| `PATCH /teams/[id]/requests/[requestId]` | captain 또는 role='manager' 직접 검증 | `hasTeamOfficerPermission(teamId, userId, jerseyChangeApprove\|dormantApprove\|withdrawApprove)` (type 별 매핑) |
| `GET /teams/[id]/requests` | captain 또는 manager 시야 / 일반 멤버 본인만 | 3 권한 중 1개라도 보유 시 canSeeAll / 일반 멤버 본인만 |
| `PATCH /transfer-requests/[id]` | side 별 captain 직접 매칭 | `hasTeamOfficerPermission(targetTeamId, transferApprove)` |
| `GET /teams/[id]/transfer-requests` | captain 직접 매칭 | `hasTeamOfficerPermission(teamId, transferApprove)` |

### permissions JSON 키 (보고서 §4-2 권한 매트릭스 동기)

```ts
type TeamOfficerPermission =
  | "jerseyChangeApprove"  // PR7
  | "dormantApprove"       // PR8
  | "withdrawApprove"      // PR9
  | "transferApprove"      // PR10 (양쪽 사이드 공통 키)
  | "ghostClassify"        // Phase 5 PR15 사전 준비
  | "forceChange";         // Phase 5 PR15 사전 준비
```

### captain 변경 자동 회수 hook 위치 (작업 5)

- 현재 코드베이스 grep 결과 — Team.captainId UPDATE 직접 호출 위치 = **0건**.
- `src/app/actions/teams.ts` = INSERT 시점 captainId 만 (변경 X). PATCH `/teams/[id]/route.ts` updateTeamSchema 에 captainId 키 X.
- 결론: helper `auto-revoke-officer-permissions.ts` 박제만 해두고, 향후 captain 양도 API 가 추가될 때 호출 (예: `/teams/[id]/transfer-captain`). 현 PR12 범위에서는 helper 위치 = **사용 0건 (지연 wired)**.

### tsc 결과

`npx tsc --noEmit` exit code = **0** (errors 0).

### POST 위임 흐름 (요약)

```ts
// 1. captain 검증 (team.captainId === ctx.userId)
// 2. 자기 자신에게 위임 차단 (CANNOT_GRANT_TO_SELF)
// 3. 대상 active 멤버 + role IN ('manager','coach','treasurer','director')
// 4. 기존 활성 row 조회 → 있으면 permissions UPDATE, 없으면 INSERT
// 5. 위임받은 자에게 알림 (silent fail)
// 6. UNIQUE 룰: (teamId, userId, revokedAt) — revokedAt=null 끼리 distinct → 활성 1건만
```

💡 tester 참고:
- **사전 조건**: PM 사용자 승인 후 `npx prisma db push` 로 team_officer_permissions 테이블 생성 필요.
- **테스트 시나리오 (정상 흐름)**:
  1. captain 으로 manage 진입 → "운영진 권한" 탭 노출 → 클릭
  2. 본 팀 manager/coach/treasurer/director 멤버 row 표시 (member 직급은 표시 안 함)
  3. 6 체크박스 중 일부 체크 → "위임" 클릭 → POST 200 + 위임됨 뱃지
  4. 비-captain 으로 같은 manage 진입 → "운영진 권한" 탭 미노출
  5. 위임받은 manager 로 변경요청 탭 진입 → 본인 권한 (jerseyChangeApprove=true) 신청만 인박스 표시
  6. 위임받은 manager 로 PATCH 승인 → 200 (권한 통과)
  7. 위임 안받은 manager 로 같은 PATCH → 403 FORBIDDEN
  8. captain 으로 "회수" 클릭 → DELETE 200 → revokedAt 갱신, 위임됨 뱃지 사라짐
  9. 같은 user 에게 다시 위임 → 신규 row INSERT (UNIQUE 룰 통과)
- **테스트 시나리오 (회귀)**:
  1. captain 자기 자신에게 위임 시도 → 400 CANNOT_GRANT_TO_SELF
  2. 일반 member (role='member') 에게 위임 → 400 TARGET_ROLE_NOT_DELEGABLE
  3. 비-active (withdrawn/dormant) 멤버에게 위임 → 404 TARGET_NOT_TEAM_MEMBER
  4. 비-captain 으로 POST → 403 FORBIDDEN
  5. PATCH transfer-request side='from' 위임받은 자 (transferApprove=true) → 200
  6. PATCH transfer-request side='from' 위임 X → 403 FORBIDDEN

⚠️ reviewer 참고:
- **단일 진입점**: 모든 승인 API 가 `hasTeamOfficerPermission` 호출 — captain 자동 + 위임 row 활성 검증 통합.
- **재위임 차단**: POST 라우트가 `team.captainId !== ctx.userId` 직접 검증 (hasTeamOfficerPermission 호출 X — captain only 룰 명확). 위임받은 자가 다시 위임 API 호출 시 403.
- **soft delete**: 회수 = revokedAt UPDATE (DELETE X). 같은 (team, user) 에 재위임 시 INSERT 가능 — UNIQUE 룰이 NULL 분기로 통과.
- **알림 확장**: PR6/PR10 의 알림이 captain 단일 → captain + 위임받은 자 N명 (Set 중복 제거). silent fail 보존.
- **권한 GET 시야 (requests/route.ts)**: 3 권한 중 1개라도 있으면 본 팀 신청 전체 표시 — 인박스 UI 단순화. 실제 PATCH 시 type 별 권한 재검증.
- **자동 회수 helper 박제만**: 현재 captain 변경 endpoint 0건. 향후 추가 시 호출 위치 1곳.
- **commit X / db push X** — PM 검토 후 진행.

### 다음 작업 (PM)

1. PM 검토 + `npx prisma db push` (team_officer_permissions 신규 테이블 + UNIQUE/INDEX)
2. captain 으로 운영진 권한 탭 검증
3. 위임받은 manager 로 변경요청 처리 검증

---

## 구현 기록 (Phase 3 PR10+PR11 — 팀 이적 양쪽 팀장 승인 state machine)

📝 구현한 기능: TransferRequest 모델 + 양쪽 팀장 승인 state machine API + 자동 이동 트랜잭션 + 이적 모달 + manage 변경요청 탭 통합 + 마이페이지 진행 카드 + 알림 4종.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `prisma/schema.prisma` | TransferRequest 모델 신설 (BigInt id + 양쪽 사이드 status + finalStatus + processedBy 양쪽 + rejectionReason 양쪽 + 3 인덱스 + 5 FK) + User 3 reverse relation (transfer_requests / from_processed / to_processed) + Team 2 reverse relation (from / to) | 수정 |
| `src/lib/notifications/types.ts` | 알림 4종 추가 (TRANSFER_REQUEST_NEW_FROM / NEW_TO / APPROVED / REJECTED) | 수정 |
| `src/app/api/web/transfer-requests/route.ts` | POST 신청 (fromTeam ≠ toTeam + active 멤버 + toTeam 미가입 + pending 1건 룰 + member_request 동시 차단 + 현 팀장 알림) / GET 본인 목록 (status 필터) | 신규 |
| `src/app/api/web/transfer-requests/[requestId]/route.ts` | PATCH state machine (side+action zod / 사이드별 captain 검증 / ALREADY_PROCESSED / ALREADY_REJECTED / approve+approve → 자동 이동 트리거 / reject 즉시 종결) + 자동 이동 트랜잭션 (fromTeam status='withdrawn' + toTeam INSERT status='active' + history 2건 transferred_out/in) + 알림 분기 (rejected → 신청자+다른 captain / approved → 신청자+양쪽 captain / from approve pending → 새 captain 통보) | 신규 |
| `src/app/api/web/teams/[id]/transfer-requests/route.ts` | GET captain 시야 (본 팀이 fromTeam 또는 toTeam 인 본 사이드 status='pending' 만 OR 조건) — manage 인박스용 | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/transfer-request-modal.tsx` | 새 팀 검색 input (debounce 250ms / 글자 ≥ 2) + 자동완성 dropdown (`/api/web/teams/search` fallback) + 사유 textarea 200자 + 안내 박스 + POST → 800ms 토스트 후 router.refresh | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/member-actions-menu.tsx` | (a) fetchPending 병렬 호출 (member + transfer) — 이적 우선 검사 (b) PendingState 'transfer' 분기 추가 + 트리거 라벨 "→ N팀 진행 중" disabled (c) dropdown 4번째 메뉴 "이적 신청" + swap_horiz 아이콘 (d) TransferRequestModal 마운트 + teamName prop 추가 | 수정 |
| `src/app/(web)/teams/[id]/_components_v2/roster-tab-v2.tsx` | teamName prop 추가 + MemberActionsMenu 호출에 전달 | 수정 |
| `src/app/(web)/teams/[id]/page.tsx` | RosterTabV2 호출에 teamName={team.name} 전달 | 수정 |
| `src/app/(web)/teams/[id]/manage/page.tsx` | TransferRequestRow 인터페이스 신설 + transferRequests state 4종 + fetchTransferRequests + handleTransferAction (side 자동 결정 — fromTeamId === id 면 'from') + useEffect 첫 마운트 1회 로드 + 변경 요청 탭 카운트에 transferRequests.length 합산 + member-requests 탭 하단 "이적 신청" 별도 섹션 (sideLabel 분기 / 상대 팀 진척도 표시 / 거부+승인 데스크탑/모바일 액션) | 수정 |
| `src/app/(web)/profile/_v2/transfer-progress-card.tsx` | 본인 pending 이적 카드 (마운트 시 GET 1회 / pending 0건 시 미렌더 / 양쪽 사이드 status 뱃지 색상 분기 / 새 팀 보기 링크) | 신규 |
| `src/app/(web)/profile/page.tsx` | TransferProgressCard import + TeamsListCard 위 마운트 | 수정 |

### state machine 핵심 흐름 (PATCH)

```ts
// 1. 신청 조회 + finalStatus !== 'pending' 차단
// 2. 권한: fromTeam captain (side='from') 또는 toTeam captain (side='to')
// 3. 본 사이드 status='pending' 만 처리 (재처리 차단)
// 4. 다른 사이드 'rejected' 차단
// 5. action='reject' → finalStatus='rejected' (즉시)
// 6. action='approve' + 다른 사이드 'approved' → finalStatus='approved' + 자동 이동 트리거
// 7. action='approve' + 다른 사이드 'pending' → finalStatus='pending' (대기)
// 자동 이동 트랜잭션 (모두 단일 prisma.$transaction):
//   - transferRequest.update (status 들 + finalStatus + processedBy connect + processedAt)
//   - fromMember snapshot (jersey/position/role 박제) → status='withdrawn'
//   - toMember INSERT (status='active', role='member', jersey=null)
//   - history 2건 INSERT (transferred_out / transferred_in)
```

### 미묘 룰 검증 (POST)

- fromTeam ≠ toTeam (SAME_TEAM 400)
- 본인 fromTeam active 멤버 (NOT_FROM_TEAM_MEMBER 403)
- toTeam 미가입 (ALREADY_TO_TEAM_MEMBER 409)
- transfer pending 1건 룰 (ALREADY_PENDING_TRANSFER 409)
- member_request pending 동시 차단 (ALREADY_PENDING_MEMBER_REQUEST 409)
- toTeam dissolved 차단 (TO_TEAM_DISSOLVED 409)
- PATCH 시점 fromMember active 재검증 (APPLICANT_NOT_ACTIVE 409 — 그 사이 휴면/탈퇴 시)

### 알림 분기

| 시점 | 대상 | 타입 |
|------|------|------|
| POST | 현 팀장 | TRANSFER_REQUEST_NEW_FROM |
| from approve (다른 사이드 pending) | 새 팀장 + 신청자 | TRANSFER_REQUEST_NEW_TO + APPROVED (진행) |
| 양쪽 approve (자동 이동) | 신청자 + 양쪽 팀장 | TRANSFER_REQUEST_APPROVED |
| 어느 쪽이든 reject | 신청자 + 다른 팀장 | TRANSFER_REQUEST_REJECTED |

### tsc 결과

`npx tsc --noEmit` exit code = 0 (errors 0).

💡 tester 참고:
- **사전 조건**: PM 사용자 승인 후 `npx prisma db push` 로 transfer_requests 테이블 생성 필요. 미실행 시 POST/PATCH/GET 모두 prisma 에러 500.
- **테스트 시나리오 (정상 흐름)**:
  1. 본인 A팀 active 멤버 → 팀 페이지 → "내 액션 ▾" → "이적 신청" → 모달 진입
  2. B팀 검색 (2글자 이상) → 자동완성 선택 → 사유 입력 → "이적 신청" → 201
  3. A팀 captain 알림 수신 → manage `?tab=member-requests` → "이적 신청" 섹션 표시 → "이 팀에서 떠나려는 신청"
  4. A captain 승인 → B captain 알림 수신 + 신청자 진행 알림 (현 팀장 승인 완료)
  5. B captain 승인 → 자동 이동 트랜잭션 (A team_members.status='withdrawn' + B INSERT active jersey=NULL + history 2건)
  6. 신청자 알림 수신 (이적 완료) + 양쪽 captain 알림 수신
  7. A 팀 페이지 진입 → 본인 row 자동 제외 (status='withdrawn')
  8. B 팀 페이지 진입 → 본인 row 표시 (jersey 미배정 — 새 팀에서 jersey_change 신청으로 등록)
- **테스트 시나리오 (거부)**:
  1. 본인 신청 후 A captain "거부" → 사유 입력 → finalStatus='rejected' / 신청자 + B captain 알림
  2. 같은 사용자 즉시 다른 팀 이적 시도 → 정상 (rejected 는 pending 0건이므로 ALREADY_PENDING X)
- **테스트 시나리오 (회귀)**:
  1. 같은 사용자 pending 이적 중 재신청 → 409 ALREADY_PENDING_TRANSFER
  2. 같은 사용자 jersey_change pending 중 이적 시도 → 409 ALREADY_PENDING_MEMBER_REQUEST
  3. 같은 사용자 이적 pending 중 jersey_change 시도 → 가능 (TeamMemberRequest 미묘 룰 #1 은 1건 — transfer_request 와 별개) — 단, MemberActionsMenu 가 transfer 우선 차단으로 트리거 disabled (UI 단)
  4. fromTeam == toTeam → 400 SAME_TEAM
  5. 이미 toTeam active 멤버 → 409 ALREADY_TO_TEAM_MEMBER
  6. 양쪽 사이드 captain 아닌 사용자 PATCH → 403 FORBIDDEN
  7. 같은 사이드 두 번 처리 → 409 ALREADY_PROCESSED
  8. 한쪽 reject 후 다른 사이드 처리 → 409 ALREADY_REJECTED 또는 ALREADY_FINALIZED
  9. PATCH approve 시점 신청자가 휴면 처리되어 있음 → 409 APPLICANT_NOT_ACTIVE
  10. 마이페이지 진입 → pending 이적 1건 → TransferProgressCard 렌더 → 양쪽 사이드 status 뱃지 정확

⚠️ reviewer 참고:
- **트랜잭션 일관성**: PATCH approve+approve 분기에서 transferRequest.update / fromMember.update (withdrawn) / toMember.create / history 2건 INSERT 모두 단일 prisma.$transaction. 부분 실패 시 모두 롤백 — 사일런트 분기 0.
- **잘못된 ID 차단 — APPLICANT_NOT_ACTIVE**: PATCH approve 트리거 시점에 fromMember active 재검증. 그 사이 휴면/탈퇴되면 자동 이동 차단 (트랜잭션 진입 X).
- **이중 가입 방지 (re-check)**: PATCH approve 트리거 시점에 toMember active 재검증. 어떤 경로로든 이미 가입한 경우 ALREADY_TO_TEAM_MEMBER 차단.
- **jersey 정책**: 새 팀 INSERT 시 jersey_number=NULL — 기존 팀 jersey 가 새 팀에서 충돌할 수 있으므로 명시적으로 비움. 새 팀에서 jersey_change 신청으로 등록 (PR7 흐름).
- **manage GET endpoint 분리**: `/api/web/transfer-requests` (본인 시야 — userId 필터) vs `/api/web/teams/[id]/transfer-requests` (captain 시야 — fromTeam OR toTeam + 본 사이드 pending). 권한과 시야가 명확히 분리.
- **MemberActionsMenu 단순화**: pending 이적이 있으면 모든 액션 차단 (트리거 disabled). 이유 = 흐름 동시 진행 차단 + 사용자 혼동 회피. 다른 팀 멤버라도 본인이 어느 팀에서든 pending 이적 있으면 모든 팀의 액션 메뉴가 disabled.
- **알림 silent fail**: createNotification 모두 .catch(() => {}) — 알림 실패가 트랜잭션 자체를 막지 않음 (가용성 우선).
- **schema 변경 1 모델 + 5 reverse relation**: PR6 패턴과 동일 (단일 테이블 + 명확한 명명). prisma generate ✅ / db push X (PM 진행).
- **commit X / db push X** — PM 검토 후 진행.

---

## 구현 기록 (PR8+PR9 — 휴면 + 탈퇴 신청 dispatcher 활성화 + UI)

📝 구현한 기능: PR6 dispatcher dormant/withdraw 분기 활성화 + lazy 복구 hook + 휴면/탈퇴 모달 + 본인 row dropdown 통합 (번호변경+휴면+탈퇴 3액션).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/teams/[id]/requests/[requestId]/route.ts` | dispatcher dormant/withdraw 분기 활성화 (active row prevStatus/prevJersey/prevPosition 박제 + history payload 분기 3종 + status UPDATE 트랜잭션 합류) | 수정 |
| `src/lib/team-members/check-dormant-expiry.ts` | lazy 복구 helper 신설 — 본인 dormant row + 최근 'dormant' history.payload.until 조회 → 만료 시 트랜잭션 status='active' UPDATE + history 'reactivated' INSERT (운영 부하 회피: SELECT 2회 + 만료 시만 UPDATE) | 신규 |
| `src/app/(web)/teams/[id]/page.tsx` | session.sub 분기 안에 `checkAndExpireDormant(team.id, userId)` 호출 (silent fail) + import | 수정 |
| `src/app/(web)/profile/page.tsx` | Promise.all 직후 본인 dormant row SELECT 1회 + 각 teamId 별 lazy hook 병렬 호출 + import | 수정 |
| `src/app/(web)/teams/[id]/_components_v2/dormant-request-modal.tsx` | 휴면 신청 모달 — until date input (기본 +3개월 / 최소 +7일 / 최대 +12개월) + 사유 100자 + 안내 박스 ("자동 복귀") + POST request_type='dormant' | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/withdraw-request-modal.tsx` | 탈퇴 신청 모달 — 사유 5~200자 필수 + danger 톤 경고 박스 ("탈퇴 후 활동 기록 보존 / 명단 제외 / 재가입 별도 신청") + POST request_type='withdraw' | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/member-actions-menu.tsx` | 본인 row dropdown — "내 액션 ▾" 트리거 + 3 메뉴 (번호 변경 / 휴면 신청 / 탈퇴 신청) + pending 분기 라벨 (#N번 승인 대기 / 휴면 승인 대기 / 탈퇴 승인 대기) + clickOutside·Esc 닫기 + 모달 3종 toggle | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/roster-tab-v2.tsx` | (a) status 필터 `['active','dormant']` 확장 + status select 추가 (b) orderBy 에 status 추가 + 정렬 로직 dormant 후순위 (c) 휴면 뱃지 표시 (badge--soft) + 카드 opacity 0.6 톤 다운 (d) JerseyChangeButton → MemberActionsMenu 교체 (휴면 본인은 dropdown 미노출 — 자동 복귀 hook 으로 다음 SSR 진입 시 active 복귀) | 수정 |
| `src/app/(web)/teams/[id]/manage/page.tsx` | "변경 요청" 탭 안내 문구 갱신 — "PR8/PR9 후속" → "PR7+PR8+PR9 모두 즉시 반영" 메시지 | 수정 |

### dispatcher 활성화 흐름 (PATCH approve)

```ts
// PR8 dormant approve
if (action === "approve" && requestType === "dormant") {
  // 1. payload.until 추출 (POST 시 +3개월 기본값으로 채워짐)
  // 2. 본인 active row prevStatus/prevJersey/prevPosition 박제 → history.payload
  // 3. 트랜잭션: request.update + history.create (eventType='dormant') + teamMember.updateMany (status='dormant')
}
// PR9 withdraw approve
if (action === "approve" && requestType === "withdraw") {
  // 1. 본인 active row prev* 박제
  // 2. 트랜잭션: request.update + history.create (eventType='withdrawn') + teamMember.updateMany (status='withdrawn')
}
```

### history payload 형식 분기 (eventType)

| 시점 | eventType | payload |
|------|-----------|---------|
| jersey_change approve | `jersey_changed` | `{old, new, reason}` |
| dormant approve | `dormant` | `{until, reason, prevStatus}` |
| withdraw approve | `withdrawn` | `{reason, prevStatus, prevJersey, prevPosition}` |
| reactivated (lazy hook) | `reactivated` | `{prevStatus, prevUntil, autoExpired:true, sourceHistoryId}` |
| reject 모두 | `{type}_rejected` | `{requestPayload, oldStatus, newStatus, rejectionReason?}` |

### lazy 복구 hook 설계 (미묘 룰 #2)

- 호출 위치 = 본인 시야 진입점만 (운영 부하 회피)
  - `(web)/teams/[id]/page.tsx` — session.sub 검증 직후 (silent fail)
  - `(web)/profile/page.tsx` — teamMembers fetch 직후 (별도 dormant SELECT 1쿼리 + 병렬 hook)
- 운영 부하: 평균 SELECT 1~2회 + 만료 시만 트랜잭션 1회. 대다수 사용자 active = SELECT 1회 종료.
- 본 SSR 응답에는 즉시 반영 X (다음 새로고침 시점에 active 표시) — 사용자 결정 트레이드오프

### roster 표시 룰 (PR8+PR9)

| status | roster 표시 | 뱃지 | 카드 톤 | 본인 액션 메뉴 |
|--------|------------|------|---------|---------------|
| active | ✅ 표시 | 역할/선출 뱃지 | 정상 | ✅ MemberActionsMenu (3 액션) |
| dormant | ✅ 표시 (active 뒤) | "휴면" 뱃지 (soft) | opacity 0.6 | ❌ 미노출 (자동 복귀 후 가능) |
| withdrawn | ❌ 자동 제외 | — | — | — |

### 본인 row dropdown 분기 (MemberActionsMenu)

| pending 상태 | 트리거 라벨 | disabled |
|--------------|-----------|----------|
| loading | 확인 중... | true |
| none | 내 액션 ▾ | false (dropdown 열림) |
| jersey_change | #N번 승인 대기 | true |
| dormant | 휴면 승인 대기 | true |
| withdraw | 탈퇴 승인 대기 | true |

### tsc 결과

`npx tsc --noEmit` exit code = 0 (errors 0).

💡 tester 참고:
- **사전 조건**: PR6 schema (team_member_requests + team_member_history) 가 운영 DB 에 push 되어 있어야 prisma 에러 0. PR8/PR9 는 schema 변경 0 (status 컬럼 값만 추가).
- **테스트 시나리오 (PR8 dormant)**:
  1. 팀 페이지 본인 row → "내 액션 ▾" → "휴면 신청" 클릭 → 모달 진입 (until 기본값 +3개월 자동 채움)
  2. 신청 → 팀장 manage "변경 요청" 탭에 "휴면 신청" row 표시 (회색 톤)
  3. 승인 → roster 본인 row 가 "휴면" 뱃지 + opacity 0.6 표시 + 본인 dropdown 미노출
  4. profile 페이지 teamsList 카드 — 휴면 row 도 표시됨 (status filter active 만 가져옴 → 이번 세션 미노출, 다음 새로고침 시 active 복귀 시 자동 표시)
  5. until < now 도래 후 본인 팀 페이지 진입 → lazy hook 자동 실행 → 다음 새로고침 시 active 복귀 + 휴면 뱃지 제거
  6. 회귀: until 7일 미만 입력 → 클라이언트 검증 차단 / 12개월 초과 → 차단
- **테스트 시나리오 (PR9 withdraw)**:
  1. "내 액션 ▾" → "탈퇴 신청" → 사유 5자 미만 입력 → 버튼 disabled (클라 검증)
  2. 사유 5자 이상 입력 → 신청 → manage "변경 요청" 탭 "탈퇴 신청" row 표시 (danger 톤)
  3. 승인 → roster 본인 row 자동 제외 (status='withdrawn' → IN ['active','dormant'] 필터 통과 X)
  4. profile teamsList — 해당 팀 카드 자동 제외
  5. team_member_history SELECT — eventType='withdrawn' + payload.prevJersey/prevPosition 보존 확인
- **테스트 시나리오 (회귀)**:
  1. 같은 사용자 휴면 pending 중 다시 탈퇴 신청 시도 → 409 ALREADY_PENDING (PR6 미묘 룰 #1)
  2. 휴면 본인이 jersey_change 신청 시도 → 403 NOT_TEAM_MEMBER (POST 가 status='active' 만 통과)
  3. dormant approve 시 active 가 아닌 경우 (이미 휴면/탈퇴 등) → 409 APPLICANT_NOT_ACTIVE
  4. withdraw approve 시 active 가 아닌 경우 → 409 APPLICANT_NOT_ACTIVE

⚠️ reviewer 참고:
- **트랜잭션 일관성**: dispatcher 의 status UPDATE + history INSERT + request.update 모두 prisma.$transaction. 부분 실패 시 모두 롤백. lazy hook 도 트랜잭션 (UPDATE+INSERT 묶음).
- **lazy hook silent fail**: 동시 다발 호출 / 다른 흐름 (강제 변경) 충돌 시 silent — 다음 진입에서 재시도. 데이터 일관성 우선이 아닌 가용성 우선 정책.
- **history.payload.until 손상 안전망**: dormant_until ISO 변환 실패 시 dormantUntil=null 로 INSERT (lazy hook 이 until 없는 row 는 자동 복귀 X — 수동 처리 안내). request 자체는 정상 진행.
- **휴면 본인 액션 메뉴 미노출 의도**: status='dormant' 본인이 새 신청을 보내려면 active 로 복귀해야 함 (POST 의 status='active' 가드). 이는 의도된 흐름 — UI 에서도 명확히 차단.
- **profile teamMembers fetch 의 status='active' 미변경**: 본 PR 에서 active 만 표시 유지 (사용자 결정 — 복귀는 다음 새로고침에 표시). 휴면 중인 팀은 마이페이지에서 자동 숨김 — UX 단순화.
- **dropdown clickOutside / Esc**: 표준 패턴 (containerRef + document mousedown/keydown 이벤트) — 다른 모달과 충돌 0.
- **schema 변경 X / commit X / db push X** — PM 검토 후 진행.

---

## 구현 기록 (PR7 — 번호 변경 신청 흐름 활성화)

📝 구현한 기능: PR6 dispatcher jersey_change 분기 활성화 + 본인 row 번호 변경 모달 + 팀장/매니저 변경요청 탭 (UI). PR7 = jersey_change 만 실제 작동 / dormant·withdraw 는 표시만 (PR8/PR9 후속).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/teams/[id]/requests/[requestId]/route.ts` | dispatcher placeholder TODO → jersey_change approve 활성화 (재충돌 검증 + team_members.jersey_number UPDATE + history INSERT eventType='jersey_changed' + payload {old,new,reason} 형식 적용) — 모두 단일 트랜잭션 | 수정 |
| `src/app/(web)/teams/[id]/_components_v2/jersey-change-request-modal.tsx` | 신청 모달 (현재 번호 표시 + 사용 중 번호 안내 PR2 jerseys-in-use 재사용 + 새 번호 0~99 input + 사유 100자 textarea + POST /api/web/teams/[id]/requests + 성공 시 router.refresh + 800ms 후 닫기) | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/jersey-change-button.tsx` | 본인 row 버튼 client wrapper (mount 시 GET ?status=pending 1회 조회 → kind=loading/none/jersey_change/other 분기 → "번호 변경" / "#N번 승인 대기" / "신청 대기 중" 라벨) + 모달 토글 + onSuccess 후 재조회 | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/roster-tab-v2.tsx` | currentUserId prop 추가 (BigInt 비교 isMe) + 본인 row 만 Link 외부 div 로 감싸 클릭 충돌 회피 + JerseyChangeButton 마운트 | 수정 |
| `src/app/(web)/teams/[id]/page.tsx` | RosterTabV2 호출에 currentUserId={session?.sub ? BigInt(session.sub) : null} 전달 | 수정 |
| `src/app/(web)/teams/[id]/manage/page.tsx` | ManageTab type 'member-requests' 추가 + resolveInitialTab 매핑 (member-requests/memberRequests/jersey-change) + MemberRequestRow 인터페이스 신설 + state 4종 + fetchMemberRequests + handleMemberRequestAction + 첫 마운트 1회 로드 + 탭 배열에 "변경 요청" 추가 (count=pending) + 변경 요청 탭 UI (type 별 분기 라벨/색상 — jersey_change=info/dormant=muted/withdraw=error + 사유 좌측 accent border + 데스크탑/모바일 액션 분기) | 수정 |

### dispatcher 활성화 흐름 (PATCH approve)

```ts
if (action === "approve" && requestType === "jersey_change") {
  // 1. payload.newJersey 추출 (zod 보장 0~99)
  // 2. 신청자 active row 조회 → oldJersey 기록
  // 3. 재충돌 검증 (status='active' AND NOT 본인 AND jersey_number=newJersey) → 409
  // 4. 트랜잭션 ops 배열에 teamMember.updateMany 추가
}
const txOps = [request.update, history.create, ...(jersey_change ? [teamMember.updateMany] : [])];
await prisma.$transaction(txOps);
```

### 미묘 룰 검증 (재충돌)

POST 시점 사전 검증 통과 → PATCH approve 시점 재검증 (그 사이 다른 멤버가 같은 번호 사용 가능). 둘 다 통과해야 UPDATE.

### history payload 형식 분기

- jersey_change approve: `{requestId, requestType, old, new, reason}` (보고서 §3 명세)
- 그 외 (jersey_change reject / dormant·withdraw): `{requestId, requestType, requestPayload, oldStatus, newStatus, rejectionReason?}` (PR6 기존 형식 유지)

### 본인 row 버튼 표시 분기 (JerseyChangeButton)

| pending 상태 | 라벨 | disabled |
|--------------|------|----------|
| loading (mount 직후 fetch 중) | 확인 중... | true |
| none | 번호 변경 | false |
| jersey_change (newJersey=N) | #N번 승인 대기 | true |
| other (dormant/withdraw) | 신청 대기 중 | true |

### tsc 결과

`npx tsc --noEmit` exit code = 0 (errors 0).

💡 tester 참고:
- **사전 조건**: PR6 schema (team_member_requests + team_member_history) 가 운영 DB 에 push 되어 있어야 prisma 에러 0.
- **테스트 시나리오 (jersey_change 핵심 흐름)**:
  1. 팀 페이지 진입 (로그인 본인 active 멤버) → 본인 row 카드 우하단에 "번호 변경" 버튼 표시
  2. 비로그인 / 타 팀 / 본인 아닌 멤버 row → 버튼 미표시 (currentUserId 분기)
  3. "번호 변경" 클릭 → 모달 열림 → "사용 중 번호" 미리 표시 (PR2 jerseys-in-use)
  4. 새 번호 입력 + 사유 입력 → "신청" → 성공 토스트 → 800ms 후 모달 닫기 + router.refresh
  5. 즉시 본인 row 버튼이 "#[N]번 승인 대기" disabled 상태로 변경
  6. 팀장 계정으로 /teams/[id]/manage 진입 → "변경 요청" 탭 (카운트 1) → 신청 카드 표시 (등번호 변경 라벨 + → #N + 사유)
  7. "승인" 클릭 → row 제거 → 팀 페이지 로스터 새로고침 시 본인 jersey_number = N 으로 변경 + 알림 발송
  8. "거부" 클릭 → prompt 사유 입력 → row 제거 + 거부 알림 발송
- **회귀 검증**:
  1. 같은 사용자 즉시 다시 신청 시도 → 409 ALREADY_PENDING (PR6 미묘 룰 #1)
  2. 본인 현재 번호 = 신청 시 → 400 SAME_JERSEY (서버 + 클라이언트 둘 다 차단)
  3. 사용 중 번호 신청 → 409 JERSEY_CONFLICT (POST + PATCH approve 둘 다)
  4. 승인 시점에 다른 멤버가 같은 번호 가져간 경우 → PATCH 가 409 차단 (트랜잭션 안 들어감)
  5. dormant/withdraw 신청도 변경 요청 탭에 표시 (라벨/색상만 분기). 승인 시 status UPDATE + history INSERT 만 (실제 변경 0)
  6. 일반 멤버 가 manage 진입 → fetchMemberRequests 응답에 canSeeAll=false → 빈 목록 (서버 + 클라 양쪽 가드)

⚠️ reviewer 참고:
- **트랜잭션 안전성**: prisma.$transaction([request.update, history.create, teamMember.updateMany]) — 한 작업 실패 시 모두 롤백. team_members 만 변경되고 request 는 pending 인 사일런트 분기 0.
- **재충돌 검증 시점**: POST 시 + PATCH approve 시 2회. 사이 시점에 다른 신청 승인되어 충돌하면 두 번째 approve 가 409 — 의도된 동작 (먼저 승인된 신청이 우선).
- **history.eventType 명명**: jersey_change approve 만 'jersey_changed' (보고서 §3) / 그 외는 '{type}_{approved|rejected}' 패턴. 통합 SELECT 시 다양한 eventType 처리 필요.
- **본인 row Link 회피**: `isMe` 일 때만 `<div>` 로 감싸 클릭 충돌 0. 타 멤버 카드는 기존대로 `/users/[id]` Link 그대로 (회귀 0).
- **server component 의 onClick 금지**: roster-tab-v2 는 async server component → 본인 row div 에 onClick 추가 시 빌드 에러. 모든 인터랙션은 JerseyChangeButton (client) 으로 위임.
- **manage 탭 6탭 구조**: roster / applicants / 변경 요청 / matches / invite / settings — 멤버 관리 맥락 기준 변경 요청을 가입 신청 직후 배치. 알림 actionUrl 호환 매핑 추가 (`?tab=member-requests` / `?tab=jersey-change`).
- **PR8/PR9 호환**: dormant/withdraw 탭에 표시되지만 승인 시 status UPDATE + history INSERT 만 (PR6 기존 흐름). PR8/PR9 에서 dispatcher 분기 추가만 하면 됨.
- **commit X / db push X** — PM 검토 후 진행.

---

## 구현 기록 (PR6 — Phase 2 신청/승인 인프라)

📝 구현한 기능: `team_member_requests` 통합 테이블 + `team_member_history` 신설 + 신청/조회/승인/거부 API + 알림 3종 — type 별 실제 동작은 PR7+ placeholder TODO

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `prisma/schema.prisma` | TeamMemberRequest + TeamMemberHistory 모델 신설 (단수, Rails team_member_histories 와 별도) + Team 2 + User 4 reverse relation | 수정 |
| `src/app/api/web/teams/[id]/requests/route.ts` | POST (zod discriminatedUnion type 별 payload + 미묘 룰 #1 ALREADY_PENDING + jersey 충돌 사전 검증 + 팀장 알림) / GET (captain·manager 전체 / 일반 본인만 + status 필터) | 신규 |
| `src/app/api/web/teams/[id]/requests/[requestId]/route.ts` | PATCH (approve/reject + dispatcher placeholder TODO PR7~9 + 트랜잭션 status UPDATE + history INSERT + 신청자 알림) | 신규 |
| `src/lib/notifications/types.ts` | TEAM_MEMBER_REQUEST_NEW/APPROVED/REJECTED 3종 추가 | 수정 |

### Schema diff (PM 검토 필요)

- TeamMemberRequest: id/teamId/userId/requestType(20)/payload(Json)/reason/status(default pending)/processedById/processedAt/rejectionReason/createdAt/updatedAt + 3 FK (Team Cascade / User Cascade / Processor SetNull) + 3 인덱스 ([teamId,status] / [userId,status] / [teamId,requestType,status])
- TeamMemberHistory: id/teamId/userId/eventType(30)/payload/reason/createdById/createdAt + 3 FK + 3 인덱스
- 명명 충돌 회피: 신규 = 단수 (`team_member_history`) / 기존 Rails 잔재 = 복수 (`team_member_histories`) — DB 상에서도 별도 테이블

### 미묘 룰 #1 검증 흐름 (POST)

1. 본인 active 멤버 검증 (NOT_TEAM_MEMBER 403)
2. **`teamMemberRequest.findFirst({ teamId, userId, status: 'pending' })` → 1건이라도 있으면 ALREADY_PENDING 409**
3. type 별 사전 검증 (jersey_change: 같은 번호 SAME_JERSEY / 다른 멤버 사용 중 JERSEY_CONFLICT)
4. INSERT + 팀장 알림 (notifiableType="team_member_request" / notifiableId=created.id)

### dispatcher 패턴 (PATCH approve)

```ts
switch (memberRequest.requestType) {
  case 'jersey_change': /* TODO PR7 — team_members.jersey_number UPDATE + 재충돌 검증 + ttp sync */
  case 'dormant':       /* TODO PR8 — team_members.status='dormant' + dormant_until + lazy 복구 */
  case 'withdraw':      /* TODO PR9 — team_members DELETE + history 영구 보존 */
}
```

PR6 에서는 status='approved'/'rejected' UPDATE + history INSERT (eventType=`{requestType}_{approved|rejected}`) 만.

### 알림 3종 위치

- `src/lib/notifications/types.ts`:
  - `TEAM_MEMBER_REQUEST_NEW` = `team.member_request.new` (팀장에게)
  - `TEAM_MEMBER_REQUEST_APPROVED` = `team.member_request.approved` (신청자)
  - `TEAM_MEMBER_REQUEST_REJECTED` = `team.member_request.rejected` (신청자)
- `createNotification` 기존 패턴 재사용 (sendPushToUser 자동 동반)

### tsc 결과

`npx tsc --noEmit` exit code = 0 (errors 0).

💡 tester 참고:
- **사전 조건**: PM 사용자 승인 후 `npx prisma db push` 로 두 테이블 생성 필요. 미실행 시 POST/PATCH 모두 prisma 에러 500.
- **테스트 시나리오 (PR6 인프라만)**:
  1. POST jersey_change `{ requestType, payload: { newJersey: 99 } }` — pending 0건 + 충돌 0 = 201 + 팀장에 알림
  2. 같은 사용자 즉시 POST 다른 type → 409 ALREADY_PENDING (미묘 룰 #1)
  3. POST jersey_change `{ newJersey: <본인현재번호> }` → 400 SAME_JERSEY
  4. POST jersey_change `{ newJersey: <다른멤버사용중> }` → 409 JERSEY_CONFLICT
  5. POST dormant `{ until 미입력 }` → payload.until = +3개월 ISO 자동 저장
  6. POST withdraw `{ payload: {} }` → 201
  7. GET (팀장) → 모든 신청 조회 / GET (일반멤버) → 본인만 / GET ?status=pending 필터
  8. PATCH approve → status='approved' + team_member_history row INSERT + 신청자 알림
  9. PATCH 같은 신청 다시 → 409 ALREADY_PROCESSED
  10. PATCH 비-captain/매니저 → 403 FORBIDDEN

⚠️ reviewer 참고:
- **명명 충돌**: 기존 `team_member_histories` (Rails) 와 별도 테이블 (`team_member_history` 단수). 두 테이블 공존 — Phase 5 마이그레이션 시점에 통합 검토.
- **manager 권한 범위**: 본 PR6 = `team_members.role='manager'` AND status='active' 만 통과 (vice/coach/treasurer/director 차단). Phase 4 PR12 에서 `team_officer_permissions` 통합 후 권한 매트릭스 재정의.
- **dispatcher placeholder**: PR6 의 PATCH approve 는 status UPDATE + history INSERT 만. type 별 실제 변경은 PR7+. 현재는 jersey_change 승인 시 team_members.jersey_number 가 변경 안 됨 — 이는 의도된 PR6 범위.
- **트랜잭션 일관성**: status UPDATE + history INSERT 가 prisma.$transaction. PR7+ 에서 type별 실제 변경 추가 시 같은 트랜잭션에 합류.
- **알림 actionUrl**: `/teams/${teamId}/manage/requests` 는 미존재 페이지 — Phase 2 PR7~9 UI 작업에서 신설 예정. 현재는 클릭 404 일시적.
- **prisma db push X / commit X** — PM 검토 후 진행.

---

## 구현 기록 (developer / 5/5 Phase 1 PR1+PR2+PR3 — 압축)

PR1 (`ae4ffd7`): default_jersey_number 사용처 정리 (7 파일 / captain 검증 → team_members.jersey_number 치환).
PR2 (`d72aa0a`): 가입 폼 jersey input + 자동 복사 hook + 마이페이지 다중 팀 카드 (7 파일, neuron 2 / `preferred_jersey_number` 재사용).
PR3 (커밋 대기): tournament join 시 team_members → ttp 자동 복사 (운영자 시야 X) + 신청 폼 jersey input 제거 (2 파일, ef7e78e role 분기 보존).

상세 보고: developer agent 응답 (PR1=ae4ffd7 commit msg / PR2=d72aa0a / PR3=PM commit 후 hash).

Phase 1 진행 현황: PR1~PR4 ✅ 완료 / **PR5 ✅ 완료 (PM commit 대기)**.

---

## 구현 기록 (PR5 — Flutter v1 jersey 우선순위 helper 적용)

📝 구현한 기능: 매치 시점 jersey 우선순위 helper 신설 + Flutter v1 3 endpoints 적용 (스키마 변경 0)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/jersey/resolve.ts` | helper 3종: `resolveMatchJersey` (단일) / `resolveMatchJerseysBatch` (매치1+ttpN) / `resolveMatchJerseysMulti` (매치N+ttpN) | 신규 |
| `src/app/api/v1/matches/[id]/stats/route.ts` | ttp.id select 추가 + batch helper 호출 + 응답 jerseyNumber 결정값 사용 (표시명 폴백도 결정값) | 수정 |
| `src/app/api/v1/matches/[id]/roster/route.ts` | home+away players ttp 합쳐 batch 호출 + jersey_number 결정값 사용 (orderBy 는 ttp 그대로 — DB 정렬 영구 번호 유지) | 수정 |
| `src/app/api/v1/tournaments/[id]/player-stats/route.ts` | (matchId, ttpId) 페어 multi helper 호출 + 시즌통계 row 별 매치 시점 jersey 적용 | 수정 |

### v1 6 endpoints helper 적용 / 미적용 결정

| # | 파일 | 결정 | 사유 |
|---|------|------|------|
| 1 | `matches/[id]/stats` | ✅ 적용 | 박스 스코어 — 매치 컨텍스트 명확 (matchId 1건 + ttp N) |
| 2 | `matches/[id]/roster` | ✅ 적용 | 라이브 명단 — 매치 컨텍스트 명확 |
| 3 | `players/[id]/stats` | ⚠ 미적용 | 선수 커리어 통계 = 영구 번호 의미 (player.jerseyNumber 단일 값 응답) |
| 4 | `tournaments/[id]/teams/[teamId]/players` | ⚠ 미적용 | 팀 선수 목록 = 영구 번호 응답 (지시서 §4 명시) |
| 5 | `tournaments/[id]/full-data` | ⚠ 미적용 | 오프라인 동기화 = 영구 번호. player_stats row 자체엔 jersey 없음 (Flutter 앱이 player.jersey 참조) |
| 6 | `tournaments/[id]/player-stats` | ✅ 적용 | 시즌 통계 = (matchId, ttpId) 페어별 매치 시점 정확값 |

### 응답 스키마 호환

- 모든 endpoint 의 `jerseyNumber` 필드 키 그대로 유지 — Flutter 앱 코드 변경 0
- 값 의미만 "ttp 영구" → "매치 시점 (override → ttp → null)" 으로 자동 정확화
- override 없는 매치 (대다수) = 응답 변경 0 (ttp 폴백)

### N+1 회피 설계

- batch helper: `IN` 쿼리 1회로 매치 1건의 모든 override 조회
- multi helper: `IN × IN` 쿼리 1회로 시즌 전체 override 조회
- 미적용 endpoint 3종은 ttp 단일 SELECT 그대로 (영구 번호 의미 유지)

### tsc 결과

`npx tsc --noEmit` exit code = 0 (errors 0).

💡 tester 참고:
- **사전 조건**: PR4 의 `match_player_jersey` 테이블이 운영 DB 에 push 되어 있어야 prisma 에러 0 (PM 사용자 승인 후 db push 완료 필요)
- **테스트 시나리오** (override 없는 상태 = 회귀 0):
  1. `GET /api/v1/matches/[id]/stats` — 박스 스코어 jerseyNumber = ttp.jerseyNumber 그대로
  2. `GET /api/v1/matches/[id]/roster` — home/away jersey_number = ttp 그대로
  3. `GET /api/v1/tournaments/[id]/player-stats` — 시즌 통계 jerseyNumber = ttp 그대로
- **테스트 시나리오** (override 1건 등록 후 = 핵심 검증):
  1. `POST /api/web/tournaments/{tid}/matches/{matchId}/jersey-override` 으로 임시 번호 등록
  2. 위 3 endpoint 재호출 → **해당 매치 응답만** 임시 번호로 변경됨
  3. 같은 선수의 다른 매치 응답은 ttp 영구 번호 그대로
  4. `GET /api/v1/tournaments/[id]/teams/[teamId]/players` (미적용) → ttp 영구 번호 그대로 (회귀 0)
  5. `GET /api/v1/tournaments/[id]/full-data` (미적용) → ttp 영구 번호 그대로

⚠️ reviewer 참고:
- **team_members.jersey_number 폴백 미연결**: 본 PR 에서는 ttp.jerseyNumber 까지만 폴백 (team_members 추가 SELECT N+1 우려). PR3 자동 복사 hook 으로 ttp 가 비어있는 경우 0 가정 (실제 데이터 = 모든 ttp 에 jerseyNumber 채워져 있음). 향후 team_members 폴백 필요 시 helper 호출자가 별도 SELECT 후 `teamJersey` 인자에 넘기면 됨.
- **표시명 폴백 (`getDisplayName` 의 jerseyNumber 폴백)** = 매치 시점 결정값으로 통일 (운영자 임시 번호 부여 시 대체 표시 = `#임시번호`)
- **orderBy 는 ttp 그대로** (roster) — DB 정렬은 영구 번호 기준이고, 응답 표시값만 매치 시점. 운영자가 임시 번호로 정렬 변경 의도시 별도 작업 필요 (현재는 영구 정렬 = 안정성).
- **commit X / 운영 DB 영향 0** — schema 변경 0, SELECT 만 추가.

---

### 원영 공지 메시지 초안 (PM 이 보낼 통보 1단락)

> 원영아, mybdr Phase 1 PR5 적용했어. **이제부터 Flutter 앱 응답의 `jerseyNumber` 값은 매치 시점 정확값으로 자동 결정돼** (우선순위: 매치 운영자가 부여한 임시 번호 → 대회 등록 시점 ttp 번호). 적용된 endpoint = ① `/api/v1/matches/[id]/stats` (박스스코어) ② `/api/v1/matches/[id]/roster` (라이브 명단) ③ `/api/v1/tournaments/[id]/player-stats` (시즌 통계). **앱 코드 변경은 필요 없음** — 응답 스키마 (jerseyNumber 필드) 그대로고, 값 의미만 정확해진 거야. 영향 = 박스 스코어/시즌 통계/PBP 등 jersey 표시가 매치 단위로 정확해짐 (운영자가 W1 모달로 임시 번호 부여한 매치만 변경, 나머지 매치는 변화 0). 미적용 endpoint = 선수 커리어 통계 / 팀 선수 목록 / full-data 동기화 (이건 "영구 번호" 의미 유지가 맞아서 그대로 둠).

---

## 구현 기록 (PR4 — `match_player_jersey` 신설 + 라이브 W1 운영자 모달 + admin_logs)

📝 구현한 기능: 매치 한정 임시 jersey 번호 운영자 모달 (라이브 페이지 W1) + match_player_jersey 테이블 신설 + admin_logs warning 추적

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `prisma/schema.prisma` | MatchPlayerJersey 모델 추가 + User/TournamentMatch/TournamentTeamPlayer reverse relation 1줄씩 | 수정 |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/jersey-override/route.ts` | POST UPSERT + DELETE 해제 (운영자 검증 + 매치/ttp 소속 검증 + 충돌 검증 + admin_logs warning) | 신규 |
| `src/app/api/web/tournaments/[id]/admin-check/route.ts` | GET — 현재 로그인 유저 운영자 boolean (라이브 페이지 버튼 노출용 / 미로그인=false silent) | 신규 |
| `src/app/api/live/[id]/route.ts` | 응답에 tournamentId 추가 + match_player_jersey 후처리 (ttp.id → override jersey 매핑 / 진행중·종료 분기 별도) | 수정 |
| `src/app/live/[id]/_v2/match-jersey-override-modal.tsx` | 모달 컴포넌트 (선수 dropdown + jersey input + 사용 중 표시 + 사유 textarea + POST + onSuccess refetch) | 신규 |
| `src/app/live/[id]/page.tsx` | MatchData에 tournament_id + isAdmin/jerseyModalOpen state + admin-check fetch useEffect + 헤더 우측 PC/모바일 버튼 + 모달 마운트 | 수정 |

### Schema 변경 diff (PM 사전 검토 필요)

```prisma
model MatchPlayerJersey {
  id                     BigInt   @id @default(autoincrement())
  tournamentMatchId      BigInt   @map("tournament_match_id")  // BigInt (TournamentMatch.id 와 동일 — 지시서 String @db.Uuid 는 오기, schema 일관성)
  tournamentTeamPlayerId BigInt   @map("tournament_team_player_id")
  jerseyNumber           Int      @map("jersey_number")
  reason                 String?
  createdById            BigInt?  @map("created_by_id")
  createdAt              DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt              DateTime @updatedAt @map("updated_at") @db.Timestamp(6)

  tournamentMatch        TournamentMatch      @relation(fields: [tournamentMatchId], references: [id], onDelete: Cascade)
  tournamentTeamPlayer   TournamentTeamPlayer @relation(fields: [tournamentTeamPlayerId], references: [id], onDelete: Cascade)
  createdBy              User?                @relation("MatchPlayerJerseyCreator", fields: [createdById], references: [id], onDelete: SetNull)

  @@unique([tournamentMatchId, tournamentTeamPlayerId], map: "idx_match_player_jersey_unique_player")
  @@unique([tournamentMatchId, jerseyNumber], map: "idx_match_player_jersey_unique_number")
  @@index([tournamentMatchId])
  @@map("match_player_jersey")
}
```

⚠ 무중단 변경 (신규 테이블만 / 기존 컬럼 변경 0). PM 이 사용자 승인 후 `npx prisma db push` 진행 가능.

### admin_logs INSERT 사양

| 액션 | severity | description 형식 |
|------|----------|------------------|
| match_jersey_override (POST) | warning | `매치 [matchId] 선수 [name] jersey [#old]→#[new] 사유: [reason]` |
| match_jersey_override_release (DELETE) | warning | `매치 [matchId] 선수 [name] 임시 jersey #[N] 해제 사유: [reason]` |

resource_type = "match_player_jersey" / target_type = "match_player_jersey" / target_id = row.id / changes_made + previous_values JSON.

### 권한 검증 흐름

- **POST/DELETE jersey-override**: `requireTournamentAdmin(tournamentId)` (organizer or tournament_admin_members.is_active) — 캡틴/일반회원 차단.
- **GET admin-check**: 미로그인 = isAdmin:false silent (401 X). 로그인 = organizer + admin members 검증.
- **라이브 페이지 버튼**: admin-check 통과 시에만 노출 — 모바일/PC 분기 (PC = 아이콘+텍스트 / 모바일 = 아이콘만).

💡 tester 참고:
- **사전 조건**: PM이 prisma db push 진행 후 테스트 가능 (테이블 미생성 시 jersey-override POST = 500 prisma error / live API 후처리 = 500).
- **테스트 매트릭스**:
  1. 비로그인 라이브 페이지 → 헤더에 "임시 번호" 버튼 X (admin-check isAdmin:false silent)
  2. 일반회원 / 캡틴 / 일반 운영자 아닌 자 → 버튼 X (403 X / 단순 미노출)
  3. organizer 또는 tournament_admin_members.is_active=true → 버튼 노출 → 모달 진입
  4. 모달에서 home/away 선수 dropdown → 선수 선택 → 새 번호 0~99 → 사유 → 저장 → 라이브 페이지 jersey 즉시 갱신
  5. 같은 매치 다른 선수가 이미 사용 중 번호 입력 → 409 JERSEY_CONFLICT 메시지
  6. 같은 선수 다시 다른 번호 입력 → UPSERT (UPDATE) 정상 동작
  7. (선택) DELETE 호출 → 임시 번호 해제 → ttp.jerseyNumber 로 폴백
  8. admin_logs SELECT — match_jersey_override 또는 match_jersey_override_release row 있고 description 형식 맞음
- **회귀 체크**:
  - 라이브 API 응답 그대로 / 기존 jersey_number 표시 정상 (override 없는 매치는 변경 0)
  - 헤더 sticky / ThemeToggle / 다른 모달들 정상
  - 모바일 헤더 공간 (768px 이하) 유지
- **API 직접 호출 (curl)**:
  ```
  POST /api/web/tournaments/{tid}/matches/{matchId}/jersey-override
  body: { tournamentTeamPlayerId: 2540, jerseyNumber: 99, reason: "테스트" }
  ```

⚠️ reviewer 참고:
- **schema 일관성**: 지시서 `tournament_match_id String @db.Uuid` 는 오기 → `BigInt` 로 수정 (TournamentMatch.id BigInt + 다른 매치 FK 모두 BigInt 일관성). PM 검토 필수.
- **jersey 우선순위 후처리 위치**: 라이브 API 끝부분 한곳에서 home/awayPlayers 후처리. 진행중 vs 종료 분기 별도 매핑 (진행중 row.id=ttp.id / 종료 row.id=stat.id → statId→ttpId 보조 Map).
- **silent fail 정책**: admin-check API 실패 시 isAdmin:false 보수적 default. 라이브 페이지 자체는 계속 동작.
- **운영자 변경 이력**: createdById = 최초 등록자 보존 (UPDATE 시 갱신 안 함). 변경 이력 단일 source = admin_logs.
- **모달 라우팅**: home/away players 는 라이브 응답 (현재 jersey 표시) 그대로 전달. dropdown은 매치 시점 jersey (override 적용 후) 표시 → 운영자가 현재 상태 인지 가능.
- **tsc 0 errors 확인 완료** (`npx tsc --noEmit` exit 0).
- **prisma generate 진행 / db push 미진행** (PM 사용자 승인 필요).

---

<!-- ARCHIVED: 구현 기록 PR1+PR2+PR3 상세 박제 압축됨 (PM 토큰 효율 룰 적용 — 매 PR commit 후 작업 로그 1줄 통합). 복원: git log -- .claude/scratchpad.md -->

## (ARCHIVED) 구현 기록 PR1~PR3 상세 — git log 으로 복원 가능

압축 시점 = PR3 완료 후. PR1=ae4ffd7 / PR2=d72aa0a / PR3=PM commit hash. 상세 BEFORE/AFTER + tester/reviewer 메모는 git history 참조.

---
---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / PortOne / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 (1f8ee19) |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |
| 듀얼토너먼트 풀 시스템 | ✅ Phase A~F2 |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| **도메인 sub-agent (옵션 A)** | ✅ P1+P2+P3 완료 (C 채택 — live-expert 영구 / 신규 박제 0) |
| **매치 코드 v4** | ✅ Phase 1+2+3+4+5+7 (전 Phase 완료) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-05 | (PM 커밋 + db push 대기) | **Phase 3 PR10+PR11 — 팀 이적 양쪽 팀장 승인 state machine + UI 통합** — 12 파일 (신규 6 / 수정 6): TransferRequest 모델 신설 (양쪽 사이드 status + finalStatus + processedBy 양쪽 + 5 FK + 3 인덱스) / User 3 + Team 2 reverse relation / 알림 4종 추가 / POST/GET API (pending 1건 + member_request 동시 차단 + 현 팀장 알림) / PATCH state machine (사이드별 captain 검증 + ALREADY_PROCESSED/REJECTED + approve+approve 자동 이동 트리거 + 단일 트랜잭션 fromMember status='withdrawn' + toMember INSERT active jersey=NULL + history 2건 transferred_out/in) / captain 시야 GET endpoint (OR 양쪽 사이드 pending) / 이적 모달 (검색 debounce 250ms + 사유 200자) / MemberActionsMenu 4번째 메뉴 + transfer 우선 검사 / roster+page teamName 전달 / manage 변경요청 탭 하단 이적 섹션 (sideLabel 분기 + 상대 팀 진척도) / 마이페이지 TransferProgressCard 양쪽 사이드 뱃지. tsc 0 / schema 변경 = 1 모델 + 5 reverse relation / commit X / db push X. | ✅ |
| 2026-05-05 | (PM 커밋 대기) | **Phase 2 PR8+PR9 — 휴면+탈퇴 신청 dispatcher 활성화 + UI** — 9 파일 (신규 4 / 수정 5): dispatcher dormant/withdraw 활성화 (active row prev* 박제 + history payload 분기 3종 + status UPDATE 트랜잭션) / lazy 복구 helper 신설 (until < now → active 자동 + 'reactivated' history) / teams/[id] page + profile page 에 hook 호출 추가 / dormant-request-modal 신규 (until date 기본 +3개월 / 7일~12개월 / 사유 100자) / withdraw-request-modal 신규 (사유 5~200자 필수 + danger 경고 박스) / member-actions-menu 신규 (dropdown "내 액션 ▾" → 3 액션 통합 + clickOutside·Esc + pending 분기 라벨) / roster-tab-v2 status `['active','dormant']` 확장 + 휴면 뱃지(soft) + 카드 opacity 0.6 + JerseyChangeButton→MemberActionsMenu 교체 / manage 안내 문구 갱신. schema 변경 0 (status 컬럼 값만 추가) / tsc 0 / commit X / db push X. | ✅ |
| 2026-05-05 | (PM 커밋 대기) | **Phase 2 PR7 — 번호 변경 신청 흐름 활성화 (모달 + 팀장 승인 UI + dispatcher)** — 6 파일 (신규 2 / 수정 4): dispatcher jersey_change approve 활성화 (재충돌 검증 + team_members.jersey_number UPDATE + history INSERT eventType='jersey_changed' payload {old,new,reason} — 단일 트랜잭션) / jersey-change-request-modal 신규 (PR2 jerseys-in-use 재사용 + 새 번호 0~99 + 사유 100자) / jersey-change-button client wrapper 신규 (mount 시 ?status=pending GET 1회 → loading/none/jersey_change/other 분기 라벨) / roster-tab-v2 currentUserId prop + 본인 row Link 외부 div 마운트 / page.tsx session.sub 전달 / manage page.tsx ManageTab 'member-requests' 추가 + 변경 요청 탭 (type 별 분기 라벨/색상 + 사유 accent border + 데스크탑/모바일 액션 분기). PR7 = jersey_change 만 실제 작동 / dormant·withdraw 표시만 (PR8/PR9 후속). tsc 0 / 운영 DB 영향 0 / commit X. | ✅ |
| 2026-05-05 | (PM 커밋 + db push 대기) | **Phase 2 PR6 — team_member_requests 통합 + team_member_history 신설 + 신청/조회/승인거부 API + 알림 3종** — schema +2 모델 (Rails team_member_histories 와 명명 충돌 회피 단수 신설) + Team 2 + User 4 reverse relation. 신규 API 2개: POST/GET /api/web/teams/[id]/requests (zod discriminatedUnion type 별 payload + 미묘 룰 #1 ALREADY_PENDING 1건만 + jersey 충돌 사전 검증) + PATCH /api/web/teams/[id]/requests/[requestId] (approve/reject dispatcher placeholder TODO PR7~9 + 트랜잭션 status UPDATE + history INSERT + 신청자 알림). 권한 = captain + manager (Phase 4 PR12 위임 통합 예정). 알림 3종 추가 (TEAM_MEMBER_REQUEST_NEW/APPROVED/REJECTED). dispatcher 패턴 = approve 시 type 별 실제 변경은 placeholder TODO (PR7 jersey UPDATE / PR8 dormant / PR9 withdraw). tsc 0 / prisma generate ✅ / db push X / commit X. | ✅ |
| 2026-05-05 | (PM 커밋 + db push 대기) | **Phase 1 PR4 — match_player_jersey 신설 + 라이브 W1 운영자 모달 + admin_logs** — schema +1 모델 (BigInt fk 통일, 지시서 String @db.Uuid 오기 수정) + 3 reverse relation. 신규 API 2개 (jersey-override POST UPSERT/DELETE 해제 + admin-check GET boolean). 신규 컴포넌트 1개 (모달 = 선수 dropdown + 0~99 input + 사용 중 표시 + 사유 + onSuccess refetch). 라이브 API 응답에 tournamentId 추가 + ttp.id → override jersey 매핑 후처리 (진행중·종료 분기 별도 statId→ttpId Map). 라이브 페이지 헤더 우측 PC/모바일 운영자 버튼 + 모달 마운트. 권한 = 운영자만 (organizer + admin_members.is_active). admin_logs warning 2 액션 (match_jersey_override / _release). tsc 0 / prisma generate ✅ / db push X / commit X. | ✅ |
| 2026-05-05 | (PM 커밋 대기) | **Phase 1 PR3 — tournament join 자동 sync (옵션 C+UI 본질)** — 2 파일 수정: api/web/tournaments/[id]/join/route.ts (team_members 일괄 SELECT → memberMap → role 분기 검증 → ttp INSERT 자동 복사 / 사용 안 하는 data.players jersey 검증 제거 / UNIQUE 중복 체크 source 변경) + (web)/tournaments/[id]/join/page.tsx (로스터 stage 안내 박스 추가 + jersey/position input UI 제거 + POST body 미전송). 5/5 ef7e78e role 분기 룰 보존 (player 필수 / coach 선택). schema 변경 0 / Flutter `/api/v1/*` 변경 0 / tsc 0. 운영자/캡틴 jersey 직접 입력 진입점 X = single source = team_members. | ✅ |
| 2026-05-05 | (PM 커밋 대기) | **Phase 1 PR2 — 가입 폼 jersey input + 자동 복사 + 마이페이지 다중 팀** — 6 파일 (신규 2 / 수정 4): jerseys-in-use API 신설 / join API zod + 충돌 검증 + preferred_jersey_number 저장 / members PATCH approve 자동 복사 + 409 JERSEY_CONFLICT / team-join-button-v2 모달 (jersey input + 사용 중 표시) / TeamsListCard 신규 / profile/page.tsx SELECT 확장 + 카드 교체 + name_primary 매핑. tsc 0 / schema 변경 0 / 운영 DB 영향 0. | ✅ |
| 2026-05-05 | DB UPDATE 3건 + INSERT 1건 + UPDATE 1건 (코드 변경 0) | **열혈농구단 SEASON2 출전 명단 정비 4건** — (1) jersey UPDATE 3건: 쓰리포인트/백승훈 ttpId=2540 (18→39) / 몽키즈/이지환 ttpId=2583 (0→4) / 몽키즈/최원영 ttpId=2581 (10→20). (2) 이도균 #70 등록 옵션 2 트랜잭션: tournament_team_players INSERT ttpId=2830 (제주 리딤 ttId=231 / userId=3352 / role=player) + team_members.jersey_number NULL→70 UPDATE (memberId=2701). 매 건 사전 검증 (동명이인 0 / 충돌 0) → 사용자 명시 승인 → 사후 SELECT 재확인 PASS. 임시 스크립트 즉시 삭제. 운영 DB 정책 준수. | ✅ |
| 2026-05-05 | `7f26b6f` + `60e8468` + `61e9ab1` + `5fd1716` + `d8bba4a` + `eb015aa` → main `3f016c9` | **인증 흐름 전체 재설계 main 배포 — 로그인 hard reload + getAuthUser() 단일 헬퍼 + 쿠키 자동 cleanup** — `7f26b6f` 로그인 server action redirect → return success + window.location.href hard reload (SSR 새 쿠키 인지 보장). C1~C4 옵션 A+B-PR1: signup layout 가드 / me API 탈퇴 401→200 통일 / ProfileCtaCard 글로벌 fetcher 위임 / `src/lib/auth/get-auth-user.ts` 신규 (JWT verify + DB SELECT + status 분기 + 쿠키 자동 cleanup + React.cache dedup) + 4 layout (web/login/signup/profile) 위임. **사용자 검증 통과 — 탈퇴 회원 쿠키 본질 해결** (1회 진입 후 잘못된 쿠키 자동 제거). 회귀: 빈 본문 chunk 404 = 배포 직후 chunk 캐시 mismatch (강력 새로고침 안내, 일시적). tsc 0 / 운영 DB 영향 0 / scratchpad+architecture+conventions+errors+index 박제. | ✅ |
| 2026-05-05 | (조사 only / 코드 변경 0) | **인증/세션/쿠키 흐름 전체 조사 + 재설계 옵션 보고서** — `Dev/auth-flow-redesign-2026-05-05.md` 작성. 14건 fix 분류 (활성 13 / dead code 1 / 충돌 0 / 누락 1=signup 가드). 콘솔 401 ×2 = 탈퇴 회원 me API 의도 분기 + ProfileCtaCard 자체 fetcher 중복 호출 (글로벌 fetcher 우회). 옵션 A (0.5d 작은 변경) + 옵션 B (1.5~2d 전면 재설계 = `getAuthUser()` 단일 헬퍼 + 쿠키 자동 cleanup) 비교. 권장 = A 즉시 + B-PR1 후속. 사용자 옵션 선택 대기. | ✅ |
| 2026-05-05 | `fa5bd90` → main `76e4ca3` | **로그인 버튼 작동 안 함 본질 fix — /login layout 가드 status 검증 누락** — 본질: `(web)/login/layout.tsx` 의 `if (session) redirect("/")` 가 JWT 만 검증 → 탈퇴 회원 쿠키 7일 잔존 시 /login 진입 즉시 / 로 보내져 시도 자체 불가. (web)/layout.tsx status 검증 추가했지만 login/layout 누락 = 회귀. fix: DB user.status 검증 추가 — 정상 회원만 / redirect, 탈퇴/미존재 = login 노출. errors.md 박제 (회귀 방지 룰: 인증 가드 5개소 일괄 점검 + JWT 살아있음 ≠ 사용자 정상). 사용자 검증 = 쿠키 삭제 후 정상 → fix 후 쿠키 삭제 없이도 정상 예상. | ✅ |
| 2026-05-05 | (조사 only / 코드 변경 0) | **열혈농구단 SEASON2 전국최강전 PDF (5/5 6팀 69명) vs DB 비교 + 이도균 가입 검증** — 종합: PDF 69 / DB 73 / 매칭 67. PDF only 2명 (리딤 #70 이도균 / 펜타곤 #21 박성후). DB only 6명 (5/5 미출전 = 그대로 유지). 이도균 = users id=3352 (5/3 가입) + 제주 리딤 멤버 active + 가입신청 approved 확인 → tournament_team_players 만 누락. 박성후 = users 0건 (완전 미가입, 내일 처리). 이도균 INSERT 스크립트 작성 완료 (사전 검증 + 사후 검증), 사용자 명시 승인 대기. | ✅ |
| 2026-05-05 | (PM 정리 / 코드 변경 0) | **onboarding 10단계 시스템 설계 합의 — 옵션 B (선호값 6종, DB 영향 0)** — 사용자 정책 합의: 첫 로그인 필수 3단계 + 자율 7단계 + 100점 게이미피케이션. 1 본인인증 (IdentityVerifyButton 재사용) / 2 활동환경 (17시도 + 게임유형 6종) / 3 출전정보 / 4 팀 / 5 사진 / 6 자기소개+SNS / 7 스타일 / 8 테마/표시 (신규) / 9 맞춤보기 (settings/feed PreferenceForm 흡수) / 10 알림. 6종 = `street-ball`(길농) + 기존 5종. 분기 룰 = 길농 단독 → 3,4 선택 / 그 외 → 필수. 옵션 A (game.game_type 마이그레이션 56파일+DB 영향) 보류. PR1~5 분해 (~5.5d). decisions/conventions/lessons +6 항목 박제. 다음 세션 PR1 진입 (또는 PR5 가시 효과 우선). | ✅ |
| 2026-05-05 | `ef7e78e` → main | **선수 배번 필수 정책 + role 분기 (3 API + admin/users 모달)** — 정책: player 배번 필수 / coach·captain 선택. join API zod 통과 후 누락 선수 닉네임 나열 + 422 / admin players API role==="player" + jersey null 차단 / Flutter v1 변경 0 (이미 required). admin/users 모달 TournamentRow role 분기 (player+누락 빨간 ⚠ / coach+누락 회색 — / 대회명 우측 role 라벨). 점검: 출전 339명 중 11명 누락 = player 7 (진짜) + coach 4 (정상). decisions+1 / conventions+1. | ✅ |
| 2026-05-05 | `06d1376` + `8c95565` 묶임 → main | **admin/users 강화 — 모달 4섹션 + 인라인 편집 12→3필드 PIPA + 배번 인라인 수정** — Phase A (4섹션): 소속팀 / 토너먼트 참가 / 활동 통계 / 구독 + 농구정보 2행 (선출/기본 등번호). Phase 1 (인라인 편집) → 12필드 → 3필드 축소 (PIPA 본인정정권). 변경 가능 = nickname/bio/is_elite + 사유 5자 이상 필수 + admin_logs warning. updateTournamentPlayerJerseyAction 신설 (배번 인라인 수정 + 동일 팀 unique 사전 검증). 사용자 commit (auth fix 류) 와 묶임 — lessons "다중 동시 commit 묶임 함정" 박제. | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 세션 + 5/5 auth 4건 묶임 홈/SWR/hydration fix + 5/5 auth 6건 묶임 탈퇴/가입/세션 가드 + 듀얼 P3~P7 + Step 2 활성화 + 듀얼 표준화 + 도메인 sub-agent P3 + 매치 코드 v4 Phase 1~7 + 5/5 58af36a 트리 카드 시간 표시) — 5/5 인증 재설계 옵션 A+B-PR1 prepend / 복원: git log -- .claude/scratchpad.md -->
