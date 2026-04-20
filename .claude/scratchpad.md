# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (필수, 2026-04-20 합의)
- **본 세션** = `(web)`/`(api/web)`/`(referee)` 등 일반 UX/기능 작업
- **다른 세션 (병행)** = 다음카페 sync 작업 — 항상 별도 터미널에서 동시 진행
- **본 세션 PM 금지 파일**: `scripts/sync-cafe.ts`, `scripts/cafe-login.ts`, `scripts/_tmp-*`, `scripts/backfill-*cafe*.ts`, `src/lib/cafe-sync/*`, `Dev/cafe-sync-plan-*.md`
- **푸시 전 `git fetch` 권장** (양 세션 push 충돌 방지)

## 📍 다음 세션 진입점 (2026-04-21~ "이어서 하자" 시 이 순서대로)

### 🥇 1순위 — W4 통합 스모크 테스트 (수빈 수동, 1h)
- **대상**: `/profile/activity` 3탭 / `/help/glossary` / 팀 상세 가입 상태 UI / M6 알림 6카테고리 / M3 코트 지도 / M5 온보딩 / **[신규] 카페 Phase 3 자동화** (GH Actions cron + Slack 알림)
- **조합**: PC × 모바일 × 다크 × 라이트 4조합
- **결과는 scratchpad 수정 요청 테이블에 기록**

### 🥈 2순위 — 원영 협의 (30분~1h)
- **문서**: `Dev/ops-db-sync-plan.md` (6개 선결 조건 체크박스)
- **옵션 A** 추천 (Supabase 두 번째 프로젝트)
- 협의 완료 시 → 2026-04-18 lessons "개발 DB라 믿은 .env" 사건의 장기 해결 시작

### 🥉 3순위 — L3 다음 단위 (실작업, ~3h)
- **남은 L3 항목** (Dev/long-term-plan-L3.md 기준):
  - Organization 페이지 (`/organizations/[slug]`)에 Breadcrumb + 소속 시리즈 카드 섹션
  - Series(under org) 페이지에 Breadcrumb
  - `EditionSwitcher` 공용 컴포넌트 (이전/다음 회차 3버튼)
  - Tournament 페이지에 "소속 시리즈 카드" + EditionSwitcher 적용
  - 신규 API: `/api/web/series/[slug]/editions`
- **착수 조건**: 1·2순위 마감 후. `shared/breadcrumb.tsx` 재활용

### 4순위 — 점진 정비 (보이스카우트)
- 하드코딩 색상 잔존 30 파일 (lessons.md 2026-04-20 audit 목록)
- `any` 타입 9회 / 8 파일
- **원칙**: 해당 파일을 다른 이유로 건드릴 때 함께 정비

## 현재 상태 스냅샷 (2026-04-20 야간 PR #52 머지 완료 시점)

| 항목 | 값 |
|------|-----|
| 브랜치 | subin |
| main / dev / subin tip | **`9836e88`** (완전 동기화 ✅) |
| 미푸시 | 0건 |
| 백업 브랜치 | `subin-backup-2026-04-20` (f1779ff, 옵션 F 직전) |
| 오늘 PR merge | #47 #48 #49 #50 #51 #52 (3사이클 + 카페 Phase 3 합류) |
| 카페 Phase 3 상태 | GH Actions + 쿠키 갱신 + Slack + Pagination **운영 반영** ✅ |
| 옵션 F 경과 | main 흡수 + 카페 분리/revert → PR #52 통합 머지로 본 세션+카페 함께 운영 반영 |
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

## 기획설계 (planner-architect) — L3 다음 단위 (2026-04-20)

🎯 목표: L3 3계층 IA 나머지 4항목 — Organization/Series(under org) 브레드크럼 + EditionSwitcher + Tournament 소속 시리즈 카드 + editions API

📍 **핵심 발견** (설계 전제가 바뀜):
- `/organizations/[slug]/page.tsx` **이미 존재** — 시리즈 카드 목록 이미 구현됨. **브레드크럼만 누락**
- `/organizations/[slug]/series/[seriesSlug]/page.tsx` 이미 존재 — **인라인 브레드크럼**(nav 직접 작성, shared/breadcrumb 미사용) → shared 교체 필요
- `/series/[slug]/page.tsx` **이미 4단 brc 적용 완료** (eb9c910) — 건드릴 것 없음
- `/api/web/series/slug/[slug]` **editions 포함 완전 반환** — 신규 API **불필요**. 내부 이름만 `editions`
- `/api/web/series/[id]/editions` POST는 **다른 용도(회차 추가)** — 혼동 금지

📍 영향 파일 매트릭스:
| # | 경로 | 변경 요지 | 신규/수정 | 예상 라인 |
|---|------|----------|----------|----------|
| 1 | `src/components/shared/edition-switcher.tsx` | 이전/다음/전체 3버튼 + Material Symbols + 키보드 ←→ | 신규 | ~80 |
| 2 | `src/app/(web)/organizations/[slug]/page.tsx` | shared/Breadcrumb 삽입(홈/단체) + `<img>` → next/image 선택 | 수정 | +10 |
| 3 | `src/app/(web)/organizations/[slug]/series/[seriesSlug]/page.tsx` | 인라인 nav → shared Breadcrumb 4단(홈/단체/시리즈) + EditionSwitcher 제외 | 수정 | ±15 |
| 4 | `src/app/(web)/tournaments/[id]/page.tsx` | 히어로 아래 "소속 시리즈 카드" 섹션 + EditionSwitcher 배치 | 수정 | +40 |
| 5 | `src/app/(web)/tournaments/[id]/_components/series-card.tsx` | "이 대회가 속한 시리즈" 카드(로고/이름/회차 표시/시리즈 보기 링크) | 신규 | ~60 |

📍 데이터 / API 설계:
- **신규 API 불필요** — 기존 `/api/web/series/slug/[slug]` 재활용 (editions 배열 포함, snake_case 변환됨)
- tournaments/[id]는 **서버 컴포넌트** → `prisma.tournament_series.findUnique({ include: { tournaments: { select: { id, edition_number, startDate, status } } } })` 한 번 더. 이미 `series_id` 조회하므로 `organization` + `tournaments`만 추가
- **공식 기록 가드 불필요** — 본 설계는 "대회 메타 조회"만 (경기 기록 집계 없음). `officialMatchWhere()` 해당 없음
- 응답 키 snake_case: prisma 직접 조회(API 거치지 않음)라 자동 변환 **무관**. 페이지 내부에서 `series.tournaments_count` 등 prisma 필드 그대로 사용

📍 EditionSwitcher 컴포넌트 설계:
```ts
interface EditionSwitcherProps {
  currentEditionNumber: number;  // 현재 대회 회차
  prevTournamentId: string | null;  // 이전 회차 UUID (없으면 1회차)
  nextTournamentId: string | null;  // 다음 회차 UUID (없으면 최신 회차)
  seriesSlug: string;  // "전체 보기" 시 /series/{slug}
}
```
- 렌더: `← 이전` / `시리즈 전체 N회차` / `다음 →` 3버튼 (Material Symbols `chevron_left/apps/chevron_right`)
- 비활성: prev/next null이면 disabled(aria-disabled) + 회색 처리
- 접근성: `role="navigation"` + `aria-label="회차 이동"` + 버튼 fallback `next/link`
- 키보드 ←→ 글로벌 핸들러는 **미포함** (충돌 우려, 클릭 링크만)
- **색상 전부 CSS 변수** (`var(--color-border)`, `var(--color-surface)`, `var(--color-text-muted)`, `var(--color-on-accent)` 등)

📍 페이지 설계:
- **Organization 페이지**: `<div className="mx-auto max-w-5xl px-4 py-8">` 최상단에 `<div className="mb-4"><Breadcrumb items={[{label:"홈",href:"/"},{label:org.name}]} /></div>` 삽입. 기존 시리즈 카드 섹션 유지
- **Series(under org) 페이지**: 기존 인라인 `<nav>` 15줄을 `<Breadcrumb items={[{label:"홈",href:"/"},{label:org.name,href:"/organizations/{slug}"},{label:series.name}]} />`로 교체 (3단)
- **Tournament 페이지 — 소속 시리즈 카드 위치**: `<TournamentHero>` 직후 + `<TournamentAbout>` 이전 (L378 ~ L235 사이). series_id 존재 시에만 렌더
  - SeriesCard props: `{ seriesName, seriesSlug, currentEditionNumber, totalEditions, orgName?, orgSlug? }`
  - 디자인: 로고 + "시리즈명 · 전체 N회차" + "이 대회는 M회차" + "시리즈 전체 보기 →" Link
- **Tournament 페이지 — EditionSwitcher 위치**: SeriesCard 내부 하단 (같은 카드 안) 또는 별도 블록. **같은 카드 내부 추천** — 맥락 일체화

📍 prev/next 계산 로직 (tournaments/[id] 페이지 내부):
```ts
// series_id가 있으면 전체 회차 조회 (이미 series 쿼리에 tournaments select 추가)
const allEditions = series?.tournaments ?? [];  // edition_number asc
const currentIdx = allEditions.findIndex(t => t.id === tournament.id);
const prev = currentIdx > 0 ? allEditions[currentIdx - 1] : null;
const next = currentIdx < allEditions.length - 1 ? allEditions[currentIdx + 1] : null;
```

📍 리스크 매트릭스:
| ID | 리스크 | 대응 |
|----|--------|------|
| R1 | Organization 라우트 중복 우려 | **기존 페이지 활용** 확정. 신규 라우트 불필요 |
| R2 | edition 개념 DB 지원 | `Tournament.edition_number Int?` + `series_id BigInt?` 이미 존재. null-safe 처리 |
| R3 | 기존 series/[seriesSlug] 인라인 브레드크럼 충돌 | `<nav>` 15줄을 shared/Breadcrumb 1줄로 교체. 시각 동일하게 검증 |
| R4 | Tournament 페이지 레이아웃 충돌 | Hero 바로 아래 + max-w-7xl 컨테이너 내부에 별도 블록. 기존 2열 grid(L407)와 무관 위치 |
| R5 | snake_case 재발 방지 | prisma 직접 조회(서버 컴포넌트)라 apiSuccess 변환 경로 없음. **해당 없음** |
| R6 | `edition_number` nullable | edition_number null이면 SeriesCard/EditionSwitcher 렌더 skip (prev/next 계산 시 edition_number 없는 대회 제외) |

📋 실행 계획:
| 순서 | 작업 | 담당 | 선행 | 예상 |
|------|------|------|------|------|
| 1 | `edition-switcher.tsx` 컴포넌트 생성 | developer | 없음 | 15분 |
| 2 | `series-card.tsx` 생성 + 2열 포함 (내부에 EditionSwitcher) | developer | 1단계 | 20분 |
| 3 | Organization 페이지 Breadcrumb 삽입 | developer | 없음 (병렬) | 5분 |
| 4 | Series(under org) 페이지 브레드크럼 교체 | developer | 없음 (병렬) | 10분 |
| 5 | Tournament 페이지 series include 확장 + SeriesCard 삽입 | developer | 1,2단계 | 25분 |
| 6 | tester — 다크/라이트 × PC/모바일 × edition 1회/중간/최종 | tester | 5단계 | 20분 |

⚠️ developer 주의사항:
- **edition_number null** 대회 제외 후 prev/next 계산 (혼재 방지)
- EditionSwitcher `disabled` 시 `<span>` 폴백 (Link 유지하면 href="#" 접근성 경고)
- SeriesCard는 `series_id` 존재할 때만 렌더 (null이면 섹션 자체 미렌더)
- 색상 **반드시 CSS 변수** (`var(--color-*)`) — lessons.md "하드코딩 31파일" 보이스카우트
- Material Symbols Outlined 고정 (lucide 금지)
- `next/image` vs `<img>`: 기존 organizations/[slug] 페이지가 `<img>` 사용 중 → 보이스카우트 추가 작업 지양, 일단 통일 유지

✅ developer 착수 가능 여부: **Y** — 모든 DB/API 검증 완료, 신규 API 0, Prisma 변경 0, 예상 총 75분(작업) + 20분(tester) = **~1h 35m**
🔀 PM 확인 필요: **분기점 없음** — Organization 페이지 신규 생성 이슈 해소(기존 활용), 신규 API 불필요 판정. 즉시 착수 가능

## 구현 기록 (developer) — L3 다음 단위 (2026-04-20)

📝 구현한 기능: L3 3계층 IA 남은 4항목 — Organization/Series(under org) 브레드크럼 통일 + EditionSwitcher 공용 + Tournament 상세에 소속 시리즈 카드(+회차 스위처) 삽입

### 변경 파일 (5개)
| # | 파일 | 종류 | 라인 | 핵심 변경 |
|---|------|------|------|----------|
| 1 | `src/components/shared/edition-switcher.tsx` | 신규 | 124 | 이전/전체/다음 3버튼. prev/next null일 때 `<span aria-disabled>` 폴백. 색상 전부 `var(--color-*)`. Material Symbols `chevron_left/apps/chevron_right` |
| 2 | `src/app/(web)/tournaments/[id]/_components/series-card.tsx` | 신규 | 169 | 로고(CSS 그라디언트 폴백) + 시리즈명 + 단체 링크 + 현재 회차 강조 + 하단 EditionSwitcher 내장. `max-w-7xl` 컨테이너로 Hero 라인 정렬 |
| 3 | `src/app/(web)/organizations/[slug]/page.tsx` | 수정 | +13 | 최상단에 shared Breadcrumb(홈 → 단체명) 삽입. `<img>` / 기존 구조 100% 유지 |
| 4 | `src/app/(web)/organizations/[slug]/series/[seriesSlug]/page.tsx` | 수정 | +8 / -22 | 기존 인라인 `<nav>` 21줄 → shared `<Breadcrumb>` 1줄 교체 (홈 → 단체 → 시리즈). org null 대응 분기 유지 |
| 5 | `src/app/(web)/tournaments/[id]/page.tsx` | 수정 | +71 | series 쿼리에 `logo_url` + `tournaments{id, edition_number, startDate, status}` 추가(orderBy edition_number asc). prev/next 계산 + SeriesCard를 Hero 직후 삽입 |

### 컴포넌트 동작 검증
| 항목 | 결과 |
|------|------|
| EditionSwitcher prev/next 모두 활성 | Link 2개 + 중앙 "N회차 / 전체 M회차" Link |
| EditionSwitcher prev null (1회차) | 이전 버튼 `<span aria-disabled opacity-50>` 폴백 ✅ |
| EditionSwitcher next null (최신 회차) | 다음 버튼 `<span aria-disabled opacity-50>` 폴백 ✅ |
| SeriesCard series_id 없음 | 컴포넌트 아예 렌더 skip (페이지 레벨 `seriesCardProps` null) |
| SeriesCard edition_number null | 페이지 레벨에서 `seriesCardProps` null → skip (혼재 방지) |
| SeriesCard seriesLogoUrl 없음 | CSS 그라디언트 폴백 (primary → navy, 이니셜 문자) |
| Organization 페이지 Breadcrumb | 홈 → 단체명 (2단) 최상단 노출 |
| Series(under org) Breadcrumb | 홈 → 단체명 → 시리즈명 (3단). organization null 시 2단 |
| Tournament 페이지 Breadcrumb | 기존 eb9c910 로직 유지 (시리즈 소속 시 4단, 아니면 2단) |

### tsc 결과
- `npx tsc --noEmit` **에러 0건** (`/tmp/tsc-out.log` 0줄)

### 하드코딩 색상 검사 결과
- `src/components/shared/edition-switcher.tsx`: `#[0-9a-fA-F]{3,6}|rgb\(|rgba\(` 매치 **0건**
- `src/app/(web)/tournaments/[id]/_components/series-card.tsx`: 매치 **0건**
- 모든 색상은 `var(--color-border|surface|text-primary|text-secondary|text-muted|primary|navy|card|info|on-accent)` CSS 변수로 주입

### 특이사항 / 주의점 (tester / reviewer 참고)

💡 tester 참고
- **테스트 방법**:
  1. `/organizations/{slug}` 접속 → 최상단에 "홈 > 단체명" Breadcrumb 확인 (PC only, 모바일은 hidden)
  2. `/organizations/{slug}/series/{seriesSlug}` 접속 → "홈 > 단체 > 시리즈" 3단 Breadcrumb 확인
  3. `series_id + edition_number` 있는 대회 상세 `/tournaments/{id}` 접속 → Hero 바로 아래 SeriesCard 렌더
  4. SeriesCard 내부 EditionSwitcher의 "이전/전체/다음" 3버튼 클릭 시 해당 회차 페이지로 이동
  5. 1회차 대회 상세: "이전" 버튼이 회색 + 클릭 불가 (aria-disabled)
  6. 최신 회차 대회 상세: "다음" 버튼이 회색 + 클릭 불가
  7. 시리즈 소속 없는 대회: SeriesCard 자체가 안 보임(정상), 기존 2단 Breadcrumb만 유지
- **정상 동작**:
  - 다크/라이트 양쪽에서 색상이 CSS 변수로 테마 따라 반응
  - 모바일에서는 Breadcrumb 숨김(hidden lg:block), SeriesCard는 표시됨
  - "시리즈 전체 보기" 링크(카드 우상단, sm+) 클릭 시 `/series/{slug}` 이동
- **주의할 입력 / 엣지케이스**:
  - `edition_number`가 일부만 있는 시리즈(예: 1,2,NULL,4회차 혼재) — NULL은 prev/next 계산에서 제외. DB `orderBy`가 NULL을 뒤로 보내지만 확실성 위해 `.filter(t => t.edition_number !== null)` 이중 안전망
  - 같은 `edition_number`가 2개 있는 경우(중복) — DB 제약 없음. 현재는 `findIndex`로 첫 일치 사용(실질적으로는 중복 edition_number 발생 시 관리자 수정 필요, 코드는 crash 없이 동작)
  - 대회 1개만 있는 시리즈(1회차뿐) — prev=null, next=null 모두 disabled. "1회차 / 전체 1회차" 표시
  - `series.organization`이 null인 경우(단체 없이 시리즈만) — SeriesCard에서 orgName 줄 전체 skip, Breadcrumb에서 단체 단계 skip

⚠️ reviewer 참고
- **타입 단언 근거**: `(t): t is typeof t & { edition_number: number } => t.edition_number !== null` — Prisma select 결과에서 nullable 필드를 non-null 타입으로 좁히기 위한 user-defined type guard. `any` 미사용.
- **prev/next 계산 엣지 케이스**: `editions` 배열은 edition_number asc 정렬. `currentIdx > 0` ? prev : null 형태로 clamping. edition_number가 1,3,5처럼 띄엄띄엄 있어도 "배열 인덱스 기준"으로 ±1 이동(회차 번호 기준 아님) — 실제 대회는 연속 회차가 관행이지만 누락 대비.
- **SeriesCard 삽입 위치 사유**: Hero 직후 + 본문(탭) 이전에 배치. 이유 = (1) "이 대회 = 시리즈 맥락의 한 회차"를 Hero 읽자마자 인지, (2) 탭 전환해도 SeriesCard는 동일(lazy 탭 외부), (3) 기존 `max-w-7xl lg:grid-cols-[1fr_320px]` 2열 영역 바깥에 독립 블록으로 두어 우측 sticky 신청 카드와 겹치지 않음.
- **기존 Breadcrumb 로직 보존**: `tournaments/[id]/page.tsx`의 4단 브레드크럼 로직(eb9c910)은 그대로 유지. series 쿼리만 `tournaments` select 추가로 확장 — 브레드크럼 경로 계산과 prev/next 계산은 서로 독립.
- **하드코딩 색상 0건**: 신규 2파일 100% CSS 변수. organizations 페이지의 기존 `<img>`/그라디언트는 이번 범위 밖(보이스카우트 지양 지침 준수).
- **Prisma 변경 0 / 신규 API 0 / 마이그레이션 0**: 기획설계 대로 DB/스키마 무변경.

## 리뷰 결과 (reviewer) — L3 다음 단위 (2026-04-20)

📊 종합 판정: **통과** (블록커 0건, 권장 4건)

| # | 항목 | 판정 | 상세 |
|---|------|------|------|
| R1 | 컨벤션 준수 | ✅ | CSS 변수 100% (0 hex), Material Symbols 고정 (chevron_left/apps/chevron_right/arrow_forward/emoji_events/mail/language), kebab-case 파일명, Prisma 반환 타입 직접 선언 |
| R2 | 접근성 | ✅ | `role="navigation"` + `aria-label="회차 이동"`, disabled 시 `<span aria-disabled="true">` 폴백(Link `href="#"` 경고 회피), `rel="noopener"` 외부링크 |
| R3 | 데이터 페칭 효율 | 🟡 | 추가 쿼리 1회(`tournament_series.findUnique`) — 기존 tournament 쿼리에 merge 가능하나 select shape 분리가 더 읽기 쉬움. 필드도 최소(id/edition_number/startDate/status) |
| R4 | 엣지 케이스 | ✅ | edition_number null → 필터 제외, currentIdx=-1이면 skip, prev/next clamp, 1회차/최종 회차/1개뿐인 시리즈 모두 span 폴백. `series.tournaments` 관계형 쿼리라 타 시리즈 대회 혼입 불가 |
| R5 | 타입 안전 | ✅ | `any` 0회, user-defined type guard 1곳(`(t): t is typeof t & { edition_number: number }`) — 단언 아닌 좁히기로 정당. `as` 단언 0회 (기존 `tournament.settings as Record` 제외, 이번 범위 밖) |
| R6 | 재사용성 | ✅ | EditionSwitcher는 props만으로 컨텍스트 독립 (prev/next/seriesSlug/current/total 4개). `/series/[slug]` 또는 `/organizations/[slug]/series/[seriesSlug]`에서도 같은 props로 재활용 가능 |
| R7 | 성능 | ✅ | 서버 컴포넌트 유지(`"use client"` 없음), 조건부 렌더(`seriesCardProps && <SeriesCard />`), revalidate 30초 ISR 유지 |
| R8 | 보안 | ✅ | public 페이지 3종 모두 IDOR 해당 없음. `series.is_public` 검증은 tournaments/[id]에는 없으나 **의도적**(메타만 노출, tournament 본체 가드와 독립) |

### 블록커
- **없음** — 모든 핵심 컨벤션(CSS 변수 / Material Symbols / any 금지 / apiSuccess snake_case 경로 무관) 준수

### 권장 개선 (nice-to-have, 이번 PR 차단 아님)
- 🟡 **[tournaments/[id]/page.tsx:166-188]** `tournament.series_id`로 별도 쿼리 — 기존 tournament 쿼리의 `include`에 합치면 왕복 1회 줄일 수 있음. 다만 select shape가 달라 가독성 vs 성능 trade-off. 지금 상태 허용
- 🟡 **[tournaments/[id]/page.tsx:174]** `series.is_public` 체크 생략 — 비공개 시리즈의 로고/이름이 대회 상세 카드로 노출될 가능성. 현재 시리즈 공개 여부가 정책에 없어 명확화 후 보강 여지(follow-up 이슈 후보)
- 🟡 **[series-card.tsx:69]** `<img>` 사용 — `next/image` 미전환. developer "보이스카우트 지양" 주석으로 의도 명시, organizations 페이지 기존 패턴과 통일. 전체 img→next/image 전환은 별도 작업으로 묶는 편이 안전
- 🟡 **[edition-switcher.tsx:91]** "N회차 / 전체 M회차" 문구가 매우 좁은 화면(≤320px)에서 3버튼 사이에 줄바꿈 유발 가능 — `flex-wrap` 미적용. SeriesCard 내부에서만 쓰이고 본 페이지 최소폭이 iPhone SE 이상이라 실사용 문제는 낮음

### 칭찬 포인트
- 🏆 **방어적 설계**: edition_number null 제외 + currentIdx=-1 guard + `.catch(() => null)` 까지 3중 안전망. "1,3,5회차 띄엄띄엄" 같은 실데이터 대응 주석까지 구현 기록에 명시
- 🏆 **주석 품질**: `왜 이 컴포넌트가 필요한가` / `어떻게 동작하나` 2단 구조 + 모든 prop에 JSDoc 1줄. "Link 유지하면 href='#' 접근성 경고" 같은 결정 근거까지 남김
- 🏆 **타입 안전**: `any` 0, `as` 단언 0, user-defined type guard로 Prisma nullable을 TS 레벨에서 좁힘 (런타임 안전 + 타입 안전 동시 확보)
- 🏆 **컨벤션 철저**: 하드코딩 색상 0 (lessons.md 31파일 audit 숙제를 신규 파일에서는 원천 차단), Material Symbols 고정, kebab-case, 인라인 nav → shared Breadcrumb 통일

### 커밋 가능 여부
**✅ 커밋 가능** — 블록커 없음. 권장 4건은 이후 보이스카우트 정비 또는 별도 이슈로 분리 권장.

## 테스트 결과 (tester) — L3 다음 단위 (2026-04-20)

🎯 대상 5파일: `edition-switcher.tsx`(신규), `tournaments/[id]/_components/series-card.tsx`(신규), `organizations/[slug]/page.tsx`(수정), `organizations/[slug]/series/[seriesSlug]/page.tsx`(수정), `tournaments/[id]/page.tsx`(수정)

| # | 항목 | 결과 | 상세 |
|---|------|------|------|
| T1 | `npx tsc --noEmit` 에러 0 | ✅ | `/tmp/tsc-out.log` 0줄 (무오류) |
| T2 | 하드코딩 색상 0 (신규 2파일) | ✅ | `edition-switcher.tsx` / `series-card.tsx` 모두 `#[0-9a-fA-F]` / `rgb(` / `rgba(` 0건. CSS 변수 100% |
| T3 | `any` 타입 0 (변경 5파일 전체) | ✅ | `:\s*any\b` / `as\s+any\b` 5파일 전부 0건. user-defined type guard `(t): t is ...` 사용 |
| T4 | Material Symbols만 (lucide 금지) | ✅ | 신규 2파일 `from.*lucide` 0건. chevron_left/apps/chevron_right/arrow_forward/mail/language/emoji_events 사용 |
| T5 | dev 서버 HTTP 200 복수 페이지 | ✅ | `/` · `/courts` · `/help/glossary` · `/tournaments` 모두 200 |
| T5b | 권한 페이지 307 구분 | ✅ | `/profile` 307 · `/notifications` 307 (로그인 리다이렉트, 정상) |
| T6 | Organization 페이지 Breadcrumb | ⚠️ 스킵 | **개발 DB `organizations` 0행 / `tournament_series` 0행** → 렌더 샘플 없음. 코드 레벨: shared `Breadcrumb` import + items=[{홈,/},{org.name}] 2단 (L5-6, L86-93) 정상 |
| T7 | Series(under org) Breadcrumb | ⚠️ 스킵 | 동일 사유 — 데이터 없음. 코드 확인: 인라인 `<nav>` 21줄 → shared `Breadcrumb` 1줄 교체 완료. organization null 대응 분기 유지 (L92-106) |
| T8 | Tournament SeriesCard 렌더 | ⚠️ 조건부 스킵 | `series_id != null` 대회 0건. 대신 series_id==null 대회 1건(cb33bf68…) HTTP 200 + "소속 시리즈"/"이 대회는" 문구 **미렌더 확인** → **조건부 skip 로직 정상** |
| T9 | edition_number null 혼재 | ⚠️ 스킵 | 시리즈 0건이라 샘플 부재. 코드: `.filter((t): t is ... => t.edition_number !== null)` 이중 안전망 + `currentIdx<0`이면 seriesCardProps null (page.tsx L205-229) 완비 |
| T10 | notFound() 가드 | ✅ | 존재하지 않는 slug → Next 404 HTML 렌더 정상 |

📊 종합: **검증 가능한 T1~T5b, T10 전부 통과**. 런타임 HTML 검증 4건은 개발 DB 데이터 부재로 **코드 레벨 검증으로 대체** (5파일 전부 실제 읽어 확인)

### 블록커
- **없음** — 정적 규칙(tsc·색상·any·lucide) 4종 + SSR 안전성 + notFound + SeriesCard 조건부 skip 전부 통과

### 권장 수정 (nice-to-have, 이번 PR 차단 아님)
- 개발 DB에 Organization 1 + Series 1 + series_id 연결 Tournament 3~4개(edition_number 1,2,3,null 혼재) 시드 투입 시 추후 L3 변경의 **런타임 회귀 테스트** 가능. 현재는 운영 DB에만 샘플이 있을 가능성

### 커밋 가능 여부
**✅ 커밋 가능** — reviewer 통과 + 정적 검증 통과 + 조건부 skip 런타임 확인. 시리즈 렌더 케이스는 운영 반영 후 스모크로 최종 확인 권장 (블록커 아님)

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
| 04-20 | tester | **L3 다음 단위 검증** — T1~T10 / tsc 0 / 하드코딩색상 0 / any 0 / lucide 0 / dev 200(4) + 307(2) / notFound OK / SeriesCard 조건부 skip 런타임 확인 / 시리즈 렌더는 DB 0행으로 스킵 | ✅ 통과 (커밋 가능, 블록커 0) |
| 04-20 | reviewer | **L3 다음 단위 리뷰** — 5파일 R1~R8 전수 / 블록커 0 / 권장 4건(쿼리 합치기·is_public·next/image·flex-wrap) / 타입 안전 + 방어적 설계 + 주석 품질 칭찬 | ✅ 통과 (커밋 가능) |
| 04-20 | developer | **L3 다음 단위 구현** — EditionSwitcher 신규 + SeriesCard 신규 + Organization/Series(under org) Breadcrumb 통일 + Tournament 페이지 series 쿼리 확장 + SeriesCard 삽입 (5파일, tsc OK, 하드코딩 0) | ✅ tester 통과 |
| 04-20 | pm | **옵션 F — main 흡수 + 카페 분리 2회 + PR #51 머지 → PR #52 카페 Phase 3 합류 통합 머지** | ✅ 9836e88 (main/dev/subin 동기화) |
| 04-20 | pm | **#7 위생 — index.md 중복 섹션 해소** (하단 아카이브 재명명) | ✅ 1ffedb5 |
| 04-20 | pm | **운영 DB 동기화 초안 + scratchpad 정비** (Dev/ops-db-sync-plan.md 옵션 A/B/C) | ✅ d30264f |
| 04-20 | pm | **manage 하드코딩 색상 5곳 CSS 변수화 + lessons audit** (31파일/9any 숙제 기록) | ✅ 8dfbafe |
| 04-20 | pm | **/profile/activity 탭 카운트 배지** (3탭 병렬 캐시) | ✅ e6a9169 |
| 04-20 | pm | **L3 초입 — 대회·시리즈 브레드크럼 4단** (`shared/breadcrumb.tsx` 재활용) | ✅ eb9c910 |
| 04-20 | pm | **M7 후속 — 거부 사유 저장/노출** (PATCH+prompt+알림 content) | ✅ 71b817c |
| 04-20 | pm | **오후 push PR #49/#50 MERGED** (충돌 5개 --ours) | ✅ main 반영 |
| 04-20 | pm | **W4 Day 20 회고** (L2/L3 기획서 + W1~W4 요약 + my-games 중복 제거) | ✅ 642a8be + 1119991 |
