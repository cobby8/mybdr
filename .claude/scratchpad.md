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
