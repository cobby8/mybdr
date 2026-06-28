# Phase 7 — 온보딩·회원가입·인증 점검 리포트

> **작성일**: 2026-05-31
> **결재**: Phase 6 묶음 종료 후 = **온보딩·회원가입·인증** ✅
> **특수**: 첫 사용자 진입 / conversion funnel 핵심 / admin 측 영역 ❌ (사용자 측만)

---

## 0. 영역 매핑

### 0-1. Phase 7 대상 (4 시안 통합)

| ID | 통합 시안 | 라우트 | LOC | 박제 흔적 |
|----|----------|--------|-----|----------|
| AU1 | LoginSignup (통합) | `/login` + `/signup` | 549 + 311 = 860 | ❌ |
| AU2 | Onboarding 5-step (통합) | `/onboarding/basketball+environment+identity+preferences+setup` | 433 (5 page) | ⚠ identity 부분 (Phase 12-5 mock) |
| AU3 | PasswordRecovery (통합) | `/forgot-password` + `/reset-password` | 164 + 449 = 613 | ⚠ reset v2(1) 박제 |
| AU4 | Verify (보강) | `/verify` | 438 | ✅ v2(1) 박제 (단계 progress + 카운트다운) |

**총 LOC = 2344**

### 0-2. Prisma User 인증 필드

```
User {
  - email (unique) / passwordDigest
  - provider / uid / oauth_token / oauth_expires_at (OAuth)
  - profile_completed / onboarding_completed_at (Phase 10-5 가드)
  - verified_name / verified_phone / verified_birth (본인인증 / 변경 불가)
  - tutorial_completed_* (4 영역)
}
```

---

## 1. 갭 식별 (BA1~BA5)

> **명명**: BA = "Bridge Auth" (인증 다리)

### BA1 — Login + Signup 일관 (★★★★★)

**현황**: /login 549 + /signup 311 · 박제 ❌

**갭**:
- 같은 패턴 (이메일+비밀번호 + OAuth 4-5 provider) — 시각 통일
- "회원가입" / "로그인" 토글 또는 통합 entry
- "비밀번호 찾기" / "회원가입" cross link
- Hero 일관 (BDR 브랜드 + 슬로건)
- 에러 메시지 통일 (이메일 형식 / 비밀번호 강도 / OAuth 실패)

**의뢰 대상**: AU1 신규 박제 (통합)

### BA2 — Onboarding 5-step wizard (★★★★)

**현황**: 5 sub page (basketball / environment / identity / preferences / setup) · Phase 12-5 mock 일부 / Phase 10-5 server wrapper

**갭**:
- 5 step indicator 통일 (BDR 디자인 stepper / Phase 1B UA3 + Phase 4 OU3 답습)
- step 별 UX 분기:
  - basketball = 농구 기본 정보 (skill_level / dominant_hand / position)
  - environment = 활동 환경 (city / district / preferred_regions)
  - identity = 본인 인증 (Phase 12-5 IdentityVerifyButton 재사용)
  - preferences = 선호 (8 종 preferred_* Json[])
  - setup = 최종 확인 + complete
- 진입 = 회원가입 후 자동 redirect (onboarding_completed_at null 사용자)
- 복귀 = 도중 이탈 시 마지막 완료 step 부터 재진입

**의뢰 대상**: AU2 신규 박제 (통합 wizard)

### BA3 — Password Recovery 흐름 (★★★)

**현황**: /forgot-password 164 (박제 ❌) + /reset-password 449 (v2(1) 박제 / 4단계 위저드 + 강도 미터)

**갭**:
- forgot = email 입력 + "재설정 링크 전송" 사후 안내 (메일 도착 안내 hero)
- reset = 옛 박제 4단계 그대로 carry / 보강만 (강도 미터 시각 + 사후 hero)

**의뢰 대상**: AU3 신규 (forgot) + 보강 (reset)

### BA4 — Verify 본인 인증 보강 (★★★)

**현황**: /verify 438 · v2(1) 박제 ✅ (단계 progress + 카운트다운 타이머)

**갭**:
- 보강만 — 사후 안내 hero (인증 성공 시 redirect 안내)
- verified_name / verified_phone / verified_birth 결과 표시 (성공 시 카드)
- 인증 실패 시 retry CTA + 사유 표시

**의뢰 대상**: AU4 보강

### BA5 — Phase 6.1 PU2 + GU3 IdentityVerifyButton cross-domain (★★)

**현황**: PU2 + GU3 안 IdentityVerifyButton (Phase 12-5 mock) → /verify 진입

**갭**:
- /verify 박제 시 cross-domain link 정합 (시각 일관)
- 본인 인증 완료 시 PU2/GU3 안 success badge 자동 표시

**의뢰 대상**: AU4 보강 안 포함

---

## 2. 의뢰 범위 — 4 시안 (사용자만 · admin ❌)

| ID | 통합 시안 | 라우트 | 분류 |
|----|----------|--------|------|
| AU1 | LoginSignup | /login + /signup | **신규 통합** |
| AU2 | Onboarding (5-step wizard) | /onboarding/* | **신규 통합** |
| AU3 | PasswordRecovery | /forgot-password + /reset-password | 신규 (forgot) + 보강 (reset 옛 v2(1)) |
| AU4 | Verify | /verify | 보강 (옛 v2(1)) |

---

**리포트 끝.**
