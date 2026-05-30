# BDR v2.23 — Phase 5 (랭킹 · 커뮤니티 영역) 박제

> **박제일**: 2026-05-30
> **선행**: Phase 1A v2.19 + Phase 1B v2.18 + Phase 2 v2.20 + Phase 3 v2.21 + Phase 4 v2.22 carry-over
> **선행 의뢰**: `ranking-community-user-redesign-prompt-2026-05-30.md` + `ranking-community-admin-redesign-prompt-2026-05-30.md` + `ranking-community-user-admin-connectivity-plan-2026-05-30.md`
> **결재 결과 (가정 lock — 의뢰서 결정 0)**:
>   - A1 댓글 = 운영 `comments` 모델 확인됨 (`commentable_type="CommunityPost"`) → CU2 댓글 실제 표시 (mock 최소) ✅
>   - A2 신고/Report = 모델 미확인 → CA1 "신고" 탭 hide (준비 중) · CU2 신고 버튼 비활성 ✅
>   - A3 카테고리 = 운영 8종 (자유게시판/팀원모집/대회후기/농구장터/질문답변/정보공유/공지사항/BDR NEWS=알기자) ✅
>   - A4 BC1 = "이달의 MVP" = 경기 최종 MVP 30일 / "팀 승수 리더" = 팀 전적 상위 ✅

---

## 1. Phase 5 박제 시안 = 6 (사용자 5 + 관리자 1)

### Phase 5B — 사용자 측 + cross-domain (RU1 + CU1~CU4 · A 등급)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| RU1 | Rankings (보강) | `/rankings` | 보강 | BC1 부문/MVP/wins + BC7 출처 |
| CU1 | CommunityList (보강) | `/community` | 보강 | BC2 카테고리 chip |
| CU2 | CommunityDetail (보강) | `/community/[id]` | 보강 | BC4 좋아요·댓글 + BC2 알기자 |
| CU3 | CommunityNew (5-step 마법사) | `/community/new` | **신규** | BC3 ★★★ |
| CU4 | CommunityEdit (CU3 재사용) | `/community/[id]/edit` | **신규** | BC5 prefill |

### Phase 5A — 관리자 측 (CA1 · E 등급 · super-admin)

| ID | 화면 | 라우트 | 분류 | 측 | 주 갭 |
|----|------|--------|------|----|-------|
| CA1 | AdminCommunity | `/admin/community` | **신규** | **Site Operator** | BC6 |

---

## 2. BC 양측·cross-domain 의존 검증

| BC | 등급 | 의존 | 데이터 |
|----|------|------|--------|
| BC1 | ★★★★ | RU1 MVP/wins ↔ 경기/팀 영역 | 경기 최종 MVP(30일) + 팀 전적(wins/losses/draws) |
| BC2 | ★★★ | CU1/CU2 알기자 ↔ Phase 1A 대회 | community_posts.category="news" + tournament 연결 |
| BC3 | ★★★ | CU3 마법사 (Phase 1B UA3 + Phase 4 OU3 답습) | community_posts (신규) |
| BC4 | ★★★ | CU2 좋아요/댓글 | community_post_likes + comments |
| BC5 | ★★ | CU4 = CU3 재사용 (prefill) | community_posts (수정) |
| BC6 | ★★ | CA1 super-admin 검수 | community_posts.is_pinned / status |
| BC7 | ★★★ | RU1 데이터 출처 footer | 경기 / 팀 / 코트 cross-domain |

---

## 3. carry-over (변경 ❌)

### 파일 — v2.22 그대로
- `tokens.css` / `shell.css` / `shared.jsx` / `game-shared.jsx` / `team-shared.jsx` / `team-shared.css` / `org-shared.jsx` / `org-shared.css` / `admin.css`
- Phase 1A v2.19 (10) + Phase 1B v2.18 (6) + Phase 2 v2.20 (10) + Phase 3 v2.21 (7) + Phase 4 v2.22 (8) = 41 wrapper + 39 jsx + _baseline 10 모두 carry-over

### 신규 추가
- `comm-shared.jsx` — Phase 5 mock (COMM_CATEGORIES / COMM_TYPES / COMM_POSTS / COMM_DETAIL / COMM_COMMENTS / RANK_PLAYERS / RANK_TEAMS / RANK_MVP / RANK_TEAM_LEADER) + mini components (CategoryBadge / PostTypeIcon / CommAuthor / CommunityAsideNav / commTime / commNum)
- `comm-shared.css` — Phase 5 전용 (.comm-* / .cat-badge / .cu-post / .cu1-* / .cu2-* / .ru1-* / .cw-* / .ca1-*)
- `screens/Rankings.jsx` (RU1)
- `screens/CommunityList.jsx` (CU1)
- `screens/CommunityDetail.jsx` (CU2)
- `screens/CommunityNew.jsx` (CU3 — `CommunityWizard` + `CommunityNew`)
- `screens/CommunityEdit.jsx` (CU4 — CommunityWizard 재사용)
- `screens/AdminCommunity.jsx` (CA1)
- 6 wrapper HTML (ru1 / cu1~4 / ca1)

---

## 4. 자체 검수 — 4 + 8 + Phase 5 특수 4 통과 ✅

### AppNav frozen 4 케이스 (사용자 시안 — shared.jsx 03 카피)
- ✅ main bar 우측 "더보기 ▼" / 아바타 = 0
- ✅ 모바일(≤768px) 듀얼 라벨 = 0 (ThemeSwitch viewport 분기)
- ✅ 검색/쪽지/알림 box (.btn) = 0 — `app-nav__icon-btn` 만
- ✅ main bar 아이콘 = [검색, 쪽지, 알림, 다크, 햄버거] (frozen 카피)

### 13 룰 8 케이스
- ✅ 하드코딩 색상 = 0 — `var(--*)` 토큰만 (예외: team/org `brand_color` mock data column · cat-badge는 토큰 매핑)
- ✅ lucide-react = 0 — Material Symbols Outlined 만
- ✅ rounded-full / 9999px = 0 — 정사각형 50% (avatar) 만
- ✅ 가짜링크 (gameResult / gameReport / guestApps / referee) = 0
- ✅ button 4px / 카드 6~8px
- ✅ placeholder 5단어 이내 / "예: " 시작 0
- ✅ 720px 분기 / iOS input 16px / 버튼 44px
- ✅ Pretendard + Archivo + JetBrains Mono 만

### Phase 5 특수 4 케이스
- ✅ **BC1 cross-domain** — RU1 MVP/wins = 경기/팀 영역 동일 데이터 컬럼 출처 (mock 0 — 운영 데이터 없으면 hide)
- ✅ **CU3 5-step 마법사** — Phase 1B UA3 + Phase 4 OU3 답습 시각 일관 (.ou3-* 재사용 · 사후 안내 hero + CTA)
- ✅ **CU4 = CU3 재사용** — CommunityWizard 단일 컴포넌트 (별 컴포넌트 ❌ · LOC 최소)
- ✅ **CA1 Site Operator badge** — Phase 4 OA1 답습 (OperatorBadge dark+gold + UD1 알림 체크박스)

---

## 5. 회귀 방지 — 위반 자동 검수 4 케이스 ✅
- ❌ main bar 우측 "더보기 ▼" dropdown / 아바타 = 0
- ❌ 모바일(≤768px) "☀ 라이트 ☾ 다크" 듀얼 라벨 = 0
- ❌ 검색/쪽지/알림 버튼 border/bg 박스 (.btn) = 0
- ✅ main bar 아이콘 순서 frozen 카피 보존

---

**박제 끝.** v2.22 carry-over 위 신규 6 시안 + comm-shared.jsx/css 추가. 운영 코드 변경 0.
