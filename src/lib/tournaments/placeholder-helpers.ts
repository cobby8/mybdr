/**
 * 2026-05-15 PR-G5.1 — 대진표 placeholder 박제 공통 헬퍼.
 *
 * 도메인 컨텍스트:
 *   강남구협회장배 사고 (2026-05-15) = 순위전 매치 13건이 실제 팀으로 박힘 → 예선 결과 무시.
 *   근본 원인 = generator 가 placeholder 박제 안 함 + 운영자 수동 INSERT 시 notes 형식 위반.
 *
 * 본 모듈 = 단일 source of truth:
 *   - `buildSlotLabel` (5 kind) — UI 카드 + advance-placeholders 정규식 매칭 보장
 *   - `buildPlaceholderNotes` — `ADVANCEMENT_REGEX` (`division-advancement.ts:21`) 호환 형식 자동 생성
 *   - `parseSlotLabel` — UI 카드 표시 + 검증 도구용
 *
 * 사용 흐름:
 *   1) generator 가 매치 INSERT 시 homeTeamId/awayTeamId = NULL + notes = buildPlaceholderNotes(...)
 *      + settings.homeSlotLabel/awaySlotLabel = buildSlotLabel(...)
 *   2) UI 카드 (schedule-timeline.tsx) = settings.homeSlotLabel 우선 표시 (팀 미확정 시)
 *   3) 예선 종료 → advanceDivisionPlaceholders 가 notes 파싱 → standings 매핑 → 실팀 채움
 */

// ─────────────────────────────────────────────────────────────────────────
// SlotKind 7종 — generator 별 사용처
// ─────────────────────────────────────────────────────────────────────────
//
// | kind                 | 사용 generator                                | 라벨 예시         |
// |----------------------|----------------------------------------------|------------------|
// | group_rank           | league_advancement / group_stage_with_ranking | "A조 1위"        |
// |                      | dual (8강 home/away — 조 1·2위)               |                  |
// | match_winner         | single_elim / dual / group_stage_knockout    | "8강 1경기 승자"  |
// | match_loser          | single_elim (3·4위전)                        | "준결승 1경기 패자"|
// | round_seed           | single_elim 1R (시드 배정)                    | "R1 시드 1"      |
// | tie_rank             | group_stage_with_ranking 동순위전             | "1위 동순위전"    |
// | seed_number          | nba_seed_knockout (NBA 표준 시드)             | "1번 시드"        |
//                        (2026-05-16 PR-G5.5-NBA-seed 추가)
//                        기존 round_seed ("R1 시드 5") = 라운드별 시드 인덱스 의미.
//                        신규 seed_number ("1번 시드") = 절대 시드 번호 (NBA 양분 트리 페어링용).
//                        ⚠️ assignTeamsToKnockout (settings.homeSlotLabel "N위" 정규식 파싱) 와
//                           의미 충돌 주의 — NBA 모드는 skeleton 단계 우회 (옵션 B 분기) 결정됨.
// | group_match_result   | dual (조 G3 승자전 / G4 패자전 / 조 최종전)   | "A조 1경기 승자" / "A조 승자전 패자" |
//                        (2026-05-16 PR-G5.2 추가 — A·B·C 군 단일 kind 흡수)
//                        matchSlot=G1·G2 → "{group}조 N경기 {result}"
//                        matchSlot=G3 → "{group}조 승자전 {result}"
//                        matchSlot=G4 → "{group}조 패자전 {result}"
export type SlotKind =
  | "group_rank"
  | "match_winner"
  | "match_loser"
  | "round_seed"
  | "tie_rank"
  | "seed_number"
  | "group_match_result";

export type SlotLabelParams =
  | { kind: "group_rank"; group: string; rank: number }
  | { kind: "match_winner"; roundName: string; matchNumber: number }
  | { kind: "match_loser"; roundName: string; matchNumber: number }
  | { kind: "round_seed"; roundNumber: number; seedNumber: number }
  | { kind: "tie_rank"; rank: number }
  | { kind: "seed_number"; seedNumber: number }
  // 2026-05-16 PR-G5.2 dual-generator refactor — 조별 더블엘리미 결과 슬롯 (A·B·C 군)
  // matchSlot: G1/G2 = 조내 1경기/2경기 / G3 = 승자전 / G4 = 패자전
  // result:    winner | loser
  | { kind: "group_match_result"; group: string; matchSlot: "G1" | "G2" | "G3" | "G4"; result: "winner" | "loser" };

/**
 * 슬롯 라벨 생성 — 5 kind 단일 진입점.
 *
 * 사유:
 *   - generator 마다 인라인 문자열 박제 시 형식 비일관 발생 (강남구 사고 원인)
 *   - 단일 헬퍼 통과 의무 → 정규식 호환 + UI 표시 일관성 보장
 *
 * @example
 *   buildSlotLabel({ kind: "group_rank", group: "A", rank: 1 }) // "A조 1위"
 *   buildSlotLabel({ kind: "match_winner", roundName: "8강", matchNumber: 1 }) // "8강 1경기 승자"
 *   buildSlotLabel({ kind: "tie_rank", rank: 1 }) // "1위 동순위전"
 */
export function buildSlotLabel(params: SlotLabelParams): string {
  switch (params.kind) {
    case "group_rank":
      return `${params.group}조 ${params.rank}위`;
    case "match_winner":
      return `${params.roundName} ${params.matchNumber}경기 승자`;
    case "match_loser":
      return `${params.roundName} ${params.matchNumber}경기 패자`;
    case "round_seed":
      return `R${params.roundNumber} 시드 ${params.seedNumber}`;
    case "tie_rank":
      return `${params.rank}위 동순위전`;
    case "seed_number":
      // 2026-05-16 PR-G5.5-NBA-seed: NBA 표준 시드 번호 라벨.
      // 사유: round_seed ("R1 시드 5") 는 라운드별 시드 인덱스라 NBA 양분 트리 의미와 충돌.
      //   "1번 시드" 는 토너먼트 전체 절대 시드 번호 — 1·8·4·5 같은 NBA 표준 페어링용.
      return `${params.seedNumber}번 시드`;
    case "group_match_result": {
      // 2026-05-16 PR-G5.2 dual-generator refactor: 조별 더블엘리미 결과 슬롯 (A·B·C 군 흡수).
      // 사유: dual-tournament-generator.ts 의 인라인 박제 12건 중 A·B·C 군 (8건) 을
      //       기존 5 kind 로 매핑 시 의미 모호 (roundName 중복 / null 어색) → 도메인 응집성 위해 단일 신규 kind.
      //   matchSlot=G1·G2 → "{group}조 N경기 {result}"  (예: "A조 1경기 승자")
      //   matchSlot=G3    → "{group}조 승자전 {result}"  (예: "A조 승자전 패자" — 조 최종전 home)
      //   matchSlot=G4    → "{group}조 패자전 {result}"  (예: "A조 패자전 승자" — 조 최종전 away)
      const slotLabel =
        params.matchSlot === "G3"
          ? "승자전"
          : params.matchSlot === "G4"
            ? "패자전"
            : `${params.matchSlot.replace("G", "")}경기`;
      const resultLabel = params.result === "winner" ? "승자" : "패자";
      return `${params.group}조 ${slotLabel} ${resultLabel}`;
    }
  }
}

/**
 * placeholder 매치 `notes` 박제 — `division-advancement.ts` ADVANCEMENT_REGEX 호환.
 *
 * 정규식 룰: `([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위`
 *
 * 사유: 강남구 사고 = 운영자가 notes 를 수동 박제 시 형식 위반 → advanceDivisionPlaceholders 자동 채움 실패.
 *   본 헬퍼 호출만 거치면 정규식 매칭 100% 보장.
 *
 * 호환 형식: group_rank 형식 슬롯만 자동 채움 가능.
 *   - 다른 kind (match_winner / tie_rank) 슬롯은 별도 채움 흐름 (single_elim FK / group_stage_with_ranking)
 *
 * @example
 *   buildPlaceholderNotes("A조 4위", "B조 4위") // "A조 4위 vs B조 4위"
 */
export function buildPlaceholderNotes(homeSlot: string, awaySlot: string): string {
  return `${homeSlot} vs ${awaySlot}`;
}

/**
 * 슬롯 라벨 역파싱 — UI 카드 + 검증 도구.
 *
 * @example
 *   parseSlotLabel("A조 1위") // { kind: "group_rank", group: "A", rank: 1 }
 *   parseSlotLabel("8강 1경기 승자") // { kind: "match_winner", roundName: "8강", matchNumber: 1 }
 *   parseSlotLabel("R1 시드 5") // { kind: "round_seed", roundNumber: 1, seedNumber: 5 }
 *   parseSlotLabel("1위 동순위전") // { kind: "tie_rank", rank: 1 }
 *   parseSlotLabel("미정") // null (정규식 미매칭 = isCustom 진입 신호)
 */
export function parseSlotLabel(label: string | null | undefined): SlotLabelParams | null {
  if (!label) return null;
  const s = label.trim();
  if (!s) return null;

  // 1) group_rank: "A조 1위" / "B조 4위"
  let m = s.match(/^([A-Z])조\s*(\d+)위$/);
  if (m) return { kind: "group_rank", group: m[1], rank: Number(m[2]) };

  // 2) group_match_result: "A조 1경기 승자" / "A조 승자전 패자" / "A조 패자전 승자"
  //    ⚠️ 반드시 match_winner / match_loser 보다 먼저 매칭 — "A조 1경기 승자" 가
  //       match_winner 정규식 (`^(.+?)\s*(\d+)경기\s*승자$`) 에 lazy match 되어 roundName="A조" 로 해석되는 충돌 회피.
  //    PR-G5.2 추가 (2026-05-16) — dual-tournament-generator.ts A·B·C 군 박제용
  m = s.match(/^([A-Z])조\s+(\d+경기|승자전|패자전)\s+(승자|패자)$/);
  if (m) {
    const slotPart = m[2];
    const matchSlot: "G1" | "G2" | "G3" | "G4" =
      slotPart === "승자전"
        ? "G3"
        : slotPart === "패자전"
          ? "G4"
          : (`G${slotPart.replace("경기", "")}` as "G1" | "G2");
    return {
      kind: "group_match_result",
      group: m[1],
      matchSlot,
      result: m[3] === "승자" ? "winner" : "loser",
    };
  }

  // 3) match_winner: "8강 1경기 승자" / "준결승 2경기 승자"
  m = s.match(/^(.+?)\s*(\d+)경기\s*승자$/);
  if (m) return { kind: "match_winner", roundName: m[1].trim(), matchNumber: Number(m[2]) };

  // 4) match_loser: "준결승 1경기 패자"
  m = s.match(/^(.+?)\s*(\d+)경기\s*패자$/);
  if (m) return { kind: "match_loser", roundName: m[1].trim(), matchNumber: Number(m[2]) };

  // 5) round_seed: "R1 시드 5"
  m = s.match(/^R(\d+)\s*시드\s*(\d+)$/);
  if (m) return { kind: "round_seed", roundNumber: Number(m[1]), seedNumber: Number(m[2]) };

  // 6) tie_rank: "1위 동순위전"
  m = s.match(/^(\d+)위\s*동순위전$/);
  if (m) return { kind: "tie_rank", rank: Number(m[1]) };

  // 7) seed_number: "1번 시드" / "8번 시드" (NBA 표준 시드 — PR-G5.5-NBA-seed)
  //    ⚠️ tie_rank ("1위 동순위전") 정규식보다 뒤에 두면 충돌 0 — 패턴 분리 명확
  //    ⚠️ assignTeamsToKnockout 의 "N위" 정규식 (replace(/\D/g, "")) 과는 별도 — NBA 모드 우회 결정
  m = s.match(/^(\d+)번\s*시드$/);
  if (m) return { kind: "seed_number", seedNumber: Number(m[1]) };

  return null;
}

/**
 * placeholder 매치 박제 payload 생성 — generator 가 prisma.tournamentMatch.create 시 사용.
 *
 * 사유: 강남구 사고 영구 차단 — generator 들이 NULL + notes + settings 박제 의무 패턴을 단일 헬퍼로 표준화.
 *   호출처 = league_advancement / group_stage_with_ranking / group_stage_knockout / single_elim / dual / full_league_knockout
 *
 * @example
 *   const payload = buildPlaceholderMatchPayload({
 *     home: { kind: "group_rank", group: "A", rank: 1 },
 *     away: { kind: "group_rank", group: "B", rank: 1 },
 *   });
 *   // → { homeTeamId: null, awayTeamId: null,
 *   //     notes: "A조 1위 vs B조 1위",
 *   //     settings_partial: { homeSlotLabel: "A조 1위", awaySlotLabel: "B조 1위" } }
 */
export function buildPlaceholderMatchPayload(opts: {
  home: SlotLabelParams;
  away: SlotLabelParams;
}): {
  homeTeamId: null;
  awayTeamId: null;
  notes: string;
  settings_partial: { homeSlotLabel: string; awaySlotLabel: string };
} {
  const homeSlot = buildSlotLabel(opts.home);
  const awaySlot = buildSlotLabel(opts.away);
  return {
    homeTeamId: null,
    awayTeamId: null,
    notes: buildPlaceholderNotes(homeSlot, awaySlot),
    settings_partial: { homeSlotLabel: homeSlot, awaySlotLabel: awaySlot },
  };
}

/**
 * advanceDivisionPlaceholders 자동 채움 가능 여부 판정.
 *
 * 사유: G5.3 (league_advancement) + G5.4 (group_stage_with_ranking) generator 가 박제한 매치 중
 *   group_rank 슬롯만 standings 기반 자동 채움 가능 / 다른 kind 는 별도 진행.
 *
 * @returns true = group_rank vs group_rank 페어 (advanceDivisionPlaceholders 자동 채움 OK)
 *          false = 그 외 (수동 또는 별도 progression)
 */
export function isStandingsAutoFillable(home: SlotLabelParams, away: SlotLabelParams): boolean {
  return home.kind === "group_rank" && away.kind === "group_rank";
}

// ─────────────────────────────────────────────────────────────────────────
// PR-Admin-3 (2026-05-16) — placeholder 매치 위반 검출 (read-only)
// ─────────────────────────────────────────────────────────────────────────
//
// 사유:
//   강남구협회장배 (2026-05-15) = 순위전 매치 13건이 실팀으로 박혀버려 advance 자동 채움 불가.
//   본 함수 = matches-client.tsx 검증 배너 backing — admin 이 해당 케이스를 즉시 감지·경고할 수 있게 함.
//
// 검출 2 케이스:
//   1) format-violation = 강남구 사고 패턴 그대로
//      - roundName 가 "순위" 포함 (순위전 / 순위결정전 / 동순위전)
//      - AND home/away 중 1+ 가 실팀 박혀있음 (placeholder 의도 위반)
//      - AND notes 가 placeholder 형식 미준수 (parseSlotLabel null)
//   2) missing-slot-label = G7 후속 자동 fix 후보
//      - roundName 가 "순위" 포함
//      - AND settings.homeSlotLabel / awaySlotLabel 미박제
//      - 향후 generator 가 자동 박제하도록 G7 큐 진행 예정
//
// ⚠️ 본 함수는 read-only 검사 — DB 변경 0. 검출 결과는 UI 배너 + 운영자 수동 조치 가이드 용.

/**
 * "순위" 키워드 포함 — 순위결정전 / 순위전 / 동순위전 모두 매치.
 * 사유: roundName 표기가 generator 별로 다름 ("순위결정전" / "1위 동순위전" 등) — 단일 정규식 통과 보장.
 */
const RANKING_ROUND_REGEX = /순위/;

export function detectInvalidPlaceholderMatches(
  matches: Array<{
    id: string | number;
    roundName: string | null;
    homeTeamId: string | number | null;
    awayTeamId: string | number | null;
    notes: string | null;
    settings?: Record<string, unknown> | null;
  }>,
): Array<{ matchId: string | number; reason: "format-violation" | "missing-slot-label" }> {
  const violations: Array<{ matchId: string | number; reason: "format-violation" | "missing-slot-label" }> = [];

  for (const m of matches) {
    // 1) 순위전 매치만 검사 — 예선 등 일반 매치는 본 검증 대상 0
    if (!m.roundName || !RANKING_ROUND_REGEX.test(m.roundName)) continue;

    // 2) format-violation 우선 검사 (강남구 사고 패턴)
    //    - 실팀이 박혀있는데 (homeTeamId != null OR awayTeamId != null)
    //    - notes 가 placeholder 형식 미준수 (parseSlotLabel null)
    const hasRealTeam = m.homeTeamId !== null || m.awayTeamId !== null;
    const notesParsed = parseSlotLabel(m.notes);
    if (hasRealTeam && notesParsed === null) {
      violations.push({ matchId: m.id, reason: "format-violation" });
      continue; // format-violation 검출 시 missing-slot-label 중복 보고 skip
    }

    // 3) missing-slot-label 검사 (G7 후속 큐 후보)
    //    - settings.homeSlotLabel 또는 awaySlotLabel 미박제
    const settings = m.settings ?? null;
    const homeSlotLabel = settings?.homeSlotLabel as string | undefined;
    const awaySlotLabel = settings?.awaySlotLabel as string | undefined;
    if (!homeSlotLabel || !awaySlotLabel) {
      violations.push({ matchId: m.id, reason: "missing-slot-label" });
    }
  }

  return violations;
}
