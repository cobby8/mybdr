# Phase 6.2 — sync + Auto Chain (간단 의뢰서)

> **수신**: Claude CLI (mybdr, `subin`)
> **선행 박제**: Phase 1~6.1 운영 반영 (Phase 6.1 박제 v2.24 도착 / sync 진행 중일 가능성)
> **본 의뢰**: v2.25 sync (1 회) + Phase 6.2C 운영 박제 7 PR Auto Chain = **총 8 작업 1 session**

---

## 1. 한 줄 요약

`uploads/BDR v2 (2)-54b1c696.zip` (v2.25 · Phase 6.2 박제 결과) sync → Phase 6.2C 운영 박제 7 PR auto chain → subin push → 사용자 PR 결재.

★ **토스페이먼츠 = 운영 실연결** (route /payments/confirm + /[id]/refund 활성) — mock 0 / 실 데이터 박제.

---

## 2. 사전 점검 (1 회 결재)

```
□ git checkout subin && git pull origin subin
□ dev → subin 머지 동기화 (Phase 6.1 머지 commit 있을 시)
□ uploads/ 안 BDR v2 (2)-54b1c696.zip = Phase 6.2 박제 (BDR v2.25) 확인
□ Phase 6.1 sync 완료 여부 확인 (안 됐으면 v2.24 + v2.25 통합 sync = v2.25 superset)
□ phase-ledger Phase 6.1 / Phase 6.2 entry 갱신 필요
```

→ 결과 요약 → **"OK 시작?" 1 회 결재**.

---

## 3. 1단계 — v2.25 sync (~5분)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (2)-54b1c696.zip"
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.25" -DryRun
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.25"
```

**검수** (Phase 6.1 답습 + Phase 6.2 특수 4):
- 기본 12 + Phase 2/3/4/5/6.1 특수 + **Phase 6.2 특수 4** (billing-shared.jsx + .css 신규 / Pricing/PricingCheckout/ProfileBilling/ProfileBookings/PricingResult/AdminPayments/AdminPlans 7 jsx / Phase 1~6.1 carry-over diff 0 / 토스 위젯 시각 mock 0)

phase-ledger Phase 6.1/6.2 ⑩ ✅ 갱신 + commit `design: BDR-current sync v2.25 (Phase 6.2 결제·구독·예약 7)`.

---

## 4. 2단계 — Phase 6.2C 운영 박제 7 PR (Auto Chain)

### 자동 결재 default
- 토스페이먼츠 = 운영 실연결 (mock 0) / Phase 4 OA1 답습 (BA1/BA2 모달) / 결제 status 색 분리 / 천 단위 구분 통일
- 금지(stop): `/api/v1` · DB schema · LOC>+2000 · tsc 실패 · 회귀 6 위반 · 13 룰 위반

### PR 순서 (LOC 작은 → 큰)

| PR | 시안 | 운영 LOC | 핵심 |
|----|------|---------|------|
| 6.2C-1 | BU5 PricingResult (92) | /pricing/success + /fail (515 합) | BB3 통합 hero (성공 🎉 + 실패 ⚠ + 다시시도 CTA) |
| 6.2C-2 | BU1 Pricing (106) | /pricing (41 wrapper) | BB1 멤버십 플랜 list + 비교 (plans 실 데이터) |
| 6.2C-3 | BU4 ProfileBookings 보강 (142) | /profile/bookings (231) | BB4 4 탭 + 취소 모달 + Phase 7 코트 link |
| 6.2C-4 | AdminPlans (143) | /admin/plans (397) | BB1 BA2 플랜 carad + 생성·수정 모달 |
| 6.2C-5 | AdminPayments (154) | /admin/payments (66) | BB2+BB6 BA1 Hero stat + 4 탭 + 환불 모달 (refund API) |
| 6.2C-6 | BU3 ProfileBilling (184) | /profile/billing (1039) | BB1+BB2 3 sub-tab hub (subscription/history/refund) |
| 6.2C-7 | BU2 PricingCheckout (146) | /pricing/checkout (511) | BB5 토스 위젯 + 3 step + 약관 (실 위젯 임베드) |

### 매 PR 박제 절차 (Phase 6.1C 답습)
1. `git pull origin subin`
2. BDR-current/screens/<시안>.jsx + billing-shared 읽기
3. 운영 라우트 박제 (Phase 1~6.1 패턴)
4. dev:3001 검증 / lint / tsc
5. 자체 회귀 6 케이스 검수
6. commit `design(6.2C-N): <시안> v2.25 박제 (BB<#>)`
7. push + GitHub PR
8. phase-ledger Phase 6.2 ⑪ 갱신 + 1 줄 보고 → 다음 PR

### 양측 의존 검증 (박제 마지막)
- BB1: BU1 list = BU3 "현재 구독" = BA2 플랜 = 동일 plans 컬럼 (가격/혜택)
- BB2: BU3 결제 이력 = BA1 결제 list = 동일 payments 컬럼 (성공/실패/환불 / 토스 결제 키)
- BB4: BU4 = court_bookings + Phase 7 cross-domain
- BB5: BU2 토스 위젯 = 운영 confirm API 실 흐름
- BB7: Phase 6.1 PU2 결제 섹션 link 활성 (BU3 ProfileBilling 진입)

---

## 5. Stop Conditions

```
❌ lint / tsc 실패  ❌ 회귀 6 위반  ❌ DB schema  ❌ /api/v1  ❌ LOC>+2000
❌ 토스 위젯 mock 사용  ❌ 운영 데이터 부족 + hide 불가  ❌ sync 실패  ❌ git push 실패
```

---

## 6. 산출물 (chain 끝)

```
1. v2.25 sync commit + push
2. 6.2C-1~7 = 7 PR push + GitHub PR 링크
3. phase-ledger Phase 6.1/6.2 ⑩ ⑪ ⑫ ✅ 갱신
4. scratchpad 작업 로그 7 줄
5. Phase 6.1 PU2 결제 링크 활성 commit (BB7)
```

---

## 7. 시작 — 한 줄

```
Read Dev/design/prompts/phase-6.2-auto-chain-cli-prompt-2026-05-31.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용. stop conditions 발동 시만 보고.
```

---

**의뢰서 끝.** sync 1 + Phase 6.2C 박제 7 PR = 1 session.
