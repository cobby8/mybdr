# 코딩 규칙 및 스타일
<!-- 담당: developer, reviewer | 최대 30항목 -->

### [2026-05-12] 로그인 redirect 헬퍼 단일 source — `@/lib/auth/redirect`
- **분류**: convention/auth (open redirect 방어 + 로그인 후 자동 복귀)
- **발견자**: developer
- **내용**:
  - **쿼리 파라미터 통일**: 로그인 후 복귀 = `redirect` 하나만 사용. `next` / `returnTo` 변형 ❌ (login page 가 `redirect` 만 읽음 — 미통일 시 사일런트 무시).
  - **헬퍼 3종 (`@/lib/auth/redirect`)**:
    1. `isValidRedirect(path)` — open redirect 7 가드 (외부 URL / `//evil.com` / `/login` 자체 / `/api/` / 2000자 / null / 절대 경로).
    2. `buildLoginRedirect(pathname, search?)` — 안전 인코딩 → `/login?redirect=%2F...`. 무효 경로 → `/login` fallback.
    3. `safeRedirect(input, fallback?)` — 입력 검증 후 fallback (기본 `/`).
  - **금지 패턴**: 페이지별 로컬 `isValidRedirect` 함수 ❌ (분산 → 검증 룰 불일치). 직접 `path.startsWith("/")` 만 검사 ❌ (protocol-relative `//evil.com` 차단 못 함).
  - **server layout 가드 패턴**:
    ```ts
    const session = await getWebSession();
    if (!session) {
      const h = await headers();
      const pathname = h.get("x-pathname") ?? "/fallback-path";
      const search = h.get("x-search") ?? "";
      redirect(buildLoginRedirect(pathname, search));
    }
    ```
    - `x-pathname` / `x-search` 는 `src/middleware.ts` 가 주입. 본 헤더가 필요한 server layout 은 matcher 추가 필요 (현재 `/admin/*` + `/tournament-admin/*`).
  - **server page 가드 패턴** (pathname 정적 알 수 있는 경우):
    ```ts
    if (!session) {
      redirect(buildLoginRedirect(`/games/${id}/guest-apply`));
    }
    ```
  - **OAuth 콜백 (`bdr_redirect` 쿠키)**: `/api/auth/login?redirect=...` 가 쿠키 박제 (5분 TTL) → `handleOAuthLogin` 이 read + delete + safeRedirect 통과 후 redirect. 쿠키는 1회 사용 후 즉시 삭제 (재사용 방지).
- **테스트**: `src/__tests__/lib/auth/redirect.test.ts` (19 케이스) — 신규 헬퍼 호출 시 회귀 가드.
- **후속 큐**: 동일 패턴 잔존 7+ 파일 (`teams/manage`, `teams/[id]/_components_v2/team-*`, `tournaments/[id]/v2-registration-sidebar`, `lineup-confirm/[matchId]`, `report-form.tsx`, 등) 일괄 정리 권장.
- **참조횟수**: 0

### [2026-05-11] admin 영역 빨간색 본문 텍스트 금지 — 강조 뱃지/필수표시(*)만 허용
- **분류**: convention (디자인 시스템)
- **발견자**: reviewer / pm (사용자 보고 후 점검)
- **내용**:
  - `--color-primary` = BDR Red (#E31B23). 강한 시각 노이즈 → 본문 텍스트/통계 숫자/링크에 적용 금지.
  - 허용: 강조 뱃지 (예: "보유" / "신규" / "필수") / 필수 입력 표시 `*` / 위험 액션 버튼 / D-Day 뱃지.
  - 통계 / 강조 정보 텍스트 = `--color-accent` (BDR Red alias / globals.css L2763) 통일.
  - 본문 정보 텍스트 = `--color-text-primary`.
  - 승자 / 긍정 결과 텍스트 = `--color-success` (`#1CA05E` 그린).
- **검출 패턴**: `text-[var(--color-primary)]` admin 영역 grep — 본문 컨텍스트면 위반.
- **재발 방지**: PR 시 reviewer 가 admin 영역 빨강 텍스트 grep 검토.
- **hex hardcode 단일화**: 브랜드 hex (`#E31B23` / `#E76F51`) 는 `src/lib/constants/colors.ts` 의 `BDR_PRIMARY_HEX` / `BDR_SECONDARY_HEX` import 사용. DB 박제 / 사용자 선택 미리보기 등 hex 그대로 저장이 필요한 곳 전용 (컴포넌트 CSS 는 `var(--accent)` 토큰).
- **2026-05-11 fix 인벤토리**: Critical 11건 (analytics 차트 / tournament-admin-nav / series tournaments / matches 페이지 4건 / admins 이니셜 / org members hover / new 링크) + Major 4건 (wizard primary 초기값 2건 / wizard `[id]` 폴백 2건 / site/page COLOR_PRESETS "오렌지" → "BDR Red" 라벨 fix).
- **참조횟수**: 0

### [2026-05-11] 대회 관리 권한 헬퍼 — `canManageTournament(tournamentId, userId)` 단일 진입점
- **분류**: convention/auth (대회 관리 권한 검증)
- **위치**: `src/lib/auth/tournament-permission.ts`
- **3 통과 조건** (match-stream 패턴 재사용):
  1. `users.admin_role === 'super_admin'` → DB SELECT 우회 (즉시 통과)
  2. `tournament.organizerId === userId` → 대회 주최자
  3. `TournamentAdminMember(user_id, tournament_id, is_active=true)` → 위임 관리자
- **사용 위치**: 어드민 API route (server) + admin 페이지 server component. IDOR 차단 — tournamentId 파라미터로 다른 대회 접근 시 403.
- **재사용 룰**: 대회 단위 관리 권한 검증 시 직접 SELECT 패턴 ❌ → 본 헬퍼 위임 ✅. 신규 admin route 추가 시 GET/POST 양쪽 가드.
- **참조횟수**: 0

### [2026-05-09] forfeit 매치 운영 표준 — `notes` 컬럼 표기 형식 + 자동 카피 트리거
- **분류**: convention/operation (forfeit / FIBA Art.21)
- **표준 형식** (운영자 박제 의무):
  ```
  {기권팀} 기권 (사유: {사유 자연어}) — FIBA 5x5 Art.21 forfeit {점수}
  ```
  예: `MI 기권 (사유: 부상 등 인원부족) — FIBA 5x5 Art.21 forfeit 20-0`
- **자동 트리거**:
  - `auto-publish-match-brief.ts` `detectForfeit(notes)` 헬퍼 — `/기권|forfeit/i` 정규식 감지 → LLM 우회 + 사전 정의 카피
  - `tab-summary.tsx` `match.summary_brief.forfeit === true` 분기 → Headline 부제 "기권승 (FIBA Art.21 · {사유} 사유)" + Stats 4 카드 forfeit 모드
  - `summary_brief` JSON 메타: `{ forfeit: true, forfeit_reason: "{사유}" }`
- **사유 추출 정규식**: `/사유\s*[:：]\s*([^\)\)\—\-]+)/` (한글 콜론 + ASCII 콜론 + 닫는 괄호/em dash/hyphen 까지)
- **운영 처리 절차** (5단계): UPDATE 매치 (점수 + status + winner + ended_at) → audit 박제 → notes 박제 → progressDualMatch / advanceWinner → updateTeamStandings
- **회귀 방지**: notes 누락 시 LLM 일반 매치 카피 자동 생성 → "20점차 압승" 류 사실 왜곡. 반드시 notes 표준 형식 박제.

### [2026-05-09] 알기자 LLM 입력 — dual_tournament 구조 컨텍스트 명시 (brief route 의무)
- **분류**: convention/llm (구조 컨텍스트 + safety prompt 양면)
- **brief route 산출 의무 3 필드**:
  - `tournamentFormat`: `tournament.format` SELECT (dual_tournament 등)
  - `roundContext`: 라운드 의미 자연어 (라운드별 자동 매핑)
  - `advancement`: next_match_id 기반 진출 narrative
- **`MatchBriefInput` 확장 type** (`src/lib/news/match-brief-generator.ts`):
  ```ts
  tournamentFormat?: string | null;
  roundContext?: string | null;
  advancement?: string | null;
  ```
- **buildUserPrompt 출력 라인** (LLM 입력):
  ```
  - 대회 포맷: dual_tournament
  - 라운드 의미: 조 최종전 = 조 2위/3위 결정전 (조 1위는 이미 승자전에서 결정됨). 1위/우승 표현 절대 금지.
  - 매치 결과 진출: MZ → 8강 진출 (조 2위 자격) / 우아한스포츠 → 탈락 (조 3위)
  ```
- **prompts 가이드** (alkija-system.ts + alkija-system-phase2-match.ts 양쪽 [Dual Tournament 구조 가이드] 단락 강제):
  - "조 최종전 단어만 보고 1위/우승/결승 표현 금지"
  - "입력 [매치 결과 진출] narrative 그대로 인용"
  - "명시되지 않은 순위 절대 추측 금지"
- **확장 룰**: 다른 포맷 (single_elimination / round_robin) 추가 시 `brief route` 의 roundContext 분기에 케이스 추가 + prompts 에 케이스별 가이드 확장
- **재발 방지**: LLM 에 사실 데이터만 전달 / 가이드만 강화 → 둘 중 하나만으로는 약함. 양면 보강이 표준.

### [2026-05-09] 모바일 가드 4 분기점 표준 (반응형 룰)
- **분류**: convention/ui (반응형 가드 / 디자인 13 룰 #13 보강)
- **결정자**: 사용자 (5/9 시안 본격 적용 모바일 호환 검증 중)
- **분기점 4**:
  - **`max-width: 360px`** — 작은 모바일 (iPhone SE 320, Galaxy S 360) — 폰트/카드 1단계 더 압축
  - **`max-width: 720px`** — 일반 모바일 (iPhone Pro Max 430까지) — 1열 stack / h1 22px / iOS input 16px / 44px 버튼 (주력 분기 / 시안 30건 / 운영 7건)
  - **`max-width: 900px`** — 태블릿 / 작은 데스크탑 — 사이드바 stack (`home__split { 1fr }`)
  - **`min-width: 1024px`** — 데스크탑 — 사이드바 표시 (`home__split { 1fr 300px }`)
- **다른 분기 사용 금지** (380/420/460/980 등) — 사유 박제 명시 시만 예외
- **iOS 룰**:
  - input font-size 16px (자동 줌 차단)
  - 터치 영역 최소 44px (버튼 높이)
  - 320px 최소 폭 가로 overflow 0 (iPhone SE 1세대 가드)
- **자동 그리드 우선** (권장):
  - `gridTemplateColumns: repeat(auto-fit, minmax(N, 1fr))` 패턴 (StatsStrip 140 / NoticeCard 분리 280 등)
  - @media 명시보다 자동 분기 우선 — 컨테이너 폭에 따라 자동 줄바꿈
- **명시 @media 보조**:
  - `@media (max-width: 900px) { .home__split { grid-template-columns: 1fr !important } }` (사이드바 stack)
  - `@media (max-width: 720px) { h1 { font-size: 22px !important } }` (헤더 타이틀)
- **위반 자동 reject**: 신규 컴포넌트 도입 시 4 분기점 가드 누락 / 비표준 분기 사용 (사유 미박제)
- **참조 파일**:
  - 시안 `Dev/design/BDR-current/screens/Home.jsx` line 184~190 (`home__split @ 900px` + `h1 @ 720px`)
  - 운영 `src/components/bdr-v2/stats-strip.tsx` (auto-fit minmax 140)
  - `src/app/globals.css` 분기 9건 (.with-aside / .drawer / .home__* 등)
- **참조횟수**: 0

### [2026-05-09] 공식 기록 도메인 = 실명 우선 (`getDisplayName()` 헬퍼 의무 사용)
- **분류**: convention/domain (선수명 표시 정책 단일화)
- **결정자**: 사용자 (D-day 5/9 동호회최강전 기록앱 출전 검증 중 발견)
- **정책**: 공식 기록 노출 컨텍스트는 **실명 우선** 폴백 체인 강제
  - 우선순위: `user.name` → `user.nickname` → `ttp.player_name` → `'#' || jerseyNumber` → fallback ('선수')
  - 헬퍼: `src/lib/utils/player-display-name.ts` `getDisplayName(user, ttp?, fallback?)`
  - Supabase RPC `get_tournament_players` 도 동일 폴백 (5/9 함수 갱신 = `COALESCE(u.name, u.nickname, ttp.player_name, '#'||jersey)`)
- **적용 컨텍스트**:
  - **공식 기록 (실명 의무)**: 라이브 박스스코어 / PBP / MVP 시상 / 대회 통계 / 매치 라인업 / 선수 카드 / Flutter v1 API roster
  - **사적 (nickname OK)**: 커뮤니티 글·댓글 / 본인 프로필 hero / 채팅 / 알림 메시지
- **위반 자동 reject**:
  - 공식 기록 페이지에서 `u.nickname` 직접 참조 금지 → `getDisplayName()` 헬퍼 통과 의무
  - Supabase RPC display_name 폴백에 nickname 우선 ❌
  - Next.js API roster/players 응답에 `users.name ?? "선수"` 단순 폴백 ❌ (헬퍼 통과 필수)
- **5/9 fix 적용 위치**:
  - Supabase RPC `get_tournament_players` (실측 갱신 완료 / 16팀 한글 없는 display_name 11→0 자동 해결)
  - `/api/v1/matches/[id]/roster` route — 헬퍼 마이그 (5/9 작업)
- **후속 큐**: 공식 기록 노출 30+ 파일 (live/awards/reviews/mvp/박스스코어/매치통계) 헬퍼 마이그 일괄 점검 (planner-architect 위임)
- **참조횟수**: 0

### [2026-05-08] 사이트 전역 input 룰 — PhoneInput / BirthDateInput 의무 사용
- **분류**: convention/ui (input 전역 컴포넌트)
- **결정자**: 사용자
- **내용**:
  - 휴대폰 입력 = `<PhoneInput>` (`src/components/inputs/phone-input.tsx`) 의무 사용
    - 자동 `000-0000-0000` 포맷 (숫자만 입력 → 하이픈 자동 삽입)
    - placeholder "숫자만 입력 (010XXXXXXXX)"
    - 11자리 제한 (slice 0..11)
    - `inputMode="numeric"` 모바일 숫자 키패드
  - 생년월일 입력 = `<BirthDateInput>` (`src/components/inputs/birth-date-input.tsx`) 의무 사용
    - 자동 `YYYY-MM-DD` 포맷 (숫자만 입력 → 하이픈 자동 삽입)
    - **yyyy 4자리 제한** (HTML date input 의 6자리 입력 함정 fix — 사용자 명시)
    - 1900~현재 연도 검증 (UI 가드 / 서버 zod 가 final)
    - `<input type="date">` 함정 회피 → `type="text" + inputMode="numeric"` 패턴
- **적용 시점**: 신규 작업부터 즉시 적용. 기존 사용처 (가입폼 / 마이페이지 / settings 등) 는 별도 마이그레이션 작업으로 점진적
- **위반 자동 reject**: 신규 작업에 직접 `<input type="tel">` 또는 `<input type="date">` 사용 금지
- **참조 파일**: `src/components/identity/mock-identity-modal.tsx` (5/8 첫 적용 사례)
- **참조횟수**: 0

### [2026-05-07] 한글 IME 가드 룰 — Enter 처리 input/textarea 의무 패턴
- **분류**: convention/i18n (한글 입력 함정 영구 차단)
- **발견자**: pm + 사용자 ("한글 입력이 자꾸 안되는 경우")
- **룰**: 모든 controlled input/textarea 의 `onKeyDown` 에서 Enter 키로 action/submit 호출하는 경우 **반드시** `e.nativeEvent.isComposing` 가드를 첫 줄에 추가.
- **표준 패턴**:
  ```tsx
  onKeyDown={(e) => {
    if (e.nativeEvent.isComposing) return; // 한글 IME composition 중 Enter = confirm 용
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }}
  ```
- **이유**: 한글/일본어/중국어 IME 마지막 글자 confirm Enter 와 submit Enter 가 React `e.key === "Enter"` 로 모두 잡힘. 가드 없으면 (1) 마지막 한글 잘림 (2) 빈 입력 submit (3) 한글 입력이 사라지는 것처럼 보임. 영문만 테스트하면 사일런트 함정.
- **적용 범위**:
  - 한글 입력 가능 input/textarea: **의무**
  - 이메일/숫자/URL 등 한글 무관 input: **defensive (일관성)** — 적용 권장
  - 외부 컴포넌트 (Toss-Card 등 onClick 트리거): 영향 없음 — 적용 불필요
- **테스트 의무**: 신규 폼 input 추가 시 한글 입력 + 마지막 글자 Enter 케이스 1회 검증.
- **errors.md 박제**: [2026-05-07] 한글 IME composition 중 Enter 함정.
- **본 룰 적용 commit (10 개소 일괄)**: messages/community/referee admin/tournament-admin/profile/edit/admin-users-table.
- **참조횟수**: 0

### [2026-05-05] 토큰 효율 룰 — agent prompt 분량 명시 + 보고서 diff-only 응답 + 결정 3건 분리
- **분류**: convention/efficiency (토큰 효율 / 응답 품질 영향 0 검증됨)
- **발견자**: pm + 사용자 (jersey 도메인 재설계 turn 회고)
- **5 룰 (모두 응답/코드 품질 영향 0)**:
  1. **agent 위임 prompt** = 산출물 형식 + 분량 ("1500자 이내") + 시간 ("30분 이내") 명시. timeout 위험 ↓ + 산출물 명확. 광범위 prompt → 분해 (Explore "5개 파일만" / planner "옵션 3개만").
  2. **보고서 long-form 1회만** — 첫 응답 후 후속 turn = "보고서 §X 변경 / 결정 항목만" diff 형식. 옵션 비교표 등 동일 정보 반복 금지. 보고서 파일 참조로 충분.
  3. **사용자 결정 = 핵심 Y/N 3건 이내** + 옵션은 "다른 의견 있으면 1줄로". 7~10건 묶음 ❌. 충돌 항목만 노출.
  4. **임시 SELECT/UPDATE 스크립트 작성 전 prisma schema 1회 `Grep "model X"`** — 모델 필드명 / @map / unique 사전 확인. 재시도 ↓.
  5. **scratchpad 즉시 압축** — turn 종료 시 직전 작업의 "기획설계" / "구현 기록" 섹션 = 작업 로그 1줄로 통합. 결정 후 옵션 보고 섹션도 1~2줄로. 100줄 초과 방치 X.
- **PM 직접 vs agent 위임 기준 강화**:
  - PM 직접: SELECT 1~2회 / 파일 1~2개 / Grep 단일 패턴 1회
  - Explore: 파일 3개+ / 키워드 애매 / 광범위 검색
  - planner: 구조적 결정 / 옵션 분석 / 영향 평가
- **system-reminder TaskCreate 무시 룰**: 작업 단위 작은 경우 (jersey UPDATE 1건 등) task tracking 불필요. 룰 따라 무시.
- **참조횟수**: 0

### [2026-05-05] 인증 가드 추가 규칙 — getAuthUser() 단일 진입점 위임 (직접 getWebSession+findUnique 패턴 금지)
- **분류**: convention/auth (가드 일관성 / 누락 회귀 영구 차단)
- **발견자**: developer (옵션 B-PR1 구현 후 박제)
- **본질**: 가드 5개소 분산 + 신규 가드 추가 시 같은 패턴 반복 → 누락 회귀 발생 (fa5bd90 signup 누락 1례). `getAuthUser()` 단일 헬퍼로 통합하여 신규 가드 추가 시 1줄로 끝나도록.
- **신규 보호 페이지 추가 룰**:
  - **금지**: `const session = await getWebSession()` + `prisma.user.findUnique({ where, select: { status } })` 직접 사용 패턴 ❌
  - **의무**: `const auth = await getAuthUser()` + `auth.state` 분기 ✅
  - **분기 패턴 표준**:
    ```ts
    const auth = await getAuthUser();
    if (auth.state === "anonymous") redirect("/login?redirect=/path");
    if (auth.state === "withdrawn" || auth.state === "missing") redirect("/login?withdrawn=expired");
    // state === "active" 통과
    ```
- **5 보장**:
  1. JWT verify + DB SELECT + status 분기 단일 캡슐화
  2. React.cache dedup → 4 layout 동시 호출해도 DB 1회
  3. 탈퇴/미존재 쿠키 자동 cleanup → 1회 진입으로 영구 제거
  4. DB 실패 = anonymous fallback (안전 우선)
  5. cookies.delete 실패 = silent fail (try/catch)
- **사용 위치**: server component layout / server action 만. route handler 는 기존 `withWebAuth` 유지.
- **참조**: `src/lib/auth/get-auth-user.ts` (신규) + 4 layout 위임 (commit `d8bba4a`)

### [2026-05-05] 관리자 강제 변경 액션 패턴 — 사유 필수 + admin_logs warning + 권한 최소
- **분류**: convention/admin-action (PIPA 본인정정권 + 감사 추적)
- **발견자**: pm + 사용자 (개인정보 취급 방침 검토 결과)
- **변경 가능 필드 (운영 긴급만)**: nickname (부적절 신고) / bio (부적절 소개) / is_elite (대회 자격). 신원/연락처/거주지/신체/선호 = 본인 정정권 = 변경 X
- **사유 입력 필수**: textarea minLength 5 — 5자 미만 시 server action 422 반환
- **admin_logs**: `severity="warning"` (긴급 변경 표시) + description 에 사유 박제 + previousValues + changesMade
- **UI 톤**: warning 색상 border + "⚠ 긴급 변경" 라벨 (일반 편집과 시각 구분)
- **편의 액션**: 닉네임 자동 초기화 버튼 (`user_<id>` 채움) / 소개글 전체 삭제 버튼
- **분기 처리**: `is_elite_present` hidden marker (체크 해제도 false 전송)
- **참조**: `actions/admin-users.ts` `updateUserProfileAction` (3필드만)

### [2026-05-05] role 별 배번 정책 — player 필수 / coach·captain 선택 (대회 신청 분기)
- **분류**: convention/tournament-validation (선수 자격 / 데이터 정합성)
- **발견자**: pm + 사용자 (출전 선수 배번 누락 11건 점검)
- **role 매트릭스**:
  - `player` (또는 default) → jerseyNumber 필수 (대회 출전 식별)
  - `coach` → jerseyNumber 선택 (벤치)
  - `captain` → jerseyNumber 선택 (운영진)
- **신청 차단 위치 (web)**: `/api/web/tournaments/[id]/join` — zod 통과 후 누락 선수 닉네임 나열 + 422
- **admin 추가 위치 (web)**: `/api/web/tournaments/[id]/teams/[teamId]/players` — role==="player" + jersey null 차단
- **현장 등록 (Flutter)**: zod schema 에서 jersey_number required (이미 안전)
- **UI 표시 (admin/users 모달)**:
  - player + 배번 → "#5" 회색
  - player + 누락 → "⚠ 배번 누락" 빨간 (인라인 입력 가능)
  - coach/captain + 배번 → "#5" 회색
  - coach/captain + 누락 → "—" 회색 (정상)
  - 대회명 우측 role 라벨 ("코치"/"주장") — player 라벨 X
- **참조**: `admin-users-table.tsx` `TournamentRow` + `actions/admin-users.ts` `updateTournamentPlayerJerseyAction`

### [2026-05-04] 가입·프로필 흐름 분리 패턴 — 가입=인증 / 프로필=활동 / 선호=정밀화 (3단계)
- **분류**: convention/ux-flow (가입 단순화 / 점진적 정보 보완 / profile_completed 자동 갱신)
- **발견자**: pm + 사용자 ("가입은 간단하게, 로그인 후 활동 정보 설정 쉽게")
- **3단계 분리 룰**:
  - **단계 1 가입 (인증)**: signup 1-step — 이메일 + 비밀번호 + 닉네임 + 약관만 (필수 최소)
  - **단계 2 프로필 (활동)**: profile/edit § 활동 환경 — 포지션·신장·등번호·지역·실력·게임유형 (매칭 핵심)
  - **단계 3 선호 (정밀화)**: profile/edit § 활동 환경 확장 — 스타일·빈도·목표 (추천 정밀화)
- **CTA 유도 패턴** (홈 ProfileCtaCard):
  - 표시 조건 = 로그인 + `!user.profile_completed` + localStorage 7일 미억제
  - 닫기 = localStorage `profile_cta_dismissed_at` 7일 (DB 영향 0)
  - 자동 숨김 = profile_completed=true 시 SWR revalidate
- **profile_completed 자동 갱신 룰** (API PATCH 시):
  - 핵심 5필드 = position + height + preferred_regions + skill_level + preferred_game_types
  - 5/5 입력 = true / 빈배열 안전 가드 (`Array.isArray && length > 0`)
  - PATCH 시 findUnique 1회 + 머지 후 boolean 계산 + updateProfile 자동 반영
- **데이터 분류 통일 룰**:
  - 포지션 = 5종 (PG/SG/SF/PF/C) — onboarding 3종 (G/F/C) 도입 ❌
  - 실력 = 5단계 (초보/초중급/중급/중상급/상급) — 선출급 = `is_elite` Boolean 분리
  - 지역 = 17 시도 (preferred_regions) — 서울 18구 chip 도입 ❌ (대신 city/district 시·구 유지 = 정밀 매칭용 별도 의미)
  - 게임 유형 = 5종 (픽업/게스트/연습경기/대회/길농)
  - 신규 wizard 추가 시 본 분류 위반 ❌
- **폐기 페이지 redirect 패턴**:
  - server component + `import { redirect } from "next/navigation"` + 즉시 발동
  - 외부 링크/북마크 안전 (사용자 client 도달 전)
  - 폐기 컴포넌트 (`_components/setup-form.tsx` 등) 본문 보존 — 별도 cleanup 큐
- **회귀 방지**:
  - signup wizard 추가 ❌ (1-step 유지)
  - profile/edit 외 별도 wizard 페이지 신설 ❌
  - 신규 컬럼 추가 시 profile_completed 핵심 5필드 검토
- **참조 commit**: d248e50 (자동 로그인 비활성) → 5cfd586 (1차 F1+F2+F5) → 6531452 (2차 F3+F4)

### [2026-05-04] 게임 유형 표준 라벨 — UI "연습경기" / DB·코드 `scrim` 분리 + "길농" 신규
- **분류**: convention/i18n-ui (사용자 노출 라벨 vs 코드 식별자 분리 / 게임 유형 표준)
- **발견자**: pm + 사용자 (스크림 → 연습경기 / 정기팀 → 길농 변경 결정)
- **결정**:
  - **사용자 노출 UI 라벨**: 픽업 / 게스트 / **연습경기** / 대회 / **길농** (한글 5종 표준)
  - **코드·DB 식별자**: `pickup` / `guest` / **`scrim`** / `tournament` / (길농은 신규 — 별도 코드 미정의 / DB JSON `"길농"` 한글 직접 저장)
  - **분리 사유**: ① UI 라벨 변경 시 운영 영향 0 (DB·라우트·변수 보존) ② 외부 링크 (`/scrim`) 안전 ③ 코드 refactor 비용 회피
- **첫 적용 (2026-05-04)**:
  - 한글 "스크림" → "연습경기" 사이트 14 파일 일괄 (UI 라벨만)
  - 영문 `scrim` 보존 (26 occurrences / 15 files)
  - URL `/scrim` 보존 (외부 링크 안전)
  - signup Step 3 = "길농" 신규 옵션 추가 (한글 그대로 DB 저장)
- **회귀 방지 룰**:
  - 신규 코드에서 한글 "스크림" 신규 도입 ❌ → 항상 "연습경기"
  - 한글 "정기팀" 신규 도입 ❌ (의도 = 야외 매칭이면 "길농" / 다른 의미는 별도 라벨)
  - DB 값에 한글 게임 유형 저장 시 신중히 (User.preferred_game_types JSON 한정 = 사용자 선호만)
  - 코드 식별자 / DB 값 / URL 의 영문 `scrim` 변경 ❌ (대규모 마이그 부담)
- **점검 명령**:
  - 한글 사용자 노출: `grep -rn "스크림" src/app/**/*.tsx` → 0건 (signup 박제 주석 제외)
  - 한글 "정기팀": `grep -rn "정기팀" src/app/**/*.tsx` → 0건
- **참조 발견**: signup Step 3 활성화 작업 (본 commit 직후 push)

### [2026-05-04] 듀얼 토너먼트 표준 default = sequential (페어링 모드 분기 패턴)
- **분류**: convention/business-logic (듀얼 토너먼트 16팀 4조 27 매치)
- **발견자**: developer (P3~P7 박제)
- **표준 default**: `DUAL_DEFAULT_PAIRING = "sequential"` (`src/lib/tournaments/dual-defaults.ts`)
  - 신규 듀얼 대회 자동 적용 — wizard format 변경 시 `DUAL_DEFAULT_BRACKET` 일괄 채움
  - 8강: A1+D2 / B1+C2 / C1+B2 / D1+A2 (같은 조 결승까지 분리, 단일 코트 효율)
  - 4강: 8강 1+2 / 8강 3+4 (양 모드 동일)
- **옵션 X (adjacent)**: 5/2 동호회최강전 호환 옵션 보존
  - 8강: B1+A2 / D1+C2 / A1+B2 / C1+D2 (AB/CD 진영 분리, 멀티 코트 묶기)
  - 5/2 운영 데이터 (`138b22d8`) `settings.bracket.semifinalPairing="adjacent"` 박힘
- **분기 위치**: `generateDualTournament(assignment, tournamentId, pairing)` 3번째 인자 / `bracket/route.ts` POST 가 `settings.bracket.semifinalPairing` 참조 (default DUAL_DEFAULT_PAIRING)
- **운영자 변경 가능**: BracketSettingsForm + DualGroupAssignmentEditor 모두 select dropdown 노출
- **bracket-builder 옵션**: `useNextMatchId?: boolean` — true 시 `nextMatchId` 기반 정확 페어링 (i/2 fallback 안전), false (default) 기존 i/2 페어링 (single elim 회귀 0)
- **참조횟수**: 0

### [2026-05-04] 비밀번호 입력란 — 보기 버튼 의무 + autoComplete 정밀 제어 (글로벌 룰)
- **분류**: convention/ui (모든 비밀번호 input 공통 / UX 표준)
- **발견자**: pm + 사용자 (회원가입 페이지 운영 보고: 자동 채움 + 보기 버튼 미존재)
- **글로벌 룰** (사용자 결정 — 모든 프로젝트 공통, 본인 작업 영구):
  - **모든 `type="password"` input** = 보기/숨기기 토글 버튼 **의무 삽입**
  - 아이콘 = Material Symbols Outlined `visibility` ↔ `visibility_off`
  - 위치 = input 우측 (absolute) / `tabIndex={-1}` (Tab 자연 흐름)
  - 패턴 = 재사용 컴포넌트 추출 (`PasswordInput` 등) 후 일괄 사용
  - aria-label = "비밀번호 보기" / "비밀번호 숨기기" (a11y)
  - 토큰만 (var(--*)) / 하드코딩 색 ❌
- **autoComplete 룰** (브라우저 자동 채움 정밀 제어):
  - 이메일/아이디 → `autoComplete="username"` 또는 `"email"` (클릭 시 dropdown)
  - 가입 비밀번호 → `autoComplete="new-password"` (자동 채움 차단)
  - 로그인 비밀번호 → `autoComplete="current-password"` (저장된 값 자동 채움 활성)
  - 비밀번호 변경 → 현재=`current-password` / 새=`new-password` 분리
  - 페이지 진입 시 즉시 채움 ❌ / 클릭 시 dropdown ✅
- **mybdr 위치**: `src/components/ui/password-input.tsx` (신규 컴포넌트, 2026-05-04)
- **현재 적용**: signup/page.tsx (1 페이지 / commit bc6838e 후속)
- **점진 적용 큐** (5 파일):
  - `(web)/login/page.tsx` (로그인 비밀번호 — `current-password`)
  - `(web)/profile/edit/page.tsx` (현재 비밀번호 + 새 비밀번호)
  - `(web)/profile/settings/_components_v2/danger-section-v2.tsx` (탈퇴 확인 비밀번호)
  - `(referee-public)/referee/signup/page.tsx` (심판 가입)
  - `(referee)/referee/admin/members/new/page.tsx` (admin 회원 등록)
- **참조 발견**: 사용자 카톡 보고 (인라인 회원가입 UX 사각지대 fix 후속)
- **참조횟수**: 0

### [2026-05-04] `prisma db push --accept-data-loss` 회피 = `prisma db execute` 직접 SQL 우회 (CLAUDE.md DB 정책 준수)
- **분류**: convention/prisma (운영 DB 안전 가드 / destructive 방지)
- **발견자**: developer (매치 코드 v4 Phase 1 schema push 시)
- **배경**: 신규 NULL 허용 ADD COLUMN 6개 + UNIQUE 제약 2개 추가 시 `prisma db push` 가 UNIQUE 제약 추가에 대해 `--accept-data-loss` 플래그 요구. CLAUDE.md DB 정책 절대 금지 룰 = "prisma migrate reset 또는 prisma db push --accept-data-loss 운영 DB 에 실행 ❌ (데이터 파괴)".
- **우회 패턴** (안전):
  ```bash
  # 직접 SQL 작성 + prisma db execute (--accept-data-loss 플래그 없이 실행)
  npx prisma db execute --file=scripts/_temp/v4-schema-add-columns.sql --schema=prisma/schema.prisma
  ```
  ```sql
  -- v4-schema-add-columns.sql
  ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS short_code VARCHAR(7);
  ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS region_code VARCHAR(2);
  ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS match_code VARCHAR(20);
  -- ... 4컬럼
  CREATE UNIQUE INDEX IF NOT EXISTS tournaments_short_code_key ON tournaments(short_code);
  CREATE UNIQUE INDEX IF NOT EXISTS tournament_matches_match_code_key ON tournament_matches(match_code);
  ```
- **사전 SELECT 1건 + 사후 verify 필수** (CLAUDE.md 룰):
  - 사전: `SELECT COUNT(*) FROM tournaments` (count 보존 확인 baseline)
  - 사후: `information_schema.columns WHERE table_name = 'tournaments' AND column_name IN ('short_code', 'region_code')` (컬럼 존재 검증)
- **NULL 허용 ADD COLUMN 만 무중단** — NOT NULL ADD COLUMN 또는 DROP COLUMN 또는 ALTER TYPE 은 사용자 명시 추가 승인 필요.
- **임시 SQL 파일 즉시 삭제** (CLAUDE.md `scripts/_temp/` 룰).
- **참조 발견**: 매치 코드 v4 Phase 1 (commit 8af51eb)
- **참조횟수**: 0

### [2026-05-04] 알기자 기사 사진 업로드 정책 — 매치당 15장 + 클라이언트 압축 (트래픽 80% 절감)
- **분류**: convention (사진 업로드 한도 / 클라이언트 측 최적화 / 트래픽 절감)
- **발견자**: pm (사용자 우려 "DB 용량 차지 + 일반 커뮤니티 정책 + 자동 축소 방법 검토")
- **위치**: `src/app/api/web/upload/news-photo/route.ts` (서버 한도) + `src/app/(admin)/admin/news/_components/news-photo-manager.tsx` (클라이언트 압축)
- **시장 비교 (5/4 검색)**: Discord 10MB, Reddit 20MB, 네이버 카페 ~10MB/30장, 다음 카페 ~5MB. 모바일 친화 권장 = 5~10MB.
- **mybdr 정책**:
  1. **업로드 한도 = 10MB** (모바일 고화질 jpeg/png/webp/heic/heif 허용, sharp 정규화로 ~500KB 압축)
  2. **매치당 사진 최대 15장** (`MAX_PHOTOS_PER_MATCH = 15`) — UI 가독성 + Storage 무제한 방지. 16장+ 업로드 시 400 reject + 안내
  3. **클라이언트 압축** (`browser-image-compression@2`, ~14KB gzip): 1MB+ 사진만 Web Worker 압축 (maxSizeMB=1.5 / maxWidthOrHeight=2048 / preserveExif=true) → 작은 사진은 원본 그대로
  4. **서버 정규화** (그대로 유지): sharp long-edge 1920 + WebP 80% + EXIF 회전 자동 + isHero 단일 트랜잭션 + display_order auto
- **트래픽 효과**:
  - 모바일 5MB 사진 → 클라이언트 1MB 압축 → 서버 도착 후 sharp 500KB → 사용자 download 500KB
  - 업로드 트래픽: **80% 절감** (5MB → 1MB)
  - 모바일 LTE/5G 데이터 부담 ↓ + 업로드 시간 ↓ + 서버 sharp 부담 ↓ (입력 작아짐)
- **EXIF 보존**: `preserveExif: true` 옵션 — 클라이언트 압축 후에도 DateTimeOriginal/GPS 메타 유지 → 서버 EXIF 자동 매치 추천 (Phase 2) 정상 작동
- **Fallback 안전망**:
  - 클라이언트 압축 실패 (OffscreenCanvas 미지원 브라우저 등) → 원본 그대로 업로드 + console.warn
  - 서버 sharp 정규화는 그대로 동작 → 화질/용량 보장
- **Storage 비용 분석 (5/4 시뮬)**: 평균 8장/매치 × 월 108매치 → 1년 5GB / Pro tier 100GB 의 5% 수준. 8~50년 안전 (적극 시나리오라도 8년+).
- **Egress 차후 큐**: 100K PV/월 도달 시 다층 썸네일 (300px + 1920px) + AVIF + next/image 최적화 (Phase 3)
- **참조횟수**: 0

### [2026-05-04] 알기자 기사 사진 정규화 룰 — long-edge 1920px + WebP 80% + EXIF 회전 자동 + isHero 단일 보장
- **분류**: convention (이미지 처리 / 모바일 업로드 / 저장 효율)
- **발견자**: pm (사진 첨부 시스템 P2 업로드 API 설계 시점)
- **위치**: `src/app/api/web/upload/news-photo/route.ts` + `news-photos` Supabase Storage bucket
- **규칙**: 알기자 기사 사진 업로드 시 sharp pipeline 의무 적용:
  1. **long-edge 1920px**: 비율 유지 리사이즈 (origW >= origH 면 width=1920 / 그 외 height=1920) + `withoutEnlargement: true` (작은 사진은 확대 X)
  2. **WebP 80% quality**: 모든 출력 webp 변환 + quality 80 (모바일 사진 평균 5MB → ~500KB)
  3. **EXIF 회전 자동 적용** (`.rotate()`): 모바일 세로 사진의 EXIF orientation 메타 → 픽셀 회전 적용 (사이드웨이 표시 방지)
  4. **isHero 단일 보장**: 매치당 is_hero=true 1장 — `prisma.$transaction` 으로 신규 isHero=true 시 기존 모두 false 후 INSERT
  5. **display_order 자동 증가**: `max(display_order) + 1`
  6. **Storage path 형식**: `match-{matchId}/{timestamp}-{random}.webp` (매치별 폴더 분리, 충돌 방지 + 매치 삭제 시 cascade 청소 용이)
- **파일 검증**:
  - 허용 MIME: image/jpeg / png / webp / heic / heif (HEIC = iPhone 기본)
  - 최대 크기: 10MB (모바일 고화질 허용, 변환 후 평균 ~500KB)
- **에러 정책**:
  - sharp 정규화 실패 → 500 (원본 그대로 업로드 X — admin 운영자가 인지 후 다른 사진 시도)
  - DB INSERT 실패 시 Storage orphan 정리 (best effort)
- **모바일 카메라 직접 호출**: `<input type="file" accept="image/*" capture="environment">` — 모바일 브라우저에서 즉시 카메라 앱 호출 (갤러리 선택 우회 가능)
- **참조횟수**: 0

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

