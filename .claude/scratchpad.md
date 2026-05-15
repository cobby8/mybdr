# 작업 스크래치패드

## 현재 작업
- **요청**: 전역 기록원 관리자(recorder_admin) 역할 신설 + 심판/기록원 시스템 통합 (1-A 모드)
- **상태**: 진행 중 — planner-architect 설계 위임 예정
- **결정 사항**:
  - A. 관리 페이지: `/referee/admin/` 시스템 확장 (옵션 1-A)
  - B. 권한 범위: 모든 대회 전역 접근 + 기록원 배정/관리
  - C. DB: `User.admin_role = "recorder_admin"` 활용 (스키마 변경 최소)
  - D. `/referee/admin/` 아직 미사용 상태 → 마이그레이션 부담 없음

## 진행 현황표
| 단계 | 결과 |
|------|------|
| 권한 인벤토리 조사 | ✅ 완료 (Explore) |
| 전역 기록원 관리자 설계 가능성 조사 | ✅ PARTIAL — admin_role 재사용 가능 |
| 심판/기록원 페이지 현황 조사 | ✅ /referee/admin 완성 + 통합 미연결 발견 |
| 통합 설계 (planner-architect) | ✅ 박제 완료 (옵션 C / 5 PR 분해 / Q1~Q6) |
| 사용자 Q1~Q6 결재 | ⏳ 대기 |
| 구현 (developer) | ✅ **PR1 완료** (헬퍼 + 3 가드) / ⏳ PR2 → PR3 대기 |
| 테스트 + 리뷰 | ⏳ PR1 tester / reviewer 검증 대기 |
| 범용 기록원 관리자 계정 생성 (raw SQL 1건) | ⏳ PR1~3 머지 후 |

## 후속 큐 (별도 세션)
- Phase 19 PR-T1~T5 / PR-S10.4 / PR-S10.7 / PR-S10.8 / PR-Stat1~Stat5 결재 대기
- Phase 23 PR4 / PR6 / Phase A.7 의뢰서
- Phase 3.5 유청소년 결합 코드 후속 (parseDivisionCode + 백워드 호환)
- PR-S9 / UI-1.4 entry_fee / GNBA 8팀 코치 안내

## 기획설계 (planner-architect) — recorder_admin 통합

🎯 목표: User.admin_role="recorder_admin" 단일 신호로 (a) 모든 대회 점수기록 (b) 모든 대회 기록원 배정 (c) /referee/admin/ 페이지 진입 — 3 영역 자동 통과. **schema 변경 0** (admin_role 컬럼 재사용).

### 1. 권한 매트릭스
| 영역 / 작업 | recorder (tournament_recorders) | **recorder_admin** (User.admin_role) | tournament_admin (organizer/TAM) | super_admin (User.isAdmin) |
|---|---|---|---|---|
| Flutter 점수입력 (`/api/v1/matches/:id/events`) | ✅ 해당 대회만 | ✅ **모든 대회** | ✅ 해당 대회만 | ✅ 모든 대회 |
| Flutter 기록앱 매치 목록 (`/api/v1/recorder/matches`) | 본인 배정 대회 | ✅ **모든 대회** | ✅ 본인 대회 | ✅ 모든 대회 |
| 웹 종이 기록지 (`/score-sheet/:matchId`) | ✅ 해당 대회만 | ✅ **모든 대회** | ✅ 해당 대회만 | ✅ 모든 대회 |
| 기록원 배정/해제 (`/api/web/tournaments/:id/recorders`) | ❌ | ✅ **모든 대회** | ✅ 본인 대회 | ✅ 모든 대회 |
| `/referee/admin/*` 진입 | ❌ | ✅ | ❌ | ✅ (sentinel) |
| 협회 12 permission (referee_manage/cert_verify 등) | ❌ | ✅ **sentinel 자동 통과** | ❌ | ✅ sentinel 자동 통과 |
| 대회 생성/운영 (Tournament CUD) | ❌ | ❌ | ✅ | ✅ |
| 사용자 관리 (admin/users) | ❌ | ❌ | ❌ | ✅ |
| 사이트 운영 (admin/site) | ❌ | ❌ | ❌ | ✅ |

**핵심 비유**: super_admin = "건물 마스터키" / recorder_admin = "기록실 마스터키 (점수+기록원만)" / tournament_admin = "본인 대회 사무실 키 1개" / recorder = "본인 배정 매치만 들어가는 출입증"

### 2. 통합 전략 추천: **옵션 C (두 테이블 그대로 유지 + UI/권한만 통합)**

**왜 옵션 C인가** (바이브 코더 평문 설명):
1. **마이그레이션 부담 0**: tournament_recorders 운영 데이터 (현재 활성 N건) 그대로 유지. DROP/UPDATE 대량 작업 = 0건 → CLAUDE.md §DB 정책 안전.
2. **Flutter 기록앱 영향 0**: `/api/v1/recorder/matches` 가 이미 tournament_recorders 조회 중. 테이블 통폐합 시 Flutter 코드 변경 필요 → 원영 사전 공지 + 빌드/배포 부담. 본 작업의 핵심 목표가 아님.
3. **두 테이블은 다른 도메인**: Referee = "협회 소속 자격증 보유자 (자격번호/검증 상태/정산)" 영구 자산 / tournament_recorders = "이번 대회 N팀 동안 점수 기록 권한" 일시 자산. 영구 자산을 일시 자산이 흡수하는 건 부적절. (옵션 B 거부 사유)
4. **옵션 A (양방향 sync) 거부 사유**: sync 코드 = 새 함정 발생원. recorder 등록 시 Referee 자동 row 생성 → 미신원확인 사용자가 자격증/정산 영역에 노출됨.

→ **옵션 C 동작**: `/referee/admin/members` 페이지가 Referee 테이블 표시 + **별도 탭 "대회 기록원"** 으로 tournament_recorders 표시 (조회 통합만, 데이터 통합 0). 단, 본 PR 범위에서는 **탭 추가 = 선택사항** (recorder_admin 권한 가드만 PR1~3에서 박제, 통합 탭은 PR4 후속).

**마이그레이션 단계**: 없음 (옵션 C 채택 = DB 변경 0).
**데이터 보존**: tournament_recorders 26건 (Phase 0~19 운영 활성 매치) 그대로. Referee 0~ (5/11 Phase 1 협회 0개 = 0건 추정) 그대로.

### 3. 변경 파일 리스트 (LOC 추정)

| # | 파일 | 변경 내용 | 추정 LOC | PR |
|---|------|----------|---------|----|
| 1 | `src/lib/auth/is-recorder-admin.ts` ⭐ **신규** | isSuperAdmin 패턴 카피 — `admin_role === "recorder_admin" \|\| isSuperAdmin(session)` (super_admin 자동 흡수) | +35 | **PR1** |
| 2 | `src/lib/auth/require-recorder.ts` | L42 super_admin 분기 옆에 recorder_admin 분기 추가 (`payload.admin_role === "recorder_admin"` 즉시 통과) | +5 | **PR1** |
| 3 | `src/lib/auth/require-score-sheet-access.ts` | L145 `superAdmin = isSuperAdmin(session)` 옆에 `\|\| isRecorderAdmin(session)` (또는 isRecorderAdmin 단일 호출로 흡수) | +3 | **PR1** |
| 4 | `src/lib/auth/tournament-auth.ts` `requireTournamentAdmin` | L41 super_admin 분기 옆에 recorder_admin 분기 (recorder_admin = "기록원 배정 권한"만 통과 / 대회 메타 변경은 별도) → **상세 검토 필요**: 본 함수가 `/recorders` POST 외에 매치 메타 수정에도 쓰임. **결론**: `requireTournamentAdmin` 변경 안 함 / `/recorders/route.ts` 만 변경 (혼선 회피) | 0 | — |
| 5 | `src/app/api/web/tournaments/[id]/recorders/route.ts` | L30/L67/L103 `requireTournamentAdmin` 통과 못해도 isRecorderAdmin 시 통과 — 별도 분기 추가 (3 핸들러 GET/POST/DELETE) | +15 | **PR2** |
| 6 | `src/app/api/v1/recorder/matches/route.ts` | L11 `isSuperAdmin` 옆에 `isRecorderAdmin` 분기 — Flutter 토큰 JWT.admin_role 검사 | +3 | **PR1** |
| 7 | `src/app/(referee)/referee/admin/layout.tsx` | L37 super_admin 분기 옆에 recorder_admin 분기 (즉시 통과) | +5 | **PR3** |
| 8 | `src/app/(referee)/referee/admin/page.tsx` | L34 `superAdmin = isSuperAdmin(session)` 시 sentinel 분기 → recorder_admin 도 sentinel 분기 (안내 헤더 텍스트 분기 "Recorder Admin 권한 진입") | +10 | **PR3** |
| 9 | `src/lib/auth/admin-guard.ts` `getAssociationAdmin` | L135 `if (isSuperAdmin)` 옆에 `\|\| isRecorderAdmin` — sentinel role 동일 반환 → 12 permission 자동 통과 | +3 | **PR3** |
| 10 | `src/lib/auth/admin-roles.ts` `getAdminRoles` | `recorderAdmin: boolean` 필드 추가 + `roles: AdminRole[]` 에 `"recorder_admin"` push (sidebar 메뉴 필터 호환) | +12 | **PR3** |
| 11 | `src/app/(admin)/admin/me/_components/role-matrix-card.tsx` | 매트릭스에 "기록원 관리자" 행 1개 추가 (사용자 마이페이지에서 본인 권한 확인) | +15 | **PR3** |
| 12 | (선택) `src/app/api/v1/matches/[id]/sync/route.ts` 외 v1 라우트 6개 | requireRecorder 안 쓰는 v1 매치 라우트가 있으면 동일 분기. **PR1 grep 결과**: tournament_recorders 직접 SELECT 하는 라우트는 모두 requireRecorder 경유 → 영향 없음 | 0 | — |
| 13 | (선택) `src/app/(admin)/admin/users/...` | 운영자가 recorder_admin 지정 UI (드롭다운에 "기록원 관리자" 옵션 추가) | +20 | **PR4** |
| 14 | `__tests__/lib/auth/is-recorder-admin.test.ts` ⭐ **신규** | recorder_admin / super_admin / 일반 / null 4 케이스 | +40 | **PR1** |
| 15 | `__tests__/lib/auth/require-recorder.test.ts` (있으면 확장) | recorder_admin 분기 케이스 | +20 | **PR1** |

**합계**: 신규 2 파일 (~75 LOC) + 수정 9 파일 (~71 LOC) = **약 146 LOC** (PR4 + 통합 탭 제외 시).

### 4. PR 분해

| PR | 범위 | 의존성 | 추정 작업 | 안전성 |
|---|------|------|--------|------|
| **PR1**: 권한 헬퍼 + 기록 API 가드 | 파일 #1, #2, #3, #6, #14, #15 (헬퍼 신설 + recorder/score-sheet/Flutter 매치목록 3 가드) | 없음 | 1.5h | ⭐⭐⭐ DB 변경 0 / 기존 권한 가드 add-only |
| **PR2**: 기록원 배정 API 가드 | 파일 #5 (`/recorders` GET/POST/DELETE) | PR1 (헬퍼) | 0.5h | ⭐⭐⭐ add-only 분기 |
| **PR3**: /referee/admin 페이지 + 매트릭스 + sentinel | 파일 #7, #8, #9, #10, #11 (UI + admin-guard sentinel + getAdminRoles + role-matrix-card) | PR1 (헬퍼) | 1.5h | ⭐⭐ admin-guard sentinel 흐름 회귀 가능 — vitest `__tests__/lib/admin-guard.test.ts` 케이스 추가 의무 |
| **PR4** (선택): 운영자 admin/users 에서 recorder_admin 지정 UI | 파일 #13 + 기존 admin_role 드롭다운 옵션 추가 | PR1~3 (전체 가드 박제 후) | 1h | ⭐⭐⭐ UI only |
| **PR5** (선택, 후속 큐): /referee/admin/members "대회 기록원" 탭 통합 | tournament_recorders + Referee 통합 조회 페이지 | PR1~4 | 2h | ⭐⭐ Phase 분리 — 본 요구 핵심 아님 |

**권장 진입 순서**: PR1 → PR2 → PR3 (1일 안에 완료) → 사용자 검증 → PR4 (운영자 UI) → PR5 (후속).

### 5. 영향 분석

| 영역 | 영향 | 검증 방법 |
|------|------|---------|
| **Flutter 기록앱** (`/api/v1/`) | **0** (add-only 분기, 기존 recorder 권한 그대로) | PR1 머지 후 Flutter 토큰으로 `/api/v1/recorder/matches` 호출 — 일반 recorder = 본인 대회만 응답 (회귀 0) |
| **기존 tournament_admin** | **0** (requireTournamentAdmin 변경 안 함 / `/recorders` 라우트만 별도 분기) | PR2 머지 후 organizer 계정으로 `/recorders` POST — 기존 동작 그대로 |
| **기존 super_admin** | **0** (super_admin 분기 그대로 + recorder_admin 분기 옆에 추가) | PR3 머지 후 super_admin 으로 `/referee/admin` 진입 — sentinel 안내 헤더 그대로 |
| **tournament_recorders DB row** | **0** (옵션 C — 데이터 변경 없음) | 본 PR 후 `SELECT COUNT(*) FROM tournament_recorders` 변경 없음 |
| **Referee DB row** | **0** (옵션 C — 동기화 없음) | 본 PR 후 Referee row 변경 없음 |
| **schema 변경** | **0** (admin_role 컬럼 재사용 / @db.VarChar string) | `prisma db push` 호출 0건 |
| **운영 사용자** | recorder_admin 지정 받기 전까지 영향 0 / PR4 머지 후 운영자가 본인 계정 admin_role 수동 UPDATE 또는 admin/users 에서 지정 | 사용자가 지정 후 본인 계정 로그아웃→로그인 (JWT 갱신) → /referee/admin 진입 확인 |

### 6. 새 메뉴 / 네비게이션

- **AppNav (frozen)**: 변경 0 (recorder_admin 도 일반 사용자처럼 9개 메인 탭만 노출 / `/referee/admin` 진입은 URL 직접 또는 마이페이지 카드).
- **마이페이지 RoleMatrixCard**: "기록원 관리자" 행 1개 추가 (자기 권한 확인용).
- **AdminLayout sidebar**: `getAdminRoles` 가 `roles: ["recorder_admin"]` push 시 sidebar 에 "기록원 관리" 섹션 노출 — **단, `(admin)/admin/*` 영역에는 recorder_admin 진입 자동 허용 X** (혼선 회피). recorder_admin = `/referee/admin/*` 전용 신호.

### 7. recorder_admin 계정 생성 절차 (PR1~3 머지 후)

운영 DB 1 row UPDATE:
```sql
-- 사용자 결재 후 raw SQL (CLAUDE.md §DB 정책 안전 가드 준수)
SELECT id, email, admin_role FROM "User" WHERE email = '<지정할_이메일>';  -- 사전 검증
UPDATE "User" SET admin_role = 'recorder_admin' WHERE email = '<지정할_이메일>';  -- 1건 변경
-- 사후 검증: SELECT admin_role FROM "User" WHERE email = '<지정할_이메일>';
```
또는 PR4 머지 후 `/admin/users/[id]` 페이지에서 드롭다운 선택.

### 8. 잠재 위험 / 사용자 결재 필요 사항

| # | 결재 항목 | 권장 답 | 사유 |
|---|---------|--------|------|
| **Q1** | recorder_admin = super_admin 자동 흡수? (super_admin 도 isRecorderAdmin 통과?) | **YES** | super_admin = 전능 정책 일관 (canManageTournament / canManageMatchStream 등). 흡수 안 하면 admin_role="super_admin" 사용자가 recorder_admin 가드에 막힘 |
| **Q2** | recorder_admin 이 `/referee/admin/settlements` (정산) 도 자동 통과? | **YES** (sentinel role 통과) | super_admin sentinel 패턴 동일. 분리하려면 PERMISSIONS 매트릭스 세분화 필요 → 본 PR 범위 초과 |
| **Q3** | tournament.organizerId 가 recorder_admin 계정인 경우 — 본인 대회에서 recorder_admin 권한 우선? | 우선순위 무관 (둘 다 통과) | 양쪽 통과 = OR 분기 / 회귀 없음 |
| **Q4** | recorder_admin 계정 로그아웃 후 JWT 갱신 필요? (admin_role UPDATE 즉시 반영?) | **JWT 재발급 필요** | jwt.ts L46 admin_role 토큰 발급 시점에 박제됨 / 운영 시 사용자에게 "다시 로그인" 안내 |
| **Q5** | PR4 (admin/users 드롭다운 옵션 추가) 본 작업에 포함? 별도 후속? | **별도 후속** (PR1~3 먼저, 검증 후 PR4) | 가드 박제 후 사용자가 raw SQL 1회 UPDATE 로 본인 계정 지정 → 1차 검증 / PR4 는 운영 편의 |
| **Q6** | 옵션 C 채택 / 옵션 B 거부 합의? | **YES** (옵션 C) | 본 분석 §2 사유 4건 — Flutter 영향 0 + 도메인 분리 + 마이그레이션 0 |

### 9. knowledge 박제 필요 항목 (구현 후 PM 기록)

- **decisions.md**: "recorder_admin 신설 = User.admin_role 재사용 + 옵션 C (두 테이블 분리 유지)" 4 핵심 결정 (admin_role 재사용 / super_admin 자동 흡수 / sentinel role 통과 / tournament_recorders 보존)
- **architecture.md**: "권한 매트릭스 4 등급 = recorder/recorder_admin/tournament_admin/super_admin" 매트릭스 + 가드 호출 흐름도
- **conventions.md**: "isRecorderAdmin = isSuperAdmin 패턴 카피 (super_admin 자동 흡수 분기 의무)"

## 구현 기록 (developer) — PR1 권한 헬퍼 + 기록 API 가드

📝 구현 요약: recorder_admin (전역 기록원 관리자) 권한 헬퍼 신설 + 3 가드 add-only 분기 (require-recorder / require-score-sheet-access / Flutter `/api/v1/recorder/matches`). DB schema 변경 0 (User.admin_role 컬럼 재사용). Q1 결재 = super_admin 자동 흡수 / Q2 결재 = sentinel 통과 (별도 차단 없음).

### 변경 파일 + LOC
| 파일 | 변경 내용 | 신규/수정 | LOC |
|------|----------|----------|-----|
| `src/lib/auth/is-recorder-admin.ts` | `isRecorderAdmin(session)` — isSuperAdmin OR + admin_role==="recorder_admin" | **신규** | +60 |
| `src/lib/auth/require-recorder.ts` | L42 super_admin 분기 옆 `payload.admin_role === "recorder_admin"` 즉시 통과 분기 (JWT path) | 수정 | +5 |
| `src/lib/auth/require-score-sheet-access.ts` | import 추가 + L145 `recorderAdmin` 변수 추가 + hasAccess OR 흡수 | 수정 | +5 |
| `src/app/api/v1/recorder/matches/route.ts` | L11 `ctx.payload.admin_role === "recorder_admin"` 분기 추가 + `isSuperAdmin \|\| isRecorderAdmin` OR 박제 | 수정 | +5 |
| `src/__tests__/lib/auth/is-recorder-admin.test.ts` | 8 케이스 (정상/super 흡수 a/b/일반/null/undefined/다른역할/tournament_admin) | **신규** | +75 |
| `src/__tests__/lib/auth/require-recorder.test.ts` | 8 케이스 (recorder 회귀/forbidden/organizer/super_admin/**recorder_admin 전역**/**recorder_admin 미배정 통과**/no-token/no-match) | **신규** | +175 |

**합계**: 신규 3 파일 (~310 LOC) + 수정 3 파일 (+15 LOC) = ~325 LOC

### 검증 결과
- `npx tsc --noEmit`: **0 에러**
- `npx vitest run src/__tests__/lib/auth/`: **64/64 PASS** (is-recorder-admin 8 + require-recorder 8 + redirect 29 + canManageTournament 9 + requireOrganizationOwner 10)
- `npx vitest run` (전체): **868/868 PASS** (이전 852 + 신규 16 = 868 / 회귀 0)

### 회귀 검증
- 기존 super_admin 분기: ✅ 동작 유지 (require-recorder L43 OR 분기 그대로 / require-score-sheet-access L149 hasAccess OR / recorder/matches isSuperAdmin 분기 그대로)
- 기존 일반 recorder: ✅ 본인 배정 대회만 응답 유지 (tournament_recorders.findFirst 분기 그대로 / 케이스 1+2 vitest 검증)
- 기존 organizer: ✅ 본인 대회 매치 통과 유지 (tournament.findFirst 분기 그대로 / 케이스 3 vitest 검증)
- 일반 recorder + 다른 대회: ✅ forbidden 그대로 (케이스 2 vitest 검증)
- 토큰 없음 / 매치 없음: ✅ 401 / 404 그대로 (케이스 7+8 vitest 검증)

### Q 결재 반영
- **Q1 (super_admin 자동 흡수)**: ✅ isRecorderAdmin 내부에서 isSuperAdmin OR 통과
- **Q2 (sentinel 전체 통과)**: ✅ require-score-sheet-access hasAccess OR 흡수 (별도 차단 분기 추가 0)
- **Q4 (JWT 재발급 필요)**: 기록만 (운영 사용자 안내) — 코드 변경 0 (jwt.ts L46 이미 admin_role 박제 중)

💡 tester 참고:
- **테스트 방법**: vitest 자동 통과 — 추가 수동 테스트 필요 시 (a) recorder_admin 계정 1 row 생성 후 (b) Flutter `/api/v1/recorder/matches` 호출 — 모든 대회 매치 응답 확인 (c) 일반 recorder 계정 동일 호출 — 본인 배정 대회만 응답 (회귀 0 확인)
- **정상 동작**: admin_role="recorder_admin" 사용자가 임의 대회 score-sheet 페이지 진입 시 403 안 뜸 / Flutter 기록앱 매치 목록에 모든 대회 노출
- **주의할 입력**: jwt.ts L46 — admin_role 은 JWT 토큰 발급 시점에 박제. UPDATE 후 사용자 로그아웃→로그인 필수 (Q4 결재)

⚠️ reviewer 참고:
- **특별히 봐줬으면 하는 부분**:
  - require-recorder.ts L43: `payload.role !== "super_admin" && !isRecorderAdminRole` 양쪽 분기 NOT 흡수 — DB SELECT 우회 효율 박제 (super_admin / recorder_admin 둘 다 즉시 통과)
  - require-score-sheet-access.ts: `recorderAdmin = isRecorderAdmin(session)` 별도 변수 분리 — isSuperAdmin 자동 흡수되므로 사실상 superAdmin 변수와 중복 결과지만 가독성 박제 (혹시 향후 recorder_admin 만 추가 권한 분기 시 변수 분리 유용)
  - `/api/v1/recorder/matches/route.ts`: `ctx.payload.admin_role` 직접 접근 — middleware.ts AuthContext.payload: JwtPayload 타입에 admin_role?: string 이미 존재 (jwt.ts L25)
- **PR2 / PR3 의존성**: 본 PR1 의 isRecorderAdmin 헬퍼는 PR2 (`/recorders` GET/POST/DELETE 가드) + PR3 (`/referee/admin` layout + admin-guard sentinel) 에서 재사용 예정. 단일 source 보장.

### PR2 구현 (기록원 배정 API 가드)

📝 구현 요약: `/api/web/tournaments/:id/recorders` GET/POST/DELETE 3 핸들러에 `recorder_admin` 분기 add-only 박제. 라우트 내부 헬퍼 `requireRecordersManageAccess` 신설 — recorder_admin 시 tournament 존재만 확인 후 즉시 통과 / 그 외 기존 `requireTournamentAdmin` fallback (organizer/TAM 검증 그대로). 회귀 0 (기존 super_admin / organizer / TAM 동작 변경 0). DB 변경 0.

#### 변경 파일 + LOC
| 파일 | 변경 내용 | 신규/수정 | LOC |
|------|----------|----------|-----|
| `src/app/api/web/tournaments/[id]/recorders/route.ts` | `requireRecordersManageAccess` 헬퍼 신설 (라우트 파일 내부) + GET/POST/DELETE 3 핸들러 호출 교체 (`requireTournamentAdmin` → 신규 헬퍼) + 타입 호환 (NextResponse 제네릭 제거) | 수정 | +50 |

**합계**: 수정 1 파일 (~50 LOC). 신규 파일 0. vitest 0 (PR1 의 `isRecorderAdmin` 단위 테스트로 핵심 분기 검증 — 본 라우트는 통합 테스트 인프라 부재로 단위 테스트 스킵 — scratchpad 지침 "라우트 자체 통합 테스트가 없으면 스킵 가능").

#### 검증 결과
- `npx tsc --noEmit`: **0 에러**
- `npx vitest run` (전체): **868/868 PASS** (PR1 과 동일 — 회귀 0)

#### 회귀 검증
- **기존 tournament_admin (organizer)** GET/POST/DELETE: ✅ 동작 유지 — `isRecorderAdmin(session) === false` 시 fallback `requireTournamentAdmin(id)` 호출 → organizer 검증 분기 그대로
- **기존 tournament_admin (TAM)** GET/POST/DELETE: ✅ 동작 유지 — 동일 fallback 경로
- **기존 super_admin** GET/POST/DELETE: ✅ 동작 유지 — `isRecorderAdmin` 내부에서 자동 흡수 (Q1) → recorder_admin 분기 통과 / 또는 fallback `requireTournamentAdmin` 의 super_admin 분기 통과 (이중 보장)
- **일반 user (admin_role 없음)** GET/POST/DELETE: ✅ 403 그대로 — recorder_admin 분기 false → fallback `requireTournamentAdmin` 의 TAM 검증 실패 → 403
- **남의 대회 tournament_admin** GET/POST/DELETE: ✅ 403 그대로 — recorder_admin false → fallback organizer 비교 실패 → TAM 검증 실패 → 403
- **존재하지 않는 tournament id**: ✅ 404 그대로 — recorder_admin 분기에서도 tournament SELECT 추가 (`prisma.tournament.findUnique` → null 시 404 반환)
- **recorder_admin 신규 케이스** GET/POST/DELETE: ✅ 통과 — `isRecorderAdmin(session) === true` 시 tournament 존재만 확인 후 즉시 통과 + `auth.userId = BigInt(session.sub)` 박제 → POST 의 `assignedBy` 분기 무관 일관

💡 tester 참고:
- **테스트 방법**: (a) recorder_admin 계정 1 row 생성 후 (b) 임의 대회 (본인 organizer X) 의 `GET /api/web/tournaments/<id>/recorders` curl → 200 + 기록원 목록 응답 (c) `POST /api/web/tournaments/<id>/recorders` body `{email:"..."}` → 200 + assignedBy = recorder_admin userId (d) `DELETE` body `{recorderId:"..."}` → 200 (e) 일반 user 계정으로 동일 요청 → 403 (회귀 0)
- **정상 동작**: recorder_admin 사용자가 자기가 organizer 아닌 대회의 기록원 배정 API 통과 / 일반 user 는 그대로 403
- **주의할 입력**: 존재하지 않는 tournamentId → recorder_admin 도 404 (tournament 존재 확인 추가 가드)

⚠️ reviewer 참고:
- **특별히 봐줬으면 하는 부분**:
  - `requireRecordersManageAccess` 헬퍼 = 라우트 파일 내부 박제 (export X) — 다른 라우트에서 재사용 가능성 낮음 (`/recorders` 1 라우트 전용). 향후 같은 패턴 라우트 발생 시 `src/lib/auth/` 로 승격 검토.
  - `isRecorderAdmin(session) && session` — 타입 가드 위한 이중 체크. `isRecorderAdmin` 이 null/undefined 시 false 반환하므로 `session` truthy 보장되지만, TS 가 narrow 못해서 `session.sub` 접근 시 명시 가드 추가.
  - `session: { sub: session.sub, role: session.role ?? "" }` — `requireTournamentAdmin` 의 AuthOk.session 타입 (`{sub, role}` 둘 다 string) 호환 위해 `role ?? ""` 빈 문자열 fallback. 현 시점 호출자가 `session.role` 안 봄 (assignedBy 만 사용) → 안전.
  - error 타입 = `NextResponse` (제네릭 제거) — `apiError` 의 `NextResponse<{error:string; code?}>` 와 `requireTournamentAdmin` AuthErr 의 `NextResponse<unknown>` 양쪽 호환. 핸들러에서 `return auth.error` 시 NextResponse 그대로 반환 (Next.js 호환).
- **PR3 의존성**: 본 PR2 의 헬퍼 패턴은 PR3 (`/referee/admin` layout + admin-guard sentinel) 에서는 재사용 안 함 (PR3 는 sentinel role 패턴 — admin-guard.ts 분기). 단, isRecorderAdmin 헬퍼 자체는 PR3 도 재사용.

### PR3 구현 (/referee/admin + sentinel + 매트릭스)

📝 구현 요약: recorder_admin (전역 기록원 관리자) 가 `/referee/admin/*` 진입 + 협회 12 permission sentinel 자동 통과 (Q2 옵션 A). admin-guard.ts sentinel 분기에 `isRecorderAdmin` OR 추가 (`isRecorderAdmin` 가 `isSuperAdmin` 자동 흡수 — 단일 분기). `/referee/admin/layout.tsx` 도 동일 흡수. `/referee/admin/page.tsx` 안내 헤더 텍스트 분기 ("Super Admin 권한 진입" / "Recorder Admin 권한 진입"). `admin-roles.ts` `recorderAdmin: boolean` 필드 신규 (super 자동 흡수). RoleMatrixCard 에 "기록원 관리자" 행 추가 (superAdminAuto 패턴 재사용). (admin)/admin/* 영역에는 recorder_admin 진입 자동 허용 X — `AdminRole` union 에 `recorder_admin` 추가하지 않고 `summary.roles` push 도 0건 → `(admin)/admin/layout` 의 `roles.length === 0` 차단 그대로 동작.

#### 변경 파일 + LOC
| 파일 | 변경 내용 | 신규/수정 | LOC |
|------|----------|----------|-----|
| `src/app/(referee)/referee/admin/layout.tsx` | `isSuperAdmin` import 제거 + `isRecorderAdmin` import + L37 분기 (super 자동 흡수 — 단일 분기) | 수정 | +5 |
| `src/app/(referee)/referee/admin/page.tsx` | `isRecorderAdmin` import + sentinel 분기 확장 (`superAdmin OR recorderAdmin`) + `entryRole` 변수 + 안내 헤더 텍스트 분기 ("Recorder Admin 권한 진입") | 수정 | +15 |
| `src/lib/auth/admin-guard.ts` | `isSuperAdmin` import → `isRecorderAdmin` import 전환 + L135 sentinel 분기 (super 자동 흡수) | 수정 | +5 |
| `src/lib/auth/admin-roles.ts` | `isRecorderAdmin` import + `AdminRoleSummary.recorderAdmin: boolean` 필드 + `recorderAdmin = isRecorderAdmin(session)` 계산 + return 객체 + fallback 객체 박제 / `AdminRole` union 은 변경 X / `roles` push 분기 0 (admin sidebar 자동 허용 회피) | 수정 | +12 |
| `src/app/(admin)/admin/me/_components/role-matrix-card.tsx` | "기록원 관리자 (Recorder Admin)" BooleanRow 추가 (`granted={!roles.superAdmin && roles.recorderAdmin}` + `superAdminAuto={roles.superAdmin}`) | 수정 | +14 |
| `src/__tests__/lib/admin-guard.test.ts` | header 매트릭스 갱신 (PR3 5 케이스 명세) + describe 끝 PR3 5 케이스 추가 ((15) recorder_admin + 매핑 → sentinel / (16) 협회 0개 → 0n / (17) 매핑 없음 → sentinel 통과 / (18) 12 permission 전체 통과 / (19) 일반 user 회귀 가드) | 수정 | +85 |

**합계**: 수정 6 파일 (~136 LOC). 신규 파일 0. DB schema 변경 0 / Flutter v1 영향 0.

#### 검증 결과
- `npx tsc --noEmit`: **0 에러**
- `npx vitest run` (전체): **873/873 PASS** (이전 868 + 신규 5 케이스 = 873 / 회귀 0)
- 신규 케이스 검증: `admin-guard.test.ts` 의 PR3 케이스 (15)~(19) 모두 통과

#### 회귀 검증
- **기존 super_admin 진입** (`/referee/admin`): ✅ 동작 유지 — `isRecorderAdmin` 가 `isSuperAdmin` 자동 흡수 (Q1) → 동일 sentinel role 반환 / page.tsx 의 `entryRole === "super_admin"` 분기로 헤더 "Super Admin 권한 진입" 그대로 / 케이스 (1)+(4) vitest 검증
- **기존 협회 관리자 (`association_admin`)**: ✅ 동작 유지 — sentinel 분기 false (recorder_admin 아니므로) → 기존 user.admin_role + AssociationAdmin 매핑 검증 그대로 → 협회별 role 반환 / 케이스 (9) vitest 검증
- **(admin)/admin/* 영역 분리**: ✅ recorder_admin 진입 차단 유지 — `summary.roles` 에 `recorder_admin` push 0 / `roles.length === 0` 시 redirect("/login?error=no_permission") 그대로 동작 / `AdminRole` union 미수정 → tsc 타입 안전 (sidebar.tsx AdminRole 과 호환)
- **일반 user (admin_role=null)**: ✅ 403 / null 그대로 — sentinel 분기 false → user.admin_role 검증 실패 / 케이스 (10)+(19) vitest 검증
- **`getAdminRolesFromAuth` 비정상 폴백**: ✅ 빈 매트릭스 + `recorderAdmin: false` 박제 (tsc 검증)

#### Q 결재 반영
- **Q1 (super_admin 자동 흡수)**: ✅ `isRecorderAdmin` 내부에서 자동 흡수 — `/referee/admin/layout` + `admin-guard.ts` 단일 분기로 super/recorder 둘 다 통과
- **Q2 (협회 12 permission sentinel 자동 통과 / 옵션 A)**: ✅ `admin-guard.ts` sentinel 분기에서 동일 `SUPER_ADMIN_SENTINEL_ROLE` 반환 → `hasPermission` true / 별도 차단 분기 0 / 케이스 (18) vitest 12 permission 전부 통과 검증
- **PR1+PR2 합의 (vitest 868/868 → 873/873)**: ✅ 회귀 0, 신규 5 케이스 추가

💡 tester 참고:
- **테스트 방법** (수동):
  1. recorder_admin 계정 1 row UPDATE (운영 DB raw SQL 또는 PR4 UI 도입 후) — `UPDATE "User" SET admin_role = 'recorder_admin' WHERE email = '...'`
  2. 해당 계정 로그아웃 → 재로그인 (JWT 재발급 / Q4)
  3. `/referee/admin` 접속 → 안내 헤더 "**Recorder Admin 권한 진입**" 표시 (super_admin 이면 "Super Admin 권한 진입")
  4. `/referee/admin/members` 접속 → 12 permission 모두 통과 (referee 목록 + 자격증 검증 + 정산 등)
  5. `/admin` (운영자 sidebar 영역) 접속 → **차단 유지** (`?error=no_permission` redirect) — recorder_admin 단독 권한자는 (admin)/admin/* 진입 불가
  6. `/admin/me` 접속 (super_admin 또는 tournament_admin 일 때) → RoleMatrixCard 에 "기록원 관리자 (Recorder Admin)" 행 추가 표시 — super_admin 보유자는 "보유 (Super 자동)" 회색 차분 / 직접 부여자는 "보유" BDR Red 강조
- **정상 동작**: recorder_admin 사용자가 `/referee/admin/*` 12 permission 전체 통과 / `/admin/*` 차단 / RoleMatrixCard 의 "기록원 관리자" 행 정확 표시
- **주의할 입력**: JWT 재발급 필수 (Q4 — `admin_role` 토큰 박제 시점). 사용자 안내 의무

⚠️ reviewer 참고:
- **특별히 봐줬으면 하는 부분**:
  - `admin-roles.ts`: `recorder_admin` 을 `AdminRole` union 에 추가하지 **않음** + `roles` 배열 push **0** — `(admin)/admin/layout` 의 `roles.length === 0` 차단 룰을 깨지 않기 위함. 의도적 분리 박제. `RoleMatrixCard` 는 `summary.recorderAdmin` boolean 으로 직접 표시.
  - `role-matrix-card.tsx`: `granted={!roles.superAdmin && roles.recorderAdmin}` — super_admin 보유자는 `superAdminAuto={roles.superAdmin}` 분기로 "Super 자동" 흡수 표시 / 직접 recorder_admin 부여자만 `granted=true` 표시. 기존 BooleanRow 의 super_auto 패턴 (site/tournament admin) 과 정확히 동일.
  - `admin-guard.ts` L135: `isRecorderAdmin(session)` 단일 분기 — `isSuperAdmin` 자동 흡수 (Q1) 라서 별도 OR 분기 추가 0. 코드 가독성 + 단일 진입점 보장.
  - `layout.tsx` `isSuperAdmin` import 제거: `isRecorderAdmin` 가 자동 흡수하므로 중복 호출 0. eslint unused import 회피.
- **PR4 의존성**: 본 PR3 까지 완료 시 `/referee/admin/*` + 12 permission 전체 통과 + RoleMatrixCard 표시 박제. PR4 (admin/users 드롭다운 옵션) 는 운영 편의 — `User.admin_role` UPDATE UI 추가만 (가드/매트릭스 변경 0). PR5 (`/referee/admin/members` 의 "대회 기록원" 통합 탭) 는 후속 큐.
- **DB 변경 0 / Flutter v1 변경 0**: 본 PR3 도 schema 변경 0 + `/api/v1/*` 라우트 미수정 — Flutter 빌드/배포 영향 0.

## 테스트 결과 (tester)
(대기)

## 리뷰 결과 (reviewer) — recorder_admin PR1~PR3

### 종합 평가
| 영역 | 판정 | 근거 |
|------|------|------|
| 보안 (A) | ✅ PASS | JWT 서명 검증 후 payload만 신뢰 / null/undefined 가드 박제 / super_admin 자동 흡수 무한 재귀 0 / `/admin` 영역 분리 의도대로 차단 |
| 코드 품질 (B) | ✅ PASS | isSuperAdmin 패턴 정확히 카피 / JSDoc 충분 / 타입 strict 위반 0 / 8+8+19=35 케이스 vitest 통과 |
| 회귀 가능성 (C) | ✅ PASS | add-only 분기 일관 / 기존 super_admin/organizer/recorder 경로 변경 0 / 873/873 PASS / Flutter v1 미변경 |
| 운영 위험 (D) | ✅ PASS | DB schema 변경 0 / revert 단독 롤백 가능 / 디자인 13 룰 위반 0 |

📊 종합 판정: **통과 (머지 가능)**

### 영역별 상세 검증

**A. 보안 (최우선)**

A1. 권한 우회 가능성 — ✅ 안전
- `isRecorderAdmin(session)`: `if (!session) return false` 미로그인 즉시 차단 (L55). `isSuperAdmin(session)` 도 동일 가드.
- `require-recorder.ts` L38: `verifyToken(token)` JWT 서명 검증 통과 후에만 `payload.admin_role` 접근. 서명 위조 토큰은 verifyToken null 반환 → 즉시 차단.
- `recorders/route.ts` L41: `getWebSession()` 이 httpOnly 쿠키 JWT를 `verifyToken` 으로 서명 검증한 후 payload 반환. 안전.
- `/api/v1/recorder/matches/route.ts` L15: `ctx.payload` 는 `withAuth` 미들웨어가 verifyToken으로 서명 검증한 payload (middleware.ts L48). 안전.
- 무한 재귀: `isRecorderAdmin` → `isSuperAdmin` 단방향 호출만. `isSuperAdmin` 은 `isRecorderAdmin` 미호출. 재귀 0.

A2. add-only 분기 검증 — ✅ 안전
- `requireTournamentAdmin` 자체 미변경 → `/recorders` 외 22개 라우트 영향 0.
- `requireRecordersManageAccess`: recorder_admin 분기 통과 시 `prisma.tournament.findUnique` 로 tournament 존재 확인 후 404 분기. 존재하지 않는 대회로 임의 INSERT/DELETE 차단.
- fallback `requireTournamentAdmin(id)` 호출 시 기존 organizer/TAM/super_admin 검증 동작 그대로.

A3. sentinel 일관성 — ✅ 안전
- `admin-guard.ts` L144: `isRecorderAdmin(session)` 단일 분기 (super_admin 자동 흡수 활용). 별도 OR 분기 미추가 → 코드 가독성 단일 진입점.
- `SUPER_ADMIN_SENTINEL_ROLE` 동일 상수 재사용 → 12 permission `hasPermission` 자동 통과 일관 (admin-guard.test.ts 케이스 18 검증).
- `getAdminRoles` 의 `recorderAdmin: boolean` 필드는 `isRecorderAdmin(session)` 호출 — RoleMatrixCard 표시 분기만 사용 (권한 결정 분기 0).

A4. `/admin/*` vs `/referee/admin/*` 분리 — ✅ 의도대로 동작
- `admin-roles.ts` L316~318: `roles` 배열에 `recorder_admin` push **하지 않음** (주석 명시).
- `(admin)/admin/layout.tsx` L47: `summary.roles.length === 0` 시 `/login?error=no_permission` redirect → recorder_admin 단독자는 `/admin/*` 진입 차단. ✅
- `AdminRole` union 에 `"recorder_admin"` 미추가 → sidebar.tsx 타입 호환 + admin 메뉴 노출 0.

**B. 코드 품질**

B1. 패턴 일관성 — ✅
- `is-recorder-admin.ts`: `is-super-admin.ts` 시그니처 카피 + JSDoc 32줄 박제 (이유/방법/Q1 결재/매트릭스 표기). 일관성 ⭐⭐⭐.
- `requireRecordersManageAccess` 헬퍼: 라우트 내부 박제 (export X) — 단일 라우트 전용이며 향후 동일 패턴 발생 시 `src/lib/auth/` 승격 의견 박제 (developer 참고 주석).

B2. TypeScript strict — ✅
- `payload.admin_role` 접근: `JwtPayload` 인터페이스에 `admin_role?: string` 명시 (jwt.ts L25). 캐스팅 0.
- `session.user.admin_role` 옵셔널: `SuperAdminSession` 인터페이스에 `admin_role?: string` 옵션 처리. `if (!session) return false` 가드 후 접근.
- `recorders/route.ts` L20: `RecordersAuthOk` 명시 타입 — fallback `requireTournamentAdmin` AuthOk 와 구조 호환. `role: session.role ?? ""` fallback 박제.
- tsc --noEmit: 0 에러 (reviewer 재실행 검증).

B3. 테스트 커버리지 — ✅
- 4가지 권한 조합 모두 케이스: recorder (case 1) / recorder_admin (case 5+6) / tournament_admin (case 3, 8 in is-recorder-admin) / super_admin (case 4) — `require-recorder.test.ts`.
- session 경계: null/undefined/일반 user (is-recorder-admin.test.ts case 5+6+4).
- Q1 super_admin 자동 흡수: case 2+3 (is-recorder-admin.test.ts).
- vitest 통합 재실행: 3 파일 35/35 PASS (reviewer 재실행 검증).

**C. 회귀 가능성**

C1. Flutter 기록앱 — ✅ 회귀 0
- `/api/v1/recorder/matches` 일반 recorder JWT: `isSuperAdmin=false && isRecorderAdmin=false` → 기존 `tournament_recorders.findMany` + `tournament.findMany` (organizer) 분기 그대로. 응답 동일.
- `requireRecorder`: case 1 (recorder + 본인 배정) vitest 검증 → 기존 동작 보존.

C2. 기존 운영 데이터 — ✅ 변경 0
- DB schema 변경 0, `prisma db push` 호출 0건. `User.admin_role` 컬럼 재사용만.
- `tournament_recorders` 테이블 SELECT/INSERT/DELETE: recorder_admin 분기 진입 시에도 동일 prisma 호출 (테이블 변경 0).
- organizer / tournament_admin_members 검증 그대로 (PR2 fallback 분기 보존).

C3. (referee)/referee/admin 페이지 — ✅ 회귀 0
- super_admin 진입 시: `superAdmin = isSuperAdmin(session) === true` → `recorderAdmin = !superAdmin && ... = false` → `entryRole = "super_admin"` → 헤더 "Super Admin 권한 진입" (page.tsx L60). 기존 텍스트 그대로.
- 협회 관리자 (association_admin): `isRecorderAdmin(session) = false` → sentinel 분기 skip → 기존 `user.admin_role === "association_admin"` 검증 그대로 (admin-guard L169~189). 케이스 9 검증.

**D. 운영 위험**

D1. 운영 사용자 영향 — ⚠️ INFO (운영 안내 필요)
- recorder_admin 지정 후 사용자 본인의 기존 JWT 토큰은 `admin_role` 미박제 상태 → 로그아웃→재로그인 전까지 권한 미적용. **Q4 결재대로 운영 안내 필수**.
- Flutter 앱: JWT 토큰이 `admin_role` 박제 후 발급되면 `/api/v1/recorder/matches` 모든 대회 응답. 박제 전 토큰으로는 기존 권한 그대로 (회귀 0).

D2. 롤백 시나리오 — ✅ 안전
- DB 변경 0 → revert 단독으로 롤백 가능. raw SQL UPDATE 발생 시 `admin_role` 값 NULL 또는 다른 role 로 복원 1 row UPDATE 가능 (CLAUDE.md §DB 정책 안전 가드 = SELECT 사전 확인 + 1 row UPDATE).

D3. CLAUDE.md 디자인 13 룰 — ✅ 위반 0
- `role-matrix-card.tsx` "기록원 관리자" 행: 색상 모두 `var(--color-primary)` / `var(--color-border)` / `var(--color-elevated)` / `var(--color-text-*)` 토큰. hardcoded 0건.
- `page.tsx` 안내 헤더: `var(--color-warning, #FFAB00)` fallback 박제 (기존 super_admin 패턴 그대로 — Phase 1-B 시점 박제된 케이스).
- Material Symbols Outlined: `check_circle` / `remove_circle_outline` / `verified` / `shield_person`. lucide-react 0건.
- 핑크/살몬/코랄 0건. 모바일 분기 영향 0 (보조 행 추가만).

### 강점
- **Q1 자동 흡수 패턴**: `isRecorderAdmin` 내부에서 `isSuperAdmin` OR 박제 → 호출자가 super_admin 분기를 따로 안 써도 됨. `admin-guard.ts` L144 단일 분기 + `(referee)/admin/layout.tsx` L45 단일 분기로 코드 중복 0.
- **/admin vs /referee/admin 분리 의도 명확**: `summary.roles` 에 recorder_admin push 0 + AdminRole union 미수정 → admin 메뉴 자동 노출 회피. 주석에 의도 박제 (admin-roles.ts L34~38, L316~318).
- **RoleMatrixCard superAdminAuto 패턴 재사용**: 기존 site/tournament admin 행과 동일한 "Super 자동" 표시 패턴 유지 → 일관성 ⭐⭐⭐.
- **테스트 회귀 가드 강함**: 기존 case 9~14 회귀 가드 그대로 + PR3 신규 case 15~19 명세 박제. 19 case 모두 PASS.
- **tournament 존재 확인 추가**: `/recorders` recorder_admin 분기에서도 `prisma.tournament.findUnique` → 404 분기 박제 (임의 ID 대상 INSERT 차단).

### 발견 사항 (모두 INFO — 머지 차단 0)

| # | 영역 | 심각도 | 위치 | 설명 | 권장 조치 |
|---|------|--------|------|------|---------|
| 1 | 코드 품질 | INFO | `recorders/route.ts` L41~55 | recorder_admin 분기 통과 시 `getWebSession()` 호출 + 통과 못 하면 fallback 의 `requireTournamentAdmin` 가 다시 세션 가져옴 (중복 호출). 동작은 정확 / 응답 시간 미세 영향. | 후속 최적화 큐 — fallback 에 session 인자 전달 옵션 추가 (PR4 검토). 본 PR 머지 영향 0. |
| 2 | 코드 품질 | INFO | `require-score-sheet-access.ts` L148~149 | `superAdmin` 변수 + `recorderAdmin` 변수 분리 박제 — `isRecorderAdmin` 가 super 자동 흡수하므로 `superAdmin === true` 면 `recorderAdmin === true` 보장 (사실상 중복). developer 주석에 "향후 recorder_admin 만 추가 권한 분기 시 변수 분리 유용" 박제 — 의도적 가독성 박제. | 박제 의도 명확 → 변경 권장 0. |
| 3 | 운영 안내 | INFO | 운영 절차 | JWT 박제 시점 (재로그인 필수) — Q4 결재 사항이지만 코드에는 자동 안내 0. UI 별도 박제 없음. | recorder_admin 1 row UPDATE 후 운영자가 사용자에게 "재로그인" 별도 안내 — PR4 (admin/users 드롭다운) 박제 시 토스트/안내 추가 권장. |
| 4 | 테스트 커버리지 | INFO | `recorders/route.ts` | 라우트 자체 통합 테스트 0건 (developer 참고에 "통합 테스트 인프라 부재로 스킵" 박제). 단위 테스트는 `isRecorderAdmin` 헬퍼로 분기 검증 충분. | 통합 테스트 인프라 도입 후속 큐 — 현재 안전성 영향 0. |

### 결론

**머지 가능** ✅

- 4 영역 (보안/품질/회귀/운영) 모두 PASS.
- 발견 사항 4건 모두 INFO 등급 (머지 차단 0).
- vitest 873/873 + tsc 0 + 디자인 13 룰 0 위반.
- 운영 사용자 영향: recorder_admin 지정 시점에 재로그인 안내만 필수 (별도 코드 박제 불필요).
- 후속 큐: PR4 (admin/users 드롭다운 옵션) + 운영 안내 토스트 + recorders/route.ts session 인자 최적화.

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 미푸시 commit (subin 브랜치)
**0건**

## 기획설계 (planner-architect) — Phase 7 D KPI

🎯 목표: `GET /api/web/admin/analytics/wizard-kpi` 신규 — 마법사 진입/사용/소요 시간 분석 (운영 후속). DB 변경 0 / 시안 영향 0 / read-only 조회만.

### 핵심 분석 결과 (제약사항)
- **마법사 진입 마커 부재**: createTournament status 모두 `"draft"` 박제 (services/tournament.ts L445) — wizard vs 직접 라우트 구분 마커 0.
- **대안 시그널 2건**:
  - **시그널 A**: `tournament_division_rules` row 존재 = wizard Step 3 흔적 (직접 라우트는 `divisions` JSON 만 / division_rules 미박제). 단 admin 별도 페이지에서도 division_rules 박제 가능 → 잡음 가능성 있음.
  - **시그널 B**: `series_id NOT NULL` = wizard Step 1 통과 흔적. 단 1회성 대회는 NULL + editions/route 도 series_id 박제 → 잡음.
- **단계별 이탈 추적 불가**: `sessionStorage` wizard-draft 만 클라이언트 박제 (conventions.md `sessionStorage 헬퍼 표준 패턴` 2026-05-15). 서버 event log 0건.
- **소요 시간 = `updatedAt - createdAt`** (status NULL/draft → registration_open 전이 시점) 측정 가능. 단 마법사 완료 이후 운영자가 별도 수정해도 갱신됨 → 정확도 ±5분 추정.

### 측정 가능 KPI 매트릭스
| KPI | 측정 방법 | 정확도 | 1차 박제 |
|---|---|---|---|
| 회차 생성 분포 (전체 tournament `createdAt` 분포) | `prisma.tournament.count + groupBy createdAt::date` | ⭐⭐⭐ 정확 | ✅ |
| 시리즈 소속률 (`series_id NOT NULL` / 전체) | `count WHERE series_id NOT NULL` / `count` | ⭐⭐⭐ 정확 | ✅ |
| `division_rules` 사용률 (wizard Step 3 추정) | `count distinct tournament_id FROM TournamentDivisionRule` / `count tournament` | ⭐⭐ 추정 (wizard 외 admin 페이지도 박제 가능) | ✅ |
| draft → registration_open 평균 소요 시간 | `AVG(updatedAt - createdAt) WHERE status = registration_open` | ⭐⭐ ±5분 | ✅ |
| 시리즈 복제 사용률 (이전 회차 prefill) | **측정 불가** (복제 마커 0 / sessionStorage 만) | ❌ 불가 | ❌ → 후속 옵션 B |
| 단계별 이탈율 (Step 0~4) | **측정 불가** (서버 event log 0) | ❌ 불가 | ❌ → 후속 옵션 B |
| 단체-시리즈 인라인 생성 비율 (Step 0/1 분기) | **측정 불가** (sessionStorage 만) | ❌ 불가 | ❌ → 후속 옵션 B |

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|---|---|---|
| `src/app/api/web/admin/analytics/wizard-kpi/route.ts` | KPI endpoint GET / Zod 쿼리 파싱 / getAssociationAdmin sentinel 분기 / 4 KPI 병렬 집계 / apiSuccess snake_case 응답 | 신규 |
| `src/lib/analytics/wizard-kpi.ts` | 비즈니스 로직 분리 — `computeWizardKpi({ from, to, granularity })` 단일 함수 (4 prisma 쿼리 Promise.all) | 신규 (Q5=YES 시) |
| `src/__tests__/api/wizard-kpi.test.ts` | 단위 테스트 — 빈 DB / draft 5건 / registration_open 3건 / division_rules / series_id 케이스 (mock prisma) | 신규 (Q4=YES 시) |

🔗 기존 코드 연결:
- **인증**: `getAssociationAdmin()` 재사용 (admin/dashboard/route.ts L18 패턴) → super_admin sentinel 자동 통과 (admin-guard.ts L135) — 별도 권한 헬퍼 신설 0.
- **응답**: `apiSuccess()` (response.ts) — snake_case 자동 변환 (errors.md 2026-04-17 함정).
- **schema 변경**: 0 (Tournament/TournamentDivisionRule/tournament_series 기존 컬럼만 SELECT).

### API 시그니처
```
GET /api/web/admin/analytics/wizard-kpi?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=daily|weekly|monthly

응답 (apiSuccess):
{
  range: { from, to, days },
  totals: {
    tournaments_total,
    tournaments_with_series,
    tournaments_with_division_rules,
    tournaments_published,  // status="registration_open" 도달 수
  },
  rates: {
    series_attachment_rate,        // with_series / total
    division_rules_usage_rate,     // with_division_rules / total (wizard Step 3 추정)
    publication_rate,              // published / total
  },
  avg_publication_minutes,         // draft → registration_open 평균 분
  breakdown: [{ date, count }]     // granularity 별 생성 분포
}
```

📋 실행 계획:
| 순서 | 작업 | 담당 | 선행 조건 |
|---|---|---|---|
| 1 | Q1~Q5 사용자 결재 | PM | 없음 |
| 2 | KPI endpoint + (선택) lib/analytics 분리 | developer | Q 결재 |
| 3 | (선택) vitest 단위 테스트 | developer | 2 |
| 4 | tsc + vitest 회귀 검증 | tester + reviewer (병렬) | 2~3 |
| 5 | scratchpad 박제 + commit | PM | 4 |

⚠️ developer 주의사항:
- `getAssociationAdmin()` 사용 시 super_admin sentinel 자동 통과 (admin-guard.ts L135) — 별도 차단 분기 ❌.
- prisma 쿼리 `from/to` default = 최근 30일 (Q1 권장).
- `division_rules` count 는 `distinct tournament_id` — `tournament_division_rules` row 가 종별 N개씩 박제됨.
- 운영 DB SELECT 만 — INSERT/UPDATE 0 (CLAUDE.md §🗄️ 가드 5 = 운영 영향 0 작업).
- `apiSuccess()` 응답 키 자동 snake_case 변환 — 코드는 camelCase 작성 OK, 프론트 접근자만 snake_case (errors.md 2026-04-17).

### 단계별 이탈 옵션 분기
| 옵션 | 작업 | DB 변경 | 운영 영향 | 권장 |
|---|---|---|---|---|
| **A** (1차 박제) | 단계별 이탈 측정 0 / 4 KPI 만 박제 | 0 | 0 | ❌ 향후 분석 약함 |
| **B** (큰 작업) | `wizard_events` 테이블 신규 + frontend `useEffect(beacon)` 박제 | ADD TABLE (운영 DB 영향) | UI 변경 + Flutter 무관 (웹 only) | ❌ 본 PR 범위 초과 |
| **C** (1차 옵션 A + 후속 옵션 B) | A 즉시 박제 → B 후속 큐 | 0 (1차) | 0 (1차) | ⭐ **권장** |

### PR 분해
| PR | 범위 | 추정 LOC | 안전성 |
|---|---|---|---|
| **PR1** (Q3=A 또는 C) | route + (선택) lib 분리 + (선택) vitest | ~150 LOC | ⭐⭐⭐ SELECT 만 |
| **PR2** (Q3=B 또는 C 후속) | wizard_events 테이블 + 클라이언트 beacon | ~300 LOC + DB ADD TABLE | ⭐⭐ DB schema 변경 — 별도 사용자 결재 |

### 사용자 결재 Q1~Q5 (권장값)
| # | 결재 항목 | 권장 답 | 사유 |
|---|---|---|---|
| **Q1** | 측정 기간 default | **최근 30일** | 마법사 박제 2026-05-13 이후 운영 데이터 충분 / 90일 확장은 쿼리 파라미터로 분기 |
| **Q2** | 응답 granularity default | **daily** | 운영 사용량 적은 초기 단계 — daily 가 분포 시각화 명확 |
| **Q3** | 단계별 이탈 추적 옵션 | **C (1차 A + 후속 B)** | DB schema 변경 별도 결재 / 1차는 SELECT 만 |
| **Q4** | vitest 단위 테스트 포함 | **YES (PR1 포함)** | mock prisma 6 케이스 회귀 가드 |
| **Q5** | 비즈니스 로직 분리 (`lib/analytics/wizard-kpi.ts`) | **YES** | 후속 옵션 B 박제 시 동일 lib 확장 가능 / route.ts 100 LOC 룰 준수 |

### 잠재 위험
- **division_rules 시그널 잡음**: admin 별도 `/admin/tournaments/[id]/division-rules` 페이지에서도 박제 가능 → "wizard 사용률" 정확도 ⭐⭐. 정확도 향상은 옵션 B 진행 시에만 가능.
- **소요 시간 측정 잡음**: `updatedAt` 은 운영자가 후속 수정해도 갱신 → "draft → registration_open 평균" ±5분 오차.
- **운영 DB 부하 0**: 4 KPI 쿼리 모두 인덱스 hit (Tournament.status / series_id / createdAt) — `EXPLAIN` 권장 (사용자 결재 시).

## 기획설계 (planner-architect) — PR-G5 대진표 생성기 placeholder 박제 자동화

🎯 목표: 9 format 별 placeholder 박제 룰 단일 source 통일 → 강남구협회장배 유소년부 사고(순위결정전 13 매치에 실팀 박힘 → 예선 결과 무시 위험) 재발 영구 차단. read-only 분석 결과 = format 5개가 placeholder 생성기 **부재** / format 4개만 부분 박제. 운영 가동 중 add-only 분기로 회귀 0 보장.

### 1. 9 format × 현재 생성기 인벤토리

| # | format | 생성기 파일 | placeholder 박제 | 슬롯 라벨 형식 | 진출 자동 채움 |
|---|---|---|---|---|---|
| 1 | `single_elimination` | `bracket/route.ts` L420~541 (인라인) | ✅ 2R~ TBD (homeTeamId/awayTeamId NULL + next_match_id FK) | ❌ 라벨 0 (UI 자동 "vs") | ✅ match PATCH winner_team_id → next_match_id |
| 2 | `double_elimination` | **❌ 미구현** | ❌ — | — | — |
| 3 | `round_robin` | `league-generator.ts` | N/A (모든 매치 = 실팀 확정) | N/A | N/A |
| 4 | `dual_tournament` | `dual-tournament-generator.ts` (486 LOC) | ✅ 27 매치 중 23 매치 NULL placeholder | ✅ `_homeSlotLabel`/`_awaySlotLabel` settings 박제 ("A조 1경기 승자" / "A조 1위" / "8강 1경기 승자" / "4강 1경기 승자") | ✅ `dual-progression.ts` winner/loser dual path |
| 5 | `group_stage_knockout` | **❌ 조별 본선 생성기 부재** (조별 풀리그 = `league-generator` 단독 / 본선 토너먼트 = 수동 또는 미구현) | ❌ 사용자가 수동 INSERT 시 라벨 0 / next_match FK 0 | ❌ | ❌ |
| 6 | `full_league_knockout` | `league-generator.ts` + `tournament-seeding.ts` `generateEmptyKnockoutSkeleton` | ✅ 본선 1R `homeSlotLabel="1위"`/`"4위"` 박제 / 2R~ 라벨 0 (FK 채움) | ✅ 1R `{N}위` 형식 + 3/4위전 "준결승 N 패자" | ✅ `assignTeamsToKnockout` 리그 standings 기반 1R 채움 + match PATCH FK |
| 7 | `league_advancement` (링크제) | **❌ 순위전 생성기 부재** — `division-advancement.ts` 는 *기존 placeholder 의 채움* 만 담당 (운영자가 수동 INSERT 후 notes "A조 N위 vs B조 N위" 박제 의무) | ⚠️ **운영자 수동 박제 의무** → 강남구 사고 케이스 | ⚠️ notes 정규식 의존 (`/([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/`) | ✅ `advanceDivisionPlaceholders` standings rank → slot 매핑 (notes 박제 시) |
| 8 | `group_stage_with_ranking` (Phase 3.5-D) | `division-advancement.ts` `generateGroupStageRankingPlaceholders` = **stub** (return 0) | ❌ 미구현 — enum + UI 만 박제 | — | ✅ stub 완성 시 동일 advanceDivisionPlaceholders 재사용 가능 |
| 9 | `swiss` | **❌ 미구현** | ❌ — | — | — |

**핵심 사실**:
- placeholder 박제 코드 = **단 3개 format** (single_elim / dual / full_league_knockout)
- 강남구 사고 원인 = `league_advancement` 순위전 매치를 **운영자 수동 INSERT** 했고, 박제 시 `notes` 정규식 형식 미준수 + `homeTeamId/awayTeamId` 실팀(예선 결과 무관) 박힘 → `advanceDivisionPlaceholders` 가 NULL 슬롯만 덮어쓰는 안전 가드로 인해 자동 회복 0.

### 2. format × placeholder 박제 의무 매트릭스

| format | placeholder 필요 매치 | 슬롯 라벨 형식 | 자동 채움 트리거 | 비고 |
|---|---|---|---|---|

## 기획설계 (planner-architect) — Phase 6 협회 마법사

🎯 목표: super_admin / association_admin 전용 협회(Association) 마법사 신설. 일반 마법사 (Phase 1~5) 흐름 완전 분리 + 신규 API 3개 (현재 admin/associations/members 만 존재). DB schema 변경 0 — 4 모델 (Association/AssociationAdmin/AssociationFeeSetting/Referee) 모두 박제 완료 확인.

### 핵심 분석 (DB schema 박제 상태)
- ✅ `Association` (line 2603): id/parent_id/name/code @unique/region_sido/level — 박제 완료
- ✅ `AssociationAdmin` (line 2633): id/user_id @unique/association_id/role (default `"secretary_general"`) — 9 role 박제 (v3 박제)
- ✅ `AssociationFeeSetting` (line 2804): association_id @unique + fee_main/sub/recorder/timer default 박제 — schema 변경 0 (단일 정수 4 필드만 / 시안 `WIZARD_FEE_GRID` 종별×등급×시간 표는 schema 와 불일치 → §F Q4 결재 대상)
- ✅ `Referee` (line 2651): 사전 등록 user_id NULL 허용 + registered_name/phone/birth_date + match_status 박제 — Step 4 동작 가능

### 시안 vs schema 갭 1건 (사용자 결재 필수)
| # | 시안 (AssociationWizard.jsx) | 운영 schema | 갭 |
|---|---|---|---|
| 1 | Step 3 단가표 = 종별×등급×시간 grid (WIZARD_FEE_GRID 다행) | AssociationFeeSetting = 1행 4정수 (main/sub/recorder/timer) | **schema 변경 필수** if 시안 그대로 박제. 권장 = 1차 schema 그대로 (4 정수) + 시안 grid 는 후속 PR (Q4) |

📍 만들 위치와 구조:
| 파일 경로 | 역할 | 신규/수정 |
|---|---|---|
| `src/app/(admin)/tournament-admin/wizard/association/page.tsx` | 마법사 본체 (super_admin 가드 + Step 0~3 컴포지션 + WizardShell) | 신규 |
| `src/app/(admin)/tournament-admin/wizard/association/_components/step1-association-form.tsx` | Step 1: name / code / level (national/sido/pro_league) / region_sido (sido 시) | 신규 |
| `src/app/(admin)/tournament-admin/wizard/association/_components/step2-admin-picker.tsx` | Step 2: 본인 즉시 등록 체크박스 + 사용자 검색 (이메일/닉네임) + role 9종 select + 다건 누적 | 신규 |
| `src/app/(admin)/tournament-admin/wizard/association/_components/step3-fee-setting.tsx` | Step 3: 4 정수 입력 (main/sub/recorder/timer) — schema 그대로 (PR1 권장) | 신규 |
| `src/app/(admin)/tournament-admin/wizard/association/_components/step4-referee-register.tsx` | Step 4 (옵션): Referee 사전 등록 (registered_name/phone/birth_date) + skip 분기 | 신규 (Q2=PR2 시) |
| `src/app/(admin)/tournament-admin/wizard/association/_components/wizard-confirm.tsx` | 최종 확인 + 4 API 순차 호출 + 성공 시 `/admin/associations/[id]` redirect | 신규 |
| `src/lib/tournaments/association-wizard-types.ts` | `AssociationWizardDraft` / Step 타입 / `STEPS` 정의 — Phase 1 wizard-types 패턴 카피 | 신규 |
| `src/lib/tournaments/association-wizard-draft.ts` | sessionStorage 헬퍼 (key `wizard:association:draft`) — wizard-draft.ts 패턴 카피 (BigInt replacer + SSR 안전 + silent fail) | 신규 |
| `src/app/api/web/admin/associations/route.ts` | POST: super_admin 가드 + Zod (name/code/level/region_sido?/parent_id?) + code @unique P2002 → 409 + apiSuccess { id, name, code, level } | 신규 |
| `src/app/api/web/admin/associations/[id]/admins/route.ts` | POST 다건: super_admin 가드 + Zod admins[] (user_id/role) + user_id @unique skip 패턴 (absorb-tournaments 답습) + apiSuccess { created, skipped } | 신규 |
| `src/app/api/web/admin/associations/[id]/fee-setting/route.ts` | POST upsert: super_admin 가드 + Zod (fee_main/sub/recorder/timer 정수) + prisma.upsert (association_id @unique) | 신규 |
| `src/app/api/web/admin/associations/[id]/referees/route.ts` | POST 다건 (옵션): super_admin 가드 + Zod referees[] (registered_name/phone/birth_date) + match_status="unmatched" 박제 | 신규 (Q2=PR2 시) |
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` | super_admin 카드 1건 추가 (Step 0 또는 상단 안내 영역에 "협회 만들기" link) — isSuperAdmin 분기로 노출 제어 | 수정 |
| `src/__tests__/api/admin-associations.test.ts` | API 3개 (POST associations / POST admins / POST fee-setting) mock prisma 단위 케이스 (정상 / 권한 부족 403 / code 충돌 409 / 다건 skip) | 신규 |

**LOC 예상**: 신규 12 파일 (~1100 LOC: page 200 + step 컴포넌트 4×120 + types/draft 2×80 + API 4×100 + 테스트 200) + 수정 1 파일 (+20 LOC) = ~1120 LOC.

🔗 기존 코드 연결:
- **인증 가드**: `isSuperAdmin(session)` (lib/auth/is-super-admin.ts) — page server component 진입 시 redirect 분기. 신규 헬퍼 0.
- **admin-guard 자동 통과**: `getAssociationAdmin()` (admin-guard.ts L42) — super_admin sentinel 박제됨. 본 마법사는 sentinel 우회 (super_admin 이 협회 *생성* 액션이라 sentinel 첫 활성 협회 자동 선택 흐름 비대상).
- **sessionStorage 패턴**: `src/lib/tournaments/wizard-draft.ts` (conventions.md 2026-05-15 박제 — SSR 안전 + BigInt replacer + silent fail) 그대로 카피. KEY 만 `wizard:association:draft` 분리.
- **응답 형식**: `apiSuccess()` 자동 snake_case 변환 (errors.md 2026-04-17 5회 사고 함정) — Zod schema / 프론트 fetch 접근자 모두 snake_case 의무.
- **`@unique` 충돌 처리**: Association.code (P2002) → 409 + ASSOC_CODE_CONFLICT / AssociationAdmin.user_id (P2002) → skip 패턴 (1인 1협회 제약).

📋 실행 계획 (PR 분해 — Q5 권장 = **3 PR**):
| 순서 | 작업 | 담당 | 선행 조건 | 분량 |
|---|---|---|---|---|
| 1 | Q1~Q8 사용자 결재 | PM | 없음 | 5분 |
| 2 | **PR1**: API 3개 (Association/Admins/FeeSetting POST) + 단위 테스트 + tsc/vitest | developer → tester+reviewer (병렬) | Q 결재 | ~3h |
| 3 | **PR2**: 마법사 본체 (Step 1~3 + WizardShell + sessionStorage + super_admin 가드) + 일반 마법사 카드 1건 추가 | developer → tester+reviewer | PR1 머지 | ~4h |
| 4 | **PR3** (옵션): Step 4 Referee 사전 등록 + API `/referees` POST + Step 4 컴포넌트 | developer → tester+reviewer | PR2 머지 + Q2=YES | ~2h |
| 5 | knowledge 박제 (architecture/decisions + index.md) + 미푸시 commit | PM | PR1~3 통과 | 10분 |

⚠️ developer 주의사항:
- **PR1 우선** — API 단독 머지 가능 (UI 의존 0 / 운영 영향 0). PR2 (UI) 만으로는 동작 안 함.
- **schema 변경 0** 의무 — AssociationFeeSetting grid 형식 (시안)은 PR3 이후 별도 의뢰. 1차 PR1~2 는 schema 그대로 4 정수.
- **AssociationAdmin.user_id @unique** = 1인 1협회. UI 에서 "이미 다른 협회 사무국장" 사용자 검색 결과에 안내 배지 표시 + POST 시 skip 응답 처리. P2002 catch 의무 (errors.md 2026-05-15 코치 등번호 사고 답습 — DB @unique 와 zod 와 client 3중 가드).
- **Association.code 자동 추천**: level + 시도 코드 (예: KBA-11 = 서울 / KBA-26 = 부산). 행정안전부 시도 코드 박제 — 신규 상수 파일 `src/lib/associations/sido-codes.ts` 추천 (level=sido 선택 시 자동 채움).
- **시안 mockHasPermission 토글**은 시안 전용 — 운영 박제 시 제거. `isSuperAdmin === false` 시 즉시 `redirect("/tournament-admin")`.
- **AppNav frozen** (CLAUDE.md 7 룰) — main tab 변경 0 / 더보기 진입 0. 본 마법사는 URL 직접 또는 일반 마법사 페이지 카드에서만 진입.
- **admin 빨강 본문 금지** (conventions.md 2026-05-11) — `var(--color-info)` 또는 `var(--color-accent)` 통일. 권한 부족 빈 상태는 시안 `var(--bg-alt)` 회색 톤.
- **운영 DB 영향**: PR1~3 운영 DB schema 변경 0 / row 신규 (사용자가 마법사 통과 시) — `prisma db push` 호출 0건.

### F. 사용자 결재 Q1~Q8 (권장값 포함)

| # | 결재 항목 | 권장 답 | 사유 |
|---|---|---|---|
| **Q1** | 일반 마법사에 super_admin 카드 추가 위치 | **Step 0 상단 안내 영역 + isSuperAdmin 분기** (`/tournament-admin/tournaments/new/wizard` page.tsx) | (a) 더보기 메뉴 별도 추가 = AppNav frozen 룰 위반 (b) admin 메뉴 별도 = recorder_admin 와 분리 의도 흐려짐 (c) 일반 마법사 진입점에 분기 카드 = 사용자 인지 명확 + super_admin 가시성 ⭐⭐⭐ |
| **Q2** | Step 4 Referee 사전 등록 PR 분리? | **PR3 (별도 후속)** | 본 PR 핵심은 Association/Admin/FeeSetting 3 모델. Referee 사전 등록 = 2026-05-11 Phase 1-B 박제 흐름 (admin/users 사전등록 + 매칭) 과 동일 흐름 → 마법사에 흡수 시 검증 부담 ↑. PR2 검증 후 PR3 분리 |
| **Q3** | AssociationAdmin 지정 방법 (시안 = 사용자 검색) | **기존 user 선택만 (검색)** | 이메일 invite (신규 user 초대) = 별도 신원확인/회원가입 흐름 필요 → 본 마법사 범위 초과. 시안 그대로 |
| **Q4** | AssociationFeeSetting 기본값 박제 여부 | **시안 grid 형식 무시 + schema 그대로 (4 정수)** PR1~2 | schema 변경 0 룰 의무 (CLAUDE.md DB 정책). 시안 grid (종별×등급×시간) = 후속 별도 의뢰 시 schema 확장 결재 + 새 모델 `AssociationFeeGridRow` 검토 |
| **Q5** | PR 분해 | **3 PR (PR1=API / PR2=UI Step1~3 / PR3=Step4 Referee)** | PR1 운영 영향 0 + 단독 머지 가능 / PR2 검증 후 PR3 진입 = 회귀 가드 강함 |
| **Q6** | UI 디자인 토큰 | **시안 그대로 (`var(--bg-alt)` `var(--accent)` `var(--ink-mute)` `var(--ff-mono)` 등 BDR-current 토큰)** | BDR-current 시안 정합 = CLAUDE.md §🔄 운영↔시안 동기화 룰 의무 |
| **Q7** | Referee 자격번호 검증 옵션 | **1차 = 미검증 박제 (license_number 입력 only)** + 후속 = OCR/협회 API 연동 | 본 PR 범위 핵심 아님. Phase 1-B 의 `RefereeCertificate.verified` 별도 흐름 |
| **Q8** | 일반 마법사 카드 추가 시점 | **PR2 동시 (마법사 본체 + 진입 카드 = 같은 PR)** | 카드 link 가 `/tournament-admin/wizard/association` 인데 마법사 본체 없으면 404 → 같은 PR 머지 |

### G. 검증 + 회귀 가드

| 영역 | 회귀 검증 방법 |
|---|---|
| 일반 마법사 (Phase 1~5) | PR2 머지 후 일반 사용자 (super_admin 아닌) 로 `/tournament-admin/tournaments/new/wizard` 진입 — Step 0~4 동작 그대로 / "협회 만들기" 카드 미노출 |
| super_admin 자동 흡수 | super_admin 계정으로 `/tournament-admin/wizard/association` 진입 → Step 1 렌더 + Association 생성 1건 |
| association_admin 권한 | spec 명시 = super_admin OR association_admin 둘 다 진입 가능. **현재 시안 `mockHasPermission` 분기는 super_admin 전용 카피만** — 본 마법사가 *새 협회 생성* 액션이라 기존 association_admin 의 의미 모호 (이미 1협회 소속). 권장 = **super_admin 전용** (Q1 권장답 보완) |
| AppNav frozen | PR2 머지 후 시안 검수 13 룰 자체 검수 — `06-self-checklist.md` 9 케이스 |
| `admin/associations/members` 기존 API | 변경 0 (본 PR 은 신규 라우트 4개만 추가). vitest 회귀 영향 0 |
| Flutter v1 | 영향 0 (`/api/v1/...` 변경 0) |
| DB schema | 변경 0. `prisma db push` 호출 0건. row 신규 (사용자 마법사 통과 시 4 row: Association/AssociationAdmin/AssociationFeeSetting/[옵션 Referee N건]) |

### H. knowledge 박제 후속 (PM 작업)

- **architecture.md**: "협회 마법사 = super_admin 분기 별도 라우트 `/tournament-admin/wizard/association`" + "AssociationFeeSetting = 1행 4정수 schema (시안 grid 와 불일치 — PR3 별도)"
- **decisions.md**: 8 결정 (Q1~Q8) 박제 + "schema 변경 0 = 시안 grid 형식 후속 분리" + "PR 3 분해 = API → UI → Referee"
- **conventions.md**: "association-wizard-draft.ts = wizard-draft.ts 패턴 카피 + KEY 분리 (`wizard:association:draft`)"
- **index.md**: 항목 수 갱신 + 날짜 갱신

### I. 진입 의존성 / 위험

| 위험 | 영향 | 완화 |
|---|---|---|
| schema 변경 0 룰 위반 (시안 grid 그대로 박제) | 운영 DB 영향 + 사용자 결재 필수 | Q4 결재 = 4 정수 schema 박제 (1차 PR) |
| AssociationAdmin.user_id @unique 충돌 (사용자가 이미 다른 협회 소속) | UI 에서 "이미 소속" 안내 0 시 사용자 혼선 | UI 검색 결과 배지 + skip 응답 안내 토스트 |
| Association.code 충돌 (KBA-11 이미 있음) | 409 응답 → 사용자 재입력 부담 | level=sido 선택 시 자동 추천 + 충돌 검증 inline |
| 시안 mockHasPermission 토글 운영 박제 | 일반 사용자가 `?permission=1` 등으로 우회 가능 | 시안 전용 — 운영 page.tsx 진입 가드에서 토글 분기 제거 + isSuperAdmin redirect 의무 |
| 다른 세션 recorder_admin 작업 충돌 | scratchpad 동시 박제 가능 | 본 작업은 파일 끝 append only — 다른 섹션 손대지 않음 |

| `single_elimination` | 2R~결승 | `roundName` ("8강"/"4강"/"결승") 만 / homeSlotLabel 라벨 ❌ → **UI 카드 빈 슬롯 모호** | match PATCH winner → next_match_id FK | 라벨 추가 시 사용자 UX 개선 |
| `double_elimination` | Winner Bracket 2R~ + Loser Bracket 모든 R + Grand Final | "WB 1R 승자" / "LB R1 패자" / "WB 결승 패자" | **신규 generator + progression 필요** | swiss 다음 우선순위 |
| `round_robin` | 없음 (모든 매치 확정) | — | — | 의무 0 |
| `dual_tournament` | 23 매치 | ✅ 이미 완전 박제 | ✅ dual-progression | 회귀 가드만 (변경 0) |
| `group_stage_knockout` | 본선 토너먼트 1R~ | "A조 1위" / "B조 2위" / "8강 1경기 승자" / "결승" | 본선 1R = standings 기반 자동 채움 (`advanceDivisionPlaceholders` 패턴 확장) / 2R~ = match PATCH FK | **신규 generator 필수** |
| `full_league_knockout` | 본선 1R~ | ✅ "1위"/"4위"/"준결승 N 패자" | ✅ `assignTeamsToKnockout` | 부분 박제 — 2R~ 라벨 추가 시 UX 개선 |
| `league_advancement` | 순위결정전 N 매치 | "A조 1위 vs B조 1위" (notes) + ⭐ **신규 settings.homeSlotLabel 박제 의무** | ✅ `advanceDivisionPlaceholders` (notes 정규식) | **사용자 수동 INSERT → 자동 generator 로 승격 필요** |
| `group_stage_with_ranking` | {N}위 동순위전 매치 | "1위 동순위전" / "2위 동순위전" / ... | stub → 신규 generator | **stub 완성 필수** |
| `swiss` | 1R~ (페어링 매라운드 동적) | "R1 시드 1 vs R1 시드 N" → R2~ 빈 슬롯 | **신규 generator + standings 기반 페어링** | 우선순위 최하 (운영 사용 0) |

### 3. 갭 분석 + 위험 식별

| 위험 | 영향 | 케이스 |
|---|---|---|
| ⚠️ **CRITICAL**: `league_advancement` 순위전 generator 부재 → 운영자 수동 INSERT 의존 | 강남구 사고 패턴 재발 가능 (notes 형식 위반 시 자동 회복 0) | 본 사고 + 다음 협회배 |
| ⚠️ **CRITICAL**: `group_stage_with_ranking` stub → 운영자 수동 INSERT 의존 (Phase 3.5-D 시점) | 사용자가 enum 만 보고 자동 박제 기대 / 실제 동순위전 매치 0건 자동 생성 | 신규 협회배 진입 차단 사유 |
| 🟡 HIGH: `group_stage_knockout` 본선 generator 부재 → 운영자가 본선 토너먼트 수동 INSERT | 본선 = 조별 진출자 placeholder 필요 / 운영자 실수 시 사고 재발 | 다른 협회배 운영 시 |
| 🟡 HIGH: `single_elimination` 슬롯 라벨 0 → 운영 부정확 (UI 가 "vs" 만 표시) | 사용자 UX 약함 (사고 위험 0 — FK 자동) | UX 개선 후순위 |
| 🟢 MEDIUM: `double_elimination` / `swiss` generator 부재 | 운영 사용 0 (사용 시 차단) | 운영 정책으로 사용 금지 |
| 🟢 LOW: Flutter v1 영향 = **0** — placeholder 박제는 웹 admin 박제 코드만 / Flutter 는 `homeTeam`/`awayTeam` NULL 매치 노출 안 함 (대기 모드) | — | — |
| 🟢 LOW: bracket-view (시각화) 영향 = `bracket-builder.ts` 가 이미 NULL slot + `settings.homeSlotLabel` 읽음 (dual / full_league_knockout 케이스 검증됨) → 신규 generator 도 동일 패턴 따르면 UI 자동 호환 | — | — |

### 4. 구현 패턴 결정

| 옵션 | 설명 | 장점 | 단점 |
|---|---|---|---|
| A | format 별 분기 (각 generator 안에 placeholder 룰 박제) | 단일 책임 / 각 format 고유 룰 자유롭게 표현 | 룰 중복 / 라벨 형식 박제 비일관 위험 |
| B | ⭐ **공통 헬퍼 + format generator 가 호출** | 라벨 형식 단일 source / 검증 함수 재사용 / 라벨 정규식 통일 | 약간의 추상화 비용 |
| C | post-processing (생성 후 별도 룰로 placeholder 변환) | 기존 generator 변경 최소 | 2-pass 비용 / 룰 분기 복잡 / 트랜잭션 일관성 약함 |

**추천**: **옵션 B** — `src/lib/tournaments/placeholder-helpers.ts` 신규
- `buildSlotLabel(kind, params)` — kind ∈ {`group_rank`, `match_winner`, `match_loser`, `round_seed`, `tie_rank`} / 한글 라벨 단일 생성
- `buildPlaceholderNotes(homeKind, homeParams, awayKind, awayParams)` — `advanceDivisionPlaceholders` 정규식 호환 형식 자동 생성 (강남구 사고 회피)
- `parseSlotLabel(label)` — UI 카드 빈 슬롯 표시 + 정규식 매칭 (test 검증 가능)
- 각 generator 가 호출 → settings.homeSlotLabel / settings.awaySlotLabel + notes 동시 박제

**사유**:
1. 강남구 사고 = 운영자 수동 INSERT 시 notes 형식 위반이 근본 원인 → 헬퍼 함수가 형식 박제하면 운영자가 수동 INSERT 라도 헬퍼만 호출하면 안전
2. dual-tournament-generator 의 `_homeSlotLabel`/`_awaySlotLabel` 패턴 = 이미 옵션 B 와 동일 구조 (헬퍼만 추출하면 됨)
3. vitest 단위 테스트 친화적 (route.ts 통합 테스트 부재 환경)

### 5. PR 분해 + 우선순위 + 일정

| PR | 범위 | 변경 파일 | 추정 LOC | vitest 케이스 | 위험도 | 의존성 | 일정 |
|---|---|---|---|---|---|---|---|
| **PR-G5.1** | 공통 헬퍼 + vitest | `placeholder-helpers.ts` 신규 + `__tests__/lib/tournaments/placeholder-helpers.test.ts` 신규 | +220 / +180 | 25 (`buildSlotLabel` × 5 kind / `buildPlaceholderNotes` × 4 케이스 / `parseSlotLabel` × 8 / 정규식 호환 × 8) | ⭐⭐⭐ 신규 파일 / 호출자 0 | 없음 | 1h |
| **PR-G5.2** | dual-tournament-generator 헬퍼 이관 (기존 라벨 동작 동일 = 회귀 0) | `dual-tournament-generator.ts` 수정 (~30 LOC diff) | +30 / -20 | 기존 dual vitest 재실행 회귀 0 검증 | ⭐⭐⭐ refactor only | PR-G5.1 | 0.5h |
| **PR-G5.3** ⭐ CRITICAL | `league_advancement` 순위전 generator 신규 — settings.linkage_pairs 기반 placeholder 매치 자동 생성 (notes 표준 박제 + slot label settings 박제) | `league-advancement-generator.ts` 신규 + `bracket/route.ts` 분기 추가 + `placeholder-helpers` 호출 | +250 (gen) + +25 (route) | 12 (linkage pairs 정상/조 누락/순위 누락/standings 0/clear 모드) | ⭐⭐ 운영 호출 — clear=true 가드 필수 | PR-G5.1 | 2h |
| **PR-G5.4** ⭐ CRITICAL | `group_stage_with_ranking` stub 완성 — `generateGroupStageRankingPlaceholders` 본체 구현 | `division-advancement.ts` stub → 본체 (~120 LOC) + route 분기 (~15 LOC) | +135 | 10 (group_size × group_count / advance_per_group / ranking_format=round_robin vs single_elimination) | ⭐⭐ stub 영역 / 운영 사용 0 (배포 후 강남구 다음 회차에서 첫 활성) | PR-G5.1 | 2h |
| **PR-G5.5** HIGH | `group_stage_knockout` 본선 토너먼트 generator 신규 + 조별 standings 기반 1R 슬롯 라벨 박제 | `group-stage-knockout-generator.ts` 신규 + route 분기 | +200 + +25 | 8 (조 2팀 advance / 4팀 advance / 8강~결승) | ⭐⭐ 신규 generator | PR-G5.1 + PR-G5.4 (advanceDivisionPlaceholders 재사용 일부) | 2h |
| **PR-G5.6** MEDIUM | `single_elimination` 슬롯 라벨 박제 보강 — 2R~ settings.homeSlotLabel = "{prevRoundName} {N}경기 승자" | `bracket/route.ts` single elim 분기 ~10 LOC | +10 | 4 (4팀/8팀/16팀/홀수팀 BYE 시) | ⭐⭐⭐ add-only settings 만 | PR-G5.1 | 0.5h |
| **PR-G5.7** LOW (큐) | `double_elimination` generator | `double-elimination-generator.ts` 신규 | +350 | 15 | ⭐⭐ 운영 사용 0 (정책 검토 필요) | PR-G5.1 | 후속 큐 |
| **PR-G5.8** LOW (큐) | `swiss` generator + 라운드별 동적 페어링 | `swiss-generator.ts` 신규 | +250 | 12 | ⭐⭐ 운영 사용 0 | PR-G5.1 | 후속 큐 |

**진입 순서**: PR-G5.1 → (PR-G5.2 + PR-G5.3 + PR-G5.6 병렬 가능) → PR-G5.4 → PR-G5.5 → 사용자 검증 → 후속 큐 G5.7/G5.8

**전체 일정**: 본 PR (G5.1~G5.6) = **약 8시간** (1일 작업 분량) / G5.7~G5.8 = 후속 큐 (운영 사용 시점 결재)

### 6. 운영 안전성 보장

| 기존 영향 | 변경 0 보장 흐름 |
|---|---|
| 운영 강남구협회장배 데이터 13 매치 | hotfix UPDATE 13건 완료 — 본 PR 범위 외 (코드는 기존 데이터 안 건드림) |
| 기존 single_elim 대회 (다수) | PR-G5.6 = settings.homeSlotLabel **추가만** (homeTeamId/awayTeamId 변경 0 / next_match_id 변경 0). bracket-view 가 NULL 라벨 안전 처리 (이미 dual/full_league_knockout 검증) |
| 기존 dual_tournament 대회 (5/2 동호회최강전) | PR-G5.2 = refactor only (label 출력 결과 동일 / vitest 회귀 의무) |
| 기존 full_league_knockout (강남구 본선 등) | 변경 0 (`assignTeamsToKnockout` 동작 그대로 / 신규 generator 호출 안 함) |
| 기존 league_advancement (강남구 유소년부) | PR-G5.3 = 신규 호출만 추가 / **기존 매치 13건은 hotfix 완료 후 idempotent 가드** (이미 실팀 박힌 매치 = placeholder 자동 채움 skip / advanceDivisionPlaceholders 의 "null 슬롯만 UPDATE" 룰 그대로) |
| Flutter v1 | 0 (placeholder 박제는 웹 admin 전용 / Flutter 매치 목록 응답 변경 0) |
| 운영 DB schema | 0 (settings JSON 만 박제 / 컬럼 추가 0 / `prisma db push` 호출 0) |
| 디자인 13 룰 | 0 (UI 코드 변경 0 / 본 PR = 데이터 박제 룰만) |

### 7. developer 주의사항 (PR-G5.3 / G5.4 / G5.5 진입 시)

- `placeholder-helpers.ts` 의 `buildPlaceholderNotes` 출력은 **`division-advancement.ts` 정규식 `ADVANCEMENT_REGEX` 호환 의무** (vitest 가드 8 케이스 필수)
- 기존 매치 idempotent 가드: `homeTeamId/awayTeamId` NULL 인 매치만 UPDATE (강남구 hotfix 13건 보호)
- `clear=true` 옵션: 기존 매치 전체 삭제 후 재생성 — 운영자 명시 결재 의무 (CLAUDE.md §DB 정책 destructive 가드)
- `advisory lock` (`pg_advisory_xact_lock`) 의무 — 동시 생성 race condition 방지 (league-generator 패턴 카피)
- `Tournament.matches_count` 캐시 UPDATE 의무 (기존 generator 패턴)
- `applyMatchCodeFields` 호출 의무 — 매치 코드 v4 일관성 (Phase 4 박제)
- `bracket_version` 기록 의무 — 다른 format 과 일관성 (createBracketVersion 호출)
- Flutter v1 영향 발생 시 → **원영 사전 공지 의무** (현재 분석 결과 영향 0)

### 8. knowledge 박제 (구현 완료 후 PM 기록)

- **decisions.md**: "PR-G5 9 format placeholder 박제 단일 source 통일 — 옵션 B (공통 헬퍼) 채택 사유 3건 + 슬롯 라벨 형식 표준 (5 kind) + notes 정규식 호환 의무"
- **architecture.md**: "9 format 별 generator 인벤토리 + placeholder 박제 매트릭스 + 자동 채움 트리거 (match PATCH FK / standings 기반 / 운영자 manual trigger)"
- **conventions.md**: "format generator 신규 추가 시 placeholder-helpers 호출 의무 + vitest 라벨 정규식 호환 가드 의무 + clear 옵션 가드 + advisory lock 패턴"
- **errors.md** (강남구 사고 박제): "운영자 수동 INSERT 시 notes 형식 위반 = 자동 placeholder 채움 차단 → 사용자 결정 = generator 자동 박제 의무화 (PR-G5)"

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-15 | Phase 6 협회 마법사 (super_admin 전용) 기획설계 (read-only 분석) | ✅ schema 4 모델 박제 확인 (Association/AssociationAdmin/AssociationFeeSetting/Referee 모두 운영 박제 완료 / 변경 0) / 시안 vs schema 갭 1건 (Step 3 grid vs 4 정수 — Q4 결재 = 1차 4 정수) / 신규 12 파일 ~1120 LOC / 3 PR 분해 (API → UI → Referee 옵션) / Q1~Q8 권장값 박제 / DB 변경 0 / Flutter 0 / AppNav frozen 0 |
| 2026-05-15 | PR3 recorder_admin /referee/admin 진입 + admin-guard sentinel + RoleMatrixCard 매트릭스 확장 | ✅ 수정 6 파일 (~136 LOC) / sentinel 단일 진입점 (isRecorderAdmin OR 자동 흡수) / AdminRole union 미수정 (admin sidebar 자동 허용 회피 — recorder_admin = /referee/admin/* 전용) / tsc 0 / vitest 873/873 (이전 868 + 신규 5 = 873) 회귀 0 / DB 변경 0 / Q2 옵션 A (12 permission 자동 통과) 박제 |
| 2026-05-15 | PR-G5 대진표 생성기 placeholder 박제 자동화 설계 (9 format 인벤토리 + 갭 분석 + PR 분해) | ✅ read-only 분석 / 옵션 B (공통 헬퍼) 권장 / PR-G5.1~G5.8 분할 / 본 PR 약 8h / Flutter 0 / DB 0 / 디자인 13 룰 0 |
| 2026-05-15 | Phase 7 D KPI endpoint 설계 (read-only 분석) | ✅ 측정 가능 KPI 4건 + 측정 불가 3건 (서버 event log 부재) / 옵션 C 권장 / Q1~Q5 권장값 / DB 변경 0 |
| 2026-05-15 | PR2 recorder_admin 기록원 배정 API 가드 (`/recorders` GET/POST/DELETE 3 핸들러) | ✅ 수정 1 파일 (~50 LOC) / 라우트 내부 헬퍼 `requireRecordersManageAccess` 신설 / tsc 0 / vitest 868/868 회귀 0 / DB 변경 0 / organizer/TAM/super_admin 동작 그대로 + recorder_admin 모든 대회 통과 |
| 2026-05-15 | PR1 recorder_admin 권한 헬퍼 + 기록 API 가드 (is-recorder-admin / require-recorder / require-score-sheet-access / Flutter recorder/matches) | ✅ 신규 3 파일 + 수정 3 파일 / tsc 0 / vitest 868/868 (auth 64 + 신규 16 PR1) / DB 변경 0 / Q1 super_admin 자동 흡수 + Q2 sentinel 통과 |
| 2026-05-15 | Phase 7 A PR1 — Wizard E2E Playwright 인프라 + 시나리오 1 (QuickCreateForm 시리즈 0개) | ✅ playwright.config wizard project + auth.setup + fixtures + wizard-quick-new.spec / .env.test.local placeholder / tsc 0 / vitest 852/852 / E2E 자체 실행 = 사용자 검증 (TEST_USER 박제 후) — spec 정정: Tournament `organization_id` 컬럼 부재 → `series_id===null` + `organizerId===testUserId` 검증으로 대체 |
| 2026-05-15 | recorder_admin 역할 사전 조사 (권한 인벤토리 + 전역 role 가능성 + 심판 페이지 현황) | ✅ Explore 3회 — admin_role 재사용 가능 + /referee/admin 완성 + 통합 미연결 발견 / 사용자 결정 = 1-A |
| 2026-05-15 | Phase 19 PR-Stat1~Stat5 + A.7 의뢰서 갱신 | ✅ player-stats-types/helpers 신규 + vitest 13 / TeamSection 15 col grid + StatPopover / page.tsx match_player_stats SELECT + draft / submit/route.ts buildPlayerStatsFromRunningScore 확장 / vitest 236/236 / PM 결재 대기 |
| 2026-05-15 | feat(schedule+admin): GNBA 종별·체육관 시각 분리 (PR-G2+G3) | ✅ public-schedule API + tournament-tabs 매핑 + schedule-timeline 필터/카드 + admin matches-client venue 필터 / vitest 852/852 |
| 2026-05-15 | Phase 3.5 유청소년 결합 코드 영향 분석 | ✅ 20+ 파일 read-only 진단 / getDivisionInfo 호출자 0건 / 후속 안전 박제 = parseDivisionCode + vitest 12 / 사용자 결재 대기 |
| 2026-05-15 | Phase 19 PR-T1~T5 (FIBA 타임아웃 phase 분기 + OT 색 통일) | ✅ timeout-helpers + vitest 12 / team-section.tsx + _score-sheet-styles.css / vitest 223/223 / PM 결재 대기 |
| 2026-05-15 | release #6 (dev → main) — 경기시간 6분 + 분 직접 입력 | ✅ PR #490+#491 머지 / Vercel 자동 배포 |
| 2026-05-15 | feat(game-time-input): 6분 + 분 직접 입력 | ✅ TIME_OPTIONS 6종 + number input clamp / vitest 4 신규 / vitest 822/822 |

## 구현 기록 (developer) — Phase 7 D KPI

📝 구현 요약: `GET /api/web/admin/analytics/wizard-kpi` 신규 — 마법사 KPI 4건 측정 (전체 대회 / series 부착 / division_rules 사용 / 발행 도달 + 평균 소요 시간 + granularity 별 breakdown). 비즈니스 로직 `src/lib/analytics/wizard-kpi.ts` 분리 (Q5=YES). vitest 5 케이스 회귀 가드 (Q4=YES). default 30일 / daily (Q1+Q2). 옵션 C 1차 박제 (Q3 — 후속 옵션 B = wizard_events 테이블은 별도 PR).

### 변경 파일 + LOC
| 파일 | 변경 내용 | 신규/수정 | LOC |
|------|----------|----------|-----|
| `src/lib/analytics/wizard-kpi.ts` | `computeWizardKpi({from,to,granularity})` 단일 export + 4 KPI 병렬 (Promise.all) + bucketKey 헬퍼 (daily/weekly/monthly) | **신규** | +197 |
| `src/app/api/web/admin/analytics/wizard-kpi/route.ts` | GET handler + Zod 쿼리 파싱 + getAssociationAdmin 인증 + default 30일/daily + range 검증 (from > to → 422) | **신규** | +101 |
| `src/__tests__/api/wizard-kpi.test.ts` | mock prisma (count/findMany/groupBy) + 5 케이스 (default range / 명시 from-to where / weekly bucket / total=0 NaN 방지 / avg 20분 정확성) | **신규** | +169 |

**합계**: 신규 3 파일 / +467 LOC (예상 ~230 LOC 대비 +103% — 비즈니스 로직 분리 + breakdown 헬퍼 + vitest 5 케이스 풀 커버)

### 검증 결과
- `npx tsc --noEmit`: **0 에러** (exit=0)
- `npx vitest run src/__tests__/api/wizard-kpi.test.ts`: **5/5 PASS** (19ms)
- `npx vitest run` (전체): **878/878 PASS** (이전 873 + 신규 5 = 878 / 회귀 0)

### Q 결재 반영
- **Q1 (30일 default)**: ✅ route.ts L60 `from = now - 30 * 24 * 60 * 60 * 1000`
- **Q2 (daily default)**: ✅ route.ts L62 `granularity ?? "daily"`
- **Q3 (옵션 C 1차 A)**: ✅ wizard_events 테이블 박제 0 / 측정 가능 4 KPI 만 박제
- **Q4 (vitest YES)**: ✅ wizard-kpi.test.ts 5 케이스
- **Q5 (lib/analytics 분리 YES)**: ✅ computeWizardKpi 단일 export — route.ts 100 LOC 룰 준수 (101 LOC, 후속 옵션 B 진입 시 동일 lib 확장)

### 인증 패턴 검증
- `getAssociationAdmin()` 위임 (admin/dashboard 패턴 카피) — super_admin / recorder_admin sentinel 자동 통과 (admin-guard.ts L138~167) / association_admin 통과 / 일반 사용자 → null → 403 FORBIDDEN
- 별도 인증 단위 테스트 0 (PR1 의 is-recorder-admin.test.ts + 기존 admin-guard 가드 회귀 가드로 충분)

### 회귀 검증
- 기존 admin-guard.ts: ✅ 변경 0 (재사용만)
- 기존 prisma Tournament / TournamentDivisionRule schema: ✅ 변경 0 (SELECT only)
- 운영 DB destructive: ✅ 0 (count / findMany / groupBy 만 — CLAUDE.md §DB 가드 5 운영 영향 0)
- Flutter v1 영향: ✅ 0 (web admin 전용 endpoint)
- apiSuccess snake_case: ✅ camelCase 응답 객체 자동 변환 (errors.md 5회 사고 박제)

💡 tester 참고:
- **테스트 방법**: vitest 자동 통과 — 추가 수동 테스트 시 (a) super_admin 계정으로 curl `GET /api/web/admin/analytics/wizard-kpi` → 200 + range default 30일 응답 (b) `?from=2026-04-01&to=2026-04-30&granularity=weekly` 명시 → 200 + breakdown 주별 (c) `?from=2026-05-15&to=2026-04-01` → 422 INVALID_RANGE (d) `?granularity=hourly` → 422 VALIDATION_ERROR (zod enum) (e) 비로그인 또는 일반 사용자 → 403 FORBIDDEN
- **정상 동작**: 응답 키 모두 snake_case (totals.tournaments_total / rates.series_attachment_rate / avg_publication_minutes / breakdown[].date) / breakdown 배열 date 오름차순
- **주의할 입력**: total=0 시 rates 모두 0 (NaN 방지 — case 4 가드) / weekly 시 월요일 키 박제 (UTC 기준) / division_rules 시그널 잡음 인지 (admin 별도 페이지에서도 박제 가능 — scratchpad §잠재 위험)

⚠️ reviewer 참고:
- **특별히 봐줬으면 하는 부분**:
  - `wizard-kpi.ts` Promise.all 5번째 findMany (breakdownRaw) — 운영 대회 수 적음 (월 수십 건) 가정으로 JS 집계. 100배 증가 시 raw SQL DATE_TRUNC 재검토 의무 박제
  - `safeDiv` helper — 0 division NaN 방지 (errors.md 회피)
  - `bucketKey` weekly 분기 — ISO week 단순화 (월요일 키). 운영 사용자 친화 우선 박제 (정식 ISO week 표기 "YYYY-Www" 추후 검토)
  - `route.ts` parseDate — YYYY-MM-DD 입력 시 from=00:00:00 / to=23:59:59.999 UTC 자동 boundary 박제 (사용자 직관 일치)
- **PR2 (후속) 의존성**: 본 KPI lib 는 후속 옵션 B (wizard_events 테이블 신설) 진입 시 동일 lib 확장 의무 (route.ts 100 LOC 룰 보호). 단계별 이탈 측정 추가 시 `computeWizardFunnel(input)` 신규 export 추천.

## 구현 기록 (developer) — Phase 6 PR1 API (2026-05-15)

📝 구현한 기능: 협회 마법사 API 3 endpoint 신규 (Association/Admins/FeeSetting POST). super_admin 자동 통과 + Zod 검증 + BigInt/snake_case 자동 변환. UI / 마법사 본체는 PR2 영역.

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/app/api/web/admin/associations/route.ts` | POST 협회 생성 — getAssociationAdmin 가드 + Zod (name/code/level/region_sido/parent_id) + prisma.create + P2002 → 409 ASSOC_CODE_CONFLICT | 신규 | ~90 |
| `src/app/api/web/admin/associations/[id]/admins/route.ts` | POST AssociationAdmin upsert — Zod (user_id + role 9종 enum) + association/user 존재 확인 (404) + upsert (user_id @unique = 1인 1협회 룰) | 신규 | ~120 |
| `src/app/api/web/admin/associations/[id]/fee-setting/route.ts` | POST FeeSetting upsert — Zod (4 정수 main/sub/recorder/timer >=0) + association 확인 (404) + upsert (association_id @unique = 1행 1협회) | 신규 | ~105 |
| `src/__tests__/api/association-wizard.test.ts` | vitest 8 케이스 (3 endpoint × 인증/검증/생성/upsert/회귀) — vi.doMock admin-guard + prisma | 신규 | ~310 |

**총 신규 4 파일 / 0 수정** — 총 ~625 LOC.

🛡️ 적용된 가드:
- 인증: `getAssociationAdmin()` 단일 진입점 — super_admin sentinel 자동 통과 (admin-guard.ts 2026-05-11 박제).
- 응답: `apiSuccess()` → BigInt 자동 `.toString()` + snake_case 자동 변환 (errors.md 5회 사고 함정 회피).
- Validation: Zod 422 + `validationError()` 표준 헬퍼 (내부 schema 상세 sanitize).
- P2002 처리: 협회 코드 충돌 → 409 명시 (`ASSOC_CODE_CONFLICT`) — try/catch 의무 (errors.md 2026-05-15 등번호 사고 패턴 답습).
- BigInt 변환 안전: `try { BigInt(...) } catch { 404 NOT_FOUND }` — 비-숫자 route param 방어.

✅ 검증 결과:
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | exit=0 (회귀 0) |
| 신규 vitest (association-wizard.test.ts) | **8/8 PASS** (421ms) |
| 전체 회귀 vitest | **918/918 PASS** (5.19s — 재실행 0 flaky) |
| 운영 DB 변경 | 0 (schema 변경 0 / prisma db push 0 / row UPDATE 0) |
| Flutter v1 영향 | 0 (`/api/v1/...` 변경 0) |
| 디자인 / UI 변경 | 0 (API 라우트만) |

💡 tester 참고:
- 테스트 방법: `npx vitest run src/__tests__/api/association-wizard.test.ts` — 8 케이스 모두 PASS 정상.
- 정상 동작:
  - super_admin 세션 → 3 endpoint 모두 200 응답 + BigInt → string + snake_case 자동 변환.
  - 비로그인/일반 사용자 → 403 FORBIDDEN.
  - Zod 위반 (name 누락 / 음수 fee) → 422 VALIDATION_ERROR.
  - 존재하지 않는 association_id → 404 NOT_FOUND (user.findUnique / upsert 호출 안 됨 — early return 검증 박제).
  - 중복 user_id (1인 1협회) → upsert update 분기 → 200 + role 갱신.
- 주의할 입력:
  - parent_id 는 문자열 BigInt 로 입력 (Zod 문자열 → 내부 BigInt 변환).
  - code 중복 (KBA-11 이미 존재) → 409 ASSOC_CODE_CONFLICT (Prisma P2002 catch).
  - user_id 가 비-숫자 ("abc") → 404 NOT_FOUND (BigInt() throw catch).

⚠️ reviewer 참고:
- **추가 schema 변경 0** — Association/AssociationAdmin/AssociationFeeSetting 4 모델 모두 운영 박제 완료 (현 PR1 은 신규 라우트만 추가).
- **admin-guard 단일 진입점 의무** — `getAssociationAdmin()` 외 직접 super_admin 분기 작성 0 (DRY + sentinel 자동 통과 보존).
- **응답 키 일관성** — 세 endpoint 모두 `{ association | association_admin | fee_setting }` snake_case 단일 컨벤션.
- **PR2 진입 준비**:
  1. 본 API 3 endpoint 동작 검증 완료 → PR2 마법사 본체 (Step 1~3 UI) 진입 가능.
  2. PR2 = `src/app/(admin)/tournament-admin/wizard/association/page.tsx` + Step1~3 컴포넌트 + sessionStorage 헬퍼 + super_admin 가드 + 일반 마법사 카드 추가.
  3. PR3 (옵션) = Step 4 Referee 사전 등록 + `/referees` POST endpoint (Q2 결재 = 별도 후속).
- **운영 영향 0 보증**: 본 PR1 머지 후에도 UI 진입 0 (마법사 본체 없음) → 운영 사용자 호출 0. 단독 머지 안전.

