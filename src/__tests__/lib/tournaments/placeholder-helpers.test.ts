/**
 * 2026-05-15 PR-G5.1 — placeholder-helpers.ts 단위 검증.
 *
 * 검증 범위:
 *   - buildSlotLabel 5 kind × 정상 입력
 *   - buildPlaceholderNotes — ADVANCEMENT_REGEX 호환 형식 (강남구 사고 영구 차단)
 *   - parseSlotLabel 5 kind 역파싱 + 미매칭 / 빈 문자열
 *   - buildPlaceholderMatchPayload — 통합 payload 생성
 *   - isStandingsAutoFillable — 자동 채움 가능 페어 판정
 */
import { describe, it, expect } from "vitest";
import {
  buildSlotLabel,
  buildPlaceholderNotes,
  parseSlotLabel,
  buildPlaceholderMatchPayload,
  isStandingsAutoFillable,
} from "@/lib/tournaments/placeholder-helpers";

// ADVANCEMENT_REGEX 와 동일 (단일 source 호환 검증)
const ADVANCEMENT_REGEX = /([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/;

describe("buildSlotLabel — 5 kind 슬롯 라벨 생성", () => {
  it("group_rank — A조 1위 / B조 4위", () => {
    expect(buildSlotLabel({ kind: "group_rank", group: "A", rank: 1 })).toBe("A조 1위");
    expect(buildSlotLabel({ kind: "group_rank", group: "B", rank: 4 })).toBe("B조 4위");
  });

  it("match_winner — 8강 1경기 승자 / 준결승 2경기 승자", () => {
    expect(buildSlotLabel({ kind: "match_winner", roundName: "8강", matchNumber: 1 })).toBe("8강 1경기 승자");
    expect(buildSlotLabel({ kind: "match_winner", roundName: "준결승", matchNumber: 2 })).toBe("준결승 2경기 승자");
  });

  it("match_loser — 준결승 1경기 패자 (3·4위전)", () => {
    expect(buildSlotLabel({ kind: "match_loser", roundName: "준결승", matchNumber: 1 })).toBe("준결승 1경기 패자");
  });

  it("round_seed — R1 시드 5 (single_elim 1R)", () => {
    expect(buildSlotLabel({ kind: "round_seed", roundNumber: 1, seedNumber: 5 })).toBe("R1 시드 5");
  });

  it("tie_rank — 1위 동순위전 (group_stage_with_ranking)", () => {
    expect(buildSlotLabel({ kind: "tie_rank", rank: 1 })).toBe("1위 동순위전");
    expect(buildSlotLabel({ kind: "tie_rank", rank: 3 })).toBe("3위 동순위전");
  });

  // 2026-05-16 PR-G5.5-NBA-seed
  it("seed_number — 1번 시드 / 8번 시드 (NBA 표준 시드)", () => {
    expect(buildSlotLabel({ kind: "seed_number", seedNumber: 1 })).toBe("1번 시드");
    expect(buildSlotLabel({ kind: "seed_number", seedNumber: 8 })).toBe("8번 시드");
    expect(buildSlotLabel({ kind: "seed_number", seedNumber: 16 })).toBe("16번 시드");
  });
});

describe("buildPlaceholderNotes — ADVANCEMENT_REGEX 호환 형식 (강남구 사고 영구 차단)", () => {
  it("group_rank vs group_rank — 정규식 매칭 100%", () => {
    const notes = buildPlaceholderNotes("A조 1위", "B조 1위");
    expect(notes).toBe("A조 1위 vs B조 1위");
    const m = notes.match(ADVANCEMENT_REGEX);
    expect(m).not.toBeNull();
    expect(m![1]).toBe("A");
    expect(m![2]).toBe("1");
    expect(m![3]).toBe("B");
    expect(m![4]).toBe("1");
  });

  it("강남구 사고 13건 형식 모두 호환 (4·3·2·1위 / 3·2·1위)", () => {
    // i3-U9 4팀조: 4·3·2·1위 매칭
    for (const rank of [4, 3, 2, 1]) {
      const notes = buildPlaceholderNotes(`A조 ${rank}위`, `B조 ${rank}위`);
      expect(ADVANCEMENT_REGEX.test(notes)).toBe(true);
    }
    // i3-U11 3팀조: 3·2·1위
    for (const rank of [3, 2, 1]) {
      const notes = buildPlaceholderNotes(`A조 ${rank}위`, `B조 ${rank}위`);
      expect(ADVANCEMENT_REGEX.test(notes)).toBe(true);
    }
  });

  it("C조·D조 (다중 조) 도 정규식 매칭 (확장성)", () => {
    expect(ADVANCEMENT_REGEX.test(buildPlaceholderNotes("C조 1위", "D조 1위"))).toBe(true);
  });
});

describe("parseSlotLabel — 5 kind 역파싱", () => {
  it("group_rank 역파싱", () => {
    expect(parseSlotLabel("A조 1위")).toEqual({ kind: "group_rank", group: "A", rank: 1 });
    expect(parseSlotLabel("B조 12위")).toEqual({ kind: "group_rank", group: "B", rank: 12 });
  });

  it("match_winner 역파싱 — 한글 roundName 보존", () => {
    expect(parseSlotLabel("8강 1경기 승자")).toEqual({
      kind: "match_winner",
      roundName: "8강",
      matchNumber: 1,
    });
    expect(parseSlotLabel("준결승 2경기 승자")).toEqual({
      kind: "match_winner",
      roundName: "준결승",
      matchNumber: 2,
    });
  });

  it("match_loser 역파싱", () => {
    expect(parseSlotLabel("준결승 1경기 패자")).toEqual({
      kind: "match_loser",
      roundName: "준결승",
      matchNumber: 1,
    });
  });

  it("round_seed 역파싱", () => {
    expect(parseSlotLabel("R1 시드 5")).toEqual({
      kind: "round_seed",
      roundNumber: 1,
      seedNumber: 5,
    });
  });

  it("tie_rank 역파싱", () => {
    expect(parseSlotLabel("1위 동순위전")).toEqual({ kind: "tie_rank", rank: 1 });
    expect(parseSlotLabel("3위 동순위전")).toEqual({ kind: "tie_rank", rank: 3 });
  });

  // 2026-05-16 PR-G5.5-NBA-seed
  it("seed_number 역파싱 — NBA 시드 (tie_rank '1위 동순위전' 과 충돌 0)", () => {
    expect(parseSlotLabel("1번 시드")).toEqual({ kind: "seed_number", seedNumber: 1 });
    expect(parseSlotLabel("8번 시드")).toEqual({ kind: "seed_number", seedNumber: 8 });
    expect(parseSlotLabel("16번 시드")).toEqual({ kind: "seed_number", seedNumber: 16 });
    // tie_rank ("1위 동순위전") 와 분리 매칭 확인 — 정규식 충돌 0
    expect(parseSlotLabel("1위 동순위전")).toEqual({ kind: "tie_rank", rank: 1 });
  });

  it("미매칭 형식 → null", () => {
    // UI 카드의 "미정" / "TBD" 등 비표준 라벨
    expect(parseSlotLabel("미정")).toBeNull();
    expect(parseSlotLabel("TBD")).toBeNull();
    expect(parseSlotLabel("승자 미정")).toBeNull();
    // 빈 문자열 / null / undefined
    expect(parseSlotLabel("")).toBeNull();
    expect(parseSlotLabel(null)).toBeNull();
    expect(parseSlotLabel(undefined)).toBeNull();
  });

  it("buildSlotLabel ↔ parseSlotLabel round-trip (6 kind 모두)", () => {
    const inputs: Parameters<typeof buildSlotLabel>[0][] = [
      { kind: "group_rank", group: "A", rank: 1 },
      { kind: "match_winner", roundName: "8강", matchNumber: 3 },
      { kind: "match_loser", roundName: "준결승", matchNumber: 1 },
      { kind: "round_seed", roundNumber: 2, seedNumber: 7 },
      { kind: "tie_rank", rank: 2 },
      // 2026-05-16 PR-G5.5-NBA-seed
      { kind: "seed_number", seedNumber: 5 },
    ];
    for (const input of inputs) {
      const label = buildSlotLabel(input);
      const parsed = parseSlotLabel(label);
      expect(parsed).toEqual(input);
    }
  });
});

describe("buildPlaceholderMatchPayload — generator 통합 payload", () => {
  it("group_rank vs group_rank — advance 자동 채움 가능 (강남구 사고 패턴)", () => {
    const payload = buildPlaceholderMatchPayload({
      home: { kind: "group_rank", group: "A", rank: 4 },
      away: { kind: "group_rank", group: "B", rank: 4 },
    });
    expect(payload.homeTeamId).toBeNull();
    expect(payload.awayTeamId).toBeNull();
    expect(payload.notes).toBe("A조 4위 vs B조 4위");
    expect(payload.settings_partial).toEqual({
      homeSlotLabel: "A조 4위",
      awaySlotLabel: "B조 4위",
    });
    // ADVANCEMENT_REGEX 매칭 검증
    expect(ADVANCEMENT_REGEX.test(payload.notes)).toBe(true);
  });

  it("match_winner vs match_winner — 단일_elim 본선 패턴", () => {
    const payload = buildPlaceholderMatchPayload({
      home: { kind: "match_winner", roundName: "8강", matchNumber: 1 },
      away: { kind: "match_winner", roundName: "8강", matchNumber: 2 },
    });
    expect(payload.notes).toBe("8강 1경기 승자 vs 8강 2경기 승자");
    expect(payload.settings_partial.homeSlotLabel).toBe("8강 1경기 승자");
  });

  it("group_rank vs match_winner — 혼합 슬롯 (group_stage_knockout 본선 1R)", () => {
    const payload = buildPlaceholderMatchPayload({
      home: { kind: "group_rank", group: "A", rank: 1 },
      away: { kind: "match_winner", roundName: "예선 PO", matchNumber: 1 },
    });
    expect(payload.notes).toBe("A조 1위 vs 예선 PO 1경기 승자");
  });
});

describe("isStandingsAutoFillable — 자동 채움 가능 페어 판정", () => {
  it("group_rank vs group_rank = true (advanceDivisionPlaceholders 자동 채움)", () => {
    expect(isStandingsAutoFillable(
      { kind: "group_rank", group: "A", rank: 1 },
      { kind: "group_rank", group: "B", rank: 1 },
    )).toBe(true);
  });

  it("match_winner / tie_rank 포함 페어 = false (별도 progression)", () => {
    expect(isStandingsAutoFillable(
      { kind: "match_winner", roundName: "8강", matchNumber: 1 },
      { kind: "match_winner", roundName: "8강", matchNumber: 2 },
    )).toBe(false);
    expect(isStandingsAutoFillable(
      { kind: "group_rank", group: "A", rank: 1 },
      { kind: "match_winner", roundName: "8강", matchNumber: 1 },
    )).toBe(false);
    expect(isStandingsAutoFillable(
      { kind: "tie_rank", rank: 1 },
      { kind: "tie_rank", rank: 1 },
    )).toBe(false);
  });
});
