// 2026-05-15 Admin-2 박제 — 시안 v2.14 AdminDashboard 패턴 박제
//   - Prisma query / raw SQL / catch 분기 100% 보존 (비즈니스 로직 변경 0)
//   - UI 만 시안 패턴으로: admin-stat-grid + AdminStatCard / admin-chart / admin-log-card
//   - admin.css 클래스 박제 (Admin-1 commit 05caa04 에서 박제됨)
//
// 박제 source: Dev/design/BDR-current/screens/AdminDashboard.jsx

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatCard } from "@/components/admin/admin-stat-card";

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

// FR-060: Admin 대시보드 (Admin-2 박제 — UI 갱신만)
export default async function AdminDashboard() {
  // 통계 + 최근 활동 로그 + 7일 활동 추이를 병렬로 조회 — 운영 로직 100% 보존
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
      {/* 페이지 헤더 — 시안 박제 (eyebrow + 큰 title + subtitle) */}
      <AdminPageHeader
        eyebrow="ADMIN · 대시보드"
        title="관리자 대시보드"
        subtitle="유저 · 토너먼트 · 경기 · 팀 통계와 최근 활동을 한 눈에 확인합니다."
      />

      {/* 섹션 타이틀 — admin.css `.admin-section-title` (시안 박제) */}
      <div className="admin-section-title">통계 · 최근 7일</div>

      {/* 통계 카드 4종 — 시안 .admin-stat-grid + AdminStatCard (admin.css 자동 반응형) */}
      <div className="admin-stat-grid">
        <AdminStatCard
          icon="group"
          label="전체 유저"
          value={userCount.toLocaleString()}
        />
        <AdminStatCard
          icon="emoji_events"
          label="토너먼트"
          value={tournamentCount}
        />
        <AdminStatCard
          icon="sports_basketball"
          label="진행중 경기"
          value={matchCount}
        />
        <AdminStatCard
          icon="groups"
          label="등록 팀"
          value={teamCount.toLocaleString()}
        />
      </div>

      {/* 차트 + 최근 활동 2 컬럼 그리드 — 시안 박제 (모바일 1열 / lg+ 1.4:1) */}
      <div className="admin-dash-grid">
        {/* 7일 활동 추이 차트 — 시안 `.admin-chart` */}
        <div className="admin-chart">
          <div className="admin-chart__head">
            <span className="admin-chart__title">활동 추이</span>
            <span className="admin-chart__sub">관리자 활동 · 최근 7일</span>
          </div>
          <div className="admin-chart__body">
            {chartData.map((d) => {
              // 각 막대 높이를 최대값 대비 비율로 계산 — 0 이면 최소 2% 박제
              const heightPct = (d.count / maxCount) * 100;
              return (
                <div
                  key={d.day}
                  className="admin-chart__bar"
                  data-zero={d.count === 0 ? "true" : "false"}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                  title={`${d.day} · ${d.count}건`}
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

        {/* 최근 활동 로그 — 시안 `.admin-log-card` (admin_logs 최근 5건) */}
        <div className="admin-log-card">
          <div className="admin-log-card__head">
            <span className="admin-log-card__title">최근 활동</span>
            {/* 전체 보기 링크 — Admin-2 박제 (logs 페이지 진입) */}
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
              전체 보기 →
            </a>
          </div>
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => {
              const admin = log.users
                ? (log.users.nickname ?? log.users.email)
                : "unknown";
              // 시각화 — 시안 .admin-log-row + data-severity (info/warning/error/success)
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
              아직 기록된 활동이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
