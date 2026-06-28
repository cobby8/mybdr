# Phase 1B (v2.18) — BDR-current sync CLI 의뢰서

> **의뢰일**: 2026-05-26
> **수신**: Claude CLI (mybdr 작업 디렉토리, `subin` 브랜치)
> **의뢰 작성**: Cowork (`Project: mybdr 메인`)
> **선행 자료**:
> - `Dev/design/prompts/tournament-user-redesign-prompt-2026-05-25.md` (의뢰 원문)
> - `Dev/design/prompts/tournament-user-admin-connectivity-plan-2026-05-25.md` (상위 계획서 / B1~B7 갭)
> - `.claude/phase-ledger.md` Phase 1 ⑩ 단계
> **현재 상태 (phase-ledger ⑩ 기준)**: Claude.ai 가 BDR v2.18 시안 박제 완료 (uploads/BDR v2 (2).zip 도착). **본 의뢰 = ⑩ sync 실행 + 회귀 검수 + phase-ledger 갱신 + commit/push.**
> **이번 의뢰 범위**: 운영 src/ 코드 변경 **0**. 시안 폴더 (`Dev/design/BDR-current/`) 동기화 + 문서 갱신만.
> **다음 Phase (별 의뢰)**: Phase 1C 운영 박제 (PR 8~13건). 본 의뢰 완료 후 별 의뢰서로 진행.

---

## 0. 진입 — 표준 절차 (CLAUDE.md "오늘 작업 시작하자" 체크리스트)

본 의뢰는 운영 코드 변경 0 이지만 **CLAUDE.md §🚦 "오늘 작업 시작하자" 체크리스트** 6 단계 의무. 진행 전 사용자 결재 받기.

```
□ 1. git remote -v   (origin = github.com/cobby8/mybdr 확인)
□ 2. git fetch origin --prune   + main / dev / subin 차이 print
□ 3. 현재 브랜치 = subin 인지 확인 (아니면 git checkout subin)
□ 4. .env 존재 + DATABASE_URL 키만 확인 (값 노출 ❌) — 운영 DB
□ 5. .env.local 존재 + localhost:3001 오버라이드 확인
□ 6. 위 5 단계 결과 요약 → "이대로 작업 시작해도 될까요?" 사용자 결재
```

→ **결재 전 파일 수정 / 브랜치 전환 / 머지 / 커밋 금지.**

---

## 1. 본 의뢰 한 줄 요약

```
uploads/BDR v2 (2).zip 안 Dev/design/BDR v2.18/ (9 파일) 을
scripts/sync-bdr-current.ps1 로 Dev/design/BDR-current/ 에 동기화
+ 운영→시안 갭 검증 (§🔄 룰) + phase-ledger ⑩ 완료 처리
+ commit/push.
```

---

## 2. zip 인벤토리 (사전 파악)

**zip 위치 (예시 — 실제 위치는 사용자가 지정)**:
```
사용자 다운로드 → C:\Users\<user>\Downloads\BDR v2 (2).zip
(또는 사용자가 mybdr 폴더 안 적당한 위치에 카피 — 단 git ignore 영역)
```

**zip 구조 (Cowork 검증 완료)**:
```
BDR v2 (2).zip/
├── CLAUDE.md (zip 자체 프로젝트 룰 — 참고용 / 운영 CLAUDE.md 와 별개)
├── MyBDR.html, components.jsx, screens/ (86), tokens.css ... (zip 최상위 = cumulative canvas)
└── Dev/design/
    ├── BDR v2.2 / v2.3 / ... / v2.16 / v2.17 / v2.18    ← v2.X 폴더들 (Claude.ai 가 히스토리 모두 첨부)
    └── ⭐ BDR v2.18/                                       ← 이번 sync 대상 (Phase 1B 9 파일)
        ├── README.md
        ├── index.html / tokens.css / shell.css / admin.css / shared.jsx
        ├── ua1~ud3 .html (preview 8 개)
        └── screens/
            ├── Tournaments.jsx                  (UA1 / 전면교체)
            ├── TournamentDetail.jsx             (UA2 / 부분수정)
            ├── TournamentEnroll.jsx             (UA3 / 부분수정)
            ├── TournamentCompleted.jsx          (UB1 / 신규 — status='completed' variant)
            ├── MyActivity.jsx                   (UC1 / 부분수정 — "내 대회" 섹션)
            ├── MyRegistrationStatus.jsx         (UC1 부속 / `--color-*` 교체)
            ├── AdminTournamentTeams.jsx         (UD1 / 보강)
            ├── AdminTournamentBracket.jsx      (UD2 / 보강)
            └── AdminTournamentSetupHub.jsx      (UD3 / 보강)
```

**B1~B7 갭 매핑** (의뢰 원문 부록 A 참조):
| 갭 | 사용자 측 시안 | 관리자 측 시안 |
|----|--------------|--------------|
| B1 신청 결과 통보 ★★★★★ | UA2 sidebar step + UC1 마이페이지 | UD1 알림 액션 |
| B2 종별 진입 ★★★★ | UA2 종별 selector chip row | (Phase 1A) |
| B3 결제 흐름 ★★★★ | UA3 결제 step + 사후 안내 | UD1 payment 컬럼 |
| B4 정원 진행도 ★★★ | UA1 + UA2 정원 progress | UD1 진행도 카드 |
| B5 대진 변경 알림 ★★★★ | UA2 bracket 탭 버전 + 본인 팀 하이라이트 | UD2 publish 알림 + 버전 |
| B6 종료 발표 ★★★★★ | UB1 종료 variant | (Phase 1A) |
| B7 공개 게이트 ★★★ | UA1 status 뱃지 | UD3 사용자 미리보기 link |

---

## 3. ⚠ 사용자 결정 필요 — sync 방식 (delta replace vs merge overlay)

> **이 결정 받기 전 sync 실행 ❌.** 현재 BDR-current/ 의 파일 수 (149) 와 v2.18 delta (9 파일) 간 차이 큼.

### 3-A. 현재 상태 (CLI 가 사전 확인)

```powershell
# 사전 확인 (의뢰 §0 결재 후 실행)
$current = (Get-ChildItem -Path "Dev/design/BDR-current/screens/" -File).Count
$v218 = 9   # zip 안 Dev/design/BDR v2.18/screens/ 파일 수 (cowork 확인)
Write-Host "현재 BDR-current/screens/ = $current files"
Write-Host "v2.18 delta              = $v218 files"
Write-Host "차이                       = $($current - $v218) files (sync 후 -replace 일 시 손실 vs overlay 일 시 보존)"
```

### 3-B. 옵션 두 가지

#### 옵션 A — 스크립트 기본 (delta replace) ⭐ 권장 (기존 패턴과 일관성)

```
1) 현재 BDR-current/ (149 파일 + 부속) → _archive/BDR-current-2026-05-26-pre-v2.18/   (전체 보존)
2) zip 안 Dev/design/BDR v2.18/ (9 파일 + 부속) → BDR-current/                          (새로 카피)
3) 결과: BDR-current/ = 9 파일 + v2.18 부속 (README/tokens/shell/shared/index 등)
```

- **장점**: 스크립트 자동 / 기존 sync 패턴 (v2.5 / v2.14 / v2.16 동일 처리) / pre-snapshot 으로 손실 0
- **단점**: BDR-current/ 가 한동안 작아짐 (운영→시안 역박제로 점차 회복)
- **이전 sync 검증**: v2.16 sync commit (`d66eb90`) 도 동일 패턴 — 정상 작동

#### 옵션 B — Merge overlay (수동 — 145 파일 유지)

```
1) 현재 BDR-current/ → _archive/BDR-current-2026-05-26-pre-v2.18/   (전체 보존)
2) pre-snapshot 그대로 BDR-current/ 로 복원
3) zip 안 Dev/design/BDR v2.18/screens/ 의 9 파일만 BDR-current/screens/ 에 덮어쓰기
4) v2.18 의 README/tokens/shared 같은 root 파일은 별 `_v218-meta/` 폴더로 보존 (또는 무시)
```

- **장점**: 145 파일 (홈 / 게임 / 단체 / 팀 / 코트 등) 유지
- **단점**: 기존 sync 패턴과 다름 (시안 단일 source 룰 §🗂️ 의 "활성 시안 = BDR-current" 의미 약화)
- **위험**: pre-snapshot 의 14건 5/3~5/6 변경 (운영→시안 갭, CLAUDE.md §🔄 위반 사례) 도 함께 끌고 옴 — 별 회귀 검수 필수

### 3-C. PM (수빈) 결정 받을 질문

```
질문 1. 옵션 A (delta replace, 권장) vs 옵션 B (merge overlay) 어느 쪽으로 진행?
질문 2. 옵션 A 선택 시 — 회귀 검수 (§🔄 운영→시안 갭) 는 본 의뢰에서 진행 vs 별 의뢰?
질문 3. 옵션 B 선택 시 — 145 파일에 stale 영역이 있어 별 reverse-sync 가 필요한가?
```

→ 권장 = 옵션 A + 회귀 검수 별 의뢰 (Phase 1A 의뢰 도착 후 함께 처리).

---

## 4. 실행 단계 (옵션 A 기준 — 사용자 결재 후)

### Step 1. DryRun 미리보기 (필수)

```powershell
# zip 위치는 사용자 지정 (예시)
$Zip = "$HOME\Downloads\BDR v2 (2).zip"   # ← 사용자 실 경로로 교체

# DryRun = 실 변경 0 / 시뮬레이션만
.\scripts\sync-bdr-current.ps1 -ZipPath $Zip -NewVersion "v2.18" -DryRun
```

**검증 항목** (DryRun 출력에서 확인):
- [ ] Step 0 — `BDR-current/ git clean — 안전` 또는 uncommitted 경고 (있으면 PM 결재)
- [ ] Step 1 — zip 풀이 임시 폴더 `$env:TEMP/bdr-sync-YYYYMMDDHHMMSS`
- [ ] Step 2 — 이동 대상 = `_archive/BDR-current-2026-05-26-pre-v2.18`
- [ ] Step 3 — 카피 source = `Dev/design/BDR v2.18/` (zip 안 경로)
- [ ] Step 4 — 옛 시안 보존 검색 — zip 최상위 `BDR *` 폴더 0건 (모두 `Dev/design/` 안)
- [ ] Step 5 — `Dev/design/README.md` 헤드 갱신

### Step 2. 실 sync 실행

```powershell
# DryRun 통과 후
.\scripts\sync-bdr-current.ps1 -ZipPath $Zip -NewVersion "v2.18"
```

**완료 후 즉시 검증**:
```powershell
# 1. BDR-current/ 가 v2.18 9 파일로 교체되었는지
ls "Dev/design/BDR-current/screens/" | Measure-Object | Select Count

# 2. _archive/ 에 pre-snapshot 들어갔는지
ls "Dev/design/_archive/BDR-current-2026-05-26-pre-v2.18/screens/" | Measure-Object | Select Count

# 3. README.md 헤드 갱신 확인
Get-Content "Dev/design/README.md" -TotalCount 3
```

### Step 3. 회귀 검수 — 위반 자동 검수 4 케이스 (00 §회귀 방지)

9 시안 모두 (UA1~UD3) 다음 4 케이스 통과 확인. v2.18 README 의 §자체 검수 가 ✅ 보고했지만 CLI 가 1 회 grep 으로 재검증.

```bash
# 케이스 1 — main bar 우측에 "더보기 ▼" dropdown / "RDM" 아바타 노출
grep -rn '더보기.*▼\|더보기.*dropdown\|RDM' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx Dev/design/BDR-current/shell.css 2>/dev/null
# 기대: 0 hits (사용자 측 5 시안 = UA1/UA2/UA3/UB1/UC1)

# 케이스 2 — 모바일에서 "☀ 라이트 ☾ 다크" 듀얼 라벨
grep -rn '라이트.*다크\|☀.*☾' Dev/design/BDR-current/shared.jsx Dev/design/BDR-current/screens/ 2>/dev/null
# 기대: PC 듀얼만 (모바일 단일 아이콘 분기 있으면 OK)

# 케이스 3 — 검색/쪽지/알림 버튼에 border / bg 박스 (.btn / .btn--sm)
grep -rn 'app-nav__icon-btn.*btn--sm\|btn.*app-nav__icon-btn' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx 2>/dev/null
# 기대: 0 hits

# 케이스 4 — main bar 우측 아이콘 순서 = [다크, 검색, 쪽지, 알림, 햄버거] 검증
# (수동 — shared.jsx 의 AppNav 컴포넌트 검토)
```

```bash
# 케이스 5 — 디자인 토큰 룰 (룰 10~12)
# 5-1. `--color-*` 폐기 토큰 (v2.18 의뢰서 §4-C 강조)
grep -rn '\-\-color-' Dev/design/BDR-current/screens/ Dev/design/BDR-current/*.css 2>/dev/null
# 기대: 0 hits

# 5-2. 하드코딩 hex (BDR Red / Navy / Info / 핑크 / 살몬 / 코랄)
grep -rnE '#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b' Dev/design/BDR-current/screens/ 2>/dev/null | grep -v "tokens.css"
# 기대: tokens.css 외 0 hits (단 mock data 의 단체 로고 URL 등 예외는 허용)

# 5-3. lucide-react import
grep -rn 'from .lucide-react' Dev/design/BDR-current/screens/ 2>/dev/null
# 기대: 0 hits

# 5-4. pill `9999px` 라운딩
grep -rn '9999px\|border-radius.*9999' Dev/design/BDR-current/*.css 2>/dev/null
# 기대: 정사각형 50% 패턴 (W=H circular) 외 0 hits
```

→ **위반 발견 시 즉시 중단** + PM 보고 + v2.18 시안 자체 수정 의뢰 회신.

### Step 4. 가짜링크 검수 (룰 §8)

```bash
# 더보기 5그룹 IA — 가짜링크 4건 신규 추가 X
grep -rnE 'gameResult|gameReport|guestApps|/referee\b' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx 2>/dev/null
# 기대: 0 hits (단 "refereeInfo" 또는 코드 변수 이름 외)
```

### Step 5. phase-ledger ⑩ 단계 갱신

`Dev/design/_archive/...` 가 아닌 **`.claude/phase-ledger.md`** Phase 1 표 갱신:

```markdown
| ⑩ sync 실행 | 1B (v2.18) | ✅ 완료 | CLI | 2026-05-26 | `scripts/sync-bdr-current.ps1 -ZipPath "<경로>" -NewVersion "v2.18"` 실행 / BDR-current = 9 파일 (UA1~UD3) / pre-snapshot = `_archive/BDR-current-2026-05-26-pre-v2.18/` |
```

→ Phase 1 다음 액션 표도 ⑩ 항목 체크박스 처리:
```markdown
☑ ⑩ Phase 1B v2.18 sync — **2026-05-26 완료** — pre-snapshot 보존 / 회귀 검수 통과
```

### Step 6. commit (CLAUDE.md §🚦 룰 준수 — main 직접 push ❌ / subin 브랜치 작업)

```bash
git status   # 사전 확인 — 의도한 변경만
git add Dev/design/ .claude/phase-ledger.md
git commit -m "design: BDR-current sync v2.18 — Phase 1B 대회 사용자 측 + 연결 다리 (9 시안)

UA1 Tournaments (전면교체) / UA2 TournamentDetail / UA3 TournamentEnroll
UB1 TournamentCompleted (신규 status variant) / UC1 MyActivity + MyRegistrationStatus
UD1 AdminTournamentTeams / UD2 AdminTournamentBracket / UD3 AdminTournamentSetupHub

B1~B7 갭 7건 해소 시안 박제 완료. 운영 코드 변경 0.
이전 BDR-current → _archive/BDR-current-2026-05-26-pre-v2.18/ 보존.

phase-ledger ⑩ ✅ 완료. 다음 = Phase 1C 운영 박제 별 의뢰."
git push origin subin
```

→ 이후 GitHub 에서 `subin → dev` PR 생성. **dev → main 머지는 수빈 / 원영 본인 결재** (CLAUDE.md §🚦).

---

## 5. 실패 / 롤백 처리

### 5-A. sync 스크립트 실패 시

```powershell
# pre-snapshot 가 _archive/ 에 들어간 상태에서 카피 실패 시 — BDR-current/ 비어있음
# 복원:
Move-Item -Path "Dev/design/_archive/BDR-current-2026-05-26-pre-v2.18" -Destination "Dev/design/BDR-current"

# 임시 폴더 정리:
Remove-Item -Path "$env:TEMP/bdr-sync-*" -Recurse -Force -ErrorAction SilentlyContinue

# zip 자체 문제면 → PM 보고 → Claude.ai 에 새 zip 의뢰
```

### 5-B. 회귀 검수 (Step 3~4) 위반 발견 시

```
1) sync 결과 자체는 보존 (BDR-current = v2.18 그대로)
2) git add ... ❌ — commit 보류
3) 위반 항목 보고서 작성 → Dev/design/prompts/phase-1B-v2.18-violation-report-2026-05-26.md
4) PM 결재:
   - Claude.ai 시안 재의뢰 (zip 재발행) — 권장
   - 또는 CLI 가 시안 수동 수정 (사용자 결정 §1~§8 영향 0 인 경우만)
```

### 5-C. phase-ledger 갱신 실패 시

```
phase-ledger.md 는 commit 의 일부 (Step 6) 라서 commit 전 직접 검토 가능.
충돌 / 잘못 갱신 시 git checkout .claude/phase-ledger.md 로 원복 후 재시도.
```

---

## 6. 본 의뢰 후 다음 액션 (별 의뢰서 — 본 의뢰 범위 ❌)

### 6-A. Phase 1A 의뢰 (관리자 10 시안) — phase-ledger ⑦

수빈이 `tournament-admin-redesign-prompt-2026-05-25.md` 를 Claude.ai Project 에 별 zip 으로 전달. 결과 zip 도착 후 동일 절차로 sync (v2.19 또는 v2.18 갱신).

→ **본 의뢰가 끝나는 시점에 CLI 가 수빈에게 알림**: "Phase 1A 의뢰 Claude.ai 에 보내고 zip 받으면 같은 절차로 sync 할 수 있습니다. 알려주세요."

### 6-B. Phase 1C 운영 박제 — phase-ledger ⑪~⑬

별 의뢰서 작성 예정 (Cowork 가 별 세션에서). 예상 PR 그룹:

**사용자 측 PR 5건** (B 갭 직접 영향):
- PR-1C-U1 `/tournaments` 전면교체 (UA1)
- PR-1C-U2 `/tournaments/[id]` 보강 (UA2 — 종별 selector / B5 버전 표시 / sidebar 강화)
- PR-1C-U3 `/tournaments/[id]/join` 결제 step 강화 (UA3)
- PR-1C-U4 `/tournaments/[id]` completed variant 추가 (UB1)
- PR-1C-U5 `/profile/activity` "내 대회" + `my-registration-status.tsx` `--color-*` 교체 (UC1)

**관리자 측 PR 3건**:
- PR-1C-A1 AdminTournamentTeams (B1+B3+B4)
- PR-1C-A2 AdminTournamentBracket (B5)
- PR-1C-A3 AdminTournamentSetupHub (B7 카드 추가)

→ 총 ~8 PR. Phase 1A 운영 박제 (~7~10 PR) 와 함께 = Phase 1C 총 ~15~18 PR.

### 6-C. 운영 → 시안 동기화 (§🔄 갭 검증)

CLAUDE.md §🔄 룰 의 분기별 갭 검증 명령 1 회 실행:

```bash
# BDR-current/ 마지막 commit (= 본 sync = 2026-05-26)
DATE=$(git log -1 --format="%ai" -- Dev/design/BDR-current/)
echo "BDR-current 마지막 갱신: $DATE"

# 운영 src/ UI commit (위 날짜 이후)
git log --since="$DATE" --oneline -- "src/components/" "src/app/(web)/" | grep -iE "ui|design|nav|badge|hero|card|modal|drawer|dropdown"
# 결과 비어있어야 stale 0
```

본 sync 직후이므로 결과 0 예상. 별 의뢰로 분기별 자동 실행 권장.

---

## 7. CLI 첫 응답 형식 (의뢰 받은 직후)

```
✅ Phase 1B v2.18 BDR-current sync 의뢰 확인.

이해:
- uploads/BDR v2 (2).zip 안 Dev/design/BDR v2.18/ (9 파일) → Dev/design/BDR-current/ sync
- 현재 BDR-current/screens = 149 파일 / v2.18 delta = 9 파일 → §3 사용자 결정 필요
- 운영 코드 변경 ❌ — 시안 폴더 + phase-ledger + commit/push 만
- 후속 = Phase 1A sync (별 의뢰) + Phase 1C 운영 박제 (별 의뢰)

진행 전 PM 결재:
1. §0 "오늘 작업 시작하자" 체크리스트 6 단계 (브랜치 / git / .env / .env.local)
2. §3 sync 방식 옵션 A (delta replace, 권장) vs 옵션 B (merge overlay)
3. zip 실제 경로 확인 (예: $HOME\Downloads\BDR v2 (2).zip)

결재 받으면 §4 Step 1 DryRun 부터 시작.
```

---

## 8. 본 의뢰 자체 검수 (Cowork 작성 시점)

- ✅ CLAUDE.md §🚦 워크플로우 룰 명시 (main 직접 push ❌ / subin 브랜치 / `오늘 작업 시작하자` 6 단계)
- ✅ CLAUDE.md §🗂️ 단일 폴더 룰 (BDR-current 단일) 준수
- ✅ CLAUDE.md §🔄 운영 → 시안 동기화 룰 §6-C 회귀 검수 포함
- ✅ §🚦 destructive 작업 사용자 결재 (§3 사용자 결정 + §4 Step 1 DryRun 필수)
- ✅ 00-master-guide 13 룰 회귀 검수 (§4 Step 3~4) 포함
- ✅ 사용자 결정 §1~§8 보존 (의뢰 원문 §5 + v2.18 README ✅ 보고 — 본 sync 자체는 결정 변경 없음)
- ✅ phase-ledger ⑩ 갱신 단계 (§4 Step 5) 명시
- ✅ commit 메시지 템플릿 (§4 Step 6) 포함 — B1~B7 갭 매핑 / pre-snapshot 위치 명시
- ✅ 롤백 절차 (§5) 포함
- ✅ 다음 의뢰 (Phase 1A sync / Phase 1C 운영 박제) 분리 명시 (본 의뢰 범위 ❌)
- ✅ CLI 첫 응답 형식 (§7) 표준 — 진행 전 결재 받기

---

## 부록 A — 핵심 검증 명령 요약 (CLI 가 복사해서 실행)

```powershell
# ─── 사전 결재 (§0) ───
git remote -v
git fetch origin --prune
git status -sb
git branch --show-current
Test-Path .env, .env.local

# ─── §3 사용자 결정 (sync 방식) ───
$current = (Get-ChildItem -Path "Dev/design/BDR-current/screens/" -File).Count
Write-Host "BDR-current/screens/ = $current files (delta replace 시 9 파일로 축소 / pre-snapshot 에 보존)"

# ─── §4 Step 1 DryRun ───
$Zip = "<사용자가 지정한 zip 경로>"
.\scripts\sync-bdr-current.ps1 -ZipPath $Zip -NewVersion "v2.18" -DryRun

# ─── §4 Step 2 실 sync ───
.\scripts\sync-bdr-current.ps1 -ZipPath $Zip -NewVersion "v2.18"

# ─── §4 Step 3~4 회귀 검수 (bash 사용 — Windows 면 grep equivalent) ───
grep -rnE 'gameResult|gameReport|guestApps|/referee\b' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx
grep -rn '\-\-color-' Dev/design/BDR-current/screens/ Dev/design/BDR-current/*.css
grep -rn 'from .lucide-react' Dev/design/BDR-current/screens/
grep -rn '9999px' Dev/design/BDR-current/*.css

# ─── §4 Step 6 commit + push ───
git add Dev/design/ .claude/phase-ledger.md
git commit -m "design: BDR-current sync v2.18 — Phase 1B 대회 사용자 측 + 연결 다리 (9 시안)"
git push origin subin
```

---

## 부록 B — phase-ledger ⑩ 갱신 정확 위치

`.claude/phase-ledger.md` 13~25 행 영역 중 24 행 = 현재 `⑩ sync 실행 = ⏳ 다른 세션 처리`.

**Before**:
```markdown
| **⑩ sync 실행** | 1B (v2.18) | ⏳ 다른 세션 처리 | **수빈 — 별 세션 (CLI용 의뢰서)** | 2026-05-25 | zip 도착 (uploads/BDR v2 (2).zip). 본 세션 외부에서 별 CLI 의뢰서로 sync + 후속 박제 처리. 명령 reference: `scripts/sync-bdr-current.ps1 -ZipPath "<uploads 경로>" -NewVersion "v2.18" -DryRun` |
```

**After (CLI 가 커밋할 행)**:
```markdown
| **⑩ sync 실행** | 1B (v2.18) | ✅ 완료 | CLI | 2026-05-26 | `sync-bdr-current.ps1 -NewVersion "v2.18"` 실행 완료. BDR-current = 9 파일 (UA1~UD3) / pre-snapshot = `_archive/BDR-current-2026-05-26-pre-v2.18/`. 위반 검수 4 케이스 통과. |
```

**의뢰 끝.** CLI 가 본 파일 그대로 읽고 §7 형식으로 첫 응답 → §0 결재 받기 → §4 단계별 실행.
