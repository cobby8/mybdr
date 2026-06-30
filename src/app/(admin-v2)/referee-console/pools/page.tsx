// ============================================================
// referee-console/pools/page.tsx — 일자별 운영(풀 대시보드) (4-4e 컷오버)
//   ★레거시 (referee)/referee/admin/pools/page.tsx 를 v2(Toss) 디자인으로 포팅.
//     대회 선택 → 일자·역할별 선정/책임자 현황을 카드로 요약. 실 데이터는 클라(_pools)가
//     기존 referee-admin announcements/tournaments/pools GET 을 adminFetch 로 호출(백엔드 0변경).
//   ★권한 = layout.tsx 글로벌 super 게이트(변경 0).
// ============================================================

import { PoolsDashboard } from "./_pools";

export const dynamic = "force-dynamic";

export default function RefereePoolsPage() {
  return <PoolsDashboard />;
}
