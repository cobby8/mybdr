/**
 * 서명 (Signatures) 관련 공유 타입 — Phase 5 (2026-05-12).
 *
 * 왜 (이유):
 *   FIBA PDF 양식 풋터 영역 박제 (Scorer / Assistant scorer / Timer / Shot clock operator
 *   + Referee / Umpire 1 / Umpire 2 + Captain's signature in case of protest) + 매치 노트.
 *   FooterSignatures (client) + ScoreSheetForm (client) + BFF submit (server) + vitest
 *   사이에서 공유되는 데이터 모델. Phase 4 timeout-types.ts 와 동일 패턴 (server-safe).
 *
 * 박제 위치:
 *   - match.settings.signatures JSON (Phase 4 settings.timeouts merge 패턴 재사용)
 *   - match.settings.notes JSON (TournamentMatch.notes 컬럼 별도 존재하지만 settings 일관성)
 *   - schema 변경 0
 *
 * 방법 (어떻게):
 *   - 8 입력 = string (서명 = 텍스트 입력 / 사용자 결재 §2 Phase 1 §4 (a))
 *   - 길이 제한 = 50자 (captainSignature 만 100자 — 항의 상황 단문 메모 허용)
 *   - notes = 500자 (textarea)
 *   - 헤더 (FibaHeader) 의 referee / umpire1 / umpire2 와 풋터의 refereeSign / umpire1Sign /
 *     umpire2Sign 는 별개 박제. 헤더 = 경기 시작 전 정보 / 풋터 = 종료 후 서명 공간 (FIBA 양식 정합).
 *   - UX: FooterSignatures 마운트 시 헤더 값을 풋터 초기값으로 prefill (자동) — 사용자가 풋터를
 *     수정하면 dirty flag 박제 → 이후 헤더 변경은 풋터에 미반영 (사용자 의도 보존).
 */

// 서명 입력 8 필드 + 노트 — SignaturesState
//
// FIBA PDF 양식 풋터 영역 정합:
//   좌측 — Scorer / Assistant scorer / Timer / Shot clock operator
//   우측 — Referee / Umpire 1 / Umpire 2
//   하단 — Captain's signature in case of protest
export interface SignaturesState {
  // 좌측 (운영자 측 — 기록 담당자)
  scorer: string;
  asstScorer: string;
  timer: string;
  shotClockOperator: string;
  // 우측 (심판진 — FIBA 양식 풋터는 헤더와 별개 박제)
  refereeSign: string;
  umpire1Sign: string;
  umpire2Sign: string;
  // 하단 (선수 측 — 항의 시에만 박제)
  captainSignature: string;
  // 매치 노트 (선택 — 부상 / 사고 / 특이사항)
  notes: string;
}

// 빈 상태 — 컴포넌트 초기값 + draft 복원 실패 시 fallback
export const EMPTY_SIGNATURES: SignaturesState = {
  scorer: "",
  asstScorer: "",
  timer: "",
  shotClockOperator: "",
  refereeSign: "",
  umpire1Sign: "",
  umpire2Sign: "",
  captainSignature: "",
  notes: "",
};

// 입력 길이 제한 — zod schema 와 일관 (BFF submit route schema 참조)
export const SIGNATURE_MAX_LENGTH = 50;
// 주장 서명은 항의 상황 단문 메모 — 사유 / 항의 내용 약식 박제 위해 100자 허용
export const CAPTAIN_SIGNATURE_MAX_LENGTH = 100;
// 매치 노트 — 부상 / 사고 / 특이사항 약식 박제 위해 500자
export const NOTES_MAX_LENGTH = 500;
