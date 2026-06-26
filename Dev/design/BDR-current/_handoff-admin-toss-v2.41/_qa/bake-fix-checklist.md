# _qa/bake-fix-checklist.md — CLI 적용용 작업 목록

> 작성 2026-06-25 · 출처: `consistency-audit.md`(C0~C4) + `reverse-bake-gap.md`(P0~P2).
> ⚠️ 본 체크리스트는 **in-project BDR-current(2026-06-13) 기준 정합 부채**만 즉시 적용 가능 항목으로 분리합니다.
> P0/P1 역박제(신규 화면 박제)는 원본 src(● 파일) 선확보 후 별도 batch — 본 문서는 "지금 칠 수 있는 것"만.

---

## A. 자동 치환 가능 (CLI find-replace 단위)

| # | 작업 | 대상 파일 | 치환 규칙 | 검증 |
|---|---|---|---|---|
| A-1 | 골드 토큰 신설 | `BDR-current/tokens.css` | `:root`에 `--trophy:#B47A11; --trophy-bright:#F4C76C; --trophy-soft:#FBF0D6; --trophy-ink:#6B5210;` 추가 | tokens.css diff |
| A-2 | 골드 하드코딩 → 토큰 | `screens/GameResult.jsx:94`, `notify-shared.css:14,21`, `ProfileAchievements.jsx:24`, `screens/tournaments.css:264-274` | `#B47A11`→`var(--trophy)` · `#F4C76C`→`var(--trophy-bright)` · `#FBF0D6`→`var(--trophy-soft)` · `#6B5210/#4A3705`→`var(--trophy-ink)` | grep 잔존 0 |
| A-3 | `--on-accent` 신설 + 인라인 `#fff` 정리 | `tokens.css` + 컬러배경 텍스트 인라인 | `--on-accent:#fff;` 추가 후 `color:'#fff'`(accent/err 배경 위) → `var(--on-accent)` | 시각 회귀 없음 |
| A-4 | 신뢰도 mid 색 토큰화 | `screens/AdminTournamentProspectus.jsx:153` | `#8B5A0F`→`var(--warn)` 또는 `--trophy-ink` | grep |

> ⚠ 제외(치환 금지): `tokens.css`의 토큰 정의 hex(정의부), mock `brand_color`(`#0F5FCC #404755` 등 팀/단체 런타임 데이터), `.kind-*` 색팩(의도적 dark 팩).

---

## B. 수동 수정 (판단 필요)

| # | 작업 | 대상 | 메모 |
|---|---|---|---|
| B-1 | 영문 UI 잔존 grep·한글화 | `BDR-current/**` | `\b(HOME|AWAY|STEP|VS|GAME|LIVE)\b` grep → 한글 치환. MVP/PDF/API 등 약어·고유명사 예외 판정 수작업 |
| B-2 | screens 인라인 grid 720px 분기 검증 | `screens/*.jsx` 인라인 `gridTemplateColumns:'repeat(` | 720px 미분기 발견 시 분기 추가(룰 13) |
| B-3 | chip/dot `9999px` 유지 확인 | `notify-shared.css:31` 등 | 룰 12는 button/card 대상 → dot/chip은 유지(변경 금지). 회귀 검수만 |

---

## C. PM 결정 대기 (C0 — 적용 보류)

| # | 작업 | 대상 | 조건 |
|---|---|---|---|
| C-0 | v2.40 admin 콘솔 Toss→BDR 리스킨 | `Dev/design/BDR v2.40/_admin-unified/*` | **PM "리스킨" 확정 시에만 착수.** lucide→Material Symbols 아이콘 매핑(수작업), `#3182F6`→BDR 토큰, radius 24px→4/8px, 라이트→다크 — 대규모. 별도 의뢰 batch 권장 |

---

## D. 역박제 batch (원본 src ● 선확보 필요 — 본 체크리스트 범위 밖)

> `source-request-list.md` 순서대로 원본 도착 후 신규 화면 박제. 아래는 placeholder.

| batch | 산출 시안(신규/갱신) | 선행 |
|---|---|---|
| B1 | `TournamentWorkspace` + 7패널 (워크스페이스 재구성) → **상세: `bake-fix-checklist-B1.md`** | 🔬 소스 일부 실측(2026-06-26). 셸·admins·게이트 확보 / 5패널 내부 미수록 |
| B2 | 생성 마법사 4 step(`ct-*`) + `place-autocomplete` | src 2순위 ● |
| B3 | `/admin/agents` 영향 화면 + 감사로그 연결 | src 3순위 ● |
| B4 | 길안내 fallback(`schedule-timeline`/`navigation-links`) | src 4순위 |
| B5 | 심판/경기원 라벨 표준(`official-roles`/assoc wizard) | src 4순위 |

---

## E. 적용 순서 권장

1. **A-1~A-4** 즉시(자동, 저위험) — 토큰 부채 해소.
2. **B-1~B-3** 다음(수동, grep 기반).
3. **C-0** PM 결정 후.
4. **D(B1~B5)** 원본 ● 도착분부터 역박제.
5. 역박제 완료 후 `consistency-audit.md` 재실행 → 신규 화면 포함 최종 정합 잠금.

---

## F. 회귀 검증 (각 batch 후)

- AppNav main bar 우측 5컨트롤 순서 `[다크, 검색, 쪽지, 알림, 햄버거]` 불변.
- 모바일(≤768) 다크 토글 단일 아이콘 / 검색·쪽지·알림 `app-nav__icon-btn`(border/bg 없음).
- 가짜링크 `gameResult/gameReport/guestApps/referee` 미등장.
- 하드코딩 hex(예외 외)·lucide·핑크/살몬/코랄 grep = 0.
- 720px 분기 / iOS input 16px / 44px 터치 유지.
