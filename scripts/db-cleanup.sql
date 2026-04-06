-- ============================================
-- mybdr DB 정리 스크립트
-- 보존: admin@bdr.com, bdr.wonyoung@gmail.com, record01@mybdr.kr, record02@mybdr.kr
-- 나머지 전부 삭제
-- ============================================
-- ⚠️ 실행 전 백업 필수: pg_dump 또는 Supabase 대시보드 백업
-- Supabase SQL Editor에서 실행

BEGIN;

-- 보존할 user ID 확인 (1, 7, 2830, 2831)
-- SELECT id, email FROM users WHERE email IN ('admin@bdr.com', 'bdr.wonyoung@gmail.com', 'record01@mybdr.kr', 'record02@mybdr.kr');

-- ── 1단계: PBP / 경기 기록 ──
DELETE FROM play_by_plays;
DELETE FROM match_player_stats;
DELETE FROM match_events;
DELETE FROM duo_sessions;

-- ── 2단계: 경기 ──
DELETE FROM tournament_matches;

-- ── 3단계: 대회 선수/팀 ──
DELETE FROM tournament_team_players;
DELETE FROM tournament_teams;
DELETE FROM tournament_recorders;
DELETE FROM tournament_admin_members;

-- ── 4단계: 대회 ──
DELETE FROM bracket_versions;
DELETE FROM bracket_rounds;
DELETE FROM bracket_matches;
DELETE FROM tournament_series;
DELETE FROM tournaments;

-- ── 5단계: 팀 ──
DELETE FROM team_join_requests;
DELETE FROM team_member_histories;
DELETE FROM team_members;
DELETE FROM teams;

-- ── 6단계: 커뮤니티/소셜 ──
DELETE FROM comment_likes;
DELETE FROM comments;
DELETE FROM community_post_likes;
DELETE FROM community_posts;
DELETE FROM posts;
DELETE FROM board_favorites;
DELETE FROM notifications;
DELETE FROM push_subscriptions;

-- ── 7단계: 코트/픽업 ──
DELETE FROM court_checkins;
DELETE FROM court_reviews;
DELETE FROM court_reports;
DELETE FROM court_edit_suggestions;
DELETE FROM court_ambassadors;
DELETE FROM court_event_players;
DELETE FROM court_events;
DELETE FROM pickup_participations;
DELETE FROM pickup_games;
DELETE FROM user_favorite_courts;

-- ── 8단계: 기타 유저 데이터 ──
DELETE FROM user_badges;
DELETE FROM user_subscriptions;
DELETE FROM payments;
DELETE FROM marketplace_wishlists;
DELETE FROM marketplace_phone_requests;
DELETE FROM marketplace_items;
DELETE FROM memory_cards;
DELETE FROM suggestions;
DELETE FROM followers;
DELETE FROM game_applications;
DELETE FROM game_templates;
DELETE FROM games;

-- ── 9단계: 조직/파트너 ──
DELETE FROM partner_members;
DELETE FROM partners;
DELETE FROM organization_members;
DELETE FROM organizations;

-- ── 10단계: 유저 (보존 4명 제외) ──
DELETE FROM users
WHERE email NOT IN (
  'admin@bdr.com',
  'bdr.wonyoung@gmail.com',
  'record01@mybdr.kr',
  'record02@mybdr.kr'
);

-- ── 11단계: 시퀀스 리셋 (선택) ──
-- ALTER SEQUENCE users_id_seq RESTART WITH 10;
-- ALTER SEQUENCE teams_id_seq RESTART WITH 1;
-- ALTER SEQUENCE tournaments_id_seq RESTART WITH 1;

COMMIT;

-- 결과 확인
SELECT 'users' as tbl, count(*) FROM users
UNION ALL SELECT 'teams', count(*) FROM teams
UNION ALL SELECT 'tournaments', count(*) FROM tournaments
UNION ALL SELECT 'tournament_matches', count(*) FROM tournament_matches;
