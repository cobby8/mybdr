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

  // 통계 카드 데이터
  const statCards = [
    {
      label: "총 캠페인",
      value: statsData?.total_campaigns ?? 0,
      icon: "campaign",
      color: "var(--color-primary)",
    },
    {
      label: "총 노출",
      value: (statsData?.total_impressions ?? 0).toLocaleString(),
      icon: "visibility",
      color: "var(--color-info)",
    },
    {
      label: "총 클릭",
      value: (statsData?.total_clicks ?? 0).toLocaleString(),
      icon: "ads_click",
      color: "var(--color-navy, #1B3C87)",
    },
    {
      label: "평균 CTR",
      value: `${statsData?.ctr ?? "0.00"}%`,
      icon: "trending_up",
      color: "var(--color-success, #22C55E)",
    },
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
      {/* 환영 메시지 */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          대시보드
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          {partnerData?.name ?? "파트너"} 광고 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border p-4"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: card.color }}
              >
                {card.icon}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

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
    </div>
  );
}
