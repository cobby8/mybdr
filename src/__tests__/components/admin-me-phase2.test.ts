/**
 * 2026-05-11 — admin 마이페이지 Phase 2 신규 컴포넌트 회귀 방지.
 *
 * 본 테스트는 React DOM 마운트 대신 **순수 함수 / 데이터 변환** 만 검증한다.
 * 이유:
 *   - 프로젝트는 vitest 환경에 React Testing Library 없음 (기존 패턴 = 헬퍼/서비스 유닛만).
 *   - UI 시각 검증은 reviewer + 수동 검증으로 처리.
 *   - 본 테스트는 데이터 매핑 / 상대시간 계산 / 분기 로직만 가드.
 *
 * 검증 범위:
 *   - formatRelativeTime (recent-activity-card) — 5 시간대 분기
 *   - mergeRows 유사 검증 (managed-tournaments-card 의 상태 분류) — 통합 export 안 한 함수는 skip
 */

import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "@/app/(admin)/admin/me/_components/recent-activity-card";

describe("formatRelativeTime — admin 마이페이지 Phase 2 최근 활동 상대시간", () => {
  const NOW = new Date("2026-05-11T12:00:00Z");

  it("60초 미만 → '방금 전'", () => {
    const t = new Date(NOW.getTime() - 30 * 1000); // 30초 전
    expect(formatRelativeTime(t, NOW)).toBe("방금 전");
  });

  it("60초 ~ 60분 → 'N분 전'", () => {
    const t = new Date(NOW.getTime() - 5 * 60 * 1000); // 5분 전
    expect(formatRelativeTime(t, NOW)).toBe("5분 전");
  });

  it("1시간 ~ 24시간 → 'N시간 전'", () => {
    const t = new Date(NOW.getTime() - 3 * 60 * 60 * 1000); // 3시간 전
    expect(formatRelativeTime(t, NOW)).toBe("3시간 전");
  });

  it("정확히 1일 전 → '어제'", () => {
    const t = new Date(NOW.getTime() - 24 * 60 * 60 * 1000); // 24시간 전
    expect(formatRelativeTime(t, NOW)).toBe("어제");
  });

  it("2~6일 전 → 'N일 전'", () => {
    const t = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000); // 3일 전
    expect(formatRelativeTime(t, NOW)).toBe("3일 전");
  });

  it("7일+ → 'N월 N일' 절대 날짜", () => {
    const t = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000); // 10일 전 = 2026-05-01
    expect(formatRelativeTime(t, NOW)).toBe("5월 1일");
  });
});
