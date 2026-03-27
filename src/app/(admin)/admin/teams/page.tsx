import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateTeamStatusAction } from "@/app/actions/admin-teams";

export const dynamic = "force-dynamic";

// 팀 상태 라벨 매핑
const STATUS_LABEL: Record<string, string> = {
  active: "활동중",
  inactive: "비활성",
};

// 팀 상태 뱃지 색상 매핑
const STATUS_BADGE: Record<string, "success" | "error"> = {
  active: "success",
  inactive: "error",
};

// 관리자 팀 관리 페이지
export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  // 검색: 팀명 또는 도시로 필터링
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { city: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  // 팀 목록 + 전체 개수 병렬 조회
  const [teams, totalCount] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        city: true,
        members_count: true,
        wins: true,
        losses: true,
        draws: true,
        status: true,
        createdAt: true,
        // 팀장 정보 (닉네임/이메일)
        users_teams_captain_idTousers: {
          select: { nickname: true, email: true },
        },
      },
    }),
    prisma.team.count({ where }),
  ]);

  return (
    <div>
      {/* 공통 헤더: 제목 + 부제 + 검색 */}
      <AdminPageHeader
        title="팀 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="팀명, 도시 검색"
        searchDefaultValue={q ?? ""}
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col className="w-[80px]" />
              <col className="w-[120px]" />
              <col className="w-[200px]" />
              <col className="w-[100px]" />
            </colgroup>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">팀명</th>
                <th className="px-5 py-4 font-medium">도시</th>
                <th className="px-5 py-4 font-medium">팀장</th>
                <th className="px-5 py-4 font-medium">멤버</th>
                <th className="px-5 py-4 font-medium">전적</th>
                <th className="px-5 py-4 font-medium">상태 변경</th>
                <th className="px-5 py-4 font-medium">생성일</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => {
                const status = t.status ?? "active";
                const captain = t.users_teams_captain_idTousers;
                // 현재 상태의 반대 상태 (토글용)
                const toggleTo = status === "active" ? "inactive" : "active";

                return (
                  <tr
                    key={t.id.toString()}
                    className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-elevated)] transition-colors"
                  >
                    {/* 팀명 */}
                    <td className="px-5 py-3">
                      <span className="block truncate font-medium text-[var(--color-text-primary)]">
                        {t.name}
                      </span>
                    </td>
                    {/* 도시 */}
                    <td className="px-5 py-3 truncate text-[var(--color-text-muted)]">
                      {t.city ?? "-"}
                    </td>
                    {/* 팀장 */}
                    <td className="px-5 py-3 truncate text-[var(--color-text-muted)]">
                      {captain?.nickname ?? captain?.email ?? "-"}
                    </td>
                    {/* 멤버수 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {t.members_count ?? 0}명
                    </td>
                    {/* 전적 (승/패/무) */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {t.wins ?? 0}W / {t.losses ?? 0}L / {t.draws ?? 0}D
                    </td>
                    {/* 상태 토글 */}
                    <td className="px-5 py-3">
                      <form action={updateTeamStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="team_id" value={t.id.toString()} />
                        <input type="hidden" name="status" value={toggleTo} />
                        <Badge variant={STATUS_BADGE[status] ?? "default"}>
                          {STATUS_LABEL[status] ?? status}
                        </Badge>
                        <button
                          type="submit"
                          className="rounded-[10px] bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)]"
                        >
                          {toggleTo === "inactive" ? "비활성화" : "활성화"}
                        </button>
                      </form>
                    </td>
                    {/* 생성일 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {t.createdAt.toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {teams.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            등록된 팀이 없습니다.
          </div>
        )}
      </Card>
    </div>
  );
}
