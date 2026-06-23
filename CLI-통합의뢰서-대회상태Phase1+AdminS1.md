# CLI 통합 의뢰서 — ① 대회 상태 Phase 1 → ② Admin Console S1

> 이 문서 하나를 Claude CLI 에 붙여넣기. **subin 브랜치 · 두 작업 모두 스키마 변경 0 · 무위험(읽기/단건 status update).**
> 순서: **STAGE 1(대회 상태) 먼저 → STAGE 2(Admin S1).** 독립적이라 따로 커밋.

---

## 0. 공통 규약 (두 STAGE 공통)
- 하루 작업 루틴: `dev` pull → `subin` 머지 후 작업.
- API 가드(어드민): `getWebSession()` + `session.role==="super_admin"` 아니면 `forbidden()` (`api/admin/plans/route.ts` 패턴).
- 응답 `apiSuccess()` → **자동 snake_case**. 입력 Zod. 처리 뮤테이션은 `adminLog()`(`admin_logs`) 기록.
- **운영 DB UPDATE 는 단건 status 만** — destructive 아님. `prisma migrate`/`db push` **금지**(스키마 변경 0).
- 단계별: `scratchpad.md` 1줄 + 신규 라우트 `architecture.md` + 결정 `decisions.md`. 미푸시 커밋 알림.

---

# STAGE 1 — 대회 상태 표시 레이어 영구 수정 (DB 0)

> 문제: 상태가 DB `status` 문자열만 보고 날짜를 안 봐서, 종료일이 지나도 "모집 중" 노출. (실측: published 53 중 50건이 종료일 경과 — 공지전용 47 + 실진행 3)
> 해법: 표시 레이어에 **날짜 기반 보정** 추가. **DB 무손상 · 재발 영구 방지.**

## 1-1. 공통 함수 — `src/lib/constants/tournament-status.ts` 에 추가
```ts
const FINAL_STATUSES = ["completed","ended","closed","cancelled"];
const PREOPEN_STATUSES = ["draft","upcoming"];
/** DB status + 날짜 → 표시용 실질 상태 키. 공개 화면 전용(admin 제외). */
export function effectiveTournamentStatus(
  status: string|null|undefined,
  startDate: Date|string|null|undefined,
  endDate: Date|string|null|undefined,
): string {
  const s = status ?? "draft";
  if (FINAL_STATUSES.includes(s) || PREOPEN_STATUSES.includes(s)) return s;
  const ref = endDate ?? startDate;
  if (ref) {
    const d = new Date(ref);
    if (!isNaN(d.getTime())) {
      const endOfDay = new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59,999);
      if (endOfDay.getTime() < Date.now()) return "completed"; // 종료일 경과
    }
  }
  return s;
}
```
- 규칙: FINAL/준비중은 날짜 무관 그대로. 그 외(접수중/진행중)는 **종료일(없으면 시작일) 경과 시 'completed'**. 종료일 **당일은 미종료**(23:59:59까지). 날짜 둘 다 없으면 원본.

## 1-2. 적용 — 공개 화면만 (admin 제외)
- **목록**: `v2-tournament-list.tsx` 의 `deriveV2Status` 진입부 `const st = effectiveTournamentStatus(t.status, t.start_date, t.end_date).toLowerCase();` 로 교체 → 카드 배지+탭+카운트 동시 정상화.
- **상세/사이드바/스티커**: `v2-tournament-hero.tsx`·`tournament-hero.tsx`·`v2-registration-sidebar.tsx`·`registration-sticky-card.tsx` 의 `TOURNAMENT_STATUS_LABEL[status]` → `TOURNAMENT_STATUS_LABEL[effectiveTournamentStatus(status,startDate,endDate)]`.
- **캘린더/주간/프로필/사이트템플릿**: `calendar-view.tsx`·`week-view.tsx`·`profile/_components/tournaments-section.tsx`·`site-templates/classic.tsx` 동일 보정(날짜 있으면).
- **제외(raw 유지)**: `(admin)/tournament-admin/*`·`(admin)/admin/tournaments/*` — 운영자는 실제 저장 status 봐야 함. (보조로 "기한 경과" 뱃지 추가만 허용)

## 1-3. 검증
- 단위 테스트 `src/__tests__/lib/effective-tournament-status.test.ts`: published+어제end→completed / +오늘end→published / +내일end→published / in_progress+과거→completed / cancelled+과거→cancelled / draft+과거→draft / end null+start과거→completed / 둘다 null→원본.
- `npm run build`. 로컬 3001 `/tournaments`: 공지전용 47+실진행 3이 "종료"로 이동, "모집 중" 카운트 감소 / admin 목록은 raw 유지 확인.
- 시각 패턴 변경 아님 → BDR-current 동기화 불필요. 커밋 `fix(tournaments): 종료일 경과 대회 표시 보정 (effectiveTournamentStatus)`.
- (후속 별도) Phase 2=실진행 3건+열혈 DB completed+우승팀 / Phase 3=공지전용 매치0 날짜 백필. → `대회상태-Phase2/3-CLI프롬프트.md`.

---

# STAGE 2 — Admin Console S1: 처리 뮤테이션 (DB 0)

> S2(overview·inbox 2 API)는 이미 main(8753d27). 인박스가 "조회"만 됨 → 각 도메인 **처리(resolve)** API 신설.
> 도메인 실제 status: game_reports=`submitted`·community_posts=`draft`·court_submissions=`pending`·organizations=`pending`·payments.refund_status=`requested`·teams=없음(큐0).

## 2-1. 매너 검토 — `POST /api/web/admin/game-reports/[id]/resolve`
- `{ action:"resolve"|"dismiss", memo?, notify? }` → `game_reports.status` `submitted`→`resolved`|`dismissed`. memo=adminLog.

## 2-2. 제안·피드백 — `POST /api/web/admin/suggestions/[id]/respond`
- `{ status:"in_progress"|"resolved"|"dismissed", admin_response?, notify? }` → `suggestions` status + `admin_response` + `responded_by_id=session.sub` + `responded_at=now`. (모델 완전체 — 신규 필드 0)

## 2-3. 커뮤니티 — `POST /api/web/admin/community/[id]/moderate`
- `{ action:"hide"|"restore", reason? }` → `community_posts.status` `hidden`|`published`. 기존 `/api/web/community/[id]` 가 admin status update 지원 시 게이트로 재사용.

## 2-4. 팀 검수 — ✅ 방식 확정: (a) status 컨벤션 (스키마 0)
- **결정(2026-06-16)**: `Team.status="pending_review"` 컨벤션 도입. **스키마 변경 0.**
- 작업:
  1. **검수 API** `POST /api/web/admin/teams/[id]/review` `{ action:"approve"|"reject" }` → `Team.status` `pending_review`→`active`|`rejected`. 가드/adminLog 공통.
  2. **세팅 지점(큐가 실제로 채워지려면 필수)**: 팀 **생성** + **로고/대표정보 변경** 흐름에서 `Team.status="pending_review"` 세팅. (이 지점이 없으면 큐는 영원히 0 — 검수 API만 만들고 끝내지 말 것.)
  3. **인박스 teams 소스 활성**: `inbox` 라우트에 `Team.status="pending_review"` union 추가 + `overview.queue.teams` 를 0 고정 해제(해당 count 로 교체).
- ⚠️ **Team.status 소비처 확인**: `pending_review` 가 공개 팀 목록/필터에서 어떻게 취급되는지 grep(`status:"active"` 필터 등). 검수 전 **비공개가 의도면 OK**, 아니면 노출 룰 보정. 기존 active 팀은 그대로(소급 0).

## 2-5. (선택) 통합 디스패처 — `POST /api/web/admin/inbox/[id]/resolve`
- `id="<domain>:<refId>"` 파싱 → 위임: organizations=기존 approve/reject · payments=기존 `/payments/[id]/refund` · court_submissions=기존 `/admin/court-submissions/[subId]` · game_reports=2-1 · community_posts=2-3 · teams=2-4(결정 후).

## 2-6. 검증
- 각 API curl raw(snake) + 비-super_admin 403 + Zod + adminLog 기록 확인. `npm run build`.
- 커밋 `feat(admin): Admin Console S1 처리 뮤테이션`. 완료 후 엔드포인트 목록 회신 → 디자인이 콘솔 '보류 라벨→처리 버튼' 전환(넘기기=snooze는 S3).
- `decisions.md`: 팀 검수 워크플로 결정 기록.

---

## 3. 순서 요약
```
STAGE1(대회상태 Phase1) ─커밋─▶ STAGE2 S1(2-1·2-2·2-3·2-4·2-5) ─커밋
```
- STAGE 1 = 즉시(무위험). STAGE 2 = 처리 API 5종(팀 검수 방식 (a) 확정 — 게이트 해제).
- ⚠️ 팀 검수(2-4)는 검수 API + **세팅 지점(생성/로고변경)** + 인박스 union 3개를 한 묶음으로(하나만 빠지면 큐 0).
- 미푸시 커밋 알림 + 단계별 기록 필수.
```
