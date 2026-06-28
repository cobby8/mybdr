# 코트 제보 승인 체계 — 기획설계 (P1-a)

> 근거: `Dev/mock-data-absent-admin-plan-2026-06-14.md` §P1-a / 본 문서는 **read-only 실측 설계**(코드·DB·push 변경 0).
> 핵심 적용 lesson: [2026-06-14] "테이블 prefix-grep 함정"(team_match_requests 누락 사례) → 코트 관련 테이블 **13개 전수 실측** 후 재사용 가능성 판정.

---

## (a) 결론 — 기존 재사용 vs 신규

### ★ 결론: **신규 테이블 1개 ADD-only 필요** (`court_submissions`). 단, **승인 큐/반영 흐름은 기존 패턴 100% 재사용**.

admin-plan의 "court_submissions 신규" 판단은 **실측으로도 정당**하다. prefix-grep 함정을 피해 코트 테이블 13개를 전수 확인했으나, "**신규 코트 등록 제보**" 의도와 정합하는 재사용 테이블은 없다.

### 코트 관련 테이블 전수 실측 (schema + populated count)

| 모델 | 행수 | 핵심 필드 | 의도 | 신규 코트 제보 재사용? |
|------|------|----------|------|----------------------|
| `court_infos` (L1222) | **672 (전부 active)** | 코트 전체 속성 + 리뷰/대관/체크인 생태계 | **코트 메인 테이블** | △ = **승인 시 INSERT 타깃** (제보 자체 보관소는 아님) |
| `courts` (L1449) | **0** | 레거시(Rails) 단순 코트 | games/tournaments FK 연결용 레거시 | ✗ 사용 안 됨(0행). **무시** |
| `court_edit_suggestions` (L1388) | 0 | `court_info_id`(NOT NULL) + changes JSON + status(pending/approved/rejected) + reviewed_by | **기존 코트** 위키식 수정 제안 | ✗ **의도 불일치** (아래 ※1) |
| `court_reports` (L1367) | 0 | `court_info_id`(NOT NULL) + report_type + status(active/resolved/dismissed) | **기존 코트** 파손 신고 | ✗ 의도 불일치(신고 ≠ 등록) |
| `court_reviews` (L1334) | — | court_info_id + rating | 리뷰 | ✗ |
| `court_checkins`/`court_sessions`/`court_bookings`/`court_ambassadors`/`court_events*` | — | 모두 `court_info_id` 종속 | 코트 부속 기능 | ✗ |

**※1 — `court_edit_suggestions` 재사용 불가 핵심 사유** (의도 명확히 다름):
- `court_info_id`가 **NOT NULL FK** → "아직 존재하지 않는 코트"를 가리킬 수 없음. 신규 제보는 정의상 court_info_id가 없다.
- 의미: suggestion = "이 코트의 바닥재를 우레탄으로 고쳐주세요"(기존 코트 보정). 제보 = "이 코트가 DB에 없으니 새로 등록해주세요"(신규 생성). **반대 방향**.
- → scrim 사례(team_match_requests 재사용)와 달리, 코트 제보는 억지 매핑 시 FK 위반. **신규 테이블이 정답**.

**재사용 가능한 것 = 테이블이 아니라 "흐름/코드"**:
- `court_edit_suggestions` 승인 API(`/api/web/courts/[id]/suggestions/[sugId]/route.ts`)가 **제보 승인의 정확한 템플릿**: pending 조회 → 트랜잭션(court_infos 반영 + status 전환 + reviewed_by/at + XP) → apiSuccess. 이 패턴을 그대로 답습.
- `/admin/courts` page.tsx + admin-courts-content.tsx에 **이미 "수정 제안"·"앰배서더" 승인 탭이 완성**되어 있음. "제보 검토" 탭은 **동형 4번째 탭 추가**로 끝남(신규 화면 불필요).
- 승인 시 INSERT = `createCourtAction`의 `prisma.court_infos.create(...)` 패턴 재사용.

---

## (b) 데이터 모델 — 신규 `court_submissions` (ADD-only nullable·무중단)

### schema diff 미리보기 (push ❌ — 사용자 승인 전제)

```prisma
// 신규 코트 등록 제보 — 사용자가 DB 미등록 코트를 제보 → 관리자 승인 시 court_infos 생성
// court_edit_suggestions(기존 코트 수정 제안)와 구분: submissions는 "아직 없는 코트의 신규 등록"
model court_submissions {
  id              BigInt    @id @default(autoincrement())
  user_id         BigInt    // 제보자
  // 제보 입력 (court_infos 매핑 대상 — 폼 필드와 1:1)
  name            String    @db.VarChar          // 코트 이름 (필수)
  region          String    @db.VarChar          // 지역 (예: "서울 중구")
  court_type      String    @db.VarChar          // "indoor" | "outdoor" | "3x3" (폼 select)
  address         String    @db.VarChar          // 상세 주소 (필수)
  operating_hours String?                        // 운영 시간 (자유 입력, 선택)
  fee_text        String?                        // 이용료 자유 입력 (예: "무료" / "시간당 5,000원")
  amenities       Json      @default("[]")        // 편의시설 키 배열 (shower/parking/indoor/light/locker/rental)
  photos          Json      @default("[]")        // 사진 URL 배열 (최대 5)
  description     String?                         // 추가 설명
  // 승인 워크플로우 (court_edit_suggestions 패턴 답습)
  status          String    @default("pending") @db.VarChar  // pending | approved | rejected
  reviewed_by     BigInt?                         // 심사 관리자 ID
  reviewed_at     DateTime? @db.Timestamp(6)
  review_note     String?                         // 반려 사유 / 메모
  // 승인 시 생성된 코트 (역참조 — 내 기여 count·중복 승인 방지)
  approved_court_info_id BigInt?
  created_at      DateTime  @default(now()) @db.Timestamp(6)
  updated_at      DateTime  @updatedAt @db.Timestamp(6)

  submitter User  @relation("court_submission_submitter", fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  reviewer  User? @relation("court_submission_reviewer", fields: [reviewed_by], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([status, created_at])   // 관리자 검토 큐 (pending 최신순)
  @@index([user_id])              // 내 제보 내역 / 내 기여 count
}
```

**무중단 보장 근거**:
- 신규 테이블 CREATE 1 + INDEX 2뿐. 기존 테이블 ALTER/DROP/DELETE **0**. `prospectus_ai_analysis`/`court_bookings` ADD 선례(architecture.md, 운영 무중단 100%)와 동형.
- `User` 모델에 **역참조 relation 2줄 추가 필요**(`court_submission_submitter`/`reviewer`) — court_edit_suggestions가 이미 동일 패턴(suggestion_submitter/reviewer)으로 User에 박제돼 있어 **컬럼 변경 0**(relation 메타만).
- `prisma db push` 시 `--accept-data-loss` 불필요(순수 ADD). diff는 사용자 검토 후 진행.

**필드 설계 근거**(폼 ↔ 모델 1:1, court-submit-form.tsx 실측):
| 폼 필드 | submissions 컬럼 | 승인 시 court_infos 매핑 |
|---------|-----------------|-------------------------|
| 코트 이름* | name | name |
| 지역* | region | city/district 파싱 |
| 코트 유형* | court_type | court_type (indoor/outdoor) |
| 상세 주소* | address | address |
| 운영 시간 | operating_hours | operating_hours(Json) 또는 metadata |
| 이용료 | fee_text | is_free/fee 파싱(또는 metadata 보존) |
| 편의시설[] | amenities | facilities(Json) |
| 사진[] | photos | photo_url(첫장) + metadata.photos |
| 추가 설명 | description | description |

> 위경도: 폼에 좌표 입력 없음 → 승인 시 `createCourtAction`처럼 기본 좌표(서울시청) 후 관리자 보정, 또는 카카오 주소→좌표 변환(후속). 제보 단계는 좌표 미수집.

---

## (c) 단계별 실행 계획

🎯 **목표**: `/courts/submit` 정적폼(현재 noop) → 실제 제보 INSERT + "검토 중" 안내 / `/admin/courts`에 "제보 검토" 탭 추가(승인 시 court_infos 생성).

📍 **만들 위치와 구조**

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `prisma/schema.prisma` | `court_submissions` 모델 + User relation 2줄 | 수정(ADD) |
| `src/app/api/web/courts/submissions/route.ts` | POST(제보 INSERT, 로그인 가드 + Zod) / GET(내 제보 내역) | 신규 |
| `src/app/(web)/courts/submit/_form/court-submit-form.tsx` | noop → fetch POST + "검토 중" 완료 화면 분기 | 수정 |
| `src/app/api/web/admin/court-submissions/[subId]/route.ts` | PATCH(승인→court_infos.create / 반려→status) — suggestions route 패턴 답습 | 신규 |
| `src/app/(admin)/admin/courts/page.tsx` | pending submissions 조회 + 직렬화 추가 | 수정 |
| `src/app/(admin)/admin/courts/admin-courts-content.tsx` | "제보 검토" 4번째 탭(SubmissionsTab) 추가 | 수정 |

🔗 **기존 코드 연결**
- 관리자 화면: admin-courts-content.tsx의 SuggestionsTab/AmbassadorsTab과 **동형 탭**으로 추가 → 신규 레이아웃 0. 시안 박제 대상 아님(E영역 자체셸, 토큰만 일치).
- 승인 INSERT: `createCourtAction`의 `court_infos.create` + `adminLog` 패턴 그대로.
- XP: `XP_REWARDS`(gamification.ts)에 `court_submit` 키 추가(wiki_edit=10 동형) → `addXP(submission.user_id, ...)`.
- 알림(선택): `createNotification`(notifications/create.ts) — 승인/반려 시 제보자 통지.

📋 **실행 계획** (P1-a 범위, 최대 단계)

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| 1 | schema `court_submissions` ADD + User relation 2줄 → **사용자에게 db diff 검토 요청 후** push | developer(+사용자 승인) | 없음 |
| 2 | 사용자 제출 API(POST/GET `/courts/submissions`) + court-submit-form 실연결 | developer | 1 |
| 3 | 관리자 승인 큐 API(PATCH) + /admin/courts "제보 검토" 탭 | developer | 1 |
| 4 | (선택) XP `court_submit` 상수 + 승인 알림 connect | developer | 2,3 |
| 5 | 검증 | tester + reviewer (병렬) | 2~4 |

> 시상(P1-b)은 별도 작업. 본 문서는 P1-a 한정.

---

## (d) 승인 시 court INSERT 경로

```
[사용자] /courts/submit 폼 제출
  → POST /api/web/courts/submissions (getWebSession 가드)
  → court_submissions INSERT (status=pending)
  → 폼 "검토 중(평균 2~3일)" 완료 화면 + (선택)알림

[관리자] /admin/courts "제보 검토" 탭 (status=pending 큐)
  → 상세 확인 → 승인 클릭
  → PATCH /api/web/admin/court-submissions/[subId]  (super_admin 가드)
  → $transaction:
      1) court_infos.create({ name/address/city/district/court_type/facilities/...,
                              user_id=제보자, status="active", 기본좌표 })
      2) submission.update({ status="approved", reviewed_by, reviewed_at,
                              approved_court_info_id=새코트.id })
      3) addXP(submission.user_id, XP_REWARDS.court_submit, "court_submit")
      4) adminLog("court.submission.approve", ...)
      5) (선택) createNotification(제보자, "코트 등록 완료")
  → router.refresh()

[반려] PATCH action="reject"
  → submission.update({ status="rejected", reviewed_by/at, review_note=사유 })
  → court_infos INSERT 0 / XP 0 / (선택)알림

[포인트] "내 기여 N개" = court_submissions.count({ user_id, status:"approved" })
```

**핵심 정합성**:
- 승인 = court_edit_suggestions 승인 API의 트랜잭션 구조 그대로(반영 + status + reviewed_by/at + XP). 검증된 패턴 답습 = 회귀 위험 최소.
- IDOR/권한: POST = getWebSession 로그인 / PATCH = super_admin(suggestions route L33 동일).
- 중복 승인 방지: `approved_court_info_id` 존재 시 재승인 차단(pending만 조회하는 가드로 1차 방어).

---

## (e) 규모 / 위험

**규모: 中** (스키마 1테이블 ADD + 신규 API 2 + 폼 1 수정 + admin 탭 1)
- 신규 LOC 추정 +350~500 (API 2 + SubmissionsTab + 폼 연결).
- 신규 화면 0(기존 /admin/courts 탭 확장), 신규 라우트 = web API만(`/api/v1` ❌ 준수).

**위험: 低**
| 위험 | 평가 | 완화 |
|------|------|------|
| 스키마 변경 | ADD-only nullable·무중단 | db diff 사용자 검토 후 push / destructive 0 |
| 회귀 | 기존 court_infos/admin-courts 흐름 무변경(탭 append) | 진행중 탭 diff 0 검증 |
| 좌표 부재 | 제보 단계 좌표 미수집 → 지도 표시 보정 필요 | 승인 시 기본좌표 + 관리자 보정(createCourtAction 선례) |
| apiSuccess snake_case | 프론트 접근자 함정(★재발6회) | GET 응답 curl 1회 후 프론트 타입(snake) 작성 |

**Stop conditions 준수 확인**:
- 신규 테이블 = 재사용 불가 확정(court_info_id NOT NULL FK 의도 불일치) → ADD nullable·무중단만 ✅
- destructive ❌ / db push 사용자 승인 전제 ✅ / api/v1 ❌ ✅
- 본 작업 = read-only 설계. 코드·DB·push 변경 0 ✅
