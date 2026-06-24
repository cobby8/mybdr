-- Allow team-owned play-by-play events such as team rebounds.
-- These rows belong to a tournament team, but not to an individual player.

ALTER TABLE play_by_plays
  ALTER COLUMN tournament_team_player_id DROP NOT NULL;
