# BDR v2.24 — Phase 6.1 (프로필·마이페이지 본체) 박제

> **박제일**: 2026-05-30
> **선행**: Phase 1A v2.19 + 1B v2.18 + 2 v2.20 + 3 v2.21 + 4 v2.22 + 5 v2.23 carry-over
> **선행 의뢰**: `profile-user-redesign-prompt-2026-05-30.md` + `profile-admin-redesign-prompt-2026-05-30.md` + `profile-user-admin-connectivity-plan-2026-05-30.md`
> **분할**: Phase 6.1 (본체 6) ← 본 박제 / 6.2 (결제·구독) + 6.3 (성장 분석) 후속 별 의뢰

---

## 1. Phase 6.1 박제 시안 = 6 (사용자 5 + super-admin 1)

### Phase 6.1B — 사용자 측 (PU1~PU5 · A 등급)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| PU1 | ProfileMain (보강) | `/profile` | 보강 | BP1 + BP6 (카운트 동기화 + 활동 진입) |
| PU2 | ProfileEdit (보강) | `/profile/edit` | 보강 | BP4 (결제 link out + privacy 토글 + 저장 동기화) |
| PU3 | ProfileBasketball (신규) | `/profile/basketball` | **신규** | BP2 ★★★★ (농구 캐릭터 + 시즌 stat 5 + 선호 chip 8 + 우승) |
| PU4 | ProfileAchievements (보강) | `/profile/achievements` | 보강 | BP3 (배지 grid + 우승 자동 + MVP 누적) |
| PU5 | UserPublicProfile (신규) | `/users/[id]` | **신규** | BP1 ★★★★★ (공개 시야 + privacy 필터 + preview) |

### Phase 6.1A — 관리자 측 (PA1 · E 등급 · super-admin)

| ID | 화면 | 라우트 | 분류 | 측 | 주 갭 |
|----|------|--------|------|----|-------|
| PA1 | AdminUsers | `/admin/users` | **신규** | **Site Operator** | BP5 (Hero stat + 4 탭 + 필터 + 모달) |

---

## 2. BP 양측·cross-domain 의존 검증 ✅

| BP | 등급 | 의존 | 데이터 |
|----|------|------|--------|
| BP1 | ★★★★★ | PU1 본인 ↔ PU5 공개 | 동일 `USER_ME` · `publicView()` privacy_settings 필터 (이메일/연락처/결제 hide) |
| BP2 | ★★★★ | PU3 시즌 stat | UserSeasonStat + Phase 2 BG4 (이달 MVP) + Phase 3 BT6 (팀 wins) cross-domain |
| BP3 | ★★★ | PU4 업적 | user_badges + Phase 1A PA7 (우승 자동) + Phase 2 BG4 (MVP 누적) |
| BP4 | ★★★★ | PU2 → PU1 동기화 | User.* 편집 / 결제 = 6.2 link out "준비 중" |
| BP5 | ★★ | PA1 super-admin 검수 | User.status / suspended_at / isAdmin (본인 자기 정지 가드) |
| BP6 | ★★★ | PU1 → UC1 진입 | 카운트(대회/경기/팀/단체/평점) = UC1 활동 동일 source |

---

## 3. carry-over (변경 ❌)

### 파일 — v2.23 그대로
- `tokens.css` / `shell.css` / `shared.jsx` / `game-shared.jsx` / `team-shared.jsx` / `team-shared.css` / `org-shared.jsx` / `org-shared.css` / `comm-shared.jsx` / `comm-shared.css` / `admin.css`
- Phase 1~5 = 41 wrapper + 39 jsx + _baseline 모두 carry-over (운영 코드 변경 0)

### 신규 추가
- `profile-shared.jsx` — Phase 6.1 mock (USER_ME / SEASON_STAT / CAREER_STAT / PREFERRED 8 / ME_CHAMPIONS / BADGE_CATALOG / ME_RECENT_* / ADMIN_USERS) + mini components (LevelBadge / SkillChip / StatCard / BadgeTile / UserStatusBadge / PageBack / `publicView()`)
- `profile-shared.css` — Phase 6.1 전용 (.pm-* / .pm-hero / .pm-counts / .pm-stat / .pm-badge / .pm-chip / .pm-priv / .pm-utable / .pm-ubadge)
- `screens/Profile.jsx` (PU1) / `ProfileEdit.jsx` (PU2) / `ProfileBasketball.jsx` (PU3) / `ProfileAchievements.jsx` (PU4) / `UserPublicProfile.jsx` (PU5) / `AdminUsers.jsx` (PA1)
- 6 wrapper HTML (pu1~pu5 / pa1)

---

## 4. 자체 검수 — 4 frozen + 8 self + Phase 6 특수 4 통과 ✅

### AppNav frozen 4 (사용자 시안 — shared.jsx 03 카피)
- ✅ main bar 우측 "더보기 ▼" / 아바타 = 0 (shared.jsx AppNav frozen 카피)
- ✅ 모바일(≤768px) 듀얼 라벨 = 0 (ThemeSwitch viewport 분기 — shell.css)
- ✅ 검색/쪽지/알림 box (.btn) = 0 — `app-nav__icon-btn` 만
- ✅ main bar 아이콘 = [검색, 쪽지, 알림, 다크, 햄버거] 순서 보존

### 13 룰 8
- ✅ 하드코딩 색상 = 0 — `var(--*)` 토큰만 (예외: 팀 `color` mock data column · gold `#F4C76C`·`#B47A11` = 기존 시안 trophy 토큰 답습)
- ✅ lucide-react = 0 — Material Symbols Outlined 만
- ✅ 9999px = 0 — 정사각형 50% (avatar/dot/toggle) 만
- ✅ 가짜링크 (gameResult / gameReport / guestApps / referee) = 0
- ✅ button 4px / 카드 6~8px
- ✅ placeholder 5단어 이내 / "예: " 시작 0
- ✅ 720px 분기 / iOS input 16px / 버튼 44px (.pm-input 16px · .pm-hbtn 44px)
- ✅ Pretendard + Archivo + JetBrains Mono 만

### Phase 6 특수 4
- ✅ **BP1 본인/공개 분기** — PU1 == PU5 동일 `USER_ME` 데이터, `publicView()` 1곳 필터로 시각 분리 (비공개 필드 hide 일관)
- ✅ **PU3 5 stat + 8 chip 모바일 responsive** — .pm-stats / .pm-pref 720 + .vp--mobile 분기 (2열)
- ✅ **PU2 거대 carry-over** — 5섹션 단일 스크롤 유지 · 시각 작은 변경만 (결제 link out / privacy 토글 / 저장 안내)
- ✅ **PA1 Site Operator + 자기 정지 가드** — OperatorBadge + `is_me` / `isAdmin` 행 = 변경 가드 · 결제·은행 read-only

---

## 5. 회귀 방지 — 위반 자동 검수 4 케이스 ✅
- ❌ main bar 우측 "더보기 ▼" dropdown / 아바타 = 0
- ❌ 모바일(≤768px) 듀얼 라벨 = 0
- ❌ 검색/쪽지/알림 버튼 border/bg 박스 = 0
- ✅ main bar 아이콘 순서 frozen 카피 보존

---

**박제 끝.** v2.23 carry-over 위 신규 6 시안 + profile-shared.jsx/css 추가. 운영 코드 변경 0.
후속 6.2 (결제·구독·예약) + 6.3 (성장 분석) 별 의뢰 예고.
