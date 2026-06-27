import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { prisma } from "@/lib/db/prisma";
import { LIVE_MATCH_STATUSES } from "@/lib/constants/match-status";

export const dynamic = "force-dynamic";

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

export default async function AdminDashboard() {
  const [userCount, tournamentCount, matchCount, teamCount, recentLogs, weeklyActivity] =
    await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.tournamentMatch.count({
        where: { status: { in: [...LIVE_MATCH_STATUSES] } },
      }),
      prisma.team.count(),
      prisma.admin_logs
        .findMany({
          orderBy: { created_at: "desc" },
          take: 5,
          include: { users: { select: { nickname: true, email: true } } },
        })
        .catch(() => []),
      prisma.$queryRaw<{ day: string; count: bigint }[]>(
        Prisma.sql`
          SELECT TO_CHAR(created_at, 'MM-DD') AS day, COUNT(*) AS count
          FROM admin_logs
          WHERE created_at >= NOW() - INTERVAL '7 days'
          GROUP BY TO_CHAR(created_at, 'MM-DD')
          ORDER BY MIN(created_at)
        `,
      ).catch(() => []),
    ]);

  const chartData: { day: string; count: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const label = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const found = weeklyActivity.find((activity) => activity.day === label);
    chartData.push({ day: label, count: found ? Number(found.count) : 0 });
  }

  const maxCount = Math.max(...chartData.map((data) => data.count), 1);

  return (
    <div data-skin="toss">
      <AdminPageHeader
        eyebrow="ADMIN · 대시보드"
        title="관리자 대시보드"
        subtitle="유저, 대회, 경기, 팀 현황과 최근 관리자 활동을 한눈에 확인합니다."
      />

      <div className="ad-section-title">통계 · 최근 7일</div>
      <div className="ad-stats">
        <AdminStatCard icon="users" label="전체 유저" value={userCount.toLocaleString()} />
        <AdminStatCard icon="trophy" label="대회" value={tournamentCount} />
        <AdminStatCard icon="volleyball" label="진행중 경기" value={matchCount} />
        <AdminStatCard icon="users" label="등록 팀" value={teamCount.toLocaleString()} />
      </div>

      <div className="ad-dash-grid">
        <div className="ad-chart">
          <div className="ad-chart__head">
            <span className="ad-chart__title">활동 추이</span>
            <span className="ad-chart__sub">관리자 활동 · 최근 7일</span>
          </div>
          <div className="ad-chart__body">
            {chartData.map((data) => {
              const heightPct = (data.count / maxCount) * 100;
              return (
                <div
                  key={data.day}
                  className="ad-chart__bar"
                  data-zero={data.count === 0 ? "true" : "false"}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                  title={`${data.day} · ${data.count}건`}
                >
                  <span className="ad-chart__bar-value">{data.count}</span>
                </div>
              );
            })}
          </div>
          <div className="ad-chart__x">
            {chartData.map((data) => (
              <span key={data.day}>{data.day}</span>
            ))}
          </div>
        </div>

        <div className="ad-log-card">
          <div className="ad-log-card__head">
            <span className="ad-log-card__title">최근 활동</span>
            <Link href="/admin/logs" className="ad-log-card__link">
              전체 보기
            </Link>
          </div>

          {recentLogs.length > 0 ? (
            recentLogs.map((log) => {
              const admin = log.users ? (log.users.nickname ?? log.users.email) : "unknown";
              const severity =
                log.severity === "error"
                  ? "error"
                  : log.severity === "warning"
                    ? "warning"
                    : log.severity === "success"
                      ? "success"
                      : "info";

              return (
                <div key={log.id.toString()} className="ad-log-row">
                  <span className="ad-log-row__dot" data-severity={severity} />
                  <div className="ad-log-row__body">
                    <div className="ad-log-row__action">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </div>
                    {log.description && <div className="ad-log-row__desc">{log.description}</div>}
                  </div>
                  <div className="ad-log-row__meta">
                    <div>{admin}</div>
                    <div>
                      {log.created_at.toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="ad-log-empty">아직 기록된 활동이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
