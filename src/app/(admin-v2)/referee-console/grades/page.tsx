// referee-console/grades — 등급·수당 (준비 중 · 후속)
//   ★등급별 수당(AssociationFeeSetting)은 협회 단위(역할별 fee) → 전역 단일 정책 부재.
//   정본 RF_GRADES 카드는 데모값 → 박제 금지(mock 0). 협회별 단가는 R6-C/후속.
import { RefereeSoon } from "../_soon";

export const dynamic = "force-dynamic";

export default function RefereeGradesPage() {
  return (
    <RefereeSoon
      title="등급·수당"
      sub="심판 등급별 배정 권한과 경기당 수당을 관리합니다."
      icon="layers"
      desc="등급·수당 정책은 협회별 단가 정합 후 제공됩니다."
    />
  );
}
