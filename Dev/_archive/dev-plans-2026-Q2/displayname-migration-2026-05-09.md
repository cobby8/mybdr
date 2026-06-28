# displayName 마이그 우선순위 점검 — 2026-05-09

> 5/9 동호회최강전 D-day 검증 후속. RPC + roster 라우트 즉시 fix 완료. **30+ 파일이 직접 `u.nickname` 참조 중** — 공식 기록 노출 페이지 = `getDisplayName()` 헬퍼로 마이그 필요.

## 정책 (conventions.md `[2026-05-09]`)
- **공식 기록** = 실명 우선 (`getDisplayName()` 헬퍼 의무 / nickname 직접 참조 금지)
- **사적/커뮤니티** = nickname OK
- **헬퍼**: `src/lib/utils/player-display-name.ts` → `getDisplayName(user, ttp?, fallback?)` (name → nickname → ttp.player_name → '#'+jersey → fallback)

---

## 분류 표 (30 + 추가 발견 1 = 31 파일)

| # | 파일 | 컨텍스트 | nickname 사용 위치 | 그룹 |
|---|------|---------|------------------|------|
| 1 | src/app/(web)/games/[id]/page.tsx | **공식 기록** (게임 디테일 + MVP 시상 + 출석/참가자 명단) | L120/145/159/207/226/310 (MVP `nickname \|\| name`) / L445/463 (참여자 카드) / L591 | **P0** |
| 2 | src/app/api/web/tournaments/[id]/public-bracket/route.ts | **공식 기록** (대회 대진표 공개 — 매치 선수 명단) | L226/255 (`name ?? nickname ?? player_name ?? #jersey` 이미 fallback 패턴 있음) | **P0** |
| 3 | src/app/api/web/tournaments/[id]/matches/[matchId]/jersey-override/route.ts | **공식 기록** (매치 등번호 오버라이드 — 선수 식별) | L102/174/271/286 | **P0** |
| 4 | src/app/api/web/tournaments/[id]/public-teams/route.ts ⭐ **신규 발견** | **공식 기록** (대회 팀별 선수 명단) | L49/84 (`p.users?.nickname ?? "선수"`) | **P0** |
| 5 | src/lib/services/home.ts | **혼합** — organizer (게임 주최자 = nickname OK) / mvp_player (MVP 시상 = 공식) | L153/213/584/634/876 (mvp), L199/213/564/623 (organizer) | **P0** (mvp만) |
| 6 | src/lib/news/build-linkify-entries.ts | **공식 기록 보조** (뉴스 기사 선수명 자동 링크) | L26/39/53/61/81 (`p.users?.name \|\| p.player_name \|\| p.users?.nickname`) | **P0** |
| 7 | src/app/(web)/awards/page.tsx | **공식 기록** (시상 페이지) | L271/278/294/320/327/343/369/376/392/436/454/516/540 — **이미 `getDisplayName()` 적용됨** ✅ | **P3 (완료)** |
| 8 | src/lib/tournaments/link-player-user.ts | **시스템 내부** (선수↔유저 자동 매칭 — UI 미노출) | L6/38/63/114 (이름 매칭 알고리즘) | **P2 (보류)** |
| 9 | src/app/(web)/users/[id]/page.tsx | **공개 프로필** (다른 사용자 본 페이지) | L96/293 (헤더 표시명) | **P1** |
| 10 | src/app/(web)/profile/page.tsx | **본인 프로필** (마이페이지) | L77/100 (작성자 표시) | **P2 (사적)** |
| 11 | src/app/(web)/profile/edit/page.tsx | **본인 프로필 편집** (닉네임 직접 입력 폼) | L95/180/197/266/431/443 등 — 닉네임 자체 편집 폼이므로 **개념적으로 nickname 그대로** | **P2 (보류)** |
| 12 | src/app/(web)/profile/_v2/hero-card.tsx | **본인 프로필 hero** (마이페이지 v2) | L43/89-90 (`displayName = nickname ?? name ?? "사용자"`) | **P2 (사적, but 우선순위 역전)** ⚠ |
| 13 | src/app/(web)/community/[id]/page.tsx | **커뮤니티** (게시글 작성자 / 댓글) | L36/46/122/177/297/496/510 | **P2 (사적)** |
| 14 | src/app/api/web/community/route.ts | **커뮤니티** (게시글 목록 작성자) | L91/96/133 (카페 글쓴이 fallback) | **P2 (사적)** |
| 15 | src/app/(web)/courts/[id]/page.tsx | **코트 상세** (예약자/리뷰 — 공개) | L53/293 (`c.users?.nickname ?? "사용자"`) | **P1** |
| 16 | src/app/(web)/courts/[id]/manage/_manage-client.tsx | **운영자 페이지** (예약 회원 표시) | L82/487 (`booking.user.nickname ?? booking.user.name ?? "회원"`) | **P1** |
| 17 | src/app/(web)/layout.tsx | **헤더 본인 표시** (글로벌 nav) | L75/83 (auth.user.nickname → name fallback) | **P2 (사적)** |
| 18 | src/lib/auth/oauth.ts | **시스템 내부** (OAuth 가입 시 닉네임 자동 생성) | L19/32/65/76/95-97 | **P2 (보류)** |
| 19 | src/app/api/web/teams/[id]/members/route.ts | **팀 운영** (팀 멤버 명단 — 사적 팀 IA) | L55/67/83/93/104 (`m.user?.nickname ?? m.user?.name ?? "-"`) | **P1** |
| 20 | src/app/api/web/teams/[id]/requests/route.ts | **팀 운영** (가입 신청 알림 — 신청자 표시) | L169/171/279-309 | **P1** |
| 21 | src/app/api/web/teams/[id]/transfer-requests/route.ts | **팀 운영** (이적 신청) | L65/101 | **P1** |
| 22 | src/app/api/web/teams/[id]/officer-permissions/route.ts | **팀 운영** (운영진 권한) | L94/107 | **P1** |
| 23 | src/app/api/web/teams/[id]/ghost-candidates/route.ts | **팀 운영** (ghost 매칭) | L71/91 | **P1** |
| 24 | src/app/(admin)/admin/users/admin-users-table.tsx | **관리자** (전체 사용자 목록) | L17/163/170/400/404/865/905/917 (닉네임 정렬+편집) | **P2 (admin)** |
| 25 | src/app/(admin)/admin/tournaments/page.tsx | **관리자** (대회 organizer 표시) | L46/63 (`organizerName: nickname`) | **P2 (admin)** |
| 26 | src/app/(admin)/admin/page.tsx | **관리자** (admin_logs by 표시) | L50/153 (`log.users.nickname ?? email`) | **P2 (admin)** |
| 27 | src/app/(admin)/admin/logs/page.tsx | **관리자** (admin_logs by 표시) | L77/132/215 | **P2 (admin)** |
| 28 | src/app/(admin)/admin/game-reports/page.tsx | **관리자** (game_reports — 신고자/평가대상) | L38/51/166/194 | **P2 (admin, but 평가대상은 P0 검토)** ⚠ |
| 29 | src/app/(admin)/tournament-admin/tournaments/[id]/admins/page.tsx | **대회 운영자** (admin 추가/제거 UI) | L16/64/137/140/149 | **P2 (admin)** |

> 정확한 line은 조사 시점 기준. 마이그 시 grep 재확인.

---

## 우선순위 그룹 요약

| 그룹 | 파일 수 | 정책 매칭 | 마이그 | 추정 시간 |
|------|--------|---------|--------|---------|
| **P0** (즉시 — 공식 기록 사용자 가시성) | **6** | 실명 우선 의무 | 즉시 진행 권장 | **2.5 ~ 3시간** |
| **P1** (후속 — 팀/공개 프로필 / 코트) | **9** | 실명 권장 (mixed) | 사용자 결정 후 | **3 ~ 4시간** |
| **P2** (보류 — 사적/admin/시스템) | **15** | nickname 정책 유지 | 변경 보류 | **0** (정책상 불필요) |
| **P3** (이미 마이그됨 — awards) | **1** | — | 완료 | — |

### P0 (6) 즉시 마이그 대상 — 핵심
1. `(web)/games/[id]/page.tsx` — MVP 시상 + 참여자 명단
2. `api/web/tournaments/[id]/public-bracket/route.ts` — 대진표 선수
3. `api/web/tournaments/[id]/matches/[matchId]/jersey-override/route.ts` — 매치 등번호
4. `api/web/tournaments/[id]/public-teams/route.ts` ⭐ — 대회 팀별 선수 명단
5. `lib/services/home.ts` — **mvp_player 부분만** (organizer/applicant_name 은 P2 nickname 유지)
6. `lib/news/build-linkify-entries.ts` — 뉴스 기사 선수명 자동 링크

### P1 (9) 후속 검토 대상
- 팀 운영 5건 (members / requests / transfer-requests / officer-permissions / ghost-candidates)
- 공개 페이지 3건 (users/[id] / courts/[id] / courts/[id]/manage)
- **사용자 결정 필요**: "팀 운영 IA = 사적이라 nickname OK?" / "공개 프로필 = 실명?"

### P2 (15) 정책상 보류 (nickname 유지)
- 본인 프로필 (profile / profile/edit / profile/_v2/hero-card / layout 헤더)
- 커뮤니티 (community/[id] / api/web/community)
- admin 6건 (관리자 페이지 — 본인은 nickname 정렬·검색 익숙)
- 시스템 내부 2건 (lib/auth/oauth / lib/tournaments/link-player-user — UI 미노출 매칭 알고리즘)

---

## 변경 패턴 예시

### Before (P0 케이스 1: games/[id]/page.tsx L310 MVP)
```tsx
MVP · {finalMvp.nickname || finalMvp.name || "익명"}
```

### After
```tsx
MVP · {getDisplayName(finalMvp, undefined, "익명")}
// 우선: name → nickname → "익명" (정책 = 실명 우선)
```

### Before (P0 케이스 2: api/web/tournaments/[id]/public-teams/route.ts L84)
```ts
nickname: p.users?.nickname ?? "선수",
```

### After
```ts
// import { getDisplayName } from "@/lib/utils/player-display-name";
displayName: getDisplayName(p.users, p, "선수"),
// 응답 키 변경 시 프론트 수정 필요 (또는 키 유지하고 값만 변경)
```

> 응답 키 마이그 주의: 프론트가 `nickname` 접근하면 **값만 displayName 으로 채우고 키는 유지** 권장 (브레이킹 0). 또는 양쪽 동시 추가 후 점진 deprecate.

---

## 회귀 위험 평가

| 항목 | 위험도 | 사유 |
|------|------|------|
| DB 영향 | **0** | 헬퍼 read-only |
| 응답 키 변경 | **중** | API 응답 키 `nickname` → `displayName` 시 프론트 동시 수정 필수 (점진 마이그 권장) |
| 영문 닉네임 본인 hero | **저** | profile/_v2/hero-card 는 P2 보류 — 본인 페이지는 nickname 의도 유지 |
| Flutter v1 | **0** | `/api/v1/...` 라우트는 본 30 파일 외 (이미 별도 마이그 완료) |
| 캐시 무효화 | **저** | unstable_cache 키 변경 0, 값만 변경 → 60초 revalidate 후 자동 갱신 |

---

## 추정 시간 분배 제안

| 작업 | 분배 | 추정 |
|------|-----|------|
| **P0 일괄** (developer) | 1 PR / 6 파일 | 2.5 ~ 3시간 |
| P0 검증 (tester + reviewer 병렬) | — | 1시간 |
| P1 — 사용자 결정 후 진행 | 1~2 PR / 9 파일 | 3 ~ 4시간 |
| P2 — 정책상 보류 | — | 0 |
| **총 P0 작업량** | — | **3.5 ~ 4시간** |
| **총 P0+P1** | — | **6.5 ~ 8시간** |

---

## 권장 진행 순서

1. **사용자 결정 대기** — D-day 후속 큐 등록만 + 본 보고서 리뷰
2. **P0 일괄 PR** — developer 1회 (6 파일 / 변경 패턴 1종) + tester+reviewer 병렬
3. **P1 결정 후 별도 PR** — 팀 운영 IA = 사적 vs 공개 결정
4. **P2 영구 보류** — conventions.md 이미 박제 ([2026-05-09])

---

## 참조

- 헬퍼: `src/lib/utils/player-display-name.ts`
- 정책: `.claude/knowledge/conventions.md [2026-05-09]`
- 관련 박제: `[2026-05-01]` 선수명단 실명 표시 규칙
- D-day 발견: 5/9 RPC `get_tournament_players` display_name 영문 nickname 11건 즉시 fix
