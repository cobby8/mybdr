<#
.SYNOPSIS
  BDR-current 시안 폴더를 새 zip 으로 동기화 (CLAUDE.md §🗂️ 5단계 자동화).

.DESCRIPTION
  Claude.ai BDR 디자인 시스템 관리 Project 에서 받은 zip 을 사용해
  Dev/design/BDR-current/ 를 새 시안으로 교체. 기존 시안은 _archive/ 로 보관.

  단계:
    1. zip 풀이 → 임시 폴더
    2. 기존 BDR-current/ → _archive/BDR <version>/ 이동
    3. 새 zip 의 Dev/design/BDR <version>/ → BDR-current/ 카피
    4. zip 최상위 옛 시안 (있으면) → _archive/v2-original/
    5. Dev/design/README.md 갱신 + commit 명령 print (자동 commit ❌ — 수빈 검토 후)

.PARAMETER ZipPath
  Claude.ai 에서 받은 zip 파일 경로 (필수). 예: "C:\Downloads\BDR-v2.17.zip"

.PARAMETER NewVersion
  시안 안 폴더의 버전 (필수). 예: "v2.17"
  zip 안에 Dev/design/BDR <NewVersion>/ 가 있어야 함.

.PARAMETER ArchiveLabel
  옵션 — 기존 BDR-current/ 를 _archive/ 에 보관할 때 사용할 라벨.
  미지정 시 자동 = "BDR-current-YYYY-MM-DD-pre-<NewVersion>"

.PARAMETER DryRun
  옵션 — 실제 파일 변경 X / 시뮬레이션만.

.EXAMPLE
  .\scripts\sync-bdr-current.ps1 -ZipPath "C:\Downloads\BDR-v2.17.zip" -NewVersion "v2.17" -DryRun

.EXAMPLE
  .\scripts\sync-bdr-current.ps1 -ZipPath "C:\Downloads\BDR-v2.17.zip" -NewVersion "v2.17"

.NOTES
  CLAUDE.md §🗂️ 단일 폴더 룰 (2026-05-01) 준수.
  WORKFLOW.md §6 BDR-current sync 자동화 참조.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [string]$ZipPath,

  [Parameter(Mandatory=$true)]
  [string]$NewVersion,

  [Parameter(Mandatory=$false)]
  [string]$ArchiveLabel,

  [Parameter(Mandatory=$false)]
  [switch]$DryRun
)

# ────────────────────────────────────────────────────────────────
# 0. 환경 변수 / 경로
# ────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$RepoRoot = (Get-Item -Path $PSScriptRoot).Parent.FullName
$DevDesign = Join-Path $RepoRoot "Dev\design"
$BdrCurrent = Join-Path $DevDesign "BDR-current"
$Archive = Join-Path $DevDesign "_archive"
$Readme = Join-Path $DevDesign "README.md"
$TempDir = Join-Path $env:TEMP "bdr-sync-$(Get-Date -Format 'yyyyMMddHHmmss')"

if (-not $ArchiveLabel) {
  $ArchiveLabel = "BDR-current-$(Get-Date -Format 'yyyy-MM-dd')-pre-$NewVersion"
}

$ArchiveTarget = Join-Path $Archive $ArchiveLabel

# ────────────────────────────────────────────────────────────────
# 1. 사전 검증
# ────────────────────────────────────────────────────────────────

function Write-Step($num, $msg) {
  Write-Host ""
  Write-Host "━━ Step $num ━━ $msg" -ForegroundColor Cyan
}

function Write-DryRun($msg) {
  Write-Host "  [DRY-RUN] $msg" -ForegroundColor Yellow
}

function Write-Action($msg) {
  Write-Host "  ✓ $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
  Write-Host "  ⚠ $msg" -ForegroundColor Yellow
}

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "BDR-current sync (Claude.ai zip → Dev/design/BDR-current/)" -ForegroundColor Blue
Write-Host "  ZipPath:      $ZipPath" -ForegroundColor Gray
Write-Host "  NewVersion:   $NewVersion" -ForegroundColor Gray
Write-Host "  ArchiveLabel: $ArchiveLabel" -ForegroundColor Gray
Write-Host "  DryRun:       $DryRun" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Blue

# 1-1. zip 파일 존재 확인
if (-not (Test-Path $ZipPath)) {
  Write-Error "ZipPath 파일이 없습니다: $ZipPath"
  exit 1
}

# 1-2. Dev/design/ 경로 확인
if (-not (Test-Path $DevDesign)) {
  Write-Error "Dev/design/ 경로가 없습니다: $DevDesign"
  exit 1
}

# 1-3. BDR-current/ 가 git uncommitted 인지 확인 (안전 가드)
Write-Step "0" "사전 검증 — git 상태 확인"
Push-Location $RepoRoot
try {
  $GitStatus = git status --porcelain "Dev/design/BDR-current" 2>$null
  if ($GitStatus) {
    Write-Warn "BDR-current/ 에 uncommitted 변경 있음:"
    $GitStatus | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkYellow }
    Write-Warn "이 변경은 _archive/$ArchiveLabel/ 으로 함께 이동됩니다."
    Write-Host ""
    if (-not $DryRun) {
      $confirm = Read-Host "계속 진행? (yes/no)"
      if ($confirm -ne "yes") {
        Write-Host "중단됨." -ForegroundColor Red
        Pop-Location
        exit 0
      }
    }
  } else {
    Write-Action "BDR-current/ git clean — 안전"
  }
} catch {
  Write-Warn "git 명령 실패 (무시 — git 외부에서 실행했을 수 있음)"
}
Pop-Location

# ────────────────────────────────────────────────────────────────
# 2. Step 1: zip 풀이 → 임시 폴더
# ────────────────────────────────────────────────────────────────

Write-Step "1" "zip 풀이 → 임시 폴더 ($TempDir)"

if ($DryRun) {
  Write-DryRun "Expand-Archive -Path '$ZipPath' -DestinationPath '$TempDir'"
} else {
  New-Item -Path $TempDir -ItemType Directory -Force | Out-Null
  Expand-Archive -Path $ZipPath -DestinationPath $TempDir -Force
  Write-Action "풀이 완료"
}

# 풀이 결과 안에 BDR <NewVersion>/ 찾기
$NewVersionFolder = $null
if (-not $DryRun) {
  $candidates = Get-ChildItem -Path $TempDir -Recurse -Directory -Filter "BDR $NewVersion" -ErrorAction SilentlyContinue
  if ($candidates.Count -eq 0) {
    Write-Error "zip 안에 'BDR $NewVersion/' 폴더를 찾지 못했습니다."
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
  }
  $NewVersionFolder = $candidates[0].FullName
  Write-Action "새 시안 폴더 찾음: $NewVersionFolder"
} else {
  Write-DryRun "zip 안 'BDR $NewVersion/' 폴더 검색"
  $NewVersionFolder = "(dry-run-placeholder)"
}

# ────────────────────────────────────────────────────────────────
# 3. Step 2: 기존 BDR-current/ → _archive/<ArchiveLabel>/
# ────────────────────────────────────────────────────────────────

Write-Step "2" "기존 BDR-current/ → _archive/$ArchiveLabel/"

if (Test-Path $BdrCurrent) {
  if ($DryRun) {
    Write-DryRun "Move-Item -Path '$BdrCurrent' -Destination '$ArchiveTarget'"
  } else {
    if (Test-Path $ArchiveTarget) {
      Write-Error "이미 존재하는 archive: $ArchiveTarget"
      Write-Error "  -ArchiveLabel 으로 다른 라벨 지정 필요"
      Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
      exit 1
    }
    New-Item -Path $Archive -ItemType Directory -Force | Out-Null
    Move-Item -Path $BdrCurrent -Destination $ArchiveTarget
    Write-Action "이동 완료"
  }
} else {
  Write-Warn "BDR-current/ 가 없습니다 — Step 2 건너뜀 (첫 sync 가능성)"
}

# ────────────────────────────────────────────────────────────────
# 4. Step 3: 새 zip 의 BDR <version>/ → BDR-current/
# ────────────────────────────────────────────────────────────────

Write-Step "3" "새 시안 → BDR-current/"

if ($DryRun) {
  Write-DryRun "Copy-Item -Path '$NewVersionFolder' -Destination '$BdrCurrent' -Recurse"
} else {
  Copy-Item -Path $NewVersionFolder -Destination $BdrCurrent -Recurse
  Write-Action "카피 완료"
}

# ────────────────────────────────────────────────────────────────
# 5. Step 4: zip 최상위 옛 시안 (있으면) → _archive/v2-original/
# ────────────────────────────────────────────────────────────────

Write-Step "4" "zip 최상위 옛 시안 보존 (있으면)"

if (-not $DryRun) {
  $TopLevelOldDesigns = Get-ChildItem -Path $TempDir -Directory | Where-Object {
    $_.Name -match "^BDR " -and $_.Name -ne "BDR $NewVersion"
  }
  if ($TopLevelOldDesigns.Count -gt 0) {
    $V2Original = Join-Path $Archive "v2-original"
    New-Item -Path $V2Original -ItemType Directory -Force | Out-Null
    foreach ($old in $TopLevelOldDesigns) {
      $target = Join-Path $V2Original $old.Name
      if (Test-Path $target) {
        Write-Warn "이미 존재 — 건너뜀: $($old.Name)"
      } else {
        Move-Item -Path $old.FullName -Destination $target
        Write-Action "옛 시안 보존: $($old.Name) → _archive/v2-original/"
      }
    }
  } else {
    Write-Action "zip 최상위 옛 시안 없음 — 건너뜀"
  }
} else {
  Write-DryRun "zip 최상위 'BDR *' 폴더 검색 + _archive/v2-original/ 으로 이동"
}

# ────────────────────────────────────────────────────────────────
# 6. Step 5: README.md 갱신
# ────────────────────────────────────────────────────────────────

Write-Step "5" "Dev/design/README.md 갱신"

$ReadmeHeader = @"
<!-- AUTO-SYNCED: BDR-current = $NewVersion ($(Get-Date -Format 'yyyy-MM-dd HH:mm')) -->
<!-- 이전 시안 = _archive/$ArchiveLabel/ -->

"@

if (Test-Path $Readme) {
  if ($DryRun) {
    Write-DryRun "Dev/design/README.md 헤드에 sync 정보 삽입"
  } else {
    $existing = Get-Content -Path $Readme -Raw
    # 기존 AUTO-SYNCED 블록 제거
    $cleaned = $existing -replace "(?s)^<!-- AUTO-SYNCED:.*?-->\s*<!-- 이전 시안.*?-->\s*", ""
    Set-Content -Path $Readme -Value ($ReadmeHeader + $cleaned) -NoNewline
    Write-Action "README.md 헤드 갱신"
  }
} else {
  Write-Warn "Dev/design/README.md 없음 — Step 5 건너뜀"
}

# ────────────────────────────────────────────────────────────────
# 7. 임시 폴더 정리
# ────────────────────────────────────────────────────────────────

Write-Step "6" "임시 폴더 정리"

if ($DryRun) {
  Write-DryRun "Remove-Item -Path '$TempDir' -Recurse -Force"
} else {
  if (Test-Path $TempDir) {
    Remove-Item -Path $TempDir -Recurse -Force
    Write-Action "임시 폴더 삭제"
  }
}

# ────────────────────────────────────────────────────────────────
# 8. 최종 — commit 명령 print (자동 commit ❌)
# ────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Green
if ($DryRun) {
  Write-Host "DRY-RUN 완료. 실제 변경 없음." -ForegroundColor Yellow
  Write-Host "실 실행하려면 -DryRun 제거 후 다시 실행:" -ForegroundColor Yellow
  Write-Host "  .\scripts\sync-bdr-current.ps1 -ZipPath '$ZipPath' -NewVersion '$NewVersion'" -ForegroundColor Gray
} else {
  Write-Host "✅ sync 완료. 검토 후 다음 명령으로 commit:" -ForegroundColor Green
  Write-Host ""
  Write-Host "  git add Dev/design/" -ForegroundColor Gray
  Write-Host "  git status   # 변경 확인" -ForegroundColor Gray
  Write-Host "  git commit -m `"design: BDR-current sync $NewVersion`"" -ForegroundColor Gray
  Write-Host ""
  Write-Host "그 후 phase-ledger 의 ⑩ 단계 상태 = '✅ 완료' 로 갱신 (Cowork 에 알리거나 직접 수정)." -ForegroundColor Cyan
}
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Green
