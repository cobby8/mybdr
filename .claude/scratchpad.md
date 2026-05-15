# 작업 스크래치패드

## 현재 작업
- **요청**: CLI 마스터 핸드오프 — admin 디자인 시스템 운영 박제 (`admin-design-2026-05-15/cli-port-to-src.md` 따라 Admin-1 ~ Admin-9 진행)
- **상태**: Phase 0~1 진행 중 (사전 점검 + sync commit + push 결재)
- **결재 받음**:
  - src/ 미커밋 5 파일 (score-sheet + me + association-wizard 78 lines) → 별도 WIP commit 분리 박제 완료
  - `.git/index` 손상 발견 + 복구 (`.git/index` 삭제 + `git reset`) → 정상 동작 확인

## 진행 현황표
| 단계 | 상태 |
|------|------|
| Phase 0 — `.git/index` 복구 | ✅ 완료 |
| Phase 0.5 — src/ 미커밋 분리 commit (0853927) | ✅ 완료 |
| Phase 0.6 — scratchpad 정리 (726→100줄 룰 회복) | ✅ 본 commit 시점 |
| Phase 1 — Dev/design/ BDR-current v2.14 sync commit | ⏳ 진행 예정 |
| Phase 1.5 — push 결재 + push | ⏳ 사용자 결재 대기 |
| Phase 2 — Admin-1 components/admin 박제 (developer 위임) | ⏳ push 후 결재 |
| Phase 3~10 — Admin-2 ~ Admin-9 순차 박제 | ⏳ Phase별 결재 |

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
- 본 응답 직전 = 0 (origin/subin 일치)
- 본 응답 후 = `0853927` (chore wip) + 본 commit 다음 sync commit 1건 = 2 commit (push 결재 대기)

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
| 2026-05-15 | `.git/index` 손상 복구 + 다른 세션 미커밋 5 파일 WIP commit 분리 (0853927) | ✅ score-sheet + me + association-wizard 78 lines 박제 / admin sync 전 working tree clean 확보 / 본 의뢰 §2 Phase 0 실제 필요했음 (의뢰서 가정 맞음) |
| 2026-05-15 | Phase 6 PR2 협회 마법사 본체 (Step 1~3 + WizardShell + sessionStorage + 진입 카드) | ✅ 79e72de — super_admin 전용 / Q4 결재 적용 |
| 2026-05-15 | Phase 6 PR1 협회 마법사 API 3 endpoint | ✅ 39e7aab — Association/Admin/FeeSetting 3 라우트 |
| 2026-05-15 | PR-G5 대진표 생성기 placeholder 박제 자동화 (강남구 사고 영구 차단) | ✅ eba655d + 72b818b — 6 format 보강 / 헬퍼 박제 |
| 2026-05-15 | PR3 recorder_admin /referee/admin 진입 + admin-guard sentinel + RoleMatrixCard | ✅ facafd7 — 수정 6 파일 / tsc 0 / vitest 873/873 |
| 2026-05-15 | PR2 recorder_admin 기록원 배정 API 가드 (recorders GET/POST/DELETE) | ✅ 29730ba — 라우트 내부 헬퍼 / vitest 868/868 |
| 2026-05-15 | PR1 recorder_admin 권한 헬퍼 + 기록 API 가드 | ✅ 718c32f — 신규 3 파일 + 수정 3 / 16 신규 케이스 |
| 2026-05-15 | Phase 19 PR-Stat3.9 useToast no-op fallback (Turbopack dev 안전망) | ✅ 4721d60 |
| 2026-05-15 | Phase 19 PR-Stat3.8 QuarterEndModal OT max 9 (OT4/OT5 진입) | ✅ e108b84 |
| 2026-05-15 | Phase 19 PR-Stat3.7 OT max 7→9 (OT5 확장) | ✅ d814486 |
| 2026-05-15 | Phase 6 PR3 협회 마법사 Step 4 Referee 사전 등록 (옵션) | ✅ 신규 2 + 수정 6 파일 / 약 480 LOC / vitest 11/11 + 921/921 회귀 0 / Q2 PR3 분리 + Q7 1차 미검증 박제 적용 / DB schema 변경 0 |

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
