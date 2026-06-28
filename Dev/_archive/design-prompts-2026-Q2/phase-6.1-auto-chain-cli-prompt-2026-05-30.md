# Phase 6.1 — sync + Auto Chain (간단 의뢰서)

> **수신**: Claude CLI (mybdr, `subin`)
> **선행 박제**: Phase 1~5 운영 반영 완료 + Phase 5 박제 v2.23 도착
> **본 의뢰**: v2.24 sync (1 회) + Phase 6.1C 운영 박제 6 PR Auto Chain = **총 7 작업 1 session**

---

## 1. 한 줄 요약

`uploads/BDR v2 (1).zip` (v2.24 · Phase 6.1 박제 결과) sync → Phase 6.1C 운영 박제 6 PR 자동 chain → subin push → 사용자 PR 결재.

---

## 2. 사전 점검 (1 회 결재)

```
□ git checkout subin && git pull origin subin
□ dev → subin 머지 동기화 (Phase 5C 머지 commit 있을 시 동기화)
□ uploads/ 안 BDR v2 (1).zip = Phase 6.1 박제 결과 (BDR v2.24) 확인
□ Phase 5 sync 완료 여부 확인 (안 됐으면 v2.23 + v2.24 통합 sync = v2.24 superset 활용)
□ phase-ledger Phase 5 ✅ / Phase 6 entry 신규 추가 필요
```

→ 결과 요약 → **"OK 시작?" 1 회 결재**.

---

## 3. 1단계 — v2.24 sync (~5분)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (1).zip"
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.24" -DryRun
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.24"
```

**검수** (Phase 5 답습 + Phase 6.1 특수):
- 기본 12 + Phase 2/3/4/5 특수 + **Phase 6.1 특수 4** (profile-shared.jsx + .css 신규 / ProfileMain/Edit/Basketball/Achievements/UserPublicProfile/AdminUsers 6 jsx / Phase 1~5 carry-over diff 0 / publicView() privacy 함수 보존)
- ★ **v2.23 미sync 상태였으면 v2.24 가 superset** = Phase 5 + Phase 6.1 동시 처리

phase-ledger Phase 5/6.1 ⑩ ✅ 갱신 + commit `design: BDR-current sync v2.24 (Phase 6.1 프로필 본체 6 + Phase 5 carry)`.

---

## 4. 2단계 — Phase 6.1C 운영 박제 batch (6 PR · Auto Chain 패턴)

### 자동 결재 default
- sync 옵션 A / Phase 4 OA1 답습 (PA1 모달) / BP1 privacy 분기 publicView() / BP2 cross-domain mock 0 (운영 데이터 없으면 hide) / 결제 섹션 (PU2 보강) = Phase 6.2 link out + "준비 중"
- 금지(stop): `/api/v1` · DB schema · LOC>+2000 · tsc 실패 · 회귀 6 위반 · 13 룰 위반 · mock 금지

### PR 순서 (LOC 작은 → 큰)

| PR | 시안 | 운영 | 핵심 |
|----|------|------|------|
| 6.1C-1 | PU4 ProfileAchievements (111 line) | /profile/achievements | user_badges grid + Phase 1A PA7 우승 자동 + Phase 2 MVP 누적 cross-domain |
| 6.1C-2 | PU1 ProfileMain 보강 (831 → 보강 +200) | /profile | BP6 UC1 활동 진입 + 카운트 동기화 + Phase 1~5 cross-domain |
| 6.1C-3 | PU2 ProfileEdit 보강 (1689 → 보강 +200) | /profile/edit | BP4 결제 섹션 link out + privacy 토글 명확화 |
| 6.1C-4 | PU3 ProfileBasketball 신규 (185) | /profile/basketball | BP2 ★★★★ 농구 캐릭터 + 5 stat 카드 + 8 preferred chip + 우승 |
| 6.1C-5 | PA1 AdminUsers 신규 (206 · super-admin) | /admin/users | BP5 Hero stat + 4 탭 + 모달 (Phase 4 OA1 답습) |
| 6.1C-6 | PU5 UserPublicProfile 신규 (176) | /users/[id] | BP1 ★★★★★ 공개 시야 (publicView 필터) + CTA + 본인 redirect |

### 매 PR 박제 절차 (Phase 5C 답습)
1. `git pull origin subin`
2. BDR-current/screens/<시안>.jsx + profile-shared 읽기
3. 운영 라우트 박제 (Phase 1~5 답습 패턴)
4. dev:3001 검증 / lint / tsc
5. 자체 회귀 6 케이스 검수
6. commit `design(6.1C-N): <시안> v2.24 박제 (BP<#>)`
7. push + GitHub PR
8. phase-ledger Phase 6.1 ⑪ 갱신 + 1 줄 보고 → 다음 PR

### 양측 의존 검증 (박제 마지막)
- BP1: PU1 (본인 시야) + PU5 (공개 시야) = 동일 User 데이터 / publicView() 필터 (이메일/연락처/결제 hide)
- BP2: PU3 시즌 stat = UserSeasonStat + Phase 2 final_mvp_user_id 30일 + Phase 3 Team.wins
- BP3: PU4 = user_badges + Phase 1A champion_team_id 자동 (captain_id=me 또는 team_members.user_id=me)
- BP4: PU2 결제 섹션 = Phase 6.2 link out + "준비 중"
- BP5: PA1 = Phase 4 OA1 답습 (Site Operator + 본인 자기 정지 가드)
- BP6: PU1 → UC1 (1575 line 누적) link / 카운트 동기화

---

## 5. Stop Conditions (1 건 발동 = chain 중단 + 보고)

```
❌ lint / tsc 실패  ❌ 회귀 6 위반  ❌ DB destructive  ❌ /api/v1 변경  ❌ LOC>+2000
❌ 시안 §1~§8 위반  ❌ 운영 데이터 부족 + hide 불가  ❌ sync 실패  ❌ git push 실패
❌ PU5 본인/공개 시야 분기 검증 실패 (publicView() 필터 불일치)
```

---

## 6. 산출물 (chain 끝)

```
1. v2.24 sync commit + push
2. 6.1C-1~6 = 6 PR push + GitHub PR 링크
3. phase-ledger Phase 5/6.1 ⑩ ⑪ ⑫ ✅ 갱신
4. scratchpad 작업 로그 6 줄
5. stop conditions 발동 list (있을 경우)
```

**chain 끝 후 사용자 액션**:
- 6 PR 일괄 머지 (subin → dev → main)
- Phase 6.2 (결제·구독·예약) Claude.ai 의뢰 진행

---

## 7. 시작 — 한 줄

```
Read Dev/design/prompts/phase-6.1-auto-chain-cli-prompt-2026-05-30.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용. stop conditions 발동 시만 보고.
```

---

**의뢰서 끝.** sync 1 + Phase 6.1C 박제 6 PR = 1 session chain.
