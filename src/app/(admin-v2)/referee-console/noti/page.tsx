// referee-console/noti — 알림 (준비 중 · 후속)
//   심판 대상 공지·배정 알림 발송 내역 = 발송 집계/내역 모델 미배선 → 준비 중(mock 0).
import { RefereeSoon } from "../_soon";

export const dynamic = "force-dynamic";

export default function RefereeNotiPage() {
  return (
    <RefereeSoon
      title="알림"
      sub="심판 대상 공지·배정 알림 발송 내역입니다."
      icon="bell"
      desc="알림 발송 내역 화면은 다음 업데이트에서 제공됩니다."
    />
  );
}
