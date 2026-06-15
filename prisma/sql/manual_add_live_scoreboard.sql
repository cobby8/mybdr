-- ============================================================================
-- OBS 라이브 스코어보드 — live_scoreboards 테이블 생성
-- ============================================================================
-- ★적용 보류(검증 단계): 이 프로젝트는 Rails 마이그레이션 + Prisma introspect(db pull)
--   방식이라 prisma/migrations 히스토리가 없다. `prisma migrate dev`를 돌리면 기존 DB
--   전체를 새 baseline으로 만들려다 사고가 나므로, 개발 DB에 아래 SQL을 수동 실행한 뒤
--   `npm run db:pull` + `npm run db:generate`로 Prisma 클라이언트를 맞추는 절차를 따른다.
--   (운영 DB 절대 금지 — 개발 Supabase에만 적용)
--
-- 적용 방법(개발 DB):
--   psql "$DIRECT_URL" -f prisma/sql/manual_add_live_scoreboard.sql
--   이후: npm run db:pull && npm run db:generate (Prisma 클라이언트 동기화)
-- ※ prisma/migrations/ 는 .gitignore 대상(이 프로젝트는 migrate 미사용)이라 prisma/sql/ 에 둠.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "live_scoreboards" (
  "match_id"   BIGINT       NOT NULL,
  "payload"    JSONB        NOT NULL,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "live_scoreboards_pkey" PRIMARY KEY ("match_id")
);

-- 매치 삭제 시 스코어보드 행도 함께 정리되도록 FK(ON DELETE CASCADE) 부여.
-- (schema.prisma 에는 관계를 명시하지 않으므로 여기서만 건다 — 거대 TournamentMatch 모델 무수정 유지)
ALTER TABLE "live_scoreboards"
  ADD CONSTRAINT "fk_live_scoreboards_match"
  FOREIGN KEY ("match_id") REFERENCES "tournament_matches"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
