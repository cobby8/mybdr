// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper → div + 토큰 (admin/* 단순화)
// - 날짜 필터 칩: 자체 rounded → .btn .btn--sm (활성은 .btn--primary)

import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import Link from "next/link";

// (web) 시안 카드 패턴
const CARD_CLASS = "rounded-[var(--radius-card)] border";
const CARD_STYLE: React.CSSProperties = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-card)",
  boxShadow: "var(--shadow-card)",
};

export const dynamic = "force-dynamic";

const SEVERITY_COLOR: Record<string, string> = {
  info: "text-[var(--color-text-muted)]",
  warning: "text-[var(--color-warning)]",
  error: "text-[var(--color-error)]",
};

// Admin-6 박제 — 시안 v2.14 AdminLogs.jsx severity_tone 매핑
// info/warn/error → admin-stat-pill[data-tone] (info/warn/err)
// 시안 라벨도 영문 대문자 (INFO/WARN/ERROR/CRIT) — 운영은 enum "info"/"warning"/"error" 만 보유
const SEVERITY_TONE: Record<string, string> = {
  info: "info",
  warning: "warn",
  error: "err",
};
const SEVERITY_LABEL: Record<string, string> = {
  info: "INFO",
  warning: "WARN",
  error: "ERROR",
};

const ACTION_LABEL: Record<string, string> = {
  "user.role_change": "역할 변경",
  "user.status_change": "상태 변경",
  "plan.create": "요금제 생성",
  "plan.update": "요금제 수정",
  "plan.deactivate": "요금제 비활성화",
  "plan.delete": "요금제 삭제",
  "tournament.status_change": "대회 상태 변경",
  "settings.cache_clear": "캐시 초기화",
  "settings.maintenance_toggle": "점검모드 변경",
};

function toKSTDate(date: Date): string {
  // YYYY-MM-DD (KST)
  const s = date.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // ko-KR: "2026. 02. 23." → "2026-02-23"
  return s.replace(/\. /g, "-").replace(/\.$/, "").replace(/\./g, "");
}

function toKSTTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });
}

function toKSTFull(date: Date): string {
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

// FR-066: 관리자 활동 로그 (날짜별 마크다운 뷰)
export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateFilter } = await searchParams;

  let whereClause = {};
  if (dateFilter) {
    // KST 날짜 → UTC 범위로 변환
    const kstStart = new Date(`${dateFilter}T00:00:00+09:00`);
    const kstEnd = new Date(`${dateFilter}T23:59:59+09:00`);
    whereClause = { created_at: { gte: kstStart, lte: kstEnd } };
  }

  const logs = await prisma.admin_logs.findMany({
    where: whereClause,
    orderBy: { created_at: "desc" },
    take: 200,
    include: { users: { select: { nickname: true, email: true } } },
  }).catch(() => []);

  // 날짜별 그룹핑 (KST 기준)
  type LogEntry = (typeof logs)[number];
  const grouped = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const dateKey = toKSTDate(log.created_at);
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(log);
  }

  const availableDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      {/* Admin-6 박제 — 시안 v2.14 AdminLogs.jsx 헤더 패턴 카피 */}
      {/* eyebrow 영문 → 한글 ("ADMIN · 시스템") + breadcrumbs + actions */}
      <AdminPageHeader
        eyebrow="ADMIN · 시스템"
        title="활동 로그"
        subtitle={`${dateFilter ? `${dateFilter} 로그` : "최근 200건"} · 총 ${logs.length}건`}
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "시스템" },
          { label: "활동 로그" },
        ]}
        actions={
          <Link href="/admin/settings" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              settings
            </span>
            시스템 설정
          </Link>
        }
      />
      {/* 날짜 필터 칩 — 다중 행이라 별도 영역 (AdminPageHeader actions slot 에 안 넣음) */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {dateFilter && (
          <Link href="/admin/logs" className="btn btn--sm">전체 보기</Link>
        )}
          {availableDates.slice(0, 7).map((d) => (
            <Link
              key={d}
              href={`?date=${d}`}
              className={`btn btn--sm ${dateFilter === d ? "btn--primary" : ""}`}
            >
              {d.slice(5)}
            </Link>
          ))}
      </div>

      {logs.length === 0 ? (
        <div className={`${CARD_CLASS} p-8 text-center`} style={{ ...CARD_STYLE, color: "var(--color-text-muted)" }}>
          {dateFilter ? `${dateFilter}에 기록된 활동이 없습니다.` : "활동 로그가 없습니다."}
        </div>
      ) : (
        <div className="space-y-8">
          {availableDates.map((dateKey) => {
            const dayLogs = grouped.get(dateKey)!;

            // 이 날짜의 마크다운 콘텐츠 (서버에서 생성)
            const mdLines: string[] = [
              `# Admin Log — ${dateKey}`,
              "",
              `> 총 ${dayLogs.length}건`,
              "",
            ];
            for (const log of dayLogs) {
              const time = log.created_at.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit" });
              const admin = log.users ? (log.users.nickname ?? log.users.email) : "unknown";
              const sev = log.severity === "warning" ? "⚠️" : log.severity === "error" ? "🔴" : "•";
              mdLines.push(`- ${sev} \`${time}\` **${log.action}** [${log.resource_type}]`);
              if (log.description) mdLines.push(`  ${log.description}`);
              mdLines.push(`  _by ${admin}_`);
              const changes = log.changes_made as Record<string, unknown> | null;
              if (changes && Object.keys(changes).length > 0) {
                mdLines.push(`  \`${JSON.stringify(changes)}\``);
              }
              mdLines.push("");
            }
            const mdContent = mdLines.join("\n");

            return (
              <div key={dateKey}>
                {/* 날짜 헤더 (마크다운 ## 스타일) */}
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[var(--color-text-muted)]">##</span>
                  <h2 className="font-bold text-[var(--color-text-primary)]">{dateKey}</h2>
                  <span className="text-xs text-[var(--color-text-muted)]">{dayLogs.length}건</span>
                  {/* 마크다운 다운로드 */}
                  <a
                    href={`data:text/markdown;charset=utf-8,${encodeURIComponent(mdContent)}`}
                    download={`admin-log-${dateKey}.md`}
                    className="ml-auto rounded px-2 py-0.5 text-xs text-[var(--color-info)] hover:bg-[var(--color-elevated)]"
                  >
                    .md 저장
                  </a>
                </div>

                <div className={`${CARD_CLASS} overflow-hidden`} style={CARD_STYLE}>
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {dayLogs.map((log) => {
                      const changes = log.changes_made as Record<string, unknown> | null;
                      const prev = log.previous_values as Record<string, unknown> | null;
                      return (
                        <div key={log.id.toString()} className="flex items-start gap-4 px-5 py-3 hover:bg-[var(--color-surface)]">
                          {/* 시간 */}
                          <span className="mt-0.5 w-12 shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                            {toKSTTime(log.created_at)}
                          </span>

                          {/* 심각도 dot — 시안 라인 inline 인디케이터 보존 (시안엔 pill+dot 병행) */}
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            log.severity === "error" ? "bg-[var(--color-error)]" :
                            log.severity === "warning" ? "bg-[var(--color-warning)]" : "bg-[var(--color-text-muted)]"
                          }`} />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Admin-6 박제 — severity pill (시안 admin-stat-pill[data-tone]) */}
                              <span
                                className="admin-stat-pill"
                                data-tone={SEVERITY_TONE[log.severity ?? "info"] ?? "info"}
                                style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.04em", fontWeight: 700 }}
                              >
                                {SEVERITY_LABEL[log.severity ?? "info"] ?? (log.severity ?? "info").toUpperCase()}
                              </span>
                              <span className={`font-mono text-xs font-semibold ${SEVERITY_COLOR[log.severity ?? "info"]}`}>
                                {log.action}
                              </span>
                              {/* resource_type → admin-stat-pill mute (시안 source_label 패턴) */}
                              <span className="admin-stat-pill" data-tone="mute" style={{ fontFamily: "var(--ff-mono)", fontSize: 10 }}>
                                {log.resource_type}
                              </span>
                              {ACTION_LABEL[log.action] && (
                                <span className="text-xs text-[var(--color-text-secondary)]">-- {ACTION_LABEL[log.action]}</span>
                              )}
                            </div>

                            {log.description && (
                              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{log.description}</p>
                            )}

                            {/* 변경 diff */}
                            {changes && Object.keys(changes).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-3 font-mono text-xs">
                                {Object.entries(changes).map(([k, v]) => (
                                  <span key={k}>
                                    <span className="text-[var(--color-text-muted)]">{k}:</span>{" "}
                                    {prev?.[k] !== undefined && (
                                      <span className="text-[var(--color-error)] line-through">{String(prev[k])}</span>
                                    )}
                                    {prev?.[k] !== undefined && " → "}
                                    <span className="text-[var(--color-success)]">{String(v)}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {log.users && (
                              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                                by {log.users.nickname ?? log.users.email}
                              </p>
                            )}
                          </div>

                          <span className="hidden shrink-0 text-xs text-[var(--color-text-muted)] lg:block">
                            {toKSTFull(log.created_at)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
