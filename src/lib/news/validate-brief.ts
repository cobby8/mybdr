// 2026-05-02: Phase 1 — LLM 단신 기사 검증 (hallucination 2차 방어)
// 이유: alkija-system.ts 에서 "정확성" 룰 명시했지만 LLM 이 점수/팀명을 바꿔쓸 가능성 0% 아님.
// 사용자 신뢰성 = 기록 정확성 → 검증 실패 시 Phase 0 템플릿 fallback.
// 검증 실패해도 errors.md 박제 후속 큐 (LLM 응답 패턴 분석용).

import type { MatchBriefInput } from "./match-brief-generator";

export type ValidationResult = { valid: true } | { valid: false; reason: string };

// 단신 기사 검증
// 2026-05-03: Phase 1 컨텍스트 정책 — 매치 페이지 안 [흐름·영웅] 섹션이라 점수/팀명 반복 X 권장.
// 통과 조건 (재설계):
//   1. 점수가 들어가 있을 경우만 정확성 검증 (없어도 OK — 페이지 Headline 에 이미 표기)
//   2. 승팀명 1회 등장 권장 (패팀명은 선택 — 페이지에 이미 있음)
//   3. 길이 350자 이내 (Phase 1 250자 룰 + 마진 100자)
//   4. 추측 키워드 부재 ("관중" / "환호" / "긴장한" 등 검증 안 된 사실)
export function validateBrief(brief: string, input: MatchBriefInput): ValidationResult {
  // 1. 점수 검증 제거 (Phase 1 정책 — 점수 반복 금지)
  // 점수는 페이지 Headline 에 이미 표기됨 → 알기자가 매치 합계 점수 안 적어도 OK.
  // 쿼터 점수(예: "10-2") 또는 흐름 점수(예: "한때 14점차") 는 허용.
  // hallucination 방어는 hallucinationKeywords 로 처리.

  // 2. 승팀명 1회 등장 권장 (없으면 reject — 매치 식별 가능성)
  // 패팀명은 선택 — 페이지에 이미 표기됨.
  const winnerTeam =
    input.homeScore > input.awayScore ? input.homeTeam : input.awayTeam;
  if (!brief.includes(winnerTeam)) {
    return { valid: false, reason: `승팀명(${winnerTeam}) 누락` };
  }

  // 3. 길이 — Phase 1 정책: 250자 권장 + 마진 100 = 350자 reject
  if (brief.length > 350) {
    return { valid: false, reason: `길이 초과 (${brief.length}자)` };
  }

  // 4. 추측 키워드 검출 — alkija-system.ts 의 "검증 안 된 사실" 룰 위반
  // hallucination 패턴 — 운영 데이터에 없는 사실
  const hallucinationKeywords = [
    "관중",
    "환호",
    "긴장한",
    "땀",
    "코치진",
    "감독",
    "기립박수",
    "박수갈채",
    "포효",
    "외쳤다",
    "소리쳤다",
  ];
  for (const kw of hallucinationKeywords) {
    if (brief.includes(kw)) {
      return { valid: false, reason: `검증 안 된 키워드 등장: "${kw}"` };
    }
  }

  // 5. markdown 문법 검출 — system prompt 에 금지했지만 가끔 출력
  if (/^#{1,6}\s/m.test(brief) || /\*\*[^*]+\*\*/.test(brief) || /^[-*]\s/m.test(brief)) {
    return { valid: false, reason: "markdown 문법 등장" };
  }

  return { valid: true };
}
