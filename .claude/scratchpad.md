# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (필수, 2026-04-20 합의)
- **본 세션** = `(web)`/`(api/web)`/`(referee)` 등 일반 UX/기능 작업
- **다른 세션 (병행)** = 다음카페 sync 작업 — 항상 별도 터미널에서 동시 진행
- **본 세션 PM 금지 파일**: `scripts/sync-cafe.ts`, `scripts/cafe-login.ts`, `scripts/_tmp-*`, `scripts/backfill-*cafe*.ts`, `src/lib/cafe-sync/*`, `Dev/cafe-sync-plan-*.md`
- **푸시 전 `git fetch` 권장** (양 세션 push 충돌 방지)

## 📍 다음 세션 진입점 (2026-04-21~ "이어서 하자" 시 이 순서대로)

### 🥇 1순위 — W4 + L3 통합 스모크 테스트 (수빈 수동, 1h)
- **W4**: `/profile/activity` 3탭 / `/help/glossary` / 팀 상세 가입 UI / M6 알림 6카테고리 / M3 코트 지도 / M5 온보딩 / 카페 Phase 3 자동화
- **[신규] L3**: Organization 2단 / Series(under org) 3단 / Tournament 소속 시리즈 카드 + EditionSwitcher (1회차/중간/최종/null 혼재)
- **조합**: PC × 모바일 × 다크 × 라이트 4조합
- **결과는 scratchpad 수정 요청 테이블에 기록**
- **개발 DB 시드 follow-up**: Organization 1 + Series 1 + Tournament 3~4개(edition_number 1,2,3,null 혼재) — 추후 회귀 테스트용

### 🥈 2순위 — 원영 협의 (30분~1h)
- **문서**: `Dev/ops-db-sync-plan.md` (6개 선결 조건 체크박스)
- **옵션 A** 추천 (Supabase 두 번째 프로젝트)
- 협의 완료 시 → 2026-04-18 lessons "개발 DB라 믿은 .env" 사건의 장기 해결 시작

### 🥉 3순위 — 점진 정비 (보이스카우트)
- 하드코딩 색상 잔존 30 파일 (lessons.md 2026-04-20 audit 목록)
- `any` 타입 9회 / 8 파일
- **원칙**: 해당 파일을 다른 이유로 건드릴 때 함께 정비

### 4순위 — L3 reviewer 권장 후속 (nice-to-have)
- tournaments/[id] 쿼리 합치기 (series.findUnique → tournament include에 merge)
- `series.is_public` 체크 — 비공개 시리즈 노출 정책 명확화
- `<img>` → `next/image` 전환 (organizations 페이지 + series-card.tsx) — 별도 작업
- EditionSwitcher flex-wrap (≤320px 대응)

## 현재 상태 스냅샷 (2026-04-21 L3 완료 직후)

| 항목 | 값 |
|------|-----|
| 브랜치 | subin |
| subin HEAD | **`a6b329f`** (L3 다음 단위) |
| origin/subin | `c94e32f` (뒤 1건) |
| main / dev | `9836e88` (완전 동기화) |
| 미푸시 | **1건** (a6b329f L3) |
| 백업 브랜치 | `subin-backup-2026-04-20` (f1779ff, 옵션 F 직전) |
| 오늘 PR merge | #47 #48 #49 #50 #51 #52 (3사이클) |
| L3 상태 | Organization/Series(under org) Breadcrumb + EditionSwitcher + SeriesCard **로컬 구현 완료**, 미푸시 |
| 카페 Phase 3 상태 | GH Actions + 쿠키 갱신 + Slack + Pagination **운영 반영** ✅ |

## W1~W4 + L3 완료 요약 (2026-04-19 ~ 04-21)
| 주차/항목 | 내용 | 계획 | 실제 |
|------|------|------|------|
| W1 | Q1~Q12 (라우트/네비/배지/발견성/폴리시) | 20h | ~12h |
| W2 | M1 좌측 네비 + M2 대회 sticky | 10h | ~6h |
| W3 | M3/M5/M6 | 20h | ~7h |
| W4 | M4/M7/L1 + Day 20 회고 + 후속 정비 | 17h | ~3h |
| L3 | Organization brc + EditionSwitcher + SeriesCard | 3h | ~1.5h |
| **합계** | **4주 + L3** | **~70h** | **~29.5h** (2.4배 절감) |

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## 운영 팁
- **gh 인증 풀림**: `GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | grep ^password= | cut -d= -f2) gh ...`
- **tsx 환경변수**: `npx tsx --env-file=.env.local scripts/xxx.ts` (Node 22)
- **포트 죽이기**: `netstat -ano | findstr :<포트>` → `taskkill //f //pid <PID>` (node.exe 통째 금지)
- **신규 API 필드**: 추가 전 curl 1회로 raw 응답 확인 (snake_case 6회 재발)
- **공식 기록 쿼리**: `officialMatchWhere()` 유틸 필수
- **BreadcrumbItem 타입**: `@/components/shared/breadcrumb` 재활용
- **EditionSwitcher**: `@/components/shared/edition-switcher` 에서 export (시리즈 회차 네비 재활용)

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-20 | pm | **L3 다음 단위 5파일 완성** — EditionSwitcher+SeriesCard 신규 + Organization/Series(under org) Breadcrumb + Tournament series include. tester 10/10 / reviewer 통과 (블록커 0, 권장 4) | ✅ a6b329f (미푸시) |
| 04-20 | pm | **옵션 F — main 흡수 + 카페 분리 2회 + PR #51 머지 → PR #52 카페 Phase 3 합류 통합 머지** | ✅ 9836e88 (main/dev/subin 동기화) |
| 04-20 | pm | **#7 위생 — index.md 중복 섹션 해소** (하단 아카이브 재명명) | ✅ 1ffedb5 |
| 04-20 | pm | **운영 DB 동기화 초안 + scratchpad 정비** (Dev/ops-db-sync-plan.md 옵션 A/B/C) | ✅ d30264f |
| 04-20 | pm | **manage 하드코딩 색상 5곳 CSS 변수화 + lessons audit** (31파일/9any 숙제 기록) | ✅ 8dfbafe |
| 04-20 | pm | **/profile/activity 탭 카운트 배지** (3탭 병렬 캐시) | ✅ e6a9169 |
| 04-20 | pm | **L3 초입 — 대회·시리즈 브레드크럼 4단** (`shared/breadcrumb.tsx` 재활용) | ✅ eb9c910 |
| 04-20 | pm | **M7 후속 — 거부 사유 저장/노출** (PATCH+prompt+알림 content) | ✅ 71b817c |
| 04-20 | pm | **오후 push PR #49/#50 MERGED** (충돌 5개 --ours) | ✅ main 반영 |
| 04-20 | pm | **W4 Day 20 회고** (L2/L3 기획서 + W1~W4 요약 + my-games 중복 제거) | ✅ 642a8be + 1119991 |
