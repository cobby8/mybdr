# BDR v2.27 — Phase 7 (온보딩·회원가입·인증) 박제

> **박제일**: 2026-05-31
> **선행**: Phase 1~6 완료 (Phase 6 묶음 16 시안 종료) carry-over
> **선행 의뢰**: `auth-onboarding-user-redesign-prompt` + `auth-onboarding-user-connectivity-plan` (2026-05-31)
> **특수**: 첫 사용자 진입 / conversion funnel 핵심 · 사용자 측만 (admin ❌) · **AppNav 미적용 standalone**

---

## 1. Phase 7 박제 시안 = 4 (사용자 측)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| AU1 | LoginSignup | `/login` + `/signup` | **신규 통합** | BA1 ★★★★★ (탭 토글 + OAuth 4) |
| AU2 | Onboarding | `/onboarding/*` | **신규 통합** | BA2 ★★★★ (5-step wizard) |
| AU3 | PasswordRecovery | `/forgot-password` + `/reset-password` | 신규+보강 | BA3 ★★★ (forgot 신규 + reset 강도 미터) |
| AU4 | Verify | `/verify` | 보강 | BA4+BA5 ★★★ (인증 흐름 + verified 카드) |

---

## 2. BA 다리 의존 검증 ✅

| BA | 등급 | 의존 | 데이터 |
|----|------|------|--------|
| BA1 | ★★★★★ | AU1 통합 | (단독) OAuth Kakao/Naver/Google/Apple |
| BA2 | ★★★★ | AU2 wizard | Phase 12-5 IdentityVerifyButton (step3) |
| BA3 | ★★★ | AU3 password | (단독) 강도 미터 5단계 |
| BA4 | ★★★ | AU4 verify | verified_name / verified_phone / verified_birth |
| BA5 | ★★ | AU4 cross | Phase 6.1 PU2 + Phase 6.3 GU3 IdentityVerifyButton 시각 정합 · success badge 자동 |

---

## 3. carry-over (변경 ❌)

### 파일 — v2.26 그대로
- `tokens.css` / `shell.css` / `shared.jsx` / `game·team·org·comm-shared` / `profile-shared.*` (USER_ME / PREFERRED / pm-chip) / `billing-shared.*` / `growth-shared.*` (gw-verify / gw-ph) / `admin.css`
- Phase 1~6.3 = 모든 wrapper + jsx + _baseline carry-over (운영 코드 변경 0)

### 신규 추가
- `auth-shared.jsx` — Phase 7 mock (OAUTH 4 / ONB_STEPS·SKILL·HAND·POSITION·CITY·DISTRICT / VERIFIED) + mini components (AuthBrand / OAuthRow / PwInput / PwStrength / pwStrength / AuStepper / ChipGroup / IdentityVerifyButton)
- `auth-shared.css` — Phase 7 전용 (.au-* : page / brand / card / tabs / field / input / btn / oauth / terms / stepper / strength / result / verified / countdown / idv / summary)
- `screens/LoginSignup.jsx` (AU1) / `Onboarding.jsx` (AU2) / `PasswordRecovery.jsx` (AU3) / `Verify.jsx` (AU4)
- 4 wrapper HTML (au1~au4)

---

## 4. 자체 검수 — 13 룰 + Phase 7 특수 4 통과 ✅

### 13 룰
- ✅ 하드코딩 색상 = 토큰만 (예외: OAuth 브랜드 식별색 — 카카오 `#FEE500` / 네이버 `#03C75A` / 애플 `#111` = 각 사 공식 브랜드 가이드, OAuth 버튼 한정)
- ✅ lucide-react = 0 · Material Symbols Outlined 만 · 9999px = 0 (원형 50%)
- ✅ 가짜링크 = 0 · button 4px / 카드 8px · placeholder 5단어 이내
- ✅ iOS input 16px (.au-input) / 버튼 44~48px (.au-btn) / 720px 분기
- ✅ Pretendard + Archivo + JetBrains Mono 만
- ✅ AppNav 미적용 = 의도된 standalone (로그인/온보딩은 nav 외부 — frozen 위반 아님)

### Phase 7 특수 4
- ✅ **AU1 OAuth 4 카드 시각 일관** — 각 provider 브랜드 색 + 마크 (`.au-oa--kakao/naver/google/apple`)
- ✅ **AU2 5 step indicator** = Phase 1B UA3 답습 stepper (`.au-stepper` · done/on/todo)
- ✅ **AU3 비밀번호 강도 미터 5단계** = err → warn → ok 색 (`.au-strength[data-s]`)
- ✅ **AU4 verified 결과 success 카드** = verified_name + verified_phone + verified_birth + 일자 (`.au-verified`)

---

## 5. 회귀 방지 ✅
- ❌ Phase 1~6.3 시안 변경 = 0 · 새 라우트 = 0
- ✅ IdentityVerifyButton = AU2 step3 / PU2 / GU3 동일 시각 (cross-domain 정합)
- ✅ verified_* = AU4 결과 → PU2/GU3 success badge 자동 연동 (시각 일관)

---

**박제 끝.** v2.26 carry-over 위 신규 4 시안 + auth-shared.jsx/css 추가. 운영 코드 변경 0.
가정: 시안 데모 토글(AU3 forgot/reset · AU4 성공/실패)은 시안 전용 — 운영은 URL·인증 결과로 분기. OAuth Apple = 시안 추가(운영 3종 + 확장 슬롯).
