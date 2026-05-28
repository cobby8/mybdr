# Phase 1A + Phase 2 통합 — Claude.ai 전달 가이드 (수빈 본인 액션)

> **목적**: Phase 1A (대회 관리자 10 시안) + Phase 2A (경기 관리자 2 시안) + Phase 2B (경기 사용자+다리 8 시안) = **3 의뢰서 / 총 20 시안** 을 Claude.ai BDR 디자인 시스템 Project 에 통합 전달.
> **작성일**: 2026-05-26
> **작성**: Cowork (mybdr 메인 프로젝트)
> **수행자**: 수빈 (본 가이드 따라 본인 진행)
> **이전 단계**: Phase 1B v2.18 sync ✅ 완료 (commit `a71c9a3`)
> **선행 가이드**: `phase-1A-claude-ai-delivery-guide-2026-05-26.md` (Phase 1A 단독 가이드 — 본 가이드가 superset)
> **다음 단계**: Phase 1A + Phase 2 zip 회신 후 = 각 영역 별 sync CLI 의뢰서 작성

---

## 0. 통합 범위 — 한 번에 무엇을 전달하는가

### 0-1. 3 의뢰서 / 총 20 시안

| 의뢰서 | 시안 | 영역 |
|--------|-----|------|
| `tournament-admin-redesign-prompt-2026-05-25.md` (Phase 1A) | 10 = 수정 7 + 신규 3 | 대회 관리자 (A1~E2) |
| `game-admin-redesign-prompt-2026-05-25.md` (Phase 2A) | 2 = 보강 2 | 경기 관리자 (UD1~UD2) |
| `game-user-redesign-prompt-2026-05-25.md` (Phase 2B) | 8 = 부분수정 5 + 신규 1 + 보강 2 | 경기 사용자 + 다리 (UA1~UC2) |

→ **총 20 시안** = Phase 1A 10 + Phase 2A 2 + Phase 2B 8.

### 0-0. 사용자 결재 (2026-05-26)

| 항목 | 결재 결과 |
|------|---------|
| 전달 옵션 | **옵션 B — 2 세션 분리 (대회 vs 경기)** ✅ 권장 옵션 채택 |
| 묶음 1 = Phase 1A (대회 관리자 10 시안) | Claude.ai 세션 1 / Phase 1A 의뢰서 1건 + zip 1건 |
| 묶음 2 = Phase 2A + 2B (경기 영역 10 시안) | Claude.ai 세션 2 / 의뢰서 2건 + zip 1건. **묶음 1 sync 완료 후 진행** |
| Phase 2A·2B 같이 묶음 | BG1·BG2 양측 의존 (관리자·사용자 측 일관성) 필요 — 같은 세션 처리 |

### 0-2. baseline 복원 범위 — 14 파일 (대회 5 admin + 경기 9)

**현 BDR-current/screens/ 상태** (Phase 1B v2.18 sync 완료):
- ✅ 9 jsx + 6 css = 15 파일 (UA1~UD3 Phase 1B 결과)
- 📦 다른 baseline 시안 = `_archive/BDR-current-2026-05-26-pre-v2.18/screens/` (149 파일 보존)

**3 의뢰서가 참조하는 baseline 파일 점검** (총 21 시안 중 신규 3 제외 = 17 시안의 baseline 필요):

| 시안 ID | 파일 | 분류 | 현 위치 | baseline 복원? |
|--------|------|------|--------|------------|
| **Phase 1A (10)** | | | | |
| A1 | AdminTournamentAdminList.jsx | 수정 | 📦 archive | **복원 필요** |
| A2 | AdminTournamentWizard1Step.jsx | 수정 | 📦 archive | **복원 필요** |
| A3 | AdminWizardAssociation.jsx | 수정 | 📦 archive | **복원 필요** |
| B1 | AdminTournamentSetupHub.jsx | 수정 | ✅ BDR-current | OK (Phase 1B UD3 보강 위에 추가) |
| C1 | AdminTournamentMatches.jsx | 수정 | 📦 archive | **복원 필요** |
| C2 | AdminTournamentDivisions.jsx | 수정 | 📦 archive | **복원 필요** |
| (components.jsx 선택) | components.jsx | 수정 | 📦 archive | 복원 (선택) |
| D1 | AdminTournamentCompleted.jsx | 신규 | ❌ 없음 | 신규 — 불필요 |
| E1 | AdminTournamentPlayoffs.jsx | 신규 | ❌ 없음 | 신규 — 불필요 |
| E2 | AdminTournamentProspectus.jsx | 신규 | ❌ 없음 | 신규 — 불필요 |
| **Phase 2A (2)** | | | | |
| UD1 | AdminGames.jsx | 보강 | 📦 archive | **복원 필요** |
| UD2 | AdminGameReports.jsx | 보강 | 📦 archive | **복원 필요** |
| **Phase 2B (8)** | | | | |
| UA1 | Games.jsx | 부분수정 | 📦 archive | **복원 필요** |
| UA2 | GameDetail.jsx | 부분수정 | 📦 archive | **복원 필요** |
| UA3 | CreateGame.jsx | 부분수정 | 📦 archive | **복원 필요** |
| UA4 | GuestApply.jsx | 부분수정 | 📦 archive | **복원 필요** |
| UA5 | Live.jsx | 부분수정 | 📦 archive | **복원 필요** |
| UB1 | GameResult.jsx | 운영 박제 (시안 변형) | 📦 archive | **복원 필요** (기존 시안 위에 variant 변형) |
| UC1 | MyActivity.jsx | 보강 | ✅ BDR-current | OK (Phase 1B "내 대회" 위에 "내 경기" + "내 매너" 추가) |
| UC2 | Home.jsx | 보강 | 📦 archive | **복원 필요** |

→ **baseline 복원 필요 = 14 파일** (대회 admin 5 + 경기 admin 2 + 경기 사용자 7).

### 0-3. Claude.ai 전달 묶음 옵션

#### 옵션 A — 1 zip + 3 의뢰서 한 번에 전달 (한 세션)

```
1. baseline 14 파일 임시 복원 → BDR-current 전체 zip (단일 묶음)
2. 3 의뢰서 (Phase 1A + 2A + 2B) 같이 첨부
3. 한 Claude.ai 세션에서 20 시안 박제 진행
```

- **장점**: 1 zip / 1 세션 / Claude.ai 가 BG1/BG2 같은 양측 의존 갭 한꺼번에 처리
- **단점**: 의뢰서 합계 ~74KB + zip 큼 = Claude.ai context 부담 / 박제 시간 길어짐 (~20 시안)
- **위험**: Claude.ai 가 한 세션에서 처리 못 하면 중간 zip 출력 후 이어가기 필요

#### 옵션 B — 2 zip / 2 세션 분리 (대회 vs 경기) ⭐ 권장

```
[묶음 1] 대회 영역 마무리 — Phase 1A
1. baseline 5 admin 임시 복원 → BDR-current zip
2. tournament-admin-redesign-prompt-2026-05-25.md 첨부
3. Claude.ai 세션 1 — 10 시안 박제

[묶음 2] 경기 영역 — Phase 2A + 2B
1. baseline 9 경기 임시 복원 → BDR-current zip (묶음 1 sync 후)
2. game-admin + game-user 의뢰서 2건 첨부 (양측 동시 — BG1/BG2 의존)
3. Claude.ai 세션 2 — 10 시안 박제
```

- **장점**: 영역별 묶음 → 각 세션 부담 적정 / 박제 결과 zip 도 2 회 분리 → sync 도 2 회 분리 = 추적 명확
- **단점**: 묶음 1 sync 완료 후 묶음 2 시작 = 시간 순차
- **권장 이유**: Phase 1A sync 후 BDR-current 가 다음 baseline 으로 안정 → 묶음 2 (경기) 진행이 더 안전. Phase 2 의 BG1/BG2 의존도 2A+2B 한 묶음 안에서는 양측 동시.

#### 옵션 C — 3 zip / 3 세션 (Phase 1A / 2A / 2B 분리)

```
- 각 의뢰서마다 독립 zip + 세션
- Phase 1A → sync → Phase 2A → sync → Phase 2B → sync (총 3 회 sync)
```

- **장점**: 가장 보수적 / 각 단계 검증 명확
- **단점**: 3 회 sync = 시간 가장 오래 걸림 / Phase 2A/2B 의 BG1·BG2 양측 의존 처리 어려움 (양 세션 분리 시 동기화 곤란)
- **권장도**: 낮음 (Phase 2A + 2B 가 양측 의존이라 묶음이 맞음)

---

## 1. 옵션 B 실행 단계 (권장 — 수빈 본인 PowerShell)

### Step 0 — 인코딩 영구 해결 (Phase 1A sync 전 권장 / 한 번만)

기존 가이드 §3 답습 — `sync-bdr-current.ps1` 의 한글 깨짐 영구 해결:

```powershell
cd "C:\0. Programing\mybdr"
$content = Get-Content -Path "scripts/sync-bdr-current.ps1" -Raw -Encoding UTF8
$utf8WithBom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText("scripts/sync-bdr-current.ps1", $content, $utf8WithBom)
$bytes = [System.IO.File]::ReadAllBytes("scripts/sync-bdr-current.ps1")[0..2]
"{0:X2} {1:X2} {2:X2}" -f $bytes[0], $bytes[1], $bytes[2]  # 예상: EF BB BF

git add scripts/sync-bdr-current.ps1
git commit -m "fix(scripts): sync-bdr-current.ps1 UTF-8 BOM (PS 5.1 cp949 디코딩 회피)"
git push origin subin
```

→ 이후 sync 들은 BOM 임시 파일 우회 없이 동작.

---

### 묶음 1 — Phase 1A (대회 관리자 10 시안)

#### Step 1-1. baseline 5 admin 임시 복원

```powershell
cd "C:\0. Programing\mybdr"

$archive = "Dev/design/_archive/BDR-current-2026-05-26-pre-v2.18/screens"
$target = "Dev/design/BDR-current/screens"
$adminFiles = @(
  "AdminTournamentAdminList.jsx",
  "AdminTournamentWizard1Step.jsx",
  "AdminWizardAssociation.jsx",
  "AdminTournamentMatches.jsx",
  "AdminTournamentDivisions.jsx"
)

foreach ($f in $adminFiles) {
  $src = Join-Path $archive $f
  $dst = Join-Path $target $f
  if (Test-Path $dst) {
    Write-Host "⚠ 이미 존재 — 건너뜀: $f" -ForegroundColor Yellow
  } else {
    Copy-Item -Path $src -Destination $dst
    Write-Host "✓ 복원: $f" -ForegroundColor Green
  }
}

# 검증
ls "$target/AdminTournament*", "$target/AdminWizard*"
```

#### Step 1-2. BDR-current zip 묶기

```powershell
$zipPath = "$env:USERPROFILE\Downloads\BDR-current-phase1A-baseline-2026-05-26.zip"
Compress-Archive -Path "Dev/design/BDR-current/*" -DestinationPath $zipPath -Force

# 검증 — zip 안 파일 수
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::OpenRead($zipPath).Entries.Count
# 예상: 25+ (jsx 14 [9 v2.18 + 5 복원] + css 6 + html 8 + tokens.css/shell.css/admin.css/shared.jsx/index.html/README.md)
```

#### Step 1-3. Claude.ai BDR 디자인 시스템 Project 전달

**첨부**: zip + `tournament-admin-redesign-prompt-2026-05-25.md`

**메시지 템플릿**:
```
Phase 1A — 대회 관리자 리디자인 의뢰 (10 시안) 시작합니다.

상위 계획서: tournament-user-admin-connectivity-plan-2026-05-25.md
의뢰서: tournament-admin-redesign-prompt-2026-05-25.md (별도 첨부)

baseline 준비 (Phase 1B v2.18 sync 직후 상태 + 1A 참조 5 파일 임시 복원):
- 첨부 zip = BDR-current/ 전체 (jsx 14 = v2.18 박제 9 + 1A baseline 복원 5)
- 신규 3 시안 (Completed / Playoffs / Prospectus) 은 baseline 0 에서 시작
- AdminTournamentSetupHub 는 Phase 1B B7 (UD3) 보강 위에 1A B1 진행도 추가

첨부 파일:
1. BDR-current-phase1A-baseline-2026-05-26.zip
2. tournament-admin-redesign-prompt-2026-05-25.md

진행 요청:
- 의뢰서 §0 진입 표준 절차
- §7 첫 응답 형식
- 박제 완료 후 새 zip 회신 (BDR v2.19/ 또는 v2.18 갱신)
- 질문/가정은 의뢰서 §7 형식
```

#### Step 1-4. 임시 복원 5 파일 정리 (commit 보류)

```powershell
# git status — 새 untracked 파일 5건 보이는 게 정상
git status --porcelain Dev/design/BDR-current/screens/AdminTournament*.jsx Dev/design/BDR-current/screens/AdminWizard*.jsx
# 그대로 두기 — 다음 sync 때 _archive 로 함께 이동
```

#### Step 1-5. Phase 1A zip 회신 후 sync CLI 의뢰서

Cowork (또는 별 CLI 세션) 에서 작성:
- 위치: `Dev/design/prompts/phase-1A-vX.Y-sync-cli-prompt-2026-05-XX.md`
- 골격: `phase-1B-v2.18-sync-cli-prompt-2026-05-26.md` 답습
- 차이: 시안 10 (수정 7 + 신규 3) / sync 시 옵션 A delta replace / 회귀 검수 6 케이스

---

### 묶음 2 — Phase 2A + 2B (경기 영역 10 시안)

**선행 조건**: 묶음 1 (Phase 1A) sync 완료 후 진행.

#### Step 2-1. baseline 9 경기 임시 복원

묶음 1 sync 직후 BDR-current/ 상태:
- Phase 1A 박제 결과 + Phase 1B 의 UC1 MyActivity 유지 (있어야 — Phase 1A sync 가 archive 로 옮겼다면 다시 복원 필요)

```powershell
cd "C:\0. Programing\mybdr"

# Phase 1A sync 후 archive 경로 (Phase 1A sync 시 새로 만들어짐 — 예: pre-vX.Y)
$archive = Get-ChildItem "Dev/design/_archive/" -Directory `
  | Where-Object { $_.Name -match "BDR-current-2026-\d{2}-\d{2}-pre-v" } `
  | Sort-Object LastWriteTime -Descending `
  | Select-Object -First 1 -ExpandProperty FullName

$archive = Join-Path $archive "screens"
$target = "Dev/design/BDR-current/screens"

$gameFiles = @(
  "AdminGames.jsx",
  "AdminGameReports.jsx",
  "Games.jsx",
  "GameDetail.jsx",
  "CreateGame.jsx",
  "GuestApply.jsx",
  "Live.jsx",
  "GameResult.jsx",
  "Home.jsx",
  "MyActivity.jsx"   # Phase 1B 결과 — 묶음 1 sync 후 archive 로 이동됐을 수 있음 — 복원 안전
)

foreach ($f in $gameFiles) {
  $src = Join-Path $archive $f
  $dst = Join-Path $target $f
  if (Test-Path $dst) {
    Write-Host "⚠ 이미 존재 — 건너뜀: $f" -ForegroundColor Yellow
  } elseif (Test-Path $src) {
    Copy-Item -Path $src -Destination $dst
    Write-Host "✓ 복원: $f" -ForegroundColor Green
  } else {
    Write-Host "❌ 없음 — 수동 확인: $f" -ForegroundColor Red
  }
}

ls "$target/Games.jsx", "$target/GameDetail.jsx", "$target/CreateGame.jsx", "$target/GuestApply.jsx", "$target/Live.jsx", "$target/GameResult.jsx", "$target/Home.jsx", "$target/MyActivity.jsx", "$target/AdminGames.jsx", "$target/AdminGameReports.jsx"
```

→ **Phase 1B 의 UC1 MyActivity.jsx 가 Phase 1A sync 후 archive 로 이동된 경우** 복원 후 Phase 2B UC1 의뢰서 (Phase 1B "내 대회" 위에 "내 경기" + "내 매너" 추가) 진행 가능.

#### Step 2-2. BDR-current zip 묶기

```powershell
$zipPath = "$env:USERPROFILE\Downloads\BDR-current-phase2-baseline-2026-05-XX.zip"
Compress-Archive -Path "Dev/design/BDR-current/*" -DestinationPath $zipPath -Force
```

#### Step 2-3. Claude.ai 전달

**첨부**: zip + `game-admin-redesign-prompt-2026-05-25.md` + `game-user-redesign-prompt-2026-05-25.md` (3 첨부)

**메시지 템플릿**:
```
Phase 2 — 경기 영역 리디자인 의뢰 (총 10 시안) 시작합니다.

상위 계획서: game-user-admin-connectivity-plan-2026-05-25.md
의뢰서 2건: game-admin-redesign-prompt-2026-05-25.md (Phase 2A) + game-user-redesign-prompt-2026-05-25.md (Phase 2B)

baseline 준비 (Phase 1A sync 직후 + Phase 2 참조 9 파일 임시 복원):
- 첨부 zip = BDR-current/ 전체 (Phase 1A 박제 결과 + 2A/2B baseline 복원 9 + MyActivity 보존)
- Phase 2A 보강 2 시안 + Phase 2B 부분수정 7 + 보강 2 = 9 시안 baseline 위에 작업
- 신규 0 (UB1 GameResult 는 기존 시안 GameResult.jsx 의 status='completed' variant 분기 추가)

결재 룰 (2026-05-25 사용자 결재):
- BG7 = Hero 카로셀 위 sticky LIVE chip row (사용자 결정 §5 보존)
- BG2 = 평균 평점 + flag 종류만 / 개별 건수 ❌

양측 의존 핵심:
- BG1 신청 알림 = UD1 (관리자) + UA2 step indicator + UC1 마이페이지 양측 동시 박제
- BG2 매너 = UD2 매너 통계 + UC1 "내 매너" 카드 양측 동일 노출 룰

첨부 파일:
1. BDR-current-phase2-baseline-2026-05-XX.zip
2. game-admin-redesign-prompt-2026-05-25.md
3. game-user-redesign-prompt-2026-05-25.md

진행 요청:
- 두 의뢰서 §0 진입 표준 절차 (각 의뢰서 별로)
- §7 첫 응답 형식
- 박제 완료 후 새 zip 회신 (BDR v2.20/ 또는 동일 갱신)
- 양측 의존 갭 (BG1/BG2) 일관성 검증 필수
```

#### Step 2-4. 묶음 2 sync CLI 의뢰서

Cowork 에서 작성 — 묶음 1 sync 의뢰서와 동일 패턴:
- 위치: `Dev/design/prompts/phase-2-vX.Y-sync-cli-prompt-2026-05-XX.md`
- 차이: 시안 10 (보강 4 + 부분수정 5 + 신규 1) / Phase 1A 시안 보존 가드 필수

---

## 2. 본 가이드 vs 기존 가이드 (`phase-1A-claude-ai-delivery-guide-2026-05-26.md`)

| 항목 | 기존 (Phase 1A 단독) | 본 가이드 (1A + 2 통합) |
|------|-------------------|---------------------|
| 범위 | Phase 1A 10 시안 | Phase 1A 10 + Phase 2A 2 + Phase 2B 8 = **20 시안** |
| baseline 복원 | admin 5 파일 | admin 5 + 경기 9 = **14 파일** (2 묶음 분할) |
| Claude.ai 세션 | 1 | 1 (옵션 A) / **2** (옵션 B 권장) / 3 (옵션 C) |
| 의뢰서 첨부 | 1 | 1 (묶음 1) + 2 (묶음 2) = **3 총** |
| zip 묶기 | 1 회 | **2 회** (묶음 1 sync 후 묶음 2) |
| sync CLI 의뢰서 | 1 (Phase 1A) | **2** (Phase 1A + Phase 2 묶음) |
| 인코딩 영구 해결 | 권장 | **첫 sync 전 의무** (BOM 추가) |

→ **기존 가이드는 본 가이드의 묶음 1 부분** 으로 자연스럽게 포함됨. 별 가이드 삭제 ❌ — 본 가이드가 superset.

---

## 3. 본 가이드 자체 검수

- ✅ §0 통합 범위 + baseline 14 파일 (기존 가이드의 admin 5 + Phase 2 경기 9 추가)
- ✅ §0 3 옵션 (A 1 세션 / B 2 세션 권장 / C 3 세션) 비교
- ✅ §1 묶음 1 단계별 PowerShell (기존 가이드 답습) + 묶음 2 단계별 PowerShell (신규)
- ✅ §1 Step 0 인코딩 영구 해결 (BOM) 첫 sync 전 명시
- ✅ §2 기존 가이드와의 비교 — 기존 = 본 가이드의 묶음 1 (Phase 1A) 부분
- ✅ §1 묶음 2 Step 2-1 — Phase 1A sync 후 archive 자동 찾기 (가장 최근 pre-v 폴더) 패턴
- ✅ CLAUDE.md §🗂️ 단일 폴더 룰 준수 (임시 복원 → zip → sync 후 자동 archive)
- ✅ 결재 룰 (BG7 Hero 위 / BG2 평균+종류만) Step 2-3 메시지에 명시
- ✅ Phase 1B 의 MyActivity 보존 처리 (묶음 2 baseline 복원 list 에 포함)

---

## 부록 A — 통합 전달 직전 체크리스트 (수빈 본인 확인용)

### 묶음 1 — Phase 1A

```
☐ §1 Step 0 — 인코딩 영구 해결 (BOM) commit/push
☐ §1 Step 1-1 — admin baseline 5 파일 임시 복원
☐ §1 Step 1-2 — BDR-current zip 생성 (Phase 1A baseline)
☐ §1 Step 1-3 — Claude.ai 세션 1: zip + Phase 1A 의뢰서 전달
☐ Claude.ai 첫 응답 (§7 형식) "✅ BDR 디자인 의뢰 확인 — 대회 생성/관리 흐름 전면 리디자인" 확인
☐ Phase 1A 박제 zip 회신 도착 → Cowork 에 "Phase 1A zip 도착" 알림
☐ Cowork 또는 CLI 가 sync CLI 의뢰서 작성 (phase-1A-vX.Y-sync-cli-prompt)
☐ CLI 가 sync 실행 → phase-ledger Phase 1 ⑩ ✅ 완료 갱신
```

### 묶음 2 — Phase 2A + 2B

```
☐ 묶음 1 sync 완료 확인 (phase-ledger Phase 1 ⑩ ✅)
☐ §1 Step 2-1 — 경기 baseline 9 파일 임시 복원 (Phase 1A sync 후 archive 자동 찾기)
☐ §1 Step 2-2 — BDR-current zip 생성 (Phase 2 baseline)
☐ §1 Step 2-3 — Claude.ai 세션 2: zip + Phase 2A 의뢰서 + Phase 2B 의뢰서 전달 (3 첨부)
☐ Claude.ai 첫 응답 2건 — 각 의뢰서 별 §7 형식
☐ Phase 2 박제 zip 회신 도착 → Cowork 알림
☐ sync CLI 의뢰서 작성 (phase-2-vX.Y-sync-cli-prompt)
☐ CLI sync 실행 → phase-ledger Phase 2 ⑩ ✅ 완료 갱신
```

### Phase 1C / Phase 2C 운영 박제 (sync 후 별 작업)

```
☐ Phase 1A sync 후: Phase 1 운영 박제 의뢰서 (Phase 1B + Phase 1A 합산 PR ~16~19 그룹)
☐ Phase 2 sync 후: Phase 2 운영 박제 의뢰서 (PR ~10 그룹)
☐ subin → dev → main PR 결재 (CLAUDE.md §🚦)
```

---

## 부록 B — Phase 1A sync 옵션 결정 사전 안내 (기존 가이드 §2-1 답습)

본 가이드 §1 묶음 1 의 sync 단계 = 옵션 A (delta replace). Phase 1B 결과를 archive 로 이동 + Phase 1A 결과 박제 = BDR-current 가 Phase 1A 박제 결과로 갱신.

→ Phase 1B 시안은 **Phase 1A 의 pre-snapshot** (`_archive/BDR-current-2026-05-XX-pre-vX.Y/`) 에 보존. 묶음 2 의 baseline 복원 9 파일 중 MyActivity.jsx 가 본 pre-snapshot 에서 복원.

### 옵션 변경 시 영향

Phase 1B / Phase 1A 모두 merge overlay (옵션 B) 로 가면 BDR-current 누적 = 9 (1B) + 10 (1A) + 9 (2 baseline) = 28+ 파일. 단일 폴더 룰 약화 + Phase 1C 운영 박제 시 baseline 모호.

→ **옵션 A delta replace 유지 권장** (기존 가이드 답습).

---

## 부록 C — 본 가이드와 기존 4 가이드 / 의뢰서 관계 시각화

```
[Phase 1 점검 리포트] (Cowork 2026-05-25)
  └── tournament-user-admin-connectivity-plan-2026-05-25.md (B1~B7 갭)
        ↓
        ├── Phase 1A 의뢰: tournament-admin-redesign-prompt-2026-05-25.md (10 시안)
        └── Phase 1B 의뢰: tournament-user-redesign-prompt-2026-05-25.md (8+1 시안)
              ↓
              [Claude.ai 박제 → BDR v2.18 zip]
                  ↓
                  [Phase 1B sync CLI 의뢰: phase-1B-v2.18-sync-cli-prompt-2026-05-26.md]
                    ↓
                    [CLI sync 실행 → BDR-current = 15 파일] ✅ 2026-05-26

[Phase 1A Claude.ai 전달 가이드 (기존)] (다른 세션 2026-05-26)
  └── phase-1A-claude-ai-delivery-guide-2026-05-26.md (admin 5 baseline / Phase 1A 단독)
        ↓
        (본 통합 가이드의 묶음 1 부분으로 흡수)

[Phase 2 점검 리포트] (Cowork 2026-05-25)
  └── game-user-admin-connectivity-plan-2026-05-25.md (BG1~BG7 갭)
        ↓
        ├── Phase 2A 의뢰: game-admin-redesign-prompt-2026-05-25.md (2 시안)
        └── Phase 2B 의뢰: game-user-redesign-prompt-2026-05-25.md (8 시안)

[본 통합 가이드] (Cowork 2026-05-26 — 현재 문서)
  └── phase-1A+2-claude-ai-delivery-guide-2026-05-26.md
        ↓
        [묶음 1] Phase 1A 10 시안 (기존 가이드 답습)
        [묶음 2] Phase 2A 2 + Phase 2B 8 = 10 시안 (신규)
```

---

**가이드 끝.** 옵션 결정 (A 1 세션 / **B 2 세션 권장** / C 3 세션) 후 부록 A 체크리스트 따라 진행 / 막히는 부분 있으면 Cowork 에 보고.
