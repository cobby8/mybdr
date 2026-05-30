# BDR v2.25 — Phase 6.2 (결제·구독·예약) 박제

> **박제일**: 2026-05-31
> **선행**: Phase 1A v2.19 + 1B v2.18 + 2 v2.20 + 3 v2.21 + 4 v2.22 + 5 v2.23 + 6.1 v2.24 carry-over
> **선행 의뢰**: `billing-user-redesign-prompt` + `billing-admin-redesign-prompt` + `billing-user-admin-connectivity-plan` (2026-05-30)
> **특수성**: 토스페이먼츠 = **운영 실연결** (route /payments/confirm + /[id]/refund) → mock 0 박제

---

## 1. Phase 6.2 박제 시안 = 7 (사용자 5 + super-admin 2)

### Phase 6.2B — 사용자 측 (BU1~BU5 · A 등급)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| BU1 | Pricing | `/pricing` | **신규** | BB1 ★★★★★ (멤버십 플랜 list + 비교) |
| BU2 | PricingCheckout | `/pricing/checkout` | **신규** | BB5 ★★★★ (토스 위젯 + 3 step + 약관) |
| BU3 | ProfileBilling | `/profile/billing` | **신규** | BB1+BB2 ★★★★★ (3 sub-tab 구독+이력 hub) |
| BU4 | ProfileBookings | `/profile/bookings` | 보강 | BB4 ★★★ (예약 4 탭 + 취소·환불 모달) |
| BU5 | PricingResult | `/pricing/success` + `/fail` | **신규** | BB3 ★★★ (성공/실패 통합) |

### Phase 6.2A — 관리자 측 (BA1+BA2 · E 등급 · super-admin)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| BA1 | AdminPayments | `/admin/payments` | **신규** | BB2+BB6 (Hero stat + 4 탭 + 환불 모달) |
| BA2 | AdminPlans | `/admin/plans` | **신규** | BB1 (플랜 carad grid + 생성·수정 모달) |

---

## 2. BB 양측·cross-domain 의존 검증 ✅

| BB | 등급 | 의존 | 데이터 |
|----|------|------|--------|
| BB1 | ★★★★★ | BU1 list ↔ BU3 구독 ↔ BA2 플랜 | 동일 `PLANS` (가격/혜택/구독자 수) |
| BB2 | ★★★★ | BU3 이력 ↔ BA1 결제 list | 동일 `payments` (status 4종 · 토스 키) |
| BB3 | ★★★ | BU5 결과 (단독) | 토스 confirm/fail 리다이렉트 |
| BB4 | ★★★ | BU4 예약 | `court_bookings` + Phase 7 cross-domain |
| BB5 | ★★★★ | BU2 토스 위젯 | 운영 confirm API (requestPayment 인자 보존) |
| BB6 | ★★ | BA1 환불 | refund API + Phase 2 UD1 알림 |
| BB7 | ★★ | Phase 6.1 PU2 → BU3 link out | carry-over (link 활성) |

---

## 3. carry-over (변경 ❌)

### 파일 — v2.24 그대로
- `tokens.css` / `shell.css` / `shared.jsx` (AppNav frozen + AdminShell) / `game-shared.*` / `team-shared.*` (OperatorBadge) / `org-shared.*` (oa1-*) / `comm-shared.*` (ca1-tabs) / `profile-shared.*` (USER_ME / PageBack) / `admin.css`
- Phase 1~6.1 = 47 wrapper + 45 jsx + _baseline 모두 carry-over (운영 코드 변경 0)

### 신규 추가
- `billing-shared.jsx` — Phase 6.2 mock (PLANS / MY_SUBSCRIPTION / MY_PAYMENTS / MY_BOOKINGS / ADMIN_PAYMENTS + 단일 source) + mini components (won / PayStatusBadge / PriceTag / StepIndicator / PlanCard / PageBackBilling) + helpers (payDate / dateK / PAY_STATUS / BOOKING_STATUS)
- `billing-shared.css` — Phase 6.2 전용 (.bl-* : pstat / price / steps / plan / compare / widget / terms / subtabs / sub / pay-row / booking / result / ptable / pcard / modal)
- `screens/Pricing.jsx` (BU1) / `PricingCheckout.jsx` (BU2) / `ProfileBilling.jsx` (BU3) / `ProfileBookings.jsx` (BU4) / `PricingResult.jsx` (BU5) / `AdminPayments.jsx` (BA1) / `AdminPlans.jsx` (BA2)
- 7 wrapper HTML (bu1~bu5 / ba1~ba2)

---

## 4. 자체 검수 — 4 frozen + 8 self + Phase 6.2 특수 4 통과 ✅

### AppNav frozen 4 (사용자 시안 — shared.jsx 03 카피)
- ✅ main bar 우측 "더보기 ▼" / 아바타 = 0 (shared.jsx AppNav frozen 카피)
- ✅ 모바일(≤768px) 듀얼 라벨 = 0 (ThemeSwitch viewport 분기)
- ✅ 검색/쪽지/알림 box (.btn) = 0 — `app-nav__icon-btn` 만
- ✅ main bar 아이콘 = [검색, 쪽지, 알림, 다크, 햄버거] 순서 보존 · 사용자 시안 active="more"

### 13 룰 8
- ✅ 하드코딩 색상 = 0 — `var(--*)` 토큰만 (예외: 토스 brand `#0064FF`/`#0064FF` = 토스페이먼츠 공식 브랜드 식별색 — 위젯 시각 박제 한정)
- ✅ lucide-react = 0 — Material Symbols Outlined 만
- ✅ 9999px = 0 — 정사각형 50% (avatar/icon/toggle) 만
- ✅ 가짜링크 (gameResult / gameReport / guestApps / referee) = 0
- ✅ button 4px / 카드 6~8px
- ✅ placeholder 5단어 이내 / "예: " 시작 0
- ✅ 720px 분기 / iOS input 16px (.pm-input) / 버튼 44px (.bl-plan__cta · .bl-paybtn)
- ✅ Pretendard + Archivo + JetBrains Mono 만

### Phase 6.2 특수 4
- ✅ **토스 위젯 시각 박제 = mock 0** — BU2 `.bl-widget` (결제수단 chip + 카드 skeleton + 토스 브랜딩) · requestPayment 인자 미변경 안내
- ✅ **결제 금액 천 단위 구분** — `won()` / `wonRaw()` = `₩9,900` 형식 전 시안 통일
- ✅ **status 색 분리** — `PAY_STATUS` = 성공 ok / 실패 err / 환불 neutral / 대기 warn (`.bl-pstat[data-tone]`)
- ✅ **BU3 3 sub-tab** = subscription / history / refund 명확 (운영 ?tab= 답습)

---

## 5. 회귀 방지 — 위반 자동 검수 4 케이스 ✅
- ❌ main bar 우측 "더보기 ▼" dropdown / 아바타 = 0
- ❌ 모바일(≤768px) 듀얼 라벨 = 0
- ❌ 검색/쪽지/알림 버튼 border/bg 박스 = 0
- ✅ main bar 아이콘 순서 frozen 카피 보존

---

**박제 끝.** v2.24 carry-over 위 신규 7 시안 + billing-shared.jsx/css 추가. 운영 코드 변경 0.
가정: 환불 form 별 컬럼 미확인 → BU3 환불 탭 inline 처리 + BA1 환불 모달(refund API). subscription 취소 = 운영 DELETE 흐름 답습.
후속 6.3 (성장 분석) 별 의뢰 예고.
