"use client";

// =====================================================================
// _console.tsx — 매너 평가 콘솔 (클라). 레거시 admin/game-reports/page.tsx 1:1 동작.
//   3탭: 매너 통계(stats) / 신고 큐(queue) / 최근 30일 추세(trend).
//
//   ⚠ 백엔드 0변경 — READ 는 레거시와 동일하게 기존 GET API 를 직접 호출:
//     · 큐    = GET /api/web/admin/game-reports?status=...&limit=20
//     · 통계  = GET /api/web/admin/game-reports/stats  (stats + trend 동시 반환)
//   ★ resolve 실배선 — 레거시는 "추후 추가" 텍스트만 두고 미배선이었으나,
//     resolve route 가 실재하므로 검토/기각 액션을 adminFetch POST 로 배선한다:
//     · POST /api/web/admin/game-reports/[id]/resolve  body { action: "resolve" | "dismiss" }
//   ⚠ apiSuccess 응답은 snake_case 자동변환 + { data } 래핑 → body.data ?? body 로 방어 접근.
//   ⚠ 디자인 — admin-v2 키트 + ts-*/bo-*/ad-* + var(--*) 토큰만. 하드코딩 색상 0. pill 9999px 0.
// =====================================================================

import React from "react";
import {
  PageHead,
  KpiGrid,
  Badge,
  Btn,
  Icon,
  Empty,
  useAdminShell,
  type BadgeTone,
} from "@/components/admin-v2";
import { adminFetch } from "@/lib/admin-v2/data";

// ── 신고 플래그 메타 (레거시 FLAG_META 동일) — DB 코드 → 라벨/이모지/톤 ──
const FLAG_META: Record<string, { label: string; emoji: string; tone: BadgeTone }> = {
  no_show: { label: "노쇼", emoji: "🚫", tone: "danger" },
  late: { label: "지각", emoji: "⏰", tone: "warn" },
  poor_manner: { label: "매너 불량", emoji: "😠", tone: "danger" },
  foul: { label: "거친 플레이", emoji: "💥", tone: "warn" },
  verbal: { label: "폭언", emoji: "🗯️", tone: "danger" },
  cheat: { label: "심판/규칙 무시", emoji: "⚖️", tone: "warn" },
};
function flagMeta(code: string) {
  return FLAG_META[code] || { label: code, emoji: "·", tone: "grey" as BadgeTone };
}

// ── 신고 큐 응답 타입 (apiSuccess snake_case 변환 후) ──
interface RatingItem {
  id: string;
  rated_user: { id: string; nickname: string };
  rating: number;
  flags: string[];
  is_noshow: boolean;
}
interface ReportItem {
  id: string;
  status: string;
  overall_rating: number;
  comment: string | null;
  created_at: string;
  game: { id: string; title: string; scheduled_at: string | null };
  reporter: { id: string; nickname: string };
  ratings: RatingItem[];
}

// ── 통계 응답 타입 (snake_case) ──
interface DistRow {
  score: number;
  pct: number;
}
interface TopUser {
  name: string;
  avg: number;
  eval_count: number;
}
interface LowUser {
  name: string;
  avg: number;
  eval_count: number;
  flags: string[]; // 종류만 (BG2)
}
interface StatsData {
  total_evaluations: number;
  avg_rating: number;
  report_rate: number;
  top_flag: string | null;
  distribution: DistRow[];
  top_users: TopUser[];
  low_users: LowUser[];
}
interface TrendRow {
  d: string;
  avg: number;
  count: number;
}

// 상태별 배지(레거시 statusBadge) — submitted=warn / reviewed·resolved=ok / dismissed=grey
function statusBadge(status: string): { tone: BadgeTone; label: string } {
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    submitted: { tone: "warn", label: "검토 대기" },
    reviewed: { tone: "ok", label: "검토 완료" },
    resolved: { tone: "ok", label: "검토 완료" }, // resolve API 결과값
    dismissed: { tone: "grey", label: "기각" },
  };
  return map[status] || map.submitted;
}

// 평점 → 토큰 색 (레거시: 4+ ok / 3+ warn / 그 외 danger)
function ratingColor(v: number) {
  return v >= 4 ? "var(--ok)" : v >= 3 ? "var(--warn)" : "var(--danger)";
}

type Tab = "stats" | "queue" | "trend";

export function MannerConsole() {
  const { toast } = useAdminShell();

  // 레거시 기본 탭 = 매너 통계(stats)
  const [tab, setTab] = React.useState<Tab>("stats");

  // ── 신고 큐 상태 ──
  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [queueLoading, setQueueLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("submitted");
  const [hasMore, setHasMore] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // ── 통계 상태 ──
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [trend, setTrend] = React.useState<TrendRow[]>([]);
  const [statsLoading, setStatsLoading] = React.useState(true);

  // 신고 큐 조회 (레거시 로직 보존 + body.data 방어 접근)
  const fetchReports = React.useCallback(async () => {
    setQueueLoading(true);
    const qs = new URLSearchParams({ status: filter, limit: "20" });
    try {
      const res = await fetch(`/api/web/admin/game-reports?${qs.toString()}`);
      if (res.ok) {
        const body = await res.json();
        const d = body?.data ?? body; // apiSuccess { data } 래핑/비래핑 모두 대응
        setReports(d?.reports ?? []);
        setHasMore(!!d?.has_more);
      } else {
        setReports([]);
        setHasMore(false);
      }
    } catch {
      setReports([]);
      setHasMore(false);
    }
    setQueueLoading(false);
  }, [filter]);

  // 통계 조회 — stats + trend 동시. 0건이면 빈 통계.
  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/web/admin/game-reports/stats");
      if (res.ok) {
        const body = await res.json();
        const d = body?.data ?? body;
        setStats(d?.stats ?? null);
        setTrend(d?.trend ?? []);
      } else {
        setStats(null);
        setTrend([]);
      }
    } catch {
      setStats(null);
      setTrend([]);
    }
    setStatsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);
  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ★ 검토/기각 — 기존 resolve route 실배선(백엔드 0변경). 성공 시 큐 재조회.
  const resolveReport = async (id: string, action: "resolve" | "dismiss") => {
    if (busyId) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/web/admin/game-reports/${id}/resolve`, {
        method: "POST",
        body: { action },
      });
      toast(action === "resolve" ? "검토 완료 처리했습니다" : "기각 처리했습니다");
      await fetchReports(); // status 전환 반영
    } catch (e) {
      toast(e instanceof Error ? e.message : "처리에 실패했습니다");
    } finally {
      setBusyId(null);
    }
  };

  // 신고 큐 탭 카운트 — 검토 대기(submitted) 건수
  const queuePending = reports.filter((r) => r.status === "submitted").length;

  const TABS: { id: Tab; label: string; n?: number }[] = [
    { id: "stats", label: "매너 통계" },
    { id: "queue", label: "신고 큐", n: queuePending },
    { id: "trend", label: "최근 30일 추세" },
  ];

  return (
    <div>
      <PageHead
        eyebrow="백오피스 · 사용자"
        title="매너 평가 검토"
        sub="BG2 사용자 결재 룰 — 평균 평점 + 받은 flag 종류만 노출 / 개별 평가 건수는 신고 큐에서만. 마이페이지 '내 매너' 카드와 동일 룰."
      />

      {/* 3탭 (매너 통계 / 신고 큐 / 30일 추세) */}
      <div className="bo-constabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="bo-constab"
            data-on={tab === t.id ? "true" : "false"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "queue" && (t.n ?? 0) > 0 ? ` ${t.n}` : ""}
          </button>
        ))}
      </div>

      {tab === "stats" && <MannerStatsTab stats={stats} loading={statsLoading} />}
      {tab === "trend" && <TrendTab trend={trend} stats={stats} loading={statsLoading} />}
      {tab === "queue" && (
        <ReportQueueTab
          reports={reports}
          loading={queueLoading}
          filter={filter}
          setFilter={setFilter}
          hasMore={hasMore}
          busyId={busyId}
          onResolve={resolveReport}
        />
      )}
    </div>
  );
}

/* ============================================================
 * 매너 통계 탭 (BG2 핵심) — 평균 + flag 종류만 / 개별 건수 ❌
 * ============================================================ */
function MannerStatsTab({ stats, loading }: { stats: StatsData | null; loading: boolean }) {
  if (loading) return <Loading />;
  if (!stats || stats.total_evaluations === 0) return <EmptyStats />;

  const topFlagM = stats.top_flag ? flagMeta(stats.top_flag) : null;

  // KPI 4종 — 평균 + 종류 / 개별 건수 ❌
  const kpis = [
    { label: "전체 평가 수", value: stats.total_evaluations.toLocaleString(), icon: "clipboard-list", tone: "primary" },
    { label: "평균 평점", value: stats.avg_rating.toFixed(1), icon: "star", tone: stats.avg_rating >= 4 ? "ok" : stats.avg_rating >= 3 ? "warn" : "danger" },
    { label: "신고 발생률", value: `${stats.report_rate}%`, icon: "triangle-alert", tone: "warn" },
    {
      label: "가장 많이 받은 flag",
      value: topFlagM ? `${topFlagM.emoji} ${topFlagM.label}` : "—",
      icon: "flag",
      tone: "danger",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <KpiGrid items={kpis} />

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {/* 평점 분포 — 구간별 비율만 */}
        <section className="ad-panel">
          <h3 style={panelTitle}>
            <Icon name="bar-chart-3" size={18} /> 평점 분포
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {stats.distribution.map((d) => (
              <div key={d.score} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 40, display: "flex", alignItems: "center", gap: 2, fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>
                  <span style={{ color: "var(--warn)" }}>★</span>
                  {d.score}
                </span>
                {/* 막대 트랙 (정사각 라운드 X·9999px X) */}
                <div style={{ flex: 1, height: 10, borderRadius: 6, overflow: "hidden", background: "var(--grey-100)" }}>
                  <div
                    style={{
                      width: `${d.pct}%`,
                      height: "100%",
                      borderRadius: 6,
                      background: d.score >= 4 ? "var(--ok)" : d.score >= 3 ? "var(--warn)" : "var(--danger)",
                    }}
                  />
                </div>
                <span style={{ width: 40, textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}>
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-mute)" }}>
            <Icon name="info" size={14} /> 구간별 비율만 노출 — 개별 평가자 / 평가 본문 ❌
          </p>
        </section>

        {/* 상위 매너 사용자 — 평균만 (BG2) */}
        <section className="ad-panel">
          <h3 style={panelTitle}>
            <Icon name="award" size={18} color="var(--ok)" /> 상위 매너 사용자
            <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--ink-mute)" }}>평균 4.5+ · 평가 10+</span>
          </h3>
          {stats.top_users.length === 0 ? (
            <p style={emptyLine}>기준을 만족하는 사용자가 없습니다.</p>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {stats.top_users.map((u, i) => (
                <li key={u.name} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                  <span style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 800, color: "var(--ink-mute)" }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)" }}>{u.name}</span>
                  <span style={{ fontWeight: 800, color: "var(--ok)" }}>{u.avg.toFixed(1)}</span>
                  <span style={{ width: 80, textAlign: "right", fontSize: 12, color: "var(--ink-mute)" }}>{u.eval_count}건 평가</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 하위 매너 사용자 — 평균 + flag 종류만 / 개별 건수 ❌ */}
      <section className="ad-panel">
        <h3 style={panelTitle}>
          <Icon name="file-warning" size={18} color="var(--danger)" /> 하위 매너 사용자 — 운영진 액션 검토
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--ink-mute)" }}>평균 3.0- 또는 flags 5+</span>
        </h3>
        {stats.low_users.length === 0 ? (
          <p style={emptyLine}>조치가 필요한 사용자가 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
            {stats.low_users.map((u, i) => (
              <div
                key={u.name}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", borderTop: i === 0 ? "0" : "1px solid var(--border)" }}
              >
                <span style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 800, color: "var(--ink-mute)" }}>{i + 1}</span>
                <div style={{ minWidth: 120 }}>
                  <div style={{ fontWeight: 700, color: "var(--ink)" }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{u.eval_count}건 평가</div>
                </div>
                <span style={{ fontWeight: 800, color: u.avg < 2.5 ? "var(--danger)" : "var(--warn)" }}>{u.avg.toFixed(1)}</span>
                <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {u.flags.length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>—</span>
                  ) : (
                    u.flags.map((f) => {
                      const m = flagMeta(f);
                      return (
                        <Badge key={f} tone={m.tone}>
                          {m.emoji} {m.label}
                        </Badge>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BG2 룰 안내 */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 8,
            padding: 12,
            borderRadius: 12,
            borderLeft: "3px solid var(--primary)",
            background: "var(--primary-weak)",
            fontSize: 12.5,
            color: "var(--ink-soft)",
          }}
        >
          <Icon name="shield-check" size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: "var(--ink)" }}>사용자 결재 룰 (BG2)</strong> — 평균 평점 + 받은 flag 종류만 표시. 개별 평가 건수 / 평가 본문은 신고 큐 탭에서만 (flags 배열 있는 ratings 한정).
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
 * 30일 추세 탭 (보조)
 * ============================================================ */
function TrendTab({ trend, stats, loading }: { trend: TrendRow[]; stats: StatsData | null; loading: boolean }) {
  if (loading) return <Loading />;
  if (trend.length === 0) return <EmptyStats />;

  const maxCount = Math.max(...trend.map((d) => d.count), 1);
  const avgRange = { min: 3.5, max: 5.0 }; // 레거시 동일 윈도우

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section className="ad-panel">
        <h3 style={panelTitle}>
          <Icon name="activity" size={18} /> 평균 평점 추세 (30일)
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--ink-mute)" }}>
            범위 {avgRange.min}–{avgRange.max}
          </span>
        </h3>
        {/* 막대 차트 — 일자별 평균 */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, overflowX: "auto", paddingBottom: 8, marginTop: 12, minHeight: 140 }}>
          {trend.map((d) => {
            const ratio = (d.avg - avgRange.min) / (avgRange.max - avgRange.min);
            const h = Math.max(20, Math.min(100, ratio * 100));
            return (
              <div key={d.d} style={{ display: "flex", flex: 1, minWidth: 28, flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-soft)" }}>{d.avg.toFixed(1)}</div>
                <div style={{ display: "flex", height: 80, width: "100%", alignItems: "flex-end", justifyContent: "center" }}>
                  <div
                    style={{
                      width: 12,
                      height: `${h}%`,
                      borderRadius: "6px 6px 0 0",
                      background: d.avg >= 4.5 ? "var(--ok)" : d.avg >= 4.0 ? "var(--primary)" : "var(--warn)",
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: "var(--ink-mute)" }}>{d.d}</div>
                <div style={{ fontSize: 10, color: "var(--ink-mute)" }}>{d.count}건</div>
              </div>
            );
          })}
        </div>
      </section>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <section className="ad-panel">
          <h3 style={panelTitle}>
            <Icon name="move-right" size={18} /> 30일 요약
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <div style={miniLabel}>평균 평점</div>
              <div style={{ marginTop: 4, fontSize: 24, fontWeight: 900, color: "var(--ok)" }}>{stats?.avg_rating?.toFixed(1) ?? "—"}</div>
            </div>
            <div>
              <div style={miniLabel}>총 평가 수</div>
              <div style={{ marginTop: 4, fontSize: 24, fontWeight: 900, color: "var(--ink)" }}>{stats?.total_evaluations?.toLocaleString() ?? "—"}</div>
            </div>
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-mute)" }}>
            일자별 최고 {maxCount}건. 30일 평가가 쌓일수록 추세가 안정됩니다.
          </p>
        </section>

        <section className="ad-panel">
          <h3 style={panelTitle}>
            <Icon name="triangle-alert" size={18} /> 신고 발생률
          </h3>
          <div style={{ marginTop: 8, fontSize: 36, fontWeight: 900, color: "var(--warn)" }}>{stats?.report_rate ?? 0}%</div>
          <p style={{ marginTop: 6, fontSize: 12, color: "var(--ink-mute)" }}>flags 배열 있는 평가 비율 (전체 대비)</p>
          {stats?.top_flag && (
            <div style={{ marginTop: 12, borderRadius: 10, background: "var(--grey-100)", padding: 8, fontSize: 12, color: "var(--ink-soft)" }}>
              <strong>가장 많이 받은 flag</strong> · {flagMeta(stats.top_flag).emoji} {flagMeta(stats.top_flag).label}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ============================================================
 * 신고 큐 탭 — ★검토/기각 액션 실배선
 * ============================================================ */
function ReportQueueTab({
  reports,
  loading,
  filter,
  setFilter,
  hasMore,
  busyId,
  onResolve,
}: {
  reports: ReportItem[];
  loading: boolean;
  filter: string;
  setFilter: (v: string) => void;
  hasMore: boolean;
  busyId: string | null;
  onResolve: (id: string, action: "resolve" | "dismiss") => void;
}) {
  const FILTERS = [
    { value: "submitted", label: "검토 대기" },
    { value: "reviewed", label: "검토 완료" },
    { value: "dismissed", label: "기각" },
    { value: "all", label: "전체" },
  ];

  return (
    <div>
      {/* 상태 필터 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map((t) => (
          <button
            key={t.value}
            type="button"
            className="ts-chip"
            data-active={filter === t.value ? "true" : "false"}
            onClick={() => setFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : reports.length === 0 ? (
        <Empty
          icon="inbox"
          title={filter === "submitted" ? "검토 대기 중인 신고가 없습니다." : "해당 상태의 신고가 없습니다."}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map((r) => {
            const badge = statusBadge(r.status);
            const busy = busyId === r.id;
            return (
              <article key={r.id} className="ad-panel" style={{ padding: 18 }}>
                {/* 헤더: 게임 + 상태 + 작성일 */}
                <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                      게임 #{r.game.id}
                      {r.game.scheduled_at && ` · ${new Date(r.game.scheduled_at).toLocaleString("ko-KR")}`}
                    </div>
                    <h3 style={{ marginTop: 2, fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{r.game.title || "(제목 없음)"}</h3>
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </header>

                {/* 신고자 + 종합 평점 */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12, fontSize: 14, color: "var(--ink-soft)", flexWrap: "wrap" }}>
                  <div>
                    <span style={{ color: "var(--ink-mute)" }}>신고자:</span> <span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.reporter.nickname}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--ink-mute)" }}>종합 평점:</span>{" "}
                    <span style={{ fontWeight: 700, color: ratingColor(r.overall_rating) }}>{r.overall_rating}/5</span>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-mute)" }}>{new Date(r.created_at).toLocaleString("ko-KR")}</div>
                </div>

                {/* 신고된 선수 + 플래그 */}
                <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--grey-50)", padding: 12 }}>
                  <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>신고된 선수 ({r.ratings.length}명)</div>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {r.ratings.map((rt) => (
                      <li key={rt.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 14 }}>
                        <span style={{ fontWeight: 600, color: "var(--ink)" }}>{rt.rated_user.nickname}</span>
                        <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>({rt.rating}/5)</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {rt.flags.map((f) => (
                            <Badge key={f} tone={flagMeta(f).tone}>
                              {flagMeta(f).emoji} {flagMeta(f).label}
                            </Badge>
                          ))}
                          {rt.is_noshow && !rt.flags.includes("no_show") && <Badge tone="danger">🚫 노쇼</Badge>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 코멘트 */}
                {r.comment && (
                  <div style={{ marginTop: 12, borderRadius: 10, borderLeft: "3px solid var(--primary)", background: "var(--grey-50)", padding: 12, fontSize: 14, color: "var(--ink-soft)" }}>
                    <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}>코멘트</div>
                    <p style={{ whiteSpace: "pre-wrap" }}>{r.comment}</p>
                  </div>
                )}

                {/* ★ 액션 — 검토/기각 실배선 (submitted 상태만) */}
                {r.status === "submitted" && (
                  <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <Btn variant="secondary" size="sm" icon="x" disabled={busy} onClick={() => onResolve(r.id, "dismiss")}>
                      {busy ? "처리 중…" : "기각"}
                    </Btn>
                    <Btn variant="primary" size="sm" icon="check" disabled={busy} onClick={() => onResolve(r.id, "resolve")}>
                      {busy ? "처리 중…" : "검토 완료"}
                    </Btn>
                  </div>
                )}
              </article>
            );
          })}

          {hasMore && (
            <p style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "var(--ink-mute)" }}>
              더 많은 신고가 있습니다 (현재 최근 20건만 표시)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 공통 빈/로딩 ── */
function Loading() {
  return <p style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-mute)" }}>불러오는 중...</p>;
}
function EmptyStats() {
  return (
    <Empty
      icon="line-chart"
      title="아직 매너 평가 데이터가 없습니다."
      desc="경기 종료 후 평가가 제출되면 최근 30일 통계가 자동으로 표시됩니다."
    />
  );
}

/* ── 공통 인라인 스타일 ── */
const panelTitle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 15,
  fontWeight: 800,
  color: "var(--ink)",
};
const emptyLine: React.CSSProperties = { padding: "16px 0", textAlign: "center", fontSize: 12, color: "var(--ink-mute)" };
const miniLabel: React.CSSProperties = { fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-mute)" };
