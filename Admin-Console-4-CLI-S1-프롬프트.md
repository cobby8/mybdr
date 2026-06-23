# CLI용 프롬프트 ④ — S1: 처리 뮤테이션 (인박스 resolve)

> subin 브랜치. **스키마 변경 0**(전부 기존 status 필드 update). 가드·apiSuccess·adminLog 재사용.
> 목적: S2 인박스가 "조회"만 됨 → 각 도메인 **처리(resolve)** API 신설로 운영자가 콘솔에서 처리 가능하게.

## 공통 규약
- 가드: `getWebSession()` + `session.role==="super_admin"` 아니면 `forbidden()`.
- 응답: `apiSuccess()`(자동 snake_case). 입력검증 Zod. 처리 후 **`adminLog()`**(`admin_logs`)로 감사 기록.
- 알림(옵션): `notify:true` 면 대상 사용자에 `notifications` 발송(actionUrl). 기본 true.
- 운영 영향: 단건 status update만. destructive 아님 → 가드 내 정상 진행.

## 1) 매너 검토 — `POST /api/web/admin/game-reports/[id]/resolve`
- 입력: `{ action: "resolve"|"dismiss", memo?, notify? }`
- 동작: `game_reports.status` `submitted` → `resolved`(처리) | `dismissed`(반려). `resolved_at`/`resolved_by` 없으면 추가 불필요(메모는 adminLog).
- (제재는 별도 — 본 API는 신고 처리까지. 사용자 정지는 §사용자관리 경로 재사용.)

## 2) 제안·피드백 — `POST /api/web/admin/suggestions/[id]/respond`
- 입력: `{ status: "in_progress"|"resolved"|"dismissed", admin_response?, notify? }`
- 동작: `suggestions` 의 `status` update + `admin_response` + `responded_by_id=session.sub` + `responded_at=now`. (모델 완전체 — 신규 필드 0)

## 3) 커뮤니티 — `POST /api/web/admin/community/[id]/moderate`
- 입력: `{ action: "hide"|"restore", reason? }`
- 동작: `community_posts.status` → `hidden` | `published`. 기존 `/api/web/community/[id]` 가 admin status update 를 지원하면 그것을 admin 게이트로 재사용, 아니면 본 신규 라우트.
- ⚠️ 인박스의 community 소스는 현재 `status="draft"`(임시저장) 기준 — **신고 큐 아님**. 정확한 신고 큐는 S3 `CommunityReport` 후. 본 API는 숨김/복원 처리용.

## 4) 팀 검수 — **워크플로 정의 필요 (결정 항목)**
- 현재 `Team.status` 기본 `active`, **"검수 대기" 상태가 없음** → `queue.teams=0` 고정 이유.
- 켜려면 택1(수빈 결정):
  - (a) `Team.status` 에 `pending_review` 컨벤션 도입 + 팀 생성/로고변경 시 세팅 → 검수 큐 활성. **스키마 0**(문자열 컨벤션).
  - (b) 별도 `verified` flag 추가(스키마 1필드) — S3와 함께.
- 결정 후: `POST /api/web/admin/teams/[id]/review` `{ action:"approve"|"reject" }` (`status` → active | rejected). **결정 전까지 teams 큐 0 유지.**

## 5) (선택) 통합 디스패처 — `POST /api/web/admin/inbox/[id]/resolve`
- `id="<domain>:<refId>"` 파싱 → 도메인별 위임:
  | domain | 위임 |
  |---|---|
  | organizations | 기존 `/admin/organizations/[id]/approve`\|`/reject` |
  | payments | 기존 `/payments/[id]/refund` |
  | court_submissions | 기존 `/admin/court-submissions/[subId]` |
  | game_reports | 본 §1 |
  | community_posts | 본 §3 |
  | teams | 본 §4(결정 후) |
- 콘솔이 단일 엔드포인트로 처리 가능. 미구현 시 콘솔이 도메인별 직접 호출해도 됨.

## 검증·기록
- 각 API curl raw 응답 확인(snake_case) + 비-super_admin 403 + Zod 검증. `npm run build`.
- `adminLog` 기록 확인. `.claude/scratchpad.md` 1줄 + `knowledge/architecture.md`(신규 라우트) + `decisions.md`(팀 검수 워크플로 결정).
- 완료 후 엔드포인트 목록 회신 → 디자인이 콘솔 처리/넘기기 버튼 바인딩(넘기기=snooze는 S3).
