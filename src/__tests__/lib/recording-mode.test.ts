/**
 * 2026-05-11 — Phase 1-A 매치별 recording_mode 게이팅 헬퍼 회귀 방지.
 *
 * 검증 범위 (위임 §5 — 7 케이스):
 *   1. settings = null → "flutter" (운영 신규 매치 default)
 *   2. settings = {} → "flutter" (Prisma default 운영 기존 매치)
 *   3. settings = { recording_mode: "flutter" } → "flutter" 명시
 *   4. settings = { recording_mode: "paper" } → "paper" 명시
 *   5. settings = { recording_mode: "INVALID" } → "flutter" fallback
 *   6. assertRecordingMode(flutter 매치, "flutter") → null (통과)
 *   7. assertRecordingMode(paper 매치, "flutter") → 403 NextResponse
 *
 * 보너스 검증:
 *   - withRecordingMode 가 기존 keys 보존하는지 (다른 settings 컬럼 침범 X)
 *   - JSON 객체가 아닌 settings (string / number / array) 모두 fallback
 */

import { describe, it, expect } from "vitest";
import {
  getRecordingMode,
  assertRecordingMode,
  withRecordingMode,
  getTournamentDefaultMode,
  withTournamentDefaultMode,
} from "@/lib/tournaments/recording-mode";

describe("recording-mode — getRecordingMode (5 케이스)", () => {
  it("settings = null → 'flutter' (운영 신규 매치 fallback)", () => {
    // 운영 신규 매치는 settings 없이 생성 → null 가능 → 기본 flutter 유지
    expect(getRecordingMode({ settings: null })).toBe("flutter");
  });

  it("settings = {} → 'flutter' (Prisma default 빈 객체)", () => {
    // schema.prisma 의 settings default = "{}" → 운영 기존 매치 100% 가 빈 객체
    expect(getRecordingMode({ settings: {} })).toBe("flutter");
  });

  it("settings = { recording_mode: 'flutter' } → 'flutter' (명시)", () => {
    // 운영자가 명시적으로 flutter 모드 복원한 케이스
    expect(getRecordingMode({ settings: { recording_mode: "flutter" } })).toBe(
      "flutter"
    );
  });

  it("settings = { recording_mode: 'paper' } → 'paper' (명시)", () => {
    // 운영자가 종이 기록지 모드로 전환한 매치 — Flutter sync 차단 대상
    expect(getRecordingMode({ settings: { recording_mode: "paper" } })).toBe(
      "paper"
    );
  });

  it("settings = { recording_mode: 'INVALID' } → 'flutter' (fallback)", () => {
    // 알 수 없는 값 = 안전을 위해 flutter (운영 그대로 — 의도하지 않은 차단 방지)
    expect(getRecordingMode({ settings: { recording_mode: "INVALID" } })).toBe(
      "flutter"
    );
  });

  it("settings = 다른 keys 만 있음 (recording_mode 없음) → 'flutter'", () => {
    // 다른 settings 컬럼 (loserNextMatchId 등) 만 있는 매치 — Flutter 기본 보장
    expect(
      getRecordingMode({
        settings: { loserNextMatchId: "123", otherKey: true } as object,
      })
    ).toBe("flutter");
  });

  it("settings = 'string' (비객체) → 'flutter' fallback", () => {
    // Prisma.JsonValue 는 primitive 도 허용 → 비객체 case 안전 가드
    expect(getRecordingMode({ settings: "paper" as unknown as object })).toBe(
      "flutter"
    );
  });

  it("settings = [] (배열) → 'flutter' fallback", () => {
    // 배열도 typeof === "object" 라 일반 객체 처리 시 사고 가능 → 명시적 Array.isArray 가드
    expect(getRecordingMode({ settings: [] })).toBe("flutter");
  });
});

describe("recording-mode — assertRecordingMode (2 케이스)", () => {
  it("flutter 매치 + expected='flutter' → null (통과)", () => {
    // 기존 모든 매치가 flutter — Flutter v1 sync 정상 호출 시 가드 통과
    const result = assertRecordingMode(
      { id: BigInt(123), settings: null },
      "flutter",
      "Flutter sync from app"
    );
    expect(result).toBeNull();
  });

  it("paper 매치 + expected='flutter' → 403 NextResponse (차단)", async () => {
    // 종이 모드 매치는 Flutter sync 차단 — RECORDING_MODE_PAPER 코드 + 카피
    const result = assertRecordingMode(
      { id: BigInt(456), settings: { recording_mode: "paper" } },
      "flutter",
      "Flutter sync from app"
    );
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
    // 응답 body 검증 — apiError 가 JSON 으로 직렬화
    const body = await result?.json();
    expect(body.code).toBe("RECORDING_MODE_PAPER");
    expect(body.current_mode).toBe("paper");
    expect(body.match_id).toBe("456");
  });

  it("flutter 매치 + expected='paper' → 403 NextResponse (Phase 1-B 웹 BFF 시나리오)", async () => {
    // 웹 종이 기록지 BFF 가 flutter 매치 차단 — Phase 1-B 사전 검증
    const result = assertRecordingMode(
      { id: BigInt(789), settings: null },
      "paper",
      "Web score-sheet submit"
    );
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
    const body = await result?.json();
    expect(body.code).toBe("RECORDING_MODE_FLUTTER");
    expect(body.current_mode).toBe("flutter");
  });
});

describe("recording-mode — withRecordingMode (settings 보존)", () => {
  it("기존 settings 의 다른 keys 보존 + recording_mode 만 set", () => {
    // 운영 매치의 settings 가 loserNextMatchId 등 다른 정보 보유 → 모드 토글 시 보존 필수
    const result = withRecordingMode(
      { loserNextMatchId: "999", customKey: true },
      "paper"
    );
    expect(result).toEqual({
      loserNextMatchId: "999",
      customKey: true,
      recording_mode: "paper",
    });
  });

  it("null settings → { recording_mode } 만 신규 객체", () => {
    expect(withRecordingMode(null, "flutter")).toEqual({
      recording_mode: "flutter",
    });
  });

  it("비객체 settings (string) → 빈 객체에서 시작 (안전 가드)", () => {
    // settings 가 우연히 primitive 인 경우 — 침범 0 / 빈 객체에서 시작
    expect(withRecordingMode("invalid" as unknown as object, "paper")).toEqual({
      recording_mode: "paper",
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Phase 1 (2026-05-11) — tournament 단위 default mode 헬퍼 회귀 (3 케이스)
// ─────────────────────────────────────────────────────────────────────────
describe("recording-mode — getTournamentDefaultMode (3 케이스)", () => {
  it("tournament.settings = null → 'flutter' (운영 신규 대회 fallback)", () => {
    // 운영 신규 대회 = settings null → 기본 flutter (운영 그대로)
    expect(getTournamentDefaultMode({ settings: null })).toBe("flutter");
  });

  it("tournament.settings = { default_recording_mode: 'paper' } → 'paper'", () => {
    // 카드에서 운영자가 paper 로 변경한 케이스
    expect(
      getTournamentDefaultMode({
        settings: { default_recording_mode: "paper" },
      })
    ).toBe("paper");
  });

  it("tournament.settings = { default_recording_mode: 'INVALID' } → 'flutter' fallback", () => {
    // 알 수 없는 값 = 안전을 위해 flutter (의도하지 않은 차단 방지)
    expect(
      getTournamentDefaultMode({
        settings: { default_recording_mode: "OTHER" },
      })
    ).toBe("flutter");
  });

  it("tournament.settings = 다른 keys 만 → 'flutter'", () => {
    // 다른 settings 컬럼 (theme 등) 만 있는 대회 — Flutter 기본 보장
    expect(
      getTournamentDefaultMode({
        settings: { themeColor: "red" } as object,
      })
    ).toBe("flutter");
  });
});

describe("recording-mode — withTournamentDefaultMode (2 케이스)", () => {
  it("기존 tournament settings 의 다른 keys 보존 + default_recording_mode 만 set", () => {
    // 운영 대회 settings 가 theme 등 다른 정보 보유 → 모드 변경 시 보존 필수
    const result = withTournamentDefaultMode(
      { themeColor: "red", customKey: 1 },
      "paper"
    );
    expect(result).toEqual({
      themeColor: "red",
      customKey: 1,
      default_recording_mode: "paper",
    });
  });

  it("null settings → { default_recording_mode } 만 신규 객체", () => {
    expect(withTournamentDefaultMode(null, "flutter")).toEqual({
      default_recording_mode: "flutter",
    });
  });
});
