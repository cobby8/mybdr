/**
 * 2026-06-15 — effectiveTournamentStatus 검증 (Phase 1 대회 상태 표시 레이어).
 *
 * 목적: DB status 가 in_progress/published 로 박제된 채 종료일만 지난 레코드를
 *       라벨 표시 단계에서만 "completed"로 보정하는 로직을 검증한다.
 *       (DB / CTA(접수) 로직은 미접촉 — 표시 전용 유틸)
 *
 * 시간 의존성: Date.now() 를 사용하므로, 과거/미래를 "오늘 기준 상대 오프셋"으로 만들어
 *             테스트가 어느 날 실행되어도 안정적이도록 한다.
 */
import { describe, it, expect } from "vitest";
import { effectiveTournamentStatus } from "@/lib/constants/tournament-status";

// ---- 헬퍼: 오늘 기준 N일 전/후의 Date 생성 ----
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
// 오늘(시각 무관) — 종료일 "당일"은 아직 진행으로 봐야 함
function todayDate(): Date {
  return new Date();
}

describe("effectiveTournamentStatus", () => {
  // 1) published + 종료일 어제 → completed 보정
  it("published 이고 종료일이 어제면 completed 로 보정한다", () => {
    expect(
      effectiveTournamentStatus("published", daysFromNow(-3), daysFromNow(-1)),
    ).toBe("completed");
  });

  // 2) published + 종료일 내일 → 원본 유지 (아직 안 끝남)
  it("published 이고 종료일이 내일이면 원본(published)을 유지한다", () => {
    expect(
      effectiveTournamentStatus("published", daysFromNow(-1), daysFromNow(1)),
    ).toBe("published");
  });

  // 3) published + 종료일 오늘 → 원본 유지 (당일 23:59:59 까지 진행)
  it("published 이고 종료일이 오늘이면 당일 진행으로 보고 원본을 유지한다", () => {
    expect(
      effectiveTournamentStatus("published", daysFromNow(-2), todayDate()),
    ).toBe("published");
  });

  // 4) in_progress + 종료일 2년 전 → completed 보정
  it("in_progress 이고 종료일이 2년 전이면 completed 로 보정한다", () => {
    expect(
      effectiveTournamentStatus("in_progress", daysFromNow(-731), daysFromNow(-730)),
    ).toBe("completed");
  });

  // 5) cancelled + 과거 → 원본 유지 (이미 취소된 상태는 보정 제외)
  it("cancelled 이고 종료일이 과거여도 원본(cancelled)을 유지한다", () => {
    expect(
      effectiveTournamentStatus("cancelled", daysFromNow(-30), daysFromNow(-20)),
    ).toBe("cancelled");
  });

  // 6) draft + 과거 → 원본 유지 (준비중은 시간 경과로 종료시키지 않음)
  it("draft 이고 종료일이 과거여도 원본(draft)을 유지한다", () => {
    expect(
      effectiveTournamentStatus("draft", daysFromNow(-10), daysFromNow(-5)),
    ).toBe("draft");
  });

  // 7) end_date null + start_date 과거 → start_date 폴백으로 completed 보정
  it("end_date 가 null 이고 start_date 가 과거면 start_date 폴백으로 completed 보정한다", () => {
    expect(
      effectiveTournamentStatus("in_progress", daysFromNow(-5), null),
    ).toBe("completed");
  });

  // 8) start/end 둘 다 null → 원본 그대로 (보정 불가)
  it("start_date / end_date 둘 다 null 이면 원본 status 를 그대로 반환한다", () => {
    expect(effectiveTournamentStatus("in_progress", null, null)).toBe("in_progress");
  });
});
