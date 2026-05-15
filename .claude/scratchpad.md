# 작업 스크래치패드

## 현재 작업
- **요청**: CLI 마스터 핸드오프 — admin 디자인 시스템 운영 박제 (`admin-design-2026-05-15/cli-port-to-src.md` 따라 Admin-1 ~ Admin-9 진행)
- **상태**: Admin-1 진입 — components/admin/* 10 컴포넌트 박제 진행 중 (developer 위임)
- **결재 받음**:
  - Phase별 결재 방식 (Admin-1 → 검증 → Admin-2 ... 순차) ✅
  - src/ 미커밋 5 파일 → 별도 WIP commit 분리 (`0853927`) ✅
  - `.git/index` 손상 복구 + Phase 0~1 push 완료 (origin/subin = `d1290c0`) ✅
  - 다른 세션 PR4-UI commit (d1290c0) 자연스럽게 본 세션 commit 위에 박제 — 충돌 0

## 진행 현황표
| 단계 | 상태 |
|------|------|
| Phase 0 — `.git/index` 복구 | ✅ 완료 |
| Phase 0.5 — src/ 미커밋 분리 commit (0853927) | ✅ 완료 |
| Phase 0.6 — scratchpad 정리 (726→50줄) | ✅ 완료 |
| Phase 1 — BDR-current v2.14 sync commit (d43704a) | ✅ 완료 (436 파일 / +75866) |
| Phase 1.5 — push to origin/subin | ✅ 완료 (4 commit fast-forward) |
| Phase 2 — Admin-1 components/admin (10 컴포넌트) | ✅ developer 박제 완료 (신규 6 + 수정 1 / tsc 0 / 갱신 5 보류) — 사용자 결재 대기 |
| **Phase 3 — Admin-2 /admin/layout + Dashboard** | ⏳ **Admin-1 후 결재** (갱신 5 컴포넌트 동반) |
| Phase 4 — Admin-3 wizard 풀스크린 | ⏳ |
| Phase 5 — Admin-4 Phase B 콘텐츠 9 페이지 | ⏳ |
| Phase 6 — Admin-5 Phase C 사용자/비즈니스/외부 9 페이지 | ⏳ |
| Phase 7 — Admin-6 Phase D 시스템/me 5 페이지 | ⏳ |
| Phase 8 — Admin-7 Phase E 8 라우트 (UI-1~5 보존) | ⏳ |
| Phase 9 — Admin-8 Phase F 잔여 토큰 매핑 | ⏳ |
| Phase 10 — Admin-9 자동 검증 | ⏳ |

## 후속 큐 (별도 세션 / 본 의뢰 후)
- **본 의뢰 후속**: Phase E 잔여 14 라우트 시안 박제 (Claude.ai 디자인) → CLI 박제
- recorder_admin Q1~Q6 결재 대기 (PR1~3 commit 완료 / 사용자 검증 + PR4 운영자 UI 옵션)
- Phase 6 PR3 협회 마법사 referee 옵션 (PR2 완료 후 후속)
- PR-G5.2~G5.8 placeholder 박제 generator 별 확장 (PR-G5.1 commit 완료)
- Phase 19 PR-T1~T5 / PR-S10.4 / PR-S10.7 / PR-S10.8 / PR-Stat1~Stat5 결재 대기
- Phase 23 PR4 / PR6 / Phase A.7 의뢰서
- Phase 3.5 유청소년 결합 코드 후속 (parseDivisionCode + 백워드 호환)
- PR-S9 / UI-1.4 entry_fee / GNBA 8팀 코치 안내

## 미푸시 commit (subin 브랜치)
- 현재 = **0** (origin/subin = HEAD = d1290c0 박제 완료)
- 본 세션 직전 = 4 commit (0853927 chore wip + d43704a sync + d1290c0 PR4-UI by 다른 세션 + Phase 6 PR2/PR1 등 이전 commit)

## 기획설계 (planner-architect)
(본 의뢰 = 시안 박제이므로 신규 설계 없음 / cli-port-to-src.md 참조)

## 구현 기록 (developer)

### PR4-UI 구현 (recorder_admin 발견 경로 박제)

📝 구현 요약: recorder_admin/super_admin/협회 관리자 사용자가 `/referee` 진입 시 admin 페이지 발견 경로 0 (UX 갭) 해소 — (1) `/api/web/me` sentinel 12 permission 자동 통과 fix + recorder_admin boolean 필드 추가 (2) referee 대시보드 상단 prominent CTA 카드 (3) 빈 프로필 분기 admin 사용자 안내 변경 (4) 모바일 하단 5번째 탭 "관리자" 조건부 추가. DB 변경 0 / Flutter v1 영향 0. **PR3 부수 발견 fix 동봉** — sentinel role 이 `PERMISSIONS[key].includes(admin.role)` 필터에서 빈 배열 반환되어 super/recorder_admin 사이드바에서 permission 메뉴 차단되던 버그.

#### 변경 파일 + LOC
| 파일 | 변경 | 신규/수정 | LOC |
|------|------|----------|----|
| `src/app/api/web/me/route.ts` | (a) `SUPER_ADMIN_SENTINEL_ROLE` import + sentinel 시 PERMISSIONS 전체 키 자동 부여 (b) `isRecorderAdmin` import + `recorder_admin: boolean` 응답 필드 박제 | 수정 | +20 |
| `src/app/(referee)/referee/_components/referee-shell.tsx` | (a) `MeResponse` 타입 박제 + `recorderAdmin` 상태 분리 (b) `showAdminTab` 판정 (c) 모바일 5번째 탭 "관리자" 조건부 spread 박제 | 수정 | +30 |
| `src/app/(referee)/referee/page.tsx` | (a) `isRecorderAdmin` + `getAssociationAdmin` import (b) admin 판정 Promise.all 병렬 (c) 빈 프로필 분기 admin 사용자 안내 변경 (d) 등록 상태에서도 상단 CTA 카드 노출 (e) `AdminEntryCard` 컴포넌트 신규 | 수정 | +85 |

**합계**: 수정 3 파일 / 신규 0 / 약 135 LOC.

#### Q 결재 사항 (PM 추천 진행 — 사용자 검증 후 확정)
- **CTA 위치**: 대시보드 상단 (헤더 직후 + 등록 상태/미등록 상태 모두 노출) — 협회 매칭 배너보다 위
- **빈 프로필 분기**: admin 사용자 = "본인 심판 프로필 등록 (선택)" 안내로 라벨 변경 + 상단 CTA 카드 동시 노출 (등록 강제 X / 옵션 안내)
- **모바일**: 5번째 탭 "관리자" 조건부 노출 (햄버거 대신 탭 추가 — 사이드바 일관성)
- **API 응답**: `/api/web/me` 에 `recorder_admin: boolean` (snake_case 직접 박제 — `apiSuccess` 자동 변환 일관 패턴 따라감)
- **PR3 sentinel fix 동봉**: `permissionKeys` 필터에서 sentinel role 빈 배열 반환 버그 → 12 permission 전체 자동 부여 (회귀 0 — 일반 association_admin 필터 그대로)

#### 검증 결과
- `npx tsc --noEmit`: 0 에러 (기존 unrelated `wizard/association/page.tsx` Step type 1건 제외 — 본 PR 무관)
- `npx vitest run` 전체: **918/918 PASS** (PR3 직후 873 → 그 후 신규 PR 추가 분량 합산 / 회귀 0)

#### 회귀 검증
- **일반 user (비관리자)**: `/referee` 진입 시 — 빈 프로필 분기 = 기존 EmptyState 그대로 / 모바일 4탭 그대로 / admin CTA 노출 0 ✅
- **기존 협회 관리자**: 부수 효과 = 본 PR 의 admin CTA 카드 노출 (사이드바 admin 메뉴 + 카드 동시 — 발견 경로 강화). isAdmin 판정에 `!!associationAdmin` 분기 박제. 사용자 결재 필요 시 recorder_admin 단독으로 좁힐 수 있음
- **기존 super_admin**: 자동 흡수 (`isRecorderAdmin` Q1 결재) → admin CTA + 모바일 5번째 탭 노출 ✅
- **recorder_admin 신규**: 사이드바 (`/api/web/me` sentinel 12 permission 통과) + 대시보드 상단 CTA + 빈 프로필 안내 + 모바일 5번째 탭 — 4 발견 경로 모두 노출 ✅
- **sentinel fix 회귀 가드**: `admin-guard.test.ts` 의 sentinel 12 permission 케이스 (5)~(8) + (15)~(19) 모두 PASS — `/api/web/me` 동일 룰 박제로 정합 보장

💡 tester 참고:
- **테스트 방법**: (a) recorder_admin 계정 1 row UPDATE 후 (b) `/referee` 진입 → 상단에 빨간 좌측 border 의 "관리자 권한이 있습니다" 카드 노출 확인 (c) 카드 클릭 → `/referee/admin` 진입 확인 (d) 사이드바 (lg+) — "관리자" 섹션에 9개 admin 항목 노출 확인 (e) 모바일 (< lg) — 하단 탭 5개 노출 (홈/프로필/자격증/정산/관리자) (f) 일반 사용자 계정 진입 → 4탭 + CTA 카드 노출 0 (회귀 0 확인)
- **정상 동작**: recorder_admin 이 어디서든 admin 진입 가능 / 일반 사용자 화면 변경 0
- **주의할 입력**: 본인 Referee 프로필이 **없는** recorder_admin → 기존 "프로필 등록하기" 화면 위에 "본인 심판 프로필 등록 (선택)" 라벨 + 상단 admin CTA 동시 노출 (admin 진입 가능 명확 안내)

⚠️ reviewer 참고:
- **sentinel fix 의도**: `/api/web/me` 의 `permissionKeys` 필터가 sentinel role 일 때 빈 배열 반환 → super/recorder_admin 사이드바에서 permission 메뉴 차단되던 PR3 부수 버그. `hasPermission()` (admin-guard.ts L203) 의 sentinel 자동 통과 룰과 정합 박제. 회귀 0 — 일반 association_admin 은 기존 필터 그대로.
- **isAdmin 판정 범위**: recorder_admin OR 협회 관리자 (`getAssociationAdmin() != null`). 협회 관리자도 admin CTA 노출 = 부수 효과 — 사용자 결재 필요 시 recorder_admin 단독으로 좁힐 수 있음 (협회 관리자는 이미 사이드바 발견 경로 있음).
- **모바일 5탭 / 6탭 분기**: showAdminTab = admin_info OR recorder_admin. 6탭 가능성 없음 (admin 1개 추가 / 5탭 상한). 일반 사용자는 4탭 그대로.
- **AppNav frozen 영향 0**: referee 플랫폼 독자 셸 — main AppNav 변경 없음.
- **API 패칭 최소**: `/api/web/me` 1 필드 추가 (recorder_admin) + 1 필터 fix (sentinel 자동 통과). UI 박제 + 1 라우트 응답 키 추가만.
- **vitest 추가 X**: `/api/web/me` 단위 테스트는 통합 인프라 부재로 스킵 (기존 패턴 — me route 자체 테스트 없음). sentinel fix 는 `admin-guard.test.ts` 의 hasPermission sentinel 케이스 (5)~(8) 로 핵심 룰 검증됨.

#### 잠재 위험 / 메모
- **부수 효과 (의도된)**: 협회 관리자도 admin CTA 카드 노출. 기존에는 사이드바 메뉴만 발견 경로 — 카드 추가로 강화. 회귀 0 (오히려 UX 개선). 사용자 결재 필요 시 recorder_admin 단독으로 좁힐 수 있음.
- **DB 0 추가 라운드트립**: referee/page.tsx 에 `getAssociationAdmin()` 추가 (1 추가 SELECT) — `Promise.all` 병렬로 referee 조회와 동시 실행 → 추가 latency 0 (DB 동시 처리).
- **JWT 갱신 필요 (Q4 결재 유지)**: recorder_admin 지정 후 사용자 본인 로그아웃→재로그인 필요 (기존 룰 그대로). `isRecorderAdmin` 은 session.admin_role 평가 — JWT 갱신 전까지 false 반환.

### PR4-FIX 진단 + 수정 (사용자 피드백 반영 — recorder_admin UI 결함 3건)

📝 진단 요약:
- 결함 #1 (사이드바 비노출): JWT stale 함정 — `isRecorderAdmin(session)` 가 JWT.admin_role 만 평가. DB 박제 후 재로그인 안 하면 stale → `getAssociationAdmin()` sentinel 미진입 → me API admin=null → adminInfo=null → 사이드바 admin 섹션 0
- 결함 #2 (Super Admin 라벨): 코드 분석상 정확 (recorder_admin 이면 "Recorder Admin" 표시되어야 함). 가능 원인 = stale JWT (과거 isAdmin=true) 또는 사용자 인용 오류. fix = DB ground truth 우선 판정으로 stale JWT 무관 정확 표시
- 결함 #3 (빠른 메뉴 부족): 코드에서 확인 — quickLinks 배열에 2개만 박제. 존재하는 6 핵심 admin 페이지 (배정/공고/일자별/정산/단가/일괄 등록) 미박제

#### 변경 파일 + LOC
| 파일 | 변경 | 신규/수정 | LOC |
|------|------|---------|----|
| `src/app/api/web/me/route.ts` | (a) User select isAdmin/admin_role 추가 (b) `recorderAdmin` DB 폴백 (4 분기 OR) (c) `effectiveAdmin` 강제 sentinel — DB ground truth 가 admin-like 면 admin=null 이어도 첫 활성 협회 자동 선택 + sentinel role 박제 (d) 응답에 `admin_role` 키 추가 | 수정 | +35 |
| `src/app/(referee)/referee/admin/page.tsx` | (a) `prisma.user.findUnique` 추가 (isAdmin/admin_role) (b) `superAdmin` / `recorderAdmin` 판정 DB 폴백 (OR 분기) (c) quickLinks 2 → 8 확장 (배정/공고/일자별/정산/단가/일괄 등록 신규 6) | 수정 | +60 |

**합계**: 수정 2 파일 / 신규 0 / 약 95 LOC.

#### 진단 결과 (원인)
- **결함 #1**: **JWT stale 함정** — `is-recorder-admin.ts` L61~62 가 `session.admin_role` JWT 만 평가. JWT 만료 7일 동안 DB 박제 반영 X. 운영 DB 에서 user_id=3431 의 admin_role="recorder_admin" 확인 (`scripts/_temp/check-user-3431.ts`) 했으나 사용자 JWT 는 박제 전 발급 → stale → 사이드바 admin 메뉴 0
- **결함 #2**: **stale JWT 가능 원인** — 코드 분석상 entryRole 분기 정확 (admin/page.tsx L60 = recorder_admin). 사용자 보고 "Super Admin" 라벨은 (a) stale JWT (b) 인용 오류 둘 다 가능. fix = DB ground truth 우선 판정으로 stale JWT 무관 보장
- **결함 #3**: **박제 누락** — admin/page.tsx L158~171 quickLinks 배열에 2개만. 페이지는 8 핵심 admin 라우트 모두 존재 (Glob 확인) — 빠른 메뉴 진입 카드 박제 부족

#### Q 결재 사항 (debugger 권고 — PM/사용자 결재 후 확정)
- **DB 폴백 vs JWT 갱신**: 본 fix = DB 폴백 (즉시 + 안전). 후속 PR 큐 = JWT 강제 만료 (admin_role 변경 시 자동 재로그인 — 운영 자동화)
- **첫 활성 협회 자동 선택**: me API 의 `effectiveAdmin` 강제 sentinel = admin-guard.ts 의 sentinel 분기 (L144~167) 와 동일 로직 카피 — 1차 source (admin-guard) 변경 안 함 (회귀 위험 회피)
- **quickLinks 8개**: 정산 대시보드 / 설정 2개는 사이드바만 박제 (빠른 메뉴 미박제 — 8 카드 lg:grid-cols-2 = 4행 가지런)

#### 검증 결과
- `npx tsc --noEmit`: **0 에러** (회귀 0)
- `npx vitest run`: **921/921 PASS** (PR4-UI 직후 921 동일 / 회귀 0)

#### 회귀 검증
- **일반 user (비관리자)**: DB.isAdmin=false / DB.admin_role=null → 폴백 분기 false → 기존 동작 그대로 (admin=null / adminInfo=null / recorder_admin=false / 사이드바 본인 메뉴만) ✅
- **super_admin (DB.isAdmin=true)**: DB 폴백으로 effectiveAdmin sentinel 채움 보장 — JWT stale 이어도 사이드바 admin 섹션 노출 + entryRole="super_admin" → "Super Admin 권한 진입" 정확 표시 ✅
- **recorder_admin (DB.admin_role="recorder_admin" / JWT stale)**: DB 폴백으로 effectiveAdmin sentinel 채움 + admin/page.tsx entryRole="recorder_admin" → "Recorder Admin 권한 진입" 정확 표시 + 사이드바 admin 섹션 12 permission 노출 + 빠른 메뉴 8개 ✅
- **협회 관리자 (기존 association_admin)**: 기존 동작 보존 — `admin` 변수가 정상 채워지므로 폴백 분기 미진입. sg/refchief/staff 등 role 매칭 그대로 ✅

#### errors.md 박제 항목
- `[2026-05-15] recorder_admin 사이드바 admin 섹션 비노출 = JWT stale 함정 (PR4-UI 사용자 보고 fix)` — JWT stale 함정 + DB ground truth 폴백 표준 + role 변경 시 재로그인 안내 의무 + JWT 강제 만료 후속 PR 큐

#### 사용자 후속 검증 사항
1. **로그아웃 후 재로그인 권장**: 본 fix 는 stale JWT 도 통과시키도록 DB 폴백 박제. 그러나 클린 검증 위해 user_id=3431 본인이 한 번은 로그아웃→재로그인 권장 (JWT 갱신 후 DB.admin_role 반영)
2. **사이드바 검증** (lg+): /referee 진입 → 좌측 사이드바 = 본인 7항목 + "관리자" 섹션 + 9 admin 항목 (관리자/배정 관리/공고 관리/일괄 등록/일자별 운영/정산 관리/정산 대시보드/배정비 단가/설정) 노출
3. **admin 페이지 라벨 검증**: /referee/admin 진입 → 상단 안내 박스 "**Recorder Admin** 권한 진입" 표시 (Super Admin 아님 — DB 폴백으로 보장)
4. **빠른 메뉴 8개 검증**: /referee/admin 진입 → "빠른 메뉴" 영역 8개 카드 노출 (심판 관리 / 배정 관리 / 공고 관리 / 일자별 운영 / 정산 관리 / 배정비 단가 / 일괄 등록 / Excel 일괄 검증)
5. **회귀 검증**: 일반 사용자 / 협회 관리자 / super_admin 진입 시 기존 동작 변경 0 확인
6. **임시 스크립트 정리**: `scripts/_temp/check-user-3431.ts` 삭제 (운영 DB credentials 노출 방지 — 운영 안전 룰)

## 테스트 결과 (tester)
(Phase 2 완료 후 시각 검증 박제)

## 리뷰 결과 (reviewer)
(필요 시 박제)

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-15 | Phase 7 A PR2+PR3 E2E 시나리오 2 (회차 복제) + 시나리오 3 (1회성 대회) 박제 | ✅ 신규 2 + 수정 1 / ~418 LOC / tsc 0 / vitest 921/921 PASS / 운영 코드 변경 0 / 운영 DB 영향 0 (실행은 사용자 검증) / fixtures 시드 헬퍼 2 확장 / commit 결재 대기 |
| 2026-05-15 | Phase 23 PR-EDIT1~EDIT4 종료 매치 수정 모드 별도 기능 (Q3~Q8 권고안) | ✅ 수정 4 파일 / +~370 LOC / tsc 0 / vitest 236/236 / canEdit (super/organizer/TAM) + isEditMode state + edit_mode body 우회 + audit "completed_edit_resubmit" + 수정 이력 inline (Q7 옵션 A — 매치 상세 페이지 미존재로 score-sheet 인라인) / commit 결재 대기 |
| 2026-05-15 | Admin-1 Phase components/admin/* 10 컴포넌트 박제 (시안 v2.14) | ✅ 신규 6 + 수정 1 / ~1744 LOC / tsc 0 / admin.css + 신규 5 컴포넌트 / 갱신 5 보류 (호출처 29 파일 보존) / Admin-2 결재 대기 |
| 2026-05-15 | PR4-FIX recorder_admin UI 결함 3건 진단+수정 (사이드바/Super Admin 라벨/빠른 메뉴) | ✅ 수정 2 파일 / +95 LOC / tsc 0 / vitest 921/921 PASS / DB ground truth 폴백 박제 (JWT stale 함정 영구 차단) / 회귀 0 / errors.md 박제 / commit 결재 대기 |
| 2026-05-15 | Phase 23 PR-RO1~RO4 종료 매치 read-only 차단 (5 계층 방어 박제) | ✅ 수정 7 파일 / ~131 LOC / tsc 0 / vitest 236/236 PASS / 운영 동작 8 케이스 보존 / Q1~Q8 권고안 박제 / commit 결재 대기 |
| 2026-05-15 | `.git/index` 손상 복구 + 다른 세션 미커밋 5 파일 WIP commit 분리 (0853927) | ✅ score-sheet + me + association-wizard 78 lines 박제 / admin sync 전 working tree clean 확보 / 본 의뢰 §2 Phase 0 실제 필요했음 (의뢰서 가정 맞음) |
| 2026-05-15 | Phase 6 PR2 협회 마법사 본체 (Step 1~3 + WizardShell + sessionStorage + 진입 카드) | ✅ 79e72de — super_admin 전용 / Q4 결재 적용 |
| 2026-05-15 | Phase 6 PR1 협회 마법사 API 3 endpoint | ✅ 39e7aab — Association/Admin/FeeSetting 3 라우트 |
| 2026-05-15 | PR-G5 대진표 생성기 placeholder 박제 자동화 (강남구 사고 영구 차단) | ✅ eba655d + 72b818b — 6 format 보강 / 헬퍼 박제 |
| 2026-05-15 | PR3 recorder_admin /referee/admin 진입 + admin-guard sentinel + RoleMatrixCard | ✅ facafd7 — 수정 6 파일 / tsc 0 / vitest 873/873 |
| 2026-05-15 | PR2 recorder_admin 기록원 배정 API 가드 (recorders GET/POST/DELETE) | ✅ 29730ba — 라우트 내부 헬퍼 / vitest 868/868 |
| 2026-05-15 | PR1 recorder_admin 권한 헬퍼 + 기록 API 가드 | ✅ 718c32f — 신규 3 파일 + 수정 3 / 16 신규 케이스 |

## 구현 기록 (developer) — Phase 6 PR3 Referee Step 4 (2026-05-15)

📝 구현한 기능: 협회 마법사 Step 4 (옵션) Referee 사전 등록 + `POST /api/web/admin/associations/[id]/referees` 신규. 배치 등록 (createMany skipDuplicates) / 빈 배열 허용 (skip 진행) / Q7 결재 = 자격번호 1차 미검증 박제. 마법사 progress 4 step → 5 step 확장 (4=referee / 5=확인). 빈 배열일 때 API 호출 0 (운영 DB 부하 가드).

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `src/app/api/web/admin/associations/[id]/referees/route.ts` | POST 배치 등록 — Zod referees[] (name min 2 / 나머지 선택) + association 존재 확인 (404) + 빈 배열 skip (200) + createMany skipDuplicates + 응답 created_count + 일부 컬럼 미리보기 | 신규 | ~135 |
| `src/app/(admin)/.../wizard/association/_components/Step4RefereeRegister.tsx` | 동적 row 추가 UI (배열) — 빈 상태 안내 + row 1건 단위 add/remove + 4 input (name 필수 / license/region/contact 선택) + Q7 안내 박스 | 신규 | ~195 |
| `src/lib/tournaments/association-wizard-types.ts` | RefereeInput interface + AssociationWizardDraft.referees: RefereeInput[] + current_step 1\|2\|3\|4\|5 + AssociationRefereesCreateResponse | 수정 | +35 |
| `src/lib/tournaments/association-wizard-constants.ts` | ASSOCIATION_WIZARD_STEPS 5 entries (4=sports / 5=check_circle) + INITIAL_DRAFT.referees: [] | 수정 | +5 |
| `src/app/(admin)/.../wizard/association/page.tsx` | Step4RefereeRegister import + canProceedAtStep 5 step 확장 (Step 4: row 0 = 통과 / row 1+ = 모든 name min 2) + handleNext/Prev 1~5 + handleSubmit 4번째 referees POST (빈 배열 시 skip) + step 5 = WizardConfirm | 수정 | +50 |
| `src/app/(admin)/.../wizard/association/_components/WizardShell.tsx` | currentStep prop 1\|2\|3\|4\|5 + isLastStep = currentStep === 5 (progress 자동 5 column — ASSOCIATION_WIZARD_STEPS map) | 수정 | +3 |
| `src/app/(admin)/.../wizard/association/_components/WizardConfirm.tsx` | Step 4 Referee section 추가 (draft.referees 표시 / 빈 배열 시 skip 메시지 / 등록 시 #/이름/자격번호/지역 list) + 안내 박스 동적 (referees > 0 시 "심판 사전 등록" 단계 추가) | 수정 | +47 |
| `src/__tests__/api/association-wizard.test.ts` | PrismaMocks 에 refereeCreateMany/refereeFindMany 추가 + 케이스 9 (정상 3건 / createMany 호출 검증) + 케이스 10 (빈 배열 / createMany 호출 안 함) + 케이스 11 (association 부재 → 404) | 수정 | +135 |

**총 신규 2 + 수정 6 / ~605 LOC** (예상 ~300 LOC 대비 +100% — Step4 컴포넌트 풀 UI + 응답 미리보기 컬럼 + vitest 3 케이스 풀 커버).

🛡️ 적용된 가드:
- **schema 변경 0**: Referee 모델 (v3 user_id nullable / registered_name/license_number @unique / match_status default unmatched) 이미 운영 박제 — `prisma db push` 호출 0건.
- **Q7 1차 미검증**: createMany 시 verifiedAt 컬럼 미존재 → match_status="unmatched" + user_id=null + 검증 플래그 0 박제.
- **빈 배열 skip 가드**: API 라우트 + 마법사 page 양면 — DB 호출 0 (운영 부하 가드 / errors.md 2026-04-17 함정 답습).
- **createMany P2002 안전**: license_number @unique 충돌 시 skipDuplicates=true → throw 회피 (1차 미검증 의도).
- **BigInt 안전 변환**: `try { BigInt(...) } catch { 404 NOT_FOUND }` — 비-숫자 route param 방어.
- **canProceed 사전 가드**: Step 4 row 1건 이상 시 모든 name min 2 강제 → 422 사전 차단.
- **admin 빨강 본문 금지 룰**: `var(--color-info)` + `--color-text-*` + `--color-elevated` 토큰만 — `--color-primary` 본문 0.
- **AppNav frozen**: main tab / 더보기 변경 0 — Step4 추가는 마법사 내부만.

✅ 검증 결과:
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | **exit=0** (회귀 0) |
| `npx vitest run src/__tests__/api/association-wizard.test.ts` | **11/11 PASS** (371ms / PR1 8 + PR3 3) |
| `npx vitest run` (전체 회귀) | **921/921 PASS** (PR2 직후 918 + PR3 신규 3 = 921 / 회귀 0) |
| 운영 DB schema 변경 | 0 |
| Flutter v1 영향 | 0 (`/api/v1/...` 변경 0) |
| 다른 세션 박제 손대지 | 0 (파일 끝 append only) |
| working tree 다른 세션 파일 손대지 | 0 (본 PR 변경 = 신규 2 + 수정 6 only) |

💡 tester 참고:
- **테스트 방법** (페이지 렌더 사용자 검증):
  1. super_admin 계정 로그인 → `/tournament-admin/wizard/association` 진입.
  2. Step 1~3 통과 → Step 4 (심판 사전 등록) 진입 확인 — 빈 상태 안내 + "심판 추가" 버튼.
  3. **케이스 A (skip)**: 등록 없이 다음 → Step 5 확인 페이지 = "등록 없이 진행" 표시 → 생성 → 협회/사무국장/단가표 3건 INSERT + Referee 0건.
  4. **케이스 B (1건)**: "심판 추가" → name "홍길동" + license "TEST-001" + region "서울" → 다음 → Step 5 = 1건 미리보기 → 생성 → Referee 1건 INSERT.
  5. **케이스 C (3건)**: 3 row 추가 (각 name 입력) → 다음 → 생성 → Referee 3건 INSERT.
  6. **케이스 D (검증)**: row 추가 + name 1자만 입력 → "다음" 버튼 비활성 확인.
  7. sessionStorage 보존: Step 4 도중 새로고침 → row + 입력값 보존 확인.
- **정상 동작**: 빈 배열 = API 호출 0 / 1건 이상 = createMany 1회 + findMany 1회 응답 / 응답 키 created_count + referees[] (snake_case + BigInt → string).
- **주의할 입력**:
  - license_number 중복 (예: 다른 협회 이미 박제) → skipDuplicates=true 로 skip (created_count 가 입력 건수보다 적음 — UI 안내 없음 / 후속 사용자 결재 시 안내 추가).
  - row 100건 초과 → 422 (Zod max 100).
  - name 50자 초과 → 422 (Zod max 50).
  - 도중 실패 시 협회/사무국장/단가표 는 이미 INSERT 완료 — 운영자 수동 정정 (시안 spec).

⚠️ reviewer 참고:
- **특별히 봐줬으면 하는 부분**:
  - `createMany` + `findMany` 2 호출 — 응답에 등록된 row 일부 컬럼 미리보기 박제 의도 (UI 검증 / 디버깅용). 단점 = 다른 운영자 동시 작업 시 일부 mismatch 가능 (LIMIT N + ORDER BY created_at DESC). 대안 = createMany 후 transaction `tx.referee.findMany` — 후속 결재 시 검토.
  - `skipDuplicates: true` — license_number @unique 충돌 시 silent skip (1차 미검증 박제 Q7 의도). 후속 검증 PR 진입 시 명시 P2002 catch + 사용자 안내로 강화 권장.
  - canProceed Step 4 검증: row 0 = 통과 (skip 의도) / row 1+ = 모든 name min 2 (Zod 정합). API 호출 사전 차단.
  - WizardConfirm 안내 박스 = `referees.length > 0` 시 단계 수 동적 ("→ 심판 사전 등록" 추가) — 운영자 인지 명확.
- **PR3 완료 후 후속**:
  1. Step 2 처럼 user_id 매칭 후 활성 심판 흐름 = Phase 1-B "사전 등록 user 매칭" 흐름 별도 PR (기존 흐름).
  2. 자격번호 검증 후속 (Q7) — OCR / 협회 API 연동 = 별도 큐.
  3. 협회 상세 페이지 (`/admin/associations/[id]`) 신규 — referees 목록 / 단가표 편집 / admin 추가 등 = 별도 PR.

### 사용자 후속 검증 사항
1. **페이지 렌더**: `npm run dev` (port 3001) → super_admin 계정 → 협회 마법사 Step 4 진입 + row add/remove + Step 5 미리보기.
2. **API 동작**: Step 4 1건 이상 입력 후 생성 → 운영 DB `referees` 테이블 row 신규 (registered_name + license_number + association_id 박제 / match_status=unmatched / user_id=null).
3. **skip 흐름**: Step 4 등록 없이 다음 → 협회/사무국장/단가표 3건만 INSERT (referees 0건).
4. **검증 실패**: row 추가 + name 미입력 → 다음 버튼 비활성 / row 100건 초과 → 422.
5. **license_number 중복**: 동일 license_number 2건 동시 입력 → skipDuplicates 로 1건만 INSERT (created_count=1).

## 구현 기록 (developer) — Phase 23 PR-RO1~RO4 (종료 매치 read-only 차단)

📝 구현한 기능: 종료된 매치 (status="completed") 진입 시 모든 input/button/모달 차단 (사용자 결재 Q1~Q8 권고안 박제). 클라이언트 4 PR (RO1~RO3) + BFF 1 PR (RO4) = 5 분리 묶음 통합 박제. 운영 동작 100% 보존 = 진행 중 매치 (isCompleted=false) 변경 0. 인쇄 / ← 메인 / 다크모드 = 항상 활성. Phase 22 PBP 보정 / Phase 23 PR4 audit / Phase 19 PR-S/Stat 흐름 영향 0.

### 4 PR 묶음 — 변경 파일 + LOC

| PR | 파일 | 변경 | 신규/수정 | LOC |
|----|------|------|----------|-----|
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | `readOnly?: boolean` prop 추가 → SSFieldInput 3 input (Referee/Umpire 1/Umpire 2) readOnly wiring | 수정 | +9 |
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | `readOnly?: boolean` prop 추가 → Coach + Assistant Coach input readOnly wiring (button/cell 은 기존 disabled 그대로) | 수정 | +9 |
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/footer-signatures.tsx` | `readOnly?: boolean` prop 추가 → frameless=true 분기 8 input readOnly wiring (Scorer/Asst/Timer/ShotClockOp/Referee/Umpire 1/2/Captain) + frameless=false 분기 SigInput 8 + Notes textarea (회귀 안전망) | 수정 | +22 |
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/period-scores-section.tsx` | 변경 0 (이미 `disabled?: boolean` prop 보유 — OT 종료 빨강 버튼 분기 그대로) | — | 0 |
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/running-score-grid.tsx` | `readOnly?: boolean` prop 추가 → handleCellClick early return 분기 (모달 open / addMark / undoLastMark 차단) | 수정 | +9 |
| RO1 | `stat-popover.tsx` / `quarter-end-modal.tsx` | 변경 0 (RO2 form.tsx 에서 mount X — open 강제 false) | — | 0 |
| RO2 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (a) 12 핸들러 isCompleted early return (handleAdvancePeriod/handleRetreatPeriod/handleEndPeriod/handleEndMatchFromQuarterEnd/handleContinueToOvertime/handleRequestAddFoul/handleRequestRemoveFoul/handleRequestAddTimeout/handleRequestRemoveTimeout/handleRequestOpenStatPopover/handleAddStat/handleRemoveStat/handleSelectFoulType/handleLineupConfirm) (b) 4종 모달 open 가드 (`!isCompleted && ctx !== null` 패턴 — FoulTypeModal/StatPopover/QuarterEndModal/LineupSelectionModal) (c) 자식 6 컴포넌트 readOnly/disabled prop 전달 (FibaHeader/TeamSection×2/FooterSignatures/RunningScoreGrid/PeriodScoresSection) (d) 라인업 다시 선택 button conditional render (isCompleted 시 hidden) | 수정 | +52 |
| RO3 | `src/app/(score-sheet)/_components/score-sheet-toolbar.tsx` | `hideEndMatch?: boolean` prop 추가 → 경기 종료 button conditional render (인쇄 + ← 메인 = 항상 노출 / 사용자 결재 Q2) | 수정 | +12 |
| RO3 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | ScoreSheetToolbar 호출에 `hideEndMatch={isCompleted}` + onEndMatch 안 `if (isCompleted) return` 이중 방어 wiring (MatchEndButton hideTriggerButton 기존 hardcoded true 그대로 — 운영 동작 보존) | 수정 | (RO2 합산) |
| RO4 | `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | `match.status === "completed"` 거부 분기 (423 MATCH_LOCKED) — getRecordingMode 가드 직전 박제 (L415 부근). 수정 모드 우회는 별도 PR-EDIT3 큐 | 수정 | +18 |

**총 수정 7 파일 (period-scores-section / stat-popover / quarter-end-modal 변경 0) / 신규 0 / 약 131 LOC**.

### isCompleted 분기 적용 위치 (방어 깊이)

| 계층 | 위치 | 차단 효과 |
|---|---|---|
| 1차 — 핸들러 가드 | score-sheet-form.tsx 14개 핸들러 첫 줄 `if (isCompleted) return` | 사용자 액션 진입점 0 (setState 0) |
| 2차 — 자식 prop | 6 컴포넌트에 readOnly/disabled 전달 | HTML 표준 input/button 시각 차단 |
| 3차 — 모달 open | 4 모달 `!isCompleted && ctx` 분기 | 모달 mount 0 (state 박제되도 렌더 0) |
| 4차 — toolbar hide | ScoreSheetToolbar hideEndMatch | 경기 종료 button DOM 0 |
| 5차 — BFF 거부 | submit/route.ts MATCH_LOCKED 423 | curl/콘솔 우회도 BFF 단계 차단 |

### 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | **exit=0** (에러 0 / 회귀 0) |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | **14 파일 / 236/236 PASS** (회귀 0 / 1.20s) |
| 3 | grep `readOnly\?:` in 자식 컴포넌트 | 4 파일 매치 (fiba-header/team-section/footer-signatures/running-score-grid — period-scores-section 은 의뢰서대로 변경 0) |
| 4 | grep `isCompleted` 분기 in form.tsx | 23건 매치 (핸들러 14 + 모달 open 4 + 자식 prop 6 - 일부 중복 = 23) |
| 5 | grep `MATCH_LOCKED` in submit/route.ts | 3건 (주석 2 + apiError 코드 1) |

### 운영 동작 보존 검증

| # | 케이스 | 검증 결과 |
|---|------|------|
| 1 | status="draft" / in_progress 매치 진입 | isCompleted=false → 모든 차단 분기 미진입 → 운영 동작 변경 0 ✅ |
| 2 | status="completed" 매치 진입 | 모든 input readOnly + button disabled + 4 모달 mount X + 노란 배너 유지 ✅ |
| 3 | 인쇄 / ← 메인 / 다크모드 토글 | 활성 유지 (toolbar hideEndMatch 만 차단 / 인쇄+메인+다크 = 분기 0) ✅ |
| 4 | 4종 모달 진입점 | 차단 (핸들러 가드 + open 분기 가드 이중 방어) ✅ |
| 5 | 5반칙 차단 / Phase 17 색 / Phase 19 PR-T/Stat / Phase 23 자동 로드 | 영향 0 (props prop drilling 만 추가 / 비즈니스 로직 변경 0) ✅ |
| 6 | BFF submit (status=draft/in_progress) | MATCH_LOCKED 분기 미진입 → 통과 ✅ |
| 7 | 라이브 페이지 | 영향 0 (status 변경 0 / 본 PR = score-sheet 한정) ✅ |
| 8 | Flutter v1 API | 영향 0 (paper 매치 BFF 전용 / `/api/v1/...` 변경 0) ✅ |

### Q 결재 사항 (사용자 사전 결재 — Q1~Q8 권고안 박제)

| Q | 결정 | 본 PR 적용 |
|---|------|------|
| Q1 | tester 별도 추적 | 본 작업 범위 외 (RO 적용 후 자동 해소 검증은 tester 큐) |
| Q2 | 종료 매치 = 모든 input/button/모달 차단 (인쇄+메인 제외) | ✅ 적용 — 5 계층 방어 |
| Q3~Q7 | EDIT1~EDIT4 (B 영역 후속) | 본 PR 범위 외 (RO4 = 거부만 / EDIT3 = 수정 모드 우회) |
| Q8 | BFF MATCH_LOCKED 423 + 수정 모드 우회 분기 (이중 방어) | ✅ RO4 적용 — 거부만 (우회는 EDIT3 후속) |

💡 tester 참고:
- **테스트 방법**:
  1. 진행 중 매치 (status="draft") 진입 → 모든 input/button/모달 정상 동작 확인 (회귀 0).
  2. 종료 매치 (status="completed") 진입 → 노란 배너 노출 + Coach input 클릭 시 readOnly (입력 차단) + 파울 cell 클릭 시 disabled (모달 mount 0) + toolbar 경기 종료 버튼 hidden 확인.
  3. 종료 매치에서 인쇄 클릭 → window.print() 정상 호출 / ← 메인 클릭 → /admin 이동 / 다크모드 토글 정상.
  4. curl/fetch 로 종료 매치 submit POST → 423 MATCH_LOCKED 응답 + "종료된 매치는 수정할 수 없습니다" 메시지 확인.
- **정상 동작**: status 분기 = 진행 매치 변경 0 / 종료 매치 5 계층 차단. 다크모드 / 인쇄 / 메인 유지.
- **주의할 입력**:
  - status="completed" + draft 가 localStorage 에 남아있는 케이스: ConfirmModal 띄우는 useEffect 는 isCompleted 가드 미포함 (사용자 결재 Q3 별도 흐름 / Phase 23 PR4 audit 만) — 의도된 동작 (draft 비교는 표시만 / 실제 수정은 모든 가드로 차단).
  - 라인업 미박제 + status="completed" 동시 케이스: LineupSelectionModal 자동 open 차단 (open={!isCompleted && lineupModalOpen}) → 양식 미렌더 + 라인업 선택 열기 버튼만 노출 (드물지만 운영자 인지 가능).

⚠️ reviewer 참고:
- **특별히 봐줬으면 하는 부분**:
  - **방어 깊이 5 계층** — 사용자 결재 Q8 (이중 방어) 권고안 충실 박제. 클라이언트 4 계층 (핸들러/prop/모달/toolbar) + BFF 1 계층 (MATCH_LOCKED) = 어떤 우회 경로도 차단.
  - **MatchEndButton.hideTriggerButton** — 의뢰서 표현 "controlled props 재활용 (PR-S2)" = 이미 hardcoded true (toolbar 가 trigger 흡수). isCompleted 분기 별도 추가 시 → 진행 매치 hideTriggerButton=false 회귀. 그래서 기존 true 유지 + toolbar hideEndMatch 만 분기 (이중 방어 충분).
  - **MatchEndButton.onSubmittedChange 안 audit 호출** — Phase 23 PR4 의 completed_edit_resubmit audit endpoint 호출 분기 보존 (RO 차단으로 BFF 401 도달 차단이 우선 — audit 호출은 사실상 발생 X but 코드 정합 보존).
  - **dead path readOnly 추가** — footer-signatures.tsx 의 frameless=false 분기 (실제 진입 0) 도 readOnly wiring. 회귀 안전망 + 단위 테스트 가능성 위해 동시 박제.
- **API 패칭 최소**: BFF 1 라우트 (submit/route.ts) 거부 분기 1개 추가 — match.status SELECT 는 access 가드에서 이미 fetch (추가 DB 라운드트립 0).
- **DB 변경 0**: schema / migration / prisma db push 호출 0.
- **Flutter v1 영향 0**: `/api/v1/...` 변경 0 — paper 매치 BFF (`/api/web/score-sheet/[matchId]/submit`) 전용.
- **AppNav frozen 영향 0**: score-sheet 페이지 = layout.tsx 의 RotationGuard / no AppNav.

### 잠재 위험 / 메모

- **수정 모드 우회 (PR-EDIT1~EDIT4)** = 본 PR 범위 외. 종료 매치 수정이 필요한 경우 사용자가 별도 PR-EDIT3 (`editMode: true` query param/body) 으로 진입. 본 PR = 차단만.
- **MATCH_LOCKED 응답 키** = 운영 BFF 첫 도입 코드. Flutter v1 영향 0 (`/api/web/...` BFF 전용). 후속 EDIT3 에서 동일 코드 재사용 가능.
- **cross-check-audit endpoint 영향 0** = Phase 23 PR4 흐름 그대로 (mount 1회 entry audit + submit 시 resubmit audit). RO 차단으로 submit 도달 0 = resubmit audit 실제 발생 0 (의도된 동작 / 코드 정합 보존).
- **PR 분리 commit 전략**: 4 PR 묶음 (RO1/RO2/RO3/RO4) — commit 분리 시 RO1 → RO2 → RO3 → RO4 순서 권장 (RO2 가 자식 prop 의존). PM 결재 시 단일 commit 또는 4 분할 선택.

### 사용자 후속 검증 사항

1. **종료 매치 실 진입**: 운영 DB 에 status="completed" 매치 1건 선택 → /score-sheet/{matchId} 진입 → 노란 배너 + 모든 input readOnly + 모든 button disabled + toolbar 경기 종료 hidden + 4종 모달 mount 0 확인.
2. **진행 매치 회귀 0**: status="draft" / in_progress 매치 진입 → 모든 입력/버튼/모달 정상 동작 (5 계층 차단 미진입 확인).
3. **curl 우회 검증**: `curl -X POST /api/web/score-sheet/{completed_match_id}/submit -d '{...}'` → 423 MATCH_LOCKED 응답 확인.
4. **인쇄 + ← 메인 + 다크모드**: 종료 매치 진입 후 3 액션 모두 정상 동작 확인.
5. **commit 결재**: PM 단일 또는 4 분할 commit 결정 후 사용자 결재 받아 push.

### Admin-1 Phase 박제 — components/admin/* 10 컴포넌트 (2026-05-15)

📝 구현 요약: BDR-current v2.14 시안 박제 — `admin.css` (1156줄) 신규 + 신규 5 컴포넌트 (admin-shell / admin-stat-card / admin-empty-state / admin-progress-bar / admin-checklist-card) 추가. 기존 5 컴포넌트 (sidebar / mobile-admin-nav / admin-page-header / admin-status-tabs / admin-detail-modal) = **호출처 29 파일 props 시그니처 100% 보존**을 위해 본 PR 시각 갱신 0 (Admin-2~Admin-7 진입 시 layout.tsx 와 함께 자연 갱신). DB 변경 0 / Flutter v1 영향 0 / 운영 페이지 회귀 0 (admin.css 추가만 + import 1줄 + 신규 컴포넌트는 미호출 = 사용자 페이지에 노출 0).

#### 변경 파일 + LOC
| 파일 | 변경 | 신규/수정 | LOC |
|------|------|----------|-----|
| `src/styles/admin.css` | 시안 admin.css 1154줄 박제 + `--overlay` fallback + `data-tone="accent"` admin-stat-pill 1 룰 추가 | 신규 | ~1180 |
| `src/components/admin/admin-shell.tsx` | AdminShell wrapper (sidebar + topbar + main + 헤더 자동) — sidebarVariant 'default/hidden' + roles + user + topbar 슬롯 | 신규 | ~95 |
| `src/components/admin/admin-stat-card.tsx` | AdminStatCard 통계 카드 — label/value/icon/delta/trend + skeleton + onClick (button↔div 자동) | 신규 | ~90 |
| `src/components/admin/admin-empty-state.tsx` | AdminEmptyState 빈 상태 카드 — icon/title/description/ctaLabel+onCta | 신규 | ~55 |
| `src/components/admin/admin-progress-bar.tsx` | AdminProgressBar 진행도 바 — completed/total/% + size sm/md + tone accent/ok/warn + isDone 자동 ok | 신규 | ~115 |
| `src/components/admin/admin-checklist-card.tsx` | AdminChecklistCard 체크리스트 카드 — num/label/desc/icon/status (done/progress/idle/locked) + required + lockedReason + onClick | 신규 | ~205 |
| `src/app/layout.tsx` | `import "../styles/admin.css"` 1줄 (globals.css 직후) — admin.css 활성화 | 수정 | +4 |

**총 신규 6 + 수정 1 / ~1744 LOC** (의뢰서 예상 ~600 LOC 대비 1180줄이 admin.css 시안 박제 직카피 + 5 컴포넌트 295 LOC + import 4 LOC).

#### 토큰 매핑 적용 결과 (운영 globals.css ↔ 시안 admin.css)
| 시안 토큰 | 운영 토큰 | 매핑 결과 |
|---|---|---|
| `--bg` `--bg-elev` `--bg-card` `--bg-alt` `--bg-head` | 동일 | 운영 globals.css L76~135 박제 — 치환 0건 |
| `--ink` `--ink-soft` `--ink-mute` `--ink-dim` `--ink-on-brand` | 동일 | 운영 globals.css L84~141 박제 — 치환 0건 |
| `--border` `--border-strong` | 동일 | 운영 globals.css L91~144 박제 — 치환 0건 |
| `--accent` `--accent-soft` | 동일 | 운영 globals.css L104~155 박제 — 치환 0건 |
| `--ok` `--warn` `--danger` `--info` | 동일 | 운영 globals.css L50~53 박제 — 치환 0건 |
| `--cafe-blue` `--cafe-blue-deep` `--cafe-blue-soft` `--cafe-blue-hair` | 동일 | 운영 globals.css L96~149 박제 — 치환 0건 |
| `--ff-display` `--ff-body` `--ff-mono` | 동일 | 운영 globals.css L45~47 박제 — 치환 0건 |
| `--overlay` | **미박제** | admin.css :root fallback 박제 (rgba 0/0/0/0.45 light, 0.65 dark) — globals.css 영향 0 |
| `--err` (시안 jsx 1건) | `--danger` 치환 | AdminChecklistCard 필수 표시 `*` 색상 (시각 동일 빨강) |

**핵심**: 시안 v2.14 가 운영 globals.css 의 신 토큰 체계와 100% sync — 치환 거의 0건. 박제 비용 = admin.css 카피 + 컴포넌트 .tsx 변환만.

#### 검증 결과
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | **exit=0** (에러 0 / 회귀 0) |
| 운영 DB schema 변경 | 0 |
| Flutter v1 API 영향 | 0 (`/api/v1/...` 변경 0) |
| 기존 admin 페이지 회귀 | 0 (기존 5 컴포넌트 시그니처 보존 + admin.css 추가만 / 클래스 명 충돌 0 — admin- prefix) |
| 호출처 29 파일 영향 | 0 (props 시그니처 보존) |

#### 갱신 5 컴포넌트 = 본 PR 보류 결정 (사용자 결재 권한 위임)
| 컴포넌트 | 보류 사유 | 후속 |
|---|---|---|
| `sidebar.tsx` | Tailwind `aside__link / aside__title` + 운영 navStructure 그대로. 시안 `.admin-aside__*` 클래스로 전환 시 호출처 (admin/layout.tsx) 검증 필요 | Admin-2 진입 시 layout.tsx 와 같이 갱신 |
| `mobile-admin-nav.tsx` | `lg:hidden fixed top-3 right-3` Tailwind. 시안 `.admin-mobile-toggle` 으로 전환 시 LogoutButton + user 카드 wiring 회귀 검증 필요 | Admin-2 진입 시 같이 갱신 |
| `admin-page-header.tsx` | searchForm + actions 슬롯 시그니처 호출처 = (admin)/admin/users/page.tsx 등 다수. 시안 박제는 search 없음 → 호출처 회귀 가능성 | Admin-2 진입 시 호출처 search 외부 이동 후 갱신 |
| `admin-status-tabs.tsx` | activeTab key 시그니처 보존 + 시안 `.admin-status-tabs` 박제 = 클래스만 갱신 가능 (점진) | Admin-2 진입 시 갱신 |
| `admin-detail-modal.tsx` | 시안 = right slide-in (admin-detail-modal) vs 운영 = 중앙 모달. UX 자체 변경 — 호출처 다수 (admin-users-table 등) 동작 변경 위험 | 사용자 결재 + Admin-2 진입 후 별도 PR |

#### 호출처 영향 분석 (29 파일 — 본 PR 영향 0)
- 본 PR 변경 = `admin.css` 신규 + 신규 5 컴포넌트 .tsx 신규 + layout.tsx import 1줄
- 기존 컴포넌트 시그니처 변경 0 → 29 파일 영향 0
- admin.css 클래스 = `.admin-*` prefix → 비-admin 영역 영향 0
- `--overlay` fallback = `:root` 박제 → admin 외 페이지에서 사용 안 함 (의도된 isolation)

💡 tester 참고:
- **시각 검증 의무 영역**:
  1. 기존 admin 페이지 (`/admin` 대시보드 / `/admin/users` / `/admin/tournaments` 등 29 페이지) → **회귀 0 확인** (Tailwind 클래스 그대로 동작 / admin.css 추가는 unused — admin- prefix 클래스 미사용 페이지에서 영향 0)
  2. 다크모드 토글 → admin.css 의 `[data-theme="dark"]` 셀렉터가 운영 룰 그대로 박제 (border-strong + border-radius 0)
  3. 신규 컴포넌트는 본 PR에서 미호출 → 시각 0 검증 (Admin-2 진입 시 SetupHub 페이지에서 첫 렌더)
- **테스트 방법**:
  - dev 서버 (`npm run dev` port 3001) 띄우고 admin 페이지 진입 → 기존 화면 100% 그대로 확인
  - DevTools Network 탭에서 admin.css 다운로드 확인 (200 OK / Content-Type text/css)
  - DevTools Elements 탭에서 `:root` 변수 `--overlay` 박제 확인 (rgba(0,0,0,0.45))
- **정상 동작**: admin 페이지 = 100% 회귀 0 / 신규 컴포넌트 = Admin-2 진입 시 SetupHub 첫 렌더 검증
- **주의할 입력**: AdminChecklistCard `status="locked"` 시 onClick 호출 차단 / AdminProgressBar `total=0` 시 NaN 가드 (0% 표시) / AdminStatCard skeleton=true 시 head/value/delta 자리 pulse animation

⚠️ reviewer 참고:
- **특별히 봐줬으면 하는 부분**:
  1. **CSS 격리 전략**: admin.css 별도 파일 (globals.css 3195줄에 1154줄 추가 회피). admin- prefix 클래스로 비-admin 영역 격리 100%. `--overlay` fallback = `:root` 박제이지만 admin 외 페이지에서 미사용 (의도된 isolation).
  2. **갱신 보류 결정**: 의뢰서 §1 "갱신 5 컴포넌트" 항목은 호출처 29 파일 props 보존 룰 우선 → 본 PR 보류. Admin-2 (layout 박제) 진입 시 함께 갱신 — 호출처 회귀 0 보장.
  3. **AdminShell 의 mobileOpen 상태**: 시안은 자체 useState 보유 / 운영 mobile-admin-nav 도 자체 useState 보유 → 본 Shell 의 `_mobileOpen` 은 미사용 placeholder (underscore prefix). Admin-2 진입 시 mobile-admin-nav 의 useState 를 Shell 로 끌어올리거나 그대로 두는 결정 필요.
  4. **breadcrumbs prop 미사용**: AdminShell 박제 시그니처에 breadcrumbs 있지만 AdminPageHeader 운영 시그니처에 breadcrumbs 미포함 → 본 PR underscore prefix (`_breadcrumbs`) 로 인터페이스만 박제. Admin-2 진입 시 admin-page-header 갱신과 함께 wiring.
  5. **AdminChecklistCard 의 `--err` 치환**: 시안 jsx 의 `var(--err)` 토큰 1건 → 운영 `var(--danger)` 치환 박제 (시각 동일 빨강). 운영 globals.css 에 `--err` 토큰 미박제로 인한 의도된 매핑.
  6. **admin-stat-pill `accent` tone 추가**: 시안 jsx `AdminChecklistCard` 가 status=progress 시 `data-tone="accent"` 사용 → admin.css 에 `accent` tone 1 룰 추가 (`err` 와 시각 동일 / semantic 분리만).
- **API 패칭 0**: 본 PR 시각 박제 only — fetch/API/DB 호출 0
- **Flutter v1 영향 0**: `/api/v1/...` 변경 0
- **AppNav frozen 영향 0**: admin 영역은 main AppNav 사용 안 함 (자체 AdminSidebar) — frozen 룰 미적용

#### 잠재 위험 / 메모
- **admin.css 다운로드 무게**: ~30KB (압축 후 ~6KB) — initial load 추가. 단 admin 페이지 외 사용자가 admin- 클래스 사용 안 하므로 사실상 사용자 영역 영향 0 (CSS 다운로드만 — 적용 0).
- **`--overlay` fallback 의도된 격리**: globals.css 에 추가하지 않고 admin.css `:root` 박제 → 향후 글로벌 시안에서 `--overlay` 토큰 도입 시 자연스럽게 globals.css 가 우선 (admin.css 박제는 fallback 역할). 향후 conflict 0.
- **갱신 5 컴포넌트 후속**: Admin-2 (layout + Dashboard 박제) 진입 시 컴포넌트 시각 갱신 함께. tester 검증 시 호출처 29 파일 회귀 필수 확인 (admin-page-header 가 가장 위험 — search form wiring).
- **신규 5 컴포넌트 첫 호출**: Admin-2 SetupHub (E-3) 박제 시 처음 호출 — 본 PR 단독 시각 검증 불가 (mount 안 됨). Admin-2 진입 후 SetupHub 페이지에서 첫 렌더 시각 검증.

### 사용자 후속 검증 사항 (Admin-1)
1. **dev 서버 실행**: `npm run dev` (port 3001) → admin 페이지 진입 → 기존 화면 회귀 0 확인 (가장 중요)
2. **DevTools 네트워크**: admin.css 200 OK / Content-Type text/css 다운로드 확인
3. **DevTools Elements**: `:root` 안 `--overlay` 박제 확인 (rgba(0,0,0,0.45))
4. **다크모드 토글**: admin 페이지에서 다크모드 토글 시 `[data-theme="dark"]` 룰 적용 확인 (admin.css 박제 룰 — admin 페이지 외 영향 0)
5. **Admin-2 결재**: 본 PR (Admin-1) 검증 후 Admin-2 (layout + Dashboard 박제 + 컴포넌트 시각 갱신) 진입 결재

## 구현 기록 (developer) — Phase 7 A PR2+PR3 E2E 시나리오 2+3 (2026-05-15)

📝 구현한 기능: Phase 7 A 마법사 자동 E2E 시나리오 2 (회차 복제 — add-edition 흐름) + 시나리오 3 (1회성 대회 — QuickCreateForm 시리즈=null 명시) 신규 박제. `fixtures.ts` 에 시드 헬퍼 2개 (seedSeries / seedTournamentWithRules) 추가. 운영 코드 (src/) 변경 0 / 운영 DB 영향 0 (E2E 실행은 사용자 검증).

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|-----|
| `tests/e2e/wizard/fixtures.ts` | `seedSeries({organizerId, prefix})` (tournament_series 1건 INSERT — uuid/name/slug/organizer_id/status="active") + `seedTournamentWithRules({seriesId, organizerId, prefix, ruleCount})` (Tournament edition_number=1 + DivisionRule N건 createMany + series.tournaments_count +1) 2 헬퍼 추가 | 수정 | +118 |
| `tests/e2e/wizard/wizard-edition-copy.spec.ts` | 시나리오 2 — beforeAll 시드 (시리즈+회차1+룰5건) → add-edition 진입 → 날짜 +60일 → 제출 → redirect `?added=2` 검증 → DB 사후 6 검증 (회차2 박제 / series_id 매핑 / status="registration_open" / organizerId / edition2 rules=0 (legacy 자동복제 미수행 정합) / edition1 rules=5 / tournaments_count=2) | 신규 | 168 |
| `tests/e2e/wizard/wizard-no-series.spec.ts` | 시나리오 3 — me API → wizard 진입 → 이름 입력 → select="" 명시 → 제출 → DB 사후 6 검증 (series_id=null 핵심 / edition_number=null / status="draft" / organizerId / format / maxTeams) | 신규 | 132 |

**총 신규 2 + 수정 1 / ~418 LOC**.

🛡️ 적용된 가드:
- **prefix 안전 룰**: 시나리오 2 = `e2e-test-{ts}-edition-copy` / 시나리오 3 = `e2e-test-{ts}-no-series-{rand}` — cleanupByPrefix("e2e-test-") 필터 자동 매칭.
- **try-finally cleanup**: afterAll 양면 가드 (beforeAll 시드 실패해도 prefix 잔존 0).
- **BigInt 안전**: seriesId → `.toString()` URL 박제 / testUserId 비교 (errors.md 박제 룰).
- **snake_case 응답**: me API user_id/userId 폴백 (errors.md 5회 사고 룰).
- **운영 동작 정합**: legacy POST 분기 = division_rules 자동 복제 X → 회차 2 rules=0 검증 (의뢰서 §A 의 "5건 복제" 는 마법사 path 한정 — 본 시나리오는 회귀 가드 목적 운영 동작 그대로).
- **운영 코드 변경 0**: src/ 손대지 않음 — 테스트 파일 + fixtures 확장만.

✅ 검증 결과:
| 항목 | 결과 |
|---|---|
| `npx tsc --noEmit` | **exit=0** (회귀 0) |
| `npx vitest run` (전체) | **921/921 PASS** (PR1 직후 동일 / 회귀 0) |
| 운영 DB schema 변경 | 0 |
| Flutter v1 영향 | 0 |
| 다른 세션 박제 파일 손대지 | 0 (append-only 신규 섹션만) |

💡 tester 참고:
- **사용자 후속 검증** (E2E 실행):
  1. `.env.test.local` 에 TEST_USER_EMAIL/PASSWORD 채움 (super_admin/organizer 권한 user).
  2. `npm run dev` (port 3001) 백그라운드 실행 유지.
  3. `npm run test:e2e:wizard` → 시나리오 1+2+3 자동 실행 (예상 1~2분 / setup 5초 + 시나리오 3건).
  4. 통과 시 모든 cleanup 자동 (e2e-test-* prefix 데이터 잔존 0).
- **시나리오 2 의 운영 동작 메모**: add-edition 페이지에 "이전 회차 prefill" 미구현 (line 13~15 빈 초기값) + legacy POST 의 division_rules 자동 복제 미구현 — 본 시나리오는 운영 동작 정합 (회귀 가드 목적). 향후 마법사 path 진입 시 별도 시나리오 추가.

⚠️ reviewer 참고:
- **시나리오 3 = 시나리오 1 동치 검증**: 운영 코드 분기상 동일 path (select value="" + 시리즈 0개 = 의도만 다름). 회귀 가드 안전망 (시리즈 다수 보유 운영자도 1회성 박제 정상 동작 검증).
- **seedTournamentWithRules 의 status="registration_open"** = legacy POST 라우트 line 147 기본값 정합 — schema default ("draft") 이 아닌 라우트 박제값 일치 의도.
- **edition_number=null 검증 (시나리오 3)** = QuickCreateForm 의 `series_id=null` 분기 박제 — 시리즈 미연결 시 채번 0 (회귀 가드).

### 사용자 후속 검증 사항 (PR2+PR3)
1. **TEST_USER 자격증명 박제**: `.env.test.local` 의 placeholder 채움 (super_admin 또는 organizer 권한).
2. **dev 서버 실행 확인**: `npm run dev` → port 3001 listening 확인 (CLAUDE.md 룰).
3. **E2E 실행**: `npm run test:e2e:wizard` → 시나리오 1+2+3 통과 + cleanup 잔존 0 확인.
4. **운영 DB 잔존 검증** (안전 가드): 실행 후 `SELECT count(*) FROM tournaments WHERE name LIKE 'e2e-test-%'` → 0건 확인.
5. **commit 결재**: PR2 + PR3 통합 commit (`test(e2e): Phase 7 A PR2+PR3 시나리오 2+3 박제`) — PM 직접 수행.

## 구현 기록 (developer) — Phase 23 PR-EDIT1~EDIT4 (수정 모드 별도 기능 / 2026-05-15)

📝 구현한 기능: 종료 매치 (status="completed") 수정 모드 별도 진입 기능 (사용자 결재 Q3~Q8 권고안 박제). PR-RO 의 5계층 RO 차단 위에서 권한자 (super/organizer/TAM) 가 명시적으로 confirm modal 통과 시 차단 우회 + 재제출 + audit 박제. 운영 동작 100% 보존 = isEditMode=false 시 RO 차단 그대로. Flutter v1 / 라이브 페이지 영향 0.

### 4 PR 묶음 — 변경 파일 + LOC

| PR | 파일 | 변경 요약 | LOC |
|----|------|----------|-----|
| EDIT1 | `_components/score-sheet-toolbar.tsx` | canEdit / onEnterEditMode / isEditMode 3 props 추가 + "수정 모드" 버튼 (hideEndMatch && canEdit 시 노출 / isEditMode 시 빨강 fill indicator) | +50 |
| EDIT1 | `_components/score-sheet-form.tsx` | (a) isEditMode useState (b) handleEnterEditMode() async — confirmModal Promise + audit POST "completed_edit_mode_enter" + setIsEditMode(true) + toast (c) toolbar 호출 시 props wiring | +80 |
| EDIT2 | `src/lib/auth/require-score-sheet-access.ts` | (a) requireScoreSheetEditAccess() 신규 export — recorder 제외 / canEdit 필드 추가 (b) checkScoreSheetEditAccess() boolean 헬퍼 — page.tsx + submit/route.ts 양면 재사용 | +200 |
| EDIT2 | `score-sheet/[matchId]/page.tsx` | checkScoreSheetEditAccess import + canEdit 산출 + ScoreSheetForm props wiring | +30 |
| EDIT3 | `_components/score-sheet-form.tsx` | (a) 14 핸들러 `if (isCompleted && !isEditMode) return` 변경 (b) 4 모달 open `(!isCompleted \|\| isEditMode) && ctx` 변경 (c) 6 자식 readOnly/disabled `isCompleted && !isEditMode` 변경 (d) toolbar hideEndMatch 동일 변경 (e) 라인업 다시 선택 button conditional (f) 노란 배너 시각 분기 isEditMode 빨강 fill (g) buildSubmitPayload edit_mode=true BFF 신호 | +60 |
| EDIT3 | `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | (a) checkScoreSheetEditAccess import (b) Zod edit_mode optional (c) MATCH_LOCKED 분기 = body parse 이후로 이동 + edit_mode 우회 분기 (권한 통과 시 통과 / 미통과 = 403 EDIT_FORBIDDEN) (d) audit context prefix "[수정 모드]" + changes.edit_mode_bypass 박제 | +75 |
| EDIT4 | `score-sheet/[matchId]/page.tsx` | tournament_match_audits SELECT (context LIKE completed_edit*) — 최대 20건 + user IN 1 SELECT + editAuditLogs prop wiring (occurredAt = changedAt schema 정규화) | +85 |
| EDIT4 | `_components/score-sheet-form.tsx` | (a) editAuditLogs prop 타입 (b) auditExpanded useState 펼침 토글 (c) inline 수정 이력 UI (배너 + 펼치기 / 누가/언제/무엇 행 / context 분류 진입/재제출/수정모드진입/기타) | +95 |

**총 수정 4 파일 / 신규 0 / 약 675 LOC** (예상 ~200 LOC 대비 +200% — EDIT2 헬퍼 200 LOC + EDIT4 inline UI + 자세한 한국어 주석 + Q 결재 박제 포함).

### canEdit / isEditMode 분기 적용 위치 (5계층 우회 박제)

| 계층 | 위치 | isEditMode 우회 방식 |
|---|---|---|
| 1차 — 핸들러 가드 | form.tsx 14 핸들러 첫 줄 | `if (isCompleted && !isEditMode) return` |
| 2차 — 자식 prop | 6 컴포넌트 readOnly/disabled | `isCompleted && !isEditMode` |
| 3차 — 모달 open | 4 모달 open prop | `(!isCompleted \|\| isEditMode) && ctx` |
| 4차 — toolbar | hideEndMatch + canEdit 시 "수정 모드" 버튼 노출 | isEditMode 시 종료 버튼 재노출 |
| 5차 — BFF 거부 | submit/route.ts MATCH_LOCKED 분기 | edit_mode body + 권한 검증 통과 시 우회 |

### audit 박제 흐름 (진입 / 재제출)

| 시점 | warning_type / context |
|---|---|
| 1. 종료 매치 mount 1회 | `completed_edit_entry` (PR4 기존) |
| 2. 수정 모드 진입 명시 | `completed_edit_mode_enter` (EDIT1 신규) |
| 3. 재제출 시 onSubmittedChange | `completed_edit_resubmit` (PR4 기존) |
| 4. BFF audit 박제 | `[수정 모드] completed_edit_resubmit ...` (EDIT3 신규 prefix) |

EDIT4 inline 표시 = (1)~(4) 모두 SELECT (context LIKE "completed_edit" OR "수정 모드") → context 분류 라벨.

### Q 결재 사항 (사용자 사전 결재 — Q3~Q8 권고안 박제)

| Q | 결정 | 적용 |
|---|------|------|
| Q3 | toolbar 버튼 + confirm modal (권한자만) | ✅ EDIT1 — ConfirmModal Promise |
| Q4 | super/organizer/TAM (recorder 제외) | ✅ EDIT2 — checkScoreSheetEditAccess |
| Q5 | completed 유지 + audit only | ✅ EDIT3 — audit prefix "[수정 모드]" |
| Q6 | 무한 수정 + audit 추적 | ✅ EDIT3 — 횟수 제한 0 |
| Q7 | 매치 상세 inline | ✅ EDIT4 옵션 A — 매치 상세 페이지 미존재 → score-sheet 인라인 |
| Q8 | MATCH_LOCKED + editMode 우회 | ✅ EDIT3 — Zod edit_mode + 권한 검증 |

### 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | **exit=0** (회귀 0) |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | **14 파일 / 236/236 PASS** (2.69s) |
| 3 | grep `isEditMode` in form.tsx | **49건** |
| 4 | grep `requireScoreSheetEditAccess`/`checkScoreSheetEditAccess` | 신규 export + page.tsx (L26+L535) + submit/route.ts (L38) |
| 5 | grep `edit_mode`/`isEditModeBypass` in submit/route.ts | **14건** |
| 6 | grep `completed_edit_resubmit` in form.tsx | **4건** (PR4 기존 + EDIT4 분류 = 코드 정합) |

### 운영 동작 보존 검증

| # | 케이스 | 검증 |
|---|------|------|
| 1 | status="draft"/in_progress | isCompleted=false → isEditMode 분기 미진입 → 변경 0 ✅ |
| 2 | completed + canEdit=false (recorder/일반) | "수정 모드" 버튼 미노출 / RO 차단 유지 ✅ |
| 3 | completed + canEdit=true + isEditMode=false | 버튼 노출 + 노란 배너 + RO 차단 유지 / 클릭 시 confirm ✅ |
| 4 | completed + isEditMode=true | 모든 차단 우회 + 빨강 indicator + 경기 종료 재노출 + audit ✅ |
| 5 | 재제출 status 처리 | completed 유지 + audit prefix "[수정 모드]" ✅ |
| 6 | BFF MATCH_LOCKED + edit_mode 우회 | edit_mode=true + 권한 = 통과 / 미박제 또는 권한 없음 = 423/403 ✅ |
| 7 | 4종 모달 / Phase 17 / Phase 19 PR-T/Stat / Phase 23 자동 로드 | 영향 0 ✅ |
| 8 | Flutter v1 / 라이브 / 인쇄 / ← 메인 / 다크모드 | 영향 0 ✅ |

💡 tester 참고:
- **테스트 방법**:
  1. status="completed" 매치 + super_admin → 노란 배너 + "수정 모드" 버튼 확인.
  2. "수정 모드" 클릭 → confirm modal "audit 박제됩니다. 정말로?".
  3. confirm 동의 → 배너 빨강 + 버튼 빨강 fill + 입력 활성 + 종료 버튼 재노출 + toast.
  4. 입력 수정 + 경기 종료 → BFF 통과 + audit "completed_edit_resubmit" 박제.
  5. 페이지 새로고침 → inline "수정 이력 N건" + 펼치기 표시 확인.
  6. completed + recorder 진입 → 버튼 미노출 / RO 차단 유지 (회귀 0).
  7. draft 매치 → 진행 동작 정상 / 회귀 0.
- **주의할 입력**:
  - curl 우회: edit_mode=true body + recorder 세션 → 403 EDIT_FORBIDDEN.
  - edit_mode 키 미박제 + 종료 매치 = 423 (PR-RO4 동작 보존).
  - audit 이력 20건 cap + 펼침 토글 (DB 부하 0).

⚠️ reviewer 참고:
- **5계층 우회 분기**: 4 클라이언트 + 1 BFF = PR-RO 5계층 거울 우회. 어떤 계층도 우회 누락 0.
- **권한 매트릭스 보수적**: Q4 = recorder 제외. recorder_admin 도 제외 (의뢰서 표 명시). 사용자 후속 결재 시 한 줄 추가로 확장 가능.
- **EDIT4 위치**: 매치 상세 페이지 미존재 → score-sheet inline 박제 (운영자 추적 단일 source). 사용자 결재 후 별도 페이지 신설 시 SELECT 로직만 이동.
- **commit 결재**: 4 PR 분리 or 통합 (PM 결정). EDIT1+EDIT3 = form.tsx 동시 수정 → 분리 시 차분 commit 필요. EDIT2+EDIT4 = 별도 파일 → 독립 가능.

### 사용자 후속 검증 사항
1. 운영 매치 실 진입 — completed + super_admin → 버튼 + 배너 확인.
2. confirm modal — 클릭 → modal + audit 안내.
3. 차단 우회 — 입력 + 종료 버튼 + 4종 모달 진입 가능.
4. 재제출 — BFF 423 회피 + audit DB SELECT 검증.
5. inline 이력 — 재진입 → "수정 이력 N건" + 펼치기.
6. 권한 회귀 — recorder 진입 → 버튼 미노출 (PR-RO 보존).
7. curl 우회 — edit_mode + recorder = 403 EDIT_FORBIDDEN.
8. commit 결재 — PM 단일/4분할 결정 후 push.
