// referee-console/requests — 배정 요청 (준비 중 · 후속)
//   대회·단체가 제출한 배정 요청 처리 = 전용 모델/엔드포인트 부재 → 준비 중(mock 0).
import { RefereeSoon } from "../_soon";

export const dynamic = "force-dynamic";

export default function RefereeRequestsPage() {
  return (
    <RefereeSoon
      title="배정 요청"
      sub="대회·단체가 제출한 심판 배정 요청을 처리합니다."
      icon="send"
      desc="배정 요청 처리 기능은 다음 업데이트에서 제공됩니다."
    />
  );
}
