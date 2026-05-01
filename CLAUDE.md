# MyBDR - Basketball Tournament Platform

## 🚦 브랜치 / 워크플로우 (최우선)

### 브랜치
- `main` — 운영. **직접 push 금지**. `dev → main` 머지 권한 = **원영 + 수빈** (2026-05-01 정책 갱신)
- `dev` — 통합. 팀원 PR 모임
- `subin` — 수빈 개인
- `wonyoung` — 원영 개인

### 팀 구성
- **수빈** (snukobe) — `subin` 브랜치, 웹 (Next.js) 메인. `dev → main` 머지 권한 보유
- **원영** — `wonyoung` 브랜치, 웹 + **Flutter 앱(기록앱) 관리** 담당. `dev → main` 머지 권한 보유
- **Flutter 앱(`/api/v1/...`) 변경 시 사전 공지 대상 = 원영**

### 하루 작업 루틴
```bash
git checkout dev && git pull origin dev
git checkout subin && git merge dev
# 작업 → commit → push
git push origin subin
# GitHub에서 subin → dev PR
```

### 🚨 절대 금지
1. `main` 직접 push
2. `.env`에 운영 DB URL
3. 운영 DB 대상 `prisma db push`/마이그레이션

### 개발 환경
- **개발 DB**: Supabase 개발 전용 (운영 분리)
- **개발 프리뷰**: https://mybdr-git-dev-mybdr.vercel.app/
- **로컬 포트**: 3001 (package.json 고정). `subin-referee` 브랜치는 3002
- **.env**: 개발 DB + localhost. **운영 DB URL 금지**
- **.env.local**: 로컬 port 3001 auth/CORS 오버라이드 (gitignored)

### "오늘 작업 시작하자" 체크리스트
사용자가 **"오늘 작업 시작하자"** 류 말을 하면 본 작업 전 점검 + 승인 받기:
1. `git remote -v` (github.com/bdr-tech/mybdr)
2. `git fetch origin --prune` + main/dev/subin 차이
3. 현재 브랜치가 subin인지
4. `.env` 존재 + DATABASE_URL이 개발 DB인지 (값 노출 금지)
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

### 워크플로우 5단계 (새 zip 받았을 때)

1. 새 zip 풀이 → 임시 폴더
2. 기존 `BDR-current/` → `_archive/BDR vX.Y/` 이동 (옛 버전화)
3. 새 zip 의 `Dev/design/BDR vX.Y/` → `BDR-current/` 카피
4. zip 최상위 옛 시안 (있으면) → `_archive/v2-original/`
5. `Dev/design/README.md` 갱신 + commit `design: BDR-current sync vX.Y`

### 명명 룰 — zip 파일명 ≠ 시안 버전

- **zip 파일명** (`BDR v2.zip`): 사용자 회차 표시용 (작업 일자 묶음, 의미 약함)
- **시안 버전** (zip 안 `BDR vX.Y/`): 실제 시안 버전 (예: v2.3 = Phase 13/19 마이페이지 hub)
- **활성 폴더** (`BDR-current/`): 항상 최신 — 시안 버전 무관, CLI 의 단일 source

→ 위반 자동 reject: `BDR v2.3/` `BDR v2.4/` 직접 참조하는 프롬프트는 `BDR-current/` 로 치환.

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

**A. AppNav (헤더) 7 룰** — `03-appnav-frozen-component.md` 코드 그대로 카피, 재구성 금지:
1. 9 메인 탭 = 홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기
2. utility bar 우측 (계정/설정/로그아웃) 모바일에서도 표시
3. main bar 우측 = 검색/**쪽지**/알림/다크/햄버거 **5개**만 (더보기 dropdown trigger / 아바타 추가 ❌) — Phase 19 갱신 (2026-05-01)
4. 다크모드 — PC 듀얼 라벨 / 모바일 단일 아이콘
5. 검색·**쪽지**·알림 = `app-nav__icon-btn` (border/bg 박스 ❌)
6. 모바일 닉네임 hidden
7. 더보기 = 9번째 탭 (drawer + 5그룹 패널)

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
