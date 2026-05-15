/**
 * 2026-05-16 PR-Admin-4 — 종별 단위 매치 generator trigger 버튼.
 *
 * 이유(왜):
 *   - admin-flow-audit-2026-05-16 §6.5 우선 4 = bracket 페이지 종별별 재생성 부재 해소.
 *   - 강남구협회장배 케이스 = 4 종별 × 다른 format. 1 종별만 운영자 수정 → 다른 종별 매치 보존하며 재생성 = 본 버튼만 가능.
 *   - 기존 헤더 "재생성" 버튼은 대회 단위 (전체 매치 wipe + bracket POST) — 본 버튼은 종별 단위 only.
 *
 * 핵심 로직:
 *   - POST /api/web/admin/tournaments/[id]/division-rules/[ruleId]/generate
 *   - body { clear?: boolean } — 본 종별 매치 존재 시 confirm() 후 clear=true 전송
 *   - 응답 (apiSuccess snake_case): { division_code, format, generated, skipped, deleted, reason, match_ids, version_number }
 *   - 결과 모달 = AdvancePlayoffsButton 패턴 재사용 (Card + 결과 표 + success/warning 톤)
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-info) Navy 톤 trigger 버튼 / rounded-[4px] / material-symbols "refresh"
 *   - 모달 = Card 패턴 / var(--color-success) (생성 성공) 또는 var(--color-warning) (skip/stub) 배너
 *   - 모바일 44px+ 터치
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  tournamentId: string;
  ruleId: string;       // division_rule.id (route param 으로 전달)
  divisionCode: string; // 표시용 (모달 헤더 / confirm 다이얼로그)
  divisionFormat: string | null; // 종별 format (지원 여부 안내)
  hasMatches: boolean;  // 본 종별 매치 존재 여부 → confirm 메시지 분기
  onSuccess?: () => void; // bracket page load() refetch trigger
};

// 응답 payload (apiSuccess snake_case 변환 후)
type ResponsePayload = {
  division_code: string;
  format: string;
  generated: number;
  skipped: number;
  deleted: number;
  reason: string;
  match_ids: string[];
  version_number: number;
};

// 본 컴포넌트가 지원하는 format (그 외 = 버튼 미노출 권장 — 호출자 분기)
const SUPPORTED_FORMATS = new Set([
  "league_advancement",
  "group_stage_with_ranking",
  "group_stage_knockout",
]);

export function DivisionGenerateButton({
  tournamentId,
  ruleId,
  divisionCode,
  divisionFormat,
  hasMatches,
  onSuccess,
}: Props) {
  // 호출 중 표시 (중복 클릭 방지)
  const [loading, setLoading] = useState(false);
  // 결과 모달 데이터 (null = 모달 닫힘 / not null = 모달 표시)
  const [result, setResult] = useState<ResponsePayload | null>(null);
  // 네트워크 / 서버 오류 메시지 (null = 정상)
  const [error, setError] = useState<string | null>(null);

  // 종별 단위 generator 미지원 format 은 버튼 자체 비노출
  // 사유: 대회 단위 (single_elim/dual/round_robin/swiss) 는 헤더 "재생성" 버튼으로 처리
  if (!divisionFormat || !SUPPORTED_FORMATS.has(divisionFormat)) {
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 클릭 핸들러 — confirm() → POST → 결과 모달
  // ─────────────────────────────────────────────────────────────
  async function handleClick() {
    // confirm 메시지: 매치 존재 여부에 따라 분기
    // - 매치 존재 → "기존 N건 삭제 후 재생성" 경고 + clear=true
    // - 매치 0건 → "첫 생성" 안내 + clear=false (idempotent)
    const confirmMsg = hasMatches
      ? `[${divisionCode}] 종별의 기존 매치를 삭제하고 재생성합니다.\n\n다른 종별 매치는 그대로 보존됩니다.\n계속하시겠습니까?`
      : `[${divisionCode}] 종별 매치를 자동 생성합니다.\n\n계속하시겠습니까?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules/${ruleId}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // hasMatches 일 때만 clear=true (매치 0건이면 불필요)
          body: JSON.stringify({ clear: hasMatches }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "종별 매치 생성 실패");
        return;
      }
      // apiSuccess 응답 = { success: true, data: { ... } } 구조 (data 안에 snake_case payload)
      const payload: ResponsePayload = json.data ?? json;
      setResult(payload);
    } catch {
      setError("네트워크 오류 — 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 모달 닫기 — 결과 확인 후 호출자 refetch trigger
  // ─────────────────────────────────────────────────────────────
  function handleClose() {
    setResult(null);
    setError(null);
    onSuccess?.();
  }

  // 톤 분기 — generated > 0 = success / generated 0 (skip 또는 stub) = warning
  const isSuccessTone = result != null && result.generated > 0;

  return (
    <>
      {/* trigger 버튼 — 종별 헤더 우측 박제 (BDR Navy 톤 / 작은 사이즈) */}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
        style={{
          backgroundColor: "var(--color-info)",
          color: "#ffffff",
          minHeight: 36, // 종별 헤더 안 inline 배치 — 44px 보다 작게 (헤더 높이 맞춤)
        }}
        title={
          hasMatches
            ? `[${divisionCode}] 기존 매치 삭제 후 재생성 (다른 종별 보존)`
            : `[${divisionCode}] 종별 매치 자동 생성`
        }
      >
        <span className="material-symbols-outlined align-middle text-[16px]" aria-hidden="true">
          refresh
        </span>
        {loading ? "처리 중..." : hasMatches ? "이 종별만 재생성" : "이 종별 생성"}
      </button>

      {/* 에러 모달 — 네트워크/서버 오류 */}
      {error && (
        <ResultModal onClose={() => setError(null)}>
          <Card
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
              borderColor: "var(--color-error)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined flex-shrink-0"
                style={{ color: "var(--color-error)", fontSize: 24 }}
                aria-hidden="true"
              >
                error
              </span>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: "var(--color-error)" }}>
                  종별 매치 생성 실패
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  [{divisionCode}] {error}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded-[4px] px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-primary)",
                  minHeight: 44,
                }}
              >
                닫기
              </button>
            </div>
          </Card>
        </ResultModal>
      )}

      {/* 결과 모달 — 생성/스킵/삭제 카운트 표시 */}
      {result && (
        <ResultModal onClose={handleClose}>
          <Card
            style={{
              backgroundColor: isSuccessTone
                ? "color-mix(in srgb, var(--color-success) 10%, transparent)"
                : "color-mix(in srgb, var(--color-warning) 10%, transparent)",
              borderColor: isSuccessTone ? "var(--color-success)" : "var(--color-warning)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined flex-shrink-0"
                style={{
                  color: isSuccessTone ? "var(--color-success)" : "var(--color-warning)",
                  fontSize: 24,
                }}
                aria-hidden="true"
              >
                {isSuccessTone ? "check_circle" : "warning"}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold"
                  style={{
                    color: isSuccessTone ? "var(--color-success)" : "var(--color-warning)",
                  }}
                >
                  {isSuccessTone
                    ? `[${result.division_code}] 종별 매치 생성 완료`
                    : `[${result.division_code}] 종별 매치 생성 — 스킵됨`}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  생성 {result.generated}건
                  {result.deleted > 0 && ` / 기존 삭제 ${result.deleted}건`}
                  {result.skipped > 0 && ` / 스킵 ${result.skipped}건`}
                  {` / format=${result.format}`}
                </p>
              </div>
            </div>

            {/* reason 표시 (skip/stub 사유 또는 성공 사유) */}
            {result.reason && (
              <div className="mt-3 rounded-[4px] bg-[var(--color-elevated)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  <span className="font-semibold">사유:</span> {result.reason}
                </p>
              </div>
            )}

            {/* 확인 버튼 — onSuccess() 호출 → bracket page load() refetch */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-[4px] px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--color-info)",
                  color: "#ffffff",
                  minHeight: 44,
                }}
              >
                확인
              </button>
            </div>
          </Card>
        </ResultModal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 모달 wrapper — backdrop + 가운데 정렬 (Card 컴포넌트 외 dependency 0)
// AdvancePlayoffsButton 동일 패턴 (공통 wrapper 추출은 사용처 2개라 미진행)
// ─────────────────────────────────────────────────────────────
function ResultModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
