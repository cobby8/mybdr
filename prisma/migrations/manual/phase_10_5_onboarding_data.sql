-- ============================================================
-- Phase 10-5 — 온보딩 데이터 저장 (users 5개 컬럼 추가)
-- 작성일: 2026-04-27
-- 실행 정책: 자동 실행 금지. 운영 DB 위험 → PM 승인 후 수동 실행만.
-- 실행 방법: psql $DATABASE_URL_PROD -f prisma/migrations/manual/phase_10_5_onboarding_data.sql
--
-- 배경:
--   Phase 9 P1-1b 에서 박제된 /onboarding/setup 의 클라이언트-only state
--   (스타일 / 지역 / 빈도 / 목표) 를 DB 에 저장하기 위한 컬럼 신설.
--   onboarding_completed_at 은 위저드 재진입 차단 분기에 사용.
--
-- 컬럼:
--   styles                   text[]  default '{}'  플레이 스타일 12종 중 최대 4
--   active_areas             text[]  default '{}'  활동 지역 18종 다중
--   goals                    text[]  default '{}'  가입 목표 6종 다중
--   play_frequency           varchar null          빈도 4종 단일 (daily/weekly/monthly/rare)
--   onboarding_completed_at  timestamp null        완료 시각
-- ============================================================
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS styles                  TEXT[]    NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS active_areas            TEXT[]    NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS goals                   TEXT[]    NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS play_frequency          VARCHAR,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP(6);

COMMIT;

-- ROLLBACK (필요 시):
-- BEGIN;
--   ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed_at;
--   ALTER TABLE users DROP COLUMN IF EXISTS play_frequency;
--   ALTER TABLE users DROP COLUMN IF EXISTS goals;
--   ALTER TABLE users DROP COLUMN IF EXISTS active_areas;
--   ALTER TABLE users DROP COLUMN IF EXISTS styles;
-- COMMIT;
