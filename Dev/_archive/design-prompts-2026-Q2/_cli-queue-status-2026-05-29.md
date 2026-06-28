# CLI 작업 큐 — 2026-05-29 갱신 (Cowork 자동 점검)

> **목적**: 잔여 CLI 작업 한 눈에 보기 — 의뢰서 / 의존 / 권장 다음 액션
> **갱신 트리거**: Cowork scheduled task (`mybdr-progress-monitor`) — 매일 자동 점검
> **이전 큐**: `_cli-queue-status-2026-05-28.md` (Phase 4 박제 zip 도착 후 작성)

---

## 1. 변경 사항 (2026-05-28 → 2026-05-29)

```
✅ Phase 1C 운영 박제 종료 (15/16 PR · PA3 SKIP) → 머지 완료
✅ Phase 1 ⑭ Phase 완료 = 종료 (15/16)
✅ Phase 3 ⑩ sync (v2.22 안 cumulative) — 2026-05-29
✅ Phase 4 ⑩ sync (v2.22 독립 / 4 가정 lock Q1~Q4) — 2026-05-29
✅ auto-chain-master-cli-prompt-2026-05-29.md = 잔여 4 단계 chain master 의뢰서 작성됨
```

→ **본 큐 = auto-chain-master 단일 의뢰서로 통합**. 별 batch 의뢰서 (Phase 2C / 3C / 4C 분리) 작성 ❌ — chain master 안에 포함.

---

## 2. 현재 CLI 큐 — 1 건 (chain master)

| # | 의뢰서 | 영역 | 예상 시간 | 의존 | 산출 |
|---|--------|-----|---------|------|------|
| **A** | `auto-chain-master-cli-prompt-2026-05-29.md` ⭐ | **v2.22 sync + Phase 2C/3C/4C 운영 박제** | ~1 session | 독립 | 25 PR (v2.22 sync commit 1 + 2C 10 + 3C 6 + 4C 8) |

→ chain 안 4 단계 = [1] v2.22 sync (Phase 3+4 동시) → [2] Phase 2C 10 PR → [3] Phase 3C 6 PR → [4] Phase 4C 8 PR.

---

## 3. 즉시 시작 명령

```
Read Dev/design/prompts/auto-chain-master-cli-prompt-2026-05-29.md 하고 §2 사전 점검부터 시작해줘. 모든 결재 default 자동 적용. stop conditions 발동 시만 보고.
```

**자동 결재 default**: sync 옵션 A / 결제 옵션 B / 라우트 옵션 A / Q1~Q4 lock 답습 / PR 결재 batch 끝 후 일괄.

**Stop conditions 10 종** (어느 하나라도 발동 시 즉시 중단):
- lint / tsc 실패
- 자체 회귀 6 케이스 1 건 이상 위반
- DB destructive SQL 필요
- 새 API 라우트 / Prisma query / fetch 필요
- 시안 사용자 결정 §1~§8 위반
- 운영 데이터 부족 + 카드 hide 대응 불가
- 권장 default 없는 신규 결재 발생
- sync-bdr-current.ps1 실행 실패
- git push / PR 생성 실패
- 1 PR 박제 LOC > +2000

---

## 4. Phase 진행 점수판 (2026-05-29 갱신)

| Phase | 영역 | Claude.ai 박제 | sync | 운영 박제 | 완료 | 비고 |
|-------|------|--------------|------|---------|------|------|
| 1A | 대회 관리자 (10) | ✅ v2.19 | ✅ 2026-05-26 | ✅ Phase 1C 종료 | ✅ | PA3 SKIP 1건 잔존 (재설계 대기) |
| 1B | 대회 사용자 (8) | ✅ v2.18 | ✅ 2026-05-26 | ✅ Phase 1C 종료 | ✅ | |
| 2 | 경기 (10) | ✅ v2.20 | ✅ 2026-05-28 | ⏸ chain 2단계 | ⏸ | chain master 안 PR-2C-1 ~ PR-2C-10 |
| 3 | 팀 (7) | ✅ v2.21 | ✅ 2026-05-29 | ⏸ chain 3단계 | ⏸ | chain master 안 PR-3C-1 ~ PR-3C-6 |
| 4 | 단체 (8) | ✅ v2.22 | ✅ 2026-05-29 | ⏸ chain 4단계 | ⏸ | chain master 안 PR-4C-1 ~ PR-4C-8 / Q1~Q4 lock |

→ **chain master 1 session 처리 시** = Phase 2/3/4 운영 박제 모두 완료 (25 PR).

---

## 5. chain 끝 후 다음 액션

```
□ 25 PR subin → dev → main 결재 (수빈 수동)
□ Phase 5 영역 결재 (다음 영역 선정)
   후보 = 코트·장소 / 알림·메시지·검색 / 프로필·마이페이지 / 랭킹·커뮤니티 / About·마케팅
□ PR-1C-10 PA3 재설계 결정 (보류 중 — planner 의 신규 기능 vs 리디자인 의도 확인)
```

---

## 6. 자동 점검 결과 (Cowork scheduled task — 2026-05-29 00:04 UTC)

```
[uploads 점검] ⚠️ 현재 세션에서 uploads/ 접근 불가
  - 원인: scheduled task session = local_062f0492 ≠ uploads session = local_eafa9aee
  - 신규 zip 도착 여부 = 수빈 본인 확인 필요
  - BDR v2 (7).zip = Phase 4 박제 결과 (의뢰서 §4-1 에 경로 명시됨)

[phase-ledger 점검] ✅ Phase 1 종료 / 2~4 sync 완료 / 2~4 운영 박제 ⏸

[의뢰서 점검] ✅ auto-chain-master 작성됨 = 잔여 작업 100% 커버
  - 별 batch 의뢰서 (2C/3C/4C 분리) 작성 ❌ = chain master 중복 회피

[다음 액션] auto-chain-master 1 session 처리 → 25 PR 박제 + sync 완료
```

---

**큐 끝.** 잔여 = chain master 1 건 처리만. 다음 점검 시 chain 진행 상태 갱신.
