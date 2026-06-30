// ============================================================
// (admin-v2)/v2/(backoffice)/logs/page.tsx — 컷오버 활동 로그
//   레거시 (admin)/admin/logs 의 v2 포팅(admin_logs 날짜별 뷰).
//   ⚠ 백엔드 0변경 — 순수 서버 컴포넌트 READ(admin_logs findMany, write 0).
//     검색/필터(날짜·기록앱)는 ?query Link 네비게이션(서버 재조회)·신규 API 0.
//   디자인: admin-v2 키트(PageHead/Badge/Icon) + ts-card/bo-* + var(--*) 토큰만.
//     ⚠ 하드코딩 색상(#fff/hex/rgba) 0.
// ============================================================

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { PageHead, Badge, Icon, type BadgeTone } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

// severity → 표시 라벨/톤(admin-v2 Badge)
const SEVERITY_META: Record<string, { label: string; tone: BadgeTone }> = {
  info: { label: "INFO", tone: "grey" },
  warning: { label: "WARN", tone: "warn" },
  error: { label: "ERROR", tone: "danger" },
};

// action 한글 보조 라벨(레거시 동일)
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
  "notification.broadcast": "알림 발송",
  record_app_impact_check: "기록앱 영향 판정",
};

const CHANGE_KEY_LABEL: Record<string, string> = {
  summary: "요약",
  diff_summary: "diff",
  changed_files: "변경 파일",
  api_paths: "API 경로",
  db_models: "DB 모델",
  response_fields: "응답 필드",
  impact: "기록앱 영향",
  api_contract_changes: "API 계약",
  backward_compatibility: "하위 호환성",
  user_decision_required: "사용자 결정",
  reasons: "판정 이유",
  added: "추가",
  removed: "삭제",
  renamed: "이름 변경",
  semantic_changes: "의미 변경",
  target: "대상",
  count: "건수",
};

const IMPACT_VALUE_LABEL: Record<string, string> = {
  none: "영향 없음",
  needs_review: "확인 필요",
  risk: "위험",
};
const CONTRACT_CHANGE_LABEL: Record<string, string> = {
  none: "변경 없음",
  field_addition: "필드 추가",
  field_removal: "필드 삭제",
  field_rename: "필드 이름 변경",
  semantic_change: "의미 변경",
  auth_change: "인증 변경",
};
const COMPATIBILITY_VALUE_LABEL: Record<string, string> = {
  maintained: "유지",
  may_break: "깨질 수 있음",
  unknown: "확인 필요",
};

type LogKindFilter = "record-app";

// ── KST 날짜/시간 포맷(레거시 1:1) ──
function toKSTDate(date: Date): string {
  const s = date.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return s.replace(/\. /g, "-").replace(/\.$/, "").replace(/\./g, "");
}
function toKSTTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildLogsHref(params: { date?: string; kind?: LogKindFilter }) {
  const search = new URLSearchParams();
  if (params.date) search.set("date", params.date);
  if (params.kind) search.set("kind", params.kind);
  const query = search.toString();
  return query ? `/v2/logs?${query}` : "/v2/logs";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function formatChangeKey(key: string) {
  return CHANGE_KEY_LABEL[key] ?? key;
}
function formatListValue(values: unknown[]) {
  const text = values
    .map((value) => formatChangeValue("", value))
    .filter((value) => value !== "-")
    .join(", ");
  return text || "-";
}
function formatResponseFields(value: Record<string, unknown>) {
  const parts = Object.entries(value)
    .map(([key, item]) => {
      if (!Array.isArray(item) || item.length === 0) return null;
      return `${formatChangeKey(key)}: ${formatListValue(item)}`;
    })
    .filter((item): item is string => !!item);
  return parts.length ? parts.join(" / ") : "-";
}
function formatChangeValue(key: string, value: unknown): string {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "필요" : "불필요";
  if (typeof value === "number") return value.toLocaleString("ko-KR");
  if (typeof value === "string") {
    if (key === "impact") return IMPACT_VALUE_LABEL[value] ?? value;
    if (key === "backward_compatibility") return COMPATIBILITY_VALUE_LABEL[value] ?? value;
    if (key === "api_contract_changes") return CONTRACT_CHANGE_LABEL[value] ?? value;
    return value;
  }
  if (Array.isArray(value)) {
    if (key === "api_contract_changes") {
      return (
        value
          .map((item) => (typeof item === "string" ? CONTRACT_CHANGE_LABEL[item] ?? item : formatChangeValue("", item)))
          .join(", ") || "-"
      );
    }
    return formatListValue(value);
  }
  if (isRecord(value)) {
    if (key === "response_fields") return formatResponseFields(value);
    return JSON.stringify(value);
  }
  return String(value);
}

export default async function AdminV2LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; kind?: string }>;
}) {
  const { date: dateFilter, kind } = await searchParams;
  const kindFilter: LogKindFilter | undefined = kind === "record-app" ? "record-app" : undefined;

  // ── where 조립(레거시 1:1) — 날짜는 KST→UTC 범위, 기록앱은 action 고정 ──
  const whereClause: Prisma.admin_logsWhereInput = {};
  if (dateFilter) {
    const kstStart = new Date(`${dateFilter}T00:00:00+09:00`);
    const kstEnd = new Date(`${dateFilter}T23:59:59+09:00`);
    whereClause.created_at = { gte: kstStart, lte: kstEnd };
  }
  if (kindFilter === "record-app") {
    whereClause.action = "record_app_impact_check";
  }

  const logs = await prisma.admin_logs
    .findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      take: 200,
      include: { users: { select: { nickname: true, email: true } } },
    })
    .catch(() => []);

  // 날짜별 그룹핑(KST)
  type LogEntry = (typeof logs)[number];
  const grouped = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const dateKey = toKSTDate(log.created_at);
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(log);
  }
  const availableDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const subText = `${
    kindFilter === "record-app" ? "기록앱 영향 판정" : dateFilter ? `${dateFilter} 로그` : "최근 200건"
  } · 총 ${logs.length}건`;

  return (
    <div>
      <PageHead
        eyebrow="백오피스 · 시스템"
        title="활동 로그"
        sub={subText}
        actions={
          <Link href="/v2/settings" className="ts-btn ts-btn--secondary ts-btn--sm">
            <Icon name="settings" size={15} />
            시스템 설정
          </Link>
        }
      />

      {/* 필터 칩 — Link 네비게이션(서버 재조회) */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "12px 0 16px" }}>
        {(dateFilter || kindFilter) && (
          <Link href="/v2/logs" className="ts-btn ts-btn--secondary ts-btn--sm">
            전체 보기
          </Link>
        )}
        <Link
          href={
            kindFilter === "record-app"
              ? buildLogsHref({ date: dateFilter })
              : buildLogsHref({ date: dateFilter, kind: "record-app" })
          }
          className={`ts-btn ts-btn--sm ${kindFilter === "record-app" ? "ts-btn--primary" : "ts-btn--secondary"}`}
        >
          기록앱 영향
        </Link>
        {dateFilter && (
          <Link href={buildLogsHref({ kind: kindFilter })} className="ts-btn ts-btn--secondary ts-btn--sm">
            날짜 해제
          </Link>
        )}
        {availableDates.slice(0, 7).map((d) => (
          <Link
            key={d}
            href={buildLogsHref({ date: d, kind: kindFilter })}
            className={`ts-btn ts-btn--sm ${dateFilter === d ? "ts-btn--primary" : "ts-btn--secondary"}`}
          >
            {d.slice(5)}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="ts-card" style={{ padding: 32, textAlign: "center", color: "var(--ink-mute)" }}>
          {dateFilter ? `${dateFilter}에 기록된 활동이 없습니다.` : "활동 로그가 없습니다."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {availableDates.map((dateKey) => {
            const dayLogs = grouped.get(dateKey)!;

            // 날짜별 마크다운 콘텐츠(서버 생성 — .md 다운로드용·레거시 1:1)
            const mdLines: string[] = [`# Admin Log — ${dateKey}`, "", `> 총 ${dayLogs.length}건`, ""];
            for (const log of dayLogs) {
              const time = log.created_at.toLocaleTimeString("ko-KR", {
                timeZone: "Asia/Seoul",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
              const admin = log.users ? log.users.nickname ?? log.users.email : "unknown";
              const sev = log.severity === "warning" ? "[WARN]" : log.severity === "error" ? "[ERROR]" : "-";
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
                {/* 날짜 헤더 + .md 다운로드 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{dateKey}</h2>
                  <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{dayLogs.length}건</span>
                  <a
                    href={`data:text/markdown;charset=utf-8,${encodeURIComponent(mdContent)}`}
                    download={`admin-log-${dateKey}.md`}
                    className="ts-btn ts-btn--ghost ts-btn--sm"
                    style={{ marginLeft: "auto" }}
                  >
                    <Icon name="download" size={14} />
                    .md 저장
                  </a>
                </div>

                <div className="ts-card" style={{ padding: 0, overflow: "hidden" }}>
                  {dayLogs.map((log, idx) => {
                    const changes = log.changes_made as Record<string, unknown> | null;
                    const prev = log.previous_values as Record<string, unknown> | null;
                    const meta = SEVERITY_META[log.severity ?? "info"] ?? SEVERITY_META.info;
                    return (
                      <div
                        key={log.id.toString()}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                          padding: "12px 16px",
                          borderTop: idx > 0 ? "1px solid var(--border)" : undefined,
                        }}
                      >
                        {/* 시간 */}
                        <span
                          style={{ width: 44, flexShrink: 0, fontSize: 12, fontFamily: "var(--ff-mono)", color: "var(--ink-mute)", marginTop: 2 }}
                        >
                          {toKSTTime(log.created_at)}
                        </span>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--ff-mono)", color: "var(--ink)" }}>
                              {log.action}
                            </span>
                            <Badge tone="grey">{log.resource_type}</Badge>
                            {ACTION_LABEL[log.action] && (
                              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>-- {ACTION_LABEL[log.action]}</span>
                            )}
                          </div>

                          {log.description && (
                            <p style={{ marginTop: 3, fontSize: 13, color: "var(--ink-soft)" }}>{log.description}</p>
                          )}

                          {/* 변경 diff */}
                          {changes && Object.keys(changes).length > 0 && (
                            <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, fontFamily: "var(--ff-mono)" }}>
                              {Object.entries(changes).map(([k, v]) => (
                                <span key={k}>
                                  <span style={{ color: "var(--ink-mute)" }}>{formatChangeKey(k)}:</span>{" "}
                                  {prev?.[k] !== undefined && (
                                    <span style={{ color: "var(--danger)", textDecoration: "line-through" }}>
                                      {formatChangeValue(k, prev[k])}
                                    </span>
                                  )}
                                  {prev?.[k] !== undefined && " → "}
                                  <span style={{ color: "var(--ok)" }}>{formatChangeValue(k, v)}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {log.users && (
                            <p style={{ marginTop: 3, fontSize: 11, color: "var(--ink-mute)" }}>
                              by {log.users.nickname ?? log.users.email}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
