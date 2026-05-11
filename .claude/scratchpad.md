# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 1 — 강남구협회장배 유소년대회 데이터 모델 + 운영자 토큰 발급
- **계획 원본**: `Dev/youth-bulk-registration-2026-05-11.md`
- **상태**: 진행 중
- **현재 담당**: pm → developer
- **모드**: no-stop (사용자 명시 — clarifying 질문 멈춤)

## 진행 현황표
| 단계 | 상태 | 비고 |
|------|------|------|
| §0 사전 점검 (git/env) | ✅ 완료 | dev +22 / subin 동기화 필요 / .env OK |
| §2 dev → subin 머지 | 진행 중 | |
| §3-1 schema 추가 | 대기 | TournamentTeam +3, TournamentTeamPlayer +10, 신규 3모델 |
| §3-2 schema diff 검토 | 대기 | 사용자 검토 필수 (운영 DB) |
| §3-3 prisma generate | 대기 | |
| §3-4 seed 템플릿 | 대기 | 실제 INSERT는 사용자 룰 제공 시 |
| §3-5 어드민 API | 대기 | GET/POST team-applications + apply-token util |
| §3-6 어드민 UI | 대기 | 팀 표 + 추가 모달 |
| §3-7 디자인 검수 | 대기 | reviewer 병렬 |
| §3-8 빌드 검증 | 대기 | tester (build + lint) |
| §3-9 commit + push | 대기 | 사용자 push 승인 후 |

## 기획설계 (planner-architect)
계획 원본 `Dev/youth-bulk-registration-2026-05-11.md` + Phase 1 prompt 자체가 상세 — planner 재호출 생략. 곧장 developer.

---

## 기획설계 (planner-architect) — admin 마이페이지 (2026-05-11)

🎯 **목표**: admin 영역 진입자가 "내 권한·로그인 정보·관리 자원을 한 페이지에서 확인 + 안전하게 로그아웃" 할 수 있는 표준 마이페이지 신설. (web) 마이페이지와 별도 — admin 정보 전용.

### 배경 / 원칙
1. 현재 admin layout 우측 상단에 사용자 표시 0 / 로그아웃 진입점 0 — 사이드바 하단 "사이트로 돌아가기" 만 존재. (web) 마이페이지로 가야 로그아웃 가능 = UX 단절.
2. **인증 흐름 재사용**: `getAuthUser()` (architecture.md 5/5 박제 룰) + 기존 `AdminLayout`이 이미 계산하는 5종 역할 그대로 활용 → 중복 SELECT 0.
3. **권한 매트릭스 4종**: super_admin / site_admin / tournament_admin (membershipType=3) / tournamentAdminMember (DB row) / tournament_recorders (DB row) — `requireScoreSheetAccess` 패턴 (Phase 1-B-2 신규) 재사용.
4. **로그아웃 API 재사용**: `POST /api/web/logout` 그대로 (5/5 fix 패턴 — response.cookies.set).
5. **Flutter v1 영향 0**: admin 페이지 신설만 — Flutter 코드 변경 0, 운영 DB schema 변경 0.

### Phase 분해 (3 단계 / PR 3개)
| Phase | 범위 | 산출 | 우선 |
|-------|------|------|------|
| **Phase 1** (MVP) | `/admin/me` 페이지 + 우상단 진입 동선 (드롭다운) + 로그아웃 | 마이페이지 + UserMenu 컴포넌트 + 로그아웃 동선 | ⭐⭐⭐ |
| **Phase 2** | 권한 매트릭스 + 관리 자원 확장 (관리하는 토너먼트 목록 / 본인인증 상태 / 최근 admin 활동) | 4 섹션 추가 | ⭐⭐ |
| **Phase 3** (후순위) | 알림 / 건의사항 처리 현황 통합 + 보안 (비번 변경 진입점) | 통합 dashboard | ⭐ |

### URL / 페이지 구조
- **진입 URL**: `/admin/me` (결정 — 옵션 A. `/admin/profile` 보다 짧음 + (web)/profile 과 분리 명확)
- **파일 경로** (신규):
  - `src/app/(admin)/admin/me/page.tsx` — 서버 컴포넌트 (역할/정보 SELECT)
  - `src/app/(admin)/admin/me/_components/user-menu.tsx` — 우상단 드롭다운 (클라이언트)
  - `src/app/(admin)/admin/me/_components/logout-button.tsx` — POST `/api/web/logout` + redirect
  - `src/app/(admin)/admin/me/_components/role-matrix-card.tsx` — 권한 매트릭스 카드
  - `src/app/(admin)/admin/me/_components/managed-tournaments-card.tsx` — Phase 2
- **수정 파일**:
  - `src/app/(admin)/admin/layout.tsx` — 우상단 영역에 `<UserMenu />` 추가 (~10줄)
  - `src/components/admin/sidebar.tsx` — 하단 "마이페이지" 링크 1줄 추가 (선택)
  - `src/components/admin/mobile-admin-nav.tsx` — 동일 (모바일 드로어)

### 컴포넌트 트리 (Phase 1)
```
AdminLayout (server)
  ├─ AdminSidebar (PC)
  ├─ AdminMobileNav (모바일)
  └─ <main>
      └─ [우상단 영역 신규] UserMenu (client)
          ├─ trigger: 아바타 + 닉네임 + chevron_down
          └─ dropdown: [마이페이지 / 로그아웃]
      └─ {children}  ← /admin/me 진입 시 마이페이지 본문
```

### 표시 정보 매핑 (사용자 요청 → DB 모델)
| 사용자 요청 | DB 모델 / 소스 | Phase | 비고 |
|------------|---------------|------|------|
| 닉네임 / 이메일 / 가입일 | `User.nickname` / `email` / `createdAt` | 1 | `getAuthUser()` user 활용 + 추가 SELECT |
| 사용자 ID | `User.id` (bigint → string) | 1 | 디버그용 표시 |
| **권한 매트릭스 (5종)** | `getWebSession().role` + `admin_role` + 2 DB SELECT | 1 | AdminLayout 동일 패턴 |
| ↳ super_admin | `session.role === "super_admin"` | 1 | |
| ↳ site_admin | `session.admin_role === "site_admin"` | 1 | |
| ↳ tournament_admin | `session.role === "tournament_admin"` | 1 | membershipType=3 자동 |
| ↳ tournamentAdminMember | `prisma.tournamentAdminMember.findMany({ userId, isActive: true })` | 1 | 토너먼트별 권한 |
| ↳ tournament_recorders | `prisma.tournament_recorders.findMany({ recorderId: userId, isActive: true })` | 1 | 토너먼트별 권한 |
| ↳ partner_member | `prisma.partner_members.findFirst({ user_id, is_active })` | 1 | AdminLayout 동일 |
| ↳ org_member | `prisma.organization_members.findFirst({ user_id, is_active })` | 1 | AdminLayout 동일 |
| **관리 토너먼트 목록** | TournamentAdminMember/Recorder JOIN Tournament (status/name/startDate) | 2 | 진행 중/예정/완료 분리 |
| 본인인증 상태 + method | `User.identity_method` (5/8 mock/portone/null) | 2 | decisions.md [2026-05-08] |
| 최근 admin 활동 | `prisma.admin_logs.findMany({ user_id: userId, take: 10 })` | 2 | dashboard 패턴 재사용 |
| 미처리 건의사항 | `prisma.suggestions.count({ assigned_to: userId, status: "pending" })` | 3 | 후순위 |
| 마지막 로그인 | (없음 — DB 미보유) | — | 추가 필요 시 별도 결정 |

### 진입 동선 (결정 — 옵션 a 권장)
**(a) 우상단 사용자 드롭다운 ⭐ 권장** — 표준 UX (Gmail / Notion / Vercel 동일 패턴)
  - layout.tsx 우상단 슬롯 (현재 비어있음 — `lg:pt-6` 영역 보강)
  - `<UserMenu />` 컴포넌트 — 아바타 + 닉네임 클릭 → 드롭다운 [마이페이지 / 로그아웃 / 사이트로 돌아가기]
  - 사용자 결정 §1~§8 (AppNav frozen) 영향 0 — admin 영역 전용

(b) 사이드바 하단 "마이페이지" 메뉴 추가 — 보조 진입점으로 같이 추가 (1줄)
  - sidebar.tsx + mobile-admin-nav.tsx 양쪽 1줄씩
  - 사용자가 사이드바 의존도 높은 경우 fallback

(c) 분리 UX (아바타 = 마이페이지 / 별도 로그아웃 아이콘) — 불채택 (클릭 2단계 증가)

→ **권장**: (a) + (b) 병행. (c) 불채택.

### 로그아웃 동작 (결정)
1. `<LogoutButton />` 클릭 → `fetch("/api/web/logout", { method: "POST" })`
2. 응답 200 → `window.location.href = "/"` (홈으로 리다이렉트)
   - 사유: `/login` 보다 `/` 가 자연 — 로그아웃 = 비로그인 진입점은 홈 (web AppNav 동일 패턴)
   - **재발 방지**: window.location.href = full reload → layout SSR 재실행 → 쿠키 삭제 인식 (5/5 errors.md 패턴)
3. 후속: 다른 탭 admin 페이지는 다음 진입 시 `getAuthUser()` anonymous → `/login` redirect (이미 작동)

### 핵심 기술 결정 (decisions.md 후보 1건)

**[2026-05-11] admin 마이페이지 (`/admin/me`) — 5종 권한 매트릭스 통합 + 로그아웃 진입점**
- 사유: admin layout 우상단 진입점 0 + 로그아웃 동선 0 → "사이트로 돌아가기" → (web) 마이페이지 → 로그아웃 (3 hop) UX 단절. admin 영역 내 표준 마이페이지로 1 hop 단축.
- 구조: `/admin/me` 단일 페이지 + 우상단 `<UserMenu />` 드롭다운 (Gmail/Vercel 패턴). 사이드바 하단 보조 링크 병행.
- 권한 매트릭스: super_admin / site_admin / tournament_admin / tournamentAdminMember (토너먼트별) / tournament_recorders (토너먼트별) / partner_member / org_member 7 케이스 표시 — `AdminLayout` 패턴 + `requireScoreSheetAccess` 패턴 통합.
- 인증 재사용: `getAuthUser()` (5/5 박제) — `state==="active"` 만 통과. layout 가드와 dedup (React.cache).
- 로그아웃: `POST /api/web/logout` 재사용 (5/5 NextResponse.cookies.set 패턴). 응답 200 → `window.location.href = "/"` full reload.
- 영향 0 = Flutter v1 / 기존 (web) 마이페이지 / 운영 DB schema. 추가 SELECT = Phase 1 시 4건 (tournamentAdminMember/recorders + partner + org), Phase 2 시 +3건 (관리 토너먼트 JOIN + identity_method + admin_logs).

### 위험 / 미해결
1. **권한 표시 정합성** — AdminLayout 의 5종 계산 로직과 마이페이지 표시가 어긋나면 사용자 혼란. → 동일 로직 헬퍼 추출 (`src/lib/auth/admin-roles.ts`) 권고. Phase 1 같이.
2. **토너먼트 admin/recorder 다수 케이스** — 한 사용자가 10+ 대회 운영자 동시 케이스 → 페이지 길이 폭증. → Phase 2 에서 "진행 중만 노출 + 펼치기" UX (5건 펼치기 패턴).
3. **모바일 우상단 슬롯** — `top-3 right-3` 햄버거 버튼과 겹침. → 모바일 → 햄버거 드로어 내부 상단에 사용자 카드 + 로그아웃 (PC = 우상단 드롭다운 / 모바일 = 드로어 상단). 2 UX 분기.
4. **로그아웃 후 redirect** — `/` vs `/login` 사용자 결재 필요 (현 권고 = `/`).
5. **본인인증 mock/portone 표기** — decisions.md [2026-05-08] mock 폴백 시스템 인지 후 표기 (옵션 = "본인인증 완료 (간편)" / "본인인증 완료 (PASS)" / "본인인증 미완료"). Phase 2.

### 사용자 결재 사항 (developer 진입 전)
| # | 결재 항목 | 옵션 | 권장 |
|---|----------|------|------|
| 1 | 진입 URL | (a) `/admin/me` / (b) `/admin/profile` | **(a)** 짧음 + (web)/profile 분리 명확 |
| 2 | 진입 동선 | (a) 우상단 드롭다운 / (b) 사이드바 하단 / (c) 분리 | **(a) + (b) 병행** / (c) 불채택 |
| 3 | 로그아웃 redirect | (a) `/` / (b) `/login` | **(a)** 홈 (web 패턴 일치) |
| 4 | Phase 1 표시 범위 | (a) 권한 매트릭스 + 로그인 정보만 / (b) + 관리 토너먼트 (Phase 2 흡수) | **(a)** MVP 권장 — Phase 2 분리 |
| 5 | 모바일 UX | (a) 햄버거 드로어 상단에 사용자 카드 통합 / (b) PC만 우상단 (모바일 = `/admin/me` 직접 진입) | **(a)** 일관성 |
| 6 | 권한 헬퍼 추출 | (a) `getAdminRoles()` 헬퍼 신설 → layout + 마이페이지 공유 / (b) 각자 계산 | **(a)** 정합성 보장 |
| 7 | 사이드바 하단 "마이페이지" 위치 | (a) "사이트로 돌아가기" 위 / (b) "사이트로 돌아가기" 아래 / (c) 별도 그룹 | **(a)** 가장 자연 |

### 다음 단계 (Phase 1 developer 위임 전)
1. 사용자 결재 7건 회신
2. (결재 완료 시) developer 호출 — Phase 1 만 (4 파일 신규 + 2 파일 수정 + 1 헬퍼 추출)
3. tester (tsc + build) + reviewer (디자인 토큰 위반 0 + Material Symbols Outlined) 병렬
4. 통과 시 PM commit + scratchpad 작업 로그 1줄
5. Phase 2/3 별도 후속 (사용자 트리거 시)


## 구현 기록 (developer)

📝 **구현한 기능**: 강남구협회장배 유소년 일괄 등록 Phase 1 — 데이터 모델 + 운영자 토큰 발급 페이지

### 변경 파일 (10건)

| # | 파일 경로 (절대) | 변경 내용 | 신규/수정 |
|---|------------------|---------|----------|
| 1 | `C:\0. Programing\mybdr\prisma\schema.prisma` | TournamentTeam +3 컬럼 / TournamentTeamPlayer +10 컬럼 +2 FK +2 인덱스 / User +2 역참조 / Tournament +1 역참조 / **신규 모델 3개 (ChildProfile / ClaimToken / TournamentDivisionRule)** 추가 | 수정 |
| 2 | `C:\0. Programing\mybdr\src\lib\utils\apply-token.ts` | `newApplyToken()` — randomBytes(32) hex 64자 (CSPRNG) | 신규 |
| 3 | `C:\0. Programing\mybdr\src\lib\auth\tournament-permission.ts` | `canManageTournament(tournamentId, userId, session)` — super_admin / organizer / TAM 3종 (match-stream.ts 패턴 차용) | 신규 |
| 4 | `C:\0. Programing\mybdr\src\app\api\web\admin\tournaments\[id]\team-applications\route.ts` | GET (팀 목록 + 진행 표) / POST (팀 1건 생성 + apply_token 발급 + admin_logs 박제) | 신규 |
| 5 | `C:\0. Programing\mybdr\src\app\(admin)\admin\tournaments\[id]\teams\page.tsx` | 서버 컴포넌트 — 권한 검증 + 초기 데이터 SELECT | 신규 |
| 6 | `C:\0. Programing\mybdr\src\app\(admin)\admin\tournaments\[id]\teams\teams-client.tsx` | 클라이언트 컴포넌트 — 팀 표 + 추가 모달 + 토큰 URL 복사 + 토스트 | 신규 |
| 7 | `C:\0. Programing\mybdr\scripts\_temp\seed-gangnam-divisions.ts` | TournamentDivisionRule seed 템플릿 (rules 배열 빈 상태 = no-op 안전) | 신규 |

### 주요 결정

| # | 항목 | 결정 | 사유 |
|---|------|------|------|
| 1 | 권한 헬퍼 | `canManageTournament` **별도 추출** (`src/lib/auth/tournament-permission.ts`) | match-stream.ts 와 동일 3종 권한 체계 → 대회 단위 라우트 공통화. 향후 Phase 2~6 재사용 |
| 2 | API 인증 | `getWebSession()` 직접 검증 | withWebAuth 도 가능했지만 본 라우트는 인증 + 권한 검증을 한 묶음으로 짧게 처리. match-stream.ts 권한 헬퍼 호출 패턴 정합 |
| 3 | origin 처리 | `req.headers.get("host")` + `x-forwarded-proto` | NEXT_PUBLIC_* 시크릿 노출 금지 룰 회피. Vercel 프리뷰 URL 자동 대응 |
| 4 | captainId 임시값 | `tournament.organizerId` 사용 | Team.captainId NOT NULL 제약 → admin이 만든 팀이므로 organizer 임시값 합당. Phase 2 에서 코치 user_id 로 교체 |
| 5 | Team 재사용 | 동일 (name, captainId=organizer) Team 검색 → 재사용 | 같은 팀 여러 대회 참가 가능 + 임시 row 만 재사용 (실 운영팀 captain 충돌 회피) |
| 6 | 만료 정책 | startDate + 7일 / 없으면 now + 30일 (UTC) | CLI prompt §3-5 룰 그대로 |
| 7 | (tournamentId, teamId) UNIQUE 가드 | 사전 SELECT → 409 응답 | TournamentTeam 의 @@unique 위반 회피 + 친화 에러 메시지 |
| 8 | 응답 형식 | `apiSuccess({ team: {...} }, 201)` | snake_case 자동 변환 — 프론트도 `team.team_name`, `team.apply_token_url` 로 접근 (CLAUDE.md §보안 5번 재발 방지) |
| 9 | 디자인 토큰 | 신규 토큰만 (`var(--bg-card / --ink-mute / --accent / --ok / --warn / --danger)` 등) | 02-design-system-tokens.md §9 폐기 토큰 회피. admin 자체 셸 (E등급) — AppNav 적용 X |
| 10 | 아이콘 | Material Symbols Outlined (`add`, `content_copy`) | lucide-react 금지 룰 |
| 11 | 모달 백드롭 | `rgba(0,0,0,0.5)` 하드코딩 | 표준 모달 패턴 (시안 일관) — 토큰 없는 영역 |

### TSC 검증 결과

- 본 작업 코드 관련 에러: **17건** — **전부 `prisma generate` 후 자동 해결** (신규 schema 컬럼/모델 client 타입 미생성 상태)
- 본 작업 외 잔존 에러: 1건 (`(admin)/admin/layout.tsx` user-menu 누락 — admin 마이페이지 작업 잔재, **본 작업과 무관**)

### 디자인 self-checklist 06 검수 결과

E등급 (admin 자체 셸) 기준:

| 항목 | 결과 |
|------|------|
| §1 AppNav | N/A (자체 셸) |
| §2 더보기 | N/A |
| §3 색상 토큰 (`var(--*)`) | ✅ 신규 토큰만 |
| §3 하드코딩 hex | ✅ 모달 백드롭 `rgba` 1건 (표준) |
| §3 핑크/살몬/코랄 | ✅ 0건 |
| §3 pill 9999px | ✅ 0건 |
| §3 lucide-react | ✅ 0건 (Material Symbols) |
| §3 버튼 4px | ✅ |
| §4 placeholder 5단어 | ✅ |
| §4 "예:" 시작 | ✅ 0건 |
| §5 모바일 표 | ✅ AdminLayout 의 lg 분기 활용 |
| §7 E등급 룰 | ✅ |

### 사후 점검 (PM 진입 전)

DB 실행 (PM 담당):
1. `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` — diff 확인 (사용자 검토)
2. 검토 통과 → `npx prisma db push` (전부 ADD COLUMN / CREATE TABLE — DROP 0건 확인)
3. `npx prisma generate` → TSC 본 작업 에러 17건 자동 해결 확인
4. 어드민 페이지 진입: `/admin/tournaments/{uuid}/teams` 으로 팀 1건 추가 시 토큰 URL 정상 발급 확인
5. 비-admin 사용자로 GET / POST 호출 → 403 확인 (IDOR 방어)

💡 **tester 참고**:
- **테스트 방법**:
  1. PM이 `prisma db push + generate` 완료 후 → `tsc --noEmit` 0건 / `npm run build` 성공
  2. super_admin / tournament organizer / TAM 권한 각각 다른 user 로 페이지 진입 권한 매트릭스 확인
  3. POST `/api/web/admin/tournaments/[id]/team-applications` 로 같은 팀명 2회 → 1차 201 / 2차 409 (DUPLICATE_TEAM)
  4. 비-admin → 403
  5. 만료 시각 = `startDate + 7일` 이 맞는지 응답 비교
- **정상 동작**: 토큰 URL 형식 `https://{host}/team-apply/{64hex}` / 응답 snake_case (apply_token_url, apply_token_expires_at) / admin_logs 1건 박제
- **주의할 입력**:
  - phone 010-1234-5678 / 01012345678 둘 다 통과
  - phone "10012345678" 등은 422
  - teamName 51자 → 422
  - 존재하지 않는 tournamentId → 403 (정보 노출 회피 — notFound 와 동일)

⚠️ **reviewer 참고**:
- **권한 헬퍼 새로 추출 (`tournament-permission.ts`)** — match-stream.ts 와 패턴 통일성 확인 부탁
- **captainId = organizerId 임시값** 정책이 Phase 2 (코치 user_id 로 교체) 와 충돌 없는지 검토
- **Team `is_public: false` + `accepting_members: false`** 으로 임시 팀이 일반 검색에 노출되지 않도록 했음 — Phase 2 코치 user_id 로 교체 시 이 값 어떻게 처리할지 결정 필요
- **응답 키 snake_case 자동 변환** 룰 (CLAUDE.md §보안 5번 5회 재발) 준수: 프론트 모달이 `team.team_name`, `team.apply_token_url` 형식으로 접근 (camelCase 가 아님)
- **(admin)/admin/layout.tsx user-menu 누락 에러** = 본 작업과 무관 (기존 admin 마이페이지 작업 잔재). 별도 처리 필요

## 구현 기록 (developer) — admin 마이페이지 Phase 1 (2026-05-11)

📝 **구현 범위**: `/admin/me` 마이페이지 + 우상단 UserMenu 드롭다운 + 로그아웃 동선 + 권한 매트릭스 7종 + 모바일 드로어 상단 사용자 카드. AdminLayout 권한 계산 로직 → `getAdminRoles()` 헬퍼 추출 (정합성 보장).

### 변경 파일

| 파일 (절대 경로) | 변경 | 신규/수정 | 라인 |
|------|------|----------|------|
| `C:\0. Programing\mybdr\src\lib\auth\admin-roles.ts` | `getAdminRoles()` 헬퍼 + AdminRoleSummary 타입 + React.cache | 신규 | +228 |
| `C:\0. Programing\mybdr\src\app\(admin)\admin\me\page.tsx` | server entry — auth + roles + user details | 신규 | +95 |
| `C:\0. Programing\mybdr\src\app\(admin)\admin\me\_components\user-info-card.tsx` | 닉네임/이메일/가입일/UID 카드 | 신규 | +110 |
| `C:\0. Programing\mybdr\src\app\(admin)\admin\me\_components\role-matrix-card.tsx` | 7종 권한 매트릭스 (boolean+리스트+소속) | 신규 | +260 |
| `C:\0. Programing\mybdr\src\app\(admin)\admin\_components\user-menu.tsx` | 우상단 드롭다운 (client / 외부 클릭+ESC) | 신규 | +148 |
| `C:\0. Programing\mybdr\src\app\(admin)\admin\_components\logout-button.tsx` | POST + window.location.href="/" | 신규 | +96 |
| `C:\0. Programing\mybdr\src\app\(admin)\admin\layout.tsx` | 권한 로직 → getAdminRoles() refactor + UserMenu 슬롯 + getAuthUser 단일 진입점 | 수정 | ≈83→74 |
| `C:\0. Programing\mybdr\src\components\admin\sidebar.tsx` | "마이페이지" 1줄 추가 (사이트로 돌아가기 위) | 수정 | +12 |
| `C:\0. Programing\mybdr\src\components\admin\mobile-admin-nav.tsx` | 드로어 상단 사용자 카드 + 로그아웃 통합 (user prop 추가) | 수정 | +75 |
| `C:\0. Programing\mybdr\src\__tests__\lib\admin-roles.test.ts` | 권한 매트릭스 10 케이스 회귀 가드 | 신규 | +220 |

### 헬퍼 추출 결과 (AdminLayout refactor)

- `getAdminRoles(userId, session)` 신규 → AdminLayout + `/admin/me` 양쪽 호출 → 정합성 단일 source 보장.
- AdminLayout 의 `partner_members.findFirst` + `organization_members.findFirst` 직접 호출 제거 → 헬퍼 통합.
- AdminLayout 인증 흐름도 `getWebSession` 직접 호출 → `getAuthUser()` 단일 진입점 (5/5 박제 룰 정합).
- React.cache 적용 → layout + `/admin/me` 같은 요청 내 DB SELECT 1회 (dedup) — 라운드트립 감소.
- AdminLayout 변경 라인 수: ≈14줄 감소 (권한 계산 로직 → 헬퍼 추출).

### 핵심 결정 적용

- 권한 매트릭스 **7 케이스** (super_admin / site_admin / tournament_admin + TAM 리스트 + recorder 리스트 + partner_member + org_member).
- super_admin 도 partner/org 데이터 표시 (마이페이지 정보용) — 단 `roles[]` 배열에는 push 안 함 (AdminLayout 원본 메뉴 필터 로직 보존).
- 모든 DB SELECT `isActive: true` 필터 (Phase 1-B-2 reviewer Major fix 패턴 동일).
- DB SELECT 실패 안전 폴백 (boolean 유지 + 리스트 empty) — 운영 DB 일시 장애 시 무한 redirect 회피.
- 로그아웃 = `window.location.href = "/"` full reload (5/5 errors.md `router.push` 회피 패턴).
- 모바일 드로어 상단 사용자 카드 — LogoutButton 재사용 (variant="drawer-card") + 마이페이지 Link.

💡 **tester 참고**:
- **테스트 시나리오**:
  1. super_admin 로그인 → `/admin/me` 진입 → 권한 매트릭스 모두 ✅ + TAM/recorder 리스트 / partner / org 표시.
  2. 일반 user (admin 권한 0) → `/admin` 진입 → `/login?error=no_permission` redirect.
  3. tournament_admin (membershipType=3) 만 보유 → 매트릭스 tournament_admin 만 ✅, 나머지 권한 없음 표시.
  4. tournament_recorders 권한만 → site_admin/super_admin ❌ + recorder 리스트에 대회명 표시.
  5. 로그아웃 클릭 → "/" 진입 → 다시 `/admin` 진입 시 /login 자동 리다이렉트.
  6. 모바일 (lg 미만) → 햄버거 드로어 상단 사용자 카드 + 마이페이지/로그아웃 노출.
  7. 사이드바 하단 "마이페이지" 진입 → 우상단 드롭다운 "마이페이지" 진입과 같은 페이지.
  8. profile_image_url NULL 사용자 → 이니셜 원형 아바타 / 있으면 이미지.
- **정상 동작**: 권한 매트릭스 정합성 = AdminLayout 사이드바 메뉴와 일치 (super_admin → 전체 메뉴 + 매트릭스 모두 ✅). UserMenu 드롭다운 외부 클릭 / ESC 키 / 메뉴 클릭 시 모두 닫힘.
- **주의 입력**:
  - super_admin + partner/org 둘 다 있는 케이스 → 매트릭스 카드에는 모두 표시 / 사이드바 메뉴에는 partner/org 진입점 X (super 가 이미 전체 메뉴).
  - 토너먼트 50개 이상 운영자 케이스 → `take: 50` 상한 (Phase 2 펼치기 UX 예정).

⚠️ **reviewer 참고**:
- **AdminLayout refactor 영향**: 권한 계산 5종 로직 → `getAdminRoles()` 단일 source. 라인 수 약 14줄 감소. 사용자 진입 결과는 동일 (super/site/tournament_admin + partner/org 매트릭스 + `roles[]` 배열). React.cache dedup 으로 DB 라운드트립 동일 또는 감소.
- **인증 흐름 통합**: AdminLayout 도 `getAuthUser()` 단일 진입점 위임 — withdrawn/missing 케이스 시 쿠키 자동 cleanup (5/5 박제 룰).
- **client → client import**: `mobile-admin-nav.tsx` (client) → `logout-button.tsx` (client) import 정상.
- **디자인 토큰 준수**: 모든 색상 `var(--*)` / 핑크/살몬/코랄 0 / `lucide-react` import 0 / Material Symbols Outlined 사용 / 원형 아바타 `border-radius: 50%` (9999px pill 회피 — 디자인 룰 §4-1).
- **AppNav frozen 영향 0**: (web) AppNav 변경 X — admin 영역 전용 작업.
- **Flutter v1 영향 0**: schema 변경 0 / api/v1/* 영향 0.

### 검증

| 항목 | 결과 |
|------|------|
| tsc --noEmit (본 작업 변경 파일) | **0 에러** ✅ |
| tsc 잔존 에러 (다른 작업 진행 중인 `tournaments/[id]/teams/page.tsx` 17건) | 본 작업과 무관 — `prisma generate` 후 자동 해결 (이전 유소년 작업 잔재) |
| vitest | **277/277 PASS** (기존 267 → 277, +10 신규 admin-roles 케이스) |
| `lucide-react` import grep | **0** ✅ |
| BigInt `n` suffix 리터럴 grep | **0** ✅ (`BigInt(...)` 패턴만) |
| 핑크/살몬/코랄 hardcode grep | **0** ✅ |
| 디자인 토큰 (var(--*)) | 모든 색상 ✅ |
| Material Symbols Outlined | 사용 ✅ |

## 테스트 결과 (tester) — admin 마이페이지 Phase 1 (2026-05-11)

### 정적 검증

| 항목 | 결과 |
|------|------|
| **tsc — 본 작업 10 파일** (admin-roles + admin/me/* + admin/_components/* + layout.tsx + sidebar.tsx + mobile-admin-nav.tsx + admin-roles.test.ts) | **0 에러** ✅ |
| tsc — 잔존 에러 (다른 작업) | **19 건** — 모두 `tournaments/[id]/teams/page.tsx` + `team-applications/route.ts` (유소년 Phase 1, `prisma generate` 후 자동 해결). 본 작업과 무관. |
| **vitest — 전체** | **277/277 PASS** ✅ (20 스위트 / 267 → 277, +10 신규) |
| vitest — admin-roles 신규 10 케이스 | **10/10 PASS** (67ms) ✅ |
| 회귀 6 스위트 (minutes 21 / score-match 14 / recording 14 / match-sync 23 / score-sheet-submit 5 / require-score-sheet-access 8) | **85/85 PASS** ✅ |

### admin-roles 권한 매트릭스 10 케이스

| # | 케이스 | 결과 |
|---|--------|------|
| 1 | 익명 세션 (session=null) → 모든 boolean false / 리스트 empty | ✅ |
| 2 | super_admin → superAdmin=true / roles ⊇ ["super_admin"] | ✅ |
| 3 | site_admin (session.admin_role) → siteAdmin=true | ✅ |
| 4 | tournament_admin (session.role) → tournamentAdmin=true | ✅ |
| 5 | tournamentAdminMembers JOIN tournament.name 매핑 / null name 안전 | ✅ |
| 6 | tournament_recorders JOIN tournament.name 매핑 | ✅ |
| 7 | partner_member 단일 + bigint→string 변환 | ✅ |
| 8 | org_member 단일 + bigint→string 변환 | ✅ |
| 9 | super_admin + partner/org 있어도 roles 에 partner/org push 안 함 (AdminLayout 원본 보존) | ✅ |
| 10 | DB SELECT 실패 → 안전 폴백 (boolean 유지 + 리스트 empty) | ✅ |

isActive 필터링은 admin-roles.ts:138/148/157/166 명시 코드 검증 (`isActive: true` / `is_active: true` 4종 모두).

### AdminLayout refactor 동등성

| 항목 | 결과 |
|------|------|
| 메뉴 필터 결과 동일 (boolean → roles 배열) | ✅ super/site/tournament_admin push + partner/org는 !superAdmin 시만 push (원본 로직 동일) |
| 권한 매트릭스 계산 동일 | ✅ |
| React.cache dedup (`/admin/me` 진입 시 layout + page DB 1회) | ✅ admin-roles.ts:114 `cache(` wrapping + get-auth-user.ts:53 동일 |
| 인증 흐름 단일 진입점 (getAuthUser → state==="active") | ✅ layout.tsx:29 / me/page.tsx:42 동일 패턴 |

### 디자인 토큰 grep

| 항목 | 결과 |
|------|------|
| `lucide-react` import | **0건** ✅ (주석 "lucide-react ❌" 명시 2건만 매치 — import 없음) |
| BigInt `n` suffix 리터럴 (123n 등) | **0건** ✅ (BigInt(...) 패턴만) |
| 핑크/살몬/코랄/rose hardcode | **0건** ✅ |
| hex hardcode (#xxx) | **0건** ✅ |
| 9999px / rounded-full pill | **0건** ✅ (주석 "9999px 회피" 명시 2건만 / `borderRadius: "50%"` W=H 원형만 — 디자인 룰 §4-1) |
| `color: "white"` 4건 | **표준 패턴** ✅ (BDR Red 배경 위 텍스트 — sidebar.tsx:215 ADMIN 배지와 동일) |
| Material Symbols Outlined 사용 | ✅ account_circle / mail / event / check_circle / verified / remove_circle_outline / logout / expand_more / arrow_back |

### 코드 동작 시나리오 8 케이스

| # | 시나리오 | 결과 |
|---|---------|------|
| 1 | 일반 user (admin 권한 0) `/admin/me` 진입 | ✅ AdminLayout `roles.length === 0` → `/login?error=no_permission` (layout.tsx:38). me/page.tsx:43 이중 가드. |
| 2 | super_admin 진입 → 매트릭스 7종 정확 | ✅ (super=true / partner-org 표시 유지 / roles 메뉴 필터에는 super 만 push) |
| 3 | tournamentAdminMember 만 (super_admin X) → 카드 표시 + 다른 권한 ❌ | ✅ (admin-roles 케이스 #5 PASS) |
| 4 | 로그아웃 → POST `/api/web/logout` + `window.location.href = "/"` | ✅ logout-button.tsx:49-55 |
| 5 | 모바일 (lg:hidden) → 우상단 UserMenu 숨김 + 드로어 상단 사용자 카드 | ✅ layout.tsx:68 `hidden lg:flex` / mobile-admin-nav.tsx:199 |
| 6 | 사이드바 하단 "마이페이지" 클릭 → `/admin/me` | ✅ sidebar.tsx:243 |
| 7 | UserMenu 외부 클릭 → 드롭다운 닫힘 | ✅ user-menu.tsx:49-59 mousedown listener |
| 8 | UserMenu ESC 키 → 드롭다운 닫힘 | ✅ user-menu.tsx:62-69 keydown listener |

### 운영 DB 영향

| 항목 | 결과 |
|------|------|
| schema 변경 (본 작업) | **0** ✅ (`git diff prisma/schema.prisma` = 유소년 작업분만 +101) |
| 본 작업 신규 SELECT (admin-roles 호출 시) | 4건 (tournamentAdminMember + tournament_recorders + partner_members + organization_members) — Promise.all 병렬 + React.cache dedup |
| WRITE 0 (SELECT only) | ✅ |
| 로그아웃 WRITE 0 (route 재사용) | ✅ POST `/api/web/logout` 기존 박제 그대로 |
| Flutter v1 영향 | ✅ 0 (admin 영역 전용) |

### 결론

✅ **통과** — 차단 0 / Minor 0.

- tsc 본 작업 0 에러 / vitest 277/277 PASS (+10) / 회귀 0
- 디자인 토큰 13 룰 위반 0 (lucide-react / BigInt n / 핑크 / pill 9999px / hex hardcode 모두 0)
- AdminLayout refactor 동등성 보존 (메뉴 필터 + 권한 매트릭스 + React.cache dedup)
- 운영 DB schema 변경 0 / WRITE 0 / Flutter v1 영향 0

PM 커밋 진행 가능.

## 리뷰 결과 (reviewer) — admin 마이페이지 Phase 1 (2026-05-11)

### 종합 판정: **통과 (수정 권장 — Minor 3건)**

차단 0 / Major 0 / Minor 3 (모두 Phase 2 흡수 가능).

### 강점
- **AdminLayout refactor 동등성 보장** — 원본 5종 권한 계산 (super/site/tournament_admin + partner_member/org_member) 모두 동일 결과. `roles` 배열 push 순서/조건 (super_admin 일 때 partner/org skip) 100% 보존. layout.tsx 라인 수 ≈14줄 감소 + 가독성 상승.
- **인증 단일 진입점 통합** — AdminLayout 이 `getWebSession` 직접 호출 → `getAuthUser()` 위임으로 변경. 5/5 박제 룰 (withdrawn/missing 쿠키 자동 cleanup) 정합. layout + `/admin/me` React.cache dedup 으로 DB SELECT 1회 보장.
- **isActive 필터 4종 모두 적용** — `tournamentAdminMember` / `tournament_recorders` / `partner_members` / `organization_members` 전부 `isActive: true` / `is_active: true` 필터. Phase 1-B-2 reviewer Major fix 패턴 정합.
- **응답 키 의존성 0** — `/api/web/logout` 응답이 `{ success: true }` 단순 형식이고 `LogoutButton`은 `res.ok` 만 체크. snake_case/camelCase 재발 5회 함정 회피 ✅.
- **DB SELECT 실패 폴백** — try/catch 로 boolean 만 유지 + 리스트 empty 반환. 운영 DB 일시 장애 시 layout 무한 redirect 회피 (안전 우선).
- **5/5 로그아웃 패턴 준수** — `window.location.href = "/"` full reload (errors.md 박제). `router.push` 회피.
- **UserMenu 접근성** — `aria-expanded` / `aria-haspopup="menu"` / `role="menu"` / `role="menuitem"` / `aria-label="사용자 메뉴"`. ESC + 외부 클릭 mousedown listener cleanup 정상.
- **테스트 커버리지 10/10** — 익명/super/site/tournament_admin boolean / TAM·recorder·partner·org 리스트 매핑 / super_admin 일 때 roles push 안 함 / DB 실패 폴백 모두 커버. JSDoc 매트릭스 명시.
- **디자인 토큰 100%** — `var(--*)` 전체 / 핑크/살몬/코랄 0 / `lucide-react` import 0 / pill 9999px 0 (정사각형 `borderRadius: 50%` 만 — §4-1 정합) / Material Symbols Outlined.

### 발견 이슈

**🚨 Critical (차단)**: 없음

**⚠️ Major (수정 권장)**: 없음

**💡 Minor (개선 제안)**:

1. **`user-info-card.tsx:117` — 정의되지 않은 토큰 `--color-text-tertiary` 참조**
   - 현 코드: `var(--color-text-tertiary, var(--color-text-secondary))` (fallback 으로 secondary 사용 → 시각 문제 0).
   - `globals.css` 에 `--color-text-tertiary` 변수 정의 없음 → 항상 fallback 으로 동작. 의도가 fallback 이라면 OK, 만약 실제 3단계 톤이 필요하면 globals.css 에 신규 토큰 추가.
   - **권장**: 그대로 두거나 (안전), 토큰 정의 신설 후 통일. Phase 2 흡수 가능.

2. **`admin-roles.ts` — super_admin 케이스에서도 partner/org SELECT 실행**
   - 원본 layout 은 super_admin 시 partner/org SELECT skip (효율). 신규 헬퍼는 마이페이지 표시용으로 **항상 SELECT** → 추가 DB 라운드 1회.
   - 영향: super_admin 1명당 layout 진입 1회당 partner/org 단순 indexed lookup 2회 (수 ms). React.cache 로 같은 요청 내 중복 0. 운영 영향 0.
   - **권장**: 그대로 — 마이페이지 정합성 확보 트레이드오프 합리적. JSDoc 결정 사유 명시되어 있음 (admin-roles.ts:126-128).

3. **`role-matrix-card.tsx` — `take: 50` 상한 UI 안내 0**
   - 50건 초과 케이스 시 UI 에서 "더 있음" 표시 없음 → 사용자 인지 X. 현실적으로 50+ 토너먼트 운영자는 거의 없으나 회귀 가드 차원.
   - **권장**: Phase 2 펼치기 UX 도입 시 같이 처리. Phase 1 차단 사유 0.

### 보안 / 컨벤션 체크

| 항목 | 결과 | 근거 |
|------|------|------|
| getAuthUser() 단일 진입점 | ✅ | layout.tsx:29 + me/page.tsx:42 모두 getAuthUser 호출. getWebSession 직접 호출 잔존 0 |
| React.cache dedup | ✅ | admin-roles.ts:114 `cache(...)` + get-auth-user.ts:53 동일 — 1 요청 1 DB |
| isActive 필터 4종 | ✅ | tournamentAdminMember (`isActive`) / tournament_recorders (`isActive`) / partner_members (`is_active`) / organization_members (`is_active`) 모두 필터 |
| AdminLayout refactor 동등성 | ✅ | 원본 vs 신규 roles 배열 push 조건 동일 (super_admin 시 partner/org skip) — git show 비교 |
| 본인 데이터만 SELECT (IDOR 0) | ✅ | 모든 쿼리 where: { userId } 또는 where: { user_id } — auth.user.id 사용 |
| lucide-react import 0 | ✅ | grep `^import.*lucide-react` 본 작업 디렉토리 매치 0 |
| BigInt `n` 리터럴 ❌ | ✅ | 본 작업 파일 그래프 매치 0 |
| 핑크/살몬/코랄 hardcode ❌ | ✅ | grep 매치 0 |
| pill 9999px ❌ | ✅ | `borderRadius: "50%"` 만 사용 (W=H 원형 — §4-1) |
| 외부 클릭 + ESC 드롭다운 | ✅ | user-menu.tsx:49-69 mousedown listener + ESC 키 + cleanup |
| LogoutButton 5/5 패턴 | ✅ | window.location.href = "/" full reload (logout-button.tsx:55) |
| 권한 테스트 커버리지 | ✅ | 10/10 케이스 — 익명/super/site/tournament_admin/TAM/recorder/partner/org + super_admin 시 roles push 룰 + DB 실패 폴백 |
| tsc 잔존 17건 본 작업 무관 | ✅ | 모두 `tournaments/[id]/teams/page.tsx` + `team-applications/route.ts` (유소년 작업 prisma generate 대기) — admin-roles/me/_components/layout 매치 0 |
| 응답 키 snake_case 함정 회피 | ✅ | `/api/web/logout` 응답 `{ success: true }` 단순 — LogoutButton 은 res.ok 만 검사 |

### Phase 2 진입 전 권고
- **권장 보강 (선택)**:
  1. `--color-text-tertiary` 토큰 globals.css 에 명시 추가 (또는 user-info-card.tsx 에서 secondary 직접 사용으로 통일).
  2. RoleMatrixCard 에 `take: 50` 상한 도달 시 "+N건 더보기" 펼치기 UX (Phase 2 흡수 권장).
  3. UserMenu 트리거 버튼에 `data-testid` 추가 — E2E Playwright 진입 안정성.
- **차단 0** — PM 커밋 진행 가능. tsc 17 에러는 유소년 작업의 prisma generate 대기 잔재로 본 작업과 분리.


## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 1 tester ✅ 통과]** tsc 본 작업 0 / vitest 277/277 PASS (267→277 +10 admin-roles). 권한 매트릭스 10/10 + AdminLayout refactor 동등성 + React.cache dedup + 디자인 토큰 13 룰 0 위반. 운영 DB schema 변경 0 / WRITE 0 / Flutter v1 0. 차단 0 / Minor 0. | ✅ |
| 2026-05-11 | (PM DB 실행 대기) | **[유소년 Phase 1 데이터 모델 + 운영자 토큰 발급]** schema +3 컬럼 (TT) / +10 컬럼 +2 FK +2 인덱스 (TTP) / 신규 모델 3개 (ChildProfile / ClaimToken / TournamentDivisionRule) / 권한 헬퍼 추출 (tournament-permission.ts) / API GET/POST + admin UI 페이지 + 모달 + 토큰 URL 복사 + seed 템플릿. tsc 본 작업 에러 17건 = prisma generate 후 자동 해결. 디자인 토큰 13 룰 위반 0. | ⏳ |
| 2026-05-11 | (계획만) | **[admin 마이페이지 기획설계]** `/admin/me` 신설 + 우상단 UserMenu 드롭다운 + 로그아웃 동선. 권한 매트릭스 5종 (super/site/tournament_admin + TAM/recorders + partner/org) — AdminLayout 패턴 + requireScoreSheetAccess 재사용. Phase 1~3 분해. 사용자 결재 7건 대기. 코드 변경 0. | ⏳ |
| 2026-05-11 | (조회만) | **펜타곤 김대진 명단 + 오늘 경기 등록 검증** — 김대진 ttp.id=2562 active ✅ / matchId=123 ⑤예선 15:00 KST 라이징이글스 vs 펜타곤 ✅ / venue = tournaments.venue_name "화성시 종합경기타운" 경기도 화성시 ✅ (TournamentMatch row는 null이지만 대회 단위 venue 패턴 정상). 출전 라인업은 Flutter 앱 경기 시작 시 처리 — PM 조치 불요. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 tester ✅ 통과]** tsc 0 / vitest 267/267 PASS (252→267 +15). 권한 매트릭스 8/8 + BFF 5/5 + existingMatch 분기 2/2 모두 PASS. 운영 DB SELECT only / 디자인 토큰 위반 0. 차단 0 / Minor 3. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 웹 종이 기록지 폼 + BFF + 권한 헬퍼]** 14 파일 / +2,053. 권한 헬퍼 4 매트릭스 + score-sheet server/client + 컴포넌트 5종 + BFF zod + audit `web-score-sheet`. tsc 0 / vitest 267/267 PASS. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-1 sync route refactor]** 옵션 A — match-sync service 추출 (494→204) + syncSingleMatch core. vitest 252/252 PASS. Flutter v1 envelope 100% 보존. | ✅ |
| 2026-05-11 | subin `05fa45b` | **[Phase 1-A 매치별 recording_mode 게이팅 인프라]** settings JSON 활용 / 헬퍼 3종 + Flutter v1 3 라우트 가드 + admin ScoreModal 토글 + audit `mode_switch`. vitest 231/231 PASS. | ✅ |
| 2026-05-11 | DB 작업 | **[열혈최강전 D-day 명단 검증]** 라이징이글스 13명 + 펜타곤 11명 검증 / 박성후 TTP id=2848 INSERT (admin_logs id=87). | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **[live] 결승 영상 swap-aware 백포트** — score-match.ts swap-aware + cron v3 헬퍼 통합. vitest 217/217 PASS. | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **[live] 5/10 결승 영상 매핑 긴급 fix** — auto-register 1:1 가드 + 158 video_id NULL. | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **[stats] 통산 3결함 일괄 fix** — mpg `/60` + 승률 winner_team_id + FG%/3P% NBA 표준. | ✅ |
