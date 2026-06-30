"use client";

// ============================================================
// referee-console/settlements/_settlements-stats.tsx — 정산 통계 대시보드(클라)
//   레거시 (referee)/referee/admin/settlements/dashboard 의 카드6 + 6개월 추이 +
//   상위 심판/대회 + 서류 미완비 경고를 v2 키트로 박제.
//   ★데이터 = GET /api/web/referee-admin/settlements/summary (백엔드 0변경·기존 재사용).
//     · adminFetch 가 응답 snake→camel 단일 변환 → byStatus/topReferees/...camel 로 소비.
//     · 권한 = settlement_view. super 는 sentinel 자동통과(getAssociationAdmin).
//   ⚠ super 범위 한계: summary 는 admin.associationId(super 자동선택 첫 협회) 기준 집계 →
//     전역이 아닌 "선택 협회" 통계. 데이터 희박 환경 무영향. 백엔드 0변경이라 그대로 수용.
//   ★admin-v2 키트(KpiGrid/AdBarPanel/AdListPanel)·var(--*)만 — 하드코딩 색 0.
// ============================================================

import React from "react";
import {
  KpiGrid,
  AdBarPanel,
  AdListPanel,
  Empty,
  type KpiItem,
  type BarDatum,
  type ListItem,
} from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// ── summary 응답 타입(camel — adminFetch 변환 후) ─────────────────────
type Bucket = { count: number; amount: number };
type Summary = {
  year: number;
  month: number;
  total: Bucket;
  byStatus: {
    pending: Bucket;
    scheduled: Bucket;
    paid: Bucket;
    cancelled: Bucket;
    refunded: Bucket;
  };
  byMonth: {
    month: string; // "2026-01" (값 — 변환 안 됨)
    paidAmount: number;
    paidCount: number;
    pendingCount: number;
  }[];
  topReferees: {
    refereeId: string; // bigint → 직렬화 시 string
    name: string;
    totalPaid: number;
    count: number;
  }[];
  byTournament: {
    tournamentId: string;
    name: string;
    totalAmount: number;
    count: number;
  }[];
  documentsIncompleteCount: number;
};

// ── 상태 메타(레거시 STATUS_META 박제 — 색은 키트 tone 으로 대체, 하드코딩 0) ──
//   icon = lucide kebab name. tone = ad-kpi__icon data-tone(키트 토큰).
const STATUS_META: Record<
  "total" | "pending" | "scheduled" | "paid" | "cancelled" | "refunded",
  { label: string; icon: string; tone: string }
> = {
  total: { label: "전체", icon: "sigma", tone: "primary" },
  pending: { label: "미지급", icon: "clock", tone: "grey" },
  scheduled: { label: "지급예정", icon: "calendar-clock", tone: "warn" },
  paid: { label: "지급완료", icon: "circle-check", tone: "ok" },
  cancelled: { label: "취소", icon: "ban", tone: "danger" },
  refunded: { label: "환수", icon: "undo-2", tone: "violet" },
};

// 금액 포맷(자기완결 — 서버 모듈 의존 0).
const won = (n: number) => `${(n ?? 0).toLocaleString("ko-KR")}원`;

// 현재 월 기준 최근 12개월 옵션(레거시 getMonthOptions 박제).
function getMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const result: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    result.push({
      value: `${y}-${String(m).padStart(2, "0")}`,
      label: `${y}년 ${m}월`,
    });
  }
  return result;
}

export function SettlementsStats() {
  const now = new Date();
  const [month, setMonth] = React.useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [data, setData] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const monthOptions = React.useMemo(() => getMonthOptions(), []);

  // 월 변경 시 summary 재조회(기존 엔드포인트 재사용).
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const [y, m] = month.split("-");
    const path = `/api/web/referee-admin/settlements/summary?year=${y}&month=${parseInt(
      m,
      10
    )}`;
    adminFetch<Summary>(path)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive)
          setError(
            e instanceof AdminApiError ? e.message : "통계를 불러오지 못했습니다."
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [month]);

  // KPI 카드 6개(전체 + 5상태) — value=건수 / label=상태·금액.
  const kpis: KpiItem[] = React.useMemo(() => {
    if (!data) return [];
    const cell = (
      key: keyof typeof STATUS_META,
      bucket: Bucket
    ): KpiItem => ({
      label: `${STATUS_META[key].label} · ${won(bucket.amount)}`,
      value: `${bucket.count}건`,
      icon: STATUS_META[key].icon,
      tone: STATUS_META[key].tone,
    });
    return [
      cell("total", data.total),
      cell("pending", data.byStatus.pending),
      cell("scheduled", data.byStatus.scheduled),
      cell("paid", data.byStatus.paid),
      cell("cancelled", data.byStatus.cancelled),
      cell("refunded", data.byStatus.refunded),
    ];
  }, [data]);

  // 6개월 추이 막대(현재월 강조 = soft=false / 그 외 soft=true).
  const bars: BarDatum[] = React.useMemo(() => {
    if (!data) return [];
    return data.byMonth.map((r) => ({
      m: `${r.month.slice(5)}월`,
      v: r.paidAmount,
      soft: r.month !== month,
    }));
  }, [data, month]);

  // 상위 심판 / 대회 리스트 패널.
  const topRefItems: ListItem[] = React.useMemo(
    () =>
      (data?.topReferees ?? []).map((r) => ({
        id: r.refereeId,
        icon: "user",
        t: r.name,
        s: `${r.count}건`,
        time: won(r.totalPaid),
      })),
    [data]
  );
  const topTourItems: ListItem[] = React.useMemo(
    () =>
      (data?.byTournament ?? []).map((t) => ({
        id: t.tournamentId,
        icon: "trophy",
        t: t.name,
        s: `${t.count}건`,
        time: won(t.totalAmount),
      })),
    [data]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 월 셀렉터 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 13.5, color: "var(--ink-mute)" }}>
          월별 정산 현황과 상위 심판/대회 통계입니다.
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: "9px 12px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--ink)",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "var(--ff)",
          }}
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 에러 */}
      {error && (
        <div
          style={{
            fontSize: 13.5,
            color: "var(--danger)",
            background: "var(--danger-weak)",
            border: "1px solid var(--danger)",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div style={{ padding: 40 }}>
          <Empty icon="loader" title="불러오는 중..." />
        </div>
      )}

      {!loading && data && (
        <>
          {/* 서류 미완비 경고 */}
          {data.documentsIncompleteCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                border: "1px solid var(--warn)",
                background:
                  "color-mix(in srgb, var(--warn) 10%, transparent)",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: "var(--ink)" }}>
                  서류 미완비 경고
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ink-mute)",
                    marginTop: 3,
                    lineHeight: 1.5,
                  }}
                >
                  서류 3종(자격증/신분증/통장)이 부족한 심판의 정산{" "}
                  <b>{data.documentsIncompleteCount}건</b>이 지급 대기 중입니다.
                  지급 완료 전 서류를 확인하세요.
                </div>
              </div>
            </div>
          )}

          {/* 상단 KPI 카드 6개 */}
          <KpiGrid items={kpis} />

          {/* 6개월 추이 */}
          <AdBarPanel
            title="최근 6개월 지급액 추이"
            badge="지급완료 기준"
            badgeTone="ok"
            data={bars}
          />

          {/* 상위 심판 / 대회 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {topRefItems.length === 0 ? (
              <div className="ad-panel">
                <div className="ad-panel__head">
                  <div className="ad-panel__title">지급액 상위 심판</div>
                </div>
                <Empty title="데이터 없음" />
              </div>
            ) : (
              <AdListPanel
                title="지급액 상위 심판"
                badge="이번 달"
                badgeTone="primary"
                items={topRefItems}
              />
            )}
            {topTourItems.length === 0 ? (
              <div className="ad-panel">
                <div className="ad-panel__head">
                  <div className="ad-panel__title">대회별 정산 상위</div>
                </div>
                <Empty title="데이터 없음" />
              </div>
            ) : (
              <AdListPanel
                title="대회별 정산 상위"
                badge="이번 달"
                badgeTone="primary"
                items={topTourItems}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
