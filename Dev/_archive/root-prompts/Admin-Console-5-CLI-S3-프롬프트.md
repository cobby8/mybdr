# CLI용 프롬프트 ⑤ — S3: 인박스 snooze 테이블 (+선택 커뮤니티 신고)

> subin 브랜치. **스키마 변경 有 → CLAUDE.md §DB 가드 필수**: schema diff 사용자 검토 후 진행. 신규 테이블(ADD)이라 무중단·데이터파괴 0이지만 **승인 받고** 진행.

## 1) `AdminInboxState` — 폴리모픽 1테이블 (snooze/resolved 상태 덧입힘)
```prisma
model AdminInboxState {
  id            String    @id @default(cuid())
  ref_type      String    // "game_reports"|"community_posts"|"teams"|"payments"|"court_submissions"|"organizations"
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
- **장점**: 6개 도메인 모델 무변경. 인박스 union 시 `(ref_type, ref_id)` 로 LEFT JOIN.
- 적용 절차(가드): ① `prisma/schema.prisma` 에 모델 추가 → ② **schema diff 수빈 검토** → ③ 승인 후 `prisma db push`(신규 테이블 ADD = 무중단) → ④ 사후 `\d admin_inbox_state` 또는 count 확인.

## 2) 인박스 라우트에 snooze 반영 — `GET /api/web/admin/inbox`
- 각 도메인 item 의 `id="<domain>:<refId>"` 로 `AdminInboxState` 조회(batch) → `snoozed_until` 주입.
- **`snoozed_until > now` 항목은 기본 제외**(쿼리 `?include_snoozed=1` 시 포함). `resolved_at != null` 도 제외.
- 응답 `snoozed_until` 을 실제 값으로(현재 null 고정 해제).

## 3) snooze / 처리상태 쓰기 — `POST /api/web/admin/inbox/[id]/snooze`
- 입력: `{ until: ISO8601 }` (예: +1d). `id` 파싱 → `AdminInboxState.upsert({ where:{ref_type_ref_id}, ... snoozed_until })`.
- `POST .../resolve`(S1 디스패처)도 처리 시 `AdminInboxState.resolved_at/resolved_by/memo` 기록(감사 일원화).
- 가드/응답/adminLog = S1 공통 규약 동일.

## 4) (선택) `CommunityReport` — 커뮤니티 전용 신고 큐
```prisma
model CommunityReport {
  id          String   @id @default(cuid())
  target_type String   // "post"|"comment"
  target_id   String
  reporter_id String
  reason      String
  status      String   @default("pending") // pending|actioned|dismissed
  created_at  DateTime @default(now())
}
```
- 도입 시: 인박스 community 소스를 `community_posts.status="draft"`(부정확) → **`CommunityReport(status=pending)`** 로 교체 → "신고 N건" 정확. 사용자 신고 제출 경로도 신설 필요.
- 미도입 시: S1 §3 숨김/복원 처리로 운영(‘직접 검토 큐’).

## 검증·기록
- schema diff 캡처 + 승인 로그. db push 후 사후검증(테이블 생성·count 0).
- snooze 동작: snooze 건이 기본 목록에서 빠지는지 + `include_snoozed=1` 시 복귀.
- `knowledge/decisions.md`(폴리모픽 inbox state 채택) + `architecture.md` + scratchpad 1줄.
- ⚠️ `prisma migrate reset`/`db push --accept-data-loss` 금지. 신규 테이블 ADD만.
