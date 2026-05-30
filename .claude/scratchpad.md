# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 6.2 Auto Chain — v2.25 sync + Phase 6.2C 박제 7 PR (결제·구독·예약)
- **상태**: 🔵 진행 중 — §2 점검 통과 / sync 진행
- **현재 담당**: pm → developer
- **의뢰서**: `Dev/design/prompts/phase-6.2-auto-chain-cli-prompt-2026-05-31.md`

### Phase 6.2C 진행 (7 PR / ★ 토스페이먼츠 실연결 mock 0)
| PR | 시안 → 운영 | 상태 |
|----|------|------|
| 6.2C-1 | BU5 PricingResult → /pricing/success+/fail (BB3) | ✅ 구현 (tsc 0) |
| 6.2C-2 | BU1 Pricing → /pricing (BB1 플랜 list) | ✅ 구현 (tsc 0) |
| 6.2C-3 | BU4 ProfileBookings → /profile/bookings 보강 (BB4) | ⏳ |
| 6.2C-4 | AdminPlans → /admin/plans (BB1 BA2) | ⏳ |
| 6.2C-5 | AdminPayments → /admin/payments (BB2 BA1 환불) | ⏳ |
| 6.2C-6 | BU3 ProfileBilling → /profile/billing (BB1+BB2 3 sub-tab) | ⏳ |
| 6.2C-7 | BU2 PricingCheckout → /pricing/checkout (BB5 토스 위젯 실임베드) | ⏳ |
- lock: 토스 = 운영 실연결(confirm/refund API, mock 0) / OA1 답습(BA1/BA2 모달) / 결제 status 색분리 / BB7 Phase6.1 PU2 결제링크 활성
- 데이터 정책: server 조회 통합 허용 / stop = `/api/v1`·DB schema·LOC>+2000·tsc실패·회귀6·13룰·토스 mock

## 완료 Phase (이력)
- ✅ **Phase 5+6.1 운영 반영** (dev→main #658 / main `26586af` Vercel 배포 success)
  - Phase 5C 6: 커뮤니티 5 + 랭킹 + AdminCommunity / 공용 community-wizard (#656)
  - Phase 6.1C 6: 프로필 업적/메인/수정/농구/AdminUsers/공개프로필 (#657)
  - 핵심: BP1 publicView privacy 7키 / BP5 자기정지 가드 서버보강 / BP2 server조회 cross-domain / 빌드 fix(CSS `*/` Turbopack)
- ✅ Phase 1C 15/16 (#650~#653) / Auto Chain 25 PR 2C·3C·4C (#654/#655)

## 구현 기록 (developer) — Phase 6.2C

### 6.2C-1 — BU5 PricingResult → /pricing/success + /fail (BB3)

📝 구현한 기능: 시안 PricingResult success 델타 박제 (제목 🎉 / "내 구독 보기"→/profile/billing BB7 / 결제 항목 조건부 행). fail은 거의 유지(운영 13코드 매핑이 시안 4코드보다 충실 → 보존).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/pricing/success/page.tsx | 제목 🎉 추가 / plan 쿼리 조건부 "결제 항목" 행 / 버튼 시안 순서([내 구독 보기 cafe-blue→/profile/billing, 영수증 인쇄, 요금제 보기]) / 중복 하단 링크 제거 | 수정 (+30/-21, 순 +9) |
| src/app/(web)/pricing/fail/page.tsx | 변경 없음 (정합 "거의 유지") | — |

설계 정합 (PM 승인):
- confirm route · searchParams 수신 0 변경 (plan 추출만 read 추가, mock 0)
- 인라인 톤 유지 (billing-shared.css 운영 미유입 / 신규 CSS 0 → bu5-/bb- prefix 충돌 0)
- "내 구독 보기" → /profile/billing (BB7 — 기존 ?tab=payments 결제내역 버튼 대체)
- 플랜명 등 미전달 값 mock 안 함: plan 쿼리 있을 때만 "결제 항목" 행 노출 / 부연설명은 운영 일반 문구 유지(BDR PRO 하드코딩 ❌)
- 신규 토큰 0 (--cafe-blue/--cafe-blue-deep/--ok globals.css 기존 보유)

💡 tester 참고:
- 테스트: /pricing/success?orderId=X&amount=9900&method=카드&paymentKey=tviva…&plan=BDR%20PRO%20월%20구독 → 🎉 제목 / "결제 항목" 행 노출 / "내 구독 보기" 클릭 → /profile/billing
- plan 쿼리 제거 시: "결제 항목" 행 사라짐 (나머지 정상) — mock 0 정상 동작
- /pricing/fail?code=NOT_ENOUGH_BALANCE 등: 무변경 (회귀 0 확인용)
- 정상: tsc 0 / 인쇄(window.print) 동작 보존

⚠️ reviewer 참고:
- "내 구독 보기" 버튼이 btn--primary 미사용 + 인라인 cafe-blue 직접 지정 (시안 BU3 진입 버튼 톤 답습). btn--primary도 cafe-blue지만 시안 톤 명시 위해 인라인 유지
- searchParams `plan` 키는 운영 confirm flow가 현재 전달하지 않을 수 있음 → 그래서 조건부(없으면 숨김). 추후 confirm에서 plan 부착 시 자동 노출

### 6.2C-2 — BU1 Pricing → /pricing (BB1 플랜 list 실 데이터)

📝 구현한 기능: 시안 BU1 Pricing 박제. mock(PRICING 3종 tier/비교표 8행/월간연간 토글/alert CTA) 전면 제거 → 운영 plans 실 데이터 카드 grid + CTA 실연결.

🔑 핵심 발견 (설계 결정 근거):
- 시안 BU1 = tier 3종(무료/BDR+/PRO) + 비교표 + 월간/연간 토글
- 운영 plans 실데이터 = feature_key 4종 (팀생성권 ₩9,900 1회 / 픽업게임 ₩49,000 월 / 체육관대관 ₩49,000 월 / 대회생성 ₩199,000 월) — tier·연간가격·features 다중 컬럼 없음
- → 비교표·토글·features 목록 매핑 불가 → 제거 (mock 0 원칙, PM 승인). description 단일 컬럼만 렌더.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/pricing/page.tsx | 서버 async 전환: prisma.plans.findMany(is_active,price asc) + getWebSession→user_subscriptions(status=active) current 표시. metadata·revalidate=300 보존. BigInt→string 직렬화 후 props 전달 | 수정 (+76/-... 순증 일부) |
| src/app/(web)/pricing/_v2/pricing-content.tsx | `use client` 제거(토글 useState 삭제→인터랙션 0). 카드 grid 렌더 / CTA `Link href=/pricing/checkout?planId={id}` 실연결 / current=true 카드는 disabled "이용 중인 플랜" / plans 0건 시 안내(mock 카드 ❌) | 수정 (-207 순감) |

설계 정합 (PM 승인 방침 100% 일치):
- plans 실데이터 카드 grid ✅ / 비교표·토글 제거 ✅ / CTA `/pricing/checkout?planId={id}` 실연결 ✅ / mock 0 ✅ / metadata·revalidate 보존 ✅
- 총 순 LOC -107 (175 add / 282 del) — LOC>+2000 stop 미해당
- BB1 정합: CTA planId → 기존 /pricing/checkout 가 `/api/web/plans/{id}` fetch (변경 0). plans 컬럼 = checkout/BA2 동일 source
- 가격 천 단위 통일 (₩49,000) / plan_type 라벨 "/ 월" · "/ 회"

💡 tester 참고:
- 테스트: /pricing → 카드 4종(팀생성권/픽업게임/체육관대관/대회생성) 노출 / 각 가격·설명 / "선택" 클릭 → /pricing/checkout?planId={id} 이동
- 로그인 + 활성 구독 있으면: 해당 플랜 카드 "현재 구독 중" 리본 + "이용 중인 플랜" disabled
- 비로그인: 모든 카드 결제 진입 가능 (current 없음) — 정상
- 정상: tsc 0 / checkout flow 회귀 0 (planId 쿼리 그대로 수신)

⚠️ reviewer 참고:
- page.tsx async 서버 컴포넌트 + getWebSession 추가 → revalidate=300은 plans 조회에만 의미, session 의존부는 동적. 캐시-동적 혼합 정상 동작 확인 요망
- pricing-content `use client` 제거 — Link만 사용하므로 서버 컴포넌트 OK. 기존 토글 인터랙션 완전 제거됨

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-31 | **Phase 5+6.1 dev→main 운영 반영** (#658) | ✅ main `26586af` Vercel success / ledger ⑬⑭ ✅ 종료 |
| 2026-05-31 | **Phase 6.1 chain** (v2.24 sync + 6.1C 6 PR #657) | ✅ `29178b9`+`cc78745`~`f29a3ca` / BP1 privacy·BP5 가드·BP2 server조회 / stop 0 |
| 2026-05-31 | **Phase 5 chain** (v2.23 sync + 5C 6 PR #656) | ✅ `7e2d0f1`+`68fc5c3`~`3e3423f` / 공용 wizard·mock 0 / stop 0 |
| 2026-05-31 | 빌드 fix: admin CSS 주석 `*/` Turbopack 실패 | ✅ `bdd5e32` / errors.md 기록 |
| 2026-05-31 | 경기일 Flutter 검수 + ttp 정합성 3패턴 | ✅ lessons.md 기록 (셋업·몽키즈) |
| 2026-05-30 | placeholder 선수 셋업 (하주호) | ✅ conventions.md / uid3516 |
| 2026-05-29 | Auto Chain 25 PR 운영 반영 (#654/#655) | ✅ main `6f22c02` |
