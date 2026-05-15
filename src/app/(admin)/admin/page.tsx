// 2026-05-15 Admin-2 諛뺤젣 ???쒖븞 v2.14 AdminDashboard ?⑦꽩 諛뺤젣
//   - Prisma query / raw SQL / catch 遺꾧린 100% 蹂댁〈 (鍮꾩쫰?덉뒪 濡쒖쭅 蹂寃?0)
//   - UI 留??쒖븞 ?⑦꽩?쇰줈: admin-stat-grid + AdminStatCard / admin-chart / admin-log-card
//   - admin.css ?대옒??諛뺤젣 (Admin-1 commit 05caa04 ?먯꽌 諛뺤젣??
//
// 諛뺤젣 source: Dev/design/BDR-current/screens/AdminDashboard.jsx

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";

export const dynamic = "force-dynamic";

// 理쒓렐 ?쒕룞 濡쒓렇?먯꽌 ?≪뀡???쒓?濡??쒖떆?섎뒗 留ㅽ븨
const ACTION_LABEL: Record<string, string> = {
  "user.role_change": "??븷 蹂寃?,
  "user.status_change": "?곹깭 蹂寃?,
  "user.admin_toggle": "愿由ъ옄 ?꾪솚",
  "user.force_withdraw": "媛뺤젣 ?덊눜",
  "user.delete": "?좎? ??젣",
  "plan.create": "?붽툑???앹꽦",
  "plan.update": "?붽툑???섏젙",
  "plan.deactivate": "?붽툑??鍮꾪솢?깊솕",
  "plan.delete": "?붽툑????젣",
  "tournament.status_change": "????곹깭 蹂寃?,
  "suggestion.status_change": "嫄댁쓽?ы빆 ?곹깭 蹂寃?,
  "settings.cache_clear": "罹먯떆 珥덇린??,
  "settings.maintenance_toggle": "?먭?紐⑤뱶 蹂寃?,
};

// FR-060: Admin ??쒕낫??(Admin-2 諛뺤젣 ??UI 媛깆떊留?
export default async function AdminDashboard() {
  // ?듦퀎 + 理쒓렐 ?쒕룞 濡쒓렇 + 7???쒕룞 異붿씠瑜?蹂묐젹濡?議고쉶 ???댁쁺 濡쒖쭅 100% 蹂댁〈
  const [userCount, tournamentCount, matchCount, teamCount, recentLogs, weeklyActivity] =
    await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.tournamentMatch.count({ where: { status: "live" } }),
      prisma.team.count(),
      // 理쒓렐 愿由ъ옄 ?쒕룞 5嫄?議고쉶 (logs/page.tsx ?⑦꽩 李몄“)
      prisma.admin_logs
        .findMany({
          orderBy: { created_at: "desc" },
          take: 5,
          include: { users: { select: { nickname: true, email: true } } },
        })
        .catch(() => []),
      // 7???쒕룞 異붿씠: ?좎쭨蹂?admin_logs 嫄댁닔瑜?raw SQL濡?吏묎퀎
      // Prisma groupBy???좎쭨 異붿텧???대젮??raw query ?ъ슜
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

  // 7??李⑦듃 ?곗씠?? 鍮??좎쭨??0?쇰줈 梨꾩?
  const chartData: { day: string; count: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const found = weeklyActivity.find((w) => w.day === label);
    chartData.push({ day: label, count: found ? Number(found.count) : 0 });
  }
  // 理쒕?媛?(0?대㈃ 1濡? 0첨0 諛⑹?)
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div>
      {/* ?섏씠吏 ?ㅻ뜑 ???쒖븞 諛뺤젣 (eyebrow + ??title + subtitle) */}
      <AdminPageHeader
        eyebrow="ADMIN 쨌 ??쒕낫??
        title="愿由ъ옄 ??쒕낫??
        subtitle="?좎? 쨌 ?좊꼫癒쇳듃 쨌 寃쎄린 쨌 ? ?듦퀎? 理쒓렐 ?쒕룞?????덉뿉 ?뺤씤?⑸땲??"
      />

      {/* ?뱀뀡 ??댄? ??admin.css `.admin-section-title` (?쒖븞 諛뺤젣) */}
      <div className="admin-section-title">?듦퀎 쨌 理쒓렐 7??/div>

      {/* ?듦퀎 移대뱶 4醫????쒖븞 .admin-stat-grid + AdminStatCard (admin.css ?먮룞 諛섏쓳?? */}
      <div className="admin-stat-grid">
        <AdminStatCard
          icon="group"
          label="?꾩껜 ?좎?"
          value={userCount.toLocaleString()}
        />
        <AdminStatCard
          icon="emoji_events"
          label="?좊꼫癒쇳듃"
          value={tournamentCount}
        />
        <AdminStatCard
          icon="sports_basketball"
          label="吏꾪뻾以?寃쎄린"
          value={matchCount}
        />
        <AdminStatCard
          icon="groups"
          label="?깅줉 ?"
          value={teamCount.toLocaleString()}
        />
      </div>

      {/* 李⑦듃 + 理쒓렐 ?쒕룞 2 而щ읆 洹몃━?????쒖븞 諛뺤젣 (紐⑤컮??1??/ lg+ 1.4:1) */}
      <div className="admin-dash-grid">
        {/* 7???쒕룞 異붿씠 李⑦듃 ???쒖븞 `.admin-chart` */}
        <div className="admin-chart">
          <div className="admin-chart__head">
            <span className="admin-chart__title">?쒕룞 異붿씠</span>
            <span className="admin-chart__sub">愿由ъ옄 ?쒕룞 쨌 理쒓렐 7??/span>
          </div>
          <div className="admin-chart__body">
            {chartData.map((d) => {
              // 媛?留됰? ?믪씠瑜?理쒕?媛??鍮?鍮꾩쑉濡?怨꾩궛 ??0 ?대㈃ 理쒖냼 2% 諛뺤젣
              const heightPct = (d.count / maxCount) * 100;
              return (
                <div
                  key={d.day}
                  className="admin-chart__bar"
                  data-zero={d.count === 0 ? "true" : "false"}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                  title={`${d.day} 쨌 ${d.count}嫄?}
                >
                  <span className="admin-chart__bar-value">{d.count}</span>
                </div>
              );
            })}
          </div>
          <div className="admin-chart__x">
            {chartData.map((d) => (
              <span key={d.day}>{d.day}</span>
            ))}
          </div>
        </div>

        {/* 理쒓렐 ?쒕룞 濡쒓렇 ???쒖븞 `.admin-log-card` (admin_logs 理쒓렐 5嫄? */}
        <div className="admin-log-card">
          <div className="admin-log-card__head">
            <span className="admin-log-card__title">理쒓렐 ?쒕룞</span>
            {/* ?꾩껜 蹂닿린 留곹겕 ??Admin-2 諛뺤젣 (logs ?섏씠吏 吏꾩엯) */}
            <a
              href="/admin/logs"
              style={{
                background: "transparent",
                border: 0,
                color: "var(--ink-mute)",
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              ?꾩껜 蹂닿린 ??            </a>
          </div>
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => {
              const admin = log.users
                ? (log.users.nickname ?? log.users.email)
                : "unknown";
              // ?쒓컖?????쒖븞 .admin-log-row + data-severity (info/warning/error/success)
              const severity =
                log.severity === "error"
                  ? "error"
                  : log.severity === "warning"
                    ? "warning"
                    : log.severity === "success"
                      ? "success"
                      : "info";
              return (
                <div key={log.id.toString()} className="admin-log-row">
                  <span
                    className="admin-log-row__dot"
                    data-severity={severity}
                  />
                  <div className="admin-log-row__body">
                    <div className="admin-log-row__action">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </div>
                    {log.description && (
                      <div className="admin-log-row__desc">{log.description}</div>
                    )}
                  </div>
                  <div className="admin-log-row__meta">
                    <div>{admin}</div>
                    <div style={{ opacity: 0.7 }}>
                      {log.created_at.toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: 28,
                textAlign: "center",
                color: "var(--ink-mute)",
                fontSize: 13,
              }}
            >
              ?꾩쭅 湲곕줉???쒕룞???놁뒿?덈떎.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
