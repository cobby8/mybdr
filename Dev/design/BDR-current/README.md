# BDR v2.20 — 경기 영역 리디자인 (Phase 2)

> **의뢰**:
> - `uploads/game-admin-redesign-prompt-2026-05-25.md` (Phase 2A · 관리자 2 시안)
> - `uploads/game-user-redesign-prompt-2026-05-25.md` (Phase 2B · 사용자 + 다리 8 시안)
> **상위 계획서**: `game-user-admin-connectivity-plan-2026-05-25.md` (BG1~BG7 갭)
> **선행 박제**:
> - BDR v2.18 (Phase 1B — 대회 사용자 측 8 시안) sync 완료 (2026-05-25)
> - BDR v2.19 (Phase 1A — 대회 관리자 측 10 시안) sync 완료 (2026-05-26)
> **운영 코드 변경**: **0** — 시안 박제만 (운영 박제는 Phase 2C 별 Phase)

---

## v2.20 갱신 (2026-05-28) — Phase 2 (경기 영역 · 사용자↔관리자 연결 다리)

### Phase 2A — 관리자 측 보강 (2건 · E 등급)

- **UD1 AdminGames** — `/admin/games`
  - BG1 · 신청 대기 배너 (상단) + status 변경 모달 + **"사용자에게 알림 보내기" 체크박스 기본 ✅** + "변경 + 알림" CTA
  - BG5 · 우측 "최근 변경자" 컬럼 신규 (🏠 호스트 / 🛡️ super_admin / 🤖 시스템 + 시간) + 출처 filter chip
- **UD2 AdminGameReports** — `/admin/game-reports`
  - 3 탭 (신고 큐 / **매너 통계 신규** / 30일 추세)
  - BG2 사용자 결재 룰 — **평균 평점 + flag 종류만 / 개별 평가 건수 ❌**
  - 요약 카드 4 (전체 평가 / 평균 / 신고 발생률 / 가장 많이 받은 flag) + 평점 분포 + 상위/하위 매너 사용자 list

### Phase 2B — 사용자 측 부분수정 (5건 · A 등급)

- **UA1 Games** — `/games`
  - BG7 · 상단 sticky LIVE chip row (UC2 와 동일 LiveChipRow 컴포넌트)
  - BG4 · 종료 카드 hero 자리에 "🏆 우승팀 · MVP · 최종 score" 1줄
  - v2.16 GameCard 디자인 언어 보존 (Date Tile / Area Chip / Pretendard 900)
- **UA2 GameDetail** — `/games/[id]`
  - BG1 · sidebar "내 신청 현황" step indicator 신규 (3 step + 단계별 시간 + /profile/activity 딥링크)
  - BG4 분기 안내 → status='completed' 시 UB1 GameResult variant
  - v2.16 Hero + 5 섹션 (Summary / About / Slots / ApplyPanel / HostPanel) 보존
- **UA3 CreateGame** — `/games/new`
  - BG5 · "신청 정책" 토글 — 자동 승인 (기본 ON) vs 호스트 수동
  - BG3 보조 · 게스트 모집 토글 + 최소 경력 (1/2/3년/무제한) + 약관 동의 필수
  - v2 wizard 3 카드 + 라이브 프리뷰 보존
- **UA4 GuestApply** — `/games/[id]/guest-apply`
  - BG3 · user.skill_level → experience_years 자동 추론 + prefill + ⓘ "내 프로필 실력에서 자동" 라벨 / 수정 가능 / "자동값으로" 복귀 버튼
  - BG1 사후 안내 = "호스트 승인 시 알림으로 알려드립니다" 1줄 (마이페이지 step 과 통일)
- **UA5 Live** — `/live/[id]`
  - BG7 · Hero 라벨 강화 — 대회 매치 (🏆 var(--cafe-blue)) vs 일반 경기 (🏀 var(--accent)) 시각 분리
  - 하단 "같은 대회 다음 매치" / "같은 호스트 다음 경기" 영역 신규

### Phase 2B — 신규 (1건 · A 등급)

- **UB1 GameResult** — `/games/[id]` · status='completed' variant
  - BG4 ★★★★★ 핵심 — **같은 라우트 status 분기** (신규 라우트 ❌ / 더보기 가짜링크 룰 통과)
  - 🏆 + MVP Hero (Pretendard 900 큰) + 최종 score (Home vs Away)
  - 4 카드 = 참가자 (Concept B 5×2 보존) + MVP·Best 3 + 매너 평가 진입 (4/10 progress) + 호스트 한마디
  - 데이터 출처 = `games.final_mvp_user_id` + `recomputeFinalMvp()` (운영 박제)

### Phase 2B — 보강 (2건 · A 등급)

- **UC1 MyActivity** — `/profile/activity`
  - Phase 1B "내 대회" 섹션 보존 (변경 ❌)
  - **"내 경기" 신규 (BG6)** — game_applications 조회 / 상태별 정렬 (pending → approved → live → completed → rejected) + step indicator (UA2 sidebar 와 동일 ApplyStep 컴포넌트)
  - **"내 매너" 카드 신규 (BG2)** — 평균 평점 + 받은 flag 종류만 / 개별 건수 ❌ / 빈 상태 안내
  - 상단 카운트 = "내 대회 N · 내 경기 M · 평균 매너 X.Y"
- **UC2 Home** — `/`
  - **BG7 ★★★★ — Hero 카로셀 위 sticky LIVE chip row 신규** (AppNav 바로 아래)
  - **사용자 결정 §5 — Hero 카로셀 변경 ❌ (보존)** / 본 시안은 위 sticky 추가 영역만
  - 라이브 0건 = 띠 hidden / 1~4건 = chip row / 5+ = 가로 스크롤 / chip 클릭 → /live/[id]
  - 본문 변경 0

---

## 산출물 구조

```
Dev/design/BDR v2.20/
├── README.md                            ← 본 파일
├── index.html                           ← v2.20 시안 목차 (Phase 2 + Phase 1A/1B carry-over)
├── tokens.css                           ← v2.19 동일 (변경 ❌)
├── shell.css                            ← v2.19 + Phase 2 추가 (LiveChipRow / ApplyStep / MannerCard / Game* / Live* / GameResult* / Home*)
├── admin.css                            ← v2.19 + Phase 2 추가 (AGR 매너 통계 / 평점 분포 / 추세 차트)
├── shared.jsx                           ← v2.19 동일 (AppNav frozen + AdminShell)
├── game-shared.jsx                      ← NEW · Phase 2 데이터 + LiveChipRow / ApplyStep / MannerCard / KindBadge / StatusBadge
│
├── Phase 2 시안 (10) · 신규 ───────────────────────────────────
├── p2-ud1-admin-games.html              ← UD1 (BG1 + BG5)
├── p2-ud2-admin-game-reports.html       ← UD2 (BG2)
├── p2-ua1-games.html                    ← UA1 (BG7 + BG4)
├── p2-ua2-game-detail.html              ← UA2 (BG1 + BG4 분기)
├── p2-ua3-create-game.html              ← UA3 (BG5 + BG3 보조)
├── p2-ua4-guest-apply.html              ← UA4 (BG3)
├── p2-ua5-live.html                     ← UA5 (BG7)
├── p2-ub1-game-result.html              ← UB1 NEW (BG4 ★★★★★)
├── p2-uc1-my-activity.html              ← UC1 보강 (BG6 + BG2)
├── p2-uc2-home.html                     ← UC2 보강 (BG7 ★★★★)
│
├── Phase 1A v2.19 carry-over (10) ──────────────────────────────
├── pa1-admin-list.html ~ pa9-admin-prospectus.html
├── ud1-admin-teams.html (대회 참가팀)
│
├── Phase 1B v2.18 carry-over (5) ──────────────────────────────
├── ua1-tournaments.html ~ uc1-my-activity.html
├── ud2-admin-bracket.html (대회 대진표)
├── ud3-admin-setup.html (대회 셋업 — B1+B7)
│
└── screens/
    ├── Phase 2 시안 jsx (10) ─────────────────────────────────
    │   ├── AdminGames.jsx / AdminGameReports.jsx
    │   ├── Games.jsx / GameDetail.jsx / CreateGame.jsx / GuestApply.jsx / Live.jsx
    │   ├── GameResult.jsx
    │   ├── MyActivity.jsx (Phase 1B "내 대회" 위에 보강)
    │   └── Home.jsx (Hero 위 sticky 보강)
    │
    ├── Phase 1A/1B 시안 jsx (17) carry-over
    │   └── AdminTournament*.jsx / Tournaments*.jsx / MyRegistrationStatus.jsx / 등 + css 6
    │
    └── _baseline/                       ← Phase 2 baseline 10 (CLI sync 참조용 / 운영 박제 원본)
        ├── AdminGames.jsx / AdminGameReports.jsx
        ├── Games.jsx / GameDetail.jsx / CreateGame.jsx / GuestApply.jsx / Live.jsx
        ├── GameResult.jsx / Home.jsx / MyActivity.jsx
```

---

## BG 양측 의존 검증 (박제 마지막 단계 의무)

| 갭 | 영향도 | 사용자 측 시안 | 관리자 측 시안 | 데이터 출처 |
|----|-------|--------------|-------------|-----------|
| **BG1** 신청 알림 | ★★★ | UA2 step indicator + UC1 "내 경기" | UD1 status 변경 모달 + 알림 | `game_applications.status` |
| **BG2** 매너 | ★★★ | UC1 "내 매너" 카드 | UD2 매너 통계 탭 | `game_player_ratings` 평균 + flags |
| **BG3** 경력 자동 | ★★★ | UA3 게스트 토글 + UA4 자동 채우기 | — | `user.skill_level` → `experience_years` |
| **BG4** MVP | ★★★★★ | UB1 GameResult variant + UA1 종료 카드 | — | `games.final_mvp_user_id` + `recomputeFinalMvp()` |
| **BG5** 자동 승인 | ★★ | UA3 토글 | UD1 액션 출처 컬럼 | `games.host_id` vs super_admin |
| **BG6** 통합 hub | ★★★★ | UC1 마이페이지 "내 경기" + "내 대회" | — | `game_applications` + `tournament_applications` |
| **BG7** 라이브 | ★★★★ | UC2 홈 Hero 위 sticky + UA1 Games 상단 + UA5 진입점 | — | live data + WebSocket |

**일관 룰:**
- BG1 신청 데이터 모델 = UD1 큐 ↔ UA2 step ↔ UC1 "내 경기" 단계 동일
- BG2 노출 룰 = UD2 통계 ↔ UC1 "내 매너" = 평균 + 종류만 / 개별 건수 ❌
- BG7 LIVE chip row = UC2 + UA1 = 동일 LiveChipRow 컴포넌트 (game-shared.jsx)

---

## 사용자 결정 §1~§8 보존 매트릭스

| § | 결정 | 본 의뢰 영향 |
|---|------|------------|
| §1 AppNav 9 탭 | 강제 (A 등급) | 8 사용자 시안 모두 03 frozen 카피 |
| §2 더보기 가짜링크 ❌ | 글로벌 | 신규 라우트 0 / 가짜링크 4건 0 |
| §3 팀 페이지 레이팅 stat | 팀 한정 | UC1/UD2 매너 = 별 맥락 (충돌 0) |
| §4 프로필 이모지 | 프로필 한정 | 직접 영향 0 |
| **§5 Hero 카로셀** | **홈 한정** | **UC2 변경 ❌ / 위 sticky 추가만** |
| §6 글로벌 카피 시안 우선 | 글로벌 | 본 시안 카피 우선 |
| §7 모바일 (720px / 16px / 44px) | 글로벌 | 10 시안 모두 적용 ✅ |
| §8 인증 captainId | 인증 일반 | 직접 영향 0 |

---

## 회귀 방지 자체 검수 — 4 + 8 케이스

**4 케이스 (00 §회귀 방지 필수)**

- ❌ main bar 우측 "더보기 ▼" / 아바타 노출 = 0
- ❌ 모바일(≤768px) "☀ 라이트 ☾ 다크" 듀얼 라벨 = 0
- ❌ 검색/쪽지/알림 box (.btn / .btn--sm) = 0
- ✅ main bar 5 아이콘 순서 = [다크, 검색, 쪽지, 알림, 햄버거] 보존

**8 케이스 (06 §자체 검수)**

- ✅ 하드코딩 색상 = 0 (var(--*) 토큰만)
- ✅ lucide-react import = 0 (Material Symbols Outlined 만)
- ✅ rounded-full / 9999px = 0
- ✅ 가짜링크 (gameResult / gameReport / guestApps / referee) = 0
- ✅ button border-radius 4px / 카드 6~8px 일관
- ✅ placeholder 5단어 이내 / "예: " 시작 ❌
- ✅ 720px 분기 / iOS input 16px / 버튼 44px
- ✅ Pretendard + Archivo + JetBrains Mono 만

---

## 다음 단계

1. **수빈** → 본 v2.20 zip 으로 CLI sync 의뢰 (Cowork 가 sync prompt 작성 → 운영 코드 패치)
2. Phase 2C — 운영 박제 (CLI 가 baseline 10 jsx 를 운영 src/ 에 머지 + 본 시안의 BG 보강 추가)
3. Phase 3 — BG8 자동 매칭 (별 Phase / 추천 알고리즘 + admin 대시보드)

---

## 이전 버전 README (carry-over 참고)

Phase 1A 박제 내역은 `Dev/design/BDR v2.19/README.md` 참조.
Phase 1B 박제 내역은 `Dev/design/BDR v2.18/README.md` 참조.
