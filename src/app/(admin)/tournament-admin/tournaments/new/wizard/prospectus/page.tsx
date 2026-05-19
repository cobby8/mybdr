"use client";

/**
 * 대회 요강 AI 분석 진입 페이지 (Phase 3 박제 2026-05-20).
 *
 * 흐름:
 *   1) 권한 확인 (admin/organizer/tournament_admin/super_admin)
 *   2) 드롭존 → 파일 선택
 *   3) POST /api/web/tournaments/wizard/analyze-prospectus → 결과
 *   4) ProspectusAnalysisPreview 미리보기 + ⚠️ 검토 토글
 *   5) "이대로 wizard 진입" 버튼 → mapAnalysisToDraft → sessionStorage 박제 → /new/wizard redirect
 *
 * 박제 룰 (시안 13룰):
 * - Material Symbols Outlined / lucide-react ❌
 * - var(--color-*) 토큰만 / pill 9999px ❌
 * - rounded-[4px] 버튼 / 44px 높이
 * - 720px 분기
 *
 * 회귀 영향: 0 (신규 경로 / 기존 wizard 시그니처 변경 0)
 * 참조 보고서: Dev/prospectus-ai-wizard-plan-2026-05-18.md §3 §4
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProspectusAnalysisResult } from "@/lib/ai/prospectus-schema";
import { ProspectusUploadDropzone } from "@/components/tournament/prospectus-upload-dropzone";
import { ProspectusAnalysisPreview } from "@/components/tournament/prospectus-analysis-preview";
import {
  mapAnalysisToDraft,
} from "@/lib/tournaments/prospectus-to-draft";
import { loadDraft, saveDraft } from "@/lib/tournaments/wizard-draft";
import type { WizardDraft } from "@/lib/tournaments/wizard-types";

type AuthStatus = "loading" | "unauthenticated" | "unauthorized" | "authorized";
type AnalyzeStatus = "idle" | "uploading" | "analyzing" | "done" | "failed";

const ALLOWED_ROLES = ["super_admin", "organizer", "admin", "tournament_admin"];

export default function ProspectusAnalyzePage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [status, setStatus] = useState<AnalyzeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProspectusAnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [includeReview, setIncludeReview] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // ============ 인증 체크 ============
  useEffect(() => {
    fetch("/api/web/me")
      .then((res) => {
        if (!res.ok) {
          setAuthStatus("unauthenticated");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const role = (data.role ?? data.data?.role ?? "") as string;
        if (ALLOWED_ROLES.includes(role)) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(
        "/login?redirect=/tournament-admin/tournaments/new/wizard/prospectus",
      );
    }
  }, [authStatus, router]);

  // ============ 파일 업로드 → POST 분석 ============
  async function handleFile(file: File) {
    setFileName(file.name);
    setError(null);
    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatus("analyzing");
      const res = await fetch(
        "/api/web/tournaments/wizard/analyze-prospectus",
        {
          method: "POST",
          body: formData,
        },
      );

      const json = (await res.json()) as
        | { analysis_id: string; payload: ProspectusAnalysisResult }
        | { error: string; code?: string };

      if (!res.ok) {
        const errMsg = "error" in json ? json.error : "분석 실패";
        setError(typeof errMsg === "string" ? errMsg : "분석 실패");
        setStatus("failed");
        return;
      }

      if (!("payload" in json)) {
        setError("응답 형식 오류");
        setStatus("failed");
        return;
      }

      setAnalysis(json.payload);
      setAnalysisId(json.analysis_id);
      setStatus("done");
    } catch {
      setError("네트워크 오류");
      setStatus("failed");
    }
  }

  // ============ "이대로 적용" → sessionStorage + redirect ============
  function handleApply() {
    if (!analysis) return;

    const mapped = mapAnalysisToDraft(analysis, { includeReview });

    // 기존 draft 로드 또는 빈 draft 시작 — 기존 입력 보존
    const existing = loadDraft();
    const merged: WizardDraft = mergeDraft(existing, mapped);

    saveDraft(merged);

    // wizard 진입 (기본 압축 폼 = QuickCreateForm) — 매핑된 title 등이 자동 표시될지는
    // QuickCreateForm 이 draft 의 title 을 useState 초기값으로 받는지 여부에 달림 (Phase 4 보강 가능).
    // 본 PR 은 draft 박제까지만 보장 — wizard 진입 후 사용자가 본인 검토 흐름.
    router.push("/tournament-admin/tournaments/new/wizard");
  }

  // ============ 다시 시도 ============
  function handleReset() {
    setStatus("idle");
    setError(null);
    setAnalysis(null);
    setAnalysisId(null);
    setFileName(null);
  }

  // ============ 권한 / 로딩 분기 ============
  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--color-text-muted)]">로딩 중...</div>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <span
          className="material-symbols-outlined text-5xl text-[var(--color-text-muted)]"
          aria-hidden
        >
          lock
        </span>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          권한이 필요합니다
        </h1>
        <Link href="/tournaments" className="btn btn--primary mt-2">
          대회 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // ============ 메인 UI ============
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link
            href="/tournament-admin/tournaments/new/wizard"
            className="hover:text-[var(--color-text-primary)]"
          >
            대회 만들기
          </Link>
          <span>›</span>
          <span>요강 분석</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
          📄 대회 요강 AI 분석
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          요강 PDF 또는 이미지를 올리면 Claude 가 읽고 wizard 필드를 자동으로 채워줘요.
        </p>
      </header>

      {/* 1. idle = 업로드 대기 */}
      {status === "idle" && (
        <ProspectusUploadDropzone onFile={handleFile} disabled={false} />
      )}

      {/* 2. uploading / analyzing = 스피너 */}
      {(status === "uploading" || status === "analyzing") && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[4px] bg-[var(--color-surface)] p-8 text-center">
          <span
            className="material-symbols-outlined animate-spin text-4xl text-[var(--color-accent)]"
            aria-hidden
          >
            progress_activity
          </span>
          <p className="text-base font-medium text-[var(--color-text-primary)]">
            {status === "uploading"
              ? "파일 업로드 중..."
              : "Claude 가 요강을 읽고 있어요"}
          </p>
          {fileName && (
            <p className="text-xs text-[var(--color-text-muted)]">{fileName}</p>
          )}
          <p className="text-xs text-[var(--color-text-muted)]">
            평균 10~15초 소요
          </p>
        </div>
      )}

      {/* 3. failed = 에러 표시 + 재시도 */}
      {status === "failed" && (
        <div className="space-y-3 rounded-[4px] border border-[var(--color-danger)]/40 bg-[var(--color-surface)] p-4">
          <div className="flex items-start gap-2">
            <span
              className="material-symbols-outlined text-2xl text-[var(--color-danger)]"
              aria-hidden
            >
              error
            </span>
            <div className="flex-1">
              <p className="font-medium text-[var(--color-text-primary)]">
                분석 실패
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {error ?? "알 수 없는 오류"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-[4px] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 4. done = 결과 미리보기 + 적용 버튼 */}
      {status === "done" && analysis && (
        <>
          <ProspectusAnalysisPreview
            analysis={analysis}
            includeReview={includeReview}
            onIncludeReviewChange={setIncludeReview}
          />

          <div className="sticky bottom-0 flex flex-col gap-2 border-t border-[var(--color-border)] bg-[var(--color-background)] py-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-[4px] border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] sm:min-h-[44px]"
            >
              다른 파일 시도
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-[4px] bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 sm:min-h-[44px]"
            >
              이대로 wizard 진입
            </button>
          </div>

          {analysisId && (
            <p className="text-center text-xs text-[var(--color-text-muted)]">
              분석 ID: {analysisId}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// 헬퍼 — mapped 결과를 기존 draft 에 머지
// =============================================================================
/**
 * mapAnalysisToDraft 출력 (Partial) → 기존 WizardDraft 머지.
 * 기존 draft 가 없으면 빈 baseline 으로 시작.
 * AI 통과 필드만 덮어쓰기 — 사용자 기존 입력 보존.
 */
function mergeDraft(
  existing: WizardDraft | null,
  mapped: ReturnType<typeof mapAnalysisToDraft>,
): WizardDraft {
  const baseline: WizardDraft = existing ?? {
    step: 0,
    organization_id: null,
    organization_just_created: false,
    series_id: null,
    series_just_created: false,
    copy_from_last_edition: false,
    edition_number: null,
    tournament_payload: {
      title: "",
      description: null,
      format: null,
      schedule: {
        startDate: "",
        endDate: "",
        registrationStartAt: "",
        registrationEndAt: "",
        venueName: "",
        venueAddress: "",
        city: "",
        places: [],
      },
      registration: {
        categories: {},
        divCaps: {},
        divFees: {},
        allowWaitingList: false,
        waitingListCap: "",
        entryFee: "",
        bankName: "",
        bankAccount: "",
        bankHolder: "",
        feeNotes: "",
      },
      team: {
        maxTeams: "",
        teamSize: "",
        rosterMin: "",
        rosterMax: "",
        autoApproveTeams: false,
        autoCalcMaxTeams: false,
      },
      bracket: {} as WizardDraft["tournament_payload"]["bracket"],
    },
    division_rules: [],
  };

  // meta → tournament_payload
  if (mapped.meta.title) baseline.tournament_payload.title = mapped.meta.title;
  if (mapped.meta.description !== undefined)
    baseline.tournament_payload.description = mapped.meta.description;
  if (mapped.meta.format !== undefined)
    baseline.tournament_payload.format = mapped.meta.format;

  // schedule 머지
  if (mapped.schedule) {
    baseline.tournament_payload.schedule = {
      ...baseline.tournament_payload.schedule,
      ...mapped.schedule,
    };
  }

  // team 머지
  if (mapped.team) {
    baseline.tournament_payload.team = {
      ...baseline.tournament_payload.team,
      ...mapped.team,
    };
  }

  // registration 머지
  if (mapped.registration) {
    baseline.tournament_payload.registration = {
      ...baseline.tournament_payload.registration,
      ...mapped.registration,
    };
  }

  return baseline;
}
