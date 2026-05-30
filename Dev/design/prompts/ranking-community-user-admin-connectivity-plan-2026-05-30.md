# Phase 5 — 랭킹·커뮤니티 영역 사용자↔관리자 연결 다리 점검 리포트

> **작성일**: 2026-05-30
> **작성**: Cowork
> **선행 박제**: Phase 1 (대회) + Phase 2 (경기) + Phase 3 (팀) + Phase 4 (단체) 모두 운영 박제 완료 (#654/#655 머지)
> **결재**: 영역 = **랭킹·커뮤니티 묶음** ✅ (2026-05-30)
> **특수**: 2 영역 묶음 (랭킹 + 커뮤니티 = 별 도메인이지만 작은 단위 묶음 / Phase 4 답습 = 3 측 stakeholder)

---

## 0. 영역 매핑

### 0-1. 랭킹 영역 (AppNav 7번째 탭)

| ID 후보 | 라우트 | LOC | v2 박제 흔적 |
|---------|--------|-----|------------|
| RU1 | `/rankings` | 25 (wrapper) + RankingsContent + v2-podium + v2-player-board + v2-team-board + bdr-ranking-table (5 컴포넌트) | ✅ v2 부분 박제 |
| (없음) | `/admin/rankings` | 없음 | - |

### 0-2. 커뮤니티 영역 (AppNav 8번째 탭)

| ID 후보 | 라우트 | LOC | v2 박제 흔적 |
|---------|--------|-----|------------|
| CU1 | `/community` (list) | 47 (wrapper) + community-content + community-aside + aside-nav + sidebar (4 컴포넌트) | ⚠ 부분 박제 |
| CU2 | `/community/[id]` (상세) | 539 + _components/ | ⚠ 부분 박제 |
| CU3 | `/community/new` (작성) | 399 | ❌ |
| CU4 | `/community/[id]/edit` (수정) | 698 | ❌ |
| CA1 | `/admin/community` (super-admin) | 91 (작음) | ❌ |

**총 LOC** = 랭킹 ~500 (v2 박제 포함) + 커뮤니티 ~1800 (운영) = ~2300

### 0-3. Prisma 모델

```
community_posts          (line 1094) — 게시글
  - id / category / type / title / content / image_url
  - author_id / team_id (선택) / view_count / like_count / comment_count
  - is_pinned / is_deleted / created_at / updated_at
community_post_likes     (line 1141) — 좋아요 (별 모델)
```

→ 랭킹은 **별 model 없음** — Phase 2 BG4 (`games.final_mvp_user_id`) + Phase 3 BT6 (`Team.wins/losses/draws`) + 부문별 stats 집계.

### 0-4. Phase 1A PA9 prospectus / Phase 1A 대회 알기자 (community 카테고리) 연결

운영 `community_posts.category` 안 "대회 알기자" 카테고리 = Phase 1A PA9 prospectus 의 후속 게시물. cross-domain.

---

## 1. 갭 식별 (BC1~BC7) — 영향도

> **명명 규칙**: BC = "Bridge Connector" (랭킹+커뮤니티 연결 다리 — BG/BT/BO 답습)

### BC1 — 랭킹 부문 + 스코프 cross-domain (★★★★)

**현황**: /rankings v2 박제 ✅ (Podium + PlayerBoard + TeamBoard + BdrRankingTable)

**갭**:
- 부문 분리 명확화 (개인: 득점 / 리바운드 / 어시스트 / 매너 등 / 팀: wins / losses / 우승)
- **Phase 2 BG4 MVP** = 랭킹의 "이달의 MVP" 카드 보강 (cross-domain reference)
- **Phase 3 BT6 wins/losses/draws** = 팀 랭킹 보강
- 코트별 랭킹 (`/courts/[id]/rankings` API 존재 = cross-domain Phase 5+ 코트 영역)

**의뢰 대상**: RU1 보강

### BC2 — 커뮤니티 게시글 카테고리 + 유형 위계 (★★★)

**현황**: `community_posts.category` 다양 (대회 알기자 / 자유 / Q&A 등) + `type` 별 분기

**갭**:
- 카테고리 chip row + 필터 명확화
- "대회 알기자" 카테고리 = Phase 1A PA9 prospectus 후속 — 자동 연결 시각
- 유형별 시각 분리 (텍스트 / 이미지 / 영상 등)
- 팀별 게시글 (`team_id` 있을 시) cross-domain Phase 3 TU2

**의뢰 대상**: CU1 보강 + CU2 보강

### BC3 — 커뮤니티 작성 마법사 (★★★)

**현황**: `/community/new` 399 line · 박제 ❌

**갭**:
- 카테고리 선택 → 유형 선택 → 본문 + 이미지 → 미리보기 → 제출 step 명확화
- "대회 알기자" 카테고리 = 대회 (Tournament) 선택 필드 (Phase 1A cross-domain)
- 팀 선택 (선택) = Phase 3 TU2 cross-domain
- 임시 저장 (draft) 흐름

**의뢰 대상**: CU3 신규 박제 또는 보강

### BC4 — 커뮤니티 상세 + 댓글 + 좋아요 (★★★)

**현황**: `/community/[id]` 539 line + _components/

**갭**:
- 본문 + 메타 (author / team / view_count / like_count / created_at)
- 댓글 시스템 (운영 미확인 — 별 모델 있는지 점검 필요)
- 좋아요 (community_post_likes 모델 ✅)
- "이 작성자의 다른 글" / "이 카테고리 다른 글" 추천

**의뢰 대상**: CU2 보강

### BC5 — 커뮤니티 수정 흐름 (★★)

**현황**: `/community/[id]/edit` 698 line · 박제 ❌

**갭**:
- 본인 게시글만 수정 가능 (author_id 검증)
- 작성 마법사 (CU3) 답습 + 기존 데이터 prefill

**의뢰 대상**: CU4 신규 박제 또는 CU3 와 통합

### BC6 — super-admin 커뮤니티 검수 (★★)

**현황**: `/admin/community` 91 line · 박제 ❌

**갭**:
- pinned / hidden / deleted 상태 관리
- 신고 게시글 처리 (운영 미확인)
- Phase 4 OA1 답습 (Site Operator badge + 상태 변경 모달 + 알림 체크박스)

**의뢰 대상**: CA1 신규 박제

### BC7 — 랭킹 cross-domain 정합 (★★★)

**현황**:
- `/api/web/rankings` + `/rankings/bdr` + `/courts/[id]/rankings` 3 API
- 랭킹 데이터 출처 다양 (대회 stat / 게임 stat / BDR 자체 알고리즘)

**갭**:
- Phase 2 BG4 MVP = 랭킹의 "월간 MVP" / "대회 MVP" cross-domain
- Phase 3 BT6 팀 wins/losses = 랭킹 팀 보드
- 부문별 데이터 출처 명확화 (시안 안 footer 또는 tooltip)

**의뢰 대상**: RU1 보강

---

## 2. 의뢰 범위 — 7 시안 (사용자 5 + 관리자 2)

### Phase 5B 사용자 측 (5 시안 · A 등급)

| ID | 화면 | 라우트 | 분류 | LOC | 주 갭 |
|----|------|--------|------|-----|------|
| RU1 | Rankings (보강) | `/rankings` | 보강 | 25 + 5 v2 | BC1 부문 + BC7 cross-domain |
| CU1 | Community list (보강) | `/community` | 보강 | 47 + 4 컴포넌트 | BC2 카테고리 chip |
| CU2 | CommunityDetail (보강) | `/community/[id]` | 보강 | 539 | BC4 댓글 + 좋아요 + 추천 |
| CU3 | CommunityNew (신규 박제) | `/community/new` | **신규** | 399 | BC3 마법사 |
| CU4 | CommunityEdit (CU3 답습) | `/community/[id]/edit` | **신규** | 698 | BC5 prefill 답습 |

### Phase 5A super-admin 측 (1 시안)

| ID | 화면 | 라우트 | 분류 | LOC | 주 갭 |
|----|------|--------|------|-----|------|
| CA1 | AdminCommunity (신규 박제) | `/admin/community` | **신규** | 91 (매우 작음) | BC6 |

### 양측 다리 (BC 시리즈)

| BC | 등급 | 사용자 ↔ super-admin / cross-domain | 운영 데이터 |
|----|------|----------------------------------|-----------|
| BC1 | ★★★★ | RU1 부문 ↔ Phase 2 BG4 / Phase 3 BT6 | games.final_mvp_user_id + Team.wins/losses/draws |
| BC2 | ★★★ | CU1/CU2 카테고리 ↔ Phase 1A PA9 prospectus cross-domain | community_posts.category |
| BC3 | ★★★ | CU3 마법사 (단독 사용자) | community_posts (신규) |
| BC4 | ★★★ | CU2 댓글/좋아요 (단독 사용자) | community_post_likes |
| BC6 | ★★ | (없음) ↔ CA1 검수 | community_posts.is_pinned/is_deleted |
| BC7 | ★★★ | RU1 ↔ Phase 2/3 cross-domain | 3 API + cross-domain stats |

**총 = 6 시안** (RU1 + CU1~4 + CA1) → "총 7 시안" 으로 묶기엔 CU3/CU4 통합 가능. 실제 = **5~7 시안 (의뢰서에서 결정)**.

---

## 3. 사용자 결재 (점검 리포트 — 본 영역 결재 이미 받음)

```
□ 영역 = 랭킹·커뮤니티 묶음 ✅ (2026-05-30 결재)
□ 의뢰 범위 = 6~7 시안 (RU1 + CU1~CU4 + CA1)
□ 갭 = 7 (BC1~BC7)
□ Claude.ai 전달 = 1 세션 통합 (Phase 4 답습)
□ Phase 5C 운영 박제 = sync 후 별 의뢰서 (PR ~7건 예상)
```

---

## 4. Phase 5 진행 흐름 (phase-ledger 답습)

```
① 점검 리포트  ✅ 본 문서 (2026-05-30)
② 갭 분석     ✅ BC1~BC7 = 7 갭
③ 사용자 결재  ✅ (영역 + 7 시안)
④ 의뢰 작성   ⏸ ranking-community-user / ranking-community-admin
⑤ phase-ledger 갱신  ⏸
⑥ git commit  ⏸
⑦ Claude.ai 전달  ⏸ 수빈 (drag-drop + paste)
⑧ 시안 박제    ⏸ Claude.ai (BDR v2.23 예상)
⑨ zip 출력    ⏸
⑩ sync 실행   ⏸ CLI
⑪ 운영 박제 (Phase 5C)  ⏸ CLI (Auto Chain 답습 / PR ~7)
⑫ ~ ⑭          ⏸
```

---

**리포트 끝.**
