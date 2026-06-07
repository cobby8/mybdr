"use client";

import useSWR from "swr";
import Link from "next/link";

/**
 * 파트너 관리 대시보드
 * - 파트너사 정보 요약
 * - 캠페인 통계 (노출/클릭/CTR)
 * - 빠른 액션 링크
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

export default function PartnerDashboardPage() {
  // 파트너 정보 + 통계를 병렬로 가져옴
  const { data: partnerData } = useSWR<PartnerInfo>("/api/web/partner/me", fetcher);
  const { data: statsData } = useSWR<PartnerStats>("/api/web/partner/stats", fetcher);

  // hero stat 데이터 — 실 캠페인 통계 (노출/클릭/CTR + 총 캠페인). icon/color 는 navy hero 에서 불필요해 제거.
  const statCards = [
    { label: "총 캠페인", value: statsData?.total_campaigns ?? 0 },
    { label: "총 노출", value: (statsData?.total_impressions ?? 0).toLocaleString() },
    { label: "총 클릭", value: (statsData?.total_clicks ?? 0).toLocaleString() },
    { label: "평균 CTR", value: `${statsData?.ctr ?? "0.00"}%` },
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
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────
          VP1 박제 — Court Operator hero (navy gradient)
          시안 .cv-partner-hero(navy #16213E→#1B3C87) 셸을 운영 토큰으로 박제.
          mock(내코트·예약·매출·평점) 대신 실 캠페인 통계를 hero stat 으로 노출.
          Court Operator badge = navy+silver (Site Operator dark+gold 와 분리).
          ────────────────────────────────────────────────────────── */}
      <header
        className="flex items-start justify-between gap-5 flex-wrap rounded-lg p-6"
        style={{
          // 시안 navy gradient 박제 (Court Operator 측 색)
          background: "linear-gradient(120deg, #16213E 0%, #1B3C87 70%, #24489A 100%)",
          color: "#fff",
        }}
      >
        <div>
          {/* Court Operator badge — navy+silver (시안 .court-operator-badge 박제) */}
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10.5px] font-extrabold uppercase tracking-wider"
            style={{
              background: "linear-gradient(135deg, #1B3C87 0%, #2A4D9E 100%)",
              border: "1px solid #3A5BA8",
              color: "#fff",
            }}
          >
            {/* silver 아이콘 (#C0CCDB) — badge 측 구분 색 */}
            <span className="material-symbols-outlined text-[13px]" style={{ color: "#C0CCDB" }}>
              stadium
            </span>
            Court Operator
          </span>
          <h2 className="text-2xl font-extrabold mt-2.5 mb-1" style={{ color: "#fff" }}>
            {partnerData?.name ?? "파트너"} 대시보드
          </h2>
          <p className="text-xs" style={{ color: "rgba(255,255,255,.72)" }}>
            PARTNER · 광고 캠페인 현황
          </p>
        </div>

        {/* hero stat — 실 캠페인 통계(노출/클릭/CTR + 총 캠페인). mock 미사용 */}
        <div className="flex gap-6 flex-wrap">
          {statCards.map((card) => (
            <div key={card.label}>
              <div className="text-2xl font-extrabold" style={{ color: "#fff" }}>
                {card.value}
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-wide mt-0.5"
                style={{ color: "rgba(255,255,255,.6)" }}
              >
                {card.label}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* 상태별 캠페인 분포 */}
      {statsData?.status_counts && Object.keys(statsData.status_counts).length > 0 && (
        <div
          className="rounded-lg border p-5"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
            캠페인 상태 현황
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(statsData.status_counts).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  {statusLabels[status] ?? status}
                </span>
                <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/partner-admin/campaigns"
          className="flex items-center gap-3 rounded-lg border p-4 transition-all hover:shadow-md active:scale-[0.98]"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: "var(--color-primary)" }}
          >
            add_circle
          </span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              새 캠페인 만들기
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              광고를 등록하고 심사를 요청하세요
            </p>
          </div>
        </Link>

        <Link
          href="/partner-admin/venue"
          className="flex items-center gap-3 rounded-lg border p-4 transition-all hover:shadow-md active:scale-[0.98]"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: "var(--color-info)" }}
          >
            stadium
          </span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              대관 정보 관리
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              체육관 대관 가격, 운영시간을 설정하세요
            </p>
          </div>
        </Link>
      </div>

      {/* ──────────────────────────────────────────────────────────
          cross-domain note (시안 .bl-refund-note 박제) — 정보성 텍스트만(mock 0).
          코트 예약 결제(court_bookings)가 Phase 6.2 토스 결제와 동일 데이터임을 안내.
          ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-start gap-3 rounded-lg border p-4"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <span
          className="material-symbols-outlined text-xl"
          style={{ color: "var(--color-info)" }}
        >
          hub
        </span>
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            예약·매출은 결제 시스템과 연동됩니다
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            코트 예약 결제는 토스페이먼츠로 처리되며, 정산 내역은 매월 등록 계좌로 지급됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
