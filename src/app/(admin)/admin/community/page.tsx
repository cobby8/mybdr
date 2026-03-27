import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { hidePostAction, unhidePostAction, deletePostAction } from "@/app/actions/admin-community";

export const dynamic = "force-dynamic";

// 카테고리 한글 매핑 (community-content.tsx와 동일)
const CATEGORY_LABEL: Record<string, string> = {
  general: "자유게시판",
  recruit: "팀원모집",
  review: "대회후기",
  info: "정보공유",
  qna: "질문답변",
  notice: "공지사항",
  marketplace: "농구장터",
};

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  // 검색 조건: 제목 또는 작성자 닉네임
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { users: { nickname: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  // 게시글 목록 + 총 개수를 병렬 조회
  const [posts, totalCount] = await Promise.all([
    prisma.community_posts.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true,
        public_id: true,
        title: true,
        category: true,
        view_count: true,
        comments_count: true,
        likes_count: true,
        status: true,
        created_at: true,
        // 작성자 정보
        users: { select: { nickname: true, email: true } },
      },
    }),
    prisma.community_posts.count({ where }),
  ]);

  return (
    <div>
      {/* 공통 헤더 */}
      <AdminPageHeader
        title="커뮤니티 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="제목, 작성자 검색"
        searchDefaultValue={q ?? ""}
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">제목</th>
                <th className="px-5 py-4 font-medium w-[90px]">카테고리</th>
                <th className="px-5 py-4 font-medium w-[100px]">작성자</th>
                <th className="px-5 py-4 font-medium w-[60px] text-center">조회</th>
                <th className="px-5 py-4 font-medium w-[60px] text-center">댓글</th>
                <th className="px-5 py-4 font-medium w-[60px] text-center">좋아요</th>
                <th className="px-5 py-4 font-medium w-[90px]">작성일</th>
                <th className="px-5 py-4 font-medium w-[160px]">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => {
                const isHidden = p.status === "hidden";

                return (
                  <tr
                    key={String(p.id)}
                    className={`border-b border-[var(--color-border-subtle)] transition-colors ${
                      isHidden
                        ? "bg-[var(--color-error)]/[0.03] opacity-60"
                        : "hover:bg-[var(--color-elevated)]"
                    }`}
                  >
                    {/* 제목 + 상태 */}
                    <td className="px-5 py-3">
                      <p className="truncate font-medium text-[var(--color-text-primary)]">
                        {isHidden && (
                          <span className="mr-1.5 text-[var(--color-error)] text-xs">[숨김]</span>
                        )}
                        {p.title}
                      </p>
                    </td>

                    {/* 카테고리 */}
                    <td className="px-5 py-3">
                      <Badge variant="default">
                        {CATEGORY_LABEL[p.category ?? ""] ?? p.category ?? "기타"}
                      </Badge>
                    </td>

                    {/* 작성자 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)] truncate">
                      {p.users?.nickname ?? p.users?.email ?? "-"}
                    </td>

                    {/* 조회수 */}
                    <td className="px-5 py-3 text-center text-[var(--color-text-muted)]">
                      {p.view_count ?? 0}
                    </td>

                    {/* 댓글수 */}
                    <td className="px-5 py-3 text-center text-[var(--color-text-muted)]">
                      {p.comments_count}
                    </td>

                    {/* 좋아요수 */}
                    <td className="px-5 py-3 text-center text-[var(--color-text-muted)]">
                      {p.likes_count}
                    </td>

                    {/* 작성일 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {p.created_at.toLocaleDateString("ko-KR")}
                    </td>

                    {/* 관리 버튼: 숨김/복원 + 삭제 */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* 숨김/복원 토글 */}
                        <form action={isHidden ? unhidePostAction : hidePostAction}>
                          <input type="hidden" name="post_id" value={String(p.id)} />
                          <button
                            type="submit"
                            className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-xs font-medium transition-colors ${
                              isHidden
                                ? "bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20"
                                : "bg-[var(--color-warning)]/10 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20"
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isHidden ? "visibility" : "visibility_off"}
                            </span>
                            {isHidden ? "복원" : "숨김"}
                          </button>
                        </form>

                        {/* 삭제 (onclick 확인은 클라이언트에서 처리 필요 — 서버 컴포넌트라 form submit으로 처리) */}
                        <form
                          action={deletePostAction}
                          onSubmit={undefined}
                        >
                          <input type="hidden" name="post_id" value={String(p.id)} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-[8px] bg-[var(--color-error)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            삭제
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {posts.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">게시글이 없습니다.</div>
        )}
      </Card>
    </div>
  );
}
