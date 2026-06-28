// referee-console/calendar — 배정 캘린더 (준비 중 · 후속)
//   주간 경기 일정 보드 = 일정/배정 시계열 집계 미배선 → 준비 중(mock 0).
import { RefereeSoon } from "../_soon";

export const dynamic = "force-dynamic";

export default function RefereeCalendarPage() {
  return (
    <RefereeSoon
      title="배정 캘린더"
      sub="주간 경기 일정과 심판 배정 상태를 한눈에 봅니다."
      icon="calendar-days"
      desc="주간 배정 캘린더 보드는 다음 업데이트에서 제공됩니다."
    />
  );
}
