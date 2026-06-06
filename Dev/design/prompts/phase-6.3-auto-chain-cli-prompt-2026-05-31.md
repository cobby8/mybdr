# Phase 6.3 — sync + Auto Chain (간단 의뢰서)

> **수신**: Claude CLI (mybdr, `subin`)
> **선행 박제**: Phase 1~6.2 운영 반영 / Phase 6.2 박제 v2.25 sync 진행 중일 가능성
> **본 의뢰**: v2.26 sync (1 회) + Phase 6.3C 운영 박제 3 PR = **총 4 작업 1 session**
> **★ Phase 6 묶음 종료**: 본 chain 완료 시 Phase 6.1+6.2+6.3 = **16 시안 모두 운영 박제 완료**

---

## 1. 한 줄 요약

`uploads/BDR v2 (3)-d38fc77d.zip` (v2.26 · Phase 6.3 박제) sync → Phase 6.3C 운영 박제 3 PR (모두 보강 의뢰) auto chain → subin push → Phase 6 묶음 종료.

---

## 2. 사전 점검 (1 회 결재)

```
□ git checkout subin && git pull origin subin
□ dev → subin 머지 동기화
□ uploads/ 안 BDR v2 (3)-d38fc77d.zip = Phase 6.3 박제 (v2.26) 확인
□ Phase 6.2 sync 완료 여부 (안 됐으면 v2.25 + v2.26 통합 sync = v2.26 superset 활용)
□ phase-ledger Phase 6.2 / Phase 6.3 entry 갱신 필요
```

→ 결과 요약 → **"OK 시작?" 1 회 결재**.

---

## 3. 1단계 — v2.26 sync (~5분)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (3)-d38fc77d.zip"
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.26" -DryRun
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.26"
```

**검수** — Phase 6.2 답습 + Phase 6.3 특수 4 (growth-shared.jsx + .css 신규 / ProfileGrowth + WeeklyReport + ProfileSettings 3 jsx / Phase 1~6.2 carry-over diff 0 / 옛 v2.2/v2.3/v2.4 박제 시안 ID 답습).

phase-ledger Phase 6.2/6.3 ⑩ ✅ 갱신 + commit `design: BDR-current sync v2.26 (Phase 6.3 마이페이지 후반부 3 + Phase 6 묶음 종료)`.

---

## 4. 2단계 — Phase 6.3C 운영 박제 3 PR (Auto Chain)

### 자동 결재 default
- 모두 보강만 (옛 v2 박제 carry-over) / 작은 시각 변경
- BG3 billing 섹션 link = Phase 6.2 BU3 박제 commit 후 자동 활성

### PR 순서

| PR | 시안 | 운영 LOC | 핵심 |
|----|------|---------|------|
| 6.3C-1 | GU2 WeeklyReport 보강 (122 line) | /profile/weekly-report (1125) | BG2 KPI 4 = PU3 시즌 stat 정합 + placeholder warn-soft 통일 + 이메일 구독 → GU3 link |
| 6.3C-2 | GU1 ProfileGrowth 보강 (124) | /profile/growth (835) | BG1 마일스톤 6 = PU4 user_badges 정합 (badge icon + 이름) / "준비 중" 라벨 통일 |
| 6.3C-3 | GU3 ProfileSettings 보강 (231) | /profile/settings (256) | BG3 billing 섹션 link 활성 (Phase 6.2 BU3 진입) + danger zone BDR Red + 2차 confirm + IdentityVerifyButton 강화 |

### 매 PR 박제 절차 (Phase 6.2C 답습)
1. `git pull origin subin`
2. BDR-current/screens/<시안>.jsx + growth-shared 읽기
3. 운영 라우트 박제 (보강만)
4. dev:3001 검증 / lint / tsc
5. 자체 회귀 6 케이스 검수
6. commit `design(6.3C-N): <시안> v2.26 보강 박제 (BG<#>)`
7. push + GitHub PR
8. phase-ledger Phase 6.3 ⑪ 갱신 + 1 줄 보고 → 다음 PR

### 양측 의존 검증 (박제 마지막)
- BG1: GU1 마일스톤 = PU4 user_badges 동일 시각 (badge icon)
- BG2: GU2 KPI 4 = PU3 시즌 stat 동일 컬럼 (UserSeasonStat)
- BG3: GU3 billing 섹션 = BU3 ProfileBilling link 활성 + 미리보기 (현재 plan + 다음 결제일)

---

## 5. Stop Conditions

기본 + Phase 6.3 특수:
```
❌ lint / tsc 실패  ❌ 회귀 6 위반  ❌ DB schema  ❌ /api/v1  ❌ LOC>+2000
❌ 옛 박제 v2.2/v2.3/v2.4 큰 시각 변경 (보강만 / 답습)
❌ DB 미지원 placeholder 누락 ("준비 중" 라벨 통일)
```

---

## 6. 산출물 (chain 끝)

```
1. v2.26 sync commit + push
2. 6.3C-1~3 = 3 PR push + GitHub PR 링크
3. phase-ledger Phase 6.2/6.3 ⑩ ⑪ ⑫ + ⑭ ✅ 갱신 → Phase 6 묶음 완료
4. scratchpad 작업 로그 3 줄
```

→ **Phase 6 묶음 = 16 시안 모두 운영 박제 완료** 후 사용자 일괄 머지.

---

## 7. 시작 — 한 줄

```
Read Dev/design/prompts/phase-6.3-auto-chain-cli-prompt-2026-05-31.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용. stop conditions 발동 시만 보고.
```

---

**의뢰서 끝.** sync 1 + Phase 6.3C 3 PR = Phase 6 묶음 16 시안 종료.
