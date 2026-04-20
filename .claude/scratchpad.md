# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (필수, 2026-04-20 합의)
- **본 세션** = `(web)`/`(api/web)`/`(referee)` 등 일반 UX/기능 작업
- **다른 세션 (병행)** = 다음카페 sync 작업 — 항상 별도 터미널에서 동시 진행
- **본 세션 PM 금지 파일**: `scripts/sync-cafe.ts`, `scripts/cafe-login.ts`, `scripts/_tmp-*`, `scripts/backfill-*cafe*.ts`, `src/lib/cafe-sync/*`, `Dev/cafe-sync-plan-*.md`
- **푸시 전 `git fetch` 권장** (양 세션 push 충돌 방지)

## 📍 다음 세션 진입점 (2026-04-21~ "이어서 하자" 시 이 순서대로)

### 🥇 1순위 — subin 미승격 분 dev/main 올리기 (PR #51 + #52)
- **조건**: 원영과 협의 완료 후 착수 (오늘 오후 PR #50 이후 수빈이 혼자 쌓은 7커밋)
- **범위**: `d30264f..HEAD` 구간. 본 세션 커밋 7건 + 카페 세션 자연 합류
  - `71b817c` M7 후속(거부 사유 저장) / `eb9c910` L3 초입(대회·시리즈 브레드크럼 4단)
  - `e6a9169` /profile/activity 탭 배지 / `8dfbafe` 색상 audit + manage 5곳
  - `d30264f` ops-db 초안 / `1ffedb5` index.md 중복 해소
  - `299c395` 카페 Phase 3 #6 Pagination (카페 세션)
- **절차**: 아침 흐름 복제 — `gh pr create --base dev --head subin` squash → `gh pr create --base main --head dev` merge
- **예상 충돌**: 있음 (scratchpad·settings.local·knowledge 등). `--ours` 일괄 해결
- **GH 토큰**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`

### 🥈 2순위 — W4 통합 스모크 테스트 (수빈 수동, 1h)
- **대상**: `/profile/activity` 3탭 / `/help/glossary` / 팀 상세 가입 상태 UI / M6 알림 6카테고리 / M3 코트 지도 / M5 온보딩
- **조합**: PC × 모바일 × 다크 × 라이트 4조합
- **결과는 scratchpad 수정 요청 테이블에 기록**

### 🥉 3순위 — 원영 협의 (30분~1h)
- **문서**: `Dev/ops-db-sync-plan.md` (6개 선결 조건 체크박스)
- **옵션 A** 추천 (Supabase 두 번째 프로젝트)
- 협의 완료 시 → 2026-04-18 lessons "개발 DB라 믿은 .env" 사건의 장기 해결 시작

### 4순위 — L3 다음 단위 (실작업, ~3h)
- **남은 L3 항목** (Dev/long-term-plan-L3.md 기준):
  - Organization 페이지 (`/organizations/[slug]`)에 Breadcrumb + 소속 시리즈 카드 섹션
  - Series(under org) 페이지에 Breadcrumb
  - `EditionSwitcher` 공용 컴포넌트 (이전/다음 회차 3버튼)
  - Tournament 페이지에 "소속 시리즈 카드" + EditionSwitcher 적용
  - 신규 API: `/api/web/series/[slug]/editions`
- **착수 조건**: 1·2순위 마감 후. `shared/breadcrumb.tsx` 재활용

### 5순위 — 점진 정비 (보이스카우트)
- 하드코딩 색상 잔존 30 파일 (lessons.md 2026-04-20 audit 목록)
- `any` 타입 9회 / 8 파일
- **원칙**: 해당 파일을 다른 이유로 건드릴 때 함께 정비

## 현재 상태 스냅샷 (2026-04-20 하루 마감 시점)

| 항목 | 값 |
|------|-----|
| 브랜치 | subin |
| subin HEAD | `1ffedb5` (오늘 마지막 커밋) |
| 미푸시 | 0건 (방금 push 완료) |
| main..dev | 0 ✅ (오후 PR #50까지 반영) |
| subin..dev | 7 (오후 PR #50 이후 쌓인 커밋) |
| 오늘 본 세션 커밋 수 | 12건 |
| 오늘 PR merge | #47 #48 #49 #50 (2사이클) |
| 장기 기획서 | L2·L3·운영 DB 초안 3종 확보 |

## W1~W4 완료 요약 (2026-04-19 ~ 04-20)
| 주차 | 항목 | 계획 | 실제 |
|------|------|------|------|
| W1 | Q1~Q12 (라우트/네비/배지/발견성/폴리시) | 20h | ~12h |
| W2 | M1 좌측 네비 + M2 대회 sticky | 10h | ~6h |
| W3 | M3/M5/M6 | 20h | ~7h |
| W4 | M4/M7/L1 + Day 20 회고 + 후속 정비 | 17h | ~3h |
| **합계** | **4주 + 후속** | **~67h** | **~28h** (2.4배 절감) |

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 6회 재발)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수
- **BreadcrumbItem 타입**: `@/components/shared/breadcrumb` 에서 export (L3 작업 시 재활용)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-20 | pm | **#7 위생 — index.md 중복 섹션 해소** (하단 아카이브 재명명) | ✅ 1ffedb5 |
| 04-20 | pm | **운영 DB 동기화 초안 + scratchpad 정비** (Dev/ops-db-sync-plan.md 옵션 A/B/C) | ✅ d30264f |
| 04-20 | pm | **manage 하드코딩 색상 5곳 CSS 변수화 + lessons audit** (31파일/9any 숙제 기록) | ✅ 8dfbafe |
| 04-20 | pm | **/profile/activity 탭 카운트 배지** (3탭 병렬 캐시) | ✅ e6a9169 |
| 04-20 | pm | **L3 초입 — 대회·시리즈 브레드크럼 4단** (`shared/breadcrumb.tsx` 재활용) | ✅ eb9c910 |
| 04-20 | pm | **M7 후속 — 거부 사유 저장/노출** (PATCH+prompt+알림 content) | ✅ 71b817c |
| 04-20 | pm | **오후 push PR #49/#50 MERGED** (충돌 5개 --ours) | ✅ main 반영 |
| 04-20 | pm | **W4 Day 20 회고** (L2/L3 기획서 + W1~W4 요약 + my-games 중복 제거) | ✅ 642a8be + 1119991 |
| 04-20 | pm | **W4 전체 (M4/M7/L1 + D referee 버그)** | ✅ de2c712 + c2b13c5 + e5071f0 + 12f71bf |
| 04-20 | pm | **오전 push PR #47/#48 MERGED** (W1~W3 + D 승격) | ✅ main 8475e10 |
