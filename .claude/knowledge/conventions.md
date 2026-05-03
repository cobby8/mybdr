# 코딩 규칙 및 스타일
<!-- 담당: developer, reviewer | 최대 30항목 -->

### [2026-05-04] community_posts 사용자 노출 query 4단계 status 필터 의무 — 검수 카테고리 도입 시 점검 룰
- **분류**: convention (보안 / 검수 흐름 / 사용자 노출 query)
- **발견자**: pm (5/4 알기자 draft 7건 무단 노출 사고 후속 박제)
- **위치**: `src/app/api/web/community/route.ts` (list) + `src/app/(web)/community/[id]/page.tsx` (상세) + `src/app/(web)/community/[id]/_components/post-detail-sidebar.tsx` (작성자 글 수 + 인기글) + `src/app/sitemap.ts` (SEO) — 4 파일 모두 `where.status = "published"` 필수
- **규칙**: `community_posts.findMany / findUnique / count / groupBy` 사용 시 사용자 노출 query 는 **반드시 status 필터 명시** (`status: "published"` 또는 `status === "published"` 검사). admin actions 외 모든 사용자 노출 query 적용.
  - **admin actions 예외** (status 필터 X 정상): `actions/admin-news.ts`, `actions/admin-community.ts`, `(admin)/admin/community/page.tsx`, `(admin)/admin/news/page.tsx` (모두 검수 도구라 draft/rejected 조회 의무)
  - **이미 정상 적용 위치** (참고용): `nav-badges/route.ts`, `feed/route.ts`, `search/route.ts`, `(web)/news/page.tsx`, `(web)/news/match/[id]/page.tsx` 모두 `status: "published"` 명시
- **검수 카테고리 도입 시 4단계 점검** (회귀 방지 체크리스트):
  1. **INSERT status**: 자동 생성/일괄 INSERT 시 `status="draft"` 명시 (검수 흐름 탑승)
  2. **list filter**: 사용자 노출 list query 에 `where.status = "published"` 명시
  3. **상세 filter**: 직접 URL 접근 (`(web)/community/[id]/page.tsx` 등) 에서 `status !== "published"` 시 notFound (deleted 만 차단 X)
  4. **sitemap filter**: SEO 인덱싱 query 에서 `status: "published"` 명시 (draft 인덱싱 방지)
- **점검 명령**: 검수 흐름 도입 전 grep `community_posts\.(findMany|findUnique|count|groupBy)` → status 필터 부재 query 일괄 fix
- **사고 사례**: 5/4 알기자 backfill 7건 (post 1373~1379) status=draft 정상 INSERT 후 BDR NEWS 카테고리에 모두 노출 → 사용자 직접 보고 → 4 파일 일괄 fix (commit `05677ed`)
- **참조횟수**: 0

### [2026-05-04] 알기자 (BDR NEWS) 본문 노출 위치 = LinkifyNewsBody 의무 사용 — 헬퍼 buildLinkifyEntries 통합
- **분류**: convention (LLM 기자봇 / 본문 렌더링 / 일관성)
- **발견자**: pm (5/4 사용자 보고 — admin 미리보기에는 자동 링크 적용되는데 community 본문에는 안 됨)
- **위치**: `src/lib/news/build-linkify-entries.ts` (헬퍼) + 호출처 3곳 (`(web)/community/[id]/page.tsx`, `(web)/news/match/[matchId]/page.tsx`, `(admin)/admin/news/page.tsx`)
- **규칙**: 알기자 게시물 (category=news + tournament_match_id 보유) 본문 렌더링 위치 모두 `LinkifyNewsBody` 의무 사용. plain text 렌더링 (split/p) 금지. 일반 게시물은 기존 split/p 그대로.
- **헬퍼 시그니처**:
  - `buildLinkifyEntries(matchId: bigint): Promise<LinkifyEntry[]>` — 단일 매치 (community/news/match 페이지)
  - `buildLinkifyEntriesBatch(matchIds: bigint[]): Promise<Map<string, LinkifyEntry[]>>` — N개 매치 (admin/news 일괄, N+1 query 방지)
- **사유**: 5/3 LinkifyNewsBody 신설 시 community/[id]/page.tsx 통합 누락 → admin/news 미리보기 + news/match deep link 두 곳에만 적용 → 일관성 부재 + 사용자 본문에서 링크 못 봄. 헬퍼 분리로 3곳 일관성 보장 + 향후 추가 노출 위치도 헬퍼 호출만으로 정합.
- **알기자 게시물 식별**: `post.category === "news" && !!post.tournament_match_id` (안전 가드 — 외부 글이 news 카테고리일 가능성 0이지만 명시).
- **참조횟수**: 0

### [2026-05-03] minutes-engine 가드 범위 — 양팀 union 기준 통일
- **분류**: convention (live / minutes-engine / 가드 일관성)
- **발견자**: debugger (5/3 저녁 라이브 매치 #147 양팀 합 -17%p 손실 분석 중)
- **위치**: `src/lib/live/minutes-engine.ts` L131 (DB starter union 가드) + L196 (endLineup chain 가드)
- **규칙**: minutes-engine 의 starter 관련 가드 범위는 모두 **양팀 union 기준 (5~12명)** 으로 통일. 단일팀 기준 (3~7) 사용 금지.
  - DB starter union (L131): `dbStartersUnion.size >= 5 && size <= 12`
  - endLineup chain (L196): `prevEndLineup.size >= 5 && size <= 12`
- **사유**: 알고리즘이 양팀 starter 를 union 으로 시뮬 (Q1 endLineup 자연스럽게 size=10) → 가드도 union 기준이어야 함. 단일팀 기준 사용 시:
  - 정상 매치 (양팀 5+5=10) 도 가드 fail → fallback `inferStartersFromPbp` 강제 발동
  - PBP-only 추정으로 starter 3~5명만 추출 → active size=3 segment 시뮬 → 양팀 합 -15~20% 손실 (5/3 저녁 매치 #147 SKD vs MI Q2 home=82%/away=84%)
- **회귀 방지 test**: 케이스 L (`src/__tests__/lib/live/minutes-engine.test.ts`) — 양팀 5+5 starter 주입 → Q2 chain 통과 → 양팀 6000s 정확. 가드를 단일팀 기준 (3~7) 으로 되돌리면 즉시 fail.
- **참조횟수**: 0
- **참조 커밋**: d3984db
- **관련**: errors.md 2026-05-03 "endLineup chain 가드 범위 버그"

### [2026-05-03] Placeholder ↔ Real User 통합 표준 함수
- **분류**: convention (data integrity / dedup pattern)
- **결정자**: PM (셋업 + 18건 + #4 강화 누적 패턴 표준화)
- **함수 위치**:
  - 일반화: `src/lib/teams/merge-placeholder-user.ts` 의 `mergePlaceholderUser(phUid, realUid, opts?)`
  - 가입 hook (자동): `src/lib/teams/merge-temp-member.ts` 의 `mergeTempMember(teamId, realUserId)` — 내부에서 `mergePlaceholderUser({skipTmTransfer:true})` 위임
- **사용 패턴**:
  ```ts
  // 가입 hook (자동, members/join route 에서 이미 호출 중)
  const merged = await mergeTempMember(teamId, realUserId);

  // 운영 backfill (수동 일괄 통합 — 다음 LOW 86건 등)
  await mergePlaceholderUser(phUid, realUid, { realName: "이영기" });
  // → ttp transfer (충돌 시 skip) + tm transfer/absorb + UNIQUE 우회 + status=merged 일괄
  ```
- **사전 검증 필수** (호출자 책임): phUid 와 realUid 가 **같은 사람** 인지 확인. 동명이인 시그널 ↓
  - 🚨 real 이 같은 대회의 다른 팀 ttp 활발 보유 = 명백한 다른 사람 (5/3 오승준/이상현/이정민 케이스)
  - 🟢 안전 시그널: 같은 팀 멤버 / req approved 이력 / phone 일치 / nickname 한글자판→영문 매칭
- **stat/PBP 자동 보존**: ttp.id 변경 0 (`ttp.userId` UPDATE 만) → MatchPlayerStat / play_by_plays FK 그대로
- **헬퍼**:
  - `isPlaceholderEmail(email)` — 4가지 패턴 식별 (`@bdr.placeholder` / `@mybdr.temp` / `temp_` / `placeholder-`)
  - `getMergedNicknamePattern(realName, phUid)` — 통합된 placeholder 검색용 (`{name}_merged_{uid}`)
- **테스트**: `src/__tests__/lib/teams/merge-placeholder-user.test.ts` (vitest 10 케이스 — 헬퍼 단위 검증)
- **회귀 검증**: 호출자 (members/join route) 시그니처 변경 0 + members_count net 0 보장
- **참조횟수**: 0
- **관련**: errors.md 2026-05-03 "3종 UNIQUE 충돌" / lessons.md 2026-05-02 "Phase 7단계 트랜잭션"

### [2026-05-02] 팀 로고 업로드 자동 정규화 pipeline
- **분류**: convention (image / upload / sharp)
- **발견자**: developer (16팀 일괄 작업 commit 637c55e 의 검증된 pipeline 을 신규 업로드에도 일관 적용)
- **배경**: 사용자가 업로드하는 팀 로고는 가로형/세로형/정사각 비율 제각각 → 카드/헤더/hero 정사각 슬롯에서 잘림(cover) or 빈공간(contain) 회귀 반복.
- **규칙**:
  1. 팀 로고 업로드는 반드시 `bucket === "team-logos"` 로 `/api/web/upload` 호출 (기존 호출자 변경 없음 — 자동 적용)
  2. 서버는 sharp pipeline 으로 정규화 후 Supabase 에 저장 — **정방형 + 8% padding + 512×512 + PNG 압축**
  3. 출력 contentType / 확장자는 항상 `image/png` 강제 (입력이 jpg/webp/gif 라도)
  4. 다른 bucket (`tournament-images`, `court-photos`) 은 적용 ❌ — 16:9 배너 등 원본 비율 유지가 중요
  5. 정규화 실패 시 원본 그대로 업로드 (best effort, 사용자 경험 단절 방지) + console.warn 로그
- **함수 위치**: `src/lib/services/image-processor.ts` → `normalizeTeamLogo(buf): Promise<Buffer>`
- **통합 위치**: `src/app/api/web/upload/route.ts` (line ~90)
- **클라이언트 측 sharp 절대 금지** — sharp 는 Node only. 변환은 무조건 서버에서.
- **호출자 (자동 적용 3곳)**:
  - `src/app/(web)/teams/new/_v2/step-emblem.tsx` (팀 생성)
  - `src/app/(web)/teams/[id]/manage/page.tsx` (팀 관리)
  - `src/components/shared/image-uploader.tsx` (공통 컴포넌트, bucket prop 으로 분기)
- **검증**: `tsx` 단위 검증 5 케이스 (가로/세로/정사각/초소형/초대형) 모두 512×512 PNG 출력 확인 (2026-05-02)
- **참조횟수**: 0

### [2026-05-01] 선수명단 실명 표시 — `getDisplayName` 헬퍼 + `USER_DISPLAY_SELECT` 강제
- **분류**: convention (display / data formatting / SSR-CSR 통일)
- **결정자**: pm + 사용자 (decisions.md 2026-05-01)
- **배경**: 운영 8 패턴 혼재 (nickname 우선 7 / name 우선 2 / nickname 단독 5 / player_name 단독 3) → 사용자 본 페이지마다 다른 값 표시. 동호회최강전 placeholder User (nickname=null) 가 "—" 표시되는 회귀.
- **규칙**:
  1. **선수/유저 표시 시 직접 `user.nickname` 또는 `user.name` 접근 ❌** → 항상 `getDisplayName(user, ttp?)` 헬퍼 사용
  2. **Prisma select 시 `{ name, nickname }` 둘 다 select 필요** → `USER_DISPLAY_SELECT` 상수 spread 사용 권장 (`select: { id: true, ...USER_DISPLAY_SELECT }`)
  3. **우선순위**: `User.name → User.nickname → TournamentTeamPlayer.player_name → '#{jersey}' placeholder`
  4. **닉네임 별도 표기 필요한 곳**: hero card 등에서 "이름 (nickname)" 형식으로 보조 라인 (실명이 메인)
- **위치**: `src/lib/utils/player-display-name.ts` (헬퍼) + `src/lib/db/select-presets.ts` (preset)
- **적용 범위**: 경기 관련 모든 페이지 — `/teams/[id]` 로스터·hero / `/tournaments/[id]` 팀·선수 / `/tournament-admin/...` / `/_site/...` (서브도메인) / `/awards` / `/games/[id]` 라이브·기록 / Flutter v1 API (`/api/v1/...`)
- **검수 grep** (회귀 방지):
  - `\.nickname\s*\?\?\s*\.name` 또는 `\.name\s*\?\?\s*\.nickname` → 헬퍼 미사용 의심
  - Prisma `select.*nickname.*true` 시 `name: true` 동반 여부 확인
- **예외 영역**:
  - 채팅/메신저: 닉네임이 메인 (실명 노출 ❌)
  - 커뮤니티 게시글/댓글: 닉네임이 메인 (실명 노출 ❌)
  - 본인 프로필 편집/마이페이지: 사용자 본인 컨텍스트라 nickname/name 모두 노출 OK
- **본인인증 연동 시 폐기 정책**: 입력 폼 "실명 (필수)" 라벨은 임시 — 본인인증 활성화 시 자동입력으로 전환 (사용자 결정 2026-05-01)

### [2026-04-29] 모바일 최적화 체크리스트 (안티패턴 재발 방지)
- **분류**: convention (mobile/responsive)
- **발견자**: pm + developer (Phase 9-Mobile Refinement, commit `87c59d4`/`f972aaf` 등)
- **배경**: design_v2 전환 중 모바일 366px viewport에서 가로 overflow + 글자 겹침 + 카드 깨짐 등 안티패턴 누적 픽스 (8+ 건). 신규 페이지/컴포넌트 작성 시 아래 체크리스트를 통과해야 함.

#### 1. 그리드 (가장 빈번한 안티패턴)
- ❌ **금지**: 인라인 `gridTemplateColumns: "repeat(N, 1fr)"` 또는 `"AAA BBB"` 고정 폭
- ❌ **금지**: Tailwind `grid-cols-N` 단독 (sm/md 분기 없음)
- ✅ **권장**:
  - className: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-N gap-X` (mobile-first)
  - 또는 인라인: `gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))"` (가변 N열)
- ✅ **의미 있는 다열 (달력 7열, 통계 14열)**: 가로 스크롤 래퍼 패턴
  ```tsx
  <div className="overflow-x-auto">
    <div style={{ minWidth: 720, gridTemplateColumns: "repeat(7, 1fr)" }}>
  ```

#### 2. 1fr 컬럼 overflow 가드
- 1fr column의 자식이 긴 한글 텍스트면 부모 폭을 강제로 늘림
- ✅ **필수**: 1fr 컬럼 wrapper에 `minWidth: 0` 명시
- ✅ **필수**: 텍스트 자식에 `overflow:hidden + textOverflow:ellipsis + whiteSpace:nowrap` 또는 `WebKitLineClamp:2`

#### 3. Absolute 텍스트 (워터마크/장식)
- 모바일 viewport에서 본문 위 겹침 위험
- ✅ **권장**: 모바일에서 `hidden sm:block` 또는 fontSize 축소 (220px → 80px)

#### 4. 글로벌 가드 (안전망)
`globals.css`에 다음 가드 적용 중 (2026-04-29):
```css
@media (max-width: 768px) {
  html, body { overflow-x: hidden; max-width: 100vw; }
  .page { overflow-x: hidden; }
}
```
신규 페이지가 가로 overflow를 유발해도 가드로 차단됨. 그러나 **근본 원인은 컴포넌트 픽스가 정답**.

#### 5. 폼 요소 (iOS 자동 줌 차단)
- ❌ **금지**: input/select/textarea 폰트 16px 미만 (모바일 자동 줌 트리거)
- ✅ **글로벌 룰** (globals.css L1029-1041):
  ```css
  @media (max-width: 720px) {
    input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
    select, textarea { font-size: 16px !important; }
  }
  ```

#### 6. 버튼 터치 타겟
- ❌ **금지**: 모바일에서 버튼 height 44px 미만 (iOS HIG 위반)
- ✅ **글로벌 룰** (globals.css L1227-1233):
  ```css
  @media (max-width: 720px) {
    .btn { min-height: 44px; }
    .btn--sm { padding: 10px 14px; min-height: 44px; }
    .btn--xl { min-height: 48px; }
  }
  ```

#### 7. 카드 사이즈 통일
- 그리드 안 카드가 콘텐츠 따라 들쭉날쭉 → 시각 어색
- ✅ **권장**: 카드 컴포넌트에 `min-height` 명시
  - 데스크톱 280px / 모바일 240px (game-card 기준)
- ✅ **제목 truncate**: `WebKitLineClamp: 2 + overflow:hidden + display: -webkit-box`

#### 8. 워터마크/Avatar 텍스트 overflow
- ❌ **금지**: Avatar 박스 안 영문 텍스트 폰트 고정 (좁은 박스에서 튀어나옴)
- ✅ **권장**:
  - 컨테이너에 `overflow: hidden`
  - 폰트 동적: `clamp(14px, 4vw, 28px)`

#### 9. 헤더 충돌 방지
- ❌ **금지**: `(web)/layout.tsx` 외 별도 페이지 헤더 추가 렌더 (이중 헤더)
- ✅ **글로벌 헤더는 AppNav 단일** — 페이지 자체 nav 추가 X

#### 10. 브레이크포인트 통일
- mybdr 모바일 컨벤션: **720px** (Tailwind 768px 대신 720px 우선)
- v2 컴포넌트 모두 `@media (max-width: 720px)` 통일

---

#### 검증 방법 (체크리스트 활용)
1. 신규 컴포넌트 작성 시 위 10개 항목 체크
2. dev 서버 (localhost:3001/) → DevTools → 반응형 모드 → **366px viewport** 강제 검증
3. 가로 스크롤 발생 → 컴포넌트 안티패턴 의심
4. 글자 겹침 → absolute 요소 + 본문 z-index 확인
5. 폼 페이지 → iOS Safari (또는 Chrome iPhone simulation) 자동 줌 검증

#### 관련 errors.md 항목
- 2026-04-29 [모바일 가로 overflow 일괄 차단] (스크래치패드 작업 로그 참조)
- 2026-04-29 [grid 안티패턴 8건 픽스]
- 2026-04-29 [v2 컴포넌트 안티패턴 재발 + 글로벌 가드 추가]

#### 참조 커밋
- `4afb4f9` 모바일 grid 안티패턴 8건
- `f972aaf` 모바일 가로 overflow 일괄 차단 + globals.css 가드
- `87c59d4` Avatar/카드 모바일 폰트
- (오늘 P1~P4 commit) Phase 9-Mobile Refinement

- **참조횟수**: 0
- **승격 후보**: 신규 페이지 PR 리뷰 자동 체크리스트화

### [2026-04-22] `any` 타입 예외 허용 규칙 (audit 재발 방지)
- **분류**: convention (types)
- **발견자**: developer + pm (any audit 2차 — 3f54daa)
- **배경**: lessons.md [2026-04-20] audit에서 "kakao map 공통 컴포넌트 any 유지"만 예외 명시. 04-22 재스캔 시 Next.js HOF / Service Worker에서도 동일 판단 필요 → convention으로 승격해 audit 재발 방지.
- **정비 원칙 (3건 이상 any 발견 시 이 순서로 검토)**:
  1. **API 응답 any** → snake_case 인터페이스 명시 (CLAUDE.md 규칙)
  2. **Prisma where/select any** → `Prisma.{Model}WhereInput` / `Prisma.{Model}Select`
  3. **props / SWR fallback any** → 자식 컴포넌트 타입 재사용 또는 구체 interface
  4. **as any (unsafe cast)** → `unknown` + narrowing
- **허용 예외 (audit 시 건드리지 말 것)**:
  - **카카오맵 SDK**: `kakao-map.tsx`, `heatmap-overlay.tsx`, `courts-content.tsx` 등 — 공식 @types 미제공, eslint-disable + 근거 주석 이미 존재
  - **Next.js API handler HOF**: `withWebAuth` (`lib/auth/web-session.ts`) / `withAuth` (v1) — 런타임 `handler.length`로 3종 시그니처 분기, 타입 시스템으로 표현하면 오버로드 3개 × ctx 주입 변환 과도
  - **Service Worker globalScope**: `sw.ts` `declare const self: any` — `lib.webworker` 도입은 브라우저 lib과 self 타입 충돌 → 전체 tsconfig 손대는 비용 과도
- **신규 예외 추가 절차**: audit 중 새로운 SDK/런타임 예외 후보 발견 시 → PM 판단 → 여기 규칙에 추가 + 해당 파일에 근거 주석 1줄 병행
- **검증**: audit Grep 패턴 `:\s*any\b|\bas\s+any\b|<any>|\bany\[\]` 대비 현 프로젝트 잔존 13건 = 예외 13건 (실질 완결)
- **참조**: lessons.md [2026-04-20] 하드코딩 색상/any audit
- **참조횟수**: 0

### [2026-04-22] Tailwind v4 arbitrary value에서 color-mix 문법 (반투명 색상 토큰화)
- **분류**: convention (styling)
- **발견자**: developer + pm (C 3차 dfa5b9a 검증)
- **배경**: 하드코딩 `bg-red-500/10` 같은 반투명 에러 배경을 `var(--color-error)` 기반 토큰화할 때, hover 상태(`hover:bg-red-500/20`)도 같이 처리해야 의도(hover 시 진해짐) 유지. 인라인 style로는 `:hover`를 표현 불가 → Tailwind arbitrary value 활용.
- **규칙**: Tailwind v4 arbitrary value 내 공백은 **언더스코어(`_`)로 치환**
  - 기본: `bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]`
  - hover: `hover:bg-[color-mix(in_srgb,var(--color-error)_20%,transparent)]`
  - 텍스트: `text-[var(--color-error)]`
- **언제 이 문법, 언제 인라인 style**:
  - **Tailwind arbitrary**: hover/focus/active 같은 의사클래스 필요 시 (`:hover` 분기)
  - **인라인 style**: hover 없는 단순 반투명 (6건 중 5건, 0f41e99 1차 패턴)
- **검증**: `next build` PASS로 Tailwind v4 arbitrary value parse 확인 (3차 dfa5b9a tm-matches L248 삭제 버튼)
- **대체 금지 패턴**: `hover:opacity-80` (희미해짐 — 원본 "진해짐" 의도와 반대)
- **참조**: lessons.md [2026-04-20] 하드코딩 색상 audit
- **참조횟수**: 0

### [2026-04-20] 도메인 용어 정의 (용어 사전 단일 소스)
- **분류**: convention (UX/용어)
- **발견자**: pm (W4 L1)
- **규칙**: 서비스 전반에서 다음 9개 핵심 용어는 **`/help/glossary` 페이지 정의를 단일 소스**로 삼는다. 페이지/컴포넌트/알림/이메일/안내 문구 모두 아래 해석을 따른다.
  - **대회** (Tournament): 정해진 기간 내 여러 팀이 우승을 다투는 경기 묶음. 토너먼트/풀리그/혼합.
  - **경기** (Game): 단일 경기 단위. 픽업/게스트/연습경기 3종.
  - **픽업** (Pickup): 개인 단위로 모여 즉석 팀 구성.
  - **게스트** (Guest): 기존 팀이 부족한 인원을 외부에서 초청.
  - **연습경기** (Practice Match): 비공식 경기. 공식 기록/랭킹 반영 X.
  - **디비전** (Division): 대회 내 실력/나이 기준 참가 그룹.
  - **시드** (Seed): 대진 추첨 시 상위 팀 우선 배정.
  - **토너먼트** (Single/Double Elimination): 승자만 올라가는 방식.
  - **풀리그** (Round Robin): 모든 팀이 한 번씩 경기.
- **새 용어 추가 시**: 먼저 `src/app/(web)/help/glossary/page.tsx`에 추가하고, 이후 컴포넌트/알림에서 사용. 용어 뜻이 바뀌면 이 페이지부터 갱신.
- **네비게이션**: PC 사이드 네비 `/games`는 "경기 / 픽업·게스트 모집" 2줄 표기(`layout.tsx` `subLabel`). 모바일 하단탭은 공간 제약으로 "경기" 단독 유지.
- **발견 경로**: 푸터 "도움말" 링크 + 비로그인 홈 히어로 "처음이세요? 용어 사전 보기" 링크.
- **참조횟수**: 0

### [2026-04-20] 세션 분리 원칙 — 다음카페 sync는 항상 별도 세션 (운영 규칙)
- **분류**: convention (운영)
- **발견자**: pm + 사용자 (2026-04-20 합의)
- **규칙**: 본 프로젝트는 **2개 세션 동시 진행 패턴**으로 운영한다.
  - **본 세션** = `(web)`/`(api/web)`/`(referee)` 등 일반 UX/기능 작업 (M1~M7, Q1~Q12, L1~L3 등)
  - **카페 세션** = 다음카페 sync 작업 (Phase 1~3) — **항상 별도 터미널에서 동시 진행**
- **본 세션 PM 절대 금지 파일** (카페 세션 작업 손상 방지):
  - `scripts/sync-cafe.ts`, `scripts/cafe-login.ts`, `scripts/_tmp-*`, `scripts/backfill-*cafe*.ts`
  - `src/lib/cafe-sync/*` (article-fetcher, upsert, extract-fallbacks, mask-personal-info, board-map 등)
  - `Dev/cafe-sync-plan-*.md` (카페 세션 전용 기획 문서)
- **충돌 방지 패턴**:
  - 카페 세션의 commit이 origin/subin에 누적되어도 본 세션은 fast-forward로 자연 통합 (PR #46에 카페 Phase 2b Step 4까지 자연 합쳐짐)
  - **푸시 전 `git fetch` 권장** (양 세션 push 충돌 사전 감지)
  - 본 세션이 `git status`에서 카페 sync 파일이 modified로 보여도 절대 `git add` 금지 (다른 터미널 작업 중)
- **에이전트 위임 시**: developer/tester/reviewer 모두 핸드오프 프롬프트에 "카페 sync 파일 절대 수정 금지" 명시
- **참조횟수**: 0
- **승격 후보**: 프로젝트 CLAUDE.md (양 세션 모두 적용되는 핵심 원칙)

### [2026-04-19] 플로팅/다이얼로그 닫기 규칙 (전역 UX 컨벤션)
- **분류**: convention
- **발견자**: 수빈 (사용자 결정)
- **규칙**: 모든 플로팅 UI(모달/다이얼로그/팝오버/토스트 중 dismissible 한 것)는 **아래 3가지 닫기 액션을 모두 지원**한다:
  1. 내부의 **확인/닫기 버튼** 클릭
  2. 플로팅 **바깥 영역(backdrop)** 클릭 또는 터치
  3. **ESC 키** (키보드 사용자/접근성)
- **적용 범위**:
  - 신규 플로팅 UI는 **필수** 준수
  - 앞으로의 모든 작업에 동일 적용 (수빈 명시 요청)
  - 기존 컴포넌트 중 미준수 항목은 발견 시 순차 정비
  - admin / web / referee 그룹 공통
- **권장 구현**:
  - **shadcn/ui Dialog (Radix Dialog 기반)** — 세 가지 동작 기본 제공
  - 또는 직접 구현 시 `onPointerDownOutside`, `onEscapeKeyDown`, focus trap 포함
- **금지**: 반드시 클릭해야만 닫히는 "강제 플로팅", bookdrop 클릭 무시 패턴, ESC 비활성화

### [2026-04-17] 에이전트 호출 최소화 기준 (토큰 절약)
- **분류**: convention
- **내용**: 불필요한 Agent 호출 방지. 각 Agent는 자체 컨텍스트 로드로 토큰 소비가 크므로 PM 직접 처리 가능한 건 직접.
- **호출 기준**:

| 담당 | 조건 |
|------|------|
| **PM 직접** | 파일 1~2개 단순 수정, grep/read 1~2회, DB 조회 1회성, 스크립트 1개 작성+실행 |
| **Explore** | 파일 3개 이상 검색, 키워드 애매, 여러 경로에서 교차 확인 필요 |
| **planner-architect** | 구조적 결정, 다수 영향 분석, 새 기능 설계, decisions.md 등재 필요 |
| **developer** | 2파일 이상 연계 수정, 비즈니스 로직, 복잡한 타입 리팩토링 |
| **debugger** | 30분+ 삽질 예상, 에러 패턴 errors.md 등재 필요, 재발 위험 |
| **tester+reviewer** | 파일 3개+ 수정 시 병렬. 소규모는 tester만 or 생략(tsc 통과만으로) |

- **잘못된 예**: "grep 한 번이면 끝나는데 Explore 호출", "한 줄 수정에 developer 호출"
- **권장 패턴**: 먼저 PM이 파일 확인 → 복잡하면 Agent. 무조건 Agent부터 X

### [2026-04-17] 일회성 DB 스크립트 템플릿 재사용
- **분류**: convention
- **내용**: `scripts/_templates/` 폴더의 3가지 템플릿 활용 — `verify-tournament`, `backfill-players`, `merge-teams`
- **패턴**: 템플릿 복사 → 파라미터(TOURNAMENT_ID 등) 교체 → dry-run → `--execute` → 완료 후 삭제
- **원칙**: DELETE 금지, UPDATE only, 트랜잭션 + 사전/사후 카운트

### [2026-04-17] 공식 기록 쿼리 — `officialMatchWhere` 유틸 필수 사용
- **분류**: convention
- **내용**: "이미 치러진 공식 경기만 집계해야 하는" 쿼리는 `src/lib/tournaments/official-match.ts`의 3함수 중 맥락에 맞는 것 사용
  1. **`officialMatchWhere(extra?)`** — 표준 (대부분 이거). status `[completed, live]` + `scheduledAt <= NOW()` + `scheduledAt IS NOT NULL`
  2. **`officialMatchNestedFilter()`** — MatchPlayerStat → tournamentMatch 조인용 (getPlayerStats 패턴)
  3. **`pastOrOngoingSchedule()`** — status가 특수할 때 (기존에 `in_progress` 포함 등). scheduledAt 가드만 반환
  4. **`OFFICIAL_MATCH_SQL_CONDITION`** — raw SQL용 상수 (tm alias 기준)
- **적용 대상**: 순위표, 선수 커리어/승률, 팀 승패 집계, 팀 최근경기, 서브도메인 결과
- **적용 제외**: 대진표/일정 뷰(예정 경기 필요), admin 편집/생성/CRUD, 기록원/심판 API, seeding/builder
- **이유**: Flutter 테스트 데이터(미래 scheduledAt + status=live)가 공식 집계 오염 방어. 3조건 중 1개라도 누락 시 `id=120` 같은 버그 재발
- **참조**: decisions.md "공식 기록 가드 전역 적용"

### [2026-04-16] sticky 테이블 셀 규칙 — 불투명 배경 + z-10 쌍
- **분류**: convention
- **내용**: `<td className="sticky left-0 ...">` 같은 sticky 셀은 **반드시 두 가지 같이 적용**:
  1. **불투명 배경** — `bg-inherit` 사용 시 부모 `<tr>` 배경도 불투명이어야 함. zebra stripe는 `color-mix(in srgb, var(--color-card), #7f7f7f 6%)`로 불투명화
  2. **명시적 z-index** — `z-10` 클래스 (기본 auto는 스크롤 중인 셀 아래 깔림)
- **예**: `<td className="sticky left-0 z-10 bg-inherit ...">`
- **배경 불투명화 상수 패턴**:
  ```tsx
  const ROW_EVEN_BG = "var(--color-card)";
  const ZEBRA_BG = "color-mix(in srgb, var(--color-card), #7f7f7f 6%)";
  ```
- **참조**: errors.md "sticky 셀 가로 스크롤 겹침"

### [2026-04-16] 프린트 CSS 규칙 — 표준 @page 키워드 + table-layout: fixed
- **분류**: convention
- **내용**: `@media print` 블록 규칙:
  1. `@page { size: A4 landscape; margin: 8mm; }` **표준 키워드만 사용** (297mm 치수 강제 ✗)
  2. `html, body { width: ... !important }` 같은 프린트 레이아웃 강제 **금지** (Chrome PDF 메타데이터 충돌)
  3. 프린트 테이블은 `table-layout: fixed` + **th/td 모두 text-align 명시** (기본값 불일치 방지) + **th:nth-child(n)과 td:nth-child(n) 폭 둘 다 제어**
  4. 가상 프린터(Hancom PDF 등) 한계는 코드로 해결 불가 → **UI 안내 배너**로 대체
- **참조**: errors.md "프린트 th vs td 정렬 깨짐", lessons.md "브라우저 프린트 API 한계"

### [2026-04-16] 모바일/데스크톱 듀얼 렌더 패턴 (`sm:hidden` + `hidden sm:flex`)
- **분류**: convention
- **내용**: 가로폭 제약이 심한 레이아웃(예: 5단 가로 스코어카드)은 **모바일/데스크톱 별도 렌더**
  ```tsx
  <div className="sm:hidden">{/* 모바일 2행 */}</div>
  <div className="hidden sm:flex">{/* 데스크톱 5단 */}</div>
  ```
- **중복 최소화**: 공통 요소(TeamBlock/ScoreDisplay/CenterInfoBlock)를 **서브 컴포넌트 추출**
- **언제 쓰나**: Tailwind flex-wrap/responsive gap으로 해결 안 되는 구조적 차이(행 수가 다름)일 때
- **참조**: lessons.md "모바일 UI는 데스크톱 확대에 희생되면 안 됨"

### [2026-04-16] 플레이스홀더 기호는 짧은 hyphen `-` 통일 (em-dash `—` 금지)
- **분류**: convention
- **내용**: 테이블에서 값이 없을 때 `-` (hyphen, U+002D) 하나만 사용. `—` (em-dash, U+2014) 금지
- **이유**: DNP 행과 기타 빈 스탯 행이 **동일한 시각 패턴**으로 보여야 혼동 없음
- **적용 범위**: 화면 UI + 프린트 영역 + 쿼터 필터 showPlaceholder 모두

### [2026-04-14] 경기결과 실시간 집계 패턴 (Team.wins 필드 무시)
- **분류**: convention
- **발견자**: developer
- **내용**: Team.wins/losses/draws 필드는 자동 갱신되지 않으므로 **절대 사용 금지**. 대신 매 쿼리마다 tournament_matches 테이블에서 집계한다. (1) 집계 대상 status: "completed" + "live" 둘 다 포함 (진행 중 경기도 현재 스코어 반영). (2) 적용 위치: public-standings, hotTeam, 팀 상세 페이지, 랭킹 모두 동일 패턴. (3) 무승부는 농구에 없으므로 제외.  **패턴**:
  ```ts
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, status: { in: ["completed", "live"] } },
    select: { homeTeamId, awayTeamId, homeScore, awayScore },
  });
  // 팀별로 wins/losses 집계
  ```
- **참조횟수**: 0

### [2026-04-14] API 응답 snake_case → camelCase 자동 변환 (fetcher 래퍼)
- **분류**: convention
- **발견자**: developer
- **내용**: `apiSuccess()`는 응답을 snake_case로 자동 변환해 반환한다(래핑 없이 바로). 클라이언트에서 camelCase로 접근하려면 **fetcher 레벨에서 convertKeysToCamelCase() 적용**. 각 컴포넌트마다 `data.career_averages` vs `data.careerAverages` 고민할 필요 없음. **패턴**:
  ```ts
  // src/lib/utils/fetcher.ts
  export async function fetcher<T>(url: string): Promise<T> {
    const res = await fetch(url);
    const json = await res.json();
    return convertKeysToCamelCase(json) as T;
  }
  ```
- **금지**: 응답을 `.data.X`로 접근 (apiSuccess에 data 래핑 없음). errors.md "apiSuccess 응답에 .data로 접근" 참조.
- **참조횟수**: 0

### [2026-04-14] 팀 카드 공통 컴포넌트 (TeamCard) 재사용
- **분류**: convention
- **발견자**: developer
- **내용**: 팀 목록 페이지 + 대회 상세 "참가팀" 탭에서 같은 TeamCard 컴포넌트 사용. (1) 로고 이미지 없으면 primaryColor 배경 + city 텍스트로 대체. (2) 반응형 그리드: 모바일 2열 / 태블릿(md) 3열 / PC(lg) 4열. (3) 카드 전체가 `<Link href="/teams/{id}">`이므로 내부에 다시 Link 중첩 금지.
- **참조횟수**: 0

### [2026-04-12] 테마 반응형 배경 위 텍스트는 `--color-on-*` 변수 사용 (text-white 금지)
- **분류**: convention
- **발견자**: pm
- **내용**: CSS 변수가 라이트/다크 테마마다 값이 바뀌는 배경색(`var(--color-accent)`, `var(--color-primary)` 등) 위에 올라가는 텍스트는 **절대 `text-white` / `color: '#fff'` 같은 고정 색상을 쓰지 않는다**. 반드시 대응하는 `--color-on-*` 변수를 사용해 테마 전환 시 자동으로 대비가 유지되도록 한다. 이미 정의된 변수: `--color-on-primary` (primary 배경용), `--color-on-accent` (accent 배경용 — 2026-04-12 추가). 새로운 테마 반응형 배경 변수를 추가할 때는 동시에 `--color-on-*` 쌍 변수를 globals.css의 `:root`(라이트)와 `html.dark`(다크) 양쪽에 정의한다. **금지 패턴**: `bg-[var(--color-accent)] text-white`, `{ backgroundColor: 'var(--color-accent)', color: '#fff' }`. **올바른 패턴**: `bg-[var(--color-accent)]` + `style={{ color: 'var(--color-on-accent)' }}`. 이 규칙을 어기면 다크모드에서 "흰 배경 + 흰 글씨"가 되어 버튼이 안 보이게 된다 (실제 발생한 버그).
- **참조횟수**: 0

### [2026-03-22] 디자인 시스템 색상 체계
- **분류**: convention
- **발견자**: planner-architect
- **내용**: Primary #E31B23, Navy #1B3C87, Info #0079B9. 다크모드 기본. 모든 neutral은 쿨 그레이(R=G=B). 핑크/살몬/코랄 절대 금지.
- **참조횟수**: 5

### [2026-03-22] 아이콘 라이브러리
- **분류**: convention
- **발견자**: developer
- **내용**: Material Symbols Outlined 사용. lucide-react 완전 제거됨. 활성 아이콘 FILL 1.
- **참조횟수**: 3

### [2026-03-22] 폰트 체계
- **분류**: convention
- **발견자**: developer
- **내용**: 한글 본문 Pretendard, 영문 제목 Space Grotesk. CDN 로드.
- **참조횟수**: 2

### [2026-03-22] 버튼/컴포넌트 스타일
- **분류**: convention
- **발견자**: developer
- **내용**: 버튼 border-radius 4px (pill 9999px 금지). 카드 bg-card border-border rounded-lg. 호버 active:scale-95.
- **참조횟수**: 2

### [2026-03-22] 레이아웃 브레이크포인트
- **분류**: convention
- **발견자**: developer
- **내용**: lg(1024px) 기준. 데스크탑 사이드바 w-64 + sidebar-scaled(0.96). 모바일 헤더 h-16 + 하단네비 h-16.
- **참조횟수**: 2

### [2026-03-23] 페이지 리디자인 공통 패턴
- **분류**: convention
- **발견자**: pm
- **내용**: 모든 리디자인 시 "API 유지, UI만 변경" 원칙. 2열 레이아웃(lg:grid-cols-12, 좌 col-span-8 + 우 col-span-4). 섹션 헤더에 빨간/파란 세로 막대(w-1.5 h-6). 모바일은 1열(사이드바 하단). 히어로 배너에 그라디언트 배경. 클라이언트 사이드 페이지네이션(서버 API 변경 회피).
- **참조횟수**: 6

### [2026-03-23] DB 미지원 기능 처리 규칙
- **분류**: convention
- **발견자**: pm
- **내용**: DB에 없는 기능(좋아요/팔로우/티어 등)은 UI만 배치하고 동작 미구현. placeholder("-", "0") 사용. DB 스키마 변경은 별도 작업으로 분리. 이미지 없으면 CSS 그라디언트 또는 이니셜로 대체.
- **참조횟수**: 5

### [2026-03-28] BDR 디비전 체계 (3단계 계층)
- **분류**: convention
- **발견자**: developer
- **내용**: 1단계 성별(남성부/여성부) → 2단계 종별(일반부/유청소년/대학부/시니어) → 3단계 디비전(D3~D8/하모니~i4/U1~U3/S1~S3). 여성부는 코드 뒤에 W 추가. 공통 상수: src/lib/constants/divisions.ts. 자연어→표준코드 매핑은 scripts/migrate-divisions.ts 참조.
- **참조횟수**: 0

### [2026-03-23] 가로 스크롤 + 그리드 반응형 패턴
- **분류**: convention
- **발견자**: developer
- **내용**: 모바일에서 가로 스크롤(flex overflow-x-auto no-scrollbar), 데스크탑에서 N열 그리드(md:grid md:grid-cols-N md:overflow-visible). 카드 min-w-[Npx] md:min-w-0으로 스크롤/그리드 전환.
- **참조횟수**: 4

### [2026-03-28] 대회 상태 4종 통일 규칙
- **분류**: convention
- **발견자**: pm (사용자 지시)
- **내용**: 프로젝트 전체에서 대회 상태를 4종으로만 표시: **준비중**(draft/upcoming), **접수중**(registration/active/open 등), **진행중**(in_progress/live/ongoing 등), **종료**(completed/ended/cancelled 등). 공통 상수: src/lib/constants/tournament-status.ts
- **참조횟수**: 0

### [2026-03-28] admin UI 공통 패턴 (서버page + 클라이언트content)
- **분류**: convention
- **발견자**: developer
- **내용**: admin 페이지는 page.tsx(서버 컴포넌트, Prisma 쿼리+직렬화) + admin-{name}-content.tsx(클라이언트, AdminStatusTabs+테이블+AdminDetailModal) 패턴으로 통일. 테이블 3~4칸, 행 클릭 시 중앙 플로팅 모달, 상태별 탭 필터링. 공통 컴포넌트: AdminPageHeader, AdminDetailModal, AdminStatusTabs.
- **참조횟수**: 0

### [2026-03-28] 카드 컴팩트화 패턴
- **분류**: convention
- **발견자**: developer
- **내용**: 경기/대회/팀 카드 공통 구조 — 이미지 영역(h-20 lg:h-28, 유형별 그라디언트/Places 사진) + 정보 영역(p-3, 2줄: 제목+현황 / 금액+버튼). 이미지 좌상단 유형뱃지, 우하단 장소+시간 뱃지(bg-black/50 backdrop-blur). 텍스트 최소 text-xs(12px).
- **참조횟수**: 0

### [2026-04-02] NBA 2K UI 개편 6대 준수 원칙
- **분류**: convention
- **발견자**: pm (사용자 지시)
- **내용**: 
  1. 기존의 프로젝트 기능은 모두 100% 보존할 것.
  2. UX 흐름도 역시 기존과 동일하게 유지할 것.
  3. UI 외적인 로직이나 흐름 변경이 필요한 부분은 반드시 동의 후 작업 진행.
  4. 모바일 퍼스트 반응형 웹 원칙: 화면 여백을 많이 남기지 않고 공간을 밀도 있게 활용.
  5. 라이트모드/다크모드를 모두 지원하며 쉽게 전환할 수 있도록 설계.
  6. 레이아웃: PC(lg 이상) 화면은 NBA 2K 콘솔 메뉴처럼 다중 열 그리드로 설계하되, 모바일은 기존의 1열 스크롤 구조가 적합하므로 이를 유지.
- **참조횟수**: 0

