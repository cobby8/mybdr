# Phase D — 프로필 편집/설정 시안 갱신

> Claude 디자인 세션에 **본 마크다운 전체** 를 복사 후 붙여넣기.

---

## 🎯 본 Phase 의 클로드 디자인 작업 범위

**클로드 디자인이 직접 수정 가능한 파일**:
- `BDR-current/screens/EditProfile.jsx` — 프로필 편집
- `BDR-current/screens/Settings.jsx` — 설정
- `BDR-current/components.jsx` — ProfileDropdown / 폼 입력 / 토글 / PasswordInput / ForceActionModal 패턴
- `BDR-current/tokens.css` — 폼 토큰 보완 (필요 시)

**클로드 디자인 범위 외 (PM 이 Cowork 와 별도 진행)**:
- `src/app/(web)/profile/edit / settings` 운영 페이지
- `src/components/shared/profile-dropdown.tsx` / `profile-accordion.tsx`

---

## 📋 의뢰

```
✅ BDR 디자인 의뢰 — Phase D: 프로필 편집/설정 시안 (P1, 본인 영역 마무리)

배경:
- /profile 자체는 마이페이지 hub 시안 박제 완료 (Phase 13 — 04 §2 A등급).
- 본 Phase: /profile/edit + /profile/settings 시안 갱신 + 헤더 utility 와 정합되는 ProfileDropdown 패턴.
- audit-2026-05-07.md 결과: 운영 src/components/shared/profile-dropdown (18) + profile-accordion (14) 폐기 토큰.

본 Phase 작업 (시안 영역만):

1. screens/EditProfile.jsx 시안 갱신 — 프로필 편집:
   * 단계형 (signup 1-step 통합) 또는 1 페이지 폼 — 시안 우선
   * 폼 영역 그룹화 — 기본 정보 / 농구 정보 (포지션 / 키 / 활동 지역) / 활동 환경 (선호 시간 / 빈도) / 계정 보안
   * 입력 필드 — iOS 16px / 44px 터치 타겟
   * PasswordInput 컴포넌트 활용 (보기 토글)
   * Phase 12 본인인증 ✓ 뱃지 영역

2. screens/Settings.jsx 시안 갱신 — 설정:
   * 섹션: 알림 / 디스플레이 (라이트/다크/큰글씨) / 프라이버시 / 안전·차단 / 결제·멤버십 / 회원 탈퇴
   * SettingsToggle 컴포넌트 (iOS 토글 패턴 — 정사각형 thumb 라운딩 50% / 트랙 4px)
   * Display 섹션: 다크 모드 듀얼 라벨 (PC) / 단일 아이콘 (모바일) — 03 §2 ThemeSwitch 와 정합
   * Bottom nav editor (모바일 하단 탭 커스텀) — 위치 뱃지 18×18 정사각형 원형 50%

3. components.jsx — 폼 / 모달 패턴:
   * ProfileDropdown — 헤더 utility bar "이름" 클릭 시 dropdown
     - 좌측: 아바타 + 닉네임 + 인증 뱃지
     - 메뉴: 마이페이지 / 프로필 편집 / 설정 / 로그아웃
     - 헤더 utility 우측 (Phase A 에서 동기화된 LogoutLink 패턴) 와 시각 정합
   * PasswordInput — 02 §10-2 (5 파일 일괄 적용 — 시안 컴포넌트로 박제)
     - 보기 토글 + autocomplete 정밀 제어
   * ForceActionModal — 02 §10-3 (jersey / withdraw 두 모드)
     - 강제 액션 (회원 탈퇴 / 인증 해제) 표준 패턴

4. tokens.css 보완 (필요 시):
   * 폼 입력 / 토글 / 셀렉트 토큰 — Phase A 의 신규 16 토큰 활용 (--bg-elev / --border / --ink-mute)

룰 인지 (반드시 준수):
- AppNav: 03 frozen 13 룰 — Phase A 갱신본 그대로 카피
- 토큰: 02 §1 신 토큰만
- 폼 입력: 모바일 16px (iOS 자동 줌 차단), 44px 터치 타겟
- placeholder 5단어 이내 / "예) " ❌
- 카피: 01 §6 보존 / About 운영진 실명 박제 ❌ / 명칭 통일 ("마이페이지" 헤더 dropdown / h1 / 더보기, "프로필" 단어는 /profile/edit 한정)
- 더보기 슬림화 (04 §5-A) — mypage / editProfile / notificationSettings / passwordReset / onboardingV2 = 더보기에서 제거됨. 본 Phase 시안에서 더보기 그룹에 본 항목 추가 X
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌ (정사각형 토글 thumb / 위치 뱃지는 50%)

신규 컴포넌트 표준 활용 (02 §10):
- §10-2 PasswordInput — 비밀번호 변경 영역
- §10-3 ForceActionModal — 회원 탈퇴 / 인증 해제 모달
- §10-7 본인 카드 dropdown — overflow visible 룰

자체 검수 (Phase D 시안 완료 시 모두 통과):
□ EditProfile.jsx / Settings.jsx 시안 갱신 ✅
□ components.jsx ProfileDropdown / PasswordInput / ForceActionModal 표준화 ✅
□ 폼 입력 모두 iOS 16px / 44px 터치 타겟 (모바일 검증)
□ /profile (이미 박제 완료) 와 시각 정합
□ ProfileDropdown 이 헤더 utility bar 와 정합
□ 더보기 메뉴에 mypage / editProfile / notificationSettings 추가 X (회귀 가드)
□ AppNav 13 룰 영향 0
□ 06-self-checklist.md §1~§5 모두 ✅

산출 형식:
- BDR-current/ 안의 시안 직접 수정 (EditProfile / Settings + components.jsx 의 폼 컴포넌트 + tokens.css 보완)
- 시안 결과물 = MyBDR.html 라우터 진입 시 / editProfile / settings 정상 노출
- 변경 요약 보고:
  * EditProfile.jsx / Settings.jsx 갱신
  * components.jsx 신규 / 갱신: ProfileDropdown / PasswordInput / ForceActionModal / SettingsToggle
  * tokens.css 보완 여부

후속 (PM 이 Cowork 와 진행 — Claude 디자인 작업 외):
- src/app/(web)/profile/edit / settings 토큰 마이그레이션 + _v2 박제
- src/components/shared/profile-dropdown.tsx (18) / profile-accordion.tsx (14) 마이그레이션

질문 / 가정 (작업 시작 전 PM 결정 필요 시):
1. /profile/edit — 1 페이지 폼 vs 단계형 (signup 1-step 통합 패턴) ?
2. ProfileDropdown — 헤더 utility "이름" 클릭 시 dropdown vs /profile 직접 진입?
3. 회원 탈퇴 — Settings 안의 Force 액션 vs 별도 페이지?
4. 큰글씨 모드 (html.large-text) — Display 섹션에 토글 노출?

작업 시작.
```

---

## 📚 참조

- `claude-project-knowledge/02-design-system-tokens.md` §10-2 PasswordInput / §10-3 ForceActionModal / §10-7 본인 카드
- `claude-project-knowledge/03-appnav-frozen-component.md` §2 ThemeSwitch / §8 LogoutLink
- `claude-project-knowledge/04-page-inventory.md` §2 A등급 (/profile/edit, /profile/settings)
- `claude-project-knowledge/06-self-checklist.md` 자체 검수
- `BDR-current/screens/EditProfile.jsx` `Settings.jsx`

## 🛠 PM 후속 작업 (Cowork 와 함께)

```
"Phase D 클로드 디자인 시안 완료. src/ 마이그레이션 진행해줘:
- src/app/(web)/profile/edit / settings 토큰 마이그레이션
- src/components/shared/profile-dropdown.tsx + profile-accordion.tsx 마이그레이션
검증: grep 'var(--color-' 위 영역 → 0"
```
