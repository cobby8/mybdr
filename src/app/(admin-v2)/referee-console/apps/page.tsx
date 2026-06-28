// referee-console/apps — 신청 관리 (준비 중 · 후속)
//   심판 배정 신청 승인/반려 = 승인 전용 엔드포인트 부재(pool 흐름으로 소비) → 준비 중(mock 0).
import { RefereeSoon } from "../_soon";

export const dynamic = "force-dynamic";

export default function RefereeAppsPage() {
  return (
    <RefereeSoon
      title="신청 관리"
      sub="심판들이 제출한 경기 배정 신청을 승인·반려합니다."
      icon="inbox"
      desc="배정 신청 승인 흐름은 정합 정리 후 제공됩니다."
    />
  );
}
