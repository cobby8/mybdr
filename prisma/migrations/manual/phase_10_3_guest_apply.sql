-- ============================================================
-- Phase 10-3 — 게스트 지원 흐름 (game_applications 확장)
-- 작성일: 2026-04-29
-- 실행 정책: ⚠️ 자동 실행 금지. 운영 DB 위험 → PM 승인 후 수동 실행만.
-- 실행 방법: psql $DATABASE_URL_PROD -f prisma/migrations/manual/phase_10_3_guest_apply.sql
-- ============================================================
BEGIN;

-- 1. game_applications 컬럼 2개 추가
ALTER TABLE game_applications
  ADD COLUMN IF NOT EXISTS experience_years SMALLINT,
  ADD COLUMN IF NOT EXISTS accepted_terms JSONB DEFAULT '{}'::jsonb;

-- 2. 게스트 조회 가속 인덱스
CREATE INDEX IF NOT EXISTS idx_game_applications_user_id_is_guest_status
  ON game_applications (user_id, is_guest, status)
  WHERE is_guest = true;

COMMIT;

-- ROLLBACK (필요 시):
-- BEGIN;
--   DROP INDEX IF EXISTS idx_game_applications_user_id_is_guest_status;
--   ALTER TABLE game_applications DROP COLUMN IF EXISTS accepted_terms;
--   ALTER TABLE game_applications DROP COLUMN IF EXISTS experience_years;
-- COMMIT;
