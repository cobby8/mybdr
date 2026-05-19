/**
 * Vercel AI Gateway 클라이언트 래퍼 (Phase 1-B 박제 / 2026-05-19).
 *
 * 대회 요강 PDF/이미지 → Claude Sonnet 4 → ProspectusAnalysisResult JSON 분석.
 *
 * 박제 룰:
 * - AI SDK v6 `generateObject` 사용 → Zod schema 강제 응답
 * - Vercel AI Gateway 자동 라우팅: model = `"anthropic/claude-sonnet-4"` plain 문자열
 *   → `AI_GATEWAY_API_KEY` 환경변수 자동 픽업 (provider-specific 패키지 미사용 / Vercel 권장 패턴)
 * - 비용 가드: maxOutputTokens=2000 / 호출 측에서 input ≤ 30k 사전 컷 책임 (prompt.ts 명시)
 * - 에러 분리: AIAnalysisError(code) — UI 측 분기 (`schema_validation` / `timeout` / `auth` / `unknown`)
 * - audit 추적: usage (input/output/total tokens) + 처리시간(ms) + prompt_version 동반 반환
 *   → Phase 1-C prospectus_ai_analysis 테이블 박제 시 사용
 *
 * 의존: `ai` (v6.0.185 — 2026-05-19 설치) + `zod` (4.x). 외부 provider 패키지 0.
 * 참조 보고서: Dev/prospectus-ai-wizard-plan-2026-05-18.md §3 §4 §"developer 주의사항"
 */
import { generateObject } from "ai";
import {
  ProspectusAnalysisSchema,
  type ProspectusAnalysisResult,
} from "./prospectus-schema";
import {
  buildSystemPrompt,
  buildUserPrompt,
  MAX_OUTPUT_TOKENS,
  PROSPECTUS_PROMPT_VERSION,
} from "./prospectus-prompt";

// =============================================================================
// 모델 식별 — Vercel AI Gateway plain `"provider/model"` 문자열 (knowledge-update §1)
// =============================================================================
// Claude Sonnet 4 선택 사유 (보고서 §3):
// - 한국어 PDF 분석 정확도 검증됨 / vision input (이미지 요강) 지원 / cost-aware ($3/$15 per 1M tokens)
// - generateObject (structured output) 자체 지원 → schema 강제 통과율 높음
// 변경 시 audit log 영향 — prompt_version v1 + model 변경은 v2 bump 필수
const MODEL_ID = "anthropic/claude-sonnet-4" as const;

// =============================================================================
// 에러 분리 — UI 분기 가능한 코드 박제
// =============================================================================
export type AIAnalysisErrorCode =
  | "schema_validation" // AI 응답이 Zod schema 미통과 (재시도 가치 0)
  | "timeout" // gateway 응답 30s 초과 (재시도 가치 ⚠️)
  | "auth" // AI_GATEWAY_API_KEY 누락/오류 (운영자 결재 필요)
  | "rate_limit" // gateway 429 (재시도 가치 ✅ / backoff)
  | "unknown"; // 위 외 모든 에러

export class AIAnalysisError extends Error {
  readonly code: AIAnalysisErrorCode;
  readonly cause?: unknown;
  constructor(code: AIAnalysisErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "AIAnalysisError";
    this.code = code;
    this.cause = cause;
  }
}

// =============================================================================
// 입력 인터페이스
// =============================================================================
export type AnalyzeProspectusInput =
  | {
      source: "pdf";
      /** PDF 추출 텍스트 — 호출 측에서 ≤ 30k tokens 사전 컷 책임 (prompt.ts MAX_INPUT_TOKENS) */
      textContent: string;
      /** 원본 파일명 (audit 박제용 / null 가능) */
      fileName?: string | null;
    }
  | {
      source: "image";
      /** base64 인코딩된 이미지 (data URL 접두사 제외 / mime 별도) */
      imageBase64: string;
      /** "image/png" | "image/jpeg" | "image/webp" */
      mimeType: string;
      /** 원본 파일명 (audit 박제용 / null 가능) */
      fileName?: string | null;
    };

// =============================================================================
// 출력 인터페이스 — analysis + audit metadata
// =============================================================================
export interface AnalyzeProspectusResult {
  /** Zod schema 통과한 분석 결과 (필드별 confidence + source_excerpt 동반) */
  analysis: ProspectusAnalysisResult;
  /** 토큰 사용량 (cost log + audit 박제) — gateway 응답 없으면 null */
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
  /** 처리 시간 ms (gateway 호출 ~ schema 통과 완료) */
  durationMs: number;
  /** prompt 버전 (audit 추적) */
  promptVersion: string;
  /** 사용 모델 ID (audit 추적 / "anthropic/claude-sonnet-4") */
  modelId: string;
}

// =============================================================================
// 메인 함수 — analyzeProspectus
// =============================================================================
/**
 * 대회 요강 PDF 텍스트 또는 이미지를 Claude Sonnet 4 로 분석.
 *
 * 호출 측 책임:
 * - PDF: textContent ≤ 30k tokens 사전 컷 (불요부분 제외 — 신청서/참가팀 명단 등)
 * - image: base64 변환 + mimeType 정확히 박제
 * - AI_GATEWAY_API_KEY 환경변수 미설정 시 즉시 AIAnalysisError("auth") throw
 *
 * 응답 보장:
 * - analysis = ProspectusAnalysisSchema 통과 (Zod safeParse 통과 데이터)
 * - usage = 가능하면 토큰 수 / 불가하면 null
 * - durationMs = 호출 시작 ~ schema 통과 완료
 *
 * 에러 분기:
 * - schema 미통과 → AIAnalysisError("schema_validation")
 * - 30s 초과 → AIAnalysisError("timeout")
 * - 401/403 → AIAnalysisError("auth")
 * - 429 → AIAnalysisError("rate_limit")
 * - 그 외 → AIAnalysisError("unknown")
 */
export async function analyzeProspectus(
  input: AnalyzeProspectusInput,
): Promise<AnalyzeProspectusResult> {
  // 운영 가드: AI_GATEWAY_API_KEY 누락 시 호출 전 즉시 차단 (비용 0 / 명확한 에러)
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new AIAnalysisError(
      "auth",
      "AI_GATEWAY_API_KEY 환경변수 미설정 — Vercel AI Gateway 발급 후 .env 박제 필요",
    );
  }

  const startedAt = Date.now();
  const system = buildSystemPrompt();

  try {
    let result;

    if (input.source === "pdf") {
      // PDF 케이스: prompt string 단일 인자 (textContent 인라인)
      const prompt = buildUserPrompt({
        source: "pdf",
        textContent: input.textContent,
      });

      result = await generateObject({
        model: MODEL_ID,
        schema: ProspectusAnalysisSchema,
        system,
        prompt,
        // 비용 가드 — 출력 토큰 상한 (prompt.ts MAX_OUTPUT_TOKENS=2000)
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // gateway timeout — 30s (PDF 분석 평균 ~10s / 여유 3x)
        abortSignal: AbortSignal.timeout(30_000),
      });
    } else {
      // image 케이스: vision messages (text + image part)
      const instruction = buildUserPrompt({ source: "image" });

      result = await generateObject({
        model: MODEL_ID,
        schema: ProspectusAnalysisSchema,
        system,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              {
                type: "image",
                image: input.imageBase64,
                mediaType: input.mimeType,
              },
            ],
          },
        ],
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        abortSignal: AbortSignal.timeout(30_000),
      });
    }

    // generateObject 가 schema 통과 응답을 result.object 로 반환 (실패 시 throw)
    const analysis = result.object;
    const usage = result.usage;
    const durationMs = Date.now() - startedAt;

    return {
      analysis,
      usage: {
        inputTokens: usage?.inputTokens ?? null,
        outputTokens: usage?.outputTokens ?? null,
        totalTokens: usage?.totalTokens ?? null,
      },
      durationMs,
      promptVersion: PROSPECTUS_PROMPT_VERSION,
      modelId: MODEL_ID,
    };
  } catch (err) {
    // AI SDK 에러 → 우리 에러 코드로 매핑
    const code = mapErrorToCode(err);
    const message = err instanceof Error ? err.message : String(err);
    throw new AIAnalysisError(code, message, err);
  }
}

// =============================================================================
// 에러 매핑 — AI SDK / fetch / abort 에러를 AIAnalysisErrorCode 로 분류
// =============================================================================
function mapErrorToCode(err: unknown): AIAnalysisErrorCode {
  if (!(err instanceof Error)) return "unknown";

  // AbortSignal.timeout → DOMException("TimeoutError")
  if (err.name === "TimeoutError" || err.name === "AbortError") {
    return "timeout";
  }

  // AI SDK v6 에러 타입 (NoObjectGeneratedError / TypeValidationError) → schema 통과 실패
  // err.name 기반 휴리스틱 — SDK 내부 클래스명 변경 대비 'Validation' 포함 여부 체크
  if (
    err.name === "NoObjectGeneratedError" ||
    err.name === "TypeValidationError" ||
    err.message.includes("Validation") ||
    err.message.includes("schema")
  ) {
    return "schema_validation";
  }

  // HTTP status 추출 (AI SDK v6 ApiCallError 등에 status property 박제)
  const errObj = err as unknown as {
    status?: unknown;
    statusCode?: unknown;
  };
  const status =
    typeof errObj.status === "number"
      ? errObj.status
      : typeof errObj.statusCode === "number"
        ? errObj.statusCode
        : null;

  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";

  return "unknown";
}
