# 클로드 디자인 의뢰 — 온보딩·회원가입·인증 (Phase 7)

> **선행**: Phase 1~6 완료 (Phase 6 묶음 16 시안 종료)
> **본 의뢰**: 4 시안 (AU1~AU4) · 사용자 측만 (admin ❌)
> **★ 첫 사용자 진입 / conversion funnel 핵심**

---

## 0. 진입 표준 절차

Phase 6.3 의뢰서 §0 답습. Phase 1~6.3 carry-over (변경 ❌) — BDR-current/ 안 61 jsx + 7 css + 7 shared (game/team/org/comm/profile/billing/growth).

---

## 1. 한 줄 요약

`/login + /signup` (AU1 통합 신규) + `/onboarding 5 sub` (AU2 5-step wizard 통합 신규) + `/forgot + /reset-password` (AU3 통합) + `/verify` (AU4 보강) = **4 시안**.

---

## 2. 결재 룰

- ✅ **AU1 통합 entry** = 로그인/회원가입 같은 시각 패턴 (BDR 브랜드 + OAuth 4-5)
- ✅ **AU2 5-step wizard** = Phase 1B UA3 + Phase 4 OU3 답습 stepper / Phase 12-5 IdentityVerifyButton 재사용
- ✅ **AU3 password** = forgot 신규 + reset 옛 v2(1) carry (보강만)
- ✅ **AU4 verify** = 옛 v2(1) carry (사후 hero + verified 결과 + cross-domain link)
- ✅ **BA5 cross-domain** = Phase 6.1 PU2 + Phase 6.3 GU3 안 IdentityVerifyButton 시각 정합
- ❌ 새 라우트 ❌ / Phase 1~6.3 시안 변경 ❌

---

## 3. 4 시안 사양

### AU1 — LoginSignup (통합 신규) · `/login` + `/signup`

**현황**: 549 + 311 = 860 line · 박제 ❌

**시안 (신규)**:
- Hero band — BDR 로고 + 슬로건 (대형 / 모바일 1열)
- 통합 entry — "로그인" / "회원가입" toggle 또는 별 화면 일관 패턴
- 이메일 + 비밀번호 form (5 단어 placeholder / iOS 16px / 44px 버튼)
- OAuth 4-5 provider 카드 (Kakao / Google / Naver / Apple)
- AU1-A · 로그인 화면 = 이메일 + 비밀번호 + "로그인" + OAuth + "비밀번호 찾기" link → AU3 + "회원가입" link → /signup
- AU1-B · 회원가입 화면 = 이메일 + 비밀번호 + 약관 동의 (3 종 / 필수+선택) + "가입하기" + OAuth + "로그인" link → /login
- 에러 메시지 통일 (이메일 형식 / 비밀번호 강도 / OAuth 실패)
- 사후 = onboarding 진입 (onboarding_completed_at null 시) 또는 홈 redirect

### AU2 — Onboarding 5-step wizard (통합 신규) · `/onboarding/*`

**현황**: 5 sub (basketball 105 + environment 98 + identity 101 + preferences 110 + setup 19) · Phase 12-5 부분 박제

**시안 (신규 통합 wizard · Phase 1B UA3 + Phase 4 OU3 답습 5-step)**:

```
[Step 1] basketball — 농구 기본 정보
  - skill_level select (beginner/intermediate/advanced/all)
  - dominant_hand chip (좌/우/양손)
  - position chip (G/F/C)
  - "다음" CTA

[Step 2] environment — 활동 환경
  - city select (서울/경기/인천 등)
  - district select (cascading)
  - preferred_regions chip (다중)
  - "다음" CTA

[Step 3] identity — 본인 인증
  - IdentityVerifyButton (Phase 12-5 mock 재사용)
  - 인증 성공 시 verified_name + verified_phone 카드
  - "건너뛰기" 옵션 (선택)

[Step 4] preferences — 선호
  - 8 종 preferred_* (Json[] · divisions/days/time_slots/skill_levels/game_types/board_categories/gender 등)
  - chip 선택 UX (Phase 4 답습)
  - "다음" CTA

[Step 5] setup — 최종 확인
  - 입력값 summary 카드
  - "완료" CTA → onboarding_completed_at 저장 → 홈 redirect
```

- 진입 = 회원가입 후 자동 redirect (Phase 10-5 server wrapper 가드 유지)
- 도중 이탈 시 마지막 step 부터 재진입
- 상단 5 step indicator (Phase 1B UA3 답습)
- "이전" / "다음" / "건너뛰기" CTA 일관

### AU3 — PasswordRecovery (forgot + reset 통합) · `/forgot-password` + `/reset-password`

**현황**: forgot 164 (박제 ❌) + reset 449 (v2(1) 박제 ✅ 4단계 위저드 + 강도 미터)

**시안**:
- AU3-A · forgot 신규 박제 — Hero + 이메일 입력 + "재설정 링크 전송" CTA + 사후 안내 hero ("메일을 확인하세요")
- AU3-B · reset 보강 — 옛 v2(1) 4단계 위저드 carry / 사후 hero ("비밀번호가 변경되었습니다" + "로그인" CTA → /login)

### AU4 — Verify (본인 인증 보강) · `/verify`

**현황**: 438 line · v2(1) 박제 ✅ (단계 progress + 카운트다운)

**보강**:
- AU4-A · 사후 안내 hero — 인증 성공 시 verified 카드 (verified_name + verified_phone + 인증 일자) + "프로필 진입" CTA
- AU4-B · 인증 실패 시 retry CTA + 사유 표시 (warn-soft tone)
- AU4-C · cross-domain link 정합 — Phase 6.1 PU2 / Phase 6.3 GU3 IdentityVerifyButton 시각 정합

---

## 4. 양측 의존 검증

| BA | 본 의뢰 | cross-domain |
|----|---------|-------------|
| BA1 | AU1 통합 | (단독) |
| BA2 | AU2 wizard | Phase 12-5 IdentityVerifyButton (Phase 6.1 PU2 + 6.3 GU3 정합) |
| BA3 | AU3 password | (단독) |
| BA4 | AU4 verify | verified_* 컬럼 → PU2/GU3 success badge 자동 |
| BA5 | AU4 cross | Phase 6.1 PU2 / Phase 6.3 GU3 IdentityVerifyButton 시각 |

---

## 5. 13 룰 + Phase 1~6.3 carry-over

- ❌ AppNav / 새 라우트 / Phase 1~6.3 시안 변경 ❌
- ✅ OAuth provider 4-5 (Kakao/Google/Naver/Apple) 시각 일관
- ✅ 비밀번호 강도 미터 5단계 (옛 v2(1) carry)
- ✅ 5-step stepper = Phase 1B UA3 + Phase 4 OU3 답습
- ✅ Phase 12-5 IdentityVerifyButton mock 재사용 (운영 변경 ❌)

---

## 6. 자체 검수

기본 12 + Phase 7 특수 4:
- ✅ AU1 OAuth 4-5 카드 시각 일관 (각 provider 색 + 로고)
- ✅ AU2 5 step indicator = Phase 1B UA3 답습 (시안 일관)
- ✅ AU3 비밀번호 강도 미터 5단계 색 (err → warn → ok)
- ✅ AU4 verified 결과 success 카드 (verified_name + verified_phone + 일자)

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 온보딩·회원가입·인증 (Phase 7 · AU1~AU4)

이해: AU1 LoginSignup 통합 + AU2 5-step Onboarding wizard + AU3 PasswordRecovery + AU4 Verify 보강.
양측 의존 = BA1~BA5 / Phase 12-5 IdentityVerifyButton cross-domain.
사용자 결정 §1~§8 / AppNav / 13 룰 / Phase 1~6.3 carry-over.
자체 검수: 06 §entry / wizard / OAuth / 강도 미터
작업 시작.
```

---

**의뢰서 끝.**
