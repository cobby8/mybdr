-- ============================================================
-- 팀 유니폼 색상 (홈/어웨이) 신규 필드 추가
-- 작성일: 2026-04-29
-- 작성자: developer (subin 브랜치, design_v2)
-- 실행 정책: 운영 DB 수동 실행 (PM 승인 후)
-- 멱등성: IF NOT EXISTS / WHERE 조건으로 중복 실행 안전
-- ============================================================

-- 배경:
--  - 팀 생성 폼에서 단일 "팀 컬러" 를 "홈 유니폼 / 어웨이 유니폼" 2색으로 분리.
--  - 기존 primary_color / secondary_color 컬럼은 하위 호환을 위해 유지 (deprecate 예정).
--  - 신규 home_color / away_color 컬럼을 추가하고, 기존 데이터는 primary_color → home_color 로 백필.
--  - logo_url 컬럼은 이미 존재하므로 별도 추가하지 않음.

BEGIN;

-- 1) 컬럼 추가 (멱등)
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS home_color VARCHAR(20),
  ADD COLUMN IF NOT EXISTS away_color VARCHAR(20);

-- 2) 기존 데이터 백필 — primary_color 가 있는 팀은 home_color 로 복사
--    (이미 home_color 가 채워진 팀은 건드리지 않음 — 재실행 안전)
UPDATE teams
   SET home_color = primary_color
 WHERE home_color IS NULL
   AND primary_color IS NOT NULL
   AND primary_color <> '';

-- 3) 어웨이 색상도 secondary_color 가 있으면 백필
--    (NULL/빈문자만 채움 — 재실행 안전)
UPDATE teams
   SET away_color = secondary_color
 WHERE away_color IS NULL
   AND secondary_color IS NOT NULL
   AND secondary_color <> '';

COMMIT;

-- ============================================================
-- 검증 쿼리 (수동 실행 후 확인용)
-- ============================================================
-- 1) 컬럼 존재 확인 → 2 rows
-- SELECT column_name, data_type, character_maximum_length
--   FROM information_schema.columns
--  WHERE table_name = 'teams'
--    AND column_name IN ('home_color', 'away_color');
--
-- 2) 백필 결과 확인
-- SELECT
--   COUNT(*) FILTER (WHERE home_color IS NOT NULL) AS home_filled,
--   COUNT(*) FILTER (WHERE away_color IS NOT NULL) AS away_filled,
--   COUNT(*) AS total
-- FROM teams;
--
-- 3) 샘플 5건 확인
-- SELECT id, name, primary_color, home_color, secondary_color, away_color
--   FROM teams
--  ORDER BY id DESC
--  LIMIT 5;
-- ============================================================
