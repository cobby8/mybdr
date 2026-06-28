# Phase 9 — sync + Auto Chain (간단 의뢰서)

> **수신**: Claude CLI (mybdr, `subin`)
> **본 의뢰**: v2.29 sync (1 회) + Phase 9C 4 PR Auto Chain = **총 5 작업 1 session**

---

## 1. 한 줄 요약

`uploads/BDR v2 (7)-9faaa137.zip` (v2.29 · Phase 9 박제) sync → Phase 9C 4 PR auto chain → subin push.

---

## 2. 사전 점검 (1 회 결재)

```
□ git checkout subin && git pull origin subin / dev → subin 머지 동기화
□ uploads/ 안 BDR v2 (7)-9faaa137.zip = Phase 9 박제 (v2.29) 확인
□ Phase 8 sync 완료 여부 (안 됐으면 v2.28+v2.29 통합 sync = v2.29 superset)
□ phase-ledger Phase 8/9 갱신 필요
```

---

## 3. 1단계 — v2.29 sync (~5분)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (7)-9faaa137.zip"
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.29" -DryRun
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.29"
```

**검수** — Phase 8 답습 + Phase 9 특수 (notify-shared.jsx + .css 신규 / Notifications + Messages + Search + AdminNotifications 4 jsx / Phase 1~8 carry diff 0).

phase-ledger Phase 8/9 ⑩ ✅ + commit.

---

## 4. 2단계 — Phase 9C 운영 박제 4 PR

### 자동 결재 default
- NU2 = DB 미지원 carry / "준비 중" 유지 / mock 더미 carry (messages 모델 신설 ❌ / 운영 지침)
- NU3 = 카테고리 chip = Phase 1~8 cross-domain link
- NA1 = Phase 4 OA1 + Phase 6.1 PA1 + Phase 6.2 BA1 + Phase 8 VA1 답습 (Site Operator)

### PR 순서

| PR | 시안 | 운영 LOC | 핵심 |
|----|------|---------|------|
| 9C-1 | NU1 Notifications 보강 (92) | /notifications (96) | BN1 카테고리 chip + main bar 카운트 동기화 |
| 9C-2 | NU3 Search 보강 carry (94) | /search (261) | BN3 카테고리 chip Phase 1~8 cross-domain |
| 9C-3 | NU2 Messages 보강 carry (121) | /messages (655) | BN2 DB 미지원 carry / "준비 중" warn-soft / mock 더미 |
| 9C-4 | NA1 AdminNotifications 신규 (160) | /admin/notifications (251) | BN4 발송 form (target 4종) + 이력 + 모달 (Site Operator) |

### 매 PR 박제 절차 (Phase 8C 답습)
1. `git pull origin subin`
2. BDR-current/screens/<시안>.jsx + notify-shared 읽기
3. 운영 라우트 박제 (보강 / carry-over)
4. dev:3001 / lint / tsc
5. 자체 회귀 6 + Phase 9 특수
6. commit `design(9C-N): <시안> v2.29 박제 (BN<#>)`
7. push + GitHub PR
8. phase-ledger Phase 9 ⑪ + 1 줄 보고 → 다음

### 양측 의존 검증
- BN1: NU1 카운트 = main bar 카운트 = notifications.* 미읽음 (전 Phase)
- BN3: NU3 카테고리별 결과 → Phase 1~5/8 list 진입 link
- BN4: NA1 발송 → NU1 수신 (notifications.* 표시)

---

## 5. Stop Conditions

```
❌ lint / tsc 실패  ❌ 회귀 6 위반  ❌ DB schema / messages 모델 신설  ❌ /api/v1  ❌ LOC>+2000
❌ NU2 mock 더미 변경 (DB 0% 운영 지침)
❌ "준비 중" warn-soft tone 누락
```

---

## 6. 산출물

```
1. v2.29 sync commit + push
2. 9C-1~4 = 4 PR push + GitHub PR 링크
3. phase-ledger Phase 8/9 ⑩ ⑪ ⑫ ✅
```

---

## 7. 시작 — 한 줄

```
Read Dev/design/prompts/phase-9-auto-chain-cli-prompt-2026-06-07.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용.
```

---

**의뢰서 끝.**
