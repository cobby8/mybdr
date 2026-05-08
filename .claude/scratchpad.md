# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/8 — 본인인증 mock 자체 입력 폴백 구현 완료 / tester+reviewer 검증 대기]** developer 4단계 구현 완료. (1) Prisma schema `user.identity_method String?` ADD COLUMN → `npx prisma db push` 무중단 적용 → 사후 SELECT 548명 정상 / 신규 컬럼 NULL 일괄. (2) MockIdentityModal 신규 (337L, ForceActionModal 패턴 카피, 회색 톤). (3) `/api/web/identity/mock-verify` endpoint 신규 (156L, isIdentityGateEnabled 가드 503 + zod 한글/010 검증 + 이미 인증자 409 + adminLog severity=info). (4) IdentityVerifyButton 분기 추가 (170→205L, +35L, 라벨 "본인인증 시작" / "임시 정보 입력" 분기). 검증: tsc 0 + npm run build 통과 + mock-verify 라우트 정상 빌드 + 마지막 줄 정상 종료 확인 (truncated 룰). 임시 스크립트 정리 완료.

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업, 이번 주 내 예상)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **활성화 후 검증**: 미인증 계정 → /games/[id] / /teams/[id] / /tournaments/[id]/join 진입 → /onboarding/identity?returnTo=... redirect → PortOne 위젯 → 인증 완료 후 returnTo 자동 복귀

### 🚀 1순위 — PR3 활성화 검증 (PortOne 활성화 직후)
- mock 모드 → 활성 모드 자동 전환 (코드 변경 0)
- 회귀 검증: 인증 완료 사용자 + 비로그인 사용자 영향 0 / PR1.5.b 클라 안내 그대로 작동
- 롤백 1초: 환경변수 제거 = 자동 mock 모드

### 🚀 2순위 — onboarding 흐름 검증 + 사용자 영향 모니터링
- 카카오/구글/네이버 소셜 가입자가 흐름 정상 통과하는지 / xp +100 부여 확인 / profile/edit 잠금 회귀 0

### 🚀 3순위 — manage 탭 그룹화 (P2-6 보류) + 데드 코드 정리
- manage 8~9 탭 → "신청 관리" / "운영진" 그룹화 (IA 변경, 사용자 결정 필요)

### 🚀 4순위 — game.game_type 0~5 마이그레이션 / 매치 코드 v4 Phase 6 (보류)

---

## 기획설계 (planner-architect / 5/8)

- **본인인증 mock 자체 입력 폴백 — ✅ developer 구현 완료** (`Dev/identity-mock-fallback-design-2026-05-08.md` 설계 / 사용자 Q1~Q5 일괄 승인). 4단계 진행: (1) Prisma `user.identity_method String? @db.VarChar(20)` ADD COLUMN → `npx prisma db push` 무중단 적용 (1.51s) → 사후 검증 548명 user / 신규 컬럼 NULL 일괄 / 기존 데이터 영향 0. (2) MockIdentityModal 신규 337L — 한글 실명 2~20자 + 010 휴대폰 + 생년월일(선택) zod 검증 / ForceActionModal 패턴 카피 / 회색 안내 톤 (var(--color-elevated) + var(--color-border)). (3) `/api/web/identity/mock-verify` endpoint 신규 156L — 가드 3단 (isIdentityGateEnabled 503 + zod 검증 400 + 이미 인증자 409) + adminLog severity=info action=mock_identity_verified + name/phone/birth_date 동기화. (4) IdentityVerifyButton 170→205L — gateEnabled 분기로 mock 모달 / PortOne SDK 자동 전환 + 라벨 "본인인증 시작" / "임시 정보 입력". 검증: tsc 0 / npm run build 통과 / mock-verify 라우트 정상 빌드 / 3 파일 마지막 줄 정상 종료 (truncated 룰).

## 구현 기록 (developer / 5/8)

📝 구현한 기능: 본인인증 mock 자체 입력 폴백 — channel key 미설정 시 자체 입력 폼으로 임시 통과 / PortOne 활성화 시 환경변수 1개 추가로 자동 정식 SDK 모드 복귀 (코드 변경 0)

| 파일 경로 | 변경 내용 | 신규/수정 | 라인 |
|----------|----------|----------|-----|
| prisma/schema.prisma | user 모델 + identity_method String? @db.VarChar(20) | 수정 | +5 |
| src/components/identity/mock-identity-modal.tsx | 자체 입력 모달 (실명/휴대폰/생년월일) | 신규 | 337 |
| src/app/api/web/identity/mock-verify/route.ts | mock 전용 endpoint (가드 3단 + adminLog) | 신규 | 156 |
| src/components/identity/identity-verify-button.tsx | gateEnabled 분기 + mock 모달 mount + 라벨 분기 | 수정 | 170→205 |

### DB 적용 결과
- `npx prisma db push` 1.51s 성공 (NULL 허용 ADD COLUMN 무중단)
- `npx prisma generate` 성공
- 사후 검증 (임시 스크립트 → 즉시 삭제): user.count=548 / sample identity_method=null / groupBy 일괄 NULL = 백필 0

### 검증
- npx tsc --noEmit: 0 에러
- npm run build: 통과 / `/api/web/identity/mock-verify` Function 라우트 정상 빌드
- truncated 룰: 3 파일 모두 마지막 줄 정상 종료 ("); }`, `}` 등 닫힘)
- 임시 스크립트: scripts/_temp/verify-identity-method-column.ts 즉시 삭제

💡 tester 참고:
- **mock 모드 동작 (현재 운영 = 환경변수 미설정)**:
  - `/onboarding/identity` 진입 → "임시 정보 입력" 버튼 (라벨 자동 분기) → MockIdentityModal 오픈
  - 한글 실명 + 010 휴대폰 + (선택) 생년월일 입력 → POST /api/web/identity/mock-verify
  - 성공 시 onVerified 콜백 → 인증완료 배지 + returnTo 또는 `/onboarding/environment` 진입
  - DB: name_verified=true / identity_method='mock' / verified_name/phone/birth + name/phone/birth_date 동기화
- **PortOne 활성화 시 (환경변수 추가 후)**:
  - "본인인증 시작" 라벨 자동 (코드 변경 0)
  - mock-verify endpoint 503 응답 (curl 테스트로 확인 가능)
- **에러 케이스**:
  - 빈 입력 / 한글 외 / 휴대폰 형식 오류 → 클라 검증 즉시 차단
  - 이미 name_verified=true 사용자가 mock-verify 호출 → 409 ALREADY_VERIFIED
  - PortOne 활성 시 mock-verify 호출 → 503 MOCK_DISABLED

⚠️ reviewer 참고:
- 보안 가드 3단 = (1) isIdentityGateEnabled() 환경변수 단일 신호 (2) withWebAuth 본인 한정 (3) zod 서버 재검증 (클라 신뢰 X)
- 응답 envelope = apiSuccess 자동 snake_case 변환 (errors.md 8회 재발 함정 적용 반영)
- adminLog 사용 — admin_id에 ctx.userId (본인이 본인을 self-update) / severity=info / action='mock_identity_verified'
- DB 컬럼 = NULL 허용 ADD COLUMN 무중단 / 기존 verified_* 5컬럼 변경 0 / 기존 PortOne endpoint 변경 0 / Flutter v1 영향 0
- 라벨 분기 = build inline 평가 (NEXT_PUBLIC_*) — 환경변수 변경 시 재배포 필요

## 리뷰 결과 (reviewer / 5/8 mock 폴백)

### 보안
- withWebAuth: ✅ — `withWebAuth(async (req, ctx))` 정확 / `ctx.userId` 본인 한정 / `prisma.user.update where: { id: ctx.userId }` 타 user update 불가
- isIdentityGateEnabled() 가드 (503): ✅ — endpoint 진입 즉시 503 + code="MOCK_DISABLED" / PortOne 활성 시 자동 차단 / 클라 위변조로 우회 불가
- 재인증 차단 (409): ✅ — `existing.name_verified === true` 검사 / code="ALREADY_VERIFIED" / + 404 USER_NOT_FOUND 추가 (설계서 외 보강)
- zod 서버 재검증: ✅ — 한글 `/^[가-힣]{2,20}$/` + 휴대폰 `/^010-?\d{4}-?\d{4}$/` + 생년월일 `/^\d{4}-\d{2}-\d{2}$/` 클라 동일 패턴
- 시크릿 노출 0: ✅ — `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY`는 채널 ID 공개 안전 / API_SECRET은 server-only 유지

### 코드 품질
- 컨벤션 준수: ✅ — 파일명 kebab-case (mock-identity-modal.tsx / mock-verify/route.ts) / 함수 camelCase / DB snake_case (identity_method) / TS strict
- 타입 엄격성: ✅ — `any` 0 / `VerifiedPayload` 인터페이스 / `WebAuthContext` 정확 import / `Date | null` null 안전
- 에러 핸들링: ✅ — try/catch 양쪽 (route + modal) / apiError 표준 / fetch json 파싱 실패도 catch
- 주석/의도 명확성: ✅ — 두 파일 모두 "왜 / 어떻게 / 보안" 헤더 주석 + 인라인 의도 주석 명확

### 회귀 위험
- PR3 가드 / 5/7 PR1.5.a/b / Flutter v1 / DB 기존 컬럼: ✅ — verify/route.ts 무변경 / require-identity-for-page 무변경 / identity-gate-flag.ts 무변경 / verified_* 5컬럼 무변경 / NULL 허용 ADD COLUMN만 / Flutter v1 영향 0

### 아키텍처
- 디렉토리 일관성: ✅ — `src/components/identity/mock-identity-modal.tsx` (identity-verify-button.tsx 옆) / `src/app/api/web/identity/mock-verify/route.ts` (verify/route.ts 옆) — 동일 도메인 그룹화
- 단일 신호 일관: ✅ — `isIdentityGateEnabled()` 클라 (button) + 서버 (mock-verify endpoint) + 가드 (require-identity-for-page) 3 위치 모두 동일 헬퍼 사용
- ForceActionModal 패턴 카피: ✅ — max-width 460 / iOS input 16px / `var(--color-card)` + `var(--color-border)` 토큰 / role="dialog" aria-modal / overlay click close + e.stopPropagation 정확

### errors.md 적용
- truncated 0: ✅ — mock-identity-modal.tsx 337L 마지막 `}` 정상 종료 / mock-verify/route.ts 156L 마지막 `});` 정상 / identity-verify-button.tsx 205L 마지막 `}` 정상
- envelope/snake_case: ✅ — apiSuccess 자동 변환 + 클라가 `data.verified_name` snake_case 접근 / 클라 → 서버 body `birth_date` snake_case 일관 (camelCase birthDate 혼용 X)

### 사용자 결정 부합 (Q1~Q5)
- Q1 생년월일 선택: ✅ — `birth_date: z.string().regex(...).optional()` / 클라 빈값 시 body 미포함
- Q2 회색 톤: ✅ — 안내 박스 `var(--color-text-muted)` + `var(--color-elevated)` / 빨간 setErrorText 분기 제거됨 (mock 모달 오픈으로 대체)
- Q3 권유 안내 (그대로 인정): ✅ — `identity_method='mock'` 표식 저장 → PortOne 활성 후 `SELECT WHERE identity_method='mock'`로 사후 식별 가능 / 강제 invalidate 코드 없음 (옵션 C 부합)
- Q4 DB ADD COLUMN: ✅ — `identity_method String? @db.VarChar(20)` NULL 허용 ADD COLUMN / db push 1.51s 무중단 / 기존 verified_* 5컬럼 변경 0
- Q5 admin_logs 기록: ✅ — `adminLog("mock_identity_verified", "user", { severity: "info", description: "...", changesMade: { identity_method: "mock", name_verified: true } })` / raw 개인정보 박제 X (운영자가 user 테이블 SELECT) — 적절

### 종합 평가
⭐⭐⭐⭐⭐ — 설계서 §1~§13 의도와 구현 100% 일치 / 보안 가드 3단 정확 / 사용자 Q1~Q5 모두 정확 반영 / 회귀 위험 0 / errors.md truncated/envelope 룰 모두 적용. 동작 OK + 안전 OK + 단순함 OK + 에러 처리 OK.

### 잘된 점
- 가드 3단 (503 → 400 → 409) 순서 정확 — 환경 가드 먼저 / zod 다음 / 비즈니스 가드 마지막
- USER_NOT_FOUND (404) 추가는 설계서 외 보강 — 세션은 살아있는데 user row 없는 엣지 케이스 방어
- `existing.identity_method` select에 포함 — 사후 디버깅 시 운영자가 select 결과만 보고 상태 추적 가능 (현재 사용 X지만 미래 확장성)
- mock 모달 `useEffect`로 open=true 시 입력 초기화 — 이전 입력 잔존 / 이전 에러 잔존 방지 (UX 우수)
- `submitting` 상태 닫기 차단 (`if (submitting) return`) — 중복 제출 + 처리 중 닫기 모두 방어
- 클라 검증 메시지 한국어 + 명확 ("실명을 한글 2~20자로", "010-XXXX-XXXX 형식")
- IdentityVerifyButton 라벨 분기를 `gateEnabled` 단일 변수로 — 라벨 + 분기 동일 신호 일관

### 개선 제안 (선택, 수정 안 해도 OK)
- 🟡 (선택) `apiError("VALIDATION_ERROR", { details: parsed.error.format() })` — `validationError(issues)` 헬퍼 (422 statusCode + sanitize)가 response.ts에 별도 존재. 단 verify/route.ts (5/7 PortOne)도 같은 패턴(extra에 raw error.format)이라 일관성 차원에서 그대로 OK. 추후 전체 정리 시 통일 검토.
- 🟡 (선택) `birth_date` Date 변환에서 `new Date("2000-13-01")` 같은 잘못된 날짜는 `isNaN`이 false (autocorrect)일 수 있음. 단 zod regex `^\d{4}-\d{2}-\d{2}$`로 형식은 차단되고 mock 데이터라 운영 영향 0 — 그대로 OK.
- 🟡 (선택) MockIdentityModal `aria-describedby`에 안내 박스 id 연결 시 스크린리더 UX 개선. 단 ForceActionModal 패턴도 미사용이라 일관성 유지로 그대로 OK.

### 수정 요청 (필수)
없음. 통과.

## 테스트 결과 (tester / 5/8 mock 폴백)

### 빌드
- npx tsc --noEmit: 0 에러 ✅
- npm run build: 통과 ✅ (Compiled successfully 12.4s / `/api/web/identity/mock-verify` Function 라우트 정상 빌드)
- 4 파일 line count: schema.prisma 3219L / mock-identity-modal 337L / mock-verify route 156L / identity-verify-button 205L (developer 보고 일치) ✅
- 4 파일 마지막 줄 정상 종료: `}` / `});` / `}` / schema `}` (truncated 룰 통과) ✅

### DB schema
- prisma/schema.prisma user 모델 line 220~223 `identity_method String? @db.VarChar(20)` 정확 추가 ✅
- 운영 DB 컬럼 존재 (SELECT 검증): user.count=548 / identity_method groupBy = NULL 548건 일괄 ✅
- 백필 0 / 기존 데이터 영향 0: name_verified=true 19명 (5/7 PortOne 활성 전 사용자) 모두 method=null 보존 ✅
- mock 통과자 0건 / portone 통과자 0건 (신규 인증 0건, 정상) ✅

### mock 모드 동작 (코드 분석 + 환경변수 검증)
- .env / .env.local 양쪽 NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY 미설정 → isIdentityGateEnabled()=false ✅
- IdentityVerifyButton line 79~82: gateEnabled=false → setMockModalOpen(true) → MockIdentityModal 마운트 (PortOne SDK 호출 안 함) ✅
- 라벨 분기 line 180: gateEnabled ? "본인인증 시작" : "임시 정보 입력" ✅
- 모달 입력 → POST /api/web/identity/mock-verify → user 업데이트 → onVerified 콜백 → setVerified(true) → 인증완료 배지 ✅

### PortOne 활성화 시 자동 비활성 (가드 검증)
- IdentityVerifyButton: gateEnabled=true → mock 모달 우회 + PortOne SDK 호출 (line 84~149) ✅
- mock-verify endpoint line 53~59: isIdentityGateEnabled() true → 503 "MOCK_DISABLED" ✅
- 환경변수 1개 추가 = 클라/서버 동시 자동 전환 (코드 변경 0) ✅

### 보안 가드 3단
- withWebAuth (자기 본인 user 만 update — line 49) ✅
- isIdentityGateEnabled() 503 가드 (line 53~59) ✅
- 이미 name_verified=true user 409 ALREADY_VERIFIED (line 83~89) ✅

### zod 서버 재검증
- 한글 실명 `/^[가-힣]{2,20}$/` (line 41) ✅
- 휴대폰 `/^010-?\d{4}-?\d{4}$/` (line 42) ✅
- 생년월일 YYYY-MM-DD optional (line 43~46) ✅

### admin_logs INSERT
- adminLog("mock_identity_verified", "user", { severity:"info", targetId: ctx.userId, ... }) (line 130~141) ✅
- changes_made 에 raw 개인정보 박제 X (운영 SELECT 로 user 테이블 조회 가능) ✅
- adminLog 헬퍼 try/catch 로 메인 플로우 영향 0 ✅

### 회귀 0
- 기존 /api/web/identity/verify (PortOne) 라우트: name_verified만 참조, identity_method 미참조 (변경 0) ✅
- PR3 layout 가드 require-identity-for-page.ts: isIdentityGateEnabled() false → noop (mock 모드 default 유지, 변경 0) ✅
- 5/7 PR1.5.a/b 게이트 / Flutter v1 (`/api/v1/...`) / DB 기존 컬럼 (name_verified / verified_* / name / phone / birth_date): 변경 0 ✅

### apiSuccess / apiError envelope (errors.md 8회 재발 룰)
- apiSuccess 응답 키 자동 snake_case 변환 (response.ts line 5~7 `convertKeysToSnakeCase`) ✅
- mock-identity-modal 프론트 fetch — `data.verified_name` / `data.verified_phone` snake_case 접근 (line 130~131) ✅

### 종합 판정
**통과** — 9/9 검증 항목 모두 통과. 수정 요청 0. 운영 영향 0 (SELECT 만 / destructive SQL 0 / 임시 스크립트 즉시 삭제).

- **PR3 layout 가드 + mock 모드 — ✅ main 배포 완료** (`Dev/pr3-layout-guard-design-2026-05-08.md` / PR #218 #219 / main `f39afae`). 신규 헬퍼 2건 (`identity-gate-flag.ts` 26L + `require-identity-for-page.ts` 61L) + 신규 server layout 1건 + 수정 4 페이지. 본인인증 컬럼 = `user.name_verified`. mock flag = channel key 환경변수 존재 시 자동 ON. 회귀 0 / 롤백 1초.
- **팀 멤버 라이프사이클 + Jersey 재설계** — ✅ 5 Phase + PR1e + UI fix 모두 main 완료 (5/5~5/6 / `4253e68`)
- **인증 흐름 재설계** — ✅ 완료 (5/5 `3f016c9`)

---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) / 듀얼토너먼트 풀 시스템 | ✅ |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| 도메인 sub-agent (옵션 A) | ✅ P1+P2+P3 (C 채택 — live-expert 영구) |
| 매치 코드 v4 | ✅ Phase 1+2+3+4+5+7 |
| **PR3 layout 가드 mock 모드** | ✅ main 배포 (PortOne 환경변수 추가 시 자동 활성) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-08 | (developer 완료, 미커밋) | **본인인증 mock 자체 입력 폴백 구현 — Q1~Q5 승인 후 4단계** — (1) Prisma `user.identity_method String? @db.VarChar(20)` ADD COLUMN + db push 1.51s 무중단 + 사후 SELECT 548명 정상. (2) MockIdentityModal 신규 337L (한글 2~20자 + 010 검증 + 생년월일 선택 / ForceActionModal 패턴 / 회색 톤). (3) `/api/web/identity/mock-verify` 신규 156L (isIdentityGateEnabled 503 + zod + 409 ALREADY_VERIFIED + adminLog severity=info). (4) IdentityVerifyButton 170→205L (gateEnabled 분기 + mock 모달 mount + 라벨 분기). tsc 0 / build 통과 / mock-verify 라우트 정상. tester+reviewer 검증 대기. | ✅ |
| 2026-05-08 | (시안 only) | **TeamDetail/Manage 시안 양쪽 변경분 머지 (zip v2.5 + 5/6+5/8 역박제)** — Dev/design/BDR-current/screens/ 2 파일. TeamDetail 443→456L (Hero Avatar 박스 1.5배 Phase A.5 §8 + 카피 "연습경기"→"스크림" / 가입 모달 mock + Modal import 보존). TeamManage 229→282L (ForceActionModal import + state + ⋮ dropdown + mount Phase A.5 §9 / MemberPendingBadge import + isMe/pending mock + "나" 배지 + 본인 좌하단 뱃지 보존). 운영 src/ 변경 0. | ✅ |
| 2026-05-08 | `48643f5` ~ `1dbc3ee` 11건 → PR #214/#215 머지 → 빌드 9건 실패 → hot fix `333516b` → PR #216/#217 → main `c6a6848` → PR3 `f55105e` `666e815` → PR #218/#219 → main `f39afae` | **5/8 누적 — 디자인 박제 + 머지 + truncated hot fix + PR3 mock 모드 배포** — (디자인) home BDR v2 토큰 마이그 145→0 / BDR-current sync v2.4 / 운영→시안 역박제 4영역 / 5/7 박제 후속 / gitignore. (머지) subin→dev #214 + dev→main #215 gh CLI 자동. (Hot fix) `48643f5` profile-cta-card.tsx 161줄 단독 잘림 (38줄 손실) → 빌드 9건 연쇄 실패 (Production = `168be48` 그대로 유지, auto promotion 차단으로 운영 영향 0) → `333516b` 38줄 복원 → PR #216/#217 → main `c6a6848`. errors.md 박제 (5/7 룰 + 보완 4룰). (PR3) planner-architect 설계서 8섹션 + 사용자 Q1~Q5 일괄 승인 → developer 신규 헬퍼 2건 + server layout 1건 + 수정 4 페이지 (200L) → tester 9/9 통과 + reviewer ⭐⭐⭐⭐⭐ 수정 0 → PR #218 (subin→dev) + #219 (dev→main) → main `f39afae` 배포. mock 모드 default = 회귀 0 / 환경변수 추가 시 자동 활성 / 롤백 1초. | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main — Onboarding 10단계 + PortOne V2 + Phase A.5** — fix 7건 (envelope 8회 / IME 9곳 / 마이페이지 정렬 / 알림 deep-link), Onboarding 시리즈 PR1.1~PR5 (단 PR3 보류), Phase A.5 drawer fix → truncated → hot fix `168be48` (13분 내 운영 복구). errors.md 박제 (truncated + IME + envelope). PR3 layout 가드 PortOne 활성화 후로 보류 → 5/8 mock 모드로 진행. | ✅ |
| 2026-05-06 | `7211f97` ~ `f6b43ab` → main `4253e68` | **5/6 누적 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄 fix** — PR1e default_jersey_number DROP (54명 메모 손실, 가치 0). UI 13건 fix (5 모달 토큰 통일 / placeholder / iOS 16px / dropdown overflow / ForceActionModal). 마이페이지 소속팀 카드 풀 width. apiError 9 파일 69건 한국어 정상화. tsc 0 / 미푸시 0. | ✅ |
| 2026-05-05 | `ae4ffd7` ~ `5d62f7f` → main `8bbce95` | **팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR main 배포** — Phase 1 Jersey / Phase 2 워크플로 / Phase 3 이적 / Phase 4 권한 위임 / Phase 5 유령회원. ADD TABLE 5건 + ADD COLUMN 1건 무중단. 사용자 결정 8건 + 미묘 6건 룰 반영. tsc 0 / Flutter v1 호환 0. | ✅ |
| 2026-05-05 | DB UPDATE 4건 (코드 0) | **열혈농구단 SEASON2 출전 명단 정비** — 4명 ttpId 정비 (백승훈 39 / 이지환 4 / 최원영 20 / 이도균 #70 INSERT). 매 건 사전 검증 + 사용자 명시 승인 + 사후 재확인 PASS. errors+lessons 박제 (도메인 단방향 함정). | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 + 5/5 auth 10+ 건 / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 5/5 SEASON2 PDF vs DB / 5/5 onboarding 10단계 합의 / 5/5 인증 흐름 재설계 옵션 A+B-PR1 `7f26b6f` ~ `eb015aa` → main `3f016c9` / 5/6 UI fix 13건 + apiError 일괄 fix / 5/7 envelope 8회 `7945452` — 5/7 main 21회 누적 baseline) — 복원: git log -- .claude/scratchpad.md -->
