# 클로드 디자인 의뢰 — 랭킹·커뮤니티 사용자 측 (Phase 5B)

> **의뢰일**: 2026-05-30
> **상위 계획서**: `ranking-community-user-admin-connectivity-plan-2026-05-30.md` (BC1~BC7)
> **선행 박제**: Phase 1 (대회) + Phase 2 (경기) + Phase 3 (팀) + Phase 4 (단체) 모두 완료
> **본 의뢰 범위**: 5 시안 (RU1 + CU1~CU4) — 사용자 측
> **차이 의뢰서**: `ranking-community-admin-redesign-prompt-2026-05-30.md` (Phase 5A · CA1 1 시안)

---

## 0. 진입 표준 절차

→ Phase 4 의뢰서 §0 답습:
- Project Knowledge 9 파일 읽기
- 13 룰 + AppNav frozen 03 카피
- 사용자 결정 §1~§8 보존
- ★ Phase 1A/1B/2/3/4 시안 carry-over (변경 ❌) — BDR-current/ 안 39 jsx + 6 css + game-shared + team-shared + org-shared

---

## 1. 한 줄 요약

`/rankings` (RU1 보강 + Phase 2 BG4 / Phase 3 BT6 cross-domain) + `/community` (CU1 list 보강) + `/community/[id]` (CU2 상세 보강) + `/community/new` (CU3 신규 작성 마법사) + `/community/[id]/edit` (CU4 수정) = **5 시안**.

---

## 2. 결재 룰

### Phase 5 결재 룰 (2026-05-30)
- ✅ **BC1 부문 cross-domain** = RU1 의 "이달의 MVP" / "팀 wins 리더" = Phase 2 `games.final_mvp_user_id` + Phase 3 `Team.wins/losses/draws` 동일 데이터
- ✅ **BC2 카테고리 cross-domain** = CU1/CU2 "대회 알기자" 카테고리 = Phase 1A PA9 prospectus 후속 (자동 연결)
- ✅ **BC3 작성 마법사** = CU3 = Phase 1B UA3 (5-step) + Phase 4 OU3 (5-step) 답습 패턴
- ✅ **BC5 수정** = CU4 = CU3 prefill 답습 (별 마법사 ❌ — 동일 컴포넌트 재사용)
- ❌ **새 라우트 ❌** (RU1~CU4 모두 기존)
- ❌ **Phase 1~4 시안 변경 ❌** (carry-over)

---

## 3. 5 시안 사양

### RU1 — Rankings (보강) · `/rankings`

**현황**: 25 line wrapper + RankingsContent + v2-podium + v2-player-board + v2-team-board + bdr-ranking-table (5 컴포넌트 v2 박제 ✅)

**보강**:
- RU1-A · 부문 chip row sticky (개인: 득점 / 리바운드 / 어시스트 / 매너 / 팀: wins / 우승)
- RU1-B · "이달의 MVP" Hero card (BC1 · Phase 2 `games.final_mvp_user_id` 최근 30일 집계)
- RU1-C · 팀 wins 리더 카드 (BC1 · Phase 3 `Team.wins/losses/draws` 동기화)
- RU1-D · 코트별 랭킹 진입 chip (cross-domain Phase 5+ 코트 영역 — `/courts/[id]/rankings` API 활용)
- RU1-E · footer / tooltip — 데이터 출처 명시 (각 부문별 데이터 흐름)

### CU1 — Community list (보강) · `/community`

**현황**: 47 line wrapper + community-content + community-aside + aside-nav + sidebar (4 컴포넌트)

**보강**:
- CU1-A · 카테고리 chip row sticky (BC2)
- CU1-B · 카테고리별 카드 시각 분리 (대회 알기자 / 자유 / Q&A / 갤러리 등)
- CU1-C · "대회 알기자" 카테고리 = Phase 1A PA9 cross-domain link (해당 대회 prospectus 자동 표시)
- CU1-D · "+ 글 쓰기" CTA → `/community/new` (CU3)
- CU1-E · sidebar — "이 주 인기 글 5" / "내 활동 (작성 N · 좋아요 M)"

### CU2 — CommunityDetail (보강) · `/community/[id]`

**현황**: 539 line + _components/

**보강**:
- CU2-A · Hero band — title + 카테고리 badge + 메타 (author / team chip / view_count / like_count / created_at)
- CU2-B · 본문 + image_url 시각 (영상 / 이미지 / 텍스트 별 분기)
- CU2-C · 좋아요 카드 (BC4 · community_post_likes)
- CU2-D · 댓글 시스템 (운영 데이터 있을 시 / 없으면 hide + "준비 중")
- CU2-E · sidebar 추천 = "이 작성자의 다른 글 3" + "이 카테고리 다른 글 5"
- CU2-F · 본인 게시글이면 "수정" / "삭제" CTA (`/community/[id]/edit` 진입)
- CU2-G · 대회 알기자 카테고리 = Phase 1A 해당 대회 hero badge (cross-domain BC2)

### CU3 — CommunityNew (신규 박제 · 작성 마법사) · `/community/new`

**현황**: 399 line · 박제 ❌

**시안 (신규 박제 · Phase 1B UA3 / Phase 4 OU3 답습 5-step)**:

```
Step 1 · 카테고리 선택 (대회 알기자 / 자유 / Q&A / 갤러리 / 등)
Step 2 · 유형 선택 (텍스트 / 이미지 / 영상)
Step 3 · 본문 + 첨부 (title + content + image_url)
Step 4 · 메타 (대회 알기자 = 대회 선택 / Q&A = 답변 가능 시간 등 · 카테고리별 분기)
Step 5 · 미리보기 + 제출
사후 안내 = "게시되었습니다" + "글 보기" CTA → CU2 진입
```

- 임시 저장 (draft) 흐름 = localStorage 또는 server-side (운영 미확인)
- 카테고리 별 컨텍스트 필드 분기 (대회 알기자 → 대회 선택 / 갤러리 → 이미지 필수 등)
- 팀 선택 (선택 / cross-domain Phase 3) = `team_id` 컬럼

### CU4 — CommunityEdit (수정 · CU3 답습) · `/community/[id]/edit`

**현황**: 698 line · 박제 ❌

**시안 (CU3 답습)**:
- CU3 의 5-step 마법사 컴포넌트 재사용 (별 컴포넌트 ❌)
- 기존 데이터 prefill (title / content / image_url / category / team_id)
- 본인 author_id 검증 (시각만 — 운영 데이터 가드)
- 사후 안내 = "수정되었습니다" + CU2 진입

---

## 4. 양측 의존 검증

| BC | 사용자 측 (본 의뢰) | 관리자 측 (admin) | cross-domain |
|----|-------------------|-----------------|-------------|
| BC1 | RU1 부문 + MVP + wins 리더 | (없음) | Phase 2 BG4 + Phase 3 BT6 |
| BC2 | CU1/CU2 카테고리 chip + 대회 알기자 link | (없음) | Phase 1A PA9 prospectus |
| BC3 | CU3 마법사 (단독) | (없음) | (단독) |
| BC4 | CU2 좋아요 + 댓글 | (없음) | (단독) |
| BC5 | CU4 수정 (단독) | (없음) | (단독) |
| BC7 | RU1 cross-domain | (없음) | Phase 2/3 stats |

---

## 5. 13 룰 + Phase 1~4 carry-over

- ❌ AppNav 변경 ❌
- ❌ 새 라우트 ❌
- ✅ Phase 1A/1B/2/3/4 시안 carry-over (변경 ❌)
- ✅ CU3 마법사 = Phase 1B UA3 + Phase 4 OU3 답습 패턴
- ✅ BC1 cross-domain 데이터 = Phase 2 `games.final_mvp_user_id` + Phase 3 `Team.wins/losses/draws` 동일 source

---

## 6. 자체 검수 — Phase 4 답습 + Phase 5 특수

기본 12 케이스 + Phase 5 특수 4:
- ✅ RU1 부문 chip row sticky (모바일 horizontal scroll)
- ✅ BC1 MVP / wins 데이터 = Phase 2/3 동일 컬럼 출처
- ✅ CU3 5-step = Phase 1B UA3 / Phase 4 OU3 답습 (사후 안내 hero + CTA)
- ✅ CU4 = CU3 컴포넌트 재사용 (별 컴포넌트 ❌)

---

## 7. 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — 랭킹·커뮤니티 사용자 측 + cross-domain (Phase 5B)

이해: RU1 보강 (BC1+BC7 cross-domain) + CU1/CU2 보강 + CU3 신규 5-step 마법사 + CU4 수정 (CU3 답습).
양측 의존 = BC1 (MVP/wins) + BC2 (대회 알기자) + BC3 (마법사 답습) + BC7 (랭킹 cross-domain).
사용자 결정 §1~§8 보존 / AppNav frozen 03 카피 / 13 룰 / Phase 1~4 carry-over (변경 ❌).
자체 검수: 06 §사용자 hub / 위계 / 모달
작업 시작.
```

---

**의뢰서 끝.**
