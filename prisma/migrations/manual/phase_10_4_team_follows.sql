-- ============================================================
-- Phase 10-4 — 팀 팔로우 + 매치 신청 시스템
-- 작성일: 2026-04-27
-- 실행 정책: ⚠️ 자동 실행 금지. 운영 DB 위험 → PM 승인 후 수동 실행만.
-- 실행 방법: psql $DATABASE_URL_PROD -f prisma/migrations/manual/phase_10_4_team_follows.sql
-- ============================================================
BEGIN;

-- 1. team_follows 테이블 — 회원 ↔ 팀 N:N 팔로우 관계
CREATE TABLE IF NOT EXISTS team_follows (
  id         BIGSERIAL PRIMARY KEY,
  team_id    BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 동일 회원의 동일 팀 중복 팔로우 차단 (언팔로우는 행 삭제)
CREATE UNIQUE INDEX IF NOT EXISTS index_team_follows_on_team_and_user
  ON team_follows (team_id, user_id);

-- 회원별 팔로우 목록 / 팀별 팔로워 수 빠른 조회용
CREATE INDEX IF NOT EXISTS index_team_follows_on_user_id
  ON team_follows (user_id);
CREATE INDEX IF NOT EXISTS index_team_follows_on_team_id
  ON team_follows (team_id);

-- 2. team_match_requests 테이블 — 팀 간 매치 신청 (from → to)
-- status: pending(기본) / accepted / rejected / cancelled
-- 본 phase 10-4 에서는 POST(pending 생성)만 활성. 수락/거절은 후속 PATCH 작업.
CREATE TABLE IF NOT EXISTS team_match_requests (
  id             BIGSERIAL PRIMARY KEY,
  from_team_id   BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  to_team_id     BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  proposer_id    BIGINT NOT NULL REFERENCES users(id),
  message        TEXT,
  preferred_date TIMESTAMP(6),
  status         VARCHAR NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 호스트 팀 인박스 정렬 (status 필터 함께)
CREATE INDEX IF NOT EXISTS index_team_match_requests_on_to_team_status
  ON team_match_requests (to_team_id, status);
-- 보낸 팀별 신청 이력
CREATE INDEX IF NOT EXISTS index_team_match_requests_on_from_team_id
  ON team_match_requests (from_team_id);

COMMIT;

-- ROLLBACK (필요 시):
-- BEGIN;
--   DROP INDEX IF EXISTS index_team_match_requests_on_from_team_id;
--   DROP INDEX IF EXISTS index_team_match_requests_on_to_team_status;
--   DROP TABLE IF EXISTS team_match_requests;
--
--   DROP INDEX IF EXISTS index_team_follows_on_team_id;
--   DROP INDEX IF EXISTS index_team_follows_on_user_id;
--   DROP INDEX IF EXISTS index_team_follows_on_team_and_user;
--   DROP TABLE IF EXISTS team_follows;
-- COMMIT;
