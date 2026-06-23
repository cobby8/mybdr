# CLI 의뢰서 — 기록원 권한 감사 로그 + admin_role 가시화 (PR-RECORDER-AUDIT)

> **작성**: Cowork 2026-06-12 (수빈 결재)
> **계기**: "슈퍼관리자 권한 해제" 의혹 조사 결과 — 실제 해제 0건, 원인 = 가시성/감사 빈틈 2개
> **우선순위**: 9C 4 PR 완료 후 (큐 후순위). 독립 PR 1건.
> **큐 위치**: STAGE A 머지 전 합류 가능 (subin 브랜치, 같은 일괄 머지)

---

## §0. 배경 (2026-06-12 Cowork 실측 — CLI는 재실측 불필요, 참고만)

```
[실측 1] 슈퍼관리자(isAdmin=true) 8명 전원 유지 — 해제 없음
  (cobby8/snukobe/record03/realtdplayer/bdr.wonyoung/grizrider/referee-test/admin@bdr.com)
[실측 2] admin_logs 전수 — user.admin_change 해제 기록 = 4/30 realtdplayer 1쌍뿐
[실측 3] tournament_recorders 전수 (운영 60개 대회 × GET API) — 잔존 1행뿐
  (열혈농구단 SEASON2 → nonggudan@mybdr.kr). record01/02 배정 = soft-delete 흔적조차 0행
  → 대회 삭제 cascade 또는 직접 삭제로 소멸 추정. 추적 불가.

[구조적 빈틈 — 본 의뢰의 수리 대상]
  A. 기록원 배정/해제 API (POST/DELETE /api/web/tournaments/[id]/recorders)에 adminLog 0
     → 언제 누가 지정/해제했는지 영구 추적 불가
  B. /admin/users 화면이 admin_role (recorder_admin 등) 미표시
     → BDR기록원관리자가 "일반유저 / -"로 보여 권한 해제로 오인 (금일 사고 원인)
```

---

## §0.5. ★★★ 파트 0 (최우선 · HOTFIX) — 기록원 목록 snake_case 표시 버그

```
[증상] 기록원 추가 성공 토스트는 뜨는데 "현재 기록원" 목록은 항상 "등록된 기록원이 없습니다".
       새로고침해도 동일. (2026-06-13 운영 확인 — record01/02/03 DB 활성인데 목록 0)
[근본] apiSuccess() 키 자동 snake_case 변환 함정 (CLAUDE.md "재발 5회"):
       GET /api/web/tournaments/[id]/recorders 응답 = is_active / recorder_id (snake_case)
       BUT src/app/(admin)/tournament-admin/tournaments/[id]/recorders/page.tsx 가
       r.isActive / r.recorderId (camelCase) 로 읽음 → 전 행 undefined → filter 0 → 빈 목록.
       제거 버튼도 r.recorderId=undefined 라 동시 깨짐.
[영향] 기록 자체는 정상 (bdr_stat 앱 = API 직접 읽음 → 영향 0). 운영자 화면 표시만 버그.
```

**파일**: `src/app/(admin)/tournament-admin/tournaments/[id]/recorders/page.tsx` (단일 파일)

수정 (raw API 1회 curl 확인 후 — snake_case 룰):
1. `type Recorder` 정의: `recorderId` → `recorder_id`, `isActive` → `is_active`, `createdAt` → `created_at` (실제 응답 키와 일치)
2. `recorders.filter((r) => r.isActive)` → `r.is_active`
3. `removeRecorder(r.recorderId, ...)` → `r.recorder_id`
4. 그 외 `r.id` / `r.recorder.*` 는 정합 (무변경)

검증: 로컬 3001 또는 운영에서 제10회 BDR YOUNGMAN GAME (`53112aa5-c352-428a-954c-3d1f43580ad9`) 기록원 페이지 → 목록에 record01/02/03 3명 표시 + 제거 버튼 동작 확인.

> **권장**: 파트 0은 단독 HOTFIX commit 으로 먼저 분리 (`fix(recorder): 기록원 목록 snake_case 표시 버그`). 파트 1·2 는 그 위에 이어서.

---

## §1. 작업 범위 — 1 PR, 2 파트 (+ 옵션 1)

### 파트 1 — 기록원 배정/해제 감사 로그 (adminLog add-only)

**파일**: `src/app/api/web/tournaments/[id]/recorders/route.ts`

| 지점 | action | severity | 내용 |
|------|--------|----------|------|
| POST 신규 create 후 | `recorder.assign` | info | `{대회명} {email} 기록원 지정` |
| POST 재활성화 (isActive false→true) 후 | `recorder.assign` | info | `{대회명} {email} 기록원 재활성화` |
| DELETE soft-delete 후 | `recorder.remove` | **warning** | `{대회명} {email} 기록원 해제` |

- `adminLog()` 사용법은 `src/app/actions/admin-users.ts` 의 `user.admin_change` 패턴 그대로 답습 (`src/lib/admin/log.ts` 시그니처 실측 후 적용)
- description에 대회명 필요 → tournament `select: { name: true }` 추가 조회 1회 (POST/DELETE 각각)
- `previousValues` / `changesMade` 에 `{ isActive }` 전후값 박제
- **응답 shape 절대 불변** (add-only). 기존 admin SPA 호출부 회귀 0.

### 파트 2 — /admin/users 화면 admin_role 가시화

**파일**: `src/app/(admin)/admin/users/page.tsx` + `admin-users-table.tsx` + `src/app/actions/admin-users.ts` (loadMoreUsersAction)

1. user select 3곳에 `admin_role: true` 추가 — **page.tsx ↔ loadMoreUsersAction select 일치 의무** (기존 drift 방지 주석 준수)
2. 관리자 컬럼 표시 확장:
   - `isAdmin=true` → 기존 "ON" 유지 (무변경)
   - `admin_role` 존재 시 칩 추가: `recorder_admin` → "기록원관리자" / `association_admin` → "협회관리자" / `super_admin` → 표시 생략 (ON과 중복)
   - 칩 스타일 = 기존 역할 칩과 동일 계열, `var(--color-*)` 토큰만 (하드코딩 ❌ / 핑크·살몬·코랄 ❌)
3. 직렬화: admin_role은 string|null — BigInt/Date 아님, serialize 룰 추가 불필요 (확인만)

### 옵션 (결재 default = 실행) — record01/02 기록원 재배정

- 대상: 제10회 BDR YOUNGMAN GAME (`53112aa5-c352-428a-954c-3d1f43580ad9`)
- 방법: **코드/SQL 아닌 운영 API 경유** — 파트 1 박제 후 로컬 3001에서 슈퍼관리자 세션으로 POST 2회 (record01@mybdr.kr, record02@mybdr.kr) → 신설된 adminLog가 같이 박히는지 겸사 검증
- 실행 전 SELECT 1회 (중복 배정 확인) / 실행 후 GET 실측 — DB 정책 §안전가드 준수

---

## §2. 사전 점검 (작업 전)

```
1. git: subin 브랜치 / 9C 4 PR 커밋과 충돌 없는지 (recorders route는 9C 무관 — 충돌 0 예상)
2. src/lib/admin/log.ts 시그니처 실측 (admin_id 추출 방식 — 세션 내부 추출 vs 인자)
3. admin-users-table.tsx 의 관리자 컬럼 렌더 위치 + 기존 칩 클래스 실측
4. apiSuccess snake_case 자동 변환 확인 — admin_role → 프론트 접근자 snake_case (재발 5회 함정)
   단, /admin/users는 server component 직접 prisma (apiSuccess 미경유) → camelCase 그대로. 혼동 금지.
```

---

## §3. Stop conditions (발견 즉시 중단 + 보고)

```
· DB schema 변경 (신규 테이블/컬럼) ❌ — admin_logs/users 기존 컬럼만 사용
· /api/v1/** 변경 ❌ (Flutter 영향 — 원영 공지 사안)
· recorders API 응답 shape 변경 ❌ (add-only 위반)
· lint / tsc 실패
· LOC > +300 (본 PR 적정 규모 ~150)
· 사용자결정 §1~§8 / AppNav 무관 화면이지만 토큰 룰(C-10) 위반
```

---

## §4. 검증 (tester)

```
1. tsc / lint 0
2. 정적: adminLog 3지점 (assign/reactivate/remove) previousValues·changesMade 정합
3. select 3곳 admin_role 일치 (page.tsx / loadMoreUsersAction) — drift 0
4. 회귀: 관리자 컬럼 기존 ON 표시 무변경 / 역할 칩 무변경 / 검색·더보기 동작 무변경
5. (옵션 실행 시) POST 2회 → admin_logs 신규 2행 + GET 배정 2행 실측 = 파트 1 live 검증
```

---

## §5. 커밋 / 마무리

```
· commit: feat(admin): 기록원 배정 감사 로그 + admin_role 가시화 (PR-RECORDER-AUDIT)
· BDR-current 역박제: AdminUsers 시안 화면 존재 시 관리자 칩 동기화 (운영→시안 동기화 룰 §4)
  — 없으면 skip + 보고
· scratchpad 작업 로그 1줄 / errors.md 해당 없음 / 본 의뢰 계기(가시성 함정)는 lessons.md 1줄
· scripts/_temp/check-admin.mjs — 실측 완료 후 삭제 (temp 정리 룰)
· phase-ledger: 본 건은 Phase 외 단독 PR — 큐 문서에 1줄 반영
```

---

## 즉시 시작 명령 (CLI 한 줄)

```
Read Dev/design/prompts/recorder-permission-audit-fix-cli-prompt-2026-06-12.md 하고 §0.5 파트0 HOTFIX 부터 먼저 박제·검증해줘 (오늘 대회 운영자 화면 급함). 그 다음 §2~파트1·2. 결재 default 자동.
```
