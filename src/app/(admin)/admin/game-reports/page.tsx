"use client";

/**
 * Admin 매너 평가 검토 페이지 (Phase 10-1 B-9 → Phase 2C · UD2 확장)
 *
 * 왜:
 * - (기존) 경기 종료 후 신고 플래그(no_show/late/poor_manner/foul/verbal/cheat)가 달린
 *   평가를 super_admin이 한 곳에서 검토하는 "신고 큐".
 * - (UD2 추가) 시안 BG2 — 그 위에 "매너 통계" + "30일 추세" 탭을 얹는다.
 *   ⚠️ BG2 사용자 결재 룰: 마이페이지 "내 매너" 카드(UC1)와 동일하게
 *      **평균 평점 + 받은 flag "종류"(키워드)만** 노출. flag별 "개별 건수"는 금지.
 *
 * 어떻게:
 * - 탭 3개: queue(기존 신고 큐 100% 보존) / stats(매너 통계) / trend(30일 추세)
 * - queue → GET /api/web/admin/game-reports  (기존)
 * - stats/trend → GET /api/web/admin/game-reports/stats  (UD2 신규 route, super_admin 가드)
 * - DB 실측(2026-05-29) game_player_ratings 0건 → 빈 상태 표시 (mock ❌). 데이터 쌓이면 자동.
 *
 * 보안:
 * - layout.tsx에서 admin 그룹 가드 적용 + 두 API 라우트에서 super_admin 재검증 (세션 변조 대비)
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
// Toss Phase 2 2B — lucide 키트 Icon (Material Symbols 교체)
import { Icon } from "@/components/admin-toss";
// v2.40 A3-2b — 통합 콘솔 키트(PageHead/Toolbar 헤더만 정합·차트/큐 본문은 보존)
import { PageHead, Toolbar } from "@/components/admin/console-kit";

// 신고 플래그 라벨 — DB 코드 → 한국어 표시 + 색조(tone) + 이모지
// (기존 FLAG_LABELS 확장: 시안 MANNER_FLAG_LABELS 의 emoji/tone 통합)
const FLAG_META: Record<string, { label: string; emoji: string; tone: string }> = {
  no_show: { label: "노쇼", emoji: "🚫", tone: "err" },
  late: { label: "지각", emoji: "⏰", tone: "warn" },
  poor_manner: { label: "매너 불량", emoji: "😠", tone: "err" },
  foul: { label: "거친 플레이", emoji: "💥", tone: "warn" },
  verbal: { label: "폭언", emoji: "🗯️", tone: "err" },
  cheat: { label: "심판/규칙 무시", emoji: "⚖️", tone: "warn" },
};
function flagMeta(code: string) {
  return FLAG_META[code] || { label: code, emoji: "·", tone: "warn" };
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

// 상태별 (label / tone) — submitted=warn / reviewed=ok / dismissed=mute
function statusBadge(status: string): { tone: string; label: string } {
  const map: Record<string, { tone: string; label: string }> = {
    submitted: { tone: "warn", label: "검토 대기" },
    reviewed: { tone: "ok", label: "검토 완료" },
    dismissed: { tone: "mute", label: "기각" },
  };
  return map[status] || map.submitted;
}

// 평점 → 토큰 색 (시안: 4+ ok / 3+ warn / 그 외 err)
function ratingColor(v: number) {
  return v >= 4 ? "var(--color-success)" : v >= 3 ? "var(--color-warning)" : "var(--color-error)";
}

type Tab = "stats" | "queue" | "trend";

export default function AdminGameReportsPage() {
  // 시안 기본 탭 = 매너 통계(stats). queue 는 기존 큐.
  const [tab, setTab] = useState<Tab>("stats");

  // ── 신고 큐 상태 (기존) ──
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [filter, setFilter] = useState<string>("submitted");
  const [hasMore, setHasMore] = useState(false);

  // ── 통계 상태 (신규) ──
  const [stats, setStats] = useState<StatsData | null>(null);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // 신고 큐 조회 (기존 로직 보존)
  const fetchReports = useCallback(async () => {
    setQueueLoading(true);
    const qs = new URLSearchParams({ status: filter, limit: "20" });
    const res = await fetch(`/api/web/admin/game-reports?${qs.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports || data.data?.reports || []);
      setHasMore(!!(data.has_more ?? data.data?.has_more));
    } else {
      setReports([]);
      setHasMore(false);
    }
    setQueueLoading(false);
  }, [filter]);

  // 통계 조회 (신규) — 마운트 1회. 0건이면 빈 통계 객체 반환
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    const res = await fetch("/api/web/admin/game-reports/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats ?? null);
      setTrend(data.trend ?? []);
    } else {
      setStats(null);
      setTrend([]);
    }
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 신고 큐 탭 뱃지 — 검토 대기(submitted) 건수
  const queuePending = reports.filter((r) => r.status === "submitted").length;

  return (
    <div data-skin="toss">
      {/* v2.40 A3-2b — AdminPageHeader→PageHead 키트 정합(차트/큐 본문은 보존) */}
      <PageHead
        icon="users"
        eyebrow="ADMIN · 사용자"
        title="매너 평가 검토"
        sub="BG2 사용자 결재 룰 — 평균 평점 + 받은 flag 종류만 노출 / 개별 평가 건수는 신고 큐에서만. 마이페이지 '내 매너' 카드와 동일 룰."
        actions={
          <Link href="/admin/users" className="btn btn--sm">
            <Icon name="users" size={14} />
            유저 관리로
          </Link>
        }
      />

      {/* v2.40 A3-2b — 3 탭(stats/queue/trend) → Toolbar 키트 정합.
          신고 큐 검토대기 건수는 탭의 n(우측 카운트)으로 이동. */}
      <Toolbar
        tabs={[
          { id: "stats", label: "매너 통계" },
          { id: "queue", label: "신고 큐", n: queuePending > 0 ? queuePending : null },
          { id: "trend", label: "최근 30일 추세" },
        ]}
        active={tab}
        onTab={(id) => setTab(id as Tab)}
      />

      {/* 탭 본문 — 차트(stats/trend)·신고 큐(queue) 카드 시각/데이터 그대로 보존 */}
      {tab === "stats" && <MannerStatsTab stats={stats} loading={statsLoading} />}
      {tab === "trend" && <TrendTab trend={trend} stats={stats} loading={statsLoading} />}
      {tab === "queue" && (
        <ReportQueueTab
          reports={reports}
          loading={queueLoading}
          filter={filter}
          setFilter={setFilter}
          hasMore={hasMore}
        />
      )}
    </div>
  );
}

/* ============================================================
 * 매너 통계 탭 (UD2 신규 · BG2 핵심)
 * 평균 + flag 종류만 / 개별 건수 ❌
 * ============================================================ */
function MannerStatsTab({ stats, loading }: { stats: StatsData | null; loading: boolean }) {
  if (loading) {
    return (
      <p className="py-8 text-center text-[var(--color-text-muted)]">불러오는 중...</p>
    );
  }
  // 데이터 0건 → 빈 상태 (mock ❌)
  if (!stats || stats.total_evaluations === 0) {
    return <EmptyStats />;
  }

  const topFlagM = stats.top_flag ? flagMeta(stats.top_flag) : null;
  // 평균에 따른 요약 카드 색
  const avgColor =
    stats.avg_rating >= 4.0
      ? "var(--color-success)"
      : stats.avg_rating >= 3.0
        ? "var(--color-warning)"
        : "var(--color-error)";

  return (
    <div className="flex flex-col gap-4">
      {/* 요약 카드 4개 — BG2: 평균 + 종류 / 개별 건수 ❌ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="전체 평가 수" value={stats.total_evaluations.toLocaleString()} sub="최근 30일" />
        <SummaryCard label="평균 평점" value={stats.avg_rating.toFixed(1)} sub="/ 5.0" color={avgColor} />
        <SummaryCard label="신고 발생률" value={`${stats.report_rate}%`} sub="flags 있는 평가" color="var(--color-warning)" />
        <SummaryCard
          label="가장 많이 받은 flag"
          value={topFlagM ? `${topFlagM.emoji} ${topFlagM.label}` : "—"}
          sub="키워드만 / 개별 건수 ❌"
          color="var(--color-primary)"
          small
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 평점 분포 — 구간별 비율만 */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <Icon name="bar-chart-3" size={18} />
            평점 분포
          </h3>
          <div className="flex flex-col gap-2">
            {stats.distribution.map((d) => (
              <div key={d.score} className="flex items-center gap-2">
                <span className="flex w-10 items-center gap-0.5 text-sm font-medium text-[var(--color-text-secondary)]">
                  <span style={{ color: "var(--color-warning)" }}>★</span>
                  {d.score}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-card)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.pct}%`,
                      background:
                        d.score >= 4
                          ? "var(--color-success)"
                          : d.score >= 3
                            ? "var(--color-warning)"
                            : "var(--color-error)",
                    }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-medium text-[var(--color-text-muted)]">
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <Icon name="info" size={14} />
            구간별 비율만 노출 — 개별 평가자 / 평가 본문 ❌
          </p>
        </section>

        {/* 상위 매너 사용자 — 평균만 (BG2) */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <Icon name="award" size={18} style={{ color: "var(--color-success)" }} />
            상위 매너 사용자
            <span className="ml-auto text-[10px] font-medium text-[var(--color-text-muted)]">
              평균 4.5+ · 평가 10+
            </span>
          </h3>
          {stats.top_users.length === 0 ? (
            <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
              기준을 만족하는 사용자가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {stats.top_users.map((u, i) => (
                <li key={u.name} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-center text-xs font-bold text-[var(--color-text-muted)]">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium text-[var(--color-text-primary)]">
                    {u.name}
                  </span>
                  <span className="font-bold" style={{ color: "var(--color-success)" }}>
                    {u.avg.toFixed(1)}
                  </span>
                  <span className="w-20 text-right text-xs text-[var(--color-text-muted)]">
                    {u.eval_count}건 평가
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 하위 매너 사용자 — 평균 + flag 종류만 / 개별 건수 ❌ */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <Icon name="file-warning" size={18} style={{ color: "var(--color-error)" }} />
          하위 매너 사용자 — 운영진 액션 검토
          <span className="ml-auto text-[10px] font-medium text-[var(--color-text-muted)]">
            평균 3.0- 또는 flags 5+
          </span>
        </h3>
        {stats.low_users.length === 0 ? (
          <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
            조치가 필요한 사용자가 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 560 }}>
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                  <th className="w-10 py-2">#</th>
                  <th className="py-2">사용자</th>
                  <th className="py-2">평균</th>
                  <th className="py-2">
                    받은 flag 종류{" "}
                    <span className="font-normal text-[var(--color-text-muted)]">(BG2 — 종류만)</span>
                  </th>
                  <th className="py-2 text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_users.map((u, i) => (
                  <tr key={u.name} className="border-b border-[var(--color-border)]">
                    <td className="py-2 font-bold text-[var(--color-text-muted)]">{i + 1}</td>
                    <td className="py-2">
                      <div className="font-medium text-[var(--color-text-primary)]">{u.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{u.eval_count}건 평가</div>
                    </td>
                    <td className="py-2 font-bold" style={{ color: u.avg < 2.5 ? "var(--color-error)" : "var(--color-warning)" }}>
                      {u.avg.toFixed(1)}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {u.flags.length === 0 ? (
                          <span className="text-xs text-[var(--color-text-muted)]">—</span>
                        ) : (
                          u.flags.map((f) => {
                            const m = flagMeta(f);
                            return (
                              <span key={f} className="ad-pill" data-tone={m.tone}>
                                {m.emoji} {m.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      {/* 액션 버튼 — 경고/정지 동작은 후속 작업 (현재 시각 박제) */}
                      <div className="flex justify-end gap-1">
                        <button className="btn btn--sm" disabled title="후속 작업">
                          경고
                        </button>
                        <button
                          className="btn btn--sm"
                          disabled
                          title="후속 작업"
                          style={{ background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" }}
                        >
                          정지
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BG2 룰 안내 박스 */}
        <div className="mt-3 flex gap-2 rounded-r border-l-2 border-[var(--color-info)] bg-[var(--color-card)] p-3 text-xs text-[var(--color-text-secondary)]">
          <Icon name="shield-check" size={16} style={{ flexShrink: 0, color: "var(--color-info)" }} />
          <div>
            <strong className="text-[var(--color-text-primary)]">사용자 결재 룰 (BG2)</strong> — 평균 평점 + 받은 flag
            종류만 표시. 개별 평가 건수 / 평가 본문은 신고 큐 탭에서만 (flags 배열 있는 ratings 한정).
          </div>
        </div>
      </section>
    </div>
  );
}

// 요약 카드
function SummaryCard({
  label,
  value,
  sub,
  color = "var(--color-text-primary)",
  small,
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-1 font-bold" style={{ color, fontSize: small ? 18 : 28, lineHeight: 1.1 }}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">{sub}</div>
    </div>
  );
}

// 통계 빈 상태 (game_player_ratings 0건 — mock ❌)
function EmptyStats() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center">
      <Icon name="line-chart" size={40} style={{ color: "var(--color-text-muted)" }} />
      <p className="text-sm font-medium text-[var(--color-text-primary)]">아직 매너 평가 데이터가 없습니다.</p>
      <p className="text-xs text-[var(--color-text-muted)]">
        경기 종료 후 평가가 제출되면 최근 30일 통계가 자동으로 표시됩니다.
      </p>
    </div>
  );
}

/* ============================================================
 * 30일 추세 탭 (UD2 신규 · 보조)
 * ============================================================ */
function TrendTab({
  trend,
  stats,
  loading,
}: {
  trend: TrendRow[];
  stats: StatsData | null;
  loading: boolean;
}) {
  if (loading) {
    return <p className="py-8 text-center text-[var(--color-text-muted)]">불러오는 중...</p>;
  }
  if (trend.length === 0) {
    return <EmptyStats />;
  }

  const maxCount = Math.max(...trend.map((d) => d.count), 1);
  // 평균 막대 높이 범위 (시안: 3.5~5.0 윈도우로 변화 강조)
  const avgRange = { min: 3.5, max: 5.0 };

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <Icon name="activity" size={18} />
          평균 평점 추세 (30일)
          <span className="ml-auto text-[10px] font-medium text-[var(--color-text-muted)]">
            범위 {avgRange.min}–{avgRange.max}
          </span>
        </h3>
        {/* 막대 차트 — 일자별 평균 */}
        <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ minHeight: 140 }}>
          {trend.map((d) => {
            const ratio = (d.avg - avgRange.min) / (avgRange.max - avgRange.min);
            const h = Math.max(20, Math.min(100, ratio * 100));
            return (
              <div key={d.d} className="flex min-w-[28px] flex-1 flex-col items-center gap-1">
                <div className="text-[10px] font-medium text-[var(--color-text-secondary)]">
                  {d.avg.toFixed(1)}
                </div>
                <div className="flex h-[80px] w-full items-end justify-center">
                  <div
                    className="w-3 rounded-t"
                    style={{
                      height: `${h}%`,
                      background:
                        d.avg >= 4.5
                          ? "var(--color-success)"
                          : d.avg >= 4.0
                            ? "var(--color-info)"
                            : "var(--color-warning)",
                    }}
                  />
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)]">{d.d}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">{d.count}건</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 30일 요약 */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <Icon name="move-right" size={18} />
            30일 요약
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                평균 평점
              </div>
              <div className="mt-1 text-2xl font-black" style={{ color: "var(--color-success)" }}>
                {stats?.avg_rating?.toFixed(1) ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                총 평가 수
              </div>
              <div className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">
                {stats?.total_evaluations?.toLocaleString() ?? "—"}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            일자별 최고 {maxCount}건. 30일 평가가 쌓일수록 추세가 안정됩니다.
          </p>
        </section>

        {/* 신고 발생률 */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <Icon name="triangle-alert" size={18} />
            신고 발생률
          </h3>
          <div className="text-4xl font-black" style={{ color: "var(--color-warning)" }}>
            {stats?.report_rate ?? 0}%
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            flags 배열 있는 평가 비율 (전체 대비)
          </p>
          {stats?.top_flag && (
            <div className="mt-3 rounded bg-[var(--color-card)] p-2 text-xs text-[var(--color-text-secondary)]">
              <strong>가장 많이 받은 flag</strong> · {flagMeta(stats.top_flag).emoji}{" "}
              {flagMeta(stats.top_flag).label}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ============================================================
 * 신고 큐 탭 (기존 로직 100% 보존 — 컴포넌트로 분리만)
 * ============================================================ */
function ReportQueueTab({
  reports,
  loading,
  filter,
  setFilter,
  hasMore,
}: {
  reports: ReportItem[];
  loading: boolean;
  filter: string;
  setFilter: (v: string) => void;
  hasMore: boolean;
}) {
  return (
    <>
      {/* 상태 필터 탭 */}
      <div className="mb-4 flex gap-2">
        {[
          { value: "submitted", label: "검토 대기" },
          { value: "reviewed", label: "검토 완료" },
          { value: "dismissed", label: "기각" },
          { value: "all", label: "전체" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`btn btn--sm ${filter === t.value ? "btn--primary" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">불러오는 중...</p>
      ) : reports.length === 0 ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">
          {filter === "submitted" ? "검토 대기 중인 신고가 없습니다." : "해당 상태의 신고가 없습니다."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => {
            const badge = statusBadge(r.status);
            return (
              <article
                key={r.id}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                {/* 헤더: 게임 + 상태 뱃지 + 작성일 */}
                <header className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-[var(--color-text-muted)]">
                      게임 #{r.game.id}
                      {r.game.scheduled_at &&
                        ` · ${new Date(r.game.scheduled_at).toLocaleString("ko-KR")}`}
                    </div>
                    <h3 className="mt-0.5 text-base font-semibold text-[var(--color-text-primary)]">
                      {r.game.title || "(제목 없음)"}
                    </h3>
                  </div>
                  <span className="ad-pill" data-tone={badge.tone}>
                    {badge.label}
                  </span>
                </header>

                {/* 신고자 + 종합 평점 */}
                <div className="mb-3 flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                  <div>
                    <span className="text-[var(--color-text-muted)]">신고자:</span>{" "}
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {r.reporter.nickname}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">종합 평점:</span>{" "}
                    <span className="font-medium" style={{ color: ratingColor(r.overall_rating) }}>
                      {r.overall_rating}/5
                    </span>
                  </div>
                  <div className="ml-auto text-xs text-[var(--color-text-muted)]">
                    {new Date(r.created_at).toLocaleString("ko-KR")}
                  </div>
                </div>

                {/* 신고된 선수 + 플래그 목록 */}
                <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                  <div className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                    신고된 선수 ({r.ratings.length}명)
                  </div>
                  <ul className="flex flex-col gap-2">
                    {r.ratings.map((rt) => (
                      <li key={rt.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {rt.rated_user.nickname}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          ({rt.rating}/5)
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {rt.flags.map((f) => (
                            <span key={f} className="ad-pill" data-tone={flagMeta(f).tone}>
                              {flagMeta(f).emoji} {flagMeta(f).label}
                            </span>
                          ))}
                          {rt.is_noshow && !rt.flags.includes("no_show") && (
                            <span className="ad-pill" data-tone="err">
                              🚫 노쇼
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 코멘트 (있을 때만) */}
                {r.comment && (
                  <div className="mt-3 rounded border-l-2 border-[var(--color-primary)] bg-[var(--color-card)] p-3 text-sm text-[var(--color-text-secondary)]">
                    <div className="mb-1 text-xs font-semibold text-[var(--color-text-muted)]">
                      코멘트
                    </div>
                    <p className="whitespace-pre-wrap">{r.comment}</p>
                  </div>
                )}

                {/* 액션 영역 — 향후 검토/기각 PATCH 추가 위치 */}
                {r.status === "submitted" && (
                  <div className="mt-3 text-right text-xs text-[var(--color-text-muted)]">
                    검토/기각 액션은 추후 추가 예정
                  </div>
                )}
              </article>
            );
          })}

          {hasMore && (
            <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
              더 많은 신고가 있습니다 (현재 최근 20건만 표시)
            </p>
          )}
        </div>
      )}
    </>
  );
}
