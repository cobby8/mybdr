// 2026-05-02: Phase 1 — LLM 단신 기사 검증 (hallucination 2차 방어)
// 이유: alkija-system.ts 에서 "정확성" 룰 명시했지만 LLM 이 점수/팀명을 바꿔쓸 가능성 0% 아님.
// 사용자 신뢰성 = 기록 정확성 → 검증 실패 시 Phase 0 템플릿 fallback.
// 검증 실패해도 errors.md 박제 후속 큐 (LLM 응답 패턴 분석용).

import type { MatchBriefInput } from "./match-brief-generator";

export type ValidationResult = { valid: true } | { valid: false; reason: string };

// 단신 기사 검증
// 통과 조건:
//   1. 점수 등장 — "{home}-{away}" 또는 "{away}-{home}" 패턴 (공백 허용)
//   2. 양 팀명 모두 등장 (정확 일치)
//   3. 길이 400자 이내 (LLM 가끔 maxOutputTokens 초과)
//   4. 추측 키워드 부재 ("관중" / "환호" / "긴장한" 등 검증 안 된 사실)
export function validateBrief(brief: string, input: MatchBriefInput): ValidationResult {
  // 1. 점수 정확성 — 공백 허용 패턴
  // 예: "55-43", "55 - 43", "55:43" 모두 통과
  const expectedScores = [
    `${input.homeScore}-${input.awayScore}`,
    `${input.awayScore}-${input.homeScore}`,
    `${input.homeScore} - ${input.awayScore}`,
    `${input.awayScore} - ${input.homeScore}`,
    `${input.homeScore}:${input.awayScore}`,
    `${input.awayScore}:${input.homeScore}`,
  ];
  const hasScore = expectedScores.some((s) => brief.includes(s));
  if (!hasScore) {
    return { valid: false, reason: `점수(${input.homeScore}-${input.awayScore}) 누락` };
  }

  // 2. 양 팀명 등장 — 정확 일치 (LLM 이 팀명 변형 시 차단)
  if (!brief.includes(input.homeTeam)) {
    return { valid: false, reason: `홈팀명(${input.homeTeam}) 누락` };
  }
  if (!brief.includes(input.awayTeam)) {
    return { valid: false, reason: `어웨이팀명(${input.awayTeam}) 누락` };
  }

  // 3. 길이 — 한글 + 공백 + 구두점 합계 400자 이내
  // 시안 300자 + 마진 100자. 너무 길면 단신 톤 이탈.
  if (brief.length > 400) {
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
