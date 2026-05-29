# 자동 Chain Master CLI 의뢰서 (잔여 CLI 작업 일괄 자동 진행)

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **작성일**: 2026-05-29
> **목적**: 수빈이 한 번 던지면 잔여 CLI 작업 모두 자동 chain 처리
> **선행 완료** (2026-05-29 기준):
>   - ✅ Phase 1A/1B Claude.ai 박제 + sync (v2.18/v2.19) — 완료
>   - ✅ Phase 1C 운영 박제 = 15/16 PR (PA3 SKIP) — 머지 완료
>   - ✅ Phase 2 (경기) Claude.ai 박제 + sync (v2.20) — 완료
>   - ✅ Phase 3 (팀) Claude.ai 박제 (v2.21) — sync ⏸
>   - ✅ Phase 4 (단체) Claude.ai 박제 (v2.22) — sync ⏸

---

## 1. 본 master prompt 의 chain 단계 (총 4 단계)

```
[1단계] v2.22 sync (Phase 3 + Phase 4 동시) — 의뢰서 = phase-4-v2.22-sync-cli-prompt
[2단계] Phase 2C 운영 박제 batch (사용자 결재 = 우선 진행) — 의뢰서 자동 작성
[3단계] Phase 3C 운영 박제 batch — 의뢰서 자동 작성
[4단계] Phase 4C 운영 박제 batch — 의뢰서 자동 작성
```

→ 한 session 내 4 단계 자동 chain. stop conditions 발동 시만 stop.

---

## 2. 사전 점검 (1 회만 — chain 시작 전)

```
□ git remote -v / fetch / 브랜치 = subin / .env / .env.local
□ Phase 1C 종료 확인 (15/16 PR 머지 완료)
□ PR-1C-10 PA3 = SKIP 상태 확인 (재설계 대기 / 본 chain 영향 0)
□ 미push 변경 = scratchpad.md / phase-ledger.md 외 = 0
□ BDR-current/ = v2.20 cumulative (Phase 2 sync 직후 / Phase 3/4 미반영)
□ uploads/ 안 BDR v2 (7).zip = Phase 4 박제 결과 도착 확인
```

→ 결과 요약 → **"이대로 4 단계 chain 시작해도 될까요?" 사용자 결재 1 회**.

승인 후 chain 진행. 중간 사용자 결재 = **모든 결재 default 자동 적용** (아래 §3 참조). stop conditions 발동 시만 pause.

---

## 3. 자동 결재 룰 (사용자 1 회 결재 후 default 자동 적용)

### 3-1. sync 옵션 결재 → 기본값 = 옵션 A

| Phase | 옵션 A | 옵션 B | 자동 |
|-------|--------|--------|------|
| v2.22 sync | 1 회 sync (v2.20→v2.22 점프) ⭐ | 2 회 sync (v2.21 → v2.22 분리) | **A** |

### 3-2. PR 별 결재 → 기본값 = "PR 별 commit / 자동 진행 / PR 결재 사용자 일임"

- 각 PR 박제 → 자체 회귀 검수 6/6 PASS → commit + push + GitHub PR 생성
- PR 결재 (subin → dev → main) = 수빈 본인 / batch 끝 후 일괄 처리

### 3-3. 사용자 결정 옵션 (Phase 1C-4 §4 같은 항목)

| Phase | 옵션 항목 | 기본값 |
|-------|---------|-------|
| Phase 2C | (있을 경우) 결제 / 토스페이먼츠 미연결 = 시각 박제 + disabled | **옵션 B 보수** |
| Phase 3C | TA2 라우트 옵션 = 모달 vs 신규 라우트 | **옵션 A 모달** |
| Phase 4C | OO2 6 sub-tab 순서 / OO3 마법사 3-step | **Q1~Q4 lock 답습** |
| 그 외 | (각 항목 발생 시) | 권장값 자동 / 권장값 없을 시 stop |

### 3-4. Stop Conditions (★ 1 건이라도 발동 시 chain 중단 + 사용자 보고)

```
❌ lint 또는 npx tsc --noEmit 실패
❌ 자체 회귀 검수 6 케이스 1 건 이상 위반
❌ DB destructive SQL 필요 (DROP/TRUNCATE/대량 DELETE/UPDATE)
❌ 새 API 라우트 / 새 Prisma query / 새 fetch 필요
❌ 시안 사용자 결정 §1~§8 위반
❌ 운영 데이터 부족 + 카드 hide 대응 불가
❌ 권장 default 가 없는 신규 결재 항목 발생
❌ sync-bdr-current.ps1 실행 실패 / pre-snapshot 검증 실패
❌ git push 실패 / PR 생성 실패
❌ 1 PR 박제 LOC > +2000 / 분할 필요 신호
```

→ 1 건 발동 = 즉시 stop / 진행된 단계 commit/push 유지 / 잔여 단계 보류 + 사용자 보고.

---

## 4. 1단계 — v2.22 sync (Phase 3 + 4 동시)

### 4-1. 실행

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (7).zip"

.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.22" -DryRun
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.22"
```

### 4-2. 검수 16 케이스 (`phase-4-v2.22-sync-cli-prompt-2026-05-28.md` §4 답습)

기본 12 + Phase 2 특수 4 + Phase 3 특수 4 + Phase 4 특수 4 — 모두 PASS 필수.

### 4-3. phase-ledger 갱신

```
| ⑩ sync 실행 | 3A + 3B | ✅ 완료 | CLI | 2026-05-29 | v2.22 sync 안에 v2.21 carry-over 동시 처리 |
| ⑩ sync 실행 | 4A + 4B | ✅ 완료 | CLI | 2026-05-29 | v2.22 sync 독립 — 4 가정 lock Q1~Q4 commit |
```

### 4-4. commit + push

```bash
git add Dev/design/ .claude/phase-ledger.md
git commit -m "design: BDR-current sync v2.22 (Phase 3+4 동시)

- Phase 3 (팀 7) + Phase 4 (단체 8) cumulative
- team-shared + org-shared 신규
- 4 가정 lock Q1~Q4 commit
- Phase 1A/1B/2 carry-over 0
- 회귀 검수 16 케이스 통과
- phase-ledger Phase 3 ⑩ + Phase 4 ⑩ ✅"

git push origin subin
```

→ **1단계 끝 = 2단계 (Phase 2C) 진입**.

---

## 5. 2단계 — Phase 2C 운영 박제 batch (사용자 결재 = "우선 진행")

### 5-1. kickoff (Phase 1C batch 답습 패턴)

**대상 시안**:
- UD1 AdminGames (BG1 알림 모달 + BG5 출처 컬럼)
- UD2 AdminGameReports (BG2 매너 통계)
- UA1 Games (BG7 sticky + BG4 종료 카드)
- UA2 GameDetail (BG1 step indicator)
- UA3 CreateGame (BG5 자동 승인)
- UA4 GuestApply (BG3 자동 채우기)
- UA5 Live (BG7 분기 + 다음 경기)
- UB1 GameResult (status='completed' variant 신규)
- UC1 MyActivity 보강 (BG6 + BG2)
- UC2 Home 보강 (BG7 sticky)

= **10 PR** (PR-2C-1 ~ PR-2C-10).

### 5-2. PR 순서 (LOC 작은 → 큰)

```
PR-2C-1  UC2 Home 보강 (133 line → 보강 부분)
PR-2C-2  UA1 Games (154 line)
PR-2C-3  UC1 MyActivity 보강 (BG6 + BG2)
PR-2C-4  UA5 Live (185 line)
PR-2C-5  UA3 CreateGame (211 line)
PR-2C-6  UA4 GuestApply (137 line)
PR-2C-7  UA2 GameDetail (223 line)
PR-2C-8  UB1 GameResult (167 · status 분기 신규)
PR-2C-9  UD1 AdminGames (295 · 관리자)
PR-2C-10 UD2 AdminGameReports (327 · 매너 통계)
```

### 5-3. 매 PR 박제 절차 (Phase 1C batch 답습)

```
1. git checkout subin && git pull
2. BDR-current/screens/<시안>.jsx + css 읽기
3. 운영 라우트 박제 (Phase 1C 패턴 답습)
4. dev:3001 검증
5. lint + tsc
6. 자체 회귀 6 케이스 검수
7. commit "design(2C-N): <시안> v2.20 박제 (BG<#>)"
8. push + GitHub PR
9. phase-ledger Phase 2 ⑪ 갱신
10. 매 PR 후 1 줄 보고 → 다음 PR 진행
```

### 5-4. 양측 의존 검증 (박제 마지막 단계)

```
BG1: UA2 step indicator row = UC1 "내 경기" 단계 = UD1 큐 row = game_applications.status 동일
BG2: UC1 "내 매너" 평균 + flags = UD2 매너 통계 = 평균 + flag 종류만 (개별 건수 ❌)
BG4: UB1 status='completed' = UA1 종료 카드 MVP = games.final_mvp_user_id 동일
BG7: UC2 Home + UA1 Games sticky = 동일 LiveChipRow 컴포넌트 (game-shared.jsx)
```

→ **2단계 끝 = 3단계 (Phase 3C) 진입**.

---

## 6. 3단계 — Phase 3C 운영 박제 batch (팀 영역)

### 6-1. 대상 시안 7

```
PR-3C-1  TU3 TeamManage hub (113 line · /teams/manage)
PR-3C-2  TU1 Teams 보강 (97 line · /teams)
PR-3C-3  TU5 MyActivity 보강 (277 line · "내 팀" 섹션)
PR-3C-4  TU2 TeamDetail 보강 (384 line · /teams/[id])
PR-3C-5  TU4 TeamManageDetail (378 · /teams/[id]/manage · 6 sub-tab 통합)
PR-3C-6  TA1 + TA2 AdminTeams (380 · /admin/teams · 모달 통합)
```

= **6 PR**.

### 6-2. 양측 의존 검증

```
BT1: TU4 큐 = TU5 "내 신청" 단계 = team_join_requests.status
BT2: TU4 변경 = TU5 "내 변경 신청" = TeamMemberRequest.status
BT3: TU4 유령 후보 = TU5 "휴면 예정" = TeamMember.last_activity_at 3 개월
BT4: TU4 권한 위임 = TU2 sidebar "내 권한" = TeamOfficerPermissions
BT6: TU2 stats = TA1 통계 = wins/losses/draws 동일
BT7: TU2 sidebar "운영 액션" → Phase 1/2 cross-domain
```

→ **3단계 끝 = 4단계 (Phase 4C) 진입**.

---

## 7. 4단계 — Phase 4C 운영 박제 batch (단체 영역)

### 7-1. 대상 시안 8

```
PR-4C-1  OU1 Organizations list 보강 (135 · /organizations)
PR-4C-2  OU2 OrganizationDetail 보강 (332 · /organizations/[slug])
PR-4C-3  OU3 OrganizationApply 신규 (291 · /organizations/apply · 5-step)
PR-4C-4  OU4 Series (269 · /series/* · 위계)
PR-4C-5  OA1 AdminOrganizations 보강 (300 · /admin/organizations · Site Operator)
PR-4C-6  OO1 OrgAdmin (176 · /tournament-admin/organizations + /new)
PR-4C-7  OO3 SeriesAdmin (376 · /tournament-admin/series/* · 5 page)
PR-4C-8  OO2 OrgAdminDetail (443 · /tournament-admin/organizations/[orgId] · 6 sub-tab)
```

= **8 PR**.

### 7-2. 4 가정 lock (Q1~Q4) 운영 박제 시 보존

```
Q1 Series Operator badge = navy(#1B3C87)+silver 토큰
Q2 OO2 6 sub-tab 순서 = basic→members→series→editions→officers→activity
Q3 OO3 3-step = 기본 / 설명·로고·정기성 / 검토+첫 회차
Q4 OU3 5-step = 단체 기본 / 활동 지역·공개 / 연락 / 검토 메모 / 검토+제출
```

### 7-3. 양측 의존 검증

```
BO1: OU3 신청 form = OA1 모달 동일 organizations 컬럼 (name/description/region/contact_email/website_url/apply_note)
BO2: OU2 events + OU4 = OO2 series-tab = OrgHierarchyCrumbs 공용 컴포넌트
BO3: OO2 멤버 = organization_members.role (owner/admin/member)
BO5: OA1 활성/정지/해산 = organizations.status (pending/approved/rejected/archived)
```

→ **4단계 끝 = chain 완료**.

---

## 8. 최종 산출물 (CLI → 사용자, chain 끝)

```
1. v2.22 sync 결과 commit + push (Phase 3 + 4 동시)
2. Phase 2C 운영 박제 = 10 PR push + GitHub PR 링크 list
3. Phase 3C 운영 박제 = 6 PR push + GitHub PR 링크 list
4. Phase 4C 운영 박제 = 8 PR push + GitHub PR 링크 list
5. phase-ledger Phase 2/3/4 ⑪ ⑫ ⑭ ✅ 갱신
6. .claude/scratchpad.md = chain 작업 로그
7. 미push commit 알림 = 0 (모두 push 완료)
8. stop conditions 발동 PR list (있을 경우) + 미박제 PR + 사용자 결재 대기 항목
```

**최종 status table**:
```
| Phase | PR # | 시안 | 상태 | commit | 검수 |
|-------|------|------|------|--------|------|
| 2C-1  | #XXX | UC2  | ✅   | <hash> | 6/6  |
| 2C-2  | #XXX | UA1  | ✅   | <hash> | 6/6  |
| ...   | ...  | ...  | ...  | ...    | ...  |
| 4C-8  | #XXX | OO2  | ✅   | <hash> | 6/6  |
```

**예상 PR 수 = v2.22 sync commit 1 + Phase 2C 10 + 3C 6 + 4C 8 = 25 PR**.

---

## 9. 사용자 (수빈) 의 최소 액션

### chain 시작 시 (1 회)
```
☐ 본 prompt CLI 에 전달
☐ §2 사전 점검 결재 (1 회 — "이대로 시작 OK")
```

### chain 진행 중 — 결재 0 (자동 default 적용)
```
☐ stop conditions 발동 시만 pause / 사용자 보고 후 결정
```

### chain 끝 후
```
☐ 25 PR subin → dev → main 결재 (CLAUDE.md §🚦)
☐ Phase 5 영역 결재 (다음 영역 결정)
☐ PR-1C-10 PA3 재설계 결정 (보류 중)
```

---

## 10. 결재 후 CLI 다음 한 줄 응답 형식

```
✅ Auto Chain Master 의뢰 확인 — 잔여 4 단계 자동 chain

이해: [1] v2.22 sync (Phase 3+4) → [2] Phase 2C 10 PR → [3] Phase 3C 6 PR → [4] Phase 4C 8 PR = 총 25 PR / 1 session.
자동 결재 default = sync 옵션 A / 결제 옵션 B / 라우트 옵션 A / Q1~Q4 lock 답습.
Stop conditions 10 종 발동 시 즉시 중단.

사전 점검 1 회 시작. 결재 받기 전 chain ❌.
```

---

## 11. 시작 — CLI 에 한 줄로 전달

```
Read Dev/design/prompts/auto-chain-master-cli-prompt-2026-05-29.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용. stop conditions 발동 시만 보고.
```

---

**의뢰서 끝.** 본 chain 1 session 으로 v2.22 sync + Phase 2C/3C/4C 운영 박제 = 25 PR 완수.

---

## 부록 A — Cowork 측 자동 모니터링 (별 scheduled task)

본 master prompt 와 별개로 **Cowork scheduled task** 가 매일 진행 상태 점검 + 자동 의뢰서 작성 (chain 끝 후 Phase 5 진입 자동 준비).

→ 별 scheduled task 등록 안내 (다른 메시지).

CLI 작업 = 본 chain prompt. Cowork 작업 = scheduled task. 분리 운영.
