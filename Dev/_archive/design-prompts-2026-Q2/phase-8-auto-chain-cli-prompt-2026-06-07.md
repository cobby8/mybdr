# Phase 8 — sync + Auto Chain (간단 의뢰서)

> **수신**: Claude CLI (mybdr, `subin`)
> **선행 박제**: Phase 1~7 운영 반영 / Phase 7 v2.27 sync 진행 중일 가능성
> **본 의뢰**: v2.28 sync (1 회) + Phase 8C 운영 박제 8 PR Auto Chain = **총 9 작업 1 session**
> **★ 특수**: 3 측 stakeholder / Phase 6.2 BU2 토스 위젯 답습 / VU3 통합 wizard (booking+payment-fail+checkin)

---

## 1. 한 줄 요약

`uploads/BDR v2 (6)-66aa7eed.zip` (v2.28 · Phase 8 박제) sync → Phase 8C 운영 박제 8 PR auto chain → subin push.

---

## 2. 사전 점검 (1 회 결재)

```
□ git checkout subin && git pull origin subin
□ dev → subin 머지 동기화
□ uploads/ 안 BDR v2 (6)-66aa7eed.zip = Phase 8 박제 (v2.28) 확인
□ Phase 7 sync 완료 여부 (안 됐으면 v2.27+v2.28 통합 sync = v2.28 superset)
□ phase-ledger Phase 7 / Phase 8 entry 갱신 필요
```

→ 결재 후 진행.

---

## 3. 1단계 — v2.28 sync (~5분)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (6)-66aa7eed.zip"
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.28" -DryRun
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.28"
```

**검수** — Phase 7 답습 + Phase 8 특수 4 (court-shared.jsx + .css 신규 / Courts + CourtDetail + CourtBooking + VenueDetail + PartnerAdmin + PartnerVenue + PartnerCampaigns + AdminCourtsPartners 8 jsx / Phase 1~7 carry diff 0 / 3 측 stakeholder + 2 측 badge).

phase-ledger Phase 7/8 ⑩ ✅ + commit `design: BDR-current sync v2.28 (Phase 8 코트·장소 8)`.

---

## 4. 2단계 — Phase 8C 운영 박제 8 PR (Auto Chain)

### 자동 결재 default
- **VU3 토스 위젯 = Phase 6.2 BU2 실연결 답습** (mock 0)
- **2 측 badge** = Court Operator (navy+silver) vs Site Operator (dark+gold)
- 옛 박제 carry-over: VU1 Phase 3 v2 / VU2 v3 / VU4 v2.2 (큰 시각 변경 ❌)
- Phase 4 OA1 + Phase 6.1 PA1 + Phase 6.2 BA1 모달 답습

### PR 순서 (LOC 작은 → 큰)

| PR | 시안 | 운영 LOC | 핵심 |
|----|------|---------|------|
| 8C-1 | VP1 PartnerAdmin (77) | /partner-admin (205) | BV4 Court Operator hub |
| 8C-2 | VU4 VenueDetail 보강 (124) | /venues/[slug] (552 · v2.2 carry) | BV8 cross-domain venue 안 코트 link |
| 8C-3 | VP2 PartnerVenue (130) | /partner-admin/venue (259) | BV5 4 sub-tab (Phase 4 OO2 답습) |
| 8C-4 | VP3 PartnerCampaigns (134) | /partner-admin/campaigns + [id] (721) | BV6 캠페인 통합 |
| 8C-5 | VU1 Courts 보강 (?) | /courts (153 · Phase 3 v2 carry) | BV1 발견성 + 즐겨찾기 + 앰배서더 |
| 8C-6 | VA1 AdminCourtsPartners (197) | /admin/courts + /admin/partners (132+279=411) | BV7 Site Operator 통합 4 탭 |
| 8C-7 | VU2 CourtDetail 보강 (244) | /courts/[id] (323 · v3 carry) | BV3 5항목 평균 + 신고/편집 모달 |
| 8C-8 | VU3 CourtBooking 통합 (195 · 가장 큰 wizard) | /booking + payment-fail + checkin (574) | BV2 ★★★★★ 3-step + 토스 BU2 + court_checkins |

### 매 PR 박제 절차 (Phase 7C 답습)
1. `git pull origin subin`
2. BDR-current/screens/<시안>.jsx + court-shared 읽기
3. 운영 라우트 박제 (옛 박제 carry-over · 보강 시각만)
4. dev:3001 / lint / tsc
5. 자체 회귀 6 케이스 + Phase 8 특수
6. commit `design(8C-N): <시안> v2.28 박제 (BV<#>)`
7. push + GitHub PR
8. phase-ledger Phase 8 ⑪ 갱신 + 1 줄 보고 → 다음

### 양측 의존 검증 (박제 마지막)
- BV1: VU1 즐겨찾기 = user_favorite_courts / 앰배서더 = court_ambassadors
- BV2: VU3 토스 위젯 = Phase 6.2 BU2 동일 컴포넌트 / court_bookings + court_checkins
- BV3: VU2 v3 = court_reviews 5항목 + court_reports + court_edit_suggestions
- BV4~BV7: 파트너+super-admin = Phase 4 OO2/OA1 + Phase 6.1 PA1 답습
- BV8: 데이터 source = Phase 1 venue / Phase 2 court_id / Phase 5 랭킹 / Phase 6.2 BU4 동일

---

## 5. Stop Conditions

```
❌ lint / tsc 실패  ❌ 회귀 6 위반  ❌ DB schema  ❌ /api/v1  ❌ LOC>+2000
❌ 토스 위젯 mock 사용 (Phase 6.2 BU2 동일 위젯 재사용)
❌ 옛 박제 (Phase 3 v2 / v3 / v2.2) 큰 시각 변경
❌ 2 측 badge 시각 통합 (Court Operator vs Site Operator 분리)
```

---

## 6. 산출물 (chain 끝)

```
1. v2.28 sync commit + push
2. 8C-1~8 = 8 PR push + GitHub PR 링크
3. phase-ledger Phase 7/8 ⑩ ⑪ ⑫ ✅ 갱신
4. scratchpad 작업 로그 8 줄
```

---

## 7. 시작 — 한 줄

```
Read Dev/design/prompts/phase-8-auto-chain-cli-prompt-2026-06-07.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용. stop conditions 발동 시만 보고.
```

---

**의뢰서 끝.** sync 1 + Phase 8C 8 PR = 1 session.
