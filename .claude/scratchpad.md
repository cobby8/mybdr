# 작업 스크래치패드

## 현재 작업
- **요청**: 종별 참가비 UI 삭제 + wizard 저장 status enum mismatch fix (사용자 보고)
- **상태**: 완료 (2 commit / errors.md 박제)
- **현재 담당**: pm

## 진행 현황표 (Admin 박제 — 다른 세션)
| 단계 | 상태 |
|------|------|
| Admin-1 components/admin (신규 5 + admin.css) | ✅ commit `05caa04` (push 대기) |
| Admin-2 /admin/layout + Dashboard | ⏳ 결재 대기 (갱신 5 동반) |
| Admin-3~9 | ⏳ 순차 결재 대기 |

## 후속 큐 (별도 세션 / 본 의뢰 후)
- **AppNav utility 좌측 메뉴 (소개/요금제/도움말)**: 2026-05-15 임시 숨김 (JSX 주석 보존). 후속 결정 = (1) 페이지 콘텐츠 박제 후 복원 / (2) 메뉴 영구 제거 / (3) 다른 위치 (footer / drawer) 이전
- **AppNav SSR admin 메뉴 정합**: 첫 페인트부터 admin 진입 노출 — (web)/layout.tsx getAuthUser 에 admin_role / association 매핑 SELECT 확장. 현재는 useEffect /api/web/me 후 200ms 지연 노출
- **PR-G5.5-followup-B**: 매치 PATCH route 통합 (status='completed' 시 division_rule=0 분기 → advanceTournamentPlaceholders)
- **PR-G5.5-NBA-seed**: 8강/4강 NBA 시드 표준 generator (교차 시드 + 2^N 올림 + bye)
- PR-G5.7 double_elim / PR-G5.8 swiss (운영 사용 0)
- PR-G5.2 dual-generator refactor
- recorder_admin Q1~Q6 결재 대기 (PR1~3 commit 완료)
- Phase 6 PR3 협회 마법사 referee 옵션 (PR2 완료 후 후속)
- Phase 19 PR-T1~T5 / PR-S10.4 / PR-S10.7 / PR-S10.8 / PR-Stat1~Stat5 결재 대기
- Phase 23 PR4 / PR6 / Phase A.7 의뢰서
- Phase 3.5 유청소년 결합 코드 후속
- PR-S9 / UI-1.4 entry_fee / GNBA 8팀 코치 안내
- Phase E 잔여 14 라우트 시안 박제 → CLI 박제

## 미푸시 commit (subin 브랜치)
- **3건** (본 세션 박제):
  - `c88ea99` style(registration) 종별 참가비 입력란 UI 삭제
  - `ddb1dfc` fix(validation) wizard 저장 status enum mismatch — legacy 17종 허용
  - `b50f6aa` docs(knowledge) wizard status enum 함정 박제 + scratchpad 갱신

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-15 | Admin-6 Phase D 5 페이지 박제 (Analytics / Settings / Logs / Me / Notifications) BDR v2.14 | ✅ 박제 5 파일 (+105/-22 LOC) / tsc 0 / AdminPageHeader eyebrow+breadcrumbs+actions + AdminLogs severity admin-stat-pill / **AdminMe 7카드 0 변경 (G4)** + **AdminNotifications POST 비즈 0 변경** / commit 결재 대기 |
| 2026-05-15 | wizard 저장 status enum mismatch fix (운영 DB legacy 17종 허용) | ✅ commit `ddb1dfc` — Zod 5종 → 17종 확장 (tournament-status.ts 정합) / 4차 BDR 뉴비리그 (status="published") 저장 422 차단 / 운영 DB 영향 0 / errors.md 박제 (48항목) / 후속 PR = 4종 통일 마이그레이션 |
| 2026-05-15 | 종별 참가비 입력란 UI 삭제 (registration-settings-form.tsx) | ✅ commit `c88ea99` — divFees 입력 input + 안내문 삭제 / 데이터 layer (state/API/DB) 보존 / 호출처 영향 0 / tsc 0 |
| 2026-05-15 | PR-G5.5-followup Tournament 단위 placeholder applier (4차 BDR 뉴비리그 5/16 운영) | ✅ commit `6d52a33` — 신규 함수 2 (`advanceTournamentPlaceholders` + `getTournamentStandings` / 옵션 A 분리) + vitest 5 (정상/idempotent/notes 위반/절반 NULL/standings 단독) + 운영 매치 232 UPDATE 1건 완료 (notes "A조 1위 vs B조 1위" + settings.homeSlotLabel/awaySlotLabel) / tsc 0 / vitest 926/926 / 강남구 4 종별 회귀 0 / placeholder-helpers 통과 100% / DB schema 변경 0 / Flutter v1 영향 0 / 8중 안전 가드 통과 |
| 2026-05-15 | PR-Live1~Live4 라이브 기록 진입점 + 태블릿 세로 풀스크린 (Q1~Q7) | ✅ 신규 3 + 수정 2 / ~300 LOC / score-sheet-access endpoint 5 권한 분기 + 라이브 toolbar "기록하기" Link + body overflow lock + FullscreenToggle / commit 결재 대기 |
| 2026-05-15 | Phase 7 A PR2+PR3 E2E 시나리오 2 (회차 복제) + 시나리오 3 (1회성 대회) | ✅ commit `8eb37ab` — 신규 2 + 수정 1 / ~418 LOC / fixtures 시드 헬퍼 2 확장 |
| 2026-05-15 | Phase 23 PR-EDIT1~EDIT4 종료 매치 수정 모드 별도 기능 (Q3~Q8) | ✅ commit `223f7f0` — 수정 4 / +~370 LOC / canEdit + isEditMode + audit "completed_edit_resubmit" |
| 2026-05-15 | Admin-1 components/admin BDR v2.14 시안 박제 (신규 5 + admin.css 인프라) | ✅ commit `05caa04` (push 대기) / Admin-2 결재 대기 |
| 2026-05-15 | PR4-FIX recorder_admin UI 결함 3건 (사이드바/Super Admin/빠른 메뉴) | ✅ commit `b67c55d` — DB ground truth 폴백 (JWT stale 함정 영구 차단) |
| 2026-05-15 | Phase 23 PR-RO1~RO4 종료 매치 read-only 차단 (5계층 방어) | ✅ commit `fab2697` |
| 2026-05-15 | Phase 6 PR3 협회 마법사 Step 4 Referee 사전 등록 (옵션) | ✅ commit `12daf56` — Q7 1차 미검증 박제 |

## 구현 기록 (developer)

### Admin-4-C Phase 박제 — Community + News (2026-05-15)

📝 구현한 기능: BDR v2.14 시안 (`AdminCommunity.jsx` / `AdminNews.jsx`) 의 헤더(eyebrow + breadcrumbs + actions) + 카테고리/상태 뱃지(`admin-stat-pill[data-tone]`) 박제. 비즈 로직 / Server Action / Prisma 쿼리 / aside 탭 / 미리보기 모달 100% 보존.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/admin/community/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · 콘텐츠"` + `breadcrumbs` + `actions` (BDR NEWS 링크) 추가. `next/link` import 1건 신규 | 수정 |
| `src/app/(admin)/admin/community/admin-community-content.tsx` | 카테고리 `.badge--soft` → `admin-stat-pill[data-tone="mute"]`. 모달 "카테고리"/"상태" row 도 ReactNode pill 로 통일. `STATUS_LABEL` / `STATUS_TONE` 매핑 신규 (hidden=warn / published=ok) | 수정 |
| `src/app/(admin)/admin/news/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · 콘텐츠"` + `breadcrumbs` (커뮤니티 ← 부모 표시) 추가 | 수정 |
| `src/app/(admin)/admin/news/admin-news-content.tsx` | 미리보기 헤더의 raw `{selected.status}` 텍스트 → `admin-stat-pill[data-tone]` (draft=warn / published=ok / rejected=err). `NEWS_STATUS_LABEL` / `NEWS_STATUS_TONE` 매핑 신규 | 수정 |

**비즈 로직 보존 검증 (grep diff)**:
- community/page.tsx: 추가된 비즈 매치 = `hidePostAction`/`unhidePostAction`/`deletePostAction` import 1줄 (기존 라인 동일)
- news/page.tsx: 비즈 키워드 추가 0 (헤더 prop 만 변경)
- community-content / news-content: server action / state / filtered / setSelected / router.refresh / useTransition 변경 0

**tsc 결과**: `npx tsc --noEmit` exit 0 (errors 0)

**갭 / 미박제 항목 (Admin-4-A/B 패턴 동일)**:
- `AdminDataTable` 컴포넌트 미박제 → 기존 `<table className="admin-table">` 유지 (옵션 A)
- `AdminFilterBar` 컴포넌트 미박제 → 기존 검색 form 유지 (community)
- `AdminDetailModal` 시안 footer 액션(수정/게시판 페이지 등) 일부 미박제 → 기존 운영 footer (숨김/복원/삭제 form) 보존
- 시안 활성도 progress bar / 게시판별 통계 dashboard → 운영 데이터(community_posts) 와 다른 모델 (board 단위) → 박제 스킵
- news `aside__link` (.aside__link / community-aside 공유) → Admin-2 보고에 따라 본 PR 미변경
- 시안 mock state(filled/empty/loading/error) 토글 → 운영 미적용 (의도)

💡 tester 참고:
- **테스트 방법**:
  1. `/admin/community` 진입 — 헤더에 "ADMIN · 콘텐츠" eyebrow + breadcrumbs (ADMIN › 콘텐츠 › 커뮤니티 관리) + 우측 "BDR NEWS" 링크 노출
  2. 카테고리 뱃지 (자유게시판/팀원모집 등) `admin-stat-pill` (mute tone, 회색 박스) 박제 확인
  3. 게시글 클릭 → 모달 "게시글 정보" row의 카테고리/상태가 pill 로 표시 (hidden 게시글은 warn=주황)
  4. `/admin/news` 진입 — 헤더에 eyebrow + breadcrumbs (ADMIN › 콘텐츠 › 커뮤니티 › BDR NEWS) 노출
  5. 좌측 sidebar 탭 (검수 대기/발행됨/거절됨) 정상 동작 (.aside__link 보존)
  6. 우측 미리보기 헤더 라인 — raw "draft" 텍스트 → admin-stat-pill ("검수 대기" / warn=주황)
- **정상 동작**: 검색/필터/숨김/복원/삭제 (community) / 발행/거절/재생성/수정/사진 업로드 (news) 100% 기존 동일
- **주의할 입력**: 운영 DB 의 community_posts.status enum (`hidden` / null / `published`) — STATUS_TONE 매핑에서 null → "published" 기본값 (ok tone) 처리. news.status enum (`draft` / `published` / `rejected`) — mapping 외 값은 mute 톤 폴백.

⚠️ reviewer 참고:
- 특히 봐줬으면 하는 부분:
  1. `news/admin-news-content.tsx` 의 ReactNode 사용 — flex-wrap 으로 모바일 줄바꿈 정상 동작 확인
  2. `community/admin-community-content.tsx` 의 ModalInfoSection 에 ReactNode (pill 컴포넌트) 전달 — `admin-detail-modal.tsx` line 120 의 `rows: [string, string | ReactNode | null | undefined][]` 시그니처 호환
  3. `next/link` 신규 import (community/page.tsx) — server 컴포넌트 에서 사용 정합
  4. `admin-stat-pill` 클래스 — 이미 `src/styles/admin.css` 박제 완료 (Admin-1 commit `05caa04`) — 별도 CSS 추가 0
- 미박제 갭 (의도): AdminDataTable / AdminFilterBar / 시안 footer / activity progress / mock toggle. 별 PR 권장.

### Admin-5-A Phase 박제 — Users + GameReports + Suggestions (2026-05-15)

📝 구현한 기능: BDR v2.14 시안 (`AdminUsers.jsx` / `AdminGameReports.jsx` / `AdminSuggestions.jsx`) 의 헤더(eyebrow + breadcrumbs + actions) + 역할/상태/플래그 뱃지(`admin-stat-pill[data-tone]`) 박제. Prisma 쿼리 / Server Action / fetch API / state / hook / 모달 폼 100% 보존.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/admin/users/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · USERS"` → `"ADMIN · 사용자"` (시안 카피 박제) + `breadcrumbs` + `actions` (신고 검토 링크). `next/link` import 1건 신규 | 수정 |
| `src/app/(admin)/admin/users/admin-users-table.tsx` | `ROLE_STYLE` (inline CSS) → `ROLE_TONE` (admin-stat-pill data-tone 매핑). `statusBadge` 함수 `.badge--soft` → `admin-stat-pill[data-tone]` (active=ok / withdrawn=mute / suspended=err). USER_COLUMNS role 컬럼 + 모달 헤더 role pill 도 통일 | 수정 |
| `src/app/(admin)/admin/game-reports/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · 사용자"` + `breadcrumbs` + `actions` (유저 관리 링크) 추가. `statusBadge` return `{ bg, label }` → `{ tone, label }` 으로 시그니처 변경 (submitted=warn / reviewed=ok / dismissed=mute). 상태 뱃지 + 플래그 chip 모두 `admin-stat-pill[data-tone]` 통일. `next/link` import 1건 신규 | 수정 |
| `src/app/(admin)/admin/suggestions/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · 사용자"` + `breadcrumbs` 추가 | 수정 |
| `src/app/(admin)/admin/suggestions/admin-suggestions-content.tsx` | `STATUS_STYLE` (inline CSS) → `STATUS_TONE` 매핑 (pending=mute / open=warn / in_progress=warn / resolved=ok). 테이블 상태 칼럼 `.badge--soft` → `admin-stat-pill[data-tone]` 통일 | 수정 |

**비즈 로직 보존 검증 (grep diff)**:
- users/page.tsx: prisma/Action/useState 등 비즈 키워드 21건 (변경 0 — header prop 만 변경 + Link import 추가)
- users/admin-users-table.tsx: useState/useEffect/loadMoreAction/getDetailAction 등 39건 (변경 0 — ROLE_STYLE→ROLE_TONE / statusBadge className 만 갱신, 호출처 시그니처 동일)
- game-reports/page.tsx: useState/useCallback/useEffect/fetch 8건 (변경 0 — statusBadge return shape `{bg→tone}` 만 변경, 사용처 destructure `badge.tone` 1행 동시 변경)
- suggestions/page.tsx: prisma/Action 4건 (변경 0)
- suggestions/admin-suggestions-content.tsx: useState/updateStatusAction 11건 (변경 0)

**tsc 결과**: `npx tsc --noEmit` exit 0 (errors 0)

**갭 / 미박제 항목 (Admin-4 패턴 동일)**:
- `AdminDataTable` 미박제 → 기존 `DataTableV2` (users) / `<table className="admin-table">` (suggestions) 유지
- `AdminFilterBar` 미박제 → 기존 검색 form 유지
- 시안 다중 선택 bulk action (메시지/등급 변경/정지 / 나에게 배정/일괄 처리/반려 / 채택/반려) → 운영 미존재 → 박제 스킵
- 시안 등급 컬럼 (VVIP/VIP/A/B/C/D/F) → 운영 user 모델에 등급 필드 없음 → 박제 스킵
- 시안 신고 우선도 (critical/high/normal/low) → 운영 game_report 모델에 priority 필드 없음 → 박제 스킵
- 시안 좋아요/싫어요/댓글수 → 운영 suggestions 모델에 upvote/downvote/comment_count 필드 없음 → 박제 스킵
- 시안 mock state toggle / topbarRight admin-user 박스 → AdminShell 영역 (Admin-2 박제 완료) → 박제 스킵
- 모달 footer 시안 액션 (메시지 보내기/등급 변경/계정 정지/정지 해제/휴면 해제 / 처리 완료/반려/재오픈 / 채택/반려) 일부 미박제 → 기존 운영 footer (강제탈퇴/완전 삭제 / 상태 변경 form) 보존
- game-reports `검토/기각 PATCH` 기능 자체가 운영 미구현 ("추후 추가 예정") → 박제 스킵 (비즈 0 변경)

💡 tester 참고:
- **테스트 방법**:
  1. `/admin/users` 진입 — 헤더에 "ADMIN · 사용자" eyebrow + breadcrumbs (ADMIN › 사용자 › 유저 관리) + 우측 "신고 검토로" Link 노출
  2. 테이블 역할 칼럼 (일반유저/픽업호스트/팀장/대회관리자) `admin-stat-pill` (각 tone) 박제 확인
  3. 상태 칼럼 (활성=초록/탈퇴=회색/정지=빨강) admin-stat-pill 박제 확인
  4. 행 클릭 → 상세 모달 헤더의 역할/상태 pill 도 동일
  5. `/admin/game-reports` 진입 — 헤더에 eyebrow + breadcrumbs + "유저 관리로" Link 노출
  6. 상태 필터 탭 (검토 대기/검토 완료/기각/전체) 동작 / 카드 우측 상태 뱃지 admin-stat-pill (warn/ok/mute) 박제
  7. 신고된 선수 행의 플래그 chip (노쇼/지각/매너 불량 등) admin-stat-pill[data-tone=err] (빨강) 박제
  8. `/admin/suggestions` 진입 — 헤더에 eyebrow + breadcrumbs (ADMIN › 사용자 › 건의사항) 노출
  9. 테이블 상태 칼럼 (대기=회색/접수됨=주황/처리중=주황/완료=초록) admin-stat-pill 박제
- **정상 동작**:
  - users: 검색/페이지네이션/역할 변경/슈퍼관리자 토글/정지·활성화/강제탈퇴/완전 삭제/긴급 변경 폼/배번 수정 — 100% 기존 동일
  - game-reports: 상태 필터 탭 전환/리스트 fetch/페이지네이션 안내 — 100% 기존 동일
  - suggestions: 검색/상태 필터 탭/모달 상태 변경 form — 100% 기존 동일
- **주의할 입력**:
  - users.membershipType: 0/1/2/3 외 값 (운영 DB 위반) → `getRoleInfo` fallback `tone="mute"` + `label=String(mt)` 처리
  - users.status: "active"/"withdrawn"/null/기타 → null/기타 모두 "정지" (err) 폴백 (기존 동일)
  - game_report.status: "submitted"/"reviewed"/"dismissed" 외 → "submitted" (warn) 폴백 (기존 동일)
  - suggestion.status: "pending"/"open"/"in_progress"/"resolved" 외 → `STATUS_TONE` 미매치 시 "mute" 폴백 + `STATUS_LABEL` 미매치 시 raw status 표시

⚠️ reviewer 참고:
- 특히 봐줬으면 하는 부분:
  1. `users/admin-users-table.tsx` 의 `ROLE_STYLE` 제거 — `ROLE_TONE` 만 export 안 되는 함수 내부에서 사용. `getRoleInfo` 시그니처 변경 (`style` → `tone`) 호출처 2곳 (USER_COLUMNS render / 모달 헤더) 동시 갱신 — 호출처 외부 0
  2. `game-reports/page.tsx` 의 `statusBadge` return `{ bg, label }` → `{ tone, label }` 시그니처 변경 — 사용처 `style={{ backgroundColor: badge.bg }}` → `data-tone={badge.tone}` 1곳 동시 갱신
  3. `next/link` 신규 import 2건 (users/page.tsx server / game-reports/page.tsx client) — 정합
  4. `admin-stat-pill` 클래스 — 이미 admin.css 박제 완료 (Admin-1 commit `05caa04`)
- 미박제 갭 (의도): AdminDataTable / AdminFilterBar / 시안 등급 컬럼 / 우선도 / upvote / mock toggle / bulk action / 시안 footer 액션 일부. 별 PR 권장.

### Admin-5-B Phase 박제 — Plans + Payments + Campaigns (2026-05-15)

📝 구현한 기능: BDR v2.14 시안 (`AdminPlans.jsx` / `AdminPayments.jsx` / `AdminCampaigns.jsx`) 의 헤더(eyebrow + breadcrumbs + actions) + 상태 뱃지(`admin-stat-pill[data-tone]`) 박제. Prisma 쿼리 / Server Action / fetch API / state / hook / 결제/환불 비즈 로직 100% 보존. **결제(Payments) 영역 — final_amount / refund / payment_code / users.nickname 등 민감 키워드 라인 변경 0 검증 완료**.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/admin/plans/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · 비즈니스"` + `breadcrumbs` + `actions` (결제 내역 Link + 요금제 추가). `next/link` import 신규. 테이블 행 상태 `.badge--soft` (inline css) → `admin-stat-pill[data-tone]` (active=ok / 비활성=mute). 프로모션 "프로모션 없음" `.badge--soft` → `admin-stat-pill[data-tone=mute]` | 수정 |
| `src/app/(admin)/admin/payments/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · 비즈니스"` + `breadcrumbs` 추가. Prisma findMany / groupBy / serialize 100% 보존 | 수정 |
| `src/app/(admin)/admin/payments/admin-payments-content.tsx` | `STATUS_STYLE` (inline css 5종) → `STATUS_TONE` 매핑 (paid=ok / pending=warn / failed=err / cancelled=mute / refunded=info / partial_refunded=info). 테이블 행 + 모달 row 2곳 동시 갱신 (`badge--soft` → `admin-stat-pill[data-tone]`). useState/AdminStatusTabs/AdminDetailModal/filter 보존 | 수정 |
| `src/app/(admin)/admin/campaigns/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · 비즈니스"` + `breadcrumbs` + `subtitle` 박제. `statusBadge` return `{bg, text, label}` → `{tone, label}` 시그니처 변경 (draft=info / pending=warn / approved=ok / rejected=err / paused=mute / ended=mute). 카드 우측 인라인 `style={{backgroundColor, color}}` → `admin-stat-pill[data-tone]`. fetch / handleStatusChange / 액션 버튼 (승인/반려/일시정지/재개) 변경 0 | 수정 |

**비즈 로직 보존 검증 (grep diff)**:
- plans/page.tsx: `endPromotion`/`handleSave`/`handleToggle`/`handleDelete`/`fetch('/api/admin/plans')`/`endPromotionAction` Server Action import 등 비즈 라인 변경 0 (header prop 만 변경 + Link import 추가)
- payments/page.tsx: `prisma.payments.findMany`/`groupBy`/`final_amount`/`payment_code`/`payable_type`/`payable_id`/`users.nickname` 등 결제 민감 키워드 변경 0
- payments/admin-payments-content.tsx: `setActiveTab`/`setSelected`/`filtered`/`AdminStatusTabs`/`AdminDetailModal`/`fetch` 등 18건 변경 0 — `STATUS_STYLE` → `STATUS_TONE` 시그니처 변경 + 사용처 2곳 동시 갱신만
- campaigns/page.tsx: `handleStatusChange`/`fetchCampaigns`/`fetch('/api/admin/campaigns')`/`PATCH`/`onClick` 액션 핸들러 변경 0 — `statusBadge` return shape 만 변경 + 사용처 1곳 동시 갱신

**tsc 결과**: `npx tsc --noEmit` exit 0 (errors 0)

**갭 / 미박제 항목 (Admin-4 / Admin-5-A 패턴 동일)**:
- `AdminDataTable` 컴포넌트 미박제 → 기존 `<table className="admin-table">` 유지 (옵션 A)
- `AdminFilterBar` / `AdminStatusTabs` (이미 박제) — 그대로 유지. campaigns 의 자체 filter 탭 (가로 버튼 배열) 도 보존 (운영 폼 동일)
- 시안 통계 카드 (총 매출/거래 건수/실패+환불) — payments 운영은 이미 3 카드 (총건수/완료건수/총 금액) 존재 → 시안 카피와 다르지만 운영 데이터 모델에 맞춰 유지
- 시안 결제수단 아이콘 (`credit_card`/`account_balance_wallet`/`account_balance`) — 운영 `payment_method` 컬럼 raw string 만 보유 / icon mapping 미구현 → 박제 스킵
- 시안 캠페인 ROI / 노출/클릭/전환 KPI 그리드 — 운영 모달 미구현 + 우선순위 낮음 → 박제 스킵
- 시안 캠페인 다중 선택 / 일괄 일시중지·종료 → 운영 미구현 → 박제 스킵
- 시안 plans 가격 강조 그리드 / 가입자수 / 갱신률 / 매출 패널 — 운영 plan 모델에 `subscribers` / `renewal_rate` 필드 없음 (별도 promo_stats API 만 존재) → 박제 스킵
- 시안 mock state toggle / topbarRight admin-user 박스 → AdminShell 영역 (Admin-2 박제 완료) → 박제 스킵
- 모달 footer 시안 액션 (수정/요금제 보기 / 유저 보기/환불 처리/재시도 / 수정/일시중지/게재 시작) 일부 미박제 → 기존 운영 footer (모달 없음 / 닫기·결제 상세 row only / 승인·반려·일시정지·재개 inline 버튼) 보존

💡 tester 참고:
- **테스트 방법**:
  1. `/admin/plans` 진입 — 헤더 eyebrow "ADMIN · 비즈니스" + breadcrumbs (ADMIN › 비즈니스 › 요금제 관리) + 우측 "결제 내역" Link + "+ 요금제 추가" 버튼 노출
  2. 테이블 상태 칼럼 (활성=초록 ok pill / 비활성=회색 mute pill) admin-stat-pill 박제 확인
  3. 프로모션 관리 박스 — 구독자 0명일 때 "프로모션 없음" mute pill 박제
  4. `/admin/payments` 진입 — 헤더 eyebrow + breadcrumbs (ADMIN › 비즈니스 › 결제) 노출
  5. 상태 필터 탭 (전체/대기/완료/실패) 동작 / 테이블 행 상태 admin-stat-pill (paid=초록 / pending=주황 / failed=빨강 / refunded=파랑 / cancelled=회색) 박제
  6. 행 클릭 → 상세 모달 "결제 정보" row 의 상태도 admin-stat-pill 박제
  7. `/admin/campaigns` 진입 — 헤더 eyebrow + breadcrumbs (ADMIN › 비즈니스 › 광고 캠페인) + subtitle "채널별 캠페인 집행과 전환·ROI 성과를 추적합니다." 노출
  8. 상태 필터 (전체/심사중/승인/반려/일시정지) 버튼 동작 / 캠페인 카드 우측 상태 뱃지 admin-stat-pill (draft=info 파랑 / pending=warn 주황 / approved=ok 초록 / rejected=err 빨강 / paused·ended=mute 회색) 박제
- **정상 동작**:
  - plans: 요금제 추가/수정/활성·비활성 토글/삭제/프로모션 종료/형식 입력 모달 100% 기존 동일
  - payments: 상태 필터 탭 전환/상세 모달/통계 카드 (총 건수/완료/총 금액) 100% 기존 동일
  - campaigns: 상태 필터/승인·반려·일시정지·재개 PATCH 액션/CTR 계산 100% 기존 동일
- **주의할 입력**:
  - plans.is_active: true → ok (초록) / false → mute (회색) — null/undefined 시 false 폴백 (기존 동일)
  - payments.status: "paid"/"pending"/"failed"/"cancelled"/"refunded"/"partial_refunded" 외 → `STATUS_TONE` 미매치 시 "mute" 폴백 + `STATUS_LABEL` 미매치 시 raw status 표시
  - campaigns.status: "draft"/"pending"/"approved"/"rejected"/"paused"/"ended" 외 → `statusBadge` 폴백 "draft" (기존 동일)
  - campaigns.image_url: null 시 회색 박스 + image 아이콘 (기존 동일)

⚠️ reviewer 참고:
- 특히 봐줬으면 하는 부분:
  1. **결제(Payments) 영역 — 비즈 로직 라인 변경 0 검증 완료**. final_amount / payment_code / payable_type / payable_id / refund / Prisma findMany / groupBy / serialize 모두 보존. 시각 박제만.
  2. `payments/admin-payments-content.tsx` 의 `STATUS_TONE` 매핑 변경 — `partial_refunded` 도 시안에 없는 운영 enum 값이지만 info 톤 (환불과 동일) 으로 시각적 일관성 유지. 시안 v2.14 에는 `refunded` 만 정의되어 있어 mute 톤 (status_tone="mute") 이지만 운영은 `refunded`/`partial_refunded` 둘 다 info 톤 = 환불 카테고리 일관 표시 (변경 0 — 기존 5/4 박제 정책 유지)
  3. `campaigns/page.tsx` 의 `statusBadge` return 시그니처 변경 (`{ bg, text, label }` → `{ tone, label }`) — 사용처 1곳 (행 카드 우측 뱃지 inline style) 동시 갱신. 외부 호출처 0
  4. `plans/page.tsx` 의 `next/link` 신규 import — client 컴포넌트 ("use client") 내 정합. `Link` 에 `className="btn"` 직접 사용 (Button 컴포넌트 ≠ 시안 actions secondary btn pattern)
  5. `admin-stat-pill` 클래스 — 이미 `src/styles/admin.css` 박제 완료 (Admin-1 commit `05caa04`) — 별도 CSS 추가 0
- 미박제 갭 (의도): AdminDataTable / 시안 가격 그리드 / 갱신률 / ROI / 노출·클릭 KPI / 결제수단 아이콘 / 통계 카드 3종 / mock toggle / bulk action / 모달 footer 액션 일부. 별 PR 권장 (특히 결제수단 아이콘 매핑 / 갱신률·구독자 필드 = DB 스키마 확장 필요).

### Admin-5-C Phase 박제 — Partners + Organizations (PartnerAdminEntry 보류) (2026-05-15)

📝 구현한 기능: BDR v2.14 시안 (`AdminPartners.jsx` / `AdminOrganizations.jsx`) 의 헤더(eyebrow + breadcrumbs + actions) + 상태 뱃지(`admin-stat-pill[data-tone]`) 박제. fetch / handleStatusChange / handleCreate / handleApprove / handleReject / state / hook / 거절 사유 모달 100% 보존. **PartnerAdminEntry 는 시안과 운영 구조 완전 상이 (entry/gate landing vs SWR 대시보드) → 박제 보류 별 PR 권장**.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/admin/partners/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · 비즈니스"` + `breadcrumbs` + `actions` (파트너 등록 버튼 = actions slot 이동). `statusBadge` (inline bg/text/label) 함수 제거 → `STATUS_TONE` + `STATUS_LABEL` 매핑 신규 (pending=warn / approved=ok / rejected=err / suspended=mute). 행 상태 컬럼 `<span style={{backgroundColor: badge.bg, color: badge.text}}>` → `admin-stat-pill[data-tone]`. 상태 필터 탭도 inline css → (web) `.btn btn--sm`/`btn--primary` 패턴 (Organizations 박제와 일관). | 수정 |
| `src/app/(admin)/admin/organizations/page.tsx` | AdminPageHeader 에 `eyebrow="ADMIN · 외부 관리"` + `breadcrumbs` 추가. `statusBadge` 함수 제거 → `STATUS_TONE` + `STATUS_LABEL` 매핑 신규 (pending=warn / approved=ok / rejected=err). 행 상태 컬럼 `<span className="inline-block rounded ... text-white">` → `admin-stat-pill[data-tone]` 통일. | 수정 |

**비즈 로직 보존 검증 (grep diff)**:
- partners/page.tsx: `fetch('/api/admin/partners')` (GET 목록 / PATCH 상태변경) / `handleStatusChange` (승인/반려/정지/재승인 4 분기) / `handleCreate` (POST 신규 등록 form) / `useState`/`useEffect`/`useCallback` 등 비즈 라인 변경 0 — header prop + STATUS_LABEL 매핑 + 상태 뱃지 markup 만 변경
- organizations/page.tsx: `fetch('/api/web/admin/organizations')` / `handleApprove` (POST approve) / `handleReject` (POST reject + reason body) / `setActionLoading`/`setRejectId`/`setRejectReason` 등 비즈 라인 변경 0

**grep 검증** (run):
```
src\app\(admin)\admin\organizations\page.tsx:60:    const res = await fetch(`/api/web/admin/organizations${qs}`);
src\app\(admin)\admin\organizations\page.tsx:73:  async function handleApprove(id: string) {
src\app\(admin)\admin\organizations\page.tsx:85:  async function handleReject(id: string) {
src\app\(admin)\admin\partners\page.tsx:60:    const res = await fetch(`/api/admin/partners${qs}`);
src\app\(admin)\admin\partners\page.tsx:71:  const handleStatusChange = async (id: string, newStatus: string) => {
src\app\(admin)\admin\partners\page.tsx:81:  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
```
→ 호출처 + 핸들러 함수명 그대로 보존 확인.

**tsc 결과**: `npx tsc --noEmit` exit 0 (errors 0)

**갭 / 미박제 항목**:
- **PartnerAdminEntry 박제 보류 (별 PR 권장)** — 시안 `PartnerAdminEntry.jsx` 는 entry/gate landing 패턴 (좌측: 혜택 4종 + 신청 3 step / 우측: 로그인 form + 신청 큐 미리보기 / super_admin role 분기). 운영 `src/app/(web)/partner-admin/page.tsx` 는 이미 로그인 된 파트너의 **SWR 대시보드** (통계 카드 4종 + 캠페인 상태 분포 + 빠른 액션 링크 2개). 구조/책임 완전 상이 → 시각 박제만으로 정합 불가. 별 PR 권장 (entry/gate 페이지 신규 라우트 추가 or partner-admin 대시보드 헤더만 시안 패턴으로 변환). 본 PR 에서 변경 0
- `AdminDataTable` 컴포넌트 미박제 → 기존 `<table className="admin-table">` 유지 (옵션 A)
- `AdminFilterBar` 미박제 → 기존 filter 버튼 row 유지
- 시안 `AdminStatusTabs` 미박제 (Organizations) → 기존 `(web) .btn` 패턴 유지 (운영 기존 패턴)
- 시안 Partners 카테고리 필터 (코트/장비/스폰서/협회) + 등급 필터 (PLATINUM/GOLD/SILVER/BRONZE) → 운영 Partner 모델에 `category` / `tier` 필드 없음 → 박제 스킵
- 시안 Partners 누적 매출 / 캠페인 수 컬럼 → 운영 partner 모델에 `revenue` 필드 없음 (`campaigns_count` 는 이미 존재) → 매출 박제 스킵
- 시안 Partners 상세 모달 (계약 시작/만료 / 운영 액션 등급 변경) → 운영 모달 미구현 → 박제 스킵
- 시안 Organizations 거절 사유 모달 (textarea + 최소 10자 검증 + 카운터) → 운영은 inline textarea + 버튼 직접 호출 패턴 (모달 X) → 박제 스킵 (UX 차이 큼)
- 시안 Organizations 시리즈/멤버 카운트 컬럼 → 운영 컬럼에 없음 (`series_count`/`members_count` 필드는 응답에 존재) → 박제 스킵
- 시안 Organizations 일괄 승인 (selectable + bulk approve) → 운영 미구현 → 박제 스킵
- 시안 mock state toggle / topbarRight admin-user 박스 → AdminShell 영역 (Admin-2 박제 완료) → 박제 스킵

💡 tester 참고:
- **테스트 방법**:
  1. `/admin/partners` 진입 — 헤더 eyebrow "ADMIN · 비즈니스" + breadcrumbs (ADMIN › 비즈니스 › 파트너 관리) + 우측 "+ 파트너 등록" actions 버튼 노출
  2. 상태 필터 탭 (전체/대기/승인/반려) `.btn btn--sm` 패턴 박제 (활성 탭은 `btn--primary` 빨강)
  3. "+ 파트너 등록" 클릭 → 신규 등록 폼 토글 (기존 form 보존). 폼 제출 → POST `/api/admin/partners` 후 목록 새로고침
  4. 테이블 상태 컬럼 (대기=warn 주황 / 승인=ok 초록 / 반려=err 빨강 / 정지=mute 회색) admin-stat-pill 박제
  5. 액션 버튼 (대기 = 승인/반려 / 승인 = 정지 / 정지 = 재승인) PATCH `/api/admin/partners/{id}` 동작 보존
  6. `/admin/organizations` 진입 — 헤더 eyebrow "ADMIN · 외부 관리" + breadcrumbs (ADMIN › 외부 관리 › 단체 관리) 노출
  7. 상태 필터 탭 (대기/승인/거절/전체) 동작 / 테이블 상태 컬럼 admin-stat-pill 박제
  8. pending 행에 승인/거절 버튼 → 거절 클릭 시 inline textarea 표시 → 사유 입력 후 확인 → POST `/api/web/admin/organizations/{id}/reject` (reason body) 동작 보존
- **정상 동작**:
  - partners: 상태 필터 / 신규 등록 / 승인·반려·정지·재승인 PATCH / 목록 새로고침 100% 기존 동일
  - organizations: 상태 필터 / 승인 POST / 거절 (사유 입력) POST / actionLoading 비활성화 100% 기존 동일
- **주의할 입력**:
  - partner.status: "pending"/"approved"/"rejected"/"suspended" 외 → `STATUS_TONE` 미매치 시 "mute" 폴백 + raw status 표시
  - organization.status: "pending"/"approved"/"rejected" 외 → "mute" 폴백
  - 거절 사유: 운영은 trim 후 비어있지 않으면 통과 (시안 10자 제약은 미박제 — 기존 동일)

⚠️ reviewer 참고:
- 특히 봐줬으면 하는 부분:
  1. **PartnerAdminEntry 박제 보류 결정** — 시안 entry/gate landing 패턴 vs 운영 SWR 대시보드 구조 완전 상이. 시각 박제만으로 정합 불가 → 별 PR. 박제 보고 본 항목 명시.
  2. `partners/page.tsx` 의 `statusBadge` 함수 제거 — 호출처 1곳 (테이블 행 상태 컬럼) 동시 갱신 + `STATUS_TONE` / `STATUS_LABEL` 모듈 상수로 분리 (다른 박제 (Admin-5-B campaigns/payments) 와 일관 패턴)
  3. `partners/page.tsx` 상태 필터 탭 inline css → `.btn btn--sm`/`btn--primary` (Organizations 와 일관). 기능 동일 (filter 값 비교 + setFilter)
  4. `partners/page.tsx` "+ 파트너 등록" 버튼 ml-auto + 별도 row → `AdminPageHeader actions` slot 으로 이동. 토글 동작 (setShowForm) 보존
  5. `organizations/page.tsx` 거절 사유 inline textarea + 버튼 (기존 운영 UX) 그대로 보존 — 시안 거절 모달 (textarea + 10자 검증) 박제 스킵
  6. `admin-stat-pill` 클래스 — 이미 admin.css 박제 완료 (Admin-1 commit `05caa04`) — 별도 CSS 추가 0
- 미박제 갭 (의도): PartnerAdminEntry (별 PR) / AdminDataTable / AdminFilterBar / 카테고리·등급 컬럼 / 누적 매출 / 시리즈·멤버 컬럼 / 거절 모달 / 일괄 승인 / mock toggle. 별 PR 권장.

### Admin-6 Phase 박제 — Phase D 5 페이지 (Analytics / Settings / Logs / Me / Notifications) (2026-05-15)

📝 구현한 기능: BDR v2.14 시안 (`AdminAnalytics.jsx` / `AdminSettings.jsx` / `AdminLogs.jsx` / `AdminMe.jsx` / `AdminNotifications.jsx`) 의 헤더(eyebrow + breadcrumbs + actions) 박제 + AdminLogs severity 뱃지(`admin-stat-pill[data-tone]`) 박제. **AdminMe 운영 7 카드 구조 100% 보존 (사용자 결정 G4)** + **AdminNotifications POST `/api/web/admin/notifications` 비즈 로직 100% 보존**.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/admin/analytics/page.tsx` | AdminPageHeader eyebrow 영문 "ADMIN · ANALYTICS" → 한글 "ADMIN · 시스템" (시안 카피) + `breadcrumbs` 신규 (ADMIN › 시스템 › 분석). 12 Prisma 쿼리 / StatCard / 차트 0 변경 | 수정 |
| `src/app/(admin)/admin/settings/page.tsx` | eyebrow "ADMIN · SYSTEM" → "ADMIN · 시스템" + subtitle 시안 카피 ("사이트 정보·운영 정책·알림·점검 모드를 관리합니다.") + `breadcrumbs` + `actions` (활동 로그 Link). `next/link` import 신규. Server Action (clearCacheAction / toggleMaintenanceModeAction) / useState / useTransition 0 변경 | 수정 |
| `src/app/(admin)/admin/logs/page.tsx` | eyebrow "ADMIN · LOGS" → "ADMIN · 시스템" + `breadcrumbs` + `actions` (시스템 설정 Link). `SEVERITY_TONE` + `SEVERITY_LABEL` 매핑 신규 (info=info / warning=warn / error=err). 로그 라인 severity dot 옆에 `admin-stat-pill[data-tone]` 추가 (INFO/WARN/ERROR mono 라벨). resource_type 도 admin-stat-pill mute 톤. Prisma admin_logs.findMany (KST 변환 / 마크다운 export) 0 변경 | 수정 |
| `src/app/(admin)/admin/me/page.tsx` | raw `<header><h1>+<p>` → `AdminPageHeader` 박제 (eyebrow "ADMIN · 계정" + title "내 정보" + subtitle 시안 카피 + breadcrumbs ADMIN › 계정 › 내 정보). `AdminPageHeader` import 신규. **운영 7 카드 (UserInfoCard / IdentityStatusCard / NotificationsCard / SuggestionsCard / RoleMatrixCard / ManagedTournamentsCard / RecentActivityCard) import + render + props + Prisma SELECT 7건 (getAdminRoles / user / admin_logs / notifications count·list / suggestions count·list) 0 변경** | 수정 |
| `src/app/(admin)/admin/notifications/page.tsx` | AdminPageHeader 에 eyebrow "ADMIN · 시스템" + subtitle 시안 카피 + `breadcrumbs` + `actions` (활동 로그 Link) 추가. `next/link` import 신규. **POST `/api/web/admin/notifications` (handleSubmit / fetch / setTitle·setContent·setActionUrl·setSending·setResult / TARGET_OPTIONS) 0 변경** | 수정 |

**비즈 로직 보존 검증 (grep diff)**:
- analytics/page.tsx: prisma.user.count / prisma.tournament.count / prisma.games.count / community_posts.count / court_ambassadors.count / monthlyUsers raw SQL — 추가/삭제 0 (header prop 만 변경)
- settings/page.tsx: clearCacheAction / toggleMaintenanceModeAction / startCacheTransition / startMaintenanceTransition / setMaintenanceEnabled — 0 변경 (next/link import + header prop 만 추가)
- logs/page.tsx: prisma.admin_logs.findMany / KST 변환 함수 3개 / 그룹핑 + 마크다운 생성 — 0 변경 (SEVERITY_TONE/LABEL 매핑 신규 + pill markup 추가 only)
- me/page.tsx: `git diff` 비즈 키워드 (prisma. / getAdminRoles / notifications / suggestions / admin_logs / getAuthUser) 매치 0 — 헤더 markup + AdminPageHeader import 1줄만 +/-
- notifications/page.tsx: `git diff` POST 비즈 키워드 (handleSubmit / fetch / sent_count / setTitle / setContent / target) 실제 코드 라인 변경 0 (주석 1줄만 추가)

**tsc 결과**: `npx tsc --noEmit` exit 0 (errors 0)

**갭 / 미박제 항목**:
- 시안 AdminAnalytics 의 다채널 차트 (DAU/MAU / 매출 트렌드 / 코호트) → 운영 단일 차트 (월별 가입 추이 6개월) 유지. 12 Prisma 쿼리 결과만 표시 (운영 데이터 모델 한계)
- 시안 AdminSettings 의 사이트 정보 / 알림 정책 / 운영 정책 폼 — 운영 미구현 (점검모드 / 캐시 초기화 2개만 존재) → 박제 스킵
- 시안 AdminLogs 의 severity 필터 탭 (info/warn/error/critical) + 정렬 + JSON 내보내기 actions — 운영 미구현. 시안 critical 레벨도 운영 enum 없음 → "ERROR" 폴백 매핑. JSON 내보내기 actions 박제 스킵 (운영 .md 다운로드만 존재)
- 시안 AdminMe 의 7카드 시각 (CardHeader num + icon + Pill) — 운영 _components/ 7카드 구조 그대로 보존 (G4 사용자 결정). 본 PR 시각 박제 영역 = page.tsx 헤더만. _components/ 7카드 내부 시각 박제 = 별 PR 권장
- 시안 AdminNotifications 의 발송 이력 + 토스트 + 발송 후 통계 — 운영 미구현 (1회 POST 후 result 메시지만) → 박제 스킵
- mock state toggle / topbarRight admin-user 박스 → AdminShell 영역 (Admin-2 박제 완료) → 박제 스킵

💡 tester 참고:
- **테스트 방법**:
  1. `/admin/analytics` 진입 — 헤더 eyebrow "ADMIN · 시스템" + breadcrumbs (ADMIN › 시스템 › 분석) 노출. 12 통계 카드 + 차트 정상 렌더
  2. `/admin/settings` 진입 — 헤더 eyebrow + breadcrumbs + 우측 "활동 로그" Link. 점검모드 토글 / 캐시 초기화 버튼 정상 동작
  3. `/admin/logs` 진입 — 헤더 eyebrow + breadcrumbs + 우측 "시스템 설정" Link. 로그 라인 severity → admin-stat-pill (INFO=info 회색 / WARN=warn 주황 / ERROR=err 빨강) + resource_type → mute pill. 날짜 필터 칩 + 마크다운 다운로드 정상
  4. `/admin/me` 진입 — 헤더 eyebrow "ADMIN · 계정" + breadcrumbs (ADMIN › 계정 › 내 정보) + subtitle "내 운영자 계정 정보 · 알림 ..." 노출. **운영 7 카드 (로그인 정보 / 본인인증 / 알림 / 건의사항 / 권한 매트릭스 / 관리 토너먼트 / 최근 활동) 모두 기존과 100% 동일 렌더**
  5. `/admin/notifications` 진입 — 헤더 eyebrow + subtitle 시안 카피 + breadcrumbs + 우측 "활동 로그" Link. 폼 전송 → POST `/api/web/admin/notifications` (target=all/active/admin 분기) 정상 동작 + result 메시지 표시
- **정상 동작**: 5 페이지 모두 비즈 로직 (SELECT / Server Action / fetch / state) 100% 기존 동일
- **주의할 입력**:
  - logs.severity: "info"/"warning"/"error" 외 → SEVERITY_TONE 미매치 시 "info" 폴백 + SEVERITY_LABEL 미매치 시 raw severity uppercase 표시
  - notifications.target: "all"/"active"/"admin" 만 허용 (TARGET_OPTIONS 보존)
  - me.identity_method: "mock"/"portone"/null (IdentityStatusCard 내부 분기 보존)
  - me.notifications.status: "unread"/"read" — unreadCount = "unread" 필터 (Prisma where 보존)
  - me.suggestions.status: "pending"/기타 — pendingCount = "pending" 필터 (assigned_to_id = userId 만 — IDOR 0)

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  1. **AdminMe 7 카드 보존** (사용자 결정 G4) — page.tsx 의 import 7건 + render 7건 + Prisma SELECT 7건 (병렬 Promise.all) + bigint 직렬화 3건 (adminLogRows / notificationRows / suggestionRows) **모두 100% 보존**. 변경 영역 = `<header>` raw 만 `AdminPageHeader` 1컴포넌트로 교체
  2. **AdminNotifications POST 비즈 보존** — `git diff` 결과 비즈 라인 변경 0 (주석 1줄만 추가). handleSubmit / fetch / TARGET_OPTIONS / setTitle·setContent·setSending·setResult 모두 동일
  3. `logs/page.tsx` 의 SEVERITY_TONE / SEVERITY_LABEL 매핑 신규 — info/warning/error 만 매핑. 운영 admin_logs.severity enum 은 nullable 이라 폴백 처리 보존. 시안 "CRIT" 레벨은 운영 enum 없음 → "ERROR" 폴백 (info/warn/err 3 톤만 사용)
  4. 시안 카피 (eyebrow / subtitle) 갱신 — analytics/settings/logs/notifications 모두 "ADMIN · 시스템" (시안), me 만 "ADMIN · 계정" (시안). subtitle 도 시안 카피 우선 박제 (analytics 만 운영 기능 설명 유지: "이번 달 가입 / 토너먼트 / 경기 / 게시글 + 6개월 추이")
  5. `next/link` 신규 import 2건 (settings client / notifications client) + 1건 (logs server 는 기존 보유) — Link `className="btn"` 직접 사용 (다른 admin 페이지와 일관)
- 미박제 갭 (의도): 시안 차트 다채널 / 사이트 정보 폼 / severity 필터 탭 / JSON 내보내기 / me 7카드 내부 시각 / 발송 이력. 별 PR 권장 (특히 me _components/ 7카드 내부 시각 박제는 큰 코드 (1956 LOC) → 별 PR).

### Admin-7-A Phase 박제 — tournament-admin Home + List (2026-05-15)

📝 구현한 기능: BDR v2.14 시안 (`AdminTournamentAdminHome.jsx` / `AdminTournamentAdminList.jsx`) 의 헤더(eyebrow + breadcrumbs + actions) + 상태 뱃지(`admin-stat-pill[data-tone]`) 박제. Prisma 쿼리 / super_admin 분기 / TAM 위임 OR 조건 / searchParams 탭·검색 / myOrganizations 관리 단체 카드 / 탭별 카운트(in-memory) / format 표시 비즈 로직 100% 보존.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/page.tsx` | 인라인 헤더 60줄 (`<div><div fontSize:10>ADMIN · TOURNAMENT</div><h1>…</h1><p>…</p></div><Link>`) → `AdminPageHeader` (eyebrow + title + subtitle + breadcrumbs + actions). `STATUS_DISPLAY` color → tone 시그니처 변경 (`StatusTone` type 신규: ok/warn/info/mute/err — STATUS_TONE 매핑 11건). 행 상태 컬럼 `rounded-full px-2 py-0.5` inline css → `admin-stat-pill[data-tone]`. "위임" 999px pill → `admin-stat-pill[data-tone="info"]`. `AdminPageHeader` import 신규. actions 슬롯에 "대회 목록" Link + "+ 새 대회 만들기" Link 2개 (시안 동일) | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/page.tsx` | raw `<h1 className="text-2xl">` + Link → `AdminPageHeader` (eyebrow + breadcrumbs + actions). `<Badge>` (badge.tsx 컴포넌트) → `admin-stat-pill[data-tone]` + `STATUS_TONE` 매핑 신규 (17 status 키 4 tone 매핑). `Badge` import 제거 (사용 없음). `AdminPageHeader` import 신규. `Card` 컴포넌트 / Prisma 쿼리 / super_admin 분기 / format 표시 보존 | 수정 |

**비즈 로직 보존 검증 (grep diff)**:
- page.tsx 비즈 키워드 매치 36건 (prisma. / getWebSession / isSuperAdmin / tournamentWhere / TAB_STATUS_MAP / myOrganizations / allTournaments / myTournaments / currentTab / qParam) — 추가/삭제 0
- page.tsx `git diff` 비즈 라인 = template literal 1건 (`myOrganizations.length > 0 && ' · 관리 단체 ${myOrganizations.length}개'` → subtitle 안 ternary로 흡수, 동일 데이터 동일 출력)
- tournaments/page.tsx 비즈 키워드 매치 11건 (prisma. / getWebSession / isSuperAdmin / adminMembers / organizerId / TOURNAMENT_STATUS_LABEL / TOURNAMENT_FORMAT_LABEL) — `git diff` 비즈 라인 = 0건
- Prisma `tournament.findMany` 4건 (page.tsx 2: myOrganizations + allTournaments / tournaments/page.tsx 1) — 변경 0
- isSuper 분기 / TAM `adminMembers some isActive` OR 조건 / `myOrganizations.findMany` include + orderBy / `tournamentTeams` filter (approved/pending/paid) — 변경 0

**tsc 결과**: `npx tsc --noEmit` exit 0 (errors 0)

**LOC 변화**:
- page.tsx: +57 / -97 (헤더 60줄 → AdminPageHeader 1컴포넌트 + 인라인 css 제거)
- tournaments/page.tsx: +73 / -35 (STATUS_TONE 매핑 신규 17건 + AdminPageHeader + 폴백 처리)
- 총 +130 / -132

**갭 / 미박제 항목 (Admin-4~6 패턴 동일)**:
- 시안 `AdminTournamentAdminHome` 의 통계 4 카드 (StatCard live/apply/done/draft) — 운영 page.tsx 는 subtitle 한 줄 텍스트 표시 (`내 대회 X개 · 진행 중 Y · 완료 Z · 관리 단체 N개`) — Prisma 카운트 데이터는 모두 있지만 시각 카드 박제는 시안 추가 작업 필요 → **별 PR (UI-only StatCard 컴포넌트 박제 + grid 추가)**
- 시안 `AdminTournamentAdminHome` 의 빠른 액션 4 (QuickAction 새 대회/시리즈/단체/템플릿) — 운영은 actions 슬롯 2 Link (대회 목록 + 새 대회 만들기) 만 박제. 시리즈/단체/템플릿 라우트 박제는 Admin-7-B (Series 3) / 후속 → **별 PR**
- 시안 `AdminTournamentAdminHome` 의 2컬럼 (좌 최근 활동 / 우 곧 시작 대회) — 운영 데이터 모델에 admin_logs 테이블은 있으나 본인 tournament-specific filter 미구현. 곧 시작 대회는 Prisma sort/take 로 가능하나 시안 D-day 디자인 박제는 별 PR
- 시안 `AdminTournamentAdminList` 의 `AdminStatusTabs` (6탭 전체/작성중/신청중/진행중/완료/보관) — 운영은 단순 목록 (탭 없음, all 표시) → 박제 스킵 (탭 추가는 비즈 로직 변경 — 본 PR 시각 박제 범위 초과)
- 시안 `AdminTournamentAdminList` 의 `AdminFilterBar` (검색 + 시리즈 필터) + `AdminDataTable` (컬럼 정의 + 정렬 + pagination + 행 클릭) → 운영은 `Card` 컴포넌트 + Link 행으로 단순 표시 → 박제 스킵 (옵션 A — 별 PR)
- 시안 카드 우측 `설정 hub →` chevron / 비공개 pill / D-day badge / team_count progress bar / divisions 컬럼 → 운영 카드 시각 차이 큼. 박제 스킵 → 별 PR
- mock state toggle / topbarRight admin-user 박스 → AdminShell 영역 (Admin-2 박제 완료) → 박제 스킵
- 관리 단체 카드 (myOrganizations 2026-05-12 Phase 4-B) 박제 → 시안 시각 패턴 (sectionLabel + grid) 유사하므로 보존 (별도 시각 정합 불필요)

💡 tester 참고:
- **테스트 방법**:
  1. `/tournament-admin` 진입 (organizer 또는 super_admin 세션) — 헤더 eyebrow "ADMIN · 대회 운영" (super_admin 시 " · SUPER") + breadcrumbs (ADMIN › 대회 운영자 도구) + 우측 actions "대회 목록" Link + "+ 새 대회 만들기" Link 노출
  2. subtitle "내 대회 X개 · 진행 중 Y · 완료 Z · 관리 단체 N개" 표시 (관리 단체 0건 시 마지막 클로즈 생략)
  3. 관리 단체 카드 (organization_members 행 있을 때) 헤더 아래 grid 박스 정상 렌더 — 시각 변경 0 (기존 동일)
  4. 검색 form + 탭 (전체/준비중/접수중/진행중/종료) + admin-table 정상 동작
  5. 테이블 행 상태 칼럼 — `admin-stat-pill[data-tone]` 박제 (준비중=mute / 접수중=info / 진행중=ok / 종료=mute)
  6. 위임 받은 대회 (organizerId !== userId) 의 이름 옆 "위임" 라벨 → `admin-stat-pill[data-tone="info"]` 박제 (작은 9.5px pill)
  7. `/tournament-admin/tournaments` 진입 — 헤더 eyebrow + breadcrumbs (ADMIN › 대회 운영자 도구 › 내 대회 / 전체 대회) + 우측 "+ 새 대회 만들기" Link 노출
  8. 카드 우측 상태 뱃지 — `admin-stat-pill[data-tone]` (status enum 17종 → 4 tone 매핑)
  9. super_admin 진입 → "전체 대회 운영자 도구" / "전체 대회" 라벨 + breadcrumbs 도 "전체 대회" 표기
  10. 빈 상태 (대회 0건) — 기존 안내 박스 (`emoji_events` 아이콘 + "아직 대회가 없어요" + "대회 만들기" 버튼) 그대로 렌더
- **정상 동작**:
  - page.tsx: Prisma 쿼리 (myOrganizations + allTournaments) / TAB_STATUS_MAP 분기 / qParam 검색 / 탭 카운트 / 위임 뱃지 / 입금·대기 카운트 / 시작일 표시 — 100% 기존 동일
  - tournaments/page.tsx: Prisma findMany (super_admin OR organizer OR TAM adminMembers) / Card 행 클릭 → 상세 / format 표시 / 빈 상태 안내 — 100% 기존 동일
- **주의할 입력**:
  - tournament.status: STATUS_DISPLAY (page.tsx 11종) / STATUS_TONE (tournaments/page.tsx 17종) 외 값 → 폴백 page.tsx `STATUS_DISPLAY.draft` (준비중/mute) / tournaments/page.tsx `STATUS_TONE.fallback = "mute"` + raw status 표시
  - super_admin 세션: `isSuperAdmin(session)` true → where {} (모든 대회) + 헤더 "전체 대회 운영자 도구" / "전체 대회"
  - organizerId mismatch (TAM 위임만): "위임" pill 표시 + 같은 행에 데이터 정상
  - myOrganizations 0건 → 관리 단체 카드 grid 자체 렌더 X (기존 동일) + subtitle 마지막 클로즈 생략

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  1. **page.tsx 의 인라인 헤더 60줄 → AdminPageHeader 1 컴포넌트 교체** — 시안 admin-pageheader 박제 (Admin-2 commit). actions 슬롯에 시안 동일 2 Link (대회 목록 + 새 대회 만들기) — 기존 1 Link ("+ 새 대회 만들기") 에 시안 패턴 1 Link ("대회 목록") 추가
  2. `STATUS_DISPLAY` color → tone 시그니처 변경 (page.tsx) — 호출처 1곳 (`<span className={...} style={{color: statusInfo.color}}>` → `<span className="admin-stat-pill" data-tone={statusInfo.tone}>`) 동시 갱신. 외부 export 없음 (모듈 내부 const)
  3. `STATUS_TONE` 신규 매핑 (tournaments/page.tsx) — `TOURNAMENT_STATUS_LABEL` 의 17 status 키 모두 커버 + 폴백 "mute". `Badge` 컴포넌트 import 제거 (사용처 0)
  4. **Prisma 쿼리 / super_admin 분기 / TAM OR 조건 100% 보존** — `git diff` 검증 결과 비즈 라인 변경 0 (template literal 1건은 subtitle 데이터 흡수 동일 출력)
  5. `next/link` 기존 import 보존 (page.tsx / tournaments/page.tsx 모두 이미 있음). `AdminPageHeader` 신규 import 2건
  6. `admin-stat-pill` 클래스 — 이미 `src/styles/admin.css` 박제 완료 (Admin-1 commit `05caa04`) — 별도 CSS 추가 0
- 미박제 갭 (의도): StatCard 4통계 카드 / QuickAction 4빠른 액션 / 좌 최근 활동·우 곧 시작 2컬럼 / AdminStatusTabs 6탭 / AdminFilterBar / AdminDataTable / D-day badge / progress bar / divisions 컬럼 / 설정 hub chevron / 비공개 pill / mock toggle. 별 PR 권장 (특히 StatCard + AdminStatusTabs 박제는 비즈 로직 + state 추가 필요 → 큰 작업).

### Admin-7-B Phase 박제 — SetupHub (Sub-B1 만, EditWizard + Wizard1Step 보류) (2026-05-15)

📝 구현한 기능: BDR v2.14 시안 `AdminTournamentSetupHub.jsx` 의 헤더(eyebrow + breadcrumbs + actions) + 상태/D-Day/공개 메타 라인(`admin-stat-pill[data-tone]`) 박제. **UI-1 (c3474db) SetupChecklist 호출 영역 + UI-5 (3d8d5bf) 공개 게이트 props 100% 보존**. **SetupChecklist.tsx 변경 0 = UI-1 + UI-5 영역 비즈 로직 + 클라이언트 핸들러 (`handlePublish` / `handleUnpublish` / `gate` / `canPublish` / `router.refresh` / 4분기) 완전 보존**.

⚠️ **분할 진행 결정 (의뢰서 §한계 권장 그대로)**: 3 라우트 동시 박제 = 4,466 LOC + UI-1~5 보존 위험 → Sub-B1 (SetupHub 695 LOC) 만 박제. **Sub-B2 EditWizard ([id]/wizard 1,169 LOC) + Sub-B3 Wizard1Step (new/wizard 1,619 LOC) 보류 — 별 PR 권장**.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx` | 인라인 헤더 60줄 (`<div className="mb-6"><div flex justify-between><div><Link mb-1>← 대회 목록</Link><h1>...</h1><div mt-1 flex gap-3>...</div></div>{site.isPublished && <Badge>공개 중</Badge>}</div></div>`) → `AdminPageHeader` (eyebrow + title + subtitle + breadcrumbs + actions) + 별도 상태 메타 라인 (`admin-stat-pill[data-tone]` 3건: 상태 / D-Day / 공개 중). `STATUS_TONE` 매핑 신규 (17 status 키 4 tone — Admin-7-A 패턴 동일). `Badge` + `TOURNAMENT_STATUS_COLOR` import 제거 (사용처 0). `AdminPageHeader` import 신규. `Link` + `Card` + `TOURNAMENT_STATUS_LABEL` + `TOURNAMENT_FORMAT_LABEL` import 보존 | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/SetupChecklist.tsx` | **변경 0** — UI-1 + UI-5 100% 보존 | 변경 없음 |

**비즈 로직 보존 검증 (grep diff)**:
- page.tsx 비즈 키워드 잔존 카운트 = 35건 (prisma.tournament.findUnique / getWebSession / tournamentAdminMember / calculateSetupProgress / SetupChecklist / tournamentSite / divisionRules / _count / notFound / redirect / getDDay / secondaryActions / isPublished / subdomain) — 변경 0
- page.tsx `git diff` 비즈 라인 매치 = **`getDDay(tournament.startDate)` 호출 1건 (위치만 변경, 동일 호출 — Admin-7-A 패턴 동일하게 인라인 텍스트 → admin-stat-pill wrap 변경)**
- super_admin 분기 / `tournament.organizerId === userId` / `tournamentAdminMember.findFirst { isActive: true }` / `calculateSetupProgress(id, tournamentInputs, relationInputs)` / `SetupChecklist progress={progress} tournamentId={id} isSitePublished={!!site?.isPublished} hasSite={!!site}` / 빠른 통계 4 Card / 빠른 액션 4 Link / 공개 사이트 외부 Link (site.subdomain) — 모두 변경 0
- **SetupChecklist.tsx `git diff` LOC = 0** (UI-1 진행도 바 + 8 카드 grid + UI-5 공개 게이트 4분기 + `handlePublish` POST `/api/web/tournaments/[id]/site/publish` body `{publish: true}` + `handleUnpublish` body `{publish: false}` + `router.refresh()` + `setBusy` / `setError` / `gate.ok` / `gate.missing` 모두 100% 보존)

**tsc 결과**: `npx tsc --noEmit` exit 0 (errors 0)

**LOC 변화**:
- page.tsx: +84 / -45 (헤더 60줄 → AdminPageHeader + 메타 라인 / STATUS_TONE 17 매핑 신규)
- SetupChecklist.tsx: 0 / 0
- 총 +84 / -45

**갭 / 미박제 항목 (Sub-B1 범위 — UI-1 + UI-5 보존 우선)**:
- 시안 `AdminTournamentSetupHub` 의 `AdminProgressBar` 상단 진행도 바 (시안 컴포넌트) → 운영 `SetupChecklist` 내부 progress bar 기존 패턴 (var(--color-elevated) 트랙 + var(--color-accent) fill 8px) 보존. **변경 0 = UI-1 100% 보존**. 별 PR 권장 (시안 패턴 정합 = `AdminProgressBar` 신규 컴포넌트 박제 필요)
- 시안 `AdminChecklistCard` 8 카드 grid (2x4 desktop) → 운영 `ChecklistCard` 기존 패턴 (2 cols sm:grid-cols-2 + 좌측 상태 아이콘 + 본문 + chevron) 보존. 변경 0. 별 PR (grid 4 cols + 시안 card 패턴 정합)
- 시안 하단 "공개 게이트" 카드 (좌: 공개 가드 + 미완료 카운트 / 우: 보조 액션 4 grid) → 운영 `PublishGate` 기존 4분기 (!hasSite / isSitePublished / gate.ok / 미통과) + 보조 액션 `secondaryActions` 4 Card 보존. 변경 0. 별 PR (시각 정합)
- 시안 상단 progression mock select (D-day + 0/8 / 3/8 / 7/8 / 8/8 토글) — 시안 mock 전용 (운영 진입 X)
- 시안 publish toast → 운영은 router.refresh() 후 페이지 재렌더 (toast 미박제) → 별 PR 권장
- 빠른 통계 4 Card (`참가팀` / `최대팀` / `경기 수` / `참가비`) → 시안 미정의 영역 (운영 기능 유지) → 변경 0
- mock state toggle / topbarRight admin-user 박스 → AdminShell 영역 (Admin-2 박제 완료) → 박제 스킵

**Sub-B2/B3 보류 사유**:
- Sub-B2 `[id]/wizard/page.tsx` (1,169 LOC) — UI-1.1~1.3 (71b0eaa InlineSeriesForm wiring) + UI-1.5 (e8adc1a ?step=2 anchor) + UI-3+4 (8478a24 bracketSettings 통합 + 사이트 영역 제거) 4 commit 보존 필요. 단일 PR 한계 + 위험도 높음. 별 PR 권장
- Sub-B3 `new/wizard/page.tsx` (1,619 LOC) — UI-2 (60dd37e 1-step 압축) + Admin-3 박제 (d98ff79 QuickCreateForm 헤더 eyebrow + × 종료) 보존 필요. 가장 큰 파일 + Admin-3 박제 직접 영역. 별 PR 권장

💡 tester 참고:
- **테스트 방법**:
  1. `/tournament-admin/tournaments/{id}` 진입 (organizer 또는 super_admin 또는 활성 TAM 세션) — 헤더 eyebrow "ADMIN · 대회 운영" + breadcrumbs (ADMIN › 대회 운영자 도구 › 내 대회 › {대회명}) + 우측 actions "← 대회 목록" Link (arrow_back 아이콘) 노출
  2. subtitle "2026.MM.DD ~ 2026.MM.DD · 토너먼트 단판" (startDate · endDate · format) 표시
  3. 상태 메타 라인 — admin-stat-pill 3건: 상태(준비중=mute / 접수중=info / 진행중=ok / 종료=mute) + D-Day(mute) + (공개 시) "공개 중"(ok + public 아이콘)
  4. 빠른 통계 4 Card (참가팀 / 최대팀 / 경기 수 / 참가비) — 기존 동일
  5. **셋업 체크리스트 hub (UI-1) + 공개 게이트 (UI-5)** — `SetupChecklist` 컴포넌트 100% 기존 동일 (progress bar / 8 카드 / 공개 버튼 4분기)
  6. 빠른 액션 (참가팀 관리 / 관리자 / 기록원) 3 Card + (공개 시) 공개 사이트 외부 Link Card — 기존 동일
- **정상 동작**: 권한 가드(super_admin / organizer / TAM) / SetupChecklist 8 카드 link 동작 / 공개 버튼 POST `/api/web/tournaments/{id}/site/publish` / router.refresh / 빠른 액션 Link / 공개 사이트 외부 도메인 (subdomain.mybdr.kr) Link — 100% 기존 동일
- **주의할 입력**:
  - tournament.status: STATUS_TONE 17종 외 → "mute" 폴백 + raw status 표시
  - tournament.startDate null → subtitle 의 dateRangeText 생략 + D-Day pill 자체 렌더 X
  - tournament.endDate null → " ~ {endDate}" 생략 (기존 동일)
  - tournament.format null → "토너먼트" 폴백 (기존 동일)
  - site (tournamentSite[0]) null → `site?.isPublished` false → "공개 중" pill + 외부 Link Card 자체 렌더 X
  - super_admin / organizer / TAM 외 사용자 → notFound() (기존 동일)

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  1. **UI-1 SetupChecklist 호출 props 100% 보존** — `progress={progress}` / `tournamentId={id}` / `isSitePublished={!!site?.isPublished}` / `hasSite={!!site}` 4 props 모두 동일 (위치 동일)
  2. **UI-5 SetupChecklist.tsx 변경 0** — `git diff` LOC = 0 검증. `handlePublish` / `handleUnpublish` / fetch POST 2건 / `body: JSON.stringify({publish: true/false})` / `router.refresh()` / `setBusy` / `setError` / 4분기 (!hasSite → 안내 / isSitePublished → 비공개 전환 / gate.ok → 공개 버튼 / 미통과 → 잠금 + 미충족 항목) 모두 100% 보존
  3. **page.tsx 비즈 로직 변경 0** — Prisma `tournament.findUnique` include 7건 (_count / tournamentSite / divisionRules) / 권한 가드 (super_admin OR organizer OR TAM `isActive: true`) / `calculateSetupProgress` 호출 + 입력 객체 14 필드 / `getDDay` 함수 / `secondaryActions` 3 배열 / 빠른 통계 4 Card 데이터 / 빈 상태 분기 / 외부 Link (subdomain.mybdr.kr) — 모두 변경 0. 변경 영역 = JSX wrap only
  4. `STATUS_TONE` 신규 매핑 (17 status 키 4 tone) — Admin-7-A `tournaments/page.tsx` 매핑과 동일 카테고리 분류 (준비중=mute / 접수중=info / 진행중=ok / 종료=mute). 폴백 "mute" + raw status 표시 (기존 패턴)
  5. `Badge` 컴포넌트 import 제거 (사용처 0) + `TOURNAMENT_STATUS_COLOR` import 제거 (사용처 0) — 클린 정리. `Link` + `Card` + `TOURNAMENT_STATUS_LABEL` + `TOURNAMENT_FORMAT_LABEL` import 보존 (사용처 존재)
  6. `AdminPageHeader` 신규 import — server component 정합 (Admin-2 박제 후 22+ 호출처 동일 패턴). breadcrumbs `onClick` 미사용 (server component는 onClick props 전달 불가 → 단순 라벨 표시 = Admin-7-A 동일 패턴)
  7. `admin-stat-pill` 클래스 — 이미 `src/styles/admin.css` 박제 완료 (Admin-1 commit `05caa04`) — 별도 CSS 추가 0
- 미박제 갭 (의도): AdminProgressBar 시안 패턴 / AdminChecklistCard grid 4 cols / 공개 게이트 2 카드 grid (좌 공개 / 우 보조 액션) / publish toast / progression mock select. 별 PR 권장
- **Sub-B2 EditWizard + Sub-B3 Wizard1Step 보류 — 별 PR 권장** (의뢰서 §한계 권장 그대로). 사유: 단일 PR LOC 한계 + UI-1.1~1.3 + UI-1.5 + UI-2 + UI-3+4 + Admin-3 박제 5 commit 보존 위험. 분할 PR 안전
