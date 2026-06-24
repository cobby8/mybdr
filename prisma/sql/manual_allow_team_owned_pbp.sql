-- ============================================================================
-- Allow team-owned play_by_plays rows
-- ============================================================================
-- Why:
--   Flutter records timeout, team turnover, bench technical, and team rebound as
--   team-owned PBP rows. They are valid official timeline events, but they do
--   not belong to an individual tournament_team_player.
--
-- Safety:
--   This is an additive/relaxing schema change. Existing player-owned rows keep
--   their tournament_team_player_id values. New team-owned rows may store NULL.
--
-- Apply:
--   psql "$DIRECT_URL" -f prisma/sql/manual_allow_team_owned_pbp.sql
--   npm run db:pull
--   npm run db:generate
-- ============================================================================

ALTER TABLE "play_by_plays"
  ALTER COLUMN "tournament_team_player_id" DROP NOT NULL;
