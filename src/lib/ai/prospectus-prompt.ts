/**
 * 대회 요강 AI 분석 prompt 빌더 (Phase 1 / 의존성 0 박제).
 *
 * Vercel AI Gateway → Claude Sonnet 4 호출 시 system / user prompt 박제.
 *
 * 박제 룰:
 * - 한국어 (요강 = 한국어 PDF 대부분)
 * - FIBA 5x5 농구 + 한국 3x3 농구 도메인 인지
 * - JSON 형식 강제 (generateObject schema 가 강제하지만 prompt 에도 명시)
 * - 각 leaf 필드 `_confidence` + `_source_excerpt` 의무 박제 (prospectus-schema.ts 정합)
 * - 정확도 우선 — 모르면 null + confidence 0 (보고서 §"developer 주의사항" §5)
 * - 비용 가드: input ≤ 30k / output ≤ 2k tokens (보고서 §"developer 주의사항" §6)
 *
 * 의존: 없음 (plain string builder).
 * 참조 보고서: Dev/prospectus-ai-wizard-plan-2026-05-18.md §3 §4 §"developer 주의사항"
 */

/**
 * Prompt 버전 — prompt 변경 시 bump (DB.prompt_version 박제 → audit 추적).
 * v1: 초기 박제 (2026-05-19). few-shot 0건 — Phase 2 사용자 샘플 PDF 도착 시 v2 로 bump 예정.
 */
export const PROSPECTUS_PROMPT_VERSION = "v1";

/** AI Gateway 호출 시 max_tokens 상한 — 비용 폭주 가드 (보고서 §5 비용 가드) */
export const MAX_INPUT_TOKENS = 30_000;
// 2026-05-20 fix 3: 2000 → 4000. 한국어 25+ leaf 필드 + 각 필드 _confidence + _source_excerpt suffix 2종
//   → JSON 직렬화 시 2000 토큰 빠듯 → 응답 잘림 → schema 미통과 가설. 보험 차원 2배 상향 (비용 영향 ≤2배).
export const MAX_OUTPUT_TOKENS = 4_000;

/**
 * System prompt — AI 역할 + 출력 규칙 + 도메인 인지.
 *
 * Vercel AI Gateway `generateObject` 의 system 파라미터로 전달.
 * 본 prompt 만으로 ProspectusAnalysisSchema 형식 강제 가능 (schema 인자와 중복 박제 의도 — 가드 강화).
 */
export function buildSystemPrompt(): string {
  return `당신은 한국 농구 대회(FIBA 5x5 / 3x3) 요강 PDF/이미지를 분석하여 구조화된 JSON 으로 출력하는 전문가입니다.

## 출력 형식 (필수)
schedule / team / registration / meta 4 그룹의 leaf 필드를 추출하세요. 각 leaf 필드 옆에 반드시 다음 2 항목 동반:
- \`<필드명>_confidence\`: 0.0 ~ 1.0 (본 필드 추출 신뢰도 / 원문 명확 = 1.0 / 추측 = 0.5 / 부재 = 0.0)
- \`<필드명>_source_excerpt\`: 원문 발췌 (최대 200자 / 정확한 근거 문장 / 없으면 null)

## 정확도 원칙 (절대 위반 금지)
- 원문에 명시되지 않은 정보는 절대 추측 ❌ → 해당 필드 = null, confidence = 0
- **단, 명시된 정보는 적극 추출** (2026-05-20 fix 3 강화):
  - "5월 16일(토) ~ 17일(일)" → startDate=2026-05-16 / endDate=2026-05-17 (현재 연도 또는 인접 추론) / confidence=0.85
  - "예선: 5/16, 결승: 5/17" → startDate=2026-05-16 / endDate=2026-05-17 / confidence=0.85
  - "신청기간: 4/15 ~ 5/10" → registrationStartAt + registrationEndAt 동일 패턴 박제 / confidence=0.85
  - "장소: ○○체육관" → venueName 박제 / confidence=0.9
- 한국어 날짜 표기 ("2026년 5월 17일" / "5/17" / "5월 17일") → ISO 8601 ("2026-05-17") 변환
- 한국어 시간 표기 ("오전 9시" / "09:00") → ISO datetime ("2026-05-17T09:00:00+09:00") 변환
- 금액 단위 ("5만원" / "50,000원") → 정수 KRW (50000)
- 한국 광역시·도 ("서울" / "서울특별시") → city 필드 = "서울특별시" (정규 표기)

## 필드 누락 금지 (가장 중요)
- **모든 leaf 필드는 반드시 응답에 포함** (key 자체 누락 ❌)
- 정보 없으면: value=null + confidence=0 + source_excerpt=null 박제 (key는 반드시 존재)
- 각 leaf 필드별 _confidence + _source_excerpt suffix 반드시 동반 (1세트 = 3 key)
- 예시 (좋음):
  - "startDate": null, "startDate_confidence": 0, "startDate_source_excerpt": null  ✅
- 예시 (나쁨 — schema 통과 실패):
  - "startDate": null  (suffix 누락) ❌
  - {} (startDate 키 자체 누락) ❌

## 도메인 인지
- 종별 (divisions) = 연령/성별/실력 분류 예시:
  - 연령: "U10", "U12", "U14", "초등부", "중등부", "고등부"
  - 성별: "남자부", "여자부", "혼성부"
  - 실력: "일반부", "엘리트부", "동호인부"
- 종별별 참가비 (feeKrw) + 정원 (cap) 박제. 단일 종별 = divisions 빈 배열 OK
- 대회 방식 (format) 추측:
  - "single_elimination" = 단일 토너먼트
  - "double_elimination" = 더블 엘리미네이션
  - "dual_tournament" = 듀얼 토너먼트 (조별 → 16팀 결승)
  - "full_league_knockout" = 풀리그 + 토너먼트
  - "group_stage_with_ranking" = 조별리그 + 순위결정전
  - "league_advancement" = 풀리그
  - 명확하지 않으면 null (추측 ❌)
- 입금 정보 (bankName / bankAccount / bankHolder) — 없으면 모두 null

## 비용 가드
- 출력 토큰 ≤ 2,000 (간결한 발췌 / 불필요한 설명 ❌)
- 입력 토큰 ≤ 30,000 (PDF 본문이 길면 요강 핵심 부분만 분석 / 신청서 양식 / 참가팀 명단 제외)

## 최종 검증
- 모든 leaf 필드에 _confidence + _source_excerpt 박제됐는가?
- 추측한 값은 confidence ≤ 0.6 박제했는가?
- 원문 발췌 ≤ 200자 준수했는가?
`;
}

/**
 * User prompt builder 입력.
 */
export interface BuildUserPromptInput {
  /** "pdf" = textContent 인라인 / "image" = vision input (gateway 측 별도 첨부) */
  source: "pdf" | "image";
  /** pdf 케이스 — PDF 추출 텍스트 (≤ 30k tokens 분량으로 사전 컷) */
  textContent?: string;
}

/**
 * User prompt builder — PDF 텍스트 또는 이미지 instruction.
 *
 * pdf 케이스: textContent 인라인 박제 (max 30k tokens — 호출 측 사전 컷 책임)
 * image 케이스: instruction 만 (이미지 첨부는 gateway 측 messages 의 image content 로 별도)
 */
export function buildUserPrompt(input: BuildUserPromptInput): string {
  const header = `다음 농구 대회 요강을 분석하여 ProspectusAnalysisResult JSON 형식으로 출력하세요.

원칙:
- 모르는 필드는 null + confidence 0
- 각 leaf 필드별 _confidence + _source_excerpt 의무 박제
- 종별 (divisions) 가 여러 개면 배열로 모두 박제 (단일이면 빈 배열)
- 추측 ❌ — 원문 근거 없는 값은 null

---
`;

  if (input.source === "pdf") {
    const text = input.textContent ?? "";
    return `${header}
[PDF 추출 텍스트]
${text}
`;
  }

  // image 케이스: instruction 만 (이미지 자체는 gateway 측 vision input 으로 별도 첨부)
  return `${header}
[이미지 첨부 — 위 첨부 이미지의 농구 대회 요강을 분석하세요]
`;
}

// TODO Phase 2: 사용자 샘플 PDF (강남구협회장배 / 열혈농구단 / U12) 도착 시
//   buildFewShotMessages() 함수 추가 + AI Gateway messages 배열에 prepend.
//   prompt_version "v1" → "v2" bump 후 audit 추적.
