// 2026-05-02: Phase 1 — Gemini 2.5 Flash 클라이언트 (BDR NEWS / 알기자)
// 이유: Google 공식 신규 SDK `@google/genai` 사용 (구 `@google/generative-ai` 는 deprecated).
// 무료 tier 1500 RPD — 운영 평소 360 호출 + 캐시로 충분.
// 호출자 = generateText(systemPrompt, userPrompt) 단일 함수 — 단신 기사 생성 외 용도 없음.
//
// 환경 변수 GEMINI_API_KEY 미설정 시 → 호출 시점에 throw → 상위에서 fallback 처리.
// 모듈 로드 시 throw X (Vercel build 실패 회피).

import { GoogleGenAI } from "@google/genai";

// 모델명 — Gemini 2.5 Flash (사용자 결정)
// 'gemini-2.5-flash' 가 alias / 'gemini-2.5-flash-latest' 는 항상 최신 stable 가리킴.
// 운영 안정성 우선 → fixed alias 사용.
const MODEL_NAME = "gemini-2.5-flash";

// 클라이언트 lazy init — apiKey 없으면 호출 시점에 throw
let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 미설정 — .env 에 추가 필요");
  }
  _client = new GoogleGenAI({ apiKey });
  return _client;
}

// 단신 기사 생성용 텍스트 호출
// systemPrompt: 알기자 페르소나 + 톤 룰 (alkija-system.ts)
// userPrompt:   매치 데이터 → user prompt (match-brief-generator.ts)
// 반환:         LLM 생성 텍스트 (trim 처리)
// throw:        API 키 미설정 / 네트워크 에러 / 안전 필터 차단 → 상위에서 catch
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      // 단신 기사 톤 — 다양성 약간 (0.7)
      temperature: 0.7,
      // 2.5 Flash 는 기본 "thinking" 모드 ON → thinking tokens 가 maxOutputTokens 를 차지함.
      // 단신 기사 (300자) 에 thinking 불필요 → thinkingBudget=0 으로 비활성.
      // maxOutputTokens=1024 (한글 300자 ≈ 600 토큰 + 마진).
      maxOutputTokens: 1024,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  });

  // SDK 1.x 응답에서 text 추출. 안전 필터 차단 시 text=빈 문자열 → throw
  const text = response.text?.trim() ?? "";
  if (!text) {
    throw new Error("Gemini 응답이 비어있음 (안전 필터 차단 가능성)");
  }
  return text;
}
