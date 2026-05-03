// 2026-05-03: Phase 2 — 매치 종료 시 자동 단신 기사 생성 + community_posts 저장
// 호출: src/lib/services/match.ts 의 updateMatch / updateMatchStatus 에서
//       status="completed" 변경 시 fire-and-forget (응답 시간 영향 0).
//
// 흐름:
//   1. 멱등성 검사 — 이미 community_posts 있으면 skip
//   2. 매치 + 알기자 User 검증
//   3. /api/live/[id]/brief?mode=phase2-match GET (LLM 호출)
//   4. community_posts INSERT (status="draft", category="news", period_type="match")
//
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
 * 매치 종료 시 알기자 단신 기사 자동 생성 + community_posts INSERT (draft).
 * fire-and-forget 패턴 — throw 하지 않음, 호출자는 await 안 해도 됨.
 *
 * @param matchId TournamentMatch.id
 */
export async function triggerMatchBriefPublish(matchId: bigint): Promise<void> {
  try {
    // 1. 멱등성 — 이미 같은 매치 community_post 있으면 skip
    const existing = await prisma.community_posts.findFirst({
      where: { tournament_match_id: matchId, category: "news" },
      select: { id: true },
    });
    if (existing) {
      console.log(
        `[auto-publish] match=${matchId} 이미 community_post 존재 (id=${existing.id}) — skip`,
      );
      return;
    }

    // 2. 매치 검증 — completed 상태인지 + tournament_id 추출
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { tournamentId: true, status: true },
    });
    if (!match) {
      console.warn(`[auto-publish] match=${matchId} 없음`);
      return;
    }
    if (match.status !== "completed") {
      console.log(
        `[auto-publish] match=${matchId} status=${match.status} (not completed) — skip`,
      );
      return;
    }

    // 3. 알기자 User 조회
    const alkija = await prisma.user.findUnique({
      where: { email: ALKIJA_EMAIL },
      select: { id: true },
    });
    if (!alkija) {
      console.error(`[auto-publish] 알기자 User 없음 (email=${ALKIJA_EMAIL})`);
      return;
    }

    // 4. brief route 호출 — Phase 2 mode (독립 기사, 400~700자, 제목+본문)
    const baseUrl = getBaseUrl();
    const briefUrl = `${baseUrl}/api/live/${matchId}/brief?mode=phase2-match`;
    const res = await fetch(briefUrl, { cache: "no-store" });
    if (!res.ok) {
      console.error(
        `[auto-publish] match=${matchId} brief HTTP ${res.status} — skip`,
      );
      return;
    }
    const body = (await res.json()) as BriefRouteResponse;
    // apiSuccess 미들웨어 통과 → snake_case 변환됨. 응답이 data wrapper 일 수도, 직접 일 수도.
    const data = body.data ?? body;
    const brief = data.brief;
    const title = data.title;
    const reason = data.reason;
    if (!brief) {
      console.error(
        `[auto-publish] match=${matchId} brief 생성 실패: ${reason ?? "no brief"}`,
      );
      console.error(`[auto-publish] match=${matchId} 응답 raw:`, JSON.stringify(body).slice(0, 500));
      return;
    }

    // 5. community_posts INSERT (draft)
    const created = await prisma.community_posts.create({
      data: {
        user_id: alkija.id,
        title: title || `BDR NEWS ${matchId}`,
        content: brief,
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
      `[auto-publish] match=${matchId} community_post draft 생성 ✅ (post_id=${created.id}, title="${title}", brief=${brief.length}자)`,
    );
  } catch (e) {
    // fire-and-forget — 실패해도 호출자(매치 PATCH)에 영향 X
    console.error(
      `[auto-publish] match=${matchId} 예외:`,
      e instanceof Error ? e.message : e,
    );
  }
}

/**
 * 비동기 fire-and-forget — Promise 반환 X.
 * 매치 PATCH route 응답 시간에 영향 없음.
 */
export function triggerMatchBriefPublishAsync(matchId: bigint): void {
  // void 캐스팅 — Promise 무시 (eslint no-floating-promises 회피)
  void triggerMatchBriefPublish(matchId);
}
