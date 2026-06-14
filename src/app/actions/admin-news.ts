"use server";

// 2026-05-03: Phase 2 — 알기자 (BDR NEWS) 운영자 검수 액션
// /admin/news 페이지에서 호출.
//
// 액션 4종:
//   - publishNewsAction(id)    : draft → published
//   - rejectNewsAction(id)     : draft → rejected
//   - regenerateNewsAction(id) : 삭제 + 캐시 invalidate + triggerMatchBriefPublish 재호출
//   - editNewsTitleAction(id, title): 운영자가 제목/본문 직접 수정 (발행 전)
//
// 권한: getWebSession + isAdmin 검증

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { invalidateBriefCache } from "@/lib/news/match-brief-generator";
import {
  triggerMatchBriefPublish,
  publishPhase1Summary,
} from "@/lib/news/auto-publish-match-brief";

async function requireAdmin(): Promise<bigint> {
  const session = await getWebSession();
  if (!session?.sub) throw new Error("UNAUTHORIZED");
  const userId = BigInt(session.sub);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) throw new Error("FORBIDDEN");
  return userId;
}

export async function publishNewsAction(id: bigint): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const post = await prisma.community_posts.findUnique({
      where: { id },
      select: { id: true, status: true, category: true },
    });
    if (!post || post.category !== "news") return { ok: false, error: "NOT_NEWS" };
    if (post.status === "published") return { ok: true }; // 멱등
    await prisma.community_posts.update({
      where: { id },
      data: { status: "published", updated_at: new Date() },
    });
    revalidatePath("/admin/news");
    revalidatePath("/news");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
}

export async function rejectNewsAction(id: bigint): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const post = await prisma.community_posts.findUnique({
      where: { id },
      select: { id: true, status: true, category: true },
    });
    if (!post || post.category !== "news") return { ok: false, error: "NOT_NEWS" };
    await prisma.community_posts.update({
      where: { id },
      data: { status: "rejected", updated_at: new Date() },
    });
    revalidatePath("/admin/news");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
}

export async function regenerateNewsAction(id: bigint): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const post = await prisma.community_posts.findUnique({
      where: { id },
      select: { id: true, category: true, tournament_match_id: true },
    });
    if (!post || post.category !== "news") return { ok: false, error: "NOT_NEWS" };
    if (!post.tournament_match_id) return { ok: false, error: "NO_MATCH_ID" };

    // 1. 기존 게시물 삭제
    await prisma.community_posts.delete({ where: { id } });

    // 2. LLM 캐시 무효화 (mode 분리 캐시 모두)
    invalidateBriefCache(Number(post.tournament_match_id));

    // 3. 재생성 (fire-and-forget X — await 으로 결과 보장)
    await triggerMatchBriefPublish(post.tournament_match_id);

    revalidatePath("/admin/news");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
}

/**
 * 2026-05-04: Phase 1 (라이브 페이지 [Lead] 요약) 재생성 액션.
 * tournament_matches.summary_brief = null 초기화 + 캐시 무효화 + publishPhase1Summary 재호출.
 * Phase 2 (community_post) 와 독립 — 본기사는 그대로 유지.
 */
export async function regenerateSummaryBriefAction(
  matchId: bigint,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, status: true },
    });
    if (!match) return { ok: false, error: "MATCH_NOT_FOUND" };
    if (match.status !== "completed") {
      return { ok: false, error: `NOT_COMPLETED (status=${match.status})` };
    }

    // 1. 기존 summary_brief null 로 초기화 (publishPhase1Summary 의 멱등성 우회)
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { summary_brief: Prisma.JsonNull },
    });

    // 2. LLM 캐시 무효화 (Phase 1 캐시도 같이 정리 — 메모리 instance 별)
    invalidateBriefCache(Number(matchId));

    // 3. 재생성 (await — 결과 보장)
    await publishPhase1Summary(matchId);

    revalidatePath("/admin/news");
    revalidatePath(`/live/${matchId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
}

/**
 * 2026-06-14: Phase 10 박제 #5 IA1 (AdminNews A안) — 운영자 신규 기사 작성/발행 액션.
 *
 * 이유 (왜):
 *   - 기존 /admin/news 는 "알기자 AI 초안 검수"(publish/reject/regenerate/edit)만 담당.
 *     IA1 시안은 운영자가 매거진·매치 단신·공지·이벤트 기사를 직접 "작성"하는 hub.
 *     기존 5개 검수 액션은 그대로 보존하고, 작성 전용 액션 1개를 신규 추가.
 *
 * 어떻게:
 *   - requireAdmin() 으로 super-admin 검증 (기존 액션과 동일 가드 재사용).
 *   - community_posts INSERT — category="news" 통일 (검수 페이지가 category="news" 만 조회).
 *     · 시안 카테고리 4종(magazine/match/notice/event)은 향후 분류용 메타이나,
 *       현재 검수/노출 파이프라인이 category="news" 단일 식별이므로 그 규약을 따른다.
 *       매치 단신일 때만 cross-domain 메타(tournament_id/tournament_match_id/period_type)를 세팅.
 *   - status: 발행방식 "publish"→published / 그 외("draft"/"schedule")→draft 로 저장
 *     (예약 발행 스케줄러는 미구현 — draft 로 보관).
 *   - ★ createNotification 호출 안 함 (후속 연동 예정 — 대량 알림 위험).
 *     발행 모달의 "사용자 알림 보내기" 체크박스는 UI 만 존재, 실제 발송 미연동.
 *   - 신규 테이블/컬럼 0 — 기존 community_posts 스키마만 사용.
 */
export async function createNewsPostAction(data: {
  title: string;
  content?: string;
  category?: string; // magazine | match | notice | event (메타 — 저장 category 는 "news" 고정)
  publishMode?: string; // publish | draft | schedule
  tournamentId?: string | null; // category=match 일 때만
  tournamentMatchId?: string | null; // category=match 일 때만 (bigint 문자열)
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const userId = await requireAdmin();

    const title = data.title?.trim();
    if (!title) return { ok: false, error: "TITLE_REQUIRED" };

    // 발행방식 → status. publish 만 즉시 발행, 나머지는 draft 보관.
    const status = data.publishMode === "publish" ? "published" : "draft";

    // 매치 단신(category=match) 일 때만 cross-domain 메타 세팅.
    const isMatch = data.category === "match";
    const matchId =
      isMatch && data.tournamentMatchId ? BigInt(data.tournamentMatchId) : null;
    const tournamentId = isMatch && data.tournamentId ? data.tournamentId : null;

    const now = new Date();
    const created = await prisma.community_posts.create({
      data: {
        user_id: userId, // 작성 운영자 (NOT NULL)
        title,
        content: data.content ?? "",
        category: "news", // 검수/노출 파이프라인 단일 식별 규약
        status,
        created_at: now,
        updated_at: now,
        // 매치 단신만 cross-domain 메타 (그 외 게시물은 모두 null 유지)
        ...(isMatch && {
          tournament_id: tournamentId,
          tournament_match_id: matchId,
          period_type: "match",
        }),
      },
      select: { id: true },
    });

    // ★ createNotification 미연동 (대량 알림 위험 — 후속 연동 예정)

    revalidatePath("/admin/news");
    if (status === "published") revalidatePath("/news");
    return { ok: true, id: created.id.toString() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
}

/**
 * 2026-06-14: IA1 매치 단신 cross-domain — 대회 선택 시 해당 대회의 경기 옵션 조회.
 *   시안의 "경기 선택…" select 를 대회 의존으로 채우기 위한 경량 조회 액션 (SELECT only).
 */
export async function listMatchOptionsAction(
  tournamentId: string,
): Promise<{ ok: boolean; matches?: Array<{ id: string; name: string }>; error?: string }> {
  try {
    await requireAdmin();
    if (!tournamentId) return { ok: true, matches: [] };
    const matches = await prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: [{ round_number: "asc" }, { match_number: "asc" }],
      take: 100,
      select: { id: true, roundName: true, match_number: true },
    });
    return {
      ok: true,
      matches: matches.map((m) => ({
        id: m.id.toString(),
        // 라운드명 + 경기번호 조합으로 식별 라벨 구성 (없으면 #id fallback)
        name:
          [m.roundName, m.match_number ? `${m.match_number}경기` : null]
            .filter(Boolean)
            .join(" ") || `경기 #${m.id.toString()}`,
      })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
}

export async function editNewsAction(
  id: bigint,
  data: { title?: string; content?: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const post = await prisma.community_posts.findUnique({
      where: { id },
      select: { id: true, category: true },
    });
    if (!post || post.category !== "news") return { ok: false, error: "NOT_NEWS" };
    await prisma.community_posts.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        updated_at: new Date(),
      },
    });
    revalidatePath("/admin/news");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
}
