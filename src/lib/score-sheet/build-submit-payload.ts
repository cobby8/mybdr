/**
 * buildSubmitPayload — score-sheet submit BFF 페이로드 빌더.
 *
 * 2026-05-15 (PR-D / P2-7) — 전수조사 P2-7 추출.
 *   이전: score-sheet-form.tsx 안 클로저 함수 (80줄). state 12개 클로저 참조.
 *   현재: 외부 순수 함수 — 모든 의존성 인자로 받음. vitest 단위 검증 가능.
 *
 * 박제 룰 (보존 의무):
 *   - submit BFF 의 zod schema 와 1:1 정합 (src/app/api/web/score-sheet/[matchId]/submit/route.ts).
 *   - quarter_scores / final score = computeFinalScore + toQuarterScoresJson 위임.
 *   - signatures = 빈 객체면 통째 생략 (전송 부하 최소화 + BFF zod optional).
 *   - lineup = null 이면 키 자체 생략 (BFF upsert skip).
 *   - edit_mode = true 시만 박제 (BFF MATCH_LOCKED 423 우회 신호 — PR-EDIT3).
 *   - referee_main/sub1/sub2 = 빈 문자열은 undefined (BFF 가 overwrite skip).
 *   - notes = 빈 문자열은 undefined (BFF 별도 update flow).
 */

import {
  computeFinalScore,
  toQuarterScoresJson,
} from "./running-score-helpers";
import type { RunningScoreState } from "./running-score-types";
import type { TeamLineupSelection } from "@/app/(score-sheet)/score-sheet/[matchId]/_components/lineup-selection-modal";

// FibaHeader values (referee/umpire1/umpire2)
interface HeaderInputs {
  referee: string;
  umpire1: string;
  umpire2: string;
}

// FooterSignatures values
interface SignaturesInputs {
  scorer?: string;
  asstScorer?: string;
  timer?: string;
  shotClockOperator?: string;
  refereeSign?: string;
  umpire1Sign?: string;
  umpire2Sign?: string;
  captainSignature?: string;
  notes?: string;
}

// BFF 가 그대로 받아서 검증 — 본 함수는 통과만 시킴 (any 명시적 회피 위해 unknown)
type PassThrough = unknown;

export interface BuildSubmitPayloadParams {
  runningScore: RunningScoreState;
  fouls: PassThrough;
  timeouts: PassThrough;
  playerStats: PassThrough;
  signatures: SignaturesInputs;
  header: HeaderInputs;
  lineup: {
    home: TeamLineupSelection;
    away: TeamLineupSelection;
  } | null;
  /** 수정 모드 = BFF MATCH_LOCKED 423 우회 (PR-EDIT3 Q8). */
  isEditMode: boolean;
  /**
   * 2026-05-16 (PR-Possession-3) — 공격권 (Possession Arrow) BFF 전달.
   *   openingJumpBall === null = 미박제 = 키 통째 생략 (BFF optional 처리).
   *   submit/route.ts 의 possessionSchema 와 1:1 정합.
   */
  possession?: PassThrough;
  /**
   * 2026-05-16 (긴급 박제 — 전후반 모드 / 사용자 보고 이미지 #160) — period_format DB 박제.
   *
   *   왜 (이유):
   *     halves 모드 매치 (강남구 i3 등) 운영 시 = 라이브 페이지가 quarter 라벨을 "전반/후반/OT1+"
   *     로 분기해야 함. localStorage 만으로는 다른 사용자 (관전자) 라이브 페이지 보존 불가.
   *     → DB match.settings.period_format JSON 키에 박제 → 라이브 API 응답 → 라이브 페이지 분기.
   *
   *   미전달 = 키 통째 생략 (BFF settings 미갱신 — 기존 동작 보존 / 4쿼터 매치 영향 0).
   *   "quarters" = 기본값 일치 (생략 가능하지만 명시 박제로 명확화 — 라이브 페이지 분기 안전망).
   *   "halves" = 라이브 페이지 라벨 분기 트리거.
   */
  periodFormat?: "halves" | "quarters";
}

export function buildSubmitPayload(params: BuildSubmitPayloadParams): unknown {
  const {
    runningScore,
    fouls,
    timeouts,
    playerStats,
    signatures,
    header,
    lineup,
    isEditMode,
    possession,
    // 2026-05-16 (긴급 박제 — 전후반 모드) — period_format 박제 (halves/quarters).
    periodFormat,
  } = params;

  const final = computeFinalScore(runningScore);
  const quarterScores = toQuarterScoresJson(runningScore);

  const hasAnySig =
    signatures.scorer ||
    signatures.asstScorer ||
    signatures.timer ||
    signatures.shotClockOperator ||
    signatures.refereeSign ||
    signatures.umpire1Sign ||
    signatures.umpire2Sign ||
    signatures.captainSignature;

  return {
    home_score: final.homeTotal,
    away_score: final.awayTotal,
    quarter_scores: quarterScores,
    running_score: runningScore,
    fouls,
    timeouts,
    player_stats_input: playerStats,
    ...(hasAnySig
      ? {
          signatures: {
            scorer: signatures.scorer || undefined,
            asstScorer: signatures.asstScorer || undefined,
            timer: signatures.timer || undefined,
            shotClockOperator: signatures.shotClockOperator || undefined,
            refereeSign: signatures.refereeSign || undefined,
            umpire1Sign: signatures.umpire1Sign || undefined,
            umpire2Sign: signatures.umpire2Sign || undefined,
            captainSignature: signatures.captainSignature || undefined,
          },
        }
      : {}),
    ...(lineup
      ? {
          lineup: {
            home: {
              starters: lineup.home.starters,
              substitutes: lineup.home.substitutes,
            },
            away: {
              starters: lineup.away.starters,
              substitutes: lineup.away.substitutes,
            },
          },
        }
      : {}),
    status: "completed" as const,
    referee_main: header.referee || undefined,
    referee_sub1: header.umpire1 || undefined,
    referee_sub2: header.umpire2 || undefined,
    notes: signatures.notes || undefined,
    ...(isEditMode ? { edit_mode: true } : {}),
    /* 2026-05-16 (PR-Possession-3) — possession 박제 (openingJumpBall !== null 시만). */
    ...(possession ? { possession } : {}),
    /* 2026-05-16 (긴급 박제 — 전후반 모드 / 사용자 보고 이미지 #160) — period_format 박제.
       미전달 = 키 통째 생략 (BFF settings 미갱신 — 기존 동작 보존). */
    ...(periodFormat ? { period_format: periodFormat } : {}),
  };
}
