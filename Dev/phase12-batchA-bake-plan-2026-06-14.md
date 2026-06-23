# Phase 12 Batch A — 박제 설계서 (정적/저위험 6화면)

> 작성: planner-architect · 2026-06-14 · **read-only 분석/설계만 (코드·DB 변경 0)**
> 대상: v2.31 Phase 11/12 Batch A — RI1/SF1/CC1/GL1/SH1/AW1
> 원칙: 0스키마 / mock 더미 ❌(미연결=준비중 빈상태) / 신규 라우트 ❌ / /api/v1 ❌ / 데이터패칭·API 변경 0 / 하드코딩 hex·emoji·lucide·pill9999 ❌

---

## §0. 요약 — 화면별 데이터 출처 확정 (★운영 SELECT 1회 실측 기반)

| ID | 화면 | 라우트 | **데이터 출처 확정** | 박제 전략 | AppNav active |
|----|------|--------|----------------------|-----------|---------------|
| RI1 | RefereeInfo | `/referee-info` | **정적 안내 (0 스키마)** | 시안 그대로 박제 (마케팅 랜딩) | `more` |
| SF1 | Safety | `/safety` | **정적 안전가이드 (DB 0%)** | 시안 6카드 박제 (현 4탭 더미 → 시안 정적 안내로 교체) | `more` |
| CC1 | Coaches | `/coaches` | **준비중** (TTP.role coach 4건 ≠ 레슨 코치 도메인) | 시안 박제 + 빈상태 "준비중" | `more` |
| GL1 | Gallery | `/gallery` | **준비중** (news_photo 1건·is_hero 0 / 앨범 테이블 0) | 시안 박제 + 빈상태 "준비중" | `more` |
| SH1 | Shop | `/shop` | **준비중** (운영 미연결 확정) | 시안 박제 + 빈상태 "준비중" | `more` |
| AW1 | Awards | `/awards` | **기존 실데이터 쿼리 100% 보존** (서버 prisma 직결) | **UI 셸만 v2.31 시각 교체** / 데이터 패칭 0 변경 | `rankings` |

### ★ 운영 DB 실측 결과 (SELECT only · 운영 영향 0)
```
GL1 news_photo total: 1 / is_hero: 0          → 사실상 비어있음 = 준비중
CC1 TTP.role: coach 4 / player 1018           → coach 4건은 대회 출전 코칭스태프(=레슨 코치 아님) = 준비중
AW1 mvp public 대회: 0 / champion public: 0    → MVP·우승팀 현재 0건 (page.tsx가 "준비중" 자동 폴백)
AW1 active series(public): 3 / mps: 2375       → 시즌 리더(득점/어시/리바왕)는 raw SQL로 산출 가능
```

**lesson-sian-db-assumption 적용 결과**: 시안 6화면 중 GL1/CC1/SH1은 시안 HANDOFF가 더미 데이터로 그려졌으나 운영 실측 결과 **실데이터 없음 → 준비중 빈상태가 정답**(mock 박제 금지). 단 AW1만 예외 — 기존 page.tsx가 이미 실데이터 서버 쿼리 완비 → **데이터 패칭 절대 보존**.

---

## §1. AppNav active 값 확정 (의뢰서 §1)

| 화면 | active 값 |
|------|-----------|
| RI1 RefereeInfo | `more` |
| SF1 Safety | `more` |
| CC1 Coaches | `more` |
| GL1 Gallery | `more` |
| SH1 Shop | `more` |
| AW1 Awards | `rankings` |

**회귀 가드**: AppNav active는 `app-nav.tsx` L196 `isActive(t.href)` = **pathname 기반 자동 판정**. page.tsx 박제는 AppNav를 직접 건드리지 않으므로 active 값은 라우트 경로(`/awards`→rankings 탭, 나머지→더보기)로 자동 결정. **page.tsx에서 active prop을 넘기는 구조 아님 → 박제 시 active 회귀 0** (단, 신규 라우트 생성 금지 = 기존 6 라우트 경로 불변 의무).

---

## §2. 화면별 상세 설계

### 공통 토큰 매핑 (시안 extras-pages.css → 운영 globals.css)

시안 CSS가 쓰는 토큰과 운영 globals.css의 실재 토큰 매핑. **하드코딩 hex/emoji/lucide/pill9999 전부 제거**.

| 시안 토큰/값 | 운영 치환 | 비고 |
|--------------|-----------|------|
| `--r-lg` / `--r-md` / `--r-sm` / `--r-xs` | `--radius-card` / `--radius-card` / `--radius-chip` / `--radius-chip` | 운영 라운딩 토큰 (4~8px) |
| `--accent` | `var(--accent)` (=빨강) | **의도된 강조색만 사용**. 일반 강조는 `--cafe-blue` 권장 (errors.md 61 강조색 폴백 함정) |
| `--bdr-navy` / `--cafe-blue` / `--cafe-blue-deep` / `--cafe-blue-soft` | 동일 실재 토큰 | hero 그라디언트 |
| `--ok` / `--ok-soft` / `--warn` / `--warn-soft` / `--err` | `--ok`/`--ok-soft`/`--warn`/`--warn-soft`/`--color-error` | 상태색 (`--err`→실재 확인 필요, 없으면 `--color-error`) |
| `--ink` / `--ink-soft` / `--ink-mute` / `--ink-dim` | 동일 실재 토큰 | 텍스트 계층 |
| `--bg` / `--bg-card` / `--bg-alt` / `--bg-elev` / `--bg-head` | 동일 실재 토큰 | 배경 계층 |
| 하드코딩 `#8B5A0F`(warn 텍스트) | `var(--warn)` | extras-pages.css L53·205 |
| 하드코딩 `#F4C76C`(aw-hero season) | `var(--warn)` 계열 | extras-pages.css L185 |
| 하드코딩 `#1A1E27`/`#2B3242`(aw-hero bg) | `var(--bdr-navy)` 그라디언트 | extras-pages.css L182 |
| 하드코딩 `#fff`(다크 대비 텍스트) | `var(--ink-on-brand)` 또는 `#fff` 유지(브랜드 배경 위 흰글자는 허용) | 컨벤션: 브랜드 배경 위 흰색은 의도색 |
| 이모지 (🛒♡★🚚↩️✅💳▶📷♥👁🔗🚩) | **Material Symbols Outlined 치환** | 현행 shop/gallery page.tsx의 이모지도 함께 정리 |
| lucide-react | 사용 0 (확인) | Material Symbols만 |
| pill `9999px` | 정사각(W=H) 원형만 `50%` | Shop 장바구니 카운트 배지 `borderRadius:99` → 정사각 50% 또는 `--radius-chip` |

> **검증 의무**: 박제 후 `grep -nE '#[0-9a-fA-F]{3,6}|9999px|lucide|borderRadius:\s*99' page.tsx` → 의도색(브랜드 배경 흰글자) 외 0건. CSS 주석 내 `*/` 조기종료 0 (errors.md Turbopack 함정).

---

### RI1 · RefereeInfo (`/referee-info`) — 정적 / 시안 그대로 박제

- **(a) 데이터 출처**: 정적 안내 (0 스키마). 시안 상수 `RI_STATS/RI_ROLES/RI_TIERS/RI_STEPS/RI_PAY/RI_FAQ` 그대로 박제 OK (DB 무관 제도 안내 = mock 아님).
- **(b) 변경 명세**:
  - 현행 page.tsx = **server component** (`metadata` export + 비로그인 SEO). 시안은 `React.useState(open)` FAQ accordion = **client 인터랙션 필요**.
  - **구조 결정**: page.tsx(server, metadata 보존) + `_components/referee-info-content.tsx`(client, FAQ accordion) 분리. metadata SEO export는 server에 유지(회귀 0).
  - 시안 섹션: Hero / 통계4 / 하는일4 / 자격등급3 / 지원절차4 / 정산표 / FAQ accordion / CTA. 전부 정적.
  - 시안 CTA `href="iu3-help.html"` → `/help` 매핑 (현행 page.tsx도 `/help` 사용 — 일관).
  - 심판 지원/로그인 CTA `href="#"` → 현행대로 `/referee` 영역 진입 또는 `/help` (DB 미지원 신청 흐름은 링크만, 동작 미구현).
- **(c) 토큰**: `ri-*` 클래스 = referee-info.css(별도 sync됨) 사용. 토큰 매핑표 적용. `.accent` span = `--accent`(빨강) 의도색.
- **(d) 회귀**: SEO metadata 보존 / 비로그인 열람 / `/referee-info` 라우트 불변 / 데이터 0.
- **(e) 규모/위험**: 규모 中(+250/-120, client 분리) / 위험 **낮음** (정적).

---

### SF1 · Safety (`/safety`) — 정적 안전가이드 / 시안으로 교체

- **(a) 데이터 출처**: 정적 (DB 0%). 시안 `guides` 6카드 + 신고/긴급문의 2카드. **현행 page.tsx의 4탭 더미(BLOCKS/REPORTS/MUTED/PRIV)는 시안에 없음** → 시안 정적 안전가이드로 **전면 교체**.
- **(b) 변경 명세**:
  - 현행 = "안전·차단 센터"(차단목록/신고내역/금칙어/프라이버시 4탭 + 더미 67줄). 시안 = "안전 가이드"(경기전점검/부상대응/매너/안전한만남/날씨/검증코트 6카드 + 신고하기/긴급문의 2카드).
  - **방향 결정 필요(PM 확인)**: 시안은 차단/신고 관리 기능을 **제거**하고 순수 안전 안내로 재정의. 현행 더미 4탭은 DB 미지원 → 시안 교체 시 **기능 손실 0**(더미였으므로). 단 현행 page.tsx는 `"use client"` + useState(tab) → 시안은 정적이라 client 불필요.
  - **권장**: 시안대로 정적 안전가이드 박제 (client→server 단순화 가능, 단 breadcrumb Link만이면 server OK). 더미 차단/신고 데이터 전량 삭제.
- **(c) 토큰**: `sf-hero`(cafe-blue→bdr-navy 그라디언트) / `sf-card`/`sf-list`/`sf-report`. `sf-report__ico--red`=`--accent-soft`/`--accent`. 토큰 매핑 적용.
- **(d) 회귀**: `/safety` 라우트 불변 / 더보기 메뉴 진입 유지 / 데이터 0.
- **(e) 규모/위험**: 규모 中(+120/-330, 더미 대량 삭제) / 위험 **낮음** (정적, 기능 손실 0).

---

### CC1 · Coaches (`/coaches`) — 준비중 빈상태

- **(a) 데이터 출처**: **준비중**. ★실측: `TTP.role` = coach **4건** / player 1018. 그러나 이 coach 4건은 **대회 출전명단의 코칭스태프**(PR-LINEUP-V2 coach 칩)이며, 시안의 "개인 레슨 코치 찾기"(시급/평점/리뷰/예약/전문분야)와는 **완전히 다른 도메인**. 코치 프로필/시급/평점/예약 테이블 **0**. → mock 박제 금지, 준비중 빈상태.
- **(b) 변경 명세**:
  - 현행 page.tsx = `"use client"` + COACHES 더미 6건 + BOOKED 예약 더미 2건 + 카드 그리드. 시안 = `ex-head` + 카테고리 chip 5종 + `co-grid` 3열 코치카드(인증뱃지/태그/시급/평점).
  - **시안 시각으로 셸 교체 + 더미 데이터 → 준비중 빈상태(`ex-empty`)**. 카테고리 chip은 정적 UI로 배치(동작 미구현, 시안 인터랙션 보존하되 결과는 빈상태).
  - "코치 등록 신청" 버튼 = UI만(동작 미구현). 현행 더미 COACHES/BOOKED 전량 삭제 → `ex-empty` "코치 매칭 준비 중" 카드.
- **(c) 토큰**: `co-grid`/`co-card`/`ex-chip`/`ex-badge--soft`/`ex-empty`. 현행 하드코딩 `#DC2626/#0F5FCC/#F59E0B`(코치 컬러) 전량 제거(더미 삭제로 자연 소멸).
- **(d) 회귀**: `/coaches` 라우트 불변 / 더보기 진입 유지 / 데이터 0(더미 삭제).
- **(e) 규모/위험**: 규모 中(+90/-380, 더미 대량 삭제) / 위험 **낮음**.

---

### GL1 · Gallery (`/gallery`) — 준비중 빈상태

- **(a) 데이터 출처**: **준비중**. ★실측: `news_photo` **1건**(is_hero 0) → 사실상 비어있음. 앨범(album) 테이블 **0**. news_photo는 알기자 기사 첨부용(match_id 종속)이라 갤러리 독립 노출 모델 아님. → 준비중 빈상태.
  - (참고) 향후 연동 시 = `news_photo` (match_id 그룹핑 → 매치별 앨범) 재사용 가능. 단 현재 1건 = 노출 의미 없음.
- **(b) 변경 명세**:
  - 현행 page.tsx = `"use client"` + ITEMS 더미 12건 + lightbox 모달 + 가짜 SVG 코트라인 + 이모지(▶📷♥👁🔗🚩). 시안 = `ex-head` + `gl-albums` 3열 + `gl-grid` masonry(wide/tall) + `ex-ph` 줄무늬 플레이스홀더.
  - **시안 시각 셸 + 더미 → 준비중 빈상태**. 시안 `ex-ph`(줄무늬 placeholder)는 "이미지 없음" 표현이므로 빈상태와 정합. 앨범/그리드는 `ex-empty` "갤러리 준비 중"으로 대체하거나, 시안 `ex-ph` placeholder 셸만 비활성 노출.
  - **권장**: `ex-empty` 단일 빈상태 (더미 12건·lightbox·SVG·이모지 전량 삭제).
- **(c) 토큰**: `gl-albums`/`gl-grid`/`gl-item`/`ex-ph`/`ex-empty`. 현행 하드코딩 `hsl()`/`#fff`/`rgba()` SVG·이모지 전량 제거.
- **(d) 회귀**: `/gallery` 라우트 불변 / 더보기 진입 유지 / 데이터 0.
- **(e) 규모/위험**: 규모 中(+80/-560, 대형 더미·lightbox 삭제) / 위험 **낮음**.

---

### SH1 · Shop (`/shop`) — 준비중 빈상태 (운영 미연결 확정)

- **(a) 데이터 출처**: **준비중** (운영 미연결 확정). products/cart/wishlist 테이블 0. → mock ❌, 빈상태.
- **(b) 변경 명세**:
  - 현행 page.tsx = `"use client"` + PRODUCTS 더미 12 + cart useState + Hero(빨강 그라디언트) + 이모지(🛒♡★🚚↩️✅💳). 시안 = `ex-head` + `ex-chips` 6종 + `sh-grid` 4열 상품카드 + `ex-badge`(BEST/NEW/할인%).
  - **시안 시각 셸 + 더미 → 준비중 빈상태**. Hero(시즌 배너)는 정적 마케팅이라 보존 가능하나, 상품 그리드는 `ex-empty` "샵 오픈 준비 중"으로 대체.
  - **권장**: 시안 Hero 배너(정적) + `ex-empty` 빈상태. 더미 12건·cart·이모지·재고분기 삭제.
- **(c) 토큰**: `sh-grid`/`sh-card`/`ex-chip`/`ex-badge--ok/--red`/`ex-empty`. 이모지 → Material Symbols(`shopping_cart` 등). 장바구니 카운트 `borderRadius:99` → `--radius-chip`. Hero 하드코딩 `#DC2626/#7F1D1D` → `--accent`/`--accent-deep` 그라디언트.
- **(d) 회귀**: `/shop` 라우트 불변 / 더보기 진입 유지 / 데이터 0.
- **(e) 규모/위험**: 규모 中(+90/-410, 더미·이모지 삭제) / 위험 **낮음**.

---

### AW1 · Awards (`/awards`) — ★실데이터 보존 / UI 셸만 v2.31 시각 교체

- **(a) 데이터 출처**: **기존 실데이터 쿼리 100% 보존**. page.tsx(server, 585줄) = prisma 직결 5블록(seasons/seasonMvp/finalsMvp/leaders/champions). ★실측: 현재 mvp public 0 / champion public 0 (시안 더미 "김지훈" 등과 무관) → **page.tsx의 "준비중" 빈상태 폴백이 이미 정확 처리**. mps 2375건 → 시즌 리더 raw SQL은 데이터 산출 가능.
- **(b) 변경 명세**:
  - **page.tsx(server) = 절대 변경 금지** (데이터 패칭·DTO·raw SQL·officialMatchWhere 가드 전부 보존).
  - **`_v2/awards-content.tsx`(client)만 v2.31 시안 시각으로 재작성**. 시안 = `aw-hero`(다크 그라디언트+시즌칩) / `aw-mvp`(face+stats4) / `aw-best5`(5열 PG~C) / `aw-cats`(2열 부문별).
  - **데이터 매핑**: 시안 best5(PG/SG/SF/PF/C 5명)는 현행 DTO에 **포지션별 베스트5 데이터 없음** → DTO의 leaders(득점/어시/리바왕 3명)로 매핑하거나 best5는 "준비중"으로. **시안 best5 = mock 금지 → DTO 가용 데이터만 와이어**.
  - 시안 cats(득점왕/어시왕/리바왕/스틸왕/레이팅/매너상) → DTO `scoringLeader/assistsLeader/reboundsLeader`만 실데이터, 나머지(스틸왕/레이팅/매너상)는 "준비중"(현행 awards-content가 이미 `pickHonorPlayer` default null → 준비중 처리).
  - MVP 카드 = `seasonMvp` DTO 와이어(현재 0건 → 빈상태). 시즌 셀렉터 = 기존 `?series=` router.push 흐름 보존.
- **(c) 토큰**: `aw-hero`/`aw-mvp`/`aw-best5`/`aw-cats` (extras-pages.css). 하드코딩 `#1A1E27/#2B3242/#F4C76C/#8B5A0F` → 토큰 치환. `aw-mvp__face` = `--accent`→`--accent-deep` 그라디언트(의도색).
- **(d) 회귀**: ★**page.tsx server 쿼리 0 변경 = git diff로 page.tsx diff 0 실측 의무**. `/awards` 라우트·`?series=` 흐름·officialMatchWhere 가드·DTO 타입 보존. AppNav `rankings` active 유지.
- **(e) 규모/위험**: 규모 中(awards-content.tsx +200/-150) / 위험 **中** (실데이터 와이어 — best5/cats 매핑 시 mock 혼입 주의 + page.tsx 보존 검증).

---

## §3. 박제 순서 + 담당 (의존 0 = 전부 병렬 가능, 단 검증 비용 분산 위해 그룹화)

| 순서 | 작업 | 담당 | 선행 조건 | 위험 |
|------|------|------|-----------|------|
| 1 | RI1 + SF1 박제 (정적 2화면) | developer | 없음 | 낮음 |
| 2 | CC1 + GL1 + SH1 박제 (준비중 3화면) | developer | 없음 (1과 병렬 가능) | 낮음 |
| 3 | AW1 박제 (awards-content.tsx만 / page.tsx 보존) | developer | 없음 (1·2와 병렬 가능) | 中 |
| 4 | 검증 (tester + reviewer 병렬) | tester + reviewer | 1·2·3 완료 | — |

> 정적/준비중 5화면(RI1/SF1/CC1/GL1/SH1)은 회귀 위험 0 → **PM 직접 검증 모드(옵션 B)** 적용 가능(tester만). AW1만 실데이터 보존 검증 필요 → tester+reviewer 병렬.

---

## §4. developer 주의사항 (★Stop conditions)

1. **mock 더미 절대 금지** — CC1/GL1/SH1은 운영 실데이터 없음 = **준비중 빈상태(`ex-empty`)**가 정답. 시안의 더미 배열(coaches/albums/items)을 박제하면 안 됨. 현행 page.tsx의 기존 더미도 **전량 삭제**.
2. **AW1 page.tsx(server) 변경 0** — 데이터 패칭/raw SQL/DTO 보존. `git diff --stat HEAD` 로 page.tsx **diff 0 실측 의무**. awards-content.tsx(client)만 재작성. best5/스틸왕/레이팅/매너상은 DTO에 없으면 "준비중"(mock 와이어 금지).
3. **신규 라우트 0 / /api/v1 0 / DB 스키마 0** — 기존 6 라우트 경로 불변. AppNav active는 pathname 자동 판정이므로 page에서 active prop 조작 금지.
4. **토큰 치환 의무** — §2 매핑표 적용. 하드코딩 hex(브랜드 배경 위 `#fff` 흰글자 외)/emoji/lucide/pill9999 전부 제거. 현행 page.tsx의 이모지(🛒♡★▶📷 등)도 Material Symbols로 정리.
5. **강조색 폴백 함정(errors.md 61)** — 시안 CSS `--accent`=빨강. 일반 강조는 `--cafe-blue` 계열 권장. 빨강은 의도된 강조(CTA·MVP face)만. 시안 CSS 변수 폴백값을 확정색으로 오인 금지.
6. **CSS 주석 `*/` 조기종료 0 (Turbopack 함정)** — referee-info.css/extras-pages.css는 sync된 시안 CSS이므로 globals 통합 시 주석 검증.
7. **client/server 분리** — RI1은 metadata SEO(server) + FAQ accordion(client) 분리. SF1/CC1/GL1/SH1은 정적이면 server 단순화 가능(빈상태는 인터랙션 불필요), 단 시안 chip 인터랙션 보존 필요 시 client 유지.
8. **PM 커밋 전 git status 교차검증** — 다중 세션 staged 파일 휩쓸림 방지 (conventions.md).
