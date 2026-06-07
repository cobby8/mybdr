# CLI 작업 큐 — 2026-05-31 갱신 (Cowork 자동 점검)

> **목적**: 잔여 CLI 작업 한 눈에 보기 — 의뢰서 / 의존 / 권장 다음 액션
> **갱신 트리거**: Cowork scheduled task (`mybdr-progress-monitor`) — 매일 자동 점검
> **이전 큐**: `_cli-queue-status-2026-05-30.md` (Phase 5 박제 진입 대기 모드)

---

## 1. 변경 사항 (2026-05-30 → 2026-05-31)

```
✅ Phase 5 박제 도착 + v2.23 sync ⑩ ✅ (랭킹·커뮤니티 6 jsx · `comm-shared` 신규)
✅ Phase 5C 운영 박제 6/6 완료 (auto-chain · `68fc5c3`~`3e3423f`)
✅ Phase 5 PR 결재 ✅ — subin→dev #656 + dev→main #658 (운영 `26586af`)
✅ Phase 5 ⑭ 종료

✅ Phase 6.1 박제 도착 + v2.24 sync ⑩ ✅ (프로필 본체 6 jsx · `profile-shared` 신규)
✅ Phase 6.1C 운영 박제 6/6 완료 (`cc78745`~`f29a3ca`)
✅ Phase 6.1 PR 결재 ✅ — subin→dev #657 + dev→main #658
✅ Phase 6.1 ⑭ 종료

✅ Phase 6.2 박제 도착 + v2.25 sync ⑩ ✅ (결제·구독·예약 7 jsx · `billing-shared` 신규)
✅ Phase 6.2C 운영 박제 7/7 완료 (`dc31be2`~`51b4378`) — 토스 위젯 실연결 mock 0
🔵 Phase 6.2 PR 결재 진행 중 — subin→dev #659 (빌드 pass) / 머지 대기

✅ Phase 6.3 박제 도착 + v2.26 sync ⑩ ✅ (성장·주간리포트·설정 3 jsx · `growth-shared` 신규)
✅ Phase 6.3C 운영 박제 3/3 완료 (`280c9ef` / `b9e6516` / `acbd0b2`)
⏳ Phase 6.3 PR 결재 대기 — subin→dev→main 머지 (★ Phase 6 묶음 종료 트리거)

🔵 Phase 7 진입 준비 — 온보딩·회원가입·인증 (AU1~AU4 = 4 시안 사용자만)
  - baseline zip ✅ `_zips/BDR-current-phase7-baseline-2026-05-31.zip` (512KB / 169 파일)
  - 의뢰서 ✅ auth-onboarding-user-connectivity-plan + redesign (BA1~BA5)
  - delivery prompt ✅ `phase-7-claude-ai-delivery-prompt-2026-05-31.md`
  - ⏸ Claude.ai 박제 대기 = **수빈 본인 drag-drop + paste 2 단계**
```

→ **본 큐 = Phase 6 묶음 결재 대기 + Phase 7 박제 시작 대기**.

---

## 2. 현재 CLI 큐 — 0 건 (전부 결재/사용자 액션 대기)

| # | 항목 | 상태 | 책임자 | 다음 액션 |
|---|------|-----|------|---------|
| A | Phase 6.2 PR #659 | 🔵 빌드 pass / 머지 대기 | 수빈 | subin→dev #659 머지 → dev→main 새 PR |
| B | Phase 6.3 PR | ⏳ 결재 대기 | 수빈 | subin→dev 새 PR (Phase 6.2 머지 후 함께 묶기 권장) |
| C | Phase 7 Claude.ai 박제 | ⏸ 시작 대기 | 수빈 | Claude.ai 세션 + 3 첨부 drag-drop + §메시지 본체 paste |
| D | (선택) PA3 재설계 | ⏸ 보류 | 수빈 | 옵션 A/B/C 결재 |

→ CLI 측 자동 진행 작업 = 0. 모두 사용자(수빈) 수동 액션 대기.

---

## 3. 권장 실행 순서

```
[Step 1 — 권장 묶기 머지] Phase 6.2 #659 머지 + Phase 6.3 새 PR 생성 → dev→main 1 회 머지로 Phase 6 묶음 종료
  → Phase 6.1+6.2+6.3 = 16 시안 운영 반영 완료 마일스톤

[Step 2 — Phase 7 박제 시작] Claude.ai 세션 새로
  - 첨부 3건 drag-drop:
    · _zips/BDR-current-phase7-baseline-2026-05-31.zip
    · auth-onboarding-user-connectivity-plan-2026-05-31.md
    · auth-onboarding-user-redesign-prompt-2026-05-31.md
  - phase-7-claude-ai-delivery-prompt-2026-05-31.md §메시지 본체 paste
  - 박제 결과 v2.27 예상

[Step 3 — Phase 7 zip 도착 시] Cowork 자동 sync 의뢰서 작성 + CLI sync 실행 → Auto Chain Phase 7C
```

---

## 4. 즉시 시작 명령

```
# Phase 6.2 #659 + Phase 6.3 머지 결재 시:
"Phase 6.2 + 6.3 묶어 머지 하자" → CLI 자동 진행

# Phase 7 박제 시작 시 (수빈 수동):
Claude.ai 새 세션 → drag-drop 3건 → phase-7-claude-ai-delivery-prompt-2026-05-31.md §메시지 본체 paste
```

---

## 5. Phase 진행 점수판 (2026-05-31 갱신)

| Phase | 영역 | Claude.ai 박제 | sync | 운영 박제 | 머지 | 완료 | 비고 |
|-------|------|--------------|------|---------|------|------|------|
| 1A | 대회 관리자 (10) | ✅ v2.19 | ✅ | ✅ 15/16 | ✅ #653 | ✅ | PA3 SKIP |
| 1B | 대회 사용자 (8) | ✅ v2.18 | ✅ | ✅ | ✅ #653 | ✅ | |
| 2 | 경기 (10) | ✅ v2.20 | ✅ | ✅ 10/10 | ✅ #655 | ✅ | |
| 3 | 팀 (7) | ✅ v2.21 | ✅ | ✅ 6/6 | ✅ #655 | ✅ | |
| 4 | 단체 (8) | ✅ v2.22 | ✅ | ✅ 8/8 | ✅ #655 | ✅ | Q1~Q4 lock |
| 5 | 랭킹·커뮤니티 (6) | ✅ v2.23 | ✅ | ✅ 6/6 | ✅ #658 | ✅ | |
| 6.1 | 프로필 본체 (6) | ✅ v2.24 | ✅ | ✅ 6/6 | ✅ #658 | ✅ | |
| **6.2** | **결제·구독·예약 (7)** | ✅ v2.25 | ✅ | ✅ 7/7 | 🔵 **#659** | ⏳ | **빌드 pass / 머지 대기** |
| **6.3** | **성장·리포트·설정 (3)** | ✅ v2.26 | ✅ | ✅ 3/3 | ⏳ | ⏳ | **★ Phase 6 묶음 종료 트리거** |
| **7** | **온보딩·인증 (4 사용자)** | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | **수빈 본인 박제 시작 대기** |

→ Phase 1~6.1 운영 반영 완료. Phase 6.2/6.3 머지 대기. Phase 7 진입 준비 완료.

---

## 6. 자동 점검 결과 (Cowork scheduled task — 2026-05-31)

```
[uploads 점검] ⚠️ 본 세션 uploads/ 신규 BDR v2 (N).zip = 0
  - phase-ledger Phase 6.3 sync 완료 (2026-05-31) — uploads 박제 zip 이미 소비됨
  - 신규 Phase 7 박제 zip 도착 = 수빈 본인 Claude.ai 실행 후 예상

[phase-ledger 점검] ✅ Phase 6.2 ⑬ 🔵 #659 / Phase 6.3 ⑬ ⏳ 대기 / Phase 7 entry 미작성 (zip 도착 후)

[의뢰서 점검] ✅ Phase 6 묶음 + Phase 7 의뢰서 모두 작성됨
  - 추가 sync 의뢰서 작성 ❌ (Phase 7 zip 도착 전)
  - 추가 운영 박제 batch 의뢰서 ❌ (Phase 7 sync 후 작성)
  - 본 큐 status 파일 갱신만 ✅

[다음 액션]
  1. 수빈 본인: Phase 6.2 #659 + Phase 6.3 머지 (★ Phase 6 묶음 종료)
  2. 수빈 본인: Phase 7 Claude.ai 박제 시작 (~2분 drag-drop + paste)
  3. Phase 7 zip 도착 → Cowork 자동 sync 의뢰서 작성
```

---

## 7. (선택) PR-1C-10 PA3 재설계 — 별 의뢰

planner 재설계 대기 중. 본 큐 영향 0. 사용자 결정 후 별 의뢰서 작성:

```
[옵션 A] 신규 기능 (시안 종별위임 → 운영 신규 시스템 신설) — DB 변경 / 큰 작업
[옵션 B] 리디자인만 (시안 종별위임 → 운영 협회 마법사 시각 보강만) — DB 변경 ❌
[옵션 C] SKIP 유지 (보류)
```

---

**큐 끝.** 자동 진행 작업 0건. 다음 점검 시 Phase 6 묶음 머지 + Phase 7 진행 상태 갱신.
