import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { StatCard, Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

// 최근 활동 로그에서 액션을 한글로 표시하는 매핑
const ACTION_LABEL: Record<string, string> = {
  "user.role_change": "역할 변경",
  "user.status_change": "상태 변경",
  "user.admin_toggle": "관리자 전환",
  "user.force_withdraw": "강제 탈퇴",
  "user.delete": "유저 삭제",
  "plan.create": "요금제 생성",
  "plan.update": "요금제 수정",
  "plan.deactivate": "요금제 비활성화",
  "plan.delete": "요금제 삭제",
  "tournament.status_change": "대회 상태 변경",
  "suggestion.status_change": "건의사항 상태 변경",
  "settings.cache_clear": "캐시 초기화",
  "settings.maintenance_toggle": "점검모드 변경",
};

// FR-060: Admin 대시보드
export default async function AdminDashboard() {
  // 통계 + 최근 활동 로그 + 7일 활동 추이를 병렬로 조회
  const [userCount, tournamentCount, matchCount, teamCount, recentLogs, weeklyActivity] =
    await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.tournamentMatch.count({ where: { status: "live" } }),
      prisma.team.count(),
      // 최근 관리자 활동 5건 조회 (logs/page.tsx 패턴 참조)
      prisma.admin_logs
        .findMany({
          orderBy: { created_at: "desc" },
          take: 5,
          include: { users: { select: { nickname: true, email: true } } },
        })
        .catch(() => []),
      // 7일 활동 추이: 날짜별 admin_logs 건수를 raw SQL로 집계
      // Prisma groupBy는 날짜 추출이 어려워 raw query 사용
      prisma.$queryRaw<{ day: string; count: bigint }[]>(
        Prisma.sql`
          SELECT TO_CHAR(created_at, 'MM-DD') AS day, COUNT(*) AS count
          FROM admin_logs
          WHERE created_at >= NOW() - INTERVAL '7 days'
          GROUP BY TO_CHAR(created_at, 'MM-DD')
          ORDER BY MIN(created_at)
        `
      ).catch(() => []),
    ]);

  // 7일 차트 데이터: 빈 날짜도 0으로 채움
  const chartData: { day: string; count: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const found = weeklyActivity.find((w) => w.day === label);
    chartData.push({ day: label, count: found ? Number(found.count) : 0 });
  }
  // 최대값 (0이면 1로: 0÷0 방지)
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div>
      <AdminPageHeader
        eyebrow="ADMIN · DASHBOARD"
        title="대시보드"
        subtitle="유저 / 토너먼트 / 경기 / 팀 통계 + 최근 활동"
      />

      {/* 통계 카드 4개: Material Symbols 아이콘 사용
       * 이유: 기존 sm(640+) 시점부터 2열 → admin layout `lg:ml-64` 사이드바 보상이 없는 모바일에서 카드가 좁게 몰림.
       *      모바일 1열 / md(768+) 2열 / lg(1024+) 3열 / xl(1280+) 4열로 점진 확장. */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="전체 유저"
          value={userCount}
          icon={<span className="material-symbols-outlined text-2xl">people</span>}
        />
        <StatCard
          label="토너먼트"
          value={tournamentCount}
          icon={<span className="material-symbols-outlined text-2xl">emoji_events</span>}
        />
        <StatCard
          label="진행 중 경기"
          value={matchCount}
          icon={<span className="material-symbols-outlined text-2xl">sports_basketball</span>}
        />
        <StatCard
          label="등록 팀"
          value={teamCount}
          icon={<span className="material-symbols-outlined text-2xl">groups</span>}
        />
      </div>

      {/* 7일 활동 추이 차트: CSS bar chart (외부 라이브러리 없음) */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">7일 활동 추이</h2>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {chartData.map((d) => {
            // 각 막대 높이를 최대값 대비 비율로 계산 (최소 4px)
            const heightPct = Math.max((d.count / maxCount) * 100, 4);
            return (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                {/* 건수 라벨 */}
                <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                  {d.count}
                </span>
                {/* 막대 바 */}
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: d.count > 0 ? "var(--color-primary)" : "var(--color-border)",
                    minHeight: 4,
                    transition: "height 0.3s ease",
                  }}
                />
                {/* 날짜 라벨 */}
                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 최근 활동 로그: admin_logs 테이블에서 최근 5건 */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">최근 활동</h2>
        {recentLogs.length > 0 ? (
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {recentLogs.map((log) => {
              const admin = log.users
                ? (log.users.nickname ?? log.users.email)
                : "unknown";
              return (
                <div
                  key={log.id.toString()}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  {/* 심각도 표시 점 */}
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      log.severity === "error"
                        ? "bg-[var(--color-error)]"
                        : log.severity === "warning"
                          ? "bg-[var(--color-warning)]"
                          : "bg-[var(--color-text-muted)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                      {log.description && (
                        <span className="ml-1 text-[var(--color-text-muted)]">
                          - {log.description}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {admin} ·{" "}
                      {log.created_at.toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            아직 기록된 활동이 없습니다.
          </p>
        )}
      </Card>
    </div>
  );
}
