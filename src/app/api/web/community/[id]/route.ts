import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/community/[id]
 *
 * 개별 게시글 조회 API (public_id 기반)
 * 글 수정 페이지에서 기존 데이터를 불러오는 데 사용.
 * 인증 불필요 (공개 데이터).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const post = await prisma.community_posts.findUnique({
      where: { public_id: id },
      select: {
        id: true,
        public_id: true,
        title: true,
        content: true,
        category: true,
        user_id: true, // 수정 페이지에서 작성자 본인 확인용 — 공개 정보이므로 보안 이슈 없음
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!post || post.status === "deleted") {
      return apiError("게시글을 찾을 수 없습니다.", 404);
    }

    return apiSuccess({
      id: post.id.toString(),
      public_id: post.public_id,
      title: post.title,
      content: post.content,
      category: post.category,
      user_id: post.user_id.toString(),
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    });
  } catch {
    return apiError("게시글을 불러올 수 없습니다.", 500);
  }
}
