// referee-console/evals — 평가 리포트 (준비 중 · R6-C)
//   ★RefereeEvaluation 모델 부재 → 신규 모델은 R6-C 에서 배치(평가/정산 신설모델).
//   정본 RF_EVAL 은 전부 mock → 박제 금지(mock 0).
import { RefereeSoon } from "../_soon";

export const dynamic = "force-dynamic";

export default function RefereeEvalsPage() {
  return (
    <RefereeSoon
      title="평가 리포트"
      sub="경기 후 제출된 심판 평가를 검토합니다."
      icon="star"
      desc="심판 평가 리포트는 평가 모델 도입(R6-C) 이후 제공됩니다."
    />
  );
}
