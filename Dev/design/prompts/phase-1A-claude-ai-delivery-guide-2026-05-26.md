# Phase 1A — Claude.ai 전달 가이드 (수빈 본인 액션)

> **목적**: `tournament-admin-redesign-prompt-2026-05-25.md` (Phase 1A 관리자 10 시안 의뢰) 를 Claude.ai BDR 디자인 시스템 Project 에 전달할 때 따라야 할 단계별 안내.
> **작성일**: 2026-05-26
> **작성**: Cowork (mybdr 메인 프로젝트)
> **수행자**: 수빈 (본 가이드 따라 본인 진행)
> **이전 단계**: Phase 1B v2.18 sync ✅ 완료 (commit `a71c9a3`)
> **다음 단계**: Phase 1A zip 도착 후 = Phase 1B 와 동일하게 별 sync CLI 의뢰서 작성

---

## 0. 핵심 이슈 — baseline 5 파일 누락 (전달 전 처리 필수)

Phase 1B sync (옵션 A delta replace) 로 **현재 BDR-current/ 의 admin 영역 baseline 5 파일이 `_archive/BDR-current-2026-05-26-pre-v2.18/screens/` 로 이동**. Claude.ai 는 §🗂️ 단일 폴더 룰에 따라 **BDR-current/ 만 baseline 으로 봄**.

### 0-1. Phase 1A 가 참조하는 시안 9 개 현 상태

| 시안 | 분류 | 현 위치 | baseline 필요? |
|------|------|--------|-------------|
| AdminTournamentSetupHub.jsx | 수정 | ✅ BDR-current/ | 그대로 OK (Phase 1B 가 이미 보강) |
| AdminTournamentAdminList.jsx | 수정 | 📦 archive | **baseline 복원 필요** |
| AdminTournamentWizard1Step.jsx | 수정 | 📦 archive | **baseline 복원 필요** |
| AdminWizardAssociation.jsx | 수정 | 📦 archive | **baseline 복원 필요** |
| AdminTournamentMatches.jsx | 수정 | 📦 archive | **baseline 복원 필요** |
| AdminTournamentDivisions.jsx | 수정 | 📦 archive | **baseline 복원 필요** |
| AdminTournamentCompleted.jsx | 신규 | ❌ 없음 | 신규 = baseline 불필요 |
| AdminTournamentPlayoffs.jsx | 신규 | ❌ 없음 | 신규 = baseline 불필요 |
| AdminTournamentProspectus.jsx | 신규 | ❌ 없음 | 신규 = baseline 불필요 |

→ **baseline 복원 필요 = 5 파일**. 신규 3 파일은 Claude.ai 가 0 에서 시작.

### 0-2. 해결 방향 — 옵션 두 가지

#### 옵션 A — 임시 복원 후 zip 만들기 ⭐ 권장 (단일 폴더 룰 준수)

```
1. _archive/BDR-current-2026-05-26-pre-v2.18/screens/ 의 admin baseline 5 파일을
   BDR-current/screens/ 로 카피 (덮어쓰기 ❌ — 새 파일 추가만)
2. BDR-current/ 전체를 zip 으로 묶기
   (zip 명: BDR-current-pre-phase1A-baseline-2026-05-26.zip 권장)
3. zip + Phase 1A 의뢰서를 Claude.ai BDR 디자인 시스템 Project 에 전달
4. Claude.ai 가 baseline 보고 Phase 1A 박제 진행
5. Phase 1A 박제 결과 zip (v2.19 또는 v2.18 갱신) 도착 후 별 sync CLI 의뢰서
```

- **장점**: §🗂️ 단일 폴더 룰 준수 / Claude.ai 가 자연스럽게 baseline 인식
- **단점**: 임시 복원 단계 추가 (수빈 본인 5 파일 카피)
- **주의**: 임시 복원된 5 파일은 **git commit ❌ 권장** (다시 sync 들어올 거라 일시적). 또는 작업용 임시 branch 에 보관

#### 옵션 B — Phase 1A 의뢰서 본문에 baseline 5 파일 inline 첨부

```
1. _archive 의 5 파일 내용을 의뢰서 본문 §부록 에 inline 첨부 (전체 코드)
2. 의뢰서 + 별도 zip 없이 Claude.ai 에 전달
3. Claude.ai 가 의뢰서 본문에서 baseline 추출 후 박제
```

- **장점**: zip 만들기 단계 X / 의뢰서 self-contained
- **단점**: 의뢰서 분량 ↑ (현 617줄 → ~2000줄) / §🗂️ 단일 폴더 룰 약화
- **권장도**: 낮음 (의뢰서 가독성 ↓)

---

## 1. 옵션 A 실행 단계 (권장 — 수빈 본인 PowerShell)

### Step 1. baseline 5 파일 임시 복원

```powershell
# Repo 위치 이동
cd "C:\0. Programing\mybdr"

# 5 파일 복원 (덮어쓰기 ❌ — 동일 이름 BDR-current 에 없음 검증 후 카피)
$archive = "Dev/design/_archive/BDR-current-2026-05-26-pre-v2.18/screens"
$target = "Dev/design/BDR-current/screens"

$files = @(
  "AdminTournamentAdminList.jsx",
  "AdminTournamentWizard1Step.jsx",
  "AdminWizardAssociation.jsx",
  "AdminTournamentMatches.jsx",
  "AdminTournamentDivisions.jsx"
)

foreach ($f in $files) {
  $src = Join-Path $archive $f
  $dst = Join-Path $target $f
  if (Test-Path $dst) {
    Write-Host "⚠ 이미 존재 — 건너뜀: $f" -ForegroundColor Yellow
  } else {
    Copy-Item -Path $src -Destination $dst
    Write-Host "✓ 복원: $f" -ForegroundColor Green
  }
}

# 검증 — 5 파일 모두 BDR-current/screens/ 에 있는지
ls "Dev/design/BDR-current/screens/AdminTournament*", "Dev/design/BDR-current/screens/AdminWizard*"
```

### Step 2. BDR-current 전체 zip 묶기

```powershell
# Phase 1A 작업 baseline 으로 보낼 zip
$zipPath = "$env:USERPROFILE\Downloads\BDR-current-phase1A-baseline-2026-05-26.zip"
Compress-Archive -Path "Dev/design/BDR-current/*" -DestinationPath $zipPath -Force

# 검증 — zip 안 파일 수
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::OpenRead($zipPath).Entries.Count
# 예상: 20+ (jsx 14 + css 6 + html 8 + tokens.css/shell.css/admin.css/shared.jsx/index.html/README.md)
```

### Step 3. Claude.ai BDR 디자인 시스템 Project 에 전달

#### 3-1. 새 컨버세이션 시작 (또는 기존 컨버세이션 이어가기)

- Claude.ai → 좌측 sidebar → "BDR 디자인 시스템 관리" Project (Cowork 와 다른 컨텍스트) → "+ 새 채팅" 또는 기존 채팅 이어가기
- Project knowledge 가 이미 9 파일 (`Dev/design/claude-project-knowledge/` 패키지) 포함되어 있어야 — 미포함 시 먼저 첨부

#### 3-2. 첫 메시지 (의뢰서 본문 + 첨부 안내)

다음 템플릿 메시지 복사해서 보내기 (zip 은 첨부 파일로):

```
Phase 1A — 대회 생성/관리 흐름 전면 리디자인 의뢰 시작합니다.

상위 계획서: tournament-user-admin-connectivity-plan-2026-05-25.md
의뢰서: tournament-admin-redesign-prompt-2026-05-25.md (별도 첨부 / 또는 아래 inline)

baseline 준비:
- Phase 1B v2.18 sync 직후라 BDR-current/screens/ 가 9 파일 (UA1~UD3) 만 포함합니다.
- Phase 1A 가 참조하는 admin 영역 baseline 5 파일을 첨부 zip 으로 보냅니다:
  - AdminTournamentAdminList / Wizard1Step / WizardAssociation / Matches / Divisions
- 신규 3 시안 (AdminTournamentCompleted / Playoffs / Prospectus) 은 baseline 0 에서 시작.
- AdminTournamentSetupHub 는 Phase 1B B7 보강 (UD3) 위에 1A B1 진행도 추가 — 첨부 zip 의 BDR-current 안 SetupHub 이 1B 보강 결과 baseline.

첨부 파일:
1. BDR-current-phase1A-baseline-2026-05-26.zip  (전체 baseline + 5 admin 복원 + Phase 1B 결과 포함)
2. tournament-admin-redesign-prompt-2026-05-25.md  (Phase 1A 의뢰 본문)

진행 요청:
- 의뢰서 §0 "진입 — 표준 절차" 따라 시작
- §7 첫 응답 형식으로 응답 (자체 검수 §1~§7 포함)
- 박제 완료 후 새 zip 으로 회신 (BDR v2.19/ 또는 v2.18 갱신)

질문 / 가정 있으면 의뢰서 §7 형식 안 "질문 / 가정" 섹션에 정리해주세요.
```

#### 3-3. 첨부 파일

- 메시지 작성 창 우측 첨부 버튼 → 2 개 첨부:
  1. `BDR-current-phase1A-baseline-2026-05-26.zip` (Step 2 결과)
  2. `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (의뢰서 본문)

→ "보내기" 누르면 Claude.ai 가 baseline 인식 후 §7 첫 응답 형식으로 답함.

### Step 4. 임시 복원 5 파일 정리 (commit 전)

Claude.ai 에 zip 보낸 후 / Phase 1A zip 회신 받기 전까지 BDR-current/ 의 임시 복원 5 파일은 작업용 임시 상태. **commit 하지 않고** 다음 sync (Phase 1A) 때 자연스럽게 처리.

```powershell
# 옵션 — 다음 sync 때 archive 로 다시 이동되므로 그대로 두기 (권장)
# 또는 — 임시 복원 5 파일 즉시 제거 (옵션 B 효과)
foreach ($f in $files) {
  $dst = Join-Path $target $f
  if (Test-Path $dst) {
    # git status 로 새 파일인지 확인 (원래 BDR-current 에 있으면 그대로 둠)
    git status --porcelain $dst
  }
}
```

→ 임시 복원이 git status 에 새 파일 (untracked) 로 보임. 그대로 둬도 다음 sync 때 _archive 로 함께 이동 = OK.

---

## 2. Phase 1A zip 회신 후 — 다음 의뢰서

Phase 1B sync 와 동일 절차. Cowork 가 본 세션 또는 다음 세션에서 작성:

```
Dev/design/prompts/phase-1A-vX.Y-sync-cli-prompt-2026-05-XX.md
```

내용 골격 = Phase 1B sync 의뢰서 (`phase-1B-v2.18-sync-cli-prompt-2026-05-26.md`) 그대로 + 다음 차이:

| 항목 | Phase 1B (이미 완료) | Phase 1A (다음) |
|------|------------------|---------------|
| zip 안 폴더 | `Dev/design/BDR v2.18/` | `Dev/design/BDR vX.Y/` (X.Y 는 Claude.ai 가 정함) |
| 시안 파일 수 | 9 파일 | 10 파일 (수정 7 + 신규 3) |
| sync 방식 | 옵션 A (delta replace) | **고려 필요** — 본 sync 시점 BDR-current = Phase 1B 의 9 파일 + 임시 복원 5 = 14. Phase 1A 10 파일이 replace 하면 4 파일 (Phase 1B UA1/UA2/UA3/UB1/UC1 + MyRegistrationStatus) 손실 가능 |
| 회귀 검수 | 4 케이스 + 토큰 4 = 8 | **6 케이스 + 토큰 4 = 10** — Phase 1B 시안 위반 검수 결과 (CLI 가 보고한 6 케이스 = 더보기/RDM/--color-*/lucide/9999px/가짜링크/icon-btn) 그대로 답습 |
| 인코딩 우회 | BOM 임시 파일 (1회성) | **영구 해결 권장** — 본 가이드 §3 참조 |
| phase-ledger | ⑩ 1B 완료 | ⑩ 1A 갱신 |

### 2-1. Phase 1A sync 옵션 결정 사전 안내

본 가이드 §0 의 옵션 A (delta replace) 패턴은 Phase 1B 의 9 파일을 다시 archive 로 보냄. Phase 1A sync 직후 Phase 1B 시안은 **Phase 1A 의 pre-snapshot** (`_archive/BDR-current-2026-05-XX-pre-vX.Y/`) 에 보존.

→ Phase 1C 운영 박제 (Phase 1B + Phase 1A 묶음 ~13 PR) 진행 시 baseline 참조:
- Phase 1B 시안 → `_archive/BDR-current-2026-05-XX-pre-vX.Y/screens/` 의 9 파일
- Phase 1A 시안 → BDR-current/screens/ 의 10 파일

Phase 1C 운영 박제 의뢰서 작성 시 이 baseline 분리 명시 필수.

---

## 3. 영구 해결 옵션 — UTF-8 BOM (Phase 1A sync 전 권장)

`scripts/sync-bdr-current.ps1` 의 한글 깨짐 우회를 **Phase 1A sync 전에 영구 해결** 권장. Phase 1B 에서 BOM 임시 파일 1회성 우회 사용했지만 재발 확실.

### 3-A. BOM 재저장 (가장 간단 — 권장)

```powershell
cd "C:\0. Programing\mybdr"

# 원본 읽기 + UTF-8 BOM 으로 재저장
$content = Get-Content -Path "scripts/sync-bdr-current.ps1" -Raw -Encoding UTF8
$utf8WithBom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText("scripts/sync-bdr-current.ps1", $content, $utf8WithBom)

# 검증 — BOM 3 바이트 (EF BB BF) 있는지
$bytes = [System.IO.File]::ReadAllBytes("scripts/sync-bdr-current.ps1")[0..2]
"{0:X2} {1:X2} {2:X2}" -f $bytes[0], $bytes[1], $bytes[2]
# 예상 출력: EF BB BF

# commit + push
git add scripts/sync-bdr-current.ps1
git commit -m "fix(scripts): sync-bdr-current.ps1 UTF-8 BOM 추가 (PS 5.1 cp949 디코딩 회피)"
git push origin subin
```

### 3-B. PowerShell 7 (`pwsh`) 설치 — 영구

```
winget install --id Microsoft.PowerShell --source winget
# 또는 https://github.com/PowerShell/PowerShell/releases/latest
```

→ 설치 후 `pwsh -File scripts/sync-bdr-current.ps1 ...` 로 실행. 단 수빈 환경 기본 = Windows PowerShell 5.1 이므로 매번 `pwsh -File` 접두 필요. 옵션 3-A 가 더 단순.

---

## 4. 본 가이드 자체 검수

- ✅ §0 baseline 5 파일 누락 이슈 명시 (이전 가이드에 빠질 수 있던 핵심)
- ✅ §1 옵션 A 단계별 PowerShell 명령 (수빈 검증 가능)
- ✅ §2 Phase 1A zip 회신 후 다음 sync 의뢰서 차이 (옵션 결정 / 회귀 검수 / 인코딩) 예고
- ✅ §3 인코딩 영구 해결 옵션 (Phase 1A sync 전 권장)
- ✅ CLAUDE.md §🗂️ 단일 폴더 룰 준수 (옵션 A 권장)
- ✅ CLAUDE.md §🚦 commit 룰 — 임시 복원 5 파일 commit 보류 명시
- ✅ Phase 1B 학습 반영 — sync 후 baseline 분리 / 회귀 검수 6 케이스 / 인코딩 우회

---

## 부록 A — Phase 1A 전달 직전 체크리스트 (수빈 본인 확인용)

```
☐ §0 옵션 A vs B 결정 (권장 A)
☐ §1 Step 1 — admin baseline 5 파일 임시 복원 완료
☐ §1 Step 2 — BDR-current zip 생성 완료 (Downloads/ 또는 임시 경로)
☐ §3 인코딩 영구 해결 (선택 — Phase 1A sync 전 권장)
☐ Claude.ai BDR 디자인 시스템 Project 접속 (Cowork 와 별 인스턴스)
☐ Project knowledge 9 파일 첨부 확인 (없으면 먼저 첨부)
☐ §1 Step 3 새 메시지 — 첨부 zip + 의뢰서 본문 함께 전송
☐ Claude.ai 첫 응답 (§7 형식) 확인 — "✅ BDR 디자인 의뢰 확인" 시작
☐ 박제 완료 zip 회신 → Cowork 에 알림 "Phase 1A zip 도착" → Cowork 가 sync CLI 의뢰서 작성
```

---

**가이드 끝.** 옵션 결정 후 §1 단계 진행 / 막히는 부분 있으면 Cowork 에 보고.
