# STAGE E — Home + Legal/Offline 디자인 의뢰서 (2026-06-24)

> 자동 루프 작성 (Cowork PM). QA v2.40 패스와 **병행/직후** 착수용 STAGE E 의뢰 초안.
> 근거: `stage-efg-next-plan-2026-06-23.md` §2 / `_cli-queue-status-2026-06-23.md` §3.
> 기준선: `dev == main` (v2.40 릴리스 완료), 활성 시안 = `Dev/design/BDR-current/`.

---

## 0. 한 줄 요지

신규 화면 제작이 아니라 **이미 존재하는 5개 라우트의 토큰/레이아웃/카피 정합**입니다.
법적 문구의 **의미**는 그대로 두고, 렌더링과 정보 구조만 v2.40 표준으로 정리합니다.

---

## 1. 대상 라우트 (전부 운영에 이미 존재)

| 라우트 | 운영 파일 | 권장 처리 | 데이터 변경 |
|---|---|---|---|
| `/` 홈 | `src/app/(web)/page.tsx` (369줄, 5섹션) | full 정합 (아래 §2) | 없음 |
| `/privacy` | `src/app/(web)/privacy/` | 법무 문구 유지, 레이아웃/토큰만 | 없음 |
| `/terms` | `src/app/(web)/terms/` | 법무 문구 유지, 레이아웃/토큰만 | 없음 |
| `/safety` | `src/app/(web)/safety/` | 안전 가이드 레이아웃 정리 | 없음 |
| `/~offline` | 오프라인 상태 페이지 | 토큰/카피 정리 | 없음 |

전 항목 **API/Prisma/route.ts 0 변경 · UI 렌더링만**.

---

## 2. 홈(`/`) 정합 포인트 — 현 구조 보존이 핵심

현 홈은 5섹션 구조이며 **이미 SSR prefetch + 클라이언트 SWR 혼합**입니다. 이 데이터 흐름은 **건드리지 말 것**:

1. **HeroCarousel** — 4종 슬라이드(대회/게임/MVP/정적) 자동회전. `prefetchHeroSlides()`가 데이터 0건이어도 정적 fallback 1개 보장 → **빈 상태에서도 깨지지 않게 유지**
2. **LiveChipRow** — Hero 위 sticky LIVE 칩 (홈·UA1 공용 `getLiveChips`)
3. **RecommendedVideos** — "WATCH NOW · YOUTUBE" 통일 헤더 (client SWR)
4. **2컬럼 grid** — CardPanel "공지·인기글"(상위5) + "열린 대회"(TournamentRow)
5. **"방금 올라온 글"**(상위10 BoardRow) + 최하단 **StatsStrip**(4열 통계)

정합 작업 = 위 섹션들의 **카드/칩/버튼/간격/empty 상태를 v2.40 표준 한 벌로 수렴**. 섹션 추가/삭제/재배치 ❌.

---

## 3. 보존 필수 (위반 시 자동 reject)

- **AppNav frozen** — `03-appnav-frozen-component.md` 코드 그대로. main bar 우측 5개(검색/쪽지/알림/다크/햄버거)·utility bar 우측 유지. 변경 ❌
- **사용자 결정 §1~§8** (헤더/더보기/카피/모바일) 변경 ❌
- **다음카페 카피 보존** — "서울 3x3 농구 커뮤니티" / "다음카페" 등 시안 우선 카피 유지 (`01-user-design-decisions.md` §6-1)
- **법적 문구 의미 변경 ❌** — privacy/terms/safety 본문 텍스트는 레이아웃만, 문구는 그대로
- **디자인 토큰** — `var(--*)`만 / 하드코딩 hex ❌ / lucide-react ❌ / 핑크·살몬·코랄 ❌ / pill 9999px ❌ (정사각 원형 50% 예외)
- **모바일** — 720px 분기 / iOS input 16px / 버튼 44px

---

## 4. 산출물 형식

기존 phase 패턴 답습 — 시안은 운영 src를 직접 수정하지 말고 **CLI 적용용 체크리스트**로 회신:

- `Dev/design/BDR-current/screens/Home.jsx` (또는 기존 위치) 갱신본
- legal/offline 4개 화면 정합본
- `_stage-e/bake-checklist.md` — 라우트별 토큰/레이아웃 diff를 CLI 작업 단위로 분할
- 회귀 6 케이스 자체 검수(`06-self-checklist.md`) 통과 확인

---

## 5. 회신 zip 도착 후 처리 (Codex/Cowork)

| 단계 | 처리 |
|---|---|
| 1 | zip을 `Dev/design/_zips/` 보존 |
| 2 | `_stage-e/bake-checklist.md` 존재 확인 |
| 3 | BDR-current sync 판단 — AppNav/사용자결정 위반 시 reject |
| 4 | bake checklist를 라우트별 CLI batch 분할 |
| 5 | batch마다 `cmd /c npx tsc --noEmit` + 시각 회귀 표본 |

---

## 6. delivery paste 본문 (Claude.ai 그대로 붙여넣기)

```text
BDR STAGE E — Home + Legal/Offline 정합을 의뢰합니다.

첨부 2건:
1) stage-e-home-legal-brief-2026-06-24.md
2) (QA 직후라면) QA 회신 표준이 반영된 최신 BDR-current zip

기준:
- 운영 정합 완료: dev == main
- 활성 시안: Dev/design/BDR-current/
- 대상 라우트: / · /privacy · /terms · /safety · /~offline (전부 운영 존재)

요지:
- 신규 화면 제작 아님. 기존 5개 라우트의 토큰/레이아웃/카피를 v2.40 표준으로 정합.
- 홈은 5섹션 구조(Hero카로셀/LIVE칩/추천영상/2컬럼/방금올라온글+StatsStrip) 보존. 데이터 흐름 변경 금지.
- legal 3종은 문구 의미 유지, 레이아웃/토큰만 정리. /~offline는 토큰/카피만.

보존 필수:
- AppNav frozen 변경 금지
- 사용자 결정 §1~§8 변경 금지
- 다음카페 카피 보존
- 운영 API/Prisma/라우트 변경 금지
- 시안이 운영 src를 직접 수정하지 말고 _stage-e/bake-checklist.md 로 회신

완료 후 회신 zip 주시면 Cowork/Codex가 sync 후 checklist를 CLI batch로 분할 적용하고 tsc/회귀로 닫겠습니다.
```
