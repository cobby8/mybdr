# CLI용 프롬프트 (S2 — 신규 집계 2 API)

> subin 브랜치. **스키마 변경 0 · 읽기 전용.** 기존 가드·apiSuccess·prisma 재사용.

## 공통 규약
- 가드: `getWebSession()` + `session.role === "super_admin"` 아니면 `forbidden()` (= `src/app/api/admin/plans/route.ts` 의 `requireAdmin()` 패턴 카피).
- 응답: `apiSuccess(data)` — 코드 camelCase 써도 **자동 snake_case 출력**. 신규 모델/필드 0.
- 검증: 각 엔드포인트 curl 1회 raw 응답 캡처 → 키 snake_case 확인. 비-super_admin 403 확인. `npm run build` 통과.

## 1) `GET /api/web/admin/overview`
`src/app/api/web/admin/overview/route.ts` 신설. (기존 `/web/admin/dashboard`=심판 전용 → 분리)
- `kpis[]`: new_users(`User` createdAt≥오늘0시 KST) · active_games(`games.status in [1,2]`) · month_revenue(`payments.aggregate(_sum:amount, where:{ status:"paid", paid_at≥이번달1일 })`) · recruiting_tournaments(대회 모집군 count).
- 각 `trend[]` = 최근 7일 day-bucket count. `delta` 계산 불가 시 `null`.
- `queue[]`: 도메인별 미처리 count — game_reports · community_posts(검토대기) · Team(검수대기) · payments(refund_status=요청) · court_submissions(대기) · organizations(status=pending).
- 응답(snake): `{ kpis:[{key,value,unit,delta,up,trend}], queue:[{domain,count}] }`.

## 2) `GET /api/web/admin/inbox`
`src/app/api/web/admin/inbox/route.ts` 신설. query: `domain`/`severity`/`sort`/`cursor`.
- union 소스→공통형: reports(game_reports,err) · community(community_posts 검토대기,warn) · teams(Team 검수대기,warn) · payments(refund_status=요청,err) · courts(court_submissions 대기,blue) · organizations(pending,blue).
- item: `{ id:"<domain>:<refId>", domain, route, severity, priority, title, sub, created_at, snoozed_until:null }`.
- 정렬: `priority`=severity(err>warn>blue)→created_at asc / `age`=created_at asc. take 50 + `next_cursor`(없으면 null).
- `snoozed_until` 은 지금 항상 null (AdminInboxState=S3 후 LEFT JOIN).

## 기록
- `.claude/scratchpad.md` 1줄 + 신규 라우트 → `knowledge/architecture.md`.
- 완료 후 curl raw 응답(2개)을 회신에 첨부 → 디자인 클로드 목업→fetch 교체용.

## 다음(별도 프롬프트)
- **S1**: 매너/제안/팀 처리 뮤테이션 3건 + 페이지 바인딩.
- **S3**: `AdminInboxState`(snooze 폴리모픽 1테이블) — DB UPDATE라 승인+가드.
