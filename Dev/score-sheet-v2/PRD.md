# BDR Electronic Scoresheet v2 PRD

Date: 2026-07-01
Owner: MYBDR / BDR scoring
Status: Phase 1 implementation started

## 1. Goal

BDR electronic scoresheet v2 must feel familiar to current official scorekeepers who are trained on the FIBA scoresheet.
The product should not replace the official scoring mental model with an app-like stat board. It should preserve the FIBA paper workflow and add electronic convenience on top.

In simple terms: the paper scoresheet is the map. v2 adds guardrails, auto totals, and easier touch targets without changing the map.

## 2. Non-goals

- Do not rebuild the scoring engine from scratch.
- Do not change the internal `paper` recording mode key unless a separate migration is planned.
- Do not remove the existing individual stat recording flow.
- Do not introduce a visually unfamiliar "dashboard first" recording screen.
- Do not make match finalization possible without required referee/game official signatures.

## 3. Official Scoring Principles

The implementation should follow these FIBA-style official scoresheet concepts:

- Match header confirms competition, date/time, venue, teams, referee crew, and scorer crew.
- Teams are recorded as Team A and Team B, with home/away labels shown as helpful BDR context.
- Starting five are marked before the match begins.
- Player rows carry number, name, player-in mark, personal fouls, and score/stat marks.
- Running score remains the official scoring backbone.
- Team fouls and time-outs are period-aware.
- Opening jump ball and held ball update the alternating possession arrow.
- If the score is tied at the end of the fourth period, the flow must continue to OT1, then OT2, etc.
- Finalization requires score verification and official signatures.

## 4. Current Implementation Inventory

The current electronic scoresheet already contains the core engine and should be reused.

### Existing Page

- Route: `src/app/(score-sheet)/score-sheet/[matchId]/page.tsx`
- Main client form: `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx`
- Current page loads match access, rosters, lineups, PBP-derived initial state, fouls, time-outs, signatures, player stats, period format, bench technicals, and delay-of-game state.

### Existing Components To Reuse

- `TeamSection`
  - Team roster rows
  - Player-in mark
  - Personal fouls
  - Team fouls
  - Time-outs
  - Coach / bench technical cells
  - Existing OR/DR/A/S/B/TO stat cells
- `RunningScoreGrid`
  - FIBA running score grid
  - Player selection for score marks
  - Period color marks
  - Period end handling
- `PeriodScoresSection`
  - Period scores, final score, winner, next period/end controls
- `FooterSignatures`
  - Scorer, assistant scorer, timer, shot clock operator, referee, umpire 1, umpire 2, protest captain signature, notes
- `LineupSelectionModal`
  - Pregame roster and starter selection
- `JumpBallModal`
  - Opening jump ball possession setup
- `PossessionConfirmModal`
  - Held ball confirmation
- `MatchEndButton`
  - Submit path and server persistence
- `StatPopover`
  - Existing individual stat +1/-1 flow

### Existing Pure Logic To Reuse

- `src/lib/score-sheet/running-score-helpers.ts`
- `src/lib/score-sheet/foul-helpers.ts`
- `src/lib/score-sheet/timeout-helpers.ts`
- `src/lib/score-sheet/possession-helpers.ts`
- `src/lib/score-sheet/player-stats-helpers.ts`
- `src/lib/score-sheet/build-submit-payload.ts`

### Existing Server Persistence To Reuse

- Submit route: `src/app/api/web/score-sheet/[matchId]/submit/route.ts`
- The submit path already persists:
  - `running_score`
  - `quarter_scores`
  - PBP converted from score marks
  - fouls converted to PBP
  - time-outs in match settings
  - signatures in match settings
  - possession events
  - `player_stats_input` into match player stats
  - lineup into `MatchLineupConfirmed`

## 5. Product Requirements

### 5.1 Pregame Flow

The entry flow should mirror the Flutter app's practical pregame rhythm:

1. Match information confirmation
   - Tournament
   - Match code
   - Division/category
   - Venue/court
   - Scheduled time
   - Recording mode
2. Game settings confirmation
   - Period format: 4 quarters / halves where applicable
   - Time-out/time structure display
   - Home/away, Team A/Team B mapping
3. Roster and starter setup
   - Home/Team A roster
   - Away/Team B roster
   - Starting five
   - Substitutes
   - Temporary jersey number flow should remain available
4. Opening jump ball
   - Jump ball winner
   - Possession arrow set automatically
5. Enter record screen

### 5.2 Landscape Recording Screen

The v2 record screen should be landscape-first.

Layout:

- Left: Home / Team A roster panel
- Center: Running score workspace
- Right: Away / Team B roster panel
- Top compact bar: match identity, period, total score, possession arrow, status
- Bottom or sticky operation strip: held ball, time-out, next period, previous period if allowed, edit/PBP, print, finalize

The roster panels must be much larger than current one-page paper mode. The current paper-style one-page layout is too compressed for live tablet operation.

### 5.3 Center Running Score

The center area should show:

- Home running score lane
- Away running score lane
- Period-aware marks
- Scrollable score lanes when the score grows
- Clear period separators
- Current period indicator
- Final score summary always visible

The FIBA running score mental model must remain intact. The visual arrangement can be wider and more touch-friendly.

### 5.4 Official Operation Buttons

The recording screen must include official operation controls:

- Held ball
- Opening jump ball state check
- Team time-out
- Next period
- Overtime when tied after Q4
- End match when a winner exists
- Previous period only as a guarded correction action
- PBP edit/correction
- Print/export

### 5.5 Individual Stats

The existing stat cells should remain:

- OR
- DR
- A
- S
- B
- TO

The current `StatPopover` +1/-1 model should be reused. In v2, stat touch targets should be larger and grouped close to the player row so the recorder can work without hunting for controls.

### 5.6 Finalization

When the game ends:

1. Show period-by-period score and final score.
2. Show winner.
3. Show validation warnings if any key official field is missing.
4. Require signatures before final submit:
   - Default referees: referee + umpire 1
   - Optional umpire 2
   - Default game officials: scorer + assistant scorer
   - Optional timer and shot clock operator where configured
5. Submit only after required signatures are complete.

The signature requirement should be configurable later by tournament settings, but v2 should start with a safe default.

## 6. Recommended Flutter-App Features To Bring Over

- Guided pregame setup
- Larger live action touch targets
- Clear OT labels: OT1, OT2, ...
- Guarded finalization
- Local draft autosave visibility
- PBP correction with clear audit trail
- Score/stat consistency checks before final submit
- Practice/test mode for training scorekeepers

## 7. Implementation Strategy

### Implemented In Phase 1 First Pass

- Replaced the compressed 2x2 body with a landscape layout:
  - left Home / Team A roster
  - center running score + period summary
  - right Away / Team B roster
  - signatures below the recording grid
- Expanded the score-sheet frame and toolbar from the old A4 screen width to a landscape tablet width.
- Kept the existing scoring engine, PBP conversion, fouls, time-outs, possession, player stats, and submit endpoint unchanged.
- Added a default finalization signature gate:
  - referee
  - umpire 1
  - scorer
  - assistant scorer
- Added pure helper tests for required signature detection.

### Phase 1: Safe v2 Shell

- Keep existing state and submit path.
- Extract the main render body of `score-sheet-form.tsx` into a v2 layout component.
- Place `TeamSection`, `RunningScoreGrid`, `PeriodScoresSection`, and `FooterSignatures` into the new landscape layout.
- Do not change scoring logic in this phase.

### Phase 2: Pregame Wizard

- Move lineup and jump ball from modal-first behavior into a visible pregame stepper.
- Reuse `LineupSelectionModal` logic or extract its inner selection state into shared components.
- Keep old modal fallback while v2 is being validated.

### Phase 3: Finalization Gate

- Add signature completeness validation before `MatchEndButton` can submit.
- Show a verification panel with period scores and final score.
- Keep server payload shape unchanged unless required-signature metadata must be added.

### Phase 4: Official Operation Polish

- Add a compact operation strip.
- Make held ball and next-period flows more obvious.
- Improve scroll behavior in center running score lanes.
- Add visual parity with FIBA paper labels while keeping BDR usability.

## 8. Risk Controls

- No database migration in Phase 1.
- No destructive route or payload changes.
- Existing tests for score-sheet helpers must keep passing.
- Add tests only around new guards or pure helpers.
- Keep old route URL `/score-sheet/[matchId]`.
- Use `paper` internally and "전자기록지" only as user-facing copy.

## 9. First Development Unit

Build a v2 layout wrapper that reuses existing child components.

Target files:

- `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx`
- New: `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-v2-layout.tsx`
- New or existing CSS in `src/app/(score-sheet)/_components/_score-sheet-styles.css`

Acceptance criteria:

- Existing recording functions still work.
- Team A/Home is left, Team B/Away is right.
- Running score is centered.
- Period score/final score remains visible.
- Footer signatures remain available.
- No server payload change.
- TypeScript passes.
