# Phase Ledger — 세 플랫폼 실시간 Phase 상태

> 본 ledger 는 **세 플랫폼이 같이 보는 source of truth**. 핸드오프마다 갱신.
> 명명 / 우선순위 / 라이프사이클 = `WORKFLOW.md` 참조.

---

## 현재 진행 중 Phase

### Phase 1 — 대회 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ① 점검 리포트 | 1 (대회 전체) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/tournament-user-admin-connectivity-plan-2026-05-25.md` |
| ② 갭 분석 (B1~B7) | 1 (연결 다리) | ✅ 완료 | Cowork | 2026-05-25 | 7 갭 식별 — B1/B6 ★★★★★ |
| ③ 사용자 결재 | 1 | ✅ 완료 | 수빈 | 2026-05-25 | Phase 1B 방향 OK / 선검증 묶음 / 의뢰 작성 진행 |
| ④ 의뢰 작성 | 1A (관리자) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (10 시안) |
| ④ 의뢰 작성 | 1B (사용자+다리) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/tournament-user-redesign-prompt-2026-05-25.md` (8 시안 + 1 컴포넌트) |
| ⑤ phase-ledger 갱신 | 1A/1B | ✅ 완료 | Cowork | 2026-05-25 | 본 ledger 초기화 (WORKFLOW.md 도입과 함께) |
| ⑥ git commit + push | 1A/1B | ⏳ 대기 | Cowork→수빈 | - | WORKFLOW.md + phase-ledger + sync 스크립트 묶어 commit |
| **⑦ Claude.ai 전달** | 1B (사용자+다리) | ✅ 완료 | 수빈 | 2026-05-25 | 의뢰 전달 + 박제 시작 |
| **⑦ Claude.ai 전달** | 1A (관리자) | ⏳ 대기 | **수빈 (수동)** | - | **통합 가이드 묶음 1** = `phase-1A+2-claude-ai-delivery-guide-2026-05-26.md` §1 묶음 1. baseline 5 admin 임시 복원 + zip + Phase 1A 의뢰서 전달 |
| ⑧ 시안 박제 | 1B | ✅ 완료 | Claude.ai | 2026-05-25 | BDR v2.18 박제 — 9 파일 (사용자 6 + 관리자 보강 3) |
| ⑨ zip 출력 | 1B (v2.18) | ✅ 완료 | Claude.ai | 2026-05-25 | uploads/BDR v2 (2).zip 도착. v2.2~v2.18 히스토리 포함 / v2.18 활성 |
| **⑩ sync 실행** | 1B (v2.18) | ✅ 완료 | CLI | 2026-05-26 | `sync-bdr-current.ps1 -NewVersion "v2.18"` 실행 완료. BDR-current = 15 파일 (jsx 9 UA1~UD3 + css 6) / pre-snapshot = `_archive/BDR-current-2026-05-26-pre-v2.18/` (149 파일 전부 보존). 회귀 검수 6 케이스 통과 (더보기/RDM/--color/lucide-react/9999px/가짜링크/icon-btn). 인코딩 우회 = UTF-8 BOM 임시 파일 1회성 (원본 스크립트 변경 0). |
| ⑧ 시안 박제 | 1A | ⏸ 보류 | Claude.ai | - | 1A 의뢰 전달 후 |
| ⑨ zip 출력 | 1A | ⏸ 보류 | Claude.ai | - | 별 zip 묶음 — v2.19 또는 v2.18 갱신 |
| **⑩ sync 실행** | 1A | ✅ 완료 | CLI | 2026-05-26 | `sync-bdr-current.ps1 -NewVersion "v2.19"` 실행 완료. BDR-current = 23 파일 (jsx 17 admin 11 + user 6 / css 6 user) — v2.19 cumulative (v2.18 user + Phase 1A admin) / pre-snapshot = `_archive/BDR-current-2026-05-26-pre-v2.19/` (v2.18 15 + baseline 5 = 20 파일 보존). 회귀 검수 6 케이스 통과. Step 0 BOM 영구 해결 commit `5609c61` (Phase 1B 임시 우회 패턴 폐기). |
| **⑪ 운영 박제 (Phase 1C)** | 1C | 🔵 진행 중 | CLI | 2026-05-28 | **PR-1C-1 ✅** (commit `40d19db` / PR #650) + **PR-1C-2 ✅** (commit `9734de4`) + **PR-1C-3 UB1 TournamentCompleted ✅** (page.tsx 721→923 status='completed' 분기 + standings query 1건 + 신규 css 1 + tsx 6 = tournament-completed.css 343 / hero 145 / final-standings 102 / mvp-best5 63 / gallery 75 / story 67 / next-edition 90) / 데이터 없는 카드 자동 hide / mock 0 / 신규 라우트 0 / API 변경 0 (Prisma query 1건 = §3 예외) / AppNav 변경 0 / tsc 0 errors. 잔여 13 PR (PR-1C-4~16). |
| **⑫ 회귀 검수 (역박제 룰)** | 1C | ✅ 진행 중 (PR-1C-1+2+3) | CLI | 2026-05-28 | PR-1C-1+2+3 자체 회귀 검수 6/6 + 추가 UB1 10/10 PASS (신규 라우트 0 / mock 0 / 5 카드 grid 반응형 / fallback / snake_case OK / PA7 혼동 0). 운영→시안 drift 0. |
| **⑬ PR 결재** | 1C | ⏸ 보류 | **수빈 (수동)** | - | subin → dev → main (CLAUDE.md §🚦) |
| ⑭ Phase 완료 | 1 | ⏸ 보류 | Cowork | - | 본 ledger 갱신 + Phase 2 시작 결정 |

### Phase 1 + Phase 2 통합 다음 액션 (수빈 본인)

**통합 가이드**: `Dev/design/prompts/phase-1A+2-claude-ai-delivery-guide-2026-05-26.md` (Cowork 2026-05-26 작성)

```
[Step 0 — 영구 해결 (Phase 1A sync 전 1회)]
☑ scripts/sync-bdr-current.ps1 UTF-8 BOM 추가 commit `5609c61` (2026-05-26) — Phase 2/3/.. 후속 sync 에서 우회 반복 회피

[묶음 1 — Phase 1A (대회 관리자 10 시안)]
☐ baseline 5 admin 파일 임시 복원 (AdminTournamentAdminList/Wizard1Step/WizardAssociation/Matches/Divisions)
☐ BDR-current 전체 zip 묶기 (Downloads/BDR-current-phase1A-baseline-2026-05-26.zip)
☐ Claude.ai 세션 1: zip + tournament-admin-redesign-prompt-2026-05-25.md 전달
☐ Phase 1A zip 회신 도착 → Cowork 알림
☐ Cowork/CLI 가 sync CLI 의뢰서 작성 (phase-1A-vX.Y-sync-cli-prompt)
☐ CLI sync 실행 → phase-ledger Phase 1 ⑩ ✅ 갱신

[묶음 2 — Phase 2A + 2B (경기 영역 10 시안)] — 묶음 1 sync 후
☐ baseline 9 경기 파일 임시 복원 (Games/GameDetail/CreateGame/GuestApply/Live/GameResult/Home/AdminGames/AdminGameReports + MyActivity 보존)
☐ BDR-current 전체 zip 묶기 (phase2-baseline-2026-05-XX.zip)
☐ Claude.ai 세션 2: zip + game-admin + game-user 의뢰서 3건 전달
   (BG7 = Hero 위 sticky / BG2 = 평균+종류만 룰 명시 / 양측 BG1·BG2 의존 강조)
☐ Phase 2 zip 회신 도착 → Cowork 알림
☐ Phase 2 sync CLI 의뢰서 작성
☐ CLI sync 실행 → phase-ledger Phase 2 ⑩ ✅ 갱신

[Phase 1C + Phase 2C — 운영 박제]
☐ Phase 1 운영 박제 의뢰서 (PR ~16~19) — Phase 1B + 1A 합산
☐ Phase 2 운영 박제 의뢰서 (PR ~10)
☐ subin → dev → main PR 결재
```

→ 위 단계 완료 후 Phase 3 (영역 미정) 시작.

---

## 예정 Phase

### Phase 2 — 경기 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ① 점검 리포트 | 2 (경기 전체) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/game-user-admin-connectivity-plan-2026-05-25.md` (8 갭 BG1~BG8) |
| ② 갭 분석 (BG1~BG7) | 2 (연결 다리) | ✅ 완료 | Cowork | 2026-05-25 | 7 갭 확정 — BG4 ★★★★★ / BG6 ★★★★ / BG7 ★★★★ / BG1·BG2·BG3 ★★★ / BG5 ★★ (BG8 자동 매칭 별 Phase) |
| ③ 사용자 결재 | 2 | ✅ 완료 | 수빈 | 2026-05-25 | 범위 BG1~BG7 / BG7 = Hero 위 sticky 띠 / BG2 = 평균+flag종류만 (개별건수❌) / Phase 1A 와 병행 |
| ④ 의뢰 작성 | 2A (관리자) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/game-admin-redesign-prompt-2026-05-25.md` (UD1 AdminGames + UD2 AdminGameReports = 2 시안) |
| ④ 의뢰 작성 | 2B (사용자+다리) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/game-user-redesign-prompt-2026-05-25.md` (UA1~UA5 + UB1 + UC1 + UC2 = 8 시안) |
| ⑤ phase-ledger 갱신 | 2A/2B | ✅ 완료 | Cowork | 2026-05-25 | 본 ledger 의 Phase 2 섹션 갱신 |
| ⑥ git commit + push | 2A/2B | ⏳ 대기 | Cowork→수빈 | - | Phase 2 점검 리포트 + 의뢰 2건 + ledger 갱신 묶어 commit |
| **⑦ Claude.ai 전달** | 2A + 2B 묶음 | ⏳ 대기 (묶음 1 sync 후) | **수빈 (수동)** | - | **통합 가이드 묶음 2** = `phase-1A+2-claude-ai-delivery-guide-2026-05-26.md` §1 묶음 2. Phase 1A sync 완료 후 진행 (옵션 B 권장). baseline 9 경기 임시 복원 + zip + Phase 2A/2B 의뢰서 2건 전달 |
| ⑧ 시안 박제 | 2A + 2B | ⏸ 보류 | Claude.ai | - | ⑦ 후 시작. 합계 10 시안 |
| ⑨ zip 출력 | 2A + 2B | ⏸ 보류 | Claude.ai | - | BDR v2.X (Phase 1A 전달 시점 결정) |
| ⑩ sync 실행 | 2A + 2B | ⏸ 보류 | 수빈 | - | zip 도착 후 `sync-bdr-current.ps1` |
| ⑪ 운영 박제 (Phase 2C) | 2C | ⏸ 보류 | CLI | - | sync 후 PR 그룹 ~10건 예상 |
| ⑫ 회귀 검수 (역박제 룰) | 2C | ⏸ 보류 | CLI | - | CLAUDE.md §🔄 적용 |
| ⑬ PR 결재 | 2C | ⏸ 보류 | 수빈 | - | subin → dev → main |
| ⑭ Phase 완료 | 2 | ⏸ 보류 | Cowork | - | Phase 3 시작 결정 |

---

## 완료 Phase (이력)

> Phase 단위 완료 시 본 섹션으로 이동.

(없음 — Phase 1 진행 중)

---

## 갱신 규칙

### 상태 enum

- `⏳ 대기` — 다음 책임자 액션 대기
- `🔵 진행 중` — 현재 작업 중
- `✅ 완료` — 단계 완료 / 다음으로
- `❌ 차단` — 의사결정 / 데이터 / 권한 막힘 (메모에 사유)
- `⏸ 보류` — 의도적 미진행 (메모에 사유 + 재개 조건)

### 갱신 책임자

- **Cowork** = ① ~ ⑥ + ⑭
- **수빈** = ⑦ / ⑩ / ⑬ (수동 액션) — Cowork 에 한 줄 알리면 자동 갱신
- **Claude.ai** = ⑧ ~ ⑨ (수빈이 zip 받을 때 Cowork 가 대신 갱신)
- **CLI** = ⑪ ~ ⑫ (commit 마다 갱신)

### 갱신 형식

```
| <단계 번호> <단계명> | <영역> | <상태 enum> | <책임자> | <YYYY-MM-DD> | <한 줄 메모 / 파일 경로> |
```

→ 모호하면 WORKFLOW.md §5 Phase ledger 사용법 참조.

---

## 부록 A — Phase ID 정렬 룰

```
Phase 번호 ↑    영역 ↑
1A          1A     관리자 측 의뢰
1B          1B     사용자 측 + 연결 다리 의뢰
1C          1C     운영 박제
1A.5        1A.5   Phase 1A 후속 / 역박제 (필요 시)
2           2      다음 영역
```

본 ledger 안 정렬 = Phase 번호 → 영역 (1A → 1B → 1C → 2 ...).

## 부록 B — 본 ledger 갱신 이력

| 일자 | 변경 | 트리거 |
|------|------|------|
| 2026-05-25 | 초기화 (Phase 1A/1B 의뢰 작성 완료 상태) | WORKFLOW.md 도입 |
| 2026-05-25 | Phase 1B ⑦⑧⑨ ✅ + ⑩ 다른 세션 처리 메모 | v2.18 zip 도착 / 다른 세션 CLI 의뢰서 작성 |
| 2026-05-26 | Phase 1B ⑩ ✅ 완료 (CLI sync 실행) | BDR-current = 15 파일 / 회귀 검수 6 케이스 통과 |
| 2026-05-25 | Phase 2 ①~⑤ ✅ 완료 (점검 리포트 + 의뢰 2A/2B 작성) | Phase 2 결재 4건 + 의뢰 2건 작성 |
| 2026-05-26 | **통합 가이드 작성** = `phase-1A+2-claude-ai-delivery-guide-2026-05-26.md` (다른 세션 Phase 1A 가이드 superset + Phase 2 baseline 9 추가) | Phase 1A + Phase 2 묶음 전달 결정 — 옵션 B (2 세션 분리) 권장 |
| 2026-05-26 | **사용자 결재 — 옵션 B 채택** (2 세션 분리 / 대회 → 경기 순) | 가이드 §0-0 결재 결과 명시 |
