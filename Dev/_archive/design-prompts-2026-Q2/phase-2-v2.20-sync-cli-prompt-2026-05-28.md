# Phase 2 (v2.20) — BDR-current sync CLI 의뢰서

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행 박제**: BDR v2.18 (Phase 1B) sync ✅ + BDR v2.19 (Phase 1A) sync ✅ (commit `5609c61` 이후)
> **선행 의뢰**: `phase-1A-v2.19-sync-cli-prompt-2026-05-26.md` (동일 패턴 — Phase 2 차이만 명시)
> **운영 코드 변경**: **0** — 시안 sync + 회귀 검수 + ledger + commit/push 만. Phase 2C (운영 박제) 는 별 Phase

---

## 1. 한 줄 요약

`uploads/BDR v2 (5).zip` 안 `Dev/design/BDR v2.20/` (Phase 2 박제 = 사용자 8 + 관리자 2 = 10 시안 + game-shared.jsx + _baseline/ 10 + p2-*.html 10) 를 `sync-bdr-current.ps1` 로 `BDR-current/` 에 동기화 → 회귀 검수 (4+8 케이스) → phase-ledger Phase 2 ⑩ ✅ → commit/push.

---

## 2. 사전 점검 (CLAUDE.md "오늘 작업 시작하자" 6 단계)

```
□ git remote -v / fetch / 브랜치 = subin / .env / .env.local
□ 현재 BDR-current/ = v2.19 cumulative (Phase 1A 박제 결과 + Phase 1B + Phase 2 baseline carry-over 10)
□ Phase 1C 박제 PR (PR-1C-1 #650, 그 외) 의 unstaged 변경 = 0 (subin 브랜치 깨끗)
□ 결과 요약 → "이대로 Phase 2 v2.20 sync 시작해도 될까요?" 사용자 결재
```

→ 결재 전 sync 실행 ❌. sync 가 BDR-current/ 의 Phase 2 baseline 10 (Home / Games / Live / GameDetail / GameResult / CreateGame / GuestApply / AdminGames / AdminGameReports / MyActivity) 을 pre-snapshot 으로 옮기고 v2.20 박제 결과로 덮어씀.

---

## 3. sync 실행 (옵션 A delta replace)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (5).zip"

# DryRun 먼저
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.20" -DryRun

# 통과 시 실 실행 (BOM 우회 ❌ — commit 5609c61 으로 영구 해결됨)
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.20"
```

**완료 검증**:
```powershell
# v2.20 sync 결과 — 예상 ~45 파일
ls Dev/design/BDR-current/                          # game-shared.jsx 포함 (NEW)
ls Dev/design/BDR-current/screens/                  # jsx 26 + css 6 = 32 파일
ls Dev/design/BDR-current/screens/_baseline/        # 10 jsx (NEW — Phase 2 baseline 보존)

# pre-snapshot — 예상 = v2.19 cumulative (jsx 26 + css 6)
ls Dev/design/_archive/BDR-current-2026-05-28-pre-v2.20/
ls Dev/design/_archive/BDR-current-2026-05-28-pre-v2.20/screens/
```

→ v2.19 cumulative 상태 (Phase 1A 박제 + Phase 2 baseline 10) = 모두 `_archive/BDR-current-2026-05-28-pre-v2.20/` 로 이동 보존.

---

## 4. 회귀 검수 — 4 + 8 케이스 (v2.20 README §회귀 방지 답습)

### 4 케이스 (kickoff §6 / 06 §회귀 방지 필수)

```bash
# 케이스 1 — main bar 우측 "더보기 ▼" / "RDM" 아바타
grep -rn '더보기.*▼\|RDM' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx Dev/design/BDR-current/game-shared.jsx 2>/dev/null
# 기대: 0

# 케이스 2 — 모바일 듀얼 다크 라벨 (☀ 라이트 ☾ 다크)
grep -rn '라이트.*다크\|☀.*☾' Dev/design/BDR-current/shared.jsx Dev/design/BDR-current/screens/ 2>/dev/null
# 기대: PC 듀얼만 (모바일 단일 아이콘 분기 있으면 OK)

# 케이스 3 — 검색·쪽지·알림 box (.btn / .btn--sm)
grep -rn 'app-nav__icon-btn.*btn--sm\|btn.*app-nav__icon-btn' Dev/design/BDR-current/ 2>/dev/null
# 기대: 0

# 케이스 4 — main bar 5 아이콘 순서 = [다크, 검색, 쪽지, 알림, 햄버거]
grep -nE "dark.*search.*messages.*notif|쪽지|nav__icon" Dev/design/BDR-current/shared.jsx 2>/dev/null | head -10
# 기대: 5 아이콘 순서 일치 (수동 시각 검증)
```

### 8 케이스 (06 §자체 검수)

```bash
# 케이스 5 — 하드코딩 색상 (var(--*) 변수만)
grep -rnE '#[0-9a-fA-F]{3,8}|rgb\(' Dev/design/BDR-current/screens/ Dev/design/BDR-current/*.css 2>/dev/null | grep -vE 'var\(--|^//|/\*|comment' | head -20
# 기대: 0 (단 tokens.css 변수 정의는 OK)

# 케이스 6 — lucide-react import
grep -rn 'from .lucide-react\|require.lucide-react' Dev/design/BDR-current/screens/ Dev/design/BDR-current/*.jsx 2>/dev/null
# 기대: 0

# 케이스 7 — rounded-full / 9999px (정사각형 W=H 50% OK)
grep -rnE 'rounded-full|9999px|border-radius:\s*9999' Dev/design/BDR-current/screens/ Dev/design/BDR-current/*.css 2>/dev/null
# 기대: 0

# 케이스 8 — 가짜링크 (gameResult / gameReport / guestApps / referee)
grep -rnE 'gameResult|gameReport|guestApps|/referee\b' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx Dev/design/BDR-current/game-shared.jsx 2>/dev/null | grep -v "refereeInfo"
# 기대: 0

# 케이스 9 — button border-radius 4px / 카드 6~8px
grep -nE 'border-radius:\s*(4|6|8)px' Dev/design/BDR-current/*.css 2>/dev/null | head -5
# 기대: 4px (button) / 6~8px (card) 일관

# 케이스 10 — placeholder "예: " 시작 ❌ / 5 단어 이내
grep -rnE 'placeholder="예:' Dev/design/BDR-current/screens/ 2>/dev/null
# 기대: 0

# 케이스 11 — 720px / 16px (iOS input) / 44px (버튼)
grep -nE '720px|16px|44px' Dev/design/BDR-current/*.css 2>/dev/null | head -10
# 기대: 모두 존재 (모바일 분기 + iOS input + 버튼)

# 케이스 12 — Pretendard + Space Grotesk (or Archivo / JetBrains Mono) / lucide ❌
grep -nE 'Pretendard|Space Grotesk|Archivo|JetBrains' Dev/design/BDR-current/tokens.css Dev/design/BDR-current/*.css 2>/dev/null | head -5
# 기대: 폰트 변수 존재
```

### Phase 2 특수 검수 (4 케이스)

```bash
# 케이스 13 — game-shared.jsx 가 BDR-current 루트에 있는지 (NEW · sync 검증)
test -f Dev/design/BDR-current/game-shared.jsx && echo "✓ game-shared.jsx 존재" || echo "✗ 누락"

# 케이스 14 — screens/_baseline/ 10 jsx 보존 (Phase 2 baseline 미터치)
ls Dev/design/BDR-current/screens/_baseline/ 2>/dev/null | wc -l
# 기대: 10

# 케이스 15 — Phase 1A 11 admin jsx carry-over 검증 (변경 ❌)
diff Dev/design/BDR-current/screens/AdminTournamentAdminList.jsx Dev/design/_archive/BDR-current-2026-05-28-pre-v2.20/screens/AdminTournamentAdminList.jsx
# 기대: 차이 0 (Phase 1A 시안 변경 ❌)

# 케이스 16 — Phase 1B 6 user css carry-over 검증
diff Dev/design/BDR-current/screens/tournaments.css Dev/design/_archive/BDR-current-2026-05-28-pre-v2.20/screens/tournaments.css
# 기대: 차이 0
```

→ 위반 1 건이라도 발견 시 sync 중단 + 사용자 보고 + pre-snapshot 으로 복원 검토.

---

## 5. phase-ledger 갱신

`.claude/phase-ledger.md` Phase 2 의 ⑨ ~ ⑩ 행 갱신:

```
| ⑨ zip 출력 | 2A + 2B | ✅ 완료 | Claude.ai | 2026-05-28 | uploads/BDR v2 (5).zip 도착 — v2.20 박제 결과 (Phase 2 신규 10 + Phase 1A/1B carry-over 17) |
| ⑩ sync 실행 | 2A + 2B | ✅ 완료 | CLI | 2026-05-28 | sync-bdr-current.ps1 -NewVersion v2.20 / BDR-current = jsx 26 + css 6 + game-shared.jsx + screens/_baseline/ 10 / pre-snapshot = _archive/BDR-current-2026-05-28-pre-v2.20/ / 회귀 검수 4+8 케이스 + Phase 2 특수 4 통과 |
```

→ Phase 2 ⑪ (운영 박제 Phase 2C) = ⏸ 보류 — 별 의뢰서.

---

## 6. commit + push

```bash
git add Dev/design/ .claude/phase-ledger.md
git status   # 검토 — Phase 1C unstaged 변경 없는지 재확인
git commit -m "design: BDR-current sync v2.20 (Phase 2 경기 영역 박제 10 시안)

- v2.20 = Phase 2 박제 = Phase 2A (UD1 + UD2) + Phase 2B (UA1~UA5 + UB1 + UC1 + UC2) = 10 시안
- 신규 = game-shared.jsx (LiveChipRow / ApplyStep / MannerCard / KindBadge / StatusBadge)
- 신규 = screens/_baseline/ 10 jsx (운영 박제 원본 보존)
- 신규 = p2-*.html (10 preview)
- Phase 1A/1B carry-over (변경 0) = 17 jsx + 6 css
- pre-snapshot = _archive/BDR-current-2026-05-28-pre-v2.20/ (v2.19 cumulative 보존)
- 회귀 검수 4 + 8 + Phase 2 특수 4 = 16 케이스 통과
- 양측 의존 검증 = BG1/BG2/BG4/BG7 데이터 모델 매핑 명시 (운영 박제 사전)
- phase-ledger Phase 2 ⑩ ✅ 갱신

다음 = Phase 2C 운영 박제 (별 의뢰서 — PR ~10)"

git push origin subin
```

---

## 7. 양측 의존 검증 메모 (Phase 2C 사전 준비 — 운영 박제 의뢰서 작성 시 활용)

| BG | 영향도 | 사용자 측 시안 ↔ 관리자 측 | 운영 데이터 모델 |
|----|-------|-------------------------|----------------|
| BG1 | ★★★ | UA2 step indicator + UC1 "내 경기" ↔ UD1 status 변경 모달 | `game_applications.status` 동일 |
| BG2 | ★★★ | UC1 "내 매너" 카드 ↔ UD2 매너 통계 탭 | `game_player_ratings` 평균 + flags / 개별 건수 ❌ |
| BG3 | ★★★ | UA3 게스트 토글 + UA4 자동 채우기 | `user.skill_level` → `experience_years` |
| BG4 | ★★★★★ | UB1 GameResult variant + UA1 종료 카드 | `games.final_mvp_user_id` + `recomputeFinalMvp()` |
| BG5 | ★★ | UA3 토글 ↔ UD1 액션 출처 컬럼 | `games.host_id` vs super_admin |
| BG6 | ★★★★ | UC1 마이페이지 통합 hub | `game_applications` + `tournament_applications` |
| BG7 | ★★★★ | UC2 홈 sticky + UA1 상단 + UA5 진입 | live data + WebSocket |

→ Phase 2C 운영 박제 시 양측 시안의 같은 데이터 모델 매핑 일관성 검증 의무 (UD1 큐 row = UA2 step indicator row = UC1 list row).

---

## 8. 완료 후 사용자 보고

```
Phase 2 v2.20 sync 완료 ✅
- BDR-current = jsx 26 + css 6 + game-shared.jsx + screens/_baseline/ 10 = 43+ 파일
- Phase 2 신규 시안 10 (UD1 UD2 + UA1~UA5 + UB1 + UC1 + UC2)
- Phase 1A/1B carry-over 변경 0 (17 jsx + 6 css)
- 회귀 검수 16 케이스 통과 (4 frozen + 8 self + 4 Phase 2 특수)
- pre-snapshot = _archive/BDR-current-2026-05-28-pre-v2.20/ 보존
- phase-ledger Phase 2 ⑩ ✅
- commit `<hash>` push 완료

다음 = Phase 2C 운영 박제 (PR ~10). Cowork 가 별 의뢰서 작성 가능.
경기 영역 운영 박제는 Phase 1C batch 와 별 batch session 으로 진행 권장 (병행 ❌ — context 손실 방지).
```

---

**의뢰서 끝.** 수빈이 CLI 에 한 줄로 전달:
`Read Dev/design/prompts/phase-2-v2.20-sync-cli-prompt-2026-05-28.md 하고 §2 사전 점검부터 시작해줘.`
