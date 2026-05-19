/**
 * POST /api/web/tournaments/wizard/analyze-prospectus (Phase 2 박제 2026-05-20)
 *
 * 대회 요강 PDF / 이미지 업로드 → Claude Sonnet 4 분석 → ProspectusAnalysisResult 반환.
 * wizard 진입 전 사전 분석 endpoint — Phase 3 UI 박제 시 호출처 추가.
 *
 * 가드 다층 (보고서 §5 보안 + 운영):
 *   1. getWebSession() → 로그인 필수
 *   2. 권한 = super_admin OR organization admin/owner 1건 이상 (`canManageTournament` 와 동일 패턴 / 대회 ID 부재로 organization 단위)
 *   3. RATE_LIMITS.aiAnalyze 분당 5건 (Upstash slidingWindow)
 *   4. DB count 일 20건 한도 (`prospectus_ai_analysis` 본인 user_id created_at >= 24h)
 *   5. multipart/form-data:
 *      - file size ≤ 10MB
 *      - MIME 화이트리스트 (PDF / PNG / JPEG)
 *      - magic bytes (`file-type`) — MIME spoofing 차단
 *   6. PDF → `pdf-parse` 텍스트 추출 (≤ 100k chars ≈ 30k tokens 사전 컷)
 *      image → base64 변환 (vision input)
 *   7. `analyzeProspectus()` (gateway.ts) 호출 → schema 통과 응답
 *   8. audit INSERT (`prospectus_ai_analysis` / status: completed | failed)
 *
 * 응답:
 *   200 = { analysis_id: string, payload: ProspectusAnalysisResult } (snake_case 자동)
 *   401 = 미로그인
 *   403 = 운영자 권한 없음
 *   422 = 파일 검증 실패 (크기 / MIME / magic bytes / PDF 파싱 / 텍스트 0)
 *   429 = rate limit (분 5건 또는 일 20건)
 *   500/502/503/504 = AI 호출 실패 (분기: AI_AUTH / AI_TIMEOUT / AI_RATE_LIMIT / AI_SCHEMA / AI_UNKNOWN)
 *
 * 회귀 영향: 0 (신규 폴더 / 기존 API 변경 0 / 호출처 0 Phase 3 박제 후 활성화)
 * 참조 보고서: Dev/prospectus-ai-wizard-plan-2026-05-18.md §3 §5
 */

import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";
import {
  apiSuccess,
  apiError,
  unauthorized,
  forbidden,
  rateLimited,
  validationError,
} from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { fileTypeFromBuffer } from "file-type";
import {
  analyzeProspectus,
  AIAnalysisError,
  type AnalyzeProspectusInput,
} from "@/lib/ai/gateway";
import type { Prisma } from "@prisma/client";

// =============================================================================
// 상수
// =============================================================================
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];
const DAILY_LIMIT = 20;

// 30k tokens 사전 컷 — 한글/영어 평균 1 token ≈ 2~3 chars → 30k tokens ≈ 100k chars (안전선).
// pdf-parse 출력 후 substring 컷. gateway.ts MAX_INPUT_TOKENS=30000 와 정합.
const MAX_PDF_TEXT_CHARS = 100_000;

// PDF 텍스트 최소 길이 — 50자 미만 = 스캔본 PDF 또는 추출 실패 시그널 (사용자에게 image 업로드 권장 안내)
const MIN_PDF_TEXT_CHARS = 50;

// =============================================================================
// POST handler
// =============================================================================
export async function POST(req: NextRequest) {
  // ============ 1. 로그인 가드 ============
  const session = await getWebSession();
  if (!session) return unauthorized();

  const userId = BigInt(session.sub);

  // ============ 2. 권한 가드 (super_admin OR organization admin/owner 1건+) ============
  if (!isSuperAdmin(session)) {
    const orgMember = await prisma.organization_members.findFirst({
      where: {
        user_id: userId,
        is_active: true,
        role: { in: ["admin", "owner"] },
      },
      select: { id: true },
    });
    if (!orgMember) return forbidden("운영자 권한이 필요합니다.");
  }

  // ============ 3. RATE_LIMITS (Upstash 분당 5건) ============
  const rl = await checkRateLimit(
    `ai-analyze:${userId.toString()}`,
    RATE_LIMITS.aiAnalyze,
  );
  if (!rl.allowed) return rateLimited();

  // ============ 4. DB 일 20건 한도 ============
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dailyCount = await prisma.prospectusAiAnalysis.count({
    where: { userId, createdAt: { gte: dayAgo } },
  });
  if (dailyCount >= DAILY_LIMIT) {
    return apiError(
      "일일 분석 한도 초과 (20건/일)",
      429,
      "DAILY_LIMIT_EXCEEDED",
    );
  }

  // ============ 5. multipart 파싱 ============
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return validationError([
      { field: "body", message: "유효하지 않은 값입니다." },
    ]);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return validationError([
      { field: "file", message: "유효하지 않은 값입니다." },
    ]);
  }

  // ============ 6. 파일 검증 ============
  if (file.size > MAX_FILE_SIZE) {
    return apiError("파일 크기 10MB 초과", 422, "FILE_TOO_LARGE");
  }

  // 1차 검증 = Content-Type 헤더 (브라우저 박제). 본격 검증은 magic bytes.
  if (
    !ALLOWED_MIME.includes(file.type as AllowedMime) &&
    file.type !== "" // 일부 브라우저는 빈 type 가능 — magic bytes 로 결정
  ) {
    return apiError(
      "지원하지 않는 파일 형식 (PDF/PNG/JPEG)",
      422,
      "INVALID_MIME",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 2차 검증 = magic bytes (MIME spoofing 차단)
  const detectedType = await fileTypeFromBuffer(buffer);
  if (!detectedType || !ALLOWED_MIME.includes(detectedType.mime as AllowedMime)) {
    return apiError(
      "파일 내용과 확장자가 일치하지 않습니다",
      422,
      "MIME_MISMATCH",
    );
  }
  const verifiedMime = detectedType.mime as AllowedMime;

  // ============ 7. 분석 입력 빌드 (PDF 텍스트 또는 image base64) ============
  let analyzeInput: AnalyzeProspectusInput;

  if (verifiedMime === "application/pdf") {
    // PDF 케이스 — pdf-parse 로 텍스트 추출
    let textContent: string;
    try {
      // 동적 import — pdf-parse 가 ESM 일 수도 / CommonJS 일 수도 (v2.x ESM 우선)
      const pdfModule = await import("pdf-parse");
      const pdfParse =
        (pdfModule as { default?: (b: Buffer) => Promise<{ text: string }> })
          .default ?? (pdfModule as unknown as (b: Buffer) => Promise<{ text: string }>);
      const pdfData = await pdfParse(buffer);
      textContent = (pdfData.text ?? "").trim();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await insertFailureAudit({
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileMime: verifiedMime,
        sourceType: "pdf",
        errorCode: "pdf_parse_failed",
        errorMessage: msg,
      });
      return apiError("PDF 파싱 실패", 422, "PDF_PARSE_FAILED");
    }

    if (textContent.length < MIN_PDF_TEXT_CHARS) {
      // 스캔본 PDF 추정 — 이미지 업로드 안내
      await insertFailureAudit({
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileMime: verifiedMime,
        sourceType: "pdf",
        errorCode: "pdf_no_text",
        errorMessage: `extracted=${textContent.length}chars`,
      });
      return apiError(
        "PDF 텍스트 추출 실패 (스캔본일 수 있음 — 이미지로 업로드 시도)",
        422,
        "PDF_NO_TEXT",
      );
    }

    // 30k tokens 사전 컷
    if (textContent.length > MAX_PDF_TEXT_CHARS) {
      textContent = textContent.substring(0, MAX_PDF_TEXT_CHARS);
    }

    analyzeInput = {
      source: "pdf",
      textContent,
      fileName: file.name,
    };
  } else {
    // image 케이스 — base64 변환 (vision input)
    const imageBase64 = buffer.toString("base64");
    analyzeInput = {
      source: "image",
      imageBase64,
      mimeType: verifiedMime,
      fileName: file.name,
    };
  }

  // ============ 8. AI 호출 + audit INSERT ============
  try {
    const result = await analyzeProspectus(analyzeInput);

    // audit INSERT (성공)
    const audit = await prisma.prospectusAiAnalysis.create({
      data: {
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileMime: verifiedMime,
        sourceType: analyzeInput.source,
        analysisRaw: result.analysis as unknown as Prisma.InputJsonValue,
        promptVersion: result.promptVersion,
        modelId: result.modelId,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.totalTokens,
        durationMs: result.durationMs,
        status: "completed",
      },
      select: { id: true },
    });

    return apiSuccess({
      analysisId: audit.id.toString(),
      payload: result.analysis,
    });
  } catch (err) {
    // AI 호출 실패 → audit INSERT (failed) + 사용자 노출 메시지 매핑
    const code = err instanceof AIAnalysisError ? err.code : "unknown";
    const message = err instanceof Error ? err.message : String(err);

    await insertFailureAudit({
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileMime: verifiedMime,
      sourceType: analyzeInput.source,
      errorCode: code,
      errorMessage: message,
    });

    if (code === "auth") {
      return apiError("AI 서비스 설정 오류 (운영자 문의)", 503, "AI_AUTH");
    }
    if (code === "timeout") {
      return apiError("분석 시간 초과 (다시 시도)", 504, "AI_TIMEOUT");
    }
    if (code === "rate_limit") {
      return apiError("AI 서비스 요청 한도 초과", 429, "AI_RATE_LIMIT");
    }
    if (code === "schema_validation") {
      return apiError(
        "AI 응답 형식 오류 (다시 시도)",
        502,
        "AI_SCHEMA",
      );
    }
    return apiError("분석 실패", 500, "AI_UNKNOWN");
  }
}

// =============================================================================
// 실패 audit INSERT 헬퍼 — 코드 중복 회피
// =============================================================================
interface FailureAuditInput {
  userId: bigint;
  fileName: string;
  fileSize: number;
  fileMime: string;
  sourceType: "pdf" | "image";
  errorCode: string;
  errorMessage: string;
}

async function insertFailureAudit(input: FailureAuditInput): Promise<void> {
  try {
    await prisma.prospectusAiAnalysis.create({
      data: {
        userId: input.userId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileMime: input.fileMime,
        sourceType: input.sourceType,
        // 실패 케이스 = analysisRaw 빈 객체 (NOT NULL 컬럼 충족)
        analysisRaw: {} as Prisma.InputJsonValue,
        // 실패 시점에선 prompt_version / model_id 가 호출 전이라 default 박제
        promptVersion: "v1",
        modelId: "anthropic/claude-sonnet-4",
        status: "failed",
        errorCode: input.errorCode,
        // errorMessage 길이 가드 (DB TEXT 무제한이지만 audit log 안정성)
        errorMessage: input.errorMessage.substring(0, 1000),
      },
    });
  } catch (auditErr) {
    // audit INSERT 자체 실패 — log만 (메인 응답 흐름 방해 X)
    console.error("[analyze-prospectus] audit INSERT failed:", auditErr);
  }
}
