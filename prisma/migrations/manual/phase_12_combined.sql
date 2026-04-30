-- ============================================================
-- Phase 12 통합 마이그레이션 (12-A 시즌 통계 + 12-C 본인인증)
-- 작성일: 2026-04-30
-- 작성자: developer (subin 브랜치)
-- 근거: Dev/design/phase-12-plan-2026-04-30.md (옵션 12-B 단일 통합)
--
-- 실행 정책: 운영 DB 수동 실행 (PM 승인 후)
-- 적용 시점: dev 1주 안정화 후 (PM 결정 6번)
-- 멱등: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS — 재실행 안전
--
-- ⚠️ 주의:
--   - dev DB 에는 `npx prisma db push` 로 이미 적용됨 (2026-04-30)
--   - 운영 DB 는 본 SQL 파일을 psql 로 직접 실행 (PM 승인 필수)
--   - 트랜잭션(BEGIN/COMMIT) 으로 감싸 부분 적용 방지
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────
-- 12-C: User 모델 본인인증 컬럼 5개
-- 백필 X — 기존 사용자는 대회 신청 시점에 인증 (PM 결정 2번)
-- ─────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verified_name  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS verified_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS verified_birth DATE,
  ADD COLUMN IF NOT EXISTS name_verified  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at    TIMESTAMP(6);

-- ─────────────────────────────────────────────
-- 12-A: 시즌 통계 (UserSeasonStat)
-- 한 유저 × 한 시즌에 한 행 (UNIQUE user_id+season_year)
-- avg_rating: game_player_ratings 평균 (1.00~5.00)
-- rank_position: 시즌 순위 (NULL = 미집계 — 배치 잡이 채움)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_season_stats (
  id            BIGSERIAL    PRIMARY KEY,
  user_id       BIGINT       NOT NULL,
  season_year   INTEGER      NOT NULL,
  season_label  VARCHAR(50),
  games_played  INTEGER      NOT NULL DEFAULT 0,
  wins          INTEGER      NOT NULL DEFAULT 0,
  losses        INTEGER      NOT NULL DEFAULT 0,
  avg_rating    DECIMAL(3, 2),
  mvp_count     INTEGER      NOT NULL DEFAULT 0,
  rank_position INTEGER,
  total_minutes INTEGER      NOT NULL DEFAULT 0,
  total_xp      INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT user_season_stats_user_fk     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_season_stats_user_season UNIQUE (user_id, season_year)
);
CREATE INDEX IF NOT EXISTS user_season_stats_user_id_idx     ON user_season_stats(user_id);
CREATE INDEX IF NOT EXISTS user_season_stats_season_year_idx ON user_season_stats(season_year);

-- ─────────────────────────────────────────────
-- 12-A: 슛존 통계 (Phase 13+ 집계 — 테이블만 사전 생성)
-- zone_code 예시: "RA"(restricted area) / "PAINT" / "MID_LEFT" / "3PT_CORNER_L"
-- efficiency = made / attempts (0.0000 ~ 1.0000)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shot_zone_stats (
  id          BIGSERIAL    PRIMARY KEY,
  user_id     BIGINT       NOT NULL,
  season_year INTEGER      NOT NULL,
  zone_code   VARCHAR(20)  NOT NULL,
  attempts    INTEGER      NOT NULL DEFAULT 0,
  made        INTEGER      NOT NULL DEFAULT 0,
  efficiency  DECIMAL(5, 4),
  created_at  TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT shot_zone_stats_user_fk     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT shot_zone_stats_user_season_zone UNIQUE (user_id, season_year, zone_code)
);
CREATE INDEX IF NOT EXISTS shot_zone_stats_user_id_idx ON shot_zone_stats(user_id);

-- ─────────────────────────────────────────────
-- 12-A: 스카우팅 리포트 (Phase 13+ UI — 테이블만 사전 생성)
-- 한 평가자가 한 대상에게 한 행만 작성 (UNIQUE target+evaluator)
-- is_anonymous: 기본 true — 평가자 신원 비공개
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scouting_reports (
  id                BIGSERIAL    PRIMARY KEY,
  target_user_id    BIGINT       NOT NULL,
  evaluator_user_id BIGINT       NOT NULL,
  strengths         TEXT,
  weaknesses        TEXT,
  rating            INTEGER,
  comment           TEXT,
  is_anonymous      BOOLEAN      NOT NULL DEFAULT true,
  created_at        TIMESTAMP(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT scouting_reports_target_fk    FOREIGN KEY (target_user_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT scouting_reports_evaluator_fk FOREIGN KEY (evaluator_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT scouting_reports_target_evaluator UNIQUE (target_user_id, evaluator_user_id)
);
CREATE INDEX IF NOT EXISTS scouting_reports_target_idx ON scouting_reports(target_user_id);

COMMIT;

-- ============================================================
-- 검증 쿼리 (실행 후 수동 확인)
-- ============================================================
-- 1) User 본인인증 컬럼 5개 확인 → 5 rows 기대
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'users'
--     AND column_name IN ('verified_name','verified_phone','verified_birth','name_verified','verified_at')
--   ORDER BY column_name;
--
-- 2) 신규 테이블 3개 존재 확인 → 3 rows 기대
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--     AND table_name IN ('user_season_stats','shot_zone_stats','scouting_reports')
--   ORDER BY table_name;
--
-- 3) 인덱스 5개 확인
-- SELECT indexname FROM pg_indexes
--   WHERE schemaname = 'public'
--     AND indexname IN (
--       'user_season_stats_user_id_idx',
--       'user_season_stats_season_year_idx',
--       'shot_zone_stats_user_id_idx',
--       'scouting_reports_target_idx'
--     )
--   ORDER BY indexname;
--
-- 4) FK 제약 확인 → 4 rows 기대 (user_season_stats×1, shot_zone_stats×1, scouting_reports×2)
-- SELECT conname, conrelid::regclass FROM pg_constraint
--   WHERE contype = 'f'
--     AND conname IN (
--       'user_season_stats_user_fk',
--       'shot_zone_stats_user_fk',
--       'scouting_reports_target_fk',
--       'scouting_reports_evaluator_fk'
--     );
