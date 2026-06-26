# Admin Toss v2.42 Parity Inventory

Date: 2026-06-26
Scope: `BDR v2 (40).zip` 반영 이후 관리자 Toss 100% 정합 + 공개 사이트 데이터 배선 갭
Target first: `/tournament-admin/tournaments/[id]` 대회 운영 workspace와 7개 패널

## 1. Current Source of Truth

| Layer | Source | Status |
|---|---|---|
| Admin visual system | `Dev/design/BDR-current/_handoff-admin-toss-v2.41/toss.css`, `workspace.css`, `toss-kit.jsx` | canonical |
| Admin workspace UI | `workspace.jsx`, `panels-core.jsx`, `panels-ops.jsx`, `schedule.jsx`, `bracket.jsx` | canonical |
| Public site wiring | `Dev/design/BDR-current/_delta-v2.42-wiring/` | new v2.42 delta |
| Operating admin source | `src/app/(admin)/tournament-admin/tournaments/[id]` | partial / mixed |
| Operating public route | `src/app/site-host` | real route, not `src/app/(site)` |
| Operating public APIs | `src/app/api/web/tournaments/[id]/public-*` | real DB wired, section gate missing |

## 2. v2(40) Delta Result

| Item | Result |
|---|---|
| Package type | Data wiring delta, not a new full UI screen |
| Admin/public shared baseline | 44 teams / 27 matches / 4 divisions |
| Fixed design data | orphan mock team names removed; `homeId/awayId` added |
| New public rule | public site must derive from admin/workspace source |
| New visibility rule | overview/teams/schedule/bracket/results state matrix |
| Implementation blocker | operating DB/API currently has site-level publish only |

## 3. Canonical Admin Class Families

| Family | Role | Canonical files |
|---|---|---|
| `ts-*` | buttons, card, input, badge, chip, segment, modal, sidebar primitives | `toss.css`, `toss-kit.jsx` |
| `tw-*` | tournament workspace shell, steps, footer | `workspace.css`, `workspace.jsx` |
| `ct-*` | create/workspace field groups, metrics, panel summary, embeds, empty state | `workspace.css`, `panels-*` |
| `amt-*` | admin match table and ScoreModal | `schedule.jsx`, match handoff |
| `bk-*` | bracket configuration, seed slots, tree, dual groups | `bracket.jsx` |
| `sc-*` | schedule lanes, unassigned pool, delete/action affordances | `schedule.jsx` |

Admin 영역에서는 lucide 기반 `Icon` wrapper와 Toss radius/pill을 그대로 유지한다. BDR 4px/Material Symbols로 번역하지 않는다.

## 4. Operating Layer Findings

| Area | Operating evidence | Gap |
|---|---|---|
| Workspace embed | `TournamentWorkspace.tsx` renders `ta-panel-embed`; canonical is `ct-panel-embed` | 임시 shim layer 잔존 |
| Workspace readonly metric | `TournamentWorkspace.tsx` uses `rounded-[4px]`, `--color-border` | Toss metric/input radius와 다름 |
| Divisions panel | `divisions-panel.tsx` uses `ta-divisions-panel`, `ta-division-*`, many `rounded-[4px]` | 시안 `panels-core.jsx`와 다른 임시 구조 |
| Bracket panel | `bracket-panel.tsx` has old BDR comments and `--color-*`/`rounded-[4px]` mix | `bk-*` canonical tree/slot UI 미정합 |
| Site panel | `site-panel.tsx` uses `rounded-md`, `--color-*`, preview-specific ad hoc blocks | Toss site wizard와 다름 |
| Recorders/Admins panels | mixed `rounded-full`, BDR color tokens, custom rows | Toss card/list/button contract 미흡 |
| Matches | `matches-client.tsx` already has `ct-emptybox`; `amt-*` precision still needs pass | likely closest, but ScoreModal/table audit needed |
| Legacy console CSS | `toss-admin.css` still includes `au-*`, `ad-*`, `admin-*` compatibility layers | 대회 운영 완료 후 전 관리자 리스킨 때 정리 |
| UI kit bridge | `toss-admin.css` contains `.ui-card`, `.btn` compatibility selectors | final parity에서는 제거/축소 후보 |

## 5. User-Visible Symptom Mapping

| Symptom | Likely cause | Fix direction |
|---|---|---|
| 종별이 처음부터 안 보임 | workspace panel toggle model + divisions panel content hidden behind action button | active `divisions` step에서 `DivisionsPanel`을 기본 고정 노출 |
| 종별 삭제를 찾기 어려움 | 삭제는 `removeDivision()`/`ta-division-delete`로 존재하지만 editor row 안쪽에 묻힘 | selected division row에 명확한 Toss delete icon/button 노출 |
| 셀 블록/배경 여백이 불안정 | `ct-*` canonical + `ta-*` 임시 + Tailwind radius/color 혼재 | `ct-*`, `ts-*`, panel-specific canonical class로 통일 |
| 대진 생성 위치 혼동 | bracket generation is in workspace `divisions` section / `bracket` panel | "종별 운영 방식"과 "대진 생성"을 한 섹션에서 항상 발견 가능하게 고정 |
| 대회 운영 진입점 혼동 | list/detail/admin routes coexist | entry map 문서화 + CTA route audit 필요 |
| 변경이 없어 보임 | code uses `data-skin="toss"` but many inner blocks are still old tokens/classes | inner panels must be replaced, not just shell opt-in |

## 6. Public Site Wiring Findings

| v2.42 requirement | Current source reality | Gap |
|---|---|---|
| `publishedSections[]` controls tabs | `TournamentSite.isPublished` only found | section-level visibility missing |
| `match.published` controls schedule | `public-schedule` reads all tournament matches after privacy guard | per-match publish gate missing |
| `bracket.publishedVersion` controls bracket | `public-bracket` reads current real matches and active data | published-version gate missing |
| final stats/article flags | match/player stats exist; article/CMS gate unclear | no explicit `hasStats/hasArticle` contract |
| public site source = admin data | `site-host` uses real DB and public APIs | good baseline, needs gate/empty-state alignment |

Do not add schema blindly. First implement the no-schema audit and choose a least destructive visibility path.

## 7. Cleanup Manifest

| Priority | Candidate | Action |
|---|---|---|
| P0 | `ta-panel-embed` | replace with `ct-panel-embed`; keep temporary alias only until visual regression passes |
| P0 | `ta-division-*` | replace/absorb into canonical `ts-*`/`ct-*` division layout |
| P0 | `rounded-[4px]` inside admin Toss tournament workspace | replace with Toss radius classes/tokens unless it is a tiny code chip |
| P0 | `--color-*` BDR tokens inside admin Toss panels | replace with Toss scoped tokens (`--ink`, `--grey-*`, `--primary`, `--border`) |
| P1 | `components/ui` in admin Toss panels | replace with `src/components/admin-toss` kit |
| P1 | `.ui-card`, `.btn` compatibility selectors | remove after panels no longer depend on them |
| P2 | `au-*`, `ad-*` admin console families | keep until non-tournament admin pages are reskinned |
| P2 | old comments saying BDR 4px/material rules apply to admin | delete/update to Toss-style-lock wording |

## 8. Implementation Batches

| Batch | Work | Files |
|---|---|---|
| B1 | Workspace shell exact parity and panel discoverability | `TournamentWorkspace.tsx`, `toss-admin.css` |
| B2 | Divisions panel exact parity: initial visibility, delete, selected rows, rule cards | `divisions-panel.tsx`, `toss-admin.css` |
| B3 | Bracket panel exact parity: `bk-*`, version UI, generate/regenerate/confirm, dual groups | `bracket-panel.tsx`, `dual-group-assignment-editor.tsx`, CSS |
| B4 | Matches/Schedule parity: `amt-*`, ScoreModal, schedule lanes | `matches-client.tsx`, schedule-related panel/source |
| B5 | Teams parity: TeamDetailModal, import, filters, token/reissue/print | `teams-panel.tsx` |
| B6 | Site/Recorders/Admins parity | `site-panel.tsx`, `recorders-panel.tsx`, `admins-panel.tsx` |
| B7 | Public site v2.42 wiring audit and no-mock gates | `src/app/site-host`, `public-*` APIs |
| B8 | Remove temporary compatibility layers | `toss-admin.css` and replaced panels |

## 9. Immediate Next Implementation

Start with B1 because it is small and unlocks stable visual comparison:

1. Rename panel frame from `ta-panel-embed` to canonical `ct-panel-embed`.
2. Add/align `ct-panel-embed` CSS with `workspace.css`.
3. Keep a short backwards-compatible alias only while panels are being migrated.
4. Make `divisions` step render `DivisionsPanel` by default and keep it visible instead of hiding the core content behind "종별 운영 방식".
5. Keep `bracket` as the explicit secondary action inside the same section.

Then B2 fixes the user's current functional complaint:

1. Selected divisions must be visible immediately from saved/current categories.
2. Each selected division row must show delete as a stable Toss icon/button.
3. Category cards, selected rows, alerts, result messages must use Toss tokens/radius.
4. Empty state copy must say what to do next without pretending saved data exists.

## 10. Verification Plan

| Check | Method |
|---|---|
| Type safety | `npx tsc --noEmit` |
| Static residue scan | `rg "ta-panel-embed|rounded-\\[4px\\]|--color-" src/app/(admin)/tournament-admin/tournaments/[id]` after each batch |
| Visual smoke | local admin detail route at desktop + 390px screenshot |
| Public data no-mock | `rg "강남 불스|송파 레이커스|마포 워리어스|용산 썬더|성동 호넷츠" src Dev/design/BDR-current/_handoff-admin-toss-v2.41/data.jsx` |
| Publish gate audit | compare `PUBLIC-SITE-DATA-MAP.md` with `site-host` and `public-*` routes |

## 11. Open Decisions

| Decision | Needed before |
|---|---|
| Public site section visibility storage: status-derived only vs settings JSON vs explicit schema | B7 implementation |
| Whether `au-*` console layer is kept for non-tournament admin until full admin Toss rebuild | B8 cleanup |
| Whether public site article/stat leader data needs new admin fields or remains hidden until CMS exists | public results implementation |
