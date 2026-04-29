-- ============================================================
-- Phase 10 — 통합 운영 DB 마이그레이션 (4건 합본)
-- 작성일: 2026-04-29
-- 실행 정책: 운영 DB. PM 승인 후 수동 실행만. 사전 백업 권장.
--
-- 포함 내역:
--   Phase 10-1: game_reports + game_player_ratings + games.final_mvp_user_id + users.manner_score/manner_count + teams.name_primary VarChar(10)
--   Phase 10-3: game_applications.experience_years + accepted_terms + 게스트 인덱스
--   Phase 10-4: team_follows + team_match_requests + 인덱스 5
--   Phase 10-5: users.styles + active_areas + goals + play_frequency + onboarding_completed_at
--
-- 실행 방법 1 (Supabase 대시보드, 권장):
--   1) https://supabase.com/dashboard 운영 프로젝트 선택
--   2) SQL Editor 열기
--   3) 본 파일 내용 전체 복붙 → Run
--
-- 실행 방법 2 (psql):
--   psql $DATABASE_URL_PROD -f prisma/migrations/manual/phase_10_all_combined.sql
--
-- 모든 ALTER/CREATE는 IF NOT EXISTS 멱등 — 이미 적용된 항목은 skip.
-- 트랜잭션 1개로 묶음 — 중간 실패 시 전체 롤백.
-- ============================================================

BEGIN;

-- ============================================================
-- Phase 10-1: 경기 평가/신고
-- ============================================================

CREATE TABLE IF NOT EXISTS game_reports (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT NOT NULL,
  reporter_user_id BIGINT NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  comment TEXT,
  mvp_user_id BIGINT,
  status VARCHAR NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT game_reports_game_fk FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE NO ACTION,
  CONSTRAINT game_reports_reporter_fk FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE NO ACTION,
  CONSTRAINT game_reports_mvp_fk FOREIGN KEY (mvp_user_id) REFERENCES users(id) ON DELETE NO ACTION,
  CONSTRAINT game_reports_unique_reporter UNIQUE (game_id, reporter_user_id)
);
CREATE INDEX IF NOT EXISTS game_reports_game_id_idx ON game_reports(game_id);
CREATE INDEX IF NOT EXISTS game_reports_status_idx ON game_reports(status);

CREATE TABLE IF NOT EXISTS game_player_ratings (
  id BIGSERIAL PRIMARY KEY,
  game_report_id BIGINT NOT NULL,
  rated_user_id BIGINT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_noshow BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT game_player_ratings_report_fk FOREIGN KEY (game_report_id) REFERENCES game_reports(id) ON DELETE CASCADE,
  CONSTRAINT game_player_ratings_rated_user_fk FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE NO ACTION,
  CONSTRAINT game_player_ratings_unique UNIQUE (game_report_id, rated_user_id)
);
CREATE INDEX IF NOT EXISTS game_player_ratings_rated_user_idx ON game_player_ratings(rated_user_id);

ALTER TABLE games ADD COLUMN IF NOT EXISTS final_mvp_user_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'games_final_mvp_user_fk') THEN
    ALTER TABLE games ADD CONSTRAINT games_final_mvp_user_fk
      FOREIGN KEY (final_mvp_user_id) REFERENCES users(id) ON DELETE NO ACTION;
  END IF;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS manner_score DECIMAL(3, 2),
  ADD COLUMN IF NOT EXISTS manner_count INTEGER NOT NULL DEFAULT 0;

DO $$
DECLARE
  max_len INTEGER;
BEGIN
  SELECT COALESCE(MAX(LENGTH(name_primary)), 0) INTO max_len FROM teams WHERE name_primary IS NOT NULL;
  IF max_len > 10 THEN
    RAISE EXCEPTION 'teams.name_primary 컬럼에 11자 이상 데이터(% 자) 존재. 마이그레이션 중단.', max_len;
  END IF;
END $$;

ALTER TABLE teams ALTER COLUMN name_primary TYPE VARCHAR(10);

-- ============================================================
-- Phase 10-3: 게스트 지원
-- ============================================================

ALTER TABLE game_applications
  ADD COLUMN IF NOT EXISTS experience_years SMALLINT,
  ADD COLUMN IF NOT EXISTS accepted_terms JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_game_applications_user_id_is_guest_status
  ON game_applications (user_id, is_guest, status)
  WHERE is_guest = true;

-- ============================================================
-- Phase 10-4: 팀 팔로우 + 매치 신청
-- ============================================================

CREATE TABLE IF NOT EXISTS team_follows (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT team_follows_team_fk FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT team_follows_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT team_follows_unique UNIQUE (team_id, user_id)
);
CREATE INDEX IF NOT EXISTS team_follows_user_id_idx ON team_follows(user_id);
CREATE INDEX IF NOT EXISTS team_follows_team_id_idx ON team_follows(team_id);

CREATE TABLE IF NOT EXISTS team_match_requests (
  id BIGSERIAL PRIMARY KEY,
  from_team_id BIGINT NOT NULL,
  to_team_id BIGINT NOT NULL,
  proposer_id BIGINT NOT NULL,
  message TEXT,
  preferred_date TIMESTAMP(6),
  status VARCHAR NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT team_match_requests_from_fk FOREIGN KEY (from_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT team_match_requests_to_fk FOREIGN KEY (to_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT team_match_requests_proposer_fk FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE NO ACTION
);
CREATE INDEX IF NOT EXISTS team_match_requests_to_status_idx ON team_match_requests(to_team_id, status);
CREATE INDEX IF NOT EXISTS team_match_requests_from_idx ON team_match_requests(from_team_id);

-- ============================================================
-- Phase 10-5: 온보딩 데이터 저장
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS styles TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS active_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS play_frequency VARCHAR,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP(6);

COMMIT;

-- ============================================================
-- 검증 쿼리 (실행 후 수동)
-- ============================================================
-- SELECT COUNT(*) FROM game_reports;             -- 0
-- SELECT COUNT(*) FROM game_player_ratings;      -- 0
-- SELECT COUNT(*) FROM team_follows;             -- 0
-- SELECT COUNT(*) FROM team_match_requests;      -- 0
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='users' AND column_name IN ('manner_score','manner_count','styles','active_areas','goals','play_frequency','onboarding_completed_at');
-- 7 rows 반환되면 성공
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='game_applications' AND column_name IN ('experience_years','accepted_terms');
-- 2 rows 반환되면 성공
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='games' AND column_name='final_mvp_user_id';
-- 1 row 반환되면 성공
