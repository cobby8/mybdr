"use client";

/* ============================================================
 * CareerStatsSection — 통산 카드 + StatsDetailModal client wrapper
 *
 * 왜:
 *  - server component page.tsx 에서 stats / allStatsRows server-side prefetch
 *  - 그러나 [더보기 →] 버튼 클릭 → 모달 open state 는 client 필요
 *  - 따라서 통산 카드 + 모달 trigger 만 client wrapper 로 분리 (overview-tab.tsx 패턴 카피)
 *
 * 어떻게:
 *  - props: stats (CareerStats) + allStatsRows (AllStatsRow[])
 *  - useState 로 모달 open/close 관리
 *  - <CareerStatsGrid> + <StatsDetailModal> 합성
 * ============================================================ */

import { useState } from "react";

// 글로벌 통산 그리드 (Q5=Y-2 추출 컴포넌트)
import {
  CareerStatsGrid,
  type CareerStats,
} from "@/components/profile/career-stats-grid";

// 공개 프로필 _v2/ 의 모달 cross-route import (Q5 — 위치 그대로 두고 import 가능)
import {
  StatsDetailModal,
  type AllStatsRow,
} from "@/app/(web)/users/[id]/_v2/stats-detail-modal";

export interface CareerStatsSectionProps {
  stats: CareerStats;
  allStatsRows: AllStatsRow[];
}

export function CareerStatsSection({ stats, allStatsRows }: CareerStatsSectionProps) {
  // 모달 open/close — client state
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <CareerStatsGrid
        stats={stats}
        // allStatsRows 있을 때만 onShowMore 전달 — 데이터 0 인 사용자는 모달도 무의미
        onShowMore={allStatsRows.length > 0 ? () => setModalOpen(true) : undefined}
      />
      <StatsDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        allStatsRows={allStatsRows}
      />
    </>
  );
}
