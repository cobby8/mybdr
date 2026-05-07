# Phase E — shared 공유 컴포넌트 시안 + tokens.css 최종 정합

> Claude 디자인 세션에 **본 마크다운 전체** 를 복사 후 붙여넣기.

---

## 🎯 본 Phase 의 클로드 디자인 작업 범위

**클로드 디자인이 직접 수정 가능한 파일**:
- `BDR-current/components.jsx` — 글로벌 공유 컴포넌트 (PWA 배너 / push 권한 / kakao map placeholder / image uploader / slide menu 등)
- `BDR-current/tokens.css` — 최종 검수 + 누락 토큰 보완
- `BDR-current/screens/*.jsx` — 시안에 글로벌 컴포넌트 시각 정합 영향 가는 부분만 (예: /courts 의 카카오맵 영역)

**클로드 디자인 범위 외 (PM 이 Cowork 와 별도 진행)**:
- `src/components/shared/*` 9 파일 토큰 마이그레이션 (push-permission, pwa-install-banner, slide-menu, user-dropdown, image-uploader, place-autocomplete, profile-completion-banner, kakao-map, header)
- `src/components/bdr-v2/nav-badge.css` — fallback hex 제거 (`var(--color-accent, #E31B23)` → `var(--accent)` / `#16a34a` → `var(--ok)`)

---

## 📋 의뢰

```
✅ BDR 디자인 의뢰 — Phase E: shared 공유 컴포넌트 시안 + tokens.css 최종 정합

배경:
- Phase A~D 에서 자주 쓰는 shared 컴포넌트 (search-autocomplete / profile-dropdown / region-picker / floating-filter-panel / edition-switcher) 는 이미 시안 정합 완료.
- 본 Phase: 위 단계에서 흡수 안 된 글로벌 공유 컴포넌트 + tokens.css 최종 정합.
- audit-2026-05-07.md 결과: 운영 src/components/shared/* 잔여 9 파일 + 하드코딩 hex 5건 (kakao-map / nav-badge.css).

본 Phase 작업 (시안 영역만):

1. components.jsx — 글로벌 공유 컴포넌트 시안 표준:

   1-1. PWAInstallBanner (PWA 설치 배너):
        * 모바일 하단 고정 배너 / iOS 추가 액션 안내
        * 닫기 X / "설치하기" CTA
        * 토큰: var(--bg-card) / var(--accent) / var(--ink)

   1-2. PushPermissionPrompt (푸시 권한 모달):
        * 알림 권한 요청 — 첫 진입 또는 알림 페이지 진입 시
        * "허용" / "나중에" 2 액션
        * 다크 mode 에서 brutalism 모달 (sh-md hard offset)

   1-3. ProfileCompletionBanner (프로필 완성도 배너):
        * 프로필 입력 미완료 시 홈 / 마이페이지 상단 노출
        * 진행률 막대 (var(--accent) / var(--bg-alt))
        * 닫기 X / "완성하기" CTA

   1-4. ImageUploader 시안:
        * 드래그앤드롭 / 클릭 / 갤러리 선택
        * 압축 진행률 / 매치당 15장 제한 안내
        * Vercel Blob 업로드 (시안에서는 placeholder)

   1-5. SlideMenu 시안 (모바일 사이드 슬라이드 — drawer 와 별개):
        * 우측 슬라이드 / 왼쪽 슬라이드 / 백드롭 패턴
        * AppDrawer 와의 차이 명시 — drawer = 메인 메뉴 / slide-menu = 페이지 내 보조

   1-6. KakaoMap placeholder 시안:
        * 코트 페이지 카카오맵 영역 — 시안에서는 placeholder 박스
        * 인포윈도 마커 색상: var(--ok) (활발) / var(--warn) (적당) / var(--accent) (브랜드)
        * 시안에는 실제 카카오맵 임베드 X — placeholder 시각만

   1-7. PlaceAutocomplete 시안:
        * 코트 / 회원 가입 / 활동 지역 입력 시 자동완성
        * 검색 결과 row + 선택 시 칩 패턴

   1-8. UserDropdown 시안 (ProfileDropdown 과 차이 명시):
        * UserDropdown = 회원 카드 ⋮ 메뉴 (본인 카드 dropdown — 02 §10-7)
        * overflow visible 룰 명시

2. tokens.css 최종 정합 — 02 와 1:1 일치 검수:
   * 02 §1-1 브랜드 — --bdr-red / --accent / --cafe-blue / --link 등 모두 정의 ✅
   * 02 §1-2 배경 — --bg / --bg-elev / --bg-card / --bg-alt / --bg-head ✅
   * 02 §1-3 잉크 — --ink / --ink-soft / --ink-mute / --ink-dim / --ink-on-brand ✅
   * 02 §1-4 테두리 — --border / --border-strong / --border-hard ✅
   * 02 §1-5 상태 — --ok / --warn / --danger / --info ✅
   * 02 §3 타이포 — --fs-* / --lh-body / --ff-* ✅
   * 02 §4 라운딩 — --r-0/1/2/3/4 / --radius-card 듀얼 / --radius-chip 듀얼 ✅
   * 02 §5 그림자 — --sh-xs/sm/md/lg 듀얼 ✅
   * 02 §9 폐기 토큰 deprecated 주석 ✅ (Phase A 에서 추가했으면 검수)

3. screens/*.jsx 영향 영역 — 글로벌 컴포넌트 사용처 검증:
   * Court.jsx — kakao-map placeholder 정합
   * 회원가입 / 활동 지역 입력 화면 — PlaceAutocomplete 정합
   * 모든 화면 — PWA 배너 / Push 권한 / ProfileCompletion 배너 시각 검수

룰 인지 (반드시 준수):
- AppNav: 03 frozen 13 룰 — Phase A 갱신본 그대로 카피 (재구성 X)
- 토큰: 02 §1~§5 신 토큰만 / Phase A~D 에서 추가/활용된 토큰 활용
- 듀얼 테마: 02 §0 — 라이트/다크 모두 시각 검증
- 카피: 01 §6 보존 / placeholder 5단어 / "예) " ❌
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌ (정사각형 토글 / 위치 뱃지 50%)
- 글로벌 모달 / 배너 — 다크 mode brutalism (sh-md hard offset / radius-card 0px)

자체 검수 (Phase E 시안 완료 시 모두 통과):
□ components.jsx 8 글로벌 공유 컴포넌트 시안 정합 ✅
□ tokens.css 02 §1~§9 와 1:1 일치 (누락 토큰 0) ✅
□ tokens.css deprecated --color-* 매핑 주석 박제 ✅
□ KakaoMap 인포윈도 마커 색상 토큰 매핑 (var(--ok) / var(--warn) / var(--accent)) ✅
□ 글로벌 모달 / 배너 라이트 / 다크 둘 다 시각 검증
□ AppNav 13 룰 영향 0
□ 06-self-checklist.md §1~§5 모두 ✅

산출 형식:
- BDR-current/ 안의 시안 직접 수정 (components.jsx + tokens.css 최종 + 영향받는 screens 일부)
- 시안 결과물 = MyBDR.html 라우터 진입 시 / 모든 페이지에서 글로벌 모달/배너 시각 정합 노출
- 변경 요약 보고:
  * components.jsx 신규 / 갱신된 글로벌 컴포넌트 8 개
  * tokens.css 최종 토큰 카운트 + deprecated 매핑 표 위치
  * screens 영향 영역

후속 (PM 이 Cowork 와 진행 — Claude 디자인 작업 외):
- src/components/shared/* 9 파일 토큰 마이그레이션 (02 §9 매핑)
  * push-permission (19) / pwa-install-banner (8) / slide-menu (14) / user-dropdown (10)
  * image-uploader (10) / place-autocomplete (8) / profile-completion-banner (6) / kakao-map (12) / header (9)
- src/components/bdr-v2/nav-badge.css 하드코딩 hex 정리:
  * L24/35/46: var(--color-accent, #E31B23) → var(--accent)
  * L56: #16a34a → var(--ok)
- src/components/shared/kakao-map.tsx 인포윈도 hex 3건 → 토큰 fallback hex (#1CA05E / #E8A33B / #E31B23 유지)

질문 / 가정 (작업 시작 전 PM 결정 필요 시):
1. KakaoMap 인포윈도 시안 — placeholder 박스 vs 실제 카카오맵 임베드 (시안 정합용)?
2. PWA 설치 배너 — iOS 추가 액션 안내 패턴?
3. Push 권한 모달 — 진입 시점 (첫 진입 / 알림 페이지 진입)?
4. SlideMenu 와 AppDrawer — 시안에서 명확히 분리?

작업 시작.
```

---

## 📚 참조

- `claude-project-knowledge/02-design-system-tokens.md` §1~§9 모두
- `claude-project-knowledge/03-appnav-frozen-component.md` (Phase A 갱신본 카피)
- `claude-project-knowledge/06-self-checklist.md` 자체 검수
- `BDR-current/components.jsx` (Phase A~D 갱신 누적)
- `BDR-current/tokens.css` (Phase A 추가된 신규 토큰 활용)

## 🛠 PM 후속 작업 (Cowork 와 함께)

```
"Phase E 클로드 디자인 시안 완료. src/ 마이그레이션 진행해줘:
- src/components/shared/* 9 파일 토큰 마이그레이션 (02 §9)
- src/components/bdr-v2/nav-badge.css 하드코딩 hex 정리 (var(--accent) / var(--ok))
- src/components/shared/kakao-map.tsx 인포윈도 hex → 토큰 fallback
검증:
  grep 'var(--color-' src/components/shared/ → 0
  grep '#22C55E\\|#F59E0B\\|#16a34a' src/ → 0
  grep 'var(--color-accent' src/components/bdr-v2/nav-badge.css → 0"
```
