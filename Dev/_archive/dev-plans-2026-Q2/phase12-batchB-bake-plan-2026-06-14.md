# Phase 12 Batch B (DB 연결 7화면) 데이터 실측 + 박제 설계

> 작성: planner-architect · 2026-06-14 · **read-only (코드·DB 변경 0)**
> Batch A(RI1/SF1/CC1/GL1/SH1/AW1)는 완료·커밋됨. 본 설계는 Batch B 7화면.
> 실측 방법: 각 화면 기존 page.tsx 데이터패칭 정독 + `schema.prisma` grep + 시안 정독.
> **운영 SELECT 0회** — 7화면 데이터원이 전부 schema grep + 기존 page.tsx 정독으로 확정돼 추가 실측 불필요.

---

## ★ 최우선 — SE1 라우트 결론

| 항목 | 결과 |
|------|------|
| `src/app/(web)/series/[slug]/page.tsx` | **존재** (동적 라우트 = `[slug]`, `[id]` 아님) |
| `src/app/(web)/series/[slug]/series-detail-tabs.tsx` | 존재 (client 4탭) |
| 현재 박제 상태 | **이미 완전 박제됨** — DB 와이어 완료 (`tournament_series` + `tournaments`) |

**결론: SE1은 신규 라우트 신설 불필요(Stop condition 미해당). 단, "신규 박제"도 사실상 불필요.**

기존 `[slug]/page.tsx`는 이미:
- `tournament_series.findUnique({ where: { slug }, include: { organization, tournaments } })` 로 회차 계보 실데이터 와이어
- hero(설립연도·tournaments_count) / 4탭(회차계보·명예의전당·통계·소개) / sticky aside(다음 회차 + 알림 disabled) 완비
- 시안 SeriesDetail.jsx가 요구하는 "회차/누적순위"는 **회차=실데이터 와이어 완료**, **누적순위(명예의전당=우승팀/MVP)=DB 미지원 폴백**("추후 제공 예정")으로 이미 정직 처리됨

→ **SE1 권장 처리 = 옵션 A(시각만 미세 정합) 또는 옵션 SKIP**. 자세한 권장은 §SE1 참조. **데이터패칭은 절대 변경 0**.

---

## §1 화면별 데이터 출처 실측 (mock 0 — lesson-sian-db-assumption)

| ID | 화면 | 라우트 | 의뢰 가정 | **실측 결과** | 박제 전략 |
|----|------|--------|----------|-------------|----------|
| ST1 | Stats | `/stats` | match_player_stats 집계 | 테이블 실재하나 **본인 시즌집계 경로 미구현**·기존 100% 더미 | **준비중 빈상태** |
| CA1 | Calendar | `/calendar` | 본인 games/tn 일정 집계 | **집계 API/모델 부재**·기존 100% 더미 | **준비중 빈상태** |
| SV1 | Saved | `/saved` | saved/bookmark 실측 | **이미 DB 연결**(board_favorites + user_favorite_courts 2모델 실재) | **실데이터 보존 + 시각만 v2.31** |
| SE1 | SeriesDetail | `/series/[slug]` | series + 회차/누적순위 | 라우트 존재·**이미 회차 실데이터 와이어** | **시각 미세정합 or SKIP** |
| TV1 | TeamInvite | `/team-invite` | invite token 실측 | **TeamInvitation 테이블 부재**(grep 0) | **준비중 빈상태** |
| CV1 | CourtAdd | `/courts/submit` | courts pending INSERT 폼 | **court_submissions 테이블 부재**(grep 0) | **정적 폼 박제(제출 noop)** |
| SC1 | Scrim | `/scrim` | DB 미연결 가능 | **scrim_* 테이블 부재**(grep 0) | **준비중 빈상태** |

### schema grep 실측 근거 (운영 SELECT 0)
```
scrim_*            → 0건  (Scrim 모델 부재)
court_submission*  → 0건  (코트 제보 모델 부재)
team_invit*        → 0건  (팀 초대 모델 부재)
board_favorites    → schema L1015 실재  ← SV1
user_favorite_courts → schema L2097 실재 ← SV1
match_player_stats → schema L786 실재 (인덱스 points/assists/total_rebounds) ← ST1 잠재
```

---

## 화면별 박제 명세

### ST1 — Stats (`/stats`) · 준비중 빈상태

- **시안**: `Stats.jsx` (KPI 8칸 + 3탭[요약/슈팅존/경기로그] + 추이SVG + 클럽순위). 화면별 토큰 `.st-*` (extras-pages.css L?~, 23종).
- **데이터 실측**: `match_player_stats`는 실재하나, **시안이 요구하는 "본인 시즌 집계"는 (a) 로그인 user → 본인이 출전한 ttp 목록 매핑 (b) 시즌(분기) 경계 정의 (c) 슈팅존/스플릿/클럽랭킹 모델** 이 모두 부재. 기존 page.tsx도 100% 더미(TOTALS/ZONES/GAME_LOG/TREND/RANKINGS 상수).
- **결론**: 시즌 스탯 대시보드 전체를 실데이터로 채우려면 신규 집계 로직·시즌 모델 필요 → **신규 DB/대형 신규 로직 = Stop condition**. 따라서 **준비중 빈상태**.
- **박제 명세**:
  - `"use client"` → server 단순화 (인터랙션 0 → 빈상태). 기존 더미 상수(TOTALS/SPLITS/ZONES/GAME_LOG/TREND/RANKINGS) **전량 삭제**(mock❌).
  - 셸 = `.ex-crumb`(홈›프로필›스탯분석) + `.ex-head`(eyebrow ADVANCED STATS + 타이틀 + sub) + `.ex-empty`(아이콘 `query_stats` + "시즌 스탯 분석 준비 중" + "경기 기록이 쌓이면 개인 스탯 대시보드를 제공합니다").
  - **AW1 awards가 이미 시즌 리더(득점/어시/리바)를 운영 노출 중** → ST1 빈상태 안내에 "현재 시즌 순위는 어워드 페이지에서 확인" CTA(`/awards`) 1개 옵션(선택).
- **규모/위험**: -450 LOC(더미 대량 삭제) / 위험 낮음.

### CA1 — Calendar (`/calendar`) · 준비중 빈상태

- **시안**: `Calendar.jsx` (월 그리드 + 다가오는 일정 사이드). 토큰 `.cal-*`(33종).
- **데이터 실측**: 본인 일정 통합 집계는 `game_applications + guest_applications + tournament_matches + scrim` 다종 join API가 필요한데 **부재**. 기존 page.tsx도 100% 더미(EVENTS 17건 상수 + 하드코딩 TODAY).
- **결론**: 통합 일정 집계 API 신규 = 대형 신규 로직 → **준비중 빈상태**.
- **박제 명세**:
  - `"use client"` → server 단순화. 기존 더미 EVENTS/월그리드 계산/필터/뷰토글 **전량 삭제**.
  - 셸 = `.ex-crumb`(홈›내 일정) + `.ex-head`(CALENDAR · 내 일정) + `.ex-empty`(아이콘 `calendar_month` + "내 일정 준비 중" + "참가 예정 경기·대회·코트 예약을 한 달력에서 관리하는 기능을 준비 중입니다").
- **규모/위험**: -750 LOC(더미·달력계산 대량 삭제) / 위험 낮음.

### SV1 — Saved (`/saved`) · ★실데이터 보존 + 시각만 v2.31

- **★중요: 의뢰 가정과 달리 이미 DB 연결됨.** 기존 `page.tsx`(server)가:
  - `board_favorites`(즐겨찾는 게시판) + `user_favorite_courts`(즐겨찾는 코트 + courts join) 2모델 **본인 데이터 실조회**
  - `getWebSession()` 인증 / BigInt→string·Date→ISO 직렬화 / IDOR 가드 완비
  - 비로그인 → 인라인 로그인 유도 카드
  - 미지원 5탭(게시글/경기/대회/팀) = 북마크 테이블 부재 → 빈배열 + "북마크 시스템 준비 중"
- **시안**: `Saved.jsx` (5탭[전체/경기/대회/팀/코트] + `.sv-grid-2/3/4` 타일). 토큰 `.sv-*`(19종).
- **결론**: **데이터패칭 100% 보존(page.tsx diff 최소)**. `_v2/saved-content.tsx`(client)만 시안 `.sv-*` 시각으로 교체.
- **박제 명세**:
  - `page.tsx`(server) = **변경 0 또는 최소**(데이터패칭·세션·직렬화·CATEGORY_LABEL 보존). SavedBoard/SavedCourt DTO 계약 유지.
  - `_v2/saved-content.tsx`(client) = 시안 `.sv-*` 그리드로 시각 교체. **단 시안 더미(games/tns/teams 픽업/MONKEYZ 등) 박제 금지** — 실데이터(courts·boards)만 타일로, **현재 미지원 탭(경기/대회/팀)은 "북마크 준비 중" 빈상태 유지**(mock❌).
  - 시안 5탭 라벨(전체/경기/대회/팀/코트) → 실데이터 매핑: **코트=user_favorite_courts**, **게시판=board_favorites**(시안엔 "게시판" 탭 부재 → 기존 게시판 탭 보존 + 시안 코트 그리드 시각 적용). 시안 탭과 실모델 차이는 **실모델 우선**.
  - ★snake_case 함정: page.tsx는 server prisma 직접이라 camel→DTO 직렬화. SavedContent는 page가 만든 DTO(camel: courtPublicId·rentalFee 등)를 그대로 받음(apiSuccess 미경유 server prop). 신규 fetch 0.
- **규모/위험**: page.tsx ~0 / saved-content.tsx +시각 / 위험 **중**(실데이터 와이어 보존 의무·진행중 인증/IDOR 회귀 금지).

### SE1 — SeriesDetail (`/series/[slug]`) · 시각 미세정합 or SKIP

- **라우트**: `[slug]` 존재(신규 신설 0). 기존 `page.tsx`(server·unstable_cache 30s ISR) + `series-detail-tabs.tsx`(client 4탭).
- **현 데이터 와이어**(전부 실데이터):
  - hero = series.name / tournaments_count / 설립연도(created_at) / organization.name
  - editions 탭 = `tournaments`(edition_number desc, is_public 가드) 실회차 목록 → 각 행 클릭 = `/tournaments/[id]`(cross-domain)
  - stats 탭 = 누적회차/누적참가팀/현재진행중(실집계) + 평균득점(폴백 "-")
  - honors(명예의전당) 탭 = winner/MVP 컬럼 부재 → "추후 제공 예정" 폴백
  - about 탭 = description/host/설립/방식
  - aside = latestActive(registration_open/ongoing/published) → 참가신청 CTA / 알림 disabled
- **시안 SeriesDetail.jsx 대비 차이**: 시안 = `.se-hero` + `.se-2col`(회차 카드 + **시즌 누적 순위 사이드**). 시안의 "시즌 누적 순위"(lead 5팀 320p 등)는 **포인트 누적 모델 부재** → 운영은 honors 탭 "추후 제공"으로 이미 정직 처리. 시안 더미 순위(강남BC 320p 등) 박제 ❌.
- **결론 — 2옵션 (PM 결정 필요)**:
  - **옵션 A (권장·미세정합)**: 기존 page.tsx 데이터패칭 **diff 0** 유지. series-detail-tabs.tsx 시각만 v2.31 `.se-*` 토큰/레이아웃으로 정합(회차 카드 시안 스타일). 시즌 누적 순위는 **빈상태/추후 제공 유지**(mock❌). 회귀 위험 낮음.
  - **옵션 SKIP (대안)**: 현 박제가 이미 v2.x 운영 품질로 충실(회차 실데이터·정직한 폴백) → **Batch B에서 제외**하고 6화면만 진행. 시안 대비 유일 갭("시즌 누적 순위" 시각)이 DB 미지원이라 박제해도 빈상태.
- **규모/위험**: 옵션A = series-detail-tabs.tsx 시각만(데이터 0) / 위험 낮음. 옵션SKIP = 0.

### TV1 — TeamInvite (`/team-invite`) · 준비중 빈상태

- **시안**: `TeamInvite.jsx`(초대 배너 + 팀 레이팅/전적/멤버 + 수락/거절). 토큰 `.ti-*`(20종).
- **데이터 실측**: `TeamInvitation` 테이블 **부재**(grep 0). 초대코드/만료/메시지/등번호 필드 없음. `user_team_membership.status`만 존재(초대 흐름 모델 아님). 기존 page.tsx = 100% 인라인 박제(`team-invite-client.tsx`).
- **결론**: 초대 모델 신규 = Stop condition → **준비중 빈상태**(또는 시안 카드 시각만 박제하되 수락/거절 noop). **권장 = `.ex-empty` 빈상태**("팀 초대 기능 준비 중") — 시안 카드를 실데이터 없이 박제하면 가짜 초대(MONKEYZ 1812 등) 노출 위험(mock❌).
- **박제 명세**: `_v2/team-invite-client.tsx` 인라인 더미(MNK/monkey_cap/1812/18-6) **전량 삭제** → `.ex-empty`(아이콘 `group_add` + "팀 초대 준비 중" + "팀장이 보낸 초대를 수락하는 기능을 준비 중입니다"). page.tsx metadata 보존.
- **규모/위험**: -client 더미 / 위험 낮음.

### CV1 — CourtAdd (`/courts/submit`) · ★정적 폼 박제 (제출 noop)

- **시안**: `CourtAdd.jsx`(스텝 닷 + 코트명/지역/유형/주소/시간/이용료/편의시설칩/사진업로드/설명 + 제보 제출). 토큰 `.fm-*`(27종).
- **데이터 실측**: `court_submissions` 테이블 **부재**(grep 0). 기존 page.tsx도 "DB 미존재 → 제출 시 alert/완료화면 분기만" 명시(`_form/court-submit-form.tsx`).
- **결론**: INSERT 대상 테이블 부재 → **신규 DB = Stop condition**. **정적 폼 박제(입력 가능·제출 noop)**. 빈상태가 아니라 **폼 자체는 시안대로 박제**(SF1/RI1처럼 정적 시안 = mock 아님, 입력 UI는 실제 제출 미연결).
- **박제 명세**: `_form/court-submit-form.tsx` 시안 `.fm-*`(필드/행/체크칩/업로드/노트/액션)로 시각 교체. **제출 = `alert("준비 중")` 또는 완료화면 분기 유지**(INSERT 0). 편의시설 칩 toggle(useState)·사진 dropzone UI만(업로드 미동작). 시안 placeholder(예: 장충체육관 보조경기장)는 placeholder라 mock 아님(룰 허용).
- **규모/위험**: 시각 교체 / 위험 낮음(제출 흐름 미연결 명시).

### SC1 — Scrim (`/scrim`) · 준비중 빈상태

- **시안**: `Scrim.jsx`(내 팀 me-bar + 3탭[상대찾기/받은제안/보낸제안] + 카드). 토큰 `.sc-*`(23종).
- **데이터 실측**: `scrim_*` 테이블 **부재**(grep 0). 기존 page.tsx도 "DB 0% — 시안 더미 상수"(OPEN_REQS/INCOMING/OUTGOING/HISTORY) 명시.
- **결론**: 스크림 매칭 모델 신규 = Stop condition → **준비중 빈상태**.
- **박제 명세**: 기존 더미 4상수 + 3탭 + me-bar + ResponsiveTable **전량 삭제** → `.ex-crumb`(홈›스크림 매칭) + `.ex-head`(스크림 · SCRIMMAGE) + `.ex-empty`(아이콘 `handshake` + "스크림 매칭 준비 중" + "팀 vs 팀 연습경기 상대를 찾고 제안을 주고받는 기능을 준비 중입니다"). `"use client"` 제거 가능(인터랙션 0).
- **규모/위험**: -480 LOC / 위험 낮음.

---

## §2 CSS 토큰 이식 (extras-pages.css → globals.css)

Batch A에서 `.ex-*` 공통 셸(crumb/head/chips/tabs/empty/page-w/narrow/wide)은 **이미 이식 완료**(globals.css L6394~). Batch B는 화면별 토큰 블록을 추가 이식:

| 토큰군 | 화면 | extras-pages.css 정의 | 이식 여부 |
|--------|------|----------------------|----------|
| `.st-*` (23) | ST1 | 실재 | **단, ST1=빈상태면 미사용 → 이식 보류 가능** |
| `.cal-*` (33) | CA1 | 실재 | CA1=빈상태면 보류 가능 |
| `.sv-*` (19) | SV1 | 실재 | **이식 필수**(SV1 실데이터 타일) |
| `.se-*` (24) | SE1 | 실재 | 옵션A 시 이식 / SKIP 시 보류 |
| `.sc-*` (23) | SC1 | 실재 | SC1=빈상태면 보류 가능 |
| `.ti-*` (20) | TV1 | 실재 | TV1=빈상태면 보류 가능 |
| `.fm-*` (27) | CV1 | 실재 | **이식 필수**(CV1 폼 시각) |

→ **빈상태 5화면(ST1/CA1/SC1/TV1)은 `.ex-empty`만 쓰므로 화면별 토큰 이식 불필요**. **이식 필수 = `.sv-*`(SV1) + `.fm-*`(CV1)** + (옵션A 시 `.se-*`).
→ Batch A처럼 globals.css **끝에 append**(.page__inner 충돌은 이미 .ex-page-w로 회피됨).

### 토큰 치환 표준 (Batch A 답습)
| 시안 (폐기/하드코딩) | → 운영 토큰 |
|---------------------|------------|
| `--r-lg` / `--r-md` | `--radius-card` |
| `--r-sm` / `--r-xs` | `--radius-chip` |
| `--err` / `--err-soft` | `--color-error` / `--accent-soft` |
| `#8B5A0F` (warn 텍스트) | `--warn` |
| `#F4C76C` (aw-season) | — (AW1=Batch A 완료, B 무관) |
| `#1A1E27`·`#2B3242`·`#0F234F` (hero 그라디언트) | `--bdr-navy` 계열 |
| `#fff` (브랜드 배경 흰 글자) | `--ink-on-brand`(권장) — 의도색이라 동작영향0 |
| pill `9999px` | 정사각 원형은 `50%` (9999px 회피) |
| 강조색 | `--cafe-blue` 계열 (빨강=`--accent`는 의도색만: ti-banner·me-bar av 등 HANDOFF 확정) |

---

## §3 AppNav active (§1 frozen)

`app-nav.tsx` L196 `isActive(t.href)` = **pathname 자동판정**. page active prop 조작 금지.

| ID | 라우트 | active 탭 |
|----|--------|----------|
| ST1 | /stats | **rank**(랭킹) |
| CA1 | /calendar | **more**(더보기) |
| SV1 | /saved | **more**(더보기) |
| SE1 | /series/[slug] | **tn**(대회) |
| TV1 | /team-invite | **team**(팀) |
| CV1 | /courts/submit | **court**(코트) |
| SC1 | /scrim | **games**(경기) |

→ 전부 pathname 자동판정으로 위 active 처리됨. 박제 시 **active prop 추가/조작 0**.

---

## §4 실행 계획

| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | CSS 이식: `.sv-*` + `.fm-*` (+옵션A 시 `.se-*`) globals.css append + 토큰 치환 | developer | 없음 |
| 2 | 빈상태 4화면(ST1/CA1/SC1/TV1) — 더미 삭제 + `.ex-empty` 셸 | developer | 없음(병렬 가능) |
| 3 | CV1 정적 폼 — `.fm-*` 시각 교체(제출 noop 유지) | developer | 1 |
| 4 | SV1 — saved-content.tsx 시각 교체(데이터패칭 보존·미지원탭 빈상태) | developer | 1 |
| 5 | SE1 — 옵션A: series-detail-tabs.tsx 시각 정합(데이터 diff 0) / SKIP: 생략 | developer | 1(옵션A) |
| 6 | 검증 — tester + reviewer 병렬 | tester+reviewer | 1~5 |

→ **빈상태 4화면(2)은 옵션 B(tester만) 가능**. **SV1(4)·CV1(3)·SE1(5)는 reviewer 병렬**(실데이터/폼 회귀 검증).

---

## §5 규모/위험 종합

| ID | 전략 | 규모 | 위험 |
|----|------|------|------|
| ST1 | 준비중 | -450 LOC | 낮음 |
| CA1 | 준비중 | -750 LOC | 낮음 |
| SV1 | 실데이터 보존+시각 | page0 / content 시각 | **중**(인증·IDOR·데이터패칭 회귀 금지) |
| SE1 | 시각정합 or SKIP | tabs 시각 / 0 | 낮음 |
| TV1 | 준비중 | -client 더미 | 낮음 |
| CV1 | 정적 폼 | 시각 교체 | 낮음(제출 미연결) |
| SC1 | 준비중 | -480 LOC | 낮음 |

---

## Stop conditions 점검 (설계 반영 완료)

| 조건 | 준수 |
|------|------|
| 신규 라우트 신설 ❌ | ✅ SE1 라우트 존재 → 신설 0. 나머지 6화면 라우트 전부 기존재 |
| 신규 DB ❌ | ✅ ST1/CA1/TV1/CV1/SC1 = 모델 부재 → 준비중/정적(신규 테이블 0). SV1=기존 2모델 재사용 |
| mock 더미 ❌ | ✅ 빈상태 4화면 더미 전량삭제 / SV1 시안더미 박제금지(실데이터만) / SE1 시안 누적순위 박제금지 |
| api/v1 ❌ | ✅ 7화면 모두 무관 |
| AppNav 재구성 ❌ | ✅ active prop 조작 0(pathname 자동) |
| 하드코딩hex·emoji·lucide·pill9999 ❌ | ✅ 토큰 치환표 적용 / 이모지→Material Symbols / 9999→50% |
| 데이터패칭·API 변경 0 | ✅ SV1 page.tsx 데이터패칭 보존 / SE1 데이터패칭 diff 0 / 나머지 패칭 0 |

---

## PM 확인 필요 (2건)

1. **SE1 처리** — 옵션 A(시각 미세정합, 데이터 diff 0) vs SKIP(이미 충실 박제 → 6화면만 진행). **권장 = SKIP 또는 옵션 A**. 시안 대비 유일 갭("시즌 누적 순위")이 DB 미지원이라 박제해도 빈상태.
2. **TV1/CV1 처리 일관성** — TV1=빈상태(가짜 초대 노출 방지) vs CV1=정적 폼 박제(입력 UI 유지). 둘 다 DB 부재지만 CV1은 "폼 입력→noop"이 SF1/RI1 정적 박제 패턴과 동형이라 폼 박제 권장, TV1은 "가짜 초대 카드"가 mock 위험이라 빈상태 권장. **이 비대칭 처리 승인 여부.**
