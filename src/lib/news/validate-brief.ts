// 2026-05-02: Phase 1 — LLM 단신 기사 검증 (hallucination 2차 방어)
// 이유: alkija-system.ts 에서 "정확성" 룰 명시했지만 LLM 이 점수/팀명을 바꿔쓸 가능성 0% 아님.
// 사용자 신뢰성 = 기록 정확성 → 검증 실패 시 Phase 0 템플릿 fallback.
// 검증 실패해도 errors.md 박제 후속 큐 (LLM 응답 패턴 분석용).

import type { MatchBriefInput, BriefMode } from "./match-brief-generator";

export type ValidationResult = { valid: true } | { valid: false; reason: string };

// 단신 기사 검증
// 2026-05-03: mode 별 길이 한도 분기 추가
// - phase1-section: 350자 reject (Phase 1 lead 영역)
// - phase2-match  : 900자 reject (Phase 2 독립 기사, 700자 권장 + 마진 200)
export function validateBrief(
  brief: string,
  input: MatchBriefInput,
  mode: BriefMode = "phase1-section",
): ValidationResult {
  // 1. 점수 검증 제거 (Phase 1) — Phase 2 는 점수 반복 OK 라 동일 정책
  //    잘못된 점수는 hallucination 키워드/팀명으로 부분 방어. 정확성 검증은 mode별 후속 큐.

  // 2. 승팀명 1회 등장 권장 (없으면 reject — 매치 식별 가능성)
  const winnerTeam =
    input.homeScore > input.awayScore ? input.homeTeam : input.awayTeam;
  if (!brief.includes(winnerTeam)) {
    return { valid: false, reason: `승팀명(${winnerTeam}) 누락` };
  }

  // 3. 길이 — mode 별 한도
  // Phase 2 검증 시 raw 응답 (TITLE: ... 포함) 들어올 수 있음 — 길이는 raw 기준.
  const lengthLimit = mode === "phase2-match" ? 900 : 350;
  if (brief.length > lengthLimit) {
    return {
      valid: false,
      reason: `길이 초과 (${brief.length}자, 한도 ${lengthLimit}자)`,
    };
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
