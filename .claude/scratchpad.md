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
| 6.2C-3 | BU4 ProfileBookings → /profile/bookings 보강 (BB4) | ✅ 구현 (tsc 0, Option A 톤만) |
| 6.2C-4 | AdminPlans → /admin/plans (BB1 BA2) | ⏳ |
| 6.2C-5 | AdminPayments → /admin/payments (BB2 BA1 환불) | ✅ 구현 (tsc 0, Option A) |
| 6.2C-6 | BU3 ProfileBilling → /profile/billing (BB1+BB2 3 sub-tab) | ✅ 구현 (tsc 0, Option A) |
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

### 6.2C-3 — BU4 ProfileBookings → /profile/bookings 보강 (BB4, Option A 톤만)

📝 구현한 기능: 시안 BU4 카드 톤 답습(시각만). PM Option A 승인 — 운영 BookingsListV2 3종(코트/토너/게스트) 통합 초과구현 보존 + 취소 액션 0 변경(상세 경로 유지) + 환불 흐름 새 진입점 미신설.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/profile/bookings/_bookings-list-v2.tsx | KIND_ICON 추가(stadium/emoji_events/group) + 종류 배지에 kind 아이콘 prefix + 상태 점(●) → soft 배경 배지(bl-bstat 톤). 헤더 주석 갱신 | 수정 (+31/-3) |
| src/app/(web)/profile/bookings/page.tsx | 변경 없음 (데이터 0 변경) | — |

설계 정합 (PM Option A 100% 일치):
- 카드 시각만 BU4 톤(stadium 아이콘 + 상태 배지) / 데이터·필터·Link·탭 구조 0 변경 ✅
- 코트 link `/courts/[id]` 실존 → 유지 ✅ (page.tsx href 무변경)
- 취소 모달 미신설 — 상세 경로 보존(기능 손실 0) ✅
- page.tsx 0 변경 ✅
- bu4-/bb- prefix 0 (인라인 스타일만) / mock 0 / status 색은 운영 실 status(upcoming/done/cancelled)만 ✅
- 날짜 블록(큰 숫자) 미적용: 운영은 sub 문자열만 보유(date 분리 필드 없음) → 데이터 0 변경 위해 제외 (PM 승인 범위 내)

💡 tester 참고:
- 테스트: /profile/bookings → 카드 종류 배지 앞 아이콘(코트=stadium / 토너=트로피 / 게스트=group) / 상태 배지가 soft 배경 톤(예약중=초록 / 완료=회색 / 취소=빨강) 노출
- 탭/칩 필터 회귀 0 확인: 전체↔코트↔토너↔게스트 / 예약중↔완료↔취소 AND 필터 정상
- 카드 클릭 → 기존 href 그대로(코트 /courts/[id], 토너 /tournaments/[id], 게스트 /games/[id])
- 정상: tsc 0 / 취소 모달 없음(상세 경로) — Option A 의도

⚠️ reviewer 참고:
- 아이콘 1종 룰 → kind 3아이콘으로 확장됨(시안 BU4가 stadium 사용 → 톤 답습 근거). 헤더 주석에 명시
- 상태 배지 색은 STATUS_TONE(기존 토큰) color-mix soft 배경 — 신규 토큰/하드코딩 0

### 6.2C-4 — AdminPlans → /admin/plans (BB1 BA2 카드 grid)

📝 구현한 기능: 시안 BA2 AdminPlans 박제. 플랜 list 를 admin-table → BB1 카드 grid 로 교체. CRUD 시그니처·권한가드·프로모션 관리·생성/수정 모달 100% 보존.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(admin)/admin/plans/page.tsx | 테이블→카드 grid(기존 CARD_CLASS/CARD_STYLE 재사용) / 카드=이름+활성배지(admin-stat-pill)+타입·기능키 태그+가격(0원→무료, ₩천단위, /월·/회)+설명+수정·토글·삭제 / 파싱 보정 `data.data ?? data`(plans·promoStats 양쪽) / 헤더 주석 갱신 | 수정 (+80/-62, 순 +18) |

설계 정합 (PM 승인 100% 일치):
- 테이블 → BB1 카드 grid ✅ (grid-cols 1/2/3 반응형, 기존 토큰만)
- CRUD 시그니처(handleSave/Toggle/Delete/openEdit/openCreate) · 권한가드(API route 측) 0 변경 ✅
- subscribers·features hide ✅ (운영 plans 미보유 컬럼 → mock 0) / 복제 버튼 미배치 ✅ (신규 mutation 0)
- 프로모션 관리 카드 보존 ✅ / 생성·수정 모달 보존 ✅ / AdminPageHeader 보존 ✅
- 파싱 보정 `data.data ?? data` ✅ (apiSuccess snake_case 래핑 대비, 액션 0 변경 — 배열 직반환도 호환)
- 운영 토큰 var(--color-*) 사용 ✅ / 신규 ba2-·bb- prefix 0 ✅ (admin 공용 admin-stat-pill·CARD_CLASS 재사용)
- Hero/OperatorBadge(시안 oa1) 미도입: 운영 미보유 시안 전용 컴포넌트 → AdminPageHeader 유지 (PM "테이블→BB1 카드 grid" 범위)
- 비활성 플랜 opacity 0.6 (시안 bl-pcard--off 톤 답습)

💡 tester 참고:
- 테스트: /admin/plans → 플랜 카드 grid(이름/활성배지/타입·기능키 태그/가격/설명) / "수정" → 모달 / "비활성화↔활성화" 토글 / "삭제"(confirm)
- 0원 플랜은 "무료" 표기, 유료는 ₩9,900 형식 + /월(monthly)·/회(one_time)
- 프로모션 관리(팀장/대회관리자 종료 버튼) 회귀 0 / "+ 요금제 추가" 모달 회귀 0
- 정상: tsc 0 / CRUD 동작 보존 / 구독자 있는 플랜 삭제 시 비활성화 alert 유지

⚠️ reviewer 참고:
- 파싱 보정 `data.data ?? data`: 현재 /api/admin/plans 가 배열 직반환이면 `?.data` undefined → 원본 배열 사용(호환). apiSuccess 래핑으로 바뀌어도 자동 대응. raw 응답 curl 1회 확인 권장
- subscribers/features 컬럼 hide 는 운영 plans 스키마 미보유 근거 (시안은 mock 데이터). DB schema 변경 0
- 복제 버튼 시안에 있으나 신규 mutation(POST 복제 API) 필요 → PM 지시로 미배치

### 6.2C-5 — AdminPayments → /admin/payments (BB2 BA1 환불, Option A)

📝 구현한 기능: 시안 BA1 박제. ① Hero 3카드→4-stat 실집계(총결제액/성공건수/환불합계/실패건수) ② 4탭→실재 status 3탭(성공/실패/환불됨, refund_wait mock 제외) ③ 테이블 액션 열 추가(paid=환불 버튼/refunded=환불일) ④ 환불 모달 신설 → 기존 refund API 실호출. 권한가드·환불 API·조회 0 변경 / 신규 mutation 0.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(admin)/admin/payments/page.tsx | stats 4종 확장(failedCount/refundedCount/refundedSum, 기존 groupBy 재사용 추가 쿼리 0) + 직렬화 refundedAt/tossPaymentKey 추가(조회 컬럼 변경 0) | 수정 (+14/-1) |
| src/app/(admin)/admin/payments/admin-payments-content.tsx | Hero 4-stat / 4탭(refund_wait 제외) / 액션 열 / 환불 모달(AdminDetailModal actions prop 재사용) → POST `/api/web/payments/[id]/refund` 실호출 + router.refresh() | 수정 (+209/-18) |

총 LOC: +223 / -18 (순 +205) — LOC>+2000 stop 미해당. **추가 쿼리 0** (기존 findMany+groupBy 재사용).

⚠️ IDOR 제약 메모 (PM 필수 지시 반영):
- refund API(route.ts §본인 결제만)는 `payment.user_id === ctx.userId` 인 결제만 환불 허용. admin 이 **타인 결제** 환불 시 → API 403("본인의 결제만 환불할 수 있습니다.") 반환.
- UI 처리: 403/400 응답을 모달 refundError 로 **자연 표시** (가짜 성공 mock ❌). submitRefund catch 에서 `data.error` 문자열 그대로 노출.
- **코드 주석 명시**: 환불 모달 블록 상단 + submitRefund 함수 상단에 IDOR 제약 주석 작성.
- **추후 과제**: admin-scoped(타인 결제) 환불은 API 확장(권한 가드 + 토스 환불) 필요 — 금전 민감, 별도 과제.

설계 정합 (Option A 100%):
- 권한가드·환불 API·조회 0 변경 ✅ / Hero 4stat·탭 실집계(refund_wait mock 제외) ✅
- 환불 모달=기존 refund API POST 실호출, 신규 mutation 0 ✅ / 403 에러 자연 표시 ✅
- status 색분리(STATUS_TONE 기존) / toLocaleString ✅ / admin 공용 클래스 재사용(AdminDetailModal·AdminStatusTabs·CARD_CLASS·admin-stat-pill) ✅
- ba1-/bb- prefix 직접 클래스 0 (운영 destructive 버튼 패턴 btn--sm+inline color-error 재사용 / 토큰 var(--color-*)만) ✅
- 신규 토큰 0 (--color-info/--color-error/--color-success/--color-elevated 기존 보유) ✅

💡 tester 참고:
- 테스트: /admin/payments(super-admin) → Hero 4카드 / 탭 성공·실패·환불됨 / paid 행 "환불" 버튼 → 모달
- 환불 모달 "환불 처리" 클릭: **본인(admin) 결제**면 성공 → 모달 닫힘 + 목록 새로고침(상태 환불됨). **타인 결제**면 403 에러 메시지 모달에 빨강 박스로 표시(가짜 성공 ❌)
- 7일 초과/이미 환불 등: API 400 → 에러 메시지 표시
- 행 클릭(액션 열 제외) → 기존 결제 상세 모달 회귀 0
- 정상: tsc 0 / refund_wait 탭 없음(mock 제외 의도)

⚠️ reviewer 참고:
- IDOR: admin 화면이지만 refund API 가 본인 결제만 허용 → admin 의 타인 환불은 현재 불가(403). 이는 의도된 안전 동작(금전). admin-scoped 환불 확장은 별도 과제(주석·보고 명시)
- 환불 사유 input 은 API 가 현재 서버 고정 사유 사용 → body.reason 키만 전달(확장 대비). 실제 DB refund_reason 은 API 가 "사용자 환불 요청" 고정
- router.refresh()로 force-dynamic 페이지 재패칭(상태 갱신). 낙관적 업데이트 미사용(서버 진실 우선)

### 6.2C-6 — BU3 ProfileBilling → /profile/billing (3 sub-tab, Option A)

📝 구현한 기능: 시안 BU3 박제 — 2탭(구독/결제 내역) → **3탭**(구독/결제 내역/환불). Option A 승인대로 결제 내역 행 inline 환불 버튼 → 환불 전용 탭으로 이전. 환불 탭=can_refund/refunded 분리. 데이터 패칭·user_subscriptions 해지·refund API 호출 0 변경 / 기존 refund 모달·handleRefund 공유(신규 mutation 0).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/profile/billing/page.tsx | ① VALID_TABS+TabKey에 "refund" 추가(URL ?tab=refund 보존) ② 탭 바 "환불" TabButton 추가 ③ PaymentsSection→PaymentsHub(view:"payments"\|"refund")로 통합 — 동일 payments SWR·환불 모달·handleRefund 공유(추가 fetch 0) ④ 결제 내역 뷰: inline 환불 버튼 제거(영수증만) ⑤ 환불 뷰 신규: 안내 note + 환불 가능(can_refund) + 환불 완료(refunded) 분리 ⑥ RefundRow 컴포넌트 신규(시안 bl-pay-row 톤→인라인) | 수정 (+345/-95, 순 +250) |

설계 정합 (PM Option A 100% 일치):
- 데이터 패칭 0 변경 ✅ (환불 탭도 /api/web/profile/payments 공유 — PaymentsHub 단일 SWR, 추가 fetch 0)
- user_subscriptions 해지(SubscriptionSection DELETE)·refund API(POST /api/web/payments/[id]/refund) 호출 0 변경 ✅
- 기존 refund 모달·handleRefund 공유 / 신규 mutation 0 ✅
- 구독 카드·결제내역=실데이터 보존 + BU3 톤 ✅ (SubscriptionSection 무변경 / 결제내역 보드 무변경 except 환불버튼 제거)
- 환불 탭=can_refund(서버 산출: paid+7일 이내)/refunded(환불 완료) 분리 ✅
- VALID_TABS에 refund 추가(URL ?tab=refund 보존) ✅
- 토스키 등 운영 payments 미보유 값 mock 안 함(hide) ✅ (시안 toss_key/method_brand/last4/days_left 미박제)
- bu3-/bb- prefix 직접 클래스 0 ✅ (기존 인라인 톤 재사용 / var(--*) 토큰만 / 신규 CSS·토큰 0)

🔗 BB7 확인 (PM 지시):
- /profile/edit:1427 "결제·정산" link → /profile/billing (?tab 미지정 → subscription 기본) ✅ 정상 진입
- /pricing/success:181 "내 구독 보기" → /profile/billing (?tab 미지정 → subscription 기본) ✅ 정상 진입
- 두 진입 모두 기본 탭(구독) 도착. 환불 탭 추가는 진입 동작에 영향 0.

💡 tester 참고:
- 테스트: /profile/billing?tab=refund → 환불 안내 note + "환불 가능 결제"(can_refund 건, 환불 신청 버튼) + "환불 완료"(refunded 건, line-through+환불일)
- 환불 신청 클릭 → 기존 환불 모달(환불하시겠습니까?) → "환불하기" → refund API POST → 목록 새로고침
- 결제 내역 탭(?tab=payments): 행에 환불 버튼 없음(영수증만) — Option A 이전 확인
- 환불 가능·완료 0건: "환불 가능한 결제가 없습니다" + 환불 완료 빈 카드
- 탭 URL 보존: ?tab=subscription/payments/refund 직접 진입 정상 / 그 외 값은 subscription fallback
- 정상: tsc 0 / 구독 탭(해지 모달)·결제 내역 보드 회귀 0

⚠️ reviewer 참고:
- PaymentsSection→PaymentsHub 리네임: 결제 내역+환불 두 뷰가 동일 SWR(page state 포함) 공유. 환불 탭은 page=1 기준 payments만 봄(페이지네이션은 결제 내역 뷰에만 노출) — 환불 가능 건은 보통 최신이라 page1로 충분, 단 20건+ 환불 가능 시 2페이지 이후는 환불 탭 미표시(한계 메모)
- refund API IDOR: 본인 결제만(route.ts) — 본 페이지는 본인 결제 목록이므로 제약 없음(6.2C-5 admin 과 달리 정상)
- 환불 모달을 refundModal 변수로 추출 → 결제 내역/환불 뷰 둘 다 마운트(트리거는 환불 탭만). 중복 렌더 0(view 분기 return)

### 6.2C-7 — BU2 PricingCheckout → /pricing/checkout (BB5 토스, 결제창 팝업 방식)

📝 구현한 기능: 시안 BU2 박제 — 3 step indicator(플랜 선택→결제 정보[현재]→결제 완료) + 플랜 요약(실데이터 toLocaleString) + 결제자 정보 readOnly(person 헤더) + **결제 수단 칩 3종 + 토스 결제창 안내 박스** + 약관 4종+전체동의. 토스 위젯 흐름(SDK 로드/requestPayment/confirm/me·plan fetch/handlePay/disabled) 0 변경.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/pricing/checkout/page.tsx | 본문 시각만 BU2 톤 교체: 3 step indicator(인라인) / bl-summary 톤 플랜요약 / 결제자 정보 person 아이콘 헤더 / 결제수단 카드 신규(칩 3종+lock 안내 박스, mock 스켈레톤 미재현) / 약관 카드 시안 톤(전체동의+필수·선택 뱃지+보기 링크). PM_METHODS/method state(시각용)/allChecked/toggleAllTerms 추가 | 수정 (+305/-57, 순 +248) |

🔒 토스 위젯 흐름 보존 검증 (PM 필수):
- SDK 로드 useEffect (js.tosspayments.com/v2/standard) — **0 변경**
- `toss.requestPayment({ method:"CARD", amount, orderId, orderName, successUrl(.../confirm?planId), failUrl(/pricing/fail), customerEmail, customerName })` — **한 글자도 미변경**
- confirm route / fail URL / plan fetch(`/api/web/plans/{id}`) / me fetch(2회: readOnly + handlePay) / handlePay 401 redirect / disabled(allRequiredAgreed) — **전부 0 변경**
- 결제수단 칩 selection state(method) = **시각 표시용 only** → requestPayment 인자 불변(항상 CARD 고정)

⚠️ stop condition 여부: **없음**
- 토스 mock 여부: **없음** (가짜 카드입력 스켈레톤 bl-pm-skel 미재현 → "결제창 안내 박스 + 결제수단 칩"으로 박제. 실 카드입력은 토스 결제창 팝업 담당)
- /api/v1·DB schema 변경 0 / LOC +248(<+2000) / tsc 0 / 회귀 0(결제 흐름 불변) / 13룰 위반 0
- bu2-/bb- prefix 신설 **0** / bl-* import **0** (전부 인라인 + var(--*) 토큰 / 운영 기존 `card`·Material Symbols 만 사용)
- accent 배경 위 텍스트 = `#fff` (운영 .btn--accent 컨벤션 동일 / 하드코딩 신규 색상 아님)

💡 tester 참고:
- 테스트: /pricing/checkout?planId={id} → step 2단계(결제 정보) 강조 / 플랜 요약(실 가격) / 결제자 readOnly(me) / 결제수단 칩(카드 기본 선택, 클릭 토글) / lock 안내 박스 / 약관 5줄(전체동의+4종)
- 전체동의 클릭 → 4종 일괄 on/off. 필수 3종 미체크 시 "필수 약관 3건 동의 시 결제 가능" + 버튼 disabled
- 필수 3종 체크 → "결제하기" 활성 → 클릭 시 토스 결제창 팝업(요금제 0원 아닐 때). 결제수단 칩을 가상계좌/간편 선택해도 토스 결제창은 동일(CARD 고정) — 정상
- 정상: tsc 0 / 결제 완료 → /api/web/payments/confirm?planId 경유 success / 취소·실패 → fail
- 주의: 비로그인 결제 시도 → handlePay 에서 401 → /login?redirect=... 자동 이동(기존 보존)

⚠️ reviewer 참고:
- 결제수단 칩 method state 는 UI 시각용 — requestPayment 에 미반영(주석 명시). 토스가 결제창에서 실제 수단 선택 담당. 이중 선택 UX는 의도된 시안 박제(가짜 위젯 회피)
- step current=1 하드코딩(이 페이지=결제 정보 단계 고정). 동적 step 불필요
- 약관 "보기" 링크는 상세 미연결(시각 박제) — 시안과 동일. 약관 본문 라우트는 별도 과제

## 구현 기록 (developer) — Phase 6.3C

### 6.3C-1 — GU2 WeeklyReport → /profile/weekly-report (BG2 정합)

📝 구현한 기능: 시안 GU2 정합 보강. PM 판단(데이터 출처 상이 → 표기/톤 정합만, 데이터 패칭 0 변경 우선) 승인대로 ① placeholder warn-soft 3곳 통일 ② 이메일 구독 link 경로 변경 ③ "곧 제공"→"준비 중" 카피 통일 ④ page 구조·KPI 매핑·데이터 패칭 0 변경.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/profile/weekly-report/page.tsx | ① ComingSoonBadge: muted-gray → warn-soft(var(--color-warning) color-mix 14% bg / 32% border) + 라벨 "곧 제공"→"준비 중" ② 평점 KPI placeholder 텍스트 muted→var(--color-warning) ③ §05 다음주 추천 dashed 박스: subtle→warn-soft(배경 5% + dashed 36% + 아이콘 70%) ④ 이메일 구독 link `/profile/notification-settings`→`/profile/settings?section=notify` ⑤ 헤더 주석 2곳 경로/카피 정합 | 수정 (+23/-13, 순 +10) |

설계 정합 (PM 승인 100% 일치):
- BG2 정합 판단 정확: KPI 4 데이터 출처 상이(시안 PU3 시즌 stat vs 운영 weekly-report SWR) → 표기/톤 정합만, **데이터 패칭 0 변경** ✅
- page.tsx 구조·KPI 매핑(경기/평균평점/XP/활동시간)·SWR(`/api/web/profile/weekly-report`)·revalidate·직렬화 **0 변경** ✅
- placeholder warn-soft 3곳 통일 (ComingSoonBadge / 평점 placeholder / 다음주 추천 박스) — 하드코딩 색상 0, var(--color-warning) color-mix만 ✅
- 이메일 구독 → /profile/settings?section=notify (section-key.ts VALID_SECTIONS 유효 확인됨) ✅
- "곧 제공" → "준비 중" 통일 (배지 + 헤더 주석) ✅

🔑 사전 검증 (구현 전 확인):
- `--color-warning` 토큰: globals.css L2773/L2801 (라이트/다크 양쪽 정의 `var(--warn)` #E8A33B) — 존재 확인
- `?section=notify`: section-key.ts VALID_SECTIONS 7키 중 하나 — 유효 확인 (resolveSection 통과)

💡 tester 참고:
- 테스트: /profile/weekly-report → §02 하이라이트·§05 다음주 추천 배지 "준비 중"(warn 노랑 톤) / §01 KPI "평균 평점" 카드 "평점 시스템 준비 중"(warn 톤) / §05 박스 dashed 노랑 톤 + recommend 아이콘 노랑
- 푸터 "이메일 구독 관리" 클릭 → /profile/settings?section=notify (notify 섹션 활성 도착)
- 데이터 회귀 0 확인: KPI 4 값(경기/XP/활동시간 실데이터, 평점 "-") / §04 TOP3 코트 / §06 지난주 비교 모두 기존과 동일
- 라이트/다크 양쪽 warn 톤 가독성 확인 (--color-warning 양쪽 정의됨)
- 정상: tsc 0 / SWR 패칭 동일 / "12주 성장 추이 보기" link(/profile/growth) 무변경

⚠️ reviewer 참고:
- 데이터 정합(KPI=PU3 시즌 stat)은 **의도적으로 미적용** — 출처 상이(weekly-report API vs UserSeasonStat), 데이터 패칭 0 변경 우선(PM 판단). 추후 PU3 정합은 API 통합 별도 과제
- warn-soft 3곳 톤: var(--color-warning) color-mix 비율 의도적 차등(배지 14%/텍스트 100%/박스배경 5%·border 36%·아이콘 70%) — placeholder 강도별 시각 위계
- gu2-/bg- prefix 신설 0 / 신규 CSS·토큰 0 (전부 인라인 + 기존 var(--*) 토큰)

### 6.3C-2 — GU1 ProfileGrowth → /profile/growth (BG1 정합)

📝 구현한 기능: 시안 GU1 정합 보강. PM 승인대로 ① "준비 중" placeholder 배지 4곳 → warn-soft 톤 통일(6.3C-1 weekly-report 동일 패턴) ② PU4 정합 = 마일스톤 이모지 유지(Material Symbols 강제 ❌) ③ SWR 2종·마일스톤 매핑·page 구조 0 변경.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/profile/growth/page.tsx | "준비 중" 배지 4곳 muted-gray(var(--ink-dim)+var(--bg-alt)) → warn-soft(var(--color-warning) 14% bg / 100% color / 32% border + schedule 아이콘) 통일: ① 주간 경기수 ② 평균 평점 ③ 마일스톤 isDummy(커뮤니티/팀멤버추천) ④ 구간별 상세 분석. 헤더 주석 6.3C-2 정합 메모 추가 | 수정 (+49/-8, 순 +41) |

설계 정합 (PM 승인 100% 일치):
- "준비 중" warn-soft 4곳 통일 ✅ — 6.3C-1 (6.3C-1 ComingSoonBadge) 와 동일 비율(14%/100%/32%) + schedule 아이콘. 하드코딩 색상 0, var(--color-warning) 토큰만
- PU4 정합 = 마일스톤 이모지(🏀⭐🎯🔥💬🤝) 유지 ✅ — 시안 GU1 MilestoneTile 도 이모지 사용 → BG1 정합(Material Symbols 강제 ❌, 운영 growth 게이미피케이션 이모지 톤 유지)
- SWR 2종(`/api/web/profile/gamification` + `/api/web/profile/season-stats`) **0 변경** ✅
- 마일스톤 6종 매핑(누적경기/평점/MVP/연속출석/커뮤니티/팀멤버추천) · isDummy 분기 · 835줄 page 구조 **0 변경** ✅
- gu1-/bg- prefix 신설 **0** / 신규 CSS·토큰 **0** (전부 인라인 + 기존 var(--*) 토큰)

🔑 사전 검증:
- `--color-warning` 토큰: 6.3C-1 에서 globals.css L2773/L2801 (라이트/다크 양쪽 `var(--warn)` #E8A33B) 확인 완료 — 재사용

⚠️ stop condition 여부: **없음**
- /api/v1·DB schema 변경 0 / LOC +41(<+2000) / tsc 0 / 회귀 0(데이터 패칭·구조 불변) / 13룰 위반 0 / gu1-·bg- prefix 충돌 0

💡 tester 참고:
- 테스트: /profile/growth → "준비 중" 배지 4곳 모두 노랑(warn) 톤 + schedule 시계 아이콘: ① 주간 경기수 카드 ② 평균 평점 카드 ③ 마일스톤 "커뮤니티 활동"·"팀 멤버 추천" 카드 ④ 하단 "구간별 상세 분석" 박스
- 데이터 회귀 0 확인: HERO 레벨/XP/스트릭, 마일스톤 6종 값(누적경기/평점/MVP/연속출석/커뮤니티/팀멤버추천), 12주 추이 spark/line, "경기 찾기"→/games CTA 모두 기존과 동일
- 마일스톤 이모지 유지 확인: 🏀⭐🎯🔥💬🤝 (Material Symbols 변환 ❌)
- 라이트/다크 양쪽 warn 톤 가독성 확인 (--color-warning 양쪽 정의됨)
- 정상: tsc 0 / SWR 2종 패칭 동일

⚠️ reviewer 참고:
- BG1 정합 = "마일스톤 6 = PU4 user_badges 정합"이나 운영 마일스톤은 이미 season-stats + gamification 으로 매핑된 초과구현 상태 → 데이터 정합(badge icon/이름) 재배선은 데이터 패칭 0 변경 원칙상 미적용(PM 판단). 이모지 톤 유지 + placeholder 통일만 적용
- warn-soft 4곳 비율 균일(14%/100%/32%) — 6.3C-1 ComingSoonBadge 와 정확히 동일. 단 6.3C-1 은 공통 컴포넌트(ComingSoonBadge) 추출, 6.3C-2 는 인라인 4곳(운영 growth 가 클래스/컴포넌트 아닌 인라인 스타일 페이지 → 기존 패턴 답습)
- "구간별 상세 분석" 부모 박스는 기존 opacity 0.65 placeholder 시각 유지(배지만 warn-soft). 6.3C-1 다음주 추천 박스(dashed warn)와 달리 박스 톤 미변경 — PM 승인 범위 = "배지 4곳"

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-31 | **Phase 6.3C-2** GU1 ProfileGrowth BG1 정합 ("준비 중" warn-soft 4곳 통일 + PU4 이모지 유지) | ✅ tsc 0 / +49-8 / SWR 2종·구조 0 변경 / stop 없음 |
| 2026-05-31 | **Phase 6.3C-1** GU2 WeeklyReport BG2 정합 (placeholder warn-soft 3곳 + 이메일구독 link + "준비 중" 통일) | ✅ tsc 0 / +23-13 / 데이터 패칭 0 변경 / stop 없음 |
| 2026-05-31 | **Phase 5+6.1 dev→main 운영 반영** (#658) | ✅ main `26586af` Vercel success / ledger ⑬⑭ ✅ 종료 |
| 2026-05-31 | **Phase 6.1 chain** (v2.24 sync + 6.1C 6 PR #657) | ✅ `29178b9`+`cc78745`~`f29a3ca` / BP1 privacy·BP5 가드·BP2 server조회 / stop 0 |
| 2026-05-31 | **Phase 5 chain** (v2.23 sync + 5C 6 PR #656) | ✅ `7e2d0f1`+`68fc5c3`~`3e3423f` / 공용 wizard·mock 0 / stop 0 |
| 2026-05-31 | 빌드 fix: admin CSS 주석 `*/` Turbopack 실패 | ✅ `bdd5e32` / errors.md 기록 |
| 2026-05-31 | 경기일 Flutter 검수 + ttp 정합성 3패턴 | ✅ lessons.md 기록 (셋업·몽키즈) |
| 2026-05-30 | placeholder 선수 셋업 (하주호) | ✅ conventions.md / uid3516 |
| 2026-05-29 | Auto Chain 25 PR 운영 반영 (#654/#655) | ✅ main `6f22c02` |
