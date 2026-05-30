# Phase 5 — sync + Auto Chain (간단 의뢰서)

> **수신**: Claude CLI (mybdr, `subin`)
> **선행 박제**: Phase 1~4 = 운영 반영 완료 (#654/#655 / 운영 `6f22c02`)
> **본 의뢰**: v2.23 sync (1 회) + Phase 5C 운영 박제 batch (6 PR) = **총 7 작업 1 session chain**

---

## 1. 한 줄 요약

`uploads/BDR v2.zip` (v2.23 · Phase 5 박제 결과) sync → Phase 5C 운영 박제 6 PR 자동 chain → subin push → 사용자 PR 결재.

---

## 2. 사전 점검 (1 회 결재)

```
□ git checkout subin && git pull origin subin
□ dev → subin 머지 동기화 (main merge commit #655 반영)
□ uploads/ 안 BDR v2.zip = Phase 5 박제 결과 (BDR v2.23) 확인
□ phase-ledger Phase 1~4 ✅ 종료 / Phase 5 entry 신규 추가 필요
```

→ 결과 요약 → **"OK 시작?" 1 회 결재**.

---

## 3. 1단계 — v2.23 sync (~5분)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2.zip"
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.23" -DryRun
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.23"
```

**검수** (Phase 4 답습 + Phase 5 특수):
- 4 frozen + 8 self + Phase 2/3/4 특수 + **Phase 5 특수 4 (comm-shared.jsx + .css 신규 / Rankings + CommunityList/Detail/New/Edit + AdminCommunity 6 jsx / Phase 1~4 carry-over diff 0 / 4 가정 lock A1~A4)**.

phase-ledger Phase 5 ⑩ ✅ 갱신 + commit `design: BDR-current sync v2.23 (Phase 5 랭킹·커뮤니티 6)`.

---

## 4. 2단계 — Phase 5C 운영 박제 batch (6 PR · Auto Chain 패턴)

### 자동 결재 default (Auto Chain 답습)
- sync 옵션 A / **댓글 = 운영 comments 모델 실제 사용** (A1 lock) / **신고 = hide** (A2 lock) / **카테고리 8종** (A3 lock) / **BC1 cross-domain mock 0** (A4 lock)
- 데이터 통합 = server 조회 + 새 `/api/web/*` 허용 / 금지(stop) = `/api/v1` · DB schema · LOC>+2000 · tsc 실패 · 회귀 6 위반 · 13 룰 위반

### PR 순서 (LOC 작은 → 큰)

| PR | 시안 | 운영 | 핵심 |
|----|------|------|------|
| 5C-1 | CU4 CommunityEdit (44 line · 가장 작음) | /community/[id]/edit | CU3 컴포넌트 재사용 + prefill |
| 5C-2 | CU1 CommunityList (122) | /community | BC2 카테고리 8 chip |
| 5C-3 | CU2 CommunityDetail (185) | /community/[id] | BC4 좋아요·댓글 + BC2 알기자 badge |
| 5C-4 | RU1 Rankings (190) | /rankings | BC1 MVP/wins cross-domain (Phase 2/3 데이터) + BC7 footer 출처 |
| 5C-5 | CA1 AdminCommunity (229 · super-admin) | /admin/community | Site Operator + Phase 4 OA1 답습 / 신고 탭 hide |
| 5C-6 | CU3 CommunityNew (290 · 가장 큰 5-step 마법사) | /community/new | Phase 1B UA3 + Phase 4 OU3 답습 / 사후 안내 hero + CTA |

### 매 PR 박제 절차 (Phase 4C 답습)
1. `git pull origin subin`
2. BDR-current/screens/<시안>.jsx + comm-shared/rank-shared 읽기
3. 운영 라우트 박제 (Phase 1~4 답습 패턴)
4. dev:3001 검증 / lint / tsc
5. 자체 회귀 6 케이스 검수
6. commit `design(5C-N): <시안> v2.23 박제 (BC<#>)`
7. push + GitHub PR
8. phase-ledger Phase 5 ⑪ 갱신 + 1 줄 보고 → 다음 PR

### 양측 의존 검증 (박제 마지막)
- BC1: RU1 MVP = Phase 2 `games.final_mvp_user_id` 30일 / 팀 wins = Phase 3 `Team.wins` 상위
- BC2: CU1/CU2 알기자 카테고리 = Phase 1A 대회 cross-domain link (badge)
- BC3: CU3 5-step = UA3/OU3 답습 (사후 안내 hero "게시되었습니다" + CTA)
- BC5: CU4 = CU3 동일 컴포넌트 (별 컴포넌트 ❌)
- BC6: CA1 = OA1 답습 (Site Operator)

---

## 5. Stop Conditions (1 건 발동 = chain 중단 + 보고)

```
❌ lint / tsc 실패  ❌ 회귀 6 위반  ❌ DB destructive  ❌ /api/v1 변경  ❌ LOC>+2000
❌ 시안 §1~§8 위반  ❌ 운영 데이터 부족 + hide 불가  ❌ sync 실패  ❌ git push 실패
```

---

## 6. 산출물 (chain 끝)

```
1. v2.23 sync commit + push
2. 5C-1~6 = 6 PR push + GitHub PR 링크
3. phase-ledger Phase 5 ⑩ ⑪ ⑫ ✅ 갱신
4. scratchpad 작업 로그 6 줄
5. stop conditions 발동 list (있을 경우)
```

**chain 끝 후 사용자 액션**:
- 6 PR 일괄 머지 (subin → dev → main · #654/#655 답습)
- Phase 6 영역 결재 (Cowork 가 별 의뢰)

---

## 7. 시작 — 한 줄

```
Read Dev/design/prompts/phase-5-auto-chain-cli-prompt-2026-05-30.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용. stop conditions 발동 시만 보고.
```

---

**의뢰서 끝.** sync 1 + Phase 5C 박제 6 PR = 1 session chain.
