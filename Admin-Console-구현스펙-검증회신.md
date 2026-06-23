# 구현 스펙 검증 회신 — Admin Console v2.32 (라운드트립 2회차)

> **From**: 백엔드 코워커 (운영 repo 실측) · 2026-06-14
> **대상**: `IMPLEMENTATION-SPEC.md` §7 확정 요청 + 계약 정합 검증
> 구성: **Part A** = 디자인 클로드 회신(사실 확정·계약 정정) / **Part B** = CLI 박제 프롬프트(S2 신규 2 API)

---

# Part A. 디자인 클로드 회신 (스펙 정정 4건 + 확정)

## A-1. ⚠️ 응답 키 = **snake_case 자동변환** (계약 전면 정정 필요)

운영 API 표준 `apiSuccess(data)` 는 내부에서 `convertKeysToSnakeCase(data)` 를 거친다(`src/lib/api/response.ts`). → **스펙의 camelCase 키는 실제 응답에서 전부 snake_case로 나온다.**

| 스펙(camelCase) | 실제 응답 키 |
|---|---|
| `createdAt` | `created_at` |
| `snoozedUntil` | `snoozed_until` |
| `nextCursor` | `next_cursor` |

→ 콘솔 `data.js` 바인딩 접근자를 **snake_case로 고정**. (이 프로젝트 반복 버그 1순위 — route.ts 코드는 camelCase여도 프론트는 snake_case로 받아야 함. 신규 필드는 curl 1회로 raw 확인 권장.)
KPI 예시도 `recruiting_tournaments` 처럼 이미 snake 혼용 → **전 키 snake 통일** 권장.

## A-2. games.status 실제 enum (placeholder 정정)

`src/lib/constants/game-status.ts` `STATUS_LABEL` 실측:

| status(Int) | 실제 라벨 | 색 토큰(운영) |
|---|---|---|
| 0 | (라벨 없음 — 기본/미정) | — |
| **1** | **모집중** | `--color-status-open` |
| **2** | **확정** | `--color-status-confirmed` |
| **3** | **완료** | `--color-badge-gray` |
| **4** | **취소** | `--color-status-cancelled` |

→ 스펙의 `0=모집/1=마감임박/2=진행/3=종료/4=취소` 는 **전부 불일치**. 콘솔 `GAME_STATUS_MAP` 은 위 4값으로. **‘마감임박’·‘진행중’ 별도 status 없음**(필요 시 파생 계산). 매핑은 위 파일 import 재사용(하드코딩 금지).

## A-3. admin_role / RBAC 실태 (4역할 매핑 정정)

- 신규 admin API 가드 표준 패턴(`src/app/api/admin/plans/route.ts`):
  ```ts
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return forbidden();
  ```
  헬퍼: `src/lib/auth/is-super-admin.ts` · `roles.ts` · 감사기록 `adminLog()`(`src/lib/admin/log.ts` → `admin_logs`).
- **실제 사용 admin_role 값**: `super_admin`(sentinel `__super_admin__`) · `association_admin`. 스키마 주석의 `org_admin`/`content_admin` 은 **희망값 — 현재 enforcement 미사용.**
- → 콘솔 RBAC 4역할(Site/Series/Court/콘텐츠) 중 **실재 분기는 super_admin / association_admin 2개**. org_admin·content_admin 분리는 **신규 role 도입(S4)** 필요. 데모 역할 전환기는 유지하되, 실 enforcement는 2역할 기준으로 표기 권장.

## A-4. ‘즉시’로 본 일부가 실제론 **신규 라우트** (등급 미세조정)

모델·읽기는 OK지만 **처리(mutation) 라우트가 없는** 항목:

| 화면 | 읽기 | 처리 뮤테이션 | 정정 |
|---|---|---|---|
| 매너 검토 | ✅ `/web/admin/game-reports`(+stats) | ❌ 처리/제재 라우트 없음(GET만) | **resolve 뮤테이션 신규** |
| 제안·피드백 | ✅ suggestions 모델 | ❌ admin 처리 라우트 없음 | **상태/응답 update API 신규** |
| 팀 검수 | ✅ Team.status | ❌ 글로벌 검수 액션 없음 | **검수 액션 API 신규** |
| 커뮤니티 | ✅ community_posts.status | ◑ `/api/web/community/[id]` PATCH 재사용 가능 | admin 게이트만 확인 |

→ 즉시 “조회” 가능, “처리”는 위 3건 소형 신규. (S1 에서 같이 처리 권장)

## A-5. 확정 — 신규 API 2개 / DB 1테이블 (스펙대로 OK)

- `GET /api/web/admin/overview` · `GET /api/web/admin/inbox` = **신규, 모델 변경 0** → CLI 프롬프트 Part B.
- `AdminInboxState`(snooze 폴리모픽 1테이블) = S3. `CommunityReport` = 선택.
- 감사로그/‘넘기기 memo’ 는 **`adminLog()` + `admin_logs` 재사용** 가능(별도 모델 불요).

## A-6. §7 양식 회신 요지

```
1) 완료 엔드포인트: (구현 후 기입) — 단 응답 키 snake_case 고정
2) games.status enum: 1=모집중·2=확정·3=완료·4=취소 (0=기본) ← 확정
3) admin_role enforcement: super_admin / association_admin 실재. org/content_admin 신규 필요
4) AdminInboxState=S3 도입예정 / CommunityReport=선택 / 감사=adminLog 재사용
5) data.js 교체 키: 전부 snake_case (created_at·snoozed_until·next_cursor …)
```

---

# Part B. CLI 박제 프롬프트 — S2 신규 집계 2 API (DB 0)

> subin 브랜치. 모델/스키마 변경 0. 기존 가드·apiSuccess·prisma 재사용. 운영 영향 = 읽기 전용.

## B-0. 공통 규약 (반드시)
- 가드: `getWebSession()` + `session.role === "super_admin"` 아니면 `forbidden()`. (`/api/admin/plans` 패턴 카피)
- 응답: `apiSuccess(data)` 사용 → **키는 코드에서 camelCase로 써도 자동 snake_case 출력**. 프론트 계약서(스펙)에 snake_case로 명시.
- 모든 count/groupBy 는 기존 모델만. **신규 모델/필드 0.**
- 검증: 각 엔드포인트 curl 1회 raw 응답 캡처 → 키가 snake_case인지 확인 후 회신에 첨부.

## B-1. `GET /api/web/admin/overview` (범용 KPI·큐)
`src/app/api/web/admin/overview/route.ts` 신설. **기존 `/web/admin/dashboard`(심판 전용)와 분리.**

집계(전부 기존 모델):
- `new_users` = `User.count({ where:{ createdAt >= 오늘0시(KST) } })`
- `active_games` = `games.count({ where:{ status: { in:[1,2] } } })` (모집중+확정 = 활성. **status Int** 주의)
- `month_revenue` = `payments.aggregate(_sum: amount, where:{ status:"paid"/완료, paid_at >= 이번달1일 })` — 결제 완료 status 실값 확인 후 적용
- `recruiting_tournaments` = 대회 상태 로직 재사용(= 본 repo `effectiveTournamentStatus` 도입 시 그것과 정합; 현재는 status 모집군 count)
- 각 `trend` = 최근 7일 day-bucket count (`createdAt` group by date).
- `queue[]` = 도메인별 미처리 count: game_reports(미처리) · community_posts(검토대기 status) · Team(검수대기) · payments(refund_status=요청) · court_submissions(대기) · organizations(status=pending).

응답 형태(스펙 §1-A, **snake_case**): `{ kpis:[{key,value,unit,delta,up,trend[]}], queue:[{domain,count}] }`.
※ `delta` 계산(전일/전주 대비)은 가능 범위만 — 불가하면 `null` 두고 콘솔이 숨김 처리.

## B-2. `GET /api/web/admin/inbox` (pending union)
`src/app/api/web/admin/inbox/route.ts` 신설. query: `domain` / `severity` / `sort` / `cursor`.

union 소스(각 도메인 미처리 → 공통 형태로 매핑):
- `reports` = game_reports 미처리 → severity err
- `community` = community_posts.status(검토대기/신고) → warn
- `teams` = Team.status(검수대기) → warn
- `payments` = payments.refund_status(요청) → err
- `courts` = court_submissions.status(대기) → blue
- `organizations` = organizations.status="pending" → blue

각 item: `{ id:"<domain>:<refId>", domain, route, severity, priority, title, sub, created_at, snoozed_until:null }`.
- `snoozed_until` 은 지금은 항상 `null`(AdminInboxState 미도입 — S3 후 LEFT JOIN).
- 정렬 `priority`: severity(err>warn>blue)→created_at asc / `age`: created_at asc.
- 페이지네이션: cursor 기반(없으면 단순 take 50 + next_cursor:null 가능).

## B-3. 검증·기록
- `npm run build` 통과 + 두 엔드포인트 curl raw 응답 첨부(키 snake_case 확인).
- 권한: 비-super_admin 401/403 확인.
- `.claude/scratchpad.md` 1줄 + 신규 라우트 → `knowledge/architecture.md`.
- **후속(S1)**: 매너/제안/팀 처리 뮤테이션 3건 신규 + 페이지 바인딩. **S3**: `AdminInboxState` 1테이블(가드+승인). 별도 프롬프트로.

---

## 다음 단계
1. 본 회신 Part A → 디자인 클로드 전달(계약 snake_case·games enum·RBAC 정정 반영)
2. Part B → CLI 에서 S2 2 API 박제
3. 이후 S1(처리 뮤테이션 3 + 바인딩) / S3(snooze 테이블) 프롬프트 순차 제공
