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
