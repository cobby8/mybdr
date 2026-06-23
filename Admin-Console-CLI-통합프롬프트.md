# Admin Console — CLI 통합 프롬프트 (S1→S3→S4)

> 이 문서 하나를 Claude CLI 에 붙여넣으면 됨. subin 브랜치. 단계별 게이트(승인/결정) 표시.
> **S2(overview·inbox 2 API)는 이미 main 반영(8753d27) — 재구현 금지.** 본 작업은 그 위에 처리/snooze/설계과제를 얹는다.

---

## 0. 확정 사실 (재조사 불필요 — 그대로 사용)

- **가드**: `getWebSession()` + `session.role==="super_admin"` 아니면 `forbidden()`. (`src/app/api/admin/plans/route.ts` 의 `requireAdmin()` 패턴)
- **응답**: `apiSuccess()` → 키 **자동 snake_case** 변환. 코드 camelCase 가능, 프론트 계약은 snake.
- **감사**: 처리 뮤테이션은 `adminLog()`(`src/lib/admin/log.ts`→`admin_logs`) 기록.
- **검증입력**: Zod. **알림**: `notify` 시 `notifications` 발송(actionUrl).
- **도메인 실제 status 값** (인박스 소스): game_reports=`submitted` · community_posts=`draft` · court_submissions=`pending` · organizations=`pending` · payments.refund_status=`requested` · **teams=없음(큐 0 고정)**.
- **games.status enum**: 1=모집중·2=확정·3=완료·4=취소·0=기본 (`src/lib/constants/game-status.ts`).
- **payments 완료**: `status="paid"` + `paid_at`.

---

## 1. STAGE S1 — 처리 뮤테이션 (스키마 0, 운영영향 단건 update)

각 신규 라우트는 §0 가드/apiSuccess/adminLog/Zod 공통 적용.

**1) 매너 검토** `POST /api/web/admin/game-reports/[id]/resolve`
- 입력 `{ action:"resolve"|"dismiss", memo?, notify? }` → `game_reports.status` `submitted`→`resolved`|`dismissed`. memo는 adminLog.

**2) 제안·피드백** `POST /api/web/admin/suggestions/[id]/respond`
- 입력 `{ status:"in_progress"|"resolved"|"dismissed", admin_response?, notify? }` → `suggestions` status + `admin_response` + `responded_by_id=session.sub` + `responded_at=now`. (모델 완전체 — 신규 필드 0)

**3) 커뮤니티** `POST /api/web/admin/community/[id]/moderate`
- 입력 `{ action:"hide"|"restore", reason? }` → `community_posts.status` `hidden`|`published`. 기존 `/api/web/community/[id]` 가 admin status update 지원 시 admin 게이트로 재사용.

**4) 🚦 팀 검수 — 결정 게이트 (수빈 승인 후만 박제)**
- 현재 `Team.status` 기본 `active`, "검수 대기" 상태 부재 → `queue.teams=0` 고정.
- **택1 필요**: (a) `Team.status="pending_review"` 컨벤션(스키마 0) + 팀 생성/로고변경 시 세팅 / (b) `verified` flag(스키마 1필드, S3와 함께).
- 결정 후: `POST /api/web/admin/teams/[id]/review` `{ action:"approve"|"reject" }` (status→active|rejected) + 인박스 teams 소스 활성. **결정 전엔 teams 큐 0 유지 + 본 항목 보류.**

**5) (선택) 통합 디스패처** `POST /api/web/admin/inbox/[id]/resolve`
- `id="<domain>:<refId>"` 파싱 → 위임: organizations=기존 approve/reject · payments=기존 `/payments/[id]/refund` · court_submissions=기존 `/admin/court-submissions/[subId]` · game_reports=위 1 · community_posts=위 3 · teams=위 4(결정 후).

**S1 검증**: 각 API curl raw(snake 확인) + 비-super_admin 403 + Zod + `npm run build`. 커밋 `feat(admin): Admin Console S1 처리 뮤테이션`.

---

## 2. STAGE S3 — 인박스 snooze 테이블 (🚦 스키마 변경 — 승인 게이트)

> CLAUDE.md §DB 가드: **schema diff 수빈 검토 후** db push. 신규 테이블 ADD = 무중단·데이터파괴 0.

**1) 모델 추가** `prisma/schema.prisma`
```prisma
model AdminInboxState {
  id            String    @id @default(cuid())
  ref_type      String    // game_reports|community_posts|teams|payments|court_submissions|organizations
  ref_id        String
  snoozed_until DateTime?
  resolved_at   DateTime?
  resolved_by   String?
  memo          String?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  @@unique([ref_type, ref_id])
}
```
→ schema diff 출력 → **수빈 승인** → `prisma db push` → 사후 `count`/테이블 확인.

**2) 인박스 반영** `GET /api/web/admin/inbox`
- item `id` 로 `AdminInboxState` batch 조회 → `snoozed_until` 주입. `snoozed_until>now` & `resolved_at!=null` **기본 제외**(`?include_snoozed=1` 시 포함).

**3) 쓰기** `POST /api/web/admin/inbox/[id]/snooze` `{ until:ISO8601 }` → `upsert(ref_type_ref_id, snoozed_until)`. S1 디스패처 resolve 시 `resolved_at/resolved_by/memo` 기록.

**4) (선택) `CommunityReport`** — 정확한 커뮤니티 신고 큐. 미도입 시 S1 §3 숨김/복원으로 운영.
```prisma
model CommunityReport { id String @id @default(cuid()) target_type String target_id String reporter_id String reason String status String @default("pending") created_at DateTime @default(now()) }
```

**S3 검증**: snooze 건 기본목록 제외 + include_snoozed 복귀. `decisions.md`(폴리모픽 inbox state) + `architecture.md`. **`migrate reset`/`--accept-data-loss` 금지.**

---

## 3. STAGE S4 — 설계 과제 (진단 먼저 → 결정 → 박제)

각 항목 grep/SELECT 진단 결과 보고 후 결정.

- **4-A 대회 통합진입(中)**: 콘솔 '대회 운영'→`/admin/tournaments`→개별 대회 셋업 deep-link. 라우팅·링크 통합만(데이터 기존). 권한=4-C.
- **4-B 홈 배너편성(中~高)**: `ad_placements` 스키마 + 홈이 배너 읽는 지점 grep → 홈 슬롯을 placement code 로 정의 + 편성 UI. placement 체계·노출 우선순위 결정(디자인 협의).
- **4-C RBAC(中)**: 실재 `super_admin`/`association_admin` 2개. 콘솔 4역할 위해 `court_operator`/`content_admin` 신규 도입 여부 결정 → `roles.ts`/`is-super-admin.ts` role→그룹 매핑 확장 → 신규 admin API 가드를 role별 허용으로 확장. **회귀(super_admin 전권 보존) 확인 필수.**

**S4 검증**: 항목별 진단 보고 + `decisions.md`(RBAC/placement). 권한·홈노출은 운영영향 큼 → 단계 배포.

---

## 4. 순서 / 게이트 요약

```
S1(1~3,5) 즉시 박제 ──▶ [게이트] 팀 검수 방식 결정 ──▶ S1-4 ──▶ [게이트] S3 schema diff 승인 ──▶ S3 ──▶ S4(진단先)
```
- 공통 기록: 단계별 `scratchpad.md` 1줄 + 신규라우트 `architecture.md` + 결정 `decisions.md`. 미푸시 커밋 알림.
- 완료 후 엔드포인트 목록 회신 → 디자인 클로드가 콘솔 처리/넘기기 버튼 바인딩.
```
