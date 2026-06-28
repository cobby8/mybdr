# 클로드 디자인 의뢰 — 프로필·마이페이지 본체 사용자 측 (Phase 6.1B)

> **의뢰일**: 2026-05-30
> **상위 계획서**: `profile-user-admin-connectivity-plan-2026-05-30.md` (BP1~BP6)
> **선행 박제**: Phase 1~5 = 박제 + 운영 반영 완료
> **본 의뢰 범위**: 5 시안 (PU1~PU5) — 사용자 측 + 공개 프로필
> **차이 의뢰서**: `profile-admin-redesign-prompt-2026-05-30.md` (Phase 6.1A · PA1 1 시안 · super-admin)
> **★ 분할**: 본 의뢰 = Phase 6.1 (본체) / 후속 = 6.2 결제·구독 + 6.3 성장 분석 (별 의뢰)

---

## 0. 진입 표준 절차

Phase 5 의뢰서 §0 답습 + Phase 1~5 시안 carry-over (변경 ❌) — BDR-current/ 안 45 jsx + 7 css + game-shared + team-shared + org-shared + comm-shared.

---

## 1. 한 줄 요약

`/profile` (PU1 보강) + `/profile/edit` (PU2 보강) + `/profile/basketball` (PU3 신규) + `/profile/achievements` (PU4 보강) + `/users/[id]` (PU5 공개 프로필 신규) = **5 시안**. BP1 본인↔공개 정합 + BP2 농구 시즌 stat + BP3 업적 cross-domain + BP6 활동 진입 다리.

---

## 2. 결재 룰

### Phase 6.1 (2026-05-30)
- ✅ **BP1 정합** = PU1 본인 시야 + PU5 공개 시야 = 동일 User 데이터 / privacy_settings 분기로 시각 분리
- ✅ **BP2 농구 stat** = PU3 = Phase 2 BG4 (final_mvp_user_id 30일 집계) + UserSeasonStat + Phase 3 BT6 (팀 wins) cross-domain
- ✅ **BP3 업적** = PU4 보강 = user_badges + Phase 1A PA7 우승 자동 표시
- ✅ **BP4 편집** = PU2 보강 (시각 작게) — 운영 v2.3 박제 그대로 carry / 결제 섹션 = Phase 6.2 link out
- ✅ **BP6 활동 진입** = PU1 → UC1 (1575 line · 누적 박제됨) 자연 link
- ❌ 새 라우트 ❌ / Phase 1~5 시안 변경 ❌

---

## 3. 5 시안 사양

### PU1 — ProfileMain (보강) · `/profile`

**현황**: 831 line · Phase 13 박제 ✅ (BDR-current/MyPage.jsx 출처)

**보강** (작은 변경):
- PU1-A · 상단 카운트 = UC1 활동 카드 카운트 동기화 (내 대회 N · 내 경기 M · 내 팀 K · 내 단체 L · 평점 X.Y)
- PU1-B · "내 활동" 카드 = `/profile/activity` (UC1) 진입 CTA
- PU1-C · BP1 본인 / 다른 사람 시야 = same User 데이터 그대로 (privacy_settings 분기)
- PU1-D · "프로필 편집" CTA = PU2 진입
- PU1-E · 농구 정보 카드 미니 (PU3 link) — dominant_hand / skill_level / strengths 3 chip
- PU1-F · 업적 카드 미니 (PU4 link) — 최근 user_badges 3
- PU1-G · 공개 프로필 미리보기 CTA — "다른 사람에게 어떻게 보이나" → PU5 (preview 모드)

### PU2 — ProfileEdit (보강) · `/profile/edit`

**현황**: 1689 line · v2.3 박제 ✅ (단일 스크롤 + Hero + 5섹션 Hybrid)

**보강** (작은 시각만 — 거대 carry-over):
- PU2-A · 5섹션 안 결제 섹션 = Phase 6.2 link out + "준비 중" 안내
- PU2-B · privacy_settings 토글 명확화 (공개 vs 비공개 chip)
- PU2-C · 저장 버튼 = "저장 + PU1 새로고침" 시각 명확화

### PU3 — ProfileBasketball (신규 박제) · `/profile/basketball`

**현황**: 1068 line · 박제 ❌ → **신규 핵심**

**시안 (신규)**:
- Hero band — "농구 정보" + 본인 농구 캐릭터 (dominant_hand + skill_level + level badge)
- **PU3-A · 농구 캐릭터 카드** = dominant_hand (좌/우/양손) + skill_level chip + strengths (Json[] → chip row)
- **PU3-B · 시즌 stat 카드 grid** (5종):
  - 참가 경기 (total_games_participated)
  - 호스트 (total_games_hosted)
  - **이달의 MVP** (Phase 2 BG4 · games.final_mvp_user_id 30일 집계) — cross-domain
  - **평점** (evaluation_rating)
  - **팀 활동** (Phase 3 BT6 · 본인 팀 wins/losses/draws 합계) — cross-domain
- **PU3-C · 선호 정보 chip 선택** (8 종 preferred_*):
  - preferred_divisions / regions / days / time_slots / skill_levels / game_types / board_categories / 등
  - chip 선택 UX = Phase 4 chip 패턴 답습
- **PU3-D · 우승 이력** — Phase 1A PA7 cross-domain (champion_team_id WHERE captain_id=me 또는 members.user_id=me)

### PU4 — ProfileAchievements (보강) · `/profile/achievements`

**현황**: 105 line · 작음 · Phase 1 박제 ✅ (서버 prisma.user_badges)

**보강**:
- PU4-A · user_badges grid (시각 보강 — badge icon + 이름 + 획득 시각)
- PU4-B · 대회 우승 자동 표시 (Phase 1A PA7 · Tournament.champion_team_id WHERE captain_id=me 또는 team_members.user_id=me)
- PU4-C · MVP 누적 (Phase 2 BG4 · 전체 게임 MVP 횟수)
- PU4-D · 시즌 stat 미니 (PU3 link)

### PU5 — UserPublicProfile (신규 박제) · `/users/[id]`

**현황**: 769 line · 박제 ❌ → **신규 핵심**

**시안 (신규)**:
- Hero band — 사용자 닉네임 + level badge + 공개 정보 (city / district / 농구 캐릭터 일부)
- **PU5-A · 공개 stat 카드** = PU3 와 동일 데이터 BUT privacy_settings 필터링
- **PU5-B · 본인이 아닐 시 CTA**:
  - "팀 초대" (본인이 팀 캡틴/매니저 시)
  - "1:1 메시지" (`/messages` 진입)
  - "신고" (운영 미확인 — 데이터 있으면 / 없으면 hide)
- **PU5-C · 활동 미리보기**:
  - 최근 참가 경기 5 (Phase 2 cross-domain)
  - 소속 팀 (Phase 3 cross-domain)
  - 소속 단체 (Phase 4 cross-domain)
  - 작성 글 (Phase 5 cross-domain · 공개 글만)
- **PU5-D · 본인 시야 = PU1 redirect** 또는 "이건 다른 사람에게 어떻게 보이는지" preview 모드

---

## 4. 양측 의존 검증

| BP | 사용자 측 (본 의뢰) | 데이터 | cross-domain |
|----|-------------------|--------|-------------|
| BP1 | PU1 본인 ↔ PU5 공개 | User.* + privacy_settings | (없음 · 단독 정합) |
| BP2 | PU3 농구 stat | UserSeasonStat | Phase 2 BG4 + Phase 3 BT6 |
| BP3 | PU4 업적 | user_badges | Phase 1A PA7 (champion_team_id) + Phase 2 BG4 |
| BP4 | PU2 편집 → PU1 동기화 | User.* 갱신 | (단독) |
| BP6 | PU1 → UC1 (활동) 진입 | game_applications / team_join_requests / community_posts | Phase 1~5 cross-domain |

---

## 5. 13 룰 + Phase 1~5 carry-over

- ❌ AppNav / 새 라우트 ❌
- ✅ Phase 1~5 시안 carry-over (변경 ❌) — 45 jsx + 7 css + 4 shared 컴포넌트
- ✅ BP1 본인/공개 시각 일관 (User 데이터 단일 source / privacy_settings 분기)
- ✅ BP2 cross-domain = Phase 2/3 동일 컬럼 출처 (mock 0)
- ✅ BP4 PU2 보강 = 거대 carry-over / 시각 작은 변경만

---

## 6. 자체 검수 (Phase 5 답습)

기본 12 케이스 + Phase 6 특수 4:
- ✅ BP1 본인 (PU1) / 공개 (PU5) 같은 데이터 / privacy_settings 필터링 정확
- ✅ BP2 cross-domain mock 0 (운영 데이터 없으면 hide)
- ✅ PU3 5 stat 카드 grid responsive
- ✅ PU5 본인 시야 = redirect 또는 preview 모드 (혼동 ❌)

---

## 7. 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — 프로필·마이페이지 본체 사용자 (Phase 6.1B · PU1~PU5)

이해: PU1 보강 (BP1+BP6) + PU2 보강 (BP4 시각) + PU3 신규 농구 stat (BP2) + PU4 보강 (BP3 cross-domain) + PU5 신규 공개 프로필 (BP1 양측).
양측 의존 = BP1~BP4/BP6.
사용자 결정 §1~§8 / AppNav frozen / 13 룰 / Phase 1~5 carry-over (변경 ❌).
Phase 6.2 (결제·구독) + 6.3 (성장 분석) 후속 별 의뢰 예고.
자체 검수: 06 §사용자 hub / stat / privacy
작업 시작.
```

---

**의뢰서 끝.**
