# MyBDR 세 플랫폼 워크플로우 (Cowork / Claude.ai / Claude CLI)

> 본 문서는 **세 플랫폼이 동시에 보는 마스터 문서**.
> CLAUDE.md = 영구 룰 / **WORKFLOW.md = 협업 흐름** / `.claude/phase-ledger.md` = 실시간 Phase 상태.
> 갱신 시 commit `workflow: <변경 요약>`.

---

## 0. 한 줄 소개

수빈은 **Cowork 를 허브** 로 두고, **UI/UX 시안은 Claude.ai (BDR 디자인 시스템 관리 Project)** / **코드 박제는 Claude CLI** 에서 작업. 세 플랫폼이 같은 결정·같은 명명·같은 source of truth 를 보도록 본 문서가 묶어준다.

---

## 1. 세 플랫폼 역할 표

| 플랫폼 | 핵심 책임 | 다른 곳에서 손대지 말 것 |
|--------|---------|-----------------------|
| **Cowork** (수빈 허브) | (1) 점검 리포트 / 의뢰 문서 작성 (2) Phase 단위 의사결정 (3) 세 플랫폼 핸드오프 진행 상황 추적 (`phase-ledger`) (4) 결재 / 일정 | 운영 src/ 직접 수정 ❌ — 항상 CLI 위임 / 시안 직접 수정 ❌ — 의뢰 형태로 Claude.ai 위임 |
| **Claude.ai Project** (BDR 디자인 시스템 관리) | (1) Cowork 의뢰 문서 받아 시안 박제 (2) `Dev/design/BDR-current/screens/` zip 출력 (3) 06-self-checklist 자체 검수 | 운영 src/ 의 의사결정 ❌ / 코드 박제 ❌ |
| **Claude CLI** (Claude Code) | (1) 운영 src/ 박제 (시안 → 운영 코드) (2) DB / API / 테스트 / 디버깅 (3) `.claude/scratchpad.md` 현재 작업 추적 (4) git commit / push | 시안 직접 작성 ❌ / Phase 단위 의사결정 ❌ — Cowork 에 위임 |

---

## 2. 명명 통일 (갭 1 해결)

세 플랫폼이 다른 명명 쓰던 문제 해결. **이후 모든 산출물은 본 표준 사용**.

### 2-1. Phase 번호

```
Phase N        — 영역 묶음 (예: Phase 1 = 대회 / Phase 2 = 경기 / Phase 3 = 팀 / ...)
Phase NA       — N 안의 관리자 측 (시안 의뢰)
Phase NB       — N 안의 사용자 측 + 연결 다리 (시안 의뢰)
Phase NC       — N 안의 운영 박제 (CLI 가 src/ 수정)
Phase NA.X     — N.A 안의 소단위 (예: 1A.5 = Phase 1A 의 후속 / 역박제)
```

→ 현재 Phase 1A = `tournament-admin-redesign-prompt-2026-05-25.md` / Phase 1B = `tournament-user-redesign-prompt-2026-05-25.md` / Phase 1C = 운영 박제 (예정).

### 2-2. 갭 ID

```
B1~BN          — 사용자↔관리자 연결 다리 갭 (Bridge — Cowork 의뢰 / 본 Phase 의 연결성 계획서)
S1~SN          — Phase NA 의뢰 안 사각지대 (Stub — 관리자 단독 사각지대)
G1~GN          — 시안 박제 갭 (Gap — BDR-current 와 운영 src/ 불일치)
```

**영역 prefix (선택)**: Phase 가 누적되면 B1 이 어느 Phase 의 갭인지 혼동 위험. 영역명 1 글자 prefix 권장:
- `BT1~BTN` — Bridge **T**ournament (Phase 1 대회)
- `BG1~BGN` — Bridge **G**ame (Phase 2 경기)
- `BM1~BMN` — Bridge tea**M** (팀 영역)
- `BC1~BCN` — Bridge **C**ourt (코트 영역)
- `BS1~BSN` — Bridge **S**ociety (단체 영역) — O 와 혼동 X
- 등...

→ Phase 1 의 B1~B7 = 사실상 BT1~BT7 (대회). 새 영역부터 prefix 사용 권장. **단 prefix 없는 B 는 "Phase 안에서 unique" 로 해석**. 의뢰 문서 부록에 매핑 표 필수.

### 2-3. 시안 ID

```
[영역][번호]   — 예: UA1 / UB1 / UC1 / UD3 (사용자 측 / 사용자 신규 / 마이페이지 / 관리자 보강)
              — 또는 Phase 1A 형식 = A1 / B1 / C2 / D1 / E1
```

→ 의뢰 문서 §2 "대상 페이지 (영역별 그룹)" 표에서 ID ↔ 파일 매핑 명시.

### 2-4. PR 그룹 ID

```
PR-[Phase]-[순번]   — 예: PR-1C-1 (Phase 1C 첫 PR — 사용자 측 목록 박제)
                  — `.claude/scratchpad.md` 의 작업 로그와 동일 명명
```

---

## 3. 핸드오프 순서 (라이프사이클 — 갭 3 해결)

```
[수빈]
  ↓ "Phase N 시작" 요청
[Cowork]
  ① 점검 리포트 작성 (Dev/design/prompts/<phase>-plan-YYYY-MM-DD.md)
  ② 갭 분석 (B / S / G)
  ③ 사용자 결재 ◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ [수빈 액션]
  ④ 시안 의뢰 문서 작성 (Dev/design/prompts/<phase>-redesign-prompt-YYYY-MM-DD.md)
  ⑤ phase-ledger 갱신 (상태 = "의뢰 작성 완료 / Claude.ai 전달 대기")
  ⑥ git commit + push
                                 ↓
                          [수빈 액션 — 수동]
                          - 의뢰 문서를 Claude.ai BDR 디자인 시스템 관리 Project 에 붙여 넣기
                          - phase-ledger 상태 = "Claude.ai 진행 중" 갱신
                                 ↓
[Claude.ai]
  ⑦ 의뢰 받아 시안 박제 (Dev/design/BDR vX.Y/screens/)
  ⑧ 06-self-checklist 자체 검수
  ⑨ zip 출력
                                 ↓
                          [수빈 액션 — 수동]
                          - zip 다운로드 → 임시 폴더
                          - scripts/sync-bdr-current.ps1 실행
                          - phase-ledger 상태 = "박제 진행 중 / Phase NC 시작" 갱신
                                 ↓
[Claude CLI]
  ⑩ BDR-current/screens/ → src/ 운영 박제 (Phase NC)
  ⑪ 회귀 검수 (자체 검수 + Phase A.5 역박제 체크 — CLAUDE.md §🔄 운영→시안 동기화 룰)
  ⑫ PR 단위 commit (PR-NC-1, PR-NC-2, ...)
  ⑬ phase-ledger 상태 = "검증 대기" 갱신
                                 ↓
                          [수빈 액션 — 수동]
                          - subin → dev → main PR 결재 (CLAUDE.md §🚦)
                          - phase-ledger 상태 = "Phase NC 완료" 갱신
```

### 3-1. 수빈 본인이 수동으로 해야 할 액션 체크리스트 (갭 3 핵심)

세 플랫폼 핸드오프에서 **자동화 불가능 / 사람만 가능한 단계**:

```
☐ [⑥ 후] Cowork 가 작성한 의뢰 문서를 Claude.ai BDR 디자인 시스템 관리 Project 에 붙여 넣기
☐ [⑨ 후] zip 다운로드 후 임시 폴더에 풀이 → scripts/sync-bdr-current.ps1 실행
☐ [⑫ 후] subin → dev PR 머지 (GitHub)
☐ [⑫ 후] dev → main PR 머지 (배포 / 수빈 단독 권한 — 2026-06-14 원영 이탈)
☐ [전 단계] phase-ledger 상태 변경 시 Cowork 또는 CLI 에 알려 자동 갱신 트리거 (또는 본인이 직접 갱신)
```

→ 매 Phase 마다 위 5 단계 의무. phase-ledger 가 이 체크리스트를 항상 떠올리게 함.

---

## 4. Source of Truth 우선순위 (갭 2 해결)

세 플랫폼이 매번 어디 보고 결정 적용할지 모호하던 문제 해결. **위에서 아래로 우선순위**:

| 순위 | 파일 | 내용 | 갱신 빈도 |
|------|------|------|---------|
| **1** | `CLAUDE.md` | 영구 룰 (브랜치 / DB / 보안 / 디자인 핵심) | 룰 변경 시만 |
| **2** | `WORKFLOW.md` (이 문서) | 협업 흐름 / 명명 / 핸드오프 / source 우선순위 | 워크플로우 변경 시 |
| **3** | `Dev/design/claude-project-knowledge/00~06` | 디자인 룰 (13 룰 / 사용자 결정 §1~§8 / 자체 검수) | 디자인 룰 변경 시 |
| **4** | `.claude/phase-ledger.md` | Phase 1~N 실시간 상태 | 핸드오프마다 |
| **5** | `Dev/design/prompts/<phase>-*.md` | Phase 점검 리포트 + 의뢰 문서 | Phase 별 1회 작성 + 결정 변경 시 갱신 |
| **6** | `.claude/scratchpad.md` | CLI 현재 작업 (100줄 룰) | 매 작업 |
| **7** | `.claude/knowledge/{architecture, conventions, decisions, errors, lessons, index}.md` | CLI 영구 지식 | 실패 / 결정 / 패턴 발견 시 |

### 4-1. 충돌 시 우선순위

상위 파일이 하위 파일을 override. **단 디자인 룰은 §3 (Dev/design/claude-project-knowledge) 가 디자인 영역에서 우선** (CLAUDE.md 의 디자인 핵심 §은 요약 / claude-project-knowledge 가 상세).

### 4-2. "어디 봐야 하는지" 빠른 가이드

| 질문 | 봐야 할 파일 |
|------|------------|
| 지금 어떤 브랜치인가 / DB 정책은? | CLAUDE.md §🚦 §🗄️ |
| 세 플랫폼 중 누가 뭘 해야 하는가? | **WORKFLOW.md** (이 문서) |
| Phase 1B 가 어디까지 진행됐는가? | **.claude/phase-ledger.md** |
| AppNav 코드는? | claude-project-knowledge/03 |
| 사용자 결정 §6 (카피) 은? | claude-project-knowledge/01 |
| 최근 CLI 가 무슨 작업 했는가? | .claude/scratchpad.md |
| 과거에 비슷한 에러 해결한 적 있는가? | .claude/knowledge/errors.md |

---

## 5. Phase ledger (`.claude/phase-ledger.md`) 사용법

세 플랫폼이 같은 ledger 를 본다. Phase 진행 상황을 실시간 추적.

### 5-1. 컬럼

```
| Phase | 단계               | 상태       | 책임자       | 갱신일       | 메모               |
|-------|-------------------|----------|------------|------------|------------------|
| 1A    | ④ 의뢰 작성        | ✅ 완료    | Cowork      | 2026-05-25 | tournament-admin-redesign-prompt-2026-05-25.md |
| 1A    | ⑦ Claude.ai 진행  | ⏳ 대기    | 수빈→Claude.ai | -          | 의뢰 전달 대기      |
| 1B    | ④ 의뢰 작성        | ✅ 완료    | Cowork      | 2026-05-25 | tournament-user-redesign-prompt-2026-05-25.md |
```

### 5-2. 상태 enum

- `⏳ 대기` — 다음 책임자의 액션 대기
- `🔵 진행 중` — 현재 작업 중
- `✅ 완료` — 단계 완료 / 다음 단계로
- `❌ 차단` — 의사결정 / 데이터 / 권한 문제로 막힘 (메모에 사유)
- `⏸ 보류` — 의도적 미진행 (메모에 사유 + 재개 조건)

### 5-3. 갱신 책임자

- **Cowork** = ① ~ ⑥ 단계 갱신 (의뢰 작성 / 결재)
- **수빈** = 수동 단계 (의뢰 전달 / zip 받기 / sync 실행 / PR 결재) — Cowork 에 한 줄 알리면 Cowork 가 ledger 갱신
- **Claude.ai** = ⑦ ~ ⑨ 단계 (단 Claude.ai 가 ledger 직접 못 봄 → 수빈이 zip 받을 때 갱신)
- **CLI** = ⑩ ~ ⑬ 단계 (CLI 가 commit 마다 ledger 갱신)

---

## 6. BDR-current sync 자동화 (`scripts/sync-bdr-current.ps1`)

CLAUDE.md §🗂️ 5단계 (zip → archive 이동 → 카피 → README 갱신 → commit) 를 PowerShell 스크립트화. **수빈이 직접 실행**.

### 6-1. 사용법

```powershell
# 기본 사용 (드라이런 — 실제 변경 X / 미리보기만)
.\scripts\sync-bdr-current.ps1 -ZipPath "C:\Downloads\BDR-v2.17.zip" -NewVersion "v2.17" -DryRun

# 실제 실행
.\scripts\sync-bdr-current.ps1 -ZipPath "C:\Downloads\BDR-v2.17.zip" -NewVersion "v2.17"

# 사용자 정의 archive 라벨 (예: Phase 동기 보관)
.\scripts\sync-bdr-current.ps1 -ZipPath "C:\Downloads\BDR-v2.17.zip" -NewVersion "v2.17" -ArchiveLabel "BDR-current-2026-05-25-pre-phase1"
```

### 6-2. 스크립트가 자동 처리

1. zip 풀이 → 임시 폴더
2. 기존 `Dev/design/BDR-current/` → `Dev/design/_archive/BDR <version>/` 이동
3. 새 zip 의 `Dev/design/BDR <version>/` → `Dev/design/BDR-current/` 카피
4. zip 최상위 옛 시안 (있으면) → `Dev/design/_archive/v2-original/`
5. `Dev/design/README.md` 갱신 (헤드 라인에 sync 정보 추가)
6. 마지막에 `commit` 명령 print (수빈이 검토 후 실행 — 자동 commit ❌)

### 6-3. 안전 가드

- `-DryRun` 모드 = 실제 파일 변경 X / 시뮬레이션
- 기존 `BDR-current/` 가 git uncommitted 상태면 **중단** (수빈 결정 필요)
- 임시 폴더 자동 정리

---

## 7. 갭 1~4 → 본 문서 해결 매핑

| 갭 | 본 문서 / 산출물 | 해결 |
|----|---------------|------|
| **갭 1** 명명 체계 불일치 | §2 명명 통일 | Phase / B / S / G / 시안 ID / PR 그룹 ID 표준 정의 |
| **갭 2** Source of truth 산재 | §4 우선순위 표 | 7 단계 우선순위 + 빠른 가이드 |
| **갭 3** 핸드오프 / 수빈 액션 불명확 | §3 라이프사이클 + 5단계 체크리스트 | 13 단계 다이어그램 + 수빈 5 액션 체크리스트 |
| **갭 4** 역방향 동기화 트리거 (Phase A.5 사례) | §3 ⑪ CLAUDE.md §🔄 link + phase-ledger 의 ⑪ 단계 명시 | 박제 단계에 회귀 검수 의무 / phase-ledger ⑪ 가 트리거 |

---

## 8. 변경 이력 / 다음 갱신 트리거

| 일자 | 변경 | 트리거 |
|------|------|------|
| 2026-05-25 | 초안 작성 (갭 1~4 해결) | Phase 1B 의뢰 작성 중 일관성 문제 발견 |

### 8-1. 본 문서 갱신이 필요한 경우

- 새 플랫폼 추가 (예: Claude 모바일 / 또 다른 에이전트)
- 명명 체계 변경 (Phase / B / S / G 패턴)
- 핸드오프 순서 변경 (예: 새 단계 추가)
- Source of truth 우선순위 변경

→ 본 문서 갱신 시 `phase-ledger` 에도 "WORKFLOW 갱신 vX" 항목 추가.

---

## 부록 A — 현재 Phase 상태 (스냅샷 2026-05-25)

상세는 `.claude/phase-ledger.md` 참조. 본 스냅샷은 본 문서 작성 시점 기준:

```
Phase 1  대회 영역
├── 1A  관리자 측 10 시안 의뢰      ✅ 의뢰 작성 / ⏳ Claude.ai 전달 대기
├── 1B  사용자 + 연결 다리 8 시안 의뢰  ✅ 의뢰 작성 / ⏳ Claude.ai 전달 대기
└── 1C  운영 박제                  ⏸ 보류 (1A + 1B 시안 완료 후)

Phase 2  경기 영역                  ⏸ 보류 (Phase 1 완료 후 시작)
```

---

## 부록 B — 신규 Phase 시작 시 표준 절차 (수빈 액션)

1. Cowork 에 "Phase N <영역> 시작" 요청
2. Cowork 가 점검 리포트 작성 → 사용자 결재
3. Cowork 가 의뢰 문서 작성 (NA / NB)
4. **수빈** 의뢰 문서 Claude.ai 에 전달 (수동)
5. **수빈** zip 받으면 `sync-bdr-current.ps1` 실행 (수동)
6. CLI 가 Phase NC 운영 박제 시작
7. **수빈** PR 결재 (수동)
8. Phase N 완료 — phase-ledger 갱신

→ 매 Phase 동일 절차. 본 부록을 체크리스트 형태로 사용.

---

**문서 끝.** 본 문서 위치 = `C:\0. Programing\mybdr\WORKFLOW.md` (최상위 — CLAUDE.md 와 짝).
