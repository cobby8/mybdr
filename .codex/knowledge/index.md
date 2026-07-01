# Knowledge Index

- 2026-07-01 score-sheet: the existing jump-ball/held-ball possession flow is now reachable from the visible electronic score-sheet toolbar instead of only the hidden FIBA header area.

- 2026-07-01 score-sheet: v2 running-score title now includes a prominent current-period chip inside the sheet body, so the active period remains visible even when the toolbar is not the operator's focus.

- 2026-07-01 score-sheet: v2 roster grids now give leftover player-table width to the five personal-foul cells instead of leaving a right-side gap; the 1-5 foul buttons remain separate cells.

- 2026-07-01 score-sheet: v2 electronic score-sheet toolbar now exposes the current period as a large centered chip, and running-score reached score cells/period-end markers inherit the scoring period color.

- 2026-06-27 admin: bracket/schedule/ops/site/settlement operate panels no longer mount nested `data-skin="toss"` roots; all six operate tabs now rely on the single parent Toss skin and shared `op-panel-flow`, avoiding grey embedded backgrounds and legacy compatibility CSS.

- 2026-06-27 admin: tournament teams tab looked unchanged because visible operate panels were still hybrid-preserving old structure; the teams tab now starts direct Toss parity with actionbar, registration-route stats, division readiness, grouped rows, and no nested `data-skin` grey background.

- 2026-06-27 admin: tournament audit log table now uses Toss `ad-native-table` classes; active admin scope scans clean for old `admin-table` wrappers.

- 2026-06-27 admin: active `admin-stat-pill` usages were replaced with Toss `ad-pill` across admin status surfaces; `/admin/users` now renders status badges without old pill classes.

- 2026-06-27 admin: `/admin` dashboard now uses Toss `ad-stats`, `ad-chart`, and `ad-log-card` markup while preserving Prisma count queries, weekly raw SQL, and recent admin log data.

- 2026-06-27 admin: shared `AdminStatCard`, `AdminEmptyState`, and `AdminStatusTabs` now render Toss `ad-stat`, `ad-empty`, and `ad-tabs` markup with scoped Toss CSS.

- 2026-06-27 admin: `AdminMobileNav` now renders Toss `ad-mobile-*` and `ad-side-*` drawer classes while preserving ESC close, route close, body scroll lock, and role-filtered links.

- 2026-06-27 admin: shared `AdminShell` now uses Toss `ad-shell`/`ad-main`/`ad-topbar`/`ad-main__inner` wrappers with scoped Toss CSS; local Chrome confirmed `/admin/tournaments` has no old shell DOM classes.

- 2026-06-27 admin: shared `AdminPageHeader` now renders the Toss `ts-ph` structure while preserving existing props, search form, actions, and breadcrumbs.

- 2026-06-27 admin: admin-scope Toss cleanup now scans clean for `material-symbols-outlined`, `components/ui`, `ta-*`, and `au-*`; legacy Material icon names are mapped through the lucide-based admin Toss `Icon` alias table.

- 2026-06-27 admin: 2-group/3-qualifier group-stage knockout brackets now use cross-seeded first-round matches and bye-aware preview counts, so the operate bracket displays `본선 5경기` instead of counting bye advancement as played games.

- 2026-06-27 recording: `recording_mode="paper"` remains the internal compatibility value, but user-facing/admin copy now calls it "전자기록지"; existing `paper-*` IDs and `[종이 기록]` PBP descriptions stay unchanged.

- 2026-06-26 admin: tournament detail entry is now the 6-menu Toss operate workspace, while the former setup/edit workspace is preserved at `/tournament-admin/tournaments/[id]/edit`.

- 2026-06-26 admin: division rule operation settings now use an explicit "운영방식 설정 저장" flow instead of blur-only persistence, and local rule state refreshes from the PATCH response.
- 2026-06-26 admin: bracket generation now routes through `TournamentDivisionRule` when division rules exist; the bracket panel always shows division-rule generators, unsafe global generation is disabled, `single_elimination`/`round_robin` division generation is supported, and mismatched group sizes fail before match writes.
- 2026-06-26 admin: tournament team category moves now sync `TournamentTeam.category`, `TournamentTeam.division`, and player `division_code`; teams panel exposes single-team and group bulk move controls for live operations.
- 2026-06-26 admin: BDR v2 (41) state cleanup added shared Toss `useTossConfirm`/`useTossPrompt`, removing browser confirm/prompt/alert from `tournament-admin` paths.
- 2026-06-26 admin: Toss `Skel`/`SkelTable`/`ErrState`/`PermState` helpers and `st-*` CSS were added; panel loading and admins/recorders empty states now use the v2.42 state pattern.
- 2026-06-26 admin: new tournament wizard previous-import now reads real manageable tournaments, venue search no longer falls back to hardcoded mock venues, PDF/association actions navigate to real routes, and teams player errors use Toss toast.
- 2026-06-26 admin: recorders/admins panels now share Toss `tp-*` list/message/avatar/role classes; both panels scan clean for legacy BDR token residue.
- 2026-06-26 admin: teams panel player table and bulk-import modal now use Toss `tt-*` classes; the remaining style scan hit is only real team `primaryColor` data binding.
- 2026-06-26 admin: teams detail modal shell/header/category/payment/manager controls now use Toss `tt-*` classes while preserving edit, token, print, and status actions.
- 2026-06-26 admin: teams panel list surface now uses Toss `tt-*` classes for readiness cards, division group headers, team metadata, seed/group mini inputs, and visible badges.
- 2026-06-26 admin: teams panel badge helpers now use Toss `tt-badge`/`tt-stat-card` classes for status, applied-via, payment, roster progress, and via stats.
- 2026-06-26 admin: matches client table, mobile cards, ScoreModal, errors, and filter labels now use Toss-only `amt-*` classes; legacy BDR token scan is clean for the matches files.
- 2026-06-26 admin: bracket panel full match lists and multi-division bracket filters/sections now reuse Toss match/section classes; `--color-*`/`rounded-[4px]`/`rounded-full` scan is clean for the panel.
- 2026-06-26 admin: dual bracket sections and match cards now use Toss `ta-dual-*`/`ta-match-*` classes while preserving collapse and score/status display behavior.
- 2026-06-26 admin: bracket panel round-1 team assignment editor now uses Toss `ta-round-*` grid/select/badge classes for stable desktop/mobile layout.
- 2026-06-26 admin: bracket panel top version/generate controls now use Toss-only `ta-version-*` classes instead of local BDR `--color-*`/`rounded-[4px]` styling.
- 2026-06-26 admin: divisions panel selected categories now render as visible Toss chips with direct delete controls; local BDR radius/color residue was removed and row grids use shrink-safe columns.
- 2026-06-26 admin: v2.42 parity inventory now treats `ct-panel-embed` as canonical and keeps the divisions panel visible by default in the Toss workspace; `ta-*` remains a migration cleanup target.
- 2026-06-26 design: BDR v2 (40) is a v2.42 public-site wiring delta; it supersedes the v39 public-site fiction note and sets 44 teams / 27 matches / 4 divisions as the shared admin/public baseline.
- 2026-06-26 design: v2.42 integrated Claude.ai request asks for admin Toss full-parity state screens, schedule/bracket/matches/teams/site function flows, cleanup manifest, and data contracts.
- 2026-06-26 design: admin Toss v2.41 full parity audit defines canonical files, mixed CSS/component layers, cleanup candidates, and required schedule/bracket edge-case design requests.
- 2026-06-26 admin: tournament operation workspace now auto-opens division/match/team panels by step/hash; division delete is selection-sync based and requires saving the changed selection.
- 2026-06-26 admin: tournament detail page looked unchanged because the live route still used the legacy `ct-page--workspace`/`ct-grid--workspace` shell; it now uses v2.41 `tw-shell`/`tw-steps`/`tw-foot` and embedded panel headers were removed.
- 2026-06-26 design: BDR v2 (39) only corrected v2.41 admin mock consistency; active handoff now uses 44 teams/27 matches, while public site 38-team fiction remains PM-decision gated.
- 2026-06-26 admin: `Icon` supports common legacy Material names as lucide aliases; organization detail top/tab icons now use the Toss Icon wrapper.
- 2026-06-26 admin: organization members page now uses v2.41 Toss `ts-ph`, `ad-panel`, `ad-listrow`, `ts-badge`, and lucide `Icon` wrappers.
- 2026-06-26 admin: series hard-delete confirmation now uses v2.41 Toss `Icon`, `ts-modal`, `ts-input`, and `ts-btn--danger`.
- 2026-06-26 admin: tournament-admin series creation wizard now uses v2.41 Toss `ts-ph`, `ts-steps`, `ad-panel`, form controls, and lucide `Icon` wrappers.
- 2026-06-26 admin: tournament-admin organization creation form now uses v2.41 Toss `ts-ph`, `ad-panel`, `ts-input`, `ts-select`, and lucide `Icon` wrappers.
- 2026-06-26 admin: tournament-admin series detail now uses v2.41 `ts-ph`, `ad-kpi-*`, and static `ad-table` edition rows.
- 2026-06-26 admin: tournament-admin series list now uses v2.41 `ts-ph` and static `ad-tablescroll`/`ad-table` server markup.
- 2026-06-26 admin: tournament-admin organizations list now uses v2.41 `ts-ph`, `ad-cardgrid`, `ad-card`, `Empty`, and lucide `Icon` wrappers.
- 2026-06-26 admin: tournament workspace detail header and site panel remaining visible legacy buttons now use v2.41 `ts-btn` classes.
- 2026-06-26 admin: v2.41 Toss package KPI rows use `ad-kpi-*` classes; browser QA needs DB pooler connectivity.
- 2026-06-26 admin: shared DataTable wrappers use v2.41 `ad-tablescroll`/`ad-table` classes.
- 2026-06-26 admin: shared PageHead/Toolbar use v2.41 `ts-ph` and `ad-toolbar` structures.
- 2026-06-26 admin: `/admin/tournaments` top area uses v2.41 PageHead, search toolbar, and clean KPI labels.
- 2026-06-26 admin: tournament detail, organizer management, and audit log pages use v2.41 Toss PageHead/buttons.
- 2026-06-26 theme: `--color-on-primary` is defined as white so red primary buttons do not inherit black text.
- 2026-06-26 live: box score now has a per-team `기본/고급` toggle, advanced-stat help, and game-wide PIE denominator wiring.
- 2026-06-26 tournament-admin: match-level manual recording mode is now a real non-record-system mode instead of Flutter fallback.
- 2026-06-26 record-app: separated game-rule time presets from nonstop/all-dead clock mode.

Updated: 2026-07-01

| File | Entries | Recent |
|---|---:|---|
| architecture.md | 4 | Tournament operate/edit route split |
| conventions.md | 3 | Recording Mode Copy |
| decisions.md | 9 | Electronic Score-Sheet Naming |
| errors.md | 9 | Group stage knockout preview count diverged from generator |
| lessons.md | 0 | - |

Recent work:
- 2026-07-01 score-sheet: the visible toolbar gained a possession action button that opens the existing jump-ball/held-ball flow; Chrome confirmed the jump-ball dialog opens from the toolbar.
- 2026-07-01 score-sheet: the electronic score-sheet v2 running-score header gained an in-sheet current-period chip; Chrome confirmed a visible 64x27 Q1 chip at 1024px without page scroll.
- 2026-07-01 score-sheet: personal-foul columns in electronic score-sheet v2 were widened by redistributing leftover roster width; Chrome metrics confirmed 0px right gap at 1440px and 1024px.
- 2026-07-01 score-sheet: current-period chip and period-colored running-score marks were added to the electronic score-sheet v2 layout; visual checks passed at 1366px/1024px and color verification confirmed Q1/Q2/Q3/Q4 mappings.
- 2026-06-27 admin: tournament teams tab now renders the v2.41 Toss visible order and removes the nested panel-level `data-skin` background that made the body look unchanged/grey; TypeScript, diff check, and local Chrome DOM metrics passed.
- 2026-06-27 admin: tournament audit-log native table moved to Toss `ad-native-table`; TypeScript, diff check, scan, and local Chrome old-table DOM check passed.
- 2026-06-27 admin: active status badges were moved from `admin-stat-pill` to Toss `ad-pill` with matching tone CSS; TypeScript, diff check, and local Chrome `/admin/users` DOM check passed.
- 2026-06-27 admin: `/admin` dashboard local chart/log/stat markup moved to Toss `ad-*` classes; TypeScript, diff check, and local Chrome DOM cleanup passed after one reload retry for dev-server compile latency.
- 2026-06-27 admin: shared stat, empty, and status-tab components moved to Toss `ad-*` markup; TypeScript, diff check, and local Chrome `/admin` DOM check passed.
- 2026-06-27 admin: mobile admin navigation was rebuilt on Toss `ad-mobile-*`/`ad-side-*` classes; TypeScript, cleanup scan, diff check, and local Chrome `/admin/tournaments` DOM check passed.
- 2026-06-27 admin: shared `AdminShell` was moved from old shell wrapper classes to Toss `ad-*` shell wrappers; TypeScript, diff check, local Chrome `/admin/tournaments`, and operate workspace DOM checks passed.
- 2026-06-27 admin: shared `AdminPageHeader` was rebuilt on canonical Toss `ts-ph` markup without changing callers; local Chrome confirmed `/admin/tournaments` and `/tournament-admin/tournaments` render with no `admin-pageheader` DOM residue.
- 2026-06-27 admin: admin-scope Material Symbols and `components/ui` dependencies were removed; icons now route through admin Toss lucide aliases, loading skeletons use Toss `st-skel`, and local Chrome verified `/admin/tournaments` plus operate workspace with no `material-symbols-outlined`/`au-*`/`ta-*` DOM residue.
- 2026-06-27 admin: 2-group/3-qualifier group-stage knockout seeding now crosses groups in the first round, propagates bye slots without fake games in the operate preview, and shows `본선 5경기`; local Chrome, Vitest, TypeScript, and diff check passed.
- 2026-06-27 recording: Gangnam Association Cup D5 was switched to electronic score-sheet mode for the tournament default and all 13 matches; visible "종이 기록지" copy was renamed to "전자기록지" while compatibility data keys were preserved.
- 2026-06-26 admin: tournament operation entry was split so `/tournament-admin/tournaments/[id]` renders the Toss 6-menu operate workspace and `/edit` retains the setup/edit form workspace.
- 2026-06-26 admin: division rule settings save UX was fixed by replacing hidden blur persistence with an explicit settings save control and confirmed server-response state refresh.
- 2026-06-26 admin: bracket generation was fixed for live ops by exposing division-rule generation at 0 matches, disabling unsafe tournament-level generation when rules exist, supporting division single-elimination/round-robin, and blocking invalid group sizes without consuming a bracket version.
- 2026-06-26 admin: tournament team division operations were fixed for live use with single/bulk category move controls, team/player division sync, and clearer division delete blocking messages.
- 2026-06-26 admin: BDR v2 (41) state/cleanup pass replaced destructive browser confirms and prompt flows with Toss modals, added Toss state helpers/skeleton CSS, and pushed dev/main.
- 2026-06-26 admin: new tournament wizard previous import, venue search, PDF/association actions, and teams player error feedback were wired to real APIs/routes/Toss toast and pushed through dev/main.
- 2026-06-26 admin: recorders/admins panel list rows, messages, avatars, role badges, and danger actions were normalized to shared Toss `tp-*` classes.
- 2026-06-26 admin: teams player table and bulk-import modal were normalized to Toss local classes, leaving only intentional team brand-color data binding in the panel scan.
- 2026-06-26 admin: teams detail modal frame/header controls were normalized to Toss classes, including category/payment selects, manager inline edit controls, and status action buttons.
- 2026-06-26 admin: teams panel readiness cards, group headers, list metadata, seed/group mini inputs, and visible team list badges were normalized to Toss local classes.
- 2026-06-26 admin: teams panel shared status/via/payment/roster badges and via-stat cards were converted from inline BDR tokens to Toss `tt-*` classes.
- 2026-06-26 admin: matches table/mobile cards/ScoreModal were moved to Toss `amt-*` classes while keeping match generation, filters, score editing, and recording-mode save flows unchanged.
- 2026-06-26 admin: bracket panel full match lists and multi-division filters/sections were normalized to Toss local classes, completing the panel-level token/radius cleanup scan.
- 2026-06-26 admin: dual bracket section headers, grouped match cards, status chips, and team score rows were moved to Toss-only local classes.
- 2026-06-26 admin: bracket panel round-1 assignment rows were converted to Toss-only grid/select/badge styling while keeping `updateMatchTeam` behavior unchanged.
- 2026-06-26 admin: bracket panel top version/generate block was converted to Toss-only local classes while preserving generation, regeneration, and activate-version handlers.
- 2026-06-26 admin: selected division chips with direct delete controls were added, division grids were stabilized, and local `rounded-[4px]`/`--color-*` residue was removed from the divisions panel.
- 2026-06-26 admin: v2.42 parity inventory was added, workspace panel frames moved to canonical `ct-panel-embed`, and the divisions panel is forced visible while the divisions step is active.
- 2026-06-26 design: BDR v2 (40) wiring delta was imported into BDR-current, active admin Toss data was corrected with `homeId/awayId`, and public site data-gating work was added to the remaining task list.
- 2026-06-26 design: v2.42 integrated Claude.ai request was created for admin Toss full parity, including schedule/bracket/matches/teams/site state screens, cleanup manifest, and data contract outputs.
- 2026-06-26 design: admin Toss v2.41 full parity audit was created to drive 100% screen matching, deletion sequencing, schedule/bracket function import, and additional Claude.ai design requests.
- 2026-06-26 admin: duplicate tournament detail header was removed, division/match/team panels now auto-open by step/hash, and division selection/delete/save UI spacing was stabilized.
- 2026-06-26 admin: tournament detail workspace was replaced with the v2.41 Toss shell/step/footer flow, schedule became its own step, and panel-level standalone headers/back links were removed.
- 2026-06-26 design: BDR v2 (39) was checked as mock consistency rather than source wiring; active v2.41 admin handoff now documents 44-team/27-match baseline and leaves public site mock untouched pending PM decision.
- 2026-06-26 admin: organization detail top actions/tab icons moved to the Toss Icon wrapper, with common Material icon names aliased to lucide components.
- 2026-06-26 admin: organization members page was rebuilt on v2.41 Toss invite/list patterns while preserving member invite and delete API flows.
- 2026-06-26 admin: series hard-delete button and confirmation modal were rebuilt on v2.41 Toss modal/danger-button patterns while preserving the DELETE API flow.
- 2026-06-26 admin: tournament-admin series creation wizard was rebuilt on v2.41 Toss stepper/form structures while preserving organization fetch and `/api/web/series` payload.
- 2026-06-26 admin: tournament-admin organization creation form was rebuilt on v2.41 Toss form controls while preserving `/api/web/organizations` payload fields.
- 2026-06-26 admin: tournament-admin series detail was rebuilt on v2.41 Toss header/KPI/table structures while preserving permission and Prisma lookup logic.
- 2026-06-26 admin: tournament-admin series list was rebuilt on v2.41 Toss PageHead/table markup without changing the Prisma query.
- 2026-06-26 admin: tournament-admin organizations list was rebuilt on v2.41 Toss PageHead/cardgrid/Empty structures while preserving `/api/web/organizations` data mapping.
- 2026-06-26 admin: tournament workspace detail header and site panel remaining visible legacy buttons were normalized to v2.41 Toss `ts-btn`.
- 2026-06-26 admin: tournament detail auxiliary pages were cleaned of legacy `.btn`/Material Symbols header actions and aligned to Toss PageHead/buttons.
- 2026-06-26 admin: `/admin/tournaments` top area now follows v2.41 Toss PageHead + ad-toolbar + KPI flow while preserving server search and pagination.
- 2026-06-26 admin: shared PageHead and Toolbar were aligned with v2.41 `ts-ph`/`ad-toolbar` package structure.
- 2026-06-26 admin: shared admin DataTable wrappers were aligned with v2.41 `ad-tablescroll`/`ad-table` package structure.
- 2026-06-26 admin: BDR v2.41 admin Toss package was reviewed and shared KPI rows were converted from v2.40 `au-stat` to v2.41 `ad-kpi-*`.
- 2026-06-26 design: v2.41 admin Toss reverse-bake handoff was absorbed into `BDR-current`; admin/operation areas keep Toss as the official design system while public user surfaces keep BDR rules.
- 2026-06-26 theme: added the missing `--color-on-primary` alias used by primary buttons.
- 2026-06-26 live: box score tables now switch between basic and advanced stats, with one help popover per team table and PIE calculated against both teams.
- 2026-06-26 tournament-admin: target tournament panels/components no longer depend on shadcn `Card/Button`; wrappers use Toss `ts-*`/`ct-emptybox`.
- 2026-06-26 tournament-admin: `game_time`/`game_method` are derived from canonical `game_rules`, and match-level manual recording mode is counted and blocked from Flutter/score-sheet system inputs.
- 2026-06-26 tournament-admin: selected division rows now support inline rename/delete and validate empty/duplicate names before sync.
- 2026-06-26 record-app: game-rule presets now cover time/period only, while `clock_mode` remains a separate v1 response field and admin control.
- 2026-06-25 tournament-admin: fixed edit/delete persistence for venue fields, unused division rule deletion, and stale division schedule cleanup.
- 2026-06-25 tournament: 조별리그+토너먼트에서 홀수/비 2의 제곱 진출팀을 부전승 포함 트리로 생성하도록 보강.
- 2026-06-25 tournament: 조별리그+토너먼트 본선 generator와 3개 조 이상 동순위 순위결정전 생성을 구현.
- 2026-06-25 tournament: 대회 포맷 표준을 6개로 정리하고 신규 생성/관리/공개 라벨과 요강 추출 기준을 통일.
- 2026-06-25 customer-signals: `/help/contact` 접수 폼, `/api/web/customer-signals`, 공통 메일러, 기존 경기/코트 신고 트리거 메일 보고를 추가.
- 2026-06-25 referee: KBA 심판/경기원 규정과 FIBA table officials 기준에 맞춰 기록원·계시원을 경기원 직군으로 통합.
- 2026-06-25 agents: `POST /api/web/admin/agents/record-app-impact` 규칙 기반 서버 API를 추가해 기록앱 영향 패킷을 반환.
- 2026-06-25 agents: `bdr_stat_v3` repo를 기록앱 기준으로 고정하고 record-app liaison 소통/서버 영향 분석 MVP 방향을 문서화.
- 2026-06-25 agents: 상황별 운영 워크플로우 문서로 작은 수정/UI/DB/`api/v1`/배포/장애 대응 에이전트 호출 순서를 고정.
- 2026-06-25 agents: BDR 운영 에이전트에 reviewer/release/ops/content/db 역할과 기록 앱 liaison 협업 게이트를 추가.
- 2026-06-25 admin: 종별별 승인팀 자동 조편성 API와 참가팀 화면 버튼을 추가해 `groupName`/`seedNumber`를 대진 생성 전 준비할 수 있게 함.
- 2026-06-25 admin: 대회 생성의 종별 일정/체육관 배정을 관리 저장 API와 정합시키고 참가팀 화면에 승인팀 기준 종별별 대진 준비 현황을 추가.
- 2026-06-25 tournament: 카카오 장소 검색, 지도/길안내 URL 저장, 공개 일정 길안내, 경기장 알림 cron을 연결.
- 2026-06-25 admin: 대회 관리자 설정을 생성 흐름과 맞춰 다중 후원사, 체육관, 일정 저장과 모바일 2행 경기 프리셋을 반영.
- 2026-06-25 admin: 경기 운영 패널과 기록 방식 카드를 생성 화면 톤으로 정리하고 모바일 경기 카드를 추가.
- 2026-06-24 Security: PostCSS override로 Next 하위 취약 버전 제거, `npm audit` 0건 확인.
- 2026-06-24 Security: 취약 `xlsx` 제거, `.xlsx` 전용 파서와 스플릿 생성기 교체, high/critical audit 0건 확인.
- 2026-06-23 QA/STAGE: v2.40 기준 디자인 일관 QA 패키지와 STAGE E/F/G 실행 순서 정리.

Recent membership work:
- 2026-06-25 membership: `membershipType` is the global permission grade, while feature subscriptions now share a common usable-subscription check for payment, profile, site, and admin flows.
