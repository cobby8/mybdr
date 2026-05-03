// 2026-05-03: Phase 2 — 매치 종료 시 자동 단신 기사 생성 + community_posts 저장
// 2026-05-04: Phase 1 통합 — 매치 종료 시 라이브 페이지 [Lead] 요약도 동시 생성 + tournament_matches.summary_brief UPDATE
// 호출: src/lib/services/match.ts 의 updateMatch / updateMatchStatus 에서
//       status="completed" 변경 시 fire-and-forget (응답 시간 영향 0).
//
// 흐름 (1회 트리거 → 2개 결과 동시 생성):
//   ┌─ Phase 1 (요약, 라이브 페이지) — publishPhase1Summary
//   │   1. 멱등성 — 이미 summary_brief 있으면 skip
//   │   2. brief?mode=phase1-section GET (LLM)
//   │   3. tournament_matches.summary_brief UPDATE (즉시 노출, 검수 X)
//   │
//   └─ Phase 2 (본기사, 게시판 news) — publishPhase2MatchBrief
//       1. 멱등성 — 이미 community_post(news) 있으면 skip
//       2. brief?mode=phase2-match GET (LLM)
//       3. community_posts INSERT (status=draft, admin 검수 후 publish)
//
// 두 작업은 Promise.allSettled 로 독립 실행 — 한쪽 실패가 다른쪽에 영향 X.
// 에러 catch — throw 하지 않음. console.error 로 관측만.

import { prisma } from "@/lib/db/prisma";

// 알기자 User email — Phase A 에서 INSERT 한 system 계정
const ALKIJA_EMAIL = "alkija@bdr.system";

// internal fetch base URL — server-side internal call 용
// 주의: NEXT_PUBLIC_APP_URL 사용 X (운영 URL 가리키므로 dev 에서 운영 서버로 가는 사고 발생).
// - Vercel: VERCEL_URL 자동 설정 (deployment 자기 자신 host)
// - dev/local: localhost:3001 강제
function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // ⚠️ NEXT_PUBLIC_APP_URL 은 client-side 용 — server internal fetch 에 사용 금지
  return "http://localhost:3001";
}

// brief route 응답 타입 (apiSuccess 미들웨어 snake_case 변환 후)
type BriefRouteResponse = {
  ok: boolean;
  data?: {
    ok?: boolean;
    brief?: string;
    title?: string;
    reason?: string;
  };
  brief?: string;
  title?: string;
  reason?: string;
};

/**
 * 2026-05-04: silent fail 모니터링 — news_publish_attempts 테이블에 결과 기록.
 * 본 흐름 영향 0 (기록 실패도 catch + console.warn).
 */
async function recordAttempt(
  matchId: bigint,
  phase: "phase1-section" | "phase2-match",
  status: "success" | "skipped" | "failed",
  reason: string | null = null,
): Promise<void> {
  try {
    await prisma.news_publish_attempt.create({
      data: { match_id: matchId, phase, status, reason },
    });
  } catch (e) {
    console.warn(
      `[news_publish_attempt] record fail (match=${matchId} phase=${phase}):`,
      e instanceof Error ? e.message : e,
    );
  }
}

// brief route 호출 헬퍼 — mode 별 응답 파싱
async function fetchBrief(
  matchId: bigint,
  mode: "phase1-section" | "phase2-match",
): Promise<{ brief: string; title?: string } | null> {
  const baseUrl = getBaseUrl();
  const briefUrl = `${baseUrl}/api/live/${matchId}/brief?mode=${mode}`;
  const res = await fetch(briefUrl, { cache: "no-store" });
  if (!res.ok) {
    console.error(`[auto-publish] match=${matchId} mode=${mode} brief HTTP ${res.status}`);
    return null;
  }
  const body = (await res.json()) as BriefRouteResponse;
  // apiSuccess 미들웨어 통과 → snake_case 변환됨. 응답이 data wrapper 일 수도, 직접 일 수도.
  const data = body.data ?? body;
  const brief = data.brief;
  const title = data.title;
  const reason = data.reason;
  if (!brief) {
    console.error(
      `[auto-publish] match=${matchId} mode=${mode} brief 생성 실패: ${reason ?? "no brief"}`,
    );
    return null;
  }
  return { brief, title };
}

/**
 * Phase 1 — 라이브 페이지 [Lead] 요약 생성 + tournament_matches.summary_brief UPDATE
 * 즉시 노출 (검수 X). 매치당 1회.
 *
 * export 사유: admin/news 의 "요약 재생성" 액션 (regenerateSummaryBriefAction) 에서 호출.
 * 자동 트리거 흐름은 triggerMatchBriefPublish() 사용.
 */
export async function publishPhase1Summary(matchId: bigint): Promise<void> {
  try {
    // 1. 멱등성 — 이미 summary_brief 있으면 skip
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { status: true, summary_brief: true },
    });
    if (!match) {
      console.warn(`[auto-publish:phase1] match=${matchId} 없음`);
      await recordAttempt(matchId, "phase1-section", "failed", "match_not_found");
      return;
    }
    if (match.status !== "completed") {
      console.log(
        `[auto-publish:phase1] match=${matchId} status=${match.status} (not completed) — skip`,
      );
      await recordAttempt(matchId, "phase1-section", "skipped", `not_completed: ${match.status}`);
      return;
    }
    if (match.summary_brief) {
      console.log(`[auto-publish:phase1] match=${matchId} summary_brief 이미 존재 — skip`);
      await recordAttempt(matchId, "phase1-section", "skipped", "already_exists");
      return;
    }

    // 2. brief route 호출 — Phase 1 mode (라이브 페이지 1 섹션, 150~250자)
    const result = await fetchBrief(matchId, "phase1-section");
    if (!result) {
      await recordAttempt(matchId, "phase1-section", "failed", "brief_route_failed");
      return;
    }

    // 3. tournament_matches.summary_brief UPDATE
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        summary_brief: {
          brief: result.brief,
          generated_at: new Date().toISOString(),
          mode: "phase1-section",
        },
      },
    });

    console.log(
      `[auto-publish:phase1] match=${matchId} summary_brief UPDATE ✅ (${result.brief.length}자)`,
    );
    await recordAttempt(matchId, "phase1-section", "success", `${result.brief.length}자`);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error(`[auto-publish:phase1] match=${matchId} 예외:`, reason);
    await recordAttempt(matchId, "phase1-section", "failed", `exception: ${reason}`);
  }
}

/**
 * Phase 2 — 게시판 'news' 카테고리 본기사 생성 + community_posts INSERT (draft).
 * 운영자 검수 후 publish. 매치당 1회.
 */
async function publishPhase2MatchBrief(matchId: bigint): Promise<void> {
  try {
    // 1. 멱등성 — 이미 같은 매치 community_post 있으면 skip
    const existing = await prisma.community_posts.findFirst({
      where: { tournament_match_id: matchId, category: "news" },
      select: { id: true },
    });
    if (existing) {
      console.log(
        `[auto-publish:phase2] match=${matchId} 이미 community_post 존재 (id=${existing.id}) — skip`,
      );
      await recordAttempt(matchId, "phase2-match", "skipped", `already_exists: post=${existing.id}`);
      return;
    }

    // 2. 매치 검증 — completed 상태인지 + tournament_id 추출
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { tournamentId: true, status: true },
    });
    if (!match) {
      console.warn(`[auto-publish:phase2] match=${matchId} 없음`);
      await recordAttempt(matchId, "phase2-match", "failed", "match_not_found");
      return;
    }
    if (match.status !== "completed") {
      console.log(
        `[auto-publish:phase2] match=${matchId} status=${match.status} (not completed) — skip`,
      );
      await recordAttempt(matchId, "phase2-match", "skipped", `not_completed: ${match.status}`);
      return;
    }

    // 3. 알기자 User 조회
    const alkija = await prisma.user.findUnique({
      where: { email: ALKIJA_EMAIL },
      select: { id: true },
    });
    if (!alkija) {
      console.error(`[auto-publish:phase2] 알기자 User 없음 (email=${ALKIJA_EMAIL})`);
      await recordAttempt(matchId, "phase2-match", "failed", "alkija_user_not_found");
      return;
    }

    // 4. brief route 호출 — Phase 2 mode (독립 기사, 400~700자, 제목+본문)
    const result = await fetchBrief(matchId, "phase2-match");
    if (!result) {
      await recordAttempt(matchId, "phase2-match", "failed", "brief_route_failed");
      return;
    }

    // 5. community_posts INSERT (draft)
    const created = await prisma.community_posts.create({
      data: {
        user_id: alkija.id,
        title: result.title || `BDR NEWS ${matchId}`,
        content: result.brief,
        category: "news",
        status: "draft",
        tournament_match_id: matchId,
        tournament_id: match.tournamentId,
        period_type: "match",
        period_key: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: { id: true },
    });

    console.log(
      `[auto-publish:phase2] match=${matchId} community_post draft 생성 ✅ (post_id=${created.id}, title="${result.title}", brief=${result.brief.length}자)`,
    );
    await recordAttempt(
      matchId,
      "phase2-match",
      "success",
      `post=${created.id} title_len=${(result.title ?? "").length} brief_len=${result.brief.length}`,
    );
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error(`[auto-publish:phase2] match=${matchId} 예외:`, reason);
    await recordAttempt(matchId, "phase2-match", "failed", `exception: ${reason}`);
  }
}

/**
 * 매치 종료 시 알기자 단신 자동 생성 — Phase 1 (요약) + Phase 2 (본기사) 동시 처리.
 * Promise.allSettled — 한쪽 실패해도 다른쪽 진행. fire-and-forget 패턴 유지 (throw X).
 *
 * @param matchId TournamentMatch.id
 */
export async function triggerMatchBriefPublish(matchId: bigint): Promise<void> {
  // 두 작업 독립 실행 — 한쪽 실패가 다른쪽에 영향 X
  await Promise.allSettled([
    publishPhase1Summary(matchId),
    publishPhase2MatchBrief(matchId),
  ]);
}

/**
 * 비동기 fire-and-forget — Promise 반환 X.
 * 매치 PATCH route 응답 시간에 영향 없음.
 */
export function triggerMatchBriefPublishAsync(matchId: bigint): void {
  // void 캐스팅 — Promise 무시 (eslint no-floating-promises 회피)
  void triggerMatchBriefPublish(matchId);
}
