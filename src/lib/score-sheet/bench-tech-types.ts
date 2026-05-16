/**
 * Bench Technical (B / C) + Delay of Game (W / T) 공유 타입.
 *
 * 2026-05-16 (긴급 박제 — FIBA 정확 룰 / 사용자 결재 권장안 100%).
 *
 * 왜 (이유):
 *   FIBA Article 36 + Article 17.2.6 / Article 36.2.3 — 코치 / 어시스턴트 / 벤치 인원
 *   기술 파울 + 팀 단위 지연 위반. 기존 player fouls (P/T/U/D) 와 별도 운영 (대상 = 코치 /
 *   팀 단위 → player row 미박제). team-section.tsx (client) + score-sheet-form.tsx (client) +
 *   bench-tech-modal (client) + BFF submit (server) + vitest 단위 검증 사이 공유.
 *
 * 룰 (FIBA 정확):
 *   - Bench Technical (B) — Article 36.4:
 *       대상 = Assistant Coach / Substitute / Team Follower 위반.
 *       기록 = Coach 개인 통계에 박제 (Head Coach 책임).
 *       표기 = "B".
 *   - Coach Technical (C) — Article 36.3:
 *       대상 = Head Coach 본인 직접 위반.
 *       표기 = "C".
 *   - 추방 룰 (Head Coach):
 *       C × 2                = 추방
 *       C × 1 + B × 2 (= 3)  = 추방
 *       B × 3       (= 3)    = 추방
 *     ⇒ Head Coach 박제 cells 누적 3건 = 추방 (C/B 종류 무관 합산).
 *   - Asst Coach 자체 추방 = 없음 (B 박제는 Head Coach 누적에 합산되므로 본 인터페이스는
 *     "어떤 코치가 위반했는지" 만 기록 — Head Coach 통계에 박제).
 *   - Delay of Game — Article 36.2.3:
 *       1차 위반 = 경고 (W) — 점수 변동 0 (매치당 1회만).
 *       2차 위반+ = 테크니컬 파울 (T) — 상대 자유투 1개 + half-court extended line throw-in.
 *       팀 단위 박제 (개인 X).
 *
 * 처벌 (T / B / C / Delay-T):
 *   = 상대 자유투 1개 + half-court extended line throw-in.
 *   자유투 슈터 = 상대 팀 Captain 또는 Coach 가 임의 선택 (= 운영자 수동 박제).
 *   본 시스템 = UI 모달 X (사용자 결재 Q3) — 운영자가 Running Score 영역에서 별도 1점 마킹.
 *
 * 데이터 모델 (사용자 결재 옵션 D 혼합):
 *   - settings.bench_technicals JSON snapshot = 현재 상태 (운영자 빠른 조회 + 추방 가드).
 *   - settings.delay_of_game JSON snapshot.
 *   - PBP action_subtype 신규 (B_HEAD / B_BENCH / C / DELAY_W / DELAY_T) = 이벤트 이력 (감사용).
 */

/** 코치 위반 박제 항목 (Head Coach 통계에 누적). */
export interface CoachFoulEntry {
  /**
   * 위반 종류 (사용자 결재 권장안 — FIBA Article 36.3 / 36.4 정확 구분).
   *   - "C"       = Coach Technical (Head Coach 본인 위반)
   *   - "B_HEAD"  = Head Coach 본인 위반 (B 박제 — 표기는 "B" 지만 Head 책임)
   *   - "B_BENCH" = Bench Technical (어시스턴트 / 서브스티튜트 / 팔로워 위반 — Head 통계 가산)
   */
  kind: "C" | "B_HEAD" | "B_BENCH";
  /** 박제 시점 period (1=Q1 / 5+=OT). 모달 open 시 currentPeriod 자동 박제. */
  period: number;
}

/** 한 팀의 코치 위반 누적 (Head Coach 책임 통계). */
export interface TeamBenchTechnicalState {
  /**
   * Head Coach 통계 누적 (C + B_HEAD + B_BENCH 합산 = 코치 추방 가드).
   * 사용자 결재 Q1 = 3 cell 고정 (4번째 박제 = cell disabled + 추방 toast).
   * 운영 안전 룰: max 3 cells UI 표시 — 그 이상은 운영자가 직접 settings JSON 편집 시
   *   3 이상으로 박제 가능하지만 UI는 cell disabled (추가 박제 차단).
   */
  head: CoachFoulEntry[];
  /**
   * Assistant Coach 통계 — 본 시스템은 Head 책임 룰 정합 위해 Asst 별도 박제 X.
   * Asst Coach 위반은 모달에서 "어시 인계" 라디오 선택 시 head 의 kind="B_BENCH" 로 박제.
   * 본 필드 = 호환성 보존용 (구버전 draft / 향후 분리 박제 대비) — 현재 [] 고정.
   */
  assistant: CoachFoulEntry[];
}

/** 양 팀의 벤치 테크니컬 state. */
export interface BenchTechnicalState {
  home: TeamBenchTechnicalState;
  away: TeamBenchTechnicalState;
}

/** 한 팀의 지연 위반 상태 (Article 36.2.3 매치당 W 1회 + T 누적). */
export interface TeamDelayOfGameState {
  /** 1차 W 박제 후 true — 이후 클릭 = T 자동 분기. */
  warned: boolean;
  /** T 박제 누적 (W 박제 후 2차+ 클릭마다 +1). */
  technicals: number;
}

/** 양 팀의 지연 위반 state. */
export interface DelayOfGameState {
  home: TeamDelayOfGameState;
  away: TeamDelayOfGameState;
}

/** EMPTY snapshot — useState 초기값 / draft 복원 실패 시 fallback. */
export const EMPTY_BENCH_TECHNICAL: BenchTechnicalState = {
  home: { head: [], assistant: [] },
  away: { head: [], assistant: [] },
};

export const EMPTY_DELAY_OF_GAME: DelayOfGameState = {
  home: { warned: false, technicals: 0 },
  away: { warned: false, technicals: 0 },
};

/** Head Coach 추방 임계값 (사용자 결재 권장안 = 누적 3건). */
export const HEAD_COACH_EJECT_THRESHOLD = 3;

/** Coach Fouls UI cell 개수 (사용자 결재 Q1 = 3 cell 고정). */
export const COACH_FOULS_CELL_COUNT = 3;

/**
 * 사용자 결재 권장안 — UI 모달 종류 선택용 라디오 옵션.
 *   - C       = Head Coach 본인 위반 (라벨 "Head Coach 위반 / C")
 *   - B_HEAD  = Head Coach 본인 B (라벨 "Head Coach B 파울")
 *   - B_BENCH = Asst Coach / 벤치 인원 위반 (라벨 "Asst Coach 또는 벤치 / B")
 *
 * 모달 UX = 라디오 3 옵션. 박제 후 모두 home.head 또는 away.head 에 push (단일 source).
 */
export type CoachFoulKind = CoachFoulEntry["kind"];

/** 코치 위반 한글 라벨 (UI alert + description + PBP description 박제용). */
export const COACH_FOUL_KIND_LABEL: Record<CoachFoulKind, string> = {
  C: "Coach T (Head)",
  B_HEAD: "Bench T (Head)",
  B_BENCH: "Bench T (Asst/벤치)",
};

/** PBP action_subtype 박제용 약자 (BFF submit 시 사용). */
export const COACH_FOUL_KIND_SUBTYPE: Record<CoachFoulKind, string> = {
  C: "C",
  B_HEAD: "B_HEAD",
  B_BENCH: "B_BENCH",
};
