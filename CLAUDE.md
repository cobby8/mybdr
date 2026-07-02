# MyBDR - Basketball Tournament Platform

## 📚 문서 / 협업 흐름 (세 플랫폼)

수빈은 **Cowork = 허브** / **Claude.ai = 시안** / **Claude CLI = 코드 박제** 세 플랫폼을 함께 사용. 갱신·결정·핸드오프는 다음 문서를 봄:

- **`WORKFLOW.md`** (최상위) — 세 플랫폼 역할 / 명명 통일 (Phase NA/NB/NC, B/S/G, UA1~UD3) / 핸드오프 라이프사이클 13 단계 / source of truth 우선순위 7 단계 / **수빈 본인 수동 액션 5 단계 체크리스트**
- **`.claude/phase-ledger.md`** — Phase 1~N 의 단계별 상태 (의뢰 / Claude.ai / zip / sync / 박제 / 검증) 실시간 ledger. 세 플랫폼이 같이 보고 갱신
- **`scripts/sync-bdr-current.ps1`** — Claude.ai zip → BDR-current/ 자동 sync (§🗂️ 5단계 자동화)

→ 신규 Phase 시작 시 WORKFLOW.md §부록 B "신규 Phase 표준 절차" 부터 시작.

---

## 🚦 브랜치 / 워크플로우 (최우선)

### 브랜치 (2026-06-21 단독 운영 전환 — subin 폐지, dev 직접 작업)
- `main` — 운영. **직접 push 금지**. `dev → main` 머지 권한 = **수빈 단독**
- `dev` — **작업 + 통합 겸용 브랜치**. 수빈이 여기서 직접 작업·커밋·push. 릴리스는 `dev → main` PR 머지
- ~~`subin` — 수빈 개인~~ (2026-06-21 폐지 — 단독 운영이라 개인 브랜치 불필요. 이제 `dev`에서 직접 작업)
- ~~`wonyoung` — 원영 개인~~ (2026-06-14 원영 프로젝트 이탈 — 브랜치 비활성)

### 팀 구성 (2026-06-21 단독 운영)
- **수빈** (snukobe) — **단독 운영**. `dev` 브랜치에서 직접 작업, 웹 (Next.js) 메인. **`dev → main` 머지 권한 단독 보유**
- ~~**원영** — `wonyoung` 브랜치, Flutter 앱 관리~~ → **2026-06-14 프로젝트 이탈**.
- ℹ️ 동시 2세션 운영 시: 같은 `dev` 브랜치 공유 → 코드는 각자 영역 디렉토리만 명시적 `git add <경로>`(전체 `git add .` 금지)로 커밋 격리, scratchpad는 자기 블록만 수정·작업로그 append.
- ⚠️ **Flutter 앱(`/api/v1/...`) 담당 공백** — 원영 이탈로 기록앱(bdr_stat)/`/api/v1` 전담자 없음.
  - 과거 룰("`/api/v1` 변경 시 공지 대상 = 원영")은 **무효**. 현재 **공지 대상 없음**.
  - `/api/v1` 변경은 사후 공지 대신 **사용자(수빈) 결정 필요**. 신규 담당 배정 시 본 항목 갱신.

### 하루 작업 루틴 (2026-06-21 dev 직접 작업)
```bash
git checkout dev && git pull origin dev
# 작업 → commit → push (dev에서 직접)
git push origin dev
# 릴리스 시점에만: GitHub에서 dev → main PR 생성·머지
```

### 🚨 절대 금지
1. `main` 직접 push
2. **운영 DB 대상 destructive 작업 사용자 승인 없이 실행** (DROP/TRUNCATE/대량 DELETE/대량 UPDATE)
3. **`prisma migrate reset` 또는 `prisma db push --accept-data-loss` 운영 DB에 실행** (데이터 파괴)

### 🗄️ DB 정책 (2026-05-02 단일 DB 정책 확정)
- **단일 Supabase project 운영/개발 겸용** — `.env DATABASE_URL` = 운영 DB
- **사유**: 별도 dev DB 미운영 (사용자 결정 2026-05-02). 비용 단순화 + 단일 source of truth
- **위험**: 모든 로컬 작업 (Next.js dev / scripts) 이 운영 DB에 즉시 반영. `prisma db push` schema 변경 = 운영 즉시 적용
- **안전 가드 (필수 준수)**:
  1. **destructive SQL** (DROP/DELETE/UPDATE 대량) 전 → 사용자 명시 승인 + SELECT 1건 사전 검증
  2. **prisma db push** 전 → schema diff 사용자 검토 후 진행 (NULL 허용 ADD COLUMN 같은 무중단 변경만 자동)
  3. **임시 스크립트** (`scripts/_temp/`) 작업 후 즉시 정리 — 운영 DB credentials 노출 방지
  4. **DB 작업 사후 검증** 항상 — count/groupBy 등 실측으로 확인
  5. **운영 영향 0 작업** (SELECT만, schema 변경 0): 가드 없이 진행 가능
- **임시 dev DB 필요 시**: `.env.local` 에 `DATABASE_URL=postgres://...dev...` 오버라이드 + `dotenv-cli -e .env.local npx prisma ...` 실행 (현재 미사용)

### 개발 환경
- **DB**: 운영 Supabase project 단일 사용 (위 §DB 정책 참조)
- **개발 프리뷰**: https://mybdr-git-dev-mybdr.vercel.app/
- **로컬 포트**: 3001 (package.json 고정). `subin-referee` 브랜치는 3002
- **.env**: 운영 DB + localhost (gitignored)
- **.env.local**: 로컬 port 3001 auth/CORS 오버라이드 (gitignored)

### "오늘 작업 시작하자" 체크리스트
사용자가 **"오늘 작업 시작하자"** 류 말을 하면 본 작업 전 점검 + 승인 받기:
1. `git remote -v` (github.com/cobby8/mybdr)
2. `git fetch origin --prune` + main/dev 차이
3. 현재 브랜치가 dev인지
4. `.env` 존재 + DATABASE_URL 키만 확인 (값 노출 금지) — 운영 DB 정상
5. `.env.local`에 localhost:3001 오버라이드 있는지
6. 결과 요약 → "이대로 작업 시작해도 될까요?" 승인

승인 전 파일 수정/브랜치 전환/머지/커밋 금지.

---

## 기술 스택
- **Framework**: Next.js 15 (App Router, TS strict)
- **ORM**: Prisma 6 + PostgreSQL
- **Auth**: JWT (Flutter) + 커스텀 웹세션 (getWebSession)
- **Validation**: Zod
- **CSS**: Tailwind CSS 4 (BDR Red #E31B23 + 쿨 그레이)
- **폰트**: Pretendard + Space Grotesk
- **아이콘**: Material Symbols Outlined (lucide-react 금지)
- **배포**: Vercel

## 디자인 핵심
- 상세: `Dev/design/DESIGN.md`
- 색상: Primary #E31B23, Navy #1B3C87, Info #0079B9
- 다크모드 기본 (쿨 그레이). 핑크/살몬/코랄 금지
- 버튼 border-radius 4px
- **하드코딩 색상 금지** → `var(--color-*)` 변수
- **[PUB 도메인 예외 2026-07-02]** 공개웹 `[data-pub]` 스코프는 DS v4 듀얼포인트 채택: 라이트=토스블루 `#3182F6` / 다크=BDR레드 `#E31B23`. globals `:root`(레거시 admin/referee/site)는 BDR레드 유지(미변경). "공개웹=BDR레드 단일" 문구는 `[data-pub]` 라이트에 한해 무효. 고정 브랜드레드는 `--red`/`--bdr-red`(LIVE·기록·브랜드 모먼트 전용, 포인트색과 분리).

## 🗂️ Dev/design/ 폴더 구조 (단일 폴더 룰 — 2026-05-01)

**핵심**: 활성 시안 = `Dev/design/BDR-current/` 단 하나. 옛 버전은 `_archive/` 별도 보관. CLI 박제 작업의 모든 참조는 `BDR-current/` 만 사용 (`BDR v2.X/` 직접 참조 ❌).

```
Dev/design/
├── BDR-current/                  ⭐ 활성 시안 (박제 source — zip 동기화)
├── claude-project-knowledge/     영구 — 9 파일 박제 룰
├── DESIGN.md / README.md         영구 — 시스템 / 폴더 가이드
├── v3-rebake-prompt-2026-05-01.md  활성 — 박제 재시작 프롬프트
├── team-logos/                   영구
└── _archive/
    ├── BDR v2/, v2.2/, v2.3/, v2.4/  옛 버전들
    ├── v2-original/              zip 최상위 옛 시안 보존
    └── prompts/                  옛 phase-N / v2.X-cli-batch 등
```

### 워크플로우 5단계 (새 zip 받았을 때) — **자동화됨**

```powershell
.\scripts\sync-bdr-current.ps1 -ZipPath "<zip 경로>" -NewVersion "v2.X" -DryRun  # 미리보기
.\scripts\sync-bdr-current.ps1 -ZipPath "<zip 경로>" -NewVersion "v2.X"          # 실행
```

스크립트가 자동 처리: 1) zip 풀이 → 임시 폴더 / 2) 기존 `BDR-current/` → `_archive/BDR vX.Y/` 이동 / 3) 새 시안 → `BDR-current/` 카피 / 4) zip 최상위 옛 시안 → `_archive/v2-original/` / 5) `README.md` 갱신 + commit 명령 print.

상세는 `WORKFLOW.md §6` 참조. 안전 가드: git uncommitted 자동 감지 / `-DryRun` 시뮬레이션 / 자동 commit ❌ (수빈 검토 후 수동).

### 명명 룰 — zip 파일명 ≠ 시안 버전

- **zip 파일명** (`BDR v2.zip`): 사용자 회차 표시용 (작업 일자 묶음, 의미 약함)
- **시안 버전** (zip 안 `BDR vX.Y/`): 실제 시안 버전 (예: v2.3 = Phase 13/19 마이페이지 hub)
- **활성 폴더** (`BDR-current/`): 항상 최신 — 시안 버전 무관, CLI 의 단일 source

→ 위반 자동 reject: `BDR v2.3/` `BDR v2.4/` 직접 참조하는 프롬프트는 `BDR-current/` 로 치환.

### 🔄 운영 → 시안 동기화 룰 (2026-05-07 신규 — 재발 방지)

**룰**: 운영 src/ UI 변경 = BDR-current/ 같이 갱신 (역방향 박제). 갭 발생 시 클로드 디자인이 stale baseline 위에서 작업하게 됨.

**언제 트리거**:
1. **시각 패턴 변경** — 새 카드 / 모달 / 컴포넌트 / 뱃지 / 레이아웃 / 색상 룰
2. **AppNav / Drawer 변경** — frozen 룰 영향
3. **공유 컴포넌트 추가** — NavBadge / PasswordInput / ForceActionModal 같은 표준 컴포넌트
4. **사용자 직접 UI 수정 commit** — `fix(ui)` / `feat(ui)` 류
5. **사용자 결정 §1~§8 재확인 또는 갱신** — 01-user-design-decisions.md 영향

**동기화 단계**:
1. 운영 src/ 변경 commit 후 → BDR-current/ 영향 검토
2. 영향 있으면 BDR-current/components.jsx (또는 screens/X.jsx, tokens.css) 같이 갱신
3. 같은 commit 또는 별도 commit `design(sync): 운영 X 시안 박제` 형식
4. 02-design-system-tokens.md / 03-appnav-frozen-component.md 영향 시 같이 갱신

**갭 검증 명령** (분기별 또는 새 Phase 진입 전):
```bash
# BDR-current/ 마지막 commit
git log -1 --format="%ai" -- Dev/design/BDR-current/

# 운영 src/ UI commit (BDR-current 마지막 이후)
git log --since="<above-date>" --oneline -- "src/components/" "src/app/(web)/" | grep -iE "ui|design|nav|badge|hero|card|modal|drawer|dropdown"

# 결과가 비어있어야 stale 0
```

**위반 사례 (2026-05-07 발견)**:
- BDR-current/ 5/1 stop / 운영 5/3~5/6 변경 10건 미반영 → Phase A 클로드 디자인이 stale 베이스 위에서 작업 → Phase A.5 역박제 의뢰 발생 (`bdr 디자인 시스템 관리/prompts/phase-A5-reverse-sync.md`)

→ **현재 Phase A.5 후속**: 본 룰 적용 — 운영 src/ UI 변경 시 BDR-current/ 같이 갱신.

## 🎨 디자인 작업 시 (Cowork Project Knowledge — 매 세션 자동 적용)

**모든 디자인 시안 / 박제 작업은 다음 패키지를 첫 번째로 읽고 시작**:

`Dev/design/claude-project-knowledge/` (9 파일)
- `00-master-guide.md` ⭐ — 마스터 진입점 + 13 룰
- `01-user-design-decisions.md` — 사용자 직접 결정 8 영역 (영구 보존)
- `02-design-system-tokens.md` — 색상/타이포/라운딩/모바일
- `03-appnav-frozen-component.md` ⭐ — AppNav frozen 코드 + 7 룰 (절대 재구성 금지)
- `04-page-inventory.md` — 117 페이지 박제 등급
- `05-design-brief-template.md` — 의뢰 표준 템플릿
- `06-self-checklist.md` ⭐ — 시안 완료 후 자체 검수
- `07-custom-instructions.md` — Custom Instructions 텍스트 (Claude.ai Project 용)
- `README.md` — 사용 가이드

### 디자인 작업 13 룰 (위반 시 자동 reject)

> **[PUB 도메인 예외 2026-07-02]** 공개웹 `(web)`는 AppNav frozen 13룰 A(1~7)를 **면제**한다. 셸=DualSideNav(좌측 2단 레일+패널, `nav-ia.ts`+`dual-side-nav.tsx`, 06-30 c190857~46bacc0 완료). AppNav frozen은 이제 admin/referee/site 등 **비-PUB 도메인에만** 적용. (아래 A 7룰은 비-PUB 참조용 보존)

**A. AppNav (헤더) 7 룰** — `03-appnav-frozen-component.md` 코드 그대로 카피, 재구성 금지:
1. 9 메인 탭 = 홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기
2. utility bar 우측 (계정/설정/로그아웃) 모바일에서도 표시
3. main bar 우측 = 검색/**쪽지**/알림/다크/햄버거 **5개**만 (더보기 dropdown trigger / 아바타 추가 ❌) — Phase 19 갱신 (2026-05-01)
4. 다크모드 — PC 듀얼 라벨 / 모바일 단일 아이콘
5. 검색·**쪽지**·알림 = `app-nav__icon-btn` (border/bg 박스 ❌)
6. 모바일 닉네임 hidden
7. 더보기 = 9번째 탭 (drawer + 5그룹 패널)

> **[PUB 예외 2026-07-02]** 공개웹은 "더보기" 탭 폐지·"마이"(mypage) 섹션으로 대체. 더보기 5그룹 IA는 비-PUB/레거시 참조용. 공개웹 IA source = `nav-ia.ts`(9섹션).

**B. 더보기 5그룹 IA**:
8. 가짜링크 4건 영구 제거: `gameResult / gameReport / guestApps / referee`
9. `refereeInfo` (둘러보기 그룹) + `mypage` (계정·도움 첫 항목)

**C. 디자인 토큰** (이미 위 §디자인 핵심):
10. `var(--*)` 토큰만 / 핑크·살몬·코랄 ❌ / lucide-react ❌ / pill 9999px ❌ — **단 정사각형(W=H) 원형은 50% 사용 (9999px 회피)**. 상세: `02-design-system-tokens.md` §4-1 (2026-05-01 명확화)

**D. 카피 / 모바일**:
11. 글로벌 카피 — **시안 우선** (사용자 결정 2026-05-01). "서울 3x3 농구 커뮤니티" / "다음카페" 카피 ✅ 시안 보존. About 운영진 실명 박제 ❌ (보존). 자세한 사유: `Dev/design/claude-project-knowledge/01-user-design-decisions.md` §6-1
12. placeholder 5단어 이내 ("예: " 시작 ❌)
13. 720px 분기 / iOS input 16px / 버튼 44px

### 디자인 작업 시작 표준 절차

```
[Step 1] Dev/design/claude-project-knowledge/00-master-guide.md 읽기 (13 룰 인지)
[Step 2] 의뢰 내용에 따라 01~06 보조 파일 참고
[Step 3] 첫 응답 형식 (00 §3 참조):
  ✅ BDR 디자인 의뢰 확인 — [작업명]
  이해: [핵심] / 사용자 결정 §[N] 보존 / AppNav frozen — 03 카피
  자체 검수: 06 §[해당 섹션]
  작업 시작.
[Step 4] 시안 작업 (AppNav 03 카피 / 토큰 02 / 카피 01)
[Step 5] 완료 후 06-self-checklist.md 모든 항목 ✅ 검수
[Step 6] 박제 산출물 = src/ 코드 직접 수정 + git commit. 시안 폴더는 BDR-current/ 단일 (CLI 가 새 폴더 생성 ❌). 새 시안은 사용자가 새 zip 전달 시 §🗂️ 워크플로우 5단계로 동기화.
```

### 회귀 방지 — 위반 자동 검수 체크 (Phase 19)

시안 측정 시 다음 4 케이스 자동 확인:
- ❌ main bar 우측에 "더보기 ▼" dropdown 또는 아바타("RDM" 등) 노출
- ❌ 모바일(≤768px)에서 "☀ 라이트 ☾ 다크" 듀얼 라벨 노출
- ❌ 검색/쪽지/알림 버튼에 border/bg 박스 (`.btn` / `.btn--sm` 등) 적용
- ❌ main bar 우측 아이콘 순서가 [다크, 검색, 쪽지, 알림, 햄버거] 이외로 변경·누락

### 위반 시 즉시 중단

다음 발견 시 작업 중단 + PM 보고:
- 사용자 결정 §1~§8 위반 (헤더 / 더보기 / 카피 / 모바일)
- 신규 메인 탭 추가 (메인 탭 9개 변경 — PM 확인 필수)
- DB 미지원 기능을 시안에 (라우트 존재 / 데이터 출처 불명)

## 디렉토리
```
src/app/(web)/       웹 페이지 (커스텀 세션)
src/app/(site)/      서브도메인 토너먼트 사이트
src/app/api/v1/      Flutter REST (JWT)
src/app/api/web/     웹 전용 API
src/lib/auth/ security/ api/ validation/ db/ utils/
src/lib/tournaments/official-match.ts  ← 공식 기록 가드 유틸
Dev/design/          디자인 시안
.claude/knowledge/   6파일 지식 베이스
.claude/scratchpad.md 작업 현황 (100줄 이내)
scripts/_templates/  재사용 가능한 일회성 스크립트 템플릿
```

## 보안
- 시크릿 `NEXT_PUBLIC_` 금지
- 비공개 API에 `withAuth` + `withValidation` 필수
- 응답은 `apiSuccess()` / `apiError()` — **응답 키 자동 snake_case 변환**. 프론트 접근자도 snake_case로. route.ts 코드(camelCase)만 보고 프론트 인터페이스 짜면 사일런트 undefined 버그. **재발 5회**. 신규 필드 추가 전 curl 1회로 raw 응답 확인 필수 (errors.md 2026-04-17)
- IDOR: 리소스 접근 시 소유자/권한 검증
- 멀티테넌트: 서브도메인 쿼리에 tournamentId 필수

## 코딩 컨벤션 (상세는 knowledge/conventions.md)
- DB: snake_case (@map) / TS: camelCase / 파일명: kebab-case
- 공식 기록 쿼리: `officialMatchWhere()` 유틸 필수 사용
- 리디자인: API/데이터 패칭 유지 + UI만 변경

---

## ⚡ 에이전트 실행 규칙
1. **병렬 실행** — 독립 에이전트 동시 (tester+reviewer 등)
2. **확인 축소** — 명확 요청은 바로 실행
3. **Agent 호출 기준** (conventions.md 참조):
   - PM 직접: 파일 1~2개, grep/read 1회, DB 조회 1회
   - Explore: 파일 3개+ 검색, 키워드 애매
   - planner: 구조적 결정, 영향 분석
   - developer: 2파일+ 연계 or 비즈니스 로직
   - **security-reviewer**: API/권한/사용자데이터 변경 (reviewer와 병렬·IDOR 재발 5회 주의)
   - **db-migration-expert**: Prisma 스키마 변경·마이그레이션 (운영 DB 단일 안전 가드)
   - **design-system-expert**: 디자인 시안 박제·BDR-current 13룰 검수
   - **site-security**: 배포 전·정기 보안 점검 / **site-maintenance**: 정기 점검·미사용/중복 코드 정리
   - **vercel:performance-optimizer** (빌트인): 런타임 성능 (Web Vitals·번들·캐싱)
   - **live-expert**: /live·minutes-engine·MVP·PBP·박스스코어 도메인

## 📋 기록 (상세는 글로벌 CLAUDE.md)
- **scratchpad.md**: 현재 작업 + 작업 로그 10건 (100줄 이내)
- **knowledge/** 6파일: architecture / conventions / decisions / errors / lessons / index
- 에이전트별 기록 책임: planner → architecture+decisions / developer → 구현기록 / debugger → errors / pm → 작업 로그+index+lessons+승격

## PM 작업 완료 체크리스트
```
□ 작업 로그 1줄 (10건 이내)
□ scratchpad 100줄 이내
□ 에러 → errors.md
□ 30분+ 삽질 → lessons.md
□ 기술 결정 → decisions.md
□ 새 패턴 → conventions.md
□ 구조 변경 → architecture.md
□ index.md 갱신
□ 미푸시 커밋 알림
```
