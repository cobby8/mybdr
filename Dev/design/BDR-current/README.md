# BDR-current = v2.16 (v2.15 base + v2.16 경기 탭 갱신)

## 작업 요약 (2026-05-20)

v2.14 → v2.16 동기화. **경기 탭 list/detail/create 신규 시안 박제.**

- 카드(목록) ✅ — Date Tile + Area Chip 최종 (`_games_card_final.html`, `screens/Games.jsx`)
- 상세 ✅ — V2 (Hero-led) + Concept B (10인 슬롯 보드) 결정 완료 (사용자 결정 §9)
  - 박제 source: `_game_detail_explore.html` (V1/V2 모두) + `screens-gd/ConceptB.jsx`
- 개설 ✅ — 단일 페이지 + 라이브 프리뷰 (`_create_game_explore.html`, `screens/CreateGame.jsx`)
- tokens.css — v2.15 라이트 토큰 (`--bdr-red`, `--bg-elev`, `--ink-soft/-dim`, `--cafe-blue`, `--kind/-deep`) 확장
- screens-gd/ — 상세 페이지 V1/V2 + ConceptA/B/C 디자인 캔버스
- design-canvas.jsx — v2.16 시안 인덱스

## v2.16 신규 자산

| 파일 | 역할 |
|---|---|
| `_games_card_final.html` | 카드(목록) 최종 — Date Tile + Area Chip + 호스트 아바타 + Progress |
| `_games_card_date_tile.html` | 카드 Date Tile 단독 시안 |
| `_games_card_explore.html` | 카드 디자인 탐색 (대안들) |
| `_game_detail_explore.html` | 상세 V1/V2 + 모바일 탐색 (V2 선택) |
| `_game_detail_redesign.html` | 상세 리디자인 초기 시안 |
| `_create_game_explore.html` | 개설 — 단일 페이지 + 라이브 프리뷰 |
| `screens-gd/` | 참가자 표시 ConceptA/B/C (B 선택) + data.jsx mock |
| `tokens.css` | v2.15 + 종별 컬러 (`--kind-pickup/-guest/-scrim`) |
| `design-canvas.jsx` | v2.16 시안 인덱스 |

## 동기화 진행도

- v2.13 ✅ = B 신규 3 + C 신규 1 + D 갱신/신규 2 = 6 페이지
- v2.14 ✅ = E 핵심 5 페이지 + 컴포넌트 3 (운영 5/14 commit 6건 반영)
- v2.15 ✅ = E 보조 7 페이지 (Teams / Admins / Recorders / Site / Bracket / Matches / Divisions)
- **v2.16 ✅ (이번)** = 경기 탭 list/detail/create 시안 + Phase 0 결정 완료 (V2 + Concept B)

## 사용자 결정 §9 신규 (2026-05-20)

- **경기 상세 레이아웃**: V2 (Hero-led) 채택 — 풀폭 다크 hero band + 종별 컬러 강조
- **참가자 표시**: Concept B (10인 슬롯 보드) 채택 — 5×2 슬롯 그리드 + 빈자리 직접 CTA

상세: `Dev/design/claude-project-knowledge/01-user-design-decisions.md` §9

## 다음 단계 (Phase 2~3)

- Phase 2: `<GameCard>` 컴포넌트 + `/games` 목록 박제 (`_v2` 신설)
- Phase 3-1: `/games/[id]` 상세 박제 (V2 Hero + Concept B 슬롯 보드)
- Phase 3-2: `/games/new` 개설 박제 (단일 페이지 + 라이브 프리뷰)
- Phase 3-3: `/games/[id]/edit`, `/games/[id]/guest-apply`, `/games/[id]/report` 후속

작업지시서: `Dev/design/v2.16-cli-bake-2026-05-20.md` (있다면) 또는 본 세션 의뢰서
