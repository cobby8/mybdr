# Phase 3 (v2.21) — BDR-current sync CLI 의뢰서

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행 박제**: Phase 1 (v2.18 + v2.19) sync ✅ + Phase 2 (v2.20) 박제 + Phase 3 (v2.21) 박제 — Phase 2 sync ⏸ 대기 / Phase 3 sync ⏸ 대기
> **선행 의뢰**: `phase-2-v2.20-sync-cli-prompt-2026-05-28.md` (동일 패턴 — Phase 3 차이만 명시) + `phase-1A-v2.19-sync-cli-prompt-2026-05-26.md`
> **운영 코드 변경**: **0** — 시안 sync + 회귀 검수 + ledger + commit/push 만. Phase 2C + 3C (운영 박제) 는 별 Phase
> **본 의뢰의 특수성**: ★ **v2.21 은 v2.20 박제 결과를 carry-over 로 모두 포함** → v2.21 sync 1 회 = Phase 2 sync + Phase 3 sync **동시 처리**

---

## 1. 한 줄 요약

`uploads/BDR v2 (6).zip` 안 `Dev/design/BDR v2.21/` (Phase 3 박제 7 시안 + Phase 2 박제 10 시안 carry-over) 를 `sync-bdr-current.ps1` 로 `BDR-current/` 에 동기화 → 회귀 검수 (4+8+Phase 2 특수 4+Phase 3 특수 4 = 20 케이스) → phase-ledger Phase 2 ⑩ + Phase 3 ⑩ **동시 ✅** → commit/push.

---

## 2. 사전 점검 + 옵션 결재 (CLAUDE.md "오늘 작업 시작하자" 6 단계)

```
□ git remote -v / fetch / 브랜치 = subin / .env / .env.local
□ 현재 BDR-current/ = v2.19 cumulative (Phase 1A + Phase 1B + Phase 2 baseline 10 jsx carry-over)
   ※ Phase 2 sync 미실행 상태 — v2.21 가 v2.20 superset 이므로 v2.21 sync 가 둘 다 처리
□ phase-ledger Phase 2 ⑨ + Phase 3 ⑨ zip 도착 = ✅ 확인 (각각 BDR v2 (5).zip + BDR v2 (6).zip)
□ phase-ledger Phase 2 ⑩ + Phase 3 ⑩ = ⏸ → 본 sync 1 회로 **둘 다 ✅** 갱신
□ Phase 1C unstaged 변경 = 0 (PR-1C-1 #650 이후 subin 브랜치 깨끗 / .gitignore chore commit 처리 완료 가정)
```

### 옵션 결재 — sync 횟수 (사용자 결재 1 회)

**옵션 A (권장)** — **v2.21 1 회 sync** (Phase 2 + Phase 3 동시):
- BDR-current/ 가 v2.19 cumulative → 바로 v2.21 cumulative 로 점프
- pre-snapshot 1 회 = `_archive/BDR-current-2026-05-28-pre-v2.21/`
- Phase 2/3 ⑩ 모두 ✅ 갱신
- commit 1 회 (메시지에 Phase 2 + Phase 3 동시 명시)

**옵션 B** (보수적) — **v2.20 → v2.21 2 회 sync**:
- 먼저 v2.20 sync (Phase 2 sync 의뢰서 그대로) → pre-snapshot 1
- 그 다음 v2.21 sync (본 의뢰서) → pre-snapshot 2
- 각 phase ⑩ ✅ 갱신 분리
- commit 2 회

→ **권장 = 옵션 A** (v2.21 = v2.20 superset · README 카피로 검증 가능 / pre-snapshot 단순화). 옵션 B 는 phase 별 검수 분리하고 싶을 때.

→ 결재 전 sync 실행 ❌. 옵션 결재 받고 진행.

---

## 3. sync 실행 — 옵션 A (권장)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (6).zip"

# DryRun 먼저
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.21" -DryRun

# 통과 시 실 실행 (BOM 우회 ❌ — commit 5609c61 영구 해결됨)
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.21"
```

**완료 검증**:
```powershell
# v2.21 sync 결과 — 예상 ~58 파일
ls Dev/design/BDR-current/                          # team-shared.jsx + game-shared.jsx + tu1~tu5/ta1 html (6) 포함
ls Dev/design/BDR-current/screens/                  # jsx 31 (= Phase 1A 11 + Phase 1B 5 + Phase 2 10 + Phase 3 5) + css 6 = 37
ls Dev/design/BDR-current/screens/_baseline/        # Phase 2 baseline 10 (carry-over 유지)

# pre-snapshot — 예상 = v2.19 cumulative (jsx 26 + css 6 = 32)
ls Dev/design/_archive/BDR-current-2026-05-28-pre-v2.21/
ls Dev/design/_archive/BDR-current-2026-05-28-pre-v2.21/screens/
```

→ v2.19 cumulative 상태 (Phase 1A + Phase 1B + Phase 2 baseline 10) = 모두 `_archive/BDR-current-2026-05-28-pre-v2.21/` 로 이동 보존.

### sync 후 BDR-current/ 구조 예상

```
BDR-current/
├── README.md                            ← v2.21
├── index.html                           ← v2.21 (Phase 1/2/3 통합 목차)
├── tokens.css / shared.jsx              ← v2.20 그대로 (변경 ❌)
├── admin.css / shell.css                ← v2.21 (+ Phase 3 패턴 추가)
├── game-shared.jsx                      ← v2.20 그대로 (Phase 2 결과)
├── team-shared.jsx + team-shared.css    ← v2.21 신규 (Phase 3 결과 · 613 + 1106 line)
├── Phase 1A html (9) + Phase 1B html (8) + Phase 2 html (10) + Phase 3 html (6)
├── screens/
│   ├── Phase 1A 시안 (11 jsx) — Admin*Tournament*.jsx · carry-over
│   ├── Phase 1B 시안 (5 jsx + 6 css) — Tournament*/MyRegistrationStatus · carry-over
│   ├── Phase 2 시안 (10 jsx) — AdminGames/AdminGameReports/Games/GameDetail/GameResult/CreateGame/GuestApply/Live/Home/MyActivity
│   │   ※ MyActivity 는 Phase 3 에서 다시 갱신 (3 회 누적)
│   ├── Phase 3 시안 (5 jsx) — Teams/TeamDetail/TeamManage/TeamManageDetail/AdminTeams
│   ├── MyActivity.jsx (Phase 1B → 2 → 3 누적 277 line)
│   └── _baseline/ (Phase 2 baseline 10 jsx · carry-over)
```

---

## 4. 회귀 검수 — 4 + 8 + Phase 2 특수 4 + Phase 3 특수 4 = 20 케이스

### 4 케이스 (frozen / 00 §회귀 방지) — Phase 1A/1B/2 답습

```bash
# 케이스 1~4 (Phase 2 sync 의뢰서 §4 답습)
grep -rn '더보기.*▼\|RDM' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx Dev/design/BDR-current/game-shared.jsx Dev/design/BDR-current/team-shared.jsx 2>/dev/null
grep -rn '라이트.*다크\|☀.*☾' Dev/design/BDR-current/shared.jsx Dev/design/BDR-current/screens/ 2>/dev/null
grep -rn 'app-nav__icon-btn.*btn--sm\|btn.*app-nav__icon-btn' Dev/design/BDR-current/ 2>/dev/null
grep -nE "다크.*검색.*쪽지.*알림.*햄버거" Dev/design/BDR-current/shared.jsx 2>/dev/null
# 기대: 모두 0 (또는 5 아이콘 순서 일치 시각 검증)
```

### 8 케이스 (self / 06 §자체 검수)

```bash
# 케이스 5~12 (Phase 2 sync 의뢰서 §4 답습)
grep -rnE '#[0-9a-fA-F]{3,8}|rgb\(' Dev/design/BDR-current/screens/ Dev/design/BDR-current/*.css 2>/dev/null | grep -vE 'var\(--|^//|/\*' | head -20
grep -rn 'from .lucide-react' Dev/design/BDR-current/ 2>/dev/null
grep -rnE 'rounded-full|9999px|border-radius:\s*9999' Dev/design/BDR-current/ 2>/dev/null
grep -rnE 'gameResult|gameReport|guestApps|/referee\b' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx Dev/design/BDR-current/game-shared.jsx Dev/design/BDR-current/team-shared.jsx 2>/dev/null | grep -v "refereeInfo"
grep -nE 'border-radius:\s*(4|6|8)px' Dev/design/BDR-current/*.css 2>/dev/null | head -5
grep -rnE 'placeholder="예:' Dev/design/BDR-current/screens/ 2>/dev/null
grep -nE '720px|16px|44px' Dev/design/BDR-current/*.css 2>/dev/null | head -10
grep -nE 'Pretendard|Space Grotesk|Archivo|JetBrains' Dev/design/BDR-current/tokens.css 2>/dev/null | head -5
# 기대: 모두 0 또는 정상 패턴
```

### Phase 2 특수 검수 4 케이스

```bash
# 케이스 13 — game-shared.jsx 보존 (Phase 2 결과)
test -f Dev/design/BDR-current/game-shared.jsx && echo "✓ game-shared.jsx" || echo "✗ 누락"

# 케이스 14 — screens/_baseline/ 10 보존
ls Dev/design/BDR-current/screens/_baseline/ 2>/dev/null | wc -l  # 기대: 10

# 케이스 15 — Phase 1A 11 admin jsx carry-over (변경 ❌)
diff Dev/design/BDR-current/screens/AdminTournamentAdminList.jsx Dev/design/_archive/BDR-current-2026-05-28-pre-v2.21/screens/AdminTournamentAdminList.jsx
# 기대: 차이 0

# 케이스 16 — Phase 1B 6 css carry-over
diff Dev/design/BDR-current/screens/tournaments.css Dev/design/_archive/BDR-current-2026-05-28-pre-v2.21/screens/tournaments.css
# 기대: 차이 0
```

### Phase 3 특수 검수 4 케이스 (신규)

```bash
# 케이스 17 — team-shared.jsx + team-shared.css 신규 보존 (Phase 3 결과)
test -f Dev/design/BDR-current/team-shared.jsx && echo "✓ team-shared.jsx" || echo "✗ 누락"
test -f Dev/design/BDR-current/team-shared.css && echo "✓ team-shared.css" || echo "✗ 누락"

# 케이스 18 — Phase 3 신규 5 시안 (Teams/TeamDetail/TeamManage/TeamManageDetail/AdminTeams)
for f in Teams TeamDetail TeamManage TeamManageDetail AdminTeams; do
  test -f "Dev/design/BDR-current/screens/$f.jsx" && echo "✓ $f.jsx" || echo "✗ $f.jsx 누락"
done

# 케이스 19 — MyActivity.jsx 누적 갱신 (Phase 1B → 2 → 3 = 277 line 예상)
wc -l Dev/design/BDR-current/screens/MyActivity.jsx
# 기대: 277 line (Phase 3 보강 후)

# 케이스 20 — TA2 모달 옵션 (sub-page route ❌)
test -d "Dev/design/BDR-current/screens/AdminTeamDetail" 2>/dev/null && echo "✗ TA2 별도 폴더 (옵션 B?)" || echo "✓ TA2 모달 (옵션 A)"
# 기대: TA2 별도 폴더 없음 (옵션 A 모달 / AdminTeams.jsx 안 포함)
```

→ 위반 1 건이라도 발견 시 sync 중단 + 사용자 보고 + pre-snapshot 으로 복원 검토.

---

## 5. phase-ledger 갱신 (Phase 2 + Phase 3 동시)

`.claude/phase-ledger.md` 갱신:

```
[Phase 2]
| ⑩ sync 실행 | 2A + 2B | ✅ 완료 | CLI | 2026-05-28 | v2.21 sync 안에 v2.20 carry-over 처리됨. BDR-current = Phase 2 10 jsx + game-shared.jsx + screens/_baseline/ 10 / 단일 sync 결합 |

[Phase 3 — 신규 entry 추가 — phase-ledger 안 "## 예정 Phase" 섹션 위에 새 섹션]

### Phase 3 — 팀 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ① 점검 리포트 | 3 (팀 전체) | ✅ 완료 | Cowork | 2026-05-28 | `Dev/design/prompts/team-user-admin-connectivity-plan-2026-05-28.md` |
| ② 갭 분석 (BT1~BT8) | 3 | ✅ 완료 | Cowork | 2026-05-28 | 8 갭 식별 — BT1 ★★★★ / BT6 BT7 ★★★ |
| ③ 사용자 결재 | 3 | ✅ 완료 | 수빈 | 2026-05-28 | 영역=팀 / 7 시안 / 양측 다리 8 |
| ④ 의뢰 작성 | 3B 사용자 | ✅ 완료 | Cowork | 2026-05-28 | `team-user-redesign-prompt-2026-05-28.md` (5 시안 TU1~TU5) |
| ④ 의뢰 작성 | 3A 관리자 | ✅ 완료 | Cowork | 2026-05-28 | `team-admin-redesign-prompt-2026-05-28.md` (2 시안 TA1~TA2) |
| ⑤ phase-ledger 갱신 | 3A/3B | ✅ 완료 | Cowork | 2026-05-28 | Phase 3 entry 추가 |
| ⑥ git commit + push | 3A/3B | ⏳ 대기 | Cowork→수빈 | - | 본 sync commit 포함 |
| ⑦ Claude.ai 전달 | 3A + 3B | ✅ 완료 | 수빈 | 2026-05-28 | drag-drop 4 + paste 1 |
| ⑧ 시안 박제 | 3A + 3B | ✅ 완료 | Claude.ai | 2026-05-28 | BDR v2.21 박제 — TA2 옵션 A 모달 결재 ✅ |
| ⑨ zip 출력 | 3A + 3B | ✅ 완료 | Claude.ai | 2026-05-28 | uploads/BDR v2 (6).zip 도착 |
| ⑩ sync 실행 | 3A + 3B | ✅ 완료 | CLI | 2026-05-28 | v2.21 sync — Phase 2 + 3 동시. BDR-current = Phase 1/2/3 cumulative |
| ⑪ 운영 박제 (Phase 3C) | 3C | ⏸ 보류 | CLI | - | PR ~7건 예상 (TU1~5 + TA1~2) |
| ⑫ 회귀 검수 | 3C | ⏸ 보류 | CLI | - | CLAUDE.md §🔄 |
| ⑬ PR 결재 | 3C | ⏸ 보류 | 수빈 | - | subin → dev → main |
| ⑭ Phase 완료 | 3 | ⏸ 보류 | Cowork | - | Phase 4 시작 결정 |
```

---

## 6. commit + push

```bash
git add Dev/design/ .claude/phase-ledger.md
git status   # 검토
git commit -m "design: BDR-current sync v2.21 (Phase 2 경기 10 + Phase 3 팀 7 = 17 시안 동시)

- v2.21 = Phase 3 (팀 영역) 박제 + Phase 2 (경기) 결과 carry-over 통합
- Phase 3 신규 = Teams/TeamDetail/TeamManage/TeamManageDetail/AdminTeams + team-shared.jsx (613) + team-shared.css (1106)
- Phase 3 보강 = MyActivity.jsx (Phase 1B → 2 → 3 누적 277 line)
- Phase 2 박제 10 = AdminGames/AdminGameReports/Games/GameDetail/GameResult/CreateGame/GuestApply/Live/Home + game-shared.jsx
- Phase 1A/1B carry-over (변경 0) = 17 jsx + 6 css
- pre-snapshot = _archive/BDR-current-2026-05-28-pre-v2.21/ (v2.19 cumulative 보존)
- 회귀 검수 4 frozen + 8 self + Phase 2 특수 4 + Phase 3 특수 4 = 20 케이스 통과
- 양측 의존 검증 = BG1/BG2/BG4/BG7 (Phase 2) + BT1/BT3/BT6/BT7 (Phase 3) 일관성
- TA2 라우트 = 옵션 A (모달) ✅ — 새 라우트 0
- phase-ledger Phase 2 ⑩ + Phase 3 ⑩ 동시 ✅ 갱신

다음 = Phase 2C 운영 박제 (PR ~10) + Phase 3C 운영 박제 (PR ~7) — 별 의뢰서"

git push origin subin
```

---

## 7. 양측 의존 검증 메모 (Phase 2C + 3C 운영 박제 사전 준비)

### Phase 2 (BG1~BG7 · 경기) — Phase 2C 운영 박제 시 활용

| BG | 등급 | 사용자 측 ↔ 관리자 측 | 운영 데이터 모델 |
|----|------|---------------------|----------------|
| BG1 | ★★★ | UA2 step + UC1 "내 경기" ↔ UD1 모달 | `game_applications.status` |
| BG2 | ★★★ | UC1 "내 매너" ↔ UD2 매너 통계 | `game_player_ratings` 평균 + flags |
| BG4 | ★★★★★ | UB1 variant + UA1 종료 카드 | `games.final_mvp_user_id` |
| BG7 | ★★★★ | UC2 + UA1 + UA5 sticky LIVE | live data + WebSocket |

### Phase 3 (BT1~BT8 · 팀) — Phase 3C 운영 박제 시 활용

| BT | 등급 | 사용자 측 ↔ 관리자 측 | 운영 데이터 모델 |
|----|------|---------------------|----------------|
| BT1 | ★★★★ | TU4 큐 + TU5 "내 신청" | `team_join_requests.status` |
| BT2 | ★★★ | TU4 변경 + TU5 "내 변경" | `TeamMemberRequest.status` (jersey/dormant/withdraw) |
| BT3 | ★★ | TU4 유령 + TU5 휴면 예정 ↔ TA1/TA2 활동 | `TeamMember.last_activity_at` (3개월 미활동 룰) |
| BT4 | ★★ | TU4 권한 위임 + TU2 sidebar "내 권한" | `TeamOfficerPermissions` |
| BT5 | ★★ | TU2/TU4 매치 신청 | team-match-request API |
| BT6 | ★★★ | TU2 stats ↔ TA1 통계 + TA2 매너 | `wins/losses/draws` + 매너 |
| BT7 | ★★★ | TU2 sidebar "운영 액션" → Phase 1/2 cross-domain | `TournamentTeam` + `games` |
| BT8 | ★ | (해당 없음) ↔ TA1 + TA2 신규 | super-admin role |

→ Phase 2C/3C 운영 박제 의뢰서 작성 시 위 매핑 표 그대로 활용.

---

## 8. 완료 후 사용자 보고

```
Phase 2 v2.20 + Phase 3 v2.21 sync 완료 ✅ (v2.21 1 회 sync 로 동시 처리)
- BDR-current = jsx 31 + css 6 + game-shared.jsx + team-shared.jsx + team-shared.css + _baseline/ 10
  = 41+ 파일 (= Phase 1A 11 + Phase 1B 5 + Phase 2 10 + Phase 3 5 + 보조)
- Phase 3 신규 시안 7 (TU1~TU5 + TA1+TA2) + team-shared (613+1106 line)
- Phase 1A/1B/2 carry-over 변경 0
- 회귀 검수 20 케이스 통과 (4 frozen + 8 self + Phase 2 특수 4 + Phase 3 특수 4)
- pre-snapshot = _archive/BDR-current-2026-05-28-pre-v2.21/ 보존 (v2.19 cumulative)
- phase-ledger Phase 2 ⑩ + Phase 3 ⑩ 동시 ✅
- commit `<hash>` push 완료

다음 가능한 batch:
- Phase 1C 운영 박제 batch (15 PR · 의뢰서 작성됨)
- Phase 2C 운영 박제 (~10 PR · 의뢰서 미작성 — Cowork 자동 작성 가능)
- Phase 3C 운영 박제 (~7 PR · 의뢰서 미작성 — Cowork 자동 작성 가능)
```

---

**의뢰서 끝.** 수빈이 CLI 에 한 줄로 전달:
`Read Dev/design/prompts/phase-3-v2.21-sync-cli-prompt-2026-05-28.md 하고 §2 사전 점검 + 옵션 결재부터 시작해줘.`
