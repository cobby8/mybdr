-- ============================================================
-- Phase 10-1 — 경기 평가/신고 시스템 (game_reports + game_player_ratings)
--
-- 작성일: 2026-04-27
-- 작성자: developer
-- 실행 정책: 자동 실행 금지. 운영 DB 위험 → PM 승인 후 수동 실행만 허용.
--   (CLAUDE.md "🚨 절대 금지 3: 운영 DB 대상 prisma db push/마이그레이션" 준수)
--
-- 변경 내역 (총 5건):
--   1. game_reports 테이블 신규 생성 — 1리포트 헤더(전체평점 + MVP지목 + 코멘트)
--   2. game_player_ratings 테이블 신규 생성 — 동행자별 매너평가/신고 (자식 테이블, CASCADE)
--   3. games 테이블에 final_mvp_user_id 컬럼 추가 — 경기 종료 후 확정 MVP 캐시
--   4. users 테이블에 manner_score, manner_count 2컬럼 추가 — 매너 점수 집계 캐시
--   5. teams.name_primary VarChar → VarChar(10) 타입 좁힘 (기존 schema drift 동기화)
--
-- 실행 방법 (운영자 수동):
--   psql $DATABASE_URL -f prisma/migrations/manual/phase_10_1_game_reports.sql
--
-- 사전 점검:
--   1) DATABASE_URL이 운영 DB(상용)인지 PM이 직접 확인 후 실행
--   2) 백업: pg_dump 권장 (특히 5번 teams 컬럼 타입 변경 — 운영에서 11자 이상 데이터 존재 시 잘림)
--      SELECT MAX(LENGTH(name_primary)) FROM teams;  -- 10 이하여야 안전
--
-- 롤백 SQL은 본 파일 하단 ROLLBACK 섹션 참조
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────
-- 1. game_reports 테이블 신규 생성
--    경기 종료(status=3) 후 참가자가 1인 1건 작성하는 평가 헤더
--    status 도메인: submitted(제출완료) / draft(임시저장) / reviewed(운영 검토완료) / dismissed(반려)
-- ─────────────────────────────────────────────
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

  -- FK: 게임/사용자 삭제는 NO ACTION (리포트 보존 우선)
  CONSTRAINT game_reports_game_fk
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE NO ACTION,
  CONSTRAINT game_reports_reporter_fk
    FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE NO ACTION,
  CONSTRAINT game_reports_mvp_fk
    FOREIGN KEY (mvp_user_id) REFERENCES users(id) ON DELETE NO ACTION,

  -- 한 경기에서 한 사람이 한 번만 제출 (race 방지)
  CONSTRAINT game_reports_unique_reporter UNIQUE (game_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS game_reports_game_id_idx ON game_reports(game_id);
CREATE INDEX IF NOT EXISTS game_reports_status_idx ON game_reports(status);

-- ─────────────────────────────────────────────
-- 2. game_player_ratings 테이블 신규 생성
--    1 리포트 안에 동행자 N명에 대한 매너평가/신고가 자식 row로 저장됨
--    flags 예시: ["late", "rude", "noshow"] — 검증은 application 레벨(zod)
--    is_noshow는 집계 편의를 위한 별도 컬럼 (flags와 중복 가능)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_player_ratings (
  id BIGSERIAL PRIMARY KEY,
  game_report_id BIGINT NOT NULL,
  rated_user_id BIGINT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_noshow BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),

  -- 부모 리포트 삭제 시 CASCADE (자식 row 자동 정리)
  CONSTRAINT game_player_ratings_report_fk
    FOREIGN KEY (game_report_id) REFERENCES game_reports(id) ON DELETE CASCADE,
  CONSTRAINT game_player_ratings_rated_user_fk
    FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE NO ACTION,

  -- 한 리포트에서 같은 사람을 두 번 평가 불가
  CONSTRAINT game_player_ratings_unique UNIQUE (game_report_id, rated_user_id)
);

CREATE INDEX IF NOT EXISTS game_player_ratings_rated_user_idx ON game_player_ratings(rated_user_id);

-- ─────────────────────────────────────────────
-- 3. games.final_mvp_user_id 컬럼 추가
--    game_reports.mvp_user_id 다수결 집계 결과를 캐시 (또는 운영자 수동 지정)
-- ─────────────────────────────────────────────
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS final_mvp_user_id BIGINT;

-- FK 추가 (별도 ALTER로 분리 — IF NOT EXISTS 미지원이라 실패 방지 위해 DO 블록)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'games_final_mvp_user_fk'
  ) THEN
    ALTER TABLE games
      ADD CONSTRAINT games_final_mvp_user_fk
      FOREIGN KEY (final_mvp_user_id) REFERENCES users(id) ON DELETE NO ACTION;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 4. users.manner_score / users.manner_count 컬럼 추가
--    manner_score: game_player_ratings.rating 평균 (1.00~5.00). 평가 0건이면 NULL
--    manner_count: 평가받은 누적 건수 (집계용)
--    기존 evaluation_rating(호스트/대회 평가용)과 의미 분리 — Phase 10-1 결정 Q1=B
-- ─────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS manner_score DECIMAL(3, 2),
  ADD COLUMN IF NOT EXISTS manner_count INTEGER NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────
-- 5. teams.name_primary VarChar → VarChar(10)
--    schema.prisma는 이미 VarChar(10)으로 정의됨. 운영 DB는 VarChar로 남아있을 수 있어 동기화.
--    (개발 DB는 ko/en 2자만 들어있어 안전 확인 완료. 운영은 사전 SELECT MAX 확인 필수)
-- ─────────────────────────────────────────────
DO $$
DECLARE
  max_len INTEGER;
BEGIN
  SELECT COALESCE(MAX(LENGTH(name_primary)), 0) INTO max_len FROM teams WHERE name_primary IS NOT NULL;
  IF max_len > 10 THEN
    RAISE EXCEPTION 'teams.name_primary 컬럼에 11자 이상 데이터(% 자) 존재. 마이그레이션 중단.', max_len;
  END IF;
END $$;

ALTER TABLE teams
  ALTER COLUMN name_primary TYPE VARCHAR(10);

COMMIT;

-- ============================================================
-- 검증 (실행 후 수동 확인)
-- ============================================================
-- SELECT COUNT(*) FROM game_reports;             -- 0 (신규)
-- SELECT COUNT(*) FROM game_player_ratings;      -- 0 (신규)
-- \d game_reports                                -- 컬럼/인덱스/FK 확인
-- \d game_player_ratings
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name='games' AND column_name='final_mvp_user_id';
-- SELECT column_name, data_type, character_maximum_length FROM information_schema.columns
--   WHERE table_name='users' AND column_name IN ('manner_score','manner_count');

-- ============================================================
-- ROLLBACK (전체 되돌리기 — PM 승인 후 수동 실행)
-- 주의: 실 데이터(리포트/평가) 입력 후 롤백하면 데이터 영구 삭제
-- ============================================================
-- BEGIN;
-- ALTER TABLE games DROP CONSTRAINT IF EXISTS games_final_mvp_user_fk;
-- ALTER TABLE games DROP COLUMN IF EXISTS final_mvp_user_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS manner_count;
-- ALTER TABLE users DROP COLUMN IF EXISTS manner_score;
-- DROP TABLE IF EXISTS game_player_ratings;  -- CASCADE 자식이라 먼저
-- DROP TABLE IF EXISTS game_reports;
-- ALTER TABLE teams ALTER COLUMN name_primary TYPE VARCHAR;  -- 5번만 되돌리는 경우
-- COMMIT;
