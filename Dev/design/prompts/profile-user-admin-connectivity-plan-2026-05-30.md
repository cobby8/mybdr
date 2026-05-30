# Phase 6.1 — 프로필·마이페이지 본체 점검 리포트

> **작성일**: 2026-05-30
> **결재**: 영역 = **프로필·마이페이지 본체** ✅
> **★ 본 Phase 특수**: 영역 거대 (~8800 LOC / 16 sub-page) → **분할 의뢰** = 6.1 (본체 6) + 6.2 (결제·구독 후속) + 6.3 (성장 분석 후속)

---

## 0. 영역 매핑 (Phase 6.1 = 본체 1차 의뢰)

### 0-1. Phase 6.1 대상 (6 시안)

| ID | 화면 | 라우트 | LOC | 박제 흔적 |
|----|------|--------|-----|----------|
| PU1 | ProfileMain (보강) | `/profile` | 831 | ✅ Phase 13 박제 (BDR-current/MyPage.jsx 출처) |
| PU2 | ProfileEdit (보강) | `/profile/edit` | 1689 | ✅ v2.3 박제 (단일 스크롤 + Hero + 5섹션 Hybrid) |
| PU3 | ProfileBasketball (신규) | `/profile/basketball` | 1068 | ❌ |
| PU4 | ProfileAchievements (보강) | `/profile/achievements` | 105 | ✅ Phase 1 (서버 user_badges) |
| PU5 | UserPublicProfile (신규) | `/users/[id]` | 769 | ❌ — 공개 프로필 |
| PA1 | AdminUsers (신규) | `/admin/users` | 152 | ❌ — super-admin |

**Phase 6.1 LOC = 사용자 4663 + 공개 769 + admin 152 = ~5584 LOC** (Phase 4 단체 ~3370 대비 +66% / 1 Phase 처리 가능).

### 0-2. 후속 Phase 분할 안내 (본 의뢰 영향 0)

```
Phase 6.2 (결제·구독·예약 묶음)
  - /profile/billing (1039 · 박제 ❌)
  - /profile/payments (wrapper) + /profile/subscription (wrapper)
  - /profile/bookings (231 · v2 부분)
  → 별 의뢰 / Phase 6.1 sync 후 진행

Phase 6.3 (성장 분석)
  - /profile/growth (835 · 박제 ❌)
  - /profile/weekly-report (1125 · 박제 ❌)
  → 별 의뢰

Phase 6.4 (설정 보강 · 선택)
  - /profile/settings (256 · v2 부분 박제)
  - /profile/preferences + /profile/notification-settings (wrapper)
  → 보강만 / 선택
```

### 0-3. Prisma User 모델 핵심 (Phase 6.1 박제 의존)

```
User {
  - email / nickname / public_id / profile_image_url
  - subscription_status / subscription_expires_at (Phase 6.2 영역)
  - bank_name / account_number / toss_id (Phase 6.2 영역)
  - isAdmin / status (active/suspended) / suspended_at
  - evaluation_rating (Phase 2 BG2 매너)
  - total_games_hosted / total_games_participated
  - last_login_at
  - tutorial_completed_* (4 영역)
  - preferred_* (8 종 · Json[])
  - dominant_hand / skill_level / strengths (농구 정보 — PU3 핵심)
  - privacy_settings (Json)
}
```

추가 모델:
- `UserSeasonStat` (line 3022) — PU3 시즌 stat 영역
- `user_badges` — PU4 업적 영역
- `community_posts` / `Team` / `Tournament` 등 — 본인 활동 cross-domain

---

## 1. 갭 식별 (BP1~BP6) — 영향도

### BP1 — 본인 프로필 (PU1) ↔ 공개 프로필 (PU5) 정합 (★★★★★)

**현황**:
- PU1 `/profile` (831 · 본인 시야)
- PU5 `/users/[id]` (769 · 다른 사람 시야)

**갭**:
- 같은 사용자 데이터를 본인이 보는 시각 vs 다른 사람이 보는 시각 = 시각 일관 + privacy_settings 필터링
- 본인 시야 = "편집" CTA / 다른 사람 시야 = "팀 초대" / "1:1 메시지" CTA
- 공개 stat (참가 경기 / 매너 평점 / 업적) = 동일 데이터 소스
- 비공개 필드 (이메일 / 은행 / 결제) = PU1 만 표시 / PU5 hide

**의뢰 대상**: PU1 보강 + PU5 신규

### BP2 — 농구 정보 (PU3) ↔ 시즌 stat ↔ Phase 2 cross-domain (★★★★)

**현황**:
- PU3 `/profile/basketball` (1068 · 박제 ❌)
- UserSeasonStat / Phase 2 `games.final_mvp_user_id` / 매너 평점

**갭**:
- dominant_hand / skill_level / strengths 시각 (Json[] → chip row)
- preferred_* 8 종 (divisions / regions / days / time_slots / skill_levels 등) chip 선택 UX
- 시즌 stat 카드 (참가 경기 N · 호스트 M · MVP K · 평점 X.Y · 우승 Z)
- Phase 2 BG4 MVP 30일 cross-domain
- Phase 1A 우승 이력 cross-domain (PU4 업적 답습)

**의뢰 대상**: PU3 신규

### BP3 — 업적 (PU4) ↔ 대회 우승 (Phase 1A) cross-domain (★★★)

**현황**:
- PU4 `/profile/achievements` (105 · 작음 / Phase 1 박제됨 — user_badges)

**갭**:
- user_badges 시각 보강 (badge grid + 획득 시각)
- 대회 우승 = Phase 1A PA7 cross-domain (`champion_team_id` 기반 자동 표시)
- MVP = Phase 2 BG4 cross-domain (`games.final_mvp_user_id` · 누적)

**의뢰 대상**: PU4 보강

### BP4 — 편집 (PU2) ↔ 본인 프로필 (PU1) 동기화 (★★★★)

**현황**:
- PU2 `/profile/edit` (1689 · v2.3 박제 / 단일 스크롤 5섹션 Hybrid)

**갭**:
- 5섹션 (기본 / 농구 / 활동 / 알림 / 결제) — Phase 6.2/6.3 분할 시 결제 섹션 = link out 처리
- 편집 후 PU1 / PU5 동기화 시각 (저장 후 redirect 또는 inline 갱신)
- privacy_settings (Json) UX 명확화 — 공개 필드 vs 비공개 chip 토글

**의뢰 대상**: PU2 보강 (작은 시각 변경)

### BP5 — super-admin 사용자 검수 (PA1) (★★)

**현황**:
- PA1 `/admin/users` (152 · 박제 ❌)
- User.status (active/suspended) + suspended_at + isAdmin

**갭**:
- Phase 4 OA1 답습 (Site Operator badge + status 모달 + Phase 2 UD1 알림 체크박스)
- 정지 / 활성 / 슬랙 / 봇 / 등 사용자 검수 액션

**의뢰 대상**: PA1 신규

### BP6 — UC1 활동 (Phase 1~5 누적) ↔ PU1 본인 프로필 진입점 (★★★)

**현황**:
- UC1 `/profile/activity` (1575 · Phase 1~5 누적 보강 — 내 대회 / 내 경기 / 내 매너 / 내 팀 / 내 단체 / 내 신청)
- PU1 `/profile` (Phase 13 박제 본인 hub)

**갭**:
- PU1 (본인 프로필) → UC1 (활동) 진입 자연 흐름
- PU1 의 상단 카운트 = UC1 안 카드 카운트와 동일 source
- "내 활동" 진입 CTA = PU1 안 카드

**의뢰 대상**: PU1 보강 (UC1 진입 CTA + 카운트 동기화)

---

## 2. 의뢰 범위 — 6 시안 (사용자 5 + super-admin 1)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| PU1 | ProfileMain (보강) | `/profile` | 보강 | BP1 + BP6 |
| PU2 | ProfileEdit (보강) | `/profile/edit` | 보강 | BP4 (작은 시각만) |
| PU3 | ProfileBasketball (신규) | `/profile/basketball` | **신규** | BP2 ★★★★ |
| PU4 | ProfileAchievements (보강) | `/profile/achievements` | 보강 | BP3 cross-domain |
| PU5 | UserPublicProfile (신규) | `/users/[id]` | **신규** | BP1 양측 |
| PA1 | AdminUsers (신규) | `/admin/users` | **신규** | BP5 (Phase 4 OA1 답습) |

**총 6 시안** (사용자 5 + super-admin 1) — Phase 4 답습 규모.

### 양측 다리 (BP 시리즈)

| BP | 등급 | 사용자 ↔ super-admin / cross-domain | 운영 데이터 |
|----|------|---------------------------------|-----------|
| BP1 | ★★★★★ | PU1 본인 ↔ PU5 공개 정합 | User.* (공개/비공개 분기 · privacy_settings) |
| BP2 | ★★★★ | PU3 ↔ Phase 2 BG4 (MVP) + 시즌 stat | UserSeasonStat + games.final_mvp_user_id |
| BP3 | ★★★ | PU4 ↔ Phase 1A PA7 우승 | user_badges + Tournament.champion_team_id |
| BP4 | ★★★★ | PU2 ↔ PU1 동기화 | User.* 편집 |
| BP5 | ★★ | (없음) ↔ PA1 검수 | User.status (active/suspended) |
| BP6 | ★★★ | PU1 ↔ UC1 (활동 1575 · Phase 1~5 누적) | game_applications + team_join_requests + community_posts 등 cross-domain |

---

## 3. 사용자 결재 (이미 받음)

```
□ 영역 = 프로필·마이페이지 본체 ✅
□ 분할 = Phase 6.1 (본체 6) + 6.2 후속 (결제·구독) + 6.3 후속 (성장 분석)
□ 갭 = 6 (BP1~BP6)
□ Claude.ai 전달 = 1 세션 통합
```

---

## 4. Phase 6.1 진행 흐름

```
① 점검 리포트  ✅ 본 문서
② 갭 분석     ✅ BP1~BP6
③ 사용자 결재  ✅
④ 의뢰 작성   ⏸ profile-user / profile-admin
⑤~⑭          ⏸
```

---

**리포트 끝.** 6 시안 의뢰. 후속 6.2/6.3 별 의뢰 예고.
