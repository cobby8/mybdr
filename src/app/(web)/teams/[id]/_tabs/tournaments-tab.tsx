import { prisma } from "@/lib/db/prisma";

interface TournamentsTabProps {
  teamId: bigint;
}

export async function TournamentsTab({ teamId }: TournamentsTabProps) {
  const tournamentTeams = await prisma.tournamentTeam.findMany({
    where: { teamId },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          startDate: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch(() => []);

  if (tournamentTeams.length === 0) {
    return (
      <div className="rounded-[16px] bg-[var(--color-card)] px-5 py-10 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">대회 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] bg-[var(--color-card)] p-5">
      <div className="space-y-2">
        {tournamentTeams.map((tt) => {
          const t = tt.tournament;
          const year = t.startDate ? new Date(t.startDate).getFullYear() : null;
          const rankLabel = tt.final_rank ? `${tt.final_rank}위` : null;
          return (
            <div
              key={tt.id.toString()}
              className="flex items-center justify-between rounded-[12px] bg-[var(--color-surface-bright)] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{t.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {year ? `${year}년` : ""}
                  {tt.division ? ` · ${tt.division}` : ""}
                </p>
              </div>
              <div className="ml-3 flex flex-shrink-0 flex-col items-end gap-0.5">
                {rankLabel && (
                  <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                    {rankLabel}
                  </span>
                )}
                <span className="text-xs text-[var(--color-text-secondary)]">{tt.status ?? t.status ?? "-"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
