"use client";

import useSWR from "swr";
import Link from "next/link";
// Toss 키트 — KPI 카드(StatCard) · 아이콘(Icon)
import { Icon, StatCard } from "@/components/admin-toss";

/**
 * 파트너 관리 대시보드
 * - 파트너사 정보 요약
 * - 캠페인 통계 (노출/클릭/CTR)
 * - 빠른 액션 링크
 *
 * 2026-06-21 Phase 3 PR-A — Toss 재스킨(비주얼만).
 *   루트에 data-skin="toss". navy hero → 로컬 H 페이지헤더 + StatCard KPI grid.
 *   상태현황=.ts-card + .ts-badge. 아이콘 Material→lucide. SWR 2개·실데이터 = 변경 0.
 */

// 통계 API 응답 타입
interface PartnerStats {
  total_campaigns: number;
  status_counts: Record<string, number>;
  total_impressions: number;
  total_clicks: number;
  ctr: string;
  total_budget: number;
  total_spent: number;
}

// 파트너 정보 응답 타입
interface PartnerInfo {
  id: string;
  name: string;
  status: string;
  my_role: string;
  campaigns_count: number;
  members_count: number;
  created_at: string;
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 로컬 페이지 헤더(H) — 키트 수정 0. Toss 콘솔 상단 타이틀 룩(작은 라벨 + 큰 제목).
function H({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ margin: "2px 0 4px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>{title}</h2>
      {sub && (
        <p style={{ fontSize: 13.5, color: "var(--ink-mute)", marginTop: 4 }}>{sub}</p>
      )}
    </div>
  );
}

export default function PartnerDashboardPage() {
  // 파트너 정보 + 통계를 병렬로 가져옴
  const { data: partnerData } = useSWR<PartnerInfo>("/api/web/partner/me", fetcher);
  const { data: statsData } = useSWR<PartnerStats>("/api/web/partner/stats", fetcher);

  // KPI stat 데이터 — 실 캠페인 통계 (노출/클릭/CTR + 총 캠페인). lucide 아이콘명(kebab).
  const statCards = [
    { icon: "megaphone", label: "총 캠페인", value: statsData?.total_campaigns ?? 0 },
    { icon: "eye", label: "총 노출", value: (statsData?.total_impressions ?? 0).toLocaleString() },
    { icon: "mouse-pointer-click", label: "총 클릭", value: (statsData?.total_clicks ?? 0).toLocaleString() },
    { icon: "trending-up", label: "평균 CTR", value: `${statsData?.ctr ?? "0.00"}%` },
  ];

  // 캠페인 상태 레이블 매핑
  const statusLabels: Record<string, string> = {
    draft: "임시저장",
    pending_review: "심사 대기",
    approved: "승인됨",
    rejected: "반려됨",
    paused: "일시정지",
    ended: "종료",
  };

  return (
    // data-skin="toss" — 페이지 루트 opt-in (셸과 별개로 각 페이지 루트에도 필요)
    <div data-skin="toss" className="space-y-6">
      {/* ──────────────────────────────────────────────────────────
          Phase 3 PR-A — navy hero 폐기 → Toss 페이지헤더 + StatCard KPI grid.
          mock(내코트·예약·매출·평점) 대신 실 캠페인 통계를 StatCard 로 노출(데이터 불변).
          ────────────────────────────────────────────────────────── */}
      <H title={`${partnerData?.name ?? "파트너"} 대시보드`} sub="PARTNER · 광고 캠페인 현황" />

      {/* KPI grid — 실 캠페인 통계(노출/클릭/CTR + 총 캠페인). StatCard 키트 재사용 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <StatCard key={card.label} icon={card.icon} label={card.label} value={card.value} />
        ))}
      </div>

      {/* 상태별 캠페인 분포 — .ts-card + .ts-badge */}
      {statsData?.status_counts && Object.keys(statsData.status_counts).length > 0 && (
        <div className="ts-card">
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--ink)" }}>
            캠페인 상태 현황
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statsData.status_counts).map(([status, count]) => (
              <span key={status} className="ts-badge ts-badge--grey">
                {statusLabels[status] ?? status}
                <span style={{ fontWeight: 800, color: "var(--ink)" }}>{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 빠른 액션 — .ts-card(flat) 링크 2개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/partner-admin/campaigns"
          className="ts-card ts-card--flat flex items-center gap-3 transition-all hover:shadow-md active:scale-[0.98]"
          style={{ padding: 16 }}
        >
          {/* add_circle → lucide plus */}
          <Icon name="plus" size={26} color="var(--primary)" />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
              새 캠페인 만들기
            </p>
            <p className="text-xs" style={{ color: "var(--ink-mute)" }}>
              광고를 등록하고 심사를 요청하세요
            </p>
          </div>
        </Link>

        <Link
          href="/partner-admin/venue"
          className="ts-card ts-card--flat flex items-center gap-3 transition-all hover:shadow-md active:scale-[0.98]"
          style={{ padding: 16 }}
        >
          {/* stadium → lucide building */}
          <Icon name="building" size={26} color="var(--primary)" />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
              대관 정보 관리
            </p>
            <p className="text-xs" style={{ color: "var(--ink-mute)" }}>
              체육관 대관 가격, 운영시간을 설정하세요
            </p>
          </div>
        </Link>
      </div>

      {/* ──────────────────────────────────────────────────────────
          cross-domain note — 정보성 텍스트만(mock 0). .ts-card(flat).
          코트 예약 결제(court_bookings)가 토스 결제와 동일 데이터임을 안내.
          ────────────────────────────────────────────────────────── */}
      <div className="ts-card ts-card--flat flex items-start gap-3" style={{ padding: 16 }}>
        {/* hub → lucide share-2 */}
        <Icon name="share-2" size={20} color="var(--primary)" />
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
            예약·매출은 결제 시스템과 연동됩니다
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--ink-mute)" }}>
            코트 예약 결제는 토스페이먼츠로 처리되며, 정산 내역은 매월 등록 계좌로 지급됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
