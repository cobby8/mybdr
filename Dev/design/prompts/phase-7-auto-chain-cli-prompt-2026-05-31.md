# Phase 7 — sync + Auto Chain (간단 의뢰서)

> **수신**: Claude CLI (mybdr, `subin`)
> **선행 박제**: Phase 1~6 운영 반영 / Phase 6.3 박제 v2.26 sync 진행 중일 가능성
> **본 의뢰**: v2.27 sync (1 회) + Phase 7C 운영 박제 4 PR Auto Chain = **총 5 작업 1 session**
> **★ 특수**: Phase 7 시안 = **AppNav 미적용 standalone** (인증/온보딩 layout 특수)

---

## 1. 한 줄 요약

`uploads/BDR v2 (5)-f91d2079.zip` (v2.27 · Phase 7 박제) sync → Phase 7C 운영 박제 4 PR auto chain → subin push → 사용자 PR 결재.

---

## 2. 사전 점검 (1 회 결재)

```
□ git checkout subin && git pull origin subin
□ dev → subin 머지 동기화
□ uploads/ 안 BDR v2 (5)-f91d2079.zip = Phase 7 박제 (v2.27) 확인
□ Phase 6.3 sync 완료 여부 (안 됐으면 v2.26 + v2.27 통합 sync = v2.27 superset)
□ phase-ledger Phase 6.3 / Phase 7 entry 갱신 필요
```

→ 결과 요약 → **"OK 시작?" 1 회 결재**.

---

## 3. 1단계 — v2.27 sync (~5분)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (5)-f91d2079.zip"
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.27" -DryRun
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.27"
```

**검수** — Phase 6.3 답습 + Phase 7 특수 4:
- auth-shared.jsx + .css 신규 / LoginSignup + Onboarding + PasswordRecovery + Verify 4 jsx / Phase 1~6.3 carry-over diff 0 / **AppNav 미적용 standalone layout 가드**

phase-ledger Phase 6.3/7 ⑩ ✅ + commit `design: BDR-current sync v2.27 (Phase 7 인증·온보딩 4)`.

---

## 4. 2단계 — Phase 7C 운영 박제 4 PR (Auto Chain)

### 자동 결재 default
- AppNav **미적용** (인증/온보딩 standalone layout 유지) — `(web)` group 외 별 layout
- OAuth provider 운영 확인 = Kakao/Google/Naver/Apple 중 활성 provider 만 시각 / 없으면 hide
- IdentityVerifyButton Phase 12-5 mock 재사용 (운영 변경 ❌)
- Phase 10-5 server wrapper + onboarding_completed_at 가드 carry-over
- 강도 미터 5단계 색 (err→warn→ok)

### PR 순서 (LOC 작은 → 큰)

| PR | 시안 | 운영 LOC | 핵심 |
|----|------|---------|------|
| 7C-1 | AU1 LoginSignup (91 line) | /login (549) + /signup (311) = 860 | BA1 OAuth 4 카드 + 통합 시각 + cross link / **AppNav 미적용** |
| 7C-2 | AU3 PasswordRecovery (102) | /forgot-password (164) + /reset-password (449) | BA3 forgot 신규 + reset 강도 미터 carry / **AppNav 미적용** |
| 7C-3 | AU4 Verify 보강 (127) | /verify (438 · 옛 v2(1)) | BA4+BA5 verified 결과 카드 + Phase 6.1/6.3 IdentityVerifyButton 정합 |
| 7C-4 | AU2 Onboarding 5-step (150 · 가장 큰 wizard) | /onboarding/* (433 · 5 sub) | BA2 5-step stepper / Phase 12-5 IdentityVerifyButton 재사용 / **standalone layout** |

### 매 PR 박제 절차 (Phase 6.3C 답습)
1. `git pull origin subin`
2. BDR-current/screens/<시안>.jsx + auth-shared 읽기
3. 운영 라우트 박제 + **AppNav 미적용 standalone layout 검증**
4. dev:3001 검증 / lint / tsc
5. 자체 회귀 6 케이스 + Phase 7 특수 (AppNav 0)
6. commit `design(7C-N): <시안> v2.27 박제 (BA<#>)`
7. push + GitHub PR
8. phase-ledger Phase 7 ⑪ 갱신 + 1 줄 보고 → 다음 PR

### 양측 의존 검증 (박제 마지막)
- BA1: AU1 OAuth 4 카드 = 활성 provider 만 (운영 확인 후 hide 처리)
- BA2: AU2 5 step indicator = UA3/OU3 답습 / IdentityVerifyButton mock 재사용
- BA3: AU3 forgot 신규 + reset 옛 v2(1) carry / 강도 미터 5단계 색
- BA4: AU4 verified_name/phone/birth 결과 카드 + cross-domain link
- BA5: PU2 + GU3 IdentityVerifyButton success badge 자동 (verified 후)

---

## 5. Stop Conditions

기본 + Phase 7 특수:
```
❌ lint / tsc 실패  ❌ 회귀 6 위반  ❌ DB schema  ❌ /api/v1  ❌ LOC>+2000
❌ AppNav 적용 (인증/온보딩 = standalone 유지)
❌ Phase 10-5 server wrapper + onboarding_completed_at 가드 변경
❌ Phase 12-5 IdentityVerifyButton mock 변경 (Portone 통합 = 본 의뢰 외)
```

---

## 6. 산출물 (chain 끝)

```
1. v2.27 sync commit + push
2. 7C-1~4 = 4 PR push + GitHub PR 링크
3. phase-ledger Phase 6.3/7 ⑩ ⑪ ⑫ ✅ 갱신
4. scratchpad 작업 로그 4 줄
```

→ Phase 7 4 시안 운영 박제 완료. Phase 8 영역 결재 진행.

---

## 7. 시작 — 한 줄

```
Read Dev/design/prompts/phase-7-auto-chain-cli-prompt-2026-05-31.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용. stop conditions 발동 시만 보고.
```

---

**의뢰서 끝.** sync 1 + Phase 7C 4 PR = 1 session.
