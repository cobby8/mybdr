# 유령 기능 + UI 깨짐 전수조사 — 2026-04-29

> **상태**: active
> **갱신 주기**: 1회성 (Phase 9 후속)
> **상위 문서**: [README.md](./README.md)
> **함께 보는 문서**: [ui-consistency-audit-2026-04-29.md](./ui-consistency-audit-2026-04-29.md) (시안 vs 실제) · [phase-9-audit.md](./phase-9-audit.md) §2-C "박제 회귀 점검" · [phase-9-future-features.md](./phase-9-future-features.md) (시안-only 기능 정리)
> **작성 사유**: 사용자 요청 — "기존 기능과 새 디자인 시스템의 불일치로 유령이 된 기능 + UI 깨짐 페이지 전수조사"
> **검사 기준일**: 2026-04-29 (브랜치 design_v2)

---

## 0. 정의 — 무엇을 "유령" 으로 부르는가

**유령 기능 (Ghost Feature)** = 다음 중 하나 이상에 해당:

1. **A형 — 박제 회귀**: v1 페이지에 있던 기능/탭/CTA가 v2 박제로 사라졌고, **DB/API는 살아있음** (사용자 인터페이스만 끊김)
2. **B형 — 디자인 혼합**: 한 페이지/플로우 안에서 v1 컴포넌트와 v2 컴포넌트가 섞여 시각적 불일치
3. **C형 — 좀비 코드**: v2 도입 후 v1 컴포넌트가 import 0건이지만 파일은 잔존 (롤백용 명시 + 일부는 의도치 않게 사용 중)
4. **D형 — placeholder 화석**: 버튼/입력은 보이지만 `alert("준비 중")` 또는 `disabled` — 실제로는 백엔드 API 가 존재해서 연결만 하면 동작하는 케이스
5. **E형 — 잘못된 라우팅**: 버튼이 alert 처리되어 있지만 같은 기능의 v2 라우트가 이미 존재 (단순 연결 누락)

**UI 깨짐 (Breakage)** = 다음 중 하나:

1. 모바일/데스크톱 레이아웃 충돌 (이미 commit `4afb4f9` 픽스)
2. v2 컴포넌트가 v1 API 응답 형태를 가정해서 TypeError 위험
3. fixed/sticky/z-index 충돌 가능성
4. overflow 미제어로 콘텐츠 잘림

---

## 1. TL;DR — 한눈에 (총 33건 후보)

| 유형 | 건수 | 우선도 | 사용자 임팩트 |
|------|------|-------|-------------|
| 🔴 A형 — 박제 회귀 | 6건 | **P0** | 옛 사용자 동선 끊김 |
| 🟠 B형 — 디자인 혼합 | 2건 | P1 | 시각적 일관성 저해 |
| 🟡 C형 — 좀비 코드 | 7건 | P2 | 코드 위생, 사용자 영향 0 |
| 🟢 D형 — placeholder 화석 | 13건+ | P1 (E형 우선) | "준비 중" 다발로 신뢰 저하 |
| 🔵 E형 — 잘못된 라우팅 (D형 중) | 3건 | **P0** | 라우트 존재하는데 alert |
| ⚠️ UI 깨짐 위험 | 3건 | P1 | 회귀 발생 시 즉시 영향 |

> **핵심**: P0 9건(A형 6 + E형 3)이 **사용자 체감 직격탄**이라 우선 처리 필요.

---

## 2. 🔴 A형 — 박제 회귀 (6건, P0)

> 출처: [phase-9-audit.md](./phase-9-audit.md) §2-C 매트릭스 + scratchpad "추후 구현" + 자체 grep 검증.

### A-1. `/teams` 지역/정렬 필터 (FloatingFilterPanel) ⚠️ 진정한 ghost

| 항목 | 내용 |
|------|------|
| 사라진 기능 | 지역(시·도) 필터 + 정렬(최신/인기) 패널 |
| 옛 위치 | `/teams` 페이지 상단 검색바 옆 floating panel |
| 박제 시점 | 2026-04-29 (오늘) — `/teams 검색바 중복 + 필터 패널 깨짐 픽스` 작업 |
| 현재 상태 | `_components/teams-content.tsx` (v1) `TeamsFilterComponent` 인자 받음. v2 페이지(`teams-content-v2.tsx`)는 prop 자체 제거 |
| 근거 라인 | `src/app/(web)/teams/page.tsx:4` — `// 옛 TeamsFilter ... 추후 v2 디자인으로 재구현 예정` |
| 근거 라인 | `src/app/(web)/teams/_components/teams-content-v2.tsx:14, 140` — `옛 TeamsFilter prop 제거 (검색 중복/필터 패널 깨짐 픽스)` |
| 근거 라인 | `.claude/scratchpad.md:27` — `/teams 필터 기능 — v2 디자인으로 재구현 필요 (지역/정렬, 옛 FloatingFilterPanel 제거됨)` |
| DB 지원 | ✅ `Team.cityCode`, `Team.region` 그대로 존재. API 만 만들면 즉시 동작 |
| 권장 액션 | v2 디자인의 chip-bar 또는 select-pair 로 재구현. URL 동기화. |

### A-2. `/profile` 슛존 / 스카우팅 / 시즌 히스토리 / VS 나 탭

| 항목 | 내용 |
|------|------|
| 사라진 기능 | 4개 탭 (슛존 성공률 heatmap, 스카우팅 리포트, 시즌별 기록, 다른 유저 vs 나 비교) |
| 박제 시점 | 커밋 `28be75f` Phase 1 Profile |
| 근거 | [phase-9-audit.md:175](./phase-9-audit.md#L175) — `슛존/스카우팅/시즌히스토리/VS 나 탭 누락 (scratchpad 명시)` |
| 근거 | `.claude/scratchpad.md:23` — `슛존 성공률 (heatmap)`, `스카우팅 리포트` 미해결 ⏳ |
| DB 지원 | ⚠️ 일부 미구현. heatmap/스카우팅은 추가 집계 테이블 필요 |
| 권장 액션 | 시즌 히스토리만 우선 복원 (DB 존재). 슛존/스카우팅/VS 는 phase-9-future-features.md 큐로 |

### A-3. `/teams/[id]` 부팀장/매니저 manage 진입점

| 항목 | 내용 |
|------|------|
| 사라진 기능 | 부팀장·매니저가 `/teams/[id]/manage` 진입할 수 있는 동선 |
| 박제 시점 | Phase 3 Teams 박제 |
| 근거 | [phase-9-audit.md:176](./phase-9-audit.md#L176) — `부팀장 진입 가능 여부 (manage 진입점)` |
| 근거 | hero v2 의 `isCaptain` 조건부 버튼 1곳만 — 부팀장/매니저 진입 불가 |
| DB 지원 | ✅ `team_members.role` (captain/coach/manager) 그대로 |
| 권장 액션 | hero v2 의 권한 체크를 `isCaptain || isCoach || isManager` 로 확장 |

### A-4. `/community/[id]` 옛 댓글 액션 / 북마크 진입점

| 항목 | 내용 |
|------|------|
| 사라진 기능 | 댓글 답글/수정/삭제, 게시글 북마크 액션 |
| 박제 시점 | Phase 8 PostDetail |
| 근거 | [phase-9-audit.md:177](./phase-9-audit.md#L177) — `옛 댓글 액션/북마크 등 진입점 보존 여부` |
| 근거 라인 | v2 사용 컴포넌트: `like-button-v2.tsx`, `share-button-v2.tsx` (page.tsx:11-12). v1 `like-button.tsx`/`share-button.tsx` 잔존 |
| DB 지원 | ✅ comment 테이블 + bookmark 테이블 존재 |
| 권장 액션 | 댓글 액션 메뉴 (점 3개 dropdown) v2 디자인 복원. 북마크는 별도 v2 컴포넌트 신설 |

### A-5. `/notifications` actionUrl 복귀 동작

| 항목 | 내용 |
|------|------|
| 사라진 기능 | 알림 클릭 시 actionUrl 따라가기 |
| 박제 시점 | Phase 8 Notifications |
| 근거 | [phase-9-audit.md:178](./phase-9-audit.md#L178) — `알림별 actionUrl 복귀 동작 보존` |
| DB 지원 | ✅ `notifications.action_url` 컬럼 존재 |
| 권장 액션 | NotificationItem v2 컴포넌트 클릭 핸들러에 router.push(actionUrl) 추가 |

### A-6. `/live/[id]` finished 분기 (P0-5 로 별도 작업)

| 항목 | 내용 |
|------|------|
| 사라진 기능 | 경기 종료 후 결과 화면의 옛 레이아웃·기능 |
| 박제 시점 | 커밋 `5920ff7` Phase 2 GameResult |
| 근거 | [phase-9-audit.md:174](./phase-9-audit.md#L174), [phase-9-prompts.md](./phase-9-prompts.md) P0-5 |
| 권장 액션 | **별도 작업 P0-5** — 시안 색/폰트 유지 + 옛 레이아웃·기능 복원 |

---

## 3. 🟠 B형 — 디자인 혼합 (2건, P1)

### B-1. `tournament-tabs.tsx` — 옛 `TeamCard` 사용 (v2 와 시각 불일치)

| 항목 | 내용 |
|------|------|
| 파일 | `src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx` |
| 라인 | 29: `import { TeamCard } from "../../../teams/_components/team-card";` |
| 라인 | 28: `// 팀 카드 (팀 목록 페이지와 UI 통일)` ← **이 코멘트는 outdated** |
| 문제 | `/teams` 페이지는 `TeamCardV2` 사용 → 토너먼트 참가팀 탭과 팀 목록 페이지의 카드 디자인 다름 |
| 추가 위험 | 라인 267~286 에서 v2 API 응답(snake_case) 을 v1 컴포넌트(camelCase) 로 수동 변환. 변환 누락 시 TypeError |
| 권장 액션 | `TeamCard` → `TeamCardV2` 로 교체. 변환 로직 제거. 코멘트 갱신 |

### B-2. `tournaments-filter.tsx` (FloatingFilterPanel) — `/games`, `/teams` 와 정책 불일치

| 항목 | 내용 |
|------|------|
| 파일 | `src/app/(web)/tournaments/tournaments-filter.tsx` |
| 라인 | 88+ : `export function TournamentsFilter` (사용 중) |
| 사용처 | `tournaments/page.tsx:3,77` (실제 사용) |
| 문제 | `/teams` 와 `/games` 는 v2 박제 시 `FloatingFilterPanel` 제거. `/tournaments` 만 잔존 → 3개 목록 페이지의 필터 UI 가 통일 안됨 |
| 권장 액션 | (a) `/tournaments` 도 v2 chip-bar 로 통일 또는 (b) `/teams`, `/games` 에 동일한 floating panel 복원. 한 방향으로 결정 필요 |

---

## 4. 🟡 C형 — 좀비 코드 (7건, P2)

> 사용자 영향 없음. 코드 위생/혼동 방지를 위한 정리. **삭제 전에 import 0건 재확인 필수**.

| # | 파일 | 사용 상태 | 권장 |
|---|------|---------|-----|
| 1 | `src/app/(web)/teams/teams-filter.tsx` | import 0건 | 삭제 또는 `__deprecated/` 이동 |
| 2 | `src/app/(web)/games/games-filter.tsx` | import 0건 (코멘트 "v2 미사용 보존") | 삭제 후보 |
| 3 | `src/app/(web)/teams/_components/teams-content.tsx` | import 0건 | 삭제 후보 |
| 4 | `src/app/(web)/teams/_components/team-card.tsx` | ⚠️ `tournament-tabs.tsx:29` 가 사용 중 — B-1 처리 후 삭제 가능 |
| 5 | `src/app/(web)/courts/_components/courts-content.tsx` | import 0건 (admin 은 별도) | 삭제 후보 |
| 6 | `src/app/(web)/community/[id]/_components/like-button.tsx` | import 0건 (V2 만 사용) | 삭제 후보 |
| 7 | `src/app/(web)/community/[id]/_components/share-button.tsx` | import 0건 (V2 만 사용) | 삭제 후보 |
| 8 | `src/app/(web)/games/_components/games-content.tsx` | import 0건 (`/games` v2 미사용) | 삭제 후보 |
| 9 | `src/components/shared/floating-filter-panel.tsx` | ⚠️ `tournaments-filter.tsx`, `games-filter.tsx`, `teams-filter.tsx` 가 사용. B-2 + 위 1·2 처리 후 평가 |

> ⚠️ 삭제 전에 build/test 통과 확인. `git rm` 대신 `__archive/` 이동도 옵션.

---

## 5. 🟢 D형 — placeholder 화석 (13개 영역)

> "alert(준비 중)" 또는 `disabled` 버튼 다발. **각 항목별로 백엔드 존재 여부에 따라 분류**.

### D-1. ⚡ E형 (라우트 존재 — 즉시 연결 가능, P0) — 3건

| # | 위치 | 현재 동작 | 연결 대상 (이미 존재) |
|---|------|---------|---------------------|
| E-1 | `src/app/(web)/games/my-games/_components/reg-row.tsx:249-254` "후기 작성" | `alert("준비 중인 기능입니다")` | `/games/[id]/report` 라우트 존재 (A등급 박제) |
| E-2 | `src/app/(web)/users/[id]/_components/action-buttons.tsx:35` "메시지 보내기" | alert | `/messages` 라우트 존재 |
| E-3 | `src/app/(web)/games/my-games/_components/reg-row.tsx:218-228` "결제하기" | 정상 (이미 `/pricing/checkout` 연결) | 참고 — 같은 파일 안에 alert 6건 vs 연결 1건 혼재 |

### D-2. DB/API 추가 필요 (placeholder 정당)

| 영역 | 파일 | 현황 코멘트 |
|------|------|-----------|
| 스크림 (`/scrim`) | `src/app/(web)/scrim/page.tsx:14-16, 141-187` | `UI 미리보기 전용`. scrim_open_requests 테이블 미구현 |
| 로그인 (`/login`) | `src/app/(web)/login/page.tsx:172, 251, 297` | `Phase 6 Login (token 시스템 / 네이버 OAuth / 인라인 회원가입)` |
| 글쓰기 에디터 (`/community/new`) | `src/app/(web)/community/new/page.tsx:177-202` | 13개 toolbar 버튼 disabled — Tiptap/Slate 같은 에디터 라이브러리 도입 필요 |
| 검색 필터 (`/search`) | `src/app/(web)/search/_components/search-client.tsx:617` | skill level 필터 — DB 미지원 disabled |
| 보관함 (`/saved`) | `src/app/(web)/saved/_v2/saved-content.tsx:21` | 내보내기/폴더관리 disabled |
| 토너먼트 (`/tournaments/[id]`) | `tournament-tabs.tsx:140`, `v2-bracket-header.tsx:54`, `v2-bracket-prediction.tsx:12`, `enroll-step-docs.tsx:9` | 캘린더 등록 / 저장·공유·출력 / 투표 / 문서 업로드 4행 |
| 코치 (`/coaches`) | `src/app/(web)/coaches/page.tsx:294` | 셀렉트 3종 동작 미구현 |
| 게시글 댓글 (`/community/[id]`) | `src/app/(web)/community/[id]/comment-form.tsx:56` | 이미지/이모지 아이콘 |
| 게시글 임시저장 (`/community/new`) | `community/new/page.tsx:96` | 자동저장 표시만 |
| 프로필 편집 사진/공개범위 | `profile/edit/page.tsx:865, 906` | photo / privacy 탭 자리만 |
| 프로필 설정 다수 | `profile/settings/_components_v2/*` | 2단계 인증, 로그인 기기, 결제수단, 영수증, 데이터 내보내기, 비활성화 |
| 게임 신청 패널 | `games/[id]/_v2/apply-panel.tsx:60-62, 208-209` | 한마디/저장 — bookmarks 테이블 미구현 |
| QR 티켓 / 영수증 | `games/my-games/_components/reg-row.tsx:201-252` | 백엔드 발급 시스템 필요 |

> 정당한 placeholder 는 phase-9-future-features.md 의 "추후 구현 큐" 와 일치하는지만 검증.

---

## 6. ⚠️ UI 깨짐 위험 (3건, P1)

### W-1. `/community/new` toolbar overflow

- 파일: `src/app/(web)/community/new/page.tsx:170-203`
- 패턴: `overflowX: auto` + `flexWrap: "nowrap"` + 13개 disabled 버튼
- 위험: 모바일에서 한 줄로 강제 → 가로 스크롤 + 버튼 잘림 (특히 iPhone SE 320px)
- 권장: `flex-wrap` 허용 또는 dropdown 으로 묶기

### W-2. `floating-filter-panel.tsx` z-index 충돌

- 파일: `src/components/shared/floating-filter-panel.tsx:104, 118`
- 패턴: backdrop `z-50` + panel `z-50` 두 겹
- 위험: 다른 modal/drawer (예: `slide-menu.tsx` `z-50`) 와 동시 표시 시 stacking 비결정적
- 권장: backdrop `z-40` + panel `z-50` 분리

### W-3. `tournament-tabs.tsx` v2→v1 변환 TypeError

- 파일: `src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx:267-286`
- 패턴: API 응답(snake_case `team_name_en`)을 v1 컴포넌트 prop(camelCase `teamNameEn`)으로 수동 변환
- 위험: API 필드 추가/변경 시 변환 누락 → undefined 접근 → 런타임 에러
- 권장: B-1 (TeamCardV2 교체) 와 함께 수정 → 변환 로직 통째 삭제

---

## 7. 페이지별 종합 영향도 (사용자 임팩트 기준)

| 페이지 | 영향 항목 | 종합 등급 |
|--------|----------|---------|
| `/teams` | A-1 지역/정렬 필터 사라짐 | 🔴 즉시 |
| `/profile` | A-2 4개 탭 누락 | 🔴 즉시 |
| `/teams/[id]` | A-3 부팀장/매니저 진입 불가 | 🔴 즉시 |
| `/community/[id]` | A-4 댓글 액션/북마크 + 북마크 lvl 배지 | 🔴 즉시 |
| `/notifications` | A-5 actionUrl 복귀 안 됨 | 🔴 즉시 |
| `/live/[id]` | A-6 finished 분기 회귀 (별도 작업) | 🔴 P0-5 |
| `/games/my-games` | E-1 후기작성 alert + 6 placeholder | 🟢 즉시 (E-1 연결) |
| `/users/[id]` | E-2 메시지 alert | 🟢 즉시 (E-2 연결) |
| `/tournaments/[id]/teams 탭` | B-1 카드 디자인 불일치 + 변환 위험 | 🟠 1주 |
| `/tournaments` | B-2 필터 정책 불일치 | 🟠 1주 |
| `/community/new` | W-1 toolbar overflow + 13 placeholder | 🟠 1주 |
| `/scrim` | D placeholder 다발 | ⚪ 백로그 (DB 필요) |
| `/login` | D placeholder 3건 | ⚪ 백로그 (Phase 6) |

---

## 8. 우선순위 + CLI 프롬프트 (클로드 CLI 에 그대로 붙여넣기)

> 각 프롬프트는 독립 실행 가능. 의존성은 `→` 로 표기.

### 🔴 P0-A: A형 박제 회귀 5건 일괄 점검 (4-6h)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: 박제 회귀 5건 (A-1~A-5) 진단 + 픽스. A-6 은 별도 작업(P0-5).
근거: Dev/design/ghost-features-and-breakage-2026-04-29.md §2

각 항목 진단 → 픽스 → 검증 → 커밋:

[A-1] /teams 지역/정렬 필터 v2 재구현 (1.5h)
- 현황: src/app/(web)/teams/page.tsx 의 v2 페이지에 필터 칩 0개
- 옛 모델: src/app/(web)/teams/teams-filter.tsx 의 city + 정렬(최신/인기) 2 차원
- 작업:
  1. teams-content-v2.tsx 헤더 영역에 v2 chip-bar 신설 (FilterChipBar 컴포넌트 신규 또는 games-client 의 FilterChipBar 차용)
  2. URL 동기화 (?city=&sort=)
  3. teams-content-v2 의 데이터 fetch 함수에 cityCode 필터 추가
- 검증: Chrome 모바일/PC 에서 city 필터 동작 + URL 반영
- 커밋: feat(teams): v2 지역·정렬 필터 복원 (A-1 ghost 처리)

[A-2] /profile 시즌 히스토리 탭 복원 (1h, 슛존/스카우팅/VS는 phase-9-future-features 큐로)
- 현황: src/app/(web)/profile/_v2/* 에 시즌 탭 없음
- DB 확인: prisma 의 user_season_stats 또는 동등 테이블 존재 여부 확인
  - 없으면 phase-9-future-features.md 큐 추가하고 종료
  - 있으면: profile-content 에 시즌 탭 추가 (table 또는 카드 리스트)
- 검증: 로그인 후 본인 프로필 → 시즌 탭 클릭 → 데이터 표시
- 커밋: feat(profile): v2 시즌 히스토리 탭 복원 (A-2 ghost 부분 처리)

[A-3] /teams/[id] 부팀장·매니저 manage 진입점 (45m)
- 현황: src/app/(web)/teams/[id]/_components_v2/team-hero-v2.tsx 의 manage 버튼이 isCaptain 조건만
- 작업:
  1. 권한 체크를 isCaptain || isCoach || isManager 로 확장
  2. team_members.role 조회 (이미 page.tsx 에 있는지 확인 → 없으면 prefetch 추가)
- 검증: 부팀장 계정으로 팀 페이지 → manage 버튼 노출 확인
- 커밋: fix(teams): 부팀장/매니저 manage 진입점 복원 (A-3 ghost 처리)

[A-4] /community/[id] 댓글 액션 메뉴 + 북마크 (1h)
- 현황: comment-list 컴포넌트의 답글/수정/삭제 동선 검수 필요
- 작업:
  1. CommentList v2 에 점-3개 dropdown (답글/수정/삭제) 복원
  2. PostDetailSidebar 또는 헤더에 북마크 버튼 신규 (DB bookmark 테이블 사용)
- 검증: 본인 댓글 수정/삭제 동작 + 북마크 토글
- 커밋: feat(community): 댓글 액션 + 북마크 v2 복원 (A-4 ghost 처리)

[A-5] /notifications actionUrl 복귀 (30m)
- 현황: notifications-client.tsx 의 알림 클릭 핸들러에서 router.push(actionUrl) 누락
- 작업:
  1. NotificationItem v2 onClick → notification.action_url 있으면 router.push
  2. action_url 없으면 현재 동작(읽음 처리만) 유지
- 검증: 더미 알림 만들기 + 클릭 → 해당 라우트 도착
- 커밋: fix(notifications): actionUrl 복귀 동작 복원 (A-5 ghost 처리)

총 5 커밋. subin 브랜치 → dev PR.
```

### 🔵 P0-B: E형 라우팅 누락 3건 (15분)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: 이미 라우트는 존재하는데 alert("준비 중") 으로 막혀있는 버튼 3건 연결.
근거: Dev/design/ghost-features-and-breakage-2026-04-29.md §5 D-1

[E-1] /games/my-games "후기 작성" → /games/[id]/report
- 파일: src/app/(web)/games/my-games/_components/reg-row.tsx:249-254
- 현재: <button onClick={() => alert("준비 중인 기능입니다")}>후기 작성</button>
- 변경: <Link href={`/games/${r.gameId}/report`} className="btn btn--sm">후기 작성</Link>
- 단, r.gameId 가 props 에 있는지 확인. 없으면 r.id 또는 r.href 의 game id 추출.

[E-2] /users/[id] "메시지 보내기" → /messages?to=userId
- 파일: src/app/(web)/users/[id]/_components/action-buttons.tsx:35
- 현재: onClick={() => alert("준비 중인 기능입니다")}
- 변경: <Link href={`/messages?to=${targetUserId}`}> 또는 onClick={() => router.push(`/messages?to=${targetUserId}`)}
- 단, /messages 페이지가 ?to= 쿼리를 받아서 새 대화 시작 UI 띄우는지 확인 필요. 미지원이면 phase-9-future-features 큐로 (10m 작업으로 종결)

[E-3] (검증만) /games/my-games "결제하기" 는 정상 — 그대로 두기. 다만 같은 파일 안에 alert 6건 + Link 1건 혼재 → 코멘트 1줄 추가:
"// E형 검증 완료 (2026-04-29): 결제하기 만 라우트 존재. 나머지 6건은 D형 (DB/API 미구현)"

검증: tsc + 모바일 클릭 동작 확인.
커밋: fix(routing): E형 라우팅 누락 2건 연결 (후기/메시지)
```

### 🟠 P1-A: B형 디자인 혼합 픽스 (1.5h)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: B형 디자인 혼합 2건 (B-1 토너먼트 팀카드 / B-2 토너먼트 필터 정책) 픽스.
근거: Dev/design/ghost-features-and-breakage-2026-04-29.md §3

[B-1] tournament-tabs.tsx 의 옛 TeamCard → TeamCardV2 (1h)
- 파일: src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx
- 라인 29: import { TeamCard } → import { TeamCardV2 } from "../../../teams/_components/team-card-v2"
- 라인 267-286 의 v2→v1 변환 로직: 통째 삭제. v2 응답 그대로 TeamCardV2 에 전달
- 라인 28 코멘트 갱신: "팀 목록 페이지(/teams)와 동일한 v2 카드 사용"
- 검증: tsc 0건. 토너먼트 페이지 → 참가팀 탭 → 팀 카드 디자인이 /teams 와 일치
- 커밋: fix(tournaments): 참가팀 탭에 TeamCardV2 적용 (B-1 디자인 통일)

[B-2] /tournaments 필터 정책 결정 (PM 답 받기)
- 옵션 A: /tournaments 도 v2 chip-bar 로 통일 → tournaments-filter.tsx 도 ghost 처리
- 옵션 B: /teams, /games 에 floating panel 복원 → 3 페이지 모두 floating panel
- 옵션 C: 그대로 두고 phase-9-future-features 큐 추가 (당장 안 만짐)
- PM 결정 후 1줄 작업 또는 대규모 작업 분기

[B-1 종료 후] tournaments-filter.tsx 가 본 페이지에서만 import 되는지 검증:
rg "tournaments-filter" src/  → 1 매칭만 (page.tsx + 자기 파일)
B-2 가 옵션 A 결정되면 tournaments-filter.tsx 도 좀비 코드로 분류.
```

### 🟡 P2-A: C형 좀비 코드 정리 (1h)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: 임포트 0건 v1 컴포넌트 8개 정리.
근거: Dev/design/ghost-features-and-breakage-2026-04-29.md §4 (B-1 처리 후 실행 권장)

전제 조건: B-1 (tournament-tabs 의 TeamCard → TeamCardV2 교체) 가 먼저 끝나야 #4 (team-card.tsx) 가 import 0건이 됨.

작업:
1. 각 파일에 대해 rg "from.*<filename>" src/ 로 import 0건 확인
2. 0건 확인된 파일은 git rm + 커밋. 1건 이상이면 skip
3. 한 커밋으로 묶지 말고 파일 단위로 분리 (revert 용이)

대상:
- src/app/(web)/teams/teams-filter.tsx
- src/app/(web)/games/games-filter.tsx
- src/app/(web)/teams/_components/teams-content.tsx
- src/app/(web)/teams/_components/team-card.tsx (B-1 후)
- src/app/(web)/courts/_components/courts-content.tsx
- src/app/(web)/community/[id]/_components/like-button.tsx
- src/app/(web)/community/[id]/_components/share-button.tsx
- src/app/(web)/games/_components/games-content.tsx

각 파일 삭제 후:
- npm run build (tsc + lint 통과 확인)
- 통과하면 별도 커밋: chore(cleanup): zombie code 제거 — <filename>

추가: B-2 가 옵션 A 결정되면 src/app/(web)/tournaments/tournaments-filter.tsx 도 같은 방식으로 정리.

floating-filter-panel.tsx 는 모든 사용처(games/tournaments/teams-filter)가 정리된 뒤에 마지막으로 정리.
```

### ⚠️ P1-B: UI 깨짐 위험 3건 (45m)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: §6 의 UI 깨짐 위험 3건 (W-1, W-2, W-3) 픽스.
근거: Dev/design/ghost-features-and-breakage-2026-04-29.md §6

[W-1] /community/new toolbar overflow (15m)
- 파일: src/app/(web)/community/new/page.tsx:170-203
- 현재: overflowX: auto + flexWrap: nowrap
- 변경 옵션:
  A. flexWrap: wrap 으로 + 모바일에선 핵심 4개 버튼만 표시 (B/I/H1/사진), 나머지는 dropdown
  B. 가로 스크롤 유지하되 좌우 그라디언트 mask 추가
- 권장: A. 모바일 버튼 잘림 방지가 우선
- 검증: iPhone SE 320px 폭에서 버튼 잘림 없음

[W-2] floating-filter-panel z-index (15m)
- 파일: src/components/shared/floating-filter-panel.tsx:104, 118
- 현재: backdrop z-50 + panel z-50 (둘 다)
- 변경: backdrop className="z-40" (또는 z-[45]) + panel className="z-50" 유지
- 검증: slide-menu (z-50) 와 동시 표시 가능한 시나리오 테스트

[W-3] tournament-tabs v2→v1 변환 로직 — B-1 처리 시 자동 해결 (별도 작업 X)

커밋 단위: W-1 / W-2 별도.
```

### 📋 P0-C: 회귀 방지 — 자동 검증 인프라 (B형 점검 룰) (1h)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: 박제 회귀를 사전 차단하는 grep 룰 추가 + 박제 회귀 점검 체크리스트 의무화.

[1] scripts/check-design-regression.sh 신설:
파일 안에 다음 패턴이 있으면 경고:

# v1+v2 혼합 import 탐지
- 한 파일에서 from ".*-v2" 와 from ".*\b(?!-v2)" (같은 디렉토리) 둘 다 import 시 경고

# alert("준비 중") 신규 추가 차단
- 신규 라인에 alert(["']준비 중) 가 있으면 PR 코멘트로 안내 ("E형 라우팅 검토 필요")

# 좀비 코드 탐지
- import 0건 .tsx 파일 자동 보고 (Knip 라이브러리 활용 가능)

[2] phase-9-audit.md §2-C "박제 회귀 점검 체크리스트" 를 PR 템플릿에 강제:
.github/PULL_REQUEST_TEMPLATE.md 신설:
- [ ] 박제 회귀 점검 — 옛 페이지 vs 새 페이지의 카드/탭/CTA 비교 완료
- [ ] 사라진 진입점 → 보존 위치 결정 또는 phase-9-future-features 큐 추가
- [ ] DB/API 살아있는 기능은 alert(준비 중) 금지 (E형)

[3] Knip 도입 옵션:
npm install knip --save-dev
package.json scripts: "lint:dead": "knip"
.knip.json 설정 (entry: src/app/**/page.tsx, src/app/**/route.ts)

산출:
- scripts/check-design-regression.sh
- .github/PULL_REQUEST_TEMPLATE.md
- (옵션) .knip.json + package.json 스크립트

각 산출 별도 커밋.
```

---

## 9. 우선순위 한눈에

```
[지금 — 4-6h]
├─ P0-A 박제 회귀 5건 (A-1~A-5) 일괄 픽스
├─ P0-B E형 라우팅 누락 3건 (15m)
└─ P0-C 회귀 방지 인프라 (1h) — 다음 회귀 차단

[이번 주 — 3h]
├─ P1-A B형 디자인 혼합 (B-1 + B-2 결정)
└─ P1-B UI 깨짐 위험 3건

[다음 주 — 1h]
└─ P2-A 좀비 코드 정리 (B-1 종료 후)

[백로그]
└─ A-6 /live/[id] finished 분기 (P0-5 별도 작업으로 분리됨)
└─ D형 placeholder 13건 — DB/API 우선순위에 맞춰 phase-9-future-features 큐로
```

**총 견적**: P0 5-7h + P1 3h + P2 1h = **약 9-11시간 / 2 작업일**.

---

## 10. KPI — 감사 후 추적

| 지표 | 현재 | 목표 (P0+P1 완료 시) |
|------|------|-------------------|
| A형 박제 회귀 (사용자 동선 끊김) | 5건 (+ 별도 P0-5) | 0~1건 |
| B형 디자인 혼합 | 2건 | 0건 |
| C형 좀비 코드 (import 0건) | 7~8건 | 0건 |
| D형 placeholder | 13개 영역 | DB/API 큐와 1:1 매핑 |
| E형 라우팅 누락 | 3건 | 0건 |
| W형 UI 깨짐 위험 | 3건 | 0건 |
| 박제 회귀 자동 검증 | 0 | scripts + PR 템플릿 적용 |

---

## 부록 A — 검증 사실 vs 추측

| 주장 | 근거 |
|------|------|
| `/teams` 필터 v2 미구현 | scratchpad.md:27 + teams-content-v2.tsx:14,140 명시 코멘트 |
| `tournament-tabs.tsx` v1 TeamCard 사용 | 파일 라인 29 import 직접 확인 |
| `like-button` v1 import 0건 | rg "from.*like-button[\"']" → V2 만 매칭 |
| `/games/my-games` alert 6건 | reg-row.tsx:204,212,233,241,252,269 직접 확인 (grep -c 결과 6) |
| `/profile` 4탭 누락 | phase-9-audit.md:175 + scratchpad.md:23 명시 |
| `/messages` 라우트 존재 | src/app/(web)/messages/page.tsx 파일 존재 확인 |
| `/games/[id]/report` 라우트 존재 | src/app/(web)/games/[id]/report/page.tsx 파일 존재 확인 |
| floating-filter-panel z-50 두 겹 | floating-filter-panel.tsx:104,118 직접 확인 |

## 부록 B — 외부 참조

- `Dev/design/phase-9-audit.md` §2-C 박제 회귀 점검 매트릭스 (5건 → 본 문서 A형 6건으로 확장)
- `Dev/design/phase-9-future-features.md` 시안-only 기능 큐 (D형 정당 placeholder 매핑처)
- `Dev/design/phase-9-paste-completeness.md` 117 라우트 5+1 등급 (이 문서와 직교 분석)
- `Dev/design/ui-consistency-audit-2026-04-29.md` 시안 vs 실제 (이 문서의 자매 문서)
- `.claude/scratchpad.md` 추후 구현 큐 (D형 정당성 검증 출처)
- `.claude/knowledge/lessons.md` 박제 작업 루틴 lessons
