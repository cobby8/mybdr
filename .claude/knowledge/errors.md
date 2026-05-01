# 에러 및 함정 모음
<!-- 담당: debugger, tester | 최대 30항목 -->
<!-- 이 프로젝트에서 반복되는 에러 패턴, 함정, 주의사항을 기록 -->

### [2026-05-02] profile PATCH 409 '이미 등록된 정보' — 운영 DB partial unique index 가 prisma schema 누락
- **분류**: error (schema drift / P2002 친화 메시지 누락)
- **발견자**: 사용자 + pm
- **증상**: mybdr.kr/profile/edit 저장 시 "이미 등록된 정보입니다. 입력값을 확인해주세요." 빨간 메시지. nickname 충돌이 아닌 다른 unique 컬럼 충돌인데 친화 메시지 분기 누락.
- **원인**: 운영 DB 의 `users` 테이블에 partial unique index 5종 (`email` / `nickname` partial / `phone` partial / `provider+uid` / `public_id`) 존재. **prisma schema 에는 phone/nickname @unique 누락** (Rails 시절 DB pull 후 schema 미반영 추정). PATCH 시 phone/email 변경 시 P2002 발생 → catch 에서 nickname target 만 친화 메시지 분기 → 다른 target 은 일반 fallback "이미 등록된 정보" 메시지 → 어떤 필드 충돌인지 사용자가 알 수 없음.
- **진단 방법**: 로컬 tsx 스크립트 (`scripts/_temp/diagnose-profile-p2002.ts` — 작업 후 정리됨) 로 (1) `pg_indexes` 직접 쿼리 → unique index 5종 확인 (2) 사용자 (id=2836) 본인 값 update 성공 (3) 다른 user nickname 으로 update 시도 → P2002 (target: nickname) 재현.
- **수정**: `src/app/api/web/profile/route.ts` catch 블록에 phone/email target 분기 추가 + unhandled target 은 console.error + targets.join 메시지로 디버깅 가능:
  ```ts
  if (targets.includes("phone")) return apiError("이미 등록된 전화번호입니다. ...", 409);
  if (targets.includes("email")) return apiError("이미 사용 중인 이메일입니다.", 409);
  console.error("[PATCH /api/web/profile] P2002 unhandled target:", targets);
  return apiError(`이미 등록된 정보입니다. (${targets.join(", ")})`, 409);
  ```
- **회귀 방지**:
  - prisma schema 와 운영 DB unique index 일치 검증 — 추후 큐 (schema 갱신 후 db pull 또는 수동 @unique 추가)
  - 모든 P2002 catch 분기에 unhandled target console.error 필수 (Vercel logs 못 봐도 향후 진단 시 useful)
- **참조**: 본 사례 의 친화 메시지 fix commit / lessons.md "운영 DB 직접 진단 패턴"
- **참조횟수**: 0

### [2026-05-01] profile PATCH 500 'Internal error' — birth_date Invalid Date 미가드
- **분류**: error (API route 파싱 가드 누락 / Vercel 로그 접근 불가 환경 진단 패턴)
- **발견자**: 사용자 + pm
- **증상**: mybdr.kr/profile/edit 에서 저장 시 'Internal error' 메시지. 콘솔 1x 500. 응답 body `{"error":"Internal error"}` 만.
- **원인**: `src/app/api/web/profile/route.ts:119` 의 `new Date(birth_date as string)` 가 잘못된 형식 (빈 문자열 아닌 부분 입력 "2024-13-45" / 사용자 임의 텍스트) 받으면 Invalid Date 객체 생성 → `prisma.user.update()` 가 `PrismaClientValidationError: Provided Date object is invalid. Expected Date.` throw → catch fallthrough → 500.
- **진단 방법**: 로컬에서 `.env` 운영 DB 로 connect 후 prisma.user.update 를 단계별 (필드별) 직접 호출하는 진단 스크립트 (`scripts/_temp/diagnose-profile-save.ts` — 작업 후 정리됨) 로 재현. Test E (`new Date("")` Invalid Date 가설) 만 실패 → 원인 확정. **Vercel 로그 접근 불가 환경에서 효과적인 진단 패턴** (lessons.md 박제).
- **수정 (이중 방어선)**:
  1. 백엔드 (`route.ts:111-122`): birth_date 파싱을 update 호출 전 분리 + `isNaN(d.getTime())` 가드 → 잘못되면 `apiError("생년월일 형식이 올바르지 않습니다.", 400)` 명시 응답
  2. 프론트 (`profile/edit/page.tsx:370-374`): payload 구성 시 동일 isNaN 체크 → 잘못된 입력은 null 로 송출 (UX 보정)
- **회귀 방지 룰 (신설)**:
  - API route 에서 `new Date(externalString)` 패턴 사용 시 **항상 `isNaN(d.getTime())` 가드 필수**. 가드 없으면 prisma 호출 시 PrismaClientValidationError 로 500 fallthrough.
  - 점검 대상 후보 (이번 픽스 범위 밖, 추후 일괄 점검): tournament `startDate` / `endDate` / `registration_start_at` / `registration_end_at`, game `scheduled_at`, 기타 string→Date 변환 지점.
- **부수 발견 (별건)**:
  - 사용자 (id=2836, nickname=수빈) DB 의 `position` 컬럼 값이 `"PG,SG,SF"` — comma-separated multi. 시안 폼은 단일 선택만 보내므로 저장 시 multi 데이터 손실 위험. 별건 추적 필요.
- **참조횟수**: 0

### [2026-05-01] organizations 목록 status 필터에 실재하지 않는 값 'active' 박힘
- **분류**: error (status enum 불일치, 페이지 ↔ 생성 API ↔ 스키마 cross-check 누락)
- **발견자**: pm
- **증상**: `/organizations` 페이지가 항상 빈 목록. 단체 생성해도 노출 안 됨. 내일 동호회최강전 대회 세팅 중 발견 (2026-05-01).
- **원인**: `src/app/(web)/organizations/page.tsx:34` 의 필터가 `where: { is_public: true, status: "active" }`. 하지만 schema/생성 API/admin approve route 등 모든 곳은 `"approved" | "pending" | "rejected"` 사용 (`api/web/organizations/route.ts:45,75` 생성 시 'approved'/'pending', `prisma/schema.prisma:2222`, `series/route.ts:49` 가드도 'approved'). `"active"` 는 organizations 컨텍스트에서 **절대 발생하지 않는 값** (tournament_series 의 status='active' 와 혼동 추정).
- **수정**: 1줄. `status: "active"` → `status: "approved"`. commit `08898cb`.
- **재발 방지 체크리스트**:
  1. **status 필터 추가/수정 시**: schema.prisma default + 생성 API + admin approve/reject route 까지 cross-check (4지점 일관 검증)
  2. **모델별 status 도메인 분리 인지**: `organizations.status` (approved/pending/rejected) ≠ `tournament_series.status` (active 등) ≠ `tournament.status` (draft/published/registration_open/...). 모델별 enum 다름
  3. **회귀 점검 grep**: `prisma\.{모델}.*status.*"{값}"` 멀티라인으로 다른 사용처 동시 점검
  4. (장기) 단체 생성 후 목록 페이지 노출 e2e/스모크 테스트 부재 → 추가 검토 큐
- **관련**: `src/app/(web)/organizations/page.tsx:34` (수정), `src/app/api/web/organizations/route.ts:45,75` (생성 API), `prisma/schema.prisma:2222` (스키마), `src/app/api/web/series/route.ts:49` (다른 'approved' 가드 사용처)
- **참조횟수**: 0

### [2026-05-01] PATCH 후 JWT 재발급 누락 → referee 영역 stale session.name (해소)
- **분류**: error (세션 일관성, 7일 stale)
- **발견자**: pm
- **증상**: 사용자 nickname 변경 후 헤더는 즉시 갱신되지만 (referee)/* 영역에 session.name 직접 사용한 3건이 JWT 만료(7일) 까지 옛 값 유지
- **원인**: PATCH /api/web/profile 가 DB만 update + JWT 재발급 누락 → 발급 시점 nickname 7일 박힘
- **해결**: PATCH catch 위에서 nickname 변경 감지 → generateToken 재발급 + cookieStore.set Set-Cookie
- **재발 방지**: nickname 외 다른 user 정보(이메일/role) 변경 PATCH 라우트도 JWT 재발급 추가 필요 시 동일 패턴
- **참조횟수**: 0

### [2026-04-30] PATCH /api/web/profile P2002 nickname unique 위반 → 'Internal error' 마스킹으로 진단 1시간 지연
- **분류**: error (catch 마스킹 + 사용자 친화 메시지 누락 패턴, 진단 절차 표준화)
- **발견자**: pm
- **증상**: 사용자가 /profile/edit 에서 닉네임을 다른 사용자가 이미 쓰고 있는 값으로 변경 후 저장 → 'Internal error' (500). raw error 미노출 → 진단 1시간 지연.
- **잘못된 가설 (모두 헛수고)**:
  1. Service Worker 캐시 (mybdr 자체 SW 등록 0건이라 무관)
  2. Vercel CDN 캐시 (배포 헤더로 검증 후 기각)
  3. Phase 12 schema 신규 컬럼 (`name_verified` 등) vs 운영 DB 불일치 (a2081ba 픽스 후에도 재현돼서 의심했지만 무관)
  4. weight/district 컬럼 운영 DB 부재 (GET 통과로 기각)
- **진짜 원인**:
  1. PATCH /api/web/profile 의 catch 가 모든 에러를 `apiError("Internal error", 500)` 로 마스킹 → P2002 (Unique constraint failed on the fields: ["nickname"]) 도 동일 응답
  2. 클라/서버 어디에도 닉네임 중복 사전 검증 없음 (길이 검증만 있음)
  3. apiError 가 raw 노출 안 함 → 클라에선 무조건 'Internal error' → 사용자/PM 모두 운영 회귀로 오인
- **진단 패턴 표준화 (앞으로 운영 catch 마스킹 500 추적 절차)**:
  1. 코드 레벨 가능 가설 모두 점검 (schema, route, SW, CDN) — 본 사례에서 1시간 소요
  2. 결정 안 나면 **임시 raw error 노출 패치** 1줄 → 운영 배포 → 사용자 1회 시도 캡처
  3. 패치 형태:
     ```ts
     const code = (e as { code?: string })?.code ?? "NO_CODE";
     const meta = (e as { meta?: unknown })?.meta;
     const metaStr = meta ? ` meta=${JSON.stringify(meta).slice(0, 200)}` : "";
     return apiError(`[DEBUG-PATCH] ${code} :: ${msg.slice(0, 400)}${metaStr}`, 500);
     ```
  4. P-code + meta 확보 후 즉시 닫기 (1분 내 별도 커밋)
- **진짜 해결**: PATCH catch 에 P2002 + target=nickname 케이스 분기 → 409 "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요." 친화 메시지
- **재발 방지 체크리스트**:
  1. **unique 제약이 있는 필드(nickname/email/phone 등)의 PATCH/POST 라우트는 모두 P2002 분기 필수**
  2. **신규 @unique 컬럼 추가 시**: schema @unique → API route catch 분기 추가 → 친화 메시지 정의 → (선택) 클라 사전 검증
  3. catch 에 raw `console.error` 는 유지 (errors.md 04-30 a2081ba 룰), 단 클라 응답에는 친화 메시지만
  4. **운영 회귀 진단 우선순위**: (1) 사용자 입력값 의심 (가장 흔함) → (2) catch 마스킹 의심 → (3) 직전 커밋 회귀 → (4) DB 불일치
- **참조횟수**: 0

### [2026-04-29] "OAuth 후 팀 분리" 사용자 보고 → DB 정상 (재현 불가) — 진단 절차 표준화
- **분류**: error (사용자 보고 vs 실제 데이터 불일치, 진단 패턴)
- **발견자**: debugger
- **증상**: 사용자가 "일반 가입으로 루나틱 팀을 만든 뒤 카카오 OAuth로 다시 로그인하니 팀이 본인 계정과 분리됐다"고 보고.
- **실제 진단 결과 (dev DB, scripts/debug-kakao-link-2026-04-29.ts)**:
  1. 김병곤 user는 단 1명 (id=3007, provider=kakao, uid=4868813440, email=ragonida@naver.com, phone=01033210922) — 일반 가입 user A는 존재하지 않음
  2. 루나틱 팀(id=215) captain_id=3007 으로 정확히 연결
  3. team_members(id=2348, team_id=215, user_id=3007, role=director, status=active) 정상 존재
  4. 같은 phone/email로 다른 user 없음 → 가설 1(중복 user) 배제
  5. user 생성일 2026-04-28, 팀 생성일 2026-04-29 → "OAuth 가입 후 팀 생성" 순서 (사용자 인식과 반대)
- **원인 (확정)**: 사용자가 카카오로 가입한 뒤 팀을 만들었기 때문에 일반 가입 흔적이 애초에 없음. "분리됐다"는 인식은 (a) 다른 디바이스/브라우저에서 비로그인 상태였거나 (b) profile 페이지 캐시 문제, (c) 다른 계정으로 잘못 로그인한 가능성. **코드/DB 결함 아님.**
- **OAuth 매칭 로직 검증**:
  - 활성 핸들러는 `src/app/api/auth/callback/kakao/route.ts` → `src/lib/auth/oauth.ts#handleOAuthLogin` (다른 경로 `api/auth/kakao/callback`은 logout 복귀용)
  - handleOAuthLogin: ① provider+uid로 검색 → ② email로 기존 계정 찾으면 provider/uid 업데이트(연결) → ③ 신규 생성 — **3단계 매칭 정상**
  - JWT sub = user.id.toString(), withWebAuth가 BigInt(session.sub)로 복원 → 세션 id 불일치 가능성 0
- **재발 방지 / 진단 절차 표준화**:
  1. "OAuth 후 X가 사라졌다" 류 보고는 **DB 직접 조회를 1순위로**: 같은 이름/email/phone의 user row 개수, owner_id 일치 여부, 생성 timestamp 순서.
  2. 1명만 나오면 코드 결함 아님 → 사용자에게 ① 어느 디바이스/브라우저, ② 로그인된 계정의 email/닉네임, ③ /profile 직접 접속 시 보이는 팀 카드 스크린샷 요청.
  3. provider+uid 또는 email 매칭이 **두 번째**로 의심 — 매칭 실패 시 user row 2개가 만들어지므로 ①에서 잡힘.
  4. 진단 스크립트 보존: `scripts/debug-kakao-link-2026-04-29.ts` (User + Team(captain/manager) + TeamMember + phone/email 중복 검사 4섹션 1회 실행)
- **참조횟수**: 0

### [2026-04-29] schema 변경 + db push + prisma generate 후 dev 서버 미재시작 → `Invalid \`tx.team.create()\` invocation` (Unknown argument)
- **분류**: error (워크플로우 함정)
- **발견자**: debugger
- **증상**: `/teams/new` 등 신규 필드를 쓰는 server action 실행 시 `Invalid \`tx.team.create()\` invocation in C:\…\.next\dev\server\chunks\ssr\…` 에러. 코드/schema/DB 모두 정상이고 직접 tsx로 같은 페이로드를 호출하면 성공.
- **원인**: `prisma db push` + `prisma generate` 로 신규 필드(`home_color`, `away_color`)가 schema/DB/`node_modules/.prisma/client` 에는 반영됐지만, 이미 가동 중인 **Next.js dev 서버가 옛 PrismaClient 모듈을 메모리에 캐싱** 중이라 신규 필드를 모름 → `Unknown argument` 런타임 에러.
- **해결**: dev 서버 재시작.
  1. `netstat -ano | findstr :3001` → PID 확인
  2. `taskkill //f //pid <PID>` (절대 `taskkill //f //im node.exe` 금지)
  3. `npm run dev` 재기동
- **재발 방지**:
  - schema.prisma 변경 후 체크리스트: ① `prisma db push` ② `prisma generate` ③ **dev 서버 재시작** (3단계 모두 필수)
  - actions/teams.ts 같이 `e.message.slice(0, 100)`로 잘라 보여주는 catch는 디버깅을 어렵게 만듦. 적어도 `console.error`로 풀 메시지를 남기는 패턴은 유지 (현재 라인 102 `console.error("[createTeamAction]", e)` OK).
- **검증 방법**: `node_modules/.prisma/client/index.d.ts` 의 mtime 과 dev 서버 프로세스 StartTime 비교 → 후자가 더 빠르면 무조건 재시작 필요.
- **참조횟수**: 0

### [2026-04-29] 모바일 가로 overflow — 인라인 gridTemplateColumns 모바일 미대응 안티패턴 (Phase 9-Mobile)
- **분류**: error (UI, **재발 8건+** Phase 9-Mobile Refinement 1라운드)
- **발견자**: pm + 사용자 (366px 강제 검증)
- **증상**: 366px viewport에서 페이지 우측이 잘리거나 가로 스크롤바 발생. 데스크톱(≥1024px)에선 정상, 모바일에서만 깨짐. v2 컴포넌트 8건+에서 동일 패턴 발견 (DivisionGrid / RankingTable / TeamCard / EventCalendar / GameSchedule 등).
- **원인**: 인라인 스타일에 `gridTemplateColumns: "repeat(N, 1fr)"` 또는 `"repeat(N, minmax(150px, 1fr))"`을 모바일 분기 없이 적용. (1) N이 3 이상이면 366px 안에서 1fr이 0보다 작아져 자식이 부모 폭 침범, (2) `minmax(150px, ...)` 값이 컨테이너 폭을 합쳐 넘김, (3) Tailwind sm:/md: 분기로 했어야 할 곳을 인라인 style로 처리.
- **해결**:
  1. 인라인 `gridTemplateColumns: "repeat(N, 1fr)"` → Tailwind `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-N` (mobile-first 분기)
  2. 자식 1fr 컬럼에 `minWidth: 0` 가드 추가 (text overflow 차단)
  3. globals.css `@media (max-width: 720px)` 글로벌 룰: `html, body { overflow-x: hidden; }`
- **재발 방지**:
  1. **컨벤션 문서화** (conventions.md "모바일 최적화 체크리스트 10항목" 2026-04-29 추가) — grid 인라인 repeat 금지 1순위
  2. PR 리뷰 시 `gridTemplateColumns: "repeat(` 검색으로 1차 차단
  3. 신규 컴포넌트는 366px 강제 검증을 빌드 체크리스트에 포함
- **참조**: conventions.md "모바일 최적화 체크리스트" / lessons.md "Phase 9-Mobile 안티패턴 재발"
- **참조횟수**: 0

### [2026-04-29] Avatar 영문 텍스트 박스 밖 overflow (clamp + overflow:hidden 누락)
- **분류**: error (UI)
- **발견자**: pm + 사용자
- **증상**: 모바일에서 Avatar 컴포넌트가 박스 모양은 유지되나 내부 영문/이니셜 텍스트가 박스 경계를 넘어 튀어나옴. 한글은 정상, 영문 닉네임 시 발생.
- **원인**: (1) Avatar에 `font-size`만 px 고정 → 컨테이너가 작을 때 글자가 박스보다 큼. (2) `overflow: hidden` 누락 → 부모 박스가 자식 텍스트를 잘라주지 못함. (3) 영문 한 글자가 한글보다 폭이 넓어 같은 px에서도 한글은 안 튀어나오나 영문은 튀어나옴.
- **해결**: Avatar 컴포넌트에 (a) `font-size: clamp(10px, 4vw, 16px)` (b) `overflow: hidden` (c) `display: flex; align-items: center; justify-content: center` 3종 동시 적용.
- **재발 방지**:
  1. 텍스트가 들어가는 작은 박스(Avatar/Badge/Tag)는 **clamp font-size + overflow:hidden 쌍**을 default로
  2. 한글로만 테스트하지 말 것 — 영문/숫자 닉네임 케이스 추가 (DilDeRabbits / 5pointGuards 같은 폭 넓은 영문)
- **참조**: conventions.md "모바일 최적화 체크리스트" 8번 항목
- **참조횟수**: 0

### [2026-04-20] 다음카페 상세 HTML에 시간 소스가 `.num_subject` 단 하나 (함정)
- **분류**: error (외부 시스템 함정, 재발 위험: 파서 확장 시)
- **발견자**: pm + Explore (실측 tmp/cafe-debug-article-IVHA-{3919,3920,3923,3924,3925}.html 5건)
- **증상**: `extractPostedAt()`가 5/5 글 모두 `null` 반환. sync-cafe dry-run 출력에 `postedAt: null` 반복. `r.postedAt ?? it.postedAt` fallback으로 목록값이 덮어 실피해는 없으나 코드 위생 악화.
- **원인**: 상세 페이지 HTML에 파서가 찾던 모든 소스(`articleElapsedTime` JS 변수, `regDttm`/`createdAt` JS 변수, `<script type="application/ld+json">` datePublished)가 **전부 존재하지 않음**. 유일한 시간 소스는 `<span class="num_subject">...</span>` DOM 요소.
- **해결**: `extractPostedAt()` 4번째 fallback으로 `$("span.num_subject").first().text()` 추가. `parseCafeDate`가 이미 `"HH:MM"`/`"YY.MM.DD"` 두 형식 지원 (article-fetcher.ts `c84aba0`).
- **예방**:
  - 다음카페 상세 파서를 수정하거나 추가 필드(수정일/좋아요수/조회수 등)를 뽑을 때 **HTML 덤프 실측 필수** (`--debug` 플래그)
  - `articleElapsedTime`/`regDttm`/`JSON-LD`는 **목록 페이지에만 존재**하고 상세에는 없음 (목록 ≠ 상세 구조)
  - 당일 글 vs 과거 글 샘플 둘 다 수집해 비교

### [2026-04-17] API 미들웨어(apiSuccess의 convertKeysToSnakeCase) 놓치고 컴포넌트 인터페이스 거꾸로 변환
- **분류**: error (**재발 7회**, 2026-04-29 organizations/apply에서 또 발견 — `data.data?.status`/`data.data?.slug` 접근 → "단체 신청 사일런트 실패 + /organizations/undefined 리다이렉트")
- **발견자**: pm + 사용자 + tester + reviewer
- **증상**: `/games` 카드의 시각/장소/가격이 안 뜸. 진단 시 "API 응답이 camelCase인데 컴포넌트가 snake_case 기대"로 잘못 판단해 컴포넌트를 camelCase로 통일 → 모든 필드 undefined로 폴백. **2026-04-19 M1 Day 7**: `/profile`의 `followersCount/followingCount/nextGame` 3필드가 페이지에서 camelCase로 접근 → 팔로워/팔로잉 항상 0, 다음 경기 항상 "없음"으로 표시 (사일런트 버그). **2026-04-20 M6**: ① `src/app/(web)/layout.tsx`에서 헤더 알림 뱃지가 `data.unreadCount`로 접근 → **헤더 뱃지 자체가 무용지물**(항상 0)이었음. M6 작업 중 발견·수정. ② `src/components/shared/header.tsx` L61/L72 동일 패턴 (dead code, 정리 권장). ③ **[해소됨 2026-04-20]** `src/app/(referee)/referee/_components/notification-bell.tsx` L86 + `referee/notifications/page.tsx` L90 — `json?.data` 접근(apiSuccess는 `{data:...}` 래핑 X)을 `json` 직접 접근으로 교체 + 주석 가드 추가. referee 벨 뱃지/드롭다운/전체 알림 페이지 모두 정상화.
- **원인**: `src/lib/api/response.ts:5` `apiSuccess(data) → NextResponse.json(convertKeysToSnakeCase(data))`. route.ts에서 camelCase로 직렬화하는 것처럼 보여도 미들웨어가 다시 snake_case로 변환. **route.ts 코드만 보고 응답 형태 추정 금지.**
- **해결**:
  1. `curl` 또는 DevTools Network 탭으로 raw 응답 확인 → 컴포넌트 인터페이스를 응답 형태에 맞게 정합 (snake_case 유지)
  2. 프로젝트 컨벤션: API 응답 = snake_case (Flutter 호환), TS 내부 = camelCase
- **재발 방지**:
  1. **API 응답 인터페이스 변경 전 반드시 `curl` 1회** — 코드 추정 금지
  2. **신규 필드 추가 시 프론트는 반드시 snake_case로 받기** — 서버가 camelCase 반환해도 apiSuccess가 변환함
  3. 같은 종류 버그 5회 재발 — fetcher 래퍼로 일괄 역변환(`convertKeysToCamelCase`) 적용 검토 시급
- **참조**: lessons.md "API 미들웨어 변환을 잊고 컴포넌트 인터페이스를 거꾸로 바꿈"
- **참조횟수**: 1
- **승격됨**: CLAUDE.md 2026-04-19 (5회 재발로 핵심 가드 승격)

### [2026-04-17] Next.js 16 next/image 외부 호스트 미허용 (카카오 CDN 2종 누락)
- **분류**: error
- **발견자**: debugger
- **증상**: `Invalid src prop (http://img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg) on next/image, hostname "img1.kakaocdn.net" is not configured under images in your next.config.js` — userId 2862 카카오 가입자 프로필 렌더링 중 발생
- **원인**: `next.config.ts`의 `images.remotePatterns`에 `k.kakaocdn.net`, `p.kakaocdn.net`만 있고 **썸네일 프록시(`img1.kakaocdn.net`)**와 **기본 프로필 원본(`t1.kakaocdn.net`)**이 빠져 있었음. 카카오 OAuth 기본 프로필은 `img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg` 구조로, 실제로 2개 호스트를 동시에 타므로 둘 다 허용 필요. 추가로 에러 URL이 http였음 — OAuth 제공자가 http/https 섞어 내려주는 경우 있음.
- **해결**: `remotePatterns`에 4개 엔트리 추가 — `img1.kakaocdn.net`(http/https × pathname=/thumb/**) + `t1.kakaocdn.net`(http/https × pathname=/account_images/**). `pathname` 제한으로 임의 경로 오남용 차단.
- **재발 방지**:
  1. OAuth 제공자(카카오/네이버/구글) 추가 시 **CDN 도메인 패턴을 함께 등록** — 로그인 CDN만이 아니라 프로필 썸네일 프록시까지
  2. `remotePatterns`는 가능하면 `pathname: "/특정경로/**"`로 범위 제한 (보안 + 오남용 방지)
  3. `next.config.ts` 수정 후 dev 서버 **재시작 필수** (HMR 미반영)
- **참조**: conventions.md "next/image 외부 호스트 등록 패턴"(승격 후보)
- **참조횟수**: 0

### [2026-04-16] sticky 셀 가로 스크롤 겹침 — 배경 투명 + z-index 누락 이중 원인
- **분류**: error (UI)
- **발견자**: pm
- **증상**: 박스스코어 모바일 가로 스크롤 시 sticky 번호/이름 컬럼 뒤로 다른 스탯 숫자가 비쳐 겹쳐 보임
- **원인 2개 동시 발생**:
  1. `<tr>` 배경이 `transparent` → sticky 셀 `bg-inherit`도 투명 → 뒤 콘텐츠 비침
  2. sticky 셀에 `z-index` 없음(기본 auto) → 스크롤되는 셀이 앞 레이어에 그려짐
- **해결**: (a) 모든 tr 배경 불투명화(`var(--color-card)` + `color-mix`로 zebra), (b) sticky 셀에 `z-10` 명시
- **재발 방지**: sticky 셀 규칙 — **불투명 배경 + 명시적 z-index** 쌍은 항상 같이
- **참조**: conventions.md "sticky 셀 규칙"
- **참조횟수**: 0

### [2026-04-16] Chrome @page CSS를 가상 프린터(Hancom PDF)가 무시
- **분류**: error (platform limit)
- **발견자**: pm (사용자 제보)
- **증상**: `@page { size: A4 landscape }` 지정해도 **Hancom PDF 프린터**로 저장하면 세로 방향 PDF 생성
- **원인**: Chrome "PDF로 저장"은 @page를 존중하지만, Hancom PDF 같은 Windows 가상 프린터는 OS 드라이버를 경유해 @page를 무시하고 드라이버 기본값 사용
- **해결**: 웹에서 강제 불가 (브라우저/OS 레벨). 사용자에게 "프린터를 Chrome 'PDF로 저장'으로 변경" 안내 배너 + "인쇄 방향: 가로" 수동 선택 가이드
- **잘못된 시도**: `html, body { width: 297mm !important }` 강제 → Chrome PDF 메타데이터 더 깨짐 (롤백)
- **재발 방지**: 프린트 기능 추가 시 **표준 @page 키워드**(A4 landscape)만 쓰고 불가능한 OS 제어는 UI 안내로 대체
- **참조**: lessons.md "브라우저 프린트 API 한계"
- **참조횟수**: 0

### [2026-04-16] 프린트 `<th>` center vs `<td>` left 기본값 불일치 — 정렬 깨짐
- **분류**: error (UI)
- **발견자**: pm (사용자 제보)
- **증상**: 프린트된 박스스코어에서 헤더와 데이터 행의 숫자 컬럼이 살짝 어긋남
- **원인**: HTML 기본 정렬이 `<th>` center, `<td>` left. 숫자 컬럼(MIN/PTS/FG)이 서로 다른 축으로 정렬됨. 추가로 `td:nth-child(2) { max-width }`만 적용하고 `th`엔 미적용이라 이름 폭 차이로 뒤 컬럼 밀림
- **해결**: 프린트 영역 th/td 모두 `text-align: center` + `table-layout: fixed` + `th:nth-child(n)`와 `td:nth-child(n)` 폭 둘 다 제어
- **재발 방지**: 프린트 테이블은 **table-layout: fixed + 명시적 정렬/폭** 쌍으로
- **참조횟수**: 0

### [2026-04-15] 신규 파일 git add 누락 → 로컬은 OK인데 원격 Vercel 빌드 실패
- **분류**: error
- **발견자**: pm (원영 핫픽스 `d94beb6`로 문제 파악)
- **증상**: Phase 2B 커밋(c53fb71)에서 `@/lib/validation/team` import는 했지만 **실제 파일은 로컬에만 있고 원격엔 없음**. 로컬 tsc/dev 서버 모두 정상 → 커밋/푸시/dev 머지까지 문제 없어 보임 → Vercel 빌드에서 `Module not found: Can't resolve '@/lib/validation/team'`로 실패.
- **원인**: `git status`에 `??` (Untracked)로 표시된 신규 파일을 add하지 않고 커밋함. `git add -A`/`git add .`를 안 쓰고 특정 파일만 add하는 워크플로의 단점.
- **해결**: 원영님이 dev/main에 응급으로 `validation/team.ts` 최소 버전 직접 추가 (d94beb6, 9d64342). 이후 수빈이 Phase 2C에서 완전판으로 확장.
- **재발 방지**:
  1. 커밋 전 `git status --short` 실행 → `??` 표시된 신규 파일이 커밋 대상에 포함되는지 **매번** 확인
  2. 신규 파일이 import되는 시점(같은 커밋)에 함께 add
  3. Vercel preview 빌드가 꺼져있는 개인 브랜치(subin)는 머지 전까지 문제가 숨겨질 수 있음 — dev 머지 후 즉시 Vercel dev preview 체크
- **참조**: lessons.md "신규 파일 add 누락 방지"
- **참조횟수**: 0

### [2026-04-15] 🚨 prisma db push --accept-data-loss로 타 브랜치 테이블 drop 사고 (최우선)
- **분류**: error (중대한 운영 사고 위험)
- **발견자**: pm
- **증상**: Team 모델에 컬럼 추가 목적으로 `npx prisma db push --accept-data-loss` 실행. 그런데 schema.prisma에 정의 안 된 테이블 4개가 drop됨 — associations(20rows), association_admins(1row), referees(1row), referee_documents(1row). subin-referee 브랜치에서 작업 중이던 Referee 시스템 테이블이 전부 사라짐.
- **원인**: `db push`는 "schema ↔ DB 완전 동기화" 명령. 현재 브랜치 schema에 없는 테이블은 "불필요한 잔재"로 판단해 삭제 시도. `--accept-data-loss` 플래그가 이를 허용. 브랜치마다 schema가 다르게 진화 중인 상황에서 위험.
- **해결**: subin-referee 브랜치의 schema.prisma에서 Referee 시스템 14개 모델을 현재 schema에 통합 복사 → 재 `db push`로 테이블 구조 복원. 데이터는 손실 (개발 DB라 허용, 운영 DB였으면 대참사).
- **재발 방지**:
  1. 브랜치별로 독립 schema 작업 중일 때는 `db push --accept-data-loss` **절대 금지**
  2. 대신 `prisma migrate dev --create-only`로 마이그레이션 파일만 생성 후 수동 검토
  3. schema 차이가 큰 경우 `db pull`로 현재 DB 상태를 schema에 먼저 가져온 뒤 수정
  4. 운영 DB에는 절대 db push 실행 금지 (CLAUDE.md 최상단 규칙 재확인)
- **참조횟수**: 0

### [2026-04-12] Turbopack dev: "Jest worker encountered N child process exceptions"
- **분류**: error
- **발견자**: pm (사용자 제보)
- **증상**: 로컬 `npm run dev`(Next.js 16.1.6 Turbopack) 중 `Jest worker encountered 2 child process exceptions, exceeding retry limit` 런타임 에러. Vercel 배포/운영(mybdr.kr)에선 정상, 로컬에서만 발생.
- **원인**: Turbopack dev 서버는 HMR을 위해 Worker Pool을 메모리에 유지하는데, 짧은 시간에 여러 파일이 연속 수정되면 워커가 recompile을 겹쳐 받아 상태가 꼬이고 child process가 예외를 2회 이상 던지면 retry 한도를 넘어 에러. 코드 문법 이슈 아님 (빌드/운영은 멀쩡).
- **해결**: (1) 포트 기반 dev 서버 재시작 — `netstat -ano | findstr :3001` → 해당 PID만 `taskkill //f //pid <PID>` → `npm run dev`. (2) 안 되면 `.next` 삭제 후 재시작. **절대 `taskkill //f //im node.exe` 쓰지 말 것** (다른 프로젝트 dev 서버/Claude Code까지 죽음).
- **재발 방지**: 대량 파일 수정 시 중간에 dev 서버 한 번 재시작. 같은 PC에서 dev 서버 여러 개(worktree별) 동시 실행 시 메모리 압박 큼 — 하나씩만 돌리기. **신규 라우트/시드 추가 직후 첫 접근 전에도 재시작 권장**.
- **참조횟수**: 2 (2026-04-21 L3 재발 — 신규 라우트 `/organizations/[slug]/series/[seriesSlug]` + BDR 시리즈 시드 직후 첫 접근 시 동일 500. `.next` 삭제 + PID 재시작으로 200 / 0.28s 복구) (2026-05-01 재발 — 동호회최강전 데이터 대량 INSERT + Phase A 신규 2 파일 추가 + 다른 에이전트 Settings 박제 동시 변경 후 발생. PID 35872 단일 kill 로 해결)

### [2026-04-12] Prisma schema drift — users.gender 컬럼 누락 (db push 시 파괴적 DROP 예고)
- **분류**: error / trap
- **발견자**: developer (Commit 1 dry-run 중)
- **내용**: `prisma/schema.prisma`의 User 모델에 `gender` 필드가 없는데, 실제 DB(`users` 테이블)에는 `gender character varying nullable` 컬럼이 존재하는 drift 상태. 이 상태에서 `prisma db push`를 실행하면 Prisma가 "schema가 진리"라고 판단해 `ALTER TABLE "users" DROP COLUMN "gender"`를 자동 생성 → 운영/개발 DB에서 컬럼과 데이터가 파괴됨.
- **원인 추정**: Rails → Next.js 마이그레이션 당시 `prisma db pull`이 누락했거나 이후 수동 삭제된 필드. schema는 쓰지 않지만 DB에는 legacy 컬럼이 남아 있음.
- **해결 방법 (이번 적용)**:
  1. 신규 모델 추가 후 **반드시 `prisma migrate diff --from-schema-datasource ... --to-schema-datamodel ... --script`로 전체 SQL 미리보기**
  2. 기존 테이블에 대한 `ALTER TABLE`/`DROP`이 발견되면 **즉시 중단**
  3. `information_schema.columns`에서 해당 컬럼의 정확한 타입/nullable/default 조회
  4. Prisma 타입으로 역매핑하여 schema에 해당 필드 1줄 복원 (예: `gender String? @db.VarChar`)
  5. 재 dry-run으로 기존 테이블 변경 0건 확인 후 push
- **예방**: 신규 테이블만 추가하는 작업에서도 **항상 dry-run 전체를 눈으로 검토**. `CREATE TABLE`만 있을 것이라는 가정 금지. 브랜치 격리 DB 전략 하에서는 특히 중요 (다른 worktree/원본과 DB 공유).
- **참조**: decisions.md "심판 v2 최종확정 - TournamentMatch 단독 FK" 직전 항목들
- **참조횟수**: 0

### [2026-03-23] YouTube Search API order=viewCount 정렬 부정확
- **분류**: error
- **발견자**: pm (디버깅 과정에서)
- **내용**: YouTube Search API에 `order=viewCount`를 지정해도 실제 조회수 순서와 다른 결과를 반환함. 실제 10,092뷰 영상이 1,518뷰 영상보다 낮은 순위로 나옴.
- **해결**: Search API 대신 playlistItems API로 최대 150개(3페이지)를 가져와서 Videos API로 실제 조회수를 조회한 뒤 서버에서 정렬.
- **쿼터 비교**: Search API 200쿼터/호출 vs playlistItems+Videos 6쿼터/호출
- **참조**: decisions.md "YouTube 인기 영상" / lessons.md "YouTube API"
- **참조횟수**: 1

### [2026-03-23] 라이트모드 CSS 변수 미적용 (html.light 클래스 누락)
- **분류**: error
- **발견자**: developer
- **내용**: globals.css에 `html.light { }` 블록으로 라이트모드 변수를 정의했는데, ThemeToggle 컴포넌트가 `dark` 클래스만 제거하고 `light` 클래스를 추가하지 않아서 라이트모드 변수가 적용되지 않았음. 또한 layout.tsx/slide-menu.tsx에 하드코딩된 다크 색상(#131313, #111111 등)이 30곳 이상 있어서 테마 전환 시 색상이 안 바뀌는 문제도 있었음.
- **해결**: (1) ThemeToggle에서 dark/light 클래스 동시 토글. (2) layout.tsx, slide-menu.tsx의 하드코딩 색상을 CSS 변수로 교체.
- **예방**: 새 컴포넌트 작성 시 하드코딩 색상 대신 반드시 CSS 변수(var(--color-*)) 사용.
- **참조**: lessons.md "라이트/다크 테마 전환"
- **참조횟수**: 1

### [2026-03-23] admin 페이지 레이아웃 이중 적용 (로드 안 됨)
- **분류**: error
- **발견자**: debugger
- **내용**: admin이 `(web)` 라우트 그룹 안에 있어서 `(web)/layout.tsx` 사이드바+헤더+하단네비가 admin에도 적용됨. admin/layout.tsx의 AdminSidebar와 겹쳐서 콘텐츠가 밀리고 로드 안 되는 것처럼 보임.
- **해결**: `src/app/(web)/admin/` → `src/app/(admin)/admin/`으로 라우트 그룹 분리.
- **예방**: 독립 레이아웃이 필요한 섹션(admin, auth 등)은 별도 라우트 그룹으로 분리.
- **참조횟수**: 0

### [2026-03-25] apiSuccess 응답에 .data로 접근하는 버그 (존재하지 않는 래핑)
- **분류**: error
- **발견자**: debugger
- **내용**: `apiSuccess()`는 전달받은 객체를 snake_case 변환 후 **직접** JSON 응답으로 반환한다. `{ data: ... }` 래핑이 없다. 그런데 클라이언트에서 `response.value.data.teams` 같이 `.data`를 한 단계 더 거쳐 접근하면 항상 `undefined`가 되어 fallback만 표시된다.
- **해결**: `.value.data.X` -> `.value.X`로 수정. 또한 apiSuccess가 snake_case 변환을 하므로 camelCase 키(`careerAverages`)가 아닌 snake_case 키(`career_averages`)로 접근해야 한다.
- **예방**: API 응답 접근 시 항상 (1) apiSuccess에 data 래핑이 없음을 기억하고, (2) 응답 키가 snake_case로 자동 변환됨을 고려할 것.
- **영향 파일**: right-sidebar-guest.tsx, right-sidebar-logged-in.tsx (총 6곳), tournament-tabs.tsx (4개 탭 전부)
- **재발 (2026-04-13)**: tournament-tabs.tsx에서 동일 패턴 재발. fetcher에 convertKeysToCamelCase() 적용하여 snake_case→camelCase 자동 변환으로 해결.
- **참조횟수**: 1

### [2026-03-28] categories JSON이 boolean/array 혼용 — Array.isArray 체크 필수
- **분류**: error
- **발견자**: debugger
- **내용**: 디비전 마이그레이션 후 Tournament.categories가 `{"general": true}` (boolean) 형태로 저장됨. 기존 코드는 `{"general": ["D6","D7"]}` (array) 형태를 기대하고 `.map()`/`.join()` 호출 → `true.map is not a function` 에러.
- **해결**: `Array.isArray(divs)` 체크 후 분기. boolean이면 카테고리명으로 대체.
- **예방**: JSON 필드 접근 시 항상 타입 체크. 마이그레이션으로 형식이 바뀔 수 있음.
- **영향 파일**: tournaments/[id]/page.tsx, tournament-about.tsx
- **참조횟수**: 0

### [2026-04-02] 커뮤니티 맞춤 필터 미적용 — setLoggedIn 이중 호출 경쟁 조건
- **분류**: error
- **발견자**: debugger
- **내용**: `header.tsx`와 `layout.tsx`가 각각 독립적으로 `/api/web/me`를 fetch한 후 `setLoggedIn`을 호출함. `layout.tsx`는 `setLoggedIn(true, preferEnabled)`로 올바르게 호출하지만, `header.tsx`는 `setLoggedIn(true)`로 preferEnabled 없이 호출. preferEnabled가 undefined이면 `preferDefault = false`로 설정되므로, header.tsx 호출이 나중에 실행되면 맞춤 필터가 꺼짐. 결과적으로 커뮤니티 API에 `prefer=true`가 전달되지 않아 모든 게시판이 표시됨.
- **해결**: header.tsx의 `setLoggedIn(!!userData)` 호출 제거 (layout.tsx에서 이미 처리) 또는 preferEnabled 전달 추가.
- **예방**: 전역 상태를 설정하는 함수는 **한 곳에서만** 호출할 것. 여러 컴포넌트가 동일 상태를 독립적으로 초기화하면 경쟁 조건(race condition) 발생.
- **영향 파일**: header.tsx (60행), layout.tsx (372행), prefer-filter-context.tsx
- **참조횟수**: 0

### [2026-03-29] SWR GET 응답과 POST 409 응답의 정보 불일치로 UI 분기 누락
- **분류**: error
- **발견자**: debugger
- **내용**: 코트 체크인 UI에서 조건 분기가 3단계로 나뉘어 있었음. (1) isCheckedInElsewhere (SWR GET) → 메시지만, 버튼 없음. (2) checkedInCourtId (POST 409) → 버튼 있음. 페이지 진입 시 GET만 호출되므로 (1)에 걸려서 "체크인 중인 농구장 보기"와 "체크아웃" 버튼이 표시되지 않았음.
- **해결**: GET API에서 다른 코트 체크인 시 court_name도 반환하도록 수정. UI에서 SWR 데이터 변경 시 useEffect로 checkedInCourtId/Name state를 설정하여 버튼이 있는 분기로 통합.
- **예방**: API 응답 설계 시 GET과 POST 에러 응답의 정보를 일관되게 유지할 것. UI 조건 분기에서 같은 상태를 다른 경로로 도달할 수 있는지 확인할 것.
- **영향 파일**: api/web/courts/[id]/checkin/route.ts, court-checkin.tsx
- **참조횟수**: 0

### [2026-04-02] Next.js 개발서버 무한 로딩 (hung 상태, 메모리 1.67GB)
- **분류**: error
- **발견자**: debugger
- **내용**: 개발서버(PID 106908)가 메모리 1.67GB를 사용하며 모든 HTTP 요청에 응답하지 않는 hung 상태. 커뮤니티뿐 아니라 홈(/), 로그인(/login), API(/api/web/me) 등 모든 엔드포인트가 타임아웃. curl --max-time 5로 테스트 시 HTTP 응답 코드 000 (연결은 되지만 응답 없음). 코드 자체에는 tsc 에러 없고, DB 쿼리(Prisma)도 별도 프로세스에서는 정상 동작. hidden_menus 컬럼도 DB에 이미 존재 확인됨. 개발서버 프로세스 자체가 과부하로 멈춘 상태.
- **해결**: 개발서버 재시작 필요. (1) `netstat -ano | findstr :3001`로 PID 확인 (2) `taskkill //f //pid <PID>`로 해당 프로세스만 종료 (3) `npm run dev`로 재시작. 주의: `taskkill //f //im node.exe`는 다른 node 프로세스도 죽이므로 절대 사용 금지.
- **예방**: 개발서버가 장시간 실행되며 메모리 누수/과부하가 쌓일 수 있음. 응답이 멈추면 코드 에러 의심 전에 먼저 개발서버 메모리와 프로세스 상태를 확인할 것. Turbopack 대신 webpack 모드 사용 검토.
- **참조횟수**: 0
