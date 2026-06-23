import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
// v2.40 A3-2b — 통합 콘솔 키트 통계띠(StatRow)
import { StatRow } from "@/components/admin/console-kit";
import { updateSuggestionStatusAction } from "@/app/actions/admin-suggestions";
import { AdminSuggestionsContent } from "./admin-suggestions-content";

export const dynamic = "force-dynamic";

// 건의사항 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { content: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [suggestions, totalCount] = await Promise.all([
    prisma.suggestions
      .findMany({
        where,
        orderBy: { created_at: "desc" },
        take: 50,
        include: {
          users_suggestions_user_idTousers: {
            select: { nickname: true, email: true },
          },
        },
      })
      .catch(() => []),
    prisma.suggestions.count({ where }).catch(() => 0),
  ]);

  // 직렬화
  const serialized = suggestions.map((s) => ({
    id: s.id.toString(),
    title: s.title,
    content: s.content,
    status: s.status ?? "pending",
    createdAt: s.created_at.toISOString(),
    authorName: s.users_suggestions_user_idTousers?.nickname ?? null,
    authorEmail: s.users_suggestions_user_idTousers?.email ?? null,
  }));

  // v2.40 A3-2b — 통계띠 카운트. 현재 페이지(take:50) serialized 기준 클라 파생(SELECT 추가 0).
  const countBy = (st: string) => serialized.filter((s) => s.status === st).length;
  const statItems = [
    { icon: "inbox", label: "전체", value: totalCount.toLocaleString() },
    { icon: "circle-dashed", label: "대기", value: countBy("pending") },
    { icon: "clock", label: "처리중", value: countBy("open") + countBy("in_progress") },
    { icon: "check-circle-2", label: "완료", value: countBy("resolved") },
  ];

  return (
    // Phase 2A (Toss 전환) — 페이지 루트에 data-skin="toss" opt-in (content 는 DOM 상속)
    <div data-skin="toss">
      {/* 2026-05-15 Admin-5-A 박제 — eyebrow + breadcrumbs 추가
          시안 source: Dev/design/BDR-current/screens/AdminSuggestions.jsx (line 272~293) */}
      <AdminPageHeader
        eyebrow="ADMIN · 사용자"
        title="건의사항"
        subtitle={`전체 ${totalCount}건`}
        searchPlaceholder="제목/내용 검색"
        searchDefaultValue={q ?? ""}
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "사용자" },
          { label: "건의사항" },
        ]}
      />
      {/* v2.40 A3-2b — 통계띠(status별 count·클라 파생) */}
      <StatRow items={statItems} />
      <AdminSuggestionsContent
        suggestions={serialized}
        updateStatusAction={updateSuggestionStatusAction}
      />
    </div>
  );
}
