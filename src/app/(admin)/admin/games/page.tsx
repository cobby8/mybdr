import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateGameStatusAction } from "@/app/actions/admin-games";
// 경기 상태/유형 공통 상수 (프론트와 동일한 라벨 사용)
import { STATUS_LABEL, TYPE_BADGE } from "@/lib/constants/game-status";

export const dynamic = "force-dynamic";

// 상태별 뱃지 variant 매핑
const STATUS_VARIANT: Record<number, "success" | "info" | "default" | "error"> = {
  1: "success",  // 모집중
  2: "info",     // 확정
  3: "default",  // 완료
  4: "error",    // 취소
};

// 상태 전환 규칙: 현재 상태 → 전환 가능한 상태 목록
const STATUS_TRANSITIONS: Record<number, number[]> = {
  1: [2, 4],    // 모집중 → 확정, 취소
  2: [3, 4],    // 확정 → 완료, 취소
  3: [],        // 완료 → 변경 불가
  4: [],        // 취소 → 변경 불가
};

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  // 검색 조건: 제목 또는 장소명에서 검색
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { venue_name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  // 경기 목록 + 총 개수를 병렬 조회
  const [games, totalCount] = await Promise.all([
    prisma.games.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100, // 클라이언트 페이지네이션용 충분한 양
      select: {
        id: true,
        title: true,
        game_type: true,
        venue_name: true,
        city: true,
        scheduled_at: true,
        current_participants: true,
        max_participants: true,
        status: true,
        created_at: true,
        // 주최자 정보 (users 릴레이션)
        users: { select: { nickname: true, email: true } },
      },
    }),
    prisma.games.count({ where }),
  ]);

  return (
    <div>
      {/* 공통 헤더: 제목 + 부제 + 검색 */}
      <AdminPageHeader
        title="경기 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="제목, 장소 검색"
        searchDefaultValue={q ?? ""}
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">제목</th>
                <th className="px-5 py-4 font-medium w-[90px]">유형</th>
                <th className="px-5 py-4 font-medium w-[120px]">장소</th>
                <th className="px-5 py-4 font-medium w-[100px]">일시</th>
                <th className="px-5 py-4 font-medium w-[80px]">참가자</th>
                <th className="px-5 py-4 font-medium w-[240px]">상태 변경</th>
                <th className="px-5 py-4 font-medium w-[90px]">생성일</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => {
                const status = g.status ?? 1;
                const transitions = STATUS_TRANSITIONS[status] ?? [];
                const typeBadge = TYPE_BADGE[g.game_type];
                const statusInfo = STATUS_LABEL[status];

                return (
                  <tr
                    key={String(g.id)}
                    className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-elevated)] transition-colors"
                  >
                    {/* 제목 + 주최자 */}
                    <td className="px-5 py-3">
                      <p className="truncate font-medium text-[var(--color-text-primary)]">
                        {g.title ?? "(제목 없음)"}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {g.users?.nickname ?? g.users?.email ?? "-"}
                      </p>
                    </td>

                    {/* 유형 뱃지 */}
                    <td className="px-5 py-3">
                      <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: typeBadge?.bg ?? "var(--color-badge-gray)" }}>
                        {typeBadge?.label ?? "기타"}
                      </span>
                    </td>

                    {/* 장소 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)] truncate">
                      {g.venue_name ?? g.city ?? "-"}
                    </td>

                    {/* 일시 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {g.scheduled_at.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </td>

                    {/* 참가자 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {g.current_participants ?? 0}/{g.max_participants ?? "-"}
                    </td>

                    {/* 상태 변경 드롭다운 */}
                    <td className="px-5 py-3">
                      <form action={updateGameStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="game_id" value={String(g.id)} />
                        <Badge variant={STATUS_VARIANT[status] ?? "default"}>
                          {statusInfo?.text ?? "알 수 없음"}
                        </Badge>
                        {transitions.length > 0 && (
                          <>
                            <select
                              name="status"
                              defaultValue=""
                              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
                            >
                              <option value="" disabled>변경</option>
                              {transitions.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABEL[s]?.text ?? String(s)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="rounded-[10px] bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)]"
                            >
                              적용
                            </button>
                          </>
                        )}
                      </form>
                    </td>

                    {/* 생성일 */}
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {g.created_at.toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {games.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">등록된 경기가 없습니다.</div>
        )}
      </Card>
    </div>
  );
}
