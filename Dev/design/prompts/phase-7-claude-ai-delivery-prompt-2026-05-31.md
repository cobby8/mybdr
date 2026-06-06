# Phase 7 — 온보딩·회원가입·인증 Claude.ai 의뢰 (단일 paste)

> **선행**: Phase 1~5 박제+운영 + Phase 6 묶음 (16 시안) 박제 도착
> **본 의뢰**: 4 시안 사용자만 (admin ❌) · 첫 사용자 진입 conversion funnel

---

## ⭐ 수빈 본인 액션 — 2 단계 (~2분)

### Step 1 — Claude.ai + 3 건 drag-drop (admin 없음 / 3 첨부)

**첨부**:
- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase7-baseline-2026-05-31.zip` (512KB / 169 파일)
- `auth-onboarding-user-connectivity-plan-2026-05-31.md`
- `auth-onboarding-user-redesign-prompt-2026-05-31.md`

### Step 2 — 아래 §메시지 본체 paste

---

## 메시지 본체

```
Phase 7 — 온보딩·회원가입·인증 리디자인 의뢰 (총 4 시안 + BA1~BA5) 시작합니다.

[선행]
- Phase 1~5 박제+운영 + Phase 6 묶음 16 시안 박제 (6.1+6.2+6.3 = v2.26)
- 첨부 zip = BDR v2.26 (BDR-current = 61 jsx + 7 css + 7 shared = growth-shared 포함)

[★ 본 Phase 특수]
- 첫 사용자 진입 / conversion funnel 핵심
- admin 측 영역 ❌ (사용자만 / 3 첨부)
- 4 시안 통합 박제 (login+signup / onboarding 5-step wizard / password recovery / verify 보강)
- Phase 12-5 IdentityVerifyButton mock 재사용 (운영 변경 ❌)

[상위 계획서]
auth-onboarding-user-connectivity-plan-2026-05-31.md (BA1~BA5 = 5 갭)

[의뢰서 1건 — 첨부]
auth-onboarding-user-redesign-prompt-2026-05-31.md (사용자 4 = AU1~AU4)

[첨부 zip 안]
BDR-current/ — Phase 1~6.3 박제 v2.26
_phase7_operational_refs/ — 11 운영 파일:
  - AU1 (login 549 + signup 311 full)
  - AU2 (onboarding 5 sub full · 433 LOC)
  - AU3 (forgot 164 + reset 449 head/tail)
  - AU4 (verify 438 head/tail)
  - SPEC.md (User 인증 필드 + 박제 흐름)

[Phase 7 박제 시안 = 4 (사용자만)]

- AU1 LoginSignup 통합 신규 박제 /login + /signup · BA1 (이메일+비밀번호 + OAuth Kakao/Google/Naver/Apple 4-5 + 비번찾기/회원가입 cross link)
- AU2 Onboarding 5-step wizard 신규 통합 /onboarding/* · BA2 (Phase 1B UA3 + Phase 4 OU3 답습 5-step indicator / step별 폼 / Phase 12-5 IdentityVerifyButton 재사용)
- AU3 PasswordRecovery /forgot + /reset · BA3 (forgot 신규 + reset 옛 v2(1) 4단계 위저드 + 강도 미터 carry)
- AU4 Verify 보강 /verify · BA4 + BA5 (옛 v2(1) carry + 사후 verified 카드 + cross-domain PU2/GU3 정합)

[2026-05-31 결재 룰]
- BA1 entry = login + signup 같은 시각 패턴 (BDR 브랜드 Hero + OAuth 4-5 + 통일 에러 메시지)
- BA2 wizard = 5 step indicator (Phase 1B UA3 + Phase 4 OU3 답습) / step 분기 (basketball/environment/identity/preferences/setup) / Phase 12-5 IdentityVerifyButton mock 재사용
- BA3 password = forgot 신규 (이메일 + "재설정 링크 전송" + 사후 hero) + reset 옛 v2(1) carry (강도 미터 5단계)
- BA4 verify = 옛 v2(1) 단계 progress + 카운트다운 carry + 사후 verified_name/phone/birth 결과 카드 + 인증 실패 retry CTA
- BA5 cross-domain = AU4 verified 결과 → Phase 6.1 PU2 + Phase 6.3 GU3 IdentityVerifyButton success badge 자동
- Phase 10-5 server wrapper + onboarding_completed_at 가드 carry-over
- AppNav / 새 라우트 ❌ / Phase 1~6.3 carry-over

[작업 흐름]
1. 첫 응답 = 의뢰서 1건 §7 형식
   ✅ Phase 7 사용자 (AU1~AU4) 온보딩·회원가입·인증

2. 박제 순서:
   AU3 forgot (작음) → AU4 verify 보강 → AU1 LoginSignup → AU2 Onboarding 5-step (가장 큰 wizard)

3. 박제 완료 → 새 zip (BDR v2.27/ 예상)

4. 13 룰 위반 시 reject + 알림

[양측 의존 갭 검증]
- BA1: login + signup 같은 OAuth 4-5 카드 시각 / 에러 메시지 통일
- BA2: 5 step indicator = UA3/OU3 답습 / Phase 12-5 IdentityVerifyButton 운영 mock 재사용 (운영 변경 ❌)
- BA3: reset 옛 v2(1) carry / 강도 미터 5단계 색 (err→warn→ok)
- BA4: verified 결과 카드 = verified_name + verified_phone + 일자
- BA5: PU2/GU3 success badge 시각 정합

[자체 검수 4 + 8 + Phase 7 특수 4]

4 frozen + 8 self — Phase 6.3 답습.

Phase 7 특수:
- ✅ OAuth 4-5 카드 시각 일관 (provider 색 + 로고)
- ✅ 5 step indicator = UA3/OU3 답습
- ✅ 비밀번호 강도 미터 5단계 색 분리
- ✅ verified 결과 success 카드

[질문/가정]
- OAuth provider = Kakao/Google/Naver/Apple 4 (운영 확인 필요 — 있는 provider 만 시각 / 없으면 hide)
- IdentityVerifyButton = Phase 12-5 mock 재사용 (Portone 통합 = 본 의뢰 외)
- forgot 이메일 전송 = 운영 흐름 답습 (mock 0)

시작해 주세요.
```

---

## 예상 첫 응답

```
✅ Phase 7 사용자 — 온보딩·회원가입·인증 (AU1~AU4)
이해: AU1 통합 entry + AU2 5-step wizard + AU3 password + AU4 verify 보강.
Phase 1~6 carry-over / OAuth 4-5 / UA3/OU3 답습 stepper / IdentityVerifyButton 재사용.
```

---

## zip 회신 후

```
☐ Cowork 에 "Phase 7 zip 도착"
```

→ Cowork 자동 sync + Phase 7C Auto Chain (4 PR).

---

**의뢰서 끝.**
