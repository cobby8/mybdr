# BDR v2.26 — Phase 6.3 (마이페이지 후반부) 박제 · Phase 6 묶음 종료

> **박제일**: 2026-05-31
> **선행**: Phase 1A v2.19 + 1B v2.18 + 2 v2.20 + 3 v2.21 + 4 v2.22 + 5 v2.23 + 6.1 v2.24 + 6.2 v2.25 carry-over
> **선행 의뢰**: `growth-settings-user-redesign-prompt` + `growth-settings-user-connectivity-plan` (2026-05-31)
> **특수**: 모두 옛 v2 박제됨 (보강 의뢰) — GU1 v2.2 / GU2 v2.4 / GU3 v2.3
> **★ Phase 6 묶음 종료**: 6.1 본체 6 + 6.2 결제 7 + 6.3 후반부 3 = **총 16 시안**

---

## 1. Phase 6.3 박제 시안 = 3 (사용자 보강)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| GU1 | ProfileGrowth | `/profile/growth` | 보강 | BG1 ★★★ (게이미피케이션 + 마일스톤 PU4 정합) |
| GU2 | WeeklyReport | `/profile/weekly-report` | 보강 | BG2 ★★★ (KPI 4 PU3 정합 + placeholder 정리) |
| GU3 | ProfileSettings | `/profile/settings` | 보강 | BG3 ★★★★ (7섹션 + billing link 활성 + danger 강화) |

---

## 2. BG cross-domain 의존 검증 ✅

| BG | 등급 | 의존 | 데이터 |
|----|------|------|--------|
| BG1 | ★★★ | GU1 마일스톤 → PU4 / PU3 | user_badges + UserSeasonStat 동일 source / 시각 정합 |
| BG2 | ★★★ | GU2 KPI 4 → PU3 | 시즌 stat (경기/평점/XP/활동시간 · 평점=미지원 placeholder) |
| BG3 | ★★★★ | GU3 billing → BU3 | Phase 6.2 ProfileBilling link 활성 (MY_SUBSCRIPTION 미리보기) |

---

## 3. carry-over (변경 ❌)

### 파일 — v2.25 그대로
- `tokens.css` / `shell.css` / `shared.jsx` (AppNav frozen) / `game-shared.*` / `team-shared.*` / `org-shared.*` / `comm-shared.*` / `profile-shared.*` (USER_ME / BADGE_CATALOG / SEASON_STAT / LevelBadge) / `billing-shared.*` (MY_SUBSCRIPTION / won / dateK) / `admin.css`
- Phase 1~6.2 = 모든 wrapper + jsx + _baseline carry-over (운영 코드 변경 0)

### 신규 추가
- `growth-shared.jsx` — Phase 6.3 mock (GROWTH / WEEKLY / SETTINGS_SECTIONS) + mini components (GrowthSpark / GrowthLine / MilestoneTile / KpiCard / ComingSoon / gwXpPct)
- `growth-shared.css` — Phase 6.3 전용 (.gw-* : soon / trend / spark / line / mile / goal / report / section / kpi / ph / insight / court / compare / settings / snav / stabs / panel / srow / verify / billing / navedit / danger)
- `screens/ProfileGrowth.jsx` (GU1) / `WeeklyReport.jsx` (GU2) / `ProfileSettings.jsx` (GU3)
- 3 wrapper HTML (gu1~gu3)

---

## 4. 자체 검수 — 4 frozen + 8 self + Phase 6.3 특수 3 통과 ✅

### AppNav frozen 4 (shared.jsx 03 카피)
- ✅ main bar 우측 "더보기 ▼" / 아바타 = 0 · 사용자 시안 active="more"
- ✅ 모바일(≤768px) 듀얼 라벨 = 0 · 검색/쪽지/알림 box = 0 · 아이콘 순서 보존

### 13 룰 8
- ✅ 하드코딩 색상 = 0 — `var(--*)` 토큰만 (마일스톤 gold `#B47A11`/`#FBF0D6` = 기존 trophy 토큰 답습)
- ✅ lucide-react = 0 · Material Symbols Outlined 만 · 9999px = 0 (원형 50%)
- ✅ 가짜링크 = 0 · button 4px / 카드 6~8px · placeholder 5단어 이내
- ✅ 720px 분기 / iOS input 16px / 버튼 44px (.gw-snav__item · .gw-danger__btn)
- ✅ Pretendard + Archivo + JetBrains Mono 만
- ✅ GU1 line 차트 = 경량 SVG polyline (데이터 시각화 · 일러스트 SVG 아님)

### Phase 6.3 특수 3
- ✅ **"곧 제공"/"준비 중" placeholder = warn-soft tone 통일** (`.gw-soon` / `.gw-ph` — GU1 12주 추이·구간 분석 / GU2 Highlight·추천)
- ✅ **GU3 billing 섹션 link 활성** = BU3 ProfileBilling 진입 + 현재 구독 미리보기 (plan + 다음 결제일)
- ✅ **danger zone = BDR Red + 2차 confirm 모달** ("삭제합니다" 입력 시 영구 삭제 버튼 활성)

---

## 5. 회귀 방지 — 위반 자동 검수 4 케이스 ✅
- ❌ main bar 우측 "더보기 ▼" / 아바타 = 0 · 모바일 듀얼 라벨 = 0 · 검색/쪽지/알림 box = 0 · 아이콘 순서 보존
- ✅ GU3 ?section= 매핑 (preferences/notification-settings wrapper redirect 보존 · 변경 ❌)

---

**박제 끝.** v2.25 carry-over 위 신규 3 시안 + growth-shared.jsx/css 추가. 운영 코드 변경 0.
**Phase 6 묶음 = 16 시안 완전 종료** (6.1 본체 6 + 6.2 결제 7 + 6.3 후반부 3).
