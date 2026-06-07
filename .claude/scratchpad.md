# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 7 Auto Chain — v2.27 sync + Phase 7C 박제 4 PR (인증·온보딩)
- **상태**: 🔵 진행 중 — §2 통과 / sync v2.27 ✅ / 7C 박제 진행
- **현재 담당**: pm → developer
- **의뢰서**: `Dev/design/prompts/phase-7-auto-chain-cli-prompt-2026-05-31.md`

### Phase 7C 진행 (4 PR / ★ AppNav 미적용 standalone)
| PR | 시안 → 운영 | 상태 |
|----|------|------|
| 7C-1 | AU1 LoginSignup → /login + /signup (BA1 OAuth 4) | ✅ (해석A·현상유지) |
| 7C-2 | AU3 PasswordRecovery → /forgot-password + /reset-password (BA3) | ⏳ |
| 7C-3 | AU4 Verify → /verify 보강 (BA4/BA5) | ⏳ |
| 7C-4 | AU2 Onboarding 5-step → /onboarding/* (BA2) | ⏳ |
- lock: AppNav 미적용 standalone 유지 / OAuth=활성 provider만(없으면 hide) / Phase 10-5 server wrapper+onboarding_completed_at 가드 보존 / Phase 12-5 IdentityVerifyButton mock 보존 / 강도미터 5단계 색
- 데이터 정책: server 조회 허용 / stop = `/api/v1`·DB schema·LOC>+2000·tsc실패·회귀6·AppNav 적용·10-5/12-5 가드 변경

## 구현 기록 (developer) — Phase 7C

### 7C-1 (AU1 LoginSignup → /login + /signup, OAuth 통일)
📝 구현: 해석 A(현상 유지). AppNav/layout/shell 0 변경. 카드 내부 UI만 v2.27 AU1 톤 반영.

| 파일 | 변경 내용 | 신규/수정 | LOC |
|------|----------|----------|-----|
| src/app/(web)/signup/page.tsx | 비번 강도미터(5단계 색)+불일치 힌트 신규 / OAuth 통일(네이버 활성→준비중 disabled) | 수정 | +78/-8 |
| src/app/(web)/login/page.tsx | 변경 0 — OAuth 정책 이미 충족(카카오·구글 활성/네이버 disabled/애플 없음) | 무변경 | 0 |

- 강도미터: pwStrength(0~4) 4조건(길이·대문자·숫자·특수). 색 err(`--danger`)→warn(`--warn`)→ok(`--ok`). 시안 `--err` 운영 미존재 → `--danger` 매핑. 미충족 막대 `--bg-head`.
- OAuth 통일: Apple hide(라우트 미지원) / Kakao·Google 활성(기존 href 보존) / Naver "준비중" disabled. login·signup 동일. mock 0.
- au-* CSS 미이식 (인라인 + 기존 `.card`/`.input`/`.btn` 유지) → **au1-/ba- prefix 충돌 0**, `.au-page` shell 미적용 = 현상유지.

보존(검증됨): loginAction/devLoginAction/signupAction·useActionState·redirect·OAuth href·약관 가드(handleSubmit)·두 layout.tsx·(web) layout·password-input.tsx 변경 0.

💡 tester 참고:
- /signup 비번칸 입력 시 강도미터 노출. 빈칸=숨김. 색: 1칸 빨강 / 2칸 주황 / 3~4칸 초록.
- /signup 비번확인 불일치 시 빨강 힌트. 약관 미동의 가입 차단 동작 그대로.
- /signup OAuth: 네이버 버튼 disabled(클릭 불가), 카카오·구글 클릭 시 기존 OAuth 진입.
- 정상: tsc 0 / login 회귀 0(무변경).

⚠️ reviewer 참고: 강도미터 색 토큰 매핑(`--err`→`--danger`)과 signup 네이버 href 제거(라우트 정책 통일) 타당성.

#### stop condition: **없음** (AppNav 미적용 유지=현상유지 / `/api/v1`·DB·LOC>+2000·tsc실패·회귀 모두 0)

### 7C-2 (AU3 PasswordRecovery → /forgot-password 보강, BA3)
📝 구현: 시안 AU3 ForgotView 박제. forgot-password 단일 파일 보강. reset-password는 이미 박제 완료(v2(1)) → **0 변경**.

| 파일 | 변경 내용 | 신규/수정 | LOC |
|------|----------|----------|-----|
| src/app/(web)/forgot-password/page.tsx | 전송 성공 시 결과 hero(mark_email_read+안내+"다른 이메일 재전송") 신규 / 입력폼 send 아이콘·시안 톤 정리 | 수정 | +195/-102 (실질 +93) |
| src/app/(web)/reset-password/page.tsx | 무변경 — StepIndicator·강도미터·성공이동·액션 0 변경 | 무변경 | 0 |

- 결과 hero: message 수신 시 입력폼 대체 → mark_email_read 아이콘(`--cafe-blue-soft`/`--cafe-blue`) + 이메일 강조 안내 + "다른 이메일로 다시 보내기"(handleRetry로 상태 초기화 복귀).
- 토큰 정합 확인: 강도미터(reset)는 `--color-error/warning/success` 사용 → globals.css에서 `--danger/--warn/--ok`로 매핑 = 7C-1(signup)과 **동일 색**. 정합 OK, reset 무변경 타당.
- 토큰 실재: `--danger`(#E24C4B)·`--warn`(#E8A33B)·`--ok`(#1CA05E)·`--bg-head`·`--cafe-blue-soft`·`--accent-soft` 전부 globals.css 존재 확인. 하드코딩 색 0.
- PasswordInput carry: forgot엔 비번칸 없음(해당 없음) / reset은 기존 visibility 토글 유지(0 변경).

보존(검증됨): handleSubmit·fetch `/api/web/auth/forgot-password`·응답 message/reset_token·devToken 표시·`/reset-password?token=` 링크 전부 유지. AppNav 미적용 standalone 현상유지. mock 0.

💡 tester 참고:
- /forgot-password 이메일 입력 후 "재설정 링크 전송" → 성공 시 결과 hero("메일을 확인하세요" + 입력 이메일 강조) 노출.
- 결과 화면에서 "다른 이메일로 다시 보내기" 클릭 시 입력 폼으로 복귀(이메일 값 유지).
- 개발 환경: 응답에 reset_token 있으면 hero 안에 토큰 + "재설정 페이지로 이동" 링크 노출.
- /reset-password 회귀 0(무변경). 정상: tsc 0.

⚠️ reviewer 참고: reset-password 강도미터 색 토큰(`--color-error` 계열)이 7C-1(`--danger` 계열)과 globals.css alias로 동일색임을 근거로 reset 무변경 처리 — 정합 판단 타당성.

#### stop condition: **없음** (AppNav 미적용 유지 / `/api/v1`·DB schema·LOC>+2000·tsc실패·회귀·10-5/12-5 가드 모두 0)

## 완료 Phase (이력)
- ✅ **Phase 6 묶음 운영 반영** (6.1+6.2+6.3 = 16 시안 / dev→main #658·#660 / main `32153c7` Vercel success)
  - 6.2 토스 실연결 mock 0 / 6.3 보강 placeholder warn-soft 통일 / BP1 privacy·BP5 가드
- ✅ Phase 5 (랭킹·커뮤니티 6, #658) / Phase 1~4 (#653/#655)
- 누적: Phase 1~6.3 = 50 시안 운영 반영

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-07 | **Phase 7C-2 박제** (AU3 → forgot-password 결과 hero) | ✅ tsc 0 / +93 / reset 0변경·토큰정합 OK / stop 0 |
| 2026-06-07 | **Phase 7C-1 박제** (AU1 → signup 강도미터+OAuth통일) | ✅ tsc 0 / +78/-8 / 현상유지 stop 0 |
| 2026-06-07 | Phase 7 v2.27 sync | ✅ auth-shared + 4 jsx / carry diff 0 |
| 2026-06-06 | **Phase 6.2+6.3 dev→main 운영 반영** (#660) | ✅ main `32153c7` Vercel success / Phase 6 묶음 종료 |
| 2026-05-31 | **Phase 6.3 chain** (v2.26 + 6.3C 3 PR) | ✅ `832bd2e`+`280c9ef`~`acbd0b2` / 보강 / stop 0 |
| 2026-05-31 | **Phase 6.2 chain** (v2.25 + 6.2C 7 PR) | ✅ `8d90aa0`+`dc31be2`~`51b4378` / 토스 실연결 mock 0 |
| 2026-05-31 | **Phase 6.1 chain** (v2.24 + 6.1C 6 PR #657) | ✅ BP1 privacy·BP5 가드·BP2 server조회 |
| 2026-05-31 | **Phase 5 chain** (v2.23 + 5C 6 PR #656) | ✅ 공용 wizard·mock 0 |
| 2026-05-31 | 빌드 fix(CSS `*/` Turbopack) + here-string 함정 | ✅ errors.md 기록 |
